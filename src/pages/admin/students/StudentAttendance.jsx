import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
// PERBAIKAN: Mengarahkan ke SidebarAdmin agar sinkron dengan sistem baru
import SidebarAdmin from '../../../components/SidebarAdmin'; 
import { db } from '../../../firebase'; 
import { doc, getDoc, collection, query, where, getDocs, addDoc, updateDoc, deleteDoc, serverTimestamp } from "firebase/firestore";

const StudentAttendance = () => {
  const navigate = useNavigate();
  const { id } = useParams(); 

  const [student, setStudent] = useState(null);
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // State Form Manual (Input Admin)
  const [newDate, setNewDate] = useState(new Date().toISOString().split('T')[0]);
  const [newStatus, setNewStatus] = useState("Hadir");
  const [newMapel, setNewMapel] = useState(""); // State baru untuk Mapel
  const [newKet, setNewKet] = useState("");

  // 1. LOAD DATA SISWA & ABSENSI
  const fetchData = async () => {
    setLoading(true);
    try {
      const docRef = doc(db, "students", id);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
          setStudent({ id: docSnap.id, ...docSnap.data() });
      } else {
          alert("Siswa tidak ditemukan!");
          navigate('/admin/students');
          return;
      }

      const q = query(collection(db, "attendance"), where("studentId", "==", id));
      const querySnapshot = await getDocs(q);
      const data = querySnapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      
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

  // 2. EDIT DATA (MENGUBAH DATA YANG SUDAH ADA)
  const handleEdit = async (itemId, currentStatus, currentKet, currentMapel) => {
    const statusBaru = prompt("Ubah Status (Hadir/Sakit/Izin/Alpha):", currentStatus);
    if (!statusBaru) return;

    const mapelBaru = prompt("Ubah Mapel:", currentMapel || "Umum");
    const ketBaru = prompt("Ubah Keterangan:", currentKet || "-");
    
    try {
      await updateDoc(doc(db, "attendance", itemId), {
        status: statusBaru,
        mapel: mapelBaru,
        keterangan: ketBaru
      });
      alert("✅ Data berhasil diperbarui!");
      fetchData(); 
    } catch (error) { 
        console.error(error);
        alert("Gagal update server."); 
    }
  };

  // 3. HAPUS DATA
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

  // 4. TAMBAH MANUAL (UNTUK SISWA YANG TIDAK MASUK/TERLEWAT)
  const handleAddManual = async (e) => {
    e.preventDefault();
    if(!student) return;
    
    try {
        await addDoc(collection(db, "attendance"), {
            studentId: id,
            namaSiswa: student.nama, 
            tanggal: newDate,
            mapel: newMapel || "Umum", // Mengambil dari input Mapel
            status: newStatus,
            keterangan: newKet || "-",
            createdAt: serverTimestamp() 
        });
        
        alert("✅ Data Absensi Berhasil Ditambahkan");
        // Reset Form
        setNewKet("");
        setNewMapel("");
        fetchData(); // Refresh tabel biar data baru muncul
    } catch (error) { 
        console.error(error);
        alert("Gagal menyimpan data.");
    }
  };

  if (loading) return <div style={{padding:50, textAlign:'center'}}>Sedang memuat data siswa...</div>;
  if (!student) return null;

  return (
    <div style={{ display: 'flex', background: '#f4f7f6', minHeight: '100vh' }}>
      {/* PERBAIKAN: Menggunakan SidebarAdmin */}
      <SidebarAdmin />
      <div style={styles.mainContent}>
        
        {/* HEADER */}
        <div style={styles.header}>
          <button style={styles.btnBack} onClick={() => navigate('/admin/students')}>← Kembali</button>
          <div style={{marginLeft: '20px'}}>
            <h2 style={{margin:0, color:'#2c3e50'}}>Detail Kehadiran Siswa</h2>
            <p style={{margin:'5px 0 0 0', color: '#7f8c8d'}}>
              {student.nama} | <span style={{color:'#2980b9', fontWeight:'bold'}}>{student.detailProgram || "Reguler"}</span>
            </p>
          </div>
        </div>

        {/* RINGKASAN */}
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

        {/* FORM INPUT MANUAL ADMIN */}
        <div style={styles.inputBox}>
            <div style={{fontWeight:'bold', marginBottom:15, color:'#2c3e50'}}>➕ Tambah/Catat Absensi Manual</div>
            <form onSubmit={handleAddManual} style={{display:'flex', gap:10, flexWrap:'wrap', alignItems:'center'}}>
                <div style={styles.formGroup}>
                    <label style={styles.label}>Tanggal</label>
                    <input type="date" value={newDate} onChange={e=>setNewDate(e.target.value)} style={styles.inputSm} required />
                </div>
                
                <div style={styles.formGroup}>
                    <label style={styles.label}>Mapel</label>
                    <input 
                      type="text" 
                      placeholder="Misal: IPA / MTK" 
                      value={newMapel} 
                      onChange={e=>setNewMapel(e.target.value)} 
                      style={styles.inputSm} 
                      required 
                    />
                </div>

                <div style={styles.formGroup}>
                    <label style={styles.label}>Status</label>
                    <select value={newStatus} onChange={e=>setNewStatus(e.target.value)} style={styles.inputSm}>
                        <option value="Hadir">Hadir</option>
                        <option value="Sakit">Sakit</option>
                        <option value="Izin">Izin</option>
                        <option value="Alpha">Alpha</option>
                    </select>
                </div>

                <div style={{...styles.formGroup, flex:1}}>
                    <label style={styles.label}>Keterangan Alasan</label>
                    <input 
                      type="text" 
                      placeholder="Contoh: Terlambat karena hujan / Sakit demam" 
                      value={newKet} 
                      onChange={e=>setNewKet(e.target.value)} 
                      style={{...styles.inputSm, width:'100%'}} 
                    />
                </div>

                <button type="submit" style={styles.btnSave}>Simpan</button>
            </form>
        </div>

        {/* TABEL DATA */}
        <div style={styles.card}>
          <table style={styles.table}>
            <thead>
              <tr style={{background: '#f8f9fa'}}>
                <th style={styles.th}>Tanggal</th>
                <th style={styles.th}>Mata Pelajaran</th>
                <th style={styles.th}>Status</th>
                <th style={styles.th}>Keterangan</th>
                <th style={{...styles.th, textAlign:'center'}}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {attendance.length === 0 ? (
                  <tr><td colSpan="5" style={{padding:30, textAlign:'center', color:'#999'}}>Belum ada riwayat kehadiran untuk siswa ini.</td></tr>
              ) : (
                  attendance.map((item) => (
                    <tr key={item.id} style={styles.tr}>
                      <td style={styles.td}>
                          {new Date(item.tanggal).toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                      </td>
                      <td style={{...styles.td, fontWeight:'bold'}}>{item.mapel || "-"}</td>
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
                        <button style={styles.btnEdit} title="Edit" onClick={() => handleEdit(item.id, item.status, item.keterangan, item.mapel)}>✏️</button>
                        <button style={styles.btnDelete} title="Hapus" onClick={() => handleDelete(item.id)}>🗑️</button>
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
  mainContent: { marginLeft: '250px', padding: '30px', width: '100%', fontFamily: 'Inter, system-ui, sans-serif' },
  header: { display: 'flex', alignItems: 'center', marginBottom: '30px' },
  btnBack: { background: 'white', border: '1px solid #bdc3c7', padding: '8px 15px', borderRadius: '5px', cursor: 'pointer', color:'#2c3e50', fontWeight:'bold' },
  summaryContainer: { display:'flex', gap:20, marginBottom:20 },
  statBox: { flex:1, padding:15, borderRadius:12, textAlign:'center', boxShadow:'0 2px 5px rgba(0,0,0,0.05)', border: '1px solid rgba(0,0,0,0.05)' },
  card: { background: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 4px 15px rgba(0,0,0,0.08)' },
  inputBox: { background: '#ffffff', padding: 20, borderRadius: 12, marginBottom: 25, border:'1px solid #e0e6ed', boxShadow: '0 2px 10px rgba(0,0,0,0.03)' },
  formGroup: { display:'flex', flexDirection:'column', gap:5 },
  label: { fontSize: 12, fontWeight: 'bold', color: '#7f8c8d' },
  inputSm: { padding: '10px 12px', borderRadius: 6, border: '1px solid #dcdfe6', fontSize: 14 },
  btnSave: { padding: '12px 25px', background: '#2980b9', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight:'bold', alignSelf: 'flex-end' },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { textAlign: 'left', padding: '15px', borderBottom: '2px solid #f4f6f7', color:'#909399', fontSize:13, textTransform: 'uppercase', letterSpacing: '0.5px' },
  tr: { borderBottom: '1px solid #f4f6f7', transition: '0.3s' },
  td: { padding: '15px', fontSize:14, color:'#2c3e50' },
  badgeGreen: { background: '#e1f7e3', color: '#1db446', padding: '5px 12px', borderRadius: '20px', fontSize: '11px', fontWeight: 'bold' },
  badgeYellow: { background: '#fff9db', color: '#f08c00', padding: '5px 12px', borderRadius: '20px', fontSize: '11px', fontWeight: 'bold' },
  badgeRed: { background: '#fff5f5', color: '#fa5252', padding: '5px 12px', borderRadius: '20px', fontSize: '11px', fontWeight: 'bold' },
  btnEdit: { background: '#f39c12', color: 'white', border: 'none', padding: '8px', borderRadius: '6px', cursor: 'pointer', marginRight:8 },
  btnDelete: { background: '#e74c3c', color: 'white', border: 'none', padding: '8px', borderRadius: '6px', cursor: 'pointer' }
};

export default StudentAttendance;