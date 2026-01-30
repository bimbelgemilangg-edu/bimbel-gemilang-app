import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/admin/Dashboard';
import StudentList from './pages/admin/students/StudentList';
import AddStudent from './pages/admin/students/AddStudent';
import FinanceDashboard from './pages/admin/finance/FinanceDashboard'; // 1. Import Ini

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/admin" element={<Dashboard />} />
        <Route path="/admin/students" element={<StudentList />} />
        <Route path="/admin/students/add" element={<AddStudent />} />
        
        {/* 2. Route Keuangan */}
        <Route path="/admin/finance" element={<FinanceDashboard />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;