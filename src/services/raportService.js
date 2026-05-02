// src/services/raportService.js
import { db } from '../firebase';
import { 
  collection, query, where, getDocs, addDoc, updateDoc, 
  doc, serverTimestamp, Timestamp, orderBy 
} from 'firebase/firestore';
import { DEFAULT_WEIGHTS, RAPORT_COLLECTIONS } from '../firebase/raportCollection';

/**
 * Hitung nilai akhir berdasarkan bobot
 */
export const calculateFinalScore = (scores) => {
  const weights = DEFAULT_WEIGHTS;
  
  const kuisAvg = scores.kuis?.length > 0 
    ? scores.kuis.reduce((a,b) => a+b, 0) / scores.kuis.length 
    : 0;
  const catatanAvg = scores.catatan?.length > 0 
    ? scores.catatan.reduce((a,b) => a+b, 0) / scores.catatan.length 
    : 0;
  const ujianAvg = scores.ujian?.length > 0 
    ? scores.ujian.reduce((a,b) => a+b, 0) / scores.ujian.length 
    : 0;
  const keaktifanAvg = scores.keaktifan?.length > 0 
    ? scores.keaktifan.reduce((a,b) => a+b, 0) / scores.keaktifan.length 
    : 0;
  
  const final = (kuisAvg * weights.kuis) + 
                (catatanAvg * weights.catatan) + 
                (ujianAvg * weights.ujian) + 
                (keaktifanAvg * weights.keaktifan);
  
  return Math.round(final);
};

/**
 * Generate narasi otomatis berdasarkan nilai
 */
export const generateNarasi = (namaSiswa, mapel, nilaiSekarang, nilaiSebelumnya) => {
  const selisih = nilaiSekarang - (nilaiSebelumnya || 0);
  
  if (selisih >= 10) {
    return `🎉 Selamat, ${namaSiswa}! Nilai ${mapel} naik ${selisih} poin. Pertahankan semangat belajarmu!`;
  } else if (selisih >= 5) {
    return `👍 Bagus, ${namaSiswa}! Nilai ${mapel} naik ${selisih} poin. Terus tingkatkan lagi ya!`;
  } else if (selisih >= 1) {
    return `📈 ${namaSiswa}, nilai ${mapel} naik sedikit. Konsisten belajar ya!`;
  } else if (selisih === 0) {
    return `🤝 ${namaSiswa}, nilai ${mapel} stabil. Coba tantang dirimu untuk naik lebih tinggi!`;
  } else if (selisih >= -5) {
    return `⚠️ ${namaSiswa}, nilai ${mapel} turun sedikit. Yuk, semangat lagi belajarnya!`;
  } else {
    return `🔴 ${namaSiswa}, nilai ${mapel} turun drastis. Segera evaluasi dan konsultasi dengan guru ya!`;
  }
};

/**
 * Ekspor nilai dari tugas/kuis ke raport_scores
 */
export const exportToRaportScores = async (data) => {
  const { studentId, studentName, mapel, topik, nilai, komponen, teacherId, teacherName } = data;
  const periode = new Date().toISOString().slice(0, 7);
  
  try {
    // Cek apakah sudah ada nilai untuk komponen ini periode ini
    const existingQuery = query(
      collection(db, RAPORT_COLLECTIONS.SCORES),
      where("studentId", "==", studentId),
      where("komponen", "==", komponen),
      where("periode", "==", periode),
      where("mapel", "==", mapel)
    );
    const existing = await getDocs(existingQuery);
    
    if (!existing.empty) {
      // Update nilai yang sudah ada
      await updateDoc(doc(db, RAPORT_COLLECTIONS.SCORES, existing.docs[0].id), {
        nilai: nilai,
        topik: topik,
        updatedAt: serverTimestamp()
      });
      return { success: true, action: 'updated' };
    } else {
      // Buat baru
      await addDoc(collection(db, RAPORT_COLLECTIONS.SCORES), {
        studentId, studentName, mapel, topik, nilai, komponen,
        periode, teacherId, teacherName,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      return { success: true, action: 'created' };
    }
  } catch (error) {
    console.error("Error export to raport scores:", error);
    return { success: false, error: error.message };
  }
};

/**
 * Sinkronkan semua nilai siswa ke raport_final (ONE-CLICK SYNC)
 */
export const syncAllScoresToRaport = async (periode, teacherId = null) => {
  console.log(`🚀 Mulai sinkronisasi raport untuk periode ${periode}...`);
  
  // 1. Ambil semua siswa
  const studentsSnap = await getDocs(collection(db, "students"));
  const students = studentsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
  
  let results = [];
  let incompleteStudents = [];
  
  for (const student of students) {
    // 2. Ambil semua nilai mentah siswa untuk periode ini
    const scores = { kuis: [], catatan: [], ujian: [], keaktifan: [] };
    
    const scoresSnap = await getDocs(query(
      collection(db, RAPORT_COLLECTIONS.SCORES),
      where("studentId", "==", student.id),
      where("periode", "==", periode)
    ));
    
    scoresSnap.forEach(doc => {
      const data = doc.data();
      if (scores[data.komponen]) {
        scores[data.komponen].push(data.nilai);
      }
    });
    
    // Cek kelengkapan
    const isComplete = scores.kuis.length > 0 && 
                       scores.catatan.length > 0 && 
                       scores.ujian.length > 0 && 
                       scores.keaktifan.length > 0;
    
    if (!isComplete) {
      incompleteStudents.push({
        id: student.id,
        name: student.nama,
        kelas: student.kelasSekolah,
        missing: {
          kuis: scores.kuis.length === 0,
          catatan: scores.catatan.length === 0,
          ujian: scores.ujian.length === 0,
          keaktifan: scores.keaktifan.length === 0
        }
      });
      continue;
    }
    
    // 3. Hitung nilai akhir
    const nilaiAkhir = calculateFinalScore(scores);
    
    // 4. Ambil nilai bulan lalu
    const lastMonth = getPreviousMonth(periode);
    const lastMonthSnap = await getDocs(query(
      collection(db, RAPORT_COLLECTIONS.FINAL),
      where("studentId", "==", student.id),
      where("periode", "==", lastMonth)
    ));
    const nilaiSebelumnya = lastMonthSnap.empty ? null : lastMonthSnap.docs[0].data().nilai_akhir;
    
    // 5. Generate narasi
    const narasi = generateNarasi(student.nama, "Umum", nilaiAkhir, nilaiSebelumnya);
    
    // 6. Simpan ke raport_final
    const finalData = {
      studentId: student.id,
      studentName: student.nama,
      studentKelas: student.kelasSekolah,
      studentProgram: student.kategori || student.program,
      mapel: "Umum",
      periode: periode,
      nilai_kuis: scores.kuis.reduce((a,b) => a+b, 0) / scores.kuis.length,
      nilai_catatan: scores.catatan.reduce((a,b) => a+b, 0) / scores.catatan.length,
      nilai_ujian: scores.ujian.reduce((a,b) => a+b, 0) / scores.ujian.length,
      nilai_keaktifan: scores.keaktifan.reduce((a,b) => a+b, 0) / scores.keaktifan.length,
      nilai_akhir: nilaiAkhir,
      narasi: narasi,
      updatedAt: serverTimestamp()
    };
    
    const existingSnap = await getDocs(query(
      collection(db, RAPORT_COLLECTIONS.FINAL),
      where("studentId", "==", student.id),
      where("periode", "==", periode)
    ));
    
    if (existingSnap.empty) {
      await addDoc(collection(db, RAPORT_COLLECTIONS.FINAL), {
        ...finalData,
        createdAt: serverTimestamp()
      });
    } else {
      await updateDoc(doc(db, RAPORT_COLLECTIONS.FINAL, existingSnap.docs[0].id), finalData);
    }
    
    results.push({ studentId: student.id, name: student.nama, nilai: nilaiAkhir });
  }
  
  // 7. Update leaderboard
  await updateLeaderboard(periode);
  
  return {
    success: true,
    totalStudents: students.length,
    processed: results.length,
    incomplete: incompleteStudents,
    results: results
  };
};

/**
 * Update leaderboard relatif
 */
export const updateLeaderboard = async (periode) => {
  const finalSnap = await getDocs(query(
    collection(db, RAPORT_COLLECTIONS.FINAL),
    where("periode", "==", periode),
    orderBy("nilai_akhir", "desc")
  ));
  
  const allScores = finalSnap.docs.map((doc, index) => ({
    id: doc.id,
    ...doc.data(),
    rank: index + 1
  }));
  
  // Simpan ke leaderboard collection
  const leaderboardRef = doc(db, RAPORT_COLLECTIONS.LEADERBOARD, periode);
  const leaderboardSnap = await getDocs(query(
    collection(db, RAPORT_COLLECTIONS.LEADERBOARD),
    where("periode", "==", periode)
  ));
  
  if (leaderboardSnap.empty) {
    await addDoc(collection(db, RAPORT_COLLECTIONS.LEADERBOARD), {
      periode: periode,
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
 * Hanya tampilkan peringkat di sekitar siswa
 */
export const getRelativeLeaderboard = async (periode, studentId) => {
  const leaderboardSnap = await getDocs(query(
    collection(db, RAPORT_COLLECTIONS.LEADERBOARD),
    where("periode", "==", periode)
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
    topStudent: allData[0]
  };
};

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

// ============================================================
// ➕ FUNGSI TAMBAHAN BARU (TIDAK MENGUBAH KODE DI ATAS)
// ============================================================

/**
 * Generate narasi deskriptif dari 5 poin penilaian karakter
 * @param {Object} qualitative - { pemahaman, aplikasi, literasi, inisiatif, mandiri } (nilai 1-5)
 * @returns {String} Narasi deskriptif keseluruhan
 */
export const generateCharacterNarasi = (qualitative) => {
  if (!qualitative) return "Belum ada penilaian karakter untuk periode ini.";
  
  const avg = (
    (qualitative.pemahaman || 0) + 
    (qualitative.aplikasi || 0) + 
    (qualitative.literasi || 0) + 
    (qualitative.inisiatif || 0) + 
    (qualitative.mandiri || 0)
  ) / 5;
  
  if (avg >= 4.5) {
    return "🌟 Sangat Baik! Ananda menunjukkan penguasaan materi yang luar biasa, sangat mandiri, aktif dalam diskusi, dan konsisten mengerjakan tugas dengan teliti. Pertahankan prestasi ini!";
  } else if (avg >= 3.5) {
    return "👍 Baik. Ananda memiliki pemahaman yang bagus, cukup mandiri, dan menunjukkan inisiatif dalam belajar. Tingkatkan konsistensi dan pendalaman materi untuk hasil lebih optimal.";
  } else if (avg >= 2.5) {
    return "📘 Cukup. Ananda perlu meningkatkan pemahaman konsep, kemandirian dalam mengerjakan tugas, dan keaktifan bertanya saat mengalami kesulitan. Bimbingan tambahan disarankan.";
  } else if (avg >= 1.5) {
    return "⚠️ Perlu Perhatian. Ananda memerlukan bimbingan lebih intensif dalam pemahaman materi, motivasi belajar, dan pendampingan khusus. Segera jadwalkan konsultasi dengan pengajar.";
  } else {
    return "🔴 Perhatian Khusus. Ananda sangat memerlukan evaluasi menyeluruh dan program bimbingan intensif. Segera hubungi wali kelas untuk penanganan lebih lanjut.";
  }
};

/**
 * Generate narasi detail per aspek karakter
 * @param {Object} qualitative - { pemahaman, aplikasi, literasi, inisiatif, mandiri } (nilai 1-5)
 * @returns {Array<Object>} Array berisi { aspek, nilai, label, narasi, saran }
 */
export const generateDetailCharacterNarasi = (qualitative) => {
  if (!qualitative) return [];
  
  const aspekConfig = {
    pemahaman: {
      label: "Pemahaman Konsep",
      narasi5: "Penguasaan teori sangat mendalam dan mampu menjelaskan kembali dengan baik.",
      narasi4: "Pemahaman konsep sudah bagus, hanya perlu sedikit pendalaman.",
      narasi3: "Cukup memahami dasar, perlu lebih banyak latihan soal variatif.",
      narasi2: "Mengalami kesulitan memahami konsep, butuh penjelasan ulang.",
      narasi1: "Belum memahami konsep dasar, perlu bimbingan dari awal.",
      saran5: "Pertahankan dengan mengajarkan teman lain.",
      saran4: "Perbanyak latihan soal HOTS.",
      saran3: "Ikuti sesi tambahan dan perbanyak bertanya.",
      saran2: "Jadwalkan bimbingan privat mingguan.",
      saran1: "Perlu program remedial intensif."
    },
    aplikasi: {
      label: "Logika & Aplikasi",
      narasi5: "Mampu menerapkan konsep ke berbagai variasi soal dengan sangat baik.",
      narasi4: "Cukup baik dalam menerapkan konsep, perlu variasi soal lebih menantang.",
      narasi3: "Bisa mengerjakan soal standar, kesulitan di soal kompleks.",
      narasi2: "Sering keliru dalam menerapkan rumus/logika.",
      narasi1: "Belum mampu mengaplikasikan konsep ke soal.",
      saran5: "Coba soal olimpiade untuk tantangan.",
      saran4: "Latihan soal cerita dan studi kasus.",
      saran3: "Fokus pada langkah-langkah pengerjaan.",
      saran2: "Mulai dari soal dasar bertahap.",
      saran1: "Kembali ke latihan konsep dasar."
    },
    literasi: {
      label: "Literasi & Fokus",
      narasi5: "Sangat teliti membaca soal dan mampu fokus dalam waktu lama.",
      narasi4: "Teliti dalam membaca, fokus cukup baik.",
      narasi3: "Cukup teliti, kadang kurang fokus pada sesi panjang.",
      narasi2: "Sering salah membaca soal, mudah terdistraksi.",
      narasi1: "Kesulitan fokus dan sering salah memahami instruksi.",
      saran5: "Jadi mentor baca soal untuk teman.",
      saran4: "Latih dengan timer untuk meningkatkan fokus.",
      saran3: "Baca soal 2x sebelum menjawab.",
      saran2: "Kurangi distraksi saat belajar.",
      saran1: "Latihan membaca pemahaman dasar."
    },
    inisiatif: {
      label: "Inisiatif",
      narasi5: "Sangat aktif bertanya, mencari materi tambahan, dan berdiskusi.",
      narasi4: "Aktif bertanya saat ada kesulitan dan mencari tahu sendiri.",
      narasi3: "Kadang bertanya, perlu didorong untuk lebih proaktif.",
      narasi2: "Jarang bertanya meski tampak kesulitan.",
      narasi1: "Pasif, tidak pernah bertanya atau mencari bantuan.",
      saran5: "Bantu teman yang kesulitan.",
      saran4: "Eksplorasi materi di luar kurikulum.",
      saran3: "Buat catatan pertanyaan sebelum kelas.",
      saran2: "Mulai biasakan bertanya 1x per sesi.",
      saran1: "Butuh pendekatan personal untuk membangun kepercayaan diri."
    },
    mandiri: {
      label: "Kemandirian",
      narasi5: "Sangat mandiri, mampu belajar sendiri dan menyelesaikan tugas tepat waktu.",
      narasi4: "Mandiri dalam mengerjakan tugas, sesekali perlu arahan.",
      narasi3: "Cukup mandiri, masih perlu pengawasan berkala.",
      narasi2: "Sering bergantung pada bantuan, kurang percaya diri.",
      narasi1: "Sangat bergantung, tidak bisa mengerjakan tanpa bimbingan penuh.",
      saran5: "Berikan proyek mandiri untuk dikerjakan.",
      saran4: "Kurangi bantuan bertahap.",
      saran3: "Tetapkan target harian yang jelas.",
      saran2: "Dampingi lalu lepas bertahap.",
      saran1: "Mulai dari tugas sangat sederhana."
    }
  };
  
  const result = [];
  
  Object.keys(aspekConfig).forEach(key => {
    const nilai = qualitative[key] || 0;
    const config = aspekConfig[key];
    const narasiKey = `narasi${nilai}`;
    const saranKey = `saran${nilai}`;
    
    result.push({
      aspek: key,
      label: config.label,
      nilai: nilai,
      narasi: config[narasiKey] || config.narasi3,
      saran: config[saranKey] || config.saran3
    });
  });
  
  return result;
};