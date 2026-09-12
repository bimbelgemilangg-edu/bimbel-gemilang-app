// src/pages/admin/buku/ImporModul.jsx
// ============================================================
// IMPOR MODUL (massal) -- jawaban atas "susah sekali mengupload
// modul" dan "masa gambar harus di-upload manual satu-satu".
//
// Alur admin (target: < 1 menit per modul, tanpa copy-paste):
//   1. Pilih buku tujuan (atau buat buku baru: jenjang/kelas/mapel).
//   2. Tarik BANYAK file PDF sekaligus ke kotak unggah.
//   3. Sistem menganalisis tiap file otomatis:
//        - jumlah halaman, ukuran, ada lapisan teks atau hasil scan
//        - nomor & judul bab dibaca dari NAMA FILE
//          ("13 Teorema Phytagoras @my99dreams.pdf" -> Bab 13)
//        - sidik jari file (anti unggah ganda)
//        - thumbnail halaman 1
//   4. Koreksi seperlunya (judul/urutan/mode/rentang halaman).
//   5. "Unggah & Terbitkan" -> file masuk Storage, bab masuk
//      Firestore, langsung terlihat siswa. Tanpa deploy.
//      ATAU tombol "✨ AI" -> scan DITULIS ULANG jadi bab
//      terstruktur interaktif (rumus LaTeX + visual + soal).
//
// Kenapa modul scan TIDAK dipaksa jadi teks?
//   Modul bimbel umumnya PDF hasil scan (1 halaman = 1 gambar).
//   Dipaksa OCR merusak rumus & diagram. Sekarang ada dua jalan:
//   Modul Asli (fidelity 100%) atau Tulis Ulang AI (interaktif).
// ============================================================
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../../../firebase';
import {
  collection, getDocs, doc, setDoc, serverTimestamp,
} from 'firebase/firestore';
// v5.1: penyimpanan = Supabase Storage (gratis, sudah terbukti dipakai
// fitur Materi Portal). Firebase Storage butuh Blaze -> tidak dipakai.
import { uploadElearningFile } from '../../../services/uploadService';
import {
  ArrowLeft, UploadCloud, FileText, Loader2, Trash2, Plus, Save, CheckCircle2,
  AlertTriangle, Layers, Eye, Scissors, Copy, Split, Sparkles,
} from 'lucide-react';
// v5.2: mesin tulis-ulang scan -> bab interaktif (AI gratis: Groq/OpenRouter/Mistral)
import { konversiModulKeBab } from '../../../utils/konversiAiClient';
import {
  bukaPdf, infoModul, thumbnailHalaman, deteksiBabDalamPdf, judulDariNamaFile,
  babIdDari, ukuranTerbaca, hashFile, susunUrutan, cariBentrokId,
} from '../../../utils/modulPdf';
import { sanitasiFirestore, ekstrakPdf, konversiTeksKeBab } from '../../../utils/konversiPdfBuku';

const JENJANG_OPSI = ['SD/MI', 'SMP/MTs', 'SMA/MA', 'SMK', 'UTBK/SNBT'];
const FORM_BUKU_KOSONG = { judul: '', mapel: 'Matematika', jenjang: 'SMP/MTs', kelas: 9, emoji: '📘', warna: '#4C6EF5', deskripsi: '', status: 'aktif' };

const slugify = (s) => String(s || '').toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

export default function ImporModul() {
  const navigate = useNavigate();
  const fileRef = useRef(null);
  const dropRef = useRef(null);

  // ---------- buku tujuan ----------
  const [daftarBuku, setDaftarBuku] = useState([]);
  const [modeBuku, setModeBuku] = useState('pilih');     // 'pilih' | 'baru'
  const [bukuId, setBukuId] = useState('');
  const [formBuku, setFormBuku] = useState(FORM_BUKU_KOSONG);
  const [bukuSiap, setBukuSiap] = useState(null);        // { id, judul } setelah dipastikan ada

  // ---------- antrean file ----------
  const [items, setItems] = useState([]);
  const [menganalisis, setMenganalisis] = useState(false);

  // ---------- proses unggah ----------
  const [tahap, setTahap] = useState('siap');            // siap | jalan | selesai | gagal
  const [log, setLog] = useState([]);
  const [progresTotal, setProgresTotal] = useState(0);
  const [hasil, setHasil] = useState([]);

  const [seretDrag, setSeretDrag] = useState(false);
  const [pesan, setPesan] = useState('');

  const tambahLog = (teks) => setLog((l) => [...l, `${new Date().toLocaleTimeString('id-ID')} — ${teks}`]);

  // ============================================================
  // MUAT DAFTAR BUKU
  // ============================================================
  const muatBuku = useCallback(async () => {
    try {
      const snap = await getDocs(collection(db, 'buku_digital'));
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      list.sort((a, b) => String(a.judul).localeCompare(String(b.judul), 'id'));
      setDaftarBuku(list);
      if (list.length && !bukuId) setBukuId(list[0].id);
    } catch (e) { console.error('Gagal muat buku:', e); }
  }, [bukuId]);

  useEffect(() => { muatBuku(); }, [muatBuku]);

  // ============================================================
  // TAMBAH FILE + ANALISIS OTOMATIS
  // ============================================================
  const tambahFile = async (files) => {
    const daftar = Array.from(files || []).filter((f) => /pdf$/i.test(f.name) || f.type === 'application/pdf');
    if (!daftar.length) { setPesan('❌ Hanya file PDF yang diterima.'); return; }
    setPesan('');

    const baru = daftar.map((f, i) => {
      const meta = judulDariNamaFile(f.name);
      return {
        kunci: `${Date.now()}-${i}-${f.name}`,
        file: f,
        nama: f.name,
        ukuran: f.size,
        status: 'antre',
        pesan: '',
        thumb: '',
        info: null,
        hash: '',
        nomor: meta.nomor,
        judul: meta.judul,
        urutan: meta.urutan,
        babId: babIdDari(meta.nomor, meta.judul),
        mode: 'pdf',            // 'pdf' = Modul Asli | 'konversi' = jadi bab terstruktur
        halMulai: 1,
        halSampai: null,        // null = sampai halaman terakhir
        aktif: true,
        progres: 0,
        hasilUrl: '',
      };
    });
    setItems((prev) => [...prev, ...baru]);

    // analisis berurutan (hemat memori: 1 PDF terbuka pada satu waktu)
    setMenganalisis(true);
    for (const it of baru) {
      setItems((prev) => prev.map((x) => (x.kunci === it.kunci ? { ...x, status: 'analisis', pesan: 'Membaca PDF...' } : x)));
      try {
        const hash = await hashFile(it.file);
        const byte = await it.file.arrayBuffer();
        const pdf = await bukaPdf(new Uint8Array(byte));
        const info = await infoModul(pdf, { halamanSampel: Math.min(3, pdf.numPages) });
        let thumb = '';
        try { thumb = await thumbnailHalaman(pdf, 1, 190, 0.7); } catch { thumb = ''; }
        try { await pdf.destroy(); } catch { /* abaikan */ }

        setItems((prev) => prev.map((x) => (x.kunci === it.kunci ? {
          ...x,
          status: 'siap',
          info,
          thumb,
          hash,
          halSampai: info.jumlahHalaman,
          mode: info.adaLapisanTeks ? 'konversi' : 'pdf',
          pesan: info.hasilPindai
            ? `Modul scan (${info.jumlahHalaman} hal, tanpa lapisan teks) → siap Modul Asli atau ✨ AI.`
            : info.adaLapisanTeks
              ? `Ada lapisan teks (${info.karakterPerHalaman} karakter/hal) → boleh dikonversi jadi bab terstruktur.`
              : `${info.jumlahHalaman} halaman.`,
        } : x)));
      } catch (e) {
        console.error('Gagal analisis', it.nama, e);
        setItems((prev) => prev.map((x) => (x.kunci === it.kunci ? { ...x, status: 'gagal', pesan: 'Gagal dibaca: ' + (e?.message || e) } : x)));
      }
    }
    setMenganalisis(false);
    setItems((prev) => susunUrutan(prev));
  };

  const ubah = (kunci, patch) => setItems((prev) => prev.map((x) => (x.kunci === kunci ? { ...x, ...patch } : x)));
  const hapus = (kunci) => setItems((prev) => prev.filter((x) => x.kunci !== kunci));
  const urutkanOtomatis = () => setItems((prev) => susunUrutan(prev).map((x, i) => ({ ...x, urutan: x.nomor || i + 1, babId: babIdDari(x.nomor || i + 1, x.judul) })));

  // Pecah 1 PDF jadi beberapa bab: duplikasi baris dengan rentang berbeda
  const pecahBaris = (it) => {
    setItems((prev) => {
      const idx = prev.findIndex((x) => x.kunci === it.kunci);
      const salinan = {
        ...it,
        kunci: `${it.kunci}-pecah-${Date.now()}`,
        status: it.status,
        babId: `${it.babId}-b`,
        judul: `${it.judul} (bagian 2)`,
        halMulai: Math.min(it.info?.jumlahHalaman || 1, Math.ceil((it.info?.jumlahHalaman || 2) / 2) + 1),
        halSampai: it.info?.jumlahHalaman || null,
        hasilUrl: '', progres: 0,
      };
      const asal = { ...it, halSampai: Math.ceil((it.info?.jumlahHalaman || 2) / 2) };
      const out = prev.slice();
      out[idx] = asal;
      out.splice(idx + 1, 0, salinan);
      return out;
    });
  };

  // Deteksi bab otomatis di dalam 1 PDF (hanya kalau ada lapisan teks)
  const deteksiBab = async (it) => {
    ubah(it.kunci, { status: 'analisis', pesan: 'Mencari penanda BAB di dalam PDF...' });
    try {
      const byte = await it.file.arrayBuffer();
      const pdf = await bukaPdf(new Uint8Array(byte));
      const daftar = await deteksiBabDalamPdf(pdf);
      try { await pdf.destroy(); } catch { /* abaikan */ }
      if (daftar.length <= 1) {
        ubah(it.kunci, { status: 'siap', pesan: 'Hanya 1 penanda bab ditemukan — PDF ini memang 1 bab. Gunakan "Pecah" kalau mau memotong per rentang halaman.' });
        return;
      }
      const tambahan = daftar.slice(1).map((b, i) => ({
        ...it,
        kunci: `${it.kunci}-bab${i}-${Date.now()}`,
        nomor: b.nomor,
        judul: b.judul || `Bagian ${i + 2}`,
        urutan: b.nomor || (it.urutan || 1) + i + 1,
        babId: babIdDari(b.nomor, b.judul || `bagian-${i + 2}`),
        halMulai: b.halaman,
        halSampai: (daftar[i + 2]?.halaman || it.info?.jumlahHalaman || b.halaman) - (daftar[i + 2] ? 1 : 0),
        hasilUrl: '', progres: 0, pesan: `Terdeteksi dari penanda "${b.teksAsli}" di halaman ${b.halaman}.`,
      }));
      setItems((prev) => {
        const idx = prev.findIndex((x) => x.kunci === it.kunci);
        const out = prev.slice();
        out[idx] = { ...it, halSampai: daftar[1].halaman - 1, status: 'siap', pesan: `Bab pertama (hal 1–${daftar[1].halaman - 1}).` };
        out.splice(idx + 1, 0, ...tambahan);
        return out;
      });
    } catch (e) {
      ubah(it.kunci, { status: 'siap', pesan: 'Deteksi bab gagal: ' + (e?.message || e) });
    }
  };

  // ============================================================
  // PASTIKAN BUKU TUJUAN ADA (buat kalau mode 'baru')
  // ============================================================
  const pastikanBuku = async () => {
    if (modeBuku === 'pilih') {
      if (!bukuId) throw new Error('Pilih dulu buku tujuannya.');
      const b = daftarBuku.find((x) => x.id === bukuId);
      if (!b) throw new Error('Buku tidak ditemukan.');
      return { id: b.id, judul: b.judul };
    }
    if (!formBuku.judul.trim()) throw new Error('Judul buku baru wajib diisi.');
    const id = slugify(formBuku.judul) || `buku-${Date.now().toString(36)}`;
    await setDoc(doc(db, 'buku_digital', id), {
      ...formBuku, id, kelas: Number(formBuku.kelas) || 9,
      createdAt: serverTimestamp(), updatedAt: Date.now(),
    }, { merge: true });
    await muatBuku();
    setBukuId(id);
    return { id, judul: formBuku.judul };
  };

  // ============================================================
  // UNGGAH & TERBITKAN
  // ============================================================
  // v5.1: upload ke Supabase Storage (bucket materi-bimbel, folder pdf/).
  const unggahSatu = async (file, onProgres) => {
    if (onProgres) onProgres(8);
    const hasil = await uploadElearningFile(file, 'materi', { kompres: false });
    if (!hasil.success) throw new Error(hasil.error || 'Gagal upload ke Supabase');
    if (onProgres) onProgres(92);
    return { url: hasil.downloadURL, path: hasil.filePath };
  };

  const mulai = async () => {
    const siap = items.filter((x) => x.status === 'siap' || x.status === 'terbit');
    if (!siap.length) { setPesan('❌ Belum ada file siap unggah.'); return; }
    const bentrok = cariBentrokId(siap);
    if (bentrok.size) {
      if (!window.confirm(`Ada id bab yang sama: ${[...bentrok].join(', ')}.\nBab lama dengan id itu akan DITIMPA. Lanjutkan?`)) return;
    }

    let buku;
    try { buku = await pastikanBuku(); } catch (e) { setPesan('❌ ' + e.message); return; }
    setBukuSiap(buku);
    setTahap('jalan'); setLog([]); setHasil([]); setProgresTotal(0); setPesan('');
    tambahLog(`Buku tujuan: "${buku.judul}" (${buku.id}) — ${siap.length} modul.`);

    // bab yang sudah ada (untuk reuse file yang identik)
    let babLama = [];
    try {
      const snap = await getDocs(collection(db, 'buku_digital', buku.id, 'bab'));
      babLama = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    } catch { babLama = []; }

    const berhasil = [];
    for (let i = 0; i < siap.length; i++) {
      const it = siap[i];
      try {
        ubah(it.kunci, { status: 'unggah', progres: 0, pesan: 'Mengupload ke Storage...' });

        // reuse kalau file identik sudah pernah diunggah
        const sama = babLama.find((b) => b.pdfHash && it.hash && b.pdfHash === it.hash);
        let url = '', path = '';
        if (sama && sama.pdfUrl) {
          url = sama.pdfUrl; path = sama.pdfPath || '';
          tambahLog(`♻️ ${it.nama}: file identik sudah ada (bab "${sama.judul}") — tidak diupload ulang.`);
          ubah(it.kunci, { progres: 100 });
        } else {
          const hasilUnggah = await unggahSatu(it.file, (p) => ubah(it.kunci, { progres: p }));
          url = hasilUnggah.url;
          path = hasilUnggah.path;
          tambahLog(`⬆️ ${it.nama} (${ukuranTerbaca(it.ukuran)}) → Supabase Storage selesai.`);
        }

        // ---------- susun dokumen bab ----------
        const halSampai = Math.min(it.halSampai || it.info?.jumlahHalaman || 1, it.info?.jumlahHalaman || 9999);
        const halMulai = Math.max(1, Math.min(it.halMulai || 1, halSampai));
        const dasar = {
          id: it.babId,
          judul: it.judul,
          urutan: Number(it.urutan) || i + 1,
          tipe: it.mode === 'konversi' ? 'terstruktur' : 'pdf',
          pdfUrl: url,
          pdfPath: path,
          pdfHash: it.hash || '',
          namaFile: it.nama,
          ukuranByte: it.ukuran,
          jumlahHalaman: it.info?.jumlahHalaman || 0,
          halamanMulai: halMulai,
          halamanSelesai: halSampai,
          adaLapisanTeks: !!it.info?.adaLapisanTeks,
          hasilPindai: !!it.info?.hasilPindai,
          sumber: 'impor-modul',
          status: it.aktif ? 'aktif' : 'draft',
          updatedAt: Date.now(),
        };

        let isi = { sections: [], ujiPemahaman: [] };
        if (it.mode === 'konversi') {
          ubah(it.kunci, { pesan: 'Mengonversi teks jadi bab terstruktur...' });
          try {
            const halaman = await ekstrakPdf(it.file);
            const draf = konversiTeksKeBab(halaman, { id: it.babId, judul: it.judul, urutan: dasar.urutan });
            isi = {
              sections: sanitasiFirestore(draf.sections || []),
              ujiPemahaman: sanitasiFirestore(draf.ujiPemahaman || []),
            };
            tambahLog(`🔤 ${it.nama}: konversi teks → ${isi.sections.length} seksi, ${isi.ujiPemahaman.length} soal (draf, perlu ditinjau).`);
          } catch (e) {
            tambahLog(`⚠️ ${it.nama}: konversi teks gagal (${e?.message || e}) → disimpan sebagai Modul Asli.`);
            dasar.tipe = 'pdf';
          }
        }

        // pertahankan soal/sections yang sudah pernah dibuat admin (jangan ditimpa kosong)
        const lama = babLama.find((b) => b.id === it.babId);
        const gabungan = {
          ...dasar,
          sections: (isi.sections && isi.sections.length) ? isi.sections : (lama?.sections || []),
          ujiPemahaman: (isi.ujiPemahaman && isi.ujiPemahaman.length) ? isi.ujiPemahaman : (lama?.ujiPemahaman || []),
          createdAt: lama?.createdAt || serverTimestamp(),
        };

        await setDoc(doc(db, 'buku_digital', buku.id, 'bab', it.babId), gabungan, { merge: true });
        tambahLog(`✅ Bab "${gabungan.judul}" (${it.babId}) terbit — hal ${halMulai}–${halSampai}, mode ${gabungan.tipe}.`);
        berhasil.push(gabungan);
        ubah(it.kunci, { status: 'terbit', progres: 100, hasilUrl: url, pesan: `Terbit sebagai bab "${gabungan.judul}".` });
      } catch (e) {
        console.error('Gagal impor', it.nama, e);
        tambahLog(`❌ ${it.nama}: ${e?.message || e}`);
        ubah(it.kunci, { status: 'error', pesan: 'Gagal: ' + (e?.message || e) });
      }
      setProgresTotal(Math.round(((i + 1) / siap.length) * 100));
    }

    setHasil(berhasil);
    setTahap(berhasil.length ? 'selesai' : 'gagal');
    tambahLog(berhasil.length ? `🎉 Selesai: ${berhasil.length}/${siap.length} modul terbit ke siswa.` : 'Tidak ada modul yang berhasil diimpor.');
  };

  // ============================================================
  // v5.2: TULIS ULANG DENGAN AI (scan -> bab terstruktur interaktif)
  // 1) PDF tetap diupload ke Supabase (cadangan mode "Modul Asli")
  // 2) AI menulis ulang isi: materi LaTeX + visual + soal + kunci
  // 3) Disimpan sebagai bab TERSTRUKTUR, langsung terbit
  // ============================================================
  const jalankanAi = async (it) => {
    if (it.status === 'ai') return;
    const statusSemula = it.status;
    ubah(it.kunci, { status: 'ai', progres: 0, pesan: 'Mengupload modul ke Supabase (cadangan Modul Asli)...' });
    try {
      let url = '';
      let path = '';
      const up = await unggahSatu(it.file, (p) => ubah(it.kunci, { progres: Math.round(p * 0.15) }));
      url = up.url;
      path = up.path;

      const hasil = await konversiModulKeBab({
        sumber: it.file,
        bukuId: bukuId || 'umum',
        halamanMulai: it.halMulai || 1,
        halamanSampai: it.halSampai || null,
        meta: { judul: it.judul, nomor: it.nomor, urutan: it.urutan },
        onProgres: (tahap, pesan) => ubah(it.kunci, { pesan: `[AI] ${pesan}` }),
      });

      let buku = bukuSiap;
      if (!buku) {
        buku = await pastikanBuku();
        setBukuSiap(buku);
      }

      const halSampai = Math.min(it.halSampai || it.info?.jumlahHalaman || 1, it.info?.jumlahHalaman || 9999);
      const halMulai = Math.max(1, Math.min(it.halMulai || 1, halSampai));
      const dokumen = {
        id: it.babId,
        judul: it.judul,
        urutan: Number(it.urutan) || 1,
        tipe: 'terstruktur',
        pdfUrl: url,
        pdfPath: path,
        pdfHash: it.hash || '',
        namaFile: it.nama,
        ukuranByte: it.ukuran,
        jumlahHalaman: it.info?.jumlahHalaman || 0,
        halamanMulai: halMulai,
        halamanSelesai: halSampai,
        adaLapisanTeks: !!it.info?.adaLapisanTeks,
        hasilPindai: !!it.info?.hasilPindai,
        sumber: `ai:${hasil.model}`,
        status: it.aktif ? 'aktif' : 'draft',
        sections: hasil.bab.sections,
        ujiPemahaman: hasil.bab.ujiPemahaman,
        updatedAt: Date.now(),
      };
      await setDoc(doc(db, 'buku_digital', buku.id, 'bab', it.babId), dokumen, { merge: true });
      tambahLog(`✨ ${it.nama}: AI (${hasil.model}) menulis ulang → ${(hasil.bab.sections || []).length} seksi, ${(hasil.bab.ujiPemahaman || []).length} soal. Bab terbit.`);
      ubah(it.kunci, {
        status: 'terbit',
        progres: 100,
        hasilUrl: url,
        pesan: `✨ Terstruktur hasil AI (${hasil.model}) • ${(hasil.bab.sections || []).length} seksi, ${(hasil.bab.ujiPemahaman || []).length} soal.`,
      });
    } catch (e) {
      console.error('Gagal konversi AI', it.nama, e);
      tambahLog(`❌ AI ${it.nama}: ${e?.message || e}`);
      ubah(it.kunci, {
        status: statusSemula === 'terbit' ? 'terbit' : 'siap',
        pesan: '❌ AI gagal: ' + (e?.message || e) + ' — tombol Unggah & Terbitkan (Modul Asli) tetap tersedia.',
      });
    }
  };

  // ============================================================
  // RENDER
  // ============================================================
  const siapHitung = items.filter((x) => x.status === 'siap' || x.status === 'terbit').length;
  const bentrok = cariBentrokId(items);

  return (
    <div style={st.page}>
      <div style={st.header}>
        <button onClick={() => navigate('/admin/buku')} style={st.backBtn}><ArrowLeft size={18} /></button>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 17, fontWeight: 800, color: '#1e293b', display: 'flex', alignItems: 'center', gap: 8 }}>
            <UploadCloud size={20} color="#4C6EF5" /> Impor Modul (massal)
          </div>
          <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>
            Tarik banyak PDF sekaligus → jadi bab yang langsung terbit ke siswa. Tanpa copy-paste, tanpa upload gambar manual.
          </div>
        </div>
      </div>

      <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>

        {/* ================= LANGKAH 1: BUKU TUJUAN ================= */}
        <div style={st.card}>
          <div style={st.judulCard}><span style={st.langkah}>1</span> Buku tujuan</div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 10 }}>
            <button onClick={() => setModeBuku('pilih')} style={modeBuku === 'pilih' ? st.pillAktif : st.pill}>Buku yang sudah ada</button>
            <button onClick={() => setModeBuku('baru')} style={modeBuku === 'baru' ? st.pillAktif : st.pill}>+ Buat buku baru</button>
          </div>

          {modeBuku === 'pilih' ? (
            <select value={bukuId} onChange={(e) => setBukuId(e.target.value)} style={st.input}>
              <option value="">— pilih buku —</option>
              {daftarBuku.map((b) => (
                <option key={b.id} value={b.id}>{b.emoji || '📘'} {b.judul} ({b.jenjang} • kelas {b.kelas} • {b.mapel})</option>
              ))}
            </select>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 9 }}>
              <label style={st.label}>Judul buku
                <input style={st.input} value={formBuku.judul} onChange={(e) => setFormBuku({ ...formBuku, judul: e.target.value })} placeholder="Modul Matematika Kelas 9 SMP" />
              </label>
              <label style={st.label}>Mapel
                <input style={st.input} value={formBuku.mapel} onChange={(e) => setFormBuku({ ...formBuku, mapel: e.target.value })} />
              </label>
              <label style={st.label}>Jenjang
                <select style={st.input} value={formBuku.jenjang} onChange={(e) => setFormBuku({ ...formBuku, jenjang: e.target.value })}>
                  {JENJANG_OPSI.map((j) => <option key={j} value={j}>{j}</option>)}
                </select>
              </label>
              <label style={st.label}>Kelas
                <input style={st.input} type="number" value={formBuku.kelas} onChange={(e) => setFormBuku({ ...formBuku, kelas: e.target.value })} />
              </label>
              <label style={st.label}>Emoji
                <input style={st.input} value={formBuku.emoji} onChange={(e) => setFormBuku({ ...formBuku, emoji: e.target.value })} />
              </label>
              <label style={st.label}>Warna
                <input style={{ ...st.input, padding: 3 }} type="color" value={formBuku.warna} onChange={(e) => setFormBuku({ ...formBuku, warna: e.target.value })} />
              </label>
              <label style={{ ...st.label, gridColumn: '1 / -1' }}>Deskripsi
                <input style={st.input} value={formBuku.deskripsi} onChange={(e) => setFormBuku({ ...formBuku, deskripsi: e.target.value })} />
              </label>
            </div>
          )}
        </div>

        {/* ================= LANGKAH 2: FILE ================= */}
        <div style={st.card}>
          <div style={{ ...st.judulCard, justifyContent: 'space-between' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}><span style={st.langkah}>2</span> File modul (PDF)</span>
            {items.length > 0 && (
              <span style={{ display: 'flex', gap: 6 }}>
                <button onClick={urutkanOtomatis} style={st.btnKecil}><Layers size={12} /> Urutkan otomatis</button>
                <button onClick={() => setItems([])} style={{ ...st.btnKecil, color: '#dc2626' }}><Trash2 size={12} /> Kosongkan</button>
              </span>
            )}
          </div>

          <div
            ref={dropRef}
            onDragOver={(e) => { e.preventDefault(); setSeretDrag(true); }}
            onDragLeave={() => setSeretDrag(false)}
            onDrop={(e) => { e.preventDefault(); setSeretDrag(false); tambahFile(e.dataTransfer.files); }}
            onClick={() => fileRef.current?.click()}
            style={{ ...st.drop, borderColor: seretDrag ? '#4C6EF5' : '#cbd5e1', background: seretDrag ? '#eef2ff' : '#f8fafc' }}
          >
            <UploadCloud size={28} color="#4C6EF5" />
            <div style={{ fontSize: 13, fontWeight: 800, color: '#1e293b', marginTop: 6 }}>Tarik file PDF ke sini, atau klik untuk memilih</div>
            <div style={{ fontSize: 11, color: '#64748b', marginTop: 3, lineHeight: 1.6 }}>
              Bisa banyak sekaligus. Nomor & judul bab dibaca otomatis dari nama file
              (mis. <code style={st.code}>13 Teorema Phytagoras @my99dreams.pdf</code> → Bab 13).
            </div>
            <input ref={fileRef} type="file" accept="application/pdf,.pdf" multiple style={{ display: 'none' }} onChange={(e) => { tambahFile(e.target.files); if (fileRef.current) fileRef.current.value = ''; }} />
          </div>

          {menganalisis && <div style={st.infoBar}><Loader2 size={13} className="spin" /> Menganalisis PDF (jumlah halaman, lapisan teks, thumbnail)...</div>}
          {pesan && <div style={{ ...st.infoBar, background: '#fef2f2', borderColor: '#fecaca', color: '#991b1b' }}>{pesan}</div>}
          {bentrok.size > 0 && (
            <div style={{ ...st.infoBar, background: '#fffbeb', borderColor: '#fde68a', color: '#92400e' }}>
              <AlertTriangle size={13} /> Id bab kembar: {[...bentrok].join(', ')} — yang belakang akan menimpa yang depan. Ubah nomor/judulnya kalau memang bab berbeda.
            </div>
          )}

          {items.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 10 }}>
              {items.map((it) => (
                <div key={it.kunci} style={{ ...st.barisFile, borderLeft: `4px solid ${warnaStatus(it.status)}` }}>
                  <div style={st.thumbKotak}>
                    {it.thumb ? <img src={it.thumb} alt="" style={st.thumbImg} /> : <FileText size={18} color="#cbd5e1" />}
                  </div>

                  <div style={{ flex: 1, minWidth: 220 }}>
                    <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
                      <input
                        value={it.judul}
                        onChange={(e) => ubah(it.kunci, { judul: e.target.value, babId: babIdDari(it.nomor, e.target.value) })}
                        style={{ ...st.input, flex: 1, minWidth: 150, fontWeight: 700 }}
                        title="Judul bab (terlihat siswa)"
                      />
                      <label style={{ fontSize: 10.5, fontWeight: 700, color: '#64748b', display: 'flex', alignItems: 'center', gap: 4 }}>
                        No
                        <input
                          type="number" min={1} value={it.nomor ?? ''}
                          onChange={(e) => {
                            const n = e.target.value === '' ? null : Number(e.target.value);
                            ubah(it.kunci, { nomor: n, urutan: n || it.urutan, babId: babIdDari(n, it.judul) });
                          }}
                          style={{ ...st.input, width: 54, padding: '6px' }}
                        />
                      </label>
                    </div>

                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 6, alignItems: 'center' }}>
                      <span style={st.meta}>{it.nama}</span>
                      <span style={st.meta}>{ukuranTerbaca(it.ukuran)}</span>
                      {it.info && <span style={st.meta}>{it.info.jumlahHalaman} hal</span>}
                      {it.info && (
                        <span style={{ ...st.badge, background: it.info.hasilPindai ? '#fef3c7' : '#dcfce7', color: it.info.hasilPindai ? '#92400e' : '#166534' }}>
                          {it.info.hasilPindai ? 'scan' : it.info.adaLapisanTeks ? 'ada teks' : 'tanpa teks'}
                        </span>
                      )}
                      <select
                        value={it.mode}
                        onChange={(e) => ubah(it.kunci, { mode: e.target.value })}
                        style={{ ...st.input, padding: '4px 6px', fontSize: 10.5, width: 190 }}
                        title="Modul Asli = siswa membaca halaman PDF asli. Konversi = teks diubah jadi bab terstruktur (hanya bagus untuk PDF berlapis teks)."
                      >
                        <option value="pdf">Modul Asli (PDF, fidelity 100%)</option>
                        <option value="konversi" disabled={!it.info?.adaLapisanTeks}>Konversi jadi bab terstruktur</option>
                      </select>
                      <label style={{ fontSize: 10.5, color: '#64748b', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 3 }}>
                        hal
                        <input type="number" min={1} value={it.halMulai ?? 1} onChange={(e) => ubah(it.kunci, { halMulai: Number(e.target.value) || 1 })} style={{ ...st.input, width: 46, padding: '4px' }} />
                        –
                        <input type="number" min={1} value={it.halSampai ?? ''} onChange={(e) => ubah(it.kunci, { halSampai: Number(e.target.value) || null })} style={{ ...st.input, width: 46, padding: '4px' }} />
                      </label>
                      <label style={{ fontSize: 10.5, color: '#64748b', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4 }}>
                        <input type="checkbox" checked={it.aktif} onChange={(e) => ubah(it.kunci, { aktif: e.target.checked })} /> terbit
                      </label>
                    </div>

                    <div style={{ fontSize: 10.5, color: it.status === 'error' || it.status === 'gagal' ? '#dc2626' : '#64748b', marginTop: 5, lineHeight: 1.5 }}>
                      {it.pesan || (it.status === 'antre' ? 'Menunggu analisis...' : '')}
                      <span style={{ color: '#94a3b8' }}> • id: <code style={st.code}>{it.babId}</code> • urutan {it.urutan || '-'}</span>
                    </div>

                    {(it.status === 'unggah' || it.status === 'terbit' || it.status === 'ai') && (
                      <div style={st.barProgres}><div style={{ ...st.barProgresIsi, width: `${it.progres || 0}%`, background: it.status === 'terbit' ? '#22c55e' : it.status === 'ai' ? '#7c3aed' : '#4C6EF5' }} /></div>
                    )}
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flexShrink: 0 }}>
                    <button
                      onClick={() => jalankanAi(it)}
                      disabled={it.status === 'ai' || it.status === 'analisis' || !it.info}
                      style={{ ...st.btnKecil, color: '#7c3aed', borderColor: '#e9d5ff' }}
                      title="Tulis ulang scan jadi bab interaktif (rumus LaTeX + visual + soal + kunci) lewat AI gratis"
                    >
                      {it.status === 'ai' ? <Loader2 size={12} className="spin" /> : <Sparkles size={12} />} AI
                    </button>
                    {it.status === 'terbit' && bukuSiap ? (
                      <button onClick={() => window.open(`/siswa/buku/${bukuSiap.id}/${it.babId}`, '_blank')} style={st.btnKecil} title="Lihat di reader siswa"><Eye size={12} /> Lihat</button>
                    ) : (
                      <button onClick={() => pecahBaris(it)} style={st.btnKecil} title="Pecah file ini jadi 2 bab berdasarkan rentang halaman" disabled={!it.info}><Split size={12} /> Pecah</button>
                    )}
                    {it.info?.adaLapisanTeks && it.status !== 'terbit' && (
                      <button onClick={() => deteksiBab(it)} style={st.btnKecil} title="Cari penanda BAB di dalam PDF ini"><Scissors size={12} /> Deteksi bab</button>
                    )}
                    <button onClick={() => hapus(it.kunci)} style={{ ...st.btnKecil, color: '#dc2626' }} title="Buang dari antrean"><Trash2 size={12} /></button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ================= LANGKAH 3: UNGGAH ================= */}
        <div style={st.card}>
          <div style={st.judulCard}><span style={st.langkah}>3</span> Unggah & terbitkan</div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            <button onClick={mulai} disabled={!siapHitung || tahap === 'jalan'} style={{ ...st.btnUtama, opacity: !siapHitung || tahap === 'jalan' ? 0.5 : 1 }}>
              {tahap === 'jalan' ? <Loader2 size={15} className="spin" /> : <UploadCloud size={15} />}
              Unggah & Terbitkan {siapHitung ? `(${siapHitung} modul)` : ''}
            </button>
            {tahap === 'selesai' && hasil.length > 0 && (
              <button onClick={() => navigate('/admin/buku')} style={st.btnKedua}><CheckCircle2 size={14} /> Selesai — kembali ke Manajer Buku</button>
            )}
          </div>

          {tahap === 'jalan' && (
            <div style={{ marginTop: 10 }}>
              <div style={st.barProgres}><div style={{ ...st.barProgresIsi, width: `${progresTotal}%` }} /></div>
              <div style={{ fontSize: 10.5, color: '#64748b', marginTop: 4 }}>{progresTotal}% — jangan tutup halaman ini sampai selesai.</div>
            </div>
          )}

          {log.length > 0 && (
            <pre style={st.log}>{log.join('\n')}</pre>
          )}

          {tahap === 'selesai' && hasil.length > 0 && (
            <div style={{ marginTop: 10, background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 10, padding: 12 }}>
              <div style={{ fontSize: 12.5, fontWeight: 800, color: '#166534', marginBottom: 6 }}>✅ {hasil.length} bab terbit</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {hasil.map((h) => (
                  <div key={h.id} style={{ fontSize: 11, color: '#14532d', display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
                    <b>{h.urutan}.</b> {h.judul}
                    <span style={{ color: '#16a34a' }}>• {h.tipe === 'pdf' ? `${h.halamanMulai}–${h.halamanSelesai} dari ${h.jumlahHalaman} hal` : `${(h.sections || []).length} seksi, ${(h.ujiPemahaman || []).length} soal`}</span>
                    {bukuSiap && (
                      <a href={`/siswa/buku/${bukuSiap.id}/${h.id}`} target="_blank" rel="noreferrer" style={{ color: '#4C6EF5', fontWeight: 700, textDecoration: 'none' }}>
                        buka di reader ↗
                      </a>
                    )}
                  </div>
                ))}
              </div>
              <div style={{ fontSize: 10.5, color: '#166534', marginTop: 8, lineHeight: 1.6 }}>
                💡 Langkah berikutnya: pasang soal interaktif. Buka <b>Manajer Buku → bab → 🖼️ Gambar dari Modul</b> untuk memotong
                gambar/diagram langsung dari halaman modul (tidak perlu upload manual), lalu tempel ke soal.
              </div>
            </div>
          )}
        </div>

        {/* ================= PANDUAN SINGKAT ================= */}
        <details style={st.card}>
          <summary style={{ fontSize: 12, fontWeight: 800, color: '#4C6EF5', cursor: 'pointer' }}>Cara kerja & keputusan desain (baca sekali)</summary>
          <div style={{ fontSize: 11.5, color: '#475569', lineHeight: 1.75, marginTop: 8 }}>
            <p><b>Modul scan disimpan apa adanya.</b> Modul bimbel umumnya PDF hasil scan: 1 halaman = 1 gambar raster, tanpa lapisan teks.
              Memaksanya jadi teks (OCR) merusak rumus pecahan, pangkat, dan diagram. Dengan <b>Modul Asli</b>, siswa membaca halaman persis
              seperti modul cetaknya — rumus & gambar 100% HD — sambil tetap dapat lapisan interaktif: progres baca, XP, dan Uji Pemahaman.</p>
            <p><b>Gambar tidak di-upload manual lagi.</b> Semua gambar soal dipotong langsung dari halaman modul lewat
              <b> Ambil Gambar dari Modul</b> (deteksi otomatis + tarik kotak). Sekali ketuk → terupload ke Storage → URL siap dipasang.</p>
            <p><b>Anti kerja dua kali.</b> Sidik jari (hash) tiap file disimpan. Unggah ulang file yang sama tidak membuat duplikat di Storage.</p>
            <p><b>Satu PDF bisa jadi banyak bab.</b> Pakai <b>Pecah</b> (rentang halaman) atau <b>Deteksi bab</b> (kalau PDF-nya punya lapisan teks
              dengan penanda "BAB n").</p>
            <p><b>Skala.</b> Tambah buku baru untuk kelas/jenjang lain = buat buku baru di langkah 1, lalu impor modulnya. Nol perubahan kode, nol deploy.</p>
            <p><b>✨ Tombol AI per file</b> = tulis ulang scan menjadi bab TERSTRUKTUR interaktif (materi LaTeX, visual vektor/tabel, soal + kunci + pembahasan)
              memakai AI gratis (Groq → OpenRouter → Mistral, otomatis memilih yang tersedia). PDF asli tetap tersimpan di Supabase sehingga mode
              "Modul Asli" tetap bisa dipakai sebagai cadangan/pembanding lewat tombol tukar mode di Manajer Buku. Hasil AI selalu melewati
              pembersihan struktur sebelum disimpan: soal cacat dibuang, placeholder gambar diganti URL potongan asli.</p>
          </div>
        </details>
      </div>
    </div>
  );
}

function warnaStatus(s) {
  if (s === 'ai') return '#7c3aed';
  if (s === 'terbit') return '#22c55e';
  if (s === 'error' || s === 'gagal') return '#ef4444';
  if (s === 'unggah' || s === 'analisis') return '#4C6EF5';
  if (s === 'siap') return '#f59e0b';
  return '#cbd5e1';
}

const st = {
  page: { minHeight: '100vh', background: '#f8fafc', fontFamily: 'sans-serif', paddingBottom: 60 },
  header: { display: 'flex', alignItems: 'center', gap: 10, padding: '14px 16px', background: 'white', borderBottom: '1px solid #e2e8f0', position: 'sticky', top: 0, zIndex: 10 },
  backBtn: { background: '#f1f5f9', border: 'none', borderRadius: 8, width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#475569' },
  card: { background: 'white', borderRadius: 12, border: '1px solid #e2e8f0', padding: 14, boxShadow: '0 1px 3px rgba(0,0,0,0.04)' },
  judulCard: { fontSize: 13, fontWeight: 800, color: '#1e293b', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 8 },
  langkah: { width: 20, height: 20, borderRadius: '50%', background: '#4C6EF5', color: 'white', fontSize: 11, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center' },
  label: { display: 'flex', flexDirection: 'column', gap: 3, fontSize: 10.5, fontWeight: 700, color: '#475569' },
  input: { border: '1px solid #cbd5e1', borderRadius: 8, padding: '8px 10px', fontSize: 12, color: '#1e293b', background: 'white' },
  code: { background: '#f1f5f9', padding: '1px 5px', borderRadius: 4, fontFamily: 'monospace', fontSize: 10.5 },
  pill: { background: '#f1f5f9', color: '#334155', border: '1px solid #e2e8f0', borderRadius: 999, padding: '7px 13px', fontSize: 11.5, fontWeight: 700, cursor: 'pointer' },
  pillAktif: { background: '#4C6EF5', color: 'white', border: '1px solid #4C6EF5', borderRadius: 999, padding: '7px 13px', fontSize: 11.5, fontWeight: 800, cursor: 'pointer' },
  drop: { border: '2px dashed #cbd5e1', borderRadius: 12, padding: '22px 16px', textAlign: 'center', cursor: 'pointer', transition: 'all .15s' },
  infoBar: { display: 'flex', alignItems: 'center', gap: 7, background: '#eff6ff', border: '1px solid #bfdbfe', color: '#1d4ed8', borderRadius: 8, padding: '8px 10px', fontSize: 11, marginTop: 10, lineHeight: 1.5 },
  barisFile: { display: 'flex', gap: 10, border: '1px solid #e2e8f0', borderRadius: 10, padding: 10, background: '#fcfcfd', alignItems: 'flex-start', flexWrap: 'wrap' },
  thumbKotak: { width: 62, height: 82, borderRadius: 7, border: '1px solid #e2e8f0', background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0 },
  thumbImg: { width: '100%', height: '100%', objectFit: 'cover' },
  meta: { fontSize: 10.5, color: '#64748b', background: '#f1f5f9', borderRadius: 6, padding: '2px 7px', fontWeight: 600 },
  badge: { fontSize: 9.5, fontWeight: 800, borderRadius: 999, padding: '2px 8px', textTransform: 'uppercase', letterSpacing: 0.3 },
  btnKecil: { display: 'flex', alignItems: 'center', gap: 4, background: '#f1f5f9', color: '#334155', border: 'none', borderRadius: 7, padding: '5px 8px', fontSize: 10.5, fontWeight: 700, cursor: 'pointer' },
  btnUtama: { display: 'flex', alignItems: 'center', gap: 7, background: '#4C6EF5', color: 'white', border: 'none', borderRadius: 9, padding: '11px 16px', fontSize: 12.5, fontWeight: 800, cursor: 'pointer' },
  btnKedua: { display: 'flex', alignItems: 'center', gap: 7, background: '#16a34a', color: 'white', border: 'none', borderRadius: 9, padding: '11px 16px', fontSize: 12.5, fontWeight: 800, cursor: 'pointer' },
  barProgres: { height: 6, background: '#e2e8f0', borderRadius: 99, overflow: 'hidden', marginTop: 7 },
  barProgresIsi: { height: '100%', background: '#4C6EF5', borderRadius: 99, transition: 'width .25s ease' },
  log: { background: '#0f172a', color: '#cbd5e1', borderRadius: 10, padding: 11, fontSize: 10.5, lineHeight: 1.7, marginTop: 10, maxHeight: 220, overflowY: 'auto', whiteSpace: 'pre-wrap', fontFamily: 'monospace' },
};