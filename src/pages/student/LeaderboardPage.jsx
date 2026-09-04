// src/pages/student/LeaderboardPage.jsx
// ============================================================
// LEADERBOARD -- rangking berdasarkan XP MINGGUAN (bukan XP total),
// per KELAS (siswa kelas 7 saingan sesama kelas 7 doang, gak campur
// sama kelas 9 atau jenjang lain).
//
// KENAPA XP MINGGUAN, BUKAN XP TOTAL: kalau pakai XP total, siswa yang
// baru gabung gak akan PERNAH bisa ngejar siswa yang udah lama --
// gak adil, bikin nyerah duluan. Dengan XP mingguan yang reset tiap
// Senin (lihat src/utils/mingguIni.js), SEMUA siswa mulai dari 0 lagi
// tiap minggu -- yang menang adalah yang PALING KONSISTEN minggu ini,
// bukan yang paling lama gabung.
// ============================================================

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../../firebase';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { ArrowLeft, Trophy, Flame } from 'lucide-react';
import { kunciMingguIni } from '../../utils/mingguIni';

export default function LeaderboardPage() {
  const navigate = useNavigate();
  const studentId = localStorage.getItem('studentId');

  const [loading, setLoading] = useState(true);
  const [daftar, setDaftar] = useState([]);
  const [kelasSiswa, setKelasSiswa] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const snapSaya = await getDocs(query(collection(db, 'students'), where('studentId', '==', studentId)));
        const dataSaya = snapSaya.docs[0]?.data();
        const kelas = dataSaya?.kelasSekolah;
        setKelasSiswa(kelas);
        if (!kelas) { setLoading(false); return; }

        // Semua siswa SEKELAS -- leaderboard cuma bandingin sesama
        // kelas, bukan campur semua jenjang.
        const snapSekelas = await getDocs(query(collection(db, 'students'), where('kelasSekolah', '==', kelas)));
        const siswaSekelas = snapSekelas.docs.map((d) => ({ id: d.id, ...d.data() }));

        const snapProgres = await getDocs(collection(db, 'siswa_progress'));
        const progresMap = {};
        snapProgres.forEach((d) => { progresMap[d.id] = d.data(); });

        const kunciMinggu = kunciMingguIni();
        const hasil = siswaSekelas.map((s) => {
          const prog = progresMap[s.studentId] || {};
          // XP mingguan dianggap 0 kalau kuncinya BUKAN minggu ini --
          // ini penting: data di Firestore baru "resmi" ke-reset pas
          // siswa itu SENDIRI nyelesaiin sesi baru (lihat mingguIni.js),
          // jadi kalau siswa itu belum latihan sama sekali minggu ini,
          // angka lamanya HARUS dianggap 0 di sini juga, bukan ikut
          // nongol pakai angka minggu lalu yang udah basi.
          const xpMingguIni = prog.xpMingguIniKunci === kunciMinggu ? (prog.xpMingguIni || 0) : 0;
          return { nama: s.nama, studentId: s.studentId, xpMingguIni, streak: prog.streak || 0 };
        });

        hasil.sort((a, b) => b.xpMingguIni - a.xpMingguIni);
        setDaftar(hasil);
      } catch (e) {
        console.error('Gagal muat leaderboard:', e);
      }
      setLoading(false);
    })();
  }, [studentId]);

  const medali = ['🥇', '🥈', '🥉'];

  return (
    <div style={{ maxWidth: 560, margin: '0 auto', padding: 16 }}>
      <button onClick={() => navigate('/siswa/dashboard')} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', color: '#6b7280', cursor: 'pointer', marginBottom: 16, fontSize: 13 }}>
        <ArrowLeft size={16} /> Kembali
      </button>

      <div style={{ textAlign: 'center', marginBottom: 20 }}>
        <div style={{ fontSize: 40 }}>🏆</div>
        <h1 style={{ fontSize: 20, fontWeight: 800, color: '#1e293b', margin: '4px 0' }}>Leaderboard</h1>
        <p style={{ fontSize: 12.5, color: '#94a3b8' }}>
          Kelas {kelasSiswa || '-'} · XP minggu ini · Reset tiap Senin
        </p>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', color: '#94a3b8', fontSize: 13 }}>Memuat...</div>
      ) : !kelasSiswa ? (
        <div style={{ textAlign: 'center', color: '#94a3b8', fontSize: 13, padding: 30, border: '1px dashed #e2e8f0', borderRadius: 12 }}>
          Data kelasmu belum lengkap -- hubungi admin ya.
        </div>
      ) : daftar.every((d) => d.xpMingguIni === 0) ? (
        <div style={{ textAlign: 'center', color: '#94a3b8', fontSize: 13, padding: 30, border: '1px dashed #e2e8f0', borderRadius: 12 }}>
          Belum ada yang latihan minggu ini. Jadilah yang pertama! 🚀
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {daftar.map((d, i) => {
            const sayaSendiri = d.studentId === studentId;
            return (
              <div
                key={d.studentId}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderRadius: 12,
                  background: sayaSendiri ? '#f5f3ff' : 'white',
                  border: sayaSendiri ? '2px solid #7c3aed' : '1px solid #e2e8f0',
                }}
              >
                <div style={{ width: 28, textAlign: 'center', fontSize: i < 3 ? 20 : 13, fontWeight: 800, color: '#94a3b8' }}>
                  {medali[i] || i + 1}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13.5, fontWeight: 700, color: '#1e293b' }}>
                    {d.nama} {sayaSendiri && <span style={{ color: '#7c3aed' }}>(Kamu)</span>}
                  </div>
                  {d.streak > 0 && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 11, color: '#d97706' }}>
                      <Flame size={11} /> {d.streak} hari beruntun
                    </div>
                  )}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontWeight: 800, color: '#7c3aed', fontSize: 14 }}>
                  <Trophy size={14} /> {d.xpMingguIni} XP
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}