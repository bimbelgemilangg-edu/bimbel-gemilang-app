import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import SidebarAdmin from '../../../components/SidebarAdmin'; 
import { db } from '../../../firebase'; 
import { doc, getDoc, collection, query, where, getDocs, addDoc, updateDoc, deleteDoc, serverTimestamp } from "firebase/firestore";
import { ArrowLeft, Home, ChevronRight, UserCheck, UserX, UserPlus, Calendar, BookOpen, Edit3, Trash2, Save, X } from 'lucide-react';

const StudentAttendance = () => {
  const navigate = useNavigate();
  const { id } = useParams(); 

  const [student, setStudent] = useState(null);
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [alertMsg, setAlertMsg] = useState(null);
  
  // State Form Manual
  const [newDate, setNewDate] = useState(new Date().toISOString().split('T')[0]);
  const [newStatus, setNewStatus] = useState("Hadir");
  const [newMapel, setNewMapel] = useState("");
  const [newKet, setNewKet] = useState("");
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const showAlert = (msg) => {
    setAlertMsg(msg);
    setTimeout(() => setAlertMsg(null), 3000);
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const docRef = doc(db, "students", id);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
          setStudent({ id: docSnap.id, ...docSnap.data() });
      } else {
          showAlert("❌ Siswa tidak ditemukan!");
          navigate('/admin/students');
          return;
      }

      const q = query(collection(db, "attendance"), where("studentId", "==", id));
      const querySnapshot = await getDocs(q);
      const data = querySnapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      data.sort((a,b) => new Date(b.tanggal) - new Date(a.tanggal));
      setAttendance(data);
    } catch (error) { console.error("Error fetching data:", error); } 
    finally { setLoading(false); }
  };

  useEffect(() => { if(id) fetchData(); }, [id]);

  const handleEdit = async (itemId, currentStatus, currentKet, currentMapel) => {
    const statusBaru = prompt("Ubah Status (Hadir/Sakit/Izin/Alpha):", currentStatus);
    if (!statusBaru) return;
    const mapelBaru = prompt("Ubah Mapel:", currentMapel || "Umum");
    const ketBaru = prompt("Ubah Keterangan:", currentKet || "-");
    try {
      await updateDoc(doc(db, "attendance", itemId), {
        status: statusBaru, mapel: mapelBaru, keterangan: ketBaru
      });
      showAlert("✅ Data berhasil diperbarui!");
      fetchData(); 
    } catch (error) { showAlert("❌ Gagal update server."); }
  };

  const handleDelete = async (itemId) => {
      if(window.confirm("Yakin ingin menghapus data absensi ini?")) {
          try {
              await deleteDoc(doc(db, "attendance", itemId));
              showAlert("🗑️ Data dihapus.");
              fetchData();
          } catch (error) { showAlert("❌ Gagal menghapus."); }
      }
  };

  const handleAddManual = async (e) => {
    e.preventDefault();
    if(!student) return;
    if(!newDate) return showAlert("⚠️ Tanggal wajib diisi!");
    try {
        await addDoc(collection(db, "attendance"), {
            studentId: id, namaSiswa: student.nama, 
            tanggal: newDate, mapel: newMapel || "Umum",
            status: newStatus, keterangan: newKet || "-",
            createdAt: serverTimestamp() 
        });
        showAlert("✅ Data Absensi Berhasil Ditambahkan!");
        setNewKet(""); setNewMapel(""); setShowForm(false);
        fetchData();
    } catch (error) { showAlert("❌ Gagal menyimpan data."); }
  };

  const getStatusBadge = (status) => {
    const badges = {
      'Hadir': { bg: '#dcfce7', color: '#166534', icon: '✅' },
      'Sakit': { bg: '#fef3c7', color: '#b45309', icon: '🤒' },
      'Izin': { bg: '#e0e7ff', color: '#3730a3', icon: '📝' },
      'Alpha': { bg: '#fee2e2', color: '#ef4444', icon: '❌' }
    };
    return badges[status] || { bg: '#f1f5f9', color: '#64748b', icon: '❓' };
  };

  const hadirCount = attendance.filter(x => x.status === 'Hadir').length;
  const izinSakitCount = attendance.filter(x => x.status === 'Sakit' || x.status === 'Izin').length;
  const alphaCount = attendance.filter(x => x.status === 'Alpha').length;

  if (loading) return (
    <div style={styles.wrapper}>
      <SidebarAdmin />
      <div style={styles.mainContent(isMobile)}>
        <div style={styles.loadingState}>
          <div style={styles.spinner}></div>
          <p>Memuat data kehadiran...</p>
        </div>
      </div>
    </div>
  );

  if (!student) return null;

  return (
    <div style={styles.wrapper}>
      <SidebarAdmin />
      <div style={styles.mainContent(isMobile)}>
        
        {/* TOAST */}
        {alertMsg && <div style={styles.toast}>{alertMsg}</div>}

        {/* BREADCRUMB + BACK */}
        <div style={styles.breadcrumb(isMobile)}>
          <button onClick={() => navigate('/admin/students')} style={styles.backButton}>
            <ArrowLeft size={16} /> Kembali ke Daftar Siswa
          </button>
          <div style={styles.breadcrumbTrail}>
            <Home size={12} color="#94a3b8" />
            <ChevronRight size={12} color="#94a3b8" />
            <span style={{color: '#94a3b8'}}>Siswa</span>
            <ChevronRight size={12} color="#94a3b8" />
            <span style={{color: '#3b82f6', fontWeight: 'bold'}}>Kehadiran</span>
          </div>
        </div>

        {/* HEADER SISWA */}
        <div style={styles.studentHeader(isMobile)}>
          <div style={styles.studentAvatar}>
            {student.nama?.charAt(0) || 'S'}
          </div>
          <div>
            <h2 style={styles.studentName(isMobile)}>{student.nama}</h2>
            <p style={styles.studentInfo}>{student.detailProgram || "Reguler"} • {student.kelasSekolah || "-"}</p>
          </div>
        </div>

        {/* RINGKASAN */}
        <div style={styles.summaryContainer(isMobile)}>
          <div style={{...styles.summaryCard, background: '#f0fdf4', borderColor: '#bbf7d0'}}>
            <UserCheck size={20} color="#166534" />
            <h3>{hadirCount}</h3>
            <span>Hadir</span>
          </div>
          <div style={{...styles.summaryCard, background: '#fef3c7', borderColor: '#fde68a'}}>
            <UserPlus size={20} color="#b45309" />
            <h3>{izinSakitCount}</h3>
            <span>Sakit/Izin</span>
          </div>
          <div style={{...styles.summaryCard, background: '#fee2e2', borderColor: '#fecaca'}}>
            <UserX size={20} color="#ef4444" />
            <h3>{alphaCount}</h3>
            <span>Alpha</span>
          </div>
        </div>

        {/* TOMBOL TAMBAH */}
        <button onClick={() => setShowForm(!showForm)} style={styles.toggleFormBtn}>
          {showForm ? <><X size={14} /> Tutup Form</> : <><UserPlus size={14} /> Tambah Absensi Manual</>}
        </button>

        {/* FORM INPUT MANUAL */}
        {showForm && (
          <form onSubmit={handleAddManual} style={styles.manualForm(isMobile)}>
            <div style={styles.formGrid(isMobile)}>
              <div style={styles.formGroup}>
                <label style={styles.formLabel}><Calendar size={12} /> Tanggal</label>
                <input type="date" value={newDate} onChange={e=>setNewDate(e.target.value)} style={styles.formInput} required />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.formLabel}><BookOpen size={12} /> Mapel</label>
                <input type="text" placeholder="IPA / MTK" value={newMapel} onChange={e=>setNewMapel(e.target.value)} style={styles.formInput} required />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.formLabel}>Status</label>
                <select value={newStatus} onChange={e=>setNewStatus(e.target.value)} style={styles.formInput}>
                  <option value="Hadir">✅ Hadir</option>
                  <option value="Sakit">🤒 Sakit</option>
                  <option value="Izin">📝 Izin</option>
                  <option value="Alpha">❌ Alpha</option>
                </select>
              </div>
              <div style={{...styles.formGroup, flex: 2}}>
                <label style={styles.formLabel}>Keterangan</label>
                <input type="text" placeholder="Alasan..." value={newKet} onChange={e=>setNewKet(e.target.value)} style={styles.formInput} />
              </div>
              <button type="submit" style={styles.btnSave}><Save size={14} /> Simpan</button>
            </div>
          </form>
        )}

        {/* TABEL DATA */}
        <div style={styles.card}>
          {attendance.length === 0 ? (
            <div style={styles.emptyState}>
              <BookOpen size={40} color="#94a3b8" />
              <p style={{fontWeight: 'bold'}}>Belum ada riwayat kehadiran</p>
              <p style={{fontSize: 13}}>Gunakan tombol "Tambah Absensi Manual" di atas.</p>
            </div>
          ) : (
            <div style={{overflowX: 'auto'}}>
              <table style={styles.table}>
                <thead>
                  <tr style={styles.thr}>
                    <th style={styles.th}>Tanggal</th>
                    <th style={styles.th}>Mapel</th>
                    <th style={styles.th}>Status</th>
                    <th style={styles.th}>Keterangan</th>
                    <th style={styles.th}>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {attendance.map((item) => {
                    const badge = getStatusBadge(item.status);
                    return (
                      <tr key={item.id} style={styles.tr}>
                        <td style={styles.td}>
                          {new Date(item.tanggal).toLocaleDateString('id-ID', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}
                        </td>
                        <td style={{...styles.td, fontWeight: 'bold'}}>{item.mapel || "-"}</td>
                        <td style={styles.td}>
                          <span style={{...styles.badge, background: badge.bg, color: badge.color}}>
                            {badge.icon} {item.status}
                          </span>
                        </td>
                        <td style={styles.td}>{item.keterangan || "-"}</td>
                        <td style={styles.td}>
                          <div style={styles.actionGroup}>
                            <button onClick={() => handleEdit(item.id, item.status, item.keterangan, item.mapel)} style={styles.btnEdit} title="Edit">
                              <Edit3 size={14} />
                            </button>
                            <button onClick={() => handleDelete(item.id)} style={styles.btnDelete} title="Hapus">
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const styles = {
  wrapper: { display: 'flex', background: '#f8fafc', minHeight: '100vh' },
  mainContent: (m) => ({ marginLeft: m ? '0' : '250px', padding: m ? '15px' : '30px', width: '100%', boxSizing: 'border-box', transition: '0.3s' }),
  
  // TOAST
  toast: { position: 'fixed', top: 20, right: 20, zIndex: 9999, background: '#1e293b', color: 'white', padding: '12px 20px', borderRadius: 12, fontWeight: 'bold', fontSize: 14, boxShadow: '0 10px 30px rgba(0,0,0,0.2)' },
  loadingState: { textAlign: 'center', padding: 80 },
  spinner: { width: 40, height: 40, border: '4px solid #f3e8ff', borderTop: '4px solid #673ab7', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 15px' },
  
  // BREADCRUMB
  breadcrumb: (m) => ({ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexDirection: m ? 'column' : 'row', gap: m ? 8 : 0 }),
  backButton: { background: 'white', border: '1px solid #e2e8f0', padding: '8px 14px', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: 13, display: 'flex', alignItems: 'center', gap: 6, color: '#64748b' },
  breadcrumbTrail: { display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 },
  
  // STUDENT HEADER
  studentHeader: (m) => ({ display: 'flex', alignItems: 'center', gap: 15, marginBottom: 25, background: 'white', padding: m ? 15 : 20, borderRadius: 14, boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }),
  studentAvatar: { width: 50, height: 50, borderRadius: '50%', background: '#673ab7', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, fontWeight: 'bold', flexShrink: 0 },
  studentName: (m) => ({ margin: 0, color: '#1e293b', fontSize: m ? 16 : 20 }),
  studentInfo: { margin: '4px 0 0', color: '#64748b', fontSize: 12 },
  
  // SUMMARY
  summaryContainer: (m) => ({ display: 'grid', gridTemplateColumns: m ? 'repeat(3, 1fr)' : 'repeat(3, 1fr)', gap: m ? 8 : 15, marginBottom: 20 }),
  summaryCard: { padding: 15, borderRadius: 12, textAlign: 'center', border: '1px solid', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 },
  
  // TOGGLE FORM
  toggleFormBtn: { width: '100%', padding: '12px', background: 'white', color: '#673ab7', border: '2px dashed #cbd5e1', borderRadius: 12, cursor: 'pointer', fontWeight: 600, fontSize: 13, marginBottom: 15, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 },
  
  // MANUAL FORM
  manualForm: (m) => ({ background: 'white', padding: m ? 15 : 20, borderRadius: 14, marginBottom: 20, border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }),
  formGrid: (m) => ({ display: 'flex', gap: 10, alignItems: 'flex-end', flexWrap: 'wrap' }),
  formGroup: { display: 'flex', flexDirection: 'column', gap: 4, flex: 1, minWidth: '120px' },
  formLabel: { fontSize: 11, fontWeight: 'bold', color: '#64748b', display: 'flex', alignItems: 'center', gap: 4 },
  formInput: { padding: '10px', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 13, width: '100%', boxSizing: 'border-box' },
  btnSave: { padding: '10px 20px', background: '#673ab7', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, alignSelf: 'flex-end' },
  
  // TABLE
  card: { background: 'white', padding: 20, borderRadius: 14, boxShadow: '0 2px 8px rgba(0,0,0,0.04)', border: '1px solid #f1f5f9' },
  emptyState: { textAlign: 'center', padding: 50, color: '#94a3b8' },
  table: { width: '100%', borderCollapse: 'collapse', minWidth: '600px' },
  thr: { background: '#f8fafc', textAlign: 'left' },
  th: { padding: '12px 15px', fontSize: 11, color: '#64748b', fontWeight: 800, textTransform: 'uppercase', borderBottom: '2px solid #f1f5f9' },
  tr: { borderBottom: '1px solid #f1f5f9' },
  td: { padding: '12px 15px', fontSize: 13, verticalAlign: 'middle' },
  badge: { padding: '4px 10px', borderRadius: 20, fontSize: 11, fontWeight: 'bold', display: 'inline-block' },
  actionGroup: { display: 'flex', gap: 6 },
  btnEdit: { background: '#fef3c7', color: '#b45309', border: 'none', padding: '8px', borderRadius: 8, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  btnDelete: { background: '#fee2e2', color: '#ef4444', border: 'none', padding: '8px', borderRadius: 8, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' },
};

export default StudentAttendance;