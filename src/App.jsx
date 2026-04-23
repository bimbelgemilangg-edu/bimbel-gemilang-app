import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

// === IMPORT GLOBAL RESPONSIVE ENGINE ===
import './GlobalTeacher.css'; 

// === IMPORT UTAMA ===
import Login from './pages/Login';
import LoginGuru from './pages/LoginGuru';
import LoginSiswa from './pages/LoginSiswa'; 

// === IMPORT HALAMAN PUBLIK BARU ===
import PublicBlog from './pages/PublicBlog'; 

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
import AdminDailyLog from './pages/admin/AdminDailyLog'; 
import ManageBlog from './pages/admin/blog/ManageBlog';
import ManageMateri from './pages/admin/portal-siswa/ManageMateri';

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
import TeacherSchedule from './pages/teacher/TeacherSchedule'; 

// --- IMPORT MODUL & CEK TUGAS GURU ---
import ModulManager from './pages/teacher/modul/ModulManager'; 
import CekTugasSiswa from './pages/teacher/modul/CekTugasSiswa';
import ManageMateriGuru from './pages/teacher/modul/ManageMateri';
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
  return (
    <BrowserRouter>
      <Routes>
        {/* === JALUR LOGIN & PUBLIK === */}
        <Route path="/" element={<Login />} />              
        <Route path="/login-guru" element={<LoginGuru />} /> 
        <Route path="/login-siswa" element={<LoginSiswa />} /> 
        <Route path="/aktivitas" element={<PublicBlog />} />

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
        <Route path="/admin/portal/manage-materi" element={<AdminRoute><ManageMateri /></AdminRoute>} />
        <Route path="/admin/finance" element={<AdminRoute><FinanceLayout /></AdminRoute>} />
        <Route path="/admin/schedule" element={<AdminRoute><SchedulePage /></AdminRoute>} />
        <Route path="/admin/grades" element={<AdminRoute><GradeReport /></AdminRoute>} />
        <Route path="/admin/daily-log" element={<AdminRoute><AdminDailyLog /></AdminRoute>} />
        <Route path="/admin/manage-blog" element={<AdminRoute><ManageBlog /></AdminRoute>} />
        <Route path="/admin/settings" element={<AdminRoute><Settings /></AdminRoute>} />

        {/* === AREA GURU === */}
        <Route path="/guru/dashboard" element={<GuruRoute><TeacherLayout><TeacherDashboard /></TeacherLayout></GuruRoute>} />
        <Route path="/guru/profile" element={<GuruRoute><TeacherLayout><TeacherProfile /></TeacherLayout></GuruRoute>} />
        <Route path="/guru/history" element={<GuruRoute><TeacherLayout><TeacherHistory /></TeacherLayout></GuruRoute>} />
        <Route path="/guru/cek-tugas" element={<GuruRoute><TeacherLayout><CekTugasSiswa /></TeacherLayout></GuruRoute>} />
        <Route path="/guru/grades/input" element={<GuruRoute><TeacherLayout><TeacherInputGrade /></TeacherLayout></GuruRoute>} />
        <Route path="/guru/grades/manage" element={<GuruRoute><TeacherLayout><TeacherGradeManager /></TeacherLayout></GuruRoute>} />
        <Route path="/guru/modul" element={<GuruRoute><TeacherLayout><ModulManager /></TeacherLayout></GuruRoute>} />
        <Route path="/guru/modul/materi" element={<GuruRoute><TeacherLayout><ManageMateriGuru /></TeacherLayout></GuruRoute>} />
        <Route path="/guru/manage-quiz" element={<GuruRoute><TeacherLayout><ManageQuiz /></TeacherLayout></GuruRoute>} />
        <Route path="/guru/modul/tugas" element={<GuruRoute><TeacherLayout><ManageTugas /></TeacherLayout></GuruRoute>} />
        <Route path="/guru/schedule" element={<GuruRoute><TeacherLayout><TeacherSchedule /></TeacherLayout></GuruRoute>} />
        <Route path="/guru/attendance" element={<GuruRoute><TeacherLayout><TeacherManualInput /></TeacherLayout></GuruRoute>} />
        <Route path="/guru/manual-input" element={<GuruRoute><TeacherLayout><TeacherManualInput /></TeacherLayout></GuruRoute>} />
        
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