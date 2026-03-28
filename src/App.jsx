import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

// === 1. IMPORT UTAMA & AUTH ===
import Login from './pages/Login';
import LoginGuru from './pages/LoginGuru';
import LoginSiswa from './pages/LoginSiswa'; 

// === 2. IMPORT LAYOUTS ===
import TeacherLayout from './pages/teacher/TeacherLayout';

// === 3. IMPORT AREA ADMIN (src/pages/admin) ===
import Dashboard from './pages/admin/Dashboard'; 
import Settings from './pages/admin/Settings';
import StudentList from './pages/admin/students/StudentList';
import AddStudent from './pages/admin/students/AddStudent';
import EditStudent from './pages/admin/students/EditStudent';
import StudentAttendance from './pages/admin/students/StudentAttendance';
import StudentFinance from './pages/admin/students/StudentFinance'; 
import TeacherList from './pages/admin/teachers/TeacherList';
import TeacherSalaries from './pages/admin/teachers/TeacherSalaries'; 
import FinanceLayout from './pages/admin/finance/FinanceLayout'; 
import SchedulePage from './pages/admin/schedule/SchedulePage';
import GradeReport from './pages/admin/grades/GradeReport'; 

// Admin - Portal Siswa
import PortalSiswaHome from './pages/admin/portal-siswa/PortalSiswaHome';
import ManagePoster from './pages/admin/portal-siswa/ManagePoster';
import ManageMateriAdmin from './pages/admin/portal-siswa/ManageMateri';
import ManageFinanceAdmin from './pages/admin/portal-siswa/ManageFinance';
import ManagePengumuman from './pages/admin/portal-siswa/ManagePengumuman';

// === 4. IMPORT AREA GURU (src/pages/teacher) ===
import TeacherDashboard from './pages/teacher/TeacherDashboard'; 
import TeacherHistory from './pages/teacher/TeacherHistory';
import TeacherManualInput from './pages/teacher/TeacherManualInput'; 
import TeacherProfile from './pages/teacher/TeacherProfile'; 
import ClassSession from './pages/teacher/ClassSession';
import TeacherInputGrade from './pages/teacher/grades/TeacherInputGrade'; 
import TeacherGradeManager from './pages/teacher/grades/TeacherGradeManager'; 

// Guru - Modul & E-Learning
import ModulManager from './pages/teacher/modul/ModulManager'; 
import CekTugasSiswa from './pages/teacher/modul/CekTugasSiswa';
import ManageMateri from './pages/teacher/modul/ManageMateri';
import ManageQuiz from './pages/teacher/modul/ManageQuiz';
import ManageTugas from './pages/teacher/modul/ManageTugas';

// === 5. IMPORT AREA SISWA (src/pages/student) ===
import StudentDashboard from './pages/student/StudentDashboard';
import StudentSchedule from './pages/student/StudentSchedule';
import StudentFinanceSiswa from './pages/student/StudentFinance';
import StudentGrades from './pages/student/StudentGrades';
import StudentAttendanceSiswa from './pages/student/StudentAttendance';
import StudentElearning from './pages/student/StudentElearning';
import StudentModuleView from './pages/student/StudentModuleView';

// === 6. PROTEKSI RUTE (GUARD) ===
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

// === 7. MAIN APP COMPONENT ===
function App() {
  // Ambil data guru dari localStorage untuk dikirim ke Layout
  const [guruData, setGuruData] = useState(null);

  useEffect(() => {
    const savedGuru = localStorage.getItem('teacherData');
    if (savedGuru) {
      setGuruData(JSON.parse(savedGuru));
    }
  }, []);

  return (
    <BrowserRouter>
      <Routes>
        {/* PUBLIC ROUTES */}
        <Route path="/" element={<Login />} />              
        <Route path="/login-guru" element={<LoginGuru />} /> 
        <Route path="/login-siswa" element={<LoginSiswa />} /> 

        {/* AREA ADMIN */}
        <Route path="/admin" element={<AdminRoute><Dashboard /></AdminRoute>} />
        <Route path="/admin/students" element={<AdminRoute><StudentList /></AdminRoute>} />
        <Route path="/admin/students/add" element={<AdminRoute><AddStudent /></AdminRoute>} />
        <Route path="/admin/students/edit/:id" element={<AdminRoute><EditStudent /></AdminRoute>} />
        <Route path="/admin/teachers" element={<AdminRoute><TeacherList /></AdminRoute>} />
        <Route path="/admin/portal" element={<AdminRoute><PortalSiswaHome /></AdminRoute>} />
        <Route path="/admin/portal/pengumuman" element={<AdminRoute><ManagePengumuman /></AdminRoute>} />
        <Route path="/admin/finance" element={<AdminRoute><FinanceLayout /></AdminRoute>} />
        <Route path="/admin/schedule" element={<AdminRoute><SchedulePage /></AdminRoute>} />
        <Route path="/admin/grades" element={<AdminRoute><GradeReport /></AdminRoute>} />
        <Route path="/admin/settings" element={<AdminRoute><Settings /></AdminRoute>} />

        {/* AREA GURU (DIBUNGKUS LAYOUT VERSI KAMU) */}
        <Route element={<GuruRoute><TeacherLayout guru={guruData} /></GuruRoute>}>
          <Route path="/guru/dashboard" element={<TeacherDashboard />} />
          <Route path="/guru/profile" element={<TeacherProfile />} />
          <Route path="/guru/history" element={<TeacherHistory />} />
          <Route path="/guru/session" element={<ClassSession />} />
          
          {/* Guru - Nilai */}
          <Route path="/guru/grades/input" element={<TeacherInputGrade />} />
          <Route path="/guru/grades/manage" element={<TeacherGradeManager />} />
          
          {/* Guru - E-Learning (Modul System) */}
          <Route path="/guru/modul" element={<ModulManager />} />
          <Route path="/guru/modul/cek-tugas" element={<CekTugasSiswa />} />
          <Route path="/guru/modul/materi" element={<ManageMateri />} />
          <Route path="/guru/modul/quiz" element={<ManageQuiz />} />
          <Route path="/guru/modul/tugas" element={<ManageTugas />} />
        </Route>

        {/* AREA SISWA */}
        <Route path="/siswa/dashboard" element={<SiswaRoute><StudentDashboard /></SiswaRoute>} />
        <Route path="/siswa/jadwal" element={<SiswaRoute><StudentSchedule /></SiswaRoute>} />
        <Route path="/siswa/keuangan" element={<SiswaRoute><StudentFinanceSiswa /></SiswaRoute>} />
        <Route path="/siswa/rapor" element={<SiswaRoute><StudentGrades /></SiswaRoute>} />
        <Route path="/siswa/absensi" element={<SiswaRoute><StudentAttendanceSiswa /></SiswaRoute>} />
        <Route path="/siswa/materi" element={<SiswaRoute><StudentElearning /></SiswaRoute>} />
        <Route path="/siswa/materi/view/:id" element={<SiswaRoute><StudentModuleView /></SiswaRoute>} />

        {/* FALLBACK */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;