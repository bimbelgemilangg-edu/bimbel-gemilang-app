// src/pages/student/StudentAttendance.jsx
// Riwayat kehadiran siswa — tampilan 1 minggu penuh (Senin–Minggu),
// navigasi minggu sebelumnya/berikutnya, ringkasan Hadir/Izin/Sakit/Alpha.
import React, { useState, useEffect, useMemo } from 'react';
import { db } from '../../firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';

function startOfWeek(d) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  const day = x.getDay(); // 0=Min
  const diff = day === 0 ? -6 : 1 - day; // Senin sebagai awal
  x.setDate(x.getDate() + diff);
  return x;
}

function addDays(d, n) {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}

function toISODate(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function formatHari(d) {
  return d.toLocaleDateString('id-ID', { weekday: 'short' });
}

function formatTanggalPendek(d) {
  return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
}

function formatRentangMinggu(senin) {
  const minggu = addDays(senin, 6);
  const o = { day: 'numeric', month: 'short', year: 'numeric' };
  return `${senin.toLocaleDateString('id-ID', o)} – ${minggu.toLocaleDateString('id-ID', o)}`;
}

const STATUS_STYLE = {
  Hadir: { bg: '#dcfce7', color: '#166534', label: 'Hadir' },
  Sakit: { bg: '#fef3c7', color: '#b45309', label: 'Sakit' },
  Izin: { bg: '#e0e7ff', color: '#3730a3', label: 'Izin' },
  Alpha: { bg: '#fee2e2', color: '#ef4444', label: 'Alpha' },
};

const StudentAttendance = () => {
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date()));

  const studentId = localStorage.getItem('studentId');
  const studentNameLS = localStorage.getItem('studentName');

  useEffect(() => {
    const fetchAttendance = async () => {
      if (!studentId && !studentNameLS) return;
      setLoading(true);
      try {
        const queries = [
          studentId
            ? getDocs(query(collection(db, 'attendance'), where('studentId', '==', studentId)))
            : Promise.resolve({ docs: [] }),
          studentNameLS
            ? getDocs(query(collection(db, 'attendance'), where('studentName', '==', studentNameLS)))
            : Promise.resolve({ docs: [] }),
          studentNameLS
            ? getDocs(query(collection(db, 'attendance'), where('namaSiswa', '==', studentNameLS)))
            : Promise.resolve({ docs: [] }),
        ];
        const [snapById, snapByName1, snapByName2] = await Promise.all(
          queries.map((p) => p.catch(() => ({ docs: [] })))
        );

        const merged = new Map();
        [...snapById.docs, ...snapByName1.docs, ...snapByName2.docs].forEach((d) =>
          merged.set(d.id, { id: d.id, ...d.data() })
        );
        const data = Array.from(merged.values());
        data.sort((a, b) => new Date(b.tanggal) - new Date(a.tanggal));
        setAttendance(data);
      } catch (e) {
        console.error('Gagal memuat absensi:', e);
      } finally {
        setLoading(false);
      }
    };
    fetchAttendance();
  }, [studentId, studentNameLS]);

  const days = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const d = addDays(weekStart, i);
      const iso = toISODate(d);
      const items = attendance.filter((a) => (a.tanggal || '').slice(0, 10) === iso);
      return { date: d, iso, items, isToday: iso === toISODate(new Date()) };
    });
  }, [weekStart, attendance]);

  const weekStats = useMemo(() => {
    const all = days.flatMap((d) => d.items);
    return {
      hadir: all.filter((x) => x.status === 'Hadir').length,
      izin: all.filter((x) => x.status === 'Izin').length,
      sakit: all.filter((x) => x.status === 'Sakit').length,
      alpha: all.filter((x) => x.status === 'Alpha').length,
    };
  }, [days]);

  const isCurrentWeek = toISODate(weekStart) === toISODate(startOfWeek(new Date()));

  return (
    <div style={styles.mainContent}>
      <div style={styles.header}>
        <h2 style={{ margin: 0 }}>📝 Kehadiran Minggu Ini</h2>
        <p style={{ color: '#666', marginTop: 5 }}>Pantau kehadiranmu Senin–Minggu, termasuk izin, sakit, dan alpha.</p>
      </div>

      {/* Navigasi minggu */}
      <div style={styles.weekNav}>
        <button
          type="button"
          style={styles.navBtn}
          onClick={() => setWeekStart((w) => addDays(w, -7))}
          title="Minggu sebelumnya"
        >
          <ChevronLeft size={18} />
        </button>
        <div style={styles.weekLabel}>
          <Calendar size={16} style={{ marginRight: 6 }} />
          {formatRentangMinggu(weekStart)}
          {isCurrentWeek && <span style={styles.badgeMingguIni}>Minggu ini</span>}
        </div>
        <button
          type="button"
          style={styles.navBtn}
          onClick={() => setWeekStart((w) => addDays(w, 7))}
          title="Minggu berikutnya"
        >
          <ChevronRight size={18} />
        </button>
        {!isCurrentWeek && (
          <button type="button" style={styles.btnToday} onClick={() => setWeekStart(startOfWeek(new Date()))}>
            Ke minggu ini
          </button>
        )}
      </div>

      {/* Ringkasan minggu */}
      <div style={styles.statGrid}>
        <div style={{ ...styles.statCard, borderLeft: '5px solid #22c55e' }}>
          <small>HADIR</small>
          <h3>{weekStats.hadir}</h3>
        </div>
        <div style={{ ...styles.statCard, borderLeft: '5px solid #3b82f6' }}>
          <small>IZIN</small>
          <h3>{weekStats.izin}</h3>
        </div>
        <div style={{ ...styles.statCard, borderLeft: '5px solid #f59e0b' }}>
          <small>SAKIT</small>
          <h3>{weekStats.sakit}</h3>
        </div>
        <div style={{ ...styles.statCard, borderLeft: '5px solid #ef4444' }}>
          <small>ALPHA</small>
          <h3>{weekStats.alpha}</h3>
        </div>
      </div>

      {loading ? (
        <p style={{ textAlign: 'center', padding: 20 }}>Memuat data kehadiran...</p>
      ) : (
        <div style={styles.weekGrid}>
          {days.map((day) => (
            <div
              key={day.iso}
              style={{
                ...styles.dayCard,
                ...(day.isToday ? styles.dayCardToday : {}),
              }}
            >
              <div style={styles.dayHead}>
                <span style={styles.dayName}>{formatHari(day.date)}</span>
                <span style={styles.dayDate}>{formatTanggalPendek(day.date)}</span>
                {day.isToday && <span style={styles.todayDot}>Hari ini</span>}
              </div>
              {day.items.length === 0 ? (
                <div style={styles.emptyDay}>Belum ada catatan</div>
              ) : (
                <div style={styles.dayItems}>
                  {day.items.map((item) => {
                    const stt = STATUS_STYLE[item.status] || STATUS_STYLE.Alpha;
                    return (
                      <div key={item.id} style={styles.itemRow}>
                        <span
                          style={{
                            ...styles.statusBadge,
                            background: stt.bg,
                            color: stt.color,
                          }}
                        >
                          {stt.label}
                        </span>
                        <div style={styles.itemMeta}>
                          <div style={styles.itemMapel}>{item.mapel || 'Umum'}</div>
                          {item.keterangan && item.keterangan !== '-' && (
                            <div style={styles.itemKet}>{item.keterangan}</div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const styles = {
  mainContent: { width: '100%', boxSizing: 'border-box', fontFamily: 'sans-serif' },
  header: { marginBottom: 16 },
  weekNav: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    marginBottom: 16,
    flexWrap: 'wrap',
  },
  navBtn: {
    width: 36,
    height: 36,
    borderRadius: 8,
    border: '1px solid #e2e8f0',
    background: '#fff',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  weekLabel: {
    display: 'flex',
    alignItems: 'center',
    fontWeight: 700,
    fontSize: 14,
    color: '#1e293b',
    gap: 4,
  },
  badgeMingguIni: {
    marginLeft: 8,
    fontSize: 11,
    fontWeight: 800,
    background: '#eef2ff',
    color: '#4338ca',
    borderRadius: 999,
    padding: '2px 8px',
  },
  btnToday: {
    border: 'none',
    background: '#f1f5f9',
    color: '#334155',
    borderRadius: 8,
    padding: '6px 10px',
    fontSize: 12,
    fontWeight: 700,
    cursor: 'pointer',
  },
  statGrid: { display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' },
  statCard: {
    flex: '1 1 100px',
    background: 'white',
    padding: '12px 16px',
    borderRadius: 12,
    boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
  },
  weekGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
    gap: 12,
  },
  dayCard: {
    background: '#fff',
    border: '1px solid #e2e8f0',
    borderRadius: 12,
    padding: 12,
    minHeight: 120,
  },
  dayCardToday: {
    borderColor: '#4C6EF5',
    boxShadow: '0 0 0 2px rgba(76,110,245,0.15)',
  },
  dayHead: {
    display: 'flex',
    alignItems: 'baseline',
    gap: 8,
    marginBottom: 10,
    paddingBottom: 8,
    borderBottom: '1px solid #f1f5f9',
  },
  dayName: { fontWeight: 800, fontSize: 13, color: '#1e293b' },
  dayDate: { fontSize: 12, color: '#64748b' },
  todayDot: {
    marginLeft: 'auto',
    fontSize: 10,
    fontWeight: 800,
    color: '#4C6EF5',
    background: '#eef2ff',
    borderRadius: 999,
    padding: '2px 7px',
  },
  emptyDay: { fontSize: 12, color: '#94a3b8', fontStyle: 'italic' },
  dayItems: { display: 'flex', flexDirection: 'column', gap: 8 },
  itemRow: { display: 'flex', gap: 8, alignItems: 'flex-start' },
  statusBadge: {
    flexShrink: 0,
    fontSize: 11,
    fontWeight: 800,
    borderRadius: 999,
    padding: '3px 8px',
  },
  itemMeta: { minWidth: 0 },
  itemMapel: { fontSize: 13, fontWeight: 600, color: '#1e293b' },
  itemKet: { fontSize: 11.5, color: '#64748b', marginTop: 2 },
};

export default StudentAttendance;