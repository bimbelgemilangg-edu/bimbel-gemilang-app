import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

// IMPORT UMUM
import Login from './pages/Login';
import LoginGuru from './pages/LoginGuru';

// IMPORT ADMIN
import Dashboard from './pages/admin/Dashboard'; 
import Settings from './pages/admin/Settings';
import StudentList from './pages/admin/students/StudentList';
import AddStudent from './pages/admin/students/AddStudent';
import StudentAttendance from './pages/admin/students/StudentAttendance';
import StudentFinance from './pages/admin/students/StudentFinance'; 
import EditStudent from './pages/admin/students/EditStudent';
import FinanceLayout from './pages/admin/finance/FinanceLayout'; 
import TeacherList from './pages/admin/teachers/TeacherList';
import TeacherSalaries from './pages/admin/teachers/TeacherSalaries'; 
import SchedulePage from './pages/admin/schedule/SchedulePage';
import GradeReport from './pages/admin/grades/GradeReport'; 

// IMPORT GURU
import TeacherDashboard from './pages/teacher/TeacherDashboard'; 
import TeacherHistory from './pages/teacher/TeacherHistory';
import TeacherManualInput from './pages/teacher/TeacherManualInput'; 
import TeacherInputGrade from './pages/teacher/grades/TeacherInputGrade'; 
// --- FITUR BARU: MANAJEMEN NILAI ---
import TeacherGradeManager from './pages/teacher/grades/TeacherGradeManager'; 

const AdminRoute = ({ children }) => {
  const isAuth = localStorage.getItem('isLoggedIn'); 
  return isAuth ? children : <Navigate to="/" />;
};

const GuruRoute = ({ children }) => children; 

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />              
        <Route path="/login-guru" element={<LoginGuru />} /> 

        {/* ADMIN */}
        <Route path="/admin" element={<AdminRoute><Dashboard /></AdminRoute>} />
        <Route path="/admin/students" element={<AdminRoute><StudentList /></AdminRoute>} />
        <Route path="/admin/students/add" element={<AdminRoute><AddStudent /></AdminRoute>} />
        <Route path="/admin/students/attendance/:id" element={<AdminRoute><StudentAttendance /></AdminRoute>} />
        <Route path="/admin/students/finance/:id" element={<AdminRoute><StudentFinance /></AdminRoute>} />
        <Route path="/admin/students/edit/:id" element={<AdminRoute><EditStudent /></AdminRoute>} />
        <Route path="/admin/finance" element={<AdminRoute><FinanceLayout /></AdminRoute>} />
        <Route path="/admin/teachers" element={<AdminRoute><TeacherList /></AdminRoute>} />
        <Route path="/admin/teachers/salaries" element={<AdminRoute><TeacherSalaries /></AdminRoute>} />
        <Route path="/admin/schedule" element={<AdminRoute><SchedulePage /></AdminRoute>} />
        <Route path="/admin/settings" element={<AdminRoute><Settings /></AdminRoute>} />
        <Route path="/admin/grades" element={<AdminRoute><GradeReport /></AdminRoute>} />

        {/* GURU */}
        <Route path="/guru/dashboard" element={<GuruRoute><TeacherDashboard /></GuruRoute>} />
        
        {/* INPUT NILAI */}
        <Route path="/guru/grades/input" element={<GuruRoute><TeacherInputGrade /></GuruRoute>} />
        
        {/* EDIT NILAI (YANG TADI KELUPAAN) */}
        <Route path="/guru/grades/manage" element={<GuruRoute><TeacherGradeManager /></GuruRoute>} />

        <Route path="/guru/history" element={<GuruRoute><TeacherHistory /></GuruRoute>} />
        <Route path="/guru/manual-input" element={<GuruRoute><TeacherManualInput /></GuruRoute>} />
        <Route path="/teacher" element={<Navigate to="/guru/dashboard" replace />} />

      </Routes>
    </BrowserRouter>
  );
}

export default App;