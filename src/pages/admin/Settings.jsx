import React, { useState, useEffect } from 'react';
import Sidebar from '../../components/Sidebar';
import { db } from '../../firebase';
import { doc, getDoc, setDoc } from "firebase/firestore";

const Settings = () => {
  const [loading, setLoading] = useState(true);
  
  // DATA HARGA SPP (SISWA)
  const [prices, setPrices] = useState({
    sd: { paket1: 150000, paket2: 200000, paket3: 250000 },
    smp: { paket1: 200000, paket2: 250000, paket3: 300000 },
    english: { kids: 150000, junior: 200000, professional: 300000 } 
  });

  // DATA GAJI GURU (UPDATE: English Dipecah, Transport Dihapus)
  const [salaryRules, setSalaryRules] = useState({
    honorSD: 35000, 
    honorKelas6: 40000, 
    honorSMP: 40000, 
    // Gaji Guru English Per Level
    honorEnglishKids: 35000,
    honorEnglishJunior: 40000,
    honorEnglishPro: 50000,
    
    // Lainnya
    buatSoal: 50000, 
    pengawas: 30000, ujianPaket: 15000, ujianJaga: 10000, ujianSoal: 10000
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
          // Merge agar field baru tidak hilang
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
      alert("✅ Pengaturan Gaji & Harga Disimpan!");
    } catch (error) { alert("Gagal menyimpan."); }
  };

  if (isLocked) {
      return (
          <div style={{height:'100vh', background:'#2c3e50', display:'flex', justifyContent:'center', alignItems:'center'}}>
              <div style={{background:'white', padding:40, borderRadius:10, textAlign:'center'}}>
                  <h2 style={{marginTop:0}}>🔐 Area Owner</h2>
                  <form onSubmit={handleUnlock}>
                      <input type="password" value={inputPin} onChange={e=>setInputPin(e.target.value)} style={{padding:10, fontSize:20, textAlign:'center', width:'100%', marginBottom:10}} autoFocus />
                      <button type="submit" style={{width:'100%', padding:10, background:'#27ae60', color:'white', border:'none', borderRadius:5}}>BUKA</button>
                  </form>
              </div>
          </div>
      );
  }

  return (
    <div style={{ display: 'flex' }}>
      <Sidebar />
      <div style={styles.mainContent}>
        <div style={{display:'flex', justifyContent:'space-between', marginBottom:20}}>
           <h2 style={{margin:0}}>⚙️ Pengaturan Gaji & Harga</h2>
           <button onClick={handleSaveData} style={styles.btnSaveBig}>💾 SIMPAN PERUBAHAN</button>
        </div>

        <div style={styles.grid}>
          {/* GAJI GURU */}
          <div style={styles.card}>
            <h3 style={styles.headerGreen}>💰 Standar Gaji Guru</h3>
            
            <div style={styles.sectionLabel}>Bimbel Reguler</div>
            <div style={styles.formGroup}><label>Honor SD (1-5)</label><input type="number" value={salaryRules.honorSD} onChange={(e) => setSalaryRules({...salaryRules, honorSD: e.target.value})} style={styles.input} /></div>
            <div style={styles.formGroup}><label>Honor SD (Kelas 6)</label><input type="number" value={salaryRules.honorKelas6} onChange={(e) => setSalaryRules({...salaryRules, honorKelas6: e.target.value})} style={styles.input} /></div>
            <div style={styles.formGroup}><label>Honor SMP</label><input type="number" value={salaryRules.honorSMP} onChange={(e) => setSalaryRules({...salaryRules, honorSMP: e.target.value})} style={styles.input} /></div>
            
            <div style={styles.sectionLabel}>🇬🇧 English Course (Per Sesi)</div>
            <div style={styles.formGroup}><label>Level Kids</label><input type="number" value={salaryRules.honorEnglishKids} onChange={(e) => setSalaryRules({...salaryRules, honorEnglishKids: e.target.value})} style={styles.input} /></div>
            <div style={styles.formGroup}><label>Level Junior</label><input type="number" value={salaryRules.honorEnglishJunior} onChange={(e) => setSalaryRules({...salaryRules, honorEnglishJunior: e.target.value})} style={styles.input} /></div>
            <div style={styles.formGroup}><label>Level Professional</label><input type="number" value={salaryRules.honorEnglishPro} onChange={(e) => setSalaryRules({...salaryRules, honorEnglishPro: e.target.value})} style={styles.input} /></div>
            
            <div style={styles.sectionLabel}>Lainnya</div>
            <div style={styles.formGroup}><label>Buat Soal</label><input type="number" value={salaryRules.ujianSoal} onChange={(e) => setSalaryRules({...salaryRules, ujianSoal: e.target.value})} style={styles.input} /></div>
            <div style={styles.formGroup}><label>Jaga Ujian</label><input type="number" value={salaryRules.ujianJaga} onChange={(e) => setSalaryRules({...salaryRules, ujianJaga: e.target.value})} style={styles.input} /></div>
          </div>

          {/* HARGA SISWA (SPP) */}
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
  sectionLabel: { background:'#eee', padding:'5px 10px', borderRadius:4, fontWeight:'bold', marginTop:15, marginBottom:10, fontSize:13 },
  subSection: { marginBottom: 15, paddingBottom: 10, borderBottom: '1px dashed #eee' },
  formGroup: { marginBottom: '5px', display:'flex', justifyContent:'space-between', alignItems:'center' },
  row: { marginBottom: 5 },
  input: { width: '100px', padding: '5px', borderRadius: '5px', border: '1px solid #ccc', textAlign:'right' },
  btnSaveBig: { padding: '10px 20px', background: '#2c3e50', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' },
};

export default Settings;