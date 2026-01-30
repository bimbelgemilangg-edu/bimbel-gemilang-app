import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../../../components/Sidebar';
// FIREBASE
import { db } from '../../../firebase';
import { collection, addDoc } from "firebase/firestore";

const AddStudent = () => {
  const navigate = useNavigate();

  // --- 1. LOAD HARGA DARI SETTING OWNER (SMART LOGIC) ---
  const [pricing, setPricing] = useState({
    sd: { paket1: 150000, paket2: 200000, paket3: 250000 },
    smp: { paket1: 200000, paket2: 250000, paket3: 300000 }
  });

  useEffect(() => {
    const savedPrices = localStorage.getItem("pricingData");
    if (savedPrices) setPricing(JSON.parse(savedPrices));
  }, []);

  // --- 2. STATE FORM DATA ---
  const [siswa, setSiswa] = useState({ nama: "", jenjang: "SD", kelas: "4 SD" });
  const [ortu, setOrtu] = useState({ ayah: "", ibu: "", jobAyah: "", jobIbu: "", alamat: "", hp: "" });
  
  // State Keuangan
  const [paket, setPaket] = useState("paket1"); // paket1, paket2, paket3
  const [biayaDaftar, setBiayaDaftar] = useState(false); // Checkbox 25rb
  const [diskon, setDiskon] = useState(0);
  const [metodeBayar, setMetodeBayar] = useState("Tunai"); // Tunai, Bank, Cicilan
  const [tenor, setTenor] = useState(1); // 1, 2, 3 bulan (jika cicilan)

  // --- 3. KALKULATOR OTOMATIS ---
  const getBasePrice = () => {
    const level = siswa.jenjang.toLowerCase(); // sd atau smp
    return pricing[level] ? parseInt(pricing[level][paket]) : 0;
  };

  const hitungTotal = () => {
    let total = getBasePrice();
    if (biayaDaftar) total += 25000;
    total = total - parseInt(diskon || 0);
    return total;
  };

  const hitungCicilan = () => {
    const total = hitungTotal();
    return Math.ceil(total / tenor);
  };

  // --- 4. LOGIKA SIMPAN KE FIREBASE (CORE) ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!siswa.nama || !ortu.hp) return alert("Nama Siswa dan No HP Wajib diisi!");

    const totalBiaya = hitungTotal();
    const tanggalDaftar = new Date().toISOString().split('T')[0];

    try {
      // A. SIMPAN DATA SISWA (Collection: students)
      const studentRef = await addDoc(collection(db, "students"), {
        nama: siswa.nama,
        jenjang: siswa.jenjang,
        kelas: siswa.kelas,
        ortu: ortu,
        status: "Aktif",
        tanggalMasuk: tanggalDaftar
      });

      const studentId = studentRef.id;

      // B. LOGIKA KEUANGAN PINTAR
      if (metodeBayar === "Cicilan") {
        // --- SKENARIO CICILAN ---
        // Masuk ke 'finance_tagihan' (Hutang), BUKAN 'finance_transaksi' (Pemasukan)
        
        // Buat Array Jadwal Cicilan
        let installments = [];
        const perBulan = hitungCicilan();
        
        for (let i = 1; i <= tenor; i++) {
          installments.push({
            bulanKe: i,
            nominal: perBulan,
            status: "Belum Lunas",
            jatuhTempo: `Bulan ke-${i}` 
          });
        }

        await addDoc(collection(db, "finance_tagihan"), {
          studentId: studentId,
          namaSiswa: siswa.nama,
          namaOrtu: ortu.ayah || ortu.ibu,
          noHp: ortu.hp,
          totalTagihan: totalBiaya,
          sisaTagihan: totalBiaya,
          detailCicilan: installments, // Array jadwal bayar
          jenis: "SPP & Pendaftaran (Cicilan)"
        });

        alert(`✅ Siswa Terdaftar dengan CICILAN ${tenor}x!\nTagihan telah dibuat di menu Keuangan.`);

      } else {
        // --- SKENARIO LUNAS (Tunai/Bank) ---
        // Langsung catat sebagai PEMASUKAN UANG
        await addDoc(collection(db, "finance_transaksi"), {
          tanggal: tanggalDaftar,
          ket: `Pendaftaran Baru: ${siswa.nama}`,
          tipe: "Masuk", // Income
          metode: metodeBayar,
          nominal: totalBiaya,
          studentId: studentId
        });

        alert("✅ Siswa Terdaftar & Pembayaran LUNAS tercatat!");
      }

      navigate('/admin/students');

    } catch (error) {
      console.error("Error:", error);
      alert("Gagal menyimpan data. Cek koneksi.");
    }
  };

  return (
    <div style={{ display: 'flex' }}>
      <Sidebar />
      <div style={styles.content}>
        <h2 style={{ borderBottom: '2px solid #ddd', paddingBottom: '10px' }}>🎓 Pendaftaran Siswa Baru</h2>

        <form onSubmit={handleSubmit} style={styles.formGrid}>
          
          {/* KOLOM KIRI: DATA DIRI & ORTU */}
          <div style={styles.leftCol}>
            
            {/* 1. IDENTITAS SISWA */}
            <div style={styles.card}>
              <h3 style={styles.cardTitle}>👤 Identitas Siswa</h3>
              <div style={styles.formGroup}>
                <label>Nama Lengkap</label>
                <input style={styles.input} value={siswa.nama} onChange={e => setSiswa({...siswa, nama: e.target.value})} required />
              </div>
              <div style={styles.row}>
                <div style={{flex:1}}>
                  <label>Jenjang</label>
                  <select style={styles.select} value={siswa.jenjang} onChange={e => setSiswa({...siswa, jenjang: e.target.value})}>
                    <option value="SD">SD</option>
                    <option value="SMP">SMP</option>
                  </select>
                </div>
                <div style={{flex:1}}>
                  <label>Kelas</label>
                  <select style={styles.select} value={siswa.kelas} onChange={e => setSiswa({...siswa, kelas: e.target.value})}>
                    <option>1 SD</option><option>2 SD</option><option>3 SD</option>
                    <option>4 SD</option><option>5 SD</option><option>6 SD</option>
                    <option>7 SMP</option><option>8 SMP</option><option>9 SMP</option>
                  </select>
                </div>
              </div>
            </div>

            {/* 2. DATA ORANG TUA */}
            <div style={styles.card}>
              <h3 style={styles.cardTitle}>👨‍👩‍👧 Data Orang Tua / Wali</h3>
              <div style={styles.row}>
                <input style={styles.input} placeholder="Nama Ayah" value={ortu.ayah} onChange={e => setOrtu({...ortu, ayah: e.target.value})} />
                <input style={styles.input} placeholder="Pekerjaan Ayah" value={ortu.jobAyah} onChange={e => setOrtu({...ortu, jobAyah: e.target.value})} />
              </div>
              <div style={styles.row}>
                <input style={styles.input} placeholder="Nama Ibu" value={ortu.ibu} onChange={e => setOrtu({...ortu, ibu: e.target.value})} />
                <input style={styles.input} placeholder="Pekerjaan Ibu" value={ortu.jobIbu} onChange={e => setOrtu({...ortu, jobIbu: e.target.value})} />
              </div>
              <div style={styles.formGroup}>
                <label>Alamat Lengkap</label>
                <textarea style={styles.textarea} value={ortu.alamat} onChange={e => setOrtu({...ortu, alamat: e.target.value})}></textarea>
              </div>
              <div style={styles.formGroup}>
                <label>No. HP / WhatsApp (Wajib)</label>
                <input style={styles.input} type="number" placeholder="08..." value={ortu.hp} onChange={e => setOrtu({...ortu, hp: e.target.value})} required />
              </div>
            </div>
          </div>

          {/* KOLOM KANAN: KEUANGAN & PEMBAYARAN */}
          <div style={styles.rightCol}>
            <div style={styles.cardBlue}>
              <h3 style={{...styles.cardTitle, color:'white'}}>💰 Administrasi & Pembayaran</h3>
              
              {/* PILIH PAKET */}
              <div style={styles.formGroup}>
                <label style={{color:'white'}}>Pilih Paket (Sesuai Setting Owner)</label>
                <select style={styles.select} value={paket} onChange={e => setPaket(e.target.value)}>
                  <option value="paket1">Paket 1 - Rp {getBasePrice().toLocaleString()}</option>
                  <option value="paket2">Paket 2 (Medium)</option>
                  <option value="paket3">Paket 3 (Premium)</option>
                </select>
              </div>

              {/* BIAYA TAMBAHAN */}
              <div style={{background:'rgba(255,255,255,0.1)', padding:'10px', borderRadius:'5px', marginBottom:'10px'}}>
                <label style={{display:'flex', alignItems:'center', cursor:'pointer', color:'white'}}>
                  <input type="checkbox" checked={biayaDaftar} onChange={e => setBiayaDaftar(e.target.checked)} style={{transform:'scale(1.5)', marginRight:'10px'}} />
                  Tambah Biaya Pendaftaran (+ Rp 25.000)
                </label>
              </div>

              {/* DISKON */}
              <div style={styles.formGroup}>
                <label style={{color:'white'}}>Diskon / Potongan (Rp)</label>
                <input type="number" style={styles.input} placeholder="0" value={diskon} onChange={e => setDiskon(e.target.value)} />
              </div>

              <hr style={{opacity:0.3}} />

              {/* TOTAL & METODE */}
              <div style={{textAlign:'right', color:'white', marginBottom:'20px'}}>
                <small>Total Yang Harus Dibayar:</small>
                <h1 style={{margin:'5px 0'}}>Rp {hitungTotal().toLocaleString()}</h1>
              </div>

              <div style={styles.formGroup}>
                <label style={{color:'white'}}>Metode Pembayaran</label>
                <select style={styles.select} value={metodeBayar} onChange={e => setMetodeBayar(e.target.value)}>
                  <option value="Tunai">Lunas - Tunai (Cash)</option>
                  <option value="Bank">Lunas - Transfer Bank</option>
                  <option value="Cicilan">Cicilan (Hutang)</option>
                </select>
              </div>

              {/* KHUSUS CICILAN */}
              {metodeBayar === "Cicilan" && (
                <div style={{background:'#fff3cd', padding:'15px', borderRadius:'5px', color:'#856404'}}>
                  <label><b>Tenor Cicilan:</b></label>
                  <div style={{display:'flex', gap:'10px', marginTop:'5px'}}>
                    <button type="button" onClick={() => setTenor(1)} style={tenor===1 ? styles.btnTenorActive : styles.btnTenor}>1x</button>
                    <button type="button" onClick={() => setTenor(2)} style={tenor===2 ? styles.btnTenorActive : styles.btnTenor}>2x</button>
                    <button type="button" onClick={() => setTenor(3)} style={tenor===3 ? styles.btnTenorActive : styles.btnTenor}>3x</button>
                  </div>
                  <p style={{marginTop:'10px', fontSize:'14px'}}>
                    Estimasi per bulan: <b>Rp {hitungCicilan().toLocaleString()}</b>
                  </p>
                  <small style={{display:'block', marginTop:'5px', fontStyle:'italic'}}>*Otomatis tercatat di menu Keuangan sebagai tagihan.</small>
                </div>
              )}

              <button type="submit" style={styles.btnSubmit}>
                💾 SIMPAN & PROSES
              </button>

            </div>
          </div>

        </form>
      </div>
    </div>
  );
};

const styles = {
  content: { marginLeft: '250px', padding: '30px', width: '100%', background: '#f4f7f6', minHeight: '100vh', fontFamily: 'sans-serif' },
  formGrid: { display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '20px' },
  
  card: { background: 'white', padding: '20px', borderRadius: '10px', boxShadow: '0 2px 5px rgba(0,0,0,0.05)', marginBottom: '20px' },
  cardBlue: { background: '#2c3e50', padding: '25px', borderRadius: '10px', boxShadow: '0 5px 15px rgba(0,0,0,0.1)' },
  
  cardTitle: { marginTop: 0, borderBottom: '1px solid #eee', paddingBottom: '10px', marginBottom: '15px' },
  
  formGroup: { marginBottom: '15px' },
  row: { display: 'flex', gap: '15px', marginBottom: '15px' },
  input: { width: '100%', padding: '10px', borderRadius: '5px', border: '1px solid #ccc', boxSizing: 'border-box' },
  select: { width: '100%', padding: '10px', borderRadius: '5px', border: '1px solid #ccc', background: 'white', boxSizing: 'border-box' },
  textarea: { width: '100%', padding: '10px', borderRadius: '5px', border: '1px solid #ccc', minHeight: '80px', boxSizing: 'border-box' },
  
  btnTenor: { flex: 1, padding: '8px', border: '1px solid #856404', background: 'none', cursor: 'pointer', borderRadius: '4px' },
  btnTenorActive: { flex: 1, padding: '8px', border: 'none', background: '#856404', color: 'white', cursor: 'pointer', borderRadius: '4px', fontWeight: 'bold' },
  
  btnSubmit: { width: '100%', padding: '15px', background: '#27ae60', color: 'white', border: 'none', borderRadius: '5px', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer', marginTop: '20px' }
};

export default AddStudent;