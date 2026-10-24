// src/utils/standarTka2026.js
// ============================================================
// STRUKTUR RESMI TKA 2026 sebagai acuan try out Gemilang.
//
// 🔥 PRINSIP BERKAS INI (permintaan owner 2026-10-24): "sesuai standar
// nasional terbaru secara objektif dan tidak mengarang". Maka SETIAP angka
// di bawah membawa field `sumber` yang menyebut siapa yang menerbitkannya.
// Bila sumber saling bertentangan, keduanya ditulis dan nilai yang dipakai
// adalah yang paling baru/resmi -- BUKAN dipilih diam-diam. Apa yang TIDAK
// diterbitkan terbuka (mis. batas kategori Baik/Memadai/Kurang, kalibrasi
// IRT) TIDAK ADA di berkas ini sama sekali.
//
// SUMBER YANG DIPAKAI:
//   [PUSMENDIK]  pusmendik.kemendikdasmen.go.id/tka/ -- mata uji per jenjang:
//                SD/MI & SMP/MTs: Bahasa Indonesia dan Matematika;
//                SMA/MA/SMK/MAK: Bahasa Indonesia, Matematika, Bahasa Inggris
//                (+ mapel pilihan), dan bentuk soal resmi PG & PGK-MCMA.
//   [RUMAH PENDIDIKAN] pusatinformasi.rumahpendidikan.kemendikdasmen.go.id --
//                murid SMA mengambil 2 mata pelajaran pilihan.
//   [KEPMEN 56/2026] Kepmendikdasmen No. 56 Tahun 2026 -- skala SMA/SMK
//                200-800 (2 desimal), SD/SMP 0-100, predikat Istimewa
//                >= 725,00 (lihat skorSkalaTka.js).
//   [KAPAP 2026] pernyataan Kepala Pusat Asesmen Pendidikan (2026): alokasi
//                75 menit SMA adalah untuk 25 butir; pedoman sebelumnya
//                30 butir -- keduanya dicatat, yang dipakai 25.
//   [KOMPAS 2026] Kompas Skola 07-09-2026: mapel pilihan SMA durasi 60 menit,
//                25 soal; mapel wajib diperpanjang 60 -> 75 menit.
//   [PEDOMAN SD/SMP 2026] pedoman TKA 2026 SD/SMP: 75 menit Matematika
//                (30 soal, sebagian soal pusat dan daerah) + survei karakter.
// ============================================================

/** Menit survei karakter/l lingkungan belajar pada pelaksanaan resmi SD/SMP. */
export const SURVEI_SD_SMP_MENIT = 20;

/** Mata uji WAJIB per jenjang [PUSMENDIK]. */
export const MAPEL_WAJIB_TKA = {
  SD: ['Matematika', 'Bahasa Indonesia'],
  SMP: ['Matematika', 'Bahasa Indonesia'],
  SMA: ['Matematika', 'Bahasa Indonesia', 'Bahasa Inggris'],
};

/** Jumlah mapel PILIHAN yang diambil murid SMA/SMK [RUMAH PENDIDIKAN]. */
export const JUMLAH_MAPEL_PILIHAN_SMA = 2;

/**
 * Struktur sesi per kategori mapel. `sumber` wajib dibaca bersama angkanya.
 */
export const SESI_TKA = {
  SMA: {
    wajib: {
      butir: 25,
      durasiMenit: 75,
      sumber:
        '[KAPAP 2026] 75 menit untuk 25 butir (pernyataan Kepala Pusat Asesmen '
        + 'Pendidikan, 2026); [KOMPAS 2026] wajib diperpanjang 60->75 menit. '
        + 'CATATAN: pedoman sebelumnya menyebut 30 butir -- tidak dipakai lagi.',
    },
    pilihan: {
      butir: 25,
      durasiMenit: 60,
      sumber: '[KOMPAS 2026] mapel pilihan: durasi 60 menit, 25 soal.',
    },
  },
  SMP: {
    wajib: {
      butir: 30,
      durasiMenit: 75,
      sumber:
        '[PEDOMAN SD/SMP 2026] 75 menit per mata uji (Matematika 30 soal, '
        + 'sebagian soal pusat dan daerah).',
    },
  },
  SD: {
    wajib: {
      butir: 30,
      durasiMenit: 75,
      sumber:
        '[PEDOMAN SD/SMP 2026] 75 menit per mata uji (Matematika 30 soal, '
        + 'sebagian soal pusat dan daerah).',
    },
  },
};

/**
 * Bentuk soal resmi TKA [PUSMENDIK, lihat contoh soal kerangka asesmen]
 * dipetakan ke tipe butir di Bank Soal Gemilang.
 */
export const BENTUK_SOAL_RESMI = [
  { kode: 'PG', tipe: 'pg_sederhana', keterangan: 'pilihan ganda satu jawaban' },
  { kode: 'PGK-MCMA', tipe: 'pg_kompleks', keterangan: 'pilihan ganda kompleks, jawaban benar lebih dari satu' },
];

const normJenjang = (j) => {
  const t = String(j ?? '').toUpperCase();
  if (t.includes('SMK') || t.includes('SMA') || t.includes('MA')) return 'SMA';
  if (t.includes('SMP') || t.includes('MTS')) return 'SMP';
  if (t.includes('SD') || t.includes('MI')) return 'SD';
  return null;
};

/**
 * Susun struktur try out yang SESUAI standar TKA 2026 untuk satu jenjang.
 * Tidak menebak: baris yang dikembalikan selalu membawa `sumber`.
 *
 * @param {string} jenjang 'SD' | 'SMP' | 'SMA' | 'SMK' | teks kelas berisi jenjang
 * @param {{mapelPilihan?: string[]}} [opsi] untuk SMA: mapel pilihan yang diambil
 *   (maksimal JUMLAH_MAPEL_PILIHAN_SMA; lebih dari itu dipotong, bukan ditolak).
 * @returns {Array<{mapel: string, kategori: 'wajib'|'pilihan', butir: number, durasiMenit: number, sumber: string}>}
 */
export function strukturTryoutTka(jenjang, opsi = {}) {
  const j = normJenjang(jenjang);
  if (!j) return [];
  const grup = SESI_TKA[j];
  const baris = (MAPEL_WAJIB_TKA[j] || []).map((mapel) => ({
    mapel, kategori: 'wajib', butir: grup.wajib.butir, durasiMenit: grup.wajib.durasiMenit, sumber: grup.wajib.sumber,
  }));
  if (j === 'SMA') {
    for (const mapel of (Array.isArray(opsi.mapelPilihan) ? opsi.mapelPilihan : []).slice(0, JUMLAH_MAPEL_PILIHAN_SMA)) {
      baris.push({
        mapel, kategori: 'pilihan', butir: grup.pilihan.butir, durasiMenit: grup.pilihan.durasiMenit, sumber: grup.pilihan.sumber,
      });
    }
  }
  return baris;
}

/** Total butir & menit (di luar survei) dari satu struktur. */
export function ringkasanStruktur(baris = []) {
  return baris.reduce(
    (a, b) => ({ totalButir: a.totalButir + b.butir, totalMenit: a.totalMenit + b.durasiMenit }),
    { totalButir: 0, totalMenit: 0 },
  );
}

/**
 * Bandingkan isi keranjang admin dengan struktur resmi: per mapel resmi,
 * berapa butir yang sudah masuk keranjang vs butir resmi. Selisih dilaporkan,
 * BUKAN ditebak perbaikannya.
 *
 * @param {Array<{mapel?: string, mataPelajaran?: string}>} isiKeranjang
 * @param {string} jenjang
 * @param {{mapelPilihan?: string[]}} [opsi]
 */
export function bandingkanDenganStandar(isiKeranjang, jenjang, opsi = {}) {
  const norm = (s) => String(s ?? '').toLowerCase().trim();
  const hitung = new Map();
  for (const s of Array.isArray(isiKeranjang) ? isiKeranjang : []) {
    const k = norm(s?.mapel || s?.mataPelajaran);
    hitung.set(k, (hitung.get(k) || 0) + 1);
  }
  return strukturTryoutTka(jenjang, opsi).map((b) => ({
    ...b,
    isiKeranjang: hitung.get(norm(b.mapel)) || 0,
  }));
}

export default {
  SURVEI_SD_SMP_MENIT, MAPEL_WAJIB_TKA, JUMLAH_MAPEL_PILIHAN_SMA, SESI_TKA,
  BENTUK_SOAL_RESMI, strukturTryoutTka, ringkasanStruktur, bandingkanDenganStandar,
};
