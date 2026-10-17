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
  // 17 Okt: soal BERGAMBAR wajib ikut ter-render di semua hilir —
  // gambar (tunggal maupun daftar) dibawa sebagai data-URI lalu
  // diunggah ke penyimpanan oleh halaman impor sebelum simpan.
  const gambarUrls = [item.gambar_base64, ...(Array.isArray(item.daftar_gambar_base64) ? item.daftar_gambar_base64 : [])]
    .filter(Boolean).map(keDataUri);
  const opsiBersih = item.opsi_teks_bersih || {};
  return {
    tipe: 'pg',
    nomor: Number(item.nomor || 0),
    soal: String(item.pertanyaan || item.soal || '').trim(),
    pilihan,
    benar: idx >= 0 && idx < pilihan.length ? idx : null,
    pembahasan: String(item.pembahasan || ''),
    gambarUrls,
    soalTeksBersih: String(item.pertanyaan_teks_bersih || '').trim(),
    opsiTeksBersih: HURUF.filter((h) => opsiBersih[h] != null).map((h) => String(opsiBersih[h])),
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
  const statistik = { bab: 0, seksi: 0, soalContoh: 0, soalLatihan: 0, soalHots: 0, soalBerkunci: 0, soalUraian: 0, gambar: 0, soalBergambar: 0, babTanpaLatihan: [] };
  for (const b of daftar) {
    const sections = (Array.isArray(b.materi) ? b.materi : []).map((m, mi) => {
      const blocks = [];
      if (m.penjelasan) blocks.push({ tipe: 'p', teks: String(m.penjelasan) });
      for (const r of Array.isArray(m.rumus_latex) ? m.rumus_latex : []) {
        // 17 Okt: entri rumus_latex yang sebenarnya PROSA ber-inline-math
        // ("1. Bentuk Dasar: Jika $...$; jika $...$") dulu dipaksa jadi
        // blok math -> KaTeX menerima kalimat -> dinding teks merah.
        // Prosa -> blok p (MathText); murni display -> blok math.
        const plain = String(r).replace(/\$\$[\s\S]*?\$\$|\$[^\n$]*?\$/g, '').replace(/[^A-Za-z]/g, '');
        if (plain.length > 12) blocks.push({ tipe: 'p', teks: String(r) });
        else blocks.push({ tipe: 'math', teks: latexMurni(r) });
      }
      const gambars = [m.gambar_base64, ...(Array.isArray(m.daftar_gambar_base64) ? m.daftar_gambar_base64 : [])].filter(Boolean);
      gambars.forEach((g, gi) => {
        statistik.gambar += 1;
        blocks.push({
          tipe: 'gambar',
          src: keDataUri(g),
          alt: m.judul || '',
          caption: gambars.length > 1 ? `${m.judul || ''} — gambar ${gi + 1}/${gambars.length}` : (m.judul || ''),
        });
      });
      // tumpukan gambar beruntun -> satu blok GALERI (grid rapi), bukan
      // dinding gambar tanpa konteks (keluhan owner 17 Okt)
      const rapat = [];
      for (const bl of blocks) {
        if (bl.tipe === 'gambar' && rapat[rapat.length - 1]?.tipe === 'galeri') rapat[rapat.length - 1].items.push({ src: bl.src, caption: bl.caption });
        else if (bl.tipe === 'gambar') rapat.push({ tipe: 'galeri', items: [{ src: bl.src, caption: bl.caption }] });
        else rapat.push(bl);
      }
      const keluar = rapat.map((bl) => (bl.tipe === 'galeri' && bl.items.length === 1 ? { tipe: 'gambar', src: bl.items[0].src, alt: bl.items[0].caption, caption: bl.items[0].caption } : bl));
      statistik.seksi += 1;
      return { id: `${b.id_bab || 'bab'}-s${mi + 1}`, judul: `${m.kode_subbab ? `${m.kode_subbab}. ` : ''}${m.judul || ''}`, blocks: keluar };
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
      if (q) { uji.push(q); statistik.soalContoh += 1; if (q.benar !== null) statistik.soalBerkunci += 1; if (q.gambarUrls.length) statistik.soalBergambar += 1; }
    }
    for (const l of Array.isArray(b.latihan_soal) ? b.latihan_soal : []) {
      if (!l.opsi || Object.keys(l.opsi).length < 2) { masukUraian(l, 'latihan'); continue; }
      const q = soalDari(l, { asal: 'latihan', kunciMap: b.kunci_jawaban_latihan });
      if (q) { uji.push(q); statistik.soalLatihan += 1; if (q.benar !== null) statistik.soalBerkunci += 1; if (q.gambarUrls.length) statistik.soalBergambar += 1; }
    }
    for (const h of Array.isArray(b.soal_hots_ujian_asli) ? b.soal_hots_ujian_asli : []) {
      if (!h.opsi || Object.keys(h.opsi).length < 2) { masukUraian(h, 'hots'); continue; }
      const q = soalDari(h, { asal: 'hots', kunciMap: b.kunci_jawaban_latihan });
      if (q) { uji.push(q); statistik.soalHots += 1; if (q.benar !== null) statistik.soalBerkunci += 1; }
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
  const KELUARGA_OTOMATIS = new Set(['json-bertahap', 'latex-html', 'scan-proyek']);
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
