// src/utils/skoringSoalKompleks.js
// ============================================================
// Skoring PROPORSIONAL buat 2 tipe soal TKA yang bukan pilihan ganda
// biasa. Kenapa proporsional (bukan semua-atau-tidak):
// - Kemendikdasmen sendiri BELUM publikasi rubrik resmi buat 2 tipe
//   ini (per riset saat fitur ini dibangun) -- jadi ini pilihan
//   desain, bukan aturan baku yang tinggal dicontek.
// - Proporsional kasih data evaluasi belajar yang lebih tajam ("siswa
//   ini paham 3 dari 4 konsep", bukan cuma "gagal total") -- sesuai
//   prinsip bimbel: fokus ke data buat evaluasi belajar.
// - Konsisten sama prinsip "jangan bikin siswa kapok" yang sudah
//   dipakai di Latihan Harian (XP gak pernah minus).
// ============================================================

// 🔥 BARU (bug freeze/blank putih ditemukan): sebelumnya kode ini
// nganggep `kunciJawaban` PASTI array (`kunciJawaban || []` cuma
// nangkep kalau nilainya falsy/kosong, BUKAN kalau nilainya string
// biasa). Kalau ada 1 soal pg_kompleks yang kunciJawaban-nya
// ke-simpen sebagai teks polos (mis. "AC" bukan ["A","C"]), .map()
// dipanggil ke string dan React CRASH TOTAL (blank putih, harus
// reload) -- bukan cuma soal itu doang yang gagal, SELURUH try out
// ikut mati. safeArray() mastiin kita SELALU dapat array beneran,
// apapun bentuk data aslinya.
// 🛡️ AUDIT 2026-10-13 (paket Sabtu): split per-huruf saja TIDAK cukup --
// data produksi banyak menyimpan kunci "B,C" / "A,D" (pakai pemisah
// koma). Split per-huruf melahirkan ',' sebagai "kunci" yang tak bisa
// dicentang siswa -> skor maksimal 2/3 walau centangan sempurna, dan
// layar tinjauan tak pernah menunjuk kunci lengkap. Sekarang: ada
// pemisah (,;/| atau spasi) -> split per pemisah; "AC" polos tanpa
// pemisah -> tetap split per-huruf (perilaku lama terjaga).
export function safeArray(v) {
  if (Array.isArray(v)) return v;
  if (typeof v === 'string' && v.trim()) {
    const t = v.trim();
    const bagian = /[,;/|]/.test(t)
      ? t.split(/[,;/|\s]+/)
      : /\s/.test(t)
        ? t.split(/\s+/)
        : t.split('');
    return bagian.map((c) => c.trim()).filter(Boolean);
  }
  return [];
}

/**
 * Skor buat tipe "pg_kompleks" (checkbox, jawaban benar > 1).
 * Centang yang BENAR nambah skor, centang yang SALAH mengurangi --
 * jadi asal centang semua opsi TIDAK bisa dapat skor penuh.
 *
 * @param {string[]} kunciJawaban - huruf yang benar, mis. ['A','C','D']
 * @param {string[]} jawabanSiswa - huruf yang dicentang siswa, mis. ['A','C']
 * @returns {number} skor 0..1
 */
export function hitungSkorPgKompleks(kunciJawaban, jawabanSiswa) {
  const kunci = new Set(safeArray(kunciJawaban).map((h) => String(h).toUpperCase().trim()));
  const dipilih = new Set(safeArray(jawabanSiswa).map((h) => String(h).toUpperCase().trim()));
  if (kunci.size === 0) return 0;

  let benarDicentang = 0;
  let salahDicentang = 0;
  dipilih.forEach((huruf) => {
    if (kunci.has(huruf)) benarDicentang += 1;
    else salahDicentang += 1;
  });

  const skor = (benarDicentang - salahDicentang) / kunci.size;
  return Math.max(0, Math.min(1, skor));
}

/**
 * 🔥 BARU (paket keluhan siswa 2026-11-03): daftar OPSI soal pg_kompleks
 * dari SATU sumber. Kontrak sanitizer menyebut pg_kompleks menyimpan
 * pernyataannya di field `pernyataan`, sementara importer lain menulis
 * `opsiJawaban` -- renderer siswa dulu hanya membaca `opsiJawaban`, jadi
 * soal ber-pernyataan tampil dengan NOL kotak centang (siswa tak bisa
 * menjawab sama sekali). Fallback ini dipakai renderer, skoring, dan
 * kelayakan supaya permukaan centang selalu ada.
 */
export function opsiPgKompleks(soal) {
  const opsi = safeArray(soal?.opsiJawaban);
  if (opsi.length) return opsi;
  return safeArray(soal?.pernyataan);
}

/**
 * 🔥 BARU (paket keluhan siswa 2026-11-03): kunci pg_kompleks dibakukan ke
 * HURUF sesuai permukaan centang renderer. Data produksi menyimpan kunci
 * angka ("1,3" / "2 4") padahal renderer & siswa bekerja dengan huruf
 * A/B/C -- akibatnya centang siswa tak pernah cocok (semua ditandai salah,
 * skor 0). Angka dipetakan 1-based dulu lalu 0-based (dua-duanya muncul di
 * data lama); kunci yang sudah huruf lolos apa adanya.
 */
export function kunciHurufPgKompleks(soal) {
  const mentah = safeArray(soal?.kunciJawaban)
    .map((h) => String(h).trim())
    .filter(Boolean);
  if (!mentah.length) return [];
  const huruf = mentah
    .map((t) => (/^[a-z]$/i.test(t) ? t.toUpperCase() : null))
    .filter(Boolean);
  if (huruf.length === mentah.length) return huruf;
  const jumlahOpsi = opsiPgKompleks(soal).length;
  const angka = mentah.map((t) => (/^\d+$/.test(t) ? Number(t) : null));
  if (angka.every((n) => n !== null) && jumlahOpsi > 0) {
    return angka
      .map((n) => {
        if (n >= 1 && n <= jumlahOpsi) return String.fromCharCode(64 + n);
        if (n >= 0 && n < jumlahOpsi) return String.fromCharCode(65 + n);
        return null;
      })
      .filter(Boolean);
  }
  return huruf;
}

/**
 * Skor buat tipe "benar_salah" / "pg_kategori" (tabel per-baris).
 * Tiap baris/pernyataan dinilai SENDIRI-SENDIRI dan berbobot sama.
 *
 * @param {Array<{jawaban:string}>} baris - baris asli dari Bank Soal (field `jawaban` = kunci)
 * @param {string[]} jawabanSiswaPerBaris - jawaban siswa per baris, indeks sejajar dengan `baris`
 * @returns {number} skor 0..1
 */
// 🔥 BARU (audit keluhan siswa 2026-10-05): ambil kunci satu baris
// benar/salah dengan TOLERAN terhadap dialek penyimpanan: importer lama
// menulis field `jawaban`, sanitizer JSON menulis `kunci`, dan ada data
// produksi yang keduanya kosong (itulah bug yang membuat 194 soal selalu
// bernilai 0 apapun jawaban siswa).
// 🔥 BARU (paket keluhan siswa 2026-11-03): pembakuan DIALEK kategori
// benar/salah. Data produksi menyimpan kunci baris dalam beberapa dialek:
// 'benar'/'salah' (sanitizer), 'Benar'/'Salah' (impor lama), bahkan huruf
// tunggal 'B'/'S' atau 'true'/'false'. Renderer menyusun KOLOM dari nilai
// ini dan skoring membandingkannya dengan jawaban siswa (label kolom yang
// diklik), jadi dua dialek berbeda = kolom tak pernah cocok = soal selalu
// 0. Dibakukan DI SINI (satu sumber) supaya renderer, skoring, pemantau
// guru, dan teks kunci semuanya menyebut kategori dengan kata yang sama.
// Kategori custom (mis. 'Proses'/'Manfaat') lolos apa adanya.
export function bakuKategoriBenarSalah(kunci) {
  const t = String(kunci ?? '').trim().toLowerCase();
  if (t === 'b' || t === 'benar' || t === 'true') return 'benar';
  if (t === 's' || t === 'salah' || t === 'false') return 'salah';
  return String(kunci ?? '').trim();
}

export function kunciBarisBenarSalah(baris) {
  return bakuKategoriBenarSalah(baris?.jawaban ?? baris?.kunci ?? baris?.value ?? '');
}

export function barisBenarSalahBisaDinilai(baris) {
  return safeArray(baris).some((b) => kunciBarisBenarSalah(b) !== '');
}

export function hitungSkorBenarSalah(baris, jawabanSiswaPerBaris) {
  const daftar = safeArray(baris);
  if (daftar.length === 0) return 0;

  // 🔥 FIX ADIL: baris yang KUNCINYA HILANG (kesalahan sistem/impor, bukan
  // kesalahan siswa) TIDAK BOLEH menghukum siswa -- dikeluarkan dari
  // penyebut. Sebelumnya penyebut = semua baris, jadi soal dengan kunci
  // hilang bernilai 0 sekalipun siswa menjawab sempurna baris lain.
  const berKunci = daftar
    .map((b, i) => [b, i])
    .filter(([b]) => kunciBarisBenarSalah(b) !== '');
  if (berKunci.length === 0) return 0;

  let jumlahBenar = 0;
  for (const [b, i] of berKunci) {
    const kunci = kunciBarisBenarSalah(b).toLowerCase();
    const jawabanSiswa = String(safeArray(jawabanSiswaPerBaris)[i] || '').toLowerCase().trim();
    if (kunci && jawabanSiswa && kunci === jawabanSiswa) jumlahBenar += 1;
  }

  return jumlahBenar / berKunci.length;
}

// 🔥 BARU (BUG SERIUS DITEMUKAN): sebelumnya kode di 2 tempat beda
// (TryOutView.jsx & RendererPgSederhana.jsx) masing-masing nganggep
// kunciJawaban PASTI 1 huruf tunggal (mis. "B") -- kalau ternyata
// ke-simpen dalam format lain (angka index, atau teks jawaban
// langsung), hasil `charCodeAt(0) - 65` jadi angka aneh yang GAK AKAN
// PERNAH cocok index opsi manapun. Akibatnya siswa yang jawabannya
// BENAR tetap disalahkan sistem terus-terusan -- kalau kejadian di
// banyak soal, skor try out bisa 0% walau siswa jawab benar semua.
// SEKARANG dipindah jadi 1 fungsi bersama (dipakai TryOutView.jsx
// buat menghitung skor & RendererPgSederhana.jsx buat highlight
// hijau/merah), toleran ke 3 kemungkinan format kunci jawaban.
export function cariIndexBenar(soal) {
  const kunci = String(soal.kunciJawaban ?? '').trim();
  if (!kunci) return -1;
  const opsi = soal.opsiJawaban || [];
  // Format 1: huruf tunggal A-Z (paling umum & yang seharusnya dipakai)
  if (/^[A-Za-z]$/.test(kunci)) return kunci.toUpperCase().charCodeAt(0) - 65;
  // Format 2: angka index -- coba 0-based dulu, fallback ke 1-based
  if (/^\d+$/.test(kunci)) {
    const n = parseInt(kunci, 10);
    if (n >= 0 && n < opsi.length) return n;
    if (n - 1 >= 0 && n - 1 < opsi.length) return n - 1;
  }
  // Format 3: kunci berisi TEKS JAWABAN langsung (bukan huruf/angka) --
  // cocokkan ke isi opsi jawabannya.
  const idxTeks = opsi.findIndex((o) => {
    const teks = typeof o === 'string' ? o : (o?.teks || '');
    return teks.trim().toLowerCase() === kunci.toLowerCase();
  });
  return idxTeks >= 0 ? idxTeks : -1;
}