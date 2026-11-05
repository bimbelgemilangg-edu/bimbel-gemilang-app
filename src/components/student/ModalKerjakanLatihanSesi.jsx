// src/components/student/ModalKerjakanLatihanSesi.jsx
// ============================================================
// Modal Pengerjaan Latihan Pemahaman Sesi Tatap Muka di Siswa
// Fitur Anti-Cheating:
//   1. Blind Submission: TIDAK membocorkan kunci jawaban/tanda benar-salah
//      secara instan agar teman sebangku tidak bisa menyalin jawaban.
//   2. Pengacakan Nomor & Opsi: Urutan butir soal dan opsi A/B/C/D/E
//      diacak unik per studentId.
//   3. Render Matematika & Gambar: Menampilkan KaTeX presisi
//      dan gambar soal secara utuh di tempatnya.
// ============================================================

import React, { useState, useMemo } from 'react';
import {
  X,
  CheckCircle2,
  ArrowLeft,
  ArrowRight,
  Send,
  Award,
} from 'lucide-react';
import { db } from '../../firebase';
import { doc, updateDoc, increment } from 'firebase/firestore';
import RenderMath from '../RenderMath';
import TeksSoalBergambar from '../TeksSoalBergambar';
import { normalisasiButirSoal } from '../../utils/normalisasiSoalLatihan';

/**
 * Hash string sederhana untuk seeding pseudo-random deterministic
 */
function hashString(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

/**
 * Fisher-Yates shuffle dengan seed tertentu
 */
function shuffleWithSeed(array, seed) {
  const arr = [...array];
  let m = arr.length;
  let s = seed;
  while (m) {
    s = (s * 9301 + 49297) % 233280;
    const rnd = s / 233280;
    const i = Math.floor(rnd * m--);
    const t = arr[m];
    arr[m] = arr[i];
    arr[i] = t;
  }
  return arr;
}

export default function ModalKerjakanLatihanSesi({
  schedule,
  studentId,
  studentName,
  studentDocId,
  isSusulan = false,
  isKelasMandiri = false,
  onClose,
  onSuccess,
}) {
  const latihan = schedule?.latihanSesi;
  const cleanStudentId = String(studentId || 'siswa-anon').replace(/[^a-zA-Z0-9_-]/g, '_');

  // Siapkan daftar soal teracak deterministik berdasarkan studentId
  const soalListAcak = useMemo(() => {
    const raw = Array.isArray(latihan?.soalList) ? latihan.soalList : [];
    const normalizedList = raw.map((q, idx) => normalisasiButirSoal(q, idx));

    if (!latihan?.acakSoal || !studentId) return normalizedList;

    const seedUtama = hashString(cleanStudentId + (schedule?.id || 'sch'));
    const shuffledQuestions = shuffleWithSeed(normalizedList, seedUtama);

    // Acak pula urutan opsi jawaban per soal
    return shuffledQuestions.map((q, idx) => {
      const qSeed = hashString(cleanStudentId + (q.id || idx));
      const opsiAsli = Array.isArray(q.opsiJawaban) ? q.opsiJawaban : [];
      const shuffledOpsi = shuffleWithSeed(opsiAsli, qSeed);
      return {
        ...q,
        nomorTampil: idx + 1,
        opsiTampil: shuffledOpsi,
      };
    });
  }, [latihan, cleanStudentId, schedule]);

  const [nomorAktif, setNomorAktif] = useState(0);
  const [jawabanUser, setJawabanUser] = useState({}); // { [soalId]: labelOpsi }
  const [submitting, setSubmitting] = useState(false);
  const [selesaiTerkirim, setSelesaiTerkirim] = useState(false);

  const soalSekarang = soalListAcak[nomorAktif] || null;
  const totalSoal = soalListAcak.length;
  const jumlahTerjawab = Object.keys(jawabanUser).length;

  const handlePilihOpsi = (label) => {
    if (!soalSekarang) return;
    setJawabanUser((prev) => ({
      ...prev,
      [soalSekarang.id || nomorAktif]: label,
    }));
  };

  const handleKirimJawaban = async () => {
    if (jumlahTerjawab < totalSoal) {
      const sisa = totalSoal - jumlahTerjawab;
      const ok = window.confirm(
        `Masih ada ${sisa} nomor yang belum Anda jawab.\n\nApakah Anda yakin ingin menyelesaikan dan mengirim jawaban sekarang?`
      );
      if (!ok) return;
    } else {
      const ok = window.confirm('Yakin ingin mengirim seluruh jawaban latihan pemahaman hari ini?');
      if (!ok) return;
    }

    setSubmitting(true);
    try {
      // 1. Hitung performa di background
      let benar = 0;
      soalListAcak.forEach((soal, idx) => {
        const idSoal = soal.id || idx;
        const pilihan = jawabanUser[idSoal];
        if (pilihan && String(pilihan).toUpperCase() === String(soal.kunciJawaban || 'A').toUpperCase()) {
          benar++;
        }
      });

      const skor = totalSoal > 0 ? Math.round((benar / totalSoal) * 100) : 100;
      const waktuSelesai = new Date().toISOString();

      const recordHasil = {
        studentId: cleanStudentId,
        studentName: studentName || 'Siswa',
        skor,
        benar,
        total: totalSoal,
        selesaiPada: waktuSelesai,
        jawaban: jawabanUser,
      };

      // 2. Simpan ke Firestore jadwal_bimbel
      const updateObj = {};
      updateObj[`latihanSesi.hasil.${cleanStudentId}`] = recordHasil;
      await updateDoc(doc(db, 'jadwal_bimbel', schedule.id), updateObj);

      // 3. Tambahkan bonus XP belajar ke profile siswa jika ada dokumen
      try {
        if (studentDocId) {
          await updateDoc(doc(db, 'students', studentDocId), {
            xp: increment(30),
            totalLatihanSesi: increment(1),
          });
        }
      } catch (errXp) {
        void errXp;
      }

      setSelesaiTerkirim(true);
      if (onSuccess) onSuccess(recordHasil);
    } catch (err) {
      console.error('Gagal mengirim jawaban latihan sesi:', err);
      alert('Gagal mengirim jawaban: ' + (err.message || 'Koneksi bermasalah'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(15, 23, 42, 0.75)',
        backdropFilter: 'blur(5px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
      }}
    >
      <div
        style={{
          background: '#ffffff',
          borderRadius: 20,
          width: '100%',
          maxWidth: 680,
          maxHeight: '92vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.3)',
          overflow: 'hidden',
        }}
      >
        {/* Header Modal */}
        <div
          style={{
            padding: '14px 20px',
            borderBottom: '1px solid #e2e8f0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span
                style={{
                  background: '#16a34a',
                  color: '#ffffff',
                  fontSize: 10,
                  fontWeight: 800,
                  padding: '2px 7px',
                  borderRadius: 6,
                  textTransform: 'uppercase',
                }}
              >
                Latihan Pemahaman Formatif
              </span>
              <h3 style={{ margin: 0, fontSize: 14.5, fontWeight: 800, color: '#0f172a' }}>
                {latihan?.judul || 'Latihan Sesi Kelas'}
              </h3>
            </div>
            <p style={{ margin: '3px 0 0 0', fontSize: 11, color: '#64748b' }}>
              {schedule?.title || 'MTK'} · Bab: <b>{latihan?.babJudul || 'Kurikulum Merdeka'}</b>
            </p>
          </div>
          {!selesaiTerkirim && (
            <button
              type="button"
              onClick={() => {
                if (jumlahTerjawab > 0 && !window.confirm('Keluar dari latihan? Jawaban yang belum dikirim akan hilang.')) {
                  return;
                }
                onClose();
              }}
              style={{
                background: '#f1f5f9',
                border: 'none',
                borderRadius: '50%',
                width: 32,
                height: 32,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                color: '#64748b',
              }}
            >
              <X size={16} />
            </button>
          )}
        </div>

        {/* BODY 1: LAYAR SUKSES BLIND SUBMISSION */}
        {selesaiTerkirim ? (
          <div
            style={{
              padding: '36px 24px',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <div
              style={{
                width: 72,
                height: 72,
                borderRadius: '50%',
                background: '#dcfce7',
                color: '#16a34a',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 16,
              }}
            >
              <CheckCircle2 size={44} />
            </div>

            <h3 style={{ fontSize: 20, fontWeight: 800, color: '#0f172a', margin: '0 0 8px 0' }}>
              {isSusulan
                ? '🌟 Latihan Mandiri Berhasil Dikirim!'
                : isKelasMandiri
                ? '🌟 Sesi Belajar Mandiri Selesai!'
                : '🎉 Jawaban Berhasil Dikirim!'}
            </h3>

            <p style={{ fontSize: 13.5, color: '#334155', maxWidth: 460, margin: '0 0 16px 0', lineHeight: 1.5 }}>
              {isSusulan
                ? 'Luar biasa! Semangat belajar mandiri Anda dari rumah patut diapresiasi. Pemahaman materi Anda berhasil terekam ke sistem Gemilang Edu.'
                : isKelasMandiri
                ? 'Hebat! Meskipun tentor berhalangan hadir, Anda tetap aktif belajar mandiri dan rekam jejak pemahaman Anda berhasil terekam ke sistem Gemilang Edu.'
                : 'Terima kasih! Pemahaman materi Anda pada sesi tatap muka hari ini sudah berhasil terekam ke sistem Gemilang Edu.'}
            </p>

            <div
              style={{
                background: 'linear-gradient(135deg, #fef3c7 0%, #fef9c3 100%)',
                border: '1px solid #fde047',
                borderRadius: 14,
                padding: '12px 20px',
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                marginBottom: 20,
              }}
            >
              <Award size={28} color="#b45309" />
              <div style={{ textAlign: 'left' }}>
                <div style={{ fontSize: 13, fontWeight: 800, color: '#78350f' }}>
                  {isSusulan
                    ? '+30 Recovery XP Ditambahkan!'
                    : isKelasMandiri
                    ? '+30 XP Belajar Mandiri Ditambahkan!'
                    : '+30 XP Belajar Ditambahkan!'}
                </div>
                <div style={{ fontSize: 11, color: '#92400e' }}>
                  {isSusulan
                    ? 'Aktivitas belajar mandiri tercatat sebagai pemulihan materi di profil Anda.'
                    : isKelasMandiri
                    ? 'Aktivitas sesi belajar mandiri kelas aktif dan tercatat pada profil Anda.'
                    : 'Aktivitas sesi kelas aktif dan tercatat pada profil Anda.'}
                </div>
              </div>
            </div>

            <div
              style={{
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: 12,
                padding: 12,
                fontSize: 11.5,
                color: '#64748b',
                maxWidth: 480,
                marginBottom: 24,
                lineHeight: 1.5,
              }}
            >
              🔒 <b>Catatan Formatif:</b> Kunci jawaban tidak ditampilkan di layar kelas agar Anda dan teman-teman dapat mendiskusikan konsep materi secara murni bersama Tentor.
            </div>

            <button
              type="button"
              onClick={onClose}
              style={{
                background: '#4f46e5',
                color: '#ffffff',
                border: 'none',
                borderRadius: 10,
                padding: '10px 24px',
                fontSize: 13,
                fontWeight: 800,
                cursor: 'pointer',
                boxShadow: '0 4px 6px -1px rgba(79, 70, 229, 0.25)',
              }}
            >
              Kembali ke Beranda Belajar
            </button>
          </div>
        ) : (
          /* BODY 2: PLAYER SOAL INTERAKTIF (DENGAN RENDERMATH & GAMBAR UTUH) */
          <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
            {/* Progress Bar Soal */}
            <div style={{ background: '#f8fafc', padding: '10px 18px', borderBottom: '1px solid #e2e8f0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <span style={{ fontSize: 11.5, fontWeight: 700, color: '#334155' }}>
                  Soal {nomorAktif + 1} dari {totalSoal}
                </span>
                <span style={{ fontSize: 11, color: '#64748b' }}>
                  Terjawab: <b>{jumlahTerjawab}</b> / {totalSoal}
                </span>
              </div>
              <div style={{ width: '100%', height: 6, background: '#e2e8f0', borderRadius: 3, overflow: 'hidden' }}>
                <div
                  style={{
                    height: '100%',
                    background: '#16a34a',
                    width: `${totalSoal > 0 ? (jumlahTerjawab / totalSoal) * 100 : 0}%`,
                    transition: 'width 0.2s',
                  }}
                />
              </div>

              {/* Navigasi nomor kecil */}
              <div style={{ display: 'flex', gap: 6, marginTop: 8, overflowX: 'auto', paddingBottom: 2 }}>
                {soalListAcak.map((s, idx) => {
                  const idS = s.id || idx;
                  const isAnswered = Boolean(jawabanUser[idS]);
                  const isActive = idx === nomorAktif;
                  return (
                    <button
                      key={idS}
                      type="button"
                      onClick={() => setNomorAktif(idx)}
                      style={{
                        minWidth: 28,
                        height: 28,
                        borderRadius: 6,
                        border: isActive ? '2px solid #4f46e5' : '1px solid #cbd5e1',
                        background: isActive ? '#eef2ff' : isAnswered ? '#dcfce7' : '#ffffff',
                        color: isActive ? '#4338ca' : isAnswered ? '#15803d' : '#64748b',
                        fontSize: 11,
                        fontWeight: 700,
                        cursor: 'pointer',
                      }}
                    >
                      {idx + 1}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Isi Butir Soal */}
            <div style={{ padding: 20, overflowY: 'auto', flex: 1 }}>
              {soalSekarang ? (
                <div>
                  {/* Teks Soal & Gambar melalui TeksSoalBergambar */}
                  <div style={{ marginBottom: 18 }}>
                    <TeksSoalBergambar
                      teks={soalSekarang.teksSoal}
                      gambarUrls={soalSekarang.gambarUrls || []}
                      gayaTeks={{ fontSize: 14.5, lineHeight: 1.65, color: '#0f172a' }}
                      gayaGambar={{ maxHeight: 260, margin: '12px auto', borderRadius: 8, border: '1px solid #e2e8f0', display: 'block' }}
                    />
                  </div>

                  {/* Pilihan Ganda Opsi dengan RenderMath */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {(soalSekarang.opsiTampil || soalSekarang.opsiJawaban || []).map((op, oIdx) => {
                      const label = typeof op === 'object' ? op.label : ['A', 'B', 'C', 'D', 'E'][oIdx];
                      const teks = typeof op === 'object' ? op.teks : String(op);
                      const isSelected = jawabanUser[soalSekarang.id || nomorAktif] === label;

                      return (
                        <div
                          key={oIdx}
                          onClick={() => handlePilihOpsi(label)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 12,
                            padding: '12px 14px',
                            borderRadius: 12,
                            background: isSelected ? '#f0fdf4' : '#ffffff',
                            border: isSelected ? '2px solid #16a34a' : '1px solid #e2e8f0',
                            cursor: 'pointer',
                            transition: '0.15s',
                          }}
                        >
                          <div
                            style={{
                              width: 30,
                              height: 30,
                              borderRadius: '50%',
                              background: isSelected ? '#16a34a' : '#f1f5f9',
                              color: isSelected ? '#ffffff' : '#475569',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: 12.5,
                              fontWeight: 800,
                              flexShrink: 0,
                            }}
                          >
                            {label}
                          </div>
                          <div style={{ fontSize: 13.5, color: isSelected ? '#15803d' : '#1e293b', fontWeight: isSelected ? 600 : 400, flex: 1, minWidth: 0 }}>
                            <RenderMath text={teks} />
                            {Array.isArray(op.gambar) && op.gambar.length > 0 && (
                              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 6 }}>
                                {op.gambar.map((g, gi) => (
                                  <img
                                    key={gi}
                                    src={typeof g === 'string' ? g : g?.url}
                                    alt={`Gambar opsi ${label}`}
                                    style={{ maxHeight: 100, borderRadius: 6, border: '1px solid #cbd5e1' }}
                                  />
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div style={{ padding: 24, textAlign: 'center', color: '#94a3b8' }}>
                  Tidak ada soal yang tersedia.
                </div>
              )}
            </div>

            {/* Footer Navigasi Soal */}
            <div
              style={{
                padding: '12px 18px',
                borderTop: '1px solid #e2e8f0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                background: '#ffffff',
              }}
            >
              <button
                type="button"
                onClick={() => setNomorAktif((prev) => Math.max(0, prev - 1))}
                disabled={nomorAktif === 0}
                style={{
                  background: '#f1f5f9',
                  color: nomorAktif === 0 ? '#cbd5e1' : '#475569',
                  border: 'none',
                  borderRadius: 8,
                  padding: '8px 14px',
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: nomorAktif === 0 ? 'not-allowed' : 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                }}
              >
                <ArrowLeft size={14} /> Sebelumnya
              </button>

              {nomorAktif < totalSoal - 1 ? (
                <button
                  type="button"
                  onClick={() => setNomorAktif((prev) => Math.min(totalSoal - 1, prev + 1))}
                  style={{
                    background: '#4f46e5',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: 8,
                    padding: '8px 16px',
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 4,
                  }}
                >
                  Selanjutnya <ArrowRight size={14} />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleKirimJawaban}
                  disabled={submitting}
                  style={{
                    background: '#16a34a',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: 8,
                    padding: '8px 18px',
                    fontSize: 12.5,
                    fontWeight: 800,
                    cursor: submitting ? 'wait' : 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    boxShadow: '0 2px 4px rgba(22, 163, 74, 0.2)',
                  }}
                >
                  <Send size={14} /> {submitting ? 'Mengirim...' : 'Selesai & Kirim'}
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
