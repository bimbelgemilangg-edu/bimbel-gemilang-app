// src/firebase/raportCollection.js
// Struktur database untuk Smart Raport v2

export const RAPORT_COLLECTIONS = {
  SCORES: 'raport_scores',           // Nilai mentah per komponen
  FINAL: 'raport_final',             // Nilai akhir per bulan
  LEADERBOARD: 'raport_leaderboard', // Cache leaderboard
  CATATAN_GURU: 'raport_catatan_guru' // Catatan manual guru
};

// Konfigurasi 5 Dimensi Penilaian
export const DIMENSI_CONFIG = {
  pemahaman: {
    label: "Pemahaman Konsep",
    deskripsi: "Mengukur sejauh mana siswa memahami teori, rumus, atau fakta kunci dalam suatu materi pelajaran, bukan sekadar menghafal.",
    indikator: "Siswa mampu menjelaskan ulang materi dengan bahasanya sendiri dan memberikan contoh konkret.",
    range: "0-100"
  },
  analisis: {
    label: "Analisis & Pemecahan Masalah",
    deskripsi: "Mengukur kemampuan siswa memecah soal yang kompleks (soal cerita, studi kasus, atau soal HOTS) menjadi bagian-bagian kecil untuk diselesaikan.",
    indikator: "Siswa mampu mengidentifikasi apa yang diketahui, ditanyakan, dan memilih strategi/rumus yang tepat.",
    range: "0-100"
  },
  ketelitian: {
    label: "Ketelitian & Prosedur Pengerjaan",
    deskripsi: "Mengukur kedisiplinan siswa dalam mengikuti langkah-langkah pengerjaan soal secara runtut dan meminimalkan kesalahan sepele (careless mistakes).",
    indikator: "Siswa menuliskan proses pengerjaan dengan rapi, menghitung dengan benar, atau menulis tata bahasa/ejaan secara tepat.",
    range: "0-100"
  },
  waktu: {
    label: "Kecepatan & Manajemen Waktu",
    deskripsi: "Mengukur efisiensi siswa dalam menyelesaikan tugas atau soal ujian di bawah tekanan durasi waktu tertentu.",
    indikator: "Siswa mampu menyelesaikan seluruh soal sesuai batas waktu tanpa mengorbankan kualitas jawaban.",
    range: "0-100"
  },
  dayaTangkap: {
    label: "Daya Tangkap & Kemandirian Belajar",
    deskripsi: "Mengukur seberapa cepat siswa memahami materi baru setelah dijelaskan oleh tentor, serta inisiatifnya dalam mencoba soal latihan secara mandiri.",
    indikator: "Siswa aktif bertanya pada bagian yang sulit dan mampu mengerjakan soal sejenis berikutnya tanpa panduan penuh.",
    range: "0-100"
  }
};

// Daftar key 5 dimensi
export const DIMENSI_KEYS = ['pemahaman', 'analisis', 'ketelitian', 'waktu', 'dayaTangkap'];

// Bobot komponen (default jika ketiganya lengkap)
export const KOMPONEN_BOBOT = {
  kuis: 0.30,    // 30%
  tugas: 0.30,   // 30%
  ujian: 0.40    // 40%
};

// Label komponen
export const KOMPONEN_LABEL = {
  kuis: '📝 Kuis / Latihan',
  tugas: '📓 Tugas / Catatan',
  ujian: '📖 Ujian / Evaluasi'
};

// Aturan perhitungan nilai akhir
export const ATURAN_NILAI = {
  ADA_UJIAN: 'Jika ada nilai ujian → pakai nilai ujian',
  QUIZ_TUGAS: 'Jika belum ujian, ada quiz + tugas → rata-rata (quiz+tugas)/2',
  SALAH_SATU: 'Jika hanya ada quiz atau tugas saja → pakai yang ada',
  LENGKAP: 'Jika ketiganya lengkap → Quiz 30% + Tugas 30% + Ujian 40%'
};

/*
STRUKTUR DATA v2:

Collection: raport_scores
{
  studentId: "xxx",
  studentName: "Ahmad",
  mapel: "Matematika",
  komponen: "kuis",        // 'kuis', 'tugas', 'ujian'
  topik: "Aljabar",
  nilai: 85,               // Nilai akhir komponen (rata-rata 5 dimensi)
  dimensi: {               // ➕ 5 Dimensi Penilaian (WAJIB)
    pemahaman: 85,
    analisis: 78,
    ketelitian: 90,
    waktu: 70,
    dayaTangkap: 82
  },
  periode: "2026-05",
  sumber: "manual",        // 'manual', 'otomatis' (dari quiz/tugas)
  teacherId: "xxx",
  teacherName: "Budi",
  catatan: "Siswa sudah mulai memahami aljabar...",  // Catatan opsional
  createdAt: timestamp,
  updatedAt: timestamp
}

Collection: raport_final
{
  studentId: "xxx",
  studentName: "Ahmad",
  studentKelas: "6 SD",
  studentProgram: "Reguler",
  mapel: "Matematika",
  periode: "2026-05",
  nilai_akhir: 83,
  mode_perhitungan: "Lengkap (Quiz+Tugas+Ujian)",  // Mode yang dipakai
  komponen_dipakai: ["kuis", "tugas", "ujian"],
  detail_dimensi: {        // ➕ Rata-rata 5 dimensi final
    pemahaman: 85,
    analisis: 78,
    ketelitian: 90,
    waktu: 70,
    dayaTangkap: 82
  },
  detail_komponen: {       // ➕ Detail per komponen
    kuis: { pemahaman: 80, analisis: 75, ketelitian: 85, waktu: 65, dayaTangkap: 80, total: 77 },
    tugas: { pemahaman: 85, analisis: 78, ketelitian: 90, waktu: 70, dayaTangkap: 82, total: 81 },
    ujian: { pemahaman: 90, analisis: 82, ketelitian: 95, waktu: 75, dayaTangkap: 85, total: 85.4 }
  },
  narasi: "🌟 Ahmad menunjukkan penguasaan luar biasa...",
  dimensi_narasi: [        // ➕ Narasi per dimensi
    { aspek: "pemahaman", label: "Pemahaman Konsep", nilai: 85, narasiSingkat: "...", saran: "..." },
    ...
  ],
  catatan_guru: "Ahmad perlu lebih aktif...",  // Catatan manual guru
  createdAt: timestamp,
  updatedAt: timestamp
}

Collection: raport_catatan_guru
{
  studentId: "xxx",
  studentName: "Ahmad",
  mapel: "Matematika",
  periode: "2026-05",
  catatan: "Ahmad sudah menunjukkan progress...",
  teacherId: "xxx",
  teacherName: "Budi",
  createdAt: timestamp,
  updatedAt: timestamp
}

Collection: raport_leaderboard
{
  periode: "2026-05_Matematika",  // Key: periode_mapel
  mapel: "Matematika",            // atau "Semua" untuk gabungan
  data: [
    { id: "xxx", studentId: "xxx", studentName: "Ahmad", nilai_akhir: 95, rank: 1, ... },
    ...
  ],
  createdAt: timestamp,
  updatedAt: timestamp
}
*/