// src/pages/admin/buku/ManajerBuku.jsx
// ============================================================
// MANAJER BUKU DIGITAL v3 -- DENGAN DUKUNGAN GAMBAR
// Satu-satunya pintu operasional konten buku. Semua isi buku
// hidup di Firestore (buku_digital + subkoleksi bab), TIDAK ADA
// file statis di bundle. Tambah/ubah buku & bab = kerjaan di
// halaman ini, langsung terbit ke siswa TANPA deploy.
//
// DUKUNGAN GAMBAR (baru):
//  - Upload file gambar ke Firebase Storage -> dapat URL publik.
//  - Atau tempel URL gambar eksternal mana pun.
//  - Setiap gambar punya tombol "Salin URL" dan "Salin snippet
//    visual" berupa potongan JSON  "visual": { tipe: "gambar", ... }
//    yang tinggal ditempel ke dalam object soal di JSON bab.
//  - Reader siswa (VisualBuku.jsx) sudah bisa merender visual
//    tipe "gambar", jadi alurnya end-to-end tanpa kode tambahan.
//
// Skema Firestore:
//   buku_digital/{bookId}              -> metadata buku
//   buku_digital/{bookId}/bab/{babId}  -> isi bab (sections + ujiPemahaman)
// Storage:
//   buku-digital/{bookId}/{timestamp}_{namaFile}
// ============================================================
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../../../firebase';
import { collection, getDocs, doc, setDoc, deleteDoc, writeBatch } from 'firebase/firestore';
import { getStorage, ref as sRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import {
  ArrowLeft, Plus, Pencil, Trash2, Save, X, BookOpen, Layers, Eye,
  ImageIcon, Upload, Copy, Link2, FileCode
} from 'lucide-react';

const JENJANG_OPSI = ['SD/MI', 'SMP/MTs', 'SMA/MA', 'SMK', 'UTBK/SNBT'];
const TIPE_BLOK = ['p', 'list', 'math', 'contoh', 'tips'];
const TIPE_SOAL = ['pg', 'multi', 'bs'];
const TIPE_VISUAL = ['termometer', 'tabel', 'bangun', 'garis', 'gambar'];

const CONTOH_JSON_BAB = `[
  {
    "id": "bab-7",
    "judul": "Statistika",
    "urutan": 7,
    "sections": [
      {
        "id": "bab-7-a",
        "judul": "A. Menyajikan Data",
        "blocks": [
          { "tipe": "p", "teks": "Paragraf materi. LaTeX inline boleh: $...$" },
          { "tipe": "list", "items": ["poin pertama", "poin kedua"] },
          { "tipe": "contoh", "teks": "Contoh soal beserta langkahnya." },
          { "tipe": "tips", "teks": "Tips cepat mengerjakan." }
        ]
      }
    ],
    "ujiPemahaman": [
      { "id": "u1", "tipe": "pg", "level": "mudah", "soal": "Teks soal...", "pilihan": ["A", "B", "C", "D"], "benar": 0, "pembahasan": "Langkah pembahasan..." },
      { "id": "u2", "tipe": "multi", "level": "sedang", "soal": "Teks soal...", "pilihan": ["opsi1", "opsi2", "opsi3"], "benar": [0, 2], "pembahasan": "..." },
      { "id": "u3", "tipe": "bs", "level": "sulit", "soal": "Teks soal...", "pernyataan": ["pernyataan 1", "pernyataan 2"], "benar": [true, false], "pembahasan": "..." }
    ]
  }
]`;

// ============================================================
// VALIDASI KETAT -- penjaga akurasi konten: kunci jawaban di luar
// range, blok aneh, visual cacat = DITOLAK dengan pesan jelas,
// bukan lolos lalu membingungkan siswa di reader.
// ============================================================
function validasiBab(obj) {
  const err = [];
  if (!obj || typeof obj !== 'object') return ['JSON tidak valid / bukan object.'];
  if (!obj.id || typeof obj.id !== 'string') err.push('Field "id" wajib (string, mis. "bab-7").');
  if (!obj.judul) err.push('Field "judul" wajib.');
  if (!Array.isArray(obj.sections) || obj.sections.length === 0) err.push('"sections" wajib array minimal 1 isi.');
  (obj.sections || []).forEach((s, i) => {
    if (!s.id) err.push(`sections[${i}].id wajib.`);
    if (!s.judul) err.push(`sections[${i}].judul wajib.`);
    if (!Array.isArray(s.blocks) || s.blocks.length === 0) err.push(`sections[${i}].blocks wajib array minimal 1 isi.`);
    (s.blocks || []).forEach((b, j) => {
      if (!TIPE_BLOK.includes(b.tipe)) err.push(`sections[${i}].blocks[${j}].tipe harus salah satu: ${TIPE_BLOK.join(', ')}.`);
      if (b.tipe === 'list') {
        if (!Array.isArray(b.items) || !b.items.length) err.push(`sections[${i}].blocks[${j}] tipe "list" butuh "items" array.`);
      } else if (!b.teks) {
        err.push(`sections[${i}].blocks[${j}] butuh "teks".`);
      }
    });
  });
  if (!Array.isArray(obj.ujiPemahaman)) err.push('"ujiPemahaman" wajib array (boleh [] kalau memang belum ada soal).');
  (obj.ujiPemahaman || []).forEach((q, i) => {
    const t = `ujiPemahaman[${i}]`;
    if (!q.id) err.push(`${t}.id wajib.`);
    if (!TIPE_SOAL.includes(q.tipe)) err.push(`${t}.tipe harus pg / multi / bs.`);
    if (!q.soal) err.push(`${t}.soal wajib.`);
    if (!q.pembahasan) err.push(`${t}.pembahasan wajib (siswa belajar dari sini).`);
    if (q.tipe === 'pg') {
      if (!Array.isArray(q.pilihan) || q.pilihan.length < 2) err.push(`${t}.pilihan minimal 2.`);
      if (!Number.isInteger(q.benar) || q.benar < 0 || q.benar >= (q.pilihan || []).length) err.push(`${t}.benar harus index angka di dalam range pilihan.`);
    }
    if (q.tipe === 'multi') {
      if (!Array.isArray(q.pilihan) || q.pilihan.length < 2) err.push(`${t}.pilihan minimal 2.`);
      if (!Array.isArray(q.benar) || q.benar.length === 0) err.push(`${t}.benar harus array index (tidak kosong).`);
      else if (q.benar.some((x) => !Number.isInteger(x) || x < 0 || x >= (q.pilihan || []).length)) err.push(`${t}.benar ada index di luar range pilihan.`);
    }
    if (q.tipe === 'bs') {
      if (!Array.isArray(q.pernyataan) || q.pernyataan.length === 0) err.push(`${t}.pernyataan wajib array.`);
      if (!Array.isArray(q.benar) || q.benar.length !== (q.pernyataan || []).length) err.push(`${t}.benar harus array boolean sepanjang pernyataan.`);
      else if (q.benar.some((x) => typeof x !== 'boolean')) err.push(`${t}.benar hanya boleh berisi true/false.`);
    }
    if (q.visual && !TIPE_VISUAL.includes(q.visual.tipe)) err.push(`${t}.visual.tipe harus: ${TIPE_VISUAL.join(' / ')}.`);
    if (q.visual?.tipe === 'tabel' && (!Array.isArray(q.visual.kepala) || !Array.isArray(q.visual.baris))) err.push(`${t}.visual tabel butuh "kepala" & "baris".`);
    if (q.visual?.tipe === 'termometer' && !Array.isArray(q.visual.data)) err.push(`${t}.visual termometer butuh "data".`);
    if (q.visual?.tipe === 'bangun' && (!Array.isArray(q.visual.titik) || !Array.isArray(q.visual.sisi))) err.push(`${t}.visual bangun butuh "titik" & "sisi".`);
    if (q.visual?.tipe === 'garis' && !Array.isArray(q.visual.titik)) err.push(`${t}.visual garis butuh "titik".`);
    if (q.visual?.tipe === 'gambar' && !q.visual.src) err.push(`${t}.visual gambar butuh "src" (URL gambar).`);
  });
  return err;
}

const slugify = (s) => String(s || '').toLowerCase().trim()
  .replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

export default function ManajerBuku() {
  const navigate = useNavigate();
  const fileRef = useRef(null);

  const [daftarBuku, setDaftarBuku] = useState([]);
  const [loading, setLoading] = useState(true);
  const [bukuDipilih, setBukuDipilih] = useState(null);
  const [babList, setBabList] = useState([]);

  const [modeFormBuku, setModeFormBuku] = useState(null); // null | 'baru' | object buku
  const [formBuku, setFormBuku] = useState({ judul: '', mapel: 'Matematika', jenjang: 'SMP/MTs', kelas: 9, emoji: '📘', warna: '#4C6EF5', deskripsi: '', status: 'aktif' });

  const [modeBab, setModeBab] = useState(null); // null | 'baru' | object bab
  const [teksJson, setTeksJson] = useState('');
  const [errValidasi, setErrValidasi] = useState([]);

  // ===== STATE MANAJER GAMBAR =====
  const [images, setImages] = useState([]);          // [{ url, name }]
  const [uploading, setUploading] = useState(false);
  const [externalUrl, setExternalUrl] = useState('');
  const [pesanGambar, setPesanGambar] = useState('');

  const muatBuku = async () => {
    setLoading(true);
    try {
      const snap = await getDocs(collection(db, 'buku_digital'));
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      list.sort((a, b) => (a.urutan || 0) - (b.urutan || 0) || String(a.judul).localeCompare(String(b.judul)));
      setDaftarBuku(list);
    } catch (e) { console.error('Gagal muat daftar buku:', e); }
    setLoading(false);
  };

  const muatBab = async (bookId) => {
    try {
      const snap = await getDocs(collection(db, 'buku_digital', bookId, 'bab'));
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      list.sort((a, b) => (a.urutan || 0) - (b.urutan || 0));
      setBabList(list);
    } catch (e) { console.error('Gagal muat daftar bab:', e); setBabList([]); }
  };

  useEffect(() => { muatBuku(); }, []);

  const bukaBuku = (buku) => {
    setBukuDipilih(buku);
    setModeBab(null); setErrValidasi([]); setTeksJson('');
    setImages([]); setExternalUrl(''); setPesanGambar('');
    muatBab(buku.id);
  };

  const simpanBuku = async () => {
    if (!formBuku.judul || !formBuku.jenjang) { alert('Judul dan jenjang wajib diisi.'); return; }
    const id = formBuku.id || slugify(formBuku.judul);
    if (!id) { alert('Judul tidak bisa dijadikan id.'); return; }
    try {
      await setDoc(doc(db, 'buku_digital', id), {
        ...formBuku, id, kelas: Number(formBuku.kelas) || 9, updatedAt: Date.now(),
      }, { merge: true });
      setModeFormBuku(null);
      setFormBuku({ judul: '', mapel: 'Matematika', jenjang: 'SMP/MTs', kelas: 9, emoji: '📘', warna: '#4C6EF5', deskripsi: '', status: 'aktif' });
      muatBuku();
    } catch (e) { alert('Gagal simpan buku: ' + e.message); }
  };

  const hapusBuku = async (buku) => {
    if (!window.confirm(`Hapus buku "${buku.judul}" beserta semua babnya di Firestore? Progres siswa tidak dihapus.`)) return;
    try {
      const snap = await getDocs(collection(db, 'buku_digital', buku.id, 'bab'));
      const batch = writeBatch(db);
      snap.docs.forEach((d) => batch.delete(d.ref));
      batch.delete(doc(db, 'buku_digital', buku.id));
      await batch.commit();
      if (bukuDipilih?.id === buku.id) setBukuDipilih(null);
      muatBuku();
    } catch (e) { alert('Gagal hapus buku: ' + e.message); }
  };

  // BULK: terima 1 object bab ATAU array banyak bab sekaligus.
  const simpanBab = async () => {
    let parsed;
    try { parsed = JSON.parse(teksJson); } catch (e) { setErrValidasi(['JSON tidak bisa diparse: ' + e.message]); return; }
    const list = Array.isArray(parsed) ? parsed : [parsed];
    const allErr = [];
    const valid = [];
    list.forEach((obj, idx) => {
      const errs = validasiBab(obj);
      if (errs.length) allErr.push(...errs.map((e) => `[input #${idx + 1}${obj?.id ? ' (' + obj.id + ')' : ''}] ${e}`));
      else valid.push(obj);
    });
    setErrValidasi(allErr);
    if (allErr.length) return;
    try {
      for (let i = 0; i < valid.length; i++) {
        const obj = valid[i];
        const urutan = obj.urutan != null ? Number(obj.urutan) : babList.length + i;
        await setDoc(doc(db, 'buku_digital', bukuDipilih.id, 'bab', obj.id), {
          id: obj.id, judul: obj.judul, urutan,
          sections: obj.sections, ujiPemahaman: obj.ujiPemahaman,
          sumber: obj.sumber || 'admin', updatedAt: Date.now(),
        }, { merge: true });
      }
      setModeBab(null); setTeksJson(''); setErrValidasi([]);
      muatBab(bukuDipilih.id);
      alert(`✅ ${valid.length} bab tersimpan ke Firestore & langsung terbit ke siswa.`);
    } catch (e) { alert('Gagal simpan: ' + e.message); }
  };

  const hapusBab = async (bab) => {
    if (!window.confirm(`Hapus bab "${bab.judul}" dari Firestore?`)) return;
    try {
      await deleteDoc(doc(db, 'buku_digital', bukuDipilih.id, 'bab', bab.id));
      muatBab(bukuDipilih.id);
    } catch (e) { alert('Gagal hapus bab: ' + e.message); }
  };

  // ============================================================
  // MANAJER GAMBAR
  // ============================================================
  const salin = async (teks, label) => {
    try {
      await navigator.clipboard.writeText(teks);
      setPesanGambar(`✅ ${label} disalin ke clipboard.`);
    } catch (e) {
      // Fallback kalau clipboard API tidak tersedia
      window.prompt('Salin manual teks di bawah ini:', teks);
    }
    setTimeout(() => setPesanGambar(''), 2500);
  };

  const uploadGambar = async (files) => {
    if (!files || files.length === 0) return;
    setUploading(true);
    setPesanGambar('');
    const hasil = [];
    try {
      const storage = getStorage();
      for (const f of Array.from(files)) {
        const path = `buku-digital/${bukuDipilih.id}/${Date.now()}_${f.name}`;
        const r = sRef(storage, path);
        await uploadBytes(r, f);
        const url = await getDownloadURL(r);
        hasil.push({ url, name: f.name });
      }
      setImages((prev) => [...prev, ...hasil]);
      setPesanGambar(`✅ ${hasil.length} gambar terupload. Pakai tombol salin di bawah untuk memasangnya ke JSON.`);
    } catch (e) {
      console.error('Gagal upload gambar:', e);
      setPesanGambar('❌ Gagal upload ke Firebase Storage: ' + (e?.message || e) + '. Pastikan Storage aktif di project Firebase, atau pakai URL eksternal di bawah.');
    }
    setUploading(false);
    if (fileRef.current) fileRef.current.value = '';
    setTimeout(() => setPesanGambar(''), 6000);
  };

  const tambahUrlExternal = () => {
    const u = externalUrl.trim();
    if (!u.startsWith('http')) { setPesanGambar('❌ URL harus diawali http/https.'); return; }
    setImages((prev) => [...prev, { url: u, name: 'eksternal' }]);
    setExternalUrl('');
    setPesanGambar('✅ URL eksternal ditambahkan.');
    setTimeout(() => setPesanGambar(''), 2500);
  };

  const snippetVisual = (url) => `"visual": { "tipe": "gambar", "src": "${url}", "alt": "" }`;

  // ============================================================
  // RENDER
  // ============================================================
  return (
    <div style={st.page}>
      <div style={st.header}>
        <button onClick={() => navigate('/admin')} style={st.backBtn}><ArrowLeft size={18} /></button>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 17, fontWeight: 800, color: '#1e293b', display: 'flex', alignItems: 'center', gap: 8 }}>
            <BookOpen size={20} color="#4C6EF5" /> Manajer Buku Digital
          </div>
          <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>
            Tambah buku/bab + upload gambar — terbit ke siswa tanpa deploy.
          </div>
        </div>
        <button onClick={() => { setModeFormBuku('baru'); setFormBuku({ judul: '', mapel: 'Matematika', jenjang: 'SMP/MTs', kelas: 9, emoji: '📘', warna: '#4C6EF5', deskripsi: '', status: 'aktif' }); }} style={st.btnPrimary}>
          <Plus size={15} /> Buku Baru
        </button>
      </div>

      {modeFormBuku && (
        <div style={st.card}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <div style={{ fontSize: 13, fontWeight: 800, color: '#1e293b' }}>{modeFormBuku === 'baru' ? 'Buku Baru' : 'Edit Buku'}</div>
            <button onClick={() => setModeFormBuku(null)} style={st.iconBtn}><X size={15} /></button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <label style={st.label}>Judul buku
              <input style={st.input} value={formBuku.judul} onChange={(e) => setFormBuku({ ...formBuku, judul: e.target.value })} placeholder="Buku TKA Matematika Kelas 9 SMP" />
            </label>
            <label style={st.label}>Mapel
              <input style={st.input} value={formBuku.mapel} onChange={(e) => setFormBuku({ ...formBuku, mapel: e.target.value })} />
            </label>
            <label style={st.label}>Jenjang (filter siswa)
              <select style={st.input} value={formBuku.jenjang} onChange={(e) => setFormBuku({ ...formBuku, jenjang: e.target.value })}>
                {JENJANG_OPSI.map((j) => <option key={j} value={j}>{j}</option>)}
              </select>
            </label>
            <label style={st.label}>Kelas minimum (filter siswa)
              <input style={st.input} type="number" value={formBuku.kelas} onChange={(e) => setFormBuku({ ...formBuku, kelas: e.target.value })} />
            </label>
            <label style={st.label}>Emoji cover
              <input style={st.input} value={formBuku.emoji} onChange={(e) => setFormBuku({ ...formBuku, emoji: e.target.value })} />
            </label>
            <label style={st.label}>Warna cover
              <input style={{ ...st.input, padding: 4 }} type="color" value={formBuku.warna} onChange={(e) => setFormBuku({ ...formBuku, warna: e.target.value })} />
            </label>
            <label style={{ ...st.label, gridColumn: '1 / -1' }}>Deskripsi singkat
              <input style={st.input} value={formBuku.deskripsi} onChange={(e) => setFormBuku({ ...formBuku, deskripsi: e.target.value })} />
            </label>
            <label style={st.label}>Status
              <select style={st.input} value={formBuku.status} onChange={(e) => setFormBuku({ ...formBuku, status: e.target.value })}>
                <option value="aktif">aktif (terlihat siswa)</option>
                <option value="draft">draft (tersembunyi)</option>
              </select>
            </label>
          </div>
          <button onClick={simpanBuku} style={{ ...st.btnPrimary, marginTop: 12 }}><Save size={15} /> Simpan Buku</button>
        </div>
      )}

      <div style={{ padding: '0 16px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {loading ? <div style={st.kosong}>Memuat daftar buku...</div> : daftarBuku.length === 0 ? (
          <div style={st.kosong}>
            Belum ada buku di Firestore.<br />
            Klik <b>Buku Baru</b> untuk membuat buku pertama, lalu tambah bab lewat tombol <b>Bab (Paste JSON)</b>.
          </div>
        ) : daftarBuku.map((b) => (
          <div key={b.id} style={{ ...st.card, marginBottom: 0, borderLeft: `5px solid ${b.warna || '#4C6EF5'}` }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 44, height: 56, borderRadius: 8, background: `linear-gradient(135deg, ${b.warna || '#4C6EF5'}, #1E1B4B)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>{b.emoji || '📘'}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13.5, fontWeight: 800, color: '#1e293b' }}>{b.judul}</div>
                <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>
                  {b.mapel} • {b.jenjang} • Kelas {b.kelas} •{' '}
                  <span style={{ color: b.status === 'aktif' ? '#16a34a' : '#d97706', fontWeight: 700 }}>{b.status}</span>
                </div>
              </div>
              <button onClick={() => bukaBuku(b)} style={st.btnSmall}><Layers size={13} /> Kelola Bab</button>
              <button onClick={() => { setModeFormBuku(b); setFormBuku({ ...b }); }} style={st.iconBtn} title="Edit buku"><Pencil size={14} /></button>
              <button onClick={() => hapusBuku(b)} style={{ ...st.iconBtn, color: '#dc2626' }} title="Hapus buku"><Trash2 size={14} /></button>
            </div>
          </div>
        ))}
      </div>

      {bukuDipilih && (
        <div style={st.panel}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <div style={{ fontSize: 13, fontWeight: 800, color: '#1e293b' }}>
              {bukuDipilih.emoji} {bukuDipilih.judul} — Daftar Bab ({babList.length})
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              <button onClick={() => { setModeBab('baru'); setTeksJson(''); setErrValidasi([]); setImages([]); setPesanGambar(''); }} style={st.btnPrimary}><Plus size={14} /> Bab (Paste JSON)</button>
              <button onClick={() => setBukuDipilih(null)} style={st.iconBtn}><X size={15} /></button>
            </div>
          </div>

          {babList.map((bab, i) => (
            <div key={bab.id} style={st.babRow}>
              <div style={{ width: 26, height: 26, borderRadius: 8, background: '#eef2ff', color: '#4338ca', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800, flexShrink: 0 }}>{i + 1}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12.5, fontWeight: 700, color: '#1e293b' }}>{bab.judul}</div>
                <div style={{ fontSize: 10.5, color: '#64748b' }}>
                  {(bab.sections || []).length} seksi • {(bab.ujiPemahaman || []).length} soal • sumber: {bab.sumber || '-'}
                </div>
              </div>
              <button onClick={() => window.open(`/siswa/buku/${bukuDipilih.id}/${bab.id}`, '_blank')} style={st.iconBtn} title="Buka di reader siswa (tab baru)"><Eye size={14} /></button>
              <button onClick={() => { setModeBab(bab); setTeksJson(JSON.stringify({ id: bab.id, judul: bab.judul, urutan: bab.urutan, sections: bab.sections, ujiPemahaman: bab.ujiPemahaman }, null, 2)); setErrValidasi([]); setImages([]); setPesanGambar(''); }} style={st.iconBtn} title="Edit JSON"><Pencil size={14} /></button>
              <button onClick={() => hapusBab(bab)} style={{ ...st.iconBtn, color: '#dc2626' }} title="Hapus bab"><Trash2 size={14} /></button>
            </div>
          ))}

          {modeBab && (
            <div style={{ marginTop: 12 }}>
              {/* ===== MANAJER GAMBAR ===== */}
              <div style={st.imgCard}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <ImageIcon size={16} color="#4C6EF5" />
                  <span style={{ fontSize: 12, fontWeight: 800, color: '#1e293b' }}>Manajer Gambar</span>
                  <span style={{ fontSize: 10, color: '#64748b' }}>— upload diagram/foto, lalu salin snippet-nya ke dalam object soal di JSON.</span>
                </div>

                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 8 }}>
                  <input ref={fileRef} type="file" accept="image/*" multiple style={{ display: 'none' }} onChange={(e) => uploadGambar(e.target.files)} />
                  <button onClick={() => fileRef.current?.click()} disabled={uploading} style={{ ...st.btnSecondary, opacity: uploading ? 0.6 : 1 }}>
                    <Upload size={14} /> {uploading ? 'Mengupload...' : 'Upload Gambar'}
                  </button>
                  <input style={{ ...st.input, flex: 1, minWidth: 180 }} placeholder="atau tempel URL gambar eksternal (https://...)" value={externalUrl} onChange={(e) => setExternalUrl(e.target.value)} />
                  <button onClick={tambahUrlExternal} style={st.btnSecondary}><Link2 size={14} /> Tambah URL</button>
                </div>

                {pesanGambar && <div style={{ fontSize: 11, color: pesanGambar.startsWith('✅') ? '#16a34a' : '#dc2626', marginBottom: 8 }}>{pesanGambar}</div>}

                {images.length > 0 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {images.map((img, idx) => (
                      <div key={idx} style={st.imgRow}>
                        <img src={img.url} alt={img.name} style={st.imgThumb} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 11, fontWeight: 700, color: '#1e293b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{img.name}</div>
                          <div style={{ fontSize: 9, color: '#94a3b8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{img.url}</div>
                        </div>
                        <button onClick={() => salin(img.url, 'URL')} style={st.btnTiny} title="Salin URL mentah"><Copy size={12} /> URL</button>
                        <button onClick={() => salin(snippetVisual(img.url), 'Snippet visual')} style={st.btnTiny} title="Salin snippet JSON visual gambar"><FileCode size={12} /> Snippet</button>
                        <button onClick={() => setImages((prev) => prev.filter((_, i) => i !== idx))} style={{ ...st.iconBtn, color: '#dc2626' }} title="Hapus dari daftar"><X size={13} /></button>
                      </div>
                    ))}
                  </div>
                )}

                <div style={{ fontSize: 10, color: '#64748b', marginTop: 8, lineHeight: 1.6 }}>
                  Cara pakai: klik <b>Snippet</b> pada gambar → tempel hasilnya DI DALAM object soal pada JSON di bawah, contoh:<br />
                  <code style={{ background: '#f1f5f9', padding: '2px 6px', borderRadius: 4 }}>{`{ "id": "u1", "tipe": "pg", "soal": "Perhatikan gambar!", "visual": { "tipe": "gambar", "src": "URL_DISINI", "alt": "" }, "pilihan": [...], "benar": 0, "pembahasan": "..." }`}</code>
                </div>
              </div>

              <details style={{ marginBottom: 8 }}>
                <summary style={{ fontSize: 11, color: '#4C6EF5', cursor: 'pointer', fontWeight: 700 }}>Lihat contoh format JSON bab</summary>
                <pre style={{ background: '#0f172a', color: '#e2e8f0', padding: 10, borderRadius: 8, fontSize: 10, overflowX: 'auto', marginTop: 6 }}>{CONTOH_JSON_BAB}</pre>
              </details>

              <textarea
                value={teksJson}
                onChange={(e) => setTeksJson(e.target.value)}
                placeholder={CONTOH_JSON_BAB}
                style={st.textarea}
              />

              {errValidasi.length > 0 && (
                <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: 10, marginTop: 8, maxHeight: 200, overflowY: 'auto' }}>
                  <div style={{ fontSize: 11, fontWeight: 800, color: '#991b1b', marginBottom: 4 }}>Perbaiki {errValidasi.length} masalah:</div>
                  {errValidasi.map((e, i) => <div key={i} style={{ fontSize: 11, color: '#b91c1c' }}>• {e}</div>)}
                </div>
              )}

              <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                <button onClick={simpanBab} style={st.btnPrimary}><Save size={14} /> Validasi & Simpan (1 atau banyak bab)</button>
                <button onClick={() => { setModeBab(null); setErrValidasi([]); }} style={st.btnSecondary}>Batal</button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

const st = {
  page: { minHeight: '100vh', background: '#f8fafc', fontFamily: 'sans-serif', paddingBottom: 40 },
  header: { display: 'flex', alignItems: 'center', gap: 10, padding: '14px 16px', background: 'white', borderBottom: '1px solid #e2e8f0', position: 'sticky', top: 0, zIndex: 10 },
  backBtn: { background: '#f1f5f9', border: 'none', borderRadius: 8, width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#475569' },
  btnPrimary: { display: 'flex', alignItems: 'center', gap: 6, background: '#4C6EF5', color: 'white', border: 'none', borderRadius: 8, padding: '8px 12px', fontSize: 12, fontWeight: 700, cursor: 'pointer' },
  btnSecondary: { display: 'flex', alignItems: 'center', gap: 6, background: '#f1f5f9', color: '#334155', border: 'none', borderRadius: 8, padding: '8px 12px', fontSize: 12, fontWeight: 700, cursor: 'pointer' },
  btnSmall: { display: 'flex', alignItems: 'center', gap: 5, background: '#eef2ff', color: '#4338ca', border: 'none', borderRadius: 8, padding: '6px 10px', fontSize: 11, fontWeight: 700, cursor: 'pointer' },
  btnTiny: { display: 'flex', alignItems: 'center', gap: 4, background: '#eef2ff', color: '#4338ca', border: 'none', borderRadius: 6, padding: '4px 8px', fontSize: 10, fontWeight: 700, cursor: 'pointer', flexShrink: 0 },
  iconBtn: { background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', padding: 6, display: 'flex', alignItems: 'center', justifyContent: 'center' },
  card: { background: 'white', borderRadius: 12, padding: 14, border: '1px solid #e2e8f0', marginBottom: 12, boxShadow: '0 1px 3px rgba(0,0,0,0.04)' },
  kosong: { textAlign: 'center', color: '#64748b', padding: '30px 16px', fontSize: 12.5, background: 'white', borderRadius: 12, border: '1px dashed #cbd5e1', lineHeight: 1.7 },
  label: { display: 'flex', flexDirection: 'column', gap: 4, fontSize: 11, fontWeight: 700, color: '#475569' },
  input: { border: '1px solid #cbd5e1', borderRadius: 8, padding: '8px 10px', fontSize: 12, color: '#1e293b', background: 'white' },
  textarea: { width: '100%', minHeight: 300, border: '1px solid #cbd5e1', borderRadius: 8, padding: 10, fontSize: 11, fontFamily: 'monospace', color: '#1e293b', background: 'white', boxSizing: 'border-box' },
  panel: { margin: '0 16px', background: 'white', borderRadius: 12, border: '1px solid #e2e8f0', padding: 14 },
  babRow: { display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', borderRadius: 10, border: '1px solid #eef2ff', background: '#f8fafc', marginBottom: 6 },
  imgCard: { background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 10, padding: 12, marginBottom: 12 },
  imgRow: { display: 'flex', alignItems: 'center', gap: 8, background: 'white', border: '1px solid #e2e8f0', borderRadius: 8, padding: 6 },
  imgThumb: { width: 44, height: 44, borderRadius: 6, objectFit: 'cover', border: '1px solid #e2e8f0', flexShrink: 0 },
};