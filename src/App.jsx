import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

// Import Semua Halaman
import Login from './pages/Login';
import Dashboard from './pages/admin/Dashboard';
import StudentList from './pages/admin/students/StudentList';
import AddStudent from './pages/admin/students/AddStudent';
import FinanceDashboard from './pages/admin/finance/FinanceDashboard';
import TeacherList from './pages/admin/teachers/TeacherList';
// PASTIKAN BARIS INI ADA:
import SchedulePage from './pages/admin/schedule/SchedulePage'; 

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Halaman Login */}
        <Route path="/" element={<Login />} />
        
        {/* Halaman Dashboard Admin */}
        <Route path="/admin" element={<Dashboard />} />
        
        {/* Halaman Siswa */}
        <Route path="/admin/students" element={<StudentList />} />
        <Route path="/admin/students/add" element={<AddStudent />} />
        
        {/* Halaman Keuangan */}
        <Route path="/admin/finance" element={<FinanceDashboard />} />
        
        {/* Halaman Guru */}
        <Route path="/admin/teachers" element={<TeacherList />} />
        
        {/* Halaman Jadwal (PASTIKAN INI ADA) */}
        <Route path="/admin/schedule" element={<SchedulePage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;