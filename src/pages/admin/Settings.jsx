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
import { Save, Lock, Info, Shield, Eye, EyeOff, Plus, Trash2, Crown, LogOut, KeyRound, AlertTriangle } from 'lucide-react';
// 🔥 BARU (pemisahan akun Admin): halaman ini cuma mengurus PASSWORD
// BERSAMA yang lama. Akun per staf dikelola di /admin/pengguna.
import { ambilSemuaAdmin } from '../../utils/adminAuth';
import { catatAudit, KATEGORI } from '../../utils/auditLog';

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
  // 🔥 DIPINDAH: pengaturan honor guru (rates/bonus/kompensasi) sudah
  // gak diedit dari sini lagi -- pindah total ke TeacherSalaries.jsx
  // (halaman Gaji Guru), dikunci pakai verifikasi PIN Owner yang sama.
  // Field `salaryRules` di Firestore (settings/global_config) TETAP
  // ada, cuma gak lagi disentuh/ditulis dari halaman ini -- karena
  // setDoc pakai {merge:true}, gak menyertakan field ini di payload
  // simpan halaman ini AMAN, gak akan menghapus/menimpa data yang
  // sudah diatur dari TeacherSalaries.jsx.

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
  // 🔥 BARU (pemisahan akun Admin): apakah login pakai password bersama
  // masih diizinkan? Default true supaya update ini TIDAK mengunci staf
  // yang belum dibuatkan akun.
  const [izinkanLegacy, setIzinkanLegacy] = useState(true);
  const [jumlahAkunAdmin, setJumlahAkunAdmin] = useState(null);

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
          
          // 🔥 DIPINDAH: salaryRules gak lagi dibaca/diproses di halaman
          // ini -- diatur & ditampilkan langsung dari TeacherSalaries.jsx.

          if (data.ownerPin) setOwnerPin(data.ownerPin);
          if (data.biayaPendaftaran) setBiayaPendaftaran(data.biayaPendaftaran);
          if (data.adminPassword) setAdminPassword(data.adminPassword);
          if (Array.isArray(data.fixedCosts)) setFixedCosts(data.fixedCosts);
          if (Array.isArray(data.assets)) setAssets(data.assets);
          // 🔥 BARU: hanya false eksplisit yang mematikan jalur warisan.
          setIzinkanLegacy(data.izinkanLoginAdminLegacy !== false);
        } else {
          // 🔥 FIX KEAMANAN: sebelumnya kalau dokumen belum ada, sistem
          // otomatis bikin PIN default "2003" yang tertanam di kode --
          // gampang ditemukan siapa aja yang baca source code. Sekarang
          // digenerate ACAK tiap kali pertama kali dibuat, dan admin
          // DIWAJIBKAN gantinya sebelum bisa dipakai (lihat peringatan
          // di bawah).
          const pinAcak = String(Math.floor(1000 + Math.random() * 9000));
          // 🔥 FIX BUG (audit 2026-10-01): `defaultSalaryRules` dipakai di
          // sini tapi TIDAK PERNAH didefinisikan/di-import di file ini --
          // sisa refactor waktu aturan honor dipindah ke TeacherSalaries.jsx.
          // Akibatnya cabang ini melempar ReferenceError, tertelan catch di
          // bawah, sehingga bootstrap settings GAGAL TOTAL: PIN owner tidak
          // pernah terbuat dan admin cuma melihat alert error generik.
          // Field `salaryRules` memang bukan urusan halaman ini lagi --
          // TeacherSalaries.jsx yang membaca (dengan pengaman `if (sr)`)
          // dan menulisnya sendiri, jadi aman untuk tidak diset di sini.
          await setDoc(doc(db, "settings", "global_config"), {
            prices: defaultPrices,
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

    // 🔥 BARU (pemisahan akun Admin): hitung berapa akun per staf yang
    // sudah dibuat, untuk menentukan apakah password bersama aman dimatikan.
    // Gagal hitung tidak boleh menghalangi halaman ini tampil.
    (async () => {
      try {
        const semua = await ambilSemuaAdmin();
        setJumlahAkunAdmin(semua.filter((a) => a.aktif !== false).length);
      } catch (e) {
        console.warn('Gagal menghitung akun admin:', e?.message || e);
        setJumlahAkunAdmin(null);
      }
    })();
  }, []);

  // 🔥 handleUnlock udah gak dipakai lagi -- gerbang akses sekarang di
  // level rute (OwnerRoute), bukan layar kunci internal di komponen ini.
  const handleLogout = () => {
    if (window.confirm("Keluar dari Portal Owner?")) {
      // 🔥 BARU: catat SEBELUM sesi dihapus supaya aktor-nya tetap 'owner'.
      catatAudit('logout', { kategori: KATEGORI.AUTH, target: 'Keluar dari Portal Owner' });
      localStorage.removeItem("isOwnerLoggedIn");
      localStorage.removeItem("role");
      navigate("/");
    }
  };

  const handleSaveData = async () => {
    if (ownerPin.length < 4) return alert("⚠️ PIN Owner minimal 4 karakter!");

    // 🔥 PENGAMAN (pemisahan akun Admin): jangan sampai Owner mematikan
    // password bersama padahal belum ada satu pun akun per staf -- itu
    // akan mengunci SEMUA staf admin keluar.
    //
    // Sengaja memakai `!jumlahAkunAdmin`, BUKAN `jumlahAkunAdmin === 0`.
    // `jumlahAkunAdmin` bernilai `null` kalau pembacaan koleksi admin_users
    // gagal (jaringan/kuota). Kalau yang diuji hanya `=== 0`, keadaan `null`
    // itu lolos dan Owner bisa mengunci seluruh staf hanya karena satu
    // pembacaan yang gagal. Dengan `!`, null dan 0 sama-sama menahan.
    if (!izinkanLegacy && !jumlahAkunAdmin) {
      return alert(
        "⛔ Tidak bisa menyimpan.\n\n" +
        (jumlahAkunAdmin === null
          ? "Jumlah akun admin per staf GAGAL dibaca, jadi sistem tidak bisa memastikan ada akun yang bisa dipakai masuk.\n"
            + "Muat ulang halaman ini dan coba lagi.\n\n"
          : "Anda mematikan 'Password Admin Bersama' tapi belum ada akun admin per staf yang aktif.\n"
            + "Buat dulu akunnya di menu Pengguna Admin, kalau tidak semua staf akan terkunci.\n\n")
        + "(Owner tetap bisa masuk lewat PIN, tapi staf admin tidak.)"
      );
    }

    if (!window.confirm("Simpan semua perubahan pengaturan?")) return;

    setSaving(true);
    try {
      await setDoc(doc(db, "settings", "global_config"), {
        prices, ownerPin, biayaPendaftaran, adminPassword, fixedCosts, assets,
        izinkanLoginAdminLegacy: izinkanLegacy,
      }, { merge: true });

      // 🔥 BARU: perubahan kredensial = wajib tercatat di jejak audit.
      // Isi password & PIN TIDAK dikirim -- catatAudit juga menyaringnya.
      catatAudit('pengaturan.ubah', {
        kategori: KATEGORI.AKUN,
        target: 'Pengaturan global (kredensial & harga)',
        detail: {
          pinOwnerDiubah: true,
          passwordBersamaDiubah: true,
          izinkanLoginAdminLegacy: izinkanLegacy,
          jumlahAkunAdminAktif: jumlahAkunAdmin,
        },
      });

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

  // 🔥 DIPINDAH: fungsi manajemen tarif honor & bonus (addRate, removeRate,
  // updateRate, addBonus, removeBonus, updateBonus) sudah dihapus dari sini
  // -- semua diedit dari TeacherSalaries.jsx sekarang.

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

          {/* 🔥 DIPINDAH: kartu "Aturan Honor Guru" (tarif per jenjang,
              bonus, kompensasi 0 hadir) sudah dipindah TOTAL ke halaman
              Gaji Guru (TeacherSalaries.jsx) -- dikunci verifikasi PIN
              Owner yang sama dengan yang dipakai di halaman ini. */}

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

            {/* ============================================================
                🔥 DIROMBAK (pemisahan akun Admin): field ini dulunya SATU-
                SATUNYA cara staf admin masuk -- satu password dipakai
                bersama oleh semua orang, tanpa username. Akibatnya tidak
                bisa diketahui siapa yang melakukan perubahan apa.

                Sekarang akun per staf dikelola di menu "Pengguna Admin"
                (/admin/pengguna). Field di bawah DIPERTAHANKAN sebagai
                JALUR WARISAN supaya tidak ada staf yang terkunci saat
                update dipasang -- dan bisa dimatikan di sini begitu semua
                staf sudah punya akun sendiri.
                ============================================================ */}
            <div style={styles.legacyBox}>
              <div style={styles.legacyHead}>
                <AlertTriangle size={15} color="#fbbf24" />
                <span style={styles.legacyTitle}>
                  Password Admin Bersama <span style={styles.legacyTag}>JALUR LAMA</span>
                </span>
              </div>
              <p style={styles.legacyText}>
                Semua staf masuk pakai password yang sama, tanpa username — jadi aksi mereka
                tercatat sebagai "akun bersama" dan tidak bisa dipastikan siapa pelakunya.
                Pindahkan staf ke akun masing-masing, lalu matikan jalur ini.
              </p>

              <div style={styles.fieldRow}>
                <span><Shield size={14} /> Password Bersama</span>
                <div style={{ position: 'relative' }}>
                  <input type={showAdminPw ? 'text' : 'password'} value={adminPassword} onChange={e => setAdminPassword(e.target.value)} style={{...styles.input, paddingRight: 30}} placeholder="Password login Admin (lama)" disabled={!izinkanLegacy} />
                  <button type="button" onClick={() => setShowAdminPw(!showAdminPw)} style={styles.miniEyeBtn}>
                    {showAdminPw ? <EyeOff size={13} /> : <Eye size={13} />}
                  </button>
                </div>
              </div>

              <label style={styles.toggleRow}>
                <input
                  type="checkbox"
                  checked={izinkanLegacy}
                  onChange={e => setIzinkanLegacy(e.target.checked)}
                />
                <span>
                  Izinkan staf login dengan password bersama (tanpa username)
                  <small style={styles.toggleHint}>
                    {jumlahAkunAdmin === null
                      ? 'Memuat jumlah akun per staf...'
                      : jumlahAkunAdmin === 0
                        ? '⚠ Belum ada akun per staf — jangan dimatikan dulu, nanti semua staf terkunci.'
                        : `Ada ${jumlahAkunAdmin} akun per staf yang aktif. Aman dimatikan kalau semua staf sudah tahu username-nya.`}
                  </small>
                </span>
              </label>

              <button type="button" style={styles.btnKeAkun} onClick={() => navigate('/admin/pengguna')}>
                <KeyRound size={14} /> Kelola Akun Admin per Staf
              </button>
            </div>
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

  // 🔥 FIX (audit): parameter `m` tidak pernah dipakai di dalam style ini,
  // memicu error no-unused-vars. Pemanggil yang mengirim argumen tetap aman.
  header: () => ({ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 12, background: 'white', padding: 20, borderRadius: 14, boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }),
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

  // 🔥 BARU (pemisahan akun Admin): kotak "jalur lama" untuk password
  // bersama. Sengaja diberi warna kuning/tanda peringatan supaya Owner
  // langsung paham ini bukan cara login yang dianjurkan lagi.
  legacyBox: {
    marginTop: 14, padding: '13px 14px', borderRadius: 12,
    background: '#fffbeb', border: '1px solid #fcd34d',
  },
  legacyHead: { display: 'flex', alignItems: 'center', gap: 7, marginBottom: 6 },
  legacyTitle: { fontSize: 13, fontWeight: 800, color: '#92400e', display: 'flex', alignItems: 'center', gap: 7 },
  legacyTag: {
    background: '#f59e0b', color: '#fff', fontSize: 8.5, fontWeight: 800,
    padding: '2px 6px', borderRadius: 5, letterSpacing: 0.5,
  },
  legacyText: { fontSize: 11.5, color: '#a16207', lineHeight: 1.6, margin: '0 0 8px' },
  toggleRow: {
    display: 'flex', alignItems: 'flex-start', gap: 9, cursor: 'pointer',
    padding: '9px 0', fontSize: 12, color: '#78350f', fontWeight: 600,
    borderTop: '1px dashed #fcd34d',
  },
  toggleHint: { display: 'block', fontWeight: 400, fontSize: 10.5, color: '#a16207', marginTop: 3, lineHeight: 1.5 },
  btnKeAkun: {
    display: 'inline-flex', alignItems: 'center', gap: 7, marginTop: 4,
    background: '#1e293b', color: '#fff', border: 'none', borderRadius: 9,
    padding: '9px 15px', fontSize: 12, fontWeight: 700, cursor: 'pointer',
  },
  infoBox: { background: '#f0fdf4', padding: 12, borderRadius: 8, border: '1px solid #bbf7d0', marginTop: 16, fontSize: 12, color: '#065f46', display: 'flex', alignItems: 'flex-start', gap: 6, flexDirection: 'column' }
};

export default Settings;