// src/pages/admin/bank-soal/HasilTryOutAdminPage.jsx
// ============================================================
// HASIL TRY OUT (Admin) -- lihat siapa sudah/belum mengerjakan try
// out yang diterbitkan lewat TerbitkanTryOutPage.jsx, skor, dan
// RANGKING otomatis (diurut dari skor tertinggi). Sumber data:
// koleksi "tryout_sesi" (baru, punya sistem try out sendiri -- BUKAN
// "jawaban_kuis" yang dipakai sistem Kuis guru/StudentQuizView.jsx).
// ============================================================

import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../../../firebase';
import { collection, getDocs, query, where } from 'firebase/firestore';
import {
  ArrowLeft, Trophy, Loader2, CheckCircle2, Clock, XCircle, ShieldAlert,
} from 'lucide-react';

export default function HasilTryOutAdminPage() {
  const navigate = useNavigate();

  const [loadingPaket, setLoadingPaket] = useState(true);
  const [daftarPaket, setDaftarPaket] = useState([]);
  const [paketTerpilih, setPaketTerpilih] = useState(null);

  const [loadingHasil, setLoadingHasil] = useState(false);
  const [baris, setBaris] = useState([]); // { student, sesi|null }

  useEffect(() => {
    (async () => {
      try {
        const snap = await getDocs(collection(db, 'tryout_paket'));
        const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        list.sort((a, b) => (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0));
        setDaftarPaket(list);
      } catch (e) {
        console.error('Gagal ambil daftar try out:', e);
      }
      setLoadingPaket(false);
    })();
  }, []);

  const bukaHasil = useCallback(async (paket) => {
    setPaketTerpilih(paket);
    setLoadingHasil(true);
    setBaris([]);
    try {
      // Ambil target siswa (yang MEMANG jadi sasaran paket ini), biar
      // yang "belum mengerjakan" juga ikut kelihatan -- bukan cuma yang
      // udah punya sesi doang.
      const snapSiswa = await getDocs(collection(db, 'students'));
      const semuaSiswa = snapSiswa.docs.map((d) => ({ id: d.id, ...d.data() }));
      const targetSiswa = semuaSiswa.filter((s) => {
        const cocokKelas = paket.targetKelas === 'Semua' || s.kelasSekolah === paket.targetKelas;
        const cocokKategori = paket.targetKategori === 'Semua' || s.kategori === paket.targetKategori;
        return cocokKelas && cocokKategori && !s.isBlocked;
      });

      const snapSesi = await getDocs(query(collection(db, 'tryout_sesi'), where('paketId', '==', paket.id)));
      const sesiPerStudent = {};
      snapSesi.forEach((d) => { sesiPerStudent[d.data().studentId] = { id: d.id, ...d.data() }; });

      const hasil = targetSiswa.map((s) => ({
        student: s,
        sesi: sesiPerStudent[s.studentId || s.id] || null,
      }));

      // 🔒 RANGKING: yang SELESAI diurutkan dari skor tertinggi. Yang
      // masih "berjalan" atau "belum mulai" ditaruh di bawah (gak ikut
      // rangking sampai beneran selesai -- adil, jangan sampai yang
      // belum kelar malah keitung).
      hasil.sort((a, b) => {
        const skorA = a.sesi?.status === 'selesai' ? (a.sesi.totalSkorPersen ?? -1) : -2;
        const skorB = b.sesi?.status === 'selesai' ? (b.sesi.totalSkorPersen ?? -1) : -2;
        return skorB - skorA;
      });

      setBaris(hasil);
    } catch (e) {
      console.error('Gagal ambil hasil try out:', e);
      alert('Gagal mengambil hasil: ' + e.message);
    }
    setLoadingHasil(false);
  }, []);

  const jumlahSelesai = baris.filter((b) => b.sesi?.status === 'selesai').length;
  const jumlahBerjalan = baris.filter((b) => b.sesi?.status === 'berjalan').length;

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '24px 16px', fontFamily: 'sans-serif' }}>
      <button onClick={() => navigate('/admin/bank-soal')} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', color: '#6b7280', cursor: 'pointer', marginBottom: 16, fontSize: 13 }}>
        <ArrowLeft size={16} /> Kembali ke Bank Soal
      </button>
      <h1 style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 22, fontWeight: 800, color: '#1e293b', margin: '0 0 16px' }}>
        <Trophy size={24} color="#d97706" /> Hasil & Rangking Try Out
      </h1>

      {loadingPaket ? (
        <Loader2 size={18} className="spin" />
      ) : daftarPaket.length === 0 ? (
        <div style={{ color: '#9ca3af', fontSize: 13 }}>Belum ada try out yang diterbitkan.</div>
      ) : (
        <div style={{ display: 'flex', gap: 20 }}>
          {/* DAFTAR PAKET */}
          <div style={{ width: 280, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 6 }}>
            {daftarPaket.map((p) => (
              <button
                key={p.id}
                onClick={() => bukaHasil(p)}
                style={{
                  textAlign: 'left', padding: '10px 12px', borderRadius: 8, cursor: 'pointer',
                  border: paketTerpilih?.id === p.id ? '2px solid #7c3aed' : '1px solid #e5e7eb',
                  background: paketTerpilih?.id === p.id ? '#f5f3ff' : 'white',
                }}
              >
                <div style={{ fontSize: 13, fontWeight: 700, color: '#1e293b' }}>{p.judul}</div>
                <div style={{ fontSize: 11, color: '#9ca3af' }}>{p.totalSoal} soal · {p.targetKelas}</div>
              </button>
            ))}
          </div>

          {/* HASIL + RANGKING */}
          <div style={{ flex: 1 }}>
            {!paketTerpilih ? (
              <div style={{ color: '#9ca3af', fontSize: 13, padding: 20, textAlign: 'center', border: '1px dashed #e5e7eb', borderRadius: 10 }}>
                Pilih try out di sebelah kiri buat lihat hasilnya.
              </div>
            ) : loadingHasil ? (
              <Loader2 size={18} className="spin" />
            ) : (
              <>
                <div style={{ display: 'flex', gap: 12, marginBottom: 12, fontSize: 12, color: '#6b7280' }}>
                  <span>✅ {jumlahSelesai} selesai</span>
                  <span>⏳ {jumlahBerjalan} sedang mengerjakan</span>
                  <span>⬜ {baris.length - jumlahSelesai - jumlahBerjalan} belum mulai</span>
                </div>

                <div style={{ border: '1px solid #e5e7eb', borderRadius: 10, overflow: 'hidden' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.5 }}>
                    <thead>
                      <tr style={{ background: '#f9fafb' }}>
                        <th style={{ padding: '8px 10px', textAlign: 'left', width: 40 }}>#</th>
                        <th style={{ padding: '8px 10px', textAlign: 'left' }}>Nama</th>
                        <th style={{ padding: '8px 10px', textAlign: 'center' }}>Status</th>
                        <th style={{ padding: '8px 10px', textAlign: 'center' }}>Skor</th>
                        <th style={{ padding: '8px 10px', textAlign: 'center' }}>XP</th>
                        <th style={{ padding: '8px 10px', textAlign: 'center' }}>Pelanggaran</th>
                      </tr>
                    </thead>
                    <tbody>
                      {baris.map((b, i) => {
                        const selesai = b.sesi?.status === 'selesai';
                        const berjalan = b.sesi?.status === 'berjalan';
                        return (
                          <tr key={b.student.id} style={{ borderTop: '1px solid #f1f5f9' }}>
                            <td style={{ padding: '8px 10px', fontWeight: 700, color: selesai && i < 3 ? '#d97706' : '#9ca3af' }}>
                              {selesai ? i + 1 : '-'}
                            </td>
                            <td style={{ padding: '8px 10px', color: '#1e293b' }}>{b.student.nama}</td>
                            <td style={{ padding: '8px 10px', textAlign: 'center' }}>
                              {selesai ? <CheckCircle2 size={14} color="#16a34a" style={{ display: 'inline' }} />
                                : berjalan ? <Clock size={14} color="#d97706" style={{ display: 'inline' }} />
                                : <XCircle size={14} color="#cbd5e1" style={{ display: 'inline' }} />}
                            </td>
                            <td style={{ padding: '8px 10px', textAlign: 'center', fontWeight: 700 }}>
                              {selesai ? `${b.sesi.totalSkorPersen}%` : '-'}
                            </td>
                            <td style={{ padding: '8px 10px', textAlign: 'center' }}>
                              {selesai ? b.sesi.xpFinal : '-'}
                            </td>
                            <td style={{ padding: '8px 10px', textAlign: 'center', color: (b.sesi?.pelanggaran?.length || 0) > 0 ? '#dc2626' : '#9ca3af' }}>
                              {b.sesi?.pelanggaran?.length > 0 && <ShieldAlert size={12} style={{ display: 'inline', marginRight: 3 }} />}
                              {b.sesi?.pelanggaran?.length || 0}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}