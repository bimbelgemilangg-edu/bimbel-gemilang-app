// src/utils/raportCetak.js
// ============================================================
// RAPORT OTOMATIS — LAPISAN PRESENTASI & CETAK (Fase 2, 21 Okt 2026)
// ============================================================
// Blueprint ANALISIS-RAPORT-OTOMATIS.md §9 (keputusan owner #4): admin
// mengunduh PDF raport PER SISWA atau PER JENJANG (massal) memakai engine
// cetak yang sudah distabilkan (cetakLewatIframe di utils/kwitansi.js —
// font siap, gambar ter-decode, @page A4). Berkas ini membangun HTML-nya.
//
// ATURAN KERAS (sama dengan mesin raportOtomatis.js):
//   1. MURNI — tidak boleh mengimpor Firebase/DOM. Masukan = dokumen
//      snapshot (bentuk keluaran bangunDokumenRaport ATAU dokumen datar
//      hasil baca Firestore), keluaran = string HTML/SVG. Bisa diuji di
//      Node (tests/raportCetak.test.mjs).
//   2. TIDAK PERNAH MENGARANG — nilai null dicetak '—', dimensi null
//      dicetak 'belum terukur', komponen belum terukur TIDAK dinolkan;
//      keterangan redistribusi bobot ikut tercetak.
//   3. Semua teks dinamis lewat escapeHtml (nama siswa/paket/catatan
//      berasal dari input pengguna — cetak tidak boleh jadi celah XSS).
//   4. Pelanggaran integritas = CATATAN (keputusan owner #3): dicetak
//      apa adanya dengan kalimat "nilai tidak dipotong".
//
// Pemakai:
//   - /admin/raport         → cetak per siswa & massal per jenjang/kelas
//   - LaporanOrangTuaPage   → cetak raport terbit untuk satu siswa
//   - StudentSmartReport    → helper tampil (kelompokDokOtomatis,
//                             poinSparkline, labelPeriodeManusiawi)
// ============================================================

import { WATERMARK } from './fieldButirSoal.js';
import { predikatDariNilai, KALIBRASI_V1 } from './raportOtomatis.js';
import { narasiCapaianSiswa, ringkasBahanOtomatis } from './laporanBelajar.js';

// ------------------------------------------------------------
// DASAR
// ------------------------------------------------------------

/** Escape teks apa pun agar aman disisipkan ke HTML. */
export function escapeHtml(v) {
  return String(v ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export const BULAN_ID = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
];

/** '2026-08' → 'Agustus 2026'; '2026-08..2026-10' → 'Agustus–Oktober 2026
 * (laporan besar)'. String tak dikenal dikembalikan apa adanya (jujur). */
export function labelPeriodeManusiawi(periode) {
  const s = String(periode || '').trim();
  const parseBulan = (x) => {
    const m = /^(\d{4})-(\d{2})$/.exec(String(x || '').trim());
    if (!m) return null;
    const mo = Number(m[2]);
    if (mo < 1 || mo > 12) return null;
    return { tahun: Number(m[1]), bulan: BULAN_ID[mo - 1] };
  };
  if (s.includes('..')) {
    const [a, b] = s.split('..');
    const pa = parseBulan(a); const pb = parseBulan(b);
    if (pa && pb) {
      const tahun = pa.tahun === pb.tahun ? String(pa.tahun) : `${pa.tahun}–${pb.tahun}`;
      return `${pa.bulan}–${pb.bulan} ${tahun} (laporan besar)`;
    }
    return s;
  }
  const p = parseBulan(s);
  return p ? `${p.bulan} ${p.tahun}` : s;
}

/** Normalisasi dokumen: {id,data} (keluaran bangunDokumenRaport) maupun
 * dokumen datar {id,...data} (hasil baca Firestore) → data-nya saja. */
export function dataDok(d) {
  if (!d) return null;
  return d.data && typeof d.data === 'object' ? d.data : d;
}

/** Label dimensi yang konsisten dengan mesin & UI siswa. */
export const DIMENSI_LABEL = {
  pemahaman: 'Pemahaman',
  analisis: 'Analisis',
  ketelitian: 'Ketelitian',
  waktu: 'Waktu',
  dayaTangkap: 'Daya Tangkap',
};
export const DIMENSI_KEYS = Object.keys(DIMENSI_LABEL);

export const warnaPredikatHuruf = (huruf) => (
  { A: '#166534', B: '#1d4ed8', C: '#b45309', D: '#991b1b' }[huruf] || '#64748b'
);

export const warnaStatusTopik = (status) => (
  { hijau: '#16a34a', kuning: '#ca8a04', merah: '#dc2626', abu: '#94a3b8', tipis: '#94a3b8' }[status] || '#94a3b8'
);

/** v1.2: peta topik SIAP TAMPIL — snapshot lama (mesin v1.1) masih menyimpan
 * status 'merah' untuk topik berbukti 1 soal; gerbang bukti diterapkan ULANG
 * di lapisan tampilan supaya wajah v1.2 berlaku tanpa menerbitkan ulang
 * snapshot terkunci (janji kunci tetap utuh). */
export function petaTampil(petaTopik = []) {
  const min = KALIBRASI_V1.topikMinimalBukti;
  const tipisSemu = (t) => t.status === 'tipis' || t.status === 'abu' || (t.status === 'merah' && t.dicoba < min);
  return {
    tipis: petaTopik.filter(tipisSemu),
    berwarna: petaTopik.filter((t) => !tipisSemu(t)),
  };
}

/** v1.2: rekomendasi dihitung ulang dari peta (merah berbukti cukup) dengan
 * bahasa rencana pendampingan — string lama ('Perkuat X — akurasi N% < 50%')
 * di snapshot lama tidak lagi dipamerkan ke orang tua. */
export function rekomendasiTampil(petaTopik = []) {
  const min = KALIBRASI_V1.topikMinimalBukti;
  return petaTopik
    .filter((t) => t.status === 'merah' && t.dicoba >= min)
    .slice(0, 6)
    .map((t) => `Pendampingan terfokus: topik "${t.topik}" (${t.mapelNama}) — akurasi ${t.akurasi}% dari ${t.dicoba} soal; Gemilang menjadwalkan latihan terbimbing untuk topik ini.`);
}

// ------------------------------------------------------------
// v1.3 — LAPORAN NARATIF OTOMATIS (keputusan owner 31 Okt 2026): orang tua
// menerima SATU laporan lengkap berbahasa manusia. Semua catatan bernada
// 'data belum cukup/lengkap/valid' DIHILANGKAN dari cetakan — ketiadaan
// asesmen disampaikan sebagai kalimat netral-ke-depan, bukan vonis.
// ------------------------------------------------------------

/**bersihkan bocoran internal seperti '(v1)' dari teks tampilan. */
export const bersihkanV1 = (t) => String(t || '').replace(/\s*\(v1\)/g, '').trim();

/** Deskripsi otomatis SATU mapel: kalimat utuh, tanpa frasa 'belum cukup'. */
export function deskripsiMapel(d = {}) {
  const kom = d.detail_komponen || {};
  const hadir = ['kuis', 'tugas', 'ujian'].filter((k) => kom[k] && Number.isFinite(kom[k].total));
  const titik = hadir.reduce((n, k) => n + (kom[k].jumlah ?? 0), 0);
  const sumber = hadir.map((k) => ({ kuis: 'kuis', tugas: 'tugas', ujian: 'try out/ujian' })[k]).join(' + ');
  if (!hadir.length) return 'Belum ada asesmen mapel ini pada periode ini; capaian akan terisi otomatis begitu kuis atau try out pertama dilaksanakan.';
  if (d.statusData === 'lengkap') return `Capaian final dari ${sumber} (${titik} titik nilai) — predikat ${d.predikat?.huruf || '—'}.`;
  return `Gambaran awal capaian dari ${sumber} (${titik} titik nilai), predikat ${d.predikat?.huruf || '—'}; angka ini dimatangkan otomatis oleh asesmen berikutnya.`;
}

/** Narasi laporan untuk orang tua: 5-7 kalimat utuh, selalu lengkap,
 * strengths-first, tren, integritas, dan rencana pendampingan. */
export function narasiLaporan(m = {}) {
  const idn = m.identitas || {};
  const p = m.proses || {};
  const det = p.detail_proses || {};
  const kalimat = [];
  kalimat.push(`${idn.nama || 'Ananda'} (${idn.kelas || '—'}) menerima laporan periode ${labelPeriodeManusiawi(m.periode || '')} yang seluruhnya dihitung otomatis oleh ${NAMA_ASISTEN} dari log aktivitas belajar.`);
  const kh = det.kehadiran || null;
  if (kh && kh.total > 0) {
    kalimat.push(`Kehadiran tercatat ${kh.persenHadir}% (${kh.hadir} dari ${kh.total} sesi diikuti)${kh.alpha ? `; ${kh.alpha} sesi tanpa keterangan menjadi bahan binaan wali — bukan pengurang nilai` : ''}.`);
  } else {
    kalimat.push('Catatan kehadiran periode ini belum masuk sistem; sesi berikutnya akan terhitung otomatis.');
  }
  const lat = det.latihan || null;
  if (lat && lat.hariAktif > 0) {
    kalimat.push(`Semangat belajar mandiri terlihat dari ${lat.hariAktif} hari latihan dan ${lat.soalDikerjakan} soal yang dikerjakan di luar jam kelas.`);
  } else {
    kalimat.push('Latihan mandiri mulai dirintis periode ini; ritme pekanan akan didampingi tentor.');
  }
  const angka = (m.akademik || []).filter((d) => Number.isFinite(d.nilai_akhir));
  if (angka.length) {
    const terbaik = [...angka].sort((a, b) => b.nilai_akhir - a.nilai_akhir)[0];
    kalimat.push(`Capaian akademik terukur pada ${angka.length} mapel melalui kuis/tugas/try out yang dilaksanakan guru; capaian tertinggi ${terbaik.mapel} sebesar ${terbaik.nilai_akhir} (predikat ${terbaik.predikat?.huruf || '—'}).`);
  } else {
    kalimat.push('Pada periode ini guru belum menjadwalkan kuis atau try out untuk mapel ananda; capaian akademik akan terisi otomatis begitu asesmen pertama dilaksanakan.');
  }
  const sem = trenSemangat(p.trenHarian || []);
  if (sem) kalimat.push(`Tren belajar harian ${sem.teks} (grafik bukti terlampir pada Blok C).`);
  else kalimat.push('Tren belajar harian dirakit dari aktivitas berskor dan tampil sebagai grafik pada Blok C.');
  const ig = det.integritas || null;
  if (ig && ig.jumlahPelanggaran > 0) {
    kalimat.push(`Terdapat ${ig.jumlahPelanggaran} catatan pengawasan ujian yang menjadi bahan pembinaan bersama tentor — nilai tidak dipotong.`);
  } else {
    kalimat.push('Pengerjaan ananda bersih dari catatan integritas.');
  }
  const fokus = rekomendasiTampil(p.petaTopik || []);
  if (fokus.length) {
    const topik = (p.petaTopik || []).filter((t) => t.status === 'merah' && t.dicoba >= KALIBRASI_V1.topikMinimalBukti).slice(0, 2).map((t) => t.topik);
    kalimat.push(`Periode depan, pendampingan Gemilang difokuskan pada topik ${topik.join(' dan ')}.`);
  } else {
    kalimat.push('Tidak ada fokus khusus periode depan — pertahankan ritme baik ini.');
  }
  return kalimat.join(' ');
}

// ------------------------------------------------------------
// v1.2 — RAPOR RAMAH ORANG TUA (keluhan owner 31 Okt 2026: rapor terasa
// 'tidak valid' karena banjir merah n=1 & bahasa mesin). Tiga tambahan murni
// sisi cetak: kotak 'cara membaca', daftar kekuatan otomatis (strengths-first
// ala laporan bimbel internasional), dan panah tren semangat dari tren harian.
// ------------------------------------------------------------

/** Arah tren semangat: bandingkan paruh akhir vs paruh awal tren harian.
 * null bila titik <4 (jujur: belum cukup untuk membaca arah). */
export function trenSemangat(trenHarian = []) {
  const skor = trenHarian.map((t) => t && t.skor).filter((x) => Number.isFinite(x));
  if (skor.length < 4) return null;
  const half = Math.floor(skor.length / 2);
  const rata = (arr) => arr.reduce((a, b) => a + b, 0) / arr.length;
  const delta = Math.round(rata(skor.slice(half)) - rata(skor.slice(0, half)));
  if (delta >= 5) return { ikon: '▲', warna: '#16a34a', teks: `menanjak (+${delta} poin paruh akhir dibanding paruh awal periode)` };
  if (delta <= -5) return { ikon: '▼', warna: '#b45309', teks: `melunak (${delta} poin) — momen baik untuk pendampingan lebih dekat, bukan untuk menghukum` };
  return { ikon: '→', warna: '#475569', teks: 'stabil di sepanjang periode' };
}

/** Nama penerbit pada blok tanda tangan (permintaan owner 21 Okt 2026:
 * "Hormat kami, Bimbingan Belajar Gemilang"). */
export const NAMA_PENERBIT = 'Bimbingan Belajar Gemilang';
/** Nama agen penghitung otomatis (keputusan owner 31 Okt 2026: istilah
 * 'otomatis' harus dinamai — bukan 'dihitung otomatis' anonim, tapi
 * 'dihitung otomatis oleh Asisten Belajar Gemilang'). */
export const NAMA_ASISTEN = 'Asisten Belajar Gemilang';

/** Logo kop cetakan. Default = logo PWA yang sudah dipakai watermark.
 * 🖼️ Cara memasang LOGO TRANSPARAN (keputusan owner: kop manual / logo
 * transparan): ganti nilai ini dengan data-URI PNG transparan ATAU path
 * /logo-transparan.png di folder public/, atau sodorkan `logoUrl` per
 * panggilan htmlRaportSiswa/htmlRaportMassal. Cukup SATU tempat ini. */
export const LOGO_KOP = WATERMARK.logo;

// ------------------------------------------------------------
// KELOMPOK DOKUMEN TERBIT (dipakai UI siswa & halaman ortu)
// ------------------------------------------------------------

/** Kelompokkan dokumen raport_final sumber:'otomatis' per periode.
 * @param {Array<object>} docs dokumen datar (hasil baca Firestore)
 * @returns {Array<{periode, labelManusiawi, akademik, proses, versiMesin,
 *   jejak, terkunci, studentName, studentKelas}>}
 * Urut: laporan besar (periode '..') dulu, lalu bulanan terbaru → terlama. */
export function kelompokDokOtomatis(docs = []) {
  const grup = new Map();
  for (const d of Array.isArray(docs) ? docs : []) {
    const data = dataDok(d);
    if (!data || data.sumber !== 'otomatis') continue;
    const periode = String(data.periode || '');
    if (!periode) continue;
    if (!grup.has(periode)) {
      grup.set(periode, {
        periode,
        labelManusiawi: labelPeriodeManusiawi(periode),
        akademik: [],
        proses: null,
        versiMesin: data.versiMesin || '',
        jejak: data.jejak || null,
        terkunci: data.terkunci === true,
        studentName: data.studentName || '',
        studentKelas: data.studentKelas || '',
      });
    }
    const g = grup.get(periode);
    if (data.blok === 'proses') {
      if (!g.proses) g.proses = data;
    } else {
      g.akademik.push(data);
    }
  }
  const daftar = [...grup.values()];
  for (const g of daftar) g.akademik.sort((a, b) => String(a.mapel || '').localeCompare(String(b.mapel || '')));
  daftar.sort((a, b) => {
    const aBesar = a.periode.includes('..') ? 0 : 1;
    const bBesar = b.periode.includes('..') ? 0 : 1;
    if (aBesar !== bBesar) return aBesar - bBesar;
    return b.periode.localeCompare(a.periode);
  });
  return daftar;
}

// ------------------------------------------------------------
// SPARKLINE TREN HARIAN (murni — dipakai cetakan & UI siswa)
// ------------------------------------------------------------

/** Hitung koordinat polyline dari trenHarian (skor null dilewati — titik
 * tanpa angka TIDAK digambar di 0). Kurang dari 2 titik → null. */
export function poinSparkline(trenHarian = [], { lebar = 300, tinggi = 46, pad = 8 } = {}) {
  const poin = (Array.isArray(trenHarian) ? trenHarian : [])
    .filter((t) => t && Number.isFinite(Number(t.skor)) && t.skor !== null)
    .map((t) => ({ tanggal: String(t.tanggal || ''), skor: Number(t.skor), jenis: String(t.jenis || '') }));
  if (poin.length < 2) return null;
  const skor = poin.map((p) => p.skor);
  const min = Math.min(...skor);
  const max = Math.max(...skor);
  const rentangX = lebar - pad * 2;
  const rentangY = tinggi - pad * 2;
  const titik = poin.map((p, i) => ({
    ...p,
    x: Math.round((pad + (i * rentangX) / (poin.length - 1)) * 10) / 10,
    // min === max → garis di tengah (bukan menempel dasar).
    y: Math.round((pad + (max === min ? rentangY / 2 : ((max - p.skor) / (max - min)) * rentangY)) * 10) / 10,
  }));
  return {
    titik,
    points: titik.map((t) => `${t.x},${t.y}`).join(' '),
    jumlah: titik.length,
    pertama: titik[0],
    terakhir: titik[titik.length - 1],
    min,
    max,
    lebar,
    tinggi,
  };
}

/** SVG sparkline siap sisip (string) untuk cetakan. Kosong ('') bila data
 * kurang dari 2 titik — pemanggil menampilkan kalimat jujur, bukan grafik 0. */
export function svgSparkline(trenHarian = [], opts = {}) {
  const s = poinSparkline(trenHarian, opts);
  if (!s) return '';
  const { lebar, tinggi } = s;
  const label = (t, x, anchor) => `<text x="${x}" y="${tinggi - 1}" font-size="8" fill="#64748b" text-anchor="${anchor}">${escapeHtml(t)}</text>`;
  return `<svg width="${lebar}" height="${s.tinggi + 10}" viewBox="0 0 ${lebar} ${s.tinggi + 10}" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Tren skor harian">`
    + `<polyline fill="none" stroke="#4f46e5" stroke-width="2" points="${s.points}" />`
    + `<circle cx="${s.terakhir.x}" cy="${s.terakhir.y}" r="3" fill="#4f46e5" />`
    + label(s.pertama.tanggal, s.pertama.x, 'start')
    + label(`${s.terakhir.tanggal} · ${s.terakhir.skor}`, Math.min(s.terakhir.x, lebar - 90), 'end')
    + '</svg>';
}

// ------------------------------------------------------------
// BAGAN JARING LABA-LABA (radar 5 dimensi — murni, SVG string)
// ------------------------------------------------------------

// Palet poligon per mapel (kontras di kertas & layar; global selalu indigo
// gelap + garis tebal agar mudah dibedakan dari mapel).
export const WARNA_RADAR_MAPEL = [
  '#0ea5e9', '#f59e0b', '#10b981', '#8b5cf6', '#ef4444',
  '#14b8a6', '#f97316', '#84cc16',
];
export const WARNA_RADAR_GLOBAL = '#4338ca';
/** Maksimal poligon mapel dalam satu bagan (lebih dari ini tak terbaca). */
export const RADAR_MAKS_SERI = 8;

/** Sudut sumbu ke-i (rad): mulai dari atas (-90°), searah jarum jam. */
function sudutSumbu(i, jumlah) {
  return (-90 + (i * 360) / jumlah) * (Math.PI / 180);
}

/** Geometri bagan jaring laba-laba untuk N seri dimensi (0–100).
 * @param {Array<{label:string, warna?:string, tebal?:boolean, putus?:boolean,
 *   dimensi:Object<string, number|null>}>} seri
 * @param {{ukuran?:number}} opts ukuran = sisi area gambar (label di luar).
 * @returns {null|{pusat:{x,y}, R:number, lebar:number, tinggi:number,
 *   sumbu:Array<{key,label,xUjung,yUjung,xLabel,yLabel,anchor}>,
 *   cincin:Array<number>,
 *   seri:Array<{label,warna,tebal,putus,jumlahNull,poin:Array<{key,x,y,nilai}>,
 *     points:string, bisaPoligon:boolean}>, legenda:Array<{label,warna,tebal,putus,jumlahNull}>}}
 *
 * Aturan JUJUR (sama dengan sparkline):
 *   - dimensi null TIDAK digambar di 0 — sumbu itu dilewati poligon; seri
 *     dengan <3 dimensi terukur tidak diberi poligon (hanya titik) supaya
 *     tidak membentuk segitiga menyesatkan.
 *   - tidak ada satu pun titik terukur → null (pemanggil mencetak kalimat
 *     jujur, bukan bagan kosong yang pura-pura ada data). */
export function poinRadar(seri = [], { ukuran = 250 } = {}) {
  const daftar = (Array.isArray(seri) ? seri : [])
    .map((s) => ({
      label: String(s?.label || ''),
      warna: s?.warna || WARNA_RADAR_GLOBAL,
      tebal: s?.tebal === true,
      putus: s?.putus === true,
      dimensi: s?.dimensi || {},
    }));
  const keys = DIMENSI_KEYS;
  const n = keys.length;
  const margin = 52; // ruang label sumbu
  const R = ukuran / 2;
  const pusat = { x: margin + R, y: margin + R };
  const lebar = ukuran + margin * 2;

  const posisi = (i, r) => ({
    x: Math.round((pusat.x + Math.cos(sudutSumbu(i, n)) * r) * 10) / 10,
    y: Math.round((pusat.y + Math.sin(sudutSumbu(i, n)) * r) * 10) / 10,
  });
  const sumbu = keys.map((k, i) => {
    const ujung = posisi(i, R);
    const lab = posisi(i, R + 16);
    // anchor teks mengikuti sisi bagan agar label tidak menabrak garis
    const anchor = Math.abs(lab.x - pusat.x) < 8 ? 'middle' : (lab.x > pusat.x ? 'start' : 'end');
    return { key: k, label: DIMENSI_LABEL[k], xUjung: ujung.x, yUjung: ujung.y, xLabel: lab.x, yLabel: lab.y + 3, anchor };
  });

  const seriKeluar = [];
  let adaTitik = false;
  for (const s of daftar) {
    const poin = [];
    let jumlahNull = 0;
    keys.forEach((k, i) => {
      const v = s.dimensi?.[k];
      if (!Number.isFinite(v)) { jumlahNull += 1; return; }
      const r = (Math.max(0, Math.min(100, v)) / 100) * R;
      const p = posisi(i, r);
      poin.push({ key: k, x: p.x, y: p.y, nilai: v });
      adaTitik = true;
    });
    seriKeluar.push({
      label: s.label, warna: s.warna, tebal: s.tebal, putus: s.putus,
      jumlahNull, poin,
      points: poin.map((p) => `${p.x},${p.y}`).join(' '),
      bisaPoligon: poin.length >= 3,
    });
  }
  if (!adaTitik) return null;
  return { pusat, R, lebar, tinggi: ukuran + margin * 2, sumbu, cincin: [25, 50, 75, 100], seri: seriKeluar };
}

/** Susun seri radar dari model cetakan: dimensi global (garis tebal) +
 * satu poligon per mapel yang punya ≥3 dimensi terukur. Mapel berlebih
 * dipotong ke RADAR_MAKS_SERI (dilaporkan jujur oleh pemanggil). */
export function seriRadarDariModel(m) {
  const seri = [];
  if (m?.proses?.dimensi_global) {
    seri.push({ label: 'Global (semua aktivitas)', warna: WARNA_RADAR_GLOBAL, tebal: true, dimensi: m.proses.dimensi_global });
  }
  const mapel = (m?.akademik || [])
    .map((d, i) => ({
      label: String(d.mapel || d.mapelKode || `Mapel ${i + 1}`),
      warna: WARNA_RADAR_MAPEL[i % WARNA_RADAR_MAPEL.length],
      dimensi: d.detail_dimensi || {},
    }))
    .filter((s) => DIMENSI_KEYS.filter((k) => Number.isFinite(s.dimensi[k])).length >= 2);
  return { seri: seri.concat(mapel).slice(0, RADAR_MAKS_SERI + 1), jumlahMapel: mapel.length };
}

/** SVG jaring laba-laba siap sisip (string) untuk cetakan. null/'' bila
 * tidak ada satu pun dimensi terukur — pemanggil menampilkan kalimat jujur. */
export function svgRadar(seri = [], opts = {}) {
  const g = poinRadar(seri, opts);
  if (!g) return '';
  const { pusat, R, lebar, tinggi, sumbu, cincin, seri: s } = g;
  const ring = (pct) => {
    const pts = sumbu.map((_, i) => {
      const r = (pct / 100) * R;
      const a = (-90 + (i * 360) / sumbu.length) * (Math.PI / 180);
      return `${Math.round((pusat.x + Math.cos(a) * r) * 10) / 10},${Math.round((pusat.y + Math.sin(a) * r) * 10) / 10}`;
    }).join(' ');
    return `<polygon points="${pts}" fill="none" stroke="#e2e8f0" stroke-width="1" />`;
  };
  const sumbuGaris = sumbu.map((a) => `<line x1="${pusat.x}" y1="${pusat.y}" x2="${a.xUjung}" y2="${a.yUjung}" stroke="#cbd5e1" stroke-width="1" />`).join('');
  const labelSumbu = sumbu.map((a) => `<text x="${a.xLabel}" y="${a.yLabel}" font-size="9.5" font-weight="700" fill="#334155" text-anchor="${a.anchor}">${escapeHtml(a.label)}</text>`).join('');
  const poligon = s.map((x) => {
    if (!x.bisaPoligon) {
      // <3 dimensi terukur: gambar TITIK saja (poligon akan mengarang bentuk)
      return x.poin.map((p) => `<circle cx="${p.x}" cy="${p.y}" r="2.5" fill="${x.warna}" />`).join('');
    }
    return `<polygon points="${x.points}" fill="${x.warna}" fill-opacity="${x.tebal ? 0.1 : 0.05}" stroke="${x.warna}" stroke-width="${x.tebal ? 2.6 : 1.6}"${x.putus ? ' stroke-dasharray="4 3"' : ''} />`
      + x.poin.map((p) => `<circle cx="${p.x}" cy="${p.y}" r="${x.tebal ? 2.6 : 2}" fill="${x.warna}" />`).join('');
  }).join('');
  // angka dimensi hanya untuk seri tebal (global) — poligon mapel sudah punya chip di tabel
  const angkaGlobal = s.filter((x) => x.tebal).flatMap((x) => x.poin.map((p) => {
    const dx = p.x - pusat.x; const dy = p.y - pusat.y;
    const len = Math.sqrt(dx * dx + dy * dy) || 1;
    return `<text x="${Math.round((p.x + (dx / len) * 10) * 10) / 10}" y="${Math.round((p.y + (dy / len) * 10) * 10) / 10}" font-size="9" font-weight="800" fill="${x.warna}" text-anchor="middle">${escapeHtml(p.nilai)}</text>`;
  })).join('');
  const tinggiLegenda = 14 * Math.ceil(s.length / 3) + 6;
  const legenda = s.map((x, i) => {
    const kolom = i % 3; const baris = Math.floor(i / 3);
    const lx = 8 + kolom * Math.round((lebar - 16) / 3);
    const ly = tinggi + 10 + baris * 14;
    const kurang = x.jumlahNull ? ` · ${x.jumlahNull} belum terukur` : '';
    return `<rect x="${lx}" y="${ly - 7}" width="9" height="9" rx="2" fill="${x.warna}" />`
      + `<text x="${lx + 13}" y="${ly + 1}" font-size="8.5" fill="#334155">${escapeHtml(`${x.label}${kurang}`.slice(0, 34))}</text>`;
  }).join('');
  return `<svg width="${lebar}" height="${tinggi + tinggiLegenda}" viewBox="0 0 ${lebar} ${tinggi + tinggiLegenda}" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Bagan jaring laba-laba dimensi">`
    + cincin.map(ring).join('') + sumbuGaris + poligon + angkaGlobal + labelSumbu + legenda + '</svg>';
}

// ------------------------------------------------------------
// MODEL CETAKAN
// ------------------------------------------------------------

const fmt = (n) => (Number.isFinite(n) ? String(n) : '—');
const fmt1 = (n) => (Number.isFinite(n) ? String(Math.round(n * 10) / 10) : '—');
const fmtTglPanjang = (iso) => {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
};

/** Susun model tampilan dari dokumen snapshot. Semua field defensif:
 * dokumen terbit sebagian/tanpa blok proses tetap bisa dicetak jujur. */
export function siapkanModelRaport({
  dokAkademik = [], dokProses = null, catatanGuru = '', identitas = {}, laporanGuru = [],
} = {}) {
  const akademikDocs = (Array.isArray(dokAkademik) ? dokAkademik : [])
    .map(dataDok)
    .filter((d) => d && d.blok !== 'proses')
    .sort((a, b) => String(a.mapel || '').localeCompare(String(b.mapel || '')));
  const proses = dataDok(dokProses) || null;
  const sumberIdentitas = proses || akademikDocs[0] || {};
  // v1.5: fokus pendampingan per mapel untuk blok rencana T3 — diambil dari
  // rencana pengayaan yang ditulis tentor (sumber primer), bila ada.
  const akademik = akademikDocs.map((d) => {
    const g = (Array.isArray(laporanGuru) ? laporanGuru : []).find(
      (x) => x && (x.kodeMapel === d.mapelKode || x.namaMapel === d.mapel),
    );
    const fokus = String(g?.pengayaan || '').trim();
    return fokus ? { ...d, rencana_fokus: fokus } : d;
  });
  const rataRata = proses && Number.isFinite(proses.rataRataAkademik)
    ? proses.rataRataAkademik
    : (() => {
      // v1.3: setiap mapel berangka ikut rata-rata capaian — laporan ortu
      // tidak mengenal konsep 'menunggu layak'; keterangan kejujuran pindah
      // ke kalimat deskripsi per mapel.
      const layak = akademikDocs.filter((d) => Number.isFinite(d.nilai_akhir));
      return layak.length
        ? Math.round((layak.reduce((s, d) => s + d.nilai_akhir, 0) / layak.length) * 10) / 10
        : null;
    })();
  return {
    identitas: {
      nama: identitas.nama || sumberIdentitas.studentName || '—',
      studentId: identitas.studentId || sumberIdentitas.studentId || '—',
      kelas: identitas.kelas || sumberIdentitas.studentKelas || '—',
      program: identitas.program || sumberIdentitas.studentProgram || '',
      jenjang: identitas.jenjang || '',
      namaBimbel: identitas.namaBimbel || 'Bimbel Gemilang',
    },
    periode: sumberIdentitas.periode || identitas.periode || '',
    versiMesin: sumberIdentitas.versiMesin || '',
    jejak: sumberIdentitas.jejak || null,
    terkunci: sumberIdentitas.terkunci === true,
    akademik,
    proses,
    ringkasan: {
      rataRataAkademik: rataRata,
      predikatAkademik: predikatDariNilai(rataRata),
      nilaiProses: proses && Number.isFinite(proses.nilai_akhir) ? proses.nilai_akhir : null,
      predikatProses: predikatDariNilai(proses && Number.isFinite(proses.nilai_akhir) ? proses.nilai_akhir : null),
    },
    catatanGuru: String(catatanGuru || ''),
    // v1.4: capaian yang diisi guru (koleksi laporan_belajar) — ISI UTAMA
    // laporan orang tua. Kosong = jatuh ke narasi otomatis mesin.
    laporanGuru: Array.isArray(laporanGuru) ? laporanGuru.filter((d) => d && d.capaian) : [],
  };
}

/** Isi kotak 'Laporan untuk Orang Tua/Wali'.
 * Bila ada capaian guru → itu PRIMER (per mapel + bahan otomatis pendukung);
 * bila tidak → narasi otomatis mesin (v1.3). Mengembalikan HTML ter-escape. */
function isiNarasiUtama(m) {
  const lg = Array.isArray(m.laporanGuru) ? m.laporanGuru : [];
  if (!lg.length) return { html: escapeHtml(narasiLaporan(m)), dariGuru: false };
  const bahan = ringkasBahanOtomatis({
    proses: m.proses || {},
    akademik: { perMapel: (m.akademik || []).map((d) => ({ mapel: d.mapel, detail_komponen: d.detail_komponen })) },
  });
  const bagian = lg.map((d) => {
    const nar = narasiCapaianSiswa(d, {});
    const judul = d.namaMapel || d.kodeMapel || 'Capaian';
    return `<div style="margin-top:5px"><b>${escapeHtml(judul)}.</b> ${escapeHtml(nar)}</div>`;
  }).join('');
  const bahanLine = bahan.ringkasan.length
    ? `<div class="rp-kecil" style="margin-top:7px;color:#475569"><b>Bahan otomatis sistem Gemilang:</b> ${escapeHtml(bahan.ringkasan.join('; '))}.</div>`
    : '';
  return { html: bagian + bahanLine, dariGuru: true };
}

// ------------------------------------------------------------
// HTML CETAKAN
// ------------------------------------------------------------

/** CSS cetakan raport — kelas berawalan .rp- agar tidak bentrok dengan
 * style engine cetak (cetakLewatIframe menyuntik CSS dasarnya sendiri). */
export function cssRaport() {
  return `
.rp { font-size: 11.5px; color: #0f172a; line-height: 1.45; }
.rp-wm { position: fixed; inset: 0; z-index: -1; opacity: ${WATERMARK.opacityCetak};
  background: url('${WATERMARK.logo}') center / ${WATERMARK.ukuranMm}mm no-repeat; }
.rp-kop { display: flex; gap: 10px; align-items: center; border-bottom: 2.5px solid #0f172a;
  padding-bottom: 8px; margin-bottom: 10px; }
.rp-kop img { width: 46px; height: 46px; object-fit: contain; }
.rp-kop h1 { font-size: 15px; margin: 0; letter-spacing: .3px; }
.rp-sub { font-size: 10.5px; color: #475569; }
.rp-cap { display: inline-block; margin-top: 4px; font-size: 9px; font-weight: 700; color: #4338ca;
  background: #eef2ff; border: 1px solid #c7d2fe; border-radius: 999px; padding: 2px 8px; }
.rp table { width: 100%; border-collapse: collapse; margin: 6px 0 10px; }
.rp th, .rp td { border: 1px solid #cbd5e1; padding: 4px 7px; text-align: left; vertical-align: top; }
.rp th { background: #f1f5f9; font-size: 10px; }
.rp h2 { font-size: 12px; margin: 12px 0 4px; padding: 4px 9px; background: #0f172a; color: #fff;
  border-radius: 6px; page-break-after: avoid; }
.rp h3 { font-size: 11px; margin: 8px 0 3px; page-break-after: avoid; }
.rp-blok { page-break-inside: avoid; }
.rp-ringkas { display: flex; gap: 10px; flex-wrap: wrap; margin: 8px 0; }
.rp-angka { flex: 1 1 160px; border: 1px solid #e2e8f0; border-radius: 10px; padding: 8px 12px;
  text-align: center; background: #f8fafc; page-break-inside: avoid; }
.rp-angka .besar { font-size: 24px; font-weight: 800; line-height: 1.1; }
.rp-angka .kecil { font-size: 9.5px; color: #64748b; }
.rp-kartu-grid { display: flex; flex-wrap: wrap; gap: 8px; }
.rp-kartu { flex: 1 1 190px; border: 1px solid #e2e8f0; border-radius: 8px; padding: 6px 9px;
  font-size: 10.5px; page-break-inside: avoid; }
.rp-chip { display: inline-block; font-size: 9.5px; border-radius: 999px; padding: 1px 8px;
  border: 1px solid; margin: 2px 2px; background: #fff; }
.rp-muted { color: #64748b; } .rp-warn { color: #b45309; } .rp-bad { color: #991b1b; }
.rp-catatan { border: 1px dashed #94a3b8; border-radius: 8px; padding: 8px 10px; min-height: 46px;
  white-space: pre-wrap; font-size: 11px; page-break-inside: avoid; }
.rp-ttd { margin-top: 20px; display: flex; justify-content: space-between; font-size: 10.5px;
  page-break-inside: avoid; }
.rp-ttd .garis { margin-top: 42px; }
.rp-cara { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 8px 12px; margin: 8px 0; page-break-inside: avoid; }
.rp-cara ul { margin: 4px 0 0; padding-left: 18px; }
.rp-cara li { margin: 2px 0; }
.rp-kekuatan { background: #f0fdf4; border-color: #bbf7d0; }
.rp-radar { text-align: center; margin: 6px 0 2px; page-break-inside: avoid; }
.rp-radar svg { max-width: 100%; height: auto; }
.rp-footer { margin-top: 10px; border-top: 1px solid #cbd5e1; padding-top: 6px; font-size: 9px;
  color: #64748b; }
.rp-hal { page-break-before: always; }
.rp-kecil { font-size: 9.5px; }
`;
}

function bagianAkademik(m) {
  const komponen = m.detail_komponen || {};
  const selKomponen = (c, jumlahKey = 'jumlah') => (
    c && Number.isFinite(c.total)
      ? `${fmt(c.total)} <span class="rp-muted">(${c[jumlahKey] ?? 0}×)</span>`
      : '<span class="rp-muted">belum ada</span>'
  );
  const rincianUjian = (komponen.ujian?.rincian || []).map((u) => (
    `<div class="rp-kecil rp-muted">${escapeHtml(u.tanggal)} · ${escapeHtml(u.paketJudul)} · ${fmt(u.nilai)} (${escapeHtml(u.dasar || 'persen')}${u.skala != null ? `, skala ${u.skala}` : ''})</div>`
  )).join('');
  const predikat = m.predikat || {};
  // v1.5: mapel tier T3 (belum ada asesmen periode ini) mendapat baris RENCANA
  // konkret di bawah deskripsi — laporan orang tua selalu menutup dengan
  // langkah depan, bukan kekosongan.
  const adaKomponen = ['kuis', 'tugas', 'ujian'].some((k) => komponen[k] && Number.isFinite(komponen[k].total));
  const barisRencana = adaKomponen ? '' : (
    `<div class="rp-kecil" style="color:#475569;margin-top:3px">Rencana: asesmen ${escapeHtml(m.mapel)} dijadwalkan pada periode berikutnya; fokus pendampingan: ${escapeHtml(m.rencana_fokus || 'penguatan materi prasyarat secara terbimbing bersama tentor')}.</div>`
  );
  return `
<tr>
  <td><b>${escapeHtml(m.mapel)}</b></td>
  <td>${selKomponen(komponen.kuis)}</td>
  <td>${selKomponen(komponen.tugas)}</td>
  <td>${selKomponen(komponen.ujian)}${rincianUjian}</td>
  <td style="text-align:center"><b style="font-size:13px">${fmt(m.nilai_akhir)}</b></td>
  <td style="text-align:center;color:${warnaPredikatHuruf(predikat.huruf)};font-weight:800">${escapeHtml(predikat.huruf || '—')}</td>
  <td class="rp-kecil">${escapeHtml(deskripsiMapel(m))}${barisRencana}</td>
</tr>`;
}

function bagianProses(p) {
  const dp = p.detail_proses || {};
  const kh = dp.kehadiran || {};
  const tt = dp.tugas || {};
  const lh = dp.latihan || {};
  const kw = dp.ketepatanWaktu || {};
  const ig = dp.integritas || {};
  const komponenTakTerukur = [
    kh.skor === null || kh.skor === undefined ? 'kehadiran' : null,
    tt.terukur === false ? 'tugas' : null,
    lh.terukur === false ? 'latihan' : null,
  ].filter(Boolean);
  const kartu = (judul, isi, gaya = '') => `<div class="rp-kartu" style="${gaya}"><b>${judul}</b><div>${isi}</div></div>`;
  const kehadiranIsi = kh.total
    ? `${kh.hadir}/${kh.total} hadir (${fmt(kh.persenHadir)}%) · ${kh.sakit ?? 0} sakit · ${kh.izin ?? 0} izin · ${kh.alpha ?? 0} alpha<br/>skor adil: <b>${fmt(kh.skor)}</b>${kh.skor === null || kh.skor === undefined ? ' <span class="rp-warn">(belum diskor)</span>' : ''}`
      : '<span class="rp-muted">belum ada catatan absensi</span>';
  const integritasIsi = `${escapeHtml(ig.catatan || '—')}`
    + (ig.pelanggaran || []).map((v) => `<div class="rp-kecil rp-warn">${escapeHtml(v.tanggal)} · ${escapeHtml(v.jenis)} · ${escapeHtml(v.asal || '')}${v.paketJudul ? ` — ${escapeHtml(v.paketJudul)}` : ''}</div>`).join('');
  return `
<div class="rp-ringkas">
  <div class="rp-angka">
    <div class="besar" style="color:${warnaPredikatHuruf(p.predikat?.huruf)}">${fmt(p.nilai_akhir)}</div>
    <div class="kecil">NILAI PROSES & KARAKTER${p.predikat?.huruf && p.predikat.huruf !== '—' ? ` · ${escapeHtml(p.predikat.huruf)} (${escapeHtml(p.predikat.label || '')})` : ''}</div>
    <div class="kecil rp-muted">${escapeHtml(p.mode_perhitungan || '')}</div>
  </div>
</div>
<div class="rp-kartu-grid">
  ${kartu('Kehadiran', kehadiranIsi)}
  ${kartu('Tugas', tt.terukur === false
    ? `${tt.terkumpul ?? 0} dikumpulkan${tt.dinilai !== undefined ? ` · ${tt.dinilai} dinilai guru` : ''}${tt.alasan ? `<div class="rp-kecil rp-muted">${escapeHtml(bersihkanV1(tt.alasan))}</div>` : ''}`
    : `skor ${fmt(tt.skor)} (${tt.terkumpul}/${tt.terbit})`)}
  ${kartu('Latihan mandiri', `${lh.hariAktif ?? 0}/${lh.targetHari ?? '—'} hari aktif · ${lh.soalDikerjakan ?? 0}/${lh.targetSoal ?? '—'} soal · ${lh.totalJawaban ?? 0} jawaban<br/>skor: <b>${fmt(lh.skor)}</b>`)}
  ${kartu('Ketepatan waktu', `<span class="rp-muted">belum ada tugas berjatuh tempo pada periode ini</span><div class="rp-kecil rp-muted">${escapeHtml(kw.alasan || '')}</div>`)}
  ${kartu('Integritas ujian', integritasIsi, (ig.jumlahPelanggaran || 0) > 0 ? 'border-color:#fde68a;background:#fffbeb;' : '')}
  ${dp.xp ? kartu('XP', `${dp.xp.xp ?? 0} total · ${dp.xp.xpMingguIni ?? 0} minggu ini <span class="rp-muted">(snapshot saat dihitung)</span>`) : ''}
</div>
${komponenTakTerukur.length ? `<div class="rp-kecil rp-muted" style="margin-top:4px">Komponen ${escapeHtml(komponenTakTerukur.join(', '))} belum dilaksanakan pada periode ini; bobotnya otomatis menguatkan komponen yang ada.</div>` : ''}`;
}

function bagianPerkembangan(p, m = null) {
  const trenSkala = p.trenSkala || [];
  const trenHarian = p.trenHarian || [];
  const petaTopik = p.petaTopik || [];
  const rekomendasi = rekomendasiTampil(petaTopik); // v1.2: snapshot lama ikut berwajah baru
  const spark = svgSparkline(trenHarian, { lebar: 460, tinggi: 46 });
  const CAP_TABEL_HARIAN = 40;
  const harianDitampil = trenHarian.slice(-CAP_TABEL_HARIAN);
  const dimensiGlobal = p.dimensi_global || {};
  const dimensiSumber = p.dimensi_global_sumber || {};
  // Jenjang TANPA TO berskala nasional (SD/SMP yang tidak menyentuh TKA/SNBT):
  // tren ujian TETAP dianalisis jujur lewat persen benar per paket (dari
  // snapshot trenHarian jenis 'to') — bukan sekadar tanda '—', dan TANPA
  // menyulap persen jadi skala nasional (itu mengarang).
  const trenPersen = trenSkala.length
    ? []
    : trenHarian.filter((t) => t.jenis === 'to' && t.skor !== null && t.skor !== undefined);
  const semangat = trenSemangat(trenHarian);
  const radar = m ? seriRadarDariModel(m) : { seri: [], jumlahMapel: 0 };
  const radarSvg = svgRadar(radar.seri, { ukuran: 240 });
  const mapelTerpotong = Math.max(0, radar.jumlahMapel - RADAR_MAKS_SERI);
  return `
${semangat ? `<div class="rp-cara"><b>🔥 Semangat & kebiasaan belajar:</b> tren aktivitas harian <b style="color:${semangat.warna}">${semangat.ikon} ${escapeHtml(semangat.teks)}</b>. Grafik harian di bawah ini adalah bukti mentahnya — naik-turunnya wajar, yang kami jaga adalah arahnya.</div>` : '<div class="rp-cara"><b>🔥 Semangat & kebiasaan belajar:</b> titik aktivitas periode ini masih sedikit, sehingga grafik tren mulai terisi pada sesi-sesi berikutnya.</div>'}
<h3>Tren try out (skala nasional)</h3>
${trenSkala.length ? `<table>
<thead><tr><th>Tanggal</th><th>Try out</th><th>Mode</th><th>Skala</th><th>Nilai/100</th><th>Per subtes</th></tr></thead>
<tbody>${trenSkala.map((t) => `<tr>
  <td>${escapeHtml(t.tanggal)}</td>
  <td>${escapeHtml(t.paketJudul)}</td>
  <td>${escapeHtml(t.mode || '')}${t.skalaMode ? ` (${escapeHtml(t.skalaMode)})` : ''}</td>
  <td><b>${fmt(t.skalaTotal)}</b></td>
  <td>${fmt1(t.nilai100)}</td>
  <td class="rp-kecil">${(t.perSubtes || []).map((s) => `${escapeHtml(s.kode)}: ${s.skala ?? '—'}`).join(' · ')}</td>
</tr>`).join('')}</tbody></table>` : (trenPersen.length ? `<table>
<thead><tr><th>Tanggal</th><th>Try out</th><th>Persen benar</th></tr></thead>
<tbody>${trenPersen.map((t) => `<tr>
  <td>${escapeHtml(t.tanggal)}</td>
  <td>${escapeHtml(t.label)}</td>
  <td><b>${fmt1(t.skor)}%</b></td>
</tr>`).join('')}</tbody></table>
<div class="rp-muted rp-kecil">Jenjang/program ini tidak memakai try out berskala nasional UTBK/TKA — perkembangan ujian dianalisis dari <b>persen benar per paket</b> (angka di atas adalah capaian sesungguhnya, bukan konversi skala). Bila belum ada try out sama sekali, kolom ini menampilkan '—' (belum terukur), TIDAK PERNAH 0.</div>`
    : '<div class="rp-muted rp-kecil">Belum ada try out berskala nasional pada periode ini — kolom skala dibiarkan \'—\' (belum terukur), tidak dinolkan. Perkembangan tetap terlihat dari kuis, latihan harian, dan tugas di bawah.</div>')}

<h3>Bagan jaring laba-laba — profil 5 dimensi</h3>
${radarSvg
    ? `<div class="rp-radar">${radarSvg}</div>
<div class="rp-muted rp-kecil" style="text-align:center">Garis tebal indigo = dimensi global (semua aktivitas); poligon tipis = per mapel. Sumbu yang tidak tersentuh poligon berarti <b>belum terukur</b> — sengaja tidak digambar di 0.${mapelTerpotong ? ` Menampilkan ${RADAR_MAKS_SERI} mapel pertama dari ${radar.jumlahMapel} (sisanya di tabel Blok A).` : ''}</div>`
    : '<div class="rp-muted rp-kecil">Belum ada dimensi terukur (perlu minimal bukti kuis/try out/latihan) — bagan tidak digambar daripada menampilkan bentuk kosong yang menyesatkan.</div>'}

<h3>Catatan tren harian</h3>
${spark || '<div class="rp-muted rp-kecil">Belum ada minimal 2 aktivitas berskor untuk digambar.</div>'}
${trenHarian.length ? `<table class="rp-kecil">
<tbody>${harianDitampil.map((t) => `<tr>
  <td style="width:80px">${escapeHtml(t.tanggal)}</td>
  <td style="width:52px">${escapeHtml(t.jenis)}</td>
  <td>${escapeHtml(t.label)}</td>
  <td style="width:52px;text-align:right">${t.skor === null || t.skor === undefined ? '—' : escapeHtml(t.skor)}</td>
</tr>`).join('')}</tbody></table>
${trenHarian.length > CAP_TABEL_HARIAN ? `<div class="rp-muted rp-kecil">Menampilkan ${CAP_TABEL_HARIAN} entri terakhir dari ${trenHarian.length} (snapshot memuat semuanya).</div>` : ''}` : '<div class="rp-muted rp-kecil">Belum ada aktivitas tercatat pada periode ini.</div>'}

<h3>Peta topik (warna = rencana pendampingan, bukan vonis)</h3>
${(() => {
      const { berwarna: petaWarna } = petaTampil(petaTopik);
      return `${petaWarna.length ? `<div>${petaWarna.map((t) => {
      const w = warnaStatusTopik(t.status);
      return `<span class="rp-chip" style="border-color:${w};color:${w}" title="${escapeHtml(t.alasan || '')} · sumber: ${escapeHtml((t.sumber || []).join('+'))}">${escapeHtml(t.mapelNama || t.mapelKode || '')}: ${escapeHtml(t.topik)} · ${fmt(t.akurasi)}% (${fmt(t.dicoba)})</span>`;
    }).join('')}</div>`
    : '<div class="rp-muted rp-kecil">Peta topik dirakit otomatis dari log pengerjaan kuis dan try out yang sudah dilaksanakan.</div>'}`;
    })()}
${rekomendasi.length ? `<div class="rp-bad rp-kecil" style="margin-top:6px;background:#eff6ff;border:1px solid #bfdbfe;border-radius:8px;padding:6px 10px"><b>Rencana pendampingan periode depan:</b><ul style="margin:4px 0 0;padding-left:18px">${rekomendasi.map((r) => `<li>${escapeHtml(r)}</li>`).join('')}</ul></div>` : ''}

<h3>Dimensi global (proksi otomatis dari log)</h3>
<table class="rp-kecil"><tbody>
${DIMENSI_KEYS.map((k) => {
    const v = dimensiGlobal[k];
    return `<tr><td style="width:130px"><b>${DIMENSI_LABEL[k]}</b></td><td style="width:90px;font-weight:700">${Number.isFinite(v) ? v : '<span class="rp-muted">belum terukur</span>'}</td><td class="rp-muted">${escapeHtml(dimensiSumber[k] || '')}</td></tr>`;
  }).join('')}
</tbody></table>`;
}

/** HTML satu raport siswa (tanpa <style> — pemanggil menyatukan lewat
 * htmlRaportSiswa/htmlRaportMassal agar CSS tidak dobel saat massal). */
function bagianSiswa(m, { kodeCetak = '', logoUrl = '' } = {}) {
  const idn = m.identitas;
  const jejak = m.jejak || {};
  const jumlahSumber = jejak.jumlahDokumenSumber || null;
  const capOtomatis = `Dihitung otomatis oleh ${NAMA_ASISTEN} dari log aktivitas (kuis · try out · latihan harian · absensi · tugas)`
    + (m.terkunci ? ' · snapshot TERKUNCI' : '');
  return `
<div class="rp">
  <div class="rp-kop">
    <img src="${escapeHtml(logoUrl || LOGO_KOP)}" alt="" />
    <div>
      <h1>${escapeHtml(idn.namaBimbel)} — RAPOR PERKEMBANGAN BELAJAR</h1>
      <div class="rp-sub">Periode <b>${escapeHtml(labelPeriodeManusiawi(m.periode))}</b>${kodeCetak ? ` · kode cetak ${escapeHtml(kodeCetak)}` : ''}</div>
      <span class="rp-cap">🤖 ${capOtomatis}${m.versiMesin ? ` · mesin ${escapeHtml(m.versiMesin)}` : ''}</span>
    </div>
  </div>

  <table class="rp-kecil">
    <tr>
      <th style="width:110px">Nama siswa</th><td><b>${escapeHtml(idn.nama)}</b></td>
      <th style="width:110px">ID siswa</th><td>${escapeHtml(idn.studentId)}</td>
    </tr>
    <tr>
      <th>Kelas</th><td>${escapeHtml(idn.kelas)}${idn.jenjang ? ` · ${escapeHtml(idn.jenjang)}` : ''}</td>
      <th>Program</th><td>${escapeHtml(idn.program || '—')}</td>
    </tr>
    <tr>
      <th>Dihitung pada</th><td>${escapeHtml(fmtTglPanjang(jejak.dihitungPada))}</td>
      <th>Dicetak pada</th><td>${escapeHtml(fmtTglPanjang(new Date().toISOString()))}</td>
    </tr>
  </table>

  <div class="rp-ringkas">
    <div class="rp-angka">
      <div class="besar" style="color:${warnaPredikatHuruf(m.ringkasan.predikatAkademik.huruf)}">${fmt(m.ringkasan.rataRataAkademik)}</div>
      <div class="kecil">${Number.isFinite(m.ringkasan.rataRataAkademik) ? 'CAPAIAN AKADEMIK TERUKUR' : 'CAPAIAN AKADEMIK · TERISI OTOMATIS DARI ASEMEN BERIKUTNYA'} · ${escapeHtml(m.ringkasan.predikatAkademik.huruf)} (${escapeHtml(m.ringkasan.predikatAkademik.label || '')})</div>
    </div>
    <div class="rp-angka">
      <div class="besar" style="color:${warnaPredikatHuruf(m.ringkasan.predikatProses.huruf)}">${fmt(m.ringkasan.nilaiProses)}</div>
      <div class="kecil">NILAI PROSES & KARAKTER · ${escapeHtml(m.ringkasan.predikatProses.huruf)} (${escapeHtml(m.ringkasan.predikatProses.label || '')})</div>
    </div>
  </div>

  <div class="rp-narasi">
    <b>📖 Laporan untuk Orang Tua/Wali${isiNarasiUtama(m).dariGuru ? ' — capaian dinilai tentor' : ''}.</b> ${isiNarasiUtama(m).html}
  </div>
  <div class="rp-kecil rp-muted" style="margin:-4px 0 6px">Dua nilai terpisah sesuai keputusan owner: capaian akademik dan proses/karakter TIDAK digabung menjadi satu angka.</div>

  <h2>BLOK A — CAPAIAN AKADEMIK PER MAPEL</h2>
  ${m.akademik.length ? `<table>
    <thead><tr><th>Mapel</th><th style="width:70px">Kuis</th><th style="width:70px">Tugas</th><th style="width:120px">Ujian / try out</th><th style="width:48px">Nilai</th><th style="width:40px">Pred.</th><th style="width:34%">Deskripsi otomatis</th></tr></thead>
    <tbody>${m.akademik.map(bagianAkademik).join('')}</tbody>
  </table>` : '<div class="rp-muted rp-kecil">Tidak ada aktivitas akademik terdeteksi pada periode ini.</div>'}

  <h2>BLOK B — PROSES & KARAKTER</h2>
  ${m.proses ? bagianProses(m.proses) : '<div class="rp-muted rp-kecil">Dokumen blok proses tidak ditemukan untuk periode ini (belum diterbitkan).</div>'}

  <h2>BLOK C — PERKEMBANGAN & PETA TOPIK</h2>
  ${m.proses ? bagianPerkembangan(m.proses, m) : '<div class="rp-muted rp-kecil">Tren & peta topik tersedia setelah blok proses diterbitkan.</div>'}

  <h2>CATATAN GURU (opsional)</h2>
  <div class="rp-catatan">${m.catatanGuru ? escapeHtml(m.catatanGuru) : '<span class="rp-muted">(belum diisi — bagian ini opsional dan tidak memengaruhi angka otomatis)</span>'}</div>



  <div class="rp-ttd">
    <div>Hormat kami,<br/><b>${escapeHtml(NAMA_PENERBIT)}</b>
      <div class="garis">(...........................)</div>
      <div>Tentor Pendamping</div>
    </div>
    <div style="text-align:right">Orang Tua/Wali,
      <div class="garis">(...........................)</div>
      <div>Nama &amp; tanda tangan</div>
    </div>
  </div>

  <div class="rp-footer">
    ${escapeHtml(jejak.keterangan || '')}
    ${jumlahSumber ? `<br/>Dokumen sumber yang dipindai: kuis ${jumlahSumber.kuis ?? 0} · sesi TO ${jumlahSumber.sesi ?? 0} · absensi ${jumlahSumber.absensi ?? 0} · tugas ${jumlahSumber.tugas ?? 0} · latihan ${jumlahSumber.latihan ?? 0}.` : ''}
    ${m.versiMesin ? ` Mesin ${escapeHtml(m.versiMesin)}.` : ''} Angka pada dokumen ini tertelusur ke log aktivitas dan tidak berubah setelah diterbitkan.
  </div>
</div>`;
}

/** Judul dokumen cetak (masuk <title> dialog print → nama file PDF). */
export function judulCetakRaport({ nama = '', periode = '' } = {}) {
  return `Rapot ${String(nama || 'Siswa')} — ${labelPeriodeManusiawi(periode)}`;
}

/** HTML lengkap SATU siswa, siap disodorkan ke cetakLewatIframe.
 * `logoUrl` opsional → mengganti LOGO_KOP (mis. logo transparan bimbel). */
export function htmlRaportSiswa(opts = {}) {
  const m = siapkanModelRaport(opts);
  const kode = `GM-RPT-${Date.now().toString(36).toUpperCase()}`;
  return `<style>${cssRaport()}</style><div class="rp-wm"></div>${bagianSiswa(m, { kodeCetak: kode, logoUrl: opts.logoUrl || '' })}`;
}

/** HTML KUMPULAN raport (cetak massal per jenjang/kelas): halaman sampul +
 * satu raport per siswa, masing-masing mulai di halaman baru.
 * @param {{daftar:Array<{dokAkademik,dokProses,catatanGuru?}>, judul?:string, periodeLabel?:string, logoUrl?:string}} opts */
export function htmlRaportMassal({ daftar = [], judul = '', periodeLabel = '', logoUrl = '' } = {}) {
  const models = (Array.isArray(daftar) ? daftar : [])
    .map((d) => siapkanModelRaport(d))
    .filter((m) => m.identitas.nama !== '—');
  const barisSampul = models.map((m, i) => `<tr>
    <td>${i + 1}</td>
    <td><b>${escapeHtml(m.identitas.nama)}</b></td>
    <td>${escapeHtml(m.identitas.kelas)}</td>
    <td style="text-align:center">${fmt(m.ringkasan.rataRataAkademik)}</td>
    <td style="text-align:center;color:${warnaPredikatHuruf(m.ringkasan.predikatAkademik.huruf)};font-weight:700">${escapeHtml(m.ringkasan.predikatAkademik.huruf)}</td>
    <td style="text-align:center">${fmt(m.ringkasan.nilaiProses)}</td>
    <td style="text-align:center;color:${warnaPredikatHuruf(m.ringkasan.predikatProses.huruf)};font-weight:700">${escapeHtml(m.ringkasan.predikatProses.huruf)}</td>
    <td style="text-align:center">${(m.akademik || []).filter((d) => Number.isFinite(d.nilai_akhir)).length}/${(m.akademik || []).length}</td>
  </tr>`).join('');
  const sampul = `
<div class="rp">
  <div class="rp-kop">
    <img src="${escapeHtml(logoUrl || LOGO_KOP)}" alt="" />
    <div>
      <h1>${escapeHtml(judul || 'Kumpulan Rapor Perkembangan Belajar')}</h1>
      <div class="rp-sub">Periode <b>${escapeHtml(labelPeriodeManusiawi(periodeLabel))}</b> · ${models.length} siswa · dicetak ${escapeHtml(fmtTglPanjang(new Date().toISOString()))}</div>
      <span class="rp-cap">🤖 Dihitung otomatis oleh ${escapeHtml(NAMA_ASISTEN)} dari log aktivitas · snapshot terkunci</span>
    </div>
  </div>
  <table class="rp-kecil">
    <thead><tr><th>No</th><th>Nama</th><th>Kelas</th><th>Akademik</th><th>Pred.</th><th>Proses</th><th>Pred.</th><th>Mapel terukur</th></tr></thead>
    <tbody>${barisSampul || '<tr><td colspan="8" class="rp-muted">Tidak ada siswa untuk dicetak.</td></tr>'}</tbody>
  </table>
  <div class="rp-muted rp-kecil">Catatan guru tidak disertakan pada cetak massal (opsional per siswa lewat cetak tunggal). Nilai akademik dan proses/karakter adalah dua angka terpisah sesuai keputusan owner.</div>
</div>`;
  const halaman = models.map((m, i) => (
    `<div${i > 0 ? ' class="rp-hal"' : ' style="page-break-before:always"'}>${bagianSiswa(m, { logoUrl })}</div>`
  )).join('');
  return `<style>${cssRaport()}</style><div class="rp-wm"></div>${sampul}${halaman}`;
}

export default {
  escapeHtml, labelPeriodeManusiawi, dataDok, kelompokDokOtomatis,
  poinSparkline, svgSparkline, warnaPredikatHuruf, warnaStatusTopik,
  poinRadar, svgRadar, seriRadarDariModel, WARNA_RADAR_MAPEL, WARNA_RADAR_GLOBAL, RADAR_MAKS_SERI,
  NAMA_PENERBIT, NAMA_ASISTEN, LOGO_KOP,
  DIMENSI_LABEL, DIMENSI_KEYS,
  siapkanModelRaport, cssRaport, judulCetakRaport,
  htmlRaportSiswa, htmlRaportMassal,
};
