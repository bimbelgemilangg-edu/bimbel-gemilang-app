import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
// ✅ PERBAIKAN PENTING: Menggunakan ../../../ (naik 3 level)
import Sidebar from '../../../components/Sidebar'; 
import { db } from '../../../firebase'; 
import { doc, getDoc, collection, query, where, getDocs, addDoc, updateDoc, deleteDoc } from "firebase/firestore";

const StudentAttendance = () => {
  const navigate = useNavigate();
  const { id } = useParams(); // ID Siswa dari URL

  const [student, setStudent] = useState(null);
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // State Form Manual (Input Admin)
  const [newDate, setNewDate] = useState(new Date().toISOString().split('T')[0]);
  const [newStatus, setNewStatus] = useState("Hadir");
  const [newKet, setNewKet] = useState("");

  // 1. LOAD DATA SISWA & ABSENSI
  const fetchData = async () => {
    setLoading(true);
    try {
      // Ambil Info Siswa
      const docRef = doc(db, "students", id);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
          setStudent({ id: docSnap.id, ...docSnap.data() });
      } else {
          alert("Siswa tidak ditemukan!");
          navigate('/admin/students');
          return;
      }

      // Ambil History Absensi
      // Menggunakan koleksi 'attendance' (Sesuai kode Guru sebelumnya)
      const q = query(collection(db, "attendance"), where("studentId", "==", id));
      const querySnapshot = await getDocs(q);
      const data = querySnapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      
      // Sort tanggal terbaru (Descending)
      data.sort((a,b) => new Date(b.tanggal) - new Date(a.tanggal));
      setAttendance(data);

    } catch (error) { 
        console.error("Error fetching data:", error); 
    } finally {
        setLoading(false);
    }
  };

  useEffect(() => { 
      if(id) fetchData(); 
  }, [id]);

  // 2. EDIT STATUS
  const handleEdit = async (itemId, currentStatus, currentKet) => {
    const statusBaru = prompt("Ubah Status (Hadir/Sakit/Izin/Alpha):", currentStatus);
    if (!statusBaru) return; // Batal

    const ketBaru = prompt("Ubah Keterangan:", currentKet || "-");
    
    try {
      await updateDoc(doc(db, "attendance", itemId), {
        status: statusBaru,
        keterangan: ketBaru
      });
      alert("✅ Data berhasil diupdate!");
      fetchData(); // Refresh tabel
    } catch (error) { 
        console.error(error);
        alert("Gagal update server."); 
    }
  };

  // 3. HAPUS ABSEN
  const handleDelete = async (itemId) => {
      if(window.confirm("Yakin ingin menghapus data absensi ini?")) {
          try {
              await deleteDoc(doc(db, "attendance", itemId));
              alert("Data dihapus.");
              fetchData();
          } catch (error) {
              alert("Gagal menghapus.");
          }
      }
  };

  // 4. TAMBAH MANUAL
  const handleAddManual = async (e) => {
    e.preventDefault();
    if(!student) return;
    try {
        await addDoc(collection(db, "attendance"), {
            studentId: id,
            namaSiswa: student.nama, 
            tanggal: newDate,
            mapel: "Input Manual Admin", // Penanda ini inputan manual
            status: newStatus,
            keterangan: newKet || "-",
            timestamp: new Date() // Tanggal server
        });
        alert("✅ Absen Manual Tersimpan");
        setNewKet("");
        fetchData();
    } catch (error) { console.error(error); }
  };

  if (loading) return <div style={{padding:50, textAlign:'center'}}>Sedang memuat data siswa...</div>;
  if (!student) return null;

  return (
    <div style={{ display: 'flex', background: '#f4f7f6', minHeight: '100vh' }}>
      <Sidebar />
      <div style={styles.mainContent}>
        
        {/* HEADER */}
        <div style={styles.header}>
          <button style={styles.btnBack} onClick={() => navigate('/admin/students')}>← Kembali</button>
          <div style={{marginLeft: '20px'}}>
            <h2 style={{margin:0, color:'#2c3e50'}}>Detail Kehadiran</h2>
            <p style={{margin:'5px 0 0 0', color: '#7f8c8d'}}>
              {student.nama} <span style={{background:'#ddd', padding:'2px 8px', borderRadius:10, fontSize:12}}>{student.detailProgram || "Reguler"}</span>
            </p>
          </div>
        </div>

        {/* BOX SUMMARY */}
        <div style={styles.summaryContainer}>
            <div style={{...styles.statBox, background:'#e8f8f5', color:'#27ae60'}}>
                <h3>{attendance.filter(x => x.status === 'Hadir').length}</h3>
                <span>Hadir</span>
            </div>
            <div style={{...styles.statBox, background:'#fef9e7', color:'#f1c40f'}}>
                <h3>{attendance.filter(x => x.status === 'Sakit' || x.status === 'Izin').length}</h3>
                <span>Sakit/Izin</span>
            </div>
            <div style={{...styles.statBox, background:'#fdedec', color:'#e74c3c'}}>
                <h3>{attendance.filter(x => x.status === 'Alpha').length}</h3>
                <span>Alpha</span>
            </div>
        </div>

        {/* INPUT MANUAL ADMIN */}
        <div style={styles.inputBox}>
            <div style={{fontWeight:'bold', marginBottom:10, color:'#2980b9'}}>➕ Tambah Absensi Manual</div>
            <form onSubmit={handleAddManual} style={{display:'flex', gap:10, flexWrap:'wrap'}}>
                <input type="date" value={newDate} onChange={e=>setNewDate(e.target.value)} style={styles.inputSm} required />
                <select value={newStatus} onChange={e=>setNewStatus(e.target.value)} style={styles.inputSm}>
                    <option value="Hadir">Hadir</option>
                    <option value="Sakit">Sakit</option>
                    <option value="Izin">Izin</option>
                    <option value="Alpha">Alpha</option>
                </select>
                <input type="text" placeholder="Keterangan (Opsional)" value={newKet} onChange={e=>setNewKet(e.target.value)} style={{...styles.inputSm, flex:1}} />
                <button type="submit" style={styles.btnSave}>Simpan Data</button>
            </form>
        </div>

        {/* TABEL DATA */}
        <div style={styles.card}>
          <table style={styles.table}>
            <thead>
              <tr style={{background: '#f8f9fa'}}>
                <th style={styles.th}>Tanggal</th>
                <th style={styles.th}>Kegiatan / Mapel</th>
                <th style={styles.th}>Status</th>
                <th style={styles.th}>Keterangan</th>
                <th style={{...styles.th, textAlign:'center'}}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {attendance.length === 0 ? (
                  <tr><td colSpan="5" style={{padding:30, textAlign:'center', color:'#999'}}>Belum ada riwayat kehadiran.</td></tr>
              ) : (
                  attendance.map((item) => (
                    <tr key={item.id} style={styles.tr}>
                      <td style={styles.td}>
                          {new Date(item.tanggal).toLocaleDateString('id-ID')}
                      </td>
                      <td style={styles.td}>{item.mapel || item.program || "-"}</td>
                      <td style={styles.td}>
                        <span style={
                          item.status === 'Hadir' ? styles.badgeGreen : 
                          item.status === 'Alpha' ? styles.badgeRed : styles.badgeYellow
                        }>
                          {item.status}
                        </span>
                      </td>
                      <td style={styles.td}>{item.keterangan || "-"}</td>
                      <td style={{...styles.td, textAlign:'center'}}>
                        <button style={styles.btnEdit} onClick={() => handleEdit(item.id, item.status, item.keterangan)}>✏️</button>
                        <button style={styles.btnDelete} onClick={() => handleDelete(item.id)}>🗑️</button>
                      </td>
                    </tr>
                  ))
              )}
            </tbody>
          </table>
        </div>

      </div>
    </div>
  );
};

// STYLING
const styles = {
  mainContent: { marginLeft: '250px', padding: '30px', width: '100%', fontFamily: 'Segoe UI, sans-serif' },
  header: { display: 'flex', alignItems: 'center', marginBottom: '30px' },
  btnBack: { background: 'white', border: '1px solid #bdc3c7', padding: '8px 15px', borderRadius: '5px', cursor: 'pointer', color:'#2c3e50', fontWeight:'bold' },
  
  summaryContainer: { display:'flex', gap:20, marginBottom:20 },
  statBox: { flex:1, padding:15, borderRadius:8, textAlign:'center', boxShadow:'0 2px 5px rgba(0,0,0,0.05)' },

  card: { background: 'white', padding: '20px', borderRadius: '10px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' },
  
  inputBox: { background: '#d6eaf8', padding: 20, borderRadius: 10, marginBottom: 20, border:'1px solid #a9cce3' },
  inputSm: { padding: '8px 12px', borderRadius: 5, border: '1px solid #bdc3c7' },
  btnSave: { padding: '8px 20px', background: '#2980b9', color: 'white', border: 'none', borderRadius: 5, cursor: 'pointer', fontWeight:'bold' },

  table: { width: '100%', borderCollapse: 'collapse' },
  th: { textAlign: 'left', padding: '15px', borderBottom: '2px solid #eee', color:'#7f8c8d', fontSize:14 },
  tr: { borderBottom: '1px solid #f4f6f7' },
  td: { padding: '15px', fontSize:14, color:'#2c3e50' },
  
  badgeGreen: { background: '#d4edda', color: '#155724', padding: '5px 10px', borderRadius: '15px', fontSize: '12px', fontWeight: 'bold' },
  badgeYellow: { background: '#fff3cd', color: '#856404', padding: '5px 10px', borderRadius: '15px', fontSize: '12px', fontWeight: 'bold' },
  badgeRed: { background: '#f8d7da', color: '#721c24', padding: '5px 10px', borderRadius: '15px', fontSize: '12px', fontWeight: 'bold' },
  
  btnEdit: { background: '#f39c12', color: 'white', border: 'none', padding: '6px 10px', borderRadius: '4px', cursor: 'pointer', marginRight:5 },
  btnDelete: { background: '#e74c3c', color: 'white', border: 'none', padding: '6px 10px', borderRadius: '4px', cursor: 'pointer' }
};

export default StudentAttendance;