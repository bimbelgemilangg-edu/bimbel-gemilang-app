import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

// --- IMPORT HALAMAN ADMIN ---
import Login from './pages/Login';
import Dashboard from './pages/admin/Dashboard';
import StudentList from './pages/admin/students/StudentList';
import AddStudent from './pages/admin/students/AddStudent';
import StudentAttendance from './pages/admin/students/StudentAttendance';
import StudentFinance from './pages/admin/students/StudentFinance';
import EditStudent from './pages/admin/students/EditStudent';
import FinanceDashboard from './pages/admin/finance/FinanceDashboard';
import TeacherList from './pages/admin/teachers/TeacherList';
import SchedulePage from './pages/admin/schedule/SchedulePage';
import Settings from './pages/admin/Settings';

// --- IMPORT HALAMAN GURU ---
import LoginGuru from './pages/LoginGuru';
// ✅ PERBAIKAN: Mengarah ke folder 'teacher' (bukan guru)
import TeacherDashboard from './pages/teacher/TeacherDashboard'; 

// --- PROTEKSI RUTE ADMIN ---
const AdminRoute = ({ children }) => {
  const isAuth = localStorage.getItem('isLoggedIn'); 
  return isAuth ? children : <Navigate to="/" />;
};

// --- PROTEKSI RUTE GURU (SECURE MEMORY) ---
// Kita hapus pengecekan localStorage di sini karena kita pakai Memory State
// Logika proteksi dipindah langsung ke dalam TeacherDashboard
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

        {/* === AREA ADMIN === */}
        <Route path="/admin" element={<Dashboard />} />
        
        {/* Siswa */}
        <Route path="/admin/students" element={<StudentList />} />
        <Route path="/admin/students/add" element={<AddStudent />} />
        <Route path="/admin/students/attendance/:id" element={<StudentAttendance />} />
        <Route path="/admin/students/finance/:id" element={<StudentFinance />} />
        <Route path="/admin/students/edit/:id" element={<EditStudent />} />
        
        {/* Keuangan & Manajemen */}
        <Route path="/admin/finance" element={<FinanceDashboard />} />
        <Route path="/admin/teachers" element={<TeacherList />} />
        <Route path="/admin/schedule" element={<SchedulePage />} />
        <Route path="/admin/settings" element={<Settings />} />

        {/* === AREA GURU === */}
        <Route 
          path="/guru/dashboard" 
          element={
            <GuruRoute>
              <TeacherDashboard />
            </GuruRoute>
          } 
        />

      </Routes>
    </BrowserRouter>
  );
}

export default App;