import React, { useState, useEffect } from 'react';
import Sidebar from '../../../components/Sidebar';
import { db } from '../../../firebase';
import { collection, getDocs, query, where } from "firebase/firestore";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis } from 'recharts';

const GradeReport = () => {
  const [students, setStudents] = useState([]);
  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM
  
  const [reportData, setReportData] = useState([]); 
  const [subjectAverages, setSubjectAverages] = useState([]); 
  const [attitudeData, setAttitudeData] = useState([]); 
  const [gpa, setGpa] = useState(0);
  const [smartAnalysis, setSmartAnalysis] = useState("");

  useEffect(() => {
    getDocs(collection(db, "students")).then(snap => {
        setStudents(snap.docs.map(d => ({id: d.id, ...d.data()})));
    });
  }, []);

  useEffect(() => {
    if(!selectedStudentId) return;

    const processGrades = async () => {
        const q = query(collection(db, "grades"), where("studentId", "==", selectedStudentId));
        const snap = await getDocs(q);
        const allGrades = snap.docs.map(d => d.data());

        const monthGrades = allGrades.filter(g => g.tanggal.startsWith(selectedMonth));
        
        const mapelGroups = {};
        monthGrades.forEach(g => {
            if(!mapelGroups[g.mapel]) mapelGroups[g.mapel] = [];
            mapelGroups[g.mapel].push(g.nilai);
        });

        const averages = [];
        let totalSum = 0;
        let subjectsCount = 0;

        Object.keys(mapelGroups).forEach(mapel => {
            const scores = mapelGroups[mapel];
            const avg = scores.reduce((a,b)=>a+b,0) / scores.length;
            averages.push({ name: mapel, nilai: Math.round(avg) });
            totalSum += avg;
            subjectsCount++;
        });

        setSubjectAverages(averages); 

        const finalGpa = subjectsCount > 0 ? Math.round(totalSum / subjectsCount) : 0;
        setGpa(finalGpa);

        let attSum = { pemahaman:0, keaktifan:0, disiplin:0, tugas:0, mandiri:0 };
        let count = 0;
        monthGrades.forEach(g => {
            if(g.qualitative) {
                attSum.pemahaman += g.qualitative.pemahaman || 0;
                attSum.keaktifan += g.qualitative.keaktifan || 0;
                attSum.disiplin += g.qualitative.disiplin || 0;
                attSum.tugas += g.qualitative.tugas || 0;
                attSum.mandiri += g.qualitative.mandiri || 0;
                count++;
            }
        });

        const attAvg = count > 0 ? [
            { subject: 'Pemahaman', A: (attSum.pemahaman/count).toFixed(1), fullMark: 5 },
            { subject: 'Keaktifan', A: (attSum.keaktifan/count).toFixed(1), fullMark: 5 },
            { subject: 'Disiplin', A: (attSum.disiplin/count).toFixed(1), fullMark: 5 },
            { subject: 'Tugas', A: (attSum.tugas/count).toFixed(1), fullMark: 5 },
            { subject: 'Mandiri', A: (attSum.mandiri/count).toFixed(1), fullMark: 5 },
        ] : [];
        setAttitudeData(attAvg);

        let text = "Belum ada data pembelajaran bulan ini.";
        if (subjectsCount > 0) {
            if(finalGpa >= 90) text = "LUAR BIASA! Ananda menunjukkan performa akademik yang sangat unggul bulan ini. Pemahaman konsep sangat kuat di hampir semua mata pelajaran yang diikuti.";
            else if(finalGpa >= 80) text = "BAIK SEKALI. Ananda konsisten dalam pembelajaran. Pertahankan semangat ini dan tingkatkan ketelitian pada soal-soal kompleks.";
            else if(finalGpa >= 70) text = "CUKUP BAIK. Ananda mampu mengikuti materi dasar. Perlu latihan tambahan di rumah untuk memperkuat fondasi konsep yang belum stabil.";
            else text = "PERLU PERHATIAN. Ananda membutuhkan bimbingan intensif dan motivasi lebih. Mohon kerjasama Ayah/Bunda untuk mendampingi waktu belajar di rumah.";
        }
        setSmartAnalysis(text);
        setReportData(monthGrades.sort((a,b) => new Date(a.tanggal) - new Date(b.tanggal)));
    };

    processGrades();
  }, [selectedStudentId, selectedMonth]);

  const studentInfo = students.find(s => s.id === selectedStudentId);

  return (
    <div style={{display:'flex'}}>
        <Sidebar />
        <div style={{marginLeft:250, padding:30, width:'100%', background:'#f4f7f6', minHeight:'100vh', fontFamily:'Segoe UI, sans-serif'}}>
            
            <style>{`
                @media print {
                    .no-print { display: none !important; }
                    .page-break { page-break-before: always; }
                    body { background: white; -webkit-print-color-adjust: exact; }
                    .print-container { padding: 0 !important; margin: 0 !important; }
                }
            `}</style>

            <div className="no-print" style={{background:'white', padding:20, borderRadius:10, marginBottom:20, display:'flex', gap:15, alignItems:'center', boxShadow:'0 2px 5px rgba(0,0,0,0.05)'}}>
                <select value={selectedStudentId} onChange={e=>setSelectedStudentId(e.target.value)} style={{padding:10, borderRadius:5, border:'1px solid #ccc', minWidth:250}}>
                    <option value="">-- Pilih Siswa --</option>
                    {students.map(s => <option key={s.id} value={s.id}>{s.nama}</option>)}
                </select>
                <input type="month" value={selectedMonth} onChange={e=>setSelectedMonth(e.target.value)} style={{padding:10, borderRadius:5, border:'1px solid #ccc'}} />
                <button onClick={()=>window.print()} style={{background:'#2c3e50', color:'white', border:'none', padding:'10px 20px', borderRadius:5, cursor:'pointer', fontWeight:'bold', marginLeft:'auto'}}>
                    🖨️ CETAK / PDF
                </button>
            </div>

            {selectedStudentId && (
                <div className="print-container">
                    <div style={{background:'white', padding:40, minHeight:'297mm', position:'relative'}}>
                        <div style={{textAlign:'center', borderBottom:'3px solid #2c3e50', paddingBottom:15, marginBottom:30}}>
                            <h1 style={{margin:0, color:'#2c3e50', letterSpacing:2}}>RAPOR PROGRES BELAJAR</h1>
                            <p style={{margin:0, color:'#7f8c8d'}}>BIMBEL GEMILANG - Laporan Bulanan ({selectedMonth})</p>
                        </div>
                        <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:30}}>
                            <div>
                                <h2 style={{margin:0}}>{studentInfo?.nama}</h2>
                                <p style={{margin:0, color:'#555'}}>{studentInfo?.kelasSekolah} | {studentInfo?.detailProgram}</p>
                            </div>
                            <div style={{textAlign:'right'}}>
                                <div style={{background:'#27ae60', color:'white', padding:'10px 25px', borderRadius:10}}>
                                    <small>Performance Score</small>
                                    <h1 style={{margin:0, fontSize:40}}>{gpa}</h1>
                                </div>
                            </div>
                        </div>
                        <div style={{background:'#f8f9fa', padding:20, borderRadius:10, borderLeft:'5px solid #3498db', marginBottom:40}}>
                            <h4 style={{marginTop:0, color:'#2980b9'}}>💡 Analisis Instruktur</h4>
                            <p style={{margin:0, lineHeight:'1.6', fontSize:14}}>{smartAnalysis}</p>
                        </div>
                        <div style={{display:'flex', gap:20, height:300, marginBottom:20}}>
                            <div style={{flex:1}}>
                                <h4 style={{textAlign:'center', margin:'0 0 10px 0'}}>Capaian Akademik</h4>
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={subjectAverages} margin={{top:20, right:30, left:0, bottom:5}}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="name" fontSize={10} />
                                        <YAxis domain={[0, 100]} />
                                        <Bar dataKey="nilai" fill="#3498db" barSize={40} label={{ position: 'top' }} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                            <div style={{flex:1}}>
                                <h4 style={{textAlign:'center', margin:'0 0 10px 0'}}>Profil Karakter Belajar</h4>
                                <ResponsiveContainer width="100%" height="100%">
                                    <RadarChart outerRadius={90} data={attitudeData}>
                                        <PolarGrid />
                                        <PolarAngleAxis dataKey="subject" fontSize={11} />
                                        <PolarRadiusAxis angle={30} domain={[0, 5]} />
                                        <Radar name="Siswa" dataKey="A" stroke="#e67e22" fill="#e67e22" fillOpacity={0.6} />
                                    </RadarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>
                    <div className="page-break" style={{background:'white', padding:40, minHeight:'297mm'}}>
                        <h3 style={{borderBottom:'2px solid #ddd', paddingBottom:10}}>📜 Rincian Aktivitas & Nilai</h3>
                        <table style={{width:'100%', borderCollapse:'collapse', fontSize:13}}>
                            <thead>
                                <tr style={{background:'#2c3e50', color:'white'}}>
                                    <th style={{padding:10, textAlign:'left'}}>Tanggal</th>
                                    <th style={{padding:10, textAlign:'left'}}>Mapel</th>
                                    <th style={{padding:10, textAlign:'left'}}>Topik / Materi</th>
                                    <th style={{padding:10, textAlign:'center'}}>Jenis</th>
                                    <th style={{padding:10, textAlign:'center'}}>Nilai</th>
                                </tr>
                            </thead>
                            <tbody>
                                {reportData.length === 0 ? <tr><td colSpan="5" style={{padding:20, textAlign:'center'}}>Belum ada data detail.</td></tr> :
                                reportData.map((item, idx) => (
                                    <tr key={idx} style={{borderBottom:'1px solid #eee'}}>
                                        <td style={{padding:10}}>{new Date(item.tanggal).toLocaleDateString('id-ID')}</td>
                                        <td style={{padding:10, fontWeight:'bold'}}>{item.mapel}</td>
                                        <td style={{padding:10}}>{item.topik || "-"}</td>
                                        <td style={{padding:10, textAlign:'center'}}>
                                            <span style={{background:'#eee', padding:'2px 8px', borderRadius:4, fontSize:11}}>{item.tipe}</span>
                                        </td>
                                        <td style={{padding:10, textAlign:'center', fontWeight:'bold', color: item.nilai<70?'red':'#2c3e50'}}>
                                            {item.nilai}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        <div style={{marginTop:50, display:'flex', justifyContent:'space-between'}}>
                            <div style={{textAlign:'center', width:200}}>
                                <p style={{marginBottom:60}}>Orang Tua/Wali,</p>
                                <p style={{borderTop:'1px solid #333'}}>( ............................. )</p>
                            </div>
                            <div style={{textAlign:'center', width:200}}>
                                <p style={{marginBottom:60}}>Bimbel Gemilang,</p>
                                <p style={{borderTop:'1px solid #333'}}>Admin / Akademik</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    </div>
  );
};

export default GradeReport;