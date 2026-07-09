// src/pages/admin/Settings.jsx
import React, { useState, useEffect } from 'react';
import SidebarAdmin from '../../components/SidebarAdmin';
import { db } from '../../firebase';
import { doc, getDoc, setDoc } from "firebase/firestore";
import { Save, Lock, Info, Shield, Eye, EyeOff } from 'lucide-react';

const Settings = () => {
  const [loading, setLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  const [prices, setPrices] = useState({
    sd: { paket1: 150000, paket2: 200000, paket3: 250000, paket4: 300000 },
    smp: { paket1: 200000, paket2: 250000, paket3: 300000, paket4: 400000 },
    sma: { paket1: 300000, paket2: 350000, paket3: 450000, paket4: 550000 },
    english: { kids: 150000, junior: 200000, professional: 300000 }
  });

  const [salaryRules, setSalaryRules] = useState({
    honorSD: 35000, honorSMP: 40000, honorSMA: 50000,
    bonusInggris: 10000, kompensasiPersen: 50, honorMinimal: 20000,
  });

  const [ownerPin, setOwnerPin] = useState("2003");
  const [isLocked, setIsLocked] = useState(true);
  const [inputPin, setInputPin] = useState("");
  const [showPin, setShowPin] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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
    if (inputPin === ownerPin) {
      setIsLocked(false);
      setInputPin("");
    } else {
      alert("⛔ PIN SALAH! Coba lagi.");
      setInputPin("");
    }
  };

  const handleSaveData = async () => {
    if (ownerPin.length < 4) return alert("⚠️ PIN Owner minimal 4 karakter!");
    if (!window.confirm("Simpan semua perubahan pengaturan?")) return;
    
    setSaving(true);
    try {
      await setDoc(doc(db, "settings", "global_config"), {
        prices, salaryRules, ownerPin
      }, { merge: true });
      alert("✅ Pengaturan Berhasil Disimpan!");
    } catch (error) {
      alert("❌ Gagal menyimpan: " + error.message);
    } finally {
      setSaving(false);
    }
  };

  const kompensasiNominal = Math.round(salaryRules.honorSD * (salaryRules.kompensasiPersen / 100));

  // === LOCK SCREEN ===
  if (isLocked) {
    return (
      <div style={styles.lockOverlay}>
        <div style={styles.lockCard}>
          <Lock size={48} color="#1e293b" style={{marginBottom: 15}} />
          <h2 style={{margin: '0 0 5px', color: '#1e293b'}}>🔐 Area Owner</h2>
          <p style={{color: '#64748b', fontSize: 13, marginBottom: 20}}>Masukkan PIN untuk mengakses pengaturan sistem</p>
          <form onSubmit={handleUnlock}>
            <div style={{position: 'relative'}}>
              <input 
                type={showPin ? 'text' : 'password'} 
                value={inputPin} onChange={e => setInputPin(e.target.value)} 
                style={styles.pinInput} autoFocus placeholder="******" maxLength={6} 
              />
              <button type="button" onClick={() => setShowPin(!showPin)} style={styles.eyeBtn}>
                {showPin ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            <button type="submit" style={styles.btnUnlock}>🔓 BUKA AKSES</button>
          </form>
        </div>
      </div>
    );
  }

  if (loading) return (
    <div style={styles.wrapper}>
      <SidebarAdmin />
      <div style={styles.mainContent(isMobile)}>
        <div style={{textAlign: 'center', padding: 80}}>Memuat pengaturan...</div>
      </div>
    </div>
  );

  return (
    <div style={styles.wrapper}>
      <SidebarAdmin />
      <div style={styles.mainContent(isMobile)}>
        
        {/* HEADER */}
        <div style={styles.header(isMobile)}>
          <div>
            <h2 style={styles.pageTitle}>⚙️ Pengaturan Sistem</h2>
            <p style={styles.subtitle}>Kelola harga SPP, honor guru, dan PIN keamanan</p>
          </div>
          <button onClick={handleSaveData} disabled={saving} style={styles.btnSave}>
            <Save size={18} /> {saving ? 'Menyimpan...' : 'SIMPAN SEMUA'}
          </button>
        </div>

        <div style={styles.grid(isMobile)}>

          {/* === HONOR GURU === */}
          <div style={styles.card}>
            <h3 style={styles.cardTitle}>💰 Aturan Honor Guru</h3>
            <p style={styles.cardDesc}>Berlaku otomatis saat guru menyelesaikan kelas. Nominal TIDAK ditampilkan ke guru.</p>

            <div style={styles.fieldRow}>
              <span>Honor SD (per jam)</span>
              <input type="number" value={salaryRules.honorSD} onChange={e => setSalaryRules({...salaryRules, honorSD: parseInt(e.target.value) || 0})} style={styles.input} />
            </div>
            <div style={styles.fieldRow}>
              <span>Honor SMP (per jam)</span>
              <input type="number" value={salaryRules.honorSMP} onChange={e => setSalaryRules({...salaryRules, honorSMP: parseInt(e.target.value) || 0})} style={styles.input} />
            </div>
            <div style={styles.fieldRow}>
              <span>Honor SMA (per jam)</span>
              <input type="number" value={salaryRules.honorSMA} onChange={e => setSalaryRules({...salaryRules, honorSMA: parseInt(e.target.value) || 0})} style={styles.input} />
            </div>
            <div style={styles.divider} />
            <div style={styles.fieldRow}>
              <span>Bonus English (per jam)</span>
              <input type="number" value={salaryRules.bonusInggris} onChange={e => setSalaryRules({...salaryRules, bonusInggris: parseInt(e.target.value) || 0})} style={styles.input} />
            </div>
            <div style={styles.fieldRow}>
              <span>Kompensasi 0 Hadir (%)</span>
              <div style={{display: 'flex', alignItems: 'center', gap: 6}}>
                <input type="number" value={salaryRules.kompensasiPersen} onChange={e => setSalaryRules({...salaryRules, kompensasiPersen: parseInt(e.target.value) || 0})} style={{...styles.input, width: 70}} />
                <span style={{fontSize: 11, color: '#64748b'}}>%</span>
              </div>
            </div>
            <div style={styles.fieldRow}>
              <span>Honor Minimal/Sesi</span>
              <input type="number" value={salaryRules.honorMinimal} onChange={e => setSalaryRules({...salaryRules, honorMinimal: parseInt(e.target.value) || 0})} style={styles.input} />
            </div>

            <div style={styles.infoBox}>
              <Info size={14} /> <strong>Cara Hitung:</strong><br/>
              <span style={{fontSize: 11}}>Reguler: Honor Jenjang × Jam | English: (Honor SD + Bonus) × Jam | 0 Hadir: {salaryRules.kompensasiPersen}% × Honor SD × Jam = Rp {kompensasiNominal.toLocaleString()}/jam</span>
            </div>
          </div>

          {/* === HARGA SPP + PIN === */}
          <div style={styles.card}>
            <h3 style={styles.cardTitle}>📚 Harga SPP</h3>
            
            {/* SD */}
            <h4 style={styles.subTitle}>🎒 SD (Sekolah Dasar)</h4>
            <div style={styles.fieldRow}><span>Paket 1</span><input type="number" value={prices.sd.paket1} onChange={e => setPrices({...prices, sd: {...prices.sd, paket1: parseInt(e.target.value) || 0}})} style={styles.input} /></div>
            <div style={styles.fieldRow}><span>Paket 2</span><input type="number" value={prices.sd.paket2} onChange={e => setPrices({...prices, sd: {...prices.sd, paket2: parseInt(e.target.value) || 0}})} style={styles.input} /></div>
            <div style={styles.fieldRow}><span>Paket 3</span><input type="number" value={prices.sd.paket3} onChange={e => setPrices({...prices, sd: {...prices.sd, paket3: parseInt(e.target.value) || 0}})} style={styles.input} /></div>
            <div style={styles.fieldRow}><span>Paket 4</span><input type="number" value={prices.sd.paket4} onChange={e => setPrices({...prices, sd: {...prices.sd, paket4: parseInt(e.target.value) || 0}})} style={styles.input} /></div>

            {/* SMP */}
            <h4 style={styles.subTitle}>🎒 SMP (Sekolah Menengah Pertama)</h4>
            <div style={styles.fieldRow}><span>Paket 1</span><input type="number" value={prices.smp.paket1} onChange={e => setPrices({...prices, smp: {...prices.smp, paket1: parseInt(e.target.value) || 0}})} style={styles.input} /></div>
            <div style={styles.fieldRow}><span>Paket 2</span><input type="number" value={prices.smp.paket2} onChange={e => setPrices({...prices, smp: {...prices.smp, paket2: parseInt(e.target.value) || 0}})} style={styles.input} /></div>
            <div style={styles.fieldRow}><span>Paket 3</span><input type="number" value={prices.smp.paket3} onChange={e => setPrices({...prices, smp: {...prices.smp, paket3: parseInt(e.target.value) || 0}})} style={styles.input} /></div>
            <div style={styles.fieldRow}><span>Paket 4</span><input type="number" value={prices.smp.paket4} onChange={e => setPrices({...prices, smp: {...prices.smp, paket4: parseInt(e.target.value) || 0}})} style={styles.input} /></div>

            {/* SMA */}
            <h4 style={styles.subTitle}>🎒 SMA (Sekolah Menengah Atas)</h4>
            <div style={styles.fieldRow}><span>Paket 1</span><input type="number" value={prices.sma.paket1} onChange={e => setPrices({...prices, sma: {...prices.sma, paket1: parseInt(e.target.value) || 0}})} style={styles.input} /></div>
            <div style={styles.fieldRow}><span>Paket 2</span><input type="number" value={prices.sma.paket2} onChange={e => setPrices({...prices, sma: {...prices.sma, paket2: parseInt(e.target.value) || 0}})} style={styles.input} /></div>
            <div style={styles.fieldRow}><span>Paket 3</span><input type="number" value={prices.sma.paket3} onChange={e => setPrices({...prices, sma: {...prices.sma, paket3: parseInt(e.target.value) || 0}})} style={styles.input} /></div>
            <div style={styles.fieldRow}><span>Paket 4</span><input type="number" value={prices.sma.paket4} onChange={e => setPrices({...prices, sma: {...prices.sma, paket4: parseInt(e.target.value) || 0}})} style={styles.input} /></div>

            {/* English */}
            <h4 style={styles.subTitle}>🗣️ English Course</h4>
            <div style={styles.fieldRow}><span>Kids</span><input type="number" value={prices.english.kids} onChange={e => setPrices({...prices, english: {...prices.english, kids: parseInt(e.target.value) || 0}})} style={styles.input} /></div>
            <div style={styles.fieldRow}><span>Junior</span><input type="number" value={prices.english.junior} onChange={e => setPrices({...prices, english: {...prices.english, junior: parseInt(e.target.value) || 0}})} style={styles.input} /></div>
            <div style={styles.fieldRow}><span>Professional</span><input type="number" value={prices.english.professional} onChange={e => setPrices({...prices, english: {...prices.english, professional: parseInt(e.target.value) || 0}})} style={styles.input} /></div>

            <div style={styles.divider} />
            
            {/* PIN */}
            <h4 style={styles.subTitle}>🔐 PIN Keamanan</h4>
            <div style={styles.fieldRow}>
              <span><Shield size={14} /> PIN Owner</span>
              <input type="text" value={ownerPin} onChange={e => setOwnerPin(e.target.value)} style={styles.input} maxLength={6} placeholder="Min 4 digit" />
            </div>
            <p style={{fontSize: 10, color: '#ef4444', marginTop: 4}}>⚠️ PIN ini digunakan untuk hapus/edit transaksi & akses Settings.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

// === STYLES ===
const styles = {
  wrapper: { display: 'flex', background: '#f8fafc', minHeight: '100vh' },
  mainContent: (m) => ({ marginLeft: m ? '0' : '250px', padding: m ? '15px' : '30px', width: '100%', boxSizing: 'border-box', transition: '0.3s' }),
  
  lockOverlay: { height: '100vh', background: '#0f172a', width: '100vw', position: 'fixed', top: 0, left: 0, display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 9999 },
  lockCard: { background: 'white', padding: 40, borderRadius: 20, textAlign: 'center', width: 320, maxWidth: '90vw', boxShadow: '0 20px 50px rgba(0,0,0,0.3)' },
  pinInput: { padding: 12, fontSize: 20, textAlign: 'center', width: '100%', marginBottom: 15, borderRadius: 10, border: '1px solid #ddd', boxSizing: 'border-box', letterSpacing: 8 },
  eyeBtn: { position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' },
  btnUnlock: { width: '100%', padding: 14, background: '#1e293b', color: 'white', border: 'none', borderRadius: 10, cursor: 'pointer', fontWeight: 'bold', fontSize: 14 },

  header: (m) => ({ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 12, background: 'white', padding: 20, borderRadius: 14, boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }),
  pageTitle: { margin: 0, color: '#1e293b', fontSize: 20 },
  subtitle: { color: '#64748b', fontSize: 12, margin: '4px 0 0' },
  btnSave: { display: 'flex', alignItems: 'center', gap: 8, padding: '12px 24px', background: '#1e293b', color: 'white', border: 'none', borderRadius: 10, cursor: 'pointer', fontWeight: 'bold', fontSize: 14 },

  grid: (m) => ({ display: 'grid', gridTemplateColumns: m ? '1fr' : 'repeat(auto-fit, minmax(400px, 1fr))', gap: 20 }),
  
  card: { background: 'white', padding: 24, borderRadius: 14, boxShadow: '0 2px 8px rgba(0,0,0,0.04)', border: '1px solid #f1f5f9' },
  cardTitle: { margin: '0 0 4px', fontSize: 16, fontWeight: 'bold', color: '#1e293b' },
  cardDesc: { color: '#94a3b8', fontSize: 11, marginBottom: 16 },
  subTitle: { color: '#64748b', fontSize: 12, fontWeight: 'bold', marginTop: 16, marginBottom: 8, borderBottom: '1px solid #f1f5f9', paddingBottom: 6 },
  
  fieldRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid #f8fafc', gap: 10 },
  input: { width: 120, padding: '8px 10px', borderRadius: 8, border: '1px solid #e2e8f0', textAlign: 'right', fontSize: 13, fontWeight: 'bold', background: '#f8fafc' },
  divider: { height: 1, background: '#f1f5f9', margin: '12px 0' },
  infoBox: { background: '#f0fdf4', padding: 12, borderRadius: 8, border: '1px solid #bbf7d0', marginTop: 16, fontSize: 12, color: '#065f46', display: 'flex', alignItems: 'flex-start', gap: 6, flexDirection: 'column' }
};

export default Settings;