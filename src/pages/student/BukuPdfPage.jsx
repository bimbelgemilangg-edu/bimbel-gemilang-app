// src/pages/student/BukuPdfPage.jsx
// ============================================================
// BUKU PDF GEMILANG (20 Okt 2026): pintu katalog + flipbook.
// Mode 'siswa' menyembunyikan halaman pembahasan; mode 'guru'
// (rute /guru/buku-pdf/:id) membuka seluruh buku sebagai pegangan.
// ============================================================
import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { db } from '../../firebase';
import { BookOpen, ArrowLeft } from 'lucide-react';
import { muatKatalogBukuPdf } from '../../services/bukuPdfService';
import FlipbookBukuPdf from '../../components/buku/FlipbookBukuPdf';

export default function BukuPdfPage({ mode = 'siswa' }) {
  const navigate = useNavigate();
  const { bukuId } = useParams();
  const [katalog, setKatalog] = useState([]);
  const [memuat, setMemuat] = useState(true);
  useEffect(() => {
    (async () => {
      try {
        setKatalog(await muatKatalogBukuPdf(db, true));
      } catch (e) {
        console.error('Gagal memuat katalog buku PDF:', e);
      } finally {
        setMemuat(false);
      }
    })();
  }, []);
  const buku = bukuId ? katalog.find((b) => b.id === bukuId) || null : null;

  if (bukuId && !memuat && !buku) {
    return <div style={{ padding: 24, fontSize: 13, color: '#64748b' }}>Buku PDF tidak ditemukan di katalog (mungkin disembunyikan admin).</div>;
  }
  if (bukuId && memuat) {
    return <div style={{ padding: 24, fontSize: 13, color: '#64748b' }}>memuat buku…</div>;
  }
  if (buku) {
    return (
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '16px 12px' }}>
        <button type="button" onClick={() => navigate(mode === 'guru' ? -1 : '/siswa/buku-pdf')} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', color: '#6b7280', cursor: 'pointer', marginBottom: 10, fontSize: 12.5 }}>
          <ArrowLeft size={15} /> Kembali ke rak buku PDF
        </button>
        <h1 style={{ fontSize: 19, fontWeight: 800, color: '#1e293b', margin: '0 0 4px' }}>{buku.emoji} {buku.judul}</h1>
        <p style={{ fontSize: 11.5, color: '#64748b', margin: '0 0 12px' }}>
          {buku.mapel} · {buku.jenjang} Kelas {buku.kelas} · Semester {buku.semester} · {buku.kurikulum} · {buku.totalHalaman} halaman
        </p>
        <FlipbookBukuPdf buku={buku} mode={mode} />
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '16px 12px' }}>
      <h1 style={{ display: 'flex', alignItems: 'center', gap: 9, fontSize: 19, fontWeight: 800, color: '#1e293b', margin: '0 0 4px' }}>
        <BookOpen size={21} color="#f97316" /> Rak Buku PDF Gemilang
      </h1>
      <p style={{ fontSize: 11.5, color: '#64748b', margin: '0 0 14px' }}>
        Buku konvensional digital: baca & balik halaman seperti buku cetak. Kunci & pembahasan tersimpan untuk guru.
      </p>
      {memuat && <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 8 }}>memuat rak…</div>}
      {!memuat && katalog.length === 0 && (
        <div style={{ fontSize: 12.5, color: '#64748b', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 10, padding: 12 }}>
          Rak masih kosong. Owner/admin mengunggah buku PDF lewat <b>Admin → Buku PDF Gemilang</b>; begitu diunggah, buku langsung muncul di sini tanpa deploy.
        </div>
      )}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 12 }}>
        {katalog.map((b) => (
          <button
            key={b.id}
            type="button"
            onClick={() => navigate(mode === 'guru' ? `/guru/buku-pdf/${b.id}` : `/siswa/buku-pdf/${b.id}`)}
            style={{ border: '1px solid #e2e8f0', borderRadius: 14, padding: 14, background: '#fff', textAlign: 'left', cursor: 'pointer', boxShadow: '0 2px 10px rgba(15,23,42,0.05)' }}
          >
            <div style={{ fontSize: 30 }}>{b.emoji}</div>
            <b style={{ fontSize: 13.5, color: '#0f172a', display: 'block', marginTop: 6, lineHeight: 1.35 }}>{b.judul}</b>
            <div style={{ fontSize: 11, color: '#64748b', marginTop: 4 }}>{b.mapel} · Kelas {b.kelas} · Sem {b.semester}</div>
            <div style={{ fontSize: 10.5, color: b.warna, fontWeight: 800, marginTop: 6 }}>{b.totalHalaman} halaman · bisa dibalik</div>
          </button>
        ))}
      </div>
    </div>
  );
}
