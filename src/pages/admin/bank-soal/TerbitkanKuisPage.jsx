// src/pages/admin/bank-soal/TerbitkanKuisPage.jsx
// ============================================================
// TERBITKAN KUIS DARI BANK SOAL (Admin)
// ============================================================
// Jembatan dari "gudang" (bank_soal, hasil pipeline import di
// ImportHasilScanPage.jsx) ke siswa beneran. TIDAK bikin koleksi baru
// atau alur baru -- soal dikonversi ke bentuk quizData lalu disimpan
// sebagai dokumen bimbel_modul (type: 'kuis_mandiri'), PERSIS skema
// yang sudah dipakai & terbukti jalan di ManageQuiz.jsx dan dibaca
// StudentQuizView.jsx.
//
// 🔥 BERUBAH (v2 -- mode KERANJANG): dulu cuma 1 cara pilih soal (cari
// pakai filter datar). Sekarang ada 2 tab yang mengisi KERANJANG YANG
// SAMA:
//   1. "Jelajah per Folder" -- browse Folder Sumber (buku/PDF) ->
//      bab/materi di dalamnya -> soal. Bisa campur soal dari BEBERAPA
//      folder sekaligus ke 1 keranjang (mis. gabung folder TKA Bahasa
//      Indonesia + folder SNBT Matematika jadi 1 kuis campuran).
//   2. "Cari Bebas" -- filter datar seperti sebelumnya (mapel/jenis
//      ujian/kesulitan/materi/tag), untuk kasus admin sudah tahu
//      persis mau cari apa tanpa perlu buka folder.
// Keranjang bertahan lintas-tab dan lintas-folder -- browsing folder
// lain TIDAK menghapus soal yang sudah masuk keranjang dari folder
// sebelumnya.
//
// KEPUTUSAN PENTING (dikonfirmasi ke admin sebelum dibangun):
// - Ini murni fitur ADMIN, TIDAK terikat guru/kodeMapel. subject
//   sengaja diisi 'Umum' -- jalur bypass eksplisit di hasSubjectAccess()
//   (StudentDashboard.jsx & StudentModuleView.jsx). Targeting asli
//   pakai targetKelas (cocok persis ke kelasSekolah siswa).
// - notifyStudents() wajib kodeMapel ATAU specificStudentIds -- kita
//   pakai specificStudentIds (hitung manual dari targetKelas/targetKategori)
//   karena kuis ini sengaja lintas-mapel.
// ============================================================

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../../../firebase';
import {
  collection, getDocs, addDoc, query, where, serverTimestamp,
} from 'firebase/firestore';
import { notifyStudents } from '../../../utils/notifications';
import {
  Rocket, Filter, CheckSquare, Square, Loader2, Send, ArrowLeft,
  AlertTriangle, CheckCircle2, BookOpen, Folder, FolderOpen, ChevronDown,
  ChevronRight, ShoppingCart, Trash2, Sparkles, Timer, Shuffle, ShieldAlert,
} from 'lucide-react';

function hurufKeIndex(huruf) {
  if (!huruf) return -1;
  const h = String(huruf).trim().toUpperCase();
  if (h.length !== 1) return -1;
  const idx = h.charCodeAt(0) - 65;
  return idx >= 0 && idx <= 25 ? idx : -1;
}

function konversiSoalKeQuiz(soal) {
  const tipeAsal = soal.tipe || 'pg_sederhana';

  let tipeKuis = 'multiple';
  if (tipeAsal === 'pg_kompleks') tipeKuis = 'multiselect';
  else if (tipeAsal === 'benar_salah' || tipeAsal === 'pg_kategori') tipeKuis = 'truefalse';
  else if (tipeAsal === 'menjodohkan') tipeKuis = 'matching';
  else if (tipeAsal === 'isian_singkat' || tipeAsal === 'numerik' || tipeAsal === 'uraian') tipeKuis = 'shortanswer';

  const opsiTeks = (soal.opsiJawaban || []).map((o) => (typeof o === 'string' ? o : (o?.teks || '')));
  const kunciMentah = soal.kunciJawaban;
  const daftarKunci = Array.isArray(kunciMentah) ? kunciMentah : [kunciMentah];
  const indexKunci = daftarKunci.map(hurufKeIndex).filter((i) => i >= 0);

  const statements = (tipeKuis === 'truefalse')
    ? (soal.tabelBenarSalah?.length ? soal.tabelBenarSalah : (soal.pernyataan || [])).map((p) => {
        if (typeof p === 'string') return { text: p, correct: false };
        const teks = p.pernyataan || p.teks || '';
        const jawabanMentah = String(p.jawaban || '').trim().toLowerCase();
        return { text: teks, correct: jawabanMentah === 'benar' || jawabanMentah === 'true' };
      })
    : [];

  const matchingPairs = (tipeKuis === 'matching')
    ? (soal.pasangan || []).map((p) => ({ kiri: p.kiri || '', kanan: p.kanan || '' }))
    : [];

  return {
    id: soal.id || `bs_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    type: tipeKuis,
    question: soal.soal || soal.teks_soal || '',
    questionImage: (soal.gambarUrls && soal.gambarUrls[0]) || '',
    options: (tipeKuis === 'multiple' || tipeKuis === 'multiselect') ? (opsiTeks.length ? opsiTeks : ['', '', '', '']) : ['', '', '', ''],
    optionImages: ['', '', '', ''],
    correctAnswer: tipeKuis === 'multiselect' ? null : (indexKunci[0] ?? 0),
    correctAnswers: tipeKuis === 'multiselect' ? indexKunci : [],
    explanation: soal.pembahasan || '',
    statements,
    readingText: '',
    subQuestions: [],
    shortAnswer: tipeKuis === 'shortanswer' ? String(daftarKunci[0] || '') : '',
    cause: '', effect: '', isCauseTrue: true, isEffectTrue: true,
    matchingPairs,
    needsImage: false, imageHint: '', imageSource: null,
    researchBacked: false, researchSources: [],
    visualRequired: false, visualKind: 'none',
    difficulty: soal.tingkatKesulitan || '',
    competency: soal.materi || '',
    _sumberBankSoalId: soal.id || null,
  };
}

function konversiBanyakSoalKeQuiz(daftarSoal) {
  const hasil = [];
  const peringatan = [];
  daftarSoal.forEach((soal, i) => {
    const quizItem = konversiSoalKeQuiz(soal);
    if (!quizItem.question.trim()) peringatan.push(`Soal ke-${i + 1} (id: ${soal.id || '?'}): teks soal kosong.`);
    if ((quizItem.type === 'multiple' || quizItem.type === 'multiselect') && quizItem.options.every((o) => !o)) {
      peringatan.push(`Soal ke-${i + 1} (id: ${soal.id || '?'}): opsi jawaban kosong semua.`);
    }
    hasil.push(quizItem);
  });
  return { quizData: hasil, peringatan };
}

// 🔥 BARU: Bucket Otomatis -- admin tinggal COPAS daftar bab/materi dari
// kisi-kisi resmi (mis. dari dokumen TKA), 1 topik per baris. Kisi-kisi
// asli sering ditempel dengan anotasi frekuensi nempel tanpa spasi,
// contoh: "Bilangan bulat, pecahan, desimal, dan persenSering muncul"
// -- fungsi ini memisahkan topik dari anotasi itu SEBELUM dipakai buat
// mencari soal (biar tidak ikut ke pencarian materi, yang bikin
// pencarian gagal cocok).
function bersihkanBarisMateri(baris) {
  const dipisah = baris.replace(/([a-z0-9)])(Sering|Jarang|Prediksi)/g, '$1|$2');
  return dipisah.split('|')[0].trim();
}

function parseTeksKisiKisi(teks) {
  return teks
    .split('\n')
    .map((baris) => bersihkanBarisMateri(baris))
    .filter(Boolean);
}

export default function TerbitkanKuisPage() {
  const navigate = useNavigate();

  const [tab, setTab] = useState('folder'); // 'folder' | 'cari' | 'bucket'

  // 🔥 KERANJANG -- Map(soalId -> soalObject). Ini SATU-SATUNYA sumber
  // kebenaran soal yang mau diterbitkan, diisi dari tab MANA PUN
  // (folder atau cari bebas), bertahan lintas navigasi folder/tab.
  const [keranjang, setKeranjang] = useState(new Map());

  const toggleKeranjang = useCallback((soal) => {
    setKeranjang((prev) => {
      const next = new Map(prev);
      if (next.has(soal.id)) next.delete(soal.id); else next.set(soal.id, soal);
      return next;
    });
  }, []);

  const tambahBanyakKeKeranjang = useCallback((daftarSoal) => {
    setKeranjang((prev) => {
      const next = new Map(prev);
      daftarSoal.forEach((s) => next.set(s.id, s));
      return next;
    });
  }, []);

  const kosongkanKeranjang = () => setKeranjang(new Map());

  // ---------------- TAB: JELAJAH PER FOLDER ----------------
  const [daftarFolder, setDaftarFolder] = useState([]);
  const [loadingFolder, setLoadingFolder] = useState(true);
  const [folderDibuka, setFolderDibuka] = useState(null);
  const [cacheSoalFolder, setCacheSoalFolder] = useState({});
  const [loadingSoalFolder, setLoadingSoalFolder] = useState(false);
  const [babDibuka, setBabDibuka] = useState(null);

  useEffect(() => {
    (async () => {
      setLoadingFolder(true);
      try {
        const snap = await getDocs(collection(db, 'sumber_soal'));
        setDaftarFolder(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      } catch (e) {
        console.error('Gagal ambil daftar folder:', e);
      }
      setLoadingFolder(false);
    })();
  }, []);

  const bukaFolder = useCallback(async (folderId) => {
    if (folderDibuka === folderId) { setFolderDibuka(null); return; }
    setFolderDibuka(folderId);
    setBabDibuka(null);
    if (cacheSoalFolder[folderId]) return;
    setLoadingSoalFolder(true);
    try {
      const q = query(collection(db, 'bank_soal'), where('sumberSoalId', '==', folderId), where('status', '==', 'aktif'));
      const snap = await getDocs(q);
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      list.sort((a, b) => (Number(a.nomor) || 0) - (Number(b.nomor) || 0));
      setCacheSoalFolder((prev) => ({ ...prev, [folderId]: list }));
    } catch (e) {
      console.error('Gagal ambil soal folder:', e);
      alert('Gagal mengambil soal folder: ' + e.message);
    }
    setLoadingSoalFolder(false);
  }, [folderDibuka, cacheSoalFolder]);

  const babDalamFolder = useMemo(() => {
    if (!folderDibuka || !cacheSoalFolder[folderDibuka]) return [];
    const map = new Map();
    cacheSoalFolder[folderDibuka].forEach((s) => {
      const bab = s.materi || '(Tanpa bab/materi)';
      if (!map.has(bab)) map.set(bab, []);
      map.get(bab).push(s);
    });
    return Array.from(map.entries()).map(([bab, soal]) => ({ bab, soal }));
  }, [folderDibuka, cacheSoalFolder]);

  // ---------------- TAB: CARI BEBAS ----------------
  const [filterMapel, setFilterMapel] = useState('');
  const [filterJenisUjian, setFilterJenisUjian] = useState('');
  const [filterKelas, setFilterKelas] = useState('');
  const [filterKesulitan, setFilterKesulitan] = useState('');
  const [filterMateri, setFilterMateri] = useState('');
  const [filterTag, setFilterTag] = useState('');

  const [loadingSoal, setLoadingSoal] = useState(false);
  const [daftarSoal, setDaftarSoal] = useState([]);
  const [sudahCari, setSudahCari] = useState(false);

  const cariSoal = useCallback(async () => {
    setLoadingSoal(true);
    setSudahCari(true);
    try {
      const constraints = [where('status', '==', 'aktif')];
      if (filterMapel.trim()) constraints.push(where('mataPelajaran', '==', filterMapel.trim()));
      if (filterJenisUjian.trim()) constraints.push(where('jenisUjian', '==', filterJenisUjian.trim()));
      const q = query(collection(db, 'bank_soal'), ...constraints);
      const snap = await getDocs(q);
      let list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));

      if (filterKelas.trim()) list = list.filter((s) => String(s.tingkatKelas || '') === filterKelas.trim());
      if (filterKesulitan.trim()) list = list.filter((s) => String(s.tingkatKesulitan || '') === filterKesulitan.trim());
      if (filterMateri.trim()) {
        const kw = filterMateri.trim().toLowerCase();
        list = list.filter((s) => String(s.materi || '').toLowerCase().includes(kw));
      }
      if (filterTag.trim()) {
        const kw = filterTag.trim().toLowerCase();
        list = list.filter((s) => (s.tags || []).some((t) => String(t).toLowerCase().includes(kw)));
      }

      list.sort((a, b) => (Number(a.nomor) || 0) - (Number(b.nomor) || 0));
      setDaftarSoal(list);
    } catch (e) {
      console.error('Gagal mencari soal:', e);
      alert('Gagal mengambil soal dari Bank Soal: ' + e.message);
    }
    setLoadingSoal(false);
  }, [filterMapel, filterJenisUjian, filterKelas, filterKesulitan, filterMateri, filterTag]);

  // ---------------- TAB: BUCKET OTOMATIS ----------------
  // Admin cukup: pilih kelas, TEMPEL daftar bab/materi dari kisi-kisi
  // resmi (1 topik per baris), isi target jumlah soal -> sistem cari
  // LINTAS SEMUA FOLDER otomatis dan isi keranjang, distribusi merata
  // per topik supaya tidak numpuk di 1 topik saja.
  const [bucketKelas, setBucketKelas] = useState('');
  const [bucketMateriTeks, setBucketMateriTeks] = useState('');
  const [bucketJumlah, setBucketJumlah] = useState(30);
  const [loadingBucket, setLoadingBucket] = useState(false);
  const [hasilBucket, setHasilBucket] = useState(null); // [{topik, ditemukan, diambil}]

  const cariBucketOtomatis = useCallback(async () => {
    const daftarTopik = parseTeksKisiKisi(bucketMateriTeks);
    if (daftarTopik.length === 0) return alert('Tempel dulu daftar bab/materi (1 topik per baris).');
    const target = Number(bucketJumlah) || 30;

    setLoadingBucket(true);
    setHasilBucket(null);
    try {
      const constraints = [where('status', '==', 'aktif')];
      if (bucketKelas.trim()) constraints.push(where('tingkatKelas', '==', bucketKelas.trim()));
      const snap = await getDocs(query(collection(db, 'bank_soal'), ...constraints));
      const semuaSoal = snap.docs.map((d) => ({ id: d.id, ...d.data() }));

      // Kelompokkan soal yang cocok per topik (1 soal bisa cocok >1 topik
      // kalau materinya memuat >1 kata kunci -- itu tidak masalah, nanti
      // dedup pas dimasukkan ke keranjang lewat Map).
      const perTopik = daftarTopik.map((topik) => {
        const kw = topik.toLowerCase();
        const cocok = semuaSoal.filter((s) => String(s.materi || '').toLowerCase().includes(kw));
        return { topik, soal: cocok };
      });

      // Distribusi merata: ambil bergiliran 1 soal dari tiap topik yang
      // masih py sisa, sampai target tercapai atau semua topik habis.
      const terpilih = new Map();
      let masihAda = true;
      const indexPerTopik = perTopik.map(() => 0);
      while (masihAda && terpilih.size < target) {
        masihAda = false;
        for (let i = 0; i < perTopik.length; i++) {
          if (terpilih.size >= target) break;
          const { soal } = perTopik[i];
          if (indexPerTopik[i] < soal.length) {
            const s = soal[indexPerTopik[i]];
            if (!terpilih.has(s.id)) terpilih.set(s.id, s);
            indexPerTopik[i]++;
            masihAda = true;
          }
        }
      }

      tambahBanyakKeKeranjang(Array.from(terpilih.values()));
      setHasilBucket(perTopik.map((p) => ({ topik: p.topik, ditemukan: p.soal.length })));
    } catch (e) {
      console.error('Gagal cari bucket otomatis:', e);
      alert('Gagal mengambil soal: ' + e.message);
    }
    setLoadingBucket(false);
  }, [bucketKelas, bucketMateriTeks, bucketJumlah, tambahBanyakKeKeranjang]);

  // ---------------- FORM TERBITKAN ----------------
  const [judulKuis, setJudulKuis] = useState('');
  const [targetKelas, setTargetKelas] = useState('Semua');
  const [targetKategori, setTargetKategori] = useState('Semua');
  const [availableClasses, setAvailableClasses] = useState(['Semua']);
  const [pakaiDeadline, setPakaiDeadline] = useState(false);
  const [deadlineTanggal, setDeadlineTanggal] = useState('');

  // 🔥 BARU: Mode Ujian -- Timer, Soal Acak, dan Anti-Cheat SUDAH ADA
  // dan JALAN di StudentQuizView.jsx (field timeLimit, randomOrder,
  // antiCheatEnabled) -- sebelumnya cuma belum ada tombolnya di sini.
  // Tinggal disambungkan, tidak perlu bikin logika baru di sisi siswa.
  const [pakaiTimer, setPakaiTimer] = useState(false);
  const [durasiMenit, setDurasiMenit] = useState(60);
  const [soalAcak, setSoalAcak] = useState(false);
  const [antiCheat, setAntiCheat] = useState(false);

  const [menerbitkan, setMenerbitkan] = useState(false);
  const [hasil, setHasil] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const snap = await getDocs(collection(db, 'students'));
        const kelasList = [...new Set(snap.docs.map((d) => d.data().kelasSekolah).filter(Boolean))];
        kelasList.sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
        setAvailableClasses(['Semua', ...kelasList]);
      } catch (e) {
        console.error('Gagal ambil daftar kelas:', e);
      }
    })();
  }, []);

  const handleTerbitkan = async () => {
    if (!judulKuis.trim()) return alert('Judul kuis wajib diisi.');
    if (keranjang.size === 0) return alert('Keranjang masih kosong -- pilih minimal 1 soal dulu.');
    if (pakaiDeadline && !deadlineTanggal) return alert('Isi tanggal deadline, atau matikan opsi deadline.');

    const soalDipilih = Array.from(keranjang.values());
    const { quizData, peringatan } = konversiBanyakSoalKeQuiz(soalDipilih);

    if (peringatan.length > 0) {
      const lanjut = window.confirm(
        `⚠️ Ada ${peringatan.length} soal dengan kemungkinan masalah:\n\n${peringatan.slice(0, 5).join('\n')}` +
        (peringatan.length > 5 ? `\n...dan ${peringatan.length - 5} lainnya.` : '') +
        `\n\nTetap terbitkan?`,
      );
      if (!lanjut) return;
    }

    setMenerbitkan(true);
    setHasil(null);
    try {
      const payload = {
        title: judulKuis.toUpperCase(),
        subject: 'Umum',
        kodeMapel: '',
        type: 'kuis_mandiri',
        status: 'aktif',
        targetKelas,
        targetKategori,
        quizData,
        totalQuestions: quizData.length,
        useSchedule: pakaiDeadline,
        quizOpenDate: null,
        quizCloseDate: pakaiDeadline ? deadlineTanggal : null,
        // 🔥 BARU: Mode Ujian -- field ini SUDAH dibaca StudentQuizView.jsx
        // (timer countdown, shuffle soal, deteksi pindah tab/keluar
        // fullscreen). timeLimit dalam MENIT, 0 = tanpa batas waktu.
        timeLimit: pakaiTimer ? (Number(durasiMenit) || 0) : 0,
        randomOrder: soalAcak,
        antiCheatEnabled: antiCheat,
        guruId: 'admin',
        guruName: 'Admin Bimbel Gemilang',
        authorName: 'Admin Bimbel Gemilang',
        sumberBankSoal: true,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      await addDoc(collection(db, 'bimbel_modul'), payload);

      const snapSiswa = await getDocs(collection(db, 'students'));
      const penerimaIds = snapSiswa.docs
        .map((d) => ({ id: d.id, ...d.data() }))
        .filter((s) => {
          const cocokKelas = targetKelas === 'Semua' || s.kelasSekolah === targetKelas;
          const cocokKategori = targetKategori === 'Semua' || s.kategori === targetKategori;
          return cocokKelas && cocokKategori && !s.isBlocked;
        })
        .map((s) => s.studentId || s.id);

      if (penerimaIds.length > 0) {
        await notifyStudents({
          specificStudentIds: penerimaIds,
          type: 'kuis',
          title: '🚀 Tryout/Kuis Baru!',
          message: `"${judulKuis}" (${quizData.length} soal) sudah bisa dikerjakan${pakaiDeadline ? ` — batas waktu ${new Date(deadlineTanggal).toLocaleString('id-ID')}` : ''}.`,
          link: '/siswa/materi',
        });
      }

      setHasil({
        success: true,
        message: `Kuis "${judulKuis}" berhasil diterbitkan (${quizData.length} soal) ke ${penerimaIds.length} siswa.`,
      });
      setJudulKuis('');
      kosongkanKeranjang();
    } catch (e) {
      console.error('Gagal menerbitkan kuis:', e);
      setHasil({ success: false, message: 'Gagal menerbitkan: ' + e.message });
    }
    setMenerbitkan(false);
  };

  const ringkasanKeranjang = useMemo(() => {
    const map = new Map();
    Array.from(keranjang.values()).forEach((s) => {
      const label = s.mataPelajaran ? `${s.mataPelajaran}${s.jenisUjian ? ` (${s.jenisUjian})` : ''}` : 'Tanpa label';
      map.set(label, (map.get(label) || 0) + 1);
    });
    return Array.from(map.entries());
  }, [keranjang]);

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '24px 16px', fontFamily: 'sans-serif', paddingBottom: keranjang.size > 0 ? 320 : 24 }}>
      <button onClick={() => navigate('/admin/bank-soal')} style={backBtn}>
        <ArrowLeft size={16} /> Kembali ke Bank Soal
      </button>

      <h1 style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 22, fontWeight: 800, color: '#1e293b', marginBottom: 4 }}>
        <Rocket size={24} color="#06b6d4" /> Terbitkan Kuis dari Bank Soal
      </h1>
      <p style={{ color: '#6b7280', fontSize: 13, marginBottom: 20 }}>
        Kumpulkan soal ke keranjang (bisa campur dari beberapa folder/pencarian), lalu terbitkan sekaligus jadi 1 kuis.
      </p>

      <div style={{ display: 'flex', gap: 8, marginBottom: 16, borderBottom: '1px solid #e5e7eb' }}>
        <button onClick={() => setTab('folder')} style={tab === 'folder' ? tabAktif : tabPasif}>
          <Folder size={14} style={{ marginRight: 6 }} /> Jelajah per Folder
        </button>
        <button onClick={() => setTab('cari')} style={tab === 'cari' ? tabAktif : tabPasif}>
          <Filter size={14} style={{ marginRight: 6 }} /> Cari Bebas
        </button>
        <button onClick={() => setTab('bucket')} style={tab === 'bucket' ? tabAktif : tabPasif}>
          <Sparkles size={14} style={{ marginRight: 6 }} /> Bucket Otomatis
        </button>
      </div>

      {tab === 'folder' && (
        <div>
          {loadingFolder ? (
            <Loader2 size={18} className="spin" />
          ) : daftarFolder.length === 0 ? (
            <div style={{ padding: 20, textAlign: 'center', color: '#9ca3af', fontSize: 13, border: '1px dashed #d1d5db', borderRadius: 10 }}>
              Belum ada Folder Sumber. Buat dulu lewat halaman "Import Hasil Scan AI" (panel 📁 Folder Sumber).
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {daftarFolder.map((f) => (
                <div key={f.id} style={{ border: '1px solid #e5e7eb', borderRadius: 10, overflow: 'hidden' }}>
                  <div
                    onClick={() => bukaFolder(f.id)}
                    style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px', cursor: 'pointer', backgroundColor: folderDibuka === f.id ? '#ecfeff' : 'white' }}
                  >
                    {folderDibuka === f.id ? <FolderOpen size={18} color="#06b6d4" /> : <Folder size={18} color="#9ca3af" />}
                    {f.coverUrl && <img src={f.coverUrl} alt="" style={{ width: 28, height: 36, objectFit: 'cover', borderRadius: 3 }} />}
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: '#1e293b' }}>{f.judul}</div>
                      <div style={{ fontSize: 11, color: '#9ca3af' }}>{f.mataPelajaran} · {f.jenisUjian} · {f.jenjang} · {f.jumlahSoal || 0} soal</div>
                    </div>
                    {folderDibuka === f.id ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                  </div>

                  {folderDibuka === f.id && (
                    <div style={{ padding: '10px 14px 14px 40px', borderTop: '1px solid #f1f5f9' }}>
                      {loadingSoalFolder && !cacheSoalFolder[f.id] ? (
                        <Loader2 size={16} className="spin" />
                      ) : babDalamFolder.length === 0 ? (
                        <div style={{ fontSize: 12, color: '#9ca3af' }}>Belum ada soal di folder ini.</div>
                      ) : (
                        babDalamFolder.map(({ bab, soal }) => (
                          <div key={bab} style={{ marginBottom: 6 }}>
                            <div
                              onClick={() => setBabDibuka(babDibuka === bab ? null : bab)}
                              style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', borderRadius: 8, cursor: 'pointer', backgroundColor: '#f9fafb' }}
                            >
                              {babDibuka === bab ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                              <span style={{ fontSize: 13, fontWeight: 600, color: '#374151', flex: 1 }}>{bab}</span>
                              <span style={{ fontSize: 11, color: '#9ca3af' }}>{soal.length} soal</span>
                              <button
                                onClick={(e) => { e.stopPropagation(); tambahBanyakKeKeranjang(soal); }}
                                style={{ fontSize: 11, padding: '4px 10px', borderRadius: 6, border: '1px solid #06b6d4', backgroundColor: 'white', color: '#0e7490', fontWeight: 700, cursor: 'pointer' }}
                              >
                                + Tambah Semua
                              </button>
                            </div>
                            {babDibuka === bab && (
                              <div style={{ marginLeft: 20, marginTop: 4 }}>
                                {soal.map((s) => (
                                  <div
                                    key={s.id}
                                    onClick={() => toggleKeranjang(s)}
                                    style={{ display: 'flex', gap: 8, alignItems: 'flex-start', padding: '6px 8px', cursor: 'pointer', borderRadius: 6, backgroundColor: keranjang.has(s.id) ? '#ecfeff' : 'transparent' }}
                                  >
                                    {keranjang.has(s.id) ? <CheckSquare size={15} color="#06b6d4" style={{ flexShrink: 0, marginTop: 2 }} /> : <Square size={15} color="#cbd5e1" style={{ flexShrink: 0, marginTop: 2 }} />}
                                    <span style={{ fontSize: 12, color: '#374151' }}>#{s.nomor} — {(s.soal || s.teks_soal || '').slice(0, 80)}</span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === 'cari' && (
        <div>
          <div style={{ background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 12, padding: 16, marginBottom: 20 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 10 }}>
              <input placeholder="Mapel (mis. Matematika)" value={filterMapel} onChange={(e) => setFilterMapel(e.target.value)} style={inputStyle} />
              <select value={filterJenisUjian} onChange={(e) => setFilterJenisUjian(e.target.value)} style={inputStyle}>
                <option value="">Semua jenis ujian</option>
                <option value="TKA">TKA</option>
                <option value="SNBT/UTBK">SNBT/UTBK</option>
                <option value="Reguler">Reguler</option>
                <option value="Lainnya">Lainnya</option>
              </select>
              <input placeholder="Tingkat kelas (mis. 10)" value={filterKelas} onChange={(e) => setFilterKelas(e.target.value)} style={inputStyle} />
              <select value={filterKesulitan} onChange={(e) => setFilterKesulitan(e.target.value)} style={inputStyle}>
                <option value="">Semua kesulitan</option>
                <option value="mudah">Mudah</option>
                <option value="sedang">Sedang</option>
                <option value="sulit">Sulit</option>
              </select>
              <input placeholder="Cari materi (mis. Logaritma)" value={filterMateri} onChange={(e) => setFilterMateri(e.target.value)} style={inputStyle} />
              <input placeholder="Cari tag (mis. hots, utbk)" value={filterTag} onChange={(e) => setFilterTag(e.target.value)} style={inputStyle} />
            </div>
            <button onClick={cariSoal} disabled={loadingSoal} style={{ ...btnPrimary, marginTop: 12 }}>
              {loadingSoal ? <Loader2 size={15} className="spin" /> : <BookOpen size={15} />}
              {loadingSoal ? 'Mencari...' : 'Cari Soal'}
            </button>
          </div>

          {sudahCari && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: '#374151' }}>{daftarSoal.length} soal ditemukan</span>
                <button onClick={() => tambahBanyakKeKeranjang(daftarSoal)} style={btnSecondary}>+ Tambah Semua ke Keranjang</button>
              </div>

              {daftarSoal.length === 0 ? (
                <div style={{ padding: 20, textAlign: 'center', color: '#9ca3af', fontSize: 13 }}>Tidak ada soal cocok dengan filter.</div>
              ) : (
                <div style={{ maxHeight: 420, overflowY: 'auto', border: '1px solid #e5e7eb', borderRadius: 10 }}>
                  {daftarSoal.map((s) => (
                    <div
                      key={s.id}
                      onClick={() => toggleKeranjang(s)}
                      style={{
                        display: 'flex', gap: 10, alignItems: 'flex-start', padding: '10px 14px',
                        borderBottom: '1px solid #f1f5f9', cursor: 'pointer',
                        backgroundColor: keranjang.has(s.id) ? '#ecfeff' : 'white',
                      }}
                    >
                      {keranjang.has(s.id) ? <CheckSquare size={18} color="#06b6d4" style={{ flexShrink: 0, marginTop: 2 }} /> : <Square size={18} color="#cbd5e1" style={{ flexShrink: 0, marginTop: 2 }} />}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 11, color: '#9ca3af', marginBottom: 2 }}>
                          #{s.nomor} · {s.tipe} · {s.jenisUjian || '-'} · {s.materi || '-'} · {s.tingkatKesulitan || '-'}
                        </div>
                        <div style={{ fontSize: 13, color: '#1e293b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {s.soal || s.teks_soal || '(tanpa teks)'}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {tab === 'bucket' && (
        <div>
          <div style={{ background: '#faf5ff', border: '1px solid #e9d5ff', borderRadius: 12, padding: 16, marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 700, fontSize: 13, color: '#6b21a8', marginBottom: 4 }}>
              <Sparkles size={15} /> Bucket Otomatis
            </div>
            <p style={{ fontSize: 12, color: '#7e22ce', marginBottom: 12 }}>
              Pilih kelas, tempel daftar bab/materi dari kisi-kisi resmi (1 topik per baris -- boleh langsung copas, anotasi seperti "Sering muncul" otomatis dibuang), lalu isi target jumlah soal.
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '160px 1fr', gap: 10, marginBottom: 10 }}>
              <input placeholder="Kelas (mis. 9)" value={bucketKelas} onChange={(e) => setBucketKelas(e.target.value)} style={inputStyle} />
              <input type="number" min={1} placeholder="Target jumlah soal (mis. 30)" value={bucketJumlah} onChange={(e) => setBucketJumlah(e.target.value)} style={inputStyle} />
            </div>
            <textarea
              placeholder={'Tempel daftar bab/materi di sini, 1 topik per baris. Contoh:\nBilangan bulat, pecahan, desimal, dan persen\nBilangan berpangkat (eksponen) dan bentuk akar\nPola dan barisan bilangan'}
              value={bucketMateriTeks}
              onChange={(e) => setBucketMateriTeks(e.target.value)}
              rows={6}
              style={{ ...inputStyle, width: '100%', fontFamily: 'monospace', fontSize: 12, resize: 'vertical' }}
            />
            <button onClick={cariBucketOtomatis} disabled={loadingBucket} style={{ ...btnPrimary, marginTop: 10, backgroundColor: '#7e22ce' }}>
              {loadingBucket ? <Loader2 size={15} className="spin" /> : <Sparkles size={15} />}
              {loadingBucket ? 'Mencari...' : 'Cari & Isi Keranjang Otomatis'}
            </button>
          </div>

          {hasilBucket && (
            <div style={{ border: '1px solid #e5e7eb', borderRadius: 10, padding: 14 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#374151', marginBottom: 8 }}>Hasil pencarian per topik:</div>
              {hasilBucket.map((h, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, padding: '4px 0', borderBottom: i < hasilBucket.length - 1 ? '1px dashed #f1f5f9' : 'none' }}>
                  <span style={{ color: '#374151' }}>{h.topik}</span>
                  <span style={{ color: h.ditemukan === 0 ? '#dc2626' : '#16a34a', fontWeight: 600 }}>{h.ditemukan} soal ditemukan</span>
                </div>
              ))}
              {hasilBucket.some((h) => h.ditemukan === 0) && (
                <div style={{ marginTop: 8, fontSize: 11, color: '#dc2626' }}>
                  ⚠️ Ada topik yang belum punya soal sama sekali di Bank Soal -- perlu diimport dulu.
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {keranjang.size > 0 && (
        <div style={{
          position: 'fixed', bottom: 0, left: 0, right: 0, backgroundColor: 'white',
          borderTop: '2px solid #06b6d4', boxShadow: '0 -4px 16px rgba(0,0,0,0.08)',
          padding: '16px 24px', zIndex: 50, maxHeight: 300, overflowY: 'auto',
        }}>
          <div style={{ maxWidth: 1100, margin: '0 auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
              <ShoppingCart size={18} color="#06b6d4" />
              <span style={{ fontWeight: 800, fontSize: 14, color: '#0e7490' }}>Keranjang: {keranjang.size} soal</span>
              <span style={{ fontSize: 11, color: '#9ca3af' }}>
                ({ringkasanKeranjang.map(([label, n]) => `${label}: ${n}`).join(' · ')})
              </span>
              <button onClick={kosongkanKeranjang} style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: '#dc2626', background: 'none', border: 'none', cursor: 'pointer' }}>
                <Trash2 size={14} /> Kosongkan
              </button>
            </div>

            <input
              placeholder="Judul kuis (mis. Tryout TKA Bahasa Indonesia Paket 1)"
              value={judulKuis}
              onChange={(e) => setJudulKuis(e.target.value)}
              style={{ ...inputStyle, width: '100%', marginBottom: 8 }}
            />
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 8, marginBottom: 8 }}>
              <select value={targetKelas} onChange={(e) => setTargetKelas(e.target.value)} style={inputStyle}>
                {availableClasses.map((k) => <option key={k} value={k}>{k === 'Semua' ? 'Semua Kelas' : k}</option>)}
              </select>
              <select value={targetKategori} onChange={(e) => setTargetKategori(e.target.value)} style={inputStyle}>
                <option value="Semua">Semua Program</option>
                <option value="Reguler">Reguler</option>
                <option value="English">English</option>
              </select>
              <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#374151' }}>
                <input type="checkbox" checked={pakaiDeadline} onChange={(e) => setPakaiDeadline(e.target.checked)} />
                Pakai deadline
              </label>
              {pakaiDeadline && (
                <input type="datetime-local" value={deadlineTanggal} onChange={(e) => setDeadlineTanggal(e.target.value)} style={inputStyle} />
              )}
            </div>

            {/* 🔥 BARU: Mode Ujian -- Timer/Acak/Anti-Cheat, tersambung
                langsung ke fitur yang sudah ada & jalan di
                StudentQuizView.jsx, bukan bikin baru. */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14, alignItems: 'center', padding: '8px 10px', backgroundColor: '#f9fafb', borderRadius: 8, marginBottom: 8 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#374151' }}>
                <input type="checkbox" checked={pakaiTimer} onChange={(e) => setPakaiTimer(e.target.checked)} />
                <Timer size={13} /> Batas waktu
              </label>
              {pakaiTimer && (
                <input
                  type="number" min={1} value={durasiMenit} onChange={(e) => setDurasiMenit(e.target.value)}
                  style={{ ...inputStyle, width: 90, padding: '5px 8px' }}
                />
              )}
              {pakaiTimer && <span style={{ fontSize: 11, color: '#9ca3af', marginLeft: -8 }}>menit</span>}

              <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#374151' }}>
                <input type="checkbox" checked={soalAcak} onChange={(e) => setSoalAcak(e.target.checked)} />
                <Shuffle size={13} /> Acak urutan soal
              </label>

              <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#374151' }}>
                <input type="checkbox" checked={antiCheat} onChange={(e) => setAntiCheat(e.target.checked)} />
                <ShieldAlert size={13} /> Deteksi kecurangan (pindah tab/keluar fullscreen)
              </label>
            </div>

            <button onClick={handleTerbitkan} disabled={menerbitkan} style={btnPrimary}>
              {menerbitkan ? <Loader2 size={15} className="spin" /> : <Send size={15} />}
              {menerbitkan ? 'Menerbitkan...' : `Terbitkan ${keranjang.size} Soal ke Siswa`}
            </button>
          </div>
        </div>
      )}

      {hasil && (
        <div style={{
          marginTop: 16, padding: 14, borderRadius: 10, display: 'flex', gap: 10, alignItems: 'flex-start',
          backgroundColor: hasil.success ? '#f0fdf4' : '#fef2f2',
          border: `1px solid ${hasil.success ? '#bbf7d0' : '#fecaca'}`,
          color: hasil.success ? '#166534' : '#b91c1c', fontSize: 13,
        }}>
          {hasil.success ? <CheckCircle2 size={18} /> : <AlertTriangle size={18} />}
          {hasil.message}
        </div>
      )}
    </div>
  );
}

const backBtn = { display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', color: '#6b7280', cursor: 'pointer', marginBottom: 16, fontSize: 13 };
const inputStyle = { padding: '9px 12px', borderRadius: 8, border: '1px solid #d1d5db', fontSize: 13, outline: 'none' };
const btnPrimary = {
  display: 'flex', alignItems: 'center', gap: 8, padding: '10px 18px', borderRadius: 8,
  border: 'none', backgroundColor: '#06b6d4', color: 'white', fontWeight: 700, fontSize: 13, cursor: 'pointer',
};
const btnSecondary = {
  padding: '6px 12px', borderRadius: 6, border: '1px solid #d1d5db', backgroundColor: 'white',
  fontSize: 12, cursor: 'pointer', color: '#374151',
};
const tabAktif = { padding: '10px 16px', border: 'none', borderBottom: '2px solid #06b6d4', backgroundColor: 'transparent', color: '#0e7490', fontWeight: 700, fontSize: 13, cursor: 'pointer' };
const tabPasif = { padding: '10px 16px', border: 'none', borderBottom: '2px solid transparent', backgroundColor: 'transparent', color: '#9ca3af', fontWeight: 600, fontSize: 13, cursor: 'pointer' };