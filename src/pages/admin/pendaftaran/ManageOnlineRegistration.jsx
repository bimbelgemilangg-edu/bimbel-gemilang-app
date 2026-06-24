// src/pages/admin/portal-siswa/ManageOnlineRegistration.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import SidebarAdmin from '../../../components/SidebarAdmin';
import { db } from '../../../firebase';
import { 
  collection, query, orderBy, onSnapshot, 
  doc, updateDoc, deleteDoc, addDoc, serverTimestamp 
} from "firebase/firestore";
import { 
  Users, RefreshCw, CheckCircle, X, Trash2, UserPlus,
  Calendar, Phone, BookOpen, CreditCard, ArrowLeft,
  Home, ChevronRight
} from 'lucide-react';

const ManageOnlineRegistration = () => {
  const navigate = useNavigate();
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);

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
      // 1. UPDATE paymentStatus menjadi "success"
      await updateDoc(doc(db, "online_registrations", registration.id), {
        paymentStatus: 'success'
      });

      // 2. GENERATE username & password
      const username = generateUsername(registration.namaLengkap);
      const password = generatePassword();

      // 3. BUAT AKUN SISWA di koleksi "students"
      await addDoc(collection(db, "students"), {
        nama: registration.namaLengkap,
        kelasSekolah: registration.kelasSekolah,
        username: username,
        password: password,
        wa: registration.whatsappAktif,
        alamat: registration.alamatRumah,
        orangTua: registration.namaOrangTua,
        paket: registration.paketBimbel,
        createdAt: serverTimestamp()
      });

      // 4. ALERT SUKSES dengan data login
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
        day: '2-digit', 
        month: 'short', 
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
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
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          marginBottom: 20, 
          flexWrap: 'wrap', 
          gap: 10 
        }}>
          <button 
            onClick={() => navigate('/admin/portal-siswa')} 
            style={s.btnBack}
          >
            <ArrowLeft size={14} /> Portal
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
            <Home size={12} color="#94a3b8" />
            <ChevronRight size={12} color="#94a3b8" />
            <span style={{ color: '#94a3b8' }}>Portal</span>
            <ChevronRight size={12} color="#94a3b8" />
            <span style={{ fontWeight: 'bold', color: '#3b82f6' }}>Pendaftaran Online</span>
          </div>
        </div>

        {/* HEADER */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          marginBottom: 25, 
          flexWrap: 'wrap', 
          gap: 10 
        }}>
          <h2 style={{ 
            margin: 0, 
            fontSize: isMobile ? 18 : 22, 
            fontWeight: 800, 
            color: '#1e293b',
            display: 'flex',
            alignItems: 'center',
            gap: 8
          }}>
            <Users size={22} /> Pendaftaran Online
          </h2>
          <span style={{
            background: '#e0e7ff',
            color: '#4338ca',
            padding: '6px 14px',
            borderRadius: 20,
            fontSize: '13px',
            fontWeight: 700
          }}>
            Total: {registrations.length}
          </span>
        </div>

        {/* LOADING */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: 60 }}>
            <div style={{ 
              width: 30, 
              height: 30, 
              border: '3px solid #e2e8f0', 
              borderTop: '3px solid #3b82f6', 
              borderRadius: '50%', 
              animation: 'spin 1s linear infinite', 
              margin: '0 auto 12px' 
            }} />
            <p style={{ color: '#94a3b8', fontSize: 13 }}>Memuat data...</p>
          </div>
        ) : registrations.length === 0 ? (
          <div style={{ 
            textAlign: 'center', 
            padding: 60, 
            background: 'white', 
            borderRadius: 14, 
            border: '2px dashed #e2e8f0', 
            color: '#94a3b8' 
          }}>
            <Users size={48} />
            <p style={{ marginTop: 12 }}>Belum ada pendaftaran online.</p>
          </div>
        ) : (
          <div style={{ 
            background: 'white', 
            borderRadius: 14, 
            border: '1px solid #e2e8f0', 
            overflow: 'hidden' 
          }}>
            {/* TABLE */}
            <div style={{ overflowX: 'auto' }}>
              <table style={{ 
                width: '100%', 
                borderCollapse: 'collapse', 
                fontSize: isMobile ? 11 : 13,
                minWidth: isMobile ? '600px' : 'auto'
              }}>
                <thead>
                  <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                    <th style={s.th}>Tanggal</th>
                    <th style={s.th}>Nama Murid</th>
                    <th style={s.th}>WhatsApp</th>
                    <th style={s.th}>Kelas</th>
                    <th style={s.th}>Paket</th>
                    <th style={s.th}>Status</th>
                    <th style={{...s.th, textAlign: 'center'}}>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {registrations.map((reg) => {
                    const isPending = reg.paymentStatus === 'pending';
                    const isProcessing = processingId === reg.id;

                    return (
                      <tr key={reg.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={s.td}>
                          <div style={{ fontSize: isMobile ? 10 : 12, color: '#64748b' }}>
                            {formatDate(reg.createdAt)}
                          </div>
                        </td>
                        <td style={{...s.td, fontWeight: 600, color: '#1e293b'}}>
                          {reg.namaLengkap || '-'}
                        </td>
                        <td style={s.td}>
                          <a 
                            href={`https://wa.me/${reg.whatsappAktif}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ 
                              color: '#25D366', 
                              textDecoration: 'none',
                              fontWeight: 600,
                              display: 'flex',
                              alignItems: 'center',
                              gap: 4
                            }}
                          >
                            <Phone size={isMobile ? 12 : 14} />
                            {reg.whatsappAktif || '-'}
                          </a>
                        </td>
                        <td style={s.td}>
                          <span style={{
                            padding: '2px 10px',
                            borderRadius: 12,
                            background: '#e0f2fe',
                            color: '#0369a1',
                            fontSize: isMobile ? 9 : 11,
                            fontWeight: 600
                          }}>
                            {reg.kelasSekolah || '-'}
                          </span>
                        </td>
                        <td style={s.td}>
                          <span style={{
                            fontSize: isMobile ? 10 : 12,
                            fontWeight: 500,
                            color: '#475569'
                          }}>
                            {reg.paketBimbel || '-'}
                          </span>
                        </td>
                        <td style={s.td}>
                          <span style={{
                            padding: '3px 12px',
                            borderRadius: 20,
                            fontSize: isMobile ? 9 : 11,
                            fontWeight: 700,
                            background: isPending ? '#fef3c7' : '#dcfce7',
                            color: isPending ? '#d97706' : '#16a34a',
                            display: 'inline-block'
                          }}>
                            {isPending ? '🟡 Belum Bayar' : '🟢 Lunas'}
                          </span>
                        </td>
                        <td style={{...s.td, textAlign: 'center'}}>
                          <div style={{ display: 'flex', gap: 4, justifyContent: 'center', flexWrap: 'wrap' }}>
                            {isPending && (
                              <button
                                onClick={() => handleVerifyAndCreate(reg)}
                                disabled={isProcessing}
                                style={{
                                  ...s.actionBtn,
                                  background: '#10b981',
                                  color: 'white',
                                  opacity: isProcessing ? 0.6 : 1,
                                  cursor: isProcessing ? 'not-allowed' : 'pointer'
                                }}
                                title="Sahkan & Buat Akun"
                              >
                                <UserPlus size={isMobile ? 12 : 14} />
                                {!isMobile && 'Sahkan'}
                              </button>
                            )}
                            <button
                              onClick={() => handleDelete(reg.id, reg.namaLengkap)}
                              style={{
                                ...s.actionBtn,
                                background: '#fee2e2',
                                color: '#ef4444'
                              }}
                              title="Hapus"
                            >
                              <Trash2 size={isMobile ? 12 : 14} />
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

        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    </div>
  );
};

// ============================================================
// STYLES
// ============================================================
const s = {
  btnBack: {
    background: 'white',
    border: '1px solid #e2e8f0',
    padding: '8px 14px',
    borderRadius: 8,
    cursor: 'pointer',
    fontWeight: 600,
    fontSize: 13,
    display: 'flex',
    alignItems: 'center',
    gap: 6
  },
  th: {
    padding: '12px 14px',
    textAlign: 'left',
    color: '#64748b',
    fontWeight: 700,
    fontSize: '11px',
    textTransform: 'uppercase',
    letterSpacing: '0.5px'
  },
  td: {
    padding: '12px 14px',
    color: '#334155',
    verticalAlign: 'middle'
  },
  actionBtn: {
    border: 'none',
    padding: '6px 10px',
    borderRadius: 6,
    cursor: 'pointer',
    fontSize: '11px',
    fontWeight: 600,
    display: 'inline-flex',
    alignItems: 'center',
    gap: 4,
    transition: 'all 0.2s ease'
  }
};

export default ManageOnlineRegistration;