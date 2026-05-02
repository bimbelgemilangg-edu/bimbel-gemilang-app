// src/firebase/raportCollection.js
// Struktur database untuk Smart Raport

export const RAPORT_COLLECTIONS = {
  SCORES: 'raport_scores',        // Nilai mentah per komponen
  FINAL: 'raport_final',          // Nilai akhir per bulan
  LEADERBOARD: 'raport_leaderboard' // Cache leaderboard
};

// Bobot nilai DEFAULT (digunakan jika 4 komponen lengkap)
// Untuk bimbel: ujian diturunkan karena tidak selalu ada tiap bulan
export const DEFAULT_WEIGHTS = {
  kuis: 0.30,      // 30% - naik (auto-score, paling sering)
  catatan: 0.30,   // 30% - naik (tugas upload, rutin)
  ujian: 0.20,     // 20% - turun (tidak selalu ada)
  keaktifan: 0.20  // 20% - naik (observasi guru, selalu bisa input)
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
  qualitative: {       // ➕ Data 5 poin karakter (opsional)
    pemahaman: 4,
    aplikasi: 3,
    literasi: 4,
    inisiatif: 3,
    mandiri: 4
  },
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
  nilai_ujian: 88,       // Bisa null jika ujian belum ada
  nilai_keaktifan: 80,
  nilai_akhir: 83,
  rank_global: 5,
  rank_kelas: 3,
  narasi: "Selamat! Nilai naik 10 poin.",
  komponen_dipakai: ["kuis", "catatan", "ujian", "keaktifan"], // ➕ Track komponen yang dihitung
  createdAt: timestamp,
  updatedAt: timestamp
}
*/