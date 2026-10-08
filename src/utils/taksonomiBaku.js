// src/utils/taksonomiBaku.js
// ============================================================
// DRAF TAKSONOMI BAB BAKU: LITERASI & BAHASA INGGRIS
// ============================================================
//
// KENAPA BERKAS INI ADA
// Data produksi (Audit Materi 2026-10-08, 2.357 butir) menunjukkan masalah
// navigasi terbesar bukan identitas, melainkan PECAHNYA pohon materi:
//
//   Bahasa Inggris SMP/MTs :  90 butir tersebar di 81 nilai materi (rata 1,1)
//   Bahasa Inggris SMA/MA  : 122 butir tersebar di 43 nilai materi (rata 2,8)
//   Literasi SMA/MA        :  97 butir menumpuk di SATU nilai materi
//
// Dua arah kerusakan sekaligus: terlalu pecah (ratusan tombol berisi satu
// soal) dan terlalu kasar (satu tombol berisi hampir seratus soal). Keduanya
// membuat hierarki jenjang -> mapel -> materi tidak bisa dinavigasi tentor.
//
// Alat perapinya SUDAH ADA di repo ini: TaksonomiMateriPage (daftar bab baku)
// + PetakanMapelPage (memetakan nilai materi lama ke bab baku, dengan review,
// non-destruktif lewat materiAsliSebelumRapi). Yang belum ada hanyalah ISINYA
// untuk dua mapel ini.
//
// ⚠️ INI DRAF, BUKAN KEPUTUSAN KURIKULUM.
// Daftar bab di bawah DISUSUN DARI NILAI MATERI YANG BENAR-BENAR ADA DI DATA
// PRODUKSI (dikelompokkan dari 81/43/18 nilai), bukan dari tebakan. Tetapi
// pemilik keputusan kurikulum adalah owner & guru: setelah "Isi Otomatis",
// halaman Taksonomi Materi tetap memberi kesempatan mengedit sebelum dipakai,
// dan Petakan Mapel tetap mewajibkan review per kelompok sebelum menerapkan.
// ============================================================

const ELEMEN_LITERASI = ['Membaca dan Memirsa', 'Menulis', 'Berbicara dan Menyimak'];
const ELEMEN_BAHASA_INGGRIS = ['Menyimak', 'Membaca dan Memirsa', 'Berbicara dan Mempresentasikan', 'Menulis'];

export const SEED_LITERASI = [
  {
    kelas: 'Semua', jenjang: 'SD/MI', fase: 'B-C', elemen: ELEMEN_LITERASI,
    babBaku: [
      'Teks Eksposisi', 'Teks Laporan', 'Teks Narasi', 'Teks Deskripsi',
      'Teks Petunjuk', 'Teks Prosedur', 'Teks Biografi',
      'Kosakata', 'Ejaan dan Tanda Baca', 'Kalimat dan Konjungsi',
      'Kalimat Efektif', 'Menanggapi Isi Teks', 'Jenis dan Ciri Teks', 'Unsur Kebahasaan',
    ],
  },
  {
    kelas: 'Semua', jenjang: 'SMP/MTs', fase: 'D', elemen: ELEMEN_LITERASI,
    babBaku: [
      'Teks Eksposisi', 'Teks Narasi', 'Teks Narasi Fantasi', 'Teks Deskripsi',
      'Teks Prosedur', 'Teks Laporan', 'Teks Berita', 'Unsur Kebahasaan',
    ],
  },
  {
    // 97 butir menumpuk di satu nilai "Teks Eksposisi" — dipecah menjadi bab
    // yang benar-benar berbeda supaya tombolnya bermakna.
    kelas: 'Semua', jenjang: 'SMA/MA', fase: 'E-F', elemen: ELEMEN_LITERASI,
    babBaku: [
      'Teks Eksposisi', 'Teks Argumentasi', 'Teks Prosedur', 'Teks Laporan',
      'Teks Biografi', 'Puisi', 'Cerpen', 'Kebahasaan Teks', 'Pemahaman Tekstual',
    ],
  },
];

export const SEED_BAHASA_INGGRIS = [
  {
    // 81 nilai materi seperti "Recount Text: Detail Information",
    // "Greeting (Menyapa Pagi)", "Grammar: Have vs Has" dikelompokkan ke bab
    // genre/skill yang menjadi induknya.
    kelas: 'Semua', jenjang: 'SMP/MTs', fase: 'D', elemen: ELEMEN_BAHASA_INGGRIS,
    babBaku: [
      'Recount Text', 'Descriptive Text', 'Procedure Text', 'Narrative Text',
      'Report Text', 'Short Functional Text',
      'Expressions (greeting, apology, gratitude, leave-taking)',
      'Grammar: pronoun, determiner, quantifier', 'Grammar: tenses',
      'Vocabulary and spelling', 'Question words and preposition',
    ],
  },
  {
    kelas: 'Semua', jenjang: 'SMA/MA', fase: 'E-F', elemen: ELEMEN_BAHASA_INGGRIS,
    babBaku: [
      'Narrative Text', 'Procedure Text', 'Report Text', 'Analytical Exposition',
      'Discussion Text', 'Short Functional Text',
      'Reading skills (main idea, inference, reference, purpose)',
      'Grammar: tenses and passive voice', 'Vocabulary and figurative meaning',
    ],
  },
];

/** Semua draf taksonomi tambahan, siap digabung ke SEMUA_SEED halaman. */
export const SEED_TAMBAHAN = {
  Literasi: SEED_LITERASI,
  'Bahasa Inggris': SEED_BAHASA_INGGRIS,
};

/**
 * Periksa kewajaran sebuah seed — dipakai uji supaya typo tidak melahirkan
 * bab kembar yang justru menambah simpul.
 * @returns {string[]} daftar masalah, kosong bila wajar
 */
export function periksaSeed(seed = []) {
  const masalah = [];
  for (const entri of Array.isArray(seed) ? seed : []) {
    const bab = Array.isArray(entri?.babBaku) ? entri.babBaku : [];
    if (!bab.length) masalah.push(`entri ${entri?.jenjang || '?'} tidak punya babBaku`);
    const kecil = new Set();
    for (const b of bab) {
      const k = String(b).toLowerCase().trim();
      if (!k) masalah.push('ada bab kosong');
      if (kecil.has(k)) masalah.push(`bab kembar: "${b}"`);
      kecil.add(k);
    }
    if (!entri?.jenjang) masalah.push('entri tanpa jenjang');
    if (!entri?.kelas) masalah.push('entri tanpa kelas');
  }
  return masalah;
}

export default { SEED_LITERASI, SEED_BAHASA_INGGRIS, SEED_TAMBAHAN, periksaSeed };
