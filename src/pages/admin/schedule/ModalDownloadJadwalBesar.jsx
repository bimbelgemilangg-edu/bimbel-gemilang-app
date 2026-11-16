// src/pages/admin/schedule/ModalDownloadJadwalBesar.jsx
import React, { useState } from 'react';
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { X, Download, Copy, Check, MessageSquare, FileText, Calendar, Filter } from 'lucide-react';

const DAYS_ID = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
const PLANETS = ["MERKURIUS", "VENUS", "BUMI", "MARS", "JUPITER"];

export default function ModalDownloadJadwalBesar({
  isOpen,
  onClose,
  schedules = [],
  availableTeachers = [],
  selectedDate = new Date(),
  onShowAlert
}) {
  const [formatTab, setFormatTab] = useState('pdf'); // 'pdf' | 'wa'
  const [selectedPlanet, setSelectedPlanet] = useState('Semua');
  const [selectedTeacher, setSelectedTeacher] = useState('Semua');
  const [copiedWA, setCopiedWA] = useState(false);

  if (!isOpen) return null;

  // Hitung rentang 7 hari (Senin - Minggu)
  const getWeekDates = (baseDate) => {
    const d = new Date(baseDate);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Senin
    d.setDate(diff);
    
    const dates = [];
    for (let i = 0; i < 7; i++) {
      const cur = new Date(d);
      cur.setDate(d.getDate() + i);
      const year = cur.getFullYear();
      const month = String(cur.getMonth() + 1).padStart(2, '0');
      const dayStr = String(cur.getDate()).padStart(2, '0');
      dates.push(`${year}-${month}-${dayStr}`);
    }
    return dates;
  };

  const weekDates = getWeekDates(selectedDate);
  const startDateStr = weekDates[0];
  const endDateStr = weekDates[6];

  const startDateFormatted = new Date(startDateStr).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
  const endDateFormatted = new Date(endDateStr).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });

  // Filter jadwal sesuai minggu & filter dropdown
  const filteredSchedules = schedules.filter(s => {
    if (!weekDates.includes(s.dateStr)) return false;
    if (s.status === 'cancelled') return false;
    if (selectedPlanet !== 'Semua' && s.planet !== selectedPlanet) return false;
    if (selectedTeacher !== 'Semua') {
      const matchId = s.teacherId === selectedTeacher;
      const matchName = s.teacherName && s.teacherName.toLowerCase() === selectedTeacher.toLowerCase();
      if (!matchId && !matchName) return false;
    }
    return true;
  });

  // Urutkan jadwal: Hari (Senin -> Minggu) -> Jam Mulai -> Ruangan
  const dayOrder = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'];
  const sortedSchedules = [...filteredSchedules].sort((a, b) => {
    const dA = new Date(a.dateStr);
    const dB = new Date(b.dateStr);
    const dayNameA = DAYS_ID[dA.getDay()];
    const dayNameB = DAYS_ID[dB.getDay()];
    const idxA = dayOrder.indexOf(dayNameA);
    const idxB = dayOrder.indexOf(dayNameB);

    if (idxA !== idxB) return idxA - idxB;
    if (a.start !== b.start) return a.start.localeCompare(b.start);
    return a.planet.localeCompare(b.planet);
  });

  // Generate Teks WhatsApp
  const generateWhatsAppText = () => {
    let text = `📢 *JADWAL OPERASIONAL MENGAJAR BIMBEL GEMILANG*\n`;
    text += `📅 *Periode:* ${startDateFormatted} s/d ${endDateFormatted}\n`;
    text += `🏢 *Total Sesi:* ${sortedSchedules.length} Sesi Terjadwal\n`;
    text += `========================================\n\n`;

    if (sortedSchedules.length === 0) {
      text += `_Tidak ada jadwal aktif untuk periode dan filter yang dipilih._\n`;
    } else {
      let currentDay = '';
      sortedSchedules.forEach(s => {
        const d = new Date(s.dateStr);
        const hari = DAYS_ID[d.getDay()];
        const tgl = `${d.getDate()}/${d.getMonth() + 1}`;

        if (hari !== currentDay) {
          currentDay = hari;
          text += `🗓️ *${hari.toUpperCase()}, ${tgl}*\n`;
          text += `----------------------------------------\n`;
        }

        const studentList = (s.students || []).map(st => st.nama?.split(' ')[0] || st).join(', ');
        const studentCount = s.students?.length || 0;

        text += `⏰ *${s.start} - ${s.end}* | 🪐 *${s.planet}*\n`;
        text += `   • *Mapel:* ${s.title || s.mapelName || '-'} (${s.level || s.program})\n`;
        text += `   • *Tentor:* ${s.teacherName || s.booker || '-'}\n`;
        text += `   • *Siswa (${studentCount}):* ${studentList || '-'}\n\n`;
      });
    }

    text += `========================================\n`;
    text += `📌 *SOP & CATATAN TENTOR:*\n`;
    text += `1. Mohon hadir di Bimbel minimal 10 menit sebelum jam kelas dimulai.\n`;
    text += `2. Wajib mengisi absensi tentor & siswa di aplikasi setelah sesi selesai.\n`;
    text += `3. Jika ada kendala ruangan atau proyektor, segera lapor Admin Operasional.\n`;
    text += `\n_Bimbel Gemilang — Semangat Mendidik Generasi Unggul_ ✨`;

    return text;
  };

  const handleCopyWhatsApp = () => {
    const text = generateWhatsAppText();
    navigator.clipboard.writeText(text).then(() => {
      setCopiedWA(true);
      setTimeout(() => setCopiedWA(false), 2500);
      if (onShowAlert) onShowAlert("✅ Teks jadwal siap share berhasil disalin ke clipboard!");
    }).catch(err => {
      console.error("Gagal menyalin:", err);
      if (onShowAlert) onShowAlert("❌ Gagal menyalin teks ke clipboard");
    });
  };

  // Generate & Download PDF Master Timetable
  const handleDownloadPDF = () => {
    if (sortedSchedules.length === 0) {
      if (onShowAlert) onShowAlert("⚠️ Tidak ada jadwal yang cocok untuk didownload!");
      return;
    }

    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
    
    // Header Dokumen
    doc.setFontSize(16);
    doc.setFont(undefined, 'bold');
    doc.text('BIMBEL GEMILANG — MASTER JADWAL OPERASIONAL MINGGUAN', 14, 15);
    
    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    doc.text(`Periode: ${startDateFormatted} s/d ${endDateFormatted}  |  Total: ${sortedSchedules.length} Sesi Terjadwal`, 14, 22);
    if (selectedPlanet !== 'Semua' || selectedTeacher !== 'Semua') {
      doc.text(`Filter: Ruangan [${selectedPlanet}], Guru [${selectedTeacher}]`, 14, 27);
    }

    // Rows Data
    const rows = sortedSchedules.map(s => {
      const d = new Date(s.dateStr);
      const hari = DAYS_ID[d.getDay()];
      const tgl = `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
      const siswaNames = (s.students || []).map(st => st.nama).join(', ') || '-';
      const jmlSiswa = String(s.students?.length || 0);

      return [
        `${hari}\n${tgl}`,
        `${s.start} - ${s.end}`,
        s.planet,
        `${s.title || s.mapelName || '-'}\n(${s.level || s.program})`,
        s.teacherName || s.booker || '-',
        jmlSiswa,
        siswaNames
      ];
    });

    autoTable(doc, {
      startY: selectedPlanet !== 'Semua' || selectedTeacher !== 'Semua' ? 31 : 26,
      head: [['Hari & Tgl', 'Jam Sesi', 'Ruangan', 'Mata Pelajaran & Jenjang', 'Tentor / Pengajar', 'Jml', 'Daftar Siswa']],
      body: rows,
      styles: { fontSize: 8.5, cellPadding: 2.8, valign: 'middle' },
      headStyles: { fillColor: [30, 41, 59], textColor: [255, 255, 255], fontStyle: 'bold' },
      columnStyles: {
        0: { cellWidth: 24, fontStyle: 'bold' },
        1: { cellWidth: 24, halign: 'center' },
        2: { cellWidth: 22, fontStyle: 'bold' },
        3: { cellWidth: 45 },
        4: { cellWidth: 38 },
        5: { cellWidth: 14, halign: 'center' },
        6: { cellWidth: 'auto' }
      },
      theme: 'grid',
      alternateRowStyles: { fillColor: [248, 250, 252] }
    });

    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(150);
      doc.text(
        `Dicetak dari Sistem Bimbel Gemilang pada: ${new Date().toLocaleString('id-ID')} — Halaman ${i} dari ${pageCount}`,
        14,
        doc.internal.pageSize.getHeight() - 7
      );
    }

    doc.save(`Jadwal_Master_Gemilang_${startDateStr}_sd_${endDateStr}.pdf`);
    if (onShowAlert) onShowAlert("✅ PDF Master Jadwal Mingguan berhasil didownload!");
    onClose();
  };

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={e => e.stopPropagation()}>
        {/* Header Modal */}
        <div style={styles.header}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={styles.iconBadge}>📋</div>
            <div>
              <h3 style={styles.title}>Download & Share Jadwal Besar</h3>
              <p style={styles.subtitle}>Ekspor jadwal mingguan lengkap untuk dibagikan ke grup WhatsApp tentor atau dicetak</p>
            </div>
          </div>
          <button onClick={onClose} style={styles.btnClose}><X size={18} /></button>
        </div>

        {/* Tab Switcher */}
        <div style={styles.tabBar}>
          <button
            type="button"
            onClick={() => setFormatTab('pdf')}
            style={{
              ...styles.tabBtn,
              background: formatTab === 'pdf' ? '#4f46e5' : '#f1f5f9',
              color: formatTab === 'pdf' ? '#ffffff' : '#475569',
              fontWeight: formatTab === 'pdf' ? 800 : 600
            }}
          >
            <FileText size={15} /> 📄 Cetak / Download PDF Master
          </button>
          <button
            type="button"
            onClick={() => setFormatTab('wa')}
            style={{
              ...styles.tabBtn,
              background: formatTab === 'wa' ? '#16a34a' : '#f1f5f9',
              color: formatTab === 'wa' ? '#ffffff' : '#475569',
              fontWeight: formatTab === 'wa' ? 800 : 600
            }}
          >
            <MessageSquare size={15} /> 💬 Salin Format WA Grup Tentor
          </button>
        </div>

        {/* Filters */}
        <div style={styles.filterSection}>
          <div style={styles.filterRow}>
            <div style={styles.filterGroup}>
              <label style={styles.filterLabel}>📅 Periode Minggu Ini:</label>
              <div style={styles.periodBadge}>
                {startDateFormatted} — {endDateFormatted} ({sortedSchedules.length} Sesi)
              </div>
            </div>

            <div style={styles.filterGroup}>
              <label style={styles.filterLabel}>🪐 Filter Ruangan:</label>
              <select
                value={selectedPlanet}
                onChange={e => setSelectedPlanet(e.target.value)}
                style={styles.filterSelect}
              >
                <option value="Semua">Semua Ruangan (5 Planet)</option>
                {PLANETS.map(p => <option key={p} value={p}>Ruang {p}</option>)}
              </select>
            </div>

            <div style={styles.filterGroup}>
              <label style={styles.filterLabel}>👨‍🏫 Filter Tentor:</label>
              <select
                value={selectedTeacher}
                onChange={e => setSelectedTeacher(e.target.value)}
                style={styles.filterSelect}
              >
                <option value="Semua">Semua Tentor</option>
                {availableTeachers.map(t => (
                  <option key={t.id} value={t.guruId || t.id}>
                    {t.nama}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Tab Content: PDF */}
        {formatTab === 'pdf' && (
          <div style={styles.contentBox}>
            <div style={styles.previewBox}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#1e293b', marginBottom: 4 }}>
                📄 Format PDF Master Mingguan (Landscape A4)
              </div>
              <p style={{ fontSize: 11.5, color: '#64748b', margin: 0, lineHeight: 1.5 }}>
                Menyajikan tabel visual terpadu berurutan dari Senin s/d Minggu yang mencakup seluruh ruangan (Merkurius, Venus, Bumi, Mars, Jupiter), jam sesi, mata pelajaran, nama tentor, dan daftar murid. Siap dicetak untuk papan pengumuman kantor atau disimpan sebagai arsip mingguan.
              </p>
            </div>

            <div style={styles.summaryStats}>
              <div style={styles.statCard}>
                <span style={styles.statLabel}>Total Sesi</span>
                <span style={styles.statVal}>{sortedSchedules.length}</span>
              </div>
              <div style={styles.statCard}>
                <span style={styles.statLabel}>Ruangan Aktif</span>
                <span style={styles.statVal}>
                  {new Set(sortedSchedules.map(s => s.planet)).size} / 5
                </span>
              </div>
              <div style={styles.statCard}>
                <span style={styles.statLabel}>Tentor Mengajar</span>
                <span style={styles.statVal}>
                  {new Set(sortedSchedules.map(s => s.teacherId || s.teacherName)).size}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Tab Content: WA */}
        {formatTab === 'wa' && (
          <div style={styles.contentBox}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: '#334155' }}>
                Pratinjau Teks WhatsApp (Siap Kirim ke Grup):
              </span>
              <button
                type="button"
                onClick={handleCopyWhatsApp}
                style={{
                  ...styles.btnCopyWA,
                  background: copiedWA ? '#15803d' : '#22c55e'
                }}
              >
                {copiedWA ? <Check size={14} /> : <Copy size={14} />}
                {copiedWA ? '✓ Berhasil Disalin!' : 'Salin Teks WhatsApp'}
              </button>
            </div>

            <textarea
              readOnly
              value={generateWhatsAppText()}
              style={styles.waTextarea}
            />
          </div>
        )}

        {/* Footer */}
        <div style={styles.footer}>
          <button type="button" onClick={onClose} style={styles.btnCancel}>
            Tutup
          </button>
          {formatTab === 'pdf' ? (
            <button
              type="button"
              onClick={handleDownloadPDF}
              style={styles.btnDownload}
            >
              <Download size={16} /> Unduh PDF Master Jadwal
            </button>
          ) : (
            <button
              type="button"
              onClick={handleCopyWhatsApp}
              style={{
                ...styles.btnCopyAction,
                background: copiedWA ? '#15803d' : '#16a34a'
              }}
            >
              {copiedWA ? <Check size={16} /> : <Copy size={16} />}
              {copiedWA ? 'Teks Tersalin!' : 'Salin ke WhatsApp'}
            </button>
          )}
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
  tabBar: {
    display: 'flex',
    gap: 8,
    marginBottom: 16
  },
  tabBtn: {
    flex: 1,
    padding: '9px 12px',
    borderRadius: 10,
    border: 'none',
    fontSize: 12,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    transition: 'all 0.15s ease'
  },
  filterSection: {
    background: '#f8fafc',
    borderRadius: 12,
    border: '1px solid #e2e8f0',
    padding: 12,
    marginBottom: 16
  },
  filterRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
    gap: 10
  },
  filterGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: 4
  },
  filterLabel: {
    fontSize: 10.5,
    fontWeight: 700,
    color: '#64748b'
  },
  periodBadge: {
    padding: '6px 10px',
    borderRadius: 8,
    background: '#ffffff',
    border: '1px solid #cbd5e1',
    fontSize: 11,
    fontWeight: 700,
    color: '#334155'
  },
  filterSelect: {
    padding: '6px 10px',
    borderRadius: 8,
    border: '1px solid #cbd5e1',
    background: '#ffffff',
    fontSize: 11.5,
    fontWeight: 600,
    color: '#0f172a'
  },
  contentBox: {
    display: 'flex',
    flexDirection: 'column',
    gap: 12
  },
  previewBox: {
    padding: 14,
    borderRadius: 12,
    background: '#eef2ff',
    border: '1px solid #c7d2fe'
  },
  summaryStats: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: 10
  },
  statCard: {
    padding: '10px 14px',
    borderRadius: 10,
    background: '#f8fafc',
    border: '1px solid #e2e8f0',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center'
  },
  statLabel: {
    fontSize: 10.5,
    color: '#64748b',
    fontWeight: 600
  },
  statVal: {
    fontSize: 18,
    fontWeight: 800,
    color: '#4f46e5',
    marginTop: 2
  },
  waTextarea: {
    width: '100%',
    height: 220,
    borderRadius: 10,
    border: '1px solid #cbd5e1',
    padding: 12,
    fontSize: 11,
    fontFamily: 'monospace',
    color: '#0f172a',
    background: '#f8fafc',
    boxSizing: 'border-box',
    resize: 'vertical'
  },
  btnCopyWA: {
    padding: '5px 10px',
    borderRadius: 8,
    color: '#ffffff',
    border: 'none',
    fontSize: 11,
    fontWeight: 700,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: 4
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
  btnDownload: {
    padding: '9px 20px',
    borderRadius: 10,
    background: '#4f46e5',
    color: '#ffffff',
    border: 'none',
    fontSize: 12.5,
    fontWeight: 800,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    boxShadow: '0 4px 12px rgba(79, 70, 229, 0.3)'
  },
  btnCopyAction: {
    padding: '9px 20px',
    borderRadius: 10,
    color: '#ffffff',
    border: 'none',
    fontSize: 12.5,
    fontWeight: 800,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    boxShadow: '0 4px 12px rgba(22, 163, 74, 0.3)'
  }
};
