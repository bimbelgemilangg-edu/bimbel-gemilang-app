// src/pages/teacher/ClassSession.jsx
// Alur kelas hybrid: Step 1 Absensi (bukti guru + QR siswa) ->
// Step 2 Mengajar + Latihan Live (menanam LiveSessionTeacher, mesin live
// berbasis bab buku digital) -> Step 3 Laporan + honor + Google Form.
// TIDAK lagi memakai KelasLivePanel (dihapus) supaya mesin live cuma satu.
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db } from '../../firebase';
import {
  collection, addDoc, doc, getDoc, setDoc, serverTimestamp,
  onSnapshot, query, where, updateDoc,
} from 'firebase/firestore';
import { QRCodeSVG } from 'qrcode.react';
import { QrCode, ArrowLeft, Camera, CheckCircle, Paperclip } from 'lucide-react';
import KameraBelakang from '../../components/KameraBelakang';
import { STATUS_ABSENSI, kebijakanUntukStatus, statusDariDokumenAbsensi, keteranganKebijakan } from '../../utils/kebijakanAbsensi';
import { keteranganAbsensi } from '../../utils/identitasAbsensi';
import { terapkanIzinAbsensiOtomatis } from '../../services/izinAbsensiOtomatis';
import { uploadElearningFile } from '../../services/uploadService';
import LiveSessionTeacher from './LiveSessionTeacher';

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
  const [googleForms, setGoogleForms] = useState({ sd: '', smp: '', sma: '', english: '', default: '' });

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
        const fd = await getDoc(doc(db, 'settings', 'google_forms'));
        if (fd.exists()) setGoogleForms(fd.data());
        setLoading(false);
      } catch { alert('❌ Gagal memuat data kelas'); navigate('/guru/dashboard'); }
    };
    if (id) fetchData();
  }, [id, navigate]);

  useEffect(() => {
    if (!schedule?.id) return;
    const today = new Date().toISOString().split('T')[0];
    const q = query(collection(db, 'attendance'), where('date', '==', today), where('scheduleId', '==', schedule.id));
    const un = onSnapshot(q, (snap) => {
      const m = { ...attendanceMap };
      snap.docs.forEach((d) => {
        const data = d.data();
        if (schedule.students && schedule.students.some((s) => s.id === data.studentId)) m[data.studentId] = statusDariDokumenAbsensi(data);
      });
      setAttendanceMap(m);
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
    const today = new Date().toISOString().split('T')[0];
    try {
      await setDoc(doc(db, 'attendance', student.id + '_' + today + '_' + schedule.id), {
        studentId: student.id, studentName: student.nama,
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
    if (!materiAktual) return alert('Mohon isi materi yang diajarkan!');
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
      const today = new Date().toISOString().split('T')[0];
      await Promise.all((schedule.students || []).map(async (s) => {
        const present = (attendanceMap[s.id] || 'Alpha') === 'Hadir';
        return setDoc(doc(db, 'attendance', s.id + '_' + today + '_' + schedule.id), {
          studentId: s.id, studentName: s.nama,
          program: s.program || schedule.program || 'Reguler',
          kelasSekolah: s.kelas || s.kelasSekolah || '-',
          teacherId: teacher.id, teacherName: teacher.nama,
          date: today, tanggal: today, timestamp: serverTimestamp(),
          status: STATUS_ABSENSI.includes(attendanceMap[s.id]) ? attendanceMap[s.id] : 'Alpha',
          keterangan: (STATUS_ABSENSI.includes(attendanceMap[s.id]) && attendanceMap[s.id] !== 'Hadir') ? keteranganAbsensi('', attendanceMap[s.id]) : (present ? 'Sesi Selesai' : 'Siswa tidak hadir (Otomatis Alpha)'),
          mapel: schedule.title || 'Umum', scheduleId: schedule.id || '', planet: schedule.planet || 'Ruang Umum',
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
        nominal: honor.nominal, status: honor.statusGaji, createdAt: serverTimestamp(),
        tipeKelas, kelasNama,
        daftarSiswaHadir: hadirList.map((s) => ({ id: s.id, nama: s.nama, kelas: s.kelas || s.kelasSekolah || '-' })),
        fotoAbsensiUrl: absensiUploadedUrl, materiFileUrl: materiFileUploadedUrl || null,
      });
      await updateDoc(doc(db, 'jadwal_bimbel', schedule.id), { status: 'completed', completedAt: serverTimestamp(), completedEarly: !isPast });
      const link = googleForms[(schedule.level || 'sd').toLowerCase()] || googleForms.default || '';
      alert('✅ Kelas Berhasil Disimpan!\n\n📚 Materi: ' + materiAktual + '\n👥 Kehadiran: ' + hadirList.length + '/' + (schedule.students || []).length + (link ? '\n\n📋 Klik OK untuk membuka Google Form laporan materi' : ''));
      if (link) window.open(link, '_blank');
      navigate('/guru/dashboard');
    } catch (e) { alert('Gagal menyimpan sesi: ' + e.message); }
    finally { setLoading(false); }
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
          <span style={st.badge(isMobile)}>{schedule.planet || 'Ruang Umum'}</span>
        </div>
      </div>

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
                  <QRCodeSVG value={JSON.stringify({ type: 'ABSENSI_BIMBEL', scheduleId: schedule.id, mapel: schedule.title || 'Umum', teacher: teacher.nama, date: new Date().toISOString().split('T')[0], level: schedule.level || 'SD' })} size={isMobile ? 140 : 180} style={{ width: '100%', height: 'auto', maxWidth: isMobile ? 140 : 180 }} />
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
          <h4 style={st.step2Title(isMobile)}>📝 Laporan Materi</h4>
          <textarea rows={isMobile ? 4 : 5} value={materiAktual} onChange={(e) => setMateriAktual(e.target.value)} placeholder="Tuliskan materi yang diajarkan hari ini..." style={st.textarea(isMobile)} />
          <div style={st.lampiranBox(isMobile)}>
            {!materiFileUploadedUrl ? (
              <label style={st.uploadBoxSecondary(isMobile, uploadingMateriFile)}><input type="file" accept="image/*,.pdf" onChange={handleMateriFileChange} disabled={uploadingMateriFile} style={{ display: 'none' }} />{uploadingMateriFile ? '⏳ Mengunggah lampiran...' : <><Paperclip size={16} /> Lampirkan foto materi/worksheet (opsional)</>}</label>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#10b981', fontWeight: 'bold', fontSize: 11 }}><CheckCircle size={14} /> Lampiran materi tersimpan
                <button type="button" onClick={() => setMateriFileUploadedUrl('')} style={st.btnGantiFoto}>Ganti</button>
              </div>
            )}
          </div>
          <div style={st.footerBtns(isMobile)}>
            <button onClick={() => setStep(2)} style={st.btnSecondary(isMobile)}>⬅ Kembali</button>
            <button onClick={handleFinalizeClass} disabled={loading} style={st.btnSave(isMobile, loading)}>{loading ? 'Menyimpan...' : '💾 Simpan Sesi'}</button>
          </div>
        </div>
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