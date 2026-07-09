// src/pages/admin/pendaftaran/ManagePaketHarga.jsx
import React, { useState, useEffect } from 'react';
import SidebarAdmin from '../../../components/SidebarAdmin';
import { db } from '../../../firebase';
import { doc, getDoc, setDoc } from "firebase/firestore";
import { Save, RefreshCw, BookOpen, Plus, Trash2, X, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const ManagePaketHarga = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [paketData, setPaketData] = useState({ SD: [], SMP: [], SMA: [] });
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  
  const [vaInfo, setVaInfo] = useState({
    bankName: 'BCA',
    accountNumber: '1234567890',
    accountHolder: 'Bimbel Gemilang',
    instructions: 'Silakan transfer ke rekening di atas dan konfirmasi ke admin.'
  });
  const [editingVA, setEditingVA] = useState(false);

  const DEFAULT_PAKET = {
    SD: [
      { id: "sd_fokus_1", nama: "SD Fokus 1 Bulan", harga: 95000, desc: "1 Mapel pilihan, tentor spesialis" },
      { id: "sd_lengkap_1", nama: "SD Lengkap 1 Bulan", harga: 250000, desc: "Matematika, B.Indo, B.Inggris, IPAS" }
    ],
    SMP: [
      { id: "smp_starter_1", nama: "SMP Starter 1 Bulan", harga: 230000, desc: "2 Mapel pilihan untuk jenjang SMP" },
      { id: "smp_lengkap_1", nama: "SMP Lengkap 1 Bulan", harga: 300000, desc: "Matematika, IPA, IPS, B.Indo, B.Inggris" }
    ],
    SMA: [
      { id: "sma_basic_1", nama: "SMA Basic 1 Bulan", harga: 349000, desc: "2 Mapel pilihan pendampingan SMA" },
      { id: "sma_lengkap_1", nama: "SMA Lengkap 1 Bulan", harga: 499000, desc: "Program Lengkap SMA Jurusan IPA/IPS" }
    ]
  };

  useEffect(() => {
    const h = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', h);
    return () => window.removeEventListener('resize', h);
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const docRef = doc(db, "settings", "paket_bimbel");
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) setPaketData(docSnap.data());
        else { await setDoc(docRef, DEFAULT_PAKET); setPaketData(DEFAULT_PAKET); }

        const vaRef = doc(db, "settings", "virtual_account");
        const vaSnap = await getDoc(vaRef);
        if (vaSnap.exists()) setVaInfo(vaSnap.data());
        else await setDoc(vaRef, vaInfo);
      } catch (e) { console.error(e); }
      setLoading(false);
    };
    fetchData();
  }, []);

  const handleHargaChange = (jenjang, index, val) => {
    const updated = { ...paketData };
    updated[jenjang][index].harga = Number(val) || 0;
    setPaketData(updated);
  };

  const handleNamaChange = (jenjang, index, val) => {
    const updated = { ...paketData };
    updated[jenjang][index].nama = val;
    setPaketData(updated);
  };

  const handleDescChange = (jenjang, index, val) => {
    const updated = { ...paketData };
    updated[jenjang][index].desc = val;
    setPaketData(updated);
  };

  const handleAddPaket = (jenjang) => {
    const updated = { ...paketData };
    updated[jenjang].push({ id: `${jenjang.toLowerCase()}_new_${Date.now()}`, nama: 'Paket Baru', harga: 0, desc: 'Deskripsi paket' });
    setPaketData(updated);
  };

  const handleDeletePaket = (jenjang, index) => {
    if (!window.confirm('Hapus paket ini?')) return;
    const updated = { ...paketData };
    updated[jenjang].splice(index, 1);
    setPaketData(updated);
  };

  const handleVAChange = (field, value) => setVaInfo(prev => ({ ...prev, [field]: value }));

  const handleSaveAll = async () => {
    setSaving(true);
    try {
      await setDoc(doc(db, "settings", "paket_bimbel"), paketData);
      await setDoc(doc(db, "settings", "virtual_account"), vaInfo);
      alert("✅ Semua data berhasil disimpan!");
    } catch (e) { alert("❌ Gagal: " + e.message); }
    setSaving(false);
  };

  const formatRp = (num) => 'Rp ' + (num || 0).toLocaleString('id-ID');

  if (loading) return (
    <div style={s.wrap}><SidebarAdmin /><div style={s.main(isMobile)}><div style={s.center}><div style={s.spin}></div><p>Memuat data...</p></div></div><style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style></div>
  );

  return (
    <div style={s.wrap}>
      <SidebarAdmin />
      <div style={s.main(isMobile)}>
        
        <div style={s.header}>
          <div style={s.headerL}>
            <button onClick={() => navigate('/admin/pendaftaran')} style={s.btnBack}><ArrowLeft size={14} /> Pendaftaran</button>
            <h2 style={s.title}><BookOpen size={22} /> Pengatur Harga Paket</h2>
          </div>
          <button onClick={handleSaveAll} disabled={saving} style={s.btnSave}>
            {saving ? <RefreshCw size={16} className="spin" /> : <Save size={16} />}
            {saving ? ' Menyimpan...' : ' Simpan Semua'}
          </button>
        </div>

        <div style={s.infoBox}>💡 Harga yang disimpan akan <strong>langsung tampil</strong> di halaman admin.</div>

        <div style={s.grid}>
          <div style={s.col}>
            {Object.keys(paketData).map(jenjang => (
              <div key={jenjang} style={s.card}>
                <div style={s.cardHead}>
                  <h3 style={s.cardTitle}>📚 Jenjang {jenjang}</h3>
                  <button onClick={() => handleAddPaket(jenjang)} style={s.btnAdd}><Plus size={14} /> Tambah</button>
                </div>
                <div style={s.paketList}>
                  {paketData[jenjang].length === 0 ? <p style={s.emptyText}>Belum ada paket.</p> :
                    paketData[jenjang].map((paket, idx) => (
                      <div key={paket.id} style={s.paketItem}>
                        <div style={s.paketInfo}>
                          <input type="text" value={paket.nama} onChange={e => handleNamaChange(jenjang, idx, e.target.value)} style={s.paketNama} placeholder="Nama paket" />
                          <input type="text" value={paket.desc} onChange={e => handleDescChange(jenjang, idx, e.target.value)} style={s.paketDesc} placeholder="Deskripsi" />
                        </div>
                        <div style={s.paketHarga}>
                          <span style={s.rpLabel}>Rp</span>
                          <input type="number" value={paket.harga} onChange={e => handleHargaChange(jenjang, idx, e.target.value)} style={s.hargaInput} />
                          <button onClick={() => handleDeletePaket(jenjang, idx)} style={s.btnDel}><Trash2 size={14} /></button>
                        </div>
                      </div>
                    ))
                  }
                </div>
              </div>
            ))}
          </div>

          <div style={s.col}>
            <div style={s.card}>
              <div style={s.cardHead}>
                <h3 style={s.cardTitle}>🏦 Virtual Account / Rekening</h3>
                <button onClick={() => setEditingVA(!editingVA)} style={s.btnEdit}>{editingVA ? <X size={14} /> : 'Edit'}</button>
              </div>
              {editingVA ? (
                <div style={s.vaForm}>
                  <div style={s.fg}><label style={s.lb}>Nama Bank</label><select value={vaInfo.bankName} onChange={e => handleVAChange('bankName', e.target.value)} style={s.inp}><option value="BCA">BCA</option><option value="BRI">BRI</option><option value="BNI">BNI</option><option value="Mandiri">Mandiri</option><option value="BSI">BSI</option></select></div>
                  <div style={s.fg}><label style={s.lb}>Nomor Rekening</label><input type="text" value={vaInfo.accountNumber} onChange={e => handleVAChange('accountNumber', e.target.value)} style={s.inp} /></div>
                  <div style={s.fg}><label style={s.lb}>Atas Nama</label><input type="text" value={vaInfo.accountHolder} onChange={e => handleVAChange('accountHolder', e.target.value)} style={s.inp} /></div>
                  <div style={s.fg}><label style={s.lb}>Instruksi Transfer</label><textarea value={vaInfo.instructions} onChange={e => handleVAChange('instructions', e.target.value)} style={{...s.inp, minHeight: 80, resize: 'vertical'}} rows={3} /></div>
                </div>
              ) : (
                <div style={s.vaPreview}>
                  <div style={s.vaBank}><strong>{vaInfo.bankName}</strong></div>
                  <div style={s.vaNumber}>{vaInfo.accountNumber}</div>
                  <div style={s.vaHolder}>a.n. {vaInfo.accountHolder}</div>
                  <div style={s.vaInst}>{vaInfo.instructions}</div>
                </div>
              )}
              <div style={s.vaInfo}>💳 Info ini digunakan di menu <strong>"Kirim Virtual"</strong> pada halaman Pendaftaran Online.</div>
            </div>

            <div style={s.card}>
              <div style={s.cardHead}><h3 style={s.cardTitle}>🔌 Integrasi Midtrans</h3></div>
              <div style={s.midInfo}>
                <p>📋 <strong>Status:</strong> <span style={{color:'#f59e0b',fontWeight:700}}>Demo / Development</span></p>
                <p>💳 Pembayaran virtual via Midtrans Snap sudah terpasang di API <code>/api/create-payment</code>.</p>
                <p>🔑 Untuk production, update Server Key & Client Key di file <code>.env</code>.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}.spin{animation:spin 1s linear infinite}`}</style>
    </div>
  );
};

const s = {
  wrap: { display:'flex', background:'#f8fafc', minHeight:'100vh' },
  main: (m) => ({ marginLeft: m?0:250, padding: m?15:30, width:'100%', boxSizing:'border-box', transition:'0.3s' }),
  center: { textAlign:'center', padding:80, color:'#94a3b8' },
  spin: { width:36, height:36, border:'3px solid #e2e8f0', borderTop:'3px solid #8b5cf6', borderRadius:'50%', animation:'spin 1s linear infinite', margin:'0 auto 12px' },
  header: { display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20, flexWrap:'wrap', gap:12, background:'white', padding:'16px 20px', borderRadius:16, border:'1px solid #f1f5f9', boxShadow:'0 2px 8px rgba(0,0,0,0.03)' },
  headerL: { display:'flex', alignItems:'center', gap:12 },
  btnBack: { background:'white', border:'1px solid #e2e8f0', padding:'8px 14px', borderRadius:8, cursor:'pointer', fontWeight:600, fontSize:13, display:'flex', alignItems:'center', gap:6, color:'#64748b' },
  title: { margin:0, fontSize:20, fontWeight:800, color:'#1e293b', display:'flex', alignItems:'center', gap:8 },
  btnSave: { padding:'10px 20px', background:'#10b981', color:'white', border:'none', borderRadius:10, cursor:'pointer', fontWeight:700, fontSize:13, display:'flex', alignItems:'center', gap:6, boxShadow:'0 4px 12px rgba(16,185,129,0.25)' },
  infoBox: { background:'#eef2ff', padding:'12px 16px', borderRadius:10, color:'#4338ca', fontSize:12, marginBottom:20, border:'1px solid #c7d2fe' },
  grid: { display:'grid', gridTemplateColumns:'1fr 380px', gap:20, alignItems:'start' },
  col: { display:'flex', flexDirection:'column', gap:16 },
  card: { background:'white', padding:20, borderRadius:14, border:'1px solid #f1f5f9', boxShadow:'0 2px 8px rgba(0,0,0,0.03)' },
  cardHead: { display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16, paddingBottom:12, borderBottom:'2px solid #f1f5f9' },
  cardTitle: { margin:0, fontSize:15, fontWeight:700, color:'#1e293b' },
  btnAdd: { padding:'6px 12px', borderRadius:8, background:'#3b82f6', color:'white', border:'none', cursor:'pointer', fontWeight:600, fontSize:11, display:'flex', alignItems:'center', gap:4 },
  btnEdit: { padding:'6px 12px', borderRadius:8, background:'#f1f5f9', color:'#64748b', border:'none', cursor:'pointer', fontWeight:600, fontSize:11 },
  paketList: { display:'flex', flexDirection:'column', gap:10 },
  emptyText: { textAlign:'center', color:'#94a3b8', fontSize:12, padding:20 },
  paketItem: { display:'flex', justifyContent:'space-between', alignItems:'center', gap:12, padding:12, background:'#f8fafc', borderRadius:10, border:'1px solid #e2e8f0', flexWrap:'wrap' },
  paketInfo: { flex:1, minWidth:150, display:'flex', flexDirection:'column', gap:4 },
  paketNama: { padding:'6px 8px', borderRadius:6, border:'1px solid #e2e8f0', fontSize:12, fontWeight:600, outline:'none', width:'100%', boxSizing:'border-box', background:'white' },
  paketDesc: { padding:'6px 8px', borderRadius:6, border:'1px solid #e2e8f0', fontSize:11, outline:'none', width:'100%', boxSizing:'border-box', background:'white', color:'#64748b' },
  paketHarga: { display:'flex', alignItems:'center', gap:6, flexShrink:0 },
  rpLabel: { fontWeight:700, color:'#64748b', fontSize:13 },
  hargaInput: { padding:'8px', border:'2px solid #3b82f6', borderRadius:8, width:130, fontSize:14, fontWeight:700, color:'#1e293b', outline:'none', textAlign:'right', background:'white' },
  btnDel: { padding:'6px', borderRadius:6, background:'#fee2e2', color:'#ef4444', border:'none', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' },
  vaForm: { display:'flex', flexDirection:'column', gap:12 },
  fg: { display:'flex', flexDirection:'column', gap:4 },
  lb: { fontSize:11, fontWeight:'bold', color:'#64748b' },
  inp: { padding:'10px', borderRadius:8, border:'1px solid #e2e8f0', fontSize:13, outline:'none', boxSizing:'border-box', background:'#f8fafc', fontFamily:'inherit' },
  vaPreview: { background:'linear-gradient(135deg, #1e293b, #334155)', padding:20, borderRadius:12, color:'white', textAlign:'center', marginBottom:12 },
  vaBank: { fontSize:11, opacity:0.7, marginBottom:4 },
  vaNumber: { fontSize:22, fontWeight:900, letterSpacing:3, fontFamily:'monospace', marginBottom:4 },
  vaHolder: { fontSize:12, opacity:0.8, marginBottom:8 },
  vaInst: { fontSize:10, opacity:0.6, fontStyle:'italic', lineHeight:1.4 },
  vaInfo: { background:'#fef3c7', padding:'10px 14px', borderRadius:8, fontSize:11, color:'#b45309', border:'1px solid #fde68a' },
  midInfo: { fontSize:12, color:'#475569', lineHeight:1.8 }
};

export default ManagePaketHarga;