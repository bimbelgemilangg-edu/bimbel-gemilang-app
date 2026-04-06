import React, { useState, useEffect } from 'react';
import SidebarAdmin from '../../components/SidebarAdmin'; 
import { db } from '../../firebase';
import { doc, getDoc, setDoc } from "firebase/firestore";
import { Trash2, Plus, Save, Lock, ShieldCheck } from 'lucide-react';

const Settings = () => {
  const [loading, setLoading] = useState(true);
  
  // DATA HARGA SPP (SISWA)
  const [prices, setPrices] = useState({
    sd: { paket1: 150000, paket2: 200000, paket3: 250000 },
    smp: { paket1: 200000, paket2: 250000, paket3: 300000 },
    english: { kids: 150000, junior: 200000, professional: 300000 } 
  });

  // DATA GAJI GURU (STATIS & DINAMIS)
  const [salaryRules, setSalaryRules] = useState({
    honorSD: 35000, 
    honorKelas6: 40000, 
    honorSMP: 40000, 
    honorEnglishKids: 35000,
    honorEnglishJunior: 40000,
    honorEnglishPro: 50000,
    honorKompensasi: 20000, // Tambahan baru untuk kasus siswa tidak datang
    customHonors: [] // Untuk menampung honor tambahan yang bisa dihapus/tambah
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
          // Menggunakan functional update agar tidak menimpa state default jika field belum ada di DB
          if (data.salaryRules) {
            setSalaryRules(prev => ({
              ...prev, 
              ...data.salaryRules,
              customHonors: data.salaryRules.customHonors || []
            }));
          }
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
      alert("✅ Pengaturan Gaji & Harga Berhasil Disimpan!");
    } catch (error) { alert("Gagal menyimpan ke Firebase."); }
  };

  // FUNGSI MANAJEMEN HONOR CUSTOM
  const addCustomHonor = () => {
    const newList = [...salaryRules.customHonors, { id: Date.now(), nama: '', nominal: 0, keterangan: '' }];
    setSalaryRules({ ...salaryRules, customHonors: newList });
  };

  const removeCustomHonor = (id) => {
    const newList = salaryRules.customHonors.filter(item => item.id !== id);
    setSalaryRules({ ...salaryRules, customHonors: newList });
  };

  const updateCustomHonor = (id, field, value) => {
    const newList = salaryRules.customHonors.map(item => 
      item.id === id ? { ...item, [field]: value } : item
    );
    setSalaryRules({ ...salaryRules, customHonors: newList });
  };

  if (isLocked) {
      return (
          <div style={styles.lockOverlay}>
              <div style={styles.lockCard}>
                  <Lock size={40} color="#2c3e50" style={{marginBottom:15}}/>
                  <h2 style={{marginTop:0}}>🔐 Area Owner</h2>
                  <p style={{fontSize:12, color:'#666'}}>Masukkan PIN untuk mengelola kebijakan keuangan</p>
                  <form onSubmit={handleUnlock}>
                      <input type="password" value={inputPin} onChange={e=>setInputPin(e.target.value)} style={styles.pinInput} autoFocus placeholder="****" />
                      <button type="submit" style={styles.btnUnlock}>BUKA AKSES</button>
                  </form>
              </div>
          </div>
      );
  }

  return (
    <div style={{ display: 'flex' }}>
      <SidebarAdmin /> 
      <div style={styles.mainContent}>
        <div style={styles.topHeader}>
           <div>
              <h2 style={{margin:0}}>⚙️ Pengaturan Gaji & Harga</h2>
              <p style={{margin:0, color:'#64748b', fontSize:14}}>Konfigurasi honor pengajar dan biaya SPP siswa.</p>
           </div>
           <button onClick={handleSaveData} style={styles.btnSaveBig}><Save size={18}/> SIMPAN PERUBAHAN</button>
        </div>

        <div style={styles.grid}>
          {/* KOLOM KIRI: GAJI GURU */}
          <div style={styles.card}>
            <h3 style={styles.headerGreen}>💰 Standar Gaji Guru</h3>
            
            <div style={styles.sectionLabel}>Bimbel Reguler</div>
            <div style={styles.formGroup}><label>Honor SD (1-5)</label><input type="number" value={salaryRules.honorSD} onChange={(e) => setSalaryRules({...salaryRules, honorSD: parseInt(e.target.value)})} style={styles.input} /></div>
            <div style={styles.formGroup}><label>Honor SD (Kelas 6)</label><input type="number" value={salaryRules.honorKelas6} onChange={(e) => setSalaryRules({...salaryRules, honorKelas6: parseInt(e.target.value)})} style={styles.input} /></div>
            <div style={styles.formGroup}><label>Honor SMP</label><input type="number" value={salaryRules.honorSMP} onChange={(e) => setSalaryRules({...salaryRules, honorSMP: parseInt(e.target.value)})} style={styles.input} /></div>
            
            <div style={styles.sectionLabel}>🇬🇧 English Course</div>
            <div style={styles.formGroup}><label>Level Kids</label><input type="number" value={salaryRules.honorEnglishKids} onChange={(e) => setSalaryRules({...salaryRules, honorEnglishKids: parseInt(e.target.value)})} style={styles.input} /></div>
            <div style={styles.formGroup}><label>Level Junior</label><input type="number" value={salaryRules.honorEnglishJunior} onChange={(e) => setSalaryRules({...salaryRules, honorEnglishJunior: parseInt(e.target.value)})} style={styles.input} /></div>
            <div style={styles.formGroup}><label>Level Professional</label><input type="number" value={salaryRules.honorEnglishPro} onChange={(e) => setSalaryRules({...salaryRules, honorEnglishPro: parseInt(e.target.value)})} style={styles.input} /></div>
            
            <div style={styles.sectionLabel}>Kebijakan Absensi</div>
            <div style={styles.formGroup}>
                <label>Kompensasi (Siswa Absen)</label>
                <input type="number" value={salaryRules.honorKompensasi} onChange={(e) => setSalaryRules({...salaryRules, honorKompensasi: parseInt(e.target.value)})} style={styles.input} />
            </div>

            {/* DYNAMIC CUSTOM HONORS */}
            <div style={{...styles.sectionLabel, display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                <span>Honor Lainnya / Tugas Tambahan</span>
                <button onClick={addCustomHonor} style={styles.btnAddSmall}><Plus size={14}/> Tambah</button>
            </div>
            
            {salaryRules.customHonors?.map((item) => (
                <div key={item.id} style={styles.customRow}>
                    <input placeholder="Jenis Tugas..." value={item.nama} onChange={(e) => updateCustomHonor(item.id, 'nama', e.target.value)} style={styles.inputFull} />
                    <input type="number" placeholder="Rp" value={item.nominal} onChange={(e) => updateCustomHonor(item.id, 'nominal', parseInt(e.target.value))} style={styles.inputNominal} />
                    <button onClick={() => removeCustomHonor(item.id)} style={styles.btnTrash}><Trash2 size={16}/></button>
                </div>
            ))}
          </div>

          {/* KOLOM KANAN: HARGA SISWA (SPP) */}
          <div style={styles.card}>
            <h3 style={styles.headerBlue}>📚 Harga SPP Siswa (Paket)</h3>
            
            <div style={styles.subSection}><b style={{color:'#1e293b'}}>TINGKAT SD</b>
                <div style={styles.formGroup}><small>Paket 1 (Reguler)</small><input type="number" value={prices.sd.paket1} onChange={(e) => setPrices({...prices, sd: {...prices.sd, paket1: parseInt(e.target.value)}})} style={styles.input} /></div>
                <div style={styles.formGroup}><small>Paket 2 (Intensif)</small><input type="number" value={prices.sd.paket2} onChange={(e) => setPrices({...prices, sd: {...prices.sd, paket2: parseInt(e.target.value)}})} style={styles.input} /></div>
                <div style={styles.formGroup}><small>Paket 3 (Privat)</small><input type="number" value={prices.sd.paket3} onChange={(e) => setPrices({...prices, sd: {...prices.sd, paket3: parseInt(e.target.value)}})} style={styles.input} /></div>
            </div>

            <div style={styles.subSection}><b style={{color:'#1e293b'}}>TINGKAT SMP</b>
                <div style={styles.formGroup}><small>Paket 1</small><input type="number" value={prices.smp.paket1} onChange={(e) => setPrices({...prices, smp: {...prices.smp, paket1: parseInt(e.target.value)}})} style={styles.input} /></div>
                <div style={styles.formGroup}><small>Paket 2</small><input type="number" value={prices.smp.paket2} onChange={(e) => setPrices({...prices, smp: {...prices.smp, paket2: parseInt(e.target.value)}})} style={styles.input} /></div>
                <div style={styles.formGroup}><small>Paket 3</small><input type="number" value={prices.smp.paket3} onChange={(e) => setPrices({...prices, smp: {...prices.smp, paket3: parseInt(e.target.value)}})} style={styles.input} /></div>
            </div>

            <div style={styles.subSection}><b style={{color:'#1e293b'}}>SECURITY SETTINGS</b>
                <div style={styles.formGroup}>
                    <label>PIN Akses Owner</label>
                    <input type="text" value={ownerPin} onChange={(e) => setOwnerPin(e.target.value)} style={styles.input} />
                </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const styles = {
  mainContent: { marginLeft: '250px', padding: '30px', width: 'calc(100% - 250px)', background: '#f8fafc', minHeight: '100vh', fontFamily: 'Inter, sans-serif' },
  topHeader: { display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:30, background:'white', padding:'20px', borderRadius:15, boxShadow:'0 1px 3px rgba(0,0,0,0.1)' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '25px' },
  card: { background: 'white', padding: '25px', borderRadius: '15px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', color: '#1e293b' },
  headerBlue: { color: '#2563eb', borderBottom: '2px solid #eff6ff', paddingBottom: '12px', marginTop: 0, fontSize:18 },
  headerGreen: { color: '#059669', borderBottom: '2px solid #ecfdf5', paddingBottom: '12px', marginTop: 0, fontSize:18 },
  sectionLabel: { background:'#f1f5f9', padding:'8px 12px', borderRadius:8, fontWeight:'bold', marginTop:20, marginBottom:12, fontSize:12, color:'#475569', textTransform:'uppercase', letterSpacing:'0.5px' },
  subSection: { marginBottom: 20, padding:15, background:'#f8fafc', borderRadius:12, border:'1px solid #f1f5f9' },
  formGroup: { marginBottom: '8px', display:'flex', justifyContent:'space-between', alignItems:'center' },
  input: { width: '120px', padding: '8px', borderRadius: '8px', border: '1px solid #e2e8f0', textAlign:'right', fontWeight:'bold', outline:'none' },
  inputFull: { flex: 1, padding: '8px', borderRadius: '8px', border: '1px solid #e2e8f0', marginRight: 10, fontSize:13 },
  inputNominal: { width: '100px', padding: '8px', borderRadius: '8px', border: '1px solid #e2e8f0', textAlign:'right', fontWeight:'bold' },
  customRow: { display:'flex', marginBottom:8, alignItems:'center' },
  btnSaveBig: { display:'flex', alignItems:'center', gap:8, padding: '12px 24px', background: '#1e293b', color: 'white', border: 'none', borderRadius: '12px', cursor: 'pointer', fontWeight: 'bold', transition:'0.2s' },
  btnAddSmall: { background:'#059669', color:'white', border:'none', borderRadius:6, padding:'4px 10px', fontSize:11, cursor:'pointer', display:'flex', alignItems:'center', gap:4 },
  btnTrash: { background:'#fee2e2', color:'#ef4444', border:'none', borderRadius:8, padding:8, marginLeft:8, cursor:'pointer' },
  lockOverlay: { height:'100vh', background:'#0f172a', display:'flex', justifyContent:'center', alignItems:'center' },
  lockCard: { background:'white', padding:40, borderRadius:24, textAlign:'center', width:350, boxShadow:'0 25px 50px -12px rgba(0,0,0,0.5)' },
  pinInput: { padding:15, fontSize:24, textAlign:'center', width:'100%', marginBottom:15, borderRadius:12, border:'2px solid #e2e8f0', letterSpacing:10, fontWeight:'bold' },
  btnUnlock: { width:'100%', padding:15, background:'#2563eb', color:'white', border:'none', borderRadius:12, fontWeight:'bold', cursor:'pointer' }
};

export default Settings;