// src/pages/admin/buku/KelolaBukuPdfPage.jsx
// ============================================================
// KELOLA BUKU PDF GEMILANG (20 Okt 2026): owner memutuskan MENGUNGGAH
// SENDIRI buku PDF-nya ("aku aja yang upload, kasih tahu tempatnya").
// Halaman ini tempatnya: unggah PDF -> storage publik + katalog
// Firestore `buku_pdf` -> flipbook siswa & guru langsung melihatnya
// tanpa deploy. Rentang halaman pembahasan disembunyikan dari siswa.
// ============================================================
import React, { useEffect, useState } from 'react';
import { db } from '../../../firebase';
import { FileUp, Trash2, ExternalLink, Loader2, BookOpen } from 'lucide-react';
import { unggahPdfBuku, muatKatalogBukuPdf, simpanKatalogBukuPdf, perbaruiKatalogBukuPdf } from '../../../services/bukuPdfService';
import { rentangPembahasanDariInput } from '../../../utils/bukuPdfFlip';

const st = {
  kartu: { background: '#fff', border: '1px solid #e5e7eb', borderRadius: 14, padding: 16, marginBottom: 14 },
  label: { display: 'block', fontSize: 11, fontWeight: 800, color: '#475569', marginBottom: 4 },
  input: { width: '100%', padding: '9px 10px', borderRadius: 9, border: '1px solid #cbd5e1', fontSize: 12.5, boxSizing: 'border-box' },
  tombol: (mati) => ({
    background: mati ? '#cbd5e1' : '#f97316', color: '#fff', border: 'none', borderRadius: 10,
    padding: '10px 16px', fontSize: 13, fontWeight: 800, cursor: mati ? 'not-allowed' : 'pointer',
    display: 'inline-flex', alignItems: 'center', gap: 8,
  }),
  kecil: { border: '1px solid #cbd5e1', background: '#fff', borderRadius: 8, padding: '4px 9px', fontSize: 11, fontWeight: 700, cursor: 'pointer', color: '#334155' },
};

export default function KelolaBukuPdfPage() {
  const [daftar, setDaftar] = useState([]);
  const [sibuk, setSibuk] = useState(false);
  const [pesan, setPesan] = useState('');
  const [form, setForm] = useState({
    judul: '', mapel: 'Matematika', jenjang: 'SMP/MTs', kelas: 9, semester: 1,
    rentang: '', emoji: '📙', keterangan: '',
  });
  const [file, setFile] = useState(null);

  const muat = async () => {
    try {
      setDaftar(await muatKatalogBukuPdf(db, false));
    } catch (e) {
      setPesan(`✗ Gagal memuat katalog: ${e?.message || e}`);
    }
  };
  useEffect(() => { muat(); }, []);

  const unggah = async () => {
    if (!file || !form.judul.trim()) { setPesan('⚠ Pilih berkas PDF dan isi judul dulu.'); return; }
    setSibuk(true); setPesan('… mengunggah PDF & menghitung halaman');
    try {
      const { url, totalHalaman } = await unggahPdfBuku(file, form.judul);
      const range = rentangPembahasanDariInput(form.rentang);
      await simpanKatalogBukuPdf(db, {
        judul: form.judul.trim(), mapel: form.mapel, jenjang: form.jenjang,
        kelas: Number(form.kelas) || 0, semester: Number(form.semester) || 1,
        url, totalHalaman: totalHalaman || Number(form.rentang ? 0 : 0) || totalHalaman,
        rangePembahasan: range, emoji: form.emoji || '📙', keterangan: form.keterangan || '',
      });
      setPesan(`✓ Buku terbit di rak siswa & guru (${totalHalaman} halaman; pembahasan hal ${range[0] || '-'}–${range[1] || '-'} disembunyikan dari siswa).`);
      setFile(null);
      setForm({ ...form, judul: '', rentang: '', keterangan: '' });
      await muat();
    } catch (e) {
      setPesan(`✗ ${e?.message || e}`);
    } finally {
      setSibuk(false);
    }
  };

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '24px 16px' }}>
      <h1 style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 21, fontWeight: 800, color: '#1e293b', margin: '0 0 6px' }}>
        <BookOpen size={22} color="#f97316" /> Kelola Buku PDF Gemilang
      </h1>
      <p style={{ fontSize: 12, color: '#6b7280', margin: '0 0 16px', lineHeight: 1.6 }}>
        Unggah buku PDF konvensional di sini; siswa membacanya sebagai buku yang bisa
        dibalik (full layar HP), guru mendapat mode lengkap dengan kunci & pembahasan.
        Tidak perlu deploy — katalog tersimpan di sistem dan langsung hidup.
      </p>

      <div style={st.kartu}>
        <div style={st.label}>1 · BERKAS PDF BUKU</div>
        <input type="file" accept="application/pdf,.pdf" onChange={(e) => setFile(e.target.files?.[0] || null)} />
        {file && <div style={{ fontSize: 11.5, color: '#374151', marginTop: 6 }}>{file.name} · {(file.size / 1024 / 1024).toFixed(1)} MB</div>}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 12 }}>
          <label style={st.label}>Judul buku
            <input style={st.input} value={form.judul} onChange={(e) => setForm({ ...form, judul: e.target.value })} placeholder="mis. Master Matematika SMP 9 — Semester 1" />
          </label>
          <label style={st.label}>Mata pelajaran
            <input style={st.input} value={form.mapel} onChange={(e) => setForm({ ...form, mapel: e.target.value })} />
          </label>
          <label style={st.label}>Jenjang
            <select style={st.input} value={form.jenjang} onChange={(e) => setForm({ ...form, jenjang: e.target.value })}>
              {['SD/MI', 'SMP/MTs', 'SMA/MA', 'SMK'].map((j) => <option key={j}>{j}</option>)}
            </select>
          </label>
          <label style={st.label}>Kelas
            <input style={st.input} inputMode="numeric" value={form.kelas} onChange={(e) => setForm({ ...form, kelas: e.target.value })} />
          </label>
          <label style={st.label}>Rentang halaman KUNCI & PEMBAHASAN (disembunyikan dari siswa)
            <input style={st.input} value={form.rentang} onChange={(e) => setForm({ ...form, rentang: e.target.value })} placeholder="mis. 69-81 (kosongkan bila tiada)" />
          </label>
          <label style={st.label}>Emoji sampul
            <input style={st.input} value={form.emoji} onChange={(e) => setForm({ ...form, emoji: e.target.value })} />
          </label>
        </div>
        <div style={{ marginTop: 12 }}>
          <button style={st.tombol(sibuk || !file)} disabled={sibuk || !file} onClick={unggah}>
            {sibuk ? <Loader2 size={15} className="animate-spin" /> : <FileUp size={15} />} Unggah & terbitkan ke rak
          </button>
        </div>
        {pesan && <div style={{ fontSize: 12, marginTop: 10, color: pesan.startsWith('✗') || pesan.startsWith('⚠') ? '#991b1b' : '#166534' }}>{pesan}</div>}
      </div>

      <div style={st.kartu}>
        <div style={st.label}>2 · KATALOG TERBIT ({daftar.length})</div>
        {daftar.map((b) => (
          <div key={b.id} style={{ display: 'flex', gap: 10, alignItems: 'center', justifyContent: 'space-between', border: '1px solid #f1f5f9', borderRadius: 10, padding: '10px 12px', marginBottom: 8, flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: 200 }}>
              <b style={{ fontSize: 13 }}>{b.emoji} {b.judul}</b>
              <div style={{ fontSize: 11, color: '#64748b' }}>
                {b.mapel} · {b.jenjang} Kelas {b.kelas} · Sem {b.semester} · {b.totalHalaman || '?'} hal
                {b.rangePembahasan?.length === 2 ? ` · pembahasan hal ${b.rangePembahasan[0]}–${b.rangePembahasan[1]} (guru saja)` : ''}
                {' · '}<span style={{ color: b.status === 'aktif' ? '#16a34a' : '#d97706', fontWeight: 700 }}>{b.status}</span>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              <a href={`/guru/buku-pdf/${b.id}`} style={st.kecil}>mode guru <ExternalLink size={11} style={{ verticalAlign: -2 }} /></a>
              <button style={st.kecil} onClick={async () => { await perbaruiKatalogBukuPdf(db, b.id, { status: b.status === 'aktif' ? 'draft' : 'aktif' }); await muat(); }}>
                {b.status === 'aktif' ? 'sembunyikan' : 'terbitkan'}
              </button>
              <button style={{ ...st.kecil, color: '#dc2626' }} title="hapus entri katalog (berkas storage tetap)" onClick={async () => { if (window.confirm(`Hapus "${b.judul}" dari rak?`)) { await perbaruiKatalogBukuPdf(db, b.id, { status: 'dihapus' }); await muat(); } }}>
                <Trash2 size={12} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
