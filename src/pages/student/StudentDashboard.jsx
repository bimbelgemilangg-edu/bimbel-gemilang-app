// src/pages/student/StudentDashboard.jsx
import React, { useState, useEffect } from 'react';
import SidebarSiswa from '../../components/SidebarSiswa';
import { db, auth } from '../../firebase';
import { collection, query, getDocs, orderBy, doc, getDoc, setDoc, addDoc, serverTimestamp, where, limit } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { Html5Qrcode } from "html5-qrcode";
import { useNavigate } from 'react-router-dom';
import { RAPORT_COLLECTIONS } from '../../firebase/raportCollection';

import { 
  BookOpen, Calendar, Clock, GraduationCap, Menu, ChevronRight, 
  ClipboardList, X, Camera, User, MapPin, Send, CheckCircle, 
  Megaphone, TrendingUp, Trophy, ArrowRight, AlertCircle, 
  HelpCircle, Zap, Award, Lock
} from 'lucide-react';

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
    // 1. Cek jika modul dikirim ke siswa tertentu
    if (modul.sendToSpecificStudents) {
      const studentIds = modul.studentIds || [];
      const selectedStudentIds = (modul.selectedStudents || []).map(s => s.studentId || s.id);
      const allTargetIds = [...studentIds, ...selectedStudentIds];
      
      return allTargetIds.includes(studentId) || allTargetIds.includes(studentNim);
    }
    
    // 2. Cek berdasarkan kelas dan program
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
        if (sSnap?.exists()) {
          const data = sSnap.data();
          setStudentProfile(data);
          setStudentKelas(data.kelasSekolah || '');
          setStudentProgram(data.kategori || 'Reguler');
          setStudentNim(data.studentId || data.id || studentId);
        }
        
        // 🔥 AMBIL JADWAL HARI INI
        const schedSnap = await getDocs(
          query(collection(db, "jadwal_bimbel"), where("dateStr", "==", todayStr))
        ).catch(() => ({ docs: [] }));
        
        const fetchedSchedules = schedSnap.docs
          .map(d => ({ id: d.id, ...d.data() }))
          .filter(sch => sch.students?.some(s => s.id === studentId || s === studentId || s.studentId === studentId))
          .sort((a, b) => (a.start || '').localeCompare(b.start || ''))
          .slice(0, 5);
        setTodaySchedules(fetchedSchedules);
        
        // 🔥 AMBIL SEMUA MODUL
        const modulSnap = await getDocs(
          query(collection(db, "bimbel_modul"), orderBy("updatedAt", "desc"), limit(20))
        ).catch(() => ({ docs: [] }));
        
        const allModulsData = modulSnap.docs.map(d => ({ id: d.id, ...d.data() }));
        setAllModuls(allModulsData);
        
        // 🔥 FILTER MODUL YANG BISA DIAKSES SISWA
        const studentIdVal = studentId;
        const kelasVal = studentKelas || localStorage.getItem('studentKelas') || '';
        const programVal = studentProgram || localStorage.getItem('studentProgram') || 'Reguler';
        
        const accessibleModuls = allModulsData.filter(modul => {
          // Skip modul yang statusnya arsip
          if (modul.status === 'arsip') return false;
          
          // Cek akses
          return checkStudentAccess(modul, studentIdVal, kelasVal, programVal);
        });
        
        // 🔥 AMBIL TUGAS & KUIS YANG BISA DIAKSES
        const fetchedTasks = accessibleModuls
          .filter(m => {
            // Tampilkan jika ada quiz atau assignment
            const hasQuiz = (m.quizData || []).length > 0;
            const hasAssignment = (m.blocks || []).some(b => b.type === 'assignment');
            return hasQuiz || hasAssignment;
          })
          .slice(0, 3);
        setTasks(fetchedTasks);
        
        // 🔥 AMBIL RAPORT
        const raportSnap = await getDocs(
          query(collection(db, RAPORT_COLLECTIONS.FINAL), where("studentId", "==", studentId), where("periode", "==", periode), limit(1))
        ).catch(() => ({ docs: [] }));
        
        if (!raportSnap.empty) {
          const data = raportSnap.docs[0].data();
          setRaportSummary({
            nilaiAkhir: data.nilai_akhir,
            komponenDipake: data.komponen_dipakai || [],
            periode: periode
          });
        }
        
      } catch (err) { console.error('Error:', err); } 
      finally { setLoading(false); }
    };
    
    fetchData();
  }, [authReady, studentId]);

  // QR SCANNER
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
              if (d.type === "ABSENSI_BIMBEL") {
                const today = getSmartDateString(new Date());
                await setDoc(doc(db, "attendance", studentId + '_' + today + '_' + (d.scheduleId || '')), {
                  studentId, studentName, teacherName: d.teacher, date: today,
                  tanggal: today, timestamp: serverTimestamp(), status: "Hadir",
                  mapel: d.mapel, scheduleId: d.scheduleId || '', keterangan: "Scan QR"
                }, { merge: true });
                alert('✅ Absen: ' + d.mapel);
                stop();
              }
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
  }, [isScanning, studentId]);

  // Auth error
  if (authError) {
    return (
      <div style={{ display:'flex', justifyContent:'center', alignItems:'center', height:'100vh', background:'#f8fafc', flexDirection:'column', gap:16 }}>
        <AlertCircle size={48} color="#ef4444" />
        <h3 style={{color:'#1e293b'}}>Sesi Berakhir</h3>
        <p style={{color:'#64748b', fontSize:14}}>Silakan login kembali</p>
        <button onClick={() => { localStorage.clear(); navigate('/login-siswa'); }} style={{ padding:'10px 20px', background:'#3b82f6', color:'white', border:'none', borderRadius:8, fontWeight:700, cursor:'pointer' }}>
          Login
        </button>
      </div>
    );
  }

  if (loading) {
    return (
      <div style={{ display:'flex', justifyContent:'center', alignItems:'center', height:'100vh', background:'#f8fafc' }}>
        <div style={{ textAlign:'center' }}>
          <div style={{ width:40, height:40, border:'3px solid #e2e8f0', borderTop:'3px solid #3b82f6', borderRadius:'50%', animation:'spin 0.8s linear infinite', margin:'0 auto 12px' }} />
          <p style={{ color:'#64748b', fontSize:13 }}>Memuat...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display:'flex', minHeight:'100vh', background:'#f8fafc' }}>
      <SidebarSiswa activeMenu={activeMenu} setActiveMenu={setActiveMenu} isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />
      {isMobile && <button onClick={() => setIsSidebarOpen(true)} style={{ position:'fixed', top:15, left:15, zIndex:900, background:'#1e293b', color:'white', border:'none', padding:10, borderRadius:10, cursor:'pointer' }}><Menu size={24} /></button>}
      
      <div style={{ marginLeft: isMobile ? 0 : 260, padding: isMobile ? '15px' : '30px', width: isMobile ? '100%' : 'calc(100% - 260px)', boxSizing:'border-box', paddingTop: isMobile ? 60 : 30 }}>
        
        {/* HEADER */}
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20, flexDirection: isMobile ? 'column' : 'row', gap:10 }}>
          <div>
            <h1 style={{ margin:0, fontSize: isMobile ? 20 : 26, fontWeight:800, color:'#1e293b' }}>Halo, {studentName}! 👋</h1>
            <p style={{ color:'#64748b', marginTop:4, fontSize:13 }}>
              {studentProfile ? (studentProfile.kategori || 'Reguler') + ' - Kelas ' + (studentProfile.kelasSekolah || '-') : ''}
              {studentNim && <span style={{ marginLeft:8, fontSize:10, background:'#f1f5f9', padding:'2px 8px', borderRadius:4 }}>🆔 {studentNim}</span>}
            </p>
          </div>
          {!isMobile && (
            <button onClick={() => setIsScanning(true)} style={{ display:'flex', alignItems:'center', gap:8, background:'#3b82f6', color:'white', border:'none', padding:'10px 18px', borderRadius:100, fontWeight:'bold', cursor:'pointer' }}>
              <Camera size={18} /> SCAN ABSEN
            </button>
          )}
        </div>

        {/* RINGKASAN RAPORT */}
        {raportSummary && (
          <div onClick={() => navigate('/siswa/smart-rapor')} style={{ background:'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', borderRadius:16, padding:20, color:'white', cursor:'pointer', marginBottom:16, transition:'transform 0.2s' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                <Trophy size={28} color="#fbbf24" />
                <div>
                  <h3 style={{ margin:0, fontSize:16, fontWeight:800 }}>📊 Ringkasan Raport</h3>
                  <p style={{ margin:'4px 0 0', fontSize:11, opacity:0.85 }}>Periode {raportSummary.periode?.replace('-', ' / ')}</p>
                </div>
              </div>
              <ArrowRight size={20} />
            </div>
            <div style={{ display:'flex', gap:20, marginTop:16, flexWrap:'wrap' }}>
              <div style={{ textAlign:'center' }}>
                <div style={{ fontSize:32, fontWeight:900 }}>{raportSummary.nilaiAkhir ?? '?'}</div>
                <div style={{ fontSize:10, opacity:0.8 }}>Nilai Akhir</div>
              </div>
              {raportSummary.komponenDipake && (
                <div style={{ textAlign:'center', borderLeft:'1px solid rgba(255,255,255,0.3)', paddingLeft:20 }}>
                  <div style={{ fontSize:32, fontWeight:900 }}>{raportSummary.komponenDipake.length}/4</div>
                  <div style={{ fontSize:10, opacity:0.8 }}>Komponen Dinilai</div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* GRID UTAMA */}
        <div style={{ display:'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap:16 }}>
          
          {/* JADWAL HARI INI */}
          <div style={{ background:'white', padding:18, borderRadius:14, border:'1px solid #e2e8f0' }}>
            <h3 style={{ margin:'0 0 14px', fontSize:15, fontWeight:700, display:'flex', alignItems:'center', gap:8 }}><Calendar size={18} color="#3b82f6" /> Jadwal Hari Ini</h3>
            {todaySchedules.length === 0 ? (
              <div style={{ textAlign:'center', padding:20, color:'#94a3b8', fontSize:12 }}>📭 Tidak ada jadwal hari ini</div>
            ) : todaySchedules.map((sch, i) => (
              <div key={i} style={{ display:'flex', gap:10, padding:'10px 0', borderBottom:'1px solid #f1f5f9' }}>
                <div style={{ minWidth:50, textAlign:'center', fontWeight:700, fontSize:12 }}>{sch.start}</div>
                <div>
                  <div style={{ fontWeight:700, fontSize:13 }}>{sch.title || "Kelas"}</div>
                  <div style={{ fontSize:10, color:'#64748b' }}><MapPin size={9} /> {sch.planet || '-'} • <User size={9} /> {sch.teacherName || sch.booker || '-'}</div>
                </div>
              </div>
            ))}
          </div>

          {/* 🔥 TUGAS & KUIS - HANYA YANG DITUJUKAN */}
          <div style={{ background:'white', padding:18, borderRadius:14, border:'1px solid #e2e8f0' }}>
            <div style={{ display:'flex', justifyContent:'space-between', marginBottom:14 }}>
              <h3 style={{ margin:0, fontSize:15, fontWeight:700, display:'flex', alignItems:'center', gap:8 }}>
                <ClipboardList size={18} color="#9b59b6" /> Tugas & Kuis
              </h3>
              <button 
                onClick={() => navigate('/siswa/materi')} 
                style={{ background:'none', border:'none', color:'#3b82f6', fontWeight:600, fontSize:11, cursor:'pointer' }}
              >
                Lihat Semua →
              </button>
            </div>
            {tasks.length === 0 ? (
              <div style={{ textAlign:'center', padding:20, color:'#94a3b8', fontSize:12 }}>
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
        <div style={{ background:'white', padding:18, borderRadius:14, border:'1px solid #e2e8f0', marginTop:16 }}>
          <div style={{ display:'flex', alignItems:'center', gap:12 }}>
            <div style={{ width:45, height:45, borderRadius:'50%', background:'#3b82f6', color:'white', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:'bold', fontSize:18 }}>{studentName?.charAt(0) || 'S'}</div>
            <div>
              <div style={{ fontWeight:'bold', fontSize:14 }}>{studentName}</div>
              <div style={{ fontSize:11, color:'#64748b' }}>{studentProfile?.kelasSekolah || '-'} • {studentProfile?.kategori || 'Reguler'}</div>
              {studentNim && <div style={{ fontSize:9, color:'#94a3b8', fontFamily:'monospace' }}>ID: {studentNim}</div>}
            </div>
            <button onClick={() => navigate('/siswa/materi')} style={{ marginLeft:'auto', padding:'8px 14px', background:'#3b82f6', color:'white', border:'none', borderRadius:8, fontWeight:600, fontSize:11, cursor:'pointer', display:'flex', alignItems:'center', gap:4 }}>
              <BookOpen size={14} /> Materi Belajar
            </button>
          </div>
        </div>
      </div>

      {isMobile && isSidebarOpen && <div onClick={() => setIsSidebarOpen(false)} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', zIndex:998 }} />}

      {/* QR SCANNER MODAL */}
      {isScanning && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.8)', zIndex:2000, display:'flex', justifyContent:'center', alignItems:'center', padding:16 }}>
          <div style={{ background:'white', padding:20, borderRadius:20, width:'90%', maxWidth:400, textAlign:'center', position:'relative' }}>
            <button onClick={() => setIsScanning(false)} style={{ position:'absolute', top:10, right:10, background:'rgba(0,0,0,0.5)', color:'white', border:'none', borderRadius:'50%', width:30, height:30, cursor:'pointer' }}><X size={16}/></button>
            <h3>Scan QR Code</h3>
            <div id="reader" style={{ width:'100%', borderRadius:12, overflow:'hidden' }}></div>
          </div>
        </div>
      )}
      
      {isMobile && <button onClick={() => setIsScanning(true)} style={{ position:'fixed', bottom:20, right:20, width:56, height:56, borderRadius:'50%', background:'#3b82f6', color:'white', border:'none', boxShadow:'0 5px 15px rgba(0,0,0,0.3)', zIndex:900, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}><Camera size={22} /></button>}
    </div>
  );
};

export default StudentDashboard;