// src/pages/admin/schedule/ModalDownloadJadwalBesar.jsx
import React, { useState } from 'react';
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { 
  X, Download, Copy, Check, MessageSquare, FileText, 
  Printer, Sparkles, Filter, ExternalLink, Calendar 
} from 'lucide-react';

const DAYS_ID = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
const DAYS_ORDER = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
const PLANETS = ["MERKURIUS", "VENUS", "BUMI", "MARS", "JUPITER"];

export default function ModalDownloadJadwalBesar({
  isOpen,
  onClose,
  schedules = [],
  availableTeachers = [],
  selectedDate = new Date(),
  onShowAlert
}) {
  const [formatTab, setFormatTab] = useState('excel_print'); // 'excel_print' | 'pdf' | 'wa'
  const [selectedPlanet, setSelectedPlanet] = useState('Semua');
  const [selectedTeacher, setSelectedTeacher] = useState('Semua');
  const [copiedWA, setCopiedWA] = useState(false);

  if (!isOpen) return null;

  // Helper foto tentor
  const getTeacherPhoto = (item) => {
    if (item.teacherFotoUrl) return item.teacherFotoUrl;
    const t = availableTeachers.find(tch =>
      (item.teacherId && (tch.id === item.teacherId || tch.guruId === item.teacherId)) ||
      (item.teacherName && tch.nama && tch.nama.toLowerCase() === item.teacherName.toLowerCase())
    );
    return t?.fotoUrl || null;
  };

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

  // Deteksi kategori kelas sesuai Excel Bimbel Gemilang
  const detectClassCategory = (item) => {
    const text = `${item.title || ''} ${item.mapelName || ''} ${item.level || ''} ${(item.students || []).map(s => s.kelasSekolah || '').join(' ')}`.toUpperCase();

    if (item.program === 'English Course' || text.includes('ENGLISH COURSE') || text.includes('ENGLISH')) {
      return 'ENGLISH_COURSE';
    }
    if (text.includes('3 SD') || text.includes('KELAS 3') || text.includes('K3')) return 'SD_3';
    if (text.includes('4 SD') || text.includes('KELAS 4') || text.includes('K4')) return 'SD_4';
    if (text.includes('5 SD') || text.includes('KELAS 5') || text.includes('K5')) return 'SD_5';
    if (text.includes('6 SD') || text.includes('KELAS 6') || text.includes('K6')) return 'SD_6';

    if (text.includes('7 SMP') || text.includes('KELAS 7') || text.includes('K7')) return 'SMP_7';
    if (text.includes('8 SMP') || text.includes('KELAS 8') || text.includes('K8')) return 'SMP_8';
    if (text.includes('9 SMP') || text.includes('KELAS 9') || text.includes('9A') || text.includes('9B') || text.includes('K9')) return 'SMP_9';

    if (text.includes('SMA') || item.level === 'SMA') return 'SMA_ALL';
    if (item.level === 'SD') return 'SD_3';
    if (item.level === 'SMP') return 'SMP_7';
    return 'LAINNYA';
  };

  const SD_CONFIGS = [
    { key: 'SD_3', title: 'KELAS 3 SD (60 MENIT)', headerBg: '#ea580c', defaultRoom: 'BUMI' },
    { key: 'SD_4', title: 'KELAS 4 SD (60 MENIT)', headerBg: '#ea580c', defaultRoom: 'MARS' },
    { key: 'SD_5', title: 'KELAS 5 SD (60 MENIT)', headerBg: '#ea580c', defaultRoom: 'JUPITER' },
    { key: 'SD_6', title: 'KELAS 6 SD (90 MENIT)', headerBg: '#0284c7', defaultRoom: 'MERKURIUS' },
  ];

  const SMP_CONFIGS = [
    { key: 'SMP_7', title: 'KELAS 7 SMP (90 MENIT)', headerBg: '#2563eb', defaultRoom: 'MERKURIUS' },
    { key: 'SMP_8', title: 'KELAS 8 SMP (90 MENIT)', headerBg: '#2563eb', defaultRoom: 'VENUS' },
    { key: 'SMP_9', title: 'KELAS 9 SMP (90 MENIT)', headerBg: '#2563eb', defaultRoom: 'BUMI' },
  ];

  const SMA_EC_CONFIGS = [
    { key: 'SMA_ALL', title: 'KELAS 10, 11, 12 SMA (90 MENIT)', headerBg: '#7c3aed', defaultRoom: 'BUMI' },
    { key: 'ENGLISH_COURSE', title: 'ENGLISH COURSE (KIDS & TEENS)', headerBg: '#0891b2', defaultRoom: 'VENUS' },
  ];

  // ============================================================
  // GENERATE CETAK / PRINT MODE PERSIS SEPERTI EXCEL (GAMBAR 2)
  // ============================================================
  const handlePrintExcelLayout = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      if (onShowAlert) onShowAlert("⚠️ Izinkan pop-up browser untuk mencetak jadwal!");
      return;
    }

    const generateTableHtml = (conf) => {
      const classItems = filteredSchedules.filter(s => detectClassCategory(s) === conf.key);

      let rowsHtml = '';
      DAYS_ORDER.forEach(dayName => {
        const targetDateStr = weekDates.find(dStr => {
          const d = new Date(dStr);
          return DAYS_ID[d.getDay()] === dayName;
        });

        const dayItems = classItems.filter(s => s.dateStr === targetDateStr);

        if (dayItems.length === 0) {
          rowsHtml += `
            <tr>
              <td class="td-day">${dayName}</td>
              <td class="td-empty" colspan="3">— Kosong —</td>
            </tr>
          `;
        } else {
          dayItems.forEach((s, idx) => {
            const photo = getTeacherPhoto(s);
            const photoHtml = photo 
              ? `<img src="${photo}" class="teacher-avatar" alt="${s.teacherName || ''}" />`
              : `<div class="teacher-fallback">${(s.teacherName || 'G').charAt(0)}</div>`;

            rowsHtml += `
              <tr>
                ${idx === 0 ? `<td class="td-day" rowspan="${dayItems.length}">${dayName}</td>` : ''}
                <td class="td-time">⏰ ${s.start} - ${s.end}</td>
                <td class="td-mapel">
                  <div class="teacher-box">
                    ${photoHtml}
                    <div>
                      <div class="mapel-title">${s.title || s.mapelName || '-'}</div>
                      <div class="teacher-name">Tentor: <b>${s.teacherName || s.booker || '-'}</b> (${s.students?.length || 0} Siswa)</div>
                    </div>
                  </div>
                </td>
                <td class="td-room">🪐 ${s.planet}</td>
              </tr>
            `;
          });
        }
      });

      return `
        <div class="class-card">
          <div class="class-header" style="background: ${conf.headerBg};">
            ${conf.title}
          </div>
          <table class="schedule-table">
            <thead>
              <tr>
                <th style="width: 65px;">Hari</th>
                <th style="width: 90px;">Jam</th>
                <th>Mapel & Tentor</th>
                <th style="width: 80px;">Ruang</th>
              </tr>
            </thead>
            <tbody>
              ${rowsHtml}
            </tbody>
          </table>
        </div>
      `;
    };

    const fullHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Jadwal Pelajaran Reguler - Bimbel Gemilang</title>
        <style>
          @page { size: landscape; margin: 8mm; }
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            color: #0f172a;
            margin: 0;
            padding: 10px;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .main-header {
            text-align: center;
            margin-bottom: 12px;
            padding-bottom: 8px;
            border-bottom: 2px solid #0f172a;
          }
          .brand-title {
            font-size: 18px;
            font-weight: 900;
            letter-spacing: 0.5px;
            margin: 0;
            color: #0f172a;
          }
          .period-subtitle {
            font-size: 11px;
            color: #475569;
            margin-top: 3px;
          }
          .section-banner {
            background: #dc2626 !important;
            color: #ffffff !important;
            padding: 6px 12px;
            font-size: 12px;
            font-weight: 900;
            border-radius: 6px;
            margin: 14px 0 8px;
            letter-spacing: 0.5px;
          }
          .grid-row {
            display: flex;
            gap: 10px;
            margin-bottom: 12px;
          }
          .class-card {
            flex: 1;
            border: 1px solid #cbd5e1;
            border-radius: 8px;
            overflow: hidden;
            break-inside: avoid;
          }
          .class-header {
            color: #ffffff !important;
            padding: 6px 8px;
            font-size: 11px;
            font-weight: 900;
            text-align: center;
          }
          .schedule-table {
            width: 100%;
            border-collapse: collapse;
            font-size: 10px;
          }
          .schedule-table th {
            background: #f1f5f9 !important;
            padding: 4px 6px;
            font-size: 9px;
            font-weight: 800;
            text-align: left;
            border-bottom: 1px solid #cbd5e1;
          }
          .schedule-table td {
            padding: 4px 6px;
            border-bottom: 1px solid #f1f5f9;
            vertical-align: middle;
          }
          .td-day {
            font-weight: 800;
            background: #f8fafc !important;
            border-right: 1px solid #e2e8f0;
          }
          .td-time {
            font-weight: 700;
            white-space: nowrap;
            color: #2563eb;
          }
          .td-room {
            font-weight: 800;
            white-space: nowrap;
            color: #4338ca;
          }
          .td-empty {
            color: #94a3b8;
            font-style: italic;
          }
          .teacher-box {
            display: flex;
            align-items: center;
            gap: 6px;
          }
          .teacher-avatar {
            width: 22px;
            height: 22px;
            border-radius: 50%;
            object-fit: cover;
            border: 1.5px solid #818cf8;
            flex-shrink: 0;
          }
          .teacher-fallback {
            width: 22px;
            height: 22px;
            border-radius: 50%;
            background: #6366f1 !important;
            color: #ffffff !important;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 10px;
            font-weight: 800;
            flex-shrink: 0;
          }
          .mapel-title {
            font-weight: 800;
            font-size: 10.5px;
            color: #0f172a;
          }
          .teacher-name {
            font-size: 9px;
            color: #64748b;
          }
          .footer-note {
            margin-top: 14px;
            padding-top: 6px;
            border-top: 1px dashed #cbd5e1;
            font-size: 9px;
            color: #64748b;
            display: flex;
            justifyContent: space-between;
          }
        </style>
      </head>
      <body>
        <div class="main-header">
          <h1 class="brand-title">BIMBEL GEMILANG — JADWAL PELAJARAN REGULER</h1>
          <div class="period-subtitle">Periode: ${startDateFormatted} s/d ${endDateFormatted} · Arsip Operasional Resmi</div>
        </div>

        <!-- SECTION SD -->
        <div class="section-banner">🔴 JADWAL PELAJARAN SD (KELAS 3, 4, 5, 6)</div>
        <div class="grid-row">
          ${SD_CONFIGS.map(c => generateTableHtml(c)).join('')}
        </div>

        <!-- SECTION SMP -->
        <div class="section-banner">🔴 JADWAL PELAJARAN SMP (KELAS 7, 8, 9)</div>
        <div class="grid-row">
          ${SMP_CONFIGS.map(c => generateTableHtml(c)).join('')}
        </div>

        <!-- SECTION SMA & EC -->
        <div class="section-banner">🔴 JADWAL PELAJARAN SMA & ENGLISH COURSE</div>
        <div class="grid-row">
          ${SMA_EC_CONFIGS.map(c => generateTableHtml(c)).join('')}
        </div>

        <div class="footer-note">
          <span>Dicetak otomatis dari Sistem Bimbel Gemilang pada: ${new Date().toLocaleString('id-ID')}</span>
          <span>Bimbel Gemilang — Membimbing Dengan Hati, Meraih Prestasi Tertinggi ✨</span>
        </div>

        <script>
          window.onload = function() {
            setTimeout(function() {
              window.print();
            }, 600);
          };
        </script>
      </body>
      </html>
    `;

    printWindow.document.write(fullHtml);
    printWindow.document.close();
  };

  // Generate Teks WhatsApp
  const generateWhatsAppText = () => {
    let text = `📢 *JADWAL PELAJARAN REGULER BIMBEL GEMILANG*\n`;
    text += `📅 *Periode:* ${startDateFormatted} s/d ${endDateFormatted}\n`;
    text += `========================================\n\n`;

    // Grouping SD
    text += `🔴 *JADWAL SD (KELAS 3, 4, 5, 6)*\n`;
    SD_CONFIGS.forEach(conf => {
      const items = filteredSchedules.filter(s => detectClassCategory(s) === conf.key);
      text += `\n📘 *${conf.title}*\n`;
      if (items.length === 0) {
        text += `   — Belum ada sesi dijadwalkan —\n`;
      } else {
        items.forEach(s => {
          const d = new Date(s.dateStr);
          const hari = DAYS_ID[d.getDay()];
          text += `   • ${hari} (${s.start}-${s.end}) : *${s.title || s.mapelName}*\n`;
          text += `     Tentor: ${s.teacherName || s.booker} -> 🪐 Ruang ${s.planet}\n`;
        });
      }
    });

    // Grouping SMP
    text += `\n========================================\n`;
    text += `🔴 *JADWAL SMP (KELAS 7, 8, 9)*\n`;
    SMP_CONFIGS.forEach(conf => {
      const items = filteredSchedules.filter(s => detectClassCategory(s) === conf.key);
      text += `\n📘 *${conf.title}*\n`;
      if (items.length === 0) {
        text += `   — Belum ada sesi dijadwalkan —\n`;
      } else {
        items.forEach(s => {
          const d = new Date(s.dateStr);
          const hari = DAYS_ID[d.getDay()];
          text += `   • ${hari} (${s.start}-${s.end}) : *${s.title || s.mapelName}*\n`;
          text += `     Tentor: ${s.teacherName || s.booker} -> 🪐 Ruang ${s.planet}\n`;
        });
      }
    });

    text += `\n========================================\n`;
    text += `📌 *SOP & CATATAN TENTOR:*\n`;
    text += `1. Mohon hadir 10 menit sebelum jam kelas dimulai.\n`;
    text += `2. Isi absensi tentor & siswa di aplikasi setelah sesi berakhir.\n`;
    text += `3. Jika ada kendala ruangan atau proyektor, segera lapor Admin Operasional.\n`;
    text += `\n_Bimbel Gemilang — Semangat Mendidik Generasi Unggul_ ✨`;

    return text;
  };

  const handleCopyWhatsApp = () => {
    const text = generateWhatsAppText();
    navigator.clipboard.writeText(text).then(() => {
      setCopiedWA(true);
      setTimeout(() => setCopiedWA(false), 2500);
      if (onShowAlert) onShowAlert("✅ Teks jadwal WhatsApp berhasil disalin!");
    }).catch(err => {
      console.error(err);
      if (onShowAlert) onShowAlert("❌ Gagal menyalin teks");
    });
  };

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={e => e.stopPropagation()}>
        {/* Header Modal */}
        <div style={styles.header}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={styles.iconBadge}>📊</div>
            <div>
              <h3 style={styles.title}>Cetak & Bagikan Jadwal Resmi (Format Excel Gemilang)</h3>
              <p style={styles.subtitle}>Ekspor format per jenjang SD, SMP, SMA persis seperti susunan Excel resmi Bimbel Gemilang</p>
            </div>
          </div>
          <button onClick={onClose} style={styles.btnClose}><X size={18} /></button>
        </div>

        {/* Tab Switcher */}
        <div style={styles.tabBar}>
          <button
            type="button"
            onClick={() => setFormatTab('excel_print')}
            style={{
              ...styles.tabBtn,
              background: formatTab === 'excel_print' ? '#dc2626' : '#f1f5f9',
              color: formatTab === 'excel_print' ? '#ffffff' : '#475569',
              fontWeight: formatTab === 'excel_print' ? 800 : 600
            }}
          >
            <Printer size={15} /> 🖨️ Cetak / Simpan PDF (Format Persis Excel + Foto Tentor)
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
                {startDateFormatted} — {endDateFormatted} ({filteredSchedules.length} Sesi)
              </div>
            </div>

            <div style={styles.filterGroup}>
              <label style={styles.filterLabel}>🪐 Filter Ruangan:</label>
              <select
                value={selectedPlanet}
                onChange={e => setSelectedPlanet(e.target.value)}
                style={styles.filterSelect}
              >
                <option value="Semua">Semua Ruangan</option>
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

        {/* Tab: Print Excel */}
        {formatTab === 'excel_print' && (
          <div style={styles.contentBox}>
            <div style={styles.previewBox}>
              <div style={{ fontSize: 13, fontWeight: 800, color: '#0f172a', marginBottom: 4 }}>
                📄 Format Excel Resmi Gemilang (Lengkap Foto Tentor & Tabel Per Kelas)
              </div>
              <p style={{ fontSize: 11.5, color: '#475569', margin: 0, lineHeight: 1.5 }}>
                Format ini menyusun jadwal per kelas secara berdampingan: <b>Kelas 3 SD, Kelas 4 SD, Kelas 5 SD, Kelas 6 SD</b>, lalu <b>Kelas 7, 8, 9 SMP</b> persis seperti lembar kerja Excel Bimbel Gemilang. Setiap baris dilengkapi <b>Foto Profil Tentor Asli</b>, jam sesi, mata pelajaran, dan ruangan sehingga tentor dan admin langsung tahu siapa mengajar di mana tanpa takut bertabrakan.
              </p>
            </div>

            <div style={styles.summaryStats}>
              <div style={styles.statCard}>
                <span style={styles.statLabel}>Total Sesi</span>
                <span style={styles.statVal}>{filteredSchedules.length}</span>
              </div>
              <div style={styles.statCard}>
                <span style={styles.statLabel}>Ruangan Aktif</span>
                <span style={styles.statVal}>
                  {new Set(filteredSchedules.map(s => s.planet)).size} / 5
                </span>
              </div>
              <div style={styles.statCard}>
                <span style={styles.statLabel}>Tentor Mengajar</span>
                <span style={styles.statVal}>
                  {new Set(filteredSchedules.map(s => s.teacherId || s.teacherName)).size}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Tab: WA */}
        {formatTab === 'wa' && (
          <div style={styles.contentBox}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: '#334155' }}>
                Pratinjau Teks WhatsApp (Tersusun Per Jenjang & Hari):
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
          {formatTab === 'excel_print' ? (
            <button
              type="button"
              onClick={handlePrintExcelLayout}
              style={styles.btnPrintAction}
            >
              <Printer size={16} /> Buka Pratinjau & Cetak / Simpan PDF
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
    background: '#fee2e2',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 20
  },
  title: {
    margin: 0,
    fontSize: 16.5,
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
    background: '#fef2f2',
    border: '1px solid #fecaca'
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
    color: '#dc2626',
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
  btnPrintAction: {
    padding: '9px 20px',
    borderRadius: 10,
    background: '#dc2626',
    color: '#ffffff',
    border: 'none',
    fontSize: 12.5,
    fontWeight: 800,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    boxShadow: '0 4px 12px rgba(220, 38, 38, 0.3)'
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
