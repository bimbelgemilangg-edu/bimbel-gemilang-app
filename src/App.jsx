import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom'; // Pake BrowserRouter lagi
import Login from './pages/Login';
import Dashboard from './pages/admin/Dashboard';
import StudentList from './pages/admin/students/StudentList';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/admin" element={<Dashboard />} />
        <Route path="/admin/students" element={<StudentList />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;