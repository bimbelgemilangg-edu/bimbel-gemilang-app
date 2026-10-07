// src/utils/penempatanGambar.js
// ============================================================
// Menempatkan gambar DI POSISI placeholder-nya di badan soal / pembahasan.
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
// 🔥 2026-10-07 (kajian PDF Kinematika @my99dreams): token BERNOMOR kini
// dihormati ANGKANYA, bukan sekadar urutan kemunculan. Sebab ekstraktor
// sadar-region menaruh token juga di PEMBAHASAN dan di OPSI: pembahasan
// yang menyebut {{GAMBAR_3}} harus memakai gambarUrls[2], bukan gambar
// pertama yang kebetulan muncul lebih dulu di teks itu. Token polos
// {{GAMBAR}} tetap memakai aturan lama (gambar berikutnya yang belum
// dipakai), sehingga berkas lama tidak berubah perilaku.
//
// ATURAN PENEMPATAN (menghormati kontrak lama):
//   - {{GAMBAR_n}} -> gambarUrls[n-1] bila ada dan belum terpakai
//   - {{GAMBAR}}   -> gambar berikutnya (urutan kemunculan) yang belum
//                     terpakai
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

const RE_PLACEHOLDER = /\{\{GAMBAR(?:_(\d+))?\}\}/g;

/**
 * @param {string} teks        badan soal/pembahasan (boleh memuat placeholder)
 * @param {string[]} [gambarUrls] daftar gambar butir soal (sejajar indeks)
 * @param {object} [opts]      { meta: gambarMeta sejajar urls (boleh kosong),
 *                              region: 'badan'|'pembahasan'|'opsi' teks ini }
 *   Bila `meta` berisi region asal tiap gambar (kontrak 2026-10-07), gambar
 *   sisa TANPA placeholder hanya ditempel di akhir teks region-nya SENDIRI
 *   -- grafik opsi tidak boleh menumpuk di akhir pembahasan, dan diagram
 *   pembahasan tidak boleh nyasar ke akhir badan soal. Tanpa `meta`
 *   (berkas lama) perilaku lama dipertahankan utuh.
 * @returns {Array<{jenis:'teks',isi:string}|{jenis:'gambar',url:string,indeks:number}>}
 */
export function pisahTeksDanGambar(teks, gambarUrls = [], opts = {}) {
  const gambar = Array.isArray(gambarUrls) ? gambarUrls.filter(Boolean) : [];
  const meta = Array.isArray(opts?.meta) ? opts.meta : null;
  const region = opts?.region || 'badan';
  const sumber = String(teks ?? '');
  const segmen = [];
  const terpakai = new Set();
  let buffer = '';
  let berikutnya = 0;
  let terakhir = 0;
  let m;

  const flush = () => {
    if (buffer.trim()) segmen.push({ jenis: 'teks', isi: buffer.replace(/\s+/g, ' ').trim() });
    buffer = '';
  };

  const ambilBerikutnya = () => {
    while (berikutnya < gambar.length && terpakai.has(berikutnya)) berikutnya += 1;
    if (berikutnya >= gambar.length) return -1;
    return berikutnya;
  };

  RE_PLACEHOLDER.lastIndex = 0;
  while ((m = RE_PLACEHOLDER.exec(sumber)) !== null) {
    buffer += sumber.slice(terakhir, m.index);
    let indeks = -1;
    if (m[1]) {
      const n = Number(m[1]) - 1;
      if (n >= 0 && n < gambar.length && !terpakai.has(n)) indeks = n;
    } else {
      indeks = ambilBerikutnya();
    }
    if (indeks >= 0) {
      // placeholder terpenuhi: teks sebelum gambar ditutup, gambar masuk
      // persis di posisi yang ditunjuk kalimat.
      flush();
      segmen.push({ jenis: 'gambar', url: gambar[indeks], indeks });
      terpakai.add(indeks);
    } else {
      // placeholder tanpa gambar: lenyap INLINE sebagai satu spasi, supaya
      // kalimat tidak terbelah jadi dua baris dan token tidak tercetak.
      buffer += ' ';
    }
    terakhir = m.index + m[0].length;
  }
  buffer += sumber.slice(terakhir);
  flush();

  // gambar sisa tanpa placeholder -> di akhir (perilaku lama dipertahankan),
  // KECUALI bila meta region tersedia: sisa hanya milik region teks ini.
  for (let i = 0; i < gambar.length; i += 1) {
    if (terpakai.has(i)) continue;
    if (meta) {
      const regionGambar = String(meta[i]?.region || 'badan');
      if (regionGambar !== region) continue;
    }
    segmen.push({ jenis: 'gambar', url: gambar[i], indeks: i });
  }
  return segmen;
}

/** True bila teks masih memuat placeholder yang TIDAK terpenuhi gambar. */
export function adaPlaceholderBocor(teks, gambarUrls = []) {
  const gambar = Array.isArray(gambarUrls) ? gambarUrls.filter(Boolean) : [];
  const terpakai = new Set();
  let polos = 0;
  for (const m of String(teks ?? '').matchAll(RE_PLACEHOLDER)) {
    if (m[1]) {
      const n = Number(m[1]) - 1;
      if (n >= 0 && n < gambar.length && !terpakai.has(n)) terpakai.add(n);
      // nomor ganda dianggap bocor pada kemunculan kedua: ditandai terpakai
      // saja di atas tidak cukup, jadi cek eksplisit:
      else return true;
    } else {
      polos += 1;
    }
  }
  const sisa = gambar.length - terpakai.size;
  return polos > sisa;
}

export default { pisahTeksDanGambar, adaPlaceholderBocor };
