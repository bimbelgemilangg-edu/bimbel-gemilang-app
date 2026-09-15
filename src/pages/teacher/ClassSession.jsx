// src/pages/teacher/ClassSession.jsx
// Step 1: Absensi (bukti guru + QR/toggle siswa) -- TETAP seperti semula.
// Step 2: Kelas & Soal Live (KelasLivePanel) -- BARU, terhubung buku digital.
// Step 3: Laporan materi + honor + Google Form -- TETAP seperti semula.
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db } from '../../firebase';
import { collection, addDoc, doc, getDoc, setDoc, serverTimestamp, onSnapshot, query, where, updateDoc } from 'firebase/firestore';
import { QRCodeSVG } from 'qrcode.react';
import { QrCode, ArrowLeft, Camera, Upload, CheckCircle, Paperclip } from 'lucide-react';
import { uploadElearningFile } from '../../services/uploadService';
import KelasLivePanel from './KelasLivePanel';

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
      } catch (e) { alert('❌ Gagal memuat data kelas'); navigate('/guru/dashboard'); }
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
        if (schedule.students && schedule.students.some((s) => s.id === data.studentId)) m[data.studentId] = (data.status === 'Hadir');
      });
      setAttendanceMap(m);
    });
    return () => un();
  }, [schedule]);

  const handleAbsensiFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAbsensiError(''); setUploadingAbsensi(true);
    const prev = URL.createObjectURL(file);
    setAbsensiPreviewUrl(prev);
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

  const toggleStudent = async (student) => {
    if (!schedule || !teacher) return;
    const cur = !!attendanceMap[student.id];
    const next = !cur;
    setAttendanceMap((p) => ({ ...p, [student.id]: next }));
    const today = new Date().toISOString().split('T')[0];
    try {
      await setDoc(doc(db, 'attendance', student.id + '_' + today + '_' + schedule.id), {
        studentId: student.id, studentName: student.nama,
        program: student.program || schedule.program || 'Reguler',
        kelasSekolah: student.kelas || student.kelasSekolah || '-',
        teacherId: teacher.id, teacherName: teacher.nama,
        date: today, tanggal: today, timestamp: serverTimestamp(),
        status: next ? 'Hadir' : 'Alpha',
        keterangan: next ? 'Input Manual Guru' : 'Siswa tidak hadir',
        mapel: schedule.title || 'Umum', scheduleId: schedule.id || '', planet: schedule.planet || 'Ruang Umum',
      }, { merge: true });
    } catch (e) { setAttendanceMap((p) => ({ ...p, [student.id]: cur })); }
  };

  const hitungHonor = () => {
    if (!salaryRules) return { nominal: 0, detailTxt: ' ', statusGaji: 'Menunggu Validasi' };
    const hadir = (schedule.students || []).filter((s) => attendanceMap[s.id]);
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
    if (!window.confirm('Yakin akhiri kelas? Siswa tidak hadir dicatat Alpha.')) return;
    setLoading(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      await Promise.all((schedule.students || []).map(async (s) => {
        const present = !!attendanceMap[s.id];
        return setDoc(doc(db, 'attendance', s.id + '_' + today + '_' + schedule.id), {
          studentId: s.id, studentName: s.nama,
          program: s.program || schedule.program || 'Reguler',
          kelasSekolah: s.kelas || s.kelasSekolah || '-',
          teacherId: teacher.id, teacherName: teacher.nama,
          date: today, tanggal: today, timestamp: serverTimestamp(),
          status: present ? 'Hadir' : 'Alpha',
          keterangan: present ? 'Sesi Selesai' : 'Siswa tidak hadir (Otomatis Alpha)',
          mapel: schedule.title || 'Umum', scheduleId: schedule.id || '', planet: schedule.planet || 'Ruang Umum',
        }, { merge: true });
      }));
      const honor = hitungHonor();
      const hadirList = (schedule.students || []).filter((s) => attendanceMap[s.id]);
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
            <button type="button" onClick={() => setStep1Tab('absensiSiswa')} style={st.step1TabBtn(step1Tab === 'absensiSiswa')}>📋 Absensi Siswa</button>
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
                  <label style={st.uploadBox(isMobile, uploadingAbsensi)}><input type="file" accept="image/*" capture="environment" onChange={handleAbsensiFileChange} disabled={uploadingAbsensi} style={{ display: 'none' }} /><Camera size={18} /> Kamera Belakang</label>
                  <label style={st.uploadBox(isMobile, uploadingAbsensi)}><input type="file" accept="image/*" capture="user" onChange={handleAbsensiFileChange} disabled={uploadingAbsensi} style={{ display: 'none' }} /><Camera size={18} /> Kamera Depan</label>
                  <label style={st.uploadBoxImport(isMobile, uploadingAbsensi)}><input type="file" accept="image/*" onChange={handleAbsensiFileChange} disabled={uploadingAbsensi} style={{ display: 'none' }} /><Upload size={18} /> {uploadingAbsensi ? 'Mengunggah...' : 'Import dari Galeri'}</label>
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
                <h4 style={{ ...st.cardTitle, color: '#3498db' }}>Siswa ({Object.values(attendanceMap).filter((v) => v).length}/{(schedule.students || []).length})</h4>
                <div style={st.studentScrollArea}>
                  {(schedule.students || []).map((s) => {
                    const p = attendanceMap[s.id];
                    return (
                      <div key={s.id} onClick={() => toggleStudent(s)} style={{ ...st.studentItem(isMobile), background: p ? '#27ae60' : '#f8fafc', color: p ? 'white' : '#64748b', border: p ? 'none' : '1px solid #e2e8f0' }}>
                        <div style={st.studentName(isMobile)}>{s.nama}</div>
                        <div style={st.studentStatus}>{p ? 'HADIR' : 'BELUM HADIR'}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
          <button onClick={() => setStep(2)} disabled={!absensiUploadedUrl} style={{ ...st.btnMain(isMobile), ...(absensiUploadedUrl ? {} : st.btnDisabled), marginTop: 12 }}>
            {absensiUploadedUrl ? 'Selesai & Masuk Kelas Live ⮕' : '🔒 Unggah bukti kehadiran dulu'}
          </button>
        </div>
      )}

      {step === 2 && (
        <div>
          <KelasLivePanel schedule={schedule} teacher={teacher} onSelesai={() => setStep(3)} />
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
  step1TabRow: (m) => ({ display: 'flex', gap: 8, marginBottom: 12 }),
  step1TabBtn: (a) => ({ flex: 1, padding: '10px 14px', borderRadius: 10, border: a ? '2px solid #2c3e50' : '1px solid #e2e8f0', background: a ? '#2c3e50' : 'white', color: a ? 'white' : '#64748b', fontWeight: 'bold', fontSize: 13, cursor: 'pointer', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }),
  tabDot: { width: 7, height: 7, borderRadius: '50%', background: '#ef4444' },
  tabSafeNote: (m) => ({ fontSize: m ? 10 : 11, color: '#10b981', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 8, padding: '6px 10px', marginBottom: 12 }),
  tipeKelasRow: (m) => ({ display: 'flex', gap: 8, marginBottom: 12, flexDirection: m ? 'column' : 'row' }),
  tipeKelasBtn: (a) => ({ flex: 1, padding: '10px 14px', borderRadius: 10, border: a ? '2px solid #3498db' : '1px solid #e2e8f0', background: a ? '#ebf5fb' : 'white', color: a ? '#3498db' : '#64748b', fontWeight: 'bold', fontSize: 13, cursor: 'pointer' }),
  absensiHint: (m) => ({ fontSize: m ? 11 : 12, color: '#64748b', marginBottom: 12, lineHeight: 1.5 }),
  uploadBox: (m, l) => ({ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: m ? 14 : 16, borderRadius: 10, border: '2px dashed #3498db', color: '#3498db', fontWeight: 'bold', fontSize: m ? 12 : 13, cursor: l ? 'not-allowed' : 'pointer', opacity: l ? 0.6 : 1, background: '#f8fbff', flex: 1 }),
  uploadBoxSecondary: (m, l) => ({ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: 10, borderRadius: 8, border: '1px dashed #cbd5e1', color: '#64748b', fontWeight: 600, fontSize: m ? 11 : 12, cursor: l ? 'not-allowed' : 'pointer', opacity: l ? 0.6 : 1 }),
  absensiSuccessBox: (m) => ({ display: 'flex', alignItems: 'center', gap: 12, padding: 10, borderRadius: 10, border: '1px solid #bbf7d0', background: '#f0fdf4' }),
  absensiThumb: { width: 56, height: 56, objectFit: 'cover', borderRadius: 8, border: '1px solid #e2e8f0' },
  btnGantiFoto: { marginTop: 4, background: 'none', border: 'none', color: '#3498db', fontSize: 11, fontWeight: 'bold', cursor: 'pointer', textDecoration: 'underline', padding: 0 },
  absensiErrorText: { color: '#ef4444', fontSize: 12, marginTop: 8 },
  btnDisabled: { background: '#cbd5e1', color: '#64748b', cursor: 'not-allowed' },
  lampiranBox: (m) => ({ marginBottom: 16 }),
};
export default ClassSession;