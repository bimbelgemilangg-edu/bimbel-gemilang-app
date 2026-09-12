// src/pages/admin/buku/ManajerBuku.jsx
// ============================================================
// MANAJER BUKU DIGITAL v4 -- OPERASIONAL PENUH, MINIM KLIK
// Satu-satunya pintu operasional konten buku. Semua isi buku
// hidup di Firestore (buku_digital + subkoleksi bab), TIDAK ADA
// file statis di bundle. Tambah/ubah buku & bab = kerjaan di
// halaman ini, langsung terbit ke siswa TANPA deploy.
//
// v4 (BARU):
//  - FIX BUG FIRESTORE "Nested arrays are not supported":
//    sections & ujiPemahaman disanitasi otomatis sebelum setDoc
//    (array bersarang tabel/bangun dibungkus { s: [...] }).
//  - IMPOR FILE JSON sekali klik (tidak ada lagi copy-paste).
//  - IMPOR PDF OTOMATIS: teks + gambar tersemat diekstrak,
//    draf bab (materi + soal pg/multi/bs + kunci dari pembahasan)
//    disusun mesin konversi; gambar auto-upload ke Storage dan
//    dipasang sebagai blok. Hasil = DRAF untuk direview admin.
//  - Manajer Gambar tetap ada untuk kasus manual (URL eksternal).
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
// v5.1: semua upload gambar pindah ke Supabase Storage (gratis).
import { uploadElearningFile } from '../../../services/uploadService';
import { sanitasiFirestore } from '../../../utils/konversiPdfBuku';
import {
  ArrowLeft, Plus, Pencil, Trash2, Save, X, BookOpen, Layers, Eye,
  ImageIcon, Upload, Copy, Link2, FileCode, FileJson,
  UploadCloud, Scissors, ToggleLeft
} from 'lucide-react';
// 🔥 v5: alat potong gambar langsung dari halaman modul (pengganti
// upload gambar manual) + halaman impor modul massal.
import PemotongGambar from '../../../components/buku/PemotongGambar';
import '../../../components/buku/buku.css';

const JENJANG_OPSI = ['SD/MI', 'SMP/MTs', 'SMA/MA', 'SMK', 'UTBK/SNBT'];
const TIPE_BLOK = ['p', 'list', 'math', 'contoh', 'tips', 'gambar'];
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
          { "tipe": "gambar", "src": "https://.../diagram.png", "alt": "Diagram materi", "caption": "Gambar 7.1 — keterangan singkat di bawah gambar" },
          { "tipe": "list", "items": ["poin pertama", "poin kedua"] },
          { "tipe": "math", "teks": "x^2 + y^2 = r^2" },
          { "tipe": "p", "teks": "Blok apa pun boleh punya visual interaktif:", "visual": { "tipe": "tabel", "caption": "Tabel di dalam MATERI (bukan cuma soal)", "kepala": ["Data", "Frekuensi"], "baris": [["A", "5"], ["B", "8"]] } },
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

// Satu gerbang validasi visual, dipakai bersama oleh SOAL dan BLOK
// MATERI -- aturannya identik di mana pun visual itu dipasang.
function validasiVisual(v, label, err) {
  if (!v) return;
  if (typeof v !== 'object' || !TIPE_VISUAL.includes(v.tipe)) {
    err.push(`${label}.tipe harus: ${TIPE_VISUAL.join(' / ')}.`);
    return;
  }
  if (v.tipe === 'tabel' && (!Array.isArray(v.kepala) || !Array.isArray(v.baris))) err.push(`${label} tabel butuh "kepala" & "baris".`);
  if (v.tipe === 'termometer' && !Array.isArray(v.data)) err.push(`${label} termometer butuh "data".`);
  if (v.tipe === 'bangun' && (!Array.isArray(v.titik) || !Array.isArray(v.sisi))) err.push(`${label} bangun butuh "titik" & "sisi".`);
  if (v.tipe === 'garis' && !Array.isArray(v.titik)) err.push(`${label} garis butuh "titik".`);
  if (v.tipe === 'gambar' && (!v.src || typeof v.src !== 'string')) err.push(`${label} gambar butuh "src" (URL gambar).`);
}

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
      const t = `sections[${i}].blocks[${j}]`;
      if (!TIPE_BLOK.includes(b.tipe)) err.push(`${t}.tipe harus salah satu: ${TIPE_BLOK.join(', ')}.`);
      if (b.tipe === 'list') {
        if (!Array.isArray(b.items) || !b.items.length) err.push(`${t} tipe "list" butuh "items" array.`);
      } else if (b.tipe === 'gambar') {
        if (!b.src || typeof b.src !== 'string') err.push(`${t} tipe "gambar" butuh "src" (URL gambar).`);
      } else if (!b.teks && !b.visual) {
        err.push(`${t} butuh "teks" (atau field "visual" kalau memang blok visual murni).`);
      }
      validasiVisual(b.visual, `${t}.visual`, err);
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
    validasiVisual(q.visual, `${t}.visual`, err);
    if (q.gambar && (!q.gambar.src || typeof q.gambar.src !== 'string')) err.push(`${t}.gambar butuh "src" (URL gambar asli modul).`);
  });
  return err;
}

// Penanda waktu numerik (skema lama buku_digital memakai angka, bukan
// serverTimestamp, jadi tetap konsisten & bisa diurutkan).
const waktuSekarang = () => Date.now();

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

  // ===== STATE v4: impor file JSON sekali klik =====
  const jsonFileRef = useRef(null);

  // ===== STATE v5: IMPOR MODUL & PEMOTONG GAMBAR =====
  const textareaRef = useRef(null);
  const [potong, setPotong] = useState(null);   // { bab } saat alat potong dibuka
  const [hasilPotong, setHasilPotong] = useState([]);

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
        // merge:true -> field modul (pdfUrl, jumlahHalaman, pdfHash, ...)
        // yang sudah ada TIDAK hilang saat admin hanya mengubah soal.
        const payload = {
          id: obj.id, judul: obj.judul, urutan,
          // 🔥 v4: SANITASI FIRESTORE otomatis -- array bersarang
          // (tabel baris, bangun isi) dibungkus { s: [...] } dulu.
          // Penyebab error lama "Nested arrays are not supported".
          sections: sanitasiFirestore(obj.sections),
          ujiPemahaman: sanitasiFirestore(obj.ujiPemahaman),
          sumber: obj.sumber || 'admin', updatedAt: Date.now(),
        };
        // v5: mode tampilan boleh diatur dari JSON ("tipe": "pdf" | "terstruktur")
        if (obj.tipe === 'pdf' || obj.tipe === 'terstruktur') payload.tipe = obj.tipe;
        await setDoc(doc(db, 'buku_digital', bukuDipilih.id, 'bab', obj.id), payload, { merge: true });
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
    } catch {
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
      for (const f of Array.from(files)) {
        const up = await uploadElearningFile(f, 'materi');
        if (!up.success) throw new Error(up.error || 'Gagal upload');
        hasil.push({ url: up.downloadURL, name: f.name });
      }
      setImages((prev) => [...prev, ...hasil]);
      setPesanGambar(`✅ ${hasil.length} gambar terupload. Pakai tombol salin di bawah untuk memasangnya ke JSON.`);
    } catch (e) {
      console.error('Gagal upload gambar:', e);
      setPesanGambar('❌ Gagal upload ke Supabase Storage: ' + (e?.message || e) + '. Coba lagi, atau pakai URL eksternal di bawah.');
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

  const snippetVisual = (url) => `"visual": { "tipe": "gambar", "src": "${url}", "alt": "", "caption": "" }`;
  const snippetBlok = (url) => `{ "tipe": "gambar", "src": "${url}", "alt": "", "caption": "" }`;

  // ============================================================
  // v4: IMPOR FILE JSON -- pilih file / hasil konversi, sekali
  // klik masuk ke textarea. Tidak ada lagi copy-paste manual.
  // ============================================================
  const imporFileJson = async (file) => {
    if (!file) return;
    try {
      const teks = await file.text();
      const parsed = JSON.parse(teks);
      setTeksJson(JSON.stringify(parsed, null, 2));
      setErrValidasi([]);
      setPesanGambar(`✅ File "${file.name}" dimuat ke kolom JSON — tekan "Validasi & Simpan".`);
    } catch (e) {
      setPesanGambar(`❌ File bukan JSON valid: ${e.message}`);
    }
    if (jsonFileRef.current) jsonFileRef.current.value = '';
  };

  // ============================================================
  // CATATAN v5.1: fitur lama "Impor PDF (otomatis)" dan "Paket Gambar"
  // DIHAPUS dari halaman ini karena jadi jalan buntu untuk modul scan
  // dan alur rename file tidak efisien. Penggantinya:
  //   - Impor Modul (massal)  -> tombol hijau di header
  //   - Gambar dari Modul     -> potong langsung dari halaman modul
  // ============================================================
  // ============================================================
  // v5: HASIL POTONGAN GAMBAR DARI MODUL
  // Gambar dipotong langsung dari halaman PDF modul (tidak ada
  // upload manual, tidak ada rename file). Setelah terupload:
  //   - URL-nya masuk daftar "Gambar dari modul" di bawah
  //   - sekali klik = tersisip ke kolom JSON di posisi kursor
  //     (sebagai blok materi, atau sebagai "gambar" soal)
  // ============================================================
  const padaPotongSelesai = (hasil) => {
    setHasilPotong((prev) => [hasil, ...prev.filter((x) => x.url !== hasil.url)]);
    setImages((prev) => [{ url: hasil.url, name: `modul hal ${hasil.halaman}` }, ...prev]);
  };

  const sisipkanKeJson = (teks, label) => {
    const ta = textareaRef.current;
    if (!ta) { salin(teks, label); return; }
    const awal = ta.selectionStart ?? teksJson.length;
    const akhir = ta.selectionEnd ?? awal;
    const baru = teksJson.slice(0, awal) + teks + teksJson.slice(akhir);
    setTeksJson(baru);
    setErrValidasi([]);
    requestAnimationFrame(() => {
      try { ta.focus(); ta.setSelectionRange(awal + teks.length, awal + teks.length); } catch { /* abaikan */ }
    });
    setPesanGambar(`✅ ${label} disisipkan ke kolom JSON di posisi kursor. Jangan lupa "Validasi & Simpan".`);
    setTimeout(() => setPesanGambar(''), 4000);
  };

  const sisipBlokGambar = (url, caption) =>
    sisipkanKeJson(`{ "tipe": "gambar", "src": "${url}", "alt": "${caption || ''}", "caption": "${caption || ''}" },\n`, 'Blok gambar materi');

  const sisipGambarSoal = (url, caption) =>
    sisipkanKeJson(`"gambar": { "src": "${url}", "alt": "${caption || ''}", "caption": "${caption || ''}" },\n`, 'Gambar soal');

  // Ganti mode tampilan bab: modul PDF asli <-> bab terstruktur
  const gantiModeBab = async (bab) => {
    const punyaPdf = !!bab.pdfUrl;
    const punyaSections = (bab.sections || []).length > 0;
    if (!punyaPdf && !punyaSections) { alert('Bab ini tidak punya modul PDF maupun seksi materi — belum ada yang bisa diganti.'); return; }
    const sekarang = bab.tipe === 'pdf' || (!bab.tipe && punyaPdf && !punyaSections) ? 'pdf' : 'terstruktur';
    const target = sekarang === 'pdf' ? 'terstruktur' : 'pdf';
    if (target === 'terstruktur' && !punyaSections) { alert('Bab ini belum punya materi terstruktur (sections kosong). Tambahkan dulu lewat Edit JSON, atau tetap pakai mode Modul Asli.'); return; }
    if (target === 'pdf' && !punyaPdf) { alert('Bab ini tidak punya file modul PDF. Impor dulu lewat "Impor Modul".'); return; }
    if (!window.confirm(`Ubah tampilan bab "${bab.judul}" di sisi siswa menjadi ${target === 'pdf' ? 'MODUL ASLI (halaman PDF)' : 'TERSTRUKTUR (blok materi)'}?`)) return;
    try {
      await setDoc(doc(db, 'buku_digital', bukuDipilih.id, 'bab', bab.id), { tipe: target, updatedAt: waktuSekarang() }, { merge: true });
      muatBab(bukuDipilih.id);
    } catch (e) { alert('Gagal mengubah mode: ' + e.message); }
  };

  const modeBabSekarang = (bab) => (bab.tipe === 'pdf' || (!bab.tipe && bab.pdfUrl && !(bab.sections || []).length)) ? 'pdf' : 'terstruktur';

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
        <button onClick={() => navigate('/admin/buku/impor')} style={st.btnImport} title="Impor banyak PDF modul sekaligus — otomatis jadi bab yang terbit ke siswa">
          <UploadCloud size={15} /> Impor Modul
        </button>
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
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
              <input ref={jsonFileRef} type="file" accept=".json,application/json" style={{ display: 'none' }} onChange={(e) => { setModeBab('baru'); setErrValidasi([]); imporFileJson(e.target.files[0]); }} />
              <button onClick={() => { setModeBab('baru'); setTeksJson(''); setErrValidasi([]); setImages([]); setPesanGambar(''); jsonFileRef.current?.click(); }} style={st.btnSecondary} title="Muat file .json siap-paste sekali klik"><FileJson size={14} /> Impor File JSON</button>
              <button onClick={() => { setModeBab('baru'); setTeksJson(''); setErrValidasi([]); setImages([]); setPesanGambar(''); }} style={st.btnPrimary}><Plus size={14} /> Bab (Paste JSON)</button>
              <button onClick={() => setBukuDipilih(null)} style={st.iconBtn}><X size={15} /></button>
            </div>
          </div>

          {babList.map((bab, i) => {
            const modeBab = modeBabSekarang(bab);
            return (
              <div key={bab.id} style={st.babRow}>
                <div style={{ width: 26, height: 26, borderRadius: 8, background: '#eef2ff', color: '#4338ca', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800, flexShrink: 0 }}>{i + 1}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12.5, fontWeight: 700, color: '#1e293b', display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                    {bab.judul}
                    <span style={{ ...st.badgeMode, background: modeBab === 'pdf' ? '#fef3c7' : '#dcfce7', color: modeBab === 'pdf' ? '#92400e' : '#166534' }}
                      title={modeBab === 'pdf' ? 'Siswa membaca halaman modul aslinya (rumus & gambar 100% utuh)' : 'Siswa membaca blok materi terstruktur'}>
                      {modeBab === 'pdf'
                        ? `MODUL PDF${bab.jumlahHalaman ? ` • hal ${bab.halamanMulai || 1}–${bab.halamanSelesai || bab.jumlahHalaman}` : ''}`
                        : 'TERSTRUKTUR'}
                    </span>
                    {bab.status === 'draft' && <span style={{ ...st.badgeMode, background: '#f1f5f9', color: '#64748b' }}>DRAFT</span>}
                  </div>
                  <div style={{ fontSize: 10.5, color: '#64748b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {(bab.sections || []).length} seksi • {(bab.ujiPemahaman || []).length} soal • sumber: {bab.sumber || '-'}
                    {bab.namaFile ? ` • ${bab.namaFile}` : ''}
                  </div>
                </div>
                {bab.pdfUrl && (
                  <button onClick={() => { setPotong({ bab }); setHasilPotong([]); }} style={st.btnSmall2}
                    title="Potong gambar/diagram/tabel langsung dari halaman modul — tanpa upload manual">
                    <Scissors size={13} /> Gambar dari Modul
                  </button>
                )}
                <button onClick={() => gantiModeBab(bab)} style={st.iconBtn}
                  title={`Tampilan siswa sekarang: ${modeBab === 'pdf' ? 'Modul Asli (PDF)' : 'Terstruktur'}. Klik untuk menukar.`}>
                  <ToggleLeft size={16} />
                </button>
                <button onClick={() => window.open(`/siswa/buku/${bukuDipilih.id}/${bab.id}`, '_blank')} style={st.iconBtn} title="Buka di reader siswa (tab baru)"><Eye size={14} /></button>
                <button onClick={() => { setModeBab(bab); setTeksJson(JSON.stringify({ id: bab.id, judul: bab.judul, urutan: bab.urutan, tipe: modeBab, sections: bab.sections || [], ujiPemahaman: bab.ujiPemahaman || [] }, null, 2)); setErrValidasi([]); setImages([]); setPesanGambar(''); setHasilPotong([]); }} style={st.iconBtn} title="Edit JSON"><Pencil size={14} /></button>
                <button onClick={() => hapusBab(bab)} style={{ ...st.iconBtn, color: '#dc2626' }} title="Hapus bab"><Trash2 size={14} /></button>
              </div>
            );
          })}

          {modeBab && (
            <div style={{ marginTop: 12 }}>
              {/* ===== v5: GAMBAR HASIL POTONGAN DARI MODUL ===== */}
              {modeBab?.pdfUrl && (
                <div style={{ ...st.imgCard, borderColor: '#bbf7d0', background: '#f0fdf4' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, flexWrap: 'wrap' }}>
                    <Scissors size={16} color="#16a34a" />
                    <span style={{ fontSize: 12, fontWeight: 800, color: '#166534' }}>Gambar dari Modul</span>
                    <span style={{ fontSize: 10, color: '#15803d' }}>— potong diagram/tabel/foto langsung dari halaman modul. Tidak ada upload manual, tidak ada rename file.</span>
                    <button onClick={() => { setPotong({ bab: modeBab }); setHasilPotong([]); }} style={{ ...st.btnSecondary, marginLeft: 'auto', background: '#16a34a', color: 'white' }}>
                      <Scissors size={13} /> Buka alat potong
                    </button>
                  </div>

                  {hasilPotong.length === 0 ? (
                    <div style={{ fontSize: 10.5, color: '#166534', lineHeight: 1.65 }}>
                      Alur cepat: <b>Buka alat potong</b> → pilih halaman → <b>Deteksi bagian otomatis</b> → ketuk gambarnya
                      (atau tarik kotak sendiri) → <b>Potong & Upload</b>. Setelah itu kembali ke sini: hasilnya muncul di bawah,
                      taruh kursor di kolom JSON pada posisi yang diinginkan, lalu klik <b>sisipkan</b>.
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      {hasilPotong.map((g, idx) => (
                        <div key={idx} style={st.imgRow}>
                          {g.thumb ? <img src={g.thumb} alt="" style={st.imgThumb} /> : <ImageIcon size={16} color="#cbd5e1" />}
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: 11, fontWeight: 700, color: '#166534' }}>Halaman {g.halaman} • {g.lebar}×{g.tinggi}px</div>
                            <div style={{ fontSize: 9, color: '#4ade80', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{g.url}</div>
                          </div>
                          <button onClick={() => sisipBlokGambar(g.url, `Gambar modul halaman ${g.halaman}`)} style={st.btnTiny} title="Sisipkan sebagai blok gambar di MATERI (posisi kursor)"><Layers size={12} /> Blok</button>
                          <button onClick={() => sisipGambarSoal(g.url, `Gambar soal dari modul halaman ${g.halaman}`)} style={st.btnTiny} title="Sisipkan sebagai field gambar SOAL (posisi kursor)"><FileCode size={12} /> Soal</button>
                          <button onClick={() => salin(g.url, 'URL')} style={st.btnTiny}><Copy size={12} /> URL</button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

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
                        <button onClick={() => salin(snippetVisual(img.url), 'Snippet visual soal')} style={st.btnTiny} title="Salin snippet visual utk DI DALAM object soal (ujiPemahaman)"><FileCode size={12} /> Soal</button>
                        <button onClick={() => salin(snippetBlok(img.url), 'Snippet blok materi')} style={st.btnTiny} title="Salin snippet blok gambar utk MATERI (sections[].blocks)"><Layers size={12} /> Blok</button>
                        <button onClick={() => setImages((prev) => prev.filter((_, i) => i !== idx))} style={{ ...st.iconBtn, color: '#dc2626' }} title="Hapus dari daftar"><X size={13} /></button>
                      </div>
                    ))}
                  </div>
                )}

                <div style={{ fontSize: 10, color: '#64748b', marginTop: 8, lineHeight: 1.6 }}>
                  Cara pakai:<br />
                  • <b>Soal</b> → tempel di DALAM object soal pada <code style={{ background: '#f1f5f9', padding: '2px 6px', borderRadius: 4 }}>ujiPemahaman</code>: <code style={{ background: '#f1f5f9', padding: '2px 6px', borderRadius: 4 }}>{`{ "id": "u1", "tipe": "pg", "soal": "Perhatikan gambar!", "visual": { "tipe": "gambar", "src": "URL_DISINI", "alt": "", "caption": "" }, "pilihan": [...], "benar": 0, "pembahasan": "..." }`}</code><br />
                  • <b>Blok</b> → tempel sebagai satu blok di <code style={{ background: '#f1f5f9', padding: '2px 6px', borderRadius: 4 }}>sections[].blocks</code> (gambar tampil di tengah materi): <code style={{ background: '#f1f5f9', padding: '2px 6px', borderRadius: 4 }}>{`{ "tipe": "gambar", "src": "URL_DISINI", "alt": "", "caption": "Gambar 1.1 — ..." }`}</code>
                </div>
              </div>

              <details style={{ marginBottom: 8 }}>
                <summary style={{ fontSize: 11, color: '#4C6EF5', cursor: 'pointer', fontWeight: 700 }}>Lihat contoh format JSON bab</summary>
                <pre style={{ background: '#0f172a', color: '#e2e8f0', padding: 10, borderRadius: 8, fontSize: 10, overflowX: 'auto', marginTop: 6 }}>{CONTOH_JSON_BAB}</pre>
              </details>

              <textarea
                ref={textareaRef}
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

      {/* ===== v5: ALAT POTONG GAMBAR MODUL ===== */}
      <PemotongGambar
        terbuka={!!potong}
        tutup={() => setPotong(null)}
        sumber={potong?.bab?.pdfUrl ? { pdfUrl: potong.bab.pdfUrl } : null}
        bukuId={bukuDipilih?.id || 'umum'}
        judul={potong?.bab?.judul || 'Modul'}
        halamanAwal={Math.max(1, Number(potong?.bab?.halamanMulai) || 1)}
        halamanMin={Math.max(1, Number(potong?.bab?.halamanMulai) || 1)}
        halamanMax={Number(potong?.bab?.halamanSelesai) || Number(potong?.bab?.jumlahHalaman) || null}
        onSelesai={padaPotongSelesai}
      />
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
  btnSmall2: { display: 'flex', alignItems: 'center', gap: 5, background: '#dcfce7', color: '#166534', border: 'none', borderRadius: 8, padding: '6px 10px', fontSize: 10.5, fontWeight: 800, cursor: 'pointer', flexShrink: 0 },
  btnImport: { display: 'flex', alignItems: 'center', gap: 6, background: '#16a34a', color: 'white', border: 'none', borderRadius: 8, padding: '8px 12px', fontSize: 12, fontWeight: 800, cursor: 'pointer', marginRight: 6 },
  badgeMode: { fontSize: 9, fontWeight: 800, borderRadius: 999, padding: '2px 7px', letterSpacing: 0.3, textTransform: 'uppercase', whiteSpace: 'nowrap' },
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