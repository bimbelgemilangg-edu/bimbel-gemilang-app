// src/pages/PendaftaranOnline.jsx
import React, { useState } from 'react';
import { db } from '../firebase';
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

// ============================================================
// DATA MASTER PAKET BIMBEL BERDASARKAN JENJANG
// ============================================================
const LIST_PAKET_MASTER = {
  SD: [
    { id: "sd_fokus_1", nama: "SD Fokus 1 Bulan", harga: 95000, link: "https://midtrans.com" },
    { id: "sd_fokus_3", nama: "SD Fokus 3 Bulan", harga: 275000, link: "https://midtrans.com" },
    { id: "sd_fokus_6", nama: "SD Fokus 6 Bulan", harga: 540000, link: "https://midtrans.com" },
    { id: "sd_fokus_12", nama: "SD Fokus 12 Bulan", harga: 1050000, link: "https://midtrans.com2" },
    { id: "sd_duo_1", nama: "SD Duo 1 Bulan", harga: 175000, link: "https://midtrans.com" },
    { id: "sd_duo_3", nama: "SD Duo 3 Bulan", harga: 499000, link: "https://midtrans.com" },
    { id: "sd_duo_6", nama: "SD Duo 6 Bulan", harga: 975000, link: "https://midtrans.com" },
    { id: "sd_duo_12", nama: "SD Duo 12 Bulan", harga: 1900000, link: "https://midtrans.com2" },
    { id: "sd_lengkap_1", nama: "SD Lengkap 1 Bulan", harga: 250000, link: "https://midtrans.com" },
    { id: "sd_lengkap_3", nama: "SD Lengkap 3 Bulan", harga: 699000, link: "https://midtrans.com" },
    { id: "sd_lengkap_6", nama: "SD Lengkap 6 Bulan", harga: 1399000, link: "https://midtrans.com" },
    { id: "sd_lengkap_12", nama: "SD Lengkap 12 Bulan", harga: 2799000, link: "https://midtrans.com2" },
    { id: "sd_tka_1", nama: "SD TKA 1 Bulan", harga: 300000, link: "https://midtrans.com" },
    { id: "sd_tka_3", nama: "SD TKA 3 Bulan", harga: 849000, link: "https://midtrans.com" },
    { id: "sd_tka_6", nama: "SD TKA 6 Bulan", harga: 1699000, link: "https://midtrans.com" },
    { id: "sd_tka_12", nama: "SD TKA 12 Bulan", harga: 3299000, link: "https://midtrans.com2" }
  ],
  SMP: [
    { id: "smp_starter_1", nama: "SMP Starter 1 Bulan", harga: 230000, link: "https://midtrans.com" },
    { id: "smp_starter_3", nama: "SMP Starter 3 Bulan", harga: 649000, link: "https://midtrans.com" },
    { id: "smp_starter_6", nama: "SMP Starter 6 Bulan", harga: 1299000, link: "https://midtrans.com" },
    { id: "smp_starter_12", nama: "SMP Starter 12 Bulan", harga: 2559000, link: "https://midtrans.com2" },
    { id: "smp_lengkap_1", nama: "SMP Lengkap 1 Bulan", harga: 300000, link: "https://midtrans.com" },
    { id: "smp_lengkap_3", nama: "SMP Lengkap 3 Bulan", harga: 849000, link: "https://midtrans.com" },
    { id: "smp_lengkap_6", nama: "SMP Lengkap 6 Bulan", harga: 1699000, link: "https://midtrans.com" },
    { id: "smp_lengkap_12", nama: "SMP Lengkap 12 Bulan", harga: 3299000, link: "https://midtrans.com2" },
    { id: "smp_tka_1", nama: "SMP TKA Intensif 1 Bulan", harga: 350000, link: "https://midtrans.com" },
    { id: "smp_tka_3", nama: "SMP TKA Intensif 3 Bulan", harga: 999000, link: "https://midtrans.com" },
    { id: "smp_tka_6", nama: "SMP TKA Intensif 6 Bulan", harga: 1950000, link: "https://midtrans.com" }
  ],
  SMA: [
    { id: "sma_basic_1", nama: "SMA Basic 1 Bulan", harga: 349000, link: "https://midtrans.com" },
    { id: "sma_intensif_1", nama: "SMA Intensif 1 Bulan", harga: 449000, link: "https://midtrans.com" },
    { id: "sma_lengkap_1", nama: "SMA Lengkap 1 Bulan", harga: 499000, link: "https://midtrans.com" }
  ]
};

const PendaftaranOnline = () => {
  // ============================================================
  // STATE FORM
  // ============================================================
  const [form, setForm] = useState({
    namaLengkap: '',
    whatsappAktif: '',
    kelasSekolah: 'SD',
    namaOrangTua: '',
    alamatRumah: '',
    paketBimbelId: '', // ID paket yang dipilih
    paketBimbelNama: '',
    paketBimbelHarga: 0,
    paketBimbelLink: ''
  });

  const [loading, setLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState('');
  const [registrationData, setRegistrationData] = useState(null);

  // ============================================================
  // GET PAKET LIST BERDASARKAN JENJANG
  // ============================================================
  const getPaketList = (jenjang) => {
    return LIST_PAKET_MASTER[jenjang] || [];
  };

  // ============================================================
  // HANDLE INPUT CHANGE
  // ============================================================
  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Jika yang berubah adalah kelasSekolah, reset paket yang dipilih
    if (name === 'kelasSekolah') {
      setForm({
        ...form,
        kelasSekolah: value,
        paketBimbelId: '',
        paketBimbelNama: '',
        paketBimbelHarga: 0,
        paketBimbelLink: ''
      });
      return;
    }

    // Jika yang berubah adalah paketBimbelId (select paket)
    if (name === 'paketBimbelId') {
      const paketList = getPaketList(form.kelasSekolah);
      const selectedPaket = paketList.find(p => p.id === value);
      if (selectedPaket) {
        setForm({
          ...form,
          paketBimbelId: selectedPaket.id,
          paketBimbelNama: selectedPaket.nama,
          paketBimbelHarga: selectedPaket.harga,
          paketBimbelLink: selectedPaket.link
        });
      }
      return;
    }

    // Input biasa
    setForm(prev => ({ ...prev, [name]: value }));
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
        paketBimbelLink: form.paketBimbelLink,
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
  // HANDLE PAYMENT
  // ============================================================
  const handlePayment = () => {
    if (registrationData?.paketBimbelLink) {
      window.open(registrationData.paketBimbelLink, '_blank');
    } else {
      alert('Link pembayaran tidak tersedia. Hubungi admin.');
    }
  };

  // ============================================================
  // RENDER SUCCESS PAGE
  // ============================================================
  if (isSuccess) {
    return (
      <div style={styles.container}>
        <div style={styles.glassCard}>
          {/* Logo */}
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
              <span style={styles.summaryLabel}>📋 ID Pendaftaran</span>
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
              <span style={{...styles.summaryValue, color: '#1a237e', fontWeight: 700}}>
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
            Hubungi Admin jika ada kendala.
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
      <div style={styles.glassCard}>
        {/* Logo */}
        <div style={styles.logoArea}>
          <img 
            src="/pwa-192x192.png" 
            alt="Logo Bimbel Gemilang" 
            style={styles.logo}
          />
          <h1 style={styles.title}>Pendaftaran Online</h1>
          <p style={styles.subtitle}>Bimbel Gemilang · Glagahagung</p>
        </div>

        {/* Error */}
        {error && (
          <div style={styles.errorBox}>
            ⚠️ {error}
          </div>
        )}

        {/* Form */}
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

          <div style={styles.inputGroup}>
            <label style={styles.label}>📚 Pilih Paket Bimbel *</label>
            <select
              name="paketBimbelId"
              value={form.paketBimbelId}
              onChange={handleChange}
              style={styles.select}
              required
            >
              <option value="">-- Pilih Paket untuk {form.kelasSekolah} --</option>
              {paketList.map((paket) => (
                <option key={paket.id} value={paket.id}>
                  {paket.nama} - Rp {paket.harga.toLocaleString('id-ID')}
                </option>
              ))}
            </select>
            {form.paketBimbelId && (
              <small style={{...styles.hint, color: '#1a237e', fontWeight: 600}}>
                ✅ Paket: {form.paketBimbelNama} (Rp {form.paketBimbelHarga.toLocaleString('id-ID')})
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
    </div>
  );
};

// ============================================================
// STYLES
// ============================================================
const styles = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '20px',
    background: 'linear-gradient(135deg, #f0f4f8 0%, #d4e4f7 40%, #e8f0fe 100%)',
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
    boxSizing: 'border-box'
  },
  glassCard: {
    width: '100%',
    maxWidth: '520px',
    padding: '32px 28px 24px',
    borderRadius: '24px',
    background: 'rgba(255, 255, 255, 0.85)',
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    border: '1px solid rgba(255, 255, 255, 0.3)',
    boxShadow: '0 20px 60px rgba(0, 0, 0, 0.08)',
    boxSizing: 'border-box'
  },
  logoArea: {
    textAlign: 'center',
    marginBottom: '20px'
  },
  logo: {
    width: '64px',
    height: '64px',
    borderRadius: '50%',
    boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
    border: '2px solid rgba(26,35,126,0.1)'
  },
  title: {
    fontSize: '24px',
    fontWeight: 800,
    color: '#1a1a2e',
    margin: '12px 0 4px',
    letterSpacing: '-0.5px'
  },
  subtitle: {
    fontSize: '13px',
    color: '#64748b',
    margin: 0
  },
  errorBox: {
    padding: '12px 16px',
    borderRadius: '10px',
    background: '#fee2e2',
    color: '#dc2626',
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
    color: '#334155',
    letterSpacing: '0.3px'
  },
  input: {
    padding: '12px 14px',
    borderRadius: '10px',
    border: '1px solid #e2e8f0',
    fontSize: '14px',
    outline: 'none',
    transition: 'all 0.2s ease',
    background: 'white',
    color: '#1a1a2e',
    ':focus': {
      borderColor: '#1a237e',
      boxShadow: '0 0 0 3px rgba(26,35,126,0.08)'
    }
  },
  select: {
    padding: '12px 14px',
    borderRadius: '10px',
    border: '1px solid #e2e8f0',
    fontSize: '14px',
    outline: 'none',
    background: 'white',
    color: '#1a1a2e',
    cursor: 'pointer',
    ':focus': {
      borderColor: '#1a237e',
      boxShadow: '0 0 0 3px rgba(26,35,126,0.08)'
    }
  },
  textarea: {
    padding: '12px 14px',
    borderRadius: '10px',
    border: '1px solid #e2e8f0',
    fontSize: '14px',
    outline: 'none',
    resize: 'vertical',
    minHeight: '70px',
    fontFamily: 'inherit',
    background: 'white',
    color: '#1a1a2e',
    ':focus': {
      borderColor: '#1a237e',
      boxShadow: '0 0 0 3px rgba(26,35,126,0.08)'
    }
  },
  hint: {
    fontSize: '10px',
    color: '#94a3b8',
    marginTop: '2px'
  },
  submitBtn: {
    padding: '14px',
    borderRadius: '12px',
    border: 'none',
    background: 'linear-gradient(135deg, #1a237e, #283593)',
    color: 'white',
    fontWeight: 700,
    fontSize: '15px',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    boxShadow: '0 8px 30px rgba(26,35,126,0.2)',
    marginTop: '4px',
    ':hover': {
      transform: 'translateY(-2px)',
      boxShadow: '0 12px 40px rgba(26,35,126,0.3)'
    }
  },
  footer: {
    textAlign: 'center',
    marginTop: '18px',
    color: '#94a3b8',
    fontSize: '11px'
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
    color: '#1a1a2e',
    textAlign: 'center',
    margin: '0 0 8px'
  },
  successMessage: {
    fontSize: '14px',
    color: '#475569',
    textAlign: 'center',
    lineHeight: 1.6,
    margin: '0 0 20px'
  },
  dataSummary: {
    background: '#f8fafc',
    borderRadius: '12px',
    padding: '16px',
    marginBottom: '20px',
    border: '1px solid #e2e8f0'
  },
  summaryRow: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '6px 0',
    borderBottom: '1px solid #f1f5f9',
    fontSize: '13px',
    ':last-child': {
      borderBottom: 'none'
    }
  },
  summaryLabel: {
    color: '#94a3b8',
    fontWeight: 500
  },
  summaryValue: {
    color: '#1a1a2e',
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
    color: '#94a3b8',
    textAlign: 'center',
    margin: '12px 0 0'
  },
  backBtn: {
    display: 'block',
    width: '100%',
    padding: '12px',
    borderRadius: '10px',
    border: '1px solid #e2e8f0',
    background: 'white',
    color: '#64748b',
    fontWeight: 600,
    fontSize: '13px',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    marginTop: '12px',
    ':hover': {
      background: '#f8fafc'
    }
  }
};

export default PendaftaranOnline;