// src/pages/teacher/modul/ModulManager.jsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../../../firebase';
import { 
  collection, getDocs, doc, deleteDoc, query, orderBy, 
  limit, startAfter, where, onSnapshot 
} from "firebase/firestore";
import { 
  BookOpen, Plus, Search, FileText, HelpCircle, Trash2, 
  Edit3, Eye, AlertCircle, Users, Calendar, Target, Layers, 
  Send, Filter, X, Clock, ChevronLeft, ChevronRight,
  Hash, Tag, User, GraduationCap, Sparkles, Zap,
  Archive, CheckCircle, CalendarDays, Award, Star,
  Grid, List, RefreshCw, Loader2, ChevronDown,
  Home, Layout, FolderOpen, File, Video, Clipboard,
  BarChart3, TrendingUp, Activity, PieChart,
  Rocket, Gift, BookMarked, FileQuestion
} from 'lucide-react';

const ModulManager = () => {
  const navigate = useNavigate();
  
  // ===== STATES =====
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState('semua');
  const [filterKelas, setFilterKelas] = useState("Semua");
  const [filterMapel, setFilterMapel] = useState("Semua");
  const [filterStatus, setFilterStatus] = useState("Semua");
  const [filterGuru, setFilterGuru] = useState("saya");
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [viewMode, setViewMode] = useState('grid');
  const [availableClasses, setAvailableClasses] = useState([]);
  const [availableSubjects, setAvailableSubjects] = useState([]);
  const [showFilters, setShowFilters] = useState(false);
  const [lastDoc, setLastDoc] = useState(null);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [guruData, setGuruData] = useState(null);
  const [guruId, setGuruId] = useState('');
  // 🔥 BARU: daftar KODE MAPEL yang beneran didaftarkan buat guru yang
  // lagi login (bisa lebih dari satu, dipisah koma di data guru -- sama
  // persis pola yang dipakai ManageMateri.jsx/ManageQuiz.jsx). Dipakai
  // buat nentuin BOLEH-TIDAKNYA edit/hapus suatu konten -- BUKAN
  // berdasar "siapa pembuat aslinya" (itu terlalu ketat, nutup
  // kolaborasi kayak "Asisten TKA" yang sengaja dipegang beberapa guru
  // sekaligus), tapi berdasar "apakah guru ini beneran ditugasin ngajar
  // mapel yang sama dengan konten itu". Guru Bahasa Indonesia yang gak
  // pernah didaftarkan ke "Asisten TKA" TETAP gak akan bisa edit/hapus
  // konten TKA walau dia punya login yang sah ke sistem -- tapi 2 guru
  // yang SAMA-SAMA terdaftar ke TKA (guru asli + asisten) bisa
  // sama-sama edit/upload konten di situ, sesuai alur kerja yang memang
  // dimaksud (satu upload soal, satu lagi upload materi keesokan hari).
  const myMapelCodes = useMemo(() => {
    const raw = String(guruData?.kodeMapel || '').split(',').map(s => s.trim().toLowerCase()).filter(Boolean);
    return raw;
  }, [guruData]);

  const canEditContent = (item) => {
    const kode = String(item.kodeMapel || '').trim().toLowerCase();
    if (!kode) return false; // konten gak punya kode mapel sama sekali -- gak ada dasar buat ngizinin siapa pun edit, lebih aman ditolak
    return myMapelCodes.includes(kode);
  };
  // 🔥 BARU: FIX BUG NYATA (laporan langsung: kuis rusak dengan mapel
  // "Umum" yang gak pernah beneran ada gak bisa DIHAPUS SAMA SEKALI --
  // tombol Edit & Hapus sebelumnya digabung jadi satu, keduanya cuma
  // muncul kalau `canEditContent` true. Karena "Umum" gak pernah jadi
  // mapel resmi siapa pun, `canEditContent` SELAMANYA false buat SEMUA
  // guru -- termasuk guru yang punya kuis itu sendiri, jadi kontennya
  // terkunci permanen, gak bisa diedit (itu memang benar) TAPI JUGA gak
  // bisa dihapus (ini yang salah -- harusnya tetap bisa buat bersihin data
  // rusak). Sekarang izin HAPUS dipisah dari izin EDIT: Edit tetap ketat
  // (wajib match kode mapel, biar gak bisa oprek konten mapel guru lain),
  // tapi Hapus konten MILIK SENDIRI (guruId/createdBy cocok) tetap boleh
  // walau mapelnya udah invalid/orphan -- supaya kuis/modul rusak akibat
  // bug data lama tetap bisa dibersihin oleh pemiliknya sendiri.
  const canDeleteContent = (item, isMine) => canEditContent(item) || isMine;
  const [deletingId, setDeletingId] = useState(null);
  const [toast, setToast] = useState(null);

  const COLLECTION_NAME = "bimbel_modul";
  // 🔥 BARU: label buat dokumen yang gak punya field `subject` sama sekali
  // (data lama/rusak) -- SENGAJA diberi tanda ⚠️ dan kata "Tanpa Mapel",
  // BUKAN "Umum", supaya gak pernah lagi disalahartikan sebagai nama mapel
  // yang sah/bisa dipilih di form manapun (lihat penjelasan lengkap soal
  // asal-usul bug "Mapel Umum" di ManageQuiz.jsx).
  const TANPA_MAPEL_LABEL = "⚠️ Tanpa Mapel";
  const PAGE_SIZE = 12;

  // ===== TOAST =====
  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // ===== RESPONSIVE =====
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // ===== AMBIL DATA GURU =====
  useEffect(() => {
    const getGuru = async () => {
      try {
        const saved = JSON.parse(localStorage.getItem('teacherData') || '{}');
        const teacherName = saved.nama || '';
        const teacherId = saved.guruId || saved.id || '';
        
        setGuruId(teacherId);
        
        if (teacherName) {
          const q = query(collection(db, "teachers"), where("nama", "==", teacherName));
          const snap = await getDocs(q);
          if (!snap.empty) {
            setGuruData(snap.docs[0].data());
          }
        }
      } catch (e) {
        console.error("Error getting guru:", e);
      }
    };
    getGuru();
  }, []);

  // ===== FETCH DATA =====
  const fetchFilterOptions = useCallback(async () => {
    try {
      // Kelas dari siswa
      const siswaSnap = await getDocs(collection(db, "students"));
      const kelasSet = new Set();
      siswaSnap.forEach(doc => {
        const kelas = doc.data().kelasSekolah;
        if (kelas) kelasSet.add(kelas);
      });
      setAvailableClasses(['Semua', ...Array.from(kelasSet).sort((a, b) => {
        const numA = parseInt(a);
        const numB = parseInt(b);
        if (!isNaN(numA) && !isNaN(numB)) return numA - numB;
        return a.localeCompare(b);
      })]);

      // Mapel dari modul
      const modulSnap = await getDocs(collection(db, COLLECTION_NAME));
      const mapelSet = new Set();
      modulSnap.forEach(doc => {
        const mapel = doc.data().subject;
        if (mapel && mapel !== "Tugas") mapelSet.add(mapel);
        // 🔥 BARU: dokumen TANPA field subject sama sekali (data lama/
        // rusak) tetap dimunculin sebagai opsi filter -- pakai label
        // TANPA_MAPEL_LABEL yang jelas ini BUKAN mapel sah, supaya guru
        // bisa nemuin & benerin dokumen-dokumen bermasalah ini lewat UI,
        // bukan tersembunyi begitu saja dari filter.
        if (!mapel) mapelSet.add(TANPA_MAPEL_LABEL);
      });
      setAvailableSubjects(['Semua', ...Array.from(mapelSet).sort()]);
    } catch (error) {
      console.error("Error fetching filter options:", error);
    }
  }, []);

  // 🔥 Helper terpusat: dokumen kuis yang cuma nempel/embedded di sebuah
  // materi (punya parentModulId) BUKAN item berdiri sendiri -- dia bagian
  // dari modul induknya, diedit lewat editor materi itu (buka modulnya,
  // baru edit kuisnya dari dalam sana), bukan muncul dobel di listing utama
  // ini sebagai kartu terpisah. Dipakai di SEMUA jalur pengambilan data
  // (fetchItems maupun onSnapshot) supaya konsisten.
  const stripEmbeddedQuizzes = (docsArr) => docsArr.filter(it => !it.parentModulId);

  const fetchItems = useCallback(async (isLoadMore = false) => {
    if (!isLoadMore) {
      setLoading(true);
      setLastDoc(null);
      setHasMore(false);
    } else {
      setLoadingMore(true);
    }

    try {
      let qConstraints = [orderBy("updatedAt", "desc")];
      
      // 🔥 FILTER BERDASARKAN GURU ID
      if (filterGuru === 'saya' && guruId) {
        qConstraints.push(where("guruId", "==", guruId));
      }
      
      // 🔥 FIX BUG PENTING: kondisi ini sebelumnya kebalik (`!isLoadMore &&
      // lastDoc`) -- artinya `startAfter` cuma ditambahkan saat BUKAN "muat
      // lebih banyak", padahal harusnya PERSIS sebaliknya: `startAfter`
      // harus dipasang KETIKA guru mengklik "Muat Lebih Banyak" (isLoadMore
      // true), supaya query lanjut dari batas terakhir, bukan mengulang
      // dari halaman pertama setiap kali diklik.
      if (isLoadMore && lastDoc) qConstraints.push(startAfter(lastDoc));
      qConstraints.push(limit(PAGE_SIZE));
      
      const q = query(collection(db, COLLECTION_NAME), ...qConstraints);
      const snapshot = await getDocs(q);
      const newItems = stripEmbeddedQuizzes(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
      
      if (isLoadMore) {
        // 🔥 Cegah duplikasi kartu kalau ada overlap id (mis. dokumen yang
        // baru saja di-update sehingga "updatedAt"-nya bergeser di antara
        // dua pemuatan halaman).
        setItems(prev => {
          const existingIds = new Set(prev.map(p => p.id));
          return [...prev, ...newItems.filter(it => !existingIds.has(it.id))];
        });
      } else {
        setItems(newItems);
      }
      
      setLastDoc(snapshot.docs[snapshot.docs.length - 1] || null);
      setHasMore(snapshot.docs.length === PAGE_SIZE);
    } catch (error) {
      console.error("Error fetching items:", error);
      // Fallback: ambil semua
      const snapshot = await getDocs(collection(db, COLLECTION_NAME));
      const allItems = stripEmbeddedQuizzes(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
      setItems(allItems);
      setHasMore(false);
    }
    setLoading(false);
    setLoadingMore(false);
    setRefreshing(false);
  }, [lastDoc, filterGuru, guruId]);

  // ===== REAL-TIME LISTENER =====
  useEffect(() => {
    const q = query(
      collection(db, COLLECTION_NAME),
      orderBy("updatedAt", "desc")
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      // 🔥 FIX BUG UTAMA ("tampilan card berantakan"): listener real-time ini
      // SEBELUMNYA menampilkan SEMUA dokumen apa adanya, TANPA memfilter
      // dokumen kuis yang cuma nempel/embedded di sebuah modul materi
      // (yang punya `parentModulId`). Karena listener ini yang jadi sumber
      // data UTAMA (langsung jalan begitu halaman dibuka, sebelum fetchItems
      // sempat dipanggil), akibatnya kuis-kuis yang sudah "bersembunyi rapi"
      // di dalam modul induknya tetap muncul lagi sebagai kartu-kartu
      // terpisah yang membingungkan -- persis keluhan "card berantakan".
      // Sekarang filter yang sama (`stripEmbeddedQuizzes`) dipakai di sini
      // juga, supaya listing selalu konsisten: modul tampil sebagai Modul,
      // kuis yang sudah sepaket dengan modul TIDAK tampil sebagai kartu
      // terpisah lagi (edit dari dalam modulnya), dan cuma kuis yang
      // BENERAN mandiri (dipublish sendiri, bukan ditautkan ke modul) yang
      // muncul sebagai kartu Kuis.
      const data = stripEmbeddedQuizzes(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
      setItems(data);
      setLoading(false);
      // Listener ini mengambil SELURUH koleksi tanpa batas halaman, jadi
      // secara efektif sudah "memuat semua" -- tombol "Muat Lebih Banyak"
      // tidak relevan lagi selama listener ini aktif.
      setHasMore(false);
    }, (error) => {
      console.error("Real-time error:", error);
      fetchItems();
    });
    
    return () => unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    fetchFilterOptions();
  }, [fetchFilterOptions]);

  // ===== HANDLERS =====
  const handleDelete = async (e, id) => {
    e.stopPropagation();
    if (!window.confirm("⚠️ Hapus permanen? Data tidak dapat dikembalikan.")) return;
    
    setDeletingId(id);
    try {
      // 🔥 BARU: kalau item yang dihapus ini MODUL yang punya kuis nempel
      // di dalamnya, hapus juga dokumen kuis itu -- biar gak jadi data
      // yatim yang nyangkut selamanya di database (parentModulId menunjuk
      // ke modul yang sudah tidak ada).
      const item = items.find(it => it.id === id);
      const embeddedQuizIds = (item?.blocks || []).filter(b => b.type === 'quiz' && b.quizId).map(b => b.quizId);
      if (embeddedQuizIds.length > 0) {
        await Promise.all(embeddedQuizIds.map(qid => deleteDoc(doc(db, COLLECTION_NAME, qid)).catch(() => {})));
      }
      await deleteDoc(doc(db, COLLECTION_NAME, id));
      showToast('✅ Modul berhasil dihapus!');
    } catch (error) {
      showToast('❌ Gagal menghapus: ' + error.message, 'error');
    }
    setDeletingId(null);
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchItems();
  };

  const getStatusBadge = (status) => {
    const b = {
      'aktif': { label: '🟢 Aktif', color: '#10b981', bg: '#dcfce7' },
      'terjadwal': { label: '🟡 Terjadwal', color: '#f59e0b', bg: '#fef3c7' },
      'arsip': { label: '📦 Arsip', color: '#64748b', bg: '#f1f5f9' }
    };
    return b[status] || b['aktif'];
  };

  const getTypeInfo = (item) => {
    // 🔥 CEK APAKAH ADA QUIZ DI DALAM MODUL
    const hasQuiz = item.blocks?.some(b => b.type === 'quiz' && b.quizId);
    const hasQuizData = item.quizData?.length > 0;
    
    if (item.type === 'kuis_mandiri') {
      return { 
        label: 'Kuis', 
        icon: <FileQuestion size={12} />, 
        color: '#f59e0b', 
        bg: '#fef3c7',
        emoji: '❓',
        gradient: 'linear-gradient(135deg, #f59e0b, #d97706)'
      };
    }
    if (item.type === 'assignment') {
      return { 
        label: 'Tugas', 
        icon: <Send size={12} />, 
        color: '#ef4444', 
        bg: '#fee2e2',
        emoji: '📝',
        gradient: 'linear-gradient(135deg, #ef4444, #dc2626)'
      };
    }
    // 🔥 FIX BUG PENTING: sebelumnya `hasQuizData` (sisa field quizData, termasuk
    // dari bug lama yang menimpa dokumen materi) dicek LEBIH DULU daripada
    // `blocks`. Akibatnya modul yang beneran punya konten materi tapi kebetulan
    // ada sisa quizData nempel, ke-klasifikasi sebagai "Kuis" murni — dan guru
    // jadi tidak bisa lagi masuk ke editor materi untuk modul itu (link Edit
    // selalu ngarah ke editor kuis). Sekarang `blocks` (konten materi asli)
    // SELALU diprioritaskan sebagai penentu utama "Modul", apapun sisa data lain.
    if (item.blocks?.length > 0) {
      return { 
        label: 'Modul', 
        icon: <BookOpen size={12} />, 
        color: '#3b82f6', 
        bg: '#dbeafe',
        emoji: '📚',
        gradient: 'linear-gradient(135deg, #3b82f6, #2563eb)'
      };
    }
    if (hasQuizData) {
      return { 
        label: 'Kuis', 
        icon: <FileQuestion size={12} />, 
        color: '#f59e0b', 
        bg: '#fef3c7',
        emoji: '❓',
        gradient: 'linear-gradient(135deg, #f59e0b, #d97706)'
      };
    }
    return { 
      label: 'Materi', 
      icon: <FileText size={12} />, 
      color: '#64748b', 
      bg: '#f1f5f9',
      emoji: '📄',
      gradient: 'linear-gradient(135deg, #64748b, #475569)'
    };
  };

  // ============================================================
  // 🔥 FILTERED ITEMS - USE MEMO
  // ============================================================
  const filteredItems = useMemo(() => {
    let filtered = items;
    
    // Filter berdasarkan guru (jika tidak pakai query)
    if (filterGuru === 'saya' && guruId) {
      filtered = filtered.filter(item => 
        item.guruId === guruId || item.createdBy === guruData?.nama
      );
    }
    
    // Search
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(item => 
        (item.title || "").toLowerCase().includes(term) ||
        (item.subject || "").toLowerCase().includes(term) ||
        (item.kodeMapel || "").toLowerCase().includes(term) ||
        (item.guruId || "").toLowerCase().includes(term) ||
        (item.description || "").toLowerCase().includes(term)
      );
    }
    
    // Tab filter
    if (activeTab === 'modul') {
      filtered = filtered.filter(item => 
        !item.type || (item.blocks?.length > 0 && item.type !== 'kuis_mandiri' && item.type !== 'assignment')
      );
    } else if (activeTab === 'tugas') {
      filtered = filtered.filter(item => item.type === 'assignment');
    } else if (activeTab === 'kuis') {
      // 🔥 Tab "Kuis" cuma buat kuis yang BENERAN mandiri (dipublish sendiri
      // dengan tujuan tertentu), BUKAN kuis yang sudah sepaket di dalam
      // sebuah modul -- itu urusannya tab "Modul" (buka modulnya, edit
      // kuisnya dari dalam sana). Sebelumnya kondisi ini juga mengikutkan
      // `item.blocks?.some(b => b.type==='quiz' ...)`, yang bikin SEBUAH
      // MODUL ikut muncul dobel di tab Kuis maupun tab Modul sekaligus.
      filtered = filtered.filter(item => 
        item.type === 'kuis_mandiri' || (item.quizData?.length > 0 && !(item.blocks?.length > 0))
      );
    }
    
    // Kelas
    if (filterKelas !== "Semua") {
      filtered = filtered.filter(item => {
        const targetKelas = item.targetKelas || "Semua";
        return targetKelas === filterKelas || targetKelas === "Semua";
      });
    }
    
    // Mapel
    if (filterMapel !== "Semua") {
      // 🔥 FIX BUG AKAR MASALAH "Mapel Umum": SEBELUMNYA fallback di sini
      // pakai label "Umum" -- kelihatan kayak mapel asli yang sah, padahal
      // ini murni penanda "dokumen ini gak punya field subject sama
      // sekali" (biasanya data lama/rusak). Disamakan labelnya dengan yang
      // dipakai di fetchFilterOptions di bawah supaya konsisten satu
      // sistem, dan jelas ini BUKAN mapel yang bisa dipilih guru di form
      // manapun.
      filtered = filtered.filter(item => (item.subject || TANPA_MAPEL_LABEL) === filterMapel);
    }
    
    // Status
    if (filterStatus !== "Semua") {
      filtered = filtered.filter(item => 
        item.status === filterStatus || (!item.status && filterStatus === "aktif")
      );
    }
    
    return filtered;
  }, [items, searchTerm, activeTab, filterKelas, filterMapel, filterStatus, filterGuru, guruId, guruData]);

  const hasActiveFilters = filterKelas !== "Semua" || filterMapel !== "Semua" || 
                          filterStatus !== "Semua" || filterGuru === 'saya' || searchTerm;

  const clearFilters = () => {
    setFilterKelas("Semua");
    setFilterMapel("Semua");
    setFilterStatus("Semua");
    setFilterGuru("semua");
    setSearchTerm("");
    setActiveTab('semua');
  };

  const stats = useMemo(() => ({
    total: items.length,
    modul: items.filter(i => !i.type || (i.blocks?.length > 0 && i.type !== 'kuis_mandiri' && i.type !== 'assignment')).length,
    tugas: items.filter(i => i.type === 'assignment').length,
    // 🔥 Konsisten dengan filter tab "Kuis" di atas: cuma hitung kuis yang
    // BENERAN berdiri sendiri, bukan yang sudah sepaket di dalam modul.
    kuis: items.filter(i => i.type === 'kuis_mandiri' || (i.quizData?.length > 0 && !(i.blocks?.length > 0))).length,
    milikSaya: items.filter(i => i.guruId === guruId || i.createdBy === guruData?.nama).length,
  }), [items, guruId, guruData]);

  // ============================================================
  // SKELETON LOADING
  // ============================================================
  const SkeletonCard = () => (
    <div style={skeletonStyles.card}>
      <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
        <div style={skeletonStyles.badge}></div>
        <div style={{...skeletonStyles.badge, width: 60}}></div>
        <div style={{...skeletonStyles.badge, width: 40}}></div>
      </div>
      <div style={{...skeletonStyles.line, width: '75%', height: 18}}></div>
      <div style={{...skeletonStyles.line, width: '50%', height: 14, marginTop: 4}}></div>
      <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
        <div style={{...skeletonStyles.line, flex: 1, height: 10}}></div>
        <div style={{...skeletonStyles.line, flex: 1, height: 10}}></div>
      </div>
      <div style={{ display: 'flex', gap: 6, marginTop: 14 }}>
        <div style={{ flex: 1, height: 30, background: '#f1f5f9', borderRadius: 6 }}></div>
        <div style={{ flex: 1, height: 30, background: '#f1f5f9', borderRadius: 6 }}></div>
        <div style={{ width: 30, height: 30, background: '#f1f5f9', borderRadius: 6 }}></div>
      </div>
    </div>
  );

  const skeletonStyles = {
    card: {
      background: 'white', borderRadius: 14,
      border: '1px solid #f1f5f9', padding: 16,
      overflow: 'hidden', height: '100%'
    },
    badge: { width: 50, height: 18, background: '#f1f5f9', borderRadius: 12, animation: 'pulse 1.5s ease-in-out infinite' },
    line: { background: '#f1f5f9', borderRadius: 6, animation: 'pulse 1.5s ease-in-out infinite' }
  };

  // ============================================================
  // RENDER MAIN
  // ============================================================
  if (loading && items.length === 0) {
    return (
      <div style={styles.container}>
        <style>{`@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }`}</style>
        <div style={styles.header}>
          <div style={styles.headerLeft}>
            <div style={{ width: 48, height: 48, borderRadius: 14, background: '#e2e8f0' }}></div>
            <div>
              <div style={{ width: 180, height: 24, background: '#e2e8f0', borderRadius: 6, marginBottom: 4 }}></div>
              <div style={{ width: 120, height: 14, background: '#e2e8f0', borderRadius: 4 }}></div>
            </div>
          </div>
          <div style={{ width: 140, height: 40, background: '#e2e8f0', borderRadius: 10 }}></div>
        </div>
        <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
          {[...Array(4)].map((_, i) => (
            <div key={i} style={{ width: 100, height: 36, background: '#e2e8f0', borderRadius: 20 }}></div>
          ))}
        </div>
        <div style={styles.gridContainer}>
          {[...Array(6)].map((_, i) => <SkeletonCard key={i} />)}
        </div>
      </div>
    );
  }

  // ============================================================
  // MAIN RENDER
  // ============================================================
  return (
    <div style={styles.container}>
      <style>{`
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
        .fade-in { animation: fadeInUp 0.3s ease-out; }
        .spin { animation: spin 0.8s linear infinite; }
      `}</style>

      {/* TOAST */}
      {toast && (
        <div style={{
          position: 'fixed', top: 20, right: 20, zIndex: 9999,
          padding: '12px 20px', borderRadius: 12,
          background: toast.type === 'error' ? '#ef4444' : '#10b981',
          color: 'white', fontWeight: 600, fontSize: 13,
          boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
          animation: 'fadeInUp 0.3s ease'
        }}>
          {toast.message}
        </div>
      )}

      {/* ===== HEADER ===== */}
      <div style={styles.header}>
        <div style={styles.headerLeft}>
          <div style={styles.headerIcon}>
            <BookOpen size={22} color="white" />
          </div>
          <div>
            <h2 style={styles.pageTitle}>E-Learning Console</h2>
            <p style={styles.pageSubtitle}>
              Kelola Modul Pembelajaran
              {guruId && <span style={styles.guruIdBadge}> <Hash size={10} /> {guruId}</span>}
            </p>
          </div>
        </div>
        <div style={styles.headerActions}>
          <button onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')} style={styles.viewToggle}>
            {viewMode === 'grid' ? <List size={16} /> : <Grid size={16} />}
          </button>
          <button onClick={handleRefresh} style={styles.refreshBtn} disabled={refreshing}>
            <RefreshCw size={16} className={refreshing ? 'spin' : ''} />
          </button>
          {activeTab === 'kuis' ? (
            <button onClick={() => navigate('/guru/modul/quiz')} style={{...styles.btnCreate, background: '#f59e0b'}}>
              <FileQuestion size={16} /> Buat Kuis
            </button>
          ) : (
            <button onClick={() => navigate('/guru/modul/materi')} style={styles.btnCreate}>
              <Plus size={16} /> Buat Modul
            </button>
          )}
        </div>
      </div>

      {/* ===== STATS TABS ===== */}
      <div style={styles.statsTabs}>
        <button 
          onClick={() => setActiveTab('semua')}
          style={styles.tabButton(activeTab === 'semua', '#6366f1')}
        >
          Semua ({stats.total})
        </button>
        <button 
          onClick={() => setActiveTab('modul')}
          style={styles.tabButton(activeTab === 'modul', '#3b82f6')}
        >
          <BookOpen size={14} /> Modul ({stats.modul})
        </button>
        <button 
          onClick={() => setActiveTab('tugas')}
          style={styles.tabButton(activeTab === 'tugas', '#ef4444')}
        >
          <Send size={14} /> Tugas ({stats.tugas})
        </button>
        <button 
          onClick={() => setActiveTab('kuis')}
          style={styles.tabButton(activeTab === 'kuis', '#f59e0b')}
        >
          <FileQuestion size={14} /> Kuis ({stats.kuis})
        </button>
        {guruId && (
          <button 
            onClick={() => setFilterGuru(filterGuru === 'saya' ? 'semua' : 'saya')}
            style={{
              ...styles.tabButton(filterGuru === 'saya', '#8b5cf6'),
              background: filterGuru === 'saya' ? '#8b5cf6' : '#f1f5f9',
              color: filterGuru === 'saya' ? 'white' : '#64748b'
            }}
          >
            <User size={14} /> Milik Saya ({stats.milikSaya})
          </button>
        )}
      </div>

      {/* ===== SEARCH & FILTER ===== */}
      <div style={styles.filterBar}>
        <div style={styles.searchBox}>
          <Search size={16} color="#94a3b8" />
          <input 
            placeholder="Cari judul, mapel, ID guru..." 
            value={searchTerm} 
            onChange={e => setSearchTerm(e.target.value)} 
            style={styles.searchInput} 
          />
          {searchTerm && (
            <button onClick={() => setSearchTerm('')} style={styles.clearBtn}>✕</button>
          )}
        </div>
        <div style={styles.filterActions}>
          <button 
            onClick={() => setShowFilters(!showFilters)} 
            style={{
              ...styles.btnFilter,
              background: hasActiveFilters ? '#3b82f6' : '#f1f5f9',
              color: hasActiveFilters ? 'white' : '#64748b'
            }}
          >
            <Filter size={14} /> Filter
            {hasActiveFilters && <span style={styles.filterDot}>●</span>}
          </button>
          {hasActiveFilters && (
            <button onClick={clearFilters} style={styles.btnClearFilter}>
              <X size={12} /> Reset
            </button>
          )}
        </div>
      </div>

      {/* ===== ADVANCED FILTERS ===== */}
      {showFilters && (
        <div style={styles.advancedFilters}>
          <select value={filterKelas} onChange={e => setFilterKelas(e.target.value)} style={styles.filterSelect}>
            <option value="Semua">🎓 Semua Kelas</option>
            {availableClasses.filter(k => k !== 'Semua').map(k => (
              <option key={k} value={k}>{k}</option>
            ))}
          </select>

          <select value={filterMapel} onChange={e => setFilterMapel(e.target.value)} style={styles.filterSelect}>
            <option value="Semua">📖 Semua Mapel</option>
            {availableSubjects.filter(s => s !== 'Semua').map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>

          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={styles.filterSelect}>
            <option value="Semua">📋 Semua Status</option>
            <option value="aktif">🟢 Aktif</option>
            <option value="terjadwal">🟡 Terjadwal</option>
            <option value="arsip">📦 Arsip</option>
          </select>
        </div>
      )}

      {/* ===== FILTER INFO ===== */}
      {hasActiveFilters && (
        <div style={styles.filterInfo}>
          <span>🔍 {filteredItems.length} item</span>
          {filterGuru === 'saya' && <span style={styles.filterTag}>👤 Milik Saya</span>}
          {filterKelas !== "Semua" && <span style={styles.filterTag}>🎓 {filterKelas}</span>}
          {filterMapel !== "Semua" && <span style={styles.filterTag}>📖 {filterMapel}</span>}
          {filterStatus !== "Semua" && <span style={styles.filterTag}>📋 {filterStatus}</span>}
        </div>
      )}

      {/* ===== CONTENT ===== */}
      {filteredItems.length === 0 ? (
        <div style={styles.emptyState}>
          <div style={styles.emptyIcon}>
            <FolderOpen size={56} color="#cbd5e1" />
          </div>
          <h3 style={styles.emptyTitle}>Tidak Ada Konten</h3>
          <p style={styles.emptyDesc}>
            {searchTerm ? 'Coba ubah kata kunci pencarian.' : 'Buat modul pembelajaran baru untuk siswa.'}
          </p>
          <button onClick={() => navigate('/guru/modul/materi')} style={styles.emptyBtn}>
            <Plus size={16} /> Buat Modul Sekarang
          </button>
        </div>
      ) : (
        <>
          <div style={viewMode === 'grid' ? styles.gridContainer : styles.listContainer}>
            {filteredItems.map((item, index) => {
              const typeInfo = getTypeInfo(item);
              const sb = getStatusBadge(item.status);
              const targetKelas = item.targetKelas || "Semua";
              const isForAllClasses = targetKelas === "Semua";
              const isMine = item.guruId === guruId || item.createdBy === guruData?.nama;
              // 🔥 BARU: izin edit/hapus sekarang berdasar KECOCOKAN MAPEL
              // (apakah guru ini terdaftar ngajar mapel yang sama dengan
              // konten ini), BUKAN "siapa pembuat aslinya" -- lihat
              // penjelasan lengkap di canEditContent() di atas.
              const canEdit = canEditContent(item);
              const canDelete = canDeleteContent(item, isMine);
              const isDeleting = deletingId === item.id;
              const hasQuizInside = item.blocks?.some(b => b.type === 'quiz' && b.quizId);
              const guruName = item.guruName || item.authorName || item.createdBy || 'Admin';
              
              const CardComponent = () => (
                <div 
                  style={{
                    ...styles.card,
                    borderTop: `4px solid ${typeInfo.color}`,
                    opacity: item.status === 'arsip' ? 0.7 : 1
                  }}
                  onClick={() => {
                    // 🔥 FIX BUG NYATA & PENTING (langsung dari permintaan):
                    // sebelumnya SIAPA PUN yang punya login guru bisa klik
                    // kartu ini dan langsung MASUK KE MODE EDIT konten
                    // apapun, gak peduli dia terdaftar ke mapel itu atau
                    // enggak -- guru Bahasa Indonesia bisa aja gak sengaja
                    // (atau sengaja) ngubah konten "Asisten TKA" cuma
                    // karena kebetulan punya akses ke sistem. Sekarang
                    // dicek dulu: kalau guru ini GAK terdaftar ke kode
                    // mapel konten itu, klik kartu cuma buka mode LIHAT
                    // (read-only) -- bukan mode edit.
                    if (!canEdit) {
                      const pesanHapus = isMine ? '\n\nKamu masih bisa menghapus konten ini lewat tombol 🗑️ di kartu (karena ini milikmu), walau gak bisa diedit.' : '';
                      alert(`👀 Kamu bisa lihat konten ini, tapi gak bisa edit -- kamu belum terdaftar ngajar mapel "${item.subject || item.kodeMapel || '-'}".\n\nKalau ini keliru (harusnya kamu memang ditugaskan ke mapel ini), hubungi admin buat didaftarkan.${pesanHapus}`);
                      return;
                    }
                    if (typeInfo.label === 'Kuis') {
                      navigate(`/guru/modul/quiz?modulId=${item.id}`);
                    } else {
                      navigate(`/guru/modul/materi?edit=${item.id}`);
                    }
                  }}
                >
                  {/* Badges */}
                  <div style={styles.cardBadges}>
                    <span style={{...styles.badge, background: sb.bg, color: sb.color }}>
                      {sb.label}
                    </span>
                    <span style={{...styles.badge, background: typeInfo.bg, color: typeInfo.color }}>
                      {typeInfo.icon} {typeInfo.label}
                    </span>
                    {item.subject && (
                      <span style={{...styles.badge, background: '#f1f5f9', color: '#64748b' }}>
                        {item.subject}
                      </span>
                    )}
                    <span style={{
                      ...styles.badge,
                      background: isForAllClasses ? '#fef3c7' : '#e0e7ff',
                      color: isForAllClasses ? '#b45309' : '#3730a3'
                    }}>
                      {isForAllClasses ? '🌐 Semua' : `🎓 ${targetKelas}`}
                    </span>
                    {isMine && (
                      <span style={{...styles.badge, background: '#dbeafe', color: '#3b82f6' }}>
                        <User size={10} /> Saya
                      </span>
                    )}
                    {item.guruId && (
                      <span style={{...styles.badge, background: '#f3e8ff', color: '#7c3aed', fontSize: 7 }}>
                        <Hash size={8} /> {item.guruId}
                      </span>
                    )}
                    {hasQuizInside && (
                      <span style={{...styles.badge, background: '#f3e8ff', color: '#8b5cf6' }}>
                        <FileQuestion size={10} /> Kuis
                      </span>
                    )}
                    {item.selectedStudents && item.selectedStudents.length > 0 && (
                      <span style={{...styles.badge, background: '#fce7f3', color: '#be185d' }}>
                        <Users size={10} /> {item.selectedStudents.length} siswa
                      </span>
                    )}
                  </div>

                  {/* Title */}
                  <h3 style={styles.cardTitle}>
                    {item.title || "Untitled"}
                    {item.kodeMapel && (
                      <span style={styles.mapelIdTag}>
                        <Tag size={10} /> {item.kodeMapel}
                      </span>
                    )}
                  </h3>

                  {/* Description */}
                  {item.description && (
                    <p style={styles.cardDesc}>{item.description}</p>
                  )}

                  {/* Meta */}
                  <div style={styles.cardMeta}>
                    {typeInfo.label === 'Kuis' ? (
                      <span><FileQuestion size={10} /> {item.quizData?.length || 0} soal</span>
                    ) : typeInfo.label === 'Tugas' ? (
                      <span><Clock size={10} /> {item.deadlineTugas ? new Date(item.deadlineTugas).toLocaleDateString('id-ID') : 'Tanpa deadline'}</span>
                    ) : (
                      <span><FileText size={10} /> {(item.blocks || []).length} konten</span>
                    )}
                    <span><Users size={10} /> {item.targetKategori || 'Reguler'}</span>
                    {item.mingguKe && <span>📅 Mg {item.mingguKe}</span>}
                    <span><Calendar size={10} /> {item.tahunAjaran || '-'}</span>
                    {item.updatedBy && <span>✏️ {item.updatedBy}</span>}
                  </div>

                  {/* Actions */}
                  <div style={styles.cardActions}>
                    {/* 🔥 FIX BUG NYATA: tombol Edit sebelumnya SELALU
                        aktif buat SIAPA PUN yang lihat kartu ini, gak peduli
                        apakah guru itu terdaftar ke mapel kontennya atau
                        enggak -- guru dari mapel lain bisa gak sengaja
                        ngubah konten mapel yang bukan tanggung jawabnya.
                        Sekarang Edit cuma muncul kalau `canEdit` true (guru
                        ini beneran terdaftar ngajar mapel yang sama dengan
                        konten ini). Tombol HAPUS dipisah izinnya sendiri
                        (`canDelete`, lihat penjelasan di canDeleteContent()
                        di atas) -- supaya konten MILIK SENDIRI yang
                        kebetulan punya mapel rusak/orphan (mis. kasus nyata
                        "Mapel Umum") tetap bisa dibersihin pemiliknya,
                        walau gak bisa diedit. */}
                    {canEdit && (
                      <button 
                        onClick={(e) => { e.stopPropagation(); 
                          // 🔥 Sama seperti klik kartu: modul yang berisi blok kuis
                          // TETAP dibuka di editor materi. Kuisnya nanti dibuka dari
                          // dalam editor materi itu (klik blok kuisnya).
                          if (typeInfo.label === 'Kuis') {
                            navigate(`/guru/modul/quiz?modulId=${item.id}`);
                          } else {
                            navigate(`/guru/modul/materi?edit=${item.id}`);
                          }
                        }} 
                        style={styles.btnEdit}
                      >
                        <Edit3 size={12} /> Edit
                      </button>
                    )}
                    {canDelete && (
                      <button 
                        onClick={(e) => handleDelete(e, item.id)} 
                        disabled={isDeleting}
                        style={styles.btnDelete}
                        title={!canEdit ? 'Hapus konten mapel tidak valid milikmu' : 'Hapus'}
                      >
                        {isDeleting ? <Loader2 size={12} className="spin" /> : <Trash2 size={12} />}
                      </button>
                    )}
                    {!canEdit && !canDelete && (
                      <span style={{ fontSize: 10, color: '#94a3b8', fontStyle: 'italic', padding: '6px 10px', display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Eye size={11} /> Hanya bisa lihat
                      </span>
                    )}
                    <button 
                      onClick={(e) => { e.stopPropagation();
                        // 🔥 FIX BUG: dulu tombol ini membuka `/siswa/materi/{id}`
                        // — alamat yang TIDAK TERDAFTAR di sistem. Akibatnya guru
                        // yang klik Preview malah terlempar ke halaman login utama,
                        // seolah-olah aplikasi error. Alamat yang benar dipisah
                        // sesuai jenis isinya: modul dan kuis punya halaman sendiri.
                        const previewUrl = typeInfo.label === 'Kuis'
                          ? `/siswa/kuis/${item.id}`
                          : `/siswa/modul/${item.id}`;
                        window.open(previewUrl, '_blank');
                      }} 
                      style={styles.btnPreview}
                    >
                      <Eye size={12} /> Preview
                    </button>
                  </div>
                </div>
              );

              return viewMode === 'grid' ? (
                <div key={item.id} className="fade-in" style={{ animationDelay: `${index * 0.05}s` }}>
                  <CardComponent />
                </div>
              ) : (
                <div key={item.id} className="fade-in" style={{ animationDelay: `${index * 0.05}s` }}>
                  <CardComponent />
                </div>
              );
            })}
          </div>
          
          {/* LOAD MORE */}
          {hasMore && filteredItems.length === items.length && items.length > 0 && (
            <div style={styles.loadMore}>
              <button 
                onClick={() => fetchItems(true)} 
                disabled={loadingMore}
                style={styles.btnLoadMore}
              >
                {loadingMore ? (
                  <><Loader2 size={14} className="spin" /> Memuat...</>
                ) : (
                  'Muat Lebih Banyak'
                )}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

// ============================================================
// STYLES
// ============================================================
const styles = {
  container: {
    maxWidth: 1400,
    margin: '0 auto',
    padding: '16px 20px 40px',
    width: '100%',
    boxSizing: 'border-box',
    background: '#f8fafc',
    minHeight: '100vh'
  },

  // Header
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    flexWrap: 'wrap',
    gap: 12,
    background: 'white',
    padding: '16px 20px',
    borderRadius: 16,
    border: '1px solid #f1f5f9',
    boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
  },
  headerLeft: { display: 'flex', alignItems: 'center', gap: 14 },
  headerIcon: {
    background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
    padding: 12,
    borderRadius: 14,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pageTitle: { margin: 0, fontSize: 20, fontWeight: 800, color: '#1e293b' },
  pageSubtitle: { margin: '2px 0 0', fontSize: 12, color: '#94a3b8' },
  guruIdBadge: {
    display: 'inline-flex', alignItems: 'center', gap: 3,
    padding: '1px 8px', borderRadius: 10, fontSize: 9,
    background: '#eef2ff', color: '#3b82f6', fontWeight: 600
  },
  headerActions: { display: 'flex', gap: 8, alignItems: 'center' },
  viewToggle: {
    background: '#f1f5f9', border: 'none', padding: '8px 10px',
    borderRadius: 8, cursor: 'pointer', color: '#64748b',
    display: 'flex', alignItems: 'center', justifyContent: 'center'
  },
  refreshBtn: {
    background: '#f1f5f9', border: 'none', padding: '8px 10px',
    borderRadius: 8, cursor: 'pointer', color: '#64748b',
    display: 'flex', alignItems: 'center', justifyContent: 'center'
  },
  btnCreate: {
    background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
    color: 'white', border: 'none', padding: '10px 18px',
    borderRadius: 10, cursor: 'pointer', fontWeight: 700,
    fontSize: 12, display: 'flex', alignItems: 'center', gap: 6,
    boxShadow: '0 4px 12px rgba(99,102,241,0.25)',
    transition: '0.2s'
  },

  // Stats Tabs
  statsTabs: {
    display: 'flex', gap: 6, marginBottom: 16,
    flexWrap: 'wrap', background: 'white',
    padding: '8px 12px', borderRadius: 12,
    border: '1px solid #f1f5f9'
  },
  tabButton: (active, color) => ({
    padding: '6px 14px', borderRadius: 20, border: 'none',
    fontWeight: 700, fontSize: 12, cursor: 'pointer',
    transition: '0.2s',
    background: active ? color : '#f1f5f9',
    color: active ? 'white' : '#64748b',
    display: 'flex', alignItems: 'center', gap: 4,
    boxShadow: active ? `0 2px 8px ${color}40` : 'none'
  }),

  // Filter Bar
  filterBar: {
    background: 'white', borderRadius: 12,
    padding: '12px 16px', marginBottom: 16,
    border: '1px solid #f1f5f9',
    display: 'flex', justifyContent: 'space-between',
    alignItems: 'center', flexWrap: 'wrap', gap: 10
  },
  searchBox: {
    display: 'flex', alignItems: 'center', gap: 8,
    background: '#f8fafc', padding: '8px 14px',
    borderRadius: 10, border: '1px solid #e2e8f0',
    flex: 2, minWidth: 200
  },
  searchInput: {
    border: 'none', outline: 'none', width: '100%',
    fontSize: 13, background: 'transparent'
  },
  clearBtn: {
    background: 'none', border: 'none', cursor: 'pointer',
    color: '#94a3b8', fontSize: 14, padding: '0 4px'
  },
  filterActions: { display: 'flex', gap: 6, alignItems: 'center' },
  btnFilter: {
    border: 'none', padding: '8px 14px', borderRadius: 10,
    cursor: 'pointer', fontSize: 12, fontWeight: 600,
    display: 'flex', alignItems: 'center', gap: 4,
    transition: '0.2s'
  },
  filterDot: {
    background: 'white', color: '#3b82f6',
    borderRadius: '50%', padding: '1px 5px', fontSize: 7,
    marginLeft: 2
  },
  btnClearFilter: {
    background: 'none', border: 'none', color: '#ef4444',
    cursor: 'pointer', fontSize: 12, display: 'flex',
    alignItems: 'center', gap: 3
  },

  // Advanced Filters
  advancedFilters: {
    display: 'flex', gap: 10, flexWrap: 'wrap',
    padding: 12, background: 'white', borderRadius: 12,
    border: '1px solid #f1f5f9', marginBottom: 16
  },
  filterSelect: {
    padding: '8px 12px', borderRadius: 8,
    border: '1px solid #e2e8f0', fontSize: 12,
    background: 'white', flex: 1, minWidth: 120,
    cursor: 'pointer', outline: 'none'
  },

  // Filter Info
  filterInfo: {
    fontSize: 11, color: '#3b82f6', marginBottom: 12,
    display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center'
  },
  filterTag: {
    background: '#eef2ff', padding: '2px 10px',
    borderRadius: 12, fontSize: 10, fontWeight: 600
  },

  // Grid / List
  gridContainer: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
    gap: 16
  },
  listContainer: {
    display: 'flex', flexDirection: 'column', gap: 12
  },

  // Card
  card: {
    background: 'white', borderRadius: 14, overflow: 'hidden',
    padding: 16, border: '1px solid #f1f5f9',
    boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
    cursor: 'pointer', transition: 'all 0.2s ease',
    borderTop: '4px solid #3b82f6',
    height: '100%',
    display: 'flex', flexDirection: 'column'
  },
  cardBadges: {
    display: 'flex', gap: 5, marginBottom: 10, flexWrap: 'wrap'
  },
  badge: {
    display: 'inline-flex', alignItems: 'center', gap: 3,
    padding: '2px 10px', borderRadius: 12, fontSize: 9,
    fontWeight: 700, whiteSpace: 'nowrap'
  },
  cardTitle: {
    margin: '0 0 4px', fontSize: 14, color: '#1e293b',
    fontWeight: 700, lineHeight: 1.3,
    display: 'flex', alignItems: 'center', gap: 6,
    flexWrap: 'wrap'
  },
  mapelIdTag: {
    fontSize: 8, color: '#8b5cf6', background: '#ede9fe',
    padding: '1px 6px', borderRadius: 4,
    display: 'inline-flex', alignItems: 'center', gap: 2,
    fontFamily: 'monospace'
  },
  cardDesc: {
    fontSize: 12, color: '#64748b', margin: '4px 0 10px',
    display: '-webkit-box', WebkitLineClamp: 2,
    WebkitBoxOrient: 'vertical', overflow: 'hidden',
    lineHeight: 1.4
  },
  cardMeta: {
    display: 'flex', gap: 10, fontSize: 10,
    color: '#94a3b8', marginBottom: 12, flexWrap: 'wrap',
    alignItems: 'center', marginTop: 'auto'
  },
  cardActions: {
    display: 'flex', gap: 6, marginTop: 10,
    paddingTop: 10, borderTop: '1px solid #f1f5f9'
  },
  btnEdit: {
    flex: 1, background: '#f8fafc', color: '#1e293b',
    border: '1px solid #e2e8f0', padding: '6px 0',
    borderRadius: 8, cursor: 'pointer', fontWeight: 600,
    fontSize: 10, display: 'flex', alignItems: 'center',
    justifyContent: 'center', gap: 3
  },
  btnPreview: {
    flex: 1, background: '#1e293b', color: 'white',
    border: 'none', padding: '6px 0', borderRadius: 8,
    cursor: 'pointer', fontWeight: 600, fontSize: 10,
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 3
  },
  btnDelete: {
    background: '#fee2e2', color: '#ef4444',
    border: 'none', padding: '6px 12px', borderRadius: 8,
    cursor: 'pointer', fontWeight: 600, fontSize: 10,
    display: 'flex', alignItems: 'center', justifyContent: 'center'
  },

  // Empty State
  emptyState: {
    textAlign: 'center', padding: '60px 20px',
    background: 'white', borderRadius: 16,
    border: '2px dashed #e2e8f0', color: '#94a3b8'
  },
  emptyIcon: { marginBottom: 12 },
  emptyTitle: { fontSize: 18, fontWeight: 700, color: '#64748b', margin: '8px 0 4px' },
  emptyDesc: { fontSize: 13, color: '#94a3b8', marginBottom: 16 },
  emptyBtn: {
    background: '#6366f1', color: 'white', border: 'none',
    padding: '10px 24px', borderRadius: 10, cursor: 'pointer',
    fontWeight: 600, fontSize: 13, display: 'inline-flex',
    alignItems: 'center', gap: 6
  },

  // Load More
  loadMore: { textAlign: 'center', marginTop: 24 },
  btnLoadMore: {
    background: '#f1f5f9', border: 'none', padding: '10px 24px',
    borderRadius: 20, cursor: 'pointer', fontSize: 12,
    fontWeight: 600, color: '#64748b', display: 'inline-flex',
    alignItems: 'center', gap: 6, transition: '0.2s'
  }
};

export default ModulManager;