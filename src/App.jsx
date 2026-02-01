import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

// --- IMPORT HALAMAN UMUM ---
import Login from './pages/Login';
import Dashboard from './pages/admin/Dashboard'; 
import Settings from './pages/admin/Settings';

// --- IMPORT MANAJEMEN SISWA ---
import StudentList from './pages/admin/students/StudentList';
import AddStudent from './pages/admin/students/AddStudent';
import StudentAttendance from './pages/admin/students/StudentAttendance';
import StudentFinance from './pages/admin/students/StudentFinance'; 
import EditStudent from './pages/admin/students/EditStudent';

// --- IMPORT KEUANGAN ---
import FinanceLayout from './pages/admin/finance/FinanceLayout'; 

// --- IMPORT MANAJEMEN GURU ---
import TeacherList from './pages/admin/teachers/TeacherList';
import TeacherSalaries from './pages/admin/teachers/TeacherSalaries'; 
import SchedulePage from './pages/admin/schedule/SchedulePage';

// --- IMPORT SISTEM NILAI (BARU) ---
import GradeReport from './pages/admin/grades/GradeReport'; // Laporan Rapor (Admin)

// --- IMPORT HALAMAN GURU ---
import LoginGuru from './pages/LoginGuru';
import TeacherDashboard from './pages/teacher/TeacherDashboard'; 
import TeacherHistory from './pages/teacher/TeacherHistory';
import TeacherManualInput from './pages/teacher/TeacherManualInput'; 
import TeacherInputGrade from './pages/teacher/grades/TeacherInputGrade'; // Input Nilai (Guru)

// --- PROTEKSI RUTE ADMIN ---
const AdminRoute = ({ children }) => {
  const isAuth = localStorage.getItem('isLoggedIn'); 
  return isAuth ? children : <Navigate to="/" />;
};

// --- PROTEKSI RUTE GURU ---
const GuruRoute = ({ children }) => {
  return children; 
};

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* === AREA PUBLIC & LOGIN === */}
        <Route path="/" element={<Login />} />              
        <Route path="/login-guru" element={<LoginGuru />} /> 

        {/* === AREA ADMIN (PUSAT KONTROL) === */}
        <Route path="/admin" element={<AdminRoute><Dashboard /></AdminRoute>} />
        
        {/* 1. Modul Siswa */}
        <Route path="/admin/students" element={<AdminRoute><StudentList /></AdminRoute>} />
        <Route path="/admin/students/add" element={<AdminRoute><AddStudent /></AdminRoute>} />
        <Route path="/admin/students/attendance/:id" element={<AdminRoute><StudentAttendance /></AdminRoute>} />
        <Route path="/admin/students/finance/:id" element={<AdminRoute><StudentFinance /></AdminRoute>} />
        <Route path="/admin/students/edit/:id" element={<AdminRoute><EditStudent /></AdminRoute>} />
        
        {/* 2. Modul Keuangan */}
        <Route path="/admin/finance" element={<AdminRoute><FinanceLayout /></AdminRoute>} />
        
        {/* 3. Modul Guru & Gaji */}
        <Route path="/admin/teachers" element={<AdminRoute><TeacherList /></AdminRoute>} />
        <Route path="/admin/teachers/salaries" element={<AdminRoute><TeacherSalaries /></AdminRoute>} />
        
        {/* 4. Jadwal & Pengaturan */}
        <Route path="/admin/schedule" element={<AdminRoute><SchedulePage /></AdminRoute>} />
        <Route path="/admin/settings" element={<AdminRoute><Settings /></AdminRoute>} />

        {/* 5. Modul Laporan & Rapor (BARU) */}
        <Route path="/admin/grades" element={<AdminRoute><GradeReport /></AdminRoute>} />


        {/* === AREA KHUSUS GURU (AKSES TERBATAS) === */}
        
        {/* Dashboard Guru */}
        <Route 
          path="/guru/dashboard" 
          element={
            <GuruRoute>
              <TeacherDashboard />
            </GuruRoute>
          } 
        />
        
        {/* Input Nilai Siswa (BARU) */}
        <Route 
          path="/guru/grades/input" 
          element={
            <GuruRoute>
              <TeacherInputGrade />
            </GuruRoute>
          } 
        />
        
        {/* Riwayat & Laporan */}
        <Route 
          path="/guru/history" 
          element={
            <GuruRoute>
              <TeacherHistory />
            </GuruRoute>
          } 
        />

        {/* Absen Susulan */}
        <Route 
          path="/guru/manual-input" 
          element={
            <GuruRoute>
              <TeacherManualInput />
            </GuruRoute>
          } 
        />

        {/* Redirect */}
        <Route path="/teacher" element={<Navigate to="/guru/dashboard" replace />} />

      </Routes>
    </BrowserRouter>
  );
}

export default App;