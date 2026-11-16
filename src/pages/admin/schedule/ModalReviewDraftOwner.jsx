// src/pages/admin/schedule/ModalReviewDraftOwner.jsx
import React, { useState } from 'react';
import { db } from '../../../firebase';
import { collection, getDocs, writeBatch, doc, serverTimestamp, deleteDoc } from 'firebase/firestore';
import { X, CheckCircle2, Trash2, MessageSquare, AlertCircle, Sparkles, ShieldCheck } from 'lucide-react';

export default function ModalReviewDraftOwner({
  isOpen,
  onClose,
  draftSchedules = [],
  draftNotes = '',
  onSuccess,
  onShowAlert
}) {
  const [submitting, setSubmitting] = useState(false);
  const [ownerFeedback, setOwnerFeedback] = useState('');

  if (!isOpen) return null;

  // Setujui & Terapkan Sesi Draft ke Jadwal Resmi (jadwal_bimbel)
  const handleApproveAndPublish = async () => {
    if (draftSchedules.length === 0) {
      if (onShowAlert) onShowAlert("⚠️ Tidak ada sesi draft untuk diterapkan!");
      return;
    }

    const confirm = window.confirm(
      `Apakah Anda yakin ingin menyetujui & menerapkan ${draftSchedules.length} sesi jadwal ini menjadi JADWAL RESMI operasional Bimbel Gemilang?`
    );
    if (!confirm) return;

    setSubmitting(true);
    try {
      const batch = writeBatch(db);

      // Pindahkan setiap sesi draft ke koleksi resmi 'jadwal_bimbel'
      draftSchedules.forEach(ds => {
        const { id, isDraft, draftCreatedAt, draftNote, ...cleanData } = ds;
        const liveDocRef = doc(collection(db, "jadwal_bimbel"));
        batch.set(liveDocRef, {
          ...cleanData,
          status: 'scheduled',
          appliedFromDraftAt: serverTimestamp(),
          ownerApproval: {
            approved: true,
            approvedAt: new Date().toISOString(),
            ownerFeedback: ownerFeedback || 'Disetujui Owner'
          },
          updatedAt: serverTimestamp()
        });

        // Hapus dari koleksi draft 'jadwal_draft' jika ada id dokumennya
        if (id) {
          const draftDocRef = doc(db, "jadwal_draft", id);
          batch.delete(draftDocRef);
        }
      });

      await batch.commit();

      if (onShowAlert) {
        onShowAlert(`🎉 Berhasil! ${draftSchedules.length} sesi jadwal draft telah disetujui & aktif sebagai Jadwal Resmi!`);
      }
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      console.error("Gagal menyetujui jadwal:", err);
      if (onShowAlert) onShowAlert("❌ Gagal menerapkan jadwal: " + (err.message || 'Terjadi kesalahan'));
    } finally {
      setSubmitting(false);
    }
  };

  // Bersihkan / Batalkan Coretan Draft
  const handleClearDraft = async () => {
    const confirm = window.confirm(
      "Apakah Anda yakin ingin menghapus seluruh coretan draft simulasi ini? Tindakan ini tidak dapat dibatalkan."
    );
    if (!confirm) return;

    setSubmitting(true);
    try {
      const batch = writeBatch(db);
      draftSchedules.forEach(ds => {
        if (ds.id) {
          batch.delete(doc(db, "jadwal_draft", ds.id));
        }
      });
      await batch.commit();

      if (onShowAlert) onShowAlert("🗑️ Coretan draft jadwal berhasil dibersihkan!");
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      console.error("Gagal menghapus draft:", err);
      if (onShowAlert) onShowAlert("❌ Gagal menghapus draft: " + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div style={styles.header}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={styles.iconBadge}>👑</div>
            <div>
              <h3 style={styles.title}>Review & Persetujuan Jadwal (Owner)</h3>
              <p style={styles.subtitle}>Tinjau usulan skema jadwal simulasi sebelum diterapkan ke operasional resmi</p>
            </div>
          </div>
          <button onClick={onClose} style={styles.btnClose}><X size={18} /></button>
        </div>

        {/* Catatan Admin / Pengajuan */}
        <div style={styles.adminNoteBox}>
          <div style={styles.adminNoteHeader}>
            <Sparkles size={16} color="#7c3aed" />
            <span style={styles.adminNoteTitle}>Catatan Pengajuan Skema dari Admin:</span>
          </div>
          <div style={styles.adminNoteBody}>
            {draftNotes || "Skema jadwal baru diajukan untuk ditinjau oleh Owner (kesesuaian jam kelas sore, tentor, dan mood belajar siswa)."}
          </div>
        </div>

        {/* Daftar Sesi Draft */}
        <div style={styles.sectionHeader}>
          <span>Daftar Sesi Simulasi Menunggu Approval ({draftSchedules.length} Sesi):</span>
        </div>

        <div style={styles.draftListContainer}>
          {draftSchedules.length === 0 ? (
            <div style={styles.emptyBox}>Tidak ada sesi draft yang sedang menunggu persetujuan.</div>
          ) : (
            draftSchedules.map((s, idx) => (
              <div key={s.id || idx} style={styles.draftCard}>
                <div style={styles.draftCardHeader}>
                  <span style={styles.draftPlanetTag}>🪐 {s.planet}</span>
                  <span style={styles.draftTimeTag}>⏰ {s.start} - {s.end}</span>
                  <span style={styles.draftDateTag}>📅 {s.dateStr}</span>
                </div>
                <div style={styles.draftCardTitle}>{s.title || s.mapelName || 'Sesi Belajar'}</div>
                <div style={styles.draftCardMeta}>
                  <span>👨‍🏫 Tentor: <b>{s.teacherName || '-'}</b></span>
                  <span>📚 Jenjang: <b>{s.level || s.program}</b></span>
                  <span>👥 Siswa: <b>{s.students?.length || 0} orang</b></span>
                </div>
                {s.students && s.students.length > 0 && (
                  <div style={styles.studentChips}>
                    {s.students.map((st, i) => (
                      <span key={i} style={styles.studentChip}>
                        {st.nama?.split(' ')[0] || st}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Catatan Balasan / Feedback Owner */}
        <div style={{ marginTop: 14 }}>
          <label style={styles.label}>Catatan Tambahan Owner (Opsional):</label>
          <input
            type="text"
            placeholder="Contoh: Skema sudah pas, tentor Mas Bima siap mengampu kelas sore SMA ini."
            value={ownerFeedback}
            onChange={e => setOwnerFeedback(e.target.value)}
            style={styles.inputFeedback}
          />
        </div>

        {/* Footer Actions */}
        <div style={styles.footer}>
          <button 
            type="button" 
            onClick={handleClearDraft} 
            disabled={submitting || draftSchedules.length === 0}
            style={styles.btnClear}
          >
            <Trash2 size={15} /> Bersihkan Coretan
          </button>
          
          <div style={{ display: 'flex', gap: 10 }}>
            <button type="button" onClick={onClose} style={styles.btnCancel} disabled={submitting}>
              Tutup
            </button>
            <button 
              type="button" 
              onClick={handleApproveAndPublish} 
              disabled={submitting || draftSchedules.length === 0}
              style={{
                ...styles.btnApprove,
                opacity: submitting || draftSchedules.length === 0 ? 0.6 : 1
              }}
            >
              <CheckCircle2 size={16} /> 
              {submitting ? 'Memproses...' : '✅ Setujui & Terapkan Jadi Jadwal Resmi'}
            </button>
          </div>
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
    maxWidth: 680,
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
    background: '#ede9fe',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 22
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
  adminNoteBox: {
    padding: 14,
    borderRadius: 12,
    background: '#f5f3ff',
    border: '1.5px solid #ddd6fe',
    marginBottom: 16
  },
  adminNoteHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4
  },
  adminNoteTitle: {
    fontSize: 12,
    fontWeight: 800,
    color: '#6d28d9'
  },
  adminNoteBody: {
    fontSize: 12,
    color: '#4c1d95',
    lineHeight: 1.5
  },
  sectionHeader: {
    fontSize: 12.5,
    fontWeight: 800,
    color: '#334155',
    marginBottom: 10
  },
  draftListContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
    maxHeight: 280,
    overflowY: 'auto',
    paddingRight: 4
  },
  emptyBox: {
    textAlign: 'center',
    padding: '30px 16px',
    background: '#f8fafc',
    borderRadius: 12,
    border: '1px dashed #cbd5e1',
    color: '#64748b',
    fontSize: 12
  },
  draftCard: {
    padding: 12,
    borderRadius: 12,
    background: '#f8fafc',
    border: '1px solid #e2e8f0',
    display: 'flex',
    flexDirection: 'column',
    gap: 4
  },
  draftCardHeader: {
    display: 'flex',
    gap: 6,
    flexWrap: 'wrap'
  },
  draftPlanetTag: {
    fontSize: 10,
    fontWeight: 700,
    padding: '2px 8px',
    borderRadius: 6,
    background: '#e0e7ff',
    color: '#3730a3'
  },
  draftTimeTag: {
    fontSize: 10,
    fontWeight: 700,
    padding: '2px 8px',
    borderRadius: 6,
    background: '#fef3c7',
    color: '#92400e'
  },
  draftDateTag: {
    fontSize: 10,
    fontWeight: 600,
    padding: '2px 8px',
    borderRadius: 6,
    background: '#f1f5f9',
    color: '#475569'
  },
  draftCardTitle: {
    fontSize: 13,
    fontWeight: 800,
    color: '#0f172a',
    marginTop: 2
  },
  draftCardMeta: {
    display: 'flex',
    gap: 12,
    fontSize: 11,
    color: '#64748b',
    flexWrap: 'wrap'
  },
  studentChips: {
    display: 'flex',
    gap: 4,
    flexWrap: 'wrap',
    marginTop: 4
  },
  studentChip: {
    fontSize: 10,
    padding: '1px 6px',
    borderRadius: 4,
    background: '#e2e8f0',
    color: '#334155'
  },
  label: {
    fontSize: 11.5,
    fontWeight: 700,
    color: '#334155',
    marginBottom: 4,
    display: 'block'
  },
  inputFeedback: {
    width: '100%',
    padding: '8px 12px',
    borderRadius: 8,
    border: '1px solid #cbd5e1',
    fontSize: 12,
    boxSizing: 'border-box'
  },
  footer: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 20,
    paddingTop: 14,
    borderTop: '1px solid #e2e8f0'
  },
  btnClear: {
    padding: '9px 14px',
    borderRadius: 10,
    background: '#fee2e2',
    color: '#b91c1c',
    border: 'none',
    fontSize: 12,
    fontWeight: 700,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: 6
  },
  btnCancel: {
    padding: '9px 16px',
    borderRadius: 10,
    background: '#f1f5f9',
    color: '#475569',
    border: 'none',
    fontSize: 12,
    fontWeight: 700,
    cursor: 'pointer'
  },
  btnApprove: {
    padding: '9px 18px',
    borderRadius: 10,
    background: '#16a34a',
    color: '#ffffff',
    border: 'none',
    fontSize: 12,
    fontWeight: 800,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    boxShadow: '0 4px 12px rgba(22, 163, 74, 0.3)'
  }
};
