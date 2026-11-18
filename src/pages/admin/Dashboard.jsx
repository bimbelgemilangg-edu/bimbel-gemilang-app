// src/pages/admin/Dashboard.jsx
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import SidebarAdmin from '../../components/SidebarAdmin';
import { db } from '../../firebase';
import { collection, query, where, getDocs, onSnapshot, limit, orderBy } from "firebase/firestore";
import { 
  Users, GraduationCap, Calendar, Clock, BookOpen, 
  TrendingUp, AlertCircle, CheckCircle, ArrowRight, Bell, 
  RefreshCw, Plus, Eye, ChevronRight, ChevronLeft, LayoutDashboard,
  Trophy, Sparkles, Star, Award, Search, Check,
  UserPlus, Library, FileText, Send, MessageCircle, ExternalLink, X,
  CreditCard, Receipt, BarChart3, Clock3
} from 'lucide-react';
import { 
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid 
} from 'recharts';
import { ambilSesiAdmin, LABEL_PERAN_ADMIN } from '../../utils/adminAuth';
import { isOwnerSession } from '../../utils/roleAkses';
import { hitungProyeksiStokMenipis } from '../../utils/mesinTryOutOtomatis';

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

  // Scroll Container Refs
  const statsScrollRef = useRef(null);
  const actionScrollRef = useRef(null);
  const tunggakanScrollRef = useRef(null);

  const scrollHorizontally = (ref, offset) => {
    if (ref.current) {
      ref.current.scrollBy({ left: offset, behavior: 'smooth' });
    }
  };

  // Filter & Search
  const [searchQuery, setSearchQuery] = useState('');

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
  const [stokPeringatan, setStokPeringatan] = useState([]);

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

      // 5. Early Warning System (EWS) Stok Soal Try Out Otomatis (< 2 Minggu)
      try {
        const snapTemplates = await getDocs(collection(db, "tryout_templates"));
        const daftarTemplate = snapTemplates.docs
          .map((d) => ({ id: d.id, ...d.data() }))
          .filter((t) => t.aktif !== false);
        const semuaPeringatan = [];
        for (const t of daftarTemplate) {
          if (t.jenjang && Array.isArray(t.komposisi)) {
            const w = await hitungProyeksiStokMenipis(t.jenjang, t.komposisi);
            if (w && w.length > 0) {
              semuaPeringatan.push(...w.map((p) => ({ ...p, templateNama: t.nama })));
            }
          }
        }
        setStokPeringatan(semuaPeringatan);
      } catch (errStok) {
        console.warn("EWS stok check warn:", errStok);
      }

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
          <div style={{ flexShrink: 0 }}>
            <h1 style={styles.topTitle}>Dashboard</h1>
            <p style={styles.topSubtitle}>
              {time.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          </div>

          {/* Search Bar Tengah */}
          <form onSubmit={handleSearchSubmit} style={styles.searchBox(isMobile)}>
            <Search size={16} color="#94a3b8" />
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
              <RefreshCw size={16} color="#64748b" />
            </button>

            <button 
              type="button" 
              onClick={() => navigate('/admin/students')} 
              style={styles.iconBtn} 
              title="Notifikasi"
            >
              <Bell size={16} color="#64748b" />
              {(newStudents.length > 0 || duePayments.length > 0) && (
                <span style={styles.notifDot}>{newStudents.length + duePayments.length}</span>
              )}
            </button>

            {/* User Profile Pill */}
            <div style={styles.userProfilePill}>
              <div style={styles.userAvatarTop}>
                {owner ? '👑' : getInitials(namaAdmin)}
              </div>
              <div style={{ textAlign: 'left', lineHeight: 1.2, display: isMobile ? 'none' : 'block' }}>
                <div style={styles.profileName}>{namaAdmin}</div>
                <div style={styles.profileRole}>{peranAdmin}</div>
              </div>
            </div>
          </div>
        </header>

        {/* ============================================================ */}
        {/* ⚠️ EARLY WARNING SYSTEM (EWS): STOK SOAL MENIPIS < 2 PEKAN  */}
        {/* ============================================================ */}
        {stokPeringatan.length > 0 && (
          <div style={styles.ewsWarningBanner}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
              <div style={styles.ewsIconWrapper}>
                <AlertCircle size={22} color="#dc2626" />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  <span style={styles.ewsTitle}>⚠️ Early Warning AI: Stok Soal Try Out & Roadmap Menipis (&lt; 2 Minggu)</span>
                  <span style={styles.ewsBadgeCount}>{stokPeringatan.length} Subtes Kritis</span>
                </div>
                <p style={styles.ewsDesc}>
                  AI mendeteksi stok butir soal baru di Bank Soal hampir habis dan diproyeksikan tidak mencukupi untuk 2 minggu ke depan.
                  Segera unggah atau impor naskah soal baru agar jadwal otomatis dan asesmen roadmap siswa berjalan tanpa hambatan:
                </p>
                <div style={styles.ewsTagList}>
                  {stokPeringatan.map((p, idx) => (
                    <span key={idx} style={styles.ewsTagItem}>
                      <strong>{p.jenjang}</strong> • {p.mapel}: tersisa <b>{p.sisaSoalBaru} butir baru</b> (kebutuhan 2 pekan: {p.butuhDuaPekan} butir)
                    </span>
                  ))}
                </div>
              </div>
            </div>
            <div style={styles.ewsActionWrap}>
              <button
                type="button"
                onClick={() => navigate('/admin/bank-soal/import')}
                style={styles.ewsBtnImport}
              >
                <Plus size={15} /> Impor Soal Baru
              </button>
              <button
                type="button"
                onClick={() => navigate('/admin/bank-soal/tryout-otomatis')}
                style={styles.ewsBtnAtur}
              >
                Kelola Jadwal Otomatis
              </button>
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* TOP STAT CARDS (HORIZONTALLY SCROLLABLE - BISA DIGESER)      */}
        {/* ============================================================ */}
        <div style={styles.sectionHeaderFlex}>
          <div>
            <span style={styles.sectionSubLabel}>📊 Ringkasan Operasional Hari Ini</span>
            <span style={styles.scrollHint}>↔ Geser / scroll ke samping</span>
          </div>
          <div style={styles.arrowBtnGroup}>
            <button 
              type="button" 
              onClick={() => scrollHorizontally(statsScrollRef, -280)} 
              style={styles.arrowScrollBtn} 
              title="Geser Kiri"
            >
              <ChevronLeft size={16} />
            </button>
            <button 
              type="button" 
              onClick={() => scrollHorizontally(statsScrollRef, 280)} 
              style={styles.arrowScrollBtn} 
              title="Geser Kanan"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>

        <section ref={statsScrollRef} style={styles.statsScrollWrapper} className="custom-scrollbar">
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
                {teacherAttendanceStatus.filter(t => !t.sudahAbsen).length} Guru Belum Absen
              </div>
            </div>
          </div>

          {/* Card 4: Tindakan Admin & Tunggakan (Lime Green) */}
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

          {/* Card 5: Pendaftaran Online Baru (Amber / Orange) */}
          <div 
            style={{ ...styles.statCardVibrant, background: 'linear-gradient(135deg, #d97706 0%, #f59e0b 100%)' }}
            onClick={() => navigate('/admin/pendaftaran')}
          >
            <div style={styles.statIconBox}>
              <UserPlus size={22} color="#ffffff" />
            </div>
            <div style={styles.statNumberText}>
              <div style={styles.statValLarge}>{newStudents.length}</div>
              <div style={styles.statLabelWhite}>Pendaftaran Siswa Baru</div>
              <div style={styles.statSubText}>Perlu Validasi Kasir</div>
            </div>
          </div>

          {/* Card 6: Paket Perlu Diperpanjang (Rose / Red) */}
          <div 
            style={{ ...styles.statCardVibrant, background: 'linear-gradient(135deg, #e11d48 0%, #f43f5e 100%)' }}
            onClick={() => navigate('/admin/students')}
          >
            <div style={styles.statIconBox}>
              <Clock3 size={22} color="#ffffff" />
            </div>
            <div style={styles.statNumberText}>
              <div style={styles.statValLarge}>
                {students.filter(s => s.isHabis || s.isAkanHabis).length}
              </div>
              <div style={styles.statLabelWhite}>Paket Segera Habis</div>
              <div style={styles.statSubText}>Butuh Reminder Ortu</div>
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

              <div style={{ width: '100%', height: 200, marginTop: 10 }}>
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

            {/* ⚡ AKSI CEPAT MENU UTAMA ADMIN (HORIZONTALLY SCROLLABLE CAROUSEL) */}
            <div style={styles.actionHubSection}>
              <div style={styles.actionHubHeader}>
                <div>
                  <h3 style={styles.actionHubTitle}>⚡ Akses Cepat Menu Utama</h3>
                  <span style={styles.actionHubBadge}>Pintasan Operasional Harian (Bisa digeser ke samping)</span>
                </div>
                <div style={styles.arrowBtnGroup}>
                  <button 
                    type="button" 
                    onClick={() => scrollHorizontally(actionScrollRef, -280)} 
                    style={styles.arrowScrollBtn} 
                    title="Geser Kiri"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <button 
                    type="button" 
                    onClick={() => scrollHorizontally(actionScrollRef, 280)} 
                    style={styles.arrowScrollBtn} 
                    title="Geser Kanan"
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>

              <div ref={actionScrollRef} style={styles.actionScrollWrapper} className="custom-scrollbar">
                {/* 1. Kelola Siswa */}
                <div style={styles.actionCard}>
                  <div style={styles.actionCardHead}>
                    <div style={styles.actionIconBox('#eff6ff', '#2563eb')}>
                      <Users size={19} />
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
                      <GraduationCap size={19} />
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
                      <Trophy size={19} />
                    </div>
                    <span style={styles.actionBadgeOrange}>TOBK CBT</span>
                  </div>
                  <h4 style={styles.actionCardTitle}>Bank Soal & TryOut</h4>
                  <p style={styles.actionCardDesc}>
                    Rilis jadwal tryout akbar, pantau pengerjaan siswa, & kunci ujian.
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
                      <Library size={19} />
                    </div>
                    <span style={styles.actionBadgeGreen}>Buku Digital</span>
                  </div>
                  <h4 style={styles.actionCardTitle}>Perpustakaan & Modul</h4>
                  <p style={styles.actionCardDesc}>
                    Akses buku PDF Gemilang, generate kuis AI, & modul per bab.
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

                {/* 5. Kasir & Kwitansi Resmi */}
                <div style={styles.actionCard}>
                  <div style={styles.actionCardHead}>
                    <div style={styles.actionIconBox('#fdf2f8', '#db2777')}>
                      <Receipt size={19} />
                    </div>
                    <span style={styles.actionBadgeRose}>Kasir & Kwitansi</span>
                  </div>
                  <h4 style={styles.actionCardTitle}>Kwitansi & Pembayaran</h4>
                  <p style={styles.actionCardDesc}>
                    Cetak ulang kwitansi resmi siswa & catatan pembayaran kasir.
                  </p>
                  <div style={styles.actionBtnRow}>
                    <button 
                      onClick={() => navigate('/admin/finance?tab=kwitansi')} 
                      style={styles.btnActionRose}
                    >
                      Buka Kasir →
                    </button>
                  </div>
                </div>

                {/* 6. Pendaftaran Online Siswa */}
                <div style={styles.actionCard}>
                  <div style={styles.actionCardHead}>
                    <div style={styles.actionIconBox('#e0e7ff', '#4338ca')}>
                      <UserPlus size={19} />
                    </div>
                    <span style={styles.actionBadgeIndigo}>Online Form</span>
                  </div>
                  <h4 style={styles.actionCardTitle}>Pendaftaran Online</h4>
                  <p style={styles.actionCardDesc}>
                    Validasi pendaftar baru dari website & konfirmasi bukti transfer.
                  </p>
                  <div style={styles.actionBtnRow}>
                    <button 
                      onClick={() => navigate('/admin/pendaftaran')} 
                      style={styles.btnActionIndigo}
                    >
                      Cek Pendaftar →
                    </button>
                  </div>
                </div>

                {/* 7. Rapor & Smart Analytics */}
                <div style={styles.actionCard}>
                  <div style={styles.actionCardHead}>
                    <div style={styles.actionIconBox('#ecfeff', '#0891b2')}>
                      <BarChart3 size={19} />
                    </div>
                    <span style={styles.actionBadgeCyan}>AI Raport</span>
                  </div>
                  <h4 style={styles.actionCardTitle}>Rapor & Analitik</h4>
                  <p style={styles.actionCardDesc}>
                    Generate rapor otomatis bulanan & analitik kesiapan UTBK/TKA.
                  </p>
                  <div style={styles.actionBtnRow}>
                    <button 
                      onClick={() => navigate('/admin/raport')} 
                      style={styles.btnActionCyan}
                    >
                      Buka Rapor →
                    </button>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </section>

        {/* ============================================================ */}
        {/* BOTTOM SECTION: TUNGGAKAN & CICILAN SISWA (BISA DIGESER)     */}
        {/* ============================================================ */}
        <section style={styles.bottomTunggakanCard}>
          <div style={styles.tunggakanHeader}>
            <div>
              <h3 style={styles.tunggakanTitle}>
                ⚠️ Daftar Tunggakan & Cicilan Siswa ({duePayments.length} Siswa)
              </h3>
              <p style={styles.tunggakanSubtitle}>
                Pantau siswa dengan cicilan aktif atau jatuh tempo (Geser / scroll ke samping untuk melihat seluruh siswa)
              </p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={styles.arrowBtnGroup}>
                <button 
                  type="button" 
                  onClick={() => scrollHorizontally(tunggakanScrollRef, -300)} 
                  style={styles.arrowScrollBtn} 
                  title="Geser Kiri"
                >
                  <ChevronLeft size={16} />
                </button>
                <button 
                  type="button" 
                  onClick={() => scrollHorizontally(tunggakanScrollRef, 300)} 
                  style={styles.arrowScrollBtn} 
                  title="Geser Kanan"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
              <button 
                onClick={() => navigate('/admin/finance')} 
                style={styles.btnLihatSemuaFinance}
              >
                Buka Seluruh Keuangan <ArrowRight size={14} />
              </button>
            </div>
          </div>

          {duePayments.length === 0 ? (
            <div style={styles.emptyTunggakanBox}>
              <CheckCircle size={32} color="#10b981" />
              <p style={{ margin: '8px 0 0', fontWeight: 700, color: '#065f46' }}>
                Luar biasa! Tidak ada tunggakan atau cicilan siswa yang tertunda saat ini.
              </p>
            </div>
          ) : (
            <div ref={tunggakanScrollRef} style={styles.tunggakanScrollWrapper} className="custom-scrollbar">
              {duePayments.map((s) => {
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
                          <MessageCircle size={13} /> WA
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
      <style>{`
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        .custom-scrollbar::-webkit-scrollbar {
          height: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f1f5f9;
          border-radius: 999px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 999px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }
      `}</style>
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
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    overflowX: 'hidden'
  },
  mainContent: (isMobile) => ({
    flex: 1,
    minWidth: 0,
    marginLeft: isMobile ? 0 : 236,
    padding: isMobile ? '16px' : '24px 28px',
    boxSizing: 'border-box',
    width: isMobile ? '100%' : 'calc(100% - 236px)'
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
    marginBottom: 20
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
    width: isMobile ? '100%' : '340px',
    boxShadow: '0 2px 6px rgba(0,0,0,0.02)',
    boxSizing: 'border-box'
  }),
  searchInput: {
    border: 'none',
    outline: 'none',
    fontSize: 12.5,
    color: '#1e293b',
    width: '100%',
    background: 'transparent'
  },
  topRightActions: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    flexShrink: 0
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
    color: '#0f172a',
    maxWidth: 140,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis'
  },
  profileRole: {
    fontSize: 10.5,
    color: '#64748b',
    fontWeight: 600
  },

  // SECTION HEADERS WITH ARROWS
  sectionHeaderFlex: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8
  },
  sectionSubLabel: {
    fontSize: 13,
    fontWeight: 800,
    color: '#334155'
  },
  scrollHint: {
    fontSize: 11,
    color: '#94a3b8',
    marginLeft: 10
  },
  arrowBtnGroup: {
    display: 'flex',
    gap: 6
  },
  arrowScrollBtn: {
    width: 28,
    height: 28,
    borderRadius: 8,
    background: '#ffffff',
    border: '1px solid #cbd5e1',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    color: '#475569',
    transition: '0.2s',
    boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
  },

  // HORIZONTALLY SCROLLABLE STAT CARDS
  statsScrollWrapper: {
    display: 'flex',
    gap: 14,
    overflowX: 'auto',
    paddingBottom: 10,
    marginBottom: 20,
    scrollSnapType: 'x mandatory',
    WebkitOverflowScrolling: 'touch'
  },
  statCardVibrant: {
    borderRadius: 18,
    padding: '18px',
    minWidth: 240,
    flex: '0 0 240px',
    scrollSnapAlign: 'start',
    display: 'flex',
    alignItems: 'flex-start',
    gap: 14,
    cursor: 'pointer',
    boxShadow: '0 8px 18px -4px rgba(79, 70, 229, 0.2)',
    transition: 'transform 0.2s ease, box-shadow 0.2s ease'
  },
  statIconBox: {
    width: 42,
    height: 42,
    borderRadius: 13,
    background: 'rgba(255, 255, 255, 0.22)',
    backdropFilter: 'blur(4px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0
  },
  statNumberText: {
    color: '#ffffff',
    flex: 1,
    minWidth: 0
  },
  statValLarge: {
    fontSize: 26,
    fontWeight: 900,
    lineHeight: 1,
    letterSpacing: -0.5
  },
  statLabelWhite: {
    fontSize: 12.5,
    fontWeight: 700,
    marginTop: 5,
    opacity: 0.95,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis'
  },
  statSubText: {
    fontSize: 10.5,
    opacity: 0.85,
    marginTop: 2,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis'
  },

  // MIDDLE LAYOUT
  middleLayout: (isMobile) => ({
    display: 'grid',
    gridTemplateColumns: isMobile ? '1fr' : '320px 1fr',
    gap: 20,
    marginBottom: 20,
    alignItems: 'start'
  }),

  // SPOTLIGHT CARD (KIRI)
  spotlightCard: {
    background: '#ffffff',
    borderRadius: 22,
    padding: '22px 18px',
    border: '1px solid #e2e8f0',
    boxShadow: '0 4px 20px rgba(0,0,0,0.03)',
    display: 'flex',
    flexDirection: 'column'
  },
  spotlightHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14
  },
  badgeGold: {
    fontSize: 11.5,
    fontWeight: 800,
    color: '#b45309',
    background: '#fef3c7',
    padding: '3px 9px',
    borderRadius: 999
  },
  badgeCrown: {
    fontSize: 11,
    fontWeight: 800,
    color: '#7c3aed',
    background: '#ede9fe',
    padding: '3px 8px',
    borderRadius: 999
  },
  avatarSpotlightWrapper: {
    display: 'flex',
    justifyContent: 'center',
    margin: '6px 0 12px'
  },
  avatarRingOuter: {
    width: 86,
    height: 86,
    borderRadius: '50%',
    padding: 3.5,
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
    fontSize: 24,
    fontWeight: 900
  },
  spotlightProfile: {
    textAlign: 'center',
    marginBottom: 16
  },
  spotlightName: {
    margin: 0,
    fontSize: 15,
    fontWeight: 800,
    color: '#0f172a'
  },
  spotlightRole: {
    margin: '3px 0 0',
    fontSize: 11.5,
    color: '#64748b'
  },
  gaugeRow: {
    display: 'flex',
    justifyContent: 'space-around',
    padding: '10px 4px',
    background: '#f8fafc',
    borderRadius: 14,
    marginBottom: 18
  },
  gaugeItem: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 3
  },
  gaugeCircle: (color, bg) => ({
    width: 44,
    height: 44,
    borderRadius: '50%',
    background: bg,
    color: color,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 11.5,
    fontWeight: 900,
    border: `2px solid ${color}`
  }),
  gaugeLabel: {
    fontSize: 10,
    fontWeight: 700,
    color: '#475569'
  },
  recentStudentsSection: {
    borderTop: '1px solid #f1f5f9',
    paddingTop: 14
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
    padding: '7px 9px',
    borderRadius: 12,
    background: '#f8fafc',
    cursor: 'pointer',
    transition: '0.2s'
  },
  recentAvatar: {
    width: 30,
    height: 30,
    borderRadius: '50%',
    background: '#e2e8f0',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 10.5,
    fontWeight: 800,
    color: '#475569',
    overflow: 'hidden',
    flexShrink: 0
  },
  recentName: {
    fontSize: 11.5,
    fontWeight: 700,
    color: '#1e293b',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis'
  },
  recentMeta: {
    fontSize: 10,
    color: '#64748b'
  },
  rankBadge: (rank) => ({
    fontSize: 10.5,
    fontWeight: 900,
    padding: '2px 6px',
    borderRadius: 6,
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
    fontSize: 11,
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
    gap: 18,
    minWidth: 0
  },
  chartCard: {
    background: '#ffffff',
    borderRadius: 22,
    padding: '18px 22px',
    border: '1px solid #e2e8f0',
    boxShadow: '0 4px 20px rgba(0,0,0,0.03)'
  },
  chartHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    flexWrap: 'wrap',
    gap: 10
  },
  chartTitle: {
    margin: 0,
    fontSize: 15,
    fontWeight: 800,
    color: '#0f172a'
  },
  chartSubtitle: {
    margin: '2px 0 0',
    fontSize: 11.5,
    color: '#64748b'
  },
  chartLegendRow: {
    display: 'flex',
    gap: 12,
    fontSize: 11,
    fontWeight: 700
  },
  legendDot: (color) => ({
    color: color
  }),

  // ACTION HUB HORIZONTALLY SCROLLABLE
  actionHubSection: {
    minWidth: 0
  },
  actionHubHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8
  },
  actionHubTitle: {
    margin: 0,
    fontSize: 15,
    fontWeight: 800,
    color: '#0f172a'
  },
  actionHubBadge: {
    fontSize: 11,
    fontWeight: 600,
    color: '#64748b'
  },
  actionScrollWrapper: {
    display: 'flex',
    gap: 14,
    overflowX: 'auto',
    paddingBottom: 10,
    scrollSnapType: 'x mandatory',
    WebkitOverflowScrolling: 'touch'
  },
  actionCard: {
    background: '#ffffff',
    borderRadius: 18,
    padding: '16px',
    border: '1px solid #e2e8f0',
    boxShadow: '0 2px 10px rgba(0,0,0,0.02)',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    minWidth: 250,
    flex: '0 0 250px',
    scrollSnapAlign: 'start'
  },
  actionCardHead: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8
  },
  actionIconBox: (bg, color) => ({
    width: 36,
    height: 36,
    borderRadius: 11,
    background: bg,
    color: color,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  }),
  actionBadgeBlue: {
    fontSize: 10.5,
    fontWeight: 800,
    color: '#2563eb',
    background: '#eff6ff',
    padding: '2px 8px',
    borderRadius: 999
  },
  actionBadgePurple: {
    fontSize: 10.5,
    fontWeight: 800,
    color: '#7c3aed',
    background: '#faf5ff',
    padding: '2px 8px',
    borderRadius: 999
  },
  actionBadgeOrange: {
    fontSize: 10.5,
    fontWeight: 800,
    color: '#ea580c',
    background: '#fff7ed',
    padding: '2px 8px',
    borderRadius: 999
  },
  actionBadgeGreen: {
    fontSize: 10.5,
    fontWeight: 800,
    color: '#16a34a',
    background: '#f0fdf4',
    padding: '2px 8px',
    borderRadius: 999
  },
  actionBadgeRose: {
    fontSize: 10.5,
    fontWeight: 800,
    color: '#db2777',
    background: '#fdf2f8',
    padding: '2px 8px',
    borderRadius: 999
  },
  actionBadgeIndigo: {
    fontSize: 10.5,
    fontWeight: 800,
    color: '#4338ca',
    background: '#e0e7ff',
    padding: '2px 8px',
    borderRadius: 999
  },
  actionBadgeCyan: {
    fontSize: 10.5,
    fontWeight: 800,
    color: '#0891b2',
    background: '#ecfeff',
    padding: '2px 8px',
    borderRadius: 999
  },
  actionCardTitle: {
    margin: '0 0 3px',
    fontSize: 13.5,
    fontWeight: 800,
    color: '#0f172a'
  },
  actionCardDesc: {
    margin: '0 0 12px',
    fontSize: 11,
    color: '#64748b',
    lineHeight: 1.4
  },
  actionBtnRow: {
    display: 'flex',
    gap: 8
  },
  btnActionPrimary: {
    flex: 1,
    padding: '7px 10px',
    borderRadius: 8,
    background: '#4f46e5',
    color: '#ffffff',
    border: 'none',
    fontSize: 11,
    fontWeight: 700,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4
  },
  btnActionSecondary: {
    padding: '7px 10px',
    borderRadius: 8,
    background: '#f1f5f9',
    color: '#334155',
    border: 'none',
    fontSize: 11,
    fontWeight: 700,
    cursor: 'pointer'
  },
  btnActionPurple: {
    width: '100%',
    padding: '7px 12px',
    borderRadius: 8,
    background: '#7c3aed',
    color: '#ffffff',
    border: 'none',
    fontSize: 11,
    fontWeight: 700,
    cursor: 'pointer',
    textAlign: 'center'
  },
  btnActionOrange: {
    width: '100%',
    padding: '7px 12px',
    borderRadius: 8,
    background: '#ea580c',
    color: '#ffffff',
    border: 'none',
    fontSize: 11,
    fontWeight: 700,
    cursor: 'pointer',
    textAlign: 'center'
  },
  btnActionGreen: {
    width: '100%',
    padding: '7px 12px',
    borderRadius: 8,
    background: '#16a34a',
    color: '#ffffff',
    border: 'none',
    fontSize: 11,
    fontWeight: 700,
    cursor: 'pointer',
    textAlign: 'center'
  },
  btnActionRose: {
    width: '100%',
    padding: '7px 12px',
    borderRadius: 8,
    background: '#db2777',
    color: '#ffffff',
    border: 'none',
    fontSize: 11,
    fontWeight: 700,
    cursor: 'pointer',
    textAlign: 'center'
  },
  btnActionIndigo: {
    width: '100%',
    padding: '7px 12px',
    borderRadius: 8,
    background: '#4338ca',
    color: '#ffffff',
    border: 'none',
    fontSize: 11,
    fontWeight: 700,
    cursor: 'pointer',
    textAlign: 'center'
  },
  btnActionCyan: {
    width: '100%',
    padding: '7px 12px',
    borderRadius: 8,
    background: '#0891b2',
    color: '#ffffff',
    border: 'none',
    fontSize: 11,
    fontWeight: 700,
    cursor: 'pointer',
    textAlign: 'center'
  },

  // BOTTOM TUNGGAKAN & CICILAN SECTION
  bottomTunggakanCard: {
    background: '#ffffff',
    borderRadius: 22,
    padding: '20px 22px',
    border: '1px solid #e2e8f0',
    boxShadow: '0 4px 20px rgba(0,0,0,0.03)',
    minWidth: 0
  },
  tunggakanHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 14
  },
  tunggakanTitle: {
    margin: 0,
    fontSize: 15.5,
    fontWeight: 800,
    color: '#b45309'
  },
  tunggakanSubtitle: {
    margin: '3px 0 0',
    fontSize: 11.5,
    color: '#64748b'
  },
  btnLihatSemuaFinance: {
    padding: '7px 12px',
    borderRadius: 9,
    background: '#fff7ed',
    border: '1px solid #fed7aa',
    color: '#c2410c',
    fontSize: 11.5,
    fontWeight: 800,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: 5
  },
  emptyTunggakanBox: {
    textAlign: 'center',
    padding: '24px 16px',
    background: '#f0fdf4',
    borderRadius: 14,
    border: '1px dashed #bbf7d0'
  },
  tunggakanScrollWrapper: {
    display: 'flex',
    gap: 14,
    overflowX: 'auto',
    paddingBottom: 10,
    paddingTop: 4,
    scrollSnapType: 'x mandatory',
    WebkitOverflowScrolling: 'touch'
  },
  tunggakanItemCard: {
    background: '#f8fafc',
    borderRadius: 16,
    padding: '14px',
    border: '1px solid #e2e8f0',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    minWidth: 240,
    flex: '0 0 240px',
    scrollSnapAlign: 'start',
    boxShadow: '0 2px 8px rgba(0,0,0,0.02)'
  },
  tunggakanItemTop: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8
  },
  tunggakanAvatar: {
    width: 36,
    height: 36,
    borderRadius: '50%',
    background: '#ede9fe',
    color: '#6d28d9',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 12,
    fontWeight: 900,
    overflow: 'hidden',
    flexShrink: 0,
    border: '2px solid #ddd6fe'
  },
  tunggakanName: {
    fontSize: 12,
    fontWeight: 800,
    color: '#0f172a',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis'
  },
  tunggakanKelas: {
    fontSize: 10,
    color: '#64748b'
  },
  tunggakanNominalBox: {
    background: '#fff',
    borderRadius: 8,
    padding: '6px 8px',
    border: '1px solid #cbd5e1',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8
  },
  tunggakanLabel: {
    fontSize: 10.5,
    color: '#64748b'
  },
  tunggakanRupiah: {
    fontSize: 12,
    fontWeight: 800,
    color: '#dc2626'
  },
  tunggakanActions: {
    display: 'flex',
    gap: 6
  },
  btnDetailBayar: {
    flex: 1,
    padding: '6px 8px',
    borderRadius: 7,
    background: '#4f46e5',
    color: '#ffffff',
    border: 'none',
    fontSize: 10.5,
    fontWeight: 700,
    cursor: 'pointer'
  },
  btnWaOrtu: {
    padding: '6px 10px',
    borderRadius: 7,
    background: '#22c55e',
    color: '#ffffff',
    textDecoration: 'none',
    fontSize: 10.5,
    fontWeight: 700,
    display: 'flex',
    alignItems: 'center',
    gap: 4
  },
  // Early Warning System (EWS) Styles
  ewsWarningBanner: {
    background: 'linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)',
    border: '1.5px solid #fca5a5',
    borderRadius: 16,
    padding: '16px 20px',
    margin: '0 0 20px 0',
    boxShadow: '0 4px 12px rgba(220, 38, 38, 0.08)',
  },
  ewsIconWrapper: {
    width: 40,
    height: 40,
    borderRadius: 12,
    background: '#fee2e2',
    border: '1px solid #fecaca',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  ewsTitle: {
    fontSize: 14.5,
    fontWeight: 800,
    color: '#991b1b',
  },
  ewsBadgeCount: {
    background: '#dc2626',
    color: '#ffffff',
    fontSize: 11,
    fontWeight: 800,
    padding: '2px 8px',
    borderRadius: 99,
  },
  ewsDesc: {
    fontSize: 12.5,
    color: '#7f1d1d',
    lineHeight: 1.5,
    margin: '6px 0 10px',
  },
  ewsTagList: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 8,
  },
  ewsTagItem: {
    background: '#ffffff',
    border: '1px solid #fca5a5',
    borderRadius: 8,
    padding: '4px 10px',
    fontSize: 11.5,
    color: '#991b1b',
    boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
  },
  ewsActionWrap: {
    display: 'flex',
    gap: 10,
    marginTop: 14,
    flexWrap: 'wrap',
  },
  ewsBtnImport: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    background: '#dc2626',
    color: '#ffffff',
    border: 'none',
    borderRadius: 10,
    padding: '8px 16px',
    fontSize: 12.5,
    fontWeight: 800,
    cursor: 'pointer',
    boxShadow: '0 2px 6px rgba(220, 38, 38, 0.25)',
  },
  ewsBtnAtur: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    background: '#ffffff',
    color: '#991b1b',
    border: '1px solid #fca5a5',
    borderRadius: 10,
    padding: '8px 14px',
    fontSize: 12.5,
    fontWeight: 700,
    cursor: 'pointer',
  }
};

export default Dashboard;
