// src/components/buku/ModalBukuGuru.jsx
// Modal "Buku Digital - Mode Persiapan Guru" untuk baca materi + kunci
// sebelum kelas (bisa H-2). Sumber data SAMA dengan yang dibaca siswa
// (collection buku_digital), tapi mode guru: semua kunci & pembahasan TERBUKA.
import React, { useState, useEffect } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../firebase';
import RendererHtmlBab from './RendererHtmlBab';

const S = {
  overlay: {
    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 9999,
    display: 'flex', justifyContent: 'center', alignItems: 'center', padding: 16,
  },
  panel: {
    background: '#fff', borderRadius: 12, width: '95%', maxWidth: 900,
    maxHeight: '90vh', display: 'flex', flexDirection: 'column',
  },
  head: {
    padding: '12px 16px', borderBottom: '1px solid #e2e8f0',
    display: 'flex', alignItems: 'center', gap: 10,
  },
  title: { flex: 1, fontSize: 15, fontWeight: 700, color: '#1e293b' },
  closeBtn: {
    background: '#f1f5f9', border: 'none', borderRadius: 6, padding: '6px 12px',
    cursor: 'pointer', fontSize: 12, fontWeight: 600,
  },
  body: { flex: 1, overflowY: 'auto', padding: 16 },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 10 },
  card: {
    background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, padding: 12,
    cursor: 'pointer',
  },
  cardTitle: { fontSize: 13, fontWeight: 700, color: '#1e293b', marginBottom: 4 },
  cardSub: { fontSize: 11, color: '#64748b' },
  babList: { display: 'flex', flexDirection: 'column', gap: 8 },
  babItem: {
    padding: '10px 12px', background: '#f8fafc', border: '1px solid #e2e8f0',
    borderRadius: 8, cursor: 'pointer',
  },
  babTitle: { fontSize: 13, fontWeight: 600, color: '#1e293b' },
  babMeta: { fontSize: 11, color: '#64748b', marginTop: 2 },
  backBtn: {
    background: '#f1f5f9', border: 'none', borderRadius: 6, padding: '6px 12px',
    cursor: 'pointer', fontSize: 12, marginBottom: 12,
  },
  content: { fontSize: 13, lineHeight: 1.6, color: '#334155' },
  note: {
    background: '#fef3c7', border: '1px solid #fde68a', borderRadius: 8,
    padding: '8px 12px', fontSize: 11, color: '#92400e', marginBottom: 12,
  },
};

export default function ModalBukuGuru({ open, onClose }) {
  const [bukuList, setBukuList] = useState([]);
  const [bukuId, setBukuId] = useState('');
  const [babList, setBabList] = useState([]);
  const [bab, setBab] = useState(null);

  useEffect(() => {
    if (!open) return;
    (async () => {
      try {
        const snap = await getDocs(collection(db, 'buku_digital'));
        setBukuList(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      } catch (e) { console.error(e); }
    })();
  }, [open]);

  useEffect(() => {
    if (!bukuId) return;
    (async () => {
      try {
        const snap = await getDocs(collection(db, 'buku_digital', bukuId, 'bab'));
        const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        list.sort((a, b) => (a.urutan || 0) - (b.urutan || 0));
        setBabList(list);
      } catch (e) { console.error(e); }
    })();
  }, [bukuId]);

  if (!open) return null;

  return (
    <div style={S.overlay} onClick={onClose}>
      <div style={S.panel} onClick={(e) => e.stopPropagation()}>
        <div style={S.head}>
          <span style={S.title}>📚 Buku Digital - Mode Persiapan Guru</span>
          <button style={S.closeBtn} onClick={onClose}>✕ Tutup</button>
        </div>
        <div style={S.body}>
          {!bukuId && (
            <div style={S.grid}>
              {bukuList.map((b) => (
                <div key={b.id} style={S.card} onClick={() => setBukuId(b.id)}>
                  <div style={S.cardTitle}>{b.judul}</div>
                  <div style={S.cardSub}>{b.mapel || 'Buku Digital'}</div>
                </div>
              ))}
            </div>
          )}
          {bukuId && !bab && (
            <div>
              <button style={S.backBtn} onClick={() => setBukuId('')}>⬅ Pilih buku lain</button>
              <div style={S.babList}>
                {babList.map((x) => (
                  <div key={x.id} style={S.babItem} onClick={() => setBab(x)}>
                    <div style={S.babTitle}>Bab {x.urutan || '-'}: {x.judul}</div>
                    <div style={S.babMeta}>{x.html ? '✓ Siap dibaca' : 'Belum ada konten'}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
          {bab && (
            <div>
              <button style={S.backBtn} onClick={() => setBab(null)}>⬅ Daftar bab</button>
              <div style={S.note}>
                🔓 Mode guru: semua kunci & pembahasan terbuka untuk persiapan mengajar
              </div>
              {bab.tipe === 'html' && bab.html ? (
                <RendererHtmlBab html={bab.html} htmlUrl={bab.htmlUrl} babId={bab.id} bukuId={bukuId} modePresentasi />
              ) : bab.pdfUrl ? (
                <iframe title="pdf" src={bab.pdfUrl} style={{ width: '100%', height: '70vh', border: 'none', borderRadius: 8 }} />
              ) : (
                <div style={S.content} dangerouslySetInnerHTML={{ __html: bab.html || 'Belum ada konten' }} />
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}