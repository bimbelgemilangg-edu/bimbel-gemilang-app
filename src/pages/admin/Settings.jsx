// src/pages/admin/Settings.jsx
// 🔥 HALAMAN INI SEKARANG JADI "OWNER PORTAL" -- sebelumnya nempel di
// dalam layout Admin (SidebarAdmin) dan dikunci pakai layar PIN internal.
// Sekarang gerbangnya udah dipindah ke level RUTE (App.jsx, lewat
// OwnerRoute), diakses lewat login terpisah (/login-owner) -- jadi
// halaman ini gak perlu lagi punya layar kunci sendiri, dan gak lagi
// nebeng sidebar Admin.
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../../firebase';
import { doc, getDoc, setDoc } from "firebase/firestore";
import { Save, Lock, Info, Shield, Eye, EyeOff, Plus, Trash2, Crown, LogOut } from 'lucide-react';

const Settings = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  // DEFAULT DATA PAKET
  const defaultPrices = {
    sd: {
      packages: [
        { id: 'paket1', name: 'Paket 1 SD', price: 150000 },
        { id: 'paket2', name: 'Paket 2 SD', price: 200000 },
        { id: 'paket3', name: 'Paket 3 SD', price: 250000 },
        { id: 'paket4', name: 'Paket 4 SD', price: 300000 }
      ]
    },
    smp: {
      packages: [
        { id: 'paket1', name: 'Paket 1 SMP', price: 200000 },
        { id: 'paket2', name: 'Paket 2 SMP', price: 250000 },
        { id: 'paket3', name: 'Paket 3 SMP', price: 300000 },
        { id: 'paket4', name: 'Paket 4 SMP', price: 400000 }
      ]
    },
    sma: {
      packages: [
        { id: 'paket1', name: 'Paket 1 SMA', price: 300000 },
        { id: 'paket2', name: 'Paket 2 SMA', price: 350000 },
        { id: 'paket3', name: 'Paket 3 SMA', price: 450000 },
        { id: 'paket4', name: 'Paket 4 SMA', price: 550000 }
      ]
    },
    english: {
      levels: [
        { id: 'kids', name: 'Kids', price: 150000 },
        { id: 'junior', name: 'Junior', price: 200000 },
        { id: 'professional', name: 'Professional', price: 300000 }
      ]
    }
  };

  const [prices, setPrices] = useState(defaultPrices);
  // 🔥 STRUKTUR BARU: honor sekarang berupa DAFTAR (array) yang bisa
  // ditambah/dikurangi bebas -- persis kayak paket belajar -- bukan field
  // yang dikunci namanya di kode (honorSD/honorSMP/honorSMA/bonusInggris).
  // `rates` = tarif per-jam berdasarkan jenjang/kategori (bisa nambah
  // kategori baru sebebas-bebasnya, gak cuma SD/SMP/SMA).
  // `bonusRules` = bonus tambahan per-jam yang dipicu kalau program jadwal
  // cocok (misal "English"), juga bisa ditambah bebas.
  const defaultSalaryRules = {
    rates: [
      { id: 'sd', label: 'SD', pricePerHour: 35000 },
      { id: 'smp', label: 'SMP', pricePerHour: 40000 },
      { id: 'sma', label: 'SMA', pricePerHour: 50000 },
    ],
    bonusRules: [
      { id: 'english', label: 'Bonus English', matchProgram: 'English', bonusPerHour: 10000 },
    ],
    kompensasiPersen: 50,
    honorMinimal: 20000,
  };
  const [salaryRules, setSalaryRules] = useState(defaultSalaryRules);

  const [ownerPin, setOwnerPin] = useState(""); // 🔥 sengaja kosong (bukan "2003"), cuma keisi dari database
  const [saving, setSaving] = useState(false);
  const [biayaPendaftaran, setBiayaPendaftaran] = useState(25000);
  // 🔥 BARU: Biaya Tetap (fixed cost) -- pengeluaran rutin bulanan yang
  // gak tergantung jumlah siswa (sewa, listrik, internet, dll). Dipakai
  // buat ngitung profit bersih yang sesungguhnya, bukan cuma "kas yang ada".
  const [fixedCosts, setFixedCosts] = useState([
    { id: 'sewa', label: 'Sewa Tempat', amountPerMonth: 0 },
    { id: 'listrik', label: 'Listrik & Air', amountPerMonth: 0 },
    { id: 'internet', label: 'Internet/WiFi', amountPerMonth: 0 },
  ]);
  // 🔥 BARU: Aset & Penyusutan -- barang yang dibeli sekali tapi dipakai
  // lama (AC, proyektor, dll). Penyusutan per bulan dihitung otomatis:
  // harga beli ÷ perkiraan umur pakai (bulan).
  const [assets, setAssets] = useState([]);
  // 🔥 BARU: sebelumnya field adminPassword ini DIBACA oleh Login.jsx tapi
  // GAK ADA TEMPAT SAMA SEKALI buat mengaturnya dari UI -- pasti diset
  // manual langsung ke database. Sekarang Owner bisa atur dari sini.
  const [adminPassword, setAdminPassword] = useState("");
  const [showAdminPw, setShowAdminPw] = useState(false);
  const [showOwnerPin, setShowOwnerPin] = useState(false);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const docRef = doc(db, "settings", "global_config");
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          
          // Merge dengan default untuk memastikan struktur selalu ada
          if (data.prices) {
            setPrices(prev => ({
              sd: { packages: data.prices.sd?.packages || prev.sd.packages },
              smp: { packages: data.prices.smp?.packages || prev.smp.packages },
              sma: { packages: data.prices.sma?.packages || prev.sma.packages },
              english: { levels: data.prices.english?.levels || prev.english.levels }
            }));
          }
          
          if (data.salaryRules) {
            // 🔥 MIGRASI OTOMATIS: kalau data yang tersimpan masih format
            // LAMA (honorSD/honorSMP/honorSMA/bonusInggris sebagai field
            // tunggal, bukan array `rates`), ubah dulu ke format BARU di
            // sini -- biar honor yang udah pernah diatur admin sebelumnya
            // GAK HILANG begitu fitur ini di-update. Kalau sudah format
            // baru (ada `rates`), langsung dipakai apa adanya.
            const old = data.salaryRules;
            if (Array.isArray(old.rates)) {
              setSalaryRules({
                rates: old.rates,
                bonusRules: Array.isArray(old.bonusRules) ? old.bonusRules : defaultSalaryRules.bonusRules,
                kompensasiPersen: old.kompensasiPersen ?? defaultSalaryRules.kompensasiPersen,
                honorMinimal: old.honorMinimal ?? defaultSalaryRules.honorMinimal,
              });
            } else {
              setSalaryRules({
                rates: [
                  { id: 'sd', label: 'SD', pricePerHour: old.honorSD ?? 35000 },
                  { id: 'smp', label: 'SMP', pricePerHour: old.honorSMP ?? 40000 },
                  { id: 'sma', label: 'SMA', pricePerHour: old.honorSMA ?? 50000 },
                ],
                bonusRules: [
                  { id: 'english', label: 'Bonus English', matchProgram: 'English', bonusPerHour: old.bonusInggris ?? 10000 },
                ],
                kompensasiPersen: old.kompensasiPersen ?? 50,
                honorMinimal: old.honorMinimal ?? 20000,
              });
            }
          }
          if (data.ownerPin) setOwnerPin(data.ownerPin);
          if (data.biayaPendaftaran) setBiayaPendaftaran(data.biayaPendaftaran);
          if (data.adminPassword) setAdminPassword(data.adminPassword);
          if (Array.isArray(data.fixedCosts)) setFixedCosts(data.fixedCosts);
          if (Array.isArray(data.assets)) setAssets(data.assets);
        } else {
          // 🔥 FIX KEAMANAN: sebelumnya kalau dokumen belum ada, sistem
          // otomatis bikin PIN default "2003" yang tertanam di kode --
          // gampang ditemukan siapa aja yang baca source code. Sekarang
          // digenerate ACAK tiap kali pertama kali dibuat, dan admin
          // DIWAJIBKAN gantinya sebelum bisa dipakai (lihat peringatan
          // di bawah).
          const pinAcak = String(Math.floor(1000 + Math.random() * 9000));
          await setDoc(doc(db, "settings", "global_config"), {
            prices: defaultPrices,
            salaryRules: defaultSalaryRules,
            ownerPin: pinAcak,
            biayaPendaftaran: 25000
          });
          setOwnerPin(pinAcak);
          alert(`🔐 PIN Owner otomatis dibuat: ${pinAcak}\n\nCatat PIN ini sekarang, lalu SEGERA ganti dengan PIN pilihan Anda sendiri di bagian bawah halaman ini setelah masuk.`);
        }
      } catch (error) { 
        console.error("Error loading settings:", error);
        // Gunakan default jika error
        setPrices(defaultPrices);
      }
      finally { setLoading(false); }
    };
    fetchSettings();
  }, []);

  // 🔥 handleUnlock udah gak dipakai lagi -- gerbang akses sekarang di
  // level rute (OwnerRoute), bukan layar kunci internal di komponen ini.
  const handleLogout = () => {
    if (window.confirm("Keluar dari Portal Owner?")) {
      localStorage.removeItem("isOwnerLoggedIn");
      localStorage.removeItem("role");
      navigate("/");
    }
  };

  const handleSaveData = async () => {
    if (ownerPin.length < 4) return alert("⚠️ PIN Owner minimal 4 karakter!");
    if (!window.confirm("Simpan semua perubahan pengaturan?")) return;
    
    setSaving(true);
    try {
      await setDoc(doc(db, "settings", "global_config"), {
        prices, salaryRules, ownerPin, biayaPendaftaran, adminPassword, fixedCosts, assets
      }, { merge: true });
      alert("✅ Pengaturan Berhasil Disimpan!");
    } catch (error) {
      alert("❌ Gagal menyimpan: " + error.message);
    } finally {
      setSaving(false);
    }
  };

  // === FUNGSI MANAJEMEN PAKET ===
  const addPackage = (jenjang) => {
    const currentPackages = prices[jenjang]?.packages || [];
    const newId = `paket${currentPackages.length + 1}`;
    setPrices({
      ...prices,
      [jenjang]: {
        ...prices[jenjang],
        packages: [
          ...currentPackages,
          { id: newId, name: `Paket ${currentPackages.length + 1}`, price: 0 }
        ]
      }
    });
  };

  const removePackage = (jenjang, index) => {
    const currentPackages = prices[jenjang]?.packages || [];
    if (currentPackages.length <= 1) {
      alert("Minimal 1 paket harus ada!");
      return;
    }
    const newPackages = currentPackages.filter((_, i) => i !== index);
    setPrices({
      ...prices,
      [jenjang]: {
        ...prices[jenjang],
        packages: newPackages
      }
    });
  };

  const updatePackage = (jenjang, index, field, value) => {
    const currentPackages = prices[jenjang]?.packages || [];
    const newPackages = [...currentPackages];
    newPackages[index] = { ...newPackages[index], [field]: value };
    setPrices({
      ...prices,
      [jenjang]: {
        ...prices[jenjang],
        packages: newPackages
      }
    });
  };

  const addEnglishLevel = () => {
    const currentLevels = prices.english?.levels || [];
    const newId = `level${currentLevels.length + 1}`;
    setPrices({
      ...prices,
      english: {
        ...prices.english,
        levels: [
          ...currentLevels,
          { id: newId, name: `Level ${currentLevels.length + 1}`, price: 0 }
        ]
      }
    });
  };

  const removeEnglishLevel = (index) => {
    const currentLevels = prices.english?.levels || [];
    if (currentLevels.length <= 1) {
      alert("Minimal 1 level harus ada!");
      return;
    }
    const newLevels = currentLevels.filter((_, i) => i !== index);
    setPrices({
      ...prices,
      english: {
        ...prices.english,
        levels: newLevels
      }
    });
  };

  const updateEnglishLevel = (index, field, value) => {
    const currentLevels = prices.english?.levels || [];
    const newLevels = [...currentLevels];
    newLevels[index] = { ...newLevels[index], [field]: value };
    setPrices({
      ...prices,
      english: {
        ...prices.english,
        levels: newLevels
      }
    });
  };

  // === FUNGSI MANAJEMEN TARIF HONOR (BARU -- bisa tambah/kurang bebas) ===
  const addRate = () => {
    const current = salaryRules.rates || [];
    const newId = `rate${Date.now().toString().slice(-5)}`;
    setSalaryRules({
      ...salaryRules,
      rates: [...current, { id: newId, label: `Kategori Baru`, pricePerHour: 0 }]
    });
  };

  const removeRate = (index) => {
    const current = salaryRules.rates || [];
    if (current.length <= 1) {
      alert("Minimal 1 kategori tarif harus ada!");
      return;
    }
    setSalaryRules({
      ...salaryRules,
      rates: current.filter((_, i) => i !== index)
    });
  };

  const updateRate = (index, field, value) => {
    const current = salaryRules.rates || [];
    const updated = [...current];
    updated[index] = { ...updated[index], [field]: value };
    setSalaryRules({ ...salaryRules, rates: updated });
  };

  // === FUNGSI MANAJEMEN BONUS HONOR (BARU -- bisa tambah/kurang bebas) ===
  const addBonus = () => {
    const current = salaryRules.bonusRules || [];
    const newId = `bonus${Date.now().toString().slice(-5)}`;
    setSalaryRules({
      ...salaryRules,
      bonusRules: [...current, { id: newId, label: 'Bonus Baru', matchProgram: '', bonusPerHour: 0 }]
    });
  };

  const removeBonus = (index) => {
    const current = salaryRules.bonusRules || [];
    setSalaryRules({
      ...salaryRules,
      bonusRules: current.filter((_, i) => i !== index)
    });
  };

  const updateBonus = (index, field, value) => {
    const current = salaryRules.bonusRules || [];
    const updated = [...current];
    updated[index] = { ...updated[index], [field]: value };
    setSalaryRules({ ...salaryRules, bonusRules: updated });
  };

  // === FUNGSI MANAJEMEN BIAYA TETAP (BARU) ===
  const addFixedCost = () => {
    setFixedCosts([...fixedCosts, { id: `fc${Date.now().toString().slice(-5)}`, label: 'Biaya Baru', amountPerMonth: 0 }]);
  };
  const removeFixedCost = (index) => {
    setFixedCosts(fixedCosts.filter((_, i) => i !== index));
  };
  const updateFixedCost = (index, field, value) => {
    const updated = [...fixedCosts];
    updated[index] = { ...updated[index], [field]: value };
    setFixedCosts(updated);
  };

  // === FUNGSI MANAJEMEN ASET & PENYUSUTAN (BARU) ===
  const addAsset = () => {
    setAssets([...assets, { id: `as${Date.now().toString().slice(-5)}`, label: 'Aset Baru', purchasePrice: 0, usefulLifeMonths: 12 }]);
  };
  const removeAsset = (index) => {
    setAssets(assets.filter((_, i) => i !== index));
  };
  const updateAsset = (index, field, value) => {
    const updated = [...assets];
    updated[index] = { ...updated[index], [field]: value };
    setAssets(updated);
  };

  if (loading) return (
    <div style={styles.wrapper}>
      <div style={{textAlign: 'center', padding: 80}}>Memuat pengaturan...</div>
    </div>
  );

  return (
    <div style={styles.wrapper}>
      <div style={styles.mainContent(isMobile)}>

        {/* 🔥 HEADER KHAS OWNER PORTAL -- menggantikan SidebarAdmin, karena
            halaman ini sekarang berdiri sendiri terpisah dari Admin. */}
        <div style={styles.ownerTopBar}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={styles.ownerBadge}><Crown size={16} color="#78350f" /></div>
            <div>
              <div style={{ fontWeight: 800, fontSize: 14, color: '#78350f' }}>Portal Owner</div>
              <div style={{ fontSize: 10, color: '#92400e' }}>Bimbel Gemilang</div>
            </div>
          </div>
          <button onClick={handleLogout} style={styles.btnLogoutOwner}>
            <LogOut size={14} /> Keluar
          </button>
        </div>

        <div style={styles.ownerTabs}>
          <div style={styles.ownerTabActive}>⚙️ Pengaturan</div>
          <div style={styles.ownerTab} onClick={() => navigate('/owner/finance')}>📊 Keuangan</div>
        </div>
        
        <div style={styles.header(isMobile)}>
          <div>
            <h2 style={styles.pageTitle}>⚙️ Pengaturan Sistem</h2>
            <p style={styles.subtitle}>Kelola harga paket, honor guru, dan PIN keamanan</p>
          </div>
          <button onClick={handleSaveData} disabled={saving} style={styles.btnSave}>
            <Save size={18} /> {saving ? 'Menyimpan...' : 'SIMPAN SEMUA'}
          </button>
        </div>

        <div style={styles.grid(isMobile)}>

          {/* === HONOR GURU === */}
          <div style={styles.card}>
            <h3 style={styles.cardTitle}>💰 Aturan Honor Guru</h3>
            <p style={styles.cardDesc}>Berlaku otomatis saat guru menyelesaikan kelas. Nominal TIDAK ditampilkan ke guru.</p>

            {/* 🔥 TARIF PER KATEGORI -- sekarang bebas ditambah/dikurangi,
                gak cuma SD/SMP/SMA yang dikunci di kode. Label di sini
                yang dicocokkan ke jenjang jadwal saat guru menutup kelas. */}
            <div style={styles.jenjangHeader}>
              <h4 style={styles.subTitle}>Tarif per Kategori/Jenjang (per jam)</h4>
              <button onClick={addRate} style={styles.btnAdd}>
                <Plus size={14} /> Tambah Kategori
              </button>
            </div>
            {(salaryRules.rates || []).map((r, idx) => (
              <div key={r.id || idx} style={styles.packageRow}>
                <input
                  type="text"
                  value={r.label || ''}
                  onChange={e => updateRate(idx, 'label', e.target.value)}
                  style={styles.packageNameInput}
                  placeholder="Nama kategori (misal: SD, Privat, dll)"
                />
                <input
                  type="number"
                  value={r.pricePerHour || 0}
                  onChange={e => updateRate(idx, 'pricePerHour', parseInt(e.target.value) || 0)}
                  style={styles.packagePriceInput}
                  placeholder="Rp/jam"
                />
                <button onClick={() => removeRate(idx)} style={styles.btnRemove}>
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
            <p style={{fontSize: 10, color: '#94a3b8', marginTop: 4}}>
              💡 "Nama kategori" ini harus sama dengan "Jenjang" yang dipilih admin pas bikin jadwal (contoh: SD, SMP, SMA), biar tarifnya otomatis ketemu.
            </p>

            <div style={styles.divider} />

            {/* 🔥 BONUS TAMBAHAN -- juga bebas ditambah/dikurangi. Dipicu
                kalau nama Program di jadwal cocok sama "Berlaku untuk
                Program" di bawah (misal "English"). */}
            <div style={styles.jenjangHeader}>
              <h4 style={styles.subTitle}>Bonus Tambahan (per jam)</h4>
              <button onClick={addBonus} style={styles.btnAdd}>
                <Plus size={14} /> Tambah Bonus
              </button>
            </div>
            {(salaryRules.bonusRules || []).map((b, idx) => (
              <div key={b.id || idx} style={styles.packageRow}>
                <input
                  type="text"
                  value={b.label || ''}
                  onChange={e => updateBonus(idx, 'label', e.target.value)}
                  style={{...styles.packageNameInput, flex: 1.3}}
                  placeholder="Nama bonus"
                />
                <input
                  type="text"
                  value={b.matchProgram || ''}
                  onChange={e => updateBonus(idx, 'matchProgram', e.target.value)}
                  style={{...styles.packageNameInput, flex: 1}}
                  placeholder="Berlaku utk Program (misal: English)"
                />
                <input
                  type="number"
                  value={b.bonusPerHour || 0}
                  onChange={e => updateBonus(idx, 'bonusPerHour', parseInt(e.target.value) || 0)}
                  style={styles.packagePriceInput}
                  placeholder="Rp/jam"
                />
                <button onClick={() => removeBonus(idx)} style={styles.btnRemove}>
                  <Trash2 size={14} />
                </button>
              </div>
            ))}

            <div style={styles.divider} />
            <div style={styles.fieldRow}>
              <span>Kompensasi 0 Hadir (%)</span>
              <div style={{display: 'flex', alignItems: 'center', gap: 6}}>
                <input type="number" value={salaryRules.kompensasiPersen} onChange={e => setSalaryRules({...salaryRules, kompensasiPersen: parseInt(e.target.value) || 0})} style={{...styles.input, width: 70}} />
                <span style={{fontSize: 11, color: '#64748b'}}>%</span>
              </div>
            </div>
            <div style={styles.fieldRow}>
              <span>Honor Minimal/Sesi</span>
              <input type="number" value={salaryRules.honorMinimal} onChange={e => setSalaryRules({...salaryRules, honorMinimal: parseInt(e.target.value) || 0})} style={styles.input} />
            </div>

            <div style={styles.infoBox}>
              <Info size={14} /> <strong>Cara Hitung:</strong><br/>
              <span style={{fontSize: 11}}>Tarif dicari dari kategori yang cocok dengan Jenjang jadwal. Kalau Program jadwal cocok sama salah satu Bonus, ditambahkan ke tarif dasar. Kalau 0 siswa hadir: {salaryRules.kompensasiPersen}% dari tarif dasar × jam.</span>
            </div>
          </div>

          {/* === HARGA PAKET === */}
          <div style={styles.card}>
            <h3 style={styles.cardTitle}>📚 Harga Paket Belajar</h3>
            <p style={styles.cardDesc}>Tambahkan/kelola paket untuk setiap jenjang. Harga akan otomatis terupdate di halaman pendaftaran.</p>

            {/* Biaya Pendaftaran */}
            <div style={styles.fieldRow}>
              <span>📋 Biaya Pendaftaran</span>
              <input type="number" value={biayaPendaftaran} onChange={e => setBiayaPendaftaran(parseInt(e.target.value) || 0)} style={styles.input} />
            </div>
            <div style={styles.divider} />

            {/* SD */}
            <div style={styles.jenjangSection}>
              <div style={styles.jenjangHeader}>
                <h4 style={styles.subTitle}>🎒 SD</h4>
                <button onClick={() => addPackage('sd')} style={styles.btnAdd}>
                  <Plus size={14} /> Tambah Paket
                </button>
              </div>
              {prices.sd?.packages?.map((pkg, idx) => (
                <div key={pkg.id || idx} style={styles.packageRow}>
                  <input 
                    type="text" 
                    value={pkg.name || ''} 
                    onChange={e => updatePackage('sd', idx, 'name', e.target.value)}
                    style={styles.packageNameInput}
                    placeholder="Nama Paket"
                  />
                  <input 
                    type="number" 
                    value={pkg.price || 0} 
                    onChange={e => updatePackage('sd', idx, 'price', parseInt(e.target.value) || 0)}
                    style={styles.packagePriceInput}
                    placeholder="Harga"
                  />
                  <button onClick={() => removePackage('sd', idx)} style={styles.btnRemove}>
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>

            <div style={styles.divider} />

            {/* SMP */}
            <div style={styles.jenjangSection}>
              <div style={styles.jenjangHeader}>
                <h4 style={styles.subTitle}>🎒 SMP</h4>
                <button onClick={() => addPackage('smp')} style={styles.btnAdd}>
                  <Plus size={14} /> Tambah Paket
                </button>
              </div>
              {prices.smp?.packages?.map((pkg, idx) => (
                <div key={pkg.id || idx} style={styles.packageRow}>
                  <input 
                    type="text" 
                    value={pkg.name || ''} 
                    onChange={e => updatePackage('smp', idx, 'name', e.target.value)}
                    style={styles.packageNameInput}
                    placeholder="Nama Paket"
                  />
                  <input 
                    type="number" 
                    value={pkg.price || 0} 
                    onChange={e => updatePackage('smp', idx, 'price', parseInt(e.target.value) || 0)}
                    style={styles.packagePriceInput}
                    placeholder="Harga"
                  />
                  <button onClick={() => removePackage('smp', idx)} style={styles.btnRemove}>
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>

            <div style={styles.divider} />

            {/* SMA */}
            <div style={styles.jenjangSection}>
              <div style={styles.jenjangHeader}>
                <h4 style={styles.subTitle}>🎒 SMA</h4>
                <button onClick={() => addPackage('sma')} style={styles.btnAdd}>
                  <Plus size={14} /> Tambah Paket
                </button>
              </div>
              {prices.sma?.packages?.map((pkg, idx) => (
                <div key={pkg.id || idx} style={styles.packageRow}>
                  <input 
                    type="text" 
                    value={pkg.name || ''} 
                    onChange={e => updatePackage('sma', idx, 'name', e.target.value)}
                    style={styles.packageNameInput}
                    placeholder="Nama Paket"
                  />
                  <input 
                    type="number" 
                    value={pkg.price || 0} 
                    onChange={e => updatePackage('sma', idx, 'price', parseInt(e.target.value) || 0)}
                    style={styles.packagePriceInput}
                    placeholder="Harga"
                  />
                  <button onClick={() => removePackage('sma', idx)} style={styles.btnRemove}>
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>

            <div style={styles.divider} />

            {/* English */}
            <div style={styles.jenjangSection}>
              <div style={styles.jenjangHeader}>
                <h4 style={styles.subTitle}>🗣️ English Course</h4>
                <button onClick={addEnglishLevel} style={styles.btnAdd}>
                  <Plus size={14} /> Tambah Level
                </button>
              </div>
              {prices.english?.levels?.map((lvl, idx) => (
                <div key={lvl.id || idx} style={styles.packageRow}>
                  <input 
                    type="text" 
                    value={lvl.name || ''} 
                    onChange={e => updateEnglishLevel(idx, 'name', e.target.value)}
                    style={styles.packageNameInput}
                    placeholder="Nama Level"
                  />
                  <input 
                    type="number" 
                    value={lvl.price || 0} 
                    onChange={e => updateEnglishLevel(idx, 'price', parseInt(e.target.value) || 0)}
                    style={styles.packagePriceInput}
                    placeholder="Harga"
                  />
                  <button onClick={() => removeEnglishLevel(idx)} style={styles.btnRemove}>
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>

            <div style={styles.divider} />
            
            {/* PIN & PASSWORD AKSES */}
            <h4 style={styles.subTitle}>🔐 Akses & Keamanan</h4>
            <div style={styles.fieldRow}>
              <span><Crown size={14} /> PIN Owner (Portal ini)</span>
              <div style={{ position: 'relative' }}>
                <input type={showOwnerPin ? 'text' : 'password'} value={ownerPin} onChange={e => setOwnerPin(e.target.value)} style={{...styles.input, paddingRight: 30}} maxLength={6} placeholder="Min 4 digit" />
                <button type="button" onClick={() => setShowOwnerPin(!showOwnerPin)} style={styles.miniEyeBtn}>
                  {showOwnerPin ? <EyeOff size={13} /> : <Eye size={13} />}
                </button>
              </div>
            </div>
            <p style={{fontSize: 10, color: '#94a3b8', marginTop: 2, marginBottom: 10}}>Dipakai buat login Portal Owner ini, dan buat otorisasi hapus/edit transaksi keuangan di sisi Admin.</p>

            {/* 🔥 BARU: sebelumnya field ini dibaca Login.jsx tapi gak ada
                tempat ngaturnya sama sekali dari UI. */}
            <div style={styles.fieldRow}>
              <span><Shield size={14} /> Password Admin</span>
              <div style={{ position: 'relative' }}>
                <input type={showAdminPw ? 'text' : 'password'} value={adminPassword} onChange={e => setAdminPassword(e.target.value)} style={{...styles.input, paddingRight: 30}} placeholder="Password login Admin" />
                <button type="button" onClick={() => setShowAdminPw(!showAdminPw)} style={styles.miniEyeBtn}>
                  {showAdminPw ? <EyeOff size={13} /> : <Eye size={13} />}
                </button>
              </div>
            </div>
            <p style={{fontSize: 10, color: '#ef4444', marginTop: 2}}>⚠️ Ini password yang dipakai staf Admin buat login sehari-hari. Beda sama PIN Owner di atas.</p>
          </div>

          {/* === BIAYA TETAP & ASET/PENYUSUTAN (BARU) === */}
          <div style={styles.card}>
            <h3 style={styles.cardTitle}>🏢 Biaya Tetap & Penyusutan</h3>
            <p style={styles.cardDesc}>Biaya rutin bulanan yang gak tergantung jumlah siswa, dan penyusutan aset. Ini yang bikin laporan Profit di menu Keuangan jadi jujur -- bukan cuma "kas yang ada", tapi profit setelah dikurangi semua biaya ini.</p>

            <div style={styles.jenjangHeader}>
              <h4 style={styles.subTitle}>Biaya Tetap (per bulan)</h4>
              <button onClick={addFixedCost} style={styles.btnAdd}>
                <Plus size={14} /> Tambah Biaya
              </button>
            </div>
            {fixedCosts.length === 0 && <p style={{fontSize: 11, color: '#94a3b8'}}>Belum ada biaya tetap.</p>}
            {fixedCosts.map((fc, idx) => (
              <div key={fc.id || idx} style={styles.packageRow}>
                <input
                  type="text"
                  value={fc.label || ''}
                  onChange={e => updateFixedCost(idx, 'label', e.target.value)}
                  style={styles.packageNameInput}
                  placeholder="Nama biaya (misal: Sewa, Listrik)"
                />
                <input
                  type="number"
                  value={fc.amountPerMonth || 0}
                  onChange={e => updateFixedCost(idx, 'amountPerMonth', parseInt(e.target.value) || 0)}
                  style={styles.packagePriceInput}
                  placeholder="Rp/bulan"
                />
                <button onClick={() => removeFixedCost(idx)} style={styles.btnRemove}>
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
            <div style={{ textAlign: 'right', fontSize: 11, fontWeight: 700, color: '#64748b', marginTop: 6 }}>
              Total Biaya Tetap: Rp {fixedCosts.reduce((s, f) => s + (parseInt(f.amountPerMonth) || 0), 0).toLocaleString()}/bulan
            </div>

            <div style={styles.divider} />

            <div style={styles.jenjangHeader}>
              <h4 style={styles.subTitle}>Aset & Penyusutan</h4>
              <button onClick={addAsset} style={styles.btnAdd}>
                <Plus size={14} /> Tambah Aset
              </button>
            </div>
            {assets.length === 0 && <p style={{fontSize: 11, color: '#94a3b8'}}>Belum ada aset tercatat (contoh: AC, proyektor, meja-kursi).</p>}
            {assets.map((a, idx) => {
              const penyusutanBulanan = a.usefulLifeMonths > 0 ? Math.round((a.purchasePrice || 0) / a.usefulLifeMonths) : 0;
              return (
                <div key={a.id || idx} style={{ marginBottom: 8, padding: 10, background: '#f8fafc', borderRadius: 8, border: '1px solid #e2e8f0' }}>
                  <div style={{ display: 'flex', gap: 6, marginBottom: 6 }}>
                    <input
                      type="text"
                      value={a.label || ''}
                      onChange={e => updateAsset(idx, 'label', e.target.value)}
                      style={{...styles.packageNameInput, flex: 2}}
                      placeholder="Nama aset (misal: AC Ruang Venus)"
                    />
                    <button onClick={() => removeAsset(idx)} style={styles.btnRemove}>
                      <Trash2 size={14} />
                    </button>
                  </div>
                  <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                    <div style={{ flex: 1 }}>
                      <label style={{ fontSize: 9, color: '#94a3b8' }}>Harga Beli (Rp)</label>
                      <input
                        type="number"
                        value={a.purchasePrice || 0}
                        onChange={e => updateAsset(idx, 'purchasePrice', parseInt(e.target.value) || 0)}
                        style={{...styles.packagePriceInput, width: '100%', boxSizing: 'border-box'}}
                      />
                    </div>
                    <div style={{ flex: 1 }}>
                      <label style={{ fontSize: 9, color: '#94a3b8' }}>Umur Pakai (bulan)</label>
                      <input
                        type="number"
                        value={a.usefulLifeMonths || 0}
                        onChange={e => updateAsset(idx, 'usefulLifeMonths', parseInt(e.target.value) || 0)}
                        style={{...styles.packagePriceInput, width: '100%', boxSizing: 'border-box'}}
                      />
                    </div>
                  </div>
                  <div style={{ fontSize: 10, color: '#3b82f6', marginTop: 6, fontWeight: 700 }}>
                    Penyusutan: Rp {penyusutanBulanan.toLocaleString()}/bulan
                  </div>
                </div>
              );
            })}
            <div style={{ textAlign: 'right', fontSize: 11, fontWeight: 700, color: '#64748b', marginTop: 6 }}>
              Total Penyusutan: Rp {assets.reduce((s, a) => s + (a.usefulLifeMonths > 0 ? Math.round((a.purchasePrice || 0) / a.usefulLifeMonths) : 0), 0).toLocaleString()}/bulan
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// === STYLES ===
const styles = {
  wrapper: { display: 'flex', background: '#f8fafc', minHeight: '100vh' },
  mainContent: (m) => ({ padding: m ? '15px' : '30px', width: '100%', maxWidth: 1300, margin: '0 auto', boxSizing: 'border-box' }),
  ownerTopBar: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'linear-gradient(135deg,#fef3c7,#fde68a)', border: '1px solid #fbbf24', padding: '10px 16px', borderRadius: 12, marginBottom: 16 },
  ownerBadge: { width: 32, height: 32, borderRadius: 10, background: 'rgba(255,255,255,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  btnLogoutOwner: { display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', background: 'white', color: '#92400e', border: '1px solid #fbbf24', borderRadius: 8, cursor: 'pointer', fontWeight: 700, fontSize: 12 },
  ownerTabs: { display: 'flex', gap: 8, marginBottom: 16 },
  ownerTabActive: { padding: '8px 16px', borderRadius: 8, background: '#1e293b', color: 'white', fontWeight: 700, fontSize: 12, cursor: 'default' },
  ownerTab: { padding: '8px 16px', borderRadius: 8, background: 'white', color: '#64748b', fontWeight: 700, fontSize: 12, cursor: 'pointer', border: '1px solid #e2e8f0' },
  
  lockOverlay: { height: '100vh', background: '#0f172a', width: '100vw', position: 'fixed', top: 0, left: 0, display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 9999 },
  lockCard: { background: 'white', padding: 40, borderRadius: 20, textAlign: 'center', width: 320, maxWidth: '90vw', boxShadow: '0 20px 50px rgba(0,0,0,0.3)' },
  pinInput: { padding: 12, fontSize: 20, textAlign: 'center', width: '100%', marginBottom: 15, borderRadius: 10, border: '1px solid #ddd', boxSizing: 'border-box', letterSpacing: 8 },
  eyeBtn: { position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' },
  btnUnlock: { width: '100%', padding: 14, background: '#1e293b', color: 'white', border: 'none', borderRadius: 10, cursor: 'pointer', fontWeight: 'bold', fontSize: 14 },

  header: (m) => ({ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 12, background: 'white', padding: 20, borderRadius: 14, boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }),
  pageTitle: { margin: 0, color: '#1e293b', fontSize: 20 },
  subtitle: { color: '#64748b', fontSize: 12, margin: '4px 0 0' },
  btnSave: { display: 'flex', alignItems: 'center', gap: 8, padding: '12px 24px', background: '#1e293b', color: 'white', border: 'none', borderRadius: 10, cursor: 'pointer', fontWeight: 'bold', fontSize: 14 },

  grid: (m) => ({ display: 'grid', gridTemplateColumns: m ? '1fr' : 'repeat(auto-fit, minmax(450px, 1fr))', gap: 20 }),
  
  card: { background: 'white', padding: 24, borderRadius: 14, boxShadow: '0 2px 8px rgba(0,0,0,0.04)', border: '1px solid #f1f5f9' },
  cardTitle: { margin: '0 0 4px', fontSize: 16, fontWeight: 'bold', color: '#1e293b' },
  cardDesc: { color: '#94a3b8', fontSize: 11, marginBottom: 16 },
  
  jenjangSection: { marginBottom: 12 },
  jenjangHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  subTitle: { color: '#64748b', fontSize: 12, fontWeight: 'bold', margin: 0, borderBottom: 'none', paddingBottom: 0 },
  
  btnAdd: { display: 'flex', alignItems: 'center', gap: 4, padding: '4px 12px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 11, fontWeight: 'bold' },
  btnRemove: { padding: '4px 8px', background: '#fee2e2', color: '#dc2626', border: 'none', borderRadius: 6, cursor: 'pointer' },
  
  packageRow: { display: 'flex', gap: 6, alignItems: 'center', marginBottom: 6 },
  packageNameInput: { flex: 2, padding: '6px 10px', borderRadius: 6, border: '1px solid #e2e8f0', fontSize: 12, background: '#f8fafc' },
  packagePriceInput: { flex: 1, padding: '6px 10px', borderRadius: 6, border: '1px solid #e2e8f0', fontSize: 12, textAlign: 'right', background: '#f8fafc' },
  
  fieldRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid #f8fafc', gap: 10 },
  input: { width: 120, padding: '8px 10px', borderRadius: 8, border: '1px solid #e2e8f0', textAlign: 'right', fontSize: 13, fontWeight: 'bold', background: '#f8fafc' },
  divider: { height: 1, background: '#f1f5f9', margin: '12px 0' },
  miniEyeBtn: { position: 'absolute', right: 6, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: 2, display: 'flex' },
  infoBox: { background: '#f0fdf4', padding: 12, borderRadius: 8, border: '1px solid #bbf7d0', marginTop: 16, fontSize: 12, color: '#065f46', display: 'flex', alignItems: 'flex-start', gap: 6, flexDirection: 'column' }
};

export default Settings;