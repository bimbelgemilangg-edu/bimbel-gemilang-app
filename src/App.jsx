import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/admin/Dashboard';
import StudentList from './pages/admin/students/StudentList';
import AddStudent from './pages/admin/students/AddStudent';
import FinanceDashboard from './pages/admin/finance/FinanceDashboard';
import TeacherList from './pages/admin/teachers/TeacherList';
import SchedulePage from './pages/admin/schedule/SchedulePage'; // 1. IMPORT INI

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/admin" element={<Dashboard />} />
        <Route path="/admin/students" element={<StudentList />} />
        <Route path="/admin/students/add" element={<AddStudent />} />
        <Route path="/admin/finance" element={<FinanceDashboard />} />
        <Route path="/admin/teachers" element={<TeacherList />} />
        
        {/* 2. DAFTARKAN ROUTE JADWAL */}
        <Route path="/admin/schedule" element={<SchedulePage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;