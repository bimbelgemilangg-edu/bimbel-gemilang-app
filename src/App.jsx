import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

import Login from './pages/Login';
import Dashboard from './pages/admin/Dashboard';
import StudentList from './pages/admin/students/StudentList';
import AddStudent from './pages/admin/students/AddStudent';
// Import File Baru
import StudentAttendance from './pages/admin/students/StudentAttendance'; 

import FinanceDashboard from './pages/admin/finance/FinanceDashboard';
import TeacherList from './pages/admin/teachers/TeacherList';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/admin" element={<Dashboard />} />
        
        {/* Siswa */}
        <Route path="/admin/students" element={<StudentList />} />
        <Route path="/admin/students/add" element={<AddStudent />} />
        {/* Route Baru: Absensi Siswa (Menggunakan :id agar dinamis) */}
        <Route path="/admin/students/attendance/:id" element={<StudentAttendance />} />
        
        {/* Keuangan */}
        <Route path="/admin/finance" element={<FinanceDashboard />} />
        
        {/* Guru */}
        <Route path="/admin/teachers" element={<TeacherList />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;