// src/App.jsx
import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useParams } from 'react-router-dom';

// === LOGIN & PUBLIK ===
import Login from './pages/Login';
import LoginGuru from './pages/LoginGuru';
import LoginSiswa from './pages/LoginSiswa';
import PublicBlog from './pages/PublicBlog';

// === PENDAFTARAN ONLINE (PUBLIK) ===
import PendaftaranOnline from './pages/PendaftaranOnline';

// === ADMIN - PENDAFTARAN ===
import ManageOnlineRegistration from './pages/admin/pendaftaran/ManageOnlineRegistration';
import ManagePaketHarga from './pages/admin/pendaftaran/ManagePaketHarga';

// === ADMIN ===
import Dashboard from './pages/admin/Dashboard';
import Settings from './pages/admin/Settings';
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

// === GURU ===
import SidebarGuru from './components/SidebarGuru';
import TeacherDashboard from './pages/teacher/TeacherDashboard';
import TeacherHistory from './pages/teacher/TeacherHistory';
// import TeacherManualInput from './pages/teacher/TeacherManualInput'; // ← DIHAPUS
import TeacherAttendance from './pages/teacher/TeacherAttendance'; // ← BARU
import TeacherInputGrade from './pages/teacher/grades/TeacherInputGrade';
import TeacherGradeManager from './pages/teacher/grades/TeacherGradeManager';
import TeacherProfile from './pages/teacher/TeacherProfile';
import TeacherSchedulePage from './pages/teacher/TeacherSchedule';
import ModulManager from './pages/teacher/modul/ModulManager';
import CekTugasSiswa from './pages/teacher/modul/CekTugasSiswa';
import ManageMateriGuru from './pages/teacher/modul/ManageMateri';
import ManageQuiz from './pages/teacher/modul/ManageQuiz';
import ManageTugas from './pages/teacher/modul/ManageTugas';
import ClassSession from './pages/teacher/ClassSession';

// === SMART RAPORT ===
import GenerateRaport from './pages/teacher/grades/GenerateRaport';
import StudentLeaderboard from './pages/student/raport/StudentLeaderboard';
import StudentSmartReport from './pages/student/raport/StudentSmartReport';

// === SISWA ===
import SidebarSiswa from './components/SidebarSiswa';
import StudentDashboard from './pages/student/StudentDashboard';
import StudentSchedule from './pages/student/StudentSchedule';
import StudentFinanceSiswa from './pages/student/StudentFinance';
import StudentGrades from './pages/student/StudentGrades';
import StudentAttendanceSiswa from './pages/student/StudentAttendance';
import StudentElearning from './pages/student/StudentElearning';
import StudentModuleView from './pages/student/StudentModuleView';

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
  const isAuth = localStorage.getItem('isGuruLoggedIn') === 'true' || !!localStorage.getItem('teacherData');
  const role = localStorage.getItem('role');
  if (!isAuth || (role !== 'guru' && role !== 'teacher')) return <Navigate to="/login-guru" replace />;
  return children;
};

const SiswaRoute = ({ children }) => {
  const isAuth = localStorage.getItem('isSiswaLoggedIn') === 'true';
  if (!isAuth) return <Navigate to="/login-siswa" replace />;
  return children;
};

// ============================================================
// TEACHER LAYOUT
// ============================================================
const TeacherLayout = ({ children }) => {
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
      <main style={{ 
        flex: 1, 
        marginLeft: isMobile ? 0 : '260px',
        transition: 'margin-left 0.3s ease',
        width: '100%', 
        maxWidth: '100vw', 
        overflowX: 'hidden' 
      }}>
        <header style={{
          background: 'white', padding: '12px 20px', display: 'flex', justifyContent: 'space-between',
          alignItems: 'center', borderBottom: '1px solid #eee', position: 'sticky', top: 0, zIndex: 99
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {isMobile && (
              <button 
                onClick={() => setSidebarOpen(true)} 
                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 20 }}
              >
                ☰
              </button>
            )}
            <div>
              <h4 style={{ margin: 0, fontSize: 13, color: '#1e293b' }}>Bimbel Gemilang</h4>
              <small style={{ color: '#7f8c8d', fontSize: 10 }}>Portal Siswa</small>
            </div>
          </div>
          <div style={{ width: 32, height: 32, background: '#10b981', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', color: 'white', fontSize: 12 }}>
            {localStorage.getItem('studentName')?.charAt(0) || 'S'}
          </div>
        </header>
        <div style={{ padding: isMobile ? 10 : 20, width: '100%', boxSizing: 'border-box', minHeight: 'calc(100vh - 60px)' }}>
          {children}
        </div>
      </main>
    </div>
  );
};

// ============================================================
// KUIS SISWA WRAPPER
// ============================================================
const KuisSiswaWrapper = () => {
  const { id } = useParams();
  const studentData = {
    uid: localStorage.getItem('studentId'),
    id: localStorage.getItem('studentId'),
    nama: localStorage.getItem('studentName'),
    kelasSekolah: localStorage.getItem('studentGrade') || ''
  };

  return (
    <StudentModuleView
      modulId={id}
      onBack={() => window.history.back()}
      studentData={studentData}
    />
  );
};

// ============================================================
// APP
// ============================================================
function App() {
  useEffect(() => {
    if (window.matchMedia('(display-mode: standalone)').matches && window.location.pathname === '/') {
      window.location.href = '/login-siswa';
    }
  }, []);

  return (
    <BrowserRouter>
      <Routes>
        {/* PUBLIC */}
        <Route path="/" element={<Login />} />
        <Route path="/login-guru" element={<LoginGuru />} />
        <Route path="/login-siswa" element={<LoginSiswa />} />
        <Route path="/aktivitas" element={<PublicBlog />} />
        <Route path="/pendaftaran" element={<PendaftaranOnline />} />

        {/* ADMIN */}
        <Route path="/admin" element={<AdminRoute><Dashboard /></AdminRoute>} />
        <Route path="/admin/students" element={<AdminRoute><StudentList /></AdminRoute>} />
        <Route path="/admin/students/add" element={<AdminRoute><AddStudent /></AdminRoute>} />
        <Route path="/admin/students/edit/:id" element={<AdminRoute><EditStudent /></AdminRoute>} />
        <Route path="/admin/students/attendance/:id" element={<AdminRoute><StudentAttendance /></AdminRoute>} />
        <Route path="/admin/students/finance/:id" element={<AdminRoute><StudentFinance /></AdminRoute>} />
        <Route path="/admin/teachers" element={<AdminRoute><TeacherList /></AdminRoute>} />
        <Route path="/admin/teachers/salaries" element={<AdminRoute><TeacherSalaries /></AdminRoute>} />
        <Route path="/admin/portal" element={<AdminRoute><PortalSiswaHome /></AdminRoute>} />
        <Route path="/admin/portal/poster" element={<AdminRoute><ManagePoster /></AdminRoute>} />
        <Route path="/admin/portal/materi" element={<AdminRoute><ManageMateriPortal /></AdminRoute>} />
        <Route path="/admin/portal/survey" element={<AdminRoute><ManageSurvey /></AdminRoute>} />
        <Route path="/admin/pendaftaran" element={<AdminRoute><ManageOnlineRegistration /></AdminRoute>} />
        <Route path="/admin/pendaftaran/harga" element={<AdminRoute><ManagePaketHarga /></AdminRoute>} />
        <Route path="/admin/finance" element={<AdminRoute><FinanceLayout /></AdminRoute>} />
        <Route path="/admin/schedule" element={<AdminRoute><SchedulePage /></AdminRoute>} />
        <Route path="/admin/grades" element={<AdminRoute><GradeReport /></AdminRoute>} />
        <Route path="/admin/grades/bulk" element={<AdminRoute><AdminBulkRaport /></AdminRoute>} />
        <Route path="/admin/daily-log" element={<AdminRoute><AdminDailyLog /></AdminRoute>} />
        <Route path="/admin/blog" element={<AdminRoute><ManageBlog /></AdminRoute>} />
        <Route path="/admin/settings" element={<AdminRoute><Settings /></AdminRoute>} />

        {/* ============================================================
            GURU
            ============================================================ */}
        
        {/* Dashboard & Profile */}
        <Route path="/guru/dashboard" element={<GuruRoute><TeacherLayout><TeacherDashboard /></TeacherLayout></GuruRoute>} />
        <Route path="/guru/profile" element={<GuruRoute><TeacherLayout><TeacherProfile /></TeacherLayout></GuruRoute>} />
        
        {/* Jadwal & Absensi */}
        <Route path="/guru/schedule" element={<GuruRoute><TeacherLayout><TeacherSchedulePage /></TeacherLayout></GuruRoute>} />
        <Route path="/guru/attendance" element={<GuruRoute><TeacherLayout><TeacherAttendance /></TeacherLayout></GuruRoute>} />
        <Route path="/guru/history" element={<GuruRoute><TeacherLayout><TeacherHistory /></TeacherLayout></GuruRoute>} />
        <Route path="/guru/class-session" element={<GuruRoute><TeacherLayout><ClassSession /></TeacherLayout></GuruRoute>} />
        
        {/* Nilai & Raport */}
        <Route path="/guru/grades/input" element={<GuruRoute><TeacherLayout><TeacherInputGrade /></TeacherLayout></GuruRoute>} />
        <Route path="/guru/grades/manage" element={<GuruRoute><TeacherLayout><TeacherGradeManager /></TeacherLayout></GuruRoute>} />
        <Route path="/guru/grades/generate" element={<GuruRoute><TeacherLayout><GenerateRaport /></TeacherLayout></GuruRoute>} />
        
        {/* E-Learning / Modul */}
        <Route path="/guru/modul" element={<GuruRoute><TeacherLayout><ModulManager /></TeacherLayout></GuruRoute>} />
        <Route path="/guru/modul/materi" element={<GuruRoute><TeacherLayout><ManageMateriGuru /></TeacherLayout></GuruRoute>} />
        <Route path="/guru/modul/tugas" element={<GuruRoute><TeacherLayout><ManageTugas /></TeacherLayout></GuruRoute>} />
        <Route path="/guru/modul/quiz" element={<GuruRoute><TeacherLayout><ManageQuiz /></TeacherLayout></GuruRoute>} />
        <Route path="/guru/cek-tugas" element={<GuruRoute><TeacherLayout><CekTugasSiswa /></TeacherLayout></GuruRoute>} />

        {/* SISWA */}
        <Route path="/siswa/dashboard" element={<SiswaRoute><SiswaLayout><StudentDashboard /></SiswaLayout></SiswaRoute>} />
        <Route path="/siswa/materi" element={<SiswaRoute><SiswaLayout><StudentElearning /></SiswaLayout></SiswaRoute>} />
        <Route path="/siswa/jadwal" element={<SiswaRoute><SiswaLayout><StudentSchedule /></SiswaLayout></SiswaRoute>} />
        <Route path="/siswa/keuangan" element={<SiswaRoute><SiswaLayout><StudentFinanceSiswa /></SiswaLayout></SiswaRoute>} />
        <Route path="/siswa/rapor" element={<SiswaRoute><SiswaLayout><StudentGrades /></SiswaLayout></SiswaRoute>} />
        <Route path="/siswa/smart-rapor" element={<SiswaRoute><SiswaLayout><StudentSmartReport /></SiswaLayout></SiswaRoute>} />
        <Route path="/siswa/leaderboard" element={<SiswaRoute><SiswaLayout><StudentLeaderboard /></SiswaLayout></SiswaRoute>} />
        <Route path="/siswa/absensi" element={<SiswaRoute><SiswaLayout><StudentAttendanceSiswa /></SiswaLayout></SiswaRoute>} />
        <Route path="/siswa/kuis/:id" element={<SiswaRoute><SiswaLayout><KuisSiswaWrapper /></SiswaLayout></SiswaRoute>} />

        {/* ============================================================
            REDIRECT & FALLBACK
            ============================================================ */}
        
        {/* Admin Redirects */}
        <Route path="/admin/finance/income" element={<Navigate to="/admin/finance" replace />} />
        <Route path="/admin/finance/expense" element={<Navigate to="/admin/finance" replace />} />
        <Route path="/admin/finance/debt" element={<Navigate to="/admin/finance" replace />} />
        <Route path="/admin/teachers/schedule" element={<Navigate to="/admin/schedule" replace />} />
        
        {/* Teacher Redirects - OLD PATHS → NEW PATHS */}
        <Route path="/teacher/*" element={<Navigate to="/guru/dashboard" replace />} />
        <Route path="/guru/manual-input" element={<Navigate to="/guru/attendance" replace />} />
        <Route path="/guru/manage-quiz" element={<Navigate to="/guru/modul/quiz" replace />} />
        <Route path="/guru/generate-raport" element={<Navigate to="/guru/grades/generate" replace />} />
        <Route path="/guru/modul/cek-tugas" element={<Navigate to="/guru/cek-tugas" replace />} />
        
        {/* Student Redirects */}
        <Route path="/siswa/raport" element={<Navigate to="/siswa/rapor" replace />} />
        
        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;