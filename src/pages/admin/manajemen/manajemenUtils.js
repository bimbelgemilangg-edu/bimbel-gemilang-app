// src/pages/admin/manajemen/manajemenUtils.js
// ============================================================
// MODUL UTILITY MANAJEMEN EKSEKUTIF BIMBEL GEMILANG
// 1. Audit Finansial Riil & Deteksi Kebocoran Gaji Tentor
// 2. Decision Engine Simulasi Kapasitas & Pecah Kelas (Crowded Class)
// 3. Generator Laporan Besar Excel (.xlsx) Multi-Sheet
// 4. Generator Briefing Strategis AI-Ready (ChatGPT / Gemini / Claude)
// ============================================================

import * as XLSX from 'xlsx';

export const rp = (num) => {
  const n = parseInt(num || 0, 10) || 0;
  return 'Rp ' + n.toLocaleString('id-ID');
};

/**
 * Normalisasi nama kelas/tingkatan siswa agar rapi dan seragam.
 */
export function ekstrakTingkatKelas(s) {
  const k = String(s?.kelasSekolah || s?.kelas || s?.studentKelas || s?.grade || '').trim();
  if (!k) return 'Belum Ada Kelas';

  // Format kelas 7 SMP
  if (/(?:^|\b)(?:7|vii)(?:\b|$)/i.test(k) || (/7/i.test(k) && /smp/i.test(k))) return 'Kelas 7 SMP';
  if (/(?:^|\b)(?:8|viii)(?:\b|$)/i.test(k) || (/8/i.test(k) && /smp/i.test(k))) return 'Kelas 8 SMP';
  if (/(?:^|\b)(?:9|ix)(?:\b|$)/i.test(k) || (/9/i.test(k) && /smp/i.test(k))) return 'Kelas 9 SMP';
  if (/(?:^|\b)(?:6|vi)(?:\b|$)/i.test(k) || (/6/i.test(k) && /sd/i.test(k))) return 'Kelas 6 SD';
  if (/(?:^|\b)(?:5|v)(?:\b|$)/i.test(k) || (/5/i.test(k) && /sd/i.test(k))) return 'Kelas 5 SD';
  if (/(?:^|\b)(?:4|iv)(?:\b|$)/i.test(k) || (/4/i.test(k) && /sd/i.test(k))) return 'Kelas 4 SD';
  if (/(?:^|\b)(?:12|xii)(?:\b|$)/i.test(k) || /snbt|utbk/i.test(k)) return 'Kelas 12 SMA / UTBK';
  if (/(?:^|\b)(?:11|xi)(?:\b|$)/i.test(k)) return 'Kelas 11 SMA';
  if (/(?:^|\b)(?:10|x)(?:\b|$)/i.test(k)) return 'Kelas 10 SMA';

  return k;
}

/**
 * Hitung kapasitas per kelas dan identifikasi kelas yang crowded (> 11 siswa).
 */
export function hitungKapasitasSemuaKelas(students = [], kapasitasIdeal = 11) {
  const grupMap = new Map();

  students.forEach((s) => {
    // Saring siswa aktif (jika ada status tidak aktif / alumni bisa dikecualikan bila diinginkan)
    const tingkat = ekstrakTingkatKelas(s);
    if (!grupMap.has(tingkat)) {
      grupMap.set(tingkat, {
        namaKelas: tingkat,
        siswaList: [],
        totalSiswa: 0,
        totalSpp: 0,
      });
    }
    const item = grupMap.get(tingkat);
    item.siswaList.push(s);
    item.totalSiswa += 1;
    item.totalSpp += parseInt(s.paketHargaBulanan || s.totalBayar || 0, 10) || 0;
  });

  const hasil = Array.from(grupMap.values()).map((g) => {
    const isCrowded = g.totalSiswa > kapasitasIdeal;
    const isMendekati = g.totalSiswa === kapasitasIdeal || g.totalSiswa === kapasitasIdeal - 1;
    const kelebihan = Math.max(0, g.totalSiswa - kapasitasIdeal);
    const rataSpp = g.totalSiswa > 0 ? Math.round(g.totalSpp / g.totalSiswa) : 350000;

    return {
      ...g,
      kapasitasIdeal,
      isCrowded,
      isMendekati,
      status: isCrowded ? 'crowded' : isMendekati ? 'mendekati' : 'optimal',
      kelebihan,
      rataSpp: rataSpp > 50000 ? rataSpp : 350000,
    };
  });

  // Urutkan kelas dari yang paling crowded ke bawah
  hasil.sort((a, b) => b.totalSiswa - a.totalSiswa);
  return hasil;
}

/**
 * Decision Engine: Simulasi dampak pemecahan kelas menjadi 2 (Kelas A & Kelas B).
 */
export function simulasiPecahKelas(kelasItem, params = {}) {
  const totalSiswa = kelasItem?.totalSiswa || 0;
  const sppPerSiswa = Number(params.sppPerBulan) || kelasItem?.rataSpp || 350000;
  const honorPerSesi = Number(params.honorPerSesi) || 65000;
  const sesiPerMinggu = Number(params.sesiPerMinggu) || 3;
  const sesiPerBulan = sesiPerMinggu * 4;

  // 1. Kondisi 1 Kelas (Saat Ini)
  const pendapatanBulanan = totalSiswa * sppPerSiswa;
  const biayaGuru1Kelas = honorPerSesi * sesiPerBulan;
  const profit1Kelas = pendapatanBulanan - biayaGuru1Kelas;
  const margin1Kelas = pendapatanBulanan > 0 ? Math.round((profit1Kelas / pendapatanBulanan) * 100) : 0;

  // 2. Kondisi Dipecah 2 Kelas (Kelas A & B)
  const siswaKelasA = Math.ceil(totalSiswa / 2);
  const siswaKelasB = Math.floor(totalSiswa / 2);
  const biayaGuru2Kelas = honorPerSesi * sesiPerBulan * 2;
  const tambahanBiayaGuru = biayaGuru2Kelas - biayaGuru1Kelas;
  const profit2Kelas = pendapatanBulanan - biayaGuru2Kelas;
  const margin2Kelas = pendapatanBulanan > 0 ? Math.round((profit2Kelas / pendapatanBulanan) * 100) : 0;
  const penurunanProfit = profit1Kelas - profit2Kelas;

  // 3. Titik Impas (BEP) Pemecahan Kelas
  // Berapa siswa tambahan yang dibutuhkan agar profit sama dengan sebelum dipecah?
  const bepSiswaBaru = sppPerSiswa > 0 ? Math.ceil(tambahanBiayaGuru / sppPerSiswa) : 2;
  const targetTotalSiswaAman = totalSiswa + bepSiswaBaru;

  // 4. Rekomendasi Keputusan
  let rekomendasi = '';
  let statusKeputusan = 'tahan'; // 'pecah_sekarang' | 'tahan' | 'prioritas_urgent'

  if (totalSiswa >= 15) {
    statusKeputusan = 'prioritas_urgent';
    rekomendasi = `Sangat disarankan SEGERA DIPECAH menjadi 2 kelas (${siswaKelasA} & ${siswaKelasB} anak). Jumlah siswa saat ini (${totalSiswa} anak) sudah cukup kuat menopang penambahan biaya honor guru (+${rp(tambahanBiayaGuru)}/bln) dan kelas akan kembali kondusif dengan margin profit ${margin2Kelas}%.`;
  } else if (totalSiswa >= 13) {
    statusKeputusan = 'pecah_sekarang';
    rekomendasi = `Kelas sudah cukup matang untuk dipecah (${siswaKelasA} & ${siswaKelasB} anak). Margin profit saat ini jika dipecah adalah ${margin2Kelas}% (turun ${margin1Kelas - margin2Kelas}%). Tambahkan minimal ${Math.max(1, targetTotalSiswaAman - totalSiswa)} siswa baru lagi agar profit bimbel kembali setara dengan sebelum dipecah.`;
  } else if (totalSiswa > 11) {
    statusKeputusan = 'tahan';
    rekomendasi = `Posisi crowded (${totalSiswa} anak). Jika langsung dipecah sekarang, profit bersih kelas akan menyusut sebesar ${rp(penurunanProfit)}/bulan (margin anjlok dari ${margin1Kelas}% ke ${margin2Kelas}%). REKOMENDASI MANAJEMEN: Tahan pemecahan sementara, berlakukan tata tertib kelas yang ketat / asisten tentor, dan targetkan menjaring minimal ${bepSiswaBaru} pendaftar baru lagi (hingga total minimal ${targetTotalSiswaAman} siswa) sebelum resmi membagi kelas A & B.`;
  } else {
    statusKeputusan = 'optimal';
    rekomendasi = `Kapasitas kelas masih ideal (${totalSiswa}/${kelasItem?.kapasitasIdeal || 11} anak). Tidak perlu dipecah. Fokus maksimalkan kepuasan belajar dan kehadiran siswa.`;
  }

  return {
    namaKelas: kelasItem?.namaKelas || 'Kelas',
    totalSiswa,
    sppPerSiswa,
    honorPerSesi,
    sesiPerMinggu,
    sesiPerBulan,
    // Finansial 1 Kelas
    pendapatanBulanan,
    biayaGuru1Kelas,
    profit1Kelas,
    margin1Kelas,
    // Finansial 2 Kelas
    siswaKelasA,
    siswaKelasB,
    biayaGuru2Kelas,
    tambahanBiayaGuru,
    profit2Kelas,
    margin2Kelas,
    penurunanProfit,
    // BEP & Rekomendasi
    bepSiswaBaru,
    targetTotalSiswaAman,
    statusKeputusan,
    rekomendasi,
  };
}

/**
 * Deteksi seluruh sesi mengajar di teacher_logs yang belum dibukukan ke finance_logs.
 */
export function deteksiGajiTentorBelumDibukukan(teacherLogs = []) {
  const belumDibayar = [];
  const perGuruMap = new Map();

  teacherLogs.forEach((log) => {
    // Sesi valid yang belum berstatus Lunas
    const isValid = String(log.status || '').toLowerCase().includes('valid') || log.status === 'Valid / Sudah Terekap';
    const isLunas = String(log.statusDibayar || '').toLowerCase() === 'lunas';

    if (isValid && !isLunas) {
      belumDibayar.push(log);
      const nama = log.namaGuru || 'Tentor Bimbel';
      if (!perGuruMap.has(nama)) {
        perGuruMap.set(nama, {
          namaGuru: nama,
          teacherId: log.teacherId || '',
          totalSesi: 0,
          totalNominal: 0,
          logIds: [],
          bulanSet: new Set(),
        });
      }
      const g = perGuruMap.get(nama);
      g.totalSesi += 1;
      g.totalNominal += parseInt(log.nominal || 0, 10) || 0;
      g.logIds.push(log.id);
      if (log.tanggal) {
        g.bulanSet.add(String(log.tanggal).slice(0, 7));
      }
    }
  });

  const daftarPerGuru = Array.from(perGuruMap.values()).map((g) => ({
    ...g,
    daftarBulan: Array.from(g.bulanSet).sort(),
  }));

  daftarPerGuru.sort((a, b) => b.totalNominal - a.totalNominal);

  const totalHutang = belumDibayar.reduce((acc, curr) => acc + (parseInt(curr.nominal || 0, 10) || 0), 0);

  return {
    totalSesiBelumDibayar: belumDibayar.length,
    totalHutangHonor: totalHutang,
    daftarBelumDibayar: belumDibayar,
    daftarPerGuru,
    adaKebocoranPengeluaran: totalHutang > 0,
  };
}

/**
 * Hitung posisi finansial riil (Real Net Cashflow & Profit) tanpa data mengarang.
 */
export function hitungFinansialRiil(financeLogs = [], teacherLogs = []) {
  let kasMasuk = 0;
  let kasKeluarTerbuku = 0;
  let honorTerbuku = 0;

  financeLogs.forEach((log) => {
    const amount = parseInt(log.amount || 0, 10) || 0;
    if (log.type === 'Pemasukan') {
      kasMasuk += amount;
    } else if (log.type === 'Pengeluaran') {
      kasKeluarTerbuku += amount;
      if (String(log.category || '').toLowerCase().includes('gaji')) {
        honorTerbuku += amount;
      }
    }
  });

  const auditHonor = deteksiGajiTentorBelumDibukukan(teacherLogs);

  // Total biaya operasional sebenarnya = pengeluaran yang sudah dicatat + gaji guru yang belum sempat dibukukan
  const pengeluaranRiilKomprehensif = kasKeluarTerbuku + auditHonor.totalHutangHonor;
  const netProfitRiil = kasMasuk - pengeluaranRiilKomprehensif;
  const netProfitMargin = kasMasuk > 0 ? Math.round((netProfitRiil / kasMasuk) * 100) : 0;

  return {
    kasMasuk,
    kasKeluarTerbuku,
    honorTerbuku,
    honorBelumDibukukan: auditHonor.totalHutangHonor,
    sesiHonorBelumDibukukan: auditHonor.totalSesiBelumDibayar,
    pengeluaranRiilKomprehensif,
    netProfitRiil,
    netProfitMargin,
    auditHonor,
  };
}

/**
 * Buat File Excel (.xlsx) Multi-Sheet Laporan Besar Eksekutif.
 */
export function unduhLaporanBesarExcel({
  finansialRiil,
  kapasitasKelas,
  guruList,
  teacherLogs,
  students,
  namaFile = 'Laporan_Besar_Manajemen_Gemilang',
}) {
  const wb = XLSX.utils.book_new();

  // SHEET 1: RINGKASAN EKSEKUTIF
  const sheetRingkasan = [
    ['LAPORAN EKSEKUTIF MANAJEMEN BIMBEL GEMILANG'],
    ['Tanggal Generate:', new Date().toLocaleString('id-ID')],
    [],
    ['METRIK KEUANGAN RIIL', 'NOMINAL (RUPIAH)'],
    ['Total Pemasukan Kas Riil (Inflow)', finansialRiil.kasMasuk],
    ['Pengeluaran Operasional Terbuku di Kasir', finansialRiil.kasKeluarTerbuku],
    ['Honor Tentor Sudah Dibukukan', finansialRiil.honorTerbuku],
    ['Honor Tentor Belum Dibukukan (Kewajiban 2 Bulan)', finansialRiil.honorBelumDibukukan],
    ['Total Pengeluaran Riil Sebenarnya', finansialRiil.pengeluaranRiilKomprehensif],
    ['NET PROFIT BERSIH RIIL', finansialRiil.netProfitRiil],
    ['Net Profit Margin Riil (%)', `${finansialRiil.netProfitMargin}%`],
    [],
    ['METRIK SISWA & OPERASIONAL', 'KETERANGAN'],
    ['Total Siswa Terdaftar', students.length],
    ['Jumlah Kelas Terbuka', kapasitasKelas.length],
    ['Jumlah Kelas Crowded (>11 Siswa)', kapasitasKelas.filter((k) => k.isCrowded).length],
    ['Jumlah Tentor Aktif', guruList.length],
  ];
  const ws1 = XLSX.utils.aoa_to_sheet(sheetRingkasan);
  ws1['!cols'] = [{ wch: 45 }, { wch: 25 }];
  XLSX.utils.book_append_sheet(wb, ws1, 'Ringkasan Eksekutif');

  // SHEET 2: DATA GURU & REKAP HONOR
  const rowsGuru = [
    ['REKAPITULASI TENTOR & HONOR MENGAJAR'],
    ['No', 'Nama Tentor', 'Total Sesi', 'Estimasi Sesi/Minggu', 'Total Honor', 'Status Honor', 'Keterangan'],
  ];

  // Agregasi log per guru
  const rekapGuruMap = new Map();
  teacherLogs.forEach((l) => {
    const nama = l.namaGuru || 'Tentor';
    if (!rekapGuruMap.has(nama)) {
      rekapGuruMap.set(nama, { nama, sesi: 0, nominal: 0, lunas: 0, pending: 0 });
    }
    const r = rekapGuruMap.get(nama);
    r.sesi += 1;
    r.nominal += parseInt(l.nominal || 0, 10) || 0;
    if (String(l.statusDibayar || '').toLowerCase() === 'lunas') {
      r.lunas += parseInt(l.nominal || 0, 10) || 0;
    } else {
      r.pending += parseInt(l.nominal || 0, 10) || 0;
    }
  });

  let noG = 1;
  rekapGuruMap.forEach((v) => {
    rowsGuru.push([
      noG++,
      v.nama,
      v.sesi,
      (v.sesi / 4).toFixed(1),
      v.nominal,
      v.pending > 0 ? `Belum Dibukukan: ${rp(v.pending)}` : 'Lunas',
      v.pending > 0 ? '⚠️ Butuh Pembukuan' : '✓ Aman',
    ]);
  });
  const ws2 = XLSX.utils.aoa_to_sheet(rowsGuru);
  ws2['!cols'] = [{ wch: 6 }, { wch: 28 }, { wch: 14 }, { wch: 20 }, { wch: 18 }, { wch: 28 }, { wch: 20 }];
  XLSX.utils.book_append_sheet(wb, ws2, 'Data Guru & Gaji');

  // SHEET 3: KAPASITAS & SIMULASI PECAH KELAS
  const rowsKelas = [
    ['ANALISIS KAPASITAS KELAS & KELAS CROWDED (IDEAL: 11 ANAK)'],
    ['Nama Tingkat/Kelas', 'Jumlah Siswa', 'Kapasitas Ideal', 'Status Ruang', 'Pendapatan SPP (1 Kelas)', 'Biaya Guru (1 Kelas)', 'Biaya Guru (Jika Dipecah A/B)', 'Profit 1 Kelas', 'Profit Jika Dipecah 2 Kelas', 'Selisih Penurunan Profit', 'BEP Siswa Tambahan', 'Rekomendasi Manajemen'],
  ];

  kapasitasKelas.forEach((k) => {
    const sim = simulasiPecahKelas(k);
    rowsKelas.push([
      k.namaKelas,
      k.totalSiswa,
      k.kapasitasIdeal,
      k.status.toUpperCase(),
      sim.pendapatanBulanan,
      sim.biayaGuru1Kelas,
      sim.biayaGuru2Kelas,
      sim.profit1Kelas,
      sim.profit2Kelas,
      sim.penurunanProfit,
      sim.bepSiswaBaru,
      sim.rekomendasi,
    ]);
  });
  const ws3 = XLSX.utils.aoa_to_sheet(rowsKelas);
  ws3['!cols'] = [{ wch: 20 }, { wch: 14 }, { wch: 16 }, { wch: 16 }, { wch: 24 }, { wch: 22 }, { wch: 26 }, { wch: 20 }, { wch: 24 }, { wch: 24 }, { wch: 20 }, { wch: 60 }];
  XLSX.utils.book_append_sheet(wb, ws3, 'Simulasi Pecah Kelas');

  // SHEET 4: DATA SISWA & PEMASUKAN
  const rowsSiswa = [
    ['REKAP DATA SISWA AKTIF & NILAI TRANSAKSI'],
    ['No', 'Nama Siswa', 'Tingkat/Kelas', 'Program', 'Total Tagihan', 'Total Bayar', 'Sisa Piutang', 'Status'],
  ];
  students.forEach((s, idx) => {
    const sisa = (parseInt(s.totalTagihan || 0, 10) || 0) - (parseInt(s.totalBayar || 0, 10) || 0);
    rowsSiswa.push([
      idx + 1,
      s.nama || '-',
      ekstrakTingkatKelas(s),
      s.program || 'Reguler',
      parseInt(s.totalTagihan || 0, 10) || 0,
      parseInt(s.totalBayar || 0, 10) || 0,
      sisa,
      sisa <= 0 ? 'Lunas' : 'Belum Lunas',
    ]);
  });
  const ws4 = XLSX.utils.aoa_to_sheet(rowsSiswa);
  ws4['!cols'] = [{ wch: 6 }, { wch: 28 }, { wch: 20 }, { wch: 18 }, { wch: 18 }, { wch: 18 }, { wch: 18 }, { wch: 14 }];
  XLSX.utils.book_append_sheet(wb, ws4, 'Data Siswa & Pemasukan');

  // Simpan File
  XLSX.writeFile(wb, `${namaFile}_${new Date().toISOString().slice(0, 10)}.xlsx`);
}

/**
 * Buat Prompt Konsultasi AI (ChatGPT, Claude, Gemini) untuk bahan diskusi owner.
 */
export function buatPromptKonsultasiAi({ finansialRiil, kapasitasKelas, kelasTargetCrowded = 'Kelas 7 SMP' }) {
  const targetKelas = kapasitasKelas.find((k) => k.namaKelas.includes('7')) || kapasitasKelas[0];
  const sim = simulasiPecahKelas(targetKelas);

  return `### BRIEFING STRATEGIS BISNIS BIMBEL GEMILANG
Halo AI, saya adalah owner / pimpinan Bimbel Gemilang. Saya memerlukan analisis objektif dan rekomendasi manajemen berdasarkan data faktual bimbel saya saat ini:

#### 1. KONDISI KEUANGAN RIIL SAAT INI
- Total Pemasukan Kas: ${rp(finansialRiil.kasMasuk)}
- Pengeluaran Operasional Terbuku: ${rp(finansialRiil.kasKeluarTerbuku)}
- Kewajiban Honor Tentor Belum Dibukukan (2 Bulan): ${rp(finansialRiil.honorBelumDibukukan)} (${finansialRiil.sesiHonorBelumDibukukan} sesi)
- Pengeluaran Riil Komprehensif: ${rp(finansialRiil.pengeluaranRiilKomprehensif)}
- Net Profit Bersih Riil: ${rp(finansialRiil.netProfitRiil)} (Margin: ${finansialRiil.netProfitMargin}%)

#### 2. KASUS KELAS CROWDED (${targetKelas?.namaKelas || 'Kelas 7'})
- Kapasitas Ideal Ruang Kelas Kami: ${targetKelas?.kapasitasIdeal || 11} anak
- Jumlah Siswa Saat Ini: ${targetKelas?.totalSiswa || 0} anak (Status: ${targetKelas?.status?.toUpperCase() || 'CROWDED'})
- Estimasi SPP per Siswa: ${rp(sim.sppPerSiswa)} / bulan
- Tarif Honor Tentor: ${rp(sim.honorPerSesi)} / sesi (${sim.sesiPerMinggu} sesi/minggu = ${sim.sesiPerBulan} sesi/bulan)

#### 3. DILEMA PECAH KELAS (SPLIT 7A & 7B)
- Jika tetap 1 Kelas:
  * Pendapatan SPP: ${rp(sim.pendapatanBulanan)} / bulan
  * Biaya Honor Guru: ${rp(sim.biayaGuru1Kelas)} / bulan
  * Profit Bersih Kelas: ${rp(sim.profit1Kelas)} / bulan (Margin: ${sim.margin1Kelas}%)
- Jika Dipecah Menjadi 2 Kelas (${sim.siswaKelasA} & ${sim.siswaKelasB} anak):
  * Biaya Honor Guru melonjak 2x lipat menjadi: ${rp(sim.biayaGuru2Kelas)} / bulan (+${rp(sim.tambahanBiayaGuru)})
  * Profit Bersih Kelas menyusut menjadi: ${rp(sim.profit2Kelas)} / bulan (Margin turun ke ${sim.margin2Kelas}%)
  * Penurunan Profit Riil: -${rp(sim.penurunanProfit)} / bulan
- Break-Even Point (BEP) Siswa: Butuh minimal ${sim.bepSiswaBaru} siswa baru (total ${sim.targetTotalSiswaAman} siswa) agar pemecahan kelas tidak menggerus profit.

#### PERTANYAAN STRATEGIS UNTUK DISKUSI:
1. Menurut Anda, apakah saya harus memecah kelas sekarang atau menunggu hingga terkumpul ${sim.targetTotalSiswaAman} siswa?
2. Bagaimana strategi penanganan kelas crowded sementara (psikologi belajar, tata tertib, reward/konsekuensi) agar siswa dan orang tua tidak komplain sebelum kelas dipecah?
3. Apa opsi kompromi operasional (misal jadwal tandem, asisten tentor, atau penyesuaian durasi sesi) agar kualitas belajar terjaga tanpa membengkakkan biaya guru 2x lipat?`;
}
