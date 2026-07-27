// src/pages/student/StudentDashboard.jsx
import React, { useState, useEffect } from 'react';
import SidebarSiswa from '../../components/SidebarSiswa';
import { db, auth } from '../../firebase';
import { collection, query, getDocs, orderBy, doc, getDoc, setDoc, deleteDoc, addDoc, serverTimestamp, where, limit } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { Html5Qrcode } from "html5-qrcode";
import { useNavigate } from 'react-router-dom';
import { RAPORT_COLLECTIONS } from '../../firebase/raportCollection';

import {
  BookOpen, Calendar, Clock, GraduationCap, Menu, ChevronRight,
  ClipboardList, X, Camera, User, MapPin, Send, CheckCircle,
  Megaphone, TrendingUp, Trophy, ArrowRight, AlertCircle,
  HelpCircle, Zap, Award, Lock, Bell, Download, Paperclip,
  Trash2, FileQuestion, FileText, DollarSign, Sparkles, Inbox
} from 'lucide-react';

// ============================================================
// 🔥 IKON & WARNA PER TIPE NOTIFIKASI
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

const StudentDashboard = () => {
  const navigate = useNavigate();
  const [activeMenu, setActiveMenu] = useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  const [studentName, setStudentName] = useState("");
  const [studentId, setStudentId] = useState(null);
  const [studentProfile, setStudentProfile] = useState(null);
  const [todaySchedules, setTodaySchedules] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [allModuls, setAllModuls] = useState([]);
  const [raportSummary, setRaportSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isScanning, setIsScanning] = useState(false);
  const [authReady, setAuthReady] = useState(false);
  const [authError, setAuthError] = useState(false);
  const [studentKelas, setStudentKelas] = useState('');
  const [studentProgram, setStudentProgram] = useState('');
  const [studentNim, setStudentNim] = useState('');

  // 🔥 NOTIFIKASI — BARU, beneran fungsional (bukan dekoratif)
  const [notifications, setNotifications] = useState([]);
  const [showNotifPanel, setShowNotifPanel] = useState(false);

  // 🔥 SURVEI YANG PERLU DIISI — dipisah wajib vs opsional
  const [wajibSurveys, setWajibSurveys] = useState([]);
  const [optionalSurveys, setOptionalSurveys] = useState([]);
  const [dismissedSurveyIds, setDismissedSurveyIds] = useState(() => {
    try { return JSON.parse(localStorage.getItem('dismissedSurveys') || '[]'); }
    catch { return []; }
  });

  // ============================================================
  // 🔥 HELPER: Format Tanggal
  // ============================================================
  const getSmartDateString = (dateObj) => {
    const year = dateObj.getFullYear();
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const day = String(dateObj.getDate()).padStart(2, '0');
    return year + '-' + month + '-' + day;
  };

  // ============================================================
  // 🔥 CEK AKSES SISWA KE MODUL
  // ============================================================
  const checkStudentAccess = (modul, studentId, studentKelas, studentProgram) => {
    if (modul.sendToSpecificStudents) {
      const studentIds = modul.studentIds || [];
      const selectedStudentIds = (modul.selectedStudents || []).map(s => s.studentId || s.id);
      const allTargetIds = [...studentIds, ...selectedStudentIds];
      return allTargetIds.includes(studentId) || allTargetIds.includes(studentNim);
    }
    const targetKelas = modul.targetKelas || 'Semua';
    const targetKategori = modul.targetKategori || 'Semua';
    const matchKelas = targetKelas === 'Semua' || targetKelas === studentKelas;
    const matchProgram = targetKategori === 'Semua' || targetKategori === studentProgram;
    return matchKelas && matchProgram;
  };

  useEffect(() => {
    const h = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', h);
    return () => window.removeEventListener('resize', h);
  }, []);

  const isMobile = windowWidth <= 768;

  // AUTH CHECK
  useEffect(() => {
    const storedId = localStorage.getItem('studentId');
    const storedName = localStorage.getItem('studentName');
    const isLoggedIn = localStorage.getItem('isSiswaLoggedIn') === 'true';

    if (isLoggedIn && storedId) {
      setStudentId(storedId);
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
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, []);

  // FETCH DATA
  useEffect(() => {
    if (!authReady || !studentId) return;

    const fetchData = async () => {
      try {
        const todayStr = getSmartDateString(new Date());
        const periode = new Date().getFullYear() + '-' + String(new Date().getMonth() + 1).padStart(2, '0');

        // 🔥 AMBIL PROFIL SISWA
        const sSnap = await getDoc(doc(db, "students", studentId)).catch(() => null);
        let kelasVal = '', programVal = 'Reguler', nimVal = studentId;
        if (sSnap?.exists()) {
          const data = sSnap.data();
          setStudentProfile(data);
          kelasVal = data.kelasSekolah || '';
          programVal = data.kategori || 'Reguler';
          nimVal = data.studentId || data.id || studentId;
          setStudentKelas(kelasVal);
          setStudentProgram(programVal);
          setStudentNim(nimVal);
        }

        // 🔥 AMBIL JADWAL HARI INI
        // ============================================================
        // 🔥 FIX PERFORMA BESAR: sebelumnya SEMUA query ini dipanggil
        // satu-satu berurutan (await demi await) — padahal sebagian besar
        // sama sekali gak saling butuh data satu sama lain. Tiap query
        // butuh 1 kali pulang-pergi ke server; kalau dipanggil satu-satu,
        // waktunya NUMPUK (query1 + query2 + query3 + ...). Sekarang semua
        // query yang independen dijalankan BERSAMAAN lewat Promise.all,
        // jadi total waktu tunggu = query yang PALING LAMA doang, bukan
        // jumlah semuanya.
        //
        // Selain itu, query survey_responses sebelumnya menarik SELURUH ISI
        // KOLEKSI tanpa filter apa pun, lalu baru disaring di browser —
        // persis kesalahan yang berkali-kali kita perbaiki di file lain.
        // Beban ini nempel di SETIAP siswa, SETIAP kali buka dashboard, dan
        // makin berat seiring respons survei menumpuk. Sekarang difilter
        // LANGSUNG DI SERVER pakai where() (dicoba beberapa nama field
        // sekaligus secara paralel, karena halaman pengisian survei belum
        // pernah saya lihat kodenya untuk pastikan nama field yang dipakai).
        const [
          schedSnap, modulSnap, raportSnap, notifSnap, surveySnap,
          respByUserId, respByStudentId, respByRespondentId, respByNim,
        ] = await Promise.all([
          getDocs(query(collection(db, "jadwal_bimbel"), where("dateStr", "==", todayStr))).catch(() => ({ docs: [] })),
          getDocs(query(collection(db, "bimbel_modul"), orderBy("updatedAt", "desc"), limit(20))).catch(() => ({ docs: [] })),
          getDocs(query(collection(db, RAPORT_COLLECTIONS.FINAL), where("studentId", "==", studentId), where("periode", "==", periode), limit(1))).catch(() => ({ docs: [] })),
          getDocs(query(collection(db, "notifications"), where("recipientId", "==", nimVal), limit(30))).catch(() => ({ docs: [] })),
          getDocs(query(collection(db, "surveys"), where("status", "==", "aktif"), limit(50))).catch(() => ({ docs: [] })),
          getDocs(query(collection(db, "survey_responses"), where("userId", "==", nimVal))).catch(() => ({ docs: [] })),
          getDocs(query(collection(db, "survey_responses"), where("studentId", "==", nimVal))).catch(() => ({ docs: [] })),
          getDocs(query(collection(db, "survey_responses"), where("respondentId", "==", nimVal))).catch(() => ({ docs: [] })),
          getDocs(query(collection(db, "survey_responses"), where("nim", "==", nimVal))).catch(() => ({ docs: [] })),
        ]);

        // --- Jadwal hari ini ---
        const fetchedSchedules = schedSnap.docs
          .map(d => ({ id: d.id, ...d.data() }))
          .filter(sch => sch.students?.some(s => s.id === studentId || s === studentId || s.studentId === studentId))
          .sort((a, b) => (a.start || '').localeCompare(b.start || ''))
          .slice(0, 5);
        setTodaySchedules(fetchedSchedules);

        // --- Modul & tugas ---
        // 🔥 FIX BUG UTAMA (retroaktif — gak perlu re-save manual): kumpulin
        // semua quizId yang disebut di blocks manapun (artinya kuis itu
        // sudah nempel ke sebuah materi), lalu buang dokumen yang cocok dari
        // listing. Kuis begini aksesnya sepenuhnya ngikut modul induk,
        // gak pernah dievaluasi target-nya sendiri yang bisa basi.
        const rawModulsData = modulSnap.docs.map(d => ({ id: d.id, ...d.data() }));
        const embeddedQuizIds = new Set();
        rawModulsData.forEach(m => {
          (m.blocks || []).forEach(b => {
            if (b.type === 'quiz' && b.quizId) embeddedQuizIds.add(b.quizId);
          });
        });
        const allModulsData = rawModulsData.filter(m => !embeddedQuizIds.has(m.id) && !m.parentModulId);
        setAllModuls(allModulsData);

        const accessibleModuls = allModulsData.filter(modul => {
          if (modul.status === 'arsip') return false;
          return checkStudentAccess(modul, studentId, kelasVal, programVal);
        });

        const fetchedTasks = accessibleModuls
          .filter(m => {
            const hasQuiz = (m.quizData || []).length > 0;
            const hasAssignment = (m.blocks || []).some(b => b.type === 'assignment');
            return hasQuiz || hasAssignment;
          })
          .slice(0, 3);
        setTasks(fetchedTasks);

        // --- Raport ---
        if (!raportSnap.empty) {
          const data = raportSnap.docs[0].data();
          setRaportSummary({
            nilaiAkhir: data.nilai_akhir,
            komponenDipake: data.komponen_dipakai || [],
            periode: periode
          });
        }

        // --- Notifikasi ---
        const notifList = notifSnap.docs
          .map(d => ({ id: d.id, ...d.data() }))
          .sort((a, b) => (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0));
        setNotifications(notifList);

        // --- Survei yang belum diisi ---
        const activeSurveys = surveySnap.docs.map(d => ({ id: d.id, ...d.data() }));
        const respondedIds = new Set(
          [respByUserId, respByStudentId, respByRespondentId, respByNim]
            .flatMap(snap => snap.docs)
            .map(d => d.data().surveyId)
        );

        const relevantSurveys = activeSurveys.filter(sv => {
          if (respondedIds.has(sv.id)) return false;
          if (sv.targetType === 'semua_guru') return false;
          if (sv.deadline && new Date(sv.deadline) < new Date()) return false;
          if (sv.targetType === 'jenjang') {
            return !sv.targetKelas || sv.targetKelas === 'Semua' || sv.targetKelas === kelasVal;
          }
          return true; // semua_siswa / semua
        });

        setWajibSurveys(relevantSurveys.filter(sv => sv.isRequired));
        setOptionalSurveys(relevantSurveys.filter(sv => !sv.isRequired));

      } catch (err) { console.error('Error:', err); }
      finally { setLoading(false); }
    };

    fetchData();
  }, [authReady, studentId]);

  // ============================================================
  // 🔥 AKSI NOTIFIKASI
  // ============================================================
  const markNotifRead = async (notif) => {
    if (!notif.isRead) {
      setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, isRead: true } : n));
      try { await setDoc(doc(db, "notifications", notif.id), { isRead: true }, { merge: true }); } catch (e) {}
    }
    if (notif.link) navigate(notif.link);
    setShowNotifPanel(false);
  };

  const deleteNotification = async (e, notifId) => {
    e.stopPropagation();
    setNotifications(prev => prev.filter(n => n.id !== notifId));
    try { await deleteDoc(doc(db, "notifications", notifId)); } catch (e) {}
  };

  const dismissOptionalSurvey = (surveyId) => {
    const next = [...dismissedSurveyIds, surveyId];
    setDismissedSurveyIds(next);
    localStorage.setItem('dismissedSurveys', JSON.stringify(next));
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;
  const visibleOptionalSurveys = optionalSurveys.filter(sv => !dismissedSurveyIds.includes(sv.id));

  // ============================================================
  // 🔥 QR SCANNER — FIX BUG KEAMANAN PENTING
  // ============================================================
  useEffect(() => {
    let qr = null;
    if (!isScanning || !studentId) return;

    const start = async () => {
      try {
        qr = new Html5Qrcode("reader");
        await qr.start(
          { facingMode: "environment" },
          { fps: 10, qrbox: { width: 250, height: 250 } },
          async (text) => {
            try {
              const d = JSON.parse(text);
              if (d.type !== "ABSENSI_BIMBEL") return;

              // 🔥 FIX BUG KEAMANAN: sebelumnya di sini TIDAK ADA pengecekan
              // sama sekali apakah scheduleId di QR itu benar-benar salah satu
              // jadwal siswa ini hari ini. Akibatnya siswa yang jadwalnya
              // Bahasa Indonesia tetap bisa absen pakai QR kelas Matematika
              // (atau kelas siapa saja), asal QR-nya valid formatnya.
              // Sekarang dicocokkan dulu ke `todaySchedules` yang sudah
              // diambil di atas — kalau scheduleId di QR tidak ada dalam
              // jadwal siswa hari ini, absen DITOLAK.
              const matchedSchedule = todaySchedules.find(sch => sch.id === d.scheduleId);
              if (!matchedSchedule) {
                alert('❌ QR ini bukan untuk jadwal kelasmu hari ini. Absen tidak tercatat.\n\nKalau ini keliru, hubungi tentor/admin.');
                return;
              }

              const today = getSmartDateString(new Date());
              await setDoc(doc(db, "attendance", studentId + '_' + today + '_' + (d.scheduleId || '')), {
                studentId, studentName, teacherName: d.teacher, date: today,
                tanggal: today, timestamp: serverTimestamp(), status: "Hadir",
                mapel: d.mapel, scheduleId: d.scheduleId || '', keterangan: "Scan QR"
              }, { merge: true });
              alert('✅ Absen: ' + d.mapel);
              stop();
            } catch (e) {}
          },
          (err) => {}
        );
      } catch (e) {}
    };
    const stop = async () => {
      if (qr && qr.isScanning) { try { await qr.stop(); qr.clear(); } catch (e) {} }
      setIsScanning(false);
    };
    start();
    return () => { if (qr) stop(); };
  }, [isScanning, studentId, todaySchedules, studentName]);

  // Auth error
  if (authError) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#f8fafc', flexDirection: 'column', gap: 16 }}>
        <AlertCircle size={48} color="#ef4444" />
        <h3 style={{ color: '#1e293b' }}>Sesi Berakhir</h3>
        <p style={{ color: '#64748b', fontSize: 14 }}>Silakan login kembali</p>
        <button onClick={() => { localStorage.clear(); navigate('/login-siswa'); }} style={{ padding: '10px 20px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: 8, fontWeight: 700, cursor: 'pointer' }}>
          Login
        </button>
      </div>
    );
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#f8fafc' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: 40, height: 40, border: '3px solid #e2e8f0', borderTop: '3px solid #3b82f6', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 12px' }} />
          <p style={{ color: '#64748b', fontSize: 13 }}>Memuat...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f8fafc' }}>
      <SidebarSiswa activeMenu={activeMenu} setActiveMenu={setActiveMenu} isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />
      {isMobile && <button onClick={() => setIsSidebarOpen(true)} style={{ position: 'fixed', top: 15, left: 15, zIndex: 900, background: '#1e293b', color: 'white', border: 'none', padding: 10, borderRadius: 10, cursor: 'pointer' }}><Menu size={24} /></button>}

      <div style={{ marginLeft: isMobile ? 0 : 260, padding: isMobile ? '15px' : '30px', width: isMobile ? '100%' : 'calc(100% - 260px)', boxSizing: 'border-box', paddingTop: isMobile ? 60 : 30 }}>

        {/* HEADER */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexDirection: isMobile ? 'column' : 'row', gap: 10 }}>
          <div>
            <h1 style={{ margin: 0, fontSize: isMobile ? 20 : 26, fontWeight: 800, color: '#1e293b' }}>Halo, {studentName}! 👋</h1>
            <p style={{ color: '#64748b', marginTop: 4, fontSize: 13 }}>
              {studentProfile ? (studentProfile.kategori || 'Reguler') + ' - Kelas ' + (studentProfile.kelasSekolah || '-') : ''}
              {studentNim && <span style={{ marginLeft: 8, fontSize: 10, background: '#f1f5f9', padding: '2px 8px', borderRadius: 4 }}>🆔 {studentNim}</span>}
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, position: 'relative' }}>
            {/* 🔥 LONCENG NOTIFIKASI — BARU, beneran fungsional */}
            <button
              onClick={() => setShowNotifPanel(v => !v)}
              style={{
                position: 'relative', width: 42, height: 42, borderRadius: '50%',
                background: 'white', border: '1px solid #e2e8f0', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#475569',
              }}
            >
              <Bell size={18} />
              {unreadCount > 0 && (
                <span style={{
                  position: 'absolute', top: -2, right: -2, background: '#ef4444', color: 'white',
                  fontSize: 9, fontWeight: 800, minWidth: 16, height: 16, borderRadius: 8,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 3px',
                }}>
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {showNotifPanel && (
              <>
                <div onClick={() => setShowNotifPanel(false)} style={{ position: 'fixed', inset: 0, zIndex: 998 }} />
                <div style={{
                  position: 'absolute', top: 50, right: 0, width: isMobile ? 300 : 360, maxHeight: 440,
                  background: 'white', borderRadius: 14, boxShadow: '0 12px 32px rgba(0,0,0,0.18)',
                  border: '1px solid #e2e8f0', zIndex: 999, overflow: 'hidden', display: 'flex', flexDirection: 'column',
                }}>
                  <div style={{ padding: '12px 16px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: 800, fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}><Inbox size={15} /> Kotak Masuk</span>
                    {unreadCount > 0 && <span style={{ fontSize: 10, color: '#94a3b8' }}>{unreadCount} belum dibaca</span>}
                  </div>
                  <div style={{ overflowY: 'auto', flex: 1 }}>
                    {notifications.length === 0 ? (
                      <div style={{ padding: 30, textAlign: 'center', color: '#94a3b8', fontSize: 12 }}>
                        <Inbox size={28} style={{ marginBottom: 6, opacity: 0.4 }} /><br />Belum ada notifikasi
                      </div>
                    ) : notifications.map(notif => {
                      const meta = NOTIF_META[notif.type] || NOTIF_META.pengumuman;
                      return (
                        <div
                          key={notif.id}
                          onClick={() => markNotifRead(notif)}
                          style={{
                            display: 'flex', gap: 10, padding: '12px 16px', cursor: 'pointer',
                            borderBottom: '1px solid #f8fafc', background: notif.isRead ? 'white' : '#f8fafc',
                          }}
                        >
                          <div style={{ width: 32, height: 32, borderRadius: 8, background: meta.bg, color: meta.color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            {meta.icon}
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 6 }}>
                              <span style={{ fontSize: 12, fontWeight: notif.isRead ? 600 : 800, color: '#1e293b' }}>{notif.title}</span>
                              {!notif.isRead && <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#3b82f6', flexShrink: 0, marginTop: 4 }} />}
                            </div>
                            <p style={{ margin: '2px 0 0', fontSize: 11, color: '#64748b', lineHeight: 1.4 }}>{notif.message}</p>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 5 }}>
                              <span style={{ fontSize: 9, color: '#94a3b8' }}>{timeAgo(notif.createdAt)}</span>
                              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                                {notif.fileUrl && (
                                  <a href={notif.fileUrl} target="_blank" rel="noreferrer" onClick={e => e.stopPropagation()} style={{ fontSize: 9, color: '#3b82f6', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 2 }}>
                                    <Download size={10} /> Unduh
                                  </a>
                                )}
                                <button onClick={(e) => deleteNotification(e, notif.id)} style={{ background: 'none', border: 'none', color: '#cbd5e1', cursor: 'pointer', display: 'flex' }}>
                                  <Trash2 size={12} />
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </>
            )}

            {!isMobile && (
              <button onClick={() => setIsScanning(true)} style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#3b82f6', color: 'white', border: 'none', padding: '10px 18px', borderRadius: 100, fontWeight: 'bold', cursor: 'pointer' }}>
                <Camera size={18} /> SCAN ABSEN
              </button>
            )}
          </div>
        </div>

        {/* 🔥 BANNER SURVEI WAJIB — dipindah ke bagian paling penting/atas,
            gak bisa hilang permanen (cuma bisa ditutup sementara untuk sesi
            ini, tetap muncul lagi di kunjungan berikutnya selama belum diisi) */}
        {wajibSurveys.map(sv => (
          <div key={sv.id} style={{
            background: 'linear-gradient(135deg, #f59e0b, #dc2626)', borderRadius: 16, padding: 18, color: 'white',
            marginBottom: 14, display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap',
            boxShadow: '0 8px 20px rgba(220,38,38,0.25)',
          }}>
            {sv.coverImage && (
              <img src={sv.coverImage} alt={sv.title} style={{ width: 70, height: 70, borderRadius: 12, objectFit: 'cover', flexShrink: 0 }} />
            )}
            <div style={{ flex: 1, minWidth: 180 }}>
              <span style={{ fontSize: 9, fontWeight: 800, background: 'rgba(255,255,255,0.25)', padding: '2px 8px', borderRadius: 10 }}>🔴 SURVEI WAJIB</span>
              <h3 style={{ margin: '6px 0 2px', fontSize: 16, fontWeight: 800 }}>{sv.title}</h3>
              <p style={{ margin: 0, fontSize: 11, opacity: 0.9 }}>Wajib diisi sebelum mengakses fitur lain lebih lanjut{sv.deadline ? ` — batas ${new Date(sv.deadline).toLocaleDateString('id-ID')}` : ''}.</p>
            </div>
            <button onClick={() => navigate('/siswa/survei/' + sv.id)} style={{ background: 'white', color: '#dc2626', border: 'none', padding: '10px 18px', borderRadius: 10, fontWeight: 800, fontSize: 12, cursor: 'pointer', flexShrink: 0 }}>
              Isi Sekarang →
            </button>
          </div>
        ))}

        {/* 🔥 BANNER SURVEI OPSIONAL — bisa ditutup (X), diingat lewat
            localStorage supaya gak muncul lagi setelah ditutup. */}
        {visibleOptionalSurveys.map(sv => (
          <div key={sv.id} style={{
            background: 'white', border: '1px solid #bae6fd', borderRadius: 14, padding: 14,
            marginBottom: 12, display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', position: 'relative',
          }}>
            {sv.coverImage && (
              <img src={sv.coverImage} alt={sv.title} style={{ width: 50, height: 50, borderRadius: 10, objectFit: 'cover', flexShrink: 0 }} />
            )}
            <div style={{ flex: 1, minWidth: 160 }}>
              <span style={{ fontSize: 9, fontWeight: 700, color: '#0891b2' }}>🔵 SURVEI OPSIONAL</span>
              <h4 style={{ margin: '2px 0', fontSize: 13, fontWeight: 700, color: '#1e293b' }}>{sv.title}</h4>
            </div>
            <button onClick={() => navigate('/siswa/survei/' + sv.id)} style={{ background: '#ecfeff', color: '#0891b2', border: 'none', padding: '7px 14px', borderRadius: 8, fontWeight: 700, fontSize: 11, cursor: 'pointer' }}>
              Isi
            </button>
            <button onClick={() => dismissOptionalSurvey(sv.id)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: 4 }} title="Tutup, gak akan muncul lagi">
              <X size={16} />
            </button>
          </div>
        ))}

        {/* RINGKASAN RAPORT */}
        {raportSummary && (
          <div onClick={() => navigate('/siswa/smart-rapor')} style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', borderRadius: 16, padding: 20, color: 'white', cursor: 'pointer', marginBottom: 16, transition: 'transform 0.2s' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Trophy size={28} color="#fbbf24" />
                <div>
                  <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800 }}>📊 Ringkasan Raport</h3>
                  <p style={{ margin: '4px 0 0', fontSize: 11, opacity: 0.85 }}>Periode {raportSummary.periode?.replace('-', ' / ')}</p>
                </div>
              </div>
              <ArrowRight size={20} />
            </div>
            <div style={{ display: 'flex', gap: 20, marginTop: 16, flexWrap: 'wrap' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 32, fontWeight: 900 }}>{raportSummary.nilaiAkhir ?? '?'}</div>
                <div style={{ fontSize: 10, opacity: 0.8 }}>Nilai Akhir</div>
              </div>
              {raportSummary.komponenDipake && (
                <div style={{ textAlign: 'center', borderLeft: '1px solid rgba(255,255,255,0.3)', paddingLeft: 20 }}>
                  <div style={{ fontSize: 32, fontWeight: 900 }}>{raportSummary.komponenDipake.length}/4</div>
                  <div style={{ fontSize: 10, opacity: 0.8 }}>Komponen Dinilai</div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* GRID UTAMA */}
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 16 }}>

          {/* JADWAL HARI INI */}
          <div style={{ background: 'white', padding: 18, borderRadius: 14, border: '1px solid #e2e8f0' }}>
            <h3 style={{ margin: '0 0 14px', fontSize: 15, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}><Calendar size={18} color="#3b82f6" /> Jadwal Hari Ini</h3>
            {todaySchedules.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 20, color: '#94a3b8', fontSize: 12 }}>📭 Tidak ada jadwal hari ini</div>
            ) : todaySchedules.map((sch, i) => (
              <div key={i} style={{ display: 'flex', gap: 10, padding: '10px 0', borderBottom: '1px solid #f1f5f9' }}>
                <div style={{ minWidth: 50, textAlign: 'center', fontWeight: 700, fontSize: 12 }}>{sch.start}</div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 13 }}>{sch.title || "Kelas"}</div>
                  <div style={{ fontSize: 10, color: '#64748b' }}><MapPin size={9} /> {sch.planet || '-'} • <User size={9} /> {sch.teacherName || sch.booker || '-'}</div>
                </div>
              </div>
            ))}
          </div>

          {/* TUGAS & KUIS */}
          <div style={{ background: 'white', padding: 18, borderRadius: 14, border: '1px solid #e2e8f0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 14 }}>
              <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
                <ClipboardList size={18} color="#9b59b6" /> Tugas & Kuis
              </h3>
              <button
                onClick={() => navigate('/siswa/materi')}
                style={{ background: 'none', border: 'none', color: '#3b82f6', fontWeight: 600, fontSize: 11, cursor: 'pointer' }}
              >
                Lihat Semua →
              </button>
            </div>
            {tasks.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 20, color: '#94a3b8', fontSize: 12 }}>
                📭 Belum ada tugas atau kuis untuk Anda
              </div>
            ) : tasks.map((task, i) => {
              const hasQuiz = (task.quizData || []).length > 0;
              const hasAssignment = (task.blocks || []).some(b => b.type === 'assignment');
              const isTargeted = task.sendToSpecificStudents;
              const targetInfo = isTargeted ? '🔒 Khusus' : `${task.targetKelas || 'Semua'} • ${task.targetKategori || 'Semua'}`;

              return (
                <div
                  key={i}
                  style={{
                    padding: '10px 12px',
                    background: '#f8fafc',
                    borderRadius: 8,
                    marginBottom: 6,
                    borderLeft: `3px solid ${hasQuiz ? '#673ab7' : '#f59e0b'}`,
                    cursor: 'pointer',
                    transition: '0.2s'
                  }}
                  onClick={() => {
                    localStorage.setItem('selectedModuleId', task.id);
                    navigate('/siswa/materi');
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ fontWeight: 700, fontSize: 13 }}>{task.title}</div>
                    {hasQuiz && (
                      <span style={{
                        fontSize: 9,
                        padding: '2px 8px',
                        borderRadius: 10,
                        background: '#673ab7',
                        color: 'white',
                        fontWeight: 700
                      }}>
                        Kuis
                      </span>
                    )}
                    {hasAssignment && !hasQuiz && (
                      <span style={{
                        fontSize: 9,
                        padding: '2px 8px',
                        borderRadius: 10,
                        background: '#f59e0b',
                        color: 'white',
                        fontWeight: 700
                      }}>
                        Tugas
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: 10, color: '#64748b', display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 2 }}>
                    <span>{task.subject || 'Umum'}</span>
                    <span>•</span>
                    <span>{targetInfo}</span>
                    {hasQuiz && <span>• 📝 {task.quizData.length} soal</span>}
                  </div>
                  {isTargeted && (
                    <div style={{
                      fontSize: 8,
                      color: '#f59e0b',
                      background: '#fef3c7',
                      padding: '1px 6px',
                      borderRadius: 4,
                      display: 'inline-block',
                      marginTop: 2
                    }}>
                      🔒 Dikirim khusus
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* PROFIL */}
        <div style={{ background: 'white', padding: 18, borderRadius: 14, border: '1px solid #e2e8f0', marginTop: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 45, height: 45, borderRadius: '50%', background: '#3b82f6', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: 18 }}>{studentName?.charAt(0) || 'S'}</div>
            <div>
              <div style={{ fontWeight: 'bold', fontSize: 14 }}>{studentName}</div>
              <div style={{ fontSize: 11, color: '#64748b' }}>{studentProfile?.kelasSekolah || '-'} • {studentProfile?.kategori || 'Reguler'}</div>
              {studentNim && <div style={{ fontSize: 9, color: '#94a3b8', fontFamily: 'monospace' }}>ID: {studentNim}</div>}
            </div>
            <button onClick={() => navigate('/siswa/materi')} style={{ marginLeft: 'auto', padding: '8px 14px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: 8, fontWeight: 600, fontSize: 11, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
              <BookOpen size={14} /> Materi Belajar
            </button>
          </div>
        </div>
      </div>

      {isMobile && isSidebarOpen && <div onClick={() => setIsSidebarOpen(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 998 }} />}

      {/* QR SCANNER MODAL */}
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

      {isMobile && <button onClick={() => setIsScanning(true)} style={{ position: 'fixed', bottom: 20, right: 20, width: 56, height: 56, borderRadius: '50%', background: '#3b82f6', color: 'white', border: 'none', boxShadow: '0 5px 15px rgba(0,0,0,0.3)', zIndex: 900, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Camera size={22} /></button>}
    </div>
  );
};

export default StudentDashboard;