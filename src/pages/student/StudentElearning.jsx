// src/pages/student/StudentElearning.jsx
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../../firebase';
import { 
  collection, getDocs, doc, getDoc, query, orderBy, where 
} from "firebase/firestore";
import { 
  BookOpen, Search, Filter, X, Grid3x3, List, 
  Hash, Tag, User, ChevronRight, FileQuestion,
  Layers, Send, HelpCircle, Clock, CheckCircle,
  AlertCircle, Lock, ChevronLeft, ArrowLeft,
  FileText, Download, Eye, ExternalLink, Link as LinkIcon,
  Users, GraduationCap
} from 'lucide-react';
import StudentModuleView from './StudentModuleView';
import StudentQuizView from './StudentQuizView';

// ============================================================
// CONSTANTS
// ============================================================
const STATUS_COLORS = {
  not_submitted: { bg: '#fee2e2', color: '#ef4444', label: 'Belum' },
  submitted: { bg: '#fef3c7', color: '#f59e0b', label: 'Terkirim' },
  graded: { bg: '#dcfce7', color: '#10b981', label: 'Dinilai' }
};

const AVATAR_COLORS = ['#652D90', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899'];
const colorForName = (name = '') => {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
};

// ============================================================
// 🔥 FIX BUG BESAR: "siswa sudah didaftarkan mapelnya (enrolledSubjects)
// tapi tetap kena Akses Ditolak begitu buka modul dari halaman ini"
// ============================================================
// Root cause-nya BUKAN di sini awalnya -- tapi di bawah, di bagian fetch
// data siswa: field `enrolledSubjects` gak pernah ikut disalin ke
// `studentData`, jadi `StudentModuleView`/`StudentQuizView` yang dibuka
// dari sini SELALU menerima `enrolledSubjects` kosong walau datanya di
// database sudah benar (lihat komentar lengkap di situ).
//
// Sebagai perbaikan KEDUA (bukan cuma nutup bug di sumbernya, tapi juga
// bikin daftar modul di halaman ini SENDIRI sudah tersaring dari awal):
// dulu `fetchModules()` di bawah cuma nyaring berdasarkan targetKelas &
// targetKategori -- SAMA SEKALI TIDAK mengecek mapel/enrolledSubjects.
// Efeknya: modul mapel APAPUN nongol di daftar (kartu "LATIHAN TKA JENIS
// TEKS DAN STRUKTUR" dst tetap kelihatan), padahal begitu diklik "Buka"
// baru ketauan ditolak di StudentModuleView -- pengalaman yang
// membingungkan (kelihatan bisa diakses, ternyata enggak). Sekarang
// pengecekan mapel yang SAMA (kode ATAU nama, pola identik dengan
// hasSubjectAccess() di StudentDashboard.jsx/StudentModuleView.jsx) juga
// diterapkan di sini, supaya modul yang memang bukan hak siswa itu TIDAK
// PERNAH muncul di daftar sama sekali -- konsisten di semua titik.
const hasSubjectAccess = (enrolledSubjects, modulSubject, modulKodeMapel) => {
  if (!modulSubject || modulSubject.toLowerCase().trim() === 'umum') return true;
  const norm = (s) => String(s || '').toLowerCase().trim();
  const modulCodes = String(modulKodeMapel || '').split(',').map(norm).filter(Boolean);
  const modulNameNorm = norm(modulSubject);

  if (modulCodes.length === 0 && !modulNameNorm) return true; // modul gak punya kode/nama mapel -> gak ada dasar buat blokir
  if (!Array.isArray(enrolledSubjects) || enrolledSubjects.length === 0) return false; // kosong = BLOKIR
  if (enrolledSubjects.some(s => norm(s) === 'semua')) return true;

  return enrolledSubjects.some(s => {
    const es = norm(s);
    return modulCodes.includes(es) || es === modulNameNorm;
  });
};

// ============================================================
// MAIN COMPONENT
// ============================================================
const StudentElearning = () => {
  const navigate = useNavigate();
  
  // ===== STATES =====
  const [modules, setModules] = useState([]);
  const [filteredModules, setFilteredModules] = useState([]);
  const [selectedModuleId, setSelectedModuleId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterMapel, setFilterMapel] = useState("all");
  const [filterType, setFilterType] = useState("all");
  const [viewMode, setViewMode] = useState("grid");
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [showFilters, setShowFilters] = useState(false);

  // 🔥 BARU: mode tampilan dikelompokkan per guru
  const [viewGroupMode, setViewGroupMode] = useState('perGuru'); // 'perGuru' | 'semua'
  const [selectedGuruId, setSelectedGuruId] = useState(null);
  const [teachersData, setTeachersData] = useState([]);
  
  // ===== STUDENT DATA =====
  // 🔥 FIX: tambah field `enrolledSubjects` -- SEBELUMNYA TIDAK ADA SAMA
  // SEKALI di state ini, itu akar bug "siswa sudah didaftarkan mapelnya
  // tapi tetap Akses Ditolak". Lihat penjelasan lengkap di effect fetch
  // data siswa di bawah.
  const [studentData, setStudentData] = useState({
    id: '',
    nim: '',
    name: '',
    kelas: '',
    program: 'Reguler',
    enrolledSubjects: []
  });
  
  // ===== SUBMISSIONS =====
  const [submissions, setSubmissions] = useState({});
  const [quizSubmissions, setQuizSubmissions] = useState({});
  
  // ===== STATS =====
  const [stats, setStats] = useState({
    total: 0, modul: 0, tugas: 0, kuis: 0, submitted: 0
  });

  // 🔥 FIX BUG NYATA (race condition): `fetchModules()` di bawah dipicu
  // ULANG setiap kali `studentData` berubah -- dan `studentData` berubah
  // BEBERAPA KALI berturut-turut (pertama diisi fallback kosong/sebagian
  // dari localStorage, lalu ditimpa data lengkap dari Firestore begitu
  // `loadStudentDoc()` selesai). Tiap pemicuan itu jalanin serangkaian
  // query Firestore yang makan waktu -- dan SEBELUMNYA gak ada penanda
  // "ini sudah basi" sama sekali, beda dari StudentModuleView.jsx/
  // StudentQuizView.jsx yang sudah punya pengaman serupa. Akibatnya
  // panggilan LAMA (data siswa belum lengkap, enrolledSubjects kosong/
  // sebagian) dan panggilan BARU (data lengkap) jalan BARENGAN, dan
  // siapa pun yang SELESAI PALING AKHIR yang menimpa `setModules()` --
  // bukan yang datanya paling benar. Ini kebukti langsung dari console
  // log yang naik-turun (0, 1, 21, 1, 0, ...) di laporan bug real-nya.
  // Fix: `fetchRequestIdRef` menandai request TERBARU yang dimulai --
  // begitu sebuah pemanggilan fetchModules() selesai, dia cek dulu
  // apakah dirinya masih request TERBARU sebelum menyentuh state apa pun;
  // kalau bukan (ada request lain yang dimulai belakangan), hasilnya
  // dibuang, gak pernah menimpa state.
  const fetchRequestIdRef = useRef(0);

  // ============================================================
  // EFFECTS
  // ============================================================
  useEffect(() => {
    const h = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', h);
    return () => window.removeEventListener('resize', h);
  }, []);

  // Ambil data siswa
  useEffect(() => {
    const id = localStorage.getItem('studentId') || '';
    const nim = localStorage.getItem('studentNim') || localStorage.getItem('studentId') || '';
    const name = localStorage.getItem('studentName') || 'Siswa';
    const kelas = localStorage.getItem('studentKelas') || '';
    const program = localStorage.getItem('studentProgram') || 'Reguler';
    // 🔥 FIX: fallback awal dari localStorage juga (dipakai bila
    // getDoc di bawah belum selesai / gagal) -- sama seperti pola yang
    // sudah dipakai StudentModuleView.jsx & StudentQuizView.jsx.
    let enrolledSubjectsFallback = [];
    try {
      const raw = localStorage.getItem('studentEnrolledSubjects');
      enrolledSubjectsFallback = raw ? JSON.parse(raw) : [];
    } catch (e) { enrolledSubjectsFallback = []; }

    setStudentData({ id, nim, name, kelas, program, enrolledSubjects: enrolledSubjectsFallback });

    // ============================================================
    // 🔥 FIX BUG AKAR MASALAH "siswa sudah didaftarkan mapelnya tapi
    // enrolledSubjects selalu kosong / modul & kuis gak muncul sama sekali"
    // ============================================================
    // Ada DUA bug bertumpuk di sini, yang kedua nutupin yang pertama:
    //
    // (1) Field `enrolledSubjects` gak pernah disalin ke `studentData`
    //     (sudah diperbaiki di bawah).
    //
    // (2) YANG LEBIH DALAM: pengambilan dokumen siswa pakai
    //     `getDoc(doc(db, "students", id))` dengan `id` yang diambil dari
    //     `localStorage.getItem('studentId')` -- padahal isi localStorage
    //     itu KODE UNIK siswa (mis. "STD-1226080003"), BUKAN ID DOKUMEN
    //     Firestore (mis. "qO0RTPw7ylj2rolT5MMS", lihat URL halaman Edit
    //     Siswa di admin). Jadi `getDoc` nyari dokumen dengan ID yang
    //     memang GAK PERNAH ADA -> `snap.exists()` selalu false ->
    //     enrolledSubjects gak pernah keisi. Lebih parah lagi, ujungnya
    //     ada `.catch(() => {})` yang MEMBUNGKAM kegagalan ini total --
    //     gak ada error, gak ada warning, jadi bug ini "diam-diam" bikin
    //     SEMUA siswa keblokir tanpa jejak apa pun di console.
    //
    // Perbaikan: coba dulu sebagai ID dokumen (buat akun yang memang
    // login-nya nyimpen ID dokumen), dan KALAU GAK KETEMU, cari lewat
    // FIELD `studentId` (buat akun yang nyimpen kode unik). Dua-duanya
    // ditangani, jadi apapun skema yang dipakai saat login, datanya
    // tetap ketemu.
    const applyStudentDoc = (docId, data) => {
      const enrolled = Array.isArray(data.enrolledSubjects) ? data.enrolledSubjects : [];
      setStudentData(prev => ({
        ...prev,
        // 🔥 `id` disamakan ke ID DOKUMEN yang sebenarnya -- ini penting
        // karena dipakai buat mencocokkan target "kirim ke siswa tertentu"
        // (yang menyimpan ID dokumen di `selectedStudents[].id`).
        id: docId || prev.id,
        nim: data.studentId || data.nim || nim,
        kelas: data.kelasSekolah || kelas,
        program: data.kategori || data.program || program,
        enrolledSubjects: enrolled,
      }));
      // Sinkronkan ke localStorage biar halaman lain (StudentModuleView /
      // StudentQuizView) yang baca dari sini juga dapat data terbaru.
      try {
        localStorage.setItem('studentEnrolledSubjects', JSON.stringify(enrolled));
      } catch (e) { /* localStorage penuh/gak tersedia -- gak fatal */ }
    };

    // 🔥 FIX BUG NYATA (lanjutan dari fix ID-vs-kode di atas): asumsi
    // "kalau getDoc(doc(db,'students', id)) nemu dokumen, berarti itu
    // pasti dokumen siswa yang benar" TERNYATA SALAH kalau ada dokumen
    // LAIN yang gak sengaja tersimpan dengan ID PERSIS SAMA dengan kode
    // siswa ini (mis. fitur ganti-foto-sendiri di sisi siswa yang salah
    // pakai `setDoc(doc(db,"students", studentId), {...}, {merge:true})`
    // -- `setDoc` otomatis BIKIN dokumen baru kalau ID itu belum ada,
    // dan kalau `studentId` yang dipakai di situ adalah KODE siswa,
    // bukan ID dokumen asli, jadinya ada "dokumen hantu" nyangkut di ID
    // itu isinya cuma field foto doang, gak ada `nama`/`enrolledSubjects`
    // apa pun). Begitu Percobaan 1 nemu dokumen hantu ini, dia langsung
    // `return` dan GAK PERNAH lanjut ke Percobaan 2 yang harusnya nemu
    // dokumen ASLI siswa (ID acak, data lengkap) -- persis kasus nyata
    // yang dilaporkan: enrolledSubjects siswa selalu kosong walau admin
    // sudah mengisinya di dokumen yang benar.
    // Fix: dokumen dari Percobaan 1 cuma dipercaya kalau ADA field
    // `nama` yang berisi -- penanda minimal bahwa ini dokumen siswa
    // sungguhan, bukan dokumen hantu/parsial. Kalau tidak, lanjut ke
    // Percobaan 2/3 seperti biasa.
    const looksLikeRealStudentDoc = (data) => !!(data && typeof data.nama === 'string' && data.nama.trim());

    const loadStudentDoc = async () => {
      if (!id) return;
      try {
        // Percobaan 1: anggap `id` adalah ID DOKUMEN Firestore
        const snap = await getDoc(doc(db, "students", id));
        if (snap.exists() && looksLikeRealStudentDoc(snap.data())) {
          applyStudentDoc(snap.id, snap.data());
          return;
        }
        if (snap.exists()) {
          console.warn('[Data Siswa] Dokumen ditemukan di ID', id, 'tapi keliatan seperti dokumen hantu/parsial (gak ada field nama) -- dilewati, lanjut cari dokumen asli lewat field studentId.', snap.data());
        }

        // Percobaan 2 (INI YANG MEMPERBAIKI BUG): `id` ternyata KODE UNIK
        // siswa, bukan ID dokumen -> cari lewat field `studentId`.
        const byField = await getDocs(
          query(collection(db, "students"), where("studentId", "==", id))
        );
        if (!byField.empty) {
          const d = byField.docs[0];
          applyStudentDoc(d.id, d.data());
          return;
        }

        // Percobaan 3: kalau `nim` beda dari `id`, coba juga pakai `nim`.
        if (nim && nim !== id) {
          const byNim = await getDocs(
            query(collection(db, "students"), where("studentId", "==", nim))
          );
          if (!byNim.empty) {
            const d = byNim.docs[0];
            applyStudentDoc(d.id, d.data());
            return;
          }
        }

        // 🔥 Kalau SEMUA percobaan gagal, JANGAN dibungkam diam-diam
        // (itu penyebab bug ini gak ketahuan berhari-hari). Catat jelas
        // di console supaya ketahuan kalau memang datanya bermasalah.
        console.warn('[Data Siswa] Dokumen siswa TIDAK DITEMUKAN dengan cara apapun.', {
          dicariSebagaiIdDokumen: id,
          dicariSebagaiStudentId: id,
          nim,
        });
      } catch (e) {
        console.error('[Data Siswa] Gagal memuat dokumen siswa:', e);
      }
    };

    loadStudentDoc();
  }, []);

  // 🔥 BARU: Ambil data semua guru (buat foto profil & nama di card)
  useEffect(() => {
    const fetchTeachersData = async () => {
      try {
        const snap = await getDocs(collection(db, "teachers"));
        setTeachersData(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      } catch (e) {
        console.error("Error fetch teachers:", e);
      }
    };
    fetchTeachersData();
  }, []);

  // ===== FETCH MODULES =====
  const fetchModules = useCallback(async () => {
    const requestId = ++fetchRequestIdRef.current; // 🔥 tandai: ini request paling baru SEJAUH INI
    setLoading(true);
    try {
      // 🔥 FIX BUG: sebelumnya query di sini CUMA ambil modul berstatus
      // "aktif" -- padahal ManageMateri.jsx juga punya opsi status
      // "terjadwal" (buat modul yang di-set nyala di tanggal mendatang),
      // dan TIDAK ADA mekanisme apapun di sistem ini (gak ada cron job,
      // gak ada pengecekan otomatis) yang mengubah status dari "terjadwal"
      // ke "aktif" pas tanggalnya tiba. Akibatnya modul yang guru
      // jadwalkan TERKUNCI SELAMANYA, gak pernah muncul ke siswa sampai
      // ada yang manual masuk edit ganti statusnya. Sekarang query ambil
      // dua-duanya, lalu modul "terjadwal" dianggap "aktif secara efektif"
      // begitu tanggalMulai-nya sudah lewat -- gak perlu ada yang ubah
      // status manual lagi.
      const q = query(
        collection(db, "bimbel_modul"),
        where("status", "in", ["aktif", "terjadwal"]),
        orderBy("updatedAt", "desc")
      );
      const snapshot = await getDocs(q);
      let allModules = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));

      const sekarang = new Date();
      allModules = allModules.filter(m => {
        if (m.status === 'aktif') return true;
        if (m.status === 'terjadwal') {
          if (!m.tanggalMulai) return false; // terjadwal tapi gak ada tanggal -> jangan tampilkan
          return new Date(m.tanggalMulai) <= sekarang;
        }
        return false;
      });

      // 🔥 FIX BUG UTAMA (revisi ke-2, retroaktif — gak perlu buka & simpan
      // ulang tiap kuis manual): daripada cuma andalkan penanda parentModulId
      // yang wajib disimpan ulang dulu di tiap kuis lama, sekarang kita
      // SENDIRI yang nyisir semua modul materi, kumpulkan SEMUA quizId yang
      // disebut di `blocks[].quizId`-nya (itu artinya kuis itu SUDAH nempel
      // ke sebuah materi), lalu buang dokumen manapun yang ID-nya cocok dari
      // listing ini. Ini langsung berlaku ke kuis LAMA yang sudah ada juga,
      // tanpa perlu tindakan tambahan dari guru sama sekali.
      const embeddedQuizIds = new Set();
      allModules.forEach(m => {
        (m.blocks || []).forEach(b => {
          if (b.type === 'quiz' && b.quizId) embeddedQuizIds.add(b.quizId);
        });
      });
      allModules = allModules.filter(m => !embeddedQuizIds.has(m.id) && !m.parentModulId);

      // 🔥 FILTER BERDASARKAN AKSES SISWA
      const { nim, kelas, program, id, enrolledSubjects } = studentData;

      // 🔥 BARU: log ringkasan SEBELUM filter -- kalau daftar modul kosong
      // padahal seharusnya ada, buka Console (F12) dan cari baris
      // '[Cek Daftar Modul Siswa]' ini buat lihat PERSIS data siswa yang
      // dipakai buat nyaring (terutama enrolledSubjects -- kalau ini
      // kosong `[]`, itu tandanya data di database memang belum keisi/
      // belum tersimpan, BUKAN bug di kode penyaringnya).
      console.log('[Cek Daftar Modul Siswa] Data siswa dipakai filter:', {
        nim, kelas, program, id, enrolledSubjects,
        totalModulSebelumFilter: allModules.length,
      });

      const rejectedLog = [];
      allModules = allModules.filter(module => {
        // 1. Cek jika modul dikirim ke siswa tertentu
        if (module.sendToSpecificStudents) {
          const targetIds = module.studentIds || [];
          const selectedIds = (module.selectedStudents || []).map(s => s.studentId || s.id);
          const allTargetIds = [...targetIds, ...selectedIds];
          const ok = allTargetIds.includes(nim) || allTargetIds.includes(id);
          if (!ok) rejectedLog.push({ title: module.title, alasan: 'sendToSpecificStudents tapi siswa ini gak ada di daftar target' });
          return ok;
        }
        
        // 🔥 FIX BUG NYATA (laporan langsung: mapel yang sengaja mencakup
        // banyak jenjang di bawah SATU kode mapel yang sama, kayak
        // "Asisten TKA" buat SD-SMP-SMA sekaligus -- diganti target
        // jenjangnya ke "9 SMP" tapi TETAP muncul di daftar siswa SD): sesi
        // sebelumnya pengecekan kelas DIHAPUS TOTAL dengan asumsi kode
        // mapel udah cukup spesifik per jenjang -- asumsi itu benar buat
        // mapel BIASA (kode terpisah tiap jenjang), tapi SALAH buat mapel
        // yang sengaja dipakai LINTAS jenjang di bawah satu kode yang sama.
        // Target jenjang yang guru pilih jadi satu-satunya pembeda buat
        // kasus itu, dan kemarin gak dicek sama sekali. Sekarang kelas
        // dicek LAGI sebagai syarat TAMBAHAN (AND) -- modul harus lolos
        // DUA-DUANYA. Buat mapel biasa yang target jenjangnya "Semua",
        // gak ada dampak sama sekali.
        const targetKelas = module.targetKelas || 'Semua';
        const matchKelas = targetKelas === 'Semua' || targetKelas === kelas;
        const matchSubject = hasSubjectAccess(enrolledSubjects, module.subject || '', module.kodeMapel || '');

        const ok = matchKelas && matchSubject;
        if (!ok) {
          rejectedLog.push({
            title: module.title, modulSubject: module.subject, modulKodeMapel: module.kodeMapel,
            modulTargetKelas: targetKelas, studentKelas: kelas,
            matchKelas, matchSubject,
          });
        }
        return ok;
      });

      if (rejectedLog.length > 0) {
        console.log('[Cek Daftar Modul Siswa] Modul yang DITOLAK & alasannya:', rejectedLog);
      }
      console.log('[Cek Daftar Modul Siswa] Total modul LOLOS filter:', allModules.length);

      // 🔥 Kalau sudah ada pemanggilan fetchModules() LAIN yang dimulai
      // SETELAH request ini (studentData berubah lagi di tengah proses),
      // hasil request ini sudah BASI -- buang, jangan sampai menimpa
      // hasil dari request yang lebih baru (lihat penjelasan lengkap di
      // fetchRequestIdRef di atas).
      if (requestId !== fetchRequestIdRef.current) { setLoading(false); return; }

      setModules(allModules);
      setFilteredModules(allModules);
      
      // 🔥 FETCH SUBMISSIONS
      let submissionsMapForStats = {};
      if (nim) {
        const [snapTugas, snapKuis] = await Promise.all([
          getDocs(query(collection(db, "jawaban_tugas"), where("studentNim", "==", nim))),
          getDocs(query(collection(db, "jawaban_kuis"), where("studentNim", "==", nim)))
        ]);
        
        const subMap = {};
        snapTugas.forEach(d => { 
          const data = d.data();
          subMap[data.modulId] = { id: d.id, ...data };
        });
        setSubmissions(subMap);
        submissionsMapForStats = subMap;
        
        const quizMap = {};
        snapKuis.forEach(d => { 
          const data = d.data();
          quizMap[data.modulId] = { id: d.id, ...data };
        });
        setQuizSubmissions(quizMap);
      }
      
      // Hitung stats (pakai subMap yang baru di-fetch, BUKAN state submissions yang lama,
      // supaya tidak perlu bikin fetchModules "mendengarkan" perubahan submissions —
      // itu yang menyebabkan loop fetch berulang / tampilan kedip-kedip)
      const modulCount = allModules.filter(m => m.type !== 'kuis_mandiri' && m.blocks?.length > 0).length;
      const tugasCount = allModules.filter(m => m.blocks?.some(b => b.type === 'assignment')).length;
      const kuisCount = allModules.filter(m => m.type === 'kuis_mandiri' || m.quizData?.length > 0).length;
      const submittedCount = allModules.filter(m => submissionsMapForStats[m.id]).length;

      // 🔥 Cek lagi di sini -- ada `await` lain (fetch submissions) sejak
      // pengecekan terakhir, jadi request ini BISA JADI baru jadi basi
      // justru di titik ini.
      if (requestId !== fetchRequestIdRef.current) return;

      setStats({
        total: allModules.length,
        modul: modulCount,
        tugas: tugasCount,
        kuis: kuisCount,
        submitted: submittedCount
      });
      
    } catch (error) {
      console.error("Error fetch modules:", error);
    }
    if (requestId === fetchRequestIdRef.current) setLoading(false); // 🔥 jangan matiin loading kalau ini bukan request terbaru -- biar spinner tetap nunggu hasil yang benar
  }, [studentData]);

  // Fetch saat data siswa berubah
  useEffect(() => {
    fetchModules();
  }, [fetchModules]);

  // 🔥 BARU: kelompokkan modul per guru (guruId), gabungkan dengan data foto/nama guru
  const teacherGroups = useMemo(() => {
    // 🔥 BARU: dulu daftar mapel yang ditampilin di header guru itu SEMUA
    // mapel yang kebetulan diampu guru itu (misal "Fisika SMA, IPAS SD,
    // Kimia SMA") -- padahal siswa yang lihat itu SMA, jadi kelihatan aneh/
    // kurang kredibel ("kok tentor SMA-ku ngajar SD juga?"). Sekarang
    // disaring cuma tampilin mapel yang JENJANGNYA COCOK sama kelas siswa
    // sendiri (SD/SMP/SMA, diambil dari akhiran nama kelas siswa, mis. "12
    // SMA" -> "SMA"). Ini MURNI penyaringan TAMPILAN -- akses tetap
    // ditentukan oleh enrolledSubjects seperti biasa, ini cuma soal apa
    // yang keliatan di layar biar gak bikin persepsi keliru.
    const jenjangSiswa = (() => {
      const k = (studentData.kelas || '').toUpperCase();
      if (k.includes('SMA')) return 'SMA';
      if (k.includes('SMP')) return 'SMP';
      if (k.includes('SD')) return 'SD';
      return null; // gak kenal jenjangnya (mis. English) -> jangan filter, tampilin apa adanya
    })();

    const map = {};
    modules.forEach(m => {
      const gid = m.guruId || 'unknown';
      if (!map[gid]) {
        const teacherDoc = teachersData.find(t => t.guruId === gid);
        map[gid] = {
          guruId: gid,
          nama: teacherDoc?.nama || m.guruName || m.authorName || m.createdBy || 'Guru',
          fotoUrl: teacherDoc?.fotoUrl || '',
          mapelSet: new Set(),
          moduleCount: 0,
        };
      }
      // 🔥 FIX BUG NYATA: `Set` cuma buang duplikat kalau STRING-nya PERSIS
      // SAMA -- kalau ada modul lama vs baru yang nyimpen "Bahasa Indonesia
      // SMA" dengan spasi nyempil/beda kapitalisasi dikit, itu keanggep DUA
      // nilai beda oleh Set, jadi tetap nongol dobel di daftar (persis kasus
      // "BAHASA INDONESIA SMA, BAHASA INDONESIA SMA, ..." yang dilaporkan).
      // Sekarang di-trim dulu sebelum masuk Set, biar duplikat karena
      // whitespace nyempil beneran kebuang.
      const subjTrim = m.subject ? String(m.subject).trim() : '';
      // Filter jenjang: kalau kita KENAL jenjang siswa ini, cuma masukin
      // mapel yang nama-nya mengandung jenjang itu juga.
      const cocokJenjang = !jenjangSiswa || subjTrim.toUpperCase().includes(jenjangSiswa);
      if (subjTrim && cocokJenjang) map[gid].mapelSet.add(subjTrim);
      map[gid].moduleCount += 1;
    });
    return Object.values(map)
      .map(g => ({ ...g, mapelList: Array.from(g.mapelSet) }))
      .sort((a, b) => a.nama.localeCompare(b.nama));
  }, [modules, teachersData, studentData.kelas]);

  const selectedTeacher = teacherGroups.find(g => g.guruId === selectedGuruId) || null;

  // ===== FILTER MODULES =====
  useEffect(() => {
    // 🔥 Kalau lagi di mode "Per Guru" dan sudah pilih 1 guru, filter dulu berdasarkan guru itu
    const baseModules = (viewGroupMode === 'perGuru' && selectedGuruId)
      ? modules.filter(m => (m.guruId || 'unknown') === selectedGuruId)
      : modules;

    let filtered = baseModules;
    
    // Search
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(m => 
        (m.title || '').toLowerCase().includes(term) ||
        (m.subject || '').toLowerCase().includes(term) ||
        (m.kodeMapel || '').toLowerCase().includes(term) ||
        (m.description || '').toLowerCase().includes(term) ||
        (m.guruName || '').toLowerCase().includes(term) ||
        (m.authorName || '').toLowerCase().includes(term)
      );
    }
    
    // Filter type
    if (filterType === 'modul') {
      filtered = filtered.filter(m => m.type !== 'kuis_mandiri' && m.blocks?.length > 0);
    } else if (filterType === 'tugas') {
      filtered = filtered.filter(m => m.blocks?.some(b => b.type === 'assignment'));
    } else if (filterType === 'kuis') {
      filtered = filtered.filter(m => m.type === 'kuis_mandiri' || m.quizData?.length > 0);
    }
    
    // Filter mapel
    if (filterMapel !== 'all') {
      filtered = filtered.filter(m => 
        m.subject === filterMapel || m.kodeMapel === filterMapel
      );
    }
    
    setFilteredModules(filtered);
  }, [searchTerm, filterType, filterMapel, modules, viewGroupMode, selectedGuruId]);

  // ===== GET MAPEL UNIK =====
  const mapelOptions = useMemo(() => {
    const mapelSet = new Set();
    const source = (viewGroupMode === 'perGuru' && selectedGuruId)
      ? modules.filter(m => (m.guruId || 'unknown') === selectedGuruId)
      : modules;
    source.forEach(m => {
      if (m.subject) mapelSet.add(m.subject);
      if (m.kodeMapel) mapelSet.add(m.kodeMapel);
    });
    return ['all', ...Array.from(mapelSet)];
  }, [modules, viewGroupMode, selectedGuruId]);

  // ===== HANDLERS =====
  const handleModuleClick = (moduleId) => {
    setSelectedModuleId(moduleId);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBack = () => {
    setSelectedModuleId(null);
  };

  const handleSelectTeacher = (guruId) => {
    setSelectedGuruId(guruId);
    setSearchTerm('');
    setFilterType('all');
    setFilterMapel('all');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBackToTeachers = () => {
    setSelectedGuruId(null);
    setSearchTerm('');
    setFilterType('all');
    setFilterMapel('all');
  };

  const clearFilters = () => {
    setSearchTerm('');
    setFilterMapel('all');
    setFilterType('all');
    setShowFilters(false);
  };

  const hasActiveFilters = searchTerm || filterMapel !== 'all' || filterType !== 'all';

  // ============================================================
  // 🔥 RENDER: TEACHER CARD
  // ============================================================
  const renderTeacherCard = (teacher) => (
    <div
      key={teacher.guruId}
      onClick={() => handleSelectTeacher(teacher.guruId)}
      style={teacherCardStyles.card}
    >
      <div style={teacherCardStyles.avatarWrap}>
        {teacher.fotoUrl ? (
          <img src={teacher.fotoUrl} alt={teacher.nama} style={teacherCardStyles.avatarImg} />
        ) : (
          <div style={{ ...teacherCardStyles.avatarPlaceholder, background: colorForName(teacher.nama) }}>
            {teacher.nama?.charAt(0)?.toUpperCase() || 'G'}
          </div>
        )}
      </div>
      <div style={teacherCardStyles.body}>
        <h3 style={teacherCardStyles.name}>{teacher.nama}</h3>
        <div style={teacherCardStyles.mapelRow}>
          {teacher.mapelList.length > 0 ? (
            teacher.mapelList.slice(0, 3).map(mp => (
              <span key={mp} style={teacherCardStyles.mapelBadge}>{mp}</span>
            ))
          ) : (
            <span style={teacherCardStyles.mapelBadge}>Umum</span>
          )}
          {teacher.mapelList.length > 3 && (
            <span style={teacherCardStyles.mapelBadgeMore}>+{teacher.mapelList.length - 3}</span>
          )}
        </div>
        <div style={teacherCardStyles.countRow}>
          <BookOpen size={12} /> {teacher.moduleCount} materi
        </div>
      </div>
      <ChevronRight size={18} color="#94a3b8" />
    </div>
  );

  // ============================================================
  // RENDER: MODULE CARD
  // ============================================================
  const renderModuleCard = (module) => {
    const isQuiz = module.type === 'kuis_mandiri';
    const hasAssignment = module.blocks?.some(b => b.type === 'assignment');
    const hasQuiz = module.quizData?.length > 0;
    const coverImage = module.coverImage || null;
    const isForAll = module.targetKelas === 'Semua';
    const isSubmitted = !!submissions[module.id];
    const isQuizDone = !!quizSubmissions[module.id];
    const quizScore = quizSubmissions[module.id]?.score || 0;
    const guruName = module.guruName || module.authorName || module.createdBy || 'Guru';
    
    return (
      <div 
        key={module.id} 
        onClick={() => handleModuleClick(module.id)}
        style={cardStyles.card}
      >
        <div style={cardStyles.cover}>
          {coverImage ? (
            <img src={coverImage} alt={module.title} style={cardStyles.coverImage} />
          ) : (
            <div style={cardStyles.coverPlaceholder}>
              {isQuiz ? <FileQuestion size={40} color="#8b5cf6" /> : <BookOpen size={40} color="#3b82f6" />}
            </div>
          )}
          <div style={cardStyles.badgeTop}>
            <span style={{...cardStyles.badge, background: isQuiz ? '#8b5cf6' : '#3b82f6', color: 'white' }}>
              {isQuiz ? <><FileQuestion size={10} /> Kuis</> : <><BookOpen size={10} /> Modul</>}
            </span>
            {module.kodeMapel && (
              <span style={{...cardStyles.badge, background: '#ede9fe', color: '#8b5cf6' }}>
                <Tag size={10} /> {module.kodeMapel}
              </span>
            )}
            {module.guruId && (
              <span style={{...cardStyles.badge, background: '#eef2ff', color: '#3b82f6' }}>
                <Hash size={10} /> {module.guruId}
              </span>
            )}
          </div>
          <div style={cardStyles.badgeBottom}>
            <span style={{...cardStyles.badge, background: isForAll ? '#fef3c7' : '#e0e7ff', color: isForAll ? '#b45309' : '#3730a3' }}>
              {isForAll ? '🌐 Semua' : `🎓 ${module.targetKelas}`}
            </span>
            {module.targetKategori && module.targetKategori !== 'Semua' && (
              <span style={{...cardStyles.badge, background: '#fce7f3', color: '#be185d' }}>
                {module.targetKategori}
              </span>
            )}
            {isSubmitted && (
              <span style={{...cardStyles.badge, background: '#dcfce7', color: '#10b981' }}>
                <CheckCircle size={10} /> Tugas
              </span>
            )}
            {isQuizDone && (
              <span style={{...cardStyles.badge, background: '#dcfce7', color: '#10b981' }}>
                <CheckCircle size={10} /> Kuis {quizScore > 0 && `(${quizScore})`}
              </span>
            )}
          </div>
        </div>
        <div style={cardStyles.body}>
          <h3 style={cardStyles.title}>{module.title}</h3>
          <div style={cardStyles.subject}>
            <BookOpen size={12} /> {module.subject || 'Materi'}
            <span style={cardStyles.authorTag}><User size={10} /> {guruName}</span>
          </div>
          <div style={cardStyles.meta}>
            {hasAssignment && <span style={cardStyles.metaItem}><Send size={10} /> Tugas</span>}
            {hasQuiz && <span style={cardStyles.metaItem}><HelpCircle size={10} /> Kuis</span>}
            {module.blocks?.length > 0 && (
              <span style={cardStyles.metaItem}><Layers size={10} /> {module.blocks.length}</span>
            )}
          </div>
          <button style={cardStyles.btn}>
            Buka <ChevronRight size={14} />
          </button>
        </div>
      </div>
    );
  };

  const teacherCardStyles = {
    card: {
      background: 'white', borderRadius: 16, padding: 16,
      display: 'flex', alignItems: 'center', gap: 14,
      cursor: 'pointer', transition: '0.2s',
      border: '1px solid #f1f5f9', boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
    },
    avatarWrap: { flexShrink: 0 },
    avatarImg: { width: 56, height: 56, borderRadius: '50%', objectFit: 'cover', border: '2px solid #f1f5f9' },
    avatarPlaceholder: {
      width: 56, height: 56, borderRadius: '50%', display: 'flex',
      alignItems: 'center', justifyContent: 'center', color: 'white',
      fontWeight: 800, fontSize: 20
    },
    body: { flex: 1, minWidth: 0 },
    name: { margin: '0 0 6px', fontSize: 15, fontWeight: 800, color: '#1e293b' },
    mapelRow: { display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 6 },
    mapelBadge: {
      fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 10,
      background: '#e0e7ff', color: '#3730a3'
    },
    mapelBadgeMore: {
      fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 10,
      background: '#f1f5f9', color: '#64748b'
    },
    countRow: {
      fontSize: 11, color: '#94a3b8', display: 'flex', alignItems: 'center', gap: 4
    }
  };

  const cardStyles = {
    card: { 
      background: 'white', borderRadius: 16, overflow: 'hidden', 
      cursor: 'pointer', transition: 'all 0.3s ease', 
      boxShadow: '0 2px 8px rgba(0,0,0,0.04)', 
      border: '1px solid #f1f5f9', 
      height: '100%', display: 'flex', flexDirection: 'column' 
    },
    cover: { 
      position: 'relative', height: 140, 
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', 
      overflow: 'hidden', flexShrink: 0 
    },
    coverImage: { width: '100%', height: '100%', objectFit: 'cover' },
    coverPlaceholder: { 
      width: '100%', height: '100%', display: 'flex', 
      alignItems: 'center', justifyContent: 'center',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' 
    },
    badgeTop: { 
      position: 'absolute', top: 10, left: 10, 
      display: 'flex', gap: 4, flexWrap: 'wrap' 
    },
    badgeBottom: { 
      position: 'absolute', bottom: 10, left: 10, 
      display: 'flex', gap: 4, flexWrap: 'wrap' 
    },
    badge: { 
      display: 'inline-flex', alignItems: 'center', gap: 4, 
      padding: '2px 10px', borderRadius: 12, fontSize: 9, 
      fontWeight: 700, background: 'rgba(255,255,255,0.9)',
      boxShadow: '0 1px 4px rgba(0,0,0,0.05)'
    },
    body: { padding: 14, flex: 1, display: 'flex', flexDirection: 'column' },
    title: { 
      fontSize: 14, fontWeight: 700, color: '#1e293b', 
      margin: '0 0 4px', lineHeight: 1.3 
    },
    subject: { 
      fontSize: 11, color: '#64748b', display: 'flex', 
      alignItems: 'center', gap: 8, marginBottom: 8, flexWrap: 'wrap' 
    },
    authorTag: { 
      fontSize: 9, color: '#3b82f6', background: '#eef2ff', 
      padding: '1px 8px', borderRadius: 10, display: 'inline-flex', 
      alignItems: 'center', gap: 2 
    },
    meta: { 
      display: 'flex', gap: 6, flexWrap: 'wrap', 
      marginBottom: 10, marginTop: 'auto' 
    },
    metaItem: { 
      fontSize: 9, padding: '2px 8px', borderRadius: 10, 
      background: '#f1f5f9', color: '#64748b', 
      display: 'inline-flex', alignItems: 'center', gap: 3 
    },
    btn: { 
      width: '100%', padding: 8, background: '#3b82f6', 
      color: 'white', border: 'none', borderRadius: 8, 
      fontSize: 11, fontWeight: 700, cursor: 'pointer', 
      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 
    }
  };

  // ============================================================
  // LOADING STATE
  // ============================================================
  if (loading && modules.length === 0) {
    return (
      <div style={listStyles.container}>
        <div style={listStyles.loading}>
          <div style={listStyles.spinner}></div>
          <p>Memuat materi pembelajaran...</p>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      </div>
    );
  }

  // ============================================================
  // DETAIL VIEW
  // 🔥 FIX BUG PENTING: sebelumnya SEMUA item (termasuk kuis mandiri yang
  // tidak ditautkan ke modul) selalu dibuka pakai StudentModuleView (tampilan
  // materi) — karena StudentQuizView tidak pernah dipanggil di sini sama
  // sekali. Akibatnya kuis mandiri muncul sebagai "Materi (0)" kosong dan
  // siswa tidak bisa mengerjakannya. Sekarang dicek dulu tipe kontennya:
  // kalau kuis mandiri -> StudentQuizView, kalau bukan -> StudentModuleView.
  // ============================================================
  if (selectedModuleId) {
    const selectedModuleData = modules.find(m => m.id === selectedModuleId);
    const isSelectedQuiz = selectedModuleData?.type === 'kuis_mandiri';

    return (
      <div style={{ width: '100%', padding: isMobile ? 10 : 20, boxSizing: 'border-box' }}>
        <button 
          onClick={handleBack}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            background: 'white', border: '1px solid #e2e8f0',
            padding: '8px 16px', borderRadius: 10,
            cursor: 'pointer', fontSize: 13, fontWeight: 600,
            marginBottom: 16
          }}
        >
          <ArrowLeft size={16} /> Kembali ke Daftar
        </button>
        {isSelectedQuiz ? (
          <StudentQuizView
            modulId={selectedModuleId}
            onBack={handleBack}
            studentData={studentData}
          />
        ) : (
          <StudentModuleView 
            modulId={selectedModuleId} 
            onBack={handleBack}
            studentData={studentData}
          />
        )}
      </div>
    );
  }

  // ============================================================
  // LIST VIEW
  // ============================================================
  const showTeacherGrid = viewGroupMode === 'perGuru' && !selectedGuruId;

  return (
    <div style={listStyles.container}>
      {/* HEADER */}
      <div style={listStyles.header}>
        <div>
          <h1 style={listStyles.title}>
            <BookOpen size={28} color="#652D90" /> E-Learning
          </h1>
          <p style={listStyles.subtitle}>
            {studentData.name} • {studentData.program} • 
            {studentData.kelas ? ` Kelas ${studentData.kelas}` : ' Semua Kelas'}
            {studentData.nim && (
              <span style={listStyles.nimBadge}>
                <Hash size={10} /> {studentData.nim}
              </span>
            )}
          </p>
        </div>
        {!showTeacherGrid && (
          <div style={listStyles.viewToggle}>
            <button 
              onClick={() => setViewMode('grid')} 
              style={{...listStyles.viewBtn, background: viewMode === 'grid' ? '#652D90' : '#f1f5f9', color: viewMode === 'grid' ? 'white' : '#64748b' }}
            >
              <Grid3x3 size={16} />
            </button>
            <button 
              onClick={() => setViewMode('list')} 
              style={{...listStyles.viewBtn, background: viewMode === 'list' ? '#652D90' : '#f1f5f9', color: viewMode === 'list' ? 'white' : '#64748b' }}
            >
              <List size={16} />
            </button>
          </div>
        )}
      </div>

      {/* STATS */}
      <div style={listStyles.statsRow}>
        <div style={listStyles.statItem}>
          <span style={listStyles.statValue}>{stats.total}</span>
          <span style={listStyles.statLabel}>📚 Modul</span>
        </div>
        <div style={listStyles.statItem}>
          <span style={listStyles.statValue}>{stats.tugas}</span>
          <span style={listStyles.statLabel}>📝 Tugas</span>
        </div>
        <div style={listStyles.statItem}>
          <span style={listStyles.statValue}>{stats.kuis}</span>
          <span style={listStyles.statLabel}>❓ Kuis</span>
        </div>
        <div style={{...listStyles.statItem, background: '#f0fdf4', borderColor: '#bbf7d0'}}>
          <span style={{...listStyles.statValue, color: '#10b981'}}>
            {stats.submitted}
          </span>
          <span style={listStyles.statLabel}>✅ Selesai</span>
        </div>
      </div>

      {/* 🔥 TOGGLE MODE TAMPILAN */}
      <div style={listStyles.groupToggle}>
        <button
          onClick={() => { setViewGroupMode('perGuru'); setSelectedGuruId(null); clearFilters(); }}
          style={{
            ...listStyles.groupToggleBtn,
            background: viewGroupMode === 'perGuru' ? '#652D90' : '#f1f5f9',
            color: viewGroupMode === 'perGuru' ? 'white' : '#64748b'
          }}
        >
          <Users size={14} /> Per Guru
        </button>
        <button
          onClick={() => { setViewGroupMode('semua'); setSelectedGuruId(null); clearFilters(); }}
          style={{
            ...listStyles.groupToggleBtn,
            background: viewGroupMode === 'semua' ? '#652D90' : '#f1f5f9',
            color: viewGroupMode === 'semua' ? 'white' : '#64748b'
          }}
        >
          <BookOpen size={14} /> Semua Modul
        </button>
      </div>

      {/* 🔥 TAMPILAN 1: GRID GURU (default) */}
      {showTeacherGrid ? (
        teacherGroups.length === 0 ? (
          <div style={listStyles.emptyState}>
            <Users size={56} color="#cbd5e1" />
            <h3 style={listStyles.emptyTitle}>Belum Ada Guru</h3>
            <p style={listStyles.emptyDesc}>Belum ada modul yang tersedia untuk kamu saat ini.</p>
          </div>
        ) : (
          <div style={listStyles.teacherGrid}>
            {teacherGroups.map(t => renderTeacherCard(t))}
          </div>
        )
      ) : (
        <>
          {/* Header saat lagi di dalam materi 1 guru */}
          {viewGroupMode === 'perGuru' && selectedTeacher && (
            <div style={listStyles.teacherHeaderBar}>
              <button onClick={handleBackToTeachers} style={listStyles.backToTeachersBtn}>
                <ArrowLeft size={14} /> Semua Guru
              </button>
              <div style={listStyles.teacherHeaderInfo}>
                {selectedTeacher.fotoUrl ? (
                  <img src={selectedTeacher.fotoUrl} alt={selectedTeacher.nama} style={listStyles.teacherHeaderAvatarImg} />
                ) : (
                  <div style={{ ...listStyles.teacherHeaderAvatarPlaceholder, background: colorForName(selectedTeacher.nama) }}>
                    {selectedTeacher.nama?.charAt(0)?.toUpperCase() || 'G'}
                  </div>
                )}
                <div>
                  <div style={listStyles.teacherHeaderName}>{selectedTeacher.nama}</div>
                  <div style={listStyles.teacherHeaderMapel}>{selectedTeacher.mapelList.join(', ') || 'Umum'}</div>
                </div>
              </div>
            </div>
          )}

          {/* FILTER BAR */}
          <div style={listStyles.filterBar}>
            <div style={listStyles.searchBox}>
              <Search size={18} color="#94a3b8" />
              <input 
                type="text" 
                placeholder="Cari judul, mapel, ID guru..." 
                value={searchTerm} 
                onChange={e => setSearchTerm(e.target.value)} 
                style={listStyles.searchInput} 
              />
              {searchTerm && (
                <button onClick={() => setSearchTerm('')} style={listStyles.clearBtn}>✕</button>
              )}
            </div>
            <button 
              onClick={() => setShowFilters(!showFilters)} 
              style={{
                ...listStyles.filterBtn,
                background: hasActiveFilters ? '#3b82f6' : '#f1f5f9',
                color: hasActiveFilters ? 'white' : '#64748b'
              }}
            >
              <Filter size={14} /> Filter
              {hasActiveFilters && <span style={listStyles.filterDot}>●</span>}
            </button>
            {hasActiveFilters && (
              <button onClick={clearFilters} style={listStyles.clearFilterBtn}>
                <X size={12} /> Reset
              </button>
            )}
          </div>

          {/* ADVANCED FILTERS */}
          {showFilters && (
            <div style={listStyles.advancedFilters}>
              <select 
                value={filterType} 
                onChange={e => setFilterType(e.target.value)} 
                style={listStyles.filterSelect}
              >
                <option value="all">📚 Semua</option>
                <option value="modul">📖 Modul</option>
                <option value="tugas">📝 Tugas</option>
                <option value="kuis">❓ Kuis</option>
              </select>
              <select 
                value={filterMapel} 
                onChange={e => setFilterMapel(e.target.value)} 
                style={listStyles.filterSelect}
              >
                <option value="all">📖 Semua Mapel</option>
                {mapelOptions.filter(s => s !== 'all').map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
          )}

          {/* FILTER INFO */}
          {hasActiveFilters && (
            <div style={listStyles.filterInfo}>
              <span>🔍 {filteredModules.length} modul</span>
              {filterType !== 'all' && (
                <span style={listStyles.filterTag}>📋 {filterType}</span>
              )}
              {filterMapel !== 'all' && (
                <span style={listStyles.filterTag}>📖 {filterMapel}</span>
              )}
            </div>
          )}

          {/* CONTENT */}
          {filteredModules.length === 0 ? (
            <div style={listStyles.emptyState}>
              <BookOpen size={56} color="#cbd5e1" />
              <h3 style={listStyles.emptyTitle}>Tidak Ada Modul</h3>
              <p style={listStyles.emptyDesc}>
                {searchTerm ? 'Coba ubah kata kunci pencarian' : 
                 `Belum ada modul untuk ${studentData.program}${studentData.kelas ? ` - Kelas ${studentData.kelas}` : ''}`}
              </p>
            </div>
          ) : viewMode === 'grid' ? (
            <div style={listStyles.grid}>
              {filteredModules.map(module => renderModuleCard(module))}
            </div>
          ) : (
            <div style={listStyles.list}>
              {filteredModules.map(module => {
                const isQuiz = module.type === 'kuis_mandiri';
                const hasAssignment = module.blocks?.some(b => b.type === 'assignment');
                const isSubmitted = !!submissions[module.id];
                const isQuizDone = !!quizSubmissions[module.id];
                const guruName = module.guruName || module.authorName || module.createdBy || 'Guru';
                
                return (
                  <div 
                    key={module.id} 
                    onClick={() => handleModuleClick(module.id)} 
                    style={listStyles.listItem}
                  >
                    <div style={listStyles.listItemIcon}>
                      {isQuiz ? <FileQuestion size={20} color="#8b5cf6" /> : <BookOpen size={20} color="#3b82f6" />}
                    </div>
                    <div style={listStyles.listItemContent}>
                      <div style={listStyles.listItemHeader}>
                        <span style={listStyles.listItemTitle}>{module.title}</span>
                        {module.kodeMapel && (
                          <span style={listStyles.listItemTag}><Tag size={8} /> {module.kodeMapel}</span>
                        )}
                        {module.guruId && (
                          <span style={listStyles.listItemTag}><Hash size={8} /> {module.guruId}</span>
                        )}
                        {isSubmitted && (
                          <span style={{...listStyles.listItemTag, background: '#dcfce7', color: '#10b981' }}>
                            ✅ Tugas
                          </span>
                        )}
                        {isQuizDone && (
                          <span style={{...listStyles.listItemTag, background: '#dcfce7', color: '#10b981' }}>
                            ✅ Kuis
                          </span>
                        )}
                      </div>
                      <div style={listStyles.listItemMeta}>
                        <span>{module.subject || 'Materi'}</span>
                        <span><User size={10} /> {guruName}</span>
                        {hasAssignment && <span>📝 Tugas</span>}
                        {module.blocks?.length > 0 && <span>📄 {module.blocks.length} konten</span>}
                      </div>
                    </div>
                    <ChevronRight size={18} color="#94a3b8" />
                  </div>
                );
              })}
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
const listStyles = {
  container: { 
    width: '100%', padding: '20px', boxSizing: 'border-box', 
    minHeight: '100vh', background: '#f8fafc' 
  },
  loading: {
    display: 'flex', flexDirection: 'column', alignItems: 'center',
    justifyContent: 'center', height: '70vh', gap: 16,
    color: '#94a3b8', fontSize: 13
  },
  spinner: {
    width: 40, height: 40, border: '4px solid #e2e8f0',
    borderTop: '4px solid #652D90', borderRadius: '50%',
    animation: 'spin 1s linear infinite'
  },
  header: { 
    display: 'flex', justifyContent: 'space-between', 
    alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 12 
  },
  title: { 
    fontSize: 24, fontWeight: 800, color: '#1e293b', 
    margin: 0, display: 'flex', alignItems: 'center', gap: 8 
  },
  subtitle: { 
    fontSize: 13, color: '#64748b', margin: '4px 0 0' 
  },
  nimBadge: { 
    display: 'inline-flex', alignItems: 'center', gap: 3, 
    background: '#eef2ff', color: '#3b82f6', 
    padding: '1px 8px', borderRadius: 10, fontSize: 10, 
    fontWeight: 600, marginLeft: 6 
  },
  viewToggle: { 
    display: 'flex', gap: 4, background: '#f1f5f9', 
    padding: 4, borderRadius: 10 
  },
  viewBtn: { 
    padding: '8px 10px', borderRadius: 8, border: 'none', 
    cursor: 'pointer', display: 'flex', alignItems: 'center', 
    justifyContent: 'center' 
  },
  statsRow: { 
    display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', 
    gap: 12, marginBottom: 20 
  },
  statItem: { 
    background: 'white', padding: '12px 16px', borderRadius: 12, 
    border: '1px solid #f1f5f9', textAlign: 'center' 
  },
  statValue: { fontSize: 18, fontWeight: 900, color: '#1e293b', display: 'block' },
  statLabel: { fontSize: 10, color: '#94a3b8', fontWeight: 500 },

  // 🔥 Toggle Per Guru / Semua Modul
  groupToggle: {
    display: 'flex', gap: 6, marginBottom: 16, background: 'white',
    padding: 6, borderRadius: 12, border: '1px solid #f1f5f9', width: 'fit-content'
  },
  groupToggleBtn: {
    padding: '8px 16px', borderRadius: 8, border: 'none', cursor: 'pointer',
    fontSize: 12, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6,
    transition: '0.2s'
  },

  // 🔥 Grid kartu guru
  teacherGrid: {
    display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
    gap: 14
  },

  // 🔥 Header saat sudah masuk ke materi 1 guru
  teacherHeaderBar: {
    display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16, flexWrap: 'wrap'
  },
  backToTeachersBtn: {
    display: 'inline-flex', alignItems: 'center', gap: 6,
    background: 'white', border: '1px solid #e2e8f0',
    padding: '8px 14px', borderRadius: 10, cursor: 'pointer',
    fontSize: 12, fontWeight: 700, color: '#475569'
  },
  teacherHeaderInfo: { display: 'flex', alignItems: 'center', gap: 10 },
  teacherHeaderAvatarImg: { width: 40, height: 40, borderRadius: '50%', objectFit: 'cover', border: '2px solid #f1f5f9' },
  teacherHeaderAvatarPlaceholder: {
    width: 40, height: 40, borderRadius: '50%', display: 'flex',
    alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 800, fontSize: 15
  },
  teacherHeaderName: { fontSize: 14, fontWeight: 800, color: '#1e293b' },
  teacherHeaderMapel: { fontSize: 11, color: '#64748b' },
  
  filterBar: { 
    display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' 
  },
  searchBox: { 
    flex: 2, display: 'flex', alignItems: 'center', gap: 8, 
    background: 'white', padding: '8px 14px', borderRadius: 10, 
    border: '1px solid #e2e8f0', minWidth: 200 
  },
  searchInput: { 
    flex: 1, border: 'none', outline: 'none', fontSize: 13, 
    background: 'transparent' 
  },
  clearBtn: { 
    background: 'none', border: 'none', color: '#94a3b8', 
    cursor: 'pointer', fontSize: 14 
  },
  filterBtn: { 
    border: 'none', padding: '8px 14px', borderRadius: 10, 
    cursor: 'pointer', fontSize: 12, fontWeight: 600, 
    display: 'flex', alignItems: 'center', gap: 4 
  },
  filterDot: {
    background: 'white', color: '#3b82f6', borderRadius: '50%',
    padding: '1px 5px', fontSize: 7, marginLeft: 2
  },
  clearFilterBtn: {
    background: 'none', border: 'none', color: '#ef4444',
    cursor: 'pointer', fontSize: 12, display: 'flex', alignItems: 'center', gap: 3
  },
  advancedFilters: {
    display: 'flex', gap: 10, flexWrap: 'wrap',
    padding: 12, background: 'white', borderRadius: 12,
    border: '1px solid #f1f5f9', marginBottom: 12
  },
  filterSelect: {
    padding: '8px 12px', borderRadius: 8, border: '1px solid #e2e8f0',
    fontSize: 12, background: 'white', flex: 1, minWidth: 120,
    cursor: 'pointer', outline: 'none'
  },
  filterInfo: {
    fontSize: 11, color: '#3b82f6', marginBottom: 12,
    display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center'
  },
  filterTag: {
    background: '#eef2ff', padding: '2px 10px', borderRadius: 12,
    fontSize: 10, fontWeight: 600
  },
  grid: { 
    display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', 
    gap: 16 
  },
  list: { display: 'flex', flexDirection: 'column', gap: 8 },
  listItem: { 
    display: 'flex', alignItems: 'center', gap: 12, 
    background: 'white', padding: '12px 16px', borderRadius: 12, 
    border: '1px solid #e2e8f0', cursor: 'pointer', transition: '0.2s' 
  },
  listItemIcon: { 
    width: 40, height: 40, borderRadius: 10, background: '#f8fafc',
    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 
  },
  listItemContent: { flex: 1, minWidth: 0 },
  listItemHeader: { display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  listItemTitle: { fontSize: 14, fontWeight: 700, color: '#1e293b' },
  listItemTag: { 
    display: 'inline-flex', alignItems: 'center', gap: 2,
    background: '#f1f5f9', padding: '1px 6px', borderRadius: 4, fontSize: 9,
    color: '#64748b'
  },
  listItemMeta: { display: 'flex', gap: 8, fontSize: 11, color: '#94a3b8', marginTop: 2, flexWrap: 'wrap' },
  emptyState: { 
    textAlign: 'center', padding: '60px 20px', background: 'white', 
    borderRadius: 16, border: '2px dashed #e2e8f0', color: '#94a3b8' 
  },
  emptyTitle: { fontSize: 18, fontWeight: 700, color: '#64748b', margin: '12px 0 4px' },
  emptyDesc: { fontSize: 13 }
};

export default StudentElearning;