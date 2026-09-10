// src/pages/student/StudentDashboard.jsx
import React, { useState, useEffect } from 'react';
import { db, auth } from '../../firebase';
import { collection, query, getDocs, orderBy, doc, getDoc, setDoc, deleteDoc, addDoc, serverTimestamp, where, limit } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { Html5Qrcode } from "html5-qrcode";
import { useNavigate } from 'react-router-dom';
import { RAPORT_COLLECTIONS } from '../../firebase/raportCollection';
import StudentDigitalCard from '../../components/StudentDigitalCard';
import MaskotAstronot from '../../components/MaskotAstronot';

import {
  BookOpen, Calendar, ClipboardList, X, Camera, User, MapPin,
  Trophy, ArrowRight, AlertCircle, Award, Bell, Download,
  Trash2, FileQuestion, FileText, DollarSign, Sparkles, Inbox,
  Megaphone, RefreshCw, IdCard, Search
} from 'lucide-react';

// ============================================================
// IKON & WARNA PER TIPE NOTIFIKASI
// ============================================================
const NOTIF_META = {
  materi: { icon: <BookOpen size={16} />, color: '#3b82f6', bg: '#eff6ff', label: 'Materi Baru' },
  kuis: { icon: <FileQuestion size={16} />, color: '#8b5cf6', bg: '#f5f3ff', label: 'Kuis Baru' },
  tugas: { icon: <ClipboardList size={16} />, color: '#f59e0b', bg: '#fffbeb', label: 'Tugas Baru' },
  survei: { icon: <Sparkles size={16} />, color: '#06b6d4', bg: '#ecfeff', label: 'Survei' },
  tagihan: { icon: <DollarSign size={16} />, color: '#ef4444', bg: '#fef2f2', label: 'Tagihan' },
  hasil_kuis: { icon: <Award size={16} />, color: '#10b981', bg: '#f0fdf4', label: 'Hasil Keluar' },
  pengumuman: { icon: <Megaphone size={16} />, color: '#64748b', bg: '#f8fafc', label: 'Pengumuman' },
};

const timeAgo = (ts) => {
  if (!ts?.toDate) return '';
  const diffMs = Date.now() - ts.toDate().getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'Baru saja';
  if (mins < 60) return `${mins} menit lalu`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} jam lalu`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} hari lalu`;
  return ts.toDate().toLocaleDateString('id-ID');
};

// Sapaan berdasarkan jam
const getGreeting = () => {
  const h = new Date().getHours();
  if (h < 4) return { text: 'Selamat malam', icon: '🌙' };
  if (h < 11) return { text: 'Selamat pagi', icon: '☀️' };
  if (h < 15) return { text: 'Selamat siang', icon: '🌤️' };
  if (h < 18) return { text: 'Selamat sore', icon: '🌇' };
  return { text: 'Selamat malam', icon: '🌙' };
};

// 🔥 BARU: formula level dari total XP -- makin berat tiap naik level
// (level N->N+1 butuh N*100 XP). Bagian dari sistem gamifikasi baru.
const hitungLevelDariXp = (xpTotal) => {
  let level = 1;
  let sisaXp = xpTotal;
  let kebutuhanLevelIni = 100;
  while (sisaXp >= kebutuhanLevelIni) {
    sisaXp -= kebutuhanLevelIni;
    level += 1;
    kebutuhanLevelIni = level * 100;
  }
  return { level, xpProgress: sisaXp, xpKebutuhan: kebutuhanLevelIni };
};

// Skeleton loading sederhana
const SkeletonLines = ({ count = 3 }) => (
  <div>
    {Array.from({ length: count }).map((_, i) => (
      <div key={i} style={{
        height: 14, borderRadius: 6, marginBottom: 10,
        width: i === count - 1 ? '60%' : '100%',
        background: 'linear-gradient(90deg,#f1f5f9 25%,#e2e8f0 37%,#f1f5f9 63%)',
        backgroundSize: '400% 100%', animation: 'skeletonShine 1.4s ease infinite',
      }} />
    ))}
  </div>
);

// 🔥 Bagan bundar kehadiran — pakai SVG murni, gak perlu library tambahan
const AttendanceDonut = ({ hadir, izin, alpha, total }) => {
  const size = 110, stroke = 14, radius = (size - stroke) / 2, circumference = 2 * Math.PI * radius;

  if (total === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '20px 0', color: '#94a3b8', fontSize: 12 }}>
        📭 Belum ada data kehadiran
      </div>
    );
  }

  const segments = [
    { value: hadir, color: '#10b981' },
    { value: izin, color: '#f59e0b' },
    { value: alpha, color: '#ef4444' },
  ];
  let offsetAcc = 0;

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 18, flexWrap: 'wrap' }}>
      <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
        <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
          <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#f1f5f9" strokeWidth={stroke} />
          {segments.map((seg, i) => {
            if (seg.value === 0) return null;
            const segLen = (seg.value / total) * circumference;
            const dash = `${segLen} ${circumference - segLen}`;
            const dashoffset = -offsetAcc;
            offsetAcc += segLen;
            return (
              <circle
                key={i} cx={size / 2} cy={size / 2} r={radius} fill="none"
                stroke={seg.color} strokeWidth={stroke} strokeDasharray={dash}
                strokeDashoffset={dashoffset} strokeLinecap="round"
                style={{ transition: 'stroke-dasharray 0.5s ease' }}
              />
            );
          })}
        </svg>
        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ fontSize: 22, fontWeight: 900, color: '#1e293b' }}>{total > 0 ? Math.round((hadir / total) * 100) : 0}%</span>
          <span style={{ fontSize: 9, color: '#94a3b8', fontWeight: 700 }}>HADIR</span>
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#10b981' }} /> Hadir: <b>{hadir}</b>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#f59e0b' }} /> Izin/Sakit: <b>{izin}</b>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#ef4444' }} /> Alpha: <b>{alpha}</b>
        </div>
      </div>
    </div>
  );
};

// ============================================================
// 🔥 CEK AKSES MAPEL (paket 1 mapel / 2 mapel / paket lengkap)
// ============================================================
const hasSubjectAccess = (enrolledSubjects, modulSubject, modulKodeMapel) => {
  if (!modulSubject || modulSubject.toLowerCase().trim() === 'umum') return true;
  const modulCodes = String(modulKodeMapel || '').split(',').map(s => String(s || '').toLowerCase().trim()).filter(Boolean);
  if (modulCodes.length === 0) return true;
  if (!Array.isArray(enrolledSubjects) || enrolledSubjects.length === 0) return false;
  const norm = (s) => String(s || '').toLowerCase().trim();
  if (enrolledSubjects.some(s => norm(s) === 'semua')) return true;
  return enrolledSubjects.some(s => modulCodes.includes(norm(s)));
};

const StudentDashboard = () => {
  const navigate = useNavigate();
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);

  const [studentName, setStudentName] = useState(() => localStorage.getItem('studentName') || 'Siswa');
  const [studentId, setStudentId] = useState(null);
  const [studentDocId, setStudentDocId] = useState(null);
  const [studentProfile, setStudentProfile] = useState(null);
  const [studentKelas, setStudentKelas] = useState(() => localStorage.getItem('studentKelas') || '');
  const [studentProgram, setStudentProgram] = useState(() => localStorage.getItem('studentProgram') || 'Reguler');
  const [studentNim, setStudentNim] = useState(() => localStorage.getItem('studentNim') || '');

  const [todaySchedules, setTodaySchedules] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [raportSummary, setRaportSummary] = useState(null);

  const [dataLoading, setDataLoading] = useState(true);
  const [isScanning, setIsScanning] = useState(false);
  const [teksCariMateri, setTeksCariMateri] = useState('');
  const [authReady, setAuthReady] = useState(false);
  const [authError, setAuthError] = useState(false);

  const [notifications, setNotifications] = useState([]);
  const [showNotifPanel, setShowNotifPanel] = useState(false);

  const [progresXp, setProgresXp] = useState(0);
  const [progresStreak, setProgresStreak] = useState(0);
  const attendanceRef = React.useRef(null);

  const [wajibSurveys, setWajibSurveys] = useState([]);
  const [attendanceSummary, setAttendanceSummary] = useState({ hadir: 0, izin: 0, alpha: 0, total: 0 });
  const [optionalSurveys, setOptionalSurveys] = useState([]);
  const [dismissedSurveyIds, setDismissedSurveyIds] = useState(() => {
    try { return JSON.parse(localStorage.getItem('dismissedSurveys') || '[]'); }
    catch { return []; }
  });

  const getSmartDateString = (dateObj) => {
    const year = dateObj.getFullYear();
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const day = String(dateObj.getDate()).padStart(2, '0');
    return year + '-' + month + '-' + day;
  };

  const checkStudentAccess = (modul, studentId, studentKelas, studentProgram, studentEnrolledSubjects) => {
    if (modul.sendToSpecificStudents) {
      const studentIds = modul.studentIds || [];
      const selectedStudentIds = (modul.selectedStudents || []).map(s => s.studentId || s.id);
      const allTargetIds = [...studentIds, ...selectedStudentIds];
      return allTargetIds.includes(studentId) || allTargetIds.includes(studentNim);
    }
    const targetKelas = modul.targetKelas || 'Semua';
    const matchKelas = targetKelas === 'Semua' || targetKelas === studentKelas;
    return matchKelas && hasSubjectAccess(studentEnrolledSubjects, modul.subject || '', modul.kodeMapel || '');
  };

  useEffect(() => {
    const h = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', h);
    return () => window.removeEventListener('resize', h);
  }, []);

  const [statusStreak, setStatusStreak] = useState('belum-pernah');
  useEffect(() => {
    if (!studentId) return;
    (async () => {
      try {
        const snap = await getDoc(doc(db, 'siswa_progress', studentId));
        if (snap.exists()) {
          const d = snap.data();
          setProgresXp(Number(d.xp) || 0);
          setProgresStreak(Number(d.streak) || 0);
          const hariIniStr = new Date().toISOString().slice(0, 10);
          const lastActiveDateStr = d.lastActiveDate || null;
          const streak = Number(d.streak) || 0;
          const target = d.targetHarian || 10;
          const soalHariIni = d.soalHariTanggal === hariIniStr ? (d.soalHariIniCount || 0) : 0;
          if (!lastActiveDateStr) {
            setStatusStreak('belum-pernah');
          } else {
            const selisihHari = Math.round((new Date(hariIniStr).getTime() - new Date(lastActiveDateStr).getTime()) / (1000 * 60 * 60 * 24));
            if (streak === 0 && selisihHari > 1) setStatusStreak('berakhir');
            else if (soalHariIni < target) setStatusStreak('berisiko');
            else setStatusStreak('aman');
          }
        }
      } catch (e) {
        console.error('Gagal ambil progres XP/streak:', e);
      }
    })();
  }, [studentId]);

  const isMobile = windowWidth <= 768;
  const greeting = getGreeting();

  useEffect(() => {
    const storedId = localStorage.getItem('studentId');
    const storedName = localStorage.getItem('studentName');
    const storedDocId = localStorage.getItem('studentDocId');
    const isLoggedIn = localStorage.getItem('isSiswaLoggedIn') === 'true';

    if (isLoggedIn && storedId) {
      setStudentId(storedId);
      setStudentDocId(storedDocId || null);
      setStudentName(storedName || "Siswa");
      setAuthReady(true);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setStudentName(storedName || user.email || "Siswa");
        setStudentId(storedId || user.uid);
        localStorage.setItem('isSiswaLoggedIn', 'true');
        localStorage.setItem('studentId', storedId || user.uid);
        setAuthReady(true);
      } else {
        setAuthError(true);
        setDataLoading(false);
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!authReady || !studentId) return;

    const fetchData = async () => {
      try {
        const todayStr = getSmartDateString(new Date());
        const periode = new Date().getFullYear() + '-' + String(new Date().getMonth() + 1).padStart(2, '0');

        let resolvedDocId = studentDocId;
        if (!resolvedDocId) {
          const found = await getDocs(
            query(collection(db, "students"), where("studentId", "==", studentId), limit(1))
          ).catch(() => null);
          if (found && !found.empty) {
            resolvedDocId = found.docs[0].id;
            setStudentDocId(resolvedDocId);
            localStorage.setItem('studentDocId', resolvedDocId);
          } else {
            resolvedDocId = studentId;
          }
        }

        const sSnap = await getDoc(doc(db, "students", resolvedDocId)).catch(() => null);
        let kelasVal = studentKelas, programVal = studentProgram, nimVal = studentNim || studentId;
        let enrolledSubjectsVal = null;
        if (sSnap?.exists()) {
          const data = sSnap.data();
          setStudentProfile(data);
          kelasVal = data.kelasSekolah || '';
          programVal = data.kategori || 'Reguler';
          nimVal = data.studentId || data.id || studentId;
          enrolledSubjectsVal = Array.isArray(data.enrolledSubjects) ? data.enrolledSubjects : [];
          setStudentKelas(kelasVal);
          setStudentProgram(programVal);
          setStudentNim(nimVal);
          localStorage.setItem('studentKelas', kelasVal);
          localStorage.setItem('studentProgram', programVal);
          localStorage.setItem('studentNim', nimVal);
          try {
            if (enrolledSubjectsVal) localStorage.setItem('studentEnrolledSubjects', JSON.stringify(enrolledSubjectsVal));
            else localStorage.removeItem('studentEnrolledSubjects');
          } catch (e) { /* localStorage penuh/gak tersedia -- gak fatal */ }
        }

        const [
          schedSnap, modulSnap, raportSnap, notifSnap, surveySnap,
          respByUserId, respByStudentId, respByRespondentId, respByNim,
          attByDocId, attByKodeUnik, attByName, attByNamaSiswa,
        ] = await Promise.all([
          getDocs(query(collection(db, "jadwal_bimbel"), where("dateStr", "==", todayStr))).catch(() => ({ docs: [] })),
          getDocs(query(collection(db, "bimbel_modul"), orderBy("updatedAt", "desc"), limit(200))).catch(() => ({ docs: [] })),
          getDocs(query(collection(db, RAPORT_COLLECTIONS.FINAL), where("studentId", "==", studentId), where("periode", "==", periode), limit(1))).catch(() => ({ docs: [] })),
          getDocs(query(collection(db, "notifications"), where("recipientId", "==", nimVal), limit(30))).catch(() => ({ docs: [] })),
          getDocs(query(collection(db, "surveys"), where("status", "==", "aktif"), limit(50))).catch(() => ({ docs: [] })),
          getDocs(query(collection(db, "survey_responses"), where("userId", "==", nimVal))).catch(() => ({ docs: [] })),
          getDocs(query(collection(db, "survey_responses"), where("studentId", "==", nimVal))).catch(() => ({ docs: [] })),
          getDocs(query(collection(db, "survey_responses"), where("respondentId", "==", nimVal))).catch(() => ({ docs: [] })),
          getDocs(query(collection(db, "survey_responses"), where("nim", "==", nimVal))).catch(() => ({ docs: [] })),
          getDocs(query(collection(db, "attendance"), where("studentId", "==", studentId))).catch(() => ({ docs: [] })),
          getDocs(query(collection(db, "attendance"), where("studentId", "==", nimVal))).catch(() => ({ docs: [] })),
          getDocs(query(collection(db, "attendance"), where("studentName", "==", studentName))).catch(() => ({ docs: [] })),
          getDocs(query(collection(db, "attendance"), where("namaSiswa", "==", studentName))).catch(() => ({ docs: [] })),
        ]);

        const attMerged = new Map();
        [...attByDocId.docs, ...attByKodeUnik.docs, ...attByName.docs, ...attByNamaSiswa.docs].forEach(d => attMerged.set(d.id, d.data()));
        const attList = Array.from(attMerged.values());
        setAttendanceSummary({
          hadir: attList.filter(a => a.status === 'Hadir').length,
          izin: attList.filter(a => a.status === 'Izin' || a.status === 'Sakit').length,
          alpha: attList.filter(a => a.status === 'Alpha').length,
          total: attList.length,
        });

        const fetchedSchedules = schedSnap.docs
          .map(d => ({ id: d.id, ...d.data() }))
          .filter(sch => sch.students?.some(s => s.id === studentId || s === studentId || s.studentId === studentId))
          .sort((a, b) => (a.start || '').localeCompare(b.start || ''))
          .slice(0, 5);
        setTodaySchedules(fetchedSchedules);

        const rawModulsData = modulSnap.docs.map(d => ({ id: d.id, ...d.data() }));
        const embeddedQuizIds = new Set();
        rawModulsData.forEach(m => {
          (m.blocks || []).forEach(b => {
            if (b.type === 'quiz' && b.quizId) embeddedQuizIds.add(b.quizId);
          });
        });
        const allModulsData = rawModulsData.filter(m => !embeddedQuizIds.has(m.id) && !m.parentModulId);

        const nowTsForFilter = new Date();
        const accessibleModuls = allModulsData.filter(modul => {
          if (modul.status === 'arsip') return false;
          return checkStudentAccess(modul, studentId, kelasVal, programVal, enrolledSubjectsVal);
        }).map(modul => {
          const isUpcoming = modul.status === 'terjadwal' && modul.tanggalMulai && new Date(modul.tanggalMulai) > nowTsForFilter;
          return { ...modul, __isUpcoming: isUpcoming };
        });

        const quizIdsToCheck = new Set();
        accessibleModuls.forEach(m => {
          (m.blocks || []).forEach(b => {
            if (b.type === 'quiz' && b.quizId) quizIdsToCheck.add(b.quizId);
          });
        });

        const quizDeadlineMap = {};
        if (quizIdsToCheck.size > 0) {
          const quizSnaps = await Promise.all(
            Array.from(quizIdsToCheck).map(id => getDoc(doc(db, "bimbel_modul", id)).catch(() => null))
          );
          quizSnaps.forEach(snap => {
            if (snap?.exists()) {
              const d = snap.data();
              quizDeadlineMap[snap.id] = d.deadline ? new Date(d.deadline) : null;
            }
          });
        }

        const processedTasks = [];
        for (const m of accessibleModuls) {
          const hasQuiz = (m.quizData || []).length > 0 || (m.blocks || []).some(b => b.type === 'quiz' && b.quizId);
          const hasAssignment = (m.blocks || []).some(b => b.type === 'assignment');
          if (!hasQuiz && !hasAssignment) continue;

          // 🔥 Cek jawaban siswa untuk kuis dan assignment
          let hasSubmittedValue = false;
          if (hasQuiz) {
            const quizBlock = (m.blocks || []).find(b => b.type === 'quiz' && b.quizId);
            const quizId = quizBlock?.quizId || (m.quizData?.length > 0 ? m.id : null);
            if (quizId) {
              const jawabSnap = await getDocs(
                query(collection(db, "quiz_answers"), where("quizId", "==", quizId), where("studentId", "==", nimVal), limit(1))
              ).catch(() => ({ empty: true, docs: [] }));
              if (!jawabSnap.empty) {
                const jDoc = jawabSnap.docs[0].data();
                if (jDoc.nilai !== null && jDoc.nilai !== undefined) hasSubmittedValue = true;
              }
            }
          }
          if (!hasSubmittedValue && hasAssignment) {
            const jawabSnap = await getDocs(
              query(collection(db, "assignment_answers"), where("moduleId", "==", m.id), where("studentId", "==", nimVal), limit(1))
            ).catch(() => ({ empty: true, docs: [] }));
            if (!jawabSnap.empty) {
              const jDoc = jawabSnap.docs[0].data();
              if (jDoc.nilai !== null && jDoc.nilai !== undefined) hasSubmittedValue = true;
            }
          }
          if (hasSubmittedValue) continue;

          // 🔥 Tentukan deadline terdekat (kuis atau tugas)
          let deadlineTs = null;
          if (hasQuiz) {
            const quizBlock = (m.blocks || []).find(b => b.type === 'quiz' && b.quizId);
            const quizId = quizBlock?.quizId || (m.quizData?.length > 0 ? m.id : null);
            if (quizId && quizDeadlineMap[quizId]) deadlineTs = quizDeadlineMap[quizId];
            else if (m.deadline) deadlineTs = new Date(m.deadline);
          } else if (m.deadline) {
            deadlineTs = new Date(m.deadline);
          }

          // 🔥 Filter: kalau terlewat lebih dari 7 hari, hapus dari daftar
          const nowTs = Date.now();
          let isTerlewat = false;
          if (deadlineTs) {
            const diffMs = nowTs - deadlineTs.getTime();
            if (diffMs > 0) {
              isTerlewat = true;
              const diffDays = diffMs / (1000 * 60 * 60 * 24);
              if (diffDays > 7) continue; // 🔥 Hapus setelah 7 hari terlewat
            }
          }

          processedTasks.push({ ...m, __deadline: deadlineTs, __terlewat: isTerlewat });
        }

        // 🔥 Urutkan berdasarkan deadline terdekat
        processedTasks.sort((a, b) => {
          if (!a.__deadline && !b.__deadline) return 0;
          if (!a.__deadline) return 1;
          if (!b.__deadline) return -1;
          return a.__deadline.getTime() - b.__deadline.getTime();
        });

        setTasks(processedTasks);

        if (raportSnap && !raportSnap.empty) {
          const rData = raportSnap.docs[0].data();
          setRaportSummary({ ...rData, periode });
        }

        const notifs = notifSnap.docs.map(d => ({ id: d.id, ...d.data() })).sort((a, b) => {
          const aTs = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : 0;
          const bTs = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : 0;
          return bTs - aTs;
        });
        setNotifications(notifs);

        const activeSurveys = surveySnap.docs.map(d => ({ id: d.id, ...d.data() }));
        const answeredSurveyIds = new Set([
          ...respByUserId.docs.map(d => d.data().surveyId),
          ...respByStudentId.docs.map(d => d.data().surveyId),
          ...respByRespondentId.docs.map(d => d.data().surveyId),
          ...respByNim.docs.map(d => d.data().surveyId),
        ]);
        const wajib = activeSurveys.filter(s => s.wajib && !answeredSurveyIds.has(s.id) && !dismissedSurveyIds.includes(s.id));
        const optional = activeSurveys.filter(s => !s.wajib && !answeredSurveyIds.has(s.id) && !dismissedSurveyIds.includes(s.id));
        setWajibSurveys(wajib);
        setOptionalSurveys(optional);

      } catch (error) {
        console.error("Gagal fetch data dashboard:", error);
      } finally {
        setDataLoading(false);
      }
    };

    fetchData();
  }, [authReady, studentId, studentDocId, studentKelas, studentProgram, studentNim, dismissedSurveyIds]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const menuBaru = [
    { key: 'kehadiran', emoji: '📊', label: 'Kehadiran', warna: 'linear-gradient(135deg, #FF9E67 0%, #FFB88C 100%)', warnaTeks: '#C2410C' },
    { key: 'latihan', emoji: '🔥', label: 'Latihan Harian', warna: 'linear-gradient(135deg, #FDE68A 0%, #FCD34D 100%)', warnaTeks: '#92400E' },
    { key: 'tryout', emoji: '🎯', label: 'Tryout', warna: 'linear-gradient(135deg, #B4B3FF 0%, #9FA8DA 100%)', warnaTeks: '#3730A3', segeraHadir: true },
    { key: 'leaderboard', emoji: '🏆', label: 'Leaderboard', warna: 'linear-gradient(135deg, #A7F3D0 0%, #6EE7B7 100%)', warnaTeks: '#065F46', segeraHadir: true },
  ];

  const visibleOptionalSurveys = optionalSurveys.slice(0, 3);

  const dismissOptionalSurvey = (id) => {
    const updated = [...dismissedSurveyIds, id];
    setDismissedSurveyIds(updated);
    try { localStorage.setItem('dismissedSurveys', JSON.stringify(updated)); } catch (e) { }
    setOptionalSurveys(prev => prev.filter(s => s.id !== id));
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: '#F5F5F0',
      fontFamily: "'Inter', 'Poppins', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      padding: isMobile ? '16px' : '24px 32px',
    }}>
      {/* Header dengan sapaan user */}
      <div style={{ marginBottom: 28 }}>
        {(() => {
          const { level, xpProgress, xpKebutuhan } = hitungLevelDariXp(progresXp);
          const progressPercent = Math.min(100, Math.round((xpProgress / xpKebutuhan) * 100));
          return (
            <div style={{
              background: 'linear-gradient(135deg, #FF9E67 0%, #FFB88C 50%, #FDE68A 100%)',
              borderRadius: 24,
              padding: isMobile ? '20px 18px' : '28px 24px',
              boxShadow: '0 8px 24px rgba(255, 158, 103, 0.25)',
              position: 'relative',
              overflow: 'hidden',
              border: '1px solid rgba(255,255,255,0.5)',
            }}>
              <div style={{ position: 'absolute', top: -30, right: -30, width: 120, height: 120, background: 'rgba(255,255,255,0.15)', borderRadius: '50%', blur: '20px' }} />
              <div style={{ position: 'absolute', bottom: -20, left: -10, width: 80, height: 80, background: 'rgba(255,255,255,0.1)', borderRadius: '50%', blur: '15px' }} />
              
              <div style={{ position: 'relative', zIndex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
                  <div>
                    <div style={{ fontSize: isMobile ? 20 : 26, fontWeight: 800, color: '#7C3AED', marginBottom: 6, letterSpacing: '-0.02em' }}>
                      {greeting.icon} {greeting.text}, {studentName.split(' ')[0]}!
                    </div>
                    <div style={{ fontSize: isMobile ? 12 : 14, color: '#6B58A8', fontWeight: 600, opacity: 0.9 }}>
                      🚀 Level {level} • {progresStreak} hari streak
                    </div>
                  </div>
                  <button onClick={() => setShowNotifPanel(!showNotifPanel)} style={{
                    background: 'rgba(255,255,255,0.9)',
                    border: 'none',
                    borderRadius: 16,
                    width: 44,
                    height: 44,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    position: 'relative',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                    transition: 'all 0.2s ease',
                  }}
                    onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.08)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
                  >
                    <Bell size={20} color="#7C3AED" />
                    {unreadCount > 0 && (
                      <span style={{
                        position: 'absolute',
                        top: -4,
                        right: -4,
                        background: '#EF4444',
                        color: 'white',
                        borderRadius: '50%',
                        minWidth: 20,
                        height: 20,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 10,
                        fontWeight: 800,
                        border: '2px solid white',
                      }}>{unreadCount > 9 ? '9+' : unreadCount}</span>
                    )}
                  </button>
                </div>

                <div style={{ background: 'rgba(255,255,255,0.6)', borderRadius: 16, padding: '14px 18px', backdropFilter: 'blur(10px)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: '#7C3AED' }}>XP Progress</span>
                    <span style={{ fontSize: 12, fontWeight: 700, color: '#7C3AED' }}>{xpProgress}/{xpKebutuhan} XP</span>
                  </div>
                  <div style={{ background: 'rgba(255,255,255,0.8)', borderRadius: 10, height: 10, overflow: 'hidden' }}>
                    <div style={{
                      width: `${progressPercent}%`,
                      height: '100%',
                      background: 'linear-gradient(90deg, #7C3AED 0%, #A78BFA 100%)',
                      borderRadius: 10,
                      transition: 'width 0.5s ease',
                    }} />
                  </div>
                </div>
              </div>
            </div>
          );
        })()}
      </div>

      {/* Search bar dengan styling modern */}
      <div style={{ marginBottom: 24 }}>
        <div style={{
          background: 'white',
          borderRadius: 24,
          padding: '6px 8px 6px 18px',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          position: 'relative',
          boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
          border: '1px solid #F3F4F6',
        }}>
          <input
            type="text"
            value={teksCariMateri}
            onChange={(e) => setTeksCariMateri(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && teksCariMateri.trim()) navigate(`/siswa/materi?cari=${encodeURIComponent(teksCariMateri.trim())}`); }}
            placeholder="Cari materi, mis. Aljabar, Teks Deskripsi..."
            style={{ flex: 1, border: 'none', outline: 'none', fontSize: 14, color: '#374151', background: 'transparent', fontWeight: 500 }}
          />
          <button
            onClick={() => teksCariMateri.trim() ? navigate(`/siswa/materi?cari=${encodeURIComponent(teksCariMateri.trim())}`) : navigate('/siswa/materi')}
            style={{
              background: 'linear-gradient(135deg, #FF9E67 0%, #FFB88C 100%)',
              border: 'none',
              borderRadius: 12,
              width: 40,
              height: 40,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              flexShrink: 0,
              transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
              boxShadow: '0 4px 12px rgba(255, 158, 103, 0.3)',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.08)'; e.currentTarget.style.boxShadow = '0 6px 16px rgba(255, 158, 103, 0.4)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(255, 158, 103, 0.3)'; }}
          >
            <Search size={18} color="white" />
          </button>
        </div>
      </div>

      {/* Menu grid dengan cards rounded */}
      <style>{`@keyframes goyangPeringatan { 0%,100%{transform:rotate(0deg);} 25%{transform:rotate(-15deg);} 75%{transform:rotate(15deg);} }`}</style>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: isMobile ? 12 : 16, marginBottom: 20 }}>
        {menuBaru.map((m) => (
          <button
            key={m.key}
            onClick={() => {
              if (m.key === 'kehadiran') {
                attendanceRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
              } else if (m.key === 'latihan') {
                navigate('/siswa/latihan-harian');
              } else if (m.key === 'tryout') {
                navigate('/siswa/tryout');
              } else if (m.key === 'leaderboard') {
                navigate('/siswa/leaderboard');
              } else if (m.segeraHadir) {
                alert(`✨ ${m.label} segera hadir!`);
              }
            }}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 8,
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-4px)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; }}
          >
            <div style={{
              width: isMobile ? 58 : 68,
              height: isMobile ? 58 : 68,
              borderRadius: 24,
              background: m.warna,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 28,
              position: 'relative',
              boxShadow: `0 6px 16px ${m.warna}CC`,
              border: '2px solid white',
            }}>
              {m.emoji}
              {m.segeraHadir && (
                <span style={{
                  position: 'absolute',
                  bottom: -8,
                  fontSize: 9,
                  background: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
                  color: 'white',
                  padding: '3px 8px',
                  borderRadius: 10,
                  fontWeight: 700,
                  whiteSpace: 'nowrap',
                  boxShadow: '0 2px 8px rgba(245, 158, 11, 0.4)',
                }}>Segera</span>
              )}
              {m.key === 'latihan' && (
                <span style={{
                  position: 'absolute',
                  top: -8,
                  right: -8,
                  width: 26,
                  height: 26,
                  borderRadius: '50%',
                  background: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 15,
                  boxShadow: '0 3px 10px rgba(0,0,0,0.15)',
                  border: '2px solid #FEF3C7',
                  animation: statusStreak === 'berisiko' ? 'goyangPeringatan 1.8s ease-in-out infinite' : 'none',
                }}>
                  {statusStreak === 'belum-pernah' && '🙂'}
                  {statusStreak === 'berakhir' && '😢'}
                  {statusStreak === 'berisiko' && '😰'}
                  {statusStreak === 'aman' && '🔥'}
                </span>
              )}
            </div>
            {m.key === 'latihan' && (
              <span style={{
                fontSize: 9.5,
                fontWeight: 700,
                textAlign: 'center',
                lineHeight: 1.2,
                color: statusStreak === 'berakhir' ? '#DC2626' : statusStreak === 'berisiko' ? '#D97706' : statusStreak === 'aman' ? '#16A34A' : '#3B82F6',
                maxWidth: 80,
              }}>
                {statusStreak === 'belum-pernah' && 'Yuk mulai!'}
                {statusStreak === 'berakhir' && 'Streak berakhir'}
                {statusStreak === 'berisiko' && 'Streak beresiko!'}
                {statusStreak === 'aman' && `${progresStreak} hari aman`}
              </span>
            )}
            <span style={{
              fontSize: 11.5,
              color: m.warnaTeks,
              fontWeight: 700,
              textAlign: 'center',
              lineHeight: 1.3,
              letterSpacing: '-0.01em',
            }}>{m.label}</span>
          </button>
        ))}
      </div>

      {/* Quote card */}
      <div style={{
        background: 'white',
        borderRadius: 20,
        padding: 18,
        boxShadow: '0 4px 16px rgba(0,0,0,0.06)',
        borderLeft: '4px solid #FF9E67',
        border: '1px solid #F3F4F6',
        marginBottom: 24,
      }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: '#C2410C', marginBottom: 8 }}>
          Ayo {studentName.split(' ')[0]}, Semangat! 🔥
        </div>
        <p style={{ fontSize: 13, color: '#4B5563', lineHeight: 1.6, margin: 0, fontStyle: 'italic' }}>
          "Tidak pernah ada hari yang sama dalam kehidupan kita. Hari ini berbeda dengan kemarin. Mari kita jadikan hari ini lebih baik."
        </p>
        <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 8, fontWeight: 600 }}>- Susilo Bambang Yudhoyono</div>
      </div>

      {/* Statistik cards dengan warna pastel oranye/ungu */}
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)', gap: isMobile ? 12 : 16, marginBottom: 24 }}>
        {[
          { label: 'Jadwal Hari Ini', value: todaySchedules.length, color: '#FF9E67', bg: '#FFF7ED', icon: '📅' },
          { label: 'Tugas & Kuis', value: tasks.length, color: '#B4B3FF', bg: '#F5F3FF', icon: '📝' },
          { label: 'Notifikasi Baru', value: unreadCount, color: '#FFB88C', bg: '#FFEDD5', icon: '🔔' },
        ].map((stat, i) => (
          <div key={i} className="sd-card" style={{
            background: `linear-gradient(135deg, ${stat.bg} 0%, white 100%)`,
            borderRadius: 24,
            padding: isMobile ? '16px 14px' : '20px 22px',
            transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
            boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
            border: '1px solid rgba(255,255,255,0.8)',
          }}
            onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 8px 20px rgba(0,0,0,0.08)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.05)'; }}
          >
            <div style={{ fontSize: isMobile ? 28 : 36, fontWeight: 900, color: stat.color, lineHeight: 1, marginBottom: 8 }}>{stat.icon}</div>
            <div style={{ fontSize: isMobile ? 28 : 36, fontWeight: 900, color: '#1F2937', lineHeight: 1 }}>
              {dataLoading ? '–' : stat.value}
            </div>
            <div style={{ fontSize: isMobile ? 11 : 12, color: '#6B7280', fontWeight: 600, marginTop: 6, letterSpacing: '-0.01em' }}>{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Survey wajib dengan gradient oranye-merah pastel */}
      {wajibSurveys.map(sv => (
        <div key={sv.id} className="sd-card" style={{
          background: 'linear-gradient(135deg, #FFEDD5 0%, #FEE2E2 100%)', borderRadius: 24, padding: 20, color: '#991B1B',
          marginBottom: 16, display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap',
          boxShadow: '0 6px 20px rgba(255, 158, 103, 0.2)',
          border: '1px solid #FED7AA',
          animation: 'goyangPeringatan 2s ease-in-out infinite',
        }}>
          {sv.coverImage && (
            <img src={sv.coverImage} alt={sv.title} style={{ width: 72, height: 72, borderRadius: 16, objectFit: 'cover', flexShrink: 0, border: '2px solid white', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }} />
          )}
          <div style={{ flex: 1, minWidth: 180 }}>
            <span style={{ fontSize: 10, fontWeight: 800, background: 'rgba(255,255,255,0.6)', color: '#DC2626', padding: '4px 12px', borderRadius: 12 }}>🔴 SURVEI WAJIB</span>
            <h3 style={{ margin: '8px 0 4px', fontSize: 16, fontWeight: 800, color: '#991B1B' }}>{sv.title}</h3>
            <p style={{ margin: 0, fontSize: 12, color: '#7F1D1D', opacity: 0.9 }}>Wajib diisi{sv.deadline ? ` — batas ${new Date(sv.deadline).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}` : ''}.</p>
          </div>
          <button className="sd-survey-btn" onClick={() => navigate('/siswa/survei/' + sv.id)} style={{
            background: 'linear-gradient(135deg, #FF9E67 0%, #FFB88C 100%)', color: 'white', border: 'none', padding: '12px 22px', borderRadius: 14,
            fontWeight: 800, fontSize: 13, cursor: 'pointer', flexShrink: 0,
            transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
            boxShadow: '0 4px 12px rgba(255, 158, 103, 0.35)',
          }}
            onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.05)'; e.currentTarget.style.boxShadow = '0 6px 16px rgba(255, 158, 103, 0.45)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(255, 158, 103, 0.35)'; }}
          >
            Isi Sekarang →
          </button>
        </div>
      ))}

      {/* Survey opsional dengan gaya clean */}
      {visibleOptionalSurveys.map(sv => (
        <div key={sv.id} className="sd-card" style={{
          background: 'white', border: '1px solid #E0E7FF', borderRadius: 20, padding: 16,
          marginBottom: 14, display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap', position: 'relative',
          transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
          boxShadow: '0 4px 12px rgba(0,0,0,0.04)',
        }}
          onMouseEnter={(e) => { e.currentTarget.style.boxShadow = '0 6px 20px rgba(180, 179, 255, 0.2)'; e.currentTarget.style.borderColor = '#B4B3FF'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.04)'; e.currentTarget.style.borderColor = '#E0E7FF'; e.currentTarget.style.transform = 'translateY(0)'; }}
        >
          {sv.coverImage && (
            <img src={sv.coverImage} alt={sv.title} style={{ width: 56, height: 56, borderRadius: 14, objectFit: 'cover', flexShrink: 0, border: '2px solid #F5F3FF' }} />
          )}
          <div style={{ flex: 1, minWidth: 160 }}>
            <span style={{ fontSize: 10, fontWeight: 700, color: '#6366F1', background: '#EEF2FF', padding: '3px 10px', borderRadius: 10 }}>🔵 SURVEI OPSIONAL</span>
            <h4 style={{ margin: '4px 0', fontSize: 14, fontWeight: 700, color: '#1F2937' }}>{sv.title}</h4>
          </div>
          <button className="sd-survey-btn" onClick={() => navigate('/siswa/survei/' + sv.id)} style={{
            background: 'linear-gradient(135deg, #EEF2FF 0%, #E0E7FF 100%)', color: '#4F46E5', border: 'none', padding: '9px 18px', borderRadius: 12,
            fontWeight: 700, fontSize: 12, cursor: 'pointer',
            transition: 'all 0.2s ease',
          }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'linear-gradient(135deg, #E0E7FF 0%, #C7D2FE 100%)'; e.currentTarget.style.transform = 'scale(1.05)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'linear-gradient(135deg, #EEF2FF 0%, #E0E7FF 100%)'; e.currentTarget.style.transform = 'scale(1)'; }}
          >
            Isi
          </button>
          <button onClick={() => dismissOptionalSurvey(sv.id)} style={{
            background: 'none', border: 'none', color: '#9CA3AF', cursor: 'pointer', padding: 6,
            transition: 'all 0.2s ease', borderRadius: 8,
          }}
            onMouseEnter={(e) => { e.currentTarget.style.color = '#EF4444'; e.currentTarget.style.background = '#FEF2F2'; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = '#9CA3AF'; e.currentTarget.style.background = 'transparent'; }}
            title="Tutup"
          >
            <X size={18} />
          </button>
        </div>
      ))}

      {/* Smart Raport card dengan gradient ungu */}
      {raportSummary && (
        <div className="sd-card" onClick={() => navigate('/siswa/smart-rapor')} style={{
          background: 'linear-gradient(135deg, #B4B3FF 0%, #7C7DFF 100%)',
          borderRadius: 24,
          padding: 22,
          color: 'white',
          cursor: 'pointer',
          marginBottom: 20,
          boxShadow: '0 8px 24px rgba(180, 179, 255, 0.35)',
          border: '1px solid rgba(255,255,255,0.3)',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 44, height: 44, borderRadius: 14, background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Trophy size={24} color="#FEF3C7" />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800 }}>📊 Ringkasan Raport</h3>
                <p style={{ margin: '4px 0 0', fontSize: 12, opacity: 0.9 }}>Periode {raportSummary.periode?.replace('-', ' / ')}</p>
              </div>
            </div>
            <ArrowRight size={22} strokeWidth={2.5} />
          </div>
          <div style={{ display: 'flex', gap: 24, marginTop: 18, flexWrap: 'wrap' }}>
            <div style={{ textAlign: 'center', background: 'rgba(255,255,255,0.15)', padding: '12px 20px', borderRadius: 16 }}>
              <div style={{ fontSize: 36, fontWeight: 900, letterSpacing: '-0.02em' }}>{raportSummary.nilaiAkhir ?? '?'}</div>
              <div style={{ fontSize: 11, opacity: 0.9, fontWeight: 600, marginTop: 4 }}>Nilai Akhir</div>
            </div>
            {raportSummary.komponenDipake && (
              <div style={{ textAlign: 'center', borderLeft: '1px solid rgba(255,255,255,0.3)', paddingLeft: 24, background: 'rgba(255,255,255,0.15)', padding: '12px 20px', borderRadius: 16 }}>
                <div style={{ fontSize: 36, fontWeight: 900, letterSpacing: '-0.02em' }}>{raportSummary.komponenDipake.length}/4</div>
                <div style={{ fontSize: 11, opacity: 0.9, fontWeight: 600, marginTop: 4 }}>Komponen Dinilai</div>
              </div>
            )}
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 16 }}>

        <div className="sd-card" style={{ background: 'white', padding: 18, borderRadius: 18, border: '1px solid #eef1f5', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
          <h3 style={{ margin: '0 0 14px', fontSize: 14, fontWeight: 800, color: '#1e293b', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Calendar size={17} color="#0d9488" /> Jadwal Hari Ini
          </h3>
          {dataLoading ? (
            <SkeletonLines count={2} />
          ) : todaySchedules.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 20, color: '#94a3b8', fontSize: 12 }}>📭 Tidak ada jadwal hari ini</div>
          ) : todaySchedules.map((sch, i) => (
            <div key={i} style={{ display: 'flex', gap: 10, padding: '10px 0', borderBottom: i < todaySchedules.length - 1 ? '1px solid #f1f5f9' : 'none' }}>
              <div style={{ minWidth: 48, textAlign: 'center', fontWeight: 700, fontSize: 12, color: '#0d9488' }}>{sch.start}</div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 13, color: '#1e293b' }}>{sch.title || "Kelas"}</div>
                <div style={{ fontSize: 10, color: '#64748b', display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
                  <MapPin size={9} /> {sch.planet || '-'} • <User size={9} /> {sch.teacherName || sch.booker || '-'}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="sd-card" style={{ background: 'white', padding: 18, borderRadius: 18, border: '1px solid #eef1f5', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 14 }}>
            <h3 style={{ margin: 0, fontSize: 14, fontWeight: 800, color: '#1e293b', display: 'flex', alignItems: 'center', gap: 8 }}>
              <ClipboardList size={17} color="#5B2ECC" /> Tugas & Kuis
            </h3>
            <button onClick={() => navigate('/siswa/materi')} style={{ background: 'none', border: 'none', color: '#5B2ECC', fontWeight: 700, fontSize: 11, cursor: 'pointer' }}>
              Lihat Semua →
            </button>
          </div>
          {dataLoading ? (
            <SkeletonLines count={2} />
          ) : tasks.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 20, color: '#94a3b8', fontSize: 12 }}>
              📭 Belum ada tugas atau kuis untuk Anda
            </div>
          ) : tasks.map((task, i) => {
            const hasQuiz = (task.quizData || []).length > 0 || (task.blocks || []).some(b => b.type === 'quiz' && b.quizId);
            const hasAssignment = (task.blocks || []).some(b => b.type === 'assignment');
            const isTargeted = task.sendToSpecificStudents;
            const targetInfo = isTargeted ? '🔒 Khusus' : `${task.targetKelas || 'Semua'} • ${task.targetKategori || 'Semua'}`;

            let deadlineBadge = null;
            if (task.__terlewat) {
              const diffDays = Math.floor((new Date() - task.__deadline) / (24 * 60 * 60 * 1000));
              deadlineBadge = { text: `⚠️ Terlambat ${diffDays} hari`, color: '#dc2626' };
            } else if (task.__deadline) {
              const diffH = Math.floor((task.__deadline - new Date()) / 3600000);
              if (diffH < 24) deadlineBadge = { text: `⏰ ${Math.max(diffH, 0)} jam lagi`, color: '#ef4444' };
              else deadlineBadge = { text: `📅 ${Math.floor(diffH / 24)} hari lagi`, color: '#f59e0b' };
            }

            const upcomingBadge = task.__isUpcoming && task.tanggalMulai
              ? { text: `🔜 Dibuka ${new Date(task.tanggalMulai).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}`, color: '#0891b2' }
              : null;

            return (
              <div
                key={i}
                className="sd-task-item"
                style={{
                  padding: '10px 12px', background: task.__isUpcoming ? '#f0fdfa' : '#f8fafc', borderRadius: 12, marginBottom: 6,
                  borderLeft: `3px solid ${task.__isUpcoming ? '#0891b2' : (hasQuiz ? '#5B2ECC' : '#f59e0b')}`,
                  cursor: task.__isUpcoming ? 'default' : 'pointer', transition: 'filter 0.15s',
                  opacity: task.__isUpcoming ? 0.85 : 1,
                }}
                onClick={() => {
                  if (task.__isUpcoming) return;
                  if (hasQuiz) {
                    const quizBlock = (task.blocks || []).find(b => b.type === 'quiz' && b.quizId);
                    const quizId = quizBlock?.quizId || (task.quizData?.length > 0 ? task.id : null);
                    if (quizId) {
                      navigate(`/siswa/kuis/${quizId}`);
                      return;
                    }
                  }
                  navigate(`/siswa/modul/${task.id}`);
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ fontWeight: 700, fontSize: 13, color: '#1e293b' }}>{task.title}</div>
                  <div style={{ display: 'flex', gap: 4 }}>
                    {hasQuiz && (
                      <span style={{ fontSize: 9, padding: '2px 8px', borderRadius: 10, background: '#5B2ECC', color: 'white', fontWeight: 700 }}>Kuis</span>
                    )}
                    {hasAssignment && !hasQuiz && (
                      <span style={{ fontSize: 9, padding: '2px 8px', borderRadius: 10, background: '#f59e0b', color: 'white', fontWeight: 700 }}>Tugas</span>
                    )}
                  </div>
                </div>
                <div style={{ fontSize: 10, color: '#64748b', display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 2 }}>
                  <span>{task.subject || 'Umum'}</span>
                  <span>•</span>
                  <span>{targetInfo}</span>
                  {hasQuiz && (task.quizData?.length > 0) && <span>• 📝 {task.quizData.length} soal</span>}
                </div>
                {isTargeted && (
                  <div style={{ fontSize: 8, color: '#f59e0b', background: '#fef3c7', padding: '1px 6px', borderRadius: 4, display: 'inline-block', marginTop: 4 }}>
                    🔒 Dikirim khusus
                  </div>
                )}
                {upcomingBadge ? (
                  <div style={{ fontSize: 9, color: upcomingBadge.color, fontWeight: 700, marginTop: 4 }}>
                    {upcomingBadge.text}
                  </div>
                ) : deadlineBadge && (
                  <div style={{ fontSize: 9, color: deadlineBadge.color, fontWeight: 700, marginTop: 4 }}>
                    {deadlineBadge.text}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* KEHADIRAN */}
      <div ref={attendanceRef} className="sd-card" style={{ background: 'white', padding: 18, borderRadius: 18, border: '1px solid #eef1f5', marginTop: 16, boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 14 }}>
          <h3 style={{ margin: 0, fontSize: 14, fontWeight: 800, color: '#1e293b', display: 'flex', alignItems: 'center', gap: 8 }}>
            <ClipboardList size={17} color="#0d9488" /> Kehadiran
          </h3>
          <button onClick={() => navigate('/siswa/absensi')} style={{ background: 'none', border: 'none', color: '#5B2ECC', fontWeight: 700, fontSize: 11, cursor: 'pointer' }}>
            Riwayat Lengkap →
          </button>
        </div>
        {dataLoading ? <SkeletonLines count={2} /> : (
          <AttendanceDonut hadir={attendanceSummary.hadir} izin={attendanceSummary.izin} alpha={attendanceSummary.alpha} total={attendanceSummary.total} />
        )}
      </div>

      {/* Profile card */}
      <div className="sd-card" style={{ background: 'white', padding: 18, borderRadius: 18, border: '1px solid #eef1f5', marginTop: 16, boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <div style={{ width: 44, height: 44, borderRadius: 14, background: 'linear-gradient(135deg,#5B2ECC,#1E3A8A)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 17, flexShrink: 0 }}>
            {studentName?.charAt(0) || 'S'}
          </div>
          <div style={{ flex: 1, minWidth: 120 }}>
            <div style={{ fontWeight: 700, fontSize: 14, color: '#1e293b' }}>{studentName}</div>
            <div style={{ fontSize: 11, color: '#64748b' }}>{studentProfile?.kelasSekolah || studentKelas || '-'} • {studentProfile?.kategori || studentProgram || 'Reguler'}</div>
            {studentNim && <div style={{ fontSize: 9, color: '#94a3b8', fontFamily: 'monospace' }}>ID: {studentNim}</div>}
          </div>
          <button onClick={() => navigate('/siswa/materi')} style={{ padding: '9px 16px', background: '#1E3A8A', color: 'white', border: 'none', borderRadius: 12, fontWeight: 700, fontSize: 11, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5 }}>
            <BookOpen size={14} /> Materi Belajar
          </button>
        </div>
      </div>

      {/* Kartu Identitas Siswa Digital */}
      <div className="sd-card" style={{ background: 'white', padding: 18, borderRadius: 18, border: '1px solid #eef1f5', marginTop: 16, boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
        <h3 style={{ margin: '0 0 14px', fontSize: 14, fontWeight: 800, color: '#1e293b', display: 'flex', alignItems: 'center', gap: 8 }}>
          <IdCard size={17} color="#5B2ECC" /> Kartu Identitas Siswa
        </h3>
        <StudentDigitalCard
          studentId={studentDocId || studentId}
          nama={studentName}
          nim={studentNim}
          student={studentProfile}
          onUpdated={(patch) => setStudentProfile((prev) => ({ ...(prev || {}), ...patch }))}
        />
      </div>

      {isScanning && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 2000, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: 16 }}>
          <div style={{ background: 'white', padding: 20, borderRadius: 20, width: '90%', maxWidth: 400, textAlign: 'center', position: 'relative' }}>
            <button onClick={() => setIsScanning(false)} style={{ position: 'absolute', top: 10, right: 10, background: 'rgba(0,0,0,0.5)', color: 'white', border: 'none', borderRadius: '50%', width: 30, height: 30, cursor: 'pointer' }}><X size={16} /></button>
            <h3>Scan QR Code</h3>
            <p style={{ fontSize: 11, color: '#94a3b8', marginTop: -8 }}>Pastikan QR ini untuk jadwal kelasmu hari ini</p>
            <div id="reader" style={{ width: '100%', borderRadius: 12, overflow: 'hidden' }}></div>
          </div>
        </div>
      )}

      {isMobile && (
        <button onClick={() => setIsScanning(true)} style={{
          position: 'fixed', bottom: 'max(20px, calc(env(safe-area-inset-bottom) + 12px))', right: 20,
          width: 56, height: 56, borderRadius: '50%', background: '#1e293b', color: 'white', border: 'none',
          boxShadow: '0 8px 20px rgba(0,0,0,0.3)', zIndex: 900, cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}><Camera size={22} /></button>
      )}
    </div>
  );
};

export default StudentDashboard;
