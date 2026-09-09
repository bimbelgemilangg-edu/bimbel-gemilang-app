// src/pages/admin/DashboardAnalisis.jsx
// ============================================================
// Dashboard Analisis -- grafik buat admin liat gambaran besar: siapa
// yang aktif latihan, rata-rata XP/skor per kelas, dan daftar
// pemegang skor tertinggi. Beda dari Leaderboard siswa (yang cuma
// nunjukin XP mingguan per kelas orang itu sendiri) -- ini pandangan
// LINTAS SEMUA KELAS buat admin.
// ============================================================

import React, { useState, useEffect, useMemo } from 'react';
import { db } from '../../firebase';
import { collection, getDocs } from 'firebase/firestore';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { TrendingUp, Users, Trophy, RefreshCw } from 'lucide-react';

const WARNA_BAR = ['#5B2ECC', '#0d9488', '#f59e0b', '#dc2626', '#0891b2', '#16a34a', '#9333ea', '#e11d48'];

export default function DashboardAnalisis() {
  const [loading, setLoading] = useState(true);
  const [dataKelas, setDataKelas] = useState([]); // [{kelas, jumlahSiswa, rataXp, aktifHariIni}]
  const [topSiswa, setTopSiswa] = useState([]); // [{nama, kelas, xp}]
  const [ringkasan, setRingkasan] = useState({ totalSiswa: 0, aktifHariIni: 0, totalTryOutSelesai: 0 });

  const muatData = async () => {
    setLoading(true);
    try {
      const hariIniStr = new Date().toISOString().slice(0, 10);

      const [snapSiswa, snapProgres, snapTryOutSesi] = await Promise.all([
        getDocs(collection(db, 'students')),
        getDocs(collection(db, 'siswa_progress')),
        getDocs(collection(db, 'tryout_sesi')),
      ]);

      const siswaMap = {}; // studentId -> {nama, kelasSekolah}
      snapSiswa.forEach((d) => {
        const s = d.data();
        if (s.studentId) siswaMap[s.studentId] = { nama: s.nama || '(tanpa nama)', kelasSekolah: s.kelasSekolah || 'Belum diatur', isBlocked: !!s.isBlocked };
      });

      const progresMap = {}; // studentId -> data
      snapProgres.forEach((d) => { progresMap[d.id] = d.data(); });

      let totalTryOutSelesai = 0;
      snapTryOutSesi.forEach((d) => { if (d.data().status === 'selesai') totalTryOutSelesai += 1; });

      // Kelompokkan per kelas
      const perKelas = {};
      let aktifHariIniTotal = 0;
      const daftarTop = [];

      Object.entries(siswaMap).forEach(([studentId, info]) => {
        if (info.isBlocked) return;
        const kelas = info.kelasSekolah;
        const prog = progresMap[studentId] || {};
        const xp = prog.xp || 0;
        const aktifHariIni = prog.soalHariIniTanggal === hariIniStr;

        if (!perKelas[kelas]) perKelas[kelas] = { kelas, jumlahSiswa: 0, totalXp: 0, aktifHariIni: 0 };
        perKelas[kelas].jumlahSiswa += 1;
        perKelas[kelas].totalXp += xp;
        if (aktifHariIni) { perKelas[kelas].aktifHariIni += 1; aktifHariIniTotal += 1; }

        daftarTop.push({ nama: info.nama, kelas, xp });
      });

      const hasilKelas = Object.values(perKelas)
        .map((k) => ({ ...k, rataXp: k.jumlahSiswa > 0 ? Math.round(k.totalXp / k.jumlahSiswa) : 0 }))
        .sort((a, b) => b.rataXp - a.rataXp);

      daftarTop.sort((a, b) => b.xp - a.xp);

      setDataKelas(hasilKelas);
      setTopSiswa(daftarTop.slice(0, 10));
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

  if (loading) {
    return <div style={{ padding: 40, textAlign: 'center', color: '#94a3b8' }}>Memuat data analisis...</div>;
  }

  return (
    <div style={{ padding: 24, maxWidth: 1100, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: '#1e293b', margin: 0 }}>📊 Dashboard Analisis</h1>
          <p style={{ color: '#6b7280', fontSize: 13, marginTop: 4 }}>Gambaran keaktifan & performa siswa lintas kelas.</p>
        </div>
        <button onClick={muatData} style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#5B2ECC', color: 'white', border: 'none', borderRadius: 10, padding: '9px 16px', fontWeight: 700, fontSize: 12.5, cursor: 'pointer' }}>
          <RefreshCw size={14} /> Muat Ulang
        </button>
      </div>

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
  );
}