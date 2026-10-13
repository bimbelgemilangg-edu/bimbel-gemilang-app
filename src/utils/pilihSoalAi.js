// src/utils/pilihSoalAi.js
// ============================================================
// VALIDATOR KELUARAN AI PEMILIH SOAL — "AI mengusulkan, sistem memutuskan".
// AI (Gemini, server-side) menerima kolam ringkasan butir + kisi-kisi dan
// mengembalikan urutan id + alasan. Berkas ini yang MENAGIH kontrak itu:
// id harus anggota kolam, jumlah persis, tanpa duplikat. Gagal => mesin
// jatuh ke pemilihan deterministik dan pengakuan fallback tersimpan.
// MURNI & TERUJI (tests/pilihSoalAi.test.mjs).
// ============================================================

/** Ringkasan butir yang aman dikirim ke AI (tanpa kunci/pembahasan). */
export function ringkasButirUntukAi(s = {}) {
  return {
    id: String(s.id ?? ''),
    kode: String(s.kodeSumber || '').slice(0, 40),
    teks: String(s.teksSoal || s.soal || '').replace(/\s+/g, ' ').slice(0, 140),
    kelas: String(s.kelas || s.tingkatKelas || ''),
    tipe: String(s.tipe || ''),
  };
}

/**
 * @param {object} jawabanAi { pilihan: [{id, alasan}] , ragu?: [id], model?: string }
 * @param {Set<string>} kolamIds
 * @param {number} butuh
 */
export function validasiPilihanAi(jawabanAi, kolamIds, butuh) {
  const daftar = Array.isArray(jawabanAi?.pilihan) ? jawabanAi.pilihan : [];
  if (!daftar.length) return { ok: false, alasanGagal: 'AI tidak mengembalikan daftar pilihan' };
  const lihat = new Set();
  const urutan = [];
  for (const p of daftar) {
    const id = String(p?.id ?? '');
    if (!kolamIds.has(id)) return { ok: false, alasanGagal: `AI memilih id di luar kolam: ${id}` };
    if (lihat.has(id)) return { ok: false, alasanGagal: `AI menduplikat id: ${id}` };
    lihat.add(id);
    urutan.push({ id, alasan: String(p?.alasan || '').slice(0, 220) });
  }
  if (urutan.length !== Number(butuh)) {
    return { ok: false, alasanGagal: `AI mengembalikan ${urutan.length} id, diminta ${butuh}` };
  }
  return { ok: true, urutan, ragu: Array.isArray(jawabanAi?.ragu) ? jawabanAi.ragu.map(String) : [] };
}

export default { ringkasButirUntukAi, validasiPilihanAi };
