// src/pages/student/modul/ModulReaderUtbkPage.jsx
// ==============================================================================
// PEMBACA MODUL INTERAKTIF BIMBEL GEMILANG (STANDAR AMBIS 1:1)
// - SMA Kelas 12: Kurikulum UTBK-SNBT 2027
// - SMP Kelas 9 : Kurikulum TKA SMP (MTK, BIN, IPA, BIG)
// Micro-learning, Trik Cepat, Contoh Soal Terbimbing & Kuis Cek Pemahaman
// ==============================================================================

import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Clock,
  Sparkles,
  Zap,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  HelpCircle,
  RotateCcw,
  Check,
  Flame,
  Award,
  Share2,
  Download,
  Layers,
  FileText,
  Image as ImageIcon,
  Maximize2,
  ExternalLink,
  X,
} from 'lucide-react';
import {
  getSubtestByKode,
  getBabBySlug,
  getBabTetangga,
  tandaiBabSelesai,
  getDaftarBabSelesai,
  simpanSkorKuisBab,
  getSkorKuisBab,
  simpanTerakhirDibaca,
} from '../../../data/ambisModulUtbkData.js';
import {
  getSubtestSmpByKode,
  getBabSmpBySlug,
  getBabSmpTetangga,
  tandaiBabSmpSelesai,
  getDaftarBabSmpSelesai,
  simpanSkorKuisSmpBab,
  getSkorKuisSmpBab,
  simpanTerakhirDibacaSmp,
} from '../../../data/tkaSmpModulData.js';
import { useProfilSiswa } from '../../../utils/profilSiswa';
import { deteksiTingkatSiswa } from '../../../utils/tingkatSiswa';
import RenderMath from '../../../components/RenderMath';

function VisualDiagramBox({ svgContent, judul = 'Diagram Analisis Visual', caption }) {
  if (!svgContent) return null;
  return (
    <div
      style={{
        margin: '14px 0 18px',
        background: '#ffffff',
        borderRadius: 14,
        border: '1.5px solid #cbd5e1',
        padding: '16px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 10,
          paddingBottom: 8,
          borderBottom: '1px solid #f1f5f9',
          flexWrap: 'wrap',
          gap: 6,
        }}
      >
        <span
          style={{
            fontSize: 11,
            fontWeight: 800,
            color: '#0f766e',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          📐 {judul}
        </span>
        <span
          style={{
            fontSize: 10,
            background: '#f0fdfa',
            color: '#0d9488',
            padding: '2px 8px',
            borderRadius: 6,
            fontWeight: 700,
            border: '1px solid #ccfbf1',
          }}
        >
          Visual Resmi Bimbel Gemilang
        </span>
      </div>
      <div
        style={{ width: '100%', display: 'flex', justifyContent: 'center' }}
        dangerouslySetInnerHTML={{ __html: svgContent }}
      />
      {caption && (
        <div style={{ fontSize: 11, color: '#64748b', textAlign: 'center', marginTop: 8, fontStyle: 'italic' }}>
          {caption}
        </div>
      )}
    </div>
  );
}

export default function ModulReaderUtbkPage() {
  const { subtestKode, babSlug } = useParams();
  const navigate = useNavigate();
  const profil = useProfilSiswa();
  const kelasCek = profil.kelas || profil.kelasSekolah || (typeof localStorage !== 'undefined' ? localStorage.getItem('studentGrade') || localStorage.getItem('studentKelas') : '');
  const jenjangCek = profil.jenjang || (typeof localStorage !== 'undefined' ? localStorage.getItem('studentGrade') : '');
  const infoTingkat = useMemo(() => {
    return deteksiTingkatSiswa({ ...profil, kelas: kelasCek, kelasSekolah: kelasCek, jenjang: jenjangCek });
  }, [profil, kelasCek, jenjangCek]);

  // Deteksi apakah modul yang dibuka adalah subtes SMP
  const isSmpSubtest = useMemo(() => {
    const k = String(subtestKode || '').toUpperCase().trim();
    return (
      k.endsWith('_SMP') ||
      k.includes('SMP') ||
      ['MTK_SMP', 'BIN_SMP', 'IPA_SMP', 'BIG_SMP'].includes(k)
    );
  }, [subtestKode]);

  const isSmp = isSmpSubtest || infoTingkat.isSmp;

  const [studentId, setStudentId] = useState('');
  const [bukaSolusi, setBukaSolusi] = useState({});
  const [bukaSolusiUnit, setBukaSolusiUnit] = useState({});
  const [jawabanUser, setJawabanUser] = useState({});
  const [sudahDiperiksa, setSudahDiperiksa] = useState(false);
  const [hasilKuis, setHasilKuis] = useState(null);
  const [isSelesai, setIsSelesai] = useState(false);
  const [bukaSlideUnit, setBukaSlideUnit] = useState({});
  const [bukaTeksCheatSheet, setBukaTeksCheatSheet] = useState(false);
  const [bukaTeksTryout, setBukaTeksTryout] = useState(false);
  const [modalImage, setModalImage] = useState(null);

  const toggleSlideUnit = (unitKey) => {
    setBukaSlideUnit((prev) => ({ ...prev, [unitKey]: !prev[unitKey] }));
  };

  // Ambil data bab dan subtes (mendukung SMP dan UTBK SMA)
  const subtest = useMemo(() => {
    if (isSmp) {
      return getSubtestSmpByKode(subtestKode) || getSubtestByKode(subtestKode);
    }
    return getSubtestByKode(subtestKode) || getSubtestSmpByKode(subtestKode);
  }, [subtestKode, isSmp]);

  const bab = useMemo(() => {
    if (isSmp) {
      return getBabSmpBySlug(subtestKode, babSlug) || getBabBySlug(subtestKode, babSlug);
    }
    return getBabBySlug(subtestKode, babSlug) || getBabSmpBySlug(subtestKode, babSlug);
  }, [subtestKode, babSlug, isSmp]);

  const tetangga = useMemo(() => {
    if (isSmp) {
      return getBabSmpTetangga(subtestKode, babSlug) || getBabTetangga(subtestKode, babSlug);
    }
    return getBabTetangga(subtestKode, babSlug) || getBabSmpTetangga(subtestKode, babSlug);
  }, [subtestKode, babSlug, isSmp]);

  useEffect(() => {
    const sid =
      localStorage.getItem('studentId') ||
      localStorage.getItem('studentNim') ||
      localStorage.getItem('studentDocId') ||
      'siswa_gemilang_default';
    setStudentId(sid);

    if (bab) {
      // Simpan riwayat terakhir dibaca
      if (isSmp) {
        simpanTerakhirDibacaSmp(sid, {
          subtestKode: bab.subtestKode,
          babSlug: bab.slug,
          judul: bab.judul,
        });
      } else {
        simpanTerakhirDibaca(sid, {
          subtestKode: bab.subtestKode,
          babSlug: bab.slug,
          judul: bab.judul,
        });
      }

      // Cek apakah sudah selesai sebelumnya
      const selesaiList = isSmp ? getDaftarBabSmpSelesai(sid) : getDaftarBabSelesai(sid);
      setIsSelesai(selesaiList.includes(bab.id));

      // Cek apakah sudah pernah mengerjakan kuis bab ini
      const savedKuis = isSmp ? getSkorKuisSmpBab(sid, bab.id) : getSkorKuisBab(sid, bab.id);
      if (savedKuis) {
        setHasilKuis(savedKuis);
      } else {
        setHasilKuis(null);
      }

      // Reset state kuis untuk bab baru
      setJawabanUser({});
      setSudahDiperiksa(false);
      setBukaSolusi({});
      setBukaSolusiUnit({});
      window.scrollTo(0, 0);
    }
  }, [subtestKode, babSlug, bab, isSmp]);

  // Guard hak akses: Hanya Kelas 12 SMA & SMP yang diizinkan
  if (!infoTingkat.isKelas12 && !infoTingkat.isSmp) {
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
            ? 'Mohon maaf, materi modul UTBK-SNBT ini diperuntukkan bagi siswa Kelas 12 SMA & Alumni. Untuk siswa Kelas 10 & 11, silakan fokus eksplorasi Target Kampus & Katalog 173 PTN serta pendalaman materi sekolah.'
            : 'Mohon maaf, modul belajar interaktif saat ini tersedia untuk jenjang TKA SMP Kelas 9 dan UTBK-SNBT Kelas 12 SMA. Silakan akses menu belajar dan latihan harian sesuai jenjangmu di Dashboard.'}
        </p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          {infoTingkat.bisaAksesTargetKampus && (
            <button
              type="button"
              onClick={() => navigate('/siswa/target-kampus')}
              style={{
                background: '#0d9488', color: '#fff', border: 'none', borderRadius: 10,
                padding: '10px 20px', fontWeight: 700, fontSize: 13, cursor: 'pointer',
              }}
            >
              Eksplorasi Target Kampus 🎯
            </button>
          )}
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

  if (!bab || !subtest) {
    return (
      <div style={{ maxWidth: 760, margin: '60px auto', padding: 20, textAlign: 'center' }}>
        <h2 style={{ fontSize: 20, color: '#0f172a' }}>Bab Modul Tidak Ditemukan</h2>
        <p style={{ color: '#64748b', fontSize: 13, marginBottom: 20 }}>
          Modul yang kamu cari mungkin telah dipindahkan atau kode subtes tidak valid.
        </p>
        <button
          onClick={() => navigate('/siswa/modul')}
          style={{
            background: '#0d9488',
            color: '#fff',
            border: 'none',
            padding: '10px 18px',
            borderRadius: 12,
            fontWeight: 700,
            cursor: 'pointer',
          }}
        >
          Kembali ke Daftar Modul
        </button>
      </div>
    );
  }

  // Handler toggle solusi contoh soal
  const toggleSolusi = (idx) => {
    setBukaSolusi((prev) => ({ ...prev, [idx]: !prev[idx] }));
  };

  const toggleSolusiUnit = (unitKey) => {
    setBukaSolusiUnit((prev) => ({ ...prev, [unitKey]: !prev[unitKey] }));
  };

  // Handler memilih opsi jawaban kuis
  const pilihOpsiKuis = (qId, opsiLabel) => {
    if (sudahDiperiksa) return; // Kunci setelah diperiksa
    setJawabanUser((prev) => ({ ...prev, [qId]: opsiLabel }));
  };

  // Handler periksa jawaban kuis
  const periksaKuis = () => {
    let benar = 0;
    const total = bab.kuisPemahaman.length;

    bab.kuisPemahaman.forEach((q) => {
      if (jawabanUser[q.id] === q.kunci) {
        benar += 1;
      }
    });

    const res = isSmp
      ? simpanSkorKuisSmpBab(studentId, bab.id, benar, total)
      : simpanSkorKuisBab(studentId, bab.id, benar, total);

    setHasilKuis(res);
    setSudahDiperiksa(true);
    if (benar >= Math.ceil(total * 0.6)) {
      setIsSelesai(true);
    }
  };

  // Handler ulangi kuis
  const ulangiKuis = () => {
    setJawabanUser({});
    setSudahDiperiksa(false);
  };

  // Handler tandai manual bab selesai
  const handleTandaiSelesai = () => {
    if (isSmp) {
      tandaiBabSmpSelesai(studentId, bab.id);
    } else {
      tandaiBabSelesai(studentId, bab.id);
    }
    setIsSelesai(true);
  };

  return (
    <div style={{ maxWidth: 860, margin: '0 auto', padding: '16px 14px 60px', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      {/* 🧭 TOP NAVBAR & BREADCRUMB */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
          marginBottom: 16,
          flexWrap: 'wrap',
        }}
      >
        <button
          onClick={() => navigate('/siswa/modul')}
          style={{
            background: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: 10,
            padding: '7px 12px',
            fontSize: 12,
            fontWeight: 700,
            color: '#475569',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          <ArrowLeft size={14} /> Daftar Modul {isSmp ? 'TKA' : 'UTBK'}
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          {bab.pdfUrl && (
            <a
              href={bab.pdfUrl}
              download={bab.pdfFilename || 'Modul_Gemilang.pdf'}
              title="Unduh PDF Master 52 Halaman Lengkap"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                background: '#0284c7',
                color: '#ffffff',
                border: 'none',
                padding: '5px 12px',
                borderRadius: 8,
                fontSize: 11.5,
                fontWeight: 800,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
                textDecoration: 'none',
                boxShadow: '0 2px 4px rgba(2, 132, 199, 0.25)',
              }}
            >
              <Download size={13} /> Unduh PDF ({bab.pdfTotalHalaman || 52} Hal)
            </a>
          )}

          <span
            style={{
              background: subtest.bgLight,
              color: subtest.badgeWarna,
              padding: '4px 10px',
              borderRadius: 8,
              fontSize: 11,
              fontWeight: 800,
            }}
          >
            {subtest.emoji} {subtest.singkatan || subtest.kode} • Bab {bab.babNumber}
          </span>

          {isSelesai ? (
            <span
              style={{
                background: '#dcfce7',
                color: '#15803d',
                padding: '4px 10px',
                borderRadius: 8,
                fontSize: 11,
                fontWeight: 800,
                display: 'flex',
                alignItems: 'center',
                gap: 4,
              }}
            >
              <Check size={13} strokeWidth={3} /> Selesai
            </span>
          ) : (
            <button
              onClick={handleTandaiSelesai}
              style={{
                background: '#f1f5f9',
                color: '#475569',
                border: '1px solid #cbd5e1',
                padding: '4px 10px',
                borderRadius: 8,
                fontSize: 11,
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              Tandai Sudah Paham
            </button>
          )}
        </div>
      </div>

      {/* 📄 HEADER BAB */}
      <div
        style={{
          background: '#ffffff',
          borderRadius: 20,
          border: '1px solid #e2e8f0',
          padding: '24px 22px',
          boxShadow: '0 2px 10px rgba(0,0,0,0.03)',
          marginBottom: 20,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#64748b', fontSize: 11.5, marginBottom: 8, flexWrap: 'wrap' }}>
          <span style={{ fontWeight: 700, color: subtest.badgeWarna }}>{subtest.nama}</span>
          <span>•</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <Clock size={12} /> Estimasi Baca {bab.durasiBacaMenit} Menit
          </span>
          <span>•</span>
          <span style={{ color: '#0d9488', fontWeight: 700 }}>🔓 Bebas Akses Gemilang</span>
        </div>

        <h1 style={{ margin: '0 0 10px', fontSize: 22, fontWeight: 800, color: '#0f172a', lineHeight: 1.3 }}>
          {bab.judul}
        </h1>

        <div style={{ margin: 0, fontSize: 13.5, color: '#475569', lineHeight: 1.6 }}>
          <RenderMath text={bab.ringkasanSingkat} />
        </div>
      </div>

      {/* 🎯 SASARAN BELAJAR (LEARNING OBJECTIVES) */}
      {bab.learningObjectives && bab.learningObjectives.length > 0 && (
        <div
          style={{
            background: 'linear-gradient(135deg, #f0fdfa 0%, #ecfeff 100%)',
            border: '1.5px solid #99f6e4',
            borderRadius: 16,
            padding: '16px 18px',
            marginBottom: 24,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10, color: '#0f766e', fontWeight: 800, fontSize: 13.5 }}>
            <Sparkles size={16} />
            Setelah mempelajari bab ini, kamu bisa:
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {bab.learningObjectives.map((obj, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 12.5, color: '#134e4a', lineHeight: 1.5 }}>
                <CheckCircle2 size={15} style={{ color: '#0d9488', flexShrink: 0, marginTop: 2 }} />
                <span><RenderMath text={obj} /></span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 📐 DIAGRAM LANGKAH & INFOGRAFIS PRESISI (GEMILANG) */}
      {bab.diagramSvg && (
        <VisualDiagramBox
          svgContent={bab.diagramSvg}
          judul={`Diagram Langkah & Kaidah Presisi: ${bab.judul}`}
          caption="Diagram langkah presisi resmi Bimbel Gemilang (Bebas Watermark & Pergeseran Terukur)"
        />
      )}

      {/* 📚 MATERI PEMBELAJARAN (UNIT TKA SMP / KONSEP UTBK SMA) */}
      {bab.units && bab.units.length > 0 ? (
        <div style={{ marginBottom: 28 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14, flexWrap: 'wrap', gap: 10 }}>
            <h2 style={{ fontSize: 17, fontWeight: 800, color: '#0f172a', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Layers size={18} style={{ color: subtest.badgeWarna || '#0d9488' }} />
              Daftar Unit Pembelajaran ({bab.units.length} Unit Master)
            </h2>
            <span style={{ fontSize: 11, background: '#f1f5f9', color: '#475569', padding: '3px 8px', borderRadius: 6, fontWeight: 700 }}>
              Kurikulum Resmi 2027
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {bab.units.map((u, uIdx) => {
              const unitKey = u.unitNumber || `u_${uIdx}`;
              const isOpenSolusi = !!bukaSolusiUnit[unitKey];
              return (
                <div
                  key={unitKey}
                  style={{
                    background: '#ffffff',
                    border: '1px solid #e2e8f0',
                    borderRadius: 18,
                    padding: '20px 22px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
                  }}
                >
                  {/* Top Bar Unit */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10, flexWrap: 'wrap', gap: 6 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span
                        style={{
                          background: subtest.bgLight || '#f0fdfa',
                          color: subtest.badgeWarna || '#0d9488',
                          padding: '3px 8px',
                          borderRadius: 6,
                          fontSize: 11,
                          fontWeight: 800,
                        }}
                      >
                        Unit {u.unitNumber}
                      </span>
                      <h3 style={{ margin: 0, fontSize: 15, fontWeight: 800, color: '#0f172a' }}>
                        {u.judul}
                      </h3>
                    </div>
                    {u.pageNumber && (
                      <span style={{ fontSize: 10.5, color: '#94a3b8', fontWeight: 600 }}>
                        Hal. {u.pageNumber}
                      </span>
                    )}
                  </div>

                  {/* Hook / Motivasi */}
                  {u.hook && (
                    <div
                      style={{
                        margin: '0 0 14px',
                        padding: '10px 14px',
                        borderRadius: 10,
                        background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
                        borderLeft: `4px solid ${subtest.badgeWarna || '#0d9488'}`,
                        fontSize: 12.5,
                        color: '#334155',
                        fontWeight: 600,
                        fontStyle: 'italic',
                      }}
                    >
                      💡 {u.hook}
                    </div>
                  )}

                  {/* Teori & Penjelasan */}
                  {u.teori && (
                    <div style={{ margin: '0 0 14px', fontSize: 13, color: '#334155', lineHeight: 1.65 }}>
                      <RenderMath text={u.teori} />
                    </div>
                  )}

                  {/* 🖼️ Ilustrasi Konten Unit (Visual Asli Modul Master) */}
                  {u.illustrationImg && (
                    <div
                      style={{
                        margin: '0 0 16px',
                        background: '#f8fafc',
                        border: '1.5px solid #e2e8f0',
                        borderRadius: 14,
                        padding: '14px',
                        textAlign: 'center',
                      }}
                    >
                      <div
                        style={{
                          display: 'inline-block',
                          position: 'relative',
                          maxWidth: '100%',
                          borderRadius: 10,
                          overflow: 'hidden',
                          background: '#ffffff',
                          boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                          cursor: 'zoom-in',
                        }}
                        onClick={() =>
                          setModalImage({
                            url: u.illustrationImg,
                            title: u.illustrationCaption || `Ilustrasi Unit ${u.unitNumber} - ${u.judul}`,
                          })
                        }
                      >
                        <img
                          src={u.illustrationImg}
                          alt={u.illustrationCaption || u.judul}
                          style={{
                            maxWidth: '100%',
                            maxHeight: 320,
                            objectFit: 'contain',
                            display: 'block',
                          }}
                          loading="lazy"
                        />
                        <div
                          style={{
                            position: 'absolute',
                            bottom: 6,
                            right: 6,
                            background: 'rgba(15, 23, 42, 0.75)',
                            color: '#ffffff',
                            padding: '3px 6px',
                            borderRadius: 6,
                            fontSize: 10,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 4,
                          }}
                        >
                          <Maximize2 size={11} /> Perbesar
                        </div>
                      </div>
                      {u.illustrationCaption && (
                        <div
                          style={{
                            marginTop: 8,
                            fontSize: 11.5,
                            color: '#475569',
                            fontWeight: 600,
                            fontStyle: 'italic',
                          }}
                        >
                          📷 {u.illustrationCaption}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Pondasi Konsep Inti */}
                  {u.pondasi && (
                    <div
                      style={{
                        background: '#faf5ff',
                        border: '1.5px solid #e9d5ff',
                        borderRadius: 12,
                        padding: '12px 14px',
                        marginBottom: 12,
                      }}
                    >
                      <div style={{ fontSize: 11, fontWeight: 800, color: '#7e22ce', textTransform: 'uppercase', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Sparkles size={13} /> Pondasi Kaidah Pokok
                      </div>
                      <div style={{ fontSize: 12.5, color: '#581c87', lineHeight: 1.55 }}>
                        <RenderMath text={u.pondasi} />
                      </div>
                    </div>
                  )}

                  {/* Jebakan TKA */}
                  {u.jebakanTka && (
                    <div
                      style={{
                        background: '#fff1f2',
                        border: '1.5px solid #fecdd3',
                        borderRadius: 12,
                        padding: '12px 14px',
                        marginBottom: 12,
                      }}
                    >
                      <div style={{ fontSize: 11, fontWeight: 800, color: '#be123c', textTransform: 'uppercase', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
                        <AlertTriangle size={13} /> Jebakan TKA / Hati-hati
                      </div>
                      <div style={{ fontSize: 12.5, color: '#881337', lineHeight: 1.55 }}>
                        <RenderMath text={u.jebakanTka} />
                      </div>
                    </div>
                  )}

                  {/* Yuk Bahas Soal */}
                  {u.contohSoal && u.contohSoal.soal && (
                    <div
                      style={{
                        background: '#f0fdfa',
                        border: '1.5px solid #99f6e4',
                        borderRadius: 12,
                        padding: '14px 16px',
                        marginBottom: 12,
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8, flexWrap: 'wrap', gap: 6 }}>
                        <span style={{ fontSize: 11, fontWeight: 800, color: '#0f766e', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 5 }}>
                          <HelpCircle size={13} /> {u.contohSoal.judul || 'Yuk Bahas Soal TKA'}
                        </span>
                        {u.contohSoal.jawaban && (
                          <span style={{ fontSize: 10.5, background: '#ccfbf1', color: '#0f766e', padding: '2px 8px', borderRadius: 6, fontWeight: 700 }}>
                            Kunci: {u.contohSoal.jawaban}
                          </span>
                        )}
                      </div>

                      <div style={{ fontSize: 13, color: '#0f172a', fontWeight: 600, lineHeight: 1.55, marginBottom: 8 }}>
                        <RenderMath text={u.contohSoal.soal} />
                      </div>

                      {u.contohSoal.opsiString && (
                        <div style={{ fontSize: 12, color: '#475569', marginBottom: 10, background: '#ffffff', padding: '8px 10px', borderRadius: 8, border: '1px solid #ccfbf1' }}>
                          <RenderMath text={u.contohSoal.opsiString} />
                        </div>
                      )}

                      <button
                        type="button"
                        onClick={() => toggleSolusiUnit(unitKey)}
                        style={{
                          background: isOpenSolusi ? '#ffffff' : '#ccfbf1',
                          color: '#0f766e',
                          border: '1px solid #5eead4',
                          borderRadius: 8,
                          padding: '6px 12px',
                          fontSize: 11.5,
                          fontWeight: 700,
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 5,
                        }}
                      >
                        {isOpenSolusi ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                        {isOpenSolusi ? 'Tutup Solusi' : 'Lihat Solusi Bertahap'}
                      </button>

                      {isOpenSolusi && (
                        <div style={{ marginTop: 10, padding: '10px 12px', background: '#ffffff', borderRadius: 8, border: '1px solid #99f6e4', fontSize: 12, color: '#334155', lineHeight: 1.55 }}>
                          <RenderMath text={u.contohSoal.solusi} />
                        </div>
                      )}
                    </div>
                  )}

                  {/* Trik Cepat */}
                  {u.trikCepat && (
                    <div
                      style={{
                        background: '#fffbeb',
                        border: '1.5px solid #fde68a',
                        borderRadius: 12,
                        padding: '12px 14px',
                      }}
                    >
                      <div style={{ fontSize: 11, fontWeight: 800, color: '#b45309', textTransform: 'uppercase', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Zap size={13} /> Trik Cepat Gemilang
                      </div>
                      <div style={{ fontSize: 12.5, color: '#78350f', lineHeight: 1.55 }}>
                        <RenderMath text={u.trikCepat} />
                      </div>
                    </div>
                  )}

                  {/* 📄 LIHAT SLIDE CETAK ASLI MODUL MASTER */}
                  {u.slideImg && (
                    <div style={{ marginTop: 14, paddingTop: 12, borderTop: '1px dashed #e2e8f0' }}>
                      <button
                        type="button"
                        onClick={() => toggleSlideUnit(unitKey)}
                        style={{
                          background: bukaSlideUnit[unitKey] ? '#f1f5f9' : '#ffffff',
                          color: '#334155',
                          border: '1px solid #cbd5e1',
                          borderRadius: 8,
                          padding: '7px 12px',
                          fontSize: 11.5,
                          fontWeight: 700,
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 6,
                          transition: 'all 0.15s ease',
                        }}
                      >
                        <ImageIcon size={14} style={{ color: '#0d9488' }} />
                        {bukaSlideUnit[unitKey]
                          ? 'Tutup Slide Cetak Asli'
                          : `Lihat Slide Cetak Asli (Hal. ${u.pageNumber || uIdx + 1})`}
                      </button>

                      {bukaSlideUnit[unitKey] && (
                        <div
                          style={{
                            marginTop: 10,
                            borderRadius: 14,
                            overflow: 'hidden',
                            border: '1.5px solid #cbd5e1',
                            background: '#0f172a',
                            boxShadow: '0 4px 14px rgba(0,0,0,0.12)',
                          }}
                        >
                          <img
                            src={u.slideImg}
                            alt={`Slide Asli Hal ${u.pageNumber} - ${u.judul}`}
                            style={{
                              width: '100%',
                              height: 'auto',
                              display: 'block',
                              cursor: 'zoom-in',
                            }}
                            onClick={() =>
                              setModalImage({
                                url: u.slideImg,
                                title: `Slide Modul Asli: Unit ${u.unitNumber} - ${u.judul} (Hal. ${u.pageNumber})`,
                              })
                            }
                            loading="lazy"
                          />
                          <div
                            style={{
                              padding: '8px 14px',
                              background: '#1e293b',
                              color: '#94a3b8',
                              fontSize: 11,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              flexWrap: 'wrap',
                              gap: 6,
                            }}
                          >
                            <span>📖 Tampilan Desain Canva Modul Master (Hal. {u.pageNumber})</span>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                              <span
                                style={{ cursor: 'pointer', color: '#38bdf8', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}
                                onClick={() =>
                                  setModalImage({
                                    url: u.slideImg,
                                    title: `Slide Modul Asli: Unit ${u.unitNumber} - ${u.judul} (Hal. ${u.pageNumber})`,
                                  })
                                }
                              >
                                <Maximize2 size={12} /> Perbesar
                              </span>
                              <a
                                href={u.slideImg}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{ color: '#cbd5e1', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}
                              >
                                <ExternalLink size={12} /> Tab Baru ↗
                              </a>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* 📋 CHEAT SHEET MASTER (KHUSUS BAB 3) */}
          {(bab.cheatSheetImg || bab.cheatSheet) && (
            <div
              style={{
                marginTop: 24,
                background: 'linear-gradient(135deg, #fefce8 0%, #fffbeb 100%)',
                border: '2px solid #fef08a',
                borderRadius: 20,
                padding: '22px 24px',
                boxShadow: '0 4px 16px rgba(234, 179, 8, 0.15)',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: 16,
                  flexWrap: 'wrap',
                  gap: 10,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div
                    style={{
                      background: '#fef08a',
                      color: '#854d0e',
                      width: 38,
                      height: 38,
                      borderRadius: 10,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 900,
                    }}
                  >
                    <FileText size={20} />
                  </div>
                  <div>
                    <h3 style={{ margin: 0, fontSize: 16, fontWeight: 900, color: '#854d0e' }}>
                      Cheat Sheet Master 1 Halaman — Bimbel Gemilang
                    </h3>
                    <p style={{ margin: '2px 0 0', fontSize: 11.5, color: '#a16207', fontWeight: 600 }}>
                      Infografis Rumus Cepat & Peta Hafalan Satu Pandangan (Hal. 43)
                    </p>
                  </div>
                </div>
                <span
                  style={{
                    background: '#fde047',
                    color: '#713f12',
                    padding: '4px 10px',
                    borderRadius: 8,
                    fontSize: 11,
                    fontWeight: 800,
                  }}
                >
                  Poster Visual HD
                </span>
              </div>

              {/* POSTER VISUAL UTAMA */}
              {bab.cheatSheetImg && (
                <div
                  style={{
                    borderRadius: 14,
                    overflow: 'hidden',
                    border: '1.5px solid #fde047',
                    background: '#ffffff',
                    boxShadow: '0 4px 14px rgba(234, 179, 8, 0.12)',
                    marginBottom: 14,
                  }}
                >
                  <img
                    src={bab.cheatSheetImg}
                    alt="Cheat Sheet Master Bimbel Gemilang"
                    style={{
                      width: '100%',
                      height: 'auto',
                      display: 'block',
                      cursor: 'zoom-in',
                    }}
                    onClick={() =>
                      setModalImage({
                        url: bab.cheatSheetImg,
                        title: `Cheat Sheet Master 1 Halaman: ${bab.judul}`,
                      })
                    }
                    loading="lazy"
                  />
                  <div
                    style={{
                      padding: '8px 14px',
                      background: '#fef9c3',
                      borderTop: '1px solid #fef08a',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      flexWrap: 'wrap',
                      gap: 8,
                      fontSize: 11,
                      color: '#854d0e',
                    }}
                  >
                    <span
                      style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5, fontWeight: 700 }}
                      onClick={() =>
                        setModalImage({
                          url: bab.cheatSheetImg,
                          title: `Cheat Sheet Master 1 Halaman: ${bab.judul}`,
                        })
                      }
                    >
                      <Maximize2 size={13} /> Klik gambar untuk memperbesar resolusi tinggi
                    </span>
                    <a
                      href={bab.cheatSheetImg}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        color: '#b45309',
                        fontWeight: 700,
                        textDecoration: 'none',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4,
                      }}
                    >
                      <ExternalLink size={13} /> Buka Gambar Asli ↗
                    </a>
                  </div>
                </div>
              )}

              {/* TOGGLE RANGKUMAN TEKS FORMULA */}
              {bab.cheatSheet && (
                <div>
                  <button
                    type="button"
                    onClick={() => setBukaTeksCheatSheet(!bukaTeksCheatSheet)}
                    style={{
                      background: bukaTeksCheatSheet ? '#fef08a' : '#ffffff',
                      color: '#854d0e',
                      border: '1.5px solid #fde047',
                      borderRadius: 10,
                      padding: '8px 14px',
                      fontSize: 12,
                      fontWeight: 800,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                    }}
                  >
                    {bukaTeksCheatSheet ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    {bukaTeksCheatSheet ? 'Tutup Rangkuman Teks Formula' : 'Buka Rangkuman Teks Formula (KaTeX)'}
                  </button>

                  {bukaTeksCheatSheet && (
                    <div
                      style={{
                        marginTop: 12,
                        padding: '16px 18px',
                        background: '#ffffff',
                        borderRadius: 12,
                        border: '1px solid #fef08a',
                        fontSize: 12.5,
                        color: '#713f12',
                        lineHeight: 1.65,
                      }}
                    >
                      <RenderMath text={bab.cheatSheet} />
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ⏱️ SIMULASI MINI TRYOUT & PETA BELAJAR (KHUSUS BAB 4) */}
          {(bab.tryoutImg || bab.miniTryout) && (
            <div
              style={{
                marginTop: 24,
                background: 'linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%)',
                border: '2px solid #a7f3d0',
                borderRadius: 20,
                padding: '22px 24px',
                boxShadow: '0 4px 16px rgba(16, 185, 129, 0.15)',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: 16,
                  flexWrap: 'wrap',
                  gap: 10,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div
                    style={{
                      background: '#a7f3d0',
                      color: '#065f46',
                      width: 38,
                      height: 38,
                      borderRadius: 10,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 900,
                    }}
                  >
                    <Award size={20} />
                  </div>
                  <div>
                    <h3 style={{ margin: 0, fontSize: 16, fontWeight: 900, color: '#065f46' }}>
                      Simulasi Mini Tryout & Peta Belajar Menuju Ujian
                    </h3>
                    <p style={{ margin: '2px 0 0', fontSize: 11.5, color: '#047857', fontWeight: 600 }}>
                      Poster Simulasi Soal (Hal. 51) & Roadmap Belajar H-30 (Hal. 52)
                    </p>
                  </div>
                </div>
                <span
                  style={{
                    background: '#6ee7b7',
                    color: '#064e3b',
                    padding: '4px 10px',
                    borderRadius: 8,
                    fontSize: 11,
                    fontWeight: 800,
                  }}
                >
                  Poster Visual HD
                </span>
              </div>

              {/* POSTER MINI TRYOUT & PETA BELAJAR */}
              {(bab.tryoutImg || bab.petaBelajarImg) && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 14 }}>
                  {bab.tryoutImg && (
                    <div
                      style={{
                        borderRadius: 14,
                        overflow: 'hidden',
                        border: '1.5px solid #a7f3d0',
                        background: '#ffffff',
                        boxShadow: '0 4px 14px rgba(16, 185, 129, 0.1)',
                      }}
                    >
                      <div
                        style={{
                          padding: '8px 14px',
                          background: '#d1fae5',
                          borderBottom: '1px solid #a7f3d0',
                          fontSize: 12,
                          fontWeight: 800,
                          color: '#065f46',
                        }}
                      >
                        📝 Lembar Simulasi Soal Mini Tryout (Hal. 51)
                      </div>
                      <img
                        src={bab.tryoutImg}
                        alt="Simulasi Soal Mini Tryout"
                        style={{ width: '100%', height: 'auto', display: 'block', cursor: 'zoom-in' }}
                        onClick={() =>
                          setModalImage({
                            url: bab.tryoutImg,
                            title: `Simulasi Mini Tryout: ${bab.judul} (Hal. 51)`,
                          })
                        }
                        loading="lazy"
                      />
                      <div
                        style={{
                          padding: '6px 14px',
                          background: '#ecfdf5',
                          fontSize: 11,
                          display: 'flex',
                          justifyContent: 'space-between',
                          color: '#047857',
                        }}
                      >
                        <span
                          style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontWeight: 700 }}
                          onClick={() =>
                            setModalImage({
                              url: bab.tryoutImg,
                              title: `Simulasi Mini Tryout: ${bab.judul} (Hal. 51)`,
                            })
                          }
                        >
                          <Maximize2 size={12} /> Klik untuk memperbesar
                        </span>
                        <a
                          href={bab.tryoutImg}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ color: '#047857', textDecoration: 'none', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4 }}
                        >
                          <ExternalLink size={12} /> Buka Gambar Asli ↗
                        </a>
                      </div>
                    </div>
                  )}

                  {bab.petaBelajarImg && (
                    <div
                      style={{
                        borderRadius: 14,
                        overflow: 'hidden',
                        border: '1.5px solid #a7f3d0',
                        background: '#ffffff',
                        boxShadow: '0 4px 14px rgba(16, 185, 129, 0.1)',
                      }}
                    >
                      <div
                        style={{
                          padding: '8px 14px',
                          background: '#d1fae5',
                          borderBottom: '1px solid #a7f3d0',
                          fontSize: 12,
                          fontWeight: 800,
                          color: '#065f46',
                        }}
                      >
                        🗺️ Roadmap Peta Belajar & Strategi Ujian (Hal. 52)
                      </div>
                      <img
                        src={bab.petaBelajarImg}
                        alt="Peta Belajar Menuju Ujian"
                        style={{ width: '100%', height: 'auto', display: 'block', cursor: 'zoom-in' }}
                        onClick={() =>
                          setModalImage({
                            url: bab.petaBelajarImg,
                            title: `Peta Belajar Menuju Ujian: ${bab.judul} (Hal. 52)`,
                          })
                        }
                        loading="lazy"
                      />
                      <div
                        style={{
                          padding: '6px 14px',
                          background: '#ecfdf5',
                          fontSize: 11,
                          display: 'flex',
                          justifyContent: 'space-between',
                          color: '#047857',
                        }}
                      >
                        <span
                          style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontWeight: 700 }}
                          onClick={() =>
                            setModalImage({
                              url: bab.petaBelajarImg,
                              title: `Peta Belajar Menuju Ujian: ${bab.judul} (Hal. 52)`,
                            })
                          }
                        >
                          <Maximize2 size={12} /> Klik untuk memperbesar
                        </span>
                        <a
                          href={bab.petaBelajarImg}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ color: '#047857', textDecoration: 'none', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4 }}
                        >
                          <ExternalLink size={12} /> Buka Gambar Asli ↗
                        </a>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* TOGGLE TEKS MINI TRYOUT */}
              {bab.miniTryout && (
                <div>
                  <button
                    type="button"
                    onClick={() => setBukaTeksTryout(!bukaTeksTryout)}
                    style={{
                      background: bukaTeksTryout ? '#a7f3d0' : '#ffffff',
                      color: '#065f46',
                      border: '1.5px solid #6ee7b7',
                      borderRadius: 10,
                      padding: '8px 14px',
                      fontSize: 12,
                      fontWeight: 800,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                    }}
                  >
                    {bukaTeksTryout ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    {bukaTeksTryout ? 'Tutup Teks Soal & Pembahasan' : 'Buka Teks Soal & Pembahasan (KaTeX)'}
                  </button>

                  {bukaTeksTryout && (
                    <div
                      style={{
                        marginTop: 12,
                        padding: '16px 18px',
                        background: '#ffffff',
                        borderRadius: 12,
                        border: '1px solid #a7f3d0',
                        fontSize: 12.5,
                        color: '#064e3b',
                        lineHeight: 1.65,
                      }}
                    >
                      <RenderMath text={bab.miniTryout} />
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        /* Fallback Konsep Teori untuk SMA UTBK */
        <>
          <div style={{ marginBottom: 24 }}>
            <h2 style={{ fontSize: 17, fontWeight: 800, color: '#0f172a', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
              <BookOpen size={18} style={{ color: '#0d9488' }} /> Konsep Inti & Kaidah Teori
            </h2>

            {bab.konsepTeori &&
              bab.konsepTeori.map((kt, i) => (
                <div
                  key={i}
                  style={{
                    background: '#ffffff',
                    border: '1px solid #e2e8f0',
                    borderRadius: 16,
                    padding: '18px 20px',
                    marginBottom: 16,
                    boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
                  }}
                >
                  <h3 style={{ margin: '0 0 10px', fontSize: 15, fontWeight: 800, color: '#0f172a' }}>
                    {kt.subjudul}
                  </h3>
                  <div style={{ margin: '0 0 12px', fontSize: 13, color: '#334155', lineHeight: 1.65 }}>
                    <RenderMath text={kt.isi} />
                  </div>

                  {kt.diagramSvg && (
                    <VisualDiagramBox svgContent={kt.diagramSvg} judul={`Visualisasi: ${kt.subjudul}`} />
                  )}

                  {kt.poinPenting && kt.poinPenting.length > 0 && (
                    <div
                      style={{
                        background: '#f8fafc',
                        borderRadius: 12,
                        padding: '12px 14px',
                        borderLeft: '4px solid #0d9488',
                      }}
                    >
                      <div style={{ fontSize: 11, fontWeight: 800, color: '#0f766e', textTransform: 'uppercase', marginBottom: 6 }}>
                        {isSmp ? 'Kaidah Penting TKA SMP:' : 'Kaidah Penting UTBK:'}
                      </div>
                      {kt.poinPenting.map((pt, pIdx) => (
                        <div key={pIdx} style={{ fontSize: 12, color: '#475569', lineHeight: 1.5, marginBottom: 4 }}>
                          • <RenderMath text={pt} />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
          </div>

          {/* ⚡ TRIK CEPAT GEMILANG */}
          {bab.trikCepat && (
            <div
              style={{
                background: 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)',
                border: '1.5px solid #fde68a',
                borderRadius: 16,
                padding: '18px 20px',
                marginBottom: 20,
                boxShadow: '0 2px 6px rgba(217, 119, 6, 0.08)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#b45309', fontWeight: 800, fontSize: 14, marginBottom: 8 }}>
                <Zap size={18} />
                {isSmp ? 'Trik Kilat Gemilang (30 Detik)' : 'Trik Cepat UTBK (30 Detik)'}
              </div>
              <div style={{ margin: 0, fontSize: 13, color: '#78350f', lineHeight: 1.6, fontWeight: 500 }}>
                <RenderMath text={bab.trikCepat} />
              </div>
            </div>
          )}

          {/* ⚠️ JEBAKAN UMUM (DISTRACTOR TRAP) */}
          {bab.jebakanUmum && (
            <div
              style={{
                background: 'linear-gradient(135deg, #fff1f2 0%, #ffe4e6 100%)',
                border: '1.5px solid #fecdd3',
                borderRadius: 16,
                padding: '18px 20px',
                marginBottom: 24,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#be123c', fontWeight: 800, fontSize: 14, marginBottom: 8 }}>
                <AlertTriangle size={18} />
                Jebakan Umum (Distractor Trap)
              </div>
              <div style={{ margin: 0, fontSize: 13, color: '#881337', lineHeight: 1.6, fontWeight: 500 }}>
                <RenderMath text={bab.jebakanUmum} />
              </div>
            </div>
          )}

          {/* 📝 CONTOH SOAL TERBIMBING */}
          {bab.contohSoal && bab.contohSoal.length > 0 && (
            <div style={{ marginBottom: 28 }}>
              <h2 style={{ fontSize: 17, fontWeight: 800, color: '#0f172a', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
                <HelpCircle size={18} style={{ color: '#2563eb' }} /> Contoh Soal Terbimbing
              </h2>

              {bab.contohSoal.map((cs, i) => (
                <div
                  key={i}
                  style={{
                    background: '#ffffff',
                    border: '1px solid #e2e8f0',
                    borderRadius: 16,
                    padding: '20px',
                    marginBottom: 16,
                  }}
                >
                  <div style={{ fontSize: 11, fontWeight: 800, color: '#2563eb', textTransform: 'uppercase', marginBottom: 8 }}>
                    Contoh Kasus #{i + 1}
                  </div>
                  <div style={{ fontSize: 13.5, color: '#0f172a', lineHeight: 1.6, fontWeight: 600, marginBottom: 14 }}>
                    <RenderMath text={cs.soal} />
                  </div>

                  {/* Diagram Visual Contoh Kasus jika ada */}
                  {cs.diagramSvg && (
                    <VisualDiagramBox svgContent={cs.diagramSvg} judul={`Visualisasi Geometri Kasus #${i + 1}`} />
                  )}

                  {/* Opsi Jawaban */}
                  {cs.opsi && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 16 }}>
                      {Object.entries(cs.opsi).map(([label, text]) => (
                        <div
                          key={label}
                          style={{
                            padding: '8px 12px',
                            borderRadius: 8,
                            background: '#f8fafc',
                            border: '1px solid #e2e8f0',
                            fontSize: 12.5,
                            color: '#334155',
                          }}
                        >
                          <strong style={{ color: '#0f172a' }}>{label}.</strong> <RenderMath text={text} />
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Toggle Solusi */}
                  <button
                    onClick={() => toggleSolusi(i)}
                    style={{
                      background: bukaSolusi[i] ? '#f1f5f9' : '#eff6ff',
                      color: '#2563eb',
                      border: '1px solid #bfdbfe',
                      borderRadius: 10,
                      padding: '8px 14px',
                      fontSize: 12,
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                    }}
                  >
                    {bukaSolusi[i] ? (
                      <>
                        <ChevronUp size={14} /> Tutup Langkah Pembahasan
                      </>
                    ) : (
                      <>
                        <ChevronDown size={14} /> Buka Solusi Bertahap (Kunci: {cs.kunci})
                      </>
                    )}
                  </button>

                  {/* Box Langkah Solusi */}
                  {bukaSolusi[i] && (
                    <div
                      style={{
                        marginTop: 14,
                        background: '#f8fafc',
                        border: '1px solid #e2e8f0',
                        borderRadius: 12,
                        padding: '14px 16px',
                      }}
                    >
                      <div style={{ fontSize: 11, fontWeight: 800, color: '#16a34a', marginBottom: 8 }}>
                        ✅ KUNCI JAWABAN: {cs.kunci}
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        {cs.pembahasanLangkah.map((langkah, lIdx) => (
                          <div key={lIdx} style={{ fontSize: 12.5, color: '#334155', lineHeight: 1.55 }}>
                            <strong>Langkah {lIdx + 1}:</strong> <RenderMath text={langkah} />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* 🧠 CEK PEMAHAMAN: KUIS INTERAKTIF */}
      {bab.kuisPemahaman && bab.kuisPemahaman.length > 0 && (
        <div
          style={{
            background: '#ffffff',
            borderRadius: 20,
            border: '2px solid #ccfbf1',
            padding: '24px 22px',
            marginBottom: 28,
            boxShadow: '0 4px 15px rgba(13, 148, 136, 0.08)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6, flexWrap: 'wrap', gap: 10 }}>
            <h2 style={{ margin: 0, fontSize: 17, fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Zap size={18} style={{ color: '#0d9488' }} /> Cek Pemahaman Interaktif ({bab.kuisPemahaman.length} Butir)
            </h2>

            {hasilKuis && (
              <div
                style={{
                  background: (hasilKuis.skorBenar || 0) >= Math.ceil(bab.kuisPemahaman.length * 0.6) ? '#dcfce7' : '#fee2e2',
                  color: (hasilKuis.skorBenar || 0) >= Math.ceil(bab.kuisPemahaman.length * 0.6) ? '#15803d' : '#b91c1c',
                  padding: '6px 12px',
                  borderRadius: 12,
                  fontSize: 12,
                  fontWeight: 800,
                }}
              >
                Skor: {hasilKuis.skorBenar} / {hasilKuis.totalSoal} ({hasilKuis.nilai100 || hasilKuis.persen}%)
              </div>
            )}
          </div>

          <p style={{ margin: '0 0 20px', fontSize: 12.5, color: '#64748b' }}>
            Pilih satu jawaban terbaik untuk setiap butir soal, lalu klik <strong>Periksa Jawaban</strong> untuk melihat skor dan pembahasan analitis.
          </p>

          {/* List Pertanyaan Kuis */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {bab.kuisPemahaman.map((q, qIdx) => {
              const selectedOption = jawabanUser[q.id];
              const opsiList = Array.isArray(q.opsi)
                ? q.opsi
                : Object.entries(q.opsi || {}).map(([label, text]) => ({ label, text }));
              const soalTeks = q.soal || q.pertanyaan;

              return (
                <div
                  key={q.id}
                  style={{
                    background: '#f8fafc',
                    borderRadius: 14,
                    padding: '16px',
                    border: '1px solid #e2e8f0',
                  }}
                >
                  <div style={{ fontSize: 12, fontWeight: 800, color: '#0d9488', marginBottom: 6 }}>
                    Soal #{qIdx + 1}
                  </div>
                  <div style={{ fontSize: 13.5, color: '#0f172a', fontWeight: 600, lineHeight: 1.6, marginBottom: 14 }}>
                    <RenderMath text={soalTeks} />
                  </div>

                  {/* Diagram Visual Butir Kuis jika ada */}
                  {q.diagramSvg && (
                    <VisualDiagramBox svgContent={q.diagramSvg} judul={`Diagram Visual Soal #${qIdx + 1}`} />
                  )}

                  {/* Opsi Pilihan Ganda */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {opsiList.map((op) => {
                      const isSelected = selectedOption === op.label;
                      const isCorrect = q.kunci === op.label;

                      let btnBg = '#ffffff';
                      let btnBorder = '#cbd5e1';
                      let btnColor = '#334155';

                      if (sudahDiperiksa) {
                        if (isCorrect) {
                          btnBg = '#dcfce7';
                          btnBorder = '#22c55e';
                          btnColor = '#15803d';
                        } else if (isSelected && !isCorrect) {
                          btnBg = '#fee2e2';
                          btnBorder = '#ef4444';
                          btnColor = '#b91c1c';
                        }
                      } else if (isSelected) {
                        btnBg = '#f0fdfa';
                        btnBorder = '#0d9488';
                        btnColor = '#0f766e';
                      }

                      return (
                        <button
                          key={op.label}
                          onClick={() => pilihOpsiKuis(q.id, op.label)}
                          disabled={sudahDiperiksa}
                          style={{
                            textAlign: 'left',
                            padding: '10px 14px',
                            borderRadius: 10,
                            border: `1.5px solid ${btnBorder}`,
                            background: btnBg,
                            color: btnColor,
                            fontSize: 12.5,
                            fontWeight: isSelected || (sudahDiperiksa && isCorrect) ? 700 : 500,
                            cursor: sudahDiperiksa ? 'default' : 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 10,
                            transition: 'all 0.15s',
                          }}
                        >
                          <span
                            style={{
                              width: 22,
                              height: 22,
                              borderRadius: '50%',
                              background: isSelected ? '#0d9488' : '#f1f5f9',
                              color: isSelected ? '#fff' : '#64748b',
                              fontSize: 11,
                              fontWeight: 800,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              flexShrink: 0,
                            }}
                          >
                            {op.label}
                          </span>
                          <span><RenderMath text={op.text} /></span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Pembahasan Soal jika sudah diperiksa */}
                  {sudahDiperiksa && (
                    <div
                      style={{
                        marginTop: 12,
                        background: '#ffffff',
                        borderLeft: '4px solid #0d9488',
                        borderRadius: 8,
                        padding: '10px 14px',
                        fontSize: 12,
                        color: '#334155',
                        lineHeight: 1.5,
                      }}
                    >
                      <strong style={{ color: '#0d9488' }}>Kunci ({q.kunci}):</strong> <RenderMath text={q.pembahasan} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Action Bar Kuis */}
          <div style={{ marginTop: 20, display: 'flex', gap: 10, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
            {!sudahDiperiksa ? (
              <button
                onClick={periksaKuis}
                disabled={Object.keys(jawabanUser).length === 0}
                style={{
                  background: Object.keys(jawabanUser).length > 0 ? '#0d9488' : '#94a3b8',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: 12,
                  padding: '11px 22px',
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: Object.keys(jawabanUser).length > 0 ? 'pointer' : 'not-allowed',
                  boxShadow: '0 2px 6px rgba(13, 148, 136, 0.2)',
                }}
              >
                Periksa Jawaban Sekarang
              </button>
            ) : (
              <button
                onClick={ulangiKuis}
                style={{
                  background: '#f1f5f9',
                  color: '#475569',
                  border: '1px solid #cbd5e1',
                  borderRadius: 12,
                  padding: '10px 18px',
                  fontSize: 12.5,
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                <RotateCcw size={14} /> Ulangi Kuis
              </button>
            )}
          </div>
        </div>
      )}

      {/* 📌 RINGKASAN INTI (KEY TAKEAWAYS) */}
      {bab.keyTakeaways && bab.keyTakeaways.length > 0 && (
        <div
          style={{
            background: '#ffffff',
            borderRadius: 16,
            border: '1px solid #e2e8f0',
            padding: '18px 20px',
            marginBottom: 28,
          }}
        >
          <div style={{ fontSize: 14, fontWeight: 800, color: '#0f172a', marginBottom: 10 }}>
            📌 Ringkasan Inti (Key Takeaways)
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {bab.keyTakeaways.map((kt, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 12.5, color: '#334155' }}>
                <span style={{ color: '#0d9488', fontWeight: 800 }}>•</span>
                <span><RenderMath text={kt} /></span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 🔄 NAVIGASI BAB TETANGGA (PREV / NEXT) */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 12,
          paddingTop: 16,
          borderTop: '1px solid #e2e8f0',
          marginBottom: 24,
        }}
      >
        {tetangga.prevBab ? (
          <button
            onClick={() => navigate(`/siswa/modul/${tetangga.prevBab.subtestKode}/${tetangga.prevBab.slug}`)}
            style={{
              background: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: 12,
              padding: '10px 16px',
              fontSize: 12,
              fontWeight: 700,
              color: '#334155',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <ArrowLeft size={14} /> Bab {tetangga.prevBab.babNumber}: {tetangga.prevBab.judul.slice(0, 24)}...
          </button>
        ) : (
          <div />
        )}

        {tetangga.nextBab && (
          <button
            onClick={() => navigate(`/siswa/modul/${tetangga.nextBab.subtestKode}/${tetangga.nextBab.slug}`)}
            style={{
              background: '#0d9488',
              border: 'none',
              borderRadius: 12,
              padding: '10px 18px',
              fontSize: 12,
              fontWeight: 700,
              color: '#ffffff',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              boxShadow: '0 2px 6px rgba(13, 148, 136, 0.25)',
            }}
          >
            Bab {tetangga.nextBab.babNumber}: {tetangga.nextBab.judul.slice(0, 24)}... <ArrowRight size={14} />
          </button>
        )}
      </div>

      {/* 🚀 QUICK BRIDGE CTA KE ROADMAP LATIHAN */}
      <div
        style={{
          background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
          borderRadius: 16,
          padding: '20px 22px',
          color: '#ffffff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 16,
          flexWrap: 'wrap',
        }}
      >
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#2dd4bf', textTransform: 'uppercase', marginBottom: 2 }}>
            Siap Menguji Pemahamanmu?
          </div>
          <div style={{ fontSize: 15, fontWeight: 800 }}>
            {isSmp
              ? `Lanjut Latihan Soal ${subtest.nama} di Roadmap TKA SMP`
              : `Lanjut Latihan Soal Subtes ${subtest.nama} di Roadmap`}
          </div>
          <div style={{ fontSize: 12, opacity: 0.85, marginTop: 2 }}>
            Terapkan trik cepat yang baru kamu pelajari ke latihan bertarget waktu.
          </div>
        </div>

        <button
          onClick={() => navigate('/siswa/roadmap')}
          style={{
            background: 'linear-gradient(135deg, #0d9488, #14b8a6)',
            color: '#ffffff',
            border: 'none',
            borderRadius: 12,
            padding: '10px 20px',
            fontSize: 13,
            fontWeight: 800,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            flexShrink: 0,
            boxShadow: '0 4px 12px rgba(20, 184, 166, 0.3)',
          }}
        >
          <Flame size={16} /> Buka Roadmap Latihan
        </button>
      </div>

      {/* 🔍 LIGHTBOX MODAL UNTUK PERBESAR GAMBAR & SLIDE RESMI */}
      {modalImage && (
        <div
          onClick={() => setModalImage(null)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(15, 23, 42, 0.92)',
            zIndex: 99999,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
            backdropFilter: 'blur(4px)',
            cursor: 'zoom-out',
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              position: 'relative',
              maxWidth: '96vw',
              maxHeight: '94vh',
              display: 'flex',
              flexDirection: 'column',
              background: '#0f172a',
              borderRadius: 16,
              overflow: 'hidden',
              boxShadow: '0 20px 48px rgba(0,0,0,0.6)',
              border: '1px solid #334155',
            }}
          >
            {/* Modal Header */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 18px',
                background: '#1e293b',
                borderBottom: '1px solid #334155',
                color: '#f8fafc',
                gap: 12,
              }}
            >
              <span
                style={{
                  fontSize: 13,
                  fontWeight: 700,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  maxWidth: '75%',
                }}
              >
                {modalImage.title || 'Pratinjau Visual HD'}
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <a
                  href={modalImage.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    color: '#38bdf8',
                    textDecoration: 'none',
                    fontSize: 12,
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                  }}
                >
                  <ExternalLink size={14} /> Tab Baru
                </a>
                <button
                  type="button"
                  onClick={() => setModalImage(null)}
                  style={{
                    background: '#334155',
                    color: '#f8fafc',
                    border: 'none',
                    borderRadius: 8,
                    width: 28,
                    height: 28,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                  }}
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div
              style={{
                flex: 1,
                overflow: 'auto',
                padding: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: '#020617',
              }}
            >
              <img
                src={modalImage.url}
                alt={modalImage.title || 'Visual'}
                style={{
                  maxWidth: '100%',
                  maxHeight: '80vh',
                  objectFit: 'contain',
                  borderRadius: 8,
                }}
              />
            </div>
            <div style={{ padding: '8px 16px', background: '#1e293b', color: '#94a3b8', fontSize: 11, textAlign: 'center' }}>
              Klik tombol silang atau area luar untuk menutup
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
