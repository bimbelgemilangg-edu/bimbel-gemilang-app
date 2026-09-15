// src/App.jsx
// Router utama Bimbel Gemilang — versi bersih TANPA SplashLauncher.
// Layar loading auth sekarang inline (logo dari folder public yang pasti ada),
// sehingga file src/components/SplashLauncher.jsx BOLEH DIHAPUS.
// Prefix route mengikuti path ASLI sidebar & navigasi:
//   admin = /admin/... | guru = /guru/... | siswa = /siswa/...
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, db } from './firebase';
import { doc, getDoc } from 'firebase/firestore';

// ====== LAYOUT & SIDEBAR ======
import SidebarAdmin from './components/SidebarAdmin';
import SidebarGuru from './components/SidebarGuru';
import SidebarSiswa from './components/SidebarSiswa';
import ErrorBoundary from './components/ErrorBoundary';

// ====== PUBLIK ======
import Login from './pages/Login';
import LoginGuru from './pages/LoginGuru';
import LoginSiswa from './pages/LoginSiswa';
import LoginOwner from './pages/LoginOwner';
import PendaftaranOnline from './pages/PendaftaranOnline';
import PendaftaranTentor from './pages/PendaftaranTentor';
import PublicBlog from './pages/PublicBlog';

// ====== ADMIN ======
import Dashboard from './pages/admin/Dashboard';
import DashboardAnalisis from './pages/admin/DashboardAnalisis';
import AdminDailyLog from './pages/admin/AdminDailyLog';
import OwnerFinance from './pages/admin/OwnerFinance';
import Settings from './pages/admin/Settings';
import ManajerBuku from './pages/admin/buku/ManajerBuku';
import ImporModul from './pages/admin/buku/ImporModul';
import ImportHasilScanPage from './pages/admin/bank-soal/ImportHasilScanPage';
import HasilKuisAdminPage from './pages/admin/bank-soal/HasilKuisAdminPage';
import HasilTryOutAdminPage from './pages/admin/bank-soal/HasilTryOutAdminPage';
import TerbitkanKuisPage from './pages/admin/bank-soal/TerbitkanKuisPage';
import TerbitkanTryOutPage from './pages/admin/bank-soal/TerbitkanTryOutPage';
import LatihanAktivitasPage from './pages/admin/bank-soal/LatihanAktivitasPage';

// ====== GURU ======
import TeacherDashboard from './pages/teacher/TeacherDashboard';
import TeacherSchedule from './pages/teacher/TeacherSchedule';
import TeacherAttendance from './pages/teacher/TeacherAttendance';
import TeacherHistory from './pages/teacher/TeacherHistory';
import TeacherProfile from './pages/teacher/TeacherProfile';
import TeacherLearningAid from './pages/teacher/TeacherLearningAid';
import LiveSessionTeacher from './pages/teacher/LiveSessionTeacher';
import ClassSession from './pages/teacher/ClassSession';
import ModulManager from './pages/teacher/modul/ModulManager';
import ManageMateri from './pages/teacher/modul/ManageMateri';
import ManageQuiz from './pages/teacher/modul/ManageQuiz';
import ManageTugas from './pages/teacher/modul/ManageTugas';
import CekTugasSiswa from './pages/teacher/modul/CekTugasSiswa';

// ====== SISWA ======
import StudentDashboard from './pages/student/StudentDashboard';
import StudentSchedule from './pages/student/StudentSchedule';
import StudentGrades from './pages/student/StudentGrades';
import StudentFinance from './pages/student/StudentFinance';
import StudentAttendance from './pages/student/StudentAttendance';
import StudentElearning from './pages/student/StudentElearning';
import StudentModuleView from './pages/student/StudentModuleView';
import StudentQuizView from './pages/student/StudentQuizView';
import StudentSurveyView from './pages/student/StudentSurveyView';
import LiveSessionStudent from './pages/student/LiveSessionStudent';
import LatihanSoalBab from './pages/student/LatihanSoalBab';
import LatihanTKA from './pages/student/LatihanTKA';
import LeaderboardPage from './pages/student/LeaderboardPage';
import LatihanHarianPage from './pages/student/gemilang/LatihanHarianPage';
import BukuInteraktifPage from './pages/student/gemilang/BukuInteraktifPage';
import BukuBacaPage from './pages/student/gemilang/BukuBacaPage';

// ====== PENGGANTI SPLASHLAUNCHER (inline, tanpa file asset) ======
function LayarMuat() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#ffffff', fontFamily: 'sans-serif', gap: 12 }}>
      <img src="/pwa-192x192.png" alt="Bimbel Gemilang" style={{ width: 80, height: 80, objectFit: 'contain' }} />
      <p style={{ color: '#64748b', fontSize: 13, margin: 0 }}>Memuat...</p>
    </div>
  );
}

// ====== PLACEHOLDER untuk halaman yang nama file-nya belum dikonfirmasi ======
function HalamanSegera({ judul }) {
  return (
    <div style={{ padding: 40, textAlign: 'center', fontFamily: 'sans-serif' }}>
      <div style={{ fontSize: 40 }}>🚧</div>
      <h2 style={{ fontSize: 16, fontWeight: 800, color: '#1e293b', margin: '8px 0 4px' }}>{judul}</h2>
      <p style={{ fontSize: 12.5, color: '#64748b', maxWidth: 420, margin: '0 auto' }}>
        Halaman ini belum tersambung di router versi baru. File aslinya tetap ada di
        proyek — sambungkan import & route-nya di src/App.jsx (cari komentar RECONNECT).
      </p>
    </div>
  );
}

// ====== WRAPPER LAYOUT PER ROLE ======
function AdminLayout() {
  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <SidebarAdmin />
      <main style={{ flex: 1, marginLeft: 260, overflow: 'auto', background: '#f6f7fb' }}>
        <Outlet />
      </main>
    </div>
  );
}
function TeacherLayout() {
  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <SidebarGuru />
      <main style={{ flex: 1, marginLeft: 260, overflow: 'auto', background: '#f6f7fb' }}>
        <Outlet />
      </main>
    </div>
  );
}
function StudentLayout() {
  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <SidebarSiswa />
      <main style={{ flex: 1, marginLeft: 260, overflow: 'auto', background: '#f6f7fb' }}>
        <Outlet />
      </main>
    </div>
  );
}

// ====== GUARD AUTH + ROLE ======
function AuthGuard({ role }) {
  const [status, setStatus] = useState('loading'); // loading | ok | denied
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) { setStatus('denied'); return; }
      try {
        const snap = await getDoc(doc(db, 'users', user.uid));
        const data = snap.exists() ? snap.data() : {};
        const r = String(data.role || '').toLowerCase();
        const ok =
          (role === 'admin' && (r === 'admin' || r === 'owner')) ||
          (role === 'teacher' && (r === 'teacher' || r === 'guru')) ||
          (role === 'student' && (r === 'student' || r === 'siswa'));
        setStatus(ok ? 'ok' : 'denied');
      } catch (e) {
        console.error('AuthGuard error:', e);
        setStatus('ok'); // fallback: izinkan masuk
      }
    });
    return () => unsub();
  }, [role]);
  if (status === 'loading') return <LayarMuat />;
  if (status === 'denied') return <Navigate to="/login" replace />;
  return <Outlet />;
}

export default function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <Routes>
          {/* ====== PUBLIK ====== */}
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<Login />} />
          <Route path="/login-guru" element={<LoginGuru />} />
          <Route path="/login-siswa" element={<LoginSiswa />} />
          <Route path="/login-owner" element={<LoginOwner />} />
          <Route path="/daftar" element={<PendaftaranOnline />} />
          <Route path="/daftar-tentor" element={<PendaftaranTentor />} />
          <Route path="/blog" element={<PublicBlog />} />
          <Route path="/blog/:slug" element={<PublicBlog />} />

          {/* ====== ADMIN ====== */}
          <Route element={<AuthGuard role="admin" />}>
            <Route element={<AdminLayout />}>
              <Route path="/admin" element={<Dashboard />} />
              <Route path="/admin/dashboard" element={<Dashboard />} />
              <Route path="/admin/analisis" element={<DashboardAnalisis />} />
              <Route path="/admin/daily-log" element={<AdminDailyLog />} />
              <Route path="/admin/finance" element={<OwnerFinance />} />
              <Route path="/admin/settings" element={<Settings />} />
              {/* RECONNECT: ganti HalamanSegera dengan import asli bila nama file diketahui */}
              <Route path="/admin/schedule" element={<HalamanSegera judul="Jadwal Harian" />} />
              <Route path="/admin/students" element={<HalamanSegera judul="Kelola Siswa" />} />
              <Route path="/admin/teachers" element={<HalamanSegera judul="Kelola Guru" />} />
              <Route path="/admin/teachers/salaries" element={<HalamanSegera judul="Gaji Guru" />} />
              <Route path="/admin/grades" element={<HalamanSegera judul="Rapor & Nilai" />} />
              <Route path="/admin/portal" element={<HalamanSegera judul="Portal Siswa" />} />
              <Route path="/admin/portal/materi" element={<HalamanSegera judul="Kelola Materi/Modul" />} />
              <Route path="/admin/pendaftaran" element={<HalamanSegera judul="Pendaftaran Online" />} />
              <Route path="/admin/pendaftaran/harga" element={<HalamanSegera judul="Manajemen Harga" />} />
              <Route path="/admin/pendaftaran/tentor" element={<HalamanSegera judul="Lamaran Tentor/Staff" />} />
              <Route path="/admin/blog" element={<HalamanSegera judul="Blog & Galeri" />} />
              <Route path="/admin/bank-soal/import" element={<HalamanSegera judul="Import Buku & Soal (AI)" />} />
              {/* Buku digital & bank soal (file sudah dikonfirmasi) */}
              <Route path="/admin/buku" element={<ManajerBuku />} />
              <Route path="/admin/buku/impor" element={<ImporModul />} />
              <Route path="/admin/bank-soal" element={<ImportHasilScanPage />} />
              <Route path="/admin/bank-soal/terbitkan" element={<TerbitkanKuisPage />} />
              <Route path="/admin/bank-soal/hasil" element={<HasilKuisAdminPage />} />
              <Route path="/admin/bank-soal/terbitkan-tryout" element={<TerbitkanTryOutPage />} />
              <Route path="/admin/bank-soal/hasil-tryout" element={<HasilTryOutAdminPage />} />
              <Route path="/admin/bank-soal/aktivitas-latihan" element={<LatihanAktivitasPage />} />
            </Route>
          </Route>

          {/* ====== GURU ====== */}
          <Route element={<AuthGuard role="teacher" />}>
            <Route element={<TeacherLayout />}>
              <Route path="/guru" element={<Navigate to="/guru/dashboard" replace />} />
              <Route path="/guru/dashboard" element={<TeacherDashboard />} />
              <Route path="/guru/schedule" element={<TeacherSchedule />} />
              <Route path="/guru/attendance" element={<TeacherAttendance />} />
              <Route path="/guru/modul" element={<ModulManager />} />
              <Route path="/guru/modul/materi" element={<ManageMateri />} />
              <Route path="/guru/modul/quiz" element={<ManageQuiz />} />
              <Route path="/guru/modul/tugas" element={<ManageTugas />} />
              <Route path="/guru/modul/cek-tugas" element={<CekTugasSiswa />} />
              <Route path="/guru/alat-bantu" element={<TeacherLearningAid />} />
              <Route path="/guru/cek-tugas" element={<CekTugasSiswa />} />
              <Route path="/guru/history" element={<TeacherHistory />} />
              <Route path="/guru/profile" element={<TeacherProfile />} />
              {/* RECONNECT: ganti HalamanSegera dengan import asli bila nama file diketahui */}
              <Route path="/guru/grades/input" element={<HalamanSegera judul="Input Nilai / Rapor" />} />
              <Route path="/guru/generate-raport" element={<HalamanSegera judul="Generate Raport" />} />
              {/* Sesi kelas: absensi+laporan (ClassSession) & live bank soal */}
              <Route path="/guru/class-session/:id" element={<ClassSession />} />
              <Route path="/guru/sesi-live" element={<LiveSessionTeacher />} />
            </Route>
          </Route>

          {/* ====== SISWA ====== */}
          <Route element={<AuthGuard role="student" />}>
            <Route element={<StudentLayout />}>
              <Route path="/siswa" element={<Navigate to="/siswa/dashboard" replace />} />
              <Route path="/siswa/dashboard" element={<StudentDashboard />} />
              <Route path="/siswa/schedule" element={<StudentSchedule />} />
              <Route path="/siswa/attendance" element={<StudentAttendance />} />
              <Route path="/siswa/grades" element={<StudentGrades />} />
              <Route path="/siswa/finance" element={<StudentFinance />} />
              <Route path="/siswa/elearning" element={<StudentElearning />} />
              <Route path="/siswa/module/:id" element={<StudentModuleView />} />
              <Route path="/siswa/quiz/:id" element={<StudentQuizView />} />
              <Route path="/siswa/survey/:id" element={<StudentSurveyView />} />
              <Route path="/siswa/live-session" element={<LiveSessionStudent />} />
              {/* BUKU DIGITAL: rak -> daftar bab -> baca */}
              <Route path="/siswa/buku" element={<BukuInteraktifPage />} />
              <Route path="/siswa/buku/:bukuId" element={<BukuInteraktifPage />} />
              <Route path="/siswa/buku/:bukuId/:babId" element={<BukuBacaPage />} />
              {/* LATIHAN */}
              <Route path="/siswa/latihan-harian" element={<LatihanHarianPage />} />
              <Route path="/siswa/latihan/:babId" element={<LatihanSoalBab />} />
              <Route path="/siswa/tka" element={<LatihanTKA />} />
              <Route path="/siswa/tryout" element={<LatihanTKA />} />
              <Route path="/siswa/leaderboard" element={<LeaderboardPage />} />
            </Route>
          </Route>

          {/* ====== FALLBACK ====== */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </ErrorBoundary>
  );
}