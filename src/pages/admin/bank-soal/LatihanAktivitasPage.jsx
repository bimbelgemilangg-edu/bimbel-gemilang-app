// src/pages/admin/bank-soal/LatihanAktivitasPage.jsx
// ============================================================
// AKTIVITAS LATIHAN HARIAN (Admin)
// ============================================================
// Jawaban langsung buat kebutuhan: "gimana cara lihat soal yang udah
// dikerjakan siswa di Latihan Harian?" -- versi sederhana dulu, cukup
// buat VERIFIKASI sistem jalan (siapa aktif, XP/streak berapa, materi
// mana yang sudah/belum dikuasai). Detail lebih lengkap (analisis AI,
// download laporan) menyusul sesuai blueprint "Evaluasi & Aktivitas"
// yang sudah didiskusikan.
// ============================================================

import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../../../firebase';
import { collection, getDocs, query, where } from 'firebase/firestore';
import {
  ArrowLeft, Flame, Sparkles, ChevronDown, ChevronRight, Loader2, RefreshCw,
} from 'lucide-react';

export default function LatihanAktivitasPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [daftarSiswa, setDaftarSiswa] = useState([]); // gabungan students + siswa_progress
  const [expandedId, setExpandedId] = useState(null);
  const [detailPerMateri, setDetailPerMateri] = useState({}); // {studentId: [{materi, dicoba, benar, kuasai}]}
  const [loadingDetail, setLoadingDetail] = useState(null);
  const [filterKelas, setFilterKelas] = useState('');

  const muatData = useCallback(async () => {
    setLoading(true);
    try {
      const [snapStudents, snapProgress] = await Promise.all([
        getDocs(collection(db, 'students')),
        getDocs(collection(db, 'siswa_progress')),
      ]);

      const progressMap = {};
      snapProgress.forEach((d) => { progressMap[d.id] = d.data(); });

      const gabungan = snapStudents.docs.map((d) => {
        const s = d.data();
        const prog = progressMap[s.studentId] || {};
        return {
          docId: d.id,
          studentId: s.studentId,
          nama: s.nama || '-',
          kelas: s.kelasSekolah || '-',
          jenjang: s.jenjang || '-',
          xp: prog.xp || 0,
          streak: prog.streak || 0,
          lastActiveDate: prog.lastActiveDate || null,
          sudahPernahLatihan: !!progressMap[s.studentId],
        };
      });

      // Yang sudah pernah latihan ditampilkan duluan (paling relevan buat
      // dipantau), diurutkan dari XP tertinggi.
      gabungan.sort((a, b) => {
        if (a.sudahPernahLatihan !== b.sudahPernahLatihan) return a.sudahPernahLatihan ? -1 : 1;
        return b.xp - a.xp;
      });

      setDaftarSiswa(gabungan);
    } catch (e) {
      console.error('Gagal memuat aktivitas latihan:', e);
    }
    setLoading(false);
  }, []);

  useEffect(() => { muatData(); }, [muatData]);

  const bukaDetail = useCallback(async (siswa) => {
    if (expandedId === siswa.studentId) { setExpandedId(null); return; }
    setExpandedId(siswa.studentId);

    if (detailPerMateri[siswa.studentId]) return; // sudah pernah dimuat, pakai cache

    setLoadingDetail(siswa.studentId);
    try {
      const snapProg = await getDocs(query(collection(db, 'siswa_soal_progress'), where('studentId', '==', siswa.studentId)));
      const daftarProg = snapProg.docs.map((d) => d.data());

      if (daftarProg.length === 0) {
        setDetailPerMateri((prev) => ({ ...prev, [siswa.studentId]: [] }));
        setLoadingDetail(null);
        return;
      }

      // Ambil data soal terkait (buat tahu materinya) -- Firestore 'in'
      // dibatasi 30 ID per query, jadi dipecah kalau lebih dari itu.
      const soalIds = daftarProg.map((p) => p.soalId);
      const soalMap = {};
      for (let i = 0; i < soalIds.length; i += 30) {
        const potongan = soalIds.slice(i, i + 30);
        const snapSoal = await getDocs(query(collection(db, 'bank_soal'), where('__name__', 'in', potongan)));
        snapSoal.forEach((d) => { soalMap[d.id] = d.data(); });
      }

      const perMateri = {};
      daftarProg.forEach((p) => {
        const materi = soalMap[p.soalId]?.materi || 'Tidak diketahui';
        if (!perMateri[materi]) perMateri[materi] = { dicoba: 0, benar: 0, kuasai: 0 };
        perMateri[materi].dicoba += 1;
        perMateri[materi].benar += (p.benarCount || 0) > 0 ? 1 : 0;
        if ((p.kotak || 0) >= 3) perMateri[materi].kuasai += 1;
      });

      const hasil = Object.entries(perMateri).map(([materi, d]) => ({
        materi,
        jumlahSoalDicoba: d.dicoba,
        persentaseKuasai: Math.round((d.kuasai / d.dicoba) * 100),
      })).sort((a, b) => a.persentaseKuasai - b.persentaseKuasai);

      setDetailPerMateri((prev) => ({ ...prev, [siswa.studentId]: hasil }));
    } catch (e) {
      console.error('Gagal ambil detail materi siswa:', e);
      setDetailPerMateri((prev) => ({ ...prev, [siswa.studentId]: [] }));
    }
    setLoadingDetail(null);
  }, [expandedId, detailPerMateri]);

  const daftarTerfilter = filterKelas.trim()
    ? daftarSiswa.filter((s) => s.kelas.toLowerCase().includes(filterKelas.trim().toLowerCase()))
    : daftarSiswa;

  const formatTanggal = (str) => {
    if (!str) return 'Belum pernah';
    const hariIni = new Date().toISOString().slice(0, 10);
    if (str === hariIni) return 'Hari ini';
    return new Date(str).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
  };

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto', padding: '24px 16px', fontFamily: 'sans-serif' }}>
      <button onClick={() => navigate('/admin/bank-soal')} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', color: '#6b7280', cursor: 'pointer', marginBottom: 16, fontSize: 13 }}>
        <ArrowLeft size={16} /> Kembali ke Bank Soal
      </button>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
        <h1 style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 22, fontWeight: 800, color: '#1e293b', margin: 0 }}>
          <Sparkles size={24} color="#673ab7" /> Aktivitas Latihan Harian
        </h1>
        <button onClick={muatData} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 8, border: '1px solid #e5e7eb', background: 'white', cursor: 'pointer', fontSize: 12 }}>
          <RefreshCw size={14} /> Muat Ulang
        </button>
      </div>
      <p style={{ color: '#6b7280', fontSize: 13, marginBottom: 16 }}>
        Pantau siapa yang aktif latihan, XP/streak, dan materi mana yang masih perlu diperkuat.
      </p>

      <input
        placeholder="Filter kelas (mis. 9, 7 SMP)"
        value={filterKelas}
        onChange={(e) => setFilterKelas(e.target.value)}
        style={{ width: '100%', maxWidth: 300, padding: '9px 12px', borderRadius: 8, border: '1px solid #d1d5db', fontSize: 13, marginBottom: 16 }}
      />

      {loading ? (
        <div style={{ textAlign: 'center', padding: 40 }}><Loader2 size={24} className="spin" /></div>
      ) : daftarTerfilter.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 40, color: '#9ca3af', fontSize: 13 }}>Tidak ada siswa yang cocok filter.</div>
      ) : (
        <div style={{ border: '1px solid #e5e7eb', borderRadius: 10, overflow: 'hidden' }}>
          {daftarTerfilter.map((s) => (
            <div key={s.docId} style={{ borderBottom: '1px solid #f1f5f9' }}>
              <div
                onClick={() => s.sudahPernahLatihan && bukaDetail(s)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px',
                  cursor: s.sudahPernahLatihan ? 'pointer' : 'default',
                  backgroundColor: expandedId === s.studentId ? '#f5f3ff' : 'white',
                  opacity: s.sudahPernahLatihan ? 1 : 0.55,
                }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13.5, fontWeight: 700, color: '#1e293b' }}>{s.nama}</div>
                  <div style={{ fontSize: 11, color: '#9ca3af' }}>{s.kelas} · {s.jenjang}</div>
                </div>
                {s.sudahPernahLatihan ? (
                  <>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: '#f97316', fontWeight: 700 }}>
                      <Flame size={14} /> {s.streak}
                    </div>
                    <div style={{ fontSize: 12, color: '#673ab7', fontWeight: 700, minWidth: 60 }}>{s.xp} XP</div>
                    <div style={{ fontSize: 11, color: '#9ca3af', minWidth: 70, textAlign: 'right' }}>{formatTanggal(s.lastActiveDate)}</div>
                    {expandedId === s.studentId ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                  </>
                ) : (
                  <span style={{ fontSize: 11, color: '#9ca3af' }}>Belum pernah latihan</span>
                )}
              </div>

              {expandedId === s.studentId && (
                <div style={{ padding: '10px 16px 16px 40px', backgroundColor: '#fafafa' }}>
                  {loadingDetail === s.studentId ? (
                    <Loader2 size={16} className="spin" />
                  ) : (detailPerMateri[s.studentId] || []).length === 0 ? (
                    <div style={{ fontSize: 12, color: '#9ca3af' }}>Belum ada data materi.</div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      {detailPerMateri[s.studentId].map((m) => (
                        <div key={m.materi} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                          <span style={{ color: '#374151' }}>{m.materi} <span style={{ color: '#9ca3af' }}>({m.jumlahSoalDicoba} soal dicoba)</span></span>
                          <span style={{ fontWeight: 700, color: m.persentaseKuasai < 60 ? '#dc2626' : '#16a34a' }}>{m.persentaseKuasai}% kuasai</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}