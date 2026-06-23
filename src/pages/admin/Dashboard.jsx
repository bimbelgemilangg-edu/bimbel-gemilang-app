import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import SidebarAdmin from '../../components/SidebarAdmin';
import { db } from '../../firebase';
import { collection, query, where, getDocs, orderBy, limit, onSnapshot } from "firebase/firestore";
import { 
  Users, GraduationCap, CreditCard, Calendar, Clock, 
  BookOpen, TrendingUp, AlertCircle, CheckCircle, UserX,
  ArrowRight, Bell, RefreshCw, DollarSign, FileText, Plus,
  Eye, ChevronRight, Home, LayoutDashboard
} from 'lucide-react';

const Dashboard = () => {
  const navigate = useNavigate();
  const [time, setTime] = useState(new Date());
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);
  const [loading, setLoading] = useState(true);

  // Stats
  const [stats, setStats] = useState({ 
    siswa: 0, guru: 0, aktif: 0, piutang: 0, piutangJumlah: 0,
    pemasukanBulanIni: 0, pengeluaranBulanIni: 0, saldo: 0
  });
  
  // Data
  const [attendanceSummary, setAttendanceSummary] = useState([]);
  const [selectedClass, setSelectedClass] = useState(null);
  const [todaySchedules, setTodaySchedules] = useState([]);
  const [duePayments, setDuePayments] = useState([]);
  const [newStudents, setNewStudents] = useState([]);
  const [teacherAttendanceStatus, setTeacherAttendanceStatus] = useState([]);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 1024);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 30000);
    return () => clearInterval(timer);
  }, []);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      const thisMonth = new Date().toISOString().slice(0, 7);

      // Fetch students
      const snapSiswa = await getDocs(collection(db, "students"));
      const siswaList = snapSiswa.docs.map(d => ({ id: d.id, ...d.data() }));
      
      // Fetch teachers
      const snapGuru = await getDocs(collection(db, "teachers"));
      const guruList = snapGuru.docs.map(d => ({ id: d.id, ...d.data() }));

      // Fetch schedules today
      const qJadwal = query(collection(db, "jadwal_bimbel"), where("dateStr", "==", today));
      const snapJadwal = await getDocs(qJadwal);
      const jadwalList = snapJadwal.docs.map(d => ({ id: d.id, ...d.data() }));
      setTodaySchedules(jadwalList);

      // Fetch attendance today
      const qAttendance = query(collection(db, "attendance"), where("date", "==", today));
      const snapAttendance = await getDocs(qAttendance);
      const attendanceData = snapAttendance.docs.map(d => ({ id: d.id, ...d.data() }));

      // Build attendance summary
      const summaryArray = [];
      jadwalList.forEach(jadwal => {
        const jadwalAttendance = attendanceData.filter(record =>
          record.scheduleId === jadwal.id || record.mapel === jadwal.title);
        const jadwalStudents = jadwal.students || [];
        const hadirList = [], tidakHadirList = [];
        
        jadwalAttendance.forEach(record => {
          if (record.status === "Hadir" || record.status === "hadir") {
            hadirList.push(record.studentName || record.namaSiswa);
          } else {
            tidakHadirList.push({
              nama: record.studentName || record.namaSiswa,
              status: record.status || "Alpha",
              keterangan: record.keterangan || "-"
            });
          }
        });
        
        jadwalStudents.forEach(siswa => {
          const namaSiswa = siswa.nama || siswa;
          if (!hadirList.includes(namaSiswa) && !tidakHadirList.some(t => t.nama === namaSiswa)) {
            tidakHadirList.push({ nama: namaSiswa, status: "Alpha", keterangan: "Belum absen" });
          }
        });
        
        summaryArray.push({
          jadwalId: jadwal.id, title: jadwal.title || "Kelas Umum",
          room: jadwal.planet || "Ruang Umum", teacher: jadwal.booker || "Guru",
          program: jadwal.program || "Reguler", start: jadwal.start, end: jadwal.end,
          totalStudents: jadwalStudents.length, totalHadir: hadirList.length,
          totalTidakHadir: tidakHadirList.length, hadir: hadirList, tidakHadir: tidakHadirList
        });
      });
      setAttendanceSummary(summaryArray);

      // Teacher attendance status
      const qTeacherLogs = query(collection(db, "teacher_logs"),
        where("tanggal", ">=", today), where("tanggal", "<=", today + "T23:59:59"));
      const snapTeacherLogs = await getDocs(qTeacherLogs);
      const teacherLogsToday = snapTeacherLogs.docs.map(d => ({ id: d.id, ...d.data() }));
      
      const statusList = [];
      jadwalList.forEach(jadwal => {
        if (!jadwal.booker || !jadwal.teacherId) return;
        const sudahAbsen = teacherLogsToday.some(log =>
          log.teacherId === jadwal.teacherId || log.namaGuru === jadwal.booker);
        const existing = statusList.find(s => s.teacherId === jadwal.teacherId);
        if (!existing) {
          statusList.push({ teacherId: jadwal.teacherId, nama: jadwal.booker, sudahAbsen, jadwalCount: 1 });
        } else {
          existing.jadwalCount++;
          if (sudahAbsen) existing.sudahAbsen = true;
        }
      });
      setTeacherAttendanceStatus(statusList);

      // Finance stats
      let totalPiutang = 0, piutangJumlah = 0, totalAktif = 0;
      const tagihanList = [], siswaBaruList = [];
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      
      siswaList.forEach(s => {
        const total = parseInt(s.totalTagihan || 0);
        const bayar = parseInt(s.totalBayar || 0);
        const sisa = total - bayar;
        
        if (sisa > 0) {
          totalPiutang += sisa;
          piutangJumlah++;
          tagihanList.push({ id: s.id, nama: s.nama, studentId: s.studentId, hp: s.ortu?.hp || "", sisa });
        }
        if (!s.isBlocked) totalAktif++;
        
        // Siswa baru 7 hari
        const createdAt = s.createdAt?.toDate?.() || new Date(s.tanggalMasuk || today);
        if (createdAt >= sevenDaysAgo && bayar === 0) {
          siswaBaruList.push({ id: s.id, nama: s.nama, studentId: s.studentId, totalTagihan: total });
        }
      });

      setDuePayments(tagihanList.sort((a, b) => b.sisa - a.sisa).slice(0, 8));
      setNewStudents(siswaBaruList);

      // Finance logs bulan ini
      let pemasukanBulanIni = 0, pengeluaranBulanIni = 0, saldoTotal = 0;
      const qFinanceLogs = query(collection(db, "finance_logs"));
      const snapFinance = await getDocs(qFinanceLogs);
      snapFinance.forEach(d => {
        const data = d.data();
        const amt = parseInt(data.amount || 0);
        if ((data.date || '').startsWith(thisMonth)) {
          if (data.type === 'Pemasukan') pemasukanBulanIni += amt;
          else pengeluaranBulanIni += amt;
        }
        if (data.type === 'Pemasukan') saldoTotal += amt;
        else saldoTotal -= amt;
      });

      setStats({
        siswa: siswaList.length,
        guru: guruList.length,
        aktif: totalAktif,
        piutang: totalPiutang,
        piutangJumlah,
        pemasukanBulanIni,
        pengeluaranBulanIni,
        saldo: saldoTotal
      });

    } catch (err) { console.error("Dashboard error:", err); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    fetchAllData();
    const intervalId = setInterval(fetchAllData, 60000);
    const today = new Date().toISOString().split('T')[0];
    const q = query(collection(db, "attendance"), where("date", "==", today));
    const unsubscribe = onSnapshot(q, () => fetchAllData());
    return () => { clearInterval(intervalId); unsubscribe(); };
  }, []);

  const totalHadir = attendanceSummary.reduce((s, k) => s + k.totalHadir, 0);
  const totalTidakHadir = attendanceSummary.reduce((s, k) => s + k.totalTidakHadir, 0);
  const totalTerdaftar = attendanceSummary.reduce((s, k) => s + k.totalStudents, 0);
  const persentaseHadir = totalTerdaftar > 0 ? Math.round((totalHadir / totalTerdaftar) * 100) : 0;

  if (loading) {
    return (
      <div style={styles.wrapper}>
        <SidebarAdmin />
        <div style={styles.mainContent(isMobile)}>
          <div style={styles.loadingBox}><div style={styles.spinner}></div><p>Memuat dashboard...</p></div>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.wrapper}>
      <SidebarAdmin />
      <div style={styles.mainContent(isMobile)}>
        
        {/* HEADER */}
        <div style={styles.header(isMobile)}>
          <div>
            <h2 style={styles.pageTitle(isMobile)}><LayoutDashboard size={22} /> Dashboard</h2>
            <p style={styles.pageDate(isMobile)}>
              {time.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
              <span style={{ marginLeft: 10, color: '#3b82f6', fontWeight: 'bold' }}>
                🕒 {time.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
              </span>
            </p>
          </div>
          <div style={styles.headerActions(isMobile)}>
            <button onClick={fetchAllData} style={styles.btnRefresh(isMobile)}>
              <RefreshCw size={14} /> {!isMobile && 'Refresh'}
            </button>
            <button onClick={() => navigate('/admin/students/add')} style={styles.btnQuickAdd(isMobile)}>
              <Plus size={14} /> {!isMobile && 'Siswa Baru'}
            </button>
          </div>
        </div>

        {/* === QUICK STATS === */}
        <div style={styles.statsGrid(isMobile)}>
          <div style={styles.statCard} onClick={() => navigate('/admin/students')}>
            <div style={styles.statIcon('#eef2ff', '#3b82f6')}><Users size={22} /></div>
            <div style={styles.statInfo}>
              <h3>{stats.siswa}</h3>
              <span>Total Siswa</span>
              <small>{stats.aktif} aktif</small>
            </div>
            <ChevronRight size={14} color="#94a3b8" />
          </div>
          <div style={styles.statCard} onClick={() => navigate('/admin/teachers')}>
            <div style={styles.statIcon('#f0fdf4', '#10b981')}><GraduationCap size={22} /></div>
            <div style={styles.statInfo}>
              <h3>{stats.guru}</h3>
              <span>Guru</span>
            </div>
            <ChevronRight size={14} color="#94a3b8" />
          </div>
          <div style={styles.statCard} onClick={() => navigate('/admin/finance')}>
            <div style={styles.statIcon('#fff7ed', '#f97316')}><CreditCard size={22} /></div>
            <div style={styles.statInfo}>
              <h3>Rp {(stats.piutang / 1000).toFixed(0)}K</h3>
              <span>Piutang</span>
              <small>{stats.piutangJumlah} siswa</small>
            </div>
            <ChevronRight size={14} color="#94a3b8" />
          </div>
          <div style={styles.statCard} onClick={() => navigate('/admin/schedule')}>
            <div style={styles.statIcon('#fef3c7', '#b45309')}><Calendar size={22} /></div>
            <div style={styles.statInfo}>
              <h3>{todaySchedules.length}</h3>
              <span>Jadwal Hari Ini</span>
            </div>
            <ChevronRight size={14} color="#94a3b8" />
          </div>
          <div style={styles.statCard}>
            <div style={styles.statIcon('#f0fdf4', '#10b981')}><TrendingUp size={22} /></div>
            <div style={styles.statInfo}>
              <h3 style={{color: '#10b981'}}>Rp {(stats.pemasukanBulanIni / 1000).toFixed(0)}K</h3>
              <span>Masuk Bulan Ini</span>
            </div>
          </div>
          <div style={styles.statCard}>
            <div style={styles.statIcon('#fef2f2', '#ef4444')}><DollarSign size={22} /></div>
            <div style={styles.statInfo}>
              <h3 style={{color: '#ef4444'}}>Rp {(stats.pengeluaranBulanIni / 1000).toFixed(0)}K</h3>
              <span>Keluar Bulan Ini</span>
            </div>
          </div>
        </div>

        {/* === ALERT SISWA BARU BELUM BAYAR === */}
        {newStudents.length > 0 && (
          <div style={styles.alertBox}>
            <div style={styles.alertHeader}>
              <Bell size={16} color="#f97316" />
              <strong>Siswa Baru Belum Dicatat Keuangannya</strong>
              <span style={styles.alertCount}>{newStudents.length}</span>
            </div>
            <div style={styles.alertList}>
              {newStudents.slice(0, 3).map(s => (
                <div key={s.id} style={styles.alertItem}>
                  <span style={{flex: 1}}>
                    <strong>{s.nama}</strong>
                    <small style={{color: '#94a3b8', marginLeft: 6}}>{s.studentId}</small>
                  </span>
                  <span style={{color: '#ef4444', fontWeight: 'bold', fontSize: 12}}>Rp {s.totalTagihan?.toLocaleString()}</span>
                  <button onClick={() => navigate(`/admin/students/finance/${s.id}`)} style={styles.alertBtn}>
                    Catat <ArrowRight size={10} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* === REKAP KEHADIRAN HARI INI === */}
        <div style={styles.sectionCard}>
          <div style={styles.sectionHeader}>
            <h3 style={styles.sectionTitle}><CheckCircle size={18} color="#10b981" /> Rekap Kehadiran Hari Ini</h3>
            <div style={styles.quickStats}>
              <span style={styles.quickStat('#10b981')}>✅ {totalHadir} Hadir</span>
              <span style={styles.quickStat('#ef4444')}>❌ {totalTidakHadir} Tidak</span>
              <span style={styles.quickStat('#3b82f6')}>📊 {persentaseHadir}%</span>
            </div>
          </div>
          
          {attendanceSummary.length === 0 ? (
            <div style={styles.emptyState}>Belum ada data absensi hari ini.</div>
          ) : (
            <div style={styles.attendanceGrid(isMobile)}>
              {attendanceSummary.map((kelas, idx) => (
                <div key={kelas.jadwalId || idx} style={styles.attendanceCard(isMobile)} onClick={() => setSelectedClass(selectedClass === idx ? null : idx)}>
                  <div style={styles.classHeader}>
                    <h4 style={styles.className}>{kelas.title}</h4>
                    <span style={styles.roomBadge}>{kelas.room}</span>
                  </div>
                  <div style={styles.classInfo}>
                    <span>👨‍🏫 {kelas.teacher}</span>
                    <span>⏰ {kelas.start} - {kelas.end}</span>
                  </div>
                  <div style={styles.attendanceBar}>
                    <div style={{...styles.barHadir, width: `${kelas.totalStudents > 0 ? (kelas.totalHadir / kelas.totalStudents) * 100 : 0}%`}}>
                      {kelas.totalHadir > 0 && `${kelas.totalHadir}`}
                    </div>
                    <div style={{...styles.barTidakHadir, width: `${kelas.totalStudents > 0 ? (kelas.totalTidakHadir / kelas.totalStudents) * 100 : 0}%`}}>
                      {kelas.totalTidakHadir > 0 && `${kelas.totalTidakHadir}`}
                    </div>
                  </div>
                  {selectedClass === idx && (
                    <div style={styles.detailDropdown}>
                      <div style={styles.detailSection}><strong>✅ Hadir:</strong><p>{kelas.hadir.length > 0 ? kelas.hadir.join(', ') : 'Belum ada'}</p></div>
                      <div style={styles.detailSection}><strong>❌ Tidak Hadir:</strong>
                        {kelas.tidakHadir.length > 0 ? kelas.tidakHadir.map((s, i) => (
                          <div key={i} style={styles.absentItem}><span>{s.nama}</span><span style={styles.absentStatus(s.status)}>{s.status}</span><span style={styles.absentKet}>{s.keterangan}</span></div>
                        )) : <p>Semua hadir 🎉</p>}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* === TEACHER STATUS + TAGIHAN === */}
        <div style={styles.bottomGrid(isMobile)}>
          {/* Teacher Status */}
          <div style={styles.sectionCard}>
            <h3 style={styles.sectionTitle}><GraduationCap size={18} color="#8b5cf6" /> Status Guru Hari Ini</h3>
            {teacherAttendanceStatus.length === 0 ? (
              <div style={styles.emptyStateSmall}>Tidak ada jadwal guru hari ini.</div>
            ) : (
              teacherAttendanceStatus.map((g, i) => (
                <div key={i} style={styles.teacherItem}>
                  <div style={styles.teacherAvatar}>{g.nama?.charAt(0) || 'G'}</div>
                  <div style={{flex: 1}}>
                    <strong>{g.nama}</strong>
                    <small style={{color: '#94a3b8'}}>{g.jadwalCount} sesi</small>
                  </div>
                  <span style={styles.teacherBadge(g.sudahAbsen)}>
                    {g.sudahAbsen ? '✅ Absen' : '⚠️ Belum'}
                  </span>
                </div>
              ))
            )}
          </div>

          {/* Tagihan Prioritas */}
          <div style={styles.sectionCard}>
            <h3 style={styles.sectionTitle}>
              <AlertCircle size={18} color="#ef4444" /> Tagihan Prioritas
              {duePayments.length > 0 && <span style={styles.badgeRed}>{duePayments.length}</span>}
            </h3>
            {duePayments.length === 0 ? (
              <div style={styles.emptyStateSmall}>✅ Semua tagihan lunas!</div>
            ) : (
              <div style={styles.billList}>
                {duePayments.slice(0, 5).map((p, i) => (
                  <div key={i} style={styles.billItem}>
                    <div style={{flex: 1}}>
                      <strong>{p.nama}</strong>
                      <span style={{color: '#ef4444', fontWeight: 'bold', marginLeft: 8}}>Rp {p.sisa.toLocaleString()}</span>
                    </div>
                    <button onClick={() => navigate(`/admin/students/finance/${p.id}`)} style={styles.billBtn}>
                      <Eye size={12} />
                    </button>
                  </div>
                ))}
              </div>
            )}
            <button onClick={() => navigate('/admin/finance')} style={styles.btnSeeAll}>
              Lihat Semua <ArrowRight size={12} />
            </button>
          </div>
        </div>
      </div>
      <style>{`@keyframes spin{0%{transform:rotate(0deg)}100%{transform:rotate(360deg)}}@keyframes pulse{0%,100%{opacity:1}50%{opacity:.5}}`}</style>
    </div>
  );
};

const styles = {
  wrapper: { display: 'flex', background: '#f8fafc', minHeight: '100vh' },
  mainContent: (m) => ({ marginLeft: m ? '0' : '260px', padding: m ? '15px' : '30px', width: '100%', boxSizing: 'border-box', transition: '0.3s' }),
  loadingBox: { textAlign: 'center', padding: 80, color: '#94a3b8' },
  spinner: { width: 40, height: 40, border: '4px solid #e2e8f0', borderTop: '4px solid #3b82f6', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 15px' },

  // Header
  header: (m) => ({ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 12 }),
  pageTitle: (m) => ({ margin: 0, color: '#1e293b', fontSize: m ? 18 : 22, display: 'flex', alignItems: 'center', gap: 8 }),
  pageDate: (m) => ({ margin: '4px 0 0', color: '#64748b', fontSize: m ? 11 : 13 }),
  headerActions: (m) => ({ display: 'flex', gap: 8 }),
  btnRefresh: (m) => ({ background: 'white', border: '1px solid #e2e8f0', padding: m ? '8px 12px' : '10px 16px', borderRadius: 10, cursor: 'pointer', fontWeight: 600, fontSize: 12, display: 'flex', alignItems: 'center', gap: 6, color: '#64748b' }),
  btnQuickAdd: (m) => ({ background: '#3b82f6', color: 'white', border: 'none', padding: m ? '8px 12px' : '10px 16px', borderRadius: 10, cursor: 'pointer', fontWeight: 600, fontSize: 12, display: 'flex', alignItems: 'center', gap: 6, boxShadow: '0 4px 12px rgba(59,130,246,0.3)' }),

  // Stats Grid
  statsGrid: (m) => ({ display: 'grid', gridTemplateColumns: m ? 'repeat(2, 1fr)' : 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12, marginBottom: 24 }),
  statCard: { background: 'white', padding: 16, borderRadius: 14, display: 'flex', alignItems: 'center', gap: 14, cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', border: '1px solid #f1f5f9', transition: '0.2s' },
  statIcon: (bg, color) => ({ width: 44, height: 44, borderRadius: 12, background: bg, color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }),
  statInfo: { flex: 1, minWidth: 0 },
  
  // Alert Box
  alertBox: { background: '#fff7ed', border: '2px solid #f97316', padding: 16, borderRadius: 14, marginBottom: 24 },
  alertHeader: { display: 'flex', alignItems: 'center', gap: 8, color: '#c2410c', marginBottom: 10, fontSize: 13 },
  alertCount: { background: '#f97316', color: 'white', padding: '2px 10px', borderRadius: 20, fontSize: 11, fontWeight: 'bold', marginLeft: 'auto' },
  alertList: { display: 'flex', flexDirection: 'column', gap: 6 },
  alertItem: { display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', background: 'white', borderRadius: 10, flexWrap: 'wrap' },
  alertBtn: { padding: '5px 10px', background: '#f97316', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 'bold', fontSize: 10, display: 'flex', alignItems: 'center', gap: 4, whiteSpace: 'nowrap' },

  // Section
  sectionCard: { background: 'white', padding: 20, borderRadius: 16, boxShadow: '0 2px 8px rgba(0,0,0,0.04)', border: '1px solid #f1f5f9', marginBottom: 20, width: '100%', boxSizing: 'border-box' },
  sectionHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15, flexWrap: 'wrap', gap: 8 },
  sectionTitle: { margin: 0, fontSize: 15, color: '#1e293b', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 8 },
  quickStats: { display: 'flex', gap: 10, flexWrap: 'wrap' },
  quickStat: (color) => ({ background: `${color}15`, color, padding: '4px 10px', borderRadius: 8, fontSize: 11, fontWeight: 'bold' }),

  // Attendance
  attendanceGrid: (m) => ({ display: 'grid', gridTemplateColumns: m ? '1fr' : 'repeat(auto-fill, minmax(280px, 1fr))', gap: 10 }),
  attendanceCard: (m) => ({ background: '#f8fafc', padding: 14, borderRadius: 12, cursor: 'pointer', border: '1px solid #f1f5f9' }),
  classHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  className: { margin: 0, fontSize: 13, color: '#1e293b', fontWeight: 'bold' },
  roomBadge: { background: '#e0e7ff', color: '#3730a3', padding: '2px 8px', borderRadius: 10, fontSize: 9, fontWeight: 'bold' },
  classInfo: { fontSize: 11, color: '#64748b', display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 4 },
  attendanceBar: { display: 'flex', height: 20, borderRadius: 10, overflow: 'hidden', marginTop: 8, background: '#f1f5f9' },
  barHadir: { background: '#10b981', color: 'white', fontSize: 9, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', transition: 'width 0.5s', minWidth: 30, padding: '0 4px' },
  barTidakHadir: { background: '#ef4444', color: 'white', fontSize: 9, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', transition: 'width 0.5s', minWidth: 30, padding: '0 4px' },
  detailDropdown: { marginTop: 10, borderTop: '1px solid #f1f5f9', paddingTop: 10 },
  detailSection: { marginBottom: 8 },
  absentItem: { display: 'flex', gap: 6, alignItems: 'center', padding: '2px 0', fontSize: 11, flexWrap: 'wrap' },
  absentStatus: (s) => ({ padding: '1px 6px', borderRadius: 6, fontSize: 8, fontWeight: 'bold', background: s === 'Alpha' || s === 'alpha' ? '#fee2e2' : s === 'Sakit' || s === 'sakit' ? '#fef3c7' : '#e0e7ff', color: s === 'Alpha' || s === 'alpha' ? '#ef4444' : s === 'Sakit' || s === 'sakit' ? '#b45309' : '#3730a3' }),
  absentKet: { fontSize: 9, color: '#94a3b8' },
  emptyState: { textAlign: 'center', padding: 40, color: '#94a3b8', fontSize: 13 },
  emptyStateSmall: { textAlign: 'center', padding: 20, color: '#94a3b8', fontSize: 12 },

  // Bottom Grid
  bottomGrid: (m) => ({ display: 'grid', gridTemplateColumns: m ? '1fr' : '1fr 1fr', gap: 20 }),

  // Teacher Status
  teacherItem: { display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0', borderBottom: '1px solid #f1f5f9' },
  teacherAvatar: { width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg, #8b5cf6, #6366f1)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 'bold', flexShrink: 0 },
  teacherBadge: (ok) => ({ padding: '3px 8px', borderRadius: 8, fontSize: 10, fontWeight: 'bold', background: ok ? '#dcfce7' : '#fee2e2', color: ok ? '#166534' : '#ef4444' }),

  // Bills
  billList: { display: 'flex', flexDirection: 'column', gap: 6 },
  billItem: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', background: '#fef2f2', borderRadius: 10, border: '1px solid #fee2e2', gap: 8 },
  billBtn: { padding: '6px 10px', background: '#ef4444', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer' },
  badgeRed: { background: '#ef4444', color: 'white', padding: '2px 8px', borderRadius: 12, fontSize: 10, fontWeight: 'bold' },
  btnSeeAll: { width: '100%', marginTop: 12, padding: '10px', background: '#f1f5f9', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 'bold', fontSize: 12, color: '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }
};

export default Dashboard;