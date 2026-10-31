// src/utils/raportOtomatis.js
// ============================================================
// MESIN RAPORT OTOMATIS — mengubah log mentah aktivitas siswa jadi
// angka raport yang objektif, kuantitatif, dan bisa ditelusuri.
//
// KENAPA ADA (keputusan owner 21 Okt 2026, blueprint lengkap di
// ANALISIS-RAPORT-OTOMATIS.md §9):
//   1. Nilai Akademik dan Nilai Proses/Karakter TERPISAH.
//   2. Raport bulanan (dengan tren harian) + satu laporan besar 3 bulan.
//   3. Pelanggaran try out = CATATAN OTOMATIS (bukan pengurang nilai).
//   4. Terbit lewat admin (pratinjau → terbitkan → snapshot terkunci).
//   5. Nol beban tambahan untuk guru: semua angka dari log yang sudah
//      terekam (kuis, TO, latihan harian, absensi, tugas, XP).
//
// ATURAN MAIN (janji yang dipatok tests/raportOtomatis.test.mjs):
//   - MURNI: tidak mengimpor Firebase/SDK apa pun. Masukannya dokumen
//     mentah (objek polos), keluarannya metrik. Bisa diuji di Node polos.
//   - TIDAK PERNAH MENGARANG: komponen tanpa data tidak dinolkan —
//     bobotnya didistribusikan ulang ke komponen yang ada + diberi
//     catatan; dimensi tanpa proksi terukur = null ("belum terukur").
//   - ADIL: izin/sakit tidak dihukum (dibedakan dari alpha); soal rusak
//     sudah dikecualikan mesin TO (pilihSoalDinilai); pelanggaran hanya
//     ditampilkan, tidak memotong nilai.
//   - snapshot yang terbit dikunci (terkunci:true) — lihat
//     bolehTimpaRaportFinal().
//
// KEPUTUSAN DESAIN V1 (jujur, bisa direvisi owner):
//   a. Jendela waktu memakai UTC — field `tanggal` absensi &
//      `terakhirDicoba` latihan ditulis lewat toISOString() (UTC), jadi
//      batas bulan konsisten dengan data tersimpan.
//   b. Nilai UJIAN per mapel: TO nasional dinormalkan ke 0–100
//      (UTBK (skala−100)/900; TKA SMA (skala−200)/600; TKA SD/SMP sudah
//      0–100); TO kurikulum = persen benar per mapel. Campuran dalam
//      satu mapel tidak terjadi (kode mapel berbeda).
//   c. Ketepatan waktu TIDAK TERUKUR di v1: `timestamp` absensi adalah
//      waktu GURU MENCATAT (serverTimestamp saat tombol disimpan), bukan
//      jam kedatangan siswa — mengklaimnya jadi angka = mengarang.
//   d. Integritas tidak ikut skor proses (keputusan owner #3: catatan,
//      bukan pengurang). Bobot dasar proses karenanya: kehadiran 0.35,
//      tugas 0.20, latihan 0.20, (ketepatan waktu 0.15 & integritas 0.10
//      dicadangkan) — komponen yang tak terukur diredistribusi.
//   e. Rasio tugas terkumpul vs terbit butuh daftar tugas terbit per
//      jendela; v1 belum punya sumbernya → komponen tugas di skor proses
//      "belum terukur" (jumlah mutlak tetap ditampilkan). Bobot
//      diredistribusi ke kehadiran & latihan.
//   f. Akurasi latihan harian = akumulasi seumur log Leitner (tidak ada
//      riwayat per tanggal); `hari aktif` = tanggal `terakhirDicoba` unik
//      di jendela (undercount bila soal dicoba ulang lintas hari).
//      Ditampilkan apa adanya sebagai keterbatasan.
//   g. Kelayakan terbit per mapel: >= 2 komponen ADA dan >= 3 titik data
//      (kuis+tugas+ujian) — operasionalisasi "minimal 2 dari 3 komponen,
//      atau >=1 TO + >=2 kuis" di blueprint §3.
//
// Dipakai oleh: src/pages/admin/RaportOtomatisPage.jsx (Fase 1) dan
// api/raport-bulanan.js (Fase 3). Schema keluaran dokumen =
// raport_final yang sudah ada (lihat src/firebase/raportCollection.js)
// + field baru: blok/sumber/terkunci/bukti/jejak — TIDAK ada koleksi
// baru tanpa keputusan owner.
// ============================================================

import { kodeMapel as kodeMapelDariNama } from './aliasMapel.js';
import { mapelBerlaku, petakanNamaMapel, daftarMapelUntuk } from './kurikulumMerdeka.js';
import { jenjangBaku } from './jenjangBaku.js';
import { KATALOG_MAPEL, MAPEL_UTBK } from './mesinTaksonomiSoal.js';
import {
  skorSatuSoal, soalBisaDinilai, isSoalEsai, pilihSoalDinilai,
} from './skorSoalTryOut.js';
import { hitungSkalaSesi } from './hitungSkalaSesi.js';

export const VERSI_MESIN = 'v1.5'; // v1.5: model bukti bertingkat (T1/T2/T3) — 'data belum cukup' jadi profil bukti + antrean aksi

/** mapel pseudo untuk dokumen Blok B+C (proses, tren, peta topik). */
export const MAPEL_PROSES = 'Proses & Karakter';

/** Bobot komponen akademik (sumber kebenaran sama: raportCollection.js). */
export const BOBOT_KOMPONEN = { kuis: 0.3, tugas: 0.3, ujian: 0.4 };

/** Bobot dasar skor proses. komponen 'waktu' & 'integritas' sengaja tidak
 * diberi bobot aktif di v1 — lihat keputusan desain (c) & (d) di kepala
 * berkas. Bila kelak terukur, tinggal diaktifkan + timbangUlang mengurus
 * sisanya. */
export const BOBOT_PROSES_DASAR = {
  kehadiran: 0.35,
  tugas: 0.2,
  latihan: 0.2,
  ketepatanWaktu: 0, // belum terukur (keputusan c)
  integritas: 0,     // catatan saja, bukan pengurang (keputusan owner #3)
};

/** Konstanta kalibrasi v1 — kebijakan, bukan hukum alam. Semua angka di
 * sini terlihat & bisa diubah owner; test mematok perilakunya. */
export const KALIBRASI_V1 = {
  hariAktifLatihanPerBulan: 8,   // target hari belajar mandiri per 30 hari
  soalLatihanPerBulan: 60,       // target butir latihan per 30 hari
  minSesiAbsensi: 3,             // bukti minimum sebelum kehadiran DISKOR
  minSoalMudahSedang: 5,         // bukti minimum dimensi pemahaman
  minSoalMudah: 5,               // bukti minimum dimensi ketelitian
  minSoalSulit: 3,               // bukti minimum dimensi analisis
  benarBerturutTarget: 3,        // "sekali diajari langsung bisa"
  kotakMahir: 3,                 // Leitner kotak >= ini = dikuasai
  topikMinimalDicoba: 3,         // di bawah ini topik belum dipercaya
  topikHijauAkurasi: 80,
  topikMerahAkurasi: 50,
  trenHarianMaks: 400,           // batas embed ke snapshot (dok Firestore)
  petaTopikMaks: 60,
  topikMinimalBukti: 3,          // v1.2: <3 soal = 'tipis' (abu) — 1 soal salah BUKAN penguasaan 0%
};

/** Predikat (blueprint §4). */
export function predikatDariNilai(n) {
  if (!Number.isFinite(n)) return { huruf: '—', label: 'Menunggu asesmen' };
  if (n >= 85) return { huruf: 'A', label: 'Sangat Baik' };
  if (n >= 75) return { huruf: 'B', label: 'Baik' };
  if (n >= 65) return { huruf: 'C', label: 'Cukup' };
  return { huruf: 'D', label: 'Perlu Pendampingan' };
}

// ------------------------------------------------------------
// WAKTU & PERIODE
// ------------------------------------------------------------

/** Nilai waktu apa pun (Firestore Timestamp/Date/ms/ISO string) → ms epoch.
 * null bila tak terbaca — JANGAN pernah menebak 0. */
export function waktuMs(v) {
  if (v == null) return null;
  if (typeof v === 'number' && Number.isFinite(v)) return v;
  if (v instanceof Date) return Number.isFinite(v.getTime()) ? v.getTime() : null;
  if (typeof v.toDate === 'function') {
    const d = v.toDate();
    return Number.isFinite(d?.getTime?.()) ? d.getTime() : null;
  }
  if (typeof v === 'string') {
    // 'YYYY-MM-DD' = tengah malam kalender WIB (konsisten keputusan jendela
    // WIB di bawah): 2026-10-01 berarti aktivitas tanggal 1 Oktober menurut
    // kalender Indonesia, bukan menurut kalender server UTC.
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(v);
    if (m) return Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3])) - SELISIH_WIB_MS;
    const t = Date.parse(v);
    return Number.isFinite(t) ? t : null;
  }
  return null;
}

/** Selisih WIB terhadap UTC dalam ms (UTC+7, tanpa DST — Indonesia tidak
 * memakai jam musim). SATU SUMBER: utils/raportCron.js mengekspor ulang
 * konstanta ini supaya jadwal cron dan jendela mesin tak pernah berpisah. */
export const SELISIH_WIB_MS = 7 * 60 * 60 * 1000;

/** Tanggal kalender WIB (YYYY-MM-DD) dari ms epoch — label yang jujur untuk
 * aktivitas malam/dini hari WIB yang oleh label UTC jatuh ke hari kemarin. */
export function tanggalWib(ms) {
  if (!Number.isFinite(ms)) return '';
  return new Date(ms + SELISIH_WIB_MS).toISOString().slice(0, 10);
}

const labelBulan = (y, m1) => `${y}-${String(m1).padStart(2, '0')}`;

/** Bangun jendela periode — KALENDER WIB (UTC+7), bukan kalender server.
 * Kenapa: seluruh aktivitas bimbel terjadi di WIB (absensi pagi, kuis malam).
 * Jendela UTC menggeser 7 jam: aktivitas 1 Okt 00.00–06.59 WIB masuk raport
 * September, dan 1 Nov 00.00–06.59 WIB masuk raport Oktober. Cron (Fase 3)
 * sudah berpikir WIB untuk JADWALnya; sejak v1.1 jendela isinya pun WIB.
 * @param {{bulan?: string, mulai?: string, selesai?: string}} opts
 *   - {bulan:'2026-08'}                  → raport bulanan
 *   - {mulai:'2026-08', selesai:'2026-10'} → laporan besar multi-bulan
 * @returns {{mulaiMs:number, selesaiMs:number, label:string, jumlahHari:number}}
 *   selesaiMs = EKSKLUSIF (tengah malam WIB awal bulan berikutnya).
 */
export function rentangPeriode(opts = {}) {
  const parse = (s) => {
    const m = /^(\d{4})-(\d{2})$/.exec(String(s || '').trim());
    if (!m) return null;
    const y = Number(m[1]); const mo = Number(m[2]);
    if (mo < 1 || mo > 12) return null;
    return { y, mo };
  };
  if (opts.bulan) {
    const p = parse(opts.bulan);
    if (!p) throw new Error(`periode bulan tidak valid: ${opts.bulan}`);
    return {
      mulaiMs: Date.UTC(p.y, p.mo - 1, 1) - SELISIH_WIB_MS,
      selesaiMs: Date.UTC(p.y, p.mo, 1) - SELISIH_WIB_MS,
      label: labelBulan(p.y, p.mo),
      jumlahHari: Math.round((Date.UTC(p.y, p.mo, 1) - Date.UTC(p.y, p.mo - 1, 1)) / 86400000),
    };
  }
  const a = parse(opts.mulai); const b = parse(opts.selesai);
  if (!a || !b) throw new Error(`periode rentang tidak valid: ${opts.mulai}..${opts.selesai}`);
  const mulaiMs = Date.UTC(a.y, a.mo - 1, 1) - SELISIH_WIB_MS;
  const selesaiMs = Date.UTC(b.y, b.mo, 1) - SELISIH_WIB_MS;
  if (selesaiMs <= mulaiMs) throw new Error('periode selesai harus >= periode mulai');
  return {
    mulaiMs,
    selesaiMs,
    label: `${labelBulan(a.y, a.mo)}..${labelBulan(b.y, b.mo)}`,
    jumlahHari: Math.round((selesaiMs - mulaiMs) / 86400000),
  };
}

/** Tanggal UTC 'YYYY-MM-DD' dari ms — konsisten dengan field `tanggal`. */
/** UTILITAS LAMA (label UTC murni) — dipertahankan untuk kompatibilitas
 * penulis absensi berbasis string; semua LABEL bisnis sejak v1.1 memakai
 * tanggalWib(ms). Jangan dipakai untuk jendela/label raport baru. */
export function tanggalUtc(ms) {
  return new Date(ms).toISOString().slice(0, 10);
}

// ------------------------------------------------------------
// MAPEL
// ------------------------------------------------------------

const PETA_NAMA_MAPEL = new Map(KATALOG_MAPEL.map((m) => [m.kode, m.nama]));
/** subtes UTBK ('PU') → kode mapel ('utbk_pu'). */
const PETA_SUBTES_KE_KODE = new Map(MAPEL_UTBK.map((m) => [m.subtes, m.kode]));

/** Nama mapel yang bisa dibaca manusia dari kode (fallback: title-case). */
export function namaMapel(kode) {
  const k = String(kode || '');
  if (PETA_NAMA_MAPEL.has(k)) return PETA_NAMA_MAPEL.get(k);
  const utbk = MAPEL_UTBK.find((m) => m.kode === k);
  if (utbk) return utbk.nama;
  return k.replace(/_/g, ' ').replace(/(^|\s)([a-z])/g, (_, p, c) => p + c.toUpperCase());
}

/** Normalisasi mapel kuis/tugas (string bebas dari guru) → kode standar.
 * `kodeMapel` dokumen (denormalisasi dari modul) menang atas `subject`. */
export function normalisasiMapelKuis(dok = {}) {
  const sumber = String(dok.kodeMapel || '').trim() || String(dok.subject || '').trim();
  if (!sumber) return 'umum';
  const kode = kodeMapelDariNama(sumber);
  return kode || 'umum';
}

/** Normalisasi label kesulitan soal → 'mudah'|'sedang'|'sulit'|null. */
export function bacaKesulitan(v) {
  const t = String(v ?? '').toLowerCase();
  if (!t) return null;
  if (/(sulit|hots|hard|susah)/.test(t)) return 'sulit';
  if (/(sedang|medium|middle)/.test(t)) return 'sedang';
  if (/(mudah|easy|gampang)/.test(t)) return 'mudah';
  return null;
}

// ------------------------------------------------------------
// BOBOT ADIL (redistribusi, tidak pernah menolkan)
// ------------------------------------------------------------

/** Dari bobot dasar {k:b} dan peta ketersediaan {k:bool}, hasilkan bobot
 * efektif yang jumlahnya 1 — hanya komponen TERSEDIA yang ikut.
 * @returns {{bobot:Object, adaRedistribusi:boolean, hilang:string[]}} */
export function timbangUlang(bobotDasar = {}, tersedia = {}) {
  const kunci = Object.keys(bobotDasar).filter((k) => bobotDasar[k] > 0);
  const ada = kunci.filter((k) => tersedia[k]);
  const hilang = kunci.filter((k) => !tersedia[k]);
  if (ada.length === 0) return { bobot: {}, adaRedistribusi: false, hilang };
  const jumlah = ada.reduce((s, k) => s + bobotDasar[k], 0);
  const bobot = {};
  for (const k of ada) bobot[k] = bobotDasar[k] / jumlah;
  return { bobot, adaRedistribusi: hilang.length > 0, hilang };
}

/** Skala nasional → nilai 0–100 sebanding (blueprint §3 Blok A). */
export function skalaKeNilai100({ mode, skalaMode = null, skala = null }) {
  if (!Number.isFinite(skala)) return null;
  if (mode === 'utbk') return clamp01_100(((skala - 100) / 900) * 100);
  if (mode === 'tka') {
    if (skalaMode === 'tka-sma') return clamp01_100(((skala - 200) / 600) * 100);
    return clamp01_100(skala); // TKA SD/SMP: skala sudah 0–100
  }
  return null; // kurikulum: tidak ada skala nasional
}

const clamp01_100 = (n) => Math.min(100, Math.max(0, n));
const bulatkan = (n, desimal = 1) => {
  const f = 10 ** desimal;
  return Math.round((Number(n) + Number.EPSILON) * f) / f;
};
const rata2 = (arr) => (arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : null);

/** Nilai 0–100 yang aman: angka di luar 0..100 atau non-angka → null
 * (data rusak tidak pernah diam-diam dianggap 0). */
export function nilaiSah(v) {
  const n = Number(v);
  return Number.isFinite(n) && n >= 0 && n <= 100 ? n : null;
}

// ------------------------------------------------------------
// STATUS SISWA (keputusan owner 31 Okt 2026): siswa yang diblokir atau masa
// aktifnya habis TIDAK pernah masuk laporan — apa pun yang terjadi. Mereka
// juga dikeluarkan dari indeks identitas supaya fallback pencocokan nama
// tidak pernah memindahkan log mereka ke siswa aktif bernama sama.
// ------------------------------------------------------------

/** Alasan siswa dianggap nonaktif untuk laporan, atau null bila aktif.
 * Kriteria: isBlocked, status akun bukan 'Aktif', atau tanggalSelesai lewat
 * (tanggal selesai sendiri masih dihitung hari aktif terakhir). */
export function alasanSiswaNonaktif(s = {}, sekarangMs = Date.now()) {
  if (s.isBlocked === true || s.isBlocked === 'true') return 'diblokir sistem';
  const st = String(s.status ?? '').trim().toLowerCase();
  if (st && st !== 'aktif' && st !== 'active') return `status akun "${st}"`;
  const selesai = waktuMs(s.tanggalSelesai);
  if (selesai !== null && selesai + 86400000 <= sekarangMs) return 'masa aktif habis';
  return null;
}

/** Mapel sah untuk profil siswa menurut peta Kurikulum Merdeka?
 * Hanya MENYARING mapel yang dikenal peta kurikulum (Sosiologi untuk SMP =
 * tersaring); kode asing/lokal (Mapel-007, 'umum', paket English) TETAP
 * ditampilkan — menyembunyikan data yang tidak kita pahami lebih berbahaya.
 * @returns {{sah:boolean, alasan:string}} */
export function mapelSahUntukSiswa(kode, { jenjang = '', kelas = '' } = {}) {
  const j = jenjangBaku(jenjang).baku;
  const nomorKelas = (/^(\d{1,2})/.exec(String(kelas || '').trim()) || [])[1] || '';
  if (!j && !nomorKelas) return { sah: true, alasan: '' }; // identitas jenjang tak diketahui
  const nama = namaMapel(kode);
  const peta = petakanNamaMapel(nama, {});
  if (!peta.kode) return { sah: true, alasan: '' }; // di luar peta kurikulum
  if (mapelBerlaku(peta.kode, { jenjang: j, kelas: nomorKelas })) return { sah: true, alasan: '' };
  return {
    sah: false,
    alasan: `${nama} bukan mapel jenjang ${j || `kelas ${nomorKelas}`} (peta Kurikulum Merdeka) — nilai diabaikan dari rapor`,
  };
}

// ------------------------------------------------------------
// IDENTITAS SISWA (3 penulis absensi + kunci kuis/tugas/TO berbeda-beda;
// pola sama dengan utils/identitasAbsensi.js — semua kandidat dicoba)
// ------------------------------------------------------------

/** Bangun indeks identitas per siswa dari koleksi `students`.
 * @returns {Array<{kunci, profil, idSet:Set<string>, namaLower:string}>} */
export function bangunIndeksIdentitas(daftarSiswa = []) {
  return daftarSiswa
    .filter((s) => s && (s.id || s.studentId))
    .map((s) => {
      const docId = String(s.id || '');
      const kode = String(s.studentId || s.nim || s.studentNim || '');
      const idSet = new Set([docId, kode].filter(Boolean));
      const nama = String(s.nama || s.name || '');
      return {
        kunci: kode || docId,
        profil: s,
        idSet,
        namaLower: nama.trim().toLowerCase(),
        nama,
      };
    });
}

/** Cari entri indeks pemilik sebuah dokumen log.
 * @param {Array} indeks hasil bangunIndeksIdentitas
 * @param {object} dok dokumen mentah
 * @param {{fieldId?:string, fieldNama?:string}} field nama field identitas
 * @returns {object|null} entri indeks, atau null bila tak dikenali
 */
export function cariPemilikDok(indeks, dok, { fieldId = 'studentId', fieldNama = '' } = {}) {
  if (!dok) return null;
  const id = String(dok[fieldId] ?? '').trim();
  const nama = fieldNama ? String(dok[fieldNama] ?? '').trim().toLowerCase() : '';
  let byNama = null;
  for (const entri of indeks) {
    if (id && entri.idSet.has(id)) return entri;
    if (!byNama && nama && entri.namaLower && entri.namaLower === nama) byNama = entri;
  }
  return byNama; // nama = fallback rapuh (pola identitasAbsensi), dipakai terakhir
}

/** v1.5.1: kunci identitas sebuah log untuk reparasi — id mentah, lalu nama.
 *  Kunci inilah yang dipasangkan admin ke siswa benar di tool reparasi. */
export function kunciIdentitasLog(dok, fieldId = 'studentId', fieldNama = '') {
  if (!dok) return '';
  const id = String(dok[fieldId] ?? '').trim();
  if (id) return id;
  const nama = fieldNama ? String(dok[fieldNama] ?? '').trim() : '';
  return nama;
}

// ------------------------------------------------------------
// AGREGASI TRY OUT
// ------------------------------------------------------------

/** Waktu selesai sesi (field yang mungkin ada, urutan prioritas). */
export function waktuSelesaiSesi(sesi = {}) {
  return waktuMs(sesi.waktuSelesai) ?? waktuMs(sesi.updatedAt) ?? waktuMs(sesi.createdAt);
}

/** Hitung rincian satu sesi TO selesai: persen per mapel, skala nasional,
 * bukti per butir (kesulitan), durasi, jawaban terisi, pelanggaran. */
export function agregatSatuSesi(sesi, paket, soalMeta = {}) {
  const daftar = pilihSoalDinilai(paket?.daftarSoal || [], sesi);
  const jawaban = sesi.jawaban || {};
  const perMapel = new Map(); // kode → {skor, total, benar}
  const buktiButir = [];      // {kode, kesulitan, skor01, materi}
  let terjawab = 0;
  for (const soal of daftar) {
    if (isSoalEsai(soal) || !soalBisaDinilai(soal)) continue;
    const jw = jawaban[soal.id];
    if (jw !== undefined && jw !== null) terjawab += 1;
    const s01 = skorSatuSoal(soal, jw);
    const kode = kodeMapelDariNama(String(soal.mapel || soal.mataPelajaran || '')) || 'umum';
    const meta = soalMeta[soal.id] || {};
    const kesulitan = bacaKesulitan(soal.kesulitan ?? meta.kesulitan);
    const materi = String(soal.materi || meta.materi || '').trim();
    buktiButir.push({ kode, kesulitan, skor01: s01, materi });
    if (s01 === null) continue; // tak bisa dinilai → tidak ikut penyebut
    const a = perMapel.get(kode) || { skor: 0, total: 0, benar: 0 };
    a.total += 1; a.skor += s01; if (s01 >= 0.999) a.benar += 1;
    perMapel.set(kode, a);
  }
  const skala = hitungSkalaSesi(sesi, paket);
  const mulaiMs = waktuMs(sesi.waktuMulai) ?? waktuMs(sesi.waktuMulaiMs);
  const selesaiMs = waktuSelesaiSesi(sesi);
  return {
    perMapel,
    buktiButir,
    skala,
    terjawab,
    dinilai: daftar.length,
    durasiMs: (mulaiMs != null && selesaiMs != null && selesaiMs >= mulaiMs) ? selesaiMs - mulaiMs : null,
    durasiRencanaMs: Number.isFinite(Number(paket?.durasiTotalMenit)) && Number(paket?.durasiTotalMenit) > 0
      ? Number(paket.durasiTotalMenit) * 60000 : null,
    pelanggaran: (sesi.pelanggaran || []).map((p) => ({
      jenis: String(p?.type || p?.jenis || 'tak-diketahui'),
      waktu: waktuMs(p?.at || p?.waktu),
      paketId: sesi.paketId || paket?.id || '',
    })),
  };
}

/** Nilai ujian 0–100 untuk SATU mapel dalam SATU sesi: skala nasional
 * dinormalkan bila ada, selain itu persen benar (keputusan b). */
export function nilaiUjianSesiMapel(agg, mapelKode) {
  if (agg.skala && agg.skala.mode === 'utbk') {
    const subtesKode = [...PETA_SUBTES_KE_KODE.entries()].find(([, k]) => k === mapelKode)?.[0];
    const entri = subtesKode && (agg.skala.perSubtes || []).find((p) => p.kode === subtesKode);
    const n = entri ? skalaKeNilai100({ mode: 'utbk', skala: entri.skala }) : null;
    if (n !== null) return { nilai: n, dasar: 'skala-utbk' };
  }
  if (agg.skala && agg.skala.mode === 'tka') {
    const entri = (agg.skala.perSubtes || []).find(
      (p) => kodeMapelDariNama(String(p.nama || p.kode || '')) === mapelKode
        || String(p.kode || '') === mapelKode,
    );
    const n = entri ? skalaKeNilai100({ mode: 'tka', skalaMode: agg.skala.skalaMode, skala: entri.skala }) : null;
    if (n !== null) return { nilai: n, dasar: `skala-tka${agg.skala.skalaMode === 'tka-sma' ? '-sma' : ''}` };
  }
  const a = agg.perMapel.get(mapelKode);
  if (a && a.total > 0) return { nilai: clamp01_100((a.skor / a.total) * 100), dasar: 'persen' };
  return null;
}

// ------------------------------------------------------------
// DIMENSI (proksi objektif; null = belum terukur, tidak pernah mengarang)
// ------------------------------------------------------------

/** Kumpulkan bukti dari semua sumber menjadi struktur seragam.
 * butir = {sumber:'latihan'|'to'|'kuis', kode, kesulitan|null, benar01|null,
 *          skorParsial01|null, kotak|null, benarBerturut|null, materi, topik} */
function kumpulkanBukti({ kuisSiswa, sesiAgg, latihanButir }) {
  const bukti = [];
  for (const k of kuisSiswa) {
    const kode = normalisasiMapelKuis(k);
    const details = Array.isArray(k.details) ? k.details : [];
    if (details.length === 0) {
      const n = nilaiSah(k.score);
      if (n !== null) bukti.push({ sumber: 'kuis', kode, kesulitan: null, benar01: null, skorParsial01: n / 100, kotak: null, benarBerturut: null, materi: '', topik: String(k.modulTitle || '') });
      continue;
    }
    for (const d of details) {
      const parsial = Number.isFinite(Number(d?.partialFraction))
        ? Math.min(1, Math.max(0, Number(d.partialFraction)))
        : (d?.isCorrect ? 1 : 0);
      bukti.push({ sumber: 'kuis', kode, kesulitan: null, benar01: d?.isCorrect ? 1 : 0, skorParsial01: parsial, kotak: null, benarBerturut: null, materi: '', topik: String(k.modulTitle || '') });
    }
  }
  for (const s of sesiAgg) {
    for (const b of s.buktiButir) {
      if (b.skor01 === null) continue;
      bukti.push({ sumber: 'to', kode: b.kode, kesulitan: b.kesulitan, benar01: b.skor01 >= 0.999 ? 1 : 0, skorParsial01: b.skor01, kotak: null, benarBerturut: null, materi: b.materi, topik: b.materi });
    }
  }
  for (const l of latihanButir) {
    const total = (l.benarCount || 0) + (l.salahCount || 0);
    bukti.push({
      sumber: 'latihan', kode: l.kode, kesulitan: l.kesulitan,
      benar01: total > 0 ? (l.benarCount || 0) / total : null,
      skorParsial01: total > 0 ? (l.benarCount || 0) / total : null,
      kotak: Number(l.kotak) || 0, benarBerturut: Number(l.benarBerturut) || 0,
      materi: l.materi, topik: l.materi,
    });
  }
  return bukti;
}

const akurasi = (arr) => {
  const v = arr.filter((x) => Number.isFinite(x));
  return v.length >= 1 ? v.reduce((a, b) => a + b, 0) / v.length : null;
};

/** Hitung 5 dimensi dari bukti (dipakai global DAN per mapel).
 * Setiap dimensi: {nilai: number|null, sumber: string, terukur: boolean}.
 * @param {Array} bukti keluaran kumpulkanBukti (boleh sudah terfilter mapel)
 * @param {{hariAktif:number, targetHari:number, autoSubmitRatio:number|null,
 *          terjawabRatio:number|null, jumlahKuis:number, jumlahSesi:number}} ctx
 */
export function hitungDimensi(bukti, ctx = {}) {
  const K = KALIBRASI_V1;
  const latihan = bukti.filter((b) => b.sumber === 'latihan');
  const semua = bukti;
  const mudahSedang = semua.filter((b) => b.kesulitan === 'mudah' || b.kesulitan === 'sedang');
  const sulit = semua.filter((b) => b.kesulitan === 'sulit');
  const mudah = semua.filter((b) => b.kesulitan === 'mudah');
  const hasil = {};

  // 1) PEMAHAMAN KONSEP — akurasi mudah+sedang (70%) + porsi kotak Leitner
  //    mahir (30%). Tanpa label kesulitan: jatuh ke akurasi kuis (proksi
  //    kasar, dilabeli jujur). Tanpa keduanya: belum terukur.
  {
    const accMS = akurasi(mudahSedang.map((b) => b.skorParsial01));
    const kotak = latihan.length
      ? latihan.filter((b) => (b.kotak || 0) >= K.kotakMahir).length / latihan.length
      : null;
    if (accMS !== null && mudahSedang.length >= Math.min(3, K.minSoalMudahSedang)) {
      const porsi = kotak !== null ? 0.3 : 0;
      const dasar = kotak !== null ? 0.7 : 1;
      hasil.pemahaman = {
        nilai: bulatkan(accMS * 100 * dasar + (kotak ?? 0) * 100 * porsi),
        sumber: kotak !== null ? 'akurasi soal mudah-sedang + Leitner' : 'akurasi soal mudah-sedang',
        terukur: true,
      };
    } else if (accMS !== null) {
      hasil.pemahaman = { nilai: bulatkan(accMS * 100), sumber: `akurasi soal mudah-sedang (bukti tipis: ${mudahSedang.length} butir)`, terukur: true };
    } else {
      const accKuis = akurasi(semua.filter((b) => b.sumber === 'kuis').map((b) => b.skorParsial01));
      hasil.pemahaman = accKuis !== null
        ? { nilai: bulatkan(accKuis * 100), sumber: 'akurasi kuis mapel (semua tingkat kesulitan)', terukur: true }
        : { nilai: null, sumber: 'belum terukur (tidak ada bukti berlabel kesulitan maupun kuis)', terukur: false };
    }
  }

  // 2) ANALISIS — akurasi soal sulit/HOTS. Bukti < minSoalSulit → null.
  {
    const accS = akurasi(sulit.map((b) => b.skorParsial01));
    hasil.analisis = (accS !== null && sulit.length >= K.minSoalSulit)
      ? { nilai: bulatkan(accS * 100), sumber: `akurasi ${sulit.length} soal sulit/HOTS`, terukur: true }
      : { nilai: null, sumber: sulit.length ? `belum terukur (baru ${sulit.length} soal sulit, minimal ${K.minSoalSulit})` : 'belum terukur (tidak ada soal sulit/HOTS terlabel)', terukur: false };
  }

  // 3) KETELITIAN — invers careless mistake: akurasi soal MUDAH; tanpa itu,
  //    kredit parsial kuis (setengah benar = prosedur sebagian tepat).
  {
    const accM = akurasi(mudah.map((b) => b.skorParsial01));
    if (accM !== null && mudah.length >= K.minSoalMudah) {
      hasil.ketelitian = { nilai: bulatkan(accM * 100), sumber: `akurasi ${mudah.length} soal mudah (salah di soal mudah = tidak teliti)`, terukur: true };
    } else {
      const parsial = akurasi(semua.filter((b) => b.sumber === 'kuis').map((b) => b.skorParsial01));
      hasil.ketelitian = parsial !== null
        ? { nilai: bulatkan(parsial * 100), sumber: 'kredit parsial kuis (penghargaan atas prosedur pengerjaan)', terukur: true }
        : { nilai: null, sumber: mudah.length ? `belum terukur (baru ${mudah.length} soal mudah, minimal ${K.minSoalMudah})` : 'belum terukur', terukur: false };
    }
  }

  // 4) WAKTU — 0.6·rasio soal TO terjawab + 0.4·(1 − rasio auto-submit kuis).
  //    Sumber tunggal dipakai sendiri; keduanya tak ada → null.
  {
    const t = Number.isFinite(ctx.terjawabRatio) ? ctx.terjawabRatio : null;
    const a = Number.isFinite(ctx.autoSubmitRatio) ? ctx.autoSubmitRatio : null;
    if (t !== null && a !== null) {
      hasil.waktu = { nilai: bulatkan(100 * (0.6 * t + 0.4 * (1 - a))), sumber: 'kelengkapan jawaban try out + ketepatan waktu pengumpulan kuis', terukur: true };
    } else if (t !== null) {
      hasil.waktu = { nilai: bulatkan(100 * t), sumber: 'rasio soal try out terjawab', terukur: true };
    } else if (a !== null && ctx.jumlahKuis > 0) {
      hasil.waktu = { nilai: bulatkan(100 * (1 - a)), sumber: 'disiplin waktu kuis (tanpa auto-submit)', terukur: true };
    } else {
      hasil.waktu = { nilai: null, sumber: 'belum terukur (tidak ada TO selesai/kuis berwaktu di periode ini)', terukur: false };
    }
  }

  // 5) DAYA TANGKAP & KEMANDIRIAN — 0.6·frekuensi hari aktif latihan +
  //    0.4·kecepatan tuntas (benarBerturut). Tanpa data latihan → null.
  {
    const target = Math.max(1, ctx.targetHari || K.hariAktifLatihanPerBulan);
    const freq = Math.min(1, (ctx.hariAktif || 0) / target);
    const bt = latihan.length ? akurasi(latihan.map((b) => Math.min(1, (b.benarBerturut || 0) / K.benarBerturutTarget))) : null;
    if (ctx.hariAktif > 0 && bt !== null) {
      hasil.dayaTangkap = { nilai: bulatkan(100 * (0.6 * freq + 0.4 * bt)), sumber: 'frekuensi latihan mandiri + cepat tuntas setelah benar', terukur: true };
    } else if (ctx.hariAktif > 0) {
      hasil.dayaTangkap = { nilai: bulatkan(100 * freq), sumber: 'frekuensi latihan mandiri', terukur: true };
    } else {
      hasil.dayaTangkap = { nilai: null, sumber: 'belum terukur (tidak ada latihan mandiri di periode ini)', terukur: false };
    }
  }
  return hasil;
}

export const DIMENSI_KEYS_OTOMATIS = ['pemahaman', 'analisis', 'ketelitian', 'waktu', 'dayaTangkap'];

// ------------------------------------------------------------
// PETA TOPIK
// ------------------------------------------------------------

/** Status topik: hijau/kuning/merah (blueprint §3 Blok C). */
export function statusTopik({ akurasiPersen, dicoba, sumberLatihan }) {
  const K = KALIBRASI_V1;
  if (!Number.isFinite(akurasiPersen)) return { status: 'abu', alasan: 'belum ada hasil' };
  // v1.2 (keluhan owner 31 Okt 2026: ortu melihat banjir '0% (1)' dan menganggap
  // rapor tidak valid): bukti <3 soal TIDAK boleh diwarnai merah/kuning — satu
  // butir salah adalah kejadian, bukan pengukuran penguasaan.
  if (dicoba < K.topikMinimalBukti) {
    return { status: 'tipis', alasan: `bukti baru ${dicoba} soal — warna tampil setelah minimal ${K.topikMinimalBukti} soal` };
  }
  if (akurasiPersen < K.topikMerahAkurasi) return { status: 'merah', alasan: `akurasi ${bulatkan(akurasiPersen)}% < ${K.topikMerahAkurasi}%` };
  if (sumberLatihan && dicoba < K.topikMinimalDicoba) {
    return { status: 'merah', alasan: `jarang dilatih (${dicoba} soal)` };
  }
  if (akurasiPersen >= K.topikHijauAkurasi && dicoba >= K.topikMinimalDicoba) {
    return { status: 'hijau', alasan: `akurasi ${bulatkan(akurasiPersen)}% dari ${dicoba} butir` };
  }
  if (akurasiPersen >= K.topikHijauAkurasi) {
    return { status: 'kuning', alasan: `akurasi tinggi tapi baru ${dicoba} butir` };
  }
  return { status: 'kuning', alasan: `akurasi ${bulatkan(akurasiPersen)}%` };
}

/** Bangun peta topik dari bukti latihan+TO (per butir) dan kuis (per modul). */
export function hitungPetaTopik(bukti, kuisSiswa = []) {
  const K = KALIBRASI_V1;
  const peta = new Map();
  const entri = (kode, topik) => {
    const key = `${kode}||${topik}`;
    if (!peta.has(key)) peta.set(key, { mapelKode: kode, topik, dicoba: 0, benar: 0, kotakJumlah: 0, kotakN: 0, sumber: new Set() });
    return peta.get(key);
  };
  for (const b of bukti) {
    const topik = String(b.topik || b.materi || '').trim();
    if (!topik) continue;
    const e = entri(b.kode, topik);
    e.sumber.add(b.sumber);
    if (b.sumber === 'latihan') {
      // Butir tanpa satu pun jawaban tercatat (benarCount+salahCount=0)
      // TIDAK ikut akurasi — menganggapnya salah = menghukum tanpa bukti.
      if (!Number.isFinite(b.skorParsial01)) continue;
      e.dicoba += 1;
      e.benar += b.skorParsial01 >= 0.5 ? 1 : 0;
      if (b.kotak != null) { e.kotakJumlah += b.kotak; e.kotakN += 1; }
    } else if (b.sumber === 'to' && b.skorParsial01 !== null) {
      e.dicoba += 1;
      e.benar += b.skorParsial01 >= 0.999 ? 1 : 0;
    }
  }
  for (const k of kuisSiswa) {
    const topik = String(k.modulTitle || '').trim();
    if (!topik) continue;
    const benar = Number(k.correctAnswers); const total = Number(k.totalQuestions);
    if (!Number.isFinite(total) || total <= 0) continue;
    const e = entri(normalisasiMapelKuis(k), topik);
    e.sumber.add('kuis');
    e.dicoba += total;
    e.benar += Number.isFinite(benar) ? Math.min(total, Math.max(0, benar)) : 0;
  }
  const hasil = [];
  for (const e of peta.values()) {
    if (e.dicoba <= 0) continue;
    const akurasiPersen = (e.benar / e.dicoba) * 100;
    const st = statusTopik({
      akurasiPersen, dicoba: e.dicoba, sumberLatihan: e.sumber.has('latihan'),
    });
    hasil.push({
      mapelKode: e.mapelKode, mapelNama: namaMapel(e.mapelKode), topik: e.topik,
      dicoba: e.dicoba, akurasi: bulatkan(akurasiPersen),
      kotakRataRata: e.kotakN ? bulatkan(e.kotakJumlah / e.kotakN, 2) : null,
      sumber: [...e.sumber].sort(),
      status: st.status, alasan: st.alasan,
    });
  }
  hasil.sort((a, b) => (a.status === b.status ? b.dicoba - a.dicoba : rankStatus(a.status) - rankStatus(b.status)));
  return hasil.slice(0, K.petaTopikMaks);
}

const rankStatus = (s) => ({ merah: 0, kuning: 1, hijau: 2, tipis: 3, abu: 4 }[s] ?? 5);

// ------------------------------------------------------------
// MESIN UTAMA PER SISWA
// ------------------------------------------------------------

/** Hitung raport lengkap SATU siswa. Semua masukan sudah terfilter jendela
 * periode dan sudah ter-bucket per siswa (dilakukan hitungRaportSemuaSiswa).
 * Diekspor untuk test; halaman admin cukup memanggil hitungRaportSemuaSiswa. */
export function hitungRaportSiswa({
  profil, periode, kuis = [], sesiAgg = [], absensi = [], tugas = [], nilaiGuru = [],
  latihan = [], progresSiswa = null, tugasTerbit = null,
}) {
  const K = KALIBRASI_V1;
  const targetHari = Math.max(4, Math.round(K.hariAktifLatihanPerBulan * (periode.jumlahHari / 30)));
  const targetSoal = Math.max(10, Math.round(K.soalLatihanPerBulan * (periode.jumlahHari / 30)));
  const catatan = [];

  // ---------- BLOK A: akademik per mapel ----------
  const kodeSemua = new Set([
    ...kuis.map((k) => normalisasiMapelKuis(k)),
    ...sesiAgg.flatMap((s) => [...s.perMapel.keys()]),
    ...tugas.map((t) => normalisasiMapelKuis(t)),
    ...nilaiGuru.map((g) => kodeMapelDariNama(String(g.mapel || '')) || 'umum'),
  ]);
  // v1.3.1 (keluhan owner: siswa SMP punya nilai Sosiologi): mapel yang tak
  // sah di jenjang siswa DISARING di sini — akar datanya dari pendaftaran/
  // penerbitan kuis, tapi rapor tidak boleh menampilkannya apa pun yang
  // terjadi. Disaring ≠ dihapus: dicatat di mapelDikesampingkan untuk admin.
  const konteksJenjang = {
    jenjang: String(profil.profil.jenjang || ''),
    kelas: String(profil.profil.kelas || profil.profil.kelasSekolah || profil.profil.tingkatKelas || ''),
  };
  const mapelDikesampingkan = [];
  const kodeSah = [...kodeSemua].sort().filter((kode) => {
    const cek = mapelSahUntukSiswa(kode, konteksJenjang);
    if (cek.sah) return true;
    mapelDikesampingkan.push({ kode, nama: namaMapel(kode), alasan: cek.alasan });
    return false;
  });
  // v1.5: mapel yang DIDAFTARKAN siswa (enrolledSubjects) tetapi belum punya
  // asesmen pada periode ini masuk laporan sebagai tier T3 — baris rencana
  // jujur untuk orang tua ("asesmen dijadwalkan periode berikutnya"), bukan
  // ruang kosong. 'semua' diurai lewat peta kurikulum per jenjang/kelas.
  const kodeTerdaftar = new Set();
  const enrolledMentah = Array.isArray(profil.profil.enrolledSubjects) ? profil.profil.enrolledSubjects : [];
  for (const e of enrolledMentah) {
    const k = String(e || '').trim().toLowerCase();
    if (!k) continue;
    if (k === 'semua') {
      for (const m of daftarMapelUntuk({ jenjang: konteksJenjang.jenjang, kelas: konteksJenjang.kelas })) {
        kodeTerdaftar.add(String(m.kode || '').toLowerCase());
      }
    } else kodeTerdaftar.add(k);
  }
  for (const kode of kodeTerdaftar) {
    if (!kode || kodeSemua.has(kode) || kodeSah.includes(kode)) continue;
    if (!mapelSahUntukSiswa(kode, konteksJenjang).sah) continue; // jaring pengaman tetap
    kodeSah.push(kode);
  }
  kodeSah.sort();
  const perMapel = [];
  for (const kode of kodeSah) {
    const kuisMapel = kuis.filter((k) => normalisasiMapelKuis(k) === kode);
    const nilaiKuis = kuisMapel.map((k) => nilaiSah(k.score)).filter((n) => n !== null);
    const tugasMapel = tugas.filter((t) => normalisasiMapelKuis(t) === kode);
    const nilaiTugas = tugasMapel.map((t) => nilaiSah(t.score)).filter((n) => n !== null);
    const guruMapel = nilaiGuru.filter((g) => (kodeMapelDariNama(String(g.mapel || '')) || 'umum') === kode);
    const nilaiGuruSah = guruMapel.map((g) => nilaiSah(g.nilai ?? g.score)).filter((n) => n !== null);
    const semuaTugas = [...nilaiTugas, ...nilaiGuruSah];

    const rincianUjian = [];
    for (const s of sesiAgg) {
      const n = nilaiUjianSesiMapel(s, kode);
      if (n) {
        rincianUjian.push({
          tanggal: s.tanggal, paketJudul: s.paketJudul,
          nilai: bulatkan(n.nilai), dasar: n.dasar,
          skala: s.skala?.total ?? null, modeSkala: s.skala?.mode ?? null,
        });
      }
    }
    const nilaiUjian = rincianUjian.map((r) => r.nilai);

    const komponen = {
      kuis: { ada: nilaiKuis.length > 0, nilai: nilaiKuis.length ? bulatkan(rata2(nilaiKuis)) : null, jumlah: nilaiKuis.length },
      tugas: { ada: semuaTugas.length > 0, nilai: semuaTugas.length ? bulatkan(rata2(semuaTugas)) : null, jumlah: semuaTugas.length },
      ujian: { ada: nilaiUjian.length > 0, nilai: nilaiUjian.length ? bulatkan(rata2(nilaiUjian)) : null, jumlah: nilaiUjian.length },
    };
    const { bobot, adaRedistribusi, hilang } = timbangUlang(BOBOT_KOMPONEN, {
      kuis: komponen.kuis.ada, tugas: komponen.tugas.ada, ujian: komponen.ujian.ada,
    });
    let nilaiAkhir = null;
    if (Object.keys(bobot).length) {
      nilaiAkhir = bulatkan(Object.keys(bobot).reduce((s, k) => s + komponen[k].nilai * bobot[k], 0));
    }
    const titikData = nilaiKuis.length + semuaTugas.length + nilaiUjian.length;
    const jumlahKomponen = ['kuis', 'tugas', 'ujian'].filter((k) => komponen[k].ada).length;
    const tier = tierBuktiDariHitungan(jumlahKomponen, titikData);
    const layak = tier === 'T1';
    if (!layak && jumlahKomponen > 0) {
      catatan.push(`${namaMapel(kode)}: gambaran awal dari ${jumlahKomponen} sumber asesmen (${titikData} titik nilai) — capaian dimatangkan otomatis oleh asesmen berikutnya.`);
    }
    if (adaRedistribusi && nilaiAkhir !== null) {
      const mapHilang = { kuis: 'kuis', tugas: 'tugas', ujian: 'ujian' };
      catatan.push(`${namaMapel(kode)}: nilai dihitung dari sumber yang ada (${hilang.map((h) => mapHilang[h]).join(' & ')} belum dilaksanakan) — bobot komponen kosong dibagikan ulang ke sumber yang ada, TIDAK dinolkan, supaya anak tidak dihukum atas ujian yang belum diadakan.`);
    }

    // dimensi per mapel (bukti difilter kode) — null bila tipis
    const buktiMapel = kumpulkanBukti({
      kuisSiswa: kuisMapel,
      sesiAgg: sesiAgg.map((s) => ({ buktiButir: s.buktiButir.filter((b) => b.kode === kode) })),
      latihanButir: latihan.filter((l) => l.kode === kode),
    });
    const dimensiMapel = hitungDimensi(buktiMapel, {
      hariAktif: 0, targetHari, autoSubmitRatio: null, terjawabRatio: null, jumlahKuis: kuisMapel.length, jumlahSesi: 0,
    });
    for (const key of DIMENSI_KEYS_OTOMATIS) {
      if (dimensiMapel[key].nilai === null) dimensiMapel[key] = { nilai: null, sumber: 'belum terukur untuk mapel ini', terukur: false };
    }

    perMapel.push({
      kode, nama: namaMapel(kode), komponen, bobotEfektif: bobot,
      nilaiAkhir, predikat: predikatDariNilai(nilaiAkhir), layak, tier,
      titikData, jumlahKomponen, rincianUjian, dimensi: dimensiMapel,
    });
  }
  const mapelLayak = perMapel.filter((m) => m.layak && m.nilaiAkhir !== null);
  const rataRataAkademik = mapelLayak.length
    ? bulatkan(rata2(mapelLayak.map((m) => m.nilaiAkhir)))
    : null;

  // ---------- BLOK B: proses & karakter ----------
  // Kehadiran: dedup (studentId|tanggal|scheduleId) — admin & guru bisa
  // menulis hari yang sama; izin/sakit TIDAK dihukum (keadilan §5.4).
  const seen = new Set();
  const absenUnik = [];
  for (const a of absensi) {
    const tgl = String(a.tanggal || a.date || '').slice(0, 10) || tanggalWib(waktuMs(a.timestamp) ?? periode.mulaiMs);
    const key = `${String(a.studentId || a.namaSiswa || a.studentName || '')}|${tgl}|${String(a.scheduleId || a.mapel || '')}`;
    if (seen.has(key)) continue;
    seen.add(key);
    absenUnik.push({ ...a, tanggalNormal: tgl });
  }
  const hitungStatus = (...nama) => absenUnik.filter((a) => nama.includes(String(a.status || '').toLowerCase())).length;
  const hadir = hitungStatus('hadir', 'present', 'h');
  const izin = hitungStatus('izin', 'ijun', 'i');
  const sakit = hitungStatus('sakit', 's');
  const alpha = hitungStatus('alpha', 'alfa', 'a', 'absen');
  const totalAbsen = absenUnik.length;
  const kehadiran = {
    hadir, izin, sakit, alpha, lainnya: Math.max(0, totalAbsen - hadir - izin - sakit - alpha),
    total: totalAbsen,
    persenHadir: totalAbsen ? bulatkan((hadir / totalAbsen) * 100) : null,
    // skor adil: izin/sakit dihitung seperti hadir (tidak menghukum anak sakit).
    // Bukti < minSesiAbsensi → TIDAK diskor (satu alpha tunggal tidak layak
    // menghancurkan nilai proses; jumlah mentah tetap ditampilkan jujur).
    skor: totalAbsen >= K.minSesiAbsensi ? bulatkan(((hadir + izin + sakit) / totalAbsen) * 100) : null,
    alasan: totalAbsen >= K.minSesiAbsensi
      ? ''
      : `baru ${totalAbsen} sesi absensi tercatat — skor kehadiran aktif otomatis setelah ${K.minSesiAbsensi} sesi`,
  };

  const tugasTerkumpul = tugas.length;
  const tugasDinilai = tugas.filter((t) => nilaiSah(t.score) !== null).length;
  const tugasKomponen = Number.isFinite(tugasTerbit) && tugasTerbit > 0
    ? { terukur: true, skor: bulatkan(Math.min(1, tugasTerkumpul / tugasTerbit) * 100), terbit: tugasTerbit, terkumpul: tugasTerkumpul }
    : { terukur: false, skor: null, terbit: null, terkumpul: tugasTerkumpul, dinilai: tugasDinilai,
        alasan: 'Jumlah pengumpulan tugas ditampilkan apa adanya; skor rasio aktif otomatis setelah daftar tugas periode tersedia.' };

  const hariAktifSet = new Set(latihan.map((l) => l.terakhirDicoba).filter(Boolean));
  const hariAktif = hariAktifSet.size;
  const soalDikerjakan = latihan.length;
  const totalJawabanLatihan = latihan.reduce((s, l) => s + (l.benarCount || 0) + (l.salahCount || 0), 0);
  const latihanSkor = bulatkan(
    100 * (0.5 * Math.min(1, hariAktif / targetHari) + 0.5 * Math.min(1, soalDikerjakan / targetSoal)),
  );
  const latihanKomponen = {
    terukur: hariAktif > 0 || soalDikerjakan > 0, skor: (hariAktif > 0 || soalDikerjakan > 0) ? latihanSkor : null,
    hariAktif, soalDikerjakan, totalJawaban: totalJawabanLatihan, targetHari, targetSoal,
  };

  const { bobot: bobotProses, adaRedistribusi: redistribusiProses, hilang: hilangProses } = timbangUlang(
    BOBOT_PROSES_DASAR,
    { kehadiran: kehadiran.skor !== null, tugas: tugasKomponen.terukur, latihan: latihanKomponen.terukur },
  );
  let nilaiProses = null;
  if (Object.keys(bobotProses).length) {
    nilaiProses = bulatkan(
      (kehadiran.skor ?? 0) * (bobotProses.kehadiran || 0)
      + (tugasKomponen.skor ?? 0) * (bobotProses.tugas || 0)
      + (latihanKomponen.skor ?? 0) * (bobotProses.latihan || 0),
    );
  }

  // Integritas: CATATAN OTOMATIS — tidak memotong nilai apa pun (owner #3).
  const pelanggaran = sesiAgg.flatMap((s) => s.pelanggaran.map((p) => ({
    tanggal: p.waktu ? tanggalWib(p.waktu) : s.tanggal, jenis: p.jenis, asal: 'tryout', paketJudul: s.paketJudul,
  })));
  for (const k of kuis) {
    const n = Number(k.cheatViolationCount) || 0;
    if (n > 0) {
      pelanggaran.push({
        tanggal: k.tanggal || '', jenis: `peringatan-mode-ujian-kuis (${n}x)`, asal: 'kuis', paketJudul: String(k.modulTitle || ''),
      });
    }
  }
  pelanggaran.sort((a, b) => String(a.tanggal).localeCompare(String(b.tanggal)));

  const proses = {
    kehadiran, tugas: tugasKomponen, latihan: latihanKomponen,
    ketepatanWaktu: { terukur: false, alasan: 'Ketepatan waktu mulai diskor otomatis begitu tugas berjatuh tempo diterbitkan pada periode ini.' },
    integritas: {
      terukur: true, ikutSkor: false, jumlahPelanggaran: pelanggaran.length, pelanggaran,
      catatan: pelanggaran.length === 0
        ? 'Tidak ada pelanggaran terdeteksi pada periode ini.'
        : `${pelanggaran.length} catatan pengawasan — nilai TIDAK dipotong; ditampilkan untuk pembinaan.`,
    },
    xp: progresSiswa ? { xp: Number(progresSiswa.xp) || 0, xpMingguIni: Number(progresSiswa.xpMingguIni) || 0 } : null,
    nilaiProses, predikat: predikatDariNilai(nilaiProses),
    bobotEfektif: bobotProses, redistribusi: redistribusiProses, komponenTakTerukur: hilangProses,
  };

  // ---------- BLOK C: perkembangan ----------
  const buktiGlobal = kumpulkanBukti({ kuisSiswa: kuis, sesiAgg, latihanButir: latihan });
  const kuisAuto = kuis.filter((k) => k.isAutoSubmit === true).length;
  const terjawabTotal = sesiAgg.reduce((s, x) => s + x.terjawab, 0);
  const dinilaiTotal = sesiAgg.reduce((s, x) => s + x.dinilai, 0);
  const dimensiGlobal = hitungDimensi(buktiGlobal, {
    hariAktif, targetHari,
    autoSubmitRatio: kuis.length ? kuisAuto / kuis.length : null,
    terjawabRatio: dinilaiTotal ? terjawabTotal / dinilaiTotal : null,
    jumlahKuis: kuis.length, jumlahSesi: sesiAgg.length,
  });

  const trenHarian = [];
  for (const k of kuis) {
    const n = nilaiSah(k.score);
    if (k.tanggal && n !== null) {
      trenHarian.push({ tanggal: k.tanggal, jenis: 'kuis', mapelKode: normalisasiMapelKuis(k), skor: n, label: String(k.modulTitle || 'Kuis') });
    }
  }
  for (const s of sesiAgg) {
    const n = nilaiSah(s.persen);
    if (s.tanggal && n !== null) {
      trenHarian.push({ tanggal: s.tanggal, jenis: 'to', mapelKode: '', skor: n, label: s.paketJudul });
    }
  }
  for (const l of latihan) {
    if (l.terakhirDicoba) {
      trenHarian.push({ tanggal: l.terakhirDicoba, jenis: 'latihan', mapelKode: l.kode, skor: null, label: l.materi || 'Latihan harian' });
    }
  }
  trenHarian.sort((a, b) => a.tanggal.localeCompare(b.tanggal) || a.jenis.localeCompare(b.jenis));
  const trenHarianDipangkas = trenHarian.length > K.trenHarianMaks
    ? trenHarian.slice(trenHarian.length - K.trenHarianMaks) : trenHarian;

  const trenSkala = sesiAgg
    .filter((s) => s.skala && s.skala.total !== null && s.skala.total !== undefined)
    .map((s) => ({
      tanggal: s.tanggal, paketJudul: s.paketJudul, mode: s.skala.mode, skalaMode: s.skala.skalaMode || null,
      skalaTotal: s.skala.total, nilai100: skalaKeNilai100({ mode: s.skala.mode, skalaMode: s.skala.skalaMode || null, skala: s.skala.total }),
      perSubtes: (s.skala.perSubtes || []).map((p) => ({ kode: p.kode, nama: p.nama, skala: p.skala ?? null, persen: p.persen ?? null })),
    }));

  const petaTopik = hitungPetaTopik(buktiGlobal, kuis);
  const rekomendasi = petaTopik
    .filter((t) => t.status === 'merah')
    .slice(0, 6)
    .map((t) => `Pendampingan terfokus: topik "${t.topik}" (${t.mapelNama}) — akurasi ${t.akurasi}% dari ${t.dicoba} soal; Gemilang menjadwalkan latihan terbimbing untuk topik ini.`);

  return {
    studentId: profil.kunci, studentName: profil.nama || profil.kunci,
    studentKelas: String(profil.profil.kelas || profil.profil.kelasSekolah || profil.profil.tingkatKelas || ''),
    studentProgram: String(profil.profil.kategori || profil.profil.program || ''),
    jenjang: String(profil.profil.jenjang || ''),
    periode: periode.label,
    akademik: {
      perMapel, rataRata: rataRataAkademik, predikat: predikatDariNilai(rataRataAkademik),
      statusData: mapelLayak.length ? (mapelLayak.length === perMapel.length ? 'lengkap' : 'sebagian') : 'belum-cukup',
    },
    dimensi: dimensiGlobal,
    proses,
    trenHarian: trenHarianDipangkas,
    trenSkala,
    petaTopik,
    rekomendasi,
    catatan,
    mapelDikesampingkan,
    kelayakan: {
      layakTerbit: mapelLayak.length > 0,
      mapelLayak: mapelLayak.length, mapelTotal: perMapel.length,
      alasan: mapelLayak.length ? '' : 'Sebagian mapel belum menjadwalkan kuis/try out pada periode ini — laporan diterbitkan dengan angka dari asesmen yang sudah berjalan.',
      // v1.5: profil bukti bertingkat — dasar chip admin & Antrean Aksi Bukti.
      profilBukti: profilBuktiSiswa(perMapel),
      tierPerMapel: perMapel.map((m) => ({ kode: m.kode, nama: m.nama, tier: m.tier })),
    },
  };
}

// ------------------------------------------------------------
// ORKESTRASI SEMUA SISWA
// ------------------------------------------------------------

/** Cocokkan satu hasil/profil siswa dengan sasaran filter jenjang/kelas.
 * SATU SUMBER untuk halaman admin & mesin supaya baris tabel, tombol terbit,
 * dan cetak massal tak pernah lagi berbeda pendapat soal "siapa difilter". */
export function cocokSasaran(r = {}, sasaran = {}) {
  const j = String(sasaran.jenjang || '').trim();
  const k = String(sasaran.kelas || '').trim();
  if (j && String(r.jenjang || '').trim() !== j) return false;
  if (k && String(r.studentKelas || '').trim() !== k) return false;
  return true;
}

/** v1.5: tier bukti SATU mapel — T1 terukur penuh (aturan layak lama TIDAK
 * diturunkan: >=2 komponen & >=3 titik), T2 gambaran awal (ada asesmen tapi
 * di bawah ambang), T3 dalam penjadwalan (belum ada asesmen periode ini).
 * Satu sumber untuk mesin, dokumen terbit, cetakan, dan layar admin. */
export function tierBuktiDariHitungan(jumlahKomponen = 0, titikData = 0) {
  if (jumlahKomponen >= 2 && titikData >= 3) return 'T1';
  if (jumlahKomponen > 0) return 'T2';
  return 'T3';
}

/** Tier dari entri perMapel hasil mesin. */
export function tierBuktiMapel(m = {}) {
  return tierBuktiDariHitungan(m.jumlahKomponen || 0, m.titikData || 0);
}

/** Ringkasan profil bukti satu siswa: hitungan per tier (untuk admin & antrean aksi). */
export function profilBuktiSiswa(perMapel = []) {
  const hit = { T1: 0, T2: 0, T3: 0 };
  for (const m of perMapel) hit[tierBuktiMapel(m)] += 1;
  return { t1: hit.T1, t2: hit.T2, t3: hit.T3 };
}

/** Ringkasan pratinjau dari daftar hasil siswa + hitungan log jujur.
 * Diekspor supaya halaman admin bisa menyusun ringkasan ULANG untuk subset
 * terfilter tanpa menghitung ulang mesin (dan tanpa berbohong soal orphan). */
export function buatRingkasan(hasilSiswa = [], ekstra = {}) {
  return {
    totalSiswa: hasilSiswa.length,
    layakTerbit: hasilSiswa.filter((h) => h.kelayakan.layakTerbit).length,
    belumCukup: hasilSiswa.filter((h) => !h.kelayakan.layakTerbit).length,
    totalPelanggaran: hasilSiswa.reduce((s, h) => s + h.proses.integritas.jumlahPelanggaran, 0),
    logTakDikenal: ekstra.logTakDikenal || null,
    logDireparasi: ekstra.logDireparasi || null,
    identitasTakDikenal: ekstra.identitasTakDikenal || null,
    logLuarSaringan: ekstra.logLuarSaringan || null,
    logSiswaNonaktif: ekstra.logSiswaNonaktif || null,
    siswaDikecualikan: ekstra.siswaDikecualikan || null,
    dataBermasalah: ekstra.dataBermasalah || [],
  };
}

/** Fungsi utama: data mentah sekoleksi → raport semua siswa.
 * @param {object} dataMentah { siswa, kuis, sesi, paket, absensi, tugas,
 *   nilaiGuru, progresSoal, soalMeta, progresSiswa, tugasTerbit? }
 *   - paket: peta {paketId: dokumen} ATAU array dokumen ber-id
 *   - soalMeta: peta {soalId: {mataPelajaran/mapel, materi, kesulitan}}
 * @param {{bulan?:string, mulai?:string, selesai?:string}} periodeOpts
 * @param {{sasaran?:{jenjang?:string, kelas?:string}}} [opts] sasaran hanya
 *   untuk MELABELI log milik siswa di luar filter (logLuarSaringan) supaya
 *   peringatan orphan tak lagi menuduh identitas rusak padahal cuma beda
 *   kelas/jenjang dari sasaran pratinjau.
 */
export function hitungRaportSemuaSiswa(dataMentah = {}, periodeOpts = {}, opts = {}) {
  const periode = rentangPeriode(periodeOpts);
  const dalamJendela = (ms) => ms !== null && ms >= periode.mulaiMs && ms < periode.selesaiMs;

  // v1.3.1: siswa diblokir / masa aktif habis / status nonaktif DIKECUALIKAN
  // dari laporan dan dari indeks identitas (log mereka tidak boleh 'pindah'
  // ke siswa aktif bernama sama lewat fallback nama).
  const sekarangMs = opts?.sekarangMs ?? Date.now();
  const daftarNonaktif = [];
  const siswaNonaktifDok = [];
  const daftarAktif = (dataMentah.siswa || []).filter((s) => {
    const alasan = s && s.id ? alasanSiswaNonaktif(s, sekarangMs) : null;
    if (alasan) {
      siswaNonaktifDok.push(s);
      daftarNonaktif.push({
        studentId: String(s.studentId || s.nim || s.id || ''),
        nama: String(s.nama || s.name || ''),
        alasan,
      });
      return false;
    }
    return true;
  });
  const indeks = bangunIndeksIdentitas(daftarAktif);
  const indeksNonaktif = bangunIndeksIdentitas(siswaNonaktifDok);
  const paketById = Array.isArray(dataMentah.paket)
    ? Object.fromEntries((dataMentah.paket || []).map((p) => [p.id, p]))
    : (dataMentah.paket || {});
  const soalMeta = dataMentah.soalMeta || {};

  // Bucket log per siswa + hitung yang tak dikenal (dilaporkan jujur).
  const bucket = new Map(indeks.map((e) => [e.kunci, { kuis: [], sesiAgg: [], absensi: [], tugas: [], nilaiGuru: [], latihan: [], progresSiswa: null }]));
  const takDikenal = { kuis: 0, sesi: 0, absensi: 0, tugas: 0, latihan: 0 };
  const logDireparasi = { kuis: 0, sesi: 0, absensi: 0, tugas: 0, latihan: 0 };
  const identitasTakDikenal = {};
  const aliasAktif = opts?.aliasIdentitas && typeof opts.aliasIdentitas === 'object' ? opts.aliasIdentitas : null;
  const logSiswaNonaktif = { kuis: 0, sesi: 0, absensi: 0, tugas: 0, latihan: 0 };
  const salah = [];

  const masukkan = (dok, fieldId, fieldNama, jenis) => {
    const pemilik = cariPemilikDok(indeks, dok, { fieldId, fieldNama });
    if (!pemilik) {
      // Log milik siswa nonaktif = BUKAN orphan; hitung terpisah supaya
      // peringatan identitas tidak salah tuduh.
      if (cariPemilikDok(indeksNonaktif, dok, { fieldId, fieldNama })) {
        logSiswaNonaktif[jenis] = (logSiswaNonaktif[jenis] || 0) + 1;
      } else if (aliasAktif && kunciIdentitasLog(dok, fieldId, fieldNama) && aliasAktif[kunciIdentitasLog(dok, fieldId, fieldNama)]) {
        // v1.5.1: REPARASI NON-DESTRUKTIF — log yatim yang sudah dipasangkan
        // admin ke siswa benar lewat alias settings dihitung ke siswa tujuan
        // (log asli TIDAK ditulis ulang; pemetaan hidup di settings/audit).
        const tujuan = aliasAktif[kunciIdentitasLog(dok, fieldId, fieldNama)];
        const pemilikAlias = indeks.find((e) => e.idSet.has(tujuan) || e.kunci === tujuan);
        if (pemilikAlias) {
          logDireparasi[jenis] = (logDireparasi[jenis] || 0) + 1;
          return bucket.get(pemilikAlias.kunci);
        }
        takDikenal[jenis] = (takDikenal[jenis] || 0) + 1;
      } else {
        takDikenal[jenis] = (takDikenal[jenis] || 0) + 1;
        // v1.5.1: contoh identitas yatim per kunci supaya tool reparasi admin
        // bisa menampilkan SIAPA yang harus dipasangkan (bukan cuma jumlah).
        const kunciLog = kunciIdentitasLog(dok, fieldId, fieldNama) || '(tanpa identitas)';
        if (Object.keys(identitasTakDikenal).length < 60) {
          const ent = (identitasTakDikenal[kunciLog] = identitasTakDikenal[kunciLog]
            || { kuis: 0, sesi: 0, absensi: 0, tugas: 0, latihan: 0 });
          ent[jenis] += 1;
        }
      }
      return null;
    }
    return bucket.get(pemilik.kunci);
  };

  // Kuis: studentNim = kode login siswa (bisa = docId students).
  for (const k of dataMentah.kuis || []) {
    const ms = waktuMs(k.submittedAt ?? k.createdAt);
    if (!dalamJendela(ms)) continue;
    const b = masukkan({ studentId: k.studentNim, studentName: k.studentName }, 'studentId', 'studentName', 'kuis');
    if (b) b.kuis.push({ ...k, tanggal: tanggalWib(ms) });
  }
  // Try out: hanya sesi SELESAI; waktu = waktuSelesai (fallback updatedAt).
  for (const s of dataMentah.sesi || []) {
    if (s.status !== 'selesai') continue;
    const ms = waktuSelesaiSesi(s);
    if (!dalamJendela(ms)) continue;
    const b = masukkan(s, 'studentId', 'studentName', 'sesi');
    if (!b) continue;
    const paket = paketById[s.paketId] || null;
    if (!paket) { salah.push({ jenis: 'sesi-tanpa-paket', sesiId: s.id || '', studentId: s.studentId || '' }); continue; }
    const agg = agregatSatuSesi(s, paket, soalMeta);
    b.sesiAgg.push({
      ...agg,
      tanggal: tanggalWib(ms),
      paketJudul: String(paket.judul || s.paketId || 'Try Out'),
      persen: nilaiSah(s.totalSkorPersen),
      paketId: s.paketId,
    });
  }
  // Absensi: tanggal/date string UTC.
  for (const a of dataMentah.absensi || []) {
    const tgl = String(a.tanggal || a.date || '').slice(0, 10);
    const ms = tgl ? waktuMs(tgl) : waktuMs(a.timestamp ?? a.createdAt);
    if (!dalamJendela(ms)) continue;
    const b = masukkan(a, 'studentId', a.namaSiswa !== undefined ? 'namaSiswa' : 'studentName', 'absensi');
    if (b) b.absensi.push(a);
  }
  // Tugas e-learning (nilai guru ada di `score`).
  for (const t of dataMentah.tugas || []) {
    const ms = waktuMs(t.submittedAt ?? t.createdAt);
    if (!dalamJendela(ms)) continue;
    const b = masukkan({ studentId: t.studentNim, studentName: t.studentName }, 'studentId', 'studentName', 'tugas');
    if (b) b.tugas.push({ ...t, tanggal: tanggalWib(ms) });
  }
  // Nilai guru legacy (koleksi `grades`; tak ada penulis UI aktif lagi).
  for (const g of dataMentah.nilaiGuru || []) {
    const ms = waktuMs(g.tanggal ?? g.createdAt);
    if (!dalamJendela(ms)) continue;
    const b = masukkan(g, 'studentId', 'studentName', 'kuis');
    if (b) b.nilaiGuru.push(g);
  }
  // Latihan harian (Leitner): terakhirDicoba = 'YYYY-MM-DD'.
  for (const p of dataMentah.progresSoal || []) {
    const ms = waktuMs(p.terakhirDicoba) ?? waktuMs(p.updatedAt);
    if (!dalamJendela(ms)) continue;
    const b = masukkan(p, 'studentId', '', 'latihan');
    if (!b) continue;
    const meta = soalMeta[p.soalId] || {};
    b.latihan.push({
      soalId: p.soalId,
      kode: kodeMapelDariNama(String(meta.mataPelajaran || meta.mapel || '')) || 'umum',
      materi: String(meta.materi || ''),
      kesulitan: bacaKesulitan(meta.kesulitan),
      kotak: Number(p.kotak) || 0,
      benarCount: Number(p.benarCount) || 0,
      salahCount: Number(p.salahCount) || 0,
      benarBerturut: Number(p.benarBerturut) || 0,
      terakhirDicoba: String(p.terakhirDicoba || ''),
    });
  }
  // XP (snapshot akumulatif — tidak berjendela, dilabeli jujur di dokumen).
  for (const pr of dataMentah.progresSiswa || []) {
    const b = masukkan({ studentId: pr.studentId || pr.id }, 'studentId', '', 'latihan');
    if (b && !b.progresSiswa) b.progresSiswa = pr;
  }

  const hasilSiswa = indeks.map((profil) => {
    const b = bucket.get(profil.kunci);
    return hitungRaportSiswa({
      profil, periode,
      kuis: b.kuis, sesiAgg: b.sesiAgg, absensi: b.absensi, tugas: b.tugas,
      nilaiGuru: b.nilaiGuru, latihan: b.latihan, progresSiswa: b.progresSiswa,
      tugasTerbit: dataMentah.tugasTerbit?.[profil.kunci] ?? null,
    });
  });

  // Log milik siswa yang ADA tapi di luar sasaran filter (bukan orphan):
  // dihitung dari bucket supaya peringatan identitas tak lagi salah tuduh.
  let logLuarSaringan = null;
  const sasaran = opts?.sasaran || null;
  if (sasaran && (sasaran.jenjang || sasaran.kelas)) {
    logLuarSaringan = { kuis: 0, sesi: 0, absensi: 0, tugas: 0, latihan: 0 };
    for (const e of indeks) {
      const semu = {
        jenjang: String(e.profil.jenjang || ''),
        studentKelas: String(e.profil.kelas || e.profil.kelasSekolah || e.profil.tingkatKelas || ''),
      };
      if (cocokSasaran(semu, sasaran)) continue;
      const b = bucket.get(e.kunci);
      logLuarSaringan.kuis += b.kuis.length;
      logLuarSaringan.sesi += b.sesiAgg.length;
      logLuarSaringan.absensi += b.absensi.length;
      logLuarSaringan.tugas += b.tugas.length;
      logLuarSaringan.latihan += b.latihan.length;
    }
  }

  return {
    periode,
    versiMesin: VERSI_MESIN,
    siswa: hasilSiswa,
    ringkasan: buatRingkasan(hasilSiswa, {
      logTakDikenal: takDikenal,
      logLuarSaringan,
      logDireparasi,
      identitasTakDikenal,
      logSiswaNonaktif: daftarNonaktif.length ? logSiswaNonaktif : null,
      siswaDikecualikan: daftarNonaktif.length
        ? { jumlah: daftarNonaktif.length, daftar: daftarNonaktif.slice(0, 20) }
        : null,
      dataBermasalah: salah.slice(0, 20),
    }),
  };
}

// ------------------------------------------------------------
// PENERBITAN (snapshot terkunci ke raport_final)
// ------------------------------------------------------------

const sanitasiId = (s) => String(s || '').replace(/[\\/]/g, '_').slice(0, 80);

/** ID dokumen deterministik → penerbitan idempoten (aman dijalankan ulang). */
export function kunciDokRaport(studentId, mapelKode, periodeLabel) {
  return `${sanitasiId(studentId)}__${sanitasiId(mapelKode)}__${sanitasiId(periodeLabel)}`;
}

/** Guard imutabilitas (blueprint §9.4): dokumen terkunci dari mesin otomatis
 * tidak boleh ditimpa diam-diam — baik oleh admin (tanpa alasan) maupun
 * oleh alur manual guru (syncAllScoresToRaport). */
export function bolehTimpaRaportFinal(dokExisting, { paksa = false, alasan = '' } = {}) {
  if (!dokExisting) return { boleh: true, alasan: '' };
  const terkunci = dokExisting.terkunci === true && dokExisting.sumber === 'otomatis';
  if (!terkunci) return { boleh: true, alasan: '' };
  if (paksa && String(alasan || '').trim().length >= 5) {
    return { boleh: true, alasan: String(alasan).trim() };
  }
  return { boleh: false, alasan: 'Dokumen rapor otomatis periode ini TERKUNCI. Terbitkan ulang dengan alasan tertulis (tercatat di audit) bila data sumber sudah dikoreksi.' };
}

/** Dokumen raport_final hanya untuk konsumsi akademik? (proses & tren
 * disimpan di dokumen blok:'proses' — tidak boleh ikut rata-rata mapel,
 * leaderboard, maupun dropdown siswa sampai Fase 2 merancangnya.) */
export function dokAkademikSaja(dok) {
  return !!dok && dok.blok !== 'proses';
}

/** Bangun dokumen siap-tulis dari hasil hitungRaportSiswa.
 * serverTimestamp TIDAK diisi di sini (mesin ini murni) — halaman penerbit
 * menambahkan createdAt/updatedAt sendiri. */
export function bangunDokumenRaport(hasil, { jejak = {} } = {}) {
  const common = {
    studentId: hasil.studentId,
    studentName: hasil.studentName,
    studentKelas: hasil.studentKelas,
    studentProgram: hasil.studentProgram,
    periode: hasil.periode,
    sumber: 'otomatis',
    terkunci: true,
    versiMesin: VERSI_MESIN,
    jejak: {
      dihitungPada: new Date().toISOString(),
      jendela: jejak.jendela || null,
      jumlahDokumenSumber: jejak.jumlahDokumenSumber || null,
      keterangan: 'Dihitung otomatis dari log aktivitas (kuis, try out, latihan harian, absensi, tugas). Setiap angka tertelusur ke dokumen sumber; snapshot tidak berubah setelah diterbitkan.',
    },
  };

  const docsAkademik = hasil.akademik.perMapel.map((m) => ({
    id: kunciDokRaport(hasil.studentId, m.kode, hasil.periode),
    data: {
      ...common,
      blok: 'akademik',
      mapel: m.nama,
      mapelKode: m.kode,
      tier: m.tier || tierBuktiMapel(m),
      nilai_akhir: m.nilaiAkhir,
      predikat: m.predikat,
      statusData: m.layak ? (hasil.akademik.statusData === 'lengkap' ? 'lengkap' : 'sebagian') : 'belum-cukup',
      mode_perhitungan: m.layak
        ? `Otomatis: ${Object.entries(m.bobotEfektif).map(([k, b]) => `${k} ${Math.round(b * 100)}%`).join(' + ')}`
        : 'Angka indikatif dari asesmen yang sudah dilaksanakan — dimatangkan otomatis oleh asesmen berikutnya',
      komponen_dipakai: ['kuis', 'tugas', 'ujian'].filter((k) => m.komponen[k].ada),
      detail_komponen: {
        kuis: { total: m.komponen.kuis.nilai, jumlah: m.komponen.kuis.jumlah },
        tugas: { total: m.komponen.tugas.nilai, jumlah: m.komponen.tugas.jumlah },
        ujian: { total: m.komponen.ujian.nilai, jumlah: m.komponen.ujian.jumlah, rincian: m.rincianUjian },
      },
      // null = belum terukur (JANGAN diganti 0 — lihat keputusan kepala berkas)
      detail_dimensi: Object.fromEntries(
        DIMENSI_KEYS_OTOMATIS.map((k) => [k, m.dimensi[k]?.nilai ?? null]),
      ),
      dimensi_sumber: Object.fromEntries(
        DIMENSI_KEYS_OTOMATIS.map((k) => [k, m.dimensi[k]?.sumber ?? '']),
      ),
      bukti: {
        kuis: m.komponen.kuis.jumlah,
        tugas: m.komponen.tugas.jumlah,
        ujian: m.rincianUjian,
      },
      catatan: hasil.catatan.filter((c) => c.startsWith(m.nama)),
      narasi: m.nilaiAkhir === null
        ? `Gambaran awal ${m.nama}: asesmen pertama pada periode berikutnya akan mengisi capaian ini secara otomatis.`
        : `Nilai ${m.nama} ${m.nilaiAkhir} (${m.predikat.huruf} — ${m.predikat.label}) dihitung otomatis dari ${m.komponen.kuis.jumlah} kuis, ${m.komponen.tugas.jumlah} tugas dinilai, dan ${m.rincianUjian.length} try out pada periode ${hasil.periode}.`,
    },
  }));

  const dokProses = {
    id: kunciDokRaport(hasil.studentId, 'PROSES', hasil.periode),
    data: {
      ...common,
      blok: 'proses',
      mapel: MAPEL_PROSES,
      mapelKode: 'PROSES',
      nilai_akhir: hasil.proses.nilaiProses,
      predikat: hasil.proses.predikat,
      statusData: hasil.proses.nilaiProses !== null ? 'lengkap' : 'belum-cukup',
      mode_perhitungan: `Otomatis: ${Object.entries(hasil.proses.bobotEfektif).map(([k, b]) => `${k} ${Math.round(b * 100)}%`).join(' + ') || 'tidak ada komponen terukur'}`,
      detail_proses: {
        kehadiran: hasil.proses.kehadiran,
        tugas: hasil.proses.tugas,
        latihan: hasil.proses.latihan,
        ketepatanWaktu: hasil.proses.ketepatanWaktu,
        integritas: hasil.proses.integritas,
        xp: hasil.proses.xp,
      },
      dimensi_global: Object.fromEntries(
        DIMENSI_KEYS_OTOMATIS.map((k) => [k, hasil.dimensi[k]?.nilai ?? null]),
      ),
      dimensi_global_sumber: Object.fromEntries(
        DIMENSI_KEYS_OTOMATIS.map((k) => [k, hasil.dimensi[k]?.sumber ?? '']),
      ),
      trenHarian: hasil.trenHarian,
      trenSkala: hasil.trenSkala,
      petaTopik: hasil.petaTopik,
      rekomendasi: hasil.rekomendasi,
      rataRataAkademik: hasil.akademik.rataRata,
      kelayakan: hasil.kelayakan,
      narasi: hasil.kelayakan.layakTerbit
        ? `Laporan proses & perkembangan ${hasil.studentName} periode ${hasil.periode}: kehadiran ${hasil.proses.kehadiran.persenHadir ?? '—'}%, ${hasil.proses.latihan.hariAktif} hari latihan mandiri, ${hasil.proses.integritas.jumlahPelanggaran} catatan pengawasan.`
        : `Laporan perkembangan ${hasil.studentName} periode ${hasil.periode} dirakit dari aktivitas yang sudah tercatat; asesmen berikutnya melengkapi gambaran capaian secara otomatis.`,
    },
  };

  return { docsAkademik, dokProses };
}

export default {
  VERSI_MESIN, MAPEL_PROSES, KALIBRASI_V1, SELISIH_WIB_MS,
  rentangPeriode, waktuMs, tanggalUtc, tanggalWib,
  cocokSasaran, buatRingkasan,
  tierBuktiDariHitungan, tierBuktiMapel, profilBuktiSiswa,
  normalisasiMapelKuis, namaMapel, bacaKesulitan,
  predikatDariNilai, timbangUlang, skalaKeNilai100, nilaiSah,
  bangunIndeksIdentitas, cariPemilikDok,
  agregatSatuSesi, nilaiUjianSesiMapel, waktuSelesaiSesi,
  hitungDimensi, hitungPetaTopik, statusTopik,
  hitungRaportSiswa, hitungRaportSemuaSiswa,
  kunciDokRaport, bolehTimpaRaportFinal, dokAkademikSaja, bangunDokumenRaport,
};
