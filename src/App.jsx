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
  useParams
} from 'react-router-dom';

// ============================================================
// LOGIN & PUBLIK
// ============================================================
import Login from './pages/Login';
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

import StudentList from './pages/admin/students/StudentList';
import AddStudent from './pages/admin/students/AddStudent';
import StudentAttendance from './pages/admin/students/StudentAttendance';
import StudentFinance from './pages/admin/students/StudentFinance';
import EditStudent from './pages/admin/students/EditStudent';

import FinanceLayout from './pages/admin/finance/FinanceLayout';

import TeacherList from './pages/admin/teachers/TeacherList';
import TeacherSalaries from './pages/admin/teachers/TeacherSalaries';

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
import BankSoalPage from './pages/admin/banksoal/BankSoalPage';
import ImportHasilScanPage from './pages/admin/bank-soal/ImportHasilScanPage';
import DashboardAnalisis from './pages/admin/DashboardAnalisis';
import TerbitkanKuisPage from './pages/admin/bank-soal/TerbitkanKuisPage';
import TerbitkanTryOutPage from './pages/admin/bank-soal/TerbitkanTryOutPage';
import HasilTryOutAdminPage from './pages/admin/bank-soal/HasilTryOutAdminPage';
import DaftarTryOutPage from './pages/student/tryout/DaftarTryOutPage';
import TryOutView from './pages/student/tryout/TryOutView';
import HasilKuisAdminPage from './pages/admin/bank-soal/HasilKuisAdminPage';
import LatihanAktivitasPage from './pages/admin/bank-soal/LatihanAktivitasPage';
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
  const isAuth = localStorage.getItem('isLoggedIn') === 'true';
  const role = localStorage.getItem('role');
  if (!isAuth || role !== 'admin') return <Navigate to="/" replace />;
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

const OwnerRoute = ({ children }) => {
  const isAuth = localStorage.getItem('isOwnerLoggedIn') === 'true';
  if (!isAuth) return <Navigate to="/login-owner" replace />;
  return children;
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
      <Routes>

        {/* PUBLIC */}
        <Route path="/" element={<Login />} />
        <Route path="/login-guru" element={<LoginGuru />} />
        <Route path="/login-siswa" element={<LoginSiswa />} />
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
          path="/admin/students/attendance/:id"
          element={<AdminRoute><StudentAttendance /></AdminRoute>}
        />
        <Route
          path="/admin/students/finance/:id"
          element={<AdminRoute><StudentFinance /></AdminRoute>}
        />
        <Route path="/admin/teachers" element={<AdminRoute><TeacherList /></AdminRoute>} />
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
        <Route path="/admin/bank-soal" element={<AdminRoute><BankSoalPage /></AdminRoute>} />
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
          path="/admin/bank-soal/batalkan-uji-coba"
          element={<AdminRoute><BatalkanUjiCobaPage /></AdminRoute>}
        />

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
        <Route path="/siswa/sesi-live" element={<SiswaRoute><LiveSessionStudent /></SiswaRoute>} />

        {/* ====================================================
            SISWA
            ==================================================== */}
        <Route path="/siswa/dashboard" element={<SiswaPage><StudentDashboard /></SiswaPage>} />
        <Route path="/siswa/tryout" element={<SiswaPage><DaftarTryOutPage /></SiswaPage>} />
        <Route path="/siswa/tryout/:paketId" element={<SiswaRoute><TryOutView /></SiswaRoute>} />
        <Route path="/siswa/materi" element={<SiswaPage><StudentElearning /></SiswaPage>} />
        <Route path="/siswa/jadwal" element={<SiswaPage><StudentSchedule /></SiswaPage>} />
        <Route path="/siswa/keuangan" element={<SiswaPage><StudentFinanceSiswa /></SiswaPage>} />
        <Route path="/siswa/rapor" element={<SiswaPage><StudentGrades /></SiswaPage>} />
        <Route path="/siswa/smart-rapor" element={<SiswaPage><StudentSmartReport /></SiswaPage>} />
        <Route path="/siswa/leaderboard" element={<SiswaRoute><LeaderboardPage /></SiswaRoute>} />
        <Route
          path="/siswa/leaderboard-raport"
          element={<SiswaPage><StudentLeaderboard /></SiswaPage>}
        />
        <Route path="/siswa/absensi" element={<SiswaPage><StudentAttendanceSiswa /></SiswaPage>} />
        <Route path="/siswa/modul/:id" element={<SiswaPage><ModulSiswaWrapper /></SiswaPage>} />
        <Route path="/siswa/kuis/:id" element={<SiswaPage><KuisSiswaWrapper /></SiswaPage>} />
        <Route path="/siswa/survei/:id" element={<SiswaPage><StudentSurveyView /></SiswaPage>} />

        {/* 🔥 Latihan Harian -- SENGAJA tanpa SiswaLayout (gaya app mobile) */}
        <Route
          path="/siswa/latihan-harian"
          element={<SiswaRoute><LatihanHarianPage /></SiswaRoute>}
        />

        {/* 🔥 BUKU INTERAKTIF DIGITAL -- rak buku, daftar isi, reader per bab */}
        <Route path="/siswa/buku" element={<SiswaRoute><BukuInteraktifPage /></SiswaRoute>} />
        <Route path="/siswa/buku/:bukuId" element={<SiswaRoute><BukuInteraktifPage /></SiswaRoute>} />
        <Route
          path="/siswa/buku/:bukuId/:babId"
          element={<SiswaRoute><BukuBacaPage /></SiswaRoute>}
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
    </BrowserRouter>
  );
}

export default App;