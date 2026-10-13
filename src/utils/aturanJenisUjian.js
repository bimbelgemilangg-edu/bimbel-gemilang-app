// src/utils/aturanJenisUjian.js
// ============================================================
// KEPUTUSAN OWNER 2026-10-13 ("rombak filter aneh"): untuk jenis ujian
// TKA/UTBK, admin TIDAK LAGI mengisi jenjang kelas manualmente. JENIS
// UJIAN menentukan semuanya, dan modul ini satu-satunya tempat
// penurunan aturan itu (murni & teruji, jadi tidak bisa bocor/hilang
// saat merge seperti pagar-pagar sebelumnya):
//
//   TKA       -> peserta  = kelas akhir jenjang (SD 6, SMP 9, SMA/SMK 12),
//                materi   = BANK SOAL SATU JENJANG PENUH; AI memilih sesuai
//                           CP TKA resmi per mapel, TANPA menyaring per kelas
//                           (prompt AI sengaja tidak menyebut rentang kelas),
//   SNBT/UTBK -> peserta  = kelas 12, materi = bank soal SMA penuh (7 subtes),
//   Reguler   -> ulangan berjalan: peserta & materi SATU kelas yang sama.
//
// SEBELUMNYA form punya dua dropdown ("Cakupan materi bank" & "Sasaran
// kelas siswa") yang harus diisi konsisten oleh manusia — dan manusia
// keliru: paket lahir ber-sasaran "Semua" lalu tak terlihat/salah sasaran
// (insiden identitas 2026-10-10/12). Kini dropdown itu hanya ada untuk
// mode Reguler; mode TKA/UTBK menampilkan ringkasan otomatis baca-saja.
// ============================================================

/** Kelas peserta resmi ujian akhir jenjang (Pusmendik: TKA diikuti kelas akhir). */
export const KELAS_AKHIR_JENJANG = { SD: '6', SMP: '9', SMA: '12', SMK: '12' };

/** Pilihan yang ditampilkan form admin (nilai = tersimpan di template.jenisUjian). */
export const PILIHAN_JENIS_UJIAN = [
  { nilai: 'TKA', label: 'TKA — Tes Kemampuan Akademik (peserta & materi otomatis)' },
  { nilai: 'Reguler', label: 'Reguler / ulangan berjalan (satu kelas)' },
  { nilai: 'SNBT/UTBK', label: 'SNBT / UTBK (kelas 12, materi SMA penuh)' },
];

const kunciJenjang = (j) => {
  const t = String(j || '').toUpperCase();
  if (t.includes('SMK')) return 'SMK';
  if (t.includes('SMP') || t.includes('MTS')) return 'SMP';
  if (t.includes('SMA') || /(^|[^A-Z])MA([^A-Z]|$)/.test(t)) return 'SMA';
  if (t.includes('SD') || t.includes('MI')) return 'SD';
  return '';
};

/**
 * Jenis ujian kanonik sebuah template. Template warisan (sebelum
 * 2026-10-13) tidak punya field jenisUjian; NAMA adalah petunjuk paling
 * jujur ("Try Out TKA SD (Sabtu)", "Try Out UTBK Gemilang (Sabtu)").
 * @returns {'TKA'|'Reguler'|'SNBT/UTBK'}
 */
export function jenisUjianBaku(template = {}) {
  const v = String(template.jenisUjian || '').trim();
  if (v === 'TKA' || v === 'Reguler' || v === 'SNBT/UTBK') return v;
  const n = String(template.nama || '').toUpperCase();
  if (n.includes('UTBK') || n.includes('SNBT')) return 'SNBT/UTBK';
  if (n.includes('TKA')) return 'TKA';
  return 'Reguler';
}

/**
 * Penurunan lengkap aturan satu template.
 * @returns {{jenisUjian:string, kelasCakupan:string, targetKelas:string,
 *   pesertaTeks:string, materiTeks:string, otomatis:boolean}}
 *   `otomatis:true` berarti peserta & materi ditentukan jenis ujian
 *   (form menyembunyikan dropdown kelas); `false` berarti admin memilih kelas.
 */
export function aturanJenisUjian(template = {}) {
  const jenis = jenisUjianBaku(template);
  const jenjang = kunciJenjang(template.jenjang);
  if (jenis === 'TKA' && jenjang) {
    const akhir = KELAS_AKHIR_JENJANG[jenjang];
    return {
      jenisUjian: jenis,
      kelasCakupan: '',
      targetKelas: akhir,
      pesertaTeks: `Kelas ${akhir} ${jenjang} — otomatis (peserta TKA adalah kelas akhir jenjang)`,
      materiTeks: `Bank soal ${jenjang} SELURUHNYA; AI memilih sesuai CP TKA per mapel, tanpa saring per kelas`,
      otomatis: true,
    };
  }
  if (jenis === 'SNBT/UTBK') {
    return {
      jenisUjian: jenis,
      kelasCakupan: '',
      targetKelas: '12',
      pesertaTeks: 'Kelas 12 — otomatis (peserta UTBK/SNBT)',
      materiTeks: 'Bank soal SMA SELURUHNYA (7 subtes UTBK)',
      otomatis: true,
    };
  }
  const k = String(template.targetKelas || template.kelas || '').trim();
  const spesifik = k && !/^(semua|all)$/i.test(k) ? k : '';
  return {
    jenisUjian: 'Reguler',
    kelasCakupan: spesifik,
    targetKelas: spesifik,
    pesertaTeks: spesifik ? `Kelas ${spesifik}` : 'Kelas belum diisi (pagar identitas akan menolak)',
    materiTeks: spesifik ? `Bank soal kelas ${spesifik} saja` : '—',
    otomatis: false,
  };
}

/**
 * Template dengan aturan jenis ujian SUDAH DITERAPKAN (kelas & targetKelas
 * ditimpa untuk mode otomatis). Dipanggil mesin SEBELUM pagar identitas &
 * penyusunan soal, sehingga template warisan ber-sasaran "Semua" yang
 * sebenarnya TKA tidak lagi melahirkan paket salah sasaran — dan form
 * menyimpan nilai yang sama persis dengan yang dipakai mesin.
 */
export function terapkanJenisUjian(template = {}) {
  const a = aturanJenisUjian(template);
  if (!a.otomatis) return { ...template, jenisUjian: a.jenisUjian };
  return {
    ...template,
    jenisUjian: a.jenisUjian,
    kelas: a.kelasCakupan,
    targetKelas: a.targetKelas,
  };
}

export default {
  KELAS_AKHIR_JENJANG, PILIHAN_JENIS_UJIAN, jenisUjianBaku, aturanJenisUjian, terapkanJenisUjian,
};
