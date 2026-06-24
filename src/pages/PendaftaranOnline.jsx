// src/pages/PendaftaranOnline.jsx
import React, { useState } from 'react';
import { db } from '../firebase';
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import LogoGemilang from '../components/LogoGemilang';

// ============================================================
// VARIABLE MIDTRANS PAYMENT LINK (GANTI NANTI)
// ============================================================
const MIDTRANS_PAYMENT_LINK = "https://midtrans.com";

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
    paketBimbel: 'Paket Reguler - Rp 150.000'
  });

  const [loading, setLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState('');
  const [registrationData, setRegistrationData] = useState(null);

  // ============================================================
  // HANDLE INPUT CHANGE
  // ============================================================
  const handleChange = (e) => {
    const { name, value } = e.target;
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
        ...form,
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
              <span style={styles.summaryLabel}>📚 Paket</span>
              <span style={styles.summaryValue}>{registrationData?.paketBimbel}</span>
            </div>
            <div style={styles.summaryRow}>
              <span style={styles.summaryLabel}>💰 Status</span>
              <span style={{...styles.summaryValue, color: '#f59e0b', fontWeight: 700}}>Menunggu Pembayaran</span>
            </div>
          </div>

          <a 
            href={MIDTRANS_PAYMENT_LINK} 
            target="_blank" 
            rel="noopener noreferrer"
            style={styles.paymentBtn}
          >
            💳 Buka Pembayaran Virtual Account (Midtrans)
          </a>

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
            <label style={styles.label}>📚 Paket Bimbel *</label>
            <select
              name="paketBimbel"
              value={form.paketBimbel}
              onChange={handleChange}
              style={styles.select}
              required
            >
              <option value="Paket Reguler - Rp 150.000">Paket Reguler - Rp 150.000</option>
              <option value="Paket Intensif - Rp 300.000">Paket Intensif - Rp 300.000</option>
            </select>
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