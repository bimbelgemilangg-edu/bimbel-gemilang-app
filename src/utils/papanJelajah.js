// src/utils/papanJelajah.js
// ============================================================
// Modul MURNI untuk "Papan Jelajah" siswa: daftar try out bertema luar
// angkasa (kartu pos maskot astronot) + Papan Analitik pengganti
// leaderboard (tren mingguan, kecepatan, evaluasi, tips) -- khusus TKA/UTBK.
//
// 🚀 KENAPA ADA (permintaan owner 13 Okt 2026 malam): tampilan daftar try out
// lama menumpuk paket basi; owner minta (a) yang muncul hanya misi mendatang /
// hari itu, (b) kartu pos maskot pegang papan mapel (asset postcard yang ia
// kirim, dipotong jadi sprite 6x5 lewat CSS), (c) leaderboard diganti papan
// analisis nilai TKA/UTBK per minggu, (d) deskripsi paket diisi CP
// Kemendikbud -- jawaban kita: YA, deterministik dulu dari kisi-kisi CP yang
// sudah bundel di kisiKisiTkaUkb.js, tanpa memanggil AI (pagar kuota Vercel).
// ============================================================
import { VERSI_KISI, MAPEL_TKA_RESMI } from './kisiKisiTkaUtbk.js';

/** Label 30 kartu pos maskot, urutan baris-major sesuai asset sprite 6x5. */
export const PAPAN_MASCOT = [
  'Pendidikan Agama & Budi Pekerti', 'Pendidikan Pancasila', 'Bahasa Indonesia', 'Matematika', 'IPA', 'IPS',
  'PJOK', 'Seni dan Budaya', 'Bahasa Inggris', 'Muatan Lokal', 'Koding & Kecerdasan Artifisial', 'Bahasa Arab',
  'Fisika', 'Kimia', 'Biologi', 'Matematika Tingkat Lanjut', 'Informatika', 'Ekonomi',
  'Sosiologi', 'Geografi', 'Sejarah', 'Antropologi', 'Bahasa Indonesia Tingkat Lanjut', 'Bahasa Inggris Tingkat Lanjut',
  'Bahasa Jerman', 'Bahasa Prancis', 'Bahasa Jepang', 'Bahasa Korea', 'Bahasa Mandarin', 'Produk/Projek Kreatif & Kewirausahaan',
];

/** Kunci sinonim -> indeks kartu. Entri spesifik WAJIB dulu (scan includes). */
const ALIAS_MASCOT = [
  ['pendidikan agama', 0], ['budi pekerti', 0],
  ['pancasila', 1], ['ppkn', 1], ['pkn', 1],
  ['bahasa indonesia tingkat lanjut', 22], ['bindo tingkat lanjut', 22],
  ['bahasa inggris tingkat lanjut', 23], ['english advanced', 23],
  ['matematika tingkat lanjut', 15], ['matematika lanjut', 15],
  ['penalaran umum', 10], ['tps pu', 10], ['koding', 10], ['kecerdasan artifisial', 10],
  ['pengetahuan kuantitatif', 3], ['penalaran matematika', 3], ['literasi matematika', 3],
  ['pemahaman bacaan', 2], ['literasi bahasa indonesia', 2],
  ['literasi bahasa inggris', 8],
  ['bahasa indonesia', 2], ['bindo', 2],
  ['matematika', 3], ['math', 3],
  ['ilmu pengetahuan alam', 4], ['ipas', 4], ['ipa', 4],
  ['ilmu pengetahuan sosial', 5], ['ips', 5],
  ['pjok', 6], ['penjaskes', 6], ['olahraga', 6],
  ['seni', 7],
  ['bahasa inggris', 8], ['english', 8],
  ['muatan lokal', 9], ['mulok', 9],
  ['bahasa arab', 11], ['arab', 11],
  ['fisika', 12], ['kimia', 13], ['biologi', 14],
  ['informatika', 16], ['tik', 16],
  ['ekonomi', 17], ['akuntansi', 17],
  ['sosiologi', 18], ['geografi', 19], ['sejarah', 20], ['antropologi', 21],
  ['bahasa jerman', 24], ['jerman', 24], ['bahasa prancis', 25], ['prancis', 25],
  ['bahasa jepang', 26], ['jepang', 26], ['bahasa korea', 27], ['korea', 27],
  ['mandarin', 28],
  ['kewirausahaan', 29], ['projek kreatif', 29], ['produk', 29],
];

export const KOLOM_MASCOT = 6;
export const BARIS_MASCOT = 5;

/**
 * Posisi potong sprite maskot untuk sebuah nama mapel/subtes.
 * @param {string} nama nama mapel / subtes UTBK / judul bebas bersinonim
 * @returns {{indeks:number,kolom:number,baris:number,xPct:number,yPct:number,label:string}|null}
 *   null bila tak ada padanan -- UI wajib punya fallback (kartu bintang).
 */
export function posisiMascotUntukMapel(nama = '') {
  const h = String(nama || '').trim().toLowerCase();
  if (!h) return null;
  const hit = ALIAS_MASCOT.find(([k]) => h.includes(k));
  if (!hit) return null;
  const indeks = hit[1];
  const kolom = indeks % KOLOM_MASCOT;
  const baris = Math.floor(indeks / KOLOM_MASCOT);
  return {
    indeks,
    kolom,
    baris,
    // Rumus sprite seragam: posisi persen = kolom/(n-1)*100 per sumbu.
    xPct: kolom * (100 / (KOLOM_MASCOT - 1)),
    yPct: baris * (100 / (BARIS_MASCOT - 1)),
    label: PAPAN_MASCOT[indeks],
  };
}

const RENTANG_KELAS = { SD: 'kelas 1-6', SMP: 'kelas 7-9', SMA: 'kelas 10-12', SMK: 'kelas 10-12' };

/**
 * Deskripsi paket bergaya kartu pos, berisi rujukan CP Kemendikbudristek.
 * Deterministik (tanpa AI) supaya tidak memakan kuota fungsi serverless dan
 * selalu bisa diaudit; versi polesan AI boleh menyusul DI ATAS teks ini.
 * @param {{jenjang?:string,jenisUjian?:string,komposisi?:Array<{mapel:string,jumlah:number}>,durasiMenit?:number,jumlahSubtes?:number,tampilkanPembahasan?:boolean}} p
 * @returns {string}
 */
export function buatDeskripsiPaket(p = {}) {
  const jenjang = String(p.jenjang || '').trim().toUpperCase();
  const jenis = String(p.jenisUjian || '').trim().toLowerCase();
  const komposisi = (Array.isArray(p.komposisi) ? p.komposisi : [])
    .filter((k) => Number(k?.jumlah) > 0)
    .map((k) => `${Number(k.jumlah)} soal ${String(k.mapel || '').trim()}`)
    .join(' + ');
  let inti;
  if (jenis.includes('utbk')) {
    inti = `Paket latihan UTBK: butir dipilih per subtes mengikuti kisi-kisi UTBK yang diterbitkan panitia SNBT Kemendikbudristek (kisi versi ${VERSI_KISI}).`;
  } else if (jenis.includes('tka')) {
    const resmi = (MAPEL_TKA_RESMI[jenjang] || []).join(' dan ');
    inti = `Paket TKA jenjang ${jenjang || '-'}${komposisi ? `: ${komposisi}` : ''}. `
      + `Butir dipilih sesuai Capaian Pembelajaran (CP) ${resmi || 'tiap mapel'} untuk SATU jenjang utuh `
      + `(${RENTANG_KELAS[jenjang] || 'seluruh kelas'}) berdasarkan kisi-kisi TKA Kemendikbudristek (versi ${VERSI_KISI}).`;
  } else {
    inti = `${komposisi || 'Butir campuran'} sesuai kurikulum sekolah masing-masing.`;
  }
  const durasi = Number(p.durasiMenit) > 0
    ? ` Durasi ${Number(p.durasiMenit)} menit${Number(p.jumlahSubtes) > 0 ? ` dalam ${Number(p.jumlahSubtes)} subtes` : ''}.`
    : '';
  const pembahasan = p.tampilkanPembahasan === false
    ? ' Pembahasan tidak ditampilkan di layar hasil - kirim kode paket ke tentor untuk bedah soal.'
    : '';
  return `${inti}${durasi}${pembahasan}`;
}

const BULAN_ID = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
export const IDEAL_DETIK_PER_SOAL = 90;

/** Label pekan (Senin UTC) untuk pengelompokan tren mingguan. */
export function labelPekan(ms) {
  const hari = (new Date(ms).getUTCDay() + 6) % 7;
  const senin = new Date(ms - hari * 86400000);
  return `Pekan ${senin.getUTCDate()} ${BULAN_ID[senin.getUTCMonth()]}`;
}

/**
 * Ringkasan analitik TKA/UTBK seorang siswa (pengganti leaderboard).
 * @param {Array<{nama?:string,jenisUjian?:string,totalSkorPersen?:number,waktuSelesaiMs?:number,createdAtMs?:number,totalSoal?:number,subtes?:Array<{nama:string,skorPersen?:number}>}>} baris
 * @returns {{tren:Array<{label:string,skor:number,delta:number|null}>,kecepatan:{detikPerSoal:number,wajar:boolean,nama:string}|null,subtesRata:Array<{nama:string,skor:number}>,tips:string[],evaluasi:string,jumlahSesi:number}}
 */
export function hitungAnalitik(baris = []) {
  const kosong = { tren: [], kecepatan: null, subtesRata: [], tips: [], evaluasi: '', jumlahSesi: 0 };
  // 🛡️ AUDIT 2026-10-13: waktuSelesaiMs WAJIB ada (!= null) -- dulu cuma
  // dicek Number.isFinite(Number(x)), padahal Number(null) === 0 sehingga
  // sesi tanpa cap waktu selesai LOLOS filter dan melahirkan baris tren
  // sampah "Pekan 29 Des" (epoch 1969) + delta palsu. Sesi begini lebih
  // baik diabaikan daripada merusak grafik.
  const tka = (Array.isArray(baris) ? baris : [])
    .filter((b) => /tka|utbk/i.test(String(b?.jenisUjian || '')) && b?.waktuSelesaiMs != null && Number.isFinite(Number(b.waktuSelesaiMs)))
    .map((b) => ({ ...b, waktuSelesaiMs: Number(b.waktuSelesaiMs), skor: Math.round(Number(b.totalSkorPersen) || 0) }))
    .sort((a, b) => a.waktuSelesaiMs - b.waktuSelesaiMs);
  if (!tka.length) return kosong;

  const pekan = new Map();
  tka.forEach((b) => {
    const label = labelPekan(b.waktuSelesaiMs);
    if (!pekan.has(label)) pekan.set(label, { label, skor: [], ms: b.waktuSelesaiMs });
    pekan.get(label).skor.push(b.skor);
  });
  const tren = [...pekan.values()]
    .sort((a, b) => a.ms - b.ms)
    .map((g) => ({ label: g.label, skor: Math.round(g.skor.reduce((x, y) => x + y, 0) / g.skor.length) }))
    .map((g, i, arr) => ({ ...g, delta: i === 0 ? null : g.skor - arr[i - 1].skor }));

  const terakhir = tka[tka.length - 1];
  let kecepatan = null;
  // 🛡️ AUDIT 2026-10-13: createdAtMs null -> NaN (bukan 0!). Dulu
  // Number(null) === 0 lolos Number.isFinite sehingga kecepatan dihitung
  // dari epoch 1969: "~17 juta detik/soal". Tanpa waktu mulai yang sah,
  // kartu tempo disembunyikan (kecepatan tetap null).
  const mulai = terakhir.createdAtMs != null ? Number(terakhir.createdAtMs) : NaN;
  if (Number.isFinite(mulai) && terakhir.waktuSelesaiMs > mulai && Number(terakhir.totalSoal) > 0) {
    const detikPerSoal = Math.round((terakhir.waktuSelesaiMs - mulai) / 1000 / Number(terakhir.totalSoal));
    kecepatan = { detikPerSoal, wajar: detikPerSoal <= IDEAL_DETIK_PER_SOAL, nama: String(terakhir.nama || 'try out terakhir') };
  }

  const agregatSubtes = new Map();
  tka.forEach((b) => (Array.isArray(b.subtes) ? b.subtes : []).forEach((s) => {
    const nama = String(s?.nama || '').trim();
    if (!nama || !Number.isFinite(Number(s?.skorPersen))) return;
    if (!agregatSubtes.has(nama)) agregatSubtes.set(nama, []);
    agregatSubtes.get(nama).push(Number(s.skorPersen));
  }));
  const subtesRata = [...agregatSubtes.entries()]
    .map(([nama, arr]) => ({ nama, skor: Math.round(arr.reduce((x, y) => x + y, 0) / arr.length) }))
    .sort((a, b) => b.skor - a.skor);

  const tips = [];
  const deltaTerakhir = tren.length > 1 ? tren[tren.length - 1].delta : null;
  if (deltaTerakhir !== null && deltaTerakhir >= 5) tips.push(`📈 ${tren[tren.length - 1].label}: skor rata-rata naik +${deltaTerakhir} poin dari pekan sebelumnya. Pertahankan ritmenya!`);
  if (deltaTerakhir !== null && deltaTerakhir <= -5) tips.push(`📉 Skor pekan ini turun ${Math.abs(deltaTerakhir)} poin - bukan bencana, lihat evaluasi subtes di bawah untuk tahu apa yang perlu dilatih.`);
  const lemah = subtesRata.length ? subtesRata[subtesRata.length - 1] : null;
  if (lemah && lemah.skor < 75) tips.push(`🎯 Fokus latihan: ${lemah.nama} (rata-rata ${lemah.skor}%). Minta tentor menjadwalkan bedah soal subtes ini.`);
  if (kecepatan && !kecepatan.wajar) tips.push(`⏱️ Tempo kerjamu ~${kecepatan.detikPerSoal} detik/soal (ideal ≤ ${IDEAL_DETIK_PER_SOAL} detik/soal). Latih paket bertimer supaya tidak kehabisan waktu di subtes akhir.`);
  if (kecepatan && kecepatan.wajar) tips.push(`⏱️ Tempo kerjamu sehat (~${kecepatan.detikPerSoal} detik/soal). Jaga pola ini saat hari-H.`);
  if (tren.length < 2) tips.push('🚀 Grafik tren butuh minimal dua pekan data - ikuti try out TKA/UTBK setiap Sabtu supaya kenaikan nilaimu terlihat.');

  let evaluasi = '';
  if (subtesRata.length) {
    const kuat = subtesRata[0];
    const arah = deltaTerakhir === null ? 'stabil' : deltaTerakhir > 0 ? 'naik' : deltaTerakhir < 0 ? 'turun' : 'stabil';
    evaluasi = `Subtes terkuat: ${kuat.nama} (${kuat.skor}%). `
      + (lemah && lemah.nama !== kuat.nama ? `Subtes terlemah: ${lemah.nama} (${lemah.skor}%). ` : '')
      + `Arah tren skor TKA/UTBK-mu: ${arah}.`;
  }
  return { tren, kecepatan, subtesRata, tips, evaluasi, jumlahSesi: tka.length };
}

/**
 * Potong daftar id jadi chunk kecil untuk query Firestore `where(documentId(), 'in', ...)`.
 * Firestore membatasi operator 'in' maksimal 30 nilai per query; halaman
 * Papan Jelajah memakainya untuk mengambil paket RIWAYAT (arsip/nonaktif)
 * milik sesi lama siswa supaya jenisUjian/totalSoal analitik tidak hilang.
 * Murni + deterministik: id kosong dibuang, duplikat dirapikan, urutan dijaga.
 * @param {Array<string>} ids
 * @param {number} [batas=30]
 * @returns {Array<Array<string>>}
 */
export function potongUntukQuery(ids, batas = 30) {
  const bersih = [...new Set((Array.isArray(ids) ? ids : []).map((x) => String(x ?? '').trim()).filter(Boolean))];
  const n = Number.isFinite(Number(batas)) && Number(batas) > 0 ? Math.floor(Number(batas)) : 30;
  const hasil = [];
  for (let i = 0; i < bersih.length; i += n) hasil.push(bersih.slice(i, i + n));
  return hasil;
}

export default { PAPAN_MASCOT, posisiMascotUntukMapel, buatDeskripsiPaket, hitungAnalitik, labelPekan, potongUntukQuery, IDEAL_DETIK_PER_SOAL };
