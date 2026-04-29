// src/firebase/raportCollection.js
// Struktur database untuk Smart Raport

export const RAPORT_COLLECTIONS = {
    SCORES: 'raport_scores',        // Nilai mentah per komponen
    FINAL: 'raport_final',          // Nilai akhir per bulan
    LEADERBOARD: 'raport_leaderboard' // Cache leaderboard
  };
  
  // Bobot nilai (bisa diubah di settings nanti)
  export const DEFAULT_WEIGHTS = {
    kuis: 0.25,      // 25%
    catatan: 0.25,   // 25%
    ujian: 0.35,     // 35%
    keaktifan: 0.15  // 15%
  };
  
  /*
  STRUKTUR DATA:
  
  Collection: raport_scores
  {
    studentId: "xxx",
    studentName: "Ahmad",
    mapel: "Matematika",
    komponen: "kuis",  // 'kuis', 'catatan', 'ujian', 'keaktifan'
    topik: "Aljabar",
    nilai: 85,
    periode: "2026-04",
    sumber: "otomatis",
    teacherId: "xxx",
    createdAt: timestamp
  }
  
  Collection: raport_final
  {
    studentId: "xxx",
    studentName: "Ahmad",
    mapel: "Matematika",
    periode: "2026-04",
    nilai_kuis: 82,
    nilai_catatan: 75,
    nilai_ujian: 88,
    nilai_keaktifan: 80,
    nilai_akhir: 83,
    rank_global: 5,
    rank_kelas: 3,
    narasi: "Selamat! Nilai naik 10 poin.",
    createdAt: timestamp,
    updatedAt: timestamp
  }
  */