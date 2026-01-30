import React, { useState, useEffect } from 'react';
import Sidebar from '../../../components/Sidebar';
import { db } from '../../../firebase';
import { collection, getDocs, addDoc, deleteDoc, doc, getDoc } from "firebase/firestore";

const TeacherList = () => {
  const [teachers, setTeachers] = useState([]);
  const [showModal, setShowModal] = useState(false);
  
  // STATE INPUT KEGIATAN
  const [selectedTeacher, setSelectedTeacher] = useState(null);
  const [activityType, setActivityType] = useState("Mengajar"); 
  const [tanggal, setTanggal] = useState(new Date().toISOString().split('T')[0]);
  
  // State Khusus Mengajar
  const [jenjang, setJenjang] = useState("SD");
  const [mapel, setMapel] = useState(""); 
  const [durasi, setDurasi] = useState(1); 
  const [isEnglish, setIsEnglish] = useState(false);
  
  // State Khusus Tugas Lain
  const [qty, setQty] = useState(1); 

  // HASIL HITUNGAN
  const [totalHonor, setTotalHonor] = useState(0);

  // DATA SALARY RULES DARI FIREBASE
  const [salaryRules, setSalaryRules] = useState(null);

  // --- 1. LOAD DATA (GURU & RULES) ---
  useEffect(() => {
    const initData = async () => {
        try {
            // A. Ambil List Guru
            const querySnapshot = await getDocs(collection(db, "teachers"));
            setTeachers(querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));

            // B. Ambil Aturan Gaji dari Firebase Settings (BUKAN LOCALSTORAGE)
            const settingsSnap = await getDoc(doc(db, "settings", "global_config"));
            if(settingsSnap.exists()) {
                setSalaryRules(settingsSnap.data().salaryRules);
            } else {
                alert("⚠️ Peringatan: Aturan Gaji belum disetting oleh Owner!");
            }
        } catch (error) {
            console.error("Error init:", error);
        }
    };
    initData();
  }, []);

  // --- 2. SMART LOGIC CALCULATOR ---
  useEffect(() => {
    if (!salaryRules) return; // Tunggu data rules loaded

    let hitungan = 0;

    if (activityType === "Mengajar") {
        let tarifPerJam = 0;
        if (jenjang === "SD") tarifPerJam = parseInt(salaryRules.honorSD);
        if (jenjang === "SMP") tarifPerJam = parseInt(salaryRules.honorSMP);
        if (jenjang === "SMA") tarifPerJam = parseInt(salaryRules.honorSMA);

        if (isEnglish) tarifPerJam += parseInt(salaryRules.bonusInggris);

        hitungan = (tarifPerJam * durasi) + parseInt(salaryRules.transport);

    } else if (activityType === "Buat Soal") {
        hitungan = parseInt(salaryRules.buatSoal) * qty;

    } else if (activityType === "Pengawas") {
        hitungan = parseInt(salaryRules.pengawas) * qty;
    }

    setTotalHonor(hitungan);
  }, [activityType, jenjang, durasi, isEnglish, qty, salaryRules]); 

  // --- 3. SIMPAN KE DATABASE ---
  const handleSaveLog = async (e) => {
    e.preventDefault();
    if (!selectedTeacher) return;

    try {
      await addDoc(collection(db, "teacher_logs"), {
        teacherId: selectedTeacher.id,
        namaGuru: selectedTeacher.nama,
        tanggal: tanggal,
        kegiatan: activityType,
        detail: activityType === "Mengajar" ? `${jenjang} - ${mapel} (${durasi} Jam)` : `Jumlah: ${qty}`,
        nominal: parseInt(totalHonor),
        status: "Unpaid"
      });

      alert(`✅ Berhasil input kegiatan untuk ${selectedTeacher.nama}\nNominal: Rp ${totalHonor.toLocaleString()}`);
      setShowModal(false);
    } catch (error) {
      console.error(error);
      alert("Gagal menyimpan.");
    }
  };

  const handleDelete = async (id) => {
    if(confirm("Hapus data guru ini?")) {
        await deleteDoc(doc(db, "teachers", id));
        // Refresh manual atau reload page
        window.location.reload(); 
    }
  };

  return (
    <div style={{ display: 'flex' }}>
      <Sidebar />
      <div style={styles.content}>
        <div style={styles.header}>
            <h2 style={{margin:0, color:'#333'}}>👨‍🏫 Manajemen Guru (Online)</h2>
        </div>

        {/* LIST GURU */}
        <div style={styles.grid}>
            {teachers.map(guru => (
                <div key={guru.id} style={styles.card}>
                    <div style={{display:'flex', alignItems:'center', gap:15, marginBottom:15}}>
                        <div style={styles.avatar}>{guru.nama ? guru.nama.charAt(0) : 'G'}</div>
                        <div>
                            <h3 style={{margin:0, color:'#333'}}>{guru.nama}</h3>
                            <small style={{color:'#666'}}>{guru.mapel || 'Guru Mapel'}</small>
                        </div>
                    </div>
                    
                    <div style={{display:'grid', gap:10}}>
                        <button 
                            onClick={() => { setSelectedTeacher(guru); setShowModal(true); }} 
                            style={styles.btnInput}
                        >
                            📝 Input Absen
                        </button>
                        <button onClick={() => handleDelete(guru.id)} style={styles.btnDel}>Hapus Guru</button>
                    </div>
                </div>
            ))}
        </div>

        {/* MODAL INPUT */}
        {showModal && selectedTeacher && (
            <div style={styles.modalOverlay}>
                <div style={styles.modalContent}>
                    <h3 style={{marginTop:0, color:'#333'}}>Input Aktivitas: {selectedTeacher.nama}</h3>
                    
                    {!salaryRules ? (
                        <p style={{color:'red'}}>Sedang memuat aturan gaji dari server...</p>
                    ) : (
                    <form onSubmit={handleSaveLog}>
                        <div style={styles.formGroup}>
                            <label>Tanggal</label>
                            <input type="date" value={tanggal} onChange={e=>setTanggal(e.target.value)} style={styles.input} />
                        </div>

                        <div style={styles.formGroup}>
                            <label>Jenis Kegiatan</label>
                            <select value={activityType} onChange={e=>setActivityType(e.target.value)} style={styles.input}>
                                <option value="Mengajar">Mengajar Kelas</option>
                                <option value="Buat Soal">Membuat Soal</option>
                                <option value="Pengawas">Pengawas Ujian</option>
                            </select>
                        </div>

                        {/* FORM KHUSUS MENGAJAR */}
                        {activityType === "Mengajar" && (
                            <div style={styles.boxBlue}>
                                <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:10}}>
                                    <div>
                                        <label style={{color:'white'}}>Jenjang</label>
                                        <select value={jenjang} onChange={e=>setJenjang(e.target.value)} style={styles.input}>
                                            <option value="SD">SD</option>
                                            <option value="SMP">SMP</option>
                                            <option value="SMA">SMA</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label style={{color:'white'}}>Durasi (Jam)</label>
                                        <input type="number" value={durasi} onChange={e=>setDurasi(e.target.value)} style={styles.input} />
                                    </div>
                                </div>
                                <div style={{marginTop:10}}>
                                    <label style={{color:'white', display:'flex', alignItems:'center', gap:5}}>
                                        <input type="checkbox" checked={isEnglish} onChange={e=>setIsEnglish(e.target.checked)} />
                                        Kelas Bahasa Inggris (Bonus +{parseInt(salaryRules.bonusInggris).toLocaleString()})
                                    </label>
                                </div>
                                <input 
                                    type="text" 
                                    placeholder="Nama Mapel / Materi" 
                                    value={mapel} 
                                    onChange={e=>setMapel(e.target.value)} 
                                    style={{...styles.input, marginTop:10}} 
                                />
                            </div>
                        )}

                        {/* FORM KHUSUS TUGAS LAIN */}
                        {(activityType === "Buat Soal" || activityType === "Pengawas") && (
                            <div style={styles.boxGreen}>
                                <label style={{color:'white'}}>Jumlah (Paket / Sesi)</label>
                                <input type="number" value={qty} onChange={e=>setQty(e.target.value)} style={styles.input} />
                            </div>
                        )}

                        <div style={{marginTop:20, padding:15, background:'#f9f9f9', borderRadius:5, border:'1px solid #ddd'}}>
                            <label style={{display:'block', marginBottom:5, color:'#333', fontWeight:'bold'}}>Total Honor (Rp)</label>
                            <input 
                                type="number" 
                                value={totalHonor} 
                                onChange={e=>setTotalHonor(e.target.value)} 
                                style={{...styles.input, fontSize:18, fontWeight:'bold', color:'green'}} 
                            />
                            <small style={{color:'#666'}}>*Dihitung otomatis dari Server Settings.</small>
                        </div>

                        <div style={{display:'flex', gap:10, marginTop:20}}>
                            <button type="button" onClick={()=>setShowModal(false)} style={styles.btnCancel}>Batal</button>
                            <button type="submit" style={styles.btnSave}>SIMPAN DATA</button>
                        </div>
                    </form>
                    )}
                </div>
            </div>
        )}

      </div>
    </div>
  );
};

const styles = {
  content: { marginLeft: '250px', padding: '30px', width: '100%', background: '#f4f7f6', minHeight: '100vh', fontFamily:'Segoe UI, sans-serif' },
  header: { marginBottom: 20, borderBottom:'1px solid #ddd', paddingBottom:10 },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' },
  
  card: { background: 'white', padding: '20px', borderRadius: '10px', boxShadow: '0 2px 5px rgba(0,0,0,0.05)' },
  avatar: { width:50, height:50, borderRadius:'50%', background:'#3498db', color:'white', display:'flex', alignItems:'center', justifyContent:'center', fontSize:20, fontWeight:'bold' },
  
  btnInput: { width:'100%', padding:'10px', background:'#2ecc71', color:'white', border:'none', borderRadius:5, cursor:'pointer', fontWeight:'bold', marginBottom:5 },
  btnDel: { width:'100%', padding:'8px', background:'white', color:'#e74c3c', border:'1px solid #e74c3c', borderRadius:5, cursor:'pointer', fontSize:12 },

  modalOverlay: { position:'fixed', top:0, left:0, width:'100%', height:'100%', background:'rgba(0,0,0,0.5)', display:'flex', justifyContent:'center', alignItems:'center', zIndex:1000 },
  modalContent: { background:'white', padding:25, borderRadius:10, width:'400px', maxHeight:'90vh', overflowY:'auto' },
  
  formGroup: { marginBottom: 15 },
  input: { width:'100%', padding:'10px', borderRadius:5, border:'1px solid #ccc', boxSizing:'border-box', background:'#fff', color:'#000' },
  
  boxBlue: { background:'#3498db', padding:15, borderRadius:5, marginBottom:10 },
  boxGreen: { background:'#27ae60', padding:15, borderRadius:5, marginBottom:10 },
  
  btnSave: { flex:1, padding:'12px', background:'#2c3e50', color:'white', border:'none', borderRadius:5, cursor:'pointer', fontWeight:'bold' },
  btnCancel: { flex:1, padding:'12px', background:'#ccc', color:'#333', border:'none', borderRadius:5, cursor:'pointer', fontWeight:'bold' }
};

export default TeacherList;