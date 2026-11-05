// src/pages/teacher/ClassSession.jsx
// Alur kelas hybrid: Step 1 Absensi (bukti guru + QR siswa) ->
// Step 2 Mengajar + Latihan Live (menanam LiveSessionTeacher, mesin live
// berbasis bab buku digital) -> Step 3 Laporan + honor.
// TIDAK lagi memakai KelasLivePanel (dihapus) supaya mesin live cuma satu.
// Google Form laporan materi DIHAPUS 2 Nov 2026 (keputusan owner): jawaban
// masuk spreadsheet Google, bukan Firestore, jadi tak pernah terbaca raport.
import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db } from '../../firebase';
import {
  collection, addDoc, doc, getDoc, setDoc, serverTimestamp,
  onSnapshot, query, where, updateDoc, deleteDoc, deleteField, getDocs,
} from 'firebase/firestore';
import { QRCodeSVG } from 'qrcode.react';
import { QrCode, ArrowLeft, Camera, CheckCircle, Paperclip, BookOpen, Check, Clock, RotateCcw, Sparkles } from 'lucide-react';
import KameraBelakang from '../../components/KameraBelakang';
import { STATUS_ABSENSI, kebijakanUntukStatus, statusDariDokumenAbsensi, keteranganKebijakan } from '../../utils/kebijakanAbsensi';
import { keteranganAbsensi, kunciDokumenAbsensi } from '../../utils/identitasAbsensi';
import { tanggalLokalStr } from '../../utils/waktuLokal';
import { terapkanIzinAbsensiOtomatis } from '../../services/izinAbsensiOtomatis';
import { uploadElearningFile } from '../../services/uploadService';
import LiveSessionTeacher from './LiveSessionTeacher';
import {
  daftarBabSilabus,
  semesterKalenderAktif,
  deteksiMapelJadwal,
  namaMapelLengkap,
} from '../../utils/silabusKurikulumMerdeka';
import ModalSiapkanLatihanSesi from '../../components/guru/ModalSiapkanLatihanSesi';

const ClassSession = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [schedule, setSchedule] = useState(null);
  const [teacher, setTeacher] = useState(null);
  const [loading, setLoading] = useState(true);
  const [attendanceMap, setAttendanceMap] = useState({});
  const [step, setStep] = useState(1);
  const [step1Tab, setStep1Tab] = useState('kehadiranGuru');
  const [materiAktual, setMateriAktual] = useState('');
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [salaryRules, setSalaryRules] = useState(null);
  const [timeStatus, setTimeStatus] = useState({ isPastEnd: false, remaining: '' });
  const [tipeKelas, setTipeKelas] = useState('reguler');
  const [absensiPreviewUrl, setAbsensiPreviewUrl] = useState('');
  const [absensiUploadedUrl, setAbsensiUploadedUrl] = useState('');
  const [uploadingAbsensi, setUploadingAbsensi] = useState(false);
  const [absensiError, setAbsensiError] = useState('');
  const [kameraAbsensi, setKameraAbsensi] = useState(null); // 'environment' | 'user'
  const [izinPerSiswa, setIzinPerSiswa] = useState({});
  const [siswaTerpilih, setSiswaTerpilih] = useState(null);
  const [materiFileUploadedUrl, setMateriFileUploadedUrl] = useState('');
  const [uploadingMateriFile, setUploadingMateriFile] = useState(false);

  // Integrasi Kurikulum Merdeka & Ketuntasan Sesi Tatap Muka
  const [semesterPilihan, setSemesterPilihan] = useState(() => semesterKalenderAktif());
  const [selectedBabId, setSelectedBabId] = useState('');
  const [selectedSubBab, setSelectedSubBab] = useState('');
  const [statusKetuntasan, setStatusKetuntasan] = useState('berjalan'); // 'berjalan' | 'tuntas'
  const [tingkatPemahaman, setTingkatPemahaman] = useState('cukup'); // 'paham' | 'cukup' | 'butuh_bimbingan'
  const [loadingReset, setLoadingReset] = useState(false);
  const [bukaModalLatihan, setBukaModalLatihan] = useState(false);

  const kelasAngka = useMemo(() => {
    if (!schedule) return '7';
    if (schedule.kelas) {
      const k = String(schedule.kelas).replace(/[^0-9]/g, '');
      if (k) return k;
    }
    if (Array.isArray(schedule.students) && schedule.students.length > 0) {
      for (const s of schedule.students) {
        const k = String(s.kelas || s.kelasSekolah || '').replace(/[^0-9]/g, '');
        if (k) return k;
      }
    }
    const mTitle = String(schedule.title || '').match(/\b([1-9]|1[0-2])\b/);
    if (mTitle) return mTitle[1];
    const mLevel = String(schedule.level || '').match(/\b([1-9]|1[0-2])\b/);
    if (mLevel) return mLevel[1];
    return '9';
  }, [schedule]);

  // Khusus Program English Course (Kurikulum Mandiri Tentor - Pengecualian Kurmer)
  const isEnglishCourse = useMemo(() => {
    if (!schedule) return false;
    const prog = String(schedule.program || '').toLowerCase();
    const title = String(schedule.title || '').toLowerCase();
    return prog.includes('english') || title.includes('english course');
  }, [schedule]);

  const [englishFocus, setEnglishFocus] = useState('🗣️ Speaking & Conversation');
  const [englishTopic, setEnglishTopic] = useState('');
  const [englishVocab, setEnglishVocab] = useState('');

  // Pengecualian Sementara Jenjang SD (Sistem Silabus & Bank Soal difokuskan ke SMP & SMA)
  const isJenjangSD = useMemo(() => {
    if (!schedule) return false;
    const lvl = String(schedule.level || '').toUpperCase();
    if (lvl.includes('SD')) return true;
    const prog = String(schedule.program || '').toUpperCase();
    if (prog.includes('SD')) return true;
    const title = String(schedule.title || '').toUpperCase();
    if (title.includes(' SD')) return true;
    const k = parseInt(kelasAngka, 10);
    return k >= 1 && k <= 6;
  }, [schedule, kelasAngka]);

  const [sdMapelPilihan, setSdMapelPilihan] = useState('Matematika SD');
  const [sdTopikMateri, setSdTopikMateri] = useState('');
  const [sdCatatan, setSdCatatan] = useState('');

  const mapelTerdeteksi = useMemo(() => {
    return deteksiMapelJadwal(schedule, teacher);
  }, [schedule, teacher]);

  const listBabSilabus = useMemo(() => {
    if (!schedule) return [];
    return daftarBabSilabus({
      kelas: kelasAngka,
      mapel: mapelTerdeteksi,
      semester: semesterPilihan,
    });
  }, [schedule, kelasAngka, mapelTerdeteksi, semesterPilihan]);

  const babTerpilihObj = useMemo(() => {
    return listBabSilabus.find((b) => b.id === selectedBabId) || null;
  }, [listBabSilabus, selectedBabId]);

  const handlePilihBab = (e) => {
    const babId = e.target.value;
    setSelectedBabId(babId);
    const b = listBabSilabus.find((item) => item.id === babId);
    if (b) {
      const sub = b.subBab?.[0] || '';
      setSelectedSubBab(sub);
      setMateriAktual(`${b.judul}${sub ? ' — ' + sub : ''}`);
    }
  };

  const handlePilihSubBab = (e) => {
    const sub = e.target.value;
    setSelectedSubBab(sub);
    const b = listBabSilabus.find((item) => item.id === selectedBabId);
    if (b) {
      setMateriAktual(`${b.judul}${sub ? ' — ' + sub : ''}`);
    } else {
      setMateriAktual(sub);
    }
  };

  useEffect(() => {
    const h = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', h);
    return () => window.removeEventListener('resize', h);
  }, []);

  useEffect(() => {
    if (!schedule) return;
    const check = () => {
      const now = new Date();
      const [eh, em] = schedule.end.split(':').map(Number);
      const end = new Date(now); end.setHours(eh, em, 0, 0);
      if (now > end) { setTimeStatus({ isPastEnd: true, remaining: '0' }); return; }
      const dm = Math.floor((end - now) / 60000);
      setTimeStatus({ isPastEnd: false, remaining: (dm >= 60 ? Math.floor(dm / 60) + ' jam ' + (dm % 60) + ' menit' : dm + ' menit') });
    };
    check();
    const iv = setInterval(check, 10000);
    return () => clearInterval(iv);
  }, [schedule]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const ds = await getDoc(doc(db, 'jadwal_bimbel', id));
        if (!ds.exists()) { alert('⚠️ Jadwal tidak ditemukan!'); navigate('/guru/dashboard'); return; }
        const data = { id: ds.id, ...ds.data() };
        setSchedule(data);
        setMateriAktual(data.title || '');
        const stored = localStorage.getItem('teacherData');
        if (!stored) { alert('⚠️ Data guru tidak ditemukan!'); navigate('/guru/dashboard'); return; }
        setTeacher(JSON.parse(stored));
        const sr = await getDoc(doc(db, 'settings', 'global_config'));
        if (sr.exists() && sr.data().salaryRules) {
          const rules = sr.data().salaryRules;
          setSalaryRules(Array.isArray(rules.rates) ? { rates: rules.rates } : { rates: [
            { id: 'sd', label: 'SD', pricePerHour: rules.honorSD ?? 35000 },
            { id: 'smp', label: 'SMP', pricePerHour: rules.honorSMP ?? 40000 },
            { id: 'sma', label: 'SMA', pricePerHour: rules.honorSMA ?? 50000 },
          ] });
        } else {
          setSalaryRules({ rates: [
            { id: 'sd', label: 'SD', pricePerHour: 35000 },
            { id: 'smp', label: 'SMP', pricePerHour: 40000 },
            { id: 'sma', label: 'SMA', pricePerHour: 50000 },
          ] });
        }
        // settings/google_forms tidak dibaca lagi (fitur dihapus). Bonus:
        // satu read Firestore hilang tiap kali guru membuka halaman kelas --
        // relevan karena kuota read free-tier sempat jebol (v1.5.9).
        setLoading(false);
      } catch { alert('❌ Gagal memuat data kelas'); navigate('/guru/dashboard'); }
    };
    if (id) fetchData();
  }, [id, navigate]);

  useEffect(() => {
    if (!schedule?.id) return;
    const today = tanggalLokalStr(); // tanggal LOKAL, bukan UTC (A5/v1.6.4)
    const q = query(collection(db, 'attendance'), where('date', '==', today), where('scheduleId', '==', schedule.id));
    const un = onSnapshot(q, (snap) => {
      // Bentuk FUNGSIONAL (prev => ...), bukan menutup nilai `attendanceMap`
      // dari render saat efek berlangganan. Closure lama itu BASI: snapshot
      // yang datang sesudah tentor menandai absen manual membangun ulang peta
      // dari salinan lama, sehingga tanda manual sempat lenyap dari layar.
      // Padahal `attendanceMap` inilah yang memutuskan Alpha vs Hadir dan
      // menghitung `siswaHadir` untuk honor guru -- jadi ini urusan uang,
      // bukan sekadar kedipan UI. Sekaligus menuntaskan warning exhaustive-deps.
      setAttendanceMap((prev) => {
        const m = { ...prev };
        snap.docs.forEach((d) => {
          const data = d.data();
          if (schedule.students && schedule.students.some((s) => s.id === data.studentId)) m[data.studentId] = statusDariDokumenAbsensi(data);
        });
        return m;
      });
    });
    return () => un();
  }, [schedule]);

  const unggahBuktiAbsensi = async (file) => {
    setAbsensiError(''); setUploadingAbsensi(true);
    setAbsensiPreviewUrl(URL.createObjectURL(file));
    try {
      const r = await uploadElearningFile(file, 'absensi-guru');
      if (r.success) setAbsensiUploadedUrl(r.downloadURL);
      else { setAbsensiError('Gagal upload: ' + (r.error || 'Kesalahan.')); setAbsensiUploadedUrl(''); }
    } catch (err) { setAbsensiError('Gagal upload: ' + err.message); setAbsensiUploadedUrl(''); }
    setUploadingAbsensi(false);
  };

  const handleMateriFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingMateriFile(true);
    try {
      const r = await uploadElearningFile(file, 'lampiran-materi-harian');
      if (r.success) setMateriFileUploadedUrl(r.downloadURL);
      else alert('Gagal upload lampiran: ' + (r.error || 'Kesalahan.'));
    } catch (err) { alert('Gagal upload lampiran: ' + err.message); }
    setUploadingMateriFile(false);
  };

  // 🔥 2026-10-26 (revisi UX owner, lanjutan): mengetuk nama TIDAK lagi
  // bersiklus buta. Ketukan membuka lembar pilihan status yang langsung
  // memperlihatkan KETERANGAN tiap pilihan; pemilihan di lembar itu yang
  // menulis status + memicu konsekuensi otomatis.
  const pilihStatusAbsensi = async (student, next) => {
    if (!schedule || !teacher) return;
    const cur = attendanceMap[student.id];
    setAttendanceMap((p) => ({ ...p, [student.id]: next }));
    const today = tanggalLokalStr(); // tanggal LOKAL, bukan UTC (A5/v1.6.4)
    try {
      await setDoc(doc(db, 'attendance', kunciDokumenAbsensi(student.id, today, schedule.id)), {
        studentId: student.id,
        studentDocId: student.id,
        nim: student.studentId || student.id,
        studentKodeUnik: student.studentId || '',
        studentName: student.nama,
        namaSiswa: student.nama,
        program: student.program || schedule.program || 'Reguler',
        kelasSekolah: student.kelas || student.kelasSekolah || '-',
        teacherId: teacher.id, teacherName: teacher.nama,
        date: today, tanggal: today, timestamp: serverTimestamp(),
        status: next,
        keterangan: keteranganAbsensi('', next),
        mapel: schedule.title || 'Umum', scheduleId: schedule.id || '', planet: schedule.planet || 'Ruang Umum',
      }, { merge: true });
      if (kebijakanUntukStatus(next).beriIzinUlang) {
        const dibukakan = await terapkanIzinAbsensiOtomatis({
          siswa: { ...student, studentId: student.studentId || student.id },
          status: next,
          tanggalStr: today,
          keterangan: keteranganAbsensi('', next),
          diberikanOleh: `tentor: ${teacher.nama || teacher.id}`,
        });
        if (dibukakan.length) setIzinPerSiswa((prev) => ({ ...prev, [student.id]: `🔓 Akses susulan otomatis dibukakan untuk ${dibukakan.length} try out tertutup: ${dibukakan.join(', ')} — berlaku 7 hari.` }));
      }
    } catch { setAttendanceMap((p) => ({ ...p, [student.id]: cur })); }
  };

  const hitungHonor = () => {
    if (!salaryRules) return { nominal: 0, detailTxt: ' ', statusGaji: 'Menunggu Validasi' };
    const hadir = (schedule.students || []).filter((s) => attendanceMap[s.id] === 'Hadir');
    const [sh, sm] = schedule.start.split(':');
    const [eh, em] = schedule.end.split(':');
    const diff = (new Date(0, 0, 0, eh, em) - new Date(0, 0, 0, sh, sm)) / 36e5;
    const level = schedule.level || 'SD';
    const rates = salaryRules.rates || [];
    const kelasUnik = [...new Set(hadir.map((s) => s.kelas || s.kelasSekolah).filter(Boolean))];
    let match = null;
    for (const kv of kelasUnik) {
      const label = `kelas ${kv} ${level}`.toLowerCase().trim();
      const f = rates.find((r) => (r.label || '').toLowerCase().trim() === label);
      if (f) { match = f; break; }
    }
    if (!match) match = rates.find((r) => (r.id || '').toLowerCase() === level.toLowerCase() || (r.label || '').toLowerCase() === level.toLowerCase());
    const rate = match ? (match.pricePerHour || 0) : (rates[0]?.pricePerHour || 35000);
    return { nominal: Math.round(rate * diff), detailTxt: (schedule.program || 'Reguler') + ' - ' + (match?.label || level) + ' - ' + materiAktual, statusGaji: 'Menunggu Validasi' };
  };

  const jumlahSiswaRoster = (schedule?.students || []).length;
  const jumlahTerabsen = (schedule?.students || []).filter((s2) => STATUS_ABSENSI.includes(attendanceMap[s2.id])).length;
  const semuaTerabsen = jumlahSiswaRoster === 0 || jumlahTerabsen === jumlahSiswaRoster;

  const handleFinalizeClass = async () => {
    const materiSimpan = isEnglishCourse
      ? (materiAktual || `[English Course] ${englishFocus}: ${englishTopic || 'Session Practice'}${englishVocab ? ' (Vocab: ' + englishVocab + ')' : ''}`)
      : isJenjangSD
      ? (materiAktual || `[Kelas SD] ${sdMapelPilihan}: ${sdTopikMateri || 'Materi Harian'}${sdCatatan ? ' (' + sdCatatan + ')' : ''}`)
      : materiAktual;

    if (!materiSimpan) return alert('Mohon isi materi yang diajarkan!');
    if (!absensiUploadedUrl) { alert('⚠️ Bukti kehadiran wajib diunggah dulu.'); setStep(1); return; }
    const now = new Date();
    const [eh, em] = schedule.end.split(':').map(Number);
    const end = new Date(now); end.setHours(eh, em, 0, 0);
    const isPast = now > end;
    if (!isPast) {
      const dm = Math.floor((end - now) / 60000);
      const rem = dm >= 60 ? Math.floor(dm / 60) + ' jam ' + (dm % 60) + ' menit' : dm + ' menit';
      if (!window.confirm('⏰ Kelas belum mencapai jam selesai (' + schedule.end + ')!\n⏳ Sisa: ' + rem + '\nYakin akhiri lebih awal?')) return;
    }
    if (!window.confirm('Yakin akhiri kelas? Siswa berstatus Belum akan dicatat Alpha.')) return;
    setLoading(true);
    try {
      const today = tanggalLokalStr(); // tanggal LOKAL, bukan UTC (A5/v1.6.4)
      await Promise.all((schedule.students || []).map(async (s) => {
        const present = (attendanceMap[s.id] || 'Alpha') === 'Hadir';
        return setDoc(doc(db, 'attendance', kunciDokumenAbsensi(s.id, today, schedule.id)), {
          studentId: s.id,
          studentDocId: s.id,
          nim: s.studentId || s.id,
          studentKodeUnik: s.studentId || '',
          studentName: s.nama,
          namaSiswa: s.nama,
          program: s.program || schedule.program || 'Reguler',
          kelasSekolah: s.kelas || s.kelasSekolah || '-',
          teacherId: teacher.id, teacherName: teacher.nama,
          date: today, tanggal: today, timestamp: serverTimestamp(),
          status: STATUS_ABSENSI.includes(attendanceMap[s.id]) ? attendanceMap[s.id] : 'Alpha',
          keterangan: (STATUS_ABSENSI.includes(attendanceMap[s.id]) && attendanceMap[s.id] !== 'Hadir') ? keteranganAbsensi('', attendanceMap[s.id]) : (present ? 'Sesi Selesai' : 'Siswa tidak hadir (Otomatis Alpha)'),
          mapel: schedule.title || 'Umum', scheduleId: schedule.id || '', planet: schedule.planet || 'Ruang Umum',
          materiHariIni: materiSimpan,
          babId: (isEnglishCourse || isJenjangSD) ? null : (selectedBabId || null),
          babJudul: (isEnglishCourse || isJenjangSD) ? null : (babTerpilihObj?.judul || null),
          subBab: (isEnglishCourse || isJenjangSD) ? null : (selectedSubBab || null),
          isEnglishCourse: !!isEnglishCourse,
          isJenjangSD: !!isJenjangSD,
          sdMapel: isJenjangSD ? sdMapelPilihan : null,
          sdTopik: isJenjangSD ? sdTopikMateri : null,
          sdCatatan: isJenjangSD ? sdCatatan : null,
          englishFocus: isEnglishCourse ? englishFocus : null,
          englishTopic: isEnglishCourse ? englishTopic : null,
          englishVocab: isEnglishCourse ? englishVocab : null,
          statusKetuntasanMateri: statusKetuntasan,
          tingkatPemahaman: tingkatPemahaman,
        }, { merge: true });
      }));
      const honor = hitungHonor();
      const hadirList = (schedule.students || []).filter((s) => attendanceMap[s.id] === 'Hadir');
      const [sh, sm] = schedule.start.split(':');
      const diff = (new Date(0, 0, 0, eh, em) - new Date(0, 0, 0, sh, sm)) / 36e5;
      const kelasNama = [...new Set(hadirList.map((s) => s.kelas || s.kelasSekolah).filter(Boolean))].join(', ') || (schedule.title || 'Umum');
      await addDoc(collection(db, 'teacher_logs'), {
        teacherId: teacher.id, namaGuru: teacher.nama, tanggal: today, waktu: new Date().toLocaleTimeString(),
        jadwalId: schedule.id, program: schedule.program, level: schedule.level || 'SD',
        kegiatan: 'Mengajar', detail: honor.detailTxt, siswaHadir: hadirList.length, durasiJam: diff,
        siswaTotal: (schedule.students || []).length,
        nominal: honor.nominal, status: honor.statusGaji, createdAt: serverTimestamp(),
        tipeKelas, kelasNama,
        daftarSiswaHadir: hadirList.map((s) => ({ id: s.id, nama: s.nama, kelas: s.kelas || s.kelasSekolah || '-' })),
        fotoAbsensiUrl: absensiUploadedUrl, materiFileUrl: materiFileUploadedUrl || null,
        materiHariIni: materiSimpan,
        babId: (isEnglishCourse || isJenjangSD) ? null : (selectedBabId || null),
        babJudul: (isEnglishCourse || isJenjangSD) ? null : (babTerpilihObj?.judul || null),
        subBab: (isEnglishCourse || isJenjangSD) ? null : (selectedSubBab || null),
        isEnglishCourse: !!isEnglishCourse,
        isJenjangSD: !!isJenjangSD,
        sdMapel: isJenjangSD ? sdMapelPilihan : null,
        sdTopik: isJenjangSD ? sdTopikMateri : null,
        sdCatatan: isJenjangSD ? sdCatatan : null,
        englishFocus: isEnglishCourse ? englishFocus : null,
        englishTopic: isEnglishCourse ? englishTopic : null,
        englishVocab: isEnglishCourse ? englishVocab : null,
        statusKetuntasanMateri: statusKetuntasan,
        tingkatPemahaman: tingkatPemahaman,
      });
      await updateDoc(doc(db, 'jadwal_bimbel', schedule.id), {
        status: 'completed',
        completedAt: serverTimestamp(),
        completedEarly: !isPast,
        materiTerakhir: materiSimpan,
        babId: (isEnglishCourse || isJenjangSD) ? null : (selectedBabId || null),
        babJudul: (isEnglishCourse || isJenjangSD) ? null : (babTerpilihObj?.judul || null),
        subBab: (isEnglishCourse || isJenjangSD) ? null : (selectedSubBab || null),
        isEnglishCourse: !!isEnglishCourse,
        isJenjangSD: !!isJenjangSD,
        sdMapel: isJenjangSD ? sdMapelPilihan : null,
        sdTopik: isJenjangSD ? sdTopikMateri : null,
        sdCatatan: isJenjangSD ? sdCatatan : null,
        englishFocus: isEnglishCourse ? englishFocus : null,
        englishTopic: isEnglishCourse ? englishTopic : null,
        englishVocab: isEnglishCourse ? englishVocab : null,
        statusKetuntasanMateri: statusKetuntasan,
        tingkatPemahaman: tingkatPemahaman,
      });
      alert('✅ Kelas Berhasil Disimpan!\n\n📚 Materi: ' + materiSimpan + '\n👥 Kehadiran: ' + hadirList.length + '/' + (schedule.students || []).length);
      navigate('/guru/dashboard');
    } catch (e) { alert('Gagal menyimpan sesi: ' + e.message); }
    finally { setLoading(false); }
  };

  const handleResetSesi = async () => {
    if (!schedule || !teacher) return;
    const ok = window.confirm(
      `Kembalikan sesi kelas "${schedule.title || 'Sesi Kelas'}" ke status Belum Dimulai?\n\n` +
      `• Status jadwal akan kembali ke "scheduled" (Belum Dimulai)\n` +
      `• Data absensi uji coba hari ini untuk sesi ini akan dibersihkan\n` +
      `• Log honor mengajar hari ini untuk sesi ini akan dibatalkan\n\n` +
      `Lanjutkan reset?`
    );
    if (!ok) return;

    setLoadingReset(true);
    try {
      const today = tanggalLokalStr();

      // 1. Reset dokumen jadwal_bimbel
      await updateDoc(doc(db, 'jadwal_bimbel', schedule.id), {
        status: 'scheduled',
        completedAt: deleteField(),
        completedEarly: false,
        materiTerakhir: deleteField(),
        babId: deleteField(),
        babJudul: deleteField(),
        subBab: deleteField(),
        isEnglishCourse: deleteField(),
        englishFocus: deleteField(),
        englishTopic: deleteField(),
        englishVocab: deleteField(),
        statusKetuntasanMateri: deleteField(),
        tingkatPemahaman: deleteField(),
      });

      // 2. Bersihkan absensi hari ini untuk jadwal ini
      if (Array.isArray(schedule.students)) {
        await Promise.all(schedule.students.map(async (s) => {
          try {
            await deleteDoc(doc(db, 'attendance', kunciDokumenAbsensi(s.id, today, schedule.id)));
          } catch (err) {
            void err;
          }
          if (s.studentId && s.studentId !== s.id) {
            try {
              await deleteDoc(doc(db, 'attendance', kunciDokumenAbsensi(s.studentId, today, schedule.id)));
            } catch (err) {
              void err;
            }
          }
        }));
      }

      try {
        const qAtt = query(
          collection(db, 'attendance'),
          where('scheduleId', '==', schedule.id),
          where('date', '==', today)
        );
        const snapAtt = await getDocs(qAtt);
        await Promise.all(snapAtt.docs.map(d => deleteDoc(d.ref)));
      } catch (err) {
        void err;
      }

      // 3. Bersihkan teacher_logs
      try {
        const qLog = query(
          collection(db, 'teacher_logs'),
          where('jadwalId', '==', schedule.id),
          where('tanggal', '==', today)
        );
        const snapLog = await getDocs(qLog);
        await Promise.all(snapLog.docs.map(d => deleteDoc(d.ref)));
      } catch (err) {
        void err;
      }

      alert('✅ Status kelas berhasil dikembalikan ke semula (Belum Dimulai)!\nData uji coba absensi dan log mengajar telah dibersihkan.');
      navigate('/guru/dashboard');
    } catch (err) {
      alert('Gagal mereset kelas: ' + err.message);
    } finally {
      setLoadingReset(false);
    }
  };

  if (loading) return <div style={st.container(isMobile)}><div style={{ textAlign: 'center', padding: 40, color: '#94a3b8' }}><div style={st.spinner} /><p>Memuat kelas...</p></div></div>;
  if (!schedule || !teacher) return <div style={st.container(isMobile)}><div style={{ textAlign: 'center', padding: 40, color: '#ef4444' }}><p>⚠️ Data kelas tidak ditemukan</p><button onClick={() => navigate('/guru/dashboard')} style={st.btnBack(isMobile)}>Kembali ke Dashboard</button></div></div>;

  return (
    <div style={st.container(isMobile)}>
      {siswaTerpilih && (
        <div role="dialog" aria-modal="true" aria-label={`Absensi ${siswaTerpilih.nama}`} style={{ position: 'fixed', inset: 0, zIndex: 3900, background: 'rgba(2,6,23,.72)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }} onClick={() => setSiswaTerpilih(null)}>
          <div style={{ background: '#fff', borderRadius: 14, padding: '16px 16px 12px', width: '100%', maxWidth: 460, maxHeight: '86vh', overflowY: 'auto' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ fontSize: 14, fontWeight: 800, color: '#0f172a' }}>
              Absensi: {siswaTerpilih.nama}
            </div>
            <div style={{ fontSize: 11, color: '#64748b', marginTop: 2, marginBottom: 10 }}>
              Status sekarang: <b>{String(attendanceMap[siswaTerpilih.id] || 'BELUM').toUpperCase()}</b> — pilih status; keterangannya muncul di bawah tiap pilihan.
            </div>
            {STATUS_ABSENSI.map((stt) => {
              const aktif = attendanceMap[siswaTerpilih.id] === stt;
              const warnaOpt = stt === 'Hadir' ? '#16a34a' : stt === 'Izin' ? '#2563eb' : stt === 'Sakit' ? '#d97706' : '#dc2626';
              return (
                <button
                  key={stt}
                  type="button"
                  onClick={() => { pilihStatusAbsensi(siswaTerpilih, stt); setSiswaTerpilih(null); }}
                  style={{ display: 'block', width: '100%', textAlign: 'left', marginBottom: 8, padding: '10px 12px', borderRadius: 10, cursor: 'pointer', background: aktif ? '#f0fdf4' : '#f8fafc', border: aktif ? `2px solid ${warnaOpt}` : '1px solid #e2e8f0' }}
                >
                  <div style={{ fontSize: 13, fontWeight: 800, color: warnaOpt }}>{stt.toUpperCase()}{aktif ? ' · terpilih' : ''}</div>
                  <div style={{ fontSize: 11, color: '#475569', marginTop: 3, lineHeight: 1.55 }}>{keteranganKebijakan(stt)}</div>
                </button>
              );
            })}
            {izinPerSiswa[siswaTerpilih.id] && (
              <div style={{ fontSize: 11.5, color: '#166534', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 8, padding: '8px 10px', marginBottom: 8 }}>{izinPerSiswa[siswaTerpilih.id]}</div>
            )}
            <button type="button" onClick={() => setSiswaTerpilih(null)} style={{ width: '100%', padding: '9px 12px', borderRadius: 10, border: '1px solid #e2e8f0', background: '#fff', color: '#64748b', fontWeight: 700, fontSize: 12, cursor: 'pointer' }}>Tutup tanpa mengubah</button>
          </div>
        </div>
      )}
      {kameraAbsensi && (
        <KameraBelakang
          facing={kameraAbsensi}
          judul="Foto bukti kehadiran guru (real-time)"
          onClose={() => setKameraAbsensi(null)}
          onHasil={(file) => { setKameraAbsensi(null); unggahBuktiAbsensi(file); }}
        />
      )}
      <button onClick={() => { if (window.confirm('Yakin kembali? Data belum disimpan hilang.')) navigate('/guru/dashboard'); }} style={st.btnBack(isMobile)}>
        <ArrowLeft size={16} /> Kembali
      </button>
      <div style={st.headerCard(isMobile)}>
        <div style={st.headerFlex}>
          <div>
            <h2 style={st.headerTitle(isMobile)}>{schedule.title || 'Umum'}</h2>
            <p style={st.headerTime(isMobile)}>⏰ {schedule.start} - {schedule.end}
              {!timeStatus.isPastEnd && timeStatus.remaining && <span style={{ color: '#f59e0b', marginLeft: 8 }}>⏳ {timeStatus.remaining} lagi</span>}
              {timeStatus.isPastEnd && <span style={{ color: '#10b981', marginLeft: 8 }}>✅ Waktu selesai telah lewat</span>}
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <span style={st.badge(isMobile)}>{schedule.planet || 'Ruang Umum'}</span>
            <button
              type="button"
              onClick={() => setBukaModalLatihan(true)}
              title="Siapkan butir soal latihan pemahaman untuk sesi ini"
              style={{
                background: schedule.latihanSesi?.status === 'aktif' ? '#f0fdf4' : '#ffffff',
                border: schedule.latihanSesi?.status === 'aktif' ? '1px solid #86efac' : '1px solid #cbd5e1',
                borderRadius: 8,
                padding: '5px 10px',
                fontSize: 11,
                fontWeight: 700,
                color: schedule.latihanSesi?.status === 'aktif' ? '#15803d' : '#475569',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
              }}
            >
              {schedule.latihanSesi?.status === 'aktif'
                ? `✓ Latihan Aktif (${schedule.latihanSesi.totalSoal || schedule.latihanSesi.soalList?.length || 5})`
                : '🎯 Siapkan Latihan'}
            </button>
            <button
              type="button"
              onClick={handleResetSesi}
              disabled={loadingReset}
              title="Kembalikan sesi kelas ini ke status Belum Dimulai (bersihkan absensi & log uji coba)"
              style={{
                background: '#ffffff',
                border: '1px solid #cbd5e1',
                borderRadius: 8,
                padding: '5px 10px',
                fontSize: 11,
                fontWeight: 700,
                color: '#64748b',
                cursor: loadingReset ? 'wait' : 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
              }}
            >
              <RotateCcw size={12} color="#64748b" /> {loadingReset ? 'Mereset...' : 'Reset Sesi'}
            </button>
          </div>
        </div>
      </div>

      {schedule.status === 'completed' && (
        <div style={{
          background: '#fffbeb',
          border: '1px solid #fde68a',
          borderRadius: 14,
          padding: '12px 16px',
          marginBottom: 16,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 10,
        }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 800, color: '#92400e', display: 'flex', alignItems: 'center', gap: 6 }}>
              <Clock size={15} color="#b45309" /> Sesi Kelas Ini Berstatus Selesai (Pernah Diakhiri)
            </div>
            <div style={{ fontSize: 11, color: '#b45309', marginTop: 2 }}>
              Jika Anda sedang menguji coba sistem atau ingin memulai kelas dari awal, klik tombol di samping untuk mengembalikannya ke semula.
            </div>
          </div>
          <button
            type="button"
            onClick={handleResetSesi}
            disabled={loadingReset}
            style={{
              background: '#d97706',
              color: '#ffffff',
              border: 'none',
              borderRadius: 8,
              padding: '7px 12px',
              fontSize: 11.5,
              fontWeight: 700,
              cursor: loadingReset ? 'wait' : 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 5,
            }}
          >
            <RotateCcw size={13} /> {loadingReset ? 'Mereset Sesi...' : 'Kembalikan ke Belum Dimulai'}
          </button>
        </div>
      )}

      {step === 1 && (
        <div>
          <div style={st.step1TabRow(isMobile)}>
            <button type="button" onClick={() => setStep1Tab('kehadiranGuru')} style={st.step1TabBtn(step1Tab === 'kehadiranGuru')}>
              🔒 Bukti Kehadiran Guru {!absensiUploadedUrl && <span style={st.tabDot} />}
            </button>
            <button type="button" onClick={() => setStep1Tab('absensiSiswa')} style={st.step1TabBtn(step1Tab === 'absensiSiswa')}>
              📋 Absensi Siswa
            </button>
          </div>
          {step1Tab === 'absensiSiswa' && <p style={st.tabSafeNote(isMobile)}>💡 Tab ini aman ditunjukkan ke layar kelas.</p>}
          {step1Tab === 'kehadiranGuru' && (
            <div style={st.card(isMobile)}>
              <h4 style={st.cardTitle}><Camera size={18} /> Bukti Kehadiran Mengajar</h4>
              <div style={st.tipeKelasRow(isMobile)}>
                <button type="button" onClick={() => { setTipeKelas('reguler'); setAbsensiUploadedUrl(''); setAbsensiPreviewUrl(''); }} style={st.tipeKelasBtn(tipeKelas === 'reguler')}>🏫 Reguler (Tatap Muka)</button>
                <button type="button" onClick={() => { setTipeKelas('online'); setAbsensiUploadedUrl(''); setAbsensiPreviewUrl(''); }} style={st.tipeKelasBtn(tipeKelas === 'online')}>💻 Online</button>
              </div>
              <p style={st.absensiHint(isMobile)}>{tipeKelas === 'online' ? 'Kelas online wajib screenshot sesi video call.' : 'Ambil foto sebagai bukti Anda hadir di lokasi.'}</p>
              {!absensiUploadedUrl ? (
                <div style={st.uploadOptionsRow(isMobile)}>
                      <button type="button" onClick={() => setKameraAbsensi('environment')} disabled={uploadingAbsensi} style={st.uploadBox(isMobile, uploadingAbsensi)}><Camera size={18} /> {uploadingAbsensi ? 'Mengunggah...' : 'Kamera Belakang (real-time)'}</button>
                      <button type="button" onClick={() => setKameraAbsensi('user')} disabled={uploadingAbsensi} style={st.uploadBox(isMobile, uploadingAbsensi)}><Camera size={18} /> {uploadingAbsensi ? 'Mengunggah...' : 'Kamera Depan (real-time)'}</button>
                </div>
              ) : (
                <div style={st.absensiSuccessBox(isMobile)}>
                  {absensiPreviewUrl && <img src={absensiPreviewUrl} alt="Bukti" style={st.absensiThumb} />}
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#10b981', fontWeight: 'bold', fontSize: 13 }}><CheckCircle size={16} /> Bukti kehadiran tersimpan</div>
                    <button type="button" onClick={() => { setAbsensiUploadedUrl(''); setAbsensiPreviewUrl(''); }} style={st.btnGantiFoto}>Ganti foto</button>
                  </div>
                </div>
              )}
              {absensiError && <p style={st.absensiErrorText}>{absensiError}</p>}
            </div>
          )}
          {step1Tab === 'absensiSiswa' && (
            <div style={st.gridContainer(isMobile)}>
              <div style={st.card(isMobile)}>
                <h4 style={st.cardTitle}><QrCode size={18} /> Scan Absensi</h4>
                <div style={st.qrWrapper}>
                  <QRCodeSVG value={JSON.stringify({ type: 'ABSENSI_BIMBEL', scheduleId: schedule.id, mapel: schedule.title || 'Umum', teacher: teacher.nama, date: tanggalLokalStr(), level: schedule.level || 'SD' })} size={isMobile ? 140 : 180} style={{ width: '100%', height: 'auto', maxWidth: isMobile ? 140 : 180 }} />
                </div>
                <p style={st.qrHint(isMobile)}>Siswa silakan scan</p>
              </div>
              <div style={st.card(isMobile)}>
                <h4 style={{ ...st.cardTitle, color: '#3498db' }}>Siswa ({(schedule.students || []).filter((x) => STATUS_ABSENSI.includes(attendanceMap[x.id])).length}/{(schedule.students || []).length})</h4>
                <div style={st.studentScrollArea}>
                  {(schedule.students || []).map((s) => {
                    const p = attendanceMap[s.id];
                    const warna = p === 'Hadir' ? '#27ae60' : p === 'Izin' ? '#3b82f6' : p === 'Sakit' ? '#f59e0b' : p === 'Alpha' ? '#ef4444' : '#f8fafc';
                    return (
                      <div key={s.id} onClick={() => setSiswaTerpilih(s)} style={{ ...st.studentItem(isMobile), background: warna, color: p ? 'white' : '#64748b', border: p ? 'none' : '1px solid #e2e8f0' }}>
                        <div style={st.studentName(isMobile)}>{s.nama}</div>
                        <div style={st.studentStatus}>{p ? String(p).toUpperCase() : 'KETUK'}</div>
                        {izinPerSiswa[s.id] ? <div style={{ fontSize: 12, marginTop: 2 }} title={izinPerSiswa[s.id]}>🔓</div> : null}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
          <button onClick={() => setStep(2)} disabled={!absensiUploadedUrl || !semuaTerabsen} style={{ ...st.btnMain(isMobile), ...(absensiUploadedUrl && semuaTerabsen ? {} : st.btnDisabled), marginTop: 12 }}>

            {!absensiUploadedUrl ? '🔒 Foto bukti kehadiran (real-time) dulu' : !semuaTerabsen ? `🔒 Absen semua siswa dulu (${jumlahTerabsen}/${jumlahSiswaRoster})` : 'Selesai & Masuk Kelas Live ⮕'}
          </button>
        </div>
      )}

      {step === 2 && (
        <div>
          <div style={st.card(isMobile)}>
            <h4 style={st.step2Title(isMobile)}>📡 Mengajar & Latihan Interaktif (dari Bab Buku Digital)</h4>
            <p style={{ fontSize: 12, color: '#64748b', margin: '0 0 10px' }}>
              Pilih bab → terangkan materi di proyektor → mulai latihan → siswa menjawab di perangkat masing-masing → bahas bertahap.
            </p>
            <LiveSessionTeacher />
          </div>
          <button onClick={() => setStep(3)} style={{ ...st.btnMain(isMobile), marginTop: 4 }}>📝 Lanjut ke Laporan ⮕</button>
        </div>
      )}

      {step === 3 && (
        <div style={st.card(isMobile)}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 14 }}>
            <div>
              <h4 style={{ ...st.step2Title(isMobile), margin: 0, display: 'flex', alignItems: 'center', gap: 6 }}>
                <BookOpen size={18} color={isEnglishCourse ? '#7c3aed' : (isJenjangSD ? '#16a34a' : '#e67e22')} /> 📝 Laporan Materi Pembelajaran
              </h4>
              <p style={{ fontSize: 11.5, color: '#64748b', margin: '4px 0 0' }}>
                {isEnglishCourse
                  ? '🗣️ Program Khusus: English Course (Kurikulum Mandiri Tentor)'
                  : isJenjangSD
                  ? '🌱 Kelas SD (Pengecualian Kurmer • Materi Mandiri Tentor • Fokus Sistem: SMP & SMA)'
                  : `Silabus Kurikulum Merdeka • Kelas ${kelasAngka} (${namaMapelLengkap(mapelTerdeteksi)})`}
              </p>
            </div>
            {!isEnglishCourse && !isJenjangSD && (
              <div style={{ display: 'flex', gap: 4, background: '#f1f5f9', padding: 3, borderRadius: 8 }}>
                <button
                  type="button"
                  onClick={() => setSemesterPilihan('1')}
                  style={{
                    padding: '4px 10px',
                    borderRadius: 6,
                    border: 'none',
                    fontSize: 11,
                    fontWeight: 700,
                    cursor: 'pointer',
                    background: semesterPilihan === '1' ? '#2c3e50' : 'transparent',
                    color: semesterPilihan === '1' ? '#ffffff' : '#64748b',
                  }}
                >
                  Semester 1 (Ganjil)
                </button>
                <button
                  type="button"
                  onClick={() => setSemesterPilihan('2')}
                  style={{
                    padding: '4px 10px',
                    borderRadius: 6,
                    border: 'none',
                    fontSize: 11,
                    fontWeight: 700,
                    cursor: 'pointer',
                    background: semesterPilihan === '2' ? '#2c3e50' : 'transparent',
                    color: semesterPilihan === '2' ? '#ffffff' : '#64748b',
                  }}
                >
                  Semester 2 (Genap)
                </button>
              </div>
            )}
          </div>

          {/* Pemilihan Bab: English Course (Mandiri) vs SD (Mandiri) vs Kurikulum Merdeka (SMP & SMA) */}
          {isEnglishCourse ? (
            <div style={{ background: '#f5f3ff', border: '1px solid #ddd6fe', borderRadius: 12, padding: 14, marginBottom: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8, flexWrap: 'wrap', gap: 6 }}>
                <div style={{ fontSize: 12.5, fontWeight: 800, color: '#5b21b6', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Sparkles size={15} color="#7c3aed" /> Modul &amp; Capaian English Course (Mandiri Tentor)
                </div>
                <span style={{ fontSize: 10, fontWeight: 700, background: '#ede9fe', color: '#6d28d9', padding: '2px 8px', borderRadius: 6 }}>
                  Pengecualian Kurikulum Nasional
                </span>
              </div>
              <p style={{ fontSize: 11, color: '#6d28d9', margin: '0 0 10px 0', lineHeight: 1.5 }}>
                Capaian materi English Course ditentukan langsung oleh tentor pengampu sesuai kemampuan dan target siswa (Conversation, Phonics, Grammar, Reading, dll).
              </p>

              <div style={{ marginBottom: 10 }}>
                <label style={{ display: 'block', fontSize: 11.5, fontWeight: 700, color: '#334155', marginBottom: 6 }}>
                  Fokus Kemampuan Bahasa Inggris Sesi Ini:
                </label>
                <select
                  value={englishFocus}
                  onChange={(e) => {
                    const foc = e.target.value;
                    setEnglishFocus(foc);
                    setMateriAktual(`${foc}: ${englishTopic || 'Session Practice'}`);
                  }}
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    borderRadius: 8,
                    border: '1px solid #cbd5e1',
                    fontSize: 12.5,
                    color: '#1e293b',
                    background: '#ffffff',
                    outline: 'none',
                  }}
                >
                  <option value="🗣️ Speaking & Conversation">🗣️ Speaking &amp; Conversation (Fluency, Dialogue, Daily Talk)</option>
                  <option value="🔤 Phonics & Pronunciation">🔤 Phonics &amp; Pronunciation (Sound Drills, Accent &amp; Intonation)</option>
                  <option value="📝 Grammar & Sentence Structure">📝 Grammar &amp; Sentence Structure (Tenses, Parts of Speech)</option>
                  <option value="📖 Reading Comprehension & Story">📖 Reading Comprehension &amp; Storytelling</option>
                  <option value="🎧 Listening & Comprehension">🎧 Listening &amp; Dialogue Comprehension</option>
                  <option value="✍️ Creative Writing & Essay">✍️ Creative Writing &amp; Essay Composition</option>
                  <option value="🎯 Test Preparation (TOEFL/IELTS/Cambridge)">🎯 Test Preparation (TOEFL Junior/Primary, Cambridge)</option>
                  <option value="🎲 English Vocabulary & Games">🎲 English Vocabulary &amp; Interactive Roleplay</option>
                  <option value="💡 Topik / Unit Mandiri Tentor">💡 Topik / Unit Mandiri Tentor</option>
                </select>
              </div>

              <div style={{ marginBottom: 10 }}>
                <label style={{ display: 'block', fontSize: 11.5, fontWeight: 700, color: '#334155', marginBottom: 6 }}>
                  Topik / Unit Pembahasan Hari Ini:
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Unit 3 - Daily Routine & Simple Present Tense, Food Vocabulary, dll."
                  value={englishTopic}
                  onChange={(e) => {
                    const t = e.target.value;
                    setEnglishTopic(t);
                    setMateriAktual(`${englishFocus}: ${t}`);
                  }}
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    borderRadius: 8,
                    border: '1px solid #cbd5e1',
                    fontSize: 12.5,
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 11.5, fontWeight: 700, color: '#334155', marginBottom: 6 }}>
                  Target Kosa Kata Baru (Vocabulary Focus):
                </label>
                <input
                  type="text"
                  placeholder="Contoh: delicious, beverage, menu, order, reservation, receipt"
                  value={englishVocab}
                  onChange={(e) => setEnglishVocab(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: 8,
                    border: '1px solid #cbd5e1',
                    fontSize: 12,
                    boxSizing: 'border-box',
                  }}
                />
              </div>
            </div>
          ) : isJenjangSD ? (
            <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 12, padding: 14, marginBottom: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8, flexWrap: 'wrap', gap: 6 }}>
                <div style={{ fontSize: 12.5, fontWeight: 800, color: '#166534', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Sparkles size={15} color="#16a34a" /> Pembelajaran Kelas SD (Materi Mandiri Tentor)
                </div>
                <span style={{ fontSize: 10, fontWeight: 700, background: '#dcfce7', color: '#15803d', padding: '2px 8px', borderRadius: 6 }}>
                  Pengecualian Kurmer Nasional
                </span>
              </div>
              <p style={{ fontSize: 11, color: '#15803d', margin: '0 0 10px 0', lineHeight: 1.5 }}>
                Sistem silabus dan bank soal saat ini difokuskan penuh untuk jenjang SMP dan SMA. Untuk kelas SD, tentor dapat mencatat mata pelajaran dan materi yang diajarkan secara mandiri sesuai kebutuhan siswa.
              </p>

              <div style={{ marginBottom: 10 }}>
                <label style={{ display: 'block', fontSize: 11.5, fontWeight: 700, color: '#334155', marginBottom: 6 }}>
                  Mata Pelajaran SD:
                </label>
                <select
                  value={sdMapelPilihan}
                  onChange={(e) => {
                    const m = e.target.value;
                    setSdMapelPilihan(m);
                    setMateriAktual(`${m}: ${sdTopikMateri || 'Materi Harian'}${sdCatatan ? ' (' + sdCatatan + ')' : ''}`);
                  }}
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    borderRadius: 8,
                    border: '1px solid #cbd5e1',
                    fontSize: 12.5,
                    color: '#1e293b',
                    background: '#ffffff',
                    outline: 'none',
                  }}
                >
                  <option value="Matematika SD">Matematika SD (Hitung Dasar, Operasi Bilangan, Pecahan, Geometri)</option>
                  <option value="Bahasa Indonesia SD">Bahasa Indonesia SD (Membaca, Menulis, Kalimat, Tata Bahasa)</option>
                  <option value="IPAS SD">IPAS SD (Sains Dasar & Lingkungan Sosial)</option>
                  <option value="Calistung Dasar">Calistung Dasar (Membaca, Menulis, Berhitung Pemula)</option>
                  <option value="Pendampingan PR & Tugas Sekolah">Pendampingan PR &amp; Tugas Sekolah</option>
                  <option value="Materi Tematik Terpadu">Materi Tematik Terpadu SD</option>
                  <option value="Materi Mandiri Tentor">Materi Mandiri Tentor Lainnya</option>
                </select>
              </div>

              <div style={{ marginBottom: 10 }}>
                <label style={{ display: 'block', fontSize: 11.5, fontWeight: 700, color: '#334155', marginBottom: 6 }}>
                  Topik / Pokok Bahasan Hari Ini:
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Operasi Penjumlahan & Pengurangan Pecahan Biasa, Latihan Soal Cerita, dll."
                  value={sdTopikMateri}
                  onChange={(e) => {
                    const t = e.target.value;
                    setSdTopikMateri(t);
                    setMateriAktual(`${sdMapelPilihan}: ${t}${sdCatatan ? ' (' + sdCatatan + ')' : ''}`);
                  }}
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    borderRadius: 8,
                    border: '1px solid #cbd5e1',
                    fontSize: 12.5,
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 11.5, fontWeight: 700, color: '#334155', marginBottom: 6 }}>
                  Catatan Pembelajaran / Capaian Siswa (Opsional):
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Siswa sudah lancar menghitung pembagian bersusun, perlu latihan tambahan perkalian"
                  value={sdCatatan}
                  onChange={(e) => {
                    const c = e.target.value;
                    setSdCatatan(c);
                    setMateriAktual(`${sdMapelPilihan}: ${sdTopikMateri || 'Materi Harian'}${c ? ' (' + c + ')' : ''}`);
                  }}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: 8,
                    border: '1px solid #cbd5e1',
                    fontSize: 12,
                    boxSizing: 'border-box',
                  }}
                />
              </div>
            </div>
          ) : (
            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 12, padding: 12, marginBottom: 14 }}>
              <label style={{ display: 'block', fontSize: 11.5, fontWeight: 700, color: '#334155', marginBottom: 6 }}>
                Pilih Bab Kurikulum Merdeka:
              </label>
              <select
                value={selectedBabId}
                onChange={handlePilihBab}
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: 8,
                  border: '1px solid #cbd5e1',
                  fontSize: 12.5,
                  color: '#1e293b',
                  background: '#ffffff',
                  marginBottom: 8,
                  outline: 'none',
                }}
              >
                <option value="">-- Pilih Bab dari Silabus Resmi (atau isi manual di bawah) --</option>
                {listBabSilabus.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.judul} {b.alokasiSesi ? `(${b.alokasiSesi} Sesi)` : ''}
                  </option>
                ))}
              </select>

              {babTerpilihObj && Array.isArray(babTerpilihObj.subBab) && babTerpilihObj.subBab.length > 0 && (
                <div style={{ marginTop: 8 }}>
                  <label style={{ display: 'block', fontSize: 11.5, fontWeight: 700, color: '#334155', marginBottom: 6 }}>
                    Pilih Sub-Bab / Pokok Bahasan:
                  </label>
                  <select
                    value={selectedSubBab}
                    onChange={handlePilihSubBab}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: 8,
                      border: '1px solid #cbd5e1',
                      fontSize: 12,
                      color: '#1e293b',
                      background: '#ffffff',
                      outline: 'none',
                    }}
                  >
                    {babTerpilihObj.subBab.map((sb, idx) => (
                      <option key={idx} value={sb}>
                        {idx + 1}. {sb}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {babTerpilihObj?.cp && (
                <div style={{ marginTop: 8, padding: '7px 10px', background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 8, fontSize: 11, color: '#1e40af', lineHeight: 1.5 }}>
                  <b>Capaian Pembelajaran (CP):</b> {babTerpilihObj.cp}
                </div>
              )}
            </div>
          )}

          {/* Latihan Pemahaman Sesi Tatap Muka (Hanya SMP & SMA) */}
          {!isJenjangSD && (
            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 12, padding: 12, marginBottom: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
                <div>
                  <div style={{ fontSize: 11.5, fontWeight: 700, color: '#334155' }}>
                    🎯 Latihan Pemahaman Sesi Hari Ini:
                  </div>
                  <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>
                    {schedule.latihanSesi?.status === 'aktif'
                      ? `✅ Latihan aktif: ${schedule.latihanSesi.judul} (${schedule.latihanSesi.totalSoal} Soal). Siswa dapat mengerjakannya di HP masing-masing.`
                      : 'Belum ada latihan sesi yang diterbitkan. Siswa belum memiliki kuis pemahaman untuk sesi ini.'}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setBukaModalLatihan(true)}
                  style={{
                    background: schedule.latihanSesi?.status === 'aktif' ? '#0284c7' : '#4f46e5',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: 8,
                    padding: '7px 12px',
                    fontSize: 11.5,
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  {schedule.latihanSesi?.status === 'aktif' ? 'Kelola / Tinjau Latihan' : '🎯 Siapkan Latihan Sesi'}
                </button>
              </div>
            </div>
          )}

          {/* Status Ketuntasan Materi & Pemahaman Siswa */}
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 10, marginBottom: 14 }}>
            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 12, padding: 12 }}>
              <div style={{ fontSize: 11.5, fontWeight: 700, color: '#334155', marginBottom: 6 }}>
                Status Ketuntasan Materi Sesi Ini:
              </div>
              <div style={{ display: 'flex', gap: 6, flexDirection: 'column' }}>
                <button
                  type="button"
                  onClick={() => setStatusKetuntasan('berjalan')}
                  style={{
                    padding: '8px 10px',
                    borderRadius: 8,
                    textAlign: 'left',
                    cursor: 'pointer',
                    fontSize: 11.5,
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    border: statusKetuntasan === 'berjalan' ? '2px solid #f59e0b' : '1px solid #cbd5e1',
                    background: statusKetuntasan === 'berjalan' ? '#fffbeb' : '#ffffff',
                    color: statusKetuntasan === 'berjalan' ? '#b45309' : '#475569',
                  }}
                >
                  <span>🔄 Masih Berjalan (Lanjut Sesi Depan)</span>
                  {statusKetuntasan === 'berjalan' && <Clock size={14} color="#b45309" />}
                </button>
                <button
                  type="button"
                  onClick={() => setStatusKetuntasan('tuntas')}
                  style={{
                    padding: '8px 10px',
                    borderRadius: 8,
                    textAlign: 'left',
                    cursor: 'pointer',
                    fontSize: 11.5,
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    border: statusKetuntasan === 'tuntas' ? '2px solid #10b981' : '1px solid #cbd5e1',
                    background: statusKetuntasan === 'tuntas' ? '#ecfdf5' : '#ffffff',
                    color: statusKetuntasan === 'tuntas' ? '#047857' : '#475569',
                  }}
                >
                  <span>✓ Selesai Tuntas</span>
                  {statusKetuntasan === 'tuntas' && <Check size={14} color="#047857" />}
                </button>
              </div>
              <div style={{ fontSize: 10, color: '#64748b', marginTop: 6, lineHeight: 1.4 }}>
                💡 Jika bab panjang dan belum tuntas 1 pertemuan, pilih "Masih Berjalan" agar tentor sesi berikutnya langsung melanjutkan tanpa bingung.
              </div>
            </div>

            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 12, padding: 12 }}>
              <div style={{ fontSize: 11.5, fontWeight: 700, color: '#334155', marginBottom: 6 }}>
                Tingkat Pemahaman Siswa Hari Ini:
              </div>
              <div style={{ display: 'flex', gap: 6, flexDirection: 'column' }}>
                {[
                  { id: 'paham', label: '🌟 Sangat Paham', desc: 'Siswa antusias & latihan tuntas' },
                  { id: 'cukup', label: '👍 Cukup Paham', desc: 'Perlu sedikit latihan pendalaman' },
                  { id: 'butuh_bimbingan', label: '⚠️ Butuh Bimbingan', desc: 'Perlu review konsep mendasar' },
                ].map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setTingkatPemahaman(opt.id)}
                    style={{
                      padding: '7px 10px',
                      borderRadius: 8,
                      textAlign: 'left',
                      cursor: 'pointer',
                      fontSize: 11.5,
                      fontWeight: 700,
                      border: tingkatPemahaman === opt.id ? '2px solid #6366f1' : '1px solid #cbd5e1',
                      background: tingkatPemahaman === opt.id ? '#eef2ff' : '#ffffff',
                      color: tingkatPemahaman === opt.id ? '#4338ca' : '#475569',
                    }}
                  >
                    <div>{opt.label}</div>
                    <div style={{ fontSize: 10, fontWeight: 400, opacity: 0.85, marginTop: 1 }}>{opt.desc}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <label style={{ display: 'block', fontSize: 11.5, fontWeight: 700, color: '#334155', marginBottom: 4 }}>
            Rincian Pembahasan / Catatan Kelas:
          </label>
          <textarea
            rows={isMobile ? 3 : 4}
            value={materiAktual}
            onChange={(e) => setMateriAktual(e.target.value)}
            placeholder="Tuliskan materi yang diajarkan hari ini..."
            style={st.textarea(isMobile)}
          />

          <div style={st.lampiranBox(isMobile)}>
            {!materiFileUploadedUrl ? (
              <label style={st.uploadBoxSecondary(isMobile, uploadingMateriFile)}>
                <input type="file" accept="image/*,.pdf" onChange={handleMateriFileChange} disabled={uploadingMateriFile} style={{ display: 'none' }} />
                {uploadingMateriFile ? '⏳ Mengunggah lampiran...' : <><Paperclip size={16} /> Lampirkan foto materi/worksheet (opsional)</>}
              </label>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#10b981', fontWeight: 'bold', fontSize: 11 }}>
                <CheckCircle size={14} /> Lampiran materi tersimpan
                <button type="button" onClick={() => setMateriFileUploadedUrl('')} style={st.btnGantiFoto}>Ganti</button>
              </div>
            )}
          </div>

          <div style={st.footerBtns(isMobile)}>
            <button onClick={() => setStep(2)} style={st.btnSecondary(isMobile)}>⬅ Kembali</button>
            <button onClick={handleFinalizeClass} disabled={loading} style={st.btnSave(isMobile, loading)}>
              {loading ? 'Menyimpan...' : '💾 Simpan Sesi & Selesai'}
            </button>
          </div>
        </div>
      )}

      {/* Modal Penyiapan Latihan Sesi Tatap Muka */}
      {bukaModalLatihan && schedule && (
        <ModalSiapkanLatihanSesi
          schedule={schedule}
          teacher={teacher}
          onClose={() => setBukaModalLatihan(false)}
          onSuccess={(latBaru) => {
            setSchedule((prev) => (prev ? { ...prev, latihanSesi: latBaru } : prev));
            setBukaModalLatihan(false);
          }}
        />
      )}
    </div>
  );
};

const st = {
  container: (m) => ({ padding: m ? 10 : 15, width: '100%', boxSizing: 'border-box', maxWidth: m ? '100%' : 1200, margin: '0 auto' }),
  spinner: { width: 40, height: 40, border: '4px solid #e2e8f0', borderTop: '4px solid #652D90', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 12px' },
  btnBack: (m) => ({ background: 'none', border: 'none', color: '#7f8c8d', cursor: 'pointer', marginBottom: m ? 10 : 15, display: 'flex', alignItems: 'center', gap: 5, fontSize: m ? 12 : 14 }),
  headerCard: (m) => ({ background: 'white', padding: m ? 15 : 20, borderRadius: m ? 12 : 15, border: '1px solid #eee', marginBottom: m ? 12 : 20 }),
  headerFlex: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 },
  headerTitle: (m) => ({ margin: 0, fontSize: m ? 15 : 18, color: '#2c3e50' }),
  headerTime: (m) => ({ margin: 0, color: '#7f8c8d', fontSize: m ? 11 : 13 }),
  badge: (m) => ({ background: '#ebf5fb', color: '#3498db', padding: m ? '4px 10px' : '5px 12px', borderRadius: 20, fontSize: m ? 10 : 11, fontWeight: 'bold' }),
  gridContainer: (m) => ({ display: 'flex', flexWrap: 'wrap', gap: m ? 12 : 20, width: '100%', flexDirection: m ? 'column' : 'row' }),
  card: (m) => ({ background: 'white', padding: m ? 15 : 20, borderRadius: m ? 12 : 15, border: '1px solid #eee', flex: m ? '1 1 100%' : '1 1 350px', boxSizing: 'border-box', display: 'flex', flexDirection: 'column', marginBottom: 12 }),
  cardTitle: { margin: '0 0 15px', fontSize: 15, display: 'flex', alignItems: 'center', gap: 8 },
  qrWrapper: { textAlign: 'center', padding: 15, border: '1px dashed #ddd', borderRadius: 10, alignSelf: 'center' },
  qrHint: (m) => ({ fontSize: m ? 10 : 11, color: '#7f8c8d', marginTop: 10, textAlign: 'center' }),
  studentScrollArea: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 10, marginBottom: 20, maxHeight: 400, overflowY: 'auto' },
  studentItem: (m) => ({ padding: m ? 10 : 12, borderRadius: 10, cursor: 'pointer', textAlign: 'center', transition: '0.2s' }),
  studentName: (m) => ({ fontWeight: 'bold', fontSize: m ? 11 : 13 }),
  studentStatus: { fontSize: 10, opacity: 0.8 },
  step2Title: (m) => ({ marginTop: 0, color: '#e67e22', fontSize: m ? 14 : 16 }),
  textarea: (m) => ({ width: '100%', padding: 15, borderRadius: 10, border: '1px solid #ddd', boxSizing: 'border-box', fontSize: m ? 13 : 14, marginBottom: 20, outline: 'none', resize: 'vertical' }),
  footerBtns: (m) => ({ display: 'flex', gap: 10, flexDirection: m ? 'column' : 'row' }),
  btnMain: (m) => ({ flex: 1, padding: m ? 12 : 14, background: '#3498db', color: 'white', border: 'none', borderRadius: 10, fontWeight: 'bold', cursor: 'pointer', fontSize: m ? 12 : 14, width: '100%' }),
  btnSecondary: (m) => ({ padding: m ? 12 : '14px 25px', background: '#f1f5f9', color: '#64748b', border: 'none', borderRadius: 10, fontWeight: 'bold', cursor: 'pointer', fontSize: m ? 12 : 14, textAlign: 'center' }),
  btnSave: (m, l) => ({ flex: 1, padding: m ? 12 : 14, background: l ? '#bdc3c7' : '#2c3e50', color: 'white', border: 'none', borderRadius: 10, fontWeight: 'bold', cursor: l ? 'not-allowed' : 'pointer', fontSize: m ? 12 : 14 }),
  uploadOptionsRow: (m) => ({ display: 'flex', gap: 8, flexDirection: m ? 'column' : 'row' }),
  uploadBoxImport: (m, l) => ({ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: m ? 14 : 16, borderRadius: 10, border: '2px dashed #94a3b8', color: '#64748b', fontWeight: 'bold', fontSize: m ? 12 : 13, cursor: l ? 'not-allowed' : 'pointer', opacity: l ? 0.6 : 1, background: '#f8fafc', flex: 1 }),
  step1TabRow: (_m) => ({ display: 'flex', gap: 8, marginBottom: 12 }),
  step1TabBtn: (a) => ({ flex: 1, padding: '10px 14px', borderRadius: 10, border: a ? '2px solid #2c3e50' : '1px solid #e2e8f0', background: a ? '#2c3e50' : 'white', color: a ? 'white' : '#64748b', fontWeight: 'bold', fontSize: 13, cursor: 'pointer', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }),
  tabDot: { width: 7, height: 7, borderRadius: '50%', background: '#ef4444' },
  tabSafeNote: (m) => ({ fontSize: m ? 10 : 11, color: '#10b981', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 8, padding: '6px 10px', marginBottom: 12 }),
  tipeKelasRow: (m) => ({ display: 'flex', gap: 8, marginBottom: 12, flexDirection: m ? 'column' : 'row' }),
  tipeKelasBtn: (a) => ({ flex: 1, padding: '10px 14px', borderRadius: 10, border: a ? '2px solid #3498db' : '1px solid #e2e8f0', background: a ? '#ebf5fb' : 'white', color: a ? '#3498db' : '#64748b', fontWeight: 'bold', fontSize: 13, cursor: 'pointer' }),
  absensiHint: (m) => ({ fontSize: m ? 11 : 12, color: '#64748b', marginBottom: 12, lineHeight: 1.5 }),
  uploadBox: (m, l) => ({ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: m ? 14 : 16, borderRadius: 10, border: '2px dashed #3498db', color: '#3498db', fontWeight: 'bold', fontSize: m ? 12 : 13, cursor: l ? 'not-allowed' : 'pointer', opacity: l ? 0.6 : 1, background: '#f8fbff', flex: 1 }),
  uploadBoxSecondary: (m, l) => ({ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: 10, borderRadius: 8, border: '1px dashed #cbd5e1', color: '#64748b', fontWeight: 600, fontSize: m ? 11 : 12, cursor: l ? 'not-allowed' : 'pointer', opacity: l ? 0.6 : 1 }),
  absensiSuccessBox: (_m) => ({ display: 'flex', alignItems: 'center', gap: 12, padding: 10, borderRadius: 10, border: '1px solid #bbf7d0', background: '#f0fdf4' }),
  absensiThumb: { width: 56, height: 56, objectFit: 'cover', borderRadius: 8, border: '1px solid #e2e8f0' },
  btnGantiFoto: { marginTop: 4, background: 'none', border: 'none', color: '#3498db', fontSize: 11, fontWeight: 'bold', cursor: 'pointer', textDecoration: 'underline', padding: 0 },
  absensiErrorText: { color: '#ef4444', fontSize: 12, marginTop: 8 },
  btnDisabled: { background: '#cbd5e1', color: '#64748b', cursor: 'not-allowed' },
  lampiranBox: (_m) => ({ marginBottom: 16 }),
};

export default ClassSession;