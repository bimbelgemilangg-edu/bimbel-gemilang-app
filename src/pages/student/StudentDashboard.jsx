// src/pages/student/StudentDashboard.js
import React, { useState, useEffect } from 'react';
import SidebarSiswa from '../../components/SidebarSiswa';
import { db } from '../../firebase';
import { collection, query, getDocs, orderBy, doc, getDoc, setDoc, addDoc, serverTimestamp, where, limit } from "firebase/firestore";
import { Html5Qrcode } from "html5-qrcode";
import StudentFinanceSiswa from './StudentFinance';
import StudentGrades from './StudentGrades';
import StudentSchedule from './StudentSchedule';
import StudentAttendanceSiswa from './StudentAttendance';
import StudentElearning from './StudentElearning'; 
import { BookOpen, Calendar, Clock, GraduationCap, Menu, ChevronRight, Target, ClipboardList, AlertCircle, QrCode, X, Camera, User, MapPin, Send, CheckCircle, Megaphone, FileText, DollarSign, Award, ChevronLeft, LogOut, HelpCircle, Settings, Bell, Star, TrendingUp, BookMarked, Users, CheckSquare, MessageSquare, Phone, Mail, Globe, Facebook, Twitter, Instagram, Linkedin, Youtube, Github, Figma, Slack, Zoom, Google, Apple, Windows, Linux, Android, Ios, Chrome, Firefox, Safari, Edge, Opera, Brave, Tor, Vpn, Plus, Minus, Trash2, Edit, Save, Copy, Download, Upload, Search, Filter, SortAsc, SortDesc, RefreshCw, AlertTriangle, Info, HelpCircle as Help, Eye, EyeOff, Lock, Unlock, Key, Shield, UserCheck, UserX, UserPlus, UserMinus, Users as UsersIcon, UserCircle, UserCog, UserCheck as UserVerified, UserX as UserBan, UserPlus as UserAdd, UserMinus as UserRemove, Activity, BarChart, PieChart, LineChart, AreaChart, ScatterChart, RadarChart, BubbleChart, Treemap, Heatmap, BoxPlot, Histogram, Funnel, Sankey, Sunburst, WordCloud, Gauge, Progress, Steps, Timeline, Tree, Network, Graph, Map as MapIcon, Globe as GlobeIcon, Compass, Navigation, Pin, Marker, Location, City, Building, Home as HomeIcon, Briefcase, Workflow, Layers, Grid, List, Layout as LayoutIcon, Maximize, Minimize, ZoomIn, ZoomOut, RotateCw, RotateCcw, Move, Resize, Crop, FlipHorizontal, FlipVertical, AlignLeft, AlignCenter, AlignRight, AlignJustify, AlignTop, AlignMiddle, AlignBottom, Bold, Italic, Underline, Strikethrough, Code, Link, Unlink, Image, Video, Music, Mic, Volume2, Volume1, VolumeX, Play, Pause, SkipBack, SkipForward, Repeat, Shuffle, Radio, Headphones, Tv, Monitor, Smartphone, Tablet, Laptop, Desktop, Watch, Camera as CameraIcon, Video as VideoIcon, Image as ImageIcon, File, FileText as FileTextIcon, FileImage, FileVideo, FileAudio, FileCode, FilePdf, FileWord, FileExcel, FilePowerpoint, FileArchive, FileSpreadsheet, FilePresentation, FileDatabase, FileSettings, FileUser, FileCheck, FileX, FileMinus, FilePlus, Folder, FolderOpen, FolderPlus, FolderMinus, FolderSync, FolderSearch, Download as DownloadIcon, Upload as UploadIcon, Cloud, CloudRain, CloudSnow, CloudLightning, Sun, Moon, Star as StarIcon, Heart, ThumbsUp, ThumbsDown, Share, Bookmark, Flag, Award as AwardIcon, Trophy, Medal, Crown, Sparkles, Fire, Droplet, Wind, Thermometer, Umbrella, Compass as CompassIcon, Clock as ClockIcon, Calendar as CalendarIcon, Bell as BellIcon, AlertCircle as AlertOctagon, AlertTriangle as AlertTriangleIcon, CheckCircle as CheckCircleIcon, XCircle, HelpCircle as HelpCircleIcon, Info as InfoIcon, PlusCircle, MinusCircle, PlusSquare, MinusSquare, Menu as MenuIcon, MoreHorizontal, MoreVertical, ChevronLeft as ChevronLeftIcon, ChevronRight as ChevronRightIcon, ChevronUp, ChevronDown, ArrowLeft, ArrowRight, ArrowUp, ArrowDown, ArrowUpRight, ArrowDownRight, ArrowUpLeft, ArrowDownLeft, ArrowLeftCircle, ArrowRightCircle, ArrowUpCircle, ArrowDownCircle, RefreshCw as RefreshIcon, RotateCw as RotateIcon, RotateCcw as RotateCcwIcon, Undo, Redo, Trash, Trash2 as TrashIcon, Edit as EditIcon, Save as SaveIcon, Copy as CopyIcon, Cut, Clipboard, ClipboardList as ClipboardListIcon, ClipboardCheck, ClipboardX, Filter as FilterIcon, Search as SearchIcon, ZoomIn as ZoomInIcon, ZoomOut as ZoomOutIcon, Settings as SettingsIcon, Wrench, Tool, Sliders, ToggleLeft, ToggleRight, CheckSquare as CheckSquareIcon, Square, Circle as CircleIcon, CheckCircle as CheckIcon, XCircle as XIcon, Radio as RadioIcon, Minus as MinusIcon, Plus as PlusIcon, Hash, AtSign, DollarSign as DollarIcon, Euro, Pound, Yen, Bitcoin, Cpu, HardDrive, Disc, Server, Database, Cloud as CloudIcon, Wifi, Bluetooth, Battery, BatteryCharging, Power, Plug, Usb, Terminal, Command, Shield as ShieldIcon, Lock as LockIcon, Unlock as UnlockIcon, Key as KeyIcon, Eye as EyeIcon, EyeOff as EyeOffIcon, User as UserIcon, Users as UsersIcon2, UserPlus as UserPlusIcon, UserMinus as UserMinusIcon, UserCheck as UserCheckIcon, UserX as UserXIcon, UserCog as UserCogIcon, UserCircle as UserCircleIcon } from 'lucide-react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination, Autoplay, EffectFade } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import 'swiper/css/effect-fade';

const StudentDashboard = () => {
  const [activeMenu, setActiveMenu] = useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); 
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  const studentName = localStorage.getItem('studentName') || "Siswa";
  const studentId = localStorage.getItem('studentId');
  const [posters, setPosters] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [todaySchedules, setTodaySchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedNews, setSelectedNews] = useState(null);
  const [studentProfile, setStudentProfile] = useState(null);
  const [isScanning, setIsScanning] = useState(false);

  // 🔥 SURVEI STATE - DIPERBAIKI
  const [activeSurveys, setActiveSurveys] = useState([]);
  const [filledSurveys, setFilledSurveys] = useState({});
  const [showSurveyModal, setShowSurveyModal] = useState(false);
  const [currentSurvey, setCurrentSurvey] = useState(null);
  const [surveyAnswers, setSurveyAnswers] = useState({});
  const [surveyLoading, setSurveyLoading] = useState(false);

  useEffect(() => { 
    const h = () => setWindowWidth(window.innerWidth); 
    window.addEventListener('resize', h); 
    return () => window.removeEventListener('resize', h); 
  }, []);
  
  const isMobile = windowWidth <= 768;

  // QR SCANNER
  useEffect(() => {
    let qr = null;
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
                const today = new Date().toISOString().split('T')[0];
                await setDoc(doc(db, "attendance", `${studentId}_${today}_${d.scheduleId || ''}`), {
                  studentId, 
                  studentName, 
                  teacherName: d.teacher, 
                  date: today, 
                  tanggal: today,
                  timestamp: serverTimestamp(), 
                  status: "Hadir", 
                  mapel: d.mapel,
                  scheduleId: d.scheduleId || '', 
                  keterangan: "Scan QR"
                }, { merge: true });
                alert(`✅ Absen: ${d.mapel}`);
                stop();
              }
            } catch (e) {}
          }, 
          () => {}
        );
      } catch (e) {}
    };
    const stop = async () => {
      if (qr && qr.isScanning) { 
        try { 
          await qr.stop(); 
          qr.clear(); 
        } catch (e) {} 
      }
      setIsScanning(false);
    };
    if (isScanning) start();
    return () => { if (qr) stop(); };
  }, [isScanning, studentId, studentName]);

  const formatDate = (ts) => { 
    if (!ts) return "-"; 
    const d = ts.toDate ? ts.toDate() : new Date(ts); 
    return d.toLocaleDateString('id-ID', { day:'2-digit', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit' }); 
  };
  
  const formatDateOnly = (ts) => { 
    if (!ts) return "-"; 
    const d = ts.toDate ? ts.toDate() : new Date(ts); 
    return d.toLocaleDateString('id-ID', { day:'2-digit', month:'short', year:'numeric' }); 
  };
  
  const isDeadlineSoon = (dl) => { 
    if (!dl) return false; 
    const d = dl.toDate ? dl.toDate() : new Date(dl); 
    return (d - new Date()) / 36e5 > 0 && (d - new Date()) / 36e5 < 48; 
  };
  
  const isDeadlinePassed = (dl) => { 
    if (!dl) return false; 
    return (dl.toDate ? dl.toDate() : new Date(dl)) < new Date(); 
  };

  // 🔥🔥🔥 PERBAIKAN UTAMA: FETCH SURVEI YANG BENAR
  const fetchSurveys = async (studentKelas, studentIdParam) => {
    try {
      console.log('🔍 🔥 MULAI FETCH SURVEI UNTUK SISWA...');
      console.log('Student Kelas:', studentKelas);
      console.log('Student ID:', studentIdParam);
      
      // AMBIL SEMUA DOKUMEN SURVEI (tanpa filter apapun dulu)
      const allDocs = await getDocs(collection(db, "surveys"));
      console.log('📊 Total survei di database:', allDocs.size);
      
      const allSurveys = [];
      allDocs.forEach(doc => {
        const data = doc.data();
        console.log(`  📋 ${doc.id}: "${data.title}" | status: ${data.status} | isActive: ${data.isActive} | targetType: ${data.targetType} | required: ${data.isRequired}`);
        allSurveys.push({ id: doc.id, ...data });
      });
      
      // FILTER 1: Hanya survei yang AKTIF (berbagai format)
      const aktifSurveys = allSurveys.filter(s => {
        // Cek status dalam berbagai kemungkinan format
        const isActive = 
          s.status === 'aktif' || 
          s.status === 'active' || 
          s.status === 'published' ||
          s.isActive === true ||
          s.isActive === 'true';
        
        if (!isActive) {
          console.log(`  ⏸️ Skip (tidak aktif): ${s.title}`);
        }
        return isActive;
      });
      
      console.log('✅ Survei AKTIF ditemukan:', aktifSurveys.length);
      aktifSurveys.forEach(s => console.log(`    - ${s.title} (target: ${s.targetType})`));
      
      // FILTER 2: Hanya survei yang TARGETnya cocok dengan siswa
      const cocok = aktifSurveys.filter(s => {
        const target = s.targetType || '';
        const targetLower = target.toLowerCase();
        
        // CASE 1: Target semua siswa / semua / all
        if (targetLower === 'semua_siswa' || targetLower === 'semua' || targetLower === 'students' || targetLower === 'all') {
          console.log(`  ✅ ${s.title}: target SEMUA SISWA -> COCOK`);
          return true;
        }
        
        // CASE 2: Target berdasarkan jenjang/kelas
        if (targetLower === 'jenjang' || targetLower === 'per_jenjang' || targetLower === 'by_class') {
          const targetKelas = s.targetKelas || s.kelasTarget || 'Semua';
          if (targetKelas === 'Semua' || targetKelas === studentKelas) {
            console.log(`  ✅ ${s.title}: target JENJANG ${targetKelas} -> COCOK dengan kelas ${studentKelas}`);
            return true;
          } else {
            console.log(`  ❌ ${s.title}: target JENJANG ${targetKelas} -> TIDAK COCOK dengan kelas ${studentKelas}`);
          }
          return false;
        }
        
        // CASE 3: Target spesifik siswa (jika ada field targetIds)
        if (targetLower === 'spesifik' || targetLower === 'specific' || targetLower === 'selected') {
          const targetIds = s.targetIds || [];
          if (targetIds.includes(studentIdParam)) {
            console.log(`  ✅ ${s.title}: target SPESIFIK -> COCOK (ID ditemukan)`);
            return true;
          } else {
            console.log(`  ❌ ${s.title}: target SPESIFIK -> TIDAK COCOK (ID tidak ada di daftar)`);
          }
          return false;
        }
        
        console.log(`  ❌ ${s.title}: target ${target} -> TIDAK DIKENALI`);
        return false;
      });
      
      console.log('🎯 SURVEI COCOK UNTUK SISWA INI:', cocok.length);
      cocok.forEach(s => console.log(`    - ${s.title} (wajib: ${s.isRequired ? 'YA' : 'TIDAK'})`));
      
      // CEK SURVEI YANG SUDAH DIISI
      const filled = {};
      for (const survey of cocok) {
        try {
          const respSnap = await getDocs(query(
            collection(db, "survey_responses"), 
            where("surveyId", "==", survey.id), 
            where("userId", "==", studentIdParam)
          ));
          filled[survey.id] = !respSnap.empty;
          if (!respSnap.empty) {
            console.log(`  ✅ ${survey.title}: SUDAH DIISI`);
          } else {
            console.log(`  ⏳ ${survey.title}: BELUM DIISI`);
          }
        } catch (e) {
          console.warn(`  ⚠️ Gagal cek ${survey.title}:`, e.message);
          filled[survey.id] = false;
        }
      }
      
      return { surveys: cocok, filled };
      
    } catch (error) {
      console.error('❌ ERROR FETCH SURVEI:', error);
      return { surveys: [], filled: {} };
    }
  };

  useEffect(() => {
    const fetchAll = async () => {
      if (!studentId) {
        console.log('⚠️ No studentId found');
        setLoading(false);
        return;
      }
      
      setLoading(true);
      console.log('🚀 START FETCHING DASHBOARD DATA...');
      
      try {
        // FETCH STUDENT PROFILE
        console.log('📖 Fetching student profile...');
        const sSnap = await getDoc(doc(db, "students", studentId));
        let curKat = "Semua", curKel = "Semua";
        
        if (sSnap.exists()) { 
          const d = sSnap.data(); 
          setStudentProfile(d); 
          curKat = d.kategori || "Semua"; 
          curKel = d.kelasSekolah || "Semua";
          console.log('📋 Student Profile:', { kategori: curKat, kelas: curKel });
        } else {
          console.log('⚠️ Student profile not found');
        }

        // FETCH POSTERS
        console.log('🖼️ Fetching posters...');
        const postersSnap = await getDocs(query(collection(db, "student_contents"), orderBy("createdAt", "desc")));
        setPosters(postersSnap.docs.map(d => ({ id: d.id, ...d.data() })));
        console.log(`📸 Posters loaded: ${postersSnap.size}`);

        // FETCH TODAY SCHEDULES
        console.log('📅 Fetching today schedules...');
        const todayStr = new Date().toISOString().split('T')[0];
        const scheds = (await getDocs(query(collection(db, "jadwal_bimbel"), where("dateStr", "==", todayStr))))
          .docs.map(d => ({ id: d.id, ...d.data() }))
          .filter(sch => sch.students?.some(s => s.id === studentId || s === studentId))
          .sort((a, b) => (a.start || '').localeCompare(b.start || ''));
        setTodaySchedules(scheds.slice(0, 5));
        console.log(`📅 Schedules loaded: ${scheds.length}`);

        // FETCH TASKS
        console.log('📝 Fetching tasks...');
        const moduls = (await getDocs(query(
          collection(db, "bimbel_modul"), 
          where("targetKategori", "in", ["Semua", curKat]), 
          orderBy("createdAt", "desc"), 
          limit(10)
        ))).docs.map(d => ({ id: d.id, ...d.data() }));
        setTasks(moduls.filter(m => m.quizData?.length > 0 || m.blocks?.some(b => b.type === 'assignment')).slice(0, 5));
        console.log(`📝 Tasks loaded: ${moduls.length}`);

        // 🔥🔥🔥 FETCH SURVEYS (YANG DIPERBAIKI)
        console.log('📋 🔥 FETCHING SURVEYS...');
        const { surveys: fetchedSurveys, filled: filledStatus } = await fetchSurveys(curKel, studentId);
        
        setActiveSurveys(fetchedSurveys);
        setFilledSurveys(filledStatus);
        
        // TAMPILKAN SURVEI YANG BELUM DIISI (PENTING!)
        const belumDiisi = fetchedSurveys.filter(s => !filledStatus[s.id]);
        console.log('📋 SURVEI YANG BELUM DIISI:', belumDiisi.length);
        if (belumDiisi.length > 0) {
          console.log('⚠️ PERHATIAN: Ada survei yang harus diisi!');
          belumDiisi.forEach(s => console.log(`  - ${s.title} (${s.isRequired ? 'WAJIB' : 'OPSIONAL'})`));
        } else {
          console.log('✅ Semua survei sudah diisi!');
        }

      } catch (err) { 
        console.error('❌ ERROR FETCH DASHBOARD:', err); 
      } finally { 
        setLoading(false);
        console.log('🏁 DASHBOARD LOADING COMPLETE');
      }
    };
    
    fetchAll();
  }, [studentId]);

  const getAssignmentDeadline = (modul) => {
    const ab = modul.blocks?.find(b => b.type === 'assignment' && b.endTime);
    return ab?.endTime || modul.deadlineTugas || modul.deadlineQuiz || null;
  };

  const openSurvey = (s) => { 
    console.log('📋 Opening survey:', s.title);
    setCurrentSurvey(s); 
    setSurveyAnswers({}); 
    setShowSurveyModal(true); 
  };
  
  const submitSurvey = async () => {
    if (!currentSurvey) return;
    
    // Validasi semua pertanyaan terjawab
    const unanswered = currentSurvey.questions.filter((_, i) => surveyAnswers[i] === undefined || surveyAnswers[i] === '');
    if (unanswered.length > 0) {
      alert(`❌ ${unanswered.length} pertanyaan belum dijawab!`);
      return;
    }
    
    setSurveyLoading(true);
    
    try {
      await addDoc(collection(db, "survey_responses"), {
        surveyId: currentSurvey.id, 
        userId: studentId, 
        userName: studentName,
        answers: currentSurvey.questions.map((q, i) => ({ 
          questionIndex: i, 
          question: q.question,
          answer: surveyAnswers[i] || '' 
        })),
        submittedAt: serverTimestamp()
      });
      
      setFilledSurveys({ ...filledSurveys, [currentSurvey.id]: true });
      setShowSurveyModal(false); 
      setCurrentSurvey(null);
      alert("✅ Terima kasih! Jawaban survei telah tersimpan.");
      
      // Refresh survei list
      const { surveys: updatedSurveys, filled: updatedFilled } = await fetchSurveys(
        studentProfile?.kelasSekolah || "Semua", 
        studentId
      );
      setActiveSurveys(updatedSurveys);
      setFilledSurveys(updatedFilled);
      
    } catch (err) { 
      console.error('❌ Error submitting survey:', err);
      alert("❌ Gagal mengirim survei: " + err.message); 
    } finally {
      setSurveyLoading(false);
    }
  };

  const renderDashboardHome = () => (
    <div style={st.contentWrapper}>
      {/* HEADER WELCOME */}
      <div style={isMobile ? st.welcomeHeaderMobile : st.welcomeHeader}>
        <div>
          <h1 style={isMobile ? st.titleMobile : st.title}>Halo, {studentName}! 👋</h1>
          <p style={st.subtitle}>
            {studentProfile ? `${studentProfile.kategori || 'Reguler'} - Kelas ${studentProfile.kelasSekolah || '-'}` : "Memuat profil..."}
          </p>
        </div>
        {!isMobile && (
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={() => setIsScanning(true)} style={st.btnScanHeader}>
              <Camera size={18} /> SCAN ABSEN
            </button>
            <div style={st.statusBadge}>
              <GraduationCap size={18} />
              <span>Siswa Aktif</span>
            </div>
          </div>
        )}
      </div>

      {/* CAROUSEL POSTER */}
      {posters.length > 0 && (
        <div style={{ ...st.carouselContainer, aspectRatio: isMobile ? '4/3' : '21/9' }}>
          <Swiper 
            modules={[Navigation, Pagination, Autoplay, EffectFade]} 
            effect={'fade'} 
            navigation={!isMobile} 
            pagination={{ clickable: true }} 
            autoplay={{ delay: 5000 }} 
            loop={posters.length > 1} 
            style={st.mySwiper}
          >
            {posters.map((post) => (
              <SwiperSlide key={post.id} onClick={() => setSelectedNews(post)}>
                <div style={{ 
                  ...st.slideCard, 
                  backgroundImage: `url(${post.imageUrl})`, 
                  cursor: 'pointer' 
                }}>
                  <div style={st.slideOverlay}>
                    <span style={{ 
                      background: '#e11d48', 
                      padding: '4px 10px', 
                      borderRadius: 12, 
                      fontSize: 9, 
                      fontWeight: 800, 
                      display: 'inline-flex', 
                      alignItems: 'center', 
                      gap: 4, 
                      marginBottom: 8 
                    }}>
                      <Megaphone size={10} /> Info
                    </span>
                    <h2 style={isMobile ? st.slideTitleMobile : st.slideTitle}>
                      {post.title}
                    </h2>
                    {!isMobile && <p style={st.slideDesc}>{post.desc || "Klik untuk baca selengkapnya"}</p>}
                  </div>
                </div>
              </SwiperSlide>
            ))}
          </Swiper>
        </div>
      )}

      {/* 🔥 SECTION SURVEI - DIPERBAIKI */}
      {activeSurveys.length > 0 && (
        <div style={{ 
          background: 'white', 
          padding: 20, 
          borderRadius: 15, 
          border: '1px solid #e2e8f0', 
          borderTop: '4px solid #3b82f6',
          boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
        }}>
          <h3 style={{ 
            margin: '0 0 15px', 
            fontSize: 16, 
            fontWeight: 800, 
            display: 'flex', 
            alignItems: 'center', 
            gap: 8 
          }}>
            <ClipboardList size={20} color="#3b82f6" /> 
            Survei yang Perlu Diisi
            {activeSurveys.filter(s => !filledSurveys[s.id]).length > 0 && (
              <span style={{ 
                background: '#ef4444', 
                color: 'white', 
                padding: '2px 8px', 
                borderRadius: 20, 
                fontSize: 10,
                marginLeft: 8
              }}>
                {activeSurveys.filter(s => !filledSurveys[s.id]).length} pending
              </span>
            )}
          </h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {activeSurveys.map(survey => {
              const done = filledSurveys[survey.id];
              return (
                <div 
                  key={survey.id} 
                  style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'space-between', 
                    padding: 14, 
                    background: done ? '#f0fdf4' : survey.isRequired ? '#fef2f2' : '#fffbeb', 
                    borderRadius: 12, 
                    border: `1px solid ${done ? '#bbf7d0' : survey.isRequired ? '#fecaca' : '#fde68a'}`,
                    flexWrap: 'wrap', 
                    gap: 10,
                    transition: 'all 0.2s ease'
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
                      {done ? (
                        <CheckCircle size={16} color="#10b981" />
                      ) : (
                        <Send size={16} color={survey.isRequired ? '#ef4444' : '#f59e0b'} />
                      )}
                      <strong style={{ fontSize: 14 }}>{survey.title}</strong>
                      {survey.isRequired && !done && (
                        <span style={{ 
                          background: '#fee2e2', 
                          color: '#ef4444', 
                          padding: '2px 8px', 
                          borderRadius: 6, 
                          fontSize: 9, 
                          fontWeight: 800 
                        }}>
                          WAJIB
                        </span>
                      )}
                      {done && (
                        <span style={{ 
                          background: '#dcfce7', 
                          color: '#166534', 
                          padding: '2px 8px', 
                          borderRadius: 6, 
                          fontSize: 9, 
                          fontWeight: 800 
                        }}>
                          SELESAI
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: 11, color: '#64748b' }}>
                      {survey.questions?.length || 0} pertanyaan 
                      {survey.deadline && ` • Deadline: ${new Date(survey.deadline).toLocaleDateString('id-ID')}`}
                    </div>
                    {survey.description && (
                      <div style={{ fontSize: 11, color: '#475569', marginTop: 4 }}>
                        {survey.description.length > 100 ? survey.description.substring(0, 100) + '...' : survey.description}
                      </div>
                    )}
                  </div>
                  
                  {done ? (
                    <span style={{ color: '#10b981', fontWeight: 700, fontSize: 12 }}>
                      ✅ Terisi
                    </span>
                  ) : (
                    <button 
                      onClick={() => openSurvey(survey)} 
                      style={{ 
                        background: survey.isRequired ? '#ef4444' : '#f59e0b', 
                        color: 'white', 
                        border: 'none', 
                        padding: '8px 16px', 
                        borderRadius: 8, 
                        fontWeight: 700, 
                        fontSize: 12, 
                        cursor: 'pointer', 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: 6,
                        transition: 'all 0.2s ease'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.opacity = '0.9'}
                      onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
                    >
                      <Send size={14} /> Isi Survei
                    </button>
                  )}
                </div>
              );
            })}
          </div>
          
          {activeSurveys.filter(s => !filledSurveys[s.id]).length === 0 && (
            <div style={{ 
              textAlign: 'center', 
              padding: '20px', 
              color: '#10b981',
              fontSize: 13,
              fontWeight: 500
            }}>
              <CheckCircle size={20} style={{ marginBottom: 8 }} />
              <p>Semua survei sudah Anda isi. Terima kasih! 🎉</p>
            </div>
          )}
        </div>
      )}

      {/* MAIN GRID */}
      <div style={isMobile ? st.mainGridMobile : st.mainGrid}>
        {/* LEFT COLUMN */}
        <div style={st.leftColumn}>
          {/* JADWAL HARI INI */}
          <section style={st.sectionCard}>
            <h3 style={st.sectionTitle}>
              <Calendar size={20} color="#3498db" /> Jadwal Hari Ini
            </h3>
            {todaySchedules.length === 0 ? (
              <div style={st.emptyState}>
                📭 Tidak ada jadwal untuk hari ini.
              </div>
            ) : (
              todaySchedules.map((sch, i) => (
                <div key={i} style={st.schItem}>
                  <div style={st.schTime}>
                    <b>{sch.start}</b>
                    <br />
                    <span style={{ fontSize: 10 }}>{sch.end}</span>
                  </div>
                  <div style={st.schInfo}>
                    <b>{sch.title || "Kelas"}</b>
                    <div style={{ fontSize: 11, color: '#64748b' }}>
                      <MapPin size={10} /> {sch.planet || 'Ruangan'} • 
                      <User size={10} /> {sch.booker || 'Guru'}
                    </div>
                  </div>
                </div>
              ))
            )}
          </section>

          {/* TUGAS & KUIS */}
          <section style={st.sectionCard}>
            <div style={st.cardHeader}>
              <h3 style={st.sectionTitle}>
                <ClipboardList size={20} color="#9b59b6" /> Tugas & Kuis
              </h3>
              <button onClick={() => setActiveMenu('materi')} style={st.btnViewAll}>
                Lihat Semua <ChevronRight size={14} />
              </button>
            </div>
            {tasks.length === 0 ? (
              <div style={st.emptyState}>📭 Belum ada tugas.</div>
            ) : (
              tasks.map((task, i) => {
                const dl = getAssignmentDeadline(task);
                const soon = isDeadlineSoon(dl);
                const passed = isDeadlinePassed(dl);
                return (
                  <div key={i} style={{ 
                    ...st.taskItem, 
                    borderLeftColor: passed ? '#ef4444' : soon ? '#f59e0b' : '#9b59b6' 
                  }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 14, fontWeight: 700 }}>{task.title}</div>
                      {dl && (
                        <div style={{ fontSize: 11, marginTop: 4 }}>
                          <Clock size={12} /> 
                          {passed ? '⛔ Terlewat ' : soon ? '⚠️ Segera ' : '📅 '}
                          {formatDateOnly(dl)}
                        </div>
                      )}
                    </div>
                    <button onClick={() => setActiveMenu('materi')} style={st.btnTaskBuka}>
                      Buka
                    </button>
                  </div>
                );
              })
            )}
          </section>
        </div>

        {/* RIGHT COLUMN */}
        <div style={st.rightColumn}>
          <section style={st.sectionCard}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 15 }}>
              <div style={st.avatar}>
                {studentName?.charAt(0) || 'S'}
              </div>
              <div>
                <b>{studentName}</b>
                <p style={{ fontSize: 11, color: '#64748b', margin: 0 }}>
                  {studentProfile?.kelasSekolah || '-'} • 
                  {studentProfile?.kategori || 'Reguler'}
                </p>
              </div>
            </div>
            <button onClick={() => setActiveMenu('materi')} style={st.btnAccess}>
              <BookOpen size={16} /> Buka Materi Belajar
            </button>
          </section>

          {/* STATISTIK CEPAT */}
          <section style={st.sectionCard}>
            <h3 style={{ ...st.sectionTitle, marginBottom: 10 }}>
              <TrendingUp size={20} color="#10b981" /> Ringkasan
            </h3>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10 }}>
              <div style={{ textAlign: 'center', flex: 1 }}>
                <div style={{ fontSize: 20, fontWeight: 800, color: '#3b82f6' }}>
                  {todaySchedules.length}
                </div>
                <div style={{ fontSize: 10, color: '#64748b' }}>Jadwal Hari Ini</div>
              </div>
              <div style={{ textAlign: 'center', flex: 1 }}>
                <div style={{ fontSize: 20, fontWeight: 800, color: '#9b59b6' }}>
                  {tasks.length}
                </div>
                <div style={{ fontSize: 10, color: '#64748b' }}>Tugas Aktif</div>
              </div>
              <div style={{ textAlign: 'center', flex: 1 }}>
                <div style={{ fontSize: 20, fontWeight: 800, color: '#ef4444' }}>
                  {activeSurveys.filter(s => !filledSurveys[s.id]).length}
                </div>
                <div style={{ fontSize: 10, color: '#64748b' }}>Survei Pending</div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );

  const renderContent = () => {
    switch (activeMenu) {
      case 'dashboard': return renderDashboardHome();
      case 'keuangan': return <StudentFinanceSiswa />;
      case 'rapor': return <StudentGrades />;
      case 'jadwal': return <StudentSchedule />;
      case 'absensi': return <StudentAttendanceSiswa />;
      case 'materi': return <StudentElearning />;
      default: return renderDashboardHome();
    }
  };

  if (loading) return (
    <div style={st.mainContainer}>
      <SidebarSiswa 
        activeMenu={activeMenu} 
        setActiveMenu={setActiveMenu} 
        isOpen={isSidebarOpen} 
        setIsOpen={setIsSidebarOpen} 
      />
      <div style={st.loadingScreen}>
        <div style={st.spinner}></div>
        <p>Memuat dashboard...</p>
      </div>
    </div>
  );

  return (
    <div style={st.mainContainer}>
      <SidebarSiswa 
        activeMenu={activeMenu} 
        setActiveMenu={(menu) => { 
          setActiveMenu(menu); 
          if (isMobile) setIsSidebarOpen(false); 
        }} 
        isOpen={isSidebarOpen} 
        setIsOpen={setIsSidebarOpen} 
      />
      
      {isMobile && (
        <button onClick={() => setIsSidebarOpen(true)} style={st.mobileMenuBtn}>
          <Menu size={24} />
        </button>
      )}
      
      <div style={{ 
        ...st.contentArea, 
        marginLeft: isMobile ? '0' : '260px', 
        width: isMobile ? '100%' : 'calc(100% - 260px)', 
        padding: isMobile ? '15px' : '30px', 
        paddingTop: isMobile ? '70px' : '30px' 
      }}>
        {renderContent()}
      </div>
      
      {isMobile && isSidebarOpen && (
        <div onClick={() => setIsSidebarOpen(false)} style={st.overlay} />
      )}

      {/* MODAL BERITA */}
      {selectedNews && (
        <div style={st.modalOverlay} onClick={() => setSelectedNews(null)}>
          <div style={{ ...st.modalContent, width: isMobile ? '90%' : '600px' }} onClick={e => e.stopPropagation()}>
            <button onClick={() => setSelectedNews(null)} style={st.btnCloseModal}>
              <X size={20} />
            </button>
            <img src={selectedNews.imageUrl} style={st.modalImg} alt="" />
            <div style={{ padding: 20 }}>
              <h2>{selectedNews.title}</h2>
              <p>{selectedNews.content || selectedNews.desc}</p>
            </div>
          </div>
        </div>
      )}

      {/* MODAL SCANNER QR */}
      {isScanning && (
        <div style={st.modalOverlay} onClick={() => setIsScanning(false)}>
          <div style={st.qrModalContent} onClick={e => e.stopPropagation()}>
            <button onClick={() => setIsScanning(false)} style={st.btnCloseModal}>
              <X size={20} />
            </button>
            <h3>Scan QR Code Absensi</h3>
            <div id="reader" style={{ width: '100%', borderRadius: 15, overflow: 'hidden' }}></div>
            <p style={{ fontSize: 11, color: '#64748b', marginTop: 12 }}>
              Arahkan kamera ke QR Code yang ditampilkan guru
            </p>
          </div>
        </div>
      )}

      {/* 🔥 MODAL SURVEI - DIPERBAIKI */}
      {showSurveyModal && currentSurvey && (
        <div style={{ 
          position: 'fixed', 
          inset: 0, 
          background: 'rgba(0,0,0,0.8)', 
          zIndex: 3000, 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          padding: 20 
        }}>
          <div style={{ 
            background: 'white', 
            borderRadius: 20, 
            padding: 30, 
            width: '100%', 
            maxWidth: 550, 
            maxHeight: '85vh', 
            overflowY: 'auto',
            position: 'relative'
          }}>
            <button 
              onClick={() => setShowSurveyModal(false)} 
              style={{ 
                position: 'sticky', 
                top: 0, 
                right: 0, 
                float: 'right',
                background: '#f1f5f9', 
                border: 'none', 
                borderRadius: '50%',
                width: 32,
                height: 32,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 10
              }}
            >
              <X size={18} />
            </button>
            
            <div style={{ textAlign: 'center', marginBottom: 20, clear: 'both' }}>
              <span style={{ fontSize: 40 }}>📋</span>
              <h2 style={{ margin: '10px 0 5px', fontSize: 20 }}>{currentSurvey.title}</h2>
              {currentSurvey.description && (
                <p style={{ fontSize: 12, color: '#64748b', marginTop: 5 }}>
                  {currentSurvey.description}
                </p>
              )}
              {currentSurvey.isRequired && (
                <span style={{ 
                  display: 'inline-block', 
                  background: '#fee2e2', 
                  color: '#ef4444', 
                  padding: '4px 12px', 
                  borderRadius: 20, 
                  fontSize: 11, 
                  fontWeight: 700,
                  marginTop: 8
                }}>
                  ⚠️ Survei ini wajib diisi
                </span>
              )}
            </div>
            
            {currentSurvey.questions.map((q, i) => (
              <div key={i} style={{ marginBottom: 20 }}>
                <p style={{ fontWeight: 700, fontSize: 14, marginBottom: 8 }}>
                  {i + 1}. {q.question}
                  {q.required && <span style={{ color: '#ef4444', marginLeft: 4 }}>*</span>}
                </p>
                
                {q.type === 'pilihan' || q.type === 'multiple_choice' || !q.type ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {(q.options || ['Pilihan 1', 'Pilihan 2', 'Pilihan 3']).filter(o => o && o.trim()).map((opt, oi) => (
                      <label 
                        key={oi} 
                        style={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          gap: 10, 
                          padding: '10px 14px', 
                          marginBottom: 4, 
                          borderRadius: 10, 
                          cursor: 'pointer', 
                          background: surveyAnswers[i] === opt ? '#eef2ff' : '#f8fafc', 
                          border: `2px solid ${surveyAnswers[i] === opt ? '#3b82f6' : '#e2e8f0'}`,
                          transition: 'all 0.2s ease'
                        }}
                      >
                        <input 
                          type="radio" 
                          name={`sq-${i}`} 
                          checked={surveyAnswers[i] === opt} 
                          onChange={() => setSurveyAnswers({ ...surveyAnswers, [i]: opt })} 
                          style={{ width: 18, height: 18 }} 
                        />
                        <span style={{ fontSize: 13 }}>{opt}</span>
                      </label>
                    ))}
                  </div>
                ) : q.type === 'text' || q.type === 'essay' ? (
                  <textarea
                    value={surveyAnswers[i] || ''}
                    onChange={(e) => setSurveyAnswers({ ...surveyAnswers, [i]: e.target.value })}
                    placeholder="Tulis jawaban Anda di sini..."
                    style={{ 
                      width: '100%', 
                      padding: 12, 
                      borderRadius: 10, 
                      border: '2px solid #e2e8f0',
                      fontSize: 13,
                      fontFamily: 'inherit',
                      resize: 'vertical'
                    }}
                    rows={4}
                  />
                ) : q.type === 'rating' ? (
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {[1, 2, 3, 4, 5].map(rating => (
                      <button
                        key={rating}
                        type="button"
                        onClick={() => setSurveyAnswers({ ...surveyAnswers, [i]: rating })}
                        style={{
                          width: 48,
                          height: 48,
                          borderRadius: 12,
                          background: surveyAnswers[i] === rating ? '#3b82f6' : '#f1f5f9',
                          color: surveyAnswers[i] === rating ? 'white' : '#475569',
                          border: 'none',
                          fontWeight: 800,
                          fontSize: 16,
                          cursor: 'pointer',
                          transition: 'all 0.2s ease'
                        }}
                      >
                        {rating}
                      </button>
                    ))}
                  </div>
                ) : null}
              </div>
            ))}
            
            <button 
              onClick={submitSurvey} 
              disabled={surveyLoading}
              style={{ 
                width: '100%', 
                padding: 14, 
                background: '#3b82f6', 
                color: 'white', 
                border: 'none', 
                borderRadius: 12, 
                fontWeight: 800, 
                fontSize: 15, 
                cursor: surveyLoading ? 'not-allowed' : 'pointer', 
                marginTop: 10,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                opacity: surveyLoading ? 0.7 : 1
              }}
            >
              {surveyLoading ? (
                <>
                  <div style={{ 
                    width: 16, 
                    height: 16, 
                    border: '2px solid white', 
                    borderTop: '2px solid transparent', 
                    borderRadius: '50%', 
                    animation: 'spin 0.6s linear infinite' 
                  }} />
                  Mengirim...
                </>
              ) : (
                <>
                  <Send size={18} /> Kirim Jawaban
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* FAB MOBILE */}
      {isMobile && (
        <button onClick={() => setIsScanning(true)} style={st.fabQR}>
          <Camera size={22} />
        </button>
      )}
    </div>
  );
};

const st = {
  mainContainer: { display: 'flex', minHeight: '100vh', background: '#f8fafc', position: 'relative' },
  contentArea: { transition: 'margin 0.3s ease', boxSizing: 'border-box' },
  contentWrapper: { display: 'flex', flexDirection: 'column', gap: 20 },
  loadingScreen: { flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', marginLeft: 260 },
  spinner: { 
    width: 40, 
    height: 40, 
    border: '4px solid #e2e8f0', 
    borderTop: '4px solid #3b82f6', 
    borderRadius: '50%', 
    animation: 'spin 0.8s linear infinite', 
    marginBottom: 10 
  },
  welcomeHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  welcomeHeaderMobile: { textAlign: 'left', marginBottom: 10 },
  title: { fontSize: 28, fontWeight: 800, color: '#1e293b', margin: 0 },
  titleMobile: { fontSize: 22, fontWeight: 800, color: '#1e293b', margin: 0 },
  subtitle: { color: '#64748b', marginTop: 5, fontSize: 14 },
  statusBadge: { display: 'flex', alignItems: 'center', gap: 8, background: '#dcfce7', color: '#166534', padding: '8px 16px', borderRadius: 100, fontWeight: 'bold' },
  btnScanHeader: { display: 'flex', alignItems: 'center', gap: 8, background: '#3498db', color: 'white', border: 'none', padding: '8px 16px', borderRadius: 100, fontWeight: 'bold', cursor: 'pointer' },
  mobileMenuBtn: { position: 'fixed', top: 15, left: 15, zIndex: 900, background: '#1e293b', color: 'white', border: 'none', padding: 10, borderRadius: 10 },
  overlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', zIndex: 998 },
  carouselContainer: { borderRadius: 15, overflow: 'hidden', boxShadow: '0 10px 30px rgba(0,0,0,0.05)', width: '100%' },
  mySwiper: { width: '100%', height: '100%' },
  slideCard: { width: '100%', height: '100%', backgroundSize: 'cover', backgroundPosition: 'center', display: 'flex', alignItems: 'flex-end' },
  slideOverlay: { width: '100%', background: 'linear-gradient(transparent, rgba(0,0,0,0.8))', padding: 20, color: 'white' },
  slideTitle: { fontSize: 24, fontWeight: 'bold', margin: 0 },
  slideTitleMobile: { fontSize: 16, fontWeight: 'bold', margin: 0 },
  slideDesc: { fontSize: 14, opacity: 0.8, marginTop: 5 },
  mainGrid: { display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: 25 },
  mainGridMobile: { display: 'flex', flexDirection: 'column', gap: 20 },
  leftColumn: { display: 'flex', flexDirection: 'column', gap: 20 },
  rightColumn: { display: 'flex', flexDirection: 'column', gap: 20 },
  sectionCard: { background: 'white', padding: 20, borderRadius: 15, border: '1px solid #e2e8f0' },
  cardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  sectionTitle: { fontSize: 16, fontWeight: 700, color: '#1e293b', margin: '0 0 15px 0', display: 'flex', alignItems: 'center', gap: 8 },
  btnViewAll: { background: 'none', border: 'none', color: '#3b82f6', fontWeight: 600, fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 },
  schItem: { display: 'flex', alignItems: 'stretch', gap: 12, padding: '12px 0', borderBottom: '1px solid #f1f5f9' },
  schTime: { minWidth: 55, fontSize: 13, textAlign: 'center' },
  schInfo: { flex: 1 },
  taskItem: { display: 'flex', alignItems: 'center', padding: 12, background: '#f8fafc', borderRadius: 10, borderLeft: '4px solid', marginBottom: 8 },
  btnTaskBuka: { background: '#9b59b6', color: 'white', border: 'none', padding: '6px 12px', borderRadius: 6, fontSize: 11, fontWeight: 600, cursor: 'pointer', flexShrink: 0 },
  avatar: { width: 45, height: 45, borderRadius: '50%', background: '#3b82f6', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: 18, flexShrink: 0 },
  btnAccess: { width: '100%', padding: 12, background: '#3b82f6', color: 'white', border: 'none', borderRadius: 10, cursor: 'pointer', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 10 },
  emptyState: { fontSize: 12, color: '#94a3b8', textAlign: 'center', padding: 15 },
  modalOverlay: { position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.7)', zIndex: 2000, display: 'flex', justifyContent: 'center', alignItems: 'center', backdropFilter: 'blur(5px)' },
  modalContent: { background: 'white', borderRadius: 15, overflow: 'hidden', position: 'relative' },
  modalImg: { width: '100%', maxHeight: 250, objectFit: 'cover' },
  btnCloseModal: { position: 'absolute', top: 10, right: 10, background: 'rgba(0,0,0,0.5)', color: 'white', border: 'none', borderRadius: '50%', width: 30, height: 30, cursor: 'pointer', zIndex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' },
  qrModalContent: { background: 'white', padding: '30px 20px', borderRadius: 25, width: '90%', maxWidth: 400, textAlign: 'center', position: 'relative' },
  fabQR: { position: 'fixed', bottom: 20, right: 20, width: 60, height: 60, borderRadius: '50%', background: '#3498db', color: 'white', border: 'none', display: 'flex', justifyContent: 'center', alignItems: 'center', boxShadow: '0 5px 15px rgba(0,0,0,0.3)', zIndex: 900, cursor: 'pointer' },
};

// Tambahkan CSS animation ke document
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = `
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
  `;
  document.head.appendChild(style);
}

export default StudentDashboard;