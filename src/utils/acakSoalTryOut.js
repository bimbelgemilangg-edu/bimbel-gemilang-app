// src/utils/acakSoalTryOut.js
// ============================================================
// Acak urutan soal SUPAYA BEDA antar siswa (anti-nyontek nomor
// jawaban dari teman sebelah), TAPI KONSISTEN buat siswa yang sama
// tiap kali dia buka/reload halaman try out (bukan acak ulang tiap
// render, yang bisa bikin bingung/nomor soal loncat-loncat).
//
// Caranya: bikin "seed" (angka) dari gabungan studentId + paketId,
// terus pakai seed itu buat acak yang deterministik -- seed yang sama
// SELALU menghasilkan urutan acak yang SAMA PERSIS.
// ============================================================

function buatSeed(teks) {
    let hash = 0;
    for (let i = 0; i < teks.length; i++) {
      hash = (hash << 5) - hash + teks.charCodeAt(i);
      hash |= 0;
    }
    return hash;
  }
  
  function acakDenganSeed(daftar, seed) {
    const arr = [...daftar];
    let s = seed;
    const random = () => {
      s = (s * 1103515245 + 12345) & 0x7fffffff;
      return s / 0x7fffffff;
    };
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }
  
  /**
   * @param {Array} daftarSoal - array soal (atau apapun) yang mau diacak urutannya
   * @param {string} studentId
   * @param {string} paketId
   * @param {string} garam - opsional, buat bikin urutan acak BEDA di konteks
   *   berbeda walau studentId+paketId sama (mis. per-subtes, biar urutan
   *   subtes A gak "mirip pola" sama subtes B punya siswa yang sama)
   */
  export function acakSoalPerSiswa(daftarSoal, studentId, paketId, garam = '') {
    const seed = buatSeed(`${studentId}_${paketId}_${garam}`);
    return acakDenganSeed(daftarSoal, seed);
  }