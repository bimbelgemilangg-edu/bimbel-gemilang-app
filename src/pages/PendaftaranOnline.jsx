// src/pages/PendaftaranOnline.jsx
import React, { useState } from 'react';
import { db } from '../firebase';
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

// ============================================================
// 🔥 LINK MIDTRANS UNIVERSAL
// ============================================================
const MIDTRANS_BASE_LINK = "https://app.sandbox.midtrans.com/payment-links/67c22c45-6baa-421b-a7b2-a12289639be9-UJZJAOFg";

// ============================================================
// DATA MASTER PAKET LENGKAP
// ============================================================
const LIST_PAKET_MASTER = {
  SD: [
    { id: "sd_fokus_1", nama: "SD Fokus 1 Bulan", harga: 95000, desc: "1 Mapel pilihan, tentor spesialis" },
    { id: "sd_fokus_3", nama: "SD Fokus 3 Bulan", harga: 275000, desc: "1 Mapel selama 3 bulan (Lebih Hemat)" },
    { id: "sd_fokus_6", nama: "SD Fokus 6 Bulan", harga: 540000, desc: "1 Mapel selama 6 bulan konsisten" },
    { id: "sd_fokus_12", nama: "SD Fokus 12 Bulan", harga: 1050000, desc: "1 Mapel selama 1 tahun ajaran penuh" },
    { id: "sd_duo_1", nama: "SD Duo 1 Bulan", harga: 175000, desc: "2 Mapel pilihan siswa kelas 3-6" },
    { id: "sd_duo_3", nama: "SD Duo 3 Bulan", harga: 499000, desc: "2 Mapel selama 3 bulan lebih ekonomis" },
    { id: "sd_duo_6", nama: "SD Duo 6 Bulan", harga: 975000, desc: "2 Mapel selama 6 bulan pendampingan" },
    { id: "sd_duo_12", nama: "SD Duo 12 Bulan", harga: 1900000, desc: "2 Mapel selama 1 tahun ajaran penuh" },
    { id: "sd_lengkap_1", nama: "SD Lengkap 1 Bulan", harga: 250000, desc: "Matematika, B.Indo, B.Inggris, IPAS" },
    { id: "sd_lengkap_3", nama: "SD Lengkap 3 Bulan", harga: 699000, desc: "Reguler SD lengkap selama 3 bulan" },
    { id: "sd_lengkap_6", nama: "SD Lengkap 6 Bulan", harga: 1399000, desc: "Reguler SD lengkap selama 6 bulan" },
    { id: "sd_lengkap_12", nama: "SD Lengkap 12 Bulan", harga: 2799000, desc: "Reguler SD lengkap selama 1 tahun penuh" },
    { id: "sd_tka_1", nama: "SD TKA 1 Bulan", harga: 300000, desc: "Persiapan intensif kelulusan kelas 6" },
    { id: "sd_tka_3", nama: "SD TKA 3 Bulan", harga: 849000, desc: "Persiapan TKA kelas 6 selama 3 bulan" },
    { id: "sd_tka_6", nama: "SD TKA 6 Bulan", harga: 1699000, desc: "Persiapan TKA kelas 6 selama 6 bulan" },
    { id: "sd_tka_12", nama: "SD TKA 12 Bulan", harga: 3299000, desc: "Persiapan TKA kelas 6 selama 1 tahun penuh" }
  ],
  SMP: [
    { id: "smp_starter_1", nama: "SMP Starter 1 Bulan", harga: 230000, desc: "2 Mapel pilihan untuk jenjang SMP" },
    { id: "smp_starter_3", nama: "SMP Starter 3 Bulan", harga: 649000, desc: "2 Mapel SMP selama 3 bulan hemat" },
    { id: "smp_starter_6", nama: "SMP Starter 6 Bulan", harga: 1299000, desc: "2 Mapel SMP selama 6 bulan konsisten" },
    { id: "smp_starter_12", nama: "SMP Starter 12 Bulan", harga: 2559000, desc: "2 Mapel SMP selama 1 tahun ajaran" },
    { id: "smp_lengkap_1", nama: "SMP Lengkap 1 Bulan", harga: 300000, desc: "Matematika, IPA, IPS, B.Indo, B.Inggris" },
    { id: "smp_lengkap_3", nama: "SMP Lengkap 3 Bulan", harga: 849000, desc: "Reguler SMP lengkap selama 3 bulan" },
    { id: "smp_lengkap_6", nama: "SMP Lengkap 6 Bulan", harga: 1699000, desc: "Reguler SMP lengkap selama 6 bulan" },
    { id: "smp_lengkap_12", nama: "SMP Lengkap 12 Bulan", harga: 3299000, desc: "Reguler SMP lengkap selama 1 tahun penuh" },
    { id: "smp_tka_1", nama: "SMP TKA Intensif 1 Bulan", harga: 350000, desc: "Persiapan intensif kelulusan kelas 9" },
    { id: "smp_tka_3", nama: "SMP TKA Intensif 3 Bulan", harga: 999000, desc: "Persiapan TKA kelas 9 selama 3-bulan" },
    { id: "smp_tka_6", nama: "SMP TKA Intensif 6 Bulan", harga: 1950000, desc: "Persiapan TKA kelas 9 selama 6-bulan" }
  ],
  SMA: [
    { id: "sma_basic_1", nama: "SMA Basic 1 Bulan", harga: 349000, desc: "2 Mapel pilihan pendampingan SMA" },
    { id: "sma_intensif_1", nama: "SMA Intensif 1 Bulan", harga: 449000, desc: "4 Mapel pilihan pendampingan SMA" },
    { id: "sma_lengkap_1", nama: "SMA Lengkap 1 Bulan", harga: 499000, desc: "Program Lengkap SMA Jurusan IPA/IPS" }
  ]
};

const PendaftaranOnline = () => {
  // ============================================================
  // STATE
  // ============================================================
  const [form, setForm] = useState({
    namaLengkap: '',
    whatsappAktif: '',
    kelasSekolah: 'SD',
    namaOrangTua: '',
    alamatRumah: '',
    paketBimbelId: '',
    paketBimbelNama: '',
    paketBimbelHarga: 0,
    paketBimbelDesc: ''
  });

  const [selectedPaketId, setSelectedPaketId] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState('');
  const [registrationData, setRegistrationData] = useState(null);

  // ============================================================
  // GET PAKET LIST
  // ============================================================
  const getPaketList = (jenjang) => {
    return LIST_PAKET_MASTER[jenjang] || [];
  };

  // ============================================================
  // HANDLE INPUT CHANGE
  // ============================================================
  const handleChange = (e) => {
    const { name, value } = e.target;
    
    if (name === 'kelasSekolah') {
      setForm({
        ...form,
        kelasSekolah: value,
        paketBimbelId: '',
        paketBimbelNama: '',
        paketBimbelHarga: 0,
        paketBimbelDesc: ''
      });
      setSelectedPaketId('');
      return;
    }

    setForm(prev => ({ ...prev, [name]: value }));
  };

  // ============================================================
  // HANDLE PAKET SELECT
  // ============================================================
  const handlePaketSelect = (paket) => {
    setSelectedPaketId(paket.id);
    setForm({
      ...form,
      paketBimbelId: paket.id,
      paketBimbelNama: paket.nama,
      paketBimbelHarga: paket.harga,
      paketBimbelDesc: paket.desc
    });
  };

  // ============================================================
  // VALIDASI
  // ============================================================
  const validateForm = () => {
    if (!form.namaLengkap.trim()) return 'Nama lengkap wajib diisi!';
    if (!form.whatsappAktif.trim()) return 'Nomor WhatsApp wajib diisi!';
    if (!/^\d+$/.test(form.whatsappAktif.trim())) return 'Nomor WhatsApp hanya boleh angka!';
    if (form.whatsappAktif.trim().length < 10) return 'Nomor WhatsApp minimal 10 digit!';
    if (!form.namaOrangTua.trim()) return 'Nama orang tua wajib diisi!';
    if (!form.alamatRumah.trim()) return 'Alamat rumah wajib diisi!';
    if (!form.paketBimbelId) return 'Silakan pilih paket bimbel!';
    return null;
  };

  // ============================================================
  // SUBMIT KE FIRESTORE
  // ============================================================
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      setTimeout(() => setError(''), 4000);
      return;
    }

    setLoading(true);
    setError('');

    try {
      const docRef = await addDoc(collection(db, "online_registrations"), {
        namaLengkap: form.namaLengkap,
        whatsappAktif: form.whatsappAktif,
        kelasSekolah: form.kelasSekolah,
        namaOrangTua: form.namaOrangTua,
        alamatRumah: form.alamatRumah,
        paketBimbelId: form.paketBimbelId,
        paketBimbelNama: form.paketBimbelNama,
        paketBimbelHarga: form.paketBimbelHarga,
        paketBimbelDesc: form.paketBimbelDesc,
        paymentStatus: 'pending',
        createdAt: serverTimestamp()
      });

      setRegistrationData({
        id: docRef.id,
        ...form
      });

      setIsSuccess(true);
      setLoading(false);
    } catch (err) {
      console.error('Error:', err);
      setError('Gagal menyimpan data. Silakan coba lagi.');
      setLoading(false);
    }
  };

  // ============================================================
  // HANDLE PAYMENT (Dynamic URL Injection)
  // ============================================================
  const handlePayment = () => {
    if (!registrationData) return;
    
    const dynamicLink = `${MIDTRANS_BASE_LINK}?amt=${registrationData.paketBimbelHarga}&name=${encodeURIComponent(registrationData.namaLengkap)}&phone=${registrationData.whatsappAktif}`;
    window.open(dynamicLink, '_blank');
  };

  // ============================================================
  // RENDER SUCCESS
  // ============================================================
  if (isSuccess) {
    return (
      <div style={styles.container}>
        <div style={styles.glassCard}>
          <div style={styles.logoArea}>
            <img 
              src="/pwa-192x192.png" 
              alt="Logo Bimbel Gemilang" 
              style={styles.logo}
            />
          </div>

          <div style={styles.successIcon}>✅</div>
          <h1 style={styles.successTitle}>Pendaftaran Berhasil!</h1>
          <p style={styles.successMessage}>
            Pendaftaran <strong>{registrationData?.namaLengkap}</strong> telah berhasil direkam.
            Silakan selesaikan pembayaran Virtual Account Anda melalui tombol di bawah ini.
          </p>

          <div style={styles.dataSummary}>
            <div style={styles.summaryRow}>
              <span style={styles.summaryLabel}>📋 ID</span>
              <span style={styles.summaryValue}>{registrationData?.id?.slice(0, 12)}...</span>
            </div>
            <div style={styles.summaryRow}>
              <span style={styles.summaryLabel}>👤 Nama</span>
              <span style={styles.summaryValue}>{registrationData?.namaLengkap}</span>
            </div>
            <div style={styles.summaryRow}>
              <span style={styles.summaryLabel}>📞 WhatsApp</span>
              <span style={styles.summaryValue}>{registrationData?.whatsappAktif}</span>
            </div>
            <div style={styles.summaryRow}>
              <span style={styles.summaryLabel}>🏫 Kelas</span>
              <span style={styles.summaryValue}>{registrationData?.kelasSekolah}</span>
            </div>
            <div style={styles.summaryRow}>
              <span style={styles.summaryLabel}>📚 Paket</span>
              <span style={styles.summaryValue}>{registrationData?.paketBimbelNama}</span>
            </div>
            <div style={styles.summaryRow}>
              <span style={styles.summaryLabel}>💰 Harga</span>
              <span style={{...styles.summaryValue, color: '#fbbf24', fontWeight: 700}}>
                Rp {registrationData?.paketBimbelHarga?.toLocaleString('id-ID')}
              </span>
            </div>
            <div style={styles.summaryRow}>
              <span style={styles.summaryLabel}>💳 Status</span>
              <span style={{...styles.summaryValue, color: '#f59e0b', fontWeight: 700}}>Menunggu Pembayaran</span>
            </div>
          </div>

          <button 
            onClick={handlePayment}
            style={styles.paymentBtn}
          >
            💳 Buka Pembayaran Virtual Account (Midtrans)
          </button>

          <p style={styles.paymentNote}>
            ⚠️ Setelah pembayaran selesai, akun siswa akan aktif dalam 1x24 jam.
          </p>

          <button 
            onClick={() => window.location.href = '/'}
            style={styles.backBtn}
          >
            🏠 Kembali ke Beranda
          </button>
        </div>
      </div>
    );
  }

  // ============================================================
  // RENDER FORM
  // ============================================================
  const paketList = getPaketList(form.kelasSekolah);

  return (
    <div style={styles.container}>
      {/* Background Bintang & Nebula */}
      <div style={styles.background}>
        <div style={styles.star1}></div>
        <div style={styles.star2}></div>
        <div style={styles.star3}></div>
        <div style={styles.star4}></div>
        <div style={styles.star5}></div>
        <div style={styles.star6}></div>
        <div style={styles.star7}></div>
        <div style={styles.nebula1}></div>
        <div style={styles.nebula2}></div>
      </div>

      <div style={styles.glassCard}>
        <div style={styles.logoArea}>
          <img 
            src="/pwa-192x192.png" 
            alt="Logo Bimbel Gemilang" 
            style={styles.logo}
          />
          <h1 style={styles.title}>🚀 Pendaftaran Online</h1>
          <p style={styles.subtitle}>Bimbel Gemilang · Glagahagung</p>
        </div>

        {error && (
          <div style={styles.errorBox}>
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.inputGroup}>
            <label style={styles.label}>👤 Nama Lengkap Siswa *</label>
            <input
              type="text"
              name="namaLengkap"
              value={form.namaLengkap}
              onChange={handleChange}
              placeholder="Masukkan nama lengkap"
              style={styles.input}
              required
            />
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>📞 Nomor WhatsApp Aktif *</label>
            <input
              type="tel"
              name="whatsappAktif"
              value={form.whatsappAktif}
              onChange={handleChange}
              placeholder="081234567890"
              style={styles.input}
              required
            />
            <small style={styles.hint}>Hanya angka, minimal 10 digit</small>
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>🏫 Kelas / Jenjang *</label>
            <select
              name="kelasSekolah"
              value={form.kelasSekolah}
              onChange={handleChange}
              style={styles.select}
              required
            >
              <option value="SD">SD (Sekolah Dasar)</option>
              <option value="SMP">SMP (Sekolah Menengah Pertama)</option>
              <option value="SMA">SMA (Sekolah Menengah Atas)</option>
            </select>
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>👨‍👩‍👦 Nama Orang Tua / Wali *</label>
            <input
              type="text"
              name="namaOrangTua"
              value={form.namaOrangTua}
              onChange={handleChange}
              placeholder="Nama ayah/ibu/wali"
              style={styles.input}
              required
            />
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>🏠 Alamat Rumah *</label>
            <textarea
              name="alamatRumah"
              value={form.alamatRumah}
              onChange={handleChange}
              placeholder="Desa/Kecamatan/Kabupaten"
              style={styles.textarea}
              required
              rows={3}
            />
          </div>

          {/* ============================================================ */}
          {/* PRICE FACECARD - KARTU PAKET INTERAKTIF */}
          {/* ============================================================ */}
          <div style={styles.paketSection}>
            <label style={styles.label}>📚 Pilih Paket Bimbel *</label>
            <p style={styles.paketHint}>Klik kartu untuk memilih paket</p>
            
            <div style={styles.paketGrid}>
              {paketList.map((paket) => {
                const isSelected = selectedPaketId === paket.id;
                return (
                  <div
                    key={paket.id}
                    onClick={() => handlePaketSelect(paket)}
                    style={{
                      ...styles.paketCard,
                      border: isSelected 
                        ? '2px solid #8b5cf6' 
                        : '1px solid rgba(255,255,255,0.08)',
                      boxShadow: isSelected 
                        ? '0 0 30px rgba(139,92,246,0.3), inset 0 0 30px rgba(139,92,246,0.05)' 
                        : 'none',
                      background: isSelected 
                        ? 'rgba(139,92,246,0.08)' 
                        : 'rgba(255,255,255,0.03)',
                      transform: isSelected ? 'scale(1.02)' : 'scale(1)'
                    }}
                  >
                    <div style={styles.paketName}>{paket.nama}</div>
                    <div style={styles.paketDesc}>{paket.desc}</div>
                    <div style={styles.paketPrice}>
                      Rp {paket.harga.toLocaleString('id-ID')}
                    </div>
                    {isSelected && (
                      <div style={styles.paketSelectedBadge}>✅ Dipilih</div>
                    )}
                  </div>
                );
              })}
            </div>
            {selectedPaketId && (
              <small style={{...styles.hint, color: '#8b5cf6', fontWeight: 600}}>
                ✅ Paket terpilih: {form.paketBimbelNama} (Rp {form.paketBimbelHarga.toLocaleString('id-ID')})
              </small>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              ...styles.submitBtn,
              opacity: loading ? 0.7 : 1,
              cursor: loading ? 'not-allowed' : 'pointer'
            }}
          >
            {loading ? '⏳ Memproses...' : '🚀 Daftar Sekarang'}
          </button>
        </form>

        <div style={styles.footer}>
          <small>Dengan mendaftar, Anda menyetujui syarat & ketentuan Bimbel Gemilang.</small>
        </div>
      </div>

      <style>{`
        @keyframes twinkle {
          0%, 100% { opacity: 0.2; transform: scale(1); }
          50% { opacity: 0.8; transform: scale(1.2); }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 0.7; }
        }
        .glass-card {
          animation: fadeUp 0.8s ease both;
        }
        ::-webkit-scrollbar {
          width: 4px;
        }
        ::-webkit-scrollbar-track {
          background: rgba(255,255,255,0.02);
        }
        ::-webkit-scrollbar-thumb {
          background: rgba(139,92,246,0.3);
          border-radius: 10px;
        }
      `}</style>
    </div>
  );
};

// ============================================================
// STYLES - MODERN SPACE GALAXY
// ============================================================
const styles = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '20px',
    background: 'linear-gradient(135deg, #05070f 0%, #0d1b2a 40%, #1a0a2e 80%, #02040a 100%)',
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
    boxSizing: 'border-box',
    position: 'relative',
    overflow: 'hidden'
  },

  // Background Galaxy
  background: {
    position: 'fixed',
    inset: 0,
    pointerEvents: 'none',
    zIndex: 0,
    overflow: 'hidden'
  },
  star1: {
    position: 'absolute',
    width: '2px',
    height: '2px',
    background: 'white',
    top: '10%',
    left: '15%',
    borderRadius: '50%',
    animation: 'twinkle 3s ease-in-out infinite'
  },
  star2: {
    position: 'absolute',
    width: '3px',
    height: '3px',
    background: 'white',
    top: '25%',
    right: '20%',
    borderRadius: '50%',
    animation: 'twinkle 4s ease-in-out infinite 0.5s'
  },
  star3: {
    position: 'absolute',
    width: '2px',
    height: '2px',
    background: 'white',
    bottom: '30%',
    left: '10%',
    borderRadius: '50%',
    animation: 'twinkle 2.5s ease-in-out infinite 1s'
  },
  star4: {
    position: 'absolute',
    width: '4px',
    height: '4px',
    background: 'white',
    top: '50%',
    right: '8%',
    borderRadius: '50%',
    animation: 'twinkle 3.5s ease-in-out infinite 0.3s'
  },
  star5: {
    position: 'absolute',
    width: '2px',
    height: '2px',
    background: 'white',
    bottom: '15%',
    right: '30%',
    borderRadius: '50%',
    animation: 'twinkle 2.8s ease-in-out infinite 0.8s'
  },
  star6: {
    position: 'absolute',
    width: '3px',
    height: '3px',
    background: 'white',
    top: '70%',
    left: '5%',
    borderRadius: '50%',
    animation: 'twinkle 3.2s ease-in-out infinite 1.2s'
  },
  star7: {
    position: 'absolute',
    width: '2px',
    height: '2px',
    background: 'white',
    top: '40%',
    left: '45%',
    borderRadius: '50%',
    animation: 'twinkle 2.2s ease-in-out infinite 0.6s'
  },
  nebula1: {
    position: 'absolute',
    width: '400px',
    height: '400px',
    borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(139,92,246,0.06), transparent 70%)',
    top: '-10%',
    right: '-10%',
    animation: 'pulse 8s ease-in-out infinite'
  },
  nebula2: {
    position: 'absolute',
    width: '500px',
    height: '500px',
    borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(243,156,18,0.04), transparent 70%)',
    bottom: '-20%',
    left: '-15%',
    animation: 'pulse 10s ease-in-out infinite reverse'
  },

  // Glass Card
  glassCard: {
    position: 'relative',
    zIndex: 1,
    width: '100%',
    maxWidth: '560px',
    padding: '32px 28px 24px',
    borderRadius: '24px',
    background: 'rgba(255, 255, 255, 0.04)',
    backdropFilter: 'blur(24px)',
    WebkitBackdropFilter: 'blur(24px)',
    border: '1px solid rgba(255, 255, 255, 0.06)',
    boxShadow: '0 30px 80px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.04)',
    boxSizing: 'border-box',
    maxHeight: '96vh',
    overflowY: 'auto'
  },

  logoArea: {
    textAlign: 'center',
    marginBottom: '16px'
  },
  logo: {
    width: '64px',
    height: '64px',
    borderRadius: '50%',
    boxShadow: '0 0 40px rgba(139,92,246,0.15)',
    border: '2px solid rgba(139,92,246,0.2)',
    objectFit: 'cover'
  },
  title: {
    fontSize: '24px',
    fontWeight: 800,
    color: '#ffffff',
    margin: '12px 0 4px',
    letterSpacing: '-0.5px',
    textShadow: '0 0 30px rgba(139,92,246,0.1)'
  },
  subtitle: {
    fontSize: '13px',
    color: 'rgba(255,255,255,0.3)',
    margin: 0
  },

  errorBox: {
    padding: '12px 16px',
    borderRadius: '10px',
    background: 'rgba(239,68,68,0.1)',
    border: '1px solid rgba(239,68,68,0.2)',
    color: '#f87171',
    fontSize: '13px',
    fontWeight: 600,
    marginBottom: '16px'
  },

  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '14px'
  },
  inputGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px'
  },
  label: {
    fontSize: '12px',
    fontWeight: 600,
    color: 'rgba(255,255,255,0.6)',
    letterSpacing: '0.3px',
    textTransform: 'uppercase'
  },
  input: {
    padding: '12px 14px',
    borderRadius: '10px',
    border: '1px solid rgba(255,255,255,0.06)',
    fontSize: '14px',
    outline: 'none',
    transition: 'all 0.3s ease',
    background: 'rgba(255,255,255,0.03)',
    color: '#ffffff',
    ':focus': {
      borderColor: 'rgba(139,92,246,0.4)',
      boxShadow: '0 0 20px rgba(139,92,246,0.05)',
      background: 'rgba(255,255,255,0.05)'
    },
    '::placeholder': {
      color: 'rgba(255,255,255,0.2)'
    }
  },
  select: {
    padding: '12px 14px',
    borderRadius: '10px',
    border: '1px solid rgba(255,255,255,0.06)',
    fontSize: '14px',
    outline: 'none',
    background: 'rgba(255,255,255,0.03)',
    color: '#ffffff',
    cursor: 'pointer',
    ':focus': {
      borderColor: 'rgba(139,92,246,0.4)',
      boxShadow: '0 0 20px rgba(139,92,246,0.05)'
    }
  },
  textarea: {
    padding: '12px 14px',
    borderRadius: '10px',
    border: '1px solid rgba(255,255,255,0.06)',
    fontSize: '14px',
    outline: 'none',
    resize: 'vertical',
    minHeight: '70px',
    fontFamily: 'inherit',
    background: 'rgba(255,255,255,0.03)',
    color: '#ffffff',
    ':focus': {
      borderColor: 'rgba(139,92,246,0.4)',
      boxShadow: '0 0 20px rgba(139,92,246,0.05)'
    },
    '::placeholder': {
      color: 'rgba(255,255,255,0.2)'
    }
  },
  hint: {
    fontSize: '10px',
    color: 'rgba(255,255,255,0.25)',
    marginTop: '2px'
  },

  // Price Facecard Section
  paketSection: {
    marginTop: '4px'
  },
  paketHint: {
    fontSize: '11px',
    color: 'rgba(255,255,255,0.25)',
    margin: '0 0 10px 0'
  },
  paketGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '10px',
    maxHeight: '320px',
    overflowY: 'auto',
    paddingRight: '4px'
  },
  paketCard: {
    padding: '14px 12px',
    borderRadius: '12px',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    border: '1px solid rgba(255,255,255,0.06)',
    background: 'rgba(255,255,255,0.02)',
    ':hover': {
      transform: 'translateY(-2px)',
      borderColor: 'rgba(139,92,246,0.2)',
      background: 'rgba(255,255,255,0.05)'
    }
  },
  paketName: {
    fontSize: '12px',
    fontWeight: 700,
    color: '#ffffff',
    marginBottom: '4px'
  },
  paketDesc: {
    fontSize: '10px',
    color: 'rgba(255,255,255,0.4)',
    lineHeight: 1.4,
    marginBottom: '6px',
    minHeight: '28px'
  },
  paketPrice: {
    fontSize: '14px',
    fontWeight: 800,
    color: '#fbbf24',
    textShadow: '0 0 20px rgba(251,191,36,0.1)'
  },
  paketSelectedBadge: {
    fontSize: '9px',
    fontWeight: 700,
    color: '#8b5cf6',
    marginTop: '4px',
    display: 'inline-block',
    padding: '2px 8px',
    borderRadius: '4px',
    background: 'rgba(139,92,246,0.15)'
  },

  submitBtn: {
    padding: '14px',
    borderRadius: '12px',
    border: 'none',
    background: 'linear-gradient(135deg, #8b5cf6, #6d28d9)',
    color: 'white',
    fontWeight: 700,
    fontSize: '15px',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    boxShadow: '0 8px 30px rgba(139,92,246,0.2)',
    marginTop: '4px',
    ':hover': {
      transform: 'translateY(-2px)',
      boxShadow: '0 12px 40px rgba(139,92,246,0.3)'
    }
  },

  footer: {
    textAlign: 'center',
    marginTop: '18px',
    color: 'rgba(255,255,255,0.12)',
    fontSize: '10px'
  },

  // SUCCESS STYLES
  successIcon: {
    fontSize: '48px',
    textAlign: 'center',
    marginBottom: '8px'
  },
  successTitle: {
    fontSize: '22px',
    fontWeight: 800,
    color: '#ffffff',
    textAlign: 'center',
    margin: '0 0 8px'
  },
  successMessage: {
    fontSize: '14px',
    color: 'rgba(255,255,255,0.6)',
    textAlign: 'center',
    lineHeight: 1.6,
    margin: '0 0 20px'
  },
  dataSummary: {
    background: 'rgba(255,255,255,0.03)',
    borderRadius: '12px',
    padding: '16px',
    marginBottom: '20px',
    border: '1px solid rgba(255,255,255,0.04)'
  },
  summaryRow: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '6px 0',
    borderBottom: '1px solid rgba(255,255,255,0.04)',
    fontSize: '13px',
    ':last-child': {
      borderBottom: 'none'
    }
  },
  summaryLabel: {
    color: 'rgba(255,255,255,0.3)',
    fontWeight: 500
  },
  summaryValue: {
    color: 'rgba(255,255,255,0.8)',
    fontWeight: 600,
    textAlign: 'right'
  },
  paymentBtn: {
    display: 'block',
    width: '100%',
    padding: '16px',
    borderRadius: '12px',
    background: 'linear-gradient(135deg, #f59e0b, #d97706)',
    color: 'white',
    fontWeight: 700,
    fontSize: '15px',
    textAlign: 'center',
    textDecoration: 'none',
    border: 'none',
    cursor: 'pointer',
    boxShadow: '0 8px 30px rgba(245,158,11,0.25)',
    transition: 'all 0.3s ease',
    ':hover': {
      transform: 'translateY(-2px)',
      boxShadow: '0 12px 40px rgba(245,158,11,0.35)'
    }
  },
  paymentNote: {
    fontSize: '11px',
    color: 'rgba(255,255,255,0.2)',
    textAlign: 'center',
    margin: '12px 0 0'
  },
  backBtn: {
    display: 'block',
    width: '100%',
    padding: '12px',
    borderRadius: '10px',
    border: '1px solid rgba(255,255,255,0.06)',
    background: 'rgba(255,255,255,0.02)',
    color: 'rgba(255,255,255,0.3)',
    fontWeight: 600,
    fontSize: '13px',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    marginTop: '12px',
    ':hover': {
      background: 'rgba(255,255,255,0.04)'
    }
  }
};

export default PendaftaranOnline;