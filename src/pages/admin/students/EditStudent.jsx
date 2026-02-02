import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Sidebar from '../../../components/Sidebar';
import { db } from '../../../firebase';
import { doc, getDoc, updateDoc } from "firebase/firestore";

const EditStudent = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [loading, setLoading] = useState(true);

  // 1. STATE UNTUK HARGA (Biar dropdown paket muncul harganya)
  const [pricing, setPricing] = useState({});

  // 2. STATE FORM LENGKAP
  const [formData, setFormData] = useState({
    // Identitas
    nama: "",
    kelasSekolah: "",
    tempatLahir: "",
    tanggalLahir: "",
    
    // Ortu
    ortu: { ayah: "", pekerjaanAyah: "", ibu: "", pekerjaanIbu: "", alamat: "", hp: "" },
    
    // Pendaftaran & Program
    kategori: "Reguler", // Reguler / English
    jenjang: "SD",       // SD / SMP
    paket: "paket1",     // paket1 / kids / dll (Logic internal)
    totalTagihan: 0      // Bisa diedit manual kalau perlu
  });

  // FETCH HARGA & DATA SISWA
  useEffect(() => {
    const fetchData = async () => {
      try {
        // A. Ambil Harga Settings
        const settingsRef = doc(db, "settings", "global_config");
        const settingsSnap = await getDoc(settingsRef);
        if (settingsSnap.exists()) setPricing(settingsSnap.data().prices || {});

        // B. Ambil Data Siswa
        const docRef = doc(db, "students", id);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          const data = docSnap.data();
          
          // Pecah string "SD - paket1" menjadi jenjang & paket untuk dropdown
          let parsedJenjang = "SD";
          let parsedPaket = "paket1";
          
          if(data.detailProgram) {
             const parts = data.detailProgram.split(" - ");
             if(parts.length > 1) {
                 parsedJenjang = parts[0]; // SD / SMP / English
                 parsedPaket = parts[1];   // paket1 / kids
             }
          }

          setFormData({
            nama: data.nama || "",
            kelasSekolah: data.kelasSekolah || "1 SD",
            tempatLahir: data.tempatLahir || "",
            tanggalLahir: data.tanggalLahir || "",
            ortu: data.ortu || { ayah: "", hp: "", alamat: "" },
            
            kategori: data.kategori || "Reguler",
            jenjang: data.kategori === 'English' ? 'English' : parsedJenjang,
            paket: parsedPaket,
            totalTagihan: data.totalTagihan || 0
          });
        } else {
          alert("Siswa tidak ditemukan!");
          navigate('/admin/students');
        }
      } catch (e) {
        console.error("Error:", e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id, navigate]);

  // LOGIKA UPDATE NOMINAL OTOMATIS (OPSIONAL)
  const updatePriceEstimate = (kategori, jenjang, paket) => {
      // Fungsi ini hanya untuk membantu admin melihat harga, 
      // tidak langsung menimpa totalTagihan kecuali admin mau.
      let price = 0;
      if (kategori === 'English') {
          price = pricing.english ? pricing.english[paket] : 0;
      } else {
          const lvl = jenjang.toLowerCase();
          price = pricing[lvl] ? pricing[lvl][paket] : 0;
      }
      return parseInt(price || 0);
  };

  // SIMPAN PERUBAHAN
  const handleSave = async () => {
    try {
      // Susun ulang detailProgram
      let detailProgramBaru = "";
      if (formData.kategori === "English") {
          detailProgramBaru = `English - ${formData.paket}`;
      } else {
          detailProgramBaru = `${formData.jenjang} - ${formData.paket}`;
      }

      const docRef = doc(db, "students", id);
      await updateDoc(docRef, {
        // Update Identitas
        nama: formData.nama,
        kelasSekolah: formData.kelasSekolah,
        tempatLahir: formData.tempatLahir,
        tanggalLahir: formData.tanggalLahir,
        ortu: formData.ortu,
        
        // Update Program
        kategori: formData.kategori,
        detailProgram: detailProgramBaru,
        totalTagihan: parseInt(formData.totalTagihan) // Update tagihan jika ada revisi
      });

      alert("✅ Data Siswa & Pendaftaran Berhasil Diupdate!");
      navigate('/admin/students');
    } catch (e) {
      console.error(e);
      alert("Gagal update data.");
    }
  };

  if(loading) return <div style={{padding:50}}>Loading Data...</div>;

  return (
    <div style={{ display: 'flex' }}>
      <Sidebar />
      <div style={styles.content}>
        <h2 style={{color:'#2c3e50'}}>✏️ Edit Data Siswa & Pendaftaran</h2>
        
        <div style={styles.gridContainer}>
            
            {/* KOLOM KIRI: BIODATA */}
            <div style={styles.card}>
              <h3 style={{marginTop:0, borderBottom:'1px solid #eee', paddingBottom:10}}>👤 Biodata Siswa</h3>
              
              <div style={styles.formGroup}>
                <label>Nama Lengkap</label>
                <input style={styles.input} value={formData.nama} onChange={(e) => setFormData({...formData, nama: e.target.value})} />
              </div>

              <div style={styles.formGroup}>
                <label>Kelas Sekolah</label>
                <select style={styles.select} value={formData.kelasSekolah} onChange={(e) => setFormData({...formData, kelasSekolah: e.target.value})}>
                  <option>1 SD</option><option>2 SD</option><option>3 SD</option>
                  <option>4 SD</option><option>5 SD</option><option>6 SD</option>
                  <option>7 SMP</option><option>8 SMP</option><option>9 SMP</option>
                  <option>Lainnya</option>
                </select>
              </div>

              <div style={{display:'flex', gap:10}}>
                  <div style={{flex:1}}>
                    <label>Tempat Lahir</label>
                    <input style={styles.input} value={formData.tempatLahir} onChange={(e) => setFormData({...formData, tempatLahir: e.target.value})} />
                  </div>
                  <div style={{flex:1}}>
                    <label>Tgl Lahir</label>
                    <input type="date" style={styles.input} value={formData.tanggalLahir} onChange={(e) => setFormData({...formData, tanggalLahir: e.target.value})} />
                  </div>
              </div>

              <h4 style={{marginTop:20, marginBottom:10, color:'#555'}}>Data Orang Tua</h4>
              <div style={styles.formGroup}>
                <label>Nama Ayah</label>
                <input style={styles.input} value={formData.ortu.ayah} onChange={(e) => setFormData({...formData, ortu: {...formData.ortu, ayah: e.target.value}})} />
              </div>
              <div style={styles.formGroup}>
                <label>No HP / WA</label>
                <input style={styles.input} value={formData.ortu.hp} onChange={(e) => setFormData({...formData, ortu: {...formData.ortu, hp: e.target.value}})} />
              </div>
              <div style={styles.formGroup}>
                <label>Alamat</label>
                <textarea style={styles.textarea} value={formData.ortu.alamat} onChange={(e) => setFormData({...formData, ortu: {...formData.ortu, alamat: e.target.value}})} />
              </div>
            </div>

            {/* KOLOM KANAN: PENDAFTARAN & PROGRAM */}
            <div style={styles.cardBlue}>
              <h3 style={{marginTop:0, color:'white', borderBottom:'1px solid rgba(255,255,255,0.2)', paddingBottom:10}}>📚 Edit Program & Paket</h3>
              
              <div style={styles.formGroup}>
                <label style={{color:'white'}}>Kategori Program</label>
                <select style={styles.select} value={formData.kategori} onChange={(e) => setFormData({...formData, kategori: e.target.value})}>
                    <option value="Reguler">Bimbel Reguler</option>
                    <option value="English">English Course</option>
                </select>
              </div>

              {/* LOGIKA SELECTOR PAKET (SAMA DENGAN ADD STUDENT) */}
              {formData.kategori === 'Reguler' ? (
                  <>
                    <div style={styles.formGroup}>
                        <label style={{color:'white'}}>Jenjang</label>
                        <select style={styles.select} value={formData.jenjang} onChange={(e) => setFormData({...formData, jenjang: e.target.value})}>
                            <option value="SD">SD</option>
                            <option value="SMP">SMP</option>
                        </select>
                    </div>
                    <div style={styles.formGroup}>
                        <label style={{color:'white'}}>Pilih Paket</label>
                        <select style={styles.select} value={formData.paket} onChange={(e) => {
                            const newPrice = updatePriceEstimate('Reguler', formData.jenjang, e.target.value);
                            setFormData({...formData, paket: e.target.value, totalTagihan: newPrice});
                        }}>
                            <option value="paket1">Paket 1</option>
                            <option value="paket2">Paket 2</option>
                            <option value="paket3">Paket 3</option>
                        </select>
                    </div>
                  </>
              ) : (
                  <div style={styles.formGroup}>
                        <label style={{color:'white'}}>Level English</label>
                        <select style={styles.select} value={formData.paket} onChange={(e) => {
                            const newPrice = updatePriceEstimate('English', '', e.target.value);
                            setFormData({...formData, paket: e.target.value, totalTagihan: newPrice});
                        }}>
                            <option value="kids">Kids</option>
                            <option value="junior">Junior</option>
                            <option value="professional">Professional</option>
                        </select>
                  </div>
              )}

              <div style={{background:'rgba(0,0,0,0.2)', padding:15, borderRadius:8, marginTop:20}}>
                  <label style={{color:'white', display:'block', marginBottom:5}}>Total Tagihan (Rp)</label>
                  <input 
                    type="number" 
                    style={{...styles.input, fontWeight:'bold', fontSize:18}} 
                    value={formData.totalTagihan} 
                    onChange={(e) => setFormData({...formData, totalTagihan: e.target.value})} 
                  />
                  <small style={{color:'#ddd', fontSize:11}}>*Mengubah angka ini akan mengubah hutang siswa.</small>
              </div>

              <div style={{display:'flex', gap:'10px', marginTop:'30px'}}>
                <button style={styles.btnSave} onClick={handleSave}>SIMPAN UPDATE</button>
                <button style={styles.btnCancel} onClick={() => navigate('/admin/students')}>BATAL</button>
              </div>
            </div>

        </div>
      </div>
    </div>
  );
};

const styles = {
  content: { marginLeft: '250px', padding: '30px', width: '100%', background: '#f4f6f8', minHeight: '100vh', fontFamily: 'Segoe UI, sans-serif' },
  gridContainer: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' },
  card: { background: 'white', padding: '25px', borderRadius: '10px', boxShadow: '0 2px 5px rgba(0,0,0,0.05)' },
  cardBlue: { background: '#2c3e50', padding: '25px', borderRadius: '10px', color: 'white', boxShadow: '0 4px 10px rgba(0,0,0,0.1)' },
  formGroup: { marginBottom: '15px' },
  input: { width: '100%', padding: '10px', marginTop: '5px', borderRadius: '5px', border: '1px solid #ccc', boxSizing: 'border-box' },
  select: { width: '100%', padding: '10px', marginTop: '5px', borderRadius: '5px', border: '1px solid #ccc', background: 'white' },
  textarea: { width: '100%', padding: '10px', marginTop: '5px', borderRadius: '5px', border: '1px solid #ccc', minHeight: '80px', boxSizing: 'border-box' },
  btnSave: { flex:1, padding: '12px', background: '#27ae60', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight:'bold', fontSize:'14px' },
  btnCancel: { flex:1, padding: '12px', background: '#c0392b', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight:'bold', fontSize:'14px' }
};

export default EditStudent;