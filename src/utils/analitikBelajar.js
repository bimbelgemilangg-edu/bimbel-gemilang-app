// src/utils/analitikBelajar.js
// ============================================================
// DASHBOARD ANALITIK BELAJAR (permintaan owner 14 Okt 2026):
// "sistem yang soal disusun AI harus ada analisisnya: kecepatan
// mengerjakan siswa, kekuatan, kelemahan, dan progres nilai naik/turun".
//
// Modul MURNI & TERJI (tests/analitikBelajar.test.mjs). Halaman admin hanya
// merender; sumber data: tryout_sesi selesai + paket TKA/UTBK (jenis ujian
// dibaca lewat jenisUjianUntukAnalitik supaya paket jalur tentor/manual
// berjudulkan TKA/UTBK tidak hilang — perbaikan PR #214).
//
// Kontrak baris masukan (dibentuk halaman):
//   { studentId, nama, kelas, paketId, jenisUjian, totalSkorPersen,
//     waktuSelesaiMs, createdAtMs, totalSoal, subtes: [{nama, skorPersen}] }
// ============================================================
import { labelPekan } from './papanJelajah.js';

/** Delta skor yang sudah berarti disebut naik/turun (di bawah itu = stabil). */
export const AMBANG_DELTA = 5;
/** Tempo ideal detik/soal (sama dengan IDEAL_DETIK_PER_SOAL papan jelajah). */
export const IDEAL_DETIK_PER_SOAL = 90;

/** detik/soal satu sesi; null bila waktu mulai tidak sah (jujur, bukan 0). */
export function detikPerSoalSesi(sesi = {}) {
  const mulai = sesi.createdAtMs != null ? Number(sesi.createdAtMs) : NaN;
  const selesai = sesi.waktuSelesaiMs != null ? Number(sesi.waktuSelesaiMs) : NaN;
  const n = Number(sesi.totalSoal) || 0;
  if (!Number.isFinite(mulai) || !Number.isFinite(selesai)) return null;
  if (selesai <= mulai || n <= 0) return null;
  return Math.round((selesai - mulai) / 1000 / n);
}

/** Arah progres dari delta skor: naik / turun / stabil / baru. */
export function arahProgres(delta) {
  if (delta === null || delta === undefined) return 'baru';
  if (delta >= AMBANG_DELTA) return 'naik';
  if (delta <= -AMBANG_DELTA) return 'turun';
  return 'stabil';
}

function agregatSubtes(sesiList) {
  const agg = new Map();
  sesiList.forEach((s) => (Array.isArray(s.subtes) ? s.subtes : []).forEach((sb) => {
    const nama = String(sb?.nama || '').trim();
    if (!nama || !Number.isFinite(Number(sb?.skorPersen))) return;
    if (!agg.has(nama)) agg.set(nama, []);
    agg.get(nama).push(Number(sb.skorPersen));
  }));
  return [...agg.entries()]
    .map(([nama, arr]) => ({ nama, skor: Math.round(arr.reduce((a, b) => a + b, 0) / arr.length) }))
    .sort((a, b) => b.skor - a.skor);
}

/**
 * Ringkasan per siswa + kohort untuk dashboard analitik belajar.
 * @param {Array<object>} baris baris sesi selesai ber-format kontrak di atas
 * @returns {{siswa:Array<object>, kohort:object}}
 */
export function bangunAnalitikBelajar(baris = []) {
  const sahih = (Array.isArray(baris) ? baris : [])
    .filter((b) => /tka|utbk/i.test(String(b?.jenisUjian || ''))
      && b?.waktuSelesaiMs != null && Number.isFinite(Number(b.waktuSelesaiMs)))
    .map((b) => ({ ...b, waktuSelesaiMs: Number(b.waktuSelesaiMs), skor: Math.round(Number(b.totalSkorPersen) || 0) }));

  const perSiswa = new Map();
  sahih.forEach((b) => {
    const id = String(b.studentId || '');
    if (!id) return;
    if (!perSiswa.has(id)) perSiswa.set(id, []);
    perSiswa.get(id).push(b);
  });

  const siswa = [...perSiswa.entries()].map(([studentId, list]) => {
    list.sort((a, b) => a.waktuSelesaiMs - b.waktuSelesaiMs);
    const skorRata = Math.round(list.reduce((a, b) => a + b.skor, 0) / list.length);
    const delta = list.length > 1 ? list[list.length - 1].skor - list[list.length - 2].skor : null;
    const tempoList = list.map(detikPerSoalSesi).filter((x) => x !== null);
    const detikPerSoal = tempoList.length
      ? Math.round(tempoList.reduce((a, b) => a + b, 0) / tempoList.length)
      : null;
    const subtes = agregatSubtes(list);
    return {
      studentId,
      nama: list[list.length - 1].nama || studentId,
      kelas: list[list.length - 1].kelas || '',
      jumlahSesi: list.length,
      skorRata,
      delta,
      arah: arahProgres(delta),
      detikPerSoal,
      tempoWajar: detikPerSoal === null ? null : detikPerSoal <= IDEAL_DETIK_PER_SOAL,
      terkuat: subtes[0] || null,
      terlemah: subtes.length > 1 ? subtes[subtes.length - 1] : null,
      subtes,
    };
  }).sort((a, b) => b.skorRata - a.skorRata || a.nama.localeCompare(b.nama, 'id'));

  // ---- kohort ----
  const pekan = new Map();
  sahih.forEach((b) => {
    const label = labelPekan(b.waktuSelesaiMs);
    if (!pekan.has(label)) pekan.set(label, { label, skor: [], ms: b.waktuSelesaiMs });
    pekan.get(label).skor.push(b.skor);
  });
  const trenPekan = [...pekan.values()]
    .sort((a, b) => a.ms - b.ms)
    .map((g) => ({ label: g.label, skor: Math.round(g.skor.reduce((x, y) => x + y, 0) / g.skor.length) }))
    .map((g, i, arr) => ({ ...g, delta: i === 0 ? null : g.skor - arr[i - 1].skor }));

  const semuaTempo = sahih.map(detikPerSoalSesi).filter((x) => x !== null);
  const lemahUmum = new Map();
  siswa.forEach((s) => {
    if (!s.terlemah) return;
    lemahUmum.set(s.terlemah.nama, (lemahUmum.get(s.terlemah.nama) || 0) + 1);
  });

  return {
    siswa,
    kohort: {
      trenPekan,
      detikPerSoalRata: semuaTempo.length
        ? Math.round(semuaTempo.reduce((a, b) => a + b, 0) / semuaTempo.length)
        : null,
      subtesLemahUmum: [...lemahUmum.entries()]
        .map(([nama, jumlah]) => ({ nama, jumlah }))
        .sort((a, b) => b.jumlah - a.jumlah || a.nama.localeCompare(b.nama, 'id'))
        .slice(0, 3),
      jumlahSiswa: siswa.length,
      jumlahSesi: sahih.length,
    },
  };
}

export default { bangunAnalitikBelajar, detikPerSoalSesi, arahProgres, AMBANG_DELTA, IDEAL_DETIK_PER_SOAL };

/**
 * Identitas tampilan siswa untuk analitik & laporan ortu (19 Okt):
 * dokumen students & sesi memakai alias berbeda-beda (nama/namaLengkap/
 * name/studentName; kelas/kelasSekolah) sehingga tabel dulu jatuh ke ID.
 * Murni & teruji.
 */
export function identitasTampilSiswa(sv = {}, sesi = {}) {
  const nama = sv.nama || sv.namaLengkap || sv.name || sesi.studentName || sesi.namaSiswa || sesi.nama || '';
  return {
    nama: nama || String(sesi.studentId || '(tanpa nama)'),
    kelas: sv.kelas || sv.kelasSekolah || sesi.kelas || sesi.kelasSekolah || '',
    jenjang: sv.jenjang || sv.jenjangSekolah || sesi.jenjang || sesi.targetJenjang || '',
  };
}

// ------------------------------------------------------------
// ANALISIS PER SUBTES/MAPEL + DESKRIPSI KUANTITATIF (19 Okt 2026,
// permintaan owner: sistem analisis dibagi per mapel/subtes dengan
// diagram naik-turun & laba-laba + deskripsi rinci, objektif,
// kuantitatif, analitik — dipakai modal admin & PDF orang tua).
// ------------------------------------------------------------

/** Kategori akurasi subtes: ambang konsisten dengan laporan ortu. */
export function kategoriAkurasi(skor) {
  if (skor == null || skor === '') return 'tanpa data';
  const n = Number(skor);
  if (!Number.isFinite(n)) return 'tanpa data';
  if (n >= 70) return 'kuat';
  if (n >= 45) return 'berkembang';
  return 'perlu pendampingan';
}

/**
 * Agregat per subtes/mapel untuk SATU siswa: jumlah sesi, rata-rata,
 * skor pertama & terakhir, delta, arah, kategori.
 * @param {Array} barisSesi baris sesi milik satu siswa (format bangunAnalitikBelajar)
 */
export function analitikPerSubtes(barisSesi = []) {
  const per = new Map();
  for (const b of Array.isArray(barisSesi) ? barisSesi : []) {
    if (b?.waktuSelesaiMs == null) continue;
    for (const sb of Array.isArray(b?.subtes) ? b.subtes : []) {
      const nama = String(sb?.nama || '').trim();
      if (!nama || !Number.isFinite(Number(sb?.skorPersen))) continue;
      if (!per.has(nama)) per.set(nama, []);
      per.get(nama).push({ ms: Number(b.waktuSelesaiMs), skor: Math.round(Number(sb.skorPersen)) });
    }
  }
  return [...per.entries()].map(([nama, list]) => {
    list.sort((a, b) => a.ms - b.ms);
    const skor = list.map((x) => x.skor);
    const rata = Math.round(skor.reduce((a, b) => a + b, 0) / skor.length);
    const delta = list.length > 1 ? skor[skor.length - 1] - skor[0] : null;
    return {
      nama,
      jumlahSesi: list.length,
      skorRata: rata,
      skorPertama: skor[0],
      skorTerakhir: skor[skor.length - 1],
      delta,
      arah: delta == null ? 'tetap' : delta >= 5 ? 'naik' : delta <= -5 ? 'turun' : 'tetap',
      kategori: kategoriAkurasi(rata),
      seri: list,
    };
  }).sort((a, b) => b.skorRata - a.skorRata || a.nama.localeCompare(b.nama, 'id'));
}

/** Deskripsi satu subtes: kalimat kuantitatif & objektif. */
export function deskripsiSubtes(x = {}) {
  const tren = x.delta == null
    ? 'baru satu sesi sehingga tren belum terukur'
    : `tren ${x.arah} ${Math.abs(x.delta)} poin dari sesi pertama (${x.skorPertama}%) ke sesi terakhir (${x.skorTerakhir}%)`;
  return `${x.nama}: ${x.jumlahSesi} sesi terukur, akurasi rata-rata ${x.skorRata}% (kategori ${x.kategori}), ${tren}.`;
}

/**
 * Deskripsi analisis lengkap satu siswa (paragraf objektif-kuantitatif)
 * untuk PDF orang tua: cakupan, tempo, urutan subtes, penutup analitik.
 */
export function deskripsiSiswaLengkap(a = {}, perSubtes = []) {
  const par = [];
  par.push(`Cakupan pengukuran: ${a.jumlahSesi || 0} sesi try out selesai dengan ${perSubtes.length} subtes terukur. Skor rata-rata keseluruhan ${a.skorRata ?? 0}%${a.delta != null ? `; perubahan sesi terakhir ${a.delta >= 0 ? '+' : ''}${a.delta} poin (${a.arah})` : ''}.`);
  if (a.detikPerSoal != null) {
    par.push(`Tempo kerja: rata-rata ${a.detikPerSoal} detik per soal (${a.tempoWajar ? 'dalam rentang ideal <= 90 detik' : 'di atas rentang ideal'}), dihitung dari selisih waktu mulai-selesai sesi yang sah.`);
  }
  for (const x of perSubtes) par.push(deskripsiSubtes(x));
  const lemah = perSubtes.filter((x) => x.kategori === 'perlu pendampingan').map((x) => x.nama);
  const kuat = perSubtes.filter((x) => x.kategori === 'kuat').map((x) => x.nama);
  par.push(`Sintesis: ${kuat.length ? `keunggulan terpeta pada ${kuat.join(', ')}` : 'belum ada subtes pada kategori kuat'}; ${lemah.length ? `prioritas pendampingan pada ${lemah.join(', ')}` : 'tidak ada subtes pada kategori perlu pendampingan'}. Rencana tindak lanjut disusun mengikuti urutan prioritas tersebut dan akan ditinjau ulang pada siklus pekanan berikutnya.`);
  return par;
}
