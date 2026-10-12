// src/utils/suratTargetPdf.js
// ============================================================
// Perender PDF "Surat Pernyataan Target & Komitmen Belajar".
// Isi surat disusun utils/isiSuratTarget.js (murni, teruji); berkas ini
// hanya urusan kertas: logo, tipografi, tabel, cap, tanda tangan.
//
// 🔥 IDENTITAS RESMI
// - Logo: SATU sumber dengan berkas repo lain, '/pwa-192x192.png'
//   (WATERMARK.logo di utils/fieldButirSoal.js). Repo ini sudah punya tiga
//   rujukan buntu ke /logo-gemilang.png yang tidak ada di public/ -- jangan
//   menambah yang keempat. Bila logo gagal dimuat, surat TETAP jadi tanpa
//   logo daripada gagal total di depan orang tua.
// - Cap: digambar vektor (dua lingkaran + teks) karena berkas cap PNG belum
//   ada. Bila suatu hari owner punya scan cap resmi, taruh di
//   public/cap-gemilang.png dan fungsi ini akan memakainya otomatis.
// ============================================================
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { WATERMARK } from './fieldButirSoal.js';

async function keDataUrl(url) {
  const r = await fetch(url);
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  const blob = await r.blob();
  return await new Promise((res, rej) => {
    const fr = new FileReader();
    fr.onload = () => res(fr.result);
    fr.onerror = rej;
    fr.readAsDataURL(blob);
  });
}

export async function ambilAsetSurat() {
  const aset = { logo: null, cap: null };
  try { aset.logo = await keDataUrl(WATERMARK.logo); } catch (e) { console.warn('[suratTarget] logo dilewati:', e?.message); }
  try { aset.cap = await keDataUrl('/cap-gemilang.png'); } catch { /* opsional, cap vektor jadi cadangan */ }
  return aset;
}

function gambarCap(doc, x, y) {
  // Cap vektor: dua lingkaran konsentris + tiga baris teks. Sengaja sederhana
  // supaya terbaca hitam-putih saat difotokopi.
  doc.setDrawColor(30, 41, 59);
  doc.setLineWidth(0.6);
  doc.circle(x, y, 11, 'S');
  doc.setLineWidth(0.3);
  doc.circle(x, y, 9, 'S');
  doc.setFontSize(6.5);
  doc.setTextColor(30, 41, 59);
  doc.text('BIMBEL', x, y - 3, { align: 'center' });
  doc.text('GEMILANG', x, y + 0.5, { align: 'center' });
  doc.text('KONSULTASI PTN', x, y + 4, { align: 'center' });
}

/**
 * Render & unduh surat.
 * @param {object} isi hasil isiSuratTarget()
 * @param {{logo?: string|null, cap?: string|null}} [aset]
 * @returns {jsPDF} doc (dikembalikan supaya bisa diuji/dipratinjau)
 */
export function renderSuratTargetPdf(isi, aset = {}) {
  // 🔥 2026-10-10 (permintaan owner): SATU KERTAS. Surat ini ditempel di
  // dinding rumah & dibawa konsultasi -- dua halaman membuat setengahnya
  // terpisah. Seluruh tipografi dipadatkan ke batas terbaca: badan 8.6pt,
  // tabel 7.5pt, spasi baris 3.7mm. Rinci per pilihan digabung jadi satu
  // paragraf mengalir, bukan butir per kalimat.
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const M = 13;
  const W = 210 - M * 2;
  const LH = 3.7;
  let y = 12;

  // ---- KOP ----
  if (aset.logo) {
    try { doc.addImage(aset.logo, 'PNG', M, y - 1, 13, 13); } catch { /* logo opsional */ }
  }
  const xTeks = aset.logo ? M + 16 : M;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(30, 41, 59);
  doc.text(isi.kop.institusi, xTeks, y + 3.5);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(90, 90, 90);
  doc.text(isi.kop.sub, xTeks, y + 8);
  y += 11.5;
  doc.setDrawColor(30, 41, 59);
  doc.setLineWidth(0.7);
  doc.line(M, y, M + W, y);
  doc.setLineWidth(0.25);
  doc.line(M, y + 1, M + W, y + 1);
  y += 6;

  // ---- JUDUL & TANGGAL ----
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(0, 0, 0);
  doc.text(isi.kop.judulDok, 105, y, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.6);
  y += 4.6;
  doc.text(isi.tanggal, M + W, y, { align: 'right' });
  y += 5.4;

  // ---- IDENTITAS ----
  doc.text(isi.pembuka, M, y);
  y += 4.6;
  for (const [k, v] of isi.identitas) {
    doc.setFont('helvetica', 'bold');
    doc.text(k, M + 3, y);
    doc.setFont('helvetica', 'normal');
    doc.text(`: ${v}`, M + 42, y);
    y += 4.4;
  }
  y += 1.4;
  for (const par of isi.pernyataan) {
    const t = doc.splitTextToSize(par, W);
    doc.text(t, M, y);
    y += t.length * LH + 1.4;
  }
  y += 1;

  // ---- TABEL PILIHAN ----
  autoTable(doc, {
    startY: y,
    head: [isi.tabel.kepala],
    body: isi.tabel.baris,
    margin: { left: M, right: M },
    styles: { fontSize: 7.5, cellPadding: 1.5, textColor: [30, 41, 59] },
    headStyles: { fillColor: [76, 110, 245], textColor: [255, 255, 255], fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [245, 247, 255] },
  });
  y = doc.lastAutoTable.finalY + 4.6;

  // ---- RINCIAN PER PILIHAN: satu paragraf mengalir per pilihan ----
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.text('Hasil Riset & Posisi Saya', M, y);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.6);
  y += 4.2;
  for (const r of isi.rincian) {
    doc.setFont('helvetica', 'bold');
    doc.text(`Pilihan ${r.urutan} (${r.label})`, M + 1, y);
    doc.setFont('helvetica', 'normal');
    y += 3.9;
    const t = doc.splitTextToSize(r.kalimat.join(' '), W - 3);
    doc.text(t, M + 2, y);
    y += t.length * LH + 1.6;
  }
  y += 0.8;

  // ---- KOMITMEN ----
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.text('Komitmen Belajar Saya', M, y);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.6);
  y += 4.2;
  isi.komitmen.forEach((k, i) => {
    const t = doc.splitTextToSize(`${i + 1}. ${k}`, W - 3);
    doc.text(t, M + 1, y);
    y += t.length * LH + 0.8;
  });
  y += 1.2;
  const tPen = doc.splitTextToSize(isi.penutup, W);
  doc.text(tPen, M, y);
  y += tPen.length * LH + 4;

  // ---- TANDA TANGAN + CAP ----
  const kol = W / 3;
  isi.tandaTangan.forEach((t, i) => {
    const x = M + kol * i + kol / 2;
    doc.setFontSize(8.6);
    doc.text(t.peran, x, y, { align: 'center' });
    if (i === 2) gambarCapVektor(doc, x, y + 12, aset);
    doc.setFont('helvetica', 'bold');
    doc.text(t.nama, x, y + 24, { align: 'center' });
    doc.setFont('helvetica', 'normal');
  });
  y += 28;

  // ---- CATATAN KAKI ----
  doc.setFontSize(7);
  doc.setTextColor(110, 110, 110);
  const tCat = doc.splitTextToSize(isi.catatanKaki, W);
  // Catatan kaki ikut halaman pertama selama muat; bila benar-benar tidak
  // muat (mis. tiga pilihan panjang), halaman kedua adalah jalan terakhir,
  // bukan kebiasaan.
  if (y + tCat.length * 3 > 288) doc.addPage(), y = 15;
  doc.text(tCat, M, y);
  doc.setTextColor(0, 0, 0);
  return doc;
}

function gambarCapVektor(doc, x, y, aset) {
  if (aset.cap) {
    try { doc.addImage(aset.cap, 'PNG', x - 11, y - 11, 22, 22); return; } catch { /* jatuh ke vektor */ }
  }
  gambarCap(doc, x, y);
}

/** Unduh langsung sebagai berkas. */
export async function unduhSuratTarget(isi, aset, namaBerkas) {
  const doc = renderSuratTargetPdf(isi, aset);
  doc.save(namaBerkas || `Surat-Target-${String(isi.identitas?.[0]?.[1] || 'siswa').replace(/\s+/g, '-')}.pdf`);
  return doc;
}

export default { renderSuratTargetPdf, unduhSuratTarget, ambilAsetSurat };
