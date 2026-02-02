import React, { useState, useEffect } from 'react';
import Sidebar from '../../components/Sidebar';
import { db } from '../../firebase';
import { doc, getDoc, setDoc } from "firebase/firestore";

const Settings = () => {
  const [loading, setLoading] = useState(true);
  
  // FITUR KEAMANAN (LOCK SCREEN)
  const [isLocked, setIsLocked] = useState(true);
  const [inputPin, setInputPin] = useState("");

  // DATA SETTING
  const [ownerPin, setOwnerPin] = useState("2003");
  const [adminPassword, setAdminPassword] = useState("admin123");
  
  const [prices, setPrices] = useState({
    sd: { paket1: 150000, paket2: 200000, paket3: 250000 },
    smp: { paket1: 200000, paket2: 250000, paket3: 300000 },
    english: { kids: 150000, junior: 200000, professional: 300000 } 
  });

  const [salaryRules, setSalaryRules] = useState({
    honorSD: 35000, 
    honorKelas6: 40000, // <--- DATA BARU
    honorSMP: 40000, 
    honorSMA: 50000,
    bonusInggris: 10000, transport: 10000, buatSoal: 50000, 
    pengawas: 30000, ujianPaket: 15000, ujianJaga: 10000, ujianSoal: 10000
  });

  // GANTI PASSWORD
  const [newOwnerPin, setNewOwnerPin] = useState("");
  const [newAdminPass, setNewAdminPass] = useState("");

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const docRef = doc(db, "settings", "global_config");
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data.prices) setPrices(data.prices);
          // Gabungkan data lama dengan default agar honorKelas6 tidak error
          if (data.salaryRules) setSalaryRules(prev => ({...prev, ...data.salaryRules})); 
          if (data.ownerPin) setOwnerPin(data.ownerPin);
          if (data.adminPassword) setAdminPassword(data.adminPassword);
        } else {
          await setDoc(docRef, { prices, salaryRules, ownerPin: "2003", adminPassword: "admin123" });
        }
      } catch (error) { console.error(error); } 
      finally { setLoading(false); }
    };
    fetchSettings();
  }, []);

  // --- LOGIKA BUKA KUNCI ---
  const handleUnlock = (e) => {
    e.preventDefault();
    if(inputPin === ownerPin) {
        setIsLocked(false);
    } else {
        alert("⛔ PIN OWNER SALAH!");
        setInputPin("");
    }
  };

  const handleSaveData = async () => {
    try {
      await setDoc(doc(db, "settings", "global_config"), { prices, salaryRules }, { merge: true });
      alert("✅ Pengaturan Berhasil Disimpan!");
    } catch (error) { alert("Gagal menyimpan."); }
  };

  const handleUpdateAdminPass = async () => {
    if(newAdminPass.length < 5) return alert("Min 5 karakter!");
    try {
        await setDoc(doc(db, "settings", "global_config"), { adminPassword: newAdminPass }, { merge: true });
        setAdminPassword(newAdminPass); setNewAdminPass("");
        alert("🔐 Password Admin Diganti!");
    } catch (e) { alert("Gagal."); }
  };

  const handleUpdateOwnerPin = async () => {
    if(newOwnerPin.length !== 4) return alert("Harus 4 angka!");
    if(window.confirm("Yakin ganti PIN Owner? Jangan sampai lupa!")) {
        try {
            await setDoc(doc(db, "settings", "global_config"), { ownerPin: newOwnerPin }, { merge: true });
            setOwnerPin(newOwnerPin); setNewOwnerPin("");
            alert("🔐 PIN Owner Diganti!");
        } catch (e) { alert("Gagal."); }
    }
  };

  if (loading) return <div style={{padding:50}}>Loading...</div>;

  // --- TAMPILAN TERKUNCI ---
  if (isLocked) {
      return (
          <div style={{height:'100vh', background:'#2c3e50', display:'flex', justifyContent:'center', alignItems:'center', flexDirection:'column'}}>
              <div style={{background:'white', padding:40, borderRadius:10, textAlign:'center', width:300}}>
                  <h2 style={{marginTop:0, color:'#c0392b'}}>🔒 AREA TERBATAS</h2>
                  <p>Halaman ini khusus Owner.</p>
                  <form onSubmit={handleUnlock}>
                      <input 
                        type="password" 
                        placeholder="Masukkan PIN Owner" 
                        value={inputPin} 
                        onChange={e=>setInputPin(e.target.value)} 
                        style={{width:'100%', padding:15, fontSize:20, textAlign:'center', marginBottom:15, borderRadius:5, border:'1px solid #ccc', boxSizing:'border-box'}} 
                        autoFocus
                      />
                      <button type="submit" style={{width:'100%', padding:15, background:'#c0392b', color:'white', border:'none', borderRadius:5, fontWeight:'bold', cursor:'pointer'}}>BUKA PENGATURAN</button>
                  </form>
                  <button onClick={()=>window.history.back()} style={{marginTop:15, background:'none', border:'none', color:'#7f8c8d', textDecoration:'underline', cursor:'pointer'}}>Kembali</button>
              </div>
          </div>
      );
  }

  // --- TAMPILAN UTAMA ---
  return (
    <div style={{ display: 'flex' }}>
      <Sidebar />
      <div style={styles.mainContent}>
        <div style={{display:'flex', justifyContent:'space-between', marginBottom:20}}>
           <h2 style={{margin:0}}>⚙️ Pengaturan Pusat</h2>
           <button onClick={handleSaveData} style={styles.btnSaveBig}>💾 SIMPAN PERUBAHAN</button>
        </div>

        <div style={styles.grid}>
          {/* SECURITY */}
          <div style={{gridColumn:'1/-1', display:'grid', gridTemplateColumns:'1fr 1fr', gap:20, marginBottom:20}}>
            <div style={{background:'white', padding:20, borderRadius:10, borderLeft:'5px solid #3498db'}}>
                <h3 style={{marginTop:0}}>🔑 Password Admin</h3>
                <div style={{display:'flex', gap:10}}>
                    <input type="text" placeholder="Pass Baru..." value={newAdminPass} onChange={e=>setNewAdminPass(e.target.value)} style={styles.input} />
                    <button onClick={handleUpdateAdminPass} style={styles.btnBlue}>Ganti</button>
                </div>
            </div>
            <div style={{background:'#fff5f5', padding:20, borderRadius:10, borderLeft:'5px solid #c0392b'}}>
                <h3 style={{marginTop:0, color:'#c0392b'}}>🛡️ PIN Owner</h3>
                <div style={{display:'flex', gap:10}}>
                    <input type="number" placeholder="PIN Baru (4 digit)" value={newOwnerPin} onChange={e=>setNewOwnerPin(e.target.value)} style={styles.input} />
                    <button onClick={handleUpdateOwnerPin} style={styles.btnRed}>Ganti</button>
                </div>
            </div>
          </div>

          {/* HARGA BIMBEL */}
          <div style={styles.card}>
            <h3 style={styles.headerBlue}>📚 Harga SPP Siswa</h3>
            {/* SD */}
            <div style={styles.subSection}><b style={{color:'#333'}}>SD</b>
                <div style={styles.row}><small>Paket 1</small><input type="number" value={prices.sd.paket1} onChange={(e) => setPrices({...prices, sd: {...prices.sd, paket1: e.target.value}})} style={styles.input} /></div>
                <div style={styles.row}><small>Paket 2</small><input type="number" value={prices.sd.paket2} onChange={(e) => setPrices({...prices, sd: {...prices.sd, paket2: e.target.value}})} style={styles.input} /></div>
                <div style={styles.row}><small>Paket 3</small><input type="number" value={prices.sd.paket3} onChange={(e) => setPrices({...prices, sd: {...prices.sd, paket3: e.target.value}})} style={styles.input} /></div>
            </div>
            {/* SMP */}
            <div style={styles.subSection}><b style={{color:'#333'}}>SMP</b>
                <div style={styles.row}><small>Paket 1</small><input type="number" value={prices.smp.paket1} onChange={(e) => setPrices({...prices, smp: {...prices.smp, paket1: e.target.value}})} style={styles.input} /></div>
                <div style={styles.row}><small>Paket 2</small><input type="number" value={prices.smp.paket2} onChange={(e) => setPrices({...prices, smp: {...prices.smp, paket2: e.target.value}})} style={styles.input} /></div>
                <div style={styles.row}><small>Paket 3</small><input type="number" value={prices.smp.paket3} onChange={(e) => setPrices({...prices, smp: {...prices.smp, paket3: e.target.value}})} style={styles.input} /></div>
            </div>
            {/* ENGLISH */}
            <div style={{marginTop:10}}><b style={{color:'#8e44ad'}}>English</b>
                <div style={styles.row}><small>Kids</small><input type="number" value={prices.english?.kids || 0} onChange={(e) => setPrices({...prices, english: {...prices.english, kids: e.target.value}})} style={styles.input} /></div>
                <div style={styles.row}><small>Junior</small><input type="number" value={prices.english?.junior || 0} onChange={(e) => setPrices({...prices, english: {...prices.english, junior: e.target.value}})} style={styles.input} /></div>
                <div style={styles.row}><small>Pro</small><input type="number" value={prices.english?.professional || 0} onChange={(e) => setPrices({...prices, english: {...prices.english, professional: e.target.value}})} style={styles.input} /></div>
            </div>
          </div>

          {/* GAJI GURU (UPDATE KELAS 6) */}
          <div style={styles.card}>
            <h3 style={styles.headerGreen}>💰 Gaji & Honor Guru</h3>
            <div style={styles.formGroup}><label>Honor SD (1-5)</label><input type="number" value={salaryRules.honorSD} onChange={(e) => setSalaryRules({...salaryRules, honorSD: e.target.value})} style={styles.input} /></div>
            
            {/* FIELD BARU: KELAS 6 */}
            <div style={{...styles.formGroup, background:'#e8f8f5', padding:10, borderRadius:5, border:'1px solid #27ae60'}}>
                <label style={{color:'#16a085', fontWeight:'bold'}}>⭐ Honor SD KELAS 6</label>
                <input type="number" value={salaryRules.honorKelas6} onChange={(e) => setSalaryRules({...salaryRules, honorKelas6: e.target.value})} style={styles.input} />
            </div>

            <div style={styles.formGroup}><label>Honor SMP</label><input type="number" value={salaryRules.honorSMP} onChange={(e) => setSalaryRules({...salaryRules, honorSMP: e.target.value})} style={styles.input} /></div>
            <div style={styles.formGroup}><label>Bonus Inggris</label><input type="number" value={salaryRules.bonusInggris} onChange={(e) => setSalaryRules({...salaryRules, bonusInggris: e.target.value})} style={styles.input} /></div>
            
            <h4 style={{marginTop:20, borderTop:'1px dashed #ccc', paddingTop:10}}>Lain-lain</h4>
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
  row: { marginBottom: 5 },
  input: { width: '100%', padding: '10px', borderRadius: '5px', border: '1px solid #ccc', boxSizing: 'border-box', background: '#fff', color: '#000' },
  btnSaveBig: { padding: '10px 20px', background: '#2c3e50', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' },
  btnBlue: { padding: '10px 20px', background: '#3498db', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' },
  btnRed: { padding: '10px 20px', background: '#c0392b', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' }
};

export default Settings;