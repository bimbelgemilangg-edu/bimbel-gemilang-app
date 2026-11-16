// src/pages/admin/Dashboard.jsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import SidebarAdmin from '../../components/SidebarAdmin';
import { db } from '../../firebase';
import { collection, query, where, getDocs, onSnapshot, limit, orderBy } from "firebase/firestore";
import { 
  Users, GraduationCap, Calendar, Clock, BookOpen, 
  TrendingUp, AlertCircle, CheckCircle, ArrowRight, Bell, 
  RefreshCw, Plus, Eye, ChevronRight, LayoutDashboard,
  Trophy, Sparkles, Star, Award, Search, Check,
  UserPlus, Library, FileText, Send, MessageCircle, ExternalLink, X
} from 'lucide-react';
import { 
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid 
} from 'recharts';
import { ambilSesiAdmin, LABEL_PERAN_ADMIN } from '../../utils/adminAuth';
import { isOwnerSession } from '../../utils/roleAkses';

const tanggalLokalHariIni = () => {
  const n = new Date();
  return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, '0')}-${String(n.getDate()).padStart(2, '0')}`;
};

const getInitials = (name) => {
  if (!name) return 'S';
  return name.split(' ').map(w => w[0]?.toUpperCase()).slice(0, 2).join('');
};

const Dashboard = () => {
  const navigate = useNavigate();
  const [time, setTime] = useState(new Date());
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);
  const [loading, setLoading] = useState(true);

  // Filter & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [chartPeriod, setChartPeriod] = useState('minggu'); // 'minggu' | 'bulan'

  // Identitas Admin yang login
  const owner = isOwnerSession();
  const sesiAdmin = ambilSesiAdmin();
  const namaAdmin = owner
    ? 'Owner'
    : (sesiAdmin?.nama || (sesiAdmin?.peran === 'legacy' ? 'Admin Operasional' : 'Admin'));
  const peranAdmin = owner
    ? 'Super Admin'
    : (LABEL_PERAN_ADMIN[sesiAdmin?.peran] || 'Admin Operasional');

  // Operational Stats (NO MONEY / JANGAN ADA UANG)
  const [stats, setStats] = useState({ 
    siswa: 0, 
    aktif: 0, 
    guru: 0, 
    alumni: 0 
  });
  
  // Data State
  const [students, setStudents] = useState([]);
  const [topStudents, setTopStudents] = useState([]);
  const [attendanceSummary, setAttendanceSummary] = useState([]);
  const [todaySchedules, setTodaySchedules] = useState([]);
  const [duePayments, setDuePayments] = useState([]);
  const [newStudents, setNewStudents] = useState([]);
  const [teacherAttendanceStatus, setTeacherAttendanceStatus] = useState([]);
  const [chartData, setChartData] = useState([]);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 1024);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 30000);
    return () => clearInterval(timer);
  }, []);

  // Muat ringkasan hari ini (jadwal + absensi + status mengajar guru)
  const muatRingkasanHariIni = useCallback(async () => {
    try {
      const today = tanggalLokalHariIni();

      // 1. Jadwal hari ini
      const qJadwal = query(collection(db, "jadwal_bimbel"), where("dateStr", "==", today));
      const snapJadwal = await getDocs(qJadwal);
      const jadwalList = snapJadwal.docs.map(d => ({ id: d.id, ...d.data() }));
      setTodaySchedules(jadwalList);

      // 2. Absensi hari ini
      const qAttendance = query(collection(db, "attendance"), where("date", "==", today));
      const snapAttendance = await getDocs(qAttendance);
      const attendanceData = snapAttendance.docs.map(d => ({ id: d.id, ...d.data() }));

      // Ringkasan kelas
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
          jadwalId: jadwal.id, title: jadwal.title || "Kelas Reguler",
          room: jadwal.planet || "Ruang Kelas", teacher: jadwal.booker || "Tentor",
          program: jadwal.program || "Reguler", start: jadwal.start, end: jadwal.end,
          totalStudents: jadwalStudents.length, totalHadir: hadirList.length,
          totalTidakHadir: tidakHadirList.length, hadir: hadirList, tidakHadir: tidakHadirList
        });
      });
      setAttendanceSummary(summaryArray);

      // 3. Status Guru Hari Ini
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
    } catch (err) { console.error("Ringkasan harian error:", err); }
  }, []);

  const fetchAllData = useCallback(async () => {
    setLoading(true);
    try {
      const today = tanggalLokalHariIni();

      // 1. Fetch Students
      const snapSiswa = await getDocs(collection(db, "students"));
      const siswaList = snapSiswa.docs.map(d => ({ id: d.id, ...d.data() }));
      setStudents(siswaList);

      // 2. Fetch Teachers
      const snapGuru = await getDocs(collection(db, "teachers"));
      const guruList = snapGuru.docs.map(d => ({ id: d.id, ...d.data() }));

      // 3. Fetch Student Progress (XP Leaderboard)
      let progressMap = {};
      try {
        const snapProg = await getDocs(collection(db, "siswa_progress"));
        snapProg.forEach(d => { progressMap[d.id] = d.data(); });
      } catch (errProg) {
        console.warn("Progress load warn:", errProg);
      }

      // 4. Fetch TryOut Sesi Selesai (Top Scorers)
      let toScoreMap = {};
      try {
        const snapTO = await getDocs(query(collection(db, "tryout_sesi"), where("status", "==", "selesai"), limit(60)));
        snapTO.forEach(d => {
          const dt = d.data();
          const skor = dt.nilaiTotal || dt.skorAkhir || dt.skor || 0;
          if (!toScoreMap[dt.studentId] || skor > toScoreMap[dt.studentId]) {
            toScoreMap[dt.studentId] = skor;
          }
        });
      } catch (errTO) {
        console.warn("TO load warn:", errTO);
      }

      await muatRingkasanHariIni();

      // Susun Siswa & Tunggakan
      let totalAktif = 0;
      const tagihanList = [], siswaBaruList = [];
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

      // Leaderboard ranking list
      const rankingList = [];
      
      siswaList.forEach(s => {
        const total = parseInt(s.totalTagihan || 0);
        const bayar = parseInt(s.totalBayar || 0);
        const sisa = total - bayar;
        const prog = progressMap[s.studentId] || {};
        const xp = prog.xp || s.xp || 0;
        const skorTO = toScoreMap[s.studentId] || s.skorTryout || 85;
        
        // Simpan ke daftar ranking
        rankingList.push({
          id: s.id,
          nama: s.nama,
          studentId: s.studentId,
          jenjang: s.jenjang || 'Reguler',
          kelas: s.kelasSekolah || s.kelas || 'Umum',
          fotoUrl: s.fotoUrl || s.photoURL || s.foto || null,
          xp: xp,
          skorTO: skorTO,
          kehadiran: s.persenKehadiran || 100,
          isBlocked: s.isBlocked
        });

        if (sisa > 0) {
          tagihanList.push({ 
            id: s.id, 
            nama: s.nama, 
            studentId: s.studentId, 
            jenjang: s.jenjang || 'Reguler',
            kelas: s.kelasSekolah || s.kelas || 'Umum',
            hp: s.ortu?.hp || s.noHp || "", 
            fotoUrl: s.fotoUrl || s.photoURL || s.foto || null,
            sisa,
            totalTagihan: total,
            totalBayar: bayar,
            isBlocked: s.isBlocked,
            tenor: s.tenor || 1
          });
        }

        if (!s.isBlocked) totalAktif++;
        
        // Siswa baru 7 hari
        const createdAt = s.createdAt?.toDate?.() || new Date(s.tanggalMasuk || today);
        if (createdAt >= sevenDaysAgo && bayar === 0) {
          siswaBaruList.push({ 
            id: s.id, 
            nama: s.nama, 
            studentId: s.studentId, 
            totalTagihan: total,
            fotoUrl: s.fotoUrl || s.photoURL || s.foto || null
          });
        }
      });

      // Urutkan ranking berprestasi (XP dan Skor TO tertinggi)
      rankingList.sort((a, b) => (b.xp + b.skorTO * 10) - (a.xp + a.skorTO * 10));
      setTopStudents(rankingList.slice(0, 5));

      // Urutkan tagihan prioritas
      setDuePayments(tagihanList.sort((a, b) => b.sisa - a.sisa));
      setNewStudents(siswaBaruList);

      setStats({
        siswa: siswaList.length,
        guru: guruList.length,
        aktif: totalAktif,
        alumni: siswaList.filter(s => s.status === 'Alumni' || s.isBlocked).length
      });

      // Data Grafik Aktivitas Belajar Mingguan
      const namaHari = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
      const dummyActivities = [
        { hari: 'Sen', kehadiran: 32, tryout: 28 },
        { hari: 'Sel', kehadiran: 45, tryout: 36 },
        { hari: 'Rab', kehadiran: 38, tryout: 42 },
        { hari: 'Kam', kehadiran: 52, tryout: 48 },
        { hari: 'Jum', kehadiran: 60, tryout: 55 },
        { hari: 'Sab', kehadiran: 74, tryout: 68 },
        { hari: 'Min', kehadiran: 40, tryout: 35 }
      ];
      setChartData(dummyActivities);

    } catch (err) { 
      console.error("Dashboard error:", err); 
    } finally { 
      setLoading(false); 
    }
  }, [muatRingkasanHariIni]);

  useEffect(() => {
    fetchAllData();
    const intervalId = setInterval(muatRingkasanHariIni, 300000);
    const today = tanggalLokalHariIni();
    const q = query(collection(db, "attendance"), where("date", "==", today));
    let tDeb = null;
    const unsubscribe = onSnapshot(q, () => {
      if (tDeb) clearTimeout(tDeb);
      tDeb = setTimeout(() => muatRingkasanHariIni(), 3000);
    });
    return () => {
      clearInterval(intervalId);
      unsubscribe();
      if (tDeb) clearTimeout(tDeb);
    };
  }, [fetchAllData, muatRingkasanHariIni]);

  // Handler Search Navigasi Cepat
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    navigate(`/admin/students?q=${encodeURIComponent(searchQuery.trim())}`);
  };

  const totalHadir = attendanceSummary.reduce((s, k) => s + k.totalHadir, 0);
  const totalTerdaftar = attendanceSummary.reduce((s, k) => s + k.totalStudents, 0);
  const persentaseHadir = totalTerdaftar > 0 ? Math.round((totalHadir / totalTerdaftar) * 100) : 0;

  // Siswa Bintang Gemilang (Juara 1)
  const starStudent = topStudents[0] || {
    nama: 'Belum Ada Siswa',
    jenjang: 'Reguler',
    kelas: 'Kelas 7 SMP',
    xp: 1250,
    skorTO: 88.5,
    kehadiran: 100,
    fotoUrl: null
  };

  if (loading) {
    return (
      <div style={styles.wrapper}>
        <SidebarAdmin />
        <div style={styles.mainContent(isMobile)}>
          <div style={styles.loadingBox}>
            <div style={styles.spinner} />
            <p style={{ marginTop: 14, fontWeight: 700, color: '#64748b' }}>Memuat Pusat Komando Dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.wrapper}>
      <SidebarAdmin />
      <div style={styles.mainContent(isMobile)}>
        
        {/* ============================================================ */}
        {/* TOP HEADER: Title, Search Bar, & User Profile (Mirip Mockup) */}
        {/* ============================================================ */}
        <header style={styles.topHeader(isMobile)}>
          <div>
            <h1 style={styles.topTitle}>Dashboard</h1>
            <p style={styles.topSubtitle}>
              {time.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          </div>

          {/* Search Bar Tengah */}
          <form onSubmit={handleSearchSubmit} style={styles.searchBox(isMobile)}>
            <Search size={17} color="#94a3b8" />
            <input
              type="text"
              placeholder="Cari siswa, jadwal, kelas, tentor..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={styles.searchInput}
            />
          </form>

          {/* User Profile & Actions Kanan */}
          <div style={styles.topRightActions}>
            <button 
              type="button" 
              onClick={fetchAllData} 
              style={styles.iconBtn} 
              title="Refresh Data"
            >
              <RefreshCw size={17} color="#64748b" />
            </button>

            <button 
              type="button" 
              onClick={() => navigate('/admin/students')} 
              style={styles.iconBtn} 
              title="Notifikasi"
            >
              <Bell size={17} color="#64748b" />
              {(newStudents.length > 0 || duePayments.length > 0) && (
                <span style={styles.notifDot}>{newStudents.length + duePayments.length}</span>
              )}
            </button>

            {/* User Profile Pill */}
            <div style={styles.userProfilePill}>
              <div style={styles.userAvatarTop}>
                {owner ? '👑' : getInitials(namaAdmin)}
              </div>
              {!isMobile && (
                <div style={{ textAlign: 'left', lineHeight: 1.2 }}>
                  <div style={styles.profileName}>{namaAdmin}</div>
                  <div style={styles.profileRole}>{peranAdmin}</div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* ============================================================ */}
        {/* TOP 4 VIBRANT STAT CARDS (NO MONEY / JANGAN ADA UANG)        */}
        {/* ============================================================ */}
        <section style={styles.statsGrid(isMobile)}>
          {/* Card 1: Siswa Aktif (Purple) */}
          <div 
            style={{ ...styles.statCardVibrant, background: 'linear-gradient(135deg, #4f46e5 0%, #6366f1 100%)' }}
            onClick={() => navigate('/admin/students')}
          >
            <div style={styles.statIconBox}>
              <Users size={22} color="#ffffff" />
            </div>
            <div style={styles.statNumberText}>
              <div style={styles.statValLarge}>{stats.aktif}</div>
              <div style={styles.statLabelWhite}>Siswa Aktif Belajar</div>
              <div style={styles.statSubText}>{stats.siswa} Total Siswa Terdaftar</div>
            </div>
          </div>

          {/* Card 2: Sesi Kelas Hari Ini (Sky Blue) */}
          <div 
            style={{ ...styles.statCardVibrant, background: 'linear-gradient(135deg, #0284c7 0%, #38bdf8 100%)' }}
            onClick={() => navigate('/admin/schedule')}
          >
            <div style={styles.statIconBox}>
              <Calendar size={22} color="#ffffff" />
            </div>
            <div style={styles.statNumberText}>
              <div style={styles.statValLarge}>{todaySchedules.length}</div>
              <div style={styles.statLabelWhite}>Jadwal Kelas Hari Ini</div>
              <div style={styles.statSubText}>{totalHadir} Siswa Hadir ({persentaseHadir}%)</div>
            </div>
          </div>

          {/* Card 3: Guru & Sesi Mengajar (Emerald Green) */}
          <div 
            style={{ ...styles.statCardVibrant, background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)' }}
            onClick={() => navigate('/admin/teachers/sesi')}
          >
            <div style={styles.statIconBox}>
              <GraduationCap size={22} color="#ffffff" />
            </div>
            <div style={styles.statNumberText}>
              <div style={styles.statValLarge}>
                {teacherAttendanceStatus.filter(t => t.sudahAbsen).length} / {teacherAttendanceStatus.length || stats.guru}
              </div>
              <div style={styles.statLabelWhite}>Guru Sudah Mengajar</div>
              <div style={styles.statSubText}>
                {teacherAttendanceStatus.filter(t => !t.sudahAbsen).length} Guru Belum Isi Absen
              </div>
            </div>
          </div>

          {/* Card 4: Tindakan Admin & Pendaftaran (Lime Green) */}
          <div 
            style={{ ...styles.statCardVibrant, background: 'linear-gradient(135deg, #65a30d 0%, #84cc16 100%)' }}
            onClick={() => navigate('/admin/students')}
          >
            <div style={styles.statIconBox}>
              <AlertCircle size={22} color="#ffffff" />
            </div>
            <div style={styles.statNumberText}>
              <div style={styles.statValLarge}>{newStudents.length + duePayments.length}</div>
              <div style={styles.statLabelWhite}>Perlu Tindakan Admin</div>
              <div style={styles.statSubText}>
                {newStudents.length} Siswa Baru • {duePayments.length} Tunggakan
              </div>
            </div>
          </div>
        </section>

        {/* ============================================================ */}
        {/* MAIN MIDDLE SECTION: SPOTLIGHT (KIRI) & GRAFIK/AKSI (KANAN)   */}
        {/* ============================================================ */}
        <section style={styles.middleLayout(isMobile)}>
          
          {/* 🌟 KOLOM KIRI: SPOTLIGHT SISWA BERPRESTASI (Ganti "Oda Dink") */}
          <div style={styles.spotlightCard}>
            <div style={styles.spotlightHeader}>
              <span style={styles.badgeGold}>⭐ Bintang Gemilang</span>
              <span style={styles.badgeCrown}>👑 Juara 1</span>
            </div>

            {/* Avatar Lingkaran Besar dengan Foto Siswa */}
            <div style={styles.avatarSpotlightWrapper}>
              <div style={styles.avatarRingOuter}>
                {starStudent.fotoUrl ? (
                  <img 
                    src={starStudent.fotoUrl} 
                    alt={starStudent.nama} 
                    style={styles.avatarSpotlightImg} 
                  />
                ) : (
                  <div style={styles.avatarSpotlightFallback}>
                    {getInitials(starStudent.nama)}
                  </div>
                )}
              </div>
            </div>

            <div style={styles.spotlightProfile}>
              <h3 style={styles.spotlightName}>{starStudent.nama}</h3>
              <p style={styles.spotlightRole}>
                {starStudent.jenjang} • {starStudent.kelas}
              </p>
            </div>

            {/* 3 Circular Gauges (Mirip PHP, Vue, Laravel pada Mockup) */}
            <div style={styles.gaugeRow}>
              <div style={styles.gaugeItem}>
                <div style={styles.gaugeCircle('#8b5cf6', '#ede9fe')}>
                  {starStudent.xp || 1250}
                </div>
                <span style={styles.gaugeLabel}>Poin XP</span>
              </div>
              <div style={styles.gaugeItem}>
                <div style={styles.gaugeCircle('#0284c7', '#e0f2fe')}>
                  {starStudent.skorTO || 88.5}
                </div>
                <span style={styles.gaugeLabel}>Skor TO</span>
              </div>
              <div style={styles.gaugeItem}>
                <div style={styles.gaugeCircle('#10b981', '#ecfdf5')}>
                  {starStudent.kehadiran || 100}%
                </div>
                <span style={styles.gaugeLabel}>Kehadiran</span>
              </div>
            </div>

            {/* Siswa Berprestasi Lainnya (Peringkat 2, 3, 4) */}
            <div style={styles.recentStudentsSection}>
              <h4 style={styles.recentTitle}>🏆 Peringkat Berprestasi Lainnya</h4>
              <div style={styles.recentList}>
                {topStudents.slice(1, 4).map((s, idx) => (
                  <div key={s.id || idx} style={styles.recentItem} onClick={() => navigate(`/admin/students/finance/${s.id}`)}>
                    <div style={styles.recentAvatar}>
                      {s.fotoUrl ? (
                        <img src={s.fotoUrl} alt={s.nama} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        getInitials(s.nama)
                      )}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={styles.recentName}>{s.nama}</div>
                      <div style={styles.recentMeta}>{s.kelas} • {s.xp} XP</div>
                    </div>
                    <span style={styles.rankBadge(idx + 2)}>#{idx + 2}</span>
                  </div>
                ))}
              </div>
              <button 
                type="button" 
                onClick={() => navigate('/admin/raport')} 
                style={styles.btnLihatRapor}
              >
                Buka Rapor & Analitik Lengkap <ChevronRight size={14} />
              </button>
            </div>
          </div>

          {/* 📊 KOLOM KANAN: GRAFIK AKTIVITAS & FAST ACTION HUB */}
          <div style={styles.rightContentCol}>
            
            {/* GRAFIK WAVY AKTIVITAS BELAJAR (Ganti "Vacancy Stats") */}
            <div style={styles.chartCard}>
              <div style={styles.chartHeader}>
                <div>
                  <h3 style={styles.chartTitle}>Aktivitas Belajar & Presensi Mingguan</h3>
                  <p style={styles.chartSubtitle}>Statistik kehadiran kelas tatap muka & pengerjaan latihan siswa</p>
                </div>
                <div style={styles.chartLegendRow}>
                  <span style={styles.legendDot('#6366f1')}>● Kehadiran Siswa</span>
                  <span style={styles.legendDot('#10b981')}>● Pengerjaan Latihan/TO</span>
                </div>
              </div>

              <div style={{ width: '100%', height: 210, marginTop: 10 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorHadir" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4}/>
                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0}/>
                      </linearGradient>
                      <linearGradient id="colorTO" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.35}/>
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0.0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="hari" stroke="#94a3b8" fontSize={11} tickLine={false} />
                    <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                    <Tooltip 
                      contentStyle={{ background: '#1e1b4b', borderRadius: 10, border: 'none', color: '#fff', fontSize: 12 }} 
                      itemStyle={{ color: '#fff' }}
                    />
                    <Area type="monotone" dataKey="kehadiran" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorHadir)" />
                    <Area type="monotone" dataKey="tryout" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorTO)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* ⚡ AKSI CEPAT MENU UTAMA ADMIN (Ganti "Recommended Jobs") */}
            <div>
              <div style={styles.actionHubHeader}>
                <h3 style={styles.actionHubTitle}>⚡ Akses Cepat Menu Utama</h3>
                <span style={styles.actionHubBadge}>Pintasan Operasional Harian</span>
              </div>

              <div style={styles.actionGrid(isMobile)}>
                {/* 1. Kelola Siswa */}
                <div style={styles.actionCard}>
                  <div style={styles.actionCardHead}>
                    <div style={styles.actionIconBox('#eff6ff', '#2563eb')}>
                      <Users size={20} />
                    </div>
                    <span style={styles.actionBadgeBlue}>
                      {stats.aktif} Aktif
                    </span>
                  </div>
                  <h4 style={styles.actionCardTitle}>Kelola Data Siswa</h4>
                  <p style={styles.actionCardDesc}>
                    Pantau masa aktif siswa, upgrade paket, dan cetak kartu digital.
                  </p>
                  <div style={styles.actionBtnRow}>
                    <button 
                      onClick={() => navigate('/admin/students/add')} 
                      style={styles.btnActionPrimary}
                    >
                      <Plus size={13} /> Siswa Baru
                    </button>
                    <button 
                      onClick={() => navigate('/admin/students')} 
                      style={styles.btnActionSecondary}
                    >
                      Lihat Siswa →
                    </button>
                  </div>
                </div>

                {/* 2. Sesi & Validasi Guru */}
                <div style={styles.actionCard}>
                  <div style={styles.actionCardHead}>
                    <div style={styles.actionIconBox('#faf5ff', '#9333ea')}>
                      <GraduationCap size={20} />
                    </div>
                    <span style={styles.actionBadgePurple}>
                      {teacherAttendanceStatus.filter(t => !t.sudahAbsen).length > 0 ? '⚠️ Butuh Approval' : '✅ Lengkap'}
                    </span>
                  </div>
                  <h4 style={styles.actionCardTitle}>Sesi & Validasi Guru</h4>
                  <p style={styles.actionCardDesc}>
                    Approval foto absensi mengajar tentor & verifikasi nominal honor.
                  </p>
                  <div style={styles.actionBtnRow}>
                    <button 
                      onClick={() => navigate('/admin/teachers/sesi')} 
                      style={styles.btnActionPurple}
                    >
                      Validasi Guru →
                    </button>
                  </div>
                </div>

                {/* 3. Bank Soal & TryOut */}
                <div style={styles.actionCard}>
                  <div style={styles.actionCardHead}>
                    <div style={styles.actionIconBox('#fff7ed', '#ea580c')}>
                      <Trophy size={20} />
                    </div>
                    <span style={styles.actionBadgeOrange}>TOBK CBT</span>
                  </div>
                  <h4 style={styles.actionCardTitle}>Bank Soal & TryOut</h4>
                  <p style={styles.actionCardDesc}>
                    Rilis jadwal tryout akbar, pantau pengerjaan siswa, & periksa kunci.
                  </p>
                  <div style={styles.actionBtnRow}>
                    <button 
                      onClick={() => navigate('/admin/tobk-publik')} 
                      style={styles.btnActionOrange}
                    >
                      Kelola TryOut →
                    </button>
                  </div>
                </div>

                {/* 4. Perpustakaan & Modul AI */}
                <div style={styles.actionCard}>
                  <div style={styles.actionCardHead}>
                    <div style={styles.actionIconBox('#f0fdf4', '#16a34a')}>
                      <Library size={20} />
                    </div>
                    <span style={styles.actionBadgeGreen}>Buku Digital</span>
                  </div>
                  <h4 style={styles.actionCardTitle}>Perpustakaan & Modul</h4>
                  <p style={styles.actionCardDesc}>
                    Akses buku PDF Gemilang, generate kuis AI, & draf materi belajar.
                  </p>
                  <div style={styles.actionBtnRow}>
                    <button 
                      onClick={() => navigate('/admin/perpustakaan')} 
                      style={styles.btnActionGreen}
                    >
                      Buka Modul →
                    </button>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </section>

        {/* ============================================================ */}
        {/* BOTTOM SECTION: TUNGGAKAN & CICILAN SISWA (Ganti Companies)  */}
        {/* ============================================================ */}
        <section style={styles.bottomTunggakanCard}>
          <div style={styles.tunggakanHeader}>
            <div>
              <h3 style={styles.tunggakanTitle}>
                ⚠️ Daftar Tunggakan & Cicilan Siswa (Perlu Follow-Up)
              </h3>
              <p style={styles.tunggakanSubtitle}>
                Pantau siswa dengan sisa pembayaran paket atau cicilan aktif agar tidak terblokir
              </p>
            </div>
            <button 
              onClick={() => navigate('/admin/finance')} 
              style={styles.btnLihatSemuaFinance}
            >
              Buka Seluruh Keuangan <ArrowRight size={14} />
            </button>
          </div>

          {duePayments.length === 0 ? (
            <div style={styles.emptyTunggakanBox}>
              <CheckCircle size={32} color="#10b981" />
              <p style={{ margin: '8px 0 0', fontWeight: 700, color: '#065f46' }}>
                Luar biasa! Tidak ada tunggakan atau cicilan siswa yang tertunda saat ini.
              </p>
            </div>
          ) : (
            <div style={styles.tunggakanGrid(isMobile)}>
              {duePayments.slice(0, 8).map((s) => {
                const pesanWa = `Halo Ayah/Bunda dari ${s.nama}, kami dari Bimbel Gemilang menginformasikan terkait administrasi bimbingan belajar ananda dengan sisa tagihan sebesar Rp ${s.sisa.toLocaleString('id-ID')}. Mohon konfirmasinya ya Ayah/Bunda. Terima kasih.`;
                const noHpBersih = (s.hp || '').replace(/\D/g, '');
                const waLink = noHpBersih ? `https://wa.me/${noHpBersih.startsWith('0') ? '62' + noHpBersih.slice(1) : noHpBersih}?text=${encodeURIComponent(pesanWa)}` : null;

                return (
                  <div key={s.id} style={styles.tunggakanItemCard}>
                    <div style={styles.tunggakanItemTop}>
                      {/* Foto Siswa */}
                      <div style={styles.tunggakanAvatar}>
                        {s.fotoUrl ? (
                          <img src={s.fotoUrl} alt={s.nama} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                          getInitials(s.nama)
                        )}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={styles.tunggakanName} title={s.nama}>{s.nama}</div>
                        <div style={styles.tunggakanKelas}>{s.kelas} • {s.studentId}</div>
                      </div>
                    </div>

                    <div style={styles.tunggakanNominalBox}>
                      <span style={styles.tunggakanLabel}>Sisa Tagihan:</span>
                      <span style={styles.tunggakanRupiah}>Rp {s.sisa.toLocaleString('id-ID')}</span>
                    </div>

                    <div style={styles.tunggakanActions}>
                      <button 
                        onClick={() => navigate(`/admin/students/finance/${s.id}`)} 
                        style={styles.btnDetailBayar}
                      >
                        💳 Detail & Bayar
                      </button>
                      {waLink && (
                        <a 
                          href={waLink} 
                          target="_blank" 
                          rel="noreferrer" 
                          style={styles.btnWaOrtu}
                          title="Kirim WhatsApp ke Orang Tua"
                        >
                          <MessageCircle size={13} /> WA Ortu
                        </a>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

      </div>
    </div>
  );
};

// ============================================================
// STYLES DENGAN SENTUHAN DESAIN MODERN MOCKUP "JOBIE"
// ============================================================
const styles = {
  wrapper: {
    display: 'flex',
    minHeight: '100vh',
    background: '#f8fafc',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
  },
  mainContent: (isMobile) => ({
    flex: 1,
    marginLeft: isMobile ? 0 : 236,
    padding: isMobile ? '16px' : '26px 32px',
    boxSizing: 'border-box',
    width: '100%',
    maxWidth: '1600px'
  }),
  loadingBox: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '70vh'
  },
  spinner: {
    width: 44,
    height: 44,
    border: '4px solid #e2e8f0',
    borderTop: '4px solid #4f46e5',
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite'
  },

  // TOP HEADER
  topHeader: (isMobile) => ({
    display: 'flex',
    flexDirection: isMobile ? 'column' : 'row',
    alignItems: isMobile ? 'flex-start' : 'center',
    justifyContent: 'space-between',
    gap: 16,
    marginBottom: 24
  }),
  topTitle: {
    margin: 0,
    fontSize: 24,
    fontWeight: 900,
    color: '#0f172a',
    letterSpacing: -0.5
  },
  topSubtitle: {
    margin: '3px 0 0',
    fontSize: 12.5,
    color: '#64748b',
    fontWeight: 500
  },
  searchBox: (isMobile) => ({
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    background: '#ffffff',
    border: '1.5px solid #e2e8f0',
    borderRadius: 14,
    padding: '9px 16px',
    width: isMobile ? '100%' : '380px',
    boxShadow: '0 2px 6px rgba(0,0,0,0.02)',
    boxSizing: 'border-box'
  }),
  searchInput: {
    border: 'none',
    outline: 'none',
    fontSize: 13,
    color: '#1e293b',
    width: '100%',
    background: 'transparent'
  },
  topRightActions: {
    display: 'flex',
    alignItems: 'center',
    gap: 10
  },
  iconBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    background: '#ffffff',
    border: '1.5px solid #e2e8f0',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    position: 'relative',
    transition: '0.2s',
    boxShadow: '0 2px 6px rgba(0,0,0,0.02)'
  },
  notifDot: {
    position: 'absolute',
    top: -4,
    right: -4,
    background: '#ef4444',
    color: '#fff',
    fontSize: 10,
    fontWeight: 800,
    padding: '2px 5px',
    borderRadius: 999
  },
  userProfilePill: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '5px 12px 5px 6px',
    background: '#ffffff',
    border: '1.5px solid #e2e8f0',
    borderRadius: 30,
    boxShadow: '0 2px 6px rgba(0,0,0,0.02)'
  },
  userAvatarTop: {
    width: 32,
    height: 32,
    borderRadius: '50%',
    background: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
    color: '#fff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 12,
    fontWeight: 800
  },
  profileName: {
    fontSize: 12.5,
    fontWeight: 800,
    color: '#0f172a'
  },
  profileRole: {
    fontSize: 10.5,
    color: '#64748b',
    fontWeight: 600
  },

  // TOP 4 VIBRANT STAT CARDS
  statsGrid: (isMobile) => ({
    display: 'grid',
    gridTemplateColumns: isMobile ? '1fr' : 'repeat(4, 1fr)',
    gap: 16,
    marginBottom: 24
  }),
  statCardVibrant: {
    borderRadius: 18,
    padding: '20px 20px',
    display: 'flex',
    alignItems: 'flex-start',
    gap: 16,
    cursor: 'pointer',
    boxShadow: '0 10px 20px -5px rgba(79, 70, 229, 0.25)',
    transition: 'transform 0.2s ease, box-shadow 0.2s ease'
  },
  statIconBox: {
    width: 44,
    height: 44,
    borderRadius: 14,
    background: 'rgba(255, 255, 255, 0.22)',
    backdropFilter: 'blur(4px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0
  },
  statNumberText: {
    color: '#ffffff',
    flex: 1
  },
  statValLarge: {
    fontSize: 28,
    fontWeight: 900,
    lineHeight: 1,
    letterSpacing: -0.5
  },
  statLabelWhite: {
    fontSize: 13,
    fontWeight: 700,
    marginTop: 6,
    opacity: 0.95
  },
  statSubText: {
    fontSize: 11,
    opacity: 0.8,
    marginTop: 3
  },

  // MIDDLE LAYOUT
  middleLayout: (isMobile) => ({
    display: 'grid',
    gridTemplateColumns: isMobile ? '1fr' : '330px 1fr',
    gap: 22,
    marginBottom: 24
  }),

  // SPOTLIGHT CARD (KIRI)
  spotlightCard: {
    background: '#ffffff',
    borderRadius: 22,
    padding: '24px 20px',
    border: '1px solid #e2e8f0',
    boxShadow: '0 4px 20px rgba(0,0,0,0.03)',
    display: 'flex',
    flexDirection: 'column',
    height: 'fit-content'
  },
  spotlightHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16
  },
  badgeGold: {
    fontSize: 12,
    fontWeight: 800,
    color: '#b45309',
    background: '#fef3c7',
    padding: '4px 10px',
    borderRadius: 999
  },
  badgeCrown: {
    fontSize: 11,
    fontWeight: 800,
    color: '#7c3aed',
    background: '#ede9fe',
    padding: '4px 8px',
    borderRadius: 999
  },
  avatarSpotlightWrapper: {
    display: 'flex',
    justifyContent: 'center',
    margin: '8px 0 14px'
  },
  avatarRingOuter: {
    width: 90,
    height: 90,
    borderRadius: '50%',
    padding: 4,
    background: 'linear-gradient(135deg, #7c3aed, #fbbf24)',
    boxShadow: '0 8px 20px rgba(124, 58, 237, 0.25)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  avatarSpotlightImg: {
    width: '100%',
    height: '100%',
    borderRadius: '50%',
    objectFit: 'cover'
  },
  avatarSpotlightFallback: {
    width: '100%',
    height: '100%',
    borderRadius: '50%',
    background: '#4f46e5',
    color: '#ffffff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 26,
    fontWeight: 900
  },
  spotlightProfile: {
    textAlign: 'center',
    marginBottom: 18
  },
  spotlightName: {
    margin: 0,
    fontSize: 16,
    fontWeight: 800,
    color: '#0f172a'
  },
  spotlightRole: {
    margin: '4px 0 0',
    fontSize: 12,
    color: '#64748b'
  },
  gaugeRow: {
    display: 'flex',
    justifyContent: 'space-around',
    padding: '12px 6px',
    background: '#f8fafc',
    borderRadius: 16,
    marginBottom: 20
  },
  gaugeItem: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 4
  },
  gaugeCircle: (color, bg) => ({
    width: 46,
    height: 46,
    borderRadius: '50%',
    background: bg,
    color: color,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 12,
    fontWeight: 900,
    border: `2px solid ${color}`
  }),
  gaugeLabel: {
    fontSize: 10.5,
    fontWeight: 700,
    color: '#475569'
  },
  recentStudentsSection: {
    borderTop: '1px solid #f1f5f9',
    paddingTop: 16
  },
  recentTitle: {
    margin: '0 0 10px',
    fontSize: 12,
    fontWeight: 800,
    color: '#334155'
  },
  recentList: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
    marginBottom: 12
  },
  recentItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '8px 10px',
    borderRadius: 12,
    background: '#f8fafc',
    cursor: 'pointer',
    transition: '0.2s'
  },
  recentAvatar: {
    width: 32,
    height: 32,
    borderRadius: '50%',
    background: '#e2e8f0',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 11,
    fontWeight: 800,
    color: '#475569',
    overflow: 'hidden',
    flexShrink: 0
  },
  recentName: {
    fontSize: 12,
    fontWeight: 700,
    color: '#1e293b',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis'
  },
  recentMeta: {
    fontSize: 10.5,
    color: '#64748b'
  },
  rankBadge: (rank) => ({
    fontSize: 11,
    fontWeight: 900,
    padding: '2px 7px',
    borderRadius: 8,
    background: rank === 2 ? '#f1f5f9' : rank === 3 ? '#fff7ed' : '#f8fafc',
    color: rank === 2 ? '#475569' : rank === 3 ? '#c2410c' : '#64748b'
  }),
  btnLihatRapor: {
    width: '100%',
    padding: '8px 12px',
    borderRadius: 10,
    background: '#eff6ff',
    border: '1px solid #bfdbfe',
    color: '#1d4ed8',
    fontSize: 11.5,
    fontWeight: 700,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4
  },

  // RIGHT CONTENT (GRAFIK + ACTION HUB)
  rightContentCol: {
    display: 'flex',
    flexDirection: 'column',
    gap: 20
  },
  chartCard: {
    background: '#ffffff',
    borderRadius: 22,
    padding: '20px 24px',
    border: '1px solid #e2e8f0',
    boxShadow: '0 4px 20px rgba(0,0,0,0.03)'
  },
  chartHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    flexWrap: 'wrap',
    gap: 12
  },
  chartTitle: {
    margin: 0,
    fontSize: 16,
    fontWeight: 800,
    color: '#0f172a'
  },
  chartSubtitle: {
    margin: '3px 0 0',
    fontSize: 12,
    color: '#64748b'
  },
  chartLegendRow: {
    display: 'flex',
    gap: 14,
    fontSize: 11.5,
    fontWeight: 700
  },
  legendDot: (color) => ({
    color: color
  }),

  // ACTION HUB
  actionHubHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12
  },
  actionHubTitle: {
    margin: 0,
    fontSize: 16,
    fontWeight: 800,
    color: '#0f172a'
  },
  actionHubBadge: {
    fontSize: 11,
    fontWeight: 700,
    color: '#64748b'
  },
  actionGrid: (isMobile) => ({
    display: 'grid',
    gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)',
    gap: 14
  }),
  actionCard: {
    background: '#ffffff',
    borderRadius: 18,
    padding: '18px',
    border: '1px solid #e2e8f0',
    boxShadow: '0 2px 10px rgba(0,0,0,0.02)',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between'
  },
  actionCardHead: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10
  },
  actionIconBox: (bg, color) => ({
    width: 38,
    height: 38,
    borderRadius: 12,
    background: bg,
    color: color,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  }),
  actionBadgeBlue: {
    fontSize: 11,
    fontWeight: 800,
    color: '#2563eb',
    background: '#eff6ff',
    padding: '3px 8px',
    borderRadius: 999
  },
  actionBadgePurple: {
    fontSize: 11,
    fontWeight: 800,
    color: '#7c3aed',
    background: '#faf5ff',
    padding: '3px 8px',
    borderRadius: 999
  },
  actionBadgeOrange: {
    fontSize: 11,
    fontWeight: 800,
    color: '#ea580c',
    background: '#fff7ed',
    padding: '3px 8px',
    borderRadius: 999
  },
  actionBadgeGreen: {
    fontSize: 11,
    fontWeight: 800,
    color: '#16a34a',
    background: '#f0fdf4',
    padding: '3px 8px',
    borderRadius: 999
  },
  actionCardTitle: {
    margin: '0 0 4px',
    fontSize: 14,
    fontWeight: 800,
    color: '#0f172a'
  },
  actionCardDesc: {
    margin: '0 0 14px',
    fontSize: 11.5,
    color: '#64748b',
    lineHeight: 1.4
  },
  actionBtnRow: {
    display: 'flex',
    gap: 8
  },
  btnActionPrimary: {
    flex: 1,
    padding: '7px 12px',
    borderRadius: 9,
    background: '#4f46e5',
    color: '#ffffff',
    border: 'none',
    fontSize: 11.5,
    fontWeight: 700,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4
  },
  btnActionSecondary: {
    padding: '7px 12px',
    borderRadius: 9,
    background: '#f1f5f9',
    color: '#334155',
    border: 'none',
    fontSize: 11.5,
    fontWeight: 700,
    cursor: 'pointer'
  },
  btnActionPurple: {
    width: '100%',
    padding: '7px 12px',
    borderRadius: 9,
    background: '#7c3aed',
    color: '#ffffff',
    border: 'none',
    fontSize: 11.5,
    fontWeight: 700,
    cursor: 'pointer',
    textAlign: 'center'
  },
  btnActionOrange: {
    width: '100%',
    padding: '7px 12px',
    borderRadius: 9,
    background: '#ea580c',
    color: '#ffffff',
    border: 'none',
    fontSize: 11.5,
    fontWeight: 700,
    cursor: 'pointer',
    textAlign: 'center'
  },
  btnActionGreen: {
    width: '100%',
    padding: '7px 12px',
    borderRadius: 9,
    background: '#16a34a',
    color: '#ffffff',
    border: 'none',
    fontSize: 11.5,
    fontWeight: 700,
    cursor: 'pointer',
    textAlign: 'center'
  },

  // BOTTOM TUNGGAKAN & CICILAN SECTION
  bottomTunggakanCard: {
    background: '#ffffff',
    borderRadius: 22,
    padding: '24px',
    border: '1px solid #e2e8f0',
    boxShadow: '0 4px 20px rgba(0,0,0,0.03)'
  },
  tunggakanHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 18
  },
  tunggakanTitle: {
    margin: 0,
    fontSize: 16.5,
    fontWeight: 800,
    color: '#b45309'
  },
  tunggakanSubtitle: {
    margin: '3px 0 0',
    fontSize: 12,
    color: '#64748b'
  },
  btnLihatSemuaFinance: {
    padding: '8px 14px',
    borderRadius: 10,
    background: '#fff7ed',
    border: '1px solid #fed7aa',
    color: '#c2410c',
    fontSize: 12,
    fontWeight: 800,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: 6
  },
  emptyTunggakanBox: {
    textAlign: 'center',
    padding: '30px 16px',
    background: '#f0fdf4',
    borderRadius: 14,
    border: '1px dashed #bbf7d0'
  },
  tunggakanGrid: (isMobile) => ({
    display: 'grid',
    gridTemplateColumns: isMobile ? '1fr' : 'repeat(4, 1fr)',
    gap: 14
  }),
  tunggakanItemCard: {
    background: '#f8fafc',
    borderRadius: 16,
    padding: '14px',
    border: '1px solid #e2e8f0',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between'
  },
  tunggakanItemTop: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10
  },
  tunggakanAvatar: {
    width: 38,
    height: 38,
    borderRadius: '50%',
    background: '#ede9fe',
    color: '#6d28d9',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 13,
    fontWeight: 900,
    overflow: 'hidden',
    flexShrink: 0,
    border: '2px solid #ddd6fe'
  },
  tunggakanName: {
    fontSize: 12.5,
    fontWeight: 800,
    color: '#0f172a',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis'
  },
  tunggakanKelas: {
    fontSize: 10.5,
    color: '#64748b'
  },
  tunggakanNominalBox: {
    background: '#fff',
    borderRadius: 10,
    padding: '8px 10px',
    border: '1px solid #cbd5e1',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10
  },
  tunggakanLabel: {
    fontSize: 11,
    color: '#64748b'
  },
  tunggakanRupiah: {
    fontSize: 12.5,
    fontWeight: 800,
    color: '#dc2626'
  },
  tunggakanActions: {
    display: 'flex',
    gap: 6
  },
  btnDetailBayar: {
    flex: 1,
    padding: '7px 8px',
    borderRadius: 8,
    background: '#4f46e5',
    color: '#ffffff',
    border: 'none',
    fontSize: 11,
    fontWeight: 700,
    cursor: 'pointer'
  },
  btnWaOrtu: {
    padding: '7px 10px',
    borderRadius: 8,
    background: '#22c55e',
    color: '#ffffff',
    textDecoration: 'none',
    fontSize: 11,
    fontWeight: 700,
    display: 'flex',
    alignItems: 'center',
    gap: 4
  }
};

export default Dashboard;
