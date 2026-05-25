import React, { useState, useEffect, useRef } from 'react';
import SidebarAdmin from '../../../components/SidebarAdmin';
import { db } from '../../../firebase';
import { collection, getDocs, query, where } from "firebase/firestore";
import { 
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
    Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis 
} from 'recharts';
import { RAPORT_COLLECTIONS, DIMENSI_CONFIG, DIMENSI_KEYS } from '../../../firebase/raportCollection';
import { generateCharacterNarasi, generateDimensiNarasi } from '../../../services/raportService';

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
  const [selectedMapel, setSelectedMapel] = useState("Semua");
  const [availableMapel, setAvailableMapel] = useState([]);
  
  const [reportData, setReportData] = useState([]);
  const [currentReport, setCurrentReport] = useState(null);
  const [gpaHistory, setGpaHistory] = useState([]);
  const [radarData, setRadarData] = useState([]);
  const [narrativeTitle, setNarrativeTitle] = useState("");
  const [narrativeBody, setNarrativeBody] = useState("");
  const [characterNarasi, setCharacterNarasi] = useState("");
  const [dimensiNarasi, setDimensiNarasi] = useState([]);

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
    const studentName = students.find(s=>s.id===selectedStudentId)?.nama || 'Siswa';
    pdf.save(`RAPOR_${studentName}_${selectedMonth}.pdf`);
    setIsPrinting(false);
  };

  // --- LOGIKA UTAMA: AMBIL DATA DARI raport_final ---
  useEffect(() => {
    if(!selectedStudentId) return;

    const processData = async () => {
        const finalQuery = query(
          collection(db, RAPORT_COLLECTIONS.FINAL),
          where("studentId", "==", selectedStudentId)
        );
        const finalSnap = await getDocs(finalQuery);
        const allFinal = finalSnap.docs.map(d => ({ id: d.id, ...d.data() }));
        allFinal.sort((a, b) => new Date(b.periode + '-01') - new Date(a.periode + '-01'));

        // Ambil daftar mapel
        const mapelList = [...new Set(allFinal.map(r => r.mapel).filter(Boolean))];
        setAvailableMapel(mapelList);
        if (!mapelList.includes(selectedMapel) && selectedMapel !== "Semua") {
          setSelectedMapel("Semua");
        }

        // Grafik Tren GPA
        const historyData = allFinal.map(item => ({
          name: item.periode.replace('-', '/'),
          GPA: item.nilai_akhir,
          periode: item.periode
        }));
        setGpaHistory(historyData.reverse());

        // Data bulan terpilih
        const currentFinals = allFinal.filter(item => item.periode === selectedMonth);
        
        if (currentFinals.length > 0) {
          setReportData(currentFinals);
          
          if (selectedMapel === "Semua") {
            // Gabungan semua mapel
            const avgNilai = Math.round(
              currentFinals.reduce((sum, r) => sum + (r.nilai_akhir || 0), 0) / currentFinals.length * 10
            ) / 10;
            
            setCurrentReport({
              nilai_akhir: avgNilai,
              mode_perhitungan: `Gabungan ${currentFinals.length} Mapel`,
              narasi: `Rata-rata nilai dari ${currentFinals.length} mata pelajaran.`,
              detail_dimensi: null,
              dimensi_narasi: null,
              catatan_guru: null
            });
            
            setNarrativeTitle(avgNilai >= 85 ? "PERFORMA SANGAT BAIK" : 
                             avgNilai >= 70 ? "PERFORMA BAIK" : "PERLU PERHATIAN");
            setNarrativeBody(`Nilai rata-rata gabungan ${currentFinals.length} mapel: ${avgNilai}`);
            setRadarData([]);
            setCharacterNarasi("");
            setDimensiNarasi([]);
          } else {
            // Mapel spesifik
            const mapelReport = currentFinals.find(r => r.mapel === selectedMapel);
            if (mapelReport) {
              setCurrentReport(mapelReport);
              
              setNarrativeTitle(mapelReport.nilai_akhir >= 85 ? "PERFORMA SANGAT BAIK" : 
                               mapelReport.nilai_akhir >= 70 ? "PERFORMA BAIK" : "PERLU PERHATIAN");
              setNarrativeBody(mapelReport.narasi || `Nilai akhir ${selectedMapel}: ${mapelReport.nilai_akhir}`);
              
              // Radar dari 5 dimensi
              if (mapelReport.detail_dimensi) {
                setRadarData(DIMENSI_KEYS.map(key => ({
                  subject: DIMENSI_CONFIG[key].label,
                  A: mapelReport.detail_dimensi[key] || 0,
                  fullMark: 100
                })));
                setCharacterNarasi(generateCharacterNarasi(mapelReport.detail_dimensi));
                setDimensiNarasi(mapelReport.dimensi_narasi || []);
              } else {
                setRadarData([]);
                setCharacterNarasi("");
                setDimensiNarasi([]);
              }
            } else {
              setCurrentReport(null);
              setNarrativeTitle("DATA BELUM TERSEDIA");
              setNarrativeBody(`Belum ada data raport untuk mapel ${selectedMapel} di periode ${selectedMonth}.`);
              setRadarData([]);
              setCharacterNarasi("");
              setDimensiNarasi([]);
            }
          }
        } else {
          setReportData([]);
          setCurrentReport(null);
          setNarrativeTitle("DATA BELUM TERSEDIA");
          setNarrativeBody(`Belum ada data raport untuk periode ${selectedMonth}.`);
          setRadarData([]);
          setCharacterNarasi("");
          setDimensiNarasi([]);
        }
    };
    processData();
  }, [selectedStudentId, selectedMonth, selectedMapel]);

  const studentInfo = students.find(s => s.id === selectedStudentId);
  
  const getScoreColor = (score) => {
    if (score >= 85) return '#10b981';
    if (score >= 70) return '#3b82f6';
    if (score >= 50) return '#f59e0b';
    return '#ef4444';
  };

  return (
    <div style={{display:'flex', minHeight:'100vh', background:'#555'}}>
        <SidebarAdmin />
        
        <div style={{marginLeft:250, padding:30, width:'100%', display:'flex', flexDirection:'column', alignItems:'center'}}>
            
            {/* PANEL KONTROL */}
            <div style={{background:'white', padding:15, borderRadius:8, marginBottom:20, width:'210mm', boxSizing:'border-box', boxShadow:'0 2px 10px rgba(0,0,0,0.2)'}}>
                <div style={{display:'flex', gap:10, marginBottom:10}}>
                    <div style={{flex:1}}>
                        <small style={{fontWeight:'bold'}}>1. Cari Siswa</small>
                        <input type="text" placeholder="🔍 Nama..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} 
                          style={{width:'100%', padding:10, border:'1px solid #3498db', borderRadius:5, marginTop:5}} />
                    </div>
                    <div style={{flex:1}}>
                        <small style={{fontWeight:'bold'}}>2. Pilih Siswa</small>
                        <select value={selectedStudentId} onChange={e=>setSelectedStudentId(e.target.value)} 
                          style={{width:'100%', padding:10, border:'1px solid #ccc', borderRadius:5, marginTop:5}}>
                            <option value="">-- Pilih Siswa --</option>
                            {filteredStudents.map(s => <option key={s.id} value={s.id}>{s.nama} ({s.kelasSekolah})</option>)}
                        </select>
                    </div>
                </div>
                <div style={{display:'flex', gap:10, alignItems:'end'}}>
                    <div style={{flex:1}}>
                        <small style={{fontWeight:'bold'}}>3. Periode</small>
                        <input type="month" value={selectedMonth} onChange={e=>setSelectedMonth(e.target.value)} 
                          style={{width:'100%', padding:9, borderRadius:5, border:'1px solid #ccc'}} />
                    </div>
                    <div style={{flex:1}}>
                        <small style={{fontWeight:'bold'}}>4. Mapel</small>
                        <select value={selectedMapel} onChange={e=>setSelectedMapel(e.target.value)}
                          style={{width:'100%', padding:10, borderRadius:5, border:'1px solid #ccc'}}>
                            <option value="Semua">📊 Semua Mapel</option>
                            {availableMapel.map(m => <option key={m} value={m}>📖 {m}</option>)}
                        </select>
                    </div>
                    <button onClick={handleDownloadPDF} disabled={!selectedStudentId || isPrinting} 
                      style={{flex:1, height:42, background:'#e74c3c', color:'white', border:'none', borderRadius:5, cursor:'pointer', fontWeight:'bold'}}>
                        {isPrinting ? '⏳ Memproses...' : '📄 DOWNLOAD PDF'}
                    </button>
                </div>
            </div>

            {/* AREA RAPOR A4 */}
            {selectedStudentId && currentReport && (
                <div ref={printRef} style={{ width: '210mm', minHeight: '297mm', background: 'white', padding: '15mm', boxSizing: 'border-box' }}>
                    {/* HEADER RAPOR */}
                    <div style={{display:'flex', alignItems:'center', borderBottom:'4px double #2c3e50', paddingBottom:20, marginBottom:30}}>
                        <div style={{flex:1}}>
                            <h1 style={{margin:0, color:'#2c3e50', fontSize:24}}>BIMBEL GEMILANG</h1>
                            <p style={{margin:0, color:'#7f8c8d', fontSize:12}}>Pusat Keunggulan Akademik & Karakter Siswa</p>
                        </div>
                        <div style={{textAlign:'right'}}>
                            <h2 style={{margin:0, color:'#e67e22'}}>RAPOR BULANAN</h2>
                            <p style={{margin:0, fontSize:14}}>Periode: {selectedMonth.replace('-', ' / ')}</p>
                        </div>
                    </div>

                    {/* INFO SISWA */}
                    <table style={{width:'100%', marginBottom:30, fontSize:14}}>
                        <tbody>
                            <tr>
                                <td style={{width:100, color:'#7f8c8d'}}>Nama Siswa</td>
                                <td style={{fontWeight:'bold'}}>: {studentInfo?.nama}</td>
                                <td style={{width:100, color:'#7f8c8d'}}>Mapel</td>
                                <td style={{fontWeight:'bold'}}>: {selectedMapel === "Semua" ? "Semua Mapel" : selectedMapel}</td>
                            </tr>
                            <tr>
                                <td style={{width:100, color:'#7f8c8d'}}>Kelas</td>
                                <td style={{fontWeight:'bold'}}>: {studentInfo?.kelasSekolah}</td>
                                <td style={{width:100, color:'#7f8c8d'}}>Nilai Akhir</td>
                                <td style={{fontWeight:'bold', fontSize: 18, color: getScoreColor(currentReport.nilai_akhir)}}>
                                  : {currentReport.nilai_akhir}
                                </td>
                            </tr>
                            <tr>
                                <td style={{color:'#7f8c8d'}}>Mode</td>
                                <td colSpan={3} style={{fontSize:11, color:'#64748b'}}>: {currentReport.mode_perhitungan || 'N/A'}</td>
                            </tr>
                        </tbody>
                    </table>

                    {/* NARASI NILAI */}
                    <div style={{background:'#f4fbf7', border:'1px solid #27ae60', borderRadius:8, padding:20, marginBottom:20}}>
                        <h3 style={{marginTop:0, color:'#27ae60', fontSize:16}}>📢 {narrativeTitle}</h3>
                        <p style={{textAlign:'justify', fontSize:14}}>{narrativeBody}</p>
                    </div>

                    {/* 5 DIMENSI (jika mapel spesifik) */}
                    {selectedMapel !== "Semua" && radarData.length > 0 && (
                      <>
                        <div style={{background:'#fef9f0', border:'1px solid #f59e0b', borderRadius:8, padding:20, marginBottom:20}}>
                          <h3 style={{marginTop:0, color:'#b45309', fontSize:16}}>🧠 Analisis 5 Dimensi</h3>
                          <p style={{textAlign:'justify', fontSize:13, marginBottom:14}}>{characterNarasi}</p>
                          
                          {dimensiNarasi.length > 0 && (
                            <table style={{width:'100%', borderCollapse:'collapse', fontSize:11}}>
                              <thead>
                                <tr style={{background:'#f59e0b', color:'white'}}>
                                  <th style={{padding:6, textAlign:'left'}}>Dimensi</th>
                                  <th style={{padding:6, textAlign:'center'}}>Nilai</th>
                                  <th style={{padding:6, textAlign:'left'}}>Narasi</th>
                                  <th style={{padding:6, textAlign:'left'}}>Saran</th>
                                </tr>
                              </thead>
                              <tbody>
                                {dimensiNarasi.map((aspek, idx) => (
                                  <tr key={idx} style={{borderBottom:'1px solid #fde68a', background: idx%2===0?'white':'#fffbeb'}}>
                                    <td style={{padding:8, fontWeight:'bold'}}>{aspek.label}</td>
                                    <td style={{padding:8, textAlign:'center'}}>
                                      <span style={{
                                        background: aspek.nilai >= 70 ? '#dcfce7' : aspek.nilai >= 50 ? '#fef3c7' : '#fee2e2',
                                        color: aspek.nilai >= 70 ? '#166534' : aspek.nilai >= 50 ? '#b45309' : '#991b1b',
                                        padding: '3px 10px', borderRadius: '12px', fontWeight: 'bold', fontSize: '11px'
                                      }}>{aspek.nilai}</span>
                                    </td>
                                    <td style={{padding:8, fontSize:10}}>{aspek.narasiSingkat}</td>
                                    <td style={{padding:8, fontSize:10, fontStyle:'italic', color:'#64748b'}}>💡 {aspek.saran}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          )}
                        </div>
                      </>
                    )}

                    {/* CATATAN GURU */}
                    {selectedMapel !== "Semua" && currentReport?.catatan_guru && (
                      <div style={{background:'#fffbeb', border:'1px solid #fde68a', borderRadius:8, padding:16, marginBottom:20}}>
                        <h3 style={{marginTop:0, color:'#b45309', fontSize:14}}>💬 Catatan Guru</h3>
                        <p style={{fontSize:12, color:'#92400e', fontStyle:'italic'}}>"{currentReport.catatan_guru}"</p>
                      </div>
                    )}

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
                              <p style={{textAlign:'center', color:'#94a3b8', fontSize:11, padding:30}}>Belum cukup data</p>
                            )}
                        </div>
                        <div style={{flex:1, border:'1px solid #eee', borderRadius:8, padding:10}}>
                            <h4 style={{marginTop:0, fontSize:13, textAlign:'center'}}>PETA 5 DIMENSI</h4>
                            {radarData.length > 0 ? (
                              <ResponsiveContainer width="100%" height="85%">
                                  <RadarChart outerRadius="70%" data={radarData}>
                                      <PolarGrid />
                                      <PolarAngleAxis dataKey="subject" fontSize={8} />
                                      <Radar name="Siswa" dataKey="A" stroke="#e67e22" fill="#e67e22" fillOpacity={0.6} />
                                  </RadarChart>
                              </ResponsiveContainer>
                            ) : (
                              <p style={{textAlign:'center', color:'#94a3b8', fontSize:11, padding:30}}>
                                {selectedMapel === "Semua" ? "Pilih mapel spesifik" : "Belum ada data dimensi"}
                              </p>
                            )}
                        </div>
                    </div>

                    {/* DAFTAR NILAI PER MAPEL (jika Semua) */}
                    {selectedMapel === "Semua" && reportData.length > 0 && (
                      <>
                        <h3 style={{borderLeft:'5px solid #3498db', paddingLeft:10, color:'#2c3e50', fontSize:16}}>📚 Nilai Per Mapel</h3>
                        <table style={{width:'100%', borderCollapse:'collapse', fontSize:12, marginTop:15}}>
                            <thead>
                                <tr style={{background:'#2c3e50', color:'white'}}>
                                    <th style={{padding:8, textAlign:'left'}}>Mapel</th>
                                    <th style={{padding:8, textAlign:'center'}}>Nilai Akhir</th>
                                    <th style={{padding:8, textAlign:'center'}}>Mode</th>
                                </tr>
                            </thead>
                            <tbody>
                                {reportData.map((r, idx) => (
                                  <tr key={idx} style={{borderBottom:'1px solid #eee', background: idx%2===0?'#f9f9f9':'white'}}>
                                      <td style={{padding:10, fontWeight:'bold'}}>📖 {r.mapel}</td>
                                      <td style={{padding:10, textAlign:'center', fontWeight:'bold', color: getScoreColor(r.nilai_akhir)}}>
                                        {r.nilai_akhir}
                                      </td>
                                      <td style={{padding:10, textAlign:'center', fontSize:10, color:'#64748b'}}>
                                        {r.mode_perhitungan || 'N/A'}
                                      </td>
                                  </tr>
                                ))}
                            </tbody>
                        </table>
                      </>
                    )}
                </div>
            )}
            
            {/* Kosong */}
            {selectedStudentId && !currentReport && (
              <div style={{ width: '210mm', background: 'white', padding: '15mm', boxSizing: 'border-box', textAlign: 'center' }}>
                <p style={{color:'#94a3b8', fontSize:14, padding:40}}>📭 Belum ada data raport untuk periode dan mapel terpilih.</p>
              </div>
            )}
        </div>
    </div>
  );
};

export default GradeReport;