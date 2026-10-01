// src/App.jsx
// ============================================================
// v5-catatan: semua baris sengaja PENDEK (maks ~90 karakter).
// Baris super-panjang terbukti rawan korup saat copy-paste di
// editor StackBlitz (kehilangan potongan awal baris). Isi route
// TIDAK berubah dari versi sebelumnya -- hanya format & helper
// SiswaPage/GuruPage untuk memangkas panjang baris.
// ============================================================
import React, { useState, useEffect } from 'react';
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useParams,
  useNavigate
} from 'react-router-dom';
// v5.3: pengaman layar putih -- error render ditampilkan, bukan ditelan
import ErrorBoundary from './components/ErrorBoundary';
// 🔥 BARU: layar "area owner" dipakai OwnerRoute supaya admin yang nyasar
// tidak dilempar ke halaman login (yang dulu ikut membunuh sesi adminnya).
import { catatAudit, KATEGORI } from './utils/auditLog';
import { ambilSesiAdmin, LABEL_PERAN_ADMIN } from './utils/adminAuth';

// ============================================================
// LOGIN & PUBLIK
// ============================================================
import Login from './pages/Login';
// 🔥 BARU (pemisahan akun Admin): portal admin punya halaman login
// sendiri dengan username + password per staf, terpisah dari halaman
// landing publik. Login admin lama (password bersama, tanpa username)
// masih diterima sebagai jalur warisan sampai Owner mematikannya.
import LoginAdmin from './pages/LoginAdmin';
import LoginOwner from './pages/LoginOwner';
import LoginGuru from './pages/LoginGuru';
import LoginSiswa from './pages/LoginSiswa';
import PublicBlog from './pages/PublicBlog';

// ============================================================
// PENDAFTARAN ONLINE
// ============================================================
import PendaftaranOnline from './pages/PendaftaranOnline';
import PendaftaranTentor from './pages/PendaftaranTentor';

// ============================================================
// ADMIN - PENDAFTARAN
// ============================================================
import ManageOnlineRegistration from './pages/admin/pendaftaran/ManageOnlineRegistration';
import ManagePaketHarga from './pages/admin/pendaftaran/ManagePaketHarga';
import ManageTentorRegistration from './pages/admin/pendaftaran/ManageTentorRegistration';

// ============================================================
// ADMIN
// ============================================================
import Dashboard from './pages/admin/Dashboard';
import Settings from './pages/admin/Settings';
import OwnerFinance from './pages/admin/OwnerFinance';
// 🔥 BARU (pemisahan akun Admin): kelola akun staf admin + jejak audit.
// Keduanya dikunci ManajerRoute di bawah -- hanya Owner & Manajer.
import AdminUsers from './pages/admin/AdminUsers';
import AuditLogPage from './pages/admin/AuditLogPage';

import StudentList from './pages/admin/students/StudentList';
import AddStudent from './pages/admin/students/AddStudent';
import StudentAttendance from './pages/admin/students/StudentAttendance';
import AdminAttendanceManage from './pages/admin/students/AdminAttendanceManage';
import StudentFinance from './pages/admin/students/StudentFinance';
import EditStudent from './pages/admin/students/EditStudent';

import FinanceLayout from './pages/admin/finance/FinanceLayout';

import TeacherList from './pages/admin/teachers/TeacherList';
import TeacherSalaries from './pages/admin/teachers/TeacherSalaries';
// 🔥 BARU (pembagian kewenangan admin vs owner): tempat kerja admin untuk
// absensi & riwayat sesi tentor -- validasi fakta sesi TANPA angka uang.
import SesiGuruPage from './pages/admin/teachers/SesiGuruPage';
// 🔥 BARU: hub perkakas -- rumah baru 21 menu jarang sentuh supaya
// sidebar ringkas (beres-beres 2026-10-01).
import PerkakasPage from './pages/admin/PerkakasPage';

import SchedulePage from './pages/admin/schedule/SchedulePage';

import GradeReport from './pages/admin/grades/GradeReport';
import AdminBulkRaport from './pages/admin/grades/AdminBulkRaport';

import AdminDailyLog from './pages/admin/AdminDailyLog';

import ManageBlog from './pages/admin/blog/ManageBlog';

import ManageMateriPortal from './pages/admin/portal-siswa/ManageMateri';
import PortalSiswaHome from './pages/admin/portal-siswa/PortalSiswaHome';
import ManagePoster from './pages/admin/portal-siswa/ManagePoster';
import ManageSurvey from './pages/admin/portal-siswa/ManageSurvey';

// 🔥 BARU: Manajer Buku Digital (CRUD buku + bab, paste JSON, validasi)
import ManajerBuku from './pages/admin/buku/ManajerBuku';
// 🔥 v5: Impor Modul massal (banyak PDF sekaligus -> bab terbit otomatis)
import ImporModul from './pages/admin/buku/ImporModul';

// ============================================================
// 🔥 BANK SOAL
// ============================================================
import ImportHasilScanPage from './pages/admin/bank-soal/ImportHasilScanPage';
import MesinBankSoalPage from './pages/admin/bank-soal/MesinBankSoalPage';
import JadwalTryOutOtomatisPage from './pages/admin/bank-soal/JadwalTryOutOtomatisPage';
import DashboardAnalisis from './pages/admin/DashboardAnalisis';
import TerbitkanKuisPage from './pages/admin/bank-soal/TerbitkanKuisPage';
import TerbitkanTryOutPage from './pages/admin/bank-soal/TerbitkanTryOutPage';
import HasilTryOutAdminPage from './pages/admin/bank-soal/HasilTryOutAdminPage';
import DaftarTryOutPage from './pages/student/tryout/DaftarTryOutPage';
import TryOutView from './pages/student/tryout/TryOutView';
import HasilKuisAdminPage from './pages/admin/bank-soal/HasilKuisAdminPage';
import LatihanAktivitasPage from './pages/admin/bank-soal/LatihanAktivitasPage';
import RankingSiswaPage from './pages/admin/bank-soal/RankingSiswaPage';
import AuditMateriPage from './pages/admin/bank-soal/AuditMateriPage';
import BersihkanSoalPage from './pages/admin/bank-soal/BersihkanSoalPage';
import RapikanLiterasiPage from './pages/admin/bank-soal/RapikanLiterasiPage';
import TaksonomiMateriPage from './pages/admin/bank-soal/TaksonomiMateriPage';
import PetakanMatematikaPage from './pages/admin/bank-soal/PetakanMatematikaPage';
import PetakanMapelPage from './pages/admin/bank-soal/PetakanMapelPage';
import LemariSoalPage from './pages/admin/bank-soal/LemariSoalPage';
import BatalkanUjiCobaPage from './pages/admin/bank-soal/BatalkanUjiCobaPage';

// ============================================================
// GURU
// ============================================================
import TeacherDashboard from './pages/teacher/TeacherDashboard';
import TeacherHistory from './pages/teacher/TeacherHistory';
import TeacherAttendance from './pages/teacher/TeacherAttendance';

import TeacherInputGrade from './pages/teacher/grades/TeacherInputGrade';
import TeacherGradeManager from './pages/teacher/grades/TeacherGradeManager';

import TeacherProfile from './pages/teacher/TeacherProfile';
import TeacherSchedule from './pages/teacher/TeacherSchedule';

import ModulManager from './pages/teacher/modul/ModulManager';
import CekTugasSiswa from './pages/teacher/modul/CekTugasSiswa';
import ManageMateriGuru from './pages/teacher/modul/ManageMateri';
import ManageQuiz from './pages/teacher/modul/ManageQuiz';
import ManageTugas from './pages/teacher/modul/ManageTugas';

import ClassSession from './pages/teacher/ClassSession';

import TeacherLearningAid from './pages/teacher/TeacherLearningAid';
import LiveSessionTeacher from './pages/teacher/LiveSessionTeacher';
import LiveSessionStudent from './pages/student/LiveSessionStudent';

// ============================================================
// SMART RAPORT
// ============================================================
import GenerateRaport from './pages/teacher/grades/GenerateRaport';

import StudentLeaderboard from './pages/student/raport/StudentLeaderboard';
import LeaderboardPage from './pages/student/LeaderboardPage';
import GateAksesSiswa from './components/GateAksesSiswa';
import StudentSmartReport from './pages/student/raport/StudentSmartReport';

// ============================================================
// SISWA
// ============================================================
import SidebarSiswa from './components/SidebarSiswa';

import StudentDashboard from './pages/student/StudentDashboard';
import LatihanHarianPage from './pages/student/gemilang/LatihanHarianPage';
// 🔥 BUKU INTERAKTIF DIGITAL -- rak buku + reader per bab
import BukuInteraktifPage from './pages/student/gemilang/BukuInteraktifPage';
import BukuBacaPage from './pages/student/gemilang/BukuBacaPage';
import StudentSchedule from './pages/student/StudentSchedule';
import StudentFinanceSiswa from './pages/student/StudentFinance';
import StudentGrades from './pages/student/StudentGrades';
import StudentAttendanceSiswa from './pages/student/StudentAttendance';
import StudentElearning from './pages/student/StudentElearning';
// MATERI v2 -- rombak tampilan materi belajar
// (rencana: docs/RENCANA-ROMBAK-MATERI.md)
import BelajarHome from './pages/student/belajar/BelajarHome';
import BelajarDaftarIsi from './pages/student/belajar/BelajarDaftarIsi';
import BelajarReader from './pages/student/belajar/BelajarReader';
// FASE 3: panggung presentasi guru (sinkron proyektor-siswa)
import DaftarPresentasi from './pages/teacher/presentasi/DaftarPresentasi';
import ReviewSesi from './pages/teacher/presentasi/ReviewSesi';
import PanggungPresentasi from './pages/teacher/presentasi/PanggungPresentasi';
// FASE 4: manajer materi v2 (admin)
import ManageMateriV2 from './pages/admin/materi/ManageMateriV2';
import EditBabV2 from './pages/admin/materi/EditBabV2';
// FASE 4.2: bank materi (gudang file pusat admin)
import BankMateriV2 from './pages/admin/materi/BankMateriV2';
// FASE 4.1: PPT versi guru sendiri
import PptVersiGuru from './pages/teacher/presentasi/PptVersiGuru';
import StudentModuleView from './pages/student/StudentModuleView';
import StudentQuizView from './pages/student/StudentQuizView';
import StudentSurveyView from './pages/student/StudentSurveyView';

// ============================================================
// TEACHER LAYOUT
// ============================================================
import TeacherLayout from './pages/teacher/TeacherLayout';

// ============================================================
// ROUTE GUARDS
// ============================================================

const AdminRoute = ({ children }) => {
  // 🔥 UPGRADE (pemisahan hak akses): area /admin/* boleh dimasuki
  // Admin Kasir (login password) ATAU Owner (login PIN). Owner adalah
  // super admin -- dia yang pegang keuangan besar, wajar kalau dia juga
  // perlu masuk area admin (kelola siswa, gaji guru, pengaturan).
  const isAuth = localStorage.getItem('isLoggedIn') === 'true';
  const role = localStorage.getItem('role');
  const adminOk = isAuth && role === 'admin';
  const ownerOk =
    localStorage.getItem('isOwnerLoggedIn') === 'true' && role === 'owner';
  if (!adminOk && !ownerOk) return <Navigate to="/login-admin" replace />;
  return children;
};

// 🔥 BARU (pemisahan akun Admin): guard untuk halaman yang membocorkan
// identitas & aktivitas staf -- kelola akun admin dan jejak audit.
//
// Guard ini hanya memastikan pengunjung sudah login sebagai admin/owner.
// Pemeriksaan peran (harus 'manajer' atau owner) dilakukan DI DALAM
// komponennya, supaya kasir yang iseng membuka URL melihat penjelasan
// "Akses Ditolak -- akun Anda berperan Kasir", bukan dilempar diam-diam
// ke halaman lain tanpa tahu sebabnya.
const ManajerRoute = ({ children }) => {
  const role = localStorage.getItem('role');
  const ownerOk =
    localStorage.getItem('isOwnerLoggedIn') === 'true' && role === 'owner';
  const adminOk =
    localStorage.getItem('isLoggedIn') === 'true' && role === 'admin';
  if (!ownerOk && !adminOk) return <Navigate to="/login-admin" replace />;
  return children;
};

const GuruRoute = ({ children }) => {
  const isAuth =
    localStorage.getItem('isGuruLoggedIn') === 'true' ||
    !!localStorage.getItem('teacherData');
  const role = localStorage.getItem('role');
  if (!isAuth || (role !== 'guru' && role !== 'teacher')) {
    return <Navigate to="/login-guru" replace />;
  }
  return children;
};

const SiswaRoute = ({ children }) => {
  const isAuth = localStorage.getItem('isSiswaLoggedIn') === 'true';
  if (!isAuth) return <Navigate to="/login-siswa" replace />;
  return children;
};

// 🔥 DIPERBAIKI (keluhan nyata 2026-10-01): dulu admin yang membuka area
// owner LANGSUNG dilempar ke /login-owner. Selain membingungkan, itu
// BERBAHAYA: kalau dia menurut dan login owner di sana, sesi admin-nya
// MATI (sesi admin & owner saling meniadakan) -- pekerjaannya hilang.
//
// Sekarang: kalau yang datang adalah admin yang sah, tampilkan layar
// "area khusus owner" DI DALAM aplikasi. Sesinya utuh, dia bisa kembali
// ke dashboard dengan satu klik, dan percobaannya tercatat di jejak audit.
// Yang benar-benar belum login siapa pun tetap diarahkan ke login owner.
const LayarTerkunciOwner = () => {
  const navigate = useNavigate();
  const sesi = ambilSesiAdmin();
  useEffect(() => {
    catatAudit('akses.ditolak', {
      kategori: KATEGORI.AUTH,
      target: 'Mencoba membuka area khusus Owner',
      detail: { url: window.location.pathname },
    });
  }, []);
  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center',
      justifyContent: 'center', padding: 20,
      background: 'linear-gradient(135deg, #0f0a1e 0%, #1a1030 50%, #0a0614 100%)',
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
    }}>
      <div style={{
        maxWidth: 460, width: '100%', textAlign: 'center',
        background: 'rgba(255,255,255,0.035)', border: '1px solid rgba(251,191,36,0.2)',
        borderRadius: 20, padding: '36px 30px', boxSizing: 'border-box',
      }}>
        <div style={{
          width: 64, height: 64, borderRadius: '50%', margin: '0 auto 16px',
          background: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.25)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26,
        }}>👑</div>
        <h2 style={{ color: '#fff', fontSize: 19, fontWeight: 800, margin: '0 0 8px' }}>
          Area Khusus Owner
        </h2>
        <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: 13, lineHeight: 1.65, margin: '0 0 6px' }}>
          Halaman ini berisi keputusan uang: honor tentor, tarif, pembayaran,
          dan pengaturan global. Sesuai pembagian kewenangan bimbel, itu
          wilayah <b style={{ color: '#fbbf24' }}>Owner</b>.
        </p>
        <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: 12.5, lineHeight: 1.6, margin: '0 0 20px' }}>
          Anda masuk sebagai{' '}
          <b style={{ color: '#93c5fd' }}>
            {sesi?.nama || 'Admin'} ({LABEL_PERAN_ADMIN[sesi?.peran] || 'Admin'})
          </b>.
          Sesi Anda <b>tidak diputus</b> -- kembali saja ke dashboard dan
          pekerjaan Anda masih ada.
        </p>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
          <button
            onClick={() => navigate('/admin')}
            style={{
              background: 'linear-gradient(135deg, #60a5fa, #2563eb)', color: '#06121f',
              border: 'none', borderRadius: 10, padding: '11px 20px',
              fontSize: 13, fontWeight: 800, cursor: 'pointer',
            }}
          >
            ← Kembali ke Dashboard Admin
          </button>
          <button
            onClick={() => navigate('/admin/teachers/sesi')}
            style={{
              background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.75)',
              border: '1px solid rgba(255,255,255,0.14)', borderRadius: 10,
              padding: '11px 18px', fontSize: 13, fontWeight: 600, cursor: 'pointer',
            }}
          >
            Buka Sesi & Validasi Guru
          </button>
        </div>
        <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 11, lineHeight: 1.6, margin: '18px 0 0' }}>
          Butuh mengakses halaman ini? Minta Owner membukanya sendiri lewat
          Portal Owner (PIN) — atau, untuk urusan absensi & riwayat sesi,
          pakai halaman Sesi & Validasi Guru yang memang untuk admin.
        </p>
      </div>
    </div>
  );
};

const OwnerRoute = ({ children }) => {
  const isAuth = localStorage.getItem('isOwnerLoggedIn') === 'true';
  if (isAuth) return children;

  const adminOk =
    localStorage.getItem('isLoggedIn') === 'true' &&
    localStorage.getItem('role') === 'admin';
  if (adminOk) return <LayarTerkunciOwner />;

  return <Navigate to="/login-owner" replace />;
};

// ============================================================
// SISWA LAYOUT
// ============================================================

const SiswaLayout = ({ children }) => {
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 1024);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeMenu, setActiveMenu] = useState('dashboard');

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 1024);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div style={{ display: 'flex', minHeight: '100vh', width: '100%', background: '#f8fafc' }}>
      <SidebarSiswa
        activeMenu={activeMenu}
        setActiveMenu={setActiveMenu}
        isOpen={sidebarOpen}
        setIsOpen={setSidebarOpen}
      />
      <main style={gayaMainSiswa(isMobile)}>
        <header style={gayaHeaderSiswa}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {isMobile && (
              <button onClick={() => setSidebarOpen(true)} style={gayaTombolMenu}>☰</button>
            )}
            <div>
              <h4 style={{ margin: 0, fontSize: 13, color: '#1e293b' }}>Bimbel Gemilang</h4>
              <small style={{ color: '#7f8c8d', fontSize: 10 }}>Portal Siswa</small>
            </div>
          </div>
          <div style={gayaAvatarSiswa}>
            {localStorage.getItem('studentName')?.charAt(0) || 'S'}
          </div>
        </header>
        <div style={gayaIsiSiswa(isMobile)}>
          {children}
        </div>
      </main>
    </div>
  );
};

// ============================================================
// GAYA LAYOUT SISWA (dipisah biar tidak ada baris raksasa)
// ============================================================
const gayaHeaderSiswa = {
  background: 'white',
  padding: '12px 20px',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  borderBottom: '1px solid #eee',
  position: 'sticky',
  top: 0,
  zIndex: 99,
};

const gayaMainSiswa = (isMobile) => ({
  flex: 1,
  marginLeft: isMobile ? 0 : '260px',
  transition: 'margin-left 0.3s ease',
  width: '100%',
  maxWidth: '100vw',
  overflowX: 'hidden',
});

const gayaTombolMenu = {
  background: 'none',
  border: 'none',
  cursor: 'pointer',
  fontSize: 20,
};

const gayaIsiSiswa = (isMobile) => ({
  padding: isMobile ? 10 : 20,
  width: '100%',
  boxSizing: 'border-box',
  minHeight: 'calc(100vh - 60px)',
});

const gayaAvatarSiswa = {
  width: 32,
  height: 32,
  background: '#10b981',
  borderRadius: '50%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontWeight: 'bold',
  color: 'white',
  fontSize: 12,
};

// ============================================================
// HELPER PEMBUNGKUS ROUTE (biar baris route tetap pendek)
// ============================================================

const GuruPage = ({ children }) => (
  <GuruRoute>
    <TeacherLayout>{children}</TeacherLayout>
  </GuruRoute>
);

const SiswaPage = ({ children }) => (
  <SiswaRoute>
    <SiswaLayout>{children}</SiswaLayout>
  </SiswaRoute>
);

// Fitur belajar: cek isBlocked / status sebelum tampil (buku, tryout, latihan, leaderboard)
const SiswaFiturBelajar = ({ children, fitur }) => (
  <SiswaRoute>
    <GateAksesSiswa fitur={fitur}>{children}</GateAksesSiswa>
  </SiswaRoute>
);

const SiswaPageBelajar = ({ children, fitur }) => (
  <SiswaRoute>
    <SiswaLayout>
      <GateAksesSiswa fitur={fitur}>{children}</GateAksesSiswa>
    </SiswaLayout>
  </SiswaRoute>
);

// ============================================================
// KUIS SISWA WRAPPER
// ============================================================

const bacaSiswa = () => ({
  uid: localStorage.getItem('studentId'),
  id: localStorage.getItem('studentId'),
  nama: localStorage.getItem('studentName'),
  kelasSekolah: localStorage.getItem('studentGrade') || '',
  studentId: localStorage.getItem('studentId'),
  nim: localStorage.getItem('studentNim') || localStorage.getItem('studentId')
});

const KuisSiswaWrapper = () => {
  const { id } = useParams();
  return (
    <StudentQuizView
      modulId={id}
      studentData={bacaSiswa()}
      onBack={() => window.history.back()}
    />
  );
};

// ============================================================
// MODUL SISWA WRAPPER
// ============================================================

const ModulSiswaWrapper = () => {
  const { id } = useParams();
  return (
    <StudentModuleView
      modulId={id}
      onBack={() => window.history.back()}
      studentData={bacaSiswa()}
    />
  );
};

// ============================================================
// APP
// ============================================================

function App() {
  useEffect(() => {
    const standalone = window.matchMedia('(display-mode: standalone)').matches;
    if (standalone && window.location.pathname === '/') {
      const sudahLoginSiswa = localStorage.getItem('isSiswaLoggedIn') === 'true';
      window.location.href = sudahLoginSiswa ? '/siswa/dashboard' : '/login-siswa';
    }
  }, []);

  return (
    <BrowserRouter>
      <ErrorBoundary>
      <Routes>

        {/* PUBLIC */}
        <Route path="/" element={<Login />} />
        <Route path="/login-guru" element={<LoginGuru />} />
        <Route path="/login-siswa" element={<LoginSiswa />} />
        {/* 🔥 BARU: portal admin punya jalur login sendiri (username +
            password per staf). Route lama "/" tetap jalan, tapi tombol
            "Login Admin" di sana sekarang mengarah ke sini. */}
        <Route path="/login-admin" element={<LoginAdmin />} />
        <Route path="/login-owner" element={<LoginOwner />} />
        <Route path="/aktivitas" element={<PublicBlog />} />
        <Route path="/pendaftaran" element={<PendaftaranOnline />} />
        <Route path="/pendaftaran-tentor" element={<PendaftaranTentor />} />

        {/* ====================================================
            ADMIN
            ==================================================== */}

        <Route path="/admin" element={<AdminRoute><Dashboard /></AdminRoute>} />
        <Route path="/admin/analisis" element={<AdminRoute><DashboardAnalisis /></AdminRoute>} />
        <Route path="/admin/students" element={<AdminRoute><StudentList /></AdminRoute>} />
        <Route path="/admin/students/add" element={<AdminRoute><AddStudent /></AdminRoute>} />
        <Route
          path="/admin/students/edit/:id"
          element={<AdminRoute><EditStudent /></AdminRoute>}
        />
        <Route
          path="/admin/attendance"
          element={<AdminRoute><AdminAttendanceManage /></AdminRoute>}
        />
        <Route
          path="/admin/students/attendance/:id"
          element={<AdminRoute><StudentAttendance /></AdminRoute>}
        />
        <Route
          path="/admin/students/finance/:id"
          element={<AdminRoute><StudentFinance /></AdminRoute>}
        />
        <Route path="/admin/teachers" element={<AdminRoute><TeacherList /></AdminRoute>} />
        {/* 🔥 BARU: tempat kerja admin untuk absensi/riwayat sesi tentor.
            Fakta sesi + validasi + unduh CSV, TANPA nominal honor. */}
        <Route
          path="/admin/teachers/sesi"
          element={<AdminRoute><SesiGuruPage /></AdminRoute>}
        />
        {/* 🔥 BARU: hub perkakas bank soal & konten (21 menu diringkas
            jadi satu pintu berdeskripsi + pencatat klik). */}
        <Route
          path="/admin/perkakas"
          element={<AdminRoute><PerkakasPage /></AdminRoute>}
        />
        {/* 🔥 DIUBAH (keputusan owner 2026-10-01): rekap honor/gaji guru
            sekarang wilayah ADMIN OPERASIONAL, bukan owner-only. Pembagian
            akhirnya: admin memegang kendali (validasi sesi, rekap, nominal,
            tarif), owner hanya MENGEKSEKUSI PEMBAYARAN di Portal Owner
            (menu Bayar Tentor, muncul di minggu terakhir bulan).
            Sebelumnya route ini OwnerRoute dan admin yang klik tombol Gaji
            terpental ke /login-owner -- keluhan nyata yang memicu perubahan. */}
        <Route
          path="/admin/teachers/salaries"
          element={<AdminRoute><TeacherSalaries /></AdminRoute>}
        />
        <Route path="/admin/portal" element={<AdminRoute><PortalSiswaHome /></AdminRoute>} />
        <Route path="/admin/portal/poster" element={<AdminRoute><ManagePoster /></AdminRoute>} />
        <Route
          path="/admin/portal/materi"
          element={<AdminRoute><ManageMateriPortal /></AdminRoute>}
        />
        <Route path="/admin/portal/survey" element={<AdminRoute><ManageSurvey /></AdminRoute>} />

        {/* 🔥 BARU: MANAJER BUKU DIGITAL */}
        <Route path="/admin/buku" element={<AdminRoute><ManajerBuku /></AdminRoute>} />
        {/* MATERI v2 FASE 4 -- manajer konten baru (aditif) */}
        <Route
          path="/admin/materi-v2"
          element={<AdminRoute><ManageMateriV2 /></AdminRoute>}
        />
        <Route
          path="/admin/materi-v2/:materiId"
          element={<AdminRoute><EditBabV2 /></AdminRoute>}
        />
        {/* FASE 4.2: bank materi (gudang file pusat) */}
        <Route
          path="/admin/bank-materi"
          element={<AdminRoute><BankMateriV2 /></AdminRoute>}
        />
        {/* 🔥 v5: IMPOR MODUL MASSAL (PDF -> bab) */}
        <Route path="/admin/buku/impor" element={<AdminRoute><ImporModul /></AdminRoute>} />

        {/* PENDAFTARAN */}
        <Route
          path="/admin/pendaftaran"
          element={<AdminRoute><ManageOnlineRegistration /></AdminRoute>}
        />
        <Route
          path="/admin/pendaftaran/harga"
          element={<AdminRoute><ManagePaketHarga /></AdminRoute>}
        />
        <Route
          path="/admin/pendaftaran/tentor"
          element={<AdminRoute><ManageTentorRegistration /></AdminRoute>}
        />

        {/* KEUANGAN */}
        <Route path="/admin/finance" element={<AdminRoute><FinanceLayout /></AdminRoute>} />
        <Route path="/admin/finance/income" element={<Navigate to="/admin/finance" replace />} />
        <Route path="/admin/finance/expense" element={<Navigate to="/admin/finance" replace />} />
        <Route path="/admin/finance/debt" element={<Navigate to="/admin/finance" replace />} />

        {/* JADWAL */}
        <Route path="/admin/schedule" element={<AdminRoute><SchedulePage /></AdminRoute>} />
        <Route path="/admin/teachers/schedule" element={<Navigate to="/admin/schedule" replace />} />

        {/* RAPORT */}
        <Route path="/admin/grades" element={<AdminRoute><GradeReport /></AdminRoute>} />
        <Route path="/admin/grades/bulk" element={<AdminRoute><AdminBulkRaport /></AdminRoute>} />

        {/* DAILY LOG */}
        <Route path="/admin/daily-log" element={<AdminRoute><AdminDailyLog /></AdminRoute>} />

        {/* BLOG */}
        <Route path="/admin/blog" element={<AdminRoute><ManageBlog /></AdminRoute>} />

        {/* ====================================================
            🔥 BANK SOAL
            ==================================================== */}
        <Route path="/admin/bank-soal" element={<AdminRoute><MesinBankSoalPage /></AdminRoute>} />
        <Route
          path="/admin/bank-soal/mesin"
          element={<AdminRoute><MesinBankSoalPage /></AdminRoute>}
        />
        <Route
          path="/admin/bank-soal/tryout-otomatis"
          element={<AdminRoute><JadwalTryOutOtomatisPage /></AdminRoute>}
        />
        <Route
          path="/admin/bank-soal/import"
          element={<AdminRoute><ImportHasilScanPage /></AdminRoute>}
        />
        <Route
          path="/admin/bank-soal/terbitkan"
          element={<AdminRoute><TerbitkanKuisPage /></AdminRoute>}
        />
        <Route
          path="/admin/bank-soal/terbitkan-tryout"
          element={<AdminRoute><TerbitkanTryOutPage /></AdminRoute>}
        />
        <Route
          path="/admin/bank-soal/hasil-tryout"
          element={<AdminRoute><HasilTryOutAdminPage /></AdminRoute>}
        />
        <Route
          path="/admin/bank-soal/hasil"
          element={<AdminRoute><HasilKuisAdminPage /></AdminRoute>}
        />
        <Route
          path="/admin/bank-soal/aktivitas-latihan"
          element={<AdminRoute><LatihanAktivitasPage /></AdminRoute>}
        />
        <Route
          path="/admin/bank-soal/ranking-siswa"
          element={<AdminRoute><RankingSiswaPage /></AdminRoute>}
        />
        <Route
          path="/admin/bank-soal/audit-materi"
          element={<AdminRoute><AuditMateriPage /></AdminRoute>}
        />
        <Route
          path="/admin/bank-soal/bersihkan-soal"
          element={<AdminRoute><BersihkanSoalPage /></AdminRoute>}
        />
        <Route
          path="/admin/bank-soal/rapikan-literasi"
          element={<AdminRoute><RapikanLiterasiPage /></AdminRoute>}
        />
        <Route
          path="/admin/bank-soal/taksonomi-materi"
          element={<AdminRoute><TaksonomiMateriPage /></AdminRoute>}
        />
        <Route
          path="/admin/bank-soal/petakan-matematika"
          element={<AdminRoute><PetakanMatematikaPage /></AdminRoute>}
        />
        <Route
          path="/admin/bank-soal/petakan-mapel"
          element={<AdminRoute><PetakanMapelPage /></AdminRoute>}
        />
        <Route
          path="/admin/bank-soal/lemari-soal"
          element={<AdminRoute><LemariSoalPage /></AdminRoute>}
        />
        <Route
          path="/admin/bank-soal/batalkan-uji-coba"
          element={<AdminRoute><BatalkanUjiCobaPage /></AdminRoute>}
        />

        {/* 🔥 BARU (pemisahan akun Admin): kelola akun staf admin dan
            jejak aktivitas. Dikunci ManajerRoute + pengecekan peran di
            dalam komponennya (hanya Owner & admin 'manajer'). */}
        <Route
          path="/admin/pengguna"
          element={<ManajerRoute><AdminUsers /></ManajerRoute>}
        />
        <Route
          path="/admin/audit"
          element={<ManajerRoute><AuditLogPage /></ManajerRoute>}
        />
        <Route
          path="/admin/pengguna-admin"
          element={<Navigate to="/admin/pengguna" replace />}
        />
        {/* Alias lama yang mungkin sudah terlanjur dibagikan/dibookmark. */}
        <Route path="/admin/login" element={<Navigate to="/login-admin" replace />} />

        {/* OWNER / SETTINGS */}
        <Route path="/admin/settings" element={<OwnerRoute><Settings /></OwnerRoute>} />
        <Route path="/owner/settings" element={<OwnerRoute><Settings /></OwnerRoute>} />
        <Route path="/owner/finance" element={<OwnerRoute><OwnerFinance /></OwnerRoute>} />

        {/* ====================================================
            GURU
            ==================================================== */}
        <Route path="/guru/dashboard" element={<GuruPage><TeacherDashboard /></GuruPage>} />
        <Route path="/guru/profile" element={<GuruPage><TeacherProfile /></GuruPage>} />
        <Route path="/guru/schedule" element={<GuruPage><TeacherSchedule /></GuruPage>} />
        <Route path="/guru/attendance" element={<GuruPage><TeacherAttendance /></GuruPage>} />
        <Route path="/guru/history" element={<GuruPage><TeacherHistory /></GuruPage>} />
        <Route path="/guru/class-session/:id" element={<GuruPage><ClassSession /></GuruPage>} />
        <Route path="/guru/grades/input" element={<GuruPage><TeacherInputGrade /></GuruPage>} />
        <Route path="/guru/grades/manage" element={<GuruPage><TeacherGradeManager /></GuruPage>} />
        <Route path="/guru/grades/generate" element={<GuruPage><GenerateRaport /></GuruPage>} />
        <Route path="/guru/modul" element={<GuruPage><ModulManager /></GuruPage>} />
        <Route path="/guru/modul/materi" element={<GuruPage><ManageMateriGuru /></GuruPage>} />
        <Route path="/guru/modul/tugas" element={<GuruPage><ManageTugas /></GuruPage>} />
        <Route path="/guru/modul/quiz" element={<GuruPage><ManageQuiz /></GuruPage>} />
        <Route path="/guru/cek-tugas" element={<GuruPage><CekTugasSiswa /></GuruPage>} />
        <Route path="/guru/alat-bantu" element={<GuruPage><TeacherLearningAid /></GuruPage>} />
        <Route path="/guru/sesi-live" element={<GuruRoute><LiveSessionTeacher /></GuruRoute>} />
        {/* MATERI v2 FASE 3 -- panggung presentasi sinkron.
            Panggung full-screen (tanpa layout) supaya bersih
            di proyektor; daftar pakai layout guru. */}
        <Route
          path="/guru/presentasi"
          element={<GuruPage><DaftarPresentasi /></GuruPage>}
        />
        <Route
          path="/guru/presentasi/:materiId/:babId"
          element={<GuruRoute><PanggungPresentasi /></GuruRoute>}
        />
        {/* Turn 91: mode baca guru — reader versi siswa untuk guru membaca
            materi lengkap sebelum presentasi/ujian. */}
        <Route
          path="/guru/belajar/:materiId/:babId"
          element={<GuruPage><BelajarReader audience="teacher" /></GuruPage>}
        />
        {/* Turn 94: review sesi & leaderboard — nilai sesi ujian bisa
            dibuka kembali kapan pun (aktif maupun selesai). */}
        <Route
          path="/guru/review-sesi/:sesiId"
          element={<GuruPage><ReviewSesi /></GuruPage>}
        />
        {/* FASE 4.1: guru upload PPT versinya sendiri per bab */}
        <Route
          path="/guru/ppt-ku"
          element={<GuruPage><PptVersiGuru /></GuruPage>}
        />
        <Route path="/siswa/sesi-live" element={<SiswaRoute><LiveSessionStudent /></SiswaRoute>} />

        {/* ====================================================
            SISWA
            ==================================================== */}
        <Route path="/siswa/dashboard" element={<SiswaPage><StudentDashboard /></SiswaPage>} />
        <Route path="/siswa/tryout" element={<SiswaPageBelajar fitur="Try Out"><DaftarTryOutPage /></SiswaPageBelajar>} />
        <Route path="/siswa/tryout/:paketId" element={<SiswaFiturBelajar fitur="Try Out"><TryOutView /></SiswaFiturBelajar>} />
        <Route path="/siswa/materi" element={<SiswaPageBelajar fitur="E-Learning"><StudentElearning /></SiswaPageBelajar>} />
        {/* MATERI v2 -- tampilan materi belajar baru (fase 1-2,
            docs/RENCANA-ROMBAK-MATERI.md). Reader full-screen. */}
        <Route
          path="/siswa/belajar"
          element={
            <SiswaPageBelajar fitur="Materi Belajar">
              <BelajarHome />
            </SiswaPageBelajar>
          }
        />
        <Route
          path="/siswa/belajar/:materiId"
          element={
            <SiswaPageBelajar fitur="Materi Belajar">
              <BelajarDaftarIsi />
            </SiswaPageBelajar>
          }
        />
        <Route
          path="/siswa/belajar/:materiId/:babId"
          element={
            <SiswaFiturBelajar fitur="Materi Belajar">
              <BelajarReader />
            </SiswaFiturBelajar>
          }
        />
        <Route path="/siswa/jadwal" element={<SiswaPage><StudentSchedule /></SiswaPage>} />
        <Route path="/siswa/keuangan" element={<SiswaPage><StudentFinanceSiswa /></SiswaPage>} />
        <Route path="/siswa/rapor" element={<SiswaPage><StudentGrades /></SiswaPage>} />
        <Route path="/siswa/smart-rapor" element={<SiswaPage><StudentSmartReport /></SiswaPage>} />
        <Route path="/siswa/leaderboard" element={<SiswaFiturBelajar fitur="Papan Peringkat"><LeaderboardPage /></SiswaFiturBelajar>} />
        <Route
          path="/siswa/leaderboard-raport"
          element={<SiswaPage><StudentLeaderboard /></SiswaPage>}
        />
        <Route path="/siswa/absensi" element={<SiswaPage><StudentAttendanceSiswa /></SiswaPage>} />
        <Route path="/siswa/modul/:id" element={<SiswaPageBelajar fitur="Materi Modul"><ModulSiswaWrapper /></SiswaPageBelajar>} />
        <Route path="/siswa/kuis/:id" element={<SiswaPageBelajar fitur="Kuis"><KuisSiswaWrapper /></SiswaPageBelajar>} />
        <Route path="/siswa/survei/:id" element={<SiswaPage><StudentSurveyView /></SiswaPage>} />

        {/* 🔥 Latihan Harian -- SENGAJA tanpa SiswaLayout (gaya app mobile) */}
        <Route
          path="/siswa/latihan-harian"
          element={<SiswaFiturBelajar fitur="Latihan Harian"><LatihanHarianPage /></SiswaFiturBelajar>}
        />

        {/* 🔥 BUKU INTERAKTIF DIGITAL -- rak buku, daftar isi, reader per bab */}
        <Route path="/siswa/buku" element={<SiswaFiturBelajar fitur="Buku Digital"><BukuInteraktifPage /></SiswaFiturBelajar>} />
        <Route path="/siswa/buku/:bukuId" element={<SiswaFiturBelajar fitur="Buku Digital"><BukuInteraktifPage /></SiswaFiturBelajar>} />
        <Route
          path="/siswa/buku/:bukuId/:babId"
          element={<SiswaFiturBelajar fitur="Buku Digital"><BukuBacaPage /></SiswaFiturBelajar>}
        />

        {/* REDIRECT */}
        <Route path="/teacher/*" element={<Navigate to="/guru/dashboard" replace />} />
        <Route path="/guru/manual-input" element={<Navigate to="/guru/attendance" replace />} />
        <Route path="/guru/manage-quiz" element={<Navigate to="/guru/modul/quiz" replace />} />
        <Route
          path="/guru/generate-raport"
          element={<Navigate to="/guru/grades/generate" replace />}
        />
        <Route path="/guru/modul/cek-tugas" element={<Navigate to="/guru/cek-tugas" replace />} />
        <Route path="/siswa/raport" element={<Navigate to="/siswa/rapor" replace />} />

        {/* FALLBACK */}
        <Route path="*" element={<Navigate to="/" replace />} />

      </Routes>
      </ErrorBoundary>
    </BrowserRouter>
  );
}

export default App;