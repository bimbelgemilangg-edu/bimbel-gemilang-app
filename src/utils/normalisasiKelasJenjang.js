// src/utils/normalisasiKelasJenjang.js
// ============================================================
// SUMBER KEBENARAN BAKU: KELAS & JENJANG SISWA
// Mencegah bug admin/pendaftar menulis kelas bebas atau jenjang
// tidak sinkron dengan kelas (mis. kelas "9 SMP" tapi jenjang "SD").
// ============================================================

export const DAFTAR_KELAS_PER_JENJANG = {
  SD: ['1 SD', '2 SD', '3 SD', '4 SD', '5 SD', '6 SD'],
  SMP: ['7 SMP', '8 SMP', '9 SMP'],
  SMA: ['10 SMA', '11 SMA', '12 SMA', 'Alumni'],
  English: ['English Kids', 'English Teen', 'English Adult', 'Umum'],
};

export const SEMUA_KELAS_REGULER = [
  ...DAFTAR_KELAS_PER_JENJANG.SD,
  ...DAFTAR_KELAS_PER_JENJANG.SMP,
  ...DAFTAR_KELAS_PER_JENJANG.SMA,
];

/**
 * Menurunkan jenjang baku ('SD' | 'SMP' | 'SMA' | 'English') dari string kelas.
 */
export function jenjangDariKelas(kelasStr = '', programType = '') {
  const prog = String(programType || '').trim().toLowerCase();
  if (prog === 'english' || prog.includes('english')) return 'English';

  const raw = String(kelasStr || '').trim().toUpperCase();
  if (!raw) return '';

  if (/\b(ENGLISH|TOEFL|IELTS|KURSUS)\b/.test(raw)) return 'English';
  if (/\b(ALUMNI|GAP\s*YEAR|GAPYEAR|UTBK|SNBT)\b/.test(raw)) return 'SMA';
  if (/\b(SMA|SMAN|SMK|SMKN|MA|MAN|10|11|12|X|XI|XII)\b/.test(raw)) return 'SMA';
  if (/\b(SMP|SMPN|MTS|MTSN|7|8|9|VII|VIII|IX)\b/.test(raw)) return 'SMP';
  if (/\b(SD|SDN|MI|MIN|1|2|3|4|5|6|I|II|III|IV|V|VI)\b/.test(raw)) return 'SD';

  return '';
}

/**
 * Mengubah input kelas bebas/lama menjadi string kelas baku (mis. "9 SMP", "12 SMA", "6 SD").
 * Mengembalikan string kosong jika tidak bisa dipetakan dengan pasti.
 */
export function normalkanStringKelas(kelasInput = '', jenjangInput = '') {
  const raw = String(kelasInput || '').trim();
  const jen = String(jenjangInput || '').trim().toUpperCase();
  const up = raw.toUpperCase();

  if (/\b(ENGLISH\s*KIDS)\b/.test(up)) return 'English Kids';
  if (/\b(ENGLISH\s*TEEN)\b/.test(up)) return 'English Teen';
  if (/\b(ENGLISH\s*ADULT)\b/.test(up)) return 'English Adult';
  if (/\b(ALUMNI|GAP\s*YEAR|GAPYEAR)\b/.test(up)) return 'Alumni';

  // Ekstrak angka kelas 1..12 atau Romawi
  let angka = null;
  const mNum = /\b(1[0-2]|[1-9])\b/.exec(up);
  if (mNum) {
    angka = parseInt(mNum[1], 10);
  } else {
    const romanMap = {
      XII: 12, XI: 11, X: 10,
      IX: 9, VIII: 8, VII: 7,
      VI: 6, V: 5, IV: 4, III: 3, II: 2, I: 1,
    };
    for (const [rom, val] of Object.entries(romanMap)) {
      if (new RegExp(`\\b${rom}\\b`).test(up)) {
        angka = val;
        break;
      }
    }
  }

  // Jika ada nama sekolah seperti "SMPN 6" tanpa kata "kelas", hati-hati:
  // angka 1-6 pada string yang mengandung SMP/SMA adalah nomor sekolah, BUKAN kelas!
  const isSmpHint = /\b(SMP|SMPN|MTS|MTSN)\b/.test(up) || jen === 'SMP';
  const isSmaHint = /\b(SMA|SMAN|SMK|SMKN|MA|MAN)\b/.test(up) || jen === 'SMA';
  const isSdHint = /\b(SD|SDN|MI|MIN)\b/.test(up) || jen === 'SD';

  if (angka !== null) {
    if (angka >= 10 && angka <= 12) return `${angka} SMA`;
    if (angka >= 7 && angka <= 9) return `${angka} SMP`;
    if (angka >= 1 && angka <= 6) {
      // Hanya valid sebagai SD jika bukan SMP/SMA
      if (!isSmpHint && !isSmaHint) return `${angka} SD`;
    }
  }

  // Jika sudah persis salah satu kelas baku
  if (SEMUA_KELAS_REGULER.includes(raw)) return raw;
  if (isSdHint && angka >= 1 && angka <= 6) return `${angka} SD`;

  return '';
}

/**
 * Menyelaraskan { kelasSekolah, kelas, jenjang } dari dokumen siswa atau form.
 * Memastikan tidak ada lagi ketidaksinkronan antara kelasSekolah dan jenjang.
 */
export function normalisasiKelasDanJenjang({
  kelasSekolah = '',
  kelas = '',
  jenjang = '',
  programType = '',
  kategori = '',
} = {}) {
  const prog = String(programType || kategori || '').trim();
  if (prog.toLowerCase() === 'english' || String(jenjang).toLowerCase() === 'english') {
    const kNorm = normalkanStringKelas(kelasSekolah || kelas, 'English') || (kelasSekolah || 'Umum');
    return {
      jenjang: 'English',
      kelasSekolah: kNorm,
      kelas: kNorm,
    };
  }

  // Prioritaskan kelasSekolah, lalu kelas
  const kelasKandidat = normalkanStringKelas(kelasSekolah, jenjang) || normalkanStringKelas(kelas, jenjang);
  const jenjangHasil =
    jenjangDariKelas(kelasKandidat, prog) ||
    jenjangDariKelas(kelasSekolah, prog) ||
    jenjangDariKelas(kelas, prog) ||
    (['SD', 'SMP', 'SMA'].includes(String(jenjang || '').trim().toUpperCase())
      ? String(jenjang).trim().toUpperCase()
      : '');

  const kelasFinal = kelasKandidat || String(kelasSekolah || kelas || '').trim();

  return {
    jenjang: jenjangHasil,
    kelasSekolah: kelasFinal,
    kelas: kelasFinal,
  };
}

export default {
  DAFTAR_KELAS_PER_JENJANG,
  SEMUA_KELAS_REGULER,
  jenjangDariKelas,
  normalkanStringKelas,
  normalisasiKelasDanJenjang,
};
