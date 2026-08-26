// src/pages/teacher/ClassSession.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db } from '../../firebase';
import { 
  collection, addDoc, doc, getDoc, setDoc, serverTimestamp, 
  onSnapshot, query, where, updateDoc 
} from "firebase/firestore";
import { QRCodeSVG } from 'qrcode.react';
import { QrCode, ArrowLeft, ExternalLink, Camera, Upload, CheckCircle, Paperclip } from 'lucide-react';
// 🔥 BARU: dipakai buat upload foto/screenshot bukti kehadiran & lampiran
// materi ke Supabase Storage (bucket yang sama dengan materi e-learning).
import { uploadElearningFile } from '../../services/uploadService';

const ClassSession = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [schedule, setSchedule] = useState(null);
  const [teacher, setTeacher] = useState(null);
  const [loading, setLoading] = useState(true);
  const [attendanceMap, setAttendanceMap] = useState({});
  const [step, setStep] = useState(1);
  const [materiAktual, setMateriAktual] = useState("");
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [salaryRules, setSalaryRules] = useState(null);
  const [timeStatus, setTimeStatus] = useState({ isPastEnd: false, remaining: '' });

  // ============================================================
  // 🔥 BARU: TIPE KELAS & BUKTI KEHADIRAN
  // ============================================================
  // `tipeKelas` dipilih guru SENDIRI di awal sesi (bukan properti tetap
  // jadwal) -- karena kelas yang biasanya tatap muka bisa berubah jadi
  // online sewaktu-waktu (mis. pas tanggal merah). Berdasarkan pilihan
  // ini, bukti kehadiran yang diminta berbeda:
  // - "reguler" -> WAJIB foto kamera langsung (pakai capture="environment",
  //   buka kamera HP langsung, bukan pilih dari galeri -- supaya beneran
  //   foto real-time, bukan foto lama yang di-upload ulang)
  // - "online"  -> WAJIB screenshot sesi video call (boleh dari galeri,
  //   karena screenshot itu sendiri sudah bukti waktu real dari aplikasi
  //   meeting-nya)
  // Foto/screenshot ini WAJIB (menggerbangi tombol lanjut ke Step 2) --
  // gak bisa diskip, sesuai keputusan eksplisit soal ini.
  const [tipeKelas, setTipeKelas] = useState('reguler');
  const [absensiPreviewUrl, setAbsensiPreviewUrl] = useState('');
  const [absensiUploadedUrl, setAbsensiUploadedUrl] = useState('');
  const [uploadingAbsensi, setUploadingAbsensi] = useState(false);
  const [absensiError, setAbsensiError] = useState('');

  // 🔥 BARU: lampiran materi (opsional) -- buat tracking "tentor sudah
  // upload materi hari ini atau belum" yang bisa dipantau admin dari
  // TeacherSalaries.jsx (field materiFileUrl per log).
  const [materiFileUploadedUrl, setMateriFileUploadedUrl] = useState('');
  const [uploadingMateriFile, setUploadingMateriFile] = useState(false);
  
  // 🔥 STATE UNTUK GOOGLE FORM
  const [googleForms, setGoogleForms] = useState({
    sd: '',
    smp: '',
    sma: '',
    english: '',
    default: ''
  });

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // 🔥 CEK WAKTU SETIAP DETIK
  useEffect(() => {
    if (!schedule) return;
    
    const checkTime = () => {
      const now = new Date();
      const [endHour, endMinute] = schedule.end.split(':').map(Number);
      const endTime = new Date(now);
      endTime.setHours(endHour, endMinute, 0, 0);
      
      const isPastEndTime = now > endTime;
      
      if (!isPastEndTime) {
        const diffMs = endTime - now;
        const diffMin = Math.floor(diffMs / 60000);
        const diffHour = Math.floor(diffMin / 60);
        const remainingMin = diffMin % 60;
        
        let remaining = '';
        if (diffHour > 0) {
          remaining = diffHour + ' jam ' + remainingMin + ' menit';
        } else {
          remaining = remainingMin + ' menit';
        }
        setTimeStatus({ isPastEnd: false, remaining });
      } else {
        setTimeStatus({ isPastEnd: true, remaining: '0' });
      }
    };
    
    checkTime();
    const interval = setInterval(checkTime, 10000);
    return () => clearInterval(interval);
  }, [schedule]);

  // 🔥 AMBIL DATA + GOOGLE FORM SETTINGS
  useEffect(() => {
    const fetchData = async () => {
      try {
        // 1. Ambil data jadwal
        const docRef = doc(db, "jadwal_bimbel", id);
        const docSnap = await getDoc(docRef);
        if (!docSnap.exists()) {
          alert("⚠️ Jadwal tidak ditemukan!");
          navigate('/guru/dashboard');
          return;
        }
        const data = { id: docSnap.id, ...docSnap.data() };
        setSchedule(data);
        setMateriAktual(data.title || "");

        // 2. Ambil data guru dari localStorage
        const stored = localStorage.getItem('teacherData');
        if (stored) {
          setTeacher(JSON.parse(stored));
        } else {
          alert("⚠️ Data guru tidak ditemukan!");
          navigate('/guru/dashboard');
          return;
        }

        // 3. Ambil salary rules
        const salaryRef = doc(db, "settings", "global_config");
        const salarySnap = await getDoc(salaryRef);
        if (salarySnap.exists() && salarySnap.data().salaryRules) {
          const sr = salarySnap.data().salaryRules;
          // 🔥 Terima format LAMA (honorSD/honorSMP/dst) maupun BARU
          // (rates array) -- biar kelas yang lagi berjalan gak tiba-tiba
          // error kalau Settings.jsx belum sempat nyimpen format baru.
          if (Array.isArray(sr.rates)) {
            setSalaryRules(sr);
          } else {
            setSalaryRules({
              rates: [
                { id: 'sd', label: 'SD', pricePerHour: sr.honorSD ?? 35000 },
                { id: 'smp', label: 'SMP', pricePerHour: sr.honorSMP ?? 40000 },
                { id: 'sma', label: 'SMA', pricePerHour: sr.honorSMA ?? 50000 },
              ],
              bonusRules: [
                { id: 'english', label: 'Bonus English', matchProgram: 'English', bonusPerHour: sr.bonusInggris ?? 10000 },
              ],
              kompensasiPersen: sr.kompensasiPersen ?? 50,
              honorMinimal: sr.honorMinimal ?? 20000,
            });
          }
        } else {
          setSalaryRules({
            rates: [
              { id: 'sd', label: 'SD', pricePerHour: 35000 },
              { id: 'smp', label: 'SMP', pricePerHour: 40000 },
              { id: 'sma', label: 'SMA', pricePerHour: 50000 },
            ],
            bonusRules: [
              { id: 'english', label: 'Bonus English', matchProgram: 'English', bonusPerHour: 10000 },
            ],
            kompensasiPersen: 50,
            honorMinimal: 20000,
          });
        }

        // 🔥 4. AMBIL GOOGLE FORM SETTINGS
        const formDoc = await getDoc(doc(db, "settings", "google_forms"));
        if (formDoc.exists()) {
          setGoogleForms(formDoc.data());
        }

        setLoading(false);
      } catch (error) {
        console.error("Error fetching data:", error);
        alert("❌ Gagal memuat data kelas");
        navigate('/guru/dashboard');
      }
    };

    if (id) fetchData();
  }, [id, navigate]);

  // 🔥 REAL-TIME ATTENDANCE
  useEffect(() => {
    if (!schedule?.id) return;
    
    const today = new Date().toISOString().split('T')[0];
    const q = query(
      collection(db, "attendance"), 
      where("date", "==", today), 
      where("scheduleId", "==", schedule.id)
    );
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const newMap = { ...attendanceMap };
      snapshot.docs.forEach(doc => {
        const data = doc.data();
        if (schedule.students && schedule.students.some(s => s.id === data.studentId)) {
          newMap[data.studentId] = (data.status === "Hadir");
        }
      });
      setAttendanceMap(newMap);
    }, (error) => { 
      console.error("Listener Error:", error); 
    });
    
    return () => unsubscribe();
  }, [schedule]);

  // ============================================================
  // 🔥 BARU: HANDLE UPLOAD FOTO/SCREENSHOT ABSENSI (WAJIB)
  // ============================================================
  const handleAbsensiFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setAbsensiError('');
    setUploadingAbsensi(true);

    // Preview lokal dulu (biar guru langsung lihat apa yang dia pilih,
    // gak perlu nunggu upload selesai buat lihat previewnya).
    const localPreview = URL.createObjectURL(file);
    setAbsensiPreviewUrl(localPreview);

    try {
      const result = await uploadElearningFile(file, 'absensi-guru');
      if (result.success) {
        setAbsensiUploadedUrl(result.downloadURL);
      } else {
        setAbsensiError('Gagal upload: ' + (result.error || 'Terjadi kesalahan.'));
        setAbsensiUploadedUrl('');
      }
    } catch (err) {
      setAbsensiError('Gagal upload: ' + err.message);
      setAbsensiUploadedUrl('');
    }
    setUploadingAbsensi(false);
  };

  // 🔥 BARU: HANDLE UPLOAD LAMPIRAN MATERI (OPSIONAL)
  const handleMateriFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingMateriFile(true);
    try {
      const result = await uploadElearningFile(file, 'lampiran-materi-harian');
      if (result.success) {
        setMateriFileUploadedUrl(result.downloadURL);
      } else {
        alert('Gagal upload lampiran: ' + (result.error || 'Terjadi kesalahan.'));
      }
    } catch (err) {
      alert('Gagal upload lampiran: ' + err.message);
    }
    setUploadingMateriFile(false);
  };

  // 🔥 TOGGLE SISWA
  const toggleStudent = async (student) => {
    if (!schedule || !teacher) return;
    
    const isCurrentlyPresent = !!attendanceMap[student.id];
    const willBePresent = !isCurrentlyPresent;
    setAttendanceMap(prev => ({ ...prev, [student.id]: willBePresent }));
    
    const today = new Date().toISOString().split('T')[0];
    const absenId = student.id + '_' + today + '_' + schedule.id;
    const absenRef = doc(db, "attendance", absenId);
    
    try {
      await setDoc(absenRef, {
        studentId: student.id, 
        studentName: student.nama,
        program: student.program || schedule.program || "Reguler",
        kelasSekolah: student.kelas || student.kelasSekolah || "-",
        teacherId: teacher.id, 
        teacherName: teacher.nama,
        date: today, 
        tanggal: today, 
        timestamp: serverTimestamp(),
        status: willBePresent ? "Hadir" : "Alpha",
        keterangan: willBePresent ? "Input Manual Guru" : "Siswa tidak hadir",
        mapel: schedule.title || "Umum",
        scheduleId: schedule.id || "", 
        planet: schedule.planet || "Ruang Umum"
      }, { merge: true });
    } catch (error) {
      console.error("Update Absen Error:", error);
      setAttendanceMap(prev => ({ ...prev, [student.id]: isCurrentlyPresent }));
    }
  };

  // 🔥 FIX INTI: sebelumnya tarif dicari lewat if/else yang HARDCODE nama
  // jenjang (SD/SMP/SMA) dan program (English) langsung di kode -- kalau
  // owner mau nambah kategori/jenis honor baru di Settings, gak akan
  // pernah kepake di sini karena kode ini gak tau kategori itu ada.
  // Sekarang tarif dicari dari daftar `rates` & `bonusRules` yang diatur
  // bebas lewat Settings -- kategori/bonus baru otomatis langsung kepake
  // di sini tanpa perlu sentuh kode lagi.
  const hitungHonor = () => {
    if (!salaryRules) return { nominal: 0, detailTxt: "", statusGaji: "Menunggu Validasi" };

    const siswaHadirList = (schedule.students || []).filter(s => attendanceMap[s.id]);
    const jumlahHadir = siswaHadirList.length;

    const startParts = schedule.start.split(':');
    const endParts = schedule.end.split(':');
    const startTime = new Date(0, 0, 0, startParts[0], startParts[1]);
    const endTime = new Date(0, 0, 0, endParts[0], endParts[1]);
    const diffHours = (endTime - startTime) / 36e5;

    const level = schedule.level || "SD";
    const program = schedule.program || "Reguler";

    // Cari tarif yang cocok sama Jenjang jadwal (dibandingkan tanpa peduli besar-kecil huruf)
    const rates = salaryRules.rates || [];
    const matchedRate = rates.find(r =>
      (r.id || '').toLowerCase() === level.toLowerCase() ||
      (r.label || '').toLowerCase() === level.toLowerCase()
    );
    // Kalau gak ada yang cocok persis, pakai tarif pertama di daftar sebagai jaring pengaman
    let ratePerJam = matchedRate ? (matchedRate.pricePerHour || 0) : (rates[0]?.pricePerHour || 35000);
    let detailTxt = program + ' - ' + level + ' - ' + materiAktual;
    let statusGaji = "Menunggu Validasi";

    // Cari bonus yang cocok sama Program jadwal
    const bonusRules = salaryRules.bonusRules || [];
    const matchedBonus = bonusRules.find(b => (b.matchProgram || '').toLowerCase() === program.toLowerCase());
    if (matchedBonus) {
      ratePerJam += (matchedBonus.bonusPerHour || 0);
      detailTxt += ` [${matchedBonus.label || 'Bonus'}]`;
    }

    let nominal = 0;
    const kompensasiPersen = salaryRules.kompensasiPersen ?? 50;

    if (jumlahHadir === 0) {
      const rateKompensasi = ratePerJam * (kompensasiPersen / 100);
      nominal = rateKompensasi * diffHours;
      detailTxt += ' [Kompensasi ' + kompensasiPersen + '% - 0 Hadir]';
      statusGaji = "Kompensasi";
    } else {
      nominal = ratePerJam * diffHours;
    }

    const minimal = salaryRules.honorMinimal ?? 20000;
    if (nominal < minimal) {
      nominal = minimal;
      detailTxt += " [Honor Minimal]";
    }

    return { nominal: Math.round(nominal), detailTxt, statusGaji };
  };

  // 🔥 HANDLE BACK
  const handleBack = () => {
    if (window.confirm("Yakin kembali? Data yang belum disimpan akan hilang.")) {
      navigate('/guru/dashboard');
    }
  };

  // 🔥 FINALIZE CLASS + REDIRECT GOOGLE FORM
  const handleFinalizeClass = async () => {
    if (!materiAktual) return alert("Mohon isi materi yang diajarkan!");

    // 🔥 BARU: GERBANG WAJIB -- gak bisa finalize tanpa bukti kehadiran
    // ter-upload. Ini pengecekan CADANGAN (tombol lanjut ke Step 2 di
    // Step 1 sudah di-disable duluan kalau belum ada foto), tapi tetap
    // dicek lagi di sini jaga-jaga ada state yang gak sinkron.
    if (!absensiUploadedUrl) {
      alert(
        tipeKelas === 'online'
          ? '⚠️ Screenshot sesi online wajib diunggah dulu sebelum kelas bisa diakhiri.'
          : '⚠️ Foto kehadiran wajib diunggah dulu sebelum kelas bisa diakhiri.'
      );
      setStep(1);
      return;
    }
    
    // 🔥 CEK APAKAH SUDAH MELEWATI JAM SELESAI
    const now = new Date();
    const [endHour, endMinute] = schedule.end.split(':').map(Number);
    const endTime = new Date(now);
    endTime.setHours(endHour, endMinute, 0, 0);
    
    const isPastEndTime = now > endTime;
    
    if (!isPastEndTime) {
      const diffMs = endTime - now;
      const diffMin = Math.floor(diffMs / 60000);
      const diffHour = Math.floor(diffMin / 60);
      const remainingMin = diffMin % 60;
      
      let timeRemaining = '';
      if (diffHour > 0) {
        timeRemaining = diffHour + ' jam ' + remainingMin + ' menit';
      } else {
        timeRemaining = remainingMin + ' menit';
      }
      
      const confirmEnd = window.confirm(
        '⏰ Kelas belum mencapai jam selesai (' + schedule.end + ')!\n\n' +
        '⏳ Sisa waktu: ' + timeRemaining + '\n\n' +
        'Apakah Anda yakin ingin mengakhiri kelas lebih awal?\n' +
        '(Siswa yang belum hadir akan dicatat Alpha)'
      );
      
      if (!confirmEnd) return;
    }
    
    if (!window.confirm("Yakin akhiri kelas? Data siswa yang tidak hadir akan dicatat sebagai Alpha.")) return;
    
    setLoading(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      
      // 🔥 1. SIMPAN ATTENDANCE
      const batchPromises = (schedule.students || []).map(async (siswa) => {
        const isPresent = !!attendanceMap[siswa.id];
        const absenId = siswa.id + '_' + today + '_' + schedule.id;
        const absenRef = doc(db, "attendance", absenId);
        return setDoc(absenRef, {
          studentId: siswa.id, 
          studentName: siswa.nama,
          program: siswa.program || schedule.program || "Reguler",
          kelasSekolah: siswa.kelas || siswa.kelasSekolah || "-",
          teacherId: teacher.id, 
          teacherName: teacher.nama,
          date: today, 
          tanggal: today, 
          timestamp: serverTimestamp(),
          status: isPresent ? "Hadir" : "Alpha",
          keterangan: isPresent ? "Sesi Selesai" : "Siswa tidak hadir (Otomatis Alpha)",
          mapel: schedule.title || "Umum",
          scheduleId: schedule.id || "", 
          planet: schedule.planet || "Ruang Umum"
        }, { merge: true });
      });
      await Promise.all(batchPromises);

      // 🔥 2. SIMPAN TEACHER LOGS
      const honorData = hitungHonor();
      const siswaHadirList = (schedule.students || []).filter(s => attendanceMap[s.id]);
      const jumlahHadir = siswaHadirList.length;

      const startParts = schedule.start.split(':');
      const endParts = schedule.end.split(':');
      const startTime = new Date(0, 0, 0, startParts[0], startParts[1]);
      const endTimeCalc = new Date(0, 0, 0, endParts[0], endParts[1]);
      const diffHours = (endTimeCalc - startTime) / 36e5;

      await addDoc(collection(db, "teacher_logs"), {
        teacherId: teacher.id, 
        namaGuru: teacher.nama,
        tanggal: today, 
        waktu: new Date().toLocaleTimeString(),
        jadwalId: schedule.id, 
        program: schedule.program,
        level: schedule.level || "SD", 
        kegiatan: "Mengajar",
        detail: honorData.detailTxt, 
        siswaHadir: jumlahHadir,
        durasiJam: diffHours, 
        nominal: honorData.nominal,
        status: honorData.statusGaji, 
        createdAt: serverTimestamp(),
        // 🔥 BARU: field cross-check buat admin (TeacherSalaries.jsx) --
        // nama field disamakan PERSIS dengan yang sudah dibaca di sana,
        // supaya begitu ini di-deploy, data langsung kelihatan di
        // halaman gaji tanpa perlu sentuh kode itu lagi.
        tipeKelas: tipeKelas, // 'reguler' atau 'online'
        kelasNama: schedule.title || "Umum",
        fotoAbsensiUrl: absensiUploadedUrl,
        materiFileUrl: materiFileUploadedUrl || null,
      });

      // 🔥 3. UPDATE STATUS JADWAL
      await updateDoc(doc(db, "jadwal_bimbel", schedule.id), {
        status: 'completed',
        completedAt: serverTimestamp(),
        completedEarly: !isPastEndTime
      });

      const hadirCount = siswaHadirList.length;
      const totalCount = (schedule.students || []).length;
      
      // 🔥 4. AMBIL LINK GOOGLE FORM
      const level = schedule.level || 'sd';
      const levelKey = level.toLowerCase();
      const googleFormLink = googleForms[levelKey] || googleForms.default || '';
      
      // 🔥 5. TAMPILKAN ALERT SUKSES
      const endStatus = !isPastEndTime ? ' (Selesai Lebih Awal ⚠️)' : '';
      
      const alertMessage = 
        '✅ Kelas Berhasil Disimpan!\n\n' +
        '📚 Materi: ' + materiAktual + '\n' +
        '⏰ Jam: ' + schedule.start + ' - ' + schedule.end + '\n' +
        '🏫 Ruang: ' + (schedule.planet || "Ruang Umum") + '\n' +
        '👥 Kehadiran: ' + hadirCount + '/' + totalCount + ' siswa hadir' + endStatus + '\n\n' +
        (googleFormLink ? 
          '📋 Klik OK untuk membuka Google Form laporan materi' : 
          'ℹ️ Belum ada Google Form yang diatur. Admin bisa atur di menu Gaji Guru.');
      
      alert(alertMessage);

      // 🔥 6. REDIRECT KE GOOGLE FORM JIKA ADA
      if (googleFormLink) {
        // Buka di tab baru
        window.open(googleFormLink, '_blank');
      }
      
      // 🔥 7. NAVIGATE KE DASHBOARD
      navigate('/guru/dashboard');
      
    } catch (error) { 
      alert("Gagal menyimpan sesi: " + error.message); 
    } 
    finally { setLoading(false); }
  };

  // 🔥 LOADING
  if (loading) {
    return (
      <div style={styles.container(isMobile)}>
        <div style={{ textAlign: 'center', padding: 40, color: '#94a3b8' }}>
          <div style={styles.spinner}></div>
          <p>Memuat kelas...</p>
        </div>
      </div>
    );
  }

  if (!schedule || !teacher) {
    return (
      <div style={styles.container(isMobile)}>
        <div style={{ textAlign: 'center', padding: 40, color: '#ef4444' }}>
          <p>⚠️ Data kelas tidak ditemukan</p>
          <button onClick={() => navigate('/guru/dashboard')} style={styles.btnBack(isMobile)}>
            Kembali ke Dashboard
          </button>
        </div>
      </div>
    );
  }

  // 🔥 RENDER
  return (
    <div style={styles.container(isMobile)}>
      <button onClick={handleBack} style={styles.btnBack(isMobile)}>
        <ArrowLeft size={16}/> Kembali
      </button>
      
      <div style={styles.headerCard(isMobile)}>
        <div style={styles.headerFlex}>
          <div>
            <h2 style={styles.headerTitle(isMobile)}>{schedule.title || "Umum"}</h2>
            <p style={styles.headerTime(isMobile)}>
              ⏰ {schedule.start} - {schedule.end}
              {!timeStatus.isPastEnd && timeStatus.remaining && (
                <span style={{ color: '#f59e0b', marginLeft: 8 }}>
                  ⏳ {timeStatus.remaining} lagi
                </span>
              )}
              {timeStatus.isPastEnd && (
                <span style={{ color: '#10b981', marginLeft: 8 }}>
                  ✅ Waktu selesai telah lewat
                </span>
              )}
            </p>
          </div>
          <span style={styles.badge(isMobile)}>{schedule.planet || "Ruang Umum"}</span>
        </div>
      </div>

      {step === 1 && (
        <div>
          {/* ============================================================
              🔥 BARU: TIPE KELAS + BUKTI KEHADIRAN WAJIB
              ============================================================
              Ditaruh PALING ATAS Step 1 -- ini gerbang pertama sebelum
              guru bisa lanjut ke pencatatan siswa & laporan materi.
          ============================================================ */}
          <div style={styles.card(isMobile)}>
            <h4 style={styles.cardTitle}><Camera size={18} /> Bukti Kehadiran Mengajar</h4>

            <div style={styles.tipeKelasRow(isMobile)}>
              <button
                type="button"
                onClick={() => { setTipeKelas('reguler'); setAbsensiUploadedUrl(''); setAbsensiPreviewUrl(''); }}
                style={styles.tipeKelasBtn(tipeKelas === 'reguler')}
              >
                🏫 Reguler (Tatap Muka)
              </button>
              <button
                type="button"
                onClick={() => { setTipeKelas('online'); setAbsensiUploadedUrl(''); setAbsensiPreviewUrl(''); }}
                style={styles.tipeKelasBtn(tipeKelas === 'online')}
              >
                💻 Online
              </button>
            </div>

            <p style={styles.absensiHint(isMobile)}>
              {tipeKelas === 'online'
                ? 'Kelas online tetap WAJIB ada bukti -- unggah screenshot sesi video call (Zoom/Meet/WA Video) yang menunjukkan wajah Anda dan waktu sesi. Ini juga berlaku untuk kelas online di hari libur/tanggal merah.'
                : 'Ambil foto langsung dari kamera sebagai bukti Anda hadir di lokasi mengajar hari ini.'}
            </p>

            {!absensiUploadedUrl ? (
              <label style={styles.uploadBox(isMobile, uploadingAbsensi)}>
                <input
                  type="file"
                  accept="image/*"
                  {...(tipeKelas === 'reguler' ? { capture: 'environment' } : {})}
                  onChange={handleAbsensiFileChange}
                  disabled={uploadingAbsensi}
                  style={{ display: 'none' }}
                />
                {uploadingAbsensi ? (
                  <>⏳ Mengunggah...</>
                ) : (
                  <>
                    {tipeKelas === 'reguler' ? <Camera size={18} /> : <Upload size={18} />}
                    {tipeKelas === 'reguler' ? ' Ambil Foto Kehadiran' : ' Unggah Screenshot Sesi Online'}
                  </>
                )}
              </label>
            ) : (
              <div style={styles.absensiSuccessBox(isMobile)}>
                {absensiPreviewUrl && (
                  <img src={absensiPreviewUrl} alt="Bukti kehadiran" style={styles.absensiThumb} />
                )}
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#10b981', fontWeight: 'bold', fontSize: isMobile ? 12 : 13 }}>
                    <CheckCircle size={16} /> Bukti kehadiran tersimpan
                  </div>
                  <button
                    type="button"
                    onClick={() => { setAbsensiUploadedUrl(''); setAbsensiPreviewUrl(''); }}
                    style={styles.btnGantiFoto}
                  >
                    Ganti foto
                  </button>
                </div>
              </div>
            )}

            {absensiError && <p style={styles.absensiErrorText}>{absensiError}</p>}
          </div>

          <div style={styles.gridContainer(isMobile)}>
          <div style={styles.card(isMobile)}>
            <h4 style={styles.cardTitle}><QrCode size={18} /> Scan Absensi</h4>
            <div style={styles.qrWrapper}>
              <QRCodeSVG 
                value={JSON.stringify({ 
                  type: "ABSENSI_BIMBEL", 
                  scheduleId: schedule.id, 
                  mapel: schedule.title || "Umum", 
                  teacher: teacher.nama, 
                  date: new Date().toISOString().split('T')[0],
                  level: schedule.level || "SD" // 🔥 Tambah level untuk validasi
                })} 
                size={isMobile ? 140 : 180} 
                style={{ width: '100%', height: 'auto', maxWidth: isMobile ? '140px' : '180px' }} 
              />
            </div>
            <p style={styles.qrHint(isMobile)}>Siswa silakan scan</p>
          </div>

          <div style={styles.card(isMobile)}>
            <h4 style={{...styles.cardTitle, color:'#3498db'}}>
              Siswa ({Object.values(attendanceMap).filter(v=>v).length}/{(schedule.students || []).length})
            </h4>
            <div style={styles.studentScrollArea}>
              {(schedule.students || []).map(siswa => {
                const isPresent = attendanceMap[siswa.id];
                return (
                  <div 
                    key={siswa.id} 
                    onClick={() => toggleStudent(siswa)} 
                    style={{ 
                      ...styles.studentItem(isMobile), 
                      background: isPresent ? '#27ae60' : '#f8fafc', 
                      color: isPresent ? 'white' : '#64748b', 
                      border: isPresent ? 'none' : '1px solid #e2e8f0' 
                    }}
                  >
                    <div style={styles.studentName(isMobile)}>{siswa.nama}</div>
                    <div style={styles.studentStatus}>{isPresent ? "HADIR" : "BELUM HADIR"}</div>
                  </div>
                );
              })}
            </div>
            <button
              onClick={() => setStep(2)}
              disabled={!absensiUploadedUrl}
              style={{
                ...styles.btnMain(isMobile),
                ...(absensiUploadedUrl ? {} : styles.btnDisabled),
              }}
              title={!absensiUploadedUrl ? 'Unggah bukti kehadiran dulu di atas' : undefined}
            >
              {absensiUploadedUrl ? 'Selesai & Buat Laporan ⮕' : '🔒 Unggah bukti kehadiran dulu'}
            </button>
          </div>
          </div>
        </div>
      )}

      {step === 2 && (
        <div style={styles.card(isMobile)}>
          <h4 style={styles.step2Title(isMobile)}>📝 Laporan Materi</h4>
          <textarea 
            rows={isMobile ? 4 : 5} 
            value={materiAktual} 
            onChange={(e) => setMateriAktual(e.target.value)} 
            placeholder="Tuliskan materi yang diajarkan hari ini..." 
            style={styles.textarea(isMobile)} 
          />

          {/* 🔥 BARU: lampiran materi (opsional) -- foto whiteboard,
              worksheet, dll. Dipakai admin buat tracking "tentor sudah
              upload materi hari ini". */}
          <div style={styles.lampiranBox(isMobile)}>
            {!materiFileUploadedUrl ? (
              <label style={styles.uploadBoxSecondary(isMobile, uploadingMateriFile)}>
                <input
                  type="file"
                  accept="image/*,.pdf"
                  onChange={handleMateriFileChange}
                  disabled={uploadingMateriFile}
                  style={{ display: 'none' }}
                />
                {uploadingMateriFile ? '⏳ Mengunggah lampiran...' : <><Paperclip size={16} /> Lampirkan foto materi/worksheet (opsional)</>}
              </label>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#10b981', fontWeight: 'bold', fontSize: isMobile ? 11 : 12 }}>
                <CheckCircle size={14} /> Lampiran materi tersimpan
                <button type="button" onClick={() => setMateriFileUploadedUrl('')} style={styles.btnGantiFoto}>Ganti</button>
              </div>
            )}
          </div>

          <div style={styles.footerBtns(isMobile)}>
            <button onClick={() => setStep(1)} style={styles.btnSecondary(isMobile)}>
              ⬅ Kembali
            </button>
            <button 
              onClick={handleFinalizeClass} 
              disabled={loading} 
              style={styles.btnSave(isMobile, loading)}
            >
              {loading ? "Menyimpan..." : "💾 Simpan Sesi"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// ============================================================
// STYLES
// ============================================================
const styles = {
  container: (m) => ({ 
    padding: m ? '10px' : '15px', 
    width: '100%', 
    boxSizing: 'border-box', 
    maxWidth: m ? '100%' : '1200px', 
    margin: '0 auto' 
  }),
  
  spinner: {
    width: 40,
    height: 40,
    border: '4px solid #e2e8f0',
    borderTop: '4px solid #652D90',
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
    margin: '0 auto 12px'
  },
  
  btnBack: (m) => ({ 
    background: 'none', 
    border: 'none', 
    color: '#7f8c8d', 
    cursor: 'pointer', 
    marginBottom: m ? 10 : 15, 
    display: 'flex', 
    alignItems: 'center', 
    gap: 5, 
    fontSize: m ? 12 : 14 
  }),
  
  headerCard: (m) => ({ 
    background: 'white', 
    padding: m ? '15px' : '20px', 
    borderRadius: m ? '12px' : '15px', 
    border: '1px solid #eee', 
    marginBottom: m ? '12px' : '20px' 
  }),
  
  headerFlex: { 
    display: 'flex', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    flexWrap: 'wrap', 
    gap: 10 
  },
  
  headerTitle: (m) => ({ 
    margin: 0, 
    fontSize: m ? '15px' : '18px', 
    color: '#2c3e50' 
  }),
  
  headerTime: (m) => ({ 
    margin: 0, 
    color: '#7f8c8d', 
    fontSize: m ? '11px' : '13px' 
  }),
  
  badge: (m) => ({ 
    background: '#ebf5fb', 
    color: '#3498db', 
    padding: m ? '4px 10px' : '5px 12px', 
    borderRadius: '20px', 
    fontSize: m ? '10px' : '11px', 
    fontWeight: 'bold' 
  }),
  
  gridContainer: (m) => ({ 
    display: 'flex', 
    flexWrap: 'wrap', 
    gap: m ? '12px' : '20px', 
    width: '100%', 
    flexDirection: m ? 'column' : 'row' 
  }),
  
  card: (m) => ({ 
    background: 'white', 
    padding: m ? '15px' : '20px', 
    borderRadius: m ? '12px' : '15px', 
    border: '1px solid #eee', 
    flex: m ? '1 1 100%' : '1 1 350px', 
    boxSizing: 'border-box', 
    display: 'flex', 
    flexDirection: 'column' 
  }),
  
  cardTitle: { 
    margin: '0 0 15px', 
    fontSize: 15, 
    display: 'flex', 
    alignItems: 'center', 
    gap: 8 
  },
  
  qrWrapper: { 
    textAlign: 'center', 
    padding: 15, 
    border: '1px dashed #ddd', 
    borderRadius: 10, 
    alignSelf: 'center' 
  },
  
  qrHint: (m) => ({ 
    fontSize: m ? 10 : 11, 
    color: '#7f8c8d', 
    marginTop: 10, 
    textAlign: 'center' 
  }),
  
  studentScrollArea: { 
    display: 'grid', 
    gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', 
    gap: 10, 
    marginBottom: 20, 
    maxHeight: '400px', 
    overflowY: 'auto' 
  },
  
  studentItem: (m) => ({ 
    padding: m ? '10px' : '12px', 
    borderRadius: '10px', 
    cursor: 'pointer', 
    textAlign: 'center', 
    transition: '0.2s' 
  }),
  
  studentName: (m) => ({ 
    fontWeight: 'bold', 
    fontSize: m ? '11px' : '13px' 
  }),
  
  studentStatus: { 
    fontSize: '10px', 
    opacity: 0.8 
  },
  
  step2Title: (m) => ({ 
    marginTop: 0, 
    color: '#e67e22', 
    fontSize: m ? '14px' : '16px' 
  }),
  
  textarea: (m) => ({ 
    width: '100%', 
    padding: '15px', 
    borderRadius: '10px', 
    border: '1px solid #ddd', 
    boxSizing: 'border-box', 
    fontSize: m ? 13 : 14, 
    marginBottom: 20, 
    outline: 'none', 
    resize: 'vertical' 
  }),
  
  footerBtns: (m) => ({ 
    display: 'flex', 
    gap: 10, 
    flexDirection: m ? 'column' : 'row' 
  }),
  
  btnMain: (m) => ({ 
    flex: 1, 
    padding: m ? '12px' : '14px', 
    background: '#3498db', 
    color: 'white', 
    border: 'none', 
    borderRadius: '10px', 
    fontWeight: 'bold', 
    cursor: 'pointer', 
    fontSize: m ? '12px' : '14px' 
  }),
  
  btnSecondary: (m) => ({ 
    padding: m ? '12px' : '14px 25px', 
    background: '#f1f5f9', 
    color: '#64748b', 
    border: 'none', 
    borderRadius: '10px', 
    fontWeight: 'bold', 
    cursor: 'pointer', 
    fontSize: m ? '12px' : '14px', 
    textAlign: 'center' 
  }),
  
  btnSave: (m, loading) => ({ 
    flex: 1, 
    padding: m ? '12px' : '14px', 
    background: loading ? '#bdc3c7' : '#2c3e50', 
    color: 'white', 
    border: 'none', 
    borderRadius: '10px', 
    fontWeight: 'bold', 
    cursor: loading ? 'not-allowed' : 'pointer', 
    fontSize: m ? '12px' : '14px' 
  }),

  // 🔥 BARU: styles buat tipe kelas + upload bukti kehadiran
  tipeKelasRow: (m) => ({
    display: 'flex',
    gap: 8,
    marginBottom: 12,
    flexDirection: m ? 'column' : 'row',
  }),

  tipeKelasBtn: (active) => ({
    flex: 1,
    padding: '10px 14px',
    borderRadius: 10,
    border: active ? '2px solid #3498db' : '1px solid #e2e8f0',
    background: active ? '#ebf5fb' : 'white',
    color: active ? '#3498db' : '#64748b',
    fontWeight: 'bold',
    fontSize: 13,
    cursor: 'pointer',
  }),

  absensiHint: (m) => ({
    fontSize: m ? 11 : 12,
    color: '#64748b',
    marginBottom: 12,
    lineHeight: 1.5,
  }),

  uploadBox: (m, loading) => ({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: m ? '14px' : '16px',
    borderRadius: 10,
    border: '2px dashed #3498db',
    color: '#3498db',
    fontWeight: 'bold',
    fontSize: m ? 12 : 13,
    cursor: loading ? 'not-allowed' : 'pointer',
    opacity: loading ? 0.6 : 1,
    background: '#f8fbff',
  }),

  uploadBoxSecondary: (m, loading) => ({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    padding: '10px',
    borderRadius: 8,
    border: '1px dashed #cbd5e1',
    color: '#64748b',
    fontWeight: 600,
    fontSize: m ? 11 : 12,
    cursor: loading ? 'not-allowed' : 'pointer',
    opacity: loading ? 0.6 : 1,
  }),

  absensiSuccessBox: (m) => ({
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    padding: 10,
    borderRadius: 10,
    border: '1px solid #bbf7d0',
    background: '#f0fdf4',
  }),

  absensiThumb: {
    width: 56,
    height: 56,
    objectFit: 'cover',
    borderRadius: 8,
    border: '1px solid #e2e8f0',
  },

  btnGantiFoto: {
    marginTop: 4,
    background: 'none',
    border: 'none',
    color: '#3498db',
    fontSize: 11,
    fontWeight: 'bold',
    cursor: 'pointer',
    textDecoration: 'underline',
    padding: 0,
  },

  absensiErrorText: {
    color: '#ef4444',
    fontSize: 12,
    marginTop: 8,
  },

  btnDisabled: {
    background: '#cbd5e1',
    color: '#64748b',
    cursor: 'not-allowed',
  },

  lampiranBox: (m) => ({
    marginBottom: 16,
  }),
};

export default ClassSession;