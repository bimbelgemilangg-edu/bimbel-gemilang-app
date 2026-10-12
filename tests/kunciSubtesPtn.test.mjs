// tests/kunciSubtesPtn.test.mjs — penguraian kolom subtesKunci
// ============================================================
//     node tests/kunciSubtesPtn.test.mjs
//
// Semua kasus di bawah adalah NILAI NYATA dari kolom `Subtes_Kunci` berkas
// owner (266 prodi, 16 variasi) — bukan contoh karangan. Kalau suatu hari
// berkas sumber menambah variasi baru, test "sisa teks tak dikenal" yang akan
// menangkapnya, bukan pengguna.
// ============================================================
import assert from 'node:assert/strict';
import {
  SUBTES_UTBK, uraikanKunciSubtes, labelSubtes, mapelGemilangUntuk,
  PEMETAAN_SUBTES_KE_MAPEL, kodeUtbkUntuk,
} from '../src/utils/kunciSubtesPtn.js';
import { KATALOG_MAPEL } from '../src/utils/mesinTaksonomiSoal.js';

let lulus = 0, gagal = 0;
function uji(n, f) {
  try { f(); lulus++; console.log(`  ✓ ${n}`); }
  catch (e) { gagal++; console.log(`  ✗ ${n}\n      ${String(e.message).slice(0, 220)}`); }
}

console.log('kunciSubtesPtn — penguraian subtes kunci');

// 16 nilai yang benar-benar ada di berkas sumber, beserta jumlah barisnya.
// Kolom ke-3 adalah ID subtes dalam URUTAN BAKU SUBTES_UTBK (PU, PPU, PBM, PK,
// LBI, LBE, PM) -- bukan urutan kemunculannya di teks. PK subtes ke-4 dan PM
// ke-7, jadi "Penalaran Matematika & Kuantitatif" diuraikan jadi [PK, PM].
const NYATA = [
  ['Penalaran Umum & Pengetahuan Kuantitatif', 108, ['PU', 'PK']],
  ['Penalaran Matematika & Kuantitatif', 30, ['PK', 'PM']],
  ['Pengetahuan Kuantitatif & Penalaran Matematika', 22, ['PK', 'PM']],
  ['Penalaran Matematika & Pengetahuan Kuantitatif', 18, ['PK', 'PM']],
  ['Penalaran Umum & Literasi B. Indonesia', 16, ['PU', 'LBI']],
  ['Pengetahuan Kuantitatif & Penalaran Umum', 13, ['PU', 'PK']],
  ['Literasi B. Indonesia & Penalaran Umum', 13, ['PU', 'LBI']],
  ['Penalaran Umum & Kuantitatif', 11, ['PU', 'PK']],
  ['Penalaran Umum & Literasi B. Inggris', 11, ['PU', 'LBE']],
  ['Penalaran Matematika & Literasi B. Inggris', 6, ['LBE', 'PM']],
  ['Literasi B. Inggris & Penalaran Umum', 5, ['PU', 'LBE']],
  ['Penalaran Umum & Penalaran Matematika', 4, ['PU', 'PM']],
  ['Portofolio Seni & Penalaran Umum', 4, ['PU']],
  ['Portofolio Desain & Penalaran Umum', 2, ['PU']],
  ['Portofolio Olahraga & Penalaran Umum', 2, ['PU']],
  ['Penalaran Kuantitatif & Umum', 1, ['PU', 'PK']],
];

uji('INVARIAN: seluruh 16 nilai nyata di berkas sumber terurai benar', () => {
  let totalBaris = 0;
  for (const [teks, jumlah, harapan] of NYATA) {
    totalBaris += jumlah;
    const r = uraikanKunciSubtes(teks);
    assert.deepEqual(r.subtes, harapan, `"${teks}" -> [${r.subtes}] seharusnya [${harapan}]`);
  }
  assert.equal(totalBaris, 266, 'daftar kasus harus menutup seluruh 266 prodi');
});

uji('INVARIAN: urutan keluaran baku, bukan urutan teks', () => {
  // "Pengetahuan Kuantitatif & Penalaran Matematika" dan
  // "Penalaran Matematika & Pengetahuan Kuantitatif" adalah hal yang SAMA dan
  // harus tampil identik di kartu perbandingan.
  const a = uraikanKunciSubtes('Pengetahuan Kuantitatif & Penalaran Matematika').subtes;
  const b = uraikanKunciSubtes('Penalaran Matematika & Pengetahuan Kuantitatif').subtes;
  assert.deepEqual(a, b);
  assert.deepEqual(a, ['PK', 'PM'], 'urutan mengikuti SUBTES_UTBK (PK ke-4, PM ke-7)');
});

uji('JEBAKAN: "Penalaran Kuantitatif & Umum" tidak merusak urutan pencocokan', () => {
  // Frasa ini mengandung "penalaran" dan "kuantitatif" sekaligus. Kalau
  // "kuantitatif" dicocokkan sebelum "penalaran umum", hasilnya salah.
  const r = uraikanKunciSubtes('Penalaran Kuantitatif & Umum');
  assert.deepEqual(r.subtes, ['PU', 'PK']);
});

uji('JEBAKAN: "Pengetahuan & Pemahaman Umum" bukan "Penalaran Umum"', () => {
  // PPU dan PU beda subtes. Pencocok "penalaran umum" tidak boleh menyerapnya.
  assert.deepEqual(uraikanKunciSubtes('Pengetahuan & Pemahaman Umum').subtes, ['PPU']);
  assert.deepEqual(uraikanKunciSubtes('Pemahaman Bacaan & Menulis').subtes, ['PBM']);
});

uji('kebutuhan portofolio dipisah dari subtes, jenisnya dikenali', () => {
  const seni = uraikanKunciSubtes('Portofolio Seni & Penalaran Umum');
  assert.deepEqual(seni.portofolio, ['seni']);
  assert.deepEqual(seni.subtes, ['PU'], 'portofolio bukan subtes, jangan dicampur');

  assert.deepEqual(uraikanKunciSubtes('Portofolio Desain & Penalaran Umum').portofolio, ['desain']);
  assert.deepEqual(uraikanKunciSubtes('Portofolio Olahraga & Penalaran Umum').portofolio, ['olahraga']);
});

uji('teks kosong/null tidak melempar error dan tidak mengarang subtes', () => {
  for (const t of ['', null, undefined, '   ', '&', 0, false]) {
    const r = uraikanKunciSubtes(t);
    assert.deepEqual(r.subtes, [], `input ${JSON.stringify(t)}`);
    assert.deepEqual(r.portofolio, []);
  }
});

uji('INVARIAN: subtes yang tidak disebut TIDAK pernah ditambahkan', () => {
  // Menambah subtes yang tidak ada di sumber berarti mengarang arah belajar.
  for (const [teks, , harapan] of NYATA) {
    const r = uraikanKunciSubtes(teks);
    assert.equal(r.subtes.length, harapan.length, teks);
    for (const id of SUBTES_UTBK.map((s) => s.id)) {
      assert.equal(r.subtes.includes(id), harapan.includes(id), `${teks} / ${id}`);
    }
  }
});

uji('sisa teks yang tidak dikenali dilaporkan, bukan disembunyikan', () => {
  // Ini yang akan menangkap variasi BARU kalau berkas sumber diperbarui.
  const r = uraikanKunciSubtes('Penalaran Umum & Analisis Data Spasial');
  assert.deepEqual(r.subtes, ['PU'], 'yang dikenali tetap diambil');
  assert.ok(r.takDikenali.length > 0, 'sisanya harus dilaporkan');
  assert.ok(r.takDikenali.some((k) => /spasial/i.test(k)), `harus menyebut kata asingnya: ${r.takDikenali}`);
});

uji('kata yang sudah terserap pola tidak dilaporkan sebagai tak dikenal', () => {
  // "Portofolio Seni" sudah ditangkap sebagai portofolio jenis seni, jadi
  // kata itu tidak boleh muncul lagi di takDikenali (laporan jadi berisik
  // dan menutupi variasi baru yang sungguhan).
  const r = uraikanKunciSubtes('Portofolio Seni & Penalaran Umum');
  assert.deepEqual(r.takDikenali, [], `tidak boleh ada sisa: ${r.takDikenali}`);
});

uji('label subtes selalu berupa nama lengkap, bukan kode polos', () => {
  assert.equal(labelSubtes('PK'), 'PK — Pengetahuan Kuantitatif');
  assert.equal(labelSubtes('PM'), 'PM — Penalaran Matematika');
  assert.equal(labelSubtes('TAK_ADA'), 'TAK_ADA', 'kode tak dikenal dikembalikan apa adanya');
  assert.equal(labelSubtes(null), '', 'null tidak boleh jadi "null"');
});

uji('pemetaan ke mapel Gemilang hanya merujuk kode yang benar-benar ada di KATALOG_MAPEL', () => {
  // Kalau suatu hari KATALOG_MAPEL berubah dan kodenya hilang, pemetaan ini
  // akan diam-diam menghasilkan daftar kosong dan UI kehilangan "arah belajar".
  const kodeSah = new Set(KATALOG_MAPEL.map((m) => m.kode));
  for (const [subtes, kode] of Object.entries(PEMETAAN_SUBTES_KE_MAPEL)) {
    for (const k of kode) {
      assert.ok(kodeSah.has(k), `${subtes} -> ${k} tidak ada di KATALOG_MAPEL`);
    }
    assert.equal(mapelGemilangUntuk(subtes).length, kode.length, subtes);
  }
});

uji('sejak mapel UTBK ada, setiap subtes punya rumah sendiri di bank soal', () => {
  // 2026-10-10: dulu PU tidak punya padanan sama sekali (PEMETAAN-nya []).
  // Sekarang tujuh subtes punya kode utbk_* sendiri; padanan kurikulum tetap
  // ada sebagai lapis kedua untuk "perkuat materi dasarnya".
  for (const s of SUBTES_UTBK) {
    const m = mapelGemilangUntuk(s.id);
    const utbk = m.filter((x) => x.jenis === 'utbk');
    assert.equal(utbk.length, 1, `${s.id} harus punya tepat satu mapel UTBK`);
    assert.match(utbk[0].kode, /^utbk_/);
  }
  assert.deepEqual(mapelGemilangUntuk('PU').filter((x) => x.jenis === 'kurikulum'), [],
    'PU tetap tanpa padanan kurikulum — itu fakta taksonominya, bukan kelupaan');
  assert.deepEqual(mapelGemilangUntuk('PM').map((x) => x.kode), ['utbk_pm', 'mtk', 'mtk_tl']);
});

uji('kode UTBK diambil dari field subtes MAPEL_UTBK, bukan ditulis tangan lagi', () => {
  // Satu sumber: kalau kode di mesinTaksonomiSoal berubah, pemetaan ikut.
  for (const s of SUBTES_UTBK) {
    assert.deepEqual(kodeUtbkUntuk(s.id), PEMETAAN_SUBTES_KE_MAPEL[s.id].slice(0, 1));
  }
  assert.equal(SUBTES_UTBK.length, 7);
});

console.log(`\n  LULUS: ${lulus}  GAGAL: ${gagal}`);
if (gagal > 0) process.exit(1);
console.log('✅ Semua test lulus.');
