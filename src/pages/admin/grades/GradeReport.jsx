import React, { useState, useEffect, useRef } from 'react';
import SidebarAdmin from '../../../components/SidebarAdmin';
import { db } from '../../../firebase';
import { collection, getDocs, query, where } from "firebase/firestore";
import { 
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
    Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis 
} from 'recharts';
import { RAPORT_COLLECTIONS } from '../../../firebase/raportCollection';
import { generateCharacterNarasi, generateDetailCharacterNarasi } from '../../../services/raportService';

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
  
  const [reportData, setReportData] = useState([]);        // Data raport_final untuk bulan terpilih
  const [reportComponents, setReportComponents] = useState(null); // Detail komponen nilai
  const [gpaHistory, setGpaHistory] = useState([]);         // Tren GPA dari raport_final
  const [radarData, setRadarData] = useState([]);           // Radar dari raport_scores (qualitative)
  const [characterQualitative, setCharacterQualitative] = useState(null); // Data qualitative mentah
  const [narrativeTitle, setNarrativeTitle] = useState("");
  const [narrativeBody, setNarrativeBody] = useState("");
  const [characterNarasi, setCharacterNarasi] = useState(""); // Narasi karakter
  const [detailCharacterNarasi, setDetailCharacterNarasi] = useState([]); // Detail per aspek

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

  // --- LOGIKA UTAMA: AMBIL DATA DARI raport_final + raport_scores ---
  useEffect(() => {
    if(!selectedStudentId) return;

    const processData = async () => {
        // ========== A. AMBIL DARI raport_final ==========
        const finalQuery = query(
          collection(db, RAPORT_COLLECTIONS.FINAL),
          where("studentId", "==", selectedStudentId)
        );
        const finalSnap = await getDocs(finalQuery);
        const allFinal = finalSnap.docs.map(d => ({ id: d.id, ...d.data() }));
        allFinal.sort((a, b) => new Date(b.periode + '-01') - new Date(a.periode + '-01'));

        // Grafik Tren GPA dari raport_final
        const historyData = allFinal.map(item => ({
          name: item.periode.replace('-', '/'),
          GPA: item.nilai_akhir,
          periode: item.periode
        }));
        setGpaHistory(historyData.reverse());

        // Data bulan terpilih dari raport_final
        const currentFinal = allFinal.find(item => item.periode === selectedMonth);
        
        if (currentFinal) {
          setReportData([currentFinal]); // Bungkus dalam array untuk tabel
          setReportComponents({
            kuis: currentFinal.nilai_kuis,
            catatan: currentFinal.nilai_catatan,
            ujian: currentFinal.nilai_ujian,
            keaktifan: currentFinal.nilai_keaktifan
          });
          
          // Narasi nilai (dari raport_final)
          setNarrativeTitle(currentFinal.nilai_akhir >= 85 ? "PERFORMA SANGAT BAIK" : 
                           currentFinal.nilai_akhir >= 75 ? "PERFORMA BAIK" : "PERLU PERHATIAN");
          setNarrativeBody(currentFinal.narasi || `Nilai akhir: ${currentFinal.nilai_akhir}`);
        } else {
          setReportData([]);
          setReportComponents(null);
          setNarrativeTitle("DATA BELUM TERSEDIA");
          setNarrativeBody(`Belum ada data raport untuk periode ${selectedMonth}. Silakan generate raport terlebih dahulu.`);
          setRadarData([]);
          setCharacterQualitative(null);
          setCharacterNarasi("");
          setDetailCharacterNarasi([]);
          return;
        }

        // ========== B. AMBIL DARI raport_scores (untuk qualitative/karakter) ==========
        const scoresQuery = query(
          collection(db, RAPORT_COLLECTIONS.SCORES),
          where("studentId", "==", selectedStudentId),
          where("periode", "==", selectedMonth)
        );
        const scoresSnap = await getDocs(scoresQuery);
        const allScores = scoresSnap.docs.map(d => d.data());

        // Cari data qualitative di raport_scores
        const qualitativeData = allScores.find(s => s.qualitative);
        
        if (qualitativeData && qualitativeData.qualitative) {
          const qual = qualitativeData.qualitative;
          setCharacterQualitative(qual);
          
          // Generate narasi karakter
          setCharacterNarasi(generateCharacterNarasi(qual));
          setDetailCharacterNarasi(generateDetailCharacterNarasi(qual));
          
          // Data Radar Chart
          setRadarData([
            { subject: 'Pemahaman', A: qual.pemahaman || 0, fullMark: 5 },
            { subject: 'Logika', A: qual.aplikasi || 0, fullMark: 5 },
            { subject: 'Literasi', A: qual.literasi || 0, fullMark: 5 },
            { subject: 'Inisiatif', A: qual.inisiatif || 0, fullMark: 5 },
            { subject: 'Mandiri', A: qual.mandiri || 0, fullMark: 5 }
          ]);
        } else {
          setCharacterQualitative(null);
          setCharacterNarasi("Belum ada penilaian karakter untuk periode ini.");
          setDetailCharacterNarasi([]);
          setRadarData([]);
        }
    };
    processData();
  }, [selectedStudentId, selectedMonth]);

  const studentInfo = students.find(s => s.id === selectedStudentId);

  return (
    <div style={{display:'flex', minHeight:'100vh', background:'#555'}}>
        {/* SIDEBAR ADMIN */}
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
                    {/* HEADER RAPOR */}
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

                    {/* INFO SISWA */}
                    <table style={{width:'100%', marginBottom:30, fontSize:14}}>
                        <tbody>
                            <tr>
                                <td style={{width:100, color:'#7f8c8d'}}>Nama Siswa</td>
                                <td style={{fontWeight:'bold'}}>: {studentInfo?.nama}</td>
                                <td style={{width:100, color:'#7f8c8d'}}>Program</td>
                                <td style={{fontWeight:'bold'}}>: {studentInfo?.detailProgram}</td>
                            </tr>
                            <tr>
                                <td style={{width:100, color:'#7f8c8d'}}>Kelas</td>
                                <td style={{fontWeight:'bold'}}>: {studentInfo?.kelasSekolah}</td>
                                <td style={{width:100, color:'#7f8c8d'}}>Nilai Akhir</td>
                                <td style={{fontWeight:'bold', color: '#e67e22', fontSize: 18}}>
                                  : {reportComponents ? Math.round((reportComponents.kuis + reportComponents.catatan + reportComponents.ujian + reportComponents.keaktifan) / 4) : '-'}
                                </td>
                            </tr>
                        </tbody>
                    </table>

                    {/* NARASI NILAI */}
                    <div style={{background:'#f4fbf7', border:'1px solid #27ae60', borderRadius:8, padding:20, marginBottom:20}}>
                        <h3 style={{marginTop:0, color:'#27ae60', fontSize:16}}>📢 {narrativeTitle}</h3>
                        <p style={{textAlign:'justify', fontSize:14}}>{narrativeBody}</p>
                    </div>

                    {/* ============================================================ */}
                    {/* ➕ NARASI KARAKTER (TAMBAHAN BARU) */}
                    {/* ============================================================ */}
                    {characterQualitative && (
                      <div style={{background:'#fef9f0', border:'1px solid #f59e0b', borderRadius:8, padding:20, marginBottom:20}}>
                        <h3 style={{marginTop:0, color:'#b45309', fontSize:16}}>🧠 Analisis Karakter</h3>
                        <p style={{textAlign:'justify', fontSize:13, marginBottom:14}}>{characterNarasi}</p>
                        
                        {/* Detail per aspek */}
                        {detailCharacterNarasi.length > 0 && (
                          <table style={{width:'100%', borderCollapse:'collapse', fontSize:11}}>
                            <thead>
                              <tr style={{background:'#f59e0b', color:'white'}}>
                                <th style={{padding:6, textAlign:'left'}}>Aspek</th>
                                <th style={{padding:6, textAlign:'center'}}>Nilai</th>
                                <th style={{padding:6, textAlign:'left'}}>Narasi</th>
                                <th style={{padding:6, textAlign:'left'}}>Saran</th>
                              </tr>
                            </thead>
                            <tbody>
                              {detailCharacterNarasi.map((aspek, idx) => (
                                <tr key={idx} style={{borderBottom:'1px solid #fde68a', background: idx%2===0?'white':'#fffbeb'}}>
                                  <td style={{padding:8, fontWeight:'bold'}}>{aspek.label}</td>
                                  <td style={{padding:8, textAlign:'center'}}>
                                    <span style={{
                                      background: aspek.nilai >= 4 ? '#dcfce7' : aspek.nilai >= 3 ? '#fef3c7' : '#fee2e2',
                                      color: aspek.nilai >= 4 ? '#166534' : aspek.nilai >= 3 ? '#b45309' : '#991b1b',
                                      padding: '3px 10px',
                                      borderRadius: '12px',
                                      fontWeight: 'bold',
                                      fontSize: '11px'
                                    }}>{aspek.nilai}/5</span>
                                  </td>
                                  <td style={{padding:8, fontSize:10}}>{aspek.narasi}</td>
                                  <td style={{padding:8, fontSize:10, fontStyle:'italic', color:'#64748b'}}>💡 {aspek.saran}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        )}
                      </div>
                    )}
                    {!characterQualitative && (
                      <div style={{background:'#f8fafc', border:'1px solid #e2e8f0', borderRadius:8, padding:16, marginBottom:20}}>
                        <p style={{textAlign:'center', fontSize:12, color:'#94a3b8', margin:0}}>📝 Belum ada penilaian karakter untuk periode ini. Guru belum menginput aspek pemahaman, aplikasi, literasi, inisiatif, dan kemandirian.</p>
                      </div>
                    )}
                    {/* ============================================================ */}

                    {/* CHART: TREN & RADAR */}
                    <div style={{display:'flex', gap:20, marginBottom:30, height:220}}>
                        <div style={{flex:1, border:'1px solid #eee', borderRadius:8, padding:10}}>
                            <h4 style={{marginTop:0, fontSize:13, textAlign:'center'}}>TREN AKADEMIK (GPA)</h4>
                            {gpaHistory.length > 0 ? (
                              <ResponsiveContainer width="100%" height="85%">
                                  <LineChart data={gpaHistory}>
                                      <CartesianGrid strokeDasharray="3 3" />
                                      <XAxis dataKey="name" fontSize={10}/>
                                      <YAxis domain={[0, 100]} fontSize={10}/>
                                      <Line type="monotone" dataKey="GPA" stroke="#2c3e50" strokeWidth={3} />
                                  </LineChart>
                              </ResponsiveContainer>
                            ) : (
                              <p style={{textAlign:'center', color:'#94a3b8', fontSize:11, padding:30}}>Belum cukup data untuk grafik tren</p>
                            )}
                        </div>
                        <div style={{flex:1, border:'1px solid #eee', borderRadius:8, padding:10}}>
                            <h4 style={{marginTop:0, fontSize:13, textAlign:'center'}}>PETA KOMPETENSI</h4>
                            {radarData.length > 0 ? (
                              <ResponsiveContainer width="100%" height="85%">
                                  <RadarChart outerRadius="70%" data={radarData}>
                                      <PolarGrid />
                                      <PolarAngleAxis dataKey="subject" fontSize={9} />
                                      <Radar name="Siswa" dataKey="A" stroke="#e67e22" fill="#e67e22" fillOpacity={0.6} />
                                  </RadarChart>
                              </ResponsiveContainer>
                            ) : (
                              <p style={{textAlign:'center', color:'#94a3b8', fontSize:11, padding:30}}>Belum ada data karakter</p>
                            )}
                        </div>
                    </div>

                    {/* RINCIAN NILAI PER KOMPONEN */}
                    <h3 style={{borderLeft:'5px solid #3498db', paddingLeft:10, color:'#2c3e50', fontSize:16}}>📚 Rincian Nilai</h3>
                    {reportComponents ? (
                      <table style={{width:'100%', borderCollapse:'collapse', fontSize:12, marginTop:15}}>
                          <thead>
                              <tr style={{background:'#2c3e50', color:'white'}}>
                                  <th style={{padding:8, textAlign:'left'}}>Komponen</th>
                                  <th style={{padding:8, textAlign:'center'}}>Bobot</th>
                                  <th style={{padding:8, textAlign:'center'}}>Nilai</th>
                              </tr>
                          </thead>
                          <tbody>
                              <tr style={{borderBottom:'1px solid #eee'}}>
                                  <td style={{padding:10, fontWeight:'bold'}}>📝 Kuis</td>
                                  <td style={{padding:10, textAlign:'center'}}>25%</td>
                                  <td style={{padding:10, textAlign:'center', fontWeight:'bold'}}>{reportComponents.kuis}</td>
                              </tr>
                              <tr style={{borderBottom:'1px solid #eee', background:'#f9f9f9'}}>
                                  <td style={{padding:10, fontWeight:'bold'}}>📓 Tugas / Catatan</td>
                                  <td style={{padding:10, textAlign:'center'}}>25%</td>
                                  <td style={{padding:10, textAlign:'center', fontWeight:'bold'}}>{reportComponents.catatan}</td>
                              </tr>
                              <tr style={{borderBottom:'1px solid #eee'}}>
                                  <td style={{padding:10, fontWeight:'bold'}}>📖 Ujian</td>
                                  <td style={{padding:10, textAlign:'center'}}>35%</td>
                                  <td style={{padding:10, textAlign:'center', fontWeight:'bold'}}>{reportComponents.ujian}</td>
                              </tr>
                              <tr style={{borderBottom:'1px solid #eee', background:'#f9f9f9'}}>
                                  <td style={{padding:10, fontWeight:'bold'}}>⭐ Keaktifan</td>
                                  <td style={{padding:10, textAlign:'center'}}>15%</td>
                                  <td style={{padding:10, textAlign:'center', fontWeight:'bold'}}>{reportComponents.keaktifan}</td>
                              </tr>
                          </tbody>
                      </table>
                    ) : (
                      <p style={{textAlign:'center', color:'#94a3b8', padding:20}}>Belum ada data komponen nilai.</p>
                    )}
                </div>
            )}
        </div>
    </div>
  );
};

export default GradeReport;