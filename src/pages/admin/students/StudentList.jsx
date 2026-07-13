// src/pages/admin/students/StudentList.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import SidebarAdmin from '../../../components/SidebarAdmin';
import { db } from '../../../firebase';
import { collection, getDocs, deleteDoc, doc, updateDoc } from "firebase/firestore";
import * as XLSX from 'xlsx';
import { 
  Search, Plus, Edit3, Trash2, UserCheck, UserX, Users,
  Home, ChevronRight, BookOpen, RefreshCw, AlertCircle, CheckCircle,
  CreditCard, Calendar, Clock, Hash, Download, PieChart, BarChart3,
  FileSpreadsheet, Printer, Bell, Zap, Send, Mail, User, GraduationCap,
  Layers, TrendingUp, Award, Filter, X, Eye
} from 'lucide-react';

const StudentList = () => {
  const navigate = useNavigate();
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('semua');
  const [filterStatus, setFilterStatus] = useState('semua');
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [alertMsg, setAlertMsg] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [showAccessModal, setShowAccessModal] = useState(false);
  const [sendingAccess, setSendingAccess] = useState(false);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const showAlert = (msg) => {
    setAlertMsg(msg);
    setTimeout(() => setAlertMsg(null), 3000);
  };

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const snap = await getDocs(collection(db, "students"));
      const data = snap.docs.map(d => ({ 
        id: d.id, 
        ...d.data(),
        studentId: d.data().studentId || d.id
      }));
      data.sort((a, b) => (a.nama || '').localeCompare(b.nama || ''));
      setStudents(data);
    } catch (error) { 
      console.error("Fetch error:", error); 
    } finally { 
      setLoading(false); 
    }
  };

  useEffect(() => { fetchStudents(); }, []);

  // === HELPER FUNCTIONS ===
  const getJenjang = (s) => {
    if (s.kategori === 'English') return 'english';
    const kelas = s.kelasSekolah || '';
    if (kelas.includes('SMA')) return 'sma';
    if (kelas.includes('SMP')) return 'smp';
    if (kelas.includes('SD')) return 'sd';
    return 'sd';
  };

  const getJenjangLabel = (jenjang) => {
    const map = { sd: 'SD', smp: 'SMP', sma: 'SMA', english: '🇬🇧 English' };
    return map[jenjang] || jenjang;
  };

  const getMasaAktifStatus = (s) => {
    if (!s.tanggalSelesai) return { label: 'Tidak Diketahui', color: '#94a3b8', bg: '#f1f5f9', days: null };
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const selesai = new Date(s.tanggalSelesai);
    selesai.setHours(0, 0, 0, 0);
    
    const diffDays = Math.ceil((selesai - today) / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return { label: 'Habis', color: '#ef4444', bg: '#fee2e2', days: diffDays };
    if (diffDays <= 30) return { label: `${diffDays} hari`, color: '#f59e0b', bg: '#fef3c7', days: diffDays };
    if (diffDays <= 90) return { label: `${diffDays} hari`, color: '#3b82f6', bg: '#dbeafe', days: diffDays };
    return { label: 'Aktif', color: '#10b981', bg: '#dcfce7', days: diffDays };
  };

  const getDurasiBulan = (s) => {
    if (!s.tanggalMulai) return 0;
    const mulai = new Date(s.tanggalMulai);
    const sekarang = new Date();
    const bulan = (sekarang.getFullYear() - mulai.getFullYear()) * 12 + (sekarang.getMonth() - mulai.getMonth());
    return Math.max(0, bulan);
  };

  const getSisaTagihan = (s) => {
    const total = parseInt(s.totalTagihan || 0);
    const bayar = parseInt(s.totalBayar || 0);
    return total - bayar;
  };

  const getInitials = (name) => {
    if (!name) return 'S';
    return name.split(' ').map(w => w[0]?.toUpperCase()).slice(0, 2).join('');
  };

  // === FILTER BY TAB ===
  const getFilteredByTab = () => {
    let filtered = students;
    
    if (activeTab !== 'semua') {
      filtered = filtered.filter(s => getJenjang(s) === activeTab);
    }
    
    if (filterStatus === 'aktif') {
      filtered = filtered.filter(s => !s.isBlocked);
    } else if (filterStatus === 'blokir') {
      filtered = filtered.filter(s => s.isBlocked);
    } else if (filterStatus === 'habis') {
      filtered = filtered.filter(s => {
        if (!s.tanggalSelesai) return false;
        const selesai = new Date(s.tanggalSelesai);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        selesai.setHours(0, 0, 0, 0);
        return selesai < today && !s.isBlocked;
      });
    } else if (filterStatus === 'akan-habis') {
      filtered = filtered.filter(s => {
        if (!s.tanggalSelesai || s.isBlocked) return false;
        const selesai = new Date(s.tanggalSelesai);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        selesai.setHours(0, 0, 0, 0);
        const diffDays = Math.ceil((selesai - today) / (1000 * 60 * 60 * 24));
        return diffDays >= 0 && diffDays <= 30;
      });
    }
    
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(s => 
        (s.nama || '').toLowerCase().includes(term) ||
        (s.studentId || '').toLowerCase().includes(term) ||
        (s.kelasSekolah || '').toLowerCase().includes(term)
      );
    }
    
    return filtered;
  };

  const filteredStudents = getFilteredByTab();

  // === STATISTICS PER JENJANG ===
  const getStats = (jenjang) => {
    const list = jenjang === 'semua' ? students : students.filter(s => getJenjang(s) === jenjang);
    const total = list.length;
    const aktif = list.filter(s => !s.isBlocked).length;
    const blokir = list.filter(s => s.isBlocked).length;
    const habis = list.filter(s => {
      if (!s.tanggalSelesai || s.isBlocked) return false;
      const selesai = new Date(s.tanggalSelesai);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      selesai.setHours(0, 0, 0, 0);
      return selesai < today;
    }).length;
    const akanHabis = list.filter(s => {
      if (!s.tanggalSelesai || s.isBlocked) return false;
      const selesai = new Date(s.tanggalSelesai);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      selesai.setHours(0, 0, 0, 0);
      const diffDays = Math.ceil((selesai - today) / (1000 * 60 * 60 * 24));
      return diffDays >= 0 && diffDays <= 30;
    }).length;
    
    return { total, aktif, blokir, habis, akanHabis };
  };

  // === DURASI DISTRIBUTION PER JENJANG ===
  const getDurasiDistribution = (jenjang) => {
    const list = jenjang === 'semua' ? students : students.filter(s => getJenjang(s) === jenjang);
    const dist = { '1': 0, '3': 0, '6': 0, '12': 0, '24': 0, 'Lainnya': 0 };
    list.forEach(s => {
      const durasi = s.durasiBulan || 0;
      if (durasi === 1) dist['1']++;
      else if (durasi === 3) dist['3']++;
      else if (durasi === 6) dist['6']++;
      else if (durasi === 12) dist['12']++;
      else if (durasi === 24) dist['24']++;
      else if (durasi > 0) dist['Lainnya']++;
    });
    return dist;
  };

  // === HANDLERS ===
  const handleDelete = async (id, nama) => {
    if (!window.confirm(`Yakin ingin menghapus "${nama}"?`)) return;
    setDeleting(id);
    try {
      await deleteDoc(doc(db, "students", id));
      showAlert(`🗑️ "${nama}" berhasil dihapus!`);
      fetchStudents();
    } catch (error) { 
      showAlert("❌ Gagal menghapus: " + error.message); 
    }
    setDeleting(null);
  };

  const handleToggleBlock = async (id, currentStatus, nama) => {
    const newStatus = !currentStatus;
    try {
      await updateDoc(doc(db, "students", id), { isBlocked: newStatus });
      showAlert(`${newStatus ? '🚫' : '✅'} "${nama}" ${newStatus ? 'diblokir' : 'diaktifkan kembali'}!`);
      fetchStudents();
    } catch (error) {
      showAlert("❌ Gagal update status: " + error.message);
    }
  };

  const handleSendAccess = (student) => {
    setSelectedStudent(student);
    setShowAccessModal(true);
  };

  const confirmSendAccess = async () => {
    if (!selectedStudent) return;
    setSendingAccess(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      showAlert(`✅ Akses login dikirim ke ${selectedStudent.nama}`);
      setShowAccessModal(false);
    } catch (error) {
      showAlert('❌ Gagal mengirim akses');
    }
    setSendingAccess(false);
  };

  // === EXPORT EXCEL ===
  const handleExportExcel = (dataToExport, filename = 'Laporan_Siswa') => {
    if (dataToExport.length === 0) {
      showAlert('⚠️ Tidak ada data untuk diexport!');
      return;
    }

    try {
      const exportData = dataToExport.map((s, idx) => ({
        'No': idx + 1,
        'ID Siswa': s.studentId || '-',
        'Nama': s.nama || '-',
        'Jenjang': getJenjangLabel(getJenjang(s)),
        'Kelas': s.kelasSekolah || '-',
        'Program': s.kategori || 'Reguler',
        'Durasi Awal (Bulan)': s.durasiBulan || 0,
        'Durasi Berjalan (Bulan)': getDurasiBulan(s),
        'Tanggal Mulai': s.tanggalMulai || '-',
        'Tanggal Selesai': s.tanggalSelesai || '-',
        'Sisa Hari': getMasaAktifStatus(s).days !== null ? getMasaAktifStatus(s).days : '-',
        'Status Masa': getMasaAktifStatus(s).label,
        'Total Tagihan': s.totalTagihan || 0,
        'Total Bayar': s.totalBayar || 0,
        'Sisa Tagihan': getSisaTagihan(s),
        'Status Akun': s.isBlocked ? 'Blokir' : 'Aktif',
        'No HP': s.ortu?.hp || '-',
        'Ayah': s.ortu?.ayah || '-',
        'Ibu': s.ortu?.ibu || '-'
      }));

      const ws = XLSX.utils.json_to_sheet(exportData);
      ws['!cols'] = [
        { wch: 5 }, { wch: 15 }, { wch: 20 }, { wch: 10 }, { wch: 12 },
        { wch: 12 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 15 },
        { wch: 12 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 15 },
        { wch: 12 }, { wch: 15 }, { wch: 15 }, { wch: 15 }
      ];
      
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Siswa");
      XLSX.writeFile(wb, `${filename}_${new Date().toISOString().split('T')[0]}.xlsx`);
      showAlert(`✅ Export ${exportData.length} data berhasil!`);
    } catch (error) {
      console.error(error);
      showAlert('❌ Gagal export data');
    }
  };

  const handleExport = () => {
    handleExportExcel(filteredStudents, 'Siswa');
  };

  // === TABS ===
  const tabs = [
    { id: 'semua', label: 'Semua', icon: <Users size={16} /> },
    { id: 'sd', label: 'SD', icon: <GraduationCap size={16} /> },
    { id: 'smp', label: 'SMP', icon: <GraduationCap size={16} /> },
    { id: 'sma', label: 'SMA', icon: <GraduationCap size={16} /> },
    { id: 'english', label: 'English', icon: <BookOpen size={16} /> },
  ];

  const statusOptions = [
    { id: 'semua', label: 'Semua Status' },
    { id: 'aktif', label: '✅ Aktif' },
    { id: 'akan-habis', label: '⏳ Akan Habis' },
    { id: 'habis', label: '⛔ Habis' },
    { id: 'blokir', label: '🚫 Blokir' },
  ];

  if (loading) return (
    <div style={styles.wrapper}>
      <SidebarAdmin />
      <div style={styles.mainContent}>
        <div style={styles.loadingState}>
          <div style={styles.spinner}></div>
          <p>Memuat data siswa...</p>
        </div>
      </div>
    </div>
  );

  return (
    <div style={styles.wrapper}>
      <SidebarAdmin />
      <div style={styles.mainContent}>
        
        {alertMsg && <div style={styles.toast}>{alertMsg}</div>}

        {/* ACCESS MODAL */}
        {showAccessModal && selectedStudent && (
          <div style={styles.modalOverlay} onClick={() => setShowAccessModal(false)}>
            <div style={styles.modal} onClick={e => e.stopPropagation()}>
              <div style={styles.modalHeader}>
                <h3 style={styles.modalTitle}><Send size={18} /> Kirim Akses Login</h3>
                <button onClick={() => setShowAccessModal(false)} style={styles.modalClose}>✕</button>
              </div>
              <div style={styles.modalBody}>
                <div style={styles.modalStudent}>
                  <div style={styles.modalAvatar}>{getInitials(selectedStudent.nama)}</div>
                  <div>
                    <div style={styles.modalName}>{selectedStudent.nama}</div>
                    <div style={styles.modalId}>{selectedStudent.studentId}</div>
                  </div>
                </div>
                <div style={styles.modalAccessInfo}>
                  <div style={styles.modalAccessRow}>
                    <span style={styles.modalAccessLabel}>👤 Username</span>
                    <code style={styles.modalAccessValue}>{selectedStudent.username || 'belum dibuat'}</code>
                  </div>
                  <div style={styles.modalAccessRow}>
                    <span style={styles.modalAccessLabel}>🔑 Password</span>
                    <code style={styles.modalAccessValue}>{selectedStudent.password || 'belum dibuat'}</code>
                  </div>
                  <div style={styles.modalAccessRow}>
                    <span style={styles.modalAccessLabel}>📱 No HP</span>
                    <span style={styles.modalAccessValue}>{selectedStudent.ortu?.hp || '-'}</span>
                  </div>
                </div>
                <div style={styles.modalNote}>
                  <AlertCircle size={14} color="#f59e0b" />
                  <span>Akses akan dikirim via WhatsApp ke nomor orang tua</span>
                </div>
              </div>
              <div style={styles.modalFooter}>
                <button onClick={() => setShowAccessModal(false)} style={styles.modalCancel}>
                  Batal
                </button>
                <button onClick={confirmSendAccess} style={styles.modalSend} disabled={sendingAccess}>
                  {sendingAccess ? '⏳ Mengirim...' : '📤 Kirim Akses'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* HEADER */}
        <div style={styles.header}>
          <div>
            <h2 style={styles.pageTitle}><Users size={22} /> Manajemen Siswa</h2>
            <p style={styles.subtitle}>
              Kelola semua data siswa, pantau masa aktif, dan kirim akses aplikasi
            </p>
          </div>
          <div style={styles.headerActions}>
            <button onClick={handleExport} style={styles.btnExport}>
              <FileSpreadsheet size={16} /> Export
            </button>
            <button onClick={() => navigate('/admin/students/add')} style={styles.btnAdd}>
              <Plus size={18} /> Tambah Siswa
            </button>
          </div>
        </div>

        {/* TABS JENJANG */}
        <div style={styles.tabsContainer}>
          {tabs.map(tab => {
            const stats = getStats(tab.id);
            return (
              <button
                key={tab.id}
                style={{
                  ...styles.tabButton,
                  background: activeTab === tab.id ? '#3b82f6' : 'white',
                  color: activeTab === tab.id ? 'white' : '#64748b',
                  borderColor: activeTab === tab.id ? '#3b82f6' : '#e2e8f0'
                }}
                onClick={() => setActiveTab(tab.id)}
              >
                <span style={styles.tabIcon}>{tab.icon}</span>
                <span style={styles.tabLabel}>{tab.label}</span>
                <span style={{
                  ...styles.tabCount,
                  background: activeTab === tab.id ? 'rgba(255,255,255,0.2)' : '#f1f5f9',
                  color: activeTab === tab.id ? 'white' : '#64748b'
                }}>
                  {stats.total}
                </span>
              </button>
            );
          })}
        </div>

        {/* STATS CARDS */}
        <div style={styles.statsGrid}>
          {[
            { key: 'total', label: 'Total', icon: <Users size={16} />, value: getStats(activeTab).total, color: '#3b82f6' },
            { key: 'aktif', label: 'Aktif', icon: <CheckCircle size={16} />, value: getStats(activeTab).aktif, color: '#10b981' },
            { key: 'akan-habis', label: 'Akan Habis', icon: <Bell size={16} />, value: getStats(activeTab).akanHabis, color: '#f59e0b' },
            { key: 'habis', label: 'Habis', icon: <AlertCircle size={16} />, value: getStats(activeTab).habis, color: '#ef4444' },
            { key: 'blokir', label: 'Blokir', icon: <UserX size={16} />, value: getStats(activeTab).blokir, color: '#94a3b8' },
          ].map(stat => (
            <div key={stat.key} style={{...styles.statCard, borderColor: stat.color + '40'}}>
              <div style={{...styles.statIcon, background: stat.color + '15', color: stat.color}}>
                {stat.icon}
              </div>
              <div style={styles.statInfo}>
                <div style={styles.statLabel}>{stat.label}</div>
                <div style={styles.statNumber}>{stat.value}</div>
              </div>
            </div>
          ))}
        </div>

        {/* DURASI CHART */}
        <div style={styles.chartCard}>
          <div style={styles.chartHeader}>
            <h4 style={styles.chartTitle}><BarChart3 size={18} /> Distribusi Durasi Belajar</h4>
            <span style={styles.chartSubtitle}>
              {activeTab === 'semua' ? 'Semua Jenjang' : getJenjangLabel(activeTab)}
            </span>
          </div>
          <div style={styles.chartGrid}>
            {Object.entries(getDurasiDistribution(activeTab)).map(([durasi, count]) => {
              const total = filteredStudents.filter(s => s.durasiBulan > 0).length || 1;
              const percentage = Math.round((count / total) * 100);
              const colors = {
                '1': '#3b82f6',
                '3': '#10b981',
                '6': '#f59e0b',
                '12': '#8b5cf6',
                '24': '#ef4444',
                'Lainnya': '#94a3b8'
              };
              return (
                <div key={durasi} style={styles.chartItem}>
                  <div style={styles.chartLabel}>
                    <span>{durasi} Bulan</span>
                    <span style={styles.chartCount}>{count}</span>
                  </div>
                  <div style={styles.chartTrack}>
                    <div style={{
                      ...styles.chartFill,
                      width: `${Math.max(percentage, 2)}%`,
                      background: colors[durasi] || '#94a3b8'
                    }}>
                      {percentage > 10 && <span style={styles.chartPercent}>{percentage}%</span>}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* FILTER & SEARCH */}
        <div style={styles.toolbar}>
          <div style={styles.searchBox}>
            <Search size={16} color="#94a3b8" />
            <input 
              placeholder="Cari nama, ID, atau kelas..." 
              value={searchTerm} 
              onChange={e => setSearchTerm(e.target.value)} 
              style={styles.searchInput} 
            />
            {searchTerm && (
              <button onClick={() => setSearchTerm('')} style={styles.clearBtn}>✕</button>
            )}
          </div>
          <div style={styles.filterGroup}>
            <select 
              value={filterStatus} 
              onChange={e => setFilterStatus(e.target.value)} 
              style={styles.filterSelect}
            >
              {statusOptions.map(opt => (
                <option key={opt.id} value={opt.id}>{opt.label}</option>
              ))}
            </select>
            <button onClick={fetchStudents} style={styles.btnRefresh}>
              <RefreshCw size={14} />
            </button>
          </div>
        </div>

        {/* STUDENT TABLE */}
        <div style={styles.tableCard}>
          <div style={styles.tableHeader}>
            <span style={styles.tableTitle}>
              <Users size={16} /> {filteredStudents.length} Siswa
            </span>
            <span style={styles.tableSubtitle}>
              {getStats(activeTab).aktif} aktif • {getStats(activeTab).blokir} blokir
            </span>
          </div>

          {filteredStudents.length === 0 ? (
            <div style={styles.emptyState}>
              <BookOpen size={48} color="#94a3b8" />
              <p style={styles.emptyText}>
                {searchTerm ? 'Tidak ada siswa yang cocok' : 'Belum ada siswa terdaftar'}
              </p>
            </div>
          ) : (
            <div style={styles.tableWrapper}>
              <table style={styles.table}>
                <thead>
                  <tr style={styles.thead}>
                    <th style={{...styles.th, width: 40}}>#</th>
                    <th style={styles.th}>Siswa</th>
                    <th style={styles.th}>Kelas</th>
                    <th style={styles.th}>Durasi</th>
                    <th style={styles.th}>Masa Aktif</th>
                    <th style={styles.th}>Tagihan</th>
                    <th style={styles.th}>Status</th>
                    <th style={{...styles.th, width: 180}}>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStudents.map((s, idx) => {
                    const masa = getMasaAktifStatus(s);
                    const durasiAwal = s.durasiBulan || 0;
                    const sisaTagihan = getSisaTagihan(s);
                    const isAkanHabis = masa.days !== null && masa.days >= 0 && masa.days <= 30;
                    const isHabis = masa.days !== null && masa.days < 0;
                    
                    return (
                      <tr key={s.id} style={{
                        ...styles.tr,
                        background: isAkanHabis && !s.isBlocked ? '#fffbeb' : 'transparent',
                        opacity: s.isBlocked ? 0.5 : 1
                      }}>
                        <td style={styles.td}>{idx + 1}</td>
                        <td style={styles.td}>
                          <div style={styles.studentCell}>
                            <div style={styles.avatar}>
                              {getInitials(s.nama)}
                            </div>
                            <div>
                              <div style={styles.studentName}>
                                {s.nama}
                                {isAkanHabis && !s.isBlocked && (
                                  <span style={styles.warningDot}>⏳</span>
                                )}
                                {isHabis && !s.isBlocked && (
                                  <span style={styles.dangerDot}>⛔</span>
                                )}
                              </div>
                              <div style={styles.studentId}>{s.studentId}</div>
                            </div>
                          </div>
                        </td>
                        <td style={styles.td}>
                          <span style={styles.kelasBadge}>{s.kelasSekolah || '-'}</span>
                        </td>
                        <td style={styles.td}>
                          <span style={{
                            ...styles.durasiBadge,
                            background: durasiAwal >= 12 ? '#dcfce7' : durasiAwal >= 6 ? '#fef3c7' : '#fee2e2',
                            color: durasiAwal >= 12 ? '#166534' : durasiAwal >= 6 ? '#b45309' : '#ef4444'
                          }}>
                            {durasiAwal > 0 ? `${durasiAwal} bln` : '-'}
                          </span>
                        </td>
                        <td style={styles.td}>
                          <span style={{
                            ...styles.masaBadge,
                            background: masa.bg,
                            color: masa.color
                          }}>
                            {masa.label}
                          </span>
                        </td>
                        <td style={styles.td}>
                          <span style={{
                            ...styles.tagihanBadge,
                            color: sisaTagihan > 0 ? '#ef4444' : '#10b981'
                          }}>
                            Rp {sisaTagihan.toLocaleString()}
                          </span>
                        </td>
                        <td style={styles.td}>
                          <span style={{
                            ...styles.statusBadge,
                            background: s.isBlocked ? '#fee2e2' : '#dcfce7',
                            color: s.isBlocked ? '#ef4444' : '#166534'
                          }}>
                            {s.isBlocked ? 'Blokir' : 'Aktif'}
                          </span>
                        </td>
                        <td style={styles.td}>
                          <div style={styles.actionGroup}>
                            <button 
                              onClick={() => handleSendAccess(s)} 
                              style={{...styles.btnAction, background: '#e0e7ff', color: '#3730a3'}}
                              title="Kirim Akses"
                            >
                              <Send size={14} />
                            </button>
                            <button 
                              onClick={() => navigate(`/admin/students/finance/${s.id}`)} 
                              style={{...styles.btnAction, background: '#dbeafe', color: '#1e40af'}}
                              title="Keuangan"
                            >
                              <CreditCard size={14} />
                            </button>
                            <button 
                              onClick={() => navigate(`/admin/students/edit/${s.id}`)} 
                              style={{...styles.btnAction, background: '#fef3c7', color: '#b45309'}}
                              title="Edit"
                            >
                              <Edit3 size={14} />
                            </button>
                            <button 
                              onClick={() => handleToggleBlock(s.id, s.isBlocked, s.nama)} 
                              style={{...styles.btnAction, background: s.isBlocked ? '#dcfce7' : '#fee2e2', color: s.isBlocked ? '#166534' : '#ef4444'}}
                              title={s.isBlocked ? 'Aktifkan' : 'Blokir'}
                            >
                              {s.isBlocked ? <CheckCircle size={14} /> : <UserX size={14} />}
                            </button>
                            <button 
                              onClick={() => handleDelete(s.id, s.nama)} 
                              disabled={deleting === s.id}
                              style={{...styles.btnAction, background: '#fee2e2', color: '#ef4444', opacity: deleting === s.id ? 0.5 : 1}}
                              title="Hapus"
                            >
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

        {/* FOOTER */}
        <div style={styles.footer}>
          <span style={styles.footerText}>
            Menampilkan {filteredStudents.length} dari {students.length} siswa
          </span>
          <div style={styles.footerActions}>
            <button onClick={handleExport} style={styles.footerBtn}>
              <Download size={14} /> Export
            </button>
            <button onClick={fetchStudents} style={styles.footerBtn}>
              <RefreshCw size={14} /> Refresh
            </button>
          </div>
        </div>

        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          @keyframes slideIn {
            from { opacity: 0; transform: translateY(-10px); }
            to { opacity: 1; transform: translateY(0); }
          }
        `}</style>

      </div>
    </div>
  );
};

// ============================================================
// STYLES
// ============================================================
const styles = {
  wrapper: {
    display: 'flex',
    minHeight: '100vh',
    background: '#f1f5f9'
  },

  mainContent: {
    marginLeft: '270px',
    padding: '24px 32px',
    width: 'calc(100% - 270px)',
    minHeight: '100vh',
    background: '#f1f5f9',
    boxSizing: 'border-box'
  },

  toast: {
    position: 'fixed',
    top: 20,
    right: 20,
    zIndex: 9999,
    background: '#1e293b',
    color: 'white',
    padding: '12px 24px',
    borderRadius: 10,
    fontWeight: 600,
    fontSize: 14,
    boxShadow: '0 10px 40px rgba(0,0,0,0.2)',
    animation: 'slideIn 0.3s ease'
  },

  loadingState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '60vh'
  },

  spinner: {
    width: 40,
    height: 40,
    border: '4px solid #e2e8f0',
    borderTop: '4px solid #3b82f6',
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
    marginBottom: 16
  },

  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 24,
    flexWrap: 'wrap',
    gap: 12
  },

  pageTitle: {
    margin: 0,
    fontSize: 22,
    fontWeight: 700,
    color: '#0f172a',
    display: 'flex',
    alignItems: 'center',
    gap: 10
  },

  subtitle: {
    margin: '4px 0 0',
    fontSize: 13,
    color: '#64748b'
  },

  headerActions: {
    display: 'flex',
    gap: 10,
    flexWrap: 'wrap'
  },

  btnAdd: {
    padding: '10px 20px',
    background: '#3b82f6',
    color: 'white',
    border: 'none',
    borderRadius: 10,
    cursor: 'pointer',
    fontWeight: 600,
    fontSize: 13,
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    transition: '0.2s',
    boxShadow: '0 4px 12px rgba(59,130,246,0.3)'
  },

  btnExport: {
    padding: '10px 18px',
    background: 'white',
    color: '#1e293b',
    border: '1px solid #e2e8f0',
    borderRadius: 10,
    cursor: 'pointer',
    fontWeight: 600,
    fontSize: 13,
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    transition: '0.2s'
  },

  tabsContainer: {
    display: 'flex',
    gap: 8,
    marginBottom: 20,
    flexWrap: 'wrap'
  },

  tabButton: {
    padding: '8px 16px',
    borderRadius: 10,
    border: '2px solid #e2e8f0',
    cursor: 'pointer',
    fontSize: 13,
    fontWeight: 600,
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    transition: '0.2s'
  },

  tabIcon: {
    display: 'flex',
    alignItems: 'center'
  },

  tabLabel: {
    fontSize: 13
  },

  tabCount: {
    padding: '2px 8px',
    borderRadius: 6,
    fontSize: 11,
    fontWeight: 700
  },

  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
    gap: 12,
    marginBottom: 20
  },

  statCard: {
    padding: '14px 18px',
    borderRadius: 12,
    border: '2px solid #f1f5f9',
    background: 'white',
    display: 'flex',
    alignItems: 'center',
    gap: 14,
    transition: '0.2s'
  },

  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0
  },

  statInfo: {
    flex: 1,
    minWidth: 0
  },

  statLabel: {
    fontSize: 11,
    fontWeight: 600,
    color: '#64748b'
  },

  statNumber: {
    fontSize: 18,
    fontWeight: 700,
    color: '#0f172a'
  },

  chartCard: {
    background: 'white',
    borderRadius: 12,
    padding: '20px 24px',
    marginBottom: 20,
    border: '1px solid #f1f5f9'
  },

  chartHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    flexWrap: 'wrap',
    gap: 8
  },

  chartTitle: {
    margin: 0,
    fontSize: 14,
    fontWeight: 600,
    color: '#0f172a',
    display: 'flex',
    alignItems: 'center',
    gap: 8
  },

  chartSubtitle: {
    fontSize: 12,
    color: '#64748b',
    padding: '4px 12px',
    background: '#f1f5f9',
    borderRadius: 6
  },

  chartGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
    gap: 12
  },

  chartItem: {
    display: 'flex',
    flexDirection: 'column',
    gap: 4
  },

  chartLabel: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: 12,
    fontWeight: 500,
    color: '#475569'
  },

  chartCount: {
    fontWeight: 700,
    color: '#0f172a'
  },

  chartTrack: {
    height: 20,
    background: '#f1f5f9',
    borderRadius: 10,
    overflow: 'hidden',
    position: 'relative'
  },

  chartFill: {
    height: '100%',
    borderRadius: 10,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingRight: 6,
    transition: 'width 0.6s ease',
    minWidth: '4%'
  },

  chartPercent: {
    fontSize: 9,
    fontWeight: 700,
    color: 'white'
  },

  toolbar: {
    display: 'flex',
    gap: 12,
    marginBottom: 20,
    flexWrap: 'wrap'
  },

  searchBox: {
    flex: 2,
    minWidth: 200,
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    background: 'white',
    padding: '0 16px',
    borderRadius: 10,
    border: '1px solid #e2e8f0'
  },

  searchInput: {
    flex: 1,
    border: 'none',
    outline: 'none',
    fontSize: 14,
    padding: '12px 0',
    background: 'transparent'
  },

  clearBtn: {
    background: 'none',
    border: 'none',
    color: '#94a3b8',
    cursor: 'pointer',
    fontSize: 16,
    padding: 4
  },

  filterGroup: {
    display: 'flex',
    gap: 8
  },

  filterSelect: {
    padding: '10px 14px',
    borderRadius: 10,
    border: '1px solid #e2e8f0',
    background: 'white',
    fontSize: 13,
    color: '#1e293b',
    cursor: 'pointer',
    outline: 'none'
  },

  btnRefresh: {
    padding: '10px 14px',
    background: 'white',
    border: '1px solid #e2e8f0',
    borderRadius: 10,
    cursor: 'pointer',
    color: '#64748b',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },

  tableCard: {
    background: 'white',
    borderRadius: 12,
    border: '1px solid #f1f5f9',
    overflow: 'hidden'
  },

  tableHeader: {
    padding: '16px 20px',
    borderBottom: '1px solid #f1f5f9',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8
  },

  tableTitle: {
    fontSize: 13,
    fontWeight: 600,
    color: '#0f172a',
    display: 'flex',
    alignItems: 'center',
    gap: 6
  },

  tableSubtitle: {
    fontSize: 12,
    color: '#94a3b8'
  },

  tableWrapper: {
    overflowX: 'auto'
  },

  table: {
    width: '100%',
    borderCollapse: 'collapse',
    minWidth: 900
  },

  thead: {
    background: '#f8fafc'
  },

  th: {
    padding: '10px 14px',
    fontSize: 10,
    fontWeight: 700,
    color: '#64748b',
    textTransform: 'uppercase',
    textAlign: 'left',
    borderBottom: '2px solid #f1f5f9'
  },

  tr: {
    borderBottom: '1px solid #f1f5f9',
    transition: '0.15s'
  },

  td: {
    padding: '10px 14px',
    fontSize: 12,
    verticalAlign: 'middle'
  },

  studentCell: {
    display: 'flex',
    alignItems: 'center',
    gap: 10
  },

  avatar: {
    width: 32,
    height: 32,
    borderRadius: '50%',
    background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
    color: 'white',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 11,
    fontWeight: 700,
    flexShrink: 0
  },

  studentName: {
    fontWeight: 600,
    fontSize: 13,
    color: '#0f172a',
    display: 'flex',
    alignItems: 'center',
    gap: 4
  },

  studentId: {
    fontSize: 10,
    color: '#94a3b8'
  },

  warningDot: {
    fontSize: 12,
    marginLeft: 2
  },

  dangerDot: {
    fontSize: 12,
    marginLeft: 2
  },

  kelasBadge: {
    padding: '2px 10px',
    borderRadius: 6,
    fontSize: 10,
    background: '#f1f5f9',
    color: '#475569'
  },

  durasiBadge: {
    padding: '2px 10px',
    borderRadius: 6,
    fontSize: 10,
    fontWeight: 600
  },

  masaBadge: {
    padding: '2px 10px',
    borderRadius: 6,
    fontSize: 10,
    fontWeight: 600
  },

  tagihanBadge: {
    padding: '2px 10px',
    borderRadius: 6,
    fontSize: 11,
    fontWeight: 700
  },

  statusBadge: {
    padding: '2px 10px',
    borderRadius: 6,
    fontSize: 10,
    fontWeight: 600
  },

  actionGroup: {
    display: 'flex',
    gap: 4,
    flexWrap: 'wrap'
  },

  btnAction: {
    width: 32,
    height: 32,
    borderRadius: 8,
    border: 'none',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: '0.15s',
    flexShrink: 0
  },

  emptyState: {
    textAlign: 'center',
    padding: '60px 20px'
  },

  emptyText: {
    marginTop: 12,
    fontSize: 14,
    color: '#94a3b8',
    fontWeight: 500
  },

  footer: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 16,
    marginTop: 16,
    borderTop: '1px solid #f1f5f9',
    flexWrap: 'wrap',
    gap: 8
  },

  footerText: {
    fontSize: 12,
    color: '#94a3b8'
  },

  footerActions: {
    display: 'flex',
    gap: 8
  },

  footerBtn: {
    padding: '6px 14px',
    background: 'white',
    border: '1px solid #e2e8f0',
    borderRadius: 8,
    cursor: 'pointer',
    fontSize: 11,
    color: '#64748b',
    display: 'flex',
    alignItems: 'center',
    gap: 4,
    transition: '0.15s'
  },

  // Modal Styles
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0,0,0,0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
    backdropFilter: 'blur(4px)',
    padding: 20
  },

  modal: {
    background: 'white',
    borderRadius: 16,
    maxWidth: 440,
    width: '100%',
    maxHeight: '90vh',
    overflow: 'auto',
    boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
  },

  modalHeader: {
    padding: '16px 20px',
    borderBottom: '1px solid #f1f5f9',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },

  modalTitle: {
    margin: 0,
    fontSize: 16,
    fontWeight: 700,
    color: '#0f172a',
    display: 'flex',
    alignItems: 'center',
    gap: 8
  },

  modalClose: {
    background: 'none',
    border: 'none',
    fontSize: 20,
    color: '#94a3b8',
    cursor: 'pointer',
    padding: 4
  },

  modalBody: {
    padding: 20
  },

  modalStudent: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    background: '#f8fafc',
    borderRadius: 10,
    marginBottom: 16
  },

  modalAvatar: {
    width: 40,
    height: 40,
    borderRadius: '50%',
    background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
    color: 'white',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 14,
    fontWeight: 700,
    flexShrink: 0
  },

  modalName: {
    fontSize: 14,
    fontWeight: 600,
    color: '#0f172a'
  },

  modalId: {
    fontSize: 11,
    color: '#94a3b8'
  },

  modalAccessInfo: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
    marginBottom: 16
  },

  modalAccessRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '8px 12px',
    background: '#f8fafc',
    borderRadius: 8
  },

  modalAccessLabel: {
    fontSize: 12,
    color: '#64748b'
  },

  modalAccessValue: {
    fontSize: 12,
    fontWeight: 600,
    color: '#0f172a',
    background: 'white',
    padding: '2px 10px',
    borderRadius: 4
  },

  modalNote: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: 10,
    background: '#fffbeb',
    borderRadius: 8,
    fontSize: 12,
    color: '#92400e'
  },

  modalFooter: {
    padding: '16px 20px',
    borderTop: '1px solid #f1f5f9',
    display: 'flex',
    gap: 10,
    justifyContent: 'flex-end'
  },

  modalCancel: {
    padding: '8px 20px',
    background: 'white',
    border: '1px solid #e2e8f0',
    borderRadius: 8,
    cursor: 'pointer',
    fontSize: 13,
    color: '#64748b'
  },

  modalSend: {
    padding: '8px 24px',
    background: '#3b82f6',
    color: 'white',
    border: 'none',
    borderRadius: 8,
    cursor: 'pointer',
    fontSize: 13,
    fontWeight: 600,
    transition: '0.2s'
  }
};

export default StudentList;