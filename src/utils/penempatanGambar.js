// src/utils/penempatanGambar.js
// ============================================================
// Menempatkan gambar DI POSISI placeholder-nya di badan soal.
//
// KENAPA ADA (keluhan owner 2026-10-05, terlihat di screenshot halaman
// pantau): badan soal tercetak "...refleksnya normal. {{GAMBAR}}
// Berdasarkan gambar struktur otak di atas..." -- token mentah terlihat
// oleh siswa DAN guru, sementara gambarnya sendiri ditumpuk di AKHIR
// teks. Placeholder {{GAMBAR}}, {{GAMBAR_2}}, dst. adalah konvensi
// pipeline impor (ImportHasilScanPage.jsx: "boleh disisipkan di teks_soal
// untuk posisi gambar tertentu; kalau tidak ada placeholder, sistem
// otomatis taruh semua gambar di akhir teks soal") -- tetapi TIDAK ADA
// satu pun renderer yang mengonsumsinya. Jadi kontraknya setengah jalan:
// penulis menandai posisi, pembaca mengabaikannya.
//
// ATURAN PENEMPATAN (menghormati kontrak lama):
//   - placeholder ke-k (urutan kemunculan) memakai gambarUrls[k]
//   - placeholder tanpa gambar sisa  -> dibuang senyap (jangan mencetak
//     token mentah, jangan mencetak gambar rusak)
//   - gambar sisa tanpa placeholder  -> diletakkan di AKHIR (perilaku lama
//     untuk soal yang tidak memakai placeholder sama sekali)
//   - teks di antara placeholder tetap utuh, termasuk rumus $...$
//
// MURNI & TERUJI (tests/penempatanGambar.test.mjs) karena dipakai lima
// tempat render + mesin cetak; salah penempatan = siswa membaca soal
// yang kalimatnya terputus dari gambarnya.
// ============================================================

const RE_PLACEHOLDER = /\{\{GAMBAR(?:_\d+)?\}\}/g;

/**
 * @param {string} teks        badan soal (boleh memuat placeholder)
 * @param {string[]} [gambarUrls] daftar gambar butir soal
 * @returns {Array<{jenis:'teks',isi:string}|{jenis:'gambar',url:string,indeks:number}>}
 */
export function pisahTeksDanGambar(teks, gambarUrls = []) {
  const gambar = Array.isArray(gambarUrls) ? gambarUrls.filter(Boolean) : [];
  const sumber = String(teks ?? '');
  const segmen = [];
  let buffer = '';
  let pakai = 0;
  let terakhir = 0;
  let m;

  const flush = () => {
    if (buffer.trim()) segmen.push({ jenis: 'teks', isi: buffer.replace(/\s+/g, ' ').trim() });
    buffer = '';
  };

  RE_PLACEHOLDER.lastIndex = 0;
  while ((m = RE_PLACEHOLDER.exec(sumber)) !== null) {
    buffer += sumber.slice(terakhir, m.index);
    if (pakai < gambar.length) {
      // placeholder terpenuhi: teks sebelum gambar ditutup, gambar masuk
      // persis di posisi yang ditunjuk kalimat.
      flush();
      segmen.push({ jenis: 'gambar', url: gambar[pakai], indeks: pakai });
      pakai += 1;
    } else {
      // placeholder tanpa gambar: lenyap INLINE sebagai satu spasi, supaya
      // kalimat tidak terbelah jadi dua baris dan token tidak tercetak.
      buffer += ' ';
    }
    terakhir = m.index + m[0].length;
  }
  buffer += sumber.slice(terakhir);
  flush();

  // gambar sisa tanpa placeholder -> di akhir (perilaku lama dipertahankan)
  while (pakai < gambar.length) {
    segmen.push({ jenis: 'gambar', url: gambar[pakai], indeks: pakai });
    pakai += 1;
  }
  return segmen;
}

/** True bila teks masih memuat placeholder yang TIDAK terpenuhi gambar. */
export function adaPlaceholderBocor(teks, gambarUrls = []) {
  const jumlah = (String(teks ?? '').match(RE_PLACEHOLDER) || []).length;
  const gambar = Array.isArray(gambarUrls) ? gambarUrls.filter(Boolean).length : 0;
  return jumlah > gambar;
}

export default { pisahTeksDanGambar, adaPlaceholderBocor };
