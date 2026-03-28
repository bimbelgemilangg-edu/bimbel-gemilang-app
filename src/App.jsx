import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

// ==========================================
// 1. IMPORT UTAMA & AUTH
// ==========================================
import Login from './pages/Login';
import LoginGuru from './pages/LoginGuru';
import LoginSiswa from './pages/LoginSiswa'; 

// ==========================================
// 2. IMPORT AREA ADMIN (src/pages/admin)
// ==========================================
import Dashboard from './pages/admin/Dashboard'; 
import Settings from './pages/admin/Settings';

// Admin - Students
import StudentList from './pages/admin/students/StudentList';
import AddStudent from './pages/admin/students/AddStudent';
import EditStudent from './pages/admin/students/EditStudent';
import StudentAttendance from './pages/admin/students/StudentAttendance';
import StudentFinance from './pages/admin/students/StudentFinance'; 

// Admin - Teachers
import TeacherList from './pages/admin/teachers/TeacherList';
import TeacherSalaries from './pages/admin/teachers/TeacherSalaries'; 

// Admin - Finance, Schedule, Grades
import FinanceLayout from './pages/admin/finance/FinanceLayout'; 
import SchedulePage from './pages/admin/schedule/SchedulePage';
import GradeReport from './pages/admin/grades/GradeReport'; 

// Admin - Portal Siswa (E-Learning Management)
import PortalSiswaHome from './pages/admin/portal-siswa/PortalSiswaHome';
import ManagePoster from './pages/admin/portal-siswa/ManagePoster';
import ManageMateriAdmin from './pages/admin/portal-siswa/ManageMateri';
import ManageFinanceAdmin from './pages/admin/portal-siswa/ManageFinance';
import ManagePengumuman from './pages/admin/portal-siswa/ManagePengumuman';

// ==========================================
// 3. IMPORT AREA GURU (src/pages/teacher)
// ==========================================
import TeacherDashboard from './pages/teacher/TeacherDashboard'; 
import TeacherHistory from './pages/teacher/TeacherHistory';
import TeacherManualInput from './pages/teacher/TeacherManualInput'; 
import TeacherProfile from './pages/teacher/TeacherProfile'; 
import ClassSession from './pages/teacher/ClassSession';

// Guru - Grades Management
import TeacherInputGrade from './pages/teacher/grades/TeacherInputGrade'; 
import TeacherGradeManager from './pages/teacher/grades/TeacherGradeManager'; 

// Guru - Modul & E-Learning System
import ModulManager from './pages/teacher/modul/ModulManager'; 
import CekTugasSiswa from './pages/teacher/modul/CekTugasSiswa';
// (ManageMateri Guru di-import jika dibutuhkan langsung sebagai rute)
import ManageMateriGuru from './pages/teacher/modul/ManageMateri'; 

// ==========================================
// 4. IMPORT AREA SISWA (src/pages/student)
// ==========================================
import StudentDashboard from './pages/student/StudentDashboard';
import StudentSchedule from './pages/student/StudentSchedule';
import StudentFinanceSiswa from './pages/student/StudentFinance';
import StudentGrades from './pages/student/StudentGrades';
import StudentAttendanceSiswa from './pages/student/StudentAttendance';
import StudentElearning from './pages/student/StudentElearning';
import StudentModuleView from './pages/student/StudentModuleView';

// ==========================================
// 5. KOMPONEN PROTEKSI RUTE (GUARD)
// ==========================================
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

// ==========================================
// MAIN APP COMPONENT
// ==========================================
function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* === JALUR LOGIN (PUBLIC) === */}
        <Route path="/" element={<Login />} />              
        <Route path="/login-guru" element={<LoginGuru />} /> 
        <Route path="/login-siswa" element={<LoginSiswa />} /> 

        {/* === AREA ADMIN (PROTECTED) === */}
        <Route path="/admin" element={<AdminRoute><Dashboard /></AdminRoute>} />
        <Route path="/admin/students" element={<AdminRoute><StudentList /></AdminRoute>} />
        <Route path="/admin/students/add" element={<AdminRoute><AddStudent /></AdminRoute>} />
        <Route path="/admin/students/edit/:id" element={<AdminRoute><EditStudent /></AdminRoute>} />
        <Route path="/admin/students/attendance/:id" element={<AdminRoute><StudentAttendance /></AdminRoute>} />
        <Route path="/admin/students/finance/:id" element={<AdminRoute><StudentFinance /></AdminRoute>} />
        
        <Route path="/admin/teachers" element={<AdminRoute><TeacherList /></AdminRoute>} />
        <Route path="/admin/teachers/salaries" element={<AdminRoute><TeacherSalaries /></AdminRoute>} />
        
        <Route path="/admin/finance" element={<AdminRoute><FinanceLayout /></AdminRoute>} />
        <Route path="/admin/schedule" element={<AdminRoute><SchedulePage /></AdminRoute>} />
        <Route path="/admin/grades" element={<AdminRoute><GradeReport /></AdminRoute>} />
        <Route path="/admin/settings" element={<AdminRoute><Settings /></AdminRoute>} />

        {/* Admin - Portal Control */}
        <Route path="/admin/portal" element={<AdminRoute><PortalSiswaHome /></AdminRoute>} />
        <Route path="/admin/portal/poster" element={<AdminRoute><ManagePoster /></AdminRoute>} />
        <Route path="/admin/portal/materi" element={<AdminRoute><ManageMateriAdmin /></AdminRoute>} />
        <Route path="/admin/portal/finance" element={<AdminRoute><ManageFinanceAdmin /></AdminRoute>} />
        <Route path="/admin/portal/pengumuman" element={<AdminRoute><ManagePengumuman /></AdminRoute>} />

        {/* === AREA GURU (PROTECTED) === */}
        <Route path="/guru/dashboard" element={<GuruRoute><TeacherDashboard /></GuruRoute>} />
        <Route path="/guru/profile" element={<GuruRoute><TeacherProfile /></GuruRoute>} />
        <Route path="/guru/history" element={<GuruRoute><TeacherHistory /></GuruRoute>} />
        <Route path="/guru/manual-input" element={<GuruRoute><TeacherManualInput /></GuruRoute>} />
        <Route path="/guru/session" element={<GuruRoute><ClassSession /></GuruRoute>} />
        
        {/* Guru - Nilai */}
        <Route path="/guru/grades/input" element={<GuruRoute><TeacherInputGrade /></GuruRoute>} />
        <Route path="/guru/grades/manage" element={<GuruRoute><TeacherGradeManager /></GuruRoute>} />
        
        {/* Guru - E-Learning (Modul System) */}
        <Route path="/guru/modul" element={<GuruRoute><ModulManager /></GuruRoute>} />
        <Route path="/guru/modul/cek-tugas" element={<GuruRoute><CekTugasSiswa /></GuruRoute>} />
        <Route path="/guru/modul/editor" element={<GuruRoute><ManageMateriGuru /></GuruRoute>} />

        {/* === AREA SISWA (PROTECTED) === */}
        <Route path="/siswa/dashboard" element={<SiswaRoute><StudentDashboard /></SiswaRoute>} />
        <Route path="/siswa/jadwal" element={<SiswaRoute><StudentSchedule /></SiswaRoute>} />
        <Route path="/siswa/keuangan" element={<SiswaRoute><StudentFinanceSiswa /></SiswaRoute>} />
        <Route path="/siswa/rapor" element={<SiswaRoute><StudentGrades /></SiswaRoute>} />
        <Route path="/siswa/absensi" element={<SiswaRoute><StudentAttendanceSiswa /></SiswaRoute>} />
        
        {/* Siswa - Materi & E-Learning */}
        <Route path="/siswa/materi" element={<SiswaRoute><StudentElearning /></SiswaRoute>} />
        <Route path="/siswa/materi/view/:id" element={<SiswaRoute><StudentModuleView /></SiswaRoute>} />

        {/* === REDIRECTS & FALLBACK === */}
        <Route path="/teacher/*" element={<Navigate to="/guru/dashboard" replace />} />
        <Route path="/student/*" element={<Navigate to="/siswa/dashboard" replace />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;