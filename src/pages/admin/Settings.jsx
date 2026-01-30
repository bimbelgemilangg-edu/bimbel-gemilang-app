import React, { useState, useEffect } from 'react';
import Sidebar from '../../components/Sidebar';
import { db } from '../../firebase';
import { doc, getDoc, setDoc } from "firebase/firestore";

const Settings = () => {
  // --- STATE ---
  const [loading, setLoading] = useState(true);
  const [isLocked, setIsLocked] = useState(true);
  const [inputPin, setInputPin] = useState("");
  
  // DATA GLOBAL (Tersimpan di Firebase)
  const [ownerPin, setOwnerPin] = useState("2003"); // Default sementara sblm load db
  
  const [prices, setPrices] = useState({
    sd: { paket1: 150000, paket2: 200000, paket3: 250000 },
    smp: { paket1: 200000, paket2: 250000, paket3: 300000 }
  });

  const [salaryRules, setSalaryRules] = useState({
    honorSD: 35000,
    honorSMP: 40000,
    honorSMA: 50000,
    bonusInggris: 10000,
    transport: 10000,
    buatSoal: 50000,
    pengawas: 30000
  });
  
  const [security, setSecurity] = useState({
    currentPin: "", newPin: "", confirmPin: ""
  });

  // --- 1. LOAD DATA DARI FIREBASE (BUKAN LOCAL STORAGE) ---
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const docRef = doc(db, "settings", "global_config");
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data.prices) setPrices(data.prices);
          if (data.salaryRules) setSalaryRules(data.salaryRules);
          if (data.ownerPin) setOwnerPin(data.ownerPin);
        } else {
          // Jika belum ada data (pertama kali), buat default
          await setDoc(docRef, {
            prices,
            salaryRules,
            ownerPin: "2003"
          });
        }
      } catch (error) {
        console.error("Gagal load setting:", error);
        alert("Gagal memuat pengaturan dari server.");
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, []);

  // --- 2. LOGIKA UNLOCK (Cek PIN dari Database) ---
  const handleUnlock = (e) => {
    e.preventDefault();
    if (inputPin === ownerPin) {
      setIsLocked(false);
    } else {
      alert("⛔ PIN Salah!");
      setInputPin("");
    }
  };

  // --- 3. SIMPAN KE FIREBASE ---
  const handleSaveAll = async () => {
    try {
      await setDoc(doc(db, "settings", "global_config"), {
        prices,
        salaryRules,
        ownerPin // Tetap simpan PIN yang lama agar tidak hilang
      });
      alert("✅ Pengaturan Tersimpan di Cloud! Semua Admin otomatis terupdate.");
    } catch (error) {
      console.error(error);
      alert("Gagal menyimpan ke server.");
    }
  };

  // --- 4. GANTI PIN (Update ke Firebase) ---
  const handleChangePin = async () => {
    if (security.currentPin !== ownerPin) return alert("❌ PIN Lama salah!");
    if (security.newPin.length < 4) return alert("❌ PIN Baru min 4 digit.");
    if (security.newPin !== security.confirmPin) return alert("❌ Konfirmasi tidak cocok.");

    try {
      // Simpan PIN baru ke Firebase
      await setDoc(doc(db, "settings", "global_config"), {
        prices,
        salaryRules,
        ownerPin: security.newPin
      });
      
      setOwnerPin(security.newPin); // Update state lokal
      alert("🔐 PIN Berhasil Diganti & Disimpan di Server!");
      setSecurity({ currentPin: "", newPin: "", confirmPin: "" });
    } catch (error) {
      console.error(error);
      alert("Gagal update PIN.");
    }
  };

  if (loading) return <div style={{padding:50, textAlign:'center'}}>Memuat data server...</div>;

  if (isLocked) {
    return (
      <div style={styles.lockScreen}>
        <div style={styles.lockBox}>
          <h2>🔐 Area Owner</h2>
          <p>Masukkan PIN Akses (Cloud Secured)</p>
          <form onSubmit={handleUnlock}>
            <input type="password" value={inputPin} onChange={(e) => setInputPin(e.target.value)} style={styles.inputPin} autoFocus />
            <button type="submit" style={styles.btnUnlock}>BUKA AKSES</button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex' }}>
      <Sidebar />
      <div style={styles.mainContent}>
        <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', borderBottom: '2px solid #ddd', paddingBottom: 10}}>
           <h2 style={{margin:0}}>⚙️ Master Pengaturan (Cloud)</h2>
           <button onClick={handleSaveAll} style={styles.btnSaveBig}>💾 SIMPAN PERUBAHAN KE SERVER</button>
        </div>

        <div style={styles.grid}>
          
          {/* HARGA PAKET SISWA */}
          <div style={styles.card}>
            <h3 style={styles.headerBlue}>📦 Harga SPP Siswa</h3>
            <div style={styles.subSection}>
                <b style={{color:'#333'}}>Jenjang SD</b>
                <input type="number" placeholder="Paket 1" value={prices.sd.paket1} onChange={(e) => setPrices({...prices, sd: {...prices.sd, paket1: e.target.value}})} style={styles.input} />
                <input type="number" placeholder="Paket 2" value={prices.sd.paket2} onChange={(e) => setPrices({...prices, sd: {...prices.sd, paket2: e.target.value}})} style={styles.input} />
            </div>
            <div style={styles.subSection}>
                <b style={{color:'#333'}}>Jenjang SMP</b>
                <input type="number" placeholder="Paket 1" value={prices.smp.paket1} onChange={(e) => setPrices({...prices, smp: {...prices.smp, paket1: e.target.value}})} style={styles.input} />
                <input type="number" placeholder="Paket 2" value={prices.smp.paket2} onChange={(e) => setPrices({...prices, smp: {...prices.smp, paket2: e.target.value}})} style={styles.input} />
            </div>
          </div>

          {/* STANDAR GAJI GURU */}
          <div style={styles.card}>
            <h3 style={styles.headerGreen}>💰 Standar Gaji Guru</h3>
            <p style={{fontSize:11, color:'#666', marginBottom:10}}>*Otomatis terupdate di menu Absensi Guru.</p>
            
            <div style={styles.formGroup}>
              <label>Honor SD (Per Jam)</label>
              <input type="number" value={salaryRules.honorSD} onChange={(e) => setSalaryRules({...salaryRules, honorSD: e.target.value})} style={styles.input} />
            </div>
            <div style={styles.formGroup}>
              <label>Honor SMP (Per Jam)</label>
              <input type="number" value={salaryRules.honorSMP} onChange={(e) => setSalaryRules({...salaryRules, honorSMP: e.target.value})} style={styles.input} />
            </div>
            <div style={styles.formGroup}>
              <label>Bonus Mapel Inggris (Per Jam)</label>
              <input type="number" value={salaryRules.bonusInggris} onChange={(e) => setSalaryRules({...salaryRules, bonusInggris: e.target.value})} style={styles.input} />
            </div>
            <div style={styles.formGroup}>
               <label>Tunjangan Transport (Per Hadir)</label>
               <input type="number" value={salaryRules.transport} onChange={(e) => setSalaryRules({...salaryRules, transport: e.target.value})} style={styles.input} />
            </div>
            <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:10}}>
                <div>
                    <label>Buat Soal</label>
                    <input type="number" value={salaryRules.buatSoal} onChange={(e) => setSalaryRules({...salaryRules, buatSoal: e.target.value})} style={styles.input} />
                </div>
                <div>
                    <label>Pengawas</label>
                    <input type="number" value={salaryRules.pengawas} onChange={(e) => setSalaryRules({...salaryRules, pengawas: e.target.value})} style={styles.input} />
                </div>
            </div>
          </div>

          {/* SECURITY */}
          <div style={styles.cardDanger}>
            <h3 style={{color: '#c0392b', borderBottom: '1px solid #ffcccc', paddingBottom: '10px'}}>🔐 Ganti PIN Owner</h3>
            <input type="password" placeholder="PIN Lama" value={security.currentPin} onChange={(e) => setSecurity({...security, currentPin: e.target.value})} style={styles.input} />
            <input type="password" placeholder="PIN Baru" value={security.newPin} onChange={(e) => setSecurity({...security, newPin: e.target.value})} style={styles.input} />
            <input type="password" placeholder="Konfirmasi PIN" value={security.confirmPin} onChange={(e) => setSecurity({...security, confirmPin: e.target.value})} style={styles.input} />
            <button onClick={handleChangePin} style={styles.btnDanger}>Update PIN</button>
          </div>

        </div>
      </div>
    </div>
  );
};

const styles = {
  mainContent: { marginLeft: '250px', padding: '30px', width: '100%', background: '#f4f7f6', minHeight: '100vh', fontFamily: 'Segoe UI, sans-serif' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px', marginTop: '20px' },
  
  card: { background: 'white', padding: '20px', borderRadius: '10px', boxShadow: '0 2px 5px rgba(0,0,0,0.05)', color: '#333' },
  cardDanger: { background: '#fff5f5', padding: '20px', borderRadius: '10px', border: '1px solid #ffcccc', color: '#333' },
  
  headerBlue: { color: '#2980b9', borderBottom: '1px solid #eee', paddingBottom: '10px', marginTop: 0 },
  headerGreen: { color: '#27ae60', borderBottom: '1px solid #eee', paddingBottom: '10px', marginTop: 0 },
  
  subSection: { marginBottom: 15, paddingBottom: 10, borderBottom: '1px dashed #eee' },
  formGroup: { marginBottom: '10px' },
  
  input: { width: '100%', padding: '10px', borderRadius: '5px', border: '1px solid #ccc', boxSizing: 'border-box', marginTop: '5px', background: '#fff', color: '#000' },
  
  btnSaveBig: { padding: '10px 20px', background: '#2c3e50', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' },
  btnDanger: { width: '100%', padding: '10px', background: '#c0392b', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold', marginTop: 10 },

  lockScreen: { position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: '#2c3e50', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 9999 },
  lockBox: { background: 'white', padding: '40px', borderRadius: '10px', textAlign: 'center', width: '300px' },
  inputPin: { fontSize: '20px', textAlign: 'center', letterSpacing: '5px', padding: '10px', width: '100%', marginBottom: '20px', boxSizing: 'border-box', color: '#000', background: '#fff' },
  btnUnlock: { width: '100%', padding: '15px', background: '#27ae60', color: 'white', border: 'none', borderRadius: '5px', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer' }
};

export default Settings;