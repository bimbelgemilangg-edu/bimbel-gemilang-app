// src/pages/teacher/TeacherAttendance.jsx
import React, { useState, useEffect } from 'react';
import { kebijakanUntukStatus } from '../../utils/kebijakanAbsensi';
import { terapkanIzinAbsensiOtomatis } from '../../services/izinAbsensiOtomatis';
import { db } from '../../firebase';
import { keteranganAbsensi, kunciDokumenAbsensi } from '../../utils/identitasAbsensi';
import { identitasPencariJadwal, jadwalMilikGuru } from '../../utils/identitasJadwal';
import { tanggalLokalStr } from '../../utils/waktuLokal';
import { 
  daftarBabSilabus, 
  semesterKalenderAktif, 
  normalisasiKodeMapel 
} from '../../utils/silabusKurikulumMerdeka';
import { 
  collection, query, where, getDocs, doc, getDoc,
  onSnapshot, serverTimestamp, setDoc
} from "firebase/firestore";
import { 
  Calendar, Clock, MapPin, Users, BookOpen, 
  CheckCircle, XCircle, AlertCircle, Search,
  User, FileText, ChevronLeft, ChevronRight,
  Sparkles, Bookmark, RotateCcw, Edit3
} from 'lucide-react';

const TeacherAttendance = () => {
  
  // Data guru
  // 19 Okt: lazy initializer mengganti useEffect+setGuru (aturan
  // react-hooks/set-state-in-effect) - perilaku sama, render sekali.
  const [guru] = useState(() => {
    try {
      const stored = localStorage.getItem('teacherData');
      return stored ? JSON.parse(stored) : null;
    } catch (e) {
      console.error('Error parsing teacher data:', e);
      return null;
    }
  });
  const [loading, setLoading] = useState(true);
  const [schedules, setSchedules] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [attendanceLogs, setAttendanceLogs] = useState({});
  const [todayCode, setTodayCode] = useState("");
  
  // Modal
  const [showModal, setShowModal] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState(null);
  const [attendanceList, setAttendanceList] = useState([]);
  const [sessionMateri, setSessionMateri] = useState("");
  const [saving, setSaving] = useState(false);

  // Silabus Kurikulum Merdeka & Status Ketuntasan Sesi
  const [daftarBab, setDaftarBab] = useState([]);
  const [selectedBabId, setSelectedBabId] = useState("");
  const [selectedSubBab, setSelectedSubBab] = useState("");
  const [statusKetuntasan, setStatusKetuntasan] = useState("berjalan"); // 'berjalan' (lanjut sesi depan) | 'tuntas'
  const [isManualInput, setIsManualInput] = useState(false);

  const fetchDailyCode = async (dateStr) => {
    try {
      const docRef = doc(db, "settings", `daily_code_${dateStr}`);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setTodayCode(docSnap.data().code || "");
      } else {
        setTodayCode("");
      }
    } catch (e) {
      console.error("Error fetching daily code:", e);
    }
  };

  // 🔥 FIX BUG BESAR: sebelumnya fungsi ini baca dari field `attendance_list`
  // DI DALAM dokumen jadwal_bimbel -- tempat yang TIDAK PERNAH dibaca oleh
  // halaman lain manapun (bukan dashboard siswa, bukan halaman absensi siswa,
  // bukan admin). Padahal ClassSession.jsx (yang "Mulai Kelas", jalur yang
  // BENERAN dipakai guru) menulis ke collection "attendance" yang TERPISAH.
  // Akibatnya: dua sistem absensi berjalan sendiri-sendiri tanpa saling
  // kenal. Sekarang halaman ini disatukan -- baca dari collection
  // "attendance" yang sama, difilter berdasarkan scheduleId & tanggal.
  const loadAttendance = async (scheduleId, dateStr) => {
    try {
      const q = query(
        collection(db, "attendance"),
        where("scheduleId", "==", scheduleId),
        where("date", "==", dateStr)
      );
      const snap = await getDocs(q);
      const data = snap.docs.map(d => ({
        studentId: d.data().studentId,
        nama: d.data().studentName,
        status: d.data().status,
        checkInTime: d.data().timestamp?.toDate?.()?.toLocaleTimeString?.() || null,
        note: d.data().keterangan || '',
      }));
      setAttendanceLogs(prev => ({ ...prev, [scheduleId]: data }));
    } catch (e) {
      console.error("Error loading attendance:", e);
    }
  };

  // Tanggal bisnis = tanggal LOKAL perangkat, dari satu util (utils/waktuLokal).
  // Salinan fungsi ini dulu ditulis ulang di lima berkas berbeda — selama masih
  // identik hasilnya tidak terlihat, begitu salah satunya memakai UTC (kasus
  // 00:00-06:59 WIB, v1.6.3/v1.6.4) jadwal guru terbelah dua hari.
  const getDateStr = (dateObj) => tanggalLokalStr(dateObj);



  // ===== JADWAL TANGGAL TERPILIH: SATU kueri, identitas bersama =====
  // Tiga perbaikan sekaligus (register bug B-13, B-16; keputusan owner D5):
  //   1. Dulu halaman ini mencari `teacherId` lebih dulu lalu — hanya bila kosong
  //      — memasang kueri KEDUA berdasarkan nama, sedangkan dasbor guru mencari
  //      nama saja. Satu spasi/typo/nama yang pernah diperbaiki admin membuat
  //      kelas muncul di satu halaman dan hilang di halaman lain. Sekarang kedua
  //      halaman memakai aturan yang sama dari utils/identitasJadwal: ID menang
  //      bila ada; nama hanya untuk data warisan tanpa teacherId.
  //   2. Tidak ada lagi kueri beruntun (ID → nama) yang membuat loading terasa
  //      "nyasar": satu kueri tanggal (indeks tunggal, tanpa orderBy) lalu
  //      pencocokan identitas di klien — nol putaran jaringan tambahan.
  //   3. Kebocoran langganan ditutup: `return () => unsubFallback()` di dalam
  //      callback onSnapshot tidak pernah dipakai React, sehingga langganan
  //      cadangan hidup terus dan menumpuk tiap ganti tanggal.
  useEffect(() => {
    const identitas = identitasPencariJadwal(guru);
    if (!identitas.ids.length && !identitas.nama) {
      queueMicrotask(() => setLoading(false)); // hindari setState sinkron di badan effect
      return undefined;
    }

    const dateStr = getDateStr(selectedDate);
    const q = query(collection(db, "jadwal_bimbel"), where("dateStr", "==", dateStr));

    const unsubscribe = onSnapshot(q, (snap) => {
      const data = snap.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .filter(j => jadwalMilikGuru(j, identitas));
      setSchedules(data);
      data.forEach(s => loadAttendance(s.id, dateStr));
      setLoading(false);
    }, (error) => {
      console.error("Error fetching schedules:", error);
      setLoading(false);
    });

    // 19 Okt: microtask agar tidak setState sinkron di badan effect
    // (aturan react-hooks/set-state-in-effect); perilaku tetap sama.
    queueMicrotask(() => fetchDailyCode(dateStr));

    return unsubscribe;
  }, [guru, selectedDate]);

  const handleOpenAttendance = (schedule) => {
    setSelectedSchedule(schedule);
    const students = schedule.students || [];
    const attendance = attendanceLogs[schedule.id] || [];
    
    // Deteksi kelas & mapel dari data jadwal untuk silabus Kurikulum Merdeka
    const kelasTarget = schedule.kelas || students[0]?.kelas || students[0]?.kelasSekolah || '7';
    const mapelTarget = schedule.title || schedule.mapelName || 'mtk';
    const listBab = daftarBabSilabus({ kelas: kelasTarget, mapel: mapelTarget });
    setDaftarBab(listBab);

    // Temukan materi & status hari ini bila sudah ada yang mencatat sebelumnya
    const existingLog = attendance.find(a => a.materiHariIni);
    const existingMateri = existingLog?.materiHariIni || schedule.title || schedule.mapelName || '';
    const existingKetuntasan = existingLog?.statusKetuntasanMateri || 'berjalan';
    const existingBabId = existingLog?.babId || '';
    const existingSubBab = existingLog?.subBab || '';

    setStatusKetuntasan(existingKetuntasan);

    if (existingBabId && listBab.some(b => b.id === existingBabId)) {
      setSelectedBabId(existingBabId);
      setSelectedSubBab(existingSubBab);
      setSessionMateri(existingMateri);
      setIsManualInput(false);
    } else if (listBab.length > 0) {
      const babAwal = listBab[0];
      setSelectedBabId(babAwal.id);
      const subAwal = babAwal.subBab?.[0] || '';
      setSelectedSubBab(subAwal);
      setSessionMateri(existingMateri || `${babAwal.judul} — ${subAwal}`);
      setIsManualInput(false);
    } else {
      setSelectedBabId('');
      setSelectedSubBab('');
      setSessionMateri(existingMateri);
      setIsManualInput(true);
    }

    // Merge student data with attendance status & pemahaman track record
    const merged = students.map(student => {
      const existing = attendance.find(a => 
        a.studentId === student.studentId || a.studentId === student.id
      );
      return {
        ...student,
        status: existing?.status || 'Belum',
        checkInTime: existing?.checkInTime || null,
        note: existing?.note || existing?.catatanHarian || '',
        tingkatPemahaman: existing?.tingkatPemahaman || 'mandiri',
      };
    });
    
    setAttendanceList(merged);
    setShowModal(true);
  };

  const handlePilihBab = (babId) => {
    setSelectedBabId(babId);
    const b = daftarBab.find(x => x.id === babId);
    if (b) {
      const sub = b.subBab?.[0] || '';
      setSelectedSubBab(sub);
      setSessionMateri(`${b.judul} — ${sub}`);
    }
  };

  const handlePilihSubBab = (sub) => {
    setSelectedSubBab(sub);
    const b = daftarBab.find(x => x.id === selectedBabId);
    const judulBab = b ? b.judul : 'Bab Materi';
    setSessionMateri(`${judulBab} — ${sub}`);
  };

  const handleUpdateAttendance = async (studentId, status) => {
    if (!selectedSchedule) return;
    
    // Update local state
    const updated = attendanceList.map(s => {
      if (s.studentId === studentId || s.id === studentId) {
        return {
          ...s,
          status: status,
          checkInTime: status === 'Hadir' ? new Date().toLocaleTimeString() : null,
          tingkatPemahaman: s.tingkatPemahaman || 'mandiri',
        };
      }
      return s;
    });
    setAttendanceList(updated);
  };

  const handleUpdatePemahaman = (studentId, tingkat) => {
    setAttendanceList(attendanceList.map((s) => (
      (s.studentId === studentId || s.id === studentId) ? { ...s, tingkatPemahaman: tingkat } : s
    )));
  };

  const handleUpdateNote = (studentId, note) => {
    setAttendanceList(attendanceList.map((s) => (
      (s.studentId === studentId || s.id === studentId) ? { ...s, note } : s
    )));
  };

  // 🔥 FIX BUG BESAR: sebelumnya nulis ke field attendance_list di dalam
  // jadwal_bimbel (terpisah dari sistem yang beneran dipakai). Sekarang
  // nulis ke collection "attendance" yang sama, pakai skema ID dokumen &
  // struktur field yang PERSIS SAMA dengan ClassSession.jsx (ID dokumen
  // deterministik: studentId + tanggal + scheduleId), supaya kalau siswa
  // sudah lebih dulu absen sendiri lewat scan QR, catatan ini nge-UPDATE
  // data yang sama (bukan bikin data duplikat/konflik).
  const handleSaveAttendance = async () => {
    if (!selectedSchedule) return;
    setSaving(true);
    try {
      const dateStr = getDateStr(selectedDate);
      const teacherId = guru?.guruId || guru?.id;

      const toSave = attendanceList.filter(s => s.status !== 'Belum');

      await Promise.all(toSave.map(s => {
        const studentDocId = s.id || s.studentId;

        const absenId = kunciDokumenAbsensi(studentDocId, dateStr, selectedSchedule.id);
        return setDoc(doc(db, "attendance", absenId), {
          studentId: studentDocId,
          studentName: s.nama || 'Siswa',
          program: s.program || selectedSchedule.program || 'Reguler',
          kelasSekolah: s.kelas || s.kelasSekolah || '-',
          teacherId: teacherId || '',
          teacherName: guru?.nama || '',
          date: dateStr,
          tanggal: dateStr,
          timestamp: serverTimestamp(),
          status: s.status,
          keterangan: keteranganAbsensi(s.note, s.status),
          mapel: selectedSchedule.title || selectedSchedule.mapelName || 'Umum',
          scheduleId: selectedSchedule.id || '',
          planet: selectedSchedule.planet || 'Ruang Umum',
          materiHariIni: sessionMateri || selectedSchedule.title || '',
          statusKetuntasanMateri: statusKetuntasan,
          babId: selectedBabId || null,
          subBab: selectedSubBab || null,
          tingkatPemahaman: s.status === 'Hadir' ? (s.tingkatPemahaman || 'mandiri') : null,
          catatanHarian: s.note || '',
        }, { merge: true });
      }));
      // 🔥 2026-10-26 (keputusan owner): absensi Izin/Sakit yang disimpan
      // tentor OTOMATIS membukakan akses susulan try out tertutup lewat
      // tryout_izin_ulang; admin melihat keterangan & sumber yang sama.
      const perluIzin = toSave.filter((x) => kebijakanUntukStatus(x.status).beriIzinUlang);
      const ringkasan = [];
      for (const x of perluIzin) {
        try {
          const dibukakan = await terapkanIzinAbsensiOtomatis({
            siswa: { ...x, studentId: x.studentId || x.id },
            status: x.status,
            tanggalStr: getDateStr(selectedDate),
            keterangan: keteranganAbsensi(x.note, x.status),
            diberikanOleh: `tentor: ${guru?.nama || guru?.id || ''}`,
          });
          if (dibukakan.length) ringkasan.push(`${x.nama}: ${dibukakan.length} try out`);
        } catch (eIzin) {
          console.warn('Gagal memberi izin susulan otomatis:', eIzin);
        }
      }

      // Refresh tampilan dari collection attendance (sumber kebenaran yang sama)
      await loadAttendance(selectedSchedule.id, dateStr);

      alert("✅ Absensi berhasil disimpan!" + (ringkasan.length ? `\n\n🔓 Akses susulan otomatis (izin/sakit) dibukakan untuk:\n- ${ringkasan.join('\n- ')}\nBerlaku 7 hari. Admin melihat sumber izin ini di Hasil & Ranking Try Out.` : ""));
      setShowModal(false);
    } catch (e) {
      console.error("Error saving attendance:", e);
      alert("❌ Gagal menyimpan absensi: " + e.message);
    }
    setSaving(false);
  };

  const handleDateChange = (days) => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + days);
    setLoading(true);
    setSelectedDate(newDate);
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'Hadir': return '#22c55e';
      case 'Sakit': return '#f59e0b';
      case 'Izin': return '#3b82f6';
      case 'Alpha': return '#ef4444';
      default: return '#94a3b8';
    }
  };


  // Tampilan Loading
  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.spinner}></div>
        <p>Memuat jadwal...</p>
      </div>
    );
  }

  // Tampilan Utama
  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <div>
          <h2 style={styles.title}>
            <Users size={24} color="#3b82f6" /> Absensi Siswa
          </h2>
          <p style={styles.subtitle}>
            Kelola kehadiran siswa untuk jadwal mengajar Anda
          </p>
        </div>
        {todayCode && (
          <div style={styles.codeBox}>
            <span style={styles.codeLabel}>📋 Kode Absensi:</span>
            <span style={styles.codeValue}>{todayCode}</span>
          </div>
        )}
      </div>

      {/* Date Navigator */}
      <div style={styles.dateNav}>
        <button 
          onClick={() => handleDateChange(-1)} 
          style={styles.dateNavBtn}
        >
          <ChevronLeft size={18} />
        </button>
        <div style={styles.dateDisplay}>
          <span style={styles.dateDay}>
            {selectedDate.toLocaleDateString('id-ID', { weekday: 'long' })}
          </span>
          <span style={styles.dateFull}>
            {selectedDate.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
          </span>
        </div>
        <button 
          onClick={() => handleDateChange(1)} 
          style={styles.dateNavBtn}
        >
          <ChevronRight size={18} />
        </button>
        <button 
          onClick={() => setSelectedDate(new Date())} 
          style={styles.todayBtn}
        >
          Hari Ini
        </button>
      </div>

      {/* Schedule List */}
      {schedules.length === 0 ? (
        <div style={styles.emptyState}>
          <Calendar size={48} color="#cbd5e1" />
          <h3>Tidak ada jadwal</h3>
          <p>Tidak ada jadwal mengajar pada tanggal ini</p>
        </div>
      ) : (
        <div style={styles.scheduleList}>
          {schedules.map((schedule) => {
            const attendance = attendanceLogs[schedule.id] || [];
            const totalStudents = schedule.students?.length || 0;
            const present = attendance.filter(a => a.status === 'Hadir').length;
            
            return (
              <div key={schedule.id} style={styles.scheduleCard}>
                <div style={styles.scheduleHeader}>
                  <div style={styles.scheduleInfo}>
                    <span style={styles.scheduleTime}>
                      <Clock size={14} /> {schedule.start} - {schedule.end}
                    </span>
                    <span style={styles.schedulePlanet}>
                      <MapPin size={14} /> {schedule.planet || 'Ruang'}
                    </span>
                  </div>
                  <span style={styles.scheduleProgram(schedule.program)}>
                    {schedule.program || 'Reguler'}
                  </span>
                </div>

                <div style={styles.scheduleBody}>
                  <h4 style={styles.scheduleTitle}>
                    {schedule.title || schedule.mapelName || 'Materi Umum'}
                  </h4>
                  <div style={styles.scheduleMeta}>
                    <span>📚 {schedule.level || 'SD'}</span>
                    <span>👨‍🏫 {schedule.teacherName || schedule.booker}</span>
                  </div>
                </div>

                <div style={styles.scheduleFooter}>
                  <div style={styles.attendanceStats}>
                    <span style={styles.statItem}>
                      <Users size={14} /> {totalStudents} siswa
                    </span>
                    <span style={styles.statItem}>
                      <CheckCircle size={14} color="#22c55e" /> {present} hadir
                    </span>
                    <span style={styles.statItem}>
                      <Clock size={14} color="#94a3b8" /> {totalStudents - present} belum
                    </span>
                  </div>
                  <button 
                    onClick={() => handleOpenAttendance(schedule)} 
                    style={styles.absensiBtn}
                  >
                    <CheckCircle size={16} /> Absensi
                  </button>
                </div>

                {/* Preview attendance status */}
                {attendance.length > 0 && (
                  <div style={styles.attendancePreview}>
                    {attendance.slice(0, 5).map((a, i) => (
                      <span key={i} style={{...styles.attendanceChip, background: getStatusColor(a.status)}}>
                        {a.nama?.split(' ')[0]}
                      </span>
                    ))}
                    {attendance.length > 5 && (
                      <span style={styles.attendanceMore}>+{attendance.length - 5}</span>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Absensi */}
      {showModal && selectedSchedule && (
        <div style={styles.modalOverlay} onClick={() => setShowModal(false)}>
          <div style={styles.modal} onClick={e => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <div style={{ flex: 1, marginRight: 10 }}>
                <h3 style={styles.modalTitle}>📋 Absensi &amp; Pemantauan Harian Siswa</h3>
                <p style={styles.modalSubtitle}>
                  {selectedSchedule.title || selectedSchedule.mapelName || 'Materi'} - 
                  {selectedSchedule.start} {selectedSchedule.end}
                </p>
                <div style={{ marginTop: 10, background: '#f8fafc', padding: '10px 14px', borderRadius: 12, border: '1px solid #e2e8f0' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8, flexWrap: 'wrap', gap: 6 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: '#334155', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Bookmark size={15} color="#4f46e5" />
                      <span>Silabus &amp; Topik Kurikulum Merdeka</span>
                    </div>
                    {daftarBab.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setIsManualInput(!isManualInput)}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#4f46e5',
                          fontSize: 11,
                          fontWeight: 600,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 4,
                        }}
                      >
                        {isManualInput ? <BookOpen size={13} /> : <Edit3 size={13} />}
                        {isManualInput ? 'Pilih dari Silabus' : 'Tulis Bebas / Topik Khusus'}
                      </button>
                    )}
                  </div>

                  {!isManualInput && daftarBab.length > 0 ? (
                    <div>
                      {/* Dropdown Bab */}
                      <div style={{ marginBottom: 6 }}>
                        <select
                          value={selectedBabId}
                          onChange={(e) => handlePilihBab(e.target.value)}
                          style={{
                            width: '100%',
                            padding: '8px 10px',
                            borderRadius: 8,
                            border: '1.5px solid #cbd5e1',
                            fontSize: 12,
                            fontWeight: 600,
                            color: '#1e293b',
                            background: '#ffffff',
                          }}
                        >
                          {daftarBab.map((b) => (
                            <option key={b.id} value={b.id}>
                              {b.judul} (Estimasi {b.alokasiSesi} sesi)
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Sub-Bab Selector & Capaian Pembelajaran */}
                      {(() => {
                        const babAktif = daftarBab.find((b) => b.id === selectedBabId);
                        if (!babAktif) return null;
                        return (
                          <div style={{ marginTop: 6 }}>
                            {babAktif.subBab && babAktif.subBab.length > 0 && (
                              <div style={{ marginBottom: 6 }}>
                                <label style={{ fontSize: 10.5, color: '#64748b', fontWeight: 600, display: 'block', marginBottom: 3 }}>
                                  Sub-Bab yang Dipelajari:
                                </label>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                                  {babAktif.subBab.map((sb) => {
                                    const isSubActive = selectedSubBab === sb;
                                    return (
                                      <button
                                        key={sb}
                                        type="button"
                                        onClick={() => handlePilihSubBab(sb)}
                                        style={{
                                          padding: '4px 9px',
                                          borderRadius: 6,
                                          fontSize: 10.5,
                                          border: isSubActive ? '1.5px solid #4f46e5' : '1px solid #cbd5e1',
                                          background: isSubActive ? '#eef2ff' : '#ffffff',
                                          color: isSubActive ? '#4338ca' : '#475569',
                                          fontWeight: isSubActive ? 700 : 500,
                                          cursor: 'pointer',
                                        }}
                                      >
                                        {isSubActive ? '✓ ' : ''}{sb}
                                      </button>
                                    );
                                  })}
                                </div>
                              </div>
                            )}

                            {babAktif.cp && (
                              <div style={{ fontSize: 10.5, color: '#0369a1', background: '#f0f9ff', border: '1px solid #bae6fd', padding: '6px 9px', borderRadius: 6, marginTop: 4 }}>
                                🎯 <b>Tujuan / Capaian Pembelajaran:</b> {babAktif.cp}
                              </div>
                            )}
                          </div>
                        );
                      })()}
                    </div>
                  ) : (
                    <div>
                      <input
                        type="text"
                        placeholder="Contoh: Bab 2 - Dinamika Gerak &amp; Hukum Newton (Latihan 1-15)"
                        value={sessionMateri}
                        onChange={(e) => setSessionMateri(e.target.value)}
                        style={{ width: '100%', padding: '7px 10px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 12, boxSizing: 'border-box' }}
                      />
                    </div>
                  )}

                  {/* Status Ketuntasan Sesi (Melindungi beban tentor & transparan ke ortu) */}
                  <div style={{ marginTop: 10, paddingTop: 8, borderTop: '1px dashed #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 6 }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: '#475569' }}>
                      Status Penuntasan Bab Ini:
                    </span>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button
                        type="button"
                        onClick={() => setStatusKetuntasan('berjalan')}
                        style={{
                          padding: '4px 10px',
                          borderRadius: 6,
                          border: statusKetuntasan === 'berjalan' ? '1.5px solid #d97706' : '1px solid #e2e8f0',
                          background: statusKetuntasan === 'berjalan' ? '#fffbeb' : '#ffffff',
                          color: statusKetuntasan === 'berjalan' ? '#b45309' : '#64748b',
                          fontSize: 11,
                          fontWeight: statusKetuntasan === 'berjalan' ? 700 : 500,
                          cursor: 'pointer',
                        }}
                      >
                        🔄 Sedang Berjalan (Lanjut Sesi Depan)
                      </button>
                      <button
                        type="button"
                        onClick={() => setStatusKetuntasan('tuntas')}
                        style={{
                          padding: '4px 10px',
                          borderRadius: 6,
                          border: statusKetuntasan === 'tuntas' ? '1.5px solid #16a34a' : '1px solid #e2e8f0',
                          background: statusKetuntasan === 'tuntas' ? '#f0fdf4' : '#ffffff',
                          color: statusKetuntasan === 'tuntas' ? '#15803d' : '#64748b',
                          fontSize: 11,
                          fontWeight: statusKetuntasan === 'tuntas' ? 700 : 500,
                          cursor: 'pointer',
                        }}
                      >
                        ✓ Selesai Tuntas
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              <button onClick={() => setShowModal(false)} style={styles.modalClose}>
                ✕
              </button>
            </div>

            <div style={styles.modalBody}>
              {attendanceList.length === 0 ? (
                <div style={styles.modalEmpty}>
                  <Users size={32} color="#cbd5e1" />
                  <p>Belum ada siswa terdaftar</p>
                </div>
              ) : (
                <div style={styles.studentList}>
                  {attendanceList.map((student, index) => (
                    <div key={student.studentId || student.id || index} style={styles.studentItem}>
                      <div style={styles.studentInfo}>
                        <span style={styles.studentName}>{student.nama || 'Siswa'}</span>
                        {student.studentId && (
                          <span style={styles.studentId}>#{student.studentId}</span>
                        )}
                        <span style={styles.studentKelas}>{student.kelas || student.kelasSekolah || '-'}</span>
                      </div>
                      <div style={styles.statusButtons}>
                        {['Hadir', 'Sakit', 'Izin', 'Alpha'].map(status => (
                          <button
                            key={status}
                            onClick={() => handleUpdateAttendance(student.studentId || student.id, status)}
                            style={styles.statusBtn(
                              student.status === status,
                              getStatusColor(status)
                            )}
                          >
                            {status}
                          </button>
                        ))}
                      </div>

                      {student.status === 'Hadir' && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 6, width: '100%', flexWrap: 'wrap' }}>
                          <span style={{ fontSize: 11, color: '#64748b', fontWeight: 600 }}>Pemahaman Sesi Ini:</span>
                          {[
                            { key: 'mandiri', label: '🟢 Paham Mandiri', desc: 'Mampu menyelesaikan latihan mandiri di kelas' },
                            { key: 'terbimbing', label: '🟡 Paham Terbimbing', desc: 'Paham dengan asistensi / contoh soal tentor' },
                            { key: 'klinik', label: '🔵 Butuh Klinik PR', desc: 'Perlu penguatan konsep tambahan / remedial PR' },
                          ].map((t) => {
                            const active = (student.tingkatPemahaman || 'mandiri') === t.key;
                            return (
                              <button
                                key={t.key}
                                type="button"
                                title={t.desc}
                                onClick={() => handleUpdatePemahaman(student.studentId || student.id, t.key)}
                                style={{
                                  padding: '4px 8px',
                                  borderRadius: 6,
                                  border: active ? '1.5px solid #6366f1' : '1px solid #e2e8f0',
                                  background: active ? '#eef2ff' : '#ffffff',
                                  color: active ? '#4338ca' : '#64748b',
                                  fontSize: 10.5,
                                  fontWeight: active ? 'bold' : 'normal',
                                  cursor: 'pointer',
                                  transition: '0.2s',
                                }}
                              >
                                {t.label}
                              </button>
                            );
                          })}
                        </div>
                      )}

                      <input
                        type="text"
                        placeholder="Penanda / keterangan perkembangan siswa di kelas (opsional): mis. aktif bertanya, tugas tuntas"
                        value={student.note || ''}
                        onChange={(e) => handleUpdateNote(student.studentId || student.id, e.target.value)}
                        style={{ width: '100%', marginTop: 6, padding: '7px 9px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 11.5, boxSizing: 'border-box' }}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div style={styles.modalFooter}>
              <button onClick={() => setShowModal(false)} style={styles.btnCancel}>
                Batal
              </button>
              <button onClick={handleSaveAttendance} disabled={saving} style={{...styles.btnSave, opacity: saving ? 0.6 : 1}}>
                <CheckCircle size={16} /> {saving ? 'Menyimpan...' : 'Simpan Absensi'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ============================================================
// STYLES (SAMA SEPERTI SEBELUMNYA)
// ============================================================
const styles = {
  container: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '20px',
    width: '100%'
  },
  
  loadingContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '60px',
    color: '#94a3b8'
  },
  
  spinner: {
    width: '40px',
    height: '40px',
    border: '4px solid #e2e8f0',
    borderTop: '4px solid #3b82f6',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
    marginBottom: '16px'
  },
  
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '12px',
    marginBottom: '24px'
  },
  
  title: {
    margin: 0,
    fontSize: '22px',
    fontWeight: '800',
    color: '#1e293b',
    display: 'flex',
    alignItems: 'center',
    gap: '10px'
  },
  
  subtitle: {
    margin: '4px 0 0',
    color: '#64748b',
    fontSize: '13px'
  },
  
  codeBox: {
    background: '#f0fdf4',
    border: '1px solid #bbf7d0',
    padding: '10px 16px',
    borderRadius: '10px',
    display: 'flex',
    alignItems: 'center',
    gap: '12px'
  },
  
  codeLabel: {
    fontSize: '12px',
    fontWeight: 'bold',
    color: '#166534'
  },
  
  codeValue: {
    fontSize: '20px',
    fontWeight: '900',
    color: '#166534',
    fontFamily: 'monospace',
    letterSpacing: '4px'
  },
  
  dateNav: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    background: 'white',
    padding: '12px 16px',
    borderRadius: '12px',
    border: '1px solid #e2e8f0',
    marginBottom: '20px',
    flexWrap: 'wrap'
  },
  
  dateNavBtn: {
    background: '#f1f5f9',
    border: 'none',
    padding: '6px 10px',
    borderRadius: '6px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: '0.2s'
  },
  
  dateDisplay: {
    flex: 1,
    textAlign: 'center'
  },
  
  dateDay: {
    display: 'block',
    fontSize: '14px',
    fontWeight: 'bold',
    color: '#1e293b'
  },
  
  dateFull: {
    display: 'block',
    fontSize: '12px',
    color: '#64748b'
  },
  
  todayBtn: {
    padding: '6px 14px',
    background: '#3b82f6',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontWeight: 'bold',
    fontSize: '12px',
    transition: '0.2s'
  },
  
  emptyState: {
    textAlign: 'center',
    padding: '60px',
    background: 'white',
    borderRadius: '12px',
    border: '2px dashed #e2e8f0',
    color: '#94a3b8'
  },
  
  scheduleList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px'
  },
  
  scheduleCard: {
    background: 'white',
    padding: '16px',
    borderRadius: '12px',
    border: '1px solid #e2e8f0',
    transition: '0.2s'
  },
  
  scheduleHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '8px',
    flexWrap: 'wrap',
    gap: '8px'
  },
  
  scheduleInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    fontSize: '12px',
    color: '#64748b'
  },
  
  scheduleTime: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    fontWeight: 'bold',
    color: '#3b82f6'
  },
  
  schedulePlanet: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px'
  },
  
  scheduleProgram: (program) => ({
    fontSize: '10px',
    fontWeight: 'bold',
    color: program === 'English' ? '#ef4444' : '#10b981',
    background: program === 'English' ? '#fef2f2' : '#f0fdf4',
    padding: '4px 10px',
    borderRadius: '10px'
  }),
  
  scheduleBody: {
    marginBottom: '12px'
  },
  
  scheduleTitle: {
    margin: '0 0 4px',
    fontSize: '15px',
    fontWeight: 'bold',
    color: '#1e293b'
  },
  
  scheduleMeta: {
    display: 'flex',
    gap: '12px',
    fontSize: '12px',
    color: '#94a3b8'
  },
  
  scheduleFooter: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '8px',
    paddingTop: '12px',
    borderTop: '1px solid #f1f5f9'
  },
  
  attendanceStats: {
    display: 'flex',
    gap: '12px',
    fontSize: '12px',
    color: '#64748b'
  },
  
  statItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px'
  },
  
  absensiBtn: {
    padding: '8px 16px',
    background: '#3b82f6',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontWeight: 'bold',
    fontSize: '12px',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    transition: '0.2s'
  },
  
  attendancePreview: {
    display: 'flex',
    gap: '4px',
    flexWrap: 'wrap',
    marginTop: '10px',
    paddingTop: '10px',
    borderTop: '1px solid #f1f5f9'
  },
  
  attendanceChip: {
    padding: '2px 8px',
    borderRadius: '10px',
    color: 'white',
    fontSize: '10px',
    fontWeight: 'bold'
  },
  
  attendanceMore: {
    fontSize: '10px',
    color: '#94a3b8',
    padding: '2px 4px'
  },
  
  // Modal
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    background: 'rgba(0,0,0,0.6)',
    backdropFilter: 'blur(2px)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2000
  },
  
  modal: {
    background: 'white',
    borderRadius: '16px',
    padding: '24px',
    width: '90%',
    maxWidth: '700px',
    maxHeight: '80vh',
    display: 'flex',
    flexDirection: 'column',
    boxShadow: '0 20px 50px rgba(0,0,0,0.3)',
    animation: 'slideUp 0.3s ease'
  },
  
  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingBottom: '16px',
    borderBottom: '1px solid #f1f5f9',
    marginBottom: '16px'
  },
  
  modalTitle: {
    margin: 0,
    fontSize: '18px',
    fontWeight: 'bold',
    color: '#1e293b'
  },
  
  modalSubtitle: {
    margin: '4px 0 0',
    fontSize: '13px',
    color: '#64748b'
  },
  
  modalClose: {
    background: 'none',
    border: 'none',
    fontSize: '24px',
    cursor: 'pointer',
    color: '#94a3b8',
    padding: '4px',
    transition: '0.2s'
  },
  
  modalBody: {
    flex: 1,
    overflowY: 'auto',
    marginBottom: '16px'
  },
  
  modalEmpty: {
    textAlign: 'center',
    padding: '40px',
    color: '#94a3b8'
  },
  
  studentList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px'
  },
  
  studentItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '10px 12px',
    background: '#f8fafc',
    borderRadius: '8px',
    border: '1px solid #f1f5f9',
    flexWrap: 'wrap',
    gap: '8px'
  },
  
  studentInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    flexWrap: 'wrap'
  },
  
  studentName: {
    fontWeight: 'bold',
    fontSize: '13px',
    color: '#1e293b'
  },
  
  studentId: {
    fontSize: '10px',
    color: '#94a3b8',
    fontFamily: 'monospace'
  },
  
  studentKelas: {
    fontSize: '10px',
    color: '#3b82f6',
    background: '#eef2ff',
    padding: '2px 8px',
    borderRadius: '10px'
  },
  
  statusButtons: {
    display: 'flex',
    gap: '4px',
    flexWrap: 'wrap'
  },
  
  statusBtn: (active, color) => ({
    padding: '4px 10px',
    borderRadius: '6px',
    border: active ? `2px solid ${color}` : '1px solid #e2e8f0',
    background: active ? color : 'white',
    color: active ? 'white' : '#64748b',
    cursor: 'pointer',
    fontSize: '10px',
    fontWeight: active ? 'bold' : 'normal',
    transition: '0.2s'
  }),
  
  modalFooter: {
    display: 'flex',
    gap: '10px',
    paddingTop: '16px',
    borderTop: '1px solid #f1f5f9',
    justifyContent: 'flex-end'
  },
  
  btnCancel: {
    padding: '10px 20px',
    borderRadius: '8px',
    border: '1px solid #e2e8f0',
    background: 'white',
    cursor: 'pointer',
    fontWeight: 'bold',
    fontSize: '13px',
    color: '#64748b'
  },
  
  btnSave: {
    padding: '10px 24px',
    borderRadius: '8px',
    border: 'none',
    background: '#22c55e',
    color: 'white',
    cursor: 'pointer',
    fontWeight: 'bold',
    fontSize: '13px',
    display: 'flex',
    alignItems: 'center',
    gap: '6px'
  }
};

// Tambahkan keyframes
const styleSheet = document.createElement("style");
styleSheet.textContent = `
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
  @keyframes slideUp {
    from { opacity: 0; transform: translateY(20px); }
    to { opacity: 1; transform: translateY(0); }
  }
`;
document.head.appendChild(styleSheet);

export default TeacherAttendance;