// src/pages/admin/owner/keuanganOwnerUtils.js
// 🔥 MODUL BARU: semua perhitungan keuangan Portal Owner dikumpulkan di
// sini sebagai fungsi murni (pure functions) -- biar angka di tab
// "Posisi Real-time", "Semua Transaksi", "Analisis", dan "Neraca"
// DIJAMIN konsisten satu sama lain (satu sumber kebenaran), dan biar
// gampang dipakai ulang oleh pembuat laporan PDF/Excel.
//
// Aturan main yang DIPERTAHANKAN dari perbaikan bug saldo kembar (PR #89):
// - Pemasukan method 'Cicilan' = KOMITMEN perpanjangan yang uangnya
//   BELUM diterima -> TIDAK pernah dihitung sebagai kas. Tiap cicilan
//   yang beneran dibayar nanti dicatat lagi sebagai Pemasukan
//   Tunai/Transfer, dan itulah yang masuk kas.
// - Method kosong/aneh (data lama) masuk ember "tanpaMetode" -- tetap
//   dihitung ke total kas tapi ditampilkan TERPISAH.
// - Semua tanggal memakai waktu LOKAL perangkat (WIB), bukan UTC.

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

// ==================== HELPERS TANGGAL & FORMAT ====================

export const NAMA_BULAN = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
export const NAMA_BULAN_PENDEK = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun',
  'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];

export const tanggalLokalHariIni = () => keyTanggalDariDate(new Date());

export const keyTanggalDariDate = (d) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

export const keyBulanDariDate = (d) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;

export const keyBulanIni = () => keyBulanDariDate(new Date());

export const namaBulanDariKey = (key) => {
  const [y, m] = String(key || '').split('-');
  const idx = parseInt(m, 10) - 1;
  if (idx < 0 || idx > 11) return key || '-';
  return `${NAMA_BULAN[idx]} ${y}`;
};

export const tambahHari = (tanggalStr, n) => {
  const d = new Date(`${tanggalStr}T00:00:00`);
  d.setDate(d.getDate() + n);
  return keyTanggalDariDate(d);
};

export const rpFmt = (n) => 'Rp ' + Math.round(n || 0).toLocaleString('id-ID');
export const angkaFmt = (n) => Math.round(n || 0).toLocaleString('id-ID');

export const formatWaktu = (ms) => {
  if (!ms) return '-';
  const d = new Date(ms);
  return d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
};

// Daftar bulan 'YYYY-MM' untuk satu tahun. Kalau tahunnya tahun berjalan,
// berhenti di bulan sekarang -- bulan depan belum terjadi, gak boleh
// ikut dihitung (apalagi pendapatan akrual yang memproyeksikan jasa).
export const daftarBulanTahun = (tahun, batasKey = null) => {
  const keys = [];
  for (let m = 1; m <= 12; m++) {
    const k = `${tahun}-${String(m).padStart(2, '0')}`;
    if (batasKey && k > batasKey) break;
    keys.push(k);
  }
  return keys;
};

// 12 bulan terakhir berurutan (termasuk bulan berjalan).
export const daftar12BulanTerakhir = (sampaiKey) => {
  const [y, m] = String(sampaiKey).split('-').map(v => parseInt(v, 10));
  const keys = [];
  for (let i = 11; i >= 0; i--) {
    const d = new Date(y, m - 1 - i, 1);
    keys.push(keyBulanDariDate(d));
  }
  return keys;
};

// ==================== NORMALISASI DATA FIRESTORE ====================

// Buka data dari berbagai bentuk: doc Firestore (data = fungsi),
// objek {id, data}, atau objek data polos -- biar aman dipakai di mana saja.
const bukaData = (d) => {
  if (typeof d?.data === 'function') return d.data();
  if (d?.data && typeof d.data === 'object') return d.data;
  return d || {};
};

export const normalisasiLog = (d) => {
  const data = bukaData(d);
  const methodAsli = data.method || '';
  return {
    id: d.id || '',
    type: data.type === 'Pemasukan' ? 'Pemasukan' : 'Pengeluaran',
    date: typeof data.date === 'string' ? data.date : '',
    category: data.category || 'Lainnya',
    amount: parseInt(data.amount || 0) || 0,
    methodAsli,
    // Ember tampilan: cuma 3 metode resmi + 'Lainnya' buat data lama.
    method: ['Tunai', 'Transfer', 'Cicilan'].includes(methodAsli) ? methodAsli : 'Lainnya',
    note: data.note || '',
    namaSiswa: data.namaSiswa || '',
    createdAtMs: data.createdAt?.toMillis?.() || (typeof data.createdAt === 'number' ? data.createdAt : 0),
  };
};

export const normalisasiStudent = (d) => ({ id: d.id, ...bukaData(d) });

export const normalisasiTagihan = (d) => ({ id: d.id, ...bukaData(d) });

export const normalisasiTeacherLog = (d) => {
  const data = bukaData(d);
  return {
    tanggal: String(data.tanggal || '').split(' ')[0],
    nominal: parseInt(data.nominal || 0) || 0,
  };
};

export const urutTanggalTerbaru = (a, b) =>
  String(b.date).localeCompare(String(a.date)) || (b.createdAtMs - a.createdAtMs);

// ==================== SALDO KAS (aturan PR #89) ====================

// Ember kas: Tunai -> kas tunai, Transfer -> bank, Cicilan -> BUKAN kas
// (cuma komitmen), lainnya -> 'tanpaMetode' (data lama, tetap dihitung
// ke total tapi ditampilkan terpisah).
export const hitungSaldo = (logs) => {
  let tunai = 0, bank = 0, tanpaMetode = 0, komitmenCicilan = 0;
  for (const l of logs) {
    const signed = l.type === 'Pemasukan' ? l.amount : -l.amount;
    if (l.methodAsli === 'Tunai') tunai += signed;
    else if (l.methodAsli === 'Transfer') bank += signed;
    else if (l.methodAsli === 'Cicilan') {
      if (l.type === 'Pemasukan') komitmenCicilan += l.amount;
    } else tanpaMetode += signed;
  }
  return { tunai, bank, tanpaMetode, komitmenCicilan, total: tunai + bank + tanpaMetode };
};

// Saldo kas per tanggal acuan (buat neraca "per 31 Desember" dsb).
// Log tanpa tanggal dianggap data lama -> selalu ikut.
export const hitungSaldoPerTanggal = (logs, tanggalAcuan) =>
  hitungSaldo(logs.filter(l => !l.date || l.date <= tanggalAcuan));

// ==================== AGREGASI PER BULAN & PERIODE ====================

export const agregatBulanan = (logs) => {
  const map = new Map();
  for (const l of logs) {
    const key = (l.date || '').slice(0, 7) || 'tanpa-tanggal';
    if (!map.has(key)) {
      map.set(key, {
        bulan: key, masuk: 0, keluar: 0, netto: 0, komitmen: 0, jumlah: 0,
        masukTunai: 0, masukTransfer: 0, masukLain: 0,
        perKategoriMasuk: {}, perKategoriKeluar: {},
      });
    }
    const a = map.get(key);
    a.jumlah += 1;
    if (l.type === 'Pemasukan') {
      if (l.methodAsli === 'Cicilan') {
        a.komitmen += l.amount;
      } else {
        a.masuk += l.amount;
        if (l.methodAsli === 'Tunai') a.masukTunai += l.amount;
        else if (l.methodAsli === 'Transfer') a.masukTransfer += l.amount;
        else a.masukLain += l.amount;
        a.perKategoriMasuk[l.category] = (a.perKategoriMasuk[l.category] || 0) + l.amount;
      }
    } else {
      a.keluar += l.amount;
      a.perKategoriKeluar[l.category] = (a.perKategoriKeluar[l.category] || 0) + l.amount;
    }
    a.netto = a.masuk - a.keluar;
  }
  return map;
};

// Ringkasan basis KAS untuk periode (daftar bulan 'YYYY-MM').
// null = seluruh waktu.
export const ringkasKas = (logs, bulanKeys) => {
  const set = bulanKeys ? new Set(bulanKeys) : null;
  const hasil = {
    masuk: 0, keluar: 0, netto: 0, komitmen: 0, jumlah: 0,
    masukTunai: 0, masukTransfer: 0, masukLain: 0,
    keluarTunai: 0, keluarTransfer: 0, keluarLain: 0,
    perKategoriMasuk: {}, perKategoriKeluar: {},
  };
  for (const l of logs) {
    if (set && !set.has((l.date || '').slice(0, 7))) continue;
    hasil.jumlah += 1;
    if (l.type === 'Pemasukan') {
      if (l.methodAsli === 'Cicilan') { hasil.komitmen += l.amount; continue; }
      hasil.masuk += l.amount;
      if (l.methodAsli === 'Tunai') hasil.masukTunai += l.amount;
      else if (l.methodAsli === 'Transfer') hasil.masukTransfer += l.amount;
      else hasil.masukLain += l.amount;
      hasil.perKategoriMasuk[l.category] = (hasil.perKategoriMasuk[l.category] || 0) + l.amount;
    } else {
      hasil.keluar += l.amount;
      if (l.methodAsli === 'Tunai') hasil.keluarTunai += l.amount;
      else if (l.methodAsli === 'Transfer') hasil.keluarTransfer += l.amount;
      else hasil.keluarLain += l.amount;
      hasil.perKategoriKeluar[l.category] = (hasil.perKategoriKeluar[l.category] || 0) + l.amount;
    }
  }
  hasil.netto = hasil.masuk - hasil.keluar;
  return hasil;
};

export const kategoriJadiArray = (obj) =>
  Object.entries(obj || {})
    .map(([nama, nilai]) => ({ nama, nilai }))
    .sort((a, b) => b.nilai - a.nilai);

// ==================== AKRUAL: "PROFIT SESUNGGUHNYA" ====================
// Konsep yang sama persis dengan halaman owner sebelumnya: pendapatan
// yang "kepake" (jasa sudah/sedang diajarkan) dikurangi honor guru,
// biaya tetap, dan penyusutan -- bukan sekadar kas masuk.

export const biayaBulananDariSettings = (settings) => {
  const fixedCosts = settings?.fixedCosts || [];
  const assets = settings?.assets || [];
  const totalFixed = fixedCosts.reduce((s, f) => s + (parseInt(f.amountPerMonth) || 0), 0);
  const totalPenyusutan = assets.reduce((s, a) => {
    const bulan = parseInt(a.usefulLifeMonths) || 0;
    return s + (bulan > 0 ? Math.round((parseInt(a.purchasePrice) || 0) / bulan) : 0);
  }, 0);
  return { totalFixed, totalPenyusutan, fixedCosts, assets };
};

export const pendapatanKepakeBulan = (students, bulanKey) => {
  let total = 0, jumlah = 0;
  for (const s of students) {
    const mulai = s.tanggalMulai ? new Date(s.tanggalMulai) : null;
    const selesai = s.tanggalSelesai ? new Date(s.tanggalSelesai) : null;
    const nilai = parseInt(s.paketHargaBulanan || 0) || 0;
    if (!mulai || !selesai || !nilai) continue;
    const mulaiBulan = mulai.toISOString().slice(0, 7);
    const selesaiBulan = selesai.toISOString().slice(0, 7);
    if (mulaiBulan <= bulanKey && selesaiBulan >= bulanKey) {
      total += nilai;
      jumlah += 1;
    }
  }
  return { total, jumlah };
};

export const hppBulan = (teacherLogs, bulanKey) => {
  let total = 0;
  for (const t of teacherLogs) {
    if (t.tanggal && t.tanggal.startsWith(bulanKey)) total += t.nominal;
  }
  return total;
};

// Laba rugi akrual untuk satu daftar bulan. Catatan jujur: biaya tetap &
// penyusutan dihitung flat per bulan dari pengaturan SAAT INI (sistem
// tidak menyimpan riwayat perubahan pengaturan).
export const labaRugiAkrual = (ctx, bulanKeys) => {
  const { students, teacherLogs, settings } = ctx;
  const { totalFixed, totalPenyusutan } = biayaBulananDariSettings(settings);
  let pendapatan = 0, hpp = 0, siswaAktifTerbanyak = 0;
  const perBulan = bulanKeys.map(k => {
    const p = pendapatanKepakeBulan(students, k);
    const h = hppBulan(teacherLogs, k);
    pendapatan += p.total;
    hpp += h;
    if (p.jumlah > siswaAktifTerbanyak) siswaAktifTerbanyak = p.jumlah;
    return {
      bulan: k, pendapatan: p.total, siswaAktif: p.jumlah, hpp: h,
      fixed: totalFixed, penyusutan: totalPenyusutan,
      profit: p.total - h - totalFixed - totalPenyusutan,
    };
  });
  const n = bulanKeys.length || 1;
  const fixedTotal = totalFixed * n;
  const penyusutanTotal = totalPenyusutan * n;
  return {
    pendapatan, hpp, fixedTotal, penyusutanTotal,
    profit: pendapatan - hpp - fixedTotal - penyusutanTotal,
    perBulan, siswaAktifTerbanyak, totalFixed, totalPenyusutan, jumlahBulan: n,
  };
};

// ==================== ANALISIS SISWA (piutang, titipan, kewajiban) ====================
// Logika DISALIN PERSIS dari perhitungan OwnerFinance sebelumnya biar
// angkanya tidak berubah -- cuma dipindah jadi fungsi murni.

export const analisisSiswa = (students, now) => {
  const bulanIni = keyBulanDariDate(now);
  let totalPiutang = 0;
  let totalPendapatanKepake = 0;
  let totalKewajiban = 0;
  let aktifCount = 0;
  let totalSudahJadiHak = 0;
  let totalMasihTitipan = 0;
  const siswaDetail = [];
  const rinciPiutang = [];

  for (const d of students) {
    const s = d;
    const totalTagihan = parseInt(s.totalTagihan || 0);
    const totalBayar = parseInt(s.totalBayar || 0);
    const sisa = totalTagihan - totalBayar;
    if (sisa > 0) {
      totalPiutang += sisa;
      rinciPiutang.push({
        id: s.id, nama: s.nama || 'Siswa', sisa,
        status: s.status || '-', noHp: s.ortu?.hp || '',
      });
    }

    if (s.status === 'Aktif' && s.tanggalMulai && s.durasiBulan && totalBayar > 0) {
      const durasiBulan = parseInt(s.durasiBulan);
      const mulaiUtkHak = new Date(s.tanggalMulai);
      const bayarLunasDiDepan = (s.metodeBayar === 'Tunai' || s.metodeBayar === 'Transfer') && durasiBulan > 1;

      let sudahJadiHak, masihTitipan, bulanBerjalan;

      if (bayarLunasDiDepan) {
        let b = (now.getFullYear() - mulaiUtkHak.getFullYear()) * 12 + (now.getMonth() - mulaiUtkHak.getMonth());
        if (now.getDate() < mulaiUtkHak.getDate()) b -= 1;
        bulanBerjalan = Math.min(Math.max(b, 0), durasiBulan);
        const jatahPerBulan = totalBayar / durasiBulan;
        sudahJadiHak = Math.round(jatahPerBulan * bulanBerjalan);
        masihTitipan = totalBayar - sudahJadiHak;
      } else {
        bulanBerjalan = durasiBulan;
        sudahJadiHak = totalBayar;
        masihTitipan = 0;
      }

      totalSudahJadiHak += sudahJadiHak;
      totalMasihTitipan += masihTitipan;
      siswaDetail.push({
        id: s.id, nama: s.nama || 'Siswa', totalBayar, durasiBulan,
        bulanBerjalan, sudahJadiHak, masihTitipan, metodeBayar: s.metodeBayar || '-',
      });
    }

    const mulai = s.tanggalMulai ? new Date(s.tanggalMulai) : null;
    const selesai = s.tanggalSelesai ? new Date(s.tanggalSelesai) : null;
    const nilaiBulanan = parseInt(s.paketHargaBulanan || 0);
    if (!mulai || !selesai || !nilaiBulanan) continue;

    const mulaiBulan = mulai.toISOString().slice(0, 7);
    const selesaiBulan = selesai.toISOString().slice(0, 7);
    if (mulaiBulan <= bulanIni && selesaiBulan >= bulanIni) {
      totalPendapatanKepake += nilaiBulanan;
      aktifCount += 1;
    }

    const acuan = mulai > now ? mulai : now;
    if (selesai > acuan) {
      const bulanTersisa = (selesai.getFullYear() - acuan.getFullYear()) * 12 + (selesai.getMonth() - acuan.getMonth());
      if (bulanTersisa > 0) totalKewajiban += bulanTersisa * nilaiBulanan;
    }
  }

  rinciPiutang.sort((a, b) => b.sisa - a.sisa);
  siswaDetail.sort((a, b) => b.masihTitipan - a.masihTitipan);

  return {
    totalPiutang, rinciPiutang,
    totalKewajiban,
    totalPendapatanKepake, jumlahSiswaAktif: aktifCount,
    totalSudahJadiHak, totalMasihTitipan, siswaDetail,
  };
};

// ==================== JADWAL CICILAN (finance_tagihan) ====================

export const analisisTagihan = (tagihanList, hariIniStr) => {
  let belumDiterima = 0;
  let jumlahJadwal = 0;
  const rinci = [];
  for (const t of tagihanList) {
    const details = Array.isArray(t.detailCicilan) ? t.detailCicilan : [];
    for (const c of details) {
      if (c.status === 'Lunas') continue;
      const nominal = parseInt(c.nominal || 0) || 0;
      belumDiterima += nominal;
      jumlahJadwal += 1;
      rinci.push({
        namaSiswa: t.namaSiswa || 'Siswa',
        bulanKe: c.bulanKe || '-',
        nominal,
        jatuhTempo: c.jatuhTempo || '',
        telat: Boolean(c.jatuhTempo) && c.jatuhTempo < hariIniStr,
      });
    }
  }
  rinci.sort((a, b) => String(a.jatuhTempo).localeCompare(String(b.jatuhTempo)));
  const batas30 = tambahHari(hariIniStr, 30);
  const jatuhTempo30 = rinci.filter(r => r.jatuhTempo && r.jatuhTempo <= batas30);
  return { belumDiterima, jumlahJadwal, rinci, jatuhTempo30 };
};

// ==================== NERACA (BALANCE SHEET) ====================
// Aset = kas (tunai + bank + data lama) + piutang siswa.
// Kewajiban = titipan siswa (uang jasa sesi yang BELUM diajarkan).
// Ekuitas = Aset - Kewajiban (angka penyeimbang; modal awal pemilik
// tidak pernah dicatat terpisah di sistem -- dijelaskan di catatan).

export const bangunNeraca = ({ saldoPerAcuan, siswaInfo, tagihanInfo, logs, tanggalAcuan }) => {
  const asetKas = saldoPerAcuan.total;
  const piutang = siswaInfo.totalPiutang;
  const totalAset = asetKas + piutang;
  const titipan = siswaInfo.totalKewajiban;
  const ekuitas = totalAset - titipan;

  const kasSemua = ringkasKas(logs, null);
  return {
    tanggalAcuan,
    aset: {
      tunai: saldoPerAcuan.tunai,
      bank: saldoPerAcuan.bank,
      tanpaMetode: saldoPerAcuan.tanpaMetode,
      piutang,
      total: totalAset,
    },
    kewajiban: { titipan, total: titipan },
    ekuitas,
    memo: {
      komitmenCicilanBelumDiterima: tagihanInfo.belumDiterima,
      jumlahJadwalCicilan: tagihanInfo.jumlahJadwal,
      surplusKasSejakAwal: kasSemua.netto,
      totalMasukSejakAwal: kasSemua.masuk,
      totalKeluarSejakAwal: kasSemua.keluar,
    },
  };
};

// ==================== ARUS KAS TAHUNAN ====================

export const arusKasTahun = (logs, tahun) => {
  const awalTahun = `${tahun}-01-01`;
  const saldoAwal = hitungSaldo(logs.filter(l => !l.date || l.date < awalTahun));
  const agregat = agregatBulanan(logs);
  const perBulan = [];
  let berjalan = saldoAwal.total;
  let totalMasuk = 0, totalKeluar = 0, totalKomitmen = 0;
  for (let m = 1; m <= 12; m++) {
    const key = `${tahun}-${String(m).padStart(2, '0')}`;
    const a = agregat.get(key) || { masuk: 0, keluar: 0, komitmen: 0, jumlah: 0 };
    berjalan += a.masuk - a.keluar;
    totalMasuk += a.masuk;
    totalKeluar += a.keluar;
    totalKomitmen += a.komitmen;
    perBulan.push({
      bulan: key, masuk: a.masuk, keluar: a.keluar,
      netto: a.masuk - a.keluar, komitmen: a.komitmen, saldoAkhirBulan: berjalan,
    });
  }
  return {
    tahun,
    saldoAwal: saldoAwal.total,
    saldoAwalRinci: saldoAwal,
    totalMasuk, totalKeluar, totalKomitmen,
    netto: totalMasuk - totalKeluar,
    saldoAkhir: berjalan,
    perBulan,
  };
};

// ==================== PEMBANGUN LAPORAN LENGKAP ====================
// Satu objek laporan dipakai bersama oleh tampilan layar, PDF, Excel.

export const bangunLaporan = ({ logs, students, teacherLogs, settings, tagihanList, tanggalAcuan, periodeLabel, bulanKeys }) => {
  const now = new Date();
  const siswaInfo = analisisSiswa(students, now);
  const tagihanInfo = analisisTagihan(tagihanList, tanggalLokalHariIni());
  const saldoPerAcuan = hitungSaldoPerTanggal(logs, tanggalAcuan);
  const neraca = bangunNeraca({ saldoPerAcuan, siswaInfo, tagihanInfo, logs, tanggalAcuan });
  const kas = ringkasKas(logs, bulanKeys);
  const akrual = labaRugiAkrual({ students, teacherLogs, settings }, bulanKeys);
  const tahun = String(tanggalAcuan).slice(0, 4);
  const arusKas = arusKasTahun(logs, tahun);

  return {
    info: {
      dibuatPada: new Date().toLocaleString('id-ID'),
      periodeLabel,
      tanggalAcuan,
      tahun,
      bulanKeys,
    },
    saldoPerAcuan,
    neraca,
    kas,
    akrual,
    arusKas,
    siswaInfo,
    tagihanInfo,
  };
};

// ==================== EKSPOR: CSV / EXCEL / PDF ====================

const unduhBlob = (blob, namaFile) => {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = namaFile;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 2000);
};

const escCsv = (v) => {
  const s = String(v ?? '');
  return /[";\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

// CSV dipisah titik-koma -- format yang langsung kebaca rapi oleh Excel
// locale Indonesia tanpa perlu import wizard. BOM biar huruf tidak aneh.
export const unduhCSVTransaksi = (rows, namaFile) => {
  const header = ['Tanggal', 'Jenis', 'Kategori', 'Metode', 'Siswa', 'Nominal', 'Catatan'];
  const lines = [header.join(';')];
  for (const l of rows) {
    lines.push([
      l.date, l.type, l.category, l.methodAsli || '-', l.namaSiswa || '-',
      l.type === 'Pemasukan' ? l.amount : -l.amount, (l.note || '').replace(/\n/g, ' '),
    ].map(escCsv).join(';'));
  }
  const blob = new Blob(['\uFEFF' + lines.join('\r\n')], { type: 'text/csv;charset=utf-8;' });
  unduhBlob(blob, namaFile);
};

export const barisTransaksiExcel = (logs) => logs.map(l => ({
  Tanggal: l.date || '-',
  Jenis: l.type,
  Kategori: l.category,
  Metode: l.methodAsli || '(kosong)',
  Siswa: l.namaSiswa || '-',
  Nominal: l.type === 'Pemasukan' ? l.amount : -l.amount,
  Catatan: l.note || '',
}));

export const unduhExcelTransaksi = (logs, namaFile) => {
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(barisTransaksiExcel(logs));
  ws['!cols'] = [{ wch: 12 }, { wch: 12 }, { wch: 22 }, { wch: 10 }, { wch: 22 }, { wch: 14 }, { wch: 40 }];
  XLSX.utils.book_append_sheet(wb, ws, 'Transaksi');
  XLSX.writeFile(wb, namaFile);
};

const setLebarKolom = (ws, lebar) => { ws['!cols'] = lebar.map(w => ({ wch: w })); };

export const unduhExcelLaporan = (lap, transaksiLogs, namaFile) => {
  const wb = XLSX.utils.book_new();
  const { neraca, kas, akrual, arusKas, info, saldoPerAcuan, siswaInfo, tagihanInfo } = lap;

  // Sheet 1: Ringkasan
  const ringkasan = [
    ['LAPORAN KEUANGAN LENGKAP - BIMBEL GEMILANG'],
    ['Periode', info.periodeLabel],
    ['Posisi kas per tanggal', info.tanggalAcuan],
    ['File dibuat', info.dibuatPada],
    [],
    ['POSISI UANG (per tanggal acuan)', ''],
    ['Kas Tunai', saldoPerAcuan.tunai],
    ['Bank / Transfer', saldoPerAcuan.bank],
    ['Data lama tanpa metode', saldoPerAcuan.tanpaMetode],
    ['TOTAL KAS', saldoPerAcuan.total],
    [],
    ['RINGKASAN PERIODE (basis kas)', ''],
    ['Pemasukan diterima', kas.masuk],
    ['Pengeluaran', kas.keluar],
    ['Surplus / (Defisit) kas', kas.netto],
    ['Komitmen cicilan belum diterima (bukan kas)', kas.komitmen],
    [],
    ['PROFIT SESUNGGUHNYA (basis akrual)', ''],
    ['Pendapatan yang kepake', akrual.pendapatan],
    ['HPP - honor guru', akrual.hpp],
    ['Biaya tetap', akrual.fixedTotal],
    ['Penyusutan aset', akrual.penyusutanTotal],
    ['PROFIT BERSIH', akrual.profit],
    [],
    ['LAIN-LAIN', ''],
    ['Piutang siswa (belum dibayar)', siswaInfo.totalPiutang],
    ['Kewajiban belum terpenuhi (titipan siswa)', siswaInfo.totalKewajiban],
    ['Cicilan terjadwal belum diterima', tagihanInfo.belumDiterima],
  ];
  const wsRing = XLSX.utils.aoa_to_sheet(ringkasan);
  setLebarKolom(wsRing, [46, 24]);
  XLSX.utils.book_append_sheet(wb, wsRing, 'Ringkasan');

  // Sheet 2: Laba Rugi Kas (per kategori)
  const lrKas = [['LABA RUGI BASIS KAS - ' + info.periodeLabel], [], ['PEMASUKAN PER KATEGORI', '']];
  for (const k of kategoriJadiArray(kas.perKategoriMasuk)) lrKas.push([k.nama, k.nilai]);
  lrKas.push(['Total Pemasukan Diterima', kas.masuk], [], ['PENGELUARAN PER KATEGORI', '']);
  for (const k of kategoriJadiArray(kas.perKategoriKeluar)) lrKas.push([k.nama, k.nilai]);
  lrKas.push(['Total Pengeluaran', kas.keluar], [], ['SURPLUS / (DEFISIT) KAS', kas.netto]);
  const wsLr = XLSX.utils.aoa_to_sheet(lrKas);
  setLebarKolom(wsLr, [40, 18]);
  XLSX.utils.book_append_sheet(wb, wsLr, 'Laba Rugi Kas');

  // Sheet 3: Laba Rugi Akrual per bulan
  const lrAkr = [['LABA RUGI AKRUAL PER BULAN', '', '', '', '', '']];
  lrAkr.push(['Bulan', 'Pendapatan Kepake', 'HPP Guru', 'Biaya Tetap', 'Penyusutan', 'Profit']);
  for (const b of akrual.perBulan) {
    lrAkr.push([namaBulanDariKey(b.bulan), b.pendapatan, b.hpp, b.fixed, b.penyusutan, b.profit]);
  }
  lrAkr.push(['TOTAL', akrual.pendapatan, akrual.hpp, akrual.fixedTotal, akrual.penyusutanTotal, akrual.profit]);
  const wsAkr = XLSX.utils.aoa_to_sheet(lrAkr);
  setLebarKolom(wsAkr, [20, 20, 16, 16, 16, 18]);
  XLSX.utils.book_append_sheet(wb, wsAkr, 'Laba Rugi Akrual');

  // Sheet 4: Neraca
  const nRows = [
    ['NERACA PER ' + info.tanggalAcuan, ''],
    [],
    ['ASET', ''],
    ['Kas Tunai', neraca.aset.tunai],
    ['Bank / Transfer', neraca.aset.bank],
    ['Data lama tanpa metode', neraca.aset.tanpaMetode],
    ['Piutang Siswa', neraca.aset.piutang],
    ['TOTAL ASET', neraca.aset.total],
    [],
    ['KEWAJIBAN', ''],
    ['Titipan Siswa (sesi belum diajarkan)', neraca.kewajiban.titipan],
    ['TOTAL KEWAJIBAN', neraca.kewajiban.total],
    [],
    ['EKUITAS (Aset - Kewajiban)', neraca.ekuitas],
    [],
    ['CATATAN', ''],
    ['Komitmen cicilan belum diterima (di luar neraca)', neraca.memo.komitmenCicilanBelumDiterima],
    ['Surplus kas kumulatif sejak awal (info)', neraca.memo.surplusKasSejakAwal],
  ];
  const wsN = XLSX.utils.aoa_to_sheet(nRows);
  setLebarKolom(wsN, [46, 20]);
  XLSX.utils.book_append_sheet(wb, wsN, 'Neraca');

  // Sheet 5: Arus Kas bulanan
  const akRows = [['ARUS KAS ' + arusKas.tahun, '', '', '', '']];
  akRows.push(['Bulan', 'Kas Masuk', 'Kas Keluar', 'Netto', 'Saldo Akhir Bulan']);
  for (const b of arusKas.perBulan) {
    akRows.push([namaBulanDariKey(b.bulan), b.masuk, b.keluar, b.netto, b.saldoAkhirBulan]);
  }
  akRows.push(['Saldo awal tahun', arusKas.saldoAwal], ['TOTAL', arusKas.totalMasuk, arusKas.totalKeluar, arusKas.netto, arusKas.saldoAkhir]);
  const wsAk = XLSX.utils.aoa_to_sheet(akRows);
  setLebarKolom(wsAk, [20, 18, 18, 18, 20]);
  XLSX.utils.book_append_sheet(wb, wsAk, 'Arus Kas');

  // Sheet 6: Piutang per siswa
  const pRows = [['PIUTANG SISWA (tagihan belum lunas)'], ['Nama', 'Sisa Tagihan', 'Status']];
  for (const p of siswaInfo.rinciPiutang) pRows.push([p.nama, p.sisa, p.status]);
  pRows.push(['TOTAL', siswaInfo.totalPiutang, '']);
  const wsP = XLSX.utils.aoa_to_sheet(pRows);
  setLebarKolom(wsP, [30, 18, 12]);
  XLSX.utils.book_append_sheet(wb, wsP, 'Piutang');

  // Sheet 7: Jadwal cicilan belum diterima
  const cRows = [['CICILAN BELUM DITERIMA (jadwal di finance_tagihan)'], ['Nama Siswa', 'Cicilan Ke', 'Nominal', 'Jatuh Tempo', 'Kondisi']];
  for (const c of tagihanInfo.rinci) {
    cRows.push([c.namaSiswa, c.bulanKe, c.nominal, c.jatuhTempo || '-', c.telat ? 'TERLALAT' : 'Belum jatuh tempo']);
  }
  cRows.push(['TOTAL', '', tagihanInfo.belumDiterima, '', '']);
  const wsC = XLSX.utils.aoa_to_sheet(cRows);
  setLebarKolom(wsC, [30, 10, 16, 14, 18]);
  XLSX.utils.book_append_sheet(wb, wsC, 'Jadwal Cicilan');

  // Sheet 8: Semua transaksi periode
  const wsT = XLSX.utils.json_to_sheet(barisTransaksiExcel(transaksiLogs));
  wsT['!cols'] = [{ wch: 12 }, { wch: 12 }, { wch: 22 }, { wch: 10 }, { wch: 22 }, { wch: 14 }, { wch: 40 }];
  XLSX.utils.book_append_sheet(wb, wsT, 'Transaksi');

  XLSX.writeFile(wb, namaFile);
};

export const unduhPDFLaporan = (lap, namaFile) => {
  const doc = new jsPDF('p', 'mm', 'a4');
  const { neraca, kas, akrual, arusKas, info, saldoPerAcuan, siswaInfo, tagihanInfo } = lap;
  const KIRI = 14;
  const LEBAR = 182;
  const fmt = (n) => angkaFmt(n);

  // Kursor posisi Y manual -- lebih gampang dikontrol daripada
  // mengandalkan doc.lastAutoTable di setiap titik.
  let yNow = 36;
  const gantiHalamanJikaPerlu = (butuh) => {
    if (yNow + butuh > 280) { doc.addPage(); yNow = 18; }
  };
  const judulBagian = (teks) => {
    yNow += 9;
    gantiHalamanJikaPerlu(30);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11.5);
    doc.setTextColor(30, 41, 59);
    doc.text(teks, KIRI, yNow);
    yNow += 3;
  };
  const isBarisTebal = (teks) =>
    /^(TOTAL|EKUITAS|ASET|KEWAJIBAN|SURPLUS|DEFISIT|PROFIT|RUGI)/.test(String(teks || '').trim());
  const opsiTabel = () => ({
    startY: yNow,
    theme: 'grid',
    styles: { fontSize: 8.5, cellPadding: 1.8 },
    headStyles: { fillColor: [51, 65, 85], textColor: 255, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    footStyles: { fillColor: [30, 41, 59], textColor: 255, fontStyle: 'bold', fontSize: 8.5 },
    margin: { left: KIRI, right: 210 - KIRI - LEBAR, top: 18, bottom: 16 },
    didParseCell: (d) => {
      if (d.section !== 'body' && d.section !== 'foot') return;
      const teksSel = d.cell.text?.[0] ?? '';
      if (d.column.index === d.table.columns.length - 1) d.cell.styles.halign = 'right';
      if (d.section === 'body' && d.column.index === 0 && isBarisTebal(teksSel)) d.cell.styles.fontStyle = 'bold';
    },
  });
  const gambarTabel = (opts) => {
    autoTable(doc, opts);
    yNow = doc.lastAutoTable?.finalY ?? yNow;
  };
  const teksKecil = (teks) => {
    const lines = doc.splitTextToSize(teks, LEBAR);
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    doc.text(lines, KIRI, yNow + 4);
    yNow += 4 + lines.length * 3.2;
    doc.setTextColor(30, 41, 59);
  };

  // ===== Kop =====
  doc.setFillColor(30, 41, 59);
  doc.rect(0, 0, 210, 30, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.text('LAPORAN KEUANGAN LENGKAP', KIRI, 13);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('Bimbel Gemilang - Portal Owner', KIRI, 20);
  doc.text(`Periode: ${info.periodeLabel}   |   Posisi kas per: ${info.tanggalAcuan}`, KIRI, 26);
  doc.setTextColor(30, 41, 59);

  // ===== 1. Posisi Uang =====
  judulBagian('1. POSISI UANG (per ' + info.tanggalAcuan + ')');
  const bodySaldo = [
    ['Kas Tunai', fmt(saldoPerAcuan.tunai)],
    ['Bank / Transfer', fmt(saldoPerAcuan.bank)],
  ];
  if (saldoPerAcuan.tanpaMetode !== 0) bodySaldo.push(['Data lama tanpa metode', fmt(saldoPerAcuan.tanpaMetode)]);
  bodySaldo.push(['TOTAL KAS', fmt(saldoPerAcuan.total)]);
  bodySaldo.push(['Piutang siswa (tagihan belum dibayar)', fmt(neraca.aset.piutang)]);
  bodySaldo.push(['Titipan siswa (sesi belum diajarkan) - JANGAN diambil', fmt(neraca.kewajiban.titipan)]);
  bodySaldo.push(['Komitmen cicilan belum diterima (bukan kas)', fmt(tagihanInfo.belumDiterima)]);
  gambarTabel({ ...opsiTabel(), head: [['Keterangan', 'Jumlah']], body: bodySaldo });

  // ===== 2. Laba Rugi Kas =====
  judulBagian('2. LABA RUGI BASIS KAS - ' + info.periodeLabel);
  const bodyKas = [];
  for (const k of kategoriJadiArray(kas.perKategoriMasuk)) bodyKas.push(['  Pemasukan: ' + k.nama, fmt(k.nilai)]);
  bodyKas.push(['TOTAL PEMASUKAN DITERIMA', fmt(kas.masuk)]);
  for (const k of kategoriJadiArray(kas.perKategoriKeluar)) bodyKas.push(['  Pengeluaran: ' + k.nama, fmt(k.nilai)]);
  bodyKas.push(['TOTAL PENGELUARAN', fmt(kas.keluar)]);
  bodyKas.push([kas.netto >= 0 ? 'SURPLUS KAS PERIODE INI' : 'DEFISIT KAS PERIODE INI', fmt(kas.netto)]);
  if (kas.komitmen > 0) bodyKas.push(['Memo: komitmen cicilan tercatat (belum diterima)', fmt(kas.komitmen)]);
  gambarTabel({ ...opsiTabel(), head: [['Kategori', 'Jumlah']], body: bodyKas });

  // ===== 3. Laba Rugi Akrual =====
  judulBagian('3. PROFIT SESUNGGUHNYA (BASIS AKRUAL) - ' + info.periodeLabel);
  gambarTabel({
    ...opsiTabel(),
    head: [['Komponen', 'Jumlah']],
    body: [
      [`Pendapatan yang kepake (${akrual.jumlahBulan} bulan jasa terajar)`, fmt(akrual.pendapatan)],
      ['HPP - honor guru (riwayat sesi mengajar)', fmt(akrual.hpp)],
      ['Biaya tetap (sewa, listrik, internet, dll)', fmt(akrual.fixedTotal)],
      ['Penyusutan aset', fmt(akrual.penyusutanTotal)],
      [akrual.profit >= 0 ? 'PROFIT BERSIH (aman diambil)' : 'RUGI BERSIH', fmt(akrual.profit)],
    ],
  });
  teksKecil('Akrual = pendapatan dihitung dari jasa yang sudah/sedang diajarkan per bulan, bukan dari uang yang masuk kas. Ini angka "profit sesungguhnya" yang aman dipakai keputusan.');

  // ===== 4. Neraca =====
  judulBagian('4. NERACA PER ' + info.tanggalAcuan);
  gambarTabel({
    ...opsiTabel(),
    head: [['Pos', 'Jumlah']],
    body: [
      ['ASET', ''],
      ['  Kas Tunai', fmt(neraca.aset.tunai)],
      ['  Bank / Transfer', fmt(neraca.aset.bank)],
      ...(neraca.aset.tanpaMetode !== 0 ? [['  Data lama tanpa metode', fmt(neraca.aset.tanpaMetode)]] : []),
      ['  Piutang Siswa (tagihan belum lunas)', fmt(neraca.aset.piutang)],
      ['TOTAL ASET', fmt(neraca.aset.total)],
      ['KEWAJIBAN', ''],
      ['  Titipan Siswa (sesi belajar belum diajarkan)', fmt(neraca.kewajiban.titipan)],
      ['TOTAL KEWAJIBAN', fmt(neraca.kewajiban.total)],
      ['EKUITAS (Aset - Kewajiban)', fmt(neraca.ekuitas)],
    ],
  });

  // ===== 5. Arus Kas Tahunan =====
  judulBagian(`5. ARUS KAS TAHUN ${arusKas.tahun}`);
  gambarTabel({
    ...opsiTabel(),
    head: [['Bulan', 'Kas Masuk', 'Kas Keluar', 'Netto', 'Saldo Akhir Bulan']],
    body: arusKas.perBulan.map(b => [namaBulanDariKey(b.bulan), fmt(b.masuk), fmt(b.keluar), fmt(b.netto), fmt(b.saldoAkhirBulan)]),
    foot: [['TOTAL', fmt(arusKas.totalMasuk), fmt(arusKas.totalKeluar), fmt(arusKas.netto), fmt(arusKas.saldoAkhir)]],
  });
  teksKecil(`Saldo awal ${arusKas.tahun}: ${fmt(arusKas.saldoAwal)}. Komitmen cicilan tercatat tahun ini (belum tentu diterima): ${fmt(arusKas.totalKomitmen)}.`);

  // ===== 6. Piutang =====
  judulBagian('6. PIUTANG SISWA (UANG YANG BELUM MASUK)');
  if (siswaInfo.rinciPiutang.length === 0) {
    gantiHalamanJikaPerlu(14);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text('Tidak ada piutang -- semua tagihan siswa sudah lunas.', KIRI, yNow + 6);
    yNow += 10;
  } else {
    gambarTabel({
      ...opsiTabel(),
      head: [['Nama Siswa', 'Sisa Tagihan', 'Status']],
      body: siswaInfo.rinciPiutang.slice(0, 30).map(p => [p.nama, fmt(p.sisa), p.status]),
      foot: [[`TOTAL (${siswaInfo.rinciPiutang.length} siswa)`, fmt(siswaInfo.totalPiutang), '']],
    });
  }

  // ===== 7. Jadwal Cicilan =====
  if (tagihanInfo.rinci.length > 0) {
    judulBagian('7. JADWAL CICILAN BELUM DITERIMA');
    gambarTabel({
      ...opsiTabel(),
      head: [['Nama Siswa', 'Cicilan Ke', 'Nominal', 'Jatuh Tempo', 'Kondisi']],
      body: tagihanInfo.rinci.slice(0, 40).map(c => [c.namaSiswa, String(c.bulanKe), fmt(c.nominal), c.jatuhTempo || '-', c.telat ? 'TERLAMBAT' : 'Menunggu']),
      foot: [['TOTAL', '', fmt(tagihanInfo.belumDiterima), '', '']],
    });
  }

  // ===== Catatan metodologi =====
  judulBagian('CATATAN METODOLOGI');
  gantiHalamanJikaPerlu(40);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  const catatan = doc.splitTextToSize([
    '1. Basis kas dihitung dari riwayat transaksi (finance_logs). Pemasukan ber-metode Cicilan TIDAK dihitung sebagai uang masuk karena itu komitmen yang belum diterima; tiap cicilan yang dibayar tercatat terpisah sebagai Tunai/Transfer.',
    '2. Piutang dan titipan siswa dihitung dari data siswa TERBARU (sistem tidak menyimpan riwayat perubahan data siswa per tanggal masa lalu).',
    '3. Ekuitas adalah angka penyeimbang (Aset - Kewajiban). Modal awal pemilik tidak pernah dicatat terpisah di sistem, sehingga ekuitas mencerminkan akumulasi hasil usaha yang terekam sistem.',
    '4. Biaya tetap dan penyusutan dihitung flat per bulan sesuai Pengaturan saat laporan dibuat.',
  ].join('\n'), LEBAR);
  doc.text(catatan, KIRI, yNow + 5);
  yNow += 5 + catatan.length * 3.2;

  // Nomor halaman
  const total = doc.getNumberOfPages();
  for (let i = 1; i <= total; i++) {
    doc.setPage(i);
    doc.setFontSize(7.5);
    doc.setTextColor(148, 163, 184);
    doc.text(`Halaman ${i} dari ${total} - dibuat ${info.dibuatPada}`, KIRI, 292);
  }

  doc.save(namaFile);
};
