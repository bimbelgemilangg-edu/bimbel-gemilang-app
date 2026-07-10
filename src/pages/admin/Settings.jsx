// src/pages/admin/Settings.jsx
import React, { useState, useEffect } from 'react';
import SidebarAdmin from '../../components/SidebarAdmin';
import { db } from '../../firebase';
import { doc, getDoc, setDoc } from "firebase/firestore";
import { Save, Lock, Info, Shield, Eye, EyeOff, Plus, Trash2 } from 'lucide-react';

const Settings = () => {
  const [loading, setLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  // DEFAULT DATA PAKET
  const defaultPrices = {
    sd: {
      packages: [
        { id: 'paket1', name: 'Paket 1 SD', price: 150000 },
        { id: 'paket2', name: 'Paket 2 SD', price: 200000 },
        { id: 'paket3', name: 'Paket 3 SD', price: 250000 },
        { id: 'paket4', name: 'Paket 4 SD', price: 300000 }
      ]
    },
    smp: {
      packages: [
        { id: 'paket1', name: 'Paket 1 SMP', price: 200000 },
        { id: 'paket2', name: 'Paket 2 SMP', price: 250000 },
        { id: 'paket3', name: 'Paket 3 SMP', price: 300000 },
        { id: 'paket4', name: 'Paket 4 SMP', price: 400000 }
      ]
    },
    sma: {
      packages: [
        { id: 'paket1', name: 'Paket 1 SMA', price: 300000 },
        { id: 'paket2', name: 'Paket 2 SMA', price: 350000 },
        { id: 'paket3', name: 'Paket 3 SMA', price: 450000 },
        { id: 'paket4', name: 'Paket 4 SMA', price: 550000 }
      ]
    },
    english: {
      levels: [
        { id: 'kids', name: 'Kids', price: 150000 },
        { id: 'junior', name: 'Junior', price: 200000 },
        { id: 'professional', name: 'Professional', price: 300000 }
      ]
    }
  };

  const [prices, setPrices] = useState(defaultPrices);
  const [salaryRules, setSalaryRules] = useState({
    honorSD: 35000, honorSMP: 40000, honorSMA: 50000,
    bonusInggris: 10000, kompensasiPersen: 50, honorMinimal: 20000,
  });

  const [ownerPin, setOwnerPin] = useState("2003");
  const [isLocked, setIsLocked] = useState(true);
  const [inputPin, setInputPin] = useState("");
  const [showPin, setShowPin] = useState(false);
  const [saving, setSaving] = useState(false);
  const [biayaPendaftaran, setBiayaPendaftaran] = useState(25000);

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
          
          // Merge dengan default untuk memastikan struktur selalu ada
          if (data.prices) {
            setPrices(prev => ({
              sd: { packages: data.prices.sd?.packages || prev.sd.packages },
              smp: { packages: data.prices.smp?.packages || prev.smp.packages },
              sma: { packages: data.prices.sma?.packages || prev.sma.packages },
              english: { levels: data.prices.english?.levels || prev.english.levels }
            }));
          }
          
          if (data.salaryRules) {
            setSalaryRules(prev => ({...prev, ...data.salaryRules}));
          }
          if (data.ownerPin) setOwnerPin(data.ownerPin);
          if (data.biayaPendaftaran) setBiayaPendaftaran(data.biayaPendaftaran);
        } else {
          // Jika dokumen tidak ada, buat dengan default
          await setDoc(doc(db, "settings", "global_config"), {
            prices: defaultPrices,
            salaryRules: salaryRules,
            ownerPin: "2003",
            biayaPendaftaran: 25000
          });
        }
      } catch (error) { 
        console.error("Error loading settings:", error);
        // Gunakan default jika error
        setPrices(defaultPrices);
      }
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
        prices, salaryRules, ownerPin, biayaPendaftaran
      }, { merge: true });
      alert("✅ Pengaturan Berhasil Disimpan!");
    } catch (error) {
      alert("❌ Gagal menyimpan: " + error.message);
    } finally {
      setSaving(false);
    }
  };

  // === FUNGSI MANAJEMEN PAKET ===
  const addPackage = (jenjang) => {
    const currentPackages = prices[jenjang]?.packages || [];
    const newId = `paket${currentPackages.length + 1}`;
    setPrices({
      ...prices,
      [jenjang]: {
        ...prices[jenjang],
        packages: [
          ...currentPackages,
          { id: newId, name: `Paket ${currentPackages.length + 1}`, price: 0 }
        ]
      }
    });
  };

  const removePackage = (jenjang, index) => {
    const currentPackages = prices[jenjang]?.packages || [];
    if (currentPackages.length <= 1) {
      alert("Minimal 1 paket harus ada!");
      return;
    }
    const newPackages = currentPackages.filter((_, i) => i !== index);
    setPrices({
      ...prices,
      [jenjang]: {
        ...prices[jenjang],
        packages: newPackages
      }
    });
  };

  const updatePackage = (jenjang, index, field, value) => {
    const currentPackages = prices[jenjang]?.packages || [];
    const newPackages = [...currentPackages];
    newPackages[index] = { ...newPackages[index], [field]: value };
    setPrices({
      ...prices,
      [jenjang]: {
        ...prices[jenjang],
        packages: newPackages
      }
    });
  };

  const addEnglishLevel = () => {
    const currentLevels = prices.english?.levels || [];
    const newId = `level${currentLevels.length + 1}`;
    setPrices({
      ...prices,
      english: {
        ...prices.english,
        levels: [
          ...currentLevels,
          { id: newId, name: `Level ${currentLevels.length + 1}`, price: 0 }
        ]
      }
    });
  };

  const removeEnglishLevel = (index) => {
    const currentLevels = prices.english?.levels || [];
    if (currentLevels.length <= 1) {
      alert("Minimal 1 level harus ada!");
      return;
    }
    const newLevels = currentLevels.filter((_, i) => i !== index);
    setPrices({
      ...prices,
      english: {
        ...prices.english,
        levels: newLevels
      }
    });
  };

  const updateEnglishLevel = (index, field, value) => {
    const currentLevels = prices.english?.levels || [];
    const newLevels = [...currentLevels];
    newLevels[index] = { ...newLevels[index], [field]: value };
    setPrices({
      ...prices,
      english: {
        ...prices.english,
        levels: newLevels
      }
    });
  };

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
        
        <div style={styles.header(isMobile)}>
          <div>
            <h2 style={styles.pageTitle}>⚙️ Pengaturan Sistem</h2>
            <p style={styles.subtitle}>Kelola harga paket, honor guru, dan PIN keamanan</p>
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
              <span style={{fontSize: 11}}>Reguler: Honor Jenjang × Jam | English: (Honor SD + Bonus) × Jam | 0 Hadir: {salaryRules.kompensasiPersen}% × Honor SD × Jam</span>
            </div>
          </div>

          {/* === HARGA PAKET === */}
          <div style={styles.card}>
            <h3 style={styles.cardTitle}>📚 Harga Paket Belajar</h3>
            <p style={styles.cardDesc}>Tambahkan/kelola paket untuk setiap jenjang. Harga akan otomatis terupdate di halaman pendaftaran.</p>

            {/* Biaya Pendaftaran */}
            <div style={styles.fieldRow}>
              <span>📋 Biaya Pendaftaran</span>
              <input type="number" value={biayaPendaftaran} onChange={e => setBiayaPendaftaran(parseInt(e.target.value) || 0)} style={styles.input} />
            </div>
            <div style={styles.divider} />

            {/* SD */}
            <div style={styles.jenjangSection}>
              <div style={styles.jenjangHeader}>
                <h4 style={styles.subTitle}>🎒 SD</h4>
                <button onClick={() => addPackage('sd')} style={styles.btnAdd}>
                  <Plus size={14} /> Tambah Paket
                </button>
              </div>
              {prices.sd?.packages?.map((pkg, idx) => (
                <div key={pkg.id || idx} style={styles.packageRow}>
                  <input 
                    type="text" 
                    value={pkg.name || ''} 
                    onChange={e => updatePackage('sd', idx, 'name', e.target.value)}
                    style={styles.packageNameInput}
                    placeholder="Nama Paket"
                  />
                  <input 
                    type="number" 
                    value={pkg.price || 0} 
                    onChange={e => updatePackage('sd', idx, 'price', parseInt(e.target.value) || 0)}
                    style={styles.packagePriceInput}
                    placeholder="Harga"
                  />
                  <button onClick={() => removePackage('sd', idx)} style={styles.btnRemove}>
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>

            <div style={styles.divider} />

            {/* SMP */}
            <div style={styles.jenjangSection}>
              <div style={styles.jenjangHeader}>
                <h4 style={styles.subTitle}>🎒 SMP</h4>
                <button onClick={() => addPackage('smp')} style={styles.btnAdd}>
                  <Plus size={14} /> Tambah Paket
                </button>
              </div>
              {prices.smp?.packages?.map((pkg, idx) => (
                <div key={pkg.id || idx} style={styles.packageRow}>
                  <input 
                    type="text" 
                    value={pkg.name || ''} 
                    onChange={e => updatePackage('smp', idx, 'name', e.target.value)}
                    style={styles.packageNameInput}
                    placeholder="Nama Paket"
                  />
                  <input 
                    type="number" 
                    value={pkg.price || 0} 
                    onChange={e => updatePackage('smp', idx, 'price', parseInt(e.target.value) || 0)}
                    style={styles.packagePriceInput}
                    placeholder="Harga"
                  />
                  <button onClick={() => removePackage('smp', idx)} style={styles.btnRemove}>
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>

            <div style={styles.divider} />

            {/* SMA */}
            <div style={styles.jenjangSection}>
              <div style={styles.jenjangHeader}>
                <h4 style={styles.subTitle}>🎒 SMA</h4>
                <button onClick={() => addPackage('sma')} style={styles.btnAdd}>
                  <Plus size={14} /> Tambah Paket
                </button>
              </div>
              {prices.sma?.packages?.map((pkg, idx) => (
                <div key={pkg.id || idx} style={styles.packageRow}>
                  <input 
                    type="text" 
                    value={pkg.name || ''} 
                    onChange={e => updatePackage('sma', idx, 'name', e.target.value)}
                    style={styles.packageNameInput}
                    placeholder="Nama Paket"
                  />
                  <input 
                    type="number" 
                    value={pkg.price || 0} 
                    onChange={e => updatePackage('sma', idx, 'price', parseInt(e.target.value) || 0)}
                    style={styles.packagePriceInput}
                    placeholder="Harga"
                  />
                  <button onClick={() => removePackage('sma', idx)} style={styles.btnRemove}>
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>

            <div style={styles.divider} />

            {/* English */}
            <div style={styles.jenjangSection}>
              <div style={styles.jenjangHeader}>
                <h4 style={styles.subTitle}>🗣️ English Course</h4>
                <button onClick={addEnglishLevel} style={styles.btnAdd}>
                  <Plus size={14} /> Tambah Level
                </button>
              </div>
              {prices.english?.levels?.map((lvl, idx) => (
                <div key={lvl.id || idx} style={styles.packageRow}>
                  <input 
                    type="text" 
                    value={lvl.name || ''} 
                    onChange={e => updateEnglishLevel(idx, 'name', e.target.value)}
                    style={styles.packageNameInput}
                    placeholder="Nama Level"
                  />
                  <input 
                    type="number" 
                    value={lvl.price || 0} 
                    onChange={e => updateEnglishLevel(idx, 'price', parseInt(e.target.value) || 0)}
                    style={styles.packagePriceInput}
                    placeholder="Harga"
                  />
                  <button onClick={() => removeEnglishLevel(idx)} style={styles.btnRemove}>
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>

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

  grid: (m) => ({ display: 'grid', gridTemplateColumns: m ? '1fr' : 'repeat(auto-fit, minmax(450px, 1fr))', gap: 20 }),
  
  card: { background: 'white', padding: 24, borderRadius: 14, boxShadow: '0 2px 8px rgba(0,0,0,0.04)', border: '1px solid #f1f5f9' },
  cardTitle: { margin: '0 0 4px', fontSize: 16, fontWeight: 'bold', color: '#1e293b' },
  cardDesc: { color: '#94a3b8', fontSize: 11, marginBottom: 16 },
  
  jenjangSection: { marginBottom: 12 },
  jenjangHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  subTitle: { color: '#64748b', fontSize: 12, fontWeight: 'bold', margin: 0, borderBottom: 'none', paddingBottom: 0 },
  
  btnAdd: { display: 'flex', alignItems: 'center', gap: 4, padding: '4px 12px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 11, fontWeight: 'bold' },
  btnRemove: { padding: '4px 8px', background: '#fee2e2', color: '#dc2626', border: 'none', borderRadius: 6, cursor: 'pointer' },
  
  packageRow: { display: 'flex', gap: 6, alignItems: 'center', marginBottom: 6 },
  packageNameInput: { flex: 2, padding: '6px 10px', borderRadius: 6, border: '1px solid #e2e8f0', fontSize: 12, background: '#f8fafc' },
  packagePriceInput: { flex: 1, padding: '6px 10px', borderRadius: 6, border: '1px solid #e2e8f0', fontSize: 12, textAlign: 'right', background: '#f8fafc' },
  
  fieldRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid #f8fafc', gap: 10 },
  input: { width: 120, padding: '8px 10px', borderRadius: 8, border: '1px solid #e2e8f0', textAlign: 'right', fontSize: 13, fontWeight: 'bold', background: '#f8fafc' },
  divider: { height: 1, background: '#f1f5f9', margin: '12px 0' },
  infoBox: { background: '#f0fdf4', padding: 12, borderRadius: 8, border: '1px solid #bbf7d0', marginTop: 16, fontSize: 12, color: '#065f46', display: 'flex', alignItems: 'flex-start', gap: 6, flexDirection: 'column' }
};

export default Settings;