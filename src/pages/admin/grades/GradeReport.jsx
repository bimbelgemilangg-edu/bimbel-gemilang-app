import React, { useState, useEffect } from 'react';
import Sidebar from '../../../components/Sidebar';
import { db } from '../../../firebase';
import { collection, getDocs, query, where } from "firebase/firestore";
import { 
    LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, 
    Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis 
} from 'recharts';

const GradeReport = () => {
  const [students, setStudents] = useState([]);
  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM
  
  // DATA OLAHAN
  const [reportData, setReportData] = useState([]); 
  const [gpaHistory, setGpaHistory] = useState([]); // Untuk Grafik Garis Naik Turun
  const [radarData, setRadarData] = useState([]);   // Untuk Diagram Jaring 5 Aspek
  const [gpaCurrent, setGpaCurrent] = useState(0);
  const [smartNarrative, setSmartNarrative] = useState("");
  const [smartRecommendation, setSmartRecommendation] = useState("");

  // LOAD SISWA
  useEffect(() => {
    getDocs(collection(db, "students")).then(snap => {
        setStudents(snap.docs.map(d => ({id: d.id, ...d.data()})));
    });
  }, []);

  // MESIN PENGOLAH DATA (THE BRAIN)
  useEffect(() => {
    if(!selectedStudentId) return;

    const processData = async () => {
        // 1. Ambil SEMUA nilai siswa ini (untuk grafik historis)
        const q = query(collection(db, "grades"), where("studentId", "==", selectedStudentId));
        const snap = await getDocs(q);
        const allGrades = snap.docs.map(d => d.data());

        // 2. FILTER DATA BULAN INI (Untuk tabel detail)
        const currentGrades = allGrades.filter(g => g.tanggal.startsWith(selectedMonth));
        setReportData(currentGrades);

        // 3. HITUNG GPA HISTORIS (NAIK TURUN)
        // Kelompokkan nilai per bulan
        const historyMap = {};
        allGrades.forEach(g => {
            const monthKey = g.tanggal.slice(0, 7); // "2026-01"
            if(!historyMap[monthKey]) historyMap[monthKey] = [];
            historyMap[monthKey].push(g.nilai);
        });
        
        const historyChartData = Object.keys(historyMap).sort().map(key => {
            const scores = historyMap[key];
            const avg = Math.round(scores.reduce((a,b)=>a+b,0) / scores.length);
            return { bulan: key, GPA: avg };
        });
        setGpaHistory(historyChartData);

        // 4. HITUNG 5 ASPEK (RADAR CHART)
        // Kita ambil rata-rata aspek DARI BULAN INI SAJA
        let aspekSum = { pemahaman:0, aplikasi:0, literasi:0, inisiatif:0, mandiri:0 };
        let count = 0;
        
        currentGrades.forEach(g => {
            if(g.qualitative) {
                aspekSum.pemahaman += g.qualitative.pemahaman || 0;
                aspekSum.aplikasi += g.qualitative.aplikasi || 0;
                aspekSum.literasi += g.qualitative.literasi || 0;
                aspekSum.inisiatif += g.qualitative.inisiatif || 0;
                aspekSum.mandiri += g.qualitative.mandiri || 0;
                count++;
            }
        });

        if(count > 0) {
            setRadarData([
                { subject: 'Pemahaman', A: (aspekSum.pemahaman/count).toFixed(1), fullMark: 5 },
                { subject: 'Logika/Aplikasi', A: (aspekSum.aplikasi/count).toFixed(1), fullMark: 5 },
                { subject: 'Literasi', A: (aspekSum.literasi/count).toFixed(1), fullMark: 5 },
                { subject: 'Inisiatif', A: (aspekSum.inisiatif/count).toFixed(1), fullMark: 5 },
                { subject: 'Kemandirian', A: (aspekSum.mandiri/count).toFixed(1), fullMark: 5 },
            ]);
        } else {
            setRadarData([]);
        }

        // 5. GENERATE SMART NARRATIVE
        if(currentGrades.length > 0) {
            // Hitung GPA Bulan Ini
            const avgCurrent = Math.round(currentGrades.reduce((a,b)=>a+b.nilai,0) / currentGrades.length);
            setGpaCurrent(avgCurrent);

            // Analisis Deskriptif
            let narasi = `Bulan ini ananda mengikuti ${currentGrades.length} sesi penilaian. Secara umum, performa akademik `;
            if(avgCurrent >= 85) narasi += "SANGAT MEMUASKAN dengan pemahaman konsep yang kuat.";
            else if(avgCurrent >= 75) narasi += "SUDAH BAIK, namun perlu konsistensi lebih lanjut.";
            else narasi += "PERLU PERHATIAN, terutama pada penguasaan dasar materi.";

            // Analisis Aspek Terlemah
            if(count > 0) {
                const weakAspects = [];
                if((aspekSum.mandiri/count) < 3) weakAspects.push("Kemandirian Belajar");
                if((aspekSum.aplikasi/count) < 3) weakAspects.push("Logika Penyelesaian Soal");
                
                if(weakAspects.length > 0) {
                    setSmartRecommendation(`🔴 PERLU DITINGKATKAN: Mohon bantuan Orang Tua untuk memantau aspek ${weakAspects.join(" dan ")} di rumah agar hasil belajar lebih optimal.`);
                } else {
                    setSmartRecommendation("🟢 REKOMENDASI: Pertahankan ritme belajar saat ini. Ananda sudah menunjukkan keseimbangan yang baik antara akademik dan sikap.");
                }
            }
            setSmartNarrative(narasi);
        } else {
            setGpaCurrent(0);
            setSmartNarrative("Belum ada data penilaian akademik bulan ini.");
            setSmartRecommendation("-");
        }
    };

    processData();
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

            {/* CONTROLLER (NO PRINT) */}
            <div className="no-print" style={{background:'white', padding:20, borderRadius:10, marginBottom:20, display:'flex', gap:15, alignItems:'center', boxShadow:'0 2px 5px rgba(0,0,0,0.05)'}}>
                <select value={selectedStudentId} onChange={e=>setSelectedStudentId(e.target.value)} style={{padding:10, borderRadius:5, border:'1px solid #ccc', minWidth:250}}>
                    <option value="">-- Pilih Siswa --</option>
                    {students.map(s => <option key={s.id} value={s.id}>{s.nama}</option>)}
                </select>
                <input type="month" value={selectedMonth} onChange={e=>setSelectedMonth(e.target.value)} style={{padding:10, borderRadius:5, border:'1px solid #ccc'}} />
                <button onClick={()=>window.print()} style={{background:'#2c3e50', color:'white', border:'none', padding:'10px 20px', borderRadius:5, cursor:'pointer', fontWeight:'bold', marginLeft:'auto'}}>
                    🖨️ CETAK PDF
                </button>
            </div>

            {selectedStudentId && (
                <div className="print-container">
                    
                    {/* === HALAMAN 1: RINGKASAN EKSEKUTIF === */}
                    <div style={{background:'white', padding:40, minHeight:'297mm', position:'relative'}}>
                        {/* KOP */}
                        <div style={{textAlign:'center', borderBottom:'4px double #2c3e50', paddingBottom:15, marginBottom:30}}>
                            <h1 style={{margin:0, color:'#2c3e50', letterSpacing:3}}>RAPOR HASIL BELAJAR</h1>
                            <p style={{margin:0, color:'#7f8c8d', fontSize:14}}>BIMBEL GEMILANG - EXECUTIVE SUMMARY ({selectedMonth})</p>
                        </div>

                        {/* INFO SISWA */}
                        <div style={{display:'flex', justifyContent:'space-between', marginBottom:30, borderBottom:'1px solid #eee', paddingBottom:20}}>
                            <div>
                                <h2 style={{margin:0}}>{studentInfo?.nama}</h2>
                                <p style={{margin:0, color:'#666'}}>{studentInfo?.kelasSekolah} | Program: {studentInfo?.detailProgram}</p>
                            </div>
                            <div style={{textAlign:'right'}}>
                                <div style={{background: gpaCurrent>=80?'#27ae60':'#f39c12', color:'white', padding:'5px 20px', borderRadius:20, display:'inline-block'}}>
                                    <small style={{display:'block', fontSize:10, opacity:0.8}}>GPA BULAN INI</small>
                                    <span style={{fontSize:32, fontWeight:'bold'}}>{gpaCurrent}</span>
                                </div>
                            </div>
                        </div>

                        {/* GRAFIK 1: TREN PERFORMA (GPA NAIK TURUN) */}
                        <div style={{marginBottom:30}}>
                            <h4 style={{borderLeft:'5px solid #3498db', paddingLeft:10, color:'#2c3e50'}}>📈 Tren Performa Akademik (GPA)</h4>
                            <div style={{height:250, border:'1px solid #eee', padding:10, borderRadius:10}}>
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={gpaHistory}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="bulan" fontSize={12}/>
                                        <YAxis domain={[0, 100]} />
                                        <Tooltip />
                                        <Line type="monotone" dataKey="GPA" stroke="#3498db" strokeWidth={3} activeDot={{ r: 8 }} />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* GRAFIK 2: RADAR 5 ASPEK */}
                        <div style={{display:'flex', gap:20, marginBottom:30}}>
                            <div style={{flex:1}}>
                                <h4 style={{borderLeft:'5px solid #e67e22', paddingLeft:10, color:'#2c3e50'}}>🕸️ Peta Kompetensi Siswa</h4>
                                <div style={{height:300, border:'1px solid #eee', borderRadius:10}}>
                                    <ResponsiveContainer width="100%" height="100%">
                                        <RadarChart outerRadius={90} data={radarData}>
                                            <PolarGrid />
                                            <PolarAngleAxis dataKey="subject" fontSize={11} />
                                            <PolarRadiusAxis angle={30} domain={[0, 5]} />
                                            <Radar name="Siswa" dataKey="A" stroke="#e67e22" fill="#e67e22" fillOpacity={0.6} />
                                            <Tooltip />
                                        </RadarChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                            
                            {/* NARASI SMART */}
                            <div style={{flex:1, display:'flex', flexDirection:'column', justifyContent:'center'}}>
                                <div style={{background:'#f8f9fa', padding:20, borderRadius:10, marginBottom:15}}>
                                    <h4 style={{margin:'0 0 10px 0', color:'#2c3e50'}}>📝 Kesimpulan Akademik</h4>
                                    <p style={{fontSize:14, lineHeight:'1.5', color:'#555'}}>{smartNarrative}</p>
                                </div>
                                <div style={{background:'#fff3e0', padding:20, borderRadius:10, border:'1px solid #ffe0b2'}}>
                                    <h4 style={{margin:'0 0 10px 0', color:'#d35400'}}>💡 Rekomendasi</h4>
                                    <p style={{fontSize:14, lineHeight:'1.5', color:'#d35400', fontStyle:'italic'}}>{smartRecommendation}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* === HALAMAN 2: RINCIAN MAPEL (TABEL) === */}
                    <div className="page-break" style={{background:'white', padding:40, minHeight:'297mm'}}>
                        <h3 style={{borderBottom:'2px solid #ddd', paddingBottom:10, color:'#2c3e50'}}>📚 Rincian Penilaian Per Mata Pelajaran</h3>
                        
                        <table style={{width:'100%', borderCollapse:'collapse', fontSize:13, marginTop:20}}>
                            <thead>
                                <tr style={{background:'#2c3e50', color:'white'}}>
                                    <th style={{padding:12, textAlign:'left'}}>Mapel</th>
                                    <th style={{padding:12, textAlign:'left'}}>Topik Pembelajaran</th>
                                    <th style={{padding:12, textAlign:'center'}}>Nilai</th>
                                    <th style={{padding:12, textAlign:'center'}}>Pemahaman</th>
                                    <th style={{padding:12, textAlign:'center'}}>Logika</th>
                                    <th style={{padding:12, textAlign:'center'}}>Kemandirian</th>
                                </tr>
                            </thead>
                            <tbody>
                                {reportData.length === 0 ? <tr><td colSpan="6" style={{padding:20, textAlign:'center'}}>Belum ada data bulan ini.</td></tr> :
                                reportData.map((item, idx) => (
                                    <tr key={idx} style={{borderBottom:'1px solid #eee', background: idx%2===0?'#fff':'#f9f9f9'}}>
                                        <td style={{padding:12, fontWeight:'bold', color:'#2980b9'}}>{item.mapel}</td>
                                        <td style={{padding:12}}>{item.topik}</td>
                                        <td style={{padding:12, textAlign:'center', fontWeight:'bold', fontSize:14}}>{item.nilai}</td>
                                        {/* Tampilkan Skor Kualitatif (1-5) */}
                                        <td style={{padding:12, textAlign:'center'}}>{item.qualitative?.pemahaman || '-'}</td>
                                        <td style={{padding:12, textAlign:'center'}}>{item.qualitative?.aplikasi || '-'}</td>
                                        <td style={{padding:12, textAlign:'center'}}>{item.qualitative?.mandiri || '-'}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        {/* AREA TANDA TANGAN */}
                        <div style={{marginTop:80, display:'flex', justifyContent:'space-between'}}>
                            <div style={{textAlign:'center', width:250}}>
                                <p style={{marginBottom:80}}>Mengetahui,<br/>Orang Tua / Wali Murid</p>
                                <p style={{borderTop:'1px solid #333', paddingTop:5}}>( ................................. )</p>
                            </div>
                            <div style={{textAlign:'center', width:250}}>
                                <p style={{marginBottom:80}}>Banyuwangi, {new Date().toLocaleDateString('id-ID', {day:'numeric', month:'long', year:'numeric'})}<br/>Bimbel Gemilang</p>
                                <p style={{borderTop:'1px solid #333', paddingTop:5}}>Bagian Akademik</p>
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