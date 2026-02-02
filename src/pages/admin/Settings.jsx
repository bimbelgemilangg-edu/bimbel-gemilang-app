import React, { useState, useEffect } from 'react';
import Sidebar from '../../components/Sidebar';
import { db } from '../../firebase';
import { doc, getDoc, setDoc } from "firebase/firestore";

const Settings = () => {
  const [loading, setLoading] = useState(true);
  
  // 1. DATA LAMA (HARGA & GAJI) - Dijamin Aman
  const [prices, setPrices] = useState({
    sd: { paket1: 150000, paket2: 200000, paket3: 250000 },
    smp: { paket1: 200000, paket2: 250000, paket3: 300000 },
    english: { kids: 150000, junior: 200000, professional: 300000 } 
  });
  const [salaryRules, setSalaryRules] = useState({
    honorSD: 35000, honorSMP: 40000, honorSMA: 50000,
    bonusInggris: 10000, transport: 10000, buatSoal: 50000, 
    pengawas: 30000, ujianPaket: 15000, ujianJaga: 10000, ujianSoal: 10000
  });

  // 2. DATA KEAMANAN BARU
  const [ownerPin, setOwnerPin] = useState("2003"); // PIN Hapus Data
  const [adminPassword, setAdminPassword] = useState("admin123"); // Password Login

  // State Form Ganti Password
  const [newOwnerPin, setNewOwnerPin] = useState("");
  const [newAdminPass, setNewAdminPass] = useState("");

  // LOAD DATA SAAT MASUK (Agar data lama terpanggil)
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const docRef = doc(db, "settings", "global_config");
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data();
          // Muat data lama ke state (PENTING!)
          if (data.prices) setPrices(data.prices);
          if (data.salaryRules) setSalaryRules(data.salaryRules);
          // Muat data keamanan
          if (data.ownerPin) setOwnerPin(data.ownerPin);
          if (data.adminPassword) setAdminPassword(data.adminPassword);
        } else {
          // Buat default jika kosong pertama kali
          await setDoc(docRef, { prices, salaryRules, ownerPin: "2003", adminPassword: "admin123" });
        }
      } catch (error) {
        console.error("Gagal load setting:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  // FUNGSI 1: SIMPAN HARGA & GAJI (Tanpa ganggu Password)
  const handleSaveData = async () => {
    try {
      await setDoc(doc(db, "settings", "global_config"), {
        prices, 
        salaryRules
      }, { merge: true }); // <--- MERGE: Kunci Keamanan Data
      alert("✅ Data Harga & Gaji Berhasil Disimpan!");
    } catch (error) { console.error(error); alert("Gagal menyimpan."); }
  };

  // FUNGSI 2: GANTI PASSWORD ADMIN (Tanpa hapus Harga)
  const handleUpdateAdminPass = async () => {
    if(newAdminPass.length < 5) return alert("Password minimal 5 karakter!");
    try {
        await setDoc(doc(db, "settings", "global_config"), { 
            adminPassword: newAdminPass 
        }, { merge: true }); // <--- MERGE: Hanya update password
        
        setAdminPassword(newAdminPass);
        setNewAdminPass("");
        alert("🔐 Password Login Admin Berhasil Diganti!");
    } catch (e) { alert("Gagal update."); }
  };

  // FUNGSI 3: GANTI PIN OWNER (Tanpa hapus Harga)
  const handleUpdateOwnerPin = async () => {
    if(newOwnerPin.length !== 4) return alert("PIN harus 4 angka!");
    const currentCheck = prompt("🔒 Masukkan PIN Owner SAAT INI untuk konfirmasi:");
    if(currentCheck !== ownerPin) return alert("⛔ PIN Salah!");

    try {
        await setDoc(doc(db, "settings", "global_config"), { 
            ownerPin: newOwnerPin 
        }, { merge: true }); // <--- MERGE: Hanya update PIN
        
        setOwnerPin(newOwnerPin);
        setNewOwnerPin("");
        alert("🔐 PIN Owner Berhasil Diganti!");
    } catch (e) { alert("Gagal update."); }
  };

  if (loading) return <div style={{padding:50, textAlign:'center'}}>Menghubungkan...</div>;

  return (
    <div style={{ display: 'flex' }}>
      <Sidebar />
      <div style={styles.mainContent}>
        
        {/* HEADER */}
        <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', borderBottom: '2px solid #ddd', paddingBottom: 10, marginBottom:20}}>
           <h2 style={{margin:0}}>⚙️ Pengaturan Pusat</h2>
           <button onClick={handleSaveData} style={styles.btnSaveBig}>💾 SIMPAN HARGA & GAJI</button>
        </div>

        <div style={styles.grid}>
          
          {/* === BAGIAN 1: KEAMANAN (PANEL ATAS) === */}
          <div style={{gridColumn:'1/-1', display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(300px, 1fr))', gap:20, marginBottom:20}}>
            
            {/* GANTI PASSWORD LOGIN */}
            <div style={{background:'white', padding:20, borderRadius:10, borderLeft:'5px solid #3498db', boxShadow:'0 2px 5px rgba(0,0,0,0.05)'}}>
                <h3 style={{marginTop:0, color:'#2c3e50'}}>🔑 Password Login Admin</h3>
                <p style={{fontSize:12, color:'#666'}}>Digunakan untuk masuk ke Dashboard.</p>
                <div style={{display:'flex', gap:10}}>
                    <input 
                        type="text" 
                        placeholder="Password Baru..." 
                        value={newAdminPass} 
                        onChange={e=>setNewAdminPass(e.target.value)} 
                        style={styles.input} 
                    />
                    <button onClick={handleUpdateAdminPass} style={styles.btnBlue}>Ganti</button>
                </div>
                <small style={{display:'block', marginTop:5}}>Password Aktif: <b>{adminPassword}</b></small>
            </div>

            {/* GANTI PIN OWNER */}
            <div style={{background:'#fff5f5', padding:20, borderRadius:10, borderLeft:'5px solid #c0392b', boxShadow:'0 2px 5px rgba(0,0,0,0.05)'}}>
                <h3 style={{marginTop:0, color:'#c0392b'}}>🛡️ PIN Owner (Hapus Data)</h3>
                <p style={{fontSize:12, color:'#666'}}>Digunakan untuk menghapus data sensitif.</p>
                <div style={{display:'flex', gap:10}}>
                    <input 
                        type="number" 
                        placeholder="PIN Baru (4 Digit)" 
                        value={newOwnerPin} 
                        onChange={e=>setNewOwnerPin(e.target.value)} 
                        style={styles.input} 
                    />
                    <button onClick={handleUpdateOwnerPin} style={styles.btnRed}>Ganti</button>
                </div>
                <small style={{display:'block', marginTop:5}}>PIN Aktif: <b>{ownerPin}</b></small>
            </div>
          </div>

          {/* === BAGIAN 2: HARGA BIMBEL (PANEL BAWAH) === */}
          <div style={styles.card}>
            <h3 style={styles.headerBlue}>📚 Harga Bimbel Siswa</h3>
            
            {/* SD */}
            <div style={styles.subSection}>
                <b style={{color:'#333'}}>SD (Reguler)</b>
                <div style={{marginBottom:5}}><small>Paket 1</small><input type="number" value={prices.sd.paket1} onChange={(e) => setPrices({...prices, sd: {...prices.sd, paket1: e.target.value}})} style={styles.input} /></div>
                <div style={{marginBottom:5}}><small>Paket 2</small><input type="number" value={prices.sd.paket2} onChange={(e) => setPrices({...prices, sd: {...prices.sd, paket2: e.target.value}})} style={styles.input} /></div>
                <div><small>Paket 3</small><input type="number" value={prices.sd.paket3} onChange={(e) => setPrices({...prices, sd: {...prices.sd, paket3: e.target.value}})} style={styles.input} /></div>
            </div>

            {/* SMP */}
            <div style={styles.subSection}>
                <b style={{color:'#333'}}>SMP (Reguler)</b>
                <div style={{marginBottom:5}}><small>Paket 1</small><input type="number" value={prices.smp.paket1} onChange={(e) => setPrices({...prices, smp: {...prices.smp, paket1: e.target.value}})} style={styles.input} /></div>
                <div style={{marginBottom:5}}><small>Paket 2</small><input type="number" value={prices.smp.paket2} onChange={(e) => setPrices({...prices, smp: {...prices.smp, paket2: e.target.value}})} style={styles.input} /></div>
                <div><small>Paket 3</small><input type="number" value={prices.smp.paket3} onChange={(e) => setPrices({...prices, smp: {...prices.smp, paket3: e.target.value}})} style={styles.input} /></div>
            </div>

            {/* ENGLISH */}
            <div style={{marginTop:15}}>
                <b style={{color:'#8e44ad'}}>🇬🇧 English Course</b>
                <div style={{marginTop:5}}><small>Kids</small><input type="number" value={prices.english?.kids || 0} onChange={(e) => setPrices({...prices, english: {...prices.english, kids: e.target.value}})} style={styles.input} /></div>
                <div style={{marginTop:5}}><small>Junior</small><input type="number" value={prices.english?.junior || 0} onChange={(e) => setPrices({...prices, english: {...prices.english, junior: e.target.value}})} style={styles.input} /></div>
                <div style={{marginTop:5}}><small>Professional</small><input type="number" value={prices.english?.professional || 0} onChange={(e) => setPrices({...prices, english: {...prices.english, professional: e.target.value}})} style={styles.input} /></div>
            </div>
          </div>

          {/* === BAGIAN 3: GAJI GURU === */}
          <div style={styles.card}>
            <h3 style={styles.headerGreen}>💰 Standar Gaji Guru</h3>
            <div style={styles.formGroup}><label>Honor SD / Jam</label><input type="number" value={salaryRules.honorSD} onChange={(e) => setSalaryRules({...salaryRules, honorSD: e.target.value})} style={styles.input} /></div>
            <div style={styles.formGroup}><label>Honor SMP / Jam</label><input type="number" value={salaryRules.honorSMP} onChange={(e) => setSalaryRules({...salaryRules, honorSMP: e.target.value})} style={styles.input} /></div>
            <div style={styles.formGroup}><label>Bonus Inggris</label><input type="number" value={salaryRules.bonusInggris} onChange={(e) => setSalaryRules({...salaryRules, bonusInggris: e.target.value})} style={styles.input} /></div>
            
            <h4 style={{marginTop:20, marginBottom:10, color:'#555', borderTop:'1px dashed #ccc', paddingTop:10}}>Tarif Lainnya (Flat)</h4>
            <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:10}}>
                <div><small>Transport</small><input type="number" value={salaryRules.transport} onChange={(e) => setSalaryRules({...salaryRules, transport: e.target.value})} style={styles.input} /></div>
                <div><small>Buat Soal</small><input type="number" value={salaryRules.ujianSoal} onChange={(e) => setSalaryRules({...salaryRules, ujianSoal: e.target.value})} style={styles.input} /></div>
                <div><small>Jaga Ujian</small><input type="number" value={salaryRules.ujianJaga} onChange={(e) => setSalaryRules({...salaryRules, ujianJaga: e.target.value})} style={styles.input} /></div>
                <div><small>Paket Ujian</small><input type="number" value={salaryRules.ujianPaket} onChange={(e) => setSalaryRules({...salaryRules, ujianPaket: e.target.value})} style={styles.input} /></div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

const styles = {
  mainContent: { marginLeft: '250px', padding: '30px', width: '100%', background: '#f4f7f6', minHeight: '100vh', fontFamily: 'Segoe UI, sans-serif' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' },
  card: { background: 'white', padding: '20px', borderRadius: '10px', boxShadow: '0 2px 5px rgba(0,0,0,0.05)', color: '#333' },
  headerBlue: { color: '#2980b9', borderBottom: '1px solid #eee', paddingBottom: '10px', marginTop: 0 },
  headerGreen: { color: '#27ae60', borderBottom: '1px solid #eee', paddingBottom: '10px', marginTop: 0 },
  subSection: { marginBottom: 15, paddingBottom: 10, borderBottom: '1px dashed #eee' },
  formGroup: { marginBottom: '10px' },
  input: { width: '100%', padding: '10px', borderRadius: '5px', border: '1px solid #ccc', boxSizing: 'border-box', marginTop: '2px', background: '#fff', color: '#000' },
  btnSaveBig: { padding: '10px 20px', background: '#2c3e50', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' },
  btnBlue: { padding: '10px 20px', background: '#3498db', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' },
  btnRed: { padding: '10px 20px', background: '#c0392b', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' }
};

export default Settings;