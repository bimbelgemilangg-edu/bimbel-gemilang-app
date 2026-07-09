// src/pages/PendaftaranOnline.jsx
import React, { useState, useEffect, useRef } from 'react';
import { db } from '../firebase';
import { collection, addDoc, doc, getDoc, serverTimestamp } from "firebase/firestore";

// ============================================================
// MAIN COMPONENT
// ============================================================
const PendaftaranOnline = () => {
  // ===== REFS =====
  const canvasRef = useRef(null);
  const isDrawing = useRef(false);
  const lastPos = useRef({ x: 0, y: 0 });

  // ===== STATES =====
  const [step, setStep] = useState(1);
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

  // ===== TATA TERTIB =====
  const [tataTertib, setTataTertib] = useState('');
  const [tataTertibChecked, setTataTertibChecked] = useState(false);
  const [loadingTataTertib, setLoadingTataTertib] = useState(true);

  // ===== TANDA TANGAN =====
  const [signatureData, setSignatureData] = useState(null);
  const [canvasCleared, setCanvasCleared] = useState(false);

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
        }
      } catch (err) {
        console.error("Error fetching paket:", err);
      }
      setLoadingPaket(false);
    };
    fetchPaket();
  }, []);

  // ============================================================
  // FETCH TATA TERTIB DARI FIRESTORE
  // ============================================================
  useEffect(() => {
    const fetchTataTertib = async () => {
      setLoadingTataTertib(true);
      try {
        const docRef = doc(db, "settings", "tata_tertib");
        const docSnap = await getDoc(docRef);
        if (docSnap.exists() && docSnap.data().konten) {
          setTataTertib(docSnap.data().konten);
        } else {
          // Default tata tertib
          setTataTertib(`PERATURAN DAN TATA TERTIB BIMBEL GEMILANG

1. KEHADIRAN
   • Siswa wajib hadir tepat waktu sesuai jadwal yang telah ditentukan.
   • Keterlambatan maksimal 15 menit tanpa pemberitahuan akan dianggap alpa.
   • Jika tidak hadir, orang tua WAJIB menginformasikan kepada admin/pengajar.

2. PAKAIAN & SIKAP
   • Berpakaian sopan dan rapi (bebas, tapi tidak boleh memakai sandal).
   • Menjaga sikap hormat kepada pengajar dan sesama siswa.
   • Tidak berkata kasar, membully, atau mengganggu teman.

3. PEMBAYARAN
   • Pembayaran dilakukan di awal bulan/minggu sesuai paket.
   • Keterlambatan pembayaran lebih dari 7 hari dikenakan denda Rp 5.000/hari.

4. FASILITAS
   • Menjaga kebersihan ruang belajar dan fasilitas bimbel.
   • Tidak mencorat-coret meja, dinding, atau fasilitas lainnya.

5. SANKSI
   • Pelanggaran ringan: teguran lisan.
   • Pelanggaran berat: pemanggilan orang tua dan/atau dikeluarkan dari bimbel.

Dengan menandatangani formulir ini, Saya (Orang Tua/Wali) menyatakan SETUJU dan siap MEMATUHI seluruh peraturan yang telah ditetapkan oleh Bimbel Gemilang.`);
        }
      } catch (err) {
        console.error("Error fetching tata tertib:", err);
        setTataTertib('⚠️ Gagal memuat tata tertib. Silakan refresh halaman.');
      }
      setLoadingTataTertib(false);
    };
    fetchTataTertib();
  }, []);

  // ============================================================
  // CANVAS SIGNATURE
  // ============================================================
  useEffect(() => {
    if (step === 4 && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      const rect = canvas.getBoundingClientRect();
      
      // Set canvas internal size
      canvas.width = rect.width * 2;
      canvas.height = rect.height * 2;
      ctx.scale(2, 2);
      ctx.lineWidth = 2;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.strokeStyle = '#1e293b';
    }
  }, [step]);

  const getCanvasPos = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return {
      x: clientX - rect.left,
      y: clientY - rect.top
    };
  };

  const startDrawing = (e) => {
    e.preventDefault();
    isDrawing.current = true;
    const pos = getCanvasPos(e);
    lastPos.current = pos;
    setCanvasCleared(false);
  };

  const draw = (e) => {
    e.preventDefault();
    if (!isDrawing.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const pos = getCanvasPos(e);

    ctx.beginPath();
    ctx.moveTo(lastPos.current.x, lastPos.current.y);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();

    lastPos.current = pos;
  };

  const stopDrawing = () => {
    if (!isDrawing.current) return;
    isDrawing.current = false;
    
    // Simpan tanda tangan sebagai base64
    const canvas = canvasRef.current;
    const dataUrl = canvas.toDataURL('image/png');
    setSignatureData(dataUrl);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setSignatureData(null);
    setCanvasCleared(true);
  };

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
  const validateStep1 = () => {
    if (!form.namaLengkap.trim()) return 'Nama lengkap wajib diisi!';
    if (!form.whatsappAktif.trim()) return 'Nomor WhatsApp wajib diisi!';
    if (!/^\d+$/.test(form.whatsappAktif.trim())) return 'Nomor WhatsApp hanya boleh angka!';
    if (form.whatsappAktif.trim().length < 10) return 'Nomor WhatsApp minimal 10 digit!';
    if (!form.namaOrangTua.trim()) return 'Nama orang tua wajib diisi!';
    if (!form.alamatRumah.trim()) return 'Alamat rumah wajib diisi!';
    return null;
  };

  const validateStep2 = () => {
    if (!form.paketBimbelId) return 'Silakan pilih paket bimbel!';
    return null;
  };

  const validateStep3 = () => {
    if (!tataTertibChecked) return 'Anda harus menyetujui peraturan & tata tertib!';
    return null;
  };

  const validateStep4 = () => {
    if (!signatureData) return 'Silakan tanda tangan di kotak yang disediakan!';
    return null;
  };

  const goNext = (currentStep) => {
    let err = null;
    if (currentStep === 1) err = validateStep1();
    if (currentStep === 2) err = validateStep2();
    if (currentStep === 3) err = validateStep3();
    if (currentStep === 4) err = validateStep4();

    if (err) {
      setError(err);
      setTimeout(() => setError(''), 4000);
      return;
    }
    setError('');
    setStep(currentStep + 1);
  };

  // ============================================================
  // SUBMIT KE FIRESTORE
  // ============================================================
  const handleSubmit = async () => {
    // Validasi final
    const err1 = validateStep1();
    const err2 = validateStep2();
    const err3 = validateStep3();
    const err4 = validateStep4();

    if (err1 || err2 || err3 || err4) {
      setError(err1 || err2 || err3 || err4);
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
        tataTertibDisetujui: true,
        tandaTangan: signatureData,
        paymentStatus: 'pending',
        createdAt: serverTimestamp()
      });

      setRegistrationData({
        id: docRef.id,
        ...form
      });

      setIsSuccess(true);
      setError('');
    } catch (err) {
      console.error('Error:', err);
      setError('Gagal menyimpan data. Silakan coba lagi.');
    }
    setLoading(false);
  };

  // ============================================================
  // RENDER
  // ============================================================
  const totalSteps = 4;
  const stepLabels = ['Biodata', 'Paket', 'Tata Tertib', 'TTD'];

  const paketList = getPaketList(form.kelasSekolah);

  return (
    <div style={styles.container}>
      {/* Background */}
      <div style={styles.background}>
        <div style={styles.star1}></div>
        <div style={styles.star2}></div>
        <div style={styles.star3}></div>
        <div style={styles.star4}></div>
        <div style={styles.star5}></div>
        <div style={styles.nebula1}></div>
        <div style={styles.nebula2}></div>
      </div>

      <div style={styles.glassCard}>
        {/* Logo */}
        <div style={styles.logoArea}>
          <img src="/pwa-192x192.png" alt="Logo" style={styles.logo} />
          <h1 style={styles.title}>🚀 Pendaftaran Online</h1>
          <p style={styles.subtitle}>Bimbel Gemilang · Glagahagung</p>
        </div>

        {/* Error */}
        {error && (
          <div style={styles.errorBox}>⚠️ {error}</div>
        )}

        {/* SUCCESS */}
        {isSuccess ? (
          <div style={styles.successBox}>
            <div style={styles.successIcon}>✅</div>
            <h2 style={styles.successTitle}>Pendaftaran Berhasil!</h2>
            <p style={styles.successText}>
              Terima kasih <strong>{form.namaLengkap}</strong> telah mendaftar di Bimbel Gemilang.
            </p>
            <div style={styles.successInfo}>
              <p>📋 ID Pendaftaran: <strong>{registrationData?.id?.slice(-8)}</strong></p>
              <p>📞 Admin akan menghubungi WhatsApp Anda dalam 1x24 jam.</p>
              <p>🏫 Silakan datang ke Bimbel Gemilang untuk pembayaran dan jadwal.</p>
            </div>
            <button onClick={() => window.location.reload()} style={styles.btnNewReg}>
              📝 Daftar Lagi
            </button>
          </div>
        ) : (
          <>
            {/* STEP INDICATOR */}
            <div style={styles.stepRow}>
              {stepLabels.map((label, idx) => (
                <div key={idx} style={styles.stepItem}>
                  <div style={{
                    ...styles.stepDot,
                    background: step > idx + 1 ? '#10b981' : step === idx + 1 ? '#8b5cf6' : 'rgba(255,255,255,0.1)',
                    color: step > idx + 1 ? 'white' : step === idx + 1 ? 'white' : 'rgba(255,255,255,0.4)',
                    border: step === idx + 1 ? '2px solid #8b5cf6' : '2px solid transparent'
                  }}>
                    {step > idx + 1 ? '✓' : idx + 1}
                  </div>
                  <span style={{
                    ...styles.stepLabel,
                    color: step === idx + 1 ? '#fff' : 'rgba(255,255,255,0.3)',
                    fontWeight: step === idx + 1 ? 700 : 400
                  }}>{label}</span>
                </div>
              ))}
            </div>

            {/* STEP 1: BIODATA */}
            {step === 1 && (
              <div style={styles.formArea}>
                <h3 style={styles.sectionTitle}>📋 Data Diri Siswa</h3>
                <div style={styles.inputGroup}>
                  <label style={styles.label}>Nama Lengkap *</label>
                  <input type="text" name="namaLengkap" value={form.namaLengkap} onChange={handleChange} placeholder="Masukkan nama lengkap" style={styles.input} required />
                </div>
                <div style={styles.inputGroup}>
                  <label style={styles.label}>Nomor WhatsApp *</label>
                  <input type="tel" name="whatsappAktif" value={form.whatsappAktif} onChange={handleChange} placeholder="081234567890" style={styles.input} required />
                  <small style={styles.hint}>Hanya angka, minimal 10 digit</small>
                </div>
                <div style={styles.inputGroup}>
                  <label style={styles.label}>Kelas / Jenjang *</label>
                  <select name="kelasSekolah" value={form.kelasSekolah} onChange={handleChange} style={styles.select} required>
                    <option value="SD">SD (Sekolah Dasar)</option>
                    <option value="SMP">SMP (Sekolah Menengah Pertama)</option>
                    <option value="SMA">SMA (Sekolah Menengah Atas)</option>
                  </select>
                </div>
                <div style={styles.inputGroup}>
                  <label style={styles.label}>Nama Orang Tua / Wali *</label>
                  <input type="text" name="namaOrangTua" value={form.namaOrangTua} onChange={handleChange} placeholder="Nama ayah/ibu/wali" style={styles.input} required />
                </div>
                <div style={styles.inputGroup}>
                  <label style={styles.label}>Alamat Rumah *</label>
                  <textarea name="alamatRumah" value={form.alamatRumah} onChange={handleChange} placeholder="Desa/Kecamatan/Kabupaten" style={styles.textarea} required rows={3} />
                </div>
                <button onClick={() => goNext(1)} style={styles.btnNext}>Selanjutnya →</button>
              </div>
            )}

            {/* STEP 2: PILIH PAKET */}
            {step === 2 && (
              <div style={styles.formArea}>
                <h3 style={styles.sectionTitle}>📚 Pilih Paket Bimbel</h3>
                {loadingPaket ? (
                  <div style={{ textAlign: 'center', padding: 20, color: 'rgba(255,255,255,0.3)' }}>⏳ Memuat paket...</div>
                ) : paketList.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: 20, color: 'rgba(255,255,255,0.3)' }}>⚠️ Belum ada paket untuk jenjang ini</div>
                ) : (
                  <div style={styles.paketGrid}>
                    {paketList.map((paket) => {
                      const isSelected = selectedPaketId === paket.id;
                      return (
                        <div key={paket.id} onClick={() => handlePaketSelect(paket)} style={{
                          ...styles.paketCard,
                          border: isSelected ? '2px solid #8b5cf6' : '1px solid rgba(255,255,255,0.08)',
                          boxShadow: isSelected ? '0 0 30px rgba(139,92,246,0.3)' : 'none',
                          background: isSelected ? 'rgba(139,92,246,0.08)' : 'rgba(255,255,255,0.03)',
                          transform: isSelected ? 'scale(1.02)' : 'scale(1)'
                        }}>
                          <div style={styles.paketName}>{paket.nama}</div>
                          <div style={styles.paketDesc}>{paket.desc || 'Paket bimbel'}</div>
                          <div style={styles.paketPrice}>Rp {paket.harga.toLocaleString('id-ID')}</div>
                          {isSelected && <div style={styles.paketSelectedBadge}>✅ Dipilih</div>}
                        </div>
                      );
                    })}
                  </div>
                )}
                {selectedPaketId && (
                  <small style={{...styles.hint, color: '#8b5cf6', fontWeight: 600, display: 'block', marginTop: 8 }}>
                    ✅ Paket terpilih: {form.paketBimbelNama} (Rp {form.paketBimbelHarga.toLocaleString('id-ID')})
                  </small>
                )}
                <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
                  <button onClick={() => setStep(1)} style={styles.btnPrev}>← Sebelumnya</button>
                  <button onClick={() => goNext(2)} style={styles.btnNext}>Selanjutnya →</button>
                </div>
              </div>
            )}

            {/* STEP 3: TATA TERTIB */}
            {step === 3 && (
              <div style={styles.formArea}>
                <h3 style={styles.sectionTitle}>📜 Peraturan & Tata Tertib</h3>
                {loadingTataTertib ? (
                  <div style={{ textAlign: 'center', padding: 20, color: 'rgba(255,255,255,0.3)' }}>⏳ Memuat tata tertib...</div>
                ) : (
                  <>
                    <div style={styles.tataTertibBox}>
                      <pre style={styles.tataTertibText}>{tataTertib}</pre>
                    </div>
                    <label style={styles.checkboxLabel}>
                      <input 
                        type="checkbox" 
                        checked={tataTertibChecked} 
                        onChange={(e) => setTataTertibChecked(e.target.checked)}
                        style={styles.checkbox}
                      />
                      <span style={{ color: 'rgba(255,255,255,0.8)', fontSize: 13 }}>
                        Saya telah membaca, memahami, dan <strong>MENYETUJUI</strong> seluruh peraturan & tata tertib Bimbel Gemilang
                      </span>
                    </label>
                  </>
                )}
                <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
                  <button onClick={() => setStep(2)} style={styles.btnPrev}>← Sebelumnya</button>
                  <button onClick={() => goNext(3)} style={styles.btnNext}>Selanjutnya →</button>
                </div>
              </div>
            )}

            {/* STEP 4: TANDA TANGAN */}
            {step === 4 && (
              <div style={styles.formArea}>
                <h3 style={styles.sectionTitle}>✍️ Tanda Tangan Digital</h3>
                <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, textAlign: 'center', marginBottom: 12 }}>
                  Silakan tanda tangan di kotak di bawah ini menggunakan jari atau stylus pen
                </p>
                <div style={styles.canvasWrapper}>
                  <canvas
                    ref={canvasRef}
                    style={styles.canvas}
                    onMouseDown={startDrawing}
                    onMouseMove={draw}
                    onMouseUp={stopDrawing}
                    onMouseLeave={stopDrawing}
                    onTouchStart={startDrawing}
                    onTouchMove={draw}
                    onTouchEnd={stopDrawing}
                  />
                  {!signatureData && !canvasCleared && (
                    <div style={styles.canvasHint}>✍️ Tanda tangan di sini</div>
                  )}
                </div>
                <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginTop: 10 }}>
                  <button onClick={clearCanvas} style={styles.btnClearCanvas}>🔄 Hapus TTD</button>
                </div>
                {signatureData && (
                  <div style={{ textAlign: 'center', marginTop: 8 }}>
                    <small style={{ color: '#10b981', fontWeight: 600 }}>✅ Tanda tangan tersimpan</small>
                  </div>
                )}
                <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
                  <button onClick={() => setStep(3)} style={styles.btnPrev}>← Sebelumnya</button>
                  <button onClick={handleSubmit} disabled={loading} style={{
                    ...styles.btnSubmit,
                    opacity: loading ? 0.7 : 1,
                    cursor: loading ? 'not-allowed' : 'pointer'
                  }}>
                    {loading ? '⏳ Mengirim...' : '🚀 Daftar Sekarang'}
                  </button>
                </div>
              </div>
            )}
          </>
        )}
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
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: rgba(255,255,255,0.02); }
        ::-webkit-scrollbar-thumb { background: rgba(139,92,246,0.3); border-radius: 10px; }
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
  background: { position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0, overflow: 'hidden' },
  star1: { position: 'absolute', width: '2px', height: '2px', background: 'white', top: '10%', left: '15%', borderRadius: '50%', animation: 'twinkle 3s ease-in-out infinite' },
  star2: { position: 'absolute', width: '3px', height: '3px', background: 'white', top: '25%', right: '20%', borderRadius: '50%', animation: 'twinkle 4s ease-in-out infinite 0.5s' },
  star3: { position: 'absolute', width: '2px', height: '2px', background: 'white', bottom: '30%', left: '10%', borderRadius: '50%', animation: 'twinkle 2.5s ease-in-out infinite 1s' },
  star4: { position: 'absolute', width: '4px', height: '4px', background: 'white', top: '50%', right: '8%', borderRadius: '50%', animation: 'twinkle 3.5s ease-in-out infinite 0.3s' },
  star5: { position: 'absolute', width: '2px', height: '2px', background: 'white', bottom: '15%', right: '30%', borderRadius: '50%', animation: 'twinkle 2.8s ease-in-out infinite 0.8s' },
  nebula1: { position: 'absolute', width: '400px', height: '400px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(139,92,246,0.06), transparent 70%)', top: '-10%', right: '-10%', animation: 'pulse 8s ease-in-out infinite' },
  nebula2: { position: 'absolute', width: '500px', height: '500px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(243,156,18,0.04), transparent 70%)', bottom: '-20%', left: '-15%', animation: 'pulse 10s ease-in-out infinite reverse' },

  glassCard: {
    position: 'relative', zIndex: 1, width: '100%', maxWidth: '560px',
    padding: '32px 28px 24px', borderRadius: '24px',
    background: 'rgba(255, 255, 255, 0.04)', backdropFilter: 'blur(24px)',
    WebkitBackdropFilter: 'blur(24px)', border: '1px solid rgba(255, 255, 255, 0.06)',
    boxShadow: '0 30px 80px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.04)',
    boxSizing: 'border-box', maxHeight: '96vh', overflowY: 'auto'
  },

  logoArea: { textAlign: 'center', marginBottom: '16px' },
  logo: { width: '64px', height: '64px', borderRadius: '50%', boxShadow: '0 0 40px rgba(139,92,246,0.15)', border: '2px solid rgba(139,92,246,0.2)', objectFit: 'cover' },
  title: { fontSize: '24px', fontWeight: 800, color: '#ffffff', margin: '12px 0 4px', letterSpacing: '-0.5px' },
  subtitle: { fontSize: '13px', color: 'rgba(255,255,255,0.3)', margin: 0 },

  errorBox: { padding: '12px 16px', borderRadius: '10px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#f87171', fontSize: '13px', fontWeight: 600, marginBottom: '16px' },

  // Step Indicator
  stepRow: { display: 'flex', justifyContent: 'center', gap: '20px', marginBottom: '20px', flexWrap: 'wrap' },
  stepItem: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' },
  stepDot: { width: '28px', height: '28px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 700, transition: 'all 0.3s ease' },
  stepLabel: { fontSize: '10px', transition: 'all 0.3s ease' },

  // Form
  formArea: { display: 'flex', flexDirection: 'column', gap: '12px' },
  sectionTitle: { fontSize: '16px', fontWeight: 700, color: '#ffffff', margin: '0 0 4px', textAlign: 'center' },
  inputGroup: { display: 'flex', flexDirection: 'column', gap: '4px' },
  label: { fontSize: '12px', fontWeight: 600, color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase' },
  input: { padding: '12px 14px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.06)', fontSize: '14px', outline: 'none', background: 'rgba(255,255,255,0.03)', color: '#ffffff' },
  select: { padding: '12px 14px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.06)', fontSize: '14px', outline: 'none', background: 'rgba(255,255,255,0.03)', color: '#ffffff', cursor: 'pointer' },
  textarea: { padding: '12px 14px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.06)', fontSize: '14px', outline: 'none', resize: 'vertical', minHeight: '70px', fontFamily: 'inherit', background: 'rgba(255,255,255,0.03)', color: '#ffffff' },
  hint: { fontSize: '10px', color: 'rgba(255,255,255,0.25)', marginTop: '2px' },

  // Paket
  paketGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', maxHeight: '280px', overflowY: 'auto', paddingRight: '4px' },
  paketCard: { padding: '14px 12px', borderRadius: '12px', cursor: 'pointer', transition: 'all 0.3s ease', border: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.02)' },
  paketName: { fontSize: '12px', fontWeight: 700, color: '#ffffff', marginBottom: '4px' },
  paketDesc: { fontSize: '10px', color: 'rgba(255,255,255,0.4)', lineHeight: 1.4, marginBottom: '6px', minHeight: '28px' },
  paketPrice: { fontSize: '14px', fontWeight: 800, color: '#fbbf24' },
  paketSelectedBadge: { fontSize: '9px', fontWeight: 700, color: '#8b5cf6', marginTop: '4px', display: 'inline-block', padding: '2px 8px', borderRadius: '4px', background: 'rgba(139,92,246,0.15)' },

  // Tata Tertib
  tataTertibBox: { maxHeight: '300px', overflowY: 'auto', padding: '14px', borderRadius: '10px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', marginBottom: '12px' },
  tataTertibText: { whiteSpace: 'pre-wrap', fontSize: '11px', color: 'rgba(255,255,255,0.7)', lineHeight: 1.7, fontFamily: 'inherit', margin: 0 },
  checkboxLabel: { display: 'flex', alignItems: 'flex-start', gap: '10px', cursor: 'pointer', padding: '10px', borderRadius: '8px', background: 'rgba(139,92,246,0.05)', border: '1px solid rgba(139,92,246,0.1)' },
  checkbox: { width: '18px', height: '18px', marginTop: '2px', cursor: 'pointer', accentColor: '#8b5cf6' },

  // Canvas TTD
  canvasWrapper: { position: 'relative', width: '100%', height: '180px', borderRadius: '10px', border: '2px dashed rgba(255,255,255,0.15)', overflow: 'hidden', background: 'rgba(255,255,255,0.03)', touchAction: 'none' },
  canvas: { width: '100%', height: '100%', cursor: 'crosshair', display: 'block' },
  canvasHint: { position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', color: 'rgba(255,255,255,0.2)', fontSize: '18px', pointerEvents: 'none', fontWeight: 600 },
  btnClearCanvas: { padding: '8px 16px', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.5)', border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer', fontSize: '12px', fontWeight: 600 },

  // Buttons
  btnPrev: { flex: 1, padding: '12px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.03)', color: 'rgba(255,255,255,0.6)', fontWeight: 600, fontSize: '13px', cursor: 'pointer' },
  btnNext: { flex: 1, padding: '12px', borderRadius: '10px', border: 'none', background: 'rgba(139,92,246,0.2)', color: 'white', fontWeight: 600, fontSize: '13px', cursor: 'pointer' },
  btnSubmit: { flex: 2, padding: '14px', borderRadius: '12px', border: 'none', background: 'linear-gradient(135deg, #8b5cf6, #6d28d9)', color: 'white', fontWeight: 700, fontSize: '15px', cursor: 'pointer', boxShadow: '0 8px 30px rgba(139,92,246,0.2)' },

  // Success
  successBox: { textAlign: 'center', padding: '20px 0' },
  successIcon: { fontSize: '48px', marginBottom: '12px' },
  successTitle: { fontSize: '20px', fontWeight: 800, color: '#ffffff', margin: '0 0 8px' },
  successText: { fontSize: '14px', color: 'rgba(255,255,255,0.7)', margin: '0 0 16px' },
  successInfo: { background: 'rgba(139,92,246,0.1)', padding: '14px', borderRadius: '10px', textAlign: 'left', fontSize: '12px', color: 'rgba(255,255,255,0.6)', marginBottom: '16px', lineHeight: 1.8 },
  btnNewReg: { padding: '12px 24px', borderRadius: '10px', background: 'rgba(255,255,255,0.05)', color: 'white', border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer', fontWeight: 600, fontSize: '13px' }
};

export default PendaftaranOnline;