// src/utils/raportCron.js
// ============================================================
// FASE 3 RAPORT OTOMATIS (21 Okt 2026) — LOGIKA PENJADWALAN (MURNI)
// ============================================================
// Blueprint ANALISIS-RAPORT-OTOMATIS.md §9 lapis 2: `api/raport-bulanan.js`
// dijalankan cron Vercel SETIAP HARI 00.05 WIB. Fungsi di berkas ini yang
// memutuskan (tanpa Firebase, tanpa Date.now() tersembunyi — semua waktu
// masuk sebagai parameter supaya bisa diuji deterministik):
//
//   1. Kapan cron boleh menerbitkan?  → hanya tanggal 1 (WIB), yaitu tepat
//      setelah satu bulan UTUH tertutup. Hari-hari lain = no-op (snapshot
//      terkunci tidak boleh dihitung ulang diam-diam — keputusan imutabel).
//   2. Periode apa yang diterbitkan?  → bulan yang baru selesai; PLUS
//      laporan besar 3 bulan bila bulan itu menutup jendela trimester.
//      Trimester diselaraskan ke awal semester bimbel (Agustus):
//      Agu–Okt, Nov–Jan, Feb–Apr, Mei–Jul.
//   3. Zona waktu: WIB (UTC+7). Cron Vercel menulis jadwal dalam UTC, jadi
//      00.05 WIB = '5 17 * * *'. Perhitungan "tanggal berapa sekarang"
//      WAJIB pakai WIB — kalau pakai UTC, penerbitan mundur 7 jam dan
//      bulan yang tertutup bisa salah di malam pergantian bulan.
//
// Aturan jujur yang diwarisi dari mesin (raportOtomatis.js):
//   - idempoten: penerbitan berulang tidak menimpa dokumen terkunci
//     (guard bolehTimpaRaportFinal di sisi API, tanpa paksa).
//   - tidak pernah mengarang periode: format salah → throw, bukan tebak.
// ============================================================

/** Selisih WIB terhadap UTC dalam ms (UTC+7, tanpa DST — Indonesia tidak
 * memakai DST, jadi konstanta ini sah sepanjang tahun).
 * v1.1: SATU SUMBER di utils/raportOtomatis.js (jendela mesin); berkas ini
 * mengekspor ulang supaya jadwal cron dan jendela isi raport tak berpisah. */
import { SELISIH_WIB_MS } from './raportOtomatis.js';

export { SELISIH_WIB_MS };

/** Bulan awal trimester/semester bimbel (Agustus = 8). Jendela laporan
 * besar 3 bulan diselaraskan ke sini: Agu–Okt, Nov–Jan, Feb–Apr, Mei–Jul. */
export const BULAN_AWAL_TRIMESTER = 8;

/** Urai waktu apa pun yang dipahami Date (ISO string / ms) ke komponen
 * kalender WIB. Input tak valid → null (jujur, tidak menebak). */
export function waktuWib(waktu) {
  const ms = typeof waktu === 'number' ? waktu : Date.parse(String(waktu || ''));
  if (!Number.isFinite(ms)) return null;
  const d = new Date(ms + SELISIH_WIB_MS);
  return {
    ms,
    tahun: d.getUTCFullYear(),
    bulan: d.getUTCMonth() + 1, // 1..12
    tanggal: d.getUTCDate(),
    jam: d.getUTCHours(),
    menit: d.getUTCMinutes(),
  };
}

/** 'YYYY-MM' dari (tahun, bulan) — format kunci periode mesin raport. */
export function labelBulanPeriode(tahun, bulan) {
  return `${tahun}-${String(bulan).padStart(2, '0')}`;
}

/** Bulan sebelum (tahun, bulan) — lintas tahun ditangani (Jan → Des). */
export function bulanSebelumnya(tahun, bulan) {
  return bulan === 1 ? { tahun: tahun - 1, bulan: 12 } : { tahun, bulan: bulan - 1 };
}

/** Apakah bulan ini MENUTUP sebuah jendela trimester (relatif terhadap
 * bulanAwal)? Mis. awal=8 → Oktober (offset 2) menutup Agu–Okt, Januari
 * (offset 5) menutup Nov–Jan. Mengembalikan awal jendelanya bila ya. */
export function penutupTrimester(tahun, bulan, bulanAwal = BULAN_AWAL_TRIMESTER) {
  const offset = ((((bulan - bulanAwal) % 12) + 12) % 12); // 0..11
  if (offset % 3 !== 2) return null;
  let mt = bulan - 2;
  let yt = tahun;
  if (mt < 1) { mt += 12; yt -= 1; }
  return { tahun: yt, bulan: mt };
}

/** Rencana penerbitan untuk SATU waktu eksekusi cron.
 * @param {string|number} isoSekarang waktu eksekusi (ISO/ms)
 * @param {{bulanAwalTrimester?:number, paksaTanggalSatu?:boolean}} opts
 *   paksaTanggalSatu=true dipakai test/manual untuk melewati syarat tanggal 1.
 * @returns {{jalan:boolean, alasan:string, periode:Array<object>, wib:object|null}}
 *   periode = daftar opsi siap-sodor ke rentangPeriode(): {bulan} atau
 *   {mulai, selesai}. Kosong bila hari ini bukan giliran terbit. */
export function rencanaTerbitCron(isoSekarang, opts = {}) {
  const wib = waktuWib(isoSekarang);
  if (!wib) {
    return { jalan: false, alasan: 'Waktu eksekusi tidak valid — cron menolak menerbitkan (tidak menebak periode).', periode: [], wib: null };
  }
  const bulanAwal = Number.isFinite(opts.bulanAwalTrimester) ? opts.bulanAwalTrimester : BULAN_AWAL_TRIMESTER;
  if (!opts.paksaTanggalSatu && wib.tanggal !== 1) {
    return {
      jalan: false,
      alasan: `Bukan tanggal 1 WIB (hari ini ${wib.tanggal}) — tidak ada bulan yang baru tertutup; snapshot terkunci tidak dihitung ulang.`,
      periode: [],
      wib,
    };
  }
  // Bulan yang BARU saja tertutup = bulan sebelum tanggal eksekusi.
  const prev = bulanSebelumnya(wib.tahun, wib.bulan);
  const periode = [{ bulan: labelBulanPeriode(prev.tahun, prev.bulan) }];
  const awal = penutupTrimester(prev.tahun, prev.bulan, bulanAwal);
  if (awal) {
    periode.push({
      mulai: labelBulanPeriode(awal.tahun, awal.bulan),
      selesai: labelBulanPeriode(prev.tahun, prev.bulan),
    });
  }
  return {
    jalan: true,
    alasan: `Tanggal 1 WIB — menerbitkan ${periode.map((p) => (p.bulan || `${p.mulai}..${p.selesai}`)).join(' + ')}.`,
    periode,
    wib,
  };
}

/** Parse override manual `?periode=` di API: '2026-09' atau
 * '2026-08..2026-10', boleh daftar dipisah koma. Format salah → throw
 * (API menjawab 400; lebih baik gagal keras daripada menerbitkan periode
 * yang salah ke dokumen TERKUNCI). */
export function parseOverridePeriode(str) {
  const bagian = String(str || '').split(',').map((s) => s.trim()).filter(Boolean);
  if (!bagian.length) throw new Error("Parameter 'periode' kosong.");
  const polaBulan = /^(\d{4})-(0[1-9]|1[0-2])$/;
  return bagian.map((b) => {
    if (polaBulan.test(b)) return { bulan: b };
    const m = /^(\d{4}-(?:0[1-9]|1[0-2]))\.\.(\d{4}-(?:0[1-9]|1[0-2]))$/.exec(b);
    if (m) return { mulai: m[1], selesai: m[2] };
    throw new Error(`Format periode tidak dikenal: '${b}' (contoh sah: 2026-09 atau 2026-08..2026-10).`);
  });
}

export default {
  SELISIH_WIB_MS, BULAN_AWAL_TRIMESTER,
  waktuWib, labelBulanPeriode, bulanSebelumnya, penutupTrimester,
  rencanaTerbitCron, parseOverridePeriode,
};
