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
