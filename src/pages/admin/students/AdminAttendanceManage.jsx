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
  Calendar, Save, Trash2, Edit3, X, Search, RefreshCw, ChevronLeft, ChevronRight,
} from 'lucide-react';

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
        .filter((s) => !s.isBlocked)
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
          marginLeft: isMobile ? 0 : 260,
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
        <p style={{ color: '#64748b', fontSize: 13, marginTop: 0, marginBottom: 16 }}>
          Pilih tanggal, lalu set status Hadir / Izin / Sakit / Alpha dan isi keterangan (izin, sakit, dll).
        </p>

        {alertMsg && (
          <div style={styles.alert}>{alertMsg}</div>
        )}

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