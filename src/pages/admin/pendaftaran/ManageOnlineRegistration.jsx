// src/pages/admin/pendaftaran/ManageOnlineRegistration.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import SidebarAdmin from '../../../components/SidebarAdmin';
import { db } from '../../../firebase';
import { 
  collection, query, orderBy, onSnapshot, 
  doc, updateDoc, deleteDoc, addDoc, serverTimestamp, getDoc, setDoc
} from "firebase/firestore";
import { 
  Users, Trash2, UserPlus, Phone, ArrowLeft,
  Home, ChevronRight, FileText, Save, Edit3, Eye,
  Wallet, X, Send, DollarSign
} from 'lucide-react';

const ManageOnlineRegistration = () => {
  const navigate = useNavigate();
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Tabs
  const [activeTab, setActiveTab] = useState('pendaftaran');
  
  // Tata Tertib
  const [tataTertib, setTataTertib] = useState('');
  const [loadingTT, setLoadingTT] = useState(false);
  const [savingTT, setSavingTT] = useState(false);
  const [editingTT, setEditingTT] = useState(false);

  // Modals
  const [showBayarModal, setShowBayarModal] = useState(false);
  const [showVirtualModal, setShowVirtualModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedReg, setSelectedReg] = useState(null);
  
  // Pembayaran
  const [payNominal, setPayNominal] = useState('');
  const [payMethod, setPayMethod] = useState('Tunai');
  const [payNote, setPayNote] = useState('');
  const [processingId, setProcessingId] = useState(null);
  const [virtualLoading, setVirtualLoading] = useState(false);

  const DEFAULT_TATA_TERTIB = `PERATURAN DAN TATA TERTIB BIMBEL GEMILANG

1. KEHADIRAN
   • Siswa wajib hadir tepat waktu sesuai jadwal.
   • Keterlambatan maksimal 15 menit.
   • Jika tidak hadir, orang tua WAJIB menginformasikan.

2. PAKAIAN & SIKAP
   • Berpakaian sopan dan rapi.
   • Tidak berkata kasar atau membully.

3. PEMBAYARAN
   • Pembayaran dilakukan di awal bulan/minggu.
   • Keterlambatan dikenakan denda.

4. FASILITAS
   • Menjaga kebersihan ruang belajar.

5. SANKSI
   • Pelanggaran ringan: teguran lisan.
   • Pelanggaran berat: dikeluarkan.

Dengan menandatangani formulir ini, Saya menyatakan SETUJU dan siap MEMATUHI seluruh peraturan Bimbel Gemilang.`;

  // ============================================================
  // EFFECTS
  // ============================================================
  useEffect(() => {
    const h = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', h);
    return () => window.removeEventListener('resize', h);
  }, []);

  useEffect(() => {
    const q = query(collection(db, "online_registrations"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      setRegistrations(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    }, (err) => { console.error(err); setLoading(false); });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (activeTab === 'tatatertib') fetchTataTertib();
  }, [activeTab]);

  // ============================================================
  // TATA TERTIB
  // ============================================================
  const fetchTataTertib = async () => {
    setLoadingTT(true);
    try {
      const snap = await getDoc(doc(db, "settings", "tata_tertib"));
      setTataTertib(snap.exists() && snap.data().konten ? snap.data().konten : DEFAULT_TATA_TERTIB);
    } catch (e) { setTataTertib(DEFAULT_TATA_TERTIB); }
    setLoadingTT(false);
  };

  const handleSaveTT = async () => {
    if (!tataTertib.trim()) return alert('⚠️ Konten tidak boleh kosong!');
    setSavingTT(true);
    try {
      await setDoc(doc(db, "settings", "tata_tertib"), { konten: tataTertib, updatedAt: new Date().toISOString() });
      setEditingTT(false);
      alert('✅ Tata tertib tersimpan! Langsung tampil di formulir.');
    } catch (e) { alert('❌ Gagal: ' + e.message); }
    setSavingTT(false);
  };

  // ============================================================
  // HELPER
  // ============================================================
  const formatRupiah = (n) => 'Rp ' + (n || 0).toLocaleString('id-ID');
  
  const formatDate = (ts) => {
    if (!ts) return '-';
    try { return (ts.toDate ? ts.toDate() : new Date(ts)).toLocaleDateString('id-ID', { day:'2-digit', month:'short', hour:'2-digit', minute:'2-digit' }); }
    catch { return '-'; }
  };

  const generateUsername = (nama) => {
    const base = nama.split(' ')[0].toLowerCase().replace(/[^a-z0-9]/g, '');
    return `${base}${Math.floor(1000 + Math.random() * 9000)}`;
  };

  const getSisaTagihan = (reg) => Math.max(0, (reg.paketBimbelHarga || 0) - (reg.totalPaid || 0));

  const getStatusBadge = (reg) => {
    if (reg.status === 'active') return { label: '✅ Aktif', bg: '#dcfce7', color: '#166534' };
    if (getSisaTagihan(reg) <= 0) return { label: '💰 Lunas', bg: '#dcfce7', color: '#166534' };
    if ((reg.totalPaid || 0) > 0) return { label: '💵 DP', bg: '#fef3c7', color: '#b45309' };
    return { label: '🟡 Pending', bg: '#fff7ed', color: '#c2410c' };
  };

  // ============================================================
  // MODAL HANDLERS
  // ============================================================
  const openBayarModal = (reg) => {
    setSelectedReg(reg);
    setPayNominal(getSisaTagihan(reg) || reg.paketBimbelHarga);
    setPayMethod('Tunai');
    setPayNote('');
    setShowBayarModal(true);
  };

  const openVirtualModal = (reg) => {
    setSelectedReg(reg);
    setPayNominal(getSisaTagihan(reg) || reg.paketBimbelHarga);
    setPayNote('');
    setShowVirtualModal(true);
  };

  const openDetailModal = (reg) => {
    setSelectedReg(reg);
    setShowDetailModal(true);
  };

  // ============================================================
  // CATAT PEMBAYARAN
  // ============================================================
  const handleCatatBayar = async (e) => {
    e.preventDefault();
    const nominal = parseInt(payNominal);
    if (!nominal || nominal <= 0) return alert('⚠️ Nominal tidak valid!');
    
    setProcessingId(selectedReg.id);
    try {
      const today = new Date().toISOString().split('T')[0];
      
      await addDoc(collection(db, "finance_logs"), {
        studentId: selectedReg.id,
        namaSiswa: selectedReg.namaLengkap,
        date: today,
        type: 'Pemasukan',
        category: 'Pendaftaran Online',
        amount: nominal,
        method: payMethod,
        note: payNote || `Pembayaran ${payMethod}: ${selectedReg.namaLengkap}`,
        createdAt: serverTimestamp()
      });

      await updateDoc(doc(db, "online_registrations", selectedReg.id), {
        totalPaid: (selectedReg.totalPaid || 0) + nominal,
        lastPaymentDate: today,
        lastPaymentMethod: payMethod,
        lastPaymentNote: payNote || ''
      });

      alert(`✅ Pembayaran ${formatRupiah(nominal)} tercatat!`);
      setShowBayarModal(false);
    } catch (e) { alert('❌ Gagal: ' + e.message); }
    setProcessingId(null);
  };

  // ============================================================
  // KIRIM VIRTUAL (MIDTRANS)
  // ============================================================
  const handleKirimVirtual = async (e) => {
    e.preventDefault();
    const nominal = parseInt(payNominal);
    if (!nominal || nominal <= 0) return alert('⚠️ Nominal tidak valid!');
    
    setVirtualLoading(true);
    try {
      const response = await fetch('/api/create-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: selectedReg.id,
          grossAmount: nominal,
          customerName: selectedReg.namaLengkap,
          customerPhone: selectedReg.whatsappAktif,
          paketNama: selectedReg.paketBimbelNama,
          note: payNote || `Pembayaran ${selectedReg.paketBimbelNama}`
        })
      });

      const data = await response.json();

      if (data.success && data.redirect_url) {
        await updateDoc(doc(db, "online_registrations", selectedReg.id), {
          paymentLink: data.redirect_url,
          paymentLinkCreated: new Date().toISOString(),
          paymentLinkAmount: nominal
        });

        window.open(data.redirect_url, '_blank');
        setShowVirtualModal(false);
        alert('🔗 Link pembayaran dibuat! Buka tab baru atau kirim ke WhatsApp siswa.');
      } else {
        alert('❌ Gagal: ' + (data.error || 'Unknown error'));
      }
    } catch (e) { alert('❌ Gagal: ' + e.message); }
    setVirtualLoading(false);
  };

  // ============================================================
  // SAHKAN AKUN
  // ============================================================
  const handleSahkan = async (reg) => {
    if ((reg.totalPaid || 0) <= 0) return alert('⚠️ Belum ada pembayaran!');
    if (!window.confirm(`Sahkan ${reg.namaLengkap}? Akun siswa akan dibuat.`)) return;

    setProcessingId(reg.id);
    try {
      const username = generateUsername(reg.namaLengkap);
      const password = String(Math.floor(100000 + Math.random() * 900000));

      const studentRef = await addDoc(collection(db, "students"), {
        nama: reg.namaLengkap,
        kelasSekolah: reg.kelasSekolah,
        username, password,
        wa: reg.whatsappAktif,
        alamat: reg.alamatRumah,
        orangTua: reg.namaOrangTua,
        paket: reg.paketBimbelNama,
        paketId: reg.paketBimbelId,
        paketHarga: reg.paketBimbelHarga,
        totalTagihan: reg.paketBimbelHarga,
        totalBayar: reg.totalPaid || 0,
        status: 'Aktif',
        isBlocked: false,
        tataTertibDisetujui: true,
        tandaTangan: reg.tandaTangan || null,
        createdAt: serverTimestamp()
      });

      await updateDoc(doc(db, "online_registrations", reg.id), {
        status: 'active',
        studentId: studentRef.id,
        username, password,
        activatedAt: new Date().toISOString()
      });

      alert(`✅ AKUN BERHASIL DIBUAT!\n\n👤 ${reg.namaLengkap}\n📧 Username: ${username}\n🔑 Password: ${password}`);
    } catch (e) { alert('❌ Gagal: ' + e.message); }
    setProcessingId(null);
  };

  // ============================================================
  // HAPUS
  // ============================================================
  const handleDelete = async (id, nama) => {
    if (!window.confirm(`Hapus ${nama}?`)) return;
    try { await deleteDoc(doc(db, "online_registrations", id)); }
    catch (e) { alert('❌ Gagal: ' + e.message); }
  };

  // ============================================================
  // RENDER
  // ============================================================
  return (
    <div style={s.wrap}>
      <SidebarAdmin />
      <div style={s.main(isMobile)}>
        
        {/* Breadcrumb */}
        <div style={s.bread}>
          <button onClick={() => navigate('/admin/portal')} style={s.btnBack}><ArrowLeft size={14} /> Portal</button>
          <div style={s.breadR}><Home size={12} color="#94a3b8" /><ChevronRight size={12} color="#94a3b8" /><span style={{fontWeight:'bold',color:'#f59e0b'}}>Pendaftaran Online</span></div>
        </div>

        {/* Header */}
        <div style={s.header}>
          <h2 style={s.title}><UserPlus size={22} color="#f59e0b" /> Pendaftaran Online</h2>
          <span style={s.count}>{registrations.length} pendaftar</span>
        </div>

        {/* Tabs */}
        <div style={s.tabs}>
          <button onClick={() => setActiveTab('pendaftaran')} style={s.tab(activeTab==='pendaftaran')}><Users size={14} /> Pendaftar</button>
          <button onClick={() => setActiveTab('tatatertib')} style={s.tab(activeTab==='tatatertib')}><FileText size={14} /> Tata Tertib</button>
          <button onClick={() => navigate('/admin/pendaftaran/harga')} style={s.tab(false)}>💰 Paket Harga</button>
        </div>

        {/* TAB: PENDAFTARAN */}
        {activeTab === 'pendaftaran' && (
          loading ? <div style={s.center}><div style={s.spin}></div><p>Memuat...</p></div> :
          registrations.length === 0 ? <div style={s.empty}><UserPlus size={48} /><p>Belum ada pendaftaran.</p></div> :
          <div style={s.card}>
            <div style={{overflowX:'auto'}}>
              <table style={s.tbl}>
                <thead><tr style={s.thr}>
                  <th style={s.th}>Tgl</th><th style={s.th}>Nama</th><th style={s.th}>WA</th>
                  <th style={s.th}>Kelas</th><th style={s.th}>Paket</th><th style={s.th}>Harga</th>
                  <th style={s.th}>Bayar</th><th style={s.th}>Status</th><th style={s.th}>Aksi</th>
                </tr></thead>
                <tbody>
                  {registrations.map(reg => {
                    const paid = reg.totalPaid || 0;
                    const total = reg.paketBimbelHarga || 0;
                    const sisa = getSisaTagihan(reg);
                    const isLunas = sisa <= 0;
                    const isActive = reg.status === 'active';
                    const st = getStatusBadge(reg);
                    const isProc = processingId === reg.id;

                    return (
                      <tr key={reg.id} style={s.tr}>
                        <td style={s.td}>{formatDate(reg.createdAt)}</td>
                        <td style={{...s.td,fontWeight:600}}>
                          <button onClick={() => openDetailModal(reg)} style={s.nameBtn}>{reg.namaLengkap}</button>
                        </td>
                        <td style={s.td}><a href={`https://wa.me/${reg.whatsappAktif}`} target="_blank" rel="noreferrer" style={s.wa}>{reg.whatsappAktif}</a></td>
                        <td style={s.td}><span style={s.badge2}>{reg.kelasSekolah}</span></td>
                        <td style={s.td}>{reg.paketBimbelNama}</td>
                        <td style={{...s.td,fontWeight:700}}>{formatRupiah(total)}</td>
                        <td style={s.td}>
                          <span style={{color:'#10b981',fontWeight:700}}>{formatRupiah(paid)}</span>
                          {!isLunas && <span style={{color:'#ef4444',fontSize:10}}> / {formatRupiah(total)}</span>}
                        </td>
                        <td style={s.td}><span style={{...s.statBadge,background:st.bg,color:st.color}}>{st.label}</span></td>
                        <td style={{...s.td,textAlign:'center'}}>
                          <div style={s.acts}>
                            {!isActive && !isLunas && (
                              <>
                                <button onClick={() => openVirtualModal(reg)} style={s.btn('virtual')} title="Kirim Virtual"><Send size={12} /></button>
                                <button onClick={() => openBayarModal(reg)} style={s.btn('bayar')} title="Catat Bayar"><Wallet size={12} /></button>
                              </>
                            )}
                            {!isActive && (
                              <button onClick={() => handleSahkan(reg)} disabled={paid<=0||isProc} style={s.btn('sahkan', paid<=0||isProc)}>
                                <UserPlus size={12} /> {!isMobile && 'Sahkan'}
                              </button>
                            )}
                            {isActive && <span style={{fontSize:10,color:'#10b981'}}>✅ Aktif</span>}
                            <button onClick={() => handleDelete(reg.id, reg.namaLengkap)} style={s.btn('hapus')}><Trash2 size={12} /></button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB: TATA TERTIB */}
        {activeTab === 'tatatertib' && (
          <div style={s.card}>
            {loadingTT ? <div style={s.center}><div style={s.spin}></div></div> : (
              <>
                <div style={s.ttHead}>
                  <h3><FileText size={18} color="#8b5cf6" /> Peraturan & Tata Tertib</h3>
                  {editingTT ? (
                    <div style={{display:'flex',gap:8}}>
                      <button onClick={() => { setEditingTT(false); fetchTataTertib(); }} style={s.btnC}>Batal</button>
                      <button onClick={handleSaveTT} disabled={savingTT} style={s.btnS}><Save size={14} /> {savingTT?'...':'Simpan'}</button>
                    </div>
                  ) : <button onClick={() => setEditingTT(true)} style={s.btnE}><Edit3 size={14} /> Edit</button>}
                </div>
                {editingTT ? (
                  <textarea value={tataTertib} onChange={e => setTataTertib(e.target.value)} style={s.ttIn} />
                ) : (
                  <pre style={s.ttPrev}>{tataTertib}</pre>
                )}
                <div style={s.inf}>💡 Tata tertib ini tampil di <strong>Step 3</strong> formulir iPad. Calon siswa wajib menyetujui sebelum TTD.</div>
              </>
            )}
          </div>
        )}

      </div>

      {/* MODAL: CATAT BAYAR */}
      {showBayarModal && selectedReg && (
        <div style={s.ov} onClick={() => setShowBayarModal(false)}>
          <div style={s.mod(isMobile)} onClick={e => e.stopPropagation()}>
            <div style={s.mh}><h3><Wallet size={18} /> Catat Pembayaran</h3><button onClick={() => setShowBayarModal(false)} style={s.xb}><X size={18} /></button></div>
            <div style={s.mb}>
              <div style={s.mi}><span>Siswa</span><strong>{selectedReg.namaLengkap}</strong></div>
              <div style={s.mi}><span>Paket</span><strong>{selectedReg.paketBimbelNama} ({formatRupiah(selectedReg.paketBimbelHarga)})</strong></div>
              <div style={s.mi}><span>Sudah Bayar</span><strong style={{color:'#10b981'}}>{formatRupiah(selectedReg.totalPaid||0)}</strong></div>
              <div style={s.mi}><span>Sisa</span><strong style={{color:'#ef4444'}}>{formatRupiah(getSisaTagihan(selectedReg))}</strong></div>
              <form onSubmit={handleCatatBayar}>
                <div style={s.fg}><label style={s.lb}>Nominal (Rp)</label><input type="number" value={payNominal} onChange={e=>setPayNominal(e.target.value)} style={s.inp} required autoFocus /></div>
                <div style={s.fg}><label style={s.lb}>Metode</label><select value={payMethod} onChange={e=>setPayMethod(e.target.value)} style={s.inp}><option value="Tunai">💵 Tunai</option><option value="Transfer">💳 Transfer</option></select></div>
                <div style={s.fg}><label style={s.lb}>Catatan</label><input value={payNote} onChange={e=>setPayNote(e.target.value)} style={s.inp} placeholder="Opsional" /></div>
                <div style={s.mf}>
                  <button type="button" onClick={()=>setShowBayarModal(false)} style={s.btnC}>Batal</button>
                  <button type="submit" disabled={!!processingId} style={s.btnS}>{processingId?'⏳':'💾 Catat'}</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: KIRIM VIRTUAL */}
      {showVirtualModal && selectedReg && (
        <div style={s.ov} onClick={() => setShowVirtualModal(false)}>
          <div style={s.mod(isMobile)} onClick={e => e.stopPropagation()}>
            <div style={s.mh}><h3><Send size={18} /> Kirim Pembayaran Virtual</h3><button onClick={() => setShowVirtualModal(false)} style={s.xb}><X size={18} /></button></div>
            <div style={s.mb}>
              <div style={s.mi}><span>Siswa</span><strong>{selectedReg.namaLengkap}</strong></div>
              <div style={s.mi}><span>Paket</span><strong>{selectedReg.paketBimbelNama} ({formatRupiah(selectedReg.paketBimbelHarga)})</strong></div>
              <div style={s.mi}><span>Sisa Tagihan</span><strong style={{color:'#ef4444'}}>{formatRupiah(getSisaTagihan(selectedReg))}</strong></div>
              <form onSubmit={handleKirimVirtual}>
                <div style={s.fg}><label style={s.lb}>Nominal Tagihan (Rp)</label><input type="number" value={payNominal} onChange={e=>setPayNominal(e.target.value)} style={s.inp} required /></div>
                <div style={s.fg}><label style={s.lb}>Keterangan</label><input value={payNote} onChange={e=>setPayNote(e.target.value)} style={s.inp} placeholder="Misal: DP Pendaftaran" /></div>
                <div style={{...s.inf,background:'#eef2ff',color:'#4338ca',marginBottom:10}}>💳 Link Midtrans dibuat sesuai nominal. Siswa bisa bayar via Gopay, OVO, Transfer Bank, dll.</div>
                <div style={s.mf}>
                  <button type="button" onClick={()=>setShowVirtualModal(false)} style={s.btnC}>Batal</button>
                  <button type="submit" disabled={virtualLoading} style={{...s.btnS,background:'#6366f1'}}>{virtualLoading?'⏳':<><Send size={14} /> Kirim Virtual</>}</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: DETAIL */}
      {showDetailModal && selectedReg && (
        <div style={s.ov} onClick={() => setShowDetailModal(false)}>
          <div style={{...s.mod(isMobile),maxWidth:450}} onClick={e => e.stopPropagation()}>
            <div style={s.mh}><h3><Eye size={18} /> Detail Pendaftar</h3><button onClick={() => setShowDetailModal(false)} style={s.xb}><X size={18} /></button></div>
            <div style={s.mb}>
              <div style={s.dr}><span>Nama</span><strong>{selectedReg.namaLengkap}</strong></div>
              <div style={s.dr}><span>WhatsApp</span><strong>{selectedReg.whatsappAktif}</strong></div>
              <div style={s.dr}><span>Kelas</span><strong>{selectedReg.kelasSekolah}</strong></div>
              <div style={s.dr}><span>Orang Tua</span><strong>{selectedReg.namaOrangTua}</strong></div>
              <div style={s.dr}><span>Alamat</span><strong>{selectedReg.alamatRumah}</strong></div>
              <div style={s.dr}><span>Paket</span><strong>{selectedReg.paketBimbelNama}</strong></div>
              <div style={s.dr}><span>Total Tagihan</span><strong>{formatRupiah(selectedReg.paketBimbelHarga)}</strong></div>
              <div style={s.dr}><span>Total Bayar</span><strong style={{color:'#10b981'}}>{formatRupiah(selectedReg.totalPaid||0)}</strong></div>
              <div style={s.dr}><span>Status</span><strong>{getStatusBadge(selectedReg).label}</strong></div>
              {selectedReg.tandaTangan && (
                <div style={{marginTop:12}}>
                  <span style={{fontSize:11,color:'#64748b'}}>✍️ Tanda Tangan:</span>
                  <img src={selectedReg.tandaTangan} alt="TTD" style={{width:'100%',maxHeight:120,borderRadius:8,border:'1px solid #e2e8f0',marginTop:4}} />
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <style>{`@keyframes spin{to{transform:rotate(360deg)}}@keyframes slideUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}`}</style>
    </div>
  );
};

// ============================================================
// STYLES
// ============================================================
const s = {
  wrap: { display:'flex', background:'#f8fafc', minHeight:'100vh' },
  main: (m) => ({ marginLeft: m?0:250, padding: m?15:30, width:'100%', boxSizing:'border-box', transition:'0.3s' }),
  
  bread: { display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:20,flexWrap:'wrap',gap:10 },
  btnBack: { background:'white',border:'1px solid #e2e8f0',padding:'8px 14px',borderRadius:8,cursor:'pointer',fontWeight:600,fontSize:13,display:'flex',alignItems:'center',gap:6,color:'#64748b' },
  breadR: { display:'flex',alignItems:'center',gap:6,fontSize:12 },
  
  header: { display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:20,flexWrap:'wrap',gap:10 },
  title: { margin:0,fontSize:22,fontWeight:800,color:'#1e293b',display:'flex',alignItems:'center',gap:8 },
  count: { background:'#fef3c7',color:'#d97706',padding:'6px 14px',borderRadius:20,fontSize:13,fontWeight:700 },
  
  tabs: { display:'flex',gap:6,marginBottom:20,flexWrap:'wrap' },
  tab: (act) => ({ padding:'8px 16px',borderRadius:10,border:'1px solid #e2e8f0',fontWeight:700,fontSize:12,cursor:'pointer',background:act?'#f59e0b':'white',color:act?'white':'#64748b',display:'flex',alignItems:'center',gap:6 }),
  
  card: { background:'white',borderRadius:14,border:'1px solid #e2e8f0',overflow:'hidden' },
  center: { textAlign:'center',padding:60,color:'#94a3b8' },
  spin: { width:30,height:30,border:'3px solid #e2e8f0',borderTop:'3px solid #f59e0b',borderRadius:'50%',animation:'spin 1s linear infinite',margin:'0 auto 12px' },
  empty: { textAlign:'center',padding:60,background:'white',borderRadius:14,border:'2px dashed #e2e8f0',color:'#94a3b8' },
  
  tbl: { width:'100%',borderCollapse:'collapse',fontSize:12,minWidth:900 },
  thr: { background:'#f8fafc',borderBottom:'1px solid #e2e8f0' },
  th: { padding:'10px 12px',textAlign:'left',color:'#64748b',fontWeight:700,fontSize:10,textTransform:'uppercase' },
  tr: { borderBottom:'1px solid #f1f5f9' },
  td: { padding:'10px 12px',color:'#334155',verticalAlign:'middle' },
  nameBtn: { background:'none',border:'none',color:'#1e293b',cursor:'pointer',fontWeight:600,fontSize:12,padding:0,textDecoration:'underline' },
  wa: { color:'#25D366',textDecoration:'none',fontWeight:600,display:'flex',alignItems:'center',gap:4 },
  badge2: { padding:'2px 8px',borderRadius:10,background:'#e0f2fe',color:'#0369a1',fontSize:10,fontWeight:600 },
  statBadge: { padding:'2px 8px',borderRadius:10,fontSize:10,fontWeight:700,display:'inline-block' },
  
  acts: { display:'flex',gap:4,flexWrap:'wrap',alignItems:'center',justifyContent:'center' },
  btn: (type, disabled) => ({
    border:'none',padding:'5px 8px',borderRadius:6,cursor: disabled?'not-allowed':'pointer',fontSize:10,fontWeight:600,
    display:'inline-flex',alignItems:'center',gap:3,opacity:disabled?0.5:1,
    background: type==='virtual'?'#6366f1':type==='bayar'?'#f59e0b':type==='sahkan'?'#10b981':'#fee2e2',
    color: type==='hapus'?'#ef4444':'white'
  }),
  
  // Tata Tertib
  ttHead: { display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16,padding:16,borderBottom:'1px solid #f1f5f9' },
  btnE: { padding:'8px 16px',borderRadius:8,background:'#fef3c7',color:'#b45309',border:'none',cursor:'pointer',fontWeight:600,fontSize:12,display:'flex',alignItems:'center',gap:6 },
  btnC: { padding:'10px 16px',borderRadius:8,background:'#f1f5f9',color:'#64748b',border:'none',cursor:'pointer',fontWeight:600,fontSize:12 },
  btnS: { padding:'10px 20px',borderRadius:8,background:'#10b981',color:'white',border:'none',cursor:'pointer',fontWeight:700,fontSize:12,display:'flex',alignItems:'center',gap:6 },
  ttIn: { width:'100%',minHeight:400,padding:16,borderRadius:10,border:'1px solid #e2e8f0',fontSize:13,lineHeight:1.8,resize:'vertical',outline:'none',boxSizing:'border-box',fontFamily:'inherit' },
  ttPrev: { whiteSpace:'pre-wrap',fontSize:13,lineHeight:1.8,color:'#334155',padding:16,background:'#f8fafc',borderRadius:10,border:'1px solid #e2e8f0',margin:0,maxHeight:500,overflowY:'auto' },
  inf: { marginTop:16,padding:'12px 16px',borderRadius:10,background:'#eef2ff',color:'#4338ca',fontSize:12,lineHeight:1.6 },
  
  // Modal
  ov: { position:'fixed',inset:0,background:'rgba(0,0,0,0.5)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:9999,padding:20 },
  mod: (m) => ({ background:'white',borderRadius:16,padding:24,width:m?'95%':'420px',maxHeight:'90vh',overflowY:'auto',animation:'slideUp 0.3s ease',boxShadow:'0 20px 40px rgba(0,0,0,0.2)' }),
  mh: { display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16,paddingBottom:12,borderBottom:'1px solid #f1f5f9' },
  xb: { background:'#f1f5f9',border:'none',width:32,height:32,borderRadius:'50%',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',color:'#64748b' },
  mb: {},
  mi: { display:'flex',justifyContent:'space-between',padding:'8px 12px',background:'#f8fafc',borderRadius:8,marginBottom:8,fontSize:12 },
  fg: { marginBottom:12 },
  lb: { display:'block',fontSize:11,fontWeight:'bold',color:'#64748b',marginBottom:4 },
  inp: { width:'100%',padding:'10px',borderRadius:8,border:'1px solid #e2e8f0',fontSize:13,boxSizing:'border-box',background:'#f8fafc' },
  mf: { display:'flex',gap:10,marginTop:16,paddingTop:12,borderTop:'1px solid #f1f5f9' },
  dr: { display:'flex',justifyContent:'space-between',padding:'6px 0',borderBottom:'1px solid #f1f5f9',fontSize:12 }
};

export default ManageOnlineRegistration;