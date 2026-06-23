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
  Calendar, Home, ChevronRight, Wallet,
  DollarSign, Receipt, TrendingUp, X, Save, ShieldCheck,
  RefreshCw, PlusCircle
} from 'lucide-react';

const StudentFinance = () => {
  const navigate = useNavigate();
  const { id } = useParams();

  const [student, setStudent] = useState(null);
  const [tagihan, setTagihan] = useState(null);
  const [financeLogs, setFinanceLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [alertMsg, setAlertMsg] = useState(null);

  // Modal bayar cicilan/lunas
  const [showPayModal, setShowPayModal] = useState(false);
  const [payingIndex, setPayingIndex] = useState(null);
  const [payAmount, setPayAmount] = useState('');
  const [payMethod, setPayMethod] = useState('Tunai');
  const [isProcessing, setIsProcessing] = useState(false);

  // === MODAL PERPANJANGAN ===
  const [showPerpanjangModal, setShowPerpanjangModal] = useState(false);
  const [perpanjangData, setPerpanjangData] = useState({
    durasiTambah: 3,
    metodeBayar: 'Tunai',
    tenor: 1,
    tanggalCicilan1: new Date().toISOString().split('T')[0],
    customDueDates: []
  });

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
      const studentSnap = await getDoc(doc(db, "students", id));
      if (!studentSnap.exists()) {
        showAlert('❌ Siswa tidak ditemukan!');
        setTimeout(() => navigate('/admin/students'), 1500);
        return;
      }
      const studentData = { id: studentSnap.id, ...studentSnap.data() };
      setStudent(studentData);

      const qTagihan = query(
        collection(db, "finance_tagihan"), 
        where("studentId", "==", studentData.studentId || id)
      );
      const tagihanSnap = await getDocs(qTagihan);
      if (!tagihanSnap.empty) {
        setTagihan({ id: tagihanSnap.docs[0].id, ...tagihanSnap.docs[0].data() });
      } else {
        setTagihan(null);
      }

      const qLogs = query(
        collection(db, "finance_logs"),
        where("studentId", "==", studentData.studentId || id),
        where("type", "==", "Pemasukan"),
        orderBy("date", "desc")
      );
      const logsSnap = await getDocs(qLogs);
      setFinanceLogs(logsSnap.docs.map(d => ({ id: d.id, ...d.data() })));

    } catch (error) { console.error("Error:", error); showAlert('❌ Gagal memuat'); }
    finally { setLoading(false); }
  };

  useEffect(() => { if (id) fetchData(); }, [id]);

  // === HELPER ===
  const isAlreadyLunas = () => {
    if (!student) return false;
    return ((parseInt(student.totalTagihan || 0)) - (parseInt(student.totalBayar || 0))) <= 0;
  };

  const isPendaftaranLunas = () => {
    return student?.metodeBayar === 'Tunai' || student?.metodeBayar === 'Transfer';
  };

  const getSisaTagihan = () => {
    if (!student) return 0;
    return Math.max(0, (parseInt(student.totalTagihan || 0)) - (parseInt(student.totalBayar || 0)));
  };

  const getProgressPercent = () => {
    if (!student || !student.totalTagihan || student.totalTagihan === 0) return 100;
    return Math.min(100, Math.round((parseInt(student.totalBayar || 0) / parseInt(student.totalTagihan)) * 100));
  };

  const getInitials = (name) => {
    if (!name) return 'S';
    return name.split(' ').map(w => w[0]?.toUpperCase()).slice(0, 2).join('');
  };

  // === HITUNG MASA AKTIF ===
  const getMasaStatus = () => {
    if (!student?.tanggalSelesai) return { label: 'Unknown', color: '#94a3b8', bg: '#f1f5f9' };
    const today = new Date(); today.setHours(0,0,0,0);
    const selesai = new Date(student.tanggalSelesai); selesai.setHours(0,0,0,0);
    const diffDays = Math.ceil((selesai - today) / (1000 * 60 * 60 * 24));
    if (diffDays < 0) return { label: 'HABIS', color: '#ef4444', bg: '#fee2e2' };
    if (diffDays <= 30) return { label: `${diffDays} hari lagi`, color: '#f59e0b', bg: '#fef3c7' };
    return { label: 'Aktif', color: '#10b981', bg: '#dcfce7' };
  };

  // === GET HARGA DARI SETTINGS ===
  const getHargaPaket = async () => {
    try {
      const settingsSnap = await getDoc(doc(db, "settings", "global_config"));
      if (settingsSnap.exists() && settingsSnap.data().prices) {
        const prices = settingsSnap.data().prices;
        if (student?.kategori === 'English') {
          const level = student?.paket || 'kids';
          return parseInt(prices.english?.[level] || 0);
        } else {
          const jenjang = (student?.jenjang || 'sd').toLowerCase();
          const paket = student?.paket || 'paket1';
          return parseInt(prices[jenjang]?.[paket] || 0);
        }
      }
    } catch (e) { console.error(e); }
    return 0;
  };

  // === PERPANJANGAN ===
  const hitungTotalPerpanjangan = async () => {
    const hargaBulanan = await getHargaPaket();
    return hargaBulanan * perpanjangData.durasiTambah;
  };

  const hitungCicilanPerpanjang = async () => {
    const total = await hitungTotalPerpanjangan();
    return perpanjangData.tenor > 0 ? Math.ceil(total / perpanjangData.tenor) : total;
  };

  // Hitung jatuh tempo cicilan perpanjangan
  useEffect(() => {
    if (perpanjangData.metodeBayar === 'Cicilan' && perpanjangData.tenor > 0) {
      const dates = [];
      const startDate = new Date(perpanjangData.tanggalCicilan1);
      for (let i = 0; i < perpanjangData.tenor; i++) {
        const nextDate = new Date(startDate);
        nextDate.setMonth(startDate.getMonth() + i);
        dates.push(nextDate.toISOString().split('T')[0]);
      }
      setPerpanjangData(prev => ({...prev, customDueDates: dates}));
    }
  }, [perpanjangData.metodeBayar, perpanjangData.tenor, perpanjangData.tanggalCicilan1]);

  const handlePerpanjang = async (e) => {
    e.preventDefault();
    setIsProcessing(true);
    try {
      const totalPerpanjangan = await hitungTotalPerpanjangan();
      const today = new Date().toISOString().split('T')[0];
      const studentId = student?.studentId || id;

      // 1. Hitung tanggal selesai baru
      const oldSelesai = student.tanggalSelesai || today;
      const newSelesai = new Date(oldSelesai);
      newSelesai.setMonth(newSelesai.getMonth() + perpanjangData.durasiTambah);
      const newSelesaiStr = newSelesai.toISOString().split('T')[0];

      // 2. Update students: totalTagihan & tglSelesai
      const newTotalTagihan = (parseInt(student.totalTagihan || 0)) + totalPerpanjangan;
      const newTotalBayar = perpanjangData.metodeBayar === 'Tunai' || perpanjangData.metodeBayar === 'Transfer'
        ? (parseInt(student.totalBayar || 0)) + totalPerpanjangan
        : parseInt(student.totalBayar || 0);

      await updateDoc(doc(db, "students", id), {
        totalTagihan: newTotalTagihan,
        totalBayar: newTotalBayar,
        tanggalSelesai: newSelesaiStr,
        durasiBulan: (parseInt(student.durasiBulan || 0)) + perpanjangData.durasiTambah
      });

      // 3. Catat di finance_logs
      await addDoc(collection(db, "finance_logs"), {
        studentId: studentId,
        namaSiswa: student?.nama || '',
        date: today,
        type: 'Pemasukan',
        category: 'Perpanjangan Paket',
        amount: totalPerpanjangan,
        method: perpanjangData.metodeBayar,
        note: `Perpanjangan ${perpanjangData.durasiTambah} bulan: ${student?.nama} (s.d ${newSelesaiStr})`,
        createdAt: serverTimestamp()
      });

      // 4. Jika cicilan, buat/update finance_tagihan
      if (perpanjangData.metodeBayar === 'Cicilan') {
        const cicilanNominal = await hitungCicilanPerpanjang();
        const installments = perpanjangData.customDueDates.map((dateStr, index) => ({
          bulanKe: (tagihan?.detailCicilan?.length || 0) + index + 1,
          nominal: cicilanNominal,
          status: 'Belum Lunas',
          jatuhTempo: dateStr,
          tanggalBayar: null
        }));

        if (tagihan) {
          // Update tagihan existing
          const existingCicilan = tagihan.detailCicilan || [];
          const newSisa = (tagihan.sisaTagihan || 0) + totalPerpanjangan;
          await updateDoc(doc(db, "finance_tagihan", tagihan.id), {
            totalTagihan: (tagihan.totalTagihan || 0) + totalPerpanjangan,
            sisaTagihan: newSisa,
            detailCicilan: [...existingCicilan, ...installments]
          });
        } else {
          // Buat baru
          await addDoc(collection(db, "finance_tagihan"), {
            studentId: studentId,
            namaSiswa: student?.nama || '',
            noHp: student?.ortu?.hp || '',
            totalTagihan: totalPerpanjangan,
            sisaTagihan: totalPerpanjangan,
            detailCicilan: installments,
            createdAt: serverTimestamp()
          });
        }
      }

      showAlert(`✅ Perpanjangan ${perpanjangData.durasiTambah} bulan berhasil! Selesai: ${newSelesaiStr}`);
      setShowPerpanjangModal(false);
      fetchData();
    } catch (error) {
      console.error("Error:", error);
      showAlert('❌ Gagal: ' + error.message);
    } finally {
      setIsProcessing(false);
    }
  };

  // === BAYAR CICILAN ===
  const openBayarModal = (index = null) => {
    if (isPendaftaranLunas() && index === null) {
      return showAlert('⚠️ Pembayaran pendaftaran sudah LUNAS!');
    }
    setPayingIndex(index);
    if (index !== null && tagihan?.detailCicilan) {
      if (tagihan.detailCicilan[index].status === 'Lunas') return showAlert('⚠️ Cicilan ini sudah dibayar!');
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
    if (!nominal || nominal <= 0) return showAlert('⚠️ Nominal tidak valid!');
    if (getSisaTagihan() <= 0 && payingIndex === null) return showAlert('⚠️ Tidak ada tagihan!');

    setIsProcessing(true);
    try {
      const studentId = student?.studentId || id;
      const today = new Date().toISOString().split('T')[0];

      await addDoc(collection(db, "finance_logs"), {
        studentId, namaSiswa: student?.nama || '', date: today,
        type: 'Pemasukan', category: 'SPP / Cicilan', amount: nominal,
        method: payMethod,
        note: payingIndex !== null ? `Cicilan ke-${payingIndex + 1}: ${student?.nama}` : `Pelunasan: ${student?.nama}`,
        createdAt: serverTimestamp()
      });

      const newTotalBayar = Math.min(
        parseInt(student.totalTagihan || 0),
        (parseInt(student.totalBayar || 0)) + nominal
      );
      await updateDoc(doc(db, "students", id), { totalBayar: newTotalBayar });

      if (payingIndex !== null && tagihan) {
        const newDetails = [...tagihan.detailCicilan];
        newDetails[payingIndex] = { ...newDetails[payingIndex], status: 'Lunas', tanggalBayar: today };
        await updateDoc(doc(db, "finance_tagihan", tagihan.id), {
          detailCicilan: newDetails,
          sisaTagihan: Math.max(0, tagihan.sisaTagihan - nominal)
        });
      } else if (tagihan && payingIndex === null) {
        const newDetails = tagihan.detailCicilan.map(c => ({
          ...c, status: 'Lunas', tanggalBayar: c.status === 'Belum Lunas' ? today : c.tanggalBayar
        }));
        await updateDoc(doc(db, "finance_tagihan", tagihan.id), { detailCicilan: newDetails, sisaTagihan: 0 });
      }

      showAlert(`✅ Pembayaran Rp ${nominal.toLocaleString()} berhasil!`);
      setShowPayModal(false);
      fetchData();
    } catch (error) { console.error(error); showAlert('❌ Gagal: ' + error.message); }
    finally { setIsProcessing(false); }
  };

  if (loading) {
    return (
      <div style={styles.wrapper}><SidebarAdmin />
        <div style={styles.mainContent(isMobile)}><div style={styles.loadingState}><div style={styles.spinner}></div><p>Memuat data keuangan...</p></div></div>
      </div>
    );
  }
  if (!student) return null;

  const sisa = getSisaTagihan();
  const isLunas = isAlreadyLunas();
  const masa = getMasaStatus();
  const isPendaftaranFull = isPendaftaranLunas();

  return (
    <div style={styles.wrapper}>
      <SidebarAdmin />
      <div style={styles.mainContent(isMobile)}>
        {alertMsg && <div style={styles.toast}>{alertMsg}</div>}

        <div style={styles.breadcrumb(isMobile)}>
          <button onClick={() => navigate('/admin/students')} style={styles.backBtn}><ArrowLeft size={16} /> Kembali</button>
          <div style={styles.breadcrumbTrail}>
            <Home size={12} color="#94a3b8" /><ChevronRight size={12} color="#94a3b8" />
            <span style={{color: '#94a3b8'}}>Siswa</span><ChevronRight size={12} color="#94a3b8" />
            <span style={{color: '#8b5cf6', fontWeight: 'bold'}}>Keuangan</span>
          </div>
        </div>

        {/* STUDENT CARD */}
        <div style={styles.studentCard(isMobile)}>
          <div style={styles.studentAvatar}>{getInitials(student.nama)}</div>
          <div style={styles.studentInfo}>
            <h3 style={styles.studentName}>{student.nama}</h3>
            <div style={styles.studentMeta}>
              <span style={styles.idBadge}>📋 {student.studentId || '-'}</span>
              <span style={styles.programBadge}>{student.kategori === 'English' ? '🇬🇧 English' : '📚 Reguler'}</span>
              <span style={{...styles.masaBadge, background: masa.bg, color: masa.color}}>
                <Clock size={10} /> {masa.label}
              </span>
            </div>
          </div>
          <div style={{display: 'flex', gap: 8, flexShrink: 0}}>
            <div style={styles.lunasBadge(isLunas)}>
              {isLunas ? <><CheckCircle size={14} /> LUNAS</> : <><Clock size={14} /> BELUM</>}
            </div>
          </div>
        </div>

        <div style={styles.gridContainer(isMobile)}>
          {/* KIRI */}
          <div style={styles.card}>
            <h3 style={styles.cardTitle}><Wallet size={18} /> Ringkasan Tagihan</h3>
            <div style={styles.progressSection}>
              <div style={styles.progressBar}><div style={styles.progressFill(getProgressPercent())}></div></div>
              <div style={styles.progressLabel}>
                <span>{getProgressPercent()}% Terbayar</span>
                <span>Rp {(student.totalBayar || 0).toLocaleString()} / Rp {(student.totalTagihan || 0).toLocaleString()}</span>
              </div>
            </div>
            <div style={styles.financeGrid}>
              <div style={styles.financeItem}><TrendingUp size={16} color="#3b82f6" /><div><span style={styles.financeLabel}>Total</span><strong style={styles.financeValue}>Rp {(student.totalTagihan || 0).toLocaleString()}</strong></div></div>
              <div style={styles.financeItem}><DollarSign size={16} color="#10b981" /><div><span style={styles.financeLabel}>Dibayar</span><strong style={{...styles.financeValue, color: '#10b981'}}>Rp {(student.totalBayar || 0).toLocaleString()}</strong></div></div>
              <div style={styles.financeItem}><Receipt size={16} color={sisa > 0 ? '#ef4444' : '#10b981'} /><div><span style={styles.financeLabel}>Sisa</span><strong style={{...styles.financeValue, color: sisa > 0 ? '#ef4444' : '#10b981'}}>Rp {sisa.toLocaleString()}</strong></div></div>
              <div style={styles.financeItem}><Calendar size={16} color="#8b5cf6" /><div><span style={styles.financeLabel}>Masa Paket</span><strong style={{...styles.financeValue, fontSize: 11}}>{student.tanggalMulai || '-'} → {student.tanggalSelesai || '-'}</strong></div></div>
            </div>
            {!isLunas && !isPendaftaranFull && (
              <button onClick={() => openBayarModal(null)} style={styles.btnLunasin}>
                <CheckCircle size={16} /> Bayar Lunas
              </button>
            )}

            {/* === TOMBOL PERPANJANGAN === */}
            <button onClick={() => setShowPerpanjangModal(true)} style={styles.btnPerpanjang}>
              <RefreshCw size={16} /> Perpanjang Paket
            </button>
          </div>

          {/* KANAN */}
          <div style={{display: 'flex', flexDirection: 'column', gap: 15}}>
            {tagihan && tagihan.detailCicilan && tagihan.detailCicilan.length > 0 && (
              <div style={styles.card}>
                <h3 style={styles.cardTitle}><CreditCard size={18} /> Cicilan</h3>
                <div style={styles.cicilanList}>
                  {tagihan.detailCicilan.map((item, idx) => (
                    <div key={idx} style={styles.cicilanItem(item.status)}>
                      <div style={styles.cicilanLeft}><span style={styles.cicilanNum}>#{idx + 1}</span><span style={styles.cicilanDate}>📅 {item.jatuhTempo}</span></div>
                      <div style={styles.cicilanRight}>
                        <strong style={styles.cicilanAmount}>Rp {item.nominal.toLocaleString()}</strong>
                        {item.status === 'Lunas' ? <span style={styles.badgeLunas}>✅</span> : <button onClick={() => openBayarModal(idx)} style={styles.btnBayarCicilan}>Bayar</button>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div style={styles.card}>
              <h3 style={styles.cardTitle}><Receipt size={18} /> Riwayat</h3>
              {financeLogs.length === 0 ? (
                <div style={styles.emptyHistory}><AlertCircle size={32} color="#94a3b8" /><p>Belum ada</p></div>
              ) : (
                <div style={styles.historyList}>
                  {financeLogs.slice(0, 10).map((log) => (
                    <div key={log.id} style={styles.historyItem}>
                      <div style={styles.historyLeft}>
                        <div style={styles.historyDot(log.category)}></div>
                        <div><div style={styles.historyDate}>{log.date}</div><div style={styles.historyNote}>{log.note || log.category}</div></div>
                      </div>
                      <div style={styles.historyRight}>
                        <strong style={{color: '#10b981'}}>+ Rp {log.amount?.toLocaleString()}</strong>
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
                <h3 style={styles.modalTitle}><CreditCard size={20} />{payingIndex !== null ? `Bayar Cicilan #${payingIndex + 1}` : 'Pembayaran'}</h3>
                <button onClick={() => setShowPayModal(false)} style={styles.modalClose}><X size={18} /></button>
              </div>
              <div style={styles.modalBody}>
                <div style={styles.payInfo}><span>Sisa</span><strong style={{color: '#ef4444'}}>Rp {sisa.toLocaleString()}</strong></div>
                <form onSubmit={handleBayar}>
                  <div style={styles.inputGroup}><label style={styles.label}>Jumlah (Rp)</label><input type="number" style={styles.input} value={payAmount} onChange={e => setPayAmount(e.target.value)} required autoFocus /></div>
                  <div style={styles.inputGroup}><label style={styles.label}>Metode</label><select style={styles.input} value={payMethod} onChange={e => setPayMethod(e.target.value)}><option value="Tunai">💵 Tunai</option><option value="Transfer">💳 Transfer</option></select></div>
                  <div style={styles.modalFooter}>
                    <button type="button" onClick={() => setShowPayModal(false)} style={styles.btnCancel}>Batal</button>
                    <button type="submit" style={styles.btnSave} disabled={isProcessing}>{isProcessing ? '⏳' : <><Save size={16} /> Bayar</>}</button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* === MODAL PERPANJANGAN === */}
        {showPerpanjangModal && (
          <div style={styles.modalOverlay} onClick={() => setShowPerpanjangModal(false)}>
            <div style={{...styles.modalContent(isMobile), maxWidth: '500px'}} onClick={e => e.stopPropagation()}>
              <div style={styles.modalHeader}>
                <h3 style={styles.modalTitle}><RefreshCw size={20} /> Perpanjang Paket</h3>
                <button onClick={() => setShowPerpanjangModal(false)} style={styles.modalClose}><X size={18} /></button>
              </div>
              <div style={styles.modalBody}>
                <div style={styles.payInfo}>
                  <span>Paket Saat Ini</span>
                  <strong>{student.detailProgram || '-'}</strong>
                </div>
                <div style={styles.payInfo}>
                  <span>Berakhir</span>
                  <strong style={{color: '#ef4444'}}>{student.tanggalSelesai || '-'}</strong>
                </div>

                <form onSubmit={handlePerpanjang}>
                  <div style={styles.inputGroup}>
                    <label style={styles.label}>Tambah Durasi</label>
                    <select style={styles.input} value={perpanjangData.durasiTambah} onChange={e => setPerpanjangData(prev => ({...prev, durasiTambah: parseInt(e.target.value)}))}>
                      <option value={1}>1 Bulan</option>
                      <option value={3}>3 Bulan (1 Term)</option>
                      <option value={6}>6 Bulan (1 Semester)</option>
                      <option value={12}>12 Bulan (1 Tahun)</option>
                    </select>
                  </div>

                  <div style={styles.inputGroup}>
                    <label style={styles.label}>Metode Pembayaran</label>
                    <div style={styles.tabRow3}>
                      <button type="button" onClick={() => setPerpanjangData(prev => ({...prev, metodeBayar: 'Tunai'}))} style={styles.methodBtn(perpanjangData.metodeBayar === 'Tunai')}>💵 Tunai</button>
                      <button type="button" onClick={() => setPerpanjangData(prev => ({...prev, metodeBayar: 'Transfer'}))} style={styles.methodBtn(perpanjangData.metodeBayar === 'Transfer')}>💳 Transfer</button>
                      <button type="button" onClick={() => setPerpanjangData(prev => ({...prev, metodeBayar: 'Cicilan'}))} style={styles.methodBtn(perpanjangData.metodeBayar === 'Cicilan')}>📋 Cicilan</button>
                    </div>
                  </div>

                  {perpanjangData.metodeBayar === 'Cicilan' && (
                    <>
                      <div style={styles.inputGroup}>
                        <label style={styles.label}>Tenor</label>
                        <div style={{display: 'flex', gap: 6}}>
                          {[1,2,3,4,5,6].map(t => (
                            <button key={t} type="button" onClick={() => setPerpanjangData(prev => ({...prev, tenor: t}))} style={styles.tenorBtn(perpanjangData.tenor === t)}>{t}x</button>
                          ))}
                        </div>
                      </div>
                      <div style={styles.inputGroup}>
                        <label style={styles.label}>Cicilan Pertama</label>
                        <input type="date" style={styles.input} value={perpanjangData.tanggalCicilan1} onChange={e => setPerpanjangData(prev => ({...prev, tanggalCicilan1: e.target.value}))} />
                      </div>
                    </>
                  )}

                  <div style={styles.modalFooter}>
                    <button type="button" onClick={() => setShowPerpanjangModal(false)} style={styles.btnCancel}>Batal</button>
                    <button type="submit" style={styles.btnSave} disabled={isProcessing}>
                      {isProcessing ? '⏳' : <><PlusCircle size={16} /> Perpanjang</>}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

      </div>
      <style>{`@keyframes toastIn{from{opacity:0;transform:translateY(-10px)}to{opacity:1;transform:translateY(0)}}@keyframes spin{0%{transform:rotate(0deg)}100%{transform:rotate(360deg)}}@keyframes slideUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}`}</style>
    </div>
  );
};

// === STYLES ===
const styles = {
  wrapper: { display: 'flex', background: '#f8fafc', minHeight: '100vh' },
  mainContent: (m) => ({ marginLeft: m ? '0' : '250px', padding: m ? '15px' : '30px', width: '100%', boxSizing: 'border-box', transition: '0.3s' }),
  toast: { position: 'fixed', top: 20, right: 20, zIndex: 9999, background: '#1e293b', color: 'white', padding: '14px 24px', borderRadius: 12, fontWeight: 'bold', fontSize: 14, boxShadow: '0 10px 30px rgba(0,0,0,0.2)', animation: 'toastIn 0.3s ease' },
  loadingState: { textAlign: 'center', padding: 80 },
  spinner: { width: 40, height: 40, border: '4px solid #e2e8f0', borderTop: '4px solid #8b5cf6', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 15px' },
  breadcrumb: (m) => ({ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 10 }),
  backBtn: { background: 'white', border: '1px solid #e2e8f0', padding: '8px 14px', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: 13, display: 'flex', alignItems: 'center', gap: 6, color: '#64748b' },
  breadcrumbTrail: { display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 },
  studentCard: (m) => ({ display: 'flex', alignItems: 'center', gap: 16, background: 'white', padding: m ? 15 : 20, borderRadius: 14, marginBottom: 20, boxShadow: '0 2px 8px rgba(0,0,0,0.04)', border: '1px solid #f1f5f9', flexWrap: m ? 'wrap' : 'nowrap' }),
  studentAvatar: { width: 50, height: 50, borderRadius: '50%', background: 'linear-gradient(135deg, #8b5cf6, #6366f1)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 'bold', flexShrink: 0 },
  studentInfo: { flex: 1, minWidth: 0 },
  studentName: { margin: 0, fontSize: 16, color: '#1e293b' },
  studentMeta: { display: 'flex', gap: 8, marginTop: 4, flexWrap: 'wrap', alignItems: 'center' },
  idBadge: { display: 'inline-flex', alignItems: 'center', gap: 4, background: '#f1f5f9', padding: '3px 10px', borderRadius: 10, fontSize: 11, fontWeight: 'bold', color: '#475569' },
  programBadge: { padding: '3px 10px', borderRadius: 10, fontSize: 11, fontWeight: 'bold', background: '#f0fdf4', color: '#166534' },
  masaBadge: { padding: '3px 10px', borderRadius: 10, fontSize: 10, fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 4 },
  lunasBadge: (isLunas) => ({ display: 'flex', alignItems: 'center', gap: 4, padding: '8px 14px', borderRadius: 12, fontSize: 12, fontWeight: 'bold', background: isLunas ? '#dcfce7' : '#fee2e2', color: isLunas ? '#166534' : '#ef4444', flexShrink: 0 }),
  gridContainer: (m) => ({ display: 'grid', gridTemplateColumns: m ? '1fr' : '1fr 400px', gap: 20 }),
  card: { background: 'white', padding: 20, borderRadius: 14, boxShadow: '0 2px 8px rgba(0,0,0,0.04)', border: '1px solid #f1f5f9' },
  cardTitle: { display: 'flex', alignItems: 'center', gap: 8, margin: '0 0 16px 0', fontSize: 14, color: '#1e293b', fontWeight: 'bold', paddingBottom: 10, borderBottom: '2px solid #f1f5f9' },
  progressSection: { marginBottom: 20 },
  progressBar: { height: 10, borderRadius: 5, background: '#f1f5f9', overflow: 'hidden' },
  progressFill: (pct) => ({ height: '100%', borderRadius: 5, background: pct >= 100 ? '#10b981' : '#3b82f6', width: `${pct}%`, transition: 'width 0.5s ease' }),
  progressLabel: { display: 'flex', justifyContent: 'space-between', marginTop: 6, fontSize: 11, color: '#64748b' },
  financeGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12 },
  financeItem: { display: 'flex', alignItems: 'center', gap: 10, padding: 12, background: '#f8fafc', borderRadius: 10 },
  financeLabel: { display: 'block', fontSize: 10, color: '#94a3b8' },
  financeValue: { fontSize: 13, color: '#1e293b' },
  btnLunasin: { width: '100%', marginTop: 12, padding: '12px', background: '#10b981', color: 'white', border: 'none', borderRadius: 10, fontWeight: 'bold', fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 },
  btnPerpanjang: { width: '100%', marginTop: 8, padding: '12px', background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)', color: 'white', border: 'none', borderRadius: 10, fontWeight: 'bold', fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, boxShadow: '0 4px 12px rgba(59,130,246,0.3)' },
  cicilanList: { display: 'flex', flexDirection: 'column', gap: 8 },
  cicilanItem: (status) => ({ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 10, borderRadius: 10, background: status === 'Lunas' ? '#f0fdf4' : '#fefce8', border: `1px solid ${status === 'Lunas' ? '#bbf7d0' : '#fef08a'}`, flexWrap: 'wrap', gap: 8 }),
  cicilanLeft: { display: 'flex', flexDirection: 'column', gap: 2 },
  cicilanNum: { fontSize: 11, fontWeight: 'bold', color: '#1e293b' },
  cicilanDate: { fontSize: 9, color: '#64748b' },
  cicilanRight: { display: 'flex', alignItems: 'center', gap: 10 },
  cicilanAmount: { fontSize: 12, color: '#1e293b' },
  badgeLunas: { padding: '3px 8px', borderRadius: 8, fontSize: 10, fontWeight: 'bold', background: '#dcfce7', color: '#166534' },
  btnBayarCicilan: { padding: '5px 12px', borderRadius: 8, background: '#f59e0b', color: 'white', border: 'none', fontWeight: 'bold', fontSize: 10, cursor: 'pointer' },
  emptyHistory: { textAlign: 'center', padding: 30, color: '#94a3b8' },
  historyList: { display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 400, overflowY: 'auto' },
  historyItem: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', borderRadius: 8, background: '#f8fafc' },
  historyLeft: { display: 'flex', alignItems: 'center', gap: 10 },
  historyDot: (cat) => ({ width: 8, height: 8, borderRadius: '50%', background: cat === 'Perpanjangan Paket' ? '#8b5cf6' : cat === 'SPP / Cicilan' ? '#f59e0b' : '#3b82f6' }),
  historyDate: { fontSize: 11, fontWeight: 'bold', color: '#1e293b' },
  historyNote: { fontSize: 9, color: '#94a3b8' },
  historyRight: { textAlign: 'right' },
  modalOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: 20 },
  modalContent: (m) => ({ background: 'white', borderRadius: 16, padding: 24, width: m ? '95%' : '420px', maxWidth: '500px', boxShadow: '0 20px 40px rgba(0,0,0,0.2)', animation: 'slideUp 0.3s ease' }),
  modalHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, paddingBottom: 12, borderBottom: '1px solid #f1f5f9' },
  modalTitle: { margin: 0, fontSize: 16, color: '#1e293b', display: 'flex', alignItems: 'center', gap: 8 },
  modalClose: { background: '#f1f5f9', border: 'none', width: 32, height: 32, borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b' },
  modalBody: {},
  modalFooter: { display: 'flex', gap: 10, marginTop: 20, paddingTop: 16, borderTop: '1px solid #f1f5f9' },
  payInfo: { display: 'flex', justifyContent: 'space-between', padding: '10px 14px', background: '#f8fafc', borderRadius: 8, marginBottom: 10, fontSize: 13 },
  inputGroup: { marginBottom: 14 },
  label: { display: 'block', fontSize: 12, fontWeight: 'bold', color: '#64748b', marginBottom: 5 },
  input: { width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 14, boxSizing: 'border-box', background: '#f8fafc' },
  tabRow3: { display: 'flex', gap: 6 },
  methodBtn: (active) => ({ flex: 1, padding: '8px', borderRadius: 8, border: active ? '2px solid #10b981' : '1px solid #e2e8f0', background: active ? '#f0fdf4' : 'white', color: active ? '#166534' : '#64748b', fontWeight: active ? 'bold' : '500', fontSize: 11, cursor: 'pointer' }),
  tenorBtn: (active) => ({ padding: '7px 14px', borderRadius: 8, border: active ? '2px solid #f59e0b' : '1px solid #e2e8f0', background: active ? '#fffbeb' : 'white', color: active ? '#b45309' : '#64748b', fontWeight: active ? 'bold' : '500', fontSize: 12, cursor: 'pointer' }),
  btnCancel: { flex: 1, padding: '12px', borderRadius: 10, border: '1px solid #e2e8f0', background: 'white', color: '#64748b', fontWeight: 'bold', fontSize: 13, cursor: 'pointer' },
  btnSave: { flex: 2, padding: '12px', borderRadius: 10, border: 'none', background: '#10b981', color: 'white', fontWeight: 'bold', fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }
};

export default StudentFinance;