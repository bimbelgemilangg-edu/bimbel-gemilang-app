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
 *   - blok lebih tinggi dari satu kolom tetap diberi kolom sendiri
 *     dan dicatat di `peringatan` supaya guru tahu ada butir raksasa.
 */
export function susunKeKolom(tinggiBlokMm, kapasitasMm, kolomPerHalaman) {
  const kapasitas = kapasitasMm > 0 ? kapasitasMm : 100;
  const perHal = kolomPerHalaman > 1 ? kolomPerHalaman : 1;
  const halaman = [];
  const peringatan = [];
  let kolomSaatIni = [];
  let tinggiSaatIni = 0;

  const tutupKolom = () => {
    if (!kolomSaatIni.length) return;
    let hal = halaman[halaman.length - 1];
    if (!hal || hal.length >= perHal) { hal = []; halaman.push(hal); }
    hal.push(kolomSaatIni);
    kolomSaatIni = [];
    tinggiSaatIni = 0;
  };

  (Array.isArray(tinggiBlokMm) ? tinggiBlokMm : []).forEach((tinggi, i) => {
    const h = Number.isFinite(tinggi) && tinggi > 0 ? tinggi : 10;
    if (h > kapasitas) peringatan.push(i);
    const muat = tinggiSaatIni + h <= kapasitas;
    if (!muat && kolomSaatIni.length) tutupKolom();
    kolomSaatIni.push(i);
    tinggiSaatIni += h;
    if (tinggiSaatIni >= kapasitas) tutupKolom();
  });
  tutupKolom();
  return { halaman, peringatan };
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
          return katex.renderToString(b.slice(1, -1), { throwOnError: false });
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
.naskah .nsk-kunci-baris { font-size: 10.8px; }
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
export function butirNaskahHtml(soal, nomor, lebarKolom, rasioGambar = {}) {
  const segmen = pisahTeksDanGambar(soal?.soal || soal?.teks_soal, soal?.gambarUrls);
  const badan = segmen
    .map((sg) => {
      if (sg.jenis === 'teks') return `<div>${teksKeHtml(sg.isi)}</div>`;
      const r = rasioGambar[sg.url] ?? RASIO_BAWAAN_GAMBAR;
      const ukuran = ukuranGambarNaskah(r, 1, lebarKolom) || { mode: 'blok', lebarMm: 40, tinggiMm: 30 };
      return imgNaskahHtml(sg.url, `Gambar soal nomor ${nomor}`, ukuran);
    })
    .join('');
  const opsi = Array.isArray(soal?.opsiJawaban) ? soal.opsiJawaban : [];
  const teksOpsi = opsi.map((o) => (typeof o === 'string' ? o : o?.teks || ''));
  const nKolomOpsi = kolomPilihanNaskah(teksOpsi, lebarKolom);
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
      return `<span>(${huruf}) ${teksKeHtml(t)}${gbr}</span>`;
    })
    .join('');
  return `<div class="nsk-butir"><div class="nsk-no">${nomor}.</div><div class="nsk-isi">${badan}${opsiHtml ? `<div class="nsk-opsi" style="grid-template-columns:repeat(${nKolomOpsi},1fr);">${opsiHtml}</div>` : ''}</div></div>`;
}

export function kopNaskahHtml(paket, judulDok, denganIdentitas) {
  const meta = [paket?.mapel || paket?.targetKategori || '', paket?.targetKelas || '', paket?.bab || '']
    .filter(Boolean)
    .map(escapeHtml)
    .join(' · ');
  return `<div class="nsk-kop"><h1>${escapeHtml(judulDok)}</h1>
    <div class="nsk-meta">${escapeHtml(paket?.judul || 'Naskah Soal')} ${meta ? `— ${meta}` : ''}</div>
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
  return `<div class="nsk-butir"><div class="nsk-no">${nomor}.</div><div class="nsk-isi nsk-kunci-baris"><b>Kunci:</b> ${kunci}${pembahasan ? ` — ${pembahasan}` : ''}</div></div>`;
}

/**
 * Daftar blok HTML sesuai urutan susun: blok 0 = kepala dokumen,
 * sisanya butir. Halaman guru mengukur tinggi tiap blok dari daftar
 * ini, lalu menyerahkannya kembali ke susunNaskahDariBlok.
 */
export function daftarBlokNaskah(mode, paket, soalList, lebarKolom, rasioGambar = {}) {
  const daftar = Array.isArray(soalList) ? soalList : [];
  const kop = mode === 'kunci'
    ? `<div class="nsk-peringatan">PEGANGAN GURU — JANGAN DICETAK UNTUK SISWA</div>${kopNaskahHtml(paket, 'KUNCI & PEMBAHASAN', false)}`
    : kopNaskahHtml(paket, 'NASKAH SOAL', true);
  return [
    kop,
    ...daftar.map((s, i) => (mode === 'kunci'
      ? kunciButirNaskahHtml(s, i + 1)
      : butirNaskahHtml(s, i + 1, lebarKolom, rasioGambar))),
  ];
}

/** Tinggi taksiran (mm) sebelum pengukuran layar tersedia. */
export function estimasiTinggiBlokMm(mode, soal, lebarKolom, rasioGambar = {}) {
  const hurufSebaris = Math.max(20, (lebarKolom - 8) / MM_PER_HURUF);
  if (mode === 'kunci') {
    const panjang = String(soal?.pembahasan || '').length + 20;
    return Math.round((Math.ceil(panjang / hurufSebaris) * 4.3) + 4);
  }
  const teks = String(soal?.soal || soal?.teks_soal || '');
  const gambar = Array.isArray(soal?.gambarUrls) ? soal.gambarUrls.filter(Boolean) : [];
  const tinggiGambar = gambar.reduce((acc, url) => {
    const r = rasioGambar[url] ?? RASIO_BAWAAN_GAMBAR;
    const u = ukuranGambarNaskah(r, 1, lebarKolom);
    return acc + (u ? u.tinggiMm + 2 : 30);
  }, 0);
  const opsi = Array.isArray(soal?.opsiJawaban) ? soal.opsiJawaban.map((o) => (typeof o === 'string' ? o : o?.teks || '')) : [];
  const nKolomOpsi = kolomPilihanNaskah(opsi, lebarKolom);
  const barisOpsi = Math.ceil(opsi.length / nKolomOpsi) * 4.6;
  const barisTeks = Math.ceil(Math.max(1, teks.length) / hurufSebaris) * 4.6;
  return Math.round(barisTeks + tinggiGambar + barisOpsi + 4);
}

/**
 * Penyusun akhir: blok HTML + tinggi tiap blok -> fragmen siap cetak
 * (halaman-kolom eksplisit, nomor halaman di kaki).
 */
export function susunNaskahDariBlok(blokHtml, opsi = {}) {
  const kertas = kertasDariKode(opsi.kertas);
  const nKolom = opsi.jumlahKolom > 0 ? opsi.jumlahKolom : kolomOtomatis(kertas);
  const kapasitas = kapasitasKolomMm(kertas);
  const tinggi = Array.isArray(opsi.tinggiBlokMm) && opsi.tinggiBlokMm.length === blokHtml.length
    ? opsi.tinggiBlokMm
    : blokHtml.map((_, i) => (i === 0 ? 26 : (Array.isArray(opsi.tinggiPerkiraanMm) ? opsi.tinggiPerkiraanMm[i - 1] : 40)));
  const { halaman, peringatan } = susunKeKolom(tinggi, kapasitas, nKolom);
  const totalHal = Math.max(1, halaman.length);
  const isiHalaman = halaman
    .map((kolomLista, h) => {
      const kolom = kolomLista.map((indeks) => `<div class="nsk-kolom">${indeks.map((b) => blokHtml[b]).join('')}</div>`).join('');
      const lebarHal = kertas.lebarMm;
      const tinggiHal = kertas.tinggiMm;
      return `<div class="nsk-hal" style="width:${lebarHal}mm;height:${tinggiHal}mm;">
        <div class="nsk-kolomwrap">${kolom}</div>
        <div class="nsk-footer">— ${h + 1} / ${totalHal} —</div>
      </div>`;
    })
    .join('');
  const fragmen = `<style>${cssPage(kertas)}${opsi.cssTambahan || ''}${GAYA_NASKAH}</style><div class="naskah">${isiHalaman}</div>`;
  return { fragmen, jumlahHalaman: totalHal, jumlahKolom: nKolom, peringatan, lebarKolomMm: lebarKolomMm(kertas, nKolom) };
}

export default {
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
