// src/pages/admin/DashboardAnalisis.jsx
// ============================================================
// Dashboard Analisis -- grafik buat admin liat gambaran besar: siapa
// yang aktif latihan, rata-rata XP/skor per kelas, streak harian
// (siapa yang beneran konsisten tiap hari), dan daftar pemegang skor
// tertinggi.
//
// 🔥 BUG SERIUS DIBENERIN: versi sebelumnya TIDAK dibungkus <SidebarAdmin />
// sama sekali -- beda dari SEMUA halaman admin lain (Dashboard.jsx dkk),
// yang masing-masing merender sidebar-nya sendiri (bukan otomatis dari
// routing). Akibatnya: sidebar hilang total pas buka halaman ini, admin
// bingung mau pindah menu, dan layout-nya juga jadi salah (gak ada
// marginLeft buat kasih ruang ke sidebar) -- itu juga penyebab scroll-nya
// kerasa aneh/gak bisa. Sekarang pakai pola wrapper PERSIS sama kayak
// Dashboard.jsx yang lain.
// ============================================================

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../../firebase';
import { collection, getDocs } from 'firebase/firestore';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { TrendingUp, Users, Trophy, RefreshCw, Flame, ShieldAlert } from 'lucide-react';
import SidebarAdmin from '../../components/SidebarAdmin';

const WARNA_BAR = ['#5B2ECC', '#0d9488', '#f59e0b', '#dc2626', '#0891b2', '#16a34a', '#9333ea', '#e11d48'];

// 🔥 BARU: kelompokkan siswa berdasarkan panjang streak-nya -- ini yang
// jawab pertanyaan "anak-anak beneran ngerjain tiap hari gak" secara
// LANGSUNG. Streak 0 = udah putus/gak pernah mulai. Streak tinggi =
// konsisten beneran tiap hari.
const KELOMPOK_STREAK = [
  { label: '0 hari (belum/putus)', min: 0, max: 0, warna: '#dc2626' },
  { label: '1-2 hari', min: 1, max: 2, warna: '#f59e0b' },
  { label: '3-6 hari', min: 3, max: 6, warna: '#eab308' },
  { label: '7-13 hari', min: 7, max: 13, warna: '#22c55e' },
  { label: '14-29 hari', min: 14, max: 29, warna: '#0d9488' },
  { label: '30+ hari', min: 30, max: Infinity, warna: '#5B2ECC' },
];

export default function DashboardAnalisis() {
  const navigate = useNavigate();
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);
  const [loading, setLoading] = useState(true);
  const [dataKelas, setDataKelas] = useState([]);
  const [topSiswa, setTopSiswa] = useState([]);
  const [dataStreak, setDataStreak] = useState([]);
  const [siswaStreakTinggi, setSiswaStreakTinggi] = useState([]); // buat daftar "paling konsisten"
  const [ringkasan, setRingkasan] = useState({ totalSiswa: 0, aktifHariIni: 0, totalTryOutSelesai: 0 });

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 1024);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const muatData = async () => {
    setLoading(true);
    try {
      const hariIniStr = new Date().toISOString().slice(0, 10);

      const [snapSiswa, snapProgres, snapTryOutSesi] = await Promise.all([
        getDocs(collection(db, 'students')),
        getDocs(collection(db, 'siswa_progress')),
        getDocs(collection(db, 'tryout_sesi')),
      ]);

      const siswaMap = {};
      snapSiswa.forEach((d) => {
        const s = d.data();
        if (s.studentId) siswaMap[s.studentId] = { nama: s.nama || '(tanpa nama)', kelasSekolah: s.kelasSekolah || 'Belum diatur', isBlocked: !!s.isBlocked };
      });

      const progresMap = {};
      snapProgres.forEach((d) => { progresMap[d.id] = d.data(); });

      let totalTryOutSelesai = 0;
      snapTryOutSesi.forEach((d) => { if (d.data().status === 'selesai') totalTryOutSelesai += 1; });

      const perKelas = {};
      let aktifHariIniTotal = 0;
      const daftarTop = [];
      const hitunganStreak = KELOMPOK_STREAK.map((k) => ({ ...k, jumlah: 0 }));
      const daftarStreakTinggi = [];

      Object.entries(siswaMap).forEach(([studentId, info]) => {
        if (info.isBlocked) return;
        const kelas = info.kelasSekolah;
        const prog = progresMap[studentId] || {};
        const xp = prog.xp || 0;
        const streak = prog.streak || 0;
        const aktifHariIni = prog.soalHariIniTanggal === hariIniStr;

        if (!perKelas[kelas]) perKelas[kelas] = { kelas, jumlahSiswa: 0, totalXp: 0, aktifHariIni: 0 };
        perKelas[kelas].jumlahSiswa += 1;
        perKelas[kelas].totalXp += xp;
        if (aktifHariIni) { perKelas[kelas].aktifHariIni += 1; aktifHariIniTotal += 1; }

        daftarTop.push({ nama: info.nama, kelas, xp });

        // Masukkan ke kelompok streak yang sesuai
        const kelompok = hitunganStreak.find((k) => streak >= k.min && streak <= k.max);
        if (kelompok) kelompok.jumlah += 1;

        if (streak >= 3) daftarStreakTinggi.push({ nama: info.nama, kelas, streak, aktifHariIni });
      });

      const hasilKelas = Object.values(perKelas)
        .map((k) => ({ ...k, rataXp: k.jumlahSiswa > 0 ? Math.round(k.totalXp / k.jumlahSiswa) : 0 }))
        .sort((a, b) => b.rataXp - a.rataXp);

      daftarTop.sort((a, b) => b.xp - a.xp);
      daftarStreakTinggi.sort((a, b) => b.streak - a.streak);

      setDataKelas(hasilKelas);
      setTopSiswa(daftarTop.slice(0, 10));
      setDataStreak(hitunganStreak);
      setSiswaStreakTinggi(daftarStreakTinggi.slice(0, 10));
      setRingkasan({
        totalSiswa: Object.keys(siswaMap).filter((id) => !siswaMap[id].isBlocked).length,
        aktifHariIni: aktifHariIniTotal,
        totalTryOutSelesai,
      });
    } catch (e) {
      console.error('Gagal muat dashboard analisis:', e);
    }
    setLoading(false);
  };

  useEffect(() => { muatData(); }, []);

  const wrapper = { display: 'flex', background: '#f8fafc', minHeight: '100vh' };
  const mainContent = { marginLeft: isMobile ? '0' : '260px', padding: isMobile ? '15px' : '30px', width: '100%', boxSizing: 'border-box', transition: '0.3s' };

  if (loading) {
    return (
      <div style={wrapper}>
        <SidebarAdmin />
        <div style={mainContent}>
          <div style={{ padding: 40, textAlign: 'center', color: '#94a3b8' }}>Memuat data analisis...</div>
        </div>
      </div>
    );
  }

  return (
    <div style={wrapper}>
      <SidebarAdmin />
      <div style={mainContent}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 10 }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: '#1e293b', margin: 0 }}>📊 Dashboard Analisis</h1>
            <p style={{ color: '#6b7280', fontSize: 13, marginTop: 4 }}>Gambaran keaktifan & performa siswa lintas kelas.</p>
          </div>
          <button onClick={muatData} style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#5B2ECC', color: 'white', border: 'none', borderRadius: 10, padding: '9px 16px', fontWeight: 700, fontSize: 12.5, cursor: 'pointer' }}>
            <RefreshCw size={14} /> Muat Ulang
          </button>
        </div>

        {/* 🔥 BARU: jalan pintas ke fitur "Cek Soal Nyasar" -- ini yang
            jawab kekhawatiran "gimana caranya tau soal yang dikirim ke
            siswa itu bener/gak nyasar jenjang-kelas". Fiturnya udah ada
            & lengkap di LatihanAktivitasPage.jsx (per-siswa, dikasih
            alasan kenapa dianggap nyasar) -- ini cuma jalan pintas
            biar gampang ketemu dari Dashboard Analisis, gak bikin
            ulang logikanya (biar gak dobel & gak resiko beda hasil). */}
        <button
          onClick={() => navigate('/admin/bank-soal/aktivitas-latihan')}
          style={{ display: 'flex', alignItems: 'center', gap: 14, width: '100%', textAlign: 'left', border: 'none', cursor: 'pointer', background: 'linear-gradient(135deg, #fff7ed, #ffedd5)', borderRadius: 16, padding: '16px 18px', marginBottom: 20 }}
        >
          <div style={{ width: 44, height: 44, borderRadius: 12, background: '#f59e0b', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <ShieldAlert size={22} color="white" />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 800, fontSize: 13.5, color: '#92400e' }}>🔍 Cek Soal Nyasar per Siswa</div>
            <div style={{ fontSize: 11.5, color: '#b45309', marginTop: 2 }}>
              Lihat soal yang PERNAH dikerjakan/dikirim ke siswa tertentu, lengkap sama alasan kalau ada yang gak sesuai jenjang/kelasnya. Sistem kelemahan tetap kerja diam-diam di sisi siswa -- ini murni buat kamu ngecek, siswa gak pernah lihat alasan ini.
            </div>
          </div>
          <span style={{ fontSize: 20, color: '#f59e0b' }}>→</span>
        </button>

        {/* Ringkasan angka */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14, marginBottom: 24 }}>
          <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: 14, padding: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#5B2ECC', marginBottom: 6 }}>
              <Users size={16} /> <span style={{ fontSize: 11.5, fontWeight: 700 }}>Total Siswa Aktif</span>
            </div>
            <div style={{ fontSize: 26, fontWeight: 800, color: '#1e293b' }}>{ringkasan.totalSiswa}</div>
          </div>
          <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: 14, padding: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#0d9488', marginBottom: 6 }}>
              <TrendingUp size={16} /> <span style={{ fontSize: 11.5, fontWeight: 700 }}>Latihan Hari Ini</span>
            </div>
            <div style={{ fontSize: 26, fontWeight: 800, color: '#1e293b' }}>
              {ringkasan.aktifHariIni} <span style={{ fontSize: 13, color: '#9ca3af', fontWeight: 600 }}>/ {ringkasan.totalSiswa} siswa</span>
            </div>
          </div>
          <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: 14, padding: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#f59e0b', marginBottom: 6 }}>
              <Trophy size={16} /> <span style={{ fontSize: 11.5, fontWeight: 700 }}>Try Out Selesai (semua)</span>
            </div>
            <div style={{ fontSize: 26, fontWeight: 800, color: '#1e293b' }}>{ringkasan.totalTryOutSelesai}</div>
          </div>
        </div>

        {/* 🔥 BARU: distribusi streak -- ini yang langsung jawab "anak-anak
            beneran ngerjain tiap hari gak". Streak 0 gede = banyak yang
            belum/udah putus, streak 7+ gede = banyak yang konsisten. */}
        <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: 16, padding: 20, marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <Flame size={16} color="#f59e0b" />
            <span style={{ fontWeight: 800, fontSize: 14, color: '#1e293b' }}>Distribusi Streak Harian</span>
          </div>
          <div style={{ fontSize: 11.5, color: '#9ca3af', marginBottom: 14 }}>Berapa banyak siswa yang beneran konsisten latihan tiap hari (bukan cuma sesekali).</div>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={dataStreak} margin={{ top: 4, right: 8, left: 0, bottom: 4 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="label" tick={{ fontSize: 10 }} angle={-15} textAnchor="end" height={50} />
              <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
              <Tooltip formatter={(value) => [value, 'Jumlah siswa']} />
              <Bar dataKey="jumlah" radius={[8, 8, 0, 0]}>
                {dataStreak.map((k, i) => <Cell key={i} fill={k.warna} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Daftar siswa paling konsisten */}
        <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: 16, padding: 20, marginBottom: 20 }}>
          <div style={{ fontWeight: 800, fontSize: 14, color: '#1e293b', marginBottom: 14 }}>🔥 Siswa Paling Konsisten (streak 3+ hari)</div>
          {siswaStreakTinggi.length === 0 ? (
            <div style={{ textAlign: 'center', color: '#94a3b8', fontSize: 13, padding: 20 }}>Belum ada siswa dengan streak 3 hari atau lebih.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {siswaStreakTinggi.map((s, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '9px 12px', borderRadius: 10, background: '#fff7ed' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontWeight: 800, color: '#ea580c', fontSize: 14, minWidth: 50 }}>
                    <Flame size={14} /> {s.streak}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#1e293b' }}>{s.nama}</div>
                    <div style={{ fontSize: 11, color: '#9ca3af' }}>Kelas {s.kelas}</div>
                  </div>
                  <span style={{ fontSize: 10.5, fontWeight: 700, color: s.aktifHariIni ? '#16a34a' : '#dc2626', background: s.aktifHariIni ? '#f0fdf4' : '#fef2f2', padding: '3px 9px', borderRadius: 999 }}>
                    {s.aktifHariIni ? '✓ Sudah hari ini' : 'Belum hari ini'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Grafik rata-rata XP per kelas */}
        <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: 16, padding: 20, marginBottom: 20 }}>
          <div style={{ fontWeight: 800, fontSize: 14, color: '#1e293b', marginBottom: 4 }}>Rata-rata XP per Kelas</div>
          <div style={{ fontSize: 11.5, color: '#9ca3af', marginBottom: 14 }}>Makin tinggi batang, makin aktif rata-rata siswa di kelas itu latihan/try out.</div>
          {dataKelas.length === 0 ? (
            <div style={{ textAlign: 'center', color: '#94a3b8', fontSize: 13, padding: 30 }}>Belum ada data.</div>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={dataKelas} margin={{ top: 4, right: 8, left: 0, bottom: 4 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="kelas" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip formatter={(value, name) => [value, name === 'rataXp' ? 'Rata-rata XP' : name]} />
                <Bar dataKey="rataXp" radius={[8, 8, 0, 0]}>
                  {dataKelas.map((_, i) => <Cell key={i} fill={WARNA_BAR[i % WARNA_BAR.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Grafik jumlah aktif hari ini per kelas */}
        <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: 16, padding: 20, marginBottom: 20 }}>
          <div style={{ fontWeight: 800, fontSize: 14, color: '#1e293b', marginBottom: 4 }}>Siswa Latihan Hari Ini per Kelas</div>
          <div style={{ fontSize: 11.5, color: '#9ca3af', marginBottom: 14 }}>Kelas mana yang paling rajin latihan HARI INI.</div>
          {dataKelas.length === 0 ? (
            <div style={{ textAlign: 'center', color: '#94a3b8', fontSize: 13, padding: 30 }}>Belum ada data.</div>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={dataKelas} margin={{ top: 4, right: 8, left: 0, bottom: 4 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="kelas" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="aktifHariIni" fill="#0d9488" radius={[8, 8, 0, 0]} name="Aktif hari ini" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Top 10 pemegang skor (XP) lintas kelas */}
        <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: 16, padding: 20 }}>
          <div style={{ fontWeight: 800, fontSize: 14, color: '#1e293b', marginBottom: 14 }}>🏆 10 Pemegang XP Tertinggi (Lintas Kelas)</div>
          {topSiswa.length === 0 ? (
            <div style={{ textAlign: 'center', color: '#94a3b8', fontSize: 13, padding: 20 }}>Belum ada data.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {topSiswa.map((s, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '9px 12px', borderRadius: 10, background: i < 3 ? '#f5f3ff' : '#f8fafc' }}>
                  <div style={{ width: 22, textAlign: 'center', fontWeight: 800, fontSize: 13, color: i < 3 ? '#5B2ECC' : '#94a3b8' }}>{i + 1}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#1e293b' }}>{s.nama}</div>
                    <div style={{ fontSize: 11, color: '#9ca3af' }}>Kelas {s.kelas}</div>
                  </div>
                  <div style={{ fontWeight: 800, color: '#5B2ECC', fontSize: 13 }}>{s.xp} XP</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}