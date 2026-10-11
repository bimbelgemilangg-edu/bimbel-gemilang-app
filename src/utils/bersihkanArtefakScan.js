// src/utils/bersihkanArtefakScan.js
// ============================================================
// PEMBERSIH ARTEFAK SCAN + PENDETEKSI BACAAN TERJEBAK.
//
// KENAPA ADA (sampel nyata owner 2026-10-11: "02 Silogisme @my99dreams.pdf",
// 40 soal UTBK TPS-PU, diproses lewat /admin/bank-soal/import):
// PDF sumbernya SCAN MURNI TANPA TEXT LAYER (diverifikasi: pdfjs-dist
// mengembalikan 0 karakter teks untuk semua halaman), dua kolom, dan
// dibubuhi watermark bimbel sendiri. Konsekuensinya keluaran OCR/Gemini
// memuat TIGA kelas kotoran yang selama ini LOLOS APA ADANYA ke bank soal:
//
//   1. Penanda kolom pemindai : "=== PAGE 3 COL 1 ===", "=== PAGE 8 COL 2 ==="
//      Sering menyeret nomor urut kolom sebelah: "=== PAGE 7 COL 1 === 31 32. 33."
//   2. Watermark berkas sumber : "BELAJAR MINIMAL," / "HASIL MAKSIMAL"
//      (OCR sering salah baca: "BELAJAR WINIMAL", "HBSIL MAKSIMAL",
//      "HASIL MBKSIMAL", "BELAJAR MINIMAL, 30.")
//   3. Nomor urut kolom sebelah yang lepas jadi baris sendiri:
//      "12." / "13." / "14." / "35," / "9," / "24, 25 26."
//      plus garis sampah pemisah kolom: "————EEE"
//
// Kotoran kelas 1-3 INI BISA dikenali secara mekanis, jadi dibersihkan di
// sini SEBELUM masuk bank. Yang TIDAK bisa dipulihkan siapa pun di hilir:
// kata yang terpotong tepi kolom ("bc" untuk "boleh", "diadakai") -- hurufnya
// memang tidak terbaca pemindai. Itu urusan kualitas scan/prompt, bukan
// urusan importer, dan jujur dikatakan begitu ke owner.
//
// Bagian kedua berkas ini mendeteksi BACAAN TERJEBAK: kasus nyata sampel,
// wacana batik (milik soal 20-22) tercecer MENJADI EKOR OPSI E soal 19,
// sehingga soal 20-22 yatim tanpa bacaan. Detektor ini TIDAK memindahkan
// teks sendiri-sendiri (itu keputusan manusia, sesuai filosofi repo:
// peringatan keras + konfirmasi, bukan perbaikan senyap) -- ia hanya
// MENUNJUK PERSIS di mana bacaannya terperangkap, supaya perbaikan yang
// tadinya "cari sendiri di 40 soal" jadi satu langkah.
//
// MURNI & TERUJI (tests/bersihkanArtefakScan.test.mjs).
// ============================================================

/** Penanda kolom pemindai + nomor urut kolom sebelah yang ikut terseret. */
const RE_MARKER_KOLOM = /={3,}\s*PAGE\s*\d+(?:\s*COL\s*\d+)?\s*={3,}(?:\s*\d{1,3}[.,]?){0,8}/gi;

/** Baris yang ISINYA hanya nomor urut & tanda baca (milik kolom sebelah). */
const RE_BARIS_NOMOR = /^\s*(?:\d{1,3}\s*[.,;]?\s*){1,8}$/;

/** Baris sampah pemisah kolom: didominasi garis/dash/box ("————EEE"). */
const RE_BARIS_GARIS = /^\s*[—–―\-_=|]{4,}\s*[A-Z0-9]{0,6}\s*$/;

/** Huruf saja, kapital — untuk membandingkan watermark yang salah-baca OCR. */
function hurufKapital(teks) {
  return String(teks).toUpperCase().replace(/[^A-Z]/g, '');
}

function jarakEdit(a, b) {
  if (a === b) return 0;
  const m = a.length;
  const n = b.length;
  if (!m) return n;
  if (!n) return m;
  let sebelum = Array.from({ length: n + 1 }, (_, i) => i);
  for (let i = 1; i <= m; i += 1) {
    let kini = [i];
    for (let j = 1; j <= n; j += 1) {
      kini[j] = Math.min(
        sebelum[j] + 1,
        kini[j - 1] + 1,
        sebelum[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1),
      );
    }
    sebelum = kini;
  }
  return sebelum[n];
}

// Watermark berkas sumber. OCR sering salah satu huruf, jadi dibandingkan
// sebagai huruf-kapital dengan toleransi jarak edit 2 ("BELAJAR WINIMAL",
// "HBSIL MAKSIMAL", "HASIL MBKSIMAL" semua masuk; kalimat asli tidak).
const WATERMARK_ACUAN = ['BELAJARMINIMAL', 'HASILMAKSIMAL'];
function barisWatermark(baris) {
  const huruf = hurufKapital(baris);
  if (!huruf || huruf.length < 10 || huruf.length > 20) return false;
  return WATERMARK_ACUAN.some((w) => jarakEdit(huruf, w) <= 2);
}

/**
 * Bersihkan SATU string teks dari artefak scan.
 * Rumus $...$ / $$...$$ dan baris isi TIDAK disentuh.
 * @param {string} teks
 * @returns {string}
 */
export function bersihkanArtefakTeks(teks) {
  let t = String(teks ?? '');
  if (!t.trim()) return t;
  t = t.replace(RE_MARKER_KOLOM, ' ');
  t = t
    .split('\n')
    .map((baris) => {
      if (RE_BARIS_NOMOR.test(baris)) return '';
      if (RE_BARIS_GARIS.test(baris)) return '';
      if (barisWatermark(baris)) return '';
      return baris;
    })
    .join('\n');
  return t
    .replace(/[ \t]{2,}/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/[ \t]+\n/g, '\n')
    .trim();
}

function bersihkanOpsi(opsi) {
  if (typeof opsi === 'string') return bersihkanArtefakTeks(opsi);
  if (opsi && typeof opsi === 'object') {
    return { ...opsi, teks: bersihkanArtefakTeks(opsi.teks ?? '') };
  }
  return opsi;
}

function bersihkanBacaan(bacaan) {
  if (typeof bacaan === 'string') return bersihkanArtefakTeks(bacaan);
  if (bacaan && typeof bacaan === 'object') {
    return { ...bacaan, teks: bersihkanArtefakTeks(bacaan.teks ?? '') };
  }
  return bacaan;
}

/**
 * Bersihkan seluruh field teks sebuah butir mentah (mode HTML maupun JSON).
 * TIDAK mutasi: mengembalikan objek baru.
 * @param {object} q butir mentah sebelum normalizeSoal
 * @returns {object}
 */
export function bersihkanArtefakSoal(q) {
  if (!q || typeof q !== 'object') return q;
  const keluar = { ...q };
  for (const k of ['teks_soal', 'soal', 'question', 'pertanyaan', 'pembahasan', 'penjelasan', 'explanation']) {
    if (typeof keluar[k] === 'string') keluar[k] = bersihkanArtefakTeks(keluar[k]);
  }
  for (const k of ['opsi_jawaban', 'opsi', 'options', 'choices']) {
    if (Array.isArray(keluar[k])) keluar[k] = keluar[k].map(bersihkanOpsi);
  }
  if (Array.isArray(keluar.pernyataan)) keluar.pernyataan = keluar.pernyataan.map(bersihkanOpsi);
  for (const k of ['bacaan', 'stimulus', 'wacana']) {
    if (k in keluar) keluar[k] = bersihkanBacaan(keluar[k]);
  }
  return keluar;
}

// ============================================================
// BACAAN TERJEBAK
// ============================================================

/** Pola penunjuk bacaan yang sama dipakai Sinyal 5 di halaman impor. */
const RE_MENUNJUK_BACAAN = /\b(teks|bacaan|paragraf|puisi|artikel|kutipan)\s+(tersebut|di atas|di depan|itu)\b/i;
const RE_BERDASARKAN_PARAGRAF = /\bberdasarkan\s+(teks|bacaan|paragraf)\s*\d/i;

function jumlahKalimat(teks) {
  return (String(teks).match(/[.!?][\s"')]/g) || []).length;
}

/**
 * Cari potongan bacaan yang TERJEBAK di dalam string panjang (opsi/teks).
 * Dua pemicu, keduanya konservatif supaya tidak membelah opsi yang sah:
 *   (a) ada penanda kolom di tengah string -> teks SETELAH penanda hampir
//        pasti isi kolom berikutnya yang terseret (kasus batik: opsi E soal
 *       19 berakhiran "=== PAGE 5 COL 1 === Teks berikut … Industri batik…");
 *   (b) string JAUH lebih panjang daripada saudara-saudaranya dan padat
 *       kalimat -> prosa, bukan pilihan jawaban.
 * @returns {{teks:string, mulai:number}|null}
 */
export function cariPotonganTerjebak(teks, panjangSaudara = 0) {
  const s = String(teks ?? '');
  RE_MARKER_KOLOM.lastIndex = 0;
  const m = RE_MARKER_KOLOM.exec(s);
  if (m) {
    const ekor = s.slice(m.index + m[0].length).trim();
    if (ekor.length >= 300 && jumlahKalimat(ekor) >= 3) {
      return { teks: ekor, mulai: m.index };
    }
  }
  const batas = Math.max(600, panjangSaudara * 3);
  if (s.length >= batas && jumlahKalimat(s) >= 6) {
    return { teks: s, mulai: 0 };
  }
  return null;
}

function hurufOpsi(i) {
  return String.fromCharCode(65 + i);
}

/**
 * Untuk tiap soal YATIM (menunjuk bacaan tapi bacaannya kosong), tunjuk
 * PERSIS di mana bacaan itu terperangkap di soal sekitarnya.
 * TIDAK memindahkan teks — hanya menambah satu baris errors yang berisi
 * petunjuk lokasi, supaya perbaikan jadi satu langkah, bukan berburu.
 * @param {Array<object>} daftar butir hasil normalizeSoal
 * @returns {Array<object>} daftar baru dengan errors diperkaya
 */
export function tandaiBacaanTerjebak(daftar) {
  const list = Array.isArray(daftar) ? daftar : [];
  return list.map((s, i) => {
    const teksSoal = String(s?.teks_soal ?? '');
    const punyaBacaan = Boolean(s?.bacaan && (String(s.bacaan.teks || '').trim() || (s.bacaan.gambar || []).length));
    const yatim = (RE_MENUNJUK_BACAAN.test(teksSoal) || RE_BERDASARKAN_PARAGRAF.test(teksSoal))
      && !punyaBacaan && teksSoal.length < 400;
    if (!yatim) return s;

    for (let mundur = 1; mundur <= 2; mundur += 1) {
      const sumber = list[i - mundur];
      if (!sumber) break;
      const opsi = Array.isArray(sumber.opsi_jawaban) ? sumber.opsi_jawaban : [];
      const panjangTengah = opsi.length
        ? opsi.map((o) => String(typeof o === 'string' ? o : o?.teks || '').length).sort((a, b) => a - b)[Math.floor(opsi.length / 2)] || 0
        : 0;
      for (let k = 0; k < opsi.length; k += 1) {
        const isi = String(typeof opsi[k] === 'string' ? opsi[k] : opsi[k]?.teks || '');
        const potong = cariPotonganTerjebak(isi, panjangTengah);
        if (potong) {
          const extra = `KANDIDAT BACAAN KETEMU: ±${potong.teks.length} karakter bacaan TERJEBAK di opsi ${hurufOpsi(k)} soal nomor ${sumber.nomor} (setelah penanda kolom / jauh lebih panjang dari opsi saudaranya). Potong teks itu dari opsi tersebut dan tempel sebagai bacaan soal ini -- besar kemungkinan memang miliknya.`;
          return { ...s, errors: [...(s.errors || []), extra] };
        }
      }
      const potongTeks = cariPotonganTerjebak(String(sumber.teks_soal || ''), panjangTengah);
      if (potongTeks) {
        const extra = `KANDIDAT BACAAN KETEMU: ±${potongTeks.teks.length} karakter bacaan menempel di teks_soal soal nomor ${sumber.nomor}. Potong dan tempel sebagai bacaan soal ini.`;
        return { ...s, errors: [...(s.errors || []), extra] };
      }
    }
    return s;
  });
}

export default {
  bersihkanArtefakTeks,
  bersihkanArtefakSoal,
  cariPotonganTerjebak,
  tandaiBacaanTerjebak,
};
