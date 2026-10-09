// src/utils/naskahSoal.js
// ============================================================
// MESIN NASKAH CETAK GAYA UJIAN (arahan owner 2026-10-08: "sistem
// menata layout print seperti ini, rapi dengan gambar disesuaikan
// tidak terlalu kecil dan besar, sistem menata secara otomatis,
// tentor tinggal pilih ukuran kertas lalu print" -- sambil mengirim
// tangkapan layar naskah TKA dua kolom yang rapi).
//
// Beda gaya dengan mesin lama (cetakLatihan.js = kotak siap gunting
// satu kolom untuk buku progres): di sini butir soal mengalir ke
// KOLOM-KOLOM setinggi halaman persis naskah ujian asli -- nomor
// menggantung di kiri, gambar mendampingi teks dengan ukuran yang
// DIHITUNG dari piksel aslinya, pilihan ganda pendek tersusun dua
// kolom supaya hemat tempat.
//
// Semua fungsi di sini MURNI dan diuji di Node oleh
// tests/naskahSoal.test.mjs. Tinggi tiap butir TIDAK ditebak di sini:
// halaman guru mengukur butir sungguhan di lapisan ukur tersembunyi
// (lihat CetakPaketLatihan.jsx), lalu menyerahkan tinggi milimeter
// ke susunKeKolom() supaya susunan halaman di layar = susunan di
// kertas. Kenapa tidak pakai CSS multi-column saja? Karena kolom CSS
// menyeimbangkan tinggi sendiri dan membelah butir seenaknya saat
// cetak lintas halaman -- padahal naskah ujian yang benar tidak
// pernah memotong satu butir di tengah kolom.
// ============================================================

import katex from 'katex';
import { pisahTeksDanGambar } from './penempatanGambar.js';
import { bersihkanTeksOpsi } from './bersihkanGlifKunci.js';

// ---- geometri kertas (milimeter) ----
// Ukuran yang ditawarkan dipilih dari kertas yang benar-benar ada di
// percetakan Indonesia: A4 (standar), F4/Folio (kertas sekolah paling
// umum), Letter (sisa stok kantor), A5 (buku progres kecil).
export const DAFTAR_KERTAS = [
  { kode: 'A4', label: 'A4 (210 × 297 mm)', lebarMm: 210, tinggiMm: 297 },
  { kode: 'F4', label: 'F4 / Folio (215 × 330 mm)', lebarMm: 215, tinggiMm: 330 },
  { kode: 'LETTER', label: 'Letter (216 × 279 mm)', lebarMm: 216, tinggiMm: 279 },
  { kode: 'A5', label: 'A5 (148 × 210 mm)', lebarMm: 148, tinggiMm: 210 },
];

export const MARGIN_MM = 10;        // napas tepi; <10mm pemotong kertas memakan nomor
export const GAP_KOLOM_MM = 6;      // jarak antar kolom, cukup untuk jempol menahan lembar
export const FOOTER_MM = 8;         // pita nomor halaman di kaki tiap halaman
export const SLACK_KOLOM_MM = 2;    // cadangan anti-tumpah: pengukuran layar meleset ±1mm

// 🔥 2026-10-09 (owner: "perkecil font bacaan dan rapikan agar muat kanan
// kiri, atau khusus bacaan panjang gausah kanan kiri").
// WACANA PANJANG tidak boleh diremas ke dalam satu kolom: di kertas hasil
// cetak owner, butir berwacana raksasa masuk kolom sendirian, kolom sebelahnya
// kosong, lalu isinya meluber lewat kaki halaman (opsi A/B terpotong).
// Aturan baru:
//   - blok yang lebih tinggi dari satu kolom  -> HALAMAN LEBAR PENUH
//     (satu kolom yang melebar selebar isi kertas, tanpa kanan-kiri);
//   - blok bacaan yang lebih tinggi dari AMBANG_BACAAN_PANJANG bagian kolom
//     juga dicetak lebar penuh, karena lebar penuh memangkas tingginya
//     hampir separuh dan barisnya jauh lebih enak dibaca;
//   - FAKTOR_TINGGI_LEBAR_PENUH dipakai menaksir tinggi blok setelah
//     melebar (teks 2x lebih lebar ~= tinggi 0.55x).
export const AMBANG_BACAAN_PANJANG = 0.62;
export const FAKTOR_TINGGI_LEBAR_PENUH = 0.55;

/** Tinggi ambang (mm): bacaan di atas ini dianggap "panjang". */
export function ambangBacaanPanjangMm(kapasitasMm) {
  return (kapasitasMm > 0 ? kapasitasMm : 240) * AMBANG_BACAAN_PANJANG;
}

/** Taksiran tinggi sebuah blok bila dicetak melebar sepenuh isi kertas. */
export function tinggiLebarPenuhMm(tinggiKolomMm) {
  const h = Number(tinggiKolomMm);
  return Number.isFinite(h) && h > 0 ? h * FAKTOR_TINGGI_LEBAR_PENUH : 0;
}

/** Blok ini tidak mungkin muat di satu kolom -> wajib halaman lebar penuh. */
export function butuhLebarPenuh(tinggiKolomMm, kapasitasMm) {
  const h = Number(tinggiKolomMm);
  return Number.isFinite(h) && h > (kapasitasMm > 0 ? kapasitasMm : 240);
}

// 🔥 2026-10-08: pembaca field sadar-alias + konstanta watermark dipusatkan
// di fieldButirSoal.js supaya mesin cetak dan kartu baca layar tidak punya
// dua pengertian berbeda soal "teks soal" dan "bacaan".
import { teksSoalDari, bacaanDari, WATERMARK } from './fieldButirSoal.js';

// Di-re-export supaya pemakai mesin cetak cukup mengimpor dari satu berkas,
// dan supaya test bisa memaku bahwa layar & cetak memakai konstanta yang sama.
export { WATERMARK };

export function kertasDariKode(kode) {
  return DAFTAR_KERTAS.find((k) => k.kode === String(kode || '').toUpperCase()) || DAFTAR_KERTAS[0];
}

/** Lebar satu kolom = lebar isi dibagi kolom, dikurangi sela antar kolom. */
export function lebarKolomMm(kertas, jumlahKolom) {
  const n = jumlahKolom > 1 ? jumlahKolom : 1;
  const isi = kertas.lebarMm - 2 * MARGIN_MM - (n - 1) * GAP_KOLOM_MM;
  return Math.round((isi / n) * 10) / 10;
}

/**
 * Kolom otomatis: dua kolom hanya kalau tiap kolom masih >= 70mm
// (sekitar 45 huruf sebaris). Di bawah itu teks soal matematika
 * terpotong-potong jelek, jadi satu kolom saja (A5).
 */
export function kolomOtomatis(kertas) {
  return lebarKolomMm(kertas, 2) >= 70 ? 2 : 1;
}

/** Tinggi isi satu kolom yang boleh diisi blok butir. */
export function kapasitasKolomMm(kertas) {
  return Math.round((kertas.tinggiMm - 2 * MARGIN_MM - FOOTER_MM - SLACK_KOLOM_MM) * 10) / 10;
}

/** Aturan @page supaya dialog cetak Chrome langsung menawarkan kertas yang benar. */
export function cssPage(kertas) {
  return `@page { size: ${kertas.lebarMm}mm ${kertas.tinggiMm}mm; margin: 0; }\n`;
}

// ---- ukuran gambar: "tidak terlalu kecil dan tidak terlalu besar" ----
// KENAPA dihitung dari piksel asli: gambar scan 1500px yang dipaksa
// 30mm menjadi buram, diagram 300px yang dilebar 90mm menjadi pecah.
// Tiga wilayah rasio (lebar/tinggi):
//   r >= 2.2  -> diagram melebar (grafik v-t, tabel): sepenuh kolom.
//   0.8..2.2  -> gambar "kotak" (lingkaran, struktur, foto):
//                mendampingi teks seperti naskah TKA asli (float kiri),
//                lebar 40% kolom dibatasi 30..55mm dan tinggi <= 48mm.
//   r <  0.8  -> gambar menjulang (bagian tumbuhan, skala): blok di
//                tengah, tinggi <= 58mm, lebar minimal 26mm supaya
//                detail masih terbaca di cetak hitam-putih.
export function ukuranGambarNaskah(lebarAsli, tinggiAsli, lebarKolom) {
  const l = Number(lebarAsli);
  const t = Number(tinggiAsli);
  if (!Number.isFinite(l) || !Number.isFinite(t) || l <= 0 || t <= 0) return null;
  const r = l / t;
  const bulat = (x) => Math.round(x * 10) / 10;
  if (r >= 2.2) {
    const lebar = Math.min(0.95 * lebarKolom, 165);
    return { mode: 'blok', lebarMm: bulat(lebar), tinggiMm: bulat(lebar / r) };
  }
  if (r >= 0.8) {
    let lebar = Math.max(30, Math.min(0.4 * lebarKolom, 55));
    let tinggi = lebar / r;
    if (tinggi > 48) { tinggi = 48; lebar = Math.min(48 * r, 0.45 * lebarKolom); tinggi = lebar / r; }
    return { mode: 'samping', lebarMm: bulat(lebar), tinggiMm: bulat(tinggi) };
  }
  let tinggi = 58;
  let lebar = tinggi * r;
  if (lebar < 26) { lebar = 26; tinggi = Math.min(70, 26 / r); }
  return { mode: 'blok', lebarMm: bulat(lebar), tinggiMm: bulat(tinggi) };
}

// ---- susunan pilihan ganda ----
// Naskah TKA asli menaruh pilihan pendek "(A) 8(4 − π)." berdampingan
// dua kolom, tapi pilihan berupa persamaan panjang tetap satu kolom
// supaya tidak terpenggal. Ambangnya dihitung dari lebar kolom:
// 11px Arial ≈ 1,55mm per huruf.
export const MM_PER_HURUF = 1.55;
export function kolomPilihanNaskah(daftarTeksOpsi, lebarKolom) {
  const opsi = Array.isArray(daftarTeksOpsi) ? daftarTeksOpsi.map((o) => String(o ?? '')) : [];
  if (opsi.length < 4) return 1;
  const hurufSebaris = (lebarKolom - 4) / MM_PER_HURUF;
  const terpanjang = Math.max(...opsi.map((o) => o.length));
  return terpanjang <= hurufSebaris * 0.46 ? 2 : 1;
}

// ---- penyusun halaman (murni, urutan butir TIDAK diacak) ----
/**
 * Masukan tinggi tiap blok (mm) sesuai urutan, keluaran susunan
 * halaman -> kolom -> indeks blok. Aturan:
 *   - blok tidak pernah dibelah: tidak muat di kolom ini => kolom baru;
 *   - kolom penuh => halaman baru;
 *   - blok WACANA PANJANG (di atas ambangBacaanPanjangMm, atau lebih tinggi
 *     dari satu kolom) naik ke PITA LEBAR PENUH di atas halamannya sendiri,
 *     lalu soal-soal berikutnya tetap dua kolom di bawah pita itu. Bila masih
 *     lebih tinggi dari satu halaman penuh, dicatat di `peringatan`.
 */
export function susunKeKolom(tinggiBlokMm, kapasitasMm, kolomPerHalaman, opsiSusun = {}) {
  const kapasitas = kapasitasMm > 0 ? kapasitasMm : 100;
  const perHal = kolomPerHalaman > 1 ? kolomPerHalaman : 1;
  const penuhDitandai = Array.isArray(opsiSusun.blokPenuh) ? opsiSusun.blokPenuh : [];
  // Tinggi SUNGGUHAN versi lebar penuh (diukur browser pada lebar isi kertas).
  // Bila ada, ini yang dipakai; kalau belum terukur, jatuh ke taksiran
  // FAKTOR_TINGGI_LEBAR_PENUH yang sengaja konservatif (lebih tinggi).
  const tinggiLebarTerukur = Array.isArray(opsiSusun.tinggiLebarMm) ? opsiSusun.tinggiLebarMm : null;
  // Satu kolom (A5) memang sudah selebar isi kertas; tidak ada "kanan-kiri"
  // untuk dihindari, jadi pita lebar penuh hanya untuk tata letak dua kolom.
  const pakaiPita = perHal > 1;
  const daftar = Array.isArray(tinggiBlokMm) ? tinggiBlokMm : [];
  const halaman = [];       // [[indeksBlok,...], ...] per kolom
  const lebarHalaman = [];  // PITA lebar penuh per halaman (sejajar `halaman`)
  const modeHalaman = [];   // 'kolom' | 'lebar'
  const luapan = [];        // halaman yang pitanya melewati satu halaman penuh
  const peringatan = [];    // blok yang MASIH lebih tinggi dari satu halaman penuh
  let kolomSaatIni = [];
  let tinggiSaatIni = 0;
  let tinggiPita = 0;
  let kapAktif = kapasitas; // sisa tinggi kolom pada halaman aktif (dipotong pita)

  const aktif = () => halaman[halaman.length - 1];
  const pitaAktif = () => lebarHalaman[lebarHalaman.length - 1] || [];
  const bukaHalaman = (mode = 'kolom') => {
    halaman.push([]);
    lebarHalaman.push([]);
    modeHalaman.push(mode);
    luapan.push(false);
    tinggiPita = 0;
    kapAktif = kapasitas;
  };
  const tutupKolom = () => {
    if (!kolomSaatIni.length) return;
    if (!aktif() || aktif().length >= perHal) bukaHalaman();
    aktif().push(kolomSaatIni);
    kolomSaatIni = [];
    tinggiSaatIni = 0;
  };
  // Pita lebar penuh: wacana panjang membentang selebar isi kertas di ATAS
  // halaman, lalu soal-soalnya menyusul dua kolom di bawahnya (persis susunan
  // buku ujian: baca dulu, baru kerjakan). Tidak ada kertas terbuang.
  const tambahPita = (i, hLebar) => {
    if (!aktif() || aktif().length > 0 || tinggiPita + hLebar > kapasitas) {
      tutupKolom();
      bukaHalaman('lebar');
    }
    pitaAktif().push(i);
    tinggiPita += hLebar;
    kapAktif = Math.max(0, kapasitas - tinggiPita);
    modeHalaman[modeHalaman.length - 1] = 'lebar';
    // Wacana lebih panjang dari satu halaman penuh: halamannya dibiarkan
    // MENGALIR (tinggi otomatis) supaya teksnya tidak terpotong diam-diam.
    if (tinggiPita > kapasitas) luapan[luapan.length - 1] = true;
  };

  daftar.forEach((tinggi, i) => {
    const h = Number.isFinite(tinggi) && tinggi > 0 ? tinggi : 10;
    // Gerbang ganda: (1) tingginya memang di atas ambang "panjang", DAN
    // (2) ditandai daftarBlokPenuh ATAU tinggi nyata melewati satu kolom.
    // Tanpa gerbang (1) blok yang ditaksir panjang tapi terukur pendek akan
    // membuang satu halaman; tanpa (2) wacana raksasa tetap diremas di kolom.
    const lebarPenuh = pakaiPita
      && h > ambangBacaanPanjangMm(kapasitas)
      && (!!penuhDitandai[i] || butuhLebarPenuh(h, kapasitas));

    if (!lebarPenuh) {
      if (!aktif()) bukaHalaman();
      if (tinggiSaatIni + h > kapAktif) {
        if (kolomSaatIni.length) tutupKolom();
        // kolom baru pun tak akan muat di bawah pita -> halaman baru tanpa pita
        else if (pitaAktif().length && h > kapAktif) bukaHalaman();
      }
      kolomSaatIni.push(i);
      tinggiSaatIni += h;
      if (tinggiSaatIni >= kapAktif) tutupKolom();
      return;
    }

    const terukur = tinggiLebarTerukur ? Number(tinggiLebarTerukur[i]) : 0;
    const hLebar = terukur > 0 ? terukur : tinggiLebarPenuhMm(h);
    if (hLebar > kapasitas) peringatan.push(i);
    const tinggiKop = Number(daftar[0]) > 0 ? Number(daftar[0]) : 26;
    // Kepala dokumen yang masih "terbuka" ikut naik ke pita: tanpa ini ada
    // halaman yang isinya cuma kop (separuh kertas terbuang).
    const kopTerbuka = i > 0 && tinggiKop + hLebar <= kapasitas
      && kolomSaatIni.length === 1 && kolomSaatIni[0] === 0 && !(aktif() && aktif().length);
    if (kopTerbuka) { kolomSaatIni = []; tinggiSaatIni = 0; }
    else tutupKolom();
    if (kopTerbuka) tambahPita(0, tinggiKop);
    tambahPita(i, hLebar);
  });
  tutupKolom();
  return { halaman, peringatan, modeHalaman, lebarHalaman, luapan };
}

// ---- render teks: escape + KaTeX (dipindah dari cetakLatihan.js supaya
//      mesin naskah dan mesin kotak berbagi satu renderer, tanpa impor
//      berkeliling) ----
export function escapeHtml(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function teksKeHtml(teks) {
  const bersih = String(teks ?? '').replace(/\{\{GAMBAR(?:_\d+)?\}\}/g, ' ').replace(/\s+/g, ' ').trim();
  const bagian = bersih.split(/(\$[^$]+\$)/g);
  return bagian
    .map((b) => {
      if (b.startsWith('$') && b.endsWith('$') && b.length > 2) {
        try {
          // 🔥 2026-10-09 (komplain guru matematika: "rumus gak seperti di
          // buku"). KaTeX merender matematika INLINE dalam textstyle, sehingga
          // pecahan/akar muncul kecil dan gepeng. Buku pelajaran mencetaknya
          // dalam displaystyle. Prefix \displaystyle hanya disisipkan bila
          // rumusnya memang memuat konstruksi bertingkat.
          const isi = b.slice(1, -1);
          const bertingkat = /\\(frac|dfrac|tfrac|sqrt|sum|prod|int|oint|lim|binom|begin\{)/.test(isi);
          return katex.renderToString(bertingkat ? `\\displaystyle ${isi}` : isi, { throwOnError: false });
        } catch {
          return escapeHtml(b);
        }
      }
      return escapeHtml(b);
    })
    .join('');
}

// ---- gaya tampilan (selector selalu di bawah .naskah supaya aman
//      disuntikkan ke halaman admin untuk lapisan ukur) ----
export const GAYA_NASKAH = `
.naskah { font-family: Arial, Helvetica, sans-serif; font-size: 11.5px; color: #000; background: #fff; line-height: 1.45; }
.naskah .nsk-hal { position: relative; background: #fff; padding: ${MARGIN_MM}mm ${MARGIN_MM}mm ${FOOTER_MM}mm; overflow: hidden; break-after: page; page-break-after: always; }
.naskah .nsk-kolomwrap { display: flex; gap: ${GAP_KOLOM_MM}mm; height: 100%; align-items: flex-start; }
.naskah .nsk-kolom { flex: 1 1 0; min-width: 0; overflow: hidden; }
.naskah .nsk-kop { border-bottom: 0.8mm solid #000; padding-bottom: 2mm; margin-bottom: 3mm; break-inside: avoid; }
.naskah .nsk-kop h1 { font-size: 14px; margin: 0 0 1mm; letter-spacing: 0.4px; }
.naskah .nsk-kop .nsk-meta { font-size: 10.5px; color: #000; }
.naskah .nsk-identitas { display: flex; gap: 8mm; font-size: 10.5px; margin-top: 2.5mm; }
.naskah .nsk-identitas span { border-bottom: 0.35mm solid #000; min-width: 45mm; padding-bottom: 2.5mm; }
.naskah .nsk-peringatan { border: 0.7mm solid #000; padding: 1.5mm 3mm; font-size: 11.5px; font-weight: 800; text-align: center; margin-bottom: 3mm; letter-spacing: 0.5px; break-inside: avoid; }
/* 🔥 BARU (2026-10-08): kepala seksi subtes di naskah try out (lihat
   seksiNaskahTryOut.js) -- pita tipis berbingkai, tidak boleh terbelah
   kolom, dan terpisah jelas dari butir pertama seksinya. */
.naskah .nsk-seksi { border: 0.4mm solid #000; padding: 1mm 2.5mm; font-size: 11.5px; font-weight: 800; letter-spacing: 0.6px; text-transform: uppercase; margin: 0 0 2.5mm; break-inside: avoid; }
.naskah .nsk-butir { margin: 0 0 4mm; break-inside: avoid; display: flex; gap: 2mm; }
.naskah .nsk-butir > .nsk-no { flex: 0 0 5.5mm; font-weight: 800; text-align: left; }
.naskah .nsk-butir > .nsk-isi { flex: 1 1 auto; min-width: 0; }
.naskah .nsk-gbr-samping { float: left; margin: 0 3mm 1.5mm 0; }
.naskah .nsk-gbr-blok { display: block; margin: 1.5mm auto; }
.naskah .nsk-opsi { display: grid; gap: 0.8mm 5mm; margin: 1.5mm 0 0 7.5mm; }
.naskah .nsk-opsi > span { break-inside: avoid; }
/* 🔥 2026-10-09: kotak centang KOSONG untuk pg_kompleks di lembar siswa.
   Sebelumnya satu-satunya "kotak" di lembar adalah glif ☑/☐ yang terbawa
   dari teks opsi impor -- dan glif itu sudah tercentang sesuai kunci
   (kebocoran kunci). Sekarang mesin cetak menyediakan kotaknya sendiri
   (kotak kosong berbingkai), terlepas dari bersih/kotor datanya. */
.naskah .nsk-kotak-centang { display: inline-block; width: 3.2mm; height: 3.2mm; border: 0.35mm solid #1f2937; border-radius: 0.5mm; margin: 0 1.4mm 0 0; vertical-align: -0.5mm; }
.naskah .nsk-bs { margin: 1.5mm 0 0 7.5mm; }
.naskah .nsk-bs-head, .naskah .nsk-bs-row { display: grid; grid-template-columns: 1fr 14mm 14mm; gap: 2mm; align-items: start; }
.naskah .nsk-bs-head { font-size: 8.5pt; font-weight: bold; border-bottom: 0.4pt solid #000; padding-bottom: 1mm; }
.naskah .nsk-bs-head > span:nth-child(2), .naskah .nsk-bs-head > span:nth-child(3),
.naskah .nsk-bs-row > span:nth-child(2), .naskah .nsk-bs-row > span:nth-child(3) { text-align: center; }
.naskah .nsk-bs-row { padding: 1.1mm 0; border-bottom: 0.3pt dotted #94a3b8; break-inside: avoid; }
.naskah .nsk-bs-kotak { width: 6mm; height: 6mm; border: 0.5pt solid #000; border-radius: 1mm; justify-self: center; }
.naskah .nsk-jodoh { display: grid; grid-template-columns: 1fr 1fr; gap: 5mm; margin: 1.5mm 0 0 7.5mm; }
.naskah .nsk-jodoh-kol { display: grid; gap: 1.2mm; }
.naskah .nsk-jodoh-kol > span { break-inside: avoid; border-bottom: 0.3pt dotted #94a3b8; padding-bottom: 1mm; }
.naskah .nsk-isian { margin: 2mm 0 0 7.5mm; font-size: 10.5pt; }
.naskah .nsk-esai { margin: 2mm 0 0 7.5mm; }
.naskah .nsk-esai > div { border-bottom: 0.4pt solid #64748b; height: 7mm; }
.naskah .nsk-kunci-baris { font-size: 10.8px; }
/* 2026-10-08: blok BACAAN/wacana. Sebelumnya mesin cetak TIDAK merender
   field bacaan sama sekali, sehingga soal literasi tercetak tanpa teks
   yang harus dibaca -- siswa disuruh menjawab pertanyaan tentang wacana
   yang tidak ada di lembar. (Komentar ini berada di dalam template
   literal GAYA_NASKAH, jadi sengaja tidak memakai backtick.) */
/* 2026-10-09 (owner: "perkecil font bacaan dan rapikan agar muat kanan kiri"):
   bacaan di dalam kolom memakai huruf lebih kecil + baris lebih rapat supaya
   muat rapi dalam kolom tanpa meluber ke kaki halaman. */
.naskah .nsk-bacaan { border-left: 3pt solid #000; border-top: 0.8pt solid #000;
  border-bottom: 0.8pt solid #000; padding: 4pt 5pt; margin: 0 0 4pt;
  font-size: 9.5pt; line-height: 1.45; text-align: left;
  break-inside: avoid; page-break-inside: avoid; }
/* 🔥 PITA LEBAR PENUH — khusus wacana panjang: "khusus bacaan panjang gausah
   kanan kiri". Wacana membentang selebar isi kertas di atas halaman (baris
   panjang, enak dibaca), soal-soalnya tetap dua kolom di bawah pita. Halaman
   jadi kolom flex vertikal supaya pita dan kolom tidak saling menimpa. */
.naskah .nsk-hal--lebar { display: flex; flex-direction: column; }
.naskah .nsk-hal--lebar .nsk-kolomwrap { flex: 1 1 auto; min-height: 0; height: auto; }
.naskah .nsk-band { width: 100%; margin-bottom: 2.5mm; }
.naskah .nsk-band .nsk-butir, .naskah .nsk-band .nsk-bacaan { break-inside: auto; page-break-inside: auto; }
.naskah .nsk-band .nsk-bacaan { font-size: 10pt; line-height: 1.48; padding: 5pt 7pt; }
.naskah .nsk-band .nsk-butir { font-size: 10.8px; line-height: 1.42; }
.naskah .nsk-band .nsk-opsi { grid-template-columns: repeat(2, minmax(0, 1fr)); }
/* Wacana yang bahkan setelah dilebarkan masih lebih panjang dari satu halaman:
   tinggi otomatis + overflow terlihat, jadi teks MENGALIR ke halaman fisik
   berikutnya dan tidak ada satu huruf pun yang terpotong. Nomor halaman di
   kaki bisa bergeser; guru sudah diperingatkan di layar. */
.naskah .nsk-hal--luapan { height: auto !important; overflow: visible !important; }
.naskah .nsk-bacaan-rentang { font-size: 8pt; font-style: italic; color: #475569;
  margin-bottom: 3pt; }
.naskah .nsk-bacaan img { max-width: 100%; }
.naskah .nsk-footer { position: absolute; left: 0; right: 0; bottom: 2.5mm; text-align: center; font-size: 10px; color: #000; }
.naskah .katex { font-size: 1.02em; }
`;

function imgNaskahHtml(src, alt, ukuran) {
  const gaya = `width:${ukuran.lebarMm}mm;height:${ukuran.tinggiMm}mm;object-fit:contain;`;
  const cls = ukuran.mode === 'samping' ? 'nsk-gbr-samping' : 'nsk-gbr-blok';
  return `<img class="${cls}" src="${escapeHtml(src)}" alt="${escapeHtml(alt)}" style="${gaya}" />`;
}

// Rasio bawaan sebelum gambar selesai dimuat: mayoritas gambar soal
// bentuknya melebar sedikit (diagram/foto), jadi 1.3 supaya susunan
// awal tidak lompat jauh saat rasio asli tiba.
export const RASIO_BAWAAN_GAMBAR = 1.3;

/**
 * HTML satu butir naskah siswa. `rasioGambar` adalah peta url -> rasio
// (lebar/tinggi piksel asli) yang diisi halaman saat gambar dimuat;
// tanpa peta ini ukuran gambar jatuh ke rasio bawaan.
 */
/**
 * Blok bacaan/wacana untuk naskah cetak.
 * Kosong bila butir memang tidak punya bacaan.
 */
export function bacaanNaskahHtml(soal, nomor, lebarKolom, rasioGambar = {}) {
  const bacaan = bacaanDari(soal);
  if (!bacaan) return '';
  const segmen = pisahTeksDanGambar(bacaan.teks, bacaan.gambar);
  const isi = segmen
    .map((sg) => {
      if (sg.jenis === 'teks') return `<div>${teksKeHtml(sg.isi)}</div>`;
      const r = rasioGambar[sg.url] ?? RASIO_BAWAAN_GAMBAR;
      const ukuran = ukuranGambarNaskah(r, 1, lebarKolom) || { mode: 'blok', lebarMm: 40, tinggiMm: 30 };
      return imgNaskahHtml(sg.url, `Gambar bacaan nomor ${nomor}`, ukuran);
    })
    .join('');
  // 🔥 2026-10-09: label "Bacalah teks berikut" DIHAPUS dari lembar cetak atas
  // permintaan owner ("hilangkan identitas soal di atas... membuat space",
  // kertas kedepannya dipotong). Blok bergaris kiri tetap menandai wacana;
  // rentang nomor disisipkan ringkas di akhir bila ada, karena ia informasi
  // yang dibutuhkan siswa, bukan hiasan.
  const rentang = bacaan.rentang
    ? `<div class="nsk-bacaan-rentang">untuk soal ${bacaan.rentang.dari}–${bacaan.rentang.sampai}</div>`
    : '';
  return `<div class="nsk-bacaan">${rentang}${isi}</div>`;
}

export function barisBenarSalah(soal) {
  const tabel = Array.isArray(soal?.tabelBenarSalah) ? soal.tabelBenarSalah : [];
  if (tabel.length) {
    return tabel.map((r) => ({ teks: String(r?.pernyataan || ''), kunci: String(r?.kunci || '') }));
  }
  const per = Array.isArray(soal?.pernyataan) ? soal.pernyataan : [];
  return per.map((r) => (typeof r === 'string'
    ? { teks: r, kunci: '' }
    : { teks: String(r?.teks || ''), kunci: String(r?.jawaban || r?.kunci || '') }));
}

function gambarDalamTeks(teks, gambarUrls, nomor, rasioGambar, lebarKolom) {
  return pisahTeksDanGambar(teks, gambarUrls)
    .map((sg) => {
      if (sg.jenis === 'teks') return teksKeHtml(sg.isi);
      const r = rasioGambar[sg.url] ?? RASIO_BAWAAN_GAMBAR;
      const u = ukuranGambarNaskah(r, 1, lebarKolom * 0.9) || { mode: 'blok', lebarMm: 40, tinggiMm: 30 };
      return imgNaskahHtml(sg.url, `Gambar nomor ${nomor}`, u);
    })
    .join('');
}

/**
 * Isi jawaban per tipe untuk LEMBAR SISWA (tanpa kunci).
 * @returns {string} HTML tambahan setelah badan soal
 */
export function isiJawabanNaskah(soal, nomor, lebarKolom, rasioGambar = {}) {
  const tipe = String(soal?.tipe || 'pg_sederhana');
  const rg = rasioGambar;

  if (tipe === 'benar_salah' || tipe === 'pg_kategori') {
    const baris = barisBenarSalah(soal);
    if (!baris.length) return '';
    const rows = baris.map((b, i) => `<div class="nsk-bs-row"><span class="nsk-bs-teks">${i + 1}. ${gambarDalamTeks(b.teks, [], nomor, rg, lebarKolom)}</span><span class="nsk-bs-kotak"></span><span class="nsk-bs-kotak"></span></div>`).join('');
    return `<div class="nsk-bs"><div class="nsk-bs-head"><span></span><span>Benar</span><span>Salah</span></div>${rows}</div>`;
  }

  if (tipe === 'pg_kompleks') {
    const per = Array.isArray(soal?.pernyataan) ? soal.pernyataan : [];
    if (!per.length) return '';
    // kotak centang kosong + teks pernyataan yang sudah dilepas dari
    // glif penanda kunci (lihat bersihkanGlifKunci.js)
    const items = per.map((q, i) => `<span><i class="nsk-kotak-centang" aria-hidden="true"></i>(${String.fromCharCode(65 + i)}) ${gambarDalamTeks(bersihkanTeksOpsi(typeof q === 'string' ? q : (q?.teks || '')), [], nomor, rg, lebarKolom)}</span>`).join('');
    return `<div class="nsk-opsi" style="grid-template-columns:1fr;">${items}</div>`;
  }

  if (tipe === 'menjodohkan') {
    const pasangan = Array.isArray(soal?.pasangan) ? soal.pasangan : [];
    if (!pasangan.length) return '';
    const kiri = pasangan.map((q, i) => `<span>${i + 1}. ${gambarDalamTeks(String(q?.kiri || ''), [], nomor, rg, lebarKolom)}</span>`).join('');
    const kanan = pasangan.map((q, i) => `<span>${String.fromCharCode(65 + i)}. ${gambarDalamTeks(String(q?.kanan || ''), [], nomor, rg, lebarKolom)}</span>`).join('');
    return `<div class="nsk-jodoh"><div class="nsk-jodoh-kol">${kiri}</div><div class="nsk-jodoh-kol">${kanan}</div></div>`;
  }

  if (tipe === 'isian_singkat' || tipe === 'numerik') {
    return '<div class="nsk-isian">Jawaban: ............................................</div>';
  }

  if (tipe === 'esai' || tipe === 'uraian') {
    return '<div class="nsk-esai"><div></div><div></div><div></div><div></div></div>';
  }

  return '';
}

/** Kunci per baris untuk LEMBAR KUNCI (benar/salah & menjodohkan). */
export function kunciPerBaris(soal) {
  const tipe = String(soal?.tipe || 'pg_sederhana');
  if (tipe === 'benar_salah' || tipe === 'pg_kategori') {
    const baris = barisBenarSalah(soal).filter((b) => b.kunci);
    if (!baris.length) return '';
    return baris.map((b, i) => `${i + 1}. ${String(b.kunci).toUpperCase()}`).join(', ');
  }
  if (tipe === 'menjodohkan') {
    const pasangan = Array.isArray(soal?.pasangan) ? soal.pasangan : [];
    if (!pasangan.length) return '';
    return pasangan.map((q, i) => `${i + 1}-${String.fromCharCode(65 + i)}`).join(', ');
  }
  return '';
}

export function butirNaskahHtml(soal, nomor, lebarKolom, rasioGambar = {}, opsiButir = {}) {
  // Bacaan DIDAHULUKAN bila butir ini MEMBAWA bacaannya sendiri. Bila wacana
  // sudah dicetak sebagai blok stimulus terpisah (lihat kelompokkanStimulus),
  // butir menerima opsiButir.tanpaBacaan supaya teks tidak TERULANG per nomor.
  const bacaanHtml = opsiButir.tanpaBacaan ? '' : bacaanNaskahHtml(soal, nomor, lebarKolom, rasioGambar);
  const segmen = pisahTeksDanGambar(teksSoalDari(soal), soal?.gambarUrls);
  const badan = segmen
    .map((sg) => {
      if (sg.jenis === 'teks') return `<div>${teksKeHtml(sg.isi)}</div>`;
      const r = rasioGambar[sg.url] ?? RASIO_BAWAAN_GAMBAR;
      const ukuran = ukuranGambarNaskah(r, 1, lebarKolom) || { mode: 'blok', lebarMm: 40, tinggiMm: 30 };
      return imgNaskahHtml(sg.url, `Gambar soal nomor ${nomor}`, ukuran);
    })
    .join('');
  const opsi = Array.isArray(soal?.opsiJawaban) ? soal.opsiJawaban : [];
  // 🔥 2026-10-09: teks opsi dilepas dari glif penanda kunci (☑/☐) yang
  // terbawa impor -- di data produksi glif itu persis sama dengan kunci
  // jawaban, jadi lembar siswa yang mencetaknya berarti membocorkan
  // kunci. Lihat src/utils/bersihkanGlifKunci.js.
  const teksOpsi = opsi.map((o) => bersihkanTeksOpsi(typeof o === 'string' ? o : o?.teks || ''));
  const nKolomOpsi = kolomPilihanNaskah(teksOpsi, lebarKolom);
  // pg_kompleks tanpa daftar pernyataan: pilihannyalah permukaan centang
  // siswa, jadi tiap baris mendapat kotak KOSONG dari mesin cetak (bukan
  // dari data). Kalau ada pernyataan, kotaknya dipasang di blok jawaban
  // (isiJawabanNaskah) supaya tidak dobel.
  const tipeButir = String(soal?.tipe || 'pg_sederhana');
  const adaPernyataan = Array.isArray(soal?.pernyataan) && soal.pernyataan.length > 0;
  const kotakCentang = tipeButir === 'pg_kompleks' && !adaPernyataan
    ? '<i class="nsk-kotak-centang" aria-hidden="true"></i>'
    : '';
  const opsiHtml = teksOpsi
    .map((t, i) => {
      const huruf = String.fromCharCode(65 + i);
      const gbr = (opsi[i] && typeof opsi[i] === 'object' && Array.isArray(opsi[i].gambar))
        ? opsi[i].gambar
          .map((g) => {
            const src = g?.uploadedUrl || g?.url || '';
            if (!src) return '';
            const r = rasioGambar[src] ?? RASIO_BAWAAN_GAMBAR;
            const ukuran = ukuranGambarNaskah(r, 1, lebarKolom * 0.5) || { mode: 'blok', lebarMm: 30, tinggiMm: 22 };
            return imgNaskahHtml(src, `Gambar pilihan ${huruf}`, ukuran);
          })
          .join('')
        : '';
      return `<span>${kotakCentang}(${huruf}) ${teksKeHtml(t)}${gbr}</span>`;
    })
    .join('');
  // 🔥 bagian jawaban per tipe (diport dari main #183): benar/salah mendapat
  // tabelnya, pg_kompleks pernyataannya, menjodohkan pasangannya, isian &
  // esai tempat menjawabnya -- siswa tidak lagi disuruh menjawab di ruang
  // yang tidak tercetak.
  const isiJawaban = isiJawabanNaskah(soal, nomor, lebarKolom, rasioGambar);
  return `<div class="nsk-butir"><div class="nsk-no">${nomor}.</div><div class="nsk-isi">${bacaanHtml}${badan}${opsiHtml ? `<div class="nsk-opsi" style="grid-template-columns:repeat(${nKolomOpsi},1fr);">${opsiHtml}</div>` : ''}${isiJawaban}</div></div>`;
}

export function kopNaskahHtml(paket, judulDok, denganIdentitas) {
  const bagianMeta = [paket?.mapel || paket?.targetKategori || '', paket?.targetKelas || '', paket?.bab || '']
    .filter(Boolean);
  const judulPaket = String(paket?.judul || '');
  // 🔥 2026-10-09: judul keranjang sudah berbentuk "jenjang · mapel · materi".
  // Menambah baris meta yang sama = identitas tertulis dua kali dan memakan
  // ruang kertas yang menurut owner "kedepannya bakal dipotong". Meta hanya
  // ditulis bila ia membawa informasi BARU di luar judul.
  const meta = bagianMeta.filter((b) => !judulPaket.includes(String(b))).map(escapeHtml).join(' · ');
  return `<div class="nsk-kop"><h1>${escapeHtml(judulDok)}</h1>
    <div class="nsk-meta">${escapeHtml(judulPaket || 'Naskah Soal')}${meta ? ` — ${meta}` : ''}</div>
    ${denganIdentitas ? '<div class="nsk-identitas"><span>Nama:</span><span>Kelas:</span><span>No. Absen:</span></div>' : ''}
  </div>`;
}

export function kunciButirNaskahHtml(soal, nomor) {
  const kunci = Array.isArray(soal?.kunciJawaban)
    ? soal.kunciJawaban.map((k) => String.fromCharCode(65 + Number(k))).join(', ')
    : escapeHtml(String(soal?.kunci ?? soal?.kunciJawaban ?? '-'));
  const pembahasan = soal?.pembahasan
    ? pisahTeksDanGambar(soal.pembahasan, soal?.gambarUrls)
      .map((sg) => (sg.jenis === 'teks' ? teksKeHtml(sg.isi) : ''))
      .join(' ')
    : '';
  const perBaris = kunciPerBaris(soal);
  const kunciTampil = perBaris ? `${kunci}${kunci ? ' · ' : ''}${perBaris}` : kunci;
  return `<div class="nsk-butir"><div class="nsk-no">${nomor}.</div><div class="nsk-isi nsk-kunci-baris"><b>Kunci:</b> ${kunciTampil || '-'}${pembahasan ? ` — ${pembahasan}` : ''}</div></div>`;
}

/**
 * Daftar blok HTML sesuai urutan susun: blok 0 = kepala dokumen,
 * sisanya butir. Halaman guru mengukur tinggi tiap blok dari daftar
 * ini, lalu menyerahkannya kembali ke susunNaskahDariBlok.
 */
/**
 * Kelompokkan butir yang berbagi wacana yang sama menjadi SATU unit stimulus
 * diikuti butir-butirnya — persis seperti naskah ujian sesungguhnya:
 * teks dicetak SEKALI, lalu "untuk soal nomor 3-5", lalu soal 3, 4, 5 tanpa
 * mengulang teks.
 *
 * Kesamaan stimulus dilihat dari `stimulusGrup`/`bacaan.grup` bila ada,
 * selain itu dari sidik jari teks+gambar (karena tidak semua jalur impor
 * mengisi grup). Hanya butir BERURUTAN yang digabung; wacana yang muncul lagi
 * jauh di belakang memang layak dicetak ulang (siswa tidak disuruh membuka
 * halaman sebelumnya).
 */
export function kelompokkanStimulus(daftar) {
  const kunci = (s) => {
    const b = bacaanDari(s);
    if (!b) return '';
    const grup = s?.stimulusGrup || b.grup;
    if (grup) return String(grup);
    return `teks:${String(b.teks || '').replace(/\s+/g, ' ').slice(0, 160)}|${(b.gambar || []).join(',')}`;
  };
  const units = [];
  const daftarSoal = Array.isArray(daftar) ? daftar : [];
  let i = 0;
  while (i < daftarSoal.length) {
    const k = kunci(daftarSoal[i]);
    if (!k) {
      units.push({ jenis: 'butir', soal: daftarSoal[i], nomor: i + 1, tanpaBacaan: false });
      i += 1;
      continue;
    }
    let j = i;
    while (j < daftarSoal.length && kunci(daftarSoal[j]) === k) j += 1;
    units.push({ jenis: 'bacaan', bacaan: bacaanDari(daftarSoal[i]), dari: i + 1, sampai: j });
    for (let q = i; q < j; q += 1) units.push({ jenis: 'butir', soal: daftarSoal[q], nomor: q + 1, tanpaBacaan: true });
    i = j;
  }
  return units;
}

/** Tinggi taksiran sebuah blok bacaan (mm) pada lebar kolom tertentu. */
export function estimasiTinggiBacaan(bacaan, lebarKolom, rasioGambar = {}) {
  const hurufSebaris = Math.max(20, (lebarKolom - 8) / MM_PER_HURUF);
  const teks = String(bacaan?.teks || '');
  const baris = Math.ceil(Math.max(1, teks.length) / hurufSebaris) * 4.4;
  const gambar = (Array.isArray(bacaan?.gambar) ? bacaan.gambar : []).reduce((acc, g) => {
    const src = typeof g === 'string' ? g : (g?.url || g?.uploadedUrl || '');
    if (!src) return acc;
    const r = rasioGambar[src] ?? RASIO_BAWAAN_GAMBAR;
    const u = ukuranGambarNaskah(r, 1, lebarKolom);
    return acc + (u ? u.tinggiMm + 2 : 30);
  }, 0);
  return Math.round(baris + gambar + 10); // +judul blok & padding
}

/**
 * Blok bacaan untuk naskah.
 *   - bacaan pendek  -> blok kolom biasa, huruf diperkecil (9.5pt) supaya
 *     rapi "muat kanan kiri";
 *   - bacaan PANJANG (lebih tinggi dari ambangBacaanPanjangMm) -> SATU blok
 *     lebar penuh dengan penanda `penuh: true`; penyusun kolom memberinya
 *     halaman sendiri sehingga tidak ada kanan-kiri (owner: "khusus bacaan
 *     panjang gausah kanan kiri"). Tinggi yang dikembalikan adalah tinggi
 *     pada lebar penuh, bukan pada lebar kolom.
 * Pemecahan per paragraf kini hanya cadangan terakhir: bila wacana masih
 * lebih tinggi dari satu halaman penuh. Titik potong tetap di batas paragraf
 * dan tiap potongan diberi penanda "(lanjutan)" — tidak pernah di tengah
 * kalimat.
 */
export function blokBacaanNaskah(unit, lebarKolom, rasioGambar = {}, kapasitasMm = 0, kolomPerHalaman = 2) {
  const bacaan = unit?.bacaan;
  if (!bacaan) return [];
  const nKolom = kolomPerHalaman > 1 ? kolomPerHalaman : 1;
  const lebarHalaman = lebarKolom * nKolom + (nKolom - 1) * GAP_KOLOM_MM;
  const kapasitas = kapasitasMm > 0 ? kapasitasMm : 100000;
  // 🔥 2026-10-09 (owner: "perkecil font bacaan dan rapikan agar muat kanan
  // kiri, atau khusus bacaan panjang gausah kanan kiri").
  // Bacaan yang di kolom lebih tinggi dari ambang "panjang" dicetak sebagai
  // PITA LEBAR PENUH (barisnya selebar isi kertas). Pemecahan per paragraf
  // kini hanya cadangan terakhir: bila wacana masih lebih tinggi dari satu
  // halaman penuh meski sudah dilebarkan.
  const lebarPenuh = estimasiTinggiBacaan(bacaan, lebarKolom, rasioGambar) > ambangBacaanPanjangMm(kapasitas);
  const lebarCetak = lebarPenuh ? lebarHalaman : lebarKolom;
  const rentang = unit.dari && unit.sampai && unit.sampai > unit.dari
    ? ` untuk soal ${unit.dari}–${unit.sampai}`
    : (unit.dari ? ` untuk soal ${unit.dari}` : '');
  const segmen = pisahTeksDanGambar(bacaan.teks, bacaan.gambar);
  const classBlok = lebarPenuh ? 'nsk-bacaan nsk-bacaan-panjang' : 'nsk-bacaan';
  const judul = (lanjutanKe) => `<div class="nsk-bacaan-judul">Bacalah teks berikut${rentang}${lanjutanKe ? ` (lanjutan ${lanjutanKe})` : ''}</div>`;

  const baris = (teks, lebar) => Math.ceil(Math.max(1, teks.length) / Math.max(20, (lebar - 8) / MM_PER_HURUF)) * 4.4;
  const chunks = [];
  let isiSekarang = '';
  // DUA tinggi dihitung sekaligus:
  //   tCetak  = tinggi pada lebar cetaknya (dipakai memutuskan pemecahan);
  //   tLapor  = tinggi pada LEBAR KOLOM (yang dilaporkan ke atas).
  // Kenapa tLapor versi kolom: seluruh mesin — lapisan ukur DOM di halaman
  // Cetak maupun susunKeKolom — memakai tinggi versi kolom sebagai satuan
  // baku, lalu menaksir versi lebar penuh lewat FAKTOR_TINGGI_LEBAR_PENUH.
  // Kalau yang dilaporkan versi lebar, gerbang ambang di susunKeKolom akan
  // menolak blok yang seharusnya naik ke pita.
  let tCetak = 8;
  let tLapor = 8;
  let nomorChunk = 0;
  const tutup = () => {
    if (!isiSekarang) return;
    nomorChunk += 1;
    chunks.push({
      html: `<div class="${classBlok}">${judul(nomorChunk > 1 ? nomorChunk : 0)}${isiSekarang}</div>`,
      tinggi: Math.round(tLapor * 10) / 10,
      penuh: lebarPenuh,
    });
    isiSekarang = '';
    tCetak = 8;
    tLapor = 8;
  };
  for (const sg of segmen) {
    let html;
    let hCetak;
    let hLapor;
    if (sg.jenis === 'teks') {
      // pecah per paragraf/kalimat panjang supaya titik potong rapi
      const paragraf = String(sg.isi).split(/(?<=[.!?])\s+(?=[A-Z"“])/).filter(Boolean);
      for (const par of paragraf) {
        hCetak = baris(par, lebarCetak);
        hLapor = lebarPenuh ? baris(par, lebarKolom) : hCetak;
        if (tCetak + hCetak > kapasitas && isiSekarang) tutup();
        isiSekarang += `<div>${teksKeHtml(par)}</div>`;
        tCetak += hCetak;
        tLapor += hLapor;
      }
      continue;
    } else {
      const r = rasioGambar[sg.url] ?? RASIO_BAWAAN_GAMBAR;
      const u = ukuranGambarNaskah(r, 1, lebarCetak) || { mode: 'blok', lebarMm: 40, tinggiMm: 30 };
      html = imgNaskahHtml(sg.url, 'Gambar bacaan', u);
      hCetak = u.tinggiMm + 2;
      const uKolom = ukuranGambarNaskah(r, 1, lebarKolom) || { mode: 'blok', lebarMm: 40, tinggiMm: 30 };
      hLapor = lebarPenuh ? uKolom.tinggiMm + 2 : hCetak;
    }
    if (tCetak + hCetak > kapasitas && isiSekarang) tutup();
    isiSekarang += html;
    tCetak += hCetak;
    tLapor += hLapor;
  }
  tutup();
  return chunks;
}

export function daftarBlokNaskah(mode, paket, soalList, lebarKolom, rasioGambar = {}, kapasitasMm = 0, kolomPerHalaman = 2) {
  const daftar = Array.isArray(soalList) ? soalList : [];
  const kop = mode === 'kunci'
    ? `<div class="nsk-peringatan">PEGANGAN GURU — JANGAN DICETAK UNTUK SISWA</div>${kopNaskahHtml(paket, 'KUNCI & PEMBAHASAN', false)}`
    : kopNaskahHtml(paket, 'NASKAH SOAL', true);
  if (mode === 'kunci') {
    return [kop, ...daftar.map((s, i) => kunciButirNaskahHtml(s, i + 1))];
  }
  const blok = [kop];
  for (const unit of kelompokkanStimulus(daftar)) {
    if (unit.jenis === 'bacaan') {
      for (const chunk of blokBacaanNaskah(unit, lebarKolom, rasioGambar, kapasitasMm, kolomPerHalaman)) blok.push(chunk.html);
    } else {
      blok.push(butirNaskahHtml(unit.soal, unit.nomor, lebarKolom, rasioGambar, { tanpaBacaan: unit.tanpaBacaan }));
    }
  }
  return blok;
}

/**
 * Tinggi perkiraan (mm) yang SEJAJAR dengan keluaran daftarBlokNaskah —
 * dipakai sebagai cadangan bila lapisan ukur DOM belum siap. Panjangnya
 * selalu sama dengan jumlah blok, supaya penyusun kolom tidak diam-diam
  * jatuh ke taksiran buta.
 */
/**
 * Bendera "blok ini halaman lebar penuh", SEJAJAR (indeks sama, panjang sama)
 * dengan keluaran daftarBlokNaskah. Dipakai dua tempat:
 *   1. lapisan ukur di halaman Cetak — blok lebar penuh harus diukur pada
 *      lebar kertas, bukan lebar kolom, supaya tingginya jujur;
 *   2. susunKeKolom — supaya blok itu tidak diselipkan ke kolom biasa.
 */
export function daftarBlokPenuh(mode, paket, soalList, lebarKolom, rasioGambar = {}, kapasitasMm = 0, kolomPerHalaman = 2) {
  const daftar = Array.isArray(soalList) ? soalList : [];
  if (mode === 'kunci') return [false, ...daftar.map(() => false)];
  const tanda = [false]; // kop
  for (const unit of kelompokkanStimulus(daftar)) {
    if (unit.jenis === 'bacaan') {
      for (const chunk of blokBacaanNaskah(unit, lebarKolom, rasioGambar, kapasitasMm, kolomPerHalaman)) tanda.push(!!chunk.penuh);
    } else {
      const t = estimasiTinggiBlokMm('siswa', unit.soal, lebarKolom, rasioGambar, { tanpaBacaan: unit.tanpaBacaan });
      // Butir berwacana raksasa (wacana menempel di stem — pola impor HTML
      // Master/Tinitus) ikut lebar penuh: di kolom 92 mm teks semacam itu jadi
      // dinding huruf sempit dan di kertas owner meluber lewat kaki halaman.
      tanda.push(butuhLebarPenuh(t, ambangBacaanPanjangMm(kapasitasMm)));
    }
  }
  return tanda;
}

export function daftarTinggiPerkiraan(mode, paket, soalList, lebarKolom, rasioGambar = {}, kapasitasMm = 0, kolomPerHalaman = 2) {
  const daftar = Array.isArray(soalList) ? soalList : [];
  const tinggi = [mode === 'kunci' ? 30 : 26];
  if (mode === 'kunci') {
    for (const s of daftar) tinggi.push(estimasiTinggiBlokMm('kunci', s, lebarKolom, rasioGambar));
    return tinggi;
  }
  for (const unit of kelompokkanStimulus(daftar)) {
    if (unit.jenis === 'bacaan') {
      for (const chunk of blokBacaanNaskah(unit, lebarKolom, rasioGambar, kapasitasMm, kolomPerHalaman)) tinggi.push(chunk.tinggi);
    } else {
      tinggi.push(estimasiTinggiBlokMm('siswa', unit.soal, lebarKolom, rasioGambar, { tanpaBacaan: unit.tanpaBacaan }));
    }
  }
  return tinggi;
}

/** Tinggi taksiran (mm) sebelum pengukuran layar tersedia. */
export function estimasiTinggiBlokMm(mode, soal, lebarKolom, rasioGambar = {}, opsiEstimasi = {}) {
  const hurufSebaris = Math.max(20, (lebarKolom - 8) / MM_PER_HURUF);
  if (mode === 'kunci') {
    const panjang = String(soal?.pembahasan || '').length + 20;
    return Math.round((Math.ceil(panjang / hurufSebaris) * 4.3) + 4);
  }
  const teks = teksSoalDari(soal);
  const gambar = Array.isArray(soal?.gambarUrls) ? soal.gambarUrls.filter(Boolean) : [];
  // Bacaan panjang menambah tinggi blok secara nyata. Bila tidak dihitung,
  // mesin akan menumpuk terlalu banyak butir per kolom dan naskah meluber
  // ke halaman berikutnya (pratinjau layar != hasil cetak).
  const bacaan = opsiEstimasi.tanpaBacaan ? null : bacaanDari(soal);
  const teksBacaan = bacaan ? String(bacaan.teks || '') : '';
  const gambarBacaan = bacaan && Array.isArray(bacaan.gambar) ? bacaan.gambar.filter(Boolean) : [];
  const tinggiGambar = gambar.reduce((acc, url) => {
    const r = rasioGambar[url] ?? RASIO_BAWAAN_GAMBAR;
    const u = ukuranGambarNaskah(r, 1, lebarKolom);
    return acc + (u ? u.tinggiMm + 2 : 30);
  }, 0);
  const opsi = Array.isArray(soal?.opsiJawaban) ? soal.opsiJawaban.map((o) => (typeof o === 'string' ? o : o?.teks || '')) : [];
  const nKolomOpsi = kolomPilihanNaskah(opsi, lebarKolom);
  const barisOpsi = Math.ceil(opsi.length / nKolomOpsi) * 4.6;
  const barisTeks = Math.ceil(Math.max(1, teks.length) / hurufSebaris) * 4.6;
  const tinggiGambarBacaan = gambarBacaan.reduce((acc, url) => {
    const src = typeof url === 'string' ? url : (url?.uploadedUrl || url?.url || '');
    if (!src) return acc;
    const r = rasioGambar[src] ?? RASIO_BAWAAN_GAMBAR;
    const u = ukuranGambarNaskah(r, 1, lebarKolom);
    return acc + (u ? u.tinggiMm + 2 : 30);
  }, 0);
  const barisBacaan = teksBacaan
    ? Math.ceil(teksBacaan.length / hurufSebaris) * 4.0 + 8 // +8: padding & judul blok
    : 0;
  // 🔥 Isi per tipe ikut dihitung (diport dari main #183): sebelumnya tinggi
  // benar_salah/menjodohkan/esai ditaksir tanpa baris jawabannya, sehingga
  // kolom meluber dan halaman terlihat berantakan di kertas.
  const tipeSoal = String(soal?.tipe || 'pg_sederhana');
  let tinggiIsi = 0;
  if (tipeSoal === 'benar_salah' || tipeSoal === 'pg_kategori') {
    tinggiIsi = barisBenarSalah(soal).reduce((acc, b) => acc + Math.max(6, Math.ceil(Math.max(1, String(b.teks || '').length) / hurufSebaris) * 4.6), 6);
  } else if (tipeSoal === 'pg_kompleks') {
    const per = Array.isArray(soal?.pernyataan) ? soal.pernyataan : [];
    tinggiIsi = per.reduce((acc, q) => acc + Math.ceil(Math.max(1, String(typeof q === 'string' ? q : q?.teks || '').length) / hurufSebaris) * 4.6, 0);
  } else if (tipeSoal === 'menjodohkan') {
    const pas = Array.isArray(soal?.pasangan) ? soal.pasangan : [];
    tinggiIsi = Math.ceil(pas.length / 2) * 6 + 4;
  } else if (tipeSoal === 'isian_singkat' || tipeSoal === 'numerik') {
    tinggiIsi = 8;
  } else if (tipeSoal === 'esai' || tipeSoal === 'uraian') {
    tinggiIsi = 30;
  }
  return Math.round(barisTeks + tinggiGambar + tinggiGambarBacaan + barisBacaan + barisOpsi + tinggiIsi + 4);
}

/**
 * Penyusun akhir: blok HTML + tinggi tiap blok -> fragmen siap cetak
 * (halaman-kolom eksplisit, nomor halaman di kaki).
 */
// ============================================================
// WATERMARK LOGO GEMILANG
// ============================================================
// Permintaan owner 2026-10-08: kartu baca tentor dan lembar yang dicetak
// harus membawa logo Gemilang di belakangnya. Ini bukan hiasan -- lembar
// latihan yang beredar di luar kelas harus kelihatan asal-usulnya, dan
// tangkapan layar kartu baca tidak bisa diklaim sebagai buatan sendiri.
//
// Logonya SENGAJA sama dengan yang dipakai kwitansi (`kwitansi.js` baris
// `const logo = '/pwa-192x192.png'`), supaya satu identitas di semua
// dokumen Gemilang dan tidak ada berkas logo keempat yang hilang
// (tiga berkas di repo ini merujuk `/logo-gemilang.png.png` yang
// TIDAK ADA di public/ -- selamat oleh onError, jadi logonya diam-diam
// tidak pernah tampil).
//
// Dua cara pasang, karena dua bentuk dokumen:
//   'halaman' -> satu watermark per .nsk-hal (naskah dua kolom, tiap
//                halaman memang sebuah kotak berukuran kertas)
//   'tetap'   -> position:fixed, otomatis diulang Chrome di setiap
//                halaman cetak (dokumen mengalir ala lembar gunting)
// ============================================================

/** Logo resmi Gemilang — sama dengan yang dipakai kwitansi. */
export const LOGO_WATERMARK = WATERMARK.logo;

/**
 * @param {object} [o]
 * @param {'halaman'|'tetap'} [o.mode]
 * @param {number} [o.opacity] 0..1 — cukup terlihat tanpa mengganggu baca
 * @param {number} [o.ukuranMm]
 * @returns {string} CSS
 */
export function gayaWatermark(o = {}) {
  // Default DICETAK: opacity 0.12 dan 95mm (dulu 0.07 / 62mm).
  // Owner 2026-10-08: "watermark besarkan lagi gapapa, opasitasnya agak
  // dijelaskin". Tetap di bawah 0.2 supaya teks soal tidak kalah.
  const opacity = Number.isFinite(o.opacity) ? o.opacity : WATERMARK.opacityCetak;
  const ukuran = Number.isFinite(o.ukuranMm) ? o.ukuranMm : WATERMARK.ukuranMm;
  const posisi = o.mode === 'tetap'
    ? 'position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%);'
    : 'position: absolute; inset: 0;';
  return `
.wm-gemilang { ${posisi} display: flex; align-items: center; justify-content: center;
  pointer-events: none; z-index: 0; overflow: hidden; }
.wm-gemilang img { width: ${ukuran}mm; height: ${ukuran}mm; object-fit: contain; opacity: ${opacity}; }
.nsk-kolomwrap, .nsk-band, .kotak, .kepala, .identitas { position: relative; z-index: 1; }
@media print { .wm-gemilang { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
`;
}

/**
 * @param {object} [o] { logo, mode, opacity, ukuranMm, teks }
 * @returns {string} HTML watermark (aria-hidden: hiasan, bukan konten)
 */
export function watermarkHtml(o = {}) {
  const logo = o.logo || LOGO_WATERMARK;
  const mode = o.mode === 'tetap' ? ' tetap' : '';
  return `<div class="wm-gemilang${mode}" aria-hidden="true"><img src="${escapeHtml(logo)}" alt="" /></div>`;
}

/**
 * Sebarkan blok halaman terakhir ke semua kolom supaya tinggi kolom
 * sedatar mungkin (greedy: blok berikutnya masuk kolom terpendek).
 * Halaman selain terakhir TIDAK disentuh — keduanya sudah penuh oleh
 * kapasitas, dan mengutak-atiknya bisa membelah butir.
 */
export function seimbangkanHalamanTerakhir(halaman, tinggi, kolomPerHalaman) {
  const n = kolomPerHalaman > 1 ? kolomPerHalaman : 1;
  if (!halaman.length || n < 2) return halaman;
  const terakhir = halaman[halaman.length - 1];
  if (terakhir.length < 2) return halaman;
  const urut = terakhir.flat().sort((a, b) => a - b); // jaga urutan nomor
  const kolom = Array.from({ length: n }, () => []);
  const tinggiKolom = new Array(n).fill(0);
  for (const idx of urut) {
    let p = 0;
    for (let k = 1; k < n; k += 1) if (tinggiKolom[k] < tinggiKolom[p]) p = k;
    kolom[p].push(idx);
    tinggiKolom[p] += Number.isFinite(tinggi[idx]) ? tinggi[idx] : 10;
  }
  // jangan sampai ada kolom kosong sementara kolom lain penuh
  if (kolom.some((k) => k.length === 0)) return halaman;
  return [...halaman.slice(0, -1), kolom];
}

export function susunNaskahDariBlok(blokHtml, opsi = {}) {
  const kertas = kertasDariKode(opsi.kertas);
  const nKolom = opsi.jumlahKolom > 0 ? opsi.jumlahKolom : kolomOtomatis(kertas);
  const kapasitas = kapasitasKolomMm(kertas);
  const tinggi = Array.isArray(opsi.tinggiBlokMm) && opsi.tinggiBlokMm.length === blokHtml.length
    ? opsi.tinggiBlokMm
    : blokHtml.map((_, i) => (i === 0 ? 26 : (Array.isArray(opsi.tinggiPerkiraanMm) ? opsi.tinggiPerkiraanMm[i - 1] : 40)));
  const hasilKolom = susunKeKolom(tinggi, kapasitas, nKolom, {
    blokPenuh: opsi.blokPenuh,
    tinggiLebarMm: opsi.tinggiLebarMm,
  });
  const peringatan = hasilKolom.peringatan;
  const pitaHalaman = Array.isArray(hasilKolom.lebarHalaman) ? hasilKolom.lebarHalaman : [];
  const luapan = Array.isArray(hasilKolom.luapan) ? hasilKolom.luapan : [];
  // 🔥 2026-10-09 (owner: "jangan sampai ada sisa"): halaman TERAKHIR
  // diseimbangkan antar kolom. Menyisakan setengah kolom kosong terlihat
  // seperti kesalahan tata letak, padahal hanya akhir dokumen. Blok tetap
  // utuh (tidak dipotong) dan URUTAN nomor tetap dijaga per kolom.
  // Halaman terakhir yang punya PITA lebar penuh tidak diseimbangkan: ruang
  // kolomnya sudah dipotong tinggi pita, dan menyebar blok ke kolom lain bisa
  // membuat isinya meluber di bawah pita.
  const pitaTerakhir = pitaHalaman[hasilKolom.halaman.length - 1] || [];
  const halaman = pitaTerakhir.length
    ? hasilKolom.halaman
    : seimbangkanHalamanTerakhir(hasilKolom.halaman, tinggi, nKolom);
  const totalHal = Math.max(1, halaman.length);
  // Watermark default HIDUP. Dimatikan hanya dengan `watermark: false`
  // eksplisit (mis. dokumen internal yang tidak akan beredar).
  const denganWatermark = opsi.watermark !== false;
  const isiHalaman = halaman
    .map((kolomLista, h) => {
      // 🔥 PITA LEBAR PENUH: wacana panjang membentang selebar isi kertas di
      // ATAS halaman (tanpa kanan-kiri), soal-soalnya tetap dua kolom di
      // bawahnya — persis buku ujian: baca dulu, baru kerjakan.
      const pita = pitaHalaman[h] || [];
      const kolom = kolomLista.map((indeks) => `<div class="nsk-kolom">${indeks.map((b) => blokHtml[b]).join('')}</div>`).join('');
      const lebarHal = kertas.lebarMm;
      const tinggiHal = kertas.tinggiMm;
      const kelasHal = `nsk-hal${pita.length ? ' nsk-hal--lebar' : ''}${luapan[h] ? ' nsk-hal--luapan' : ''}`;
      return `<div class="${kelasHal}" style="width:${lebarHal}mm;height:${tinggiHal}mm;">
        ${denganWatermark ? watermarkHtml({ ...opsi, mode: 'halaman' }) : ''}
        ${pita.length ? `<div class="nsk-band">${pita.map((b) => blokHtml[b]).join('')}</div>` : ''}
        <div class="nsk-kolomwrap">${kolom}</div>
        <div class="nsk-footer">— ${h + 1} / ${totalHal} —</div>
      </div>`;
    })
    .join('');
  const gayaWm = denganWatermark ? gayaWatermark({ ...opsi, mode: 'halaman' }) : '';
  const fragmen = `<style>${cssPage(kertas)}${opsi.cssTambahan || ''}${GAYA_NASKAH}${gayaWm}</style><div class="naskah">${isiHalaman}</div>`;
  return {
    fragmen,
    jumlahHalaman: totalHal,
    jumlahKolom: nKolom,
    peringatan,
    lebarKolomMm: lebarKolomMm(kertas, nKolom),
    // nomor halaman (1-based) yang dicetak lebar penuh karena wacana panjang
    halamanLebarPenuh: pitaHalaman.map((q, i) => (q.length ? i + 1 : 0)).filter(Boolean),
  };
}

export default {
  daftarBlokPenuh,
  ambangBacaanPanjangMm,
  tinggiLebarPenuhMm,
  butuhLebarPenuh,
  AMBANG_BACAAN_PANJANG,
  FAKTOR_TINGGI_LEBAR_PENUH,
  seimbangkanHalamanTerakhir,
  bacaanNaskahHtml,
  LOGO_WATERMARK,
  gayaWatermark,
  watermarkHtml,
  DAFTAR_KERTAS,
  kertasDariKode,
  lebarKolomMm,
  kolomOtomatis,
  kapasitasKolomMm,
  cssPage,
  ukuranGambarNaskah,
  kolomPilihanNaskah,
  susunKeKolom,
  escapeHtml,
  teksKeHtml,
  GAYA_NASKAH,
  butirNaskahHtml,
  kopNaskahHtml,
  kunciButirNaskahHtml,
  daftarBlokNaskah,
  estimasiTinggiBlokMm,
  susunNaskahDariBlok,
};
