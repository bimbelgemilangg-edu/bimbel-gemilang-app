// src/pages/admin/schedule/jadwalConflictUtils.js
// ============================================================
// MESIN DETEKSI BENTROK JADWAL & ANALISIS WAKTU ISTIRAHAT GURU
// ============================================================

/**
 * Konversi format waktu "HH:MM" menjadi total menit dari 00:00
 */
export const timeToMinutes = (timeStr) => {
  if (!timeStr || typeof timeStr !== 'string') return 0;
  const parts = timeStr.trim().split(':');
  const h = parseInt(parts[0], 10) || 0;
  const m = parseInt(parts[1], 10) || 0;
  return h * 60 + m;
};

/**
 * Konversi total menit menjadi format string "HH:MM"
 */
export const minutesToTime = (mins) => {
  if (mins < 0) mins = 0;
  const h = Math.floor(mins / 60) % 24;
  const m = mins % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
};

/**
 * Cek apakah 2 rentang waktu tumpang tindih (overlap)
 */
export const timesOverlap = (startA, endA, startB, endB) => {
  if (!startA || !endA || !startB || !endB) return false;
  return startA < endB && startB < endA;
};

/**
 * Analisis lengkap ketersediaan guru, ruangan, dan jeda waktu istirahat
 * 
 * @param {Object} params
 * @param {string} params.targetDateStr - Format YYYY-MM-DD
 * @param {string} params.start - "HH:MM"
 * @param {string} params.end - "HH:MM"
 * @param {string} params.planet - "MERKURIUS" | "VENUS" | "BUMI" | "MARS" | "JUPITER"
 * @param {string} params.teacherId - ID guru (guruId / docId)
 * @param {string} params.teacherName - Nama guru
 * @param {Array<string>} params.selectedStudentIds - Array of student ID
 * @param {Array<Object>} params.schedules - Seluruh jadwal aktif
 * @param {string} [params.excludeId] - ID jadwal yang sedang diedit (agar tidak bentrok dengan diri sendiri)
 * 
 * @returns {Object} Hasil analisis lengkap
 */
export const analyzeScheduleDetails = ({
  targetDateStr,
  start,
  end,
  planet,
  teacherId,
  teacherName = '',
  selectedStudentIds = [],
  schedules = [],
  excludeId = null
}) => {
  const result = {
    hasConflict: false,
    conflicts: [], // Error bentrok fatal (merah)
    warnings: [],  // Peringatan non-fatal (kuning / oranye)
    restInfo: null, // Info waktu istirahat guru
    roomOccupied: false,
    roomOccupant: null
  };

  if (!targetDateStr || !start || !end) return result;

  const startMin = timeToMinutes(start);
  const endMin = timeToMinutes(end);

  // Filter jadwal di tanggal yang sama (abaikan jadwal yang sedang diedit)
  const daySchedules = schedules.filter(s => 
    s.dateStr === targetDateStr && 
    s.id !== excludeId &&
    s.status !== 'cancelled'
  );

  // 1. CEK RUANGAN
  if (planet) {
    const roomOverlap = daySchedules.find(s => 
      s.planet === planet && 
      timesOverlap(start, end, s.start, s.end)
    );
    if (roomOverlap) {
      result.roomOccupied = true;
      result.roomOccupant = roomOverlap;
      result.hasConflict = true;
      result.conflicts.push({
        type: 'room',
        message: `Ruangan ${planet} sudah terpakai jam ${roomOverlap.start} - ${roomOverlap.end} (${roomOverlap.mapelName || roomOverlap.title || 'Sesi lain'}, Tentor: ${roomOverlap.teacherName || '-'})`
      });
    }
  }

  // 2. CEK GURU: BENTROK JAM & ANALISIS WAKTU ISTIRAHAT
  if (teacherId || teacherName) {
    const teacherSchedules = daySchedules.filter(s => {
      if (teacherId && s.teacherId && s.teacherId === teacherId) return true;
      if (teacherName && s.teacherName && s.teacherName.toLowerCase() === teacherName.toLowerCase()) return true;
      return false;
    });

    // 2a. Bentrok langsung di jam yang sama
    const teacherOverlap = teacherSchedules.find(s => timesOverlap(start, end, s.start, s.end));
    if (teacherOverlap) {
      result.hasConflict = true;
      result.conflicts.push({
        type: 'teacher',
        message: `Guru ${teacherOverlap.teacherName || 'ini'} sudah terjadwal di Ruang ${teacherOverlap.planet} pada jam ${teacherOverlap.start} - ${teacherOverlap.end} (${teacherOverlap.mapelName || teacherOverlap.title || 'Sesi lain'})`
      });
    }

    // 2b. Analisis Jeda Istirahat (Sesi Sebelum & Sesi Sesudah)
    // Cari sesi tepat sebelum jam mulai ini
    let sessionBefore = null;
    let maxBeforeEnd = -1;

    // Cari sesi tepat sesudah jam selesai ini
    let sessionAfter = null;
    let minAfterStart = 9999;

    teacherSchedules.forEach(s => {
      const sStartMin = timeToMinutes(s.start);
      const sEndMin = timeToMinutes(s.end);

      // Sesi sebelum
      if (sEndMin <= startMin) {
        if (sEndMin > maxBeforeEnd) {
          maxBeforeEnd = sEndMin;
          sessionBefore = s;
        }
      }

      // Sesi sesudah
      if (sStartMin >= endMin) {
        if (sStartMin < minAfterStart) {
          minAfterStart = sStartMin;
          sessionAfter = s;
        }
      }
    });

    const gapBefore = sessionBefore ? startMin - timeToMinutes(sessionBefore.end) : null;
    const gapAfter = sessionAfter ? timeToMinutes(sessionAfter.start) - endMin : null;

    let restStatus = 'free'; // 'free' | 'comfortable' | 'short' | 'zero'
    let restNotes = [];

    if (gapBefore !== null) {
      if (gapBefore === 0) {
        restStatus = 'zero';
        result.warnings.push({
          type: 'rest_zero',
          message: `Jeda 0 menit! Guru baru selesai mengajar di Ruang ${sessionBefore.planet} jam ${sessionBefore.end} tanpa jeda istirahat.`
        });
        restNotes.push(`Selesai di ${sessionBefore.planet} jam ${sessionBefore.end} (Jeda 0 mnt)`);
      } else if (gapBefore < 15) {
        if (restStatus !== 'zero') restStatus = 'short';
        result.warnings.push({
          type: 'rest_short',
          message: `Waktu istirahat sebelum kelas sangat singkat (${gapBefore} menit) setelah mengajar di Ruang ${sessionBefore.planet} (selesai ${sessionBefore.end}).`
        });
        restNotes.push(`Istirahat ${gapBefore} mnt (dari ${sessionBefore.planet})`);
      } else {
        if (restStatus === 'free') restStatus = 'comfortable';
        restNotes.push(`Istirahat ${gapBefore} mnt sebelum kelas`);
      }
    }

    if (gapAfter !== null) {
      if (gapAfter === 0) {
        if (restStatus !== 'zero') restStatus = 'zero';
        result.warnings.push({
          type: 'rest_zero',
          message: `Jeda 0 menit! Guru langsung lanjut mengajar di Ruang ${sessionAfter.planet} jam ${sessionAfter.start} tanpa jeda istirahat.`
        });
        restNotes.push(`Lanjut ke ${sessionAfter.planet} jam ${sessionAfter.start} (Jeda 0 mnt)`);
      } else if (gapAfter < 15) {
        if (restStatus !== 'zero') restStatus = 'short';
        result.warnings.push({
          type: 'rest_short',
          message: `Waktu istirahat setelah kelas sangat singkat (${gapAfter} menit) sebelum kelas di Ruang ${sessionAfter.planet} (mulai ${sessionAfter.start}).`
        });
        restNotes.push(`Istirahat ${gapAfter} mnt sebelum ke ${sessionAfter.planet}`);
      } else {
        if (restStatus === 'free') restStatus = 'comfortable';
        restNotes.push(`Istirahat ${gapAfter} mnt setelah kelas`);
      }
    }

    result.restInfo = {
      status: restStatus,
      gapBefore,
      sessionBefore,
      gapAfter,
      sessionAfter,
      notes: restNotes.join(' · ') || 'Tentor bebas mengajar'
    };
  }

  // 3. CEK SISWA
  if (selectedStudentIds && selectedStudentIds.length > 0) {
    const studentConflicts = [];
    daySchedules.forEach(s => {
      if (!timesOverlap(start, end, s.start, s.end)) return;
      const sStudentIds = s.studentIds || (s.students || []).map(st => st.id);
      const overlapIds = sStudentIds.filter(id => selectedStudentIds.includes(id));
      if (overlapIds.length > 0) {
        const matchedNames = (s.students || [])
          .filter(st => overlapIds.includes(st.id))
          .map(st => st.nama);
        studentConflicts.push({
          planet: s.planet,
          start: s.start,
          end: s.end,
          mapel: s.mapelName || s.title || 'Sesi lain',
          names: matchedNames
        });
      }
    });

    if (studentConflicts.length > 0) {
      result.hasConflict = true;
      studentConflicts.forEach(sc => {
        result.conflicts.push({
          type: 'student',
          message: `${sc.names.join(', ')} sudah memiliki jadwal jam ${sc.start} - ${sc.end} di Ruang ${sc.planet} (${sc.mapel})`
        });
      });
    }
  }

  return result;
};
