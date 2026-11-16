// src/pages/admin/owner/PanelAuditMutasiOwner.jsx
// ============================================================
// PUSAT AUDIT & BUKU MUTASI BANK OWNER (m-Banking)
// Dibuat khusus untuk Founder/Owner Bimbel Gemilang:
// 1. Audit Bulan-demi-Bulan (Mulai Januari 2026 s/d Sekarang)
// 2. Filter Fleksibel: Mutasi Bank (Transfer), Kas Tunai, & Semua
// 3. Tombol Checklist Interaktif ("Sudah Dicocokkan dengan m-Banking")
// 4. Form Cepat Tambah Mutasi (10 Detik dari HP)
// 5. 1-Klik Pembukuan Gaji Tentor & Admin Bulan Terpilih
// 6. Kalkulator "Dana Bebas Hak Owner" (Anti-Takut Menggaji Diri Sendiri)
// ============================================================

import React, { useState, useMemo, useEffect } from 'react';
import { db } from '../../../firebase';
import {
  collection, doc, addDoc, deleteDoc, updateDoc, writeBatch, serverTimestamp,
} from 'firebase/firestore';
import {
  Wallet, ShieldCheck, CheckCircle2, AlertTriangle, RefreshCw,
  PlusCircle, Trash2, Calendar, DollarSign, ArrowRight, ArrowDownRight,
  ArrowUpRight, Sparkles, Building2, UserCheck, HelpCircle, Lock,
  ChevronLeft, ChevronRight, Check, Search, Filter, Layers, CreditCard,
  Download, FileText, Copy, Bot, FileSpreadsheet
} from 'lucide-react';
import { KANAL } from '../../../utils/kanalUang';
import { rp as defaultRp } from '../manajemen/manajemenUtils';
import InputRupiah from '../../../components/InputRupiah';

const DAFTAR_BULAN_2026 = [
  { id: '2026-01', label: 'Januari 2026' },
  { id: '2026-02', label: 'Februari 2026' },
  { id: '2026-03', label: 'Maret 2026' },
  { id: '2026-04', label: 'April 2026' },
  { id: '2026-05', label: 'Mei 2026' },
  { id: '2026-06', label: 'Juni 2026' },
  { id: '2026-07', label: 'Juli 2026' },
  { id: '2026-08', label: 'Agustus 2026' },
  { id: '2026-09', label: 'September 2026' },
  { id: '2026-10', label: 'Oktober 2026' },
  { id: '2026-11', label: 'November 2026 (Bulan Berjalan)' },
  { id: '2026-12', label: 'Desember 2026' },
];

const KATEGORI_PILIHAN = [
  { id: 'Gaji Guru/Staf', label: '👨‍🏫 Gaji Tentor', defaultKeluar: true },
  { id: 'Gaji Admin', label: '💼 Gaji Admin', defaultKeluar: true },
  { id: 'Gaji Owner (Prive)', label: '👑 Gaji Owner (Prive Pribadi)', defaultKeluar: true },
  { id: 'Listrik & Air', label: '⚡ Listrik & Air', defaultKeluar: true },
  { id: 'WiFi & Internet', label: '📶 WiFi & Internet', defaultKeluar: true },
  { id: 'Sewa Tempat', label: '🏢 Sewa Tempat', defaultKeluar: true },
  { id: 'Marketing/Iklan', label: '📢 Marketing & Iklan', defaultKeluar: true },
  { id: 'Setor Kas dari Brankas', label: '💵 Setoran Tunai Brankas ke Bank', defaultKeluar: false },
  { id: 'SPP Siswa (Transfer)', label: '🎓 SPP Siswa (Transfer Bank)', defaultKeluar: false },
  { id: 'Perlengkapan / ATK', label: '📦 Modul & ATK', defaultKeluar: true },
  { id: 'Konsumsi & Snack', label: '☕ Konsumsi / Snack', defaultKeluar: true },
  { id: 'Operasional Lainnya', label: '⚙️ Operasional Lainnya', defaultKeluar: true },
];

export default function PanelAuditMutasiOwner({
  logs = [],
  teacherLogs = [],
  students = [],
  rp: rpProp,
  isMobile = false,
}) {
  const formatRp = rpProp || defaultRp;

  // 1. Pemilih Bulan Audit (Default: Bulan Berjalan)
  const [bulanPilihan, setBulanPilihan] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });

  // Filter Metode Transaksi: 'bank' (m-Banking) | 'tunai' (Kasir) | 'semua'
  const [filterKanal, setFilterKanal] = useState('bank');
  const [searchQuery, setSearchQuery] = useState('');

  // State Form Cepat Mutasi
  const [formTanggal, setFormTanggal] = useState(() => new Date().toISOString().slice(0, 10));
  const [formTipe, setFormTipe] = useState('Pengeluaran'); // 'Pengeluaran' | 'Pemasukan'
  const [formMetode, setFormMetode] = useState('Transfer'); // 'Transfer' | 'Tunai'
  const [formKategori, setFormKategori] = useState('Gaji Guru/Staf');
  const [formNominal, setFormNominal] = useState('');
  const [formKeterangan, setFormKeterangan] = useState('');
  const [formRekening, setFormRekening] = useState('');
  const [savingLog, setSavingLog] = useState(false);

  // State 1-Klik Pembukuan Gaji
  const [nominalGajiTentorCustom, setNominalGajiTentorCustom] = useState('');
  const [processingGaji, setProcessingGaji] = useState(false);

  // Modal Preview Bukti Transfer
  const [previewBukti, setPreviewBukti] = useState(null);

  // Otomatis sinkronkan tanggal form saat bulan pilihan berubah
  const handleGantiBulan = (bln) => {
    setBulanPilihan(bln);
    const d = new Date();
    const currBln = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    if (bln === currBln) {
      setFormTanggal(d.toISOString().slice(0, 10));
    } else {
      setFormTanggal(`${bln}-15`);
    }
  };

  const handleBulanSebelumnya = () => {
    const [y, m] = bulanPilihan.split('-').map(Number);
    const prev = new Date(y, m - 2, 1);
    const ym = `${prev.getFullYear()}-${String(prev.getMonth() + 1).padStart(2, '0')}`;
    handleGantiBulan(ym);
  };

  const handleBulanBerikutnya = () => {
    const [y, m] = bulanPilihan.split('-').map(Number);
    const next = new Date(y, m, 1);
    const ym = `${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, '0')}`;
    handleGantiBulan(ym);
  };

  // Daftar Semua Bulan (2026 lengkap + tahun lain jika ada di logs)
  const opsiBulan = useMemo(() => {
    const map = new Map();
    DAFTAR_BULAN_2026.forEach((b) => map.set(b.id, b.label));
    logs.forEach((l) => {
      const d = String(l.date || '');
      if (d.length >= 7) {
        const ym = d.slice(0, 7);
        if (!map.has(ym)) {
          const [thn, bln] = ym.split('-');
          const namaB = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'][parseInt(bln, 10) - 1] || bln;
          map.set(ym, `${namaB} ${thn}`);
        }
      }
    });
    return Array.from(map.entries())
      .map(([id, label]) => ({ id, label }))
      .sort((a, b) => a.id.localeCompare(b.id)); // urut kronologis Jan -> Des
  }, [logs]);

  // 2. Data Transaksi Bulan Terpilih
  const semuaLogsBulanIni = useMemo(() => {
    return logs.filter((l) => {
      const d = String(l.date || '');
      return d.startsWith(bulanPilihan);
    }).sort((a, b) => String(b.date || '').localeCompare(String(a.date || '')));
  }, [logs, bulanPilihan]);

  const bankLogsBulanIni = useMemo(() => {
    return semuaLogsBulanIni.filter((l) =>
      l.kanal === KANAL.BANK || l.kanal === KANAL.KAS_OWNER || l.method === 'Transfer' || l.type === 'Transfer'
    );
  }, [semuaLogsBulanIni]);

  const tunaiLogsBulanIni = useMemo(() => {
    return semuaLogsBulanIni.filter((l) =>
      l.kanal === KANAL.KAS_ADMIN || l.method === 'Tunai'
    );
  }, [semuaLogsBulanIni]);

  // Transaksi yang ditampilkan sesuai Tab Filter
  const logsDitampilkan = useMemo(() => {
    let list = semuaLogsBulanIni;
    if (filterKanal === 'bank') list = bankLogsBulanIni;
    if (filterKanal === 'tunai') list = tunaiLogsBulanIni;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter((l) =>
        (l.note || '').toLowerCase().includes(q) ||
        (l.category || '').toLowerCase().includes(q) ||
        (l.namaSiswa || '').toLowerCase().includes(q) ||
        String(l.amount || '').includes(q)
      );
    }
    return list;
  }, [semuaLogsBulanIni, bankLogsBulanIni, tunaiLogsBulanIni, filterKanal, searchQuery]);

  // 3. Rekap Finansial Bank Bulan Terpilih (Dasar Audit Rekening)
  const rekapBulanBank = useMemo(() => {
    let totalMasuk = 0;
    let totalKeluar = 0;
    let gajiTentorTerbuku = 0;
    let gajiAdminTerbuku = 0;
    let priveOwnerTerbuku = 0;

    bankLogsBulanIni.forEach((l) => {
      const amt = parseInt(l.amount || 0, 10) || 0;
      if (l.type === 'Pemasukan' || (l.type === 'Transfer' && l.kanalKe === KANAL.BANK)) {
        totalMasuk += amt;
      } else if (l.type === 'Pengeluaran' || (l.type === 'Transfer' && l.kanalDari === KANAL.BANK)) {
        totalKeluar += amt;
        const kat = String(l.category || '').toLowerCase();
        if (kat.includes('gaji guru') || kat.includes('tentor') || kat.includes('gaji staf')) {
          gajiTentorTerbuku += amt;
        } else if (kat.includes('gaji admin')) {
          gajiAdminTerbuku += amt;
        } else if (kat.includes('prive') || kat.includes('gaji owner')) {
          priveOwnerTerbuku += amt;
        }
      }
    });

    const netProfitBulan = totalMasuk - totalKeluar;

    return {
      totalMasuk,
      totalKeluar,
      netProfitBulan,
      gajiTentorTerbuku,
      gajiAdminTerbuku,
      priveOwnerTerbuku,
      sudahAdaGajiTentor: gajiTentorTerbuku > 0,
      sudahAdaGajiAdmin: gajiAdminTerbuku > 0,
    };
  }, [bankLogsBulanIni]);

  // 4. Rekap Sesi Mengajar Tentor Khusus Bulan Terpilih
  const rekapTentorBulanIni = useMemo(() => {
    let sesiBulan = 0;
    let nominalBulan = 0;
    let logIds = [];

    teacherLogs.forEach((t) => {
      const tgl = String(t.tanggal || '');
      if (tgl.startsWith(bulanPilihan)) {
        sesiBulan += 1;
        nominalBulan += parseInt(t.nominal || 0, 10) || 0;
        if (t.id) logIds.push(t.id);
      }
    });

    return {
      totalSesi: sesiBulan,
      totalNominalEstimasi: nominalBulan,
      logIds,
    };
  }, [teacherLogs, bulanPilihan]);

  // 5. Kalkulator Dana Bebas Hak Owner
  const kalkulatorDanaBebas = useMemo(() => {
    const kewajibanGajiTentorTahan = rekapBulanBank.sudahAdaGajiTentor ? 0 : (rekapTentorBulanIni.totalNominalEstimasi || 4500000);
    const kewajibanGajiAdminTahan = rekapBulanBank.sudahAdaGajiAdmin ? 0 : 1000000;
    const cadanganDarurat = 1500000;

    const danaBebasAman = Math.max(
      0,
      rekapBulanBank.totalMasuk - (rekapBulanBank.totalKeluar + kewajibanGajiTentorTahan + kewajibanGajiAdminTahan) - cadanganDarurat
    );

    return {
      kewajibanGajiTentorTahan,
      kewajibanGajiAdminTahan,
      cadanganDarurat,
      danaBebasAman,
    };
  }, [rekapBulanBank, rekapTentorBulanIni]);

  // 6. Statistik Progres Audit Kecocokan
  const statsAudit = useMemo(() => {
    const total = bankLogsBulanIni.length;
    const cocok = bankLogsBulanIni.filter((l) => l.statusAudit === 'cocok' || l.statusRekonsiliasi === 'cocok').length;
    const persen = total > 0 ? Math.round((cocok / total) * 100) : 100;
    return { total, cocok, persen, sisa: total - cocok };
  }, [bankLogsBulanIni]);

  // AKSI 1: Simpan Transaksi Baru yang Belum Tercatat
  const handleSimpanTransaksiManual = async (e) => {
    e.preventDefault();
    const nominal = parseInt(formNominal, 10) || 0;
    if (nominal <= 0) {
      alert('⚠️ Masukkan nominal transaksi!');
      return;
    }

    setSavingLog(true);
    try {
      const kanalDipilih = formMetode === 'Transfer' ? KANAL.BANK : KANAL.KAS_ADMIN;
      const namaRek = formRekening.trim();
      await addDoc(collection(db, 'finance_logs'), {
        type: formTipe,
        date: formTanggal,
        category: formKategori,
        amount: nominal,
        method: formMetode,
        kanal: kanalDipilih,
        refTransfer: namaRek,
        note: (formKeterangan.trim() || `${formKategori} (${formMetode === 'Transfer' ? 'm-Banking Owner' : 'Kasir Tunai'})`) + (namaRek ? ` [Rek: ${namaRek}]` : ''),
        statusAudit: 'cocok', // Otomatis cocok karena langsung disalin dari mutasi bank riil
        statusRekonsiliasi: 'cocok',
        dicatatOleh: 'Owner (Audit Mandiri)',
        createdAt: serverTimestamp(),
      });

      setFormNominal('');
      setFormKeterangan('');
      setFormRekening('');
      alert(`✅ Berhasil! Transaksi ${formKategori} sebesar ${formatRp(nominal)} berhasil dicatat & ditandai Cocok.`);
    } catch (err) {
      console.error('Gagal mencatat mutasi:', err);
      alert('Gagal menyimpan transaksi: ' + err.message);
    } finally {
      setSavingLog(false);
    }
  };

  // AKSI 2: Toggle Status Checklist Audit ("Sudah Dicocokkan")
  const handleToggleAudit = async (logId, statusSekarang) => {
    const targetStatus = statusSekarang ? 'belum' : 'cocok';
    try {
      await updateDoc(doc(db, 'finance_logs', logId), {
        statusAudit: targetStatus,
        statusRekonsiliasi: targetStatus,
        auditAt: serverTimestamp(),
      });
    } catch (err) {
      console.error('Gagal update status audit:', err);
      alert('Gagal update status audit: ' + err.message);
    }
  };

  // AKSI 3: Tandai Semua Mutasi Bank Bulan Ini Cocok Sekaligus
  const handleTandaiSemuaCocok = async () => {
    if (bankLogsBulanIni.length === 0) return;
    const konfirmasi = window.confirm(
      `Tandai semua ${bankLogsBulanIni.length} mutasi bank di bulan ${bulanPilihan} sebagai "SUDAH COCOK" dengan m-Banking?`
    );
    if (!konfirmasi) return;

    try {
      const batch = writeBatch(db);
      bankLogsBulanIni.forEach((l) => {
        if (l.statusAudit !== 'cocok' && l.statusRekonsiliasi !== 'cocok') {
          batch.update(doc(db, 'finance_logs', l.id), {
            statusAudit: 'cocok',
            statusRekonsiliasi: 'cocok',
            auditAt: serverTimestamp(),
          });
        }
      });
      await batch.commit();
      alert(`✅ Semua mutasi bank bulan ${bulanPilihan} berhasil ditandai Cocok!`);
    } catch (err) {
      alert('Gagal menandai cocok: ' + err.message);
    }
  };

  // AKSI 4: 1-Klik Bukukan Gaji Tentor Bulan Ini
  const handleBukukanGajiTentor = async () => {
    const nominalRiil = parseInt(nominalGajiTentorCustom, 10) || rekapTentorBulanIni.totalNominalEstimasi || 4500000;
    const konfirmasi = window.confirm(
      `Konfirmasi Pembukuan Gaji Tentor Bulan ${bulanPilihan}:\n\n` +
      `Nominal: ${formatRp(nominalRiil)}\n` +
      `Kategori: Gaji Guru/Staf (Rekening Bank Bimbel)\n\n` +
      `Lanjutkan penyimpanan?`
    );
    if (!konfirmasi) return;

    setProcessingGaji(true);
    try {
      const today = new Date().toISOString().slice(0, 10);
      const batch = writeBatch(db);

      const logRef = doc(collection(db, 'finance_logs'));
      batch.set(logRef, {
        type: 'Pengeluaran',
        date: `${bulanPilihan}-28`,
        category: 'Gaji Guru/Staf',
        amount: nominalRiil,
        method: 'Transfer',
        kanal: KANAL.BANK,
        note: `Transfer Gaji Tentor Bulan ${bulanPilihan} via m-Banking (${rekapTentorBulanIni.totalSesi} sesi)`,
        statusAudit: 'cocok',
        statusRekonsiliasi: 'cocok',
        dicatatOleh: 'Owner (Audit Mandiri)',
        createdAt: serverTimestamp(),
      });

      rekapTentorBulanIni.logIds.forEach((id) => {
        batch.update(doc(db, 'teacher_logs', id), {
          statusDibayar: 'Lunas',
          tanggalDibayar: today,
        });
      });

      await batch.commit();
      setNominalGajiTentorCustom('');
      alert(`✅ Berhasil! Gaji tentor bulan ${bulanPilihan} sebesar ${formatRp(nominalRiil)} resmi dibukukan & cocok.`);
    } catch (err) {
      console.error('Gagal bukukan gaji tentor:', err);
      alert('Gagal membukukan gaji tentor: ' + err.message);
    } finally {
      setProcessingGaji(false);
    }
  };

  // AKSI 5: 1-Klik Bukukan Gaji Admin Rp 1.000.000
  const handleBukukanGajiAdmin = async () => {
    const konfirmasi = window.confirm(
      `Konfirmasi Pembukuan Gaji Admin Bulan ${bulanPilihan}:\n\n` +
      `Nominal: Rp 1.000.000\n` +
      `Kategori: Gaji Admin (Rekening Bank Bimbel)\n\n` +
      `Lanjutkan penyimpanan?`
    );
    if (!konfirmasi) return;

    try {
      await addDoc(collection(db, 'finance_logs'), {
        type: 'Pengeluaran',
        date: `${bulanPilihan}-28`,
        category: 'Gaji Admin',
        amount: 1000000,
        method: 'Transfer',
        kanal: KANAL.BANK,
        note: `Transfer Gaji Admin Bulan ${bulanPilihan} via m-Banking`,
        statusAudit: 'cocok',
        statusRekonsiliasi: 'cocok',
        dicatatOleh: 'Owner (Audit Mandiri)',
        createdAt: serverTimestamp(),
      });
      alert(`✅ Berhasil! Gaji admin bulan ${bulanPilihan} sebesar Rp 1.000.000 resmi dibukukan & cocok.`);
    } catch (err) {
      console.error('Gagal bukukan gaji admin:', err);
      alert('Gagal: ' + err.message);
    }
  };

  // AKSI 6: Hapus Log (Jika salah input)
  const handleHapusLog = async (logId, ket, nominal) => {
    if (!window.confirm(`Hapus catatan transaksi: ${ket} (${formatRp(nominal)})?`)) return;
    try {
      await deleteDoc(doc(db, 'finance_logs', logId));
    } catch (err) {
      alert('Gagal menghapus: ' + err.message);
    }
  };

  // STATE & AKSI 7: Unduh Data untuk NotebookLM / AI & Excel (Dukungan Rentang Multi-Bulan)
  const [exportMode, setExportMode] = useState('rentang'); // 'rentang' | 'bulan'
  const [rangeDari, setRangeDari] = useState(() => '2026-06');
  const [rangeSampai, setRangeSampai] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });
  const [copiedPrompt, setCopiedPrompt] = useState(false);

  const setPresetRange = (bulanMundur) => {
    const dSampai = new Date();
    const sampaiStr = `${dSampai.getFullYear()}-${String(dSampai.getMonth() + 1).padStart(2, '0')}`;
    const dDari = new Date();
    dDari.setMonth(dDari.getMonth() - (bulanMundur - 1));
    const dariStr = `${dDari.getFullYear()}-${String(dDari.getMonth() + 1).padStart(2, '0')}`;
    setRangeDari(dariStr);
    setRangeSampai(sampaiStr);
  };

  // Filter logs dalam rentang waktu yang dipilih
  const logsDalamRentang = useMemo(() => {
    if (exportMode === 'bulan') return semuaLogsBulanIni;
    return logs.filter((l) => {
      const bln = String(l.date || '').slice(0, 7);
      if (!bln) return false;
      return bln >= rangeDari && bln <= rangeSampai;
    }).sort((a, b) => (a.date || '').localeCompare(b.date || ''));
  }, [logs, exportMode, rangeDari, rangeSampai, semuaLogsBulanIni]);

  // Sesi guru dalam rentang waktu
  const teacherLogsDalamRentang = useMemo(() => {
    if (exportMode === 'bulan') {
      return teacherLogs.filter(t => String(t.tanggal || '').startsWith(bulanPilihan));
    }
    return teacherLogs.filter((t) => {
      const bln = String(t.tanggal || '').slice(0, 7);
      if (!bln) return false;
      return bln >= rangeDari && bln <= rangeSampai;
    }).sort((a, b) => (a.tanggal || '').localeCompare(b.tanggal || ''));
  }, [teacherLogs, exportMode, rangeDari, rangeSampai, bulanPilihan]);

  // Agregasi statistik rentang waktu
  const statsRentang = useMemo(() => {
    let masuk = 0;
    let keluar = 0;
    logsDalamRentang.forEach((l) => {
      const amt = parseInt(l.amount || 0, 10) || 0;
      const isMasuk = l.type === 'Pemasukan' || (l.type === 'Transfer' && l.kanalKe === KANAL.BANK);
      if (isMasuk) masuk += amt;
      else keluar += amt;
    });
    const honorGuru = teacherLogsDalamRentang.reduce((acc, t) => acc + (parseInt(t.nominal || 0, 10) || 0), 0);
    return {
      masuk,
      keluar,
      net: masuk - keluar,
      totalTrx: logsDalamRentang.length,
      totalSesi: teacherLogsDalamRentang.length,
      honorGuru,
    };
  }, [logsDalamRentang, teacherLogsDalamRentang]);

  // Ringkasan per bulan dalam rentang
  const rekapBulanPerBulanRentang = useMemo(() => {
    const map = new Map();
    logsDalamRentang.forEach((l) => {
      const bln = String(l.date || '').slice(0, 7) || 'Lainnya';
      if (!map.has(bln)) {
        map.set(bln, { bulan: bln, masuk: 0, keluar: 0, trx: 0, honorTerbuku: 0 });
      }
      const item = map.get(bln);
      item.trx += 1;
      const amt = parseInt(l.amount || 0, 10) || 0;
      const isMasuk = l.type === 'Pemasukan' || (l.type === 'Transfer' && l.kanalKe === KANAL.BANK);
      if (isMasuk) item.masuk += amt;
      else {
        item.keluar += amt;
        if (String(l.category || '').toLowerCase().includes('gaji')) {
          item.honorTerbuku += amt;
        }
      }
    });
    return Array.from(map.values()).sort((a, b) => a.bulan.localeCompare(b.bulan));
  }, [logsDalamRentang]);

  const handleUnduhFile = (namaFile, konten, mimeType = 'text/plain;charset=utf-8') => {
    const blob = new Blob([konten], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = namaFile;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleUnduhUntukAI = () => {
    const isRange = exportMode === 'rentang';
    const judulPeriode = isRange ? `${rangeDari} s/d ${rangeSampai}` : bulanPilihan;
    const targetLogs = isRange ? logsDalamRentang : semuaLogsBulanIni;
    const targetTeachers = isRange ? teacherLogsDalamRentang : teacherLogs.filter(t => String(t.tanggal || '').startsWith(bulanPilihan));

    let teks = `# DOKUMEN RESMI TRANSAKSI KEUANGAN BIMBEL GEMILANG\n`;
    teks += `## Periode Audit: ${judulPeriode}\n`;
    teks += `Diekspor pada: ${new Date().toLocaleString('id-ID')}\n`;
    teks += `Founder / Owner: Wildan Bima Prakusya\n`;
    teks += `Sistem: Aplikasi Manajemen & Komando Owner Bimbel Gemilang\n\n`;

    teks += `================================================================================\n`;
    teks += `PANDUAN & PROMPT INSTRUKSI KHUSUS UNTUK NOTEBOOK LM / CHATGPT / CLAUDE / AI:\n`;
    teks += `--------------------------------------------------------------------------------\n`;
    teks += `Halo AI, Anda bertindak sebagai Konsultan Keuangan Senior & Auditor Bisnis Independen.\n`;
    teks += `Saya mengunggah dua kelompok sumber data:\n`;
    teks += `1. DOKUMEN INI (Data resmi transaksi terbuku di sistem keuangan Bimbel Gemilang periode ${judulPeriode}).\n`;
    teks += `2. REKENING KORAN BANK (PDF Mutasi Rekening BCA No. Rek 8620553205 a.n. Wildan Bima Prakusya untuk periode yang sama).\n\n`;

    teks += `LATAR BELAKANG KONDISI NYATA BISNIS:\n`;
    teks += `- Rekening BCA tersebut selama ini digunakan secara CAMPURAN antara keuangan pribadi founder dan operasional bimbel.\n`;
    teks += `- Pemasukan SPP di rekening bank mencantumkan NAMA ORANG TUA siswa (misal: Ibu Astatik, Bobby Lazuardi, Utji Istanti, Erine Yovi, dll), sedangkan di dokumen Gemilang ini tercatat NAMA SISWA.\n`;
    teks += `- Ada kemungkinan kesalahan administrasi kasir: pembayaran yang seharusnya Transfer tercatat Tunai di kasir, atau sebaliknya.\n`;
    teks += `- Ada kemungkinan pembayaran honor tentor atau biaya operasional yang ditransfer owner dari m-Banking namun belum sempat diinput ke sistem kasir Gemilang.\n\n`;

    teks += `TUGAS AUDIT & ANALISIS ANDA (MOHON JAWAB SECARA STRUKTUR DAN RINCI):\n\n`;

    teks += `1. REKONSILIASI PEMASUKAN (INCOME CROSS-CHECK):\n`;
    teks += `   - Cocokkan setiap transaksi transfer masuk di rekening BCA dengan daftar pemasukan di sistem Gemilang ini.\n`;
    teks += `   - Identifikasi: Mana transfer SPP di rekening BCA yang SUDAH TERCATAT di dokumen Gemilang ini?\n`;
    teks += `   - Identifikasi: Mana transfer SPP di rekening BCA yang BELUM TERCATAT sama sekali di sistem kasir Gemilang? Tuliskan tanggal, nominal, dan nama pengirimnya agar bisa segera saya masukkan ke sistem.\n`;
    teks += `   - Identifikasi: Apakah ada transaksi yang di sistem Gemilang tercatat Tunai tapi ternyata masuk via Transfer bank (atau sebaliknya)?\n\n`;

    teks += `2. AUDIT PENGELUARAN (SEPARASI PRIVE VS OPERASIONAL):\n`;
    teks += `   - Pisahkan secara tegas transaksi keluar (DB) di rekening BCA menjadi 2 kelompok:\n`;
    teks += `     A. PENGELUARAN PRIBADI FOUNDER (PRIVE): Belanja Shopee/e-commerce, tiket KAI Access, hotel/RedDoorz, fashion/lifestyle (Charles & Keith, dll), makan/cafe/kuliner pribadi, tarik tunai, transfer ke rekening/dompet pribadi.\n`;
    teks += `     B. PENGELUARAN OPERASIONAL BIMBEL: Honor/gaji tentor (Rani, Jeremy, Alifah, Agvionita, dll), gaji admin, sewa tempat, listrik/air, WiFi/Indihome, modul/ATK, konsumsi bimbel, biaya admin bank.\n`;
    teks += `   - Identifikasi: Mana pembayaran honor tentor atau biaya operasional di rekening BCA yang BELUM DIBUKUKAN di sistem Gemilang ini?\n\n`;

    teks += `3. NERACA LABA / RUGI BERSIH RIIL BULANAN (MONTH-BY-MONTH REAL NET PROFIT):\n`;
    teks += `   - Untuk setiap bulan dalam rentang ${judulPeriode}:\n`;
    teks += `     * Total Pemasukan Riil Bimbel (Kasir Tunai + Bank)\n`;
    teks += `     * Total Pengeluaran Riil Bimbel (Honor Guru + Beban Operasional)\n`;
    teks += `     * Net Profit Bersih Riil Bimbel (Laba/Surplus atau Defisit/Minus). Tunjukkan dengan jelas apakah bulan tersebut minus atau surplus!\n`;
    teks += `     * Total Prive (Uang yang dipakai untuk keperluan pribadi founder) di bulan tersebut.\n`;
    teks += `   - Hitung total kumulatif selama rentang ${judulPeriode}.\n\n`;

    teks += `4. REKOMENDASI STRATEGIS & SOLUSI MANAJEMEN:\n`;
    teks += `   - Berikan rekomendasi langkah konkret untuk saya sebagai Owner:\n`;
    teks += `     a) Berapa nominal gaji tetap founder (Prive) yang realistis diambil setiap bulan agar arus kas bimbel tetap aman?\n`;
    teks += `     b) Bagaimana skema pemisahan rekening yang paling praktis dan disiplin per bulan ini ke depan?\n`;
    teks += `     c) Apakah struktur biaya honor guru terhadap pendapatan siswa sudah proporsional?\n`;
    teks += `     d) Rekomendasi perbaikan tata kelola kasir dan pelaporan agar tidak ada lagi kebocoran data.\n`;
    teks += `================================================================================\n\n`;

    if (isRange) {
      teks += `### 1. REKAPITULASI KEUANGAN PER BULAN (${judulPeriode})\n\n`;
      teks += `| Bulan | Total Trx | Total Pemasukan | Total Pengeluaran | Selisih (Kas Bersih) | Honor Guru Terbuku |\n`;
      teks += `|---|---|---|---|---|---|\n`;
      rekapBulanPerBulanRentang.forEach((r) => {
        const net = r.masuk - r.keluar;
        teks += `| ${r.bulan} | ${r.trx} | Rp ${r.masuk.toLocaleString('id-ID')} | Rp ${r.keluar.toLocaleString('id-ID')} | Rp ${net.toLocaleString('id-ID')} | Rp ${r.honorTerbuku.toLocaleString('id-ID')} |\n`;
      });
      teks += `\n`;
    } else {
      teks += `### 1. RINGKASAN DATA SISTEM GEMILANG (${bulanPilihan})\n`;
      teks += `- Total Transaksi Terbuku di Sistem: ${semuaLogsBulanIni.length} transaksi\n`;
      teks += `- Total Pemasukan Terbuku Bank: ${formatRp(rekapBulanBank.totalMasuk)}\n`;
      teks += `- Total Pengeluaran Terbuku Bank: ${formatRp(rekapBulanBank.totalKeluar)}\n`;
      teks += `- Laba Bersih Rekening Bank Terbuku: ${formatRp(rekapBulanBank.netProfitBulan)}\n`;
      teks += `- Status Gaji Tentor: ${rekapBulanBank.sudahAdaGajiTentor ? 'Sudah Tercatat (' + formatRp(rekapBulanBank.gajiTentorTerbuku) + ')' : 'Belum Tercatat di Sistem'}\n`;
      teks += `- Status Gaji Admin: ${rekapBulanBank.sudahAdaGajiAdmin ? 'Sudah Tercatat (' + formatRp(rekapBulanBank.gajiAdminTerbuku) + ')' : 'Belum Tercatat di Sistem'}\n\n`;
    }

    teks += `### 2. DATA ESTIMASI SESI MENGAJAR TENTOR (${judulPeriode})\n`;
    teks += `- Total Sesi Mengajar: ${targetTeachers.length} sesi\n`;
    const totalNominalGuru = targetTeachers.reduce((acc, t) => acc + (parseInt(t.nominal || 0, 10) || 0), 0);
    teks += `- Estimasi Total Honor Mengajar: Rp ${totalNominalGuru.toLocaleString('id-ID')}\n\n`;
    if (targetTeachers.length > 0) {
      teks += `Daftar Sesi Mengajar:\n`;
      targetTeachers.forEach((t, i) => {
        teks += `  ${i + 1}. Tanggal: ${t.tanggal} | Guru: ${t.teacherName || t.namaGuru || '-'} | Mapel: ${t.mapel || '-'} | Honor: Rp ${parseInt(t.nominal || 0, 10).toLocaleString('id-ID')} | Status: ${t.statusDibayar || 'Belum Lunas'}\n`;
      });
    } else {
      teks += `(Belum ada rekap sesi mengajar tentor yang tercatat untuk periode ini)\n`;
    }
    teks += `\n`;

    teks += `### 3. DAFTAR DETAIL TRANSAKSI TERBUKU SISTEM (${judulPeriode})\n`;
    teks += `Total: ${targetLogs.length} data transaksi\n\n`;
    teks += `| No | Tanggal | Jenis | Metode | Kanal | Kategori | Nominal | Keterangan / Siswa | Rekening Bank | Status Audit |\n`;
    teks += `|---|---|---|---|---|---|---|---|---|---|\n`;

    if (targetLogs.length === 0) {
      teks += `| - | - | - | - | - | - | - | (Belum ada transaksi tercatat untuk periode ${judulPeriode}) | - | - |\n`;
    } else {
      targetLogs.forEach((l, idx) => {
        const isMasuk = l.type === 'Pemasukan' || (l.type === 'Transfer' && l.kanalKe === KANAL.BANK);
        const jenis = isMasuk ? 'Pemasukan (+)' : 'Pengeluaran (-)';
        const status = (l.statusAudit === 'cocok' || l.statusRekonsiliasi === 'cocok') ? 'Sudah Cocok' : 'Belum Dicocokkan';
        const ket = (l.note || '-').replace(/\|/g, '/');
        const siswa = l.namaSiswa ? ` (Siswa: ${l.namaSiswa})` : '';
        const rek = l.refTransfer ? l.refTransfer.replace(/\|/g, '/') : '-';
        teks += `| ${idx + 1} | ${l.date} | ${jenis} | ${l.method || '-'} | ${l.kanal || '-'} | ${l.category || '-'} | Rp ${parseInt(l.amount || 0, 10).toLocaleString('id-ID')} | ${ket}${siswa} | ${rek} | ${status} |\n`;
      });
    }

    const namaFile = isRange
      ? `Laporan_Audit_Besar_Gemilang_${rangeDari}_sd_${rangeSampai}_Untuk_AI.txt`
      : `Laporan_Audit_Gemilang_${bulanPilihan}_Untuk_NotebookLM.txt`;

    handleUnduhFile(namaFile, teks);
  };

  const handleUnduhCSV = () => {
    const isRange = exportMode === 'rentang';
    const targetLogs = isRange ? logsDalamRentang : semuaLogsBulanIni;
    let csv = `No,Tanggal,Bulan,Jenis,Metode,Kanal,Kategori,Nominal,Keterangan,Siswa,Rekening,StatusAudit\n`;
    targetLogs.forEach((l, idx) => {
      const isMasuk = l.type === 'Pemasukan' || (l.type === 'Transfer' && l.kanalKe === KANAL.BANK);
      const jenis = isMasuk ? 'Pemasukan' : 'Pengeluaran';
      const status = (l.statusAudit === 'cocok' || l.statusRekonsiliasi === 'cocok') ? 'Cocok' : 'Belum';
      const bln = String(l.date || '').slice(0, 7);
      const cleanNote = `"${String(l.note || '').replace(/"/g, '""')}"`;
      const cleanSiswa = `"${String(l.namaSiswa || '').replace(/"/g, '""')}"`;
      const cleanKat = `"${String(l.category || '').replace(/"/g, '""')}"`;
      const cleanRek = `"${String(l.refTransfer || '').replace(/"/g, '""')}"`;
      csv += `${idx + 1},${l.date},${bln},${jenis},${l.method || ''},${l.kanal || ''},${cleanKat},${l.amount || 0},${cleanNote},${cleanSiswa},${cleanRek},${status}\n`;
    });

    const namaFile = isRange
      ? `Laporan_Keuangan_Besar_Gemilang_${rangeDari}_sd_${rangeSampai}.csv`
      : `Mutasi_Gemilang_${bulanPilihan}.csv`;

    handleUnduhFile(namaFile, csv, 'text/csv;charset=utf-8');
  };

  const handleSalinPrompt = () => {
    const isRange = exportMode === 'rentang';
    const targetLogs = isRange ? logsDalamRentang : semuaLogsBulanIni;
    const periodeLabel = isRange ? `${rangeDari} s/d ${rangeSampai}` : bulanPilihan;
    const totalMasuk = isRange ? statsRentang.masuk : rekapBulanBank.totalMasuk;
    const totalKeluar = isRange ? statsRentang.keluar : rekapBulanBank.totalKeluar;

    let teks = `Data Transaksi Terbuku Bimbel Gemilang Periode ${periodeLabel}:\n`;
    teks += `- Total Pemasukan: ${formatRp(totalMasuk)}\n`;
    teks += `- Total Pengeluaran: ${formatRp(totalKeluar)}\n`;
    teks += `- Jumlah Transaksi Terbuku: ${targetLogs.length} data\n\n`;
    teks += `Daftar Transaksi Terbuku:\n`;
    targetLogs.slice(0, 50).forEach((l, idx) => {
      teks += `${idx + 1}. [${l.date}] ${l.type} Rp ${parseInt(l.amount || 0, 10).toLocaleString('id-ID')} - ${l.category} (${l.note || ''})${l.refTransfer ? ' [Rek: ' + l.refTransfer + ']' : ''}\n`;
    });
    if (targetLogs.length > 50) {
      teks += `... (dan ${targetLogs.length - 50} transaksi lainnya. Silakan gunakan tombol unduh .txt untuk data lengkapnya)\n`;
    }
    teks += `\nMohon bantu cocokkan dengan rekening koran BCA saya untuk periode yang sama, pisahkan pengeluaran pribadi vs bimbel, temukan transaksi yang salah catat/belum tercatat, dan hitung profit bersih riil per bulan.`;

    navigator.clipboard.writeText(teks);
    setCopiedPrompt(true);
    setTimeout(() => setCopiedPrompt(false), 3000);
  };

  // Cetak / Unduh Laporan SHU Resmi ber-cap & logo
  const bukaLaporanShuResmi = () => {
    const w = window.open('/LAPORAN_SHU_BIMBEL_GEMILANG_RESMI.html', '_blank');
    if (!w) {
      alert('Mohon izinkan pop-up browser untuk membuka Laporan SHU Resmi.');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* 1. BAR PEMILIH BULAN AUDIT & NAVIGASI CEPAT (JANUARI S/D SEKARANG) */}
      <div style={{
        background: '#ffffff', borderRadius: 16, padding: '16px 20px',
        border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between',
        alignItems: 'center', flexWrap: 'wrap', gap: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: '#eff6ff', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Wallet size={24} />
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: '#0f172a' }}>
              Pusat Audit & Rekonsiliasi Rekening Bank
            </h3>
            <p style={{ margin: '2px 0 0', fontSize: 12, color: '#64748b' }}>
              Cocokkan mutasi m-banking Anda bulan demi bulan secara santai dan rapi.
            </p>
          </div>
        </div>

        {/* Kontrol Navigasi Bulan */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={handleBulanSebelumnya}
            style={{
              display: 'flex', alignItems: 'center', gap: 4, padding: '8px 12px',
              borderRadius: 10, border: '1px solid #cbd5e1', background: '#f8fafc',
              fontSize: 12, fontWeight: 700, color: '#334155', cursor: 'pointer',
            }}
            title="Pindah ke bulan sebelumnya"
          >
            <ChevronLeft size={16} /> Bulan Lalu
          </button>

          <select
            value={bulanPilihan}
            onChange={(e) => handleGantiBulan(e.target.value)}
            style={{
              padding: '8px 14px', borderRadius: 10, border: '2px solid #2563eb',
              fontSize: 13, fontWeight: 800, color: '#1e3a8a', background: '#eff6ff',
              cursor: 'pointer', outline: 'none',
            }}
          >
            {opsiBulan.map((b) => (
              <option key={b.id} value={b.id}>
                {b.label}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={handleBulanBerikutnya}
            style={{
              display: 'flex', alignItems: 'center', gap: 4, padding: '8px 12px',
              borderRadius: 10, border: '1px solid #cbd5e1', background: '#f8fafc',
              fontSize: 12, fontWeight: 700, color: '#334155', cursor: 'pointer',
            }}
            title="Pindah ke bulan berikutnya"
          >
            Bulan Depan <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* 2. KARTU STATUS AUDIT KETENANGAN JIWA OWNER */}
      <div style={{
        background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
        borderRadius: 20, padding: '22px 24px', color: 'white',
        boxShadow: '0 10px 25px rgba(15,23,42,0.25)',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16, marginBottom: 18 }}>
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(251,191,36,0.15)', border: '1px solid rgba(251,191,36,0.3)', color: '#fbbf24', padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 800, marginBottom: 6 }}>
              <ShieldCheck size={13} /> FORMULA KETENANGAN JIWA OWNER
            </div>
            <h4 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: '#ffffff' }}>
              Posisi Kas Rekening Bank: Periode {bulanPilihan}
            </h4>
            <p style={{ margin: '4px 0 0', fontSize: 12.5, color: '#94a3b8' }}>
              Menghitung hak laba bersih Anda secara matematis agar tidak ada rasa bersalah saat mengambil gaji pribadi.
            </p>
          </div>

          <div style={{
            background: 'rgba(16,185,129,0.15)', border: '1px solid #10b981',
            borderRadius: 14, padding: '12px 18px', textAlign: 'right', minWidth: 200,
          }}>
            <span style={{ display: 'block', fontSize: 10.5, fontWeight: 700, color: '#6ee7b7', textTransform: 'uppercase', letterSpacing: 0.5 }}>
              🟢 Dana Bersih Hak Owner (Aman Diambil)
            </span>
            <div style={{ fontSize: 24, fontWeight: 900, color: '#34d399', margin: '2px 0' }}>
              {formatRp(kalkulatorDanaBebas.danaBebasAman)}
            </div>
            <span style={{ fontSize: 10.5, color: '#a7f3d0' }}>
              Sudah aman setelah cadangan kas & estimasi gaji guru
            </span>
          </div>
        </div>

        {/* 4 Komponen Finansial Bank */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(4, 1fr)',
          gap: 12, borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: 16,
        }}>
          <div>
            <span style={{ fontSize: 11, color: '#94a3b8' }}>1. Total Uang Masuk Bank:</span>
            <div style={{ fontSize: 16, fontWeight: 800, color: '#60a5fa', marginTop: 2 }}>
              {formatRp(rekapBulanBank.totalMasuk)}
            </div>
            <span style={{ fontSize: 10, color: '#64748b' }}>SPP transfer + setor tunai</span>
          </div>

          <div>
            <span style={{ fontSize: 11, color: '#94a3b8' }}>2. Pengeluaran Terbuku Bank:</span>
            <div style={{ fontSize: 16, fontWeight: 800, color: '#f87171', marginTop: 2 }}>
              {formatRp(rekapBulanBank.totalKeluar)}
            </div>
            <span style={{ fontSize: 10, color: '#64748b' }}>Gaji & operasional tercatat</span>
          </div>

          <div>
            <span style={{ fontSize: 11, color: '#94a3b8' }}>3. Cadangan Wajib Ditahan:</span>
            <div style={{ fontSize: 16, fontWeight: 800, color: '#fbbf24', marginTop: 2 }}>
              {formatRp(kalkulatorDanaBebas.kewajibanGajiTentorTahan + kalkulatorDanaBebas.kewajibanGajiAdminTahan + kalkulatorDanaBebas.cadanganDarurat)}
            </div>
            <span style={{ fontSize: 10, color: '#64748b' }}>Gaji guru/admin + buffer 1,5 jt</span>
          </div>

          <div>
            <span style={{ fontSize: 11, color: '#94a3b8' }}>4. Laba Bersih Rekening:</span>
            <div style={{ fontSize: 16, fontWeight: 800, color: rekapBulanBank.netProfitBulan >= 0 ? '#34d399' : '#f87171', marginTop: 2 }}>
              {formatRp(rekapBulanBank.netProfitBulan)}
            </div>
            <span style={{ fontSize: 10, color: '#64748b' }}>Masuk - Keluar Bulan Ini</span>
          </div>
        </div>
      </div>

      {/* 3. AUDIT KILAT GAJI TENTOR & ADMIN BULAN TERPILIH */}
      <div style={{
        background: '#ffffff', borderRadius: 16, padding: '20px 24px', border: '1px solid #e2e8f0',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 14 }}>
          <div>
            <h4 style={{ margin: 0, fontSize: 15, fontWeight: 800, color: '#0f172a' }}>
              Audit Pengeluaran Gaji Rutin Bulan {bulanPilihan}
            </h4>
            <p style={{ margin: '2px 0 0', fontSize: 12, color: '#64748b' }}>
              Pastikan transfer gaji di akhir bulan (tanggal 28–31) sudah tercatat di sistem.
            </p>
          </div>
        </div>

        <div style={{
          display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 14,
        }}>
          {/* KOTAK A: GAJI TENTOR */}
          <div style={{
            padding: '16px', borderRadius: 14,
            border: rekapBulanBank.sudahAdaGajiTentor ? '2px solid #86efac' : '2px solid #fde047',
            background: rekapBulanBank.sudahAdaGajiTentor ? '#f0fdf4' : '#fffbeb',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <span style={{ fontSize: 13, fontWeight: 800, color: '#0f172a' }}>
                👨‍🏫 Gaji Tentor Bulan {bulanPilihan}
              </span>
              <span style={{
                fontSize: 10.5, fontWeight: 800, padding: '3px 8px', borderRadius: 6,
                background: rekapBulanBank.sudahAdaGajiTentor ? '#dcfce7' : '#fef08a',
                color: rekapBulanBank.sudahAdaGajiTentor ? '#166534' : '#854d0e',
              }}>
                {rekapBulanBank.sudahAdaGajiTentor ? '✓ SUDAH TERCATAT' : '⚠️ BELUM TERCATAT'}
              </span>
            </div>

            {rekapBulanBank.sudahAdaGajiTentor ? (
              <div style={{ fontSize: 12.5, color: '#166534', lineHeight: 1.5 }}>
                Gaji tentor bulan ini sudah tercatat sebesar <b>{formatRp(rekapBulanBank.gajiTentorTerbuku)}</b>. Sudah sinkron dengan pembukuan tentor!
              </div>
            ) : (
              <div>
                <p style={{ fontSize: 11.5, color: '#713f12', margin: '0 0 8px', lineHeight: 1.4 }}>
                  Terdeteksi <b>{rekapTentorBulanIni.totalSesi} sesi mengajar</b> di sistem (estimasi <b>{formatRp(rekapTentorBulanIni.totalNominalEstimasi)}</b>). Masukkan nominal mutasi riil transfer m-banking Anda:
                </p>
                <div style={{ display: 'flex', gap: 8 }}>
                  <InputRupiah
                    placeholder={`Contoh: ${(rekapTentorBulanIni.totalNominalEstimasi || 4500000).toLocaleString('id-ID')}`}
                    value={nominalGajiTentorCustom}
                    onChange={(e) => setNominalGajiTentorCustom(e.target.value)}
                    style={{ flex: 1, padding: '7px 10px', borderRadius: 8, border: '1px solid #d97706', fontSize: 12.5, fontWeight: 700 }}
                  />
                  <button
                    type="button"
                    onClick={handleBukukanGajiTentor}
                    disabled={processingGaji}
                    style={{
                      background: '#d97706', color: 'white', border: 'none', padding: '7px 12px',
                      borderRadius: 8, fontSize: 12, fontWeight: 800, cursor: 'pointer', whiteSpace: 'nowrap',
                    }}
                  >
                    ⚡ Bukukan Gaji
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* KOTAK B: GAJI ADMIN */}
          <div style={{
            padding: '16px', borderRadius: 14,
            border: rekapBulanBank.sudahAdaGajiAdmin ? '2px solid #86efac' : '2px solid #fde047',
            background: rekapBulanBank.sudahAdaGajiAdmin ? '#f0fdf4' : '#fffbeb',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <span style={{ fontSize: 13, fontWeight: 800, color: '#0f172a' }}>
                💼 Gaji Admin Bulan {bulanPilihan}
              </span>
              <span style={{
                fontSize: 10.5, fontWeight: 800, padding: '3px 8px', borderRadius: 6,
                background: rekapBulanBank.sudahAdaGajiAdmin ? '#dcfce7' : '#fef08a',
                color: rekapBulanBank.sudahAdaGajiAdmin ? '#166534' : '#854d0e',
              }}>
                {rekapBulanBank.sudahAdaGajiAdmin ? '✓ SUDAH TERCATAT' : '⚠️ BELUM TERCATAT'}
              </span>
            </div>

            {rekapBulanBank.sudahAdaGajiAdmin ? (
              <div style={{ fontSize: 12.5, color: '#166534', lineHeight: 1.5 }}>
                Gaji admin bulan ini sudah tercatat sebesar <b>{formatRp(rekapBulanBank.gajiAdminTerbuku)}</b>.
              </div>
            ) : (
              <div>
                <p style={{ fontSize: 11.5, color: '#713f12', margin: '0 0 10px', lineHeight: 1.4 }}>
                  Gaji admin reguler sebesar <b>Rp 1.000.000</b> belum tercatat di buku bank bulan ini.
                </p>
                <button
                  type="button"
                  onClick={handleBukukanGajiAdmin}
                  style={{
                    background: '#2563eb', color: 'white', border: 'none', padding: '8px 14px',
                    borderRadius: 8, fontSize: 12, fontWeight: 800, cursor: 'pointer', width: '100%',
                  }}
                >
                  💼 1-Klik: Catat Transfer Gaji Admin Rp 1.000.000
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 4. FORM CEPAT INPUT TRANSAKSI YANG BELUM TERCATAT */}
      <div style={{
        background: '#ffffff', borderRadius: 16, padding: '22px 24px', border: '1px solid #e2e8f0',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
          <PlusCircle size={18} color="#2563eb" />
          <h4 style={{ margin: 0, fontSize: 15, fontWeight: 800, color: '#0f172a' }}>
            Form Cepat Catat Transaksi yang Belum Tercatat (10 Detik)
          </h4>
        </div>
        <p style={{ margin: '0 0 14px', fontSize: 12, color: '#64748b' }}>
          Jika saat mencocokkan mutasi m-banking Anda menemukan transaksi yang belum ada di tabel, langsung masukkan di sini. Transaksi otomatis ditandai <b>Sudah Cocok</b>.
        </p>

        <form onSubmit={handleSimpanTransaksiManual} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Pilihan Kategori Cepat */}
          <div>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#475569', marginBottom: 6 }}>
              PILIH KATEGORI TRANSAKSI:
            </label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {KATEGORI_PILIHAN.map((k) => {
                const isSelected = formKategori === k.id;
                return (
                  <button
                    key={k.id}
                    type="button"
                    onClick={() => {
                      setFormKategori(k.id);
                      setFormTipe(k.defaultKeluar ? 'Pengeluaran' : 'Pemasukan');
                    }}
                    style={{
                      padding: '5px 12px', borderRadius: 20, fontSize: 11.5, fontWeight: 700,
                      border: isSelected ? '2px solid #2563eb' : '1px solid #cbd5e1',
                      background: isSelected ? '#eff6ff' : '#ffffff',
                      color: isSelected ? '#1d4ed8' : '#334155', cursor: 'pointer',
                    }}
                  >
                    {k.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Baris Input Field */}
          <div style={{
            display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '120px 130px 150px 1fr 140px', gap: 10, alignItems: 'flex-end',
          }}>
            <div>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#475569', marginBottom: 4 }}>
                Jenis:
              </label>
              <select
                value={formTipe}
                onChange={(e) => setFormTipe(e.target.value)}
                style={{ width: '100%', padding: '7px 8px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 12, fontWeight: 700 }}
              >
                <option value="Pengeluaran">💸 Keluar (-)</option>
                <option value="Pemasukan">💰 Masuk (+)</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#475569', marginBottom: 4 }}>
                Metode Pembayaran:
              </label>
              <select
                value={formMetode}
                onChange={(e) => setFormMetode(e.target.value)}
                style={{ width: '100%', padding: '7px 8px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 12, fontWeight: 700 }}
              >
                <option value="Transfer">🏦 Transfer Bank</option>
                <option value="Tunai">💵 Kasir Tunai</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#475569', marginBottom: 4 }}>
                Tanggal Transaksi:
              </label>
              <input
                type="date"
                value={formTanggal}
                onChange={(e) => setFormTanggal(e.target.value)}
                style={{ width: '100%', padding: '6px 8px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 12 }}
                required
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#475569', marginBottom: 4 }}>
                Nominal (Rp) & Keterangan:
              </label>
              <div style={{ display: 'flex', gap: 8 }}>
                <InputRupiah
                  placeholder="Contoh: 350.000"
                  value={formNominal}
                  onChange={(e) => setFormNominal(e.target.value)}
                  style={{ width: '160px', padding: '7px 10px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 12.5, fontWeight: 800 }}
                  required
                />
                <input
                  type="text"
                  placeholder="Keterangan (mis: Bayar WiFi Indihome)"
                  value={formKeterangan}
                  onChange={(e) => setFormKeterangan(e.target.value)}
                  style={{ flex: 1, padding: '7px 10px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 12 }}
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={savingLog}
                style={{
                  width: '100%', padding: '8px 14px', borderRadius: 8, border: 'none',
                  background: '#2563eb', color: 'white', fontWeight: 800, fontSize: 12.5,
                  cursor: savingLog ? 'wait' : 'pointer',
                }}
              >
                {savingLog ? 'Menyimpan...' : '💾 Simpan Catatan'}
              </button>
            </div>
          </div>

          {/* Baris Tambahan Khusus Transfer: Nama Pemilik Rekening Bank */}
          {formMetode === 'Transfer' && (
            <div style={{ background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: 8, padding: '8px 12px', display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 11, fontWeight: 800, color: '#1e40af', whiteSpace: 'nowrap' }}>
                🏦 Atas Nama Rekening di Bank:
              </span>
              <input
                type="text"
                placeholder={formTipe === 'Pemasukan' ? "Contoh: BCA a.n. Ibu Astatik / Utji Istanti / Bobby Lazuardi" : "Contoh: BCA a.n. Rani Erlitasari / Jeremy Sugiarto"}
                value={formRekening}
                onChange={(e) => setFormRekening(e.target.value)}
                style={{ flex: 1, minWidth: 240, padding: '6px 10px', borderRadius: 6, border: '1px solid #93c5fd', background: '#eff6ff', fontSize: 12, fontWeight: 700 }}
              />
              <span style={{ fontSize: 10.5, color: '#64748b' }}>
                (Nama persis di mutasi bank agar langsung cocok saat audit)
              </span>
            </div>
          )}
        </form>
      </div>

      {/* 4B. BAR UNDUH LAPORAN UNTUK NOTEBOOK LM & AI */}
      <div style={{
        background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)',
        borderRadius: 16, padding: '20px 24px',
        color: '#ffffff', display: 'flex', flexDirection: 'column', gap: 16,
        boxShadow: '0 4px 18px rgba(30, 27, 75, 0.28)',
      }}>
        {/* Header & Tab Mode */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Sparkles size={24} color="#facc15" />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <h4 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: '#ffffff' }}>
                  Unduh Laporan Audit Besar untuk AI (NotebookLM / Claude / Excel)
                </h4>
                <span style={{ fontSize: 10, fontWeight: 800, background: '#4f46e5', color: '#e0e7ff', padding: '2px 8px', borderRadius: 12 }}>
                  Cross-Check Mutasi Bank
                </span>
              </div>
              <p style={{ margin: '3px 0 0', fontSize: 12, color: '#c7d2fe' }}>
                Ekspor data resmi Gemilang untuk dianalisis oleh AI pihak ketiga bersama file mutasi rekening koran BCA Anda.
              </p>
            </div>
          </div>

          {/* Toggle Mode: Multi-Bulan (Range) vs 1-Bulan */}
          <div style={{ display: 'flex', background: 'rgba(255,255,255,0.1)', padding: 3, borderRadius: 10, border: '1px solid rgba(255,255,255,0.15)' }}>
            <button
              type="button"
              onClick={() => setExportMode('rentang')}
              style={{
                border: 'none', borderRadius: 8, padding: '6px 12px', fontSize: 11.5, fontWeight: 800,
                cursor: 'pointer',
                background: exportMode === 'rentang' ? '#38bdf8' : 'transparent',
                color: exportMode === 'rentang' ? '#0f172a' : '#cbd5e1',
                boxShadow: exportMode === 'rentang' ? '0 2px 4px rgba(0,0,0,0.2)' : 'none',
              }}
            >
              📦 Rentang Multi-Bulan (Disarankan)
            </button>
            <button
              type="button"
              onClick={() => setExportMode('bulan')}
              style={{
                border: 'none', borderRadius: 8, padding: '6px 12px', fontSize: 11.5, fontWeight: 800,
                cursor: 'pointer',
                background: exportMode === 'bulan' ? '#38bdf8' : 'transparent',
                color: exportMode === 'bulan' ? '#0f172a' : '#cbd5e1',
                boxShadow: exportMode === 'bulan' ? '0 2px 4px rgba(0,0,0,0.2)' : 'none',
              }}
            >
              📅 1 Bulan ({bulanPilihan})
            </button>
          </div>
        </div>

        {/* Panel Kontrol Rentang Tanggal jika Mode rentang */}
        {exportMode === 'rentang' ? (
          <div style={{ background: 'rgba(255,255,255,0.07)', borderRadius: 12, padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 10, border: '1px solid rgba(255,255,255,0.12)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
              {/* 🏆 TOMBOL RESMI LAPORAN SHU & NERACA RESMI (BER-CAP & LOGO) */}
        <div style={{ marginBottom: 14 }}>
          <button
            type="button"
            onClick={bukaLaporanShuResmi}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              padding: '12px 20px', borderRadius: 12,
              background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)',
              color: '#fbbf24', border: '1.5px solid #f59e0b',
              fontWeight: 800, fontSize: 13, cursor: 'pointer',
              boxShadow: '0 4px 14px rgba(49, 46, 129, 0.35)',
              transition: 'all 0.2s'
            }}
          >
            <span>📜</span> Cetak / Unduh Laporan SHU & Rekonsiliasi Resmi (Ber-Cap Logo Bimbel)
          </button>
          <span style={{ fontSize: 11, color: '#64748b', marginLeft: 12 }}>
            Siap ditunjukkan ke orang tua, investor, maupun tim audit bank (Format A4 resmi).
          </span>
        </div>

        {/* Presets Cepat */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: '#e0e7ff' }}>Pilihan Cepat:</span>
                <button
                  type="button"
                  onClick={() => setPresetRange(3)}
                  style={{ background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.25)', color: '#ffffff', borderRadius: 6, padding: '4px 10px', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}
                >
                  ⚡ 3 Bulan Terakhir
                </button>
                <button
                  type="button"
                  onClick={() => setPresetRange(6)}
                  style={{ background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.25)', color: '#ffffff', borderRadius: 6, padding: '4px 10px', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}
                >
                  ⚡ 6 Bulan Terakhir
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setRangeDari('2026-01');
                    const d = new Date();
                    setRangeSampai(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
                  }}
                  style={{ background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.25)', color: '#ffffff', borderRadius: 6, padding: '4px 10px', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}
                >
                  ⚡ Sepanjang 2026 (Jan - Sekarang)
                </button>
              </div>

              {/* Selector Dari & Sampai */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: '#e0e7ff' }}>Dari:</span>
                <select
                  value={rangeDari}
                  onChange={(e) => setRangeDari(e.target.value)}
                  style={{ background: '#0f172a', color: '#ffffff', border: '1px solid #64748b', borderRadius: 6, padding: '4px 8px', fontSize: 11.5, fontWeight: 700 }}
                >
                  {opsiBulan.map(b => (
                    <option key={`dari-${b.id}`} value={b.id}>{b.label}</option>
                  ))}
                </select>

                <span style={{ fontSize: 11, fontWeight: 700, color: '#e0e7ff' }}>s/d:</span>
                <select
                  value={rangeSampai}
                  onChange={(e) => setRangeSampai(e.target.value)}
                  style={{ background: '#0f172a', color: '#ffffff', border: '1px solid #64748b', borderRadius: 6, padding: '4px 8px', fontSize: 11.5, fontWeight: 700 }}
                >
                  {opsiBulan.map(b => (
                    <option key={`sampai-${b.id}`} value={b.id}>{b.label}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Statistik Ringkas Rentang Terpilih */}
            <div style={{ fontSize: 11.5, color: '#bae6fd', display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: 8 }}>
              <span>📊 <b>{logsDalamRentang.length}</b> Transaksi Terbuku</span>
              <span>•</span>
              <span style={{ color: '#86efac' }}>Masuk: <b>{formatRp(statsRentang.masuk)}</b></span>
              <span>•</span>
              <span style={{ color: '#fca5a5' }}>Keluar: <b>{formatRp(statsRentang.keluar)}</b></span>
              <span>•</span>
              <span>Sesi Guru: <b>{teacherLogsDalamRentang.length} sesi</b> ({formatRp(statsRentang.honorGuru)})</span>
            </div>
          </div>
        ) : (
          <div style={{ fontSize: 12, color: '#bae6fd' }}>
            Mode aktif: mengekspor khusus data resmi bulan <b>{bulanPilihan}</b> ({semuaLogsBulanIni.length} transaksi terbuku).
          </div>
        )}

        {/* Tombol Aksi Unduh */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={handleUnduhUntukAI}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              background: '#38bdf8', color: '#0f172a', border: 'none',
              padding: '10px 18px', borderRadius: 10, fontSize: 13, fontWeight: 800,
              cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.25)',
            }}
            title="Unduh file teks komprehensif lengkap dengan prompt instruksi untuk NotebookLM, Claude, atau ChatGPT"
          >
            <FileText size={16} /> Unduh Laporan untuk AI (NotebookLM) (.txt)
          </button>

          <button
            type="button"
            onClick={handleUnduhCSV}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              background: '#10b981', color: 'white', border: 'none',
              padding: '10px 18px', borderRadius: 10, fontSize: 13, fontWeight: 800,
              cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.25)',
            }}
            title="Unduh spreadsheet CSV untuk dibuka di Excel atau Google Sheets"
          >
            <FileSpreadsheet size={16} /> Unduh CSV (Excel)
          </button>

          <button
            type="button"
            onClick={handleSalinPrompt}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              background: 'rgba(255,255,255,0.15)', color: 'white', border: '1px solid rgba(255,255,255,0.3)',
              padding: '10px 16px', borderRadius: 10, fontSize: 12.5, fontWeight: 700,
              cursor: 'pointer',
            }}
            title="Salin rekap data ke clipboard untuk paste langsung di chat AI"
          >
            {copiedPrompt ? <Check size={15} color="#34d399" /> : <Copy size={15} />}
            {copiedPrompt ? 'Prompt AI Tersalin!' : 'Salin Prompt AI'}
          </button>
        </div>
      </div>

      {/* 5. TABEL DAFTAR TRANSAKSI DENGAN CHECKLIST REKONSILIASI */}
      <div style={{
        background: '#ffffff', borderRadius: 16, padding: '20px 24px', border: '1px solid #e2e8f0',
      }}>
        {/* Header Tabel & Tab Filter Metode */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, marginBottom: 16 }}>
          <div>
            <h4 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: '#0f172a' }}>
              Daftar Transaksi Bulan {bulanPilihan} ({logsDitampilkan.length} Data)
            </h4>
            <p style={{ margin: '2px 0 0', fontSize: 12, color: '#64748b' }}>
              Periksa baris demi baris terhadap mutasi rekening Anda. Ketuk tombol checklist jika sudah sesuai.
            </p>
          </div>

          {/* Tab Filter: Bank vs Tunai vs Semua */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#f1f5f9', padding: '4px', borderRadius: 10 }}>
            <button
              type="button"
              onClick={() => setFilterKanal('bank')}
              style={{
                padding: '6px 12px', borderRadius: 8, border: 'none', fontSize: 12, fontWeight: 800,
                background: filterKanal === 'bank' ? '#ffffff' : 'transparent',
                color: filterKanal === 'bank' ? '#2563eb' : '#64748b',
                boxShadow: filterKanal === 'bank' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
              }}
            >
              <CreditCard size={14} /> Mutasi Bank ({bankLogsBulanIni.length})
            </button>
            <button
              type="button"
              onClick={() => setFilterKanal('tunai')}
              style={{
                padding: '6px 12px', borderRadius: 8, border: 'none', fontSize: 12, fontWeight: 800,
                background: filterKanal === 'tunai' ? '#ffffff' : 'transparent',
                color: filterKanal === 'tunai' ? '#d97706' : '#64748b',
                boxShadow: filterKanal === 'tunai' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
              }}
            >
              <Wallet size={14} /> Kas Tunai ({tunaiLogsBulanIni.length})
            </button>
            <button
              type="button"
              onClick={() => setFilterKanal('semua')}
              style={{
                padding: '6px 12px', borderRadius: 8, border: 'none', fontSize: 12, fontWeight: 800,
                background: filterKanal === 'semua' ? '#ffffff' : 'transparent',
                color: filterKanal === 'semua' ? '#0f172a' : '#64748b',
                boxShadow: filterKanal === 'semua' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
              }}
            >
              <Layers size={14} /> Semua ({semuaLogsBulanIni.length})
            </button>
          </div>
        </div>

        {/* Bar Progres Audit Khusus Bank */}
        {filterKanal === 'bank' && bankLogsBulanIni.length > 0 && (
          <div style={{
            background: statsAudit.persen === 100 ? '#f0fdf4' : '#f8fafc',
            border: statsAudit.persen === 100 ? '1px solid #86efac' : '1px solid #e2e8f0',
            borderRadius: 12, padding: '12px 16px', marginBottom: 16,
            display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{
                width: 32, height: 32, borderRadius: '50%',
                background: statsAudit.persen === 100 ? '#dcfce7' : '#eff6ff',
                color: statsAudit.persen === 100 ? '#16a34a' : '#2563eb',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 12,
              }}>
                {statsAudit.persen}%
              </div>
              <div>
                <span style={{ fontSize: 12.5, fontWeight: 800, color: statsAudit.persen === 100 ? '#166534' : '#1e293b' }}>
                  {statsAudit.persen === 100
                    ? `🎉 Seluruh ${statsAudit.total} mutasi bank bulan ${bulanPilihan} sudah 100% cocok dengan m-Banking!`
                    : `Progres Audit: ${statsAudit.cocok} dari ${statsAudit.total} mutasi bank sudah dicocokkan`}
                </span>
                <div style={{ fontSize: 11, color: '#64748b' }}>
                  {statsAudit.sisa > 0 ? `Masih ada ${statsAudit.sisa} transaksi yang belum Anda tandai cocok.` : 'Buku bank siap untuk tutup buku.'}
                </div>
              </div>
            </div>

            {statsAudit.persen < 100 && (
              <button
                type="button"
                onClick={handleTandaiSemuaCocok}
                style={{
                  padding: '6px 12px', borderRadius: 8, border: '1px solid #2563eb',
                  background: '#eff6ff', color: '#1d4ed8', fontSize: 11.5, fontWeight: 800,
                  cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
                }}
              >
                <Check size={14} /> Tandai Semua Cocok Sekaligus
              </button>
            )}
          </div>
        )}

        {/* Pencarian Cepat */}
        <div style={{ marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ position: 'relative', flex: 1, maxWidth: 360 }}>
            <Search size={14} color="#94a3b8" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)' }} />
            <input
              type="text"
              placeholder="Cari transaksi, nama siswa, atau nominal..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%', padding: '6px 10px 6px 32px', borderRadius: 8,
                border: '1px solid #cbd5e1', fontSize: 12, outline: 'none',
              }}
            />
          </div>
        </div>

        {/* Tabel Data */}
        {logsDitampilkan.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 20px', color: '#94a3b8', fontSize: 13 }}>
            Belum ada transaksi {filterKanal === 'bank' ? 'rekening bank' : filterKanal === 'tunai' ? 'kas tunai' : ''} yang tercatat untuk bulan {bulanPilihan}.<br />
            Gunakan form di atas untuk mencatat mutasi transfer m-banking Anda.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.5 }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0', color: '#475569', textAlign: 'left' }}>
                  <th style={{ padding: '10px 12px' }}>Tanggal</th>
                  <th style={{ padding: '10px 12px' }}>Metode</th>
                  <th style={{ padding: '10px 12px' }}>Kategori</th>
                  <th style={{ padding: '10px 12px' }}>Keterangan</th>
                  <th style={{ padding: '10px 12px', textAlign: 'right' }}>Masuk (+)</th>
                  <th style={{ padding: '10px 12px', textAlign: 'right' }}>Keluar (-)</th>
                  <th style={{ padding: '10px 12px', textAlign: 'center' }}>Checklist m-Banking</th>
                  <th style={{ padding: '10px 12px', textAlign: 'center' }}>Hapus</th>
                </tr>
              </thead>
              <tbody>
                {logsDitampilkan.map((l) => {
                  const isMasuk = l.type === 'Pemasukan' || (l.type === 'Transfer' && l.kanalKe === KANAL.BANK);
                  const isBank = l.kanal === KANAL.BANK || l.kanal === KANAL.KAS_OWNER || l.method === 'Transfer';
                  const nominal = parseInt(l.amount || 0, 10) || 0;
                  const isCocok = l.statusAudit === 'cocok' || l.statusRekonsiliasi === 'cocok';

                  return (
                    <tr
                      key={l.id}
                      style={{
                        borderBottom: '1px solid #f1f5f9',
                        background: isCocok ? '#fafdfb' : '#ffffff',
                      }}
                    >
                      <td style={{ padding: '10px 12px', fontWeight: 600, color: '#334155', whiteSpace: 'nowrap' }}>
                        {l.date}
                      </td>

                      <td style={{ padding: '10px 12px', whiteSpace: 'nowrap' }}>
                        {isBank ? (
                          <span style={{
                            padding: '3px 8px', borderRadius: 6, fontSize: 11, fontWeight: 700,
                            background: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe',
                          }}>
                            🏦 Transfer
                          </span>
                        ) : (
                          <span style={{
                            padding: '3px 8px', borderRadius: 6, fontSize: 11, fontWeight: 700,
                            background: '#fef3c7', color: '#92400e', border: '1px solid #fde68a',
                          }}>
                            💵 Tunai
                          </span>
                        )}
                      </td>

                      <td style={{ padding: '10px 12px' }}>
                        <span style={{
                          padding: '3px 8px', borderRadius: 6, fontSize: 11, fontWeight: 700,
                          background: isMasuk ? '#f0fdf4' : '#fef2f2',
                          color: isMasuk ? '#166534' : '#991b1b',
                        }}>
                          {l.category || l.type}
                        </span>
                      </td>

                      <td style={{ padding: '10px 12px', color: '#475569' }}>
                        <div>{l.note || '-'}</div>
                        {l.namaSiswa && (
                          <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>
                            Siswa: {l.namaSiswa}
                          </div>
                        )}
                        {(() => {
                          const rekLabel = l.refTransfer
                            ? `Rek: ${l.refTransfer}`
                            : (l.note && l.note.includes('[Rek')
                                ? l.note.substring(l.note.indexOf('[Rek') + 1, l.note.indexOf(']', l.note.indexOf('[Rek')))
                                : null);
                          return rekLabel ? (
                            <div style={{ marginTop: 4 }}>
                              <span style={{
                                display: 'inline-flex', alignItems: 'center', gap: 4,
                                background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 6,
                                padding: '2px 7px', fontSize: 10.5, fontWeight: 700, color: '#1e40af',
                              }}>
                                💳 {rekLabel}
                              </span>
                            </div>
                          ) : null;
                        })()}

                        {l.buktiUrl && (
                          <div style={{ marginTop: 4 }}>
                            <button
                              type="button"
                              onClick={() => setPreviewBukti(l.buktiUrl)}
                              style={{
                                display: 'inline-flex', alignItems: 'center', gap: 3,
                                padding: '2px 7px', borderRadius: 4,
                                background: '#eff6ff', border: '1px solid #bfdbfe',
                                color: '#1d4ed8', fontSize: 10, fontWeight: 700, cursor: 'pointer'
                              }}
                              title="Lihat foto bukti transfer"
                            >
                              📎 Bukti Transfer
                            </button>
                          </div>
                        )}
                      </td>

                      <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 800, color: '#16a34a', whiteSpace: 'nowrap' }}>
                        {isMasuk ? formatRp(nominal) : '-'}
                      </td>

                      <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 800, color: '#dc2626', whiteSpace: 'nowrap' }}>
                        {!isMasuk ? formatRp(nominal) : '-'}
                      </td>

                      {/* Tombol Checklist Interaktif */}
                      <td style={{ padding: '10px 12px', textAlign: 'center', whiteSpace: 'nowrap' }}>
                        <button
                          type="button"
                          onClick={() => handleToggleAudit(l.id, isCocok)}
                          style={{
                            padding: '4px 10px', borderRadius: 8, fontSize: 11, fontWeight: 800,
                            border: isCocok ? '1px solid #86efac' : '1px solid #cbd5e1',
                            background: isCocok ? '#dcfce7' : '#f8fafc',
                            color: isCocok ? '#166534' : '#64748b',
                            cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 5,
                          }}
                          title="Klik untuk mengubah status kecocokan"
                        >
                          {isCocok ? (
                            <>
                              <CheckCircle2 size={13} color="#16a34a" /> Cocok
                            </>
                          ) : (
                            <>
                              <span style={{ width: 12, height: 12, borderRadius: '50%', border: '1.5px solid #94a3b8', display: 'inline-block' }} />
                              Tandai Cocok
                            </>
                          )}
                        </button>
                      </td>

                      <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                        <button
                          type="button"
                          onClick={() => handleHapusLog(l.id, l.category || l.note, nominal)}
                          style={{
                            background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '4px',
                          }}
                          title="Hapus baris ini jika salah input"
                        >
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    
      {/* MODAL PREVIEW BUKTI TRANSFER OWNER */}
      {previewBukti && (
        <div
          onClick={() => setPreviewBukti(null)}
          style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(15, 23, 42, 0.75)', zIndex: 9999,
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: 'white', borderRadius: 16, padding: 20, maxWidth: 500, width: '100%',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.3)', textAlign: 'center'
            }}
          >
            <h4 style={{ margin: '0 0 12px 0', color: '#1e293b', fontSize: 15 }}>📎 Foto Bukti Transfer</h4>
            <div style={{ maxHeight: '70vh', overflowY: 'auto', marginBottom: 14 }}>
              <img
                src={previewBukti}
                alt="Bukti Transfer"
                style={{ width: '100%', height: 'auto', borderRadius: 10, border: '1px solid #e2e8f0' }}
              />
            </div>
            <button
              type="button"
              onClick={() => setPreviewBukti(null)}
              style={{
                padding: '8px 24px', background: '#1e293b', color: 'white',
                border: 'none', borderRadius: 8, fontWeight: 700, cursor: 'pointer'
              }}
            >
              Tutup Preview
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
