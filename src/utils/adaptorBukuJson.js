// src/utils/adaptorBukuJson.js
// ============================================================
// ADAPTOR DIALEK JSON EKSTRAKSI BERTAHAP (16 Okt 2026): alat owner
// kini mengeluarkan JSON terstruktur (metadata + daftar_bab[] dengan
// materi/kode_subbab/rumus_latex/gambar_base64, contoh_soal ber-
// pembahasan, latihan_soal + kunci_jawaban_latihan). Ekstraksi sengaja
// BERTAHAP (bab Logaritma & Barisan-Deret dst. menyusul), maka sistem
// wajib mendukung IMPOR ULANG yang MEMPERBARUI bab ber-id sama, bukan
// mendobel atau malah membuang yang baru.
//
// Kontrak keluaran = KONTRAK BAB READER + field `kodeSumber` (id_bab)
// sebagai kunci upsert lintas ekstraksi.
// ============================================================

const HURUF = ['A', 'B', 'C', 'D', 'E'];

/**
 * Lucut pembungkus display-math ($$...$$ / \[...\]) agar blok `math`
 * menerima latex MURNI. Regresi 16 Okt: MathBlock menerima '$$...$$'
 * utuh -> KaTeX error -> rumus tampil sebagai teks merah di reader.
 */
export function latexMurni(teks = '') {
  const t = String(teks || '').trim();
  if (t.startsWith('$$') && t.endsWith('$$') && t.length > 4) return t.slice(2, -2).trim();
  if (t.startsWith('\\[') && t.endsWith('\\]') && t.length > 4) return t.slice(2, -2).trim();
  return t;
}

const keDataUri = (v) => (String(v || '').startsWith('data:') ? String(v) : `data:image/png;base64,${v}`);

const normJudul = (s) => String(s ?? '').toLowerCase().replace(/\s+/g, ' ').trim();

/** Butir bank tipe URAIAN (soal ber-subbab tanpa opsi A-E): masuk bank
 *  & cetak/tryout esai, TIDAK masuk kuis reader (quiz hanya pg/multi/bs). */
export function butirUraianDari(item = {}, identitas = {}) {
  const teks = String(item.soal || '').trim();
  if (!teks) return null;
  return {
    tipe: 'uraian',
    soal: teks,
    pembahasan: String(item.pembahasan || ''),
    gambarUrls: [],
    mataPelajaran: identitas.mapel || '',
    materi: identitas.materi || '',
    tingkatKelas: identitas.kelas || '',
    jenjang: identitas.jenjang || 'SMA/MA',
    kategori: 'Buku',
    tags: ['buku', identitas.materi || ''].filter(Boolean),
    tingkatKesulitan: 'sedang',
    sumberFile: identitas.sumber || '',
    sumberHalaman: null,
    status: 'aktif',
    kunciTerverifikasi: true,
  };
}

/** Satu soal JSON (contoh/latihan) -> soal kontrak reader. */
function soalDari(item = {}, opts = {}) {
  const opsi = item.opsi || {};
  const pilihan = HURUF.filter((h) => opsi[h] != null).map((h) => opsi[h]);
  if (pilihan.length < 2) return null;
  const hurufKunci = item.kunci_jawaban || item.jawaban || (opts.kunciMap || {})[item.nomor];
  const idx = typeof hurufKunci === 'string' ? hurufKunci.toUpperCase().charCodeAt(0) - 65 : -1;
  return {
    tipe: 'pg',
    nomor: Number(item.nomor || 0),
    soal: String(item.pertanyaan || item.soal || '').trim(),
    pilihan,
    benar: idx >= 0 && idx < pilihan.length ? idx : null,
    pembahasan: String(item.pembahasan || ''),
    gambarUrls: [],
    asalJenis: opts.asal || 'latihan',
    ...(idx >= 0 ? { kunciResmiBuku: true } : {}),
  };
}

/**
 * @param {object} obj dokumen JSON ekstraksi owner
 * @returns {{bab: Array, statistik: object, judulBuku: string}}
 */
export function adaptorBukuJson(obj = {}) {
  const daftar = Array.isArray(obj.daftar_bab) ? obj.daftar_bab : [];
  const bab = [];
  const statistik = { bab: 0, seksi: 0, soalContoh: 0, soalLatihan: 0, soalBerkunci: 0, soalUraian: 0, gambar: 0, babTanpaLatihan: [] };
  for (const b of daftar) {
    const sections = (Array.isArray(b.materi) ? b.materi : []).map((m, mi) => {
      const blocks = [];
      if (m.penjelasan) blocks.push({ tipe: 'p', teks: String(m.penjelasan) });
      for (const r of Array.isArray(m.rumus_latex) ? m.rumus_latex : []) blocks.push({ tipe: 'math', teks: latexMurni(r) });
      if (m.gambar_base64) {
        blocks.push({ tipe: 'gambar', src: keDataUri(m.gambar_base64), alt: m.judul || '', caption: m.judul || '' });
        statistik.gambar += 1;
      }
      statistik.seksi += 1;
      return { id: `${b.id_bab || 'bab'}-s${mi + 1}`, judul: `${m.kode_subbab ? `${m.kode_subbab}. ` : ''}${m.judul || ''}`, blocks };
    });
    const uji = [];
    const uraian = [];
    const masukUraian = (item, asal) => {
      uraian.push({ nomor: Number(item.nomor || 0), soal: String(item.pertanyaan || item.soal || '').trim(), pembahasan: String(item.pembahasan || item.jawaban || ''), asalJenis: asal });
      statistik.soalUraian += 1;
    };
    for (const c of Array.isArray(b.contoh_soal) ? b.contoh_soal : []) {
      if (!c.opsi || Object.keys(c.opsi).length < 2) { masukUraian(c, 'contoh'); continue; }
      const q = soalDari(c, { asal: 'contoh' });
      if (q) { uji.push(q); statistik.soalContoh += 1; if (q.benar !== null) statistik.soalBerkunci += 1; }
    }
    for (const l of Array.isArray(b.latihan_soal) ? b.latihan_soal : []) {
      if (!l.opsi || Object.keys(l.opsi).length < 2) { masukUraian(l, 'latihan'); continue; }
      const q = soalDari(l, { asal: 'latihan', kunciMap: b.kunci_jawaban_latihan });
      if (q) { uji.push(q); statistik.soalLatihan += 1; if (q.benar !== null) statistik.soalBerkunci += 1; }
    }
    if (!(Array.isArray(b.latihan_soal) && b.latihan_soal.length)) statistik.babTanpaLatihan.push(b.judul_bab || b.id_bab);
    statistik.bab += 1;
    bab.push({
      judul: `Bab ${b.nomor_bab_buku ?? ''} ${b.judul_bab || ''}`.replace(/\s+/g, ' ').trim(),
      nomorBab: Number(b.nomor_bab_buku || 0),
      soalUraian: uraian,
      kodeSumber: b.id_bab || '',
      metaSumber: { semester: b.semester, domain: b.domain_kurikulum_merdeka, halamanBuku: b.halaman_buku },
      sections,
      ujiPemahaman: uji,
    });
  }
  // RAPI (16 Okt): urutan bab mengikuti NOMOR BUKU, bukan urutan berkas
  // (ekstraksi bertahap sering datang acak: 1,2,3,16,14,...).
  bab.sort((a, b2) => (a.nomorBab || 999) - (b2.nomorBab || 999));
  return { bab, statistik, judulBuku: obj.metadata?.judul_dokumen || '' };
}

/**
 * RENCANA UPSERT IMPOR BERTAHAP: bab baru yang kodeSumber (atau judul)
 * nya sama dengan bab tersimpan DIUPDATE di tempat; sisanya ditambah.
 * Pagar: bab tersimpan hasil kerja MANUAL editor (sumberImpor di luar
 * keluarga otomatis) tidak ditimpa — masuk daftar `tambah` agar tidak
 * ada kerja manusia yang hilang oleh mesin.
 * @param {Array} babBaru payload bab (punya kodeSumber/judul)
 * @param {Array} eksBab bab tersimpan, tiap entri punya __id doc
 */
export function rencanakanUpsertBab(babBaru = [], eksBab = []) {
  const KELUARGA_OTOMATIS = new Set(['json-bertahap', 'latex-html']);
  const keyOf = (b) => b?.kodeSumber || normJudul(b?.judul);
  const indeks = new Map();
  for (const e of Array.isArray(eksBab) ? eksBab : []) {
    if (!e?.__id) continue;
    const k = e.kodeSumber || normJudul(e.judul);
    if (!indeks.has(k)) indeks.set(k, e);
  }
  const perbarui = [];
  const tambah = [];
  for (const p of Array.isArray(babBaru) ? babBaru : []) {
    const e = indeks.get(keyOf(p));
    if (e && KELUARGA_OTOMATIS.has(e.sumberImpor)) perbarui.push({ idEks: e.__id, payload: p });
    else tambah.push(p);
  }
  return { perbarui, tambah };
}

export default { adaptorBukuJson, rencanakanUpsertBab };
