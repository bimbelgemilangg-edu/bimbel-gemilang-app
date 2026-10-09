// tests/paketSoal.test.mjs
// ============================================================
// Uji: MESIN PAKET SOAL SISWA (src/utils/paketSoal.js)
//
//     node tests/paketSoal.test.mjs
//
// Invarian yang dikunci di sini (semua berasal dari arahan owner
// 2026-10-09 + spec PAKET SOAL):
//   1. naskah siswa BEBAS KUNCI dalam dialek apa pun (kunciJawaban,
//      kunci/jawaban per baris benar-salah, jawabanEkuivalen,
//      pembahasan, bendera `benar` di opsi, glif ☑/☐);
//   2. nomor paket urut per bab, kode pendek tanpa huruf membingungkan;
//   3. paket terbit tidak bisa diedit isinya — perubahan = versi baru,
//      induk tidak pernah disentuh;
//   4. terbit tanpa sasaran DITOLAK dengan alasan yang jelas;
//   5. "selesai" hanya sah dari tentor — klaim siswa selalu dilabeli
//      menunggu pemeriksaan;
//   6. catatan progres rentang nomor bolak-balik ("1-15, 18" ⇄ angka);
//   7. perubahan bank soal dideteksi sebagai FAKTA, bukan tindakan.
// ============================================================
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  STATUS_PAKET_SOAL,
  ALFABET_KODE_PAKET,
  transisiStatusPaketSoal,
  bolehEditIsiPaket,
  paketSudahTerbit,
  buatKodePaket,
  kodePaketSah,
  kunciBabPaket,
  nomorPaketBerikutnya,
  usulanJudulPaket,
  labelPaketSingkat,
  bersihSoalUntukSiswa,
  daftarSoalUntukSiswa,
  soalSiswaBebasKunci,
  jejakKunciDiSoalSiswa,
  putusanTerbitkanPaket,
  payloadDrafPaket,
  bangunNaskahSiswa,
  payloadTerbitDariDraf,
  payloadVersiBaru,
  paketBolehDilihatSiswa,
  periksaSelarasMateri,
  statusPeriksaSiswa,
  uraiRentangNomor,
  formatRentangNomor,
  catatanProgresJujur,
} from '../src/utils/paketSoal.js';

// Butir contoh: bentuk persis kontrak bank (12 field) + dialek warisan
// yang masih mungkin menempel di dokumen lama.
const BUTIR_PG = {
  id: 'butirPg01',
  status: 'aktif',
  tipe: 'pg_sederhana',
  teksSoal: 'Ibu kota Indonesia adalah...',
  opsiJawaban: [
    { teks: '☑ Jakarta', gambar: [], tabel: [] },
    { teks: '☐ Bandung', gambar: [], tabel: [], benar: true },
  ],
  kunciJawaban: 'A',
  pembahasan: 'Jakarta ditetapkan sejak 1961.',
  pembahasanAsal: 'tercetak',
  identitas: { jenjang: 'SMP', mapel: 'IPS', materi: 'Bab 1', kelas: '8' },
  gambarUrls: [],
  sumberSoalId: 'src1',
  // dialek warisan yang harus ikut terhapus:
  kunci: 'A',
  jawabanBenar: 0,
  jawabanEkuivalen: ['DKI Jakarta'],
};

const BUTIR_BS = {
  id: 'butirBs01',
  status: 'aktif',
  tipe: 'benar_salah',
  teksSoal: 'Tentukan benar atau salah.',
  pernyataan: [
    { teks: 'Gradien garis y = -2x + 5 adalah 2.', jawaban: 'Salah' },
    { teks: '2 + 2 = 4.', kunci: 'Benar', value: 'Benar' },
  ],
  kunciJawaban: '',
  pembahasan: '',
  identitas: { jenjang: 'SMA', mapel: 'Matematika', materi: 'Bab 2', kelas: '11' },
};

// ------------------------------------------------------------
test('status: transisi sah & terlarang sesuai spec G', () => {
  assert.ok(transisiStatusPaketSoal('draf', 'siap'));
  assert.ok(transisiStatusPaketSoal('siap', 'terbit'));
  assert.ok(transisiStatusPaketSoal('siap', 'draf'), 'kembali untuk mengedit');
  assert.ok(transisiStatusPaketSoal('terbit', 'ditutup'));
  assert.ok(transisiStatusPaketSoal('draf', 'ditutup'), 'draf batal bisa diarsipkan');
  assert.ok(!transisiStatusPaketSoal('draf', 'terbit'), 'HARAM: draf langsung terbit tanpa siap');
  assert.ok(!transisiStatusPaketSoal('terbit', 'siap'), 'paket terbit tidak bisa ditarik jadi siap');
  assert.ok(!transisiStatusPaketSoal('ditutup', 'terbit'), 'arsip final — lanjutkan lewat versi baru');
  assert.ok(!transisiStatusPaketSoal('terbit', 'terbit'), 'bukan transisi');
});

test('status: hanya terbit yang boleh dilihat siswa; isi terkunci setelah terbit', () => {
  assert.ok(paketSudahTerbit(STATUS_PAKET_SOAL.TERBIT));
  for (const s of ['draf', 'siap', 'ditutup', '', null]) assert.ok(!paketSudahTerbit(s), s);
  assert.ok(bolehEditIsiPaket('draf') && bolehEditIsiPaket('siap'));
  assert.ok(!bolehEditIsiPaket('terbit'), 'spec C: paket terbit tidak berubah diam-diam');
  assert.ok(!bolehEditIsiPaket('ditutup'));
});

// ------------------------------------------------------------
test('kode: 4 huruf, tanpa 0/O/1/I/L, bisa deterministik untuk uji', () => {
  let i = 0;
  const urut = [0, 0.5, 0.25, 0.75, 0.999];
  const kode = buatKodePaket(() => urut[i++ % urut.length]);
  assert.equal(kode.length, 4);
  assert.ok(kodePaketSah(kode), `kode ${kode} harus sah`);
  assert.ok([...kode].every((c) => ALFABET_KODE_PAKET.includes(c)));
  assert.ok(!/[0O1IL]/.test(ALFABET_KODE_PAKET), 'huruf membingungkan dibuang dari alfabet');
  // contoh owner "2W3Q" sah:
  assert.ok(kodePaketSah('2W3Q'));
  assert.ok(!kodePaketSah('2W3'), 'terlalu pendek');
  assert.ok(!kodePaketSah('2W31'), 'mengandung 1');
  assert.ok(!kodePaketSah(''), 'kosong');
});

// ------------------------------------------------------------
test('bab & nomor: penomoran urut per (jenjang|mapel|materi), toleran lompatan', () => {
  assert.equal(kunciBabPaket({ jenjang: 'SMP', mapel: 'B. Inggris', materi: 'Descriptive Text' }),
    'smp|b. inggris|descriptive text');
  assert.equal(
    kunciBabPaket({ jenjang: ' SMP ', mapel: 'b. inggris', materi: 'Descriptive Text ' }),
    kunciBabPaket({ jenjang: 'SMP', mapel: 'B. Inggris', materi: 'descriptive text' }),
    'normalisasi: beda spasi/kapital bukan bab berbeda',
  );
  assert.equal(nomorPaketBerikutnya([]), 1);
  assert.equal(nomorPaketBerikutnya([{ nomorPaket: 1 }, { nomorPaket: 2 }]), 3);
  assert.equal(nomorPaketBerikutnya([{ nomorPaket: 5 }, { nomorPaket: 'x' }, {}]), 6, 'lompatan & rusak dihormati');
});

test('judul: pola contoh spec "SMP 8 — Bahasa Inggris — Descriptive Text — Paket 05"', () => {
  assert.equal(
    usulanJudulPaket({ jenjang: 'SMP 8', mapel: 'Bahasa Inggris', materi: 'Descriptive Text', nomor: 5 }),
    'SMP 8 — Bahasa Inggris — Descriptive Text — Paket 05',
  );
  assert.equal(usulanJudulPaket({ mapel: 'Kimia', materi: 'Larutan', nomor: 12 }), 'Kimia — Larutan — Paket 12');
  assert.equal(usulanJudulPaket({ nomor: 1 }), 'Paket 01');
  assert.ok(!usulanJudulPaket({ jenjang: ' ', mapel: '', materi: '', nomor: 2 }).includes('—  —'), 'tidak ada dash ganda');
  assert.equal(labelPaketSingkat({ nomorPaket: 5, kodePaket: '2w3q' }), 'Paket 05 · 2W3Q');
});

// ------------------------------------------------------------
test('sanitizer: naskah siswa bebas kunci di SEMUA dialek', () => {
  const bersihPg = bersihSoalUntukSiswa(BUTIR_PG);
  assert.deepEqual(jejakKunciDiSoalSiswa(bersihPg), [], `jejak tersisa: ${jejakKunciDiSoalSiswa(bersihPg)}`);
  assert.ok(soalSiswaBebasKunci(bersihPg));
  // materi soal & bentuk opsi tetap utuh:
  assert.equal(bersihPg.teksSoal, BUTIR_PG.teksSoal);
  assert.equal(bersihPg.opsiJawaban.length, 2);
  assert.deepEqual(bersihPg.opsiJawaban[0].gambar, [], 'gambar opsi dipertahankan');
  assert.equal(bersihPg.identitas.mapel, 'IPS', 'identitas dipertahankan (sync materi)');
  // glif ☑/☐ dibersihkan (PR #186) + bendera `benar` di opsi dihapus:
  assert.equal(bersihPg.opsiJawaban[0].teks, 'Jakarta');
  assert.equal(bersihPg.opsiJawaban[1].teks, 'Bandung');
  assert.ok(!('benar' in bersihPg.opsiJawaban[1]));
  // objek ASLI tidak boleh berubah (paket tentor tetap memegang kunci):
  assert.equal(BUTIR_PG.kunciJawaban, 'A');
  assert.equal(BUTIR_PG.opsiJawaban[0].teks, '☑ Jakarta');
  assert.equal(BUTIR_PG.pembahasan, 'Jakarta ditetapkan sejak 1961.');
});

test('sanitizer: baris benar/salah kehilangan kunci, TEKS baris tetap', () => {
  const bersihBs = bersihSoalUntukSiswa(BUTIR_BS);
  assert.ok(soalSiswaBebasKunci(bersihBs), `jejak: ${jejakKunciDiSoalSiswa(bersihBs)}`);
  assert.equal(bersihBs.pernyataan.length, 2);
  assert.equal(bersihBs.pernyataan[0].teks, 'Gradien garis y = -2x + 5 adalah 2.');
  assert.ok(!('jawaban' in bersihBs.pernyataan[0]));
  assert.ok(!('kunci' in bersihBs.pernyataan[1]) && !('value' in bersihBs.pernyataan[1]));
  assert.equal(BUTIR_BS.pernyataan[1].kunci, 'Benar', 'asli tak tersentuh');
});

test('sanitizer: deteksi jejak kunci bekerja pada butir KOTOR (alat uji pagar)', () => {
  assert.ok(!soalSiswaBebasKunci(BUTIR_PG));
  const jejak = jejakKunciDiSoalSiswa(BUTIR_PG);
  assert.ok(jejak.includes('kunciJawaban'));
  assert.ok(jejak.includes('pembahasan'));
  assert.ok(jejak.some((j) => j.includes('benar')), 'bendera benar di opsi terdeteksi');
  assert.ok(jejak.some((j) => j.includes('glif')), 'glif ☑ di teks opsi terdeteksi');
  assert.deepEqual(daftarSoalUntukSiswa([BUTIR_PG, BUTIR_BS, null]).length, 2);
});

// ------------------------------------------------------------
test('terbit: ditolak tanpa sasaran/soal/judul dengan alasan jelas', () => {
  const kosong = putusanTerbitkanPaket({});
  assert.ok(!kosong.boleh);
  assert.ok(kosong.alasan.some((a) => a.includes('judul')));
  assert.ok(kosong.alasan.some((a) => a.includes('soal')));
  assert.ok(kosong.alasan.some((a) => a.includes('sasaran')));

  const ok = putusanTerbitkanPaket({
    judul: 'Paket 01', daftarSoal: [BUTIR_PG], targetKelas: ['8'], izinkanCetakSiswa: true,
  });
  assert.ok(ok.boleh, ok.alasan.join('; '));
  assert.deepEqual(ok.alasan, []);

  const tanpaCetak = putusanTerbitkanPaket({
    judul: 'Paket 01', daftarSoal: [BUTIR_PG], targetSiswa: ['S-1'], izinkanCetakSiswa: false,
  });
  assert.ok(tanpaCetak.boleh, 'cetak mati bukan pembatal');
  assert.ok(tanpaCetak.peringatan.some((p) => p.includes('Cetak')), 'tapi diperingatkan');
  assert.ok(tanpaCetak.peringatan.some((p) => p.includes('batas waktu')), 'tanpa tenggat diperingatkan');
});

test('terbit: payload update + naskah siswa; naskah PASTI bebas kunci', () => {
  const draf = payloadDrafPaket({
    judul: 'SMP 8 — IPS — Bab 1 — Paket 01', jenjang: 'SMP', mapel: 'IPS', materi: 'Bab 1',
    nomorPaket: 1, kodePaket: '2W3Q', targetKelas: ['8'], daftarSoal: [BUTIR_PG, BUTIR_BS],
    guru: { id: 'g1', nama: 'Pak Guru' }, sekarang: '2026-10-09T00:00:00.000Z',
  });
  assert.equal(draf.status, 'draf', 'payload baru SELALU draf — tidak pernah auto-terbit');
  assert.equal(draf.kodePaket, '2W3Q');
  assert.equal(draf.babKey, 'smp|ips|bab 1');
  assert.equal(draf.riwayatStatus.length, 1);

  const putusan = payloadTerbitDariDraf(draf, { oleh: 'Pak Guru', sekarang: '2026-10-09T01:00:00.000Z' });
  assert.ok(putusan.boleh);
  assert.equal(putusan.update.status, 'terbit');
  assert.equal(putusan.update.riwayatStatus.length, 2, 'jejak audit bertambah, riwayat lama utuh');
  assert.ok(!('daftarSoal' in putusan.update), 'update tidak menyalin ulang soal');

  const naskah = bangunNaskahSiswa({ ...draf, id: 'paket01' }, { sekarang: '2026-10-09T01:00:00.000Z' });
  assert.equal(naskah.paketId, 'paket01');
  assert.equal(naskah.status, 'terbit');
  assert.equal(naskah.totalSoal, 2);
  for (const s of naskah.daftarSoal) {
    assert.ok(soalSiswaBebasKunci(s), `naskah siswa bocor: ${jejakKunciDiSoalSiswa(s)}`);
  }
  assert.equal(naskah.daftarSoal[0].teksSoal, BUTIR_PG.teksSoal, 'isi soal tetap terbaca');

  const tolak = payloadTerbitDariDraf({ ...draf, targetKelas: [], targetSiswa: [] });
  assert.ok(!tolak.boleh && tolak.update === null, 'tanpa sasaran: tidak ada payload terbit');
});

// ------------------------------------------------------------
test('versi baru: draf terpisah, induk terbit tidak disentuh', () => {
  const induk = {
    id: 'paket01', judul: 'Paket 01', status: 'terbit', versiKe: 1,
    daftarSoal: [BUTIR_PG], tentorId: 'g1', tentorNama: 'Pak Guru',
    kodePaket: '2W3Q', nomorPaket: 1, targetKelas: ['8'],
  };
  const versi2 = payloadVersiBaru(induk, { guru: { id: 'g1', nama: 'Pak Guru' }, sekarang: '2026-10-09T02:00:00.000Z' });
  assert.equal(versi2.status, 'draf');
  assert.equal(versi2.versiKe, 2);
  assert.equal(versi2.indukPaketId, 'paket01');
  assert.equal(versi2.kodePaket, '2W3Q', 'kode bab tetap — siswa mencari dengan kode yang sama');
  assert.equal(versi2.daftarSoal.length, 1);
  assert.equal(induk.status, 'terbit', 'induk tidak pernah berubah diam-diam');
  assert.equal(induk.versiKe, 1);
});

// ------------------------------------------------------------
test('hak lihat siswa: hanya paket terbit yang menyasar dirinya/kelasnya', () => {
  const naskah = { status: 'terbit', targetSiswa: ['S-1', 'S-2'], targetKelas: ['8'] };
  assert.ok(paketBolehDilihatSiswa(naskah, { studentId: 'S-2' }));
  assert.ok(paketBolehDilihatSiswa(naskah, { kelasSekolah: '8' }));
  assert.ok(!paketBolehDilihatSiswa(naskah, { studentId: 'S-9', kelasSekolah: '9' }));
  assert.ok(!paketBolehDilihatSiswa({ ...naskah, status: 'draf' }, { studentId: 'S-1' }));
  assert.ok(!paketBolehDilihatSiswa({ status: 'terbit', targetSiswa: [], targetKelas: [] }, { studentId: 'S-1', kelasSekolah: '8' }),
    'terbit tanpa sasaran tidak membuka akses siapa pun');
  assert.ok(!paketBolehDilihatSiswa(null, { studentId: 'S-1' }));
});

// ------------------------------------------------------------
test('sinkron materi: fakta dilaporkan, keputusan milik tentor', () => {
  const paket = { daftarSoal: [{ id: 'a' }, { id: 'b' }, { id: 'c' }] };
  const bank = [
    { id: 'a', status: 'aktif' },
    { id: 'b', status: 'dihapus' },
    // 'c' hilang dari bank
  ];
  const hasil = periksaSelarasMateri(paket, bank);
  assert.ok(!hasil.selaras);
  assert.deepEqual(hasil.hilang, ['c']);
  assert.deepEqual(hasil.nonaktif, ['b']);
  assert.equal(hasil.totalDiperiksa, 3);
  const utuh = periksaSelarasMateri({ daftarSoal: [{ id: 'a' }] }, [{ id: 'a', status: 'aktif' }]);
  assert.ok(utuh.selaras);
});

// ------------------------------------------------------------
test('buku progress: klaim siswa TIDAK PERNAH berarti selesai', () => {
  const belum = statusPeriksaSiswa(null);
  assert.equal(belum.kode, 'belum');
  assert.ok(!belum.olehTentor);

  const klaim = statusPeriksaSiswa({ klaimSelesaiPada: '2026-10-09T03:00:00Z' });
  assert.equal(klaim.kode, 'klaim');
  assert.ok(!klaim.olehTentor);
  assert.ok(klaim.label.toLowerCase().includes('menunggu pemeriksaan'), 'jujur: belum diverifikasi');
  assert.ok(!klaim.label.toLowerCase().includes('selesai (') && !/^selesai/i.test(klaim.label), 'klaim bukan selesai');

  for (const [kode, label] of [['perlu_perbaikan', 'perlu'], ['sudah_diperiksa', 'diperiksa'], ['selesai', 'selesai']]) {
    const s = statusPeriksaSiswa({ statusPeriksa: kode, klaimSelesaiPada: 'x' });
    assert.equal(s.kode, kode);
    assert.ok(s.olehTentor, `${kode} adalah catatan tentor`);
    assert.ok(s.label.toLowerCase().includes(label));
  }
});

test('rentang nomor: bolak-balik teks ⇄ angka & catatan gaya owner', () => {
  assert.deepEqual(uraiRentangNomor('1-15, 18'), [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 18]);
  assert.deepEqual(uraiRentangNomor('15-13, 5, 5'), [5, 13, 14, 15], 'rentang terbalik & duplikat dinormalkan');
  assert.deepEqual(uraiRentangNomor('abc, , 7'), [7], 'sampah dibuang diam-diam');
  assert.deepEqual(uraiRentangNomor(''), []);
  assert.equal(formatRentangNomor([1, 2, 3, 4, 15, 16, 20]), '1-4, 15-16, 20');
  assert.equal(formatRentangNomor([]), '');
  assert.equal(formatRentangNomor(uraiRentangNomor('3, 1-2')), '1-3', 'round-trip');

  // contoh kalimat owner: "mengerjakan paket 1 kode 2W3Q nomor 1-15 kurang 16-20"
  const catatan = catatanProgresJujur({ nomorSelesai: uraiRentangNomor('1-15'), totalSoal: 20 });
  assert.equal(catatan, 'mengerjakan nomor 1-15, kurang 16-20');
  assert.equal(catatanProgresJujur({ nomorSelesai: uraiRentangNomor('1-20'), totalSoal: 20 }), 'mengerjakan nomor 1-20 (lengkap 1-20)');
  assert.equal(catatanProgresJujur({}), 'belum ada nomor yang tercatat dikerjakan');
});
