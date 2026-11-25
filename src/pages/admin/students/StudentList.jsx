// src/pages/admin/students/StudentList.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import SidebarAdmin from '../../../components/SidebarAdmin';
import { db } from '../../../firebase';
import { collection, getDocs, deleteDoc, doc, updateDoc, addDoc, serverTimestamp, query, limit, where, writeBatch } from "firebase/firestore";
import * as XLSX from 'xlsx';
import { 
  Search, Sparkles, Copy, MessageSquare, Plus, PlusCircle, Edit3, Trash2, UserCheck, UserX, Users,
  Home, ChevronRight, BookOpen, RefreshCw, AlertCircle, CheckCircle,
  CreditCard, Calendar, Clock, Hash, Download, PieChart, BarChart3,
  FileSpreadsheet, Printer, Bell, Zap, Send, Mail, User, GraduationCap,
  Layers, TrendingUp, Award, Filter, X, Eye, Camera, AlertTriangle, ShieldCheck
} from 'lucide-react';
import { uploadElearningFile } from '../../../services/uploadService';
// 🔥 BARU (2026-11-16): English Course masa aktif berbasis kuota pertemuan (8x/bulan)
// dicocokkan otomatis dari absensi guru & siswa (bukan habis kalender).
import { hitungKuotaEnglishCourse, isProgramEnglish } from '../../../utils/kuotaEnglishCourse';
import { DAFTAR_KELAS_PER_JENJANG, normalisasiKelasDanJenjang } from '../../../utils/normalisasiKelasJenjang';

const StudentList = () => {
  const navigate = useNavigate();
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('semua');
  const [filterStatus, setFilterStatus] = useState('semua');
  const [_isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [alertMsg, setAlertMsg] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [_showFilters, _setShowFilters] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  // 🎯 TRIAL CLASS STATE
  const [showTrialModal, setShowTrialModal] = useState(false);
  const [trialSuccessData, setTrialSuccessData] = useState(null);
  const [creatingTrial, setCreatingTrial] = useState(false);
  const [trialForm, setTrialForm] = useState({
    nama: '',
    jenjang: 'smp',
    kelasSekolah: '7 SMP',
    program: 'Reguler SMP',
    noHp: ''
  });
  const [showAccessModal, setShowAccessModal] = useState(false);
  const [sendingAccess, setSendingAccess] = useState(false);

  // 🔥 BARU (2026-11-16): Absensi siswa & jurnal guru untuk pelacakan kuota 8x sesi English Course
  const [attendanceList, setAttendanceList] = useState([]);
  const [teacherLogsList, setTeacherLogsList] = useState([]);
  const [modalRincianData, setModalRincianData] = useState(null);
  const [showModalRincianSesi, setShowModalRincianSesi] = useState(false);

  // 🔥 BARU: Audit Selisih Keuangan Siswa (Buku Kas vs Profil Siswa)
  const [showAuditModal, setShowAuditModal] = useState(false);
  const [auditSelisihMap, setAuditSelisihMap] = useState({});
  const [auditSelisihList, setAuditSelisihList] = useState([]);

  // 🧹 BARU: Audit & Perbaikan Data Kelas/Jenjang Siswa (Root Cause Cleanup)
  const [showAuditJenjangModal, setShowAuditJenjangModal] = useState(false);
  const [memperbaikiJenjang, setMemperbaikiJenjang] = useState(false);

  const auditJenjangList = React.useMemo(() => {
    return students
      .map((s) => {
        const norm = normalisasiKelasDanJenjang({
          kelasSekolah: s.kelasSekolah,
          kelas: s.kelas,
          jenjang: s.jenjang,
          programType: s.programType || s.kategori,
          kategori: s.kategori,
        });
        const lamaJenjang = String(s.jenjang || '').trim();
        const lamaKelasSekolah = String(s.kelasSekolah || '').trim();
        const lamaKelas = String(s.kelas || '').trim();
        const butuhUpdate =
          (norm.jenjang && lamaJenjang !== norm.jenjang) ||
          (norm.kelasSekolah && lamaKelasSekolah !== norm.kelasSekolah) ||
          (norm.kelas && lamaKelas !== norm.kelas);
        if (!butuhUpdate) return null;
        return {
          id: s.id,
          nama: s.nama || 'Siswa',
          lamaJenjang: lamaJenjang || '(kosong)',
          lamaKelasSekolah: lamaKelasSekolah || lamaKelas || '(kosong)',
          baruJenjang: norm.jenjang || lamaJenjang,
          baruKelasSekolah: norm.kelasSekolah || lamaKelasSekolah,
          baruKelas: norm.kelas || norm.kelasSekolah,
        };
      })
      .filter(Boolean);
  }, [students]);

  const handlePerbaikiSemuaJenjang = async () => {
    if (auditJenjangList.length === 0) return;
    setMemperbaikiJenjang(true);
    try {
      const CHUNK = 400;
      for (let i = 0; i < auditJenjangList.length; i += CHUNK) {
        const batch = writeBatch(db);
        auditJenjangList.slice(i, i + CHUNK).forEach((item) => {
          batch.update(doc(db, 'students', item.id), {
            jenjang: item.baruJenjang,
            kelasSekolah: item.baruKelasSekolah,
            kelas: item.baruKelas,
            updatedAt: serverTimestamp(),
          });
        });
        await batch.commit();
      }
      showAlert(`✅ ${auditJenjangList.length} data kelas & jenjang siswa berhasil dirapikan!`);
      setShowAuditJenjangModal(false);
      fetchStudents();
    } catch (err) {
      console.error('Gagal merapikan jenjang:', err);
      showAlert('❌ Gagal merapikan data: ' + err.message);
    } finally {
      setMemperbaikiJenjang(false);
    }
  };

  // 🔥 BARU: Quick photo upload langsung dari tabel siswa
  const fotoInputRef = useRef(null);
  const [targetStudentForFoto, setTargetStudentForFoto] = useState(null);
  const [uploadingFoto, setUploadingFoto] = useState(false);

  const handleQuickFotoChange = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file || !targetStudentForFoto) return;
    if (!file.type.startsWith('image/')) {
      alert('File harus berupa gambar.');
      return;
    }
    setUploadingFoto(true);
    try {
      const res = await uploadElearningFile(file, 'foto-siswa');
      if (res?.success && res.downloadURL) {
        await updateDoc(doc(db, 'students', targetStudentForFoto), { fotoUrl: res.downloadURL });
        setStudents(prev => prev.map(s => s.id === targetStudentForFoto ? { ...s, fotoUrl: res.downloadURL } : s));
        showAlert('✅ Foto siswa berhasil diperbarui!');
      } else {
        throw new Error(res?.error || 'Gagal mengunggah foto');
      }
    } catch (err) {
      alert('❌ Gagal upload foto: ' + err.message);
    } finally {
      setUploadingFoto(false);
      setTargetStudentForFoto(null);
    }
  };

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
      // 🔥 Muat seluruh data: siswa, absensi, jurnal guru, dan finance_logs untuk audit real-time
      const [snap, snapAtt, snapLogs, logsSnap] = await Promise.all([
        getDocs(collection(db, "students")),
        getDocs(collection(db, "attendance")).catch(() => ({ docs: [] })),
        getDocs(collection(db, "teacher_logs")).catch(() => ({ docs: [] })),
        getDocs(query(collection(db, "finance_logs"), where("type", "==", "Pemasukan"))).catch(() => ({ docs: [] }))
      ]);

      // Map akumulasi uang riil kasir/bank per siswa
      const logsMapById = {};
      const logsMapByName = {};
      logsSnap.docs.forEach(docSnap => {
        const l = docSnap.data();
        if (l.method === 'Cicilan') return;
        const amt = Math.round(Number(l.amount) || 0);
        if (l.studentId) {
          logsMapById[l.studentId] = (logsMapById[l.studentId] || 0) + amt;
        }
        if (l.namaSiswa) {
          const keyNama = l.namaSiswa.trim().toLowerCase();
          logsMapByName[keyNama] = (logsMapByName[keyNama] || 0) + amt;
        }
      });

      const selMap = {};
      const selList = [];

      const data = snap.docs.map(d => {
        const sData = d.data();
        const sId = sData.studentId || d.id;
        const bayar = parseInt(sData.totalBayar || 0);
        const total = parseInt(sData.totalTagihan || 0);
        const keyNama = (sData.nama || '').trim().toLowerCase();

        const uangRiil = (logsMapById[sId] !== undefined)
          ? logsMapById[sId]
          : (logsMapById[d.id] !== undefined
            ? logsMapById[d.id]
            : (logsMapByName[keyNama] || 0));

        // Deteksi siswa lunas semu / selisih kasir
        if (bayar > 0 && bayar > uangRiil) {
          const sel = bayar - uangRiil;
          const auditItem = {
            id: d.id,
            studentId: sId,
            nama: sData.nama,
            kelas: sData.kelasSekolah || '-',
            totalTagihan: total,
            totalBayar: bayar,
            uangRiil,
            selisih: sel,
            isLunasSemu: (total - bayar) <= 0
          };
          selMap[d.id] = auditItem;
          selMap[sId] = auditItem;
          selList.push(auditItem);
        }

        return { 
          id: d.id, 
          ...sData,
          studentId: sId
        };
      });

      data.sort((a, b) => (a.nama || '').localeCompare(b.nama || ''));
      setStudents(data);
      setAuditSelisihMap(selMap);
      setAuditSelisihList(selList.sort((a, b) => b.selisih - a.selisih));
      setAttendanceList(snapAtt.docs.map(d => ({ id: d.id, ...d.data() })));
      setTeacherLogsList(snapLogs.docs.map(d => ({ id: d.id, ...d.data() })));
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
    // 🔥 BARU (2026-11-16): English Course masa aktif berbasis kuota pertemuan (8x/bulan)
    // bukan habis tanggal kalender. Dicocokkan dari absensi guru & siswa.
    const isEnglish = s.kategori === 'English' || isProgramEnglish(s.studentId);
    if (isEnglish) {
      const kuota = hitungKuotaEnglishCourse({
        durasiBulan: s.durasiBulan || 1,
        tanggalMulai: s.tanggalMulai,
        attendanceList,
        teacherLogs: teacherLogsList,
        student: s
      });
      return {
        label: kuota.labelStatus,
        color: kuota.badgeWarna.color,
        bg: kuota.badgeWarna.bg,
        days: kuota.isHabis ? -1 : (kuota.isHampirHabis ? 15 : 60),
        isHabis: kuota.isHabis,
        isAkanHabis: kuota.isHampirHabis,
        isEnglishCourse: true,
        kuota
      };
    }

    if (!s.tanggalSelesai) return { label: 'Tidak Diketahui', color: '#94a3b8', bg: '#f1f5f9', days: null, isHabis: false, isAkanHabis: false };

    // v1.5.8-hotfix: tanggalSelesai rusak ('-' tersimpan bila tanggalMulai
    // kosong, atau string sampah) dulu jatuh ke cabang else = label 'Aktif'
    // SELAMANYA (NaN gagal di semua perbandingan). Sekarang jujur: tidak diketahui.
    const selesaiParse = new Date(s.tanggalSelesai);
    if (Number.isNaN(selesaiParse.getTime())) return { label: 'Tidak Diketahui', color: '#94a3b8', bg: '#f1f5f9', days: null, isHabis: false, isAkanHabis: false };

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const selesai = new Date(s.tanggalSelesai);
    selesai.setHours(0, 0, 0, 0);
    
    const diffDays = Math.ceil((selesai - today) / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return { label: 'Habis', color: '#ef4444', bg: '#fee2e2', days: diffDays, isHabis: true, isAkanHabis: false };
    if (diffDays <= 30) return { label: `${diffDays} hari`, color: '#f59e0b', bg: '#fef3c7', days: diffDays, isHabis: false, isAkanHabis: true };
    if (diffDays <= 90) return { label: `${diffDays} hari`, color: '#3b82f6', bg: '#dbeafe', days: diffDays, isHabis: false, isAkanHabis: false };
    return { label: 'Aktif', color: '#10b981', bg: '#dcfce7', days: diffDays, isHabis: false, isAkanHabis: false };
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
    
    if (activeTab === 'trial') {
      filtered = filtered.filter(s => s.isTrial === true || s.status === 'Trial');
    } else if (activeTab !== 'semua') {
      filtered = filtered.filter(s => getJenjang(s) === activeTab && !s.isTrial);
    }
    
    if (filterStatus === 'aktif') {
      filtered = filtered.filter(s => !s.isBlocked);
    } else if (filterStatus === 'blokir') {
      filtered = filtered.filter(s => s.isBlocked);
    } else if (filterStatus === 'habis') {
      filtered = filtered.filter(s => {
        if (s.isBlocked) return false;
        const st = getMasaAktifStatus(s);
        return st.isHabis;
      });
    } else if (filterStatus === 'akan-habis') {
      filtered = filtered.filter(s => {
        if (s.isBlocked) return false;
        const st = getMasaAktifStatus(s);
        return st.isAkanHabis;
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
    const habis = list.filter(s => !s.isBlocked && getMasaAktifStatus(s).isHabis).length;
    const akanHabis = list.filter(s => !s.isBlocked && getMasaAktifStatus(s).isAkanHabis).length;
    
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
    } catch (_error) {
      showAlert('❌ Gagal mengirim akses');
    }
    setSendingAccess(false);
  };


  // 🎯 GENERATE AKUN TRIAL CLASS (3 HARI)
  const handleCreateTrial = async (e) => {
    e.preventDefault();
    if (!trialForm.nama.trim()) return showAlert('⚠️ Nama calon siswa trial wajib diisi!');

    setCreatingTrial(true);
    try {
      const now = new Date();
      const pad = (n) => String(n).padStart(2, '0');
      const y = now.getFullYear();
      const m = pad(now.getMonth() + 1);
      const d = pad(now.getDate());
      const tglMulai = `${y}-${m}-${d}`;

      // Hitung 3 hari ke depan
      const expDate = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
      const tglSelesai = `${expDate.getFullYear()}-${pad(expDate.getMonth() + 1)}-${pad(expDate.getDate())}`;

      const randomSuffix = Math.floor(100 + Math.random() * 900);
      const cleanName = trialForm.nama.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 8);
      const cleanKelas = trialForm.kelasSekolah.toLowerCase().replace(/[^a-z0-9]/g, '');
      const generatedUsername = `trial.${cleanName || 'siswa'}${randomSuffix}@gemilang.com`;
      const generatedPassword = `trial${randomSuffix}`;
      const studentId = `TRL-${y.toString().slice(2)}${m}${d}-${randomSuffix}`;

      // Tentukan mapel default sesuai jenjang
      let enrolled = ['bind', 'mtk', 'bing'];
      if (trialForm.jenjang === 'sd') enrolled = ['bind', 'mtk', 'ipa', 'ips', 'bing'];
      if (trialForm.jenjang === 'smp') enrolled = ['bind', 'mtk', 'ipa', 'ips', 'bing', 'prog_tka'];
      if (trialForm.jenjang === 'sma') enrolled = ['bind', 'mtk', 'fis', 'kim', 'bio', 'bing', 'prog_tka'];
      if (trialForm.jenjang === 'english') enrolled = ['bing', 'prog_engc'];

      const normTrial = normalisasiKelasDanJenjang({
        kelasSekolah: trialForm.kelasSekolah,
        jenjang: trialForm.jenjang,
        programType: trialForm.jenjang === 'english' ? 'English' : 'Reguler',
      });

      const newTrialStudent = {
        nama: trialForm.nama.trim(),
        username: generatedUsername,
        password: generatedPassword,
        studentId: studentId,
        jenjang: normTrial.jenjang || trialForm.jenjang.toUpperCase(),
        kelas: normTrial.kelasSekolah,
        kelasSekolah: normTrial.kelasSekolah,
        kategori: trialForm.program,
        detailProgram: `Trial Class - ${normTrial.kelasSekolah}`,
        paketNama: 'Trial Class 3 Hari',
        durasiBulan: 0.1,
        tanggalMulai: tglMulai,
        tanggalSelesai: tglSelesai,
        trialExpiresAt: expDate.toISOString(),
        isTrial: true,
        status: 'Trial',
        role: 'siswa',
        isBlocked: false,
        totalTagihan: 0,
        totalBayar: 0,
        noHp: trialForm.noHp || '',
        ortu: { hp: trialForm.noHp || '', ayah: '-', ibu: '-' },
        enrolledSubjects: enrolled,
        createdAt: serverTimestamp()
      };

      const docRef = await addDoc(collection(db, 'students'), newTrialStudent);
      
      const resultData = {
        id: docRef.id,
        ...newTrialStudent,
        plainPassword: generatedPassword,
        expiresPanjang: expDate.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
      };

      setTrialSuccessData(resultData);
      showAlert('✅ Akun Trial Class 3 Hari berhasil diterbitkan!');
      fetchStudents();
    } catch (err) {
      console.error(err);
      showAlert('❌ Gagal membuat akun trial: ' + err.message);
    } finally {
      setCreatingTrial(false);
    }
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

        
        {/* === MODAL BUAT AKUN TRIAL CLASS (3 HARI) === */}
        {showTrialModal && (
          <div
            onClick={() => setShowTrialModal(false)}
            style={{
              position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
              background: 'rgba(15, 23, 42, 0.75)', zIndex: 9999,
              display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20
            }}
          >
            <div
              onClick={e => e.stopPropagation()}
              style={{
                background: 'white', borderRadius: 16, padding: 24, maxWidth: 480, width: '100%',
                boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.3)'
              }}
            >
              {!trialSuccessData ? (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                    <h3 style={{ margin: 0, color: '#1e293b', fontSize: 17, display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span>🎯</span> Buat Akun Trial Class (3 Hari)
                    </h3>
                    <button onClick={() => setShowTrialModal(false)} style={{ border: 'none', background: 'transparent', cursor: 'pointer', fontSize: 18, color: '#94a3b8' }}>✕</button>
                  </div>
                  <p style={{ margin: '0 0 16px 0', fontSize: 12, color: '#64748b', lineHeight: 1.5 }}>
                    Akun uji coba resmi untuk calon siswa. Otomatis berlaku <b>3 hari penuh</b> untuk merasakan fitur aplikasi (Try Out, Materi & Bank Soal). <b>Tidak ada tagihan keuangan!</b>
                  </p>

                  <form onSubmit={handleCreateTrial}>
                    <div style={{ marginBottom: 12 }}>
                      <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#475569', marginBottom: 4 }}>
                        Nama Calon Siswa *
                      </label>
                      <input
                        type="text"
                        placeholder="Contoh: Budi Santoso / Alvaro"
                        value={trialForm.nama}
                        onChange={e => setTrialForm({ ...trialForm, nama: e.target.value })}
                        required
                        style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 13, boxSizing: 'border-box' }}
                      />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
                      <div>
                        <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#475569', marginBottom: 4 }}>
                          Jenjang
                        </label>
                        <select
                          value={trialForm.jenjang}
                          onChange={e => {
                            const j = e.target.value;
                            let defK = '7 SMP';
                            let defProg = 'Reguler SMP';
                            if (j === 'sd') { defK = '5 SD'; defProg = 'Reguler SD'; }
                            if (j === 'sma') { defK = '10 SMA'; defProg = 'Reguler SMA'; }
                            if (j === 'english') { defK = 'English Kids'; defProg = 'English Course'; }
                            setTrialForm({ ...trialForm, jenjang: j, kelasSekolah: defK, program: defProg });
                          }}
                          style={{ width: '100%', padding: '9px 10px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 13 }}
                        >
                          <option value="sd">SD</option>
                          <option value="smp">SMP</option>
                          <option value="sma">SMA</option>
                          <option value="english">English Course</option>
                        </select>
                      </div>

                      <div>
                        <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#475569', marginBottom: 4 }}>
                          Kelas (Pilih Baku)
                        </label>
                        <select
                          value={trialForm.kelasSekolah}
                          onChange={e => setTrialForm({ ...trialForm, kelasSekolah: e.target.value })}
                          required
                          style={{ width: '100%', padding: '9px 10px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 13, boxSizing: 'border-box', background: 'white' }}
                        >
                          {(DAFTAR_KELAS_PER_JENJANG[
                            trialForm.jenjang === 'sd' ? 'SD'
                            : trialForm.jenjang === 'smp' ? 'SMP'
                            : trialForm.jenjang === 'sma' ? 'SMA'
                            : 'English'
                          ] || []).map(k => (
                            <option key={k} value={k}>{k}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div style={{ marginBottom: 16 }}>
                      <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#475569', marginBottom: 4 }}>
                        No. WhatsApp Orang Tua (Opsional)
                      </label>
                      <input
                        type="text"
                        placeholder="Contoh: 08123456789"
                        value={trialForm.noHp}
                        onChange={e => setTrialForm({ ...trialForm, noHp: e.target.value })}
                        style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 13, boxSizing: 'border-box' }}
                      />
                    </div>

                    <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                      <button
                        type="button"
                        onClick={() => setShowTrialModal(false)}
                        style={{ padding: '9px 16px', background: '#f1f5f9', color: '#475569', border: 'none', borderRadius: 8, fontWeight: 700, cursor: 'pointer', fontSize: 13 }}
                      >
                        Batal
                      </button>
                      <button
                        type="submit"
                        disabled={creatingTrial}
                        style={{
                          padding: '9px 20px', background: 'linear-gradient(135deg, #4338ca 0%, #6366f1 100%)',
                          color: 'white', border: 'none', borderRadius: 8, fontWeight: 800, cursor: 'pointer', fontSize: 13
                        }}
                      >
                        {creatingTrial ? '⏳ Menerbitkan...' : '🚀 Terbitkan Akun (3 Hari)'}
                      </button>
                    </div>
                  </form>
                </div>
              ) : (
                /* KARTU SUKSES TERBITKAN AKUN */
                <div>
                  <div style={{ textAlign: 'center', marginBottom: 16 }}>
                    <div style={{ fontSize: 36, marginBottom: 4 }}>🎉</div>
                    <h3 style={{ margin: 0, color: '#166534', fontSize: 17 }}>Akun Trial 3 Hari Siap Digunakan!</h3>
                    <p style={{ margin: '4px 0 0', fontSize: 12, color: '#64748b' }}>
                      Berikan username dan password di bawah ini kepada calon siswa / wali murid:
                    </p>
                  </div>

                  <div style={{ background: '#f8fafc', border: '1.5px dashed #cbd5e1', borderRadius: 12, padding: '14px 16px', marginBottom: 16 }}>
                    <div style={{ marginBottom: 8, fontSize: 12.5 }}>
                      <span style={{ color: '#64748b' }}>Nama Siswa:</span> <b>{trialSuccessData.nama}</b> ({trialSuccessData.kelasSekolah})
                    </div>
                    <div style={{ marginBottom: 8, fontSize: 13 }}>
                      <span style={{ color: '#64748b' }}>Username:</span> <b style={{ color: '#4338ca', fontFamily: 'monospace' }}>{trialSuccessData.username}</b>
                    </div>
                    <div style={{ marginBottom: 8, fontSize: 13 }}>
                      <span style={{ color: '#64748b' }}>Password:</span> <b style={{ color: '#dc2626', fontFamily: 'monospace' }}>{trialSuccessData.plainPassword}</b>
                    </div>
                    <div style={{ fontSize: 12, color: '#047857', fontWeight: 700 }}>
                      ⏳ Masa Berlaku: 3 Hari (s.d. {trialSuccessData.expiresPanjang})
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <button
                      type="button"
                      onClick={() => {
                        const teks = `🌟 AKUN TRIAL CLASS BIMBEL GEMILANG (3 HARI) 🌟\n\nHalo Kak ${trialSuccessData.nama}!\nSelamat mencoba serunya belajar di Bimbel Gemilang.\n\nBerikut akses login aplikasi kamu:\n🔗 Link: https://bimbel-gemilang-app.vercel.app/login\n👤 Username: ${trialSuccessData.username}\n🔑 Password: ${trialSuccessData.plainPassword}\n⏳ Berlaku Sampai: ${trialSuccessData.expiresPanjang}\n\nYuk langsung login dan coba fitur Try Out CBT serta materi interaktifnya!`;
                        navigator.clipboard.writeText(teks);
                        showAlert('📋 Teks akses login berhasil disalin!');
                      }}
                      style={{
                        padding: '10px', background: '#f1f5f9', color: '#1e293b',
                        border: '1px solid #cbd5e1', borderRadius: 8, fontWeight: 700, cursor: 'pointer', fontSize: 12.5
                      }}
                    >
                      📋 Salin Info Akses Login
                    </button>

                    {trialSuccessData.noHp && (
                      <a
                        href={`https://api.whatsapp.com/send?phone=${trialSuccessData.noHp.replace(/^0/, '62')}&text=${encodeURIComponent(`🌟 AKUN TRIAL CLASS BIMBEL GEMILANG (3 HARI) 🌟\n\nHalo Kak ${trialSuccessData.nama}!\nSelamat mencoba serunya belajar di Bimbel Gemilang.\n\nBerikut akses login aplikasi kamu:\n🔗 Link: https://bimbel-gemilang-app.vercel.app/login\n👤 Username: ${trialSuccessData.username}\n🔑 Password: ${trialSuccessData.plainPassword}\n⏳ Berlaku Sampai: ${trialSuccessData.expiresPanjang}\n\nYuk langsung login dan coba fitur Try Out CBT serta materi interaktifnya!`)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          textAlign: 'center', padding: '10px', background: '#22c55e', color: 'white',
                          borderRadius: 8, fontWeight: 800, textDecoration: 'none', fontSize: 12.5
                        }}
                      >
                        💬 Kirim Akses via WhatsApp
                      </a>
                    )}

                    <button
                      type="button"
                      onClick={() => setShowTrialModal(false)}
                      style={{
                        padding: '9px', background: '#1e293b', color: 'white',
                        border: 'none', borderRadius: 8, fontWeight: 700, cursor: 'pointer', fontSize: 12.5, marginTop: 4
                      }}
                    >
                      Selesai
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

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
                  <div style={{ ...styles.modalAvatar, overflow: 'hidden' }}>
                    {selectedStudent.fotoUrl ? (
                      <img src={selectedStudent.fotoUrl} alt={selectedStudent.nama} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      getInitials(selectedStudent.nama)
                    )}
                  </div>
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
            <button
              onClick={() => setShowAuditModal(true)}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                padding: '9px 14px', borderRadius: 10,
                background: auditSelisihList.length > 0 ? '#ea580c' : '#059669',
                color: 'white', border: 'none', fontWeight: 800, fontSize: 13,
                cursor: 'pointer', boxShadow: auditSelisihList.length > 0 ? '0 4px 12px rgba(234, 88, 12, 0.3)' : '0 4px 12px rgba(5, 150, 105, 0.2)'
              }}
              title="Audit rekonsiliasi data kasir vs profil siswa"
            >
              {auditSelisihList.length > 0 ? <AlertTriangle size={16} /> : <ShieldCheck size={16} />}
              <span>Audit Keuangan</span>
              {auditSelisihList.length > 0 && (
                <span style={{ background: '#fff', color: '#ea580c', fontSize: 11, padding: '1px 6px', borderRadius: 999, fontWeight: 900 }}>
                  {auditSelisihList.length} Selisih
                </span>
              )}
            </button>
            <button
              onClick={() => setShowAuditJenjangModal(true)}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                padding: '9px 14px', borderRadius: 10,
                background: auditJenjangList.length > 0 ? '#fef3c7' : '#f0fdf4',
                color: auditJenjangList.length > 0 ? '#b45309' : '#15803d',
                border: `1px solid ${auditJenjangList.length > 0 ? '#fcd34d' : '#bbf7d0'}`,
                fontWeight: 800, fontSize: 13, cursor: 'pointer'
              }}
            >
              <span>🧹</span> Rapikan Kelas/Jenjang
              {auditJenjangList.length > 0 && (
                <span style={{ background: '#d97706', color: 'white', borderRadius: 99, padding: '1px 7px', fontSize: 11 }}>
                  {auditJenjangList.length}
                </span>
              )}
            </button>
            <button
              onClick={() => {
                setTrialSuccessData(null);
                setShowTrialModal(true);
              }}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                padding: '9px 14px', borderRadius: 10,
                background: 'linear-gradient(135deg, #4338ca 0%, #6366f1 100%)',
                color: 'white', border: 'none', fontWeight: 800, fontSize: 13,
                cursor: 'pointer', boxShadow: '0 4px 12px rgba(99, 102, 241, 0.3)'
              }}
            >
              <span>🎯</span> Buat Akun Trial Class (3 Hari)
            </button>
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
                    const isAkanHabis = masa.isAkanHabis;
                    const isHabis = masa.isHabis;
                    
                    return (
                      <tr key={s.id} style={{
                        ...styles.tr,
                        background: isAkanHabis && !s.isBlocked ? '#fffbeb' : 'transparent',
                        opacity: s.isBlocked ? 0.5 : 1
                      }}>
                        <td style={styles.td}>{idx + 1}</td>
                        <td style={styles.td}>
                          <div style={styles.studentCell}>
                            <div
                              style={{
                                ...styles.avatar,
                                overflow: 'hidden',
                                cursor: 'pointer',
                                border: s.fotoUrl ? '2px solid #8b5cf6' : '1px solid rgba(0,0,0,0.08)',
                                position: 'relative'
                              }}
                              title="Klik untuk pasang / ubah foto siswa langsung"
                              onClick={() => {
                                setTargetStudentForFoto(s.id);
                                fotoInputRef.current?.click();
                              }}
                            >
                              {s.fotoUrl ? (
                                <img src={s.fotoUrl} alt={s.nama} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                              ) : (
                                getInitials(s.nama)
                              )}
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
                              {Array.isArray(s.extraPrograms) && s.extraPrograms.filter(p => p.status === 'Aktif').map(ep => {
                                const isEng = isProgramEnglish(ep.programType || ep.namaProgram);
                                const kuotaEp = isEng ? hitungKuotaEnglishCourse({
                                  durasiBulan: ep.durasiBulan || 1,
                                  tanggalMulai: ep.tanggalMulai,
                                  attendanceList,
                                  teacherLogs: teacherLogsList,
                                  student: s
                                }) : null;
                                return (
                                  <button
                                    key={ep.id}
                                    type="button"
                                    onClick={() => {
                                      if (kuotaEp) {
                                        setModalRincianData({
                                          ...kuotaEp,
                                          namaSiswa: s.nama,
                                          studentId: s.studentId,
                                          studentDocId: s.id,
                                          namaProgram: ep.namaProgram
                                        });
                                        setShowModalRincianSesi(true);
                                      }
                                    }}
                                    style={{
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: 4,
                                      fontSize: 10,
                                      fontWeight: 700,
                                      color: kuotaEp ? kuotaEp.badgeWarna.color : '#6d28d9',
                                      background: kuotaEp ? kuotaEp.badgeWarna.bg : '#ede9fe',
                                      border: `1px solid ${kuotaEp ? kuotaEp.badgeWarna.border : '#ddd6fe'}`,
                                      padding: '2px 7px',
                                      borderRadius: 6,
                                      marginTop: 3,
                                      marginRight: 4,
                                      cursor: kuotaEp ? 'pointer' : 'default',
                                      boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                                    }}
                                    title="Klik untuk melihat rincian absensi & kuota sesi English Course"
                                  >
                                    🇬🇧 {ep.namaProgram} {kuotaEp ? `(${kuotaEp.sesiTerpakai}/${kuotaEp.totalKuota})` : ''} 👁️
                                  </button>
                                );
                              })}
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
                          {masa.isEnglishCourse ? (
                            <button
                              type="button"
                              onClick={() => {
                                if (masa.kuota) {
                                  setModalRincianData({
                                    ...masa.kuota,
                                    namaSiswa: s.nama,
                                    studentId: s.studentId,
                                    studentDocId: s.id,
                                    namaProgram: s.kategori || 'English Course'
                                  });
                                  setShowModalRincianSesi(true);
                                }
                              }}
                              style={{
                                ...styles.masaBadge,
                                background: masa.bg,
                                color: masa.color,
                                border: masa.kuota ? `1px solid ${masa.kuota.badgeWarna.border}` : 'none',
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 4
                              }}
                              title="Klik untuk melihat rincian absensi & kuota sesi English Course"
                            >
                              {masa.label} 👁️
                            </button>
                          ) : (
                            <span style={{
                              ...styles.masaBadge,
                              background: masa.bg,
                              color: masa.color
                            }}>
                              {masa.label}
                            </span>
                          )}
                          {masa.isEnglishCourse && (
                            <div style={{ fontSize: 9.5, color: '#64748b', marginTop: 2 }}>
                              {masa.kuota.isHabis ? 'Kuota selesai' : `Sisa ${masa.kuota.sisaSesi} sesi`}
                            </div>
                          )}
                        </td>
                        <td style={styles.td}>
                          <span style={{
                            ...styles.tagihanBadge,
                            color: sisaTagihan > 0 ? '#ef4444' : '#10b981'
                          }}>
                            Rp {sisaTagihan.toLocaleString()}
                          </span>
                          {auditSelisihMap[s.id] && (
                            <div 
                              onClick={() => navigate(`/admin/students/finance/${s.id}`)}
                              style={{ 
                                fontSize: 9.5, color: '#9a3412', fontWeight: 800, 
                                background: '#ffedd5', border: '1px solid #fed7aa',
                                padding: '2px 6px', borderRadius: 4, marginTop: 4,
                                display: 'inline-flex', alignItems: 'center', gap: 3,
                                cursor: 'pointer'
                              }}
                              title={`Selisih kasir Rp ${auditSelisihMap[s.id].selisih.toLocaleString()}. Klik untuk buka keuangan siswa.`}
                            >
                              ⚠️ Selisih Kas Rp {auditSelisihMap[s.id].selisih.toLocaleString()}
                            </div>
                          )}
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
                              title="Keuangan & Pembayaran"
                            >
                              <CreditCard size={14} />
                            </button>
                            {/* 🔥 BARU: Tambah Program English Course / Paket Tambahan */}
                            <button
                              onClick={() => navigate(`/admin/students/finance/${s.id}?english=1`)}
                              style={{...styles.btnAction, background: '#ecfdf5', color: '#065f46'}}
                              title="Tambah Paket English Course / Paket Baru"
                            >
                              <PlusCircle size={14} />
                            </button>
                            {/* 🔥 BARU (2026-10-12): revisi kesalahan pembayaran
                                langsung dari daftar siswa -- membuka halaman
                                keuangan DENGAN panel koreksi terbuka. */}
                            <button
                              onClick={() => navigate(`/admin/students/finance/${s.id}?koreksi=1`)}
                              style={{...styles.btnAction, background: '#fee2e2', color: '#991b1b'}}
                              title="Revisi pembayaran (koreksi berjejak audit)"
                            >
                              <Edit3 size={14} />
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

        {/* ===== MODAL RINCIAN SESI ENGLISH COURSE (8x/bulan) ===== */}
        {showModalRincianSesi && modalRincianData && (
          <div
            onClick={() => setShowModalRincianSesi(false)}
            style={{
              position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
              background: 'rgba(15, 23, 42, 0.75)', zIndex: 9999,
              display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20
            }}
          >
            <div
              onClick={e => e.stopPropagation()}
              style={{
                background: 'white', borderRadius: 16, padding: 24, maxWidth: 580, width: '100%',
                maxHeight: '90vh', overflowY: 'auto',
                boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.3)'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, paddingBottom: 10, borderBottom: '1px solid #e2e8f0' }}>
                <h3 style={{ margin: 0, color: '#1e293b', fontSize: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span>🇬🇧</span> Rincian Sesi {modalRincianData.namaProgram || 'English Course'}
                </h3>
                <button
                  onClick={() => setShowModalRincianSesi(false)}
                  style={{ background: '#f1f5f9', border: 'none', borderRadius: '50%', width: 32, height: 32, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}
                >
                  <X size={16} />
                </button>
              </div>

              <div style={{ background: '#f8fafc', padding: 12, borderRadius: 10, border: '1px solid #e2e8f0', marginBottom: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 6 }}>
                  <div>
                    <strong style={{ fontSize: 14, color: '#1e293b' }}>{modalRincianData.namaSiswa}</strong>
                    <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>
                      ID: {modalRincianData.studentId || '-'} • Program: {modalRincianData.namaProgram}
                    </div>
                  </div>
                  <span style={{
                    display: 'inline-block',
                    padding: '3px 10px',
                    borderRadius: 10,
                    fontSize: 11,
                    fontWeight: 700,
                    background: modalRincianData.badgeWarna.bg,
                    color: modalRincianData.badgeWarna.color,
                    border: `1px solid ${modalRincianData.badgeWarna.border}`
                  }}>
                    {modalRincianData.labelStatus}
                  </span>
                </div>

                <div style={{ marginTop: 10, display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#475569' }}>
                  <span>Sesi Pertemuan Terpakai: <strong>{modalRincianData.sesiTerpakai} dari {modalRincianData.totalKuota} Sesi</strong></span>
                  <span>Sisa: <strong style={{ color: modalRincianData.sisaSesi === 0 ? '#b91c1c' : '#047857' }}>{modalRincianData.sisaSesi} Sesi</strong></span>
                </div>
                <div style={{ height: 8, borderRadius: 4, background: '#e2e8f0', overflow: 'hidden', margin: '6px 0 8px' }}>
                  <div style={{ height: '100%', width: `${modalRincianData.persentase}%`, background: modalRincianData.isHabis ? '#ef4444' : '#10b981', transition: 'width 0.3s' }} />
                </div>
                <div style={{ fontSize: 10.5, color: '#475569', background: '#ecfdf5', padding: '6px 10px', borderRadius: 6, border: '1px solid #a7f3d0', lineHeight: 1.5 }}>
                  💡 <em>Sesuai SOP Bimbel Gemilang, masa aktif English Course dihitung 8x pertemuan per bulan. Paket baru habis jika seluruh kuota sesi telah selesai dijalankan (dicocokkan otomatis dari absensi guru &amp; siswa).</em>
                </div>
              </div>

              <h4 style={{ fontSize: 12, color: '#334155', margin: '0 0 8px 0', fontWeight: 700 }}>
                Daftar Sesi yang Telah Diikuti ({modalRincianData.daftarSesi?.length || 0}):
              </h4>

              {(!modalRincianData.daftarSesi || modalRincianData.daftarSesi.length === 0) ? (
                <div style={{ textAlign: 'center', padding: '24px 12px', background: '#f8fafc', borderRadius: 8, color: '#94a3b8', fontSize: 12 }}>
                  Belum ada data absensi kehadiran yang tercatat untuk sesi English Course ini.
                </div>
              ) : (
                <div style={{ maxHeight: 260, overflowY: 'auto', border: '1px solid #e2e8f0', borderRadius: 8, marginBottom: 16 }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11.5 }}>
                    <thead>
                      <tr style={{ background: '#f1f5f9', borderBottom: '1px solid #e2e8f0', textAlign: 'left' }}>
                        <th style={{ padding: '8px 10px', width: 36 }}>#</th>
                        <th style={{ padding: '8px 10px', width: 90 }}>Tanggal</th>
                        <th style={{ padding: '8px 10px' }}>Guru / Materi</th>
                        <th style={{ padding: '8px 10px', width: 75, textAlign: 'center' }}>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {modalRincianData.daftarSesi.map((sesi, idx) => (
                        <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9', background: idx % 2 === 0 ? 'white' : '#fafafa' }}>
                          <td style={{ padding: '8px 10px', fontWeight: 700, color: '#64748b' }}>
                            {idx + 1}
                          </td>
                          <td style={{ padding: '8px 10px', fontWeight: 600, color: '#1e293b', whiteSpace: 'nowrap' }}>
                            📅 {sesi.tanggal}
                          </td>
                          <td style={{ padding: '8px 10px' }}>
                            <div style={{ fontWeight: 600, color: '#334155' }}>{sesi.guru}</div>
                            <div style={{ fontSize: 10, color: '#64748b' }}>{sesi.materi}</div>
                          </td>
                          <td style={{ padding: '8px 10px', textAlign: 'center' }}>
                            <span style={{ background: '#dcfce7', color: '#166534', padding: '2px 8px', borderRadius: 6, fontSize: 10, fontWeight: 700 }}>
                              ✓ Hadir
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                {modalRincianData.studentDocId && (
                  <button
                    type="button"
                    onClick={() => navigate(`/admin/students/finance/${modalRincianData.studentDocId}`)}
                    style={{ background: '#ede9fe', color: '#6d28d9', border: '1px solid #ddd6fe', padding: '8px 14px', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
                  >
                    <CreditCard size={14} /> Keuangan Siswa
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setShowModalRincianSesi(false)}
                  style={{ background: '#3b82f6', color: 'white', border: 'none', padding: '8px 16px', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ===== MODAL AUDIT & PERBAIKAN KELAS/JENJANG SISWA ===== */}
        {showAuditJenjangModal && (
          <div style={styles.modalOverlay} onClick={() => setShowAuditJenjangModal(false)}>
            <div style={{ ...styles.modal, maxWidth: '780px', width: '95%' }} onClick={e => e.stopPropagation()}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '18px 22px', borderBottom: '1px solid #e2e8f0' }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: '#1e293b' }}>
                    🧹 Audit & Rapikan Data Kelas / Jenjang Siswa
                  </h3>
                  <p style={{ margin: '2px 0 0', fontSize: 12, color: '#64748b' }}>
                    Menyelaraskan field jenjang, kelasSekolah, dan kelas agar tidak ada siswa SMP nyasar ke SD atau terblokir fiturnya.
                  </p>
                </div>
                <button
                  onClick={() => setShowAuditJenjangModal(false)}
                  style={{ border: 'none', background: '#f1f5f9', borderRadius: 8, width: 32, height: 32, cursor: 'pointer', fontSize: 16 }}
                >
                  ✕
                </button>
              </div>
              <div style={{ padding: 20, maxHeight: '60vh', overflowY: 'auto' }}>
                {auditJenjangList.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: 30, color: '#15803d', fontWeight: 700 }}>
                    ✅ Semua data kelas & jenjang siswa di Firestore sudah selaras dan bersih!
                  </div>
                ) : (
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.5 }}>
                    <thead>
                      <tr style={{ background: '#f8fafc', textAlign: 'left', borderBottom: '2px solid #e2e8f0' }}>
                        <th style={{ padding: '8px 10px' }}>Nama Siswa</th>
                        <th style={{ padding: '8px 10px' }}>Data Lama</th>
                        <th style={{ padding: '8px 10px' }}>Perbaikan Baku</th>
                      </tr>
                    </thead>
                    <tbody>
                      {auditJenjangList.map((item) => (
                        <tr key={item.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                          <td style={{ padding: '8px 10px', fontWeight: 700, color: '#0f172a' }}>{item.nama}</td>
                          <td style={{ padding: '8px 10px', color: '#dc2626' }}>
                            Jenjang: <b>{item.lamaJenjang}</b> • Kelas: <b>{item.lamaKelasSekolah}</b>
                          </td>
                          <td style={{ padding: '8px 10px', color: '#15803d' }}>
                            Jenjang: <b>{item.baruJenjang}</b> • Kelas: <b>{item.baruKelasSekolah}</b>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
              {auditJenjangList.length > 0 && (
                <div style={{ padding: '14px 20px', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                  <button
                    onClick={() => setShowAuditJenjangModal(false)}
                    style={{ padding: '9px 16px', background: '#f1f5f9', color: '#475569', border: 'none', borderRadius: 8, fontWeight: 700, cursor: 'pointer' }}
                  >
                    Tutup
                  </button>
                  <button
                    onClick={handlePerbaikiSemuaJenjang}
                    disabled={memperbaikiJenjang}
                    style={{ padding: '9px 18px', background: '#0d9488', color: 'white', border: 'none', borderRadius: 8, fontWeight: 800, cursor: 'pointer' }}
                  >
                    {memperbaikiJenjang ? 'Menyimpan...' : `Terapkan Perbaikan (${auditJenjangList.length} Siswa)`}
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ===== MODAL AUDIT SELISIH KEUANGAN SISWA ===== */}
        {showAuditModal && (
          <div style={styles.modalOverlay} onClick={() => setShowAuditModal(false)}>
            <div style={{ ...styles.modal, maxWidth: '780px', width: '95%' }} onClick={e => e.stopPropagation()}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '18px 22px', borderBottom: '1px solid #e2e8f0' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{
                    width: 38, height: 38, borderRadius: 10,
                    background: auditSelisihList.length > 0 ? '#ffedd5' : '#dcfce7',
                    color: auditSelisihList.length > 0 ? '#ea580c' : '#16a34a',
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                  }}>
                    {auditSelisihList.length > 0 ? <AlertTriangle size={20} /> : <ShieldCheck size={20} />}
                  </div>
                  <div>
                    <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: '#1e293b' }}>
                      Audit Keuangan & Detektor Selisih Buku Kas
                    </h3>
                    <p style={{ margin: '2px 0 0', fontSize: 12, color: '#64748b' }}>
                      Pemeriksaan otomatis seluruh siswa: membandingkan profil siswa vs kwitansi riil buku kas/bank.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowAuditModal(false)}
                  style={{ background: '#f1f5f9', border: 'none', borderRadius: '50%', width: 32, height: 32, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}
                >
                  <X size={16} />
                </button>
              </div>

              <div style={{ padding: '18px 22px' }}>
                {/* RINGKASAN METRIK */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, marginBottom: 16 }}>
                  <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 10, padding: 12 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#64748b' }}>👥 TOTAL SISWA DIPERIKSA</div>
                    <div style={{ fontSize: 20, fontWeight: 800, color: '#1e293b', marginTop: 4 }}>
                      {students.length} Siswa
                    </div>
                  </div>
                  <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 10, padding: 12 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#166534' }}>✅ SINKRON 100% (KLOP)</div>
                    <div style={{ fontSize: 20, fontWeight: 800, color: '#15803d', marginTop: 4 }}>
                      {students.length - auditSelisihList.length} Siswa
                    </div>
                  </div>
                  <div style={{
                    background: auditSelisihList.length > 0 ? '#fff7ed' : '#f8fafc',
                    border: `1px solid ${auditSelisihList.length > 0 ? '#fed7aa' : '#e2e8f0'}`,
                    borderRadius: 10, padding: 12
                  }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: auditSelisihList.length > 0 ? '#c2410c' : '#64748b' }}>
                      ⚠️ SISWA BERSTATUS LUNAS SEMU
                    </div>
                    <div style={{ fontSize: 20, fontWeight: 800, color: auditSelisihList.length > 0 ? '#ea580c' : '#1e293b', marginTop: 4 }}>
                      {auditSelisihList.length} Siswa
                    </div>
                  </div>
                </div>

                {auditSelisihList.length === 0 ? (
                  <div style={{
                    background: '#f0fdf4', border: '1.5px solid #86efac', borderRadius: 12,
                    padding: '24px 20px', textAlign: 'center'
                  }}>
                    <div style={{ fontSize: 32, marginBottom: 6 }}>🛡️✨</div>
                    <h4 style={{ margin: '0 0 6px', fontSize: 15, fontWeight: 800, color: '#166534' }}>
                      SEMUA SISWA 100% SINKRON DENGAN BUKU KAS
                    </h4>
                    <p style={{ margin: 0, fontSize: 12.5, color: '#15803d', lineHeight: 1.5 }}>
                      Tidak ditemukan satupun siswa yang berstatus "Lunas Semu". Seluruh angka pembayaran yang tercatat di profil siswa memiliki bukti kwitansi sah di riwayat kasir maupun transfer bank. Keuangan bimbel aman tanpa kebocoran.
                    </p>
                  </div>
                ) : (
                  <div>
                    <div style={{
                      background: '#fff7ed', border: '1px solid #fed7aa', borderRadius: 10,
                      padding: '10px 14px', marginBottom: 12, fontSize: 12, color: '#9a3412', lineHeight: 1.5
                    }}>
                      <b>Perhatian Owner/Admin:</b> Siswa-siswa di bawah ini profilnya tercatat sudah bayar lebih banyak daripada bukti fisik kwitansi kasir. Klik <b>"Buka & Sinkronkan"</b> untuk memulihkan tagihan siswa agar uang tidak hilang.
                    </div>

                    <div style={{ maxHeight: '340px', overflowY: 'auto', border: '1px solid #e2e8f0', borderRadius: 10 }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                        <thead>
                          <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', textAlign: 'left', color: '#475569' }}>
                            <th style={{ padding: '10px 12px' }}>Siswa</th>
                            <th style={{ padding: '10px 12px' }}>Total Tagihan</th>
                            <th style={{ padding: '10px 12px' }}>Di Profil</th>
                            <th style={{ padding: '10px 12px' }}>Kwitansi Riil</th>
                            <th style={{ padding: '10px 12px', color: '#ea580c' }}>Selisih Semu</th>
                            <th style={{ padding: '10px 12px', textAlign: 'center' }}>Aksi</th>
                          </tr>
                        </thead>
                        <tbody>
                          {auditSelisihList.map(item => (
                            <tr key={item.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                              <td style={{ padding: '10px 12px' }}>
                                <div style={{ fontWeight: 800, color: '#1e293b' }}>{item.nama}</div>
                                <div style={{ fontSize: 10.5, color: '#64748b' }}>{item.studentId} • {item.kelas}</div>
                              </td>
                              <td style={{ padding: '10px 12px', color: '#334155' }}>
                                Rp {item.totalTagihan.toLocaleString()}
                              </td>
                              <td style={{ padding: '10px 12px', color: '#059669', fontWeight: 700 }}>
                                Rp {item.totalBayar.toLocaleString()}
                              </td>
                              <td style={{ padding: '10px 12px', color: '#2563eb', fontWeight: 700 }}>
                                Rp {item.uangRiil.toLocaleString()}
                              </td>
                              <td style={{ padding: '10px 12px', color: '#dc2626', fontWeight: 800 }}>
                                - Rp {item.selisih.toLocaleString()}
                              </td>
                              <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                                <button
                                  onClick={() => {
                                    setShowAuditModal(false);
                                    navigate(`/admin/students/finance/${item.id}`);
                                  }}
                                  style={{
                                    background: '#ea580c', color: '#fff', border: 'none',
                                    borderRadius: 6, padding: '6px 10px', fontSize: 11,
                                    fontWeight: 700, cursor: 'pointer'
                                  }}
                                >
                                  Buka & Sinkronkan
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                <div style={{ marginTop: 16, display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                  <button
                    onClick={() => fetchStudents()}
                    style={{
                      background: '#f1f5f9', color: '#334155', border: '1px solid #cbd5e1',
                      borderRadius: 8, padding: '8px 14px', fontSize: 12.5, fontWeight: 700, cursor: 'pointer'
                    }}
                  >
                    🔄 Pindai Ulang
                  </button>
                  <button
                    onClick={() => setShowAuditModal(false)}
                    style={{
                      background: '#3b82f6', color: '#fff', border: 'none',
                      borderRadius: 8, padding: '8px 16px', fontSize: 12.5, fontWeight: 700, cursor: 'pointer'
                    }}
                  >
                    Tutup
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

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

        <input
          type="file"
          ref={fotoInputRef}
          accept="image/*"
          style={{ display: 'none' }}
          onChange={handleQuickFotoChange}
        />

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