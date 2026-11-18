// src/pages/student/modul/ModulReaderUtbkPage.jsx
// ==============================================================================
// PEMBACA MODUL INTERAKTIF UTBK-SNBT 2027 (AmbisPTN Standard 1:1)
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

export default function ModulReaderUtbkPage() {
  const { subtestKode, babSlug } = useParams();
  const navigate = useNavigate();

  const [studentId, setStudentId] = useState('');
  const [bukaSolusi, setBukaSolusi] = useState({});
  const [jawabanUser, setJawabanUser] = useState({});
  const [sudahDiperiksa, setSudahDiperiksa] = useState(false);
  const [hasilKuis, setHasilKuis] = useState(null);
  const [isSelesai, setIsSelesai] = useState(false);

  // Ambil data bab dan subtes
  const subtest = useMemo(() => getSubtestByKode(subtestKode), [subtestKode]);
  const bab = useMemo(() => getBabBySlug(subtestKode, babSlug), [subtestKode, babSlug]);
  const tetangga = useMemo(() => getBabTetangga(subtestKode, babSlug), [subtestKode, babSlug]);

  useEffect(() => {
    const sid =
      localStorage.getItem('studentId') ||
      localStorage.getItem('studentNim') ||
      localStorage.getItem('studentDocId') ||
      'siswa_gemilang_default';
    setStudentId(sid);

    if (bab) {
      // Simpan riwayat terakhir dibaca
      simpanTerakhirDibaca(sid, {
        subtestKode: bab.subtestKode,
        babSlug: bab.slug,
        judul: bab.judul,
      });

      // Cek apakah sudah selesai sebelumnya
      const selesaiList = getDaftarBabSelesai(sid);
      setIsSelesai(selesaiList.includes(bab.id));

      // Cek apakah sudah pernah mengerjakan kuis bab ini
      const savedKuis = getSkorKuisBab(sid, bab.id);
      if (savedKuis) {
        setHasilKuis(savedKuis);
      } else {
        setHasilKuis(null);
      }

      // Reset state kuis untuk bab baru
      setJawabanUser({});
      setSudahDiperiksa(false);
      setBukaSolusi({});
      window.scrollTo(0, 0);
    }
  }, [subtestKode, babSlug, bab]);

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
          Kembali ke Modul Belajar
        </button>
      </div>
    );
  }

  // Handler toggle solusi contoh soal
  const toggleSolusi = (idx) => {
    setBukaSolusi((prev) => ({ ...prev, [idx]: !prev[idx] }));
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

    const res = simpanSkorKuisBab(studentId, bab.id, benar, total);
    setHasilKuis(res);
    setSudahDiperiksa(true);
    if (benar >= 3) {
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
    tandaiBabSelesai(studentId, bab.id);
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
          <ArrowLeft size={14} /> Daftar Modul
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
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
            {subtest.emoji} {subtest.kode} • Bab {bab.babNumber}
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
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#64748b', fontSize: 11.5, marginBottom: 8 }}>
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

        <p style={{ margin: 0, fontSize: 13.5, color: '#475569', lineHeight: 1.6 }}>
          {bab.ringkasanSingkat}
        </p>
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
                <span>{obj}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 📖 KONSEP & TEORI INTI */}
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
              <p style={{ margin: '0 0 12px', fontSize: 13, color: '#334155', lineHeight: 1.65, whiteSpace: 'pre-line' }}>
                {kt.isi}
              </p>

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
                    Kaidah Penting UTBK:
                  </div>
                  {kt.poinPenting.map((pt, pIdx) => (
                    <div key={pIdx} style={{ fontSize: 12, color: '#475569', lineHeight: 1.5, marginBottom: 4 }}>
                      • {pt}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
      </div>

      {/* ⚡ TRIK CEPAT UTBK */}
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
            Trik Cepat UTBK (30 Detik)
          </div>
          <p style={{ margin: 0, fontSize: 13, color: '#78350f', lineHeight: 1.6, fontWeight: 500 }}>
            {bab.trikCepat}
          </p>
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
          <p style={{ margin: 0, fontSize: 13, color: '#881337', lineHeight: 1.6, fontWeight: 500 }}>
            {bab.jebakanUmum}
          </p>
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
              <div style={{ fontSize: 13.5, color: '#0f172a', lineHeight: 1.6, fontWeight: 600, marginBottom: 14, whiteSpace: 'pre-line' }}>
                {cs.soal}
              </div>

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
                      <strong style={{ color: '#0f172a' }}>{label}.</strong> {text}
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
                        <strong>Langkah {lIdx + 1}:</strong> {langkah}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* 🧠 CEK PEMAHAMAN: KUIS 5 BUTIR INTERAKTIF */}
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
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 800, color: '#0d9488', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Latihan Mandiri
              </div>
              <h2 style={{ margin: '2px 0 0', fontSize: 18, fontWeight: 800, color: '#0f172a' }}>
                🧠 Cek Pemahaman: 5 Soal Interaktif
              </h2>
            </div>

            {hasilKuis && (
              <div
                style={{
                  background: hasilKuis.skorBenar >= 3 ? '#dcfce7' : '#fee2e2',
                  color: hasilKuis.skorBenar >= 3 ? '#15803d' : '#b91c1c',
                  padding: '6px 12px',
                  borderRadius: 12,
                  fontSize: 12,
                  fontWeight: 800,
                }}
              >
                Skor: {hasilKuis.skorBenar} / {hasilKuis.totalSoal} ({hasilKuis.persen}%)
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
                    {q.soal}
                  </div>

                  {/* Opsi Pilihan Ganda A - E */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {q.opsi.map((op) => {
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
                          <span>{op.text}</span>
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
                      <strong style={{ color: '#0d9488' }}>Kunci ({q.kunci}):</strong> {q.pembahasan}
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
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {bab.keyTakeaways.map((takeaway, i) => (
              <div key={i} style={{ fontSize: 12.5, color: '#475569', lineHeight: 1.5 }}>
                • {takeaway}
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
            Lanjut Latihan Soal Subtes {subtest.nama} di Roadmap
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
    </div>
  );
}
