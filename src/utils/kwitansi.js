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
import { collection, query, where, getDocs } from 'firebase/firestore';

// ---------- TERBILANG (angka -> kata-kata rupiah) ----------
const SATUAN = ['', 'Satu', 'Dua', 'Tiga', 'Empat', 'Lima', 'Enam', 'Tujuh',
  'Delapan', 'Sembilan', 'Sepuluh', 'Sebelas'];

export const terbilang = (n) => {
  let angka = Math.floor(Math.abs(parseInt(n) || 0));
  if (angka === 0) return 'Nol';
  if (angka < 12) return SATUAN[angka];
  if (angka < 20) return `${terbilang(angka - 10)} Belas`;
  if (angka < 100) return `${terbilang(Math.floor(angka / 10))} Puluh${angka % 10 ? ' ' + terbilang(angka % 10) : ''}`;
  if (angka < 200) return `Seratus${angka - 100 ? ' ' + terbilang(angka - 100) : ''}`;
  if (angka < 1000) return `${terbilang(Math.floor(angka / 100))} Ratus${angka % 100 ? ' ' + terbilang(angka % 100) : ''}`;
  if (angka < 2000) return `Seribu${angka - 1000 ? ' ' + terbilang(angka - 1000) : ''}`;
  if (angka < 1000000) return `${terbilang(Math.floor(angka / 1000))} Ribu${angka % 1000 ? ' ' + terbilang(angka % 1000) : ''}`;
  if (angka < 1000000000) return `${terbilang(Math.floor(angka / 1000000))} Juta${angka % 1000000 ? ' ' + terbilang(angka % 1000000) : ''}`;
  return `${terbilang(Math.floor(angka / 1000000000))} Miliar${angka % 1000000000 ? ' ' + terbilang(angka % 1000000000) : ''}`;
};

// ---------- NOMOR KWITANSI ----------
export const prefixKwitansiBulan = (date = new Date()) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  return `KWT-${y}${m}-`;
};

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

// ---------- FORMAT TANGGAL ----------
const NAMA_BULAN = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];

export const tanggalPanjang = (tanggalStr) => {
  if (!tanggalStr) return new Date().toLocaleDateString('id-ID');
  const [y, m, d] = String(tanggalStr).split('-').map(Number);
  if (!y || !m || !d) return tanggalStr;
  return `${d} ${NAMA_BULAN[m - 1]} ${y}`;
};

export const rp = (n) => 'Rp ' + (parseInt(n) || 0).toLocaleString('id-ID');

// ---------- CETAK LEWAT IFRAME ----------
// srcdoc dipakai agar style print tidak bocor ke halaman utama.
// Logo /pwa-192x192.png ikut ke-print karena iframe satu origin.
export const cetakLewatIframe = (htmlIsi, judulDokumen = 'Cetak') => {
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
  body { font-family: 'Segoe UI', Arial, sans-serif; color: #0f172a; padding: 24px; }
  @page { size: A4; margin: 14mm; }
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

// ---------- TEMPLATE KWITANSI ----------
// data: { nomor, tanggal, diterimaDari, studentId, jumlah, keperluan,
//         metode, refTransfer, catatanTambahan, penandaTangan }
export const htmlKwitansi = (data) => {
  const jumlah = parseInt(data.jumlah) || 0;
  const logo = '/pwa-192x192.png';
  return `
<div style="max-width: 720px; margin: 0 auto; border: 3px double #0f172a; padding: 22px 26px;">
  <table style="width:100%; border-collapse: collapse;">
    <tr>
      <td style="width:74px; vertical-align: top;">
        <img src="${logo}" alt="Logo Bimbel Gemilang"
             style="width:64px; height:64px; border-radius:50%; border:2px solid #0f172a;" />
      </td>
      <td style="vertical-align: top; padding-left: 12px;">
        <div style="font-size: 20px; font-weight: 800; letter-spacing: 1px;">BIMBEL GEMILANG</div>
        <div style="font-size: 11px; color: #334155;">Bimbingan Belajar &amp; Platform Edukasi Digital</div>
        <div style="font-size: 11px; color: #334155;">Sistem Keuangan Resmi — Kwitansi Pembayaran</div>
      </td>
      <td style="text-align: right; vertical-align: top;">
        <div style="font-size: 15px; font-weight: 800;">KWITANSI</div>
        <div style="font-size: 12px; font-weight: 700; border: 1px solid #0f172a; display: inline-block; padding: 3px 8px; margin-top: 4px;">
          No: ${data.nomor || '(tanpa nomor)'}
        </div>
      </td>
    </tr>
  </table>

  <hr style="border: none; border-top: 2px solid #0f172a; margin: 14px 0;" />

  <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
    <tr>
      <td style="width: 160px; padding: 5px 0; vertical-align: top; font-weight: 700;">Tanggal</td>
      <td style="padding: 5px 0;">: ${tanggalPanjang(data.tanggal)}</td>
    </tr>
    <tr>
      <td style="padding: 5px 0; vertical-align: top; font-weight: 700;">Sudah Terima Dari</td>
      <td style="padding: 5px 0;">: <b>${data.diterimaDari || '-'}</b>${data.studentId ? ` &nbsp;<span style="color:#475569;">(ID Siswa: ${data.studentId})</span>` : ''}</td>
    </tr>
    <tr>
      <td style="padding: 5px 0; vertical-align: top; font-weight: 700;">Jumlah Uang</td>
      <td style="padding: 5px 0;">: <b style="font-size: 14px; text-decoration: underline;">${terbilang(jumlah)} Rupiah</b></td>
    </tr>
    <tr>
      <td style="padding: 5px 0; vertical-align: top; font-weight: 700;">Untuk Pembayaran</td>
      <td style="padding: 5px 0;">: ${data.keperluan || '-'}</td>
    </tr>
    <tr>
      <td style="padding: 5px 0; vertical-align: top; font-weight: 700;">Metode Bayar</td>
      <td style="padding: 5px 0;">: ${data.metode || '-'}${data.refTransfer ? ` — No. Struk/Ref Bank: <b>${data.refTransfer}</b>` : ''}</td>
    </tr>
    ${data.catatanTambahan ? `
    <tr>
      <td style="padding: 5px 0; vertical-align: top; font-weight: 700;">Catatan</td>
      <td style="padding: 5px 0;">: ${data.catatanTambahan}</td>
    </tr>` : ''}
  </table>

  <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
    <tr>
      <td></td>
      <td style="width: 260px; text-align: right;">
        <div style="border: 2px solid #0f172a; padding: 8px 12px; background: #f8fafc;">
          <div style="font-size: 11px; font-weight: 700;">JUMLAH</div>
          <div style="font-size: 19px; font-weight: 800;">${rp(jumlah)}</div>
        </div>
      </td>
    </tr>
  </table>

  <table style="width: 100%; border-collapse: collapse; margin-top: 34px; font-size: 12px; text-align: center;">
    <tr>
      <td style="width: 50%; padding-bottom: 60px;">Pembayar / Orang Tua,<br /><br /><br /><br />( ______________________ )</td>
      <td style="width: 50%; padding-bottom: 60px;">${data.penandaTangan || 'Admin Keuangan'},<br /><br /><br /><br />( ______________________ )</td>
    </tr>
  </table>

  <div style="font-size: 9.5px; color: #64748b; border-top: 1px dashed #94a3b8; padding-top: 6px; margin-top: 4px;">
    Dokumen ini dicetak otomatis oleh sistem Bimbel Gemilang dan sah sebagai bukti pembayaran.
    Simpan kwitansi ini baik-baik. Nomor kwitansi tercatat permanen di sistem (bisa diverifikasi ke admin).
  </div>
</div>`;
};

export const cetakKwitansi = (data) => {
  cetakLewatIframe(htmlKwitansi(data), `Kwitansi ${data.nomor || ''}`);
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
  kwitansiDariLog, htmlRingkasanKwitansi, cetakRingkasanKwitansi,
  htmlBuktiSetorKas, cetakBuktiSetorKas,
};
