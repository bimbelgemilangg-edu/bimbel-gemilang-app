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
 * Cari kandidat bacaan terjebak BAGI soal ke-i (soal yatim).
 * Dipakai bersama oleh tandaiBacaanTerjebak (pesan) dan
 * pindahkanBacaanTerjebak (aksi satu klik) supaya keduanya tidak pernah
 * berbeda pendapat tentang apa itu "kandidat".
 * @returns {{sumberIdx:number, lokasi:string, potong:{teks:string,mulai:number}, bidang:'opsi'|'teks'}|null}
 */
function kandidatBagi(daftar, i) {
  const s = daftar[i];
  const teksSoal = String(s?.teks_soal ?? '');
  const punyaBacaan = Boolean(s?.bacaan && (String(s.bacaan.teks || '').trim() || (s.bacaan.gambar || []).length));
  const yatim = (RE_MENUNJUK_BACAAN.test(teksSoal) || RE_BERDASARKAN_PARAGRAF.test(teksSoal))
    && !punyaBacaan && teksSoal.length < 400;
  if (!yatim) return null;

  // Jendela 4 soal ke belakang: kasus nyata owner, wacana batik milik
  // 20-22 tercecer di opsi E soal 19 -- bagi soal 22 itu 3 langkah mundur.
  // Kandidatnya sendiri sangat spesifik (penanda kolom + prosa panjang,
  // atau string jauh lebih panjang dari opsi saudaranya), jadi jendela
  // lebar tidak berarti tuduhan sembarangan.
  for (let mundur = 1; mundur <= 4; mundur += 1) {
    const sumberIdx = i - mundur;
    const sumber = daftar[sumberIdx];
    if (!sumber) break;
    const opsi = Array.isArray(sumber.opsi_jawaban) ? sumber.opsi_jawaban : [];
    const panjangTengah = opsi.length
      ? opsi.map((o) => String(typeof o === 'string' ? o : o?.teks || '').length).sort((a, b) => a - b)[Math.floor(opsi.length / 2)] || 0
      : 0;
    for (let k = 0; k < opsi.length; k += 1) {
      const isi = String(typeof opsi[k] === 'string' ? opsi[k] : opsi[k]?.teks || '');
      const potong = cariPotonganTerjebak(isi, panjangTengah);
      if (potong) return { sumberIdx, lokasi: `opsi ${hurufOpsi(k)} soal nomor ${sumber.nomor}`, potong, bidang: 'opsi', indeksOpsi: k };
    }
    const potongTeks = cariPotonganTerjebak(String(sumber.teks_soal || ''), panjangTengah);
    if (potongTeks) return { sumberIdx, lokasi: `teks_soal soal nomor ${sumber.nomor}`, potong: potongTeks, bidang: 'teks' };
  }
  return null;
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
    const k = kandidatBagi(list, i);
    if (!k) return s;
    const extra = `KANDIDAT BACAAN KETEMU: ±${k.potong.teks.length} karakter bacaan TERJEBAK di ${k.lokasi}. Tekan tombol "Selamatkan bacaan terjebak" untuk memindahkannya ke soal ini sebagai bacaan bersama, atau potong-tempel manual bila ragu.`;
    return { ...s, errors: [...(s.errors || []), extra] };
  });
}

/** Berapa soal yang punya kandidat bacaan terjebak (untuk label tombol). */
export function hitungKandidatBacaan(daftar) {
  const list = Array.isArray(daftar) ? daftar : [];
  let n = 0;
  for (let i = 0; i < list.length; i += 1) if (kandidatBagi(list, i)) n += 1;
  return n;
}

/**
 * AKSI SATU KLIK: pindahkan bacaan terjebak dari wadah salahnya ke soal
 * yatim yang membutuhkannya.
 *
 * AturanMainnya sengaja konservatif:
 *   - potongan DIPOTONG dari wadah aslinya (opsi/teks_soal sumber) supaya
 *     tidak ada dua salinan yang beranak di bank;
 *   - bacaan hasil selamatan dibagikan ke soal yatim BERTURUT-TURUT setelah
 *     sumber (kasus nyata: wacana batik milik 20-22 tercecer di opsi E 19);
 *   - tiap butir yang diselamatkan diberi `bacaanDiselamatkan: true` dan
 *     catatan admin, supaya asal-usulnya terlihat dan bisa dibatalkan
 *     manusia; error yatim & pesan KANDIDAT dibuang karena sudah tuntas.
 * TIDAK mutasi masukan.
 * @returns {{daftar:Array<object>, diselamatkan:Array<object>}}
 */
export function pindahkanBacaanTerjebak(daftar) {
  const list = (Array.isArray(daftar) ? daftar : []).map((s) => ({ ...s }));
  const diselamatkan = [];

  for (let i = 0; i < list.length; i += 1) {
    const k = kandidatBagi(list, i);
    if (!k) continue;
    const sumber = list[k.sumberIdx];
    const teksBacaan = bersihkanArtefakTeks(k.potong.teks);
    if (!teksBacaan) continue;

    if (k.bidang === 'opsi') {
      const opsi = [...(Array.isArray(sumber.opsi_jawaban) ? sumber.opsi_jawaban : [])];
      const asli = opsi[k.indeksOpsi];
      const sisa = String(typeof asli === 'string' ? asli : asli?.teks || '')
        .slice(0, k.potong.mulai)
        .trim();
      opsi[k.indeksOpsi] = typeof asli === 'string' ? sisa : { ...asli, teks: sisa };
      sumber.opsi_jawaban = opsi;
    } else {
      sumber.teks_soal = String(sumber.teks_soal || '').slice(0, k.potong.mulai).trim();
    }

    // bagikan ke runtutan soal yatim sesudah sumber (termasuk i)
    let j = k.sumberIdx + 1;
    while (j < list.length) {
      const t = list[j];
      const teksT = String(t?.teks_soal ?? '');
      const masihYatim = (RE_MENUNJUK_BACAAN.test(teksT) || RE_BERDASARKAN_PARAGRAF.test(teksT))
        && !(t?.bacaan && String(t.bacaan.teks || '').trim()) && teksT.length < 400;
      if (!masihYatim) break;
      t.bacaan = { teks: teksBacaan, gambar: [], grup: `selamatan-${sumber.nomor}`, diselamatkan: true };
      t.bacaanDiselamatkan = true;
      t.catatan_admin = String(t.catatan_admin || '')
        + ` Bacaan diisi otomatis 2026-10-11 dari ${k.lokasi} (tombol selamatkan bacaan terjebak) — VERIFIKASI MANUAL apakah memang milik soal ini.`;
      t.errors = (t.errors || []).filter((e) => !e.includes('TIDAK punya bacaan sama sekali') && !e.includes('KANDIDAT BACAAN KETEMU'));
      t.valid = (t.errors || []).length === 0;
      diselamatkan.push({ nomor: t.nomor, sumberNomor: sumber.nomor, lokasi: k.lokasi });
      j += 1;
    }
    // sumber juga tidak boleh lagi memuat pesan kandidat yang sudah tuntas
    sumber.errors = (sumber.errors || []).filter((e) => !e.includes('KANDIDAT BACAAN KETEMU'));
    i = j - 1; // lewati runtutan yang baru saja diisi
  }
  return { daftar: list, diselamatkan };
}

export default {
  bersihkanArtefakTeks,
  bersihkanArtefakSoal,
  cariPotonganTerjebak,
  tandaiBacaanTerjebak,
  hitungKandidatBacaan,
  pindahkanBacaanTerjebak,
};
