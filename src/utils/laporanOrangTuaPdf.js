// src/utils/laporanOrangTuaPdf.js
// ============================================================
// LAPORAN ORANG TUA PER ANAK (19 Okt 2026, permintaan owner): admin
// mengunduh PDF lengkap per siswa dari halaman Analitik Belajar —
// berisi bagan skor per sesi, tabel akurasi per subtes, analisis tempo,
// NARASI hangat untuk orang tua, dan saran belajar.
//
// Narasi & saran 100% DETERMINISTIK dari angka bangunAnalitikBelajar
// (filosofi api/generateStudentNarrative.js: PDF wajib bisa dibuat walau
// AI down; AI hanya boleh memoles kalimat, tidak menyimpulkan baru).
// ============================================================
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { analitikPerSubtes, deskripsiSiswaLengkap } from './analitikBelajar.js';

/** Data bagan skor per sesi (urut waktu) — murni & teruji. */
export function dataBaganSkor(barisSesi = []) {
  return (Array.isArray(barisSesi) ? barisSesi : [])
    .filter((b) => b?.waktuSelesaiMs != null)
    .sort((a, b) => Number(a.waktuSelesaiMs) - Number(b.waktuSelesaiMs))
    .map((b) => ({
      label: String(b.labelPekan || b.tanggal || new Date(Number(b.waktuSelesaiMs)).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })),
      skor: Math.round(Number(b.totalSkorPersen) || 0),
    }));
}

/** Narasi hangat untuk orang tua — hanya dari angka terverifikasi. */
export function susunNarasiOrangTua(a = {}) {
  const nama = String(a.nama || 'Ananda');
  const par = [];
  par.push(`Laporan ini disusun oleh Bimbingan Belajar Gemilang sebagai dokumen pemantauan perkembangan belajar ananda ${nama} (kelas ${a.kelas || '-'}), berdasarkan ${a.jumlahSesi || 0} sesi try out terukur pada periode berjalan. Seluruh angka dihitung otomatis dari hasil pekerjaan ananda sendiri.`);
  const arahKata = a.arah === 'naik' ? 'meningkat' : a.arah === 'turun' ? 'menurun' : 'stabil';
  par.push(`Hasil pengukuran: skor rata-rata ${a.skorRata ?? 0}%${a.delta != null ? `, dengan perubahan ${a.delta >= 0 ? '+' : ''}${a.delta} poin pada sesi terakhir sehingga arah progres dinyatakan ${arahKata} (ambang penilaian +-5 poin antar sesi berurutan)` : ''}.`);
  if (a.detikPerSoal != null) {
    par.push(`Tempo pengerjaan rata-rata ${a.detikPerSoal} detik per soal, ${a.tempoWajar ? 'berada dalam rentang ideal (<= 90 detik per soal)' : 'berada di atas rentang ideal (90 detik per soal) sehingga diperlukan pembiasaan pengelolaan waktu'}.`);
  }
  if (a.terkuat || a.terlemah) {
    par.push(`Pemetaan kompetensi: ${a.terkuat ? `capaian tertinggi pada ${a.terkuat.nama} (${a.terkuat.skor}%)` : 'belum ada subtes pada kategori kuat'}${a.terlemah ? `; capaian terendah pada ${a.terlemah.nama} (${a.terlemah.skor}%)` : ''}. Rincian kuantitatif per subtes tersaji pada tabel dan deskripsi bagian sebelumnya.`);
  }
  par.push('Tindak lanjut: penyesuaian materi pendampingan diprioritaskan pada subtes berkategori perlu pendampingan, disertai pengayaan pada subtes kuat; pemantauan tren dilanjutkan pada siklus pekanan berikutnya.');
  par.push('Demikian laporan ini disampaikan untuk keperluan pemantauan bersama antara lembaga dan orang tua/wali. Informasi tambahan dapat diperoleh melalui administrasi Bimbingan Belajar Gemilang.');
  return par;
}

/** Saran belajar berbentuk butir — murni dari agregat subtes. */
export function susunSaranBelajar(a = {}) {
  const saran = [];
  if (a.terlemah) saran.push(`Fokus pendampingan dua pekan ke depan: ${a.terlemah.nama} (akurasi ${a.terlemah.skor}%).`);
  if (a.terkuat) saran.push(`Pengayaan: berikan variasi soal ${a.terkuat.nama} tingkat lanjut agar kekuatan tidak stagnan.`);
  if (a.detikPerSoal != null && !a.tempoWajar) saran.push(`Latihan timer: target turunkan tempo dari ${a.detikPerSoal} detik/soal menuju tempo ideal.`);
  if (a.arah === 'turun') saran.push('Jadwalkan sesi ulasan bersama tentor untuk membedah kesalahan sesi terakhir.');
  if (!saran.length) saran.push('Pertahankan ritme belajar saat ini; pantau tren pekanan pada dasbor analitik.');
  return saran;
}

/**
 * Unduh PDF laporan orang tua per anak.
 * @param {object} args { siswa, barisSesi, identitas: {namaBimbel, penandatangan, jabatan} }
 */
export function unduhLaporanOrangTuaPdf({ siswa = {}, barisSesi = [], identitas = {} } = {}) {
  const pdf = new jsPDF({ unit: 'mm', format: 'a4' });
  const M = 14; const W = 210 - M * 2;
  const namaBimbel = identitas.namaBimbel || 'Bimbel Gemilang';

  pdf.setFillColor(91, 46, 204);
  pdf.rect(0, 0, 210, 26, 'F');
  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(14); pdf.setFont('helvetica', 'bold');
  pdf.text(namaBimbel, M, 11);
  pdf.setFontSize(10); pdf.setFont('helvetica', 'normal');
  pdf.text('Laporan Perkembangan Belajar — Try Out Pekanan (dokumen untuk orang tua/wali)', M, 17);
  pdf.setTextColor(0, 0, 0);

  pdf.setFontSize(12); pdf.setFont('helvetica', 'bold');
  pdf.text(`${siswa.nama || '(nama)'}  ·  kelas ${siswa.kelas || '-'}`, M, 36);
  pdf.setFontSize(9.5); pdf.setFont('helvetica', 'normal');
  pdf.text(`ID siswa: ${siswa.studentId || '-'}   ·   dicetak: ${new Date().toLocaleString('id-ID')}`, M, 41);

  // kartu ringkasan
  const kartu = [
    ['Sesi selesai', String(siswa.jumlahSesi ?? 0)],
    ['Skor rata-rata', `${siswa.skorRata ?? 0}%`],
    ['Tren terakhir', siswa.delta == null ? '-' : `${siswa.delta >= 0 ? '+' : ''}${siswa.delta} poin`],
    ['Tempo', siswa.detikPerSoal == null ? '-' : `${siswa.detikPerSoal} d/soal`],
  ];
  kartu.forEach(([l, v], i) => {
    const x = M + (i % 4) * (W / 4);
    pdf.setDrawColor(200); pdf.setFillColor(248, 250, 252);
    pdf.roundedRect(x + 1, 46, W / 4 - 3, 16, 2, 2, 'FD');
    pdf.setFontSize(8); pdf.setTextColor(100);
    pdf.text(l.toUpperCase(), x + 4, 52);
    pdf.setFontSize(12); pdf.setFont('helvetica', 'bold'); pdf.setTextColor(15);
    pdf.text(v, x + 4, 59);
    pdf.setFont('helvetica', 'normal'); pdf.setTextColor(0);
  });

  // bagan skor per sesi (batang manual)
  const bagan = dataBaganSkor(barisSesi);
  pdf.setFontSize(11); pdf.setFont('helvetica', 'bold');
  pdf.text('Bagan skor per sesi', M, 70);
  pdf.setFont('helvetica', 'normal');
  const yDasar = 108; const tinggiMax = 32; const n = Math.max(bagan.length, 1);
  const lebarBatang = Math.min(14, (W - 10) / n);
  pdf.setDrawColor(150); pdf.line(M, yDasar, M + W, yDasar);
  pdf.setDrawColor(230); pdf.line(M, yDasar - tinggiMax, M + W, yDasar - tinggiMax);
  pdf.setFontSize(7.5); pdf.setTextColor(120);
  pdf.text('100%', M - 1, yDasar - tinggiMax - 1, { align: 'right' });
  pdf.text('0%', M - 1, yDasar - 1, { align: 'right' });
  pdf.setTextColor(0);
  bagan.forEach((b, i) => {
    const x = M + 4 + i * ((W - 10) / n);
    const t = (Math.max(0, Math.min(100, b.skor)) / 100) * tinggiMax;
    pdf.setFillColor(b.skor >= 70 ? 22 : b.skor >= 45 ? 234 : 220, b.skor >= 70 ? 163 : b.skor >= 45 ? 178 : 38, b.skor >= 70 ? 94 : b.skor >= 45 ? 34 : 38);
    pdf.rect(x, yDasar - t, lebarBatang, t, 'F');
    pdf.setFontSize(7);
    pdf.text(String(b.skor), x + lebarBatang / 2, yDasar - t - 1, { align: 'center' });
    pdf.text(b.label, x + lebarBatang / 2, yDasar + 4, { align: 'center' });
  });
  if (!bagan.length) { pdf.setFontSize(9); pdf.text('(belum ada sesi selesai)', M + 4, yDasar - 6); }

  // tabel subtes
  autoTable(pdf, {
    startY: 118,
    head: [['Subtes / materi', 'Akurasi rata-rata', 'Kategori']],
    body: (siswa.subtes || []).map((sb) => [sb.nama, `${sb.skor}%`, sb.skor >= 70 ? 'Kuat' : sb.skor >= 45 ? 'Berkembang' : 'Perlu pendampingan']),
    styles: { fontSize: 9 },
    headStyles: { fillColor: [91, 46, 204] },
    margin: { left: M, right: M },
  });

  // 🔥 19 Okt (permintaan owner): ANALISIS PER BAGIAN — tabel rinci per
  // subtes + deskripsi objektif-kuantitatif, sebelum narasi hangat.
  const perSubtes = analitikPerSubtes(barisSesi);
  let yLanjut = 0;
  if (perSubtes.length) {
    autoTable(pdf, {
      startY: pdf.lastAutoTable ? pdf.lastAutoTable.finalY + 8 : 150,
      head: [['Subtes / mapel', 'Sesi', 'Akurasi pertama', 'Akurasi terakhir', 'Tren', 'Kategori']],
      body: perSubtes.map((x) => [
        x.nama, String(x.jumlahSesi), `${x.skorPertama}%`, `${x.skorTerakhir}%`,
        x.delta == null ? '-' : `${x.delta >= 0 ? '+' : ''}${x.delta} (${x.arah})`, x.kategori,
      ]),
      styles: { fontSize: 8.5 },
      headStyles: { fillColor: [15, 118, 126] },
      margin: { left: M, right: M },
    });
    let y2 = pdf.lastAutoTable ? pdf.lastAutoTable.finalY + 8 : 200;
    if (y2 > 250) { pdf.addPage(); y2 = 20; }
    yLanjut = y2;
    pdf.setFontSize(11); pdf.setFont('helvetica', 'bold');
    pdf.text('Deskripsi analisis per bagian (objektif & kuantitatif)', M, y2);
    pdf.setFont('helvetica', 'normal'); pdf.setFontSize(9);
    y2 += 5;
    for (const par of deskripsiSiswaLengkap(siswa, perSubtes)) {
      const lines = pdf.splitTextToSize(par, W);
      for (const ln of lines) {
        if (y2 > 280) { pdf.addPage(); y2 = 20; }
        pdf.text(ln, M, y2);
        y2 += 4.2;
      }
      y2 += 1.6;
    }
    yLanjut = y2;
  }

  // narasi + saran — y MELANJUTKAN bagian sebelumnya (regresi 19 Okt:
  // dulu y di-reset dari lastAutoTable sehingga narasi menimpa deskripsi)
  let y = yLanjut ? yLanjut + 8 : (pdf.lastAutoTable ? pdf.lastAutoTable.finalY + 8 : 150);
  if (y > 240) { pdf.addPage(); y = 20; }
  pdf.setFontSize(11); pdf.setFont('helvetica', 'bold');
  pdf.text('Catatan untuk orang tua/wali', M, y);
  pdf.setFont('helvetica', 'normal'); pdf.setFontSize(9.5);
  y += 5;
  for (const par of susunNarasiOrangTua(siswa)) {
    const lines = pdf.splitTextToSize(par, W);
    for (const ln of lines) {
      if (y > 280) { pdf.addPage(); y = 20; }
      pdf.text(ln, M, y);
      y += 4.4;
    }
    y += 2;
  }
  y += 2;
  pdf.setFontSize(11); pdf.setFont('helvetica', 'bold');
  pdf.text('Rencana pendampingan kami', M, y);
  pdf.setFont('helvetica', 'normal'); pdf.setFontSize(9.5);
  y += 5;
  for (const sr of susunSaranBelajar(siswa)) {
    const lines = pdf.splitTextToSize(`• ${sr}`, W);
    for (const ln of lines) {
      if (y > 280) { pdf.addPage(); y = 20; }
      pdf.text(ln, M, y);
      y += 4.4;
    }
  }
  y += 12;
  if (y > 255) { pdf.addPage(); y = 30; }
  // 🔥 20 Okt (keputusan owner): laporan TIDAK ditandatangani pribadi —
  // disahkan dengan CAP LEMBAGA "Bimbingan Belajar Gemilang".
  pdf.setDrawColor(91, 46, 204);
  pdf.setLineWidth(0.9);
  pdf.roundedRect(M, y, 74, 28, 3, 3, 'S');
  pdf.setLineWidth(0.35);
  pdf.roundedRect(M + 2.5, y + 2.5, 69, 23, 2, 2, 'S');
  pdf.setFontSize(10.5); pdf.setFont('helvetica', 'bold'); pdf.setTextColor(91, 46, 204);
  pdf.text('BIMBINGAN BELAJAR', M + 37, y + 11, { align: 'center' });
  pdf.text('GEMILANG', M + 37, y + 17.5, { align: 'center' });
  pdf.setFontSize(7); pdf.setFont('helvetica', 'normal');
  pdf.text('cap resmi lembaga', M + 37, y + 23, { align: 'center' });
  pdf.setTextColor(0);
  pdf.setFontSize(9.5); pdf.setFont('helvetica', 'normal');
  pdf.text('Disahkan dengan cap lembaga oleh:', M + 86, y + 9);
  pdf.setFont('helvetica', 'bold');
  pdf.text(`${identitas.penandatangan || 'Admin Operasional'} - Bimbingan Belajar Gemilang`, M + 86, y + 15);
  pdf.setFont('helvetica', 'normal');
  pdf.text(`dicetak & dicap: ${new Date().toLocaleString('id-ID')}`, M + 86, y + 21);

  const slug = String(siswa.nama || 'siswa').toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 40);
  pdf.save(`laporan-orang-tua-${slug}.pdf`);
  return true;
}

export default { dataBaganSkor, susunNarasiOrangTua, susunSaranBelajar, unduhLaporanOrangTuaPdf };
