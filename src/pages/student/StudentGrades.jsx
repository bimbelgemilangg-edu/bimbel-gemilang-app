// src/pages/student/StudentGrades.jsx
// Halaman raport siswa - sekarang merender StudentSmartReport
// Supaya siswa & ortu tidak bingung dengan 2 halaman berbeda

import React from 'react';
import StudentSmartReport from './raport/StudentSmartReport';

const StudentGrades = () => {
  return <StudentSmartReport />;
};

export default StudentGrades;