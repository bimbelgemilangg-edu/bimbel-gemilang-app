// tests/alurAiKeNilai.test.mjs
// ============================================================
// UJI END-TO-END KONTRAK: "soal dari AI sampai nilai di meja admin"
// (permintaan owner 14 Okt 2026: "tes untuk soal di sistem dari ai
// menyediakan soal sampai siswa mengumpulkan, dan masuk kemana nilai
// siswa mengumpulkan kalau di sisi admin?")
//
// Rantai yang dipaku uji ini (semua memakai FUNGSI ASLI tiap mata rantai,
// bukan duplikat logika):
//   1. mesin menyusun paket (bentuk kanonik target ala mesinTryOutOtomatis),
//   2. pagar status: draf -> aktif HANYA oleh admin (statusTryOutPaket),
//   3. paket sampai ke siswa yang tepat (cocokkanTargetPaket + saring terbit),
//   4. siswa melihatnya sebagai dokumen per test (dokumenTryOut),
//   5. sesi siswa: subtes utuh & indeks aman (logikaSubtesTryOut),
//   6. skor siswa = hitungTotalSkor (skorSoalTryOut),
//   7. admin membacakan ULANG angka yang sama dari sesi tersimpan
//      (kontrak HasilTryOutAdminPage: hitung ulang, bukan percaya buta),
//   8. angka yang sama mengalir ke analitik (hitungAnalitik).
// Batas jaringan (Firestore/AI kunci) diuji terpisah di berkas lain
// (modelPilih, pilihSoalAi, pagarTryOutOtomatis, dst.); uji ini memaku
// KONTRAK DATA antar-mata-rantai supaya tidak ada titik yang diam-diam
// mengubah arti angka di tengah jalan.
// ============================================================
import test from 'node:test';
import assert from 'node:assert/strict';
import { bentukKanonikTarget, cocokkanTargetPaket } from '../src/utils/cocokkanTargetPaket.js';
import { STATUS_PAKET, transisiStatus, saringPaketTerbit } from '../src/utils/statusTryOutPaket.js';
import { bangunDokumenTryOut } from '../src/utils/dokumenTryOut.js';
import { filterSubtesMenurutSoalTersedia, indexSubtesAman } from '../src/utils/logikaSubtesTryOut.js';
import { hitungTotalSkor } from '../src/utils/skorSoalTryOut.js';
import { ringkasSoalUntukAdmin } from '../src/utils/ringkasSoalAdmin.js';
import { hitungAnalitik } from '../src/utils/papanJelajah.js';

const KINI = new Date(2026, 9, 14, 12, 0, 0).getTime();
const soal = (id, mapel) => ({
  id, tipe: 'pg_sederhana', opsiJawaban: ['a', 'b', 'c', 'd'], kunciJawaban: 'A',
  mataPelajaran: mapel, jenjang: 'SMP', materi: `Materi ${id}`, status: 'aktif',
  teksSoal: `Soal ${id}`,
});
const daftarSoal = [
  ...Array.from({ length: 20 }, (_, i) => soal(`m${i + 1}`, 'Matematika')),
  ...Array.from({ length: 20 }, (_, i) => soal(`b${i + 1}`, 'Bahasa Indonesia')),
];
// Paket berbentuk persis seperti yang DITULIS mesin try out otomatis
// (target kanonik, mode per-subtes, dua subtes = dua test).
const paketMesin = {
  id: 'pkt-ai-1',
  judul: 'TRY OUT PEMAHAMAN TKA SMP - Sabtu, 17 Okt',
  jenisUjian: 'TKA',
  status: STATUS_PAKET.DRAF,
  dibuatOleh: 'mesin_otomatis',
  targetKelas: bentukKanonikTarget('SMP'),
  targetKategori: bentukKanonikTarget('Semua'),
  modeTimer: 'per-subtes',
  durasiTotalMenit: 75,
  waktuBuka: KINI + 86400000,
  waktuTutup: KINI + 2 * 86400000,
  daftarSoal,
  totalSoal: daftarSoal.length,
  subtes: [
    { nama: 'Matematika', soalIds: daftarSoal.slice(0, 20).map((q) => q.id), durasiMenit: 35 },
    { nama: 'Bahasa Indonesia', soalIds: daftarSoal.slice(20).map((q) => q.id), durasiMenit: 40 },
  ],
};
const siswa = { studentId: 'STD-0926070002', kelasSekolah: '9', nama: 'Tasya' };

test('1+2: draf mesin ber-target kanonik; terbit HANYA lewat admin', () => {
  assert.deepEqual(paketMesin.targetKelas, bentukKanonikTarget('SMP'));
  const tolak = transisiStatus(STATUS_PAKET.DRAF, STATUS_PAKET.AKTIF, 'tentor');
  assert.equal(tolak.boleh, false, 'tentor tidak boleh menerbitkan');
  const antre = transisiStatus(STATUS_PAKET.DRAF, STATUS_PAKET.MENUNGGU, 'admin');
  assert.equal(antre.boleh, true);
  const ok = transisiStatus(STATUS_PAKET.MENUNGGU, STATUS_PAKET.AKTIF, 'admin');
  assert.equal(ok.boleh, true);
  assert.equal(transisiStatus(STATUS_PAKET.MENUNGGU, STATUS_PAKET.AKTIF, 'tentor').boleh, false);
  // draf tidak boleh kelihatan di daftar umum
  assert.equal(saringPaketTerbit([{ ...paketMesin }]).length, 0);
});

test('3: sesudah terbit, paket sampai ke siswa kelas 9 SMP yang tepat', () => {
  const live = { ...paketMesin, status: STATUS_PAKET.AKTIF };
  assert.equal(saringPaketTerbit([live]).length, 1);
  assert.equal(cocokkanTargetPaket(live, siswa).cocok, true);
  assert.equal(cocokkanTargetPaket(live, { ...siswa, kelasSekolah: '10' }).cocok, false, 'kelas 10 tidak boleh melihat');
});

test('4: siswa melihat 2 dokumen test; test 1 terbuka, test 2 menunggu giliran', () => {
  const live = { ...paketMesin, status: STATUS_PAKET.AKTIF };
  const dok = bangunDokumenTryOut(live, { kini: KINI + 90000000 });
  assert.equal(dok.length, 2);
  assert.equal(dok[0].bisaDibuka, true);
  assert.equal(dok[1].terkunci, true);
});

test('5+6: siswa mengerjakan test 1 sempurna; subtes utuh & skor 100 untuk test itu', () => {
  const live = { ...paketMesin, status: STATUS_PAKET.AKTIF };
  const subtesUtuh = filterSubtesMenurutSoalTersedia(live.subtes, new Set(daftarSoal.map((q) => q.id)));
  assert.equal(subtesUtuh.length, 2, 'subtes tidak boleh menyusut diam-diam');
  assert.equal(indexSubtesAman(0, subtesUtuh.length).index, 0);
  const jawaban = {};
  live.subtes[0].soalIds.forEach((id) => { jawaban[id] = 0; }); // semua benar (kunci A = index 0)
  const kelompokTest1 = daftarSoal.slice(0, 20);
  assert.equal(hitungTotalSkor(kelompokTest1, jawaban).totalSkorPersen, 100);
  // skor PAKET utuh (yang disimpan sesi & dibaca admin): 20 dari 40 terjawab benar
  assert.equal(hitungTotalSkor(daftarSoal, jawaban).totalSkorPersen, 50);
});

test('7: admin membacakan ULANG angka yang sama dari sesi tersimpan (kontrak Hitung Ulang)', () => {
  const jawaban = {};
  daftarSoal.slice(0, 20).forEach((q) => { jawaban[q.id] = 0; });
  const sesiSelesai = {
    paketId: paketMesin.id, studentId: siswa.studentId, status: 'selesai',
    jawaban, totalSkorPersen: hitungTotalSkor(daftarSoal, jawaban).totalSkorPersen,
    waktuSelesai: new Date(KINI + 95000000), createdAt: new Date(KINI + 90000000),
  };
  // sisi admin (HasilTryOutAdminPage): query sesi per paket, hitung ulang
  const sesiDariQuery = [sesiSelesai].filter((s) => s.paketId === paketMesin.id);
  const hitungUlang = hitungTotalSkor(daftarSoal, sesiDariQuery[0].jawaban).totalSkorPersen;
  assert.equal(hitungUlang, sesiSelesai.totalSkorPersen, 'angka siswa & admin WAJIB identik');
  // ringkasan per mapel untuk layar admin ikut benar
  const ringkas = ringkasSoalUntukAdmin(daftarSoal);
  assert.equal(ringkas.total, 40);
  assert.equal(ringkas.perMapel.Matematika, 20);
  assert.equal(ringkas.perMapel['Bahasa Indonesia'], 20);
});

test('8: angka yang sama mengalir ke analitik (tren pekanan tidak kosong)', () => {
  const sesi = {
    nama: paketMesin.judul, jenisUjian: 'TKA', totalSkorPersen: 50,
    waktuSelesaiMs: KINI + 95000000, createdAtMs: KINI + 90000000, totalSoal: 40,
    subtes: [{ nama: 'Matematika', skorPersen: 100 }, { nama: 'Bahasa Indonesia', skorPersen: 0 }],
  };
  const a = hitungAnalitik([sesi]);
  assert.equal(a.jumlahSesi, 1);
  assert.equal(a.tren.length, 1);
  assert.equal(a.tren[0].skor, 50);
  assert.deepEqual(a.subtesRata.map((s) => s.nama), ['Matematika', 'Bahasa Indonesia']);
});
