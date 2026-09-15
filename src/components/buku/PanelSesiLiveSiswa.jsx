// src/components/buku/PanelSesiLiveSiswa.jsx
// Panel "Sesi Live" di dalam halaman Buku Digital siswa.
// 🔥 FIX ANTI-MENUMPUK: hanya sesi yang dibuat < 8 jam terakhir yang
// ditampilkan, dan bila ada beberapa sesi untuk bab yang sama, hanya
// YANG TERBARU yang muncul. Sesi lama/lupa diakhiri tidak lagi menghantui.
import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, onSnapshot, query, where, doc, getDoc } from 'firebase/firestore';
import { db } from '../../firebase';

const BATAS_JAM = 8;

const S = {
  wrap: { marginBottom: 14 },
  aktif: {
    background: 'linear-gradient(135deg, #7f1d1d, #b91c1c)', color: '#fff',
    borderRadius: 14, padding: '14px 16px', marginBottom: 10,
    display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap',
    boxShadow: '0 6px 18px rgba(185,28,28,.35)',
  },
  dot: { width: 10, height: 10, borderRadius: '50%', background: '#fecaca', animation: 'pulseLiveSiswa 1.2s infinite', flexShrink: 0 },
  judul: { flex: 1, minWidth: 160 },
  judulTop: { fontSize: 10, fontWeight: 800, letterSpacing: 2, opacity: 0.85 },
  judulMain: { fontSize: 15, fontWeight: 800, margin: '2px 0' },
  chip: { background: 'rgba(255,255,255,.16)', border: '1px solid rgba(255,255,255,.35)', borderRadius: 999, padding: '2px 10px', fontSize: 10, fontWeight: 700 },
  btnGabung: {
    background: '#fff', color: '#b91c1c', border: 'none', borderRadius: 10,
    padding: '10px 16px', fontSize: 13, fontWeight: 800, cursor: 'pointer', flexShrink: 0,
  },
  kosong: {
    border: '2px dashed #cbd5e1', borderRadius: 14, padding: '12px 16px',
    display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap',
    background: '#f8fafc', marginBottom: 10,
  },
  kosongTxt: { flex: 1, minWidth: 160, fontSize: 12.5, color: '#64748b' },
  btnKode: {
    background: '#eef2ff', color: '#4338ca', border: '1px solid #c7d2fe', borderRadius: 10,
    padding: '9px 14px', fontSize: 12, fontWeight: 700, cursor: 'pointer',
  },
};

export default function PanelSesiLiveSiswa() {
  const navigate = useNavigate();
  const [sesiList, setSesiList] = useState([]);
  const [namaBab, setNamaBab] = useState({});
  const diambilRef = useRef({});

  useEffect(() => {
    const q = query(collection(db, 'sesi_kelas'), where('status', '==', 'aktif'));
    const un = onSnapshot(q, (sn) => {
      const now = Date.now();
      const semua = sn.docs.map((d) => ({ id: d.id, ...d.data() }));
      // 🔥 FILTER 1: hanya sesi < 8 jam terakhir
      const segar = semua.filter((s) => {
        const t = s.dibuatAt?.toDate?.();
        return !t || (now - t.getTime()) < BATAS_JAM * 3600 * 1000;
      });
      // 🔥 FILTER 2: satu kartu per bab (yang terbaru saja)
      const perBab = {};
      segar.forEach((s) => {
        const key = s.babId || ('bank-' + s.id);
        const t = s.dibuatAt?.seconds || 0;
        if (!perBab[key] || t > (perBab[key].dibuatAt?.seconds || 0)) perBab[key] = s;
      });
      const list = Object.values(perBab).sort((a, b) => (b.dibuatAt?.seconds || 0) - (a.dibuatAt?.seconds || 0));
      setSesiList(list);
    });
    return un;
  }, []);

  useEffect(() => {
    sesiList.forEach((s) => {
      if (!s.bukuId || !s.babId || diambilRef.current[s.id]) return;
      diambilRef.current[s.id] = true;
      (async () => {
        try {
          const b = await getDoc(doc(db, 'buku_digital', s.bukuId, 'bab', s.babId));
          if (b.exists()) setNamaBab((m) => ({ ...m, [s.id]: b.data().judul || 'Bab modul' }));
        } catch (e) { /* abaikan */ }
      })();
    });
  }, [sesiList]);

  return (
    <div style={S.wrap}>
      <style>{`@keyframes pulseLiveSiswa { 0%,100%{opacity:1;} 50%{opacity:.3;} }`}</style>
      {sesiList.length === 0 ? (
        <div style={S.kosong}>
          <span style={{ fontSize: 20 }}>📡</span>
          <span style={S.kosongTxt}>Tidak ada sesi live berlangsung saat ini. Punya kode sesi dari guru?</span>
          <button style={S.btnKode} onClick={() => navigate('/siswa/sesi-live')}>🎧 Masuk lewat kode</button>
        </div>
      ) : (
        sesiList.map((s) => (
          <div key={s.id} style={S.aktif}>
            <span style={S.dot} />
            <div style={S.judul}>
              <div style={S.judulTop}>🔴 SESI LIVE BERLANGSUNG</div>
              <div style={S.judulMain}>{namaBab[s.id] || s.catatan || 'Sesi Kelas'}</div>
              <span style={S.chip}>{s.mode === 'materi' ? '📖 Materi Interaktif' : '✍️ Soal & Pembahasan'}</span>
            </div>
            <button style={S.btnGabung} onClick={() => navigate(`/siswa/sesi-live?kode=${s.kode || ''}`)}>
              🎧 GABUNG SEKARANG
            </button>
          </div>
        ))
      )}
    </div>
  );
}