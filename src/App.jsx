import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

// IMPORT UMUM
import Login from './pages/Login';
import LoginGuru from './pages/LoginGuru';
import LoginSiswa from './pages/LoginSiswa'; 

// IMPORT ADMIN
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

// IMPORT GURU
import TeacherDashboard from './pages/teacher/TeacherDashboard'; 
import TeacherHistory from './pages/teacher/TeacherHistory';
import TeacherManualInput from './pages/teacher/TeacherManualInput'; 
import TeacherInputGrade from './pages/teacher/grades/TeacherInputGrade'; 
import TeacherGradeManager from './pages/teacher/grades/TeacherGradeManager'; 
import TeacherProfile from './pages/teacher/TeacherProfile'; 

// IMPORT SISWA & ORTU
import StudentDashboard from './pages/student/StudentDashboard';
import StudentSchedule from './pages/student/StudentSchedule';
import StudentFinanceSiswa from './pages/student/StudentFinance';
import StudentGrades from './pages/student/StudentGrades';
import StudentAttendanceSiswa from './pages/student/StudentAttendance';

// --- PROTEKSI RUTE (DIPERKUAT AGAR TIDAK TABRAKAN) ---

const AdminRoute = ({ children }) => {
  const isAuth = localStorage.getItem('isLoggedIn') === 'true'; 
  const role = localStorage.getItem('role');
  // Pastikan dia login DAN rolenya memang admin
  return (isAuth && role === 'admin') ? children : <Navigate to="/" />;
};

const GuruRoute = ({ children }) => {
  const isGuruAuth = localStorage.getItem('isGuruLoggedIn') === 'true'; 
  const role = localStorage.getItem('role');
  return (isGuruAuth && role === 'guru') ? children : <Navigate to="/login-guru" />;
};

const SiswaRoute = ({ children }) => {
  const isSiswaAuth = localStorage.getItem('isSiswaLoggedIn') === 'true'; 
  const role = localStorage.getItem('role');
  return (isSiswaAuth && role === 'siswa') ? children : <Navigate to="/login-siswa" />;
};

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* LOGIN UTAMA */}
        <Route path="/" element={<Login />} />              
        <Route path="/login-guru" element={<LoginGuru />} /> 
        <Route path="/login-siswa" element={<LoginSiswa />} /> 

        {/* ADMIN AREA */}
        <Route path="/admin" element={<AdminRoute><Dashboard /></AdminRoute>} />
        <Route path="/admin/students" element={<AdminRoute><StudentList /></AdminRoute>} />
        <Route path="/admin/students/add" element={<AdminRoute><AddStudent /></AdminRoute>} />
        <Route path="/admin/students/attendance/:id" element={<AdminRoute><StudentAttendance /></AdminRoute>} />
        <Route path="/admin/students/finance/:id" element={<AdminRoute><StudentFinance /></AdminRoute>} />
        <Route path="/admin/students/edit/:id" element={<AdminRoute><EditStudent /></AdminRoute>} />
        <Route path="/admin/finance" element={<AdminRoute><FinanceLayout /></AdminRoute>} />
        <Route path="/admin/teachers" element={<AdminRoute><TeacherList /></AdminRoute>} />
        <Route path="/admin/teachers/salaries" element={<AdminRoute><TeacherSalaries /></AdminRoute>} />
        <Route path="/admin/schedule" element={<AdminRoute><SchedulePage /></AdminRoute>} />
        <Route path="/admin/settings" element={<AdminRoute><Settings /></AdminRoute>} />
        <Route path="/admin/grades" element={<AdminRoute><GradeReport /></AdminRoute>} />

        {/* GURU AREA */}
        <Route path="/guru/dashboard" element={<GuruRoute><TeacherDashboard /></GuruRoute>} />
        <Route path="/guru/profile" element={<GuruRoute><TeacherProfile /></GuruRoute>} />
        <Route path="/guru/grades/input" element={<GuruRoute><TeacherInputGrade /></GuruRoute>} />
        <Route path="/guru/grades/manage" element={<GuruRoute><TeacherGradeManager /></GuruRoute>} />
        <Route path="/guru/history" element={<GuruRoute><TeacherHistory /></GuruRoute>} />
        <Route path="/guru/manual-input" element={<GuruRoute><TeacherManualInput /></GuruRoute>} />
        
        {/* SISWA AREA */}
        <Route path="/siswa/dashboard" element={<SiswaRoute><StudentDashboard /></SiswaRoute>} />
        <Route path="/siswa/jadwal" element={<SiswaRoute><StudentSchedule /></SiswaRoute>} />
        <Route path="/siswa/keuangan" element={<SiswaRoute><StudentFinanceSiswa /></SiswaRoute>} />
        <Route path="/siswa/rapor" element={<SiswaRoute><StudentGrades /></SiswaRoute>} />
        <Route path="/siswa/absensi" element={<SiswaRoute><StudentAttendanceSiswa /></SiswaRoute>} />

        {/* REDIRECTS */}
        <Route path="/teacher" element={<Navigate to="/guru/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;