// tests/katalogMapelGemilang.test.mjs — pondasi mapel v2 & migrasi (murni)
// Perombakan pondasi owner 31 Okt 2026: registry lama diganti katalog kanonik
// (sekolah Kurikulum Merdeka + UTBK/SNBT + program lokal), referensi guru &
// siswa dipetakan ulang. Fungsi di sini murni; eksekusi Firestore di admin.
//   node tests/katalogMapelGemilang.test.mjs
import assert from 'node:assert/strict';
import {
  katalogMapelGemilang, kodeKanonikDariNamaLama, rencanaMigrasiMapel,
  transformGuruKeKodeKanonik, transformSiswaKeKodeKanonik,
  transformModulKeKodeKanonik, transformJadwalKeKodeKanonik, transformLaporanKeKodeKanonik,
  petakanKodeYatim,
} from '../src/utils/katalogMapelGemilang.js';

let lulus = 0, gagal = 0;
function uji(n, f) {
  try { f(); lulus++; console.log(`  ✓ ${n}`); }
  catch (e) { gagal++; console.log(`  ✗ ${n}\n      ${String(e.message).slice(0, 220)}`); }
}
console.log('katalogMapelGemilang — katalog kanonik v2 + rencana migrasi');

uji('katalog memuat inti SD/SMP/SMA sesuai owner + UTBK/SNBT + program', () => {
  const kode = new Set(katalogMapelGemilang().map((k) => k.kode));
  for (const k of ['bind', 'bing', 'mtk', 'ipas', 'ipa', 'ips', 'fis', 'kim', 'bio', 'geo', 'sos', 'eko']) {
    assert.ok(kode.has(k), `katalog kehilangan ${k}`);
  }
  for (const k of ['utbk_pu', 'utbk_ppu', 'utbk_pbm', 'utbk_pk', 'utbk_lbi', 'prog_engc', 'prog_tka']) {
    assert.ok(kode.has(k), `katalog kehilangan ${k}`);
  }
});

uji('pemetaan nama lama → kode kanonik (varian luruh, program tetap program)', () => {
  assert.equal(kodeKanonikDariNamaLama('GEOGRAFI SMA'), 'geo');
  assert.equal(kodeKanonikDariNamaLama('IPA SMP'), 'ipa');
  assert.equal(kodeKanonikDariNamaLama('IPAS SD'), 'ipas');
  assert.equal(kodeKanonikDariNamaLama('BAHASA INGGRIS SD'), 'bing');
  assert.equal(kodeKanonikDariNamaLama('TES KOMPETENSI AKADEMIK'), 'prog_tka');
  assert.equal(kodeKanonikDariNamaLama('ENGLISH COURSE'), 'prog_engc');
  assert.equal(kodeKanonikDariNamaLama('TKA BAHASA INGGRIS SMA'), 'bing'); // konteks TKA, mapel tetap Inggris
  assert.equal(kodeKanonikDariNamaLama('TPS/Penalaran Umum'), 'utbk_pu');
  assert.equal(kodeKanonikDariNamaLama('Mapel Ajaib Tak Diketahui'), '');
});

uji('rencana migrasi: varian dilebur ke induk teramai, peta kode lengkap', () => {
  const docs = [
    { id: 'd1', kodeMapel: 'MAPEL-019', namaMapel: 'GEOGRAFI SMA' },
    { id: 'd2', kodeMapel: 'MAPEL-020', namaMapel: 'Geografi' },
    { id: 'd3', kodeMapel: 'MAPEL-007', namaMapel: 'IPA SMP' },
    { id: 'd4', kodeMapel: 'MAPEL-099', namaMapel: 'Mapel Ajaib Tak Diketahui' },
  ];
  const rencana = rencanaMigrasiMapel(docs, { guruPerKode: { 'MAPEL-020': 3, 'MAPEL-019': 1 }, siswaPerKode: { 'MAPEL-020': 10, 'MAPEL-019': 0 } });
  const geo = rencana.target.find((t) => t.kode === 'geo');
  assert.equal(geo.indukId, 'd2'); // induk = pemakaian terbanyak
  assert.equal(geo.varianDinonaktifkan.length, 1);
  assert.equal(geo.varianDinonaktifkan[0].id, 'd1');
  assert.equal(rencana.petaKode['MAPEL-019'], 'geo');
  assert.equal(rencana.petaKode['MAPEL-020'], 'geo');
  assert.equal(rencana.petaNama['MAPEL-019'], 'Geografi');
  assert.equal(rencana.takTerpeta.length, 1); // d4 dibiarkan, tidak ditebak
  assert.equal(rencana.takTerpeta[0].id, 'd4');
});

uji('transform guru: varian dedupe jadi satu entri kanonik, field lama sinkron', () => {
  const petaKode = { 'MAPEL-019': 'geo', 'MAPEL-020': 'geo', 'MAPEL-007': 'ipa' };
  const petaNama = { 'MAPEL-019': 'Geografi', 'MAPEL-020': 'Geografi', 'MAPEL-007': 'IPA' };
  const guru = {
    mapelDetails: [
      { id: 'd1', namaMapel: 'GEOGRAFI SMA', kodeMapel: 'MAPEL-019' },
      { id: 'd2', namaMapel: 'Geografi', kodeMapel: 'MAPEL-020' },
      { id: 'd3', namaMapel: 'IPA SMP', kodeMapel: 'MAPEL-007' },
    ],
  };
  const hasil = transformGuruKeKodeKanonik(guru, petaKode, petaNama);
  assert.equal(hasil.mapelDetails.length, 2); // geo + ipa, varian lebur
  assert.deepEqual(hasil.mapelDetails.map((m) => m.kodeMapel).sort(), ['geo', 'ipa']);
  assert.equal(hasil.mapel, 'Geografi, IPA');
  assert.equal(hasil.kodeMapel, 'geo, ipa');
  assert.equal(hasil.mapelIds.length, 2);
});

uji('transform guru: mapel tak terpeta (lokal) DIPERTAHANKAN, tidak hilang', () => {
  const petaKode = { 'MAPEL-019': 'geo' };
  const petaNama = { 'MAPEL-019': 'Geografi' };
  const guru = {
    mapelDetails: [
      { id: 'd1', namaMapel: 'GEOGRAFI SMA', kodeMapel: 'MAPEL-019' },
      { id: 'd4', namaMapel: 'Mapel Ajaib Tak Diketahui', kodeMapel: 'MAPEL-099' },
    ],
  };
  const hasil = transformGuruKeKodeKanonik(guru, petaKode, petaNama);
  assert.equal(hasil.mapelDetails.length, 2); // geo kanonik + ajaib tetap ada
  const ajaib = hasil.mapelDetails.find((m) => m.kodeMapel === 'MAPEL-099');
  assert.ok(ajaib && ajaib.id === 'd4', 'entri lokal hilang — dilarang!');
  assert.equal(hasil.mapel, 'Geografi, Mapel Ajaib Tak Diketahui');
});

uji('transform siswa: enrolledSubjects dedupe + "semua" dihormati + tak terpeta dibiarkan', () => {
  const petaKode = { 'MAPEL-019': 'geo', 'MAPEL-020': 'geo' };
  const siswa = { enrolledSubjects: ['MAPEL-019', 'MAPEL-020', 'semua', 'MAPEL-777'] };
  const hasil = transformSiswaKeKodeKanonik(siswa, petaKode);
  assert.deepEqual(hasil.enrolledSubjects, ['geo', 'semua', 'MAPEL-777']);
  const tanpa = transformSiswaKeKodeKanonik({}, petaKode);
  assert.equal(tanpa.enrolledSubjects, undefined);
});

// ---- v1.5.5: koleksi ikutan (audit pra-migrasi: jangan ada siswa terkunci) ----

uji('transform modul: kodeMapel lama → kanonik; kosong/gabungan/tak terpeta aman', () => {
  const petaKode = { 'MAPEL-019': 'geo', 'MAPEL-007': 'ipa' };
  assert.deepEqual(transformModulKeKodeKanonik({ kodeMapel: 'MAPEL-019' }, petaKode), { kodeMapel: 'geo' });
  assert.deepEqual(transformModulKeKodeKanonik({ kodeMapel: '' }, petaKode), { kodeMapel: '' });
  assert.deepEqual(transformModulKeKodeKanonik({}, petaKode), { kodeMapel: undefined });
  assert.deepEqual(transformModulKeKodeKanonik({ kodeMapel: 'MAPEL-019, MAPEL-007' }, petaKode), { kodeMapel: 'geo, ipa' });
  assert.deepEqual(transformModulKeKodeKanonik({ kodeMapel: 'MAPEL-999' }, petaKode), { kodeMapel: 'MAPEL-999' }); // tak terpeta = jujur
  assert.deepEqual(transformModulKeKodeKanonik({ kodeMapel: 'geo' }, petaKode), { kodeMapel: 'geo' }); // idempoten
});

uji('transform jadwal: mapelId varian → induk kanonik + nama kanonik; induk reuse tidak diutak-atik id-nya', () => {
  const petaDocId = { d1: 'd2' };
  const petaNamaDariDocId = { d1: 'Geografi', d2: 'Geografi' };
  const petaNamaDariNamaLama = { 'geografi sma': 'Geografi' };
  assert.deepEqual(
    transformJadwalKeKodeKanonik({ mapelId: 'd1', mapelName: 'GEOGRAFI SMA' }, petaDocId, petaNamaDariDocId, petaNamaDariNamaLama),
    { mapelId: 'd2', mapelName: 'Geografi' },
  );
  assert.deepEqual(
    transformJadwalKeKodeKanonik({ mapelId: 'd2', mapelName: 'Geografi' }, petaDocId, petaNamaDariDocId, petaNamaDariNamaLama),
    {}, // induk kanonik: tidak ada perubahan
  );
  assert.deepEqual(
    transformJadwalKeKodeKanonik({ mapelName: 'GEOGRAFI SMA' }, {}, {}, petaNamaDariNamaLama),
    { mapelName: 'Geografi' }, // jadwal tanpa id tetap dirapikan lewat nama
  );
});

uji('transform laporan belajar: capaian guru ikut kode kanonik; tak terpeta dibiarkan', () => {
  const petaKode = { 'MAPEL-019': 'geo' };
  const petaNama = { 'MAPEL-019': 'Geografi' };
  assert.deepEqual(
    transformLaporanKeKodeKanonik({ kodeMapel: 'MAPEL-019', namaMapel: 'GEOGRAFI SMA' }, petaKode, petaNama),
    { kodeMapel: 'geo', namaMapel: 'Geografi' },
  );
  assert.deepEqual(transformLaporanKeKodeKanonik({ kodeMapel: 'geo', namaMapel: 'Geografi' }, petaKode, petaNama), {}); // sudah kanonik = tidak ada yang ditulis (idempoten)
  assert.deepEqual(transformLaporanKeKodeKanonik({ kodeMapel: 'MAPEL-999' }, petaKode, petaNama), {}); // tak terpeta = jangan sentuh
  assert.deepEqual(transformLaporanKeKodeKanonik({ kodeMapel: '' }, petaKode, petaNama), {});
});

uji('v1.5.6 kode yatim: nama pendamping resolve strict, yang tidak = dibiarkan', () => {
  const petaKode = { 'MAPEL-019': 'geo' };
  const yatim = petakanKodeYatim([
    { kodeLama: 'MAPEL-012', nama: 'IPS (Pengganti)' },  // kasus nyata produksi
    { kodeLama: 'MAPEL-019', nama: 'GEOGRAFI SMA' },     // sudah terpeta — lewati
    { kodeLama: 'geo', nama: 'Geografi' },               // sudah kanonik — lewati
    { kodeLama: 'MAPEL-777', nama: 'Mapel Ajaib' },      // tak teresolve — JANGAN ditebak
    { kodeLama: '', nama: 'Matematika' },                // tanpa kode — lewati
    { kodeLama: 'MAPEL-017', nama: 'Matematika minat SMA' }, // resolver bertahap v1.5.6
  ], petaKode);
  assert.deepEqual(yatim, { 'MAPEL-012': 'ips', 'MAPEL-017': 'mtk_tl' });
});

uji('simulasi end-to-end: siswa TIDAK terkunci dari modul setelah migrasi penuh', () => {
  // Skenario dunia nyata pra-migrasi: varian induk 'Geografi' (MAPEL-020, d2)
  // + varian 'GEOGRAFI SMA' (MAPEL-019, d1). Siswa terdaftar di MAPEL-019,
  // guru mengampu MAPEL-019, modul tersimpan dengan kodeMapel MAPEL-019.
  const docs = [
    { id: 'd1', kodeMapel: 'MAPEL-019', namaMapel: 'GEOGRAFI SMA' },
    { id: 'd2', kodeMapel: 'MAPEL-020', namaMapel: 'Geografi' },
  ];
  const rencana = rencanaMigrasiMapel(docs, { guruPerKode: { 'MAPEL-019': 1 }, siswaPerKode: { 'MAPEL-019': 1 } });
  const guru = { mapelDetails: [{ id: 'd1', namaMapel: 'GEOGRAFI SMA', kodeMapel: 'MAPEL-019' }] };
  const siswa = { enrolledSubjects: ['MAPEL-019'] };
  const modul = { subject: 'GEOGRAFI SMA', kodeMapel: 'MAPEL-019' };
  // migrasi…
  const gBaru = transformGuruKeKodeKanonik(guru, rencana.petaKode, rencana.petaNama);
  const sBaru = transformSiswaKeKodeKanonik(siswa, rencana.petaKode);
  const mBaru = transformModulKeKodeKanonik(modul, rencana.petaKode);
  // guru tetap mengampu geo
  assert.equal(gBaru.kodeMapel, 'geo');
  // siswa tetap terdaftar geo
  assert.deepEqual(sBaru.enrolledSubjects, ['geo']);
  // modul ikut kanonik → pagar akses EKSAK tetap lolos
  assert.equal(mBaru.kodeMapel, 'geo');
  assert.ok(sBaru.enrolledSubjects.some((e) => String(mBaru.kodeMapel).split(',').includes(e)), 'SISWA TERKUNCI DARI MODULNYA!');
});

console.log(`\n${gagal === 0 ? '✅' : '❌'} katalogMapelGemilang: ${lulus} lulus, ${gagal} gagal`);
process.exit(gagal === 0 ? 0 : 1);
