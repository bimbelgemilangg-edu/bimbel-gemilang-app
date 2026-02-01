import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

// ==============================
// 1. IMPORT HALAMAN UMUM
// ==============================
import Login from './pages/Login';
import LoginGuru from './pages/LoginGuru';

// ==============================
// 2. IMPORT HALAMAN ADMIN
// ==============================
import Dashboard from './pages/admin/Dashboard'; 
import Settings from './pages/admin/Settings';

// --- Modul Siswa ---
import StudentList from './pages/admin/students/StudentList';
import AddStudent from './pages/admin/students/AddStudent';
import StudentAttendance from './pages/admin/students/StudentAttendance';
import StudentFinance from './pages/admin/students/StudentFinance'; 
import EditStudent from './pages/admin/students/EditStudent';

// --- Modul Keuangan (Layout Tab) ---
import FinanceLayout from './pages/admin/finance/FinanceLayout'; 

// --- Modul Guru & Jadwal ---
import TeacherList from './pages/admin/teachers/TeacherList';
import TeacherSalaries from './pages/admin/teachers/TeacherSalaries'; 
import SchedulePage from './pages/admin/schedule/SchedulePage';

// --- Modul Nilai & Rapor (BARU) ---
import GradeReport from './pages/admin/grades/GradeReport'; 

// ==============================
// 3. IMPORT HALAMAN GURU
// ==============================
import TeacherDashboard from './pages/teacher/TeacherDashboard'; 
import TeacherHistory from './pages/teacher/TeacherHistory';
import TeacherManualInput from './pages/teacher/TeacherManualInput'; 
import TeacherInputGrade from './pages/teacher/grades/TeacherInputGrade'; // <--- JALUR NILAI GURU

// ==============================
// 4. PROTEKSI RUTE (SECURITY)
// ==============================
const AdminRoute = ({ children }) => {
  const isAuth = localStorage.getItem('isLoggedIn'); 
  return isAuth ? children : <Navigate to="/" />;
};

const GuruRoute = ({ children }) => {
  // Disini bisa ditambah logika cek sesi guru kalau perlu
  return children; 
};

function App() {
  return (
    <BrowserRouter>
      <Routes>
        
        {/* ==================== */}
        {/* A. RUTE PUBLIK & LOGIN */}
        {/* ==================== */}
        <Route path="/" element={<Login />} />              
        <Route path="/login-guru" element={<LoginGuru />} /> 

        {/* ==================== */}
        {/* B. AREA ADMIN */}
        {/* ==================== */}
        <Route path="/admin" element={<AdminRoute><Dashboard /></AdminRoute>} />
        
        {/* Manajemen Siswa */}
        <Route path="/admin/students" element={<AdminRoute><StudentList /></AdminRoute>} />
        <Route path="/admin/students/add" element={<AdminRoute><AddStudent /></AdminRoute>} />
        <Route path="/admin/students/attendance/:id" element={<AdminRoute><StudentAttendance /></AdminRoute>} />
        <Route path="/admin/students/finance/:id" element={<AdminRoute><StudentFinance /></AdminRoute>} />
        <Route path="/admin/students/edit/:id" element={<AdminRoute><EditStudent /></AdminRoute>} />
        
        {/* Manajemen Keuangan */}
        <Route path="/admin/finance" element={<AdminRoute><FinanceLayout /></AdminRoute>} />
        
        {/* Manajemen Guru & Gaji */}
        <Route path="/admin/teachers" element={<AdminRoute><TeacherList /></AdminRoute>} />
        <Route path="/admin/teachers/salaries" element={<AdminRoute><TeacherSalaries /></AdminRoute>} />
        
        {/* Jadwal & Pengaturan */}
        <Route path="/admin/schedule" element={<AdminRoute><SchedulePage /></AdminRoute>} />
        <Route path="/admin/settings" element={<AdminRoute><Settings /></AdminRoute>} />

        {/* Laporan Rapor (BARU) */}
        <Route path="/admin/grades" element={<AdminRoute><GradeReport /></AdminRoute>} />


        {/* ==================== */}
        {/* C. AREA GURU */}
        {/* ==================== */}
        
        {/* Dashboard Guru */}
        <Route 
          path="/guru/dashboard" 
          element={
            <GuruRoute>
              <TeacherDashboard />
            </GuruRoute>
          } 
        />
        
        {/* Input Nilai (INI RUTE YANG BOS CARI) */}
        <Route 
          path="/guru/grades/input" 
          element={
            <GuruRoute>
              <TeacherInputGrade />
            </GuruRoute>
          } 
        />
        
        {/* Riwayat & Absen Susulan */}
        <Route path="/guru/history" element={<GuruRoute><TeacherHistory /></GuruRoute>} />
        <Route path="/guru/manual-input" element={<GuruRoute><TeacherManualInput /></GuruRoute>} />

        {/* Redirect jika salah ketik */}
        <Route path="/teacher" element={<Navigate to="/guru/dashboard" replace />} />

      </Routes>
    </BrowserRouter>
  );
}

export default App;