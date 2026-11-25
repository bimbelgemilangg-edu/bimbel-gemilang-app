// src/pages/student/StatistikBelajarPage.jsx
// ============================================================
// Halaman Statistik Belajar Siswa (Terintegrasi Otomatis dengan Menu Jalur)
// - Perkembangan Skor Tryout & Latihan Menu Jalur (Grafik Garis Tren Nilai)
// - Skor per Subtes Terakhir + Indikator Panah Fluktuasi
// - Kalender Latihan (Heatmap 12 Minggu ala GitHub)
// - Analisis Minggu Ini vs Minggu Lalu (4 Metrik Kunci)
// - Penguasaan & Latihan per Subtes Murni (Real-Time dari Bank Soal & Menu Jalur)
// ============================================================
import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  TrendingUp,
  TrendingDown,
  Calendar,
  Flame,
  Award,
  Clock,
  ArrowRight,
  ChevronLeft,
  Target,
  Sparkles,
  Zap,
  BookOpen,
} from 'lucide-react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../firebase';
import { useProfilSiswa } from '../../utils/profilSiswa';
import { deteksiTingkatSiswa } from '../../utils/tingkatSiswa';
import {
  getSubtesLatihanList,
  hitungStatistikLatihanSiswa,
  bacaProgresLatihanSiswa,
} from '../../data/ambisLatihanBankSoal';

export default function StatistikBelajarPage() {
  const navigate = useNavigate();
  const profil = useProfilSiswa();
  const studentId = typeof localStorage !== 'undefined'
    ? localStorage.getItem('studentId') || localStorage.getItem('studentNim') || ''
    : '';
  const studentDocId = typeof localStorage !== 'undefined'
    ? localStorage.getItem('studentDocId') || profil.docId || profil.id || ''
    : (profil.docId || profil.id || '');

  const [loading, setLoading] = useState(true);
  const [sesiList, setSesiList] = useState([]);

  // Deteksi jenjang siswa menggunakan deteksi tingkat resmi
  const infoTingkat = useMemo(() => deteksiTingkatSiswa(profil), [profil]);
  const jenjang = infoTingkat.jenjangBaku;

  // Muat riwayat sesi pengerjaan siswa (Try Out & Latihan Menu Jalur)
  useEffect(() => {
    let aktif = true;
    async function muatSesi() {
      if (!studentId && !studentDocId) {
        setLoading(false);
        return;
      }
      try {
        const q1 = studentId ? getDocs(query(collection(db, 'tryout_sesi'), where('studentId', '==', studentId))) : Promise.resolve({ docs: [] });
        const q2 = (studentDocId && studentDocId !== studentId) ? getDocs(query(collection(db, 'tryout_sesi'), where('studentId', '==', studentDocId))) : Promise.resolve({ docs: [] });
        const [snap1, snap2] = await Promise.all([q1, q2]);
        if (!aktif) return;

        const mapSesi = new Map();
        [...snap1.docs, ...snap2.docs].forEach((d) => {
          mapSesi.set(d.id, { id: d.id, ...d.data() });
        });

        // 🔗 Integrasi Otomatis dengan Menu Jalur: Baca riwayat sesi latihan dari localStorage
        const progresLatihan = bacaProgresLatihanSiswa(studentId);
        Object.entries(progresLatihan || {}).forEach(([kodeSt, stData]) => {
          (stData.riwayatSesi || []).forEach((sesiLog) => {
            const sid = sesiLog.sesiId || `jalur_${kodeSt}_${sesiLog.waktuSelesaiMs}`;
            if (!mapSesi.has(sid)) {
              mapSesi.set(sid, {
                id: sid,
                studentId,
                paketId: sesiLog.paketId,
                paketJudul: `${sesiLog.subtesKode || kodeSt} • ${sesiLog.mode || 'Latihan Jalur'}`,
                subtesKode: sesiLog.subtesKode || kodeSt,
                status: 'selesai',
                sumber: 'menu_jalur',
                totalSoal: sesiLog.totalSoal || 10,
                benarCount: sesiLog.benarCount || 0,
                totalSkorPersen: sesiLog.skorPersen || 0,
                durasiMenit: Math.max(1, Math.round((sesiLog.durasiDetik || 60) / 60)),
                waktuSelesaiMs: sesiLog.waktuSelesaiMs || Date.now(),
              });
            }
          });
        });

        const sesiSelesai = Array.from(mapSesi.values())
          .filter((s) => s.status === 'selesai')
          .sort((a, b) => {
            const ta = a.waktuSelesai?.toMillis ? a.waktuSelesai.toMillis() : (a.waktuSelesaiMs || 0);
            const tb = b.waktuSelesai?.toMillis ? b.waktuSelesai.toMillis() : (b.waktuSelesaiMs || 0);
            return ta - tb;
          });

        setSesiList(sesiSelesai);
      } catch (err) {
        console.error('Gagal memuat sesi statistik:', err);
      } finally {
        if (aktif) setLoading(false);
      }
    }
    muatSesi();
    return () => { aktif = false; };
  }, [studentId, studentDocId]);

  // 1. Data Tren Skor Tryout & Menu Jalur (Grafik Garis)
  const dataTrenSkor = useMemo(() => {
    if (!sesiList || sesiList.length === 0) {
      return [];
    }
    return sesiList.slice(-8).map((s, idx) => {
      let judul = s.paketJudul || s.judul || '';
      if (!judul) {
        judul = s.subtesKode ? `Latihan ${s.subtesKode}` : `Simulasi ${idx + 1}`;
      }
      return {
        label: judul.length > 14 ? judul.slice(0, 12) + '...' : judul,
        judulLengkap: judul,
        skor: Math.round(Number(s.totalSkorPersen) || 0),
        tanggal: s.waktuSelesaiMs ? new Date(s.waktuSelesaiMs).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }) : '',
      };
    });
  }, [sesiList]);

  // 2. Heatmap 12 Minggu Terakhir (12 kolom x 7 baris)
  const heatmapData = useMemo(() => {
    const mingguTotal = 12;
    const hariPerMinggu = 7;
    const data = [];
    const sekarang = new Date();
    // Cari hari Minggu terakhir atau hari ini
    const tanggalMap = new Map();

    sesiList.forEach((s) => {
      const ms = s.waktuSelesai?.toMillis ? s.waktuSelesai.toMillis() : (s.waktuSelesaiMs || 0);
      if (ms > 0) {
        const dStr = new Date(ms).toISOString().slice(0, 10);
        const count = s.totalSoal || (s.soalDinilaiIds || []).length || 12;
        tanggalMap.set(dStr, (tanggalMap.get(dStr) || 0) + count);
      }
    });

    for (let m = mingguTotal - 1; m >= 0; m--) {
      const kolomMinggu = [];
      for (let h = 0; h < hariPerMinggu; h++) {
        const d = new Date();
        const selisihHari = (m * 7) + (6 - h);
        d.setDate(sekarang.getDate() - selisihHari);
        const dStr = d.toISOString().slice(0, 10);
        const jumlahSoal = tanggalMap.get(dStr) || 0;
        kolomMinggu.push({
          tanggalStr: dStr,
          jumlahSoal,
          label: d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }),
        });
      }
      data.push(kolomMinggu);
    }
    return data;
  }, [sesiList]);

  // 3. Analisis Minggu Ini vs Minggu Lalu (4 Metrik)
  const komparasiMingguan = useMemo(() => {
    const sekarang = Date.now();
    const satuMingguMs = 7 * 24 * 60 * 60 * 1000;
    const duaMingguMs = 14 * 24 * 60 * 60 * 1000;

    const sesiMingguIni = sesiList.filter((s) => {
      const t = s.waktuSelesai?.toMillis ? s.waktuSelesai.toMillis() : (s.waktuSelesaiMs || 0);
      return sekarang - t <= satuMingguMs;
    });

    const sesiMingguLalu = sesiList.filter((s) => {
      const t = s.waktuSelesai?.toMillis ? s.waktuSelesai.toMillis() : (s.waktuSelesaiMs || 0);
      return sekarang - t > satuMingguMs && sekarang - t <= duaMingguMs;
    });

    // Metrik 1: Soal latihan
    const soalIni = sesiMingguIni.reduce((acc, s) => acc + (s.totalSoal || 12), 0);
    const soalLalu = sesiMingguLalu.reduce((acc, s) => acc + (s.totalSoal || 12), 0);

    // Metrik 2: Akurasi first attempt %
    const akurasiIni = sesiMingguIni.length
      ? Math.round(sesiMingguIni.reduce((acc, s) => acc + (Number(s.totalSkorPersen) || 0), 0) / sesiMingguIni.length)
      : (sesiList.length ? Math.round(Number(sesiList[sesiList.length - 1].totalSkorPersen) || 75) : 75);
    const akurasiLalu = sesiMingguLalu.length
      ? Math.round(sesiMingguLalu.reduce((acc, s) => acc + (Number(s.totalSkorPersen) || 0), 0) / sesiMingguLalu.length)
      : Math.max(50, akurasiIni - 5);

    // Metrik 3: Waktu belajar (menit)
    const waktuIni = sesiMingguIni.reduce((acc, s) => acc + (Number(s.durasiMenit) || 20), 0);
    const waktuLalu = sesiMingguLalu.reduce((acc, s) => acc + (Number(s.durasiMenit) || 20), 0);

    // Metrik 4: Hari aktif (x / 7)
    const hariAktifSet = new Set(sesiMingguIni.map((s) => {
      const ms = s.waktuSelesai?.toMillis ? s.waktuSelesai.toMillis() : s.waktuSelesaiMs;
      return ms ? new Date(ms).toISOString().slice(0, 10) : '';
    }).filter(Boolean));

    return {
      soalIni,
      soalLalu,
      akurasiIni,
      akurasiLalu,
      waktuIni,
      waktuLalu,
      hariAktif: hariAktifSet.size || (sesiMingguIni.length > 0 ? 1 : 0),
    };
  }, [sesiList]);

  // 4. Penguasaan per Subtes Murni (Dihitung Real-time dari Menu Jalur Sesuai Jenjang)
  const statistikSubtes = useMemo(() => {
    return hitungStatistikLatihanSiswa(studentId, jenjang);
  }, [studentId, jenjang, sesiList]);

  const daftarSubtes = useMemo(() => {
    const list = getSubtesLatihanList(jenjang);
    return list.map((st) => {
      const info = (statistikSubtes.rekapSubtes && statistikSubtes.rekapSubtes[st.kode]) || {
        totalBankSoal: 50,
        soalDikerjakan: 0,
        benarCount: 0,
        akurasiPersen: 0,
        levelPenguasaan: 'Perlu Pemantapan',
      };

      return {
        kode: st.kode,
        nama: st.nama,
        singkatan: st.singkatan,
        rumpun: st.rumpun || (jenjang === 'SMP' ? 'TKA SMP' : jenjang === 'SD' ? 'TKA SD' : 'SNPMB'),
        badgeWarna: st.badgeWarna || '#0d9488',
        borderWarna: st.borderWarna || '#ccfbf1',
        bgLight: st.bgLight || '#f0fdfa',
        emoji: st.emoji || '🎯',
        pool: Math.max(info.totalBankSoal, 10),
        selesai: info.soalDikerjakan,
        akurasi: info.akurasiPersen,
        levelPenguasaan: info.levelPenguasaan,
        trend: info.dilatihHariIni ? 'Dilatih Hari Ini ✨' : (info.soalDikerjakan > 0 ? `${info.soalDikerjakan} Soal Selesai` : 'Belum Mulai'),
      };
    });
  }, [jenjang, statistikSubtes]);

  return (
    <div style={S.container}>
      {/* Header Bar */}
      <div style={S.headerBar}>
        <button
          type="button"
          onClick={() => navigate('/siswa/dashboard')}
          style={S.btnKembali}
        >
          <ChevronLeft size={18} />
          <span>Kembali ke Beranda</span>
        </button>
        <div style={S.headerInfo}>
          <div style={S.badgeJenjang}>
            STATISTIK BELAJAR • {infoTingkat.isKelas12 ? 'UTBK-SNBT (SMA KELAS 12)' : (infoTingkat.isKelas9 ? 'TKA SMP (KELAS 9)' : (infoTingkat.isSmp ? 'EVALUASI SMP' : (infoTingkat.isSd ? 'EVALUASI SD' : 'EVALUASI SMA')))}
          </div>
          <h1 style={S.judulUtama}>Progres &amp; Analisis Belajar Personal</h1>
          <p style={S.subJudul}>
            Pantau pertumbuhan skor tryout, konsistensi kalender latihan, dan pemetaan kelemahan per subtes secara real-time.
          </p>
        </div>
      </div>

      {/* 🌟 BANNER INTEGRASI OTOMATIS DENGAN MENU JALUR */}
      <div style={{
        background: '#f0fdfa',
        border: '1.5px solid #99f6e4',
        borderRadius: 16,
        padding: '14px 18px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 12,
        boxShadow: '0 2px 6px rgba(13,148,136,0.04)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 38,
            height: 38,
            borderRadius: 10,
            background: '#ccfbf1',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 20,
          }}>
            🧭
          </div>
          <div>
            <div style={{ fontSize: 13.5, fontWeight: 800, color: '#0f766e' }}>
              Statistik Personal Terhubung Otomatis ke Menu Jalur
            </div>
            <div style={{ fontSize: 12, color: '#134e4a', marginTop: 2 }}>
              Setiap kali kamu menyelesaikan simulasi atau latihan di <b>Menu Jalur (Roadmap Belajar)</b>, skor, kalender, dan radar subtes di halaman ini akan bertambah secara real-time.
            </div>
          </div>
        </div>
        <button
          type="button"
          onClick={() => navigate((infoTingkat.isKelas12 || infoTingkat.isKelas9) ? '/siswa/roadmap' : '/siswa/latihan-harian')}
          style={{
            background: '#0d9488',
            color: '#ffffff',
            border: 'none',
            padding: '8px 16px',
            borderRadius: 10,
            fontSize: 12.5,
            fontWeight: 800,
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          <span>Buka Menu Jalur</span>
          <ArrowRight size={15} />
        </button>
      </div>

      {/* ============================================================ */}
      {/* 1. PERKEMBANGAN SKOR TRYOUT & SKOR SUBTES TERAKHIR          */}
      {/* ============================================================ */}
      <div style={S.cardPutih}>
        <div style={S.cardHeaderRow}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={S.iconBoxTeal}><TrendingUp size={20} color="#0d9488" /></div>
            <div>
              <h3 style={S.cardJudul}>Perkembangan Skor Tryout &amp; Menu Jalur</h3>
              <span style={S.cardSub}>Grafik tren peningkatan nilai kumulatif</span>
            </div>
          </div>
          <span style={S.badgeSkorAkhir}>
            {dataTrenSkor.length > 0 ? `Skor Terakhir: ${dataTrenSkor[dataTrenSkor.length - 1]?.skor || 0}%` : 'Belum Ada Skor'}
          </span>
        </div>

        {/* Visual Line Chart SVG Mini */}
        {dataTrenSkor.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '36px 16px', background: '#f8fafc', borderRadius: 14, border: '1.5px dashed #cbd5e1' }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>🎯</div>
            <div style={{ fontSize: 15, fontWeight: 800, color: '#0f172a', marginBottom: 4 }}>
              Belum Ada Riwayat Pengerjaan
            </div>
            <p style={{ fontSize: 13, color: '#64748b', maxWidth: 420, margin: '0 auto 16px', lineHeight: 1.5 }}>
              Grafik perkembangan skor ini otomatis merekam setiap kamu menyelesaikan simulasi atau latihan di <strong>Menu Jalur (Roadmap)</strong>.
            </p>
            <button
              type="button"
              onClick={() => navigate('/siswa/roadmap')}
              style={{
                background: '#0d9488',
                color: '#ffffff',
                border: 'none',
                padding: '9px 18px',
                borderRadius: 10,
                fontSize: 13,
                fontWeight: 800,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <span>Mulai Latihan di Menu Jalur</span>
              <ArrowRight size={15} />
            </button>
          </div>
        ) : (
          <div style={S.chartWrap}>
            <svg viewBox="0 0 500 140" style={{ width: '100%', height: 140, overflow: 'visible' }}>
              <defs>
                <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#0d9488" stopOpacity="0.3" />
                  <stop offset="100%" stopColor="#0d9488" stopOpacity="0.0" />
                </linearGradient>
              </defs>
              {/* Garis Grid Horizontal */}
              <line x1="20" y1="20" x2="480" y2="20" stroke="#f1f5f9" strokeWidth="1" />
              <line x1="20" y1="60" x2="480" y2="60" stroke="#f1f5f9" strokeWidth="1" />
              <line x1="20" y1="100" x2="480" y2="100" stroke="#f1f5f9" strokeWidth="1" />

              {/* Path Area */}
              {dataTrenSkor.length > 1 && (
                <path
                  d={dataTrenSkor.reduce((acc, pt, i) => {
                    const x = 40 + (i * (420 / (dataTrenSkor.length - 1)));
                    const y = 120 - ((pt.skor / 100) * 90);
                    return `${acc} ${i === 0 ? 'M' : 'L'} ${x} ${y}`;
                  }, '') + ` L ${40 + ((dataTrenSkor.length - 1) * (420 / (dataTrenSkor.length - 1)))} 130 L 40 130 Z`}
                  fill="url(#chartGradient)"
                />
              )}

              {/* Garis Utama */}
              {dataTrenSkor.length > 1 && (
                <path
                  d={dataTrenSkor.reduce((acc, pt, i) => {
                    const x = 40 + (i * (420 / (dataTrenSkor.length - 1)));
                    const y = 120 - ((pt.skor / 100) * 90);
                    return `${acc} ${i === 0 ? 'M' : 'L'} ${x} ${y}`;
                  }, '')}
                  fill="none"
                  stroke="#0d9488"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              )}

              {/* Titik Lingkaran & Label Angka */}
              {dataTrenSkor.map((pt, i) => {
                const x = dataTrenSkor.length === 1 ? 250 : 40 + (i * (420 / Math.max(1, dataTrenSkor.length - 1)));
                const y = 120 - ((pt.skor / 100) * 90);
                return (
                  <g key={i}>
                    <circle cx={x} cy={y} r="5.5" fill="#ffffff" stroke="#0d9488" strokeWidth="3" />
                    <text x={x} y={y - 12} textAnchor="middle" fontSize="11" fontWeight="800" fill="#0f766e">
                      {pt.skor}%
                    </text>
                    <text x={x} y="138" textAnchor="middle" fontSize="10" fill="#64748b">
                      {pt.label}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>
        )}
      </div>

      {/* ============================================================ */}
      {/* 2. KALENDER LATIHAN (HEATMAP 12 MINGGU)                      */}
      {/* ============================================================ */}
      <div style={S.cardPutih}>
        <div style={S.cardHeaderRow}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={S.iconBoxAmber}><Calendar size={20} color="#d97706" /></div>
            <div>
              <h3 style={S.cardJudul}>Kalender Latihan (12 Minggu Terakhir)</h3>
              <span style={S.cardSub}>Konsistensi pengerjaan soal setiap hari</span>
            </div>
          </div>
          <div style={S.heatLegend}>
            <span style={{ fontSize: 11, color: '#64748b' }}>Kurang</span>
            <span style={{ ...S.heatBox, background: '#f1f5f9' }} />
            <span style={{ ...S.heatBox, background: '#bbf7d0' }} />
            <span style={{ ...S.heatBox, background: '#34d399' }} />
            <span style={{ ...S.heatBox, background: '#059669' }} />
            <span style={{ fontSize: 11, color: '#64748b' }}>Lebih</span>
          </div>
        </div>

        {/* Heatmap Grid */}
        <div style={S.heatScrollWrap}>
          <div style={S.heatGrid}>
            {heatmapData.map((minggu, mIdx) => (
              <div key={mIdx} style={S.heatCol}>
                {minggu.map((hari, hIdx) => {
                  let bg = '#f1f5f9';
                  if (hari.jumlahSoal > 15) bg = '#059669';
                  else if (hari.jumlahSoal > 5) bg = '#34d399';
                  else if (hari.jumlahSoal > 0) bg = '#bbf7d0';

                  return (
                    <div
                      key={hIdx}
                      style={{ ...S.heatCell, background: bg }}
                      title={`${hari.label}: ${hari.jumlahSoal} butir soal`}
                    />
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ============================================================ */}
      {/* 3. MINGGU INI VS MINGGU LALU (4 METRIK KOMPARASI)            */}
      {/* ============================================================ */}
      <div style={S.cardPutih}>
        <div style={S.cardHeaderRow}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={S.iconBoxBlue}><Clock size={20} color="#2563eb" /></div>
            <div>
              <h3 style={S.cardJudul}>Minggu Ini vs Minggu Lalu</h3>
              <span style={S.cardSub}>Evaluasi produktivitas &amp; peningkatan efisiensi</span>
            </div>
          </div>
        </div>

        <div style={S.gridEmpatMetrik}>
          {/* Metrik 1: Soal Dikerjakan */}
          <div style={S.kartuMetrikItem}>
            <span style={S.labelMetrik}>Soal Latihan Selesai</span>
            <div style={S.valMetrik}>{komparasiMingguan.soalIni} Butir</div>
            <div style={{ ...S.subMetrik, color: komparasiMingguan.soalIni >= komparasiMingguan.soalLalu ? '#16a34a' : '#d97706' }}>
              {komparasiMingguan.soalIni >= komparasiMingguan.soalLalu ? '▲ Meningkat' : '▼ Berkurang'} vs {komparasiMingguan.soalLalu} minggu lalu
            </div>
          </div>

          {/* Metrik 2: Akurasi First Attempt */}
          <div style={S.kartuMetrikItem}>
            <span style={S.labelMetrik}>Akurasi Jawaban Benar</span>
            <div style={S.valMetrik}>{komparasiMingguan.akurasiIni}%</div>
            <div style={{ ...S.subMetrik, color: komparasiMingguan.akurasiIni >= komparasiMingguan.akurasiLalu ? '#16a34a' : '#d97706' }}>
              {komparasiMingguan.akurasiIni >= komparasiMingguan.akurasiLalu ? '▲ + ' : '▼ '}
              {Math.abs(komparasiMingguan.akurasiIni - komparasiMingguan.akurasiLalu)}% vs minggu lalu
            </div>
          </div>

          {/* Metrik 3: Waktu Belajar */}
          <div style={S.kartuMetrikItem}>
            <span style={S.labelMetrik}>Total Durasi Latihan</span>
            <div style={S.valMetrik}>{komparasiMingguan.waktuIni} Menit</div>
            <div style={S.subMetrik}>
              Target sehat: 60-120 menit/minggu
            </div>
          </div>

          {/* Metrik 4: Hari Aktif */}
          <div style={S.kartuMetrikItem}>
            <span style={S.labelMetrik}>Hari Latihan Aktif</span>
            <div style={S.valMetrik}>{komparasiMingguan.hariAktif} / 7 Hari</div>
            <div style={{ ...S.subMetrik, color: komparasiMingguan.hariAktif >= 3 ? '#16a34a' : '#d97706' }}>
              {komparasiMingguan.hariAktif >= 3 ? 'Ritme Terjaga 🔥' : 'Tingkatkan Konsistensi'}
            </div>
          </div>
        </div>
      </div>

      {/* ============================================================ */}
      {/* 4. LATIHAN PER SUBTES (ZERO MIXING • SUBTES MURNI)           */}
      {/* ============================================================ */}
      <div style={S.cardPutih}>
        <div style={S.cardHeaderRow}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={S.iconBoxPurple}><Target size={20} color="#7c3aed" /></div>
            <div>
              <h3 style={S.cardJudul}>Penguasaan per Subtes Murni</h3>
              <span style={S.cardSub}>Setiap materi dilatih spesifik tanpa pencampuran</span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => navigate('/siswa/roadmap')}
            style={S.btnBukaRoadmapSemua}
          >
            Buka Roadmap Seluruh Unit ⚡
          </button>
        </div>

        <div style={S.listSubtesGrid}>
          {daftarSubtes.map((st) => (
            <div key={st.kode} style={S.cardSubtesItem}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{
                    width: 38,
                    height: 38,
                    borderRadius: 10,
                    background: st.bgLight,
                    border: `1.5px solid ${st.borderWarna}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 18,
                  }}>
                    {st.emoji}
                  </div>
                  <div>
                    <span style={{ fontSize: 10.5, fontWeight: 800, color: st.badgeWarna }}>{st.rumpun} • {st.singkatan}</span>
                    <h4 style={S.namaSubtesTeks}>{st.nama}</h4>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ ...S.skorSubtesTeks, color: st.badgeWarna }}>{st.akurasi}%</div>
                  <span style={{
                    fontSize: 10.5,
                    fontWeight: 800,
                    color: st.levelPenguasaan === 'Tinggi' ? '#16a34a' : st.levelPenguasaan === 'Sedang' ? '#d97706' : '#64748b',
                  }}>
                    {st.levelPenguasaan}
                  </span>
                </div>
              </div>

              {/* Progress Bar Soal Terlatih */}
              <div style={S.progressSubtesTrack}>
                <div
                  style={{
                    ...S.progressSubtesFill,
                    background: st.badgeWarna,
                    width: `${Math.min(100, Math.round((st.selesai / Math.max(1, st.pool)) * 100))}%`,
                  }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 }}>
                <span style={{ fontSize: 11.5, color: '#64748b', fontWeight: 600 }}>
                  {st.selesai} dari {st.pool} butir terlatih
                </span>
                <button
                  type="button"
                  onClick={() => navigate('/siswa/roadmap')}
                  style={{
                    ...S.btnLatihSubtesAksi,
                    color: st.badgeWarna,
                    borderColor: st.borderWarna,
                    background: st.bgLight,
                  }}
                >
                  Latih di Menu Jalur ⚡
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

const S = {
  container: {
    maxWidth: 920,
    margin: '0 auto',
    padding: '20px 16px 40px',
    display: 'flex',
    flexDirection: 'column',
    gap: 18,
  },
  headerBar: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  },
  btnKembali: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    background: 'none',
    border: 'none',
    color: '#0d9488',
    fontSize: 13,
    fontWeight: 700,
    cursor: 'pointer',
    padding: 0,
    alignSelf: 'flex-start',
  },
  headerInfo: {
    marginTop: 4,
  },
  badgeJenjang: {
    fontSize: 10.5,
    fontWeight: 900,
    color: '#0d9488',
    letterSpacing: 0.5,
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
  cardPutih: {
    background: '#ffffff',
    border: '1.5px solid #e2e8f0',
    borderRadius: 20,
    padding: 20,
    boxShadow: '0 4px 16px rgba(0, 0, 0, 0.04)',
  },
  cardHeaderRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 16,
  },
  cardJudul: {
    margin: 0,
    fontSize: 16,
    fontWeight: 900,
    color: '#0f172a',
  },
  cardSub: {
    fontSize: 12,
    color: '#64748b',
  },
  iconBoxTeal: {
    width: 38,
    height: 38,
    borderRadius: 12,
    background: '#ccfbf1',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBoxAmber: {
    width: 38,
    height: 38,
    borderRadius: 12,
    background: '#fef3c7',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBoxBlue: {
    width: 38,
    height: 38,
    borderRadius: 12,
    background: '#dbeafe',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBoxPurple: {
    width: 38,
    height: 38,
    borderRadius: 12,
    background: '#ede9fe',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeSkorAkhir: {
    background: '#f0fdf4',
    border: '1px solid #bbf7d0',
    color: '#15803d',
    padding: '4px 12px',
    borderRadius: 99,
    fontSize: 12,
    fontWeight: 800,
  },
  chartWrap: {
    width: '100%',
    padding: '10px 0',
  },
  heatLegend: {
    display: 'flex',
    alignItems: 'center',
    gap: 4,
  },
  heatBox: {
    width: 12,
    height: 12,
    borderRadius: 3,
    display: 'inline-block',
  },
  heatScrollWrap: {
    overflowX: 'auto',
    paddingBottom: 4,
  },
  heatGrid: {
    display: 'flex',
    gap: 5,
    minWidth: 420,
  },
  heatCol: {
    display: 'flex',
    flexDirection: 'column',
    gap: 5,
  },
  heatCell: {
    width: 15,
    height: 15,
    borderRadius: 3.5,
    transition: 'all 0.2s ease',
  },
  gridEmpatMetrik: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
    gap: 12,
  },
  kartuMetrikItem: {
    background: '#f8fafc',
    border: '1px solid #e2e8f0',
    borderRadius: 14,
    padding: 14,
  },
  labelMetrik: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: 700,
  },
  valMetrik: {
    fontSize: 20,
    fontWeight: 900,
    color: '#0f172a',
    margin: '4px 0 2px',
  },
  subMetrik: {
    fontSize: 11,
    fontWeight: 700,
    color: '#64748b',
  },
  btnBukaRoadmapSemua: {
    background: '#f0fdfa',
    border: '1.5px solid #ccfbf1',
    color: '#0f766e',
    padding: '6px 14px',
    borderRadius: 10,
    fontSize: 12,
    fontWeight: 800,
    cursor: 'pointer',
  },
  listSubtesGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
    gap: 14,
  },
  cardSubtesItem: {
    background: '#f8fafc',
    border: '1.5px solid #f1f5f9',
    borderRadius: 16,
    padding: 14,
  },
  badgeKodeSubtes: {
    fontSize: 10,
    fontWeight: 900,
    color: '#0d9488',
    background: '#ccfbf1',
    padding: '2px 6px',
    borderRadius: 6,
  },
  namaSubtesTeks: {
    margin: '4px 0 0',
    fontSize: 13,
    fontWeight: 800,
    color: '#1e293b',
  },
  skorSubtesTeks: {
    fontSize: 16,
    fontWeight: 900,
    color: '#0f172a',
  },
  progressSubtesTrack: {
    height: 6,
    background: '#e2e8f0',
    borderRadius: 99,
    overflow: 'hidden',
    marginTop: 8,
  },
  progressSubtesFill: {
    height: '100%',
    background: '#0d9488',
    borderRadius: 99,
  },
  btnLatihSubtesAksi: {
    background: '#0d9488',
    color: '#ffffff',
    border: 'none',
    padding: '5px 12px',
    borderRadius: 8,
    fontSize: 11,
    fontWeight: 800,
    cursor: 'pointer',
  },
};
