import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import SidebarAdmin from '../../../components/SidebarAdmin';
import { db } from '../../../firebase';
import { 
  doc, getDoc, collection, query, where, getDocs, 
  addDoc, updateDoc, deleteDoc, serverTimestamp, orderBy 
} from "firebase/firestore";
import { 
  ArrowLeft, Home, ChevronRight, UserCheck, UserX, UserPlus, 
  Calendar, BookOpen, Edit3, Trash2, Save, X, CheckCircle,
  AlertCircle, Clock, Filter, Download, RefreshCw, Search
} from 'lucide-react';
import * as XLSX from 'xlsx';

const StudentAttendance = () => {
  const navigate = useNavigate();
  const { id } = useParams();

  // === STATE ===
  const [student, setStudent] = useState(null);
  const [attendance, setAttendance] = useState([]);
  const [filteredAttendance, setFilteredAttendance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [alertMsg, setAlertMsg] = useState(null);

  // Filter
  const [filterMonth, setFilterMonth] = useState(new Date().toISOString().slice(0, 7));
  const [filterStatus, setFilterStatus] = useState('Semua');
  const [searchMapel, setSearchMapel] = useState('');

  // Form Manual
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    tanggal: new Date().toISOString().split('T')[0],
    mapel: '',
    status: 'Hadir',
    keterangan: ''
  });
  const [saving, setSaving] = useState(false);

  // Edit Modal
  const [showEditModal, setShowEditModal] = useState(false);
  const [editData, setEditData] = useState(null);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const showAlert = (msg, duration = 3000) => {
    setAlertMsg(msg);
    setTimeout(() => setAlertMsg(null), duration);
  };

  // === FETCH ===
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

      // Fetch attendance
      const q = query(
        collection(db, "attendance"),
        where("studentId", "==", studentSnap.data().studentId || id),
        orderBy("tanggal", "desc")
      );
      const snap = await getDocs(q);
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setAttendance(data);
      setFilteredAttendance(data);
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

  // === FILTER ===
  useEffect(() => {
    let filtered = [...attendance];

    // Filter bulan
    if (filterMonth) {
      filtered = filtered.filter(item => 
        (item.tanggal || '').startsWith(filterMonth)
      );
    }

    // Filter status
    if (filterStatus !== 'Semua') {
      filtered = filtered.filter(item => item.status === filterStatus);
    }

    // Search mapel
    if (searchMapel) {
      filtered = filtered.filter(item => 
        (item.mapel || '').toLowerCase().includes(searchMapel.toLowerCase())
      );
    }

    setFilteredAttendance(filtered);
  }, [attendance, filterMonth, filterStatus, searchMapel]);

  // === STATISTIK ===
  const getStats = () => {
    const data = filterMonth ? attendance.filter(item => (item.tanggal || '').startsWith(filterMonth)) : attendance;
    const hadir = data.filter(x => x.status === 'Hadir').length;
    const sakit = data.filter(x => x.status === 'Sakit').length;
    const izin = data.filter(x => x.status === 'Izin').length;
    const alpha = data.filter(x => x.status === 'Alpha').length;
    const total = data.length;
    const persentase = total > 0 ? Math.round((hadir / total) * 100) : 0;
    return { hadir, sakit, izin, alpha, total, persentase };
  };

  const stats = getStats();

  // === HELPER ===
  const getInitials = (name) => {
    if (!name) return 'S';
    return name.split(' ').map(w => w[0]?.toUpperCase()).slice(0, 2).join('');
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

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    try {
      return new Date(dateStr).toLocaleDateString('id-ID', {
        weekday: 'short', day: 'numeric', month: 'short', year: 'numeric'
      });
    } catch { return dateStr; }
  };

  // === CRUD ===
  const handleAdd = async (e) => {
    e.preventDefault();
    if (!formData.tanggal) return showAlert('⚠️ Tanggal wajib diisi!');
    
    setSaving(true);
    try {
      await addDoc(collection(db, "attendance"), {
        studentId: student?.studentId || id,
        namaSiswa: student?.nama || '',
        tanggal: formData.tanggal,
        mapel: formData.mapel || 'Umum',
        status: formData.status,
        keterangan: formData.keterangan || '-',
        createdAt: serverTimestamp()
      });

      showAlert('✅ Absensi berhasil ditambahkan!');
      setShowForm(false);
      setFormData({
        tanggal: new Date().toISOString().split('T')[0],
        mapel: '',
        status: 'Hadir',
        keterangan: ''
      });
      fetchData();
    } catch (error) {
      console.error(error);
      showAlert('❌ Gagal menyimpan');
    } finally {
      setSaving(false);
    }
  };

  const openEditModal = (item) => {
    setEditData({ ...item });
    setShowEditModal(true);
  };

  const handleEdit = async (e) => {
    e.preventDefault();
    if (!editData) return;

    setSaving(true);
    try {
      await updateDoc(doc(db, "attendance", editData.id), {
        tanggal: editData.tanggal,
        mapel: editData.mapel,
        status: editData.status,
        keterangan: editData.keterangan
      });
      showAlert('✅ Data berhasil diperbarui!');
      setShowEditModal(false);
      setEditData(null);
      fetchData();
    } catch (error) {
      console.error(error);
      showAlert('❌ Gagal update');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (itemId) => {
    if (!window.confirm('Yakin ingin menghapus data absensi ini?')) return;
    try {
      await deleteDoc(doc(db, "attendance", itemId));
      showAlert('🗑️ Data dihapus!');
      fetchData();
    } catch (error) {
      showAlert('❌ Gagal menghapus');
    }
  };

  // === EXPORT EXCEL ===
  const handleExportExcel = () => {
    if (filteredAttendance.length === 0) return showAlert('⚠️ Tidak ada data untuk diexport!');
    
    try {
      const exportData = filteredAttendance.map((item, idx) => ({
        'No': idx + 1,
        'Tanggal': item.tanggal || '-',
        'Mapel': item.mapel || '-',
        'Status': item.status || '-',
        'Keterangan': item.keterangan || '-'
      }));

      const ws = XLSX.utils.json_to_sheet(exportData);
      ws['!cols'] = [
        { wch: 5 }, { wch: 15 }, { wch: 20 }, { wch: 10 }, { wch: 30 }
      ];
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Absensi");
      XLSX.writeFile(wb, `Absensi_${student?.nama || 'Siswa'}_${filterMonth}.xlsx`);
      showAlert('✅ Export berhasil!');
    } catch (error) {
      showAlert('❌ Gagal export');
    }
  };

  // === LOADING ===
  if (loading) {
    return (
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
  }

  if (!student) return null;

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
            <span style={{color: '#3b82f6', fontWeight: 'bold'}}>Kehadiran</span>
          </div>
        </div>

        {/* STUDENT CARD */}
        <div style={styles.studentCard(isMobile)}>
          <div style={styles.studentAvatar}>{getInitials(student.nama)}</div>
          <div style={styles.studentInfo}>
            <h3 style={styles.studentName}>{student.nama}</h3>
            <div style={styles.studentMeta}>
              <span style={styles.idBadge}>📋 {student.studentId || '-'}</span>
              <span style={styles.classBadge}>{student.kelasSekolah || '-'}</span>
              <span style={styles.programBadge}>{student.kategori === 'English' ? '🇬🇧 English' : '📚 Reguler'}</span>
            </div>
          </div>
        </div>

        {/* STATS */}
        <div style={styles.statsRow(isMobile)}>
          <div style={styles.statCard('#dcfce7', '#166534')}>
            <UserCheck size={18} color="#166534" />
            <div>
              <h3>{stats.hadir}</h3>
              <span>Hadir</span>
            </div>
          </div>
          <div style={styles.statCard('#fef3c7', '#b45309')}>
            <AlertCircle size={18} color="#b45309" />
            <div>
              <h3>{stats.sakit}</h3>
              <span>Sakit</span>
            </div>
          </div>
          <div style={styles.statCard('#e0e7ff', '#3730a3')}>
            <BookOpen size={18} color="#3730a3" />
            <div>
              <h3>{stats.izin}</h3>
              <span>Izin</span>
            </div>
          </div>
          <div style={styles.statCard('#fee2e2', '#ef4444')}>
            <UserX size={18} color="#ef4444" />
            <div>
              <h3>{stats.alpha}</h3>
              <span>Alpha</span>
            </div>
          </div>
          <div style={styles.statCard('#f1f5f9', '#1e293b')}>
            <CheckCircle size={18} color={stats.persentase >= 80 ? '#10b981' : '#ef4444'} />
            <div>
              <h3>{stats.persentase}%</h3>
              <span>Kehadiran</span>
            </div>
          </div>
        </div>

        {/* FILTER BAR */}
        <div style={styles.filterBar(isMobile)}>
          <div style={styles.filterGroup}>
            <label style={styles.filterLabel}><Calendar size={12} /> Bulan</label>
            <input 
              type="month" 
              value={filterMonth} 
              onChange={e => setFilterMonth(e.target.value)}
              style={styles.filterInput}
            />
          </div>
          <div style={styles.filterGroup}>
            <label style={styles.filterLabel}><Filter size={12} /> Status</label>
            <select 
              value={filterStatus} 
              onChange={e => setFilterStatus(e.target.value)}
              style={styles.filterInput}
            >
              <option value="Semua">Semua</option>
              <option value="Hadir">✅ Hadir</option>
              <option value="Sakit">🤒 Sakit</option>
              <option value="Izin">📝 Izin</option>
              <option value="Alpha">❌ Alpha</option>
            </select>
          </div>
          <div style={styles.filterGroup}>
            <label style={styles.filterLabel}><Search size={12} /> Mapel</label>
            <input 
              type="text" 
              placeholder="Cari mapel..." 
              value={searchMapel} 
              onChange={e => setSearchMapel(e.target.value)}
              style={styles.filterInput}
            />
          </div>
          <button onClick={handleExportExcel} style={styles.btnExport(isMobile)} title="Export Excel">
            <Download size={14} /> {!isMobile && 'Export'}
          </button>
          <button onClick={fetchData} style={styles.btnRefresh(isMobile)} title="Refresh">
            <RefreshCw size={14} />
          </button>
        </div>

        {/* TOGGLE FORM */}
        <button onClick={() => setShowForm(!showForm)} style={styles.toggleFormBtn}>
          {showForm ? (
            <><X size={14} /> Tutup Form</>
          ) : (
            <><UserPlus size={14} /> Tambah Absensi Manual</>
          )}
        </button>

        {/* FORM TAMBAH */}
        {showForm && (
          <form onSubmit={handleAdd} style={styles.addForm(isMobile)}>
            <div style={styles.formGrid(isMobile)}>
              <div style={styles.formField}>
                <label style={styles.formLabel}><Calendar size={11} /> Tanggal</label>
                <input type="date" value={formData.tanggal} onChange={e => setFormData(prev => ({...prev, tanggal: e.target.value}))} style={styles.formInput} required />
              </div>
              <div style={styles.formField}>
                <label style={styles.formLabel}><BookOpen size={11} /> Mapel</label>
                <input type="text" placeholder="Matematika, IPA..." value={formData.mapel} onChange={e => setFormData(prev => ({...prev, mapel: e.target.value}))} style={styles.formInput} />
              </div>
              <div style={styles.formField}>
                <label style={styles.formLabel}>Status</label>
                <select value={formData.status} onChange={e => setFormData(prev => ({...prev, status: e.target.value}))} style={styles.formInput}>
                  <option value="Hadir">✅ Hadir</option>
                  <option value="Sakit">🤒 Sakit</option>
                  <option value="Izin">📝 Izin</option>
                  <option value="Alpha">❌ Alpha</option>
                </select>
              </div>
              <div style={{...styles.formField, flex: 2}}>
                <label style={styles.formLabel}>Keterangan</label>
                <input type="text" placeholder="Alasan..." value={formData.keterangan} onChange={e => setFormData(prev => ({...prev, keterangan: e.target.value}))} style={styles.formInput} />
              </div>
              <button type="submit" style={styles.btnSave} disabled={saving}>
                <Save size={14} /> {saving ? '...' : 'Simpan'}
              </button>
            </div>
          </form>
        )}

        {/* TABLE */}
        <div style={styles.card}>
          {filteredAttendance.length === 0 ? (
            <div style={styles.emptyState}>
              <BookOpen size={48} color="#94a3b8" />
              <p style={{fontWeight: 'bold', marginTop: 10}}>Belum ada data kehadiran</p>
              <p style={{fontSize: 13, color: '#94a3b8'}}>
                {attendance.length > 0 ? 'Tidak ada data untuk filter ini.' : 'Gunakan tombol "Tambah Absensi Manual".'}
              </p>
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
                  {filteredAttendance.map((item) => {
                    const badge = getStatusBadge(item.status);
                    return (
                      <tr key={item.id} style={styles.tr}>
                        <td style={styles.td}>{formatDate(item.tanggal)}</td>
                        <td style={{...styles.td, fontWeight: 'bold'}}>{item.mapel || '-'}</td>
                        <td style={styles.td}>
                          <span style={{
                            padding: '4px 10px', borderRadius: 20, fontSize: 11, fontWeight: 'bold',
                            background: badge.bg, color: badge.color
                          }}>
                            {badge.icon} {item.status}
                          </span>
                        </td>
                        <td style={styles.td}>{item.keterangan || '-'}</td>
                        <td style={styles.td}>
                          <div style={styles.actionGroup}>
                            <button onClick={() => openEditModal(item)} style={styles.btnEdit} title="Edit">
                              <Edit3 size={13} />
                            </button>
                            <button onClick={() => handleDelete(item.id)} style={styles.btnDelete} title="Hapus">
                              <Trash2 size={13} />
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

        {/* === MODAL EDIT === */}
        {showEditModal && editData && (
          <div style={styles.modalOverlay} onClick={() => setShowEditModal(false)}>
            <div style={styles.modalContent(isMobile)} onClick={e => e.stopPropagation()}>
              <div style={styles.modalHeader}>
                <h3 style={styles.modalTitle}><Edit3 size={18} /> Edit Absensi</h3>
                <button onClick={() => setShowEditModal(false)} style={styles.modalClose}><X size={18} /></button>
              </div>
              <form onSubmit={handleEdit}>
                <div style={styles.modalBody}>
                  <div style={styles.inputGroup}>
                    <label style={styles.formLabel}>Tanggal</label>
                    <input type="date" value={editData.tanggal || ''} onChange={e => setEditData(prev => ({...prev, tanggal: e.target.value}))} style={styles.formInput} required />
                  </div>
                  <div style={styles.inputGroup}>
                    <label style={styles.formLabel}>Mapel</label>
                    <input type="text" value={editData.mapel || ''} onChange={e => setEditData(prev => ({...prev, mapel: e.target.value}))} style={styles.formInput} />
                  </div>
                  <div style={styles.inputGroup}>
                    <label style={styles.formLabel}>Status</label>
                    <select value={editData.status || 'Hadir'} onChange={e => setEditData(prev => ({...prev, status: e.target.value}))} style={styles.formInput}>
                      <option value="Hadir">✅ Hadir</option>
                      <option value="Sakit">🤒 Sakit</option>
                      <option value="Izin">📝 Izin</option>
                      <option value="Alpha">❌ Alpha</option>
                    </select>
                  </div>
                  <div style={styles.inputGroup}>
                    <label style={styles.formLabel}>Keterangan</label>
                    <input type="text" value={editData.keterangan || ''} onChange={e => setEditData(prev => ({...prev, keterangan: e.target.value}))} style={styles.formInput} />
                  </div>
                </div>
                <div style={styles.modalFooter}>
                  <button type="button" onClick={() => setShowEditModal(false)} style={styles.btnCancel}>Batal</button>
                  <button type="submit" style={styles.btnSaveModal} disabled={saving}>
                    {saving ? '⏳' : <><Save size={14} /> Update</>}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes toastIn { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  );
};

// === STYLES ===
const styles = {
  wrapper: { display: 'flex', background: '#f8fafc', minHeight: '100vh' },
  mainContent: (m) => ({ marginLeft: m ? '0' : '250px', padding: m ? '15px' : '30px', width: '100%', boxSizing: 'border-box', transition: '0.3s' }),

  // Toast & Loading
  toast: { position: 'fixed', top: 20, right: 20, zIndex: 9999, background: '#1e293b', color: 'white', padding: '14px 24px', borderRadius: 12, fontWeight: 'bold', fontSize: 14, boxShadow: '0 10px 30px rgba(0,0,0,0.2)', animation: 'toastIn 0.3s ease' },
  loadingState: { textAlign: 'center', padding: 80 },
  spinner: { width: 40, height: 40, border: '4px solid #e2e8f0', borderTop: '4px solid #3b82f6', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 15px' },

  // Breadcrumb
  breadcrumb: (m) => ({ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 10 }),
  backBtn: { background: 'white', border: '1px solid #e2e8f0', padding: '8px 14px', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: 13, display: 'flex', alignItems: 'center', gap: 6, color: '#64748b' },
  breadcrumbTrail: { display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 },

  // Student Card
  studentCard: (m) => ({ display: 'flex', alignItems: 'center', gap: 16, background: 'white', padding: m ? 15 : 20, borderRadius: 14, marginBottom: 20, boxShadow: '0 2px 8px rgba(0,0,0,0.04)', border: '1px solid #f1f5f9', flexWrap: m ? 'wrap' : 'nowrap' }),
  studentAvatar: { width: 50, height: 50, borderRadius: '50%', background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 'bold', flexShrink: 0 },
  studentInfo: { flex: 1, minWidth: 0 },
  studentName: { margin: 0, fontSize: 16, color: '#1e293b' },
  studentMeta: { display: 'flex', gap: 8, marginTop: 4, flexWrap: 'wrap' },
  idBadge: { background: '#f1f5f9', padding: '3px 10px', borderRadius: 10, fontSize: 11, fontWeight: 'bold', color: '#475569' },
  classBadge: { background: '#e0e7ff', padding: '3px 10px', borderRadius: 10, fontSize: 11, fontWeight: 'bold', color: '#3730a3' },
  programBadge: { padding: '3px 10px', borderRadius: 10, fontSize: 11, fontWeight: 'bold', background: '#f0fdf4', color: '#166534' },

  // Stats
  statsRow: (m) => ({ display: 'flex', gap: m ? 8 : 12, marginBottom: 20, flexWrap: 'wrap' }),
  statCard: (bg, color) => ({ flex: 1, minWidth: 80, background: bg, padding: 12, borderRadius: 12, display: 'flex', alignItems: 'center', gap: 10, border: `1px solid ${color}20` }),

  // Filter
  filterBar: (m) => ({ display: 'flex', gap: 8, marginBottom: 15, flexWrap: 'wrap', alignItems: 'flex-end' }),
  filterGroup: { display: 'flex', flexDirection: 'column', gap: 4, flex: 1, minWidth: 120 },
  filterLabel: { fontSize: 10, fontWeight: 'bold', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: 4 },
  filterInput: { padding: '8px 10px', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 12, background: 'white', width: '100%', boxSizing: 'border-box' },
  btnExport: (m) => ({ padding: '8px 14px', borderRadius: 8, background: '#10b981', color: 'white', border: 'none', cursor: 'pointer', fontWeight: 'bold', fontSize: 12, display: 'flex', alignItems: 'center', gap: 4, whiteSpace: 'nowrap' }),
  btnRefresh: (m) => ({ padding: '8px', borderRadius: 8, background: 'white', color: '#64748b', border: '1px solid #e2e8f0', cursor: 'pointer', display: 'flex', alignItems: 'center' }),

  // Toggle Form
  toggleFormBtn: { width: '100%', padding: '10px', background: 'white', color: '#3b82f6', border: '2px dashed #cbd5e1', borderRadius: 10, cursor: 'pointer', fontWeight: 600, fontSize: 13, marginBottom: 15, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 },

  // Form
  addForm: (m) => ({ background: 'white', padding: m ? 15 : 20, borderRadius: 14, marginBottom: 20, border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }),
  formGrid: (m) => ({ display: 'flex', gap: 10, alignItems: 'flex-end', flexWrap: 'wrap' }),
  formField: { display: 'flex', flexDirection: 'column', gap: 4, flex: 1, minWidth: '120px' },
  formLabel: { fontSize: 11, fontWeight: 'bold', color: '#64748b', display: 'flex', alignItems: 'center', gap: 4 },
  formInput: { padding: '10px', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 13, width: '100%', boxSizing: 'border-box', background: '#f8fafc' },
  btnSave: { padding: '10px 20px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, alignSelf: 'flex-end' },

  // Table
  card: { background: 'white', borderRadius: 14, boxShadow: '0 2px 8px rgba(0,0,0,0.04)', border: '1px solid #f1f5f9', overflow: 'hidden' },
  emptyState: { textAlign: 'center', padding: 50, color: '#94a3b8' },
  table: { width: '100%', borderCollapse: 'collapse', minWidth: 600 },
  thr: { background: '#f8fafc', textAlign: 'left' },
  th: { padding: '12px 15px', fontSize: 11, color: '#64748b', fontWeight: 800, textTransform: 'uppercase', borderBottom: '2px solid #f1f5f9' },
  tr: { borderBottom: '1px solid #f1f5f9', transition: '0.2s' },
  td: { padding: '12px 15px', fontSize: 13, verticalAlign: 'middle' },
  actionGroup: { display: 'flex', gap: 5 },
  btnEdit: { background: '#fef3c7', color: '#b45309', border: 'none', padding: '7px', borderRadius: 8, cursor: 'pointer', display: 'flex', alignItems: 'center' },
  btnDelete: { background: '#fee2e2', color: '#ef4444', border: 'none', padding: '7px', borderRadius: 8, cursor: 'pointer', display: 'flex', alignItems: 'center' },

  // Modal
  modalOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: 20 },
  modalContent: (m) => ({ background: 'white', borderRadius: 16, padding: 24, width: m ? '95%' : '420px', maxWidth: '450px', boxShadow: '0 20px 40px rgba(0,0,0,0.2)', animation: 'slideUp 0.3s ease' }),
  modalHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, paddingBottom: 12, borderBottom: '1px solid #f1f5f9' },
  modalTitle: { margin: 0, fontSize: 16, color: '#1e293b', display: 'flex', alignItems: 'center', gap: 8 },
  modalClose: { background: '#f1f5f9', border: 'none', width: 32, height: 32, borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b' },
  modalBody: { display: 'flex', flexDirection: 'column', gap: 12 },
  modalFooter: { display: 'flex', gap: 10, marginTop: 20, paddingTop: 16, borderTop: '1px solid #f1f5f9' },
  inputGroup: { display: 'flex', flexDirection: 'column', gap: 4 },
  btnCancel: { flex: 1, padding: '12px', borderRadius: 10, border: '1px solid #e2e8f0', background: 'white', color: '#64748b', fontWeight: 'bold', fontSize: 13, cursor: 'pointer' },
  btnSaveModal: { flex: 2, padding: '12px', borderRadius: 10, border: 'none', background: '#3b82f6', color: 'white', fontWeight: 'bold', fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }
};

export default StudentAttendance;