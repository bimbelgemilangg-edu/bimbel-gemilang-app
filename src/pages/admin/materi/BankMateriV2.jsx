// src/pages/admin/materi/BankMateriV2.jsx
// ============================================================
// FASE 4.2 -- BANK MATERI (route /admin/bank-materi)
// Gudang file pusat sisi admin: upload sekali -> dipakai berulang
// lewat editor bab ("Pilih dari Bank") atau salin link. File lama
// (folder pdf/dokumen/gambar) ikut terlihat supaya bisa dipakai
// ulang tanpa upload dua kali. Lihat services/bankFileService.js
// ============================================================
import React, { useEffect, useRef, useState } from 'react';
import {
  Upload, Trash2, Link2, ExternalLink, Search, Presentation,
  FileText, Image as IconGambar, Video, File as IconFile, Archive,
} from 'lucide-react';
import {
  listBankFiles, uploadBankFile, hapusBankFile, formatUkuran,
} from '../../../services/bankFileService';
import {
  T, kartuDasar, halamanDasar, chip, tombolPill,
} from '../../student/belajar/tema';

const IKON = {
  slide: <Presentation size={17} />,
  pdf: <FileText size={17} />,
  gambar: <IconGambar size={17} />,
  video: <Video size={17} />,
  dokumen: <FileText size={17} />,
  lain: <IconFile size={17} />,
};

export default function BankMateriV2() {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cari, setCari] = useState('');
  const [filter, setFilter] = useState('semua');
  const [pesan, setPesan] = useState('');
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef(null);

  const muat = async () => {
    setLoading(true);
    setFiles(await listBankFiles());
    setLoading(false);
  };
  useEffect(() => {
    let hidup = true;
    (async () => {
      const f = await listBankFiles();
      if (hidup) { setFiles(f); setLoading(false); }
    })();
    return () => { hidup = false; };
  }, []);

  const upload = async (file) => {
    if (!file) return;
    setUploading(true);
    setPesan('');
    try {
      await uploadBankFile(file);
      setPesan(`✅ ${file.name} masuk bank.`);
      await muat();
    } catch (e) {
      setPesan(`Upload gagal: ${e.message}`);
    }
    setUploading(false);
  };

  const hapus = async (f) => {
    if (!window.confirm(
      `Hapus "${f.name}" dari bank?\nBila file masih dipakai bab tertentu, tampilannya akan kosong.`
    )) return;
    try {
      await hapusBankFile(f.path);
      await muat();
    } catch (e) {
      setPesan(`Gagal hapus: ${e.message}`);
    }
  };

  const salin = async (url) => {
    try {
      await navigator.clipboard.writeText(url);
      setPesan('🔗 Link file tersalin.');
    } catch {
      setPesan('Salin gagal — buka link lalu salin manual.');
    }
  };

  const terlihat = files.filter((f) => {
    if (filter !== 'semua' && f.jenis !== filter) return false;
    if (cari.trim() && !f.name.toLowerCase().includes(cari.trim().toLowerCase())) return false;
    return true;
  });

  return (
    <div style={halamanDasar}>
      <div style={S.hero}>
        <div style={S.heroIkon}><Archive size={22} /></div>
        <div style={{ flex: 1 }}>
          <h1 style={S.heroJudul}>Bank Materi</h1>
          <p style={S.heroSub}>
            Gudang file pusat: upload sekali, pakai berulang di bab
            mana pun lewat editor (“Pilih dari Bank”). File lama ikut
            terlihat agar tidak upload dua kali.
          </p>
        </div>
        <input ref={fileRef} type="file" style={{ display: 'none' }}
          onChange={(e) => upload(e.target.files?.[0])} />
        <button type="button" style={tombolPill('primer')}
          disabled={uploading}
          onClick={() => fileRef.current?.click()}>
          <Upload size={15} /> {uploading ? 'Mengunggah…' : 'Upload ke Bank'}
        </button>
      </div>

      <div style={S.isi}>
        {pesan && (
          <div style={pesan.startsWith('✅') || pesan.startsWith('🔗') ? S.ok : S.err}>
            {pesan}
          </div>
        )}
        <div style={S.cariWrap}>
          <Search size={15} color={T.samar} />
          <input value={cari} onChange={(e) => setCari(e.target.value)}
            placeholder="Cari nama file..." style={S.cariInput} />
        </div>
        <div style={S.chipRow}>
          {['semua', 'slide', 'pdf', 'gambar', 'video', 'dokumen'].map((k) => (
            <button key={k} type="button" style={chip(filter === k)}
              onClick={() => setFilter(k)}>
              {k}
            </button>
          ))}
        </div>

        {loading ? (
          <div style={S.kosong}>Memuat bank file...</div>
        ) : terlihat.length === 0 ? (
          <div style={S.kosong}>
            Belum ada file yang cocok. Upload PPT/PDF/gambar/video
            untuk memulai bank materimu.
          </div>
        ) : (
          <div style={S.grid}>
            {terlihat.map((f) => (
              <div key={f.path} style={S.kartu}>
                <div style={S.kartuTop}>
                  <span style={S.fileIkon(f.jenis)}>{IKON[f.jenis]}</span>
                  <span style={S.jenisChip}>{f.jenis}</span>
                </div>
                <div style={S.nama} title={f.name}>{f.name}</div>
                <div style={S.meta}>
                  {formatUkuran(f.ukuran)}
                  {f.updated ? ` • ${String(f.updated).slice(0, 10)}` : ''}
                </div>
                <div style={S.btnRow}>
                  <button type="button" style={S.btnKecil} onClick={() => salin(f.url)}>
                    <Link2 size={12} /> Salin
                  </button>
                  <a href={f.url} target="_blank" rel="noreferrer" style={S.btnKecil}>
                    <ExternalLink size={12} /> Buka
                  </a>
                  <button type="button" style={{ ...S.btnKecil, color: '#B91C1C' }}
                    onClick={() => hapus(f)}>
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

const S = {
  hero: {
    display: 'flex', gap: 13, alignItems: 'center', flexWrap: 'wrap',
    padding: '20px 22px', background: T.gradasiHero,
  },
  heroIkon: {
    width: 46, height: 46, borderRadius: 13, background: 'rgba(255,255,255,.18)',
    border: '1px solid rgba(255,255,255,.28)', color: '#fff',
    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  heroJudul: { margin: 0, color: '#fff', fontSize: 20, fontWeight: 800 },
  heroSub: { margin: '3px 0 0', color: 'rgba(255,255,255,.8)', fontSize: 12, lineHeight: 1.5 },
  isi: { padding: '16px 18px 40px', maxWidth: 1050, margin: '0 auto' },
  ok: {
    background: T.hijauLatar, border: `1px solid ${T.hijauGaris}`,
    color: T.hijauTeks, borderRadius: 10, padding: '9px 13px',
    fontSize: 12.5, marginBottom: 12,
  },
  err: {
    background: T.merahLatar, border: `1px solid ${T.merahGaris}`,
    color: '#B91C1C', borderRadius: 10, padding: '9px 13px',
    fontSize: 12.5, marginBottom: 12,
  },
  cariWrap: {
    display: 'flex', alignItems: 'center', gap: 8, background: '#fff',
    border: `1px solid ${T.garis}`, borderRadius: 999, padding: '10px 15px',
    marginBottom: 10,
  },
  cariInput: {
    flex: 1, minWidth: 0, border: 'none', outline: 'none',
    background: 'transparent', fontSize: 13, color: T.teks, fontFamily: 'inherit',
  },
  chipRow: {
    display: 'flex', gap: 7, overflowX: 'auto', paddingBottom: 4,
    marginBottom: 14, scrollbarWidth: 'none',
  },
  kosong: {
    textAlign: 'center', color: T.samar, ...kartuDasar,
    padding: '34px 20px', fontSize: 13, lineHeight: 1.7,
  },
  grid: { display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fill,minmax(220px,1fr))' },
  kartu: { ...kartuDasar, padding: 13, display: 'flex', flexDirection: 'column', gap: 7 },
  kartuTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  fileIkon: (jenis) => ({
    width: 38, height: 38, borderRadius: 11,
    background: jenis === 'slide' ? T.kotakBiru
      : jenis === 'pdf' ? T.merahLatar
        : jenis === 'gambar' ? T.hijauLatar
          : jenis === 'video' ? '#F3E8FF' : T.latar,
    color: jenis === 'slide' ? T.biruDalam
      : jenis === 'pdf' ? '#B91C1C'
        : jenis === 'gambar' ? T.hijauTeks
          : jenis === 'video' ? '#7C3AED' : T.samar,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  }),
  jenisChip: {
    background: T.latar, border: `1px solid ${T.garis}`, color: T.samar,
    borderRadius: 999, padding: '2px 9px', fontSize: 9.5, fontWeight: 800,
  },
  nama: {
    fontWeight: 700, fontSize: 12.5, color: T.judul, lineHeight: 1.4,
    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
  },
  meta: { fontSize: 10.5, color: T.samar },
  btnRow: { display: 'flex', gap: 6, marginTop: 2 },
  btnKecil: {
    display: 'inline-flex', gap: 4, alignItems: 'center',
    background: '#fff', border: `1px solid ${T.garis}`, color: T.teks,
    borderRadius: 8, padding: '5px 9px', fontSize: 10.5, fontWeight: 700,
    cursor: 'pointer', fontFamily: 'inherit', textDecoration: 'none',
  },
};
