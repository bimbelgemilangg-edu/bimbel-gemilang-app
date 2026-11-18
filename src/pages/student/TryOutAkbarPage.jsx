// src/pages/student/TryOutAkbarPage.jsx
// ============================================================
// Halaman Event Try Out Akbar Berjadwal (Benchmark AmbisPTN 1:1)
// - Kalender & Jadwal Event Try Out Besar Terjadwal
// - Standar Resmi SNPMB UTBK 160 Soal / TKA SMP 40 Soal
// - Penilaian IRT & Leaderboard Nasional Antarcabang
// - Tautan Kelas Live Pembahasan Bersama Tentor Bimbel Gemilang
// ============================================================
import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Award,
  Calendar,
  Clock,
  Video,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Users,
  Trophy,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  FileText,
} from 'lucide-react';
import { useProfilSiswa } from '../../utils/profilSiswa';

export default function TryOutAkbarPage() {
  const navigate = useNavigate();
  const profil = useProfilSiswa();

  const jenjang = useMemo(() => {
    const raw = String(profil.jenjang || profil.tingkat || profil.kelas || profil.kelasSekolah || '').toUpperCase();
    if (raw.includes('SMA') || raw.includes('10') || raw.includes('11') || raw.includes('12') || raw.includes('UTBK')) {
      return 'SMA';
    }
    return 'SMP';
  }, [profil]);

  // Data Event Akbar Mendatang
  const eventAkbar = useMemo(() => {
    if (jenjang === 'SMA') {
      return {
        id: 'to-akbar-utbk-01',
        judul: 'TRY OUT AKBAR NASIONAL SNPMB UTBK 2027 #1',
        subjudul: 'Simulasi Serentak CBT 7 Subtes dengan Pembobotan IRT Resmi',
        tanggal: 'Sabtu, 21 November 2026',
        jam: '08.00 - 11.15 WIB',
        jumlahSoal: 160,
        durasiMenit: 195,
        sistemPenilaian: 'Item Response Theory (IRT Skala 1000)',
        pesertaTerdaftar: 1420,
        tentorNama: 'Kak Wahyu, M.Pd & Tim Akademik Gemilang',
        jadwalPembahasan: 'Sabtu, 21 November 2026 • 13.30 - 15.30 WIB',
        linkMeet: 'https://meet.google.com/gemilang-tryout-akbar',
        statusEvent: 'Segera Dimulai',
      };
    }
    return {
      id: 'to-akbar-smp-01',
      judul: 'TRY OUT AKBAR PREDIKSI TKA SMP 2026 #1',
      subjudul: 'Simulasi Terpadu TKA Matematika & Bahasa Indonesia Menuju SMA Unggulan',
      tanggal: 'Sabtu, 21 November 2026',
      jam: '08.30 - 10.00 WIB',
      jumlahSoal: 40,
      durasiMenit: 75,
      sistemPenilaian: 'Standarisasi Kelulusan Seleksi SMA Unggulan',
      pesertaTerdaftar: 860,
      tentorNama: 'Miss Nisa & Kak Farhan (Tentor Spesialis TKA)',
      jadwalPembahasan: 'Sabtu, 21 November 2026 • 11.00 - 12.30 WIB',
      linkMeet: 'https://meet.google.com/gemilang-tka-smp',
      statusEvent: 'Segera Dimulai',
    };
  }, [jenjang]);

  return (
    <div style={A.wrap}>
      {/* Header Bar */}
      <div style={A.headerBar}>
        <button
          type="button"
          onClick={() => navigate('/siswa/dashboard')}
          style={A.btnKembali}
        >
          <ChevronLeft size={18} />
          <span>Kembali ke Beranda</span>
        </button>
        <span style={A.badgeEvent}>EVENT TRY OUT AKBAR</span>
      </div>

      <div style={A.headerInfo}>
        <h1 style={A.judulUtama}>Pusat Try Out Akbar &amp; Bedah Soal Bersama Tentor</h1>
        <p style={A.subJudul}>
          Uji kesiapan mental dan kemampuan kognitifmu dalam simulasi berskala besar serentak antarcabang, dilanjutkan dengan pembahasan langsung bersama tentor.
        </p>
      </div>

      {/* ============================================================ */}
      {/* 1. KARTU UTAMA EVENT AKBAR MENDATANG                         */}
      {/* ============================================================ */}
      <div style={A.cardEventUtama}>
        <div style={A.eventTopRow}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={A.iconTrophyCircle}>
              <Trophy size={24} color="#f59e0b" />
            </div>
            <div>
              <span style={A.badgeLiveStatus}>🔴 SIMULASI RESMI TERJADWAL</span>
              <h2 style={A.judulEventUtama}>{eventAkbar.judul}</h2>
              <div style={A.subJudulEvent}>{eventAkbar.subjudul}</div>
            </div>
          </div>
        </div>

        {/* 4 Kotak Parameter Ujian */}
        <div style={A.gridParameter}>
          <div style={A.itemParam}>
            <Calendar size={18} color="#0d9488" />
            <div>
              <span style={A.labelParam}>Hari &amp; Tanggal</span>
              <div style={A.valParam}>{eventAkbar.tanggal}</div>
            </div>
          </div>

          <div style={A.itemParam}>
            <Clock size={18} color="#0284c7" />
            <div>
              <span style={A.labelParam}>Waktu &amp; Durasi</span>
              <div style={A.valParam}>{eventAkbar.jam} ({eventAkbar.durasiMenit} Menit)</div>
            </div>
          </div>

          <div style={A.itemParam}>
            <FileText size={18} color="#7c3aed" />
            <div>
              <span style={A.labelParam}>Komposisi Soal</span>
              <div style={A.valParam}>{eventAkbar.jumlahSoal} Butir Soal Terpadu</div>
            </div>
          </div>

          <div style={A.itemParam}>
            <Users size={18} color="#ea580c" />
            <div>
              <span style={A.labelParam}>Peserta Terdaftar</span>
              <div style={A.valParam}>{eventAkbar.pesertaTerdaftar} Siswa Gemilang</div>
            </div>
          </div>
        </div>

        {/* Status Akses & Tombol Masuk */}
        <div style={A.footerAksiUjian}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <CheckCircle2 size={18} color="#10b981" />
            <span style={{ fontSize: 13, fontWeight: 700, color: '#065f46' }}>
              Kamu terdaftar otomatis sebagai siswa Bimbel Gemilang
            </span>
          </div>
          <button
            type="button"
            onClick={() => navigate('/siswa/tryout')}
            style={A.btnMasukRuangUjian}
          >
            Lihat Ruang Tryout 🚀
          </button>
        </div>
      </div>

      {/* ============================================================ */}
      {/* 2. BEDAH SOAL & PEMBAHASAN LIVE BARENG TENTOR               */}
      {/* ============================================================ */}
      <div style={A.cardLivePembahasan}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={A.iconVideoBox}>
              <Video size={24} color="#ffffff" />
            </div>
            <div>
              <span style={A.badgeTentor}>SESI DISKUSI INTERAKTIF BARENG TENTOR</span>
              <h3 style={A.judulLive}>Bedah Soal Sukar &amp; Trik Cepat Bersama Tentor</h3>
              <div style={A.subLive}>
                Didampingi oleh <strong>{eventAkbar.tentorNama}</strong>
              </div>
            </div>
          </div>

          <div style={{ textAlign: 'right' }}>
            <span style={{ fontSize: 11, color: '#64748b', fontWeight: 600 }}>Jadwal Live:</span>
            <div style={{ fontSize: 13.5, fontWeight: 800, color: '#0f172a' }}>
              {eventAkbar.jadwalPembahasan}
            </div>
          </div>
        </div>

        <div style={A.liveDescBox}>
          <p style={{ margin: 0, fontSize: 12.5, color: '#334155', lineHeight: 1.55 }}>
            Setelah mengerjakan try out akbar, siswa tidak ditinggalkan sendirian! Bergabunglah ke sesi Google Meet untuk membedah nomor-nomor yang paling banyak salah, trik eliminasi pilihan distraktor, dan konsultasi strategi perbaikan nilai.
          </p>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
          <a
            href={eventAkbar.linkMeet}
            target="_blank"
            rel="noopener noreferrer"
            style={A.btnGabungLive}
          >
            <Video size={16} />
            <span>Masuk Ruang Pembahasan Live (Google Meet)</span>
            <ExternalLink size={14} />
          </a>
        </div>
      </div>

      {/* ============================================================ */}
      {/* 3. PERBEDAAN ROADMAP MICRO-LEARNING VS TRY OUT AKBAR        */}
      {/* ============================================================ */}
      <div style={A.cardPerbandingan}>
        <h4 style={{ margin: '0 0 10px', fontSize: 14, fontWeight: 800, color: '#0f172a' }}>
          💡 Pahami Fungsi Dua Jalur Latihan di Bimbel Gemilang:
        </h4>
        <div style={A.gridDuaJalur}>
          <div style={A.jalurItem}>
            <div style={{ fontSize: 13, fontWeight: 800, color: '#0d9488', marginBottom: 4 }}>
              ⚡ 1. Roadmap Micro-Learning (12 Soal • 20 Menit)
            </div>
            <p style={{ margin: 0, fontSize: 12, color: '#475569', lineHeight: 1.5 }}>
              Latihan harian santai tanpa beban deadline. Berfungsi mengasah pola soal per subtes secara spesifik tanpa mencampur Matematika dan Bahasa Indonesia.
            </p>
          </div>

          <div style={A.jalurItem}>
            <div style={{ fontSize: 13, fontWeight: 800, color: '#7c3aed', marginBottom: 4 }}>
              🏆 2. Try Out Akbar Terjadwal (Event Besar)
            </div>
            <p style={{ margin: 0, fontSize: 12, color: '#475569', lineHeight: 1.5 }}>
              Simulasi ujian skala besar dengan durasi dan jumlah butir penuh sesuai format asli, disusul sesi tatap muka online bersama tentor untuk bedah tuntas.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

const A = {
  wrap: {
    maxWidth: 860,
    margin: '0 auto',
    padding: '20px 16px 40px',
  },
  headerBar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  btnKembali: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 4,
    background: 'none',
    border: 'none',
    color: '#0d9488',
    fontSize: 13,
    fontWeight: 700,
    cursor: 'pointer',
    padding: 0,
  },
  badgeEvent: {
    fontSize: 10.5,
    fontWeight: 900,
    color: '#f59e0b',
    background: '#fef3c7',
    padding: '4px 10px',
    borderRadius: 99,
  },
  headerInfo: {
    marginBottom: 18,
  },
  judulUtama: {
    margin: '4px 0 6px',
    fontSize: 22,
    fontWeight: 900,
    color: '#0f172a',
  },
  subJudul: {
    margin: 0,
    fontSize: 13,
    color: '#64748b',
    lineHeight: 1.5,
  },
  cardEventUtama: {
    background: 'linear-gradient(135deg, #ffffff 0%, #fffbeb 100%)',
    border: '1.5px solid #fde68a',
    borderRadius: 22,
    padding: 22,
    boxShadow: '0 8px 24px rgba(245, 158, 11, 0.08)',
    marginBottom: 18,
  },
  eventTopRow: {
    marginBottom: 16,
  },
  iconTrophyCircle: {
    width: 48,
    height: 48,
    borderRadius: 14,
    background: '#fef3c7',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  badgeLiveStatus: {
    fontSize: 10,
    fontWeight: 900,
    color: '#dc2626',
    letterSpacing: 0.5,
  },
  judulEventUtama: {
    margin: '3px 0 2px',
    fontSize: 17,
    fontWeight: 900,
    color: '#0f172a',
  },
  subJudulEvent: {
    fontSize: 12.5,
    color: '#92400e',
    fontWeight: 600,
  },
  gridParameter: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
    gap: 12,
    marginBottom: 18,
  },
  itemParam: {
    background: '#ffffff',
    border: '1px solid #fef3c7',
    borderRadius: 14,
    padding: 12,
    display: 'flex',
    alignItems: 'center',
    gap: 10,
  },
  labelParam: {
    fontSize: 10.5,
    color: '#64748b',
    fontWeight: 700,
  },
  valParam: {
    fontSize: 13,
    fontWeight: 900,
    color: '#0f172a',
    marginTop: 1,
  },
  footerAksiUjian: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 12,
    paddingTop: 14,
    borderTop: '1px dashed #fde68a',
  },
  btnMasukRuangUjian: {
    background: '#f59e0b',
    color: '#ffffff',
    border: 'none',
    padding: '10px 20px',
    borderRadius: 12,
    fontSize: 13,
    fontWeight: 800,
    cursor: 'pointer',
  },
  cardLivePembahasan: {
    background: '#ffffff',
    border: '1.5px solid #ccfbf1',
    borderRadius: 22,
    padding: 20,
    boxShadow: '0 4px 16px rgba(13, 148, 136, 0.06)',
    marginBottom: 18,
  },
  iconVideoBox: {
    width: 44,
    height: 44,
    borderRadius: 14,
    background: 'linear-gradient(135deg, #0d9488, #0284c7)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  badgeTentor: {
    fontSize: 10,
    fontWeight: 900,
    color: '#0d9488',
    letterSpacing: 0.5,
  },
  judulLive: {
    margin: '2px 0 2px',
    fontSize: 15,
    fontWeight: 900,
    color: '#0f172a',
  },
  subLive: {
    fontSize: 12,
    color: '#64748b',
  },
  liveDescBox: {
    background: '#f0fdfa',
    border: '1px solid #ccfbf1',
    borderRadius: 14,
    padding: 14,
    margin: '14px 0',
  },
  btnGabungLive: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 8,
    background: '#0d9488',
    color: '#ffffff',
    padding: '10px 18px',
    borderRadius: 12,
    fontSize: 12.5,
    fontWeight: 800,
    textDecoration: 'none',
  },
  cardPerbandingan: {
    background: '#f8fafc',
    border: '1.5px solid #e2e8f0',
    borderRadius: 18,
    padding: 16,
  },
  gridDuaJalur: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
    gap: 12,
  },
  jalurItem: {
    background: '#ffffff',
    border: '1px solid #e2e8f0',
    borderRadius: 12,
    padding: 12,
  },
};
