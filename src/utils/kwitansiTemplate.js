// ============================================================
// src/utils/kwitansiTemplate.js — TEMPLATE CETAK KWITANSI (MURNI)
// ============================================================
// Dipisah dari kwitansi.js supaya BISA DIUJI di Node tanpa Firebase:
// bentuk dokumen resmi (ukuran kertas, ada/tidaknya garis) adalah
// keputusan bisnis yang harus dijaga test, bukan sekadar tampilan.
//
// KEBIJAKAN CETAK (keputusan owner, 11 Okt 2026):
//   • Kwitansi dicetak di kertas SETENGAH A4 — A4 dipotong melintang
//     (210mm x 148,5mm). Ukuran halaman @page mengikuti kertas itu.
//   • TANPA GARIS HITAM (bingkai double, <hr>, kotak JUMLAH bergaris):
//     hasil potongan A4 terlihat kotor dan boros tinta. Blok penting
//     cukup diberi latar abu sangat muda.
// Dokumen lain (laporan keuangan, bukti setor kas) TETAP A4 formal.
import { terbilang, rp, tanggalPanjang } from './uangTeks.js';

// ---------- UKURAN KERTAS ----------
// Kwitansi dicetak di kertas SETENGAH A4 (A4 dipotong melintang = 210mm x 148,5mm),
// jadi ukuran halaman ikut setengah A4 dan tanpa garis hitam (hemat tinta & rapi dipotong).
export const KERTAS_A4 = { size: 'A4', margin: '14mm' };
export const KERTAS_KWITANSI = { size: '210mm 148.5mm', margin: '8mm' };

export const cssAturanPage = (kertas = KERTAS_A4) =>
  `@page { size: ${kertas.size}; margin: ${kertas.margin}; }`;

// ---------- TEMPLATE KWITANSI ----------
// data: { nomor, tanggal, diterimaDari, studentId, jumlah, keperluan,
//         metode, refTransfer, catatanTambahan, penandaTangan }
export const htmlKwitansi = (data) => {
  const jumlah = parseInt(data.jumlah) || 0;
  const logo = '/pwa-192x192.png';
  // Catatan cetak: tanpa garis/bingkai hitam (permintaan owner — kertas setengah A4
  // dipotong manual, garis hitam membuat hasil potong terlihat kotor & boros tinta).
  return `
<div style="max-width: 100%; margin: 0 auto; padding: 2mm 1mm;">
  <table style="width:100%; border-collapse: collapse;">
    <tr>
      <td style="width:52px; vertical-align: top;">
        <img src="${logo}" alt="Logo Bimbel Gemilang"
             style="width:46px; height:46px; border-radius:50%;" />
      </td>
      <td style="vertical-align: top; padding-left: 10px;">
        <div style="font-size: 17px; font-weight: 800; letter-spacing: 0.6px;">BIMBEL GEMILANG</div>
        <div style="font-size: 9.5px; color: #475569;">Bimbingan Belajar &amp; Platform Edukasi Digital</div>
        <div style="font-size: 9.5px; color: #475569;">Sistem Keuangan Resmi — Kwitansi Pembayaran</div>
      </td>
      <td style="text-align: right; vertical-align: top;">
        <div style="font-size: 13px; font-weight: 800; letter-spacing: 1px;">KWITANSI</div>
        <div style="font-size: 11px; font-weight: 700; background: #f1f5f9; display: inline-block; padding: 3px 8px; margin-top: 3px; border-radius: 6px;">
          No: ${data.nomor || '(tanpa nomor)'}
        </div>
      </td>
    </tr>
  </table>

  <div style="height: 8px;"></div>

  <table style="width: 100%; border-collapse: collapse; font-size: 11.5px;">
    <tr>
      <td style="width: 128px; padding: 3px 0; vertical-align: top; font-weight: 700;">Tanggal</td>
      <td style="padding: 3px 0;">: ${tanggalPanjang(data.tanggal)}</td>
    </tr>
    <tr>
      <td style="padding: 3px 0; vertical-align: top; font-weight: 700;">Sudah Terima Dari</td>
      <td style="padding: 3px 0;">: <b>${data.diterimaDari || '-'}</b>${data.studentId ? ` &nbsp;<span style="color:#475569;">(ID Siswa: ${data.studentId})</span>` : ''}</td>
    </tr>
    <tr>
      <td style="padding: 3px 0; vertical-align: top; font-weight: 700;">Jumlah Uang</td>
      <td style="padding: 3px 0;">: <b style="font-size: 12.5px; text-decoration: underline;">${terbilang(jumlah)} Rupiah</b></td>
    </tr>
    <tr>
      <td style="padding: 3px 0; vertical-align: top; font-weight: 700;">Untuk Pembayaran</td>
      <td style="padding: 3px 0;">: ${data.keperluan || '-'}</td>
    </tr>
    <tr>
      <td style="padding: 3px 0; vertical-align: top; font-weight: 700;">Metode Bayar</td>
      <td style="padding: 3px 0;">: ${data.metode || '-'}${data.refTransfer ? ` — No. Struk/Ref Bank: <b>${data.refTransfer}</b>` : ''}</td>
    </tr>
    ${data.catatanTambahan ? `
    <tr>
      <td style="padding: 3px 0; vertical-align: top; font-weight: 700;">Catatan</td>
      <td style="padding: 3px 0;">: ${data.catatanTambahan}</td>
    </tr>` : ''}
  </table>

  <table style="width: 100%; border-collapse: collapse; margin-top: 6px;">
    <tr>
      <td></td>
      <td style="width: 210px; text-align: right;">
        <div style="padding: 6px 12px; background: #f1f5f9; border-radius: 8px;">
          <div style="font-size: 9.5px; font-weight: 700; color: #475569;">JUMLAH</div>
          <div style="font-size: 16px; font-weight: 800;">${rp(jumlah)}</div>
        </div>
      </td>
    </tr>
  </table>

  <table style="width: 100%; border-collapse: collapse; margin-top: 14px; font-size: 10.5px; text-align: center;">
    <tr>
      <td style="width: 50%; padding-bottom: 34px;">Pembayar / Orang Tua,<br /><br /><br />( ______________________ )</td>
      <td style="width: 50%; padding-bottom: 34px;">${data.penandaTangan || 'Admin Keuangan'},<br /><br /><br />( ______________________ )</td>
    </tr>
  </table>

  <div style="font-size: 8.5px; color: #64748b; padding-top: 4px;">
    Dokumen ini dicetak otomatis oleh sistem Bimbel Gemilang dan sah sebagai bukti pembayaran.
    Simpan kwitansi ini baik-baik. Nomor kwitansi tercatat permanen di sistem (bisa diverifikasi ke admin).
  </div>
</div>`;
};

export default { KERTAS_A4, KERTAS_KWITANSI, cssAturanPage, htmlKwitansi };
