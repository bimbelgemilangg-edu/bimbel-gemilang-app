import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../../firebase'; 
import { collection, query, where, getDocs, doc, getDoc, addDoc, orderBy, serverTimestamp } from "firebase/firestore";
import { Player } from '@lottiefiles/react-lottie-player';
import { Clock, Users, BookOpen, Star, ArrowRight, Eye, Megaphone, Info, Calendar, Layout, MapPin, X, ChevronRight, Send, ClipboardList } from 'lucide-react';
import ClassSession from './ClassSession';

const TeacherDashboard = () => {
  const navigate = useNavigate();
  const [guru, setGuru] = useState(null);
  const [loading, setLoading] = useState(true);
  const [todaySchedules, setTodaySchedules] = useState([]);
  const [mode, setMode] = useState('dashboard');
  const [showStartModal, setShowStartModal] = useState(false);
  const [inputToken, setInputToken] = useState("");
  const [pendingSchedule, setPendingSchedule] = useState(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [announcements, setAnnouncements] = useState([]);
  const [activeSlide, setActiveSlide] = useState(0);
  const [selectedNews, setSelectedNews] = useState(null);

  // 🔥 SURVEI WAJIB
  const [mandatorySurvey, setMandatorySurvey] = useState(null);
  const [surveyAnswers, setSurveyAnswers] = useState({});
  const [showSurveyModal, setShowSurveyModal] = useState(false);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (announcements.length > 1) {
      const interval = setInterval(() => setActiveSlide(prev => (prev + 1) % announcements.length), 5000);
      return () => clearInterval(interval);
    }
  }, [announcements]);

  const fetchTeacherProfile = useCallback(async () => {
    const saved = JSON.parse(localStorage.getItem('teacherData'));
    if (!saved) return navigate('/login-guru');
    setGuru(saved);
  }, [navigate]);

  const fetchData = useCallback(async () => {
    if (!guru?.nama) return;
    try {
      const todayStr = new Date().toISOString().split('T')[0];
      const qJadwal = query(collection(db, "jadwal_bimbel"), where("booker", "==", guru.nama.trim()));
      const snapJadwal = await getDocs(qJadwal);
      setTodaySchedules(snapJadwal.docs.map(d => ({ id: d.id, ...d.data() }))
        .filter(s => s.dateStr === todayStr).sort((a,b) => a.start.localeCompare(b.start)));

      const qAnnounce = query(collection(db, "student_contents"), orderBy("createdAt", "desc"));
      const snapAnnounce = await getDocs(qAnnounce);
      setAnnouncements(snapAnnounce.docs.map(d => ({ id: d.id, ...d.data() }))
        .filter(p => p.targetPortal === "Guru" || p.targetPortal === "Semua"));

      // 🔥 CEK SURVEI WAJIB UNTUK GURU
      const qSurvey = query(collection(db, "surveys"), where("status", "==", "aktif"), where("isRequired", "==", true));
      const surveys = (await getDocs(qSurvey)).docs.map(d => ({ id: d.id, ...d.data() }));
      const mandatory = surveys.find(s => {
        if (s.targetType === 'semua_guru' || s.targetType === 'semua') return true;
        return false;
      });
      if (mandatory) {
        const qResp = query(collection(db, "survey_responses"), where("surveyId", "==", mandatory.id), where("userId", "==", guru.id));
        const respSnap = await getDocs(qResp);
        if (respSnap.empty) {
          setMandatorySurvey(mandatory);
          setShowSurveyModal(true);
        }
      }
    } catch (e) { console.error(e); } finally { setLoading(false); }
  }, [guru]);

  useEffect(() => { fetchTeacherProfile(); }, [fetchTeacherProfile]);
  useEffect(() => { if (guru) fetchData(); }, [guru, fetchData]);

  const handleVerifyAndStart = async () => {
    if (!inputToken) return alert("Masukkan kode absensi!");
    try {
      const todayStr = new Date().toISOString().split('T')[0];
      const codeSnap = await getDoc(doc(db, "settings", `daily_code_${todayStr}`));
      if (codeSnap.exists() && inputToken.toUpperCase() === codeSnap.data().code) {
        setMode('session');
        setShowStartModal(false);
        setInputToken("");
      } else alert("❌ KODE SALAH!");
    } catch (e) { alert("Error."); }
  };

  const submitSurvey = async () => {
    if (!mandatorySurvey) return;
    const unanswered = mandatorySurvey.questions.filter((_, i) => surveyAnswers[i] === undefined);
    if (unanswered.length > 0) return alert(`❌ ${unanswered.length} pertanyaan belum dijawab.`);
    try {
      await addDoc(collection(db, "survey_responses"), {
        surveyId: mandatorySurvey.id,
        userId: guru.id,
        userName: guru.nama,
        answers: mandatorySurvey.questions.map((_, i) => ({ questionIndex: i, answer: surveyAnswers[i] })),
        submittedAt: serverTimestamp()
      });
      setShowSurveyModal(false);
      setMandatorySurvey(null);
      alert("✅ Survei berhasil dikirim!");
    } catch (err) { alert("❌ Gagal: " + err.message); }
  };

  if (mode === 'session') {
    return <ClassSession schedule={pendingSchedule} teacher={guru} onBack={() => { setMode('dashboard'); fetchData(); }} />;
  }

  if (loading) return (
    <div style={{ display:'flex', justifyContent:'center', alignItems:'center', height:'80vh' }}>
      <div style={{ width:35, height:35, border:'4px solid #f3f4f6', borderTop:'4px solid #6366f1', borderRadius:'50%', animation:'spin 0.8s linear infinite' }}></div>
    </div>
  );

  return (
    <div style={{ width: '100%' }}>
      {/* HERO SLIDER */}
      {announcements.length > 0 && (
        <div style={{ width:'100%', height:isMobile?200:280, borderRadius:16, overflow:'hidden', position:'relative', marginBottom:20, backgroundColor:'#000' }}>
          <div style={{ display:'flex', width:'100%', height:'100%', transition:'transform 0.8s ease', transform:`translateX(-${activeSlide*100}%)` }}>
            {announcements.map((p, idx) => (
              <div key={idx} style={{ minWidth:'100%', height:'100%', position:'relative', cursor:'pointer' }} onClick={() => setSelectedNews(p)}>
                <img src={p.imageUrl} style={{ width:'100%', height:'100%', objectFit:'cover', opacity:0.7 }} alt="" />
                <div style={{ position:'absolute', inset:0, background:'linear-gradient(to top, rgba(0,0,0,0.9) 10%, transparent 70%)', display:'flex', alignItems:'flex-end', padding:isMobile?16:24 }}>
                  <div style={{ color:'#fff', maxWidth:600 }}>
                    <span style={{ background:'#e11d48', padding:'3px 8px', borderRadius:12, fontSize:9, fontWeight:800, display:'inline-flex', alignItems:'center', gap:4, marginBottom:8 }}><Megaphone size={10}/> Info Akademik</span>
                    <h2 style={{ fontSize:isMobile?15:22, fontWeight:900, margin:'0 0 8px', lineHeight:1.2 }}>{p.title}</h2>
                    <button style={{ background:'white', color:'#000', border:'none', padding:'7px 14px', borderRadius:8, fontWeight:800, fontSize:11, cursor:'pointer', display:'flex', alignItems:'center', gap:4 }}>Baca <ChevronRight size={12}/></button>
                  </div>
                </div>
              </div>
            ))}
          </div>
          {announcements.length > 1 && (
            <div style={{ position:'absolute', bottom:12, left:'50%', transform:'translateX(-50%)', display:'flex', gap:5 }}>
              {announcements.map((_, idx) => (
                <div key={idx} onClick={() => setActiveSlide(idx)} style={{ width:5, height:5, borderRadius:'50%', background: activeSlide===idx?'#fff':'rgba(255,255,255,0.4)', cursor:'pointer', transition:'0.3s' }}></div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* BANNER */}
      <div style={{ background:'linear-gradient(135deg, #1e293b 0%, #334155 100%)', padding:isMobile?16:24, borderRadius:16, color:'white', display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20, flexDirection:isMobile?'column':'row', gap:12 }}>
        <div style={{ flex:1 }}>
          <div style={{ background:'rgba(99,102,241,0.2)', color:'#818cf8', padding:'3px 8px', borderRadius:12, fontSize:9, fontWeight:800, display:'inline-block', marginBottom:8, border:'1px solid rgba(99,102,241,0.3)' }}>Dashboard Instruktur</div>
          <h1 style={{ margin:0, fontSize:isMobile?16:22, fontWeight:900 }}>Assalamu'alaikum, {guru?.nama?.split(' ')[0]}!</h1>
          <p style={{ opacity:0.8, fontSize:12, marginTop:4 }}>Selamat datang di panel manajemen Bimbel Gemilang.</p>
          <div style={{ display:'flex', gap:6, marginTop:12, flexWrap:'wrap' }}>
            <span style={{ background:'rgba(255,255,255,0.1)', padding:'5px 10px', borderRadius:8, fontSize:11, display:'flex', alignItems:'center', gap:4 }}><Calendar size={12}/> {new Date().toLocaleDateString('id-ID', {weekday:'long', day:'numeric', month:'long'})}</span>
            <span style={{ background:'rgba(255,255,255,0.1)', padding:'5px 10px', borderRadius:8, fontSize:11, display:'flex', alignItems:'center', gap:4 }}><Clock size={12}/> {todaySchedules.length} Sesi</span>
          </div>
        </div>
        {!isMobile && <div style={{ background:'rgba(255,255,255,0.03)', borderRadius:16, padding:8 }}>
          <Player autoplay loop src="https://assets10.lottiefiles.com/packages/lf20_m60f0nny.json" style={{ height:100 }} />
        </div>}
      </div>

      {/* GRID */}
      <div style={{ display:'flex', gap:16, flexDirection:isMobile?'column':'row' }}>
        <div style={{ flex:1.5, display:'flex', flexDirection:'column', gap:16 }}>
          <div style={{ background:'white', padding:18, borderRadius:14, border:'1px solid #f1f5f9' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
              <h3 style={{ margin:0, fontSize:15, fontWeight:800, display:'flex', alignItems:'center', gap:8 }}><Layout size={16} color="#6366f1"/> Agenda Mengajar</h3>
              <button onClick={() => navigate('/guru/schedule')} style={{ background:'none', border:'none', color:'#6366f1', fontWeight:700, fontSize:11, cursor:'pointer', display:'flex', alignItems:'center', gap:4 }}>Kalender <ArrowRight size={12}/></button>
            </div>
            {todaySchedules.length === 0 ? (
              <div style={{ textAlign:'center', padding:24, color:'#94a3b8' }}><Info size={24} style={{marginBottom:8}}/><p style={{fontSize:12}}>Tidak ada jadwal hari ini.</p></div>
            ) : todaySchedules.map(item => (
              <div key={item.id} style={{ background:'#f8fafc', padding:'10px 14px', borderRadius:12, display:'flex', alignItems:'center', marginBottom:6, border:'1px solid #f1f5f9' }}>
                <div style={{ width:55, textAlign:'center', fontWeight:900, fontSize:12 }}>{item.start}</div>
                <div style={{ flex:1, paddingLeft:10 }}>
                  <div style={{ fontWeight:800, fontSize:13 }}>{item.title}</div>
                  <div style={{ fontSize:10, color:'#64748b', display:'flex', alignItems:'center', gap:4 }}>{item.program} • <MapPin size={9}/> {item.planet}</div>
                </div>
                <button onClick={() => { setPendingSchedule(item); setShowStartModal(true); }} style={{ background:'#10b981', color:'white', border:'none', padding:'7px 12px', borderRadius:8, fontWeight:800, fontSize:10, cursor:'pointer', whiteSpace:'nowrap' }}>MULAI</button>
              </div>
            ))}
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
            <div onClick={() => navigate('/guru/modul')} style={{ background:'white', padding:14, borderRadius:12, cursor:'pointer', border:'1px solid #f1f5f9', textAlign:'center' }}>
              <div style={{ width:36, height:36, borderRadius:10, background:'#eef2ff', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 6px' }}><BookOpen size={18} color="#6366f1"/></div>
              <b style={{ fontSize:12 }}>E-Learning</b>
              <p style={{ fontSize:9, color:'#64748b', margin:'2px 0 0' }}>Materi & Modul</p>
            </div>
            <div onClick={() => navigate('/guru/grades/input')} style={{ background:'white', padding:14, borderRadius:12, cursor:'pointer', border:'1px solid #f1f5f9', textAlign:'center' }}>
              <div style={{ width:36, height:36, borderRadius:10, background:'#fffbeb', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 6px' }}><Star size={18} color="#f59e0b"/></div>
              <b style={{ fontSize:12 }}>Input Nilai</b>
              <p style={{ fontSize:9, color:'#64748b', margin:'2px 0 0' }}>Evaluasi Siswa</p>
            </div>
          </div>
        </div>
        <div style={{ flex:1 }}>
          <div style={{ background:'white', padding:18, borderRadius:14, border:'1px solid #f1f5f9' }}>
            <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:12 }}>
              <Megaphone size={18} color="#e11d48"/><h3 style={{ margin:0, fontWeight:800, fontSize:14 }}>Informasi Terbaru</h3>
            </div>
            {announcements.slice(0,4).map(p => (
              <div key={p.id} style={{ display:'flex', gap:8, padding:8, cursor:'pointer', borderRadius:10, border:'1px solid #f1f5f9', marginBottom:6 }} onClick={() => setSelectedNews(p)}>
                <img src={p.imageUrl} style={{ width:44, height:44, borderRadius:8, objectFit:'cover' }} alt="" />
                <div style={{ flex:1 }}><b style={{ fontSize:11 }}>{p.title}</b><div style={{ fontSize:9, color:'#94a3b8', marginTop:2 }}>{p.createdAt?.toDate ? new Date(p.createdAt.toDate()).toLocaleDateString('id-ID') : ''}</div></div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* MODAL BERITA */}
      {selectedNews && (
        <div onClick={() => setSelectedNews(null)} style={{ position:'fixed', inset:0, background:'rgba(15,23,42,0.9)', display:'flex', justifyContent:'center', alignItems:'center', zIndex:9999, padding:16 }}>
          <div onClick={e => e.stopPropagation()} style={{ background:'white', borderRadius:16, overflow:'hidden', width:'90%', maxWidth:500 }}>
            <button onClick={() => setSelectedNews(null)} style={{ position:'absolute', top:8, right:8, background:'rgba(255,255,255,0.8)', border:'none', borderRadius:'50%', width:26, height:26, cursor:'pointer', zIndex:1 }}><X size={14}/></button>
            <img src={selectedNews.imageUrl} style={{ width:'100%', maxHeight:220, objectFit:'cover' }} alt="" />
            <div style={{ padding:16 }}><span style={{ fontSize:8, color:'#6366f1', fontWeight:800 }}>Official Admin</span><h2 style={{ margin:'4px 0 8px', fontSize:18, fontWeight:900 }}>{selectedNews.title}</h2><p style={{ fontSize:13, color:'#475569', lineHeight:1.5, whiteSpace:'pre-wrap' }}>{selectedNews.content}</p></div>
          </div>
        </div>
      )}

      {/* MODAL KODE ABSENSI */}
      {showStartModal && (
        <div style={{ position:'fixed', inset:0, background:'rgba(15,23,42,0.9)', display:'flex', justifyContent:'center', alignItems:'center', zIndex:9999, padding:16 }}>
          <div style={{ background:'white', padding:24, borderRadius:16, width:'90%', maxWidth:320, textAlign:'center' }}>
            <h3 style={{ margin:'0 0 6px', fontWeight:900 }}>Otentikasi Kelas</h3>
            <p style={{ fontSize:11, color:'#64748b', marginBottom:16 }}>Masukkan kode absensi harian.</p>
            <input type="text" value={inputToken} onChange={e => setInputToken(e.target.value.toUpperCase())} style={{ width:'100%', padding:12, fontSize:22, textAlign:'center', borderRadius:10, border:'2px solid #e2e8f0', outline:'none', fontWeight:900 }} placeholder="KODE" maxLength={6} />
            <div style={{ display:'flex', gap:8, marginTop:16 }}>
              <button onClick={() => setShowStartModal(false)} style={{ flex:1, padding:10, background:'#f1f5f9', color:'#64748b', border:'none', borderRadius:8, fontWeight:700, fontSize:12 }}>BATAL</button>
              <button onClick={handleVerifyAndStart} style={{ flex:2, padding:10, background:'#6366f1', color:'white', border:'none', borderRadius:8, fontWeight:800, fontSize:12 }}>VERIFIKASI</button>
            </div>
          </div>
        </div>
      )}

      {/* 🔥 MODAL SURVEI WAJIB UNTUK GURU */}
      {showSurveyModal && mandatorySurvey && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.7)', zIndex:3000, display:'flex', justifyContent:'center', alignItems:'center', padding:16 }}>
          <div style={{ background:'white', borderRadius:14, padding:20, width:'100%', maxWidth:480, maxHeight:'80vh', overflowY:'auto' }}>
            <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:16 }}>
              <span style={{ fontSize:22 }}>📋</span>
              <div>
                <h2 style={{ margin:0, fontSize:16, fontWeight:800 }}>{mandatorySurvey.title}</h2>
                <p style={{ margin:0, fontSize:10, color:'#ef4444', fontWeight:700 }}>🔴 WAJIB DIISI</p>
              </div>
            </div>
            {mandatorySurvey.questions.map((q, qIdx) => (
              <div key={qIdx} style={{ marginBottom:12 }}>
                <p style={{ fontWeight:700, fontSize:12, marginBottom:4 }}>{qIdx+1}. {q.question}</p>
                {q.options.filter(o=>o).map((opt, oIdx) => (
                  <label key={oIdx} style={{ display:'flex', alignItems:'center', gap:6, padding:'7px 10px', marginBottom:3, borderRadius:6, cursor:'pointer', background:surveyAnswers[qIdx]===opt?'#eef2ff':'#f8fafc', border:`1px solid ${surveyAnswers[qIdx]===opt?'#3b82f6':'#e2e8f0'}`, fontSize:11 }}>
                    <input type="radio" name={`q-${qIdx}`} checked={surveyAnswers[qIdx]===opt} onChange={()=>setSurveyAnswers({...surveyAnswers,[qIdx]:opt})} style={{width:14,height:14}} />
                    {opt}
                  </label>
                ))}
              </div>
            ))}
            <button onClick={submitSurvey} style={{ width:'100%', padding:10, background:'#3b82f6', color:'white', border:'none', borderRadius:8, fontWeight:700, fontSize:12, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:4, marginTop:8 }}>
              <Send size={13} /> Kirim Jawaban
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeacherDashboard;