import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import SidebarAdmin from '../../../components/SidebarAdmin';
import { db } from '../../../firebase';
import { 
  doc, getDoc, collection, query, where, getDocs, 
  updateDoc, addDoc, serverTimestamp, orderBy 
} from "firebase/firestore";
import { 
  ArrowLeft, CreditCard, CheckCircle, Clock, AlertCircle,
  Calendar, User, BookOpen, Home, ChevronRight, Wallet,
  DollarSign, Receipt, TrendingUp, TrendingDown, X, Save
} from 'lucide-react';

const StudentFinance = () => {
  const navigate = useNavigate();
  const { id } = useParams();

  const [student, setStudent] = useState(null);
  const [tagihan, setTagihan] = useState(null); // Data cicilan
  const [financeLogs, setFinanceLogs] = useState([]); // Riwayat pembayaran
  const [loading, setLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [alertMsg, setAlertMsg] = useState(null);

  // === MODAL BAYAR ===
  const [showPayModal, setShowPayModal] = useState(false);
  const [payingIndex, setPayingIndex] = useState(null); // null = lunasin semua
  const [payAmount, setPayAmount] = useState('');
  const [payMethod, setPayMethod] = useState('Tunai');
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const showAlert = (msg, duration = 3500) => {
    setAlertMsg(msg);
    setTimeout(() => setAlertMsg(null), duration);
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch student
      const studentSnap = await getDoc(doc(db, "students", id));
      if (!studentSnap.exists()) {
        showAlert('❌ Siswa tidak ditemukan!');
        setTimeout(() => navigate('/admin/students'), 1500);
        return;
      }
      setStudent({ id: studentSnap.id, ...studentSnap.data() });

      // Fetch tagihan cicilan
      const qTagihan = query(
        collection(db, "finance_tagihan"), 
        where("studentId", "==", studentSnap.data().studentId || id)
      );
      const tagihanSnap = await getDocs(qTagihan);
      if (!tagihanSnap.empty) {
        setTagihan({ id: tagihanSnap.docs[0].id, ...tagihanSnap.docs[0].data() });
      } else {
        setTagihan(null);
      }

      // Fetch riwayat pembayaran
      const qLogs = query(
        collection(db, "finance_logs"),
        where("studentId", "==", studentSnap.data().studentId || id),
        where("type", "==", "Pemasukan"),
        orderBy("date", "desc")
      );
      const logsSnap = await getDocs(qLogs);
      setFinanceLogs(logsSnap.docs.map(d => ({ id: d.id, ...d.data() })));

    } catch (error) {
      console.error("Error:", error);
      showAlert('❌ Gagal memuat data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) fetchData();
  }, [id]);

  // === HELPER ===
  const getSisaTagihan = () => {
    if (!student) return 0;
    return (parseInt(student.totalTagihan || 0)) - (parseInt(student.totalBayar || 0));
  };

  const getProgressPercent = () => {
    if (!student || !student.totalTagihan) return 0;
    const total = parseInt(student.totalTagihan);
    if (total === 0) return 100;
    const bayar = parseInt(student.totalBayar || 0);
    return Math.min(100, Math.round((bayar / total) * 100));
  };

  const getStatusLunas = () => {
    return getSisaTagihan() <= 0;
  };

  const getInitials = (name) => {
    if (!name) return 'S';
    return name.split(' ').map(w => w[0]?.toUpperCase()).slice(0, 2).join('');
  };

  // === HANDLER BAYAR ===
  const openBayarModal = (index = null) => {
    setPayingIndex(index);
    if (index !== null && tagihan?.detailCicilan) {
      setPayAmount(tagihan.detailCicilan[index].nominal.toString());
    } else {
      setPayAmount(getSisaTagihan().toString());
    }
    setPayMethod('Tunai');
    setShowPayModal(true);
  };

  const handleBayar = async (e) => {
    e.preventDefault();
    const nominal = parseInt(payAmount);
    
    if (!nominal || nominal <= 0) {
      return showAlert('⚠️ Nominal tidak valid!');
    }

    if (nominal > getSisaTagihan() && payingIndex === null) {
      if (!window.confirm(`Nominal melebihi sisa tagihan. Lanjutkan sebagai kelebihan bayar?`)) return;
    }

    setIsProcessing(true);
    try {
      const studentId = student?.studentId || id;
      const today = new Date().toISOString().split('T')[0];

      // 1. Catat di finance_logs
      await addDoc(collection(db, "finance_logs"), {
        studentId: studentId,
        namaSiswa: student?.nama || '',
        date: today,
        type: 'Pemasukan',
        category: 'SPP / Cicilan',
        amount: nominal,
        method: payMethod,
        note: payingIndex !== null 
          ? `Cicilan ke-${payingIndex + 1}: ${student?.nama}`
          : `Pelunasan: ${student?.nama}`,
        createdAt: serverTimestamp()
      });

      // 2. Update totalBayar di students
      const newTotalBayar = (parseInt(student.totalBayar || 0)) + nominal;
      await updateDoc(doc(db, "students", id), {
        totalBayar: newTotalBayar
      });

      // 3. Update cicilan jika bayar per cicilan
      if (payingIndex !== null && tagihan) {
        const newDetails = [...tagihan.detailCicilan];
        newDetails[payingIndex] = {
          ...newDetails[payingIndex],
          status: 'Lunas',
          tanggalBayar: today
        };
        
        const newSisa = Math.max(0, tagihan.sisaTagihan - nominal);
        await updateDoc(doc(db, "finance_tagihan", tagihan.id), {
          detailCicilan: newDetails,
          sisaTagihan: newSisa
        });
      } else if (tagihan) {
        // Lunasin semua cicilan
        const newDetails = tagihan.detailCicilan.map(c => ({
          ...c,
          status: 'Lunas',
          tanggalBayar: c.status === 'Belum Lunas' ? today : c.tanggalBayar
        }));
        await updateDoc(doc(db, "finance_tagihan", tagihan.id), {
          detailCicilan: newDetails,
          sisaTagihan: 0
        });
      }

      showAlert(`✅ Pembayaran Rp ${nominal.toLocaleString()} berhasil!`);
      setShowPayModal(false);
      fetchData();

    } catch (error) {
      console.error("Error:", error);
      showAlert('❌ Gagal memproses pembayaran: ' + error.message);
    } finally {
      setIsProcessing(false);
    }
  };

  if (loading) {
    return (
      <div style={styles.wrapper}>
        <SidebarAdmin />
        <div style={styles.mainContent(isMobile)}>
          <div style={styles.loadingState}>
            <div style={styles.spinner}></div>
            <p>Memuat data keuangan...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!student) return null;

  const sisa = getSisaTagihan();
  const isLunas = getStatusLunas();
  const progress = getProgressPercent();

  return (
    <div style={styles.wrapper}>
      <SidebarAdmin />
      <div style={styles.mainContent(isMobile)}>
        
        {/* TOAST */}
        {alertMsg && <div style={styles.toast}>{alertMsg}</div>}

        {/* BREADCRUMB */}
        <div style={styles.breadcrumb(isMobile)}>
          <button onClick={() => navigate('/admin/students')} style={styles.backBtn}>
            <ArrowLeft size={16} /> Kembali
          </button>
          <div style={styles.breadcrumbTrail}>
            <Home size={12} color="#94a3b8" />
            <ChevronRight size={12} color="#94a3b8" />
            <span style={{color: '#94a3b8'}}>Siswa</span>
            <ChevronRight size={12} color="#94a3b8" />
            <span style={{color: '#8b5cf6', fontWeight: 'bold'}}>Keuangan</span>
          </div>
        </div>

        {/* === STUDENT CARD === */}
        <div style={styles.studentCard(isMobile)}>
          <div style={styles.studentAvatar}>
            {getInitials(student.nama)}
          </div>
          <div style={styles.studentInfo}>
            <h3 style={styles.studentName}>{student.nama}</h3>
            <div style={styles.studentMeta}>
              <span style={styles.idBadge}>📋 {student.studentId || '-'}</span>
              <span style={styles.programBadge}>
                {student.kategori === 'English' ? '🇬🇧 English' : '📚 Reguler'}
              </span>
            </div>
          </div>
          <div style={styles.lunasBadge(isLunas)}>
            {isLunas ? (
              <><CheckCircle size={18} /> LUNAS</>
            ) : (
              <><Clock size={18} /> BELUM LUNAS</>
            )}
          </div>
        </div>

        {/* === RINGKASAN TAGIHAN === */}
        <div style={styles.gridContainer(isMobile)}>
          
          {/* KIRI: Progress & Detail */}
          <div style={styles.card}>
            <h3 style={styles.cardTitle}>
              <Wallet size={18} /> Ringkasan Tagihan
            </h3>

            {/* Progress Bar */}
            <div style={styles.progressSection}>
              <div style={styles.progressBar}>
                <div style={styles.progressFill(progress)}></div>
              </div>
              <div style={styles.progressLabel}>
                <span>{progress}% Terbayar</span>
                <span>Rp {(student.totalBayar || 0).toLocaleString()} / Rp {(student.totalTagihan || 0).toLocaleString()}</span>
              </div>
            </div>

            {/* Detail Finansial */}
            <div style={styles.financeGrid}>
              <div style={styles.financeItem}>
                <TrendingUp size={16} color="#3b82f6" />
                <div>
                  <span style={styles.financeLabel}>Total Tagihan</span>
                  <strong style={styles.financeValue}>Rp {(student.totalTagihan || 0).toLocaleString()}</strong>
                </div>
              </div>
              <div style={styles.financeItem}>
                <DollarSign size={16} color="#10b981" />
                <div>
                  <span style={styles.financeLabel}>Sudah Dibayar</span>
                  <strong style={{...styles.financeValue, color: '#10b981'}}>Rp {(student.totalBayar || 0).toLocaleString()}</strong>
                </div>
              </div>
              <div style={styles.financeItem}>
                <Receipt size={16} color={sisa > 0 ? '#ef4444' : '#10b981'} />
                <div>
                  <span style={styles.financeLabel}>Sisa Tagihan</span>
                  <strong style={{...styles.financeValue, color: sisa > 0 ? '#ef4444' : '#10b981'}}>Rp {sisa.toLocaleString()}</strong>
                </div>
              </div>
              <div style={styles.financeItem}>
                <Calendar size={16} color="#8b5cf6" />
                <div>
                  <span style={styles.financeLabel}>Masa Paket</span>
                  <strong style={styles.financeValue}>
                    {student.tanggalMulai || '-'} → {student.tanggalSelesai || '-'}
                  </strong>
                </div>
              </div>
            </div>

            {/* Tombol Lunasin */}
            {!isLunas && (
              <button onClick={() => openBayarModal(null)} style={styles.btnLunasin}>
                <CheckCircle size={16} /> Bayar Lunas Sekarang
              </button>
            )}
          </div>

          {/* KANAN: Cicilan & Riwayat */}
          <div style={{display: 'flex', flexDirection: 'column', gap: 15}}>
            
            {/* Detail Cicilan */}
            {tagihan && tagihan.detailCicilan && tagihan.detailCicilan.length > 0 && (
              <div style={styles.card}>
                <h3 style={styles.cardTitle}>
                  <CreditCard size={18} /> Detail Cicilan
                </h3>
                <div style={styles.cicilanList}>
                  {tagihan.detailCicilan.map((item, idx) => (
                    <div key={idx} style={styles.cicilanItem(item.status)}>
                      <div style={styles.cicilanLeft}>
                        <span style={styles.cicilanNum}>Cicilan {idx + 1}</span>
                        <span style={styles.cicilanDate}>📅 {item.jatuhTempo}</span>
                      </div>
                      <div style={styles.cicilanRight}>
                        <strong style={styles.cicilanAmount}>Rp {item.nominal.toLocaleString()}</strong>
                        {item.status === 'Lunas' ? (
                          <span style={styles.badgeLunas}>✅ {item.tanggalBayar}</span>
                        ) : (
                          <button onClick={() => openBayarModal(idx)} style={styles.btnBayarCicilan}>
                            Bayar
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Riwayat Pembayaran */}
            <div style={styles.card}>
              <h3 style={styles.cardTitle}>
                <Receipt size={18} /> Riwayat Pembayaran
              </h3>
              {financeLogs.length === 0 ? (
                <div style={styles.emptyHistory}>
                  <AlertCircle size={32} color="#94a3b8" />
                  <p>Belum ada riwayat pembayaran</p>
                </div>
              ) : (
                <div style={styles.historyList}>
                  {financeLogs.slice(0, 10).map((log) => (
                    <div key={log.id} style={styles.historyItem}>
                      <div style={styles.historyLeft}>
                        <div style={styles.historyDot(log.method)}></div>
                        <div>
                          <div style={styles.historyDate}>{log.date}</div>
                          <div style={styles.historyNote}>{log.note || log.category}</div>
                        </div>
                      </div>
                      <div style={styles.historyRight}>
                        <strong style={{color: '#10b981'}}>+ Rp {log.amount?.toLocaleString()}</strong>
                        <span style={styles.historyMethod(log.method)}>
                          {log.method === 'Tunai' ? '💵 Tunai' : '💳 Transfer'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* === MODAL BAYAR === */}
        {showPayModal && (
          <div style={styles.modalOverlay} onClick={() => setShowPayModal(false)}>
            <div style={styles.modalContent(isMobile)} onClick={e => e.stopPropagation()}>
              <div style={styles.modalHeader}>
                <h3 style={styles.modalTitle}>
                  <CreditCard size={20} />
                  {payingIndex !== null 
                    ? `Bayar Cicilan ke-${payingIndex + 1}` 
                    : 'Pembayaran Lunas'}
                </h3>
                <button onClick={() => setShowPayModal(false)} style={styles.modalClose}>
                  <X size={18} />
                </button>
              </div>

              <div style={styles.modalBody}>
                <div style={styles.payInfo}>
                  <span>Sisa Tagihan</span>
                  <strong style={{color: '#ef4444'}}>Rp {sisa.toLocaleString()}</strong>
                </div>
                {payingIndex !== null && tagihan?.detailCicilan && (
                  <div style={styles.payInfo}>
                    <span>Nominal Cicilan ini</span>
                    <strong>Rp {tagihan.detailCicilan[payingIndex].nominal.toLocaleString()}</strong>
                  </div>
                )}

                <form onSubmit={handleBayar}>
                  <div style={styles.inputGroup}>
                    <label style={styles.label}>Jumlah Bayar (Rp)</label>
                    <input 
                      type="number" 
                      style={styles.input}
                      value={payAmount}
                      onChange={e => setPayAmount(e.target.value)}
                      required
                      autoFocus
                    />
                  </div>

                  <div style={styles.inputGroup}>
                    <label style={styles.label}>Metode</label>
                    <select style={styles.input} value={payMethod} onChange={e => setPayMethod(e.target.value)}>
                      <option value="Tunai">💵 Tunai</option>
                      <option value="Transfer">💳 Transfer</option>
                    </select>
                  </div>

                  <div style={styles.modalFooter}>
                    <button type="button" onClick={() => setShowPayModal(false)} style={styles.btnCancel}>
                      Batal
                    </button>
                    <button type="submit" style={styles.btnSave} disabled={isProcessing}>
                      {isProcessing ? '⏳ Memproses...' : <><Save size={16} /> Konfirmasi Bayar</>}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

      </div>

      <style>{`
        @keyframes toastIn {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};

// === STYLES ===
const styles = {
  wrapper: { display: 'flex', background: '#f8fafc', minHeight: '100vh' },
  mainContent: (m) => ({ 
    marginLeft: m ? '0' : '250px', 
    padding: m ? '15px' : '30px', 
    width: '100%', 
    boxSizing: 'border-box',
    transition: '0.3s'
  }),

  // Toast & Loading
  toast: { 
    position: 'fixed', top: 20, right: 20, zIndex: 9999, 
    background: '#1e293b', color: 'white', padding: '14px 24px', 
    borderRadius: 12, fontWeight: 'bold', fontSize: 14, 
    boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
    animation: 'toastIn 0.3s ease'
  },
  loadingState: { textAlign: 'center', padding: 80 },
  spinner: { 
    width: 40, height: 40, border: '4px solid #e2e8f0', 
    borderTop: '4px solid #8b5cf6', borderRadius: '50%', 
    animation: 'spin 1s linear infinite', margin: '0 auto 15px' 
  },

  // Breadcrumb
  breadcrumb: (m) => ({ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 10 }),
  backBtn: { 
    background: 'white', border: '1px solid #e2e8f0', padding: '8px 14px', 
    borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: 13, 
    display: 'flex', alignItems: 'center', gap: 6, color: '#64748b' 
  },
  breadcrumbTrail: { display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 },

  // Student Card
  studentCard: (m) => ({ 
    display: 'flex', alignItems: 'center', gap: 16,
    background: 'white', padding: m ? 15 : 20, 
    borderRadius: 14, marginBottom: 20,
    boxShadow: '0 2px 8px rgba(0,0,0,0.04)', border: '1px solid #f1f5f9',
    flexWrap: m ? 'wrap' : 'nowrap'
  }),
  studentAvatar: { 
    width: 50, height: 50, borderRadius: '50%', 
    background: 'linear-gradient(135deg, #8b5cf6, #6366f1)', 
    color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 20, fontWeight: 'bold', flexShrink: 0
  },
  studentInfo: { flex: 1, minWidth: 0 },
  studentName: { margin: 0, fontSize: 16, color: '#1e293b' },
  studentMeta: { display: 'flex', gap: 8, marginTop: 4, flexWrap: 'wrap' },
  idBadge: { 
    display: 'inline-flex', alignItems: 'center', gap: 4,
    background: '#f1f5f9', padding: '3px 10px', borderRadius: 10,
    fontSize: 11, fontWeight: 'bold', color: '#475569'
  },
  programBadge: { 
    padding: '3px 10px', borderRadius: 10, fontSize: 11, fontWeight: 'bold',
    background: '#f0fdf4', color: '#166534'
  },
  lunasBadge: (isLunas) => ({ 
    display: 'flex', alignItems: 'center', gap: 6,
    padding: '8px 16px', borderRadius: 12, fontSize: 14, fontWeight: 'bold',
    background: isLunas ? '#dcfce7' : '#fee2e2',
    color: isLunas ? '#166534' : '#ef4444',
    flexShrink: 0
  }),

  // Grid
  gridContainer: (m) => ({ 
    display: 'grid', 
    gridTemplateColumns: m ? '1fr' : '1fr 400px', 
    gap: 20 
  }),

  // Card
  card: { 
    background: 'white', padding: 20, borderRadius: 14, 
    boxShadow: '0 2px 8px rgba(0,0,0,0.04)', border: '1px solid #f1f5f9' 
  },
  cardTitle: { 
    display: 'flex', alignItems: 'center', gap: 8,
    margin: '0 0 16px 0', fontSize: 14, color: '#1e293b', fontWeight: 'bold',
    paddingBottom: 10, borderBottom: '2px solid #f1f5f9'
  },

  // Progress
  progressSection: { marginBottom: 20 },
  progressBar: { height: 10, borderRadius: 5, background: '#f1f5f9', overflow: 'hidden' },
  progressFill: (pct) => ({ 
    height: '100%', borderRadius: 5, 
    background: pct >= 100 ? '#10b981' : '#3b82f6',
    width: `${pct}%`, transition: 'width 0.5s ease'
  }),
  progressLabel: { 
    display: 'flex', justifyContent: 'space-between', 
    marginTop: 6, fontSize: 11, color: '#64748b' 
  },

  // Finance Grid
  financeGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12 },
  financeItem: { 
    display: 'flex', alignItems: 'center', gap: 10, 
    padding: 12, background: '#f8fafc', borderRadius: 10 
  },
  financeLabel: { display: 'block', fontSize: 10, color: '#94a3b8' },
  financeValue: { fontSize: 13, color: '#1e293b' },

  // Lunasin Button
  btnLunasin: { 
    width: '100%', marginTop: 16, padding: '14px',
    background: '#10b981', color: 'white', border: 'none',
    borderRadius: 10, fontWeight: 'bold', fontSize: 14,
    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
    boxShadow: '0 4px 12px rgba(16,185,129,0.3)'
  },

  // Cicilan
  cicilanList: { display: 'flex', flexDirection: 'column', gap: 8 },
  cicilanItem: (status) => ({ 
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: 12, borderRadius: 10,
    background: status === 'Lunas' ? '#f0fdf4' : '#fefce8',
    border: `1px solid ${status === 'Lunas' ? '#bbf7d0' : '#fef08a'}`,
    flexWrap: 'wrap', gap: 8
  }),
  cicilanLeft: { display: 'flex', flexDirection: 'column', gap: 2 },
  cicilanNum: { fontSize: 12, fontWeight: 'bold', color: '#1e293b' },
  cicilanDate: { fontSize: 10, color: '#64748b' },
  cicilanRight: { display: 'flex', alignItems: 'center', gap: 10 },
  cicilanAmount: { fontSize: 13, color: '#1e293b' },
  badgeLunas: { 
    padding: '4px 10px', borderRadius: 8, fontSize: 10, fontWeight: 'bold',
    background: '#dcfce7', color: '#166534'
  },
  btnBayarCicilan: { 
    padding: '6px 14px', borderRadius: 8, 
    background: '#f59e0b', color: 'white', border: 'none',
    fontWeight: 'bold', fontSize: 11, cursor: 'pointer'
  },

  // History
  emptyHistory: { textAlign: 'center', padding: 30, color: '#94a3b8' },
  historyList: { display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 400, overflowY: 'auto' },
  historyItem: { 
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '10px 12px', borderRadius: 8, background: '#f8fafc'
  },
  historyLeft: { display: 'flex', alignItems: 'center', gap: 10 },
  historyDot: (method) => ({ 
    width: 8, height: 8, borderRadius: '50%',
    background: method === 'Tunai' ? '#f59e0b' : '#3b82f6'
  }),
  historyDate: { fontSize: 12, fontWeight: 'bold', color: '#1e293b' },
  historyNote: { fontSize: 10, color: '#94a3b8' },
  historyRight: { textAlign: 'right', display: 'flex', flexDirection: 'column', gap: 2 },
  historyMethod: (method) => ({ 
    fontSize: 9, padding: '1px 6px', borderRadius: 4,
    background: method === 'Tunai' ? '#fef3c7' : '#e0e7ff',
    color: method === 'Tunai' ? '#b45309' : '#3730a3'
  }),

  // Modal
  modalOverlay: { 
    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
    background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', 
    justifyContent: 'center', zIndex: 9999, padding: 20
  },
  modalContent: (m) => ({ 
    background: 'white', borderRadius: 16, padding: 24,
    width: m ? '95%' : '420px', maxWidth: '450px',
    boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
    animation: 'slideUp 0.3s ease'
  }),
  modalHeader: { 
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: 20, paddingBottom: 12, borderBottom: '1px solid #f1f5f9'
  },
  modalTitle: { 
    margin: 0, fontSize: 16, color: '#1e293b', 
    display: 'flex', alignItems: 'center', gap: 8 
  },
  modalClose: { 
    background: '#f1f5f9', border: 'none', width: 32, height: 32, 
    borderRadius: '50%', cursor: 'pointer', display: 'flex', 
    alignItems: 'center', justifyContent: 'center', color: '#64748b' 
  },
  modalBody: {},
  modalFooter: { 
    display: 'flex', gap: 10, marginTop: 20, paddingTop: 16, 
    borderTop: '1px solid #f1f5f9' 
  },
  payInfo: { 
    display: 'flex', justifyContent: 'space-between', 
    padding: '10px 14px', background: '#f8fafc', borderRadius: 8, 
    marginBottom: 10, fontSize: 13 
  },

  // Input
  inputGroup: { marginBottom: 14 },
  label: { display: 'block', fontSize: 12, fontWeight: 'bold', color: '#64748b', marginBottom: 5 },
  input: { 
    width: '100%', padding: '10px 12px', borderRadius: 8, 
    border: '1px solid #e2e8f0', fontSize: 14, boxSizing: 'border-box',
    background: '#f8fafc'
  },

  // Buttons
  btnCancel: { 
    flex: 1, padding: '12px', borderRadius: 10,
    border: '1px solid #e2e8f0', background: 'white',
    color: '#64748b', fontWeight: 'bold', fontSize: 13, cursor: 'pointer' 
  },
  btnSave: { 
    flex: 2, padding: '12px', borderRadius: 10,
    border: 'none', background: '#10b981',
    color: 'white', fontWeight: 'bold', fontSize: 13, cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 
  }
};

export default StudentFinance;