import React, { useState, useEffect } from 'react';
import SidebarAdmin from '../../components/SidebarAdmin'; 
import { db } from '../../firebase'; 
import { doc, getDoc, setDoc } from "firebase/firestore";
import { Save, Lock, DollarSign, Info } from 'lucide-react';

const Settings = () => {
  const [loading, setLoading] = useState(true);
  
  // 🔥 HARGA SPP
  const [prices, setPrices] = useState({
    sd: { paket1: 150000, paket2: 200000, paket3: 250000 },
    smp: { paket1: 200000, paket2: 250000, paket3: 300000 },
    english: { kids: 150000, junior: 200000, professional: 300000 } 
  });

  // 🔥 ATURAN HONOR (SELARAS DENGAN ClassSession)
  const [salaryRules, setSalaryRules] = useState({
    honorSD: 35000,
    honorSMP: 40000,
    honorSMA: 50000,
    bonusInggris: 10000,
    kompensasiPersen: 50, // 🔥 Persentase kompensasi (0 siswa hadir)
    honorMinimal: 20000,
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
          if (data.prices) setPrices(prev => ({...prev, ...data.prices}));
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
      await setDoc(doc(db, "settings", "global_config"), { 
        prices, 
        salaryRules,
        ownerPin 
      }, { merge: true });
      alert("✅ Pengaturan Berhasil Disimpan!\n\nHonor akan otomatis dipakai di sesi mengajar berikutnya.");
    } catch (error) { alert("Gagal menyimpan: " + error.message); }
  };

  // 🔥 HITUNG KOMPENSASI (50% dari honorSD)
  const kompensasiNominal = Math.round(salaryRules.honorSD * (salaryRules.kompensasiPersen / 100));

  if (isLocked) {
      return (
          <div style={styles.lockOverlay}>
              <div style={styles.lockCard}>
                  <Lock size={40} color="#2c3e50" style={{marginBottom:15}}/>
                  <h2 style={{marginTop:0}}>🔐 Area Owner</h2>
                  <p style={{color: '#64748b', fontSize: 13, marginBottom: 20}}>Masukkan PIN untuk mengakses pengaturan</p>
                  <form onSubmit={handleUnlock}>
                      <input type="password" value={inputPin} onChange={e=>setInputPin(e.target.value)} style={styles.pinInput} autoFocus placeholder="****" maxLength={6} />
                      <button type="submit" style={styles.btnUnlock}>BUKA AKSES</button>
                  </form>
              </div>
          </div>
      );
  }

  if (loading) return <div style={{padding: 50, textAlign: 'center'}}>Memuat data...</div>;

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f8fafc' }}>
      <SidebarAdmin /> 
      <div style={styles.mainContent}>
        
        <div style={styles.topHeader}>
           <div>
             <h2 style={{margin:0, color: '#1e293b'}}>⚙️ Pengaturan Sistem</h2>
             <p style={{margin: '5px 0 0', color: '#64748b', fontSize: 13}}>Kelola honor guru, harga SPP, dan PIN keamanan</p>
           </div>
           <button onClick={handleSaveData} style={styles.btnSaveBig}><Save size={18}/> SIMPAN SEMUA</button>
        </div>

        <div style={styles.grid}>
          
          {/* 🔥 KARTU: ATURAN HONOR GURU */}
          <div style={styles.card}>
            <h3 style={{...styles.cardTitle, color: '#059669'}}>💰 Honor Mengajar (Per Jam)</h3>
            <p style={styles.cardDesc}>Aturan ini dipakai otomatis saat guru menyelesaikan kelas. Nominal TIDAK ditampilkan ke guru.</p>
            
            <div style={styles.formGroup}>
              <label style={styles.label}>Honor SD</label>
              <input type="number" value={salaryRules.honorSD} onChange={(e) => setSalaryRules({...salaryRules, honorSD: parseInt(e.target.value) || 0})} style={styles.input} />
            </div>
            
            <div style={styles.formGroup}>
              <label style={styles.label}>Honor SMP</label>
              <input type="number" value={salaryRules.honorSMP} onChange={(e) => setSalaryRules({...salaryRules, honorSMP: parseInt(e.target.value) || 0})} style={styles.input} />
            </div>
            
            <div style={styles.formGroup}>
              <label style={styles.label}>Honor SMA</label>
              <input type="number" value={salaryRules.honorSMA} onChange={(e) => setSalaryRules({...salaryRules, honorSMA: parseInt(e.target.value) || 0})} style={styles.input} />
            </div>

            <div style={styles.divider} />

            <div style={styles.formGroup}>
              <label style={styles.label}>Bonus English (per jam)</label>
              <input type="number" value={salaryRules.bonusInggris} onChange={(e) => setSalaryRules({...salaryRules, bonusInggris: parseInt(e.target.value) || 0})} style={styles.input} />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Kompensasi (%)</label>
              <div style={{display: 'flex', alignItems: 'center', gap: 8}}>
                <input type="number" value={salaryRules.kompensasiPersen} onChange={(e) => setSalaryRules({...salaryRules, kompensasiPersen: parseInt(e.target.value) || 0})} style={{...styles.input, width: 80}} />
                <span style={{fontSize: 13, color: '#64748b'}}>% dari honorSD</span>
              </div>
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Honor Minimal Per Sesi</label>
              <input type="number" value={salaryRules.honorMinimal} onChange={(e) => setSalaryRules({...salaryRules, honorMinimal: parseInt(e.target.value) || 0})} style={styles.input} />
            </div>

            {/* 🔥 INFO PERHITUNGAN */}
            <div style={styles.infoBox}>
              <strong><Info size={14} /> Cara Hitung:</strong>
              <ul style={{margin: '5px 0 0', paddingLeft: 20, fontSize: 12, color: '#64748b'}}>
                <li><b>Reguler:</b> Honor Jenjang × Jam</li>
                <li><b>English:</b> (Honor SD + Bonus) × Jam</li>
                <li><b>0 Hadir:</b> <span style={{color: '#ef4444'}}>{salaryRules.kompensasiPersen}% × Honor SD × Jam = Rp {kompensasiNominal.toLocaleString()}/jam</span></li>
                <li>Deteksi jenjang dari judul kelas</li>
              </ul>
            </div>
          </div>

          {/* 🔥 KARTU: HARGA SPP */}
          <div style={styles.card}>
            <h3 style={{...styles.cardTitle, color: '#2563eb'}}>📚 Harga SPP</h3>
            <p style={styles.cardDesc}>Harga paket belajar untuk pendaftaran siswa baru.</p>
            
            <h4 style={styles.subTitle}>🎒 SD</h4>
            <div style={styles.formGroup}>
              <label style={styles.label}>Paket 1</label>
              <input type="number" value={prices.sd.paket1} onChange={(e) => setPrices({...prices, sd: {...prices.sd, paket1: parseInt(e.target.value) || 0}})} style={styles.input} />
            </div>
            <div style={styles.formGroup}>
              <label style={styles.label}>Paket 2</label>
              <input type="number" value={prices.sd.paket2} onChange={(e) => setPrices({...prices, sd: {...prices.sd, paket2: parseInt(e.target.value) || 0}})} style={styles.input} />
            </div>
            <div style={styles.formGroup}>
              <label style={styles.label}>Paket 3</label>
              <input type="number" value={prices.sd.paket3} onChange={(e) => setPrices({...prices, sd: {...prices.sd, paket3: parseInt(e.target.value) || 0}})} style={styles.input} />
            </div>

            <h4 style={styles.subTitle}>🎒 SMP</h4>
            <div style={styles.formGroup}>
              <label style={styles.label}>Paket 1</label>
              <input type="number" value={prices.smp.paket1} onChange={(e) => setPrices({...prices, smp: {...prices.smp, paket1: parseInt(e.target.value) || 0}})} style={styles.input} />
            </div>
            <div style={styles.formGroup}>
              <label style={styles.label}>Paket 2</label>
              <input type="number" value={prices.smp.paket2} onChange={(e) => setPrices({...prices, smp: {...prices.smp, paket2: parseInt(e.target.value) || 0}})} style={styles.input} />
            </div>
            <div style={styles.formGroup}>
              <label style={styles.label}>Paket 3</label>
              <input type="number" value={prices.smp.paket3} onChange={(e) => setPrices({...prices, smp: {...prices.smp, paket3: parseInt(e.target.value) || 0}})} style={styles.input} />
            </div>

            <h4 style={styles.subTitle}>🗣️ English</h4>
            <div style={styles.formGroup}>
              <label style={styles.label}>Kids</label>
              <input type="number" value={prices.english.kids} onChange={(e) => setPrices({...prices, english: {...prices.english, kids: parseInt(e.target.value) || 0}})} style={styles.input} />
            </div>
            <div style={styles.formGroup}>
              <label style={styles.label}>Junior</label>
              <input type="number" value={prices.english.junior} onChange={(e) => setPrices({...prices, english: {...prices.english, junior: parseInt(e.target.value) || 0}})} style={styles.input} />
            </div>
            <div style={styles.formGroup}>
              <label style={styles.label}>Professional</label>
              <input type="number" value={prices.english.professional} onChange={(e) => setPrices({...prices, english: {...prices.english, professional: parseInt(e.target.value) || 0}})} style={styles.input} />
            </div>

            <div style={styles.divider} />

            <h4 style={styles.subTitle}>🔐 PIN Keamanan</h4>
            <div style={styles.formGroup}>
              <label style={styles.label}>PIN Owner</label>
              <input type="text" value={ownerPin} onChange={(e) => setOwnerPin(e.target.value)} style={styles.input} maxLength={6} placeholder="******" />
            </div>
            <p style={{fontSize: 11, color: '#ef4444'}}>⚠️ Jangan bagikan PIN ini ke siapapun!</p>
          </div>
        </div>

        {/* 🔥 INFO SINKRONISASI */}
        <div style={styles.syncInfo}>
          <DollarSign size={20} color="#059669" />
          <span>Honor otomatis dipakai di sesi mengajar. Nominal TIDAK ditampilkan ke guru. Hanya Owner & Admin yang bisa melihat di Log Gaji.</span>
        </div>
      </div>
    </div>
  );
};

const styles = {
  mainContent: { marginLeft: '250px', padding: '30px', width: 'calc(100% - 250px)', boxSizing: 'border-box' },
  topHeader: { display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:30, background:'white', padding:20, borderRadius:15, boxShadow: '0 2px 10px rgba(0,0,0,0.05)', flexWrap: 'wrap', gap: 15 },
  btnSaveBig: { display:'flex', alignItems:'center', gap:8, padding: '12px 25px', background: '#1e293b', color: 'white', border: 'none', borderRadius: '12px', cursor: 'pointer', fontWeight:'bold', fontSize: 14 },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '25px' },
  card: { background: 'white', padding: '25px', borderRadius: '15px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' },
  cardTitle: { margin: '0 0 5px 0', fontSize: 18, fontWeight: 'bold' },
  cardDesc: { color: '#64748b', fontSize: 12, marginBottom: 20 },
  subTitle: { color: '#64748b', fontSize: 13, fontWeight: 'bold', marginTop: 20, marginBottom: 10 },
  formGroup: { marginBottom: '12px', display:'flex', justifyContent:'space-between', alignItems:'center' },
  label: { fontSize: 13, fontWeight: '600', color: '#334155' },
  input: { width: '130px', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0', textAlign:'right', fontSize: 14, fontWeight: 'bold' },
  divider: { height: '1px', background: '#f1f5f9', margin: '20px 0' },
  infoBox: { background: '#f0fdf4', padding: 15, borderRadius: 10, border: '1px solid #bbf7d0', marginTop: 20, fontSize: 13 },
  syncInfo: { background: '#f0fdf4', padding: 15, borderRadius: 12, marginTop: 20, display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, color: '#065f46', border: '1px solid #bbf7d0' },
  lockOverlay: { height:'100vh', background:'#0f172a', width:'100vw', position:'fixed', top:0, left:0, display:'flex', justifyContent:'center', alignItems:'center', zIndex:9999 },
  lockCard: { background:'white', padding:40, borderRadius:20, textAlign:'center', width:300, boxShadow: '0 20px 50px rgba(0,0,0,0.3)' },
  pinInput: { padding:12, fontSize:22, textAlign:'center', width:'100%', marginBottom:15, borderRadius:10, border:'1px solid #ddd', boxSizing: 'border-box', letterSpacing: 10 },
  btnUnlock: { width:'100%', padding:12, background:'#2563eb', color:'white', border:'none', borderRadius:10, cursor:'pointer', fontWeight: 'bold' }
};

export default Settings;