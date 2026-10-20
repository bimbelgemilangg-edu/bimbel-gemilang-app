// src/pages/student/AksesBelajarPage.jsx
// ============================================================
// HUB "AKSES BELAJAR MUDAH" (20 Okt 2026): tombol TENGAH navigasi
// bawah mendarat di sini — E-LEARNING dan BUKU DIGITAL dicampur jadi
// satu kawasan belajar, sesuai permintaan owner ("akses belajar mudah
// campur dengan buku digital"). Rak buku aktif dirender langsung;
// zona e-learning/materi menaut ke halaman resminya tanpa mendobel
// logika.
// ============================================================
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../../firebase';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { BookOpen, MonitorPlay, Layers, Sparkles, FlipVertical } from 'lucide-react';


const st = {
  kartu: { background: '#fff', border: '1px solid #e5e7eb', borderRadius: 14, padding: 14 },
  zona: (warna) => ({
    background: '#fff', border: `1.5px solid ${warna}33`, borderRadius: 16, padding: 14,
    display: 'flex', gap: 12, alignItems: 'center', cursor: 'pointer', width: '100%', textAlign: 'left',
  }),
};

export default function AksesBelajarPage() {
  const navigate = useNavigate();
  const [buku, setBuku] = useState([]);
  const [memuat, setMemuat] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const snap = await getDocs(query(collection(db, 'buku_digital'), where('status', '==', 'aktif')));
        setBuku(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      } catch (e) {
        console.error('Gagal memuat rak buku:', e);
      } finally {
        setMemuat(false);
      }
    })();
  }, []);

  return (
    <div style={{ maxWidth: 860, margin: '0 auto', padding: '18px 14px 8px' }}>
      <div style={{ background: 'linear-gradient(135deg,#7C3AED,#5B2ECC)', borderRadius: 18, padding: 18, color: '#fff', marginBottom: 14 }}>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <Sparkles size={22} />
          <div>
            <div style={{ fontSize: 18, fontWeight: 800 }}>Akses Belajar Mudah</div>
            <div style={{ fontSize: 11.5, opacity: 0.9 }}>
              Satu pintu untuk buku digital, e-learning, dan materi — belajar dari mana saja.
            </div>
          </div>
        </div>
      </div>

      {/* 📚 20 Okt: buku PDF konvensional jadi warga kelas satu —
          review siswa: buku konvensional disukai, modul interaktif tidak. */}
      <div style={st.kartu}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
          <FlipVertical size={17} color="#f97316" />
          <b style={{ fontSize: 13.5, color: '#1e293b' }}>Buku PDF Gemilang — baca & balik seperti buku cetak</b>
        </div>
        <button type="button" onClick={() => navigate('/siswa/buku-pdf')} style={{ width: '100%', border: '1px solid #fed7aa', background: '#fff7ed', borderRadius: 12, padding: 12, textAlign: 'left', cursor: 'pointer' }}>
          <b style={{ fontSize: 12.5, color: '#7c2d12' }}>📙 Buka Rak Buku PDF Gemilang</b>
          <div style={{ fontSize: 10.5, color: '#9a3412', marginTop: 2 }}>baca & balik halaman seperti buku cetak · kunci & pembahasan khusus guru</div>
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 10, margin: '14px 0' }}>
        <button type="button" style={st.zona('#0e7490')} onClick={() => navigate('/siswa/materi')}>
          <span style={{ background: '#ecfeff', color: '#0e7490', borderRadius: 12, padding: 10 }}><MonitorPlay size={22} /></span>
          <span>
            <b style={{ fontSize: 13.5, color: '#0f172a' }}>E-Learning</b>
            <div style={{ fontSize: 11, color: '#64748b' }}>kelas video, modul interaktif & kuis</div>
          </span>
        </button>
        <button type="button" style={st.zona('#b45309')} onClick={() => navigate('/siswa/belajar')}>
          <span style={{ background: '#fffbeb', color: '#b45309', borderRadius: 12, padding: 10 }}><Layers size={22} /></span>
          <span>
            <b style={{ fontSize: 13.5, color: '#0f172a' }}>Materi Belajar</b>
            <div style={{ fontSize: 11, color: '#64748b' }}>bab demi bab beserta latihan</div>
          </span>
        </button>
      </div>

      <div style={{ ...st.kartu, marginTop: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
          <BookOpen size={17} color="#94a3b8" />
          <b style={{ fontSize: 12.5, color: '#64748b' }}>Arsip buku digital interaktif ({memuat ? '…' : buku.length}) — versi lama</b>
        </div>
        {memuat ? (
          <div style={{ fontSize: 12, color: '#94a3b8' }}>memuat rak…</div>
        ) : buku.length === 0 ? (
          <div style={{ fontSize: 12, color: '#94a3b8' }}>Belum ada buku digital aktif — admin menerbitkannya lewat Manajer Buku.</div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 10 }}>
            {buku.map((b) => (
              <button
                key={b.id}
                type="button"
                onClick={() => navigate(`/siswa/buku/${b.id}`)}
                style={{ border: '1px solid #e2e8f0', borderRadius: 12, padding: 12, background: b.warna || '#4C6EF5', color: '#fff', textAlign: 'left', cursor: 'pointer', minHeight: 110, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}
              >
                <span style={{ fontSize: 22 }}>{b.emoji || '📘'}</span>
                <span>
                  <b style={{ fontSize: 12.5, lineHeight: 1.35, display: 'block' }}>{b.judul}</b>
                  <span style={{ fontSize: 10.5, opacity: 0.9 }}>{b.mapel} · Kelas {b.kelas}</span>
                </span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
