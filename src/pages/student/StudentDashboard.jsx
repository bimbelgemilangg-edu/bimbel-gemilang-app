import React, { useState, useEffect } from 'react';
import SidebarSiswa from '../../components/SidebarSiswa';
import { db } from '../../firebase';
import { collection, query, getDocs, orderBy, doc, getDoc, setDoc, addDoc, serverTimestamp, where } from "firebase/firestore";
import { Html5Qrcode } from "html5-qrcode";
import StudentFinanceSiswa from './StudentFinance';
import StudentGrades from './StudentGrades';
import StudentSchedule from './StudentSchedule';
import StudentAttendanceSiswa from './StudentAttendance';
import StudentElearning from './StudentElearning'; 
import { BookOpen, Calendar, Clock, GraduationCap, Menu, ChevronRight, ClipboardList, X, Camera, User, MapPin, Send, CheckCircle } from 'lucide-react';
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
  const [studentProfile, setStudentProfile] = useState(null);
  const [isScanning, setIsScanning] = useState(false);
  const [selectedNews, setSelectedNews] = useState(null);

  // 🔥 SURVEI — tampil langsung di dashboard
  const [activeSurveys, setActiveSurveys] = useState([]);
  const [filledSurveys, setFilledSurveys] = useState({});

  useEffect(() => { const h = () => setWindowWidth(window.innerWidth); window.addEventListener('resize', h); return () => window.removeEventListener('resize', h); }, []);
  const isMobile = windowWidth <= 768;

  // QR SCANNER
  useEffect(() => {
    let html5QrCode = null;
    const start = async () => {
      try {
        html5QrCode = new Html5Qrcode("reader");
        await html5QrCode.start({ facingMode: "environment" }, { fps: 10, qrbox: { width: 250, height: 250 } },
          async (decodedText) => {
            try {
              const data = JSON.parse(decodedText);
              if (data.type === "ABSENSI_BIMBEL") {
                const today = new Date().toISOString().split('T')[0];
                await setDoc(doc(db, "attendance", `${studentId}_${today}_${data.scheduleId || ''}`), {
                  studentId, studentName, teacherName: data.teacher, date: today, tanggal: today,
                  timestamp: serverTimestamp(), status: "Hadir", mapel: data.mapel,
                  scheduleId: data.scheduleId || '', keterangan: "Scan QR"
                }, { merge: true });
                alert(`✅ Absen: ${data.mapel}`);
                stop();
              }
            } catch (err) {}
          }, () => {});
      } catch (err) {}
    };
    const stop = async () => {
      if (html5QrCode && html5QrCode.isScanning) { try { await html5QrCode.stop(); html5QrCode.clear(); } catch (err) {} }
      setIsScanning(false);
    };
    if (isScanning) start();
    return () => { if (html5QrCode) stop(); };
  }, [isScanning, studentId, studentName]);

  const formatDate = (ts) => { if (!ts) return "-"; const d = ts.toDate ? ts.toDate() : new Date(ts); return d.toLocaleDateString('id-ID', { day:'2-digit', month:'short', hour:'2-digit', minute:'2-digit' }); };

  useEffect(() => {
    const fetchAll = async () => {
      if (!studentId) return;
      setLoading(true);
      try {
        // PROFILE
        const sSnap = await getDoc(doc(db, "students", studentId));
        let curKat = "Semua", curKel = "Semua";
        if (sSnap.exists()) { const d = sSnap.data(); setStudentProfile(d); curKat = d.kategori || "Semua"; curKel = d.kelasSekolah || "Semua"; }

        // POSTER
        setPosters((await getDocs(query(collection(db,"student_contents"), orderBy("createdAt","desc")))).docs.map(d=>({id:d.id,...d.data()})));

        // JADWAL
        const todayStr = new Date().toISOString().split('T')[0];
        const scheds = (await getDocs(query(collection(db,"jadwal_bimbel"), where("dateStr","==",todayStr)))).docs.map(d=>({id:d.id,...d.data()}))
          .filter(sch => sch.students?.some(s => s.id === studentId || s === studentId));
        setTodaySchedules(scheds.slice(0,5));

        // TUGAS
        const moduls = (await getDocs(query(collection(db,"bimbel_modul"), where("targetKategori","in",["Semua",curKat]), orderBy("createdAt","desc"), limit(10)))).docs.map(d=>({id:d.id,...d.data()}));
        setTasks(moduls.filter(m=>m.quizData?.length>0||m.blocks?.some(b=>b.type==='assignment')).slice(0,5));

        // 🔥 SURVEI AKTIF — TAMPIL SEMUA
        const allSurveys = (await getDocs(query(collection(db,"surveys"), where("status","==","aktif")))).docs.map(d=>({id:d.id,...d.data()}));
        console.log('📋 SEMUA SURVEI AKTIF:', allSurveys.length, allSurveys.map(s=>s.title));
        
        // Filter yang cocok dengan siswa
        const cocok = allSurveys.filter(s => {
          if (s.targetType === 'semua_siswa' || s.targetType === 'semua') return true;
          if (s.targetType === 'jenjang' && (s.targetKelas === 'Semua' || s.targetKelas === curKel)) return true;
          return false;
        });
        console.log('🎯 SURVEI COCOK:', cocok.length, cocok.map(s=>s.title));
        setActiveSurveys(cocok);

        // Cek yang sudah diisi
        const filled = {};
        for (const s of cocok) {
          const respSnap = await getDocs(query(collection(db,"survey_responses"), where("surveyId","==",s.id), where("userId","==",studentId)));
          if (!respSnap.empty) filled[s.id] = true;
        }
        setFilledSurveys(filled);
      } catch (err) { console.error(err); } finally { setLoading(false); }
    };
    fetchAll();
  }, [studentId]);

  return (
    <div style={{display:'flex',minHeight:'100vh',background:'#f8fafc',position:'relative'}}>
      <SidebarSiswa activeMenu={activeMenu} setActiveMenu={(m)=>{setActiveMenu(m);if(isMobile)setIsSidebarOpen(false);}} isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />
      {isMobile&&<button onClick={()=>setIsSidebarOpen(true)} style={{position:'fixed',top:15,left:15,zIndex:900,background:'#1e293b',color:'white',border:'none',padding:10,borderRadius:10}}><Menu size={24}/></button>}
      <div style={{marginLeft:isMobile?0:260,width:isMobile?'100%':'calc(100% - 260px)',padding:isMobile?15:30,paddingTop:isMobile?70:30,boxSizing:'border-box'}}>
        
        {loading ? (
          <div style={{textAlign:'center',padding:80}}><div style={{width:36,height:36,border:'4px solid #e2e8f0',borderTop:'4px solid #3b82f6',borderRadius:'50%',animation:'spin 0.8s linear infinite',margin:'0 auto 12px'}}></div><p>Memuat...</p></div>
        ) : (
          <div style={{display:'flex',flexDirection:'column',gap:20}}>
            {/* HEADER */}
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
              <div><h1 style={{fontSize:isMobile?22:28,fontWeight:800,color:'#1e293b',margin:0}}>Halo, {studentName}! 👋</h1><p style={{color:'#64748b'}}>{studentProfile?`${studentProfile.kategori} - ${studentProfile.kelasSekolah}`:''}</p></div>
              {!isMobile&&<button onClick={()=>setIsScanning(true)} style={{display:'flex',alignItems:'center',gap:8,background:'#3498db',color:'white',border:'none',padding:'8px 16px',borderRadius:100,fontWeight:'bold',cursor:'pointer'}}><Camera size={18}/> SCAN ABSEN</button>}
            </div>

            {/* CAROUSEL */}
            {posters.length>0&&<div style={{borderRadius:15,overflow:'hidden',aspectRatio:isMobile?'4/3':'21/9'}}>
              <Swiper modules={[Navigation,Pagination,Autoplay,EffectFade]} effect="fade" autoplay={{delay:5000}} loop={posters.length>1} style={{width:'100%',height:'100%'}}>
                {posters.map(p=><SwiperSlide key={p.id}><div style={{width:'100%',height:'100%',backgroundImage:`url(${p.imageUrl})`,backgroundSize:'cover',backgroundPosition:'center',display:'flex',alignItems:'flex-end'}}><div style={{width:'100%',background:'linear-gradient(transparent,rgba(0,0,0,0.8))',padding:20,color:'white'}}><h2 style={{fontSize:isMobile?16:24}}>{p.title}</h2></div></div></SwiperSlide>)}
              </Swiper>
            </div>}

            {/* 🔥 SURVEI SECTION — MUNCUL DI SINI */}
            {activeSurveys.length > 0 && (
              <div style={{background:'white',padding:20,borderRadius:15,border:'1px solid #e2e8f0',borderTop:'4px solid #3b82f6'}}>
                <h3 style={{margin:'0 0 15px',fontSize:16,fontWeight:800,display:'flex',alignItems:'center',gap:8}}><ClipboardList size={20} color="#3b82f6"/> Survei Aktif</h3>
                <div style={{display:'flex',flexDirection:'column',gap:10}}>
                  {activeSurveys.map(survey => {
                    const isFilled = filledSurveys[survey.id];
                    return (
                      <div key={survey.id} style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:14,background:isFilled?'#f0fdf4':'#fffbeb',borderRadius:12,border:`1px solid ${isFilled?'#bbf7d0':'#fde68a'}`,flexWrap:'wrap',gap:10}}>
                        <div style={{flex:1}}>
                          <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:4}}>
                            {isFilled ? <CheckCircle size={16} color="#10b981"/> : <Send size={16} color="#f59e0b"/>}
                            <strong style={{fontSize:14}}>{survey.title}</strong>
                            {survey.isRequired && <span style={{background:'#fee2e2',color:'#ef4444',padding:'2px 8px',borderRadius:6,fontSize:9,fontWeight:800}}>WAJIB</span>}
                          </div>
                          <div style={{fontSize:11,color:'#64748b'}}>{survey.questions?.length||0} pertanyaan • {survey.targetType==='semua_siswa'?'Semua Siswa':survey.targetType==='jenjang'?survey.targetKelas:survey.targetType}</div>
                        </div>
                        {isFilled ? (
                          <span style={{color:'#10b981',fontWeight:700,fontSize:12}}>✅ Terisi</span>
                        ) : (
                          <OpenSurveyButton survey={survey} studentId={studentId} studentName={studentName} />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* JADWAL & TUGAS */}
            <div style={{display:'grid',gridTemplateColumns:isMobile?'1fr':'1.2fr 0.8fr',gap:20}}>
              <div style={{display:'flex',flexDirection:'column',gap:20}}>
                <div style={{background:'white',padding:20,borderRadius:15,border:'1px solid #e2e8f0'}}>
                  <h3 style={{fontSize:16,fontWeight:700,margin:'0 0 15px'}}><Calendar size={20} color="#3498db"/> Jadwal Hari Ini</h3>
                  {todaySchedules.length===0?<p style={{color:'#94a3b8',textAlign:'center'}}>📭 Tidak ada jadwal</p>:todaySchedules.map((s,i)=>(<div key={i} style={{display:'flex',gap:12,padding:'10px 0',borderBottom:'1px solid #f1f5f9'}}><b style={{width:50}}>{s.start}</b><div><b>{s.title||'Kelas'}</b><div style={{fontSize:11,color:'#64748b'}}>{s.planet} • {s.booker}</div></div></div>))}
                </div>
                <div style={{background:'white',padding:20,borderRadius:15,border:'1px solid #e2e8f0'}}>
                  <h3 style={{fontSize:16,fontWeight:700,margin:'0 0 15px'}}><ClipboardList size={20} color="#9b59b6"/> Tugas</h3>
                  {tasks.length===0?<p style={{color:'#94a3b8',textAlign:'center'}}>📭 Tidak ada tugas</p>:tasks.map((t,i)=>(<div key={i} style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:10,background:'#f8fafc',borderRadius:10,borderLeft:'4px solid #9b59b6',marginBottom:8}}><span style={{fontWeight:700,fontSize:13}}>{t.title}</span><button onClick={()=>setActiveMenu('materi')} style={{background:'#9b59b6',color:'white',border:'none',padding:'6px 12px',borderRadius:6,fontSize:11,fontWeight:600,cursor:'pointer'}}>Buka</button></div>))}
                </div>
              </div>
              <div style={{display:'flex',flexDirection:'column',gap:20}}>
                <div style={{background:'white',padding:20,borderRadius:15,border:'1px solid #e2e8f0'}}>
                  <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:15}}><div style={{width:45,height:45,borderRadius:'50%',background:'#3b82f6',color:'white',display:'flex',alignItems:'center',justifyContent:'center',fontWeight:'bold',fontSize:18}}>{studentName?.charAt(0)}</div><b>{studentName}</b></div>
                  <button onClick={()=>setActiveMenu('materi')} style={{width:'100%',padding:12,background:'#3b82f6',color:'white',border:'none',borderRadius:10,fontWeight:600,cursor:'pointer'}}><BookOpen size={16}/> Buka Materi Belajar</button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* MODAL SCANNER */}
        {isScanning&&<div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.7)',zIndex:2000,display:'flex',justifyContent:'center',alignItems:'center'}} onClick={()=>setIsScanning(false)}><div style={{background:'white',padding:20,borderRadius:15,width:'90%',maxWidth:400}} onClick={e=>e.stopPropagation()}><h3>Scan QR</h3><div id="reader" style={{width:'100%',borderRadius:10,overflow:'hidden'}}></div></div></div>}
        {isMobile&&<button onClick={()=>setIsScanning(true)} style={{position:'fixed',bottom:20,right:20,width:56,height:56,borderRadius:'50%',background:'#3498db',color:'white',border:'none',fontSize:22,zIndex:900}}><Camera size={22}/></button>}
      </div>
      {isMobile&&isSidebarOpen&&<div onClick={()=>setIsSidebarOpen(false)} style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.5)',zIndex:998}}/>}
    </div>
  );
};

// 🔥 KOMPONEN TOMBOL ISI SURVEI (MODAL POPUP)
const OpenSurveyButton = ({ survey, studentId, studentName }) => {
  const [show, setShow] = useState(false);
  const [answers, setAnswers] = useState({});

  const submit = async () => {
    const unanswered = survey.questions.filter((_,i)=>answers[i]===undefined);
    if (unanswered.length>0) return alert(`❌ ${unanswered.length} pertanyaan belum dijawab`);
    try {
      await addDoc(collection(db,"survey_responses"),{
        surveyId:survey.id, userId:studentId, userName:studentName,
        answers:survey.questions.map((_,i)=>({questionIndex:i,answer:answers[i]})),
        submittedAt:serverTimestamp()
      });
      setShow(false);
      window.location.reload();
    } catch(err){alert("❌ Gagal")}
  };

  return (
    <>
      <button onClick={()=>setShow(true)} style={{background:'#f59e0b',color:'white',border:'none',padding:'8px 16px',borderRadius:8,fontWeight:700,fontSize:12,cursor:'pointer',display:'flex',alignItems:'center',gap:6}}>
        <Send size={14}/> Isi Survei
      </button>
      {show&&(
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.7)',zIndex:3000,display:'flex',justifyContent:'center',alignItems:'center',padding:20}} onClick={()=>setShow(false)}>
          <div style={{background:'white',borderRadius:16,padding:25,width:'100%',maxWidth:500,maxHeight:'80vh',overflowY:'auto'}} onClick={e=>e.stopPropagation()}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:20}}>
              <h2 style={{margin:0,fontSize:18}}>{survey.title}</h2>
              <button onClick={()=>setShow(false)} style={{background:'none',border:'none',cursor:'pointer'}}><X size={20}/></button>
            </div>
            {survey.questions.map((q,i)=>(
              <div key={i} style={{marginBottom:15}}>
                <p style={{fontWeight:700,fontSize:13,marginBottom:6}}>{i+1}. {q.question}</p>
                {q.options.filter(o=>o).map((opt,oi)=>(
                  <label key={oi} style={{display:'flex',alignItems:'center',gap:8,padding:'8px 12px',marginBottom:4,borderRadius:8,cursor:'pointer',background:answers[i]===opt?'#eef2ff':'#f8fafc',border:`1px solid ${answers[i]===opt?'#3b82f6':'#e2e8f0'}`}}>
                    <input type="radio" name={`sq-${i}`} checked={answers[i]===opt} onChange={()=>setAnswers({...answers,[i]:opt})} style={{width:16,height:16}}/>
                    <span style={{fontSize:12}}>{opt}</span>
                  </label>
                ))}
              </div>
            ))}
            <button onClick={submit} style={{width:'100%',padding:12,background:'#3b82f6',color:'white',border:'none',borderRadius:10,fontWeight:700,cursor:'pointer'}}><Send size={14}/> Kirim</button>
          </div>
        </div>
      )}
    </>
  );
};

export default StudentDashboard;