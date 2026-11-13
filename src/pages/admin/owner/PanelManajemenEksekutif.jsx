// src/pages/admin/owner/PanelManajemenEksekutif.jsx
// ============================================================
// PANEL MANAJEMEN EKSEKUTIF (KHUSUS DASHBOARD OWNER)
// 1. Audit Finansial Riil (Omzet, Pengeluaran Komprehensif, Net Profit Sebenarnya)
// 2. Deteksi & Sinkronisasi 1-Klik Honor Tentor 2 Bulan yang Belum Dibukukan
// 3. Unduh Laporan Besar Multi-Sheet (.xlsx) & Salin Briefing AI untuk Diskusi
// ============================================================

import React, { useState, useMemo } from 'react';
import { db } from '../../../firebase';
import { collection, doc, writeBatch, serverTimestamp } from 'firebase/firestore';
import {
  Crown, Download, Copy, CheckCircle2, AlertTriangle, RefreshCw,
  FileSpreadsheet, Sparkles, AlertCircle, HelpCircle, ArrowRight, ShieldCheck,
  Wallet, DollarSign, Users, Scale, ExternalLink
} from 'lucide-react';

import {
  rp as defaultRp,
  hitungFinansialRiil,
  hitungKapasitasSemuaKelas,
  unduhLaporanBesarExcel,
  buatPromptKonsultasiAi,
} from '../manajemen/manajemenUtils';

export default function PanelManajemenEksekutif({
  logs = [],
  teacherLogs = [],
  students = [],
  settings = {},
  rp: rpProp,
  isMobile = false,
  onBukaTabSimulasi,
}) {
  const formatRp = rpProp || defaultRp;
  const [submittingHonor, setSubmittingHonor] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);

  // Perhitungan Finansial Riil
  const finansialRiil = useMemo(() => {
    return hitungFinansialRiil(logs, teacherLogs);
  }, [logs, teacherLogs]);

  // Kapasitas Kelas
  const kapasitasKelasList = useMemo(() => {
    return hitungKapasitasSemuaKelas(students, 11);
  }, [students]);

  // 1-Klik: Sinkronkan dan Bukukan Gaji Tentor 2 Bulan ke Pengeluaran finance_logs
  const handleBukukanHonorMassal = async () => {
    const audit = finansialRiil.auditHonor;
    if (!audit.adaKebocoranPengeluaran) {
      alert('Semua honor tentor sudah tercatat lunas di sistem!');
      return;
    }

    const konfirmasi = window.confirm(
      `⚠️ KONFIRMASI PEMBUKUAN GAJI TENTOR ⚠️\n\n` +
      `Sistem mendeteksi ${audit.totalSesiBelumDibayar} sesi mengajar tentor dengan total ${formatRp(audit.totalHutangHonor)} ` +
      `yang belum pernah dimasukkan ke pengeluaran finance_logs.\n\n` +
      `Tindakan ini akan:\n` +
      `1. Membuat entri pengeluaran kas resmi "Gaji Guru/Staf" di finance_logs.\n` +
      `2. Mengubah status ${audit.totalSesiBelumDibayar} sesi tentor menjadi "Lunas".\n` +
      `3. Memperbaiki angka Net Profit menjadi akurat dan tidak mengarang lagi.\n\n` +
      `Lanjutkan pembukuan sekarang?`
    );

    if (!konfirmasi) return;

    setSubmittingHonor(true);
    try {
      const today = new Date().toISOString().slice(0, 10);
      const batch = writeBatch(db);

      // Buat pengeluaran per guru yang belum dibayar
      audit.daftarPerGuru.forEach((g) => {
        if (g.totalNominal <= 0) return;
        const logRef = doc(collection(db, 'finance_logs'));
        batch.set(logRef, {
          type: 'Pengeluaran',
          date: today,
          category: 'Gaji Guru/Staf',
          amount: g.totalNominal,
          method: 'Transfer',
          note: `Pembukuan Honor Tentor: ${g.namaGuru} (${g.totalSesi} sesi - ${g.daftarBulan.join(', ')})`,
          kanalKe: 'kasOwner',
          statusRekonsiliasi: 'lunas_manajemen',
          createdAt: serverTimestamp(),
        });
      });

      // Tandai seluruh sesi teacher_logs menjadi Lunas
      audit.daftarBelumDibayar.forEach((t) => {
        if (!t.id) return;
        batch.update(doc(db, 'teacher_logs', t.id), {
          statusDibayar: 'Lunas',
          tanggalDibayar: today,
        });
      });

      await batch.commit();
      alert(`✅ BERHASIL! Seluruh honor tentor sebesar ${formatRp(audit.totalHutangHonor)} telah resmi dibukukan ke pengeluaran finance_logs.`);
    } catch (err) {
      console.error('Gagal bukukan honor:', err);
      alert('Gagal membukukan honor: ' + err.message);
    } finally {
      setSubmittingHonor(false);
    }
  };

  // Unduh Laporan Besar Excel (.xlsx)
  const handleUnduhExcel = () => {
    unduhLaporanBesarExcel({
      finansialRiil,
      kapasitasKelas: kapasitasKelasList,
      guruList: [],
      teacherLogs,
      students,
    });
  };

  // Salin Prompt AI
  const handleSalinPromptAi = () => {
    const teks = buatPromptKonsultasiAi({
      finansialRiil,
      kapasitasKelas: kapasitasKelasList,
      kelasTargetCrowded: 'Kelas 7 SMP',
    });
    navigator.clipboard.writeText(teks);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 3000);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* ACTION BAR: DOWNLOAD EXCEL & PROMPT AI */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        background: '#ffffff', padding: '16px 20px', borderRadius: 16,
        border: '1px solid #e2e8f0', flexWrap: 'wrap', gap: 12,
        boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 13, fontWeight: 800, color: '#0f172a' }}>
              🏛️ Laporan Eksekutif & Bahan Diskusi
            </span>
            <span style={{ fontSize: 11, background: '#fef3c7', color: '#92400e', padding: '2px 8px', borderRadius: 20, fontWeight: 700 }}>
              Khusus Owner
            </span>
          </div>
          <p style={{ margin: '2px 0 0', fontSize: 12, color: '#64748b' }}>
            Ekspor rekap menyeluruh (Guru, Gaji, Siswa, Kapasitas) atau salin prompt AI untuk konsultasi strategis.
          </p>
        </div>

        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={handleUnduhExcel}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              background: '#059669', color: '#ffffff', border: 'none',
              padding: '9px 15px', borderRadius: 10, fontSize: 12.5, fontWeight: 700,
              cursor: 'pointer', boxShadow: '0 2px 4px rgba(5,150,105,0.2)',
            }}
          >
            <Download size={15} /> Unduh Laporan Besar (.xlsx)
          </button>

          <button
            type="button"
            onClick={handleSalinPromptAi}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              background: copySuccess ? '#16a34a' : '#4f46e5',
              color: '#ffffff', border: 'none',
              padding: '9px 15px', borderRadius: 10, fontSize: 12.5, fontWeight: 700,
              cursor: 'pointer', transition: '0.2s',
            }}
          >
            {copySuccess ? <CheckCircle2 size={15} /> : <Sparkles size={15} />}
            {copySuccess ? 'Tersalin ke Clipboard!' : 'Salin Briefing untuk AI'}
          </button>
        </div>
      </div>

      {/* BANNER DARURAT: HONOR TENTOR 2 BULAN BELUM DIBUKUKAN */}
      {finansialRiil.honorBelumDibukukan > 0 && (
        <div style={{
          background: 'linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%)',
          border: '2px solid #fb923c', borderRadius: 16, padding: '20px',
          boxShadow: '0 4px 12px rgba(234,88,12,0.1)',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
            <div style={{ display: 'flex', gap: 14 }}>
              <div style={{
                width: 44, height: 44, borderRadius: 12, background: '#ea580c',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#ffffff', flexShrink: 0,
              }}>
                <AlertTriangle size={24} />
              </div>
              <div>
                <h4 style={{ margin: '0 0 4px', fontSize: 16, fontWeight: 800, color: '#9a3412' }}>
                  Deteksi Honor Tentor Belum Dibukukan ke Pengeluaran ({finansialRiil.sesiHonorBelumDibukukan} Sesi)
                </h4>
                <p style={{ margin: '0 0 10px', fontSize: 13, color: '#7c2d12', lineHeight: 1.5, maxWidth: 840 }}>
                  Ditemukan kewajiban honor mengajar sebesar <b>{formatRp(finansialRiil.honorBelumDibukukan)}</b> dari <b>{finansialRiil.auditHonor.daftarPerGuru.length} tentor</b> yang belum pernah dicatatkan ke kas keluar kasir. Inilah yang menyebabkan perhitungan profit di dasbor tampak tinggi semu ("mengarang").
                </p>

                {/* Preview rincian guru belum dibayar */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {finansialRiil.auditHonor.daftarPerGuru.slice(0, 5).map((g, idx) => (
                    <span key={idx} style={{
                      background: 'rgba(255,255,255,0.8)', border: '1px solid #fdba74',
                      color: '#9a3412', padding: '3px 10px', borderRadius: 8, fontSize: 11.5, fontWeight: 600,
                    }}>
                      {g.namaGuru}: {formatRp(g.totalNominal)} ({g.totalSesi} sesi)
                    </span>
                  ))}
                  {finansialRiil.auditHonor.daftarPerGuru.length > 5 && (
                    <span style={{ fontSize: 11.5, color: '#9a3412', alignSelf: 'center', fontWeight: 600 }}>
                      +{finansialRiil.auditHonor.daftarPerGuru.length - 5} tentor lainnya...
                    </span>
                  )}
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={handleBukukanHonorMassal}
              disabled={submittingHonor}
              style={{
                background: '#ea580c', color: '#ffffff', border: 'none',
                padding: '12px 20px', borderRadius: 10, fontSize: 13, fontWeight: 800,
                cursor: submittingHonor ? 'wait' : 'pointer',
                display: 'inline-flex', alignItems: 'center', gap: 8,
                boxShadow: '0 4px 6px rgba(234,88,12,0.25)',
              }}
            >
              <RefreshCw size={16} className={submittingHonor ? 'animate-spin' : ''} />
              {submittingHonor ? 'Memproses Pembukuan...' : '⚡ 1-Klik: Bukukan ke Pengeluaran'}
            </button>
          </div>
        </div>
      )}

      {/* 4 REAL METRIC CARDS */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: isMobile ? '1fr' : 'repeat(4, 1fr)',
        gap: 16,
      }}>
        {/* Card 1: Kas Masuk Riil */}
        <div style={{ background: '#ffffff', borderRadius: 16, padding: '20px', border: '1px solid #e2e8f0', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.5 }}>
              Total Kas Masuk Riil
            </span>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: '#f0fdf4', color: '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <DollarSign size={16} />
            </div>
          </div>
          <div style={{ fontSize: 22, fontWeight: 800, color: '#0f172a', marginBottom: 4 }}>
            {formatRp(finansialRiil.kasMasuk)}
          </div>
          <div style={{ fontSize: 11, color: '#16a34a', fontWeight: 600 }}>
            Dari pembayaran SPP, registrasi, & modul
          </div>
        </div>

        {/* Card 2: Pengeluaran Terbuku Kasir */}
        <div style={{ background: '#ffffff', borderRadius: 16, padding: '20px', border: '1px solid #e2e8f0', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.5 }}>
              Pengeluaran Terbuku Kasir
            </span>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: '#fef2f2', color: '#dc2626', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Wallet size={16} />
            </div>
          </div>
          <div style={{ fontSize: 22, fontWeight: 800, color: '#dc2626', marginBottom: 4 }}>
            {formatRp(finansialRiil.kasKeluarTerbuku)}
          </div>
          <div style={{ fontSize: 11, color: '#64748b' }}>
            Operasional yang sudah tercatat kasir
          </div>
        </div>

        {/* Card 3: Honor Belum Dibukukan */}
        <div style={{
          background: finansialRiil.honorBelumDibukukan > 0 ? '#fff1f2' : '#ffffff',
          borderRadius: 16, padding: '20px',
          border: finansialRiil.honorBelumDibukukan > 0 ? '1px solid #fecdd3' : '1px solid #e2e8f0',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: '#e11d48', textTransform: 'uppercase', letterSpacing: 0.5 }}>
              Honor Belum Dibukukan
            </span>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: '#ffe4e6', color: '#e11d48', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <AlertTriangle size={16} />
            </div>
          </div>
          <div style={{ fontSize: 22, fontWeight: 800, color: '#e11d48', marginBottom: 4 }}>
            {formatRp(finansialRiil.honorBelumDibukukan)}
          </div>
          <div style={{ fontSize: 11, color: '#be123c', fontWeight: 600 }}>
            {finansialRiil.sesiHonorBelumDibukukan} sesi valid menunggu pembukuan
          </div>
        </div>

        {/* Card 4: Net Profit Bersih Sebenarnya */}
        <div style={{
          background: finansialRiil.netProfitRiil >= 0 ? '#f8fafc' : '#fef2f2',
          borderRadius: 16, padding: '20px',
          border: finansialRiil.netProfitRiil >= 0 ? '2px solid #3b82f6' : '2px solid #ef4444',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <span style={{ fontSize: 11, fontWeight: 800, color: finansialRiil.netProfitRiil >= 0 ? '#1d4ed8' : '#b91c1c', textTransform: 'uppercase', letterSpacing: 0.5 }}>
              Net Profit Bersih Sebenarnya
            </span>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: '#eff6ff', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ShieldCheck size={16} />
            </div>
          </div>
          <div style={{ fontSize: 22, fontWeight: 900, color: finansialRiil.netProfitRiil >= 0 ? '#1d4ed8' : '#dc2626', marginBottom: 4 }}>
            {formatRp(finansialRiil.netProfitRiil)}
          </div>
          <div style={{ fontSize: 11, color: '#475569', fontWeight: 700 }}>
            Margin Bersih Riil: {finansialRiil.netProfitMargin}%
          </div>
        </div>
      </div>

      {/* PENJELASAN AUDIT KEUANGAN RIIL */}
      <div style={{ background: '#ffffff', borderRadius: 16, padding: '24px', border: '1px solid #e2e8f0' }}>
        <h3 style={{ fontSize: 16, fontWeight: 800, color: '#0f172a', margin: '0 0 8px' }}>
          Mengapa Profit Sebelumnya Terasa "Mengarang"?
        </h3>
        <p style={{ color: '#475569', fontSize: 13, lineHeight: 1.6, margin: '0 0 16px' }}>
          Sebelumnya, laba dihitung hanya dari selisih kas masuk dikurangi pengeluaran kasir. Karena gaji guru selama 2 bulan belum dibukukan ke kasir, biaya operasional terbesar bimbel belum memotong laba kas, sehingga angka laba terlihat surplus besar di atas kertas namun uang fisiknya tidak ada.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)', gap: 14 }}>
          <div style={{ padding: '14px', borderRadius: 12, background: '#f8fafc', border: '1px solid #e2e8f0' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#64748b', marginBottom: 4 }}>1. Uang Masuk Kas Bimbel</div>
            <div style={{ fontSize: 16, fontWeight: 800, color: '#0f172a' }}>{formatRp(finansialRiil.kasMasuk)}</div>
            <div style={{ fontSize: 11, color: '#64748b', marginTop: 4 }}>Total riil pembayaran sah siswa yang sudah disetor ke kasir/bank.</div>
          </div>

          <div style={{ padding: '14px', borderRadius: 12, background: '#f8fafc', border: '1px solid #e2e8f0' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#64748b', marginBottom: 4 }}>2. Total Beban Operasional Riil</div>
            <div style={{ fontSize: 16, fontWeight: 800, color: '#dc2626' }}>
              {formatRp(finansialRiil.pengeluaranRiilKomprehensif)}
            </div>
            <div style={{ fontSize: 11, color: '#64748b', marginTop: 4 }}>
              {formatRp(finansialRiil.kasKeluarTerbuku)} (operasional) + {formatRp(finansialRiil.honorBelumDibukukan)} (honor guru terhutang).
            </div>
          </div>

          <div style={{ padding: '14px', borderRadius: 12, background: '#f8fafc', border: '1px solid #e2e8f0' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#64748b', marginBottom: 4 }}>3. Dana Bersih Riil (Aman Diambil)</div>
            <div style={{ fontSize: 16, fontWeight: 800, color: finansialRiil.netProfitRiil >= 0 ? '#16a34a' : '#dc2626' }}>
              {formatRp(finansialRiil.netProfitRiil)}
            </div>
            <div style={{ fontSize: 11, color: '#64748b', marginTop: 4 }}>
              Sisa dana setelah seluruh hak honor mengajar tentor diselesaikan secara utuh.
            </div>
          </div>
        </div>
      </div>

      {/* QUICK CARD: SIMULASI PECAH KELAS */}
      {onBukaTabSimulasi && (
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          background: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)',
          border: '1px solid #93c5fd', borderRadius: 16, padding: '18px 24px',
          cursor: 'pointer',
        }} onClick={onBukaTabSimulasi}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: '#2563eb', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Scale size={20} />
            </div>
            <div>
              <h4 style={{ margin: 0, fontSize: 15, fontWeight: 800, color: '#1e3a8a' }}>
                Decision Engine: Simulasi Pecah Kelas Crowded (Kasus Kelas 7 SMP)
              </h4>
              <p style={{ margin: '2px 0 0', fontSize: 12, color: '#1d4ed8' }}>
                Kapasitas ideal 11 anak. Hitung dampak penambahan jam guru terhadap profit dan estimasi BEP pendaftar baru.
              </p>
            </div>
          </div>
          <button style={{
            background: '#2563eb', color: 'white', border: 'none',
            padding: '8px 16px', borderRadius: 8, fontSize: 12, fontWeight: 700,
            cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
          }}>
            Buka Simulator <ArrowRight size={14} />
          </button>
        </div>
      )}
    </div>
  );
}
