// src/pages/admin/owner/PanelSimulasiKelas.jsx
// ============================================================
// PANEL DECISION ENGINE: SIMULASI PECAH KELAS CROWDED
// (Khusus Dashboard Owner: Evaluasi Kapasitas Ideal 11 Siswa,
// Perhitungan Beban Gaji Tambahan Guru, Analisis BEP, & Draf Diskusi AI)
// ============================================================

import React, { useState, useMemo, useEffect } from 'react';
import {
  Scale, Users, ArrowRight, CheckCircle2, AlertTriangle, Sparkles,
  Layers, AlertCircle, HelpCircle, DollarSign, Calendar
} from 'lucide-react';

import {
  rp as defaultRp,
  hitungKapasitasSemuaKelas,
  simulasiPecahKelas,
  buatPromptKonsultasiAi,
  hitungFinansialRiil,
} from '../manajemen/manajemenUtils';

export default function PanelSimulasiKelas({
  students = [],
  logs = [],
  teacherLogs = [],
  rp: rpProp,
  isMobile = false,
}) {
  const formatRp = rpProp || defaultRp;
  const [kelasTerpilihKey, setKelasTerpilihKey] = useState('Kelas 7 SMP');
  const [copySuccess, setCopySuccess] = useState(false);

  // Parameter Interaktif Simulasi
  const [simulasiConfig, setSimulasiConfig] = useState({
    sppPerBulan: 350000,
    honorPerSesi: 65000,
    sesiPerMinggu: 3,
  });

  // Hitung Kapasitas Semua Tingkat Kelas (Standar Ideal: 11 Anak)
  const kapasitasKelasList = useMemo(() => {
    return hitungKapasitasSemuaKelas(students, 11);
  }, [students]);

  // Kelas Target
  const kelasTargetSimulasi = useMemo(() => {
    return (
      kapasitasKelasList.find((k) => k.namaKelas === kelasTerpilihKey) ||
      kapasitasKelasList.find((k) => k.namaKelas.includes('7')) ||
      kapasitasKelasList[0] ||
      null
    );
  }, [kapasitasKelasList, kelasTerpilihKey]);

  // Update SPP default saat kelas berganti
  useEffect(() => {
    if (kelasTargetSimulasi?.rataSpp) {
      setSimulasiConfig((prev) => ({
        ...prev,
        sppPerBulan: kelasTargetSimulasi.rataSpp || 350000,
      }));
    }
  }, [kelasTargetSimulasi]);

  // Hasil Simulasi
  const hasilSimulasi = useMemo(() => {
    if (!kelasTargetSimulasi) return null;
    return simulasiPecahKelas(kelasTargetSimulasi, simulasiConfig);
  }, [kelasTargetSimulasi, simulasiConfig]);

  // Salin Prompt Diskusi AI
  const handleSalinPromptAi = () => {
    const fin = hitungFinansialRiil(logs, teacherLogs);
    const teks = buatPromptKonsultasiAi({
      finansialRiil: fin,
      kapasitasKelas: kapasitasKelasList,
      kelasTargetCrowded: kelasTerpilihKey,
    });
    navigator.clipboard.writeText(teks);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 3000);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* HEADER & FILTER KELAS */}
      <div style={{ background: '#ffffff', borderRadius: 16, padding: '24px', border: '1px solid #e2e8f0' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16, marginBottom: 20 }}>
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#eff6ff', color: '#1d4ed8', padding: '3px 10px', borderRadius: 20, fontSize: 11.5, fontWeight: 700, marginBottom: 6 }}>
              <Scale size={13} /> DECISION ENGINE PEMILIK
            </div>
            <h3 style={{ fontSize: 18, fontWeight: 800, color: '#0f172a', margin: '0 0 4px' }}>
              Simulasi Pemecahan Kelas Crowded (Standar Ideal: 11 Anak)
            </h3>
            <p style={{ color: '#64748b', fontSize: 13, margin: 0, maxWidth: 780 }}>
              Membantu Owner mengevaluasi secara kuantitatif: apakah kelas yang padat (seperti Kelas 7) harus segera dipecah menjadi 7A & 7B sekarang atau ditahan hingga terkumpul minimal murid impas (BEP), agar margin laba tidak anjlok.
            </p>
          </div>

          <button
            type="button"
            onClick={handleSalinPromptAi}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              background: copySuccess ? '#16a34a' : '#4f46e5', color: '#ffffff',
              border: 'none', padding: '10px 16px', borderRadius: 10,
              fontSize: 12.5, fontWeight: 700, cursor: 'pointer', transition: '0.2s',
            }}
          >
            {copySuccess ? <CheckCircle2 size={16} /> : <Sparkles size={16} />}
            {copySuccess ? 'Draf AI Tersalin!' : 'Salin Bahan Diskusi AI'}
          </button>
        </div>

        {/* DAFTAR PILIHAN KELAS & STATUS KAPASITAS */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(auto-fill, minmax(170px, 1fr))',
          gap: 12,
        }}>
          {kapasitasKelasList.map((k) => {
            const isSelected = k.namaKelas === (kelasTargetSimulasi?.namaKelas || kelasTerpilihKey);
            const badgeBg = k.isCrowded ? '#fee2e2' : k.isMendekati ? '#fef3c7' : '#ecfdf5';
            const badgeColor = k.isCrowded ? '#dc2626' : k.isMendekati ? '#d97706' : '#059669';
            const badgeText = k.isCrowded ? 'CROWDED' : k.isMendekati ? 'Mendekati' : 'Optimal';

            return (
              <div
                key={k.namaKelas}
                onClick={() => setKelasTerpilihKey(k.namaKelas)}
                style={{
                  padding: '14px', borderRadius: 12, cursor: 'pointer',
                  border: isSelected ? '2px solid #2563eb' : '1px solid #e2e8f0',
                  background: isSelected ? '#eff6ff' : '#ffffff',
                  boxShadow: isSelected ? '0 4px 10px rgba(37,99,235,0.1)' : 'none',
                  transition: 'all 0.15s ease',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <span style={{ fontSize: 10, fontWeight: 800, padding: '2px 6px', borderRadius: 6, background: badgeBg, color: badgeColor }}>
                    {badgeText}
                  </span>
                  <span style={{ fontSize: 11, color: '#64748b' }}>
                    {k.totalSiswa}/11 anak
                  </span>
                </div>
                <div style={{ fontSize: 13.5, fontWeight: 700, color: '#0f172a' }}>
                  {k.namaKelas}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* HASIL SIMULASI KOMPARASI HEAD-TO-HEAD */}
      {hasilSimulasi && (
        <div style={{ background: '#ffffff', borderRadius: 16, padding: '24px', border: '1px solid #e2e8f0' }}>
          {/* KOTAK KEPUTUSAN & REKOMENDASI STRATEGIS */}
          <div style={{
            background: hasilSimulasi.statusKeputusan === 'prioritas_urgent' ? '#fef2f2' :
                        hasilSimulasi.statusKeputusan === 'tahan' ? '#fffbeb' : '#f0fdf4',
            border: hasilSimulasi.statusKeputusan === 'prioritas_urgent' ? '1px solid #f87171' :
                    hasilSimulasi.statusKeputusan === 'tahan' ? '1px solid #fcd34d' : '1px solid #86efac',
            borderRadius: 14, padding: '16px 20px', marginBottom: 24,
          }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
              <div style={{
                width: 32, height: 32, borderRadius: 8,
                background: hasilSimulasi.statusKeputusan === 'prioritas_urgent' ? '#dc2626' :
                            hasilSimulasi.statusKeputusan === 'tahan' ? '#d97706' : '#16a34a',
                color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}>
                <Scale size={18} />
              </div>
              <div>
                <h4 style={{
                  margin: '0 0 4px', fontSize: 14.5, fontWeight: 800,
                  color: hasilSimulasi.statusKeputusan === 'prioritas_urgent' ? '#991b1b' :
                         hasilSimulasi.statusKeputusan === 'tahan' ? '#92400e' : '#166534',
                }}>
                  KESIMPULAN & REKOMENDASI MANAJEMEN: {hasilSimulasi.namaKelas}
                </h4>
                <p style={{
                  margin: 0, fontSize: 13, lineHeight: 1.6,
                  color: hasilSimulasi.statusKeputusan === 'prioritas_urgent' ? '#7f1d1d' :
                         hasilSimulasi.statusKeputusan === 'tahan' ? '#78350f' : '#14532d',
                }}>
                  {hasilSimulasi.rekomendasi}
                </p>
              </div>
            </div>
          </div>

          {/* PARAMETER SIMULASI */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)',
            gap: 16, marginBottom: 24, padding: '16px', background: '#f8fafc', borderRadius: 12, border: '1px solid #e2e8f0',
          }}>
            <div>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#475569', marginBottom: 4 }}>
                Estimasi SPP Siswa / Bulan:
              </label>
              <input
                type="number"
                value={simulasiConfig.sppPerBulan}
                onChange={(e) => setSimulasiConfig({ ...simulasiConfig, sppPerBulan: Number(e.target.value) })}
                style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 13, fontWeight: 700 }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#475569', marginBottom: 4 }}>
                Honor Guru per Sesi:
              </label>
              <input
                type="number"
                value={simulasiConfig.honorPerSesi}
                onChange={(e) => setSimulasiConfig({ ...simulasiConfig, honorPerSesi: Number(e.target.value) })}
                style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 13, fontWeight: 700 }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#475569', marginBottom: 4 }}>
                Sesi Mengajar / Minggu:
              </label>
              <input
                type="number"
                value={simulasiConfig.sesiPerMinggu}
                onChange={(e) => setSimulasiConfig({ ...simulasiConfig, sesiPerMinggu: Number(e.target.value) })}
                style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 13, fontWeight: 700 }}
              />
            </div>
          </div>

          {/* HEAD TO HEAD 1 KELAS VS 2 KELAS */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
            gap: 20,
          }}>
            {/* OPSI 1: TETAP 1 KELAS */}
            <div style={{ border: '1px solid #e2e8f0', borderRadius: 14, padding: '20px', background: '#ffffff' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <span style={{ fontSize: 14, fontWeight: 800, color: '#0f172a' }}>
                  SKENARIO 1: Tetap 1 Kelas (Saat Ini)
                </span>
                <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 6, background: '#f1f5f9', color: '#334155' }}>
                  {hasilSimulasi.totalSiswa} Siswa
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 13 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748b' }}>Pendapatan SPP:</span>
                  <span style={{ fontWeight: 700, color: '#0f172a' }}>{formatRp(hasilSimulasi.pendapatanBulanan)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748b' }}>Biaya Honor Guru ({hasilSimulasi.sesiPerBulan} sesi):</span>
                  <span style={{ fontWeight: 700, color: '#dc2626' }}>{formatRp(hasilSimulasi.biayaGuru1Kelas)}</span>
                </div>
                <div style={{ borderTop: '1px dashed #cbd5e1', paddingTop: 10, display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontWeight: 700, color: '#0f172a' }}>Profit Bersih Kelas:</span>
                  <span style={{ fontWeight: 800, color: '#16a34a', fontSize: 15 }}>{formatRp(hasilSimulasi.profit1Kelas)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748b' }}>Margin Keuntungan:</span>
                  <span style={{ fontWeight: 700, color: '#16a34a' }}>{hasilSimulasi.margin1Kelas}%</span>
                </div>
              </div>
            </div>

            {/* OPSI 2: DIPECAH MENJADI 2 KELAS (A & B) */}
            <div style={{ border: '2px solid #3b82f6', borderRadius: 14, padding: '20px', background: '#f8fafc' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <span style={{ fontSize: 14, fontWeight: 800, color: '#1d4ed8' }}>
                  SKENARIO 2: Dipecah Jadi 2 Kelas (A & B)
                </span>
                <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 6, background: '#dbeafe', color: '#1e40af' }}>
                  {hasilSimulasi.siswaKelasA} & {hasilSimulasi.siswaKelasB} Siswa
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 13 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748b' }}>Pendapatan SPP (Sama):</span>
                  <span style={{ fontWeight: 700, color: '#0f172a' }}>{formatRp(hasilSimulasi.pendapatanBulanan)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748b' }}>Biaya Honor Guru (2x Lipat):</span>
                  <span style={{ fontWeight: 700, color: '#dc2626' }}>
                    {formatRp(hasilSimulasi.biayaGuru2Kelas)} (+{formatRp(hasilSimulasi.tambahanBiayaGuru)})
                  </span>
                </div>
                <div style={{ borderTop: '1px dashed #cbd5e1', paddingTop: 10, display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontWeight: 700, color: '#0f172a' }}>Profit Bersih Kelas:</span>
                  <span style={{ fontWeight: 800, color: hasilSimulasi.profit2Kelas > 0 ? '#1d4ed8' : '#dc2626', fontSize: 15 }}>
                    {formatRp(hasilSimulasi.profit2Kelas)}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748b' }}>Margin Keuntungan:</span>
                  <span style={{ fontWeight: 700, color: '#1d4ed8' }}>
                    {hasilSimulasi.margin2Kelas}% (Turun {hasilSimulasi.margin1Kelas - hasilSimulasi.margin2Kelas}%)
                  </span>
                </div>
              </div>

              <div style={{ marginTop: 14, padding: '10px 14px', borderRadius: 8, background: '#eff6ff', border: '1px solid #bfdbfe', fontSize: 12 }}>
                <span style={{ fontWeight: 700, color: '#1e40af' }}>🎯 Target Titik Impas (BEP): </span>
                <span style={{ color: '#1e3a8a' }}>
                  Wajib menambah <b>{hasilSimulasi.bepSiswaBaru} siswa baru</b> lagi (total minimal <b>{hasilSimulasi.targetTotalSiswaAman} siswa</b>) agar profit bimbel tidak mengalami penurunan setelah kelas dipecah.
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
