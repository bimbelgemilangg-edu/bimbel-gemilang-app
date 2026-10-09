// src/utils/paketSoal.js
// ============================================================
// MESIN PAKET SOAL SISWA — status, kode, penomoran, sanitizer,
// keselarasan materi, dan catatan Buku Progress. SEMUA FUNGSI PURE.
// ============================================================
//
// Arahan owner 2026-10-09 (chat): sistem paket soal untuk KELAS REGULER —
//   * paket digantung ke jenjang + mapel + BAB/materi;
//   * NOMOR paket ditentukan SISTEM (urut per bab), tentor mengisi isinya;
//   * tiap paket punya KODE PENDEK (contoh owner: "paket 1 kode 2W3Q");
//   * isi paket = soal + materi yang SINKRON (paket tidak boleh berubah
//     diam-diam bila bank berubah — tampilkan pemberitahuan, tentor
//     memutuskan: perbarui = versi baru);
//   * siswa MELIHAT soal satu per satu (bukan CBT), mengerjakan di Buku
//     Progress, boleh mencetak bila diizinkan (watermark wajib);
//   * tentor mencatat progres per siswa per NOMOR ("mengerjakan nomor
//     1-15, kurang 16-20") di form terpisah / lembar progres.
//
// KEPUTUSAN ARSITEKTUR (hasil audit rules, lihat docs/RUNBOOK-KEAMANAN.md):
// Firestore Rules TIDAK BISA menyembunyikan FIELD per peran. Maka kunci
// jawaban dipisahkan lewat KOLEKSI, bukan lewat saringan tampilan:
//
//   paket_soal/{id}          dokumen LENGKAP (ada kunci) — tentor/admin saja
//   paket_soal_siswa/{id}    NASKAH SISWA hasil `bangunNaskahSiswa()` —
//                            TANPA kunci/pembahasan sama sekali; hanya ini
//                            yang dibaca halaman siswa. Id dokumen SAMA
//                            dengan induknya supaya mudah dirujuk.
//   paket_soal_siswa/{id}/progress/{studentId}
//                            klaim siswa + catatan pemeriksaan tentor.
//
// Bagian rules untuk ketiganya sudah disiapkan di
// firebase/rules/tahap-3-final.rules (Tahap 3 = begitu Firebase Auth ada,
// penegakan terjadi di DATABASE, bukan cuma di UI).
//
// KEJUJURAN YANG DIKUNCI OLEH TEST (tests/paketSoal.test.mjs):
//   1. naskah siswa tidak pernah memuat kunci dalam dialek APA PUN
//      (kunciJawaban, kunci, jawaban, jawabanEkuivalen, pembahasan, baris
//      benar/salah `.jawaban/.kunci/.value`, bendera `benar` di opsi);
//   2. glif ☑/☐ warisan impor ikut dibersihkan (pakai bersihkanGlifKunci);
//   3. paket terbit tidak bisa diedit isinya — perubahan = versi baru;
//   4. terbit tanpa target (kelas ATAU siswa) DITOLAK dengan alasan;
//   5. status "selesai" hanya sah bila tentor yang memasang — klaim siswa
//      SELALU dilabeli "menunggu pemeriksaan", tidak pernah "selesai".
// ============================================================

import { bersihkanTeksOpsi, bawaPenandaKunciOpsi } from './bersihkanGlifKunci.js';

// ------------------------------------------------------------
// STATUS & TRANSISI
// ------------------------------------------------------------

export const STATUS_PAKET_SOAL = {
  /** Baru dibuat tentor, privat, belum lengkap/belum dikirim. */
  DRAF: 'draf',
  /** Lengkap dan lolos `putusanTerbitkanPaket`, SIAP ditugaskan. */
  SIAP: 'siap',
  /** Ditugaskan — satu-satunya status yang boleh dilihat siswa. */
  TERBIT: 'terbit',
  /** Ditutup/diarsipkan — tidak muncul lagi di daftar siswa. */
  DITUTUP: 'ditutup',
};

export const LABEL_STATUS_PAKET_SOAL = {
  draf: 'Draf (privat)',
  siap: 'Siap ditugaskan',
  terbit: 'Ditugaskan / Terbit',
  ditutup: 'Ditutup / Diarsipkan',
};

/**
 * DAFTAR PUTIH — koleksi ini baru, tidak ada dokumen warisan tanpa `status`
 * seperti di tryout_paket, jadi gagal-ke-arah-aman: apa pun selain 'terbit'
 * dianggap belum boleh dilihat siswa (termasuk '' / null / undefined).
 */
export function paketSudahTerbit(status) {
  return String(status || '').trim() === STATUS_PAKET_SOAL.TERBIT;
}

const TRANSISI = {
  draf: new Set(['siap', 'ditutup']),
  siap: new Set(['draf', 'terbit', 'ditutup']),
  terbit: new Set(['ditutup']),
  ditutup: new Set([]), // arsip final; lanjutkan = versi baru
};

/** Transisi status yang sah. `dari === ke` dianggap bukan transisi. */
export function transisiStatusPaketSoal(dari, ke) {
  const d = String(dari || '').trim();
  const k = String(ke || '').trim();
  if (!d || !k || d === k) return false;
  return (TRANSISI[d] || new Set()).has(k);
}

/** Isi paket (soal, judul, petunjuk) hanya bisa diubah saat belum terbit. */
export function bolehEditIsiPaket(status) {
  const s = String(status || '').trim();
  return s === STATUS_PAKET_SOAL.DRAF || s === STATUS_PAKET_SOAL.SIAP;
}

// ------------------------------------------------------------
// KODE & PENOMORAN PAKET
// ------------------------------------------------------------

/** Tanpa 0/O/1/I/L — kode dibacakan lisan di kelas ("dua-W-tiga-Q"). */
export const ALFABET_KODE_PAKET = '23456789ABCDEFGHJKMNPQRSTUVWXYZ';
export const PANJANG_KODE_PAKET = 4;

/**
 * Kode pendek unik-ish. `rng` bisa disuntik (uji deterministik).
 * Keunikan lintas koleksi dicek halaman lewat query `where('kodePaket','==',k)`.
 */
export function buatKodePaket(rng = Math.random) {
  let kode = '';
  for (let i = 0; i < PANJANG_KODE_PAKET; i += 1) {
    const idx = Math.min(
      ALFABET_KODE_PAKET.length - 1,
      Math.max(0, Math.floor(Number(rng()) * ALFABET_KODE_PAKET.length)),
    );
    kode += ALFABET_KODE_PAKET[idx];
  }
  return kode;
}

export function kodePaketSah(kode) {
  const k = String(kode || '').trim().toUpperCase();
  return k.length === PANJANG_KODE_PAKET
    && [...k].every((c) => ALFABET_KODE_PAKET.includes(c));
}

/**
 * Kunci pengelompokan bab: paket dinomori urut PER (jenjang, mapel, materi).
 * Dinormalkan supaya "SMP" dan " smp " bukan dua bab berbeda.
 */
export function kunciBabPaket({ jenjang = '', mapel = '', materi = '' } = {}) {
  return [jenjang, mapel, materi]
    .map((s) => String(s || '').trim().toLowerCase())
    .join('|');
}

/** Nomor paket berikutnya dalam bab yang sama (1-based, lompatan dihormati). */
export function nomorPaketBerikutnya(paketDalamBab = []) {
  let maks = 0;
  for (const p of Array.isArray(paketDalamBab) ? paketDalamBab : []) {
    const n = Number(p?.nomorPaket);
    if (Number.isFinite(n) && n > maks) maks = n;
  }
  return maks + 1;
}

/**
 * Usulan judul sesuai contoh owner/spec:
 * "SMP 8 — Bahasa Inggris — Descriptive Text — Paket 05".
 * Bagian kosong dihilangkan (tidak pernah ada "— —").
 */
export function usulanJudulPaket({ jenjang = '', mapel = '', materi = '', nomor = 1 } = {}) {
  const bagian = [jenjang, mapel, materi]
    .map((s) => String(s || '').trim())
    .filter(Boolean);
  bagian.push(`Paket ${String(Math.max(1, Number(nomor) || 1)).padStart(2, '0')}`);
  return bagian.join(' — ');
}

/** Label ringkas untuk kartu/daftar: "Paket 05 · 2W3Q". */
export function labelPaketSingkat({ nomorPaket, kodePaket } = {}) {
  const n = Number(nomorPaket) || 0;
  const k = String(kodePaket || '').trim().toUpperCase();
  const kiri = n > 0 ? `Paket ${String(n).padStart(2, '0')}` : 'Paket';
  return k ? `${kiri} · ${k}` : kiri;
}

// ------------------------------------------------------------
// SANITIZER — salinan soal untuk siswa, TANPA kunci dalam dialek apa pun
// ------------------------------------------------------------

/** Field pembawa kunci di tingkat butir (semua dialek yang dikenal repo). */
const FIELD_KUNCI_BUTIR = [
  'kunciJawaban', 'kunci_jawaban', 'kunci', 'kunciJawabanAsli',
  'jawaban', 'jawabanBenar', 'jawaban_benar', 'jawabanEkuivalen',
  'pembahasan', 'pembahasan_asal', 'pembahasanAsal',
  'answerKey', 'correctAnswer', 'correctIndex',
];

/** Field pembawa kunci di baris benar/salah & pasangan menjodohkan. */
const FIELD_KUNCI_BARIS = ['jawaban', 'kunci', 'value', 'benar', 'isCorrect'];

/** Field pembawa kunci di dalam opsi (bendera, bukan teks). */
const FIELD_KUNCI_OPSI = ['benar', 'isCorrect', 'kunci', 'jawaban'];

/** Array di dalam butir yang elemennya bisa membawa kunci per baris. */
const FIELD_BARIS = ['pernyataan', 'tabelBenarSalah', 'tabel_benar_salah', 'pasangan'];

function bersihkanBaris(baris) {
  if (!baris || typeof baris !== 'object') return baris;
  if (Array.isArray(baris)) return baris.map(bersihkanBaris);
  const salinan = { ...baris };
  for (const f of FIELD_KUNCI_BARIS) delete salinan[f];
  if (typeof salinan.teks === 'string') salinan.teks = bersihkanTeksOpsi(salinan.teks);
  return salinan;
}

function bersihkanOpsi(opsi) {
  if (typeof opsi === 'string') return bersihkanTeksOpsi(opsi);
  if (!opsi || typeof opsi !== 'object') return opsi;
  const salinan = { ...opsi };
  for (const f of FIELD_KUNCI_OPSI) delete salinan[f];
  if (typeof salinan.teks === 'string') salinan.teks = bersihkanTeksOpsi(salinan.teks);
  return salinan;
}

/**
 * Salinan SATU butir yang aman dibaca siswa:
 * kunci/pembahasan dihapus di semua dialek, baris benar/salah kehilangan
 * `.jawaban/.kunci/.value` (teks baris tetap), opsi dibersihkan dari glif
 * ☑/☐ dan bendera `benar`. Objek asal TIDAK diubah (salinan dangkal per level).
 */
export function bersihSoalUntukSiswa(soal) {
  if (!soal || typeof soal !== 'object') return null;
  const salinan = { ...soal };
  for (const f of FIELD_KUNCI_BUTIR) delete salinan[f];
  for (const f of FIELD_BARIS) {
    if (Array.isArray(salinan[f])) salinan[f] = salinan[f].map(bersihkanBaris);
  }
  if (Array.isArray(salinan.opsiJawaban)) salinan.opsiJawaban = salinan.opsiJawaban.map(bersihkanOpsi);
  return salinan;
}

export function daftarSoalUntukSiswa(daftar = []) {
  return (Array.isArray(daftar) ? daftar : [])
    .map(bersihSoalUntukSiswa)
    .filter(Boolean);
}

/**
 * Pemeriksaan dalam (untuk test & pagar halaman): daftar SEMUA jejak kunci
 * yang masih menempel di sebuah butir. [] berarti bersih.
 */
export function jejakKunciDiSoalSiswa(soal, jejak = [], awalan = '') {
  if (!soal || typeof soal !== 'object') return jejak;
  if (Array.isArray(soal)) {
    soal.forEach((item, i) => jejakKunciDiSoalSiswa(item, jejak, `${awalan}[${i}]`));
    return jejak;
  }
  for (const [k, v] of Object.entries(soal)) {
    const path = awalan ? `${awalan}.${k}` : k;
    const kunciBaris = FIELD_KUNCI_BARIS.includes(k);
    const kunciButir = FIELD_KUNCI_BUTIR.includes(k);
    // `opsiJawaban`/`kunciBabPaket`-like: nama field berisi kata 'kunci/jawaban'
    // yang memang sah (bukan pembawa kunci) dikecualikan eksplisit.
    const sah = k === 'opsiJawaban';
    if (!sah && (kunciButir || kunciBaris) && v !== undefined && v !== null && v !== '') {
      jejak.push(path);
    }
    if (typeof v === 'string' && k === 'teks' && bawaPenandaKunciOpsi(v)) jejak.push(`${path}(glif)`);
    if (v && typeof v === 'object') jejakKunciDiSoalSiswa(v, jejak, path);
  }
  return jejak;
}

export function soalSiswaBebasKunci(soal) {
  return jejakKunciDiSoalSiswa(soal).length === 0;
}

// ------------------------------------------------------------
// NASKAH SISWA (koleksi paket_soal_siswa) & PENERBITAN
// ------------------------------------------------------------

/**
 * Keputusan menerbitkan. `alasan` = pembatal (merah, mematikan tombol),
 * `peringatan` = kuning, tidak menghalangi — pola putusanKirimDraf.
 */
export function putusanTerbitkanPaket(paket = {}) {
  const alasan = [];
  const peringatan = [];
  const judul = String(paket.judul || '').trim();
  const soal = Array.isArray(paket.daftarSoal) ? paket.daftarSoal : [];
  const targetSiswa = Array.isArray(paket.targetSiswa) ? paket.targetSiswa.filter(Boolean) : [];
  const targetKelas = Array.isArray(paket.targetKelas) ? paket.targetKelas.filter(Boolean) : [];

  if (!judul) alasan.push('Paket belum punya nama/judul.');
  if (soal.length === 0) alasan.push('Paket belum berisi soal.');
  if (!targetSiswa.length && !targetKelas.length) {
    alasan.push('Belum ada sasaran: pilih minimal satu kelas atau satu siswa.');
  }
  if (soal.some((s) => !s || typeof s !== 'object')) {
    alasan.push('Ada butir soal yang rusak (bukan objek) — buang atau ganti dulu.');
  }

  if (paket.izinkanCetakSiswa === false) {
    peringatan.push('Cetak siswa dimatikan — siswa hanya bisa melihat di layar.');
  }
  if (!paket.batasWaktu) peringatan.push('Tidak ada batas waktu; paket terbuka sampai ditutup manual.');
  const mapel = [...new Set(soal.map((s) => String(s?.identitas?.mapel || s?.mapel || s?.mataPelajaran || '').trim()).filter(Boolean))];
  if (mapel.length > 1) peringatan.push(`Soal berasal dari ${mapel.length} mapel berbeda (${mapel.join(', ')}).`);

  return { boleh: alasan.length === 0, alasan, peringatan };
}

/** Payload draf baru (addDoc ke `paket_soal`). Tidak pernah auto-terbit. */
export function payloadDrafPaket({
  judul = '', jenjang = '', mapel = '', materi = '', materiId = null,
  nomorPaket = 1, kodePaket = '', petunjuk = '',
  targetKelas = [], targetSiswa = [],
  tanggalTugas = null, batasWaktu = null,
  izinkanCetakSiswa = true, daftarSoal = [],
  guru = {}, versiKe = 1, indukPaketId = null, sekarang = null,
} = {}) {
  const waktu = sekarang || new Date().toISOString();
  return {
    judul: String(judul).trim(),
    status: STATUS_PAKET_SOAL.DRAF,
    jenjang: String(jenjang).trim(),
    mapel: String(mapel).trim(),
    materi: String(materi).trim(),
    materiId: materiId || null,
    babKey: kunciBabPaket({ jenjang, mapel, materi }),
    nomorPaket: Number(nomorPaket) || 1,
    kodePaket: String(kodePaket).trim().toUpperCase(),
    petunjuk: String(petunjuk).trim(),
    targetKelas: Array.isArray(targetKelas) ? targetKelas.filter(Boolean).map(String) : [],
    targetSiswa: Array.isArray(targetSiswa) ? targetSiswa.filter(Boolean).map(String) : [],
    tanggalTugas: tanggalTugas || null,
    batasWaktu: batasWaktu || null,
    izinkanCetakSiswa: izinkanCetakSiswa !== false,
    daftarSoal: Array.isArray(daftarSoal) ? daftarSoal : [],
    totalSoal: Array.isArray(daftarSoal) ? daftarSoal.length : 0,
    versiKe: Number(versiKe) || 1,
    indukPaketId: indukPaketId || null,
    dibuatOleh: 'tentor',
    tentorId: guru?.id || guru?.uid || null,
    tentorNama: guru?.nama || '',
    riwayatStatus: [{
      status: STATUS_PAKET_SOAL.DRAF,
      oleh: guru?.nama || 'tentor',
      peran: 'tentor',
      pada: waktu,
      catatan: 'Draf paket dibuat',
    }],
    dibuatPada: waktu,
    diperbaruiPada: waktu,
    diterbitkanPada: null,
    ditutupPada: null,
  };
}

/**
 * Naskah siswa: dokumen `paket_soal_siswa/{idPaketYangSama}`.
 * HANYA ini yang dibaca halaman siswa — dan isinya sudah pasti bebas kunci.
 */
export function bangunNaskahSiswa(paket = {}, { sekarang = null } = {}) {
  const waktu = sekarang || new Date().toISOString();
  return {
    paketId: paket.id || null,
    judul: String(paket.judul || '').trim(),
    kodePaket: String(paket.kodePaket || '').trim().toUpperCase(),
    nomorPaket: Number(paket.nomorPaket) || 0,
    jenjang: String(paket.jenjang || '').trim(),
    mapel: String(paket.mapel || '').trim(),
    materi: String(paket.materi || '').trim(),
    petunjuk: String(paket.petunjuk || '').trim(),
    targetKelas: Array.isArray(paket.targetKelas) ? paket.targetKelas : [],
    targetSiswa: Array.isArray(paket.targetSiswa) ? paket.targetSiswa : [],
    tanggalTugas: paket.tanggalTugas || null,
    batasWaktu: paket.batasWaktu || null,
    izinkanCetakSiswa: paket.izinkanCetakSiswa !== false,
    daftarSoal: daftarSoalUntukSiswa(paket.daftarSoal),
    totalSoal: Array.isArray(paket.daftarSoal) ? paket.daftarSoal.length : 0,
    tentorNama: String(paket.tentorNama || '').trim(),
    versiKe: Number(paket.versiKe) || 1,
    status: STATUS_PAKET_SOAL.TERBIT,
    diterbitkanPada: waktu,
  };
}

/** Update dokumen paket saat terbit (naskah siswa ditulis terpisah). */
export function payloadTerbitDariDraf(paket = {}, { oleh = '', sekarang = null } = {}) {
  const putusan = putusanTerbitkanPaket(paket);
  if (!putusan.boleh) return { boleh: false, alasan: putusan.alasan, update: null };
  const waktu = sekarang || new Date().toISOString();
  return {
    boleh: true,
    alasan: [],
    update: {
      status: STATUS_PAKET_SOAL.TERBIT,
      diterbitkanPada: waktu,
      ditutupPada: null,
      diperbaruiPada: waktu,
      riwayatStatus: [
        ...(Array.isArray(paket.riwayatStatus) ? paket.riwayatStatus : []),
        {
          status: STATUS_PAKET_SOAL.TERBIT,
          oleh: oleh || paket.tentorNama || 'tentor',
          peran: 'tentor',
          pada: waktu,
          catatan: 'Paket ditugaskan ke siswa',
        },
      ],
    },
  };
}

/**
 * Perubahan paket terbit = VERSI BARU (draf), induknya tetap utuh sampai
// versi baru diterbitkan. Paket terbit tidak pernah berubah diam-diam.
 */
export function payloadVersiBaru(paket = {}, { guru = {}, sekarang = null } = {}) {
  const waktu = sekarang || new Date().toISOString();
  const draf = payloadDrafPaket({
    ...paket,
    guru: { id: guru?.id || paket.tentorId, nama: guru?.nama || paket.tentorNama },
    versiKe: (Number(paket.versiKe) || 1) + 1,
    indukPaketId: paket.id || paket.indukPaketId || null,
    sekarang: waktu,
  });
  draf.riwayatStatus = [{
    status: STATUS_PAKET_SOAL.DRAF,
    oleh: guru?.nama || paket.tentorNama || 'tentor',
    peran: 'tentor',
    pada: waktu,
    catatan: `Versi ${draf.versiKe} disalin dari paket ${paket.id || 'sebelumnya'}`,
  }];
  return draf;
}

/** Hak lihat sisi klien (penegakan sesungguhnya di rules Tahap 3). */
export function paketBolehDilihatSiswa(naskah, { studentId = '', kelasSekolah = '' } = {}) {
  if (!naskah || String(naskah.status) !== STATUS_PAKET_SOAL.TERBIT) return false;
  const id = String(studentId || '').trim();
  const kelas = String(kelasSekolah || '').trim();
  const kenaSiswa = id && Array.isArray(naskah.targetSiswa)
    && naskah.targetSiswa.map(String).includes(id);
  const kenaKelas = kelas && Array.isArray(naskah.targetKelas)
    && naskah.targetKelas.map(String).includes(kelas);
  return Boolean(kenaSiswa || kenaKelas);
}

// ------------------------------------------------------------
// SINKRONISASI MATERI ↔ PAKET (spec C: jangan diam-diam)
// ------------------------------------------------------------

/**
 * Membandingkan snapshot soal di paket dengan keadaan bank SEKARANG.
 * Mengembalikan fakta, bukan tindakan — keputusan (perbarui/versi baru/
 * biarkan) milik tentor. `daftarSoalBank`: butir bank (id + status).
 */
export function periksaSelarasMateri(paket = {}, daftarSoalBank = []) {
  const bank = new Map(
    (Array.isArray(daftarSoalBank) ? daftarSoalBank : [])
      .filter((s) => s && typeof s === 'object' && s.id)
      .map((s) => [String(s.id), s]),
  );
  const hilang = [];
  const nonaktif = [];
  for (const s of Array.isArray(paket.daftarSoal) ? paket.daftarSoal : []) {
    const id = String(s?.id || '').trim();
    if (!id) continue;
    if (!bank.has(id)) { hilang.push(id); continue; }
    const status = String(bank.get(id).status || '').trim();
    if (status && status !== 'aktif') nonaktif.push(id);
  }
  return {
    selaras: hilang.length === 0 && nonaktif.length === 0,
    hilang,
    nonaktif,
    totalDiperiksa: (Array.isArray(paket.daftarSoal) ? paket.daftarSoal : []).length,
  };
}

// ------------------------------------------------------------
// BUKU PROGRESS — klaim siswa vs verifikasi tentor (spec F)
// ------------------------------------------------------------

export const STATUS_PERIKSA = {
  BELUM: '',
  PERLU_PERBAIKAN: 'perlu_perbaikan',
  SUDAH_DIPERIKSA: 'sudah_diperiksa',
  SELESAI: 'selesai',
};

/**
 * Label jujur untuk kartu progres. Aturan owner: JANGAN menyatakan siswa
 * selesai bila belum diverifikasi — klaim saja selalu "menunggu pemeriksaan".
 * `selesai` HANYA dari statusPeriksa yang dipasang tentor.
 */
export function statusPeriksaSiswa(progress = null) {
  const p = progress || {};
  const sp = String(p.statusPeriksa || '').trim();
  if (sp === STATUS_PERIKSA.SELESAI) return { kode: 'selesai', label: 'Selesai ( diverifikasi tentor)', olehTentor: true };
  if (sp === STATUS_PERIKSA.SUDAH_DIPERIKSA) return { kode: 'sudah_diperiksa', label: 'Sudah diperiksa', olehTentor: true };
  if (sp === STATUS_PERIKSA.PERLU_PERBAIKAN) return { kode: 'perlu_perbaikan', label: 'Perlu perbaikan', olehTentor: true };
  if (p.klaimSelesaiPada) {
    return { kode: 'klaim', label: 'Siswa mengklaim sudah mengerjakan — menunggu pemeriksaan tentor', olehTentor: false };
  }
  return { kode: 'belum', label: 'Belum ada catatan', olehTentor: false };
}

/** "1-15, 18, 20" → [1,2,...,15,18,20]. Toleran spasi & urutan; buang rusak. */
export function uraiRentangNomor(teks) {
  const hasil = new Set();
  for (const potong of String(teks || '').split(/[,;]+/)) {
    const bagian = potong.trim();
    if (!bagian) continue;
    const m = bagian.match(/^(\d+)\s*[-–—]\s*(\d+)$/);
    if (m) {
      const a = parseInt(m[1], 10);
      const b = parseInt(m[2], 10);
      const [lo, hi] = a <= b ? [a, b] : [b, a];
      if (hi - lo > 10000) continue; // pagar rentang tak masuk akal
      for (let n = lo; n <= hi; n += 1) hasil.add(n);
      continue;
    }
    if (/^\d+$/.test(bagian)) hasil.add(parseInt(bagian, 10));
  }
  return [...hasil].sort((a, b) => a - b);
}

/** [1..15,18] → "1-15, 18" — bentuk yang diucapkan tentor di kelas. */
export function formatRentangNomor(angka = []) {
  const urut = [...new Set((Array.isArray(angka) ? angka : []).map(Number).filter((n) => Number.isInteger(n) && n > 0))].sort((a, b) => a - b);
  if (!urut.length) return '';
  const grup = [];
  let mulai = urut[0];
  let akhir = urut[0];
  for (let i = 1; i < urut.length; i += 1) {
    if (urut[i] === akhir + 1) { akhir = urut[i]; continue; }
    grup.push([mulai, akhir]);
    mulai = urut[i];
    akhir = urut[i];
  }
  grup.push([mulai, akhir]);
  return grup.map(([a, b]) => (a === b ? String(a) : `${a}-${b}`)).join(', ');
}

/**
 * Catatan siap-tempel untuk lembar progres, contoh owner:
 * "mengerjakan nomor 1-15, kurang 16-20".
 */
export function catatanProgresJujur({ nomorSelesai = [], totalSoal = 0 } = {}) {
  const selesai = uraiRentangNomor(formatRentangNomor(nomorSelesai));
  if (!selesai.length) return 'belum ada nomor yang tercatat dikerjakan';
  const teksSelesai = `mengerjakan nomor ${formatRentangNomor(selesai)}`;
  const total = Number(totalSoal) || 0;
  if (total > 0) {
    const kurang = [];
    for (let n = 1; n <= total; n += 1) if (!selesai.includes(n)) kurang.push(n);
    if (kurang.length) return `${teksSelesai}, kurang ${formatRentangNomor(kurang)}`;
    return `${teksSelesai} (lengkap 1-${total})`;
  }
  return teksSelesai;
}

export default {
  STATUS_PAKET_SOAL,
  LABEL_STATUS_PAKET_SOAL,
  STATUS_PERIKSA,
  ALFABET_KODE_PAKET,
  paketSudahTerbit,
  transisiStatusPaketSoal,
  bolehEditIsiPaket,
  buatKodePaket,
  kodePaketSah,
  kunciBabPaket,
  nomorPaketBerikutnya,
  usulanJudulPaket,
  labelPaketSingkat,
  bersihSoalUntukSiswa,
  daftarSoalUntukSiswa,
  jejakKunciDiSoalSiswa,
  soalSiswaBebasKunci,
  putusanTerbitkanPaket,
  payloadDrafPaket,
  bangunNaskahSiswa,
  payloadTerbitDariDraf,
  payloadVersiBaru,
  paketBolehDilihatSiswa,
  periksaSelarasMateri,
  statusPeriksaSiswa,
  uraiRentangNomor,
  formatRentangNomor,
  catatanProgresJujur,
};
