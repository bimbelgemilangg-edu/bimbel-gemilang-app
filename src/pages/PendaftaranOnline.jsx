// src/pages/PendaftaranOnline.jsx
import React, { useState, useEffect, useRef } from 'react';
import { db } from '../firebase';
import { collection, addDoc, query, where, getDocs, doc, getDoc, serverTimestamp } from "firebase/firestore";

const PendaftaranOnline = () => {
  const canvasRef = useRef(null);
  const isDrawing = useRef(false);
  const lastPos = useRef({ x: 0, y: 0 });

  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    namaLengkap: '', gender: 'Laki-laki', whatsappAktif: '',
    asalSekolah: '', kelasSekolah: '1 SD',
    namaAyah: '', pekerjaanAyah: '', namaIbu: '', pekerjaanIbu: '',
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

  // ===== CEK PEMBAYARAN =====
  const [showCekBayar, setShowCekBayar] = useState(false);
  const [cekNama, setCekNama] = useState('');
  const [cekWA, setCekWA] = useState('');
  const [cekLoading, setCekLoading] = useState(false);
  const [cekResult, setCekResult] = useState(null);
  const [cekError, setCekError] = useState('');

  // ===== FETCH TATA TERTIB =====
  useEffect(() => {
    getDoc(doc(db, "settings", "tata_tertib")).then(snap => {
      if (snap.exists() && snap.data().konten) setTataTertib(snap.data().konten);
      else setTataTertib(`PERATURAN DAN TATA TERTIB BIMBEL GEMILANG\n\n1. KEHADIRAN\n   • Siswa wajib hadir tepat waktu.\n\n2. PAKAIAN & SIKAP\n   • Berpakaian sopan dan rapi.\n\n3. PEMBAYARAN\n   • Pembayaran di awal bulan.\n\n4. FASILITAS\n   • Menjaga kebersihan.\n\n5. SANKSI\n   • Pelanggaran ringan: teguran.\n   • Pelanggaran berat: dikeluarkan.\n\nDengan menandatangani formulir ini, Saya menyatakan SETUJU dan siap MEMATUHI seluruh peraturan Bimbel Gemilang.`);
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
  const startDrawing = (e) => { e.preventDefault(); isDrawing.current = true; lastPos.current = getCanvasPos(e); setCanvasCleared(false); };
  const draw = (e) => { e.preventDefault(); if (!isDrawing.current) return; const ctx = canvasRef.current.getContext('2d'); const pos = getCanvasPos(e); ctx.beginPath(); ctx.moveTo(lastPos.current.x, lastPos.current.y); ctx.lineTo(pos.x, pos.y); ctx.stroke(); lastPos.current = pos; };
  const stopDrawing = () => { if (!isDrawing.current) return; isDrawing.current = false; setSignatureData(canvasRef.current.toDataURL('image/png')); };
  const clearCanvas = () => { const ctx = canvasRef.current.getContext('2d'); ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height); setSignatureData(null); setCanvasCleared(true); };

  // ===== FORM HANDLERS =====
  const handleChange = (e) => setForm(p => ({ ...p, [e.target.name]: e.target.value }));

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
    if (s === 2) { if (!tataTertibChecked) return 'Anda harus menyetujui peraturan & tata tertib!'; }
    if (s === 3) { if (!signatureData) return 'Silakan tanda tangan di kotak yang disediakan!'; }
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
    setLoading(true); setError('');
    try {
      await addDoc(collection(db, "online_registrations"), {
        ...form, tataTertibDisetujui: true, tandaTangan: signatureData,
        paymentStatus: 'pending', totalPaid: 0, createdAt: serverTimestamp()
      });
      setIsSuccess(true);
    } catch (e) { setError('Gagal: ' + e.message); }
    setLoading(false);
  };

  // ===== CEK PEMBAYARAN =====
  const handleCekBayar = async (e) => {
    e.preventDefault();
    if (!cekWA.trim() || !/^\d+$/.test(cekWA) || cekWA.length < 10) {
      setCekError('Masukkan nomor WhatsApp yang valid!');
      setTimeout(() => setCekError(''), 4000);
      return;
    }
    setCekLoading(true); setCekError(''); setCekResult(null);
    try {
      const q = query(
        collection(db, "online_registrations"),
        where("whatsappAktif", "==", cekWA.trim())
      );
      const snap = await getDocs(q);
      
      if (snap.empty) {
        setCekError('Data tidak ditemukan. Pastikan nomor WhatsApp sesuai saat pendaftaran.');
        setTimeout(() => setCekError(''), 5000);
      } else {
        const data = snap.docs[0].data();
        const id = snap.docs[0].id;
        
        // Cek apakah admin sudah buat pembayaran
        const hasPayment = data.paymentLink || data.paymentLinkAmount || data.paketBimbelHarga;
        
        if (!hasPayment) {
          setCekResult({
            id, ...data,
            status: 'pending_admin',
            message: '⏳ Admin belum membuat tagihan. Silakan tunggu atau hubungi admin.'
          });
        } else if (data.status === 'active') {
          setCekResult({
            id, ...data,
            status: 'active',
            message: '✅ Pendaftaran sudah disahkan! Silakan login dengan username & password dari admin.'
          });
        } else if (data.totalPaid >= (data.paketBimbelHarga || data.paymentLinkAmount || 0) && (data.paketBimbelHarga || data.paymentLinkAmount) > 0) {
          setCekResult({
            id, ...data,
            status: 'lunas',
            message: '✅ Pembayaran LUNAS! Admin akan segera mengesahkan akun Anda.'
          });
        } else {
          setCekResult({
            id, ...data,
            status: 'pending_bayar',
            message: '💳 Silakan lakukan pembayaran di bawah ini.'
          });
        }
      }
    } catch (e) {
      setCekError('Gagal mengecek data. Silakan coba lagi.');
      setTimeout(() => setCekError(''), 4000);
    }
    setCekLoading(false);
  };

  // ===== BAYAR VIA MIDTRANS =====
  const handleBayarSekarang = async (reg) => {
    if (reg.paymentLink) {
      window.open(reg.paymentLink, '_blank');
      return;
    }
    
    // Jika belum ada link, generate baru
    setLoading(true);
    try {
      const nominal = reg.paketBimbelHarga || reg.paymentLinkAmount || 0;
      const response = await fetch('/api/create-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: reg.id,
          grossAmount: nominal,
          customerName: reg.namaLengkap,
          customerPhone: reg.whatsappAktif,
          paketNama: reg.paketBimbelNama || 'Pendaftaran'
        })
      });
      const data = await response.json();
      if (data.success && data.redirect_url) {
        window.open(data.redirect_url, '_blank');
      } else {
        alert('⚠️ Gagal membuat link pembayaran. Hubungi admin.');
      }
    } catch (e) { alert('❌ Gagal: ' + e.message); }
    setLoading(false);
  };

  const formatRupiah = (n) => 'Rp ' + (n || 0).toLocaleString('id-ID');

  // ===== RENDER =====
  const steps = ['📋 Biodata', '📜 Tata Tertib', '✍️ Tanda Tangan'];

  // ===== CEK BAYAR VIEW =====
  if (showCekBayar) {
    return (
      <div style={styles.wrapper}>
        <div style={styles.card}>
          <div style={styles.header}>
            <img src="/pwa-192x192.png" alt="Logo" style={styles.logo} />
            <div>
              <h1 style={styles.title}>Cek Pembayaran</h1>
              <p style={styles.subtitle}>Bimbel Gemilang · Glagahagung</p>
            </div>
          </div>

          {cekError && <div style={styles.errorBox}>⚠️ {cekError}</div>}

          <form onSubmit={handleCekBayar} style={{display:'flex',flexDirection:'column',gap:12}}>
            <div style={styles.inputGroup}>
              <label style={styles.label}>Nama Lengkap</label>
              <input type="text" value={cekWA} onChange={e=>setCekWA(e.target.value)} style={styles.input} placeholder="081234567890" />
              <small style={styles.hint}>Masukkan nomor WhatsApp yang didaftarkan</small>
            </div>
            <button type="submit" disabled={cekLoading} style={{...styles.btnNext,opacity:cekLoading?0.7:1}}>
              {cekLoading ? '⏳ Mengecek...' : '🔍 Cek Pembayaran'}
            </button>
          </form>

          {/* HASIL CEK */}
          {cekResult && (
            <div style={{marginTop:16,padding:16,background:'#f8fafc',borderRadius:12,border:'1px solid #e2e8f0'}}>
              <div style={{textAlign:'center',marginBottom:12}}>
                <span style={{fontSize:14,fontWeight:700,color:'#1e293b'}}>{cekResult.message}</span>
              </div>
              
              <div style={s2.dr}><span>Nama</span><strong>{cekResult.namaLengkap}</strong></div>
              <div style={s2.dr}><span>Kelas</span><strong>{cekResult.kelasSekolah}</strong></div>
              
              {(cekResult.status === 'pending_bayar' || cekResult.status === 'lunas') && (
                <>
                  <div style={s2.dr}><span>Paket</span><strong>{cekResult.paketBimbelNama || '-'}</strong></div>
                  <div style={s2.dr}>
                    <span>Total Tagihan</span>
                    <strong style={{color:'#ef4444'}}>{formatRupiah(cekResult.paketBimbelHarga || cekResult.paymentLinkAmount)}</strong>
                  </div>
                  <div style={s2.dr}>
                    <span>Total Bayar</span>
                    <strong style={{color:'#10b981'}}>{formatRupiah(cekResult.totalPaid || 0)}</strong>
                  </div>
                </>
              )}

              {cekResult.status === 'pending_bayar' && (
                <button onClick={() => handleBayarSekarang(cekResult)} disabled={loading}
                  style={{...styles.btnSubmit,width:'100%',marginTop:12}}>
                  {loading ? '⏳' : '💳 BAYAR SEKARANG'}
                </button>
              )}

              {cekResult.status === 'pending_admin' && (
                <div style={{textAlign:'center',marginTop:12,color:'#64748b',fontSize:12}}>
                  📞 Hubungi admin Bimbel Gemilang untuk informasi lebih lanjut.
                </div>
              )}

              {cekResult.status === 'active' && (
                <div style={{textAlign:'center',marginTop:12,color:'#10b981',fontSize:12,fontWeight:600}}>
                  🎉 Selamat! Akun Anda sudah aktif.
                </div>
              )}
            </div>
          )}

          <button onClick={() => {setShowCekBayar(false);setCekResult(null);setCekWA('');setCekError('');}} 
            style={{...styles.btnPrev,width:'100%',marginTop:12}}>
            ← Kembali ke Pendaftaran
          </button>
        </div>
      </div>
    );
  }

  // ===== MAIN VIEW =====
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
              <p>💳 Admin akan membuat tagihan pembayaran untuk Anda.</p>
              <p>🔍 Setelah itu, Anda bisa cek & bayar di sini.</p>
            </div>
            <button onClick={() => {setShowCekBayar(true);setCekWA(form.whatsappAktif);}} style={styles.btnNext}>
              💳 Cek Pembayaran
            </button>
            <button onClick={() => window.location.reload()} style={{...styles.btnPrev,marginTop:8}}>
              📝 Daftar Baru
            </button>
          </div>
        ) : (
          <>
            {/* STEP INDICATOR */}
            <div style={styles.stepRow}>
              {steps.map((label, idx) => (
                <div key={idx} style={styles.stepItem}>
                  <div style={{...styles.stepDot,background:step>idx+1?'#10b981':step===idx+1?'#652D90':'#e2e8f0',color:step>idx+1||step===idx+1?'white':'#94a3b8'}}>
                    {step > idx + 1 ? '✓' : idx + 1}
                  </div>
                  <span style={{...styles.stepLabel,color:step===idx+1?'#652D90':'#94a3b8',fontWeight:step===idx+1?700:400}}>{label}</span>
                </div>
              ))}
            </div>

            {/* STEP 1: BIODATA */}
            {step === 1 && (
              <div style={styles.formArea}>
                <h3 style={styles.sectionTitle}>📋 Data Diri Siswa</h3>
                <div style={styles.inputGroup}><label style={styles.label}>Nama Lengkap <span style={{color:'#ef4444'}}>*</span></label><input type="text" name="namaLengkap" value={form.namaLengkap} onChange={handleChange} style={styles.input} placeholder="Masukkan nama lengkap siswa" /></div>
                <div style={styles.inputGroup}><label style={styles.label}>Jenis Kelamin <span style={{color:'#ef4444'}}>*</span></label><select name="gender" value={form.gender} onChange={handleChange} style={styles.select}><option value="Laki-laki">👦 Laki-laki</option><option value="Perempuan">👧 Perempuan</option></select></div>
                <div style={styles.inputGroup}><label style={styles.label}>Nomor WhatsApp <span style={{color:'#ef4444'}}>*</span></label><input type="tel" name="whatsappAktif" value={form.whatsappAktif} onChange={handleChange} style={styles.input} placeholder="081234567890" /><small style={styles.hint}>Hanya angka, minimal 10 digit</small></div>
                <div style={styles.row}><div style={styles.inputGroup}><label style={styles.label}>Asal Sekolah <span style={{color:'#ef4444'}}>*</span></label><input type="text" name="asalSekolah" value={form.asalSekolah} onChange={handleChange} style={styles.input} placeholder="SD/SMP/SMA ..." /></div><div style={styles.inputGroup}><label style={styles.label}>Kelas <span style={{color:'#ef4444'}}>*</span></label><select name="kelasSekolah" value={form.kelasSekolah} onChange={handleChange} style={styles.select}><option value="1 SD">1 SD</option><option value="2 SD">2 SD</option><option value="3 SD">3 SD</option><option value="4 SD">4 SD</option><option value="5 SD">5 SD</option><option value="6 SD">6 SD</option><option value="7 SMP">7 SMP</option><option value="8 SMP">8 SMP</option><option value="9 SMP">9 SMP</option><option value="10 SMA">10 SMA</option><option value="11 SMA">11 SMA</option><option value="12 SMA">12 SMA</option><option value="Alumni">Alumni</option></select></div></div>
                <h3 style={{...styles.sectionTitle,marginTop:8}}>👨‍👩‍👦 Data Orang Tua</h3>
                <div style={styles.row}><div style={styles.inputGroup}><label style={styles.label}>Nama Ayah <span style={{color:'#ef4444'}}>*</span></label><input type="text" name="namaAyah" value={form.namaAyah} onChange={handleChange} style={styles.input} placeholder="Nama lengkap ayah" /></div><div style={styles.inputGroup}><label style={styles.label}>Pekerjaan Ayah</label><input type="text" name="pekerjaanAyah" value={form.pekerjaanAyah} onChange={handleChange} style={styles.input} placeholder="Pekerjaan ayah" /></div></div>
                <div style={styles.row}><div style={styles.inputGroup}><label style={styles.label}>Nama Ibu <span style={{color:'#ef4444'}}>*</span></label><input type="text" name="namaIbu" value={form.namaIbu} onChange={handleChange} style={styles.input} placeholder="Nama lengkap ibu" /></div><div style={styles.inputGroup}><label style={styles.label}>Pekerjaan Ibu</label><input type="text" name="pekerjaanIbu" value={form.pekerjaanIbu} onChange={handleChange} style={styles.input} placeholder="Pekerjaan ibu" /></div></div>
                <div style={styles.inputGroup}><label style={styles.label}>Alamat Lengkap <span style={{color:'#ef4444'}}>*</span></label><textarea name="alamatRumah" value={form.alamatRumah} onChange={handleChange} style={styles.textarea} placeholder="Desa, Kecamatan, Kabupaten" rows={3} /></div>
                <button onClick={()=>goNext(1)} style={styles.btnNext}>Selanjutnya: Tata Tertib →</button>
              </div>
            )}

            {/* STEP 2: TATA TERTIB */}
            {step === 2 && (
              <div style={styles.formArea}>
                <h3 style={styles.sectionTitle}>📜 Peraturan & Tata Tertib Bimbel Gemilang</h3>
                {loadingTT ? <p style={{textAlign:'center',color:'#94a3b8'}}>⏳ Memuat tata tertib...</p> : <><div style={styles.ttBox}><pre style={styles.ttText}>{tataTertib}</pre></div><label style={styles.cbLabel}><input type="checkbox" checked={tataTertibChecked} onChange={e=>setTataTertibChecked(e.target.checked)} style={styles.cb} /><span style={{fontSize:13,color:'#475569'}}>Saya telah membaca, memahami, dan <strong>MENYETUJUI</strong> seluruh peraturan & tata tertib Bimbel Gemilang</span></label></>}
                <div style={{display:'flex',gap:10,marginTop:16}}><button onClick={()=>setStep(1)} style={styles.btnPrev}>← Sebelumnya</button><button onClick={()=>goNext(2)} style={styles.btnNext}>Selanjutnya: Tanda Tangan →</button></div>
              </div>
            )}

            {/* STEP 3: TANDA TANGAN */}
            {step === 3 && (
              <div style={styles.formArea}>
                <h3 style={styles.sectionTitle}>✍️ Tanda Tangan Digital</h3>
                <p style={{textAlign:'center',color:'#64748b',fontSize:13,marginBottom:12}}>Silakan tanda tangan di kotak di bawah ini</p>
                <div style={styles.canvasWrapper}><canvas ref={canvasRef} style={styles.canvas} onMouseDown={startDrawing} onMouseMove={draw} onMouseUp={stopDrawing} onMouseLeave={stopDrawing} onTouchStart={startDrawing} onTouchMove={draw} onTouchEnd={stopDrawing} />{!signatureData&&!canvasCleared&&<div style={styles.canvasHint}>✍️ Tanda tangan di sini</div>}</div>
                <div style={{display:'flex',gap:10,justifyContent:'center',marginTop:10}}><button onClick={clearCanvas} style={styles.btnClear}>🔄 Hapus TTD</button></div>
                {signatureData&&<div style={{textAlign:'center',marginTop:8}}><small style={{color:'#10b981',fontWeight:600}}>✅ Tanda tangan tersimpan</small></div>}
                <div style={{display:'flex',gap:10,marginTop:16}}><button onClick={()=>setStep(2)} style={styles.btnPrev}>← Sebelumnya</button><button onClick={handleSubmit} disabled={loading} style={{...styles.btnSubmit,opacity:loading?0.7:1}}>{loading?'⏳ Mengirim...':'🚀 Daftar Sekarang'}</button></div>
              </div>
            )}
          </>
        )}

        {/* TOMBOL CEK BAYAR DI BAWAH */}
        <div style={{marginTop:16,textAlign:'center',borderTop:'1px solid #e2e8f0',paddingTop:16}}>
          <p style={{fontSize:12,color:'#64748b',marginBottom:8}}>Sudah mendaftar? Cek status pembayaran di sini.</p>
          <button onClick={() => setShowCekBayar(true)} style={{...styles.btnPrev,width:'100%'}}>
            💳 Cek Pembayaran
          </button>
        </div>
      </div>

      {/* INFO */}
      <div style={styles.infoPaket}>
        <p>📚 <strong>Info Paket Bimbel:</strong> Tersedia paket SD, SMP, SMA. Admin akan membantu memilihkan paket sesuai kebutuhan.</p>
        <p>📍 <strong>Lokasi:</strong> Glagahagung, Purwoharjo, Banyuwangi</p>
      </div>
    </div>
  );
};

// ============================================================
// STYLES
// ============================================================
const styles = {
  wrapper:{minHeight:'100vh',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:'20px',background:'#f8fafc',fontFamily:"'Inter',-apple-system,BlinkMacSystemFont,sans-serif"},
  card:{width:'100%',maxWidth:'600px',background:'white',borderRadius:'16px',padding:'32px 28px 24px',boxShadow:'0 4px 20px rgba(0,0,0,0.08)',border:'1px solid #e2e8f0',boxSizing:'border-box'},
  header:{display:'flex',alignItems:'center',gap:'14px',marginBottom:'20px',paddingBottom:'16px',borderBottom:'2px solid #f1f5f9'},
  logo:{width:'56px',height:'56px',borderRadius:'12px',border:'2px solid #e2e8f0',objectFit:'cover',flexShrink:0},
  title:{fontSize:'22px',fontWeight:800,color:'#1e293b',margin:0,lineHeight:1.3},
  subtitle:{fontSize:'13px',color:'#64748b',margin:'2px 0 0'},
  errorBox:{padding:'12px 16px',borderRadius:'8px',background:'#fef2f2',border:'1px solid #fecaca',color:'#ef4444',fontSize:'13px',fontWeight:600,marginBottom:'16px'},
  stepRow:{display:'flex',justifyContent:'center',gap:'24px',marginBottom:'20px',flexWrap:'wrap'},
  stepItem:{display:'flex',flexDirection:'column',alignItems:'center',gap:'4px'},
  stepDot:{width:'30px',height:'30px',borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'13px',fontWeight:700,transition:'all 0.3s ease'},
  stepLabel:{fontSize:'10px',transition:'all 0.3s ease',whiteSpace:'nowrap'},
  formArea:{display:'flex',flexDirection:'column',gap:'12px'},
  sectionTitle:{fontSize:'15px',fontWeight:700,color:'#1e293b',margin:'0 0 4px',paddingBottom:'8px',borderBottom:'2px solid #f1f5f9'},
  inputGroup:{flex:1,display:'flex',flexDirection:'column',gap:'4px'},
  label:{fontSize:'12px',fontWeight:600,color:'#475569'},
  input:{padding:'10px 12px',borderRadius:'8px',border:'1px solid #e2e8f0',fontSize:'14px',outline:'none',background:'white',color:'#1e293b',boxSizing:'border-box',width:'100%',transition:'border 0.2s'},
  select:{padding:'10px 12px',borderRadius:'8px',border:'1px solid #e2e8f0',fontSize:'14px',outline:'none',background:'white',color:'#1e293b',cursor:'pointer',boxSizing:'border-box',width:'100%'},
  textarea:{padding:'10px 12px',borderRadius:'8px',border:'1px solid #e2e8f0',fontSize:'14px',outline:'none',resize:'vertical',minHeight:'70px',fontFamily:'inherit',background:'white',color:'#1e293b',boxSizing:'border-box',width:'100%'},
  hint:{fontSize:'10px',color:'#94a3b8',marginTop:'2px'},
  row:{display:'flex',gap:'12px',flexWrap:'wrap'},
  btnPrev:{padding:'12px',borderRadius:'8px',border:'1px solid #e2e8f0',background:'white',color:'#64748b',fontWeight:600,fontSize:'13px',cursor:'pointer'},
  btnNext:{padding:'12px',borderRadius:'8px',border:'none',background:'#652D90',color:'white',fontWeight:600,fontSize:'13px',cursor:'pointer'},
  btnSubmit:{padding:'14px',borderRadius:'10px',border:'none',background:'#10b981',color:'white',fontWeight:700,fontSize:'15px',cursor:'pointer',boxShadow:'0 4px 12px rgba(16,185,129,0.2)'},
  btnClear:{padding:'8px 16px',borderRadius:'8px',background:'#f1f5f9',color:'#64748b',border:'1px solid #e2e8f0',cursor:'pointer',fontSize:'12px',fontWeight:600},
  ttBox:{maxHeight:'250px',overflowY:'auto',padding:'14px',borderRadius:'8px',background:'#f8fafc',border:'1px solid #e2e8f0',marginBottom:'12px'},
  ttText:{whiteSpace:'pre-wrap',fontSize:'12px',color:'#475569',lineHeight:'1.6',fontFamily:'inherit',margin:0},
  cbLabel:{display:'flex',alignItems:'flex-start',gap:'10px',cursor:'pointer',padding:'10px',borderRadius:'8px',background:'#f0fdf4',border:'1px solid #bbf7d0'},
  cb:{width:'18px',height:'18px',marginTop:'2px',cursor:'pointer',accentColor:'#652D90'},
  canvasWrapper:{position:'relative',width:'100%',height:'180px',borderRadius:'8px',border:'2px solid #e2e8f0',overflow:'hidden',background:'white',touchAction:'none'},
  canvas:{width:'100%',height:'100%',cursor:'crosshair',display:'block'},
  canvasHint:{position:'absolute',top:'50%',left:'50%',transform:'translate(-50%,-50%)',color:'#cbd5e1',fontSize:'16px',pointerEvents:'none',fontWeight:500},
  successBox:{textAlign:'center',padding:'20px 0'},
  successInfo:{background:'#f0fdf4',padding:'14px',borderRadius:'8px',textAlign:'left',fontSize:'13px',color:'#166534',marginBottom:'16px',lineHeight:'1.8',border:'1px solid #bbf7d0'},
  infoPaket:{width:'100%',maxWidth:'600px',marginTop:'16px',padding:'16px 20px',background:'white',borderRadius:'12px',border:'1px solid #e2e8f0',fontSize:'12px',color:'#64748b',lineHeight:'1.8',textAlign:'center',boxShadow:'0 2px 8px rgba(0,0,0,0.04)'}
};

const s2 = {
  dr:{display:'flex',justifyContent:'space-between',padding:'6px 0',borderBottom:'1px solid #f1f5f9',fontSize:12}
};

export default PendaftaranOnline;