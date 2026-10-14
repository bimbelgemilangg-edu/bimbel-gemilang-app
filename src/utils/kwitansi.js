// src/utils/kwitansi.js
// ============================================================
// 🔥 BARU (modul kwitansi): cetak kwitansi resmi bimbel -- ada LOGO
// jelas, NOMOR kwitansi otomatis (format KWT-YYYYMM-001, urut per
// bulan, tersimpan permanen di dokumen finance_logs field
// `noKwitansi`), nominal + terbilang, metode bayar, dan kolom tanda
// tangan. Cetak lewat iframe tersembunyi (halaman utama tidak ikut
// "kedip" kena style print).
//
// Nomor kwitansi jujur & anti-bentrok (skala bimbel): sebelum membuat
// nomor, sistem menghitung dokumen finance_logs yang noKwitansi-nya
// berada di rentang bulan yang sama (query range string satu field --
// tidak butuh composite index), lalu pakai urut berikutnya. Kalau dua
// admin mencetak di detik yang sama persis ada peluang kecil nomor
// kembar -- untuk operasi 1 kasir ini praktis tidak terjadi, dan
// nomor tetap bisa dikoreksi manual dari Firestore.
// ============================================================

import { db } from '../firebase';
// Template cetak kwitansi dipindah ke modul murni (bisa diuji tanpa Firebase).
import {
  KERTAS_A4, KERTAS_KWITANSI, cssAturanPage, htmlKwitansi,
} from './kwitansiTemplate';
import { collection, query, where, getDocs } from 'firebase/firestore';

// ---------- TERBILANG & FORMAT RUPIAH ----------
// 🔥 DIPINDAH (2026-10-05) ke src/utils/uangTeks.js supaya bisa diuji di
// Node: berkas ini mengimpor `db` dari '../firebase' di bawah, dan itu
// membuat SELURUH isinya -- termasuk terbilang yang tercetak di kwitansi
// resmi -- tidak bisa diimpor oleh test. Logika murninya sekarang di sana
// dan di-re-export di sini, jadi semua pemanggil lama
// (`import { rp, terbilang } from '.../utils/kwitansi'`) tetap jalan
// tanpa diubah. Alasan pemisahannya dan bug yang diperbaiki tercatat di
// kepala src/utils/uangTeks.js.
export {
  angkaRupiah,
  terbilang,
  rp,
  rpFmt,
  angkaFmt,
  tanggalPanjang,
  prefixKwitansiBulan,
  TEKS_NOMINAL_TIDAK_SAH,
  RP_NOMINAL_TIDAK_SAH,
};

// Diimpor sebagai binding lokal juga (bukan cuma `export ... from`), karena
// berkas ini masih MEMAKAI prefixKwitansiBulan/rp/terbilang di bawah --
// `export ... from` tidak membuat nama yang bisa dipakai di berkas ini.
import {
  angkaRupiah,
  terbilang,
  rp,
  rpFmt,
  angkaFmt,
  tanggalPanjang,
  prefixKwitansiBulan,
  TEKS_NOMINAL_TIDAK_SAH,
  RP_NOMINAL_TIDAK_SAH,
} from './uangTeks.js';

// Hitung nomor urut berikutnya untuk bulan berjalan.
// Dipanggil SEBELUM addDoc/updateDoc yang menulis noKwitansi.
export const ambilNomorKwitansiBerikutnya = async (date = new Date()) => {
  const prefix = prefixKwitansiBulan(date);
  // '~' (0x7E) lebih besar dari semua digit/tanda baca nomor, jadi
  // rentang [prefix, prefix+'~') menangkap semua nomor bulan ini saja.
  const q = query(
    collection(db, 'finance_logs'),
    where('noKwitansi', '>=', prefix),
    where('noKwitansi', '<', `${prefix}~`)
  );
  const snap = await getDocs(q);
  // Ambil nomor terbesar yang terpakai (bukan sekadar jumlah dokumen)
  // supaya nomor bekas transaksi terhapus tidak dipakai ulang.
  let maks = 0;
  snap.forEach((d) => {
    const nomor = String(d.data().noKwitansi || '');
    const urut = parseInt(nomor.slice(prefix.length), 10);
    if (!Number.isNaN(urut) && urut > maks) maks = urut;
  });
  return `${prefix}${String(maks + 1).padStart(3, '0')}`;
};

// ---------- FORMAT TANGGAL & RUPIAH ----------
// 🔥 `tanggalPanjang` dan `rp` sekarang datang dari './uangTeks.js' lewat
// re-export di kepala berkas ini. Definisi lamanya DIHAPUS dari sini --
// membiarkan keduanya berarti ekspor ganda (SyntaxError) sekaligus
// mempertahankan bug lama: `rp` memakai parseInt sehingga MEMOTONG
// nominal pecahan, berbeda dari `rpFmt` di keuanganOwnerUtils yang
// membulatkan. Nominal yang sama bisa tercetak beda di kwitansi dan di
// layar owner.

// ---------- CETAK LEWAT IFRAME ----------
// srcdoc dipakai agar style print tidak bocor ke halaman utama.
// Logo /pwa-192x192.png ikut ke-print karena iframe satu origin.
// opsi.kertas: ukuran halaman (default A4; kwitansi memakai KERTAS_KWITANSI).
export const cetakLewatIframe = (htmlIsi, judulDokumen = 'Cetak', opsi = {}) => {
  const kertas = opsi.kertas || KERTAS_A4;
  const iframe = document.createElement('iframe');
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = '0';
  document.body.appendChild(iframe);

  const html = `<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="utf-8" />
<title>${judulDokumen}</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Segoe UI', Arial, sans-serif; color: #0f172a; padding: ${kertas === KERTAS_KWITANSI ? '0' : '24px'}; }
  ${cssAturanPage(kertas)}
  @media print { body { padding: 0; } .no-print { display: none !important; } }
  .tombol-cetak { position: fixed; top: 10px; right: 10px; padding: 10px 18px;
    background: #1e293b; color: #fff; border: none; border-radius: 8px;
    font-size: 13px; font-weight: 700; cursor: pointer; }
</style>
</head>
<body>
<button class="tombol-cetak no-print" onclick="window.print()">🖨️ Cetak</button>
${htmlIsi}
<script>window.onload = function () { setTimeout(function () { window.print(); }, 250); };${'</'}script>
</body>
</html>`;

  iframe.srcdoc = html;
  // Bersihkan iframe setelah dialog cetak ditutup (jeda aman).
  setTimeout(() => { if (iframe.parentNode) iframe.parentNode.removeChild(iframe); }, 60000);
};

export const cetakKwitansi = (data) => {
  cetakLewatIframe(htmlKwitansi(data), `Kwitansi ${data.nomor || ''}`, { kertas: KERTAS_KWITANSI });
};

// Bangun data kwitansi dari dokumen finance_logs (mentah/normalisasi).
export const kwitansiDariLog = (log) => ({
  nomor: log.noKwitansi || log.nomor || '',
  tanggal: log.date || log.tanggal || '',
  diterimaDari: log.namaSiswa || 'Siswa',
  studentId: log.studentId || '',
  jumlah: parseInt(log.amount || log.jumlah || 0),
  keperluan: log.note || log.category || 'Pembayaran',
  metode: log.methodAsli || log.method || '-',
  refTransfer: log.refTransfer || '',
});

// ---------- RINGKASAN RIWAYAT KWITANSI (buat dicetak) ----------
// rows: array log; periodeLabel: mis. "September 2026"
export const htmlRingkasanKwitansi = (rows, periodeLabel, judul = 'RIWAYAT KWITANSI') => {
  const total = rows.reduce((s, r) => s + (parseInt(r.amount || 0) || 0), 0);
  const baris = rows.map((r, i) => `
    <tr style="border-bottom: 1px solid #e2e8f0;">
      <td style="padding: 6px 8px; text-align: center;">${i + 1}</td>
      <td style="padding: 6px 8px; font-weight: 700; white-space: nowrap;">${r.noKwitansi || '(belum ada nomor)'}</td>
      <td style="padding: 6px 8px; white-space: nowrap;">${tanggalPanjang(r.date)}</td>
      <td style="padding: 6px 8px;">${r.namaSiswa || r.note || r.category || '-'}</td>
      <td style="padding: 6px 8px;">${r.category || '-'}</td>
      <td style="padding: 6px 8px; text-align: right; font-weight: 700; white-space: nowrap;">${rp(r.amount)}</td>
      <td style="padding: 6px 8px; white-space: nowrap;">${r.method || '-'}${r.refTransfer ? `<br /><span style="font-size:10px;color:#475569;">ref: ${r.refTransfer}</span>` : ''}</td>
    </tr>`).join('');

  return `
<div style="max-width: 860px; margin: 0 auto;">
  <table style="width:100%; border-collapse: collapse;">
    <tr>
      <td style="width:64px;">
        <img src="/pwa-192x192.png" alt="Logo" style="width:54px; height:54px; border-radius:50%; border:2px solid #0f172a;" />
      </td>
      <td>
        <div style="font-size: 18px; font-weight: 800; letter-spacing: 1px;">BIMBEL GEMILANG</div>
        <div style="font-size: 11px; color: #334155;">${judul} — Periode: ${periodeLabel}</div>
        <div style="font-size: 10px; color: #64748b;">Dicetak: ${new Date().toLocaleString('id-ID')}</div>
      </td>
      <td style="text-align: right; font-size: 12px;">
        Jumlah dokumen: <b>${rows.length}</b><br />
        Total nominal: <b>${rp(total)}</b>
      </td>
    </tr>
  </table>
  <hr style="border: none; border-top: 2px solid #0f172a; margin: 10px 0 14px;" />
  <table style="width:100%; border-collapse: collapse; font-size: 11.5px;">
    <thead>
      <tr style="background: #f1f5f9; border-bottom: 2px solid #0f172a;">
        <th style="padding: 7px 8px;">#</th>
        <th style="padding: 7px 8px; text-align: left;">No. Kwitansi</th>
        <th style="padding: 7px 8px; text-align: left;">Tanggal</th>
        <th style="padding: 7px 8px; text-align: left;">Nama / Keterangan</th>
        <th style="padding: 7px 8px; text-align: left;">Kategori</th>
        <th style="padding: 7px 8px; text-align: right;">Nominal</th>
        <th style="padding: 7px 8px; text-align: left;">Metode</th>
      </tr>
    </thead>
    <tbody>${baris || '<tr><td colspan="7" style="padding:14px; text-align:center; color:#94a3b8;">Tidak ada kwitansi di periode ini.</td></tr>'}</tbody>
    <tfoot>
      <tr style="border-top: 2px solid #0f172a; background: #f8fafc;">
        <td colspan="5" style="padding: 8px; text-align: right; font-weight: 800;">TOTAL</td>
        <td style="padding: 8px; text-align: right; font-weight: 800;">${rp(total)}</td>
        <td></td>
      </tr>
    </tfoot>
  </table>
  <table style="width:100%; margin-top: 40px; font-size: 12px; text-align: center;">
    <tr>
      <td style="width:50%; padding-bottom: 60px;">Dicetak oleh,<br /><br /><br /><br />( Admin Keuangan )</td>
      <td style="width:50%; padding-bottom: 60px;">Diketahui,<br /><br /><br /><br />( Owner )</td>
    </tr>
  </table>
</div>`;
};

export const cetakRingkasanKwitansi = (rows, periodeLabel) => {
  cetakLewatIframe(htmlRingkasanKwitansi(rows, periodeLabel), `Riwayat Kwitansi ${periodeLabel}`);
};

// ---------- BUKU SETOR KAS (TUTUP KASIR) ----------
// data: { nomor, tanggal, periodeAwal, periodeAkhir, tunaiMasuk,
//         tunaiKeluar, jumlahSetor, catatan }
export const htmlBuktiSetorKas = (d) => `
<div style="max-width: 680px; margin: 0 auto; border: 3px double #0f172a; padding: 22px 26px;">
  <table style="width:100%; border-collapse: collapse;">
    <tr>
      <td style="width:64px;">
        <img src="/pwa-192x192.png" alt="Logo" style="width:54px; height:54px; border-radius:50%; border:2px solid #0f172a;" />
      </td>
      <td>
        <div style="font-size: 18px; font-weight: 800; letter-spacing: 1px;">BIMBEL GEMILANG</div>
        <div style="font-size: 11px; color: #334155;">Bukti Setor Kas — Serah Uang Admin ke Owner</div>
      </td>
      <td style="text-align: right; font-size: 12px; font-weight: 700;">
        No: ${d.nomor || '-'}<br />${tanggalPanjang(d.tanggal)}
      </td>
    </tr>
  </table>
  <hr style="border: none; border-top: 2px solid #0f172a; margin: 12px 0;" />
  <table style="width:100%; border-collapse: collapse; font-size: 13px;">
    <tr><td style="padding: 5px 0; font-weight: 700; width: 230px;">Periode Kas</td><td>: ${tanggalPanjang(d.periodeAwal)} s.d. ${tanggalPanjang(d.periodeAkhir)}</td></tr>
    <tr><td style="padding: 5px 0; font-weight: 700;">Tunai Masuk (diterima kasir)</td><td>: ${rp(d.tunaiMasuk)}</td></tr>
    <tr><td style="padding: 5px 0; font-weight: 700;">Tunai Keluar (petty cash dll)</td><td>: ${rp(d.tunaiKeluar)}</td></tr>
    <tr style="border-top: 1px dashed #94a3b8;"><td style="padding: 8px 0; font-weight: 800;">JUMLAH DISETORKAN KE OWNER</td>
      <td style="padding: 8px 0; font-weight: 800; font-size: 16px;">${rp(d.jumlahSetor)}</td></tr>
    ${d.catatan ? `<tr><td style="padding: 5px 0; font-weight: 700;">Catatan</td><td>: ${d.catatan}</td></tr>` : ''}
  </table>
  <table style="width:100%; margin-top: 40px; font-size: 12px; text-align: center;">
    <tr>
      <td style="width:50%; padding-bottom: 60px;">Yang Menyetor (Admin Kasir),<br /><br /><br /><br />( ______________________ )</td>
      <td style="width:50%; padding-bottom: 60px;">Yang Menerima (Owner),<br /><br /><br /><br />( ______________________ )</td>
    </tr>
  </table>
  <div style="font-size: 9.5px; color: #64748b; border-top: 1px dashed #94a3b8; padding-top: 6px;">
    Setelah disetor, uang tunai berpindah dari brankas admin ke kas owner (tercatat otomatis di sistem,
    bukan pengeluaran/pemasukan). Owner memverifikasi penerimaan di Portal Owner → tab Rekonsiliasi.
  </div>
</div>`;

export const cetakBuktiSetorKas = (d) => {
  cetakLewatIframe(htmlBuktiSetorKas(d), `Bukti Setor Kas ${d.nomor || ''}`);
};

export default {
  terbilang, ambilNomorKwitansiBerikutnya, prefixKwitansiBulan,
  tanggalPanjang, rp, cetakLewatIframe, htmlKwitansi, cetakKwitansi,
  KERTAS_A4, KERTAS_KWITANSI, cssAturanPage,
  kwitansiDariLog, htmlRingkasanKwitansi, cetakRingkasanKwitansi,
  htmlBuktiSetorKas, cetakBuktiSetorKas,
};
