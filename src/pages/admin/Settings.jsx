import React, { useState, useEffect } from 'react';
import SidebarAdmin from '../../components/SidebarAdmin'; 
import { db } from '../../firebase'; 
import { doc, getDoc, setDoc } from "firebase/firestore";
import { Trash2, Plus, Save, Lock } from 'lucide-react';

const Settings = () => {
  const [loading, setLoading] = useState(true);
  const [prices, setPrices] = useState({
    sd: { paket1: 150000, paket2: 200000, paket3: 250000 },
    smp: { paket1: 200000, paket2: 250000, paket3: 300000 },
    english: { kids: 150000, junior: 200000, professional: 300000 } 
  });

  const [salaryRules, setSalaryRules] = useState({
    honorSD: 35000, honorKelas6: 40000, honorSMP: 40000, 
    honorEnglishKids: 35000, honorEnglishJunior: 40000,
    honorEnglishPro: 50000, honorKompensasi: 20000, customHonors: [] 
  });

  const [ownerPin, setOwnerPin] = useState("2003");
  const [isLocked, setIsLocked] = useState(true);
  const [inputPin, setInputPin] = useState("");

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const docRef = doc(db, "settings", "global_config");
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data.prices) setPrices(data.prices);
          if (data.salaryRules) setSalaryRules(prev => ({...prev, ...data.salaryRules}));
          if (data.ownerPin) setOwnerPin(data.ownerPin);
        }
      } catch (error) { console.error(error); } 
      finally { setLoading(false); }
    };
    fetchSettings();
  }, []);

  const handleUnlock = (e) => {
    e.preventDefault();
    if(inputPin === ownerPin) setIsLocked(false);
    else { alert("⛔ PIN SALAH!"); setInputPin(""); }
  };

  const handleSaveData = async () => {
    try {
      await setDoc(doc(db, "settings", "global_config"), { prices, salaryRules, ownerPin }, { merge: true });
      alert("✅ Pengaturan Berhasil Disimpan!");
    } catch (error) { alert("Gagal menyimpan."); }
  };

  if (isLocked) {
      return (
          <div style={styles.lockOverlay}>
              <div style={styles.lockCard}>
                  <Lock size={40} color="#2c3e50" style={{marginBottom:15}}/>
                  <h2 style={{marginTop:0}}>🔐 Area Owner</h2>
                  <form onSubmit={handleUnlock}>
                      <input type="password" value={inputPin} onChange={e=>setInputPin(e.target.value)} style={styles.pinInput} autoFocus placeholder="****" />
                      <button type="submit" style={styles.btnUnlock}>BUKA AKSES</button>
                  </form>
              </div>
          </div>
      );
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f8fafc' }}>
      <SidebarAdmin /> 
      <div style={styles.mainContent}>
        <div style={styles.topHeader}>
           <h2 style={{margin:0}}>⚙️ Pengaturan Gaji & Harga</h2>
           <button onClick={handleSaveData} style={styles.btnSaveBig}><Save size={18}/> SIMPAN</button>
        </div>
        <div style={styles.grid}>
          <div style={styles.card}>
            <h3 style={{color:'#059669', borderBottom:'1px solid #eee', paddingBottom:10}}>💰 Standar Gaji</h3>
            <div style={styles.formGroup}><label>Honor SD</label><input type="number" value={salaryRules.honorSD} onChange={(e) => setSalaryRules({...salaryRules, honorSD: parseInt(e.target.value)})} style={styles.input} /></div>
            <div style={styles.formGroup}><label>Honor SMP</label><input type="number" value={salaryRules.honorSMP} onChange={(e) => setSalaryRules({...salaryRules, honorSMP: parseInt(e.target.value)})} style={styles.input} /></div>
          </div>
          <div style={styles.card}>
            <h3 style={{color:'#2563eb', borderBottom:'1px solid #eee', paddingBottom:10}}>📚 Harga SPP</h3>
            <div style={styles.formGroup}><label>Paket SD 1</label><input type="number" value={prices.sd.paket1} onChange={(e) => setPrices({...prices, sd: {...prices.sd, paket1: parseInt(e.target.value)}})} style={styles.input} /></div>
            <div style={styles.formGroup}><label>PIN Owner</label><input type="text" value={ownerPin} onChange={(e) => setOwnerPin(e.target.value)} style={styles.input} /></div>
          </div>
        </div>
      </div>
    </div>
  );
};

const styles = {
  mainContent: { marginLeft: '250px', padding: '30px', width: 'calc(100% - 250px)' },
  topHeader: { display:'flex', justifyContent:'space-between', marginBottom:30, background:'white', padding:20, borderRadius:15 },
  grid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '25px' },
  card: { background: 'white', padding: '25px', borderRadius: '15px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' },
  formGroup: { marginBottom: '15px', display:'flex', justifyContent:'space-between', alignItems:'center' },
  input: { width: '120px', padding: '8px', borderRadius: '8px', border: '1px solid #ddd', textAlign:'right' },
  btnSaveBig: { display:'flex', alignItems:'center', gap:8, padding: '10px 20px', background: '#1e293b', color: 'white', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight:'bold' },
  lockOverlay: { height:'100vh', background:'#0f172a', width:'100vw', position:'fixed', top:0, left:0, display:'flex', justifyContent:'center', alignItems:'center', zIndex:9999 },
  lockCard: { background:'white', padding:40, borderRadius:20, textAlign:'center', width:300 },
  pinInput: { padding:10, fontSize:20, textAlign:'center', width:'100%', marginBottom:15, borderRadius:10, border:'1px solid #ddd' },
  btnUnlock: { width:'100%', padding:12, background:'#2563eb', color:'white', border:'none', borderRadius:10, cursor:'pointer' }
};

export default Settings;