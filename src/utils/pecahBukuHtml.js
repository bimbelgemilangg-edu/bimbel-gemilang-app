// src/utils/pecahBukuHtml.js
// ============================================================
// Util MURNI untuk fitur IMPOR BUKU HTML (owner 14 Okt 2026):
// buku Gemilang dikonversi owner jadi HTML (pdf2html: satu <img> per
// halaman, tanpa lapisan teks). Util ini membongkar berkas itu tanpa
// browser: inventaris, urutan gambar halaman, dan pengelompokan
// halaman per panggilan AI (endpoint membatasi 14, kita pakai 10
// sesuai desain hemat kuota konversiModulScan: 1 bab = 1 panggilan).
// ============================================================

/** Ambang ukuran dokumen Firestore (1MB) — HTML buku tidak disimpan utuh. */
export const BATAS_UKURAN_FIRESTORE = 900_000;
/** Batas halaman per panggilan AI (endpoint menolak >14; desain 10). */
export const BATAS_HALAMAN_PER_PANGGILAN = 10;

/**
 * Ambil semua gambar halaman (data-URI) sesuai urutan dokumen.
 * pdf2html menulis `<img class="im" src="data:image/...;base64,...">`.
 * @param {string} html
 * @returns {string[]} data-URI urut
 */
export function ekstrakGambarHalamanDariHtml(html = '') {
  const out = [];
  const re = /<img[^>]*\ssrc="(data:image\/[a-zA-Z0-9.+-]+;base64,[^"]+)"/g;
  let m;
  while ((m = re.exec(html)) !== null) out.push(m[1]);
  return out;
}

/** Buang prefix data-URI -> base64 polos (format body endpoint). */
export function dataUriKeBase64(dataUri = '') {
  return String(dataUri).replace(/^data:image\/[a-zA-Z0-9.+-]+;base64,/, '');
}

/** Deteksi apakah HTML punya lapisan teks (bukan murni gambar halaman). */
export function adaTeksLayer(html = '') {
  if (/<span[^>]*class="[^"]*\bt[^"]*"[^>]*>[^<]{2,}<\/span>/.test(html)) return true;
  const tanpaTag = String(html).replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  return tanpaTag.length > 2000;
}

/**
 * Inventaris berkas buku HTML: cukup info untuk keputusan operator
 * (layak disimpan utuh? perlu pecah bab? murni gambar?).
 */
export function inventarisBukuHtml(html = '') {
  const gambar = ekstrakGambarHalamanDariHtml(html);
  const ukuranByte = typeof TextEncoder !== 'undefined'
    ? new TextEncoder().encode(String(html)).length
    : String(html).length;
  const teks = adaTeksLayer(html);
  return {
    jumlahGambarHalaman: gambar.length,
    adaTeksLayer: teks,
    ukuranByte,
    layakSimpanUtuhDiFirestore: ukuranByte <= BATAS_UKURAN_FIRESTORE,
    saran: gambar.length === 0 && !teks
      ? 'Berkas tidak punya gambar halaman maupun teks — bukan buku HTML yang didukung.'
      : ukuranByte > BATAS_UKURAN_FIRESTORE
        ? 'Terlalu besar untuk satu dokumen Firestore: JANGAN simpan utuh; ekstrak per bab lewat fitur Impor Buku HTML.'
        : 'OK',
  };
}

/**
 * Kelompokkan data-URI halaman jadi batch <= BATAS_HALAMAN_PER_PANGGILAN.
 * @returns {Array<{urutan:number, halamanMulai:number, halamanSelesai:number, images:string[]}>}
 */
export function kelompokkanHalamanUntukAi(dataUris = [], batas = BATAS_HALAMAN_PER_PANGGILAN) {
  const arr = Array.isArray(dataUris) ? dataUris : [];
  const n = Math.max(1, Math.min(Number(batas) || 10, 14));
  const out = [];
  for (let i = 0; i < arr.length; i += n) {
    const slice = arr.slice(i, i + n);
    out.push({
      urutan: out.length + 1,
      halamanMulai: i + 1,
      halamanSelesai: i + slice.length,
      images: slice.map(dataUriKeBase64),
      dataUris: slice, // asli ber-mime: bahan keGambarAi untuk endpoint vision
    });
  }
  return out;
}

export default {
  keGambarAi,
  ekstrakGambarHalamanDariHtml,
  dataUriKeBase64,
  adaTeksLayer,
  inventarisBukuHtml,
  kelompokkanHalamanUntukAi,
  BATAS_UKURAN_FIRESTORE,
  BATAS_HALAMAN_PER_PANGGILAN,
};

/**
 * Petakan satu soal ujiPemahaman (skema konversiModulScan) jadi butir
 * bank_soal. HANYA tipe pg yang dipetakan otomatis (paling umum & aman);
 * multi/bs dikembalikan null supaya operator memasukkan manual lewat
 * editor bank soal (jujur, tidak menebak skema kunci kompleks).
 * createdAt/createdBy diisi halaman (butuh serverTimestamp).
 */
export function butirBankDariUjiPemahaman(item, identitas = {}, halamanSumber = null) {
  if (!item || item.tipe !== 'pg') return null;
  if (!Array.isArray(item.pilihan) || item.pilihan.length < 2) return null;
  const idx = Number(item.benar);
  if (!Number.isInteger(idx) || idx < 0 || idx >= item.pilihan.length) return null;
  const teks = String(item.soal || '').trim();
  if (!teks) return null;
  return {
    tipe: 'pg_sederhana',
    soal: teks,
    opsiJawaban: item.pilihan.map((x) => String(x)),
    kunciJawaban: String.fromCharCode(65 + idx),
    // 16 Okt 2026: kunci RESMI buku (adaptor latex) layak dipercaya;
    // kunci tebakan OCR/AI tetap false sampai QC.
    kunciTerverifikasi: Boolean(item.kunciResmiBuku),
    pembahasan: String(item.pembahasan || ''),
    gambarUrls: Array.isArray(item.gambarUrls) ? item.gambarUrls : [],
    mataPelajaran: identitas.mapel || '',
    materi: identitas.materi || '',
    tingkatKelas: identitas.kelas || '',
    jenjang: identitas.jenjang || 'SMA/MA',
    kategori: 'Buku',
    tags: ['buku', identitas.materi || ''].filter(Boolean),
    tingkatKesulitan: item.level || 'sedang',
    sumberFile: identitas.sumber || '',
    sumberHalaman: halamanSumber,
    status: 'aktif',
  };
}

/**
 * Kunci penyimpanan progres impor di localStorage — spesifik per berkas
 * (nama + ukuran) supaya ganti berkas tidak memakai progres lama.
 * (File jenjang 576 halaman = ±58 panggilan AI: wajib bisa dijeda &
 * dilanjutkan tanpa mengulang kuota.)
 */
export function kunciProgresImpor(namaFile = '', ukuranByte = 0) {
  return `imporBukuHtml:${String(namaFile).toLowerCase()}:${Number(ukuranByte) || 0}`;
}

/** Perkiraan jumlah panggilan AI untuk sejumlah halaman gambar. */
export function perkiraanPanggilanAi(jumlahHalaman = 0, perPanggilan = BATAS_HALAMAN_PER_PANGGILAN) {
  const n = Math.max(1, Math.min(Number(perPanggilan) || 10, 14));
  return Math.ceil(Math.max(0, Number(jumlahHalaman) || 0) / n);
}

/** Normalisasi judul bab untuk pengelompokan (huruf/spasi/tanda diseragamkan). */
export function normJudulBab(s = '') {
  return String(s || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

/**
 * GABUNGKAN potongan 10-halaman menjadi BAB sesungguhnya (owner 15 Okt:
 * "sistem yang pecah babnya — aku upload kelas 10 dengan semua bab").
 * Endpoint konversiModulScan sudah mengembalikan `bab.judul` = judul bab
 * SEPERTI TERCETAK di halaman (dibaca AI vision); potongan berurutan dengan
 * judul ternormalisasi sama dilebur jadi satu bab: sections & ujiPemahaman
 * digabung, rentang halaman diperlebar. Judul kosong/tak terbaca tetap
 * menjadi bab sendiri (fallback nama kelompok halaman).
 * @param {Array<{grup:object, bab:object, provider?:string}>} hasilBerurutan
 * @returns {Array<object>} bab gabungan urut
 */
export function gabungkanBabBerjudul(hasilBerurutan = []) {
  const gabung = [];
  (Array.isArray(hasilBerurutan) ? hasilBerurutan : []).forEach((h) => {
    const judul = String(h?.bab?.judul || '').trim();
    const kunci = normJudulBab(judul);
    const terakhir = gabung[gabung.length - 1];
    if (kunci && terakhir && terakhir.kunciJudul === kunci) {
      terakhir.sections.push(...(Array.isArray(h.bab.sections) ? h.bab.sections : []));
      terakhir.ujiPemahaman.push(...(Array.isArray(h.bab.ujiPemahaman) ? h.bab.ujiPemahaman : []));
      terakhir.halamanSelesai = h.grup.halamanSelesai;
      terakhir.grupGabungan.push(h.grup);
      terakhir.provider = [...new Set([...terakhir.provider, h.provider || ''])].filter(Boolean);
      return;
    }
    gabung.push({
      judul: judul || `Kelompok halaman ${h.grup.halamanMulai}-${h.grup.halamanSelesai}`,
      kunciJudul: kunci || `hal-${h.grup.halamanMulai}`,
      halamanMulai: h.grup.halamanMulai,
      halamanSelesai: h.grup.halamanSelesai,
      sections: [...(Array.isArray(h.bab.sections) ? h.bab.sections : [])],
      ujiPemahaman: [...(Array.isArray(h.bab.ujiPemahaman) ? h.bab.ujiPemahaman : [])],
      grupGabungan: [h.grup],
      provider: h.provider ? [h.provider] : [],
    });
  });
  return gabung;
}

/**
 * Normalisasi masukan gambar untuk endpoint vision (konversiModulScan dll).
 * Kontrak endpoint: array OBJECT {mime, data}. Klien lama/keliru bisa mengirim
 * string data-URI atau base64 polos — di sini semuanya diseragamkan supaya
 * tidak lagi lahir payload "base64,undefined" (insiden 15 Okt: semua provider
 * 400 karena wizard mengirim string).
 * @param {Array<string|{mime:string,data:string}>} list
 * @returns {Array<{mime:string,data:string}>}
 */
export function keGambarAi(list = []) {
  return (Array.isArray(list) ? list : [])
    .map((im) => {
      if (im && typeof im === 'object') {
        const data = String(im.data || '').replace(/^data:image\/[a-zA-Z0-9.+-]+;base64,/, '');
        return { mime: String(im.mime || 'image/jpeg'), data };
      }
      const str = String(im || '');
      const m = str.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/s);
      if (m) return { mime: m[1], data: m[2] };
      return { mime: 'image/jpeg', data: str }; // base64 polos: mime terbaik-tebakan
    })
    .filter((g) => g.data.length > 0);
}

/**
 * Klasifikasi pesan gagal ekstraksi AI supaya klien bisa bersikap tepat
 * (insiden 15 Okt: 18 kelompok gagal campur aduk kuota & payload):
 *  - 'kuota'   : 429/503/rate-limit -> JEDA, lanjut nanti (resume melewatkan yang sukses)
 *  - 'payload' : respons bukan JSON / 413 / body terlalu besar -> pecah kelompok lebih kecil & coba lagi
 *  - 'lain'    : cetak apa adanya ke log
 */
export function klasifikasiGagalEkstraksi(pesan = '') {
  const t = String(pesan || '');
  if (/429|quota|rate-?limit|503|UNAVAILABLE|high demand/i.test(t)) return 'kuota';
  if (/413|payload|too large|not valid JSON|Unexpected token|ENTITY_TOO_LARGE/i.test(t)) return 'payload';
  return 'lain';
}

/**
 * Parse respons endpoint ekstraksi dengan defensif: endpoint pernah
 * mengembalikan teks polos ("An error occurred…") sehingga r.json()
 * melempar dan log owner jadi sampah. Kembalikan objek seragam.
 * @returns {{ok:boolean, json:object|null, pesan:string}}
 */
export function parseResponsEkstraksi(teks = '') {
  const t = String(teks ?? '');
  try {
    const json = JSON.parse(t);
    if (json && json.success && json.bab) return { ok: true, json, pesan: '' };
    return { ok: false, json: json || null, pesan: json?.error || 'respons tanpa bab/success' };
  } catch (_e) {
    return { ok: false, json: null, pesan: t.slice(0, 300) || 'respons kosong' };
  }
}

// ------------------------------------------------------------
// ANTI-DUPLIKAT IMPOR (owner 15 Okt: "nanti dobel jadinya?"):
// penyimpanan kedua (melanjutkan kelompok gagal) atau pengulangan
// penuh dari nol TIDAK boleh mendobel bab/butir. Kunci identitas
// deterministic: berkas + halaman + teks soal ternormalisasi.
// ------------------------------------------------------------
const normTeks = (s) => String(s ?? '').toLowerCase().replace(/\s+/g, ' ').trim();

/** Kunci identitas butir impor (bandingnya murah & stabil). */
export function kunciButirImpor(b = {}) {
  return `${normTeks(b.sumberFile)}|${b.sumberHalaman ?? ''}|${normTeks(b.soal)}`;
}

/** Buang butir yang sudah ada di bank (berkas+halaman+teks sama). */
export function saringButirDuplikat(butirBaru = [], butirEksisting = []) {
  const ada = new Set((Array.isArray(butirEksisting) ? butirEksisting : []).map(kunciButirImpor));
  return (Array.isArray(butirBaru) ? butirBaru : []).filter((b) => !ada.has(kunciButirImpor(b)));
}

/** True bila dua rentang halaman [a1,a2] & [b1,b2] bertumpang tindih. */
export function rentangBertumpangTindih(a = [], b = []) {
  const [a1, a2] = [Number(a[0]), Number(a[1])];
  const [b1, b2] = [Number(b[0]), Number(b[1])];
  if (![a1, a2, b1, b2].every((x) => Number.isFinite(x))) return false;
  return a1 <= b2 && b1 <= a2;
}

/** Buang bab yang judulnya sama ATAU rentang halamannya tumpang tindih. */
export function saringBabDuplikat(babBaru = [], babEksisting = []) {
  const judulAda = new Set((Array.isArray(babEksisting) ? babEksisting : []).map((b) => normTeks(b?.judul)));
  const rentangAda = (Array.isArray(babEksisting) ? babEksisting : [])
    .map((b) => b?.halamanSumber || []).filter((r) => r.length === 2);
  return (Array.isArray(babBaru) ? babBaru : []).filter((b) => {
    if (judulAda.has(normTeks(b?.judul))) return false;
    return !rentangAda.some((r) => rentangBertumpangTindih(b?.halamanSumber || [], r));
  });
}

// ------------------------------------------------------------
// MASUKAN FOLDER GAMBAR (owner 15 Okt: "aku dikirimi folder isinya
// banyak gambar, apakah bisa dimasukkan sistem?"): BISA — gambar
// halaman adalah bahan mentah yang sama dengan isi HTML pdf2html.
// Util di bawah menyiapkan urutan & memisahkan HALAMAN vs FIGUR.
// ------------------------------------------------------------

/** Angka urutan dari nama berkas ("372.jpg"->372, "1_372.jpg"->372). */
export function angkaBerkas(nama = '') {
  const grup = String(nama).match(/\d+/g);
  return grup && grup.length ? Number(grup[grup.length - 1]) : 0;
}

/** Urutkan nama berkas gambar secara natural sesuai nomor halaman. */
export function urutkanBerkasGambar(namaList = []) {
  return [...(Array.isArray(namaList) ? namaList : [])]
    .sort((a, b) => angkaBerkas(a) - angkaBerkas(b) || String(a).localeCompare(String(b), 'id'));
}

/**
 * Kelas sebuah gambar: HALAMAN buku (potret, lebar >= 1000px) atau
 * FIGUR (potongan diagram/grafik) — figur disimpan terpisah sebagai
 * aset gambar, tidak ikut diekstraksi jadi teks.
 */
export function klasifikasiGambarHalaman(width = 0, height = 0) {
  return width >= 1000 && height > width ? 'halaman' : 'figur';
}

/**
 * Tombol aksi mana yang wajib tampil per mode sumber impor.
 * (Regresi 15 Okt: mode 'pdf' & 'folder' sempat TIDAK punya tombol aksi
 * sama sekali karena kondisi render hanya memeriksa 'teks'/'gambar'.)
 */
export function aksiModeImpor(mode = '') {
  return {
    perluPratinjauTeks: mode === 'teks' || mode === 'pdf',
    perluEkstrakVision: mode === 'gambar' || mode === 'folder',
  };
}

/**
 * Label log "bab tersimpan" untuk alur simpan Impor Buku HTML.
 * (Regresi 15 Okt 2026: halaman log membaca `payload.halamanSumber[0]`
 * langsung, padahal mode TEKS/PDF-OCR tidak punya nomor halaman
 * (halamanSumber = null). Akibatnya simpan MELEDAK dengan TypeError
 * tepat setelah bab PERTAMA tersimpan — bab sisanya dan seluruh bank
 * soal tidak pernah tertulis. Util ini memaku perilakunya: halaman
 * sumber opsional, label tetap jujur.)
 */
export function labelBabTersimpan(payload = {}) {
  const hs = Array.isArray(payload?.halamanSumber) && payload.halamanSumber.length === 2
    ? ` (hal ${payload.halamanSumber[0]}-${payload.halamanSumber[1]})`
    : '';
  return `✓ Bab "${payload?.judul || 'tanpa judul'}"${hs} tersimpan sebagai draf.`;
}

/**
 * Ringkasan SIMPAN impor buku dalam bahasa jujur (pembedahan 15 Okt
 * 2026): owner menekan Simpan dua kali dan mengira gagal karena tidak
 * ada konfirmasi menonjol — pesan sukses hanya ada di log bawah, dan
 * tekanan kedua memang wajar berujung "semua dilewati anti-duplikat".
 * Fungsi ini memaku bahasanya: berapa yang BARU tersimpan vs berapa
 * yang DILEWATI karena sudah ada.
 */
export function pesanRingkasanSimpan(s = {}) {
  const { babBaru = 0, babLewat = 0, soalBaru = 0, soalLewat = 0 } = s;
  const baru = [
    babBaru ? `${babBaru} bab baru` : '',
    soalBaru ? `${soalBaru} soal baru masuk bank` : '',
  ].filter(Boolean).join(' + ');
  const lewat = [
    babLewat ? `${babLewat} bab` : '',
    soalLewat ? `${soalLewat} soal` : '',
  ].filter(Boolean).join(' & ');
  if (!baru && lewat) {
    return `↷ TIDAK ADA YANG BARU: ${lewat} sudah tersimpan sebelumnya — anti-duplikat bekerja, tidak ada yang didobel.`;
  }
  if (!baru) return '↷ Tidak ada bab/soal yang lolos untuk disimpan (periksa centang "ikut" pada pratinjau).';
  return `✓ TERSIMPAN: ${baru}${lewat ? ` · ${lewat} dilewati karena sudah ada (anti-duplikat)` : ''}. Tinjau di Admin → Buku.`;
}
