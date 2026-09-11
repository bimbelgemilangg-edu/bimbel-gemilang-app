// src/pages/student/gemilang/BukuInteraktifPage.jsx
// RAK BUKU -- daftar buku interaktif + progres baca.
// Pagar akses REUSE utils/aksesKontenSiswa.js (jenjang dulu, baru kelas).
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../../../firebase';
import { collection, query, where, getDocs, limit } from 'firebase/firestore';
import { ArrowLeft, BookOpen } from 'lucide-react';
import { DAFTAR_BAB } from '../../../data/bukuInteraktif';
import { cocokkanJenjang, ekstrakAngkaKelas, cocokkanKelas } from '../../../utils/aksesKontenSiswa';
import MaskotAstronot from '../../../components/MaskotAstronot';

export default function BukuInteraktifPage() {
  const navigate = useNavigate();
  const studentId = localStorage.getItem('studentId') || '';
  const studentKelas = localStorage.getItem('studentKelas') || localStorage.getItem('studentGrade') || '';
  const [jenjang, setJenjang] = useState(null);
  const [dimuat, setDimuat] = useState(false);
  const [progresMap, setProgresMap] = useState({});

  useEffect(() => {
    (async () => {
      let jenjangSiswa = null;
      try {
        const snap = await getDocs(query(collection(db, 'students'), where('studentId', '==', studentId), limit(1)));
        if (!snap.empty) jenjangSiswa = snap.docs[0].data().jenjang || null;
      } catch (e) { console.error('Gagal ambil jenjang siswa:', e); }
      setJenjang(jenjangSiswa);
      try {
        const snapP = await getDocs(query(collection(db, 'siswa_buku_progress'), where('studentId', '==', studentId)));
        const m = {};
        snapP.forEach((d) => { m[d.data().babId] = d.data(); });
        setProgresMap(m);
      } catch (e) { console.error('Gagal ambil progres buku:', e); }
      setDimuat(true);
    })();
  }, [studentId]);

  const bukuTerlihat = DAFTAR_BAB.filter((b) => {
    if (!jenjang) return false;
    if (!cocokkanJenjang(b.jenjang, jenjang)) return false;
    if (studentKelas && !cocokkanKelas({ tingkatKelas: String(b.kelas) }, ekstrakAngkaKelas(studentKelas))) return false;
    return true;
  });

  const persenBab = (bab) => {
    const p = progresMap[bab.id];
    if (!p) return 0;
    const unit = (p.selesaiSections || []).length + (p.quizTerbaik != null ? 1 : 0);
    return Math.min(100, Math.round((unit / (bab.sections.length + 1)) * 100));
  };

  return (
    <div style={st.page}>
      <div style={st.hero}>
        <div style={st.heroStars} />
        <button onClick={() => navigate('/siswa/dashboard')} style={st.backBtn}><ArrowLeft size={20} /></button>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, position: 'relative', zIndex: 1 }}>
          <MaskotAstronot size={64} />
          <div>
            <h1 style={{ color: 'white', fontSize: 21, fontWeight: 800, margin: 0 }}>Buku Digital</h1>
            <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12, margin: '2px 0 0' }}>Perpustakaan pribadimu, Siswa Gemilang 📚</p>
          </div>
        </div>
      </div>

      <div style={{ padding: '18px 16px' }}>
        {!dimuat ? (
          <div style={st.kosong}>Memuat rak buku...</div>
        ) : bukuTerlihat.length === 0 ? (
          <div style={st.kosong}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>🛰️</div>
            {jenjang
              ? 'Belum ada buku untuk jenjang/kelasmu. Buku baru segera ditambah!'
              : '⚠️ Data jenjang profilmu belum lengkap. Hubungi admin untuk melengkapi data supaya rak buku bisa terisi.'}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {bukuTerlihat.map((bab) => {
              const persen = persenBab(bab);
              return (
                <button key={bab.id} onClick={() => navigate(`/siswa/buku/${bab.id}`)} style={{ ...st.kartu, borderLeft: `6px solid ${bab.warna}` }}>
                  <div style={{ ...st.cover, background: `linear-gradient(135deg, ${bab.warna}, #1E1B4B)` }}>{bab.emoji}</div>
                  <div style={{ flex: 1, textAlign: 'left' }}>
                    <div style={{ fontWeight: 800, fontSize: 14, color: '#1e293b' }}>{bab.judul}</div>
                    <div style={{ fontSize: 11, color: '#94a3b8', margin: '2px 0 8px' }}>
                      {bab.mapel} • Kelas {bab.kelas} • {bab.sections.length} seksi
                    </div>
                    <div style={{ height: 6, background: '#f1f5f9', borderRadius: 10, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${persen}%`, background: persen === 100 ? '#22c55e' : bab.warna, borderRadius: 10 }} />
                    </div>
                  </div>
                  <div style={{ minWidth: 40, textAlign: 'right', fontSize: 12, fontWeight: 800, color: persen === 100 ? '#22c55e' : '#7C3AED' }}>
                    {persen === 0 ? <BookOpen size={18} /> : `${persen}%`}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

const st = {
  page: { minHeight: '100vh', background: '#F4F2FF', fontFamily: 'sans-serif', maxWidth: 480, margin: '0 auto' },
  hero: { position: 'relative', overflow: 'hidden', padding: '18px 16px 26px', background: 'linear-gradient(160deg, #4C1D95 0%, #1E1B4B 100%)' },
  heroStars: { position: 'absolute', inset: 0, background: 'radial-gradient(circle at 15% 20%, rgba(255,255,255,0.08), transparent 45%), radial-gradient(circle at 85% 75%, rgba(255,255,255,0.06), transparent 40%)', pointerEvents: 'none' },
  backBtn: { position: 'relative', zIndex: 1, background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: '50%', width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'white', marginBottom: 10 },
  kosong: { textAlign: 'center', color: '#8b8398', padding: '36px 20px', fontSize: 13, background: 'white', borderRadius: 16 },
  kartu: { display: 'flex', alignItems: 'center', gap: 14, background: 'white', borderRadius: 18, padding: 14, cursor: 'pointer', boxShadow: '0 4px 16px rgba(30,27,75,0.06)', border: 'none', width: '100%' },
  cover: { width: 56, height: 70, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26, flexShrink: 0 },
};