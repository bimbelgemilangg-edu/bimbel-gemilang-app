// src/utils/petaKonten.js
// ============================================================
// SATU PETA untuk seluruh konten bimbel: bank soal, buku digital,
// dan paket try out, dirapikan ke hirarki yang SAMA:
//
//     jenjang -> mata pelajaran -> bab
//
// KENAPA ADA (keluhan owner 2026-10-06): "posisi saat ini admin saja
// kesulitan mau mencari materi ... admin aja bingung apalagi guru".
// Konten hidup di empat pulau dengan bahasa pengelompokan beda-beda
// (bank_soal: jenjang/mataPelajaran/materi; buku_digital: jenjang/mapel/
// kelas + subkoleksi bab; tryout_paket: targetKelas/targetKategori).
// Mencari "materi kelas 10 bab sistem reproduksi" berarti membuka tiga
// halaman dan mengingat-isinya. Peta ini membuat ketiganya terlihat
// dalam satu pohon yang bisa dicari.
//
// MURNI & TERUJI (tests/petaKonten.test.mjs): tidak menyentuh Firestore
// maupun React. Normalisasi nama mapel memakai deteksiMapel() dari
// mesinTaksonomiSoal.js supaya "B. Inggris", "bing", dan "Bahasa
// Inggris" jatuh ke simpul yang sama -- tanpa itu, pohon bercabang
// menjadi duplikat yang membingungkan, penyakit yang sama dengan
// identitas absensi di PR #129.
// ============================================================

import { deteksiMapel, deteksiJenjangKelas, KATALOG_MAPEL } from './mesinTaksonomiSoal.js';

const KOSONG = '(Belum dikelompokkan)';

/** Nama mapel ternormalisasi (null bila tidak terdeteksi). */
export function normMapel(...teks) {
  const gab = teks.filter(Boolean).join(' ').trim();
  if (!gab) return null;
  const t = gab.toLowerCase();
  // deteksiMapel() unggul untuk teks bebas, tetapi tidak mengenal token
  // persis yang pendek ("bing"); pencocokan kode/kunci persis menutup
  // lubang itu supaya alias pendek tetap jatuh ke simpul yang sama.
  const persis = KATALOG_MAPEL.find((m) => m.kode === t || m.keys.includes(t));
  if (persis) return persis.nama;
  const h = deteksiMapel(gab);
  return h?.nama || null;
}

/** Jenjang ternormalisasi dari field apa pun yang memuatnya. */
export function normJenjang(...teks) {
  const gab = teks.filter(Boolean).join(' ');
  if (!gab.trim()) return null;
  const h = deteksiJenjangKelas(gab);
  return h?.jenjang || null;
}

/**
 * Identitas satu butir konten -> {jenjang, mapel, bab}.
 * @param {object} item   dokumen mentah
 * @param {'soal'|'buku'|'paket'} jenis
 */
export function identitasKonten(item = {}, jenis = 'soal') {
  if (jenis === 'soal') {
    return {
      jenjang: normJenjang(item.jenjang, item.kelas) || KOSONG,
      mapel: normMapel(item.mataPelajaran, item.mapel) || KOSONG,
      bab: String(item.materi || item.bab || '').trim() || KOSONG,
    };
  }
  if (jenis === 'buku') {
    return {
      jenjang: normJenjang(item.jenjang, item.kelas) || KOSONG,
      mapel: normMapel(item.mapel, item.mataPelajaran, item.judul) || KOSONG,
      bab: null, // buku memuat banyak bab; dihitung di tingkat mapel
    };
  }
  // paket try out
  return {
    jenjang: normJenjang(item.targetKelas, item.jenjang) || KOSONG,
    mapel: normMapel(item.targetKategori, item.mapel, item.judul) || KOSONG,
    bab: String(item.babJudul || item.materi || '').trim() || null,
  };
}

/**
 * Bangun pohon jenjang -> mapel -> bab lengkap dengan jumlah per sumber
 * dan daftar buku/paket yang menempel di tiap simpul.
 */
export function bangunPohon({ soal = [], buku = [], paket = [] } = {}) {
  const pohon = new Map();

  const simpul = (jenjang, mapel) => {
    if (!pohon.has(jenjang)) pohon.set(jenjang, new Map());
    const lapis = pohon.get(jenjang);
    if (!lapis.has(mapel)) {
      lapis.set(mapel, {
        mapel, jumlah: { soal: 0, buku: 0, paket: 0 },
        bab: new Map(), buku: [], paket: [],
      });
    }
    return lapis.get(mapel);
  };

  for (const s of soal) {
    const id = identitasKonten(s, 'soal');
    const n = simpul(id.jenjang, id.mapel);
    n.jumlah.soal += 1;
    const bab = n.bab.get(id.bab) || { bab: id.bab, soal: 0, buku: 0, paket: 0 };
    bab.soal += 1;
    n.bab.set(id.bab, bab);
  }
  for (const b of buku) {
    const id = identitasKonten(b, 'buku');
    const n = simpul(id.jenjang, id.mapel);
    n.jumlah.buku += 1;
    n.buku.push({ id: b.id, judul: b.judul || '(tanpa judul)', kelas: b.kelas || '' });
  }
  for (const p of paket) {
    const id = identitasKonten(p, 'paket');
    const n = simpul(id.jenjang, id.mapel);
    n.jumlah.paket += 1;
    n.paket.push({ id: p.id, judul: p.judul || '(tanpa judul)' });
    if (id.bab) {
      const bab = n.bab.get(id.bab) || { bab: id.bab, soal: 0, buku: 0, paket: 0 };
      bab.paket += 1;
      n.bab.set(id.bab, bab);
    }
  }

  const hasil = [];
  for (const [jenjang, lapis] of pohon) {
    const mapelList = [...lapis.values()].map((n) => ({
      ...n,
      bab: [...n.bab.values()].sort((a, b) => a.bab.localeCompare(b.bab, 'id')),
      jumlahTotal: n.jumlah.soal + n.jumlah.buku + n.jumlah.paket,
    })).sort((a, b) => a.mapel.localeCompare(b.mapel, 'id'));
    hasil.push({ jenjang, mapel: mapelList, jumlahTotal: mapelList.reduce((a, b) => a + b.jumlahTotal, 0) });
  }
  hasil.sort((a, b) => a.jenjang.localeCompare(b.jenjang, 'id'));
  return hasil;
}

/**
 * Saring pohon dengan kata kunci (mapel, bab, judul buku/paket).
 * Simpul yang tidak cocok dibuang; yang cocok tetap membawa jumlahnya
 * supaya admin tahu isi di balik simpul sebelum membuka.
 */
export function saringPohon(pohon = [], query = '') {
  const q = String(query || '').trim().toLowerCase();
  if (!q) return pohon;
  const keluar = [];
  for (const jen of pohon) {
    const mapelList = [];
    for (const m of jen.mapel) {
      const babCocok = m.bab.filter((b) => b.bab.toLowerCase().includes(q));
      const bukuCocok = m.buku.filter((b) => b.judul.toLowerCase().includes(q));
      const paketCocok = m.paket.filter((p) => p.judul.toLowerCase().includes(q));
      const diriCocok = m.mapel.toLowerCase().includes(q) || jen.jenjang.toLowerCase().includes(q);
      if (diriCocok) { mapelList.push(m); continue; }
      if (babCocok.length || bukuCocok.length || paketCocok.length) {
        mapelList.push({ ...m, bab: babCocok.length ? babCocok : m.bab, buku: bukuCocok, paket: paketCocok });
      }
    }
    if (mapelList.length) keluar.push({ ...jen, mapel: mapelList });
  }
  return keluar;
}

/**
 * Sebaran jumlah soal per kelas dalam satu kumpulan (mis. satu bab).
 * Kompilasi TKA mencampur kelas 10-12; angka ini yang ditampilkan
 * Perpustakaan dan dipakai saringan di Cetak Latihan, supaya guru yang
 * memilih -- bukan sistem yang menebak.
 */
export function sebaranKelas(soalList = []) {
  const daftar = Array.isArray(soalList) ? soalList : [];
  const hitung = new Map();
  for (const s of daftar) {
    const k = String(s?.kelas ?? '').trim() || '(tanpa kelas)';
    hitung.set(k, (hitung.get(k) || 0) + 1);
  }
  return [...hitung.entries()].sort((a, b) => a[0].localeCompare(b[0], 'id'));
}

export default { normMapel, normJenjang, identitasKonten, bangunPohon, saringPohon, sebaranKelas };
