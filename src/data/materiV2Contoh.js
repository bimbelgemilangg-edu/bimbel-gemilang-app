// src/data/materiV2Contoh.js
// ============================================================
// DATA CONTOH MATERI v2 -- hanya tampil saat koleksi `materi_v2`
// di Firestore masih kosong / tidak terjangkau (mode preview UI).
// Di UI selalu diberi badge "MODE CONTOH" supaya tidak tertukar
// dengan materi sungguhan. Hapus file ini (atau kosongkan
// isinya) setelah admin mengisi materi asli.
// Skema mengikuti docs/RENCANA-ROMBAK-MATERI.md §3.1
// ============================================================

export const MATERI_CONTOH = [
  {
    id: 'contoh-mat-bilangan',
    judul: 'Bilangan Bulat',
    mapel: 'Matematika',
    kelas: '7',
    jenjang: 'smp',
    deskripsi: 'Mengenal bilangan bulat, operasi hitung, dan sifat-sifatnya.',
    warna: '#4C6EF5',
    emoji: '🔢',
    urutan: 1,
    status: 'aktif',
    premium: false,
    bab: [
      {
        id: 'contoh-bab-1',
        judul: 'Mengenal Bilangan Bulat',
        urutan: 1,
        ringkasan: 'Apa itu bilangan bulat dan di mana kita menemukannya.',
        estimasiMenit: 10,
        tipe: 'teks',
        sections: [
          { jenis: 'paragraf', teks: 'Bilangan bulat adalah bilangan yang terdiri dari bilangan cacah (0, 1, 2, 3, ...) dan lawan negatifnya (-1, -2, -3, ...). Bilangan bulat ditulis tanpa koma atau pecahan.' },
          { jenis: 'callout', tipe: 'info', judul: 'Kenapa penting?', teks: 'Suhu di bawah nol, kedalaman laut, dan saldo minus — semuanya memakai bilangan negatif. Tanpa bilangan bulat, kita tidak bisa menggambarkan "kurang dari nol".' },
          { jenis: 'judul', teks: 'Garis Bilangan' },
          { jenis: 'paragraf', teks: 'Bayangkan sebuah garis mendatar. Nol di tengah, bilangan positif ke kanan, bilangan negatif ke kiri. Semakin ke kanan semakin besar, semakin ke kiri semakin kecil.' },
          { jenis: 'rumus', latex: '-3 < -1 < 0 < 2 < 5' },
          { jenis: 'contoh', judul: 'Contoh 1', teks: 'Suhu di puncak gunung pagi hari -4°C, lalu naik 6°C. Berapa suhu sekarang?', pembahasan: '-4 + 6 = 2. Jadi suhu sekarang 2°C.' },
          { jenis: 'langkah', items: ['Letakkan bilangan pada garis bilangan', 'Bandingkan posisi: kanan = lebih besar', 'Tulis hasil perbandingan dengan tanda < atau >'] },
        ],
        ujiPemahaman: [
          { soal: 'Bilangan manakah yang paling kecil?', tipe: 'pg', opsi: ['-7', '-2', '0', '3'], jawaban: 0, pembahasan: 'Pada garis bilangan, -7 paling kiri sehingga paling kecil.' },
          { soal: 'Hasil dari -5 + 8 adalah ...', tipe: 'pg', opsi: ['-13', '-3', '3', '13'], jawaban: 2, pembahasan: '-5 + 8 = 3 (langkah 8 satuan ke kanan dari -5).' },
        ],
      },
      {
        id: 'contoh-bab-2',
        judul: 'Penjumlahan dan Pengurangan',
        urutan: 2,
        ringkasan: 'Aturan tanda pada operasi penjumlahan dan pengurangan.',
        estimasiMenit: 15,
        tipe: 'teks',
        sections: [
          { jenis: 'paragraf', teks: 'Menjumlahkan dua bilangan dengan tanda sama: jumlahkan nilainya, tandanya tetap. Tanda berbeda: kurangi nilai yang besar dengan yang kecil, ikuti tanda bilangan yang lebih besar.' },
          { jenis: 'rumus', latex: 'a - (-b) = a + b' },
          { jenis: 'callout', tipe: 'tips', judul: 'Trik tanda', teks: 'Kurung negatif bertemu negatif jadi positif: "musuhnya musuhku adalah temanku".' },
          { jenis: 'contoh', judul: 'Contoh 2', teks: 'Hitung 7 - (-3).', pembahasan: '7 - (-3) = 7 + 3 = 10.' },
        ],
        ujiPemahaman: [
          { soal: 'Hasil dari -6 - (-9) adalah ...', tipe: 'pg', opsi: ['-15', '-3', '3', '15'], jawaban: 2, pembahasan: '-6 - (-9) = -6 + 9 = 3.' },
        ],
      },
      {
        id: 'contoh-bab-3',
        judul: 'Perkalian dan Pembagian',
        urutan: 3,
        ringkasan: 'Aturan tanda pada perkalian dan pembagian.',
        estimasiMenit: 15,
        tipe: 'teks',
        sections: [
          { jenis: 'paragraf', teks: 'Tanda sama → hasil positif. Tanda beda → hasil negatif. Aturan ini berlaku untuk perkalian maupun pembagian.' },
          { jenis: 'rumus', latex: '(+) \\times (+) = (+), \\quad (-) \\times (-) = (+), \\quad (-) \\times (+) = (-)' },
          { jenis: 'contoh', judul: 'Contoh 3', teks: 'Hitung (-4) × 5 dan (-12) ÷ (-3).', pembahasan: '(-4) × 5 = -20 (tanda beda). (-12) ÷ (-3) = 4 (tanda sama).' },
        ],
        ujiPemahaman: [
          { soal: 'Hasil dari (-8) × (-2) adalah ...', tipe: 'pg', opsi: ['-16', '-10', '10', '16'], jawaban: 3, pembahasan: 'Negatif × negatif = positif, jadi 16.' },
        ],
      },
    ],
  },
  {
    id: 'contoh-ipa-pencernaan',
    judul: 'Sistem Pencernaan Manusia',
    mapel: 'IPA',
    kelas: '8',
    jenjang: 'smp',
    deskripsi: 'Perjalanan makanan dari mulut sampai penyerapan sari-sari.',
    warna: '#12B886',
    emoji: '🍎',
    urutan: 2,
    status: 'aktif',
    premium: false,
    bab: [
      {
        id: 'contoh-ipa-bab-1',
        judul: 'Organ Pencernaan dan Fungsinya',
        urutan: 1,
        ringkasan: 'Mulut, kerongkongan, lambung, usus halus, usus besar.',
        estimasiMenit: 12,
        tipe: 'teks',
        sections: [
          { jenis: 'paragraf', teks: 'Pencernaan manusia berlangsung secara mekanik (mengunyah, meremas) dan kimiawi (enzim). Urutannya: mulut → kerongkongan → lambung → usus halus → usus besar → anus.' },
          { jenis: 'callout', tipe: 'info', judul: 'Tahukah kamu?', teks: 'Usus halus orang dewasa panjangnya sekitar 6-7 meter — penyerapan sari makanan terjadi di sini.' },
          { jenis: 'langkah', items: ['Mulut: gigi menghancurkan, air ludah (amilase) memulai pemecahan', 'Lambung: asam lambung + pepsin memecah protein', 'Usus halus: enzim dari pankreas & empedu menyelesaikan pemecahan', 'Usus besar: penyerapan air, pembentukan feses'] },
        ],
        ujiPemahaman: [
          { soal: 'Penyerapan sari-sari makanan terjadi di ...', tipe: 'pg', opsi: ['Lambung', 'Usus halus', 'Usus besar', 'Kerongkongan'], jawaban: 1, pembahasan: 'Usus halus memiliki vili yang menyerap sari makanan.' },
        ],
      },
    ],
  },
];

// Index cepat: { [materiId]: { ...materi, bab: [...] } }
export const contohBerdasarkanId = (id) =>
  MATERI_CONTOH.find((m) => m.id === id) || null;
