// src/utils/cetakLatihan.js
// ============================================================
// MESIN CETAK PAKET LATIHAN (Fase 3 skema buku-kliping, lihat
// docs/KERANGKA-KONTEN-BUKU.md). MURNI: masukan daftar soal + identitas
// paket, keluaran string HTML siap masuk cetakLewatIframe().
//
// Menghasilkan TIGA dokumen yang WAJIB terpisah:
//   1. htmlPaketSiswa     : kotak soal siap gunting, TANPA kunci/pembahasan
//   2. htmlKunciTentor    : kunci + pembahasan, berkepala peringatan keras
//   3. htmlLembarCatatan  : lembar tempel + kolom catatan pengerjaan
//
// ATURAN CETAK RAMAH KERTAS BEKAS (dibakukan di kerangka, ditegakkan di
// sini karena percuma ada aturan kalau mesinnya tidak menaati):
//   - satu muka, tanpa background berwarna/abu (hemat toner, tetap
//     terbaca di atas tinta lama di sisi belakang)
//   - tiap butir = satu kotak berborder tegas + nomor besar + garis
//     potong putus-putus di tepi
//   - margin luar >= 10mm supaya gunting tidak memakan nomor
//   - kunci TIDAK PERNAH muncul di dokumen siswa (dikunci oleh test)
//
// Fungsi-fungsi di sini murni dan diuji di Node oleh
// tests/cetakLatihan.test.mjs -- sebab dokumen yang salah cetak biayanya
// nyata: kertas, toner, dan waktu tentor.
// ============================================================

import { teksKunciSoal } from './teksKunciSoal.js';
import { pisahTeksDanGambar } from './penempatanGambar.js';
// 2026-10-08: renderer teks (escape + KaTeX) dan tabel ukuran kertas
// pindah ke src/utils/naskahSoal.js supaya mesin kotak (berkas ini) dan
// mesin naskah dua kolom memakai SATU renderer yang sama. Diekspor ulang
// di sini agar impor lama (halaman & test) tidak patah.
// 🔥 2026-10-08: watermark logo Gemilang ikut di lembar gunting, sama
// seperti di naskah dua kolom. Logika & logonya SATU sumber di
// naskahSoal.js supaya dua mesin cetak ini tidak punya dua identitas.
import { escapeHtml, teksKeHtml, kertasDariKode, gayaWatermark, watermarkHtml } from './naskahSoal.js';
// 🔥 2026-10-08: pembaca field sadar-alias + bacaan. Mesin lembar gunting
// ini dulu membaca `soal?.soal || soal?.teks_soal` saja dan TIDAK merender
// wacana sama sekali -- soal literasi tercetak tanpa teks yang harus dibaca.
import { teksSoalDari, bacaanDari } from './fieldButirSoal.js';

export { escapeHtml, teksKeHtml };

/**
 * Pilih butir yang ikut cetak.
 * @param {Array} daftar   daftar soal paket
 * @param {object} [opsi]  { maks: number, tanpaEsai: boolean }
 */
export function pilihSoalUntukCetak(daftar = [], opsi = {}) {
  let hasil = Array.isArray(daftar) ? [...daftar] : [];
  if (opsi.tanpaEsai) hasil = hasil.filter((s) => !['esai', 'uraian'].includes(s?.tipe));
  if (Number.isFinite(opsi.maks) && opsi.maks > 0) hasil = hasil.slice(0, Math.floor(opsi.maks));
  return hasil;
}

function gayaDasar(kodeKertas, opsi = {}) {
  const k = kertasDariKode(kodeKertas);
  const wm = opsi.watermark === false ? '' : gayaWatermark({ ...opsi, mode: 'tetap' });
  return `${wm}
  @page { size: ${k.lebarMm}mm ${k.tinggiMm}mm; margin: 10mm; }
  * { box-sizing: border-box; }
  body { font-family: Arial, Helvetica, sans-serif; color: #000; background: #fff; margin: 0; font-size: 12px; }
  .kepala { border-bottom: 2px solid #000; padding-bottom: 6px; margin-bottom: 10px; }
  .kepala h1 { font-size: 15px; margin: 0 0 2px; }
  .kepala .meta { font-size: 10.5px; }
  .identitas { display: flex; gap: 16px; font-size: 11px; margin: 8px 0 12px; }
  .identitas span { border-bottom: 1px solid #000; min-width: 120px; padding-bottom: 8px; }
  .kotak { border: 1.5pt solid #000; border-radius: 4px; padding: 8px 10px; margin: 0 0 12px;
           page-break-inside: avoid; position: relative; }
  /* TANPA background: uji "tata letak ramah kertas bekas" di
     tests/cetakLatihan.test.mjs melarang blok berwarna/abu di CSS cetak --
     bimbel mencetak di atas kertas bertinta lama, jadi isian warna
     memboroskan toner dan menutupi tulisan lama. Pemisah wacana memakai
     garis kiri + garis putus atas-bawah, bukan blok abu. */
  .bacaan { border-left: 3pt solid #000; border-top: 0.6pt dashed #64748b;
            border-bottom: 0.6pt dashed #64748b; padding: 6px 8px;
            margin: 0 0 7px; font-size: 11px; line-height: 1.55; text-align: justify; }
  .bacaan-judul { font-size: 9px; font-weight: bold; letter-spacing: .4px;
            text-transform: uppercase; margin-bottom: 3px; }
  .bacaan img { max-width: 100%; }
  .kotak::after { content: '✂'; position: absolute; top: -9px; right: 6px; background: #fff;
                  font-size: 10px; padding: 0 3px; color: #000; }
  .nomor { display: inline-block; font-size: 15px; font-weight: 800; border: 1.5pt solid #000;
           border-radius: 50%; width: 26px; height: 26px; line-height: 23px; text-align: center;
           margin-right: 8px; }
  .soal { margin: 6px 0; line-height: 1.5; }
  .opsi { margin: 3px 0 3px 34px; line-height: 1.45; }
  img.gbr { max-width: 70mm; max-height: 55mm; border: 1pt solid #000; margin: 6px 0 6px 34px; display: block; }
  .kunci-teks { font-size: 11px; margin: 4px 0 4px 34px; }
  .peringatan { border: 2pt solid #000; padding: 6px 10px; font-size: 12px; font-weight: 800;
                margin-bottom: 10px; text-align: center; letter-spacing: 0.5px; }
  table.catat { width: 100%; border-collapse: collapse; margin-top: 6px; }
  table.catat td, table.catat th { border: 1pt solid #000; padding: 6px; font-size: 10.5px; vertical-align: top; }
  .tempel { border: 1.5pt dashed #000; height: 42mm; margin: 4px 0; font-size: 10px; color: #000;
            display: flex; align-items: center; justify-content: center; }
`;
}

function kepalaHtml(paket, judulDok) {
  return `<div class="kepala">
    <h1>${escapeHtml(judulDok)}</h1>
    <div class="meta">${escapeHtml(paket.judul || 'Paket Latihan')} · ${escapeHtml(paket.mapel || paket.targetKategori || '')} · ${escapeHtml(paket.targetKelas || '')}${paket.bab ? ` · ${escapeHtml(paket.bab)}` : ''}</div>
  </div>`;
}

// Badan soal dengan gambar DI POSISI placeholder-nya ({{GAMBAR}} dst.).
// Sebelum 2026-10-06 gambar ditumpuk di akhir dan token placeholder ikut
// tercetak mentah di kalimat -- lembar cetak menyebut "perhatikan gambar
// {{GAMBAR}} di atas" tanpa gambar di tempat yang ditunjuk.
function stemHtml(soal) {
  const bacaan = bacaanDari(soal);
  const bacaanHtml = bacaan
    ? `<div class="bacaan"><div class="bacaan-judul">Bacalah teks berikut${
      bacaan.rentang ? ` (untuk soal ${bacaan.rentang.dari}–${bacaan.rentang.sampai})` : ''
    }</div>${
      pisahTeksDanGambar(bacaan.teks, bacaan.gambar)
        .map((sg) => (sg.jenis === 'teks'
          ? `<div>${teksKeHtml(sg.isi)}</div>`
          : `<img src="${escapeHtml(sg.url)}" alt="Gambar bacaan" />`))
        .join('')
    }</div>`
    : '';
  // Bacaan DIDAHULUKAN: soal literasi merujuk "teks di atas".
  return bacaanHtml + pisahTeksDanGambar(teksSoalDari(soal), soal?.gambarUrls)
    .map((sg) => (sg.jenis === 'teks'
      ? `<div class="soal">${teksKeHtml(sg.isi)}</div>`
      : `<img class="gbr" src="${escapeHtml(sg.url)}" alt="Gambar soal ${sg.indeks + 1}" />`))
    .join('\n      ');
}

// 🔥 2026-10-07 (kajian PDF Kinematika): opsi KAYA {teks, gambar[]} ikut
// dicetak gambarnya -- modul TKA nyata memakai pilihan berupa grafik, dan
// lembar cetak yang hanya mencetak teksnya membuat tentor mencetak soal
// yang pilihannya kosong.
function opsiHtml(soal) {
  const opsi = Array.isArray(soal?.opsiJawaban) ? soal.opsiJawaban : [];
  return opsi
    .map((o, i) => {
      const huruf = String.fromCharCode(65 + i);
      const teks = typeof o === 'string' ? o : o?.teks || '';
      const gambar = (o && typeof o === 'object' && Array.isArray(o.gambar)) ? o.gambar : [];
      const gambarHtml = gambar
        .map((g) => {
          const src = g?.uploadedUrl || g?.url || '';
          return src ? `<img class="gbr" src="${escapeHtml(src)}" alt="Gambar opsi ${huruf}" />` : '';
        })
        .join('');
      return `<div class="opsi"><b>${huruf}.</b> ${teksKeHtml(teks)}${gambarHtml}</div>`;
    })
    .join('');
}

// Pembahasan kunci tentor: gambar DI POSISI placeholder-nya ({{GAMBAR_n}}),
// sama seperti badan soal -- diagram bertahap di pembahasan modul scan
// tidak boleh lenyap dari pegangan tentor.
function pembahasanHtml(soal) {
  if (!soal?.pembahasan) return '';
  const isi = pisahTeksDanGambar(soal.pembahasan, soal?.gambarUrls)
    .map((sg) => (sg.jenis === 'teks'
      ? teksKeHtml(sg.isi)
      : `<img class="gbr" src="${escapeHtml(sg.url)}" alt="Gambar pembahasan ${sg.indeks + 1}" />`))
    .join(' ');
  return `<div class="kunci-teks"><b>Pembahasan:</b> ${isi}</div>`;
}

/** DOKUMEN 1 — paket siswa: kotak soal siap gunting, TANPA kunci. */
export function htmlPaketSiswa(paket = {}, soalList = [], opsi = {}) {
  const kotak = soalList
    .map((s, i) => `<div class="kotak">
      <span class="nomor">${i + 1}</span><b>${escapeHtml(String(s?.tipe || 'pg_sederhana').replace(/_/g, ' '))}</b>
      ${stemHtml(s)}
      ${opsiHtml(s)}
    </div>`)
    .join('\n');
  return `<html><head><meta charset="utf-8" /><style>${gayaDasar(opsi.kertas, opsi)}</style></head><body>
    ${opsi.watermark === false ? '' : watermarkHtml({ ...opsi, mode: 'tetap' })}
    ${kepalaHtml(paket, 'LEMBAR LATIHAN SISWA')}
    <div class="identitas"><span>Nama: </span><span>Kelas: </span><span>Tanggal: </span></div>
    <div style="font-size:10.5px;margin-bottom:10px;">Gunting setiap kotak sesuai garis putus-putus, lalu tempel di buku progresmu.</div>
    ${kotak}
  </body></html>`;
}

/** DOKUMEN 2 — kunci tentor: TIDAK untuk dicetak sebagai berkas siswa. */
export function htmlKunciTentor(paket = {}, soalList = [], opsi = {}) {
  const baris = soalList
    .map((s, i) => {
      const kunci = escapeHtml(teksKunciSoal(s));
      const pembahasan = pembahasanHtml(s);
      return `<div class="kotak"><span class="nomor">${i + 1}</span><b>Kunci:</b> ${kunci || '-'}${pembahasan}</div>`;
    })
    .join('\n');
  return `<html><head><meta charset="utf-8" /><style>${gayaDasar(opsi.kertas, opsi)}</style></head><body>
    ${opsi.watermark === false ? '' : watermarkHtml({ ...opsi, mode: 'tetap' })}
    <div class="peringatan">PEGANGAN TENTOR — JANGAN DICETAK UNTUK SISWA</div>
    ${kepalaHtml(paket, 'KUNCI & PEMBAHASAN')}
    ${baris}
  </body></html>`;
}

/** DOKUMEN 3 — lembar catatan: area tempel + kolom pengerjaan per butir. */
export function htmlLembarCatatan(paket = {}, soalList = [], opsi = {}) {
  const baris = soalList
    .map((s, i) => `<tr>
      <td style="width:10mm;text-align:center;font-weight:800;">${i + 1}</td>
      <td><div class="tempel">tempel potongan soal di sini</div></td>
      <td style="width:22mm;">&nbsp;</td>
      <td style="width:34mm;">&nbsp;</td>
    </tr>`)
    .join('\n');
  return `<html><head><meta charset="utf-8" /><style>${gayaDasar(opsi.kertas, opsi)}</style></head><body>
    ${opsi.watermark === false ? '' : watermarkHtml({ ...opsi, mode: 'tetap' })}
    ${kepalaHtml(paket, 'LEMBAR CATATAN PENGERJAAN')}
    <div class="identitas"><span>Nama: </span><span>Kelas: </span><span>Tanggal: </span></div>
    <table class="catat">
      <tr><th>No</th><th>Area tempel soal</th><th>Langkah pikir</th><th>Kesimpulan / hasil</th></tr>
      ${baris}
    </table>
  </body></html>`;
}

export default {
  escapeHtml,
  teksKeHtml,
  pilihSoalUntukCetak,
  htmlPaketSiswa,
  htmlKunciTentor,
  htmlLembarCatatan,
};
