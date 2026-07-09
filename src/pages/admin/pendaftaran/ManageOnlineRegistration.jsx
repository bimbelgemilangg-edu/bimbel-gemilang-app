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
  Home, ChevronRight, Eye, FileText, Save, Edit3
} from 'lucide-react';

const ManageOnlineRegistration = () => {
  const navigate = useNavigate();
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);
  
  // ===== TAB STATE =====
  const [activeTab, setActiveTab] = useState('pendaftaran'); // 'pendaftaran' | 'tatatertib'
  
  // ===== TATA TERTIB STATE =====
  const [tataTertib, setTataTertib] = useState('');
  const [loadingTT, setLoadingTT] = useState(false);
  const [savingTT, setSavingTT] = useState(false);
  const [editingTT, setEditingTT] = useState(false);

  const DEFAULT_TATA_TERTIB = `PERATURAN DAN TATA TERTIB BIMBEL GEMILANG

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

Dengan menandatangani formulir ini, Saya (Orang Tua/Wali) menyatakan SETUJU dan siap MEMATUHI seluruh peraturan yang telah ditetapkan oleh Bimbel Gemilang.`;

  // ============================================================
  // RESIZE HANDLER
  // ============================================================
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // ============================================================
  // REALTIME FIRESTORE LISTENER
  // ============================================================
  useEffect(() => {
    const q = query(
      collection(db, "online_registrations"),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setRegistrations(data);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching registrations:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // ============================================================
  // FETCH TATA TERTIB
  // ============================================================
  useEffect(() => {
    if (activeTab === 'tatatertib') {
      fetchTataTertib();
    }
  }, [activeTab]);

  const fetchTataTertib = async () => {
    setLoadingTT(true);
    try {
      const docRef = doc(db, "settings", "tata_tertib");
      const docSnap = await getDoc(docRef);
      if (docSnap.exists() && docSnap.data().konten) {
        setTataTertib(docSnap.data().konten);
      } else {
        setTataTertib(DEFAULT_TATA_TERTIB);
      }
    } catch (error) {
      console.error("Error fetching tata tertib:", error);
      setTataTertib(DEFAULT_TATA_TERTIB);
    }
    setLoadingTT(false);
  };

  const handleSaveTT = async () => {
    if (!tataTertib.trim()) {
      alert('⚠️ Konten tata tertib tidak boleh kosong!');
      return;
    }
    setSavingTT(true);
    try {
      await setDoc(doc(db, "settings", "tata_tertib"), {
        konten: tataTertib,
        updatedAt: new Date().toISOString()
      });
      setEditingTT(false);
      alert('✅ Tata tertib berhasil disimpan! Langsung tampil di formulir pendaftaran.');
    } catch (error) {
      alert('❌ Gagal menyimpan: ' + error.message);
    }
    setSavingTT(false);
  };

  // ============================================================
  // FUNGSI GENERATE USERNAME & PASSWORD
  // ============================================================
  const generateUsername = (namaLengkap) => {
    const base = namaLengkap.split(' ')[0].toLowerCase();
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    return `${base}${randomNum}`;
  };

  const generatePassword = () => {
    return String(Math.floor(100000 + Math.random() * 900000));
  };

  // ============================================================
  // HANDLE VERIFY & CREATE ACCOUNT
  // ============================================================
  const handleVerifyAndCreate = async (registration) => {
    if (!window.confirm(`Sahkan pendaftaran ${registration.namaLengkap} dan buat akun siswa?`)) return;

    setProcessingId(registration.id);

    try {
      await updateDoc(doc(db, "online_registrations", registration.id), {
        paymentStatus: 'success'
      });

      const username = generateUsername(registration.namaLengkap);
      const password = generatePassword();

      await addDoc(collection(db, "students"), {
        nama: registration.namaLengkap,
        kelasSekolah: registration.kelasSekolah,
        username: username,
        password: password,
        wa: registration.whatsappAktif,
        alamat: registration.alamatRumah,
        orangTua: registration.namaOrangTua,
        paket: registration.paketBimbelNama,
        paketId: registration.paketBimbelId,
        paketHarga: registration.paketBimbelHarga,
        createdAt: serverTimestamp()
      });

      alert(
        `✅ AKUN BERHASIL DIBUAT!\n\n` +
        `👤 Nama: ${registration.namaLengkap}\n` +
        `📧 Username: ${username}\n` +
        `🔑 Password: ${password}\n\n` +
        `📋 Salin data ini untuk dikirim ke orang tua siswa.`
      );

      setProcessingId(null);
    } catch (error) {
      console.error("Error:", error);
      alert(`❌ Gagal membuat akun: ${error.message}`);
      setProcessingId(null);
    }
  };

  // ============================================================
  // HANDLE DELETE
  // ============================================================
  const handleDelete = async (id, nama) => {
    if (!window.confirm(`Hapus pendaftaran ${nama}?`)) return;
    try {
      await deleteDoc(doc(db, "online_registrations", id));
      alert(`✅ Data ${nama} berhasil dihapus.`);
    } catch (error) {
      alert(`❌ Gagal menghapus: ${error.message}`);
    }
  };

  // ============================================================
  // FORMAT DATE
  // ============================================================
  const formatDate = (timestamp) => {
    if (!timestamp) return '-';
    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      return date.toLocaleDateString('id-ID', { 
        day: '2-digit', month: 'short', year: 'numeric',
        hour: '2-digit', minute: '2-digit'
      });
    } catch {
      return '-';
    }
  };

  // ============================================================
  // RENDER
  // ============================================================
  return (
    <div style={{ display: 'flex', background: '#f8fafc', minHeight: '100vh' }}>
      <SidebarAdmin />
      
      <div style={{ 
        marginLeft: isMobile ? 0 : 250, 
        padding: isMobile ? 15 : 30, 
        width: '100%', 
        boxSizing: 'border-box', 
        transition: '0.3s' 
      }}>
        
        {/* BREADCRUMB */}
        <div style={s.breadcrumb}>
          <button onClick={() => navigate('/admin/portal')} style={s.btnBack}>
            <ArrowLeft size={14} /> Portal
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
            <Home size={12} color="#94a3b8" />
            <ChevronRight size={12} color="#94a3b8" />
            <span style={{ color: '#94a3b8' }}>Admin</span>
            <ChevronRight size={12} color="#94a3b8" />
            <span style={{ fontWeight: 'bold', color: '#f59e0b' }}>Pendaftaran Online</span>
          </div>
        </div>

        {/* HEADER */}
        <div style={s.header(isMobile)}>
          <h2 style={s.pageTitle(isMobile)}>
            <UserPlus size={22} color="#f59e0b" /> Pendaftaran Online
          </h2>
          <span style={s.totalBadge}>
            Total: {registrations.length}
          </span>
        </div>

        {/* TABS */}
        <div style={s.tabs}>
          <button 
            onClick={() => setActiveTab('pendaftaran')} 
            style={s.tab(activeTab === 'pendaftaran')}
          >
            <Users size={14} /> Pendaftar ({registrations.length})
          </button>
          <button 
            onClick={() => setActiveTab('tatatertib')} 
            style={s.tab(activeTab === 'tatatertib')}
          >
            <FileText size={14} /> Tata Tertib
          </button>
          <button 
            onClick={() => navigate('/admin/pendaftaran/harga')} 
            style={s.tab(false)}
          >
            💰 Paket Harga
          </button>
        </div>

        {/* ============================================================ */}
        {/* TAB: PENDAFTARAN */}
        {/* ============================================================ */}
        {activeTab === 'pendaftaran' && (
          <>
            {loading ? (
              <div style={s.loadingState}>
                <div style={s.spinner}></div>
                <p>Memuat data...</p>
              </div>
            ) : registrations.length === 0 ? (
              <div style={s.emptyState}>
                <UserPlus size={48} />
                <p>Belum ada pendaftaran online.</p>
              </div>
            ) : (
              <div style={s.card}>
                <div style={{ overflowX: 'auto' }}>
                  <table style={s.table(isMobile)}>
                    <thead>
                      <tr style={s.thead}>
                        <th style={s.th}>Tanggal</th>
                        <th style={s.th}>Nama Murid</th>
                        <th style={s.th}>WhatsApp</th>
                        <th style={s.th}>Kelas</th>
                        <th style={s.th}>Paket</th>
                        <th style={s.th}>Harga</th>
                        <th style={s.th}>Status</th>
                        <th style={{...s.th, textAlign: 'center'}}>Aksi</th>
                      </tr>
                    </thead>
                    <tbody>
                      {registrations.map((reg) => {
                        const isPending = reg.paymentStatus === 'pending';
                        const isProcessing = processingId === reg.id;

                        return (
                          <tr key={reg.id} style={s.tr}>
                            <td style={s.td}>{formatDate(reg.createdAt)}</td>
                            <td style={{...s.td, fontWeight: 600, color: '#1e293b'}}>
                              {reg.namaLengkap || '-'}
                            </td>
                            <td style={s.td}>
                              <a href={`https://wa.me/${reg.whatsappAktif}`} target="_blank" rel="noopener noreferrer" style={s.waLink}>
                                <Phone size={12} /> {reg.whatsappAktif || '-'}
                              </a>
                            </td>
                            <td style={s.td}>
                              <span style={s.kelasBadge}>{reg.kelasSekolah || '-'}</span>
                            </td>
                            <td style={s.td}>{reg.paketBimbelNama || '-'}</td>
                            <td style={{...s.td, fontWeight: 700, color: '#1a237e'}}>
                              Rp {reg.paketBimbelHarga?.toLocaleString('id-ID') || '0'}
                            </td>
                            <td style={s.td}>
                              <span style={s.statusBadge(isPending)}>
                                {isPending ? '🟡 Belum Bayar' : '🟢 Lunas'}
                              </span>
                            </td>
                            <td style={{...s.td, textAlign: 'center'}}>
                              <div style={{ display: 'flex', gap: 4, justifyContent: 'center' }}>
                                {isPending && (
                                  <button onClick={() => handleVerifyAndCreate(reg)} disabled={isProcessing}
                                    style={{...s.btnAction, background: '#10b981', color: 'white', opacity: isProcessing ? 0.6 : 1 }}>
                                    <UserPlus size={12} /> {!isMobile && 'Sahkan'}
                                  </button>
                                )}
                                <button onClick={() => handleDelete(reg.id, reg.namaLengkap)}
                                  style={{...s.btnAction, background: '#fee2e2', color: '#ef4444' }}>
                                  <Trash2 size={12} />
                                </button>
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
          </>
        )}

        {/* ============================================================ */}
        {/* TAB: TATA TERTIB */}
        {/* ============================================================ */}
        {activeTab === 'tatatertib' && (
          <div style={s.card}>
            {loadingTT ? (
              <div style={s.loadingState}><div style={s.spinner}></div><p>Memuat tata tertib...</p></div>
            ) : (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                  <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#1e293b', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <FileText size={18} color="#8b5cf6" /> Peraturan & Tata Tertib
                  </h3>
                  {editingTT ? (
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button onClick={() => { setEditingTT(false); fetchTataTertib(); }} style={s.btnCancel}>Batal</button>
                      <button onClick={handleSaveTT} disabled={savingTT} style={s.btnSave}>
                        <Save size={14} /> {savingTT ? 'Menyimpan...' : 'Simpan'}
                      </button>
                    </div>
                  ) : (
                    <button onClick={() => setEditingTT(true)} style={s.btnEdit}>
                      <Edit3 size={14} /> Edit
                    </button>
                  )}
                </div>

                {editingTT ? (
                  <textarea
                    value={tataTertib}
                    onChange={(e) => setTataTertib(e.target.value)}
                    style={s.textarea}
                    placeholder="Tulis peraturan dan tata tertib di sini..."
                  />
                ) : (
                  <pre style={s.previewText}>{tataTertib}</pre>
                )}

                <div style={s.infoBox}>
                  <span>💡 Tata tertib ini tampil di <strong>Step 3</strong> formulir pendaftaran online (iPad/public). Calon siswa wajib menyetujui sebelum tanda tangan.</span>
                </div>
              </>
            )}
          </div>
        )}

        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    </div>
  );
};

// ============================================================
// STYLES
// ============================================================
const s = {
  breadcrumb: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 10 },
  btnBack: { background: 'white', border: '1px solid #e2e8f0', padding: '8px 14px', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: 13, display: 'flex', alignItems: 'center', gap: 6, color: '#64748b' },
  
  header: (m) => ({ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 10 }),
  pageTitle: (m) => ({ margin: 0, fontSize: m ? 18 : 22, fontWeight: 800, color: '#1e293b', display: 'flex', alignItems: 'center', gap: 8 }),
  totalBadge: { background: '#fef3c7', color: '#d97706', padding: '6px 14px', borderRadius: 20, fontSize: 13, fontWeight: 700 },
  
  // Tabs
  tabs: { display: 'flex', gap: 6, marginBottom: 20, flexWrap: 'wrap' },
  tab: (active) => ({ padding: '8px 16px', borderRadius: 10, border: 'none', fontWeight: 700, fontSize: 12, cursor: 'pointer', background: active ? '#f59e0b' : 'white', color: active ? 'white' : '#64748b', display: 'flex', alignItems: 'center', gap: 6, boxShadow: active ? '0 2px 8px rgba(245,158,11,0.2)' : '0 1px 3px rgba(0,0,0,0.04)', border: '1px solid #e2e8f0' }),
  
  // Table
  card: { background: 'white', borderRadius: 14, border: '1px solid #e2e8f0', overflow: 'hidden' },
  loadingState: { textAlign: 'center', padding: 60, color: '#94a3b8' },
  spinner: { width: 30, height: 30, border: '3px solid #e2e8f0', borderTop: '3px solid #f59e0b', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 12px' },
  emptyState: { textAlign: 'center', padding: 60, background: 'white', borderRadius: 14, border: '2px dashed #e2e8f0', color: '#94a3b8' },
  table: (m) => ({ width: '100%', borderCollapse: 'collapse', fontSize: m ? 11 : 13, minWidth: m ? '700px' : 'auto' }),
  thead: { background: '#f8fafc', borderBottom: '1px solid #e2e8f0' },
  th: { padding: '12px 14px', textAlign: 'left', color: '#64748b', fontWeight: 700, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.5px' },
  tr: { borderBottom: '1px solid #f1f5f9' },
  td: { padding: '12px 14px', color: '#334155', verticalAlign: 'middle', fontSize: 12 },
  waLink: { color: '#25D366', textDecoration: 'none', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 },
  kelasBadge: { padding: '2px 10px', borderRadius: 12, background: '#e0f2fe', color: '#0369a1', fontSize: 11, fontWeight: 600, display: 'inline-block' },
  statusBadge: (pending) => ({ padding: '3px 12px', borderRadius: 20, fontSize: 11, fontWeight: 700, background: pending ? '#fef3c7' : '#dcfce7', color: pending ? '#d97706' : '#16a34a', display: 'inline-block' }),
  btnAction: { border: 'none', padding: '6px 10px', borderRadius: 6, cursor: 'pointer', fontSize: 11, fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 4 },
  
  // Tata Tertib
  textarea: { width: '100%', minHeight: '400px', padding: 16, borderRadius: 10, border: '1px solid #e2e8f0', fontSize: 13, lineHeight: 1.8, fontFamily: 'inherit', resize: 'vertical', outline: 'none', boxSizing: 'border-box', background: '#fafbfc', color: '#1e293b' },
  previewText: { whiteSpace: 'pre-wrap', fontSize: 13, lineHeight: 1.8, color: '#334155', fontFamily: 'inherit', padding: 16, background: '#f8fafc', borderRadius: 10, border: '1px solid #e2e8f0', margin: 0, maxHeight: '500px', overflowY: 'auto' },
  btnEdit: { padding: '8px 16px', borderRadius: 8, background: '#fef3c7', color: '#b45309', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: 12, display: 'flex', alignItems: 'center', gap: 6 },
  btnCancel: { padding: '8px 16px', borderRadius: 8, background: '#f1f5f9', color: '#64748b', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: 12 },
  btnSave: { padding: '8px 18px', borderRadius: 8, background: '#10b981', color: 'white', border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: 12, display: 'flex', alignItems: 'center', gap: 6 },
  infoBox: { marginTop: 16, padding: '12px 16px', borderRadius: 10, background: '#eef2ff', color: '#4338ca', fontSize: 12, lineHeight: 1.6 }
};

export default ManageOnlineRegistration;