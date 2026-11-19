// src/components/dashboard/PusatAmbisGemilang.jsx
// ============================================================
// PUSAT AMBIS GEMILANG (Benchmark AmbisPTN 1:1)
// Menyatukan Misi Hari Ini (0/3), Countdown Ujian Resmi, Streak 7 Hari,
// Mendaki Puncak Impian (Climb to Target), dan Akses Tes Minat Bakat.
// ============================================================
import React, { useMemo, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Flame,
  CheckCircle2,
  Circle,
  Clock,
  Compass,
  BarChart3,
  GraduationCap,
  Sparkles,
  Mountain,
  ChevronRight,
  Award,
  Zap,
  BookOpen,
  Target,
} from 'lucide-react';
import { deteksiTingkatSiswa } from '../../utils/tingkatSiswa';

export default function PusatAmbisGemilang({
  studentProfile = {},
  progresStreak = 0,
  progresXp = 0,
  targetKampus = null,
  skorTerkini = null,
}) {
  const navigate = useNavigate();

  // 1. Deteksi Tingkat & Jenjang Siswa Secara Presisi
  const infoTingkat = useMemo(() => deteksiTingkatSiswa(studentProfile), [studentProfile]);
  const jenjang = infoTingkat.jenjangBaku;

  // 2. Hitung Countdown Ujian Resmi Berdasarkan Tingkat
  const targetUjian = useMemo(() => {
    const sekarang = new Date();
    let tanggalTarget;
    let namaUjian;
    let targetLabel;
    let badgeUjian;

    if (infoTingkat.isKelas12) {
      // UTBK-SNBT 2027 Gelombang 1 diperkirakan 21 April 2027
      tanggalTarget = new Date('2027-04-21T07:00:00+07:00');
      namaUjian = 'UTBK-SNBT 2027';
      targetLabel = 'PTN Impian';
      badgeUjian = 'SNPMB 2027';
    } else if (infoTingkat.isSmaBawah) {
      // Penilaian Akhir & Asesmen TKA SMA
      tanggalTarget = new Date('2026-06-08T07:30:00+07:00');
      namaUjian = 'Penilaian Akhir & TKA SMA';
      targetLabel = 'Fondasi PTN Impian';
      badgeUjian = 'SMA 2026';
    } else if (infoTingkat.isSmp) {
      // Asesmen TKA SMP 2026 diperkirakan 11 Mei 2026
      tanggalTarget = new Date('2026-05-11T07:30:00+07:00');
      namaUjian = 'Asesmen TKA SMP 2026';
      targetLabel = 'SMA Unggulan Impian';
      badgeUjian = 'TKA SMP 2026';
    } else if (infoTingkat.isSd) {
      // Asesmen TKA SD 2026 diperkirakan 18 Mei 2026
      tanggalTarget = new Date('2026-05-18T07:30:00+07:00');
      namaUjian = 'Asesmen TKA SD 2026';
      targetLabel = 'SMP Favorit Impian';
      badgeUjian = 'TKA SD 2026';
    } else {
      // Program Umum / Kursus
      tanggalTarget = new Date('2026-06-20T07:30:00+07:00');
      namaUjian = 'Evaluasi Kemampuan Akhir';
      targetLabel = 'Standar Kompetensi';
      badgeUjian = 'GEMILANG 2026';
    }

    const selisihMs = tanggalTarget.getTime() - sekarang.getTime();
    const selisihHari = Math.max(0, Math.ceil(selisihMs / (1000 * 60 * 60 * 24)));
    const selisihMinggu = Math.ceil(selisihHari / 7);

    return {
      namaUjian,
      targetLabel,
      badgeUjian,
      selisihHari,
      selisihMinggu,
      tanggalTargetStr: tanggalTarget.toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      }),
    };
  }, [infoTingkat]);

  // 3. Format Hari & Tanggal Hari Ini (misal: "Rabu, 18 November 2026")
  const teksHariIni = useMemo(() => {
    return new Date().toLocaleDateString('id-ID', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    });
  }, []);

  // 4. Misi Hari Ini (0/3) — Tersimpan per tanggal di localStorage
  const storageKeyMisi = useMemo(() => {
    const sid = studentProfile.id || studentProfile.studentId || 'siswa';
    const tgl = new Date().toISOString().slice(0, 10);
    return `misi_harian_${sid}_${tgl}`;
  }, [studentProfile]);

  const [statusMisi, setStatusMisi] = useState({
    misi1: false, // Latihan Kilat Harian
    misi2: false, // Baca Modul Bab
    misi3: false, // Cek Target Kampus/Sekolah
  });

  useEffect(() => {
    try {
      const tersimpan = localStorage.getItem(storageKeyMisi);
      if (tersimpan) {
        setStatusMisi(JSON.parse(tersimpan));
      }
    } catch {
      // abaikan fallback
    }
  }, [storageKeyMisi]);

  const toggleMisi = (key) => {
    setStatusMisi((prev) => {
      const baru = { ...prev, [key]: !prev[key] };
      try {
        localStorage.setItem(storageKeyMisi, JSON.stringify(baru));
      } catch {
        // ignore
      }
      return baru;
    });
  };

  const totalSelesaiMisi = (statusMisi.misi1 ? 1 : 0) + (statusMisi.misi2 ? 1 : 0) + (statusMisi.misi3 ? 1 : 0);
  const persenMisi = Math.round((totalSelesaiMisi / 3) * 100);

  // 5. Strip Aktivitas 7 Hari Terakhir
  const strip7Hari = useMemo(() => {
    const hariSingkat = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
    const hasil = [];
    const sekarang = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(sekarang.getDate() - i);
      const namaHari = hariSingkat[d.getDay()];
      const isHariIni = i === 0;
      // Aktif jika streak mencakup hari ini atau hari kemarin
      const aktif = i === 0 ? Boolean(progresStreak > 0) : i < progresStreak;
      hasil.push({ namaHari, aktif, isHariIni, tanggal: d.getDate() });
    }
    return hasil;
  }, [progresStreak]);

  // 6. Mendaki Puncak Impian (Climb to Target)
  const pendakian = useMemo(() => {
    const skorTargetDefault = jenjang === 'SMA' ? 720 : 88;
    const skorAcuan = Number(targetKampus?.skorAcuan || targetKampus?.targetSkor || skorTargetDefault);
    const skorUser = Number(skorTerkini) || 0;
    const persenPuncak = Math.min(100, Math.max(0, Math.round((skorUser / skorAcuan) * 100)));
    const gap = skorUser - skorAcuan;

    let posLabel = 'Basecamp (Mulai Latihan)';
    if (persenPuncak >= 90) posLabel = 'Pos 3 (Puncak Kesiapan)';
    else if (persenPuncak >= 65) posLabel = 'Pos 2 (Pemantapan Subtes)';
    else if (persenPuncak >= 35) posLabel = 'Pos 1 (Pondasi Konsep)';

    return {
      namaTarget: targetKampus?.namaPtn || (jenjang === 'SMA' ? 'Universitas Pilihan' : 'SMA Unggulan Pilihan'),
      prodiTarget: targetKampus?.namaProdi || (jenjang === 'SMA' ? 'Jurusan Impian' : 'Peminatan MIPA'),
      skorAcuan,
      skorUser,
      persenPuncak,
      gap,
      posLabel,
    };
  }, [jenjang, targetKampus, skorTerkini]);

  return (
    <div style={styles.container}>
      {/* ============================================================ */}
      {/* 1. COUNTDOWN UJIAN RESMI & MOTIVASI HARIAN                   */}
      {/* ============================================================ */}
      <div style={styles.cardCountdown}>
        <div style={styles.countdownHeader}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 20 }}>⏳</span>
            <div>
              <div style={styles.countdownTitle}>
                H- {targetUjian.selisihHari} Hari Menuju {targetUjian.namaUjian}
              </div>
              <div style={styles.countdownSub}>
                ± {targetUjian.selisihMinggu} Minggu Lagi • Pelaksanaan: {targetUjian.tanggalTargetStr}
              </div>
            </div>
          </div>
          <span style={styles.badgeCountdown}>
            {targetUjian.badgeUjian}
          </span>
        </div>

        <div style={styles.quoteBox}>
          <Sparkles size={16} color="#d97706" style={{ flexShrink: 0, marginTop: 2 }} />
          <div style={styles.quoteText}>
            <strong>&ldquo;Sedikit tiap hari mengalahkan kebut semalam.&rdquo;</strong> Konsisten selesaikan 12 butir soal latihan kilat setiap hari untuk menembus {targetUjian.targetLabel}.
          </div>
        </div>
      </div>

      {/* ============================================================ */}
      {/* 2. MISI HARI INI & STREAK 7 HARI TERAKHIR                    */}
      {/* ============================================================ */}
      <div style={styles.gridDuaKolom}>
        {/* Kolom Kiri: Misi Hari Ini (0/3) */}
        <div style={styles.cardMisi}>
          <div style={styles.misiHeader}>
            <div>
              <div style={styles.misiBadge}>MISI HARIAN</div>
              <h3 style={styles.misiJudul}>
                {teksHariIni} • <span style={{ color: totalSelesaiMisi === 3 ? '#10b981' : '#0d9488' }}>{totalSelesaiMisi}/3 Selesai</span>
              </h3>
            </div>
            {totalSelesaiMisi === 3 ? (
              <span style={styles.badgeBonusDone}>+50 XP TUNTAS 🚀</span>
            ) : (
              <span style={styles.badgeBonus}>Bonus +50 XP ⚡</span>
            )}
          </div>

          {/* Progress Bar Misi */}
          <div style={styles.barMisiTrack}>
            <div
              style={{
                ...styles.barMisiFill,
                width: `${persenMisi}%`,
                background: totalSelesaiMisi === 3
                  ? 'linear-gradient(90deg, #10b981, #059669)'
                  : 'linear-gradient(90deg, #0d9488, #0284c7)',
              }}
            />
          </div>

          {/* Checklist 3 Misi */}
          <div style={styles.listMisi}>
            {/* Misi 1: Latihan Kilat */}
            <div style={styles.itemMisi}>
              <button
                type="button"
                onClick={() => toggleMisi('misi1')}
                style={styles.btnCheck}
                title="Tandai Selesai"
              >
                {statusMisi.misi1 ? (
                  <CheckCircle2 size={20} color="#10b981" />
                ) : (
                  <Circle size={20} color="#94a3b8" />
                )}
              </button>
              <div style={{ flex: 1 }}>
                <div style={{ ...styles.teksMisiJudul, textDecoration: statusMisi.misi1 ? 'line-through' : 'none', color: statusMisi.misi1 ? '#64748b' : '#1e293b' }}>
                  Latihan Kilat Harian (Roadmap)
                </div>
                <div style={styles.teksMisiSub}>Pola soal mikro 15-20 menit</div>
              </div>
              <button
                type="button"
                onClick={() => navigate('/siswa/roadmap')}
                style={styles.btnAksiMisi}
              >
                Mulai ⚡
              </button>
            </div>

            {/* Misi 2: Buka Modul (Kelas 12 UTBK vs Reguler) */}
            <div style={styles.itemMisi}>
              <button
                type="button"
                onClick={() => toggleMisi('misi2')}
                style={styles.btnCheck}
                title="Tandai Selesai"
              >
                {statusMisi.misi2 ? (
                  <CheckCircle2 size={20} color="#10b981" />
                ) : (
                  <Circle size={20} color="#94a3b8" />
                )}
              </button>
              <div style={{ flex: 1 }}>
                <div style={{ ...styles.teksMisiJudul, textDecoration: statusMisi.misi2 ? 'line-through' : 'none', color: statusMisi.misi2 ? '#64748b' : '#1e293b' }}>
                  {infoTingkat.isKelas12 ? 'Pelajari 1 Modul Bab UTBK' : (infoTingkat.isSmp ? 'Pelajari 1 Modul Bab TKA SMP' : 'Pelajari Materi Pembelajaran')}
                </div>
                <div style={styles.teksMisiSub}>
                  {infoTingkat.isKelas12 ? 'Penguatan konsep 7 subtes resmi SNPMB' : (infoTingkat.isSmp ? 'Penguatan konsep Numerasi & Literasi TKA Kelas 9' : 'Penguatan konsep dan telaah materi')}
                </div>
              </div>
              <button
                type="button"
                onClick={() => navigate((infoTingkat.isKelas12 || infoTingkat.isSmp) ? '/siswa/modul' : '/siswa/latihan-harian')}
                style={styles.btnAksiMisi}
              >
                Buka 📖
              </button>
            </div>

            {/* Misi 3: Cek Target & Peluang (SMA vs SMP/SD) */}
            <div style={styles.itemMisi}>
              <button
                type="button"
                onClick={() => toggleMisi('misi3')}
                style={styles.btnCheck}
                title="Tandai Selesai"
              >
                {statusMisi.misi3 ? (
                  <CheckCircle2 size={20} color="#10b981" />
                ) : (
                  <Circle size={20} color="#94a3b8" />
                )}
              </button>
              <div style={{ flex: 1 }}>
                <div style={{ ...styles.teksMisiJudul, textDecoration: statusMisi.misi3 ? 'line-through' : 'none', color: statusMisi.misi3 ? '#64748b' : '#1e293b' }}>
                  {infoTingkat.bisaAksesTargetKampus ? 'Cek Target PTN & Ambis Meter' : 'Pantau Progres Belajar & Skor'}
                </div>
                <div style={styles.teksMisiSub}>
                  {infoTingkat.bisaAksesTargetKampus ? 'Pantau GAP skor menuju kampus impian' : 'Evaluasi capaian skor & konsistensi'}
                </div>
              </div>
              <button
                type="button"
                onClick={() => navigate(infoTingkat.bisaAksesTargetKampus ? '/siswa/target-kampus' : '/siswa/progres')}
                style={styles.btnAksiMisi}
              >
                {infoTingkat.bisaAksesTargetKampus ? 'Cek 🎯' : 'Cek 📊'}
              </button>
            </div>
          </div>
        </div>

        {/* Kolom Kanan: Streak Latihan & 7 Hari Terakhir */}
        <div style={styles.cardStreak}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={styles.iconStreakCircle}>
                <Flame size={22} color="#ea580c" />
              </div>
              <div>
                <div style={styles.streakLabel}>STREAK LATIHAN</div>
                <div style={styles.streakCount}>{progresStreak} Hari Beruntun 🔥</div>
              </div>
            </div>
            <div style={styles.xpBadge}>
              <Zap size={14} color="#f59e0b" />
              <span>{progresXp} XP</span>
            </div>
          </div>

          <div style={styles.teksStreakPemicu}>
            {progresStreak === 0
              ? 'Latihan hari ini untuk menyalakan api streak pertamamu!'
              : `Hebat! Pertahankan streak ${progresStreak} hari ini agar ritme belajarmu tidak putus.`}
          </div>

          {/* Strip 7 Hari */}
          <div style={styles.strip7HariWrap}>
            {strip7Hari.map((item, idx) => (
              <div key={idx} style={styles.itemHari}>
                <span style={{ fontSize: 10.5, fontWeight: 700, color: item.isHariIni ? '#0d9488' : '#64748b' }}>
                  {item.namaHari}
                </span>
                <div
                  style={{
                    ...styles.lingkaranHari,
                    background: item.aktif ? '#ffedd5' : '#f1f5f9',
                    border: item.aktif
                      ? '2px solid #ea580c'
                      : item.isHariIni
                      ? '2px dashed #0d9488'
                      : '1.5px solid #e2e8f0',
                  }}
                >
                  {item.aktif ? (
                    <span style={{ fontSize: 13 }}>🔥</span>
                  ) : (
                    <span style={{ fontSize: 10, fontWeight: 700, color: '#94a3b8' }}>
                      {item.tanggal}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Tombol Shortcut ke Statistik Belajar Lengkap */}
          <button
            type="button"
            onClick={() => navigate('/siswa/statistik')}
            style={styles.btnBukaStatistik}
          >
            <BarChart3 size={15} color="#0d9488" />
            <span>Lihat Statistik &amp; Kalender Heatmap Belajar</span>
            <ChevronRight size={15} color="#0d9488" />
          </button>
        </div>
      </div>

      {/* ============================================================ */}
      {/* 3. CLIMB TO TARGET (MENDAKI PUNCAK IMPIAN PTN) — KHUSUS SMA */}
      {/* ============================================================ */}
      {infoTingkat.bisaAksesTargetKampus && (
        <div style={styles.cardClimb}>
          <div style={styles.climbHeader}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={styles.iconClimbCircle}>
                <Mountain size={22} color="#059669" />
              </div>
              <div>
                <div style={styles.climbBadge}>CLIMB TO TARGET • AMBIS METER</div>
                <h4 style={styles.climbJudul}>
                  {pendakian.namaTarget} — <span style={{ color: '#0d9488' }}>{pendakian.prodiTarget}</span>
                </h4>
              </div>
            </div>
            <button
              type="button"
              onClick={() => navigate(jenjang === 'SMA' ? '/siswa/katalog-ptn' : '/siswa/target-kampus')}
              style={styles.btnGantiTarget}
            >
              Ganti Target 🏛️
            </button>
          </div>

          {/* Visual Jalur Pendakian Gunung */}
          <div style={styles.climbPathWrap}>
            <div style={styles.climbStatsRow}>
              <div>
                <span style={styles.climbStatLabel}>Posisi Elevasi Saat Ini:</span>
                <div style={styles.climbStatVal}>
                  {pendakian.skorUser > 0 ? `${pendakian.skorUser} Poin` : 'Belum Ada Skor'}
                  <span style={styles.climbPosBadge}>{pendakian.posLabel}</span>
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span style={styles.climbStatLabel}>Passing Grade Puncak:</span>
                <div style={{ fontSize: 18, fontWeight: 900, color: '#0f766e' }}>
                  {pendakian.skorAcuan} Poin
                </div>
              </div>
            </div>

            {/* Progress Gunung */}
            <div style={styles.gunungTrack}>
              <div
                style={{
                  ...styles.gunungFill,
                  width: `${Math.max(8, pendakian.persenPuncak)}%`,
                }}
              >
                <span style={styles.markerPendaki}>🧗</span>
              </div>
            </div>

            <div style={styles.gunungPosLabels}>
              <span>Basecamp (0)</span>
              <span>Pos 1 (Pondasi)</span>
              <span>Pos 2 (Subtes)</span>
              <span>Pos 3 (Tryout)</span>
              <span style={{ fontWeight: 800, color: '#0f766e' }}>Puncak Impian 🏆</span>
            </div>

            <div style={styles.gapStatusFooter}>
              <span style={{ fontSize: 12, color: '#334155' }}>
                Selisih ke Puncak Target:
              </span>
              <span
                style={{
                  fontSize: 12.5,
                  fontWeight: 800,
                  color: pendakian.gap >= 0 ? '#10b981' : '#d97706',
                }}
              >
                {pendakian.gap >= 0
                  ? `+${pendakian.gap} Poin (Zona Aman Lulus 🚀)`
                  : `${pendakian.gap} Poin Menuju Standar Kelulusan`}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* 4. BANNER TES MINAT BAKAT (HOLLAND RIASEC ~7 MENIT)          */}
      {/* ============================================================ */}
      <div style={styles.cardMinatBakat}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, flex: 1 }}>
          <div style={styles.iconMinatCircle}>
            <Compass size={28} color="#7c3aed" />
          </div>
          <div>
            <div style={styles.badgeMinat}>ASESMEN MINAT &amp; BAKAT • 7 MENIT</div>
            <h4 style={styles.judulMinat}>
              {jenjang === 'SMA'
                ? 'Belum Yakin Mau Pilih Jurusan Kuliah Apa?'
                : 'Bingung Menentukan Peminatan Sekolah Impian?'}
            </h4>
            <p style={styles.descMinat}>
              Petakan kepribadian Holland Code (RIASEC) untuk menemukan rumpun jurusan dan karier masa depan yang paling cocok dengan potensimu.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => navigate('/siswa/minat-bakat')}
          style={styles.btnMulaiMinat}
        >
          Mulai Asesmen (7 Mnt) 🧭
        </button>
      </div>

      {/* ============================================================ */}
      {/* 5. DOCK SHORTCUT AMBIS CEPAT                                */}
      {/* ============================================================ */}
      <div style={styles.shortcutRow}>
        <button
          type="button"
          onClick={() => navigate('/siswa/statistik')}
          style={styles.btnShortcutItem}
        >
          <BarChart3 size={18} color="#0d9488" />
          <span>Statistik Belajar</span>
        </button>
        <button
          type="button"
          onClick={() => navigate('/siswa/roadmap')}
          style={styles.btnShortcutItem}
        >
          <Zap size={18} color="#ea580c" />
          <span>Roadmap Micro</span>
        </button>
        {jenjang === 'SMA' && (
          <button
            type="button"
            onClick={() => navigate('/siswa/katalog-ptn')}
            style={styles.btnShortcutItem}
          >
            <GraduationCap size={18} color="#2563eb" />
            <span>Katalog 173 PTN</span>
          </button>
        )}
        <button
          type="button"
          onClick={() => navigate('/siswa/tryout-akbar')}
          style={styles.btnShortcutItem}
        >
          <Award size={18} color="#7c3aed" />
          <span>Try Out Akbar Event</span>
        </button>
      </div>
    </div>
  );
}

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
    marginBottom: 20,
  },
  cardCountdown: {
    background: 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)',
    border: '1.5px solid #fde68a',
    borderRadius: 20,
    padding: '16px 20px',
    boxShadow: '0 4px 14px rgba(245, 158, 11, 0.1)',
  },
  countdownHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  countdownTitle: {
    fontSize: 16,
    fontWeight: 900,
    color: '#92400e',
  },
  countdownSub: {
    fontSize: 12,
    color: '#b45309',
    marginTop: 2,
    fontWeight: 600,
  },
  badgeCountdown: {
    background: '#f59e0b',
    color: '#ffffff',
    fontSize: 11,
    fontWeight: 800,
    padding: '4px 10px',
    borderRadius: 99,
  },
  quoteBox: {
    marginTop: 12,
    paddingTop: 10,
    borderTop: '1px dashed #fcd34d',
    display: 'flex',
    alignItems: 'flex-start',
    gap: 8,
  },
  quoteText: {
    fontSize: 12,
    color: '#78350f',
    lineHeight: 1.5,
  },
  gridDuaKolom: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
    gap: 16,
  },
  cardMisi: {
    background: '#ffffff',
    border: '1.5px solid #e2e8f0',
    borderRadius: 20,
    padding: 18,
    boxShadow: '0 4px 16px rgba(0, 0, 0, 0.04)',
    display: 'flex',
    flexDirection: 'column',
  },
  misiHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  misiBadge: {
    fontSize: 10,
    fontWeight: 900,
    letterSpacing: 0.5,
    color: '#0d9488',
    textTransform: 'uppercase',
  },
  misiJudul: {
    margin: '3px 0 0',
    fontSize: 15,
    fontWeight: 900,
    color: '#0f172a',
  },
  badgeBonus: {
    fontSize: 11,
    fontWeight: 800,
    background: '#fef3c7',
    color: '#b45309',
    padding: '4px 8px',
    borderRadius: 8,
  },
  badgeBonusDone: {
    fontSize: 11,
    fontWeight: 800,
    background: '#dcfce7',
    color: '#15803d',
    padding: '4px 8px',
    borderRadius: 8,
  },
  barMisiTrack: {
    height: 7,
    background: '#f1f5f9',
    borderRadius: 99,
    overflow: 'hidden',
    margin: '6px 0 14px',
  },
  barMisiFill: {
    height: '100%',
    borderRadius: 99,
    transition: 'width 0.4s ease',
  },
  listMisi: {
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
  },
  itemMisi: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '8px 10px',
    background: '#f8fafc',
    borderRadius: 12,
    border: '1px solid #f1f5f9',
  },
  btnCheck: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: 2,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  teksMisiJudul: {
    fontSize: 12.5,
    fontWeight: 700,
  },
  teksMisiSub: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 1,
  },
  btnAksiMisi: {
    background: '#0d9488',
    color: '#ffffff',
    border: 'none',
    padding: '5px 12px',
    borderRadius: 8,
    fontSize: 11.5,
    fontWeight: 800,
    cursor: 'pointer',
    flexShrink: 0,
  },
  cardStreak: {
    background: '#ffffff',
    border: '1.5px solid #e2e8f0',
    borderRadius: 20,
    padding: 18,
    boxShadow: '0 4px 16px rgba(0, 0, 0, 0.04)',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
  },
  iconStreakCircle: {
    width: 38,
    height: 38,
    borderRadius: 12,
    background: '#ffedd5',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  streakLabel: {
    fontSize: 10,
    fontWeight: 900,
    letterSpacing: 0.5,
    color: '#ea580c',
  },
  streakCount: {
    fontSize: 15,
    fontWeight: 900,
    color: '#0f172a',
  },
  xpBadge: {
    display: 'flex',
    alignItems: 'center',
    gap: 4,
    background: '#fffbeb',
    border: '1px solid #fde68a',
    padding: '4px 10px',
    borderRadius: 99,
    fontSize: 12,
    fontWeight: 800,
    color: '#b45309',
  },
  teksStreakPemicu: {
    fontSize: 12,
    color: '#475569',
    lineHeight: 1.45,
    margin: '4px 0 14px',
  },
  strip7HariWrap: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 4,
    padding: '10px 8px',
    background: '#f8fafc',
    borderRadius: 14,
    border: '1px solid #e2e8f0',
    marginBottom: 12,
  },
  itemHari: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 4,
  },
  lingkaranHari: {
    width: 32,
    height: 32,
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.2s ease',
  },
  btnBukaStatistik: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    width: '100%',
    background: '#f0fdfa',
    border: '1.5px solid #ccfbf1',
    color: '#0f766e',
    padding: '9px 12px',
    borderRadius: 12,
    fontSize: 12,
    fontWeight: 800,
    cursor: 'pointer',
    marginTop: 6,
  },
  cardClimb: {
    background: 'linear-gradient(135deg, #ffffff 0%, #f0fdf4 100%)',
    border: '1.5px solid #bbf7d0',
    borderRadius: 20,
    padding: 18,
    boxShadow: '0 4px 16px rgba(16, 185, 129, 0.08)',
  },
  climbHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 14,
  },
  iconClimbCircle: {
    width: 38,
    height: 38,
    borderRadius: 12,
    background: '#dcfce7',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  climbBadge: {
    fontSize: 10,
    fontWeight: 900,
    letterSpacing: 0.5,
    color: '#059669',
  },
  climbJudul: {
    margin: '2px 0 0',
    fontSize: 15,
    fontWeight: 900,
    color: '#0f172a',
  },
  btnGantiTarget: {
    background: '#ffffff',
    border: '1px solid #86efac',
    color: '#166534',
    padding: '5px 12px',
    borderRadius: 8,
    fontSize: 11.5,
    fontWeight: 800,
    cursor: 'pointer',
  },
  climbPathWrap: {
    background: '#ffffff',
    borderRadius: 14,
    border: '1px solid #dcfce7',
    padding: 14,
  },
  climbStatsRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  climbStatLabel: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: 600,
  },
  climbStatVal: {
    fontSize: 17,
    fontWeight: 900,
    color: '#0f172a',
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    marginTop: 2,
  },
  climbPosBadge: {
    fontSize: 11,
    fontWeight: 800,
    color: '#059669',
    background: '#dcfce7',
    padding: '2px 8px',
    borderRadius: 99,
  },
  gunungTrack: {
    height: 12,
    background: '#e2e8f0',
    borderRadius: 99,
    position: 'relative',
    margin: '14px 0 8px',
    overflow: 'visible',
  },
  gunungFill: {
    height: '100%',
    background: 'linear-gradient(90deg, #10b981, #059669)',
    borderRadius: 99,
    position: 'relative',
    transition: 'width 0.4s ease',
  },
  markerPendaki: {
    position: 'absolute',
    right: -10,
    top: -10,
    fontSize: 18,
  },
  gunungPosLabels: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: 10,
    color: '#64748b',
    fontWeight: 600,
    marginBottom: 10,
  },
  gapStatusFooter: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
    borderTop: '1px dashed #e2e8f0',
  },
  cardMinatBakat: {
    background: 'linear-gradient(135deg, #faf5ff 0%, #f3e8ff 100%)',
    border: '1.5px solid #e9d5ff',
    borderRadius: 20,
    padding: '16px 20px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 14,
    boxShadow: '0 4px 14px rgba(124, 58, 237, 0.08)',
  },
  iconMinatCircle: {
    width: 48,
    height: 48,
    borderRadius: 14,
    background: '#ede9fe',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  badgeMinat: {
    fontSize: 10,
    fontWeight: 900,
    color: '#7c3aed',
    letterSpacing: 0.5,
  },
  judulMinat: {
    margin: '2px 0 4px',
    fontSize: 15,
    fontWeight: 900,
    color: '#4c1d95',
  },
  descMinat: {
    margin: 0,
    fontSize: 11.5,
    color: '#6b21a8',
    lineHeight: 1.45,
    maxWidth: 580,
  },
  btnMulaiMinat: {
    background: '#7c3aed',
    color: '#ffffff',
    border: 'none',
    padding: '10px 18px',
    borderRadius: 12,
    fontSize: 12.5,
    fontWeight: 800,
    cursor: 'pointer',
    flexShrink: 0,
  },
  shortcutRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
    gap: 10,
  },
  btnShortcutItem: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    background: '#ffffff',
    border: '1.5px solid #e2e8f0',
    borderRadius: 14,
    padding: '10px 12px',
    fontSize: 12,
    fontWeight: 800,
    color: '#334155',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
};
