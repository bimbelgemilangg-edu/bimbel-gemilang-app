// src/data/katalogBukuPdf.js
// ============================================================
// KATALOG BUKU PDF GEMILANG (20 Okt 2026): buku konvensional berupa
// PDF siap baca (flipbook) — siswa suka buku konvensional (review
// owner), materi tidak lagi dipaksa jadi modul interaktif.
// rangePembahasan = halaman kunci & pembahasan: DISSEMBUNYIKAN dari
// mode siswa, terbuka di mode guru. Berkas fisik hidup di storage
// publik Supabase (diunggah asisten 20 Okt, 16,4 MB).
// ============================================================

export const KATALOG_BUKU_PDF = [
  {
    id: 'gemilang-mtk-smp-9-sem1',
    judul: 'Master Matematika SMP/MTs Kelas IX — Semester 1',
    mapel: 'Matematika',
    jenjang: 'SMP/MTs',
    kelas: 9,
    semester: 1,
    kurikulum: 'Kurikulum Merdeka (Fase D)',
    url: 'https://hqoasblnrsijbflupoir.supabase.co/storage/v1/object/public/materi-bimbel/buku-pdf/gemilang-book-matematika-smp-9-semester-1.pdf',
    totalHalaman: 81,
    rangePembahasan: [69, 81],
    warna: '#f97316',
    emoji: '📙',
    keterangan: 'Materi lengkap, contoh soal, paket latihan bertingkat; kunci & pembahasan akhir = pegangan guru.',
  },
];

export const bukuPdfDariId = (id = '') => KATALOG_BUKU_PDF.find((b) => b.id === String(id)) || null;

export default { KATALOG_BUKU_PDF, bukuPdfDariId };
