// src/pages/admin/teachers/GaleriMengajarPage.jsx
// ============================================================
// TEMPAT KERJA ADMIN: GALERI FOTO MENGAJAR TENTOR
// ============================================================
// Fitur Utama:
// 1. Agregasi otomatis semua foto sesi mengajar tentor dari `teacher_logs`
//    (foto absensi tatap muka di kelas & screenshot sesi online).
// 2. Dokumentasi manual/kurasi khusus konten dari `galeri_mengajar`.
// 3. Dua kebutuhan utama admin:
//    - CROSS-CHECK: Verifikasi presensi guru, aktivitas mengajar, materi,
//      dan kehadiran siswa di kelas.
//    - KONTEN SOSMED: Download foto HD, 1-klik salin caption medsos
//      (Instagram/TikTok/WhatsApp Status), dan bookmark "⭐ Favorit Konten".
// 4. Filter canggih: per Guru/Tentor, Tipe Kelas (Offline vs Online),
//    Rentang Tanggal (Hari Ini, 7 Hari, Bulan Ini, Custom), dan Pencarian.
// 5. Tampilan fleksibel: Mode Grid Visual (Medsos) vs Mode Kartu Detail.
// 6. Lightbox Fullscreen interaktif dengan navigasi Next/Prev.
// ============================================================

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import SidebarAdmin from '../../../components/SidebarAdmin';
import { db } from '../../../firebase';
import {
  collection, getDocs, doc, updateDoc, addDoc, deleteDoc,
  serverTimestamp, query, orderBy
} from 'firebase/firestore';
import {
  Camera, Image, Search, Calendar, Users, BookOpen, Download,
  Copy, Star, Eye, X, ChevronLeft, ChevronRight, Plus, Trash2,
  ExternalLink, CheckCircle2, Sparkles, GraduationCap, LayoutGrid,
  List, Video, School, RefreshCw, UploadCloud, AlertCircle
} from 'lucide-react';
import { uploadElearningFile } from '../../../services/uploadService';

export default function GaleriMengajarPage() {
  const navigate = useNavigate();
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);

  // Data State
  const [loading, setLoading] = useState(true);
  const [sessionLogs, setSessionLogs] = useState([]);
  const [curatedUploads, setCuratedUploads] = useState([]);
  const [teachers, setTeachers] = useState([]);

  // Toast State
  const [alertMsg, setAlertMsg] = useState(null);
  const showAlert = (text, isError = false) => {
    setAlertMsg({ text, isError });
    setTimeout(() => setAlertMsg(null), 3500);
  };

  // Filter State
  const [cari, setCari] = useState('');
  const [filterGuru, setFilterGuru] = useState(
    () => new URLSearchParams(window.location.search).get('guru') || 'SEMUA'
  );
  const [filterTipe, setFilterTipe] = useState('SEMUA'); // 'SEMUA' | 'REGULER' | 'ONLINE' | 'FAVORIT' | 'UPLOAD'
  const [filterPeriode, setFilterPeriode] = useState('SEMUA'); // 'SEMUA' | 'HARI_INI' | '7_HARI' | 'BULAN_INI' | 'CUSTOM'
  const [tanggalMulai, setTanggalMulai] = useState('');
  const [tanggalSampai, setTanggalSampai] = useState('');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'detail'

  // Modal / Lightbox State
  const [lightboxItem, setLightboxItem] = useState(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadLoading, setUploadLoading] = useState(false);

  // Form Upload Dokumentasi Baru
  const [uploadFile, setUploadFile] = useState(null);
  const [uploadPreview, setUploadPreview] = useState('');
  const [formUpload, setFormUpload] = useState({
    namaGuru: '',
    teacherId: '',
    tanggal: new Date().toISOString().split('T')[0],
    kelasNama: '',
    program: 'Reguler',
    materi: '',
    kategori: 'Tatap Muka',
    keterangan: '',
    isFavoritKonten: true,
  });

  // Handle Resize
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 1024);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // ============================================================
  // MUAT DATA (TEACHER LOGS, CURATED UPLOADS, TEACHERS)
  // ============================================================
  const muatData = useCallback(async () => {
    setLoading(true);
    try {
      // 1. Guru
      const snapGuru = await getDocs(collection(db, 'teachers'));
      const listGuru = snapGuru.docs.map(d => ({ id: d.id, ...d.data() }));
      setTeachers(listGuru);

      // 2. Teacher Logs (Foto dari sesi mengajar riil)
      const snapLogs = await getDocs(collection(db, 'teacher_logs'));
      const listLogs = [];
      snapLogs.forEach(d => {
        const data = d.data();
        const foto = data.fotoAbsensiUrl || data.fotoUrl || '';
        // Hanya ambil dokumen yang memiliki URL foto valid
        if (foto && typeof foto === 'string' && foto.trim().length > 5) {
          listLogs.push({ id: d.id, ...data });
        }
      });
      setSessionLogs(listLogs);

      // 3. Galeri Upload Tambahan (Foto konten admin)
      try {
        const snapGaleri = await getDocs(collection(db, 'galeri_mengajar'));
        const listGaleri = snapGaleri.docs.map(d => ({ id: d.id, ...d.data() }));
        setCuratedUploads(listGaleri);
      } catch (err) {
        console.warn('Koleksi galeri_mengajar belum ada, diabaikan:', err);
      }
    } catch (e) {
      console.error(e);
      showAlert('Gagal memuat data galeri: ' + (e?.message || e), true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    muatData();
  }, [muatData]);

  // ============================================================
  // NORMALISASI & GABUNGAN FOTO
  // ============================================================
  const allPhotos = useMemo(() => {
    const items = [];

    // Foto dari Sesi Mengajar Harian (teacher_logs)
    sessionLogs.forEach(log => {
      const fotoUrl = log.fotoAbsensiUrl || log.fotoUrl;
      const isOnline = (log.tipeKelas || '').toLowerCase() === 'online' ||
        (log.program || '').toLowerCase().includes('online');

      items.push({
        id: log.id,
        source: 'session',
        fotoUrl,
        teacherId: log.teacherId || '',
        namaGuru: log.namaGuru || 'Tentor Gemilang',
        tanggal: log.tanggal || '',
        waktu: log.waktu || '',
        kelasNama: log.kelasNama || log.jadwalId || 'Kelas Bimbel',
        program: log.program || 'Reguler',
        level: log.level || '',
        materi: log.materiHariIni || log.babJudul || log.detail || 'Pembahasan Materi Kelas',
        siswaHadirCount: log.siswaHadir || (Array.isArray(log.daftarSiswaHadir) ? log.daftarSiswaHadir.length : 0),
        daftarSiswa: Array.isArray(log.daftarSiswaHadir) ? log.daftarSiswaHadir : [],
        tipeKelas: isOnline ? 'online' : 'reguler',
        kategori: isOnline ? 'Kelas Online' : 'Tatap Muka',
        keterangan: log.detail || '',
        isFavoritKonten: Boolean(log.isFavoritKonten || log.flagKonten),
        raw: log,
      });
    });

    // Foto dari Upload Konten Tambahan (galeri_mengajar)
    curatedUploads.forEach(cur => {
      items.push({
        id: cur.id,
        source: 'upload',
        fotoUrl: cur.fotoUrl,
        teacherId: cur.teacherId || '',
        namaGuru: cur.namaGuru || 'Tentor Gemilang',
        tanggal: cur.tanggal || '',
        waktu: cur.waktu || '',
        kelasNama: cur.kelasNama || 'Dokumentasi Khusus',
        program: cur.program || 'Konten Medsos',
        level: cur.level || '',
        materi: cur.materi || cur.judul || 'Momen Belajar Gemilang',
        siswaHadirCount: cur.siswaHadirCount || 0,
        daftarSiswa: cur.daftarSiswa || [],
        tipeKelas: cur.tipeKelas || 'reguler',
        kategori: cur.kategori || 'Dokumentasi Tambahan',
        keterangan: cur.keterangan || '',
        isFavoritKonten: Boolean(cur.isFavoritKonten !== false),
        raw: cur,
      });
    });

    // Urutkan terbaru dulu
    return items.sort((a, b) => {
      const tA = `${a.tanggal} ${a.waktu || '00:00'}`;
      const tB = `${b.tanggal} ${b.waktu || '00:00'}`;
      return tB.localeCompare(tA);
    });
  }, [sessionLogs, curatedUploads]);

  // ============================================================
  // FILTERING FOTO
  // ============================================================
  const filteredPhotos = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const monthStart = today.substring(0, 7) + '-01';

    const k = cari.trim().toLowerCase();

    return allPhotos.filter(item => {
      // 1. Filter Guru
      if (filterGuru !== 'SEMUA') {
        const matchesGuru = item.teacherId === filterGuru ||
          item.namaGuru.toLowerCase().includes(filterGuru.toLowerCase());
        if (!matchesGuru) return false;
      }

      // 2. Filter Tipe
      if (filterTipe === 'REGULER' && item.tipeKelas !== 'reguler') return false;
      if (filterTipe === 'ONLINE' && item.tipeKelas !== 'online') return false;
      if (filterTipe === 'FAVORIT' && !item.isFavoritKonten) return false;
      if (filterTipe === 'UPLOAD' && item.source !== 'upload') return false;

      // 3. Filter Periode
      if (filterPeriode === 'HARI_INI' && item.tanggal !== today) return false;
      if (filterPeriode === '7_HARI' && item.tanggal < sevenDaysAgo) return false;
      if (filterPeriode === 'BULAN_INI' && item.tanggal < monthStart) return false;
      if (filterPeriode === 'CUSTOM') {
        if (tanggalMulai && item.tanggal < tanggalMulai) return false;
        if (tanggalSampai && item.tanggal > tanggalSampai) return false;
      }

      // 4. Pencarian Teks
      if (k) {
        const daftarNama = item.daftarSiswa.map(s => (typeof s === 'string' ? s : s.nama || '')).join(' ').toLowerCase();
        const textTarget = `${item.namaGuru} ${item.kelasNama} ${item.materi} ${item.program} ${item.kategori} ${item.keterangan} ${daftarNama}`.toLowerCase();
        if (!textTarget.includes(k)) return false;
      }

      return true;
    });
  }, [allPhotos, cari, filterGuru, filterTipe, filterPeriode, tanggalMulai, tanggalSampai]);

  // ============================================================
  // STATISTIK RINGKAS
  // ============================================================
  const stats = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    const monthStart = today.substring(0, 7) + '-01';

    const guruSet = new Set();
    let bulanIniCount = 0;
    let favoritCount = 0;

    allPhotos.forEach(p => {
      if (p.namaGuru) guruSet.add(p.namaGuru);
      if (p.tanggal >= monthStart) bulanIniCount++;
      if (p.isFavoritKonten) favoritCount++;
    });

    return {
      totalFoto: allPhotos.length,
      totalGuru: guruSet.size,
      bulanIni: bulanIniCount,
      favoritKonten: favoritCount,
    };
  }, [allPhotos]);

  // ============================================================
  // INTERAKSI: UNDUH FOTO HD
  // ============================================================
  const handleDownload = async (item, e) => {
    if (e) e.stopPropagation();
    showAlert('📥 Memulai unduhan foto...');
    try {
      const response = await fetch(item.fotoUrl, { mode: 'cors' });
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const safeGuru = (item.namaGuru || 'tentor').replace(/[^a-zA-Z0-9]/g, '_');
      const safeDate = item.tanggal || 'tanggal';
      link.download = `Dokumentasi_Mengajar_${safeGuru}_${safeDate}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      showAlert('✅ Foto berhasil diunduh!');
    } catch {
      // Fallback: buka di tab baru jika CORS terhalang
      window.open(item.fotoUrl, '_blank', 'noreferrer');
      showAlert('ℹ️ Foto dibuka di tab baru untuk disimpan.');
    }
  };

  // ============================================================
  // INTERAKSI: SALIN CAPTION SOSMED (INSTAGRAM/STATUS)
  // ============================================================
  const handleCopyCaption = (item, e) => {
    if (e) e.stopPropagation();

    const tglFormatted = item.tanggal
      ? new Date(item.tanggal).toLocaleDateString('id-ID', {
          weekday: 'long',
          day: 'numeric',
          month: 'long',
          year: 'numeric'
        })
      : '-';

    const namaSiswaSnippet = item.daftarSiswa && item.daftarSiswa.length > 0
      ? `\n👥 Siswa: ${item.daftarSiswa.slice(0, 5).map(s => (typeof s === 'string' ? s : s.nama || '')).join(', ')}${item.daftarSiswa.length > 5 ? ' dan kawan-kawan' : ''}`
      : (item.siswaHadirCount > 0 ? `\n👥 Kehadiran: ${item.siswaHadirCount} siswa` : '');

    const caption = `✨ DOKUMENTASI BELAJAR GEMILANG ✨

🏫 Kelas: ${item.kelasNama} (${item.program || 'Reguler'})
👨‍🏫 Tentor: Kak ${item.namaGuru}
📚 Pembahasan: ${item.materi}
📅 Waktu: ${tglFormatted}${item.waktu ? ` • Pukul ${item.waktu}` : ''}${namaSiswaSnippet}

Serunya belajar tatap muka & pendampingan intensif bersama Bimbel Gemilang! Materi tuntas, pemahaman mantap, siap raih prestasi terbaik! 🚀💯

#BimbelGemilang #BelajarSeru #DokumentasiKelas #TentorGemilang #BimbelTerbaik #TKA #UTBK #SiswaJuara`;

    if (navigator.clipboard) {
      navigator.clipboard.writeText(caption);
      showAlert('📋 Caption medsos siap pakai berhasil disalin!');
    } else {
      alert(caption);
    }
  };

  // ============================================================
  // INTERAKSI: TOGGLE FAVORIT / SIAP KONTEN
  // ============================================================
  const handleToggleFavorit = async (item, e) => {
    if (e) e.stopPropagation();
    const newStatus = !item.isFavoritKonten;

    // Update state lokal optimis
    if (item.source === 'session') {
      setSessionLogs(prev => prev.map(l => l.id === item.id ? { ...l, isFavoritKonten: newStatus } : l));
    } else {
      setCuratedUploads(prev => prev.map(c => c.id === item.id ? { ...c, isFavoritKonten: newStatus } : c));
    }
    if (lightboxItem && lightboxItem.id === item.id) {
      setLightboxItem(prev => ({ ...prev, isFavoritKonten: newStatus }));
    }

    try {
      const collName = item.source === 'session' ? 'teacher_logs' : 'galeri_mengajar';
      await updateDoc(doc(db, collName, item.id), {
        isFavoritKonten: newStatus,
        flagKonten: newStatus
      });
      showAlert(newStatus ? '⭐ Ditandai sebagai Favorit Konten Medsos!' : 'Dihapus dari Favorit Konten.');
    } catch (err) {
      console.error(err);
      showAlert('Gagal memperbarui status favorit: ' + err.message, true);
    }
  };

  // ============================================================
  // INTERAKSI: HAPUS FOTO (KHUSUS UPLOAD ADMIN)
  // ============================================================
  const handleDeleteUpload = async (item, e) => {
    if (e) e.stopPropagation();
    if (item.source !== 'upload') return;
    if (!window.confirm(`Hapus foto dokumentasi "${item.materi}" ini dari galeri?`)) return;

    try {
      await deleteDoc(doc(db, 'galeri_mengajar', item.id));
      setCuratedUploads(prev => prev.filter(c => c.id !== item.id));
      if (lightboxItem?.id === item.id) setLightboxItem(null);
      showAlert('✅ Foto dokumentasi berhasil dihapus.');
    } catch (err) {
      showAlert('❌ Gagal menghapus: ' + err.message, true);
    }
  };

  // ============================================================
  // INTERAKSI: UPLOAD DOKUMENTASI BARU
  // ============================================================
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      return showAlert('File harus berupa gambar (JPG, PNG, WebP)!', true);
    }
    setUploadFile(file);
    setUploadPreview(URL.createObjectURL(file));
  };

  const handleSimpanUpload = async (e) => {
    e.preventDefault();
    if (!uploadFile) {
      return showAlert('Pilih file foto dokumentasi terlebih dahulu!', true);
    }
    if (!formUpload.namaGuru.trim()) {
      return showAlert('Pilih atau masukkan nama guru pengajar!', true);
    }

    setUploadLoading(true);
    try {
      // 1. Upload ke Storage
      const uploadRes = await uploadElearningFile(uploadFile, 'galeri-mengajar');
      if (!uploadRes.success || !uploadRes.downloadURL) {
        throw new Error(uploadRes.error || 'Gagal mengunggah foto ke storage.');
      }

      // 2. Simpan dokumen di Firestore
      const newDoc = {
        fotoUrl: uploadRes.downloadURL,
        namaGuru: formUpload.namaGuru,
        teacherId: formUpload.teacherId || '',
        tanggal: formUpload.tanggal,
        waktu: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
        kelasNama: formUpload.kelasNama || 'Kelas Bimbel',
        program: formUpload.program,
        materi: formUpload.materi || 'Dokumentasi Kegiatan Mengajar',
        kategori: formUpload.kategori,
        keterangan: formUpload.keterangan || '',
        isFavoritKonten: Boolean(formUpload.isFavoritKonten),
        uploadedBy: 'admin',
        createdAt: serverTimestamp(),
      };

      const ref = await addDoc(collection(db, 'galeri_mengajar'), newDoc);
      setCuratedUploads(prev => [{ id: ref.id, ...newDoc }, ...prev]);

      showAlert('🎉 Foto dokumentasi berhasil ditambahkan ke Galeri Mengajar!');
      setShowUploadModal(false);
      setUploadFile(null);
      setUploadPreview('');
      setFormUpload({
        namaGuru: '',
        teacherId: '',
        tanggal: new Date().toISOString().split('T')[0],
        kelasNama: '',
        program: 'Reguler',
        materi: '',
        kategori: 'Tatap Muka',
        keterangan: '',
        isFavoritKonten: true,
      });
    } catch (err) {
      console.error(err);
      showAlert('❌ Gagal menyimpan dokumentasi: ' + err.message, true);
    } finally {
      setUploadLoading(false);
    }
  };

  // Navigasi Lightbox (Next / Prev)
  const currentLightboxIndex = useMemo(() => {
    if (!lightboxItem) return -1;
    return filteredPhotos.findIndex(p => p.id === lightboxItem.id);
  }, [lightboxItem, filteredPhotos]);

  const handlePrevLightbox = () => {
    if (currentLightboxIndex > 0) {
      setLightboxItem(filteredPhotos[currentLightboxIndex - 1]);
    } else {
      setLightboxItem(filteredPhotos[filteredPhotos.length - 1]);
    }
  };

  const handleNextLightbox = () => {
    if (currentLightboxIndex < filteredPhotos.length - 1) {
      setLightboxItem(filteredPhotos[currentLightboxIndex + 1]);
    } else {
      setLightboxItem(filteredPhotos[0]);
    }
  };

  // Keyboard navigation untuk Lightbox
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!lightboxItem) return;
      if (e.key === 'Escape') setLightboxItem(null);
      if (e.key === 'ArrowLeft') handlePrevLightbox();
      if (e.key === 'ArrowRight') handleNextLightbox();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [lightboxItem, currentLightboxIndex, filteredPhotos]);

  return (
    <div style={styles.wrapper}>
      <SidebarAdmin />

      <div style={styles.mainContent(isMobile)}>
        {/* TOAST ALERT */}
        {alertMsg && (
          <div style={{ ...styles.toast, background: alertMsg.isError ? '#ef4444' : '#1e293b' }}>
            <span>{alertMsg.text}</span>
          </div>
        )}

        {/* ===== QUICK NAV BREADCRUMB ===== */}
        <div style={styles.quickNavRow}>
          <div style={styles.quickNavTitle}>
            <GraduationCap size={16} color="#0d9488" />
            <span>Pusat Manajemen Guru &amp; Dokumentasi</span>
          </div>
          <div style={styles.quickNavButtons}>
            <button
              onClick={() => navigate('/admin/teachers/sesi')}
              style={styles.btnQuickNav}
              title="Periksa Validasi Sesi & Honor Guru"
            >
              <CheckCircle2 size={13} color="#0d9488" /> Sesi &amp; Validasi Guru
            </button>
            <button
              onClick={() => navigate('/admin/teachers')}
              style={styles.btnQuickNav}
              title="Kelola Data Guru"
            >
              <Users size={13} /> Kelola Guru
            </button>
            <button
              onClick={() => navigate('/admin/schedule')}
              style={styles.btnQuickNav}
              title="Jadwal Harian"
            >
              <Calendar size={13} /> Jadwal Harian
            </button>
            <button
              onClick={() => setShowUploadModal(true)}
              style={styles.btnUploadNav}
              title="Upload Foto Dokumentasi Baru untuk Medsos"
            >
              <Plus size={14} /> Upload Foto Dokumentasi
            </button>
          </div>
        </div>

        {/* ===== HEADER SECTION ===== */}
        <div style={styles.headerCard}>
          <div>
            <h1 style={styles.title}>
              <Camera size={26} color="#7c3aed" />
              Galeri Mengajar &amp; Dokumentasi Tentor
            </h1>
            <p style={styles.subtitle}>
              Arsip visual sesi mengajar tatap muka &amp; online seluruh tentor Bimbel Gemilang.
              Gunakan untuk <b>cross-check presensi &amp; aktivitas kelas</b> serta <b>kurasi materi konten promosi medsos</b>.
            </p>
          </div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <button onClick={muatData} style={styles.btnRefresh} title="Muat ulang foto terbaru">
              <RefreshCw size={14} className={loading ? 'spin' : ''} /> Segarkan
            </button>
          </div>
        </div>

        {/* ===== STATISTIK GALERI ===== */}
        <div style={styles.statsGrid}>
          <div style={styles.statCard}>
            <div style={styles.statIcon('#f3e8ff', '#7c3aed')}>
              <Image size={20} />
            </div>
            <div>
              <div style={styles.statLabel}>Total Foto Mengajar</div>
              <div style={styles.statVal}>{stats.totalFoto}</div>
            </div>
          </div>

          <div style={styles.statCard}>
            <div style={styles.statIcon('#e0f2fe', '#0284c7')}>
              <GraduationCap size={20} />
            </div>
            <div>
              <div style={styles.statLabel}>Guru Terdokumentasi</div>
              <div style={styles.statVal}>{stats.totalGuru} Tentor</div>
            </div>
          </div>

          <div style={styles.statCard}>
            <div style={styles.statIcon('#ecfdf5', '#059669')}>
              <Calendar size={20} />
            </div>
            <div>
              <div style={styles.statLabel}>Foto Bulan Ini</div>
              <div style={styles.statVal}>{stats.bulanIni}</div>
            </div>
          </div>

          <div style={styles.statCard}>
            <div style={styles.statIcon('#fef3c7', '#d97706')}>
              <Star size={20} />
            </div>
            <div>
              <div style={styles.statLabel}>⭐ Siap Konten Medsos</div>
              <div style={styles.statVal}>{stats.favoritKonten}</div>
            </div>
          </div>
        </div>

        {/* ===== FILTER BAR ===== */}
        <div style={styles.filterCard}>
          {/* Baris 1: Pencarian & Filter Guru */}
          <div style={styles.filterRow1}>
            <div style={styles.searchBox}>
              <Search size={16} color="#94a3b8" />
              <input
                type="text"
                placeholder="Cari nama guru, kelas, materi bab, siswa hadir..."
                value={cari}
                onChange={e => setCari(e.target.value)}
                style={styles.searchInput}
              />
              {cari && (
                <X size={15} color="#94a3b8" style={{ cursor: 'pointer' }} onClick={() => setCari('')} />
              )}
            </div>

            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
              <select
                value={filterGuru}
                onChange={e => setFilterGuru(e.target.value)}
                style={styles.selectFilter}
              >
                <option value="SEMUA">Semua Tentor / Guru ({teachers.length})</option>
                {teachers.map(t => (
                  <option key={t.id} value={t.id}>{t.nama || t.namaLengkap || 'Guru Tanpa Nama'}</option>
                ))}
              </select>

              <div style={styles.viewToggle}>
                <button
                  onClick={() => setViewMode('grid')}
                  style={viewMode === 'grid' ? styles.viewBtnActive : styles.viewBtn}
                  title="Tampilan Grid Galeri Foto"
                >
                  <LayoutGrid size={15} /> Grid
                </button>
                <button
                  onClick={() => setViewMode('detail')}
                  style={viewMode === 'detail' ? styles.viewBtnActive : styles.viewBtn}
                  title="Tampilan Detail Cross-check"
                >
                  <List size={15} /> Detail
                </button>
              </div>
            </div>
          </div>

          {/* Baris 2: Filter Tabs & Waktu */}
          <div style={styles.filterRow2}>
            {/* Filter Tabs Tipe */}
            <div style={styles.badgeTabGroup}>
              {[
                { key: 'SEMUA', label: 'Semua Foto' },
                { key: 'REGULER', label: '🏫 Tatap Muka' },
                { key: 'ONLINE', label: '💻 Kelas Online' },
                { key: 'FAVORIT', label: '⭐ Siap Konten' },
                { key: 'UPLOAD', label: '📤 Upload Tambahan' },
              ].map(tab => (
                <button
                  key={tab.key}
                  onClick={() => setFilterTipe(tab.key)}
                  style={filterTipe === tab.key ? styles.badgeTabActive : styles.badgeTab}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Filter Waktu */}
            <div style={styles.periodeGroup}>
              {[
                { key: 'SEMUA', label: 'Semua Waktu' },
                { key: 'HARI_INI', label: 'Hari Ini' },
                { key: '7_HARI', label: '7 Hari' },
                { key: 'BULAN_INI', label: 'Bulan Ini' },
                { key: 'CUSTOM', label: 'Rentang...' },
              ].map(p => (
                <button
                  key={p.key}
                  onClick={() => setFilterPeriode(p.key)}
                  style={filterPeriode === p.key ? styles.periodeBtnActive : styles.periodeBtn}
                >
                  {p.label}
                </button>
              ))}

              {filterPeriode === 'CUSTOM' && (
                <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginLeft: 6 }}>
                  <input
                    type="date"
                    value={tanggalMulai}
                    onChange={e => setTanggalMulai(e.target.value)}
                    style={styles.dateInput}
                  />
                  <span style={{ fontSize: 11, color: '#94a3b8' }}>s/d</span>
                  <input
                    type="date"
                    value={tanggalSampai}
                    onChange={e => setTanggalSampai(e.target.value)}
                    style={styles.dateInput}
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ===== INFORMASI HASIL FILTER ===== */}
        <div style={styles.filterSummary}>
          <span>Menampilkan <b>{filteredPhotos.length}</b> foto dokumentasi mengajar</span>
          {(filterGuru !== 'SEMUA' || filterTipe !== 'SEMUA' || filterPeriode !== 'SEMUA' || cari) && (
            <button
              onClick={() => {
                setCari('');
                setFilterGuru('SEMUA');
                setFilterTipe('SEMUA');
                setFilterPeriode('SEMUA');
                setTanggalMulai('');
                setTanggalSampai('');
              }}
              style={styles.btnResetFilter}
            >
              Reset Filter
            </button>
          )}
        </div>

        {/* ===== DAFTAR FOTO (LOADING / KOSONG / KONTEN) ===== */}
        {loading ? (
          <div style={styles.loadingContainer}>
            <div style={styles.spinner}></div>
            <p style={{ marginTop: 14, color: '#64748b', fontSize: 14, fontWeight: 600 }}>
              Memuat galeri foto mengajar tentor...
            </p>
          </div>
        ) : filteredPhotos.length === 0 ? (
          <div style={styles.emptyCard}>
            <Camera size={48} color="#cbd5e1" style={{ marginBottom: 12 }} />
            <h3 style={{ margin: '0 0 6px', color: '#334155', fontSize: 16 }}>Tidak ada foto dokumentasi ditemukan</h3>
            <p style={{ margin: 0, color: '#94a3b8', fontSize: 13, maxWidth: 440 }}>
              {cari || filterGuru !== 'SEMUA' || filterTipe !== 'SEMUA'
                ? 'Coba sesuaikan filter atau kata kunci pencarian Anda.'
                : 'Belum ada foto sesi mengajar yang diunggah oleh guru saat presensi kelas.'}
            </p>
            <button
              onClick={() => setShowUploadModal(true)}
              style={{ ...styles.btnUploadNav, marginTop: 18 }}
            >
              <UploadCloud size={15} /> Upload Foto Dokumentasi Pertama
            </button>
          </div>
        ) : viewMode === 'grid' ? (
          /* ===== MODE 1: GRID GALERI VISUAL (COCOK BUAT KONTEN MEDSOS) ===== */
          <div style={styles.photoGrid}>
            {filteredPhotos.map((item) => (
              <div
                key={item.id}
                style={styles.photoCard}
                onClick={() => setLightboxItem(item)}
              >
                {/* Image Container */}
                <div style={styles.photoThumbWrapper}>
                  <img
                    src={item.fotoUrl}
                    alt={item.materi}
                    loading="lazy"
                    style={styles.photoThumb}
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = 'https://images.unsplash.com/photo-1577896851231-70ef18881754?w=600&auto=format&fit=crop&q=60';
                    }}
                  />
                  {/* Badges Over Image */}
                  <div style={styles.badgeOverlayTop}>
                    <span style={item.tipeKelas === 'online' ? styles.badgeOnline : styles.badgeReguler}>
                      {item.tipeKelas === 'online' ? <Video size={10} /> : <School size={10} />}
                      {item.tipeKelas === 'online' ? 'Online' : 'Tatap Muka'}
                    </span>
                    <button
                      onClick={(e) => handleToggleFavorit(item, e)}
                      style={item.isFavoritKonten ? styles.btnStarActive : styles.btnStar}
                      title={item.isFavoritKonten ? 'Favorit Konten (Klik untuk batal)' : 'Jadikan Favorit Konten Medsos'}
                    >
                      <Star size={13} fill={item.isFavoritKonten ? '#f59e0b' : 'none'} color={item.isFavoritKonten ? '#f59e0b' : '#64748b'} />
                    </button>
                  </div>

                  <div style={styles.badgeOverlayBottom}>
                    <span style={styles.dateBadge}>
                      {item.tanggal ? new Date(item.tanggal).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }) : '-'}
                      {item.waktu ? ` • ${item.waktu}` : ''}
                    </span>
                    {item.siswaHadirCount > 0 && (
                      <span style={styles.studentBadge}>
                        <Users size={10} /> {item.siswaHadirCount}
                      </span>
                    )}
                  </div>
                </div>

                {/* Card Info */}
                <div style={styles.cardBody}>
                  <div style={styles.cardGuruName}>
                    <GraduationCap size={14} color="#7c3aed" />
                    <span>{item.namaGuru}</span>
                  </div>
                  <div style={styles.cardClassTitle}>{item.kelasNama}</div>
                  <div style={styles.cardMateri} title={item.materi}>
                    {item.materi}
                  </div>

                  {/* Actions */}
                  <div style={styles.cardActions}>
                    <button
                      onClick={(e) => handleCopyCaption(item, e)}
                      style={styles.btnAction}
                      title="Salin caption Instagram / Medsos siap posting"
                    >
                      <Copy size={12} /> Salin Caption
                    </button>
                    <button
                      onClick={(e) => handleDownload(item, e)}
                      style={styles.btnActionSecondary}
                      title="Unduh file foto HD"
                    >
                      <Download size={12} />
                    </button>
                    {item.source === 'session' ? (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/admin/teachers/sesi?guru=${item.teacherId}`);
                        }}
                        style={styles.btnActionCrossCheck}
                        title="Cross-check sesi ini di Sesi & Validasi Guru"
                      >
                        <ExternalLink size={12} /> Sesi
                      </button>
                    ) : (
                      <button
                        onClick={(e) => handleDeleteUpload(item, e)}
                        style={styles.btnActionDelete}
                        title="Hapus foto upload ini"
                      >
                        <Trash2 size={12} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* ===== MODE 2: DETAIL CROSS-CHECK (TABEL / LIST LENGKAP) ===== */
          <div style={styles.detailList}>
            {filteredPhotos.map((item) => (
              <div
                key={item.id}
                style={styles.detailCard}
                onClick={() => setLightboxItem(item)}
              >
                <div style={styles.detailThumbCol}>
                  <img
                    src={item.fotoUrl}
                    alt={item.materi}
                    style={styles.detailThumb}
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = 'https://images.unsplash.com/photo-1577896851231-70ef18881754?w=400&auto=format&fit=crop&q=60';
                    }}
                  />
                  <div style={{ marginTop: 6, display: 'flex', gap: 4, justifyContent: 'center' }}>
                    <button
                      onClick={(e) => handleToggleFavorit(item, e)}
                      style={item.isFavoritKonten ? styles.btnStarActiveSmall : styles.btnStarSmall}
                      title="Favorit Medsos"
                    >
                      <Star size={11} fill={item.isFavoritKonten ? '#f59e0b' : 'none'} color={item.isFavoritKonten ? '#f59e0b' : '#64748b'} />
                      <span style={{ fontSize: 9.5 }}>{item.isFavoritKonten ? 'Siap Konten' : 'Bahan Medsos'}</span>
                    </button>
                  </div>
                </div>

                <div style={styles.detailContentCol}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 6 }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 15, fontWeight: 800, color: '#1e293b' }}>{item.namaGuru}</span>
                        <span style={item.tipeKelas === 'online' ? styles.badgeOnline : styles.badgeReguler}>
                          {item.tipeKelas === 'online' ? '💻 Online' : '🏫 Tatap Muka'}
                        </span>
                        {item.source === 'upload' && (
                          <span style={styles.badgeUpload}>📤 Upload Khusus</span>
                        )}
                      </div>
                      <div style={{ fontSize: 12.5, fontWeight: 700, color: '#0d9488', marginTop: 2 }}>
                        {item.kelasNama} {item.program && `• ${item.program}`}
                      </div>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: '#475569' }}>
                        📅 {item.tanggal ? new Date(item.tanggal).toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }) : '-'}
                      </div>
                      <div style={{ fontSize: 11, color: '#94a3b8' }}>
                        ⏰ Pukul {item.waktu || '-'} WIB
                      </div>
                    </div>
                  </div>

                  {/* Materi & Detail */}
                  <div style={styles.detailMateriBox}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
                      Materi / Bahasan Kelas:
                    </div>
                    <div style={{ fontSize: 13, color: '#1e293b', fontWeight: 600, marginTop: 2 }}>
                      {item.materi}
                    </div>
                  </div>

                  {/* Rincian Siswa Hadir */}
                  <div style={styles.detailSiswaBox}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#475569', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Users size={12} color="#0284c7" />
                      <span>Kehadiran: <b>{item.siswaHadirCount} siswa hadir</b></span>
                    </div>
                    {item.daftarSiswa && item.daftarSiswa.length > 0 && (
                      <div style={styles.studentChips}>
                        {item.daftarSiswa.map((s, idx) => (
                          <span key={idx} style={styles.studentChip}>
                            {typeof s === 'string' ? s : s.nama || 'Siswa'}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Actions Bar */}
                  <div style={styles.detailActionsBar}>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button onClick={(e) => handleCopyCaption(item, e)} style={styles.btnAction}>
                        <Copy size={12} /> Salin Caption Medsos
                      </button>
                      <button onClick={(e) => handleDownload(item, e)} style={styles.btnActionSecondary}>
                        <Download size={12} /> Unduh HD
                      </button>
                      <button onClick={() => setLightboxItem(item)} style={styles.btnActionSecondary}>
                        <Eye size={12} /> Perbesar
                      </button>
                    </div>

                    {item.source === 'session' ? (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/admin/teachers/sesi?guru=${item.teacherId}`);
                        }}
                        style={styles.btnActionCrossCheck}
                      >
                        <ExternalLink size={12} /> Buka Validasi Sesi Ini
                      </button>
                    ) : (
                      <button
                        onClick={(e) => handleDeleteUpload(item, e)}
                        style={styles.btnActionDelete}
                      >
                        <Trash2 size={12} /> Hapus
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ===== LIGHTBOX / FULLSCREEN PREVIEW MODAL ===== */}
        {lightboxItem && (
          <div style={styles.lightboxOverlay} onClick={() => setLightboxItem(null)}>
            <div style={styles.lightboxContainer} onClick={e => e.stopPropagation()}>
              {/* Close Button */}
              <button
                onClick={() => setLightboxItem(null)}
                style={styles.lightboxCloseBtn}
                title="Tutup (Esc)"
              >
                <X size={20} />
              </button>

              {/* Prev / Next Arrows */}
              <button
                onClick={handlePrevLightbox}
                style={styles.lightboxArrowLeft}
                title="Foto Sebelumnya (Panah Kiri)"
              >
                <ChevronLeft size={24} />
              </button>
              <button
                onClick={handleNextLightbox}
                style={styles.lightboxArrowRight}
                title="Foto Berikutnya (Panah Kanan)"
              >
                <ChevronRight size={24} />
              </button>

              {/* Image Pane */}
              <div style={styles.lightboxImagePane}>
                <img
                  src={lightboxItem.fotoUrl}
                  alt={lightboxItem.materi}
                  style={styles.lightboxImage}
                />
              </div>

              {/* Info Pane */}
              <div style={styles.lightboxInfoPane}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <span style={lightboxItem.tipeKelas === 'online' ? styles.badgeOnline : styles.badgeReguler}>
                    {lightboxItem.tipeKelas === 'online' ? '💻 Kelas Online' : '🏫 Tatap Muka'}
                  </span>
                  <button
                    onClick={(e) => handleToggleFavorit(lightboxItem, e)}
                    style={lightboxItem.isFavoritKonten ? styles.btnStarActive : styles.btnStar}
                    title="Favorit Konten Medsos"
                  >
                    <Star size={14} fill={lightboxItem.isFavoritKonten ? '#f59e0b' : 'none'} color={lightboxItem.isFavoritKonten ? '#f59e0b' : '#64748b'} />
                    <span style={{ fontSize: 11, fontWeight: 700 }}>
                      {lightboxItem.isFavoritKonten ? '⭐ Siap Konten Medsos' : 'Tandai Favorit'}
                    </span>
                  </button>
                </div>

                <h2 style={{ margin: '0 0 6px', fontSize: 18, color: '#0f172a' }}>
                  {lightboxItem.namaGuru}
                </h2>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#0d9488', marginBottom: 14 }}>
                  {lightboxItem.kelasNama} {lightboxItem.program && `• ${lightboxItem.program}`}
                </div>

                <div style={styles.lightboxMetaRow}>
                  <div style={styles.lightboxMetaItem}>
                    <span style={styles.lightboxMetaLabel}>Tanggal</span>
                    <span style={styles.lightboxMetaVal}>
                      {lightboxItem.tanggal ? new Date(lightboxItem.tanggal).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) : '-'}
                    </span>
                  </div>
                  <div style={styles.lightboxMetaItem}>
                    <span style={styles.lightboxMetaLabel}>Waktu</span>
                    <span style={styles.lightboxMetaVal}>{lightboxItem.waktu || '-'} WIB</span>
                  </div>
                </div>

                <div style={{ marginBottom: 14 }}>
                  <div style={styles.lightboxMetaLabel}>Materi / Pembahasan:</div>
                  <div style={{ fontSize: 13.5, color: '#1e293b', fontWeight: 600, marginTop: 4 }}>
                    {lightboxItem.materi}
                  </div>
                </div>

                <div style={{ marginBottom: 16 }}>
                  <div style={styles.lightboxMetaLabel}>
                    Siswa Hadir ({lightboxItem.siswaHadirCount}):
                  </div>
                  {lightboxItem.daftarSiswa && lightboxItem.daftarSiswa.length > 0 ? (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginTop: 6 }}>
                      {lightboxItem.daftarSiswa.map((s, idx) => (
                        <span key={idx} style={styles.studentChip}>
                          {typeof s === 'string' ? s : s.nama || 'Siswa'}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 4 }}>
                      {lightboxItem.siswaHadirCount > 0 ? `${lightboxItem.siswaHadirCount} siswa hadir di kelas` : 'Tidak ada data siswa rinci'}
                    </div>
                  )}
                </div>

                {/* Tombol Aksi di Modal */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 'auto', paddingTop: 16, borderTop: '1px solid #e2e8f0' }}>
                  <button
                    onClick={(e) => handleCopyCaption(lightboxItem, e)}
                    style={styles.lightboxBtnPrimary}
                  >
                    <Copy size={14} /> Salin Caption Instagram &amp; Status
                  </button>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button
                      onClick={(e) => handleDownload(lightboxItem, e)}
                      style={styles.lightboxBtnSecondary}
                    >
                      <Download size={14} /> Unduh Foto HD
                    </button>
                    {lightboxItem.source === 'session' && (
                      <button
                        onClick={() => {
                          setLightboxItem(null);
                          navigate(`/admin/teachers/sesi?guru=${lightboxItem.teacherId}`);
                        }}
                        style={styles.lightboxBtnCrossCheck}
                      >
                        <ExternalLink size={14} /> Validasi Sesi
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ===== MODAL UPLOAD DOKUMENTASI BARU ===== */}
        {showUploadModal && (
          <div style={styles.modalOverlay} onClick={() => !uploadLoading && setShowUploadModal(false)}>
            <div style={styles.modalContent} onClick={e => e.stopPropagation()}>
              <div style={styles.modalHeader}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <UploadCloud size={20} color="#7c3aed" />
                  <h3 style={{ margin: 0, fontSize: 17, color: '#1e293b' }}>
                    Upload Foto Dokumentasi Mengajar
                  </h3>
                </div>
                <button
                  disabled={uploadLoading}
                  onClick={() => setShowUploadModal(false)}
                  style={styles.modalCloseBtn}
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleSimpanUpload} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {/* Upload Area */}
                <div>
                  <label style={styles.formLabel}>Pilih Berkas Foto Dokumentasi *</label>
                  <div style={styles.uploadBox}>
                    {uploadPreview ? (
                      <div style={{ textAlign: 'center' }}>
                        <img src={uploadPreview} alt="Preview" style={styles.uploadPreviewImg} />
                        <div style={{ marginTop: 8 }}>
                          <label style={styles.btnGantiFoto}>
                            Ganti Foto
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handleFileChange}
                              style={{ display: 'none' }}
                            />
                          </label>
                        </div>
                      </div>
                    ) : (
                      <label style={styles.uploadDropZone}>
                        <Camera size={32} color="#94a3b8" />
                        <span style={{ fontSize: 13, fontWeight: 600, color: '#475569', marginTop: 6 }}>
                          Klik untuk memilih foto kamera / galeri
                        </span>
                        <span style={{ fontSize: 11, color: '#94a3b8' }}>
                          Mendukung JPG, PNG, WEBP (maks. 10MB)
                        </span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleFileChange}
                          style={{ display: 'none' }}
                        />
                      </label>
                    )}
                  </div>
                </div>

                {/* Baris 1: Guru & Tanggal */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label style={styles.formLabel}>Nama Guru / Tentor *</label>
                    <select
                      value={formUpload.teacherId}
                      onChange={e => {
                        const id = e.target.value;
                        const t = teachers.find(x => x.id === id);
                        setFormUpload(prev => ({
                          ...prev,
                          teacherId: id,
                          namaGuru: t ? (t.nama || t.namaLengkap || '') : ''
                        }));
                      }}
                      style={styles.formInput}
                      required
                    >
                      <option value="">-- Pilih Guru --</option>
                      {teachers.map(t => (
                        <option key={t.id} value={t.id}>{t.nama || t.namaLengkap || 'Guru'}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label style={styles.formLabel}>Tanggal Sesi *</label>
                    <input
                      type="date"
                      value={formUpload.tanggal}
                      onChange={e => setFormUpload({ ...formUpload, tanggal: e.target.value })}
                      style={styles.formInput}
                      required
                    />
                  </div>
                </div>

                {/* Baris 2: Kelas & Program */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label style={styles.formLabel}>Nama Kelas / Rombel</label>
                    <input
                      type="text"
                      placeholder="Contoh: 9 SMP Reguler, UTBK Akbar"
                      value={formUpload.kelasNama}
                      onChange={e => setFormUpload({ ...formUpload, kelasNama: e.target.value })}
                      style={styles.formInput}
                    />
                  </div>
                  <div>
                    <label style={styles.formLabel}>Kategori Kegiatan</label>
                    <select
                      value={formUpload.kategori}
                      onChange={e => setFormUpload({ ...formUpload, kategori: e.target.value })}
                      style={styles.formInput}
                    >
                      <option value="Tatap Muka">🏫 Tatap Muka (Offline)</option>
                      <option value="Kelas Online">💻 Kelas Online / Vicon</option>
                      <option value="Fun Learning">🎨 Fun Learning / Edukasi</option>
                      <option value="Try Out & Simulasi">📝 Try Out / Ujian</option>
                      <option value="Event & Penghargaan">🏆 Event / Penghargaan</option>
                    </select>
                  </div>
                </div>

                {/* Materi / Caption */}
                <div>
                  <label style={styles.formLabel}>Materi / Keterangan Dokumentasi</label>
                  <input
                    type="text"
                    placeholder="Contoh: Bedah Soal HOTS Aljabar & Statistika"
                    value={formUpload.materi}
                    onChange={e => setFormUpload({ ...formUpload, materi: e.target.value })}
                    style={styles.formInput}
                  />
                </div>

                {/* Checkbox Siap Konten */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', background: '#fffbeb', borderRadius: 8, border: '1px solid #fde68a' }}>
                  <input
                    type="checkbox"
                    id="chkFavorit"
                    checked={formUpload.isFavoritKonten}
                    onChange={e => setFormUpload({ ...formUpload, isFavoritKonten: e.target.checked })}
                    style={{ width: 16, height: 16, accentColor: '#f59e0b', cursor: 'pointer' }}
                  />
                  <label htmlFor="chkFavorit" style={{ fontSize: 12.5, fontWeight: 700, color: '#92400e', cursor: 'pointer' }}>
                    ⭐ Tandai langsung sebagai Siap Konten Medsos (Instagram / Status)
                  </label>
                </div>

                {/* Submit Buttons */}
                <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 10 }}>
                  <button
                    type="button"
                    disabled={uploadLoading}
                    onClick={() => setShowUploadModal(false)}
                    style={styles.btnCancelModal}
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={uploadLoading}
                    style={styles.btnSubmitModal}
                  >
                    {uploadLoading ? 'Mengunggah Foto...' : 'Simpan ke Galeri'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        .spin { animation: spin 1s linear infinite; }
      `}</style>
    </div>
  );
}

// ============================================================
// STYLES SYSTEM
// ============================================================
const styles = {
  wrapper: {
    display: 'flex',
    minHeight: '100vh',
    background: '#f8fafc',
  },
  mainContent: (isMobile) => ({
    marginLeft: isMobile ? 0 : '270px',
    padding: isMobile ? '16px 12px 60px' : '24px 32px 80px',
    width: isMobile ? '100%' : 'calc(100% - 270px)',
    minHeight: '100vh',
    background: '#f8fafc',
    boxSizing: 'border-box',
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  }),

  // Toast
  toast: {
    position: 'fixed',
    top: 24,
    right: 24,
    zIndex: 99999,
    padding: '12px 20px',
    borderRadius: 12,
    color: 'white',
    fontSize: 13,
    fontWeight: 700,
    boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
  },

  // Quick Nav
  quickNavRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 16,
    paddingBottom: 12,
    borderBottom: '1px solid #e2e8f0',
  },
  quickNavTitle: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    fontSize: 12.5,
    fontWeight: 700,
    color: '#0d9488',
  },
  quickNavButtons: {
    display: 'flex',
    gap: 8,
    flexWrap: 'wrap',
  },
  btnQuickNav: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    padding: '6px 12px',
    background: 'white',
    color: '#334155',
    border: '1px solid #cbd5e1',
    borderRadius: 8,
    fontSize: 12,
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.15s ease',
  },
  btnUploadNav: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    padding: '6px 14px',
    background: 'linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)',
    color: 'white',
    border: 'none',
    borderRadius: 8,
    fontSize: 12,
    fontWeight: 700,
    cursor: 'pointer',
    boxShadow: '0 2px 6px rgba(124, 58, 237, 0.3)',
  },

  // Header Card
  headerCard: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    flexWrap: 'wrap',
    gap: 16,
    background: 'white',
    border: '1px solid #e2e8f0',
    borderRadius: 16,
    padding: '20px 24px',
    marginBottom: 20,
    boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
  },
  title: {
    margin: 0,
    fontSize: 22,
    fontWeight: 800,
    color: '#0f172a',
    display: 'flex',
    alignItems: 'center',
    gap: 10,
  },
  subtitle: {
    margin: '6px 0 0',
    fontSize: 13,
    color: '#64748b',
    lineHeight: 1.5,
    maxWidth: 780,
  },
  btnRefresh: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    padding: '8px 14px',
    background: '#f8fafc',
    color: '#475569',
    border: '1px solid #cbd5e1',
    borderRadius: 10,
    fontSize: 12.5,
    fontWeight: 600,
    cursor: 'pointer',
  },

  // Stats Grid
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
    gap: 14,
    marginBottom: 20,
  },
  statCard: {
    display: 'flex',
    alignItems: 'center',
    gap: 14,
    background: 'white',
    border: '1px solid #e2e8f0',
    borderRadius: 14,
    padding: '16px 18px',
    boxShadow: '0 2px 6px rgba(0,0,0,0.02)',
  },
  statIcon: (bg, color) => ({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 44,
    height: 44,
    borderRadius: 12,
    background: bg,
    color: color,
  }),
  statLabel: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: 700,
    textTransform: 'uppercase',
  },
  statVal: {
    fontSize: 19,
    fontWeight: 800,
    color: '#0f172a',
    marginTop: 2,
  },

  // Filter Card
  filterCard: {
    background: 'white',
    border: '1px solid #e2e8f0',
    borderRadius: 16,
    padding: '16px 20px',
    marginBottom: 16,
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
    boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
  },
  filterRow1: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 12,
  },
  searchBox: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    background: '#f8fafc',
    border: '1px solid #e2e8f0',
    borderRadius: 10,
    padding: '8px 14px',
    flex: '1 1 320px',
  },
  searchInput: {
    border: 'none',
    background: 'transparent',
    outline: 'none',
    width: '100%',
    fontSize: 13,
    color: '#1e293b',
  },
  selectFilter: {
    padding: '8px 12px',
    border: '1px solid #e2e8f0',
    borderRadius: 10,
    background: 'white',
    fontSize: 12.5,
    fontWeight: 600,
    color: '#334155',
    outline: 'none',
  },
  viewToggle: {
    display: 'flex',
    border: '1px solid #e2e8f0',
    borderRadius: 10,
    overflow: 'hidden',
  },
  viewBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 5,
    padding: '7px 12px',
    background: 'white',
    color: '#64748b',
    border: 'none',
    fontSize: 12,
    fontWeight: 600,
    cursor: 'pointer',
  },
  viewBtnActive: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 5,
    padding: '7px 12px',
    background: '#7c3aed',
    color: 'white',
    border: 'none',
    fontSize: 12,
    fontWeight: 700,
    cursor: 'pointer',
  },

  filterRow2: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 12,
    paddingTop: 10,
    borderTop: '1px solid #f1f5f9',
  },
  badgeTabGroup: {
    display: 'flex',
    gap: 6,
    flexWrap: 'wrap',
  },
  badgeTab: {
    padding: '6px 12px',
    borderRadius: 20,
    background: '#f1f5f9',
    color: '#64748b',
    border: 'none',
    fontSize: 11.5,
    fontWeight: 600,
    cursor: 'pointer',
  },
  badgeTabActive: {
    padding: '6px 12px',
    borderRadius: 20,
    background: '#ede9fe',
    color: '#6d28d9',
    border: '1px solid #c4b5fd',
    fontSize: 11.5,
    fontWeight: 800,
    cursor: 'pointer',
  },
  periodeGroup: {
    display: 'flex',
    gap: 5,
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  periodeBtn: {
    padding: '5px 10px',
    borderRadius: 6,
    background: 'transparent',
    color: '#64748b',
    border: '1px solid transparent',
    fontSize: 11.5,
    fontWeight: 600,
    cursor: 'pointer',
  },
  periodeBtnActive: {
    padding: '5px 10px',
    borderRadius: 6,
    background: '#0d9488',
    color: 'white',
    border: 'none',
    fontSize: 11.5,
    fontWeight: 700,
    cursor: 'pointer',
  },
  dateInput: {
    padding: '4px 8px',
    borderRadius: 6,
    border: '1px solid #cbd5e1',
    fontSize: 11.5,
    color: '#334155',
  },

  // Summary
  filterSummary: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    fontSize: 12.5,
    color: '#64748b',
    marginBottom: 14,
    padding: '0 4px',
  },
  btnResetFilter: {
    background: 'none',
    border: 'none',
    color: '#7c3aed',
    fontSize: 12,
    fontWeight: 700,
    cursor: 'pointer',
    textDecoration: 'underline',
  },

  // Photo Grid
  photoGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
    gap: 18,
  },
  photoCard: {
    background: 'white',
    borderRadius: 16,
    border: '1px solid #e2e8f0',
    overflow: 'hidden',
    boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
    cursor: 'pointer',
    transition: 'transform 0.15s ease, box-shadow 0.15s ease',
    display: 'flex',
    flexDirection: 'column',
  },
  photoThumbWrapper: {
    position: 'relative',
    width: '100%',
    paddingTop: '62%', // 16:10 aspect ratio
    background: '#0f172a',
    overflow: 'hidden',
  },
  photoThumb: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    transition: 'transform 0.3s ease',
  },
  badgeOverlayTop: {
    position: 'absolute',
    top: 10,
    left: 10,
    right: 10,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  badgeOverlayBottom: {
    position: 'absolute',
    bottom: 8,
    left: 10,
    right: 10,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  badgeReguler: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 4,
    padding: '3px 8px',
    borderRadius: 6,
    background: 'rgba(15, 118, 110, 0.88)',
    color: 'white',
    fontSize: 10,
    fontWeight: 800,
    backdropFilter: 'blur(4px)',
  },
  badgeOnline: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 4,
    padding: '3px 8px',
    borderRadius: 6,
    background: 'rgba(109, 40, 217, 0.88)',
    color: 'white',
    fontSize: 10,
    fontWeight: 800,
    backdropFilter: 'blur(4px)',
  },
  badgeUpload: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 4,
    padding: '3px 8px',
    borderRadius: 6,
    background: '#fef3c7',
    color: '#92400e',
    fontSize: 10.5,
    fontWeight: 800,
  },
  btnStar: {
    background: 'rgba(255,255,255,0.85)',
    border: 'none',
    width: 28,
    height: 28,
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    boxShadow: '0 2px 5px rgba(0,0,0,0.15)',
  },
  btnStarActive: {
    background: '#fffbeb',
    border: '1.5px solid #f59e0b',
    width: 28,
    height: 28,
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    boxShadow: '0 2px 6px rgba(245, 158, 11, 0.4)',
  },
  dateBadge: {
    fontSize: 10.5,
    fontWeight: 700,
    color: 'white',
    background: 'rgba(0,0,0,0.65)',
    padding: '2px 8px',
    borderRadius: 6,
    backdropFilter: 'blur(4px)',
  },
  studentBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 3,
    fontSize: 10.5,
    fontWeight: 700,
    color: 'white',
    background: 'rgba(0,0,0,0.65)',
    padding: '2px 7px',
    borderRadius: 6,
    backdropFilter: 'blur(4px)',
  },

  // Card Body
  cardBody: {
    padding: '14px 16px',
    display: 'flex',
    flexDirection: 'column',
    flex: 1,
  },
  cardGuruName: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    fontSize: 12.5,
    fontWeight: 800,
    color: '#7c3aed',
  },
  cardClassTitle: {
    fontSize: 14,
    fontWeight: 700,
    color: '#1e293b',
    marginTop: 3,
  },
  cardMateri: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 4,
    lineHeight: 1.4,
    overflow: 'hidden',
    display: '-webkit-box',
    WebkitLineClamp: 2,
    WebkitBoxOrient: 'vertical',
    flex: 1,
  },
  cardActions: {
    display: 'flex',
    gap: 6,
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 10,
    borderTop: '1px solid #f1f5f9',
  },
  btnAction: {
    flex: 1,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    padding: '6px 10px',
    background: '#f5f3ff',
    color: '#7c3aed',
    border: '1px solid #ddd6fe',
    borderRadius: 8,
    fontSize: 11,
    fontWeight: 700,
    cursor: 'pointer',
    transition: 'all 0.15s',
  },
  btnActionSecondary: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '6px 10px',
    background: '#f8fafc',
    color: '#475569',
    border: '1px solid #cbd5e1',
    borderRadius: 8,
    fontSize: 11,
    fontWeight: 700,
    cursor: 'pointer',
  },
  btnActionCrossCheck: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 4,
    padding: '6px 9px',
    background: '#f0fdfa',
    color: '#0d9488',
    border: '1px solid #99f6e4',
    borderRadius: 8,
    fontSize: 11,
    fontWeight: 700,
    cursor: 'pointer',
  },
  btnActionDelete: {
    display: 'inline-flex',
    alignItems: 'center',
    padding: '6px 8px',
    background: '#fef2f2',
    color: '#ef4444',
    border: '1px solid #fecaca',
    borderRadius: 8,
    fontSize: 11,
    cursor: 'pointer',
  },

  // Detail List
  detailList: {
    display: 'flex',
    flexDirection: 'column',
    gap: 14,
  },
  detailCard: {
    display: 'flex',
    gap: 18,
    background: 'white',
    borderRadius: 16,
    border: '1px solid #e2e8f0',
    padding: 16,
    boxShadow: '0 2px 6px rgba(0,0,0,0.02)',
    cursor: 'pointer',
  },
  detailThumbCol: {
    width: 170,
    flexShrink: 0,
  },
  detailThumb: {
    width: '100%',
    height: 115,
    objectFit: 'cover',
    borderRadius: 10,
    background: '#0f172a',
  },
  btnStarSmall: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 4,
    padding: '3px 8px',
    borderRadius: 6,
    background: '#f8fafc',
    border: '1px solid #cbd5e1',
    color: '#64748b',
    cursor: 'pointer',
  },
  btnStarActiveSmall: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 4,
    padding: '3px 8px',
    borderRadius: 6,
    background: '#fffbeb',
    border: '1px solid #fcd34d',
    color: '#b45309',
    fontWeight: 700,
    cursor: 'pointer',
  },
  detailContentCol: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
  },
  detailMateriBox: {
    background: '#f8fafc',
    borderRadius: 8,
    padding: '8px 12px',
    margin: '10px 0 8px',
  },
  detailSiswaBox: {
    margin: '4px 0 10px',
  },
  studentChips: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 5,
    marginTop: 6,
  },
  studentChip: {
    fontSize: 10.5,
    fontWeight: 600,
    background: '#eff6ff',
    color: '#1d4ed8',
    padding: '2px 8px',
    borderRadius: 6,
    border: '1px solid #bfdbfe',
  },
  detailActionsBar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 'auto',
    paddingTop: 8,
    borderTop: '1px solid #f1f5f9',
  },

  // Lightbox
  lightboxOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(15, 23, 42, 0.88)',
    backdropFilter: 'blur(6px)',
    zIndex: 99999,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  lightboxContainer: {
    position: 'relative',
    maxWidth: 1040,
    width: '100%',
    maxHeight: '90vh',
    background: 'white',
    borderRadius: 20,
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'row',
    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35)',
  },
  lightboxCloseBtn: {
    position: 'absolute',
    top: 14,
    right: 14,
    zIndex: 10,
    width: 36,
    height: 36,
    borderRadius: '50%',
    background: 'rgba(0,0,0,0.5)',
    color: 'white',
    border: 'none',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
  },
  lightboxArrowLeft: {
    position: 'absolute',
    left: 14,
    top: '50%',
    transform: 'translateY(-50%)',
    zIndex: 10,
    width: 42,
    height: 42,
    borderRadius: '50%',
    background: 'rgba(0,0,0,0.5)',
    color: 'white',
    border: 'none',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
  },
  lightboxArrowRight: {
    position: 'absolute',
    left: 'calc(65% - 50px)',
    top: '50%',
    transform: 'translateY(-50%)',
    zIndex: 10,
    width: 42,
    height: 42,
    borderRadius: '50%',
    background: 'rgba(0,0,0,0.5)',
    color: 'white',
    border: 'none',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
  },
  lightboxImagePane: {
    width: '65%',
    background: '#090d16',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    minHeight: 460,
  },
  lightboxImage: {
    maxWidth: '100%',
    maxHeight: '88vh',
    objectFit: 'contain',
  },
  lightboxInfoPane: {
    width: '35%',
    padding: '24px 22px',
    display: 'flex',
    flexDirection: 'column',
    overflowY: 'auto',
    background: 'white',
  },
  lightboxMetaRow: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 10,
    background: '#f8fafc',
    padding: '10px 12px',
    borderRadius: 10,
    marginBottom: 14,
  },
  lightboxMetaItem: {
    display: 'flex',
    flexDirection: 'column',
    gap: 2,
  },
  lightboxMetaLabel: {
    fontSize: 10.5,
    fontWeight: 700,
    color: '#64748b',
    textTransform: 'uppercase',
  },
  lightboxMetaVal: {
    fontSize: 12.5,
    fontWeight: 700,
    color: '#0f172a',
  },
  lightboxBtnPrimary: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: '10px 14px',
    background: '#7c3aed',
    color: 'white',
    border: 'none',
    borderRadius: 10,
    fontSize: 12.5,
    fontWeight: 700,
    cursor: 'pointer',
    boxShadow: '0 2px 6px rgba(124, 58, 237, 0.3)',
  },
  lightboxBtnSecondary: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    padding: '9px 12px',
    background: '#f1f5f9',
    color: '#334155',
    border: '1px solid #cbd5e1',
    borderRadius: 10,
    fontSize: 12,
    fontWeight: 700,
    cursor: 'pointer',
  },
  lightboxBtnCrossCheck: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    padding: '9px 12px',
    background: '#f0fdfa',
    color: '#0d9488',
    border: '1px solid #99f6e4',
    borderRadius: 10,
    fontSize: 12,
    fontWeight: 700,
    cursor: 'pointer',
  },

  // Modal Upload
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(15, 23, 42, 0.65)',
    backdropFilter: 'blur(4px)',
    zIndex: 99999,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    maxWidth: 540,
    width: '100%',
    background: 'white',
    borderRadius: 20,
    padding: '24px 26px',
    boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
    maxHeight: '90vh',
    overflowY: 'auto',
  },
  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottom: '1px solid #f1f5f9',
  },
  modalCloseBtn: {
    background: 'transparent',
    border: 'none',
    color: '#94a3b8',
    cursor: 'pointer',
  },
  formLabel: {
    display: 'block',
    fontSize: 11.5,
    fontWeight: 700,
    color: '#475569',
    marginBottom: 5,
  },
  formInput: {
    width: '100%',
    padding: '9px 12px',
    borderRadius: 9,
    border: '1px solid #cbd5e1',
    fontSize: 13,
    color: '#1e293b',
    background: '#f8fafc',
    boxSizing: 'border-box',
    outline: 'none',
  },
  uploadBox: {
    background: '#f8fafc',
    border: '2px dashed #cbd5e1',
    borderRadius: 12,
    padding: 16,
    textAlign: 'center',
  },
  uploadDropZone: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    cursor: 'pointer',
    padding: '16px 10px',
  },
  uploadPreviewImg: {
    maxWidth: '100%',
    maxHeight: 180,
    borderRadius: 10,
    objectFit: 'cover',
  },
  btnGantiFoto: {
    fontSize: 11.5,
    fontWeight: 700,
    color: '#7c3aed',
    cursor: 'pointer',
    textDecoration: 'underline',
  },
  btnCancelModal: {
    padding: '9px 16px',
    background: '#f1f5f9',
    border: '1px solid #cbd5e1',
    borderRadius: 10,
    fontSize: 12.5,
    fontWeight: 700,
    color: '#475569',
    cursor: 'pointer',
  },
  btnSubmitModal: {
    padding: '9px 18px',
    background: 'linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)',
    border: 'none',
    borderRadius: 10,
    fontSize: 12.5,
    fontWeight: 700,
    color: 'white',
    cursor: 'pointer',
    boxShadow: '0 2px 6px rgba(124, 58, 237, 0.3)',
  },

  // Loading & Empty
  loadingContainer: {
    textAlign: 'center',
    padding: '80px 20px',
    background: 'white',
    borderRadius: 16,
    border: '1px solid #e2e8f0',
  },
  spinner: {
    width: 38,
    height: 38,
    borderRadius: '50%',
    border: '3px solid #e2e8f0',
    borderTop: '3px solid #7c3aed',
    animation: 'spin 0.8s linear infinite',
    margin: '0 auto',
  },
  emptyCard: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    textAlign: 'center',
    padding: '60px 24px',
    background: 'white',
    borderRadius: 16,
    border: '1px dashed #cbd5e1',
  },
};
