// src/pages/admin/students/EditStudent.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import SidebarAdmin from '../../../components/SidebarAdmin';
import { db } from '../../../firebase';
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { 
  ArrowLeft, Save, User, BookOpen, Calendar, CreditCard, 
  IdCard, Phone, Edit3, X, AlertCircle, Hash
} from 'lucide-react';

const EditStudent = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [alertMsg, setAlertMsg] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);

  // ============================================================
  // PRICING FROM SETTINGS (SAMA DENGAN ADD STUDENT)
  // ============================================================
  const [pricing, setPricing] = useState({
    sd: { packages: [] },
    smp: { packages: [] },
    sma: { packages: [] },
    english: { levels: [] }
  });
  const [biayaPendaftaran, setBiayaPendaftaran] = useState(25000);

  // ============================================================
  // TANGGAL LAHIR DROPDOWNS
  // ============================================================
  const [tglLahir, setTglLahir] = useState({ hari: '', bulan: '', tahun: '' });
  const currentYear = new Date().getFullYear();
  const tahunOptions = [];
  for (let y = currentYear; y >= 1995; y--) tahunOptions.push(y);
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
      return `${tglLahir.tahun}-${tglLahir.bulan}-${String(tglLahir.hari).padStart(2, '0')}`;
    }
    return '';
  };

  const parseTanggalLahir = (dateStr) => {
    if (!dateStr || !dateStr.includes('-')) return;
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      setTglLahir({ tahun: parts[0], bulan: parts[1], hari: parseInt(parts[2]).toString() });
    }
  };

  // ============================================================
  // FORM DATA
  // ============================================================
  const [formData, setFormData] = useState({
    nama: '', 
    studentId: '', 
    tempatLahir: '', 
    kelasSekolah: '1 SD',
    noHp: '', 
    alamat: '', 
    namaAyah: '', 
    namaIbu: '',
    programType: 'Reguler', 
    jenjang: 'SD', 
    paketId: null,
    englishLevelId: null,
    tanggalMulai: new Date().toISOString().split('T')[0], 
    durasiBulan: 3,
    username: '', 
    password: '',
    status: 'Aktif', 
    isBlocked: false,
    totalTagihan: 0, 
    totalBayar: 0
  });

  const [originalData, setOriginalData] = useState(null);

  // ============================================================
  // EFFECTS
  // ============================================================
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const showAlert = (msg, duration = 3000) => { 
    setAlertMsg(msg); 
    setTimeout(() => setAlertMsg(null), duration); 
  };
  
  const showError = (msg, duration = 5000) => { 
    setErrorMsg(msg); 
    setTimeout(() => setErrorMsg(null), duration); 
  };

  // ============================================================
  // FETCH DATA - PERBAIKAN: HAPUS pricing dari dependency
  // ============================================================
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // 1. Fetch settings (pricing)
        const settingsRef = doc(db, "settings", "global_config");
        const settingsSnap = await getDoc(settingsRef);
        let pricingData = {
          sd: { packages: [] },
          smp: { packages: [] },
          sma: { packages: [] },
          english: { levels: [] }
        };
        
        if (settingsSnap.exists()) {
          const data = settingsSnap.data();
          if (data.prices) {
            pricingData = {
              sd: data.prices.sd || { packages: [] },
              smp: data.prices.smp || { packages: [] },
              sma: data.prices.sma || { packages: [] },
              english: data.prices.english || { levels: [] }
            };
          }
          if (data.biayaPendaftaran) {
            setBiayaPendaftaran(data.biayaPendaftaran);
          }
        }
        setPricing(pricingData);

        // 2. Fetch student data
        const docRef = doc(db, "students", id);
        const docSnap = await getDoc(docRef);
        if (!docSnap.exists()) { 
          showAlert('❌ Siswa tidak ditemukan!'); 
          setTimeout(() => navigate('/admin/students'), 1500); 
          return; 
        }

        const data = docSnap.data();
        
        // Parse paketId dari data
        let paketId = null;
        let englishLevelId = null;
        let jenjang = 'SD';
        
        if (data.kategori === 'English') {
          englishLevelId = data.paket || data.englishLevel || 'kids';
          jenjang = 'English';
        } else {
          jenjang = data.jenjang || 'SD';
          const pkgName = data.paket || data.paketNama || '';
          const packages = pricingData[jenjang.toLowerCase()]?.packages || [];
          const found = packages.find(p => p.name === pkgName || p.id === pkgName);
          paketId = found?.id || data.paket || null;
        }

        const initial = {
          nama: data.nama || '',
          studentId: data.studentId || '-',
          tempatLahir: data.tempatLahir || '',
          kelasSekolah: data.kelasSekolah || '1 SD',
          noHp: data.ortu?.hp || '',
          alamat: data.ortu?.alamat || '',
          namaAyah: data.ortu?.ayah || '',
          namaIbu: data.ortu?.ibu || '',
          programType: data.kategori || 'Reguler',
          jenjang: jenjang,
          paketId: paketId,
          englishLevelId: englishLevelId,
          tanggalMulai: data.tanggalMulai || new Date().toISOString().split('T')[0],
          durasiBulan: data.durasiBulan || 3,
          username: data.username || '',
          password: data.password || '',
          status: data.status || 'Aktif',
          isBlocked: data.isBlocked || false,
          totalTagihan: data.totalTagihan || 0,
          totalBayar: data.totalBayar || 0
        };

        setFormData(initial);
        setOriginalData(initial);
        parseTanggalLahir(data.tanggalLahir);
        
      } catch (e) { 
        console.error(e); 
        showAlert('❌ Gagal memuat data'); 
      }
      finally { setLoading(false); }
    };
    
    if (id) fetchData();
  }, [id]); // ← HANYA [id], BUKAN [id, pricing]!

  // ============================================================
  // HELPER FUNCTIONS
  // ============================================================
  const updateField = (field, value) => setFormData(prev => ({...prev, [field]: value}));

  const getTanggalSelesai = () => {
    if (!formData.tanggalMulai) return '-';
    const start = new Date(formData.tanggalMulai);
    start.setMonth(start.getMonth() + parseInt(formData.durasiBulan || 0));
    return start.toISOString().split('T')[0];
  };

  // ============================================================
  // GET PAKET OPTIONS (SAMA DENGAN ADD STUDENT)
  // ============================================================
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

  const getSelectedPackage = () => {
    if (formData.programType === 'English') {
      return pricing.english.levels.find(l => l.id === formData.englishLevelId);
    }
    const jenjang = formData.jenjang.toLowerCase();
    return pricing[jenjang]?.packages?.find(p => p.id === formData.paketId);
  };

  // ============================================================
  // VALIDASI & SIMPAN
  // ============================================================
  const validateTotalTagihan = (value) => {
    const newTotal = parseInt(value) || 0;
    const bayar = parseInt(formData.totalBayar) || 0;
    if (newTotal < bayar) {
      showError(`⚠️ Total tagihan (${newTotal.toLocaleString()}) tidak boleh lebih kecil dari yang sudah dibayar (${bayar.toLocaleString()})!`);
      return false;
    }
    setErrorMsg(null);
    return true;
  };

  const handleTotalChange = (e) => {
    const value = e.target.value;
    updateField('totalTagihan', value);
    const newTotal = parseInt(value) || 0;
    const bayar = parseInt(formData.totalBayar) || 0;
    if (newTotal < bayar) {
      setErrorMsg(`⚠️ Total tidak boleh < Rp ${bayar.toLocaleString()} (sudah dibayar)`);
    } else {
      setErrorMsg(null);
    }
  };

  // ============================================================
  // SUBMIT
  // ============================================================
  const handleSave = async () => {
    if (!formData.nama) return showAlert('⚠️ Nama tidak boleh kosong!');

    const total = parseInt(formData.totalTagihan) || 0;
    const bayar = parseInt(formData.totalBayar) || 0;
    if (total < bayar) {
      return showError('❌ Gagal: Total tagihan tidak boleh lebih kecil dari total yang sudah dibayar!');
    }

    const pkg = getSelectedPackage();
    const paketName = pkg?.name || formData.paketId || 'Paket Default';
    const detailProgram = formData.programType === 'English' 
      ? `English - ${paketName}` 
      : `${formData.jenjang} - ${paketName}`;

    setSaving(true);
    try {
      const tanggalLahirStr = getTanggalLahirStr();
      
      await updateDoc(doc(db, "students", id), {
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
        paket: formData.programType === 'English' ? formData.englishLevelId : formData.paketId,
        paketNama: paketName,
        detailProgram: detailProgram,
        tanggalMulai: formData.tanggalMulai,
        tanggalSelesai: getTanggalSelesai(),
        durasiBulan: parseInt(formData.durasiBulan),
        totalTagihan: total,
        status: formData.status,
        isBlocked: formData.isBlocked,
        updatedAt: new Date().toISOString()
      });

      showAlert('✅ Data siswa berhasil diperbarui!');
      setTimeout(() => navigate('/admin/students'), 1000);
    } catch (e) { 
      console.error(e); 
      showAlert('❌ Gagal menyimpan: ' + e.message); 
    }
    finally { setSaving(false); }
  };

  // ============================================================
  // RENDER
  // ============================================================
  if (loading) {
    return (
      <div style={styles.wrapper}>
        <SidebarAdmin />
        <div style={styles.mainContent(isMobile)}>
          <div style={styles.loadingState}>
            <div style={styles.spinner}></div>
            <p>Memuat data...</p>
          </div>
        </div>
      </div>
    );
  }

  const sisaTagihan = (formData.totalTagihan || 0) - (formData.totalBayar || 0);
  const selectedPkg = getSelectedPackage();
  const paketOptions = getPaketOptions();

  return (
    <div style={styles.wrapper}>
      <SidebarAdmin />
      <div style={styles.mainContent(isMobile)}>
        {alertMsg && <div style={styles.toast}>{alertMsg}</div>}
        {errorMsg && <div style={styles.errorToast}>{errorMsg}</div>}

        <div style={styles.header(isMobile)}>
          <button onClick={() => navigate('/admin/students')} style={styles.backBtn}>
            <ArrowLeft size={16} /> Kembali
          </button>
          <h2 style={styles.pageTitle(isMobile)}>
            <Edit3 size={20} color="#f59e0b" /> Edit Data Siswa
          </h2>
        </div>

        {/* Student Card */}
        <div style={styles.studentCard(isMobile)}>
          <div style={styles.studentAvatar}>
            {formData.nama?.charAt(0)?.toUpperCase() || 'S'}
          </div>
          <div style={styles.studentInfo}>
            <h3 style={styles.studentName}>{formData.nama}</h3>
            <div style={styles.studentMeta}>
              <span style={styles.idBadge}>
                <Hash size={12} /> {formData.studentId}
              </span>
              <span style={styles.programBadge(formData.programType)}>
                {formData.programType === 'English' ? '🇬🇧 English' : '📚 Reguler'}
              </span>
              <span style={styles.statusBadge(formData.isBlocked)}>
                {formData.isBlocked ? '🚫 Blokir' : '✅ Aktif'}
              </span>
            </div>
          </div>
        </div>

        <div style={styles.gridContainer(isMobile)}>
          {/* KIRI: Biodata */}
          <div style={styles.card}>
            <div style={styles.sectionHeader}>
              <User size={18} color="#3b82f6" />
              <h3 style={styles.sectionTitle}>Biodata</h3>
            </div>
            
            <div style={styles.inputGroup}>
              <label style={styles.label}>Nama Lengkap *</label>
              <input 
                style={styles.input} 
                value={formData.nama} 
                onChange={e => updateField('nama', e.target.value)} 
              />
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.label}>
                <Calendar size={12} style={{marginRight: 4}} /> Tanggal Lahir
              </label>
              <div style={styles.tglLahirRow}>
                <select 
                  style={{...styles.select, flex: 1}} 
                  value={tglLahir.hari} 
                  onChange={e => setTglLahir(prev => ({...prev, hari: e.target.value}))}
                >
                  <option value="">Tgl</option>
                  {hariOptions.map(h => <option key={h} value={h}>{h}</option>)}
                </select>
                <select 
                  style={{...styles.select, flex: 2}} 
                  value={tglLahir.bulan} 
                  onChange={e => setTglLahir(prev => ({...prev, bulan: e.target.value}))}
                >
                  <option value="">Bulan</option>
                  {bulanOptions.map(b => <option key={b.value} value={b.value}>{b.label}</option>)}
                </select>
                <select 
                  style={{...styles.select, flex: 1.5}} 
                  value={tglLahir.tahun} 
                  onChange={e => setTglLahir(prev => ({...prev, tahun: e.target.value}))}
                >
                  <option value="">Tahun</option>
                  {tahunOptions.map(y => <option key={y} value={y}>{y}</option>)}
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
                <select 
                  style={styles.input} 
                  value={formData.kelasSekolah} 
                  onChange={e => updateField('kelasSekolah', e.target.value)}
                >
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

          {/* KANAN: Program + Akun + Keuangan */}
          <div style={{display: 'flex', flexDirection: 'column', gap: 15}}>
            <div style={styles.card}>
              <div style={styles.sectionHeader}>
                <BookOpen size={18} color="#8b5cf6" />
                <h3 style={styles.sectionTitle}>Program & Paket</h3>
              </div>

              <div style={styles.inputGroup}>
                <label style={styles.label}>Jenis Program</label>
                <div style={styles.tabRow}>
                  <button 
                    type="button" 
                    onClick={() => {
                      updateField('programType', 'Reguler');
                      updateField('jenjang', 'SD');
                      updateField('paketId', null);
                    }} 
                    style={styles.tabBtn(formData.programType === 'Reguler')}
                  >
                    📚 Reguler
                  </button>
                  <button 
                    type="button" 
                    onClick={() => {
                      updateField('programType', 'English');
                      updateField('jenjang', 'English');
                      updateField('englishLevelId', null);
                    }} 
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
                    <select 
                      style={styles.input} 
                      value={formData.jenjang} 
                      onChange={e => {
                        updateField('jenjang', e.target.value);
                        updateField('paketId', null);
                      }}
                    >
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
                  <div style={styles.infoRow}>
                    <span>📘 Paket:</span>
                    <strong>{selectedPkg.name}</strong>
                  </div>
                  <div style={styles.infoRow}>
                    <span>💰 Harga Bulanan:</span>
                    <strong>Rp {selectedPkg.price.toLocaleString()}</strong>
                  </div>
                </div>
              )}

              <div style={styles.sectionHeader}>
                <Calendar size={18} color="#8b5cf6" />
                <h3 style={styles.sectionTitle}>Masa Aktif Paket</h3>
              </div>

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
                  <label style={styles.labelSmall}>Durasi (Bulan)</label>
                  <select 
                    style={styles.input} 
                    value={formData.durasiBulan} 
                    onChange={e => updateField('durasiBulan', parseInt(e.target.value))}
                  >
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
                  <div style={styles.infoRow}>
                    <span>💰 Total Paket:</span>
                    <strong>Rp {(selectedPkg.price * formData.durasiBulan).toLocaleString()}</strong>
                  </div>
                )}
              </div>
            </div>

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
                  placeholder="Kosongkan jika tidak diubah"
                />
              </div>
            </div>

            <div style={styles.card}>
              <div style={styles.sectionHeader}>
                <CreditCard size={18} color="#10b981" />
                <h3 style={styles.sectionTitle}>Keuangan</h3>
              </div>
              <div style={styles.financeRow}>
                <span>Total Tagihan</span>
                <input 
                  type="number" 
                  style={{...styles.financeInput, border: errorMsg ? '2px solid #ef4444' : '1px solid #e2e8f0'}} 
                  value={formData.totalTagihan} 
                  onChange={handleTotalChange} 
                />
              </div>
              {errorMsg && (
                <div style={{fontSize: 10, color: '#ef4444', marginTop: -8, marginBottom: 8}}>
                  <AlertCircle size={10} /> {errorMsg}
                </div>
              )}
              <div style={styles.financeRow}>
                <span>Sudah Dibayar</span>
                <span style={{fontWeight: 'bold', color: '#10b981'}}>
                  Rp {formData.totalBayar?.toLocaleString()}
                </span>
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

        <div style={styles.actionBar}>
          <button onClick={() => navigate('/admin/students')} style={styles.btnCancel}>
            <X size={16} /> Batal
          </button>
          <button 
            onClick={handleSave} 
            style={styles.btnSave} 
            disabled={saving || !!errorMsg}
          >
            {saving ? '⏳ Menyimpan...' : <><Save size={16} /> Simpan</>}
          </button>
        </div>
      </div>
      <style>{`
        @keyframes toastIn { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
};

// ============================================================
// STYLES
// ============================================================
const styles = {
  wrapper: { display: 'flex', background: '#f8fafc', minHeight: '100vh' },
  mainContent: (m) => ({ 
    marginLeft: m ? '0' : '250px', 
    padding: m ? '15px' : '30px', 
    width: '100%', 
    boxSizing: 'border-box', 
    transition: '0.3s' 
  }),
  
  toast: { 
    position: 'fixed', top: 20, right: 20, zIndex: 9999, 
    background: '#1e293b', color: 'white', 
    padding: '14px 24px', borderRadius: 12, 
    fontWeight: 'bold', fontSize: 14, 
    boxShadow: '0 10px 30px rgba(0,0,0,0.2)', 
    animation: 'toastIn 0.3s ease' 
  },
  
  errorToast: { 
    position: 'fixed', top: 70, right: 20, zIndex: 9999, 
    background: '#fee2e2', color: '#991b1b', 
    padding: '14px 24px', borderRadius: 12, 
    fontWeight: 'bold', fontSize: 13, 
    boxShadow: '0 10px 30px rgba(0,0,0,0.2)', 
    animation: 'toastIn 0.3s ease', 
    border: '2px solid #ef4444' 
  },
  
  loadingState: { textAlign: 'center', padding: 80 },
  spinner: { 
    width: 40, height: 40, 
    border: '4px solid #e2e8f0', borderTop: '4px solid #3b82f6', 
    borderRadius: '50%', animation: 'spin 1s linear infinite', 
    margin: '0 auto 15px' 
  },

  header: (m) => ({ 
    display: 'flex', 
    alignItems: 'center', 
    gap: 15, 
    marginBottom: 20, 
    flexWrap: 'wrap' 
  }),
  
  backBtn: { 
    background: 'white', 
    border: '1px solid #e2e8f0', 
    padding: '8px 14px', 
    borderRadius: 8, 
    cursor: 'pointer', 
    fontWeight: 600, 
    fontSize: 13, 
    display: 'flex', 
    alignItems: 'center', 
    gap: 6, 
    color: '#64748b' 
  },
  
  pageTitle: (m) => ({ 
    margin: 0, 
    color: '#1e293b', 
    fontSize: m ? 18 : 22, 
    display: 'flex', 
    alignItems: 'center', 
    gap: 8 
  }),

  studentCard: (m) => ({ 
    display: 'flex', 
    alignItems: 'center', 
    gap: 16, 
    background: 'white', 
    padding: m ? 15 : 20, 
    borderRadius: 14, 
    marginBottom: 20, 
    boxShadow: '0 2px 8px rgba(0,0,0,0.04)', 
    border: '1px solid #f1f5f9', 
    flexWrap: m ? 'wrap' : 'nowrap' 
  }),
  
  studentAvatar: { 
    width: 56, 
    height: 56, 
    borderRadius: '50%', 
    background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)', 
    color: 'white', 
    display: 'flex', 
    alignItems: 'center', 
    justifyContent: 'center', 
    fontSize: 24, 
    fontWeight: 'bold', 
    flexShrink: 0 
  },
  
  studentInfo: { flex: 1, minWidth: 0 },
  studentName: { margin: 0, fontSize: 18, color: '#1e293b' },
  
  studentMeta: { 
    display: 'flex', 
    gap: 8, 
    marginTop: 4, 
    flexWrap: 'wrap', 
    alignItems: 'center' 
  },
  
  idBadge: { 
    display: 'inline-flex', 
    alignItems: 'center', 
    gap: 4, 
    background: '#f1f5f9', 
    padding: '3px 10px', 
    borderRadius: 10, 
    fontSize: 11, 
    fontWeight: 'bold', 
    color: '#475569' 
  },
  
  programBadge: (kat) => ({ 
    padding: '3px 10px', 
    borderRadius: 10, 
    fontSize: 11, 
    fontWeight: 'bold', 
    background: kat === 'English' ? '#e0e7ff' : '#f0fdf4', 
    color: kat === 'English' ? '#3730a3' : '#166534' 
  }),
  
  statusBadge: (blocked) => ({ 
    padding: '3px 10px', 
    borderRadius: 10, 
    fontSize: 11, 
    fontWeight: 'bold', 
    background: blocked ? '#fee2e2' : '#dcfce7', 
    color: blocked ? '#ef4444' : '#166534' 
  }),

  gridContainer: (m) => ({ 
    display: 'grid', 
    gridTemplateColumns: m ? '1fr' : '1fr 420px', 
    gap: 20 
  }),
  
  card: { 
    background: 'white', 
    padding: 20, 
    borderRadius: 14, 
    boxShadow: '0 2px 8px rgba(0,0,0,0.04)', 
    border: '1px solid #f1f5f9' 
  },
  
  sectionHeader: { 
    display: 'flex', 
    alignItems: 'center', 
    gap: 8, 
    marginBottom: 16, 
    paddingBottom: 10, 
    borderBottom: '2px solid #f1f5f9' 
  },
  
  sectionTitle: { 
    margin: 0, 
    fontSize: 14, 
    color: '#1e293b', 
    fontWeight: 'bold' 
  },
  
  inputGroup: { marginBottom: 14, flex: 1 },
  
  label: { 
    display: 'block', 
    fontSize: 12, 
    fontWeight: 'bold', 
    color: '#64748b', 
    marginBottom: 5 
  },
  
  labelSmall: { 
    display: 'block', 
    fontSize: 10, 
    fontWeight: 'bold', 
    color: '#94a3b8', 
    marginBottom: 3 
  },
  
  input: { 
    width: '100%', 
    padding: '10px 12px', 
    borderRadius: 8, 
    border: '1px solid #e2e8f0', 
    fontSize: 13, 
    boxSizing: 'border-box', 
    background: '#f8fafc' 
  },
  
  select: { 
    padding: '10px 8px', 
    borderRadius: 8, 
    border: '1px solid #e2e8f0', 
    fontSize: 13, 
    boxSizing: 'border-box', 
    background: '#f8fafc', 
    cursor: 'pointer' 
  },
  
  textarea: { 
    width: '100%', 
    padding: '10px 12px', 
    borderRadius: 8, 
    border: '1px solid #e2e8f0', 
    fontSize: 13, 
    boxSizing: 'border-box', 
    background: '#f8fafc', 
    resize: 'vertical', 
    fontFamily: 'inherit' 
  },
  
  row2: { display: 'flex', gap: 12, flexWrap: 'wrap' },
  tglLahirRow: { display: 'flex', gap: 6, alignItems: 'center' },
  
  tglPreview: { 
    marginTop: 6, 
    fontSize: 11, 
    color: '#3b82f6', 
    background: '#eff6ff', 
    padding: '4px 10px', 
    borderRadius: 6, 
    display: 'inline-block' 
  },
  
  tabRow: { display: 'flex', gap: 8 },
  
  tabBtn: (active, color = '#3b82f6') => ({ 
    flex: 1, 
    padding: '8px 12px', 
    borderRadius: 8, 
    border: active ? `2px solid ${color}` : '1px solid #e2e8f0', 
    background: active ? '#eff6ff' : 'white', 
    color: active ? color : '#64748b', 
    fontWeight: active ? 'bold' : '500', 
    fontSize: 12, 
    cursor: 'pointer', 
    transition: '0.2s' 
  }),
  
  infoBox: { 
    background: '#f0f9ff', 
    padding: 14, 
    borderRadius: 10, 
    border: '1px solid #bae6fd', 
    marginTop: 10 
  },
  
  infoRow: { 
    display: 'flex', 
    justifyContent: 'space-between', 
    padding: '4px 0', 
    fontSize: 12 
  },

  financeRow: { 
    display: 'flex', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    padding: '8px 0', 
    borderBottom: '1px solid #f1f5f9', 
    fontSize: 13 
  },
  
  financeInput: { 
    width: 120, 
    padding: '6px 10px', 
    borderRadius: 6, 
    border: '1px solid #e2e8f0', 
    fontSize: 13, 
    textAlign: 'right' 
  },

  actionBar: { 
    display: 'flex', 
    justifyContent: 'flex-end', 
    gap: 10, 
    marginTop: 20, 
    paddingTop: 16, 
    borderTop: '1px solid #f1f5f9' 
  },
  
  btnCancel: { 
    padding: '12px 24px', 
    borderRadius: 10, 
    border: '1px solid #e2e8f0', 
    background: 'white', 
    color: '#64748b', 
    fontWeight: 'bold', 
    fontSize: 13, 
    cursor: 'pointer', 
    display: 'flex', 
    alignItems: 'center', 
    gap: 6 
  },
  
  btnSave: { 
    padding: '12px 24px', 
    borderRadius: 10, 
    border: 'none', 
    background: '#f59e0b', 
    color: 'white', 
    fontWeight: 'bold', 
    fontSize: 13, 
    cursor: 'pointer', 
    display: 'flex', 
    alignItems: 'center', 
    gap: 6 
  }
};

export default EditStudent;