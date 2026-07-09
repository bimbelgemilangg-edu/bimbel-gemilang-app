// src/pages/PendaftaranOnline.jsx
import React, { useState, useEffect, useRef } from 'react';
import { db } from '../firebase';
import { collection, addDoc, doc, getDoc, serverTimestamp } from "firebase/firestore";

const PendaftaranOnline = () => {
  const canvasRef = useRef(null);
  const isDrawing = useRef(false);
  const lastPos = useRef({ x: 0, y: 0 });

  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    namaLengkap: '',
    gender: 'Laki-laki',
    whatsappAktif: '',
    asalSekolah: '',
    kelasSekolah: '1 SD',
    namaAyah: '',
    pekerjaanAyah: '',
    namaIbu: '',
    pekerjaanIbu: '',
    alamatRumah: ''
  });

  const [tataTertib, setTataTertib] = useState('');
  const [tataTertibChecked, setTataTertibChecked] = useState(false);
  const [loadingTT, setLoadingTT] = useState(true);
  const [signatureData, setSignatureData] = useState(null);
  const [canvasCleared, setCanvasCleared] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState('');

  // ===== FETCH TATA TERTIB =====
  useEffect(() => {
    getDoc(doc(db, "settings", "tata_tertib")).then(snap => {
      if (snap.exists() && snap.data().konten) setTataTertib(snap.data().konten);
      else setTataTertib(`PERATURAN DAN TATA TERTIB BIMBEL GEMILANG

1. KEHADIRAN
   • Siswa wajib hadir tepat waktu sesuai jadwal.
   • Jika tidak hadir, orang tua WAJIB menginformasikan kepada admin/pengajar.

2. PAKAIAN & SIKAP
   • Berpakaian sopan dan rapi.
   • Menjaga sikap hormat kepada pengajar dan sesama siswa.
   • Tidak berkata kasar, membully, atau mengganggu teman.

3. PEMBAYARAN
   • Pembayaran dilakukan di awal bulan/minggu sesuai paket yang dipilih.
   • Keterlambatan pembayaran lebih dari 7 hari dikenakan denda.

4. FASILITAS
   • Menjaga kebersihan ruang belajar dan fasilitas bimbel.
   • Tidak mencorat-coret meja, dinding, atau fasilitas lainnya.

5. SANKSI
   • Pelanggaran ringan: teguran lisan.
   • Pelanggaran berat: pemanggilan orang tua dan/atau dikeluarkan dari bimbel.

Dengan menandatangani formulir ini, Saya (Orang Tua/Wali) menyatakan SETUJU dan siap MEMATUHI seluruh peraturan yang telah ditetapkan oleh Bimbel Gemilang.`);
      setLoadingTT(false);
    }).catch(() => setLoadingTT(false));
  }, []);

  // ===== SETUP CANVAS =====
  useEffect(() => {
    if (step === 3 && canvasRef.current) {
      const canvas = canvasRef.current;
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * 2;
      canvas.height = rect.height * 2;
      const ctx = canvas.getContext('2d');
      ctx.scale(2, 2);
      ctx.lineWidth = 2.5;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.strokeStyle = '#1e293b';
    }
  }, [step]);

  // ===== CANVAS HANDLERS =====
  const getCanvasPos = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return { x: clientX - rect.left, y: clientY - rect.top };
  };

  const startDrawing = (e) => {
    e.preventDefault();
    isDrawing.current = true;
    lastPos.current = getCanvasPos(e);
    setCanvasCleared(false);
  };

  const draw = (e) => {
    e.preventDefault();
    if (!isDrawing.current) return;
    const ctx = canvasRef.current.getContext('2d');
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
    setSignatureData(canvasRef.current.toDataURL('image/png'));
  };

  const clearCanvas = () => {
    const ctx = canvasRef.current.getContext('2d');
    ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    setSignatureData(null);
    setCanvasCleared(true);
  };

  // ===== FORM HANDLERS =====
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(p => ({ ...p, [name]: value }));
  };

  // ===== VALIDASI =====
  const validate = (s) => {
    if (s === 1) {
      if (!form.namaLengkap.trim()) return 'Nama lengkap wajib diisi!';
      if (!form.whatsappAktif.trim() || !/^\d+$/.test(form.whatsappAktif) || form.whatsappAktif.length < 10) return 'Nomor WhatsApp wajib (angka, min 10 digit)!';
      if (!form.asalSekolah.trim()) return 'Asal sekolah wajib diisi!';
      if (!form.namaAyah.trim()) return 'Nama ayah wajib diisi!';
      if (!form.namaIbu.trim()) return 'Nama ibu wajib diisi!';
      if (!form.alamatRumah.trim()) return 'Alamat rumah wajib diisi!';
    }
    if (s === 2) {
      if (!tataTertibChecked) return 'Anda harus menyetujui peraturan & tata tertib!';
    }
    if (s === 3) {
      if (!signatureData) return 'Silakan tanda tangan di kotak yang disediakan!';
    }
    return null;
  };

  const goNext = (s) => {
    const err = validate(s);
    if (err) { setError(err); setTimeout(() => setError(''), 4000); return; }
    setError('');
    setStep(s + 1);
  };

  // ===== SUBMIT =====
  const handleSubmit = async () => {
    const err = validate(1) || validate(2) || validate(3);
    if (err) { setError(err); setTimeout(() => setError(''), 4000); return; }
    setLoading(true);
    setError('');
    try {
      await addDoc(collection(db, "online_registrations"), {
        ...form,
        tataTertibDisetujui: true,
        tandaTangan: signatureData,
        paymentStatus: 'pending',
        totalPaid: 0,
        createdAt: serverTimestamp()
      });
      setIsSuccess(true);
    } catch (e) { setError('Gagal menyimpan: ' + e.message); }
    setLoading(false);
  };

  // ===== RENDER =====
  const steps = ['📋 Biodata', '📜 Tata Tertib', '✍️ Tanda Tangan'];

  return (
    <div style={styles.wrapper}>
      <div style={styles.card}>
        
        {/* HEADER */}
        <div style={styles.header}>
          <img src="/pwa-192x192.png" alt="Logo" style={styles.logo} />
          <div>
            <h1 style={styles.title}>Pendaftaran Siswa Baru</h1>
            <p style={styles.subtitle}>Bimbel Gemilang · Glagahagung</p>
          </div>
        </div>

        {/* ERROR */}
        {error && <div style={styles.errorBox}>⚠️ {error}</div>}

        {/* SUKSES */}
        {isSuccess ? (
          <div style={styles.successBox}>
            <div style={{ fontSize: 56, marginBottom: 12 }}>✅</div>
            <h2 style={{ margin: '0 0 8px', color: '#1e293b', fontSize: 20 }}>Pendaftaran Berhasil!</h2>
            <p style={{ color: '#64748b', fontSize: 14, margin: '0 0 16px' }}>
              Terima kasih <strong>{form.namaLengkap}</strong> telah mendaftar.
            </p>
            <div style={styles.successInfo}>
              <p>📞 Admin akan menghubungi WhatsApp <strong>{form.whatsappAktif}</strong></p>
              <p>💳 Link pembayaran akan dikirim oleh admin setelah verifikasi data.</p>
              <p>🏫 Silakan datang ke Bimbel Gemilang untuk informasi lebih lanjut.</p>
            </div>
            <button onClick={() => window.location.reload()} style={styles.btnNew}>📝 Daftar Baru</button>
          </div>
        ) : (
          <>
            {/* STEP INDICATOR */}
            <div style={styles.stepRow}>
              {steps.map((label, idx) => (
                <div key={idx} style={styles.stepItem}>
                  <div style={{
                    ...styles.stepDot,
                    background: step > idx + 1 ? '#10b981' : step === idx + 1 ? '#652D90' : '#e2e8f0',
                    color: step > idx + 1 || step === idx + 1 ? 'white' : '#94a3b8'
                  }}>
                    {step > idx + 1 ? '✓' : idx + 1}
                  </div>
                  <span style={{
                    ...styles.stepLabel,
                    color: step === idx + 1 ? '#652D90' : '#94a3b8',
                    fontWeight: step === idx + 1 ? 700 : 400
                  }}>{label}</span>
                </div>
              ))}
            </div>

            {/* ============================================================ */}
            {/* STEP 1: BIODATA */}
            {/* ============================================================ */}
            {step === 1 && (
              <div style={styles.formArea}>
                <h3 style={styles.sectionTitle}>📋 Data Diri Siswa</h3>

                <div style={styles.inputGroup}>
                  <label style={styles.label}>Nama Lengkap <span style={{ color: '#ef4444' }}>*</span></label>
                  <input type="text" name="namaLengkap" value={form.namaLengkap} onChange={handleChange} style={styles.input} placeholder="Masukkan nama lengkap siswa" />
                </div>

                <div style={styles.inputGroup}>
                  <label style={styles.label}>Jenis Kelamin <span style={{ color: '#ef4444' }}>*</span></label>
                  <select name="gender" value={form.gender} onChange={handleChange} style={styles.select}>
                    <option value="Laki-laki">👦 Laki-laki</option>
                    <option value="Perempuan">👧 Perempuan</option>
                  </select>
                </div>

                <div style={styles.inputGroup}>
                  <label style={styles.label}>Nomor WhatsApp <span style={{ color: '#ef4444' }}>*</span></label>
                  <input type="tel" name="whatsappAktif" value={form.whatsappAktif} onChange={handleChange} style={styles.input} placeholder="081234567890" />
                  <small style={styles.hint}>Hanya angka, minimal 10 digit</small>
                </div>

                <div style={styles.row}>
                  <div style={styles.inputGroup}>
                    <label style={styles.label}>Asal Sekolah <span style={{ color: '#ef4444' }}>*</span></label>
                    <input type="text" name="asalSekolah" value={form.asalSekolah} onChange={handleChange} style={styles.input} placeholder="SD/SMP/SMA ..." />
                  </div>
                  <div style={styles.inputGroup}>
                    <label style={styles.label}>Kelas <span style={{ color: '#ef4444' }}>*</span></label>
                    <select name="kelasSekolah" value={form.kelasSekolah} onChange={handleChange} style={styles.select}>
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

                <h3 style={{ ...styles.sectionTitle, marginTop: 8 }}>👨‍👩‍👦 Data Orang Tua</h3>

                <div style={styles.row}>
                  <div style={styles.inputGroup}>
                    <label style={styles.label}>Nama Ayah <span style={{ color: '#ef4444' }}>*</span></label>
                    <input type="text" name="namaAyah" value={form.namaAyah} onChange={handleChange} style={styles.input} placeholder="Nama lengkap ayah" />
                  </div>
                  <div style={styles.inputGroup}>
                    <label style={styles.label}>Pekerjaan Ayah</label>
                    <input type="text" name="pekerjaanAyah" value={form.pekerjaanAyah} onChange={handleChange} style={styles.input} placeholder="Pekerjaan ayah" />
                  </div>
                </div>

                <div style={styles.row}>
                  <div style={styles.inputGroup}>
                    <label style={styles.label}>Nama Ibu <span style={{ color: '#ef4444' }}>*</span></label>
                    <input type="text" name="namaIbu" value={form.namaIbu} onChange={handleChange} style={styles.input} placeholder="Nama lengkap ibu" />
                  </div>
                  <div style={styles.inputGroup}>
                    <label style={styles.label}>Pekerjaan Ibu</label>
                    <input type="text" name="pekerjaanIbu" value={form.pekerjaanIbu} onChange={handleChange} style={styles.input} placeholder="Pekerjaan ibu" />
                  </div>
                </div>

                <div style={styles.inputGroup}>
                  <label style={styles.label}>Alamat Lengkap <span style={{ color: '#ef4444' }}>*</span></label>
                  <textarea name="alamatRumah" value={form.alamatRumah} onChange={handleChange} style={styles.textarea} placeholder="Desa, Kecamatan, Kabupaten" rows={3} />
                </div>

                <button onClick={() => goNext(1)} style={styles.btnNext}>
                  Selanjutnya: Tata Tertib →
                </button>
              </div>
            )}

            {/* ============================================================ */}
            {/* STEP 2: TATA TERTIB */}
            {/* ============================================================ */}
            {step === 2 && (
              <div style={styles.formArea}>
                <h3 style={styles.sectionTitle}>📜 Peraturan & Tata Tertib Bimbel Gemilang</h3>
                {loadingTT ? (
                  <p style={{ textAlign: 'center', color: '#94a3b8' }}>⏳ Memuat tata tertib...</p>
                ) : (
                  <>
                    <div style={styles.ttBox}>
                      <pre style={styles.ttText}>{tataTertib}</pre>
                    </div>
                    <label style={styles.cbLabel}>
                      <input type="checkbox" checked={tataTertibChecked} onChange={e => setTataTertibChecked(e.target.checked)} style={styles.cb} />
                      <span style={{ fontSize: 13, color: '#475569' }}>
                        Saya telah membaca, memahami, dan <strong>MENYETUJUI</strong> seluruh peraturan & tata tertib Bimbel Gemilang
                      </span>
                    </label>
                  </>
                )}
                <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
                  <button onClick={() => setStep(1)} style={styles.btnPrev}>← Sebelumnya</button>
                  <button onClick={() => goNext(2)} style={styles.btnNext}>Selanjutnya: Tanda Tangan →</button>
                </div>
              </div>
            )}

            {/* ============================================================ */}
            {/* STEP 3: TANDA TANGAN */}
            {/* ============================================================ */}
            {step === 3 && (
              <div style={styles.formArea}>
                <h3 style={styles.sectionTitle}>✍️ Tanda Tangan Digital</h3>
                <p style={{ textAlign: 'center', color: '#64748b', fontSize: 13, marginBottom: 12 }}>
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
                  <button onClick={clearCanvas} style={styles.btnClear}>🔄 Hapus TTD</button>
                </div>

                {signatureData && (
                  <div style={{ textAlign: 'center', marginTop: 8 }}>
                    <small style={{ color: '#10b981', fontWeight: 600 }}>✅ Tanda tangan tersimpan</small>
                  </div>
                )}

                <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
                  <button onClick={() => setStep(2)} style={styles.btnPrev}>← Sebelumnya</button>
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

      {/* INFO PAKET DI BAWAH */}
      <div style={styles.infoPaket}>
        <p>📚 <strong>Info Paket Bimbel:</strong> Tersedia paket SD, SMP, SMA. Admin akan membantu memilihkan paket sesuai kebutuhan.</p>
        <p>📍 <strong>Lokasi:</strong> Glagahagung, Purwoharjo, Banyuwangi</p>
        <p>📞 <strong>Kontak:</strong> Hubungi admin untuk informasi lebih lanjut.</p>
      </div>
    </div>
  );
};

// ============================================================
// STYLES - PUTIH PROFESIONAL
// ============================================================
const styles = {
  wrapper: {
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '20px',
    background: '#f8fafc',
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif"
  },

  card: {
    width: '100%',
    maxWidth: '600px',
    background: 'white',
    borderRadius: '16px',
    padding: '32px 28px 24px',
    boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
    border: '1px solid #e2e8f0',
    boxSizing: 'border-box'
  },

  // Header
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: '14px',
    marginBottom: '20px',
    paddingBottom: '16px',
    borderBottom: '2px solid #f1f5f9'
  },
  logo: {
    width: '56px',
    height: '56px',
    borderRadius: '12px',
    border: '2px solid #e2e8f0',
    objectFit: 'cover',
    flexShrink: 0
  },
  title: {
    fontSize: '22px',
    fontWeight: 800,
    color: '#1e293b',
    margin: 0,
    lineHeight: 1.3
  },
  subtitle: {
    fontSize: '13px',
    color: '#64748b',
    margin: '2px 0 0'
  },

  // Error
  errorBox: {
    padding: '12px 16px',
    borderRadius: '8px',
    background: '#fef2f2',
    border: '1px solid #fecaca',
    color: '#ef4444',
    fontSize: '13px',
    fontWeight: 600,
    marginBottom: '16px'
  },

  // Step Indicator
  stepRow: {
    display: 'flex',
    justifyContent: 'center',
    gap: '24px',
    marginBottom: '20px',
    flexWrap: 'wrap'
  },
  stepItem: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '4px'
  },
  stepDot: {
    width: '30px',
    height: '30px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '13px',
    fontWeight: 700,
    transition: 'all 0.3s ease'
  },
  stepLabel: {
    fontSize: '10px',
    transition: 'all 0.3s ease',
    whiteSpace: 'nowrap'
  },

  // Form
  formArea: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px'
  },
  sectionTitle: {
    fontSize: '15px',
    fontWeight: 700,
    color: '#1e293b',
    margin: '0 0 4px',
    paddingBottom: '8px',
    borderBottom: '2px solid #f1f5f9'
  },
  inputGroup: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: '4px'
  },
  label: {
    fontSize: '12px',
    fontWeight: 600,
    color: '#475569'
  },
  input: {
    padding: '10px 12px',
    borderRadius: '8px',
    border: '1px solid #e2e8f0',
    fontSize: '14px',
    outline: 'none',
    background: 'white',
    color: '#1e293b',
    boxSizing: 'border-box',
    width: '100%',
    transition: 'border 0.2s'
  },
  select: {
    padding: '10px 12px',
    borderRadius: '8px',
    border: '1px solid #e2e8f0',
    fontSize: '14px',
    outline: 'none',
    background: 'white',
    color: '#1e293b',
    cursor: 'pointer',
    boxSizing: 'border-box',
    width: '100%'
  },
  textarea: {
    padding: '10px 12px',
    borderRadius: '8px',
    border: '1px solid #e2e8f0',
    fontSize: '14px',
    outline: 'none',
    resize: 'vertical',
    minHeight: '70px',
    fontFamily: 'inherit',
    background: 'white',
    color: '#1e293b',
    boxSizing: 'border-box',
    width: '100%'
  },
  hint: {
    fontSize: '10px',
    color: '#94a3b8',
    marginTop: '2px'
  },
  row: {
    display: 'flex',
    gap: '12px',
    flexWrap: 'wrap'
  },

  // Buttons
  btnPrev: {
    flex: 1,
    padding: '12px',
    borderRadius: '8px',
    border: '1px solid #e2e8f0',
    background: 'white',
    color: '#64748b',
    fontWeight: 600,
    fontSize: '13px',
    cursor: 'pointer'
  },
  btnNext: {
    flex: 1,
    padding: '12px',
    borderRadius: '8px',
    border: 'none',
    background: '#652D90',
    color: 'white',
    fontWeight: 600,
    fontSize: '13px',
    cursor: 'pointer'
  },
  btnSubmit: {
    flex: 2,
    padding: '14px',
    borderRadius: '10px',
    border: 'none',
    background: '#10b981',
    color: 'white',
    fontWeight: 700,
    fontSize: '15px',
    cursor: 'pointer',
    boxShadow: '0 4px 12px rgba(16,185,129,0.2)'
  },
  btnClear: {
    padding: '8px 16px',
    borderRadius: '8px',
    background: '#f1f5f9',
    color: '#64748b',
    border: '1px solid #e2e8f0',
    cursor: 'pointer',
    fontSize: '12px',
    fontWeight: 600
  },

  // Tata Tertib
  ttBox: {
    maxHeight: '250px',
    overflowY: 'auto',
    padding: '14px',
    borderRadius: '8px',
    background: '#f8fafc',
    border: '1px solid #e2e8f0',
    marginBottom: '12px'
  },
  ttText: {
    whiteSpace: 'pre-wrap',
    fontSize: '12px',
    color: '#475569',
    lineHeight: '1.6',
    fontFamily: 'inherit',
    margin: 0
  },
  cbLabel: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '10px',
    cursor: 'pointer',
    padding: '10px',
    borderRadius: '8px',
    background: '#f0fdf4',
    border: '1px solid #bbf7d0'
  },
  cb: {
    width: '18px',
    height: '18px',
    marginTop: '2px',
    cursor: 'pointer',
    accentColor: '#652D90'
  },

  // Canvas TTD
  canvasWrapper: {
    position: 'relative',
    width: '100%',
    height: '180px',
    borderRadius: '8px',
    border: '2px solid #e2e8f0',
    overflow: 'hidden',
    background: 'white',
    touchAction: 'none'
  },
  canvas: {
    width: '100%',
    height: '100%',
    cursor: 'crosshair',
    display: 'block'
  },
  canvasHint: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    color: '#cbd5e1',
    fontSize: '16px',
    pointerEvents: 'none',
    fontWeight: 500
  },

  // Success
  successBox: {
    textAlign: 'center',
    padding: '20px 0'
  },
  successInfo: {
    background: '#f0fdf4',
    padding: '14px',
    borderRadius: '8px',
    textAlign: 'left',
    fontSize: '13px',
    color: '#166534',
    marginBottom: '16px',
    lineHeight: '1.8',
    border: '1px solid #bbf7d0'
  },
  btnNew: {
    padding: '12px 24px',
    borderRadius: '8px',
    background: '#652D90',
    color: 'white',
    border: 'none',
    cursor: 'pointer',
    fontWeight: 600,
    fontSize: '13px'
  },

  // Info Paket
  infoPaket: {
    width: '100%',
    maxWidth: '600px',
    marginTop: '16px',
    padding: '16px 20px',
    background: 'white',
    borderRadius: '12px',
    border: '1px solid #e2e8f0',
    fontSize: '12px',
    color: '#64748b',
    lineHeight: '1.8',
    textAlign: 'center',
    boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
  }
};

export default PendaftaranOnline;