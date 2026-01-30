import React, { useState, useEffect } from 'react';
import Sidebar from '../../../components/Sidebar';

const TeacherList = () => {
  // STATE
  const [dailyCode, setDailyCode] = useState("");
  const [teachers, setTeachers] = useState([]);
  
  // State Form Tambah Guru
  const [newTeacher, setNewTeacher] = useState({ nama: "", mapel: "" });

  // --- 1. LOAD DATA (SMART LOGIC) ---
  useEffect(() => {
    // Load Kode Harian
    const savedCode = localStorage.getItem("DAILY_TEACHER_CODE");
    if (savedCode) setDailyCode(savedCode);

    // Load Data Guru dari Database Lokal
    const savedTeachers = localStorage.getItem("DB_TEACHERS");
    if (savedTeachers) {
      setTeachers(JSON.parse(savedTeachers));
    } else {
      // Data Awal (Jika kosong)
      const initialData = [
        { id: 1, nama: "Pak Budi", mapel: "Matematika" },
        { id: 2, nama: "Bu Siti", mapel: "Bahasa Inggris" }
      ];
      setTeachers(initialData);
      localStorage.setItem("DB_TEACHERS", JSON.stringify(initialData));
    }
  }, []);

  // --- 2. FUNGSI LOGIKA ---
  
  // Simpan Kode Harian
  const handleSaveCode = () => {
    if (!dailyCode) return alert("Kode tidak boleh kosong!");
    localStorage.setItem("DAILY_TEACHER_CODE", dailyCode);
    alert(`✅ Kode Update: ${dailyCode}`);
  };

  // Tambah Guru Baru
  const handleAddTeacher = (e) => {
    e.preventDefault();
    if (!newTeacher.nama || !newTeacher.mapel) return alert("Isi nama dan mapel!");

    const newItem = {
      id: Date.now(),
      nama: newTeacher.nama,
      mapel: newTeacher.mapel
    };

    const updatedList = [...teachers, newItem];
    setTeachers(updatedList);
    localStorage.setItem("DB_TEACHERS", JSON.stringify(updatedList)); // Simpan Permanen
    setNewTeacher({ nama: "", mapel: "" }); // Reset Form
    alert("Guru berhasil ditambahkan! Nama otomatis muncul di menu Jadwal & Login.");
  };

  // Hapus Guru
  const handleDelete = (id) => {
    if (window.confirm("Yakin menghapus data guru ini?")) {
      const updatedList = teachers.filter(t => t.id !== id);
      setTeachers(updatedList);
      localStorage.setItem("DB_TEACHERS", JSON.stringify(updatedList));
    }
  };

  return (
    <div style={{ display: 'flex' }}>
      <Sidebar />
      <div style={styles.content}>
        
        <div style={styles.header}>
          <h2>👨‍🏫 Master Data Guru & Akses</h2>
        </div>

        {/* SECTION 1: KODE AKSES */}
        <div style={styles.codeCard}>
          <div>
            <h3 style={{marginTop:0, color:'#d35400'}}>🔑 Kode Akses Harian</h3>
            <p style={{fontSize:'13px', color:'#555'}}>Update kode ini setiap hari agar guru bisa login.</p>
          </div>
          <div style={{display:'flex', gap:'10px'}}>
            <input 
              type="text" value={dailyCode} onChange={(e) => setDailyCode(e.target.value)}
              placeholder="Kode..." style={styles.inputCode}
            />
            <button onClick={handleSaveCode} style={styles.btnSaveCode}>Update</button>
          </div>
        </div>

        <div style={styles.grid}>
          {/* SECTION 2: FORM TAMBAH GURU */}
          <div style={styles.card}>
            <h3>+ Tambah Guru Baru</h3>
            <form onSubmit={handleAddTeacher}>
              <div style={styles.formGroup}>
                <label>Nama Lengkap</label>
                <input 
                  type="text" placeholder="Contoh: Pak Joko" 
                  value={newTeacher.nama} 
                  onChange={e => setNewTeacher({...newTeacher, nama: e.target.value})}
                  style={styles.input} 
                />
              </div>
              <div style={styles.formGroup}>
                <label>Mata Pelajaran</label>
                <input 
                  type="text" placeholder="Contoh: Fisika" 
                  value={newTeacher.mapel} 
                  onChange={e => setNewTeacher({...newTeacher, mapel: e.target.value})}
                  style={styles.input} 
                />
              </div>
              <button type="submit" style={styles.btnAdd}>Simpan Data Guru</button>
            </form>
          </div>

          {/* SECTION 3: TABEL GURU */}
          <div style={styles.card}>
            <h3>Daftar Guru Terdaftar</h3>
            <div style={styles.tableWrapper}>
              <table style={styles.table}>
                <thead>
                  <tr style={{background:'#eee'}}>
                    <th style={styles.th}>Nama</th>
                    <th style={styles.th}>Mapel</th>
                    <th style={styles.th}>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {teachers.map(t => (
                    <tr key={t.id} style={styles.tr}>
                      <td style={styles.td}><b>{t.nama}</b></td>
                      <td style={styles.td}>{t.mapel}</td>
                      <td style={styles.td}>
                        <button onClick={() => handleDelete(t.id)} style={styles.btnDelete}>Hapus</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

const styles = {
  content: { marginLeft: '250px', padding: '30px', width: '100%', background: '#f4f7f6', minHeight: '100vh', fontFamily:'sans-serif' },
  header: { marginBottom: '20px' },
  
  codeCard: { background: '#fbeee6', padding: '20px', borderRadius: '10px', border: '1px solid #e67e22', marginBottom: '20px', display:'flex', justifyContent:'space-between', alignItems:'center' },
  inputCode: { padding: '10px', fontSize: '16px', fontWeight: 'bold', border: '2px solid #d35400', borderRadius: '5px', width: '150px', textAlign: 'center' },
  btnSaveCode: { padding: '10px 20px', background: '#d35400', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' },

  grid: { display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '20px' },
  card: { background: 'white', padding: '20px', borderRadius: '10px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' },
  
  formGroup: { marginBottom: '15px' },
  input: { width: '100%', padding: '10px', border: '1px solid #ccc', borderRadius: '5px', marginTop:'5px', boxSizing:'border-box' },
  btnAdd: { width: '100%', padding: '12px', background: '#27ae60', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight:'bold' },

  tableWrapper: { maxHeight: '400px', overflowY: 'auto' },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { textAlign: 'left', padding: '10px', borderBottom: '2px solid #ddd' },
  tr: { borderBottom: '1px solid #eee' },
  td: { padding: '10px' },
  btnDelete: { padding: '5px 10px', background: '#c0392b', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize:'12px' }
};

export default TeacherList;