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
    namaLengkap: '', whatsappAktif: '', kelasSekolah: 'SD',
    namaOrangTua: '', alamatRumah: '',
    paketBimbelId: '', paketBimbelNama: '', paketBimbelHarga: 0, paketBimbelDesc: ''
  });

  const [paketMaster, setPaketMaster] = useState({ SD: [], SMP: [], SMA: [] });
  const [loadingPaket, setLoadingPaket] = useState(true);
  const [selectedPaketId, setSelectedPaketId] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState('');
  const [tataTertib, setTataTertib] = useState('');
  const [tataTertibChecked, setTataTertibChecked] = useState(false);
  const [loadingTT, setLoadingTT] = useState(true);
  const [signatureData, setSignatureData] = useState(null);
  const [canvasCleared, setCanvasCleared] = useState(false);

  useEffect(() => {
    getDoc(doc(db, "settings", "paket_bimbel")).then(snap => {
      if (snap.exists()) setPaketMaster(snap.data());
      setLoadingPaket(false);
    }).catch(() => setLoadingPaket(false));
  }, []);

  useEffect(() => {
    getDoc(doc(db, "settings", "tata_tertib")).then(snap => {
      if (snap.exists() && snap.data().konten) setTataTertib(snap.data().konten);
      else setTataTertib(`PERATURAN DAN TATA TERTIB BIMBEL GEMILANG\n\n1. KEHADIRAN\n   • Siswa wajib hadir tepat waktu.\n   • Jika tidak hadir, WAJIB menginformasikan.\n\n2. PAKAIAN & SIKAP\n   • Berpakaian sopan dan rapi.\n   • Tidak berkata kasar atau membully.\n\n3. PEMBAYARAN\n   • Pembayaran di awal bulan/minggu.\n   • Keterlambatan dikenakan denda.\n\n4. FASILITAS\n   • Menjaga kebersihan ruang belajar.\n\n5. SANKSI\n   • Pelanggaran ringan: teguran.\n   • Pelanggaran berat: dikeluarkan.\n\nDengan menandatangani formulir ini, Saya menyatakan SETUJU dan siap MEMATUHI seluruh peraturan Bimbel Gemilang.`);
      setLoadingTT(false);
    }).catch(() => setLoadingTT(false));
  }, []);

  useEffect(() => {
    if (step === 4 && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      const rect = canvas.getBoundingClientRect();
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
    const rect = canvasRef.current.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return { x: clientX - rect.left, y: clientY - rect.top };
  };

  const startDrawing = (e) => { e.preventDefault(); isDrawing.current = true; lastPos.current = getCanvasPos(e); setCanvasCleared(false); };
  const draw = (e) => { e.preventDefault(); if (!isDrawing.current) return; const ctx = canvasRef.current.getContext('2d'); const pos = getCanvasPos(e); ctx.beginPath(); ctx.moveTo(lastPos.current.x, lastPos.current.y); ctx.lineTo(pos.x, pos.y); ctx.stroke(); lastPos.current = pos; };
  const stopDrawing = () => { if (!isDrawing.current) return; isDrawing.current = false; setSignatureData(canvasRef.current.toDataURL('image/png')); };
  const clearCanvas = () => { const ctx = canvasRef.current.getContext('2d'); ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height); setSignatureData(null); setCanvasCleared(true); };

  const getPaketList = (j) => paketMaster[j] || [];
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'kelasSekolah') {
      setForm({...form, kelasSekolah: value, paketBimbelId: '', paketBimbelNama: '', paketBimbelHarga: 0, paketBimbelDesc: ''});
      setSelectedPaketId('');
      return;
    }
    setForm(p => ({...p, [name]: value}));
  };
  
  const handlePaketSelect = (p) => { 
    setSelectedPaketId(p.id); 
    setForm({...form, paketBimbelId: p.id, paketBimbelNama: p.nama, paketBimbelHarga: p.harga, paketBimbelDesc: p.desc||''}); 
  };

  const validate = (s) => {
    if (s===1) { 
      if(!form.namaLengkap.trim()) return 'Nama wajib diisi!'; 
      if(!form.whatsappAktif.trim()||!/^\d+$/.test(form.whatsappAktif)||form.whatsappAktif.length<10) return 'WA wajib (angka, min 10 digit)!'; 
      if(!form.namaOrangTua.trim()) return 'Nama ortu wajib!'; 
      if(!form.alamatRumah.trim()) return 'Alamat wajib!'; 
    }
    if (s===2) { if(!form.paketBimbelId) return 'Pilih paket!'; }
    if (s===3) { if(!tataTertibChecked) return 'Setujui tata tertib!'; }
    if (s===4) { if(!signatureData) return 'Tanda tangan wajib!'; }
    return null;
  };

  const goNext = (s) => { 
    const e=validate(s); 
    if(e){setError(e);setTimeout(()=>setError(''),4000);return;} 
    setError(''); 
    setStep(s+1); 
  };

  const handleSubmit = async () => {
    const err = validate(1)||validate(2)||validate(3)||validate(4);
    if(err){setError(err);setTimeout(()=>setError(''),4000);return;}
    setLoading(true); setError('');
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
    } catch(e){ setError('Gagal: '+e.message); }
    setLoading(false);
  };

  const paketList = getPaketList(form.kelasSekolah);
  const steps = ['Biodata', 'Paket', 'Tata Tertib', 'TTD'];

  return (
    <div style={styles.container}>
      <div style={styles.bg}><div style={styles.s1}/><div style={styles.s2}/><div style={styles.s3}/><div style={styles.n1}/><div style={styles.n2}/></div>
      <div style={styles.card}>
        <div style={styles.logoArea}><img src="/pwa-192x192.png" alt="Logo" style={styles.logo} /><h1 style={styles.title}>🚀 Pendaftaran Online</h1><p style={styles.sub}>Bimbel Gemilang · Glagahagung</p></div>
        
        {error && <div style={styles.err}>⚠️ {error}</div>}
        
        {isSuccess ? (
          <div style={styles.ok}>
            <div style={{fontSize:48}}>✅</div>
            <h2 style={{color:'#fff',margin:'12px 0'}}>Pendaftaran Berhasil!</h2>
            <p style={{color:'rgba(255,255,255,0.7)',fontSize:14}}>Terima kasih <strong>{form.namaLengkap}</strong> telah mendaftar di Bimbel Gemilang.</p>
            <div style={styles.okInfo}>
              <p>📞 Admin akan menghubungi WhatsApp Anda dalam 1x24 jam.</p>
              <p>💳 Link pembayaran akan dikirim oleh admin setelah verifikasi.</p>
              <p>🏫 Silakan datang ke Bimbel Gemilang untuk informasi lebih lanjut.</p>
            </div>
            <button onClick={()=>window.location.reload()} style={styles.btnNew}>📝 Daftar Lagi</button>
          </div>
        ) : (
          <>
            <div style={styles.steps}>{steps.map((l,i)=>(<div key={i} style={styles.stepItem}><div style={{...styles.stepDot,background:step>i+1?'#10b981':step===i+1?'#8b5cf6':'rgba(255,255,255,0.1)',color:step>i+1||step===i+1?'white':'rgba(255,255,255,0.4)'}}>{step>i+1?'✓':i+1}</div><span style={{...styles.stepLbl,color:step===i+1?'#fff':'rgba(255,255,255,0.3)',fontWeight:step===i+1?700:400}}>{l}</span></div>))}</div>
            
            {step===1 && <div style={styles.fa}><h3 style={styles.st}>📋 Data Diri Siswa</h3>
              <div style={styles.ig}><label style={styles.lb}>Nama Lengkap *</label><input name="namaLengkap" value={form.namaLengkap} onChange={handleChange} style={styles.in} placeholder="Masukkan nama lengkap" required /></div>
              <div style={styles.ig}><label style={styles.lb}>Nomor WhatsApp *</label><input name="whatsappAktif" value={form.whatsappAktif} onChange={handleChange} style={styles.in} placeholder="081234567890" required /><small style={styles.hint}>Hanya angka, minimal 10 digit</small></div>
              <div style={styles.ig}><label style={styles.lb}>Kelas / Jenjang *</label><select name="kelasSekolah" value={form.kelasSekolah} onChange={handleChange} style={styles.sel} required><option value="SD">SD (Sekolah Dasar)</option><option value="SMP">SMP (Sekolah Menengah Pertama)</option><option value="SMA">SMA (Sekolah Menengah Atas)</option></select></div>
              <div style={styles.ig}><label style={styles.lb}>Nama Orang Tua / Wali *</label><input name="namaOrangTua" value={form.namaOrangTua} onChange={handleChange} style={styles.in} placeholder="Nama ayah/ibu/wali" required /></div>
              <div style={styles.ig}><label style={styles.lb}>Alamat Rumah *</label><textarea name="alamatRumah" value={form.alamatRumah} onChange={handleChange} style={styles.ta} placeholder="Desa/Kecamatan/Kabupaten" required rows={3} /></div>
              <button onClick={()=>goNext(1)} style={styles.btnN}>Selanjutnya →</button>
            </div>}

            {step===2 && <div style={styles.fa}><h3 style={styles.st}>📚 Pilih Paket Bimbel</h3>
              {loadingPaket ? <p style={{color:'rgba(255,255,255,0.3)',textAlign:'center'}}>⏳ Memuat paket...</p> :
               paketList.length===0 ? <p style={{color:'rgba(255,255,255,0.3)',textAlign:'center'}}>⚠️ Belum ada paket untuk jenjang ini</p> :
               <div style={styles.pGrid}>{paketList.map(p=>{const sel=selectedPaketId===p.id;return(<div key={p.id} onClick={()=>handlePaketSelect(p)} style={{...styles.pCard,border:sel?'2px solid #8b5cf6':'1px solid rgba(255,255,255,0.08)',boxShadow:sel?'0 0 30px rgba(139,92,246,0.3)':'none',background:sel?'rgba(139,92,246,0.08)':'rgba(255,255,255,0.03)',transform:sel?'scale(1.02)':'scale(1)'}}><div style={styles.pName}>{p.nama}</div><div style={styles.pDesc}>{p.desc||'Paket bimbel'}</div><div style={styles.pPrice}>Rp {p.harga.toLocaleString('id-ID')}</div>{sel&&<div style={styles.pSel}>✅ Dipilih</div>}</div>)})}</div>}
              {selectedPaketId && <small style={{...styles.hint,color:'#8b5cf6',fontWeight:600,display:'block',marginTop:8}}>✅ Paket terpilih: {form.paketBimbelNama} (Rp {form.paketBimbelHarga.toLocaleString('id-ID')})</small>}
              <div style={{display:'flex',gap:10,marginTop:16}}><button onClick={()=>setStep(1)} style={styles.btnP}>← Sebelumnya</button><button onClick={()=>goNext(2)} style={styles.btnN}>Selanjutnya →</button></div>
            </div>}

            {step===3 && <div style={styles.fa}><h3 style={styles.st}>📜 Peraturan & Tata Tertib</h3>
              {loadingTT ? <p style={{color:'rgba(255,255,255,0.3)',textAlign:'center'}}>⏳ Memuat tata tertib...</p> : <><div style={styles.ttBox}><pre style={styles.ttText}>{tataTertib}</pre></div>
              <label style={styles.cbLabel}><input type="checkbox" checked={tataTertibChecked} onChange={e=>setTataTertibChecked(e.target.checked)} style={styles.cb} /><span style={{color:'rgba(255,255,255,0.8)',fontSize:13}}>Saya telah membaca, memahami, dan <strong>MENYETUJUI</strong> seluruh peraturan & tata tertib Bimbel Gemilang</span></label></>}
              <div style={{display:'flex',gap:10,marginTop:16}}><button onClick={()=>setStep(2)} style={styles.btnP}>← Sebelumnya</button><button onClick={()=>goNext(3)} style={styles.btnN}>Selanjutnya →</button></div>
            </div>}

            {step===4 && <div style={styles.fa}><h3 style={styles.st}>✍️ Tanda Tangan Digital</h3>
              <p style={{color:'rgba(255,255,255,0.5)',fontSize:12,textAlign:'center',marginBottom:12}}>Silakan tanda tangan di kotak di bawah ini menggunakan jari atau stylus pen</p>
              <div style={styles.cvWrap}><canvas ref={canvasRef} style={styles.cv} onMouseDown={startDrawing} onMouseMove={draw} onMouseUp={stopDrawing} onMouseLeave={stopDrawing} onTouchStart={startDrawing} onTouchMove={draw} onTouchEnd={stopDrawing} />{!signatureData&&!canvasCleared&&<div style={styles.cvHint}>✍️ Tanda tangan di sini</div>}</div>
              <div style={{display:'flex',gap:10,justifyContent:'center',marginTop:10}}><button onClick={clearCanvas} style={styles.btnClr}>🔄 Hapus TTD</button></div>
              {signatureData&&<div style={{textAlign:'center',marginTop:8}}><small style={{color:'#10b981',fontWeight:600}}>✅ Tanda tangan tersimpan</small></div>}
              <div style={{display:'flex',gap:10,marginTop:16}}><button onClick={()=>setStep(3)} style={styles.btnP}>← Sebelumnya</button><button onClick={handleSubmit} disabled={loading} style={{...styles.btnSub,opacity:loading?0.7:1,cursor:loading?'not-allowed':'pointer'}}>{loading?'⏳ Mengirim...':'🚀 Daftar Sekarang'}</button></div>
            </div>}
          </>
        )}
      </div>
      <style>{`@keyframes twinkle{0%,100%{opacity:.2;transform:scale(1)}50%{opacity:.8;transform:scale(1.2)}}@keyframes pulse{0%,100%{opacity:.3}50%{opacity:.7}}::-webkit-scrollbar{width:4px}::-webkit-scrollbar-track{background:rgba(255,255,255,.02)}::-webkit-scrollbar-thumb{background:rgba(139,92,246,.3);border-radius:10px}`}</style>
    </div>
  );
};

const styles = {
  container:{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',padding:20,background:'linear-gradient(135deg,#05070f 0%,#0d1b2a 40%,#1a0a2e 80%,#02040a 100%)',fontFamily:"'Inter',-apple-system,BlinkMacSystemFont,sans-serif",position:'relative',overflow:'hidden'},
  bg:{position:'fixed',inset:0,pointerEvents:'none',zIndex:0,overflow:'hidden'},
  s1:{position:'absolute',width:2,height:2,background:'white',top:'10%',left:'15%',borderRadius:'50%',animation:'twinkle 3s ease-in-out infinite'},
  s2:{position:'absolute',width:3,height:3,background:'white',top:'25%',right:'20%',borderRadius:'50%',animation:'twinkle 4s ease-in-out infinite .5s'},
  s3:{position:'absolute',width:2,height:2,background:'white',bottom:'30%',left:'10%',borderRadius:'50%',animation:'twinkle 2.5s ease-in-out infinite 1s'},
  n1:{position:'absolute',width:400,height:400,borderRadius:'50%',background:'radial-gradient(circle,rgba(139,92,246,.06),transparent 70%)',top:'-10%',right:'-10%',animation:'pulse 8s ease-in-out infinite'},
  n2:{position:'absolute',width:500,height:500,borderRadius:'50%',background:'radial-gradient(circle,rgba(243,156,18,.04),transparent 70%)',bottom:'-20%',left:'-15%',animation:'pulse 10s ease-in-out infinite reverse'},
  
  card:{position:'relative',zIndex:1,width:'100%',maxWidth:560,padding:'32px 28px 24px',borderRadius:24,background:'rgba(255,255,255,.04)',backdropFilter:'blur(24px)',WebkitBackdropFilter:'blur(24px)',border:'1px solid rgba(255,255,255,.06)',boxShadow:'0 30px 80px rgba(0,0,0,.5),inset 0 1px 0 rgba(255,255,255,.04)',boxSizing:'border-box',maxHeight:'96vh',overflowY:'auto'},
  
  logoArea:{textAlign:'center',marginBottom:16},
  logo:{width:64,height:64,borderRadius:'50%',boxShadow:'0 0 40px rgba(139,92,246,.15)',border:'2px solid rgba(139,92,246,.2)',objectFit:'cover'},
  title:{fontSize:24,fontWeight:800,color:'#fff',margin:'12px 0 4px',letterSpacing:'-0.5px'},
  sub:{fontSize:13,color:'rgba(255,255,255,.3)',margin:0},
  
  err:{padding:'12px 16px',borderRadius:10,background:'rgba(239,68,68,.1)',border:'1px solid rgba(239,68,68,.2)',color:'#f87171',fontSize:13,fontWeight:600,marginBottom:16},
  
  ok:{textAlign:'center',padding:'20px 0'},
  okInfo:{background:'rgba(139,92,246,.1)',padding:14,borderRadius:10,textAlign:'left',fontSize:12,color:'rgba(255,255,255,.6)',marginBottom:16,lineHeight:1.8},
  btnNew:{padding:'12px 24px',borderRadius:10,background:'rgba(255,255,255,.05)',color:'white',border:'1px solid rgba(255,255,255,.1)',cursor:'pointer',fontWeight:600,fontSize:13},
  
  steps:{display:'flex',justifyContent:'center',gap:20,marginBottom:20,flexWrap:'wrap'},
  stepItem:{display:'flex',flexDirection:'column',alignItems:'center',gap:4},
  stepDot:{width:28,height:28,borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',fontSize:12,fontWeight:700,transition:'all .3s ease',border:'2px solid transparent'},
  stepLbl:{fontSize:10,transition:'all .3s ease'},
  
  fa:{display:'flex',flexDirection:'column',gap:12},
  st:{fontSize:16,fontWeight:700,color:'#fff',margin:'0 0 4px',textAlign:'center'},
  ig:{display:'flex',flexDirection:'column',gap:4},
  lb:{fontSize:12,fontWeight:600,color:'rgba(255,255,255,.6)',textTransform:'uppercase',letterSpacing:'0.3px'},
  in:{padding:'12px 14px',borderRadius:10,border:'1px solid rgba(255,255,255,.06)',fontSize:14,outline:'none',background:'rgba(255,255,255,.03)',color:'#fff',transition:'all .3s'},
  sel:{padding:'12px 14px',borderRadius:10,border:'1px solid rgba(255,255,255,.06)',fontSize:14,outline:'none',background:'rgba(255,255,255,.03)',color:'#fff',cursor:'pointer'},
  ta:{padding:'12px 14px',borderRadius:10,border:'1px solid rgba(255,255,255,.06)',fontSize:14,outline:'none',resize:'vertical',minHeight:70,fontFamily:'inherit',background:'rgba(255,255,255,.03)',color:'#fff'},
  hint:{fontSize:10,color:'rgba(255,255,255,.25)',marginTop:2},
  
  pGrid:{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,maxHeight:280,overflowY:'auto',paddingRight:4},
  pCard:{padding:'14px 12px',borderRadius:12,cursor:'pointer',transition:'all .3s ease'},
  pName:{fontSize:12,fontWeight:700,color:'#fff',marginBottom:4},
  pDesc:{fontSize:10,color:'rgba(255,255,255,.4)',lineHeight:1.4,marginBottom:6,minHeight:28},
  pPrice:{fontSize:14,fontWeight:800,color:'#fbbf24',textShadow:'0 0 20px rgba(251,191,36,.1)'},
  pSel:{fontSize:9,fontWeight:700,color:'#8b5cf6',marginTop:4,display:'inline-block',padding:'2px 8px',borderRadius:4,background:'rgba(139,92,246,.15)'},
  
  btnP:{flex:1,padding:12,borderRadius:10,border:'1px solid rgba(255,255,255,.1)',background:'rgba(255,255,255,.03)',color:'rgba(255,255,255,.6)',fontWeight:600,fontSize:13,cursor:'pointer'},
  btnN:{flex:1,padding:12,borderRadius:10,border:'none',background:'rgba(139,92,246,.2)',color:'white',fontWeight:600,fontSize:13,cursor:'pointer'},
  btnSub:{flex:2,padding:14,borderRadius:12,border:'none',background:'linear-gradient(135deg,#8b5cf6,#6d28d9)',color:'white',fontWeight:700,fontSize:15,cursor:'pointer',boxShadow:'0 8px 30px rgba(139,92,246,.2)'},
  
  ttBox:{maxHeight:300,overflowY:'auto',padding:14,borderRadius:10,background:'rgba(255,255,255,.03)',border:'1px solid rgba(255,255,255,.06)',marginBottom:12},
  ttText:{whiteSpace:'pre-wrap',fontSize:11,color:'rgba(255,255,255,.7)',lineHeight:1.7,fontFamily:'inherit',margin:0},
  cbLabel:{display:'flex',alignItems:'flex-start',gap:10,cursor:'pointer',padding:10,borderRadius:8,background:'rgba(139,92,246,.05)',border:'1px solid rgba(139,92,246,.1)'},
  cb:{width:18,height:18,marginTop:2,cursor:'pointer',accentColor:'#8b5cf6'},
  
  cvWrap:{position:'relative',width:'100%',height:180,borderRadius:10,border:'2px dashed rgba(255,255,255,.15)',overflow:'hidden',background:'rgba(255,255,255,.03)',touchAction:'none'},
  cv:{width:'100%',height:'100%',cursor:'crosshair',display:'block'},
  cvHint:{position:'absolute',top:'50%',left:'50%',transform:'translate(-50%,-50%)',color:'rgba(255,255,255,.2)',fontSize:18,pointerEvents:'none',fontWeight:600},
  btnClr:{padding:'8px 16px',borderRadius:8,background:'rgba(255,255,255,.05)',color:'rgba(255,255,255,.5)',border:'1px solid rgba(255,255,255,.1)',cursor:'pointer',fontSize:12,fontWeight:600}
};

export default PendaftaranOnline;