// src/utils/saringProdi.js
// ============================================================
// Penyaring daftar prodi untuk pemilih bertahap di halaman konsultasi.
//
// 🔥 BUG YANG DIPERBAIKI (2026-10-10, laporan owner dari layar sungguhan):
// setelah memilih kampus UNEJ, mengetik "perta" di kotak pencarian malah
// menampilkan prodi PTN LAIN (FTTM ITB, Teknik Pertambangan UNPAD, ...).
// Sebabnya pencarian dulu dirancang sebagai "jalan pintas" yang MENGGANTIKAN
// seluruh saringan cascading. Di kepala admin yang sedang konsultasi,
// sebaliknya: kotak pencarian adalah penyempit dari yang SEDANG dipilih,
// bukan pelarian ke seluruh Indonesia.
//
// Aturan sekarang:
//   - kampus terpilih   -> pencarian hanya di dalam kampus itu
//                          (dan di dalam fakultas, bila fakultas terpilih)
//   - kampus belum pilih -> pencarian menyeluruh (itu memang jalan pintasnya)
// ============================================================

/**
 * @param {object} o
 * @param {Array} o.prodi    seluruh dokumen prodi
 * @param {string} o.ptnId   id PTN yang sedang dipilih ('' bila belum)
 * @param {string} o.fakultas nama fakultas yang sedang dipilih ('' bila semua)
 * @param {string} o.cari    teks pencarian
 * @param {number} [o.batas] jumlah maksimum baris hasil pencarian
 */
export function saringProdi({ prodi = [], ptnId = '', fakultas = '', cari = '', batas = 40 }) {
  const q = String(cari || '').toLowerCase().trim();
  let basis = Array.isArray(prodi) ? prodi : [];
  if (ptnId) basis = basis.filter((p) => p.idPtn === ptnId);
  if (fakultas) basis = basis.filter((p) => p.fakultas === fakultas);
  if (!q) return [...basis].sort((a, b) => String(a.namaProdi).localeCompare(String(b.namaProdi)));
  // Tanpa kampus: nama kampus ikut jadi bahan cocok (itu jalan pintasnya).
  // Dengan kampus: cukup prodi/fakultas/kampus-cabang, supaya "perta" tidak
  // perlu mengetik ulang nama kampus yang sudah dipilih.
  const hay = (p) => (ptnId
    ? `${p.namaProdi} ${p.fakultas || ''} ${p.kampus || ''} ${p.id}`
    : `${p.namaProdi} ${p.namaPtn || ''} ${p.id}`
  ).toLowerCase();
  return basis
    .filter((p) => hay(p).includes(q))
    .slice(0, batas);
}

export default { saringProdi };
