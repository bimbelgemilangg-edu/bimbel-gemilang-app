// src/pages/admin/teachers/TeacherSalaries.jsx
import React, { useState, useEffect, Fragment } from 'react';
import { useNavigate } from 'react-router-dom';
import SidebarAdmin from '../../../components/SidebarAdmin';
import { db } from '../../../firebase';
import { 
  collection, getDocs, doc, addDoc, deleteDoc, updateDoc, getDoc, setDoc,
  serverTimestamp  // 🔥 TAMBAHKAN INI
} from "firebase/firestore";
import { ArrowLeft, RefreshCw, Download, Eye, X, ChevronRight, Home, DollarSign, FileText, Calendar, Link, Save, Globe } from 'lucide-react';

const TeacherSalaries = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState(new Date().toISOString().slice(0, 8) + "01");
  const [endDate, setEndDate] = useState(new Date().toISOString().slice(0, 10));
  const [rekap, setRekap] = useState([]);
  const [viewDetail, setViewDetail] = useState(null);
  const [totalPengeluaran, setTotalPengeluaran] = useState(0);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [alertMsg, setAlertMsg] = useState(null);
  const [activeBonusId, setActiveBonusId] = useState(null);
  // 🔥 BARU: log yang lagi dibuka detail approval-nya (foto besar +
  // daftar siswa hadir) -- FIX permintaan "saat aproval siswa yang
  // masuk bisa dilihat, lihat foto dan approval [sekaligus]".
  const [expandedLogId, setExpandedLogId] = useState(null);
  const [bonusData, setBonusData] = useState({ keterangan: '', nominal: '' });

  // 🔥 BARU: cross-check semua guru terdaftar (bukan cuma yang punya log)
  // -- FIX BUG NYATA yang dilaporkan: guru yang belum divalidasi/belum
  // punya sesi tercatat sebelumnya SAMA SEKALI GAK MUNCUL di halaman
  // ini, karena tabel dulu cuma dibangun dari log yang ADA. Sekarang
  // di-cross-reference sama koleksi "teachers" -- guru yang gak punya
  // log pun tetap kelihatan (dengan 0 sesi), gak lagi hilang tanpa jejak.
  // ⚠️ ASUMSI SKEMA: koleksi "teachers", field "nama" dan "status".
  // Kalau skema aslimu beda nama field/koleksinya, kasih tau supaya
  // saya sesuaikan -- ini ditulis defensif (fallback aman) tapi tetap
  // perlu dicocokkan ke skema sebenarnya biar akurat 100%.
  const [teachersMaster, setTeachersMaster] = useState([]);

  // 🔥 BARU: total & per-guru jumlah log yang MASIH menunggu validasi --
  // FIX "posisi sekarang kira-kira dan lupa": sekarang ada ringkasan
  // jelas di banner atas + badge per baris guru, gak perlu buka rincian
  // satu-satu buat tau ada yang ketinggalan.
  const [pendingSummary, setPendingSummary] = useState({ totalPending: 0, teacherCount: 0 });

  // ============================================================
  // 🔥 PENGATURAN KOMISI GURU -- dipindah dari Settings.jsx ke sini,
  // disambungkan ke field yang BENERAN dipakai ClassSession.jsx buat
  // hitung honor (settings/global_config, field "salaryRules") --
  // BUKAN ke doc terpisah "komisi_rates" yang sebelumnya salah sasaran
  // (gak nyambung ke perhitungan gaji asli sama sekali).
  //
  // Disederhanakan sesuai arahan eksplisit:
  // - Bonus tambahan (mis. "Bonus English"/EC) DIHAPUS total.
  // - Kompensasi 0 hadir (yang tadinya 50%) DIHAPUS total.
  // - Fokus HANYA komisi reguler per jenjang: SD, SMP, SMA + Honor
  //   Minimal/Sesi sebagai jaring pengaman.
  //
  // ⚠️ Kompensasi 0 hadir sudah dihapus sebelumnya -- kelas dengan 0
  // siswa hadir dihitung tarif penuh × jam, gak ada pengurangan.
  // ============================================================

  const [showKomisiSettings, setShowKomisiSettings] = useState(false);
  // 🔥 BARU: dari object tetap {sd,smp,sma,honorMinimal} JADI ARRAY
  // dinamis -- supaya kamu bisa tambah kategori sespesifik apa pun
  // (mis. "Kelas 6 SD" beda tarif dari "SD" umum), gak lagi terkunci 3
  // kotak tetap. "Honor Minimal/Sesi" DIHAPUS TOTAL sesuai permintaan.
  const [komisiRates, setKomisiRates] = useState([
    { id: 'sd', label: 'SD', pricePerHour: '' },
    { id: 'smp', label: 'SMP', pricePerHour: '' },
    { id: 'sma', label: 'SMA', pricePerHour: '' },
  ]);
  const [savingKomisi, setSavingKomisi] = useState(false);
  const [komisiSaved, setKomisiSaved] = useState(false);

  // 🔥 BARU: format ribuan otomatis (titik) biar gak bingung baca angka
  // -- "27000" tampil "27.000". Disimpan sebagai angka murni di state,
  // cuma TAMPILANNYA yang diformat.
  const formatRibuan = (value) => {
    const numOnly = String(value ?? '').replace(/\D/g, '');
    if (!numOnly) return '';
    return numOnly.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  };
  const parseRibuan = (formatted) => String(formatted ?? '').replace(/\D/g, '');

  // 🔥 BARU: fungsi tambah/hapus/ubah kategori tarif -- dikembalikan
  // (mirip yang dulu ada di Settings.jsx) karena sekarang kamu perlu
  // nambah kategori sespesifik "Kelas 6 SD", bukan cuma SD/SMP/SMA.
  const addKomisiRate = () => {
    setKomisiRates(prev => [...prev, { id: `rate${Date.now().toString().slice(-5)}`, label: '', pricePerHour: '' }]);
  };
  const removeKomisiRate = (index) => {
    setKomisiRates(prev => {
      if (prev.length <= 1) {
        showAlert("⚠️ Minimal 1 kategori tarif harus ada!");
        return prev;
      }
      return prev.filter((_, i) => i !== index);
    });
  };
  const updateKomisiRate = (index, field, value) => {
    setKomisiRates(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  // 🔥 BARU: verifikasi PIN Owner -- pakai mekanisme yang SAMA dengan
  // yang sudah ada (settings/global_config.ownerPin), yang juga dipakai
  // buat login Portal Owner & otorisasi hapus/edit transaksi keuangan
  // di Admin. BUKAN asumsi localStorage yang saya pasang sebelumnya
  // (itu salah, gak ada mekanisme role kayak gitu di sistem ini).
  const [ownerPin, setOwnerPin] = useState('');
  const [isOwnerVerified, setIsOwnerVerified] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [showPinPrompt, setShowPinPrompt] = useState(false);
  const [pinError, setPinError] = useState('');

  // 🔥 STATE UNTUK GOOGLE FORM
  const [showFormSettings, setShowFormSettings] = useState(false);
  const [googleForms, setGoogleForms] = useState({
    sd: '',
    smp: '',
    sma: '',
    english: '',
    default: ''
  });
  const [savingForm, setSavingForm] = useState(false);
  const [formSaved, setFormSaved] = useState(false);

  // 🔥 FETCH salaryRules (dari settings/global_config, field yang SAMA
  // yang dibaca ClassSession.jsx) + ownerPin (buat verifikasi).
  useEffect(() => {
    const fetchGlobalConfig = async () => {
      try {
        const docRef = doc(db, "settings", "global_config");
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data.ownerPin) setOwnerPin(data.ownerPin);

          const sr = data.salaryRules;
          if (sr) {
            // Terima format lama (rates array) maupun super-lama
            // (honorSD/honorSMP/honorSMA field tunggal) -- biar honor
            // yang sudah pernah diatur sebelumnya gak hilang.
            // 🔥 honorMinimal SENGAJA gak dibaca lagi -- field ini
            // dihapus total, walau masih ada di data lama, diabaikan.
            if (Array.isArray(sr.rates) && sr.rates.length > 0) {
              setKomisiRates(sr.rates.map(r => ({
                id: r.id || `rate${Math.random().toString(36).slice(2, 7)}`,
                label: r.label || '',
                pricePerHour: r.pricePerHour ?? '',
              })));
            } else if (sr.honorSD !== undefined) {
              setKomisiRates([
                { id: 'sd', label: 'SD', pricePerHour: sr.honorSD ?? '' },
                { id: 'smp', label: 'SMP', pricePerHour: sr.honorSMP ?? '' },
                { id: 'sma', label: 'SMA', pricePerHour: sr.honorSMA ?? '' },
              ]);
            }
          }
        }
      } catch (error) {
        console.error("Error fetching global config:", error);
      }
    };
    fetchGlobalConfig();
  }, []);

  // 🔥 FETCH TEACHERS MASTER (buat cross-check guru yang belum punya log)
  useEffect(() => {
    const fetchTeachersMaster = async () => {
      try {
        const snap = await getDocs(collection(db, "teachers"));
        setTeachersMaster(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      } catch (error) {
        console.error("Error fetching teachers master:", error);
      }
    };
    fetchTeachersMaster();
  }, []);

  // 🔥 BARU: klik tombol "Pengaturan Komisi" -- kalau belum diverifikasi
  // PIN di sesi ini, munculkan prompt PIN dulu, BUKAN langsung buka
  // panelnya. Ini yang jadi kunci akses beneran (bukan cuma pengecekan
  // role yang gampang dilewati).
  const handleOpenKomisiSettings = () => {
    if (isOwnerVerified) {
      setShowKomisiSettings(v => !v);
    } else {
      setPinInput('');
      setPinError('');
      setShowPinPrompt(true);
    }
  };

  const handleVerifyPin = () => {
    if (!ownerPin) {
      setPinError('PIN Owner belum diatur di sistem. Atur dulu lewat Portal Owner.');
      return;
    }
    if (pinInput === ownerPin) {
      setIsOwnerVerified(true);
      setShowPinPrompt(false);
      setShowKomisiSettings(true);
    } else {
      setPinError('PIN salah. Coba lagi.');
    }
  };

  const handleSaveKomisiRates = async () => {
    if (!isOwnerVerified) return showAlert("🔒 Verifikasi PIN Owner dulu.");

    // Validasi ringan: label gak boleh kosong (biar gak ada kategori
    // "tanpa nama" yang bikin bingung waktu dicocokkan di ClassSession.jsx)
    const hasEmptyLabel = komisiRates.some(r => !r.label || !r.label.trim());
    if (hasEmptyLabel) {
      return showAlert("⚠️ Semua kategori tarif harus punya nama (label).");
    }

    setSavingKomisi(true);
    try {
      await setDoc(doc(db, "settings", "global_config"), {
        salaryRules: {
          rates: komisiRates.map(r => ({
            id: r.id,
            label: r.label.trim(),
            pricePerHour: parseInt(parseRibuan(r.pricePerHour)) || 0,
          })),
          // 🔥 honorMinimal DIHAPUS TOTAL -- gak ditulis lagi ke database.
          // Field lama di dokumen (kalau masih ada dari sebelumnya) gak
          // otomatis kehapus (merge:true), tapi udah gak dipakai/dibaca
          // ClassSession.jsx lagi -- aman diabaikan.
        },
      }, { merge: true });
      setKomisiSaved(true);
      showAlert("✅ Komisi guru berhasil disimpan!");
      setTimeout(() => setKomisiSaved(false), 3000);
    } catch (error) {
      showAlert("❌ Gagal menyimpan komisi: " + error.message);
    }
    setSavingKomisi(false);
  };

  // 🔥 FETCH GOOGLE FORM SETTINGS
  useEffect(() => {
    const fetchGoogleForms = async () => {
      try {
        const docRef = doc(db, "settings", "google_forms");
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setGoogleForms(docSnap.data());
        }
      } catch (error) {
        console.error("Error fetching google forms:", error);
      }
    };
    fetchGoogleForms();
  }, []);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const showAlert = (msg) => {
    setAlertMsg(msg);
    setTimeout(() => setAlertMsg(null), 3000);
  };

  // 🔥 SAVE GOOGLE FORM SETTINGS
  const handleSaveGoogleForms = async () => {
    setSavingForm(true);
    try {
      await setDoc(doc(db, "settings", "google_forms"), {
        ...googleForms,
        updatedAt: new Date().toISOString()
      });
      setFormSaved(true);
      showAlert("✅ Link Google Form berhasil disimpan!");
      setTimeout(() => setFormSaved(false), 3000);
    } catch (error) {
      showAlert("❌ Gagal menyimpan: " + error.message);
    }
    setSavingForm(false);
  };

  // ============================================================
  // 🔥 FETCH DATA
  // ============================================================
  const fetchData = async () => {
    setLoading(true);
    try {
      const snap = await getDocs(collection(db, "teacher_logs"));
      const logs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      const filtered = logs.filter(log => {
        if (!log || !log.tanggal) return false;
        const cleanDate = log.tanggal.split(' ')[0];
        return cleanDate >= startDate && cleanDate <= endDate;
      });

      const guruMap = {};
      let grandTotal = 0;
      filtered.forEach(log => {
        const nominal = parseInt(log.nominal || 0);
        grandTotal += nominal;
        if (!guruMap[log.teacherId]) {
          guruMap[log.teacherId] = { id: log.teacherId, nama: log.namaGuru || "Tanpa Nama", totalGaji: 0, totalSesi: 0, rincian: [], pendingCount: 0, punyaLog: true };
        }
        guruMap[log.teacherId].totalGaji += nominal;
        if (log.program !== "BONUS/TAMBAHAN") guruMap[log.teacherId].totalSesi += 1;
        if (log.status !== "Valid / Sudah Terekap") guruMap[log.teacherId].pendingCount += 1;
        guruMap[log.teacherId].rincian.push(log);
      });

      // 🔥 BARU: cross-reference ke master guru -- guru yang GAK ADA di
      // guruMap (belum punya log sama sekali di periode ini) tetap
      // dimasukkan, supaya gak hilang dari pandangan admin. Ditandai
      // `punyaLog: false` biar tampilannya beda (guru baru/belum ada
      // aktivitas, bukan "0 sesi" yang bisa disalahartikan error).
      teachersMaster.forEach(t => {
        if (!guruMap[t.id]) {
          guruMap[t.id] = {
            id: t.id,
            nama: t.nama || t.namaLengkap || "Tanpa Nama",
            totalGaji: 0,
            totalSesi: 0,
            rincian: [],
            pendingCount: 0,
            punyaLog: false,
            // ⚠️ ASUMSI field status akun guru -- sesuaikan kalau beda
            akunStatus: t.status || t.statusApproval || null,
          };
        } else {
          guruMap[t.id].akunStatus = t.status || t.statusApproval || null;
        }
      });

      const rekapList = Object.values(guruMap);
      const totalPendingAll = rekapList.reduce((sum, g) => sum + g.pendingCount, 0);
      const teacherWithPendingCount = rekapList.filter(g => g.pendingCount > 0).length;

      setTotalPengeluaran(grandTotal);
      setRekap(rekapList);
      setPendingSummary({ totalPending: totalPendingAll, teacherCount: teacherWithPendingCount });
      
      if (viewDetail) {
        const updated = rekapList.find(g => g.id === viewDetail.id);
        if (updated) setViewDetail(updated);
        else setViewDetail(null);
      }
    } catch (error) { console.error("Fetch Error:", error); } 
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, [startDate, endDate, teachersMaster]);

  // ============================================================
  // 🔥 HANDLE: TAMBAH BONUS
  // ============================================================
  const handleAddBonusAtDate = async (originalLog) => {
    if (!bonusData.keterangan || !bonusData.nominal) {
      return showAlert("⚠️ Isi keterangan dan nominal bonus!");
    }
    try {
      await addDoc(collection(db, "teacher_logs"), {
        teacherId: viewDetail.id, 
        namaGuru: viewDetail.nama,
        tanggal: originalLog.tanggal, 
        program: "BONUS/TAMBAHAN",
        detail: bonusData.keterangan, 
        nominal: parseInt(bonusData.nominal),
        status: "Valid / Sudah Terekap", 
        createdAt: serverTimestamp()  // ✅ SEKARANG TERDEFINISI
      });
      setBonusData({ keterangan: '', nominal: '' });
      setActiveBonusId(null);
      showAlert("✅ Bonus berhasil ditambahkan!");
      fetchData();
    } catch (e) { 
      showAlert("❌ Gagal menambah bonus: " + e.message); 
    }
  };

  // ============================================================
  // 🔥 HANDLE: UPDATE NOMINAL
  // ============================================================
  const handleUpdateNominal = async (logId, newNominal) => {
    if (!newNominal) return;
    try {
      await updateDoc(doc(db, "teacher_logs", logId), { 
        nominal: parseInt(newNominal) 
      });
      showAlert("✅ Nominal berhasil diupdate!");
      fetchData();
    } catch (e) { 
      showAlert("❌ Gagal update nominal: " + e.message); 
    }
  };

  // ============================================================
  // 🔥 HANDLE: APPROVE LOG
  // ============================================================
  const handleApproveLog = async (logId) => {
    try {
      await updateDoc(doc(db, "teacher_logs", logId), { 
        status: "Valid / Sudah Terekap" 
      });
      showAlert("✅ Log disetujui!");
      fetchData();
    } catch (e) { 
      showAlert("❌ Gagal approve: " + e.message); 
    }
  };

  // ============================================================
  // 🔥 HANDLE: UNAPPROVE LOG (BATAL VALIDASI)
  // ============================================================
  const handleUnapproveLog = async (logId) => {
    if (!window.confirm("Batalkan validasi untuk merevisi data ini?")) return;
    try {
      await updateDoc(doc(db, "teacher_logs", logId), { 
        status: "Menunggu Validasi" 
      });
      showAlert("🔓 Validasi dibatalkan");
      fetchData();
    } catch (e) { 
      showAlert("❌ Gagal membatalkan: " + e.message); 
    }
  };

  // ============================================================
  // 🔥 HANDLE: DELETE LOG
  // ============================================================
  const handleDeleteLog = async (logId) => {
    if (!window.confirm("Yakin ingin menghapus baris riwayat ini secara permanen?")) return;
    try {
      await deleteDoc(doc(db, "teacher_logs", logId));
      showAlert("🗑️ Log dihapus!");
      fetchData();
    } catch (e) { 
      showAlert("❌ Gagal menghapus: " + e.message); 
    }
  };

  // ============================================================
  // 🔥 HANDLE: DOWNLOAD SLIP GAJI
  // ============================================================
  const handleDownload = (guru) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return showAlert("⚠️ Pop-up diblokir browser!");
    
    printWindow.document.write(`
      <html><head><title>Slip Gaji - ${guru.nama}</title>
      <style>
        body { font-family: Arial, sans-serif; padding: 20px; }
        table { width: 100%; border-collapse: collapse; margin-top: 10px; }
        th, td { padding: 8px; border: 1px solid #ddd; }
        th { background: #f5f5f5; }
        .total { font-weight: bold; font-size: 16px; margin-top: 15px; }
        .text-right { text-align: right; }
      </style>
      </head>
      <body>
        <h2 style="text-align:center">SLIP GAJI GURU</h2>
        <hr/>
        <p><b>Nama:</b> ${guru.nama}</p>
        <p><b>Periode:</b> ${startDate} s/d ${endDate}</p>
        <table>
          <thead>
            <tr>
              <th>Tanggal</th>
              <th>Program</th>
              <th>Detail</th>
              <th>Nominal</th>
            </tr>
          </thead>
          <tbody>
            ${guru.rincian.sort((a,b) => (b.tanggal || '').localeCompare(a.tanggal || '')).map(r => `
              <tr>
                <td>${r.tanggal} ${r.waktu ? `<br/><small>${r.waktu}</small>` : ''}</td>
                <td>${r.program}</td>
                <td><small>${r.detail}</small></td>
                <td style="text-align:right">Rp ${parseInt(r.nominal || 0).toLocaleString()}</td>
              </tr>
            `).join('')}
          </tbody>
          <tfoot>
            <tr style="font-weight:bold;background:#e8f5e9">
              <td colspan="3" style="text-align:right">TOTAL:</td>
              <td style="text-align:right">Rp ${guru.totalGaji.toLocaleString()}</td>
            </tr>
          </tfoot>
        </table>
        <p style="text-align:right;margin-top:20px">Tanda Tangan,</p>
        <p style="text-align:right;margin-top:40px">_______________</p>
      </body>
    </html>`);
    printWindow.document.close();
    setTimeout(() => printWindow.print(), 500);
  };

  // ============================================================
  // RENDER (SAMA SEPERTI SEBELUMNYA)
  // ============================================================
  return (
    <div style={styles.wrapper}>
      <SidebarAdmin />
      <div style={styles.mainContent(isMobile)}>
        
        {alertMsg && <div style={styles.toast}>{alertMsg}</div>}

        {/* Breadcrumb */}
        <div style={styles.breadcrumb(isMobile)}>
          <button onClick={() => navigate('/admin/teachers')} style={styles.backBtn}>
            <ArrowLeft size={16} /> Kembali ke Kelola Guru
          </button>
          <div style={styles.breadcrumbTrail}>
            <Home size={12} color="#94a3b8" /><ChevronRight size={12} color="#94a3b8" />
            <span style={{color: '#94a3b8'}}>Kelola Guru</span><ChevronRight size={12} color="#94a3b8" />
            <span style={{color: '#3b82f6', fontWeight: 'bold'}}>Gaji Guru</span>
          </div>
        </div>

        {/* Header */}
        <div style={styles.headerCard(isMobile)}>
          <div>
            <h2 style={styles.pageTitle(isMobile)}><DollarSign size={22} /> Rekap Gaji & Validasi Harian</h2>
            <p style={styles.subtitle(isMobile)}>Kelola honor berdasarkan jenjang dan durasi mengajar.</p>
          </div>
          <div style={{display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap'}}>
            {/* 🔥 BARU: tombol ini SELALU tampil (siapa pun boleh coba),
                tapi klik akan memicu verifikasi PIN Owner dulu sebelum
                panelnya kebuka -- konsisten sama pola PIN Owner yang
                sudah dipakai di tempat lain (bukan disembunyikan
                berdasar role, tapi dikunci pakai PIN). */}
            <button 
              onClick={handleOpenKomisiSettings} 
              style={styles.btnKomisiSettings(isMobile)}
            >
              <DollarSign size={14} /> {isMobile ? 'Komisi' : 'Pengaturan Komisi'}
            </button>
            <button 
              onClick={() => setShowFormSettings(!showFormSettings)} 
              style={styles.btnGoogleForm(isMobile)}
            >
              <Link size={14} /> {isMobile ? 'Form' : 'Google Form'}
            </button>
            <div style={styles.totalBox(isMobile)}>
              <small style={{fontWeight:'bold'}}>TOTAL PENGELUARAN:</small>
              <h2 style={{color:'#27ae60', margin:0, fontSize: isMobile ? 18 : 24}}>Rp {totalPengeluaran.toLocaleString()}</h2>
            </div>
          </div>
        </div>

        {/* 🔥 GOOGLE FORM SETTINGS */}
        {showFormSettings && (
          <div style={styles.formSettingsCard}>
            <div style={styles.formSettingsHeader}>
              <h4 style={styles.formSettingsTitle}><Link size={18} /> Google Form Laporan Materi Guru</h4>
              <button 
                onClick={() => setShowFormSettings(false)} 
                style={styles.formSettingsClose}
              >
                <X size={18} />
              </button>
            </div>
            <p style={styles.formSettingsDesc}>
              Atur link Google Form untuk laporan materi yang akan diisi guru setelah selesai mengajar.
              Link akan otomatis terbuka saat guru mengakhiri sesi.
            </p>
            
            <div style={styles.formGrid}>
              <div style={styles.formGroup}>
                <label style={styles.formLabel}>📚 SD</label>
                <input 
                  type="url" 
                  placeholder="https://forms.google.com/..." 
                  value={googleForms.sd || ''}
                  onChange={(e) => setGoogleForms(prev => ({...prev, sd: e.target.value}))}
                  style={styles.formInput}
                />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.formLabel}>📚 SMP</label>
                <input 
                  type="url" 
                  placeholder="https://forms.google.com/..." 
                  value={googleForms.smp || ''}
                  onChange={(e) => setGoogleForms(prev => ({...prev, smp: e.target.value}))}
                  style={styles.formInput}
                />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.formLabel}>📚 SMA</label>
                <input 
                  type="url" 
                  placeholder="https://forms.google.com/..." 
                  value={googleForms.sma || ''}
                  onChange={(e) => setGoogleForms(prev => ({...prev, sma: e.target.value}))}
                  style={styles.formInput}
                />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.formLabel}>🇬🇧 English</label>
                <input 
                  type="url" 
                  placeholder="https://forms.google.com/..." 
                  value={googleForms.english || ''}
                  onChange={(e) => setGoogleForms(prev => ({...prev, english: e.target.value}))}
                  style={styles.formInput}
                />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.formLabel}>🔗 Default (Semua Jenjang)</label>
                <input 
                  type="url" 
                  placeholder="https://forms.google.com/..." 
                  value={googleForms.default || ''}
                  onChange={(e) => setGoogleForms(prev => ({...prev, default: e.target.value}))}
                  style={styles.formInput}
                />
              </div>
            </div>
            
            <div style={styles.formActions}>
              <button 
                onClick={handleSaveGoogleForms} 
                disabled={savingForm}
                style={{
                  ...styles.btnSaveForm,
                  opacity: savingForm ? 0.6 : 1,
                  background: formSaved ? '#10b981' : '#3b82f6'
                }}
              >
                {savingForm ? '⏳ Menyimpan...' : formSaved ? '✅ Tersimpan' : <><Save size={16} /> Simpan Link</>}
              </button>
            </div>
          </div>
        )}

        {/* 🔥 BARU: PANEL PENGATURAN KOMISI -- terkunci owner. Dicek
            DUA KALI (isOwnerVerified di kondisi render DAN di
            handleSaveKomisiRates itu sendiri). Verifikasinya pakai PIN
            Owner yang sama dengan yang dipakai Portal Owner & otorisasi
            transaksi keuangan -- BUKAN sekadar cek role di frontend. */}
        {isOwnerVerified && showKomisiSettings && (
          <div style={styles.formSettingsCard}>
            <div style={styles.formSettingsHeader}>
              <h4 style={styles.formSettingsTitle}><DollarSign size={18} /> Komisi Guru (Kelas Reguler)</h4>
              <button 
                onClick={() => setShowKomisiSettings(false)} 
                style={styles.formSettingsClose}
              >
                <X size={18} />
              </button>
            </div>
            <p style={styles.formSettingsDesc}>
              Tarif per jam per kategori, berlaku otomatis saat guru menyelesaikan kelas. Bisa tambah kategori
              sespesifik apa pun (mis. "Kelas 6 SD" beda dari "SD" umum) -- nama kategori ini yang dicocokkan
              ke kelas siswa yang hadir waktu guru menutup kelas. Nominal per sesi tetap bisa diedit manual
              di rincian untuk kasus khusus.
            </p>

            {/* 🔥 BARU: daftar dinamis, bisa tambah/hapus kategori bebas */}
            {komisiRates.map((r, idx) => (
              <div key={r.id || idx} style={styles.komisiRow(isMobile)}>
                <input
                  type="text"
                  value={r.label}
                  onChange={(e) => updateKomisiRate(idx, 'label', e.target.value)}
                  placeholder='Nama kategori (mis. "SD", "Kelas 6 SD")'
                  style={styles.komisiLabelInput}
                />
                <div style={styles.komisiPriceWrap}>
                  <span style={styles.komisiPricePrefix}>Rp</span>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={formatRibuan(r.pricePerHour)}
                    onChange={(e) => updateKomisiRate(idx, 'pricePerHour', parseRibuan(e.target.value))}
                    placeholder="0"
                    style={styles.komisiPriceInput}
                  />
                  <span style={styles.komisiPriceSuffix}>/jam</span>
                </div>
                <button onClick={() => removeKomisiRate(idx)} style={styles.btnRemove}>
                  <X size={14} />
                </button>
              </div>
            ))}

            <button onClick={addKomisiRate} style={styles.btnAddKomisi}>
              + Tambah Kategori
            </button>
            
            <div style={styles.formActions}>
              <button 
                onClick={handleSaveKomisiRates} 
                disabled={savingKomisi}
                style={{
                  ...styles.btnSaveForm,
                  opacity: savingKomisi ? 0.6 : 1,
                  background: komisiSaved ? '#10b981' : '#3b82f6'
                }}
              >
                {savingKomisi ? '⏳ Menyimpan...' : komisiSaved ? '✅ Tersimpan' : <><Save size={16} /> Simpan Tarif</>}
              </button>
            </div>
          </div>
        )}

        {/* 🔥 BARU: MODAL PROMPT PIN OWNER -- muncul waktu klik tombol
            "Pengaturan Komisi" tapi belum verifikasi PIN di sesi ini. */}
        {showPinPrompt && (
          <div style={styles.overlay} onClick={() => setShowPinPrompt(false)}>
            <div style={styles.pinModal} onClick={e => e.stopPropagation()}>
              <h4 style={{margin: '0 0 6px', fontSize: 16}}>🔒 Verifikasi PIN Owner</h4>
              <p style={{margin: '0 0 14px', fontSize: 12, color: '#64748b'}}>
                Masukkan PIN Owner untuk mengubah pengaturan komisi guru.
              </p>
              <input
                type="password"
                value={pinInput}
                onChange={(e) => { setPinInput(e.target.value); setPinError(''); }}
                onKeyDown={(e) => e.key === 'Enter' && handleVerifyPin()}
                placeholder="Masukkan PIN"
                style={styles.pinModalInput}
                autoFocus
              />
              {pinError && <p style={{color: '#ef4444', fontSize: 12, margin: '6px 0 0'}}>{pinError}</p>}
              <div style={{display: 'flex', gap: 8, marginTop: 14}}>
                <button onClick={() => setShowPinPrompt(false)} style={styles.btnSecondaryPin}>Batal</button>
                <button onClick={handleVerifyPin} style={styles.btnPrimaryPin}>Verifikasi</button>
              </div>
            </div>
          </div>
        )}

        {/* 🔥 BARU: BANNER PERINGATAN PENDING -- FIX "posisi sekarang
            kira-kira dan lupa". Muncul cuma kalau ada yang pending. */}
        {pendingSummary.totalPending > 0 && (
          <div style={styles.pendingBanner}>
            <span style={{fontSize: 18}}>⚠️</span>
            <span>
              <b>{pendingSummary.totalPending} log</b> dari <b>{pendingSummary.teacherCount} guru</b> masih menunggu validasi pada periode ini.
              Klik "Rincian" pada baris guru yang bertanda 🔶 di bawah untuk memeriksa.
            </span>
          </div>
        )}

        {/* Filter */}
        <div style={styles.filterRow(isMobile)}>
          <div style={styles.filterGroup}>
            <label style={styles.filterLabel}><Calendar size={12} /> Dari</label>
            <input type="date" value={startDate} onChange={e=>setStartDate(e.target.value)} style={styles.dateInput(isMobile)} />
          </div>
          <div style={styles.filterGroup}>
            <label style={styles.filterLabel}>Sampai</label>
            <input type="date" value={endDate} onChange={e=>setEndDate(e.target.value)} style={styles.dateInput(isMobile)} />
          </div>
          <button onClick={fetchData} style={styles.btnRefresh(isMobile)}><RefreshCw size={14} /> Segarkan</button>
        </div>

        {/* Loading */}
        {loading ? (
          <div style={styles.cardTable}>
            <div style={styles.loadingBox}>
              <div style={styles.spinner}></div>
              <p>Memuat data gaji...</p>
            </div>
          </div>
        ) : rekap.length === 0 ? (
          <div style={styles.cardTable}>
            <div style={styles.emptyState}><FileText size={40} color="#94a3b8" /><p>Belum ada data gaji untuk periode ini.</p></div>
          </div>
        ) : (
          <div style={styles.cardTable}>
            <div style={{overflowX: 'auto'}}>
              <table style={styles.table}>
                <thead style={{background:'#1e293b', color:'white'}}>
                  <tr><th style={styles.th}>Nama Guru</th><th style={styles.th}>Total Sesi</th><th style={styles.th}>Total Gaji</th><th style={styles.th}>Aksi</th></tr>
                </thead>
                <tbody>
                  {rekap.map(g => (
                    <tr key={g.id} style={styles.tr}>
                      <td style={styles.td}>
                        <b>{g.nama}</b>
                        {/* 🔥 BARU: badge pending -- muncul kalau guru ini
                            punya log yang belum divalidasi. */}
                        {g.pendingCount > 0 && (
                          <span style={styles.badgePending}> 🔶 {g.pendingCount} pending</span>
                        )}
                        {/* 🔥 BARU: tanda guru yang belum punya log sama
                            sekali di periode ini -- FIX BUG "guru belum
                            divalidasi gak muncul". */}
                        {!g.punyaLog && (
                          <div style={styles.noLogNote}>Belum ada sesi tercatat pada periode ini{g.akunStatus ? ` · status akun: ${g.akunStatus}` : ''}</div>
                        )}
                      </td>
                      <td style={styles.td}>{g.totalSesi} Sesi</td>
                      <td style={styles.td}><b style={{color: '#10b981'}}>Rp {g.totalGaji.toLocaleString()}</b></td>
                      <td style={styles.td}>
                        <div style={styles.actionButtons(isMobile)}>
                          <button onClick={() => setViewDetail(g)} style={styles.btnDetail}><Eye size={14} /> Rincian</button>
                          <button onClick={() => handleDownload(g)} style={styles.btnDownload}><Download size={14} /> Slip</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Modal Detail */}
        {viewDetail && (
          <div style={styles.overlay} onClick={() => setViewDetail(null)}>
            <div style={styles.modal(isMobile)} onClick={e => e.stopPropagation()}>
              <div style={styles.modalHeader}>
                <h3 style={{margin:0, fontSize: isMobile ? 16 : 18}}>📋 Rincian Sesi: {viewDetail.nama}</h3>
                <button onClick={()=>setViewDetail(null)} style={styles.btnClose}><X size={20} /></button>
              </div>
              <div style={{maxHeight: isMobile ? '50vh' : '500px', overflowY: 'auto'}}>
                <table style={{width:'100%', borderCollapse:'collapse', fontSize: isMobile ? 11 : 13}}>
                  <thead style={{background:'#f8fafc', position:'sticky', top:0, zIndex:1}}>
                    <tr>
                      <th style={styles.thSmall}>Tanggal</th>
                      <th style={styles.thSmall}>Program</th>
                      <th style={styles.thSmall}>Detail</th>
                      {/* 🔥 BARU: kolom cross-check -- kelas, siswa hadir,
                          foto absensi. Ditampilkan DEFENSIF: kalau field
                          ini belum ada di dokumen log (karena penulisannya
                          di ClassSession.jsx belum diupdate), tampil "-"
                          bukan error/kosong membingungkan. */}
                      <th style={styles.thSmall}>Kelas</th>
                      <th style={styles.thSmall}>Tipe</th>
                      <th style={styles.thSmall}>Siswa Hadir</th>
                      <th style={styles.thSmall}>Foto Absensi</th>
                      <th style={styles.thSmall}>Nominal</th>
                      <th style={styles.thSmall}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {viewDetail.rincian.sort((a,b) => (b.tanggal || '').localeCompare(a.tanggal || '')).map((log) => {
                      const isValid = log.status === "Valid / Sudah Terekap";
                      return (
                        <Fragment key={log.id}>
                        <tr style={{borderBottom:'1px solid #f1f5f9', background: isValid ? '#f0fdf4' : 'white'}}>
                          <td style={styles.tdSmall}><b>{log.tanggal}</b><br/><span style={{fontSize: 10, color: '#94a3b8'}}>{log.waktu || '-'}</span></td>
                          <td style={styles.tdSmall}><span style={{color: log.program === 'BONUS/TAMBAHAN' ? '#f59e0b' : '#3b82f6', fontWeight:'bold', fontSize: isMobile ? 10 : 12}}>{log.program || 'Kegiatan'}</span></td>
                          <td style={styles.tdSmall}><small style={{color: '#64748b'}}>{log.detail}</small></td>
                          <td style={styles.tdSmall}>{log.kelasNama || <span style={{color:'#cbd5e1'}}>-</span>}</td>
                          <td style={styles.tdSmall}>
                            {log.tipeKelas === 'online' ? (
                              <span style={{fontSize:10, fontWeight:700, color:'#7c3aed', background:'#f5f3ff', padding:'2px 8px', borderRadius:10}}>💻 Online</span>
                            ) : log.tipeKelas === 'reguler' ? (
                              <span style={{fontSize:10, fontWeight:700, color:'#0369a1', background:'#eff6ff', padding:'2px 8px', borderRadius:10}}>🏫 Reguler</span>
                            ) : <span style={{color:'#cbd5e1'}}>-</span>}
                          </td>
                          <td style={styles.tdSmall}>{log.siswaHadir != null ? `${log.siswaHadir} siswa` : <span style={{color:'#cbd5e1'}}>-</span>}</td>
                          <td style={styles.tdSmall}>
                            {log.fotoAbsensiUrl ? (
                              <button
                                onClick={() => setExpandedLogId(expandedLogId === log.id ? null : log.id)}
                                style={styles.btnLihatDetail}
                              >
                                <img src={log.fotoAbsensiUrl} alt="Foto absensi" style={styles.thumbFoto} />
                              </button>
                            ) : <span style={{color:'#cbd5e1'}}>-</span>}
                          </td>
                          <td style={styles.tdSmall}>
                            <input 
                              type="number" 
                              disabled={isValid} 
                              defaultValue={log.nominal} 
                              onBlur={(e) => handleUpdateNominal(log.id, e.target.value)} 
                              style={{...styles.inputNominal(isMobile), borderColor: isValid ? '#10b981' : '#3b82f6'}} 
                            />
                          </td>
                          <td style={styles.tdSmall}>
                            {isValid ? (
                              <div style={{display:'flex', flexDirection:'column', gap:4}}>
                                <span style={styles.badgeSuccess}>✅ Valid</span>
                                <button onClick={() => handleUnapproveLog(log.id)} style={styles.btnRevise}>Batal</button>
                              </div>
                            ) : (
                              <div style={{display:'flex', gap:4, flexWrap:'wrap'}}>
                                <button onClick={() => handleApproveLog(log.id)} style={styles.btnApprove}>✓</button>
                                <button onClick={() => setActiveBonusId(log.id)} style={styles.btnBonus}>+</button>
                                <button onClick={() => handleDeleteLog(log.id)} style={styles.btnDelete}>✕</button>
                              </div>
                            )}
                          </td>
                        </tr>
                        {/* 🔥 BARU: BARIS EXPAND DETAIL APPROVAL -- foto
                            besar + daftar siswa hadir (nama & kelas),
                            ditaruh berdampingan supaya admin bisa cek
                            semuanya SEBELUM klik approve, gak perlu buka
                            tab baru/tempat lain. */}
                        {expandedLogId === log.id && (
                          <tr style={{background:'#f8fafc'}}>
                            <td colSpan="9" style={{padding:14}}>
                              <div style={styles.expandDetailBox(isMobile)}>
                                <div style={styles.expandPhotoCol}>
                                  <p style={styles.expandLabel}>📷 Bukti Kehadiran ({log.tipeKelas === 'online' ? 'Screenshot Online' : 'Foto Reguler'})</p>
                                  {log.fotoAbsensiUrl ? (
                                    <a href={log.fotoAbsensiUrl} target="_blank" rel="noopener noreferrer">
                                      <img src={log.fotoAbsensiUrl} alt="Foto absensi (besar)" style={styles.expandPhotoBig} />
                                    </a>
                                  ) : <p style={{color:'#94a3b8', fontSize:12}}>Tidak ada foto.</p>}
                                </div>
                                <div style={styles.expandStudentCol}>
                                  <p style={styles.expandLabel}>
                                    👥 Siswa Hadir ({Array.isArray(log.daftarSiswaHadir) ? log.daftarSiswaHadir.length : log.siswaHadir ?? 0})
                                  </p>
                                  {Array.isArray(log.daftarSiswaHadir) && log.daftarSiswaHadir.length > 0 ? (
                                    <ul style={styles.expandStudentList}>
                                      {log.daftarSiswaHadir.map((s, i) => (
                                        <li key={s.id || i} style={styles.expandStudentItem}>
                                          <span>{s.nama}</span>
                                          <span style={styles.expandStudentKelas}>Kelas {s.kelas || '-'}</span>
                                        </li>
                                      ))}
                                    </ul>
                                  ) : (
                                    <p style={{color:'#94a3b8', fontSize:12}}>
                                      Daftar nama siswa belum tersedia untuk log ini (kemungkinan tercatat sebelum fitur ini aktif).
                                    </p>
                                  )}
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                        {activeBonusId === log.id && (
                          <tr style={{background:'#fffbeb'}}>
                            <td colSpan="9" style={{padding:10}}>
                              <div style={{display:'flex', gap:8, alignItems:'center', flexWrap:'wrap'}}>
                                <b style={{fontSize:11}}>TAMBAH BONUS:</b>
                                <input 
                                  placeholder="Keterangan..." 
                                  onChange={e => setBonusData({...bonusData, keterangan: e.target.value})} 
                                  style={styles.miniInput} 
                                />
                                <input 
                                  type="number" 
                                  placeholder="Nominal" 
                                  onChange={e => setBonusData({...bonusData, nominal: e.target.value})} 
                                  style={styles.miniInput} 
                                />
                                <button onClick={() => handleAddBonusAtDate(log)} style={styles.btnSaveBonus}>Simpan</button>
                                <button onClick={() => setActiveBonusId(null)} style={{border:'none', background:'none', cursor:'pointer', color:'#ef4444', fontSize:11}}>Batal</button>
                              </div>
                            </td>
                          </tr>
                        )}
                        </Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <div style={{marginTop:15, textAlign:'right', borderTop:'2px solid #e2e8f0', paddingTop:15}}>
                <h3 style={{margin:0, color:'#1e293b', fontSize: isMobile ? 14 : 18}}>
                  Total: <span style={{color:'#10b981'}}>Rp {viewDetail.totalGaji.toLocaleString()}</span>
                </h3>
              </div>
            </div>
          </div>
        )}
      </div>
      <style>{`@keyframes spin{0%{transform:rotate(0deg)}100%{transform:rotate(360deg)}}`}</style>
    </div>
  );
};

// ============================================================
// STYLES (TETAP SAMA)
// ============================================================
const styles = {
  wrapper: { display: 'flex', minHeight: '100vh', background: '#f8fafc' },
  mainContent: (m) => ({ marginLeft: m ? '0' : '250px', padding: m ? '15px' : '30px', width: '100%', boxSizing: 'border-box', transition: '0.3s' }),
  toast: { position: 'fixed', top: 20, right: 20, zIndex: 9999, background: '#1e293b', color: 'white', padding: '12px 20px', borderRadius: 12, fontWeight: 'bold', fontSize: 14, boxShadow: '0 10px 30px rgba(0,0,0,0.2)' },
  breadcrumb: (m) => ({ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexDirection: m ? 'column' : 'row', gap: m ? 8 : 0 }),
  backBtn: { background: 'white', border: '1px solid #e2e8f0', padding: '8px 14px', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: 13, display: 'flex', alignItems: 'center', gap: 6, color: '#64748b' },
  breadcrumbTrail: { display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 },
  headerCard: (m) => ({ background:'white', padding: m ? 15 : 20, borderRadius:15, display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20, boxShadow:'0 2px 8px rgba(0,0,0,0.04)', flexDirection: m ? 'column' : 'row', gap: m ? 10 : 0 }),
  pageTitle: (m) => ({ margin:0, fontSize: m ? 16 : 20, display:'flex', alignItems:'center', gap:8 }),
  subtitle: (m) => ({ color:'#94a3b8', marginTop:5, fontSize: m ? 11 : 13 }),
  totalBox: (m) => ({ textAlign: m ? 'center' : 'right', background:'#f0fdf4', padding: m ? '10px 15px' : '10px 20px', borderRadius:12, border:'1px solid #bbf7d0' }),
  
  btnGoogleForm: (m) => ({ 
    background: '#8b5cf6', 
    color: 'white', 
    border: 'none', 
    padding: m ? '8px 12px' : '10px 16px', 
    borderRadius: 8, 
    cursor: 'pointer', 
    fontWeight: 'bold', 
    fontSize: m ? 11 : 12, 
    display: 'flex', 
    alignItems: 'center', 
    gap: 4 
  }),

  // 🔥 BARU
  btnKomisiSettings: (m) => ({
    background: '#0f172a',
    color: 'white',
    border: 'none',
    padding: m ? '8px 12px' : '10px 16px',
    borderRadius: 8,
    cursor: 'pointer',
    fontWeight: 'bold',
    fontSize: m ? 11 : 12,
    display: 'flex',
    alignItems: 'center',
    gap: 4
  }),

  pendingBanner: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: 10,
    background: '#fffbeb',
    border: '1px solid #fde68a',
    color: '#92400e',
    padding: '12px 16px',
    borderRadius: 12,
    marginBottom: 16,
    fontSize: 13,
  },

  badgePending: {
    fontSize: 11,
    fontWeight: 700,
    color: '#b45309',
    background: '#fffbeb',
    padding: '2px 8px',
    borderRadius: 10,
    marginLeft: 6,
  },

  noLogNote: {
    fontSize: 11,
    color: '#94a3b8',
    marginTop: 2,
    fontStyle: 'italic',
  },

  thumbFoto: {
    width: 40,
    height: 40,
    objectFit: 'cover',
    borderRadius: 6,
    border: '1px solid #e2e8f0',
    cursor: 'pointer',
  },

  // 🔥 BARU: tombol pemicu detail approval + panel expand
  btnLihatDetail: {
    background: 'none',
    border: '2px solid #3b82f6',
    borderRadius: 8,
    padding: 2,
    cursor: 'pointer',
  },

  expandDetailBox: (m) => ({
    display: 'flex',
    gap: 20,
    flexDirection: m ? 'column' : 'row',
  }),

  expandPhotoCol: {
    flex: '0 0 auto',
  },

  expandStudentCol: {
    flex: 1,
    minWidth: 200,
  },

  expandLabel: {
    fontSize: 12,
    fontWeight: 700,
    color: '#334155',
    marginBottom: 8,
  },

  expandPhotoBig: {
    width: 220,
    maxWidth: '100%',
    borderRadius: 10,
    border: '1px solid #e2e8f0',
    display: 'block',
    cursor: 'pointer',
  },

  expandStudentList: {
    listStyle: 'none',
    margin: 0,
    padding: 0,
    maxHeight: 220,
    overflowY: 'auto',
  },

  expandStudentItem: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '6px 10px',
    borderBottom: '1px solid #f1f5f9',
    fontSize: 12,
  },

  expandStudentKelas: {
    color: '#64748b',
    fontWeight: 600,
    fontSize: 11,
  },

  formSettingsCard: {
    background: 'white',
    padding: '20px',
    borderRadius: 12,
    border: '2px solid #8b5cf6',
    marginBottom: 20,
    boxShadow: '0 2px 8px rgba(139,92,246,0.1)'
  },
  
  formSettingsHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8
  },
  
  formSettingsTitle: {
    margin: 0,
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1e293b',
    display: 'flex',
    alignItems: 'center',
    gap: 8
  },
  
  formSettingsClose: {
    background: '#f1f5f9',
    border: 'none',
    borderRadius: '50%',
    width: 30,
    height: 30,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#64748b'
  },
  
  formSettingsDesc: {
    margin: '0 0 16px',
    fontSize: 13,
    color: '#64748b'
  },
  
  // 🔥 BARU: daftar dinamis kategori komisi
  komisiRow: (m) => ({
    display: 'flex',
    gap: 8,
    alignItems: 'center',
    marginBottom: 8,
    flexDirection: m ? 'column' : 'row',
  }),
  komisiLabelInput: {
    flex: 1.2,
    padding: '9px 12px',
    borderRadius: 8,
    border: '1px solid #e2e8f0',
    fontSize: 12,
    outline: 'none',
  },
  komisiPriceWrap: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    border: '1px solid #e2e8f0',
    borderRadius: 8,
    overflow: 'hidden',
  },
  komisiPricePrefix: {
    padding: '9px 8px',
    background: '#f8fafc',
    fontSize: 12,
    color: '#64748b',
    fontWeight: 700,
  },
  komisiPriceInput: {
    flex: 1,
    padding: '9px 6px',
    border: 'none',
    fontSize: 12,
    outline: 'none',
    minWidth: 0,
  },
  komisiPriceSuffix: {
    padding: '9px 8px',
    background: '#f8fafc',
    fontSize: 11,
    color: '#94a3b8',
  },
  btnAddKomisi: {
    background: '#eff6ff',
    color: '#3b82f6',
    border: '1px dashed #3b82f6',
    borderRadius: 8,
    padding: '8px 14px',
    fontSize: 12,
    fontWeight: 700,
    cursor: 'pointer',
    marginBottom: 16,
    marginTop: 4,
  },
  btnRemove: {
    background: '#fee2e2',
    color: '#ef4444',
    border: 'none',
    borderRadius: 8,
    padding: '9px 10px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },

  formGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
    gap: 12,
    marginBottom: 16
  },
  
  formGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: 4
  },
  
  formLabel: {
    fontSize: 11,
    fontWeight: 600,
    color: '#64748b'
  },
  
  formInput: {
    padding: '8px 12px',
    borderRadius: 8,
    border: '1px solid #e2e8f0',
    fontSize: 12,
    outline: 'none',
    transition: '0.2s'
  },
  
  formActions: {
    display: 'flex',
    justifyContent: 'flex-end'
  },
  
  btnSaveForm: {
    padding: '10px 24px',
    borderRadius: 8,
    border: 'none',
    color: 'white',
    cursor: 'pointer',
    fontWeight: 'bold',
    fontSize: 13,
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    transition: '0.2s'
  },
  
  filterRow: (m) => ({ marginBottom:20, display:'flex', gap:10, alignItems:'flex-end', flexWrap:'wrap' }),
  filterGroup: { display:'flex', flexDirection:'column', gap:4 },
  filterLabel: { fontSize:11, fontWeight:'bold', color:'#64748b', display:'flex', alignItems:'center', gap:4 },
  dateInput: (m) => ({ padding: m ? 8 : 10, borderRadius:8, border:'1px solid #e2e8f0', fontSize: m ? 11 : 13 }),
  btnRefresh: (m) => ({ background:'#1e293b', color:'white', border:'none', padding: m ? '8px 12px' : '10px 16px', borderRadius:8, cursor:'pointer', display:'flex', alignItems:'center', gap:4, fontSize: m ? 11 : 12, fontWeight:'bold' }),
  cardTable: { background:'white', borderRadius:14, overflow:'hidden', boxShadow:'0 2px 8px rgba(0,0,0,0.04)' },
  loadingBox: { textAlign:'center', padding:50, color:'#94a3b8' },
  spinner: { width: 36, height: 36, border: '4px solid #e2e8f0', borderTop: '4px solid #3b82f6', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 15px' },
  table: { width:'100%', borderCollapse:'collapse', minWidth:'500px' },
  th: { padding:14, textAlign:'left', fontSize:12 },
  tr: { borderBottom:'1px solid #f1f5f9' },
  td: { padding:14, fontSize:13, borderBottom:'1px solid #f1f5f9' },
  actionButtons: (m) => ({ display:'flex', gap:5, flexDirection: m ? 'column' : 'row' }),
  btnDetail: { background:'#3b82f6', color:'white', border:'none', padding:'8px 12px', borderRadius:8, cursor:'pointer', fontWeight:'bold', fontSize:12, display:'flex', alignItems:'center', gap:4 },
  btnDownload: { background:'#10b981', color:'white', border:'none', padding:'8px 12px', borderRadius:8, cursor:'pointer', fontWeight:'bold', fontSize:12, display:'flex', alignItems:'center', gap:4 },
  emptyState: { textAlign:'center', padding:50, color:'#94a3b8' },
  overlay: { position:'fixed', top:0, left:0, width:'100%', height:'100%', background:'rgba(0,0,0,0.6)', display:'flex', justifyContent:'center', alignItems:'flex-end', zIndex:2000, backdropFilter:'blur(2px)' },
  modal: (m) => ({ background:'white', padding: m ? 15 : 25, borderRadius: m ? '20px 20px 0 0' : 20, width: m ? '100%' : '95%', maxWidth: '1100px', maxHeight: '90vh', overflow: 'hidden', display:'flex', flexDirection:'column' }),
  modalHeader: { display:'flex', justifyContent:'space-between', marginBottom:15 },
  btnClose: { background:'none', border:'none', fontSize:24, cursor:'pointer', color:'#ef4444' },
  thSmall: { padding:10, fontSize:11, textAlign:'left', color:'#64748b', borderBottom:'2px solid #e2e8f0' },
  tdSmall: { padding:10, fontSize:12, borderBottom:'1px solid #f1f5f9' },
  inputNominal: (m) => ({ width: m ? 80 : 100, padding:6, borderRadius:6, border:'2px solid', fontWeight:'bold', textAlign:'right', fontSize: m ? 11 : 12 }),
  badgeSuccess: { color:'#10b981', fontWeight:'bold', fontSize:10, background:'#f0fdf4', padding:'3px 8px', borderRadius:20 },
  btnApprove: { background:'#10b981', color:'white', border:'none', padding:'5px 10px', borderRadius:6, cursor:'pointer', fontSize:11, fontWeight:'bold' },
  btnBonus: { background:'#f59e0b', color:'white', border:'none', padding:'5px 10px', borderRadius:6, cursor:'pointer', fontSize:11, fontWeight:'bold' },
  btnDelete: { background:'#ef4444', color:'white', border:'none', padding:'5px 10px', borderRadius:6, cursor:'pointer', fontSize:11, fontWeight:'bold' },
  btnRevise: { background:'#f1f5f9', color:'#ef4444', border:'1px solid #e2e8f0', padding:'3px 8px', borderRadius:6, cursor:'pointer', fontSize:10, fontWeight:'bold' },
  miniInput: { padding:6, borderRadius:6, border:'1px solid #e2e8f0', fontSize:11, width:'120px' },
  btnSaveBonus: { background:'#1e293b', color:'white', border:'none', padding:'6px 12px', borderRadius:6, cursor:'pointer', fontSize:11, fontWeight:'bold' },

  // 🔥 BARU: modal prompt PIN Owner
  pinModal: {
    background: 'white',
    borderRadius: 16,
    padding: 24,
    width: '90%',
    maxWidth: 340,
  },
  pinModalInput: {
    width: '100%',
    padding: '10px 12px',
    borderRadius: 8,
    border: '1px solid #e2e8f0',
    fontSize: 16,
    textAlign: 'center',
    letterSpacing: 4,
    boxSizing: 'border-box',
  },
  btnSecondaryPin: {
    flex: 1,
    padding: '10px',
    borderRadius: 8,
    border: '1px solid #e2e8f0',
    background: 'white',
    color: '#64748b',
    fontWeight: 700,
    cursor: 'pointer',
  },
  btnPrimaryPin: {
    flex: 1,
    padding: '10px',
    borderRadius: 8,
    border: 'none',
    background: '#1e293b',
    color: 'white',
    fontWeight: 700,
    cursor: 'pointer',
  },
};

export default TeacherSalaries;