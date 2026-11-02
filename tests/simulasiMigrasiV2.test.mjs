// tests/simulasiMigrasiV2.test.mjs — SIMULASI END-TO-END MIGRASI PONDASI v2
// Audit pra-klik owner (31 Okt 2026): "cek dari akar rambut terkecil, jangan
// sampai ada siswa atau guru terblokir karena salah sistem atau bug".
//
// Test ini membangun DUNIA MOCK yang meniru data produksi paling berantakan
// (varian per jenjang, guru field-tunggal legacy, program lokal, subtes UTBK,
// mapel tak dikenal, siswa 'semua', modul tanpa kode), menjalankan SELURUH
// fungsi migrasi murni persis seperti eksekutor di TeacherList.jsx, lalu
// memverifikasi INVARIAN KERAS:
//   1. TIDAK ADA LOCKOUT: setiap pasangan (siswa × modul) yang LOLOS pagar
//      akses SEBELUM migrasi harus TETAP LOLOS sesudah migrasi.
//   2. Guru tidak kehilangan mapel yang sah; kode hasil = kanonik/dipertahankan.
//   3. Tidak ada nilai `undefined` di payload mana pun (Firestore menolak
//      undefined — v1.5.2 pernah crash karena pola sejenis).
//   4. Laporan capaian guru tetap tercocokkan EKSAK di menu guru pasca-migrasi.
//   node tests/simulasiMigrasiV2.test.mjs
import assert from 'node:assert/strict';
import {
  katalogMapelGemilang, rencanaMigrasiMapel, transformGuruKeKodeKanonik,
  transformSiswaKeKodeKanonik, transformModulKeKodeKanonik,
  transformJadwalKeKodeKanonik, transformLaporanKeKodeKanonik, bangunPetaReferensi,
} from '../src/utils/katalogMapelGemilang.js';
import { cocokkanAksesModul } from '../src/utils/aksesKontenSiswa.js';

let lulus = 0, gagal = 0;
function uji(n, f) {
  try { f(); lulus++; console.log(`  ✓ ${n}`); }
  catch (e) { gagal++; console.log(`  ✗ ${n}\n      ${String(e.message).slice(0, 300)}`); }
}
console.log('simulasiMigrasiV2 — dunia mock berantakan → invarian anti-lockout');

// ===== DUNIA MOCK (meniru registry produksi yang dikeluhkan owner) =====
const registry = [
  { id: 'd1', kodeMapel: 'MAPEL-019', namaMapel: 'GEOGRAFI SMA' },        // varian
  { id: 'd2', kodeMapel: 'MAPEL-020', namaMapel: 'Geografi' },            // induk teramai
  { id: 'd3', kodeMapel: 'MAPEL-007', namaMapel: 'IPA SMP' },
  { id: 'd4', kodeMapel: 'MAPEL-099', namaMapel: 'Mapel Ajaib Tak Diketahui' }, // lokal tak terpeta
  { id: 'd5', kodeMapel: 'MAPEL-050', namaMapel: 'ENGLISH COURSE' },      // program sah
  { id: 'd6', kodeMapel: 'MAPEL-060', namaMapel: 'TPS/Penalaran Umum' },  // subtes UTBK (PU)
  { id: 'd7', kodeMapel: 'MAPEL-001', namaMapel: 'Matematika' },          // sudah kanonik-nama
];
const pemakaian = {
  guruPerKode: { 'MAPEL-020': 2, 'MAPEL-019': 1, 'MAPEL-007': 1, 'MAPEL-099': 1, 'MAPEL-050': 1, 'MAPEL-060': 1, 'MAPEL-001': 2 },
  siswaPerKode: { 'MAPEL-020': 3, 'MAPEL-019': 2, 'MAPEL-007': 4, 'MAPEL-001': 5 },
};
const guruSebelum = [
  { id: 'g1', mapelDetails: [ // multi-mapel + varian ganda dalam 1 guru
    { id: 'd1', namaMapel: 'GEOGRAFI SMA', kodeMapel: 'MAPEL-019' },
    { id: 'd2', namaMapel: 'Geografi', kodeMapel: 'MAPEL-020' },
    { id: 'd3', namaMapel: 'IPA SMP', kodeMapel: 'MAPEL-007' },
  ] },
  { id: 'g2', mapel: 'Mapel Ajaib Tak Diketahui', kodeMapel: 'MAPEL-099', mapelId: 'd4' }, // legacy field tunggal
  { id: 'g3', mapelDetails: [{ id: 'd6', namaMapel: 'TPS/Penalaran Umum', kodeMapel: 'MAPEL-060' }] },
  { id: 'g4', mapelDetails: [{ id: 'd7', namaMapel: 'Matematika', kodeMapel: 'MAPEL-001' }] },
];
const siswaSebelum = [
  { id: 's1', enrolledSubjects: ['MAPEL-019', 'MAPEL-020'] }, // varian dobel
  { id: 's2', enrolledSubjects: ['semua'] },
  { id: 's3', enrolledSubjects: ['MAPEL-007', 'MAPEL-099'] }, // kurikulum + lokal
  { id: 's4', enrolledSubjects: [] },                          // kosong = memang blokir (aturan owner)
  { id: 's5' },                                                // field tidak ada
  { id: 's6', enrolledSubjects: ['MAPEL-001', 'MAPEL-060'] },
];
const modulSebelum = [
  { id: 'm1', subject: 'GEOGRAFI SMA', kodeMapel: 'MAPEL-019' }, // kode varian
  { id: 'm2', subject: 'Geografi', kodeMapel: 'MAPEL-020' },     // kode induk
  { id: 'm3', subject: 'IPA SMP', kodeMapel: 'MAPEL-007' },
  { id: 'm4', subject: 'Mapel Ajaib Tak Diketahui', kodeMapel: 'MAPEL-099' },
  { id: 'm5', subject: 'Umum', kodeMapel: '' },
  { id: 'm6', subject: 'Matematika', kodeMapel: '' },            // tanpa kode (data lama)
  { id: 'm7', subject: 'TPS/Penalaran Umum', kodeMapel: 'MAPEL-060' },
];
const jadwalSebelum = [
  { id: 'j1', mapelId: 'd1', mapelName: 'GEOGRAFI SMA' },
  { id: 'j2', mapelId: 'd7', mapelName: 'Matematika' },
];
const laporanSebelum = [
  { id: 'l1', kodeMapel: 'MAPEL-019', namaMapel: 'GEOGRAFI SMA', studentId: 's1' },
  { id: 'l2', kodeMapel: 'MAPEL-099', namaMapel: 'Mapel Ajaib Tak Diketahui', studentId: 's3' },
];

// ===== JALANKAN MIGRASI (persis urutan eksekutor TeacherList.jsx) =====
const rencana = rencanaMigrasiMapel(registry, pemakaian);
const kodeKanonik = new Set(katalogMapelGemilang().map((k) => k.kode));

// Fase 1 (reuse induk di tempat — id induk tidak berubah; addDoc tak terjadi
// karena semua target punya induk di dunia mock ini).
const petaDocId = {};
for (const t of rencana.target) {
  petaDocId[t.indukId] = t.indukId;
  for (const v of t.varianDinonaktifkan) petaDocId[v.id] = t.indukId;
}
const refPeta = bangunPetaReferensi(rencana);

const guruSesudah = guruSebelum.map((g) => {
  const t = transformGuruKeKodeKanonik(g, rencana.petaKode, rencana.petaNama);
  return { ...g, ...t, mapelDetails: t.mapelDetails.map((m) => ({ ...m, id: petaDocId[m.id] || m.id })) };
});
const siswaSesudah = siswaSebelum.map((s) => ({ ...s, ...transformSiswaKeKodeKanonik(s, rencana.petaKode) }));
const modulSesudah = modulSebelum.map((m) => ({ ...m, ...transformModulKeKodeKanonik(m, rencana.petaKode) }));
const jadwalSesudah = jadwalSebelum.map((j) => ({ ...j, ...transformJadwalKeKodeKanonik(j, petaDocId, refPeta.petaNamaDariDocId, refPeta.petaNamaDariNamaLama) }));
const laporanSesudah = laporanSebelum.map((l) => ({ ...l, ...transformLaporanKeKodeKanonik(l, rencana.petaKode, rencana.petaNama) }));

// Pagar akses VERSI LAMA (4 salinan identik pra-v1.5.5, pencocokan eksak) —
// referensi untuk membuktikan "tidak ada yang kehilangan akses".
const pagarLama = (enrolled, subject, kode) => {
  if (!subject || String(subject).toLowerCase().trim() === 'umum') return true;
  const norm = (s) => String(s || '').toLowerCase().trim();
  const codes = String(kode || '').split(',').map(norm).filter(Boolean);
  const name = norm(subject);
  if (codes.length === 0 && !name) return true;
  if (!Array.isArray(enrolled) || enrolled.length === 0) return false;
  if (enrolled.some((s) => norm(s) === 'semua')) return true;
  return enrolled.some((s) => { const es = norm(s); return codes.includes(es) || es === name; });
};

uji('invarian #1 — TIDAK ADA LOCKOUT: lolos pagar lama ⇒ lolos pagar baru', () => {
  let pasangan = 0;
  for (const sLama of siswaSebelum) {
    const sBaru = siswaSesudah.find((x) => x.id === sLama.id);
    for (const mLama of modulSebelum) {
      const mBaru = modulSesudah.find((x) => x.id === mLama.id);
      const lamaLolos = pagarLama(sLama.enrolledSubjects, mLama.subject, mLama.kodeMapel);
      const baruLolos = cocokkanAksesModul(sBaru.enrolledSubjects, mBaru.subject, mBaru.kodeMapel);
      pasangan += 1;
      assert.ok(
        !lamaLolos || baruLolos,
        `LOCKOUT: siswa ${sLama.id} × modul ${mLama.id} (${mLama.subject}/${mLama.kodeMapel}) dulu LOLOS, sekarang BLOKIR`,
      );
    }
  }
  assert.ok(pasangan === siswaSebelum.length * modulSebelum.length);
});

uji('invarian #1b — akses sah yang dulu Rusak Karena Varian justru PULIH', () => {
  // s1 terdaftar di MAPEL-019 (varian) — modul m2 memakai kode induk MAPEL-020.
  // Pra-migrasi: BLOKIR (persis keluhan "sistem bingung"). Pasca: terbuka.
  assert.equal(pagarLama(['MAPEL-019'], 'Geografi', 'MAPEL-020'), false);
  const s1 = siswaSesudah.find((x) => x.id === 's1');
  const m2 = modulSesudah.find((x) => x.id === 'm2');
  assert.equal(cocokkanAksesModul(s1.enrolledSubjects, m2.subject, m2.kodeMapel), true);
  assert.deepEqual(s1.enrolledSubjects, ['geo']); // varian dobel → satu kode kanonik
});

uji('invarian #2 — guru: mapel sah tak hilang, kode = kanonik/dipertahankan, id menunjuk dokumen aktif', () => {
  const g1 = guruSesudah.find((g) => g.id === 'g1');
  assert.deepEqual(g1.mapelDetails.map((m) => m.kodeMapel).sort(), ['geo', 'ipa']);
  assert.ok(g1.mapelDetails.every((m) => !String(m.id).startsWith('d1') || petaDocId['d1'] === m.id));
  const dokumenNonaktif = new Set(rencana.nonaktif.map((v) => v.id));
  for (const g of guruSesudah) {
    for (const m of g.mapelDetails) assert.ok(!dokumenNonaktif.has(m.id), `guru ${g.id} masih menunjuk dokumen nonaktif ${m.id}`);
  }
  const g2 = guruSesudah.find((g) => g.id === 'g2'); // lokal tak terpeta DIPERTAHANKAN
  assert.equal(g2.mapelDetails.length, 1);
  assert.equal(g2.mapelDetails[0].kodeMapel, 'MAPEL-099');
  const g3 = guruSesudah.find((g) => g.id === 'g3');
  assert.equal(g3.kodeMapel, 'utbk_pu'); // subtes PU owner → kode mesin UTBK
});

uji('invarian #3 — tidak ada undefined di payload mana pun (Firestore menolak undefined)', () => {
  const scan = (obj, ctx) => {
    for (const [k, v] of Object.entries(obj)) {
      assert.notEqual(v, undefined, `undefined di ${ctx}.${k}`);
      if (v && typeof v === 'object' && !Array.isArray(v)) scan(v, `${ctx}.${k}`);
      if (Array.isArray(v)) v.forEach((x, i) => { if (x && typeof x === 'object') scan(x, `${ctx}.${k}[${i}]`); else assert.notEqual(x, undefined, `undefined di ${ctx}.${k}[${i}]`); });
    }
  };
  guruSesudah.forEach((g) => scan({ mapelDetails: g.mapelDetails, mapel: g.mapel, kodeMapel: g.kodeMapel, mapelIds: g.mapelIds, mapelId: g.mapelId }, `guru ${g.id}`));
  siswaSesudah.forEach((s) => { if (s.enrolledSubjects !== undefined) scan({ enrolledSubjects: s.enrolledSubjects }, `siswa ${s.id}`); });
  modulSesudah.forEach((m) => scan({ kodeMapel: m.kodeMapel }, `modul ${m.id}`));
  jadwalSesudah.forEach((j) => scan(transformJadwalKeKodeKanonik(j, petaDocId, refPeta.petaNamaDariDocId, refPeta.petaNamaDariNamaLama), `jadwal ${j.id}`));
  laporanSesudah.forEach((l) => scan(transformLaporanKeKodeKanonik(l, rencana.petaKode, rencana.petaNama), `laporan ${l.id}`));
});

uji('invarian #4 — capaian guru tetap tercocokkan EKSAK di menu Laporan Belajar pasca-migrasi', () => {
  // Halaman guru mencocokkan x.kodeMapel === kodeMapelAktif (lowercase eksak).
  const l1 = laporanSesudah.find((l) => l.id === 'l1');
  assert.equal(l1.kodeMapel, 'geo');
  assert.equal(l1.namaMapel, 'Geografi');
  const g1KodeAktif = guruSesudah.find((g) => g.id === 'g1').kodeMapel.split(',').map((x) => x.trim());
  assert.ok(g1KodeAktif.includes(l1.kodeMapel), 'laporan geo tidak ketemu di menu guru g1');
  const l2 = laporanSesudah.find((l) => l.id === 'l2');
  assert.equal(l2.kodeMapel, 'MAPEL-099'); // lokal tak terpeta = tidak disentuh
});

uji('invarian #5 — jadwal tidak menggantung ke dokumen nonaktif; siswa kosong tetap blokir (aturan owner)', () => {
  const dokumenNonaktif = new Set(rencana.nonaktif.map((v) => v.id));
  for (const j of jadwalSesudah) assert.ok(!dokumenNonaktif.has(j.mapelId), `jadwal ${j.id} menunjuk dokumen nonaktif`);
  const j1 = jadwalSesudah.find((j) => j.id === 'j1');
  assert.equal(j1.mapelId, 'd2');
  assert.equal(j1.mapelName, 'Geografi');
  const s4 = siswaSesudah.find((x) => x.id === 's4');
  assert.equal(cocokkanAksesModul(s4.enrolledSubjects, 'Matematika', 'mtk'), false); // 🔒 kosong = BLOKIR
});

uji('sanity — semua kode hasil migrasi ada di katalog kanonik atau dipertahankan apa adanya', () => {
  const dipertahankan = new Set(['MAPEL-099']); // lokal tak terpeta
  for (const s of siswaSesudah) {
    for (const e of (s.enrolledSubjects || [])) {
      assert.ok(e === 'semua' || kodeKanonik.has(e) || dipertahankan.has(e), `kode asing di siswa: ${e}`);
    }
  }
});

console.log(`\n${gagal === 0 ? '✅' : '❌'} simulasiMigrasiV2: ${lulus} lulus, ${gagal} gagal`);
process.exit(gagal === 0 ? 0 : 1);
