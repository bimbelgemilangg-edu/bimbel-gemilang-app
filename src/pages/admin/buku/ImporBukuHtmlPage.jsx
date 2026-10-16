// src/pages/admin/buku/ImporBukuHtmlPage.jsx
/* global __BUILD_STAMP__ */
// ============================================================
// 📚 IMPOR BUKU HTML — MESIN FINAL (owner 14-15 Okt 2026):
// buku scan terkonversi HTML (satu gambar per halaman) masuk sistem:
//   • BERKAS MENTAH TERSIMPAN: gambar halaman diunggah ke Supabase
//     (impor-buku/<jobId>/hal-NNNN.*) sehingga ekstraksi bisa DILANJUTKAN
//     dari perangkat/browser mana pun sampai 100% (keputusan owner 15 Okt:
//     "file mentah tetap disimpan untuk dilanjutkan sampai benar-benar
//     terekstrak semua"). Progres per kelompok halaman = subkoleksi Firestore
//     `impor_buku_jobs/<jobId>/kelompok`, bukan localStorage browser.
//   • Ekstraksi MATERI+SOAL per ≤10 halaman via api/konversiModulScan
//     (AI vision, kunci di server); tahan banting: payload besar dipecah
//     dua otomatis, kuota habis = jeda otomatis.
//   • Bab dilebur otomatis dari judul tercetak (gabungkanBabBerjudul);
//     nama bab bisa dikoreksi; bab bisa dilewati (checkbox "ikut").
//   • Simpan: draf buku_digital+bab + opsi butir bank_soal per bab,
//     dengan PENJAGA ANTI-DUPLIKAT (berkas+halaman+teks / judul+rentang).
// ============================================================
import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../../../firebase';
import {
  collection, getDocs, addDoc, setDoc, doc, writeBatch, query, where, serverTimestamp, updateDoc,
} from 'firebase/firestore';
import { ArrowLeft, BookUp, Loader2, CheckCircle2, AlertTriangle, RefreshCw } from 'lucide-react';
import {
  inventarisBukuHtml, ekstrakGambarHalamanDariHtml, kelompokkanHalamanUntukAi, butirBankDariUjiPemahaman,
  keGambarAi, klasifikasiGagalEkstraksi, parseResponsEkstraksi,
  saringButirDuplikat, saringBabDuplikat, gabungkanBabBerjudul, perkiraanPanggilanAi,
  angkaBerkas, urutkanBerkasGambar, klasifikasiGambarHalaman, aksiModeImpor, labelBabTersimpan,
  pesanRingkasanSimpan,
} from '../../../utils/pecahBukuHtml';
import { saranKelasUntukMateri } from '../../../utils/saranKelasUntukMateri';
import { normalkanBabUntukReader } from '../../../utils/normalisasiBabReader';
import { adaptorBukuLatex } from '../../../utils/adaptorBukuLatex';
import { parseTeksBuku, htmlKeTeks, susunTeksDariItem, bersihkanTeksOcr } from '../../../utils/parseTeksBuku';
import { uploadElearningFile } from '../../../services/uploadService';

const COL_JOB = 'impor_buku_jobs';
const JENJANG = ['SD', 'SMP', 'SMA/MA', 'SMK'];

const st = {
  kartu: { background: '#fff', border: '1px solid #e5e7eb', borderRadius: 14, padding: 16, marginBottom: 14 },
  label: { display: 'block', fontSize: 11, fontWeight: 800, color: '#475569', marginBottom: 4 },
  input: { width: '100%', padding: '9px 10px', borderRadius: 9, border: '1px solid #cbd5e1', fontSize: 12.5, boxSizing: 'border-box' },
  tombol: (mati) => ({
    background: mati ? '#cbd5e1' : '#5B2ECC', color: '#fff', border: 'none', borderRadius: 10,
    padding: '10px 16px', fontSize: 13, fontWeight: 800, cursor: mati ? 'not-allowed' : 'pointer',
    display: 'inline-flex', alignItems: 'center', gap: 8,
  }),
  kecil: { border: '1px solid #cbd5e1', background: '#fff', borderRadius: 8, padding: '4px 9px', fontSize: 11, fontWeight: 700, cursor: 'pointer', color: '#334155' },
  log: (ok) => ({ fontSize: 11.5, color: ok ? '#166534' : '#991b1b', padding: '3px 0' }),
};

const blobKeBase64 = (blob) => new Promise((resolve, reject) => {
  const r = new FileReader();
  r.onload = () => resolve(String(r.result));
  r.onerror = reject;
  r.readAsDataURL(blob);
});

export default function ImporBukuHtmlPage() {
  const navigate = useNavigate();
  const [namaFile, setNamaFile] = useState('');
  const [gambar, setGambar] = useState([]);
  const [inv, setInv] = useState(null);
  const [identitas, setIdentitas] = useState({ mapel: 'Matematika', jenjang: 'SMA/MA', kelas: '10', materi: '', judulBuku: '' });
  const [targetBuku, setTargetBuku] = useState('baru');
  const [bukuId, setBukuId] = useState('');
  const [daftarBuku, setDaftarBuku] = useState([]);
  const [ikutBank, setIkutBank] = useState(true);
  const [sibuk, setSibuk] = useState(false);
  const [log, setLog] = useState([]);
  const [saran, setSaran] = useState(null);
  const [pratinjau, setPratinjau] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [jobAktif, setJobAktif] = useState(null);
  const [modeSumber, setModeSumber] = useState('gambar'); // 'gambar' | 'teks' | 'folder'
  const [figurFiles, setFigurFiles] = useState([]);
  const [figsPerHalaman, setFigsPerHalaman] = useState(new Map());
  const [teksBuku, setTeksBuku] = useState('');
  const [ringkasan, setRingkasan] = useState(null);
  const [latexHasil, setLatexHasil] = useState(null);
  const jedaRef = useRef(false);

  const tambahLog = (teks, ok = true) => setLog((l) => [...l, { teks, ok }]);

  const muatJobs = async () => {
    try {
      const snap = await getDocs(query(collection(db, COL_JOB), where('status', 'in', ['mengunggah', 'berjalan'])));
      setJobs(snap.docs.map((d) => ({ id: d.id, ...d.data() })).sort((a, b) => String(b.diperbaruiPada || '').localeCompare(String(a.diperbaruiPada || ''))));
    } catch (e) {
      console.error('Gagal memuat pekerjaan impor:', e);
    }
  };
  useEffect(() => { muatJobs(); }, []);

  const bacaFolder = async (fileList) => {
    const files = Array.from(fileList || []).filter((f) => f.type.startsWith('image/'));
    if (!files.length) return;
    const terurut = urutkanBerkasGambar(files.map((f) => f.name));
    const byName = new Map(files.map((f) => [f.name, f]));
    const halamanUris = [];
    const figur = [];
    let totalByte = 0;
    for (const nama of terurut) {
      const f = byName.get(nama);
      totalByte += f.size;
      const dataUri = await new Promise((res) => { const r = new FileReader(); r.onload = () => res(String(r.result)); r.readAsDataURL(f); });
      const dim = await new Promise((res) => { const im = new Image(); im.onload = () => res({ w: im.naturalWidth, h: im.naturalHeight }); im.onerror = () => res({ w: 0, h: 0 }); im.src = dataUri; });
      if (klasifikasiGambarHalaman(dim.w, dim.h) === 'halaman') halamanUris.push(dataUri);
      else figur.push(f);
    }
    setNamaFile(`${terurut.length} gambar (${files[0].name.slice(0, 12)}…)`);
    setGambar(halamanUris);
    setFigurFiles(figur);
    setTeksBuku('');
    setInv({ jumlahGambarHalaman: halamanUris.length, ukuranByte: totalByte, adaTeksLayer: false, layakSimpanUtuhDiFirestore: false, saran: `Folder terbaca: ${halamanUris.length} gambar halaman + ${figur.length} gambar figur (figur disimpan terpisah sebagai aset, tidak diekstraksi jadi teks).` });
    setPratinjau(null); setRingkasan(null); setLog([]); setJobAktif(null);
    tambahLog(`Folder dimuat: ${halamanUris.length} halaman urut ${terurut.length ? angkaBerkas(terurut[0]) : '-'}..${terurut.length ? angkaBerkas(terurut[terurut.length - 1]) : '-'} + ${figur.length} figur.`);
  };

  const muatLibPdf = () => new Promise((resolve) => {
    if (window.pdfjsLib) { resolve(window.pdfjsLib); return; }
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
    script.async = true;
    script.onload = () => {
      window.pdfjsLib.GlobalWorkerOptions.workerSrc =
        'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
      resolve(window.pdfjsLib);
    };
    document.head.appendChild(script);
  });

  //  FIGUR OTOMATIS dari PDF: rect gambar diambil dari operator list
  // (transform terakhir sebelum paintImage*), dipotong dari render halaman,
  // diunggah ke Supabase, lalu DITEMPEL otomatis ke soal/blok halaman yang
  // sama — jawaban atas "biar final tersimpan rapi" tanpa tempel manual.
  const ekstrakFigurHalaman = async (lib, page, nomorHal) => {
    const opList = await page.getOperatorList();
    const viewport = page.getViewport({ scale: 1 });
    const areaPage = viewport.width * viewport.height;
    let ctm = null;
    const rects = [];
    for (let k = 0; k < opList.fnArray.length; k += 1) {
      const fn = opList.fnArray[k];
      if (fn === lib.OPS.transform) { ctm = opList.argsArray[k]; continue; }
      if ((fn === lib.OPS.paintImageXObject || fn === lib.OPS.paintJpegXObject) && ctm) {
        const [a, , , d, e, f] = ctm;
        const w = Math.abs(a); const hgt = Math.abs(d);
        if (w < 1 || hgt < 1) continue;
        const r = viewport.convertToViewportRectangle([e, f, e + w, f + hgt]);
        const rect = { x: Math.min(r[0], r[2]), y: Math.min(r[1], r[3]), w: Math.abs(r[2] - r[0]), h: Math.abs(r[3] - r[1]) };
        const luas = rect.w * rect.h;
        if (rect.w > 60 && rect.h > 60 && luas > areaPage * 0.015 && luas < areaPage * 0.7) rects.push(rect);
      }
    }
    if (!rects.length) return [];
    const skala = 2;
    const vp = page.getViewport({ scale: skala });
    const canvas = document.createElement('canvas');
    canvas.width = Math.ceil(vp.width); canvas.height = Math.ceil(vp.height);
    await page.render({ canvasContext: canvas.getContext('2d'), viewport: vp }).promise;
    const urls = [];
    for (let ri = 0; ri < rects.length; ri += 1) {
      const r = rects[ri];
      const off = document.createElement('canvas');
      off.width = Math.max(8, Math.ceil(r.w * skala)); off.height = Math.max(8, Math.ceil(r.h * skala));
      off.getContext('2d').drawImage(canvas, r.x * skala, r.y * skala, r.w * skala, r.h * skala, 0, 0, off.width, off.height);
      const blob = await new Promise((res) => off.toBlob(res, 'image/png'));
      if (!blob) continue;
      const file = new File([blob], `figur-hal${nomorHal}-${ri + 1}.png`, { type: 'image/png' });
      const hasil = await uploadElearningFile(file, `impor-buku/figur-${Date.now()}`, { kompres: false, contentType: 'image/png' });
      if (hasil?.success && hasil.downloadURL) urls.push(hasil.downloadURL);
    }
    return urls;
  };

  // 📑 MODE PDF BERTEKS (owner 15 Okt: "aku tinggal upload pdf ocr"):
  // lapisan teks hasil OCR (PDF24/Google Docs) dibaca langsung di browser
  // lewat pdfjs — TANPA panggilan AI vision, tanpa kuota model.
  const bacaPdf = async (f) => {
    setSibuk(true); setLog([]); setPratinjau(null); setRingkasan(null);
    try {
      const lib = await muatLibPdf();
      const doc = await lib.getDocument({ data: await f.arrayBuffer() }).promise;
      const keluar = [];
      const figs = new Map();
      for (let i = 1; i <= doc.numPages; i += 1) {
        const page = await doc.getPage(i);
        const tc = await page.getTextContent();
        keluar.push(`--- HALAMAN ${i} ---`);
        keluar.push(bersihkanTeksOcr(susunTeksDariItem(tc.items)));
        try {
          const urls = await ekstrakFigurHalaman(lib, page, i);
          if (urls.length) figs.set(i, urls);
        } catch (_e) { /* halaman tanpa figur bukan masalah */ }
        page.cleanup();
        if (i % 50 === 0) tambahLog(`… membaca teks+figur halaman ${i}/${doc.numPages}`);
      }
      await doc.destroy();
      setNamaFile(f.name);
      setTeksBuku(keluar.join('\n'));
      setInv(null); setGambar([]); setFigurFiles([]); setJobAktif(null);
      setFigsPerHalaman(figs);
      const jmlFig = [...figs.values()].reduce((a, b) => a + b.length, 0);
      tambahLog(`✓ PDF ${doc.numPages} halaman terbaca: teks OCR + ${jmlFig} figur diekstrak & akan ditempel otomatis ke soal/blok halamannya (mode bebas kuota).`);
    } catch (e) {
      tambahLog(`✗ Gagal membaca PDF: ${e?.message || e}. Bila PDF murni scan (tanpa lapisan teks), pakai mode gambar/folder atau OCR dulu di PDF24.`, false);
    } finally {
      setSibuk(false);
    }
  };

  const bangunPratinjauLatex = async () => {
    if (sibuk || !latexHasil) return;
    setSibuk(true);
    try {
      const peta = new Map();
      const kumpul = (src) => { if (String(src).startsWith('data:') && !peta.has(src)) peta.set(src, null); };
      latexHasil.bab.forEach((b) => {
        (b.sections || []).forEach((s2) => (s2.blocks || []).forEach((bl) => { if (bl.tipe === 'gambar') kumpul(bl.src); }));
        (b.ujiPemahaman || []).forEach((q) => (q.gambarUrls || []).forEach(kumpul));
      });
      if (peta.size) tambahLog(`… mengunggah ${peta.size} gambar crop ke penyimpanan sistem …`);
      let i = 0;
      for (const key of [...peta.keys()]) {
        const blob = await (await fetch(key)).blob();
        const file = new File([blob], `latex-${i}-${Date.now()}.png`, { type: blob.type || 'image/png' });
        const hasil = await uploadElearningFile(file, 'impor-buku/latex', { kompres: false, contentType: blob.type || 'image/png' });
        if (hasil?.success && hasil.downloadURL) peta.set(key, hasil.downloadURL);
        i += 1;
      }
      const ganti = (src) => peta.get(src) || src;
      const babs = latexHasil.bab.map((b) => ({
        ...b,
        judulEdit: b.judul,
        disertakan: true,
        halamanMulai: null,
        halamanSelesai: null,
        provider: ['latex-html'],
        sections: (b.sections || []).map((s2) => ({ ...s2, blocks: (s2.blocks || []).map((bl) => (bl.tipe === 'gambar' ? { ...bl, src: ganti(bl.src) } : bl)) })),
        ujiPemahaman: (b.ujiPemahaman || []).map((q) => ({ ...q, gambarUrls: (q.gambarUrls || []).map(ganti) })),
      }));
      const butir = [];
      babs.forEach((b, bi) => (b.ujiPemahaman || []).forEach((item) => {
        const satu = butirBankDariUjiPemahaman(item, {
          mapel: identitas.mapel, jenjang: identitas.jenjang, kelas: identitas.kelas,
          materi: b.judul || identitas.materi, sumber: namaFile,
        }, null);
        if (satu) butir.push({ ...satu, dipilih: true, babIndex: bi, asal: `latex · ${String(b.judul).slice(0, 24)}` });
      }));
      setPratinjau({ babs, butir, semuaKelompok: babs.length, selesaiKelompok: babs.length });
      tambahLog(`Pratinjau LaTeX: ${babs.length} bab & ${butir.length} soal siap bank (kunci RESMI buku). Tinjau lalu Simpan.`);
    } catch (e) {
      tambahLog(`✗ ${e?.message || e}`, false);
    } finally {
      setSibuk(false);
    }
  };

  const bangunPratinjauTeks = () => {
    const bersih = teksBuku.split('\n').filter((l) => !/^--- HALAMAN \d+ ---$/.test(l.trim())).join('\n');
    const { bab } = parseTeksBuku(bersih);
    // tempel figur otomatis: blok materi & soal menerima gambar halamannya
    bab.forEach((b) => {
      b.sections = (b.sections || []).map((sek) => {
        const blocks = [];
        (sek.blocks || []).forEach((bl) => {
          blocks.push(bl);
          // KONTRAK READER: block gambar memakai `tipe` + `caption`
          (figsPerHalaman.get(bl.halaman) || []).forEach((url) => blocks.push({ tipe: 'gambar', src: url, alt: `figur halaman ${bl.halaman}`, caption: `figur halaman ${bl.halaman}` }));
        });
        return { ...sek, blocks };
      });
      b.ujiPemahaman = (b.ujiPemahaman || []).map((soal, qi) => {
        const figs = figsPerHalaman.get(soal.halaman) || [];
        return {
          ...soal,
          id: soal.id || `q${qi + 1}`,
          gambarUrls: figs,
          // reader membaca gambar tunggal; bank soal memakai gambarUrls
          ...(figs[0] ? { gambar: { src: figs[0], alt: `figur soal halaman ${soal.halaman}`, caption: '' } } : {}),
        };
      });
    });
    const babs = bab.map((b) => ({
      judul: b.judul, judulEdit: b.judul, sections: b.sections, ujiPemahaman: b.ujiPemahaman,
      halamanMulai: null, halamanSelesai: null, provider: ['teks-ocr'], disertakan: true,
    }));
    const butir = [];
    babs.forEach((b, bi) => {
      (b.ujiPemahaman || []).forEach((item) => {
        const satu = butirBankDariUjiPemahaman(item, {
          mapel: identitas.mapel, jenjang: identitas.jenjang, kelas: identitas.kelas,
          materi: b.judul || identitas.materi, sumber: namaFile,
        }, null);
        if (satu) butir.push({ ...satu, dipilih: true, babIndex: bi, asal: 'teks OCR' });
      });
    });
    setPratinjau({ babs, butir, semuaKelompok: babs.length, selesaiKelompok: babs.length });
    tambahLog(`Mode teks: ${babs.length} bab & ${butir.length} soal pg terparse TANPA panggilan AI. Soal tanpa kunci OCR dibuang jujur.`);
  };

  const bacaBerkas = async (f) => {
    const teks = await f.text();
    if (modeSumber === 'latex') {
      const hasil = adaptorBukuLatex(teks);
      setNamaFile(f.name);
      setLatexHasil(hasil);
      setInv(null); setGambar([]); setPratinjau(null); setLog([]); setJobAktif(null); setRingkasan(null);
      tambahLog(`✓ HTML LaTeX terbaca: ${hasil.statistik.bab} bab · ${hasil.statistik.seksi} seksi · ${hasil.statistik.soal} soal (${hasil.statistik.soalBerkunci} berkunci RESMI buku) · ${hasil.statistik.gambar} gambar crop · ${hasil.statistik.tabel} tabel. Tekan "Pratinjau HTML LaTeX" untuk mengunggah gambar & meninjau.`);
      return;
    }
    setLatexHasil(null);
    if (modeSumber === 'teks') {
      setNamaFile(f.name);
      setTeksBuku(/\.html?$/i.test(f.name) ? htmlKeTeks(teks) : teks);
      setInv(null); setGambar([]); setPratinjau(null); setRingkasan(null); setLog([]); setJobAktif(null);
      return;
    }
    setNamaFile(f.name);
    setGambar(ekstrakGambarHalamanDariHtml(teks));
    setInv(inventarisBukuHtml(teks));
    setPratinjau(null); setRingkasan(null);
    setLog([]);
    const cocok = jobs.find((j) => j.namaFile === f.name && j.ukuranByte === teks.length);
    setJobAktif(cocok || null);
    if (cocok) tambahLog(`Pekerjaan lanjutan ditemukan: ${cocok.selesai || 0}/${cocok.jumlahKelompok} kelompok sudah selesai — halaman mentah sudah di sistem, tidak perlu unggah ulang.`);
  };

  const pilihJob = (j) => {
    setJobAktif(j);
    setNamaFile(j.namaFile);
    setInv({ jumlahGambarHalaman: j.jumlahHalaman, ukuranByte: j.ukuranByte, adaTeksLayer: false, saran: 'Pekerjaan lanjutan dari penyimpanan sistem.' });
    if (j.identitas) setIdentitas(j.identitas);
    setGambar(Array.from({ length: j.jumlahHalaman }, () => '')); // penanda jumlah saja; byte diambil dari Supabase
    setPratinjau(null); setRingkasan(null);
    setLog([]);
    tambahLog(`Melanjutkan pekerjaan ${j.namaFile} (${j.selesai || 0}/${j.jumlahKelompok} kelompok selesai).`);
    if (!j.urls) tambahLog('⚠ Job ini belum punya halaman mentah (unggahan sebelumnya terputus). Pilih ulang berkas sumber yang sama — halaman diunggah ke job ini, tidak membuat job baru.', false);
  };

  const buatJobDanUnggah = async () => {
    // ⛔ PENJAGA (15 Okt 2026): melanjutkan job lewat tombol "Lanjutkan"
    // hanya membawa PENANDA jumlah halaman (string kosong), byte aslinya
    // ada di berkas sumber. Tanpa penjaga ini fetch('') mengunggah HTML
    // halaman aplikasi seolah-olah gambar buku.
    if (gambar.some((g) => !g)) {
      throw new Error('Byte halaman mentah tidak lagi ada di memori browser. Pilih ulang berkas/folder sumber yang sama untuk melanjutkan pekerjaan ini — halaman akan diunggah ke job yang sama.');
    }
    // 🔁 PAKAI ULANG JOB (15 Okt 2026): dulu setiap retry pasca-gagal unggah
    // addDoc job BARU sehingga daftar "Pekerjaan belum selesai" membengkak
    // oleh duplikat tanpa halaman mentah. Job terpilih yang belum punya
    // `urls` diperbarui dokumennya, bukan digandakan.
    const dataJob = {
      namaFile, ukuranByte: inv.ukuranByte, jumlahHalaman: gambar.length,
      jumlahKelompok: kelompokkanHalamanUntukAi(gambar).length, selesai: 0,
      identitas, targetBuku, bukuId: targetBuku === 'ada' ? bukuId : '',
      status: 'mengunggah', diperbaruiPada: serverTimestamp(),
    };
    const lanjutJobLama = Boolean(jobAktif?.id && !jobAktif.urls);
    const ref = lanjutJobLama
      ? doc(db, COL_JOB, jobAktif.id)
      : await addDoc(collection(db, COL_JOB), { ...dataJob, dibuatPada: serverTimestamp() });
    if (lanjutJobLama) await updateDoc(ref, dataJob);
    // 🔥 Migrasi progres localStorage lama (pra-#228, milik browser ini)
    // supaya kelompok yang SUDAH sukses kemarin tidak diekstrak ulang
    // (hemat kuota AI owner).
    let migrasi = 0;
    try {
      const kunciLama = `imporBukuHtml:${String(namaFile).toLowerCase()}:${inv.ukuranByte}`;
      const lama = JSON.parse(localStorage.getItem(kunciLama) || '{}');
      const entriLama = Object.entries(lama).filter(([, v]) => v?.status === 'ok' && v?.bab);
      if (entriLama.length) {
        for (const [k, v] of entriLama) {
          await setDoc(doc(db, COL_JOB, ref.id, 'kelompok', k), {
            halamanMulai: Number(v.halamanMulai || k), halamanSelesai: Number(v.halamanSelesai || k),
            status: 'ok', bab: v.bab, provider: v.provider || 'progres lama browser', pada: serverTimestamp(),
          });
          migrasi += 1;
        }
        localStorage.removeItem(kunciLama);
      }
    } catch (_e) { /* tanpa localStorage: abaikan */ }
    const urls = [];
    for (let i = 0; i < gambar.length; i += 1) {
      const mime = (gambar[i].match(/^data:(image\/[a-zA-Z0-9.+-]+);/) || [])[1] || 'image/jpeg';
      const blob = await (await fetch(gambar[i])).blob();
      const ext = mime === 'image/png' ? 'png' : 'jpg';
      const file = new File([blob], `hal-${String(i + 1).padStart(4, '0')}.${ext}`, { type: mime });
      const hasil = await uploadElearningFile(file, `impor-buku/${ref.id}`, { kompres: false, contentType: mime });
      if (!hasil?.success || !hasil.downloadURL) throw new Error(hasil?.error || 'gagal unggah halaman ke penyimpanan');
      urls.push({ url: hasil.downloadURL, mime });
      if ((i + 1) % 50 === 0) tambahLog(`… mengunggah halaman mentah ${i + 1}/${gambar.length} ke penyimpanan sistem.`);
    }
    const figurUrls = [];
    for (const f of figurFiles) {
      const hasil = await uploadElearningFile(f, `impor-buku/${ref.id}/figur`, { kompres: false, contentType: f.type });
      if (hasil?.success && hasil.downloadURL) figurUrls.push({ url: hasil.downloadURL, nama: f.name });
    }
    if (figurUrls.length) tambahLog(`✓ ${figurUrls.length} gambar figur tersimpan sebagai aset (tempelkan ke bab/soal lewat Manajer Buku bila perlu).`);
    await updateDoc(ref, { urls, figurUrls, status: 'berjalan', diperbaruiPada: serverTimestamp() });
    const job = { id: ref.id, namaFile, ukuranByte: inv.ukuranByte, jumlahHalaman: gambar.length, jumlahKelompok: kelompokkanHalamanUntukAi(gambar).length, selesai: 0, identitas, urls, status: 'berjalan' };
    setJobAktif(job);
    tambahLog(`✓ ${gambar.length} halaman mentah tersimpan di penyimpanan sistem (job ${ref.id.slice(0, 6)}). Ekstraksi bisa dilanjutkan dari perangkat mana pun.${migrasi ? ` ${migrasi} kelompok sukses lama dimigrasikan — tidak diekstrak ulang.` : ''}`);
    return job;
  };

  const panggilAi = async (g, kedalaman = 0) => {
    const dataUris = await Promise.all(g.urlSlice.map(async (u) => {
      const blob = await (await fetch(u.url)).blob();
      return await blobKeBase64(blob);
    }));
    const res = await fetch('/api/konversiModulScan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        images: keGambarAi(dataUris),
        placeholders: [],
        meta: {
          judul: `${identitas.materi || identitas.mapel} — halaman ${g.halamanMulai}-${g.halamanSelesai}`,
          mapel: identitas.mapel, jenjang: identitas.jenjang,
        },
      }),
    });
    const pr = parseResponsEkstraksi(await res.text());
    if (pr.ok) return [{ grup: g, bab: pr.json.bab, provider: pr.json.provider }];
    const jenis = klasifikasiGagalEkstraksi(pr.pesan);
    if (jenis === 'payload' && kedalaman < 2 && g.urlSlice.length > 4) {
      const setengah = Math.ceil(g.urlSlice.length / 2);
      tambahLog(`↪ hal ${g.halamanMulai}-${g.halamanSelesai}: payload ditolak -> dipecah dua & dicoba lagi.`);
      const g1 = { ...g, urlSlice: g.urlSlice.slice(0, setengah), halamanSelesai: g.halamanMulai + setengah - 1 };
      const g2 = { ...g, urlSlice: g.urlSlice.slice(setengah), halamanMulai: g.halamanMulai + setengah };
      return [...(await panggilAi(g1, kedalaman + 1)), ...(await panggilAi(g2, kedalaman + 1))];
    }
    if (jenis === 'kuota') {
      const e = new Error(`KUOTA/rate-limit tercapai: ${pr.pesan.slice(0, 140)}`);
      e.kode = 'kuota';
      throw e;
    }
    throw new Error(pr.pesan.slice(0, 200));
  };

  const prosesAi = async () => {
    if (sibuk) return;
    setSibuk(true); setLog((l) => l); setPratinjau(null); setRingkasan(null);
    jedaRef.current = false;
    try {
      let job = jobAktif;
      if (!job || !job.urls) job = await buatJobDanUnggah();
      const grupDasar = kelompokkanHalamanUntukAi(Array.from({ length: job.urls.length }, () => 'x'));
      const snapKel = await getDocs(collection(db, COL_JOB, job.id, 'kelompok'));
      const selesaiSebelum = new Map(snapKel.docs.map((d) => [d.id, d.data()]));
      let selesaiCount = selesaiSebelum.size;
      for (const g0 of grupDasar) {
        const kKey = String(g0.halamanMulai);
        if (selesaiSebelum.has(kKey)) continue;
        if (jedaRef.current) { tambahLog('⏸ Dijeda manual. Progres tersimpan di sistem — lanjutkan kapan pun, dari mana pun.'); break; }
        const g = { ...g0, urlSlice: job.urls.slice(g0.halamanMulai - 1, g0.halamanSelesai) };
        try {
          tambahLog(`Memanggil AI untuk halaman ${g.halamanMulai}-${g.halamanSelesai}…`);
          const hasil = await panggilAi(g);
          for (const h of hasil) {
            await setDoc(doc(db, COL_JOB, job.id, 'kelompok', String(h.grup.halamanMulai)), {
              halamanMulai: h.grup.halamanMulai, halamanSelesai: h.grup.halamanSelesai,
              status: 'ok', bab: h.bab, provider: h.provider || '', pada: serverTimestamp(),
            });
            selesaiCount += 1;
            tambahLog(`✓ halaman ${h.grup.halamanMulai}-${h.grup.halamanSelesai}: ${h.bab.sections?.length || 0} seksi, ${h.bab.ujiPemahaman?.length || 0} soal (via ${h.provider})`);
          }
          await updateDoc(doc(db, COL_JOB, job.id), { selesai: selesaiCount, diperbaruiPada: serverTimestamp() });
        } catch (e) {
          if (e?.kode === 'kuota') {
            tambahLog(`⏸ ${e.message} — JEDA OTOMATIS. Progres aman di sistem; lanjutkan nanti dari perangkat mana pun.`, false);
            break;
          }
          tambahLog(`✗ halaman ${g.halamanMulai}-${g.halamanSelesai}: ${e?.message || e}`, false);
        }
      }
      // Pratinjau dari SELURUH kelompok tersimpan (bukan hanya sesi ini)
      const snapAll = await getDocs(collection(db, COL_JOB, job.id, 'kelompok'));
      const semua = snapAll.docs.map((d) => d.data()).sort((a, b) => a.halamanMulai - b.halamanMulai);
      const babs = semua.filter((k) => k.status === 'ok').map((k) => ({ grup: { halamanMulai: k.halamanMulai, halamanSelesai: k.halamanSelesai }, bab: k.bab, provider: k.provider }));
      const gabungan = gabungkanBabBerjudul(babs);
      const butir = [];
      gabungan.forEach((b, bi) => {
        (b.ujiPemahaman || []).forEach((item) => {
          const satu = butirBankDariUjiPemahaman(item, {
            mapel: identitas.mapel, jenjang: identitas.jenjang, kelas: identitas.kelas,
            materi: b.judul || identitas.materi, sumber: namaFile,
          }, b.halamanMulai);
          if (satu) butir.push({ ...satu, dipilih: true, babIndex: bi, asal: `hal ${b.halamanMulai}-${b.halamanSelesai}` });
        });
      });
      setPratinjau({ babs: gabungan.map((b) => ({ ...b, judulEdit: b.judul || '', disertakan: true })), butir, semuaKelompok: semua.length, selesaiKelompok: semua.filter((k) => k.status === 'ok').length });
      tambahLog(`Pratinjau: ${gabungan.length} bab otomatis, ${butir.length} soal pg siap bank. Kelompok selesai: ${semua.filter((k) => k.status === 'ok').length}/${grupDasar.length}.`);
    } catch (e) {
      tambahLog(`✗ ${e?.message || e}`, false);
    } finally {
      setSibuk(false);
      muatJobs();
    }
  };

  const simpan = async () => {
    if (sibuk || !pratinjau) return;
    setSibuk(true);
    try {
      let idBuku = bukuId;
      if (targetBuku === 'baru' || !idBuku) {
        const judulBaru = identitas.judulBuku || `${identitas.mapel} — ${identitas.materi || 'Buku impor'}`;
        const ref = await addDoc(collection(db, 'buku_digital'), {
          judul: judulBaru,
          mapel: identitas.mapel, jenjang: identitas.jenjang, kelas: identitas.kelas,
          deskripsi: `Impor buku HTML ${namaFile} (scan -> AI). Materi draf, tinjau sebelum publish.`,
          sumber: namaFile, status: 'draft', createdAt: serverTimestamp(),
        });
        idBuku = ref.id;
        // 🔒 PENJAGA IDEMPOTEN (15 Okt 2026): tombol "Simpan" yang tertekan
        // dua kali dulu melahirkan BUKU KEDUA (anti-duplikat bab hanya jalan
        // untuk target 'ada'). Begitu draf pertama dibuat, target langsung
        // dialihkan ke buku itu sehingga simpan ulang melewati
        // saringBabDuplikat + saringButirDuplikat, bukan mendobel.
        setTargetBuku('ada');
        setBukuId(idBuku);
        setDaftarBuku((d) => (d.some((x) => x.id === idBuku) ? d : [...d, { id: idBuku, judul: judulBaru }]));
        tambahLog(`✓ Buku digital draf dibuat (${idBuku.slice(0, 6)}).`);
      }
      const dipakaiIdx = pratinjau.babs.map((b, i2) => (b.disertakan === false ? -1 : i2)).filter((i2) => i2 >= 0);
      let babPayloads = dipakaiIdx.map((idx, ii) => {
        const b = pratinjau.babs[idx];
        const mentah = {
          judul: b.judulEdit || b.judul || `${identitas.materi || identitas.mapel} bagian ${ii + 1}`,
          sections: b.sections || [], ujiPemahaman: b.ujiPemahaman || [],
          urutan: ii + 1, tipe: 'teks', status: 'draft',
          halamanSumber: b.halamanMulai != null ? [b.halamanMulai, b.halamanSelesai] : null,
          sumberImpor: modeSumber === 'teks' ? 'teks-ocr' : modeSumber === 'pdf' ? 'pdf-ocr' : modeSumber === 'latex' ? 'latex-html' : 'buku-html',
          providerAi: (b.provider || []).join('/'),
          updatedAt: serverTimestamp(),
        };
        // 🔒 JARING KONTRAK READER (pembedahan 15 Okt 2026): apa pun
        // sumber babnya (teks OCR / vision AI / modul), payload dinormalkan
        // ke kontrak BukuBacaPage (block `tipe`, id seksi & soal, gambar
        // tunggal) SEBELUM masuk Firestore — materi tidak boleh tersimpan
        // dalam bentuk yang tak bisa dirender siswa.
        return { payload: normalkanBabUntukReader(mentah, mentah.judul) };
      });
      let babLewat = 0;
      if (targetBuku === 'ada' && idBuku) {
        const snapBab = await getDocs(collection(db, 'buku_digital', idBuku, 'bab'));
        const eksBab = snapBab.docs.map((d) => d.data());
        const sebelum = babPayloads.length;
        babPayloads = saringBabDuplikat(babPayloads.map((x) => x.payload), eksBab).map((payload) => ({ payload }));
        babLewat = sebelum - babPayloads.length;
        if (babLewat > 0) tambahLog(`↷ ${babLewat} bab dilewati karena sudah ada di buku ini (anti-duplikat).`);
      }
      for (let ii = 0; ii < babPayloads.length; ii += 1) {
        await setDoc(doc(collection(db, 'buku_digital', idBuku, 'bab')), babPayloads[ii].payload);
        // 🔥 FIX REGRESI (15 Okt 2026): dulu baris log membaca
        // `payload.halamanSumber[0]` langsung — di mode TEKS/PDF-OCR
        // halamanSumber bernilai null sehingga simpan crash setelah bab
        // pertama (bank soal tidak pernah masuk). Label kini lewat util
        // murni `labelBabTersimpan` yang diuji di tests/pecahBukuHtml.
        tambahLog(labelBabTersimpan(babPayloads[ii].payload));
      }
      let soalBaru = 0;
      let soalLewat = 0;
      if (ikutBank) {
        let dipilih = pratinjau.butir.filter((b) => b.dipilih && dipakaiIdx.includes(b.babIndex));
        const snapBank = await getDocs(query(collection(db, 'bank_soal'), where('sumberFile', '==', namaFile)));
        const sebelum = dipilih.length;
        dipilih = saringButirDuplikat(dipilih, snapBank.docs.map((d) => d.data()));
        soalLewat = sebelum - dipilih.length;
        if (soalLewat > 0) tambahLog(`↷ ${soalLewat} soal dilewati karena sudah ada di bank (anti-duplikat).`);
        for (let i = 0; i < dipilih.length; i += 400) {
          const batch = writeBatch(db);
          dipilih.slice(i, i + 400).forEach((b) => {
            const { dipilih: _d, asal: _a, babIndex, ...butir } = b;
            const judulBab = (pratinjau.babs[babIndex]?.judulEdit || pratinjau.babs[babIndex]?.judul || identitas.materi || `${identitas.mapel} Kelas ${identitas.kelas}`).trim();
            batch.set(doc(collection(db, 'bank_soal')), {
              ...butir, materi: judulBab, tags: ['buku', judulBab].filter(Boolean),
              createdAt: serverTimestamp(), createdBy: 'impor-buku-html',
            });
          });
          await batch.commit();
        }
        soalBaru = dipilih.length;
        if (soalBaru > 0) tambahLog(`✓ ${soalBaru} soal masuk bank_soal (kunci belum terverifikasi — QC sampel dulu).`);
        else tambahLog('↷ Tidak ada soal BARU untuk bank_soal (semua sudah ada sebelumnya atau tidak dicentang).');
      }
      // 🔥 BANNER RINGKASAN (15 Okt 2026): owner menekan Simpan dua kali dan
      // mengira gagal karena konfirmasi hanya ada di log bawah. Ringkasan
      // jujur (baru vs dilewati) kini tampil menonjol di atas halaman.
      const ringkas = pesanRingkasanSimpan({ babBaru: babPayloads.length, babLewat, soalBaru, soalLewat });
      setRingkasan(ringkas);
      tambahLog(ringkas);
      if (jobAktif && pratinjau.selesaiKelompok >= pratinjau.semuaKelompok) {
        await updateDoc(doc(db, COL_JOB, jobAktif.id), { status: 'selesai', diperbaruiPada: serverTimestamp() });
        tambahLog('✓ Pekerjaan impor ditandai SELESAI (semua kelompok terekstrak).');
      }
      tambahLog('SELESAI. Tinjau draf buku di Admin → Buku; stok soal baru terlihat di Kesiapan Stok & filter materi.');
    } catch (e) {
      tambahLog(`✗ Gagal menyimpan: ${e?.message || e}`, false);
    } finally {
      setSibuk(false);
      muatJobs();
    }
  };

  const tanyaSaranKelas = async () => {
    if (!identitas.materi && !identitas.mapel) { setSaran({ kelas: '', alasan: 'Isi mapel dulu.', kandidat: [] }); return; }
    try {
      const snap = await getDocs(query(collection(db, 'bank_soal'), where('mataPelajaran', '==', identitas.mapel)));
      setSaran(saranKelasUntukMateri({ mapel: identitas.mapel, materi: identitas.materi, sampelBank: snap.docs.map((d) => d.data()) }));
    } catch (e) {
      setSaran({ kelas: '', alasan: `Gagal membaca bank soal: ${e?.message || e}`, kandidat: [] });
    }
  };

  const muatDaftarBuku = async () => {
    if (daftarBuku.length) return;
    const snap = await getDocs(collection(db, 'buku_digital'));
    setDaftarBuku(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
  };

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '24px 16px' }}>
      <button onClick={() => navigate('/admin/buku')} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', color: '#6b7280', cursor: 'pointer', marginBottom: 14, fontSize: 13 }}>
        <ArrowLeft size={16} /> Ke Manajer Buku
      </button>
      <h1 style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 21, fontWeight: 800, color: '#1e293b', margin: '0 0 6px' }}>
        <BookUp size={22} color="#5B2ECC" /> Impor Buku HTML (scan → materi + soal)
      </h1>
      <p style={{ fontSize: 12, color: '#6b7280', margin: '0 0 16px', lineHeight: 1.6 }}>
        Unggah sekali: halaman mentah tersimpan di penyimpanan sistem, ekstraksi AI dicicil per ≤10 halaman
        dan bisa <b>dilanjutkan dari perangkat mana pun sampai 100%</b>. Bab dilebur otomatis dari judul tercetak;
        soal masuk bank per bab. Aturan berkas: SATU berkas = SATU jenjang = SATU buku.
      </p>
      {/* 🔥 15 Okt 2026: stempel bundle DITAMPIL DI HALAMAN INI juga, bukan
          hanya di sidebar. Keluhan berulang owner ("sudah kucoba lagi,
          hasilnya sama") hampir selalu = tab lama memegang bundle pra-fix
          (PWA autoUpdate baru ganti setelah reload). Dengan stempel ini
          keadaan itu terlihat dalam 2 detik tanpa mencari sidebar. */}
      <p style={{ fontSize: 11, color: '#94a3b8', margin: '-10px 0 16px' }}>
        Versi halaman ini: <b>{typeof __BUILD_STAMP__ !== 'undefined' ? __BUILD_STAMP__ : 'dev'}</b>
        {' '}— harus sama dengan commit terbaru di GitHub main. Bila berbeda, tab ini
        memegang bundle lama: muat ulang paksa (Ctrl/Cmd+Shift+R) sebelum mengimpor.
      </p>
      {ringkasan && (
        <div style={{ ...st.kartu, background: ringkasan.startsWith('✓') ? '#f0fdf4' : '#fffbeb', border: `1px solid ${ringkasan.startsWith('✓') ? '#bbf7d0' : '#fde68a'}` }}>
          <div style={{ fontSize: 13, fontWeight: 800, color: ringkasan.startsWith('✓') ? '#166534' : '#92400e' }}>{ringkasan}</div>
          <div style={{ fontSize: 11.5, color: '#6b7280', marginTop: 4 }}>
            Ringkasan ini juga tercatat di LOG PROSES di bawah. Menekan Simpan lagi tetap aman: anti-duplikat mencegah dobel.
          </div>
        </div>
      )}

      {jobs.length > 0 && (
        <div style={st.kartu}>
          <div style={st.label}>PEKERJAAN BELUM SELESAI (lanjutkan kapan pun)</div>
          {jobs.map((j) => (
            <div key={j.id} style={{ display: 'flex', gap: 8, alignItems: 'center', justifyContent: 'space-between', border: '1px solid #f1f5f9', borderRadius: 10, padding: '8px 10px', marginBottom: 6, fontSize: 12 }}>
              <span><b>{j.namaFile}</b> · {j.selesai || 0}/{j.jumlahKelompok || '?'} kelompok · {j.status}</span>
              <button style={st.kecil} onClick={() => pilihJob(j)}><RefreshCw size={12} /> Lanjutkan</button>
            </div>
          ))}
        </div>
      )}

      <div style={st.kartu}>
        <div style={st.label}>1 · BERKAS BUKU HTML</div>
        <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
          <button type="button" style={{ ...st.kecil, background: modeSumber === 'gambar' ? '#5B2ECC' : '#fff', color: modeSumber === 'gambar' ? '#fff' : '#334155' }} onClick={() => setModeSumber('gambar')}>🖼 Gambar halaman (AI vision)</button>
          <button type="button" style={{ ...st.kecil, background: modeSumber === 'teks' ? '#0e7490' : '#fff', color: modeSumber === 'teks' ? '#fff' : '#334155' }} onClick={() => setModeSumber('teks')}>📄 Teks OCR (.txt/.html — bebas kuota)</button>
          <button type="button" style={{ ...st.kecil, background: modeSumber === 'folder' ? '#b45309' : '#fff', color: modeSumber === 'folder' ? '#fff' : '#334155' }} onClick={() => setModeSumber('folder')}>📁 Folder gambar halaman</button>
          <button type="button" style={{ ...st.kecil, background: modeSumber === 'pdf' ? '#166534' : '#fff', color: modeSumber === 'pdf' ? '#fff' : '#334155' }} onClick={() => setModeSumber('pdf')}>📑 PDF berteks (hasil OCR)</button>
          <button type="button" style={{ ...st.kecil, background: modeSumber === 'latex' ? '#0f767e' : '#fff', color: modeSumber === 'latex' ? '#fff' : '#334155' }} onClick={() => setModeSumber('latex')}>🧮 HTML LaTeX (crop presisi)</button>
        </div>
        {modeSumber === 'pdf' ? (
          <input type="file" accept="application/pdf,.pdf" onChange={(e) => e.target.files?.[0] && bacaPdf(e.target.files[0])} />
        ) : modeSumber === 'folder' ? (
          <input type="file" multiple accept="image/*" onChange={(e) => bacaFolder(e.target.files)} />
        ) : (
          <input type="file" accept={modeSumber === 'teks' ? '.txt,.text,.html,.htm' : '.html,.htm'} onChange={(e) => e.target.files?.[0] && bacaBerkas(e.target.files[0])} />
        )}
        {modeSumber === 'teks' && teksBuku && (
          <div style={{ marginTop: 8, fontSize: 12, color: '#0f172a' }}>
            <b>{namaFile}</b> · {teksBuku.length.toLocaleString('id-ID')} karakter teks OCR terbaca.
          </div>
        )}
        {inv && (
          <div style={{ marginTop: 10, fontSize: 12, color: '#374151', lineHeight: 1.7 }}>
            <div><b>{namaFile}</b> · {(inv.ukuranByte / 1024 / 1024).toFixed(1)} MB · {inv.jumlahGambarHalaman} halaman gambar · teks layer: {inv.adaTeksLayer ? 'ada' : 'tidak (murni scan)'}</div>
            <div style={{ color: '#92400e' }}>ℹ️ {inv.saran} Ekstraksi dicicil ±{perkiraanPanggilanAi(inv.jumlahGambarHalaman)} panggilan AI; halaman mentah tersimpan di sistem sampai terekstrak semua.</div>
          </div>
        )}
      </div>

      <div style={st.kartu}>
        <div style={st.label}>2 · IDENTITAS BUKU (jenjang & kelas wajib supaya soal tidak nyasar)</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <label style={st.label}>Mata pelajaran
            <input style={st.input} value={identitas.mapel} onChange={(e) => setIdentitas({ ...identitas, mapel: e.target.value })} />
          </label>
          <label style={st.label}>Jenjang
            <select style={st.input} value={identitas.jenjang} onChange={(e) => setIdentitas({ ...identitas, jenjang: e.target.value })}>
              {JENJANG.map((j) => <option key={j}>{j}</option>)}
            </select>
          </label>
          <label style={st.label}>Kelas
            <input style={st.input} value={identitas.kelas} onChange={(e) => setIdentitas({ ...identitas, kelas: e.target.value })} />
          </label>
          <div style={{ display: 'flex', alignItems: 'flex-end' }}>
            <button type="button" style={{ ...st.tombol(false), padding: '8px 12px', fontSize: 11.5, background: '#0e7490' }} onClick={tanyaSaranKelas}>❓ Saran kelas dari sistem</button>
          </div>
          <label style={st.label}>Materi / cakupan — OPSIONAL untuk buku lengkap
            <input style={st.input} placeholder="kosongkan bila buku berisi semua bab (nama bab dibaca otomatis)" value={identitas.materi} onChange={(e) => setIdentitas({ ...identitas, materi: e.target.value })} />
          </label>
          <label style={st.label}>Judul buku (sumber)
            <input style={st.input} placeholder="mis. Buku Gemilang Vol.1" value={identitas.judulBuku} onChange={(e) => setIdentitas({ ...identitas, judulBuku: e.target.value })} />
          </label>
          <label style={st.label}>Simpan materi ke
            <select style={st.input} value={targetBuku} onChange={(e) => { setTargetBuku(e.target.value); if (e.target.value === 'ada') muatDaftarBuku(); }}>
              <option value="baru">Buku digital baru (draf)</option>
              <option value="ada">Bab buku yang sudah ada</option>
            </select>
          </label>
          {targetBuku === 'ada' && (
            <label style={st.label}>Pilih buku
              <select style={st.input} value={bukuId} onChange={(e) => setBukuId(e.target.value)}>
                <option value="">— pilih —</option>
                {daftarBuku.map((b) => <option key={b.id} value={b.id}>{b.judul}</option>)}
              </select>
            </label>
          )}
        </div>
        {saran && (
          <div style={{ marginTop: 10, fontSize: 11.5, color: saran.kelas ? '#166534' : '#92400e', background: saran.kelas ? '#f0fdf4' : '#fffbeb', border: `1px solid ${saran.kelas ? '#bbf7d0' : '#fde68a'}`, borderRadius: 8, padding: '7px 10px' }}>
            {saran.kelas ? `Saran sistem: kelas ${saran.kelas} — ${saran.alasan}` : saran.alasan}
            {saran.kelas ? <button type="button" style={{ ...st.kecil, marginLeft: 8 }} onClick={() => setIdentitas({ ...identitas, kelas: saran.kelas })}>pakai</button> : null}
          </div>
        )}
        <label style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 12.5, color: '#374151', marginTop: 12 }}>
          <input type="checkbox" checked={ikutBank} onChange={(e) => setIkutBank(e.target.checked)} />
          soal pemantapan hasil ekstraksi ikut masuk bank_soal (dapat dipanggil per bab untuk try out / kuis / cetak)
        </label>
        <div style={{ display: 'flex', gap: 10, marginTop: 14, flexWrap: 'wrap' }}>
          {modeSumber === 'latex' && latexHasil && (
            <button style={st.tombol(sibuk)} disabled={sibuk} onClick={bangunPratinjauLatex}>
              <BookUp size={15} /> Pratinjau HTML LaTeX (unggah gambar, tanpa AI)
            </button>
          )}
          {aksiModeImpor(modeSumber).perluPratinjauTeks && (
            <button style={st.tombol(sibuk || !teksBuku)} disabled={sibuk || !teksBuku} onClick={bangunPratinjauTeks}>
              <BookUp size={15} /> Pratinjau hasil teks (tanpa AI)
            </button>
          )}
          {aksiModeImpor(modeSumber).perluEkstrakVision && (
          <button style={st.tombol(sibuk || gambar.length === 0)} disabled={sibuk || gambar.length === 0} onClick={prosesAi}>
            {sibuk ? <Loader2 size={15} className="animate-spin" /> : <BookUp size={15} />} {sibuk ? 'Memproses…' : jobAktif ? 'Lanjutkan ekstraksi sampai selesai' : 'Ekstrak materi & soal (unggah mentah dulu)'}
          </button>
          )}
          {sibuk && aksiModeImpor(modeSumber).perluEkstrakVision && <button style={{ ...st.tombol(false), background: '#b45309' }} onClick={() => { jedaRef.current = true; }}>⏸ Jeda (progres di sistem)</button>}
          {pratinjau && (
            <button style={st.tombol(sibuk)} disabled={sibuk} onClick={simpan}>
              <CheckCircle2 size={15} /> Simpan draf buku{ikutBank ? ' + bank soal' : ''}
            </button>
          )}
        </div>
      </div>

      {pratinjau && (
        <div style={st.kartu}>
          <div style={st.label}>3 · PRATINJAU BAB OTOMATIS ({pratinjau.selesaiKelompok}/{pratinjau.semuaKelompok} kelompok terekstrak)</div>
          {pratinjau.babs.map((b, i) => (
            <div key={i} style={{ border: '1px solid #f1f5f9', borderRadius: 10, padding: '8px 10px', marginBottom: 8, fontSize: 12 }}>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                <label style={{ display: 'inline-flex', gap: 5, alignItems: 'center', fontSize: 11, color: '#475569', whiteSpace: 'nowrap' }}>
                  <input type="checkbox" checked={b.disertakan !== false} onChange={(e) => setPratinjau((prev) => ({ ...prev, babs: prev.babs.map((x, xi) => (xi === i ? { ...x, disertakan: e.target.checked } : x)) }))} />
                  ikut
                </label>
                <b style={{ whiteSpace: 'nowrap' }}>Bab {i + 1} · hal {b.halamanMulai}-{b.halamanSelesai}:</b>
                <input
                  value={b.judulEdit}
                  onChange={(e) => setPratinjau((prev) => ({ ...prev, babs: prev.babs.map((x, xi) => (xi === i ? { ...x, judulEdit: e.target.value } : x)) }))}
                  placeholder="nama bab (otomatis terbaca; koreksi bila perlu)"
                  style={{ flex: 1, minWidth: 220, padding: '5px 8px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 12 }}
                />
                <span style={{ color: '#6b7280', fontSize: 11 }}>{b.sections?.length || 0} seksi · {b.ujiPemahaman?.length || 0} soal · via {(b.provider || []).join('/') || '-'}</span>
              </div>
            </div>
          ))}
          <div style={{ fontSize: 11, color: '#6b7280' }}>Nama bab terbaca OTOMATIS dari tulisan tercetak di scan; kolom hanya untuk KOREKSI. Bab kunci-jawaban/sampah: hilangkan centang "ikut".</div>
          {pratinjau.butir.length > 0 && (
            <details style={{ fontSize: 12, color: '#374151', marginTop: 8 }}>
              <summary style={{ cursor: 'pointer', fontWeight: 700 }}>Tinjau {pratinjau.butir.length} soal yang akan masuk bank</summary>
              {pratinjau.butir.map((b, i) => (
                <label key={i} style={{ display: 'flex', gap: 8, alignItems: 'flex-start', padding: '5px 0', borderTop: '1px solid #f8fafc' }}>
                  <input type="checkbox" checked={b.dipilih} onChange={(e) => setPratinjau((prev) => ({ ...prev, butir: prev.butir.map((x, xi) => (xi === i ? { ...x, dipilih: e.target.checked } : x)) }))} />
                  <span><b>[{b.asal}]</b> {b.soal.slice(0, 140)} <i style={{ color: '#6b7280' }}>· kunci {b.kunciJawaban} · {b.materi}</i></span>
                </label>
              ))}
            </details>
          )}
        </div>
      )}

      {log.length > 0 && (
        <div style={st.kartu}>
          <div style={st.label}>LOG PROSES</div>
          {log.map((l, i) => <div key={i} style={st.log(l.ok)}>{l.teks}</div>)}
          {log.some((l) => !l.ok) && (
            <div style={{ fontSize: 11.5, color: '#92400e', marginTop: 6 }}><AlertTriangle size={12} style={{ verticalAlign: -2 }} /> Kelompok gagal tidak menghalangi: tekan "Lanjutkan ekstraksi" lagi nanti — yang sukses dilewati, yang gagal dicoba ulang.</div>
          )}
        </div>
      )}
    </div>
  );
}
