// src/pages/PendaftaranOnline.jsx
import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, addDoc, doc, getDoc, serverTimestamp } from "firebase/firestore";

// ============================================================
// MIDTRANS CONFIG
// ============================================================
// 🔥 GANTI DENGAN LINK MIDTRANS ANDA
const MIDTRANS_BASE_LINK = "https://app.sandbox.midtrans.com/payment-links/67c22c45-6baa-421b-a7b2-a12289639be9-UJZJAOFg";

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

  const [paketMaster, setPaketMaster] = useState({ SD: [], SMP: [], SMA: [] });
  const [loadingPaket, setLoadingPaket] = useState(true);
  const [selectedPaketId, setSelectedPaketId] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState('');
  const [registrationData, setRegistrationData] = useState(null);
  const [paymentLink, setPaymentLink] = useState('');

  // ============================================================
  // FETCH PAKET DARI FIRESTORE
  // ============================================================
  useEffect(() => {
    const fetchPaket = async () => {
      setLoadingPaket(true);
      try {
        const docRef = doc(db, "settings", "paket_bimbel");
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          setPaketMaster(docSnap.data());
        } else {
          setPaketMaster({ SD: [], SMP: [], SMA: [] });
          setError('⚠️ Data paket belum tersedia. Hubungi admin.');
        }
      } catch (err) {
        console.error("Error fetching paket:", err);
        setError('⚠️ Gagal memuat data paket.');
      }
      setLoadingPaket(false);
    };
    fetchPaket();
  }, []);

  // ============================================================
  // GET PAKET LIST BERDASARKAN JENJANG
  // ============================================================
  const getPaketList = (jenjang) => {
    return paketMaster[jenjang] || [];
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
      paketBimbelDesc: paket.desc || ''
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
  // SUBMIT KE FIRESTORE + CREATE PAYMENT
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
      // 1. SIMPAN KE FIRESTORE
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

      const orderId = docRef.id;

      setRegistrationData({
        id: orderId,
        ...form
      });

      // 2. BUAT PAYMENT KE MIDTRANS
      try {
        const paymentResponse = await fetch('/api/create-payment', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            orderId: orderId,
            grossAmount: form.paketBimbelHarga,
            customerName: form.namaLengkap,
            customerPhone: form.whatsappAktif
          })
        });

        const paymentData = await paymentResponse.json();

        if (paymentData.success && paymentData.redirect_url) {
          setPaymentLink(paymentData.redirect_url);
        } else {
          console.error('Payment creation failed:', paymentData);
          const fallbackLink = `${MIDTRANS_BASE_LINK}?amt=${form.paketBimbelHarga}&name=${encodeURIComponent(form.namaLengkap)}&phone=${form.whatsappAktif}`;
          setPaymentLink(fallbackLink);
        }
      } catch (paymentErr) {
        console.error('Payment API error:', paymentErr);
        const fallbackLink = `${MIDTRANS_BASE_LINK}?amt=${form.paketBimbelHarga}&name=${encodeURIComponent(form.namaLengkap)}&phone=${form.whatsappAktif}`;
        setPaymentLink(fallbackLink);
      }

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
    if (paymentLink) {
      window.open(paymentLink, '_blank');
    } else if (registrationData?.paketBimbelLink) {
      window.open(registrationData.paketBimbelLink, '_blank');
    } else {
      const fallback = `${MIDTRANS_BASE_LINK}?amt=${registrationData?.paketBimbelHarga || 0}&name=${encodeURIComponent(registrationData?.namaLengkap || '')}&phone=${registrationData?.whatsappAktif || ''}`;
      window.open(fallback, '_blank');
    }
  };

  // ============================================================
  // RENDER SUCCESS (TANPA TOMBOL BACK TO HOME)
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

          {/* 🔥 TOMBOL BACK TO HOME DIHAPUS */}
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
      {/* Background Galaxy */}
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

        {loadingPaket && (
          <div style={{ textAlign: 'center', padding: 10, color: 'rgba(255,255,255,0.3)', fontSize: 12 }}>
            ⏳ Memuat data paket...
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

          {/* PRICE FACECARD */}
          <div style={styles.paketSection}>
            <label style={styles.label}>📚 Pilih Paket Bimbel *</label>
            <p style={styles.paketHint}>Klik kartu untuk memilih paket</p>
            
            {paketList.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 20, color: 'rgba(255,255,255,0.3)', fontSize: 13 }}>
                {loadingPaket ? '⏳ Memuat paket...' : '⚠️ Belum ada paket untuk jenjang ini'}
              </div>
            ) : (
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
                      <div style={styles.paketDesc}>{paket.desc || 'Paket bimbel'}</div>
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
            )}
            {selectedPaketId && (
              <small style={{...styles.hint, color: '#8b5cf6', fontWeight: 600, display: 'block', marginTop: 8}}>
                ✅ Paket terpilih: {form.paketBimbelNama} (Rp {form.paketBimbelHarga.toLocaleString('id-ID')})
              </small>
            )}
          </div>

          <button
            type="submit"
            disabled={loading || loadingPaket}
            style={{
              ...styles.submitBtn,
              opacity: (loading || loadingPaket) ? 0.7 : 1,
              cursor: (loading || loadingPaket) ? 'not-allowed' : 'pointer'
            }}
          >
            {loading ? '⏳ Memproses...' : loadingPaket ? '⏳ Memuat...' : '🚀 Daftar Sekarang'}
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
        @keyframes pulse {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 0.7; }
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
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
// STYLES
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

  background: {
    position: 'fixed',
    inset: 0,
    pointerEvents: 'none',
    zIndex: 0,
    overflow: 'hidden'
  },
  star1: { position: 'absolute', width: '2px', height: '2px', background: 'white', top: '10%', left: '15%', borderRadius: '50%', animation: 'twinkle 3s ease-in-out infinite' },
  star2: { position: 'absolute', width: '3px', height: '3px', background: 'white', top: '25%', right: '20%', borderRadius: '50%', animation: 'twinkle 4s ease-in-out infinite 0.5s' },
  star3: { position: 'absolute', width: '2px', height: '2px', background: 'white', bottom: '30%', left: '10%', borderRadius: '50%', animation: 'twinkle 2.5s ease-in-out infinite 1s' },
  star4: { position: 'absolute', width: '4px', height: '4px', background: 'white', top: '50%', right: '8%', borderRadius: '50%', animation: 'twinkle 3.5s ease-in-out infinite 0.3s' },
  star5: { position: 'absolute', width: '2px', height: '2px', background: 'white', bottom: '15%', right: '30%', borderRadius: '50%', animation: 'twinkle 2.8s ease-in-out infinite 0.8s' },
  star6: { position: 'absolute', width: '3px', height: '3px', background: 'white', top: '70%', left: '5%', borderRadius: '50%', animation: 'twinkle 3.2s ease-in-out infinite 1.2s' },
  star7: { position: 'absolute', width: '2px', height: '2px', background: 'white', top: '40%', left: '45%', borderRadius: '50%', animation: 'twinkle 2.2s ease-in-out infinite 0.6s' },
  nebula1: { position: 'absolute', width: '400px', height: '400px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(139,92,246,0.06), transparent 70%)', top: '-10%', right: '-10%', animation: 'pulse 8s ease-in-out infinite' },
  nebula2: { position: 'absolute', width: '500px', height: '500px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(243,156,18,0.04), transparent 70%)', bottom: '-20%', left: '-15%', animation: 'pulse 10s ease-in-out infinite reverse' },

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

  logoArea: { textAlign: 'center', marginBottom: '16px' },
  logo: {
    width: '64px',
    height: '64px',
    borderRadius: '50%',
    boxShadow: '0 0 40px rgba(139,92,246,0.15)',
    border: '2px solid rgba(139,92,246,0.2)',
    objectFit: 'cover'
  },
  title: { fontSize: '24px', fontWeight: 800, color: '#ffffff', margin: '12px 0 4px', letterSpacing: '-0.5px', textShadow: '0 0 30px rgba(139,92,246,0.1)' },
  subtitle: { fontSize: '13px', color: 'rgba(255,255,255,0.3)', margin: 0 },

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

  form: { display: 'flex', flexDirection: 'column', gap: '14px' },
  inputGroup: { display: 'flex', flexDirection: 'column', gap: '4px' },
  label: { fontSize: '12px', fontWeight: 600, color: 'rgba(255,255,255,0.6)', letterSpacing: '0.3px', textTransform: 'uppercase' },
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
    '::placeholder': { color: 'rgba(255,255,255,0.2)' }
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
    '::placeholder': { color: 'rgba(255,255,255,0.2)' }
  },
  hint: { fontSize: '10px', color: 'rgba(255,255,255,0.25)', marginTop: '2px' },

  paketSection: { marginTop: '4px' },
  paketHint: { fontSize: '11px', color: 'rgba(255,255,255,0.25)', margin: '0 0 10px 0' },
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
  paketName: { fontSize: '12px', fontWeight: 700, color: '#ffffff', marginBottom: '4px' },
  paketDesc: { fontSize: '10px', color: 'rgba(255,255,255,0.4)', lineHeight: 1.4, marginBottom: '6px', minHeight: '28px' },
  paketPrice: { fontSize: '14px', fontWeight: 800, color: '#fbbf24', textShadow: '0 0 20px rgba(251,191,36,0.1)' },
  paketSelectedBadge: { fontSize: '9px', fontWeight: 700, color: '#8b5cf6', marginTop: '4px', display: 'inline-block', padding: '2px 8px', borderRadius: '4px', background: 'rgba(139,92,246,0.15)' },

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

  footer: { textAlign: 'center', marginTop: '18px', color: 'rgba(255,255,255,0.12)', fontSize: '10px' },

  successIcon: { fontSize: '48px', textAlign: 'center', marginBottom: '8px' },
  successTitle: { fontSize: '22px', fontWeight: 800, color: '#ffffff', textAlign: 'center', margin: '0 0 8px' },
  successMessage: { fontSize: '14px', color: 'rgba(255,255,255,0.6)', textAlign: 'center', lineHeight: 1.6, margin: '0 0 20px' },
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
    ':last-child': { borderBottom: 'none' }
  },
  summaryLabel: { color: 'rgba(255,255,255,0.3)', fontWeight: 500 },
  summaryValue: { color: 'rgba(255,255,255,0.8)', fontWeight: 600, textAlign: 'right' },
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
  paymentNote: { fontSize: '11px', color: 'rgba(255,255,255,0.2)', textAlign: 'center', margin: '12px 0 0' }
};

export default PendaftaranOnline;