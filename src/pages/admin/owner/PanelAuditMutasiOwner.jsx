// src/pages/admin/owner/PanelAuditMutasiOwner.jsx
// ============================================================
// PUSAT AUDIT & BUKU MUTASI BANK OWNER (m-Banking)
// Dibuat khusus untuk Founder/Owner Bimbel Gemilang:
// 1. Audit Cepat 3 Bulan Terakhir (September, Oktober, November)
// 2. Pencatatan 1-Klik Gaji Tentor (~4-6 jt) & Gaji Admin (~1 jt) dari m-Banking
// 3. Form Cepat Mutasi m-Banking (10 Detik dari HP)
// 4. Kalkulator "Dana Bebas Hak Owner" (Anti-Takut Menggaji Diri Sendiri)
// ============================================================

import React, { useState, useMemo } from 'react';
import { db } from '../../../firebase';
import {
  collection, doc, addDoc, deleteDoc, updateDoc, writeBatch, serverTimestamp,
} from 'firebase/firestore';
import {
  Wallet, ShieldCheck, CheckCircle2, AlertTriangle, RefreshCw,
  PlusCircle, Trash2, Calendar, DollarSign, ArrowRight, ArrowDownRight,
  ArrowUpRight, Sparkles, Building2, UserCheck, HelpCircle, Lock
} from 'lucide-react';
import { KANAL } from '../../../utils/kanalUang';
import { rp as defaultRp } from '../manajemen/manajemenUtils';

const KATEGORI_PILIHAN = [
  { id: 'Gaji Guru/Staf', label: '👨‍🏫 Gaji Tentor', defaultKeluar: true },
  { id: 'Gaji Admin', label: '💼 Gaji Admin', defaultKeluar: true },
  { id: 'Gaji Owner (Prive)', label: '👑 Gaji Owner (Prive Pribadi)', defaultKeluar: true },
  { id: 'Listrik & WiFi', label: '⚡ Listrik & WiFi', defaultKeluar: true },
  { id: 'Sewa Tempat', label: '🏢 Sewa Tempat', defaultKeluar: true },
  { id: 'Marketing/Iklan', label: '📢 Marketing & Iklan', defaultKeluar: true },
  { id: 'Setor Kas dari Brankas', label: '💵 Setoran Tunai dari Brankas', defaultKeluar: false },
  { id: 'SPP Siswa (Transfer)', label: '🎓 SPP Siswa (Transfer Bank)', defaultKeluar: false },
  { id: 'Operasional Lainnya', label: '📦 Operasional Lainnya', defaultKeluar: true },
];

export default function PanelAuditMutasiOwner({
  logs = [],
  teacherLogs = [],
  students = [],
  rp: rpProp,
  isMobile = false,
}) {
  const formatRp = rpProp || defaultRp;

  // Pemilih Bulan Audit (Default: Bulan Berjalan)
  const [bulanPilihan, setBulanPilihan] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });

  // State Form Cepat Mutasi m-Banking
  const [formTanggal, setFormTanggal] = useState(() => new Date().toISOString().slice(0, 10));
  const [formTipe, setFormTipe] = useState('Pengeluaran'); // 'Pengeluaran' | 'Pemasukan'
  const [formKategori, setFormKategori] = useState('Gaji Guru/Staf');
  const [formNominal, setFormNominal] = useState('');
  const [formKeterangan, setFormKeterangan] = useState('');
  const [savingLog, setSavingLog] = useState(false);

  // State 1-Klik Pembukuan Gaji
  const [nominalGajiTentorCustom, setNominalGajiTentorCustom] = useState('');
  const [processingGaji, setProcessingGaji] = useState(false);

  // 1. Filter Log Transaksi Bank untuk Bulan Terpilih
  const logsBulanIni = useMemo(() => {
    return logs.filter((l) => {
      const d = String(l.date || '');
      if (!d.startsWith(bulanPilihan)) return false;
      // Ambil transaksi rekening bank bimbel atau kas owner
      return l.kanal === KANAL.BANK || l.kanal === KANAL.KAS_OWNER || l.method === 'Transfer';
    }).sort((a, b) => String(b.date || '').localeCompare(String(a.date || '')));
  }, [logs, bulanPilihan]);

  // 2. Hitung Rekap Finansial Bulan Terpilih
  const rekapBulan = useMemo(() => {
    let totalMasuk = 0;
    let totalKeluar = 0;
    let gajiTentorTerbuku = 0;
    let gajiAdminTerbuku = 0;
    let priveOwnerTerbuku = 0;

    logsBulanIni.forEach((l) => {
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
  }, [logsBulanIni]);

  // 3. Rekap Sesi Mengajar Tentor Khusus Bulan Terpilih
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

  // 4. Kalkulator Dana Bebas Hak Owner
  const kalkulatorDanaBebas = useMemo(() => {
    // Estimasi kewajiban gaji tentor yang masih harus ditahan di rekening jika belum dibayar
    const kewajibanGajiTentorTahan = rekapBulan.sudahAdaGajiTentor ? 0 : (rekapTentorBulanIni.totalNominalEstimasi || 4500000);
    const kewajibanGajiAdminTahan = rekapBulan.sudahAdaGajiAdmin ? 0 : 1000000;
    const cadanganDarurat = 1500000; // Buffer operasional Rp 1,5 juta

    // Dana bersih riil yang aman diambil owner
    const danaBebasAman = Math.max(
      0,
      rekapBulan.totalMasuk - (rekapBulan.totalKeluar + kewajibanGajiTentorTahan + kewajibanGajiAdminTahan) - cadanganDarurat
    );

    return {
      kewajibanGajiTentorTahan,
      kewajibanGajiAdminTahan,
      cadanganDarurat,
      danaBebasAman,
    };
  }, [rekapBulan, rekapTentorBulanIni]);

  // AKSI 1: Simpan Transaksi m-Banking Manual Cepat
  const handleSimpanTransaksiManual = async (e) => {
    e.preventDefault();
    const nominal = parseInt(formNominal, 10) || 0;
    if (nominal <= 0) {
      alert('⚠️ Masukkan nominal transaksi!');
      return;
    }

    setSavingLog(true);
    try {
      await addDoc(collection(db, 'finance_logs'), {
        type: formTipe,
        date: formTanggal,
        category: formKategori,
        amount: nominal,
        method: 'Transfer',
        kanal: KANAL.BANK,
        note: formKeterangan.trim() || `${formKategori} (m-Banking Owner)`,
        createdAt: serverTimestamp(),
      });

      setFormNominal('');
      setFormKeterangan('');
      alert(`✅ Transaksi ${formKategori} sebesar ${formatRp(nominal)} berhasil dicatat di buku bank!`);
    } catch (err) {
      console.error('Gagal mencatat mutasi bank:', err);
      alert('Gagal menyimpan transaksi: ' + err.message);
    } finally {
      setSavingLog(false);
    }
  };

  // AKSI 2: 1-Klik Bukukan Gaji Tentor Bulan Ini
  const handleBukukanGajiTentor = async () => {
    const nominalRiil = parseInt(nominalGajiTentorCustom, 10) || rekapTentorBulanIni.totalNominalEstimasi || 4500000;
    const konfirmasi = window.confirm(
      `Konfirmasi Pembukuan Gaji Tentor Bulan ${bulanPilihan}:\n\n` +
      `Nominal yang akan dicatat: ${formatRp(nominalRiil)}\n` +
      `Kategori: Gaji Guru/Staf (Rekening Bank Bimbel)\n\n` +
      `Lanjutkan penyimpanan?`
    );
    if (!konfirmasi) return;

    setProcessingGaji(true);
    try {
      const today = new Date().toISOString().slice(0, 10);
      const batch = writeBatch(db);

      // 1. Buat log pengeluaran resmi
      const logRef = doc(collection(db, 'finance_logs'));
      batch.set(logRef, {
        type: 'Pengeluaran',
        date: `${bulanPilihan}-28`,
        category: 'Gaji Guru/Staf',
        amount: nominalRiil,
        method: 'Transfer',
        kanal: KANAL.BANK,
        note: `Transfer Gaji Tentor Bulan ${bulanPilihan} via m-Banking (${rekapTentorBulanIni.totalSesi} sesi)`,
        createdAt: serverTimestamp(),
      });

      // 2. Tandai sesi-sesi bulan tersebut Lunas
      rekapTentorBulanIni.logIds.forEach((id) => {
        batch.update(doc(db, 'teacher_logs', id), {
          statusDibayar: 'Lunas',
          tanggalDibayar: today,
        });
      });

      await batch.commit();
      setNominalGajiTentorCustom('');
      alert(`✅ Berhasil! Gaji tentor bulan ${bulanPilihan} sebesar ${formatRp(nominalRiil)} resmi dibukukan.`);
    } catch (err) {
      console.error('Gagal bukukan gaji tentor:', err);
      alert('Gagal membukukan gaji tentor: ' + err.message);
    } finally {
      setProcessingGaji(false);
    }
  };

  // AKSI 3: 1-Klik Bukukan Gaji Admin Rp 1.000.000
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
        createdAt: serverTimestamp(),
      });
      alert(`✅ Berhasil! Gaji admin bulan ${bulanPilihan} sebesar Rp 1.000.000 resmi dibukukan.`);
    } catch (err) {
      console.error('Gagal bukukan gaji admin:', err);
      alert('Gagal: ' + err.message);
    }
  };

  // AKSI 4: Hapus Log (Jika salah input)
  const handleHapusLog = async (logId, ket, nominal) => {
    if (!window.confirm(`Hapus catatan transaksi: ${ket} (${formatRp(nominal)})?`)) return;
    try {
      await deleteDoc(doc(db, 'finance_logs', logId));
    } catch (err) {
      alert('Gagal menghapus: ' + err.message);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* 1. BAR PEMILIH BULAN AUDIT & NAVIGASI CEPAT */}
      <div style={{
        background: '#ffffff', borderRadius: 16, padding: '18px 24px',
        border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between',
        alignItems: 'center', flexWrap: 'wrap', gap: 14, boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 42, height: 42, borderRadius: 12, background: '#eff6ff', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Wallet size={22} />
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: '#0f172a' }}>
              Pusat Audit & Rekonsiliasi m-Banking Owner
            </h3>
            <p style={{ margin: '2px 0 0', fontSize: 12, color: '#64748b' }}>
              Pencocokan mutasi rekening bank bimbel per bulan secara mandiri dan transparan
            </p>
          </div>
        </div>

        {/* Dropdown Bulan Pilihan */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: '#475569' }}>Pilih Bulan Audit:</span>
          <select
            value={bulanPilihan}
            onChange={(e) => setBulanPilihan(e.target.value)}
            style={{
              padding: '8px 14px', borderRadius: 10, border: '2px solid #3b82f6',
              fontSize: 13, fontWeight: 800, color: '#1e3a8a', background: '#eff6ff', cursor: 'pointer',
            }}
          >
            <option value="2026-11">November 2026 (Bulan Berjalan)</option>
            <option value="2026-10">Oktober 2026 (Bulan Lalu)</option>
            <option value="2026-09">September 2026 (2 Bulan Lalu)</option>
            <option value="2026-08">Agustus 2026</option>
            <option value="2026-07">Juli 2026</option>
          </select>
        </div>
      </div>

      {/* 2. KALKULATOR "DANA BEBAS OWNER (ANTI-TAKUT)" & KAS RIIL BULAN TERPILIH */}
      <div style={{
        background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
        borderRadius: 20, padding: '24px', color: 'white',
        boxShadow: '0 10px 25px rgba(15,23,42,0.25)',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16, marginBottom: 20 }}>
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(251,191,36,0.15)', border: '1px solid rgba(251,191,36,0.3)', color: '#fbbf24', padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 800, marginBottom: 6 }}>
              <ShieldCheck size={13} /> FORMULA KETENANGAN JIWA OWNER
            </div>
            <h4 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: '#ffffff' }}>
              Posisi Kas Rekening Bank: Bulan {bulanPilihan}
            </h4>
            <p style={{ margin: '4px 0 0', fontSize: 12.5, color: '#94a3b8' }}>
              Menghitung hak laba bersih Anda secara matematis agar tidak ada rasa bersalah saat mengambil gaji pribadi.
            </p>
          </div>

          <div style={{
            background: 'rgba(16,185,129,0.15)', border: '1px solid #10b981',
            borderRadius: 14, padding: '12px 18px', textAlign: 'right',
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

        {/* 4 Angka Komponen */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(4, 1fr)',
          gap: 12, borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: 16,
        }}>
          <div>
            <span style={{ fontSize: 11, color: '#94a3b8' }}>1. Total Uang Masuk Bank:</span>
            <div style={{ fontSize: 16, fontWeight: 800, color: '#60a5fa', marginTop: 2 }}>
              {formatRp(rekapBulan.totalMasuk)}
            </div>
            <span style={{ fontSize: 10, color: '#64748b' }}>SPP transfer + setor kas</span>
          </div>

          <div>
            <span style={{ fontSize: 11, color: '#94a3b8' }}>2. Pengeluaran Terbuku:</span>
            <div style={{ fontSize: 16, fontWeight: 800, color: '#f87171', marginTop: 2 }}>
              {formatRp(rekapBulan.totalKeluar)}
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
            <span style={{ fontSize: 11, color: '#94a3b8' }}>4. Laba Bersih Bulan Ini:</span>
            <div style={{ fontSize: 16, fontWeight: 800, color: rekapBulan.netProfitBulan >= 0 ? '#34d399' : '#f87171', marginTop: 2 }}>
              {formatRp(rekapBulan.netProfitBulan)}
            </div>
            <span style={{ fontSize: 10, color: '#64748b' }}>Uang Masuk - Pengeluaran</span>
          </div>
        </div>
      </div>

      {/* 3. AUDIT KILAT GAJI TENTOR & ADMIN BULAN TERPILIH */}
      <div style={{
        background: '#ffffff', borderRadius: 16, padding: '24px', border: '1px solid #e2e8f0',
      }}>
        <h4 style={{ margin: '0 0 6px', fontSize: 16, fontWeight: 800, color: '#0f172a' }}>
          Audit Gaji Tentor & Admin Bulan {bulanPilihan}
        </h4>
        <p style={{ margin: '0 0 16px', fontSize: 12.5, color: '#64748b' }}>
          Cocokkan dengan bukti mutasi keluar di m-banking Anda di akhir bulan (tanggal 28–31).
        </p>

        <div style={{
          display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 16,
        }}>
          {/* KOTAK A: GAJI TENTOR */}
          <div style={{
            padding: '18px', borderRadius: 14,
            border: rekapBulan.sudahAdaGajiTentor ? '2px solid #86efac' : '2px solid #fde047',
            background: rekapBulan.sudahAdaGajiTentor ? '#f0fdf4' : '#fffbeb',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <span style={{ fontSize: 13, fontWeight: 800, color: '#0f172a' }}>
                👨‍🏫 Gaji Tentor Bulan {bulanPilihan}
              </span>
              <span style={{
                fontSize: 10.5, fontWeight: 800, padding: '3px 8px', borderRadius: 6,
                background: rekapBulan.sudahAdaGajiTentor ? '#dcfce7' : '#fef08a',
                color: rekapBulan.sudahAdaGajiTentor ? '#166534' : '#854d0e',
              }}>
                {rekapBulan.sudahAdaGajiTentor ? '✓ SUDAH TERCATAT' : '⚠️ BELUM TERCATAT'}
              </span>
            </div>

            {rekapBulan.sudahAdaGajiTentor ? (
              <div style={{ fontSize: 13, color: '#166534', lineHeight: 1.6 }}>
                Gaji tentor bulan ini sudah tercatat sebesar <b>{formatRp(rekapBulan.gajiTentorTerbuku)}</b>. Data pembukuan tentor sudah sinkron!
              </div>
            ) : (
              <div>
                <p style={{ fontSize: 12, color: '#713f12', margin: '0 0 10px', lineHeight: 1.5 }}>
                  Terdeteksi <b>{rekapTentorBulanIni.totalSesi} sesi mengajar</b> di sistem (estimasi <b>{formatRp(rekapTentorBulanIni.totalNominalEstimasi)}</b>). Masukkan nominal mutasi riil transfer m-banking Anda:
                </p>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input
                    type="number"
                    placeholder={`Contoh: ${rekapTentorBulanIni.totalNominalEstimasi || 4500000}`}
                    value={nominalGajiTentorCustom}
                    onChange={(e) => setNominalGajiTentorCustom(e.target.value)}
                    style={{ flex: 1, padding: '8px 12px', borderRadius: 8, border: '1px solid #d97706', fontSize: 13, fontWeight: 700 }}
                  />
                  <button
                    type="button"
                    onClick={handleBukukanGajiTentor}
                    disabled={processingGaji}
                    style={{
                      background: '#d97706', color: 'white', border: 'none', padding: '8px 14px',
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
            padding: '18px', borderRadius: 14,
            border: rekapBulan.sudahAdaGajiAdmin ? '2px solid #86efac' : '2px solid #fde047',
            background: rekapBulan.sudahAdaGajiAdmin ? '#f0fdf4' : '#fffbeb',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <span style={{ fontSize: 13, fontWeight: 800, color: '#0f172a' }}>
                💼 Gaji Admin Bulan {bulanPilihan}
              </span>
              <span style={{
                fontSize: 10.5, fontWeight: 800, padding: '3px 8px', borderRadius: 6,
                background: rekapBulan.sudahAdaGajiAdmin ? '#dcfce7' : '#fef08a',
                color: rekapBulan.sudahAdaGajiAdmin ? '#166534' : '#854d0e',
              }}>
                {rekapBulan.sudahAdaGajiAdmin ? '✓ SUDAH TERCATAT' : '⚠️ BELUM TERCATAT'}
              </span>
            </div>

            {rekapBulan.sudahAdaGajiAdmin ? (
              <div style={{ fontSize: 13, color: '#166534', lineHeight: 1.6 }}>
                Gaji admin bulan ini sudah tercatat sebesar <b>{formatRp(rekapBulan.gajiAdminTerbuku)}</b>.
              </div>
            ) : (
              <div>
                <p style={{ fontSize: 12, color: '#713f12', margin: '0 0 12px', lineHeight: 1.5 }}>
                  Gaji admin reguler sebesar <b>Rp 1.000.000</b> belum tercatat di buku bank bulan ini.
                </p>
                <button
                  type="button"
                  onClick={handleBukukanGajiAdmin}
                  style={{
                    background: '#2563eb', color: 'white', border: 'none', padding: '9px 16px',
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

      {/* 4. FORM CEPAT CATAT MUTASI m-BANKING LAINNYA (10 DETIK) */}
      <div style={{
        background: '#ffffff', borderRadius: 16, padding: '24px', border: '1px solid #e2e8f0',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
          <PlusCircle size={18} color="#2563eb" />
          <h4 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: '#0f172a' }}>
            Form Cepat Catat Mutasi Rekening Bank (m-Banking)
          </h4>
        </div>

        <form onSubmit={handleSimpanTransaksiManual} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Pilihan Cepat Kategori */}
          <div>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#475569', marginBottom: 6 }}>
              PILIH KATEGORI TRANSAKSI:
            </label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
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
                      padding: '6px 12px', borderRadius: 20, fontSize: 12, fontWeight: 700,
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

          <div style={{
            display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '130px 180px 1fr 140px', gap: 10, alignItems: 'flex-end',
          }}>
            <div>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#475569', marginBottom: 4 }}>
                Jenis:
              </label>
              <select
                value={formTipe}
                onChange={(e) => setFormTipe(e.target.value)}
                style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 12.5, fontWeight: 700 }}
              >
                <option value="Pengeluaran">💸 Pengeluaran (-)</option>
                <option value="Pemasukan">💰 Pemasukan (+)</option>
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
                style={{ width: '100%', padding: '7px 10px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 12.5 }}
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
                  placeholder="Nominal Rp (mis: 150000)"
                  value={formNominal}
                  onChange={(e) => setFormNominal(e.target.value)}
                  style={{ width: '170px', padding: '8px 10px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 13, fontWeight: 800 }}
                  required
                />
                <input
                  type="text"
                  placeholder="Keterangan singkat (mis: Bayar WiFi Indihome)"
                  value={formKeterangan}
                  onChange={(e) => setFormKeterangan(e.target.value)}
                  style={{ flex: 1, padding: '8px 10px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 12.5 }}
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={savingLog}
                style={{
                  width: '100%', padding: '9px 16px', borderRadius: 8, border: 'none',
                  background: '#2563eb', color: 'white', fontWeight: 800, fontSize: 13,
                  cursor: savingLog ? 'wait' : 'pointer',
                }}
              >
                {savingLog ? 'Menyimpan...' : '💾 Simpan Catatan'}
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* 5. TABEL DAFTAR MUTASI BANK BULAN TERPILIH */}
      <div style={{
        background: '#ffffff', borderRadius: 16, padding: '24px', border: '1px solid #e2e8f0',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h4 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: '#0f172a' }}>
            Buku Transaksi Rekening Bank: Bulan {bulanPilihan} ({logsBulanIni.length} Transaksi)
          </h4>
          <span style={{ fontSize: 12, color: '#64748b' }}>
            Hanya menampilkan mutasi rekening bimbel & kas owner
          </span>
        </div>

        {logsBulanIni.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '36px', color: '#94a3b8', fontSize: 13 }}>
            Belum ada mutasi bank yang tercatat untuk bulan {bulanPilihan}.<br />
            Gunakan form di atas untuk mencatat mutasi transfer m-banking Anda.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.5 }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0', color: '#475569', textAlign: 'left' }}>
                  <th style={{ padding: '10px 12px' }}>Tanggal</th>
                  <th style={{ padding: '10px 12px' }}>Kategori</th>
                  <th style={{ padding: '10px 12px' }}>Keterangan</th>
                  <th style={{ padding: '10px 12px', textAlign: 'right' }}>Pemasukan (+)</th>
                  <th style={{ padding: '10px 12px', textAlign: 'right' }}>Pengeluaran (-)</th>
                  <th style={{ padding: '10px 12px', textAlign: 'center' }}>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {logsBulanIni.map((l) => {
                  const isMasuk = l.type === 'Pemasukan' || (l.type === 'Transfer' && l.kanalKe === KANAL.BANK);
                  const nominal = parseInt(l.amount || 0, 10) || 0;
                  return (
                    <tr key={l.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '10px 12px', fontWeight: 600, color: '#334155' }}>{l.date}</td>
                      <td style={{ padding: '10px 12px' }}>
                        <span style={{
                          padding: '3px 8px', borderRadius: 6, fontSize: 11, fontWeight: 700,
                          background: isMasuk ? '#f0fdf4' : '#fef2f2',
                          color: isMasuk ? '#166534' : '#991b1b',
                        }}>
                          {l.category || l.type}
                        </span>
                      </td>
                      <td style={{ padding: '10px 12px', color: '#64748b' }}>{l.note || '-'}</td>
                      <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 700, color: '#16a34a' }}>
                        {isMasuk ? formatRp(nominal) : '-'}
                      </td>
                      <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 700, color: '#dc2626' }}>
                        {!isMasuk ? formatRp(nominal) : '-'}
                      </td>
                      <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                        <button
                          type="button"
                          onClick={() => handleHapusLog(l.id, l.category || l.note, nominal)}
                          style={{
                            background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '4px',
                          }}
                          title="Hapus baris ini"
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
