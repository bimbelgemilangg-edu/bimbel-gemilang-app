import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../../../components/Sidebar';
import { db } from '../../../firebase';
import { collection, addDoc } from "firebase/firestore";

const AddStudent = () => {
  const navigate = useNavigate();

  // Load Harga dari Lokal (Setting Owner)
  const [pricing, setPricing] = useState({
    sd: { paket1: 150000, paket2: 200000, paket3: 250000 },
    smp: { paket1: 200000, paket2: 250000, paket3: 300000 }
  });

  useEffect(() => {
    const savedPrices = localStorage.getItem("pricingData");
    if (savedPrices) setPricing(JSON.parse(savedPrices));
  }, []);

  // STATE FORM
  const [tanggalDaftar, setTanggalDaftar] = useState(new Date().toISOString().split('T')[0]); // Default Hari Ini
  const [siswa, setSiswa] = useState({ nama: "", jenjang: "SD", kelas: "4 SD" });
  const [ortu, setOrtu] = useState({ ayah: "", ibu: "", jobAyah: "", jobIbu: "", alamat: "", hp: "" });
  
  // STATE KEUANGAN
  const [paket, setPaket] = useState("paket1");
  const [biayaDaftar, setBiayaDaftar] = useState(false);
  const [diskon, setDiskon] = useState(0);
  const [metodeBayar, setMetodeBayar] = useState("Tunai"); 
  const [tenor, setTenor] = useState(1);

  // HITUNG-HITUNGAN
  const getBasePrice = () => {
    const level = siswa.jenjang.toLowerCase();
    return pricing[level] ? parseInt(pricing[level][paket]) : 0;
  };

  const hitungTotal = () => {
    let total = getBasePrice();
    if (biayaDaftar) total += 25000;
    total = total - parseInt(diskon || 0);
    return total;
  };

  const hitungCicilan = () => {
    return Math.ceil(hitungTotal() / tenor);
  };

  // SUBMIT
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!siswa.nama || !ortu.hp) return alert("Data tidak lengkap!");

    try {
      // 1. SIMPAN DATA SISWA
      const studentRef = await addDoc(collection(db, "students"), {
        nama: siswa.nama,
        jenjang: siswa.jenjang,
        kelas: siswa.kelas,
        ortu: ortu,
        status: "Aktif",
        tanggalMasuk: tanggalDaftar
      });

      const totalBiaya = hitungTotal();
      const studentId = studentRef.id;

      // 2. LOGIKA KEUANGAN (SMART LOGIC)
      if (metodeBayar === "Cicilan") {
        // --- CICILAN: Masuk ke Tagihan, BUKAN Laporan Pemasukan ---
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
          studentId,
          namaSiswa: siswa.nama,
          namaOrtu: ortu.ayah || ortu.ibu,
          noHp: ortu.hp,
          totalTagihan: totalBiaya,
          sisaTagihan: totalBiaya,
          detailCicilan: installments,
          jenis: "SPP & Pendaftaran"
        });

        alert("✅ Siswa Terdaftar (Cicilan).\nSilakan cek menu Tagihan di Keuangan.");

      } else {
        // --- LUNAS: Langsung Masuk Laporan Pemasukan ---
        await addDoc(collection(db, "finance_transaksi"), {
          tanggal: tanggalDaftar, // Sesuai tanggal yang dipilih admin
          ket: `Pendaftaran Baru: ${siswa.nama}`,
          tipe: "Masuk",
          metode: metodeBayar, // Tunai atau Bank
          nominal: totalBiaya,
          kategori: "Pendaftaran",
          studentId
        });

        alert(`✅ Siswa Terdaftar & Lunas!\nUang masuk ke saldo ${metodeBayar}.`);
      }

      navigate('/admin/students');

    } catch (error) {
      console.error("Error:", error);
      alert("Gagal menyimpan.");
    }
  };

  return (
    <div style={{ display: 'flex' }}>
      <Sidebar />
      <div style={styles.content}>
        <h2>🎓 Pendaftaran Siswa Baru</h2>

        <form onSubmit={handleSubmit} style={styles.formGrid}>
          <div style={styles.leftCol}>
            
            {/* TANGGAL DAFTAR (PENTING UNTUK LAPORAN) */}
            <div style={styles.card}>
              <label style={{display:'block', marginBottom:5, fontWeight:'bold'}}>Tanggal Pendaftaran</label>
              <input 
                type="date" 
                style={styles.inputDate} 
                value={tanggalDaftar}
                onChange={e => setTanggalDaftar(e.target.value)}
              />
              <small style={{color:'#777'}}>*Bisa diganti jika input data mundur.</small>
            </div>

            <div style={styles.card}>
              <h3>👤 Identitas Siswa</h3>
              <div style={styles.group}><label>Nama Lengkap</label><input style={styles.input} value={siswa.nama} onChange={e => setSiswa({...siswa, nama: e.target.value})} required /></div>
              <div style={{display:'flex', gap:10}}>
                <select style={styles.select} value={siswa.jenjang} onChange={e => setSiswa({...siswa, jenjang: e.target.value})}><option value="SD">SD</option><option value="SMP">SMP</option></select>
                <select style={styles.select} value={siswa.kelas} onChange={e => setSiswa({...siswa, kelas: e.target.value})}><option>4 SD</option><option>5 SD</option><option>6 SD</option><option>9 SMP</option></select>
              </div>
            </div>

            <div style={styles.card}>
              <h3>👨‍👩‍👧 Data Orang Tua</h3>
              <input style={styles.input} placeholder="Nama Ayah/Ibu" value={ortu.ayah} onChange={e => setOrtu({...ortu, ayah: e.target.value})} />
              <input style={styles.input} placeholder="No HP / WA" type="number" value={ortu.hp} onChange={e => setOrtu({...ortu, hp: e.target.value})} style={{...styles.input, marginTop:10}} required />
            </div>
          </div>

          <div style={styles.rightCol}>
            <div style={styles.cardBlue}>
              <h3 style={{color:'white', marginTop:0}}>💰 Pembayaran</h3>
              
              <div style={styles.group}>
                <label style={{color:'white'}}>Paket Bimbel</label>
                <select style={styles.select} value={paket} onChange={e => setPaket(e.target.value)}>
                  <option value="paket1">Paket 1 - Rp {getBasePrice().toLocaleString()}</option>
                  <option value="paket2">Paket 2 - Medium</option>
                  <option value="paket3">Paket 3 - Premium</option>
                </select>
              </div>

              <div style={{color:'white', marginBottom:10}}>
                <label><input type="checkbox" checked={biayaDaftar} onChange={e => setBiayaDaftar(e.target.checked)} /> Biaya Daftar (+25rb)</label>
              </div>

              <div style={styles.group}>
                <label style={{color:'white'}}>Diskon (Rp)</label>
                <input type="number" style={styles.input} value={diskon} onChange={e => setDiskon(e.target.value)} />
              </div>

              <h1 style={{color:'white', textAlign:'right'}}>Rp {hitungTotal().toLocaleString()}</h1>

              <div style={styles.group}>
                <label style={{color:'white'}}>Metode Bayar</label>
                <select style={styles.select} value={metodeBayar} onChange={e => setMetodeBayar(e.target.value)}>
                  <option value="Tunai">Lunas - Tunai (Masuk Brankas)</option>
                  <option value="Bank">Lunas - Transfer Bank</option>
                  <option value="Cicilan">Cicilan (Belum Masuk Kas)</option>
                </select>
              </div>

              {metodeBayar === "Cicilan" && (
                <div style={{background:'rgba(0,0,0,0.2)', padding:10, borderRadius:5, color:'white'}}>
                  <label>Tenor: </label>
                  <button type="button" onClick={() => setTenor(1)} style={{marginRight:5}}>1x</button>
                  <button type="button" onClick={() => setTenor(2)} style={{marginRight:5}}>2x</button>
                  <button type="button" onClick={() => setTenor(3)}>3x</button>
                  <p>Cicilan: Rp {hitungCicilan().toLocaleString()} /bln</p>
                </div>
              )}

              <button type="submit" style={styles.btnSubmit}>SIMPAN DATA</button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

const styles = {
  content: { marginLeft: '250px', padding: '30px', width: '100%', background: '#f4f7f6', minHeight: '100vh', fontFamily:'sans-serif' },
  formGrid: { display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '20px' },
  card: { background: 'white', padding: '20px', borderRadius: '10px', marginBottom: '20px', boxShadow:'0 2px 4px rgba(0,0,0,0.05)' },
  cardBlue: { background: '#2c3e50', padding: '20px', borderRadius: '10px' },
  group: { marginBottom: 15 },
  input: { width: '100%', padding: 10, borderRadius: 5, border:'1px solid #ccc', boxSizing:'border-box' },
  inputDate: { width: '100%', padding: 10, borderRadius: 5, border:'2px solid #3498db', boxSizing:'border-box', fontWeight:'bold' },
  select: { width: '100%', padding: 10, borderRadius: 5, border:'1px solid #ccc', background:'white', boxSizing:'border-box' },
  btnSubmit: { width: '100%', padding: 15, background: '#27ae60', color: 'white', border:'none', borderRadius: 5, fontWeight:'bold', cursor:'pointer', marginTop: 20 }
};

export default AddStudent;