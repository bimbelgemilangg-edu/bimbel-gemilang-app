// src/pages/student/modul/ModulBelajarUtbkPage.jsx
// ==============================================================================
// MODUL BELAJAR GEMILANG (STANDAR AMBIS 1:1)
// - SMA Kelas 12: Kurikulum UTBK-SNBT 2027 (7 Subtes Resmi SNPMB)
// - SMP Kelas 9 : Kurikulum TKA SMP (Subtes Utama: MTK & BIN, Subtes Tambahan: IPA & BIG)
// 100% UNLOCKED & Terstruktur dengan Konsep Kunci, Trik Kilat & Kuis Interaktif
// ==============================================================================

import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BookOpen,
  Search,
  CheckCircle2,
  Clock,
  Sparkles,
  ArrowRight,
  Flame,
  Award,
  BookMarked,
  Filter,
  Check,
  Eye,
  EyeOff,
  Download,
} from 'lucide-react';
import {
  DAFTAR_SUBTES_MODUL,
  SEMUA_BAB_MODUL,
  hitungStatistikModulSiswa,
  getTerakhirDibaca,
} from '../../../data/ambisModulUtbkData.js';
import {
  DAFTAR_SUBTES_SMP,
  SEMUA_BAB_SMP,
  hitungStatistikModulSmpSiswa,
  getTerakhirDibacaSmp,
} from '../../../data/tkaSmpModulData.js';
import {
  DAFTAR_SUBTES_SD,
  SEMUA_BAB_SD,
  hitungStatistikModulSdSiswa,
  getTerakhirDibacaSd,
} from '../../../data/tkaSdModulData.js';
import { useProfilSiswa } from '../../../utils/profilSiswa';
import { deteksiTingkatSiswa } from '../../../utils/tingkatSiswa';
import RenderMath from '../../../components/RenderMath';

export default function ModulBelajarUtbkPage() {
  const navigate = useNavigate();
  const profil = useProfilSiswa();
  const kelasCek = profil.kelas || profil.kelasSekolah || (typeof localStorage !== 'undefined' ? localStorage.getItem('studentGrade') || localStorage.getItem('studentKelas') : '');
  const jenjangCek = profil.jenjang || (typeof localStorage !== 'undefined' ? localStorage.getItem('studentGrade') : '');
  const infoTingkat = useMemo(() => {
    return deteksiTingkatSiswa({ ...profil, kelas: kelasCek, kelasSekolah: kelasCek, jenjang: jenjangCek });
  }, [profil, kelasCek, jenjangCek]);

  // HANYA Kelas 6 SD (TKA SD), Kelas 9 SMP (TKA SMP), dan Kelas 12 SMA (UTBK)
  const isSd = infoTingkat.isKelas6;
  const isSmp = infoTingkat.isKelas9;
  const isKelas12 = infoTingkat.isKelas12;

  const [selectedSubtes, setSelectedSubtes] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [studentId, setStudentId] = useState('');
  const [tampilkanSubtesLain, setTampilkanSubtesLain] = useState(false);
  const [statistik, setStatistik] = useState({
    totalBab: isSd ? 8 : (isSmp ? 16 : 46),
    totalSelesai: 0,
    persenTotal: 0,
    perSubtes: {},
    perSubtest: {},
    babSelesaiIds: [],
  });
  const [terakhirDibaca, setTerakhirDibaca] = useState(null);

  // Sumber data modul sesuai jenjang
  const daftarSubtes = isSd ? DAFTAR_SUBTES_SD : (isSmp ? DAFTAR_SUBTES_SMP : DAFTAR_SUBTES_MODUL);
  const semuaBab = isSd ? SEMUA_BAB_SD : (isSmp ? SEMUA_BAB_SMP : SEMUA_BAB_MODUL);

  useEffect(() => {
    const sid =
      localStorage.getItem('studentId') ||
      localStorage.getItem('studentNim') ||
      localStorage.getItem('studentDocId') ||
      'siswa_gemilang_default';
    setStudentId(sid);

    if (isSd) {
      const stat = hitungStatistikModulSdSiswa(sid);
      setStatistik(stat);
      const last = getTerakhirDibacaSd(sid);
      setTerakhirDibaca(last);
    } else if (isSmp) {
      const stat = hitungStatistikModulSmpSiswa(sid);
      setStatistik(stat);
      const last = getTerakhirDibacaSmp(sid);
      setTerakhirDibaca(last);
    } else {
      const stat = hitungStatistikModulSiswa(sid);
      setStatistik(stat);
      const last = getTerakhirDibaca(sid);
      setTerakhirDibaca(last);
    }
  }, [isSd, isSmp]);

  // Filter bab berdasarkan subtes dan pencarian
  const filteredBab = useMemo(() => {
    return semuaBab.filter((bab) => {
      // Logika SMP: Subtes Utama (MTK & BIN) vs Subtes Tambahan (IPA & BIG)
      if (isSmp) {
        const isBabUtama = bab.isUtama ?? (bab.subtestKode === 'MTK_SMP' || bab.subtestKode === 'BIN_SMP');
        if (selectedSubtes === 'ALL') {
          if (!tampilkanSubtesLain && !isBabUtama) {
            return false;
          }
        } else if (bab.subtestKode !== selectedSubtes) {
          return false;
        }
      } else {
        const matchSubtes = selectedSubtes === 'ALL' || bab.subtestKode === selectedSubtes;
        if (!matchSubtes) return false;
      }

      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        bab.judul.toLowerCase().includes(q) ||
        (bab.subtestNama && bab.subtestNama.toLowerCase().includes(q)) ||
        (bab.subtestKode && bab.subtestKode.toLowerCase().includes(q)) ||
        (bab.ringkasanSingkat && bab.ringkasanSingkat.toLowerCase().includes(q)) ||
        (bab.learningObjectives && bab.learningObjectives.some((o) => o.toLowerCase().includes(q)));
      return matchSearch;
    });
  }, [semuaBab, isSmp, selectedSubtes, tampilkanSubtesLain, searchQuery]);

  // Hitung jumlah bab utama vs tambahan SMP
  const jumlahBabUtamaSmp = useMemo(() => {
    return SEMUA_BAB_SMP.filter((b) => b.isUtama ?? (b.subtestKode === 'MTK_SMP' || b.subtestKode === 'BIN_SMP')).length;
  }, []);

  // Proteksi Akses: Hanya Kelas 6 SD, Kelas 9 SMP & Kelas 12 SMA yang mengakses fitur Modul Belajar ini
  if (!isKelas12 && !isSmp && !isSd) {
    return (
      <div style={{ maxWidth: 640, margin: '60px auto', padding: '24px 20px', textAlign: 'center', fontFamily: 'system-ui, sans-serif' }}>
        <div style={{ width: 64, height: 64, borderRadius: 32, background: '#fef3c7', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
          <BookOpen size={30} color="#d97706" />
        </div>
        <h2 style={{ fontSize: 20, fontWeight: 900, color: '#0f172a', marginBottom: 8 }}>
          Fitur Modul Belajar Berstandar Gemilang
        </h2>
        <p style={{ fontSize: 14, color: '#64748b', lineHeight: 1.6, marginBottom: 20 }}>
          {infoTingkat.isSmaBawah
            ? 'Mohon maaf, kurikulum 7 subtes UTBK-SNBT disusun khusus untuk siswa Kelas 12 SMA & Alumni. Untuk siswa Kelas 10 & 11, silakan fokus pada pembelajaran materi harian di menu E-Learning.'
            : (infoTingkat.isSmpBawah
              ? 'Mohon maaf, kurikulum modul TKA SMP disusun khusus untuk siswa Kelas 9 SMP. Untuk siswa Kelas 7 & 8, silakan fokus pada pembelajaran materi harian di menu E-Learning.'
              : (infoTingkat.isSdBawah
                ? 'Mohon maaf, kurikulum modul TKA SD disusun khusus untuk siswa Kelas 6 SD. Untuk siswa Kelas 1–5 SD, silakan fokus pada pembelajaran materi harian di menu E-Learning.'
                : 'Mohon maaf, fitur Modul Belajar interaktif saat ini tersedia khusus untuk jenjang TKA SD Kelas 6, TKA SMP Kelas 9, dan UTBK-SNBT Kelas 12 SMA. Silakan akses menu belajar dan latihan harian sesuai jenjangmu di Dashboard.'))}
        </p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={() => navigate('/siswa/elearning')}
            style={{
              background: '#0d9488', color: '#fff', border: 'none', borderRadius: 10,
              padding: '10px 20px', fontWeight: 700, fontSize: 13, cursor: 'pointer',
            }}
          >
            Buka E-Learning 📖
          </button>
          <button
            type="button"
            onClick={() => navigate('/siswa/dashboard')}
            style={{
              background: '#f1f5f9', color: '#334155', border: '1px solid #cbd5e1', borderRadius: 10,
              padding: '10px 20px', fontWeight: 700, fontSize: 13, cursor: 'pointer',
            }}
          >
            Kembali ke Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '16px 14px 40px', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      {/* 🌟 HERO BANNER */}
      <div
        style={{
          background: 'linear-gradient(135deg, #0d9488 0%, #0f766e 60%, #115e59 100%)',
          borderRadius: 20,
          padding: '24px 22px',
          color: '#ffffff',
          boxShadow: '0 10px 25px -5px rgba(13, 148, 136, 0.3)',
          marginBottom: 20,
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: -20,
            right: -20,
            width: 140,
            height: 140,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0) 70%)',
            pointerEvents: 'none',
          }}
        />

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, flexWrap: 'wrap' }}>
          <span
            style={{
              background: 'rgba(255,255,255,0.2)',
              backdropFilter: 'blur(4px)',
              padding: '4px 10px',
              borderRadius: 20,
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 5,
            }}
          >
            <Sparkles size={13} />
            {isSd ? 'Standar Kurikulum TKA SD Kelas 6' : (isSmp ? 'Standar Kurikulum TKA SMP Kelas 9' : 'Standar Kurikulum AmbisPTN 1:1')}
          </span>
          <span
            style={{
              background: '#fef08a',
              color: '#854d0e',
              padding: '4px 10px',
              borderRadius: 20,
              fontSize: 11,
              fontWeight: 800,
            }}
          >
            🔓 100% UNLOCKED
          </span>
        </div>

        <h1 style={{ margin: '0 0 6px', fontSize: 24, fontWeight: 800, letterSpacing: '-0.02em' }}>
          {isSd ? 'Modul Belajar TKA SD Kelas 6' : (isSmp ? 'Modul Belajar TKA SMP Kelas 9' : 'Modul Belajar UTBK-SNBT 2027')}
        </h1>
        <p style={{ margin: '0 0 16px', fontSize: 13, opacity: 0.92, maxWidth: 660, lineHeight: 1.5 }}>
          {isSd
            ? 'Pelajari konsep dasar, trik kilat 30 detik, jebakan soal, contoh bertahap, dan kuis cek pemahaman untuk persiapan TKA SD Numerasi & Literasi menuju SMP Favorit.'
            : (isSmp
              ? 'Pelajari konsep kunci, trik kilat 30 detik, jebakan umum, contoh soal bertahap, dan kuis cek pemahaman interaktif untuk persiapan TKA, Asesmen Nasional, & seleksi SMA Unggulan.'
              : 'Pelajari konsep kunci, trik kilat 30 detik, jebakan umum, contoh soal bertahap, dan kuis cek pemahaman interaktif untuk 7 subtes resmi SNBT.')}
        </p>

        {/* Progress Bar Siswa */}
        <div
          style={{
            background: 'rgba(0, 0, 0, 0.15)',
            backdropFilter: 'blur(6px)',
            borderRadius: 14,
            padding: '12px 14px',
            maxWidth: 620,
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
            <span style={{ fontSize: 12, fontWeight: 700 }}>Progres Penguasaan Modul Kamu</span>
            <span style={{ fontSize: 12, fontWeight: 800, color: '#fef08a' }}>
              {statistik.totalSelesai} / {statistik.totalBab} Bab ({statistik.persenTotal}%)
            </span>
          </div>
          <div style={{ width: '100%', height: 8, background: 'rgba(255,255,255,0.25)', borderRadius: 999, overflow: 'hidden' }}>
            <div
              style={{
                width: `${statistik.persenTotal}%`,
                height: '100%',
                background: 'linear-gradient(90deg, #fef08a, #a3e635)',
                borderRadius: 999,
                transition: 'width 0.4s ease',
              }}
            />
          </div>
        </div>
      </div>

      {/* 📌 WIDGET TERAKHIR DIBACA (JIKA ADA) */}
      {terakhirDibaca && (
        <div
          style={{
            background: '#ffffff',
            border: '1px solid #ccfbf1',
            borderRadius: 16,
            padding: '12px 16px',
            marginBottom: 20,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
            boxShadow: '0 2px 8px rgba(13, 148, 136, 0.08)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                background: '#f0fdfa',
                color: '#0d9488',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <BookMarked size={20} />
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 10.5, fontWeight: 700, color: '#0d9488', textTransform: 'uppercase' }}>
                Lanjutkan Belajar Terakhir
              </div>
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 800,
                  color: '#0f172a',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                [{terakhirDibaca.subtestKode}] <RenderMath text={terakhirDibaca.judul} />
              </div>
            </div>
          </div>
          <button
            onClick={() => navigate(`/siswa/modul/${terakhirDibaca.subtestKode}/${terakhirDibaca.babSlug}`)}
            style={{
              background: '#0d9488',
              color: '#ffffff',
              border: 'none',
              borderRadius: 10,
              padding: '7px 14px',
              fontSize: 11.5,
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 5,
              flexShrink: 0,
            }}
          >
            Lanjut <ArrowRight size={14} />
          </button>
        </div>
      )}

      {/* 🔍 SEARCH BAR & SUBTEST FILTER TABS */}
      <div style={{ marginBottom: 18 }}>
        {/* Input Pencarian */}
        <div style={{ position: 'relative', marginBottom: 12 }}>
          <Search
            size={18}
            style={{
              position: 'absolute',
              left: 14,
              top: '50%',
              transform: 'translateY(-50%)',
              color: '#94a3b8',
            }}
          />
          <input
            type="text"
            placeholder={
              isSd
                ? 'Cari bab, rumus, atau konsep TKA SD (contoh: Pecahan, FPB, Kecepatan, Ide Pokok, EYD)...'
                : (isSmp
                  ? 'Cari bab, rumus, atau konsep TKA SMP (contoh: Bentuk Akar, Kuadrat, Pidato, Listrik)...'
                  : 'Cari bab, topik, atau kata kunci (contoh: Silogisme, Vieta, EYD V, P vs Q)...')
            }
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              boxSizing: 'border-box',
              padding: '11px 14px 11px 42px',
              borderRadius: 12,
              border: '1.5px solid #e2e8f0',
              fontSize: 13,
              outline: 'none',
              background: '#ffffff',
              color: '#0f172a',
              transition: 'border-color 0.2s',
            }}
            onFocus={(e) => (e.target.style.borderColor = '#0d9488')}
            onBlur={(e) => (e.target.style.borderColor = '#e2e8f0')}
          />
        </div>

        {/* Tab Subtes */}
        <div
          style={{
            display: 'flex',
            gap: 8,
            overflowX: 'auto',
            paddingBottom: 4,
            WebkitOverflowScrolling: 'touch',
            alignItems: 'center',
          }}
        >
          {/* Tombol Tab Semua */}
          <button
            onClick={() => setSelectedSubtes('ALL')}
            style={{
              padding: '8px 14px',
              borderRadius: 12,
              border: selectedSubtes === 'ALL' ? '2px solid #0d9488' : '1px solid #e2e8f0',
              background: selectedSubtes === 'ALL' ? '#f0fdfa' : '#ffffff',
              color: selectedSubtes === 'ALL' ? '#0d9488' : '#64748b',
              fontWeight: selectedSubtes === 'ALL' ? 800 : 600,
              fontSize: 12,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            📚 {isSmp ? (tampilkanSubtesLain ? `Semua Subtes (${semuaBab.length})` : `Subtes Utama (${jumlahBabUtamaSmp})`) : `Semua (${semuaBab.length})`}
          </button>

          {/* Tab Subtes List */}
          {daftarSubtes
            .filter((sub) => {
              const isSubUtama = sub.isUtama ?? (sub.kode === 'MTK_SMP' || sub.kode === 'BIN_SMP');
              if (isSmp && !tampilkanSubtesLain && !isSubUtama) {
                return false;
              }
              return true;
            })
            .map((sub) => {
              const isSelected = selectedSubtes === sub.kode;
              const subStat = (statistik?.perSubtes && statistik.perSubtes[sub.kode]) || (statistik?.perSubtest && statistik.perSubtest[sub.kode]);
              return (
                <button
                  key={sub.kode}
                  onClick={() => setSelectedSubtes(sub.kode)}
                  style={{
                    padding: '8px 14px',
                    borderRadius: 12,
                    border: isSelected ? `2px solid ${sub.badgeWarna}` : '1px solid #e2e8f0',
                    background: isSelected ? sub.bgLight : '#ffffff',
                    color: isSelected ? sub.badgeWarna : '#475569',
                    fontWeight: isSelected ? 800 : 600,
                    fontSize: 12,
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    transition: 'all 0.15s ease',
                  }}
                >
                  <span>{sub.emoji}</span>
                  <span>{sub.singkatan || sub.kode}</span>
                  <span
                    style={{
                      background: isSelected ? sub.badgeWarna : '#f1f5f9',
                      color: isSelected ? '#ffffff' : '#64748b',
                      borderRadius: 999,
                      padding: '1px 6px',
                      fontSize: 10,
                      fontWeight: 700,
                    }}
                  >
                    {subStat ? `${subStat.selesai}/${sub.totalBab}` : sub.totalBab}
                  </span>
                </button>
              );
            })}

          {/* 🌟 TOGGLE SUBTES LAIN (KHUSUS SMP) */}
          {isSmp && (
            <button
              type="button"
              onClick={() => {
                const next = !tampilkanSubtesLain;
                setTampilkanSubtesLain(next);
                if (!next && (selectedSubtes === 'IPA_SMP' || selectedSubtes === 'BIG_SMP')) {
                  setSelectedSubtes('ALL');
                }
              }}
              style={{
                padding: '8px 14px',
                borderRadius: 12,
                border: tampilkanSubtesLain ? '2px solid #6366f1' : '1.5px dashed #94a3b8',
                background: tampilkanSubtesLain ? '#eef2ff' : '#f8fafc',
                color: tampilkanSubtesLain ? '#4338ca' : '#475569',
                fontWeight: 700,
                fontSize: 12,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                transition: 'all 0.15s ease',
              }}
              title={tampilkanSubtesLain ? 'Sembunyikan Subtes Tambahan IPA & Inggris' : 'Tampilkan Subtes Tambahan IPA & Inggris'}
            >
              {tampilkanSubtesLain ? (
                <>
                  <EyeOff size={14} /> Sembunyikan Subtes Lain
                </>
              ) : (
                <>
                  <Eye size={14} /> + Lihat Subtes Lain (IPA & BIG)
                </>
              )}
            </button>
          )}
        </div>

        {/* Info Banner Khusus SD */}
        {isSd && (
          <div
            style={{
              marginTop: 10,
              padding: '8px 14px',
              background: '#f0fdf4',
              border: '1px solid #bbf7d0',
              borderRadius: 10,
              fontSize: 12,
              color: '#166534',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 10,
              flexWrap: 'wrap',
            }}
          >
            <span>
              ✨ <strong>Fokus TKA SD Kelas 6</strong>: 2 Subtes Utama Resmi adalah <strong>Matematika (Numerasi)</strong> dan <strong>Bahasa Indonesia (Literasi)</strong>.
            </span>
          </div>
        )}

        {/* Info Banner Khusus SMP */}
        {isSmp && (
          <div
            style={{
              marginTop: 10,
              padding: '8px 14px',
              background: '#f0fdf4',
              border: '1px solid #bbf7d0',
              borderRadius: 10,
              fontSize: 12,
              color: '#166534',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 10,
              flexWrap: 'wrap',
            }}
          >
            <span>
              ✨ <strong>Fokus TKA SMP</strong>: Subtes utama wajib resmi adalah <strong>Matematika (Numerasi)</strong> dan <strong>Bahasa Indonesia (Literasi)</strong>.
              {!tampilkanSubtesLain && ' Butuh persiapan seleksi SMA Unggulan? Klik tombol "+ Lihat Subtes Lain" untuk modul IPA & Bahasa Inggris.'}
            </span>
            {!tampilkanSubtesLain && (
              <span
                onClick={() => setTampilkanSubtesLain(true)}
                style={{ fontWeight: 800, textDecoration: 'underline', cursor: 'pointer', color: '#15803d' }}
              >
                Tampilkan Sekarang ➔
              </span>
            )}
          </div>
        )}
      </div>

      {/* 📚 GRID BAB MODUL */}
      {filteredBab.length === 0 ? (
        <div
          style={{
            background: '#ffffff',
            borderRadius: 16,
            border: '1px dashed #cbd5e1',
            padding: '40px 20px',
            textAlign: 'center',
            color: '#64748b',
          }}
        >
          <BookOpen size={36} style={{ color: '#cbd5e1', margin: '0 auto 10px' }} />
          <div style={{ fontSize: 15, fontWeight: 700, color: '#0f172a' }}>Tidak ada modul yang cocok</div>
          <div style={{ fontSize: 12.5, color: '#94a3b8', marginTop: 4 }}>
            Coba ubah kata kunci pencarian atau pilih tab subtes lain.
          </div>
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
            gap: 16,
          }}
        >
          {filteredBab.map((bab) => {
            const isSelesai = Array.isArray(statistik?.babSelesaiIds) && statistik.babSelesaiIds.includes(bab.id);
            return (
              <div
                key={bab.id}
                style={{
                  background: '#ffffff',
                  borderRadius: 16,
                  border: isSelesai ? '1.5px solid #a7f3d0' : '1px solid #e2e8f0',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                  padding: 16,
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  transition: 'all 0.2s ease',
                  position: 'relative',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow = '0 6px 16px rgba(0,0,0,0.08)';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.04)';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                <div>
                  {/* Top Bar Card */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span
                        style={{
                          background: bab.subtestBgLight,
                          color: bab.subtestWarna,
                          padding: '3px 8px',
                          borderRadius: 6,
                          fontSize: 10.5,
                          fontWeight: 800,
                          letterSpacing: '0.02em',
                        }}
                      >
                        {bab.subtestEmoji} {bab.subtestSingkatan || bab.subtestKode}
                      </span>
                      <span style={{ fontSize: 10.5, color: '#94a3b8', fontWeight: 600 }}>
                        Bab {bab.babNumber}
                      </span>
                      {isSmp && !(bab.isUtama ?? (bab.subtestKode === 'MTK_SMP' || bab.subtestKode === 'BIN_SMP')) && (
                        <span
                          style={{
                            background: '#eef2ff',
                            color: '#4f46e5',
                            padding: '2px 6px',
                            borderRadius: 4,
                            fontSize: 9.5,
                            fontWeight: 700,
                          }}
                        >
                          Pilihan
                        </span>
                      )}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 4,
                          fontSize: 11,
                          color: '#64748b',
                          fontWeight: 600,
                        }}
                      >
                        <Clock size={12} /> {bab.durasiBacaMenit}m
                      </span>

                      {isSelesai ? (
                        <span
                          style={{
                            background: '#dcfce7',
                            color: '#15803d',
                            padding: '2px 8px',
                            borderRadius: 999,
                            fontSize: 10,
                            fontWeight: 800,
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 3,
                          }}
                        >
                          <Check size={11} strokeWidth={3} /> Selesai
                        </span>
                      ) : (
                        <span
                          style={{
                            background: '#f1f5f9',
                            color: '#64748b',
                            padding: '2px 8px',
                            borderRadius: 999,
                            fontSize: 10,
                            fontWeight: 700,
                          }}
                        >
                          Siap Dibaca
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Judul Bab */}
                  <h3
                    style={{
                      margin: '0 0 6px',
                      fontSize: 15,
                      fontWeight: 800,
                      color: '#0f172a',
                      lineHeight: 1.35,
                    }}
                  >
                    <RenderMath text={bab.judul} />
                  </h3>

                  {/* Ringkasan Singkat */}
                  <div
                    style={{
                      margin: '0 0 12px',
                      fontSize: 12,
                      color: '#64748b',
                      lineHeight: 1.45,
                    }}
                  >
                    <RenderMath text={bab.ringkasanSingkat} />
                  </div>

                  {/* Learning Objectives Preview */}
                  {bab.learningObjectives && bab.learningObjectives.length > 0 && (
                    <div
                      style={{
                        background: '#f8fafc',
                        borderRadius: 10,
                        padding: '8px 10px',
                        marginBottom: 14,
                        border: '1px solid #f1f5f9',
                      }}
                    >
                      <div style={{ fontSize: 10.5, fontWeight: 700, color: '#475569', marginBottom: 4 }}>
                        🎯 Sasaran Penguasaan:
                      </div>
                      <div style={{ fontSize: 11, color: '#64748b', lineHeight: 1.4, display: 'flex', gap: 4 }}>
                        <span>•</span>
                        <span><RenderMath text={bab.learningObjectives[0]} /></span>
                      </div>
                      {bab.learningObjectives[1] && (
                        <div style={{ fontSize: 11, color: '#64748b', lineHeight: 1.4, marginTop: 2, display: 'flex', gap: 4 }}>
                          <span>•</span>
                          <span><RenderMath text={bab.learningObjectives[1]} /></span>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Bottom Actions */}
                <div style={{ paddingTop: 8, borderTop: '1px solid #f1f5f9', display: 'flex', gap: 8 }}>
                  <button
                    onClick={() => navigate(`/siswa/modul/${bab.subtestKode}/${bab.slug}`)}
                    style={{
                      flex: 1,
                      background: isSelesai ? '#0f766e' : '#0d9488',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: 10,
                      padding: '9px 12px',
                      fontSize: 12,
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 6,
                      boxShadow: '0 2px 4px rgba(13, 148, 136, 0.2)',
                    }}
                  >
                    <BookOpen size={14} />
                    {isSelesai ? 'Baca Ulang & Kuis' : 'Mulai Belajar'}
                  </button>

                  {bab.pdfUrl && (
                    <a
                      href={bab.pdfUrl}
                      download={bab.pdfFilename || 'Modul_Gemilang.pdf'}
                      title="Unduh PDF Master 52 Halaman Lengkap"
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        background: '#f0f9ff',
                        color: '#0284c7',
                        border: '1px solid #bae6fd',
                        borderRadius: 10,
                        padding: '9px 11px',
                        fontSize: 12,
                        fontWeight: 700,
                        textDecoration: 'none',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 4,
                      }}
                    >
                      <Download size={14} /> PDF
                    </a>
                  )}

                  <button
                    onClick={() => navigate('/siswa/roadmap')}
                    title="Lanjut Latihan Soal Subtes Terkait di Roadmap"
                    style={{
                      background: '#f0fdfa',
                      color: '#0d9488',
                      border: '1px solid #99f6e4',
                      borderRadius: 10,
                      padding: '9px 12px',
                      fontSize: 12,
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                    }}
                  >
                    <Flame size={14} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
