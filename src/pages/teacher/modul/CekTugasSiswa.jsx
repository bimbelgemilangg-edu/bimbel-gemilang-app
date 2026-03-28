import React, { useState, useEffect } from 'react';
import { db } from '../../../firebase';
import { collection, getDocs, doc, updateDoc, query, orderBy } from "firebase/firestore";
import { CheckCircle, Clock, AlertCircle, Search, Edit3, Save, Download } from 'lucide-react';
import * as XLSX from 'xlsx'; // Import library Excel

const CekTugasSiswa = () => {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [editingScore, setEditingScore] = useState(null);
  const [newScore, setNewScore] = useState("");

  useEffect(() => {
    fetchSubmissions();
  }, []);

  const fetchSubmissions = async () => {
    try {
      const q = query(collection(db, "quiz_results"), orderBy("submittedAt", "desc"));
      const snap = await getDocs(q);
      setSubmissions(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (e) {
      console.error("Error fetching data:", e);
    }
    setLoading(false);
  };

  // --- FUNGSI DOWNLOAD EXCEL ---
  const downloadExcel = () => {
    if (submissions.length === 0) return alert("Tidak ada data untuk didownload");

    const dataExcel = filtered.map((s) => ({
      "Nama Siswa": s.studentName,
      "Modul/Tugas": s.modulTitle,
      "Waktu Kumpul": s.submittedAt?.toDate().toLocaleString('id-ID'),
      "Status": s.submittedAt?.toDate() > s.deadline?.toDate() ? "Terlambat" : "Tepat Waktu",
      "Nilai": s.score || 0
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataExcel);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Rekap Nilai");
    
    // Simpan file dengan nama otomatis berdasarkan tanggal
    XLSX.writeFile(workbook, `Rekap_Nilai_Gemilang_${new Date().toLocaleDateString()}.xlsx`);
  };

  const handleUpdateScore = async (id) => {
    try {
      const ref = doc(db, "quiz_results", id);
      await updateDoc(ref, { 
        score: Number(newScore),
        graded: true 
      });
      alert("Nilai berhasil diperbarui!");
      setEditingScore(null);
      fetchSubmissions();
    } catch (e) {
      alert("Gagal update nilai");
    }
  };

  const filtered = submissions.filter(s => 
    s.studentName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.modulTitle?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div>
          <h2 style={{margin: 0}}>📝 Rekap Tugas & Kuis Siswa</h2>
          <p style={{color: '#64748b', fontSize: '13px'}}>Kelola pengumpulan materi dari Portal Pengajar.</p>
        </div>
        
        <div style={{display: 'flex', gap: '10px'}}>
            <button onClick={downloadExcel} style={styles.btnDownload}>
                <Download size={18}/> Export Excel
            </button>
            <div style={styles.searchBox}>
                <Search size={18} color="#94a3b8" />
                <input 
                    placeholder="Cari siswa..." 
                    style={styles.searchInput}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
        </div>
      </div>

      {loading ? <p>Memuat data...</p> : (
        <div style={styles.tableWrapper}>
          <table style={styles.table}>
            <thead>
              <tr style={styles.thr}>
                <th>Siswa</th>
                <th>Modul / Tugas</th>
                <th>Waktu Kumpul</th>
                <th>Status</th>
                <th>Nilai</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((s) => {
                const isLate = s.submittedAt?.toDate() > s.deadline?.toDate();
                return (
                  <tr key={s.id} style={styles.tr}>
                    <td style={styles.td}><strong>{s.studentName}</strong></td>
                    <td style={styles.td}>{s.modulTitle}</td>
                    <td style={styles.td}>{s.submittedAt?.toDate().toLocaleString('id-ID')}</td>
                    <td style={styles.td}>
                      {isLate ? (
                        <span style={styles.badgeLate}><AlertCircle size={12}/> Terlambat</span>
                      ) : (
                        <span style={styles.badgeSuccess}><CheckCircle size={12}/> Tepat Waktu</span>
                      )}
                    </td>
                    <td style={styles.td}>
                      {editingScore === s.id ? (
                        <input type="number" style={styles.scoreInput} value={newScore} onChange={(e) => setNewScore(e.target.value)} />
                      ) : (
                        <span style={{fontWeight:'bold'}}>{s.score || '0'}</span>
                      )}
                    </td>
                    <td style={styles.td}>
                      {editingScore === s.id ? (
                        <button onClick={() => handleUpdateScore(s.id)} style={styles.btnSave}><Save size={14}/> Simpan</button>
                      ) : (
                        <button onClick={() => {setEditingScore(s.id); setNewScore(s.score)}} style={styles.btnEdit}><Edit3 size={14}/> Nilai</button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {filtered.length === 0 && <p style={styles.empty}>Belum ada data pengumpulan.</p>}
        </div>
      )}
    </div>
  );
};

const styles = {
  container: { padding: '30px', background: '#f8fafc', minHeight: '100vh', fontFamily: 'Segoe UI, sans-serif' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' },
  searchBox: { display: 'flex', alignItems: 'center', gap: '10px', background: 'white', padding: '8px 15px', borderRadius: '10px', width: '250px', border: '1px solid #e2e8f0' },
  searchInput: { border: 'none', outline: 'none', width: '100%', fontSize: '13px' },
  btnDownload: { background: '#2563eb', color: 'white', border: 'none', padding: '10px 15px', borderRadius: '10px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 'bold', fontSize: '13px' },
  tableWrapper: { background: 'white', borderRadius: '15px', overflow: 'hidden', boxShadow: '0 4px 15px rgba(0,0,0,0.05)' },
  table: { width: '100%', borderCollapse: 'collapse', textAlign: 'left' },
  thr: { background: '#f1f5f9', color: '#64748b', fontSize: '12px', textTransform: 'uppercase' },
  tr: { borderBottom: '1px solid #f1f5f9', transition: '0.2s' },
  td: { padding: '15px 20px', fontSize: '14px', color: '#334155' },
  badgeSuccess: { display: 'inline-flex', alignItems: 'center', gap: '5px', background: '#dcfce7', color: '#166534', padding: '4px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 'bold' },
  badgeLate: { display: 'inline-flex', alignItems: 'center', gap: '5px', background: '#fee2e2', color: '#991b1b', padding: '4px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 'bold' },
  scoreInput: { width: '50px', padding: '5px', borderRadius: '5px', border: '1px solid #cbd5e1' },
  btnEdit: { background: '#f1f5f9', border: 'none', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '5px' },
  btnSave: { background: '#10b981', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '5px' },
  empty: { textAlign: 'center', padding: '40px', color: '#94a3b8' }
};

export default CekTugasSiswa;