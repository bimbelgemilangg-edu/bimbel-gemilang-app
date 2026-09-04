// src/pages/student/tryout/DaftarTryOutPage.jsx
// ============================================================
// Daftar try out yang tersedia buat siswa ini (dari tryout_paket,
// difilter targetKelas/targetKategori) + status pengerjaannya (belum
// mulai / sedang berjalan / sudah selesai + skor).
// ============================================================

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../../../firebase';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { ArrowLeft, Target, Clock, CheckCircle2, PlayCircle } from 'lucide-react';

export default function DaftarTryOutPage() {
  const navigate = useNavigate();
  const studentId = localStorage.getItem('studentId');

  const [loading, setLoading] = useState(true);
  const [daftar, setDaftar] = useState([]);

  useEffect(() => {
    (async () => {
      try {
        const snapSiswa = await getDocs(query(collection(db, 'students'), where('studentId', '==', studentId)));
        const siswa = snapSiswa.docs[0]?.data();

        const snapPaket = await getDocs(query(collection(db, 'tryout_paket'), where('status', '==', 'aktif')));
        let paketList = snapPaket.docs.map((d) => ({ id: d.id, ...d.data() }));

        // Filter target kelas/kategori -- 'Semua' selalu lolos.
        paketList = paketList.filter((p) => {
          const cocokKelas = p.targetKelas === 'Semua' || p.targetKelas === siswa?.kelasSekolah;
          const cocokKategori = p.targetKategori === 'Semua' || p.targetKategori === siswa?.kategori;
          return cocokKelas && cocokKategori;
        });

        const snapSesi = await getDocs(query(collection(db, 'tryout_sesi'), where('studentId', '==', studentId)));
        const sesiPerPaket = {};
        snapSesi.forEach((d) => { sesiPerPaket[d.data().paketId] = d.data(); });

        setDaftar(paketList.map((p) => ({ ...p, sesi: sesiPerPaket[p.id] || null })));
      } catch (e) {
        console.error('Gagal memuat daftar try out:', e);
      }
      setLoading(false);
    })();
  }, [studentId]);

  return (
    <div style={{ maxWidth: 640, margin: '0 auto', padding: 16 }}>
      <button onClick={() => navigate('/siswa/dashboard')} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', color: '#6b7280', cursor: 'pointer', marginBottom: 16, fontSize: 13 }}>
        <ArrowLeft size={16} /> Kembali
      </button>
      <h1 style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 20, fontWeight: 800, color: '#1e293b', marginBottom: 16 }}>
        <Target size={22} color="#7c3aed" /> Try Out
      </h1>

      {loading ? (
        <div style={{ color: '#94a3b8', fontSize: 13 }}>Memuat...</div>
      ) : daftar.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 40, color: '#94a3b8', fontSize: 13, border: '1px dashed #e2e8f0', borderRadius: 12 }}>
          Belum ada try out yang tersedia buat kamu saat ini.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {daftar.map((p) => {
            const status = p.sesi?.status === 'selesai' ? 'selesai' : p.sesi?.status === 'berjalan' ? 'berjalan' : 'belum';

            // 🔥 BARU: cek jadwal buka & deadline. PENTING -- kuncinya
            // cuma buat yang BELUM MULAI. Kalau siswa udah pernah mulai
            // (status berjalan/selesai), dia TETAP boleh masuk buat
            // lanjutin/lihat hasil walau udah lewat deadline -- yang
            // dikunci itu MULAI BARU, bukan akses ke sesi yang udah ada.
            const sekarang = new Date();
            const belumDibuka = status === 'belum' && p.waktuBuka && sekarang < new Date(p.waktuBuka);
            const sudahLewatDeadline = status === 'belum' && p.waktuTutup && sekarang > new Date(p.waktuTutup);
            const terkunci = belumDibuka || sudahLewatDeadline;

            return (
              <button
                key={p.id}
                onClick={() => !terkunci && navigate(`/siswa/tryout/${p.id}`)}
                disabled={terkunci}
                style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 16, borderRadius: 12, border: '1px solid #e2e8f0', background: terkunci ? '#f8fafc' : 'white', cursor: terkunci ? 'default' : 'pointer', textAlign: 'left', opacity: terkunci ? 0.7 : 1 }}
              >
                <div style={{ fontSize: 26 }}>{terkunci ? '🔒' : status === 'selesai' ? '🏁' : status === 'berjalan' ? '⏳' : '🎯'}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#1e293b' }}>{p.judul}</div>
                  <div style={{ fontSize: 11.5, color: '#94a3b8' }}>{p.totalSoal} soal · {p.modeTimer === 'total' ? `${p.durasiTotalMenit} menit` : `${p.subtes?.length || 0} subtes`}</div>
                  {belumDibuka && <div style={{ fontSize: 11, color: '#d97706', marginTop: 2 }}>Dibuka {new Date(p.waktuBuka).toLocaleString('id-ID')}</div>}
                  {sudahLewatDeadline && <div style={{ fontSize: 11, color: '#dc2626', marginTop: 2 }}>Sudah lewat deadline ({new Date(p.waktuTutup).toLocaleString('id-ID')})</div>}
                </div>
                {status === 'selesai' && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, fontWeight: 700, color: '#16a34a' }}>
                    <CheckCircle2 size={14} /> {p.sesi.totalSkorPersen}%
                  </div>
                )}
                {status === 'berjalan' && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, fontWeight: 700, color: '#d97706' }}>
                    <Clock size={14} /> Lanjutkan
                  </div>
                )}
                {status === 'belum' && !terkunci && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, fontWeight: 700, color: '#7c3aed' }}>
                    <PlayCircle size={14} /> Mulai
                  </div>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}