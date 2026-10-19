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
  par.push(`Assalamu'alaikum / salam sejahtera bagi Bapak/Ibuka orang tua/wali dari ${nama} (kelas ${a.kelas || '-'}). Laporan ini merangkum ${a.jumlahSesi || 0} sesi try out yang telah ananda selesaikan pada periode berjalan, dihitung otomatis dari hasil kerja ananda sendiri.`);
  const arahKata = a.arah === 'naik' ? 'menunjukkan tren MENINGKAT' : a.arah === 'turun' ? 'sedang menurun dibanding sesi sebelumnya' : 'cenderung stabil';
  par.push(`Rata-rata skor ananda adalah ${a.skorRata ?? 0}%${a.delta != null ? ` , dengan perubahan ${a.delta >= 0 ? '+' : ''}${a.delta} poin pada sesi terakhir sehingga progresnya ${arahKata}` : ''}. Kami melihat perkembangan ini sebagai bahan pembinaan, bukan penghakiman.`);
  if (a.detikPerSoal != null) {
    par.push(a.tempoWajar
      ? `Dari sisi tempo, ananda mengerjakan rata-rata ${a.detikPerSoal} detik per soal — termasuk tempo kerja yang wajar dan terjaga.`
      : `Dari sisi tempo, ananda menghabiskan rata-rata ${a.detikPerSoal} detik per soal — sedikit lebih lama dari tempo ideal; ini biasanya tanda kehati-hatian yang bisa dilatih menjadi kecepatan melalui pembiasaan timer.`);
  }
  if (a.terkuat) par.push(`Kekuatan ananda saat ini berada pada materi ${a.terkuat.nama} (akurasi ${a.terkuat.skor}%). Pertahankan dengan variasi soal yang lebih menantang.`);
  if (a.terlemah) par.push(`Bidang yang kami dampingi lebih intensif adalah ${a.terlemah.nama} (akurasi ${a.terlemah.skor}%). Mohon dukungan Bapak/Ibu untuk jadwal belajar tambahan yang tenang di rumah pada topik ini.`);
  par.push('Demikian laporan ini kami sampaikan. Terima kasih atas kepercayaan dan kerja sama Bapak/Ibu; pintu diskusi kami terbuka setiap saat.');
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

  // narasi + saran
  let y = pdf.lastAutoTable ? pdf.lastAutoTable.finalY + 8 : 150;
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
  y += 10;
  if (y > 265) { pdf.addPage(); y = 30; }
  pdf.text('Hormat kami,', M, y);
  y += 16;
  pdf.setFont('helvetica', 'bold');
  pdf.text(identitas.penandatangan || '(nama penandatangan)', M, y);
  pdf.setFont('helvetica', 'normal');
  pdf.text(identitas.jabatan || 'Kepala Operasional Bimbel Gemilang', M, y + 4.5);

  const slug = String(siswa.nama || 'siswa').toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 40);
  pdf.save(`laporan-orang-tua-${slug}.pdf`);
  return true;
}

export default { dataBaganSkor, susunNarasiOrangTua, susunSaranBelajar, unduhLaporanOrangTuaPdf };
