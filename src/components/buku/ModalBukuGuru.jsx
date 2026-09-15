// src/components/buku/ModalBukuGuru.jsx
// Modal "Buku Digital — Mode Persiapan Guru" yang dipanggil dari
// Quick Action di TeacherDashboard. Guru bisa: pilih buku -> pilih bab ->
// membaca modul LENGKAP dengan semua kunci & pembahasan TERBUKA (mode guru),
// kapan pun (mis. 2 hari sebelum kelas). Sumber data SAMA dengan yang
// dibaca siswa (collection buku_digital), jadi tidak ada duplikat materi.
import React, { useState, useEffect, useRef } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../firebase';
import RendererHtmlBab from './RendererHtmlBab';

const S = {
  overlay: {
    position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.85)', zIndex: 9998,
    display: 'flex', justifyContent: 'center', alignItems: 'center', padding: 16,
    backdropFilter: 'blur(4px)',
  },
  panel: {
    background: '#fff', borderRadius: 16, width: '95%', maxWidth: 860,
    maxHeight: '92vh', display: 'flex', flexDirection: 'column', overflow: 'hidden',
  },
  head: {
    display: 'flex', alignItems: 'center', gap: 10, padding: '14px 18px',
    borderBottom: '1px solid #f1f5f9', background: '#fff',
  },
  title: { margin: 0, fontSize: 15, fontWeight: 800, color: '#1e293b', flex: 1 },
  closeBtn: {
    background: '#f1f5f9', border: 'none', borderRadius: 8, padding: '6px 10px',
    cursor: 'pointer', fontSize: 12, fontWeight: 700, color: '#64748b',
  },
  body: { flex: 1, overflowY: 'auto', padding: 18, background: '#f8fafc' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 10 },
  bukuCard: {
    background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: 14,
    cursor: 'pointer', transition: '0.2s', textAlign: 'left',
  },
  bukuJudul: { fontSize: 13, fontWeight: 800, color: '#1e293b', marginBottom: 4 },
  bukuMeta: { fontSize: 11, color: '#64748b' },
  babRow: {
    display: 'flex', alignItems: 'center', gap: 10, background: '#fff',
    border: '1px solid #e2e8f0', borderRadius: 10, padding: '10px 12px',
    marginBottom: 8, cursor: 'pointer',
  },
  babNo: {
    width: 26, height: 26, borderRadius: 8, background: '#ede9fe', color: '#5b21b6',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 11, fontWeight: 800, flexShrink: 0,
  },
  babJudul: { fontSize: 13, fontWeight: 700, color: '#1e293b', flex: 1 },
  note: {
    background: '#eef2ff', border: '1px solid #c7d2fe', color: '#3730a3',
    borderRadius: 10, padding: '8px 12px', fontSize: 12, fontWeight: 600, marginBottom: 12,
  },
  backBtn: {
    background: '#f1f5f9', border: 'none', borderRadius: 8, padding: '7px 12px',
    cursor: 'pointer', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 12,
  },
  empty: { textAlign: 'center', color: '#94a3b8', fontSize: 13, padding: 30 },
};

export default function ModalBukuGuru({ open, onClose }) {
  const [bukuList, setBukuList] = useState([]);
  const [bukuId, setBukuId] = useState('');
  const [babList, setBabList] = useState([]);
  const [bab, setBab] = useState(null);
  const [loading, setLoading] = useState(false);
  const wrapRef = useRef(null);

  // muat daftar buku saat modal dibuka
  useEffect(() => {
    if (!open) return;
    setBukuId(''); setBab(null); setBabList([]);
    (async () => {
      setLoading(true);
      try {
        const snap = await getDocs(collection(db, 'buku_digital'));
        setBukuList(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      } catch (e) { console.error('Gagal muat buku:', e); }
      setLoading(false);
    })();
  }, [open]);

  // muat daftar bab saat buku dipilih
  useEffect(() => {
    if (!bukuId) { setBabList([]); return; }
    setBab(null);
    (async () => {
      setLoading(true);
      try {
        const snap = await getDocs(collection(db, 'buku_digital', bukuId, 'bab'));
        const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        list.sort((a, b) => (a.urutan || 0) - (b.urutan || 0));
        setBabList(list);
      } catch (e) { console.error('Gagal muat bab:', e); }
      setLoading(false);
    })();
  }, [bukuId]);

  // MODE GURU: buka semua <details> (kunci & pembahasan) di dalam Shadow DOM
  // renderer. Effect anak (RendererHtmlBab) jalan lebih dulu daripada effect
  // ini, jadi shadowRoot sudah terisi saat kita buka semua details.
  useEffect(() => {
    if (!bab || !bab.html) return undefined;
    const t = setTimeout(() => {
      const host = wrapRef.current && wrapRef.current.firstElementChild;
      const root = host && host.shadowRoot;
      if (root) root.querySelectorAll('details').forEach((d) => { d.open = true; });
    }, 80);
    return () => clearTimeout(t);
  }, [bab]);

  if (!open) return null;

  const bukuAktif = bukuList.find((b) => b.id === bukuId);

  return (
    <div style={S.overlay} onClick={onClose}>
      <div style={S.panel} onClick={(e) => e.stopPropagation()}>
        <div style={S.head}>
          <span style={S.title}>
            📚 Buku Digital — Mode Persiapan Guru
            {bukuAktif && <span style={{ color: '#64748b', fontWeight: 600 }}> · {bukuAktif.judul}</span>}
            {bab && <span style={{ color: '#64748b', fontWeight: 600 }}> · Bab {bab.urutan ?? ''} {bab.judul}</span>}
          </span>
          <button style={S.closeBtn} onClick={onClose}>✕ Tutup</button>
        </div>
        <div style={S.body}>
          {loading && <div style={S.empty}>Memuat...</div>}

          {/* LANGKAH 1: pilih buku */}
          {!loading && !bukuId && (
            bukuList.length === 0
              ? <div style={S.empty}>Belum ada buku digital. Impor dulu lewat Admin → Manajer Buku Digital.</div>
              : (
                <div style={S.grid}>
                  {bukuList.map((b) => (
                    <button key={b.id} style={S.bukuCard} onClick={() => setBukuId(b.id)}>
                      <div style={S.bukuJudul}>{b.emoji || '📘'} {b.judul}</div>
                      <div style={S.bukuMeta}>{b.subtitle || b.mapel || 'Buku digital'}</div>
                    </button>
                  ))}
                </div>
              )
          )}

          {/* LANGKAH 2: pilih bab */}
          {!loading && bukuId && !bab && (
            <div>
              <button style={S.backBtn} onClick={() => setBukuId('')}>⬅ Pilih buku lain</button>
              {babList.length === 0
                ? <div style={S.empty}>Buku ini belum punya bab.</div>
                : babList.map((x) => (
                  <div key={x.id} style={S.babRow} onClick={() => setBab(x)}>
                    <span style={S.babNo}>{x.urutan ?? '•'}</span>
                    <span style={S.babJudul}>{x.judul}</span>
                    <span style={{ fontSize: 11, color: '#64748b' }}>{x.html ? 'siap dibaca' : 'tanpa html'}</span>
                  </div>
                ))}
            </div>
          )}

          {/* LANGKAH 3: baca mode guru */}
          {!loading && bab && (
            <div>
              <button style={S.backBtn} onClick={() => setBab(null)}>⬅ Daftar bab</button>
              <div style={S.note}>
                🔓 Mode guru: semua kunci & pembahasan terbuka otomatis untuk persiapan mengajar.
                Siswa melihat modul yang sama dengan kunci terkunci sampai mereka mencoba soal.
              </div>
              {bab.html ? (
                <div ref={wrapRef}>
                  <RendererHtmlBab html={bab.html} babId={bab.id} bukuId={bukuId} />
                </div>
              ) : (
                <div style={S.empty}>Bab ini belum memiliki konten HTML.</div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}