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
  ChevronLeft, ChevronRight, Check, Search, Filter, Layers, CreditCard
} from 'lucide-react';
import { KANAL } from '../../../utils/kanalUang';
import { rp as defaultRp } from '../manajemen/manajemenUtils';

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
  const [savingLog, setSavingLog] = useState(false);

  // State 1-Klik Pembukuan Gaji
  const [nominalGajiTentorCustom, setNominalGajiTentorCustom] = useState('');
  const [processingGaji, setProcessingGaji] = useState(false);

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
      await addDoc(collection(db, 'finance_logs'), {
        type: formTipe,
        date: formTanggal,
        category: formKategori,
        amount: nominal,
        method: formMetode,
        kanal: kanalDipilih,
        note: formKeterangan.trim() || `${formKategori} (${formMetode === 'Transfer' ? 'm-Banking Owner' : 'Kasir Tunai'})`,
        statusAudit: 'cocok', // Otomatis cocok karena langsung disalin dari mutasi bank riil
        statusRekonsiliasi: 'cocok',
        dicatatOleh: 'Owner (Audit Mandiri)',
        createdAt: serverTimestamp(),
      });

      setFormNominal('');
      setFormKeterangan('');
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
                  <input
                    type="number"
                    placeholder={`Contoh: ${rekapTentorBulanIni.totalNominalEstimasi || 4500000}`}
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
                <input
                  type="number"
                  placeholder="Nominal Rp (mis: 350000)"
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
        </form>
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
    </div>
  );
}
