// src/pages/admin/buku/ManajerBuku.jsx
// ============================================================
// MANAJER BUKU DIGITAL -- satu-satunya pintu operasional konten
// buku. SEMUA isi buku hidup di Firestore (buku_digital +
// subkoleksi bab), TIDAK ADA lagi file statis di bundle aplikasi.
// Tambah/ubah buku & bab = kerjaan di halaman ini, langsung
// terbit ke siswa TANPA deploy, TANPA sentuh kode.
//
// Skema Firestore:
//   buku_digital/{bookId}              -> metadata buku
//   buku_digital/{bookId}/bab/{babId}  -> isi bab (sections + ujiPemahaman)
// Progres siswa tetap di siswa_buku_progress (tidak berubah).
// ============================================================
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../../../firebase';
import { collection, getDocs, doc, getDoc, setDoc, deleteDoc, writeBatch } from 'firebase/firestore';
import { ArrowLeft, Plus, Pencil, Trash2, Save, X, BookOpen, Layers, Eye } from 'lucide-react';

const JENJANG_OPSI = ['SD/MI', 'SMP/MTs', 'SMA/MA', 'SMK', 'UTBK/SNBT'];
const TIPE_BLOK = ['p', 'list', 'math', 'contoh', 'tips'];
const TIPE_SOAL = ['pg', 'multi', 'bs'];
const TIPE_VISUAL = ['termometer', 'tabel', 'bangun', 'gambar'];

const CONTOH_JSON_BAB = `{
  "id": "bab-7",
  "judul": "Statistika",
  "sections": [
    {
      "id": "bab-7-a",
      "judul": "A. Menyajikan Data",
      "blocks": [
        { "tipe": "p", "teks": "Paragraf materi. LaTeX inline boleh dipakai: $...$" },
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
}`;

// ============================================================
// VALIDASI KETAT -- penjaga akurasi konten: kunci jawaban di luar
// range, blok aneh, visual tidak lengkap = DITOLAK dengan pesan
// jelas, bukan lolos lalu membingungkan siswa di reader.
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
    if (q.visual?.tipe === 'gambar' && !q.visual.src) err.push(`${t}.visual gambar butuh "src" (URL gambar).`);
  });
  return err;
}

const slugify = (s) => String(s || '').toLowerCase().trim()
  .replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

export default function ManajerBuku() {
  const navigate = useNavigate();
  const [daftarBuku, setDaftarBuku] = useState([]);
  const [loading, setLoading] = useState(true);
  const [bukuDipilih, setBukuDipilih] = useState(null);
  const [babList, setBabList] = useState([]);
  const [modeFormBuku, setModeFormBuku] = useState(null); // null | 'baru' | object buku
  const [formBuku, setFormBuku] = useState({ judul: '', mapel: 'Matematika', jenjang: 'SMP/MTs', kelas: 9, emoji: '📘', warna: '#4C6EF5', deskripsi: '', status: 'aktif' });
  const [modeBab, setModeBab] = useState(null); // null | 'baru' | object bab
  const [teksJson, setTeksJson] = useState('');
  const [errValidasi, setErrValidasi] = useState([]);

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

  const simpanBab = async () => {
    let obj;
    try { obj = JSON.parse(teksJson); } catch (e) { setErrValidasi(['JSON tidak bisa diparse: ' + e.message]); return; }
    const errs = validasiBab(obj);
    setErrValidasi(errs);
    if (errs.length) return;
    const urutan = obj.urutan != null ? Number(obj.urutan) : babList.length;
    try {
      await setDoc(doc(db, 'buku_digital', bukuDipilih.id, 'bab', obj.id), {
        id: obj.id, judul: obj.judul, urutan,
        sections: obj.sections, ujiPemahaman: obj.ujiPemahaman,
        sumber: obj.sumber || 'admin', updatedAt: Date.now(),
      }, { merge: true });
      setModeBab(null); setTeksJson(''); setErrValidasi([]);
      muatBab(bukuDipilih.id);
    } catch (e) { alert('Gagal simpan bab: ' + e.message); }
  };

  const hapusBab = async (bab) => {
    if (!window.confirm(`Hapus bab "${bab.judul}" dari Firestore?`)) return;
    try {
      await deleteDoc(doc(db, 'buku_digital', bukuDipilih.id, 'bab', bab.id));
      muatBab(bukuDipilih.id);
    } catch (e) { alert('Gagal hapus bab: ' + e.message); }
  };

  return (
    <div style={st.page}>
      <div style={st.header}>
        <button onClick={() => navigate('/admin')} style={st.backBtn}><ArrowLeft size={18} /></button>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 17, fontWeight: 800, color: '#1e293b', display: 'flex', alignItems: 'center', gap: 8 }}>
            <BookOpen size={20} color="#4C6EF5" /> Manajer Buku Digital
          </div>
          <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>
            Tambah buku/bab di sini — terbit ke siswa tanpa deploy.
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
              <button onClick={() => { setModeBab('baru'); setTeksJson(''); setErrValidasi([]); }} style={st.btnPrimary}><Plus size={14} /> Bab (Paste JSON)</button>
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
              <button onClick={() => window.open(`/siswa/buku/${bukuDipilih.id}/${bab.id}`, '_blank')} style={st.iconBtn} title="Buka di reader siswa (tab baru; login sebagai siswa tes)"><Eye size={14} /></button>
              <button onClick={() => { setModeBab(bab); setTeksJson(JSON.stringify({ id: bab.id, judul: bab.judul, urutan: bab.urutan, sections: bab.sections, ujiPemahaman: bab.ujiPemahaman }, null, 2)); setErrValidasi([]); }} style={st.iconBtn} title="Edit JSON"><Pencil size={14} /></button>
              <button onClick={() => hapusBab(bab)} style={{ ...st.iconBtn, color: '#dc2626' }} title="Hapus bab"><Trash2 size={14} /></button>
            </div>
          ))}

          {modeBab && (
            <div style={{ marginTop: 12 }}>
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
                <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: 10, marginTop: 8 }}>
                  <div style={{ fontSize: 11, fontWeight: 800, color: '#991b1b', marginBottom: 4 }}>Perbaiki {errValidasi.length} masalah:</div>
                  {errValidasi.map((e, i) => <div key={i} style={{ fontSize: 11, color: '#b91c1c' }}>• {e}</div>)}
                </div>
              )}
              <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                <button onClick={simpanBab} style={st.btnPrimary}><Save size={14} /> Validasi & Simpan Bab</button>
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
  iconBtn: { background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', padding: 6, display: 'flex', alignItems: 'center', justifyContent: 'center' },
  card: { background: 'white', borderRadius: 12, padding: 14, border: '1px solid #e2e8f0', marginBottom: 12, boxShadow: '0 1px 3px rgba(0,0,0,0.04)' },
  kosong: { textAlign: 'center', color: '#64748b', padding: '30px 16px', fontSize: 12.5, background: 'white', borderRadius: 12, border: '1px dashed #cbd5e1', lineHeight: 1.7 },
  label: { display: 'flex', flexDirection: 'column', gap: 4, fontSize: 11, fontWeight: 700, color: '#475569' },
  input: { border: '1px solid #cbd5e1', borderRadius: 8, padding: '8px 10px', fontSize: 12, color: '#1e293b', background: 'white' },
  textarea: { width: '100%', minHeight: 260, border: '1px solid #cbd5e1', borderRadius: 8, padding: 10, fontSize: 11, fontFamily: 'monospace', color: '#1e293b', background: 'white', boxSizing: 'border-box' },
  panel: { margin: '0 16px', background: 'white', borderRadius: 12, border: '1px solid #e2e8f0', padding: 14 },
  babRow: { display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', borderRadius: 10, border: '1px solid #eef2ff', background: '#f8fafc', marginBottom: 6 },
};
