// src/pages/admin/schedule/ModalPindahRuang.jsx
import React, { useState } from 'react';
import { db } from '../../../firebase';
import { doc, updateDoc, writeBatch, getDocs, collection, query, where, serverTimestamp } from 'firebase/firestore';
import { timesOverlap } from './jadwalConflictUtils';
import { X, ArrowRight, AlertTriangle, CheckCircle2, ShieldAlert, Sparkles } from 'lucide-react';

const PLANETS = ["MERKURIUS", "VENUS", "BUMI", "MARS", "JUPITER"];

const QUICK_REASONS = [
  "📽️ Proyektor Ruang Bermasalah / Mati",
  "❄️ AC / Kipas Angin Kendala",
  "👥 Kapasitas Ruangan Tidak Cukup",
  "🔌 Gangguan Listrik / Stopkontak",
  "🔄 Penyesuaian Kebutuhan Sesi / Suasana Baru"
];

export default function ModalPindahRuang({
  schedule,
  allSchedules = [],
  teacherPhoto = null,
  onClose,
  onSuccess
}) {
  const [selectedPlanet, setSelectedPlanet] = useState('');
  const [reason, setReason] = useState(QUICK_REASONS[0]);
  const [customReason, setCustomReason] = useState('');
  const [applyToSeries, setApplyToSeries] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!schedule) return null;

  // Cek ketersediaan setiap ruangan pada jam & tanggal sesi ini
  const roomStatus = PLANETS.map(planet => {
    if (planet === schedule.planet) {
      return { planet, isCurrent: true, available: false, occupant: null };
    }
    const occupant = allSchedules.find(s =>
      s.id !== schedule.id &&
      s.dateStr === schedule.dateStr &&
      s.planet === planet &&
      timesOverlap(schedule.start, schedule.end, s.start, s.end) &&
      s.status !== 'cancelled'
    );
    return {
      planet,
      isCurrent: false,
      available: !occupant,
      occupant
    };
  });

  const handleConfirmMove = async () => {
    if (!selectedPlanet) {
      setErrorMsg("Pilih ruangan tujuan terlebih dahulu!");
      return;
    }

    const targetRoom = roomStatus.find(r => r.planet === selectedPlanet);
    if (targetRoom && !targetRoom.available) {
      setErrorMsg(`Ruang ${selectedPlanet} sedang terpakai jam tersebut!`);
      return;
    }

    setSaving(true);
    setErrorMsg('');

    try {
      const finalReason = customReason.trim() ? `${reason}: ${customReason.trim()}` : reason;
      const historyEntry = {
        fromPlanet: schedule.planet,
        toPlanet: selectedPlanet,
        reason: finalReason,
        timestamp: new Date().toISOString()
      };

      if (applyToSeries && schedule.seriesId) {
        // Terapkan ke semua sesi di seri 4 minggu
        const qSeries = query(collection(db, "jadwal_bimbel"), where("seriesId", "==", schedule.seriesId));
        const snap = await getDocs(qSeries);
        const batch = writeBatch(db);
        snap.docs.forEach(d => {
          const oldHist = d.data().pindahRuangHistory || [];
          batch.update(d.ref, {
            planet: selectedPlanet,
            pindahRuangHistory: [...oldHist, historyEntry],
            updatedAt: serverTimestamp()
          });
        });
        await batch.commit();
      } else {
        // Hanya sesi ini
        const oldHist = schedule.pindahRuangHistory || [];
        await updateDoc(doc(db, "jadwal_bimbel", schedule.id), {
          planet: selectedPlanet,
          pindahRuangHistory: [...oldHist, historyEntry],
          updatedAt: serverTimestamp()
        });
      }

      if (onSuccess) {
        onSuccess(selectedPlanet, finalReason, applyToSeries);
      }
      onClose();
    } catch (err) {
      console.error("Gagal memindahkan ruangan:", err);
      setErrorMsg("Gagal memindahkan ruangan: " + (err.message || 'Terjadi kesalahan'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div style={styles.header}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={styles.iconBadge}>🔄</div>
            <div>
              <h3 style={styles.title}>Pindah Ruangan Cepat (Darurat)</h3>
              <p style={styles.subtitle}>Ganti ruangan kelas tanpa repot menghapus atau mengetik ulang jadwal</p>
            </div>
          </div>
          <button onClick={onClose} style={styles.btnClose}><X size={18} /></button>
        </div>

        {/* Info Sesi Yang Dipindah */}
        <div style={styles.sessionCard}>
          <div style={styles.sessionCardTop}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              {teacherPhoto ? (
                <img src={teacherPhoto} alt={schedule.teacherName} style={styles.teacherImg} />
              ) : (
                <div style={styles.teacherAvatarFallback}>
                  {schedule.teacherName?.charAt(0) || 'G'}
                </div>
              )}
              <div>
                <div style={styles.sessionTitle}>{schedule.title || schedule.mapelName || 'Sesi Belajar'}</div>
                <div style={styles.sessionTeacher}>👨‍🏫 {schedule.teacherName || '-'} · 📚 {schedule.level || schedule.program}</div>
              </div>
            </div>
            <div style={styles.timeTag}>
              ⏰ {schedule.start} - {schedule.end}
            </div>
          </div>

          <div style={styles.relocationFlow}>
            <div style={styles.roomBoxOld}>
              <span style={styles.roomBoxLabel}>Ruangan Asal</span>
              <span style={styles.roomBoxValue}>🪐 {schedule.planet}</span>
            </div>
            <div style={styles.flowArrow}>
              <ArrowRight size={20} color="#6366f1" />
            </div>
            <div style={{...styles.roomBoxNew, borderColor: selectedPlanet ? '#6366f1' : '#cbd5e1'}}>
              <span style={styles.roomBoxLabel}>Ruangan Baru</span>
              <span style={{...styles.roomBoxValue, color: selectedPlanet ? '#4338ca' : '#94a3b8'}}>
                {selectedPlanet ? `🪐 ${selectedPlanet}` : 'Pilih di bawah'}
              </span>
            </div>
          </div>
        </div>

        {/* Pilihan Ruangan Baru */}
        <div style={styles.sectionTitle}>
          Pilih Ruangan Tujuan ({schedule.dateStr}):
        </div>
        <div style={styles.roomGrid}>
          {roomStatus.map(r => {
            const isSelected = selectedPlanet === r.planet;
            if (r.isCurrent) {
              return (
                <div key={r.planet} style={styles.roomCardCurrent}>
                  <div style={styles.roomCardTop}>
                    <span style={styles.roomName}>🪐 {r.planet}</span>
                    <span style={styles.badgeCurrent}>Ruang Saat Ini</span>
                  </div>
                  <div style={styles.roomDesc}>Lokasi sesi yang sedang aktif</div>
                </div>
              );
            }

            if (!r.available) {
              return (
                <div key={r.planet} style={styles.roomCardOccupied} title={`Terpakai oleh: ${r.occupant?.mapelName || r.occupant?.title}`}>
                  <div style={styles.roomCardTop}>
                    <span style={styles.roomName}>🪐 {r.planet}</span>
                    <span style={styles.badgeOccupied}>⛔ Terpakai</span>
                  </div>
                  <div style={styles.roomDesc}>
                    {r.occupant?.start} - {r.occupant?.end}: {r.occupant?.teacherName || 'Sesi lain'}
                  </div>
                </div>
              );
            }

            return (
              <div 
                key={r.planet} 
                onClick={() => setSelectedPlanet(r.planet)}
                style={{
                  ...styles.roomCardAvailable,
                  ...(isSelected ? styles.roomCardSelected : {})
                }}
              >
                <div style={styles.roomCardTop}>
                  <span style={{...styles.roomName, color: isSelected ? '#4338ca' : '#1e293b'}}>🪐 {r.planet}</span>
                  <span style={isSelected ? styles.badgeSelected : styles.badgeAvailable}>
                    {isSelected ? '✓ Terpilih' : '✅ Kosong'}
                  </span>
                </div>
                <div style={styles.roomDesc}>Siap digunakan jam {schedule.start} - {schedule.end}</div>
              </div>
            );
          })}
        </div>

        {/* Alasan Pemindahan */}
        <div style={{ marginTop: 16 }}>
          <label style={styles.label}>Alasan Pemindahan Ruangan:</label>
          <div style={styles.reasonTags}>
            {QUICK_REASONS.map(qr => (
              <button
                key={qr}
                type="button"
                onClick={() => setReason(qr)}
                style={{
                  ...styles.reasonTagBtn,
                  background: reason === qr ? '#e0e7ff' : '#f1f5f9',
                  color: reason === qr ? '#3730a3' : '#475569',
                  borderColor: reason === qr ? '#818cf8' : '#e2e8f0',
                  fontWeight: reason === qr ? 700 : 500
                }}
              >
                {qr}
              </button>
            ))}
          </div>
          <input
            type="text"
            placeholder="Catatan tambahan (opsional, misal: Mas Bima minta proyektor besar)"
            value={customReason}
            onChange={e => setCustomReason(e.target.value)}
            style={styles.inputNote}
          />
        </div>

        {/* Lingkup Perpindahan (Jika bagian dari seri 4 minggu) */}
        {schedule.seriesId && (
          <div style={styles.seriesBox}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={applyToSeries}
                onChange={e => setApplyToSeries(e.target.checked)}
                style={{ width: 16, height: 16 }}
              />
              <span style={{ fontSize: 12, color: '#92400e', fontWeight: 600 }}>
                🔄 Terapkan juga pemindahan ke seluruh sesi berulang di seri 4 minggu ini?
              </span>
            </label>
          </div>
        )}

        {errorMsg && (
          <div style={styles.errorAlert}>
            <AlertTriangle size={15} color="#b91c1c" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Footer Actions */}
        <div style={styles.footer}>
          <button type="button" onClick={onClose} style={styles.btnCancel} disabled={saving}>
            Batal
          </button>
          <button 
            type="button" 
            onClick={handleConfirmMove} 
            disabled={saving || !selectedPlanet}
            style={{
              ...styles.btnSubmit,
              opacity: saving || !selectedPlanet ? 0.6 : 1,
              cursor: saving || !selectedPlanet ? 'not-allowed' : 'pointer'
            }}
          >
            {saving ? 'Menyimpan...' : `🚀 Pindahkan ke Ruang ${selectedPlanet || '...'}`}
          </button>
        </div>
      </div>
    </div>
  );
}

const styles = {
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(15, 23, 42, 0.65)',
    backdropFilter: 'blur(4px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
    padding: 16
  },
  modal: {
    background: '#ffffff',
    borderRadius: 20,
    width: '100%',
    maxWidth: 580,
    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
    padding: 24,
    display: 'flex',
    flexDirection: 'column',
    maxHeight: '92vh',
    overflowY: 'auto'
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16
  },
  iconBadge: {
    width: 42,
    height: 42,
    borderRadius: 12,
    background: '#e0e7ff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 20
  },
  title: {
    margin: 0,
    fontSize: 17,
    fontWeight: 800,
    color: '#0f172a'
  },
  subtitle: {
    margin: '3px 0 0',
    fontSize: 11.5,
    color: '#64748b'
  },
  btnClose: {
    background: '#f1f5f9',
    border: 'none',
    borderRadius: 8,
    width: 32,
    height: 32,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    color: '#64748b'
  },
  sessionCard: {
    background: '#f8fafc',
    borderRadius: 14,
    border: '1px solid #e2e8f0',
    padding: 14,
    marginBottom: 16
  },
  sessionCardTop: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12
  },
  teacherImg: {
    width: 38,
    height: 38,
    borderRadius: '50%',
    objectFit: 'cover',
    border: '2px solid #818cf8'
  },
  teacherAvatarFallback: {
    width: 38,
    height: 38,
    borderRadius: '50%',
    background: '#6366f1',
    color: '#ffffff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 800,
    fontSize: 15
  },
  sessionTitle: {
    fontSize: 13.5,
    fontWeight: 800,
    color: '#0f172a'
  },
  sessionTeacher: {
    fontSize: 11,
    color: '#64748b'
  },
  timeTag: {
    fontSize: 11,
    fontWeight: 700,
    padding: '4px 10px',
    borderRadius: 8,
    background: '#eef2ff',
    color: '#4338ca',
    border: '1px solid #c7d2fe'
  },
  relocationFlow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    paddingTop: 10,
    borderTop: '1px dashed #cbd5e1'
  },
  roomBoxOld: {
    flex: 1,
    padding: '8px 12px',
    borderRadius: 10,
    background: '#fff1f2',
    border: '1px solid #fecdd3',
    display: 'flex',
    flexDirection: 'column'
  },
  roomBoxNew: {
    flex: 1,
    padding: '8px 12px',
    borderRadius: 10,
    background: '#ffffff',
    border: '2px solid #cbd5e1',
    display: 'flex',
    flexDirection: 'column'
  },
  roomBoxLabel: {
    fontSize: 10,
    color: '#64748b',
    fontWeight: 600,
    textTransform: 'uppercase'
  },
  roomBoxValue: {
    fontSize: 13,
    fontWeight: 800,
    color: '#be123c',
    marginTop: 2
  },
  flowArrow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 6
  },
  sectionTitle: {
    fontSize: 12.5,
    fontWeight: 700,
    color: '#334155',
    marginBottom: 8
  },
  roomGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: 10
  },
  roomCardAvailable: {
    padding: 12,
    borderRadius: 12,
    background: '#f0fdf4',
    border: '1.5px solid #bbf7d0',
    cursor: 'pointer',
    transition: 'all 0.15s ease'
  },
  roomCardSelected: {
    background: '#e0e7ff',
    border: '2px solid #6366f1',
    boxShadow: '0 4px 12px rgba(99, 102, 241, 0.2)'
  },
  roomCardOccupied: {
    padding: 12,
    borderRadius: 12,
    background: '#fef2f2',
    border: '1px dashed #fecaca',
    opacity: 0.65,
    cursor: 'not-allowed'
  },
  roomCardCurrent: {
    padding: 12,
    borderRadius: 12,
    background: '#f8fafc',
    border: '1px dashed #cbd5e1',
    opacity: 0.6
  },
  roomCardTop: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4
  },
  roomName: {
    fontSize: 12.5,
    fontWeight: 800,
    color: '#0f172a'
  },
  badgeAvailable: {
    fontSize: 10,
    fontWeight: 700,
    color: '#15803d',
    padding: '2px 6px',
    borderRadius: 6,
    background: '#dcfce7'
  },
  badgeSelected: {
    fontSize: 10,
    fontWeight: 800,
    color: '#ffffff',
    padding: '2px 7px',
    borderRadius: 6,
    background: '#4f46e5'
  },
  badgeOccupied: {
    fontSize: 10,
    fontWeight: 700,
    color: '#b91c1c',
    padding: '2px 6px',
    borderRadius: 6,
    background: '#fee2e2'
  },
  badgeCurrent: {
    fontSize: 10,
    fontWeight: 600,
    color: '#64748b'
  },
  roomDesc: {
    fontSize: 10.5,
    color: '#64748b'
  },
  label: {
    fontSize: 12,
    fontWeight: 700,
    color: '#334155',
    marginBottom: 6,
    display: 'block'
  },
  reasonTags: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 8
  },
  reasonTagBtn: {
    padding: '5px 10px',
    borderRadius: 8,
    border: '1px solid',
    fontSize: 11,
    cursor: 'pointer'
  },
  inputNote: {
    width: '100%',
    padding: '8px 12px',
    borderRadius: 8,
    border: '1px solid #cbd5e1',
    fontSize: 12,
    boxSizing: 'border-box'
  },
  seriesBox: {
    marginTop: 12,
    padding: '10px 12px',
    borderRadius: 10,
    background: '#fef3c7',
    border: '1px solid #fde68a'
  },
  errorAlert: {
    marginTop: 12,
    padding: '8px 12px',
    borderRadius: 8,
    background: '#fee2e2',
    border: '1px solid #fca5a5',
    color: '#b91c1c',
    fontSize: 12,
    display: 'flex',
    alignItems: 'center',
    gap: 8
  },
  footer: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 20,
    paddingTop: 14,
    borderTop: '1px solid #e2e8f0'
  },
  btnCancel: {
    padding: '9px 16px',
    borderRadius: 10,
    background: '#f1f5f9',
    color: '#475569',
    border: 'none',
    fontSize: 12.5,
    fontWeight: 700,
    cursor: 'pointer'
  },
  btnSubmit: {
    padding: '9px 20px',
    borderRadius: 10,
    background: '#4f46e5',
    color: '#ffffff',
    border: 'none',
    fontSize: 12.5,
    fontWeight: 800,
    cursor: 'pointer',
    boxShadow: '0 4px 12px rgba(79, 70, 229, 0.3)'
  }
};
