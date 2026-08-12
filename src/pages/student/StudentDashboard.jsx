// src/pages/student/StudentDashboard.jsx
import React, { useState, useEffect } from 'react';
import { db, auth } from '../../firebase';
import { collection, query, getDocs, orderBy, doc, getDoc, setDoc, deleteDoc, addDoc, serverTimestamp, where, limit } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { Html5Qrcode } from "html5-qrcode";
import { useNavigate } from 'react-router-dom';
import { RAPORT_COLLECTIONS } from '../../firebase/raportCollection';

import {
  BookOpen, Calendar, ClipboardList, X, Camera, User, MapPin,
  Trophy, ArrowRight, AlertCircle, Award, Bell, Download,
  Trash2, FileQuestion, FileText, DollarSign, Sparkles, Inbox,
  Megaphone, RefreshCw
} from 'lucide-react';

// ============================================================
// IKON & WARNA PER TIPE NOTIFIKASI
// ============================================================
const NOTIF_META = {
  materi: { icon: <BookOpen size={16} />, color: '#3b82f6', bg: '#eff6ff', label: 'Materi Baru' },
  kuis: { icon: <FileQuestion size={16} />, color: '#8b5cf6', bg: '#f5f3ff', label: 'Kuis Baru' },
  tugas: { icon: <ClipboardList size={16} />, color: '#f59e0b', bg: '#fffbeb', label: 'Tugas Baru' },
  survei: { icon: <Sparkles size={16} />, color: '#06b6d4', bg: '#ecfeff', label: 'Survei' },
  tagihan: { icon: <DollarSign size={16} />, color: '#ef4444', bg: '#fef2f2', label: 'Tagihan' },
  hasil_kuis: { icon: <Award size={16} />, color: '#10b981', bg: '#f0fdf4', label: 'Hasil Keluar' },
  pengumuman: { icon: <Megaphone size={16} />, color: '#64748b', bg: '#f8fafc', label: 'Pengumuman' },
};

const timeAgo = (ts) => {
  if (!ts?.toDate) return '';
  const diffMs = Date.now() - ts.toDate().getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'Baru saja';
  if (mins < 60) return `${mins} menit lalu`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} jam lalu`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} hari lalu`;
  return ts.toDate().toLocaleDateString('id-ID');
};

// Sapaan berdasarkan jam
const getGreeting = () => {
  const h = new Date().getHours();
  if (h < 4) return { text: 'Selamat malam', icon: '🌙' };
  if (h < 11) return { text: 'Selamat pagi', icon: '☀️' };
  if (h < 15) return { text: 'Selamat siang', icon: '🌤️' };
  if (h < 18) return { text: 'Selamat sore', icon: '🌇' };
  return { text: 'Selamat malam', icon: '🌙' };
};

// Skeleton loading sederhana
const SkeletonLines = ({ count = 3 }) => (
  <div>
    {Array.from({ length: count }).map((_, i) => (
      <div key={i} style={{
        height: 14, borderRadius: 6, marginBottom: 10,
        width: i === count - 1 ? '60%' : '100%',
        background: 'linear-gradient(90deg,#f1f5f9 25%,#e2e8f0 37%,#f1f5f9 63%)',
        backgroundSize: '400% 100%', animation: 'skeletonShine 1.4s ease infinite',
      }} />
    ))}
  </div>
);

// 🔥 Bagan bundar kehadiran — pakai SVG murni, gak perlu library tambahan
const AttendanceDonut = ({ hadir, izin, alpha, total }) => {
  const size = 110, stroke = 14, radius = (size - stroke) / 2, circumference = 2 * Math.PI * radius;

  if (total === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '20px 0', color: '#94a3b8', fontSize: 12 }}>
        📭 Belum ada data kehadiran
      </div>
    );
  }

  const segments = [
    { value: hadir, color: '#10b981' },
    { value: izin, color: '#f59e0b' },
    { value: alpha, color: '#ef4444' },
  ];
  let offsetAcc = 0;

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 18, flexWrap: 'wrap' }}>
      <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
        <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
          <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#f1f5f9" strokeWidth={stroke} />
          {segments.map((seg, i) => {
            if (seg.value === 0) return null;
            const segLen = (seg.value / total) * circumference;
            const dash = `${segLen} ${circumference - segLen}`;
            const dashoffset = -offsetAcc;
            offsetAcc += segLen;
            return (
              <circle
                key={i} cx={size / 2} cy={size / 2} r={radius} fill="none"
                stroke={seg.color} strokeWidth={stroke} strokeDasharray={dash}
                strokeDashoffset={dashoffset} strokeLinecap="round"
                style={{ transition: 'stroke-dasharray 0.5s ease' }}
              />
            );
          })}
        </svg>
        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ fontSize: 22, fontWeight: 900, color: '#1e293b' }}>{total > 0 ? Math.round((hadir / total) * 100) : 0}%</span>
          <span style={{ fontSize: 9, color: '#94a3b8', fontWeight: 700 }}>HADIR</span>
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#10b981' }} /> Hadir: <b>{hadir}</b>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#f59e0b' }} /> Izin/Sakit: <b>{izin}</b>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#ef4444' }} /> Alpha: <b>{alpha}</b>
        </div>
      </div>
    </div>
  );
};

// ============================================================
// 🔥 CEK AKSES MAPEL (paket 1 mapel / 2 mapel / paket lengkap)
// ============================================================
// Pola & alasan sama persis dengan StudentModuleView.jsx (halaman baca
// materi) -- ditaruh di sini juga supaya daftar modul yang tampil di
// dashboard SUDAH tersaring dari awal (siswa gak perlu lihat modul yang
// nanti bakal ditolak aksesnya pas diklik). `enrolledSubjects` diisi lewat
// halaman administrasi siswa: `["Matematika"]` buat siswa 1 mapel, atau
// `["Semua"]` buat paket lengkap. Kalau belum diisi (siswa lama), akses
// TETAP PENUH -- gak ada yang tiba-tiba keblokir.
// 🔥 FIX BUG: sebelumnya perbandingan mapel ini case-sensitive (persis
// sama besar-kecil hurufnya) -- jadi "Matematika SD" (dari nama mapel di
// jadwal) dianggap BEDA dari "MATEMATIKA SD" (dari field subject modul,
// yang kebetulan disimpan huruf besar semua) walau maksudnya mapel yang
// SAMA PERSIS. Siswa yang udah jelas terjadwal ke mapel itu malah kena
// tolak akses gara-gara beda kapitalisasi doang.
//
// 🔥 BARU: sekarang COBA COCOKIN LEWAT KODE MAPEL DULU (mis. "MAPEL-004")
// sebelum jatuh ke pencocokan nama. Kode itu ID TETAP yang gak pernah
// berubah -- jauh lebih bisa diandalkan daripada nama, yang teksnya bisa
// beda-beda tiap kali diketik/dipilih (lihat data mapel yang berantakan:
// "BAHASA INGGRIS SD" vs "Bahasa Inggris SMP", dst). `modulKodeMapel`
// kadang berisi BEBERAPA kode dipisah koma (guru yang ngampu multi-mapel),
// jadi dipecah dulu satu-satu sebelum dibandingkan.
// 🔥 FIX BUG (revisi terbaru): pencadangan lewat NAMA mapel yang tadinya
// ada di sini SUDAH DIHAPUS TOTAL. Nama sering beda ejaan/gaya penulisan
// antar guru (mis. "BAHASA INGGRIS SD" vs "Bahasa Inggris SMP", atau ada
// mapel duplikat kayak "IPS (Pengganti)") -- itu jadi sumber bug paling
// sering ("siswa gak bisa akses padahal harusnya bisa"). Sekarang HANYA
// kode mapel (mapelId, mis. "MAPEL-004") yang dipakai buat mencocokkan,
// karena kode dipilih dari dropdown baku dan gak pernah berubah/typo.
// `modulKodeMapel` kadang berisi BEBERAPA kode dipisah koma (guru yang
// ngampu multi-mapel), jadi dipecah dulu satu-satu sebelum dibandingkan.
// ⚠️ KONSEKUENSI PENTING: kalau field manual `enrolledSubjects` di data
// siswa (yang admin isi manual lewat halaman siswa, buat kasus khusus)
// berisi NAMA mapel, itu SEKARANG TIDAK AKAN COCOK LAGI -- field itu
// harus diisi KODE mapel (mis. "MAPEL-004"), bukan nama seperti dulu.
// Kalau ada data lama yang masih berisi nama, perlu diupdate manual satu
// kali ke kode yang sesuai supaya override-nya tetap jalan.
// 🔥 PERUBAHAN BESAR (atas permintaan eksplisit): sistem sebelumnya
// menurunkan akses OTOMATIS dari jadwal (jadwal_bimbel), dengan fallback
// PERMISIF (izinkan) kalau data kosong -- supaya siswa lama gak keblokir
// tiba-tiba. Sekarang DIBALIK TOTAL jadi PENGECEKAN KETAT: satu-satunya
// sumber akses adalah field `enrolledSubjects` yang diisi MANUAL admin
// lewat halaman Edit Siswa. Kalau field itu KOSONG/belum diisi, siswa
// TIDAK dapat akses ke modul/kuis mapel apa pun (kecuali konten "Umum").
// Ini keputusan sadar: turunan otomatis dari jadwal punya celah -- siswa
// bisa "kelepasan" dapat akses ke SEMUA mapel padahal cuma bayar paket 1
// mapel, kalau data jadwalnya kebetulan permisif/gak lengkap. Kontrol
// ketat ini nutup celah itu, dengan konsekuensi: ADMIN WAJIB isi mapel
// tiap siswa secara manual lewat halaman Edit Siswa setelah pendaftaran.
const hasSubjectAccess = (enrolledSubjects, modulSubject, modulKodeMapel) => {
  if (!modulSubject || modulSubject.toLowerCase().trim() === 'umum') return true;
  const modulCodes = String(modulKodeMapel || '').split(',').map(s => String(s || '').toLowerCase().trim()).filter(Boolean);
  if (modulCodes.length === 0) return true; // modul/kuis ini gak punya kode mapel -> gak ada dasar buat blokir (masalah data di sisi materi, bukan siswa)
  if (!Array.isArray(enrolledSubjects) || enrolledSubjects.length === 0) return false; // 🔥 DIBALIK: kosong = BLOKIR, bukan lagi izinkan
  const norm = (s) => String(s || '').toLowerCase().trim();
  if (enrolledSubjects.some(s => norm(s) === 'semua')) return true;
  return enrolledSubjects.some(s => modulCodes.includes(norm(s)));
};

// ============================================================
// 🔥 BARU: TURUNKAN "MAPEL YANG DIAMBIL SISWA" DARI JADWAL BESAR
// (jadwal_bimbel), BUKAN DARI FIELD TERPISAH YANG HARUS DIISI MANUAL
// ============================================================
// KENAPA BEGINI: begitu admin bikin jadwal "Guru Matematika + pilih siswa
// ini" di halaman Manajemen Jadwal, itu SUDAH MEMBUKTIKAN siswa ini ambil
// mapel Matematika -- gak perlu dicatat ULANG di tempat terpisah (field
// enrolledSubjects manual). `jadwal_bimbel` dijadikan SATU-SATUNYA sumber
// kebenaran (single source of truth) buat "siswa ini ambil mapel apa".
// Admin tetap bikin jadwal seperti biasa, TIDAK ADA kerjaan tambahan.
//
// PENTING -- ini nyari SEMUA jadwal siswa itu SEPANJANG WAKTU (bukan cuma
// jadwal HARI INI). Kalau cuma dicek "jadwal hari ini", modul Matematika
// bakal ketutup di hari-hari siswa gak ada kelas Matematika -- padahal dia
// tetap siswa Matematika, cuma kebetulan gak ada sesi hari itu. "Pernah
// terjadwal di mapel X" itu yang jadi patokan akses, bukan "ada jadwal
// mapel X HARI INI".
//
// ATURAN AMAN buat siswa baru: kalau siswa BELUM PERNAH SAMA SEKALI masuk
// jadwal apa pun (baru daftar, belum sempat dijadwalin gurunya), dianggap
// `null` (belum "terverifikasi" ke mapel manapun) -- yang berarti TETAP
// akses penuh dulu, sampai jadwal pertamanya dibuat. Begitu jadwal pertama
// dibuat, pembatasan mapel baru mulai berlaku berdasarkan mapel-mapel yang
// pernah dia ikuti.
// ============================================================
// 🔥 DIHAPUS: deriveEnrolledSubjectsFromSchedule()
// ============================================================
// Fungsi ini dulu menurunkan akses mapel siswa dari jadwal_bimbel secara
// otomatis. Sekarang DIHAPUS TOTAL sesuai keputusan sadar: satu-satunya
// sumber akses adalah field `enrolledSubjects` yang diisi manual admin
// lewat halaman Edit Siswa -- lihat penjelasan lengkap di hasSubjectAccess()
// di atas. Kalau butuh melihat versi lama fungsi ini, cek riwayat/backup
// sebelum perubahan ini.

const StudentDashboard = () => {
  const navigate = useNavigate();
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);

  const [studentName, setStudentName] = useState(() => localStorage.getItem('studentName') || 'Siswa');
  const [studentId, setStudentId] = useState(null);
  const [studentProfile, setStudentProfile] = useState(null);
  const [studentKelas, setStudentKelas] = useState(() => localStorage.getItem('studentKelas') || '');
  const [studentProgram, setStudentProgram] = useState(() => localStorage.getItem('studentProgram') || 'Reguler');
  const [studentNim, setStudentNim] = useState(() => localStorage.getItem('studentNim') || '');

  const [todaySchedules, setTodaySchedules] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [raportSummary, setRaportSummary] = useState(null);

  const [dataLoading, setDataLoading] = useState(true);
  const [isScanning, setIsScanning] = useState(false);
  const [authReady, setAuthReady] = useState(false);
  const [authError, setAuthError] = useState(false);

  const [notifications, setNotifications] = useState([]);
  const [showNotifPanel, setShowNotifPanel] = useState(false);

  const [wajibSurveys, setWajibSurveys] = useState([]);
  // 🔥 BARU: ringkasan kehadiran buat bagan bundar di dashboard
  const [attendanceSummary, setAttendanceSummary] = useState({ hadir: 0, izin: 0, alpha: 0, total: 0 });
  // 🔥 SEMENTARA: panel diagnosa absensi -- buat nyari tau kenapa data
  // kosong. Aman dihapus nanti kalau udah gak dibutuhkan.
  const [attDebug, setAttDebug] = useState(null);
  const [optionalSurveys, setOptionalSurveys] = useState([]);
  const [dismissedSurveyIds, setDismissedSurveyIds] = useState(() => {
    try { return JSON.parse(localStorage.getItem('dismissedSurveys') || '[]'); }
    catch { return []; }
  });

  const getSmartDateString = (dateObj) => {
    const year = dateObj.getFullYear();
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const day = String(dateObj.getDate()).padStart(2, '0');
    return year + '-' + month + '-' + day;
  };

  // 🔥 BARU: parameter `studentEnrolledSubjects` -- daftar mapel yang
  // beneran diambil/dibayar siswa (buat strategi harga "1 mapel / 2 mapel /
  // paket lengkap" yang baru). Cek detailnya di hasSubjectAccess() di atas.
  //
  // PENTING: pengecekan mapel ini SENGAJA cuma jalan buat targeting umum
  // (kelas/kategori) -- kalau modul secara eksplisit ditarget ke SISWA
  // TERTENTU (`sendToSpecificStudents`), itu berarti guru MEMILIH siswa
  // ini secara sadar satu-satu, jadi keputusan guru itu diprioritaskan
  // (gak ditimpa pembatasan mapel otomatis) -- guru mungkin sengaja mau
  // kasih akses bonus ke luar mapel yang diambil siswa.
  const checkStudentAccess = (modul, studentId, studentKelas, studentProgram, studentEnrolledSubjects) => {
    if (modul.sendToSpecificStudents) {
      const studentIds = modul.studentIds || [];
      const selectedStudentIds = (modul.selectedStudents || []).map(s => s.studentId || s.id);
      const allTargetIds = [...studentIds, ...selectedStudentIds];
      return allTargetIds.includes(studentId) || allTargetIds.includes(studentNim);
    }
    // 🔥 BERUBAH (atas permintaan eksplisit, konsisten dengan
    // StudentQuizView.jsx/StudentModuleView.jsx/StudentElearning.jsx):
    // pengecekan kelas/kategori DIHAPUS TOTAL -- kode mapel itu SENDIRI
    // sudah spesifik per jenjang, jadi kelas/kategori jadi informasi ganda
    // yang ternyata jadi titik rapuh nyata (kalau kelas/program siswa
    // belum sempat kemuat, konten yang seharusnya boleh malah ketolak).
    // Sekarang murni dari kodeMapel.
    return hasSubjectAccess(studentEnrolledSubjects, modul.subject || '', modul.kodeMapel || '');
  };

  useEffect(() => {
    const h = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', h);
    return () => window.removeEventListener('resize', h);
  }, []);

  const isMobile = windowWidth <= 768;
  const greeting = getGreeting();

  useEffect(() => {
    const storedId = localStorage.getItem('studentId');
    const storedName = localStorage.getItem('studentName');
    const isLoggedIn = localStorage.getItem('isSiswaLoggedIn') === 'true';

    if (isLoggedIn && storedId) {
      setStudentId(storedId);
      setStudentName(storedName || "Siswa");
      setAuthReady(true);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setStudentName(storedName || user.email || "Siswa");
        setStudentId(storedId || user.uid);
        localStorage.setItem('isSiswaLoggedIn', 'true');
        localStorage.setItem('studentId', storedId || user.uid);
        setAuthReady(true);
      } else {
        setAuthError(true);
        setDataLoading(false);
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!authReady || !studentId) return;

    const fetchData = async () => {
      try {
        const todayStr = getSmartDateString(new Date());
        const periode = new Date().getFullYear() + '-' + String(new Date().getMonth() + 1).padStart(2, '0');

        const sSnap = await getDoc(doc(db, "students", studentId)).catch(() => null);
        let kelasVal = studentKelas, programVal = studentProgram, nimVal = studentNim || studentId;
        // 🔥 BERUBAH: mapel yang beneran diambil siswa (buat strategi harga 1
        // mapel / 2 mapel / paket lengkap) sekarang HANYA dari field manual
        // `enrolledSubjects` -- lihat penjelasan lengkap di hasSubjectAccess()
        // di atas. Kalau field ini kosong, siswa dianggap BELUM diisi
        // mapelnya sama sekali (bukan lagi "akses penuh sementara").
        let enrolledSubjectsVal = null;
        if (sSnap?.exists()) {
          const data = sSnap.data();
          setStudentProfile(data);
          kelasVal = data.kelasSekolah || '';
          programVal = data.kategori || 'Reguler';
          nimVal = data.studentId || data.id || studentId;
          enrolledSubjectsVal = Array.isArray(data.enrolledSubjects) ? data.enrolledSubjects : [];
          setStudentKelas(kelasVal);
          setStudentProgram(programVal);
          setStudentNim(nimVal);
          localStorage.setItem('studentKelas', kelasVal);
          localStorage.setItem('studentProgram', programVal);
          localStorage.setItem('studentNim', nimVal);
          // 🔥 Disimpan juga di localStorage supaya StudentModuleView.jsx
          // (halaman baca materi) bisa langsung pakai tanpa fetch ulang.
          try {
            if (enrolledSubjectsVal) localStorage.setItem('studentEnrolledSubjects', JSON.stringify(enrolledSubjectsVal));
            else localStorage.removeItem('studentEnrolledSubjects');
          } catch (e) { /* localStorage penuh/gak tersedia -- gak fatal */ }
        }

        const [
          schedSnap, modulSnap, raportSnap, notifSnap, surveySnap,
          respByUserId, respByStudentId, respByRespondentId, respByNim,
          attByDocId, attByKodeUnik, attByName, attByNamaSiswa,
        ] = await Promise.all([
          getDocs(query(collection(db, "jadwal_bimbel"), where("dateStr", "==", todayStr))).catch(() => ({ docs: [] })),
          // 🔥 FIX BUG: sebelumnya limit(20) di sini itu 20 modul TERBARU
          // SE-SISTEM (bukan per siswa) -- kalau bimbel punya banyak guru
          // yang sering update modul/kuis, modul yang BENERAN ditargetkan
          // ke siswa ini bisa kegeser keluar dari 20-besar-terbaru itu dan
          // gak pernah kelihatan di widget ini, walau targetnya udah benar
          // dari awal. Limit dinaikkan jauh (200) biar hampir gak mungkin
          // ke-truncate untuk skala bimbel manapun.
          getDocs(query(collection(db, "bimbel_modul"), orderBy("updatedAt", "desc"), limit(200))).catch(() => ({ docs: [] })),
          getDocs(query(collection(db, RAPORT_COLLECTIONS.FINAL), where("studentId", "==", studentId), where("periode", "==", periode), limit(1))).catch(() => ({ docs: [] })),
          getDocs(query(collection(db, "notifications"), where("recipientId", "==", nimVal), limit(30))).catch(() => ({ docs: [] })),
          getDocs(query(collection(db, "surveys"), where("status", "==", "aktif"), limit(50))).catch(() => ({ docs: [] })),
          getDocs(query(collection(db, "survey_responses"), where("userId", "==", nimVal))).catch(() => ({ docs: [] })),
          getDocs(query(collection(db, "survey_responses"), where("studentId", "==", nimVal))).catch(() => ({ docs: [] })),
          getDocs(query(collection(db, "survey_responses"), where("respondentId", "==", nimVal))).catch(() => ({ docs: [] })),
          getDocs(query(collection(db, "survey_responses"), where("nim", "==", nimVal))).catch(() => ({ docs: [] })),
          // 🔥 BARU: ringkasan kehadiran buat bagan bundar. Dicari pakai DUA
          // skema identitas sekaligus (ID dokumen — dipakai scan QR & guru
          // di ClassSession.jsx — DAN kode unik — dipakai kalau admin input
          // manual), persis fix yang sama kayak di halaman admin kemarin.
          // Kalau cuma satu skema dicek, sebagian data kehadiran bisa gak
          // kehitung di bagannya.
          getDocs(query(collection(db, "attendance"), where("studentId", "==", studentId))).catch(() => ({ docs: [] })),
          getDocs(query(collection(db, "attendance"), where("studentId", "==", nimVal))).catch(() => ({ docs: [] })),
          // 🔥 SEMENTARA (diagnosa): cari absensi berdasarkan NAMA siswa
          // (bukan ID). Kalau ini nemu data tapi dua query di atas nggak,
          // berarti data absensinya BENERAN ADA tapi skema ID yang dipakai
          // nulisnya beda dari yang diduga -- dan ini bakal nunjukkin
          // persis skema ID yang sebenarnya dipakai.
          getDocs(query(collection(db, "attendance"), where("studentName", "==", studentName))).catch(() => ({ docs: [] })),
          getDocs(query(collection(db, "attendance"), where("namaSiswa", "==", studentName))).catch(() => ({ docs: [] })),
        ]);

        // --- Ringkasan kehadiran ---
        // 🔥 FIX: sebelumnya panel diagnosa nyari lewat NAMA dan BERHASIL
        // nemuin datanya, tapi hasil pencarian nama itu cuma dipakai buat
        // laporan diagnosa -- gak pernah ikut digabung ke data yang
        // BENERAN dipakai nampilin bagan. Sekarang hasil nama ikut
        // digabung juga, jadi bagan bener-bener nunjukkin data yang ada.
        const attMerged = new Map();
        [...attByDocId.docs, ...attByKodeUnik.docs, ...attByName.docs, ...attByNamaSiswa.docs].forEach(d => attMerged.set(d.id, d.data()));
        const attList = Array.from(attMerged.values());
        setAttendanceSummary({
          hadir: attList.filter(a => a.status === 'Hadir').length,
          izin: attList.filter(a => a.status === 'Izin' || a.status === 'Sakit').length,
          alpha: attList.filter(a => a.status === 'Alpha').length,
          total: attList.length,
        });

        // --- Diagnosa (sementara) ---
        const byNameMerged = new Map();
        [...attByName.docs, ...attByNamaSiswa.docs].forEach(d => byNameMerged.set(d.id, d.data()));
        const byNameList = Array.from(byNameMerged.values());
        setAttDebug({
          studentIdDipakaiCari: studentId,
          nimValDipakaiCari: nimVal,
          ketemuLewatDocId: attByDocId.docs.length,
          ketemuLewatKodeUnik: attByKodeUnik.docs.length,
          ketemuLewatNama: byNameList.length,
          contohStudentIdAsli: byNameList.slice(0, 3).map(a => a.studentId),
        });

        const fetchedSchedules = schedSnap.docs
          .map(d => ({ id: d.id, ...d.data() }))
          .filter(sch => sch.students?.some(s => s.id === studentId || s === studentId || s.studentId === studentId))
          .sort((a, b) => (a.start || '').localeCompare(b.start || ''))
          .slice(0, 5);
        setTodaySchedules(fetchedSchedules);

        const rawModulsData = modulSnap.docs.map(d => ({ id: d.id, ...d.data() }));
        const embeddedQuizIds = new Set();
        rawModulsData.forEach(m => {
          (m.blocks || []).forEach(b => {
            if (b.type === 'quiz' && b.quizId) embeddedQuizIds.add(b.quizId);
          });
        });
        const allModulsData = rawModulsData.filter(m => !embeddedQuizIds.has(m.id) && !m.parentModulId);

        const accessibleModuls = allModulsData.filter(modul => {
          if (modul.status === 'arsip') return false;
          // 🔥 Fix yang sama kayak di StudentElearning.jsx: modul
          // "terjadwal" dianggap aktif secara efektif begitu tanggalMulai
          // udah lewat, karena gak ada mekanisme yang otomatis ngubah
          // statusnya jadi "aktif".
          if (modul.status === 'terjadwal') {
            if (!modul.tanggalMulai) return false;
            if (new Date(modul.tanggalMulai) > new Date()) return false;
          }
          return checkStudentAccess(modul, studentId, kelasVal, programVal, enrolledSubjectsVal);
        });

        // 🔥 FIX BUG "kuis gak muncul di dashboard": sejak kuis "ditautkan
        // ke modul" disimpan sebagai BLOK TERPISAH (block.type === 'quiz'
        // + block.quizId menunjuk ke dokumen kuis lain), modul induknya
        // sendiri TIDAK PUNYA field `quizData` — jadi cek lama
        // `(m.quizData || []).length > 0` selalu `false` buat kuis model
        // ini dan kuis itu gak pernah dianggap "ada tugas" oleh dashboard.
        // Di bawah ini kita kumpulkan quizId dari blok-blok itu, ambil
        // dokumen kuisnya (buat tau deadline-nya juga), lalu dipakai baik
        // buat DETEKSI (hasQuiz) maupun buat SORTING deadline di bawah.
        const quizIdsToCheck = new Set();
        accessibleModuls.forEach(m => {
          (m.blocks || []).forEach(b => {
            if (b.type === 'quiz' && b.quizId) quizIdsToCheck.add(b.quizId);
          });
        });

        const quizDeadlineMap = {};
        if (quizIdsToCheck.size > 0) {
          const quizSnaps = await Promise.all(
            Array.from(quizIdsToCheck).map(id => getDoc(doc(db, "bimbel_modul", id)).catch(() => null))
          );
          quizSnaps.forEach(snap => {
            if (snap?.exists()) {
              const d = snap.data();
              quizDeadlineMap[snap.id] = {
                useSchedule: d.useSchedule || false,
                quizCloseDate: d.quizCloseDate || null,
              };
            }
          });
        }

        // 🔥 Cari deadline PALING DEKAT dari semua blok tugas & kuis di
        // dalam satu modul (dipakai buat ngurutin mana yang paling urgent).
        const getEarliestDeadline = (m) => {
          const deadlines = [];
          (m.blocks || []).forEach(b => {
            if (b.type === 'assignment' && b.endTime) {
              const t = new Date(b.endTime);
              if (!isNaN(t)) deadlines.push(t);
            }
            if (b.type === 'quiz' && b.quizId) {
              const qd = quizDeadlineMap[b.quizId];
              if (qd?.useSchedule && qd.quizCloseDate) {
                const t = new Date(qd.quizCloseDate);
                if (!isNaN(t)) deadlines.push(t);
              }
            }
          });
          // Kuis lama (model quizData langsung di modul) juga dicek
          if ((m.quizData || []).length > 0 && m.useSchedule && m.quizCloseDate) {
            const t = new Date(m.quizCloseDate);
            if (!isNaN(t)) deadlines.push(t);
          }
          return deadlines.length ? deadlines.reduce((a, b) => (a < b ? a : b)) : null;
        };

        const nowTs = new Date();
        const fetchedTasks = accessibleModuls
          .filter(m => {
            // 🔥 hasQuiz sekarang mengecek DUA model kuis: model lama
            // (quizData langsung di modul) DAN model baru (blok 'quiz'
            // yang menunjuk ke dokumen kuis terpisah).
            const hasQuiz = (m.quizData || []).length > 0 || (m.blocks || []).some(b => b.type === 'quiz' && b.quizId);
            const hasAssignment = (m.blocks || []).some(b => b.type === 'assignment');
            return hasQuiz || hasAssignment;
          })
          .map(m => ({ ...m, __deadline: getEarliestDeadline(m) }))
          // Buang yang deadline-nya sudah lewat semua (biar gak nampilin
          // tugas/kuis yang udah kadaluarsa sebagai "aktif")
          .filter(m => !m.__deadline || m.__deadline >= nowTs)
          // 🔥 URUTKAN BERDASARKAN DEADLINE PALING DEKAT DULU — sebelumnya
          // sama sekali gak ada sorting urgency, cuma ambil 3 modul
          // pertama dari urutan "terakhir diupdate". Modul tanpa deadline
          // (tugas/kuis bebas waktu) ditaruh di bawah yang punya deadline.
          .sort((a, b) => {
            if (a.__deadline && b.__deadline) return a.__deadline - b.__deadline;
            if (a.__deadline) return -1;
            if (b.__deadline) return 1;
            return 0;
          })
          .slice(0, 5); // naik dari 3 -> 5 karena sekarang sudah terurut yang paling urgent duluan
        setTasks(fetchedTasks);

        if (!raportSnap.empty) {
          const data = raportSnap.docs[0].data();
          setRaportSummary({
            nilaiAkhir: data.nilai_akhir,
            komponenDipake: data.komponen_dipakai || [],
            periode: periode
          });
        }

        const notifList = notifSnap.docs
          .map(d => ({ id: d.id, ...d.data() }))
          .sort((a, b) => (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0));
        setNotifications(notifList);

        const activeSurveys = surveySnap.docs.map(d => ({ id: d.id, ...d.data() }));
        const respondedIds = new Set(
          [respByUserId, respByStudentId, respByRespondentId, respByNim]
            .flatMap(snap => snap.docs)
            .map(d => d.data().surveyId)
        );

        const relevantSurveys = activeSurveys.filter(sv => {
          if (respondedIds.has(sv.id)) return false;
          if (sv.targetType === 'semua_guru') return false;
          if (sv.deadline && new Date(sv.deadline) < new Date()) return false;
          if (sv.targetType === 'jenjang') {
            return !sv.targetKelas || sv.targetKelas === 'Semua' || sv.targetKelas === kelasVal;
          }
          return true;
        });

        setWajibSurveys(relevantSurveys.filter(sv => sv.isRequired));
        setOptionalSurveys(relevantSurveys.filter(sv => !sv.isRequired));

      } catch (err) { console.error('Error:', err); }
      finally { setDataLoading(false); }
    };

    fetchData();
  }, [authReady, studentId]);

  const markNotifRead = async (notif) => {
    if (!notif.isRead) {
      setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, isRead: true } : n));
      try { await setDoc(doc(db, "notifications", notif.id), { isRead: true }, { merge: true }); } catch (e) {}
    }
    if (notif.link) navigate(notif.link);
    setShowNotifPanel(false);
  };

  const deleteNotification = async (e, notifId) => {
    e.stopPropagation();
    setNotifications(prev => prev.filter(n => n.id !== notifId));
    try { await deleteDoc(doc(db, "notifications", notifId)); } catch (e) {}
  };

  const dismissOptionalSurvey = (surveyId) => {
    const next = [...dismissedSurveyIds, surveyId];
    setDismissedSurveyIds(next);
    localStorage.setItem('dismissedSurveys', JSON.stringify(next));
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;
  const visibleOptionalSurveys = optionalSurveys.filter(sv => !dismissedSurveyIds.includes(sv.id));

  useEffect(() => {
    let qr = null;
    if (!isScanning || !studentId) return;

    const start = async () => {
      try {
        qr = new Html5Qrcode("reader");
        await qr.start(
          { facingMode: "environment" },
          { fps: 10, qrbox: { width: 250, height: 250 } },
          async (text) => {
            try {
              const d = JSON.parse(text);
              if (d.type !== "ABSENSI_BIMBEL") return;

              const matchedSchedule = todaySchedules.find(sch => sch.id === d.scheduleId);
              if (!matchedSchedule) {
                alert('❌ QR ini bukan untuk jadwal kelasmu hari ini. Absen tidak tercatat.\n\nKalau ini keliru, hubungi tentor/admin.');
                return;
              }

              const today = getSmartDateString(new Date());
              await setDoc(doc(db, "attendance", studentId + '_' + today + '_' + (d.scheduleId || '')), {
                studentId, studentName, teacherName: d.teacher, date: today,
                tanggal: today, timestamp: serverTimestamp(), status: "Hadir",
                mapel: d.mapel, scheduleId: d.scheduleId || '', keterangan: "Scan QR"
              }, { merge: true });
              alert('✅ Absen: ' + d.mapel);
              stop();
            } catch (e) {}
          },
          (err) => {}
        );
      } catch (e) {}
    };
    const stop = async () => {
      if (qr && qr.isScanning) { try { await qr.stop(); qr.clear(); } catch (e) {} }
      setIsScanning(false);
    };
    start();
    return () => { if (qr) stop(); };
  }, [isScanning, studentId, todaySchedules, studentName]);

  if (authError) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#f8fafc', flexDirection: 'column', gap: 16 }}>
        <AlertCircle size={48} color="#ef4444" />
        <h3 style={{ color: '#1e293b' }}>Sesi Berakhir</h3>
        <p style={{ color: '#64748b', fontSize: 14 }}>Silakan login kembali</p>
        <button onClick={() => { localStorage.clear(); navigate('/login-siswa'); }} style={{ padding: '10px 20px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: 8, fontWeight: 700, cursor: 'pointer' }}>
          Login
        </button>
      </div>
    );
  }

  // 🔥 FIX BUG ARSITEKTUR BESAR: sebelumnya komponen ini render SIDEBAR-nya
  // SENDIRI (<SidebarSiswa>, tombol hamburger, offset marginLeft:260) —
  // padahal di App.jsx, route "/siswa/dashboard" SUDAH dibungkus <SiswaLayout>
  // yang JUGA render sidebar + header + offset yang SAMA. Akibatnya: sidebar
  // ke-render 2 kali dobel (numpuk persis di posisi yang sama, jadi gak
  // "kelihatan" pecah tapi boros & 2x event listener), dan konten dashboard
  // ke-geser marginLeft:260 DUA KALI (jadi ~520px kosong di desktop).
  // Ditambah lagi breakpoint mobile-nya beda (SiswaLayout ≤1024px vs
  // komponen ini ≤768px), jadi di lebar 769-1024px dua-duanya "gak sepakat"
  // — ini kemungkinan besar akar dari keluhan "tampilan berantakan di HP".
  // Sekarang komponen ini HANYA render kontennya sendiri; sidebar & page
  // shell sepenuhnya diserahkan ke SiswaLayout (persis seperti halaman siswa
  // lain — StudentElearning, dst — yang sudah benar dari awal).
  return (
    <div style={{ paddingBottom: isMobile ? 70 : 0 }}>
      <style>{`
        @keyframes skeletonShine { 0%{background-position:100% 50%} 100%{background-position:0 50%} }
        @keyframes fadeSlideIn { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:translateY(0)} }
        .sd-card { animation: fadeSlideIn 0.25s ease-out; }
        .sd-task-item:hover, .sd-survey-btn:hover { filter: brightness(0.97); }
      `}</style>

      <div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 18, flexWrap: 'wrap', gap: 10 }}>
          <div>
            <p style={{ margin: 0, fontSize: 12, color: '#94a3b8', fontWeight: 600 }}>{greeting.icon} {greeting.text}</p>
            <h1 style={{ margin: '2px 0 0', fontSize: isMobile ? 20 : 25, fontWeight: 800, color: '#1e293b' }}>{studentName}!</h1>
            <p style={{ color: '#64748b', marginTop: 5, fontSize: 12 }}>
              {(studentProfile?.kategori || studentProgram || 'Reguler')} • Kelas {studentProfile?.kelasSekolah || studentKelas || '-'}
              {studentNim && <span style={{ marginLeft: 8, fontSize: 10, background: '#eef2ff', color: '#4338ca', padding: '2px 8px', borderRadius: 20, fontWeight: 700 }}>🆔 {studentNim}</span>}
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10, position: 'relative' }}>
            <button
              onClick={() => setShowNotifPanel(v => !v)}
              style={{
                position: 'relative', width: 42, height: 42, borderRadius: 14,
                background: 'white', border: '1px solid #e2e8f0', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#475569',
                boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
              }}
            >
              <Bell size={18} />
              {unreadCount > 0 && (
                <span style={{
                  position: 'absolute', top: -3, right: -3, background: '#ef4444', color: 'white',
                  fontSize: 9, fontWeight: 800, minWidth: 16, height: 16, borderRadius: 8,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 3px',
                  border: '2px solid #f4f6fb',
                }}>
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {showNotifPanel && (
              <>
                <div onClick={() => setShowNotifPanel(false)} style={{ position: 'fixed', inset: 0, zIndex: 998 }} />
                <div style={{
                  position: 'absolute', top: 50, right: 0,
                  width: isMobile ? 'calc(100vw - 32px)' : 360, maxWidth: 380, maxHeight: 440,
                  background: 'white', borderRadius: 16, boxShadow: '0 16px 40px rgba(0,0,0,0.18)',
                  border: '1px solid #e2e8f0', zIndex: 999, overflow: 'hidden', display: 'flex', flexDirection: 'column',
                }}>
                  <div style={{ padding: '12px 16px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: 800, fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}><Inbox size={15} /> Kotak Masuk</span>
                    {unreadCount > 0 && <span style={{ fontSize: 10, color: '#94a3b8' }}>{unreadCount} belum dibaca</span>}
                  </div>
                  <div style={{ overflowY: 'auto', flex: 1 }}>
                    {notifications.length === 0 ? (
                      <div style={{ padding: 30, textAlign: 'center', color: '#94a3b8', fontSize: 12 }}>
                        <Inbox size={28} style={{ marginBottom: 6, opacity: 0.4 }} /><br />Belum ada notifikasi
                      </div>
                    ) : notifications.map(notif => {
                      const meta = NOTIF_META[notif.type] || NOTIF_META.pengumuman;
                      return (
                        <div
                          key={notif.id}
                          onClick={() => markNotifRead(notif)}
                          style={{
                            display: 'flex', gap: 10, padding: '12px 16px', cursor: 'pointer',
                            borderBottom: '1px solid #f8fafc', background: notif.isRead ? 'white' : '#f8fafc',
                          }}
                        >
                          <div style={{ width: 32, height: 32, borderRadius: 8, background: meta.bg, color: meta.color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            {meta.icon}
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 6 }}>
                              <span style={{ fontSize: 12, fontWeight: notif.isRead ? 600 : 800, color: '#1e293b' }}>{notif.title}</span>
                              {!notif.isRead && <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#3b82f6', flexShrink: 0, marginTop: 4 }} />}
                            </div>
                            <p style={{ margin: '2px 0 0', fontSize: 11, color: '#64748b', lineHeight: 1.4 }}>{notif.message}</p>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 5 }}>
                              <span style={{ fontSize: 9, color: '#94a3b8' }}>{timeAgo(notif.createdAt)}</span>
                              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                                {notif.fileUrl && (
                                  <a href={notif.fileUrl} target="_blank" rel="noreferrer" onClick={e => e.stopPropagation()} style={{ fontSize: 9, color: '#3b82f6', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 2 }}>
                                    <Download size={10} /> Unduh
                                  </a>
                                )}
                                <button onClick={(e) => deleteNotification(e, notif.id)} style={{ background: 'none', border: 'none', color: '#cbd5e1', cursor: 'pointer', display: 'flex' }}>
                                  <Trash2 size={12} />
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </>
            )}

            {!isMobile && (
              <button onClick={() => setIsScanning(true)} style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#1e293b', color: 'white', border: 'none', padding: '11px 20px', borderRadius: 14, fontWeight: 700, fontSize: 13, cursor: 'pointer', boxShadow: '0 4px 12px rgba(30,41,59,0.2)' }}>
                <Camera size={17} /> Scan Absen
              </button>
            )}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(3, 1fr)' : 'repeat(3, 1fr)', gap: isMobile ? 8 : 14, marginBottom: 16 }}>
          {[
            { label: 'Jadwal Hari Ini', value: todaySchedules.length, color: '#3b82f6', bg: '#eff6ff' },
            { label: 'Tugas & Kuis', value: tasks.length, color: '#9b59b6', bg: '#f5f3ff' },
            { label: 'Notifikasi Baru', value: unreadCount, color: '#ef4444', bg: '#fef2f2' },
          ].map((stat, i) => (
            <div key={i} className="sd-card" style={{ background: stat.bg, borderRadius: 16, padding: isMobile ? '12px 10px' : '16px 18px' }}>
              <div style={{ fontSize: isMobile ? 22 : 28, fontWeight: 900, color: stat.color, lineHeight: 1 }}>
                {dataLoading ? '–' : stat.value}
              </div>
              <div style={{ fontSize: isMobile ? 9 : 11, color: '#64748b', fontWeight: 700, marginTop: 4 }}>{stat.label}</div>
            </div>
          ))}
        </div>

        {wajibSurveys.map(sv => (
          <div key={sv.id} className="sd-card" style={{
            background: 'linear-gradient(135deg, #f59e0b, #dc2626)', borderRadius: 18, padding: 18, color: 'white',
            marginBottom: 14, display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap',
            boxShadow: '0 10px 24px rgba(220,38,38,0.28)',
          }}>
            {sv.coverImage && (
              <img src={sv.coverImage} alt={sv.title} style={{ width: 68, height: 68, borderRadius: 14, objectFit: 'cover', flexShrink: 0 }} />
            )}
            <div style={{ flex: 1, minWidth: 180 }}>
              <span style={{ fontSize: 9, fontWeight: 800, background: 'rgba(255,255,255,0.25)', padding: '3px 9px', borderRadius: 10 }}>🔴 SURVEI WAJIB</span>
              <h3 style={{ margin: '6px 0 2px', fontSize: 15, fontWeight: 800 }}>{sv.title}</h3>
              <p style={{ margin: 0, fontSize: 11, opacity: 0.9 }}>Wajib diisi{sv.deadline ? ` — batas ${new Date(sv.deadline).toLocaleDateString('id-ID')}` : ''}.</p>
            </div>
            <button className="sd-survey-btn" onClick={() => navigate('/siswa/survei/' + sv.id)} style={{ background: 'white', color: '#dc2626', border: 'none', padding: '10px 18px', borderRadius: 12, fontWeight: 800, fontSize: 12, cursor: 'pointer', flexShrink: 0 }}>
              Isi Sekarang →
            </button>
          </div>
        ))}

        {visibleOptionalSurveys.map(sv => (
          <div key={sv.id} className="sd-card" style={{
            background: 'white', border: '1px solid #bae6fd', borderRadius: 16, padding: 14,
            marginBottom: 12, display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', position: 'relative',
          }}>
            {sv.coverImage && (
              <img src={sv.coverImage} alt={sv.title} style={{ width: 48, height: 48, borderRadius: 10, objectFit: 'cover', flexShrink: 0 }} />
            )}
            <div style={{ flex: 1, minWidth: 160 }}>
              <span style={{ fontSize: 9, fontWeight: 700, color: '#0891b2' }}>🔵 SURVEI OPSIONAL</span>
              <h4 style={{ margin: '2px 0', fontSize: 13, fontWeight: 700, color: '#1e293b' }}>{sv.title}</h4>
            </div>
            <button className="sd-survey-btn" onClick={() => navigate('/siswa/survei/' + sv.id)} style={{ background: '#ecfeff', color: '#0891b2', border: 'none', padding: '7px 14px', borderRadius: 10, fontWeight: 700, fontSize: 11, cursor: 'pointer' }}>
              Isi
            </button>
            <button onClick={() => dismissOptionalSurvey(sv.id)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: 4 }} title="Tutup">
              <X size={16} />
            </button>
          </div>
        ))}

        {raportSummary && (
          <div className="sd-card" onClick={() => navigate('/siswa/smart-rapor')} style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', borderRadius: 18, padding: 20, color: 'white', cursor: 'pointer', marginBottom: 16, boxShadow: '0 10px 24px rgba(102,126,234,0.25)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Trophy size={26} color="#fbbf24" />
                <div>
                  <h3 style={{ margin: 0, fontSize: 15, fontWeight: 800 }}>📊 Ringkasan Raport</h3>
                  <p style={{ margin: '4px 0 0', fontSize: 11, opacity: 0.85 }}>Periode {raportSummary.periode?.replace('-', ' / ')}</p>
                </div>
              </div>
              <ArrowRight size={20} />
            </div>
            <div style={{ display: 'flex', gap: 20, marginTop: 16, flexWrap: 'wrap' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 30, fontWeight: 900 }}>{raportSummary.nilaiAkhir ?? '?'}</div>
                <div style={{ fontSize: 10, opacity: 0.8 }}>Nilai Akhir</div>
              </div>
              {raportSummary.komponenDipake && (
                <div style={{ textAlign: 'center', borderLeft: '1px solid rgba(255,255,255,0.3)', paddingLeft: 20 }}>
                  <div style={{ fontSize: 30, fontWeight: 900 }}>{raportSummary.komponenDipake.length}/4</div>
                  <div style={{ fontSize: 10, opacity: 0.8 }}>Komponen Dinilai</div>
                </div>
              )}
            </div>
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 16 }}>

          <div className="sd-card" style={{ background: 'white', padding: 18, borderRadius: 18, border: '1px solid #eef1f5', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
            <h3 style={{ margin: '0 0 14px', fontSize: 14, fontWeight: 800, color: '#1e293b', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Calendar size={17} color="#3b82f6" /> Jadwal Hari Ini
            </h3>
            {dataLoading ? (
              <SkeletonLines count={2} />
            ) : todaySchedules.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 20, color: '#94a3b8', fontSize: 12 }}>📭 Tidak ada jadwal hari ini</div>
            ) : todaySchedules.map((sch, i) => (
              <div key={i} style={{ display: 'flex', gap: 10, padding: '10px 0', borderBottom: i < todaySchedules.length - 1 ? '1px solid #f1f5f9' : 'none' }}>
                <div style={{ minWidth: 48, textAlign: 'center', fontWeight: 700, fontSize: 12, color: '#3b82f6' }}>{sch.start}</div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 13, color: '#1e293b' }}>{sch.title || "Kelas"}</div>
                  <div style={{ fontSize: 10, color: '#64748b', display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
                    <MapPin size={9} /> {sch.planet || '-'} • <User size={9} /> {sch.teacherName || sch.booker || '-'}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="sd-card" style={{ background: 'white', padding: 18, borderRadius: 18, border: '1px solid #eef1f5', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 14 }}>
              <h3 style={{ margin: 0, fontSize: 14, fontWeight: 800, color: '#1e293b', display: 'flex', alignItems: 'center', gap: 8 }}>
                <ClipboardList size={17} color="#9b59b6" /> Tugas & Kuis
              </h3>
              <button onClick={() => navigate('/siswa/materi')} style={{ background: 'none', border: 'none', color: '#3b82f6', fontWeight: 700, fontSize: 11, cursor: 'pointer' }}>
                Lihat Semua →
              </button>
            </div>
            {dataLoading ? (
              <SkeletonLines count={2} />
            ) : tasks.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 20, color: '#94a3b8', fontSize: 12 }}>
                📭 Belum ada tugas atau kuis untuk Anda
              </div>
            ) : tasks.map((task, i) => {
              const hasQuiz = (task.quizData || []).length > 0 || (task.blocks || []).some(b => b.type === 'quiz' && b.quizId);
              const hasAssignment = (task.blocks || []).some(b => b.type === 'assignment');
              const isTargeted = task.sendToSpecificStudents;
              const targetInfo = isTargeted ? '🔒 Khusus' : `${task.targetKelas || 'Semua'} • ${task.targetKategori || 'Semua'}`;

              // 🔥 BARU: badge deadline paling dekat, biar keliatan mana yang
              // paling urgent (bukan cuma ngandelin urutan list aja).
              let deadlineBadge = null;
              if (task.__deadline) {
                const diffH = Math.floor((task.__deadline - new Date()) / 3600000);
                if (diffH < 24) deadlineBadge = { text: `⏰ ${Math.max(diffH, 0)} jam lagi`, color: '#ef4444' };
                else deadlineBadge = { text: `📅 ${Math.floor(diffH / 24)} hari lagi`, color: '#f59e0b' };
              }

              return (
                <div
                  key={i}
                  className="sd-task-item"
                  style={{
                    padding: '10px 12px', background: '#f8fafc', borderRadius: 12, marginBottom: 6,
                    borderLeft: `3px solid ${hasQuiz ? '#673ab7' : '#f59e0b'}`, cursor: 'pointer', transition: 'filter 0.15s',
                  }}
                  onClick={() => {
                    // 🔥 FIX BUG: sebelumnya SEMUA kartu di sini (kuis maupun
                    // tugas) cuma nyimpen `selectedModuleId` ke localStorage
                    // lalu lempar ke halaman daftar "Pilih Guru/Mapel"
                    // (`/siswa/materi`) -- padahal halaman itu TIDAK PERNAH
                    // membaca localStorage tsb buat langsung loncat ke
                    // modul/kuisnya. Efeknya siswa klik "Mulai Kuis" tapi
                    // malah nyasar ke layar pilihan tentor, harus cari-cari
                    // modulnya lagi secara manual. Sekarang: kalau kartunya
                    // KUIS, langsung diarahkan ke halaman pengerjaan kuis;
                    // kalau TUGAS/modul biasa, langsung ke halaman detail
                    // modulnya -- tanpa mampir ke halaman pilihan sama sekali.
                    if (hasQuiz) {
                      const quizBlock = (task.blocks || []).find(b => b.type === 'quiz' && b.quizId);
                      // Kuis "model lama" (quizData langsung nempel di modul,
                      // bukan blok terpisah) -- id kuisnya adalah id modul itu
                      // sendiri.
                      const quizId = quizBlock?.quizId || (task.quizData?.length > 0 ? task.id : null);
                      if (quizId) {
                        navigate(`/siswa/kuis/${quizId}`);
                        return;
                      }
                    }
                    navigate(`/siswa/modul/${task.id}`);
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ fontWeight: 700, fontSize: 13, color: '#1e293b' }}>{task.title}</div>
                    <div style={{ display: 'flex', gap: 4 }}>
                      {hasQuiz && (
                        <span style={{ fontSize: 9, padding: '2px 8px', borderRadius: 10, background: '#673ab7', color: 'white', fontWeight: 700 }}>Kuis</span>
                      )}
                      {hasAssignment && !hasQuiz && (
                        <span style={{ fontSize: 9, padding: '2px 8px', borderRadius: 10, background: '#f59e0b', color: 'white', fontWeight: 700 }}>Tugas</span>
                      )}
                    </div>
                  </div>
                  <div style={{ fontSize: 10, color: '#64748b', display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 2 }}>
                    <span>{task.subject || 'Umum'}</span>
                    <span>•</span>
                    <span>{targetInfo}</span>
                    {hasQuiz && (task.quizData?.length > 0) && <span>• 📝 {task.quizData.length} soal</span>}
                  </div>
                  {isTargeted && (
                    <div style={{ fontSize: 8, color: '#f59e0b', background: '#fef3c7', padding: '1px 6px', borderRadius: 4, display: 'inline-block', marginTop: 4 }}>
                      🔒 Dikirim khusus
                    </div>
                  )}
                  {deadlineBadge && (
                    <div style={{ fontSize: 9, color: deadlineBadge.color, fontWeight: 700, marginTop: 4 }}>
                      {deadlineBadge.text}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* 🔥 KEHADIRAN — BARU, sesuai permintaan (bagan bundar), sekaligus
            jadi jalan pintas karena menu "Kehadiran" di sidebar tadinya
            gak pernah ada. */}
        <div className="sd-card" style={{ background: 'white', padding: 18, borderRadius: 18, border: '1px solid #eef1f5', marginTop: 16, boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 14 }}>
            <h3 style={{ margin: 0, fontSize: 14, fontWeight: 800, color: '#1e293b', display: 'flex', alignItems: 'center', gap: 8 }}>
              <ClipboardList size={17} color="#14b8a6" /> Kehadiran
            </h3>
            <button onClick={() => navigate('/siswa/absensi')} style={{ background: 'none', border: 'none', color: '#3b82f6', fontWeight: 700, fontSize: 11, cursor: 'pointer' }}>
              Riwayat Lengkap →
            </button>
          </div>
          {dataLoading ? <SkeletonLines count={2} /> : (
            <AttendanceDonut hadir={attendanceSummary.hadir} izin={attendanceSummary.izin} alpha={attendanceSummary.alpha} total={attendanceSummary.total} />
          )}

          {/* 🔥 PANEL DIAGNOSA SEMENTARA -- hapus setelah masalah absensi
              ketemu akarnya. Nunjukkin persis skema ID apa yang beneran
              dipakai nulis data absensi di database. */}
          {attDebug && (
            <div style={{ marginTop: 14, padding: 10, background: '#fffbeb', border: '1px dashed #f59e0b', borderRadius: 10, fontSize: 10, fontFamily: 'monospace', color: '#78350f', lineHeight: 1.7 }}>
              <b>🔍 Diagnosa Absensi (sementara)</b><br/>
              ID dokumen dicari: {attDebug.studentIdDipakaiCari}<br/>
              Kode unik dicari: {attDebug.nimValDipakaiCari}<br/>
              Ketemu lewat ID dokumen: {attDebug.ketemuLewatDocId}<br/>
              Ketemu lewat kode unik: {attDebug.ketemuLewatKodeUnik}<br/>
              Ketemu lewat NAMA: {attDebug.ketemuLewatNama}<br/>
              {attDebug.contohStudentIdAsli.length > 0 && (
                <>Contoh studentId asli di data: {attDebug.contohStudentIdAsli.join(', ')}</>
              )}
              {attDebug.ketemuLewatNama === 0 && (
                <><br/>⚠️ Gak ketemu SAMA SEKALI walau dicari pakai nama -- kemungkinan siswa ini memang belum pernah diabsen sama sekali di database.</>
              )}
            </div>
          )}
        </div>

        <div className="sd-card" style={{ background: 'white', padding: 18, borderRadius: 18, border: '1px solid #eef1f5', marginTop: 16, boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <div style={{ width: 44, height: 44, borderRadius: 14, background: 'linear-gradient(135deg,#3b82f6,#8b5cf6)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 17, flexShrink: 0 }}>
              {studentName?.charAt(0) || 'S'}
            </div>
            <div style={{ flex: 1, minWidth: 120 }}>
              <div style={{ fontWeight: 700, fontSize: 14, color: '#1e293b' }}>{studentName}</div>
              <div style={{ fontSize: 11, color: '#64748b' }}>{studentProfile?.kelasSekolah || studentKelas || '-'} • {studentProfile?.kategori || studentProgram || 'Reguler'}</div>
              {studentNim && <div style={{ fontSize: 9, color: '#94a3b8', fontFamily: 'monospace' }}>ID: {studentNim}</div>}
            </div>
            <button onClick={() => navigate('/siswa/materi')} style={{ padding: '9px 16px', background: '#1e293b', color: 'white', border: 'none', borderRadius: 12, fontWeight: 700, fontSize: 11, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5 }}>
              <BookOpen size={14} /> Materi Belajar
            </button>
          </div>
        </div>
      </div>

      {isScanning && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 2000, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: 16 }}>
          <div style={{ background: 'white', padding: 20, borderRadius: 20, width: '90%', maxWidth: 400, textAlign: 'center', position: 'relative' }}>
            <button onClick={() => setIsScanning(false)} style={{ position: 'absolute', top: 10, right: 10, background: 'rgba(0,0,0,0.5)', color: 'white', border: 'none', borderRadius: '50%', width: 30, height: 30, cursor: 'pointer' }}><X size={16} /></button>
            <h3>Scan QR Code</h3>
            <p style={{ fontSize: 11, color: '#94a3b8', marginTop: -8 }}>Pastikan QR ini untuk jadwal kelasmu hari ini</p>
            <div id="reader" style={{ width: '100%', borderRadius: 12, overflow: 'hidden' }}></div>
          </div>
        </div>
      )}

      {isMobile && (
        <button onClick={() => setIsScanning(true)} style={{
          position: 'fixed', bottom: 'max(20px, calc(env(safe-area-inset-bottom) + 12px))', right: 20,
          width: 56, height: 56, borderRadius: '50%', background: '#1e293b', color: 'white', border: 'none',
          boxShadow: '0 8px 20px rgba(0,0,0,0.3)', zIndex: 900, cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}><Camera size={22} /></button>
      )}
    </div>
  );
};

export default StudentDashboard;