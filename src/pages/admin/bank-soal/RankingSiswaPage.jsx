// src/pages/admin/bank-soal/RankingSiswaPage.jsx
// ============================================================
// RANKING SISWA per JENJANG + KELAS (Admin)
// ============================================================
// Kebutuhan: admin mau lihat ranking XP siswa per kelas spesifik
// (mis. "9 SMP" doang, bukan digabung sama kelas lain) buat kebutuhan
// meranking atau pembagian kelompok belajar -- beda dari Leaderboard
// siswa (yang liganya MINGGUAN & di-reset tiap Senin, dibagi lagi ke
// kelompok ~10 orang per liga). Di sini rankingnya XP TOTAL (akumulasi
// dari awal, field siswa_progress.xp -- field yang SAMA dipakai
// Dashboard Analisis & Aktivitas Latihan), jadi cocok buat gambaran
// performa jangka panjang, bukan cuma minggu berjalan.
//
// Ada tombol download ke Excel (pakai lib `xlsx`, dependency yang
// sudah dipakai di Kelola Siswa) -- hasil unduhan NGIKUTIN filter
// jenjang + kelas yang lagi aktif di layar, biar admin bisa langsung
// pakai file itu buat bikin kelompok/kelas baru.
//
// Siswa yang isBlocked (nunggak/nonaktif) SENGAJA tidak dimasukkan,
// konsisten sama Dashboard Analisis & Leaderboard siswa -- kalau nanti
// ternyata admin butuh siswa nonaktif juga ikut di-ranking buat
// pembagian kelompok, ini tinggal dilonggarkan di satu baris (lihat
// muatData di bawah).
// ============================================================

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import SidebarAdmin from '../../../components/SidebarAdmin';
import { db } from '../../../firebase';
import { collection, getDocs } from 'firebase/firestore';
import * as XLSX from 'xlsx';
import { Trophy, RefreshCw, Download, Flame, Users } from 'lucide-react';
import { ekstrakAngkaKelas } from '../../../utils/aksesKontenSiswa';

const URUTAN_JENJANG = ['SD', 'SMP', 'SMA'];

function formatTanggal(tgl) {
  if (!tgl) return '-';
  try {
    return new Date(tgl).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
  } catch {
    return tgl;
  }
}

export default function RankingSiswaPage() {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);
  const [loading, setLoading] = useState(true);
  const [semuaSiswa, setSemuaSiswa] = useState([]); // gabungan students + siswa_progress, sudah bersih dari yang diblokir
  const [filterJenjang, setFilterJenjang] = useState('');
  const [filterKelas, setFilterKelas] = useState('semua'); // 'semua' = semua kelas dalam jenjang itu
  const [pesan, setPesan] = useState('');

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 1024);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const muatData = useCallback(async () => {
    setLoading(true);
    try {
      const [snapSiswa, snapProgres] = await Promise.all([
        getDocs(collection(db, 'students')),
        getDocs(collection(db, 'siswa_progress')),
      ]);

      const progresMap = {};
      snapProgres.forEach((d) => { progresMap[d.id] = d.data(); });

      const daftar = [];
      snapSiswa.forEach((d) => {
        const s = d.data();
        if (!s.studentId || s.isBlocked) return; // siswa nunggak/nonaktif tidak diranking
        const prog = progresMap[s.studentId] || {};
        daftar.push({
          studentId: s.studentId,
          nama: s.nama || '(tanpa nama)',
          kelasSekolah: s.kelasSekolah || 'Belum diatur',
          jenjang: s.jenjang || '-',
          xp: prog.xp || 0,
          streak: prog.streak || 0,
          lastActiveDate: prog.lastActiveDate || null,
        });
      });

      daftar.sort((a, b) => b.xp - a.xp);
      setSemuaSiswa(daftar);

      // Set jenjang default begitu data pertama kali masuk (kalau
      // admin belum pernah pilih apa-apa) -- biar gak nongol kosong
      // pas pertama buka halaman. SD/SMP/SMA diprioritaskan duluan.
      setFilterJenjang((jenjangSekarang) => {
        if (jenjangSekarang) return jenjangSekarang;
        const jenjangTersedia = URUTAN_JENJANG.find((j) => daftar.some((s) => s.jenjang === j));
        return jenjangTersedia || daftar[0]?.jenjang || '';
      });
    } catch (e) {
      console.error('Gagal muat ranking siswa:', e);
    }
    setLoading(false);
  }, []);

  useEffect(() => { muatData(); }, [muatData]);

  // Daftar jenjang yang benar-benar ada datanya, SD-SMP-SMA dulu baru
  // sisanya (mis. "English") -- daripada urutan acak sesuai urutan
  // dokumen di Firestore yang gak jelas patokannya.
  const daftarJenjang = useMemo(() => {
    const adaData = new Set(semuaSiswa.map((s) => s.jenjang));
    const urutanUtama = URUTAN_JENJANG.filter((j) => adaData.has(j));
    const sisanya = [...adaData].filter((j) => !URUTAN_JENJANG.includes(j)).sort();
    return [...urutanUtama, ...sisanya];
  }, [semuaSiswa]);

  // Daftar kelas dalam jenjang yang lagi dipilih, diurutkan dari angka
  // kelas terkecil -- pakai ekstrakAngkaKelas yang SAMA dipakai di
  // aturan akses mapel (aksesKontenSiswa.js), biar konsisten dengan
  // cara sistem "membaca" format kelas di bagian lain.
  const daftarKelas = useMemo(() => {
    const kelasSet = new Set(
      semuaSiswa.filter((s) => s.jenjang === filterJenjang).map((s) => s.kelasSekolah)
    );
    return [...kelasSet].sort((a, b) => Number(ekstrakAngkaKelas(a) || 99) - Number(ekstrakAngkaKelas(b) || 99));
  }, [semuaSiswa, filterJenjang]);

  // Reset pilihan kelas ke "semua" tiap kali jenjang diganti, biar
  // gak nyangkut milih kelas dari jenjang sebelumnya yang gak ada di
  // jenjang baru.
  useEffect(() => { setFilterKelas('semua'); }, [filterJenjang]);

  const daftarTerfilter = useMemo(() => {
    return semuaSiswa
      .filter((s) => s.jenjang === filterJenjang)
      .filter((s) => filterKelas === 'semua' || s.kelasSekolah === filterKelas)
      .sort((a, b) => b.xp - a.xp);
  }, [semuaSiswa, filterJenjang, filterKelas]);

  const handleDownload = () => {
    if (daftarTerfilter.length === 0) {
      setPesan('⚠️ Tidak ada data untuk diunduh pada filter ini.');
      setTimeout(() => setPesan(''), 3000);
      return;
    }
    const exportData = daftarTerfilter.map((s, idx) => ({
      'Peringkat': idx + 1,
      'Nama': s.nama,
      'ID Siswa': s.studentId,
      'Kelas': s.kelasSekolah,
      'XP': s.xp,
      'Streak (hari)': s.streak,
      'Terakhir Aktif': formatTanggal(s.lastActiveDate),
    }));
    const ws = XLSX.utils.json_to_sheet(exportData);
    ws['!cols'] = [{ wch: 9 }, { wch: 24 }, { wch: 14 }, { wch: 12 }, { wch: 8 }, { wch: 13 }, { wch: 16 }];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Ranking');
    const labelKelas = (filterKelas === 'semua' ? filterJenjang : filterKelas).replace(/\s+/g, '');
    XLSX.writeFile(wb, `Ranking_${labelKelas || 'Siswa'}_${new Date().toISOString().split('T')[0]}.xlsx`);
    setPesan(`✅ ${exportData.length} data berhasil diunduh.`);
    setTimeout(() => setPesan(''), 3000);
  };

  const wrapper = { display: 'flex', background: '#f8fafc', minHeight: '100vh' };
  const mainContent = { marginLeft: isMobile ? '0' : '260px', padding: isMobile ? '15px' : '30px', width: '100%', boxSizing: 'border-box', transition: '0.3s' };
  const selectStyle = { padding: '9px 12px', borderRadius: 10, border: '1px solid #e5e7eb', fontSize: 12.5, fontWeight: 600, color: '#1e293b', background: 'white', cursor: 'pointer' };

  if (loading) {
    return (
      <div style={wrapper}>
        <SidebarAdmin />
        <div style={mainContent}>
          <div style={{ padding: 40, textAlign: 'center', color: '#94a3b8' }}>Memuat data ranking...</div>
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
            <h1 style={{ fontSize: 22, fontWeight: 800, color: '#1e293b', margin: 0 }}>🏆 Ranking Siswa</h1>
            <p style={{ color: '#6b7280', fontSize: 13, marginTop: 4 }}>Ranking XP total per jenjang & kelas -- buat kebutuhan penilaian atau pembagian kelompok.</p>
          </div>
          <button onClick={muatData} style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#5B2ECC', color: 'white', border: 'none', borderRadius: 10, padding: '9px 16px', fontWeight: 700, fontSize: 12.5, cursor: 'pointer' }}>
            <RefreshCw size={14} /> Muat Ulang
          </button>
        </div>

        {/* Filter jenjang + kelas + tombol download */}
        <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: 16, padding: 16, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <select value={filterJenjang} onChange={(e) => setFilterJenjang(e.target.value)} style={selectStyle}>
            {daftarJenjang.length === 0 && <option value="">Belum ada data</option>}
            {daftarJenjang.map((j) => <option key={j} value={j}>{j}</option>)}
          </select>

          <select value={filterKelas} onChange={(e) => setFilterKelas(e.target.value)} style={selectStyle}>
            <option value="semua">Semua kelas ({filterJenjang || '-'})</option>
            {daftarKelas.map((k) => <option key={k} value={k}>{k}</option>)}
          </select>

          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 12, color: '#6b7280', display: 'flex', alignItems: 'center', gap: 4 }}>
              <Users size={13} /> {daftarTerfilter.length} siswa
            </span>
            <button onClick={handleDownload} style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#0d9488', color: 'white', border: 'none', borderRadius: 10, padding: '9px 16px', fontWeight: 700, fontSize: 12.5, cursor: 'pointer' }}>
              <Download size={14} /> Download Excel
            </button>
          </div>
        </div>

        {pesan && (
          <div style={{ marginBottom: 14, fontSize: 12.5, fontWeight: 700, color: pesan.startsWith('✅') ? '#166534' : '#92400e', background: pesan.startsWith('✅') ? '#f0fdf4' : '#fffbeb', border: `1px solid ${pesan.startsWith('✅') ? '#bbf7d0' : '#fde68a'}`, borderRadius: 10, padding: '8px 12px' }}>
            {pesan}
          </div>
        )}

        {/* Daftar ranking */}
        <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: 16, padding: 20 }}>
          <div style={{ fontWeight: 800, fontSize: 14, color: '#1e293b', marginBottom: 14 }}>
            Ranking {filterKelas === 'semua' ? `Jenjang ${filterJenjang || '-'}` : filterKelas}
          </div>
          {daftarTerfilter.length === 0 ? (
            <div style={{ textAlign: 'center', color: '#94a3b8', fontSize: 13, padding: 30 }}>Belum ada siswa pada pilihan ini.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {daftarTerfilter.map((s, i) => (
                <div key={s.studentId} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', borderRadius: 10, background: i < 3 ? '#f5f3ff' : '#f8fafc' }}>
                  <div style={{ width: 24, textAlign: 'center', fontWeight: 800, fontSize: 13, color: i < 3 ? '#5B2ECC' : '#94a3b8' }}>{i + 1}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#1e293b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.nama}</div>
                    <div style={{ fontSize: 11, color: '#9ca3af', display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                      {filterKelas === 'semua' && <span>{s.kelasSekolah}</span>}
                      {s.streak > 0 && (
                        <span style={{ display: 'flex', alignItems: 'center', gap: 3, color: '#d97706' }}>
                          <Flame size={10} /> {s.streak} hari
                        </span>
                      )}
                      <span>Aktif terakhir: {formatTanggal(s.lastActiveDate)}</span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontWeight: 800, color: '#5B2ECC', fontSize: 13, background: '#f5f3ff', padding: '4px 10px', borderRadius: 999 }}>
                    <Trophy size={12} /> {s.xp}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}