import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

import Login from './pages/Login';
import Dashboard from './pages/admin/Dashboard';
import StudentList from './pages/admin/students/StudentList';
import AddStudent from './pages/admin/students/AddStudent';
import FinanceDashboard from './pages/admin/finance/FinanceDashboard';
import TeacherList from './pages/admin/teachers/TeacherList';

// SAYA SUDAH MENGHAPUS IMPORT JADWAL YANG RUSAK DISINI

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/admin" element={<Dashboard />} />
        
        {/* Halaman Siswa */}
        <Route path="/admin/students" element={<StudentList />} />
        <Route path="/admin/students/add" element={<AddStudent />} />
        
        {/* Halaman Keuangan */}
        <Route path="/admin/finance" element={<FinanceDashboard />} />
        
        {/* Halaman Guru */}
        <Route path="/admin/teachers" element={<TeacherList />} />
        
        {/* Halaman Jadwal KITA HAPUS KARENA SUDAH PINDAH KE DASHBOARD */}
      </Routes>
    </BrowserRouter>
  );
}

export default App;