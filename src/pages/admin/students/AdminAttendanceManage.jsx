// src/pages/admin/students/AdminAttendanceManage.jsx
// Manajemen absensi siswa: pilih tanggal, daftar siswa, set
// Hadir / Izin / Sakit / Alpha + keterangan, edit & hapus.
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import SidebarAdmin from '../../../components/SidebarAdmin';
import { db } from '../../../firebase';
import {
  collection, getDocs, addDoc, updateDoc, deleteDoc, doc, serverTimestamp,
} from 'firebase/firestore';
import {
  Calendar, Save, Trash2, Edit3, X, Search, RefreshCw, ChevronLeft, ChevronRight, FileText, Download, Printer,
} from 'lucide-react';
import { isAkunBelajarAktif } from '../../../utils/statusAkunSiswa';

const STATUS_OPTS = ['Hadir', 'Izin', 'Sakit', 'Alpha'];
const STATUS_STYLE = {
  Hadir: { bg: '#dcfce7', color: '#166534' },
  Sakit: { bg: '#fef3c7', color: '#b45309' },
  Izin: { bg: '#e0e7ff', color: '#3730a3' },
  Alpha: { bg: '#fee2e2', color: '#ef4444' },
  Belum: { bg: '#f1f5f9', color: '#64748b' },
};

function toISODate(d) {
  const x = new Date(d);
  return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}-${String(x.getDate()).padStart(2, '0')}`;
}

function formatTanggalPanjang(iso) {
  try {
    return new Date(iso + 'T12:00:00').toLocaleDateString('id-ID', {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
    });
  } catch {
    return iso;
  }
}

const AdminAttendanceManage = () => {
  const navigate = useNavigate();
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [selectedDate, setSelectedDate] = useState(toISODate(new Date()));
  const [students, setStudents] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('Semua');
  const [alertMsg, setAlertMsg] = useState(null);
  const [editRow, setEditRow] = useState(null); // { studentId, nama, status, keterangan, mapel, existingId }
  // 🔥 BARU: Mode Rekap Bulanan (Arsip Bulan Lalu) + Download PDF untuk Orang Tua/Admin
  const [modeTab, setModeTab] = useState('harian'); // 'harian' | 'bulanan' | 'offline_f4'
  const [selectedMonth, setSelectedMonth] = useState(toISODate(new Date()).slice(0, 7));
  const [selectedStudentId, setSelectedStudentId] = useState('semua');
  // 🖨️ BARU: Absensi Offline Mingguan (F4 Landscape - Validasi 2 Arah)
  const [schedules, setSchedules] = useState([]);
  const [offlineWeekDate, setOfflineWeekDate] = useState(toISODate(new Date()));
  const [offlineSource, setOfflineSource] = useState('kelas'); // 'kelas' | 'jadwal'
  const [offlineScheduleId, setOfflineScheduleId] = useState('');
  const [offlineKelas, setOfflineKelas] = useState('9 SMP');
  const [offlineLabelRombel, setOfflineLabelRombel] = useState('');
  const [offlineTentor, setOfflineTentor] = useState('');
  const [offlineExcludedIds, setOfflineExcludedIds] = useState([]);
  // 🪪 BARU: Kartu Bimbingan Siswa (F4 Landscape 20 Pertemuan - Paraf Tentor, Ortu & Admin)
  const [kartuEntries, setKartuEntries] = useState([]);
  const [kartuStudentId, setKartuStudentId] = useState('');

  const adminName =
    (typeof localStorage !== 'undefined' &&
      (localStorage.getItem('adminName') || localStorage.getItem('adminUsername'))) ||
    'Admin Operasional';

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const showAlert = (msg) => {
    setAlertMsg(msg);
    setTimeout(() => setAlertMsg(null), 3000);
  };

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [stuSnap, attSnap, schedSnap, kartuSnap] = await Promise.all([
        getDocs(collection(db, 'students')),
        getDocs(collection(db, 'attendance')),
        getDocs(collection(db, 'jadwal_bimbel')).catch(() => ({ docs: [] })),
        getDocs(collection(db, 'kartu_bimbingan')).catch(() => ({ docs: [] })),
      ]);
      const stu = stuSnap.docs
        .map((d) => ({ id: d.id, ...d.data() }))
        .filter((s) => isAkunBelajarAktif(s))
        .sort((a, b) => String(a.nama || '').localeCompare(String(b.nama || ''), 'id'));
      setStudents(stu);

      const att = attSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setAttendance(att);

      const scheds = schedSnap.docs
        .map((d) => ({ id: d.id, ...d.data() }))
        .sort((a, b) => String(b.dateStr || '').localeCompare(String(a.dateStr || '')));
      setSchedules(scheds);

      setKartuEntries(kartuSnap.docs.map((d) => ({ id: d.id, ...d.data() })));
    } catch (e) {
      console.error(e);
      showAlert('❌ Gagal memuat data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  const rows = useMemo(() => {
    const dayAtt = attendance.filter((a) => (a.tanggal || '').slice(0, 10) === selectedDate);
    return students
      .map((s) => {
        const sid = s.studentId || s.id;
        const records = dayAtt.filter(
          (a) =>
            a.studentId === sid ||
            a.studentId === s.id ||
            a.namaSiswa === s.nama ||
            a.studentName === s.nama
        );
        // Ambil record "utama" (pertama) untuk tampilan ringkas; detail semua tetap di records
        const main = records[0] || null;
        return {
          student: s,
          studentKey: sid,
          main,
          records,
          status: main?.status || 'Belum',
          keterangan: main?.keterangan || '',
          mapel: main?.mapel || 'Umum',
        };
      })
      .filter((r) => {
        if (search) {
          const q = search.toLowerCase();
          if (!String(r.student.nama || '').toLowerCase().includes(q) &&
              !String(r.student.studentId || '').toLowerCase().includes(q) &&
              !String(r.student.kelas || r.student.kelasSekolah || '').toLowerCase().includes(q)) {
            return false;
          }
        }
        if (filterStatus === 'Belum') return r.status === 'Belum';
        if (filterStatus !== 'Semua') return r.status === filterStatus;
        return true;
      });
  }, [students, attendance, selectedDate, search, filterStatus]);

  const stats = useMemo(() => {
    const dayAtt = attendance.filter((a) => (a.tanggal || '').slice(0, 10) === selectedDate);
    return {
      hadir: dayAtt.filter((x) => x.status === 'Hadir').length,
      izin: dayAtt.filter((x) => x.status === 'Izin').length,
      sakit: dayAtt.filter((x) => x.status === 'Sakit').length,
      alpha: dayAtt.filter((x) => x.status === 'Alpha').length,
      belum: Math.max(0, students.length - new Set(dayAtt.map((a) => a.studentId)).size),
    };
  }, [attendance, selectedDate, students]);

  const shiftDate = (n) => {
    const d = new Date(selectedDate + 'T12:00:00');
    d.setDate(d.getDate() + n);
    setSelectedDate(toISODate(d));
  };

  // Rekap Bulanan (termasuk bulan-bulan sebelumnya) khusus Portal Admin + Download PDF
  const selectedStudentObj = useMemo(() => {
    if (selectedStudentId === 'semua') return null;
    return students.find((s) => s.id === selectedStudentId || s.studentId === selectedStudentId) || null;
  }, [students, selectedStudentId]);

  const monthlyRecords = useMemo(() => {
    const monthPrefix = String(selectedMonth || '').slice(0, 7);
    if (!monthPrefix) return [];
    const mapSiswaById = new Map();
    const mapSiswaByName = new Map();
    students.forEach((s) => {
      mapSiswaById.set(s.id, s);
      if (s.studentId) mapSiswaById.set(s.studentId, s);
      if (s.nama) mapSiswaByName.set(String(s.nama).trim().toLowerCase(), s);
    });

    const filtered = [];
    const seen = new Set();
    attendance.forEach((a) => {
      const tgl = String(a.tanggal || a.date || '').slice(0, 10);
      if (!tgl.startsWith(monthPrefix)) return;

      const siswaMatch =
        mapSiswaById.get(a.studentId) ||
        mapSiswaById.get(a.studentDocId) ||
        mapSiswaByName.get(String(a.namaSiswa || a.studentName || '').trim().toLowerCase()) ||
        null;

      if (selectedStudentObj) {
        const sid = selectedStudentObj.studentId || selectedStudentObj.id;
        const matchTarget =
          a.studentId === sid ||
          a.studentId === selectedStudentObj.id ||
          a.studentDocId === selectedStudentObj.id ||
          (a.namaSiswa && a.namaSiswa === selectedStudentObj.nama) ||
          (a.studentName && a.studentName === selectedStudentObj.nama);
        if (!matchTarget) return;
      }

      const key = `${tgl}__${a.studentId || a.namaSiswa || a.id}__${a.scheduleId || a.jadwalId || a.mapel || 'umum'}`;
      if (seen.has(key)) return;
      seen.add(key);

      filtered.push({
        ...a,
        tanggalNorm: tgl,
        namaTampil: siswaMatch?.nama || a.namaSiswa || a.studentName || '-',
        kelasTampil: siswaMatch?.kelasSekolah || siswaMatch?.kelas || '-',
      });
    });

    filtered.sort((a, b) => a.tanggalNorm.localeCompare(b.tanggalNorm));
    return filtered;
  }, [attendance, students, selectedMonth, selectedStudentObj]);

  const monthlyStats = useMemo(() => {
    const hadir = monthlyRecords.filter((x) => x.status === 'Hadir').length;
    const izin = monthlyRecords.filter((x) => x.status === 'Izin').length;
    const sakit = monthlyRecords.filter((x) => x.status === 'Sakit').length;
    const alpha = monthlyRecords.filter((x) => x.status === 'Alpha').length;
    const total = monthlyRecords.length;
    const persen = total > 0 ? Math.round((hadir / total) * 100) : 0;
    return { hadir, izin, sakit, alpha, total, persen };
  }, [monthlyRecords]);

  const labelBulanTerpilih = useMemo(() => {
    if (!selectedMonth) return '-';
    const d = new Date(`${selectedMonth}-01T12:00:00`);
    return Number.isNaN(d.getTime())
      ? selectedMonth
      : d.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
  }, [selectedMonth]);

  const handleDownloadPdf = () => {
    const win = window.open('', '_blank', 'width=900,height=720');
    if (!win) {
      return showAlert('⚠️ Izinkan pop-up browser untuk mengunduh / mencetak PDF absensi.');
    }
    const logoUrl = `${window.location.origin}/pwa-192x192.png`;
    const judulSiswa = selectedStudentObj
      ? `${selectedStudentObj.nama} (${selectedStudentObj.kelasSekolah || selectedStudentObj.kelas || '-'})`
      : 'Semua Siswa Aktif';

    const nisSiswa = selectedStudentObj ? (selectedStudentObj.studentId || selectedStudentObj.id || '-') : '-';
    const kelasSiswa = selectedStudentObj ? (selectedStudentObj.kelasSekolah || selectedStudentObj.kelas || '-') : 'Semua Kelas';
    const programSiswa = selectedStudentObj ? (selectedStudentObj.kategori || selectedStudentObj.program || 'Reguler') : '-';
    const namaOrtu = selectedStudentObj
      ? (selectedStudentObj.ortu?.ayah && selectedStudentObj.ortu?.ayah !== '-'
        ? selectedStudentObj.ortu.ayah
        : selectedStudentObj.ortu?.ibu && selectedStudentObj.ortu?.ibu !== '-'
        ? selectedStudentObj.ortu.ibu
        : 'Orang Tua / Wali')
      : 'Orang Tua / Wali';
    const hpOrtu = selectedStudentObj ? (selectedStudentObj.ortu?.hp || selectedStudentObj.noHp || '-') : '-';

    const compactMode = monthlyRecords.length > 15;
    const cellPad = compactMode ? '4px 6px' : '6px 8px';
    const fontSizeTbl = compactMode ? '10px' : '11px';

    const rowsHtml = monthlyRecords.length === 0
      ? `<tr><td colspan="6" style="text-align:center;padding:18px;color:#64748b;">Tidak ada catatan absensi pada periode ${labelBulanTerpilih}.</td></tr>`
      : monthlyRecords.map((r, i) => `
          <tr>
            <td style="text-align:center;">${i + 1}</td>
            <td>${formatTanggalPanjang(r.tanggalNorm)}</td>
            <td><strong>${r.namaTampil}</strong>${!selectedStudentObj ? `<br/><span style="font-size:9px;color:#64748b;">${r.kelasTampil}</span>` : ''}</td>
            <td>${r.mapel || 'Umum'}</td>
            <td style="text-align:center;font-weight:700;">${r.status || '-'}</td>
            <td>${r.keterangan && r.keterangan !== '-' ? r.keterangan : '-'}</td>
          </tr>
        `).join('');

    const tanggalCetak = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });

    win.document.write(`<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Laporan Kehadiran ${labelBulanTerpilih} - ${judulSiswa}</title>
  <style>
    @page { size: A4 portrait; margin: 9mm 11mm; }
    body { font-family: Arial, Helvetica, sans-serif; color: #0f172a; margin: 0; padding: 0; }
    .kop { display: flex; align-items: center; gap: 14px; border-bottom: 3px double #0f766e; padding-bottom: 8px; margin-bottom: 10px; }
    .kop-logo { width: 52px; height: 52px; border-radius: 50%; border: 2px solid #0f766e; object-fit: cover; }
    .kop-text { flex: 1; text-align: center; }
    .kop-instansi { font-size: 16px; font-weight: 900; color: #0f766e; letter-spacing: 0.6px; text-transform: uppercase; }
    .kop-judul { font-size: 12px; font-weight: 800; color: #0f172a; margin-top: 2px; }
    .kop-sub { font-size: 9.5px; color: #475569; margin-top: 2px; }
    .identitas { display: grid; grid-template-columns: 1fr 1fr; gap: 4px 16px; background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 6px; padding: 8px 12px; margin-bottom: 10px; font-size: 11px; }
    .summary { display: flex; gap: 8px; margin-bottom: 10px; }
    .sum-box { flex: 1; border: 1px solid #cbd5e1; border-radius: 6px; padding: 5px 6px; text-align: center; background: #ffffff; }
    .sum-box small { display: block; font-size: 9px; color: #64748b; font-weight: 700; text-transform: uppercase; }
    .sum-box strong { font-size: 14px; color: #0f172a; }
    table { width: 100%; border-collapse: collapse; font-size: ${fontSizeTbl}; }
    th { background: #0f766e; color: #ffffff; padding: ${cellPad}; text-align: left; font-size: ${fontSizeTbl}; }
    td { border-bottom: 1px solid #e2e8f0; padding: ${cellPad}; vertical-align: middle; }
    tr:nth-child(even) td { background: #f8fafc; }
    .ttd-grid { display: flex; justify-content: space-between; margin-top: 16px; padding: 0 12px; page-break-inside: avoid; font-size: 11px; }
    .ttd-box { width: 210px; text-align: center; }
    .ttd-space { height: 48px; }
    .ttd-line { border-top: 1px solid #0f172a; padding-top: 4px; font-weight: 700; }
    @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
  </style>
</head>
<body>
  <div class="kop">
    <img src="${logoUrl}" alt="Logo Bimbel Gemilang" class="kop-logo" />
    <div class="kop-text">
      <div class="kop-instansi">Lembaga Bimbingan Belajar Gemilang</div>
      <div class="kop-judul">LAPORAN RESMI KEHADIRAN SISWA — PERIODE ${labelBulanTerpilih.toUpperCase()}</div>
      <div class="kop-sub">Portal Administrasi &amp; Akademik Bimbel Gemilang • Dicetak pada ${tanggalCetak}</div>
    </div>
    <div style="width:52px;"></div>
  </div>

  <div class="identitas">
    <div><strong>Nama Siswa:</strong> ${selectedStudentObj ? selectedStudentObj.nama : 'Semua Siswa Aktif'}</div>
    <div><strong>NIS / ID Siswa:</strong> ${nisSiswa}</div>
    <div><strong>Kelas / Jenjang:</strong> ${kelasSiswa}</div>
    <div><strong>Program Belajar:</strong> ${programSiswa}</div>
    <div><strong>Orang Tua / Wali:</strong> ${namaOrtu}</div>
    <div><strong>No. HP / WA:</strong> ${hpOrtu}</div>
  </div>

  <div class="summary">
    <div class="sum-box"><small>Hadir</small><strong>${monthlyStats.hadir}</strong></div>
    <div class="sum-box"><small>Izin</small><strong>${monthlyStats.izin}</strong></div>
    <div class="sum-box"><small>Sakit</small><strong>${monthlyStats.sakit}</strong></div>
    <div class="sum-box"><small>Alpha</small><strong>${monthlyStats.alpha}</strong></div>
    <div class="sum-box"><small>Total Sesi</small><strong>${monthlyStats.total}</strong></div>
    <div class="sum-box"><small>Kehadiran</small><strong>${monthlyStats.persen}%</strong></div>
  </div>

  <table>
    <thead>
      <tr>
        <th style="width:28px;text-align:center;">No</th>
        <th>Hari &amp; Tanggal</th>
        <th>Nama Siswa</th>
        <th>Mapel / Sesi</th>
        <th style="width:64px;text-align:center;">Status</th>
        <th>Keterangan</th>
      </tr>
    </thead>
    <tbody>${rowsHtml}</tbody>
  </table>

  <div class="ttd-grid">
    <div class="ttd-box">
      <div>Mengetahui,</div>
      <div>Orang Tua / Wali Siswa</div>
      <div class="ttd-space"></div>
      <div class="ttd-line">( ${namaOrtu} )</div>
    </div>
    <div class="ttd-box">
      <div>Dicetak pada ${tanggalCetak}</div>
      <div>Admin yang Mencetak,</div>
      <div class="ttd-space"></div>
      <div class="ttd-line">( ${adminName} )</div>
    </div>
  </div>

  <script>window.onload = function(){ setTimeout(function(){ window.print(); }, 300); };</script>
</body>
</html>`);
    win.document.close();
  };

  // ============================================================
  // 🖨️ ABSENSI OFFLINE MINGGUAN (F4 LANDSCAPE • 1 HALAMAN PENUH)
  // ============================================================
  const offlineWeekDays = useMemo(() => {
    const base = new Date(`${offlineWeekDate || toISODate(new Date())}T12:00:00`);
    const day = base.getDay(); // 0=Min..6=Sab
    const diffSenin = day === 0 ? -6 : 1 - day;
    const senin = new Date(base.getFullYear(), base.getMonth(), base.getDate() + diffSenin, 12, 0, 0);
    return Array.from({ length: 6 }, (_, i) => {
      const d = new Date(senin.getFullYear(), senin.getMonth(), senin.getDate() + i, 12, 0, 0);
      return {
        iso: toISODate(d),
        hariPendek: d.toLocaleDateString('id-ID', { weekday: 'short' }),
        tglPendek: `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`,
        panjang: d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }),
      };
    });
  }, [offlineWeekDate]);

  const uniqueKelasOptions = useMemo(() => {
    const set = new Set();
    students.forEach((s) => {
      const k = String(s.kelasSekolah || s.kelas || '').trim();
      if (k) set.add(k);
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b, 'id', { numeric: true }));
  }, [students]);

  const selectedScheduleObj = useMemo(() => {
    if (!offlineScheduleId) return null;
    return schedules.find((sch) => sch.id === offlineScheduleId) || null;
  }, [schedules, offlineScheduleId]);

  const offlineCandidateStudents = useMemo(() => {
    if (offlineSource === 'jadwal' && selectedScheduleObj) {
      const sch = selectedScheduleObj;
      const arrMatch = (arr) =>
        Array.isArray(arr)
          ? arr.map((x) => (typeof x === 'string' ? x : (x?.id || x?.studentId || x?.nama || ''))).filter(Boolean)
          : [];
      const targetIds = new Set([
        ...(Array.isArray(sch.studentIds) ? sch.studentIds : []),
        ...arrMatch(sch.students),
        ...arrMatch(sch.siswa),
      ]);
      const byExplicit = students.filter(
        (s) => targetIds.has(s.id) || (s.studentId && targetIds.has(s.studentId)) || (s.nama && targetIds.has(s.nama))
      );
      if (byExplicit.length > 0) return byExplicit;

      const klsTarget = String(sch.targetKelas || sch.kelas || sch.grade || '').trim().toLowerCase();
      if (klsTarget) {
        return students.filter((s) => {
          const sk = String(s.kelasSekolah || s.kelas || '').trim().toLowerCase();
          return sk === klsTarget || sk.includes(klsTarget) || klsTarget.includes(sk);
        });
      }
      return [];
    }

    if (offlineKelas === 'SEMUA') return students;
    return students.filter((s) => {
      const sk = String(s.kelasSekolah || s.kelas || '').trim();
      return sk === offlineKelas;
    });
  }, [offlineSource, selectedScheduleObj, offlineKelas, students]);

  const offlineFinalStudents = useMemo(() => {
    const excl = new Set(offlineExcludedIds);
    return offlineCandidateStudents.filter((s) => !excl.has(s.id));
  }, [offlineCandidateStudents, offlineExcludedIds]);

  const shiftOfflineWeek = (deltaDays) => {
    const d = new Date(`${offlineWeekDate}T12:00:00`);
    d.setDate(d.getDate() + deltaDays);
    setOfflineWeekDate(toISODate(d));
  };

  const handleDownloadOfflineF4 = () => {
    if (offlineFinalStudents.length === 0) {
      return showAlert('⚠️ Tidak ada siswa terpilih untuk dicetak!');
    }
    const win = window.open('', '_blank', 'width=1150,height=720');
    if (!win) {
      return showAlert('⚠️ Izinkan pop-up browser untuk mencetak Absensi Offline F4.');
    }
    const logoUrl = `${window.location.origin}/pwa-192x192.png`;
    const kelasJudul =
      offlineLabelRombel.trim() ||
      (offlineSource === 'jadwal' && selectedScheduleObj
        ? `${selectedScheduleObj.title || selectedScheduleObj.mapelName || 'Jadwal'} (${selectedScheduleObj.targetKelas || selectedScheduleObj.kelas || '-'})`
        : offlineKelas === 'SEMUA'
        ? 'Semua Kelas'
        : offlineKelas);
    const tentorJudul =
      offlineTentor.trim() ||
      (offlineSource === 'jadwal' && selectedScheduleObj ? selectedScheduleObj.teacherName || '-' : '-');
    const rentangMinggu = `${offlineWeekDays[0].panjang} – ${offlineWeekDays[5].panjang}`;
    const tanggalCetak = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });

    // Skala otomatis agar seluruh siswa muat dalam 1 halaman F4 Landscape
    const n = offlineFinalStudents.length;
    const rowFont = n <= 16 ? '10.5px' : n <= 24 ? '9.5px' : n <= 32 ? '8.5px' : '7.5px';
    const rowPad = n <= 16 ? '6px 5px' : n <= 24 ? '4px 5px' : n <= 32 ? '3px 4px' : '2px 4px';
    const rowMinH = n <= 16 ? '24px' : n <= 24 ? '20px' : n <= 32 ? '16px' : '13px';

    const dayHeadersHtml = offlineWeekDays
      .map(
        (d) => `
          <th style="text-align:center;width:10%;">
            <div>${d.hariPendek}</div>
            <div style="font-size:8.5px;font-weight:600;opacity:0.9;">${d.tglPendek}</div>
            <div style="font-size:7.5px;font-weight:400;opacity:0.85;">Paraf Siswa</div>
          </th>`
      )
      .join('');

    const rowsHtml = offlineFinalStudents
      .map(
        (s, idx) => `
          <tr>
            <td style="text-align:center;font-weight:700;">${idx + 1}</td>
            <td style="font-family:monospace;white-space:nowrap;">${s.studentId || s.id}</td>
            <td style="font-weight:700;">${s.nama || '-'}</td>
            <td style="text-align:center;white-space:nowrap;">${s.kelasSekolah || s.kelas || '-'}</td>
            ${offlineWeekDays.map(() => `<td style="height:${rowMinH};"></td>`).join('')}
            <td></td>
          </tr>`
      )
      .join('');

    win.document.write(`<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Absensi Offline F4 - ${kelasJudul} (${rentangMinggu})</title>
  <style>
    @page { size: 330mm 215mm landscape; margin: 5mm 7mm; }
    * { box-sizing: border-box; }
    body { font-family: Arial, Helvetica, sans-serif; color: #0f172a; margin: 0; padding: 0; }
    .kop { display: flex; align-items: center; justify-content: space-between; border-bottom: 2.5px solid #0f766e; padding-bottom: 5px; margin-bottom: 6px; }
    .kop-left { display: flex; align-items: center; gap: 10px; }
    .kop-logo { width: 42px; height: 42px; border-radius: 50%; border: 1.5px solid #0f766e; object-fit: cover; }
    .kop-brand { font-size: 14px; font-weight: 900; color: #0f766e; letter-spacing: 0.5px; text-transform: uppercase; }
    .kop-sub { font-size: 10.5px; font-weight: 800; color: #0f172a; }
    .kop-meta { text-align: right; font-size: 9.5px; line-height: 1.45; color: #334155; }
    table { width: 100%; border-collapse: collapse; font-size: ${rowFont}; }
    th, td { border: 1px solid #334155; padding: ${rowPad}; vertical-align: middle; }
    th { background: #0f766e; color: #ffffff; font-size: 9.5px; }
    tr:nth-child(even) td { background: #f8fafc; }
    .validasi { display: flex; justify-content: space-between; align-items: flex-end; margin-top: 8px; font-size: 9.5px; page-break-inside: avoid; }
    .ttd-col { width: 220px; text-align: center; }
    .ttd-space { height: 28px; }
    .ttd-line { border-top: 1px solid #0f172a; padding-top: 2px; font-weight: 700; }
    @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
  </style>
</head>
<body>
  <div class="kop">
    <div class="kop-left">
      <img src="${logoUrl}" alt="Logo" class="kop-logo" />
      <div>
        <div class="kop-brand">Lembaga Bimbingan Belajar Gemilang</div>
        <div class="kop-sub">DAFTAR HADIR OFFLINE MINGGUAN SISWA (VALIDASI DUA ARAH)</div>
      </div>
    </div>
    <div class="kop-meta">
      <div><strong>Kelas / Jadwal:</strong> ${kelasJudul} &nbsp;|&nbsp; <strong>Total:</strong> ${offlineFinalStudents.length} Siswa</div>
      <div><strong>Periode Minggu:</strong> ${rentangMinggu} &nbsp;|&nbsp; <strong>Tentor:</strong> ${tentorJudul}</div>
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th style="width:26px;text-align:center;">No</th>
        <th style="width:11%;text-align:left;">NIS / ID Siswa</th>
        <th style="width:19%;text-align:left;">Nama Lengkap Siswa</th>
        <th style="width:7%;text-align:center;">Kelas</th>
        ${dayHeadersHtml}
        <th style="width:8%;text-align:center;">Ket.</th>
      </tr>
    </thead>
    <tbody>
      ${rowsHtml}
    </tbody>
  </table>

  <div class="validasi">
    <div class="ttd-col">
      <div>Validasi Tentor Pengajar,</div>
      <div class="ttd-space"></div>
      <div class="ttd-line">( ${tentorJudul !== '-' ? tentorJudul : '________________________'} )</div>
    </div>
    <div style="text-align:center;color:#475569;font-size:8.5px;max-width:340px;">
      <strong>Validasi Dua Arah:</strong> Tentor mengabsen di aplikasi &amp; siswa wajib menandatangani kolom hari hadir di atas. Lembar ini dibagikan &amp; direkap oleh Admin.
    </div>
    <div class="ttd-col">
      <div>Dicetak ${tanggalCetak} • Admin,</div>
      <div class="ttd-space"></div>
      <div class="ttd-line">( ${adminName} )</div>
    </div>
  </div>

  <script>window.onload = function(){ setTimeout(function(){ window.print(); }, 300); };</script>
</body>
</html>`);
    win.document.close();
  };

  // ============================================================
  // 🪪 KARTU BIMBINGAN SISWA (F4 LANDSCAPE • 20 PERTEMUAN / 1 HALAMAN)
  // ============================================================
  const kartuStudentObj = useMemo(() => {
    if (!kartuStudentId) return null;
    return students.find((s) => s.id === kartuStudentId || s.studentId === kartuStudentId) || null;
  }, [students, kartuStudentId]);

  const kartuRows20 = useMemo(() => {
    const byKe = new Map();
    if (kartuStudentObj) {
      const sid = kartuStudentObj.studentId || kartuStudentObj.id;
      kartuEntries.forEach((e) => {
        const match =
          e.studentDocId === kartuStudentObj.id ||
          e.studentId === sid ||
          e.studentId === kartuStudentObj.id;
        if (match && e.pertemuanKe) {
          byKe.set(Number(e.pertemuanKe), e);
        }
      });
    }
    return Array.from({ length: 25 }, (_, i) => {
      const no = i + 1;
      return { no, entry: byKe.get(no) || null };
    });
  }, [kartuStudentObj, kartuEntries]);

  const handleDownloadKartuBimbinganF4 = () => {
    const win = window.open('', '_blank', 'width=1180,height=740');
    if (!win) {
      return showAlert('⚠️ Izinkan pop-up browser untuk mencetak Kartu Bimbingan F4.');
    }
    const logoUrl = `${window.location.origin}/pwa-192x192.png`;
    const namaSiswa = kartuStudentObj ? kartuStudentObj.nama : '________________________________________';
    const nisSiswa = kartuStudentObj ? (kartuStudentObj.studentId || kartuStudentObj.id) : '____________________';
    const kelasSiswa = kartuStudentObj ? (kartuStudentObj.kelasSekolah || kartuStudentObj.kelas || '-') : '__________';
    const programSiswa = kartuStudentObj ? (kartuStudentObj.kategori || kartuStudentObj.program || 'Reguler') : '__________';
    const namaOrtu = kartuStudentObj
      ? (kartuStudentObj.ortu?.ayah && kartuStudentObj.ortu?.ayah !== '-'
        ? kartuStudentObj.ortu.ayah
        : kartuStudentObj.ortu?.ibu && kartuStudentObj.ortu?.ibu !== '-'
        ? kartuStudentObj.ortu.ibu
        : 'Orang Tua / Wali')
      : 'Orang Tua / Wali';
    const hpOrtu = kartuStudentObj ? (kartuStudentObj.ortu?.hp || kartuStudentObj.noHp || '-') : '-';
    const tanggalCetak = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });

    const rowsHtml = kartuRows20
      .map(({ no, entry }) => {
        if (!entry) {
          return `
            <tr>
              <td style="text-align:center;font-weight:700;">${no}</td>
              <td></td>
              <td></td>
              <td style="text-align:center;font-size:8px;color:#64748b;">☐ Paham &nbsp; ☐ Ulang</td>
              <td></td>
              <td></td>
              <td></td>
              <td></td>
            </tr>`;
        }
        const parafHtml = entry.parafTentor
          ? `<span style="color:#166534;font-weight:800;">✓ Sah</span>`
          : `<span style="color:#b91c1c;font-weight:900;">KOSONG (DITAHAN)</span>`;
        return `
          <tr>
            <td style="text-align:center;font-weight:700;">${no}</td>
            <td style="white-space:nowrap;">${entry.tanggal || '-'}</td>
            <td><strong>${entry.mapel || ''}</strong>${entry.babMateri ? ` — ${entry.babMateri}` : ''}</td>
            <td style="text-align:center;">${entry.pemahaman || '-'}</td>
            <td>${entry.namaTentor || '-'}</td>
            <td style="text-align:center;">${parafHtml}</td>
            <td style="color:${entry.parafTentor ? '#334155' : '#b91c1c'};">${entry.alasanKosong || (entry.sikap !== 'Tertib & Fokus' ? entry.sikap : '-')}</td>
            <td></td>
          </tr>`;
      })
      .join('');

    win.document.write(`<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Kartu Kendali Bimbingan 25 Pertemuan - ${namaSiswa}</title>
  <style>
    @page { size: 330mm 215mm landscape; margin: 4mm 6mm; }
    * { box-sizing: border-box; }
    body { font-family: Arial, Helvetica, sans-serif; color: #0f172a; margin: 0; padding: 0; }
    .kop { display: flex; align-items: center; justify-content: space-between; border-bottom: 2.5px solid #0f766e; padding-bottom: 4px; margin-bottom: 4px; }
    .kop-left { display: flex; align-items: center; gap: 10px; }
    .kop-logo { width: 38px; height: 38px; border-radius: 50%; border: 1.5px solid #0f766e; object-fit: cover; }
    .kop-brand { font-size: 13px; font-weight: 900; color: #0f766e; text-transform: uppercase; letter-spacing: 0.4px; }
    .kop-sub { font-size: 9.8px; font-weight: 800; color: #0f172a; }
    .identitas { display: grid; grid-template-columns: repeat(3, 1fr); gap: 2px 14px; background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 5px; padding: 4px 10px; margin-bottom: 4px; font-size: 9.2px; }
    table { width: 100%; border-collapse: collapse; font-size: 8.4px; }
    th, td { border: 1px solid #334155; padding: 2.3px 5px; vertical-align: middle; }
    th { background: #0f766e; color: #ffffff; font-size: 8.5px; text-align: left; }
    td { height: 15.5px; }
    tr:nth-child(even) td { background: #f8fafc; }
    .validasi { display: flex; justify-content: space-between; align-items: flex-end; margin-top: 5px; font-size: 8.8px; page-break-inside: avoid; }
    .ttd-col { width: 230px; text-align: center; }
    .ttd-space { height: 22px; }
    .ttd-line { border-top: 1px solid #0f172a; padding-top: 2px; font-weight: 700; }
    @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
  </style>
</head>
<body>
  <div class="kop">
    <div class="kop-left">
      <img src="${logoUrl}" alt="Logo" class="kop-logo" />
      <div>
        <div class="kop-brand">Lembaga Bimbingan Belajar Gemilang</div>
        <div class="kop-sub">KARTU KENDALI BIMBINGAN, PEMAHAMAN MATERI &amp; VALIDASI PARAF (25 PERTEMUAN)</div>
      </div>
    </div>
    <div style="text-align:right;font-size:9px;color:#334155;">
      <div><strong>Format:</strong> F4 Landscape</div>
      <div><strong>Dicetak:</strong> ${tanggalCetak}</div>
    </div>
  </div>

  <div class="identitas">
    <div><strong>Nama Siswa:</strong> ${namaSiswa}</div>
    <div><strong>NIS / ID Siswa:</strong> ${nisSiswa}</div>
    <div><strong>Kelas / Jenjang:</strong> ${kelasSiswa}</div>
    <div><strong>Program:</strong> ${programSiswa}</div>
    <div><strong>Orang Tua / Wali:</strong> ${namaOrtu}</div>
    <div><strong>No. HP Ortu:</strong> ${hpOrtu}</div>
  </div>

  <table>
    <thead>
      <tr>
        <th style="width:24px;text-align:center;">No</th>
        <th style="width:8.5%;">Tanggal</th>
        <th style="width:24%;">Mapel, Bab &amp; Materi Hari Ini</th>
        <th style="width:11%;text-align:center;">Pemahaman</th>
        <th style="width:11%;">Nama Tentor</th>
        <th style="width:10%;text-align:center;">Paraf Tentor</th>
        <th style="width:21%;">Catatan</th>
        <th style="width:11%;text-align:center;">Paraf Ortu</th>
      </tr>
    </thead>
    <tbody>${rowsHtml}</tbody>
  </table>

  <div class="validasi">
    <div class="ttd-col">
      <div>Validasi Akhir Orang Tua / Wali,</div>
      <div class="ttd-space"></div>
      <div class="ttd-line">( ${namaOrtu} )</div>
    </div>
    <div style="text-align:center;color:#475569;font-size:8px;max-width:420px;line-height:1.35;">
      <strong>Aturan Kartu Kendali:</strong> Tentor berhak <b>tidak memberikan paraf</b> apabila siswa ramai, tidak respek, atau belum menuntaskan pemahaman materi. Orang tua wajib memeriksa kolom alasan dan membubuhkan paraf validasi kedua.
    </div>
    <div class="ttd-col">
      <div>Validasi Terakhir Admin,</div>
      <div class="ttd-space"></div>
      <div class="ttd-line">( ${adminName} )</div>
    </div>
  </div>

  <script>window.onload = function(){ setTimeout(function(){ window.print(); }, 300); };</script>
</body>
</html>`);
    win.document.close();
  };

  const openEdit = (row) => {
    setEditRow({
      studentId: row.studentKey,
      docStudentId: row.student.id,
      nama: row.student.nama || '',
      status: row.status === 'Belum' ? 'Hadir' : row.status,
      keterangan: row.keterangan === '-' ? '' : row.keterangan || '',
      mapel: row.mapel || 'Umum',
      existingId: row.main?.id || null,
    });
  };

  const saveEdit = async (e) => {
    e.preventDefault();
    if (!editRow) return;
    setSaving(true);
    try {
      const payload = {
        studentId: editRow.studentId,
        namaSiswa: editRow.nama,
        tanggal: selectedDate,
        mapel: editRow.mapel || 'Umum',
        status: editRow.status,
        keterangan: editRow.keterangan || '-',
      };
      if (editRow.existingId) {
        await updateDoc(doc(db, 'attendance', editRow.existingId), payload);
        showAlert('✅ Absensi diperbarui');
      } else {
        await addDoc(collection(db, 'attendance'), {
          ...payload,
          createdAt: serverTimestamp(),
        });
        showAlert('✅ Absensi ditambahkan');
      }
      setEditRow(null);
      await fetchAll();
    } catch (err) {
      console.error(err);
      showAlert('❌ Gagal menyimpan');
    } finally {
      setSaving(false);
    }
  };

  const removeRecord = async (id) => {
    if (!window.confirm('Hapus catatan absensi ini?')) return;
    try {
      await deleteDoc(doc(db, 'attendance', id));
      showAlert('🗑️ Dihapus');
      await fetchAll();
    } catch {
      showAlert('❌ Gagal hapus');
    }
  };

  const setQuickStatus = async (row, status) => {
    setSaving(true);
    try {
      const payload = {
        studentId: row.studentKey,
        namaSiswa: row.student.nama || '',
        tanggal: selectedDate,
        mapel: row.mapel || 'Umum',
        status,
        keterangan: row.keterangan || (status === 'Hadir' ? 'Input admin' : '-'),
      };
      if (row.main?.id) {
        await updateDoc(doc(db, 'attendance', row.main.id), payload);
      } else {
        await addDoc(collection(db, 'attendance'), {
          ...payload,
          createdAt: serverTimestamp(),
        });
      }
      await fetchAll();
    } catch (e) {
      console.error(e);
      showAlert('❌ Gagal update status');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f8fafc' }}>
      <SidebarAdmin />
      <div
        style={{
          flex: 1,
          marginLeft: isMobile ? 0 : 216,
          padding: isMobile ? '70px 12px 24px' : '24px 28px',
          boxSizing: 'border-box',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8, flexWrap: 'wrap' }}>
          <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: '#1e293b' }}>
            📋 Manajemen Absensi Siswa
          </h2>
          <button type="button" style={styles.refreshBtn} onClick={fetchAll} disabled={loading}>
            <RefreshCw size={14} /> Refresh
          </button>
        </div>
        <p style={{ color: '#64748b', fontSize: 13, marginTop: 0, marginBottom: 14 }}>
          Kelola absensi harian atau cek riwayat bulanan siswa (termasuk bulan-bulan sebelumnya) dan unduh laporan PDF resmi.
        </p>

        {/* Tab Mode: Harian vs Rekap Bulanan & Download PDF */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={() => setModeTab('harian')}
            style={{
              padding: '9px 16px',
              borderRadius: 10,
              border: 'none',
              fontWeight: 800,
              fontSize: 13,
              cursor: 'pointer',
              background: modeTab === 'harian' ? '#0f766e' : '#e2e8f0',
              color: modeTab === 'harian' ? '#ffffff' : '#334155',
            }}
          >
            📅 Absensi Harian
          </button>
          <button
            type="button"
            onClick={() => setModeTab('bulanan')}
            style={{
              padding: '9px 16px',
              borderRadius: 10,
              border: 'none',
              fontWeight: 800,
              fontSize: 13,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              background: modeTab === 'bulanan' ? '#0f766e' : '#e2e8f0',
              color: modeTab === 'bulanan' ? '#ffffff' : '#334155',
            }}
          >
            <FileText size={15} /> Rekap Bulanan &amp; Download PDF
          </button>
          <button
            type="button"
            onClick={() => setModeTab('offline_f4')}
            style={{
              padding: '9px 16px',
              borderRadius: 10,
              border: 'none',
              fontWeight: 800,
              fontSize: 13,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              background: modeTab === 'offline_f4' ? '#0f766e' : '#e2e8f0',
              color: modeTab === 'offline_f4' ? '#ffffff' : '#334155',
            }}
          >
            <Printer size={15} /> Absensi Offline (F4 Landscape)
          </button>
          <button
            type="button"
            onClick={() => setModeTab('kartu_bimbingan')}
            style={{
              padding: '9px 16px',
              borderRadius: 10,
              border: 'none',
              fontWeight: 800,
              fontSize: 13,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              background: modeTab === 'kartu_bimbingan' ? '#0f766e' : '#e2e8f0',
              color: modeTab === 'kartu_bimbingan' ? '#ffffff' : '#334155',
            }}
          >
            🪪 Kartu Bimbingan (F4 25 Pertemuan)
          </button>
        </div>

        {alertMsg && (
          <div style={styles.alert}>{alertMsg}</div>
        )}

        {modeTab === 'kartu_bimbingan' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 12, padding: '12px 16px', fontSize: 12.5, color: '#1e3a8a', lineHeight: 1.5 }}>
              <b>🪪 Kartu Kendali Bimbingan Siswa (Adaptasi Kartu Bimbingan Dosen — F4 Landscape 25 Pertemuan):</b> Menggabungkan catatan materi &amp; pemahaman siswa, kewenangan <b>Paraf Tentor</b> (bisa dikosongkan jika siswa ramai/tidak respek + alasan), <b>Paraf Orang Tua</b>, dan <b>Validasi Terakhir Admin</b> dalam 1 lembar F4.
            </div>

            <div style={{ ...styles.toolbar, background: '#ffffff', padding: 14, borderRadius: 12, border: '1px solid #e2e8f0' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, minWidth: 260 }}>
                <label style={{ fontSize: 12.5, fontWeight: 700, color: '#334155' }}>Pilih Siswa:</label>
                <select
                  value={kartuStudentId}
                  onChange={(e) => setKartuStudentId(e.target.value)}
                  style={{ ...styles.select, flex: 1, maxWidth: 380 }}
                >
                  <option value="">-- Blangko Kosong (25 Pertemuan) / Pilih Siswa --</option>
                  {students.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.nama} ({s.kelasSekolah || s.kelas || '-'}) — {s.studentId || s.id}
                    </option>
                  ))}
                </select>
              </div>
              <button
                type="button"
                onClick={handleDownloadKartuBimbinganF4}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  background: '#0d9488', color: '#ffffff', border: 'none', borderRadius: 10,
                  padding: '9px 18px', fontWeight: 800, fontSize: 13, cursor: 'pointer',
                }}
              >
                <Printer size={16} /> Cetak / Download F4 Landscape (25 Pertemuan)
              </button>
            </div>

            <div style={{ background: '#ffffff', borderRadius: 14, border: '1px solid #e2e8f0', overflowX: 'auto' }}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>Ke</th>
                    <th style={styles.th}>Tanggal</th>
                    <th style={styles.th}>Mapel, Bab &amp; Materi</th>
                    <th style={styles.th}>Pemahaman</th>
                    <th style={styles.th}>Nama Tentor</th>
                    <th style={styles.th}>Paraf Tentor</th>
                    <th style={styles.th}>Alasan / Catatan</th>
                  </tr>
                </thead>
                <tbody>
                  {kartuRows20.map(({ no, entry }) => (
                    <tr key={no}>
                      <td style={{ ...styles.td, fontWeight: 700 }}>#{no}</td>
                      <td style={styles.td}>{entry?.tanggal || '-'}</td>
                      <td style={styles.td}>
                        {entry ? <><strong>{entry.mapel}</strong> — {entry.babMateri}</> : <span style={{ color: '#94a3b8' }}>Kosong (siap diisi)</span>}
                      </td>
                      <td style={styles.td}>{entry?.pemahaman || '-'}</td>
                      <td style={styles.td}>{entry?.namaTentor || '-'}</td>
                      <td style={styles.td}>
                        {!entry ? '-' : entry.parafTentor ? (
                          <span style={{ ...styles.badge, background: '#dcfce7', color: '#166534' }}>✓ Sah</span>
                        ) : (
                          <span style={{ ...styles.badge, background: '#fee2e2', color: '#b91c1c' }}>DITAHAN</span>
                        )}
                      </td>
                      <td style={{ ...styles.td, color: entry && !entry.parafTentor ? '#b91c1c' : '#475569' }}>
                        {entry?.alasanKosong || entry?.sikap || '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {modeTab === 'offline_f4' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ background: '#f0fdfa', border: '1px solid #99f6e4', borderRadius: 12, padding: '12px 16px', fontSize: 12.5, color: '#134e4a', lineHeight: 1.5 }}>
              <b>🖨️ Lembar Absensi Offline Mingguan (F4 Landscape • Validasi Dua Arah):</b> Admin mencetak daftar hadir mingguan (Senin–Sabtu) berisi NIS, Nama Lengkap, dan kolom tanda tangan siswa untuk divalidasi bersama absensi tentor. Margin tipis &amp; skala otomatis agar seluruh siswa muat dalam <b>1 halaman F4</b>.
            </div>

            {/* Kontrol Periode Minggu & Sumber Siswa */}
            <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 14, padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 12.5, fontWeight: 800, color: '#334155' }}>Periode Minggu:</span>
                <button type="button" style={styles.navBtn} onClick={() => shiftOfflineWeek(-7)} title="Minggu lalu">
                  <ChevronLeft size={16} />
                </button>
                <input
                  type="date"
                  value={offlineWeekDate}
                  onChange={(e) => setOfflineWeekDate(e.target.value)}
                  style={{ padding: '7px 10px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 13 }}
                />
                <button type="button" style={styles.navBtn} onClick={() => shiftOfflineWeek(7)} title="Minggu depan">
                  <ChevronRight size={16} />
                </button>
                <button type="button" style={styles.todayBtn} onClick={() => setOfflineWeekDate(toISODate(new Date()))}>
                  Minggu Ini
                </button>
                <span style={{ fontSize: 12.5, fontWeight: 800, color: '#0f766e', background: '#ccfbf1', padding: '4px 10px', borderRadius: 99 }}>
                  {offlineWeekDays[0]?.panjang} – {offlineWeekDays[5]?.panjang}
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#475569', marginBottom: 4 }}>
                    Ambil Daftar Siswa Dari:
                  </label>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button
                      type="button"
                      onClick={() => { setOfflineSource('kelas'); setOfflineExcludedIds([]); }}
                      style={{
                        flex: 1, padding: '8px 10px', borderRadius: 8, fontSize: 12.5, fontWeight: 700, cursor: 'pointer',
                        border: offlineSource === 'kelas' ? '2px solid #0d9488' : '1px solid #cbd5e1',
                        background: offlineSource === 'kelas' ? '#f0fdfa' : '#ffffff', color: '#0f172a',
                      }}
                    >
                      🎓 Jenjang / Kelas
                    </button>
                    <button
                      type="button"
                      onClick={() => { setOfflineSource('jadwal'); setOfflineExcludedIds([]); }}
                      style={{
                        flex: 1, padding: '8px 10px', borderRadius: 8, fontSize: 12.5, fontWeight: 700, cursor: 'pointer',
                        border: offlineSource === 'jadwal' ? '2px solid #0d9488' : '1px solid #cbd5e1',
                        background: offlineSource === 'jadwal' ? '#f0fdfa' : '#ffffff', color: '#0f172a',
                      }}
                    >
                      🗓️ Jadwal Admin ({schedules.length})
                    </button>
                  </div>
                </div>

                {offlineSource === 'kelas' ? (
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#475569', marginBottom: 4 }}>
                      Pilih Kelas:
                    </label>
                    <select
                      value={offlineKelas}
                      onChange={(e) => { setOfflineKelas(e.target.value); setOfflineExcludedIds([]); }}
                      style={{ ...styles.select, width: '100%' }}
                    >
                      <option value="SEMUA">-- Semua Kelas ({students.length} Siswa) --</option>
                      {uniqueKelasOptions.map((k) => (
                        <option key={k} value={k}>{k}</option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#475569', marginBottom: 4 }}>
                      Pilih Jadwal yang Sudah Di-Set Admin:
                    </label>
                    <select
                      value={offlineScheduleId}
                      onChange={(e) => { setOfflineScheduleId(e.target.value); setOfflineExcludedIds([]); }}
                      style={{ ...styles.select, width: '100%' }}
                    >
                      <option value="">-- Pilih Jadwal Bimbel --</option>
                      {schedules.slice(0, 80).map((sch) => (
                        <option key={sch.id} value={sch.id}>
                          {sch.dateStr || '-'} • {sch.title || sch.mapelName || 'Sesi'} ({sch.targetKelas || sch.kelas || 'Umum'}) — {sch.teacherName || '-'}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr auto', gap: 10, alignItems: 'end' }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#475569', marginBottom: 4 }}>
                    Label Kelas / Rombel di Kop (Mis. 9A SMP / 9B SMP):
                  </label>
                  <input
                    type="text"
                    value={offlineLabelRombel}
                    onChange={(e) => setOfflineLabelRombel(e.target.value)}
                    placeholder="Opsional, misal: 9A SMP"
                    style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 13, boxSizing: 'border-box' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#475569', marginBottom: 4 }}>
                    Nama Tentor Pengajar (di Kop &amp; Kolom Validasi):
                  </label>
                  <input
                    type="text"
                    value={offlineTentor}
                    onChange={(e) => setOfflineTentor(e.target.value)}
                    placeholder="Opsional (otomatis jika dari Jadwal)"
                    style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 13, boxSizing: 'border-box' }}
                  />
                </div>
                <button
                  type="button"
                  onClick={handleDownloadOfflineF4}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 6,
                    background: '#0d9488', color: '#ffffff', border: 'none', borderRadius: 10,
                    padding: '10px 18px', fontWeight: 800, fontSize: 13, cursor: 'pointer', whiteSpace: 'nowrap',
                  }}
                >
                  <Printer size={16} /> Download / Cetak F4 ({offlineFinalStudents.length} Siswa)
                </button>
              </div>
            </div>

            {/* Daftar Centang Siswa (Bila kelas dipecah mis. 9A & 9B) */}
            <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 14, padding: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, flexWrap: 'wrap', gap: 8 }}>
                <div style={{ fontSize: 13.5, fontWeight: 800, color: '#0f172a' }}>
                  Daftar Siswa Tercetak ({offlineFinalStudents.length} / {offlineCandidateStudents.length} Terpilih)
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    type="button"
                    onClick={() => setOfflineExcludedIds([])}
                    style={{ fontSize: 11.5, fontWeight: 700, padding: '4px 10px', borderRadius: 8, border: '1px solid #cbd5e1', background: '#f8fafc', cursor: 'pointer' }}
                  >
                    Pilih Semua
                  </button>
                  <button
                    type="button"
                    onClick={() => setOfflineExcludedIds(offlineCandidateStudents.map((s) => s.id))}
                    style={{ fontSize: 11.5, fontWeight: 700, padding: '4px 10px', borderRadius: 8, border: '1px solid #cbd5e1', background: '#f8fafc', cursor: 'pointer' }}
                  >
                    Kosongkan Pilihan
                  </button>
                </div>
              </div>
              {offlineCandidateStudents.length === 0 ? (
                <div style={{ textAlign: 'center', padding: 24, color: '#64748b', fontSize: 13 }}>
                  Tidak ada siswa ditemukan untuk pilihan kelas/jadwal ini.
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 8, maxHeight: 320, overflowY: 'auto' }}>
                  {offlineCandidateStudents.map((s) => {
                    const checked = !offlineExcludedIds.includes(s.id);
                    return (
                      <label
                        key={s.id}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 8, padding: '7px 10px', borderRadius: 8,
                          border: `1px solid ${checked ? '#99f6e4' : '#e2e8f0'}`,
                          background: checked ? '#f0fdfa' : '#f8fafc', cursor: 'pointer', fontSize: 12.5,
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => {
                            setOfflineExcludedIds((prev) =>
                              prev.includes(s.id) ? prev.filter((x) => x !== s.id) : [...prev, s.id]
                            );
                          }}
                        />
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontWeight: 700, color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {s.nama}
                          </div>
                          <div style={{ fontSize: 11, color: '#64748b', fontFamily: 'monospace' }}>
                            {s.studentId || s.id} • {s.kelasSekolah || s.kelas || '-'}
                          </div>
                        </div>
                      </label>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {modeTab === 'bulanan' && (
          <div>
            <div style={{ ...styles.toolbar, background: '#ffffff', padding: 14, borderRadius: 12, border: '1px solid #e2e8f0' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <label style={{ fontSize: 12, fontWeight: 700, color: '#475569' }}>Bulan:</label>
                <input
                  type="month"
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  style={{ padding: '7px 10px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 13 }}
                />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, minWidth: 220 }}>
                <label style={{ fontSize: 12, fontWeight: 700, color: '#475569' }}>Siswa:</label>
                <select
                  value={selectedStudentId}
                  onChange={(e) => setSelectedStudentId(e.target.value)}
                  style={{ ...styles.select, flex: 1, maxWidth: 320 }}
                >
                  <option value="semua">-- Semua Siswa Aktif --</option>
                  {students.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.nama} ({s.kelasSekolah || s.kelas || '-'})
                    </option>
                  ))}
                </select>
              </div>
              <button
                type="button"
                onClick={handleDownloadPdf}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  background: '#0d9488',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: 10,
                  padding: '9px 16px',
                  fontWeight: 800,
                  fontSize: 13,
                  cursor: 'pointer',
                }}
              >
                <Download size={15} /> Download / Cetak PDF
              </button>
            </div>

            <div style={styles.statGrid}>
              {[
                ['Hadir', monthlyStats.hadir, '#22c55e'],
                ['Izin', monthlyStats.izin, '#3b82f6'],
                ['Sakit', monthlyStats.sakit, '#f59e0b'],
                ['Alpha', monthlyStats.alpha, '#ef4444'],
                ['Persentase Hadir', `${monthlyStats.persen}%`, '#0d9488'],
              ].map(([label, val, color]) => (
                <div key={label} style={{ ...styles.statCard, borderLeft: `4px solid ${color}` }}>
                  <small style={{ color: '#64748b', fontWeight: 700 }}>{label}</small>
                  <div style={{ fontSize: 22, fontWeight: 800, color: '#1e293b' }}>{val}</div>
                </div>
              ))}
            </div>

            <div style={{ background: '#ffffff', borderRadius: 14, border: '1px solid #e2e8f0', overflowX: 'auto' }}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>Tanggal</th>
                    <th style={styles.th}>Nama Siswa</th>
                    <th style={styles.th}>Mapel / Sesi</th>
                    <th style={styles.th}>Status</th>
                    <th style={styles.th}>Keterangan</th>
                  </tr>
                </thead>
                <tbody>
                  {monthlyRecords.length === 0 ? (
                    <tr>
                      <td colSpan={5} style={{ textAlign: 'center', padding: 28, color: '#64748b' }}>
                        Belum ada catatan kehadiran untuk periode <b>{labelBulanTerpilih}</b>.
                      </td>
                    </tr>
                  ) : monthlyRecords.map((r) => {
                    const stt = STATUS_STYLE[r.status] || STATUS_STYLE.Belum;
                    return (
                      <tr key={r.id}>
                        <td style={styles.td}>{formatTanggalPanjang(r.tanggalNorm)}</td>
                        <td style={styles.td}>
                          <div style={{ fontWeight: 700, color: '#0f172a' }}>{r.namaTampil}</div>
                          <div style={{ fontSize: 11, color: '#64748b' }}>{r.kelasTampil}</div>
                        </td>
                        <td style={styles.td}>{r.mapel || 'Umum'}</td>
                        <td style={styles.td}>
                          <span style={{ ...styles.badge, background: stt.bg, color: stt.color }}>
                            {r.status || '-'}
                          </span>
                        </td>
                        <td style={styles.td}>{r.keterangan && r.keterangan !== '-' ? r.keterangan : '-'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {modeTab === 'harian' && (
          <>

        {/* Tanggal */}
        <div style={styles.toolbar}>
          <button type="button" style={styles.navBtn} onClick={() => shiftDate(-1)}>
            <ChevronLeft size={18} />
          </button>
          <div style={styles.dateBox}>
            <Calendar size={16} />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              style={styles.dateInput}
            />
            <span style={styles.dateLabel}>{formatTanggalPanjang(selectedDate)}</span>
          </div>
          <button type="button" style={styles.navBtn} onClick={() => shiftDate(1)}>
            <ChevronRight size={18} />
          </button>
          <button
            type="button"
            style={styles.todayBtn}
            onClick={() => setSelectedDate(toISODate(new Date()))}
          >
            Hari ini
          </button>
        </div>

        {/* Stats */}
        <div style={styles.statGrid}>
          {[
            ['Hadir', stats.hadir, '#22c55e'],
            ['Izin', stats.izin, '#3b82f6'],
            ['Sakit', stats.sakit, '#f59e0b'],
            ['Alpha', stats.alpha, '#ef4444'],
            ['Belum', stats.belum, '#94a3b8'],
          ].map(([label, val, color]) => (
            <div key={label} style={{ ...styles.statCard, borderLeft: `4px solid ${color}` }}>
              <small style={{ color: '#64748b', fontWeight: 700 }}>{label}</small>
              <div style={{ fontSize: 22, fontWeight: 800, color: '#1e293b' }}>{val}</div>
            </div>
          ))}
        </div>

        {/* Filter */}
        <div style={styles.toolbar}>
          <div style={styles.searchBox}>
            <Search size={14} color="#94a3b8" />
            <input
              style={styles.searchInput}
              placeholder="Cari nama / ID / kelas..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <select
            style={styles.select}
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="Semua">Semua status</option>
            <option value="Belum">Belum diisi</option>
            {STATUS_OPTS.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>

        {loading ? (
          <p style={{ textAlign: 'center', color: '#64748b' }}>Memuat...</p>
        ) : (
          <div style={styles.tableWrap}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Siswa</th>
                  <th style={styles.th}>Kelas</th>
                  <th style={styles.th}>Status</th>
                  <th style={styles.th}>Keterangan</th>
                  <th style={styles.th}>Aksi cepat</th>
                  <th style={styles.th}></th>
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ ...styles.td, textAlign: 'center', color: '#94a3b8' }}>
                      Tidak ada data siswa / filter kosong
                    </td>
                  </tr>
                ) : (
                  rows.map((row) => {
                    const stt = STATUS_STYLE[row.status] || STATUS_STYLE.Belum;
                    return (
                      <tr key={row.student.id}>
                        <td style={styles.td}>
                          <div style={{ fontWeight: 700, color: '#1e293b' }}>{row.student.nama || '-'}</div>
                          <div style={{ fontSize: 11, color: '#94a3b8' }}>{row.studentKey}</div>
                        </td>
                        <td style={styles.td}>{row.student.kelas || row.student.kelasSekolah || '-'}</td>
                        <td style={styles.td}>
                          <span style={{ ...styles.badge, background: stt.bg, color: stt.color }}>
                            {row.status}
                          </span>
                        </td>
                        <td style={{ ...styles.td, fontSize: 12.5, color: '#64748b', maxWidth: 180 }}>
                          {row.keterangan && row.keterangan !== '-' ? row.keterangan : '—'}
                          {row.records.length > 1 && (
                            <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>
                              +{row.records.length - 1} catatan mapel lain
                            </div>
                          )}
                        </td>
                        <td style={styles.td}>
                          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                            {STATUS_OPTS.map((st) => (
                              <button
                                key={st}
                                type="button"
                                disabled={saving}
                                style={{
                                  ...styles.quickBtn,
                                  background: row.status === st ? STATUS_STYLE[st].bg : '#f8fafc',
                                  color: row.status === st ? STATUS_STYLE[st].color : '#64748b',
                                  borderColor: row.status === st ? STATUS_STYLE[st].color : '#e2e8f0',
                                }}
                                onClick={() => setQuickStatus(row, st)}
                              >
                                {st}
                              </button>
                            ))}
                          </div>
                        </td>
                        <td style={styles.td}>
                          <div style={{ display: 'flex', gap: 6 }}>
                            <button type="button" style={styles.iconBtn} onClick={() => openEdit(row)} title="Edit + keterangan">
                              <Edit3 size={14} />
                            </button>
                            {row.main?.id && (
                              <button type="button" style={{ ...styles.iconBtn, color: '#ef4444' }} onClick={() => removeRecord(row.main.id)} title="Hapus">
                                <Trash2 size={14} />
                              </button>
                            )}
                            <button
                              type="button"
                              style={styles.iconBtn}
                              title="Riwayat siswa"
                              onClick={() => navigate(`/admin/students/attendance/${row.student.id}`)}
                            >
                              📋
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
          </>
        )}

        {/* Modal edit */}
        {editRow && (
          <div style={styles.modalOverlay} onClick={() => setEditRow(null)}>
            <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <h3 style={{ margin: 0, fontSize: 16 }}>Edit absensi — {editRow.nama}</h3>
                <button type="button" style={styles.iconBtn} onClick={() => setEditRow(null)}><X size={16} /></button>
              </div>
              <form onSubmit={saveEdit}>
                <label style={styles.formLabel}>
                  Tanggal
                  <input style={styles.formInput} type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} />
                </label>
                <label style={styles.formLabel}>
                  Status
                  <select
                    style={styles.formInput}
                    value={editRow.status}
                    onChange={(e) => setEditRow({ ...editRow, status: e.target.value })}
                  >
                    {STATUS_OPTS.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </label>
                <label style={styles.formLabel}>
                  Mapel / Sesi
                  <input
                    style={styles.formInput}
                    value={editRow.mapel}
                    onChange={(e) => setEditRow({ ...editRow, mapel: e.target.value })}
                    placeholder="Umum / Matematika / ..."
                  />
                </label>
                <label style={styles.formLabel}>
                  Keterangan (izin, sakit, dll)
                  <textarea
                    style={{ ...styles.formInput, minHeight: 80, resize: 'vertical' }}
                    value={editRow.keterangan}
                    onChange={(e) => setEditRow({ ...editRow, keterangan: e.target.value })}
                    placeholder="Contoh: Sakit demam, surat dokter dilampirkan / Izin acara keluarga"
                  />
                </label>
                <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                  <button type="submit" style={styles.saveBtn} disabled={saving}>
                    <Save size={14} /> {saving ? 'Menyimpan...' : 'Simpan'}
                  </button>
                  <button type="button" style={styles.cancelBtn} onClick={() => setEditRow(null)}>
                    Batal
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const styles = {
  toolbar: { display: 'flex', gap: 10, alignItems: 'center', marginBottom: 14, flexWrap: 'wrap' },
  navBtn: {
    width: 36, height: 36, borderRadius: 8, border: '1px solid #e2e8f0',
    background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  dateBox: { display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  dateInput: { border: '1px solid #cbd5e1', borderRadius: 8, padding: '6px 8px', fontSize: 13 },
  dateLabel: { fontSize: 13, fontWeight: 600, color: '#334155' },
  todayBtn: {
    border: 'none', background: '#eef2ff', color: '#4338ca', borderRadius: 8,
    padding: '6px 12px', fontSize: 12, fontWeight: 700, cursor: 'pointer',
  },
  refreshBtn: {
    display: 'inline-flex', alignItems: 'center', gap: 6, border: 'none',
    background: '#f1f5f9', color: '#334155', borderRadius: 8, padding: '6px 10px',
    fontSize: 12, fontWeight: 700, cursor: 'pointer',
  },
  alert: {
    background: '#ecfdf5', color: '#166534', borderRadius: 8, padding: '8px 12px',
    marginBottom: 12, fontWeight: 700, fontSize: 13,
  },
  statGrid: { display: 'flex', gap: 10, marginBottom: 14, flexWrap: 'wrap' },
  statCard: {
    flex: '1 1 90px', background: '#fff', borderRadius: 10, padding: '10px 14px',
    boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
  },
  searchBox: {
    display: 'flex', alignItems: 'center', gap: 6, background: '#fff',
    border: '1px solid #e2e8f0', borderRadius: 8, padding: '6px 10px', flex: '1 1 200px',
  },
  searchInput: { border: 'none', outline: 'none', fontSize: 13, flex: 1, background: 'transparent' },
  select: { border: '1px solid #e2e8f0', borderRadius: 8, padding: '7px 10px', fontSize: 13, background: '#fff' },
  tableWrap: {
    background: '#fff', borderRadius: 12, overflow: 'auto',
    boxShadow: '0 2px 8px rgba(0,0,0,0.04)', border: '1px solid #e2e8f0',
  },
  table: { width: '100%', borderCollapse: 'collapse', minWidth: 720 },
  th: {
    textAlign: 'left', padding: '12px 14px', fontSize: 12, color: '#64748b',
    borderBottom: '2px solid #f1f5f9', background: '#f8fafc', whiteSpace: 'nowrap',
  },
  td: { padding: '12px 14px', borderBottom: '1px solid #f1f5f9', fontSize: 13, verticalAlign: 'middle' },
  badge: { fontSize: 11, fontWeight: 800, borderRadius: 999, padding: '3px 10px' },
  quickBtn: {
    fontSize: 10, fontWeight: 700, borderRadius: 6, padding: '4px 7px',
    border: '1px solid', cursor: 'pointer', background: '#fff',
  },
  iconBtn: {
    width: 30, height: 30, borderRadius: 8, border: '1px solid #e2e8f0',
    background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center',
    justifyContent: 'center', color: '#475569',
  },
  modalOverlay: {
    position: 'fixed', inset: 0, background: 'rgba(15,17,35,0.5)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 16,
  },
  modal: {
    background: '#fff', borderRadius: 14, padding: 20, width: 'min(420px, 96vw)',
    boxShadow: '0 12px 40px rgba(0,0,0,0.15)',
  },
  formLabel: {
    display: 'flex', flexDirection: 'column', gap: 4, fontSize: 12, fontWeight: 700,
    color: '#475569', marginBottom: 10,
  },
  formInput: {
    border: '1px solid #cbd5e1', borderRadius: 8, padding: '8px 10px', fontSize: 13,
    fontWeight: 500, color: '#1e293b', fontFamily: 'inherit',
  },
  saveBtn: {
    display: 'inline-flex', alignItems: 'center', gap: 6, background: '#4C6EF5', color: '#fff',
    border: 'none', borderRadius: 8, padding: '9px 14px', fontWeight: 700, fontSize: 13, cursor: 'pointer',
  },
  cancelBtn: {
    background: '#f1f5f9', color: '#334155', border: 'none', borderRadius: 8,
    padding: '9px 14px', fontWeight: 700, fontSize: 13, cursor: 'pointer',
  },
};

export default AdminAttendanceManage;