import React, { useState, useEffect } from 'react';
import Sidebar from '../../components/Sidebar';

const Settings = () => {
  // --- STATE ---
  const [isLocked, setIsLocked] = useState(true);
  const [inputPin, setInputPin] = useState("");
  
  // Data Harga & Security
  const [prices, setPrices] = useState({
    sd: { paket1: 150000, paket2: 200000, paket3: 250000 },
    smp: { paket1: 200000, paket2: 250000, paket3: 300000 }
  });
  
  const [security, setSecurity] = useState({
    currentPin: "",
    newPin: "",
    confirmPin: ""
  });

  // --- 1. LOAD DATA DARI MEMORI (SMART LOGIC) ---
  useEffect(() => {
    // Ambil PIN dari LocalStorage, jika tidak ada pakai default 2003
    const savedPin = localStorage.getItem("ownerPin");
    if (!savedPin) localStorage.setItem("ownerPin", "2003");

    // Ambil Harga
    const savedPrices = localStorage.getItem("pricingData");
    if (savedPrices) setPrices(JSON.parse(savedPrices));
  }, []);

  // --- 2. LOGIKA UNLOCK OWNER ---
  const handleUnlock = (e) => {
    e.preventDefault();
    const realPin = localStorage.getItem("ownerPin") || "2003";
    
    if (inputPin === realPin) {
      setIsLocked(false);
    } else {
      alert("⛔ AKSES DITOLAK: PIN Salah!");
      setInputPin("");
    }
  };

  // --- 3. SIMPAN HARGA PAKET ---
  const handleSavePrices = () => {
    localStorage.setItem("pricingData", JSON.stringify(prices));
    alert("✅ Harga Paket berhasil diperbarui dan tersimpan di sistem.");
  };

  // --- 4. GANTI PIN OWNER (BERPENGARUH KE KEUANGAN) ---
  const handleChangePin = () => {
    const realPin = localStorage.getItem("ownerPin") || "2003";

    if (security.currentPin !== realPin) {
      alert("❌ PIN Lama salah!");
      return;
    }
    if (security.newPin.length < 4) {
      alert("❌ PIN Baru minimal 4 digit.");
      return;
    }
    if (security.newPin !== security.confirmPin) {
      alert("❌ Konfirmasi PIN baru tidak cocok.");
      return;
    }

    // SIMPAN PIN BARU KE SISTEM GLOBAL
    localStorage.setItem("ownerPin", security.newPin);
    
    alert("🔐 PIN Owner Berhasil Diganti!\nKode akses keuangan otomatis berubah.");
    setSecurity({ currentPin: "", newPin: "", confirmPin: "" });
  };

  // --- TAMPILAN LOCK SCREEN ---
  if (isLocked) {
    return (
      <div style={styles.lockScreen}>
        <div style={styles.lockBox}>
          <h2>🔐 Area Terbatas</h2>
          <p>Hanya Owner yang dapat mengakses pengaturan ini.</p>
          <form onSubmit={handleUnlock}>
            <input 
              type="password" 
              placeholder="Masukkan PIN Owner (2003)" 
              value={inputPin}
              onChange={(e) => setInputPin(e.target.value)}
              style={styles.inputPin}
              autoFocus
            />
            <button type="submit" style={styles.btnUnlock}>BUKA AKSES</button>
          </form>
        </div>
      </div>
    );
  }

  // --- TAMPILAN PENGATURAN (SETELAH UNLOCK) ---
  return (
    <div style={{ display: 'flex' }}>
      <Sidebar />
      <div style={styles.mainContent}>
        <h2 style={{ borderBottom: '2px solid #ddd', paddingBottom: '10px' }}>⚙️ Pengaturan Sistem</h2>

        <div style={styles.grid}>
          
          {/* KONFIGURASI HARGA SD */}
          <div style={styles.card}>
            <h3 style={styles.headerSD}>📦 Paket Harga SD</h3>
            <div style={styles.formGroup}>
              <label>Paket 1 (Rp)</label>
              <input type="number" value={prices.sd.paket1} onChange={(e) => setPrices({...prices, sd: {...prices.sd, paket1: e.target.value}})} style={styles.input} />
            </div>
            <div style={styles.formGroup}>
              <label>Paket 2 (Rp)</label>
              <input type="number" value={prices.sd.paket2} onChange={(e) => setPrices({...prices, sd: {...prices.sd, paket2: e.target.value}})} style={styles.input} />
            </div>
            <div style={styles.formGroup}>
              <label>Paket 3 (Rp)</label>
              <input type="number" value={prices.sd.paket3} onChange={(e) => setPrices({...prices, sd: {...prices.sd, paket3: e.target.value}})} style={styles.input} />
            </div>
            <button onClick={handleSavePrices} style={styles.btnSave}>Simpan Harga SD</button>
          </div>

          {/* KONFIGURASI HARGA SMP */}
          <div style={styles.card}>
            <h3 style={styles.headerSMP}>📦 Paket Harga SMP</h3>
            <div style={styles.formGroup}>
              <label>Paket 1 (Rp)</label>
              <input type="number" value={prices.smp.paket1} onChange={(e) => setPrices({...prices, smp: {...prices.smp, paket1: e.target.value}})} style={styles.input} />
            </div>
            <div style={styles.formGroup}>
              <label>Paket 2 (Rp)</label>
              <input type="number" value={prices.smp.paket2} onChange={(e) => setPrices({...prices, smp: {...prices.smp, paket2: e.target.value}})} style={styles.input} />
            </div>
            <div style={styles.formGroup}>
              <label>Paket 3 (Rp)</label>
              <input type="number" value={prices.smp.paket3} onChange={(e) => setPrices({...prices, smp: {...prices.smp, paket3: e.target.value}})} style={styles.input} />
            </div>
            <button onClick={handleSavePrices} style={styles.btnSave}>Simpan Harga SMP</button>
          </div>

          {/* GANTI PIN OWNER */}
          <div style={styles.cardDanger}>
            <h3 style={{color: '#c0392b', borderBottom: '1px solid #ffcccc', paddingBottom: '10px'}}>🔐 Ganti Akses Owner</h3>
            <p style={{fontSize: '12px', color: '#7f8c8d'}}>
              Perhatian: Mengganti PIN ini akan mengubah akses untuk menghapus data keuangan (Mutasi).
            </p>
            <div style={styles.formGroup}>
              <label>PIN Lama</label>
              <input type="password" value={security.currentPin} onChange={(e) => setSecurity({...security, currentPin: e.target.value})} style={styles.input} />
            </div>
            <div style={styles.formGroup}>
              <label>PIN Baru</label>
              <input type="password" value={security.newPin} onChange={(e) => setSecurity({...security, newPin: e.target.value})} style={styles.input} />
            </div>
            <div style={styles.formGroup}>
              <label>Konfirmasi PIN Baru</label>
              <input type="password" value={security.confirmPin} onChange={(e) => setSecurity({...security, confirmPin: e.target.value})} style={styles.input} />
            </div>
            <button onClick={handleChangePin} style={styles.btnDanger}>Update PIN Owner</button>
          </div>

        </div>
      </div>
    </div>
  );
};

// --- STYLING ---
const styles = {
  mainContent: { marginLeft: '250px', padding: '30px', width: '100%', background: '#f4f7f6', minHeight: '100vh', fontFamily: 'sans-serif' },
  grid: { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px', marginTop: '20px' },
  card: { background: 'white', padding: '20px', borderRadius: '10px', boxShadow: '0 2px 5px rgba(0,0,0,0.05)' },
  cardDanger: { background: '#fff5f5', padding: '20px', borderRadius: '10px', border: '1px solid #ffcccc' },
  headerSD: { color: '#2980b9', borderBottom: '1px solid #eee', paddingBottom: '10px' },
  headerSMP: { color: '#8e44ad', borderBottom: '1px solid #eee', paddingBottom: '10px' },
  formGroup: { marginBottom: '15px' },
  input: { width: '100%', padding: '10px', borderRadius: '5px', border: '1px solid #ccc', boxSizing: 'border-box', marginTop: '5px' },
  btnSave: { width: '100%', padding: '10px', background: '#2c3e50', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' },
  btnDanger: { width: '100%', padding: '10px', background: '#c0392b', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' },

  // Lock Screen Styles
  lockScreen: { position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: '#2c3e50', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 9999 },
  lockBox: { background: 'white', padding: '40px', borderRadius: '10px', textAlign: 'center', width: '300px' },
  inputPin: { fontSize: '20px', textAlign: 'center', letterSpacing: '5px', padding: '10px', width: '100%', marginBottom: '20px', boxSizing: 'border-box' },
  btnUnlock: { width: '100%', padding: '15px', background: '#27ae60', color: 'white', border: 'none', borderRadius: '5px', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer' }
};

export default Settings;