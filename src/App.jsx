// ... import lainnya
import TeacherProfile from './pages/teacher/TeacherProfile'; // <--- TAMBAHKAN IMPORT INI

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* ... route login tetap ... */}

        {/* ADMIN */}
        {/* ... route admin tetap ... */}

        {/* GURU */}
        <Route path="/guru/dashboard" element={<GuruRoute><TeacherDashboard /></GuruRoute>} />
        
        {/* PROFIL GURU (BARU) */}
        <Route path="/guru/profile" element={<GuruRoute><TeacherProfile /></GuruRoute>} />
        
        {/* Rute lainnya tetap sama ... */}
        <Route path="/guru/grades/input" element={<GuruRoute><TeacherInputGrade /></GuruRoute>} />
        <Route path="/guru/grades/manage" element={<GuruRoute><TeacherGradeManager /></GuruRoute>} />
        <Route path="/guru/history" element={<GuruRoute><TeacherHistory /></GuruRoute>} />
        <Route path="/guru/manual-input" element={<GuruRoute><TeacherManualInput /></GuruRoute>} />
        
        <Route path="/teacher" element={<Navigate to="/guru/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}