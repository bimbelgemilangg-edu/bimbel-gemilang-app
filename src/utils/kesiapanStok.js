// src/utils/kesiapanStok.js
// ============================================================
// MESIN DASBOR KESIAPAN STOK — jantung dari "render soal sebanyak-banyaknya
// untuk stok" yang punya arah, bukan menebak.
//
// KENAPA ADA (arahan owner 2026-10-11): tugas utamanya menyetok lemari soal
// karena AI penerbit try out akan memakan stok itu. Tanpa peta stok, usaha
// render buta: tidak tahu subtes mana yang miskin (dugaan dari audit
// 2026-10-08: justru TPS PU/PPU dan mapel pilihan TKA, BUKAN Matematika),
// dan tidak tahu apakah stok yang "banyak" itu kebanyakan pembahasan
// penalaran AI alias karangan yang belum direview tentor.
//
// Util ini MEMISAHKAN dengan keras:
//   aktif vs terhapus · berkunci vs tidak · pembahasan tercetak vs
//   penalaran vs tanpa pembahasan · gambar menunggu potongan.
// Sehingga "SIAP" berarti siap sungguhan: cukup butir, cukup kunci, dan
// mayoritas penjelasannya berasal dari buku, bukan dari model.
//
// Angka target datang dari TAKSONOMI-&-TARGET-STOK.md dan DISEDIKAN PEMAKAI
// (owner mengesahkan); bila tidak diberikan, dipakai default konservatif.
// MURNI & TERUJI (tests/kesiapanStok.test.mjs) — tidak menyentuh Firestore;
// halaman dasbor hanya mengambil dokumen lalu memanggil ini.
// ============================================================

export const TARGET_STOK_DEFAULT = { min: 100, rasioTerCetak: 0.6 };

export const STATUS_STOK = {
  SIAP: 'SIAP',
  TIPIS: 'TIPIS',
  KUALITAS: 'KUALITAS',
  KOSONG: 'KOSONG',
};

function teks(v) {
  return String(v ?? '').trim();
}

function identitas(b) {
  return {
    jenjang: teks(b?.jenjang) || '(tanpa jenjang)',
    mapel: teks(b?.mataPelajaran) || teks(b?.mapel) || '(tanpa mapel)',
    jenisUjian: teks(b?.jenisUjian) || teks(b?.jenis_ujian) || 'umum',
  };
}

export function kunciGrup(b) {
  const { jenjang, mapel, jenisUjian } = identitas(b);
  return `${jenjang}|${mapel}|${jenisUjian}`;
}

function aktif(b) {
  const s = teks(b?.status).toLowerCase();
  return s !== 'terhapus' && s !== 'nonaktif' && s !== 'tersembunyi';
}

function berkunci(b) {
  const k = b?.kunciJawaban;
  if (Array.isArray(k)) return k.length > 0;
  return teks(k).length > 0 || teks(b?.tipe) === 'esai';
}

function adaPembahasan(b) {
  return teks(b?.pembahasan).length > 0;
}

/**
 * Hitung kesiapan stok per grup (jenjang × mapel × jenis ujian).
 * @param {Array<object>} butir dokumen bank_soal (atau proyeksinya)
 * @param {Object<string,{min:number,rasioTerCetak:number}>} [target]
 *        peta kunciGrup -> target; kunci 'default' dipakai bila grup tak terdaftar
 * @returns {{baris:Array<object>, ringkasan:object}}
 */
export function hitungKesiapanStok(butir = [], target = {}) {
  const peta = new Map();
  for (const b of Array.isArray(butir) ? butir : []) {
    if (!aktif(b)) continue;
    const k = kunciGrup(b);
    if (!peta.has(k)) {
      const { jenjang, mapel, jenisUjian } = identitas(b);
      peta.set(k, {
        kunci: k, jenjang, mapel, jenisUjian,
        aktif: 0, berkunci: 0, tercetak: 0, penalaran: 0, tanpaPembahasan: 0, gambarTertunda: 0,
      });
    }
    const g = peta.get(k);
    g.aktif += 1;
    if (berkunci(b)) g.berkunci += 1;
    const asal = teks(b?.pembahasanAsal).toLowerCase();
    if (adaPembahasan(b)) {
      if (asal === 'penalaran') g.penalaran += 1;
      else g.tercetak += 1;
    } else {
      g.tanpaPembahasan += 1;
    }
    if ((b?.potonganTertunda || []).length > 0) g.gambarTertunda += 1;
  }

  const defaultTarget = target.default || TARGET_STOK_DEFAULT;
  const baris = [...peta.values()].map((g) => {
    const t = target[g.kunci] || defaultTarget;
    const rasio = g.aktif ? g.tercetak / g.aktif : 0;
    let status;
    if (g.aktif === 0) status = STATUS_STOK.KOSONG;
    else if (g.aktif < t.min) status = STATUS_STOK.TIPIS;
    else if (rasio < t.rasioTerCetak) status = STATUS_STOK.KUALITAS;
    else status = STATUS_STOK.SIAP;
    return {
      ...g,
      target: t.min,
      rasioTerCetak: Math.round(rasio * 100) / 100,
      targetRasio: t.rasioTerCetak,
      kekurangan: Math.max(0, t.min - g.aktif),
      status,
    };
  });

  baris.sort((a, b) => (b.kekurangan - a.kekurangan) || a.kunci.localeCompare(b.kunci));

  const ringkasan = baris.reduce((r, b) => {
    r.totalAktif += b.aktif;
    r.totalTercetak += b.tercetak;
    r.totalPenalaran += b.penalaran;
    r.totalTanpaPembahasan += b.tanpaPembahasan;
    r.totalGambarTertunda += b.gambarTertunda;
    r[b.status.toLowerCase()] = (r[b.status.toLowerCase()] || 0) + 1;
    return r;
  }, {
    jumlahGrup: baris.length, totalAktif: 0, totalTercetak: 0, totalPenalaran: 0,
    totalTanpaPembahasan: 0, totalGambarTertunda: 0,
    siap: 0, tipis: 0, kualitas: 0, kosong: 0,
  });

  return { baris, ringkasan };
}

export default { hitungKesiapanStok, kunciGrup, TARGET_STOK_DEFAULT, STATUS_STOK };
