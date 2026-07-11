Error di baris 133 karena ada masalah dengan **template literal** di dalam `new RegExp()`. Coba perbaiki dengan cara ini:

## Perbaikan Cepat - Ganti Fungsi `generateStudentId`:

```jsx
// ============================================================
// 🔥 GENERATE STUDENT ID (PASTI UNIK + BERMAKNA)
// ============================================================
const generateStudentId = async () => {
  try {
    // Ambil data dari form
    const kelas = formData.kelasSekolah || '1 SD';
    const program = formData.programType || 'Reguler';
    
    // Kode kelas (2 digit)
    const kodeKelas = getKodeKelas(kelas, program);
    
    // Tahun (2 digit) dan Bulan (2 digit)
    const now = new Date();
    const tahun = now.getFullYear().toString().slice(-2);
    const bulan = String(now.getMonth() + 1).padStart(2, '0');
    
    // Prefix: STD-KKYYMM
    const prefix = 'STD-' + kodeKelas + tahun + bulan;
    
    // 🔥 CARI NOMOR URUT TERAKHIR UNTUK PREFIX INI
    const q = query(
      collection(db, "students"),
      where("studentId", ">=", prefix),
      where("studentId", "<=", prefix + "ZZZZ")
    );
    const snap = await getDocs(q);
    
    let maxUrut = 0;
    snap.docs.forEach(doc => {
      const data = doc.data();
      if (data.studentId) {
        // Cari 4 digit terakhir - PAKAI cara manual
        const idStr = data.studentId;
        if (idStr.startsWith(prefix)) {
          const suffix = idStr.substring(prefix.length);
          const num = parseInt(suffix);
          if (!isNaN(num) && num > maxUrut) {
            maxUrut = num;
          }
        }
      }
    });
    
    // Generate ID lengkap
    const nextUrut = maxUrut + 1;
    const studentId = prefix + String(nextUrut).padStart(4, '0');
    
    // 🔥 DOUBLE CHECK: Pastikan ID benar-benar unik
    const checkSnap = await getDocs(
      query(collection(db, "students"), where("studentId", "==", studentId))
    );
    
    if (!checkSnap.empty) {
      // Jika ada duplikat, generate ulang dengan timestamp
      console.warn("⚠️ Duplikat ID terdeteksi! Generate ulang...");
      const timestamp = Date.now().toString(36).toUpperCase();
      const random = Math.random().toString(36).substring(2, 6).toUpperCase();
      return 'STD-' + timestamp + random;
    }
    
    return studentId;
  } catch (e) {
    console.error("Error generate ID:", e);
    // Fallback: timestamp + random (PASTI UNIK)
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return 'STD-' + timestamp + random;
  }
};
```

## Atau Full Code AddStudent.jsx yang Sudah Diperbaiki:

```jsx
// src/pages/admin/students/AddStudent.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import SidebarAdmin from '../../../components/SidebarAdmin';
import { db } from '../../../firebase';
import { 
  collection, addDoc, getDocs, query, orderBy, limit, 
  doc, getDoc, serverTimestamp, where 
} from "firebase/firestore";
import { 
  ArrowLeft, Save, User, BookOpen, Calendar, CreditCard, 
  CheckCircle, ChevronRight, ChevronLeft, IdCard, Phone,
  Sparkles
} from 'lucide-react';

const AddStudent = () => {
  const navigate = useNavigate();
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [alertMsg, setAlertMsg] = useState(null);

  // === PRICING FROM SETTINGS ===
  const [pricing, setPricing] = useState({
    sd: { packages: [] },
    smp: { packages: [] },
    sma: { packages: [] },
    english: { levels: [] }
  });
  const [biayaPendaftaran, setBiayaPendaftaran] = useState(25000);

  // === FORM DATA ===
  const [formData, setFormData] = useState({
    nama: '',
    tempatLahir: '',
    alamat: '',
    noHp: '',
    namaAyah: '',
    namaIbu: '',
    kelasSekolah: '1 SD',
    programType: 'Reguler',
    jenjang: 'SD',
    paketId: null,
    englishLevelId: null,
    tanggalMulai: new Date().toISOString().split('T')[0],
    durasiBulan: 1,
    metodeBayar: 'Tunai',
    biayaDaftar: true,
    diskon: 0,
    tenor: 1,
    tanggalCicilan1: new Date().toISOString().split('T')[0],
  });

  const [tglLahir, setTglLahir] = useState({ hari: '', bulan: '', tahun: '' });

  // === FETCH PRICING ===
  useEffect(() => {
    const fetchPricing = async () => {
      try {
        const docRef = doc(db, "settings", "global_config");
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data.prices) {
            setPricing({
              sd: data.prices.sd || { packages: [] },
              smp: data.prices.smp || { packages: [] },
              sma: data.prices.sma || { packages: [] },
              english: data.prices.english || { levels: [] }
            });
          }
          if (data.biayaPendaftaran) {
            setBiayaPendaftaran(data.biayaPendaftaran);
          }
        }
      } catch (error) {
        console.error("Error load harga:", error);
      }
    };
    fetchPricing();
  }, []);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const showAlert = (msg, duration = 4000) => {
    setAlertMsg(msg);
    setTimeout(() => setAlertMsg(null), duration);
  };

  // ============================================================
  // 🔥 KODE KELAS UNTUK NIM
  // ============================================================
  const getKodeKelas = (kelasSekolah, programType) => {
    if (programType === 'English') {
      return 'EN';
    }
    
    const kelasMap = {
      '1 SD': '01', '2 SD': '02', '3 SD': '03',
      '4 SD': '04', '5 SD': '05', '6 SD': '06',
      '7 SMP': '07', '8 SMP': '08', '9 SMP': '09',
      '10 SMA': '10', '11 SMA': '11', '12 SMA': '12',
      'Alumni': 'AL',
      'Umum': 'UM'
    };
    
    return kelasMap[kelasSekolah] || '00';
  };

  // ============================================================
  // 🔥 GENERATE STUDENT ID (PASTI UNIK + BERMAKNA)
  // ============================================================
  const generateStudentId = async () => {
    try {
      // Ambil data dari form
      const kelas = formData.kelasSekolah || '1 SD';
      const program = formData.programType || 'Reguler';
      
      // Kode kelas (2 digit)
      const kodeKelas = getKodeKelas(kelas, program);
      
      // Tahun (2 digit) dan Bulan (2 digit)
      const now = new Date();
      const tahun = now.getFullYear().toString().slice(-2);
      const bulan = String(now.getMonth() + 1).padStart(2, '0');
      
      // Prefix: STD-KKYYMM
      const prefix = 'STD-' + kodeKelas + tahun + bulan;
      
      // 🔥 CARI NOMOR URUT TERAKHIR UNTUK PREFIX INI
      const q = query(
        collection(db, "students"),
        where("studentId", ">=", prefix),
        where("studentId", "<=", prefix + "ZZZZ")
      );
      const snap = await getDocs(q);
      
      let maxUrut = 0;
      snap.docs.forEach(doc => {
        const data = doc.data();
        if (data.studentId) {
          // Cari 4 digit terakhir
          const idStr = data.studentId;
          if (idStr.startsWith(prefix)) {
            const suffix = idStr.substring(prefix.length);
            const num = parseInt(suffix);
            if (!isNaN(num) && num > maxUrut) {
              maxUrut = num;
            }
          }
        }
      });
      
      // Generate ID lengkap
      const nextUrut = maxUrut + 1;
      const studentId = prefix + String(nextUrut).padStart(4, '0');
      
      // 🔥 DOUBLE CHECK: Pastikan ID benar-benar unik
      const checkSnap = await getDocs(
        query(collection(db, "students"), where("studentId", "==", studentId))
      );
      
      if (!checkSnap.empty) {
        // Jika ada duplikat (hampir tidak mungkin), generate ulang dengan timestamp
        console.warn("⚠️ Duplikat ID terdeteksi! Generate ulang...");
        const timestamp = Date.now().toString(36).toUpperCase();
        const random = Math.random().toString(36).substring(2, 6).toUpperCase();
        return 'STD-' + timestamp + random;
      }
      
      return studentId;
    } catch (e) {
      console.error("Error generate ID:", e);
      // Fallback: timestamp + random (PASTI UNIK)
      const timestamp = Date.now().toString(36).toUpperCase();
      const random = Math.random().toString(36).substring(2, 6).toUpperCase();
      return 'STD-' + timestamp + random;
    }
  };

  // === TANGGAL LAHIR ===
  const tahunOptions = [];
  const currentYear = new Date().getFullYear();
  for (let y = currentYear; y >= 1995; y--) {
    tahunOptions.push(y);
  }

  const hariOptions = Array.from({ length: 31 }, (_, i) => i + 1);
  const bulanOptions = [
    { value: '01', label: 'Januari' }, { value: '02', label: 'Februari' },
    { value: '03', label: 'Maret' }, { value: '04', label: 'April' },
    { value: '05', label: 'Mei' }, { value: '06', label: 'Juni' },
    { value: '07', label: 'Juli' }, { value: '08', label: 'Agustus' },
    { value: '09', label: 'September' }, { value: '10', label: 'Oktober' },
    { value: '11', label: 'November' }, { value: '12', label: 'Desember' }
  ];

  const getTanggalLahirStr = () => {
    if (tglLahir.tahun && tglLahir.bulan && tglLahir.hari) {
      const h = String(tglLahir.hari).padStart(2, '0');
      return `${tglLahir.tahun}-${tglLahir.bulan}-${h}`;
    }
    return '';
  };

  useEffect(() => {
    if (!tglLahir.tahun) {
      setTglLahir(prev => ({ ...prev, tahun: (currentYear - 12).toString() }));
    }
  }, []);

  // === AUTO SET JENJANG ===
  useEffect(() => {
    if (formData.programType === 'Reguler') {
      let jenjang = 'SD';
      if (formData.kelasSekolah.includes('SMP')) jenjang = 'SMP';
      else if (formData.kelasSekolah.includes('SMA')) jenjang = 'SMA';
      setFormData(prev => ({...prev, jenjang, paketId: null}));
    }
  }, [formData.kelasSekolah, formData.programType]);

  // === AUTO GENERATE DUE DATES ===
  const [customDueDates, setCustomDueDates] = useState([]);
  useEffect(() => {
    if (formData.metodeBayar === 'Cicilan' && formData.tenor > 0) {
      const dates = [];
      const startDate = new Date(formData.tanggalCicilan1);
      for (let i = 0; i < formData.tenor; i++) {
        const nextDate = new Date(startDate);
        nextDate.setMonth(startDate.getMonth() + i);
        dates.push(nextDate.toISOString().split('T')[0]);
      }
      setCustomDueDates(dates);
    }
  }, [formData.metodeBayar, formData.tenor, formData.tanggalCicilan1]);

  const updateField = (field, value) => {
    setFormData(prev => ({...prev, [field]: value}));
  };

  // === GET SELECTED PACKAGE ===
  const getSelectedPackage = () => {
    if (formData.programType === 'English') {
      return pricing.english.levels.find(l => l.id === formData.englishLevelId);
    }
    const jenjang = formData.jenjang.toLowerCase();
    return pricing[jenjang]?.packages?.find(p => p.id === formData.paketId);
  };

  // === GET BASE PRICE (BULANAN) ===
  const getBasePrice = () => {
    const pkg = getSelectedPackage();
    return pkg ? pkg.price : 0;
  };

  // === HITUNG TOTAL (DURASI x BULANAN) ===
  const hitungTotal = () => {
    const basePrice = getBasePrice();
    let total = basePrice * parseInt(formData.durasiBulan || 1);
    if (formData.biayaDaftar) total += biayaPendaftaran;
    total -= parseInt(formData.diskon || 0);
    return total > 0 ? total : 0;
  };

  const hitungCicilan = () => {
    return formData.tenor > 0 ? Math.ceil(hitungTotal() / formData.tenor) : hitungTotal();
  };

  const getTanggalSelesai = () => {
    if (!formData.tanggalMulai) return '-';
    const start = new Date(formData.tanggalMulai);
    start.setMonth(start.getMonth() + parseInt(formData.durasiBulan || 0));
    return start.toISOString().split('T')[0];
  };

  const getUsername = () => {
    if (!formData.nama) return '';
    const namaBersih = formData.nama.split(' ')[0].toLowerCase().replace(/[^a-z0-9]/g, '');
    const randomNum = Math.floor(100 + Math.random() * 900);
    return `${namaBersih}${randomNum}@gemilang.com`;
  };

  const getPassword = () => {
    if (!formData.nama) return '';
    const namaBersih = formData.nama.split(' ')[0].toLowerCase().replace(/[^a-z0-9]/g, '');
    if (tglLahir.tahun) {
      return `${namaBersih}${tglLahir.tahun}`;
    }
    return `${namaBersih}123`;
  };

  // === GET PAKET OPTIONS ===
  const getPaketOptions = () => {
    if (formData.programType === 'English') {
      return pricing.english.levels.map(l => ({
        id: l.id,
        name: l.name,
        price: l.price
      }));
    }
    const jenjang = formData.jenjang.toLowerCase();
    return pricing[jenjang]?.packages || [];
  };

  // === SUBMIT ===
  const handleSubmit = async () => {
    if (!formData.nama || !formData.noHp) {
      showAlert('⚠️ Nama dan No HP wajib diisi!');
      return;
    }

    const pkg = getSelectedPackage();
    if (!pkg) {
      showAlert('⚠️ Pilih paket terlebih dahulu!');
      return;
    }

    setLoading(true);
    try {
      const studentId = await generateStudentId();
      const totalTagihan = hitungTotal();
      const tanggalSelesai = getTanggalSelesai();
      const tanggalLahirStr = getTanggalLahirStr();
      const today = new Date().toISOString().split('T')[0];

      const paketName = pkg.name || pkg.id;
      const detailProgram = formData.programType === 'English' 
        ? `English - ${paketName}` 
        : `${formData.jenjang} - ${paketName}`;

      // 1. SIMPAN DATA SISWA
      const studentData = {
        studentId: studentId,
        nama: formData.nama,
        username: getUsername().toLowerCase(),
        password: getPassword(),
        role: 'siswa',
        kategori: formData.programType,
        jenjang: formData.programType === 'English' ? 'English' : formData.jenjang,
        detailProgram: detailProgram,
        paket: formData.programType === 'English' ? formData.englishLevelId : formData.paketId,
        paketNama: paketName,
        paketHargaBulanan: pkg.price,
        kelasSekolah: formData.kelasSekolah,
        tempatLahir: formData.tempatLahir,
        tanggalLahir: tanggalLahirStr,
        ortu: {
          ayah: formData.namaAyah,
          ibu: formData.namaIbu,
          alamat: formData.alamat,
          hp: formData.noHp
        },
        tanggalMulai: formData.tanggalMulai,
        tanggalSelesai: tanggalSelesai,
        durasiBulan: parseInt(formData.durasiBulan),
        biayaPendaftaran: formData.biayaDaftar ? biayaPendaftaran : 0,
        diskon: parseInt(formData.diskon || 0),
        totalTagihan: totalTagihan,
        totalBayar: formData.metodeBayar === 'Tunai' || formData.metodeBayar === 'Transfer' ? totalTagihan : 0,
        metodeBayar: formData.metodeBayar,
        status: 'Aktif',
        isBlocked: false,
        createdAt: serverTimestamp()
      };

      await addDoc(collection(db, "students"), studentData);

      // 2. SIMPAN PEMBAYARAN
      if (formData.metodeBayar === 'Tunai' || formData.metodeBayar === 'Transfer') {
        await addDoc(collection(db, "finance_logs"), {
          studentId: studentId,
          namaSiswa: formData.nama,
          date: today,
          type: 'Pemasukan',
          category: 'Pendaftaran',
          amount: totalTagihan,
          method: formData.metodeBayar,
          note: `Pendaftaran Baru: ${formData.nama} (${detailProgram}) - LUNAS (${formData.durasiBulan} bulan)`,
          createdAt: serverTimestamp()
        });
      } else if (formData.metodeBayar === 'Cicilan') {
        const cicilanNominal = hitungCicilan();
        const installments = customDueDates.map((dateStr, index) => ({
          bulanKe: index + 1,
          nominal: cicilanNominal,
          status: 'Belum Lunas',
          jatuhTempo: dateStr,
          tanggalBayar: null
        }));

        await addDoc(collection(db, "finance_tagihan"), {
          studentId: studentId,
          namaSiswa: formData.nama,
          noHp: formData.noHp,
          totalTagihan: totalTagihan,
          sisaTagihan: totalTagihan,
          detailCicilan: installments,
          createdAt: serverTimestamp()
        });
      }

      showAlert(`✅ Siswa berhasil didaftarkan! ID: ${studentId}`, 5000);
      
      setTimeout(() => {
        navigate('/admin/students');
      }, 1500);

    } catch (error) {
      console.error("Error:", error);
      showAlert('❌ Gagal menyimpan: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // === RENDER STEP 1 ===
  const renderStep1 = () => (
    <div style={styles.stepContent}>
      <div style={styles.sectionHeader}>
        <User size={20} color="#3b82f6" />
        <h3 style={styles.sectionTitle}>Data Diri Siswa</h3>
      </div>

      <div style={styles.inputGroup}>
        <label style={styles.label}>Nama Lengkap *</label>
        <input 
          style={styles.input} 
          placeholder="Nama lengkap siswa" 
          value={formData.nama} 
          onChange={e => updateField('nama', e.target.value)} 
          required 
        />
      </div>

      <div style={styles.inputGroup}>
        <label style={styles.label}>
          <Calendar size={12} style={{marginRight: 4}} /> 
          Tanggal Lahir
        </label>
        <div style={styles.tglLahirRow}>
          <select 
            style={{...styles.select, flex: 1}}
            value={tglLahir.hari}
            onChange={e => setTglLahir(prev => ({...prev, hari: e.target.value}))}
          >
            <option value="">Tgl</option>
            {hariOptions.map(h => (
              <option key={h} value={h}>{h}</option>
            ))}
          </select>
          <select 
            style={{...styles.select, flex: 2}}
            value={tglLahir.bulan}
            onChange={e => setTglLahir(prev => ({...prev, bulan: e.target.value}))}
          >
            <option value="">Bulan</option>
            {bulanOptions.map(b => (
              <option key={b.value} value={b.value}>{b.label}</option>
            ))}
          </select>
          <select 
            style={{...styles.select, flex: 1.5}}
            value={tglLahir.tahun}
            onChange={e => setTglLahir(prev => ({...prev, tahun: e.target.value}))}
          >
            <option value="">Tahun</option>
            {tahunOptions.map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>
        {getTanggalLahirStr() && (
          <div style={styles.tglPreview}>📅 {getTanggalLahirStr()}</div>
        )}
      </div>

      <div style={styles.row2}>
        <div style={styles.inputGroup}>
          <label style={styles.label}>Tempat Lahir</label>
          <input 
            style={styles.input} 
            placeholder="Kota" 
            value={formData.tempatLahir} 
            onChange={e => updateField('tempatLahir', e.target.value)} 
          />
        </div>
        <div style={styles.inputGroup}>
          <label style={styles.label}>Kelas Sekolah</label>
          <select style={styles.input} value={formData.kelasSekolah} onChange={e => updateField('kelasSekolah', e.target.value)}>
            <option value="1 SD">1 SD</option><option value="2 SD">2 SD</option>
            <option value="3 SD">3 SD</option><option value="4 SD">4 SD</option>
            <option value="5 SD">5 SD</option><option value="6 SD">6 SD</option>
            <option value="7 SMP">7 SMP</option><option value="8 SMP">8 SMP</option>
            <option value="9 SMP">9 SMP</option>
            <option value="10 SMA">10 SMA</option><option value="11 SMA">11 SMA</option>
            <option value="12 SMA">12 SMA</option>
            <option value="Alumni">Alumni</option>
          </select>
        </div>
      </div>

      <div style={styles.sectionHeader}>
        <Phone size={20} color="#3b82f6" />
        <h3 style={styles.sectionTitle}>Kontak & Orang Tua</h3>
      </div>

      <div style={styles.inputGroup}>
        <label style={styles.label}>No HP / WhatsApp *</label>
        <input type="tel" style={styles.input} placeholder="628xxx" value={formData.noHp} onChange={e => updateField('noHp', e.target.value)} required />
      </div>

      <div style={styles.inputGroup}>
        <label style={styles.label}>Alamat</label>
        <textarea style={styles.textarea} placeholder="Alamat lengkap..." value={formData.alamat} onChange={e => updateField('alamat', e.target.value)} rows={2} />
      </div>

      <div style={styles.row2}>
        <div style={styles.inputGroup}>
          <label style={styles.label}>Nama Ayah</label>
          <input style={styles.input} placeholder="Nama ayah" value={formData.namaAyah} onChange={e => updateField('namaAyah', e.target.value)} />
        </div>
        <div style={styles.inputGroup}>
          <label style={styles.label}>Nama Ibu</label>
          <input style={styles.input} placeholder="Nama ibu" value={formData.namaIbu} onChange={e => updateField('namaIbu', e.target.value)} />
        </div>
      </div>
    </div>
  );

  // === RENDER STEP 2 ===
  const renderStep2 = () => {
    const paketOptions = getPaketOptions();
    const selectedPkg = getSelectedPackage();

    return (
      <div style={styles.stepContent}>
        <div style={styles.sectionHeader}>
          <BookOpen size={20} color="#8b5cf6" />
          <h3 style={styles.sectionTitle}>Program & Paket Belajar</h3>
        </div>

        <div style={styles.inputGroup}>
          <label style={styles.label}>Jenis Program</label>
          <div style={styles.tabRow}>
            <button type="button" onClick={() => updateField('programType', 'Reguler')} style={styles.tabBtn(formData.programType === 'Reguler')}>📚 Bimbel Reguler</button>
            <button type="button" onClick={() => updateField('programType', 'English')} style={styles.tabBtn(formData.programType === 'English', '#8b5cf6')}>🇬🇧 English Course</button>
          </div>
        </div>

        {formData.programType === 'Reguler' ? (
          <div style={styles.row2}>
            <div style={styles.inputGroup}>
              <label style={styles.label}>Jenjang</label>
              <select style={styles.input} value={formData.jenjang} onChange={e => updateField('jenjang', e.target.value)}>
                <option value="SD">SD (Kelas 1-6)</option>
                <option value="SMP">SMP (Kelas 7-9)</option>
                <option value="SMA">SMA (Kelas 10-12)</option>
              </select>
            </div>
            <div style={styles.inputGroup}>
              <label style={styles.label}>Pilih Paket</label>
              <select 
                style={styles.input} 
                value={formData.paketId || ''} 
                onChange={e => updateField('paketId', e.target.value)}
              >
                <option value="">-- Pilih Paket --</option>
                {paketOptions.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.name} - Rp {p.price.toLocaleString()}/bulan
                  </option>
                ))}
              </select>
            </div>
          </div>
        ) : (
          <div style={styles.inputGroup}>
            <label style={styles.label}>Pilih Level</label>
            <select 
              style={styles.input} 
              value={formData.englishLevelId || ''} 
              onChange={e => updateField('englishLevelId', e.target.value)}
            >
              <option value="">-- Pilih Level --</option>
              {paketOptions.map(l => (
                <option key={l.id} value={l.id}>
                  {l.name} - Rp {l.price.toLocaleString()}/bulan
                </option>
              ))}
            </select>
          </div>
        )}

        {selectedPkg && (
          <div style={styles.infoBox}>
            <div style={styles.infoRow}><span>📘 Paket:</span><strong>{selectedPkg.name}</strong></div>
            <div style={styles.infoRow}><span>💰 Harga Bulanan:</span><strong>Rp {selectedPkg.price.toLocaleString()}</strong></div>
          </div>
        )}

        <div style={styles.sectionHeader}>
          <Calendar size={20} color="#8b5cf6" />
          <h3 style={styles.sectionTitle}>Masa Aktif Paket</h3>
        </div>

        <div style={styles.row2}>
          <div style={styles.inputGroup}>
            <label style={styles.label}>Tanggal Mulai</label>
            <input type="date" style={styles.input} value={formData.tanggalMulai} onChange={e => updateField('tanggalMulai', e.target.value)} />
          </div>
          <div style={styles.inputGroup}>
            <label style={styles.label}>Durasi (Bulan)</label>
            <select style={styles.input} value={formData.durasiBulan} onChange={e => updateField('durasiBulan', parseInt(e.target.value))}>
              <option value={1}>1 Bulan</option>
              <option value={3}>3 Bulan (1 Term)</option>
              <option value={6}>6 Bulan (1 Semester)</option>
              <option value={12}>12 Bulan (1 Tahun)</option>
              <option value={24}>24 Bulan (2 Tahun)</option>
            </select>
          </div>
        </div>

        <div style={styles.infoBox}>
          <div style={styles.infoRow}><span>📅 Mulai:</span><strong>{formData.tanggalMulai}</strong></div>
          <div style={styles.infoRow}><span>🏁 Selesai:</span><strong style={{color: '#ef4444'}}>{getTanggalSelesai()}</strong></div>
          <div style={styles.infoRow}><span>⏳ Durasi:</span><strong>{formData.durasiBulan} bulan</strong></div>
          {selectedPkg && (
            <div style={styles.infoRow}><span>💰 Total Paket:</span><strong>Rp {(selectedPkg.price * formData.durasiBulan).toLocaleString()}</strong></div>
          )}
        </div>

        <div style={styles.accountPreview}>
          <div style={styles.accountHeader}><IdCard size={16} /><span>Akun Portal (Auto-generated)</span></div>
          <div style={styles.accountRow}><span style={styles.accountLabel}>Username:</span><code style={styles.accountValue}>{getUsername()}</code></div>
          <div style={styles.accountRow}><span style={styles.accountLabel}>Password:</span><code style={styles.accountValue}>{getPassword()}</code></div>
        </div>
      </div>
    );
  };

  // === RENDER STEP 3 ===
  const renderStep3 = () => {
    const total = hitungTotal();
    const cicilan = hitungCicilan();
    const selectedPkg = getSelectedPackage();

    return (
      <div style={styles.stepContent}>
        <div style={styles.sectionHeader}>
          <CreditCard size={20} color="#10b981" />
          <h3 style={styles.sectionTitle}>Pembayaran</h3>
        </div>

        {selectedPkg && (
          <div style={styles.paymentCard}>
            <div style={styles.paymentRow}>
              <span>Paket {selectedPkg.name} × {formData.durasiBulan} bulan</span>
              <span>Rp {(selectedPkg.price * formData.durasiBulan).toLocaleString()}</span>
            </div>
            <div style={styles.paymentRow}>
              <span><label style={{cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6}}>
                <input type="checkbox" checked={formData.biayaDaftar} onChange={e => updateField('biayaDaftar', e.target.checked)} />
                Biaya Pendaftaran
              </label></span>
              <span>Rp {biayaPendaftaran.toLocaleString()}</span>
            </div>
            <div style={styles.paymentRow}>
              <span>Diskon</span>
              <input type="number" style={styles.diskonInput} value={formData.diskon} onChange={e => updateField('diskon', e.target.value)} placeholder="0" />
            </div>
            <div style={styles.paymentTotal}>
              <span>TOTAL</span>
              <span>Rp {total.toLocaleString()}</span>
            </div>
          </div>
        )}

        <div style={styles.inputGroup}>
          <label style={styles.label}>Metode Pembayaran</label>
          <div style={styles.tabRow3}>
            <button type="button" onClick={() => updateField('metodeBayar', 'Tunai')} style={styles.methodBtn(formData.metodeBayar === 'Tunai')}>💵 Tunai</button>
            <button type="button" onClick={() => updateField('metodeBayar', 'Transfer')} style={styles.methodBtn(formData.metodeBayar === 'Transfer')}>💳 Transfer</button>
            <button type="button" onClick={() => updateField('metodeBayar', 'Cicilan')} style={styles.methodBtn(formData.metodeBayar === 'Cicilan')}>📋 Cicilan</button>
          </div>
        </div>

        {formData.metodeBayar === 'Cicilan' && (
          <div style={styles.cicilanBox}>
            <label style={styles.label}>Tenor Cicilan</label>
            <div style={styles.tenorRow}>
              {[1,2,3,4,5,6].map(t => (
                <button key={t} type="button" onClick={() => updateField('tenor', t)} style={styles.tenorBtn(formData.tenor === t)}>{t}x</button>
              ))}
            </div>
            <div style={styles.inputGroup}>
              <label style={styles.label}>Tanggal Cicilan Pertama</label>
              <input type="date" style={styles.input} value={formData.tanggalCicilan1} onChange={e => updateField('tanggalCicilan1', e.target.value)} />
            </div>
            <div style={styles.cicilanPreview}>
              <p style={{fontWeight: 'bold', marginBottom: 8}}>{formData.tenor}x Cicilan @ Rp {cicilan.toLocaleString()}</p>
              {customDueDates.map((date, idx) => (
                <div key={idx} style={styles.cicilanItem}>
                  <span>Cicilan ke-{idx + 1}</span>
                  <span>{date}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  const totalSteps = 3;
  const stepLabels = ['Biodata', 'Program', 'Pembayaran'];

  return (
    <div style={styles.wrapper}>
      <SidebarAdmin />
      <div style={styles.mainContent(isMobile)}>
        {alertMsg && <div style={styles.toast}>{alertMsg}</div>}
        <div style={styles.header(isMobile)}>
          <button onClick={() => navigate('/admin/students')} style={styles.backBtn}><ArrowLeft size={16} /> Kembali</button>
          <h2 style={styles.pageTitle(isMobile)}><Sparkles size={20} color="#3b82f6" /> Pendaftaran Siswa Baru</h2>
        </div>
        <div style={styles.stepIndicator(isMobile)}>
          {stepLabels.map((label, idx) => (
            <div key={idx} style={styles.stepItem}>
              <div style={styles.stepCircle(idx + 1 === step, idx + 1 < step)}>
                {idx + 1 < step ? <CheckCircle size={16} /> : idx + 1}
              </div>
              <span style={styles.stepLabel(idx + 1 === step)}>{label}</span>
              {idx < totalSteps - 1 && <div style={styles.stepLine} />}
            </div>
          ))}
        </div>
        <div style={styles.card}>
          {step === 1 && renderStep1()}
          {step === 2 && renderStep2()}
          {step === 3 && renderStep3()}
          <div style={styles.navButtons}>
            {step > 1 && (
              <button onClick={() => setStep(step - 1)} style={styles.btnPrev}><ChevronLeft size={16} /> Sebelumnya</button>
            )}
            {step < totalSteps ? (
              <button onClick={() => setStep(step + 1)} style={styles.btnNext}>Selanjutnya <ChevronRight size={16} /></button>
            ) : (
              <button onClick={handleSubmit} style={styles.btnSave} disabled={loading}>
                {loading ? '⏳ Menyimpan...' : <><Save size={16} /> Simpan & Selesai</>}
              </button>
            )}
          </div>
        </div>
      </div>
      <style>{`@keyframes toastIn { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }`}</style>
    </div>
  );
};

// === STYLES ===
const styles = {
  wrapper: { display: 'flex', background: '#f8fafc', minHeight: '100vh' },
  mainContent: (m) => ({ marginLeft: m ? '0' : '250px', padding: m ? '15px' : '30px', width: '100%', boxSizing: 'border-box', transition: '0.3s' }),
  toast: { position: 'fixed', top: 20, right: 20, zIndex: 9999, background: '#1e293b', color: 'white', padding: '14px 24px', borderRadius: 12, fontWeight: 'bold', fontSize: 14, boxShadow: '0 10px 30px rgba(0,0,0,0.2)', animation: 'toastIn 0.3s ease' },
  header: (m) => ({ display: 'flex', alignItems: 'center', gap: 15, marginBottom: 20, flexWrap: 'wrap' }),
  backBtn: { background: 'white', border: '1px solid #e2e8f0', padding: '8px 14px', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: 13, display: 'flex', alignItems: 'center', gap: 6, color: '#64748b' },
  pageTitle: (m) => ({ margin: 0, color: '#1e293b', fontSize: m ? 18 : 22, display: 'flex', alignItems: 'center', gap: 8 }),
  stepIndicator: (m) => ({ display: 'flex', justifyContent: 'center', marginBottom: 20, gap: 0 }),
  stepItem: { display: 'flex', alignItems: 'center', flex: 1, maxWidth: 200 },
  stepCircle: (active, done) => ({ width: 32, height: 32, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 'bold', background: done ? '#10b981' : active ? '#3b82f6' : '#e2e8f0', color: done || active ? 'white' : '#94a3b8', flexShrink: 0 }),
  stepLabel: (active) => ({ fontSize: 11, fontWeight: active ? 'bold' : '500', color: active ? '#1e293b' : '#94a3b8', marginLeft: 6, marginRight: 6, whiteSpace: 'nowrap' }),
  stepLine: { flex: 1, height: 2, background: '#e2e8f0', minWidth: 20 },
  card: { background: 'white', borderRadius: 16, padding: 24, boxShadow: '0 2px 8px rgba(0,0,0,0.04)', border: '1px solid #f1f5f9' },
  stepContent: { minHeight: 300 },
  sectionHeader: { display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16, paddingBottom: 10, borderBottom: '2px solid #f1f5f9' },
  sectionTitle: { margin: 0, fontSize: 15, color: '#1e293b', fontWeight: 'bold' },
  inputGroup: { marginBottom: 14, flex: 1 },
  label: { display: 'block', fontSize: 12, fontWeight: 'bold', color: '#64748b', marginBottom: 5 },
  input: { width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 13, boxSizing: 'border-box', background: '#f8fafc', transition: '0.2s' },
  select: { padding: '10px 8px', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 13, boxSizing: 'border-box', background: '#f8fafc', cursor: 'pointer' },
  textarea: { width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 13, boxSizing: 'border-box', background: '#f8fafc', resize: 'vertical', fontFamily: 'inherit' },
  row2: { display: 'flex', gap: 12, flexWrap: 'wrap' },
  tglLahirRow: { display: 'flex', gap: 6, alignItems: 'center' },
  tglPreview: { marginTop: 6, fontSize: 11, color: '#3b82f6', background: '#eff6ff', padding: '4px 10px', borderRadius: 6, display: 'inline-block' },
  tabRow: { display: 'flex', gap: 8 },
  tabBtn: (active, color = '#3b82f6') => ({ flex: 1, padding: '10px 16px', borderRadius: 10, border: active ? `2px solid ${color}` : '1px solid #e2e8f0', background: active ? '#eff6ff' : 'white', color: active ? color : '#64748b', fontWeight: active ? 'bold' : '500', fontSize: 13, cursor: 'pointer', transition: '0.2s' }),
  infoBox: { background: '#f0f9ff', padding: 14, borderRadius: 10, border: '1px solid #bae6fd', marginTop: 10 },
  infoRow: { display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: 12 },
  accountPreview: { marginTop: 16, background: '#fefce8', padding: 14, borderRadius: 10, border: '1px solid #fef08a' },
  accountHeader: { display: 'flex', alignItems: 'center', gap: 6, fontWeight: 'bold', fontSize: 12, color: '#854d0e', marginBottom: 8 },
  accountRow: { display: 'flex', justifyContent: 'space-between', padding: '3px 0', fontSize: 12 },
  accountLabel: { color: '#64748b' },
  accountValue: { background: 'white', padding: '2px 8px', borderRadius: 4, fontSize: 12, fontWeight: 'bold', color: '#0f172a' },
  paymentCard: { background: '#f0fdf4', padding: 16, borderRadius: 12, border: '1px solid #bbf7d0', marginBottom: 16 },
  paymentRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', fontSize: 13 },
  paymentTotal: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0 0', marginTop: 8, borderTop: '2px solid #bbf7d0', fontSize: 16, fontWeight: 'bold', color: '#166534' },
  diskonInput: { width: 80, padding: '6px 10px', borderRadius: 6, border: '1px solid #e2e8f0', fontSize: 13, textAlign: 'right' },
  tabRow3: { display: 'flex', gap: 8 },
  methodBtn: (active) => ({ flex: 1, padding: '10px', borderRadius: 10, border: active ? '2px solid #10b981' : '1px solid #e2e8f0', background: active ? '#f0fdf4' : 'white', color: active ? '#166534' : '#64748b', fontWeight: active ? 'bold' : '500', fontSize: 12, cursor: 'pointer', transition: '0.2s' }),
  cicilanBox: { background: '#f8fafc', padding: 16, borderRadius: 10, border: '1px solid #e2e8f0', marginTop: 10 },
  tenorRow: { display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 },
  tenorBtn: (active) => ({ padding: '8px 16px', borderRadius: 8, border: active ? '2px solid #f59e0b' : '1px solid #e2e8f0', background: active ? '#fffbeb' : 'white', color: active ? '#b45309' : '#64748b', fontWeight: active ? 'bold' : '500', fontSize: 13, cursor: 'pointer' }),
  cicilanPreview: { background: 'white', padding: 12, borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 11 },
  cicilanItem: { display: 'flex', justifyContent: 'space-between', padding: '3px 0', borderBottom: '1px solid #f1f5f9' },
  navButtons: { display: 'flex', justifyContent: 'space-between', marginTop: 24, paddingTop: 16, borderTop: '1px solid #f1f5f9', gap: 10 },
  btnPrev: { padding: '12px 20px', borderRadius: 10, border: '1px solid #e2e8f0', background: 'white', color: '#64748b', fontWeight: 'bold', fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 },
  btnNext: { padding: '12px 24px', borderRadius: 10, border: 'none', background: '#3b82f6', color: 'white', fontWeight: 'bold', fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, marginLeft: 'auto' },
  btnSave: { padding: '12px 24px', borderRadius: 10, border: 'none', background: '#10b981', color: 'white', fontWeight: 'bold', fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, marginLeft: 'auto' }
};

export default AddStudent;
```