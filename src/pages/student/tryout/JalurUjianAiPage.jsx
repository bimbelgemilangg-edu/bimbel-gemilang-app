// src/pages/student/tryout/JalurUjianAiPage.jsx
// ============================================================
// 🚀 JALUR UJIAN AI — EKSPEDISI KOSMIK BIMBEL GEMILANG
//
// Karakteristik Utama:
// 1. Khusus siswa jenjang akhir (Kelas 6 SD, 9 SMP, 12 SMA/SMK/UTBK).
// 2. Format Peta Petualangan Berliku (Winding Game Path) ala Duolingo.
// 3. Nuansa Cerah, Fun, Antariksa Kosmik (Astronot, Planet, Orbit, Roket).
// 4. Progresi Bertahap Tanpa Deadline: Kuis selalu terbuka bertahap
//    (Start -> Unit 1 -> Unit 2 -> Unit 3 -> Review AI).
// 5. Ujian Serius & Pengawasan Online (Anti-Cheat, Timer Resmi).
// 6. Bank Soal Terjaga: Paket otomatis disiapkan sebelum mulai.
// ============================================================

import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../../../firebase';
import { collection, getDocs, query, where } from 'firebase/firestore';
import {
  Rocket, Lock, CheckCircle2, Star, Sparkles, Brain, Trophy,
  ChevronLeft, AlertCircle, Play, ShieldAlert, Timer, Award,
  Flame, BarChart3, HelpCircle, X, Compass, ExternalLink,
} from 'lucide-react';
import { useProfilSiswa } from '../../../utils/profilSiswa';
import {
  deteksiJenjangUjianAkhir,
  getDaftarUnitJalurUjian,
  hitungProgresiJalur,
  pastikanPaketUnitTersedia,
} from '../../../utils/jalurUjianAiConfig';
import MaskotAstronot from '../../../components/MaskotAstronot';

export default function JalurUjianAiPage() {
  const navigate = useNavigate();
  const profil = useProfilSiswa();
  const studentId = typeof localStorage !== 'undefined'
    ? localStorage.getItem('studentId') || localStorage.getItem('studentNim') || ''
    : '';

  // Deteksi jenjang ujian akhir siswa
  const targetJenjang = useMemo(() => deteksiJenjangUjianAkhir(profil), [profil]);

  const [loading, setLoading] = useState(true);
  const [sesiList, setSesiList] = useState([]);
  const [unitTerpilih, setUnitTerpilih] = useState(null);
  const [modalReviewTerbuka, setModalReviewTerbuka] = useState(false);
  const [sedangMenyiapkan, setSedangMenyiapkan] = useState(false);
  const [pesanError, setPesanError] = useState('');

  // Ambil daftar unit berdasarkan jenjang siswa
  const daftarUnit = useMemo(() => {
    return getDaftarUnitJalurUjian(targetJenjang?.jenjang || 'SMP');
  }, [targetJenjang]);

  // Muat histori sesi pengerjaan try out siswa
  useEffect(() => {
    let aktif = true;
    async function muatSesi() {
      if (!studentId) {
        setLoading(false);
        return;
      }
      try {
        const snap = await getDocs(
          query(collection(db, 'tryout_sesi'), where('studentId', '==', studentId))
        );
        if (aktif) {
          const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
          setSesiList(list);
        }
      } catch (err) {
        console.error('Gagal memuat histori sesi try out:', err);
      } finally {
        if (aktif) setLoading(false);
      }
    }
    muatSesi();
    return () => {
      aktif = false;
    };
  }, [studentId]);

  // Hitung status progresi (completed, current, locked)
  const { unitList, totalUnit, selesaiCount, persentaseSelesai } = useMemo(() => {
    return hitungProgresiJalur(daftarUnit, sesiList);
  }, [daftarUnit, sesiList]);

  // Handler klik unit di peta
  const handleKlikUnit = (unit) => {
    if (unit.tipe === 'review') {
      setModalReviewTerbuka(true);
      return;
    }
    setUnitTerpilih(unit);
  };

  // Handler mulai pengerjaan ujian
  const handleMulaiUjian = async (unit) => {
    if (!unit || unit.status === 'locked' || sedangMenyiapkan) return;
    setSedangMenyiapkan(true);
    setPesanError('');
    try {
      // Pastikan paket tersedia di Firestore dan bank soal tidak kosong
      await pastikanPaketUnitTersedia(db, unit, targetJenjang?.jenjang || 'SMP');
      // Arahkan ke ruang pengerjaan try out resmi
      navigate(`/siswa/tryout/${unit.id}?jalur=ai&unitNomor=${unit.unitNomor}`);
    } catch (err) {
      console.error('Gagal menyiapkan ujian:', err);
      setPesanError('Gagal menyiapkan paket simulasi. Silakan periksa koneksi dan coba lagi.');
      setSedangMenyiapkan(false);
    }
  };

  // JIKA SISWA BUKAN KELAS AKHIR: TAMPILKAN PEMBERITAHUAN RAMAH
  if (!targetJenjang) {
    return (
      <div style={st.bukanAkhirWrapper}>
        <div style={st.kartuBukanAkhir}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
            <MaskotAstronot size={110} />
          </div>
          <h2 style={{ fontSize: 22, fontWeight: 800, color: '#0f766e', margin: '0 0 10px' }}>
            Jalur Misi Khusus Ujian Akhir
          </h2>
          <p style={{ color: '#475569', fontSize: 14, lineHeight: 1.6, margin: '0 0 20px' }}>
            Halo <strong>{profil.nama || 'Siswa'}</strong>! Fitur <strong>Jalur Ujian AI</strong> ini dirancang khusus bagi sahabat kelas <strong>6 SD (TKA SD)</strong>, <strong>9 SMP (TKA SMP)</strong>, dan <strong>12 SMA/SMK (UTBK-SNBT)</strong> untuk simulasi kelulusan dan seleksi sekolah/kampus impian.
          </p>
          <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 12, padding: 14, marginBottom: 20, textAlign: 'left', fontSize: 13, color: '#166534' }}>
            ✨ Untuk kelasmu (<strong>{profil.kelas || 'Reguler'}</strong>), kamu tetap bisa menikmati <strong>Latihan Harian AI</strong> dan <strong>Materi Modul E-Learning</strong> untuk memperkuat nilai harian!
          </div>
          <button
            type="button"
            onClick={() => navigate('/siswa/dashboard')}
            style={st.tombolKembaliBeranda}
          >
            Kembali ke Beranda
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={st.container}>
      {/* Background dekorasi garis topografi kosmik */}
      <div style={st.bgTopologyOverlay} aria-hidden="true" />

      {/* HEADER ATAS: AVATAR, STATUS XP, & TOMBOL REVIEW AI */}
      <header style={st.headerBar}>
        {/* Kiri: Tombol Back & Badge Jenjang */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button
            type="button"
            onClick={() => navigate('/siswa/dashboard')}
            style={st.btnLingkaranPutih}
            title="Kembali ke Dashboard"
          >
            <ChevronLeft size={22} color="#0d9488" />
          </button>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={st.badgeJenjang}>{targetJenjang.labelBadge}</span>
              <span style={{ fontSize: 11, fontWeight: 700, color: '#115e59', background: '#ccfbf1', padding: '2px 8px', borderRadius: 99 }}>
                {selesaiCount}/{totalUnit} Selesai
              </span>
            </div>
            <h1 style={st.headerJudul}>{targetJenjang.subJudul}</h1>
          </div>
        </div>

        {/* Kanan: Avatar & Tombol Review AI */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button
            type="button"
            onClick={() => setModalReviewTerbuka(true)}
            style={st.btnReviewHeader}
            title="Buka Analisis Kemampuan Belajar AI"
          >
            <Brain size={16} color="#0d9488" />
            <span>Review AI</span>
          </button>
          <div style={st.avatarBulat} title={profil.nama}>
            {profil.nama ? profil.nama.charAt(0).toUpperCase() : 'S'}
          </div>
        </div>
      </header>

      {/* BAR PROGRES KELULUSAN */}
      <div style={st.barProgresBungkus}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
          <span style={{ fontSize: 12, fontWeight: 800, color: '#0f766e', display: 'flex', alignItems: 'center', gap: 4 }}>
            <Compass size={14} /> Ekspedisi Tanpa Deadline
          </span>
          <span style={{ fontSize: 12, fontWeight: 800, color: '#0d9488' }}>
            {persentaseSelesai}% Misi Tuntas
          </span>
        </div>
        <div style={st.progressBarTrack}>
          <div style={{ ...st.progressBarFill, width: `${persentaseSelesai}%` }} />
        </div>
      </div>

      {/* ============================================================ */}
      {/* 🗺️ PETA JALUR BERLIKU (WINDING GAME PATH) ALA DUOLINGO       */}
      {/* ============================================================ */}
      <main style={st.mapStageWrapper}>
        {/* SVG KURVA JALUR BERLIKU (DASHED WINDING PATH) */}
        <svg
          style={st.svgJalur}
          viewBox="0 0 360 820"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Jalur berliku menghubungkan Unit 1 (Start) di bawah ke Unit Review di atas */}
          <path
            d="M 180 730 C 120 680, 80 620, 95 550 C 110 470, 260 490, 265 410 C 270 330, 90 350, 95 270 C 100 190, 180 180, 180 110"
            stroke="#ffffff"
            strokeWidth="5"
            strokeDasharray="9 9"
            strokeLinecap="round"
            opacity="0.9"
          />
        </svg>

        {/* ORNAMEN PLANET KOSMIK DI SEKITAR JALUR */}
        <div style={{ ...st.ornamenKosmik, top: '18%', right: '12%', transform: 'scale(1.1)' }}>
          🪐
        </div>
        <div style={{ ...st.ornamenKosmik, top: '48%', left: '8%', transform: 'scale(0.9)' }}>
          ⭐
        </div>
        <div style={{ ...st.ornamenKosmik, top: '65%', right: '14%', transform: 'scale(1.0)' }}>
          ☄️
        </div>
        <div style={{ ...st.ornamenKosmik, top: '82%', left: '12%', transform: 'scale(0.8)' }}>
          ✨
        </div>

        {/* DAFTAR NODE TAHAPAN (DIURUTKAN DARI ATAS KE BAWAH SECARA POSISI) */}
        {/* Node 5: Review & Analisis AI (Paling Atas) */}
        <div style={{ ...st.nodeContainer, top: 70, left: '50%', transform: 'translateX(-50%)' }}>
          <button
            type="button"
            onClick={() => setModalReviewTerbuka(true)}
            style={st.tombolCapsuleReview}
          >
            <Brain size={18} color="#0d9488" />
            <span style={{ fontWeight: 800, fontSize: 13, color: '#0f766e' }}>Review AI</span>
          </button>
        </div>

        {/* Node 4: Unit 4 (Kiri Atas) */}
        {unitList[3] && (
          <div style={{ ...st.nodeContainer, top: 230, left: '26%', transform: 'translateX(-50%)' }}>
            <KomponenNodeUnit unit={unitList[3]} onKlik={handleKlikUnit} />
          </div>
        )}

        {/* Node 3: Unit 3 (Kanan Tengah) */}
        {unitList[2] && (
          <div style={{ ...st.nodeContainer, top: 370, left: '74%', transform: 'translateX(-50%)' }}>
            <KomponenNodeUnit unit={unitList[2]} onKlik={handleKlikUnit} />
          </div>
        )}

        {/* Node 2: Unit 2 (Kiri Tengah) */}
        {unitList[1] && (
          <div style={{ ...st.nodeContainer, top: 510, left: '26%', transform: 'translateX(-50%)' }}>
            <KomponenNodeUnit unit={unitList[1]} onKlik={handleKlikUnit} />
          </div>
        )}

        {/* Node 1: Unit 1 / START (Paling Bawah - Oranye Hangat Besar) */}
        {unitList[0] && (
          <div style={{ ...st.nodeContainer, top: 670, left: '50%', transform: 'translateX(-50%)' }}>
            <KomponenNodeStart unit={unitList[0]} onKlik={handleKlikUnit} />
          </div>
        )}

        {/* MASKOT ASTRO GEMILANG MENGINTIP CERIA DI POJOK KANAN BAWAH */}
        <div style={st.maskotMengintip} title="Hai! Aku Master G, pemandumu di Jalur Ujian AI!">
          <div style={{ position: 'relative' }}>
            <MaskotAstronot size={86} />
            <div style={st.balonBicaraMaskot}>
              Yuk taklukkan misi! 🚀
            </div>
          </div>
        </div>
      </main>

      {/* ============================================================ */}
      {/* MODAL BOTTOM SHEET DETAIL UNIT                               */}
      {/* ============================================================ */}
      {unitTerpilih && (
        <div style={st.overlayModal} onClick={() => setUnitTerpilih(null)}>
          <div style={st.sheetModal} onClick={(e) => e.stopPropagation()}>
            <div style={st.dragHandle} />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{
                  width: 48, height: 48, borderRadius: 16,
                  background: unitTerpilih.status === 'completed' ? '#d1fae5' : unitTerpilih.status === 'current' ? '#ffedd5' : '#e2e8f0',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {unitTerpilih.status === 'completed' ? (
                    <CheckCircle2 size={26} color="#059669" />
                  ) : unitTerpilih.status === 'current' ? (
                    <Rocket size={26} color="#ea580c" />
                  ) : (
                    <Lock size={26} color="#64748b" />
                  )}
                </div>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 800, color: '#0d9488', textTransform: 'uppercase' }}>
                    Tahap {unitTerpilih.unitNomor} • {targetJenjang.namaUjian}
                  </div>
                  <h3 style={{ fontSize: 17, fontWeight: 800, color: '#0f172a', margin: '2px 0 0' }}>
                    {unitTerpilih.judul}
                  </h3>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setUnitTerpilih(null)}
                style={st.btnCloseModal}
              >
                <X size={20} color="#64748b" />
              </button>
            </div>

            <p style={{ fontSize: 13, color: '#475569', lineHeight: 1.5, margin: '0 0 16px' }}>
              {unitTerpilih.deskripsi}
            </p>

            {/* INFO SPESIFIKASI MISI UJIAN */}
            <div style={st.gridSpesifikasi}>
              <div style={st.kotakSpek}>
                <Timer size={18} color="#0d9488" />
                <div>
                  <div style={{ fontSize: 11, color: '#64748b', fontWeight: 600 }}>Waktu Ujian</div>
                  <div style={{ fontSize: 13, fontWeight: 800, color: '#0f172a' }}>{unitTerpilih.durasiMenit} Menit</div>
                </div>
              </div>
              <div style={st.kotakSpek}>
                <Award size={18} color="#0d9488" />
                <div>
                  <div style={{ fontSize: 11, color: '#64748b', fontWeight: 600 }}>Jumlah Butir</div>
                  <div style={{ fontSize: 13, fontWeight: 800, color: '#0f172a' }}>{unitTerpilih.jumlahSoal} Soal</div>
                </div>
              </div>
              <div style={st.kotakSpek}>
                <ShieldAlert size={18} color="#f97316" />
                <div>
                  <div style={{ fontSize: 11, color: '#64748b', fontWeight: 600 }}>Pengawasan</div>
                  <div style={{ fontSize: 13, fontWeight: 800, color: '#0f172a' }}>Anti-Cheat Online</div>
                </div>
              </div>
              <div style={st.kotakSpek}>
                <Flame size={18} color="#eab308" />
                <div>
                  <div style={{ fontSize: 11, color: '#64748b', fontWeight: 600 }}>Bonus Hadiah</div>
                  <div style={{ fontSize: 13, fontWeight: 800, color: '#0f172a' }}>+{unitTerpilih.xpReward} XP</div>
                </div>
              </div>
            </div>

            {/* JIKA STATUS COMPLETED: TAMPILKAN SKOR HASIL */}
            {unitTerpilih.status === 'completed' && (
              <div style={st.kartuHasilSelesai}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <Star size={24} color="#f59e0b" fill="#f59e0b" />
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: '#92400e' }}>Misi Selesai Dikerjakan!</div>
                    <div style={{ fontSize: 18, fontWeight: 900, color: '#78350f' }}>
                      Skor Perolehan: {unitTerpilih.skor}%
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setUnitTerpilih(null);
                    setModalReviewTerbuka(true);
                  }}
                  style={st.btnLihatAnalisisKecil}
                >
                  Analisis AI
                </button>
              </div>
            )}

            {/* JIKA STATUS TERKUNCI */}
            {unitTerpilih.status === 'locked' && (
              <div style={st.kartuStatusLocked}>
                <Lock size={20} color="#b45309" />
                <span style={{ fontSize: 12.5, fontWeight: 700, color: '#92400e' }}>
                  Unit ini masih terkunci! Selesaikan Unit {unitTerpilih.unitNomor - 1} terlebih dahulu untuk membuka tantangan ini.
                </span>
              </div>
            )}

            {pesanError && (
              <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10, padding: 10, color: '#b91c1c', fontSize: 12, marginTop: 12 }}>
                {pesanError}
              </div>
            )}

            {/* TOMBOL AKSI UTAMA */}
            <div style={{ marginTop: 20 }}>
              {unitTerpilih.status === 'current' ? (
                <button
                  type="button"
                  disabled={sedangMenyiapkan}
                  onClick={() => handleMulaiUjian(unitTerpilih)}
                  style={st.btnLuncurkanUjian}
                >
                  <Rocket size={20} />
                  <span>{sedangMenyiapkan ? 'Menyiapkan Soal Bank...' : 'Luncurkan Simulasi Ujian 🚀'}</span>
                </button>
              ) : unitTerpilih.status === 'completed' ? (
                <button
                  type="button"
                  disabled={sedangMenyiapkan}
                  onClick={() => handleMulaiUjian(unitTerpilih)}
                  style={st.btnKerjakanUlang}
                >
                  <span>Kerjakan Latihan Lagi (Ulangi Misi)</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setUnitTerpilih(null)}
                  style={st.btnTutupModal}
                >
                  Tutup
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL REVIEW & ANALISIS KEMAMPUAN BELAJAR AI                 */}
      {/* ============================================================ */}
      {modalReviewTerbuka && (
        <div style={st.overlayModal} onClick={() => setModalReviewTerbuka(false)}>
          <div style={st.sheetReviewModal} onClick={(e) => e.stopPropagation()}>
            <div style={st.dragHandle} />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={st.iconReviewCircle}>
                  <Brain size={24} color="#0d9488" />
                </div>
                <div>
                  <h3 style={{ fontSize: 18, fontWeight: 800, color: '#0f172a', margin: 0 }}>
                    Analisis Kemampuan Belajar AI
                  </h3>
                  <div style={{ fontSize: 12, color: '#64748b', fontWeight: 600 }}>
                    Tracking Otomatis Berdasarkan Simulasi {targetJenjang.namaUjian}
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setModalReviewTerbuka(false)}
                style={st.btnCloseModal}
              >
                <X size={20} color="#64748b" />
              </button>
            </div>

            {/* RINGKASAN PERFORMA */}
            <div style={st.kartuRingkasanPerform}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#0d9488', textTransform: 'uppercase' }}>
                  Tingkat Kesiapan Ujian
                </div>
                <div style={{ fontSize: 26, fontWeight: 900, color: '#0f766e', margin: '4px 0' }}>
                  {selesaiCount === 0 ? 'Belum Dimulai' : selesaiCount >= 3 ? 'Sangat Siap 🎯' : 'Tahap Berkembang 🌱'}
                </div>
                <div style={{ fontSize: 12, color: '#475569' }}>
                  {selesaiCount} dari {totalUnit} Unit Ujian Diselesaikan
                </div>
              </div>
            </div>

            {/* DETAIL PER UNIT */}
            <div style={{ marginBottom: 18 }}>
              <div style={{ fontSize: 13, fontWeight: 800, color: '#1e293b', marginBottom: 10 }}>
                Histori Capaian Unit Misi:
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {unitList.filter((u) => u.tipe !== 'review').map((u) => (
                  <div key={u.id} style={st.barisHistoriUnit}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{
                        width: 32, height: 32, borderRadius: 10,
                        background: u.status === 'completed' ? '#d1fae5' : '#f1f5f9',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        {u.status === 'completed' ? <CheckCircle2 size={18} color="#059669" /> : <Lock size={16} color="#94a3b8" />}
                      </div>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: '#1e293b' }}>{u.judul}</div>
                        <div style={{ fontSize: 11, color: '#64748b' }}>{u.mapel}</div>
                      </div>
                    </div>
                    <div>
                      {u.status === 'completed' ? (
                        <span style={st.badgeSkorSelesai}>{u.skor}%</span>
                      ) : (
                        <span style={st.badgeBelumSelesai}>{u.status === 'current' ? 'Bisa Mulai' : 'Terkunci'}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* SARAN MATERI DARI AI */}
            <div style={st.kartuSaranAi}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                <Sparkles size={16} color="#8b5cf6" />
                <span style={{ fontSize: 13, fontWeight: 800, color: '#6d28d9' }}>
                  Rekomendasi Cerdas AI
                </span>
              </div>
              <p style={{ fontSize: 12.5, color: '#4c1d95', lineHeight: 1.5, margin: 0 }}>
                {selesaiCount === 0
                  ? 'Mulai pengerjaan Unit 1 (Start) untuk mengaktifkan AI Diagnostic Tracker yang membaca kekuatan & kelemahan belajarmu!'
                  : 'Pertahankan akurasimu! Terus lanjutkan ke Unit berikutnya tanpa khawatir deadline untuk membuka prediksi kelulusan akurasi tinggi.'}
              </p>
            </div>

            <button
              type="button"
              onClick={() => setModalReviewTerbuka(false)}
              style={st.btnTutupReview}
            >
              Kembali ke Peta Ekspedisi
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================
// KOMPONEN NODE START (BESAR, BULAT, ORANYE HANGAT)
// ============================================================
function KomponenNodeStart({ unit, onKlik }) {
  const isCompleted = unit.status === 'completed';
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <button
        type="button"
        onClick={() => onKlik(unit)}
        style={{
          ...st.btnNodeStart,
          background: isCompleted
            ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
            : 'linear-gradient(135deg, #fb923c 0%, #f97316 60%, #ea580c 100%)',
          boxShadow: isCompleted
            ? '0 10px 24px rgba(16, 185, 129, 0.45), inset 0 2px 4px rgba(255,255,255,0.4)'
            : '0 10px 24px rgba(249, 115, 22, 0.5), inset 0 2px 4px rgba(255,255,255,0.4)',
        }}
        title="Mulai Misi Tahap 1"
      >
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          {isCompleted ? (
            <CheckCircle2 size={32} color="#ffffff" strokeWidth={2.5} />
          ) : (
            <Rocket size={34} color="#ffffff" strokeWidth={2.4} />
          )}
          <span style={{ fontSize: 13, fontWeight: 900, color: '#ffffff', marginTop: 2, letterSpacing: 0.5 }}>
            {isCompleted ? 'SELESAI' : 'START'}
          </span>
        </div>
      </button>

      {/* LABEL DI BAWAH TOMBOL */}
      <div style={st.labelNodeBawah}>
        <span style={{ fontWeight: 800, color: '#064e3b', fontSize: 12 }}>
          {unit.judul.split(':')[0]}
        </span>
        {isCompleted && (
          <span style={{ fontSize: 11, fontWeight: 700, color: '#047857', marginLeft: 4 }}>
            ({unit.skor}%)
          </span>
        )}
      </div>
    </div>
  );
}

// ============================================================
// KOMPONEN NODE UNIT (UNIT 1, UNIT 2, UNIT 3, UNIT 4)
// ============================================================
function KomponenNodeUnit({ unit, onKlik }) {
  const isCompleted = unit.status === 'completed';
  const isCurrent = unit.status === 'current';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <button
        type="button"
        onClick={() => onKlik(unit)}
        style={{
          ...st.btnNodeUnit,
          background: isCompleted
            ? 'linear-gradient(135deg, #34d399 0%, #059669 100%)'
            : isCurrent
              ? 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)'
              : 'linear-gradient(135deg, #2dd4bf 0%, #0d9488 100%)',
          opacity: unit.status === 'locked' ? 0.85 : 1,
          boxShadow: isCurrent
            ? '0 0 0 6px rgba(251, 191, 36, 0.35), 0 8px 20px rgba(245, 158, 11, 0.45)'
            : isCompleted
              ? '0 8px 18px rgba(16, 185, 129, 0.35)'
              : '0 6px 14px rgba(13, 148, 136, 0.35)',
        }}
        title={unit.judul}
      >
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          {isCompleted ? (
            <Star size={24} color="#ffffff" fill="#ffffff" />
          ) : isCurrent ? (
            <Play size={24} color="#ffffff" fill="#ffffff" />
          ) : (
            <Lock size={22} color="#ffffff" strokeWidth={2.4} />
          )}
          <span style={{ fontSize: 11, fontWeight: 800, color: '#ffffff', marginTop: 2 }}>
            Unit {unit.unitNomor - 1}
          </span>
        </div>
      </button>

      {/* LABEL DI BAWAH TOMBOL */}
      <div style={st.labelNodeBawah}>
        <span style={{ fontWeight: 800, color: '#064e3b', fontSize: 11.5 }}>
          Unit {unit.unitNomor - 1}
        </span>
        {isCompleted && (
          <span style={{ fontSize: 10.5, fontWeight: 800, color: '#047857', marginLeft: 3 }}>
            ({unit.skor}%)
          </span>
        )}
      </div>
    </div>
  );
}

// ============================================================
// STYLES OBJECT (TEMA HIJAU TOSCA CERAH FUN KOSMIK GEMILANG)
// ============================================================
const st = {
  container: {
    minHeight: '100vh',
    background: 'linear-gradient(180deg, #14b8a6 0%, #0d9488 50%, #0f766e 100%)',
    position: 'relative',
    overflowX: 'hidden',
    paddingBottom: 90,
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
  },
  bgTopologyOverlay: {
    position: 'absolute',
    inset: 0,
    opacity: 0.12,
    backgroundImage: `radial-gradient(circle at 20% 30%, #ffffff 1px, transparent 1px), radial-gradient(circle at 80% 70%, #ffffff 1.5px, transparent 1.5px)`,
    backgroundSize: '40px 40px, 60px 60px',
    pointerEvents: 'none',
  },
  headerBar: {
    position: 'relative',
    zIndex: 10,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '14px 16px',
    background: 'rgba(255, 255, 255, 0.18)',
    backdropFilter: 'blur(10px)',
    borderBottom: '1px solid rgba(255, 255, 255, 0.25)',
  },
  headerJudul: {
    fontSize: 15,
    fontWeight: 800,
    color: '#ffffff',
    margin: '2px 0 0',
    textShadow: '0 1px 3px rgba(0,0,0,0.15)',
  },
  badgeJenjang: {
    fontSize: 10,
    fontWeight: 900,
    color: '#ffffff',
    background: '#f97316',
    padding: '2px 7px',
    borderRadius: 99,
    letterSpacing: 0.5,
  },
  btnLingkaranPutih: {
    width: 38,
    height: 38,
    borderRadius: '50%',
    background: '#ffffff',
    border: 'none',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    boxShadow: '0 4px 10px rgba(0,0,0,0.12)',
  },
  btnReviewHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    background: '#ffffff',
    border: 'none',
    padding: '7px 14px',
    borderRadius: 99,
    fontSize: 12,
    fontWeight: 800,
    color: '#0f766e',
    cursor: 'pointer',
    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
  },
  avatarBulat: {
    width: 38,
    height: 38,
    borderRadius: '50%',
    background: 'linear-gradient(135deg, #f59e0b, #d97706)',
    color: '#ffffff',
    fontWeight: 900,
    fontSize: 16,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: '2px solid #ffffff',
    boxShadow: '0 4px 10px rgba(0,0,0,0.15)',
  },
  barProgresBungkus: {
    position: 'relative',
    zIndex: 10,
    margin: '12px 16px 0',
    background: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 14,
    padding: '10px 14px',
    boxShadow: '0 4px 14px rgba(15, 118, 110, 0.15)',
  },
  progressBarTrack: {
    height: 8,
    background: '#e2e8f0',
    borderRadius: 99,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    background: 'linear-gradient(90deg, #10b981, #059669)',
    borderRadius: 99,
    transition: 'width 0.4s ease',
  },
  mapStageWrapper: {
    position: 'relative',
    width: '100%',
    maxWidth: 420,
    height: 800,
    margin: '0 auto',
  },
  svgJalur: {
    position: 'absolute',
    top: 0,
    left: '50%',
    transform: 'translateX(-50%)',
    width: '100%',
    height: '100%',
    pointerEvents: 'none',
  },
  nodeContainer: {
    position: 'absolute',
    zIndex: 5,
  },
  btnNodeStart: {
    width: 92,
    height: 92,
    borderRadius: '50%',
    border: '4px solid #ffffff',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'transform 0.15s ease',
  },
  btnNodeUnit: {
    width: 74,
    height: 74,
    borderRadius: '50%',
    border: '3.5px solid #ffffff',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'transform 0.15s ease',
  },
  labelNodeBawah: {
    marginTop: 6,
    background: 'rgba(255, 255, 255, 0.92)',
    padding: '3px 10px',
    borderRadius: 99,
    boxShadow: '0 2px 6px rgba(0,0,0,0.1)',
    textAlign: 'center',
    whiteSpace: 'nowrap',
  },
  tombolCapsuleReview: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '10px 24px',
    borderRadius: 99,
    background: '#ffffff',
    border: '3px solid #ccfbf1',
    boxShadow: '0 6px 18px rgba(13, 148, 136, 0.3)',
    cursor: 'pointer',
  },
  ornamenKosmik: {
    position: 'absolute',
    fontSize: 26,
    pointerEvents: 'none',
    opacity: 0.85,
    filter: 'drop-shadow(0 2px 6px rgba(0,0,0,0.15))',
  },
  maskotMengintip: {
    position: 'absolute',
    bottom: 25,
    right: -4,
    zIndex: 8,
    cursor: 'pointer',
  },
  balonBicaraMaskot: {
    position: 'absolute',
    top: -24,
    right: 35,
    background: '#ffffff',
    color: '#0f766e',
    fontSize: 10.5,
    fontWeight: 800,
    padding: '3px 8px',
    borderRadius: 8,
    boxShadow: '0 3px 8px rgba(0,0,0,0.12)',
    whiteSpace: 'nowrap',
  },
  // Modal Sheet Styles
  overlayModal: {
    position: 'fixed',
    inset: 0,
    zIndex: 2000,
    background: 'rgba(15, 23, 42, 0.55)',
    backdropFilter: 'blur(4px)',
    display: 'flex',
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  sheetModal: {
    width: '100%',
    maxWidth: 480,
    background: '#ffffff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: '12px 20px 30px',
    boxShadow: '0 -10px 30px rgba(0,0,0,0.2)',
    animation: 'slideUp 0.25s ease-out',
  },
  sheetReviewModal: {
    width: '100%',
    maxWidth: 480,
    maxHeight: '85vh',
    overflowY: 'auto',
    background: '#ffffff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: '12px 20px 30px',
    boxShadow: '0 -10px 30px rgba(0,0,0,0.2)',
  },
  dragHandle: {
    width: 44,
    height: 5,
    background: '#cbd5e1',
    borderRadius: 99,
    margin: '0 auto 16px',
  },
  btnCloseModal: {
    background: '#f1f5f9',
    border: 'none',
    width: 32,
    height: 32,
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
  },
  gridSpesifikasi: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 10,
    marginBottom: 16,
  },
  kotakSpek: {
    background: '#f8fafc',
    border: '1px solid #e2e8f0',
    borderRadius: 12,
    padding: '10px 12px',
    display: 'flex',
    alignItems: 'center',
    gap: 10,
  },
  kartuHasilSelesai: {
    background: '#fef3c7',
    border: '1px solid #fde68a',
    borderRadius: 14,
    padding: '12px 14px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  btnLihatAnalisisKecil: {
    background: '#d97706',
    color: '#ffffff',
    border: 'none',
    padding: '6px 12px',
    borderRadius: 8,
    fontWeight: 800,
    fontSize: 11.5,
    cursor: 'pointer',
  },
  kartuStatusLocked: {
    background: '#fffbeb',
    border: '1px solid #fef3c7',
    borderRadius: 12,
    padding: '12px 14px',
    display: 'flex',
    alignItems: 'center',
    gap: 10,
  },
  btnLuncurkanUjian: {
    width: '100%',
    padding: '14px',
    borderRadius: 14,
    background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
    color: '#ffffff',
    border: 'none',
    fontWeight: 800,
    fontSize: 15,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    cursor: 'pointer',
    boxShadow: '0 6px 16px rgba(234, 88, 12, 0.35)',
  },
  btnKerjakanUlang: {
    width: '100%',
    padding: '13px',
    borderRadius: 14,
    background: '#f1f5f9',
    color: '#334155',
    border: '1px solid #cbd5e1',
    fontWeight: 700,
    fontSize: 14,
    cursor: 'pointer',
  },
  btnTutupModal: {
    width: '100%',
    padding: '13px',
    borderRadius: 14,
    background: '#f8fafc',
    color: '#64748b',
    border: '1px solid #e2e8f0',
    fontWeight: 700,
    fontSize: 14,
    cursor: 'pointer',
  },
  // Review Modal Styles
  iconReviewCircle: {
    width: 44,
    height: 44,
    borderRadius: 14,
    background: '#ccfbf1',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  kartuRingkasanPerform: {
    background: 'linear-gradient(135deg, #ccfbf1 0%, #e6fffa 100%)',
    border: '1px solid #99f6e4',
    borderRadius: 16,
    padding: '16px',
    marginBottom: 16,
  },
  barisHistoriUnit: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '10px 12px',
    borderRadius: 12,
    background: '#f8fafc',
    border: '1px solid #e2e8f0',
  },
  badgeSkorSelesai: {
    fontSize: 12,
    fontWeight: 800,
    color: '#047857',
    background: '#d1fae5',
    padding: '3px 8px',
    borderRadius: 99,
  },
  badgeBelumSelesai: {
    fontSize: 11,
    fontWeight: 700,
    color: '#64748b',
    background: '#e2e8f0',
    padding: '3px 8px',
    borderRadius: 99,
  },
  kartuSaranAi: {
    background: '#f5f3ff',
    border: '1px solid #ddd6fe',
    borderRadius: 14,
    padding: '14px',
    marginBottom: 20,
  },
  btnTutupReview: {
    width: '100%',
    padding: '13px',
    borderRadius: 14,
    background: '#0d9488',
    color: '#ffffff',
    border: 'none',
    fontWeight: 800,
    fontSize: 14,
    cursor: 'pointer',
  },
  // Bukan Jenjang Akhir Styles
  bukanAkhirWrapper: {
    minHeight: '80vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '24px 16px',
  },
  kartuBukanAkhir: {
    maxWidth: 420,
    background: '#ffffff',
    borderRadius: 20,
    padding: '28px 20px',
    textAlign: 'center',
    boxShadow: '0 10px 25px rgba(0,0,0,0.06)',
    border: '1px solid #e2e8f0',
  },
  tombolKembaliBeranda: {
    width: '100%',
    padding: '12px',
    borderRadius: 12,
    background: '#0d9488',
    color: '#ffffff',
    border: 'none',
    fontWeight: 800,
    fontSize: 14,
    cursor: 'pointer',
  },
};
