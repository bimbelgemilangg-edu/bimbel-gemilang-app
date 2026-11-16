// src/utils/kuotaEnglishCourse.js
// ============================================================
// KUOTA SESI PERTEMUAN ENGLISH COURSE (Aturan Bimbel Gemilang):
// English Course dihitung BERDASARKAN KUOTA PERTEMUAN (8x sesi per bulan),
// BUKAN habis berdasarkan tanggal kalender 30 hari.
//
// Aturan:
// 1. 1 Bulan paket = 8x pertemuan (sesi).
//    2 Bulan = 16x pertemuan, 3 Bulan = 24x pertemuan, dst.
// 2. Dicocokkan dengan absensi guru (teacher_logs.daftarSiswaHadir)
//    dan absensi siswa (attendance dengan status 'Hadir').
// 3. Status "HABIS" hanya terjadi jika siswa sudah mengikuti >= kuota sesi.
// 4. Jika waktu kalender sudah lewat tapi sesi belum mencapai kuota (misal baru
//    4/8 sesi karena libur/izin), paket TETAP AKTIF sampai 8 sesi selesai.
// ============================================================

export const SESI_PER_BULAN_ENGLISH = 8;

/**
 * Cek apakah string program merujuk ke English Course
 */
export function isProgramEnglish(namaOrType = '') {
  const s = String(namaOrType || '').toLowerCase();
  return s.includes('english') || s.includes('ec ') || s.startsWith('std-en');
}

/**
 * Ekstrak dan dedup seluruh sesi English Course yang dihadiri siswa
 * dari dua sumber data resmi:
 * 1. Koleksi attendance (status == 'Hadir' dan mapel/isEnglishCourse cocok)
 * 2. Koleksi teacher_logs (program == 'English' dan siswa ada di daftarSiswaHadir)
 */
export function ekstrakSesiEnglishSiswa({
  studentId = '',
  docId = '',
  studentNama = '',
  tanggalMulai = '',
  attendanceList = [],
  teacherLogs = []
} = {}) {
  const sId = String(studentId || '').trim();
  const dId = String(docId || '').trim();
  const sNama = String(studentNama || '').toLowerCase().trim();
  const tglMulai = String(tanggalMulai || '').slice(0, 10);

  // Map unik per tanggal (1 hari = 1 sesi)
  const sesiMap = new Map();

  // 1. Dari koleksi attendance
  if (Array.isArray(attendanceList)) {
    for (const att of attendanceList) {
      if (!att) continue;
      const tgl = String(att.date || att.tanggal || '').slice(0, 10);
      if (!tgl) continue;
      if (tglMulai && tgl < tglMulai) continue; // sesi sebelum tanggal paket dimulai diabaikan

      // Cek apakah ini sesi English Course
      const isEng = Boolean(att.isEnglishCourse) || isProgramEnglish(att.mapel || att.subject || att.program);
      if (!isEng) continue;

      // Cek apakah siswa ini yang hadir
      const attSid = String(att.studentId || '').trim();
      const attNama = String(att.studentName || att.namaSiswa || '').toLowerCase().trim();

      const isMatchStudent =
        (sId && attSid === sId) ||
        (dId && attSid === dId) ||
        (sNama && (attNama === sNama || attNama.includes(sNama) || sNama.includes(attNama)));

      if (!isMatchStudent) continue;

      // Status kehadiran: Hadir dihitung sebagai sesi yang dipakai
      const status = String(att.status || 'Hadir').trim();
      if (status !== 'Hadir') continue;

      sesiMap.set(tgl, {
        tanggal: tgl,
        guru: att.teacherName || att.namaGuru || 'Tentor English',
        materi: att.materiHariIni || att.materi || att.englishTopic || att.mapel || 'English Course Session',
        status: 'Hadir',
        sumber: 'Absensi Siswa'
      });
    }
  }

  // 2. Dari koleksi teacher_logs (jurnal mengajar guru)
  if (Array.isArray(teacherLogs)) {
    for (const tlog of teacherLogs) {
      if (!tlog) continue;
      const tgl = String(tlog.tanggal || tlog.date || '').slice(0, 10);
      if (!tgl) continue;
      if (tglMulai && tgl < tglMulai) continue;

      const isEng = Boolean(tlog.isEnglishCourse) || isProgramEnglish(tlog.program || tlog.tipeKelas || tlog.kelasNama);
      if (!isEng) continue;

      const hadirList = Array.isArray(tlog.daftarSiswaHadir) ? tlog.daftarSiswaHadir : [];
      const studentInLog = hadirList.find((s) => {
        if (!s) return false;
        const sid = String(s.id || '').trim();
        const snama = String(s.nama || '').toLowerCase().trim();
        return (sId && sid === sId) ||
               (dId && sid === dId) ||
               (sNama && (snama === sNama || snama.includes(sNama) || sNama.includes(snama)));
      });

      if (studentInLog) {
        // Jika sudah ada dari attendance, lengkapi data gurunya
        const existing = sesiMap.get(tgl);
        if (existing) {
          existing.guru = existing.guru || tlog.namaGuru || 'Tentor English';
          if (tlog.materiHariIni && (!existing.materi || existing.materi.includes('English Course Session'))) {
            existing.materi = tlog.materiHariIni;
          }
        } else {
          sesiMap.set(tgl, {
            tanggal: tgl,
            guru: tlog.namaGuru || 'Tentor English',
            materi: tlog.materiHariIni || tlog.detail || 'English Course Session',
            status: 'Hadir',
            sumber: 'Jurnal Guru'
          });
        }
      }
    }
  }

  // Urutkan berdasarkan tanggal ascending
  return Array.from(sesiMap.values()).sort((a, b) => a.tanggal.localeCompare(b.tanggal));
}

/**
 * Hitung kuota, sesi terpakai, sisa sesi, dan status masa aktif English Course
 */
export function hitungKuotaEnglishCourse({
  durasiBulan = 1,
  tanggalMulai = '',
  attendanceList = [],
  teacherLogs = [],
  student = {},
  totalSesiCustom = null
} = {}) {
  const durasi = Math.max(1, parseInt(durasiBulan || 1, 10) || 1);
  const totalKuota = totalSesiCustom ? Math.max(1, parseInt(totalSesiCustom, 10)) : (durasi * SESI_PER_BULAN_ENGLISH);

  const studentId = student.studentId || '';
  const docId = student.id || student.docId || '';
  const studentNama = student.nama || student.namaSiswa || '';

  const daftarSesi = ekstrakSesiEnglishSiswa({
    studentId,
    docId,
    studentNama,
    tanggalMulai,
    attendanceList,
    teacherLogs
  });

  const sesiTerpakai = daftarSesi.length;
  const sisaSesi = Math.max(0, totalKuota - sesiTerpakai);
  const isHabis = sesiTerpakai >= totalKuota;
  const isHampirHabis = !isHabis && sisaSesi <= 2;
  const persentase = Math.min(100, Math.round((sesiTerpakai / totalKuota) * 100));

  let labelStatus = `Aktif (${sesiTerpakai}/${totalKuota} Sesi)`;
  let badgeWarna = { bg: '#ecfdf5', color: '#047857', border: '#a7f3d0' };

  if (isHabis) {
    labelStatus = `🔴 HABIS (${sesiTerpakai}/${totalKuota} Sesi Selesai)`;
    badgeWarna = { bg: '#fee2e2', color: '#b91c1c', border: '#fca5a5' };
  } else if (isHampirHabis) {
    labelStatus = `🟡 Sisa ${sisaSesi}x Pertemuan`;
    badgeWarna = { bg: '#fef3c7', color: '#b45309', border: '#fcd34d' };
  } else {
    labelStatus = `🟢 Aktif (Sisa ${sisaSesi}x)`;
  }

  return {
    durasiBulan: durasi,
    totalKuota,
    sesiTerpakai,
    sisaSesi,
    isHabis,
    isHampirHabis,
    persentase,
    labelStatus,
    badgeWarna,
    daftarSesi
  };
}

export default {
  SESI_PER_BULAN_ENGLISH,
  isProgramEnglish,
  ekstrakSesiEnglishSiswa,
  hitungKuotaEnglishCourse
};
