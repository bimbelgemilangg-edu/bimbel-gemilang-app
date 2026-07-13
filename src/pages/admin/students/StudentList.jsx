// src/pages/admin/students/StudentList.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import SidebarAdmin from '../../../components/SidebarAdmin';
import { db } from '../../../firebase';
import { collection, getDocs, deleteDoc, doc, updateDoc } from "firebase/firestore";
import * as XLSX from 'xlsx';
import { 
  Search, Plus, Edit3, Trash2, Eye, UserCheck, UserX, Users,
  Home, ChevronRight, BookOpen, RefreshCw, AlertCircle, CheckCircle,
  CreditCard, Calendar, Clock, IdCard, Filter, MoreVertical, X,
  Hash, Tag, User, GraduationCap, Download, PieChart, BarChart3,
  FileSpreadsheet, Printer
} from 'lucide-react';

const StudentList = () => {
  const navigate = useNavigate();
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterKelas, setFilterKelas] = useState('Semua');
  const [filterStatus, setFilterStatus] = useState('Semua');
  const [filterProgram, setFilterProgram] = useState('Semua');
  const [filterDurasi, setFilterDurasi] = useState('Semua');
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [alertMsg, setAlertMsg] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [showChart, setShowChart] = useState(false);

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
  const getMasaAktifStatus = (s) => {
    if (!s.tanggalSelesai) return { label: 'Tidak Diketahui', color: '#94a3b8', bg: '#f1f5f9' };
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const selesai = new Date(s.tanggalSelesai);
    selesai.setHours(0, 0, 0, 0);
    
    const diffDays = Math.ceil((selesai - today) / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return { label: '⛔ Habis', color: '#ef4444', bg: '#fee2e2' };
    if (diffDays <= 30) return { label: `⏳ ${diffDays} hari`, color: '#f59e0b', bg: '#fef3c7' };
    return { label: '✅ Aktif', color: '#10b981', bg: '#dcfce7' };
  };

  const getDurasiBulan = (s) => {
    if (!s.tanggalMulai) return 0;
    const mulai = new Date(s.tanggalMulai);
    const sekarang = new Date();
    const bulan = (sekarang.getFullYear() - mulai.getFullYear()) * 12 + (sekarang.getMonth() - mulai.getMonth());
    return bulan;
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

  // === HANDLERS ===
  const handleDelete = async (id, nama) => {
    if (!window.confirm(`Yakin ingin menghapus "${nama}"?\n\nSemua data terkait akan hilang permanen.`)) return;
    setDeleting(id);
    try {
      await deleteDoc(doc(db, "students", id));
      showAlert(`🗑️ "${nama}" berhasil dihapus!`);
      fetchStudents();
    } catch (error) { showAlert("❌ Gagal menghapus: " + error.message); }
    setDeleting(null);
  };

  const handleToggleBlock = async (id, currentStatus, nama) => {
    const newStatus = !currentStatus;
    try {
      await updateDoc(doc(db, "students", id), { isBlocked: newStatus });
      showAlert(`${newStatus ? '🚫' : '✅'} "${nama}" ${newStatus ? 'diblokir' : 'diaktifkan kembali'}!`);
      fetchStudents();
    } catch (error) { showAlert("❌ Gagal update: " + error.message); }
  };

  // === FILTER ===
  const kelasList = ['Semua', ...new Set(students.map(s => s.kelasSekolah).filter(Boolean))].sort((a, b) => {
    const numA = parseInt(a);
    const numB = parseInt(b);
    if (!isNaN(numA) && !isNaN(numB)) return numA - numB;
    return a.localeCompare(b);
  });
  const programList = ['Semua', 'Reguler', 'English'];
  const durasiList = ['Semua', '0-3 Bulan', '3-6 Bulan', '6-12 Bulan', '12+ Bulan'];
  
  const filtered = students.filter(s => {
    const matchNama = (s.nama || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchStudentId = (s.studentId || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchSearch = matchNama || matchStudentId;
    const matchKelas = filterKelas === 'Semua' || s.kelasSekolah === filterKelas;
    const matchProgram = filterProgram === 'Semua' || s.kategori === filterProgram;
    const matchStatus = filterStatus === 'Semua' || 
      (filterStatus === 'Aktif' && !s.isBlocked) || 
      (filterStatus === 'Blokir' && s.isBlocked) ||
      (filterStatus === 'Habis' && getMasaAktifStatus(s).label === '⛔ Habis');
    
    // Filter durasi
    const durasi = getDurasiBulan(s);
    let matchDurasi = true;
    if (filterDurasi === '0-3 Bulan') matchDurasi = durasi >= 0 && durasi < 3;
    else if (filterDurasi === '3-6 Bulan') matchDurasi = durasi >= 3 && durasi < 6;
    else if (filterDurasi === '6-12 Bulan') matchDurasi = durasi >= 6 && durasi < 12;
    else if (filterDurasi === '12+ Bulan') matchDurasi = durasi >= 12;
    
    return matchSearch && matchKelas && matchProgram && matchStatus && matchDurasi;
  });

  const totalAktif = students.filter(s => !s.isBlocked).length;
  const totalBlokir = students.filter(s => s.isBlocked).length;
  const totalHabis = students.filter(s => getMasaAktifStatus(s).label === '⛔ Habis').length;
  const totalPiutang = students.reduce((sum, s) => sum + Math.max(0, getSisaTagihan(s)), 0);

  // === CHART DATA ===
  const chartData = {
    labels: ['Aktif', 'Blokir', 'Masa Habis'],
    values: [totalAktif, totalBlokir, totalHabis],
    colors: ['#10b981', '#ef4444', '#f59e0b']
  };

  // === EXPORT FUNCTIONS ===
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
        'Kelas': s.kelasSekolah || '-',
        'Program': s.kategori || 'Reguler',
        'Tanggal Mulai': s.tanggalMulai || '-',
        'Tanggal Selesai': s.tanggalSelesai || '-',
        'Durasi (Bulan)': getDurasiBulan(s),
        'Total Tagihan': s.totalTagihan || 0,
        'Total Bayar': s.totalBayar || 0,
        'Sisa Tagihan': getSisaTagihan(s),
        'Status': s.isBlocked ? 'Blokir' : 'Aktif',
        'Masa Aktif': getMasaAktifStatus(s).label,
        'No HP': s.ortu?.hp || '-',
        'Ayah': s.ortu?.ayah || '-',
        'Ibu': s.ortu?.ibu || '-'
      }));

      const ws = XLSX.utils.json_to_sheet(exportData);
      ws['!cols'] = [
        { wch: 5 }, { wch: 15 }, { wch: 20 }, { wch: 10 }, { wch: 12 },
        { wch: 15 }, { wch: 15 }, { wch: 12 }, { wch: 15 }, { wch: 15 },
        { wch: 15 }, { wch: 10 }, { wch: 12 }, { wch: 15 }, { wch: 15 }, { wch: 15 }
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

  const handleExportAll = () => handleExportExcel(students, 'Semua_Siswa');
  const handleExportFiltered = () => handleExportExcel(filtered, 'Filter_Siswa');

  const handlePrint = () => window.print();

  if (loading) return (
    <div style={styles.wrapper}>
      <SidebarAdmin />
      <div style={styles.mainContent(isMobile)}>
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
      <div style={styles.mainContent(isMobile)}>
        
        {/* TOAST */}
        {alertMsg && <div style={styles.toast}>{alertMsg}</div>}

        {/* BREADCRUMB */}
        <div style={styles.breadcrumb(isMobile)}>
          <div style={styles.breadcrumbTrail}>
            <Home size={12} color="#94a3b8" />
            <ChevronRight size={12} color="#94a3b8" />
            <span style={{color: '#3b82f6', fontWeight: 'bold'}}>Kelola Siswa</span>
          </div>
          <div style={{display: 'flex', gap: 8, flexWrap: 'wrap'}}>
            <span style={styles.totalBadge}>
              <Users size={14} /> {students.length} Siswa
            </span>
          </div>
        </div>

        {/* HEADER */}
        <div style={styles.header(isMobile)}>
          <div>
            <h2 style={styles.pageTitle(isMobile)}><Users size={22} /> Daftar Siswa</h2>
            <p style={styles.subtitle}>
              {students.length} siswa terdaftar • 
              <span style={{color: '#10b981'}}> {totalAktif} aktif</span> • 
              <span style={{color: '#ef4444'}}> {totalBlokir} blokir</span>
            </p>
          </div>
          <div style={{display: 'flex', gap: 8, flexWrap: 'wrap'}}>
            <button onClick={() => setShowChart(!showChart)} style={styles.btnChart(isMobile)}>
              <PieChart size={14} /> {!isMobile && 'Chart'}
            </button>
            <button onClick={handleExportFiltered} style={styles.btnExport(isMobile)}>
              <Download size={14} /> {!isMobile && 'Export Filter'}
            </button>
            <button onClick={handleExportAll} style={styles.btnExportAll(isMobile)}>
              <FileSpreadsheet size={14} /> {!isMobile && 'Export Semua'}
            </button>
            <button onClick={handlePrint} style={styles.btnPrint(isMobile)}>
              <Printer size={14} /> {!isMobile && 'Cetak'}
            </button>
            <button onClick={() => navigate('/admin/students/add')} style={styles.btnAdd(isMobile)}>
              <Plus size={18} /> Tambah Siswa
            </button>
          </div>
        </div>

        {/* CHART SECTION */}
        {showChart && (
          <div style={styles.chartCard}>
            <div style={styles.chartHeader}>
              <h4 style={styles.chartTitle}><PieChart size={18} /> Statistik Siswa</h4>
              <button onClick={() => setShowChart(false)} style={styles.chartClose}>
                <X size={16} />
              </button>
            </div>
            <div style={styles.chartContainer(isMobile)}>
              <div style={styles.chartBars}>
                {chartData.labels.map((label, idx) => {
                  const total = students.length || 1;
                  const percentage = Math.round((chartData.values[idx] / total) * 100);
                  return (
                    <div key={idx} style={styles.chartBarItem}>
                      <div style={styles.chartBarLabel}>{label}</div>
                      <div style={styles.chartBarTrack}>
                        <div style={{
                          ...styles.chartBarFill,
                          width: `${percentage}%`,
                          background: chartData.colors[idx]
                        }}>
                          <span style={styles.chartBarValue}>{percentage}%</span>
                        </div>
                      </div>
                      <div style={styles.chartBarCount}>{chartData.values[idx]} siswa</div>
                    </div>
                  );
                })}
              </div>
              <div style={styles.chartSummary}>
                <div style={styles.chartSummaryItem}>
                  <div style={{...styles.chartSummaryDot, background: '#10b981'}} />
                  <span>Aktif: {totalAktif} ({Math.round((totalAktif / students.length) * 100) || 0}%)</span>
                </div>
                <div style={styles.chartSummaryItem}>
                  <div style={{...styles.chartSummaryDot, background: '#ef4444'}} />
                  <span>Blokir: {totalBlokir} ({Math.round((totalBlokir / students.length) * 100) || 0}%)</span>
                </div>
                <div style={styles.chartSummaryItem}>
                  <div style={{...styles.chartSummaryDot, background: '#f59e0b'}} />
                  <span>Habis: {totalHabis} ({Math.round((totalHabis / students.length) * 100) || 0}%)</span>
                </div>
                <div style={styles.chartSummaryItem}>
                  <div style={{...styles.chartSummaryDot, background: '#8b5cf6'}} />
                  <span>Total: {students.length} siswa</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* STATS */}
        <div style={styles.statsRow(isMobile)}>
          <div style={styles.statMini}>
            <Users size={16} color="#3b82f6" />
            <div>
              <h3>{students.length}</h3>
              <span>Total</span>
            </div>
          </div>
          <div style={styles.statMini}>
            <CheckCircle size={16} color="#10b981" />
            <div>
              <h3>{totalAktif}</h3>
              <span>Aktif</span>
            </div>
          </div>
          <div style={styles.statMini}>
            <AlertCircle size={16} color="#ef4444" />
            <div>
              <h3>{totalBlokir}</h3>
              <span>Blokir</span>
            </div>
          </div>
          <div style={styles.statMini}>
            <Clock size={16} color="#f59e0b" />
            <div>
              <h3>{totalHabis}</h3>
              <span>Habis</span>
            </div>
          </div>
          <div style={styles.statMini}>
            <CreditCard size={16} color="#8b5cf6" />
            <div>
              <h3>Rp {(totalPiutang / 1000).toFixed(0)}K</h3>
              <span>Piutang</span>
            </div>
          </div>
        </div>

        {/* FILTER BAR */}
        <div style={styles.filterBar(isMobile)}>
          <div style={styles.searchBox}>
            <Search size={16} color="#94a3b8" />
            <input 
              placeholder="Cari nama atau ID siswa..." 
              value={searchTerm} 
              onChange={e => setSearchTerm(e.target.value)} 
              style={styles.searchInput} 
            />
            {searchTerm && (
              <button onClick={() => setSearchTerm('')} style={styles.clearBtn}>✕</button>
            )}
          </div>
          <button 
            onClick={() => setShowFilters(!showFilters)} 
            style={styles.btnFilter(isMobile)}
          >
            <Filter size={14} /> {!isMobile && 'Filter'}
          </button>
          <button onClick={fetchStudents} style={styles.btnRefresh(isMobile)}>
            <RefreshCw size={14} /> {!isMobile && 'Refresh'}
          </button>
        </div>

        {/* ADVANCED FILTERS */}
        {showFilters && (
          <div style={styles.advancedFilters(isMobile)}>
            <div style={styles.filterGroup}>
              <label style={styles.filterLabel}>Kelas</label>
              <select value={filterKelas} onChange={e => setFilterKelas(e.target.value)} style={styles.filterSelect}>
                {kelasList.map(k => <option key={k} value={k}>{k}</option>)}
              </select>
            </div>
            <div style={styles.filterGroup}>
              <label style={styles.filterLabel}>Program</label>
              <select value={filterProgram} onChange={e => setFilterProgram(e.target.value)} style={styles.filterSelect}>
                {programList.map(p => <option key={p} value={p}>{p === 'Semua' ? 'Semua Program' : p}</option>)}
              </select>
            </div>
            <div style={styles.filterGroup}>
              <label style={styles.filterLabel}>Status</label>
              <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={styles.filterSelect}>
                <option value="Semua">Semua Status</option>
                <option value="Aktif">✅ Aktif</option>
                <option value="Blokir">🚫 Blokir</option>
                <option value="Habis">⏰ Masa Habis</option>
              </select>
            </div>
            <div style={styles.filterGroup}>
              <label style={styles.filterLabel}>Durasi</label>
              <select value={filterDurasi} onChange={e => setFilterDurasi(e.target.value)} style={styles.filterSelect}>
                {durasiList.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
          </div>
        )}

        {/* DESKTOP TABLE */}
        {!isMobile && (
          <div style={styles.card}>
            {filtered.length === 0 ? (
              <div style={styles.emptyState}>
                <BookOpen size={48} color="#94a3b8" />
                <p style={{fontWeight: 'bold', marginTop: 10}}>
                  {searchTerm ? 'Tidak ada siswa yang cocok.' : 'Belum ada siswa terdaftar.'}
                </p>
              </div>
            ) : (
              <div style={{overflowX: 'auto'}}>
                <table style={styles.table}>
                  <thead>
                    <tr style={styles.thr}>
                      <th style={styles.th}>#</th>
                      <th style={styles.th}>ID / Nama</th>
                      <th style={styles.th}>Kelas</th>
                      <th style={styles.th}>Program</th>
                      <th style={styles.th}>Durasi</th>
                      <th style={styles.th}>Masa Aktif</th>
                      <th style={styles.th}>Tagihan</th>
                      <th style={styles.th}>Status</th>
                      <th style={styles.th}>Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((s, idx) => {
                      const masa = getMasaAktifStatus(s);
                      const sisa = getSisaTagihan(s);
                      const durasi = getDurasiBulan(s);
                      return (
                        <tr key={s.id} style={{...styles.tr, opacity: s.isBlocked ? 0.5 : 1}}>
                          <td style={styles.td}>
                            <span style={styles.indexBadge}>{idx + 1}</span>
                          </td>
                          <td style={styles.td}>
                            <div style={styles.studentCell}>
                              <div style={styles.studentAvatar(isMobile)}>
                                {getInitials(s.nama)}
                              </div>
                              <div>
                                <div style={{fontWeight: 'bold', fontSize: 13}}>{s.nama}</div>
                                <div style={styles.idBadge}>
                                  <Hash size={10} /> {s.studentId || 'Belum ada ID'}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td style={styles.td}>
                            <span style={styles.kelasBadge}>{s.kelasSekolah || '-'}</span>
                          </td>
                          <td style={styles.td}>
                            <span style={styles.programBadge(s.kategori)}>
                              {s.kategori === 'English' ? '🇬🇧 English' : '📚 Reguler'}
                            </span>
                          </td>
                          <td style={styles.td}>
                            <span style={{
                              padding: '4px 10px', borderRadius: 10, fontSize: 11, fontWeight: 'bold',
                              background: durasi > 12 ? '#dcfce7' : durasi > 6 ? '#fef3c7' : '#fee2e2',
                              color: durasi > 12 ? '#166534' : durasi > 6 ? '#b45309' : '#ef4444'
                            }}>
                              {durasi > 0 ? `${durasi} Bulan` : 'Baru'}
                            </span>
                          </td>
                          <td style={styles.td}>
                            <span style={{
                              padding: '4px 10px', borderRadius: 10, fontSize: 11, fontWeight: 'bold',
                              background: masa.bg, color: masa.color
                            }}>
                              {masa.label}
                            </span>
                          </td>
                          <td style={styles.td}>
                            <div style={{fontSize: 13, fontWeight: 'bold', color: sisa > 0 ? '#ef4444' : '#10b981'}}>
                              Rp {sisa.toLocaleString()}
                            </div>
                          </td>
                          <td style={styles.td}>
                            <span style={styles.statusBadge(s.isBlocked)}>
                              {s.isBlocked ? '🚫 Blokir' : '✅ Aktif'}
                            </span>
                          </td>
                          <td style={styles.td}>
                            <div style={styles.actionGroup}>
                              <button 
                                onClick={() => navigate(`/admin/students/attendance/${s.id}`)} 
                                style={styles.btnAction} 
                                title="Kehadiran"
                              >
                                <Calendar size={14} />
                              </button>
                              <button 
                                onClick={() => navigate(`/admin/students/finance/${s.id}`)} 
                                style={{...styles.btnAction, background: '#e0e7ff', color: '#3730a3'}} 
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
        )}

        {/* MOBILE CARDS */}
        {isMobile && (
          <div style={styles.mobileList}>
            {filtered.length === 0 ? (
              <div style={styles.emptyState}>
                <BookOpen size={48} color="#94a3b8" />
                <p style={{fontWeight: 'bold', marginTop: 10}}>Tidak ada siswa</p>
              </div>
            ) : (
              filtered.map(s => {
                const masa = getMasaAktifStatus(s);
                const sisa = getSisaTagihan(s);
                const durasi = getDurasiBulan(s);
                return (
                  <div key={s.id} style={styles.mobileCard}>
                    <div style={styles.mobileCardTop}>
                      <div style={styles.studentCell}>
                        <div style={styles.studentAvatar(isMobile)}>
                          {getInitials(s.nama)}
                        </div>
                        <div>
                          <div style={{fontWeight: 'bold', fontSize: 14}}>{s.nama}</div>
                          <div style={styles.mobileIdBadge}>
                            <Hash size={10} /> {s.studentId || '-'}
                          </div>
                        </div>
                      </div>
                      <span style={{
                        padding: '4px 10px', borderRadius: 10, fontSize: 10, fontWeight: 'bold',
                        background: masa.bg, color: masa.color
                      }}>
                        {masa.label}
                      </span>
                    </div>
                    <div style={styles.mobileCardInfo}>
                      <span style={styles.mobileKelasBadge}>{s.kelasSekolah || '-'}</span>
                      <span style={styles.programBadge(s.kategori)}>
                        {s.kategori === 'English' ? '🇬🇧 English' : '📚 Reguler'}
                      </span>
                      <span style={styles.statusBadge(s.isBlocked)}>
                        {s.isBlocked ? '🚫 Blokir' : '✅ Aktif'}
                      </span>
                      <span style={{
                        padding: '2px 8px', borderRadius: 10, fontSize: 9, fontWeight: 'bold',
                        background: durasi > 12 ? '#dcfce7' : durasi > 6 ? '#fef3c7' : '#fee2e2',
                        color: durasi > 12 ? '#166534' : durasi > 6 ? '#b45309' : '#ef4444'
                      }}>
                        {durasi > 0 ? `${durasi} bln` : 'Baru'}
                      </span>
                      <span style={{fontSize: 13, fontWeight: 'bold', color: sisa > 0 ? '#ef4444' : '#10b981'}}>
                        Rp {sisa.toLocaleString()}
                      </span>
                    </div>
                    <div style={styles.mobileCardActions}>
                      <button onClick={() => navigate(`/admin/students/attendance/${s.id}`)} style={styles.mobileBtn}>
                        <Calendar size={14} /> Hadir
                      </button>
                      <button onClick={() => navigate(`/admin/students/finance/${s.id}`)} style={styles.mobileBtn}>
                        <CreditCard size={14} /> Bayar
                      </button>
                      <button onClick={() => navigate(`/admin/students/edit/${s.id}`)} style={styles.mobileBtn}>
                        <Edit3 size={14} /> Edit
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

      </div>
      <style>{`
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        @media print {
          .no-print { display: none !important; }
          .print-only { display: block !important; }
          body { background: white; }
          button { display: none !important; }
        }
      `}</style>
    </div>
  );
};

// ============================================================
// STYLES
// ============================================================
const styles = {
  wrapper: { 
    display: 'flex', 
    background: '#f8fafc', 
    minHeight: '100vh' 
  },
  
  mainContent: (m) => ({ 
    marginLeft: m ? '0' : '250px', 
    padding: m ? '15px' : '30px', 
    width: '100%', 
    boxSizing: 'border-box', 
    transition: '0.3s' 
  }),
  
  toast: { 
    position: 'fixed', 
    top: 20, 
    right: 20, 
    zIndex: 9999, 
    background: '#1e293b', 
    color: 'white', 
    padding: '12px 20px', 
    borderRadius: 12, 
    fontWeight: 'bold', 
    fontSize: 14, 
    boxShadow: '0 10px 30px rgba(0,0,0,0.2)' 
  },
  
  loadingState: { 
    textAlign: 'center', 
    padding: 80 
  },
  
  spinner: { 
    width: 40, 
    height: 40, 
    border: '4px solid #f3e8ff', 
    borderTop: '4px solid #673ab7', 
    borderRadius: '50%', 
    animation: 'spin 1s linear infinite', 
    margin: '0 auto 15px' 
  },
  
  totalBadge: {
    display: 'inline-flex', 
    alignItems: 'center', 
    gap: 4,
    padding: '4px 12px', 
    borderRadius: 20,
    background: '#f1f5f9', 
    color: '#64748b',
    fontSize: 11, 
    fontWeight: 600
  },
  
  breadcrumb: (m) => ({ 
    display: 'flex', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginBottom: 20,
    flexWrap: 'wrap', 
    gap: 8
  }),
  
  breadcrumbTrail: { 
    display: 'flex', 
    alignItems: 'center', 
    gap: 6, 
    fontSize: 12 
  },
  
  header: (m) => ({ 
    display: 'flex', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginBottom: 20, 
    flexDirection: m ? 'column' : 'row', 
    gap: m ? 10 : 0 
  }),
  
  pageTitle: (m) => ({ 
    margin: 0, 
    color: '#1e293b', 
    fontSize: m ? 18 : 22, 
    display: 'flex', 
    alignItems: 'center', 
    gap: 8 
  }),
  
  subtitle: { 
    color: '#64748b', 
    marginTop: 4, 
    fontSize: 13 
  },
  
  btnAdd: (m) => ({ 
    background: '#3b82f6', 
    color: 'white', 
    border: 'none', 
    padding: m ? '10px 15px' : '12px 20px', 
    borderRadius: 12, 
    cursor: 'pointer', 
    fontWeight: 'bold', 
    display: 'flex', 
    alignItems: 'center', 
    gap: 6, 
    fontSize: m ? 12 : 14, 
    boxShadow: '0 4px 12px rgba(59,130,246,0.3)' 
  }),
  
  btnChart: (m) => ({ 
    background: '#8b5cf6', 
    color: 'white', 
    border: 'none', 
    padding: m ? '8px 12px' : '10px 16px', 
    borderRadius: 10, 
    cursor: 'pointer', 
    fontWeight: 'bold', 
    display: 'flex', 
    alignItems: 'center', 
    gap: 6, 
    fontSize: m ? 11 : 13 
  }),
  
  btnExport: (m) => ({ 
    background: '#10b981', 
    color: 'white', 
    border: 'none', 
    padding: m ? '8px 12px' : '10px 16px', 
    borderRadius: 10, 
    cursor: 'pointer', 
    fontWeight: 'bold', 
    display: 'flex', 
    alignItems: 'center', 
    gap: 6, 
    fontSize: m ? 11 : 13 
  }),
  
  btnExportAll: (m) => ({ 
    background: '#059669', 
    color: 'white', 
    border: 'none', 
    padding: m ? '8px 12px' : '10px 16px', 
    borderRadius: 10, 
    cursor: 'pointer', 
    fontWeight: 'bold', 
    display: 'flex', 
    alignItems: 'center', 
    gap: 6, 
    fontSize: m ? 11 : 13 
  }),
  
  btnPrint: (m) => ({ 
    background: '#f59e0b', 
    color: 'white', 
    border: 'none', 
    padding: m ? '8px 12px' : '10px 16px', 
    borderRadius: 10, 
    cursor: 'pointer', 
    fontWeight: 'bold', 
    display: 'flex', 
    alignItems: 'center', 
    gap: 6, 
    fontSize: m ? 11 : 13 
  }),
  
  statsRow: (m) => ({ 
    display: 'flex', 
    gap: m ? 6 : 10, 
    marginBottom: 20, 
    flexWrap: 'wrap' 
  }),
  
  statMini: { 
    flex: 1, 
    minWidth: 80, 
    background: 'white', 
    padding: 12, 
    borderRadius: 12, 
    display: 'flex', 
    alignItems: 'center', 
    gap: 10, 
    boxShadow: '0 2px 4px rgba(0,0,0,0.04)', 
    border: '1px solid #f1f5f9' 
  },
  
  filterBar: (m) => ({ 
    display: 'flex', 
    gap: 8, 
    marginBottom: 12, 
    flexDirection: m ? 'column' : 'row' 
  }),
  
  searchBox: { 
    flex: 2, 
    display: 'flex', 
    alignItems: 'center', 
    gap: 8, 
    background: 'white', 
    padding: '10px 15px', 
    borderRadius: 10, 
    border: '1px solid #e2e8f0' 
  },
  
  searchInput: { 
    border: 'none', 
    outline: 'none', 
    width: '100%', 
    fontSize: 14, 
    background: 'transparent' 
  },
  
  clearBtn: { 
    background: 'none', 
    border: 'none', 
    color: '#94a3b8', 
    cursor: 'pointer', 
    fontSize: 16 
  },
  
  btnFilter: (m) => ({ 
    background: 'white', 
    border: '1px solid #e2e8f0', 
    padding: '10px 15px', 
    borderRadius: 10, 
    cursor: 'pointer', 
    display: 'flex', 
    alignItems: 'center', 
    gap: 5, 
    fontSize: 13, 
    color: '#64748b' 
  }),
  
  btnRefresh: (m) => ({ 
    background: 'white', 
    border: '1px solid #e2e8f0', 
    padding: '10px 15px', 
    borderRadius: 10, 
    cursor: 'pointer', 
    display: 'flex', 
    alignItems: 'center', 
    gap: 5, 
    fontSize: 13, 
    color: '#64748b' 
  }),
  
  advancedFilters: (m) => ({ 
    display: 'flex', 
    gap: 12, 
    marginBottom: 15, 
    padding: 15, 
    background: 'white', 
    borderRadius: 12, 
    border: '1px solid #f1f5f9', 
    flexWrap: 'wrap' 
  }),
  
  filterGroup: { 
    flex: 1, 
    minWidth: 120 
  },
  
  filterLabel: { 
    fontSize: 10, 
    fontWeight: 'bold', 
    color: '#94a3b8', 
    display: 'block', 
    marginBottom: 4 
  },
  
  filterSelect: { 
    width: '100%', 
    padding: '8px 10px', 
    borderRadius: 8, 
    border: '1px solid #e2e8f0', 
    fontSize: 12, 
    background: '#f8fafc' 
  },
  
  chartCard: {
    background: 'white',
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
    border: '1px solid #f1f5f9',
    boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
  },
  
  chartHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12
  },
  
  chartTitle: {
    margin: 0,
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1e293b',
    display: 'flex',
    alignItems: 'center',
    gap: 6
  },
  
  chartClose: {
    background: '#f1f5f9',
    border: 'none',
    borderRadius: '50%',
    width: 28,
    height: 28,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#64748b'
  },
  
  chartContainer: (m) => ({
    display: 'flex',
    flexDirection: m ? 'column' : 'row',
    gap: 20
  }),
  
  chartBars: {
    flex: 2,
    display: 'flex',
    flexDirection: 'column',
    gap: 12
  },
  
  chartBarItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 8
  },
  
  chartBarLabel: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#64748b',
    minWidth: 60
  },
  
  chartBarTrack: {
    flex: 1,
    height: 24,
    background: '#f1f5f9',
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative'
  },
  
  chartBarFill: {
    height: '100%',
    borderRadius: 12,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingRight: 8,
    transition: 'width 0.8s ease'
  },
  
  chartBarValue: {
    fontSize: 10,
    fontWeight: 'bold',
    color: 'white'
  },
  
  chartBarCount: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#1e293b',
    minWidth: 50,
    textAlign: 'right'
  },
  
  chartSummary: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
    padding: 12,
    background: '#f8fafc',
    borderRadius: 10
  },
  
  chartSummaryItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    fontSize: 12,
    color: '#1e293b'
  },
  
  chartSummaryDot: {
    width: 10,
    height: 10,
    borderRadius: '50%',
    flexShrink: 0
  },
  
  card: { 
    background: 'white', 
    borderRadius: 14, 
    boxShadow: '0 2px 8px rgba(0,0,0,0.04)', 
    border: '1px solid #f1f5f9', 
    overflow: 'hidden' 
  },
  
  emptyState: { 
    textAlign: 'center', 
    padding: 60, 
    color: '#94a3b8' 
  },
  
  table: { 
    width: '100%', 
    borderCollapse: 'collapse', 
    minWidth: '1050px' 
  },
  
  thr: { 
    background: '#f8fafc', 
    textAlign: 'left' 
  },
  
  th: { 
    padding: '10px 12px', 
    fontSize: 10, 
    color: '#64748b', 
    fontWeight: 800, 
    textTransform: 'uppercase', 
    borderBottom: '2px solid #f1f5f9' 
  },
  
  tr: { 
    borderBottom: '1px solid #f1f5f9', 
    transition: '0.2s' 
  },
  
  td: { 
    padding: '10px 12px', 
    fontSize: 12, 
    verticalAlign: 'middle' 
  },
  
  indexBadge: { 
    display: 'inline-block', 
    width: 24, 
    height: 24, 
    background: '#f1f5f9', 
    borderRadius: '50%', 
    textAlign: 'center', 
    lineHeight: '24px', 
    fontSize: 10, 
    fontWeight: 600, 
    color: '#64748b' 
  },
  
  studentCell: { 
    display: 'flex', 
    alignItems: 'center', 
    gap: 10 
  },
  
  studentAvatar: (m) => ({ 
    width: m ? 36 : 32, 
    height: m ? 36 : 32, 
    borderRadius: '50%', 
    background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)', 
    color: 'white', 
    display: 'flex', 
    alignItems: 'center', 
    justifyContent: 'center', 
    fontSize: m ? 14 : 12, 
    fontWeight: 'bold', 
    flexShrink: 0 
  }),
  
  idBadge: { 
    display: 'inline-flex', 
    alignItems: 'center', 
    gap: 3,
    fontSize: 9, 
    color: '#3b82f6', 
    background: '#eef2ff', 
    padding: '1px 8px', 
    borderRadius: 10, 
    fontWeight: 600,
    width: 'fit-content'
  },
  
  mobileIdBadge: {
    display: 'inline-flex', 
    alignItems: 'center', 
    gap: 3,
    fontSize: 9, 
    color: '#3b82f6', 
    background: '#eef2ff', 
    padding: '1px 6px', 
    borderRadius: 8, 
    fontWeight: 600,
    width: 'fit-content'
  },
  
  kelasBadge: { 
    padding: '3px 8px', 
    borderRadius: 6, 
    fontSize: 11, 
    background: '#f1f5f9', 
    color: '#475569', 
    fontWeight: 500 
  },
  
  mobileKelasBadge: {
    padding: '2px 8px', 
    borderRadius: 6,
    fontSize: 10, 
    background: '#f1f5f9',
    color: '#475569', 
    fontWeight: 500
  },
  
  programBadge: (kat) => ({ 
    padding: '3px 8px', 
    borderRadius: 10, 
    fontSize: 10, 
    fontWeight: 'bold', 
    background: kat === 'English' ? '#e0e7ff' : '#f0fdf4', 
    color: kat === 'English' ? '#3730a3' : '#166534' 
  }),
  
  statusBadge: (blocked) => ({ 
    padding: '3px 8px', 
    borderRadius: 10, 
    fontSize: 10, 
    fontWeight: 'bold', 
    background: blocked ? '#fee2e2' : '#dcfce7', 
    color: blocked ? '#ef4444' : '#166534' 
  }),
  
  actionGroup: { 
    display: 'flex', 
    gap: 4, 
    flexWrap: 'wrap' 
  },
  
  btnAction: { 
    background: '#f1f5f9', 
    color: '#475569', 
    border: 'none', 
    padding: '6px', 
    borderRadius: 8, 
    cursor: 'pointer', 
    display: 'flex', 
    alignItems: 'center', 
    justifyContent: 'center' 
  },
  
  mobileList: { 
    display: 'flex', 
    flexDirection: 'column', 
    gap: 10 
  },
  
  mobileCard: { 
    background: 'white', 
    padding: 14, 
    borderRadius: 14, 
    boxShadow: '0 2px 4px rgba(0,0,0,0.04)', 
    border: '1px solid #f1f5f9' 
  },
  
  mobileCardTop: { 
    display: 'flex', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginBottom: 8 
  },
  
  mobileCardInfo: { 
    display: 'flex', 
    gap: 6, 
    alignItems: 'center', 
    flexWrap: 'wrap', 
    marginBottom: 8 
  },
  
  mobileCardActions: { 
    display: 'flex', 
    gap: 6, 
    borderTop: '1px solid #f1f5f9', 
    paddingTop: 10 
  },
  
  mobileBtn: { 
    flex: 1, 
    padding: '6px', 
    borderRadius: 8, 
    border: '1px solid #e2e8f0', 
    background: 'white', 
    fontSize: 10, 
    fontWeight: 'bold', 
    color: '#475569', 
    cursor: 'pointer', 
    display: 'flex', 
    alignItems: 'center', 
    justifyContent: 'center', 
    gap: 4 
  }
};

export default StudentList;