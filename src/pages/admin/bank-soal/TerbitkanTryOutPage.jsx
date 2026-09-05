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

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../../../firebase';
import { collection, getDocs, addDoc, deleteDoc, doc, updateDoc, query, where, serverTimestamp } from 'firebase/firestore';
import { notifyStudents } from '../../../utils/notifications';
import RendererPgSederhana from '../../student/tryout/RendererPgSederhana';
import RendererPgKompleks from '../../student/tryout/RendererPgKompleks';
import RendererBenarSalah from '../../student/tryout/RendererBenarSalah';
import {
  ArrowLeft, Loader2, Send, ShoppingCart, Trash2, CheckCircle2, AlertTriangle,
  Timer, ShieldAlert, Camera, ListChecks, Layers, Folder, FolderOpen, ChevronDown, ChevronRight, Sparkles,
} from 'lucide-react';

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

// 🔥 BARU (mencegah, bukan cuma nambal): daftar tipe soal yang Try Out
// BENERAN bisa render dengan benar. Kalau ada tipe di luar ini
// (menjodohkan, isian_singkat, uraian, numerik dst), soal itu TIDAK
// BOLEH masuk keranjang sama sekali -- lebih aman "gak bisa dipilih"
// (jelas kelihatan kenapa) daripada "kepilih tapi tampil rusak diam-
// diam" pas siswa asli ngerjain. Kalau nanti tipe baru mau didukung,
// tinggal bikin Renderer-nya + tambahin nama tipe-nya ke daftar ini.
const TIPE_TERDUKUNG = ['pg_sederhana', 'pg_kompleks', 'benar_salah', 'pg_kategori'];
function tipeDidukung(soal) {
  return TIPE_TERDUKUNG.includes(soal.tipe || 'pg_sederhana');
}

// Pemilih renderer sesuai tipe soal -- SAMA PERSIS logikanya dengan
// TryOutView.jsx, biar preview admin nunjukin persis tampilan yang
// bakal dilihat siswa (bukan versi beda yang bisa aja ternyata beda
// pas siswa asli ngerjain).
function RendererSoalPreview({ soal }) {
  const tipe = soal.tipe || 'pg_sederhana';
  if (tipe === 'pg_kompleks') return <RendererPgKompleks soal={soal} disabled modeTinjau />;
  if (tipe === 'benar_salah' || tipe === 'pg_kategori') return <RendererBenarSalah soal={soal} disabled modeTinjau />;
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


  const kosongkanKeranjang = () => setKeranjang(new Map());

  // 🔥 BARU: 3 tab, sama pola kayak TerbitkanKuisPage.jsx -- keranjang
  // yang SAMA dipakai lintas tab, biar bisa campur soal dari folder +
  // bucket + cari bebas sekaligus.
  const [tab, setTab] = useState('folder'); // 'folder' | 'cari' | 'bucket'

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
      let list;
      if (folderId === '__tanpa_folder__') {
        // 🔥 BARU: soal lama dari SEBELUM sistem Folder Sumber ada --
        // dulu gak kesimpen di folder mana pun, jadi gak pernah
        // kelihatan lagi di tab "Jelajah per Folder" (yang cuma baca
        // per sumberSoalId). Di sini ambil SEMUA soal aktif, terus
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

  const daftarMapelDiKeranjang = useMemo(() => {
    const set = new Set();
    keranjang.forEach((s) => set.add(s.mataPelajaran || 'Umum'));
    return Array.from(set);
  }, [keranjang]);

  // Isi default durasi subtes (30 menit) tiap kali ada mapel baru masuk keranjang.
  useEffect(() => {
    setDurasiSubtes((prev) => {
      const next = { ...prev };
      daftarMapelDiKeranjang.forEach((m) => { if (!(m in next)) next[m] = 30; });
      return next;
    });
  }, [daftarMapelDiKeranjang]);

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

  // 🔥 BARU: daftar try out yang UDAH diterbitkan -- sebelumnya gak ada
  // sama sekali cara buat admin lihat "yang tadi udah diterbitkan
  // kemana". Muat ulang tiap kali habis terbitkan yang baru juga.
  const [daftarTerbit, setDaftarTerbit] = useState([]);
  const [loadingDaftarTerbit, setLoadingDaftarTerbit] = useState(true);

  const muatDaftarTerbit = useCallback(async () => {
    setLoadingDaftarTerbit(true);
    try {
      const snap = await getDocs(collection(db, 'tryout_paket'));
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      list.sort((a, b) => (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0));
      setDaftarTerbit(list);
    } catch (e) {
      console.error('Gagal ambil daftar try out terbit:', e);
    }
    setLoadingDaftarTerbit(false);
  }, []);

  useEffect(() => { muatDaftarTerbit(); }, [muatDaftarTerbit]);

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
      // Susun struktur subtes kalau mode 'per-subtes' -- kelompokkan
      // soal-soal di keranjang berdasarkan mataPelajaran-nya.
      const subtes = modeTimer === 'per-subtes'
        ? daftarMapelDiKeranjang.map((mapel) => ({
            nama: mapel,
            durasiMenit: Number(durasiSubtes[mapel]) || 30,
            soalIds: soalDipilih.filter((s) => (s.mataPelajaran || 'Umum') === mapel).map((s) => s.id),
          }))
        : [];

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
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

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
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '24px 16px 200px', fontFamily: 'sans-serif' }}>
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
                                      {(s.soal || s.teks_soal || '').slice(0, 100)}{(s.soal || s.teks_soal || '').length > 100 ? '...' : ''}
                                      {!didukung && ' — ⚠️ tipe belum didukung'}
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
                                        {(s.soal || s.teks_soal || '').slice(0, 100)}{(s.soal || s.teks_soal || '').length > 100 ? '...' : ''}
                                        {!didukung && ' — ⚠️ tipe belum didukung'}
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
          padding: '16px 24px', zIndex: 50, maxHeight: '70vh', overflowY: 'auto',
        }}>
          <div style={{ maxWidth: 900, margin: '0 auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
              <ShoppingCart size={18} color="#7c3aed" />
              <span style={{ fontWeight: 800, fontSize: 14, color: '#6d28d9' }}>Keranjang: {keranjang.size} soal</span>
              <button onClick={() => setShowPreview(true)} style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: '#0e7490', background: 'none', border: 'none', cursor: 'pointer' }}>
                👁️ Preview
              </button>
              <button onClick={kosongkanKeranjang} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: '#dc2626', background: 'none', border: 'none', cursor: 'pointer' }}>
                <Trash2 size={14} /> Kosongkan
              </button>
            </div>

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
                  <span style={{ fontSize: 12, color: '#6b7280' }}>menit, buat semua {keranjang.size} soal</span>
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
                      <span style={{ fontSize: 11.5, color: '#9ca3af' }}>menit</span>
                    </div>
                  ))}
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
                  </div>
                  {s.bacaan?.teks && (
                    <div style={{ background: '#f8fafc', borderRadius: 8, padding: 10, marginBottom: 10, fontSize: 12.5, color: '#334155' }}>
                      {s.bacaan.teks}
                    </div>
                  )}
                  <div style={{ fontSize: 13.5, color: '#1e293b', marginBottom: 12 }}>{s.soal || s.teks_soal}</div>
                  <RendererSoalPreview soal={s} />
                  {s.pembahasan && (
                    <div style={{ marginTop: 10, background: '#f5f3ff', borderRadius: 8, padding: 10, fontSize: 12, color: '#4c1d95' }}>
                      <b>💡 Pembahasan:</b> {s.pembahasan}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}