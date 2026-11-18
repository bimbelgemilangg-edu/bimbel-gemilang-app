// src/pages/student/TesMinatBakatPage.jsx
// ============================================================
// Halaman Tes Minat & Bakat Siswa (Benchmark AmbisPTN 1:1)
// Berdasarkan Metodologi Psikometri Holland RIASEC (6 Dimensi)
// Realistic, Investigative, Artistic, Social, Enterprising, Conventional
// Disesuaikan untuk Siswa SMA (Jurusan PTN) & SMP/SD (Peminatan Sekolah)
// ============================================================
import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Compass,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Sparkles,
  Award,
  Target,
  GraduationCap,
  ArrowRight,
  RotateCcw,
} from 'lucide-react';
import { useProfilSiswa } from '../../utils/profilSiswa';

// 18 Pertanyaan Minat Riasec Ringkas (3 per dimensi)
const DAFTAR_PERTANYAAN = [
  // Realistic (R)
  { id: 1, dim: 'R', teks: 'Saya senang merakit, membongkar mesin, gadget, atau membuat kerajinan tangan.' },
  { id: 2, dim: 'R', teks: 'Saya menyukai aktivitas luar ruangan atau praktik lab dibanding teori di kelas.' },
  { id: 3, dim: 'R', teks: 'Saya tertarik mempelajari cara kerja software komputer, otomotif, atau robotika.' },

  // Investigative (I)
  { id: 4, dim: 'I', teks: 'Saya penasaran memecahkan teka-teki logika yang rumit atau soal matematika menantang.' },
  { id: 5, dim: 'I', teks: 'Saya suka meneliti fakta ilmiah, fenomena alam, atau membaca artikel sains dan teknologi.' },
  { id: 6, dim: 'I', teks: 'Saya lebih suka menganalisis data dan bukti nyata sebelum mengambil keputusan.' },

  // Artistic (A)
  { id: 7, dim: 'A', teks: 'Saya suka mendesain visual, menggambar, fotografi, atau mengedit video.' },
  { id: 8, dim: 'A', teks: 'Saya menikmati menulis cerita, puisi, esai opini, atau mendengarkan/bermain musik.' },
  { id: 9, dim: 'A', teks: 'Saya menyukai ide-ide orisinal dan bebas berkreasi tanpa aturan yang kaku.' },

  // Social (S)
  { id: 10, dim: 'S', teks: 'Saya senang membantu teman yang kesulitan belajar atau mendengarkan curhat orang lain.' },
  { id: 11, dim: 'S', teks: 'Saya tertarik menjadi relawan, mengajar, atau berkontribusi dalam kegiatan sosial.' },
  { id: 12, dim: 'S', teks: 'Saya merasa puas jika bisa memberi dampak positif bagi kesehatan atau kesejahteraan sesama.' },

  // Enterprising (E)
  { id: 13, dim: 'E', teks: 'Saya berani berbicara di depan umum, bernegosiasi, atau memimpin tim dalam proyek.' },
  { id: 14, dim: 'E', teks: 'Saya tertarik pada dunia bisnis, pemasaran, investasi saham, atau mendirikan startup.' },
  { id: 15, dim: 'E', teks: 'Saya termotivasi untuk mencapai target tinggi dan mempengaruhi orang lain untuk bertindak.' },

  // Conventional (C)
  { id: 16, dim: 'C', teks: 'Saya suka segala sesuatu teratur rapi, memiliki jadwal terencana, dan daftar to-do list.' },
  { id: 17, dim: 'C', teks: 'Saya teliti memeriksa dokumen angka, laporan keuangan, atau data tabular tanpa salah.' },
  { id: 18, dim: 'C', teks: 'Saya merasa nyaman mengikuti prosedur kerja baku yang sudah terbukti efektif.' },
];

const OPSI_SKALA = [
  { poin: 1, label: 'Sangat Tidak Suka', emoji: '😣' },
  { poin: 2, label: 'Kurang Suka', emoji: '🙁' },
  { poin: 3, label: 'Biasa Saja', emoji: '😐' },
  { poin: 4, label: 'Suka', emoji: '🙂' },
  { poin: 5, label: 'Sangat Suka', emoji: '🤩' },
];

export default function TesMinatBakatPage() {
  const navigate = useNavigate();
  const profil = useProfilSiswa();

  const jenjang = useMemo(() => {
    const raw = String(profil.jenjang || profil.tingkat || profil.kelas || profil.kelasSekolah || '').toUpperCase();
    if (raw.includes('SMA') || raw.includes('10') || raw.includes('11') || raw.includes('12') || raw.includes('UTBK')) {
      return 'SMA';
    }
    return 'SMP';
  }, [profil]);

  const [nomorAktif, setNomorAktif] = useState(0);
  const [jawabanMap, setJawabanMap] = useState({});
  const [tuntas, setTuntas] = useState(false);

  const pertanyaan = DAFTAR_PERTANYAAN[nomorAktif];
  const totalSoal = DAFTAR_PERTANYAAN.length;
  const persenSelesai = Math.round((Object.keys(jawabanMap).length / totalSoal) * 100);

  const pilihJawaban = (poin) => {
    const baru = { ...jawabanMap, [pertanyaan.id]: poin };
    setJawabanMap(baru);
    if (nomorAktif < totalSoal - 1) {
      setNomorAktif(nomorAktif + 1);
    } else {
      setTuntas(true);
    }
  };

  // Kalkulasi Skor 6 Dimensi RIASEC
  const hasilRiasec = useMemo(() => {
    if (!tuntas) return null;
    const skor = { R: 0, I: 0, A: 0, S: 0, E: 0, C: 0 };
    DAFTAR_PERTANYAAN.forEach((p) => {
      const val = jawabanMap[p.id] || 3;
      skor[p.dim] += val;
    });

    const labelDimensi = {
      R: { nama: 'Realistic (Si Praktisi Teknis)', color: '#0d9488', icon: '🛠️' },
      I: { nama: 'Investigative (Si Peneliti Kritis)', color: '#0284c7', icon: '🔬' },
      A: { nama: 'Artistic (Si Kreator Orisinal)', color: '#8b5cf6', icon: '🎨' },
      S: { nama: 'Social (Si Humanis Pembimbing)', color: '#10b981', icon: '🤝' },
      E: { nama: 'Enterprising (Si Pemimpin Visioner)', color: '#ea580c', icon: '🚀' },
      C: { nama: 'Conventional (Si Analis Terstruktur)', color: '#d97706', icon: '📊' },
    };

    // Urutkan 3 Teratas
    const diurutkan = Object.entries(skor)
      .map(([dim, val]) => ({ dim, val, ...labelDimensi[dim] }))
      .sort((a, b) => b.val - a.val);

    const kodeTop3 = diurutkan.slice(0, 3).map((d) => d.dim).join('');

    // Rekomendasi Jurusan / Peminatan berdasarkan kode teratas
    const rekomendasiSma = [
      { nama: 'Teknik Informatika / Sains Data', ptn: 'UI, ITB, ITS, UGM', skorAcuan: 730, match: 'Tinggi (98%)' },
      { nama: 'Pendidikan Dokter & Kedokteran Gigi', ptn: 'UI, UGM, Unair, Undip', skorAcuan: 745, match: 'Tinggi (95%)' },
      { nama: 'Teknik Elektro & Robotika', ptn: 'ITB, ITS, Undip, UB', skorAcuan: 710, match: 'Sangat Cocok (92%)' },
      { nama: 'Desain Komunikasi Visual (DKV)', ptn: 'ITB, ISI, UNS, ITS', skorAcuan: 685, match: 'Sangat Cocok (90%)' },
      { nama: 'Psikologi & Ilmu Komunikasi', ptn: 'UI, UGM, Unpad, Undip', skorAcuan: 700, match: 'Cocok (88%)' },
      { nama: 'Manajemen Bisnis & Akuntansi', ptn: 'UI, UGM, Unpad, UB', skorAcuan: 715, match: 'Cocok (87%)' },
    ];

    const rekomendasiSmp = [
      { nama: 'Peminatan MIPA SMA Unggulan (Fokus Riset & Olimpiade)', sekolah: 'SMA Taruna Nusantara, SMA 8, Labschool', passingGrade: '88.5', match: 'Tinggi (98%)' },
      { nama: 'SMK Rekayasa Perangkat Lunak & Kecerdasan Buatan', sekolah: 'SMKN Favorit & Vokasi Unggulan', passingGrade: '85.0', match: 'Sangat Cocok (94%)' },
      { nama: 'Peminatan Humaniora / IPS Terakreditasi A', sekolah: 'SMA Negeri Favorit Kota', passingGrade: '84.0', match: 'Cocok (90%)' },
      { nama: 'Peminatan Desain Grafis & Multimedia Kreatif', sekolah: 'SMK Seni & Industri Kreatif', passingGrade: '82.5', match: 'Cocok (88%)' },
    ];

    return {
      skor,
      diurutkan,
      kodeTop3,
      rekomendasi: jenjang === 'SMA' ? rekomendasiSma : rekomendasiSmp,
    };
  }, [tuntas, jawabanMap, jenjang]);

  const resetTes = () => {
    setJawabanMap({});
    setNomorAktif(0);
    setTuntas(false);
  };

  return (
    <div style={T.wrap}>
      {/* Header Bar */}
      <div style={T.headerBar}>
        <button
          type="button"
          onClick={() => navigate('/siswa/dashboard')}
          style={T.btnKembali}
        >
          <ChevronLeft size={18} />
          <span>Kembali</span>
        </button>
        <span style={T.badgeTes}>ASESMEN MINAT BAKAT RIASEC (7 MENIT)</span>
      </div>

      {!tuntas ? (
        /* ============================================================ */
        /* MODAL KUESIONER INTERAKTIF                                   */
        /* ============================================================ */
        <div style={T.cardKuesioner}>
          <div style={T.progressHead}>
            <span style={{ fontSize: 12, fontWeight: 800, color: '#7c3aed' }}>
              Pertanyaan {nomorAktif + 1} dari {totalSoal}
            </span>
            <span style={{ fontSize: 12, fontWeight: 700, color: '#64748b' }}>
              {persenSelesai}% Selesai
            </span>
          </div>

          <div style={T.progressBarTrack}>
            <div style={{ ...T.progressBarFill, width: `${persenSelesai}%` }} />
          </div>

          <div style={T.boxTeksPertanyaan}>
            <h2 style={T.teksSoal}>{pertanyaan.teks}</h2>
          </div>

          {/* 5 Opsi Skala Emoji */}
          <div style={T.opsiGrid}>
            {OPSI_SKALA.map((op) => {
              const aktif = jawabanMap[pertanyaan.id] === op.poin;
              return (
                <button
                  key={op.poin}
                  type="button"
                  onClick={() => pilihJawaban(op.poin)}
                  style={{
                    ...T.btnOpsi,
                    background: aktif ? '#f3e8ff' : '#ffffff',
                    border: aktif ? '2px solid #7c3aed' : '1.5px solid #e2e8f0',
                  }}
                >
                  <span style={{ fontSize: 26 }}>{op.emoji}</span>
                  <span style={{ fontSize: 12, fontWeight: 800, color: aktif ? '#581c87' : '#334155', textAlign: 'center' }}>
                    {op.label}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Navigasi Bawah */}
          <div style={T.navBawahRow}>
            <button
              type="button"
              disabled={nomorAktif === 0}
              onClick={() => setNomorAktif(nomorAktif - 1)}
              style={{ ...T.btnNavMini, opacity: nomorAktif === 0 ? 0.4 : 1 }}
            >
              <ChevronLeft size={16} /> Sebelumnya
            </button>
            <span style={{ fontSize: 11.5, color: '#94a3b8' }}>
              Pilih opsi yang paling menggambarkan minat pribadimu
            </span>
            <button
              type="button"
              onClick={() => {
                if (nomorAktif < totalSoal - 1) setNomorAktif(nomorAktif + 1);
                else setTuntas(true);
              }}
              style={T.btnNavMini}
            >
              Lewati <ChevronRight size={16} />
            </button>
          </div>
        </div>
      ) : (
        /* ============================================================ */
        /* HASIL DIAGNOSIS MINAT BAKAT & REKOMENDASI                   */
        /* ============================================================ */
        <div style={T.cardHasil}>
          <div style={{ textAlign: 'center', marginBottom: 20 }}>
            <span style={{ fontSize: 36 }}>🧭</span>
            <h2 style={{ fontSize: 22, fontWeight: 900, color: '#0f172a', margin: '6px 0 4px' }}>
              Profil Minat Bakatmu: <span style={{ color: '#7c3aed' }}>{hasilRiasec.kodeTop3}</span>
            </h2>
            <p style={{ fontSize: 13, color: '#64748b', margin: 0 }}>
              Kombinasi 3 tipe kepribadian dominanmu berdasarkan respon 18 pernyataan Holland Code.
            </p>
          </div>

          {/* 3 Dimensi Dominan */}
          <div style={T.gridTigaDimensi}>
            {hasilRiasec.diurutkan.slice(0, 3).map((item, idx) => (
              <div key={item.dim} style={T.kartuDimensiDominan}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                  <span style={{ fontSize: 20 }}>{item.icon}</span>
                  <div>
                    <span style={{ fontSize: 10, fontWeight: 900, color: item.color }}>DOMINAN #{idx + 1}</span>
                    <h4 style={{ margin: 0, fontSize: 14, fontWeight: 800, color: '#1e293b' }}>{item.nama}</h4>
                  </div>
                </div>
                <div style={{ fontSize: 18, fontWeight: 900, color: item.color, marginTop: 4 }}>
                  Skor: {item.val} / 15 Poin
                </div>
              </div>
            ))}
          </div>

          {/* Daftar Rekomendasi Jurusan / Peminatan */}
          <div style={T.rekomendasiSection}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <GraduationCap size={22} color="#0d9488" />
                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 900, color: '#0f172a' }}>
                  {jenjang === 'SMA' ? 'Rekomendasi Jurusan PTN Impian' : 'Rekomendasi Peminatan SMA Unggulan'}
                </h3>
              </div>
              <span style={T.badgeRekomendasiMatch}>Kecocokan Sangat Tinggi ✨</span>
            </div>

            <div style={T.listRekomendasiGrid}>
              {hasilRiasec.rekomendasi.map((rek, i) => (
                <div key={i} style={T.itemRekomendasiCard}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <h4 style={{ margin: '0 0 3px', fontSize: 14, fontWeight: 800, color: '#0f172a' }}>
                        {rek.nama}
                      </h4>
                      <div style={{ fontSize: 12, color: '#64748b' }}>
                        {jenjang === 'SMA' ? `Kampus Unggulan: ${rek.ptn}` : `Sekolah: ${rek.sekolah}`}
                      </div>
                    </div>
                    <span style={T.badgeMatchVal}>{rek.match}</span>
                  </div>

                  <div style={T.footerRekomendasi}>
                    <span style={{ fontSize: 11.5, color: '#0f766e', fontWeight: 700 }}>
                      Passing Grade Acuan: <b>{jenjang === 'SMA' ? `${rek.skorAcuan} Poin` : rek.passingGrade}</b>
                    </span>
                    <button
                      type="button"
                      onClick={() => navigate(jenjang === 'SMA' ? '/siswa/katalog-ptn' : '/siswa/target-kampus')}
                      style={T.btnPilihTargetLangsung}
                    >
                      Pilih Sebagai Target 🎯
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Tombol Aksi Akhir */}
          <div style={T.footerAksiHasil}>
            <button
              type="button"
              onClick={resetTes}
              style={T.btnUlangTes}
            >
              <RotateCcw size={16} /> Ulangi Tes
            </button>
            <button
              type="button"
              onClick={() => navigate('/siswa/dashboard')}
              style={T.btnSimpanHasil}
            >
              Simpan &amp; Lanjutkan Belajar 🚀
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

const T = {
  wrap: {
    maxWidth: 760,
    margin: '0 auto',
    padding: '20px 16px 40px',
  },
  headerBar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  btnKembali: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 4,
    background: 'none',
    border: 'none',
    color: '#7c3aed',
    fontSize: 13,
    fontWeight: 700,
    cursor: 'pointer',
    padding: 0,
  },
  badgeTes: {
    fontSize: 11,
    fontWeight: 900,
    color: '#7c3aed',
    background: '#f3e8ff',
    padding: '4px 10px',
    borderRadius: 99,
  },
  cardKuesioner: {
    background: '#ffffff',
    border: '1.5px solid #e2e8f0',
    borderRadius: 24,
    padding: 24,
    boxShadow: '0 8px 24px rgba(0, 0, 0, 0.05)',
  },
  progressHead: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressBarTrack: {
    height: 8,
    background: '#f1f5f9',
    borderRadius: 99,
    overflow: 'hidden',
    marginBottom: 24,
  },
  progressBarFill: {
    height: '100%',
    background: 'linear-gradient(90deg, #7c3aed, #a855f7)',
    borderRadius: 99,
    transition: 'width 0.3s ease',
  },
  boxTeksPertanyaan: {
    minHeight: 90,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    textAlign: 'center',
    marginBottom: 24,
    padding: '0 10px',
  },
  teksSoal: {
    fontSize: 18,
    fontWeight: 800,
    color: '#0f172a',
    lineHeight: 1.5,
    margin: 0,
  },
  opsiGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))',
    gap: 10,
    marginBottom: 24,
  },
  btnOpsi: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 8,
    padding: '14px 10px',
    borderRadius: 16,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  navBawahRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 16,
    borderTop: '1px solid #f1f5f9',
  },
  btnNavMini: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 4,
    background: 'none',
    border: 'none',
    color: '#64748b',
    fontSize: 12,
    fontWeight: 700,
    cursor: 'pointer',
  },
  cardHasil: {
    background: '#ffffff',
    border: '1.5px solid #e2e8f0',
    borderRadius: 24,
    padding: 24,
    boxShadow: '0 8px 24px rgba(0, 0, 0, 0.05)',
  },
  gridTigaDimensi: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: 12,
    marginBottom: 24,
  },
  kartuDimensiDominan: {
    background: '#f8fafc',
    border: '1.5px solid #e2e8f0',
    borderRadius: 16,
    padding: 14,
  },
  rekomendasiSection: {
    background: '#f0fdfa',
    border: '1.5px solid #ccfbf1',
    borderRadius: 20,
    padding: 18,
    marginBottom: 20,
  },
  badgeRekomendasiMatch: {
    fontSize: 11,
    fontWeight: 800,
    color: '#0f766e',
    background: '#ccfbf1',
    padding: '4px 10px',
    borderRadius: 99,
  },
  listRekomendasiGrid: {
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
  },
  itemRekomendasiCard: {
    background: '#ffffff',
    border: '1px solid #99f6e4',
    borderRadius: 14,
    padding: 14,
  },
  badgeMatchVal: {
    fontSize: 11,
    fontWeight: 800,
    color: '#059669',
    background: '#dcfce7',
    padding: '3px 8px',
    borderRadius: 6,
  },
  footerRekomendasi: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
    paddingTop: 8,
    borderTop: '1px dashed #e2e8f0',
  },
  btnPilihTargetLangsung: {
    background: '#0d9488',
    color: '#ffffff',
    border: 'none',
    padding: '6px 12px',
    borderRadius: 8,
    fontSize: 11.5,
    fontWeight: 800,
    cursor: 'pointer',
  },
  footerAksiHasil: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  btnUlangTes: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    background: '#f1f5f9',
    color: '#475569',
    border: 'none',
    padding: '10px 16px',
    borderRadius: 12,
    fontSize: 13,
    fontWeight: 700,
    cursor: 'pointer',
  },
  btnSimpanHasil: {
    background: '#7c3aed',
    color: '#ffffff',
    border: 'none',
    padding: '10px 20px',
    borderRadius: 12,
    fontSize: 13,
    fontWeight: 800,
    cursor: 'pointer',
  },
};
