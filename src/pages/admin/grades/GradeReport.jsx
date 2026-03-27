import React, { useState, useEffect, useRef } from 'react';
import SidebarAdmin from '../../../components/SidebarAdmin'; // Update ke SidebarAdmin
import { db } from '../../../firebase';
import { collection, getDocs, query, where } from "firebase/firestore";
import { 
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
    Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis 
} from 'recharts';

// LIBRARY CETAK PDF HD
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

const GradeReport = () => {
  const printRef = useRef(); 
  const [isPrinting, setIsPrinting] = useState(false);

  const [students, setStudents] = useState([]);
  const [filteredStudents, setFilteredStudents] = useState([]); 
  const [searchTerm, setSearchTerm] = useState(""); 

  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7)); 
  
  const [reportData, setReportData] = useState([]); 
  const [gpaHistory, setGpaHistory] = useState([]); 
  const [radarData, setRadarData] = useState([]);   
  const [narrativeTitle, setNarrativeTitle] = useState("");
  const [narrativeBody, setNarrativeBody] = useState("");

  // 1. LOAD SISWA
  useEffect(() => {
    getDocs(collection(db, "students")).then(snap => {
        const data = snap.docs.map(d => ({id: d.id, ...d.data()}));
        setStudents(data);
        setFilteredStudents(data);
    });
  }, []);

  // 2. LOGIKA PENCARIAN SISWA
  useEffect(() => {
    if (searchTerm === "") {
        setFilteredStudents(students);
    } else {
        const lower = searchTerm.toLowerCase();
        const results = students.filter(s => 
            s.nama.toLowerCase().includes(lower) || 
            s.kelasSekolah?.toLowerCase().includes(lower)
        );
        setFilteredStudents(results);
    }
  }, [searchTerm, students]);

  // --- FUNGSI CETAK PDF HD ---
  const handleDownloadPDF = async () => {
    if(!selectedStudentId) return;
    setIsPrinting(true);
    const element = printRef.current;
    const canvas = await html2canvas(element, { scale: 2, useCORS: true, logging: false, backgroundColor: '#ffffff' });
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const heightInPdf = (canvas.height * pdfWidth) / canvas.width;
    
    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, heightInPdf);
    pdf.save(`RAPOR_${students.find(s=>s.id===selectedStudentId)?.nama}_${selectedMonth}.pdf`);
    setIsPrinting(false);
  };

  // --- LOGIKA UTAMA RENDER DATA (SENSITIF - PERTAHANKAN) ---
  useEffect(() => {
    if(!selectedStudentId) return;

    const processData = async () => {
        const q = query(collection(db, "grades"), where("studentId", "==", selectedStudentId));
        const snap = await getDocs(q);
        const allGrades = snap.docs.map(d => d.data());
        allGrades.sort((a,b) => new Date(a.tanggal) - new Date(b.tanggal));

        // Grafik Per Mapel & GPA
        const mapelHistoryMap = {}; 
        allGrades.forEach(g => {
            const monthLabel = new Date(g.tanggal).toLocaleDateString('id-ID', {month:'short', year:'2-digit'}); 
            if(!mapelHistoryMap[monthLabel]) mapelHistoryMap[monthLabel] = { name: monthLabel, rawDate: g.tanggal, sum: 0, count: 0 };
            mapelHistoryMap[monthLabel][g.mapel] = g.nilai;
            mapelHistoryMap[monthLabel].sum += g.nilai;
            mapelHistoryMap[monthLabel].count += 1;
        });

        const finalHistory = Object.values(mapelHistoryMap).sort((a,b) => new Date(a.rawDate) - new Date(b.rawDate));
        setGpaHistory(finalHistory.map(h => ({ name: h.name, GPA: Math.round(h.sum/h.count) })));

        // Data Bulan Ini
        const currentGrades = allGrades.filter(g => g.tanggal.startsWith(selectedMonth));
        setReportData(currentGrades);

        // Narasi & Radar (Logika Asli)
        if(currentGrades.length > 0) {
            const avg = Math.round(currentGrades.reduce((a,b)=>a+b.nilai,0) / currentGrades.length);
            const best = [...currentGrades].sort((a,b) => b.nilai - a.nilai)[0];
            const weak = [...currentGrades].sort((a,b) => a.nilai - b.nilai)[0];

            setNarrativeTitle(avg >= 85 ? "PERFORMA SANGAT BAIK" : avg >= 75 ? "PERFORMA BAIK" : "PERLU PERHATIAN");
            setNarrativeBody(`Pada periode ${selectedMonth}, ananda mencapai rata-rata ${avg}. Kekuatan utama pada ${best.mapel} (Skor: ${best.nilai}). ${weak.nilai < 75 ? `Perlu perhatian pada ${weak.mapel}.` : 'Semua mapel aman.'}`);

            // Radar
            let asp = { pem:0, log:0, lit:0, ini:0, man:0, c:0 };
            currentGrades.forEach(g => {
                if(g.qualitative) {
                    asp.pem += g.qualitative.pemahaman || 0; asp.log += g.qualitative.aplikasi || 0;
                    asp.lit += g.qualitative.literasi || 0; asp.ini += g.qualitative.inisiatif || 0;
                    asp.man += g.qualitative.mandiri || 0; asp.c++;
                }
            });
            setRadarData(asp.c > 0 ? [
                { subject: 'Pemahaman', A: (asp.pem/asp.c).toFixed(1) },
                { subject: 'Logika', A: (asp.log/asp.c).toFixed(1) },
                { subject: 'Literasi', A: (asp.lit/asp.c).toFixed(1) },
                { subject: 'Inisiatif', A: (asp.ini/asp.c).toFixed(1) },
                { subject: 'Mandiri', A: (asp.man/asp.c).toFixed(1) }
            ] : []);
        } else {
            setNarrativeTitle("DATA BELUM TERSEDIA");
            setNarrativeBody("Belum ada penilaian untuk bulan ini.");
            setRadarData([]);
        }
    };
    processData();
  }, [selectedStudentId, selectedMonth]);

  const studentInfo = students.find(s => s.id === selectedStudentId);

  return (
    <div style={{display:'flex', minHeight:'100vh', background:'#555'}}>
        {/* SIDEBAR ADMIN DIPERBAIKI DISINI */}
        <SidebarAdmin />
        
        <div style={{marginLeft:250, padding:30, width:'100%', display:'flex', flexDirection:'column', alignItems:'center'}}>
            
            {/* PANEL KONTROL */}
            <div style={{background:'white', padding:15, borderRadius:8, marginBottom:20, width:'210mm', boxSizing:'border-box', boxShadow:'0 2px 10px rgba(0,0,0,0.2)'}}>
                <div style={{display:'flex', gap:10, marginBottom:10}}>
                    <div style={{flex:1}}>
                        <small style={{fontWeight:'bold'}}>1. Cari Siswa</small>
                        <input type="text" placeholder="🔍 Nama..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} style={{width:'100%', padding:10, border:'1px solid #3498db', borderRadius:5, marginTop:5}} />
                    </div>
                    <div style={{flex:1}}>
                        <small style={{fontWeight:'bold'}}>2. Pilih Daftar</small>
                        <select value={selectedStudentId} onChange={e=>setSelectedStudentId(e.target.value)} style={{width:'100%', padding:10, border:'1px solid #ccc', borderRadius:5, marginTop:5}}>
                            <option value="">-- Pilih Siswa --</option>
                            {filteredStudents.map(s => <option key={s.id} value={s.id}>{s.nama} ({s.kelasSekolah})</option>)}
                        </select>
                    </div>
                </div>
                <div style={{display:'flex', gap:10, alignItems:'end'}}>
                    <div style={{flex:1}}>
                        <small style={{fontWeight:'bold'}}>3. Periode</small>
                        <input type="month" value={selectedMonth} onChange={e=>setSelectedMonth(e.target.value)} style={{width:'100%', padding:9, borderRadius:5, border:'1px solid #ccc'}} />
                    </div>
                    <button onClick={handleDownloadPDF} disabled={!selectedStudentId || isPrinting} style={{flex:1, height:42, background:'#e74c3c', color:'white', border:'none', borderRadius:5, cursor:'pointer', fontWeight:'bold'}}>
                        {isPrinting ? '⏳ Memproses...' : '📄 DOWNLOAD PDF (HD)'}
                    </button>
                </div>
            </div>

            {/* AREA RAPOR A4 */}
            {selectedStudentId && (
                <div ref={printRef} style={{ width: '210mm', minHeight: '297mm', background: 'white', padding: '15mm', boxSizing: 'border-box' }}>
                    <div style={{display:'flex', alignItems:'center', borderBottom:'4px double #2c3e50', paddingBottom:20, marginBottom:30}}>
                        <div style={{flex:1}}>
                            <h1 style={{margin:0, color:'#2c3e50', fontSize:24}}>BIMBEL GEMILANG</h1>
                            <p style={{margin:0, color:'#7f8c8d', fontSize:12}}>Pusat Keunggulan Akademik & Karakter Siswa</p>
                        </div>
                        <div style={{textAlign:'right'}}>
                            <h2 style={{margin:0, color:'#e67e22'}}>RAPOR BULANAN</h2>
                            <p style={{margin:0, fontSize:14}}>Periode: {selectedMonth}</p>
                        </div>
                    </div>

                    <table style={{width:'100%', marginBottom:30, fontSize:14}}>
                        <tbody>
                            <tr>
                                <td style={{width:100, color:'#7f8c8d'}}>Nama Siswa</td>
                                <td style={{fontWeight:'bold'}}>: {studentInfo?.nama}</td>
                                <td style={{width:100, color:'#7f8c8d'}}>Program</td>
                                <td style={{fontWeight:'bold'}}>: {studentInfo?.detailProgram}</td>
                            </tr>
                        </tbody>
                    </table>

                    <div style={{background:'#f4fbf7', border:'1px solid #27ae60', borderRadius:8, padding:20, marginBottom:30}}>
                        <h3 style={{marginTop:0, color:'#27ae60', fontSize:16}}>📢 {narrativeTitle}</h3>
                        <p style={{textAlign:'justify', fontSize:14}}>{narrativeBody}</p>
                    </div>

                    <div style={{display:'flex', gap:20, marginBottom:30, height:220}}>
                        <div style={{flex:1, border:'1px solid #eee', borderRadius:8, padding:10}}>
                            <h4 style={{marginTop:0, fontSize:13, textAlign:'center'}}>TREN AKADEMIK (GPA)</h4>
                            <ResponsiveContainer width="100%" height="85%">
                                <LineChart data={gpaHistory}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="name" fontSize={10}/>
                                    <YAxis domain={[0, 100]} fontSize={10}/>
                                    <Line type="monotone" dataKey="GPA" stroke="#2c3e50" strokeWidth={3} />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                        <div style={{flex:1, border:'1px solid #eee', borderRadius:8, padding:10}}>
                            <h4 style={{marginTop:0, fontSize:13, textAlign:'center'}}>PETA KOMPETENSI</h4>
                            <ResponsiveContainer width="100%" height="85%">
                                <RadarChart outerRadius="70%" data={radarData}>
                                    <PolarGrid />
                                    <PolarAngleAxis dataKey="subject" fontSize={9} />
                                    <Radar name="Siswa" dataKey="A" stroke="#e67e22" fill="#e67e22" fillOpacity={0.6} />
                                </RadarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    <h3 style={{borderLeft:'5px solid #3498db', paddingLeft:10, color:'#2c3e50', fontSize:16}}>📚 Rincian Nilai</h3>
                    <table style={{width:'100%', borderCollapse:'collapse', fontSize:12, marginTop:15}}>
                        <thead>
                            <tr style={{background:'#2c3e50', color:'white'}}>
                                <th style={{padding:8, textAlign:'left'}}>Mata Pelajaran</th>
                                <th style={{padding:8, textAlign:'left'}}>Topik</th>
                                <th style={{padding:8, textAlign:'center'}}>Nilai</th>
                            </tr>
                        </thead>
                        <tbody>
                            {reportData.map((item, idx) => (
                                <tr key={idx} style={{borderBottom:'1px solid #eee', background: idx%2===0?'white':'#f9f9f9'}}>
                                    <td style={{padding:10, fontWeight:'bold'}}>{item.mapel}</td>
                                    <td style={{padding:10}}>{item.topik}</td>
                                    <td style={{padding:10, textAlign:'center', fontWeight:'bold'}}>{item.nilai}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    </div>
  );
};

export default GradeReport;