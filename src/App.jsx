import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

// === LOGIN & PUBLIK ===
import Login from './pages/Login';
import LoginGuru from './pages/LoginGuru';
import LoginSiswa from './pages/LoginSiswa'; 
import PublicBlog from './pages/PublicBlog'; 

// === ADMIN ===
import Dashboard from './pages/admin/Dashboard'; 
import Settings from './pages/admin/Settings';
import AdminDailyLog from './pages/admin/AdminDailyLog';

// ADMIN - STUDENTS
import StudentList from './pages/admin/students/StudentList';
import AddStudent from './pages/admin/students/AddStudent';
import EditStudent from './pages/admin/students/EditStudent';
import StudentAttendance from './pages/admin/students/StudentAttendance';
import StudentFinance from './pages/admin/students/StudentFinance';

// ADMIN - TEACHERS
import TeacherList from './pages/admin/teachers/TeacherList';
import TeacherSalaries from './pages/admin/teachers/TeacherSalaries';
import TeacherSchedule from './pages/admin/teachers/TeacherSchedule'; // ✅ HANYA SATU

// ADMIN - FINANCE
import FinanceLayout from './pages/admin/finance/FinanceLayout';
import FinanceDashboard from './pages/admin/finance/FinanceDashboard';
import IncomeEntry from './pages/admin/finance/IncomeEntry';
import ExpenseEntry from './pages/admin/finance/ExpenseEntry';
import DebtControl from './pages/admin/finance/DebtControl';
import TransactionHistory from './pages/admin/finance/TransactionHistory';

// ADMIN - SCHEDULE
import SchedulePage from './pages/admin/schedule/SchedulePage';

// ADMIN - GRADES (RAPORT)
import GradeReport from './pages/admin/grades/GradeReport';
import AdminBulkRaport from './pages/admin/grades/AdminBulkRaport';

// ADMIN - PORTAL SISWA
import PortalSiswaHome from './pages/admin/portal-siswa/PortalSiswaHome';
import ManageMateriPortal from './pages/admin/portal-siswa/ManageMateri';
import ManagePoster from './pages/admin/portal-siswa/ManagePoster';
import ManageSurvey from './pages/admin/portal-siswa/ManageSurvey';
import ManagePengumuman from './pages/admin/portal-siswa/ManagePengumuman';
import ManageFinance from './pages/admin/portal-siswa/ManageFinance';

// ADMIN - BLOG
import ManageBlog from './pages/admin/blog/ManageBlog';

// === GURU ===
import SidebarGuru from './components/SidebarGuru';
import TeacherDashboard from './pages/teacher/TeacherDashboard'; 
import TeacherHistory from './pages/teacher/TeacherHistory';
import TeacherManualInput from './pages/teacher/TeacherManualInput'; 
import TeacherProfile from './pages/teacher/TeacherProfile'; 
// import TeacherSchedule dari sini SUDAH DIHAPUS (karena sudah ada dari admin)
import ClassSession from './pages/teacher/ClassSession';
import TeacherLayout from './pages/teacher/TeacherLayout';

// GURU - GRADES (RAPORT & NILAI)
import TeacherInputGrade from './pages/teacher/grades/TeacherInputGrade'; 
import TeacherGradeManager from './pages/teacher/grades/TeacherGradeManager'; 
import GenerateRaport from './pages/teacher/grades/GenerateRaport';

// GURU - MODUL (E-LEARNING)
import ModulManager from './pages/teacher/modul/ModulManager'; 
import CekTugasSiswa from './pages/teacher/modul/CekTugasSiswa';
import ManageMateriGuru from './pages/teacher/modul/ManageMateri';
import ManageQuiz from './pages/teacher/modul/ManageQuiz';
import ManageTugas from './pages/teacher/modul/ManageTugas';

// === SISWA ===
import StudentDashboard from './pages/student/StudentDashboard';
import StudentSchedule from './pages/student/StudentSchedule';
import StudentFinanceSiswa from './pages/student/StudentFinance';
import StudentGrades from './pages/student/StudentGrades';
import StudentAttendanceSiswa from './pages/student/StudentAttendance';
import StudentElearning from './pages/student/StudentElearning';
import StudentModuleView from './pages/student/StudentModuleView';

// SISWA - SMART RAPORT
import StudentLeaderboard from './pages/student/raport/StudentLeaderboard';
import StudentSmartReport from './pages/student/raport/StudentSmartReport';

// === ROUTE GUARDS ===
const AdminRoute = ({ children }) => {
  const isAuth = localStorage.getItem('isLoggedIn') === 'true';
  const role = localStorage.getItem('role');
  if (!isAuth || role !== 'admin') return <Navigate to="/" replace />;
  return children;
};

const GuruRoute = ({ children }) => {
  const isAuth = localStorage.getItem('isGuruLoggedIn') === 'true';
  const role = localStorage.getItem('role');
  if (!isAuth || role !== 'guru') return <Navigate to="/login-guru" replace />;
  return children;
};

const SiswaRoute = ({ children }) => {
  const isAuth = localStorage.getItem('isSiswaLoggedIn') === 'true';
  const role = localStorage.getItem('role');
  if (!isAuth || role !== 'siswa') return <Navigate to="/login-siswa" replace />;
  return children;
};

// === TEACHER LAYOUT ===
const TeacherLayoutWrapper = ({ children }) => {
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 1024);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 1024);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div style={{ display: 'flex', minHeight: '100vh', width: '100%', background: '#f8fafc' }}>
      <SidebarGuru />
      <main style={{
        flex: 1, marginLeft: isMobile ? 0 : '260px', transition: 'margin-left 0.3s ease',
        width: isMobile ? '100%' : 'calc(100% - 260px)', maxWidth: '100vw', overflowX: 'hidden'
      }}>
        <header style={{
          background: 'white', padding: '12px 20px', display: 'flex', justifyContent: 'space-between',
          alignItems: 'center', borderBottom: '1px solid #eee', position: 'sticky', top: 0, zIndex: 99
        }}>
          <div style={{ paddingLeft: isMobile ? '50px' : '0px' }}>
            <h4 style={{ margin: 0, fontSize: 13, color: '#1e293b' }}>Bimbel Gemilang</h4>
            <small style={{ color: '#7f8c8d', fontSize: 10 }}>Portal Akademik</small>
          </div>
          <div style={{ width: 32, height: 32, background: '#3498db', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', color: 'white', fontSize: 12 }}>G</div>
        </header>
        <div style={{ padding: isMobile ? 10 : 20, width: '100%', boxSizing: 'border-box', minHeight: 'calc(100vh - 60px)' }}>
          {children}
        </div>
      </main>
    </div>
  );
};

// === APP ===
function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* ========== PUBLIC ROUTES ========== */}
        <Route path="/" element={<Login />} />
        <Route path="/login-guru" element={<LoginGuru />} />
        <Route path="/login-siswa" element={<LoginSiswa />} />
        <Route path="/aktivitas" element={<PublicBlog />} />

        {/* ========== ADMIN ROUTES ========== */}
        <Route path="/admin" element={<AdminRoute><Dashboard /></AdminRoute>} />
        <Route path="/admin/settings" element={<AdminRoute><Settings /></AdminRoute>} />
        <Route path="/admin/daily-log" element={<AdminRoute><AdminDailyLog /></AdminRoute>} />

        {/* Admin - Students */}
        <Route path="/admin/students" element={<AdminRoute><StudentList /></AdminRoute>} />
        <Route path="/admin/students/add" element={<AdminRoute><AddStudent /></AdminRoute>} />
        <Route path="/admin/students/edit/:id" element={<AdminRoute><EditStudent /></AdminRoute>} />
        <Route path="/admin/students/attendance/:id" element={<AdminRoute><StudentAttendance /></AdminRoute>} />
        <Route path="/admin/students/finance/:id" element={<AdminRoute><StudentFinance /></AdminRoute>} />

        {/* Admin - Teachers */}
        <Route path="/admin/teachers" element={<AdminRoute><TeacherList /></AdminRoute>} />
        <Route path="/admin/teachers/salaries" element={<AdminRoute><TeacherSalaries /></AdminRoute>} />
        <Route path="/admin/teachers/schedule" element={<AdminRoute><TeacherSchedule /></AdminRoute>} />

        {/* Admin - Finance */}
        <Route path="/admin/finance" element={<AdminRoute><FinanceLayout /></AdminRoute>} />
        <Route path="/admin/finance/dashboard" element={<AdminRoute><FinanceDashboard /></AdminRoute>} />
        <Route path="/admin/finance/income" element={<AdminRoute><IncomeEntry /></AdminRoute>} />
        <Route path="/admin/finance/expense" element={<AdminRoute><ExpenseEntry /></AdminRoute>} />
        <Route path="/admin/finance/debt" element={<AdminRoute><DebtControl /></AdminRoute>} />
        <Route path="/admin/finance/history" element={<AdminRoute><TransactionHistory /></AdminRoute>} />

        {/* Admin - Schedule */}
        <Route path="/admin/schedule" element={<AdminRoute><SchedulePage /></AdminRoute>} />

        {/* Admin - Grades (Raport) */}
        <Route path="/admin/grades" element={<AdminRoute><GradeReport /></AdminRoute>} />
        <Route path="/admin/bulk-raport" element={<AdminRoute><AdminBulkRaport /></AdminRoute>} />

        {/* Admin - Portal Siswa */}
        <Route path="/admin/portal" element={<AdminRoute><PortalSiswaHome /></AdminRoute>} />
        <Route path="/admin/portal/manage-materi" element={<AdminRoute><ManageMateriPortal /></AdminRoute>} />
        <Route path="/admin/portal/poster" element={<AdminRoute><ManagePoster /></AdminRoute>} />
        <Route path="/admin/portal/survey" element={<AdminRoute><ManageSurvey /></AdminRoute>} />
        <Route path="/admin/portal/pengumuman" element={<AdminRoute><ManagePengumuman /></AdminRoute>} />
        <Route path="/admin/portal/finance" element={<AdminRoute><ManageFinance /></AdminRoute>} />

        {/* Admin - Blog */}
        <Route path="/admin/manage-blog" element={<AdminRoute><ManageBlog /></AdminRoute>} />

        {/* ========== GURU ROUTES ========== */}
        <Route path="/guru/dashboard" element={<GuruRoute><TeacherLayoutWrapper><TeacherDashboard /></TeacherLayoutWrapper></GuruRoute>} />
        <Route path="/guru/profile" element={<GuruRoute><TeacherLayoutWrapper><TeacherProfile /></TeacherLayoutWrapper></GuruRoute>} />
        <Route path="/guru/history" element={<GuruRoute><TeacherLayoutWrapper><TeacherHistory /></TeacherLayoutWrapper></GuruRoute>} />
        <Route path="/guru/schedule" element={<GuruRoute><TeacherLayoutWrapper><TeacherSchedule /></TeacherLayoutWrapper></GuruRoute>} />
        <Route path="/guru/attendance" element={<GuruRoute><TeacherLayoutWrapper><TeacherManualInput /></TeacherLayoutWrapper></GuruRoute>} />
        <Route path="/guru/manual-input" element={<GuruRoute><TeacherLayoutWrapper><TeacherManualInput /></TeacherLayoutWrapper></GuruRoute>} />
        <Route path="/guru/class-session" element={<GuruRoute><TeacherLayoutWrapper><ClassSession /></TeacherLayoutWrapper></GuruRoute>} />

        {/* Guru - Grades (Raport & Nilai) */}
        <Route path="/guru/grades/input" element={<GuruRoute><TeacherLayoutWrapper><TeacherInputGrade /></TeacherLayoutWrapper></GuruRoute>} />
        <Route path="/guru/grades/manage" element={<GuruRoute><TeacherLayoutWrapper><TeacherGradeManager /></TeacherLayoutWrapper></GuruRoute>} />
        <Route path="/guru/generate-raport" element={<GuruRoute><TeacherLayoutWrapper><GenerateRaport /></TeacherLayoutWrapper></GuruRoute>} />

        {/* Guru - Modul (E-Learning) */}
        <Route path="/guru/modul" element={<GuruRoute><TeacherLayoutWrapper><ModulManager /></TeacherLayoutWrapper></GuruRoute>} />
        <Route path="/guru/cek-tugas" element={<GuruRoute><TeacherLayoutWrapper><CekTugasSiswa /></TeacherLayoutWrapper></GuruRoute>} />
        <Route path="/guru/modul/materi" element={<GuruRoute><TeacherLayoutWrapper><ManageMateriGuru /></TeacherLayoutWrapper></GuruRoute>} />
        <Route path="/guru/manage-quiz" element={<GuruRoute><TeacherLayoutWrapper><ManageQuiz /></TeacherLayoutWrapper></GuruRoute>} />
        <Route path="/guru/manage-tugas" element={<GuruRoute><TeacherLayoutWrapper><ManageTugas /></TeacherLayoutWrapper></GuruRoute>} />

        {/* ========== SISWA ROUTES ========== */}
        <Route path="/siswa/dashboard" element={<SiswaRoute><StudentDashboard /></SiswaRoute>} />
        <Route path="/siswa/materi" element={<SiswaRoute><StudentElearning /></SiswaRoute>} />
        <Route path="/siswa/materi/:id" element={<SiswaRoute><StudentModuleView /></SiswaRoute>} />
        <Route path="/siswa/jadwal" element={<SiswaRoute><StudentSchedule /></SiswaRoute>} />
        <Route path="/siswa/keuangan" element={<SiswaRoute><StudentFinanceSiswa /></SiswaRoute>} />
        <Route path="/siswa/rapor" element={<SiswaRoute><StudentGrades /></SiswaRoute>} />
        <Route path="/siswa/absensi" element={<SiswaRoute><StudentAttendanceSiswa /></SiswaRoute>} />

        {/* Siswa - Smart Raport */}
        <Route path="/siswa/leaderboard" element={<SiswaRoute><StudentLeaderboard /></SiswaRoute>} />
        <Route path="/siswa/smart-rapor" element={<SiswaRoute><StudentSmartReport /></SiswaRoute>} />

        {/* ========== REDIRECT ========== */}
        <Route path="/teacher/*" element={<Navigate to="/guru/dashboard" replace />} />
        <Route path="/guru/modul/tugas" element={<Navigate to="/guru/modul/materi" replace />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;