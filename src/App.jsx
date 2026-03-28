import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

// === IMPORT UTAMA ===
import Login from './pages/Login';
import LoginGuru from './pages/LoginGuru';
import LoginSiswa from './pages/LoginSiswa'; 

// === IMPORT LAYOUT ===
import TeacherLayout from './pages/teacher/TeacherLayout';

// === IMPORT ADMIN ===
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

// === IMPORT ADMIN PORTAL SISWA ===
import PortalSiswaHome from './pages/admin/portal-siswa/PortalSiswaHome';
import ManagePoster from './pages/admin/portal-siswa/ManagePoster';

// === IMPORT GURU ===
import TeacherDashboard from './pages/teacher/TeacherDashboard'; 
import TeacherHistory from './pages/teacher/TeacherHistory';
import TeacherManualInput from './pages/teacher/TeacherManualInput'; 
import TeacherInputGrade from './pages/teacher/grades/TeacherInputGrade'; 
import TeacherGradeManager from './pages/teacher/grades/TeacherGradeManager'; 
import TeacherProfile from './pages/teacher/TeacherProfile'; 
import TeacherSchedule from './pages/teacher/TeacherSchedule'; // Tambahan Langkah 3

// --- IMPORT MODUL & CEK TUGAS GURU ---
import ModulManager from './pages/teacher/modul/ModulManager'; 
import CekTugasSiswa from './pages/teacher/modul/CekTugasSiswa';
import ManageMateri from './pages/teacher/modul/ManageMateri';
import ManageQuiz from './pages/teacher/modul/ManageQuiz';
import ManageTugas from './pages/teacher/modul/ManageTugas';

// === IMPORT SISWA ===
import StudentDashboard from './pages/student/StudentDashboard';
import StudentSchedule from './pages/student/StudentSchedule';
import StudentFinanceSiswa from './pages/student/StudentFinance';
import StudentGrades from './pages/student/StudentGrades';
import StudentAttendanceSiswa from './pages/student/StudentAttendance';
import StudentElearning from './pages/student/StudentElearning';

// --- KOMPONEN PROTEKSI RUTE ---
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

function App() {
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
        {/* === JALUR LOGIN === */}
        <Route path="/" element={<Login />} />              
        <Route path="/login-guru" element={<LoginGuru />} /> 
        <Route path="/login-siswa" element={<LoginSiswa />} /> 

        {/* === AREA ADMIN === */}
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
        <Route path="/admin/finance" element={<AdminRoute><FinanceLayout /></AdminRoute>} />
        <Route path="/admin/schedule" element={<AdminRoute><SchedulePage /></AdminRoute>} />
        <Route path="/admin/grades" element={<AdminRoute><GradeReport /></AdminRoute>} />
        <Route path="/admin/settings" element={<AdminRoute><Settings /></AdminRoute>} />

        {/* === AREA GURU (DIBUNGKUS TEACHER LAYOUT) === */}
        <Route element={<GuruRoute><TeacherLayout guru={guruData} /></GuruRoute>}>
          <Route path="/guru/dashboard" element={<TeacherDashboard />} />
          <Route path="/guru/profile" element={<TeacherProfile />} />
          <Route path="/guru/history" element={<TeacherHistory />} />
          <Route path="/guru/manual-input" element={<TeacherManualInput />} />
          
          {/* Menu Cek Tugas */}
          <Route path="/guru/cek-tugas" element={<CekTugasSiswa />} />
          
          {/* Nilai & Rapor */}
          <Route path="/guru/grades/input" element={<TeacherInputGrade />} />
          <Route path="/guru/grades/manage" element={<TeacherGradeManager />} />
          
          {/* E-Learning System */}
          <Route path="/guru/modul" element={<ModulManager />} />
          <Route path="/guru/modul/materi" element={<ManageMateri />} />
          <Route path="/guru/modul/quiz" element={<ManageQuiz />} />
          <Route path="/guru/modul/tugas" element={<ManageTugas />} />

          {/* Rute Jadwal Guru - UPDATE: Menggunakan Komponen TeacherSchedule */}
          <Route path="/guru/schedule" element={<TeacherSchedule />} />
          
          <Route path="/guru/attendance" element={<div>Halaman Absensi (Belum Dibuat)</div>} />
        </Route>
        
        {/* === AREA SISWA === */}
        <Route path="/siswa/dashboard" element={<SiswaRoute><StudentDashboard /></SiswaRoute>} />
        <Route path="/siswa/materi" element={<SiswaRoute><StudentElearning /></SiswaRoute>} />
        <Route path="/siswa/jadwal" element={<SiswaRoute><StudentSchedule /></SiswaRoute>} />
        <Route path="/siswa/keuangan" element={<SiswaRoute><StudentFinanceSiswa /></SiswaRoute>} />
        <Route path="/siswa/rapor" element={<SiswaRoute><StudentGrades /></SiswaRoute>} />
        <Route path="/siswa/absensi" element={<SiswaRoute><StudentAttendanceSiswa /></SiswaRoute>} />

        {/* === REDIRECTS === */}
        <Route path="/teacher/*" element={<Navigate to="/guru/dashboard" replace />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;