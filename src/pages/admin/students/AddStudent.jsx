import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import SidebarAdmin from '../../../components/SidebarAdmin';
import { db } from '../../../firebase';
import { collection, addDoc, doc, getDoc } from "firebase/firestore";

const AddStudent = () => {
  const navigate = useNavigate();
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);

  // Responsive Handler
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 1024);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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

  // 2. STATE FORM UTAMA
  const [programType, setProgramType] = useState("Reguler");
  const [tanggalDaftar, setTanggalDaftar] = useState(new Date().toISOString().split('T')[0]);
  const [namaSiswa, setNamaSiswa] = useState("");
  
  // STATE MASA AKTIF PAKET
  const [tanggalMulai, setTanggalMulai] = useState(new Date().toISOString().split('T')[0]);
  const [durasiBulan, setDurasiBulan] = useState(3);

  // STATE AKSES LOGIN
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  // LOGIKA OTOMATIS: Username & Password
  useEffect(() => {
    if (namaSiswa) {
      const namaBersih = namaSiswa.split(' ')[0].toLowerCase().replace(/[^a-z0-9]/g, '');
      const randomNum = Math.floor(100 + Math.random() * 900);
      setUsername(`${namaBersih}${randomNum}@gemilang.com`);

      if (tanggalLahir) {
        const tahun = tanggalLahir.split('-')[0];
        setPassword(`${namaBersih}${tahun}`);
      } else {
        setPassword(`${namaBersih}123`);
      }
    }
  }, [namaSiswa, tanggalLahir]);

  // Data Sekolah & Kursus
  const [jenjang, setJenjang] = useState("SD");
  const [kelas, setKelas] = useState("1 SD"); 
  const [paketReguler, setPaketReguler] = useState("paket1");
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
  const [customDueDates, setCustomDueDates] = useState([]);

  // LOGIKA: Generate Tanggal Cicilan
  useEffect(() => {
    if (metodeBayar === 'Cicilan') {
        const dates = [];
        const startDate = new Date(tanggalMulaiCicilan);
        for (let i = 0; i < tenor; i++) {
            const nextDate = new Date(startDate);
            nextDate.setMonth(startDate.getMonth() + i);
            dates.push(nextDate.toISOString().split('T')[0]);
        }
        setCustomDueDates(dates);
    }
  }, [tenor, tanggalMulaiCicilan, metodeBayar]);

  const handleDateChange = (index, newDate) => {
      const updatedDates = [...customDueDates];
      updatedDates[index] = newDate;
      setCustomDueDates(updatedDates);
  };

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

  // SUBMIT DATA
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!namaSiswa || !namaAyah || !noHp) return alert("Data Wajib (Nama, Ayah, HP) harus diisi!");

    try {
      const studentData = {
        nama: namaSiswa,
        username: username.toLowerCase(),
        password: password,
        role: "siswa",
        kategori: programType,
        detailProgram: programType === "English" ? `English - ${englishLevel}` : `${jenjang} - ${paketReguler}`,
        kelasSekolah: kelas,
        tempatLahir, 
        tanggalLahir,
        ortu: { ayah: namaAyah, pekerjaanAyah, ibu: namaIbu, pekerjaanIbu, alamat, hp: noHp },
        status: "Aktif",
        isBlocked: false,
        tanggalMasuk: tanggalDaftar,
        tanggalMulai: tanggalMulai,
        durasiBulan: parseInt(durasiBulan),
        totalTagihan: hitungTotal(), 
        totalBayar: metodeBayar === "Tunai" || metodeBayar === "Bank" ? hitungTotal() : 0 
      };

      const docRef = await addDoc(collection(db, "students"), studentData);
      const studentId = docRef.id;
      const totalBayarFinal = hitungTotal();

      if (metodeBayar === "Cicilan") {
        let installments = customDueDates.map((dateStr, index) => ({
            id: Date.now() + index,
            bulanKe: index + 1,
            nominal: hitungCicilan(),
            status: "Belum Lunas",
            jatuhTempo: dateStr
        }));

        await addDoc(collection(db, "finance_tagihan"), {
          studentId, namaSiswa, namaOrtu: namaAyah, noHp,
          totalTagihan: totalBayarFinal, 
          sisaTagihan: totalBayarFinal,
          detailCicilan: installments, 
          jenis: `Pendaftaran ${programType} (Cicilan)`
        });
      } else {
        await addDoc(collection(db, "finance_logs"), { 
          date: tanggalDaftar, 
          type: "Pemasukan", 
          category: "Pendaftaran", 
          amount: totalBayarFinal,
          method: metodeBayar,
          note: `Pendaftaran Baru: ${namaSiswa} (${programType})`,
          studentId: studentId
        });
      }

      alert(`✅ Berhasil! Akun Siswa: ${username}`);
      navigate('/admin/students');

    } catch (error) { 
      console.error("Error:", error); 
      alert("Gagal menyimpan data."); 
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', minHeight: '100vh', background: '#f4f7f6' }}>
      <SidebarAdmin />
      <div style={{ 
        marginLeft: isMobile ? '0' : '250px', 
        padding: isMobile ? '15px' : '30px', 
        width: isMobile ? '100%' : 'calc(100% - 250px)', 
        boxSizing: 'border-box' 
      }}>
        <h2 style={{color: '#2c3e50', marginBottom: 20}}>🎓 Pendaftaran Siswa Baru</h2>
        
        <div style={styles.programSelector}>
            <label style={{marginRight:10, fontWeight:'bold', color:'#333'}}>Pilih Program:</label>
            <select style={styles.selectMain} value={programType} onChange={(e) => setProgramType(e.target.value)}>
                <option value="Reguler">📚 Bimbel Reguler (SD / SMP)</option>
                <option value="English">🇬🇧 English Course</option>
            </select>
        </div>

        <form onSubmit={handleSubmit} style={{
          display: 'grid', 
          gridTemplateColumns: isMobile ? '1fr' : '1.5fr 1fr', 
          gap: '20px'
        }}>
          <div style={styles.leftCol}>
            <div style={styles.card}>
              <h3 style={styles.cardTitle}>👤 Identitas & Akun Portal</h3>
              <div style={styles.formGroup}>
                <label style={styles.labelSmall}>Tanggal Daftar</label>
                <input type="date" style={styles.inputDate} value={tanggalDaftar} onChange={e => setTanggalDaftar(e.target.value)} />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.labelSmall}>Nama Lengkap Siswa</label>
                <input style={styles.input} placeholder="Nama Lengkap Siswa" value={namaSiswa} onChange={e => setNamaSiswa(e.target.value)} required />
              </div>

              <div style={{background: '#f0f7ff', padding: '15px', borderRadius: '10px', border: '1px solid #3498db', marginBottom: '15px'}}>
                  <p style={{margin: '0 0 10px 0', fontSize: 12, fontWeight: 'bold', color: '#2980b9'}}>📅 SETTING MASA AKTIF PAKET</p>
                  <div style={styles.row}>
                    <div style={{flex: 1}}>
                        <label style={styles.labelSmall}>Mulai Belajar</label>
                        <input type="date" style={styles.input} value={tanggalMulai} onChange={e => setTanggalMulai(e.target.value)} />
                    </div>
                    <div style={{flex: 1}}>
                        <label style={styles.labelSmall}>Durasi (Bulan)</label>
                        <select style={styles.select} value={durasiBulan} onChange={e => setDurasiBulan(e.target.value)}>
                            <option value={1}>1 Bulan</option>
                            <option value={3}>3 Bulan (1 Term)</option>
                            <option value={6}>6 Bulan (1 Semester)</option>
                            <option value={12}>12 Bulan (1 Tahun)</option>
                        </select>
                    </div>
                  </div>
              </div>

              <div style={{background: '#f8f9fa', padding: '15px', borderRadius: '10px', border: '1px dashed #adb5bd', marginBottom: '15px'}}>
                  <p style={{margin: '0 0 10px 0', fontSize: 12, fontWeight: 'bold', color: '#495057'}}>🔐 AKSES LOGIN (OTOMATIS)</p>
                  <div style={styles.row}>
                    <div style={{flex: 1}}>
                        <label style={styles.labelSmall}>Username</label>
                        <input style={styles.input} value={username} readOnly />
                    </div>
                    <div style={{flex: 1}}>
                        <label style={styles.labelSmall}>Password</label>
                        <input style={styles.input} value={password} readOnly />
                    </div>
                  </div>
              </div>
              
              <div style={styles.row}>
                <div style={{flex:1}}>
                  <label style={styles.labelSmall}>Jenjang/Level</label>
                  {programType === "Reguler" ? (
                    <select style={styles.select} value={jenjang} onChange={e => setJenjang(e.target.value)}>
                        <option value="SD">SD</option>
                        <option value="SMP">SMP</option>
                    </select>
                  ) : (
                    <select style={styles.select} value={englishLevel} onChange={e => setEnglishLevel(e.target.value)}>
                        <option value="kids">Kids</option>
                        <option value="junior">Junior</option>
                        <option value="professional">Professional</option>
                    </select>
                  )}
                </div>
                <div style={{flex:1}}>
                  <label style={styles.labelSmall}>Kelas Sekolah</label>
                  <select style={styles.select} value={kelas} onChange={e => setKelas(e.target.value)}>
                      <option>1 SD</option><option>2 SD</option><option>3 SD</option>
                      <option>4 SD</option><option>5 SD</option><option>6 SD</option>
                      <option>7 SMP</option><option>8 SMP</option><option>9 SMP</option>
                      <option>Lainnya</option>
                  </select>
                </div>
              </div>

              <div style={styles.row}>
                <div style={{flex:1}}>
                  <label style={styles.labelSmall}>Tempat Lahir</label>
                  <input style={styles.input} placeholder="Kota" value={tempatLahir} onChange={e => setTempatLahir(e.target.value)} />
                </div>
                <div style={{flex:1}}>
                  <label style={styles.labelSmall}>Tanggal Lahir (Pilih Tahun Terlebih Dahulu)</label>
                  <input 
                    type="date" 
                    style={styles.input} 
                    value={tanggalLahir} 
                    onChange={e => setTanggalLahir(e.target.value)}
                    max="2030-12-31"
                    min="1990-01-01"
                  />
                </div>
              </div>
            </div>

            <div style={styles.card}>
              <h3 style={styles.cardTitle}>👨‍👩‍👧 Data Orang Tua</h3>
              <div style={styles.row}>
                <div style={{flex:1}}>
                  <label style={styles.labelSmall}>Nama Ayah</label>
                  <input style={styles.input} placeholder="Nama Ayah" value={namaAyah} onChange={e => setNamaAyah(e.target.value)} required />
                </div>
                <div style={{flex:1}}>
                  <label style={styles.labelSmall}>Pekerjaan Ayah</label>
                  <input style={styles.input} placeholder="Pekerjaan Ayah" value={pekerjaanAyah} onChange={e => setPekerjaanAyah(e.target.value)} />
                </div>
              </div>
              <div style={styles.row}>
                <div style={{flex:1}}>
                  <label style={styles.labelSmall}>Nama Ibu</label>
                  <input style={styles.input} placeholder="Nama Ibu" value={namaIbu} onChange={e => setNamaIbu(e.target.value)} />
                </div>
                <div style={{flex:1}}>
                  <label style={styles.labelSmall}>Pekerjaan Ibu</label>
                  <input style={styles.input} placeholder="Pekerjaan Ibu" value={pekerjaanIbu} onChange={e => setPekerjaanIbu(e.target.value)} />
                </div>
              </div>
              <label style={styles.labelSmall}>Alamat Lengkap</label>
              <textarea style={styles.textarea} placeholder="Alamat Lengkap..." value={alamat} onChange={e => setAlamat(e.target.value)}></textarea>
              <label style={{...styles.labelSmall, marginTop: 10}}>No HP / WhatsApp (Aktif)</label>
              <input type="number" style={styles.input} placeholder="628xxx" value={noHp} onChange={e => setNoHp(e.target.value)} required />
            </div>
          </div>

          <div style={styles.rightCol}>
            <div style={styles.cardBlue}>
              <h3 style={{color:'white', marginTop:0}}>💰 Keuangan</h3>
              
              <div style={styles.formGroup}>
                <label style={{color:'white', fontSize: 12}}>Pilihan Paket</label>
                {programType === "Reguler" ? (
                    <select style={styles.select} value={paketReguler} onChange={e => setPaketReguler(e.target.value)}>
                      <option value="paket1">Paket 1 - Rp {(pricing[jenjang.toLowerCase()]?.paket1 || 0).toLocaleString()}</option>
                      <option value="paket2">Paket 2 - Rp {(pricing[jenjang.toLowerCase()]?.paket2 || 0).toLocaleString()}</option>
                      <option value="paket3">Paket 3 - Rp {(pricing[jenjang.toLowerCase()]?.paket3 || 0).toLocaleString()}</option>
                    </select>
                ) : (
                    <div style={{padding:10, background:'white', borderRadius:5, color:'black', fontWeight:'bold'}}>
                        Harga Level {englishLevel.toUpperCase()}: Rp {(pricing.english?.[englishLevel] || 0).toLocaleString()}
                    </div>
                )}
              </div>

              <div style={{marginBottom:10, color:'white'}}>
                <label style={{cursor: 'pointer'}}><input type="checkbox" checked={biayaDaftar} onChange={e => setBiayaDaftar(e.target.checked)} /> Biaya Pendaftaran (+25rb)</label>
              </div>
              <div style={styles.formGroup}>
                <label style={{color:'white', fontSize: 12}}>Diskon Khusus (Rp)</label>
                <input type="number" style={styles.input} value={diskon} onChange={e => setDiskon(e.target.value)} placeholder="0" />
              </div>
              <div style={{textAlign:'right', color:'white', margin:'20px 0'}}>
                <small>Total Kewajiban Bayar</small>
                <h1 style={{margin:0, fontSize: isMobile ? '28px' : '36px'}}>Rp {hitungTotal().toLocaleString()}</h1>
              </div>
              <div style={styles.formGroup}>
                <label style={{color:'white', fontSize: 12}}>Metode Pembayaran</label>
                <select style={styles.select} value={metodeBayar} onChange={e => setMetodeBayar(e.target.value)}>
                  <option value="Tunai">Lunas - Tunai</option>
                  <option value="Bank">Lunas - Transfer</option>
                  <option value="Cicilan">Cicilan Tahap</option>
                </select>
              </div>
              
              {metodeBayar === "Cicilan" && (
                <div style={styles.cicilanBox}>
                  <label style={{fontSize: 12}}>Tenor Cicilan:</label>
                  <div style={{display:'flex', gap:5, marginTop:5, marginBottom: 15, flexWrap: 'wrap'}}>
                    {[1,2,3,4,5,6].map(t => (
                      <button key={t} type="button" onClick={() => setTenor(t)} style={tenor===t ? styles.btnActive : styles.btnInactive}>{t}x</button>
                    ))}
                  </div>

                  <label style={{fontSize: 12}}>Jatuh Tempo Cicilan 1:</label>
                  <input type="date" value={tanggalMulaiCicilan} onChange={(e) => setTanggalMulaiCicilan(e.target.value)} style={{...styles.input, marginTop: 5, marginBottom:15}} />
                  
                  <div style={{background:'rgba(0,0,0,0.2)', padding:10, borderRadius:5}}>
                      <small style={{display:'block', marginBottom:5, color:'#ddd'}}>Edit Tanggal Jatuh Tempo:</small>
                      {customDueDates.map((date, idx) => (
                          <div key={idx} style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:5}}>
                              <span style={{fontSize:11, color:'white'}}>Ke-{idx+1}</span>
                              <input 
                                type="date" 
                                value={date} 
                                onChange={(e) => handleDateChange(idx, e.target.value)}
                                style={styles.inputMini}
                              />
                          </div>
                      ))}
                  </div>

                  <div style={{marginTop: 15, borderTop: '1px solid rgba(255,255,255,0.2)', paddingTop: 10}}>
                    <p style={{margin:0, fontSize: 12}}>Nominal per cicilan:</p> 
                    <b style={{fontSize: 18}}>Rp {hitungCicilan().toLocaleString()}</b>
                  </div>
                </div>
              )}

              <button type="submit" style={styles.btnSubmit}>SIMPAN SISWA & AKUN</button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

const styles = {
  programSelector: { background:'white', padding:15, borderRadius:10, marginBottom:20, boxShadow:'0 2px 4px rgba(0,0,0,0.05)', display:'flex', alignItems:'center', flexWrap: 'wrap' },
  selectMain: { padding:8, borderRadius:5, border:'1px solid #3498db', fontSize:14, fontWeight:'bold', color:'#2980b9' },
  card: { background: 'white', padding: '20px', borderRadius: '10px', marginBottom: '20px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' },
  cardTitle: { marginTop: 0, color: '#2c3e50', borderBottom: '1px solid #eee', paddingBottom: 10, marginBottom: 15, fontSize: '18px' },
  labelSmall: { fontSize:11, color:'#7f8c8d', marginBottom:5, display:'block', fontWeight: 'bold' },
  cardBlue: { background: '#2c3e50', padding: '25px', borderRadius: '10px', color: 'white', position: 'sticky', top: '20px' },
  row: { display: 'flex', gap: '10px', marginBottom: '10px' },
  formGroup: { marginBottom: '15px' },
  input: { width: '100%', padding: '10px', borderRadius: '5px', border: '1px solid #ddd', boxSizing: 'border-box', background: '#ffffff', color: '#000', fontSize: '14px' },
  inputMini: { padding: '5px', borderRadius: '4px', border: 'none', width: '130px', fontSize: '12px' },
  inputDate: { width: '100%', padding: '10px', borderRadius: '5px', border: '2px solid #3498db', background: '#ffffff', fontSize: '14px' },
  select: { width: '100%', padding: '10px', borderRadius: '5px', border: '1px solid #ddd', background: '#ffffff', color: '#000', cursor: 'pointer' },
  textarea: { width: '100%', padding: '10px', borderRadius: '5px', border: '1px solid #ddd', minHeight: '80px', boxSizing: 'border-box', background: '#ffffff', color: '#000' },
  cicilanBox: { background: 'rgba(255,255,255,0.1)', padding: '15px', borderRadius: '5px', marginTop: '10px', border: '1px solid rgba(255,255,255,0.2)' },
  btnActive: { background: '#f1c40f', border: 'none', padding: '8px 12px', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer', color: '#2c3e50' },
  btnInactive: { background: 'transparent', border: '1px solid #ccc', color: 'white', padding: '8px 12px', borderRadius: '4px', cursor: 'pointer' },
  btnSubmit: { width: '100%', padding: '15px', background: '#27ae60', color: 'white', border: 'none', borderRadius: '5px', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer', marginTop: '20px', boxShadow: '0 4px 6px rgba(0,0,0,0.2)' },
  leftCol: {}, rightCol: {}
};

export default AddStudent;