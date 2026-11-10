// src/utils/laporanTryOutPdf.js
// ============================================================
// MODUL EKSPOR LAPORAN HASIL & PERINGKAT TRY OUT (PDF & EXCEL)
// Standar Resmi Bimbingan Belajar Gemilang
//
// Fitur:
// 1. unduhRekapHasilTryOutPdf: Laporan rekapitulasi lengkap & ranking siswa
//    berdasarkan perolehan skor tertinggi (siap cetak / arsip resmi).
// 2. unduhRaporIndividuTryOutPdf: Lembar rapor individual hasil try out per siswa.
// 3. unduhRekapHasilTryOutCsv: Ekspor data spreadsheet CSV/Excel lengkap.
// ============================================================

import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { hitungSkalaSesi } from './hitungSkalaSesi';

/**
 * Menentukan predikat pencapaian berdasarkan skor/akurasi
 */
export function tentukanPredikat(skor) {
  const val = Number(skor) || 0;
  if (val >= 85) return 'Sangat Memuaskan';
  if (val >= 70) return 'Memuaskan';
  if (val >= 55) return 'Cukup';
  if (val >= 40) return 'Perlu Bimbingan';
  return 'Perlu Pendampingan Khusus';
}

/**
 * Unduh PDF Rekapitulasi Hasil & Peringkat Try Out
 * @param {object} params
 * @param {object} params.paket - Objek paket try out terpilih
 * @param {Array}  params.baris - Daftar siswa + sesi [{ student, sesi }]
 * @param {object} params.identitas - Info bimbel / penandatangan
 */
export function unduhRekapHasilTryOutPdf({ paket, baris = [], identitas = {} }) {
  if (!paket) {
    alert('Pilih paket try out terlebih dahulu!');
    return;
  }

  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const margin = 14;
  const pageWidth = 210;
  const contentWidth = pageWidth - margin * 2;

  const namaBimbel = identitas.namaBimbel || 'BIMBINGAN BELAJAR GEMILANG';
  const cabang = identitas.cabang || 'Pusat Keunggulan Akademik & SNBT/TKA';
  const judulTryOut = paket.judul || 'Try Out Terbuka';
  const jenjang = paket.targetKelas || 'Semua Jenjang';
  const totalSoal = paket.totalSoal || (paket.daftarSoal || []).length || 0;
  const durasiMenit = paket.durasiMenit ? `${paket.durasiMenit} Menit` : '-';
  const waktuCetak = new Date().toLocaleString('id-ID', {
    dateStyle: 'full',
    timeStyle: 'short',
  });

  // ── 1. KOP SURAT / BANNER RESMI ──
  pdf.setFillColor(79, 70, 229); // Indigo Gemilang #4f46e5
  pdf.rect(0, 0, pageWidth, 28, 'F');

  // Garis aksen emas
  pdf.setFillColor(245, 158, 11);
  pdf.rect(0, 28, pageWidth, 2, 'F');

  // Teks Header
  pdf.setTextColor(255, 255, 255);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(14);
  pdf.text(namaBimbel.toUpperCase(), margin, 11);

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(9);
  pdf.text(cabang, margin, 16);

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(10.5);
  pdf.text('LAPORAN HASIL & PERINGKAT TRY OUT (REKAPITULASI NILAI)', margin, 23);

  // ── 2. METADATA PAKET UJIAN ──
  pdf.setTextColor(30, 41, 59);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(13);
  pdf.text(judulTryOut, margin, 38);

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(9);
  pdf.setTextColor(100, 116, 139);
  pdf.text(
    `Target: ${jenjang}   |   Jumlah Soal: ${totalSoal} Butir   |   Durasi: ${durasiMenit}   |   Dicetak: ${waktuCetak}`,
    margin,
    43
  );

  // ── 3. STATISTIK RINGKASAN PESERTA (4 KARTU) ──
  const barisSelesai = baris.filter((b) => b.sesi?.status === 'selesai');
  const barisBerjalan = baris.filter((b) => b.sesi?.status === 'berjalan');
  const barisBelum = baris.filter((b) => !b.sesi || b.sesi.status === 'belum_mulai');

  // Hitung Skor & Akurasi
  const skorList = barisSelesai.map((b) => {
    const skala = hitungSkalaSesi(b.sesi, paket);
    const skorVal = skala?.total !== null && skala?.total !== undefined ? Number(skala.total) : Number(b.sesi.totalSkorPersen || 0);
    return isNaN(skorVal) ? 0 : skorVal;
  });

  const skorTertinggi = skorList.length > 0 ? Math.max(...skorList).toFixed(2) : '0';
  const skorTerendah = skorList.length > 0 ? Math.min(...skorList).toFixed(2) : '0';
  const skorRataRata = skorList.length > 0 ? (skorList.reduce((a, b) => a + b, 0) / skorList.length).toFixed(2) : '0';

  const kpiItems = [
    { label: 'TOTAL PESERTA', val: `${baris.length} Siswa`, sub: `✅ ${barisSelesai.length} Selesai` },
    { label: 'SKOR TERTINGGI', val: skorTertinggi, sub: 'Peringkat 1' },
    { label: 'RATA-RATA SKOR', val: skorRataRata, sub: `Dari ${barisSelesai.length} Peserta` },
    { label: 'SKOR TERENDAH', val: skorTerendah, sub: 'Batas Bawah' },
  ];

  const cardWidth = (contentWidth - 9) / 4;
  kpiItems.forEach((k, idx) => {
    const x = margin + idx * (cardWidth + 3);
    const y = 48;

    pdf.setFillColor(248, 250, 252);
    pdf.setDrawColor(226, 232, 240);
    pdf.roundedRect(x, y, cardWidth, 18, 2, 2, 'FD');

    pdf.setFontSize(7.5);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(100, 116, 139);
    pdf.text(k.label, x + 3.5, y + 5);

    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(15, 23, 42);
    pdf.text(k.val, x + 3.5, y + 11.5);

    pdf.setFontSize(7);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(100, 116, 139);
    pdf.text(k.sub, x + 3.5, y + 15.5);
  });

  // ── 4. TABEL PERINGKAT & SKOR SISWA ──
  const tableData = baris.map((b, i) => {
    const selesai = b.sesi?.status === 'selesai';
    const berjalan = b.sesi?.status === 'berjalan';

    const rankText = selesai ? `${i + 1}` : '-';
    const namaSiswa = b.student?.nama || 'Tanpa Nama';
    const kelasSiswa = b.student?.kelas || b.student?.studentId || '-';

    const statusText = selesai
      ? 'Selesai'
      : berjalan
      ? 'Mengerjakan'
      : 'Belum Mulai';

    const akurasiText = selesai ? `${b.sesi.totalSkorPersen || 0}%` : '-';

    const skala = hitungSkalaSesi(b.sesi, paket);
    const skorText = selesai
      ? (skala?.total !== null && skala?.total !== undefined ? Number(skala.total).toFixed(2) : `${b.sesi.totalSkorPersen}`)
      : '-';

    const xpText = selesai ? String(b.sesi.xpFinal || 0) : '-';
    const pelanggaran = b.sesi?.pelanggaran?.length || 0;
    const pelanggaranText = pelanggaran > 0 ? `${pelanggaran}x` : '0';

    const predikatText = selesai ? tentukanPredikat(skorText) : '-';

    return [
      rankText,
      namaSiswa,
      kelasSiswa,
      statusText,
      akurasiText,
      skorText,
      xpText,
      pelanggaranText,
      predikatText,
    ];
  });

  autoTable(pdf, {
    startY: 71,
    margin: { left: margin, right: margin, bottom: 20 },
    head: [[
      '#',
      'Nama Peserta',
      'Kelas / ID',
      'Status',
      'Akurasi',
      'Skor',
      'XP',
      'Pelanggaran',
      'Predikat Capaian'
    ]],
    body: tableData,
    theme: 'grid',
    styles: {
      fontSize: 8.5,
      cellPadding: 2.2,
      font: 'helvetica',
      textColor: [30, 41, 59],
      lineColor: [226, 232, 240],
      lineWidth: 0.15,
      valign: 'middle',
    },
    headStyles: {
      fillColor: [79, 70, 229],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      halign: 'center',
      fontSize: 8.5,
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: 10, fontStyle: 'bold' },
      1: { halign: 'left', cellWidth: 50 },
      2: { halign: 'center', cellWidth: 20 },
      3: { halign: 'center', cellWidth: 22 },
      4: { halign: 'center', cellWidth: 16, fontStyle: 'bold' },
      5: { halign: 'center', cellWidth: 18, fontStyle: 'bold', textColor: [55, 48, 163] },
      6: { halign: 'center', cellWidth: 14 },
      7: { halign: 'center', cellWidth: 16 },
      8: { halign: 'left', cellWidth: 32 },
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    didParseCell: (data) => {
      // Highlight 3 Besar
      if (data.section === 'body') {
        const rowIdx = data.row.index;
        if (rowIdx === 0 && tableData[0][3] === 'Selesai') {
          data.cell.styles.fillColor = [254, 243, 199]; // Emas muda juara 1
        } else if (rowIdx === 1 && tableData[1][3] === 'Selesai') {
          data.cell.styles.fillColor = [241, 245, 249]; // Perak muda juara 2
        } else if (rowIdx === 2 && tableData[2][3] === 'Selesai') {
          data.cell.styles.fillColor = [255, 237, 213]; // Perunggu muda juara 3
        }

        // Warna Pelanggaran
        if (data.column.index === 7 && data.cell.raw !== '0') {
          data.cell.styles.textColor = [220, 38, 38];
          data.cell.styles.fontStyle = 'bold';
        }
      }
    },
  });

  // ── 5. PENGESAHAN & TANDA TANGAN ──
  const finalY = (pdf.lastAutoTable ? pdf.lastAutoTable.finalY : 180) + 10;
  let pageHeight = pdf.internal.pageSize.getHeight();

  let signY = finalY;
  if (signY + 36 > pageHeight) {
    pdf.addPage();
    signY = 24;
  }

  const kotaBimbel = identitas.kota || 'Yogyakarta';
  const tglCetak = new Date().toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  pdf.setFontSize(8.5);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(71, 85, 105);

  const signX = pageWidth - margin - 60;
  pdf.text(`${kotaBimbel}, ${tglCetak}`, signX, signY);
  pdf.text('Koordinator Akademik & Ujian,', signX, signY + 4.5);

  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(15, 23, 42);
  pdf.text(identitas.penandatangan || 'Tim Akademik Bimbel Gemilang', signX, signY + 22);

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(7.5);
  pdf.setTextColor(148, 163, 184);
  pdf.text('Dokumen Sah & Diterbitkan Sistem CBT Bimbel Gemilang', signX, signY + 26);

  // ── 6. NUMBERING HALAMAN ──
  const totalPages = pdf.internal.getNumberOfPages();
  for (let p = 1; p <= totalPages; p++) {
    pdf.setPage(p);
    pdf.setFontSize(7.5);
    pdf.setTextColor(148, 163, 184);
    pdf.text(
      `Laporan Hasil Try Out - ${judulTryOut} | Halaman ${p} dari ${totalPages}`,
      pageWidth / 2,
      pageHeight - 8,
      { align: 'center' }
    );
  }

  // Nama file ramah sistem
  const slug = (paket.judul || 'Tryout')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .slice(0, 40);

  const fileName = `Laporan_Rangking_TryOut_${slug}_${new Date().toISOString().slice(0, 10)}.pdf`;
  pdf.save(fileName);
}

/**
 * Unduh Lembar Rapor Individu Hasil Try Out Per Siswa
 * @param {object} params
 * @param {object} params.paket - Objek paket try out
 * @param {object} params.student - Objek siswa
 * @param {object} params.sesi - Objek sesi pengerjaan
 */
export function unduhRaporIndividuTryOutPdf({ paket, student, sesi, identitas = {} }) {
  if (!paket || !student || !sesi) {
    alert('Data sesi siswa tidak lengkap untuk cetak rapor!');
    return;
  }

  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const margin = 14;
  const pageWidth = 210;
  const contentWidth = pageWidth - margin * 2;

  const namaBimbel = identitas.namaBimbel || 'BIMBINGAN BELAJAR GEMILANG';
  const judulTryOut = paket.judul || 'Try Out Mandiri';
  const skala = hitungSkalaSesi(sesi, paket);
  const skorAkhir = skala?.total !== null && skala?.total !== undefined ? Number(skala.total).toFixed(2) : (sesi.totalSkorPersen || 0);
  const akurasi = sesi.totalSkorPersen || 0;
  const xp = sesi.xpFinal || 0;
  const totalPelanggaran = sesi.pelanggaran?.length || 0;

  // Header Banner
  pdf.setFillColor(67, 56, 202);
  pdf.rect(0, 0, pageWidth, 26, 'F');
  pdf.setFillColor(245, 158, 11);
  pdf.rect(0, 26, pageWidth, 2, 'F');

  pdf.setTextColor(255, 255, 255);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(14);
  pdf.text(namaBimbel, margin, 11);

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(9);
  pdf.text('LEMBAR HASIL & EVALUASI INDIVIDUAL SISWA (RAPOR TRY OUT)', margin, 17);

  // Kartu Biodata
  pdf.setTextColor(30, 41, 59);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(13);
  pdf.text(student.nama || 'Nama Siswa', margin, 38);

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(9);
  pdf.setTextColor(100, 116, 139);
  pdf.text(
    `ID: ${student.studentId || student.id || '-'}  ·  Kelas: ${student.kelas || paket.targetKelas || '-'}  ·  Ujian: ${judulTryOut}`,
    margin,
    43
  );

  // 4 Kotak Skor
  const kpiItems = [
    { label: 'SKOR AKHIR', val: String(skorAkhir), sub: tentukanPredikat(skorAkhir) },
    { label: 'AKURASI BENAR', val: `${akurasi}%`, sub: 'Persentase Menjawab Benar' },
    { label: 'XP DIPEROLEH', val: `${xp} XP`, sub: 'Poin Belajar Aktif' },
    { label: 'INTEGRITAS / KAMERA', val: `${totalPelanggaran} Pelanggaran`, sub: totalPelanggaran === 0 ? 'Tertib & Disiplin' : 'Catatan Pengawas' },
  ];

  const cardWidth = (contentWidth - 9) / 4;
  kpiItems.forEach((k, idx) => {
    const x = margin + idx * (cardWidth + 3);
    const y = 48;

    pdf.setFillColor(248, 250, 252);
    pdf.setDrawColor(226, 232, 240);
    pdf.roundedRect(x, y, cardWidth, 18, 2, 2, 'FD');

    pdf.setFontSize(7.5);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(100, 116, 139);
    pdf.text(k.label, x + 3.5, y + 5);

    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(67, 56, 202);
    pdf.text(k.val, x + 3.5, y + 11.5);

    pdf.setFontSize(7);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(100, 116, 139);
    pdf.text(k.sub, x + 3.5, y + 15.5);
  });

  // Rincian Jawaban Butir Soal
  const daftarSoal = paket.daftarSoal || [];
  const jawabanSiswa = sesi.jawaban || {};

  const detailRows = daftarSoal.map((soal, idx) => {
    const no = idx + 1;
    const mapel = soal.mapel || soal.materi || '-';
    const jwb = jawabanSiswa[soal.id];
    const kunci = soal.kunciJawaban || soal.kunci || '-';

    let status = '❌ Salah';
    let jwbStr = typeof jwb === 'object' ? JSON.stringify(jwb) : String(jwb || '-');
    let kunciStr = typeof kunci === 'object' ? JSON.stringify(kunci) : String(kunci || '-');

    if (!jwb) {
      status = '⬜ Kosong';
    } else if (String(jwb).toUpperCase() === String(kunci).toUpperCase()) {
      status = '✅ Benar';
    }

    return [String(no), mapel, jwbStr, kunciStr, status];
  });

  autoTable(pdf, {
    startY: 72,
    margin: { left: margin, right: margin, bottom: 20 },
    head: [['No', 'Mata Uji / Materi', 'Jawaban Siswa', 'Kunci Resmi', 'Status']],
    body: detailRows,
    theme: 'grid',
    styles: { fontSize: 8, cellPadding: 2 },
    headStyles: { fillColor: [67, 56, 202], halign: 'center' },
    columnStyles: {
      0: { halign: 'center', cellWidth: 10 },
      1: { halign: 'left', cellWidth: 70 },
      2: { halign: 'center', cellWidth: 35 },
      3: { halign: 'center', cellWidth: 35 },
      4: { halign: 'center', cellWidth: 30 },
    },
  });

  const slug = (student.nama || 'Siswa')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_');

  pdf.save(`Rapor_TryOut_${slug}_${new Date().toISOString().slice(0, 10)}.pdf`);
}

/**
 * Ekspor Rekapitulasi Hasil Try Out ke CSV (Bisa langsung dibuka di Microsoft Excel)
 */
export function unduhRekapHasilTryOutCsv({ paket, baris = [] }) {
  if (!paket || !baris || baris.length === 0) {
    alert('Tidak ada data hasil try out untuk diekspor!');
    return;
  }

  const judul = paket.judul || 'Tryout';
  const headers = [
    'Peringkat',
    'Nama Lengkap',
    'Kelas / ID',
    'Status Ujian',
    'Akurasi (%)',
    'Skor Akhir Resmi',
    'XP Diperoleh',
    'Jumlah Pelanggaran',
    'Predikat',
  ];

  const csvRows = [headers.join(',')];

  baris.forEach((b, i) => {
    const selesai = b.sesi?.status === 'selesai';
    const berjalan = b.sesi?.status === 'berjalan';

    const rank = selesai ? i + 1 : '-';
    const nama = `"${(b.student?.nama || '').replace(/"/g, '""')}"`;
    const kelas = `"${(b.student?.kelas || b.student?.studentId || '').replace(/"/g, '""')}"`;
    const status = selesai ? 'Selesai' : berjalan ? 'Sedang Mengerjakan' : 'Belum Mulai';
    const akurasi = selesai ? (b.sesi.totalSkorPersen || 0) : 0;
    
    const skala = hitungSkalaSesi(b.sesi, paket);
    const skor = selesai
      ? (skala?.total !== null && skala?.total !== undefined ? Number(skala.total).toFixed(2) : (b.sesi.totalSkorPersen || 0))
      : 0;

    const xp = selesai ? (b.sesi.xpFinal || 0) : 0;
    const pelanggaran = b.sesi?.pelanggaran?.length || 0;
    const predikat = selesai ? `"${tentukanPredikat(skor)}"` : '"-"';

    csvRows.push([
      rank,
      nama,
      kelas,
      status,
      akurasi,
      skor,
      xp,
      pelanggaran,
      predikat,
    ].join(','));
  });

  const blob = new Blob(['\uFEFF' + csvRows.join('\r\n')], {
    type: 'text/csv;charset=utf-8;',
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `Rekap_Nilai_${judul.replace(/[^a-zA-Z0-9]+/g, '_')}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
