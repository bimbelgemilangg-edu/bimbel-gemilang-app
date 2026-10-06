// src/utils/ekstrakHtmlGemini.js
// ============================================================
// EKSTRAKTOR SISTEM GEMILANG untuk HTML keluaran prompt paten
// (docs/PROMPT-PATEN-SCAN-GEMINI.md). Gemini = pemindai; berkas ini =
// penagih kontrak.
//
// Pembagian kerja yang owner tetapkan 2026-10-06: hasil scan Gemini
// formatsnya bagus TAPI tadinya nol kunci & nol pembahasan (berkas
// kumpulan_soal_tka_biologi.html: 81 kartu, 0 kunci). Prompt paten
// mewajibkan keduanya; berkas ini MENOLAK kartu yang tidak patuh,
// dengan pesan bernomor kartu supaya yang diperbaiki hanya yang salah.
//
// KEMAMPUAN TAMBAHAN (permintaan owner, putaran kedua):
//   1. SATU BERKAS BISA BERISI BANYAK BAB (ebook kompilasi TKA): bab tiap
//      kartu diambil dari section-header terdekat di atasnya, jadi
//      pengelompokan tidak mengandalkan nama file atau ingatan admin.
//   2. BANYAK BERKAS SEKALIGUS (satu buku penuh digenerate per bagian):
//      ekstrakBanyakHtml() menggabungkan, membuang duplikat
//      (bab+nomor+sumber+isi), dan memberi prefiks nomor berkas pada
//      setiap pesan kesalahan supaya tahu mana yang harus diulang.
//   3. BUKU YANG HANYA PUNYA KUNCI TANPA PEMBAHASAN: Gemini boleh
//      MENALAR pembahasan, tetapi WAJIB mengaku lewat
//      data-asal-pembahasan="penalaran" (vs "tercetak"). Ekstraktor
//      menyimpan pengakuan itu di field pembahasanAsal -- guru harus
//      bisa membedakan penjelasan yang dicetak buku dari penjelasan
//      yang dikarang model.
//
// MURNI & TERUJI di Node (tests/ekstrakHtmlGemini.test.mjs): parser
// berbasis pemotongan string terhadap class/atribut paten, karena
// kontraknya KITA yang menetapkan -- menyimpang dari kontrak = ditolak,
// bukan ditebak.
// ============================================================

const ENUM_TIPE = new Set([
  'pg_sederhana', 'pg_kompleks', 'benar_salah', 'menjodohkan', 'isian_singkat', 'esai',
]);

const ENUM_ASAL_PEMBAHASAN = new Set(['tercetak', 'penalaran']);

/** Buang segala yang tidak dipercaya dari HTML masukan (pertahanan pertama). */
export function bersihkanHtmlBahaya(html) {
  return String(html || '')
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<iframe[\s\S]*?<\/iframe>/gi, '')
    .replace(/\son[a-z]+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, '')
    .replace(/javascript:[^"'\s>]*/gi, '');
}

const ENTITAS = { '&amp;': '&', '&lt;': '<', '&gt;': '>', '&quot;': '"', '&#39;': "'", '&nbsp;': ' ' };

/** HTML bagian dalam -> teks: tag dibuang, $...$ & baris baru dipertahankan. */
export function htmlKeTeks(inner) {
  let t = String(inner || '');
  t = t.replace(/<br\s*\/?>/gi, '\n');
  t = t.replace(/<\/(li|p|div|tr)>/gi, '\n');
  t = t.replace(/<li[^>]*>/gi, '\n- ');
  t = t.replace(/<[^>]+>/g, '');
  for (const [k, v] of Object.entries(ENTITAS)) t = t.split(k).join(v);
  return t
    .split('\n')
    .map((x) => x.replace(/[ \t]+/g, ' ').trim())
    .filter((x) => x !== '')
    .join('\n')
    .trim();
}

function atribut(tag, nama) {
  const m = new RegExp(`${nama}\\s*=\\s*"([^"]*)"`, 'i').exec(tag);
  return m ? m[1] : '';
}

const RE_JALAN = /<div class="section-header"[^>]*>[\s\S]*?<h2>([\s\S]*?)<\/h2>|<div class="question-card"([^>]*)>([\s\S]*?)(?=<div class="question-card"|<div class="section-header"|<\/body>|$)/g;

function ekstrakSatu(htmlMentah, labelBerkas = '') {
  const html = bersihkanHtmlBahaya(htmlMentah);
  const soal = [];
  const gambar = [];
  const kesalahan = [];
  const peringatan = [];
  const seksi = [];
  const pref = labelBerkas ? `${labelBerkas}: ` : '';

  let babAktif = '';
  RE_JALAN.lastIndex = 0;
  let jumlah = 0;

  for (const m of html.matchAll(RE_JALAN)) {
    if (m[1] !== undefined) {
      babAktif = htmlKeTeks(m[1]);
      seksi.push(babAktif);
      continue;
    }

    jumlah += 1;
    const tagAttr = m[2];
    const inner = m[3];
    const id = atribut(tagAttr, 'id') || `soal-${jumlah}`;
    const tipe = atribut(tagAttr, 'data-tipe');
    const kunciMentah = atribut(tagAttr, 'data-kunci');
    const asalPembahasan = ENUM_ASAL_PEMBAHASAN.has(atribut(tagAttr, 'data-asal-pembahasan'))
      ? atribut(tagAttr, 'data-asal-pembahasan')
      : 'tercetak';
    const bab = atribut(tagAttr, 'data-bab') || babAktif; // data-bab menang atas section-header

    if (!ENUM_TIPE.has(tipe)) {
      kesalahan.push(`${pref}kartu ${id}: data-tipe "${tipe || '(kosong)'}" bukan enum paten (${[...ENUM_TIPE].join(', ')}).`);
    }

    const nomor = (htmlKeTeks((/<span class="q-number">([\s\S]*?)<\/span>/.exec(inner) || [])[1] || '')).replace(/\D+/g, '') || String(jumlah);
    const sumber = htmlKeTeks((/<span class="q-source">([\s\S]*?)<\/span>/.exec(inner) || [])[1] || '');
    const badan = (/<div class="q-body">([\s\S]*?)<\/div>/.exec(inner) || [])[1] || '';

    const statements = /<div class="statements-box">([\s\S]*?)<\/div>\s*(?:<div class="figure-container"|<div class="options-list"|<table|<div class="pembahasan")/.exec(inner);
    const daftarPernyataan = statements
      ? [...statements[1].matchAll(/<li>([\s\S]*?)<\/li>/g)].map((x) => htmlKeTeks(x[1]))
      : [];

    // gambar: base64 dipisah (dokumen Firestore tidak boleh memuatnya),
    // posisinya di teks diganti placeholder {{GAMBAR_n}}.
    let teksSoal = htmlKeTeks(badan);
    const potonganFig = inner.split('<div class="figure-container">').slice(1);
    potonganFig.forEach((chunk, i) => {
      const iCap = chunk.indexOf('<div class="figure-caption">');
      const wilayahImg = iCap === -1 ? chunk : chunk.slice(0, iCap);
      const src = (/<img[^>]*src="([^"]+)"/.exec(wilayahImg) || [])[1] || '';
      const caption = iCap === -1 ? '' : htmlKeTeks(chunk.slice(iCap + '<div class="figure-caption">'.length, chunk.indexOf('</div>', iCap)));
      if (!src) return;
      gambar.push({ kartu: id, urutan: i + 1, src, caption });
      teksSoal += `\n{{GAMBAR_${i + 1}}}`;
    });
    if (daftarPernyataan.length) {
      teksSoal += '\n' + daftarPernyataan.map((p, i) => `${i + 1}) ${p}`).join('\n');
    }

    const opsi = [...inner.matchAll(/<span class="option-text">([\s\S]*?)<\/span>/g)]
      .map((x) => htmlKeTeks(x[1]).replace(/^[A-E][).]\s*/, ''));

    const barisMatrix = /<table class="matrix-box">([\s\S]*?)<\/table>/.exec(inner);
    const pernyataanMatrix = barisMatrix
      ? [...barisMatrix[1].matchAll(/<tr>([\s\S]*?)<\/tr>/g)].map((r) => htmlKeTeks(r[1]))
      : [];

    const pembahasan = htmlKeTeks((/<div class="pembahasan">([\s\S]*?)<\/div>/.exec(inner) || [])[1] || '');

    // ---- penegakan paten ----
    if (tipe !== 'esai' && !kunciMentah.trim()) {
      kesalahan.push(`${pref}kartu ${id}: data-kunci kosong padahal tipe ${tipe || '?'} wajib berkunci.`);
    }
    if (!pembahasan) {
      kesalahan.push(`${pref}kartu ${id}: blok .pembahasan tidak ada atau kosong.`);
    } else if (asalPembahasan === 'penalaran') {
      peringatan.push(`${pref}kartu ${id}: pembahasan hasil PENALARAN AI (tidak tercetak di sumber) — perlu diperiksa guru sebelum dipakai mengajar.`);
    }
    if ((tipe === 'pg_sederhana' || tipe === 'pg_kompleks') && opsi.length < 2) {
      kesalahan.push(`${pref}kartu ${id}: tipe ${tipe} tapi opsi terbaca ${opsi.length}.`);
    }
    if ((tipe === 'benar_salah' || tipe === 'menjodohkan') && !pernyataanMatrix.length && !daftarPernyataan.length) {
      peringatan.push(`${pref}kartu ${id}: tipe ${tipe} tanpa tabel/pernyataan terbaca; pernyataan mungkin menyatu di badan soal.`);
    }
    if (!bab) {
      peringatan.push(`${pref}kartu ${id}: tidak berada di bawah section-header mana pun — bab akan kosong dan soal sulit dicari di Perpustakaan.`);
    }

    // ---- pemetaan ke KONTRAK-JSON-BANK-SOAL ----
    const butir = {
      idKartu: id,
      nomor: Number(nomor) || jumlah,
      tipe: ENUM_TIPE.has(tipe) ? tipe : 'pg_sederhana',
      soal: teksSoal,
      sumber,
      materi: bab,
      pembahasan,
      pembahasanAsal: asalPembahasan,
      // 🔥 TAKSONOMI KURIKULUM MERDEKA dari Gemini (paten butir 9): sistem
      // menerima berkas yang SUDAH terklasifikasi; Perpustakaan, cetak per
      // minggu, dan try out otomatis tidak perlu menebak-nebak lagi.
      kurikulum: atribut(tagAttr, 'data-kurikulum') || '',
      fase: atribut(tagAttr, 'data-fase') || '',
      kelas: atribut(tagAttr, 'data-kelas') || '',
      elemen: atribut(tagAttr, 'data-elemen') || '',
      capaian: atribut(tagAttr, 'data-capaian') || '',
      gambarUrls: [],
    };
    if (tipe === 'benar_salah' || tipe === 'menjodohkan') {
      const kunciBaris = kunciMentah.split(',').map((x) => x.trim());
      const pernyataan = pernyataanMatrix.length ? pernyataanMatrix : daftarPernyataan;
      butir.tabel_benar_salah = pernyataan.map((p, i) => ({ pernyataan: p, jawaban: kunciBaris[i] || '' }));
      butir.kunciJawaban = kunciMentah;
    } else if (tipe === 'pg_kompleks') {
      butir.opsiJawaban = opsi;
      butir.kunciJawaban = kunciMentah.split(',').map((x) => x.trim().toUpperCase()).filter(Boolean);
    } else if (tipe === 'esai') {
      butir.kunciJawaban = '';
    } else {
      butir.opsiJawaban = opsi;
      butir.kunciJawaban = kunciMentah.trim().toUpperCase();
    }
    soal.push(butir);
  }

  if (jumlah === 0) {
    kesalahan.push(`${pref}tidak ada satu pun .question-card terbaca — berkas bukan keluaran prompt paten.`);
  }
  return { soal, gambar, kesalahan, peringatan, seksi };
}

/** Ekstrak satu berkas HTML paten. */
export function ekstrakHtmlGemini(htmlMentah) {
  return ekstrakSatu(htmlMentah, '');
}

/**
 * Ekstrak BANYAK berkas (satu buku penuh yang digenerate per bagian)
 * lalu gabungkan: duplikat (bab+nomor+sumber+isi) dibuang, gambar dan
 * pesan kesalahan membawa identitas berkasnya.
 *
 * @param {Array<{nama: string, html: string}>} berkasList
 */
export function ekstrakBanyakHtml(berkasList = []) {
  const soal = [];
  const gambar = [];
  const kesalahan = [];
  const peringatan = [];
  const seksi = new Set();
  const terlihat = new Set();
  let duplikat = 0;

  berkasList.forEach((b, i) => {
    const label = b.nama || `berkas-${i + 1}`;
    const h = ekstrakSatu(b.html, label);
    h.kesalahan.push(...kesalahan.length ? [] : []);
    kesalahan.push(...h.kesalahan);
    peringatan.push(...h.peringatan);
    h.seksi.forEach((s) => seksi.add(s));
    h.gambar.forEach((g) => gambar.push({ ...g, berkas: label, kartu: `${label}::${g.kartu}` }));
    for (const s of h.soal) {
      const kunciTeks = `${s.materi}|${s.sumber}|${s.nomor}|${s.soal.slice(0, 120)}`;
      if (terlihat.has(kunciTeks)) { duplikat += 1; continue; }
      terlihat.add(kunciTeks);
      soal.push({ ...s, asalBerkas: label, idKartu: `${label}::${s.idKartu}` });
    }
  });

  if (duplikat > 0) {
    peringatan.push(`${duplikat} butir duplikat antar-berkas dibuang otomatis (bab+nomor+sumber+isi sama).`);
  }
  return { soal, gambar, kesalahan, peringatan, seksi: [...seksi], duplikat };
}

export default { ekstrakHtmlGemini, ekstrakBanyakHtml, bersihkanHtmlBahaya, htmlKeTeks };
