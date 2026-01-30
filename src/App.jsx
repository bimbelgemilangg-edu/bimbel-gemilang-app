import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

import Login from './pages/Login';
import Dashboard from './pages/admin/Dashboard';
import StudentList from './pages/admin/students/StudentList';
import AddStudent from './pages/admin/students/AddStudent';
import StudentAttendance from './pages/admin/students/StudentAttendance';
// IMPORT DUA FILE BARU
import StudentFinance from './pages/admin/students/StudentFinance';
import EditStudent from './pages/admin/students/EditStudent';

import FinanceDashboard from './pages/admin/finance/FinanceDashboard';
import TeacherList from './pages/admin/teachers/TeacherList';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/admin" element={<Dashboard />} />
        
        {/* === ROUTE SISWA === */}
        <Route path="/admin/students" element={<StudentList />} />
        <Route path="/admin/students/add" element={<AddStudent />} />
        <Route path="/admin/students/attendance/:id" element={<StudentAttendance />} />
        {/* Route Baru */}
        <Route path="/admin/students/finance/:id" element={<StudentFinance />} />
        <Route path="/admin/students/edit/:id" element={<EditStudent />} />
        
        {/* === LAINNYA === */}
        <Route path="/admin/finance" element={<FinanceDashboard />} />
        <Route path="/admin/teachers" element={<TeacherList />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;