// src/pages/admin/bank-soal/TerbitkanTryOutPage.jsx
// ============================================================
// TERBITKAN TRY OUT (Admin) -- versi BARU, TERPISAH TOTAL dari
// TerbitkanKuisPage.jsx (yang nerbitin ke bimbel_modul/kuis_mandiri,
// dibaca StudentQuizView.jsx). Kenapa dipisah: try out ini butuh 3 hal
// yang belum ada di sistem lama --
//   1. Skor PROPORSIONAL buat PG Kompleks & Benar/Salah (lihat
//      src/utils/skoringSoalKompleks.js), bukan semua-atau-tidak.
//   2. 2 MODE TIMER: total (1 jam buat semua soal) ATAU per-subtes
//      (kayak UTBK/TKA asli -- tiap mapel py durasi sendiri, gak bisa
//      balik ke subtes sebelumnya).
//   3. Anti-cheat dengan KAMERA (foto acak, bukan cuma deteksi
//      pindah-tab) + potongan XP proporsional (lihat
//      src/utils/potonganXPTryOut.js).
//
// Soal DISIMPAN APA ADANYA (skema asli Bank Soal: tipe, opsiJawaban,
// kunciJawaban, pernyataan, tabel_benar_salah, dst) -- TIDAK dikonversi
// ke skema quizData lama, karena RendererPgKompleks.jsx &
// RendererBenarSalah.jsx dibuat buat baca skema asli ini langsung.
//
// v1 SENGAJA CUMA "Cari Bebas" (filter datar) -- belum ada jelajah per
// folder / bucket otomatis kayak TerbitkanKuisPage.jsx. Bisa ditambah
// belakangan kalau memang kepake buat try out juga.
// ============================================================

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import TeksSoalBergambar from '../../../components/TeksSoalBergambar';
import { useNavigate } from 'react-router-dom';
import { db } from '../../../firebase';
import { collection, getDocs, addDoc, deleteDoc, doc, updateDoc, query, where, serverTimestamp } from 'firebase/firestore';
import { notifyStudents } from '../../../utils/notifications';
import { catatAudit, KATEGORI } from '../../../utils/auditLog';
import RendererPgSederhana from '../../student/tryout/RendererPgSederhana';
import RendererPgKompleks from '../../student/tryout/RendererPgKompleks';
import RendererBenarSalah from '../../student/tryout/RendererBenarSalah';
import RendererIsianSingkat from '../../student/tryout/RendererIsianSingkat';
import RendererEsai from '../../student/tryout/RendererEsai';
import RenderMath from '../../../components/RenderMath';
import RenderTable from '../../../components/RenderTable';
// 🔥 BARU (2026-10, permintaan owner "terbitkan try out langsung satu
// folder"): pagar tipe soal + penghitung rincian keranjang sekarang
// tinggal di src/utils/keranjangTryOut.js biar bisa di-test otomatis
// (tests/keranjangTryOut.test.mjs) dan dipakai tombol BARU "＋ 1 Folder".
import { tipeDidukung, hitungRincianMasukKeranjang, teksRincianKeranjang } from '../../../utils/keranjangTryOut';
// 🔥 BARU (2026-10-08, permintaan owner "cara edit tryout yang terbit
// gimana?" & "mengembalikan soal dan poin XP anak biar bisa kerjain
// ulang"): MODE EDIT paket terbit + panel RESET SESI. Logika murninya
// (tebak granularitas subtes, konversi ISO ke input jadwal, kalimat
// konfirmasi reset) tinggal di util yang di-test otomatis.
import { deteksiGranularitasSubtes, isoKeDatetimeLocal } from '../../../utils/logikaSubtesTryOut.js';
import { teksKonfirmasiResetSesi } from '../../../utils/pemulihanXPTryOut.js';
import { resetSesiTryOut } from '../../../services/resetSesiTryOut.js';
import {
  ArrowLeft, Loader2, Send, ShoppingCart, Trash2, CheckCircle2, AlertTriangle,
  Timer, ShieldAlert, Camera, ListChecks, Layers, Folder, FolderOpen, ChevronDown, ChevronUp, ChevronRight, Sparkles,
  Pencil, RotateCcw, Printer,
} from 'lucide-react';
// 🔥 BARU (2026-10-08, permintaan owner sambil mengirim tangkapan layar
// halaman ini: "selain terbit ke siswa aku mau kasih tombol print soal
// yang udah di tata sesuai kanan kiri seperti sebelumnya kita diskusikan
// tinggal print"): tombol 🖨️ di kartu paket terbit & di panel keranjang
// membuka dialog naskah model ujian (dua kolom rapi) -- mesin naskahnya
// sama dengan halaman guru, kepala seksi subtes dari util murni yang
// diuji otomatis (utils/seksiNaskahTryOut.js).
import DialogCetakNaskah from '../../../components/DialogCetakNaskah';
import { bangunSubtesKeranjang } from '../../../utils/seksiNaskahTryOut';

const inputStyle = { padding: '9px 12px', borderRadius: 8, border: '1px solid #d1d5db', fontSize: 13, outline: 'none' };
const btnPrimary = {
  display: 'flex', alignItems: 'center', gap: 8, padding: '10px 18px', borderRadius: 8,
  border: 'none', backgroundColor: '#7c3aed', color: 'white', fontWeight: 700, fontSize: 13, cursor: 'pointer',
};
const tabAktif = { padding: '10px 16px', border: 'none', borderBottom: '2px solid #7c3aed', backgroundColor: 'transparent', color: '#6d28d9', fontWeight: 700, fontSize: 13, cursor: 'pointer' };
const tabPasif = { padding: '10px 16px', border: 'none', borderBottom: '2px solid transparent', backgroundColor: 'transparent', color: '#9ca3af', fontWeight: 600, fontSize: 13, cursor: 'pointer' };

// 🔥 BARU: dipindah dari TerbitkanKuisPage.jsx -- admin sering gak
// hafal nama materi persis, apalagi TKA butuh cakupan kisi-kisi yang
// banyak. Kisi-kisi asli sering ditempel dengan anotasi frekuensi
// nempel tanpa spasi, contoh: "Bilangan bulat, pecahan, desimal, dan
// persenSering muncul" -- fungsi ini pisahkan topik dari anotasi itu
// SEBELUM dipakai buat mencari soal.
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

// 🔥 PAGAR TIPE SOAL dipindah ke src/utils/keranjangTryOut.js (lihat
// import di atas) -- isinya SAMA PERSIS, cuma pindah rumah biar bisa
// di-test node tanpa browser dan dipakai rame-rame oleh tombol
// "＋ Tambah Semua" per bab maupun tombol BARU "＋ 1 Folder".

// 🔥 BARU: warna badge per mapel -- biar di folder yang campur mapel,
// admin bisa sekali lirik tau soal ini mapel apa, gak perlu baca teks
// soal dulu buat nebak (biar gak takut salah pilih pas folder campur).
const WARNA_MAPEL = {
  'Matematika': { bg: '#dbeafe', text: '#1e40af' },
  'Fisika': { bg: '#e0e7ff', text: '#4338ca' },
  'Kimia': { bg: '#fce7f3', text: '#9d174d' },
  'Biologi': { bg: '#dcfce7', text: '#166534' },
  'Bahasa Indonesia': { bg: '#fef3c7', text: '#92400e' },
  'Bahasa Inggris': { bg: '#ffedd5', text: '#9a3412' },
  'Ekonomi': { bg: '#f3e8ff', text: '#6b21a8' },
  'Geografi': { bg: '#d1fae5', text: '#065f46' },
  'Sosiologi': { bg: '#fee2e2', text: '#991b1b' },
  'Sejarah': { bg: '#e7e5e4', text: '#44403c' },
  'PKN': { bg: '#cffafe', text: '#155e75' },
  'TPS/Penalaran Umum': { bg: '#ede9fe', text: '#5b21b6' },
};
function warnaMapel(mapel) {
  return WARNA_MAPEL[mapel] || { bg: '#f1f5f9', text: '#475569' };
}

function BadgeMapel({ mapel }) {
  if (!mapel) return null;
  const w = warnaMapel(mapel);
  return (
    <span style={{ display: 'inline-block', padding: '1px 7px', borderRadius: 999, fontSize: 10, fontWeight: 700, background: w.bg, color: w.text, marginRight: 6, whiteSpace: 'nowrap' }}>
      {mapel}
    </span>
  );
}

// Pemilih renderer sesuai tipe soal -- SAMA PERSIS logikanya dengan
// TryOutView.jsx, biar preview admin nunjukin persis tampilan yang
// bakal dilihat siswa (bukan versi beda yang bisa aja ternyata beda
// pas siswa asli ngerjain).
function RendererSoalPreview({ soal }) {
  const tipe = soal.tipe || 'pg_sederhana';
  if (tipe === 'pg_kompleks') return <RendererPgKompleks soal={soal} disabled modeTinjau />;
  if (tipe === 'benar_salah' || tipe === 'pg_kategori') return <RendererBenarSalah soal={soal} disabled modeTinjau />;
  if (tipe === 'isian_singkat' || tipe === 'numerik') return <RendererIsianSingkat soal={soal} disabled modeTinjau />;
  if (tipe === 'esai' || tipe === 'uraian') return <RendererEsai soal={soal} disabled modeTinjau />;
  return <RendererPgSederhana soal={soal} disabled modeTinjau />;
}

export default function TerbitkanTryOutPage() {
  const navigate = useNavigate();

  // ---------------- KERANJANG ----------------
  const [keranjang, setKeranjang] = useState(new Map()); // soalId -> soal

  const toggleKeranjang = useCallback((soal) => {
    if (!tipeDidukung(soal)) return; // 🔒 pagar -- tipe belum didukung, jangan masuk keranjang
    setKeranjang((prev) => {
      const next = new Map(prev);
      if (next.has(soal.id)) next.delete(soal.id); else next.set(soal.id, soal);
      return next;
    });
  }, []);

  const tambahBanyakKeKeranjang = useCallback((daftarSoal) => {
    setKeranjang((prev) => {
      const next = new Map(prev);
      // 🔒 pagar yang sama -- "+ Tambah Semua" per bab TIDAK ikut
      // nyeret soal bertipe belum didukung.
      daftarSoal.filter(tipeDidukung).forEach((s) => next.set(s.id, s));
      return next;
    });
  }, []);


  // 🔥 BARU: dibungkus useCallback (dulu fungsi biasa) biar boleh masuk
  // deps useCallback lain (batalkanEdit) tanpa peringatan react-hooks.
  const kosongkanKeranjang = useCallback(() => setKeranjang(new Map()), []);

  // 🔥 BARU: 4 tab, sama pola kayak TerbitkanKuisPage.jsx -- keranjang
  // yang SAMA dipakai lintas tab, biar bisa campur soal dari folder +
  // bucket + cari bebas + kelemahan kelas sekaligus.
  const [tab, setTab] = useState('folder'); // 'folder' | 'cari' | 'bucket' | 'kelemahan'

  // ---------------- TAB: KELEMAHAN KELAS ----------------
  // 🔥 BARU: rekomendasi materi yang PALING LEMAH buat target kelas
  // yang SAMA kayak dipilih di "Target Kelas/Kategori" -- dihitung
  // dari data Latihan Harian (siswa_soal_progress) SEMUA siswa yang
  // cocok, bukan cuma 1 siswa. Kenapa pool bareng (bukan rata-rata per
  // siswa dulu baru dirata-rata lagi): lebih simpel & gak bias sama
  // siswa yang baru nyoba dikit soal.
  const [sedangMuatKelemahan, setSedangMuatKelemahan] = useState(false);
  const [daftarKelemahan, setDaftarKelemahan] = useState(null); // null = belum pernah dicek
  const [sedangTambahMateri, setSedangTambahMateri] = useState(null); // materi yang lagi diproses
  // 🔥 Fungsi cekKelemahanKelas & tambahSoalMateriLemah ditaruh SETELAH
  // targetKelas/targetKategori dideklarasi (lihat di bawah), biar gak
  // kena error "dipakai sebelum didefinisikan".

  // ---------------- TAB: JELAJAH PER FOLDER ----------------
  const [daftarFolder, setDaftarFolder] = useState([]);
  const [loadingFolder, setLoadingFolder] = useState(true);
  const [folderDibuka, setFolderDibuka] = useState(null);
  const [cacheSoalFolder, setCacheSoalFolder] = useState({});
  const [loadingSoalFolder, setLoadingSoalFolder] = useState(false);
  // 🔥 BARU (2026-10): state buat tombol "＋ 1 Folder" -- spinner di
  // tombol saat soal folder lagi diambil di latar belakang (folder
  // TIDAK perlu dibuka dulu), plus toast konfirmasi berisi rincian
  // jujur (berapa baru / sudah ada / dilewati).
  const [folderSedangDimuat, setFolderSedangDimuat] = useState(null);
  const [infoTambah, setInfoTambah] = useState('');
  const timerInfoTambah = useRef(null);
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

  // 🔥 BARU (2026-10): pengambilan soal folder DIPISAH dari bukaFolder
  // biar tombol "＋ 1 Folder" bisa memuat soal di LATAR BELAKANG tanpa
  // ikut membuka/menutup foldernya. Cache-nya SAMA, jadi klik folder
  // setelahnya tetap instan (gak dobel query Firestore -- hemat kuota
  // free tier, lihat docs/POLICY-ERROR-DAN-KUOTA.md).
  const muatSoalFolder = useCallback(async (folderId) => {
    if (cacheSoalFolder[folderId]) return cacheSoalFolder[folderId];
    try {
      let list;
      if (folderId === '__tanpa_folder__') {
        // Soal lama dari SEBELUM sistem Folder Sumber ada -- dulu gak
        // kesimpen di folder mana pun. Ambil SEMUA soal aktif, terus
        // saring sendiri yang sumberSoalId-nya kosong/gak ada.
        const snap = await getDocs(query(collection(db, 'bank_soal'), where('status', '==', 'aktif')));
        list = snap.docs.map((d) => ({ id: d.id, ...d.data() })).filter((s) => !s.sumberSoalId);
      } else {
        const q = query(collection(db, 'bank_soal'), where('sumberSoalId', '==', folderId), where('status', '==', 'aktif'));
        const snap = await getDocs(q);
        list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      }
      list.sort((a, b) => (Number(a.nomor) || 0) - (Number(b.nomor) || 0));
      setCacheSoalFolder((prev) => ({ ...prev, [folderId]: list }));
      return list;
    } catch (e) {
      console.error('Gagal ambil soal folder:', e);
      alert('Gagal mengambil soal folder: ' + e.message);
      return [];
    }
  }, [cacheSoalFolder]);

  const bukaFolder = useCallback(async (folderId) => {
    if (folderDibuka === folderId) { setFolderDibuka(null); return; }
    setFolderDibuka(folderId);
    setBabDibuka(null);
    if (cacheSoalFolder[folderId]) return;
    setLoadingSoalFolder(true);
    await muatSoalFolder(folderId);
    setLoadingSoalFolder(false);
  }, [folderDibuka, cacheSoalFolder, muatSoalFolder]);

  // 🔥 BARU (2026-10, permintaan owner): SEKALI KLIK masukan SEMUA soal
  // satu folder ke keranjang -- gak perlu buka folder lalu klik
  // "＋ Tambah Semua" per bab satu-satu. Pagar tipe soal TETAP dipakai
  // (tambahBanyakKeKeranjang menyaring tipe belum didukung), dan soal
  // yang sudah ada di keranjang gak diduplikasi (keranjang itu Map).
  const masukkanSemuaFolder = useCallback(async (folderId) => {
    if (folderSedangDimuat) return; // 🔒 satu proses muat pada satu waktu
    setFolderSedangDimuat(folderId);
    const list = await muatSoalFolder(folderId);
    const rincian = hitungRincianMasukKeranjang(keranjang, list);
    tambahBanyakKeKeranjang(list);
    setInfoTambah(teksRincianKeranjang(rincian));
    if (timerInfoTambah.current) clearTimeout(timerInfoTambah.current);
    timerInfoTambah.current = setTimeout(() => setInfoTambah(''), 4500);
    setFolderSedangDimuat(null);
  }, [folderSedangDimuat, muatSoalFolder, keranjang, tambahBanyakKeKeranjang]);

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

  // ---------------- TAB: BUCKET OTOMATIS ----------------
  // Admin cukup: pilih kelas, TEMPEL daftar bab/materi dari kisi-kisi
  // resmi (1 topik per baris), isi target jumlah soal -> sistem cari
  // LINTAS SEMUA FOLDER otomatis dan isi keranjang, distribusi merata
  // per topik supaya tidak numpuk di 1 topik saja.
  const [bucketKelas, setBucketKelas] = useState('');
  const [bucketMateriTeks, setBucketMateriTeks] = useState('');
  const [bucketJumlah, setBucketJumlah] = useState(30);
  const [loadingBucket, setLoadingBucket] = useState(false);
  const [hasilBucket, setHasilBucket] = useState(null);

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

      const perTopik = daftarTopik.map((topik) => {
        const kw = topik.toLowerCase();
        const cocok = semuaSoal.filter((s) => String(s.materi || '').toLowerCase().includes(kw));
        return { topik, soal: cocok };
      });

      // Distribusi merata: ambil bergiliran 1 soal dari tiap topik yang
      // masih ada sisa, sampai target tercapai atau semua topik habis.
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

      setKeranjang((prev) => {
        const next = new Map(prev);
        terpilih.forEach((s, id) => next.set(id, s));
        return next;
      });
      setHasilBucket(perTopik.map((p) => ({ topik: p.topik, ditemukan: p.soal.length })));
    } catch (e) {
      console.error('Gagal cari bucket otomatis:', e);
      alert('Gagal mengambil soal: ' + e.message);
    }
    setLoadingBucket(false);
  }, [bucketKelas, bucketMateriTeks, bucketJumlah]);

  // ---------------- CARI BEBAS ----------------
  const [filterMapel, setFilterMapel] = useState('');
  const [filterJenisUjian, setFilterJenisUjian] = useState('');
  const [filterKelas, setFilterKelas] = useState('');
  const [filterMateri, setFilterMateri] = useState('');
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
      const snap = await getDocs(query(collection(db, 'bank_soal'), ...constraints));
      let list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));

      if (filterKelas.trim()) list = list.filter((s) => String(s.tingkatKelas || '') === filterKelas.trim());
      if (filterMateri.trim()) {
        const kw = filterMateri.trim().toLowerCase();
        list = list.filter((s) => String(s.materi || '').toLowerCase().includes(kw));
      }
      setDaftarSoal(list);
    } catch (e) {
      console.error('Gagal cari soal:', e);
      alert('Gagal mengambil soal: ' + e.message);
    }
    setLoadingSoal(false);
  }, [filterMapel, filterJenisUjian, filterKelas, filterMateri]);

  // ---------------- FORM TERBITKAN ----------------
  const [judulTryOut, setJudulTryOut] = useState('');
  const [targetKelas, setTargetKelas] = useState('Semua');
  const [targetKategori, setTargetKategori] = useState('Semua');
  const [availableClasses, setAvailableClasses] = useState(['Semua']);

  // ---------------- TAB: KELEMAHAN KELAS ----------------
  // 🔥 BARU: rekomendasi materi yang PALING LEMAH buat target kelas
  // yang SAMA kayak dipilih di "Target Kelas/Kategori" di atas --
  // dihitung dari data Latihan Harian (siswa_soal_progress) SEMUA
  // siswa yang cocok, bukan cuma 1 siswa. Kenapa pool bareng (bukan
  // rata-rata per siswa dulu baru dirata-rata lagi): lebih simpel &
  // gak bias sama siswa yang baru nyoba dikit soal.
  const cekKelemahanKelas = useCallback(async () => {
    setSedangMuatKelemahan(true);
    setDaftarKelemahan(null);
    try {
      // 1. Cari siswa yang cocok target kelas/kategori (SAMA PERSIS
      //    logika yang dipakai buat filter penerima try out ini).
      const snapSiswa = await getDocs(collection(db, 'students'));
      const siswaCocok = snapSiswa.docs
        .map((d) => ({ id: d.id, ...d.data() }))
        .filter((s) => {
          const cocokKelas = targetKelas === 'Semua' || s.kelasSekolah === targetKelas;
          const cocokKategori = targetKategori === 'Semua' || s.kategori === targetKategori;
          return cocokKelas && cocokKategori && !s.isBlocked;
        });

      if (siswaCocok.length === 0) {
        setDaftarKelemahan([]);
        setSedangMuatKelemahan(false);
        return;
      }

      // 2. Ambil semua progres Latihan Harian siswa-siswa itu --
      //    dipecah per 30 ID (batas Firestore buat query 'in').
      const studentIds = siswaCocok.map((s) => s.studentId).filter(Boolean);
      const semuaProgres = [];
      for (let i = 0; i < studentIds.length; i += 30) {
        const potongan = studentIds.slice(i, i + 30);
        const snap = await getDocs(query(collection(db, 'siswa_soal_progress'), where('studentId', 'in', potongan)));
        snap.forEach((d) => semuaProgres.push(d.data()));
      }

      if (semuaProgres.length === 0) {
        setDaftarKelemahan([]);
        setSedangMuatKelemahan(false);
        return;
      }

      // 3. Ambil materi tiap soal yang pernah dicoba -- dipecah per 30
      //    ID juga.
      const soalIds = [...new Set(semuaProgres.map((p) => p.soalId))];
      const soalMap = {};
      for (let i = 0; i < soalIds.length; i += 30) {
        const potongan = soalIds.slice(i, i + 30);
        const snap = await getDocs(query(collection(db, 'bank_soal'), where('__name__', 'in', potongan)));
        snap.forEach((d) => { soalMap[d.id] = d.data(); });
      }

      // 4. Gabungkan jadi 1 kolam per materi (BUKAN dirata-rata per
      //    siswa dulu) -- persentase benar dari SELURUH percobaan
      //    siswa yang cocok kelas/kategori ini.
      const perMateri = {};
      semuaProgres.forEach((p) => {
        const soal = soalMap[p.soalId];
        if (!soal) return;
        const materi = soal.materi || 'Tidak diketahui';
        const mapel = soal.mataPelajaran || '';
        const kunci = `${mapel}||${materi}`;
        if (!perMateri[kunci]) perMateri[kunci] = { mapel, materi, dicoba: 0, benar: 0 };
        perMateri[kunci].dicoba += 1;
        perMateri[kunci].benar += (p.benarCount || 0) > 0 ? 1 : 0;
      });

      const hasil = Object.values(perMateri)
        .map((d) => ({ ...d, persentaseBenar: Math.round((d.benar / d.dicoba) * 100) }))
        // Minimal 5x dicoba -- biar gak berisik dari materi yang baru
        // disentuh 1-2 kali doang (belum cukup buat disimpulkan "lemah").
        .filter((d) => d.dicoba >= 5)
        .sort((a, b) => a.persentaseBenar - b.persentaseBenar);

      setDaftarKelemahan(hasil);
    } catch (e) {
      console.error('Gagal cek kelemahan kelas:', e);
      alert('Gagal mengecek kelemahan kelas: ' + e.message);
      setDaftarKelemahan([]);
    }
    setSedangMuatKelemahan(false);
  }, [targetKelas, targetKategori]);

  // Tambahin ~6 soal dari 1 materi lemah langsung ke keranjang --
  // sesuai permintaan: "otomatis tambahin, tinggal dicek ulang" (bukan
  // cuma kasih tau doang).
  const tambahSoalMateriLemah = useCallback(async (item) => {
    setSedangTambahMateri(item.materi);
    try {
      const q = query(
        collection(db, 'bank_soal'),
        where('mataPelajaran', '==', item.mapel),
        where('materi', '==', item.materi),
        where('status', '==', 'aktif'),
      );
      const snap = await getDocs(q);
      const daftarSoal = snap.docs
        .map((d) => ({ id: d.id, ...d.data() }))
        .filter(tipeDidukung) // 🔒 pagar yang sama -- jangan tambahin tipe yang belum didukung
        .slice(0, 6); // secukupnya buat 1 materi, bukan seluruh bank soal-nya

      if (daftarSoal.length === 0) {
        alert(`Gak ketemu soal aktif buat materi "${item.materi}" (${item.mapel}) yang tipe-nya didukung Try Out.`);
      } else {
        tambahBanyakKeKeranjang(daftarSoal);
        alert(`${daftarSoal.length} soal dari materi "${item.materi}" ditambahkan ke keranjang -- cek ulang di panel keranjang sebelum diterbitkan.`);
      }
    } catch (e) {
      console.error('Gagal tambah soal materi lemah:', e);
      alert('Gagal: ' + e.message);
    }
    setSedangTambahMateri(null);
  }, [tambahBanyakKeKeranjang]);

  // 🔥 BARU: jadwal buka & deadline -- sebelumnya gak ada sama sekali,
  // jadi try out langsung "kebuka" begitu diterbitkan dan gak pernah
  // "ditutup" otomatis. Sekarang keduanya OPSIONAL:
  // - waktuBuka kosong = langsung bisa dikerjakan begitu diterbitkan
  // - waktuTutup kosong = gak ada batas akhir, kapan aja boleh mulai
  const [pakaiJadwalBuka, setPakaiJadwalBuka] = useState(false);
  const [waktuBuka, setWaktuBuka] = useState('');
  const [pakaiDeadline, setPakaiDeadline] = useState(false);
  const [waktuTutup, setWaktuTutup] = useState('');

  // 🔥 2 MODE TIMER -- ini beda utama dari sistem kuis lama.
  const [modeTimer, setModeTimer] = useState('total'); // 'total' | 'per-subtes'
  const [durasiTotalMenit, setDurasiTotalMenit] = useState(90);
  // subtes: dibuat OTOMATIS dari mataPelajaran yang ada di keranjang,
  // admin tinggal atur durasi & nama tiap subtes (bisa diedit).
  const [durasiSubtes, setDurasiSubtes] = useState({}); // { [mataPelajaran]: menit }
  // 🔥 BARU (bug nyata ditemukan): sebelumnya "per-subtes" SELALU
  // ngelompokin per MATA PELAJARAN -- kalau semua soal 1 mapel yang
  // sama, jadinya cuma 1 subtes buat SEMUA soal, dengan 1 kotak durasi
  // doang. Admin yang maksudnya "3 menit PER SOAL" (20 soal @ 3 menit)
  // kalau isi "3" di kotak itu, yang kejadian malah "3 menit buat
  // SEMUA 20 soal sekaligus" -- abis 3 menit langsung submit
  // semuanya, bukan pindah soal. Sekarang ada pilihan granularitas:
  // "per mapel" (yang lama, cocok gaya UTBK -- 1 waktu bareng buat 1
  // mapel) ATAU "per soal individual" (BARU -- tiap soal py subtes &
  // durasi sendiri, abis waktu OTOMATIS lanjut soal berikutnya, GAK
  // BISA balik -- persis yang diminta).
  const [granularitasSubtes, setGranularitasSubtes] = useState('mapel'); // 'mapel' | 'soal'
  const [durasiPerSoal, setDurasiPerSoal] = useState(3); // menit, dipakai kalau granularitasSubtes === 'soal'

  const daftarMapelDiKeranjang = useMemo(() => {
    const set = new Set();
    keranjang.forEach((s) => set.add(s.mataPelajaran || 'Umum'));
    return Array.from(set);
  }, [keranjang]);

  // 🔥 FIX (ditangkap aturan react-hooks saat fitur esai masuk): dulu ada
  // useEffect yang menyetel default durasi 30 menit ke state setiap kali
  // keranjang berubah -- setState sinkron di dalam effect. Itu TIDAK
  // PERLU: kedua pembaca durasi sudah punya fallback bawaan
  // (`Number(durasiSubtes[mapel]) || 30` dan `durasiSubtes[mapel] ?? 30`),
  // jadi kunci yang belum ada memang otomatis berarti 30 menit.

  // 🔥 Anti-cheat -- nyambung ke useDeteksiKecuranganTryOut.js
  const [antiCheatAktif, setAntiCheatAktif] = useState(true);
  const [wajibKamera, setWajibKamera] = useState(true);
  // 🔥 BARU: acak urutan soal per siswa -- beda siswa beda urutan
  // nomor (anti-nyontek liat jawaban nomor sekian dari teman sebelah).
  const [soalAcak, setSoalAcak] = useState(true);

  const [menerbitkan, setMenerbitkan] = useState(false);
  const [hasil, setHasil] = useState(null);
  // 🔥 BARU: preview soal SEBELUM diterbitkan -- render pakai
  // komponen yang SAMA PERSIS dipakai siswa (RendererPgSederhana/
  // PgKompleks/BenarSalah), biar admin lihat PERSIS gimana tampilan
  // yang bakal dilihat siswa, bukan cuma potongan teks.
  const [showPreview, setShowPreview] = useState(false);
  // 🔥 BARU (2026-10-08): input dialog cetak naskah (bentuk paket). null =
  // dialog tertutup. Diisi dari kartu paket terbit (paket apa adanya) atau
  // dari panel keranjang (soal keranjang + struktur subtes yang SAMA dengan
  // yang akan disimpan tombol Terbitkan).
  const [cetakInput, setCetakInput] = useState(null);
  // 🔥 BARU (masalah nyata ditemukan): panel keranjang dulu SELALU
  // full terbuka (position fixed, isi semua form) begitu ada 1 soal
  // aja di keranjang -- nutup sebagian besar layar, bikin susah lanjut
  // milih soal lain di folder atas. Sekarang defaultnya DILIPAT (cuma
  // 1 baris tipis), meluas cuma pas diklik.
  const [keranjangDibuka, setKeranjangDibuka] = useState(false);

  // 🔥 BARU: daftar try out yang UDAH diterbitkan -- sebelumnya gak ada
  // sama sekali cara buat admin lihat "yang tadi udah diterbitkan
  // kemana". Muat ulang tiap kali habis terbitkan yang baru juga.
  const [daftarTerbit, setDaftarTerbit] = useState([]);
  const [daftarGuru, setDaftarGuru] = useState([]);
  const [tentorPublish, setTentorPublish] = useState('');
  useEffect(() => {
    getDocs(collection(db, 'teachers'))
      .then((snap) => setDaftarGuru(snap.docs.map((d) => ({ id: d.id, nama: d.data().nama || d.id }))))
      .catch(() => setDaftarGuru([]));
  }, []);
  const [loadingDaftarTerbit, setLoadingDaftarTerbit] = useState(true);

  // ── MODE EDIT PAKET TERBIT (BARU 2026-10-08) ── sebelumnya gak ada
  // cara sama sekali buat memperbaiki paket yang SUDAH terbit (cuma
  // nonaktifkan/hapus) -- padahal kebutuhan nyata: jadwal meleset,
  // durasi per soal salah isi, judul typo. Dulu satu-satunya jalan
  // hapus & terbitkan ulang, dan HASIL SISWA yang udah ngerjain ikut
  // kehilangan paketnya. Sekarang tombol "✏️ Edit" mengisi form ini
  // dengan isi paket, dan tombol terbitkan berubah jadi "Simpan
  // Perubahan" (updateDoc ke dokumen yang sama, bukan addDoc baru).
  const [editPaketId, setEditPaketId] = useState(null);
  const [editJudulAsli, setEditJudulAsli] = useState('');
  // ── PANEL RESET SESI (BARU 2026-10-08) ── daftar sesi siswa per
  // paket + tombol reset biar siswa bisa kerjain ulang dari nol sambil
  // XP lama ditarik balik biar gak dobel (services/resetSesiTryOut.js).
  const [resetPaket, setResetPaket] = useState(null);
  const [daftarSesiReset, setDaftarSesiReset] = useState([]);
  const [loadingSesiReset, setLoadingSesiReset] = useState(false);
  const [sedangResetSesi, setSedangResetSesi] = useState(null); // id sesi | 'semua'

  // 🔥 FIX (aturan react-hooks/set-state-in-effect): fetch daftar terbit
  // didefinisikan DI DALAM effect (pola yang sama dengan Settings.jsx yang
  // lolos aturan ini), dan muat ulang manual dilakukan lewat counter
  // `versiMuat` -- tombol hanya menaikkan counter, effect yang bekerja.
  // Tidak ada setState sinkron di badan effect sama sekali.
  const [versiMuat, setVersiMuat] = useState(0);
  useEffect(() => {
    let batal = false;
    const jalan = async () => {
      try {
        const snap = await getDocs(collection(db, 'tryout_paket'));
        const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        list.sort((a, b) => (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0));
        if (!batal) setDaftarTerbit(list);
      } catch (e) {
        console.error('Gagal ambil daftar try out terbit:', e);
      }
      if (!batal) setLoadingDaftarTerbit(false);
    };
    jalan();
    return () => { batal = true; };
  }, [versiMuat]);

  const muatDaftarTerbit = useCallback(() => {
    setLoadingDaftarTerbit(true);
    setVersiMuat((v) => v + 1);
  }, []);

  const nonaktifkanTryOut = useCallback(async (paket) => {
    const aksi = paket.status === 'aktif' ? 'nonaktifkan' : 'aktifkan';
    if (!window.confirm(`${aksi === 'nonaktifkan' ? 'Nonaktifkan' : 'Aktifkan lagi'} try out "${paket.judul}"?`)) return;
    try {
      await updateDoc(doc(db, 'tryout_paket', paket.id), { status: aksi === 'nonaktifkan' ? 'nonaktif' : 'aktif' });
      muatDaftarTerbit();
    } catch (e) {
      console.error('Gagal ubah status try out:', e);
      alert('Gagal mengubah status.');
    }
  }, [muatDaftarTerbit]);

  // 🔥 BARU: hapus PERMANEN (beda dari nonaktifkan). Begitu dihapus,
  // dokumennya beneran lenyap dari koleksi tryout_paket -- otomatis
  // gak akan muncul lagi di DaftarTryOutPage.jsx (siswa), karena
  // halaman itu baca LANGSUNG dari koleksi ini, bukan dari cache.
  // Sesi (tryout_sesi) yang SUDAH ADA punya siswa TETAP DIBIARKAN
  // (bukan ikut dihapus) -- itu riwayat hasil beneran, jangan sampai
  // hasil siswa yang udah selesai ngerjain jadi hilang cuma gara-gara
  // paketnya diberesin admin.
  const hapusTryOut = useCallback(async (paket) => {
    // 🔥 BARU (resiko nyata ditemukan): kalau ada siswa yang LAGI
    // NGERJAIN try out ini pas paketnya dihapus, dia bakal ke-lock di
    // tengah jalan ("Try out tidak ditemukan") -- gak bisa nyelesain,
    // XP-nya gak akan pernah masuk, sesinya nyangkut selamanya.
    // Sekarang dicek dulu SEBELUM konfirmasi hapus, biar admin tau
    // resikonya persis sebelum ngeklik.
    let jumlahSedangBerjalan = 0;
    try {
      const snapBerjalan = await getDocs(query(
        collection(db, 'tryout_sesi'),
        where('paketId', '==', paket.id),
        where('status', '==', 'berjalan'),
      ));
      jumlahSedangBerjalan = snapBerjalan.size;
    } catch (e) {
      console.error('Gagal cek siswa yang lagi ngerjain:', e);
    }

    const peringatanBerjalan = jumlahSedangBerjalan > 0
      ? `\n\n⚠️ PERINGATAN: ${jumlahSedangBerjalan} siswa SEDANG NGERJAIN try out ini sekarang. Kalau dihapus, mereka bakal KE-LOCK di tengah jalan, gak bisa nyelesain, dan XP-nya gak akan masuk. Pertimbangkan tunggu sampai mereka selesai, atau pakai "Nonaktifkan" aja (bukan hapus).`
      : '';

    const konfirmasi = window.prompt(
      `Ketik ulang judul persis buat hapus PERMANEN "${paket.judul}":\n\n` +
      `(Soal-soal & jadwalnya akan hilang. Hasil siswa yang SUDAH SELESAI ngerjain tetap aman tersimpan, cuma gak akan muncul lagi soalnya buat siswa yang belum mulai.)` +
      peringatanBerjalan
    );
    if (konfirmasi !== paket.judul) {
      if (konfirmasi !== null) alert('Judul yang diketik tidak cocok persis -- dibatalkan.');
      return;
    }
    try {
      await deleteDoc(doc(db, 'tryout_paket', paket.id));
      setDaftarTerbit((prev) => prev.filter((p) => p.id !== paket.id));
    } catch (e) {
      console.error('Gagal hapus try out:', e);
      alert('Gagal menghapus.');
    }
  }, []);

  function statusJadwal(paket) {
    const sekarang = new Date();
    if (paket.status !== 'aktif') return { label: '⏸️ Nonaktif', warna: '#9ca3af' };
    if (paket.waktuBuka && sekarang < new Date(paket.waktuBuka)) {
      return { label: `🔒 Belum dibuka (${new Date(paket.waktuBuka).toLocaleString('id-ID')})`, warna: '#d97706' };
    }
    if (paket.waktuTutup && sekarang > new Date(paket.waktuTutup)) {
      return { label: `⏰ Sudah lewat deadline (${new Date(paket.waktuTutup).toLocaleString('id-ID')})`, warna: '#dc2626' };
    }
    return { label: '✅ Aktif, bisa dikerjakan', warna: '#16a34a' };
  }

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

  // ---------------- MODE EDIT: isi form dari paket terbit ----------------
  const mulaiEditPaket = useCallback((p) => {
    setEditPaketId(p.id);
    setEditJudulAsli(p.judul || '');
    setJudulTryOut(p.judul || '');
    setTargetKelas(p.targetKelas || 'Semua');
    setTargetKategori(p.targetKategori || 'Semua');
    setPakaiJadwalBuka(!!p.waktuBuka);
    setWaktuBuka(isoKeDatetimeLocal(p.waktuBuka));
    setPakaiDeadline(!!p.waktuTutup);
    setWaktuTutup(isoKeDatetimeLocal(p.waktuTutup));
    setModeTimer(p.modeTimer || 'total');
    setDurasiTotalMenit(p.durasiTotalMenit || 60);
    // Tebak granularitas dari bentuk subtes aslinya (util teruji) biar
    // radio "Per soal individual" ter-centang sesuai kondisi paket.
    const gran = deteksiGranularitasSubtes(p);
    setGranularitasSubtes(gran || 'mapel');
    if (gran === 'soal') setDurasiPerSoal(p.subtes?.[0]?.durasiMenit || 3);
    const durMap = {};
    (p.subtes || []).forEach((sub) => {
      if ((sub.soalIds || []).length !== 1) durMap[sub.nama] = sub.durasiMenit ?? 30;
    });
    setDurasiSubtes(durMap);
    setAntiCheatAktif(p.antiCheatAktif !== false);
    setWajibKamera(!!p.wajibKamera);
    setSoalAcak(p.soalAcak !== false);
    setTentorPublish(p.tentorId || '');
    setKeranjang(new Map((p.daftarSoal || []).map((soal) => [soal.id, soal])));
    setKeranjangDibuka(true);
    setHasil(null);
    setShowPreview(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const batalkanEdit = useCallback(() => {
    setEditPaketId(null);
    setEditJudulAsli('');
    kosongkanKeranjang();
    setJudulTryOut('');
    setHasil(null);
  }, [kosongkanKeranjang]);

  // ---------------- RESET SESI: biar siswa bisa kerjain ulang ----------------
  const bukaResetSesi = useCallback(async (p) => {
    setResetPaket(p);
    setDaftarSesiReset([]);
    setLoadingSesiReset(true);
    try {
      const [snapSesi, snapSiswa] = await Promise.all([
        getDocs(query(collection(db, 'tryout_sesi'), where('paketId', '==', p.id))),
        getDocs(collection(db, 'students')),
      ]);
      const namaPerStudentId = {};
      snapSiswa.docs.forEach((d) => {
        const s = { id: d.id, ...d.data() };
        namaPerStudentId[s.studentId || s.id] = s.nama || s.studentId || s.id;
      });
      const list = snapSesi.docs.map((d) => ({ id: d.id, ...d.data() }));
      list.sort((a, b) => ((b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0)));
      setDaftarSesiReset(list.map((s) => ({ ...s, namaSiswa: namaPerStudentId[s.studentId] || s.studentId || '?' })));
    } catch (e) {
      console.error('Gagal memuat daftar sesi:', e);
      alert('Gagal memuat daftar sesi: ' + e.message);
    }
    setLoadingSesiReset(false);
  }, []);

  // Inti reset satu sesi (TANPA konfirmasi) -- dipakai tombol per-siswa
  // maupun tombol massal. Urutan kritis (XP -> hapus sesi -> izin)
  // tinggal di services/resetSesiTryOut.js.
  const lakukanResetSesi = useCallback(async (sesi) => {
    const hasilReset = await resetSesiTryOut({
      paketId: resetPaket.id,
      sesiId: sesi.id,
      studentId: sesi.studentId,
      xpFinal: sesi.xpFinal || 0,
    });
    setDaftarSesiReset((lama) => lama.filter((x) => x.id !== sesi.id));
    return hasilReset;
  }, [resetPaket]);

  const resetSatuSesi = useCallback(async (sesi) => {
    if (!resetPaket) return;
    const deadlineLewat = !!resetPaket.waktuTutup && new Date() > new Date(resetPaket.waktuTutup);
    if (!window.confirm(teksKonfirmasiResetSesi({
      namaSiswa: sesi.namaSiswa, xpFinal: sesi.xpFinal || 0, statusSesi: sesi.status, deadlineLewat,
    }))) return;
    setSedangResetSesi(sesi.id);
    try {
      const { xpDikembalikan, izinSampai } = await lakukanResetSesi(sesi);
      catatAudit('tryout.sesi.reset', {
        kategori: KATEGORI.SISWA,
        target: `${sesi.namaSiswa} • ${resetPaket.judul}`,
        detail: { paketId: resetPaket.id, sesiId: sesi.id, xpDikembalikan, izinSampai },
      });
      alert(`✅ ${sesi.namaSiswa} bisa kerjain ulang dari soal nomor 1${xpDikembalikan > 0 ? ` (XP lama ${xpDikembalikan} sudah ditarik balik biar gak dobel)` : ''}, berlaku sampai ${new Date(izinSampai).toLocaleString('id-ID')}.`);
    } catch (e) {
      console.error('Gagal reset sesi:', e);
      alert('Gagal reset sesi: ' + e.message);
    }
    setSedangResetSesi(null);
  }, [resetPaket, lakukanResetSesi]);

  const resetSemuaSesi = useCallback(async () => {
    if (!resetPaket || daftarSesiReset.length === 0) return;
    const totalXp = daftarSesiReset.reduce((a, s) => a + Math.max(0, Number(s.xpFinal) || 0), 0);
    if (!window.confirm(
      `Reset SEMUA ${daftarSesiReset.length} sesi try out "${resetPaket.judul}"?\n\n`
      + '• Semua siswa yang terdaftar di daftar ini bisa kerjain ulang dari soal nomor 1 (izin 3 jam menembus deadline diberi otomatis).\n'
      + `• Total ${totalXp} XP dari pengerjaan lama ditarik balik biar gak dobel.\n`
      + '• Tindakan ini TIDAK bisa dibatalkan.'
    )) return;
    setSedangResetSesi('semua');
    let ok = 0; let gagal = 0;
    for (const sesi of daftarSesiReset) {
      try {
        await lakukanResetSesi(sesi);
        ok += 1;
      } catch (e) {
        console.error('Gagal reset sesi', sesi.id, e);
        gagal += 1;
      }
    }
    catatAudit('tryout.sesi.reset.massal', {
      kategori: KATEGORI.SISWA,
      target: resetPaket.judul,
      detail: { paketId: resetPaket.id, berhasil: ok, gagal },
    });
    alert(gagal === 0
      ? `✅ ${ok} sesi direset -- siswa bersangkutan bisa kerjain ulang.`
      : `Selesai: ${ok} berhasil, ${gagal} gagal (cek koneksi, ulang lagi kalau perlu).`);
    setSedangResetSesi(null);
  }, [resetPaket, daftarSesiReset, lakukanResetSesi]);

  const handleTerbitkan = async () => {
    if (!judulTryOut.trim()) return alert('Judul try out wajib diisi.');
    if (keranjang.size === 0) return alert('Keranjang masih kosong -- pilih minimal 1 soal dulu.');
    if (pakaiJadwalBuka && !waktuBuka) return alert('Isi tanggal/jam buka, atau matikan opsi jadwal buka.');
    if (pakaiDeadline && !waktuTutup) return alert('Isi tanggal/jam deadline, atau matikan opsi deadline.');
    if (pakaiJadwalBuka && pakaiDeadline && new Date(waktuTutup) <= new Date(waktuBuka)) {
      return alert('Deadline harus SETELAH waktu buka.');
    }

    const soalDipilih = Array.from(keranjang.values());

    setMenerbitkan(true);
    setHasil(null);
    try {
      // Susun struktur subtes kalau mode 'per-subtes' -- 2 granularitas:
      // 'mapel' (lama, kelompokkan per mataPelajaran, cocok gaya UTBK)
      // atau 'soal' (BARU, 1 subtes = 1 soal, buat kasus "X menit per
      // soal" yang gak bisa direpresentasikan lewat granularitas mapel).
      // 🔥 BARU (2026-10-08): rumus ini dipindah ke util murni
      // bangunSubtesKeranjang (utils/seksiNaskahTryOut.js) supaya tombol
      // cetak di panel keranjang menampilkan struktur yang SAMA persis
      // dengan yang disimpan tombol ini, dan rumusnya bisa diuji Node.
      const subtes = bangunSubtesKeranjang(soalDipilih, { modeTimer, granularitasSubtes, durasiPerSoal, durasiSubtes });

      const payload = {
        judul: judulTryOut.trim(),
        status: 'aktif',
        targetKelas,
        targetKategori,
        // Soal disimpan APA ADANYA (skema Bank Soal asli) -- lihat
        // catatan di kepala file kenapa TIDAK dikonversi ke quizData.
        daftarSoal: soalDipilih,
        totalSoal: soalDipilih.length,
        modeTimer, // 'total' | 'per-subtes'
        durasiTotalMenit: modeTimer === 'total' ? Number(durasiTotalMenit) || 60 : null,
        subtes, // dipakai kalau modeTimer === 'per-subtes'
        antiCheatAktif,
        wajibKamera: antiCheatAktif ? wajibKamera : false,
        soalAcak,
        // 🔥 BARU: jadwal buka & deadline -- disimpan sebagai ISO string
        // (bukan Firestore Timestamp) biar gampang dibandingkan langsung
        // pakai `new Date()` di sisi siswa tanpa nunggu resolve dulu.
        // null = gak ada batasan (langsung bisa dikerjakan / gak ada deadline).
        waktuBuka: pakaiJadwalBuka ? new Date(waktuBuka).toISOString() : null,
        waktuTutup: pakaiDeadline ? new Date(waktuTutup).toISOString() : null,
        dibuatOleh: 'admin',
        // ── Tentor terhubung (opsional) ──
        tentorId: tentorPublish || null,
        tentorNama: (daftarGuru.find((g)=>g.id===tentorPublish)?.nama) || null,
        tentorDihubungkanPada: tentorPublish ? new Date().toISOString() : null,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      // ── MODE EDIT (BARU 2026-10-08): simpan ke dokumen yang SAMA ──
      // bukan addDoc paket baru. Konsekuensi yang dijelaskan jujur ke
      // admin lewat konfirmasi: siswa yang BELUM mulai melihat susunan
      // & jadwal baru; hasil siswa yang SUDAH selesai TIDAK dihitung
      // ulang; siswa yang SEDANG mengerjakan jawabannya aman (posisi
      // subtesnya disesuaikan otomatis oleh TryOutView.jsx).
      if (editPaketId) {
        let jumlahBerjalan = 0;
        try {
          const snapBerjalan = await getDocs(query(
            collection(db, 'tryout_sesi'),
            where('paketId', '==', editPaketId),
            where('status', '==', 'berjalan'),
          ));
          jumlahBerjalan = snapBerjalan.size;
        } catch (eCek) {
          console.warn('Gagal cek sesi berjalan (dilanjutkan tanpa angka):', eCek);
        }
        const peringatanBerjalan = jumlahBerjalan > 0
          ? `\n\n⚠️ ${jumlahBerjalan} siswa SEDANG mengerjakan sekarang. Jawaban tersimpan mereka aman; posisi subtesnya disesuaikan otomatis oleh aplikasi.`
          : '';
        if (!window.confirm(
          `Simpan perubahan ke try out terbit "${editJudulAsli}"?\n\n`
          + 'Siswa yang belum mulai akan melihat susunan & jadwal yang baru. '
          + 'Hasil siswa yang sudah selesai tetap tersimpan apa adanya (tidak dihitung ulang).'
          + peringatanBerjalan
        )) {
          setMenerbitkan(false);
          return;
        }
        const payloadUpdate = { ...payload };
        delete payloadUpdate.createdAt; // createdAt paket lama jangan tertimpa
        await updateDoc(doc(db, 'tryout_paket', editPaketId), payloadUpdate);
        catatAudit('tryout.paket.edit', {
          kategori: KATEGORI.KONTEN,
          target: judulTryOut.trim(),
          detail: {
            paketId: editPaketId, judulLama: editJudulAsli, totalSoal: soalDipilih.length, modeTimer,
          },
        });
        setHasil({ success: true, message: `Perubahan try out "${judulTryOut.trim()}" tersimpan ke paket yang sudah terbit.` });
        setEditPaketId(null);
        setEditJudulAsli('');
        setJudulTryOut('');
        kosongkanKeranjang();
        muatDaftarTerbit();
        setMenerbitkan(false);
        return;
      }

      const docRef = await addDoc(collection(db, 'tryout_paket'), payload);

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
          type: 'tryout',
          title: '🎯 Try Out Baru!',
          message: `"${judulTryOut}" (${soalDipilih.length} soal) sudah bisa dikerjakan.`,
          link: '/siswa/tryout',
        });
      }

      setHasil({
        success: true,
        message: `Try Out "${judulTryOut}" berhasil diterbitkan (${soalDipilih.length} soal, ${modeTimer === 'total' ? `${durasiTotalMenit} menit total` : `${subtes.length} subtes`}) ke ${penerimaIds.length} siswa.`,
      });
      setJudulTryOut('');
      setPakaiJadwalBuka(false);
      setWaktuBuka('');
      setPakaiDeadline(false);
      setWaktuTutup('');
      kosongkanKeranjang();
      muatDaftarTerbit();
      console.log('[TryOut] Paket diterbitkan:', docRef.id);
    } catch (e) {
      console.error('Gagal menerbitkan try out:', e);
      setHasil({ success: false, message: 'Gagal menerbitkan: ' + e.message });
    }
    setMenerbitkan(false);
  };

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: `24px 16px ${keranjang.size === 0 ? 24 : keranjangDibuka ? 200 : 70}px`, fontFamily: 'sans-serif' }}>
      {/* 🔥 BARU (2026-10): toast konfirmasi JUJUR tombol "＋ 1 Folder" --
          bilang berapa soal yang benar-benar baru masuk, berapa yang
          memang sudah ada, dan berapa yang dilewati karena tipe belum
          didukung. Hilang sendiri setelah 4,5 detik. */}
      {infoTambah && (
        <div style={{ position: 'fixed', top: 12, left: '50%', transform: 'translateX(-50%)', backgroundColor: '#16a34a', color: 'white', padding: '10px 16px', borderRadius: 10, fontSize: 12.5, fontWeight: 700, zIndex: 80, boxShadow: '0 4px 14px rgba(0,0,0,0.18)', maxWidth: '90vw', textAlign: 'center' }}>
          {infoTambah}
        </div>
      )}
      <button onClick={() => navigate('/admin/bank-soal')} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', color: '#6b7280', cursor: 'pointer', marginBottom: 16, fontSize: 13 }}>
        <ArrowLeft size={16} /> Kembali ke Bank Soal
      </button>

      <h1 style={{ fontSize: 22, fontWeight: 800, color: '#1e293b', margin: '0 0 4px' }}>🎯 Terbitkan Try Out</h1>
      <p style={{ color: '#6b7280', fontSize: 13, marginBottom: 20 }}>
        Try out formal -- timer ketat, anti-cheat kamera, skor proporsional buat PG Kompleks & Benar/Salah. Terpisah dari sistem Kuis guru.
      </p>

      {/* 🔥 BARU: daftar try out yang udah diterbitkan -- jawaban buat
          "abis diterbitkan gak tau kemana". Bisa lihat status jadwalnya
          (belum dibuka/aktif/lewat deadline) & nonaktifkan kalau perlu. */}
      <div style={{ marginBottom: 24, border: '1px solid #e5e7eb', borderRadius: 10, padding: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
          <div style={{ fontSize: 13, fontWeight: 800, color: '#374151' }}>📋 Try Out yang Sudah Diterbitkan</div>
          <button onClick={muatDaftarTerbit} style={{ fontSize: 11, padding: '4px 10px', borderRadius: 6, border: '1px solid #e5e7eb', background: 'white', cursor: 'pointer', color: '#6b7280' }}>
            Muat Ulang
          </button>
        </div>
        {loadingDaftarTerbit ? (
          <Loader2 size={16} className="spin" />
        ) : daftarTerbit.length === 0 ? (
          <div style={{ fontSize: 12, color: '#9ca3af' }}>Belum ada try out yang diterbitkan.</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 260, overflowY: 'auto' }}>
            {daftarTerbit.map((p) => {
              const st = statusJadwal(p);
              return (
                <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', borderRadius: 8, background: '#f9fafb' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 12.5, fontWeight: 700, color: '#1e293b' }}>{p.judul}</div>
                    <div style={{ fontSize: 11, color: '#9ca3af' }}>
                      {p.totalSoal} soal · {p.targetKelas} · {p.targetKategori} · {p.modeTimer === 'total' ? `${p.durasiTotalMenit} menit` : `${p.subtes?.length || 0} subtes`}
                    </div>
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 700, color: st.warna, whiteSpace: 'nowrap' }}>{st.label}</span>
                  {/* 🔥 BARU (2026-10-08, permintaan owner: "selain terbit
                      ke siswa aku mau kasih tombol print soal yang udah
                      di tata ... tinggal print"): satu klik dari kartu
                      paket terbit membuka dialog naskah model ujian dua
                      kolom -- tidak perlu lagi ke halaman guru lalu pilih
                      ulang soal dari bank. */}
                  <button
                    onClick={() => setCetakInput(p)}
                    title="Cetak naskah paket ini (dua kolom rapi, tinggal pilih kertas lalu print)"
                    style={{ fontSize: 11, padding: '4px 10px', borderRadius: 6, border: '1px solid #bfdbfe', background: '#eff6ff', cursor: 'pointer', color: '#1d4ed8', whiteSpace: 'nowrap', display: 'inline-flex', alignItems: 'center', gap: 4 }}
                  >
                    <Printer size={12} /> Print
                  </button>
                  {/* 🔥 BARU (2026-10-08): jawab keluhan owner "cara edit
                      tryout yang terbit gimana?" & "mengembalikan soal dan
                      poin XP anak biar bisa kerjain ulang" -- dua tombol
                      ini dulu tidak ada sama sekali. */}
                  <button
                    onClick={() => mulaiEditPaket(p)}
                    title="Edit judul, jadwal, mode timer, susunan soal paket terbit ini"
                    style={{ fontSize: 11, padding: '4px 10px', borderRadius: 6, border: '1px solid #c7d2fe', background: '#eef2ff', cursor: 'pointer', color: '#4338ca', whiteSpace: 'nowrap', display: 'inline-flex', alignItems: 'center', gap: 4 }}
                  >
                    <Pencil size={12} /> Edit
                  </button>
                  <button
                    onClick={() => bukaResetSesi(p)}
                    title="Lihat siapa saja yang sudah/ sedang mengerjakan; reset supaya bisa kerjain ulang + XP lama ditarik balik"
                    style={{ fontSize: 11, padding: '4px 10px', borderRadius: 6, border: '1px solid #fde68a', background: '#fffbeb', cursor: 'pointer', color: '#b45309', whiteSpace: 'nowrap', display: 'inline-flex', alignItems: 'center', gap: 4 }}
                  >
                    <RotateCcw size={12} /> Kerjain Ulang
                  </button>
                  {/* Ganti/hubungkan tentor untuk paket terbit */}
                  <select
                    value={p.tentorId || ''}
                    title="Tentor pemantau try out ini"
                    onChange={async (e) => {
                      const baru = e.target.value;
                      const guru = daftarGuru.find((g) => g.id === baru);
                      try {
                        await updateDoc(doc(db, 'tryout_paket', p.id), {
                          tentorId: baru || null,
                          tentorNama: guru?.nama || null,
                          tentorDihubungkanPada: baru ? new Date().toISOString() : null,
                          updatedAt: serverTimestamp(),
                        });
                        catatAudit(baru ? 'tryout.tentor.hubung' : 'tryout.tentor.lepas', {
                          kategori: KATEGORI.LAINNYA,
                          target: p.judul,
                          detail: { paketId: p.id, tentor: guru?.nama || null, tentorId: baru || null },
                        });
                        setDaftarTerbit((lama) => lama.map((x) => (x.id === p.id ? { ...x, tentorId: baru || null, tentorNama: guru?.nama || null } : x)));
                      } catch (err) { alert('Gagal memperbarui tentor: ' + err.message); }
                    }}
                    style={{ fontSize: 10.5, padding: '3px 6px', borderRadius: 6, border: '1px solid #d1d5db', background: p.tentorId ? '#eef2ff' : 'white', maxWidth: 140 }}
                  >
                    <option value="">🔗 Tanpa tentor</option>
                    {daftarGuru.map((g) => (<option key={g.id} value={g.id}>{g.nama}</option>))}
                  </select>
                  <button
                    onClick={() => nonaktifkanTryOut(p)}
                    style={{ fontSize: 11, padding: '4px 10px', borderRadius: 6, border: '1px solid #e5e7eb', background: 'white', cursor: 'pointer', color: p.status === 'aktif' ? '#dc2626' : '#16a34a', whiteSpace: 'nowrap' }}
                  >
                    {p.status === 'aktif' ? 'Nonaktifkan' : 'Aktifkan'}
                  </button>
                  <button
                    onClick={() => hapusTryOut(p)}
                    style={{ fontSize: 11, padding: '4px 10px', borderRadius: 6, border: '1px solid #fca5a5', background: '#fef2f2', cursor: 'pointer', color: '#b91c1c', whiteSpace: 'nowrap' }}
                  >
                    Hapus
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ---------------- TAB SWITCHER ---------------- */}
      <div style={{ display: 'flex', gap: 4, borderBottom: '1px solid #e5e7eb', marginBottom: 16 }}>
        <button onClick={() => setTab('folder')} style={tab === 'folder' ? tabAktif : tabPasif}>📁 Jelajah per Folder</button>
        <button onClick={() => setTab('cari')} style={tab === 'cari' ? tabAktif : tabPasif}>🔍 Cari Bebas</button>
        <button onClick={() => setTab('bucket')} style={tab === 'bucket' ? tabAktif : tabPasif}>✨ Bucket Otomatis (Kisi-Kisi)</button>
        <button onClick={() => setTab('kelemahan')} style={tab === 'kelemahan' ? tabAktif : tabPasif}>🎯 Kelemahan Kelas</button>
      </div>

      {/* ---------------- TAB: JELAJAH PER FOLDER ---------------- */}
      {tab === 'folder' && (
        <div style={{ marginBottom: 16 }}>
          {loadingFolder ? (
            <Loader2 size={18} className="spin" />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {/* 🔥 BARU: "folder virtual" buat soal lama dari SEBELUM
                  sistem Folder Sumber ada -- biar bisa ketemu lagi,
                  bukan ngilang selamanya cuma karena gak kesimpen di
                  folder mana pun. */}
              <div style={{ border: '1px dashed #a78bfa', borderRadius: 10, overflow: 'hidden', background: '#faf5ff' }}>
                <div
                  onClick={() => bukaFolder('__tanpa_folder__')}
                  style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px', cursor: 'pointer' }}
                >
                  {folderDibuka === '__tanpa_folder__' ? <FolderOpen size={18} color="#7c3aed" /> : <Folder size={18} color="#a78bfa" />}
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#6d28d9' }}>📄 Soal Tanpa Folder</div>
                    <div style={{ fontSize: 11, color: '#9ca3af' }}>Soal lama dari sebelum sistem Folder Sumber ada</div>
                  </div>
                  {/* 🔥 BARU (2026-10): sekali klik = SEMUA soal masuk keranjang */}
                  <button
                    onClick={(e) => { e.stopPropagation(); masukkanSemuaFolder('__tanpa_folder__'); }}
                    disabled={folderSedangDimuat === '__tanpa_folder__'}
                    title="Masukkan SEMUA soal tanpa folder ke keranjang sekali klik"
                    style={{ fontSize: 11, padding: '6px 10px', borderRadius: 8, border: '1px solid #7c3aed', backgroundColor: '#7c3aed', color: 'white', fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' }}
                  >
                    {folderSedangDimuat === '__tanpa_folder__' ? 'Memuat…' : '🛒 ＋ 1 Folder'}
                  </button>
                  {folderDibuka === '__tanpa_folder__' ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                </div>
                {folderDibuka === '__tanpa_folder__' && (
                  <div style={{ padding: '10px 14px 14px 40px', borderTop: '1px solid #ede9fe' }}>
                    {loadingSoalFolder && !cacheSoalFolder['__tanpa_folder__'] ? (
                      <Loader2 size={16} className="spin" />
                    ) : babDalamFolder.length === 0 ? (
                      <div style={{ fontSize: 12, color: '#9ca3af' }}>Gak ada soal tanpa folder -- semua soal udah kesimpen rapi di folder masing-masing.</div>
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
                              style={{ fontSize: 11, padding: '4px 10px', borderRadius: 6, border: '1px solid #7c3aed', backgroundColor: 'white', color: '#6d28d9', fontWeight: 700, cursor: 'pointer' }}
                            >
                              + Tambah Semua
                            </button>
                          </div>
                          {babDibuka === bab && (
                            <div style={{ padding: '6px 10px 6px 24px', display: 'flex', flexDirection: 'column', gap: 4 }}>
                              {soal.map((s) => {
                                const dipilih = keranjang.has(s.id);
                                const didukung = tipeDidukung(s);
                                return (
                                  <label key={s.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 12, cursor: didukung ? 'pointer' : 'not-allowed', opacity: didukung ? 1 : 0.55 }}>
                                    <input type="checkbox" checked={dipilih} disabled={!didukung} onChange={() => toggleKeranjang(s)} style={{ marginTop: 2 }} />
                                    <span style={{ color: didukung ? '#374151' : '#dc2626' }}>
                                      <BadgeMapel mapel={s.mataPelajaran} />
                                      {(s.soal || s.teks_soal || '').slice(0, 100)}{(s.soal || s.teks_soal || '').length > 100 ? '...' : ''}
                                      {!didukung && ' — ⚠️ tipe belum didukung'}
                                      {didukung && s.kunciTerverifikasi === false && ' — ⚠️ kunci hasil AI, belum diverifikasi'}
                                    </span>
                                  </label>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>

              {daftarFolder.length === 0 ? (
                <div style={{ padding: 20, textAlign: 'center', color: '#9ca3af', fontSize: 13, border: '1px dashed #d1d5db', borderRadius: 10 }}>
                  Belum ada Folder Sumber lain. Buat lewat halaman "Import Hasil Scan AI" (panel 📁 Folder Sumber).
                </div>
              ) : (
              daftarFolder.map((f) => (
                <div key={f.id} style={{ border: '1px solid #e5e7eb', borderRadius: 10, overflow: 'hidden' }}>
                  <div
                    onClick={() => bukaFolder(f.id)}
                    style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px', cursor: 'pointer', backgroundColor: folderDibuka === f.id ? '#f5f3ff' : 'white' }}
                  >
                    {folderDibuka === f.id ? <FolderOpen size={18} color="#7c3aed" /> : <Folder size={18} color="#9ca3af" />}
                    {f.coverUrl && <img src={f.coverUrl} alt="" style={{ width: 28, height: 36, objectFit: 'cover', borderRadius: 3 }} />}
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: '#1e293b' }}>{f.judul}</div>
                      <div style={{ fontSize: 11, color: '#9ca3af' }}>{f.mataPelajaran} · {f.jenisUjian} · {f.jenjang} · {f.jumlahSoal || 0} soal</div>
                    </div>
                    {/* 🔥 BARU (2026-10, permintaan owner "bisa gak
                        langsung satu folder"): tombol ini masukan SEMUA
                        soal folder ke keranjang SEKALI KLIK -- gak perlu
                        buka folder lalu klik "＋ Tambah Semua" per bab.
                        stopPropagation biar foldernya gak ikut terbuka/
                        tertutup pas tombol dipencet. */}
                    <button
                      onClick={(e) => { e.stopPropagation(); masukkanSemuaFolder(f.id); }}
                      disabled={folderSedangDimuat === f.id}
                      title="Masukkan SEMUA soal folder ini ke keranjang sekali klik"
                      style={{ fontSize: 11, padding: '6px 10px', borderRadius: 8, border: '1px solid #7c3aed', backgroundColor: '#7c3aed', color: 'white', fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' }}
                    >
                      {folderSedangDimuat === f.id ? 'Memuat…' : '🛒 ＋ 1 Folder'}
                    </button>
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
                                style={{ fontSize: 11, padding: '4px 10px', borderRadius: 6, border: '1px solid #7c3aed', backgroundColor: 'white', color: '#6d28d9', fontWeight: 700, cursor: 'pointer' }}
                              >
                                + Tambah Semua
                              </button>
                            </div>
                            {babDibuka === bab && (
                              <div style={{ padding: '6px 10px 6px 24px', display: 'flex', flexDirection: 'column', gap: 4 }}>
                                {soal.map((s) => {
                                  const dipilih = keranjang.has(s.id);
                                  const didukung = tipeDidukung(s);
                                  return (
                                    <label key={s.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 12, cursor: didukung ? 'pointer' : 'not-allowed', opacity: didukung ? 1 : 0.55 }}>
                                      <input type="checkbox" checked={dipilih} disabled={!didukung} onChange={() => toggleKeranjang(s)} style={{ marginTop: 2 }} />
                                      <span style={{ color: didukung ? '#374151' : '#dc2626' }}>
                                        <BadgeMapel mapel={s.mataPelajaran} />
                                        {(s.soal || s.teks_soal || '').slice(0, 100)}{(s.soal || s.teks_soal || '').length > 100 ? '...' : ''}
                                        {!didukung && ' — ⚠️ tipe belum didukung'}
                                      {didukung && s.kunciTerverifikasi === false && ' — ⚠️ kunci hasil AI, belum diverifikasi'}
                                      </span>
                                    </label>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>
              ))
              )}
            </div>
          )}
        </div>
      )}

      {/* ---------------- TAB: BUCKET OTOMATIS ---------------- */}
      {tab === 'bucket' && (
        <div style={{ marginBottom: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ backgroundColor: '#f5f3ff', border: '1px solid #ddd6fe', borderRadius: 10, padding: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 700, fontSize: 13, color: '#6b21a8', marginBottom: 4 }}>
              <Sparkles size={15} /> Bucket Otomatis
            </div>
            <p style={{ fontSize: 12, color: '#7e22ce', marginBottom: 12 }}>
              Gak perlu hafal nama materi satu-satu -- pilih kelas, tempel daftar bab/materi dari kisi-kisi resmi TKA (1 topik per baris, boleh langsung copas, anotasi seperti "Sering muncul" otomatis dibuang), lalu isi target jumlah soal. Sistem cari sendiri lintas semua folder & bagi rata per topik.
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
              style={{ ...inputStyle, width: '100%', fontFamily: 'monospace', fontSize: 12, resize: 'vertical', boxSizing: 'border-box' }}
            />
            <button onClick={cariBucketOtomatis} disabled={loadingBucket} style={{ ...btnPrimary, marginTop: 10 }}>
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

      {/* ---------------- TAB: KELEMAHAN KELAS ---------------- */}
      {tab === 'kelemahan' && (
        <div style={{ marginBottom: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ backgroundColor: '#fff7ed', border: '1px solid #fed7aa', borderRadius: 10, padding: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 700, fontSize: 13, color: '#9a3412', marginBottom: 4 }}>
              🎯 Kelemahan Kelas
            </div>
            <p style={{ fontSize: 12, color: '#c2410c', marginBottom: 12 }}>
              Dihitung dari data Latihan Harian SEMUA siswa yang cocok "Target Kelas: <b>{targetKelas}</b>" & "Target Kategori: <b>{targetKategori}</b>" di bawah -- ganti dulu di situ kalau mau ngecek kelas lain.
            </p>
            <button
              onClick={cekKelemahanKelas}
              disabled={sedangMuatKelemahan}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '9px 16px', borderRadius: 8, border: 'none', background: '#ea580c', color: 'white', fontWeight: 700, fontSize: 12.5, cursor: 'pointer' }}
            >
              {sedangMuatKelemahan ? 'Menghitung...' : '🔎 Cek Kelemahan Kelas Ini'}
            </button>
          </div>

          {daftarKelemahan !== null && (
            daftarKelemahan.length === 0 ? (
              <div style={{ padding: 20, textAlign: 'center', color: '#9ca3af', fontSize: 13, border: '1px dashed #d1d5db', borderRadius: 10 }}>
                Belum ada data Latihan Harian yang cukup buat kelas/kategori ini (atau belum ada siswa yang cocok). Coba lagi nanti setelah siswa lebih banyak latihan.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {daftarKelemahan.map((item) => (
                  <div key={`${item.mapel}-${item.materi}`} style={{ display: 'flex', alignItems: 'center', gap: 10, border: '1px solid #e5e7eb', borderRadius: 10, padding: '10px 14px' }}>
                    <BadgeMapel mapel={item.mapel} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: '#1e293b' }}>{item.materi}</div>
                      <div style={{ fontSize: 11, color: '#9ca3af' }}>{item.dicoba} kali dicoba (gabungan seluruh siswa)</div>
                    </div>
                    <div style={{ fontSize: 15, fontWeight: 800, color: item.persentaseBenar < 40 ? '#dc2626' : item.persentaseBenar < 65 ? '#d97706' : '#16a34a' }}>
                      {item.persentaseBenar}% benar
                    </div>
                    <button
                      onClick={() => tambahSoalMateriLemah(item)}
                      disabled={sedangTambahMateri === item.materi}
                      style={{ fontSize: 11.5, padding: '6px 12px', borderRadius: 8, border: '1px solid #ea580c', background: '#fff7ed', color: '#9a3412', fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' }}
                    >
                      {sedangTambahMateri === item.materi ? 'Menambah...' : '+ Tambah ke Keranjang'}
                    </button>
                  </div>
                ))}
              </div>
            )
          )}
        </div>
      )}

      {/* ---------------- TAB: CARI BEBAS ---------------- */}
      {tab === 'cari' && (
      <div style={{ border: '1px solid #e5e7eb', borderRadius: 10, padding: 14, marginBottom: 16 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 8, marginBottom: 10 }}>
          <input placeholder="Mata pelajaran" value={filterMapel} onChange={(e) => setFilterMapel(e.target.value)} style={inputStyle} />
          <input placeholder="Jenis ujian (mis. TKA)" value={filterJenisUjian} onChange={(e) => setFilterJenisUjian(e.target.value)} style={inputStyle} />
          <input placeholder="Kelas" value={filterKelas} onChange={(e) => setFilterKelas(e.target.value)} style={inputStyle} />
          <input placeholder="Materi (cari kata kunci)" value={filterMateri} onChange={(e) => setFilterMateri(e.target.value)} style={inputStyle} />
        </div>
        <button onClick={cariSoal} disabled={loadingSoal} style={btnPrimary}>
          {loadingSoal ? <Loader2 size={15} className="spin" /> : <ListChecks size={15} />}
          {loadingSoal ? 'Mencari...' : 'Cari Soal'}
        </button>

        {sudahCari && !loadingSoal && (
          <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 340, overflowY: 'auto' }}>
            {daftarSoal.length === 0 ? (
              <div style={{ fontSize: 12, color: '#9ca3af' }}>Tidak ada soal yang cocok dengan filter ini.</div>
            ) : (
              daftarSoal.map((s) => {
                const dipilih = keranjang.has(s.id);
                const didukung = tipeDidukung(s);
                return (
                  <label key={s.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '8px 10px', borderRadius: 8, background: !didukung ? '#f1f5f9' : dipilih ? '#f5f3ff' : '#f9fafb', cursor: didukung ? 'pointer' : 'not-allowed', opacity: didukung ? 1 : 0.6 }}>
                    <input type="checkbox" checked={dipilih} disabled={!didukung} onChange={() => toggleKeranjang(s)} style={{ marginTop: 3 }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 11, color: didukung ? '#9ca3af' : '#dc2626', marginBottom: 2, fontWeight: didukung ? 400 : 700 }}>
                        {s.mataPelajaran} · {s.tipe || 'pg_sederhana'} · {s.materi || '-'}
                        {!didukung && ' · ⚠️ Tipe ini belum didukung di Try Out'}
                                {didukung && s.kunciTerverifikasi === false && ' · ⚠️ Kunci hasil AI, belum diverifikasi'}
                      </div>
                      <div style={{ fontSize: 12.5, color: '#1e293b' }}>{(s.soal || s.teks_soal || '').slice(0, 140)}{(s.soal || s.teks_soal || '').length > 140 ? '...' : ''}</div>
                    </div>
                  </label>
                );
              })
            )}
          </div>
        )}
      </div>
      )}

      {/* ---------------- KERANJANG + KONFIG ---------------- */}
      {keranjang.size > 0 && (
        <div style={{
          position: 'fixed', bottom: 0, left: 0, right: 0, backgroundColor: 'white',
          borderTop: '2px solid #7c3aed', boxShadow: '0 -4px 16px rgba(0,0,0,0.08)',
          padding: keranjangDibuka ? '16px 24px' : '10px 24px', zIndex: 50,
          maxHeight: keranjangDibuka ? '70vh' : 'auto', overflowY: keranjangDibuka ? 'auto' : 'visible',
        }}>
          <div style={{ maxWidth: 900, margin: '0 auto' }}>
            <div
              onClick={() => setKeranjangDibuka((v) => !v)}
              style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: keranjangDibuka ? 10 : 0, cursor: 'pointer' }}
            >
              <ShoppingCart size={18} color="#7c3aed" />
              <span style={{ fontWeight: 800, fontSize: 14, color: '#6d28d9' }}>Keranjang: {keranjang.size} soal</span>
              {!keranjangDibuka && (
                <span style={{ fontSize: 11.5, color: '#9ca3af' }}>-- klik buat atur & terbitkan</span>
              )}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  // 🔥 BARU (2026-10-08): cetak naskah LANGSUNG dari keranjang,
                  // sebelum maupun tanpa menerbitkan -- struktur subtes diambil
                  // dari rumus yang SAMA dengan tombol Terbitkan supaya yang
                  // dilihat di pratinjau cetak = yang akan diterima siswa.
                  const soalDipilih = Array.from(keranjang.values());
                  setCetakInput({
                    judul: judulTryOut.trim() || 'Naskah Soal (belum diterbitkan)',
                    targetKelas,
                    targetKategori,
                    daftarSoal: soalDipilih,
                    modeTimer,
                    subtes: bangunSubtesKeranjang(soalDipilih, { modeTimer, granularitasSubtes, durasiPerSoal, durasiSubtes }),
                    soalAcak,
                  });
                }}
                title="Cetak naskah isi keranjang (dua kolom rapi, tinggal pilih kertas lalu print)"
                style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: '#1d4ed8', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 700 }}
              >
                <Printer size={14} /> Print Naskah
              </button>
              <button onClick={(e) => { e.stopPropagation(); setShowPreview(true); }} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: '#0e7490', background: 'none', border: 'none', cursor: 'pointer' }}>
                👁️ Preview
              </button>
              <button onClick={(e) => { e.stopPropagation(); kosongkanKeranjang(); }} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: '#dc2626', background: 'none', border: 'none', cursor: 'pointer' }}>
                <Trash2 size={14} /> Kosongkan
              </button>
              {keranjangDibuka ? <ChevronDown size={16} color="#9ca3af" /> : <ChevronUp size={16} color="#9ca3af" />}
            </div>

            {keranjangDibuka && (
              <>
            {editPaketId && (
              <div style={{ background: '#eef2ff', border: '1px solid #c7d2fe', borderRadius: 10, padding: '10px 12px', marginBottom: 10, fontSize: 12.5, color: '#3730a3', lineHeight: 1.6 }}>
                <div style={{ fontWeight: 800, marginBottom: 2, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Pencil size={14} /> MODE EDIT: paket terbit "{editJudulAsli}"
                </div>
                Perubahan disimpan ke paket YANG SAMA (bukan try out baru). Siswa yang sudah selesai tidak dihitung ulang; siswa yang belum mulai melihat susunan & jadwal yang baru.
                <button onClick={batalkanEdit} style={{ marginLeft: 8, fontSize: 11, padding: '3px 8px', borderRadius: 6, border: '1px solid #c7d2fe', background: 'white', cursor: 'pointer', color: '#4338ca' }}>Batal edit</button>
              </div>
            )}
            <input
              placeholder="Judul try out (mis. Try Out TKA Matematika Paket 1)"
              value={judulTryOut}
              onChange={(e) => setJudulTryOut(e.target.value)}
              style={{ ...inputStyle, width: '100%', marginBottom: 8, boxSizing: 'border-box' }}
            />

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 8, marginBottom: 10 }}>
              <select value={targetKelas} onChange={(e) => setTargetKelas(e.target.value)} style={inputStyle}>
                {availableClasses.map((k) => <option key={k} value={k}>{k === 'Semua' ? 'Semua Kelas' : k}</option>)}
              </select>
              <select value={targetKategori} onChange={(e) => setTargetKategori(e.target.value)} style={inputStyle}>
                <option value="Semua">Semua Program</option>
                <option value="Reguler">Reguler</option>
                <option value="English">English</option>
              </select>
            </div>

            {/* 🔥 BARU: jadwal buka & deadline -- sebelumnya gak ada sama
                sekali, jadi try out langsung kebuka begitu diterbitkan
                dan gak pernah tertutup otomatis. */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14, alignItems: 'center', padding: '8px 10px', backgroundColor: '#f9fafb', borderRadius: 8, marginBottom: 10 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#374151' }}>
                <input type="checkbox" checked={pakaiJadwalBuka} onChange={(e) => setPakaiJadwalBuka(e.target.checked)} />
                🔓 Jadwal buka
              </label>
              {pakaiJadwalBuka && (
                <input type="datetime-local" value={waktuBuka} onChange={(e) => setWaktuBuka(e.target.value)} style={inputStyle} />
              )}
              <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#374151' }}>
                <input type="checkbox" checked={pakaiDeadline} onChange={(e) => setPakaiDeadline(e.target.checked)} />
                ⏰ Deadline
              </label>
              {pakaiDeadline && (
                <input type="datetime-local" value={waktuTutup} onChange={(e) => setWaktuTutup(e.target.value)} style={inputStyle} />
              )}
              {!pakaiJadwalBuka && !pakaiDeadline && (
                <span style={{ fontSize: 11, color: '#9ca3af' }}>Kosong = langsung bisa dikerjakan kapan aja, gak ada batas akhir.</span>
              )}
            </div>

            {/* 🔥 MODE TIMER -- 2 pilihan sesuai keputusan yang sudah dikonfirmasi */}
            <div style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: 10, marginBottom: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 700, color: '#374151', marginBottom: 8 }}>
                <Timer size={14} /> Mode Timer
              </div>
              <div style={{ display: 'flex', gap: 16, marginBottom: modeTimer === 'per-subtes' ? 10 : 0 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12.5 }}>
                  <input type="radio" checked={modeTimer === 'total'} onChange={() => setModeTimer('total')} /> Total keseluruhan
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12.5 }}>
                  <input type="radio" checked={modeTimer === 'per-subtes'} onChange={() => setModeTimer('per-subtes')} /> Per-subtes (kayak UTBK/TKA asli)
                </label>
              </div>

              {modeTimer === 'total' ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <input type="number" min={1} value={durasiTotalMenit} onChange={(e) => setDurasiTotalMenit(e.target.value)} style={{ ...inputStyle, width: 90 }} />
                  <span style={{ fontSize: 12, color: '#6b7280' }}>menit, buat semua {keranjang.size} soal <b>SEKALIGUS</b> (bukan per soal)</span>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {/* 🔥 BARU: pilih granularitas dulu -- ini yang bikin
                      bug "waktu habis malah semua ke-submit" kemarin
                      kejadian, karena admin pengen "per soal" tapi UI-nya
                      cuma nyediain "per mapel". */}
                  <div style={{ display: 'flex', gap: 14 }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
                      <input type="radio" checked={granularitasSubtes === 'mapel'} onChange={() => setGranularitasSubtes('mapel')} /> Per mata pelajaran (gaya UTBK)
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
                      <input type="radio" checked={granularitasSubtes === 'soal'} onChange={() => setGranularitasSubtes('soal')} /> Per soal individual
                    </label>
                  </div>

                  {granularitasSubtes === 'soal' ? (
                    <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 8, padding: 10 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                        <input type="number" min={1} value={durasiPerSoal} onChange={(e) => setDurasiPerSoal(e.target.value)} style={{ ...inputStyle, width: 80 }} />
                        <span style={{ fontSize: 12, color: '#92400e' }}>menit <b>PER SOAL</b> -- berlaku sama rata ke semua {keranjang.size} soal</span>
                      </div>
                      <div style={{ fontSize: 11, color: '#b45309' }}>
                        ⏱️ Abis waktu di 1 soal, OTOMATIS lanjut ke soal berikutnya -- siswa TIDAK BISA balik ke soal sebelumnya. Total waktu try out ini: {(Number(durasiPerSoal) || 0) * keranjang.size} menit.
                      </div>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11.5, color: '#9ca3af', marginBottom: 2 }}>
                        <Layers size={13} /> Subtes otomatis dikelompokkan per mata pelajaran -- atur durasinya:
                      </div>
                      {daftarMapelDiKeranjang.map((mapel) => (
                        <div key={mapel} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ fontSize: 12.5, color: '#374151', width: 140, flexShrink: 0 }}>{mapel}</span>
                          <input
                            type="number" min={1}
                            value={durasiSubtes[mapel] ?? 30}
                            onChange={(e) => setDurasiSubtes((prev) => ({ ...prev, [mapel]: e.target.value }))}
                            style={{ ...inputStyle, width: 80 }}
                          />
                          <span style={{ fontSize: 11.5, color: '#9ca3af' }}>menit, buat SEMUA soal {mapel} sekaligus (bukan per soal)</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* 🔥 ANTI-CHEAT */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14, alignItems: 'center', padding: '8px 10px', backgroundColor: '#f9fafb', borderRadius: 8, marginBottom: 12 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#374151' }}>
                <input type="checkbox" checked={antiCheatAktif} onChange={(e) => setAntiCheatAktif(e.target.checked)} />
                <ShieldAlert size={13} /> Deteksi kecurangan (tab/fullscreen)
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: antiCheatAktif ? '#374151' : '#cbd5e1' }}>
                <input type="checkbox" checked={wajibKamera} disabled={!antiCheatAktif} onChange={(e) => setWajibKamera(e.target.checked)} />
                <Camera size={13} /> Wajib kamera (foto acak selama try out)
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#374151' }}>
                <input type="checkbox" checked={soalAcak} onChange={(e) => setSoalAcak(e.target.checked)} />
                <ListChecks size={13} /> Acak urutan soal (beda tiap siswa)
              </label>
            </div>

            {/* ── HUBUNGKAN TENTOR (dipinta owner 2026-10): tentor terpilih
                dapat banner pemantauan di dashboard guru (lihat, soal, jawaban,
                skor, menilai esai) untuk paket ini. ── */}
            <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:10 }}>
              <span style={{ fontSize:12, fontWeight:700, color:'#334155', whiteSpace:'nowrap' }}>🔗 Konekkan dengan tentor (opsional)</span>
              <select value={tentorPublish} onChange={(e)=>setTentorPublish(e.target.value)}
                      style={{ flex:1, maxWidth:320, padding:'7px 10px', borderRadius:6, border:'1px solid #d1d5db', fontSize:12 }}>
                <option value="">— Tidak terhubung —</option>
                {daftarGuru.map((g)=>(<option key={g.id} value={g.id}>{g.nama}</option>))}
              </select>
              <span style={{ fontSize:10.5, color:'#94a3b8' }}>Tentor bisa memantau & menilai try out ini dari dashboardnya</span>
            </div>
            <button
              onClick={handleTerbitkan}
              disabled={menerbitkan}
              style={editPaketId ? { ...btnPrimary, backgroundColor: '#4338ca' } : btnPrimary}
            >
              {menerbitkan ? <Loader2 size={15} className="spin" /> : (editPaketId ? <CheckCircle2 size={15} /> : <Send size={15} />)}
              {menerbitkan
                ? (editPaketId ? 'Menyimpan perubahan...' : 'Menerbitkan...')
                : (editPaketId ? `Simpan Perubahan (${keranjang.size} soal)` : `Terbitkan ${keranjang.size} Soal ke Siswa`)}
            </button>
            {editPaketId && (
              <button
                onClick={batalkanEdit}
                style={{ ...btnPrimary, backgroundColor: '#fff', color: '#4338ca', border: '1px solid #c7d2fe', marginLeft: 8 }}
              >
                Batal edit
              </button>
            )}
              </>
            )}
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

      {/* 🔥 BARU: modal preview -- render SEMUA soal di keranjang pakai
          komponen yang sama persis dipakai siswa. Kunci jawaban yang
          benar ikut ditandai hijau (mode tinjau), jadi sekalian bisa
          dipakai buat CEK ULANG kunci jawabannya bener sebelum
          diterbitkan ke siswa asli. */}
      {showPreview && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 100, display: 'flex', justifyContent: 'center', padding: '24px 16px', overflowY: 'auto' }}>
          <div style={{ background: 'white', borderRadius: 16, maxWidth: 720, width: '100%', height: 'fit-content', padding: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <div style={{ fontWeight: 800, fontSize: 16, color: '#1e293b' }}>👁️ Preview {keranjang.size} Soal</div>
              <button onClick={() => setShowPreview(false)} style={{ border: 'none', background: '#f1f5f9', borderRadius: 8, padding: '6px 12px', cursor: 'pointer', fontSize: 12, fontWeight: 700 }}>Tutup</button>
            </div>
            <p style={{ fontSize: 11.5, color: '#9ca3af', marginBottom: 16 }}>
              Ini persis tampilan yang bakal dilihat siswa. Kunci jawaban yang benar ditandai hijau -- cek dulu apa sudah sesuai sebelum diterbitkan.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {Array.from(keranjang.values()).map((s, i) => (
                <div key={s.id} style={{ border: '1px solid #e2e8f0', borderRadius: 12, padding: 16 }}>
                  <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 6 }}>
                    Soal {i + 1} · {s.mataPelajaran} · {s.tipe || 'pg_sederhana'} · {s.materi || '-'}
                    {s.kunciTerverifikasi === false && (
                      <span style={{ color: '#b45309', fontWeight: 700 }}> · ⚠️ Kunci hasil AI, belum diverifikasi manual</span>
                    )}
                  </div>
                  {s.bacaan?.teks && (
                    <div style={{ background: '#f8fafc', borderRadius: 8, padding: 10, marginBottom: 10, fontSize: 12.5, color: '#334155' }}>
                      <RenderMath text={s.bacaan.teks} />
                    </div>
                  )}
                  <div style={{ fontSize: 13.5, color: '#1e293b', marginBottom: 12 }}><RenderMath text={s.soal || s.teks_soal} /></div>
                  {(s.gambarUrls || []).length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 12 }}>
                      {s.gambarUrls.map((url, gi) => (
                        <img key={gi} src={url} alt={`Gambar soal ${gi + 1}`} style={{ maxWidth: 200, maxHeight: 160, borderRadius: 8, border: '1px solid #e2e8f0' }} />
                      ))}
                    </div>
                  )}
                  {s.tabelSoal && <RenderTable table={s.tabelSoal} />}
                  <RendererSoalPreview soal={s} />
                  {s.pembahasan && (
                    <div style={{ marginTop: 10, background: '#f5f3ff', borderRadius: 8, padding: 10, fontSize: 12, color: '#4c1d95' }}>
                      <b>💡 Pembahasan:</b> <TeksSoalBergambar teks={s.pembahasan} gambarUrls={s.gambarUrls || []} gambarMeta={s.gambarMeta || null} region="pembahasan" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 🔥 BARU (2026-10-08): PANEL RESET SESI -- jawaban keluhan owner
          "mengembalikan soal dan poin XP dll anak ke semula biar bisa
          kerjain ulang". Per siswa: reset = XP lama ditarik balik
          secukupnya + sesi dihapus + izin 3 jam menembus deadline.
          Ada juga tombol massal buat kasus "seperti banyak bug,
          kembalikan semua anak". */}
      {resetPaket && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 110, display: 'flex', justifyContent: 'center', padding: '24px 16px', overflowY: 'auto' }}>
          <div style={{ background: 'white', borderRadius: 16, maxWidth: 640, width: '100%', height: 'fit-content', padding: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <div style={{ fontWeight: 800, fontSize: 15, color: '#1e293b' }}>🔄 Sesi pengerjaan: {resetPaket.judul}</div>
              <button onClick={() => setResetPaket(null)} style={{ border: 'none', background: '#f1f5f9', borderRadius: 8, padding: '6px 12px', cursor: 'pointer', fontSize: 12, fontWeight: 700 }}>Tutup</button>
            </div>
            <p style={{ fontSize: 11.5, color: '#64748b', lineHeight: 1.6, marginBottom: 12 }}>
              Reset = jawaban lama dibuang, XP lama ditarik balik secukupnya (biar gak dobel),
              dan siswa diberi izin 3 jam mengerjakan ulang dari soal nomor 1 -- tetap bisa walau
              deadline paket sudah lewat. Siswa lain tidak kesenggol.
            </p>
            {loadingSesiReset ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12.5, color: '#64748b', padding: '12px 0' }}><Loader2 size={16} className="spin" /> Memuat daftar sesi...</div>
            ) : daftarSesiReset.length === 0 ? (
              <div style={{ fontSize: 12.5, color: '#9ca3af', padding: '8px 0 4px' }}>Belum ada siswa yang mulai mengerjakan try out ini.</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 320, overflowY: 'auto', marginBottom: 12 }}>
                {daftarSesiReset.map((sesi) => (
                  <div key={sesi.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', borderRadius: 8, background: '#f9fafb' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 12.5, fontWeight: 700, color: '#1e293b' }}>{sesi.namaSiswa}</div>
                      <div style={{ fontSize: 11, color: '#9ca3af' }}>
                        {sesi.status === 'selesai'
                          ? `Selesai · skor ${sesi.totalSkorPersen ?? 0}% · ${sesi.xpFinal ?? 0} XP`
                          : 'Sedang berjalan / belum dikumpulkan'}
                        {sesi.createdAt?.toMillis?.() ? ` · mulai ${new Date(sesi.createdAt.toMillis()).toLocaleString('id-ID')}` : ''}
                      </div>
                    </div>
                    <button
                      onClick={() => resetSatuSesi(sesi)}
                      disabled={sedangResetSesi !== null}
                      style={{ fontSize: 11, padding: '5px 10px', borderRadius: 6, border: '1px solid #fde68a', background: '#fffbeb', cursor: sedangResetSesi !== null ? 'wait' : 'pointer', color: '#b45309', whiteSpace: 'nowrap', opacity: sedangResetSesi !== null && sedangResetSesi !== sesi.id ? 0.5 : 1 }}
                    >
                      {sedangResetSesi === sesi.id ? 'Mereset...' : '🔄 Reset & izinkan ulang'}
                    </button>
                  </div>
                ))}
              </div>
            )}
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button
                onClick={resetSemuaSesi}
                disabled={sedangResetSesi !== null || daftarSesiReset.length === 0}
                style={{ ...btnPrimary, backgroundColor: '#b45309', opacity: (sedangResetSesi !== null || daftarSesiReset.length === 0) ? 0.5 : 1 }}
              >
                {sedangResetSesi === 'semua' ? <Loader2 size={14} className="spin" /> : <RotateCcw size={14} />}
                {sedangResetSesi === 'semua' ? 'Mereset semua...' : `Reset semua sesi (${daftarSesiReset.length})`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 🔥 BARU (2026-10-08): dialog cetak naskah model ujian -- dibuka
          dari tombol 🖨️ Print di kartu paket terbit & tombol Print Naskah
          di panel keranjang. Komponennya tidak menyimpan apa pun ke
          Firestore; murni menata (dua kolom, ukuran gambar, kepala seksi
          subtes, nomor halaman) lalu mencetak lewat dialog browser. */}
      {cetakInput && (
        <DialogCetakNaskah input={cetakInput} onClose={() => setCetakInput(null)} />
      )}
    </div>
  );
}