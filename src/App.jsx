import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/admin/Dashboard';
import StudentList from './pages/admin/students/StudentList';
import AddStudent from './pages/admin/students/AddStudent'; // 1. Import ini

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/admin" element={<Dashboard />} />
        <Route path="/admin/students" element={<StudentList />} />
        {/* 2. Tambah Route Baru */}
        <Route path="/admin/students/add" element={<AddStudent />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;