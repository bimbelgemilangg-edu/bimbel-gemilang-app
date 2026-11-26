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
  Calendar, Save, Trash2, Edit3, X, Search, RefreshCw, ChevronLeft, ChevronRight, FileText, Download,
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
  const [modeTab, setModeTab] = useState('harian'); // 'harian' | 'bulanan'
  const [selectedMonth, setSelectedMonth] = useState(toISODate(new Date()).slice(0, 7));
  const [selectedStudentId, setSelectedStudentId] = useState('semua');

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
      const [stuSnap, attSnap] = await Promise.all([
        getDocs(collection(db, 'students')),
        getDocs(collection(db, 'attendance')),
      ]);
      const stu = stuSnap.docs
        .map((d) => ({ id: d.id, ...d.data() }))
        .filter((s) => isAkunBelajarAktif(s))
        .sort((a, b) => String(a.nama || '').localeCompare(String(b.nama || ''), 'id'));
      setStudents(stu);

      const att = attSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setAttendance(att);
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
    const win = window.open('', '_blank', 'width=900,height=700');
    if (!win) {
      return showAlert('⚠️ Izinkan pop-up browser untuk mengunduh / mencetak PDF absensi.');
    }
    const judulSiswa = selectedStudentObj
      ? `${selectedStudentObj.nama} (${selectedStudentObj.kelasSekolah || selectedStudentObj.kelas || '-'})`
      : 'Semua Siswa Aktif';

    const rowsHtml = monthlyRecords.length === 0
      ? `<tr><td colspan="6" style="text-align:center;padding:24px;color:#64748b;">Tidak ada catatan absensi pada periode ${labelBulanTerpilih}.</td></tr>`
      : monthlyRecords.map((r, i) => `
          <tr>
            <td style="text-align:center;">${i + 1}</td>
            <td>${formatTanggalPanjang(r.tanggalNorm)}</td>
            <td><strong>${r.namaTampil}</strong><br/><span style="font-size:11px;color:#64748b;">${r.kelasTampil}</span></td>
            <td>${r.mapel || 'Umum'}</td>
            <td style="text-align:center;font-weight:700;">${r.status || '-'}</td>
            <td>${r.keterangan && r.keterangan !== '-' ? r.keterangan : '-'}</td>
          </tr>
        `).join('');

    win.document.write(`<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Laporan Kehadiran ${labelBulanTerpilih} - ${judulSiswa}</title>
  <style>
    body { font-family: Arial, Helvetica, sans-serif; color: #0f172a; padding: 28px; margin: 0; }
    .header { display: flex; justify-content: space-between; align-items: flex-end; border-bottom: 3px solid #0d9488; padding-bottom: 12px; margin-bottom: 18px; }
    .brand { font-size: 20px; font-weight: 900; color: #0f766e; }
    .sub { font-size: 12px; color: #475569; margin-top: 2px; }
    .meta { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px 14px; margin-bottom: 16px; font-size: 13px; }
    .summary { display: flex; gap: 10px; margin-bottom: 18px; }
    .sum-box { flex: 1; border: 1px solid #cbd5e1; border-radius: 8px; padding: 10px; text-align: center; }
    .sum-box small { display: block; font-size: 10px; color: #64748b; font-weight: 700; text-transform: uppercase; }
    .sum-box strong { font-size: 18px; color: #0f172a; }
    table { width: 100%; border-collapse: collapse; font-size: 12px; }
    th { background: #0f766e; color: #ffffff; padding: 8px 10px; text-align: left; }
    td { border-bottom: 1px solid #e2e8f0; padding: 8px 10px; vertical-align: top; }
    tr:nth-child(even) td { background: #f8fafc; }
    .footer { margin-top: 24px; font-size: 11px; color: #64748b; display: flex; justify-content: space-between; }
    @media print { body { padding: 14px; } }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <div class="brand">BIMBEL GEMILANG</div>
      <div class="sub">Laporan Resmi Jadwal &amp; Kehadiran Siswa</div>
    </div>
    <div style="text-align:right;font-size:12px;color:#475569;">
      Dicetak: ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
    </div>
  </div>
  <div class="meta">
    <div><strong>Periode:</strong> ${labelBulanTerpilih}</div>
    <div><strong>Peserta:</strong> ${judulSiswa}</div>
  </div>
  <div class="summary">
    <div class="sum-box"><small>Hadir</small><strong>${monthlyStats.hadir}</strong></div>
    <div class="sum-box"><small>Izin</small><strong>${monthlyStats.izin}</strong></div>
    <div class="sum-box"><small>Sakit</small><strong>${monthlyStats.sakit}</strong></div>
    <div class="sum-box"><small>Alpha</small><strong>${monthlyStats.alpha}</strong></div>
    <div class="sum-box"><small>Persentase</small><strong>${monthlyStats.persen}%</strong></div>
  </div>
  <table>
    <thead>
      <tr>
        <th style="width:36px;text-align:center;">No</th>
        <th>Hari &amp; Tanggal</th>
        <th>Nama Siswa &amp; Kelas</th>
        <th>Mapel / Sesi</th>
        <th style="width:80px;text-align:center;">Status</th>
        <th>Keterangan</th>
      </tr>
    </thead>
    <tbody>${rowsHtml}</tbody>
  </table>
  <div class="footer">
    <span>Dokumen resmi Portal Admin Bimbel Gemilang</span>
    <span>Total ${monthlyStats.total} sesi tercatat</span>
  </div>
  <script>window.onload = function(){ setTimeout(function(){ window.print(); }, 250); };</script>
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
        </div>

        {alertMsg && (
          <div style={styles.alert}>{alertMsg}</div>
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