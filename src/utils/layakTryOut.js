// src/utils/layakTryOut.js
// ============================================================
// GERBANG KELAYAKAN BUTIR UNTUK TRY OUT OTOMATIS.
//
// KENAPA DIPISAH dari mesinTryOutOtomatis.js: berkas mesin itu mengimpor
// Firebase di tingkat modul, sehingga tidak bisa diimpor oleh test node
// polos. Predikat ini murni dan dipakai mesin di KEDUA jalur pengambilan
// soal (pool utama & jalur extra).
//
// KENAPA ADA (bug nyata 2026-10-12): jalur `extra` -- dipakai tiap kali
// pool utama kurang, persis kasus mapel miskin seperti TKA SMP Fisika yang
// stoknya 1 butir -- TIDAK menyaring status, sehingga butir terhapus/
// nonaktif bisa tercebur ke draf try out. Selain status, dua hal lain
// yang membuat soal TIDAK bisa dijawab siswa juga ditahan: tanpa kunci,
// dan gambar yang masih menunggu potongan.
//
// MURNI & TERUJI (tests/layakTryOut.test.mjs).
// ============================================================

/**
 * @param {object} s butir bank_soal
 * @returns {boolean}
 */
export function layakUntukTryOut(s = {}) {
  const status = String(s.status ?? 'aktif').toLowerCase();
  if (status !== 'aktif') return false;
  const tipe = String(s.tipe || 'pg_sederhana');
  const k = s.kunciJawaban;
  // esai sah tanpa kunci huruf: rubrik penilaiannya hidup di pembahasan.
  const berkunci = tipe === 'esai'
    ? true
    : (Array.isArray(k) ? k.length > 0 : String(k ?? '').trim().length > 0);
  if (!berkunci) return false;
  if ((s.potonganTertunda || []).length > 0) return false;
  return true;
}

export default { layakUntukTryOut };
