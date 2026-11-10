// src/pages/student/ScanAbsensiPage.jsx
// ============================================================
// HALAMAN SCAN & FOTO ABSENSI SISWA
// Pemindaian QR code presensi tatap muka di kelas, upload/foto selfie
// kehadiran jika diminta tentor, serta pemantauan status kehadiran
// pada jadwal kelas hari ini.
// ============================================================
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Html5Qrcode } from 'html5-qrcode';
import {
  Camera, QrCode, CheckCircle2, Clock, AlertCircle, RefreshCw,
  ChevronRight, Calendar, UserCheck, ShieldCheck, ArrowLeft, UploadCloud, X
} from 'lucide-react';
import { db } from '../../firebase';
import {
  collection, doc, getDoc, getDocs, setDoc, query, where, serverTimestamp
} from 'firebase/firestore';
import { useProfilSiswa } from '../../utils/profilSiswa';
import { tanggalLokalStr, waktuLokalStr } from '../../utils/waktuLokal';
import { kunciDokumenAbsensi, daftarQueryAbsensi, gabungkanDokUnik } from '../../utils/identitasAbsensi';

export default function ScanAbsensiPage() {
  const navigate = useNavigate();
  const profil = useProfilSiswa();

  const studentName = profil.nama || localStorage.getItem('studentName') || 'Siswa';
  const studentKelas = profil.kelas || localStorage.getItem('studentKelas') || localStorage.getItem('studentGrade') || '';
  const studentId = localStorage.getItem('studentId') || '';
  const studentDocId = localStorage.getItem('studentDocId') || '';
  const studentNim = localStorage.getItem('studentNim') || '';

  const [mode, setMode] = useState('qr'); // 'qr' | 'foto'
  const [isScanning, setIsScanning] = useState(false);
  const [scannerError, setScannerError] = useState('');
  const [scanSuccessData, setScanSuccessData] = useState(null);

  const [loadingJadwal, setLoadingJadwal] = useState(true);
  const [todaySchedules, setTodaySchedules] = useState([]);
  const [todayAttendanceMap, setTodayAttendanceMap] = useState({});

  // Foto kehadiran state
  const [fotoFile, setFotoFile] = useState(null);
  const [fotoPreview, setFotoPreview] = useState('');
  const [selectedScheduleId, setSelectedScheduleId] = useState('');
  const [keteranganFoto, setKeteranganFoto] = useState('');
  const [mengunggahFoto, setMengunggahFoto] = useState(false);
  const [pesanSuksesFoto, setPesanSuksesFoto] = useState('');

  const qrInstanceRef = useRef(null);
  const fileInputRef = useRef(null);

  // Ambil data jadwal hari ini & status absensi
  const muatDataHariIni = useCallback(async () => {
    if (!studentId && !studentDocId) {
      setLoadingJadwal(false);
      return;
    }
    setLoadingJadwal(true);
    try {
      const today = tanggalLokalStr();
      const hariIniList = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
      const namaHariIni = hariIniList[new Date().getDay()];

      const queryDaftar = daftarQueryAbsensi({
        studentDocId,
        studentId,
        studentNim,
      });

      const [schedDateSnap, schedHariSnap, ...attSnaps] = await Promise.all([
        getDocs(query(collection(db, "schedules"), where("date", "==", today))).catch(() => ({ docs: [] })),
        getDocs(query(collection(db, "schedules"), where("day", "==", namaHariIni))).catch(() => ({ docs: [] })),
        ...queryDaftar.map(q => getDocs(query(collection(db, "attendance"), where(q.field, "==", q.nilai))).catch(() => ({ docs: [] }))),
      ]);

      const attList = gabungkanDokUnik(attSnaps.map(s => s.docs));

      // Gabungkan jadwal tanggal hari ini & jadwal rutin hari ini
      const mapJadwal = new Map();
      [...schedDateSnap.docs, ...schedHariSnap.docs].forEach(d => {
        mapJadwal.set(d.id, { id: d.id, ...d.data() });
      });

      const resolvedDocId = studentDocId;
      const nimVal = studentNim || studentId;
      const realName = studentName;

      const jadwalTersaring = Array.from(mapJadwal.values())
        .filter(sch => sch.students?.some(s =>
          s === studentId || s.id === studentId || s.studentId === studentId ||
          s === resolvedDocId || s.id === resolvedDocId ||
          s === nimVal || s.studentId === nimVal ||
          (s.nama && realName && s.nama.trim().toLowerCase() === realName.trim().toLowerCase())
        ))
        .sort((a, b) => (a.start || '').localeCompare(b.start || ''));

      setTodaySchedules(jadwalTersaring);
      if (jadwalTersaring.length > 0 && !selectedScheduleId) {
        setSelectedScheduleId(jadwalTersaring[0].id);
      }

      // Ambil absensi tersimpan untuk jadwal hari ini
      for (const sch of jadwalTersaring) {
        const kunciCek = [
          resolvedDocId && kunciDokumenAbsensi(resolvedDocId, today, sch.id),
          studentId && kunciDokumenAbsensi(studentId, today, sch.id),
          nimVal && kunciDokumenAbsensi(nimVal, today, sch.id),
        ].filter(Boolean);
        for (const k of kunciCek) {
          if (!attList.some(a => a.id === k)) {
            try {
              const dSnap = await getDoc(doc(db, "attendance", k));
              if (dSnap?.exists()) {
                attList.push({ id: dSnap.id, ...dSnap.data() });
              }
            } catch { /* abaikan */ }
          }
        }
      }

      const mapAtt = {};
      attList.filter(a => (a.date === today || a.tanggal === today)).forEach(a => {
        const sId = a.scheduleId || a.jadwalId;
        if (sId) mapAtt[sId] = a;
      });
      setTodayAttendanceMap(mapAtt);
    } catch (err) {
      console.warn("Gagal memuat jadwal hari ini:", err);
    } finally {
      setLoadingJadwal(false);
    }
  }, [studentId, studentDocId, studentNim, studentName, selectedScheduleId]);

  useEffect(() => {
    muatDataHariIni();
  }, [muatDataHariIni]);

  // Handler QR Scanner
  const hentikanScanner = useCallback(async () => {
    if (qrInstanceRef.current) {
      try {
        if (qrInstanceRef.current.isScanning) {
          await qrInstanceRef.current.stop();
        }
        qrInstanceRef.current.clear();
      } catch (err) {
        console.warn("Scanner stop warning:", err);
      }
      qrInstanceRef.current = null;
    }
    setIsScanning(false);
  }, []);

  const mulaiScanner = useCallback(async () => {
    setScannerError('');
    setScanSuccessData(null);
    setIsScanning(true);

    try {
      // Tunggu DOM elemen #reader-page terpasang
      setTimeout(async () => {
        try {
          const qr = new Html5Qrcode("reader-page");
          qrInstanceRef.current = qr;

          await qr.start(
            { facingMode: "environment" },
            { fps: 10, qrbox: { width: 250, height: 250 } },
            async (decodedText) => {
              try {
                let data = null;
                try {
                  data = JSON.parse(decodedText);
                } catch {
                  setScannerError('Format QR tidak dikenali. Pastikan scan QR absensi resmi Bimbel Gemilang.');
                  return;
                }

                if (data.type !== "ABSENSI_BIMBEL") {
                  setScannerError('QR ini bukan kode absensi resmi bimbel.');
                  return;
                }

                // Cek jadwal hari ini
                const matched = todaySchedules.find(sch => sch.id === data.scheduleId);
                if (!matched && todaySchedules.length > 0) {
                  setScannerError(`QR ini untuk jadwal "${data.mapel || 'kelas'}" (${data.teacher || 'tentor'}), yang bukan kelasmu hari ini.`);
                  return;
                }

                const today = tanggalLokalStr();
                const nowTime = waktuLokalStr ? waktuLokalStr() : new Date().toLocaleTimeString('id-ID');
                const docKey = kunciDokumenAbsensi(studentId || studentDocId, today, data.scheduleId || '');

                await setDoc(doc(db, "attendance", docKey), {
                  studentId: studentId || studentDocId,
                  studentDocId: studentDocId || studentId,
                  studentNim: studentNim || '',
                  studentName,
                  teacherName: data.teacher || 'Tentor',
                  date: today,
                  tanggal: today,
                  timestamp: serverTimestamp(),
                  status: "Hadir",
                  mapel: data.mapel || matched?.subject || 'Bimbel Tatap Muka',
                  scheduleId: data.scheduleId || '',
                  keterangan: `Scan QR Kelas (${nowTime})`,
                }, { merge: true });

                setScanSuccessData({
                  mapel: data.mapel || matched?.subject || 'Bimbel Tatap Muka',
                  teacher: data.teacher || 'Tentor',
                  waktu: nowTime,
                });

                await hentikanScanner();
                muatDataHariIni();
              } catch (e) {
                console.error("Gagal memproses QR:", e);
                setScannerError("Gagal mencatat absensi: " + (e?.message || 'Koneksi error'));
              }
            },
            () => {}
          );
        } catch (err) {
          console.error("Gagal inisialisasi kamera:", err);
          setScannerError("Tidak dapat mengakses kamera. Pastikan izin kamera aktif di browser HP-mu.");
          setIsScanning(false);
        }
      }, 300);
    } catch (err) {
      setScannerError("Gagal memulai kamera: " + err.message);
      setIsScanning(false);
    }
  }, [hentikanScanner, muatDataHariIni, studentDocId, studentId, studentNim, studentName, todaySchedules]);

  // Bersihkan scanner saat unmount
  useEffect(() => {
    return () => {
      if (qrInstanceRef.current) {
        try {
          if (qrInstanceRef.current.isScanning) {
            qrInstanceRef.current.stop();
          }
          qrInstanceRef.current.clear();
        } catch { /* abaikan saat unmount */ }
      }
    };
  }, []);

  // Handler Pilih Foto Kehadiran
  const handlePilihFoto = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFotoFile(file);
    const reader = new FileReader();
    reader.onload = () => setFotoPreview(reader.result);
    reader.readAsDataURL(file);
  };

  // Handler Simpan Foto Kehadiran
  const handleKirimFotoKehadiran = async () => {
    if (!fotoPreview && !fotoFile) {
      alert("Silakan ambil atau pilih foto selfie/kehadiran terlebih dahulu.");
      return;
    }
    if (!selectedScheduleId && todaySchedules.length > 0) {
      alert("Pilih jadwal kelas yang ingin kamu hadiri.");
      return;
    }

    setMengunggahFoto(true);
    setPesanSuksesFoto('');
    try {
      const today = tanggalLokalStr();
      const nowTime = waktuLokalStr ? waktuLokalStr() : new Date().toLocaleTimeString('id-ID');
      const docKey = kunciDokumenAbsensi(studentId || studentDocId, today, selectedScheduleId || 'manual');
      const matched = todaySchedules.find(s => s.id === selectedScheduleId);

      // Simpan data absensi foto ke Firestore
      await setDoc(doc(db, "attendance", docKey), {
        studentId: studentId || studentDocId,
        studentDocId: studentDocId || studentId,
        studentNim: studentNim || '',
        studentName,
        teacherName: matched?.teacher || 'Tentor',
        date: today,
        tanggal: today,
        timestamp: serverTimestamp(),
        status: "Hadir",
        mapel: matched?.subject || 'Bimbel Tatap Muka',
        scheduleId: selectedScheduleId || '',
        keterangan: `Foto Absensi (${nowTime})${keteranganFoto ? ` - ${keteranganFoto}` : ''}`,
        fotoBuktiDataUrl: fotoPreview.length < 200000 ? fotoPreview : undefined, // simpan data url bila kecil
      }, { merge: true });

      setPesanSuksesFoto("✅ Foto kehadiran berhasil dicatat!");
      setFotoFile(null);
      setFotoPreview('');
      setKeteranganFoto('');
      muatDataHariIni();
    } catch (err) {
      alert("Gagal menyimpan foto kehadiran: " + (err?.message || err));
    } finally {
      setMengunggahFoto(false);
    }
  };

  return (
    <div style={{ maxWidth: 680, margin: '0 auto', padding: '16px 14px 90px' }}>
      {/* Header Banner */}
      <div style={{
        background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
        borderRadius: 20,
        padding: '20px 18px',
        color: '#ffffff',
        marginBottom: 16,
        boxShadow: '0 8px 24px rgba(15,23,42,0.18)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 44, height: 44, borderRadius: 14,
              background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(16,185,129,0.35)',
            }}>
              <Camera size={22} color="#ffffff" />
            </div>
            <div>
              <h1 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: '#ffffff' }}>
                Scan Absensi & Kehadiran
              </h1>
              <p style={{ margin: '2px 0 0', fontSize: 11.5, color: '#94a3b8' }}>
                Presensi resmi tatap muka Bimbel Gemilang
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => navigate('/siswa/absensi')}
            style={{
              background: 'rgba(255,255,255,0.1)',
              border: '1px solid rgba(255,255,255,0.18)',
              color: '#ffffff',
              borderRadius: 12,
              padding: '6px 12px',
              fontSize: 11,
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 4,
            }}
          >
            <UserCheck size={14} /> Riwayat
          </button>
        </div>

        {/* Tab Switcher: QR Code vs Foto Kehadiran */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 8,
          background: 'rgba(255,255,255,0.06)',
          padding: 4,
          borderRadius: 14,
        }}>
          <button
            type="button"
            onClick={() => { setMode('qr'); setScannerError(''); }}
            style={{
              border: 'none',
              padding: '10px 12px',
              borderRadius: 10,
              background: mode === 'qr' ? '#10b981' : 'transparent',
              color: mode === 'qr' ? '#ffffff' : '#94a3b8',
              fontWeight: 800,
              fontSize: 12.5,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
              transition: 'all 0.18s ease',
            }}
          >
            <QrCode size={16} /> Scan QR Kelas
          </button>
          <button
            type="button"
            onClick={() => { setMode('foto'); hentikanScanner(); }}
            style={{
              border: 'none',
              padding: '10px 12px',
              borderRadius: 10,
              background: mode === 'foto' ? '#10b981' : 'transparent',
              color: mode === 'foto' ? '#ffffff' : '#94a3b8',
              fontWeight: 800,
              fontSize: 12.5,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
              transition: 'all 0.18s ease',
            }}
          >
            <Camera size={16} /> Foto Kehadiran
          </button>
        </div>
      </div>

      {/* SUCCESS MODAL / BANNER DARI SCAN QR */}
      {scanSuccessData && (
        <div style={{
          background: 'linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%)',
          border: '1.5px solid #86efac',
          borderRadius: 16,
          padding: '16px 18px',
          marginBottom: 16,
          display: 'flex',
          alignItems: 'flex-start',
          gap: 12,
          animation: 'fadeSlideIn 0.3s ease-out',
        }}>
          <CheckCircle2 size={26} color="#15803d" style={{ flexShrink: 0, marginTop: 2 }} />
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 800, fontSize: 14, color: '#166534' }}>
              Presensi Berhasil Dicatat!
            </div>
            <div style={{ fontSize: 12, color: '#14532d', marginTop: 3 }}>
              Mata Pelajaran: <strong>{scanSuccessData.mapel}</strong> • Tentor: <strong>{scanSuccessData.teacher}</strong>
            </div>
            <div style={{ fontSize: 11, color: '#166534', marginTop: 3 }}>
              Status: <strong>Hadir</strong> jam {scanSuccessData.waktu}
            </div>
          </div>
          <button
            type="button"
            onClick={() => setScanSuccessData(null)}
            style={{ background: 'none', border: 'none', color: '#15803d', cursor: 'pointer' }}
          >
            <X size={18} />
          </button>
        </div>
      )}

      {/* KONTEN TAB 1: SCAN QR CODE */}
      {mode === 'qr' && (
        <div style={{
          background: '#ffffff',
          borderRadius: 20,
          padding: '20px 18px',
          border: '1px solid #e2e8f0',
          boxShadow: '0 4px 16px rgba(0,0,0,0.04)',
          marginBottom: 16,
        }}>
          <div style={{ textAlign: 'center', marginBottom: 16 }}>
            <h2 style={{ fontSize: 16, fontWeight: 800, color: '#1e293b', margin: 0 }}>
              Kamera Scanner QR Code
            </h2>
            <p style={{ fontSize: 12, color: '#64748b', margin: '4px 0 0' }}>
              Minta tentor memperlihatkan QR Code presensi sesi kelas hari ini
            </p>
          </div>

          {/* Area Kamera Scanner */}
          <div style={{
            position: 'relative',
            background: '#0f172a',
            borderRadius: 16,
            overflow: 'hidden',
            minHeight: isScanning ? 280 : 180,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            border: '2px dashed #cbd5e1',
          }}>
            {/* Div wadah kamera dari Html5Qrcode */}
            <div
              id="reader-page"
              style={{
                width: '100%',
                display: isScanning ? 'block' : 'none',
              }}
            />

            {!isScanning && (
              <div style={{ padding: 24, textAlign: 'center', color: '#94a3b8' }}>
                <QrCode size={56} color="#64748b" style={{ margin: '0 auto 12px' }} />
                <div style={{ fontSize: 13, fontWeight: 700, color: '#e2e8f0' }}>
                  Kamera Belum Aktif
                </div>
                <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 4 }}>
                  Klik tombol di bawah untuk membuka kamera dan mulai memindai
                </div>
              </div>
            )}
          </div>

          {/* Error Message */}
          {scannerError && (
            <div style={{
              marginTop: 12,
              background: '#fef2f2',
              border: '1px solid #fecaca',
              borderRadius: 12,
              padding: '10px 14px',
              fontSize: 12,
              color: '#b91c1c',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}>
              <AlertCircle size={16} style={{ flexShrink: 0 }} />
              <span>{scannerError}</span>
            </div>
          )}

          {/* Tombol Aksi Kamera */}
          <div style={{ marginTop: 16, display: 'flex', gap: 10 }}>
            {!isScanning ? (
              <button
                type="button"
                onClick={mulaiScanner}
                style={{
                  flex: 1,
                  background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: 14,
                  padding: '14px',
                  fontWeight: 800,
                  fontSize: 14,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  boxShadow: '0 4px 14px rgba(16,185,129,0.3)',
                }}
              >
                <Camera size={18} /> Buka Kamera & Scan Sekarang
              </button>
            ) : (
              <button
                type="button"
                onClick={hentikanScanner}
                style={{
                  flex: 1,
                  background: '#ef4444',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: 14,
                  padding: '14px',
                  fontWeight: 800,
                  fontSize: 14,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                }}
              >
                <X size={18} /> Tutup Kamera
              </button>
            )}
          </div>
        </div>
      )}

      {/* KONTEN TAB 2: FOTO KEHADIRAN */}
      {mode === 'foto' && (
        <div style={{
          background: '#ffffff',
          borderRadius: 20,
          padding: '20px 18px',
          border: '1px solid #e2e8f0',
          boxShadow: '0 4px 16px rgba(0,0,0,0.04)',
          marginBottom: 16,
        }}>
          <div style={{ textAlign: 'center', marginBottom: 16 }}>
            <h2 style={{ fontSize: 16, fontWeight: 800, color: '#1e293b', margin: 0 }}>
              Foto / Bukti Kehadiran Siswa
            </h2>
            <p style={{ fontSize: 12, color: '#64748b', margin: '4px 0 0' }}>
              Ambil foto selfie di ruang kelas atau unggah bukti kehadiranmu
            </p>
          </div>

          {/* Pilih Jadwal Kelas Hari Ini */}
          {todaySchedules.length > 0 && (
            <div style={{ marginBottom: 14 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 6 }}>
                Pilih Jadwal Kelas:
              </label>
              <select
                value={selectedScheduleId}
                onChange={(e) => setSelectedScheduleId(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: 12,
                  border: '1.5px solid #cbd5e1',
                  fontSize: 13,
                  fontWeight: 600,
                  color: '#1e293b',
                  background: '#f8fafc',
                }}
              >
                {todaySchedules.map((sch) => (
                  <option key={sch.id} value={sch.id}>
                    {sch.subject || 'Bimbel'} ({sch.start || '00:00'} - {sch.end || '00:00'}) • {sch.teacher || 'Tentor'}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Preview Foto */}
          <div style={{
            position: 'relative',
            background: '#f8fafc',
            borderRadius: 16,
            border: '2px dashed #cbd5e1',
            minHeight: 200,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
            marginBottom: 14,
          }}>
            {fotoPreview ? (
              <div style={{ width: '100%', position: 'relative' }}>
                <img
                  src={fotoPreview}
                  alt="Preview Foto Kehadiran"
                  style={{ width: '100%', maxHeight: 320, objectFit: 'contain' }}
                />
                <button
                  type="button"
                  onClick={() => { setFotoFile(null); setFotoPreview(''); }}
                  style={{
                    position: 'absolute', top: 10, right: 10,
                    background: 'rgba(0,0,0,0.6)', color: 'white',
                    border: 'none', borderRadius: '50%', width: 32, height: 32,
                    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}
                >
                  <X size={16} />
                </button>
              </div>
            ) : (
              <div style={{ padding: 24, textAlign: 'center', color: '#94a3b8' }}>
                <Camera size={48} color="#94a3b8" style={{ margin: '0 auto 10px' }} />
                <div style={{ fontSize: 13, fontWeight: 700, color: '#475569' }}>
                  Belum Ada Foto
                </div>
                <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 4 }}>
                  Klik tombol di bawah untuk mengambil foto langsung dari kamera HP
                </div>
              </div>
            )}
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="user"
            style={{ display: 'none' }}
            onChange={handlePilihFoto}
          />

          <div style={{ display: 'flex', gap: 10, marginBottom: 14 }}>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              style={{
                flex: 1,
                background: '#f1f5f9',
                color: '#1e293b',
                border: '1px solid #cbd5e1',
                borderRadius: 12,
                padding: '12px',
                fontWeight: 700,
                fontSize: 13,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
              }}
            >
              <Camera size={16} /> Ambil / Pilih Foto
            </button>
          </div>

          {/* Keterangan Tambahan */}
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 6 }}>
              Catatan / Keterangan (Opsional):
            </label>
            <input
              type="text"
              placeholder="Contoh: Hadir di ruang kelas B, sesi offline"
              value={keteranganFoto}
              onChange={(e) => setKeteranganFoto(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: 12,
                border: '1.5px solid #cbd5e1',
                fontSize: 13,
                boxSizing: 'border-box',
              }}
            />
          </div>

          {pesanSuksesFoto && (
            <div style={{
              marginBottom: 14,
              background: '#dcfce7',
              border: '1px solid #86efac',
              borderRadius: 12,
              padding: '10px 14px',
              fontSize: 12.5,
              color: '#166534',
              fontWeight: 700,
            }}>
              {pesanSuksesFoto}
            </div>
          )}

          <button
            type="button"
            disabled={(!fotoPreview && !fotoFile) || mengunggahFoto}
            onClick={handleKirimFotoKehadiran}
            style={{
              width: '100%',
              background: (!fotoPreview && !fotoFile) ? '#cbd5e1' : 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
              color: '#ffffff',
              border: 'none',
              borderRadius: 14,
              padding: '14px',
              fontWeight: 800,
              fontSize: 14,
              cursor: (!fotoPreview && !fotoFile) ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              boxShadow: (!fotoPreview && !fotoFile) ? 'none' : '0 4px 14px rgba(16,185,129,0.3)',
            }}
          >
            <UploadCloud size={18} /> {mengunggahFoto ? 'Menyimpan...' : 'Kirim Foto Kehadiran'}
          </button>
        </div>
      )}

      {/* DAFTAR JADWAL KELAS HARI INI */}
      <div style={{
        background: '#ffffff',
        borderRadius: 20,
        padding: '20px 18px',
        border: '1px solid #e2e8f0',
        boxShadow: '0 4px 16px rgba(0,0,0,0.04)',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <div>
            <h3 style={{ margin: 0, fontSize: 15, fontWeight: 800, color: '#1e293b' }}>
              Jadwal Kelas Hari Ini
            </h3>
            <p style={{ margin: '2px 0 0', fontSize: 11.5, color: '#64748b' }}>
              {new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          </div>
          <button
            type="button"
            onClick={muatDataHariIni}
            title="Segarkan Jadwal"
            style={{
              background: '#f1f5f9', border: 'none', borderRadius: 10,
              padding: '6px 10px', cursor: 'pointer', color: '#475569',
              display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 700,
            }}
          >
            <RefreshCw size={12} className={loadingJadwal ? 'animate-spin' : ''} /> Segarkan
          </button>
        </div>

        {loadingJadwal ? (
          <div style={{ padding: '24px 0', textAlign: 'center', color: '#94a3b8', fontSize: 12 }}>
            Memuat data jadwal hari ini...
          </div>
        ) : todaySchedules.length === 0 ? (
          <div style={{
            padding: 24, textAlign: 'center', background: '#f8fafc',
            borderRadius: 14, border: '1px dashed #cbd5e1',
          }}>
            <Calendar size={32} color="#94a3b8" style={{ margin: '0 auto 8px' }} />
            <div style={{ fontSize: 13, fontWeight: 700, color: '#475569' }}>
              Tidak Ada Jadwal Kelas Hari Ini
            </div>
            <div style={{ fontSize: 11.5, color: '#94a3b8', marginTop: 3 }}>
              Kamu tidak memiliki jadwal bimbel tatap muka yang dijadwalkan pada hari ini.
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {todaySchedules.map((sch) => {
              const att = todayAttendanceMap[sch.id];
              const sudahHadir = att?.status === 'Hadir';
              const isIzin = att?.status === 'Izin' || att?.status === 'Sakit';

              return (
                <div
                  key={sch.id}
                  style={{
                    padding: '14px 16px',
                    borderRadius: 14,
                    background: sudahHadir ? '#f0fdf4' : '#f8fafc',
                    border: sudahHadir ? '1.5px solid #86efac' : '1px solid #e2e8f0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 12,
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <span style={{ fontSize: 14, fontWeight: 800, color: '#1e293b' }}>
                        {sch.subject || 'Bimbel Tatap Muka'}
                      </span>
                      {sudahHadir ? (
                        <span style={{
                          background: '#dcfce7', color: '#15803d',
                          fontSize: 10.5, fontWeight: 800, padding: '2px 8px', borderRadius: 99,
                        }}>
                          ✅ Hadir
                        </span>
                      ) : isIzin ? (
                        <span style={{
                          background: '#e0e7ff', color: '#3730a3',
                          fontSize: 10.5, fontWeight: 800, padding: '2px 8px', borderRadius: 99,
                        }}>
                          ℹ️ {att.status}
                        </span>
                      ) : (
                        <span style={{
                          background: '#fef3c7', color: '#b45309',
                          fontSize: 10.5, fontWeight: 800, padding: '2px 8px', borderRadius: 99,
                        }}>
                          ⏳ Belum Absen
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: 11.5, color: '#64748b', display: 'flex', alignItems: 'center', gap: 12 }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Clock size={12} /> {sch.start || '00:00'} - {sch.end || '00:00'}
                      </span>
                      <span>• Tentor: {sch.teacher || 'Tentor'}</span>
                    </div>
                  </div>

                  {!sudahHadir && (
                    <button
                      type="button"
                      onClick={() => {
                        setMode('qr');
                        mulaiScanner();
                      }}
                      style={{
                        background: '#10b981',
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: 10,
                        padding: '8px 12px',
                        fontSize: 11.5,
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4,
                        flexShrink: 0,
                      }}
                    >
                      <Camera size={14} /> Scan
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
