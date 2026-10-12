// tests/rencanaImporPtn.test.mjs — pemeriksa & penyusun rencana impor PTN
// ============================================================
//     node tests/rencanaImporPtn.test.mjs
//
// Berkas ini menguji GERBANG sebelum penulisan ke Firestore. Semua kasus
// penolakan di bawah adalah cara berkas bisa rusak di dunia nyata: unggah
// berkas lama, berkas hasil edit tangan di spreadsheet, atau builder yang
// berubah perilaku.
//
// Satu test memakai IMPOR-PTN-2026.json yang SUNGGUHAN di root repo, supaya
// gerbang ini terbukti menerima data nyata, bukan hanya contoh karangan.
// ============================================================
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  periksaBerkasImpor, rencanaPenulisan, pecahBatch, contohBaris, MAKS_DOK_PER_BATCH,
} from '../src/utils/rencanaImporPtn.js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

let lulus = 0, gagal = 0;
function uji(n, f) {
  try { f(); lulus++; console.log(`  ✓ ${n}`); }
  catch (e) { gagal++; console.log(`  ✗ ${n}\n      ${String(e.message).slice(0, 220)}`); }
}

console.log('rencanaImporPtn — gerbang sebelum penulisan');

const ptn = (o = {}) => ({ id: 'PTN-001', nama: 'Universitas Contoh', bentukPtn: 'Universitas', ...o });
const prodi = (o = {}) => ({
  // namaPtn ikut denormalisasi di dokumen prodi (persis bentuk IMPOR-PTN),
  // supaya kartu tidak perlu membaca dokumen induknya.
  id: 'X-01', idPtn: 'PTN-001', namaPtn: 'Universitas Contoh', namaProdi: 'Prodi Contoh', jenjang: 'S1',
  skorReferensi: { minimum: { nilai: 600, statusData: 'belum_verifikasi' } },
  ...o,
});
const berkas = (o = {}) => ({ ptn: [ptn()], prodi: [prodi()], ...o });

// ============================================================ YANG SAH
uji('berkas minimal yang benar diterima', () => {
  const r = periksaBerkasImpor(berkas());
  assert.equal(r.sah, true, r.alasan.join('; '));
  assert.equal(r.ringkasan.ptn, 1);
  assert.equal(r.ringkasan.prodi, 1);
});

uji('INVARIAN: catatan masalah dari builder TIDAK menghalangi impor', () => {
  // Field `masalah` adalah CATATAN untuk manusia (baris Excel rusak, website
  // kembar, ...). Kalau ia menghalangi impor, satu baris Excel yang rusak
  // akan menyandera seluruh database. Yang wajib: halaman admin
  // MENAMPILKANNYA dan minta konfirmasi eksplisit.
  const r = periksaBerkasImpor(berkas({
    masalah: [
      { tingkat: 'error', pesan: 'Bidang "S1" bukan Saintek/Soshum' },
      { tingkat: 'peringatan', pesan: 'website kembar' },
    ],
  }));
  assert.equal(r.sah, true);
  assert.equal(r.ringkasan.masalahError, 1);
  assert.equal(r.ringkasan.masalahPeringatan, 1);
});

// ========================================================= YANG DITOLAK
uji('bukan objek JSON -> ditolak tanpa melempar', () => {
  for (const j of [null, undefined, 'teks', 42, [], [ptn()]]) {
    const r = periksaBerkasImpor(j);
    assert.equal(r.sah, false, JSON.stringify(j)?.slice(0, 40));
    assert.ok(r.alasan.length > 0);
  }
});

uji('koleksi wajib hilang -> ditolak sebelum menulis', () => {
  assert.equal(periksaBerkasImpor({ prodi: [prodi()] }).sah, false, 'tanpa ptn');
  assert.equal(periksaBerkasImpor({ ptn: [ptn()] }).sah, false, 'tanpa prodi');
  assert.equal(periksaBerkasImpor({ ptn: 'bukan array', prodi: [] }).sah, false);
});

uji('id duplikat di PTN maupun prodi -> ditolak', () => {
  const dupPtn = periksaBerkasImpor(berkas({ ptn: [ptn(), ptn()] }));
  assert.equal(dupPtn.sah, false);
  assert.ok(dupPtn.alasan.some((a) => /duplikat/.test(a)));

  const dupProdi = periksaBerkasImpor(berkas({ prodi: [prodi(), prodi()] }));
  assert.equal(dupProdi.sah, false);
});

uji('INVARIAN: prodi yatim menolak SELURUH berkas', () => {
  // Prodi tanpa induk tidak akan pernah ketemu oleh query gabungan, dan tidak
  // ada cara memperbaikinya tanpa tahu prodi itu milik siapa. Menulis separuh
  // lalu berhenti di tengah lebih buruk daripada menolak utuh.
  const r = periksaBerkasImpor(berkas({ prodi: [prodi(), prodi({ id: 'Y-02', idPtn: 'PTN-999' })] }));
  assert.equal(r.sah, false);
  assert.ok(r.alasan.some((a) => /yatim/.test(a)), r.alasan.join('; '));
});

uji('id yang mengandung karakter terlarang Firestore -> ditolak', () => {
  for (const idBuruk in { 'a/b': 1, 'a#b': 1, 'a[b': 1, '': 1, '   ': 1 }) {
    const r = periksaBerkasImpor(berkas({ ptn: [ptn({ id: idBuruk })] }));
    assert.equal(r.sah, false, `id ${JSON.stringify(idBuruk)} harus ditolak`);
  }
});

uji('prodi tanpa namaProdi ditolak (jangan simpan dokumen kosong)', () => {
  const r = periksaBerkasImpor(berkas({ prodi: [prodi({ namaProdi: '' })] }));
  assert.equal(r.sah, false);
  assert.ok(r.alasan.some((a) => /namaProdi/.test(a)));
});

// ============================================================ RENCANA
uji('rencana menulis ptn lebih dulu, lalu prodi, lalu subtes & sumber', () => {
  const json = berkas({
    subtes_utbk: [{ id: 'PU', nama: 'Penalaran Umum' }],
    sumber_referensi: [{ id: 'REF-01', nama: 'SNPMB' }],
  });
  const r = rencanaPenulisan(json);
  assert.deepEqual(r.tulis.map((t) => t.koleksi), ['ptn', 'ptn_prodi', 'subtes_utbk', 'sumber_referensi']);
  assert.equal(r.jumlah.total, 4);
  assert.equal(r.tulis[1].idPtn, 'PTN-001', 'prodi harus membawa induknya untuk path subkoleksi');
});

uji('INVARIAN: rencana stabil — impor ulang menghasilkan operasi yang sama', () => {
  // Idempotensi bergantung pada ini: ID dokumen dari ID berkas, dan urutan
  // tidak boleh bergantung pada keadaan internal apa pun.
  const json = berkas({ prodi: [prodi(), prodi({ id: 'X-02' })] });
  const a = rencanaPenulisan(json);
  const b = rencanaPenulisan(json);
  assert.deepEqual(a.tulis.map((t) => [t.koleksi, t.id]), b.tulis.map((t) => [t.koleksi, t.id]));
});

uji('pecahBatch menghormati batas Firestore dan tidak kehilangan dokumen', () => {
  const tulis = Array.from({ length: 1000 }, (_, i) => ({ koleksi: 'ptn', id: `P-${i}`, data: {} }));
  const chunks = pecahBatch(tulis);
  assert.ok(chunks.every((c) => c.length <= MAKS_DOK_PER_BATCH));
  assert.equal(chunks.reduce((a, c) => a + c.length, 0), 1000);
  assert.equal(chunks.length, 3, '1000 / 400 = 3 batch');

  assert.deepEqual(pecahBatch([]), [], 'kosong tidak menghasilkan batch hampa');
  assert.equal(pecahBatch(tulis, 9999).length, 3, 'ukuran di atas batas dipotong ke batas 400');
  assert.equal(pecahBatch(tulis, 0).length, 1000, 'ukuran 0 tidak boleh jadi batch raksasa');
});

uji('contohBaris mengambil cuplikan yang cukup untuk pratinjau manusia', () => {
  const c = contohBaris(berkas({ prodi: [prodi(), prodi({ id: 'X-02', namaProdi: 'Lain' })] }), 3);
  assert.equal(c.length, 2, 'hanya sebanyak yang ada');
  assert.equal(c[0].skorMinimum, 600);
  assert.equal(c[0].statusSkor, 'belum_verifikasi', 'status data ikut tampil, bukan disembunyikan');
  assert.equal(c[0].namaPtn, 'Universitas Contoh');
});

// ================================================== BERKAS SUNGGUHAN
uji('IMPOR-PTN-2026.json yang asli lolos gerbang dengan jumlah yang benar', () => {
  const jalan = join(ROOT, 'IMPOR-PTN-2026.json');
  if (!existsSync(jalan)) {
    // Berkasnya bagian dari repo; kalau hilang, itu kegagalan yang berbeda dan
    // harus terlihat, bukan dilewati diam-diam.
    assert.fail('IMPOR-PTN-2026.json tidak ditemukan di root repo');
  }
  const json = JSON.parse(readFileSync(jalan, 'utf-8'));
  const r = periksaBerkasImpor(json);
  assert.equal(r.sah, true, r.alasan.join('; '));
  assert.equal(r.ringkasan.ptn, 157);
  assert.equal(r.ringkasan.prodi, 266);
  assert.equal(r.ringkasan.subtes, 7);
  assert.equal(r.ringkasan.sumber, 7);
  assert.equal(r.ringkasan.masalahError, 4, 'catatan error ikut terbawa untuk konfirmasi');
  assert.equal(r.ringkasan.statusDataSeluruhnya, 'belum_verifikasi');

  const rencana = rencanaPenulisan(json);
  assert.equal(rencana.jumlah.total, 157 + 266 + 7 + 7);
  const chunks = pecahBatch(rencana.tulis);
  assert.ok(chunks.every((c) => c.length <= MAKS_DOK_PER_BATCH));
  assert.ok(chunks.length >= 2, '437 dokumen tidak muat satu batch');
});

uji('INVARIAN: setiap prodi di berkas asli punya induk PTN', () => {
  const json = JSON.parse(readFileSync(join(ROOT, 'IMPOR-PTN-2026.json'), 'utf-8'));
  const idPtn = new Set(json.ptn.map((p) => p.id));
  const yatim = json.prodi.filter((p) => !idPtn.has(p.idPtn));
  assert.equal(yatim.length, 0, `ada ${yatim.length} prodi yatim`);
});

console.log(`\n  LULUS: ${lulus}  GAGAL: ${gagal}`);
if (gagal > 0) process.exit(1);
console.log('✅ Semua test lulus.');
