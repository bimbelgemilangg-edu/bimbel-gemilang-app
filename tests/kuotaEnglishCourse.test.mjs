// tests/kuotaEnglishCourse.test.mjs
// Uji aturan kuota pertemuan English Course (8x sesi per bulan, bukan habis kalender)
import assert from 'node:assert/strict';
import {
  SESI_PER_BULAN_ENGLISH,
  isProgramEnglish,
  ekstrakSesiEnglishSiswa,
  hitungKuotaEnglishCourse
} from '../src/utils/kuotaEnglishCourse.js';

let lulus = 0, gagal = 0;
function uji(n, f) {
  try {
    f();
    lulus++;
    console.log(`  ✓ ${n}`);
  } catch (e) {
    gagal++;
    console.log(`  ✗ ${n}\n      ${e.message}`);
  }
}

uji('SESI_PER_BULAN_ENGLISH adalah 8 sesi per bulan', () => {
  assert.equal(SESI_PER_BULAN_ENGLISH, 8);
});

uji('isProgramEnglish mendeteksi nama dan kode program', () => {
  assert.equal(isProgramEnglish('English Course'), true);
  assert.equal(isProgramEnglish('English Course (Kids)'), true);
  assert.equal(isProgramEnglish('STD-EN26070001'), true);
  assert.equal(isProgramEnglish('EC LEVEL 3'), true);
  assert.equal(isProgramEnglish('Bimbel Reguler SMP'), false);
  assert.equal(isProgramEnglish('Matematika Khusus'), false);
});

uji('hitungKuotaEnglishCourse: 1 bulan = 8 kuota, 0 sesi terpakai', () => {
  const res = hitungKuotaEnglishCourse({
    durasiBulan: 1,
    student: { studentId: 'STD-EN1', nama: 'Budi' },
    attendanceList: [],
    teacherLogs: []
  });
  assert.equal(res.totalKuota, 8);
  assert.equal(res.sesiTerpakai, 0);
  assert.equal(res.sisaSesi, 8);
  assert.equal(res.isHabis, false);
  assert.equal(res.isHampirHabis, false);
});

uji('hitungKuotaEnglishCourse: dedup sesi pada hari yang sama dari attendance dan teacher_logs', () => {
  const attendanceList = [
    { date: '2026-10-14', studentId: 'STD-EN1', isEnglishCourse: true, status: 'Hadir', teacherName: 'Miss Sarah', materiHariIni: 'Conversation' },
    { date: '2026-10-18', studentId: 'STD-EN1', mapel: 'ENGLISH COURSE', status: 'Hadir', teacherName: 'Miss Sarah' },
    { date: '2026-10-21', studentId: 'STD-EN1', mapel: 'ENGLISH COURSE', status: 'Alpha' },
  ];
  const teacherLogs = [
    { tanggal: '2026-10-14', program: 'English', namaGuru: 'Miss Sarah', daftarSiswaHadir: [{ id: 'doc1', nama: 'Budi' }] },
    { tanggal: '2026-10-25', isEnglishCourse: true, namaGuru: 'Miss Sarah', materiHariIni: 'Phonics', daftarSiswaHadir: [{ id: 'doc1', nama: 'Budi' }] },
  ];

  const res = hitungKuotaEnglishCourse({
    durasiBulan: 1,
    student: { studentId: 'STD-EN1', docId: 'doc1', nama: 'Budi' },
    attendanceList,
    teacherLogs
  });

  assert.equal(res.sesiTerpakai, 3);
  assert.equal(res.totalKuota, 8);
  assert.equal(res.sisaSesi, 5);
  assert.equal(res.isHabis, false);
  assert.equal(res.isHampirHabis, false);
  assert.equal(res.daftarSesi.length, 3);
});

uji('hitungKuotaEnglishCourse: status hampir habis (sisa <= 2)', () => {
  const attendanceList = [
    { date: '2026-10-01', studentId: 'STD-EN1', isEnglishCourse: true, status: 'Hadir' },
    { date: '2026-10-04', studentId: 'STD-EN1', isEnglishCourse: true, status: 'Hadir' },
    { date: '2026-10-08', studentId: 'STD-EN1', isEnglishCourse: true, status: 'Hadir' },
    { date: '2026-10-11', studentId: 'STD-EN1', isEnglishCourse: true, status: 'Hadir' },
    { date: '2026-10-15', studentId: 'STD-EN1', isEnglishCourse: true, status: 'Hadir' },
    { date: '2026-10-18', studentId: 'STD-EN1', isEnglishCourse: true, status: 'Hadir' },
    { date: '2026-10-22', studentId: 'STD-EN1', isEnglishCourse: true, status: 'Hadir' },
  ];
  const res = hitungKuotaEnglishCourse({
    durasiBulan: 1,
    student: { studentId: 'STD-EN1', nama: 'Budi' },
    attendanceList,
    teacherLogs: []
  });
  assert.equal(res.sesiTerpakai, 7);
  assert.equal(res.sisaSesi, 1);
  assert.equal(res.isHabis, false);
  assert.equal(res.isHampirHabis, true);
  assert.match(res.labelStatus, /Sisa 1x Pertemuan/);
});

uji('hitungKuotaEnglishCourse: status HABIS saat 8/8 sesi tercapai', () => {
  const attendanceList = [];
  for (let i = 1; i <= 8; i++) {
    attendanceList.push({
      date: `2026-10-${i < 10 ? '0' + i : i}`,
      studentId: 'STD-EN1',
      isEnglishCourse: true,
      status: 'Hadir'
    });
  }
  const res = hitungKuotaEnglishCourse({
    durasiBulan: 1,
    student: { studentId: 'STD-EN1', nama: 'Budi' },
    attendanceList,
    teacherLogs: []
  });
  assert.equal(res.sesiTerpakai, 8);
  assert.equal(res.sisaSesi, 0);
  assert.equal(res.isHabis, true);
  assert.match(res.labelStatus, /HABIS/);
  assert.equal(res.badgeWarna.color, '#b91c1c');
});

uji('hitungKuotaEnglishCourse: 2 bulan = 16 sesi kuota', () => {
  const res = hitungKuotaEnglishCourse({
    durasiBulan: 2,
    student: { studentId: 'STD-EN2', nama: 'Siti' },
    attendanceList: [],
    teacherLogs: []
  });
  assert.equal(res.totalKuota, 16);
  assert.equal(res.sisaSesi, 16);
  assert.equal(res.isHabis, false);
});

console.log(`\nkuotaEnglishCourse: ${lulus} lulus, ${gagal} gagal`);
process.exit(gagal ? 1 : 0);
