import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../../../components/Sidebar';
import { db } from '../../../firebase';
import { collection, addDoc, doc, getDoc } from "firebase/firestore";

const AddStudent = () => {
  const navigate = useNavigate();

  // 1. LOAD HARGA
  const [pricing, setPricing] = useState({
    sd: { paket1: 0, paket2: 0, paket3: 0 },
    smp: { paket1: 0, paket2: 0, paket3: 0 },
    english: { kids: 0, junior: 0, professional: 0 }
  });

  useEffect(() => {
    const fetchPricing = async () => {
      try {
        const docRef = doc(db, "settings", "global_config");
        const docSnap = await getDoc(docRef);
        if (docSnap.exists() && docSnap.data().prices) {
          setPricing(docSnap.data().prices);
        }
      } catch (error) { console.error("Error load harga:", error); }
    };
    fetchPricing();
  }, []);

  // 2. STATE FORM
  const [programType, setProgramType] = useState("Reguler");
  const [tanggalDaftar, setTanggalDaftar] = useState(new Date().toISOString().split('T')[0]);
  const [namaSiswa, setNamaSiswa] = useState("");
  
  // Reguler
  const [jenjang, setJenjang] = useState("SD");
  const [kelas, setKelas] = useState("4 SD");
  const [paketReguler, setPaketReguler] = useState("paket1");
  
  // English
  const [englishLevel, setEnglishLevel] = useState("kids"); 

  const [tempatLahir, setTempatLahir] = useState("");
  const [tanggalLahir, setTanggalLahir] = useState("");
  const [namaAyah, setNamaAyah] = useState("");
  const [pekerjaanAyah, setPekerjaanAyah] = useState("");
  const [namaIbu, setNamaIbu] = useState("");
  const [pekerjaanIbu, setPekerjaanIbu] = useState("");
  const [alamat, setAlamat] = useState("");
  const [noHp, setNoHp] = useState("");

  // Keuangan
  const [biayaDaftar, setBiayaDaftar] = useState(false);
  const [diskon, setDiskon] = useState(0);
  const [metodeBayar, setMetodeBayar] = useState("Tunai"); 
  const [tenor, setTenor] = useState(1);
  const [tanggalMulaiCicilan, setTanggalMulaiCicilan] = useState(new Date().toISOString().split('T')[0]);

  // 3. LOGIKA HARGA
  const getBasePrice = () => {
    if (programType === "English") {
        return pricing.english ? parseInt(pricing.english[englishLevel] || 0) : 0;
    } else {
        const level = jenjang.toLowerCase();
        return pricing[level] ? parseInt(pricing[level][paketReguler] || 0) : 0;
    }
  };

  const hitungTotal = () => {
    let total = getBasePrice();
    if (biayaDaftar) total += 25000;
    total = total - parseInt(diskon || 0);
    return total;
  };

  const hitungCicilan = () => Math.ceil(hitungTotal() / tenor);

  // 4. SUBMIT KE FIREBASE
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!namaSiswa || !namaAyah || !noHp) return alert("Data Wajib (Nama, Ayah, HP) harus diisi!");

    try {
      // A. SIMPAN DATA SISWA
      const studentData = {
        nama: namaSiswa,
        kategori: programType,
        detailProgram: programType === "English" ? `English - ${englishLevel}` : `${jenjang} - ${paketReguler}`,
        kelasSekolah: kelas,
        tempatLahir, tanggalLahir,
        ortu: { ayah: namaAyah, pekerjaanAyah, ibu: namaIbu, pekerjaanIbu, alamat, hp: noHp },
        status: "Aktif",
        tanggalMasuk: tanggalDaftar,
        totalTagihan: hitungTotal(), // Simpan info total tagihan di profil siswa juga
        totalBayar: metodeBayar === "Tunai" || metodeBayar === "Bank" ? hitungTotal() : 0 // Kalau lunas langsung catat lunas
      };

      const docRef = await addDoc(collection(db, "students"), studentData);
      const studentId = docRef.id;
      const totalBayar = hitungTotal();

      // B. SIMPAN DATA KEUANGAN
      if (metodeBayar === "Cicilan") {
        // Jika Cicilan: Masuk ke finance_tagihan
        let installments = [];
        const perBulan = hitungCicilan();
        const startDate = new Date(tanggalMulaiCicilan);

        for (let i = 0; i < tenor; i++) {
          let dueDate = new Date(startDate);
          dueDate.setMonth(startDate.getMonth() + i);
          installments.push({
            id: Date.now() + i, // ID unik sederhana
            bulanKe: i + 1,
            nominal: perBulan,
            status: "Belum Lunas",
            jatuhTempo: dueDate.toISOString().split('T')[0] 
          });
        }

        // Buat Dokumen Tagihan Induk
        await addDoc(collection(db, "finance_tagihan"), {
          studentId, namaSiswa, namaOrtu: namaAyah, noHp,
          totalTagihan: totalBayar, 
          sisaTagihan: totalBayar,
          detailCicilan: installments, 
          jenis: `Pendaftaran ${programType} (Cicilan)`
        });
        alert("✅ Pendaftaran Berhasil (Masuk Mode Cicilan)");

      } else {
        // Jika Lunas: Masuk ke finance_logs (Agar muncul di Dashboard Keuangan)
        await addDoc(collection(db, "finance_logs"), { 
          date: tanggalDaftar, 
          type: "Pemasukan", 
          category: "Pendaftaran", 
          amount: totalBayar,
          method: metodeBayar,
          note: `Pendaftaran Baru: ${namaSiswa} (${programType})`,
          studentId: studentId
        });
        alert(`✅ Pendaftaran Berhasil (Lunas)`);
      }
      navigate('/admin/students');

    } catch (error) { console.error("Error:", error); alert("Gagal menyimpan data."); }
  };

  // ... (SISA KODE JSX RETURN SAMA PERSIS SEPERTI YANG ANDA KIRIM, TIDAK SAYA UBAH TAMPILANNYA) ...
  // Paste bagian return (...) dari kode Anda sebelumnya di sini.
  return (
    <div style={{ display: 'flex' }}>
      <Sidebar />
      <div style={styles.content}>
        <h2 style={{color: '#333'}}>🎓 Pendaftaran Siswa Baru</h2>
        
        <div style={styles.programSelector}>
            <label style={{marginRight:10, fontWeight:'bold', color:'#333'}}>Pilih Program:</label>
            <select style={styles.selectMain} value={programType} onChange={(e) => setProgramType(e.target.value)}>
                <option value="Reguler">📚 Bimbel Reguler (SD / SMP)</option>
                <option value="English">🇬🇧 English Course</option>
            </select>
        </div>

        <form onSubmit={handleSubmit} style={styles.grid}>
          <div style={styles.leftCol}>
            <div style={styles.card}>
              <h3 style={styles.cardTitle}>👤 Identitas Siswa</h3>
              <div style={styles.formGroup}>
                <label style={styles.label}>Tanggal Daftar</label>
                <input type="date" style={styles.inputDate} value={tanggalDaftar} onChange={e => setTanggalDaftar(e.target.value)} />
              </div>
              <div style={styles.formGroup}><input style={styles.input} placeholder="Nama Lengkap Siswa" value={namaSiswa} onChange={e => setNamaSiswa(e.target.value)} required /></div>
              
              {programType === "Reguler" ? (
                  <div style={styles.row}>
                    <div style={{width:'100%'}}>
                        <label style={styles.labelSmall}>Jenjang</label>
                        <select style={styles.select} value={jenjang} onChange={e => setJenjang(e.target.value)}>
                            <option value="SD">SD</option>
                            <option value="SMP">SMP</option>
                        </select>
                    </div>
                  </div>
              ) : (
                  <div style={styles.formGroup}>
                    <label style={styles.labelSmall}>Level English Course</label>
                    <select style={styles.select} value={englishLevel} onChange={e => setEnglishLevel(e.target.value)}>
                        <option value="kids">Kids</option>
                        <option value="junior">Junior</option>
                        <option value="professional">Professional</option>
                    </select>
                  </div>
              )}

              <div style={styles.formGroup}>
                  <label style={styles.labelSmall}>Kelas Sekolah (Saat ini)</label>
                  <select style={styles.select} value={kelas} onChange={e => setKelas(e.target.value)}>
                      <option>4 SD</option><option>5 SD</option><option>6 SD</option>
                      <option>7 SMP</option><option>8 SMP</option><option>9 SMP</option>
                      <option>Lainnya</option>
                  </select>
              </div>

              <div style={styles.row}>
                <input style={styles.input} placeholder="Tempat Lahir" value={tempatLahir} onChange={e => setTempatLahir(e.target.value)} />
                <input type="date" style={styles.input} value={tanggalLahir} onChange={e => setTanggalLahir(e.target.value)} />
              </div>
            </div>

            <div style={styles.card}>
              <h3 style={styles.cardTitle}>👨‍👩‍👧 Data Orang Tua</h3>
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

          <div style={styles.rightCol}>
            <div style={styles.cardBlue}>
              <h3 style={{color:'white', marginTop:0}}>💰 Administrasi ({programType})</h3>
              
              <div style={styles.formGroup}>
                <label style={{color:'white'}}>Pilihan Paket/Level</label>
                {programType === "Reguler" ? (
                    <select style={styles.select} value={paketReguler} onChange={e => setPaketReguler(e.target.value)}>
                      <option value="paket1">Paket 1 - Rp {(pricing[jenjang.toLowerCase()]?.paket1 || 0).toLocaleString()}</option>
                      <option value="paket2">Paket 2 - Rp {(pricing[jenjang.toLowerCase()]?.paket2 || 0).toLocaleString()}</option>
                      <option value="paket3">Paket 3 - Rp {(pricing[jenjang.toLowerCase()]?.paket3 || 0).toLocaleString()}</option>
                    </select>
                ) : (
                    <div style={{padding:10, background:'white', borderRadius:5, color:'black', fontWeight:'bold'}}>
                        Level: {englishLevel.toUpperCase()} <br/>
                        Harga: Rp {(pricing.english?.[englishLevel] || 0).toLocaleString()}
                    </div>
                )}
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
                  <option value="Tunai">Lunas - Tunai</option>
                  <option value="Bank">Lunas - Transfer</option>
                  <option value="Cicilan">Cicilan</option>
                </select>
              </div>
              {metodeBayar === "Cicilan" && (
                <div style={styles.cicilanBox}>
                  <label>Tenor & Tgl Tagihan:</label>
                  <div style={{display:'flex', gap:5, marginTop:5, marginBottom: 15}}>
                    {[1,2,3,4,5,6].map(t => (
                      <button key={t} type="button" onClick={() => setTenor(t)} style={tenor===t ? styles.btnActive : styles.btnInactive}>{t}x</button>
                    ))}
                  </div>
                  <input type="date" value={tanggalMulaiCicilan} onChange={(e) => setTanggalMulaiCicilan(e.target.value)} style={{...styles.input, marginTop: 5}} />
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

// CSS (SAMA PERSIS)
const styles = {
  content: { marginLeft: '250px', padding: '30px', width: '100%', background: '#f4f7f6', minHeight: '100vh', fontFamily:'Segoe UI, sans-serif' },
  grid: { display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '20px' },
  programSelector: { background:'white', padding:15, borderRadius:10, marginBottom:20, boxShadow:'0 2px 4px rgba(0,0,0,0.05)', display:'flex', alignItems:'center' },
  selectMain: { padding:8, borderRadius:5, border:'1px solid #3498db', fontSize:16, fontWeight:'bold', color:'#2980b9' },
  card: { background: 'white', padding: '20px', borderRadius: '10px', marginBottom: '20px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' },
  cardTitle: { marginTop: 0, color: '#333' },
  label: { color: '#333', fontWeight: 'bold' },
  labelSmall: { fontSize:12, color:'#666', marginBottom:5, display:'block' },
  cardBlue: { background: '#2c3e50', padding: '25px', borderRadius: '10px', color: 'white' },
  row: { display: 'flex', gap: '10px', marginBottom: '10px' },
  formGroup: { marginBottom: '15px' },
  input: { width: '100%', padding: '10px', borderRadius: '5px', border: '1px solid #ccc', boxSizing: 'border-box', background: '#ffffff', color: '#000000' },
  inputDate: { width: '100%', padding: '10px', borderRadius: '5px', border: '2px solid #3498db', background: '#ffffff', color: '#000000' },
  select: { width: '100%', padding: '10px', borderRadius: '5px', border: '1px solid #ccc', background: '#ffffff', color: '#000000' },
  textarea: { width: '100%', padding: '10px', borderRadius: '5px', border: '1px solid #ccc', minHeight: '80px', boxSizing: 'border-box', background: '#ffffff', color: '#000000' },
  cicilanBox: { background: 'rgba(255,255,255,0.1)', padding: '15px', borderRadius: '5px', marginTop: '10px', border: '1px solid rgba(255,255,255,0.2)' },
  btnActive: { background: '#f1c40f', border: 'none', padding: '5px 10px', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer', color: '#2c3e50' },
  btnInactive: { background: 'transparent', border: '1px solid #ccc', color: 'white', padding: '5px 10px', borderRadius: '4px', cursor: 'pointer' },
  btnSubmit: { width: '100%', padding: '15px', background: '#27ae60', color: 'white', border: 'none', borderRadius: '5px', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer', marginTop: '20px', boxShadow: '0 4px 6px rgba(0,0,0,0.2)' },
  leftCol: {}, rightCol: {}
};

export default AddStudent;