import React, { useState, useEffect, useRef } from 'react';
import { db } from '../../firebase';
import { collection, query, where, getDocs } from "firebase/firestore";
import SidebarSiswa from '../../components/SidebarSiswa';
import { 
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
    Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis 
} from 'recharts';

// Library Cetak PDF (Sesuai Versi Admin)
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

const StudentGrades = () => {
  const printRef = useRef();
  const [isPrinting, setIsPrinting] = useState(false);
  
  const studentId = localStorage.getItem('studentId');
  const studentName = localStorage.getItem('studentName');

  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
  const [gpaHistory, setGpaHistory] = useState([]);
  const [radarData, setRadarData] = useState([]);
  const [currentGrades, setCurrentGrades] = useState([]);
  const [summary, setSummary] = useState({ gpa: 0, title: "MEMUAT...", body: "" });

  useEffect(() => {
    const fetchData = async () => {
      if (!studentId) return;
      try {
        const q = query(collection(db, "grades"), where("studentId", "==", studentId));
        const snap = await getDocs(q);
        const allGrades = snap.docs.map(d => d.data());
        allGrades.sort((a, b) => new Date(a.tanggal) - new Date(b.tanggal));

        // 1. LOGIKA GPA HISTORY (Sama dengan Admin)
        const monthlyGroups = {};
        allGrades.forEach(g => {
          const monthLabel = new Date(g.tanggal).toLocaleDateString('id-ID', { month: 'short', year: '2-digit' });
          if (!monthlyGroups[monthLabel]) monthlyGroups[monthLabel] = { name: monthLabel, total: 0, count: 0, rawDate: g.tanggal };
          monthlyGroups[monthLabel].total += g.nilai;
          monthlyGroups[monthLabel].count += 1;
        });

        const gpaData = Object.values(monthlyGroups)
          .sort((a, b) => new Date(a.rawDate) - new Date(b.rawDate))
          .map(m => ({ name: m.name, GPA: Math.round(m.total / m.count) }));
        setGpaHistory(gpaData);

        // 2. DATA BULAN TERPILIH
        const filtered = allGrades.filter(g => g.tanggal.startsWith(selectedMonth));
        setCurrentGrades(filtered);

        // 3. NARASI & RADAR (Sama dengan Admin)
        if (filtered.length > 0) {
          const avg = Math.round(filtered.reduce((a, b) => a + b.nilai, 0) / filtered.length);
          let title = avg >= 85 ? "PERFORMA SANGAT BAIK" : avg >= 75 ? "PERFORMA BAIK" : "PERLU BELAJAR LAGI";
          setSummary({ gpa: avg, title, body: `Rata-rata nilaimu bulan ini adalah ${avg}. Pertahankan semangat belajarmu!` });

          // Radar Kompetensi
          let aspekSum = { pemahaman: 0, logika: 0, literasi: 0, inisiatif: 0, mandiri: 0 };
          filtered.forEach(g => {
            if (g.qualitative) {
              aspekSum.pemahaman += g.qualitative.pemahaman || 0;
              aspekSum.logika += g.qualitative.aplikasi || 0;
              aspekSum.literasi += g.qualitative.literasi || 0;
              aspekSum.inisiatif += g.qualitative.inisiatif || 0;
              aspekSum.mandiri += g.qualitative.mandiri || 0;
            }
          });
          setRadarData([
            { subject: 'Pemahaman', A: (aspekSum.pemahaman / filtered.length).toFixed(1) },
            { subject: 'Logika', A: (aspekSum.logika / filtered.length).toFixed(1) },
            { subject: 'Literasi', A: (aspekSum.literasi / filtered.length).toFixed(1) },
            { subject: 'Inisiatif', A: (aspekSum.inisiatif / filtered.length).toFixed(1) },
            { subject: 'Mandiri', A: (aspekSum.mandiri / filtered.length).toFixed(1) },
          ]);
        } else {
          setSummary({ gpa: 0, title: "DATA KOSONG", body: "Belum ada nilai yang diinput guru untuk bulan ini." });
          setRadarData([]);
        }
      } catch (e) { console.error(e); }
    };
    fetchData();
  }, [studentId, selectedMonth]);

  const handleDownloadPDF = async () => {
    setIsPrinting(true);
    const element = printRef.current;
    const canvas = await html2canvas(element, { scale: 2 });
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');
    pdf.addImage(imgData, 'PNG', 0, 0, 210, (canvas.height * 210) / canvas.width);
    pdf.save(`Rapor_${studentName}_${selectedMonth}.pdf`);
    setIsPrinting(false);
  };

  return (
    <div style={{ display: 'flex', background: '#f0f2f5', minHeight: '100vh' }}>
      <SidebarSiswa activeMenu="rapor" />
      <div style={styles.container}>
        
        {/* Header Controls */}
        <div style={styles.header}>
          <h2>📊 Rapor Akademikmu</h2>
          <div style={{ display: 'flex', gap: '10px' }}>
            <input type="month" value={selectedMonth} onChange={e => setSelectedMonth(e.target.value)} style={styles.inputMonth} />
            <button onClick={handleDownloadPDF} style={styles.btnDownload}>
              {isPrinting ? '⏳ Mendownload...' : '📄 Download PDF'}
            </button>
          </div>
        </div>

        <div ref={printRef} style={styles.reportSheet}>
          {/* Summary Card */}
          <div style={styles.summaryCard}>
            <h3>{summary.title}</h3>
            <p>{summary.body}</p>
            <div style={styles.gpaBadge}>GPA: {summary.gpa}</div>
          </div>

          <div style={styles.chartGrid}>
            {/* Tren GPA */}
            <div style={styles.chartBox}>
              <h4 style={{textAlign:'center'}}>Tren Nilai</h4>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={gpaHistory}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" fontSize={10} />
                  <YAxis domain={[0, 100]} fontSize={10} />
                  <Tooltip />
                  <Line type="monotone" dataKey="GPA" stroke="#3498db" strokeWidth={3} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Radar Kompetensi */}
            <div style={styles.chartBox}>
              <h4 style={{textAlign:'center'}}>Karakter Belajar</h4>
              <ResponsiveContainer width="100%" height={200}>
                <RadarChart data={radarData}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="subject" fontSize={10} />
                  <Radar dataKey="A" stroke="#e67e22" fill="#e67e22" fillOpacity={0.5} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Table Nilai */}
          <table style={styles.table}>
            <thead>
              <tr style={{ background: '#2c3e50', color: 'white' }}>
                <th style={styles.th}>Mata Pelajaran</th>
                <th style={styles.th}>Topik</th>
                <th style={styles.th}>Nilai</th>
              </tr>
            </thead>
            <tbody>
              {currentGrades.map((g, i) => (
                <tr key={i} style={{ borderBottom: '1px solid #eee' }}>
                  <td style={styles.td}><b>{g.mapel}</b></td>
                  <td style={styles.td}>{g.topik}</td>
                  <td style={styles.td}><span style={styles.nilaiBadge}>{g.nilai}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const styles = {
  container: { marginLeft: '250px', padding: '30px', width: '100%' },
  header: { display: 'flex', justifyContent: 'space-between', marginBottom: '20px', alignItems: 'center' },
  reportSheet: { background: 'white', padding: '30px', borderRadius: '12px', boxShadow: '0 4px 10px rgba(0,0,0,0.05)' },
  summaryCard: { background: '#f4fbf7', border: '1px solid #27ae60', padding: '20px', borderRadius: '10px', marginBottom: '20px', textAlign: 'center' },
  gpaBadge: { fontSize: '24px', fontWeight: 'bold', color: '#27ae60', marginTop: '10px' },
  chartGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' },
  chartBox: { border: '1px solid #eee', padding: '15px', borderRadius: '10px' },
  table: { width: '100%', borderCollapse: 'collapse', marginTop: '20px' },
  th: { padding: '12px', textAlign: 'left' },
  td: { padding: '12px' },
  nilaiBadge: { background: '#3498db', color: 'white', padding: '4px 10px', borderRadius: '15px', fontWeight: 'bold' },
  btnDownload: { background: '#e74c3c', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' },
  inputMonth: { padding: '8px', borderRadius: '8px', border: '1px solid #ddd' }
};

export default StudentGrades;