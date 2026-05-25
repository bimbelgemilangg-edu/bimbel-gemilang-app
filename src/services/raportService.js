// src/services/raportService.js
import { db } from '../firebase';
import { 
  collection, query, where, getDocs, addDoc, updateDoc, 
  doc, serverTimestamp, Timestamp, orderBy 
} from 'firebase/firestore';
import { RAPORT_COLLECTIONS } from '../firebase/raportCollection';

// ============================================================
// KONFIGURASI 5 DIMENSI PENILAIAN
// ============================================================

export const DIMENSI_CONFIG = {
  pemahaman: {
    label: "Pemahaman Konsep",
    deskripsi: "Mengukur sejauh mana siswa memahami teori, rumus, atau fakta kunci dalam suatu materi pelajaran, bukan sekadar menghafal.",
    indikator: "Siswa mampu menjelaskan ulang materi dengan bahasanya sendiri dan memberikan contoh konkret."
  },
  analisis: {
    label: "Analisis & Pemecahan Masalah",
    deskripsi: "Mengukur kemampuan siswa memecah soal yang kompleks (soal cerita, studi kasus, atau soal HOTS) menjadi bagian-bagian kecil untuk diselesaikan.",
    indikator: "Siswa mampu mengidentifikasi apa yang diketahui, ditanyakan, dan memilih strategi/rumus yang tepat."
  },
  ketelitian: {
    label: "Ketelitian & Prosedur Pengerjaan",
    deskripsi: "Mengukur kedisiplinan siswa dalam mengikuti langkah-langkah pengerjaan soal secara runtut dan meminimalkan kesalahan sepele (careless mistakes).",
    indikator: "Siswa menuliskan proses pengerjaan dengan rapi, menghitung dengan benar, atau menulis tata bahasa/ejaan secara tepat."
  },
  waktu: {
    label: "Kecepatan & Manajemen Waktu",
    deskripsi: "Mengukur efisiensi siswa dalam menyelesaikan tugas atau soal ujian di bawah tekanan durasi waktu tertentu.",
    indikator: "Siswa mampu menyelesaikan seluruh soal sesuai batas waktu tanpa mengorbankan kualitas jawaban."
  },
  dayaTangkap: {
    label: "Daya Tangkap & Kemandirian Belajar",
    deskripsi: "Mengukur seberapa cepat siswa memahami materi baru setelah dijelaskan oleh tentor, serta inisiatifnya dalam mencoba soal latihan secara mandiri.",
    indikator: "Siswa aktif bertanya pada bagian yang sulit dan mampu mengerjakan soal sejenis berikutnya tanpa panduan penuh."
  }
};

export const DIMENSI_KEYS = ['pemahaman', 'analisis', 'ketelitian', 'waktu', 'dayaTangkap'];

// ============================================================
// BOBOT KOMPONEN (DEFAULT)
// ============================================================

export const KOMPONEN_BOBOT = {
  kuis: 0.30,    // 30%
  tugas: 0.30,   // 30%
  ujian: 0.40    // 40%
};

// ============================================================
// FUNGSI UTAMA: HITUNG NILAI AKHIR
// ============================================================

/**
 * Hitung rata-rata 5 dimensi dari satu komponen
 * @param {Array} dimensiScores - [{ pemahaman, analisis, ketelitian, waktu, dayaTangkap }]
 * @returns {Object} - rata-rata per dimensi dan total
 */
export const calculateDimensiAverage = (dimensiScores) => {
  if (!dimensiScores || dimensiScores.length === 0) {
    return {
      pemahaman: 0, analisis: 0, ketelitian: 0, waktu: 0, dayaTangkap: 0,
      total: 0
    };
  }
  
  const count = dimensiScores.length;
  const totals = {
    pemahaman: 0, analisis: 0, ketelitian: 0, waktu: 0, dayaTangkap: 0
  };
  
  dimensiScores.forEach(d => {
    DIMENSI_KEYS.forEach(key => {
      totals[key] += (d[key] || 0);
    });
  });
  
  const averages = {};
  DIMENSI_KEYS.forEach(key => {
    averages[key] = Math.round((totals[key] / count) * 10) / 10;
  });
  
  const total = Math.round(
    DIMENSI_KEYS.reduce((sum, key) => sum + averages[key], 0) / 5 * 10
  ) / 10;
  
  return { ...averages, total };
};

/**
 * Hitung nilai akhir berdasarkan aturan:
 * 1. Ada Ujian → pakai nilai ujian
 * 2. Belum ujian tapi ada Quiz+Tugas → (Quiz+Tugas)/2
 * 3. Lengkap (Quiz+Tugas+Ujian) → Quiz 30% + Tugas 30% + Ujian 40%
 * @param {Object} scores - { kuis: [], tugas: [], ujian: [] }
 * @returns {Object}
 */
export const calculateFinalScore = (scores) => {
  const kuisAvg = calculateDimensiAverage(scores.kuis);
  const tugasAvg = calculateDimensiAverage(scores.tugas);
  const ujianAvg = calculateDimensiAverage(scores.ujian);
  
  const hasKuis = scores.kuis?.length > 0;
  const hasTugas = scores.tugas?.length > 0;
  const hasUjian = scores.ujian?.length > 0;
  
  let nilaiAkhir = 0;
  let mode = '';
  let detailDimensi = {};
  let komponenDipake = [];
  
  if (hasUjian) {
    // PRIORITAS: Ada ujian → pakai nilai ujian
    nilaiAkhir = ujianAvg.total;
    detailDimensi = { ...ujianAvg };
    mode = 'Ujian';
    komponenDipake = ['ujian'];
  } else if (hasKuis && hasTugas) {
    // Ada kuis + tugas → rata-rata
    nilaiAkhir = Math.round(((kuisAvg.total + tugasAvg.total) / 2) * 10) / 10;
    DIMENSI_KEYS.forEach(key => {
      detailDimensi[key] = Math.round(((kuisAvg[key] + tugasAvg[key]) / 2) * 10) / 10;
    });
    mode = 'Quiz + Tugas';
    komponenDipake = ['kuis', 'tugas'];
  } else if (hasKuis) {
    // Hanya kuis
    nilaiAkhir = kuisAvg.total;
    detailDimensi = { ...kuisAvg };
    mode = 'Quiz';
    komponenDipake = ['kuis'];
  } else if (hasTugas) {
    // Hanya tugas
    nilaiAkhir = tugasAvg.total;
    detailDimensi = { ...tugasAvg };
    mode = 'Tugas';
    komponenDipake = ['tugas'];
  } else {
    mode = 'Belum Ada Nilai';
    DIMENSI_KEYS.forEach(key => { detailDimensi[key] = 0; });
  }
  
  // Jika lengkap (ketiganya ada), pakai bobot
  if (hasKuis && hasTugas && hasUjian) {
    nilaiAkhir = Math.round(
      (kuisAvg.total * KOMPONEN_BOBOT.kuis) +
      (tugasAvg.total * KOMPONEN_BOBOT.tugas) +
      (ujianAvg.total * KOMPONEN_BOBOT.ujian)
    );
    DIMENSI_KEYS.forEach(key => {
      detailDimensi[key] = Math.round(
        (kuisAvg[key] * KOMPONEN_BOBOT.kuis +
         tugasAvg[key] * KOMPONEN_BOBOT.tugas +
         ujianAvg[key] * KOMPONEN_BOBOT.ujian) * 10
      ) / 10;
    });
    mode = 'Lengkap (Quiz+Tugas+Ujian)';
    komponenDipake = ['kuis', 'tugas', 'ujian'];
  }
  
  return {
    nilaiAkhir,
    mode,
    komponenDipake,
    detailDimensi,
    detailKomponen: {
      kuis: kuisAvg,
      tugas: tugasAvg,
      ujian: ujianAvg
    }
  };
};

// ============================================================
// NARASI OTOMATIS
// ============================================================

/**
 * Generate narasi utama dari rata-rata 5 dimensi
 */
export const generateNarasi = (namaSiswa, mapel, nilaiAkhir, detailDimensi) => {
  const avgDimensi = detailDimensi 
    ? DIMENSI_KEYS.reduce((sum, key) => sum + (detailDimensi[key] || 0), 0) / 5
    : nilaiAkhir;
  
  if (avgDimensi >= 85) {
    return `🌟 ${namaSiswa} menunjukkan penguasaan luar biasa pada mata pelajaran ${mapel}. Semua aspek penilaian (pemahaman konsep, analisis, ketelitian, manajemen waktu, dan daya tangkap) berada di level sangat baik. Pertahankan prestasi ini dan terus kembangkan potensimu!`;
  } else if (avgDimensi >= 70) {
    return `👍 ${namaSiswa} memiliki pemahaman yang baik pada ${mapel}. Beberapa aspek sudah dikuasai dengan baik, namun masih ada ruang untuk meningkatkan ketelitian dan kecepatan. Terus berlatih dan jangan ragu bertanya!`;
  } else if (avgDimensi >= 50) {
    return `📘 ${namaSiswa} cukup memahami materi ${mapel}, namun perlu meningkatkan beberapa aspek seperti analisis soal dan manajemen waktu. Disarankan untuk lebih aktif bertanya dan berlatih soal-soal variatif.`;
  } else if (avgDimensi >= 30) {
    return `⚠️ ${namaSiswa} memerlukan perhatian lebih pada ${mapel}. Beberapa konsep dasar masih perlu diperkuat. Sangat disarankan untuk mengikuti bimbingan tambahan dan berkonsultasi dengan tentor secara rutin.`;
  } else {
    return `🔴 ${namaSiswa} sangat memerlukan bimbingan intensif pada ${mapel}. Diperlukan evaluasi menyeluruh dan program remedial untuk membantu menguasai materi dasar sebelum melanjutkan ke materi berikutnya.`;
  }
};

/**
 * Generate narasi per dimensi
 */
export const generateDimensiNarasi = (detailDimensi) => {
  if (!detailDimensi) return [];
  
  const result = [];
  
  DIMENSI_KEYS.forEach(key => {
    const nilai = detailDimensi[key] || 0;
    const config = DIMENSI_CONFIG[key];
    
    let narasiSingkat = '';
    let saran = '';
    
    if (nilai >= 85) {
      narasiSingkat = `${config.label}: Sangat Baik. Siswa menunjukkan penguasaan optimal pada aspek ini.`;
      saran = 'Pertahankan dan tingkatkan ke level selanjutnya.';
    } else if (nilai >= 70) {
      narasiSingkat = `${config.label}: Baik. Siswa sudah menguasai aspek ini dengan cukup baik.`;
      saran = 'Tingkatkan dengan latihan soal yang lebih bervariasi.';
    } else if (nilai >= 50) {
      narasiSingkat = `${config.label}: Cukup. Siswa perlu meningkatkan aspek ini lebih lanjut.`;
      saran = 'Fokus pada latihan bertahap dan minta umpan balik dari tentor.';
    } else if (nilai >= 30) {
      narasiSingkat = `${config.label}: Perlu Perhatian. Siswa mengalami kesulitan pada aspek ini.`;
      saran = 'Disarankan bimbingan tambahan dan latihan intensif.';
    } else {
      narasiSingkat = `${config.label}: Sangat Perlu Bimbingan. Aspek ini memerlukan penanganan khusus.`;
      saran = 'Diperlukan program remedial dan pendampingan personal.';
    }
    
    result.push({
      aspek: key,
      label: config.label,
      nilai,
      deskripsi: config.deskripsi,
      indikator: config.indikator,
      narasiSingkat,
      saran
    });
  });
  
  return result;
};

/**
 * Generate narasi karakter (kompatibel dengan sistem lama)
 */
export const generateCharacterNarasi = (qualitative) => {
  if (!qualitative) return "Belum ada penilaian karakter untuk periode ini.";
  
  const avg = DIMENSI_KEYS.reduce((sum, key) => sum + (qualitative[key] || 0), 0) / 5;
  
  if (avg >= 85) {
    return "🌟 Sangat Baik! Ananda menunjukkan penguasaan materi yang luar biasa di semua aspek penilaian. Pertahankan prestasi ini!";
  } else if (avg >= 70) {
    return "👍 Baik. Ananda memiliki pemahaman yang bagus. Tingkatkan konsistensi dan pendalaman materi untuk hasil lebih optimal.";
  } else if (avg >= 50) {
    return "📘 Cukup. Ananda perlu meningkatkan pemahaman dan kemandirian belajar. Bimbingan tambahan disarankan.";
  } else if (avg >= 30) {
    return "⚠️ Perlu Perhatian. Ananda memerlukan bimbingan lebih intensif. Segera jadwalkan konsultasi dengan pengajar.";
  } else {
    return "🔴 Perhatian Khusus. Ananda sangat memerlukan evaluasi menyeluruh dan program bimbingan intensif.";
  }
};

// ============================================================
// CATATAN GURU MANUAL
// ============================================================

/**
 * Simpan catatan guru untuk siswa tertentu
 */
export const saveCatatanGuru = async (data) => {
  const { studentId, studentName, mapel, periode, catatan, teacherId, teacherName } = data;
  
  try {
    const existingQuery = query(
      collection(db, RAPORT_COLLECTIONS.CATATAN_GURU || 'raport_catatan_guru'),
      where("studentId", "==", studentId),
      where("mapel", "==", mapel),
      where("periode", "==", periode)
    );
    const existing = await getDocs(existingQuery);
    
    const catatanData = {
      studentId,
      studentName,
      mapel,
      periode,
      catatan,
      teacherId,
      teacherName,
      updatedAt: serverTimestamp()
    };
    
    if (!existing.empty) {
      await updateDoc(doc(db, RAPORT_COLLECTIONS.CATATAN_GURU || 'raport_catatan_guru', existing.docs[0].id), catatanData);
      return { success: true, action: 'updated' };
    } else {
      await addDoc(collection(db, RAPORT_COLLECTIONS.CATATAN_GURU || 'raport_catatan_guru'), {
        ...catatanData,
        createdAt: serverTimestamp()
      });
      return { success: true, action: 'created' };
    }
  } catch (error) {
    console.error("Error save catatan guru:", error);
    return { success: false, error: error.message };
  }
};

/**
 * Ambil catatan guru
 */
export const getCatatanGuru = async (studentId, mapel, periode) => {
  try {
    const q = query(
      collection(db, RAPORT_COLLECTIONS.CATATAN_GURU || 'raport_catatan_guru'),
      where("studentId", "==", studentId),
      where("mapel", "==", mapel),
      where("periode", "==", periode)
    );
    const snap = await getDocs(q);
    
    if (snap.empty) return null;
    return { id: snap.docs[0].id, ...snap.docs[0].data() };
  } catch (error) {
    console.error("Error get catatan guru:", error);
    return null;
  }
};

// ============================================================
// EKSPOR NILAI KE RAPORT SCORES
// ============================================================

/**
 * Ekspor nilai dari tugas/kuis/ujian ke raport_scores
 * @param {Object} data - { studentId, studentName, mapel, topik, nilai, komponen, dimensi, teacherId, teacherName, catatan }
 */
export const exportToRaportScores = async (data) => {
  const { 
    studentId, studentName, mapel, topik, nilai, komponen, 
    dimensi, teacherId, teacherName, catatan 
  } = data;
  
  const periode = new Date().toISOString().slice(0, 7);
  
  if (!studentId) {
    console.error("❌ exportToRaportScores: studentId is required");
    return { success: false, error: "studentId tidak boleh kosong" };
  }
  if (!komponen) {
    console.error("❌ exportToRaportScores: komponen is required");
    return { success: false, error: "komponen tidak boleh kosong" };
  }
  
  const safeMapel = mapel || "Umum";
  const safeTopik = topik || "Tanpa Topik";
  const safeNilai = nilai || 0;
  const safeStudentName = studentName || "Unknown";
  const safeTeacherId = teacherId || "";
  const safeTeacherName = teacherName || "";
  
  try {
    const existingQuery = query(
      collection(db, RAPORT_COLLECTIONS.SCORES),
      where("studentId", "==", studentId),
      where("komponen", "==", komponen),
      where("periode", "==", periode),
      where("mapel", "==", safeMapel)
    );
    const existing = await getDocs(existingQuery);
    
    const scoreData = {
      studentId,
      studentName: safeStudentName,
      mapel: safeMapel,
      topik: safeTopik,
      nilai: safeNilai,
      komponen,
      periode,
      teacherId: safeTeacherId,
      teacherName: safeTeacherName,
      updatedAt: serverTimestamp()
    };
    
    // Simpan 5 dimensi
    if (dimensi) {
      scoreData.dimensi = dimensi;
    }
    
    // Simpan catatan guru
    if (catatan) {
      scoreData.catatan = catatan;
    }
    
    if (!existing.empty) {
      await updateDoc(doc(db, RAPORT_COLLECTIONS.SCORES, existing.docs[0].id), scoreData);
      return { success: true, action: 'updated' };
    } else {
      await addDoc(collection(db, RAPORT_COLLECTIONS.SCORES), {
        ...scoreData,
        createdAt: serverTimestamp()
      });
      return { success: true, action: 'created' };
    }
  } catch (error) {
    console.error("Error export to raport scores:", error);
    return { success: false, error: error.message };
  }
};

// ============================================================
// SINKRONISASI SEMUA NILAI KE RAPORT FINAL
// ============================================================

/**
 * Sinkronkan semua nilai siswa ke raport_final
 */
export const syncAllScoresToRaport = async (periode, mapel = null) => {
  console.log(`🚀 Mulai sinkronisasi raport untuk periode ${periode}${mapel ? `, mapel: ${mapel}` : ''}...`);
  
  const studentsSnap = await getDocs(collection(db, "students"));
  const students = studentsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
  
  let results = [];
  let incompleteStudents = [];
  
  for (const student of students) {
    const scores = { kuis: [], tugas: [], ujian: [] };
    
    let scoresQuery = query(
      collection(db, RAPORT_COLLECTIONS.SCORES),
      where("studentId", "==", student.id),
      where("periode", "==", periode)
    );
    
    if (mapel) {
      scoresQuery = query(
        collection(db, RAPORT_COLLECTIONS.SCORES),
        where("studentId", "==", student.id),
        where("periode", "==", periode),
        where("mapel", "==", mapel)
      );
    }
    
    const scoresSnap = await getDocs(scoresQuery);
    
    scoresSnap.forEach(doc => {
      const data = doc.data();
      if (data.komponen && scores[data.komponen] !== undefined) {
        // Ambil data dimensi dari dokumen
        scores[data.komponen].push(data.dimensi || {
          pemahaman: data.nilai || 0,
          analisis: data.nilai || 0,
          ketelitian: data.nilai || 0,
          waktu: data.nilai || 0,
          dayaTangkap: data.nilai || 0
        });
      }
    });
    
    const totalKomponen = (scores.kuis.length > 0 ? 1 : 0) +
                          (scores.tugas.length > 0 ? 1 : 0) +
                          (scores.ujian.length > 0 ? 1 : 0);
    
    if (totalKomponen < 1) {
      incompleteStudents.push({
        id: student.id,
        name: student.nama,
        kelas: student.kelasSekolah,
        totalKomponen: 0,
        missing: {
          kuis: scores.kuis.length === 0,
          tugas: scores.tugas.length === 0,
          ujian: scores.ujian.length === 0
        }
      });
      continue;
    }
    
    const { nilaiAkhir, mode, komponenDipake, detailDimensi, detailKomponen } = calculateFinalScore(scores);
    
    // Ambil catatan guru
    const catatanGuru = await getCatatanGuru(student.id, mapel || "Umum", periode);
    
    // Generate narasi
    const narasi = generateNarasi(student.nama, mapel || "Umum", nilaiAkhir, detailDimensi);
    const dimensiNarasi = generateDimensiNarasi(detailDimensi);
    
    const finalData = {
      studentId: student.id,
      studentName: student.nama,
      studentKelas: student.kelasSekolah,
      studentProgram: student.kategori || student.program,
      mapel: mapel || "Umum",
      periode: periode,
      nilai_akhir: nilaiAkhir,
      mode_perhitungan: mode,
      komponen_dipakai: komponenDipake,
      detail_dimensi: detailDimensi,
      detail_komponen: detailKomponen,
      narasi: narasi,
      dimensi_narasi: dimensiNarasi,
      catatan_guru: catatanGuru?.catatan || null,
      updatedAt: serverTimestamp()
    };
    
    let existingQuery = query(
      collection(db, RAPORT_COLLECTIONS.FINAL),
      where("studentId", "==", student.id),
      where("periode", "==", periode)
    );
    
    if (mapel) {
      existingQuery = query(
        collection(db, RAPORT_COLLECTIONS.FINAL),
        where("studentId", "==", student.id),
        where("periode", "==", periode),
        where("mapel", "==", mapel)
      );
    }
    
    const existingSnap = await getDocs(existingQuery);
    
    if (existingSnap.empty) {
      await addDoc(collection(db, RAPORT_COLLECTIONS.FINAL), {
        ...finalData,
        createdAt: serverTimestamp()
      });
    } else {
      await updateDoc(doc(db, RAPORT_COLLECTIONS.FINAL, existingSnap.docs[0].id), finalData);
    }
    
    results.push({ 
      studentId: student.id, 
      name: student.nama, 
      nilai: nilaiAkhir,
      mode,
      komponenDipake 
    });
  }
  
  // Update leaderboard
  await updateLeaderboard(periode, mapel);
  
  return {
    success: true,
    totalStudents: students.length,
    processed: results.length,
    incomplete: incompleteStudents,
    results: results,
    mapel: mapel || "Semua"
  };
};

// ============================================================
// LEADERBOARD
// ============================================================

/**
 * Update leaderboard
 */
export const updateLeaderboard = async (periode, mapel = null) => {
  let finalQuery = query(
    collection(db, RAPORT_COLLECTIONS.FINAL),
    where("periode", "==", periode),
    orderBy("nilai_akhir", "desc")
  );
  
  if (mapel) {
    finalQuery = query(
      collection(db, RAPORT_COLLECTIONS.FINAL),
      where("periode", "==", periode),
      where("mapel", "==", mapel),
      orderBy("nilai_akhir", "desc")
    );
  }
  
  const finalSnap = await getDocs(finalQuery);
  
  const allScores = finalSnap.docs.map((doc, index) => ({
    id: doc.id,
    ...doc.data(),
    rank: index + 1
  }));
  
  const leaderboardKey = mapel ? `${periode}_${mapel}` : periode;
  
  const leaderboardSnap = await getDocs(query(
    collection(db, RAPORT_COLLECTIONS.LEADERBOARD),
    where("periode", "==", leaderboardKey)
  ));
  
  if (leaderboardSnap.empty) {
    await addDoc(collection(db, RAPORT_COLLECTIONS.LEADERBOARD), {
      periode: leaderboardKey,
      mapel: mapel || "Semua",
      data: allScores,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
  } else {
    await updateDoc(doc(db, RAPORT_COLLECTIONS.LEADERBOARD, leaderboardSnap.docs[0].id), {
      data: allScores,
      updatedAt: serverTimestamp()
    });
  }
  
  return allScores;
};

/**
 * Ambil leaderboard relatif untuk siswa tertentu
 */
export const getRelativeLeaderboard = async (periode, studentId, mapel = null) => {
  const leaderboardKey = mapel ? `${periode}_${mapel}` : periode;
  
  const leaderboardSnap = await getDocs(query(
    collection(db, RAPORT_COLLECTIONS.LEADERBOARD),
    where("periode", "==", leaderboardKey)
  ));
  
  if (leaderboardSnap.empty) return null;
  
  const allData = leaderboardSnap.docs[0].data().data;
  const studentIndex = allData.findIndex(s => s.studentId === studentId);
  
  if (studentIndex === -1) return null;
  
  const start = Math.max(0, studentIndex - 5);
  const end = Math.min(allData.length, studentIndex + 6);
  
  return {
    totalStudents: allData.length,
    studentRank: studentIndex + 1,
    studentScore: allData[studentIndex].nilai_akhir,
    nearbyStudents: allData.slice(start, end),
    topStudent: allData[0],
    mapel: mapel || "Semua"
  };
};

/**
 * Ambil ranking gabungan (semua mapel)
 */
export const getRankingGabungan = async (periode) => {
  const finalSnap = await getDocs(query(
    collection(db, RAPORT_COLLECTIONS.FINAL),
    where("periode", "==", periode)
  ));
  
  const allFinals = finalSnap.docs.map(d => d.data());
  
  // Group by student
  const studentMap = {};
  allFinals.forEach(f => {
    if (!studentMap[f.studentId]) {
      studentMap[f.studentId] = {
        studentId: f.studentId,
        studentName: f.studentName,
        studentKelas: f.studentKelas,
        mapelScores: {},
        totalNilai: 0,
        mapelCount: 0
      };
    }
    studentMap[f.studentId].mapelScores[f.mapel] = f.nilai_akhir;
  });
  
  // Hitung rata-rata
  const rankings = Object.values(studentMap).map(s => {
    const nilaiArr = Object.values(s.mapelScores);
    s.totalNilai = Math.round((nilaiArr.reduce((a, b) => a + b, 0) / nilaiArr.length) * 10) / 10;
    s.mapelCount = nilaiArr.length;
    return s;
  });
  
  rankings.sort((a, b) => b.totalNilai - a.totalNilai);
  rankings.forEach((r, i) => r.rank = i + 1);
  
  return rankings;
};

// ============================================================
// HELPER
// ============================================================

function getPreviousMonth(periode) {
  const [year, month] = periode.split('-');
  let prevMonth = parseInt(month) - 1;
  let prevYear = parseInt(year);
  if (prevMonth === 0) {
    prevMonth = 12;
    prevYear--;
  }
  return `${prevYear}-${String(prevMonth).padStart(2, '0')}`;
}