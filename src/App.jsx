import React from 'react';
// UBAH DISINI: Gunakan HashRouter pengganti BrowserRouter
import { HashRouter, Routes, Route } from 'react-router-dom'; 

import Login from './pages/Login';
import Dashboard from './pages/admin/Dashboard';
import StudentList from './pages/admin/students/StudentList';

function App() {
  return (
    // UBAH DISINI: Bungkus aplikasi dengan HashRouter
    <HashRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/admin" element={<Dashboard />} />
        <Route path="/admin/students" element={<StudentList />} />
      </Routes>
    </HashRouter>
  );
}

export default App;