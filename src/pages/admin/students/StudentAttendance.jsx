import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Sidebar from '../../../components/Sidebar';
import { db } from '../../../firebase';
import { doc, getDoc, collection, query, where, getDocs, addDoc, updateDoc } from "firebase/firestore";

const StudentAttendance = () => {
  const navigate = useNavigate();
  const { id } = useParams(); // ID Siswa

  const [student, setStudent] = useState(null);
  const [attendance, setAttendance] = useState([]);
  
  // State Form Manual (Jaga-jaga admin mau input manual)
  const [newDate, setNewDate] = useState(new Date().toISOString().split('T')[0]);
  const [newStatus, setNewStatus] = useState("Hadir");
  const [newKet, setNewKet] = useState("-");

  // 1. LOAD DATA SISWA & ABSENSI
  const fetchData = async () => {
    try {
      // Ambil Info Siswa
      const docRef = doc(db, "students", id);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) setStudent({ id: docSnap.id, ...docSnap.data() });

      // Ambil History Absensi (Dari Collection khusus 'student_attendance')
      // Catatan: Ini diisi manual oleh admin atau trigger otomatis nanti
      const q = query(collection(db, "student_attendance"), where("studentId", "==", id));
      const querySnapshot = await getDocs(q);
      const data = querySnapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      
      // Sort tanggal terbaru
      setAttendance(data.sort((a,b) => new Date(b.tanggal) - new Date(a.tanggal)));

    } catch (error) { console.error(error); }
  };

  useEffect(() => { fetchData(); }, [id]);

  // 2. FUNGSI EDIT STATUS (Admin Only)
  const handleEdit = async (itemId) => {
    const statusBaru = prompt("Ubah Status (Hadir/Sakit/Izin/Alpha):");
    const ketBaru = prompt("Ubah Keterangan:", "-");
    
    if (statusBaru) {
      try {
        await updateDoc(doc(db, "student_attendance", itemId), {
          status: statusBaru,
          keterangan: ketBaru
        });
        alert("✅ Data berhasil diupdate!");
        fetchData();
      } catch (error) { alert("Gagal update server."); }
    }
  };

  // 3. FUNGSI TAMBAH MANUAL (Fitur Safety Net)
  const handleAddManual = async (e) => {
    e.preventDefault();
    if(!student) return;
    try {
        await addDoc(collection(db, "student_attendance"), {
            studentId: id,
            namaSiswa: student.nama,
            tanggal: newDate,
            mapel: "Manual Admin",
            status: newStatus,
            keterangan: newKet
        });
        alert("✅ Absen Manual Tersimpan");
        fetchData();
    } catch (error) { console.error(error); }
  };

  if (!student) return <div style={{padding:50}}>Loading Data Siswa...</div>;

  return (
    <div style={{ display: 'flex' }}>
      <Sidebar />
      <div style={styles.mainContent}>
        <div style={styles.header}>
          <button style={styles.btnBack} onClick={() => navigate('/admin/students')}>← Kembali</button>
          <div style={{marginLeft: '20px'}}>
            <h2 style={{margin:0}}>Rekap Kehadiran Siswa</h2>
            <p style={{margin:'5px 0 0 0', color: '#7f8c8d'}}>
              {student.nama} | {student.detailProgram || student.kelas}
            </p>
          </div>
        </div>

        {/* INPUT MANUAL ADMIN (JIKA PERLU) */}
        <div style={styles.inputBox}>
            <small style={{fontWeight:'bold', display:'block', marginBottom:5}}>➕ Input Manual (Admin)</small>
            <form onSubmit={handleAddManual} style={{display:'flex', gap:10}}>
                <input type="date" value={newDate} onChange={e=>setNewDate(e.target.value)} style={styles.inputSm} />
                <select value={newStatus} onChange={e=>setNewStatus(e.target.value)} style={styles.inputSm}>
                    <option>Hadir</option><option>Sakit</option><option>Izin</option><option>Alpha</option>
                </select>
                <input type="text" placeholder="Ket..." value={newKet} onChange={e=>setNewKet(e.target.value)} style={styles.inputSm} />
                <button type="submit" style={styles.btnSave}>Simpan</button>
            </form>
        </div>

        <div style={styles.card}>
          <div style={styles.summary}>
            <div style={styles.statBox}><h3>{attendance.filter(x => x.status === 'Hadir').length}</h3><p>Hadir</p></div>
            <div style={styles.statBox}><h3>{attendance.filter(x => x.status === 'Sakit').length}</h3><p>Sakit</p></div>
            <div style={styles.statBox}><h3>{attendance.filter(x => x.status === 'Izin').length}</h3><p>Izin</p></div>
            <div style={styles.statBoxWarning}><h3>{attendance.filter(x => x.status === 'Alpha').length}</h3><p>Alpha</p></div>
          </div>

          <table style={styles.table}>
            <thead>
              <tr style={{background: '#f8f9fa'}}>
                <th style={styles.th}>Tanggal</th>
                <th style={styles.th}>Kegiatan / Mapel</th>
                <th style={styles.th}>Status</th>
                <th style={styles.th}>Keterangan</th>
                <th style={styles.th}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {attendance.length === 0 && <tr><td colSpan="5" style={{padding:20, textAlign:'center'}}>Belum ada data absensi.</td></tr>}
              {attendance.map((item) => (
                <tr key={item.id} style={styles.tr}>
                  <td style={styles.td}>{item.tanggal}</td>
                  <td style={styles.td}>{item.mapel}</td>
                  <td style={styles.td}>
                    <span style={
                      item.status === 'Hadir' ? styles.badgeGreen : 
                      item.status === 'Alpha' ? styles.badgeRed : styles.badgeYellow
                    }>
                      {item.status}
                    </span>
                  </td>
                  <td style={styles.td}>{item.keterangan || "-"}</td>
                  <td style={styles.td}>
                    <button style={styles.btnEdit} onClick={() => handleEdit(item.id)}>✏️ Edit</button>
                  </td>
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
  mainContent: { marginLeft: '250px', padding: '30px', width: '100%', background: '#f4f7f6', minHeight: '100vh', fontFamily: 'sans-serif' },
  header: { display: 'flex', alignItems: 'center', marginBottom: '20px' },
  btnBack: { background: 'white', border: '1px solid #ddd', padding: '10px 15px', borderRadius: '5px', cursor: 'pointer' },
  card: { background: 'white', padding: '20px', borderRadius: '10px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' },
  
  inputBox: { background: '#e1f5fe', padding: 15, borderRadius: 10, marginBottom: 20 },
  inputSm: { padding: 8, borderRadius: 5, border: '1px solid #ddd' },
  btnSave: { padding: '8px 15px', background: '#2980b9', color: 'white', border: 'none', borderRadius: 5, cursor: 'pointer' },

  summary: { display: 'flex', gap: '20px', marginBottom: '20px', borderBottom: '1px solid #eee', paddingBottom: '20px' },
  statBox: { flex: 1, textAlign: 'center', background: '#e8f6f3', padding: '15px', borderRadius: '8px', color: '#16a085' },
  statBoxWarning: { flex: 1, textAlign: 'center', background: '#fadbd8', padding: '15px', borderRadius: '8px', color: '#c0392b' },
  
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { textAlign: 'left', padding: '12px', borderBottom: '2px solid #ddd' },
  tr: { borderBottom: '1px solid #eee' },
  td: { padding: '12px' },
  
  badgeGreen: { background: '#d4edda', color: '#155724', padding: '4px 8px', borderRadius: '10px', fontSize: '12px', fontWeight: 'bold' },
  badgeYellow: { background: '#fff3cd', color: '#856404', padding: '4px 8px', borderRadius: '10px', fontSize: '12px', fontWeight: 'bold' },
  badgeRed: { background: '#f8d7da', color: '#721c24', padding: '4px 8px', borderRadius: '10px', fontSize: '12px', fontWeight: 'bold' },
  btnEdit: { background: '#f1c40f', color: 'white', border: 'none', padding: '5px 10px', borderRadius: '5px', cursor: 'pointer', fontSize: '12px' }
};

export default StudentAttendance;