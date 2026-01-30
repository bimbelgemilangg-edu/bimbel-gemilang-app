import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

// Import Halaman
import Login from './pages/Login';
import Dashboard from './pages/admin/Dashboard';
import StudentList from './pages/admin/students/StudentList';
import AddStudent from './pages/admin/students/AddStudent';
import FinanceDashboard from './pages/admin/finance/FinanceDashboard';
import TeacherList from './pages/admin/teachers/TeacherList';
// IMPORT JADWAL (Sesuai lokasi Anda: /src/pages/schedule/)
import SchedulePage from './pages/schedule/SchedulePage'; 

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
        <Route path="/admin/schedule" element={<SchedulePage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;