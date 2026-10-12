// src/utils/rencanaImporPtn.js
// ============================================================
// Susun RENCANA penulisan database PTN dari berkas IMPOR-PTN-*.json, tanpa
// menyentuh Firestore. Yang mengeksekusi rencananya: services/imporPtnService.js.
// Dipisah begini supaya rencana bisa DIPERIKSA & DIUJI sebelum satu dokumen pun
// ditulis -- mengikuti pola repo: logika yang bisa salah hidup di utils, punya test.
//
// 🔥 ATURAN YANG DIPEGANG
// 1. Idempoten. Document ID diambil dari ID berkas (PTN-077, UNEJ-01, ...), jadi
//    impor ulang tidak menduplikasi -- ia menimpa dokumen yang sama. Ini juga
//    alasan penulisan memakai set/overwrite, bukan add.
// 2. Menolak lebih dulu daripada menulis separuh. Berkas yang strukturnya
//    tidak dikenali ditolak UTUH sebelum batch pertama jalan, karena Firestore
//    tidak punya transaksi lintas-dokumen yang murah untuk 400+ dokumen dan
//    impor yang berhenti di tengah meninggalkan database separuh terisi.
// 3. Prodi yatim (idPtn-nya tidak ada di daftar PTN) menolak berkas. Subkoleksi
//    prodi hidup di bawah ptn/{id}; menulis prodi tanpa induk membuat ia tidak
//    pernah ketemu oleh query gabungan, dan tidak ada cara memperbaikinya
//    tanpa tahu prodi itu milik siapa.
// 4. Masalah bawaan berkas (field `masalah` hasil builder) TIDAK menghalangi
//    impor -- itu catatan untuk manusia, bukan kesalahan struktur. Halaman
//    admin wajib menampilkannya dan meminta konfirmasi eksplisit.
// ============================================================

export const MAKS_DOK_PER_BATCH = 400; // batas Firestore 500 op/batch, disisakan ruang

const KOLEKSI_WAJIB = ['ptn', 'prodi'];

function idSah(v) {
  return typeof v === 'string' && v.trim().length > 0 && !/[\s/#[\]]/.test(v);
}

/**
 * Periksa struktur berkas sebelum apa pun ditulis.
 *
 * @param {object} json hasil parse IMPOR-PTN-*.json
 * @returns {{sah: boolean, alasan: string[], ringkasan: object}}
 */
export function periksaBerkasImpor(json) {
  const alasan = [];
  if (!json || typeof json !== 'object' || Array.isArray(json)) {
    return { sah: false, alasan: ['Berkas bukan objek JSON'], ringkasan: null };
  }
  for (const k of KOLEKSI_WAJIB) {
    if (!Array.isArray(json[k])) alasan.push(`koleksi "${k}" tidak ada atau bukan array`);
  }
  if (alasan.length) return { sah: false, alasan, ringkasan: null };

  const ptn = json.ptn;
  const prodi = json.prodi;

  const idPtn = new Set();
  ptn.forEach((p, i) => {
    if (!idSah(p?.id)) alasan.push(`ptn[${i}] tanpa id yang sah`);
    else if (idPtn.has(p.id)) alasan.push(`ptn id "${p.id}" duplikat`);
    else idPtn.add(p.id);
    if (!p?.nama) alasan.push(`ptn[${i}] (${p?.id ?? '?'}) tanpa nama`);
  });

  const idProdi = new Set();
  let yatim = 0;
  prodi.forEach((p, i) => {
    if (!idSah(p?.id)) { alasan.push(`prodi[${i}] tanpa id yang sah`); return; }
    if (idProdi.has(p.id)) alasan.push(`prodi id "${p.id}" duplikat`);
    idProdi.add(p.id);
    if (!p?.namaProdi) alasan.push(`prodi[${i}] (${p.id}) tanpa namaProdi`);
    if (!idSah(p?.idPtn)) alasan.push(`prodi[${i}] (${p.id}) tanpa idPtn`);
    else if (!idPtn.has(p.idPtn)) yatim += 1;
  });
  if (yatim > 0) {
    alasan.push(`${yatim} prodi menunjuk idPtn yang tidak ada di daftar PTN (prodi yatim)`);
  }

  // subtes & sumber opsional: kalau ada, harus berbentuk array dokumen ber-id.
  for (const k of ['subtes_utbk', 'sumber_referensi']) {
    if (json[k] !== undefined && !Array.isArray(json[k])) {
      alasan.push(`koleksi "${k}" ada tapi bukan array`);
    }
  }

  const masalah = Array.isArray(json.masalah) ? json.masalah : [];
  const ringkasan = {
    ptn: ptn.length,
    prodi: prodi.length,
    subtes: Array.isArray(json.subtes_utbk) ? json.subtes_utbk.length : 0,
    sumber: Array.isArray(json.sumber_referensi) ? json.sumber_referensi.length : 0,
    masalahError: masalah.filter((m) => m?.tingkat === 'error').length,
    masalahPeringatan: masalah.filter((m) => m?.tingkat === 'peringatan').length,
    dibangunDari: json._meta?.dibangunDari || null,
    dibangunPada: json._meta?.dibangunPada || null,
    tahunSeleksi: json._meta?.tahunSeleksi || null,
    statusDataSeluruhnya: json._meta?.statusDataSeluruhnya || null,
    peringatanMeta: Array.isArray(json._meta?.peringatan) ? json._meta.peringatan : [],
  };
  return { sah: alasan.length === 0, alasan, ringkasan };
}

/**
 * Susun daftar operasi tulis. Urutannya stabil supaya progres bisa dilaporkan
 * dan impor yang diulang menghasilkan operasi yang sama persis.
 *
 * @returns {{tulis: Array<{koleksi: string, idPtn?: string, id: string, data: object}>, jumlah: object}}
 */
export function rencanaPenulisan(json) {
  const tulis = [];
  for (const p of json?.ptn || []) {
    tulis.push({ koleksi: 'ptn', id: p.id, data: p });
  }
  for (const p of json?.prodi || []) {
    tulis.push({ koleksi: 'ptn_prodi', idPtn: p.idPtn, id: p.id, data: p });
  }
  for (const s of json?.subtes_utbk || []) {
    tulis.push({ koleksi: 'subtes_utbk', id: s.id, data: s });
  }
  for (const s of json?.sumber_referensi || []) {
    tulis.push({ koleksi: 'sumber_referensi', id: s.id, data: s });
  }
  const jumlah = {
    ptn: (json?.ptn || []).length,
    prodi: (json?.prodi || []).length,
    subtes: (json?.subtes_utbk || []).length,
    sumber: (json?.sumber_referensi || []).length,
    total: tulis.length,
  };
  return { tulis, jumlah };
}

/**
 * Pecah operasi tulis menjadi batch yang aman untuk Firestore.
 * @param {Array} tulis
 * @param {number} [ukuran]
 */
export function pecahBatch(tulis = [], ukuran = MAKS_DOK_PER_BATCH) {
  const n = Math.max(1, Math.min(ukuran, MAKS_DOK_PER_BATCH));
  const hasil = [];
  for (let i = 0; i < tulis.length; i += n) hasil.push(tulis.slice(i, i + n));
  return hasil;
}

/**
 * Ringkasan satu baris untuk ditampilkan di pratinjau halaman admin.
 * Dipakai supaya admin melihat CONTOH ISI sebelum menekan tombol tulis --
 * pratinjau yang hanya menampilkan jumlah membuat impor terasa seperti
 * "percaya saja".
 */
export function contohBaris(json, jumlah = 3) {
  return (json?.prodi || []).slice(0, jumlah).map((p) => ({
    id: p.id,
    namaPtn: p.namaPtn,
    namaProdi: p.namaProdi,
    jenjang: p.jenjang,
    skorMinimum: p.skorReferensi?.minimum?.nilai ?? null,
    statusSkor: p.skorReferensi?.minimum?.statusData ?? null,
    dayaTampung: p.dayaTampung?.nilai ?? null,
  }));
}

export default { periksaBerkasImpor, rencanaPenulisan, pecahBatch, contohBaris, MAKS_DOK_PER_BATCH };
