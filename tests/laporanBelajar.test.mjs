// tests/laporanBelajar.test.mjs — logika pengisian capaian guru (Laporan Belajar)
// Janji yang dipatok (keputusan owner 31 Okt 2026):
//   1. MURNI & deterministik — tanpa Firestore
//   2. TIDAK PERNAH menghasilkan keterangan 'tidak valid/belum cukup/belum lengkap'
//      kecuali fakta siswa benar-benar tidak mengikuti (lewat keteranganTidakIkut)
//   3. Siswa yang tampil ke guru = yang TERDAFTAR di mapel guru itu DAN aktif;
//      siswa diblokir/habis masa/nonaktif tidak pernah muncul
//   4. Status kosong/draft/selesai benar; tugas guru hilang bila semua selesai
//   5. Narasi capaian selalu kalimat positif & lengkap (sumber primer PDF)
//     node tests/laporanBelajar.test.mjs
import assert from 'node:assert/strict';
import {
  PREDIKAT_CAPAIAN, URUTAN_PREDIKAT, DIMENSI_LAPORAN, DIMENSI_KEYS_LAPORAN,
  predikatLabel, predikatWarna, predikatDariAngka,
  dimensiLaporan, deskriptorUntuk, teksDeskriptor,
  capaianKosong, dimensiTerisi, jumlahDimensiTerisi,
  statusPengisianSiswa, progresPengisian,
  mapelDiampuGuru, siswaTerdaftarMapelGuru, siswaAktif, filterSiswaUntukGuru,
  ringkasBahanOtomatis, keteranganTidakIkut,
  kalimatDimensi, narasiCapaianSiswa,
  kunciDokLaporan, bentukDokumenLaporan,
  pengisianDibuka, tombolSakelarLaporan, bentukSakelarLaporan,
} from '../src/utils/laporanBelajar.js';

let lulus = 0, gagal = 0;
function uji(n, f) {
  try { f(); lulus++; console.log(`  ✓ ${n}`); }
  catch (e) { gagal++; console.log(`  ✗ ${n}\n      ${String(e.message).slice(0, 300)}`); }
}
console.log('laporanBelajar — pengisian capaian guru (sumber primer laporan ortu)');

// ---------------- predikat & dimensi ----------------
uji('predikat: skala A/B/C/D lengkap, label ramah (bukan vonis)', () => {
  assert.equal(PREDIKAT_CAPAIAN.length, 4);
  assert.equal(predikatLabel('A'), 'Sangat Baik');
  assert.equal(predikatLabel('b'), 'Baik'); // tak peka huruf besar
  assert.equal(predikatLabel('D'), 'Perlu Pendampingan');
  assert.equal(predikatLabel('Z'), '');
  assert.ok(predikatWarna('A').startsWith('#'));
  assert.deepEqual(URUTAN_PREDIKAT, ['A', 'B', 'C', 'D']);
});
uji('predikatDariAngka mengikuti rentang Kurikulum Merdeka', () => {
  assert.equal(predikatDariAngka(95), 'A');
  assert.equal(predikatDariAngka(85), 'B');
  assert.equal(predikatDariAngka(72), 'C');
  assert.equal(predikatDariAngka(50), 'D');
  assert.equal(predikatDariAngka(null), '');
});
uji('dimensi: pemahaman & keaktifan ada; deskriptor keaktifan memuat "aktif bertanya" & "menyanggah"', () => {
  assert.ok(DIMENSI_KEYS_LAPORAN.includes('pemahaman'));
  assert.ok(DIMENSI_KEYS_LAPORAN.includes('keaktifan'));
  const teksKeaktifan = deskriptorUntuk('keaktifan').map((d) => d.teks.toLowerCase());
  assert.ok(teksKeaktifan.some((t) => t.includes('aktif bertanya')));
  assert.ok(teksKeaktifan.some((t) => t.includes('menyanggah')));
  assert.equal(dimensiLaporan('tidak-ada'), null);
  assert.equal(teksDeskriptor('keaktifan', 'menyanggah').length > 0, true);
});
uji('setiap deskriptor bernada positif/dorongan — tak ada yang menghakimi', () => {
  for (const d of DIMENSI_LAPORAN) {
    for (const x of d.deskriptor) {
      assert.ok(['positif', 'dorongan'].includes(x.nada), `${d.key}/${x.id} nada tak dikenal`);
      const t = x.teks.toLowerCase();
      for (const dilarang of ['tidak valid', 'belum cukup', 'belum lengkap', 'gagal', 'bodoh', 'malas']) {
        assert.ok(!t.includes(dilarang), `deskriptor ${d.key}/${x.id} memuat "${dilarang}"`);
      }
    }
  }
});

// ---------------- status pengisian ----------------
uji('statusPengisianSiswa: kosong / draft / selesai', () => {
  assert.equal(statusPengisianSiswa(null), 'kosong');
  assert.equal(statusPengisianSiswa({}), 'kosong');
  const kosong = capaianKosong();
  assert.equal(statusPengisianSiswa({ capaian: kosong }), 'kosong');
  const sebagian = { ...kosong, pemahaman: { predikat: 'A', deskriptor: [] } };
  assert.equal(statusPengisianSiswa({ capaian: sebagian }), 'draft');
  // teks saja (tanpa predikat) = draft
  assert.equal(statusPengisianSiswa({ capaian: kosong, catatanGuru: 'rajin' }), 'draft');
  const lengkap = Object.fromEntries(DIMENSI_KEYS_LAPORAN.map((k) => [k, { predikat: 'B', deskriptor: [] }]));
  assert.equal(statusPengisianSiswa({ capaian: lengkap }), 'selesai');
});
uji('dimensiTerisi & jumlahDimensiTerisi', () => {
  const c = capaianKosong();
  assert.equal(jumlahDimensiTerisi(c), 0);
  c.keaktifan = { predikat: 'A', deskriptor: ['aktif-bertanya'] };
  assert.equal(dimensiTerisi(c, 'keaktifan'), true);
  assert.equal(dimensiTerisi(c, 'sikap'), false);
  assert.equal(jumlahDimensiTerisi(c), 1);
});
uji('progresPengisian: semuaSelesai hanya bila ADA siswa & semua selesai', () => {
  const daftar = [{ id: 'a' }, { id: 'b' }];
  const selesaiDok = { capaian: Object.fromEntries(DIMENSI_KEYS_LAPORAN.map((k) => [k, { predikat: 'A', deskriptor: [] }])) };
  const p0 = progresPengisian(daftar, {});
  assert.equal(p0.total, 2);
  assert.equal(p0.selesai, 0);
  assert.equal(p0.semuaSelesai, false);
  const p1 = progresPengisian(daftar, { a: selesaiDok });
  assert.equal(p1.selesai, 1);
  assert.equal(p1.semuaSelesai, false);
  const p2 = progresPengisian(daftar, { a: selesaiDok, b: selesaiDok });
  assert.equal(p2.selesai, 2);
  assert.equal(p2.persenSelesai, 100);
  assert.equal(p2.semuaSelesai, true);
  // daftar kosong → tidak dianggap selesai (tugas tak hilang prematur)
  assert.equal(progresPengisian([], {}).semuaSelesai, false);
});

// ---------------- mapel guru & filter siswa ----------------
uji('mapelDiampuGuru: mapelDetails (array) + field lama (string koma)', () => {
  const g1 = { mapelDetails: [{ kodeMapel: 'MAPEL-001', namaMapel: 'Matematika' }, { kodeMapel: 'MAPEL-002', namaMapel: 'IPA' }] };
  assert.equal(mapelDiampuGuru(g1).length, 2);
  const g2 = { mapel: 'Matematika, IPA', kodeMapel: 'MAPEL-001, MAPEL-002' };
  const m2 = mapelDiampuGuru(g2);
  assert.equal(m2.length, 2);
  assert.equal(m2[0].namaMapel, 'Matematika');
  // duplikat dihilangkan
  const g3 = { mapelDetails: [{ kodeMapel: 'X', namaMapel: 'X' }], kodeMapel: 'X', mapel: 'X' };
  assert.equal(mapelDiampuGuru(g3).length, 1);
});
uji('siswaTerdaftarMapelGuru: hanya yang enrolledSubjects-nya cocok; "semua" lolos', () => {
  const guru = { kodeMapel: 'MAPEL-001', mapel: 'Matematika' };
  assert.equal(siswaTerdaftarMapelGuru({ enrolledSubjects: ['MAPEL-001'] }, guru), true);
  assert.equal(siswaTerdaftarMapelGuru({ enrolledSubjects: ['mapel-001'] }, guru), true); // tak peka kapital
  assert.equal(siswaTerdaftarMapelGuru({ enrolledSubjects: ['MAPEL-999'] }, guru), false);
  assert.equal(siswaTerdaftarMapelGuru({ enrolledSubjects: ['semua'] }, guru), true);
  assert.equal(siswaTerdaftarMapelGuru({}, guru), false);
  // guru tanpa mapel jelas → jangan bocorkan semua siswa
  assert.equal(siswaTerdaftarMapelGuru({ enrolledSubjects: ['MAPEL-001'] }, {}), false);
});
uji('siswaAktif: blokir / nonaktif / habis masa → tidak aktif', () => {
  const now = Date.UTC(2026, 9, 31, 12, 0);
  assert.equal(siswaAktif({ id: 'a' }, now), true);
  assert.equal(siswaAktif({ id: 'a', status: 'Aktif' }, now), true);
  assert.equal(siswaAktif({ id: 'a', isBlocked: true }, now), false);
  assert.equal(siswaAktif({ id: 'a', status: 'Nonaktif' }, now), false);
  assert.equal(siswaAktif({ id: 'a', tanggalSelesai: '2026-08-01' }, now), false);
  assert.equal(siswaAktif({ id: 'a', tanggalSelesai: '2026-10-31' }, now), true); // hari terakhir masih aktif
});
uji('filterSiswaUntukGuru: hanya siswa mapel guru + aktif (jawab keluhan "siswa kosong")', () => {
  const guru = { kodeMapel: 'MTK', mapel: 'Matematika' };
  const now = Date.UTC(2026, 9, 31, 12, 0);
  const daftar = [
    { id: '1', nama: 'Andi', enrolledSubjects: ['MTK'] },
    { id: '2', nama: 'Budi', enrolledSubjects: ['IPA'] },              // mapel lain → tak muncul
    { id: '3', nama: 'Cici', enrolledSubjects: ['MTK'], isBlocked: true }, // blokir → tak muncul
    { id: '4', nama: 'Dodi', enrolledSubjects: ['MTK'], tanggalSelesai: '2026-01-01' }, // habis → tak muncul
    { id: '5', nama: 'Eka', enrolledSubjects: ['semua'] },            // semua → muncul
  ];
  const hasil = filterSiswaUntukGuru(daftar, guru, { sekarangMs: now });
  const ids = hasil.map((s) => s.id);
  assert.deepEqual(ids, ['1', '5']); // hanya Andi & Eka
  // tanpa hanyaAktif → siswa nonaktif ikut (untuk keperluan admin/audit)
  const semua = filterSiswaUntukGuru(daftar, guru, { sekarangMs: now, hanyaAktif: false });
  assert.equal(semua.length, 4);
});

// ---------------- bahan otomatis ----------------
uji('ringkasBahanOtomatis: kuis/tryout/kehadiran/latihan jadi kalimat faktual', () => {
  const hasil = {
    proses: { detail_proses: { kehadiran: { persenHadir: 92, hadir: 11, total: 12 }, latihan: { hariAktif: 4, soalDikerjakan: 40 }, integritas: { jumlahPelanggaran: 0 } } },
    akademik: { perMapel: [{ mapel: 'Matematika', detail_komponen: { kuis: { total: 85, jumlah: 3 }, ujian: { total: 78, jumlah: 1 } } }] },
  };
  const r = ringkasBahanOtomatis(hasil);
  assert.equal(r.kuisAda, true);
  assert.equal(r.tryoutAda, true);
  const teks = r.ringkasan.join(' ').toLowerCase();
  assert.ok(teks.includes('kehadiran 92%'));
  assert.ok(teks.includes('kuis matematika'));
  assert.ok(teks.includes('try out/ujian matematika'));
  assert.ok(!teks.includes('tidak valid'));
});
uji('keteranganTidakIkut: netral, tanpa kata "tidak valid"', () => {
  assert.equal(keteranganTidakIkut('kuis'), 'tidak mengikuti kuis pada periode ini');
  assert.ok(!keteranganTidakIkut('kuis').includes('tidak valid'));
  assert.ok(keteranganTidakIkut('entah').includes('tidak mengikuti asesmen'));
});

// ---------------- narasi capaian ----------------
uji('kalimatDimensi: predikat + deskriptor jadi kalimat positif', () => {
  const k = kalimatDimensi('keaktifan', { predikat: 'A', deskriptor: ['aktif-bertanya', 'menyanggah'] });
  assert.ok(k.startsWith('Keaktifan & Partisipasi: Sangat Baik'));
  assert.ok(k.includes('aktif bertanya'));
  assert.ok(k.includes('menyanggah'));
  assert.equal(kalimatDimensi('keaktifan', { predikat: '', deskriptor: [] }), '');
});
uji('narasiCapaianSiswa: utuh, positif, sebut bahan otomatis + pengayaan', () => {
  const dok = {
    capaian: {
      pemahaman: { predikat: 'A', deskriptor: ['menguasai'] },
      keaktifan: { predikat: 'B', deskriptor: ['aktif-bertanya'] },
      sikap: { predikat: 'A', deskriptor: ['disiplin'] },
      perkembangan: { predikat: 'B', deskriptor: ['menanjak'] },
    },
    catatanGuru: 'Ananda senang membantu teman.',
    pengayaan: 'lanjut ke soal HOTS',
  };
  const bahan = { ringkasan: ['kehadiran 95%', 'kuis Matematika: rata-rata 88 (3×)'] };
  const n = narasiCapaianSiswa(dok, { bahanOtomatis: bahan });
  assert.ok(n.includes('Pemahaman Materi: Sangat Baik'));
  assert.ok(n.includes('Catatan tentor:'));
  assert.ok(n.includes('Bahan otomatis sistem Gemilang:'));
  assert.ok(n.includes('Rencana pengayaan'));
  for (const dilarang of ['tidak valid', 'belum cukup', 'belum lengkap', 'data belum']) {
    assert.ok(!n.toLowerCase().includes(dilarang), `narasi memuat "${dilarang}"`);
  }
});
uji('narasiCapaianSiswa: predikat D tetap membangun (bukan vonis)', () => {
  const dok = { capaian: { keaktifan: { predikat: 'D', deskriptor: ['perlu-dorongan-aktif'] } } };
  const n = narasiCapaianSiswa(dok);
  assert.ok(n.includes('Perlu Pendampingan'));
  assert.ok(n.includes('perlu dorongan'));
  assert.ok(!n.toLowerCase().includes('tidak valid'));
});
uji('narasiCapaianSiswa: dokumen kosong → string kosong (tidak mengarang)', () => {
  assert.equal(narasiCapaianSiswa({}), '');
  assert.equal(narasiCapaianSiswa(null), '');
});

// ---------------- bentuk dokumen & sakelar ----------------
uji('kunciDokLaporan deterministik & aman karakter', () => {
  assert.equal(kunciDokLaporan('2026-08..2026-10', 'S1', 'MTK'), '2026-08..2026-10__S1__MTK');
  assert.ok(!kunciDokLaporan('a/b', 'c\\d', 'e').includes('/'));
});
uji('bentukDokumenLaporan: normalisasi predikat + status otomatis', () => {
  const dok = bentukDokumenLaporan({
    periode: '2026-10', studentId: 'S1', studentName: 'Andi', kodeMapel: 'MTK', namaMapel: 'Matematika',
    teacherId: 'T1', capaian: { pemahaman: { predikat: 'a', deskriptor: ['menguasai'] } },
  });
  assert.equal(dok.capaian.pemahaman.predikat, 'A'); // huruf besar
  assert.equal(dok.status, 'draft'); // baru 1 dimensi
  const lengkap = bentukDokumenLaporan({
    periode: '2026-10', studentId: 'S1', kodeMapel: 'MTK',
    capaian: Object.fromEntries(DIMENSI_KEYS_LAPORAN.map((k) => [k, { predikat: 'B', deskriptor: [] }])),
  });
  assert.equal(lengkap.status, 'selesai');
  // predikat tak sah dibuang
  const buruk = bentukDokumenLaporan({ periode: 'p', studentId: 's', kodeMapel: 'k', capaian: { sikap: { predikat: 'Z' } } });
  assert.equal(buruk.capaian.sikap.predikat, '');
});
uji('pengisianDibuka: default menolak; hanya dibuka=true + periode yang menyalakan', () => {
  assert.equal(pengisianDibuka(null).dibuka, false);
  assert.equal(pengisianDibuka({}).dibuka, false);
  assert.equal(pengisianDibuka({ dibuka: true }).dibuka, false); // tanpa periode
  assert.equal(pengisianDibuka({ dibuka: false, periode: '2026-10' }).dibuka, false);
  const on = pengisianDibuka({ dibuka: true, periode: '2026-10', periodeLabel: 'Oktober 2026' });
  assert.equal(on.dibuka, true);
  assert.equal(on.periode, '2026-10');
});
uji('tombolSakelarLaporan: null-safe saat settings belum ada (regresi crash /admin/raport)', () => {
  // Dokumen settings/global_config belum ada → cfg null. Halaman admin harus
  // tetap render (tombol Buka), BUKAN TypeError "reading 'periode'".
  assert.equal(tombolSakelarLaporan(null, '2026-10'), 'buka');
  assert.equal(tombolSakelarLaporan(undefined, '2026-10'), 'buka');
  assert.equal(tombolSakelarLaporan({}, '2026-10'), 'buka');
  assert.equal(tombolSakelarLaporan({ dibuka: false, periode: '2026-10' }, '2026-10'), 'buka');
  // Periode dibuka tetapi berbeda dari pilihan → tetap tombol Buka (pindah periode).
  assert.equal(tombolSakelarLaporan({ dibuka: true, periode: '2026-09' }, '2026-10'), 'buka');
  // Periode dibuka sama dengan pilihan → tombol Tutup.
  assert.equal(tombolSakelarLaporan({ dibuka: true, periode: '2026-10' }, '2026-10'), 'tutup');
});
uji('bentukSakelarLaporan: bentuk dokumen konsisten', () => {
  const p = bentukSakelarLaporan({ dibuka: true, periode: '2026-10', periodeLabel: 'Oktober', dibukaOleh: 'owner' });
  assert.equal(p.dibuka, true);
  assert.equal(p.periode, '2026-10');
  assert.equal(p.dibukaOleh, 'owner');
});

console.log(`\n${gagal === 0 ? '✅' : '❌'} laporanBelajar: ${lulus} lulus, ${gagal} gagal`);
process.exit(gagal === 0 ? 0 : 1);
