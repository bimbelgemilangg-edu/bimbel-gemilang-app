// src/pages/student/StudentAttendance.jsx
// Riwayat kehadiran siswa — KHUSUS PERIODE 1 BULAN BERJALAN (Bulan Saat Ini).
// Akses bulan-bulan sebelumnya hanya tersedia melalui Portal Admin (dan bisa diunduh PDF oleh Admin).
import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { db } from '../../firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { Calendar, CheckCircle2, Clock, AlertCircle, XCircle, Info } from 'lucide-react';
import { useProfilSiswa } from '../../utils/profilSiswa';
import { daftarQueryAbsensi, gabungkanDokUnik } from '../../utils/identitasAbsensi';
import { kebijakanGagalMuat } from '../../utils/keputusanMuat';

function toISODate(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

const STATUS_STYLE = {
  Hadir: { bg: '#dcfce7', color: '#166534', border: '#86efac', dot: '#16a34a', label: 'Hadir' },
  Izin: { bg: '#e0e7ff', color: '#3730a3', border: '#a5b4fc', dot: '#4f46e5', label: 'Izin' },
  Sakit: { bg: '#fef3c7', color: '#b45309', border: '#fcd34d', dot: '#d97706', label: 'Sakit' },
  Alpha: { bg: '#fee2e2', color: '#b91c1c', border: '#fca5a5', dot: '#dc2626', label: 'Alpha' },
};

const HARI_HEADER = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'];

const StudentAttendance = () => {
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pesanError, setPesanError] = useState('');
  const adaDataRef = useRef(false);

  const studentId = localStorage.getItem('studentId');
  const studentDocId = localStorage.getItem('studentDocId');
  const profil = useProfilSiswa();

  // Periode terkunci pada 1 bulan berjalan (tidak ada navigasi ke bulan sebelumnya)
  const sekarang = useMemo(() => new Date(), []);
  const tahunIni = sekarang.getFullYear();
  const bulanIni = sekarang.getMonth(); // 0..11
  const prefixBulanIni = `${tahunIni}-${String(bulanIni + 1).padStart(2, '0')}`;
  const labelBulanIni = sekarang.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
  const todayIso = toISODate(sekarang);

  const muatAbsensi = useCallback(async () => {
    const daftar = daftarQueryAbsensi({ studentId, docId: studentDocId, nama: profil.nama });
    if (!daftar.length) return;
    setLoading(true);
    try {
      const snaps = await Promise.all(
        daftar.map((q) =>
          getDocs(query(collection(db, 'attendance'), where(q.field, '==', q.nilai))).catch(() => ({ docs: [] }))
        )
      );
      const raw = gabungkanDokUnik(snaps.map((s) => s.docs));

      // Saring KETAT hanya bulan berjalan & deduplikasi sesi sama di tanggal yang sama
      const unikBulanIni = [];
      const seen = new Set();
      raw.forEach((a) => {
        const tgl = String(a.tanggal || a.date || '').slice(0, 10);
        if (!tgl.startsWith(prefixBulanIni)) return;
        const kunci = `${tgl}__${a.scheduleId || a.jadwalId || a.mapel || a.id}`;
        if (seen.has(kunci)) return;
        seen.add(kunci);
        unikBulanIni.push({ ...a, tanggalNorm: tgl });
      });

      unikBulanIni.sort((a, b) => b.tanggalNorm.localeCompare(a.tanggalNorm));
      setAttendance(unikBulanIni);
      adaDataRef.current = unikBulanIni.length > 0;
    } catch (e) {
      console.error('Gagal memuat absensi:', e);
      setPesanError(kebijakanGagalMuat(adaDataRef.current, e?.message || '').pesan);
    } finally {
      setLoading(false);
    }
  }, [studentId, studentDocId, profil.nama, prefixBulanIni]);

  useEffect(() => {
    muatAbsensi();
  }, [muatAbsensi]);

  useEffect(() => {
    const jalan = () => {
      if (document.visibilityState === 'visible') muatAbsensi();
    };
    window.addEventListener('focus', jalan);
    document.addEventListener('visibilitychange', jalan);
    return () => {
      window.removeEventListener('focus', jalan);
      document.removeEventListener('visibilitychange', jalan);
    };
  }, [muatAbsensi]);

  // Statistik 1 bulan berjalan
  const monthStats = useMemo(() => {
    const hadir = attendance.filter((x) => x.status === 'Hadir').length;
    const izin = attendance.filter((x) => x.status === 'Izin').length;
    const sakit = attendance.filter((x) => x.status === 'Sakit').length;
    const alpha = attendance.filter((x) => x.status === 'Alpha').length;
    const total = attendance.length;
    const persen = total > 0 ? Math.round((hadir / total) * 100) : 0;
    return { hadir, izin, sakit, alpha, total, persen };
  }, [attendance]);

  // Bangun grid kalender 1 bulan penuh (Senin - Minggu)
  const calendarCells = useMemo(() => {
    const firstDay = new Date(tahunIni, bulanIni, 1);
    const totalDays = new Date(tahunIni, bulanIni + 1, 0).getDate();
    // Konversi getDay() (0=Min..6=Sab) ke index Senin=0..Minggu=6
    const startOffset = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1;

    const byDate = new Map();
    attendance.forEach((a) => {
      if (!byDate.has(a.tanggalNorm)) byDate.set(a.tanggalNorm, []);
      byDate.get(a.tanggalNorm).push(a);
    });

    const cells = [];
    for (let i = 0; i < startOffset; i++) {
      cells.push({ empty: true, key: `empty-${i}` });
    }
    for (let day = 1; day <= totalDays; day++) {
      const iso = `${prefixBulanIni}-${String(day).padStart(2, '0')}`;
      cells.push({
        empty: false,
        key: iso,
        day,
        iso,
        isToday: iso === todayIso,
        items: byDate.get(iso) || [],
      });
    }
    return cells;
  }, [tahunIni, bulanIni, prefixBulanIni, attendance, todayIso]);

  return (
    <div style={S.container}>
      {pesanError && (
        <div style={S.errorBox}>⚠️ {pesanError}</div>
      )}

      {/* HEADER MODERN */}
      <div style={S.heroHeader}>
        <div>
          <div style={S.periodPill}>
            <Calendar size={14} />
            <span>Periode Bulan Berjalan • {labelBulanIni}</span>
          </div>
          <h2 style={S.heroTitle}>Kehadiran Siswa</h2>
          <p style={S.heroSub}>
            Menampilkan jadwal &amp; rekap kehadiran khusus bulan <b>{labelBulanIni}</b>.
          </p>
        </div>
        <div style={S.persenBox}>
          <div style={{ fontSize: 24, fontWeight: 900, color: '#0f766e', lineHeight: 1 }}>
            {monthStats.persen}%
          </div>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#475569', marginTop: 3 }}>
            Tingkat Hadir ({monthStats.total} Sesi)
          </div>
        </div>
      </div>

      {/* RINGKASAN 4 KARTU */}
      <div style={S.statGrid}>
        <div style={{ ...S.statCard, borderColor: '#bbf7d0', background: '#f0fdf4' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ ...S.statLabel, color: '#166534' }}>HADIR</span>
            <CheckCircle2 size={16} color="#16a34a" />
          </div>
          <div style={{ ...S.statNum, color: '#14532d' }}>{monthStats.hadir}</div>
        </div>
        <div style={{ ...S.statCard, borderColor: '#c7d2fe', background: '#eef2ff' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ ...S.statLabel, color: '#3730a3' }}>IZIN</span>
            <Clock size={16} color="#4f46e5" />
          </div>
          <div style={{ ...S.statNum, color: '#312e81' }}>{monthStats.izin}</div>
        </div>
        <div style={{ ...S.statCard, borderColor: '#fde68a', background: '#fffbeb' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ ...S.statLabel, color: '#b45309' }}>SAKIT</span>
            <AlertCircle size={16} color="#d97706" />
          </div>
          <div style={{ ...S.statNum, color: '#78350f' }}>{monthStats.sakit}</div>
        </div>
        <div style={{ ...S.statCard, borderColor: '#fecaca', background: '#fef2f2' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ ...S.statLabel, color: '#b91c1c' }}>ALPHA</span>
            <XCircle size={16} color="#dc2626" />
          </div>
          <div style={{ ...S.statNum, color: '#7f1d1d' }}>{monthStats.alpha}</div>
        </div>
      </div>

      {/* INFO AKSES BULAN SEBELUMNYA */}
      <div style={S.infoNotice}>
        <Info size={15} color="#0369a1" style={{ flexShrink: 0, marginTop: 1 }} />
        <span>
          Tampilan portal siswa hanya menampilkan kehadiran <b>1 bulan berjalan ({labelBulanIni})</b>. Jika orang tua/siswa membutuhkan riwayat atau PDF absensi bulan-bulan sebelumnya, silakan hubungi <b>Admin Bimbel</b>.
        </span>
      </div>

      {loading ? (
        <div style={S.loadingBox}>Memuat jadwal kehadiran bulan {labelBulanIni}...</div>
      ) : (
        <>
          {/* KALENDER BULAN BERJALAN */}
          <div style={S.card}>
            <div style={S.cardTitleRow}>
              <h3 style={S.cardTitle}>🗓️ Kalender Kehadiran {labelBulanIni}</h3>
            </div>
            <div style={S.calHeaderGrid}>
              {HARI_HEADER.map((h) => (
                <div key={h} style={S.calDayHeader}>{h}</div>
              ))}
            </div>
            <div style={S.calGrid}>
              {calendarCells.map((cell) => {
                if (cell.empty) {
                  return <div key={cell.key} style={S.calEmptyCell} />;
                }
                const ada = cell.items.length > 0;
                return (
                  <div
                    key={cell.key}
                    style={{
                      ...S.calCell,
                      borderColor: cell.isToday ? '#0d9488' : ada ? '#cbd5e1' : '#f1f5f9',
                      background: cell.isToday ? '#f0fdfa' : ada ? '#ffffff' : '#f8fafc',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{
                        fontSize: 12,
                        fontWeight: cell.isToday ? 900 : 700,
                        color: cell.isToday ? '#0f766e' : '#334155',
                      }}>
                        {cell.day}
                      </span>
                      {cell.isToday && (
                        <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#0d9488' }} />
                      )}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 3, marginTop: 4 }}>
                      {cell.items.slice(0, 2).map((it) => {
                        const st = STATUS_STYLE[it.status] || STATUS_STYLE.Alpha;
                        return (
                          <div
                            key={it.id}
                            title={`${it.mapel || 'Sesi'} — ${st.label}`}
                            style={{
                              fontSize: 9.5,
                              fontWeight: 800,
                              background: st.bg,
                              color: st.color,
                              padding: '2px 5px',
                              borderRadius: 6,
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                            }}
                          >
                            {st.label}
                          </div>
                        );
                      })}
                      {cell.items.length > 2 && (
                        <div style={{ fontSize: 9, color: '#64748b', fontWeight: 700 }}>
                          +{cell.items.length - 2} lagi
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* RINCIAN JADWAL KEHADIRAN BULAN INI */}
          <div style={S.card}>
            <div style={S.cardTitleRow}>
              <h3 style={S.cardTitle}>📋 Rincian Jadwal Kehadiran ({attendance.length} Catatan)</h3>
            </div>
            {attendance.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '28px 16px', color: '#64748b', fontSize: 13 }}>
                Belum ada catatan kehadiran pada bulan <b>{labelBulanIni}</b>.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {attendance.map((item) => {
                  const stt = STATUS_STYLE[item.status] || STATUS_STYLE.Alpha;
                  const tglObj = new Date(`${item.tanggalNorm}T12:00:00`);
                  const tglLabel = Number.isNaN(tglObj.getTime())
                    ? item.tanggalNorm
                    : tglObj.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
                  return (
                    <div key={item.id} style={S.listRow}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1, minWidth: 180 }}>
                        <div style={{ width: 10, height: 10, borderRadius: '50%', background: stt.dot, flexShrink: 0 }} />
                        <div>
                          <div style={{ fontSize: 13.5, fontWeight: 800, color: '#0f172a' }}>
                            {item.mapel || 'Sesi Belajar'}
                          </div>
                          <div style={{ fontSize: 11.5, color: '#64748b', marginTop: 2 }}>
                            {tglLabel}
                          </div>
                          {item.keterangan && item.keterangan !== '-' && (
                            <div style={{ fontSize: 11.5, color: '#475569', marginTop: 3, fontStyle: 'italic' }}>
                              Catatan: {item.keterangan}
                            </div>
                          )}
                        </div>
                      </div>
                      <span
                        style={{
                          padding: '5px 12px',
                          borderRadius: 99,
                          fontSize: 11.5,
                          fontWeight: 800,
                          background: stt.bg,
                          color: stt.color,
                          border: `1px solid ${stt.border}`,
                        }}
                      >
                        {stt.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

const S = {
  container: {
    width: '100%',
    maxWidth: 960,
    margin: '0 auto',
    boxSizing: 'border-box',
    fontFamily: 'system-ui, -apple-system, sans-serif',
    paddingBottom: 32,
  },
  errorBox: {
    background: '#fef2f2',
    border: '1px solid #fecaca',
    color: '#b91c1c',
    borderRadius: 12,
    padding: '10px 14px',
    fontSize: 12.5,
    marginBottom: 12,
  },
  heroHeader: {
    background: 'linear-gradient(135deg, #f0fdfa 0%, #e0f2fe 100%)',
    border: '1px solid #ccfbf1',
    borderRadius: 20,
    padding: '18px 20px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 14,
    marginBottom: 14,
  },
  periodPill: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    background: '#0d9488',
    color: '#ffffff',
    padding: '4px 12px',
    borderRadius: 99,
    fontSize: 11.5,
    fontWeight: 800,
    marginBottom: 8,
  },
  heroTitle: {
    margin: 0,
    fontSize: 20,
    fontWeight: 900,
    color: '#0f172a',
  },
  heroSub: {
    margin: '4px 0 0',
    fontSize: 13,
    color: '#475569',
  },
  persenBox: {
    background: '#ffffff',
    border: '1px solid #99f6e4',
    borderRadius: 16,
    padding: '12px 18px',
    textAlign: 'center',
    boxShadow: '0 4px 12px rgba(13, 148, 136, 0.08)',
  },
  statGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
    gap: 10,
    marginBottom: 14,
  },
  statCard: {
    borderRadius: 16,
    padding: '12px 14px',
    border: '1.5px solid #e2e8f0',
  },
  statLabel: {
    fontSize: 11,
    fontWeight: 800,
    letterSpacing: '0.03em',
  },
  statNum: {
    fontSize: 22,
    fontWeight: 900,
    marginTop: 6,
  },
  infoNotice: {
    background: '#f0f9ff',
    border: '1px solid #bae6fd',
    color: '#0c4a6e',
    borderRadius: 14,
    padding: '10px 14px',
    fontSize: 12,
    lineHeight: 1.5,
    display: 'flex',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 16,
  },
  loadingBox: {
    textAlign: 'center',
    padding: 36,
    color: '#64748b',
    fontSize: 13.5,
    background: '#ffffff',
    borderRadius: 18,
    border: '1px solid #e2e8f0',
  },
  card: {
    background: '#ffffff',
    borderRadius: 18,
    padding: 16,
    border: '1px solid #e2e8f0',
    boxShadow: '0 2px 10px rgba(15, 23, 42, 0.04)',
    marginBottom: 16,
  },
  cardTitleRow: {
    marginBottom: 12,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardTitle: {
    margin: 0,
    fontSize: 15,
    fontWeight: 800,
    color: '#0f172a',
  },
  calHeaderGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(7, 1fr)',
    gap: 6,
    marginBottom: 6,
  },
  calDayHeader: {
    textAlign: 'center',
    fontSize: 11,
    fontWeight: 800,
    color: '#64748b',
    padding: '4px 0',
  },
  calGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(7, 1fr)',
    gap: 6,
  },
  calEmptyCell: {
    minHeight: 54,
    borderRadius: 10,
    background: 'transparent',
  },
  calCell: {
    minHeight: 58,
    borderRadius: 10,
    border: '1.5px solid #f1f5f9',
    padding: 6,
    display: 'flex',
    flexDirection: 'column',
  },
  listRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
    padding: '12px 14px',
    borderRadius: 14,
    background: '#f8fafc',
    border: '1px solid #e2e8f0',
    flexWrap: 'wrap',
  },
};

export default StudentAttendance;
