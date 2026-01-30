import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/admin/Dashboard';
import StudentList from './pages/admin/students/StudentList'; // Import File Baru

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/admin" element={<Dashboard />} />
        
        {/* Route Baru untuk Manajemen Siswa */}
        <Route path="/admin/students" element={<StudentList />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;