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

// --- IMPORT HALAMAN GURU (YANG BARU KITA BUAT) ---
import LoginGuru from './pages/LoginGuru';
import TeacherDashboard from './pages/guru/TeacherDashboard';

// --- PROTEKSI RUTE ADMIN ---
// Cek apakah Admin sudah login?
const AdminRoute = ({ children }) => {
  const isAuth = localStorage.getItem('isLoggedIn'); // Atau logic auth admin Anda
  return isAuth ? children : <Navigate to="/" />;
};

// --- PROTEKSI RUTE GURU ---
// Cek apakah Guru sudah login?
const GuruRoute = ({ children }) => {
  const session = localStorage.getItem('guruSession');
  return session ? children : <Navigate to="/login-guru" />;
};

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* === AREA PUBLIC & LOGIN === */}
        <Route path="/" element={<Login />} />              {/* Login Admin */}
        <Route path="/login-guru" element={<LoginGuru />} /> {/* Login Guru */}

        {/* === AREA ADMIN (Full Access) === */}
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

        {/* === AREA GURU (Restricted Access) === */}
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