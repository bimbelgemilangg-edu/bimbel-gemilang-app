// src/utils/potongPresisi.js
// ============================================================
// POTONG PRESISI — logika murni perbaikan gambar soal dari berkas asli.
//
// KENAPA ADA (keluhan owner 2026-10-07, alur HTML Master Gemini Canvas):
//   "Hasil soalnya bagus, tapi gambar soalnya tidak presisi — itu gambar
//    buatan AI, bukan potongan dari scan aslinya."
//   Kajian kami (uploads/bank_soal_gemilang_kimia.html vs
//   11 Bonus @my99dreams.pdf): pencocokan pola-tinta crop AI terhadap
//   halaman asli hanya mencetak skor 0.26–0.38 → mencari posisi otomatis
//   dari gambar buatan AI TIDAK ANDAL. Jawaban jujurnya bukan algoritma
//   lebih pintar, tapi alat bantu manusia: pemilik membuka halaman
//   scan/PDF aslinya, menyeret kotak di atas figur yang benar, alat
//   merapikan kotak ke tepi tinta, hasilnya diunggah dan DIPASANG ke
//   soal — menggantikan gambar berflag ⚠️ (base64 tanpa pengakuan asal)
//   atau mengisi antrean ✂️ `potonganTertunda`.
//
// BERKAS INI MURNI & TERUJI (tests/potongPresisi.test.mjs). Urusan
// kanvas, pdf.js, upload Supabase, dan Firestore hidup di halaman
// src/pages/admin/bank-soal/PotongPresisiPage.jsx — pemisahan yang sama
// seperti ekstrakHtmlGemini (kontrak) vs ImporHtmlGeminiPage (klik).
//
// TANGGA GAMBAR ASLI (aturan 10 prompt paten): hasil potongan alat ini
// diberi asal 'potongan-asli' — nilai yang SUDAH diakui sah oleh
// validator (SUMBER_GAMBAR_SAHIH di ekstrakHtmlGemini.js) — plus cap
// audit `dipotongPresisi: { alat, ts }` di entri gambarMeta supaya bisa
// dibedakan dari base64 warisan yang diakui Gemini.
// ============================================================

/** Nilai `gambarMeta.asal` yang menandai gambar perlu diperiksa manusia. */
export const FLAG_ASAL_GAMBAR = ['base64-tanpa-asal', 'tak-dikenal'];

const bulat = (n) => Math.round(Number(n) || 0);
const jepit = (n, min, max) => Math.min(Math.max(n, min), max);

/**
 * Normalisasi + kunci kotak potongan ke dalam kanvas.
 * Seret pengguna boleh menghasilkan lebar/tinggi negatif (arah bebas);
 * kotak di luar kanvas dipotong; kotak terlalu kecil → null (halaman
 * menampilkan pesan jujur, bukan menyimpan potongan 1 piksel).
 * @returns {{x:number,y:number,lebar:number,tinggi:number}|null}
 */
export function kunciRect(rect, lebarKanvas, tinggiKanvas, minimum = 8) {
  if (!rect || !(lebarKanvas > 0) || !(tinggiKanvas > 0)) return null;
  let x = bulat(rect.x);
  let y = bulat(rect.y);
  let w = bulat(rect.lebar ?? rect.w);
  let h = bulat(rect.tinggi ?? rect.h);
  if (w < 0) { x += w; w = -w; }
  if (h < 0) { y += h; h = -h; }
  const x0 = jepit(x, 0, lebarKanvas);
  const y0 = jepit(y, 0, tinggiKanvas);
  const x1 = jepit(x + w, 0, lebarKanvas);
  const y1 = jepit(y + h, 0, tinggiKanvas);
  const hasil = { x: x0, y: y0, lebar: x1 - x0, tinggi: y1 - y0 };
  if (hasil.lebar < minimum || hasil.tinggi < minimum) return null;
  return hasil;
}

/**
 * Kotak pembatas (bounding box) piksel "tinta" di dalam sebuah rect.
 * `piksel` = { data: Uint8ClampedArray RGBA, lebar, tinggi, asalX?, asalY? }
 * — data boleh berupa JENDELA halaman (asalX/asalY = posisi sudut kiri
 * atas jendela dalam koordinat halaman penuh), supaya pemanggil tidak
 * perlu getImageData 30 MB untuk satu klik.
 * Tinta = piksel dengan luminance < ambang dan alpha >= 128.
 * @returns {{x0:number,y0:number,x1:number,y1:number}|null} koordinat HALAMAN inklusif
 */
export function bboxTinta(piksel, rect, ambang = 200) {
  if (!piksel?.data || !rect) return null;
  const asalX = bulat(piksel.asalX);
  const asalY = bulat(piksel.asalY);
  const rx0 = bulat(rect.x) - asalX;
  const ry0 = bulat(rect.y) - asalY;
  const rx1 = rx0 + bulat(rect.lebar ?? rect.w);
  const ry1 = ry0 + bulat(rect.tinggi ?? rect.h);
  // Rect dan jendela data tidak beririsan sama sekali → tak ada yang dicari.
  if (rx1 <= 0 || ry1 <= 0 || rx0 >= piksel.lebar || ry0 >= piksel.tinggi) return null;
  const x0 = jepit(rx0, 0, piksel.lebar - 1);
  const y0 = jepit(ry0, 0, piksel.tinggi - 1);
  const x1 = jepit(rx1, 1, piksel.lebar);
  const y1 = jepit(ry1, 1, piksel.tinggi);
  let minX = null; let minY = null; let maxX = null; let maxY = null;
  for (let y = y0; y < y1; y += 1) {
    for (let x = x0; x < x1; x += 1) {
      const i = (y * piksel.lebar + x) * 4;
      const a = piksel.data[i + 3];
      if (a < 128) continue;
      const luminance = 0.299 * piksel.data[i] + 0.587 * piksel.data[i + 1] + 0.114 * piksel.data[i + 2];
      if (luminance >= ambang) continue;
      if (minX === null || x < minX) minX = x;
      if (maxX === null || x > maxX) maxX = x;
      if (minY === null || y < minY) minY = y;
      if (maxY === null || y > maxY) maxY = y;
    }
  }
  if (minX === null) return null;
  return { x0: minX + asalX, y0: minY + asalY, x1: maxX + asalX + 1, y1: maxY + asalY + 1 };
}

/**
 * Rapikan kotak potongan ke tepi tinta: cari tinta di rect yang
 * diperlebar `cari` piksel (menangkap garis figur yang sedikit terlewat
 * seret), lalu kunci ke bbox tinta + `margin` bantalan putih.
 * @returns rect baru (sudah dikunciRect) atau null bila tak ada tinta
 *          di sekitar kotak — pemanggil WAJIB memberi tahu pengguna,
 *          jangan diam-diam mengembalikan kotak lama.
 */
export function snapKeTinta(rect, piksel, { ambang = 200, margin = 8, cari = 16, lebarHalaman = 0, tinggiHalaman = 0 } = {}) {
  if (!piksel?.data) return null;
  // Dimensi HALAMAN PENUH untuk penguncian: eksplisit bila pemanggil punya
  // (kanvas sumber), fallback ke batas jendela data.
  const lebarPage = lebarHalaman > 0 ? lebarHalaman : bulat(piksel.asalX) + piksel.lebar;
  const tinggiPage = tinggiHalaman > 0 ? tinggiHalaman : bulat(piksel.asalY) + piksel.tinggi;
  const r = kunciRect(rect, lebarPage, tinggiPage);
  if (!r) return null;
  const areaCari = {
    x: r.x - cari,
    y: r.y - cari,
    lebar: r.lebar + cari * 2,
    tinggi: r.tinggi + cari * 2,
  };
  const bbox = bboxTinta(piksel, areaCari, ambang);
  if (!bbox) return null;
  return kunciRect(
    {
      x: bbox.x0 - margin,
      y: bbox.y0 - margin,
      lebar: bbox.x1 - bbox.x0 + margin * 2,
      tinggi: bbox.y1 - bbox.y0 + margin * 2,
    },
    lebarPage,
    tinggiPage,
    4,
  );
}

/**
 * Apakah sebuah dokumen bank_soal butuh kunjungan editor potong?
 * - `menunggu`  : jumlah entri potonganTertunda (✂️ figur belum ada gambarnya)
 * - `dicurigai` : indeks gambarUrls yang meta.asal-nya berflag (⚠️ buatan model)
 * Dokumen lama tanpa gambarMeta TIDAK dicurigai (tidak ada pengakuan asal
 * untuk dinilai — menebak = menuduh).
 */
export function butuhPerbaikanGambar(dok = {}) {
  const menunggu = Array.isArray(dok.potonganTertunda) ? dok.potonganTertunda.filter(Boolean).length : 0;
  const meta = Array.isArray(dok.gambarMeta) ? dok.gambarMeta : [];
  const dicurigai = [];
  meta.forEach((m, i) => {
    if (FLAG_ASAL_GAMBAR.includes(String(m?.asal || ''))) dicurigai.push(i);
  });
  return { menunggu, dicurigai };
}

/** Nama berkas potongan untuk jalur storage + kunci upload. */
export function namaPotongan({ soalId = 'soal', urutan = 1 } = {}) {
  const id = String(soalId).replace(/[^a-zA-Z0-9-]/g, '_').slice(0, 40) || 'soal';
  return `potongan-presisi_${id}_${bulat(urutan) || 1}.png`;
}

/**
 * Bangun pembaruan dokumen bank_soal setelah satu potongan tersimpan.
 * MURNI: menerima dokumen + target, mengembalikan field yang berubah —
 * halaman tinggal updateDoc(). Dua mode:
 *
 *  jenis 'ganti' (indeksGambar): URL di gambarUrls[i] DIGANTI hasil
 *    potongan; gambarMeta[i] dicap {asal:'potongan-asli', dipotongPresisi};
 *    opsiJawaban kaya ({teks, gambar:[{url}]}) yang menunjuk URL lama
 *    ikut diselaraskan — kalau tidak, opsi tetap menampilkan crop AI.
 *
 *  jenis 'tambah' (indeksTertunda): satu entri potonganTertunda
 *    DISELESAIKAN — URL ditambahkan di akhir gambarUrls + meta ber-region
 *    (penempatanGambar menaruh gambar sisa di akhir teks region-nya),
 *    entri antrean dibuang.
 *
 * @returns {{ok:true, perubahan:object}|{ok:false, galat:string}}
 */
export function terapkanPotongan(dok = {}, opt = {}) {
  const {
    jenis,
    indeksGambar = -1,
    indeksTertunda = -1,
    url = '',
    berkasSumber = '',
    caption = '',
    region = '',
    ts = new Date().toISOString(),
  } = opt || {};

  // Firestore 1 MB/dokumen: base64 DILARANG masuk dokumen; hanya URL
  // hasil upload Supabase yang sah.
  if (!/^https:\/\/\S+$/.test(String(url))) {
    return { ok: false, galat: 'URL potongan harus hasil upload (https://…) — base64 tidak boleh disimpan di dokumen soal.' };
  }

  const urls = Array.isArray(dok.gambarUrls) ? [...dok.gambarUrls] : [];
  const meta = Array.isArray(dok.gambarMeta) ? dok.gambarMeta.map((m) => ({ ...(m || {}) })) : [];

  if (jenis === 'ganti') {
    const i = bulat(indeksGambar);
    if (!(i >= 0 && i < urls.length)) {
      return { ok: false, galat: `Gambar ke-${i + 1} tidak ada di soal ini (${urls.length} gambar tersimpan).` };
    }
    const urlLama = urls[i];
    urls[i] = url;
    while (meta.length < urls.length) meta.push({});
    meta[i] = {
      ...meta[i],
      sumber: berkasSumber || meta[i].sumber || '',
      asal: 'potongan-asli',
      dipotongPresisi: { alat: 'potong-presisi', ts },
    };
    if (caption) meta[i].caption = caption;

    // Selaraskan opsi kaya & field `gambar` lama yang menunjuk URL lama.
    const syncUrls = (arr) => {
      let kena = false;
      const hasil = (Array.isArray(arr) ? arr : []).map((g) => {
        if (g && typeof g === 'object' && urlLama && g.url === urlLama) {
          kena = true;
          return { ...g, url, asal: 'potongan-asli', sumber: g.sumber || berkasSumber };
        }
        return g;
      });
      return { hasil, kena };
    };
    const perubahan = { gambarUrls: urls, gambarMeta: meta };

    const opsiLama = Array.isArray(dok.opsiJawaban) ? dok.opsiJawaban : [];
    let opsiBerubah = false;
    const opsiBaru = opsiLama.map((o) => {
      if (!o || typeof o !== 'object' || !Array.isArray(o.gambar)) return o;
      const { hasil, kena } = syncUrls(o.gambar);
      if (!kena) return o;
      opsiBerubah = true;
      return { ...o, gambar: hasil };
    });
    if (opsiBerubah) perubahan.opsiJawaban = opsiBaru;

    const { hasil: gambarLama, kena: gambarKena } = syncUrls(dok.gambar);
    if (gambarKena) perubahan.gambar = gambarLama;

    return { ok: true, perubahan };
  }

  if (jenis === 'tambah') {
    const k = bulat(indeksTertunda);
    const tertunda = Array.isArray(dok.potonganTertunda) ? [...dok.potonganTertunda] : [];
    if (!(k >= 0 && k < tertunda.length)) {
      return { ok: false, galat: `Petunjuk tertunda ke-${k + 1} sudah tidak ada di soal ini.` };
    }
    const entri = tertunda[k] || {};
    urls.push(url);
    // Jaga invarian kontrak: gambarMeta SEJAJAR INDEKS gambarUrls.
    // Dokumen impor lama bisa punya meta lebih pendek — isi slot yang
    // bolong dengan {} netral (tidak menuduh), baru tempel entri baru.
    while (meta.length < urls.length - 1) meta.push({});
    meta.push({
      sumber: berkasSumber || '',
      asal: 'potongan-asli',
      caption: caption || String(entri.petunjuk || entri.caption || '').slice(0, 140),
      region: region || entri.region || 'badan',
      dipotongPresisi: { alat: 'potong-presisi', ts: String(ts) },
    });
    tertunda.splice(k, 1);
    return { ok: true, perubahan: { gambarUrls: urls, gambarMeta: meta, potonganTertunda: tertunda } };
  }

  return { ok: false, galat: `Mode potongan "${jenis}" tidak dikenali (ganti/tambah).` };
}
