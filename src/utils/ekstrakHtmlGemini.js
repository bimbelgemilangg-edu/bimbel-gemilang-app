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
// MURNI & TERUJI di Node (tests/ekstrakHtmlGemini.test.mjs): tidak
// menyentuh DOM, Firestore, maupun React -- parser sengaja berbasis
// pemotongan string terhadap class/atribut paten, karena kontraknya
// KITA yang menetapkan (bukan HTML bebas), jadi parser sederhana justru
// lebih jujur: menyimpang dari kontrak = ditolak, bukan ditebak.
// ============================================================

const ENUM_TIPE = new Set([
  'pg_sederhana', 'pg_kompleks', 'benar_salah', 'menjodohkan', 'isian_singkat', 'esai',
]);

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

/**
 * Ekstrak HTML paten -> daftar soal KONTRAK-JSON-BANK-SOAL + gambar
 * terpisah + daftar kesalahan per kartu.
 *
 * @returns {{soal: object[], gambar: object[], kesalahan: string[], peringatan: string[], seksi: string[]}}
 */
export function ekstrakHtmlGemini(htmlMentah) {
  const html = bersihkanHtmlBahaya(htmlMentah);
  const soal = [];
  const gambar = [];
  const kesalahan = [];
  const peringatan = [];
  const seksi = [];

  for (const m of html.matchAll(/<div class="section-header"[^>]*>[\s\S]*?<h2>([\s\S]*?)<\/h2>/gi)) {
    seksi.push(htmlKeTeks(m[1]));
  }

  const kartuRe = /<div class="question-card"([^>]*)>([\s\S]*?)(?=<div class="question-card"|<div class="section-header"|<\/body>|$)/g;
  let jumlah = 0;
  for (const m of html.matchAll(kartuRe)) {
    jumlah += 1;
    const tagAttr = m[1];
    const inner = m[2];
    const id = atribut(tagAttr, 'id') || `soal-${jumlah}`;
    const tipe = atribut(tagAttr, 'data-tipe');
    const kunciMentah = atribut(tagAttr, 'data-kunci');

    if (!ENUM_TIPE.has(tipe)) {
      kesalahan.push(`kartu ${id}: data-tipe "${tipe || '(kosong)'}" bukan enum paten (${[...ENUM_TIPE].join(', ')}).`);
    }

    const nomor = (htmlKeTeks((/<span class="q-number">([\s\S]*?)<\/span>/.exec(inner) || [])[1] || '')).replace(/\D+/g, '') || String(jumlah);
    const sumber = htmlKeTeks((/<span class="q-source">([\s\S]*?)<\/span>/.exec(inner) || [])[1] || '');
    let badan = (/<div class="q-body">([\s\S]*?)<\/div>\s*(?:<div class="statements-box"|<div class="figure-container"|<div class="options-list"|<table|<div class="pembahasan")/.exec(inner) || [])[1];
    if (badan === undefined) badan = (/<div class="q-body">([\s\S]*?)<\/div>/.exec(inner) || [])[1] || '';

    // pernyataan bernomor
    const statements = /<div class="statements-box">([\s\S]*?)<\/div>\s*(?:<div class="figure-container"|<div class="options-list"|<table|<div class="pembahasan")/.exec(inner);
    const daftarPernyataan = statements
      ? [...statements[1].matchAll(/<li>([\s\S]*?)<\/li>/g)].map((x) => htmlKeTeks(x[1]))
      : [];

    // gambar: ganti posisinya dengan placeholder {{GAMBAR_n}} (kontrak
    // penempatanGambar.js), base64-nya disimpan terpisah untuk diunggah UI.
    let teksSoal = htmlKeTeks(badan);
    // Gambar dipotong dengan split (bukan regex bersarang): variasi
    // ada/tidaknya caption dan jarak antar tag tidak boleh mengubah hasil.
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

    // opsi
    const opsi = [...inner.matchAll(/<span class="option-text">([\s\S]*?)<\/span>/g)]
      .map((x) => htmlKeTeks(x[1]).replace(/^[A-E][).]\s*/, ''));

    // tabel matrix (benar/salah, menjodohkan)
    const barisMatrix = /<table class="matrix-box">([\s\S]*?)<\/table>/.exec(inner);
    const pernyataanMatrix = barisMatrix
      ? [...barisMatrix[1].matchAll(/<tr>([\s\S]*?)<\/tr>/g)].map((r) => htmlKeTeks(r[1]))
      : [];

    // pembahasan
    const pembahasan = htmlKeTeks((/<div class="pembahasan">([\s\S]*?)<\/div>\s*(?:<\/div>\s*)?$/.exec(inner.trim()) || [])[1]
      || (/<div class="pembahasan">([\s\S]*?)<\/div>/.exec(inner) || [])[1] || '');

    // ---- penegakan paten ----
    const butuhKunci = tipe !== 'esai';
    if (butuhKunci && !kunciMentah.trim()) {
      kesalahan.push(`kartu ${id}: data-kunci kosong padahal tipe ${tipe || '?'} wajib berkunci.`);
    }
    if (!pembahasan) {
      kesalahan.push(`kartu ${id}: blok .pembahasan tidak ada atau kosong.`);
    }
    if ((tipe === 'pg_sederhana' || tipe === 'pg_kompleks') && opsi.length < 2) {
      kesalahan.push(`kartu ${id}: tipe ${tipe} tapi opsi terbaca ${opsi.length}.`);
    }
    if ((tipe === 'benar_salah' || tipe === 'menjodohkan') && !pernyataanMatrix.length && !daftarPernyataan.length) {
      peringatan.push(`kartu ${id}: tipe ${tipe} tanpa tabel/pernyataan terbaca; pernyataan mungkin menyatu di badan soal.`);
    }

    // ---- pemetaan ke KONTRAK-JSON-BANK-SOAL ----
    const butir = {
      nomor: Number(nomor) || jumlah,
      tipe: ENUM_TIPE.has(tipe) ? tipe : 'pg_sederhana',
      soal: teksSoal,
      sumber,
      pembahasan,
      gambarUrls: [],
    };
    if (tipe === 'benar_salah' || tipe === 'menjodohkan') {
      const kunciBaris = kunciMentah.split(',').map((x) => x.trim());
      const pernyataan = pernyataanMatrix.length ? pernyataanMatrix : daftarPernyataan;
      butir.tabel_benar_salah = pernyataan.map((p, i) => ({ pernyataan: p, jawaban: kunciBaris[i] || '' }));
      butir.kunciJawaban = kunciMentah;
    } else if (tipe === 'pg_kompleks') {
      butir.opsiJawaban = opsi;
      butir.kunciJawaban = kunciMentah.split(',').map((x) => x.trim().toUpperCase());
    } else if (tipe === 'esai') {
      butir.kunciJawaban = '';
    } else {
      butir.opsiJawaban = opsi;
      butir.kunciJawaban = kunciMentah.trim().toUpperCase();
    }
    soal.push(butir);
  }

  if (jumlah === 0) {
    kesalahan.push('tidak ada satu pun .question-card terbaca — berkas bukan keluaran prompt paten.');
  }
  return { soal, gambar, kesalahan, peringatan, seksi };
}

export default { ekstrakHtmlGemini, bersihkanHtmlBahaya, htmlKeTeks };
