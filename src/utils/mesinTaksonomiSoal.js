// src/utils/mesinTaksonomiSoal.js
// Mesin deteksi otomatis metadata soal agar bank rapi:
// jenjang, kelas, mapel, bab, subBab, topik, capaian, kelompok, level.
// Dipakai saat impor baru DAN saat merapikan soal yang sudah terlanjur upload.

const NORM = (s) => String(s || '')
  .toLowerCase()
  .normalize('NFKD')
  .replace(/[\u0300-\u036f]/g, '')
  .replace(/[^a-z0-9\s\-_/]/g, ' ')
  .replace(/\s+/g, ' ')
  .trim();

/** Katalog mapel → kode + sinonim deteksi */
export const KATALOG_MAPEL = [
  { kode: 'bing', nama: 'Bahasa Inggris', keys: ['bahasa inggris', 'english', 'b.inggris', 'b inggris', 'binggris', 'toeic', 'toefl'] },
  { kode: 'bind', nama: 'Bahasa Indonesia', keys: ['bahasa indonesia', 'b.indonesia', 'b indonesia', 'bindo', 'literasi indonesia'] },
  { kode: 'mtk', nama: 'Matematika', keys: ['matematika', 'math', 'matematik', 'mtk', 'aljabar', 'geometri', 'kalkulus'] },
  { kode: 'fis', nama: 'Fisika', keys: ['fisika', 'physics'] },
  { kode: 'kim', nama: 'Kimia', keys: ['kimia', 'chemistry'] },
  { kode: 'bio', nama: 'Biologi', keys: ['biologi', 'biology'] },
  { kode: 'sej', nama: 'Sejarah', keys: ['sejarah', 'history'] },
  { kode: 'geo', nama: 'Geografi', keys: ['geografi', 'geography'] },
  { kode: 'eko', nama: 'Ekonomi', keys: ['ekonomi', 'economy', 'akuntansi'] },
  { kode: 'sos', nama: 'Sosiologi', keys: ['sosiologi', 'sociology', 'sosio'] },
  { kode: 'ant', nama: 'Antropologi', keys: ['antropologi', 'anthropology'] },
  { kode: 'mtk_tl', nama: 'Matematika Tingkat Lanjut', keys: ['matematika tingkat lanjut', 'matematika lanjut', 'mtk tingkat lanjut', 'mtk lanjut', 'math advanced', 'matematika peminatan'] },
  { kode: 'bind_tl', nama: 'Bahasa Indonesia Tingkat Lanjut', keys: ['bahasa indonesia tingkat lanjut', 'bindo tingkat lanjut', 'bahasa indonesia lanjut', 'bind lanjut'] },
  { kode: 'bing_tl', nama: 'Bahasa Inggris Tingkat Lanjut', keys: ['bahasa inggris tingkat lanjut', 'english advanced', 'bing tingkat lanjut', 'bahasa inggris lanjut', 'english lanjut'] },
  { kode: 'pkn', nama: 'PPKn', keys: ['ppkn', 'pkn', 'pendidikan kewarganegaraan', 'civics'] },
  { kode: 'ipa', nama: 'IPA', keys: ['ipa', 'ilmu pengetahuan alam'] },
  { kode: 'ips', nama: 'IPS', keys: ['ips', 'ilmu pengetahuan sosial'] },
  { kode: 'ipas', nama: 'IPAS', keys: ['ipas', 'ilmu pengetahuan alam dan sosial'] },
  { kode: 'pai', nama: 'PAI', keys: ['pai', 'agama islam', 'pendidikan agama'] },
  { kode: 'seni', nama: 'Seni Budaya', keys: ['seni budaya', 'seni'] },
  { kode: 'pjok', nama: 'PJOK', keys: ['pjok', 'olahraga', 'penjaskes'] },
  { kode: 'tik', nama: 'Informatika', keys: ['informatika', 'tik', 'komputer', 'pemrograman'] },
];

/** Bab / genre umum (Bahasa) + topik Matematika sering muncul di prediksi TKA */
export const KATALOG_BAB = [
  // Bahasa Inggris
  { bab: 'Narrative Text', keys: ['narrative', 'narrative text', 'cerita', 'legend', 'folktale', 'fable'] },
  { bab: 'Recount Text', keys: ['recount', 'recount text'] },
  { bab: 'Descriptive Text', keys: ['descriptive', 'descriptive text'] },
  { bab: 'Report Text', keys: ['report text', 'report'] },
  { bab: 'Explanation Text', keys: ['explanation', 'explanation text'] },
  { bab: 'Procedure Text', keys: ['procedure', 'procedure text'] },
  { bab: 'Analytical Exposition', keys: ['analytical exposition', 'exposition'] },
  { bab: 'Hortatory Exposition', keys: ['hortatory'] },
  { bab: 'Discussion Text', keys: ['discussion text', 'discussion'] },
  { bab: 'News Item', keys: ['news item', 'news'] },
  { bab: 'Spoof', keys: ['spoof'] },
  { bab: 'Review Text', keys: ['review text', 'review'] },
  { bab: 'Argumentative', keys: ['argumentative', 'argument'] },
  { bab: 'Reading Comprehension', keys: ['reading comprehension', 'reading', 'passage', 'the following text'] },
  // Bahasa Indonesia
  { bab: 'Teks Narasi', keys: ['teks narasi', 'narasi'] },
  { bab: 'Teks Deskripsi', keys: ['teks deskripsi'] },
  { bab: 'Teks Eksposisi', keys: ['teks eksposisi', 'eksposisi'] },
  { bab: 'Teks Argumentasi', keys: ['teks argumentasi', 'argumentasi'] },
  { bab: 'Teks Prosedur', keys: ['teks prosedur'] },
  { bab: 'Teks Laporan', keys: ['teks laporan', 'laporan hasil observasi'] },
  { bab: 'Puisi', keys: ['puisi', 'pantun', 'syair'] },
  { bab: 'Surat', keys: ['surat resmi', 'surat lamaran'] },
  // Matematika
  { bab: 'Bangun Ruang', keys: ['bangun ruang', 'kubus', 'balok', 'prisma', 'limas', 'tabung', 'kerucut', 'bola'] },
  { bab: 'Bangun Datar', keys: ['bangun datar', 'persegi', 'segitiga', 'lingkaran', 'trapesium'] },
  { bab: 'Aljabar', keys: ['aljabar', 'persamaan', 'pertidaksamaan', 'fungsi linear'] },
  { bab: 'Trigonometri', keys: ['trigonometri', 'sin cos', 'sinus', 'cosinus'] },
  { bab: 'Statistika', keys: ['statistika', 'mean', 'median', 'modus', 'simpangan'] },
  { bab: 'Peluang', keys: ['peluang', 'probabilitas'] },
  { bab: 'Barisan dan Deret', keys: ['barisan', 'deret', 'aritmetika', 'geometri'] },
  { bab: 'Limit dan Turunan', keys: ['limit', 'turunan', 'derivatif'] },
  { bab: 'Integral', keys: ['integral'] },
];

export const KATALOG_CAPAIAN = [
  { kode: 'C1', nama: 'Mengingat', keys: ['mengingat', 'menyebutkan', 'mengidentifikasi'] },
  { kode: 'C2', nama: 'Memahami', keys: ['memahami', 'menjelaskan', 'main idea', 'inferred', 'kesimpulan'] },
  { kode: 'C3', nama: 'Menerapkan', keys: ['menerapkan', 'menghitung', 'menggunakan rumus'] },
  { kode: 'C4', nama: 'Menganalisis', keys: ['menganalisis', 'membedakan', 'membandingkan', 'which of the following'] },
  { kode: 'C5', nama: 'Mengevaluasi', keys: ['mengevaluasi', 'menilai', 'best answer', 'paling tepat'] },
  { kode: 'C6', nama: 'Mencipta', keys: ['mencipta', 'merancang', 'menyusun'] },
];

function skorKeys(teks, keys) {
  let s = 0;
  for (const k of keys) {
    if (teks.includes(k)) s += k.length > 12 ? 3 : k.length > 6 ? 2 : 1;
  }
  return s;
}

export function deteksiMapel(teksGabungan, hint = {}) {
  if (hint.mapel || hint.mataPelajaran) {
    const h = NORM(hint.mapel || hint.mataPelajaran);
    const hit = KATALOG_MAPEL.find((m) => m.nama.toLowerCase() === h || m.keys.some((k) => h.includes(k)) || h.includes(m.kode));
    if (hit) return { kode: hit.kode, nama: hit.nama, yakin: 0.95 };
  }
  const t = NORM(teksGabungan);
  let best = null;
  let bestS = 0;
  for (const m of KATALOG_MAPEL) {
    const s = skorKeys(t, m.keys);
    if (s > bestS) { bestS = s; best = m; }
  }
  if (!best || bestS === 0) return { kode: '', nama: hint.mapel || '', yakin: 0 };
  return { kode: best.kode, nama: best.nama, yakin: Math.min(0.95, 0.4 + bestS * 0.1) };
}

export function deteksiJenjangKelas(teksGabungan, hint = {}) {
  const t = NORM(teksGabungan + ' ' + (hint.jenjang || '') + ' ' + (hint.kelas || '') + ' ' + (hint.tingkatKelas || ''));
  let jenjang = hint.jenjang || '';
  let kelas = String(hint.kelas || hint.tingkatKelas || '').replace(/[^0-9a-z]/gi, '');

  if (/\bsma\b|\bsmak\b|\bkelas\s*1[012]\b|\bclass\s*1[012]\b|\bxii\b|\bxi\b|\bx\b/.test(t)) jenjang = jenjang || 'SMA';
  if (/\bsmp\b|\bkelas\s*[789]\b|\bviii\b|\bvii\b|\bix\b/.test(t)) jenjang = jenjang || 'SMP';
  if (/\bsd\b|\bkelas\s*[1-6]\b/.test(t) && !jenjang) jenjang = 'SD';
  if (/\bsmk\b/.test(t)) jenjang = 'SMK';
  if (/\btka\b|\ttes kemampuan akademik\b|\butbk\b|\bsnmptn\b/.test(t)) jenjang = jenjang || 'SMA';

  const mKelas = t.match(/\bkelas\s*(10|11|12|7|8|9|[1-6]|xii|xi|x|ix|viii|vii)\b/);
  if (mKelas) {
    const mapRom = { xii: '12', xi: '11', x: '10', ix: '9', viii: '8', vii: '7' };
    kelas = mapRom[mKelas[1]] || mKelas[1];
  }
  if (!kelas && jenjang === 'SMA' && /\b12\b|\bxii\b/.test(t)) kelas = '12';
  if (!kelas && jenjang === 'SMA' && /\b11\b|\bxi\b/.test(t)) kelas = '11';
  if (!kelas && jenjang === 'SMA' && /\b10\b|\bx\b/.test(t)) kelas = '10';

  return {
    jenjang: jenjang || '',
    kelas: kelas || '',
    yakin: jenjang ? (kelas ? 0.9 : 0.7) : 0.2,
  };
}

export function deteksiBabSubBab(teksGabungan, hint = {}) {
  if (hint.bab) return { bab: hint.bab, subBab: hint.subBab || hint.subbab || '', topik: hint.topik || hint.bab, yakin: 0.9 };
  const t = NORM(teksGabungan);
  let best = null;
  let bestS = 0;
  for (const b of KATALOG_BAB) {
    const s = skorKeys(t, b.keys);
    if (s > bestS) { bestS = s; best = b; }
  }
  const bab = best && bestS > 0 ? best.bab : (hint.topik || '');
  const subBab = hint.subBab || hint.subbab || hint.subtopik || '';
  return {
    bab,
    subBab,
    topik: hint.topik || bab,
    subtopik: hint.subtopik || subBab,
    yakin: bestS > 0 ? Math.min(0.9, 0.35 + bestS * 0.12) : 0.15,
  };
}

export function deteksiLevel(teksGabungan, hint = {}) {
  if (hint.level) return { level: String(hint.level).toLowerCase(), yakin: 0.9 };
  const t = NORM(teksGabungan);
  if (/\bsulit\b|\bhard\b|\badvanced\b|\bc4\b|\bc5\b|\bc6\b/.test(t)) return { level: 'sulit', yakin: 0.7 };
  if (/\bmudah\b|\beasy\b|\bc1\b|\bc2\b/.test(t)) return { level: 'mudah', yakin: 0.7 };
  return { level: 'sedang', yakin: 0.5 };
}

export function deteksiCapaian(teksGabungan, hint = {}) {
  if (Array.isArray(hint.capaian) && hint.capaian.length) return { capaian: hint.capaian, yakin: 0.9 };
  const t = NORM(teksGabungan);
  const hit = [];
  for (const c of KATALOG_CAPAIAN) {
    if (skorKeys(t, c.keys) > 0) hit.push(`${c.kode} ${c.nama}`);
  }
  // Heuristik tipe soal
  if (/more than one correct|pilih semua|lebih dari satu/.test(t) && !hit.includes('C4 Menganalisis')) {
    hit.push('C4 Menganalisis');
  }
  if (/main idea|inferred|kesimpulan|purpose of the text/.test(t)) {
    if (!hit.find((x) => x.startsWith('C2'))) hit.push('C2 Memahami');
  }
  return { capaian: hit.slice(0, 3), yakin: hit.length ? 0.65 : 0.2 };
}

export function deteksiKelompok(teksGabungan, hint = {}) {
  if (hint.kelompok) return { kelompok: hint.kelompok, yakin: 1 };
  const t = NORM(teksGabungan);
  if (/\bprediksi\b/.test(t)) return { kelompok: 'prediksi', yakin: 0.85 };
  if (/\btry\s*out\b|\btryout\b|\bto\b/.test(t)) return { kelompok: 'tryout', yakin: 0.8 };
  if (/\blatihan\b|\bdrill\b/.test(t)) return { kelompok: 'latihan', yakin: 0.75 };
  if (/\buts\b|\buas\b|\bulangan\b/.test(t)) return { kelompok: 'ulangan', yakin: 0.8 };
  if (/\btka\b|\btes kemampuan akademik\b/.test(t)) return { kelompok: 'prediksi-tka', yakin: 0.85 };
  return { kelompok: hint.sumber ? slug(hint.sumber) : 'umum', yakin: 0.4 };
}

function slug(s) {
  return NORM(s).replace(/\s+/g, '-').slice(0, 48);
}

/**
 * Deteksi penuh dari satu soal + konteks file/batch.
 * @param {object} soal - field bebas (teksSoal, soal, opsi, …)
 * @param {object} konteks - { fileName, mapel, jenjang, kelas, kelompok, sumber }
 */
export function deteksiTaksonomiSoal(soal = {}, konteks = {}) {
  const potongan = [
    konteks.fileName,
    konteks.sumber,
    konteks.mapel,
    konteks.jenjang,
    soal.teksSoal || soal.soal || soal.pertanyaan || '',
    soal.topik,
    soal.subtopik,
    soal.bab,
    Array.isArray(soal.opsiJawaban) ? soal.opsiJawaban.map((o) => (typeof o === 'string' ? o : o?.teks || '')).join(' ') : '',
    soal.kunciJawaban,
    soal.tipe,
  ].join(' ');

  const mapel = deteksiMapel(potongan, { ...konteks, ...soal });
  const jk = deteksiJenjangKelas(potongan, { ...konteks, ...soal });
  const bab = deteksiBabSubBab(potongan, { ...konteks, ...soal });
  const level = deteksiLevel(potongan, { ...konteks, ...soal });
  const capaian = deteksiCapaian(potongan, { ...konteks, ...soal });
  const kelompok = deteksiKelompok(potongan, { ...konteks, ...soal });

  const yakinRata = (mapel.yakin + jk.yakin + bab.yakin + level.yakin + capaian.yakin + kelompok.yakin) / 6;

  return {
    jenjang: jk.jenjang,
    kelas: jk.kelas,
    mapel: mapel.nama,
    kodeMapel: mapel.kode,
    bab: bab.bab,
    subBab: bab.subBab,
    topik: bab.topik,
    subtopik: bab.subtopik,
    capaian: capaian.capaian,
    level: level.level,
    kelompok: kelompok.kelompok,
    sumber: konteks.sumber || konteks.fileName || soal.sumberFile || '',
    yakin: Math.round(yakinRata * 100) / 100,
    detailYakin: {
      mapel: mapel.yakin,
      jenjang: jk.yakin,
      bab: bab.yakin,
      level: level.yakin,
      capaian: capaian.yakin,
      kelompok: kelompok.yakin,
    },
  };
}

/**
 * Gabungkan taksonomi ke dokumen bank_soal (tidak menimpa field yang
 * sudah diisi manual dengan yakin tinggi / non-kosong kecuali force).
 */
export function terapkanTaksonomi(docSoal, taksonomi, { force = false } = {}) {
  const out = { ...docSoal };
  const set = (field, value) => {
    if (value === undefined || value === null || value === '' || (Array.isArray(value) && !value.length)) return;
    if (force || out[field] === undefined || out[field] === null || out[field] === '') {
      out[field] = value;
    }
  };
  set('jenjang', taksonomi.jenjang);
  set('kelas', taksonomi.kelas);
  set('tingkatKelas', taksonomi.kelas); // alias lama
  set('mapel', taksonomi.mapel);
  set('mataPelajaran', taksonomi.mapel); // alias lama
  set('kodeMapel', taksonomi.kodeMapel);
  set('bab', taksonomi.bab);
  set('subBab', taksonomi.subBab);
  set('topik', taksonomi.topik);
  set('subtopik', taksonomi.subtopik);
  set('capaian', taksonomi.capaian);
  set('level', taksonomi.level);
  set('kelompok', taksonomi.kelompok);
  set('sumber', taksonomi.sumber);
  out.taksonomiYakin = taksonomi.yakin;
  out.taksonomiAuto = true;
  out.taksonomiAt = Date.now();
  return out;
}

/**
 * Agregasi soal ke bucket rapi untuk preview UI.
 * key: jenjang|kelas|mapel|bab|kelompok
 */
export function kelompokkanSoal(daftar) {
  const map = new Map();
  for (const s of daftar) {
    const key = [s.jenjang || '?', s.kelas || '?', s.mapel || s.mataPelajaran || '?', s.bab || s.topik || '?', s.kelompok || '?'].join(' | ');
    if (!map.has(key)) map.set(key, []);
    map.get(key).push(s);
  }
  return [...map.entries()]
    .map(([key, items]) => ({ key, jumlah: items.length, items }))
    .sort((a, b) => b.jumlah - a.jumlah);
}

export default {
  KATALOG_MAPEL,
  KATALOG_BAB,
  deteksiTaksonomiSoal,
  terapkanTaksonomi,
  kelompokkanSoal,
  deteksiMapel,
  deteksiJenjangKelas,
  deteksiBabSubBab,
};
