import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../../../components/Sidebar';
import { db } from '../../../firebase';
import { collection, addDoc } from "firebase/firestore";

const AddStudent = () => {
  const navigate = useNavigate();

  // 1. LOAD HARGA (Dari Setting Owner)
  const [pricing, setPricing] = useState({
    sd: { paket1: 150000, paket2: 200000, paket3: 250000 },
    smp: { paket1: 200000, paket2: 250000, paket3: 300000 }
  });

  useEffect(() => {
    const savedPrices = localStorage.getItem("pricingData");
    if (savedPrices) setPricing(JSON.parse(savedPrices));
  }, []);

  // 2. STATE FORM LENGKAP
  const [tanggalDaftar, setTanggalDaftar] = useState(new Date().toISOString().split('T')[0]);
  
  // Data Siswa
  const [namaSiswa, setNamaSiswa] = useState("");
  const [jenjang, setJenjang] = useState("SD");
  const [kelas, setKelas] = useState("4 SD");
  const [tempatLahir, setTempatLahir] = useState("");
  const [tanggalLahir, setTanggalLahir] = useState("");

  // Data Orang Tua
  const [namaAyah, setNamaAyah] = useState("");
  const [pekerjaanAyah, setPekerjaanAyah] = useState("");
  const [namaIbu, setNamaIbu] = useState("");
  const [pekerjaanIbu, setPekerjaanIbu] = useState("");
  const [alamat, setAlamat] = useState("");
  const [noHp, setNoHp] = useState("");

  // Keuangan
  const [paket, setPaket] = useState("paket1");
  const [biayaDaftar, setBiayaDaftar] = useState(false); // +25.000
  const [diskon, setDiskon] = useState(0);
  const [metodeBayar, setMetodeBayar] = useState("Tunai"); 
  const [tenor, setTenor] = useState(1);
  
  // BARU: State untuk Tanggal Mulai Cicilan
  const [tanggalMulaiCicilan, setTanggalMulaiCicilan] = useState(new Date().toISOString().split('T')[0]);

  // 3. KALKULASI
  const getBasePrice = () => {
    const level = jenjang.toLowerCase();
    return pricing[level] ? parseInt(pricing[level][paket]) : 0;
  };

  const hitungTotal = () => {
    let total = getBasePrice();
    if (biayaDaftar) total += 25000;
    total = total - parseInt(diskon || 0);
    return total;
  };

  const hitungCicilan = () => Math.ceil(hitungTotal() / tenor);

  // 4. SUBMIT DATA
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!namaSiswa || !namaAyah || !noHp) return alert("Data Wajib (Nama, Ayah, HP) harus diisi!");

    try {
      // A. SIMPAN DATA SISWA LENGKAP
      const studentData = {
        nama: namaSiswa,
        jenjang, kelas,
        tempatLahir, tanggalLahir,
        ortu: {
          ayah: namaAyah, pekerjaanAyah,
          ibu: namaIbu, pekerjaanIbu,
          alamat, hp: noHp
        },
        status: "Aktif",
        tanggalMasuk: tanggalDaftar
      };

      const docRef = await addDoc(collection(db, "students"), studentData);
      const studentId = docRef.id;
      const totalBayar = hitungTotal();

      // B. LOGIKA KEUANGAN (MUTASI vs TAGIHAN)
      if (metodeBayar === "Cicilan") {
        // Masuk ke TAGIHAN
        let installments = [];
        const perBulan = hitungCicilan();
        
        // Logic Hitung Tanggal Otomatis (Bulan 1, Bulan 2, dst)
        const startDate = new Date(tanggalMulaiCicilan);

        for (let i = 0; i < tenor; i++) {
          // Clone tanggal agar tidak merubah referensi asli
          let dueDate = new Date(startDate);
          // Tambah bulan sesuai urutan loop (0 = bulan ini, 1 = bulan depan)
          dueDate.setMonth(startDate.getMonth() + i);

          installments.push({
            bulanKe: i + 1,
            nominal: perBulan,
            status: "Belum Lunas",
            // Simpan format YYYY-MM-DD agar bisa diedit nanti
            jatuhTempo: dueDate.toISOString().split('T')[0] 
          });
        }

        await addDoc(collection(db, "finance_tagihan"), {
          studentId, namaSiswa, namaOrtu: namaAyah, noHp,
          totalTagihan: totalBayar,
          sisaTagihan: totalBayar,
          detailCicilan: installments,
          jenis: "Pendaftaran (Cicilan)"
        });
        alert("✅ Siswa Terdaftar (Jadwal Cicilan Dibuat)");

      } else {
        // Masuk ke MUTASI (LUNAS)
        await addDoc(collection(db, "finance_mutasi"), { 
          tanggal: tanggalDaftar,
          ket: `Pendaftaran Baru: ${namaSiswa}`,
          tipe: "Masuk", 
          metode: metodeBayar, 
          nominal: totalBayar,
          kategori: "Pendaftaran",
          studentId
        });
        alert(`✅ Siswa Terdaftar & Lunas!`);
      }

      navigate('/admin/students');

    } catch (error) {
      console.error("Error:", error);
      alert("Gagal menyimpan data.");
    }
  };

  return (
    <div style={{ display: 'flex' }}>
      <Sidebar />
      <div style={styles.content}>
        <h2>🎓 Formulir Pendaftaran Lengkap</h2>
        <form onSubmit={handleSubmit} style={styles.grid}>
          
          {/* KOLOM KIRI: DATA PERSONAL */}
          <div style={styles.leftCol}>
            
            {/* IDENTITAS */}
            <div style={styles.card}>
              <h3>👤 Identitas Siswa</h3>
              <div style={styles.formGroup}>
                <label>Tanggal Daftar</label>
                <input type="date" style={styles.inputDate} value={tanggalDaftar} onChange={e => setTanggalDaftar(e.target.value)} />
              </div>
              <div style={styles.formGroup}><input style={styles.input} placeholder="Nama Lengkap Siswa" value={namaSiswa} onChange={e => setNamaSiswa(e.target.value)} required /></div>
              <div style={styles.row}>
                <input style={styles.input} placeholder="Tempat Lahir" value={tempatLahir} onChange={e => setTempatLahir(e.target.value)} />
                <input type="date" style={styles.input} value={tanggalLahir} onChange={e => setTanggalLahir(e.target.value)} />
              </div>
              <div style={styles.row}>
                <select style={styles.select} value={jenjang} onChange={e => setJenjang(e.target.value)}><option>SD</option><option>SMP</option></select>
                <select style={styles.select} value={kelas} onChange={e => setKelas(e.target.value)}><option>4 SD</option><option>5 SD</option><option>6 SD</option><option>9 SMP</option></select>
              </div>
            </div>

            {/* ORANG TUA (FULL) */}
            <div style={styles.card}>
              <h3>👨‍👩‍👧 Data Orang Tua</h3>
              <div style={styles.row}>
                <input style={styles.input} placeholder="Nama Ayah" value={namaAyah} onChange={e => setNamaAyah(e.target.value)} required />
                <input style={styles.input} placeholder="Pekerjaan Ayah" value={pekerjaanAyah} onChange={e => setPekerjaanAyah(e.target.value)} />
              </div>
              <div style={styles.row}>
                <input style={styles.input} placeholder="Nama Ibu" value={namaIbu} onChange={e => setNamaIbu(e.target.value)} />
                <input style={styles.input} placeholder="Pekerjaan Ibu" value={pekerjaanIbu} onChange={e => setPekerjaanIbu(e.target.value)} />
              </div>
              <textarea style={styles.textarea} placeholder="Alamat Lengkap..." value={alamat} onChange={e => setAlamat(e.target.value)}></textarea>
              <input type="number" style={{...styles.input, marginTop:10}} placeholder="No HP / WhatsApp (Wajib)" value={noHp} onChange={e => setNoHp(e.target.value)} required />
            </div>
          </div>

          {/* KOLOM KANAN: KEUANGAN */}
          <div style={styles.rightCol}>
            <div style={styles.cardBlue}>
              <h3 style={{color:'white', marginTop:0}}>💰 Administrasi</h3>
              
              <div style={styles.formGroup}>
                <label style={{color:'white'}}>Pilih Paket</label>
                <select style={styles.select} value={paket} onChange={e => setPaket(e.target.value)}>
                  <option value="paket1">Paket 1 - Rp {getBasePrice().toLocaleString()}</option>
                  <option value="paket2">Paket 2 (Medium)</option>
                  <option value="paket3">Paket 3 (Premium)</option>
                </select>
              </div>

              <div style={{marginBottom:10, color:'white'}}>
                <label><input type="checkbox" checked={biayaDaftar} onChange={e => setBiayaDaftar(e.target.checked)} /> Biaya Pendaftaran (+25rb)</label>
              </div>

              <div style={styles.formGroup}>
                <label style={{color:'white'}}>Diskon (Rp)</label>
                <input type="number" style={styles.input} value={diskon} onChange={e => setDiskon(e.target.value)} placeholder="0" />
              </div>

              <div style={{textAlign:'right', color:'white', margin:'20px 0'}}>
                <small>Total Bayar</small>
                <h1 style={{margin:0}}>Rp {hitungTotal().toLocaleString()}</h1>
              </div>

              <div style={styles.formGroup}>
                <label style={{color:'white'}}>Metode Pembayaran</label>
                <select style={styles.select} value={metodeBayar} onChange={e => setMetodeBayar(e.target.value)}>
                  <option value="Tunai">Lunas - Tunai (Masuk Brankas)</option>
                  <option value="Bank">Lunas - Transfer Bank</option>
                  <option value="Cicilan">Cicilan / Hutang</option>
                </select>
              </div>

              {/* AREA PENGATURAN CICILAN */}
              {metodeBayar === "Cicilan" && (
                <div style={styles.cicilanBox}>
                  <label>Tenor (Kali Bayar):</label>
                  <div style={{display:'flex', gap:5, marginTop:5, marginBottom: 15}}>
                    {[1,2,3,4,5,6].map(t => (
                      <button key={t} type="button" onClick={() => setTenor(t)} style={tenor===t ? styles.btnActive : styles.btnInactive}>{t}x</button>
                    ))}
                  </div>

                  {/* INPUT TANGGAL JATUH TEMPO (BARU) */}
                  <label>Mulai Tagihan Pertama:</label>
                  <input 
                    type="date" 
                    value={tanggalMulaiCicilan} 
                    onChange={(e) => setTanggalMulaiCicilan(e.target.value)}
                    style={{...styles.input, marginTop: 5}} 
                  />
                  <small style={{display:'block', fontSize:11, marginTop:5, opacity:0.8}}>
                    *Jatuh tempo bulan berikutnya akan otomatis mengikuti tanggal ini.
                  </small>

                  <div style={{marginTop: 15, borderTop: '1px solid rgba(255,255,255,0.2)', paddingTop: 10}}>
                    <p style={{margin:0}}>Cicilan per bulan:</p> 
                    <b style={{fontSize: 18}}>Rp {hitungCicilan().toLocaleString()}</b>
                  </div>
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
  grid: { display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '20px' },
  card: { background: 'white', padding: '20px', borderRadius: '10px', marginBottom: '20px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' },
  cardBlue: { background: '#2c3e50', padding: '25px', borderRadius: '10px', color: 'white' },
  row: { display: 'flex', gap: '10px', marginBottom: '10px' },
  formGroup: { marginBottom: '15px' },
  input: { width: '100%', padding: '10px', borderRadius: '5px', border: '1px solid #ccc', boxSizing: 'border-box' },
  inputDate: { width: '100%', padding: '10px', borderRadius: '5px', border: '2px solid #3498db' },
  select: { width: '100%', padding: '10px', borderRadius: '5px', border: '1px solid #ccc', background: 'white' },
  textarea: { width: '100%', padding: '10px', borderRadius: '5px', border: '1px solid #ccc', minHeight: '80px', boxSizing: 'border-box' },
  cicilanBox: { background: 'rgba(255,255,255,0.1)', padding: '15px', borderRadius: '5px', marginTop: '10px', border: '1px solid rgba(255,255,255,0.2)' },
  btnActive: { background: '#f1c40f', border: 'none', padding: '5px 10px', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer', color: '#2c3e50' },
  btnInactive: { background: 'transparent', border: '1px solid #ccc', color: 'white', padding: '5px 10px', borderRadius: '4px', cursor: 'pointer' },
  btnSubmit: { width: '100%', padding: '15px', background: '#27ae60', color: 'white', border: 'none', borderRadius: '5px', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer', marginTop: '20px', boxShadow: '0 4px 6px rgba(0,0,0,0.2)' }
};

export default AddStudent;