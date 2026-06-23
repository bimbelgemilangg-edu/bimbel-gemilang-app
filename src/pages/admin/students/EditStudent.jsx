import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import SidebarAdmin from '../../../components/SidebarAdmin';
import { db } from '../../../firebase';
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { 
  ArrowLeft, Save, User, BookOpen, Calendar, CreditCard, 
  IdCard, Phone, MapPin, ShieldCheck, Clock, Edit3, X
} from 'lucide-react';

const EditStudent = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [alertMsg, setAlertMsg] = useState(null);

  // === PRICING ===
  const [pricing, setPricing] = useState({
    sd: { paket1: 0, paket2: 0, paket3: 0 },
    smp: { paket1: 0, paket2: 0, paket3: 0 },
    english: { kids: 0, junior: 0, professional: 0 }
  });

  // === TANGGAL LAHIR DROPDOWNS ===
  const [tglLahir, setTglLahir] = useState({ hari: '', bulan: '', tahun: '' });

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

  // Parse YYYY-MM-DD ke dropdown
  const parseTanggalLahir = (dateStr) => {
    if (!dateStr || !dateStr.includes('-')) return;
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      setTglLahir({
        tahun: parts[0],
        bulan: parts[1],
        hari: parseInt(parts[2]).toString()
      });
    }
  };

  // === FORM DATA ===
  const [formData, setFormData] = useState({
    // Biodata
    nama: '',
    studentId: '',
    tempatLahir: '',
    kelasSekolah: '1 SD',
    noHp: '',
    alamat: '',
    namaAyah: '',
    namaIbu: '',
    
    // Program
    programType: 'Reguler',
    jenjang: 'SD',
    paket: 'paket1',
    englishLevel: 'kids',
    
    // Masa Aktif
    tanggalMulai: new Date().toISOString().split('T')[0],
    durasiBulan: 3,
    
    // Akun
    username: '',
    password: '',
    
    // Status
    status: 'Aktif',
    isBlocked: false,
    totalTagihan: 0,
    totalBayar: 0
  });

  // Original data untuk deteksi perubahan
  const [originalData, setOriginalData] = useState(null);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const showAlert = (msg, duration = 3000) => {
    setAlertMsg(msg);
    setTimeout(() => setAlertMsg(null), duration);
  };

  // === FETCH DATA ===
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch pricing
        const settingsRef = doc(db, "settings", "global_config");
        const settingsSnap = await getDoc(settingsRef);
        if (settingsSnap.exists() && settingsSnap.data().prices) {
          setPricing(settingsSnap.data().prices);
        }

        // Fetch student
        const docRef = doc(db, "students", id);
        const docSnap = await getDoc(docRef);
        
        if (!docSnap.exists()) {
          showAlert('❌ Siswa tidak ditemukan!');
          setTimeout(() => navigate('/admin/students'), 1500);
          return;
        }

        const data = docSnap.data();
        
        // Parse detail program
        let jenjang = 'SD';
        let paket = 'paket1';
        let englishLevel = 'kids';
        let programType = data.kategori || 'Reguler';
        
        if (data.detailProgram) {
          const parts = data.detailProgram.split(' - ');
          if (parts.length > 1) {
            jenjang = parts[0];
            paket = parts[1];
          }
        }
        if (programType === 'English') {
          englishLevel = data.paket || 'kids';
        }

        const initialData = {
          nama: data.nama || '',
          studentId: data.studentId || '-',
          tempatLahir: data.tempatLahir || '',
          kelasSekolah: data.kelasSekolah || '1 SD',
          noHp: data.ortu?.hp || '',
          alamat: data.ortu?.alamat || '',
          namaAyah: data.ortu?.ayah || '',
          namaIbu: data.ortu?.ibu || '',
          programType: programType,
          jenjang: programType === 'English' ? 'English' : jenjang,
          paket: paket,
          englishLevel: englishLevel,
          tanggalMulai: data.tanggalMulai || new Date().toISOString().split('T')[0],
          durasiBulan: data.durasiBulan || 3,
          username: data.username || '',
          password: data.password || '',
          status: data.status || 'Aktif',
          isBlocked: data.isBlocked || false,
          totalTagihan: data.totalTagihan || 0,
          totalBayar: data.totalBayar || 0
        };

        setFormData(initialData);
        setOriginalData(initialData);
        parseTanggalLahir(data.tanggalLahir);

      } catch (error) {
        console.error("Error:", error);
        showAlert('❌ Gagal memuat data');
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchData();
  }, [id]);

  const updateField = (field, value) => {
    setFormData(prev => ({...prev, [field]: value}));
  };

  // === HARGA ===
  const getBasePrice = () => {
    if (formData.programType === 'English') {
      return pricing.english ? parseInt(pricing.english[formData.englishLevel] || 0) : 0;
    }
    const level = formData.jenjang.toLowerCase();
    return pricing[level] ? parseInt(pricing[level][formData.paket] || 0) : 0;
  };

  const getTanggalSelesai = () => {
    if (!formData.tanggalMulai) return '-';
    const start = new Date(formData.tanggalMulai);
    start.setMonth(start.getMonth() + parseInt(formData.durasiBulan || 0));
    return start.toISOString().split('T')[0];
  };

  const sisaTagihan = (formData.totalTagihan || 0) - (formData.totalBayar || 0);

  // === DETEKSI PERUBAHAN ===
  const hasChanges = () => {
    if (!originalData) return false;
    const currentTgl = getTanggalLahirStr();
    return JSON.stringify({...formData, tanggalLahir: currentTgl}) !== 
           JSON.stringify({...originalData, tanggalLahir: originalData.tanggalLahir});
  };

  // === SIMPAN ===
  const handleSave = async () => {
    if (!formData.nama) {
      showAlert('⚠️ Nama tidak boleh kosong!');
      return;
    }

    setSaving(true);
    try {
      const tanggalLahirStr = getTanggalLahirStr();
      
      let detailProgramBaru = '';
      if (formData.programType === 'English') {
        detailProgramBaru = `English - ${formData.englishLevel}`;
      } else {
        detailProgramBaru = `${formData.jenjang} - ${formData.paket}`;
      }

      const tanggalSelesai = getTanggalSelesai();

      const docRef = doc(db, "students", id);
      await updateDoc(docRef, {
        nama: formData.nama,
        username: formData.username,
        password: formData.password,
        tempatLahir: formData.tempatLahir,
        tanggalLahir: tanggalLahirStr || originalData?.tanggalLahir || '',
        kelasSekolah: formData.kelasSekolah,
        ortu: {
          ayah: formData.namaAyah,
          ibu: formData.namaIbu,
          alamat: formData.alamat,
          hp: formData.noHp
        },
        kategori: formData.programType,
        jenjang: formData.programType === 'English' ? 'English' : formData.jenjang,
        paket: formData.programType === 'English' ? formData.englishLevel : formData.paket,
        detailProgram: detailProgramBaru,
        tanggalMulai: formData.tanggalMulai,
        tanggalSelesai: tanggalSelesai,
        durasiBulan: parseInt(formData.durasiBulan),
        totalTagihan: parseInt(formData.totalTagihan),
        status: formData.status,
        isBlocked: formData.isBlocked
      });

      showAlert('✅ Data siswa berhasil diperbarui!');
      
      setTimeout(() => {
        navigate('/admin/students');
      }, 1000);

    } catch (error) {
      console.error("Error:", error);
      showAlert('❌ Gagal menyimpan: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div style={styles.wrapper}>
        <SidebarAdmin />
        <div style={styles.mainContent(isMobile)}>
          <div style={styles.loadingState}>
            <div style={styles.spinner}></div>
            <p>Memuat data siswa...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.wrapper}>
      <SidebarAdmin />
      <div style={styles.mainContent(isMobile)}>
        
        {/* TOAST */}
        {alertMsg && <div style={styles.toast}>{alertMsg}</div>}

        {/* HEADER */}
        <div style={styles.header(isMobile)}>
          <button onClick={() => navigate('/admin/students')} style={styles.backBtn}>
            <ArrowLeft size={16} /> Kembali
          </button>
          <h2 style={styles.pageTitle(isMobile)}>
            <Edit3 size={20} color="#f59e0b" /> Edit Data Siswa
          </h2>
        </div>

        {/* === STUDENT CARD === */}
        <div style={styles.studentCard(isMobile)}>
          <div style={styles.studentAvatar}>
            {formData.nama?.charAt(0)?.toUpperCase() || 'S'}
          </div>
          <div style={styles.studentInfo}>
            <h3 style={styles.studentName}>{formData.nama}</h3>
            <div style={styles.studentMeta}>
              <span style={styles.idBadge}>
                <IdCard size={12} /> {formData.studentId}
              </span>
              <span style={styles.programBadge(formData.programType)}>
                {formData.programType === 'English' ? '🇬🇧 English' : '📚 Reguler'}
              </span>
              <span style={styles.statusBadge(formData.isBlocked)}>
                {formData.isBlocked ? '🚫 Blokir' : '✅ Aktif'}
              </span>
            </div>
            <div style={styles.studentDetail}>
              <span>📅 Mulai: {formData.tanggalMulai}</span>
              <span>🏁 Selesai: {getTanggalSelesai()}</span>
              <span>💰 Sisa: Rp {sisaTagihan.toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* FORM GRID */}
        <div style={styles.gridContainer(isMobile)}>
          
          {/* === KOLOM KIRI: BIODATA === */}
          <div style={styles.card}>
            <div style={styles.sectionHeader}>
              <User size={18} color="#3b82f6" />
              <h3 style={styles.sectionTitle}>Biodata Siswa</h3>
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.label}>Nama Lengkap *</label>
              <input 
                style={styles.input} 
                value={formData.nama} 
                onChange={e => updateField('nama', e.target.value)} 
              />
            </div>

            {/* Tanggal Lahir Dropdowns */}
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
              <Phone size={18} color="#3b82f6" />
              <h3 style={styles.sectionTitle}>Kontak & Orang Tua</h3>
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.label}>No HP / WhatsApp</label>
              <input 
                type="tel" 
                style={styles.input} 
                value={formData.noHp} 
                onChange={e => updateField('noHp', e.target.value)} 
              />
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.label}>Alamat</label>
              <textarea 
                style={styles.textarea} 
                value={formData.alamat} 
                onChange={e => updateField('alamat', e.target.value)} 
                rows={2}
              />
            </div>

            <div style={styles.row2}>
              <div style={styles.inputGroup}>
                <label style={styles.label}>Nama Ayah</label>
                <input 
                  style={styles.input} 
                  value={formData.namaAyah} 
                  onChange={e => updateField('namaAyah', e.target.value)} 
                />
              </div>
              <div style={styles.inputGroup}>
                <label style={styles.label}>Nama Ibu</label>
                <input 
                  style={styles.input} 
                  value={formData.namaIbu} 
                  onChange={e => updateField('namaIbu', e.target.value)} 
                />
              </div>
            </div>
          </div>

          {/* === KOLOM KANAN: PROGRAM & AKUN === */}
          <div style={{display: 'flex', flexDirection: 'column', gap: 15}}>
            
            {/* Program & Masa Aktif */}
            <div style={styles.card}>
              <div style={styles.sectionHeader}>
                <BookOpen size={18} color="#8b5cf6" />
                <h3 style={styles.sectionTitle}>Program & Masa Aktif</h3>
              </div>

              <div style={styles.inputGroup}>
                <label style={styles.label}>Jenis Program</label>
                <div style={styles.tabRow}>
                  <button 
                    type="button"
                    onClick={() => updateField('programType', 'Reguler')}
                    style={styles.tabBtn(formData.programType === 'Reguler')}
                  >
                    📚 Reguler
                  </button>
                  <button 
                    type="button"
                    onClick={() => updateField('programType', 'English')}
                    style={styles.tabBtn(formData.programType === 'English', '#8b5cf6')}
                  >
                    🇬🇧 English
                  </button>
                </div>
              </div>

              {formData.programType === 'Reguler' ? (
                <div style={styles.row2}>
                  <div style={styles.inputGroup}>
                    <label style={styles.label}>Jenjang</label>
                    <select style={styles.input} value={formData.jenjang} onChange={e => updateField('jenjang', e.target.value)}>
                      <option value="SD">SD</option>
                      <option value="SMP">SMP</option>
                      <option value="SMA">SMA</option>
                    </select>
                  </div>
                  <div style={styles.inputGroup}>
                    <label style={styles.label}>Paket</label>
                    <select style={styles.input} value={formData.paket} onChange={e => updateField('paket', e.target.value)}>
                      <option value="paket1">Paket 1</option>
                      <option value="paket2">Paket 2</option>
                      <option value="paket3">Paket 3</option>
                    </select>
                  </div>
                </div>
              ) : (
                <div style={styles.inputGroup}>
                  <label style={styles.label}>Level</label>
                  <select style={styles.input} value={formData.englishLevel} onChange={e => updateField('englishLevel', e.target.value)}>
                    <option value="kids">Kids</option>
                    <option value="junior">Junior</option>
                    <option value="professional">Professional</option>
                  </select>
                </div>
              )}

              {/* Masa Aktif */}
              <div style={styles.infoBox}>
                <p style={{fontWeight: 'bold', marginBottom: 8, fontSize: 12}}>📅 Masa Aktif Paket</p>
                <div style={styles.row2}>
                  <div style={styles.inputGroup}>
                    <label style={styles.labelSmall}>Tanggal Mulai</label>
                    <input 
                      type="date" 
                      style={styles.input} 
                      value={formData.tanggalMulai} 
                      onChange={e => updateField('tanggalMulai', e.target.value)} 
                    />
                  </div>
                  <div style={styles.inputGroup}>
                    <label style={styles.labelSmall}>Durasi</label>
                    <select style={styles.input} value={formData.durasiBulan} onChange={e => updateField('durasiBulan', e.target.value)}>
                      <option value={1}>1 Bulan</option>
                      <option value={3}>3 Bulan</option>
                      <option value={6}>6 Bulan</option>
                      <option value={12}>12 Bulan</option>
                    </select>
                  </div>
                </div>
                <div style={styles.masaInfo}>
                  <span>🏁 Selesai: <strong style={{color: '#ef4444'}}>{getTanggalSelesai()}</strong></span>
                </div>
              </div>
            </div>

            {/* Akun Portal */}
            <div style={styles.card}>
              <div style={styles.sectionHeader}>
                <IdCard size={18} color="#f59e0b" />
                <h3 style={styles.sectionTitle}>Akun Portal</h3>
              </div>
              <div style={styles.inputGroup}>
                <label style={styles.label}>Username</label>
                <input 
                  style={styles.input} 
                  value={formData.username} 
                  onChange={e => updateField('username', e.target.value)} 
                />
              </div>
              <div style={styles.inputGroup}>
                <label style={styles.label}>Password</label>
                <input 
                  style={styles.input} 
                  value={formData.password} 
                  onChange={e => updateField('password', e.target.value)} 
                />
              </div>
            </div>

            {/* Keuangan */}
            <div style={styles.card}>
              <div style={styles.sectionHeader}>
                <CreditCard size={18} color="#10b981" />
                <h3 style={styles.sectionTitle}>Keuangan</h3>
              </div>
              <div style={styles.financeRow}>
                <span>Total Tagihan</span>
                <input 
                  type="number" 
                  style={styles.financeInput}
                  value={formData.totalTagihan} 
                  onChange={e => updateField('totalTagihan', e.target.value)} 
                />
              </div>
              <div style={styles.financeRow}>
                <span>Sudah Bayar</span>
                <span style={{fontWeight: 'bold', color: '#10b981'}}>Rp {formData.totalBayar?.toLocaleString()}</span>
              </div>
              <div style={styles.financeRow}>
                <span>Sisa Tagihan</span>
                <span style={{fontWeight: 'bold', color: sisaTagihan > 0 ? '#ef4444' : '#10b981'}}>
                  Rp {sisaTagihan.toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* === ACTION BUTTONS === */}
        <div style={styles.actionBar}>
          <button 
            onClick={() => navigate('/admin/students')} 
            style={styles.btnCancel}
          >
            <X size={16} /> Batal
          </button>
          <button 
            onClick={handleSave} 
            style={styles.btnSave}
            disabled={saving}
          >
            {saving ? (
              '⏳ Menyimpan...'
            ) : (
              <><Save size={16} /> Simpan Perubahan</>
            )}
          </button>
        </div>

      </div>

      <style>{`
        @keyframes toastIn {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

// === STYLES ===
const styles = {
  wrapper: { display: 'flex', background: '#f8fafc', minHeight: '100vh' },
  mainContent: (m) => ({ 
    marginLeft: m ? '0' : '250px', 
    padding: m ? '15px' : '30px', 
    width: '100%', 
    boxSizing: 'border-box',
    transition: '0.3s'
  }),

  // Toast & Loading
  toast: { 
    position: 'fixed', top: 20, right: 20, zIndex: 9999, 
    background: '#1e293b', color: 'white', padding: '14px 24px', 
    borderRadius: 12, fontWeight: 'bold', fontSize: 14, 
    boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
    animation: 'toastIn 0.3s ease'
  },
  loadingState: { textAlign: 'center', padding: 80 },
  spinner: { 
    width: 40, height: 40, border: '4px solid #e2e8f0', 
    borderTop: '4px solid #3b82f6', borderRadius: '50%', 
    animation: 'spin 1s linear infinite', margin: '0 auto 15px' 
  },

  // Header
  header: (m) => ({ 
    display: 'flex', alignItems: 'center', gap: 15, 
    marginBottom: 20, flexWrap: 'wrap' 
  }),
  backBtn: { 
    background: 'white', border: '1px solid #e2e8f0', padding: '8px 14px', 
    borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: 13, 
    display: 'flex', alignItems: 'center', gap: 6, color: '#64748b' 
  },
  pageTitle: (m) => ({ 
    margin: 0, color: '#1e293b', fontSize: m ? 18 : 22, 
    display: 'flex', alignItems: 'center', gap: 8 
  }),

  // Student Card
  studentCard: (m) => ({ 
    display: 'flex', alignItems: 'center', gap: 16,
    background: 'white', padding: m ? 15 : 20, 
    borderRadius: 14, marginBottom: 20,
    boxShadow: '0 2px 8px rgba(0,0,0,0.04)', border: '1px solid #f1f5f9',
    flexWrap: m ? 'wrap' : 'nowrap'
  }),
  studentAvatar: { 
    width: 56, height: 56, borderRadius: '50%', 
    background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)', 
    color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 24, fontWeight: 'bold', flexShrink: 0
  },
  studentInfo: { flex: 1, minWidth: 0 },
  studentName: { margin: 0, fontSize: 18, color: '#1e293b' },
  studentMeta: { display: 'flex', gap: 8, marginTop: 4, flexWrap: 'wrap', alignItems: 'center' },
  studentDetail: { display: 'flex', gap: 16, marginTop: 6, fontSize: 11, color: '#64748b', flexWrap: 'wrap' },
  idBadge: { 
    display: 'inline-flex', alignItems: 'center', gap: 4,
    background: '#f1f5f9', padding: '3px 10px', borderRadius: 10,
    fontSize: 11, fontWeight: 'bold', color: '#475569'
  },
  programBadge: (kat) => ({ 
    padding: '3px 10px', borderRadius: 10, fontSize: 11, fontWeight: 'bold',
    background: kat === 'English' ? '#e0e7ff' : '#f0fdf4', 
    color: kat === 'English' ? '#3730a3' : '#166534'
  }),
  statusBadge: (blocked) => ({ 
    padding: '3px 10px', borderRadius: 10, fontSize: 11, fontWeight: 'bold',
    background: blocked ? '#fee2e2' : '#dcfce7', 
    color: blocked ? '#ef4444' : '#166534'
  }),

  // Grid
  gridContainer: (m) => ({ 
    display: 'grid', 
    gridTemplateColumns: m ? '1fr' : '1fr 400px', 
    gap: 20 
  }),

  // Card
  card: { 
    background: 'white', padding: 20, borderRadius: 14, 
    boxShadow: '0 2px 8px rgba(0,0,0,0.04)', border: '1px solid #f1f5f9' 
  },

  // Section
  sectionHeader: { 
    display: 'flex', alignItems: 'center', gap: 8, 
    marginBottom: 16, paddingBottom: 10, borderBottom: '2px solid #f1f5f9' 
  },
  sectionTitle: { margin: 0, fontSize: 14, color: '#1e293b', fontWeight: 'bold' },

  // Input
  inputGroup: { marginBottom: 14, flex: 1 },
  label: { display: 'block', fontSize: 12, fontWeight: 'bold', color: '#64748b', marginBottom: 5 },
  labelSmall: { display: 'block', fontSize: 10, fontWeight: 'bold', color: '#94a3b8', marginBottom: 3 },
  input: { 
    width: '100%', padding: '10px 12px', borderRadius: 8, 
    border: '1px solid #e2e8f0', fontSize: 13, boxSizing: 'border-box',
    background: '#f8fafc'
  },
  select: {
    padding: '10px 8px', borderRadius: 8,
    border: '1px solid #e2e8f0', fontSize: 13, boxSizing: 'border-box',
    background: '#f8fafc', cursor: 'pointer'
  },
  textarea: { 
    width: '100%', padding: '10px 12px', borderRadius: 8, 
    border: '1px solid #e2e8f0', fontSize: 13, boxSizing: 'border-box',
    background: '#f8fafc', resize: 'vertical', fontFamily: 'inherit'
  },
  row2: { display: 'flex', gap: 12, flexWrap: 'wrap' },

  // Tanggal Lahir
  tglLahirRow: { display: 'flex', gap: 6, alignItems: 'center' },
  tglPreview: { 
    marginTop: 6, fontSize: 11, color: '#3b82f6', 
    background: '#eff6ff', padding: '4px 10px', borderRadius: 6,
    display: 'inline-block'
  },

  // Tabs
  tabRow: { display: 'flex', gap: 8 },
  tabBtn: (active, color = '#3b82f6') => ({ 
    flex: 1, padding: '8px 12px', borderRadius: 8, 
    border: active ? `2px solid ${color}` : '1px solid #e2e8f0',
    background: active ? '#eff6ff' : 'white',
    color: active ? color : '#64748b',
    fontWeight: active ? 'bold' : '500',
    fontSize: 12, cursor: 'pointer', transition: '0.2s'
  }),

  // Info Box
  infoBox: { 
    background: '#f0f9ff', padding: 14, borderRadius: 10, 
    border: '1px solid #bae6fd', marginTop: 10 
  },
  masaInfo: { 
    marginTop: 8, fontSize: 12, 
    background: '#fef2f2', padding: '6px 10px', borderRadius: 6 
  },

  // Finance
  financeRow: { 
    display: 'flex', justifyContent: 'space-between', 
    alignItems: 'center', padding: '8px 0', 
    borderBottom: '1px solid #f1f5f9', fontSize: 13 
  },
  financeInput: { 
    width: 120, padding: '6px 10px', borderRadius: 6, 
    border: '1px solid #e2e8f0', fontSize: 13, textAlign: 'right' 
  },

  // Action Buttons
  actionBar: { 
    display: 'flex', justifyContent: 'flex-end', gap: 10, 
    marginTop: 20, paddingTop: 16, borderTop: '1px solid #f1f5f9'
  },
  btnCancel: { 
    padding: '12px 24px', borderRadius: 10, 
    border: '1px solid #e2e8f0', background: 'white',
    color: '#64748b', fontWeight: 'bold', fontSize: 13, 
    cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 
  },
  btnSave: { 
    padding: '12px 24px', borderRadius: 10, 
    border: 'none', background: '#f59e0b',
    color: 'white', fontWeight: 'bold', fontSize: 13, 
    cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 
  }
};

export default EditStudent;