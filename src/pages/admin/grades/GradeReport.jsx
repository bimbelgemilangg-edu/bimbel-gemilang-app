import React, { useState, useEffect, useRef } from 'react';
import Sidebar from '../../../components/Sidebar';
import { db } from '../../../firebase';
import { collection, getDocs, query, where } from "firebase/firestore";
import { 
    LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, 
    Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis 
} from 'recharts';

// LIBRARY CETAK PDF HD
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

const GradeReport = () => {
  const printRef = useRef(); // Referensi area yang akan dicetak
  const [isPrinting, setIsPrinting] = useState(false);

  const [students, setStudents] = useState([]);
  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7)); 
  
  const [reportData, setReportData] = useState([]); 
  const [gpaHistory, setGpaHistory] = useState([]); 
  const [subjectHistory, setSubjectHistory] = useState([]); 
  const [uniqueSubjects, setUniqueSubjects] = useState([]); 
  const [radarData, setRadarData] = useState([]);   
  const [gpaCurrent, setGpaCurrent] = useState(0);
  
  // STATE NARASI DETIL
  const [narrativeTitle, setNarrativeTitle] = useState("");
  const [narrativeBody, setNarrativeBody] = useState("");
  const [bestSubject, setBestSubject] = useState("");
  const [weakSubject, setWeakSubject] = useState("");

  const colors = ["#e74c3c", "#3498db", "#27ae60", "#f1c40f", "#8e44ad", "#e67e22", "#16a085", "#2c3e50"];

  useEffect(() => {
    getDocs(collection(db, "students")).then(snap => {
        setStudents(snap.docs.map(d => ({id: d.id, ...d.data()})));
    });
  }, []);

  // --- FUNGSI CETAK PDF HD (ANTI BLUR) ---
  const handleDownloadPDF = async () => {
    if(!selectedStudentId) return;
    setIsPrinting(true);
    
    const element = printRef.current;
    
    // 1. Convert HTML ke Canvas (High Scale = Tajam)
    const canvas = await html2canvas(element, {
        scale: 2, // 2x Resolusi (Supaya tidak pecah saat di-zoom)
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
    });

    const imgData = canvas.toDataURL('image/png');
    
    // 2. Setup PDF A4
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    
    // Hitung Rasio agar pas di A4
    const imgWidth = canvas.width;
    const imgHeight = canvas.height;
    const ratio = imgWidth / imgHeight;
    const heightInPdf = pdfWidth / ratio;

    // 3. Masukkan Gambar ke PDF
    // Jika konten panjang, potong per halaman (Basic logic: fit to one page first)
    // Untuk rapor 2 halaman, kita bisa addPage.
    // Tapi untuk simplifikasi yang rapi, kita buat fit width.
    
    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, heightInPdf);
    
    pdf.save(`RAPOR_${students.find(s=>s.id===selectedStudentId)?.nama}_${selectedMonth}.pdf`);
    setIsPrinting(false);
  };

  useEffect(() => {
    if(!selectedStudentId) return;

    const processData = async () => {
        const q = query(collection(db, "grades"), where("studentId", "==", selectedStudentId));
        const snap = await getDocs(q);
        const allGrades = snap.docs.map(d => d.data());
        allGrades.sort((a,b) => new Date(a.tanggal) - new Date(b.tanggal));

        // ... (LOGIC CHART SAMA SEPERTI SEBELUMNYA) ...
        const mapelHistoryMap = {}; 
        const subjectSet = new Set();

        allGrades.forEach(g => {
            const monthLabel = new Date(g.tanggal).toLocaleDateString('id-ID', {month:'short', year:'2-digit'}); 
            subjectSet.add(g.mapel);
            if(!mapelHistoryMap[monthLabel]) mapelHistoryMap[monthLabel] = { name: monthLabel, rawDate: g.tanggal };
            mapelHistoryMap[monthLabel][g.mapel] = g.nilai;
        });

        const finalSubjectHistory = Object.values(mapelHistoryMap).sort((a,b) => new Date(a.rawDate) - new Date(b.rawDate));
        setSubjectHistory(finalSubjectHistory);
        setUniqueSubjects(Array.from(subjectSet)); 

        const gpaData = finalSubjectHistory.map(item => {
            let sum = 0, count = 0;
            Object.keys(item).forEach(key => {
                if(key !== 'name' && key !== 'rawDate') { sum += item[key]; count++; }
            });
            return { name: item.name, GPA: count > 0 ? Math.round(sum/count) : 0 };
        });
        setGpaHistory(gpaData);

        // DATA BULAN INI
        const currentGrades = allGrades.filter(g => g.tanggal.startsWith(selectedMonth));
        setReportData(currentGrades);

        // --- LOGIC NARASI SUPER CERDAS ---
        if(currentGrades.length > 0) {
            const avgCurrent = Math.round(currentGrades.reduce((a,b)=>a+b.nilai,0) / currentGrades.length);
            setGpaCurrent(avgCurrent);

            // 1. Cari Mapel Terbaik & Terlemah
            const sortedByScore = [...currentGrades].sort((a,b) => b.nilai - a.nilai);
            const best = sortedByScore[0];
            const weak = sortedByScore[sortedByScore.length - 1];

            setBestSubject(best.mapel);
            setWeakSubject(weak.nilai < 75 ? weak.mapel : null); // Hanya sebut lemah jika di bawah KKM

            // 2. Judul Narasi
            let title = "";
            if(avgCurrent >= 90) title = "PERFORMA EKSCELLENT (SANGAT MEMUASKAN)";
            else if(avgCurrent >= 80) title = "PERFORMA SANGAT BAIK";
            else if(avgCurrent >= 70) title = "PERFORMA CUKUP BAIK";
            else title = "PERLU PERHATIAN KHUSUS";
            setNarrativeTitle(title);

            // 3. Isi Narasi (Gabungan Semua Mapel)
            let body = `Pada periode ${new Date(selectedMonth).toLocaleDateString('id-ID', {month:'long', year:'numeric'})}, ananda menunjukkan pencapaian akademik rata-rata (GPA) sebesar ${avgCurrent}. `;
            
            body += `Kekuatan utama ananda terlihat jelas pada mata pelajaran ${best.mapel} dengan skor ${best.nilai}, yang menunjukkan minat dan pemahaman konsep yang sangat tinggi. `;
            
            if(weak.nilai < 75) {
                body += `Namun, perlu adanya pendampingan lebih intensif pada mata pelajaran ${weak.mapel} (Skor: ${weak.nilai}) untuk mengejar ketertinggalan konsep dasar. `;
            } else {
                body += `Seluruh mata pelajaran berada di atas standar kompetensi minimum, menunjukkan keseimbangan belajar yang baik. `;
            }

            // Tambah Aspek Karakter ke Narasi
            let aspects = { mandiri: 0, inisiatif: 0 };
            currentGrades.forEach(g => {
                if(g.qualitative) {
                    aspects.mandiri += g.qualitative.mandiri || 0;
                    aspects.inisiatif += g.qualitative.inisiatif || 0;
                }
            });
            const avgMandiri = aspects.mandiri / currentGrades.length;
            
            if(avgMandiri >= 4) body += "Secara karakter, ananda sangat mandiri dalam mengerjakan tugas tanpa perlu banyak arahan.";
            else if(avgMandiri <= 2) body += "Kami merekomendasikan agar di rumah ananda lebih dilatih kemandiriannya dalam menyelesaikan tugas sekolah.";

            setNarrativeBody(body);
        } else {
            setNarrativeTitle("DATA BELUM TERSEDIA");
            setNarrativeBody("Belum ada penilaian akademik yang masuk untuk bulan ini.");
            setGpaCurrent(0);
        }

        // Radar Data
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
                { subject: 'Logika', A: (aspekSum.aplikasi/count).toFixed(1), fullMark: 5 },
                { subject: 'Literasi', A: (aspekSum.literasi/count).toFixed(1), fullMark: 5 },
                { subject: 'Inisiatif', A: (aspekSum.inisiatif/count).toFixed(1), fullMark: 5 },
                { subject: 'Mandiri', A: (aspekSum.mandiri/count).toFixed(1), fullMark: 5 },
            ]);
        } else setRadarData([]);

    };
    processData();
  }, [selectedStudentId, selectedMonth]);

  const studentInfo = students.find(s => s.id === selectedStudentId);

  return (
    <div style={{display:'flex'}}>
        <Sidebar />
        <div style={{marginLeft:250, padding:30, width:'100%', background:'#555', minHeight:'100vh', fontFamily:'Segoe UI, sans-serif', display:'flex', flexDirection:'column', alignItems:'center'}}>
            
            {/* CONTROLLER */}
            <div style={{background:'white', padding:15, borderRadius:8, marginBottom:20, display:'flex', gap:15, alignItems:'center', width:'210mm', boxSizing:'border-box'}}>
                <select value={selectedStudentId} onChange={e=>setSelectedStudentId(e.target.value)} style={{padding:10, borderRadius:5, border:'1px solid #ccc', flex:1}}>
                    <option value="">-- Pilih Siswa --</option>
                    {students.map(s => <option key={s.id} value={s.id}>{s.nama}</option>)}
                </select>
                <input type="month" value={selectedMonth} onChange={e=>setSelectedMonth(e.target.value)} style={{padding:10, borderRadius:5, border:'1px solid #ccc'}} />
                <button onClick={handleDownloadPDF} disabled={!selectedStudentId || isPrinting} style={{background: isPrinting?'#95a5a6':'#e74c3c', color:'white', border:'none', padding:'10px 25px', borderRadius:5, cursor:'pointer', fontWeight:'bold', marginLeft:'auto'}}>
                    {isPrinting ? '⏳ Memproses...' : '📄 DOWNLOAD PDF (HD)'}
                </button>
            </div>

            {/* === AREA KERTAS A4 (YANG AKAN DICETAK) === */}
            {selectedStudentId && (
                <div ref={printRef} style={{
                    width: '210mm', // Lebar A4 Pas
                    minHeight: '297mm', // Tinggi A4 Minimal
                    background: 'white',
                    padding: '15mm', // Margin Kertas
                    boxShadow: '0 0 20px rgba(0,0,0,0.5)',
                    boxSizing: 'border-box'
                }}>
                    
                    {/* KOP LAPORAN */}
                    <div style={{display:'flex', alignItems:'center', borderBottom:'4px double #2c3e50', paddingBottom:20, marginBottom:30}}>
                        <div style={{flex:1}}>
                            <h1 style={{margin:0, color:'#2c3e50', fontSize:24, letterSpacing:2}}>BIMBEL GEMILANG</h1>
                            <p style={{margin:0, color:'#7f8c8d', fontSize:12}}>Pusat Keunggulan Akademik & Karakter Siswa</p>
                        </div>
                        <div style={{textAlign:'right'}}>
                            <h2 style={{margin:0, color:'#e67e22'}}>RAPOR BULANAN</h2>
                            <p style={{margin:0, fontSize:14}}>Periode: {selectedMonth}</p>
                        </div>
                    </div>

                    {/* IDENTITAS SISWA */}
                    <table style={{width:'100%', marginBottom:30, fontSize:14}}>
                        <tbody>
                            <tr>
                                <td style={{width:100, color:'#7f8c8d'}}>Nama Siswa</td>
                                <td style={{fontWeight:'bold'}}>: {studentInfo?.nama}</td>
                                <td style={{width:100, color:'#7f8c8d'}}>Program</td>
                                <td style={{fontWeight:'bold'}}>: {studentInfo?.detailProgram}</td>
                            </tr>
                            <tr>
                                <td style={{color:'#7f8c8d'}}>ID Siswa</td>
                                <td>: {studentInfo?.id.substring(0,8).toUpperCase()}</td>
                                <td style={{color:'#7f8c8d'}}>Kelas</td>
                                <td>: {studentInfo?.kelasSekolah}</td>
                            </tr>
                        </tbody>
                    </table>

                    {/* === BAGIAN 1: NARASI DESKRIPTIF UTAMA (Halaman Depan) === */}
                    <div style={{background:'#f4fbf7', border:'1px solid #27ae60', borderRadius:8, padding:20, marginBottom:30}}>
                        <h3 style={{marginTop:0, color:'#27ae60', borderBottom:'1px dashed #27ae60', paddingBottom:10, fontSize:16}}>
                            📢 {narrativeTitle}
                        </h3>
                        <p style={{textAlign:'justify', lineHeight:1.6, fontSize:14, color:'#2c3e50', marginBottom:0}}>
                            {narrativeBody}
                        </p>
                    </div>

                    {/* GRAFIK GPA & KOMPETENSI (Berdampingan) */}
                    <div style={{display:'flex', gap:20, marginBottom:30, height:220}}>
                        {/* KIRI: GPA */}
                        <div style={{flex:1, border:'1px solid #eee', borderRadius:8, padding:10}}>
                            <h4 style={{marginTop:0, fontSize:13, textAlign:'center', color:'#555'}}>TREN AKADEMIK (GPA)</h4>
                            <ResponsiveContainer width="100%" height="85%">
                                <LineChart data={gpaHistory}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="name" fontSize={10}/>
                                    <YAxis domain={[0, 100]} fontSize={10}/>
                                    <Line type="monotone" dataKey="GPA" stroke="#2c3e50" strokeWidth={3} dot={{r:4}} />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                        {/* KANAN: RADAR */}
                        <div style={{flex:1, border:'1px solid #eee', borderRadius:8, padding:10}}>
                            <h4 style={{marginTop:0, fontSize:13, textAlign:'center', color:'#555'}}>PETA KOMPETENSI</h4>
                            <ResponsiveContainer width="100%" height="85%">
                                <RadarChart outerRadius="70%" data={radarData}>
                                    <PolarGrid />
                                    <PolarAngleAxis dataKey="subject" fontSize={9} />
                                    <PolarRadiusAxis angle={30} domain={[0, 5]} fontSize={8}/>
                                    <Radar name="Siswa" dataKey="A" stroke="#e67e22" fill="#e67e22" fillOpacity={0.6} />
                                </RadarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* BAGIAN 2: RINCIAN MAPEL (TABEL BERSIH) */}
                    <h3 style={{borderLeft:'5px solid #3498db', paddingLeft:10, color:'#2c3e50', fontSize:16, marginTop:40}}>
                        📚 Rincian Nilai Mata Pelajaran
                    </h3>
                    <table style={{width:'100%', borderCollapse:'collapse', fontSize:12, marginTop:15}}>
                        <thead>
                            <tr style={{background:'#2c3e50', color:'white'}}>
                                <th style={{padding:'8px 12px', textAlign:'left', borderRadius:'5px 0 0 0'}}>Mata Pelajaran</th>
                                <th style={{padding:'8px 12px', textAlign:'left'}}>Topik Pembelajaran</th>
                                <th style={{padding:'8px 12px', textAlign:'center'}}>Nilai (0-100)</th>
                                <th style={{padding:'8px 12px', textAlign:'center', borderRadius:'0 5px 0 0'}}>Predikat</th>
                            </tr>
                        </thead>
                        <tbody>
                            {reportData.map((item, idx) => (
                                <tr key={idx} style={{borderBottom:'1px solid #eee', background: idx%2===0?'white':'#f9f9f9'}}>
                                    <td style={{padding:'10px 12px', fontWeight:'bold', color:'#2980b9'}}>{item.mapel}</td>
                                    <td style={{padding:'10px 12px'}}>{item.topik}</td>
                                    <td style={{padding:'10px 12px', textAlign:'center', fontWeight:'bold', fontSize:14}}>
                                        {item.nilai}
                                    </td>
                                    <td style={{padding:'10px 12px', textAlign:'center'}}>
                                        <span style={{
                                            background: item.nilai >= 80 ? '#27ae60' : item.nilai >= 70 ? '#f1c40f' : '#e74c3c',
                                            color:'white', padding:'3px 8px', borderRadius:10, fontSize:10
                                        }}>
                                            {item.nilai >= 90 ? 'Sempurna' : item.nilai >= 80 ? 'Mahir' : item.nilai >= 70 ? 'Cukup' : 'Remedial'}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    {/* FOOTER TTD */}
                    <div style={{display:'flex', justifyContent:'space-between', marginTop:50}}>
                        <div style={{textAlign:'center', width:200}}>
                            <p style={{marginBottom:60, fontSize:12}}>Orang Tua / Wali</p>
                            <div style={{borderBottom:'1px solid #ccc', width:'100%'}}></div>
                        </div>
                        <div style={{textAlign:'center', width:200}}>
                            <p style={{marginBottom:60, fontSize:12}}>Bimbel Gemilang</p>
                            <div style={{borderBottom:'1px solid #ccc', width:'100%'}}>Admin Akademik</div>
                        </div>
                    </div>

                </div>
            )}
        </div>
    </div>
  );
};

export default GradeReport;