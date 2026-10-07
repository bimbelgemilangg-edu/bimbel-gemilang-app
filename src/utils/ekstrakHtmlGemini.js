// src/utils/ekstrakHtmlGemini.js
// ============================================================
// EKSTRAKTOR SISTEM GEMILANG untuk HTML keluaran Gemini.
// Gemini = pemindai; berkas ini = penagih kontrak.
//
// SEJARAH SINGKAT & PELAJARAN (2026-10-07):
// Versi pertama mencocokkan string PERSIS `<div class="question-card"`.
// Akibatnya satu variasi kecil dari Gemini (class="question-card extra",
// tag <section>, dst.) membuat SELURUH berkas terbaca nol kartu dan
// owner yang pekerjaannya menumpuk mendapat pesan "bukan keluaran
// prompt paten". Owner menjawab dengan benar: "prompt itu template;
// APA PUN bentuk dokumennya harus cocok dengan sistem ... jadi harus
// kuat agar tunduk ... atau sistemnya yang perlu diubah."
//
// KEPUTUSAN: keduanya. Prompt paten tetap pagar UTAMA (kunci &
// pembahasan wajib). Tetapi ekstraktor kini LAPISAN ADAPTOR: mengenali
// beberapa DIALEK struktur, lalu menagih ISI paten dengan keras.
// Struktur boleh beragam; isi tidak: setiap soal WAJIB punya kunci
// (kecuali esai) dan pembahasan, atau ditolak dengan pesan bernomor.
//
// DIALEK YANG DIKENALI:
//   A. paten penuh   : .question-card + data-tipe + data-kunci + .pembahasan
//   B. class berembel: class="question-card ..." / <section>/<article>
//   C. kunci tersembunyi: "Kunci: B" / "Jawaban: B" di teks
//   D. pembahasan berlabel: paragraf/blok berawalan "Pembahasan:"
//   E. opsi tanpa .option-text: <li> dalam list, atau baris "A. "/"A) "
//
// ASAL-USUL GAMBAR (2026-10-07, aturan 10 prompt paten): Gemini DILARANG
// membuat gambar. Setiap figure-container mengaku lewat
// data-gambar-sumber: "url-asli" (gambar beredar persis sama & HD, sumber
// di data-gambar-asal), "petunjuk-potongan" ({{GAMBAR: ...}} -> antrean
// `potongan` agar tim memotong presisi dari berkas asli), atau
// "warisan"/"potongan-asli" (base64 sah). base64 TANPA pengakuan asal
// ditandai TERINDIKASI DIBUAT MODEL lewat `peringatan`.
//
// MURNI & TERUJI (tests/ekstrakHtmlGemini.test.mjs).
// ============================================================

const ENUM_TIPE = new Set([
  'pg_sederhana', 'pg_kompleks', 'benar_salah', 'menjodohkan', 'isian_singkat', 'esai',
]);
const ENUM_ASAL_PEMBAHASAN = new Set(['tercetak', 'penalaran']);
// Pengakuan asal yang membuat base64 SAH (gambar hasil potongan manusia /
// warisan berkas lama), lihat aturan 10 prompt paten (tangga gambar asli).
const SUMBER_GAMBAR_SAHIH = new Set(['warisan', 'potongan-asli', 'asli-scan']);

const TOKEN_KARTU = new Set(['question-card', 'soal-card', 'card-soal', 'question', 'soal', 'card']);
const TOKEN_SEKSI = new Set(['section-header', 'section', 'bab-header', 'bab']);

/** Buang segala yang tidak dipercaya dari HTML masukan. */
export function bersihkanHtmlBahaya(html) {
  return String(html || '')
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<iframe[\s\S]*?<\/iframe>/gi, '')
    .replace(/\son[a-z]+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, '')
    .replace(/javascript:[^"'\s>]*/gi, '');
}

const ENTITAS = { '&amp;': '&', '&lt;': '<', '&gt;': '>', '&quot;': '"', '&#39;': "'", '&nbsp;': ' ' };

/** HTML -> teks: tag dibuang, $...$ & baris baru dipertahankan. */
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

function kelasDari(attr) {
  const m = /\bclass\s*=\s*"([^"]*)"/i.exec(attr || '');
  return (m ? m[1] : '').split(/\s+/).filter(Boolean);
}

function atribut(attr, nama) {
  const m = new RegExp(`${nama}\\s*=\\s*"([^"]*)"`, 'i').exec(attr || '');
  return m ? m[1] : '';
}

/** Potong dokumen menjadi urutan blok kartu/seksi beserta isi mentahnya. */
function blokBerurutan(html) {
  const re = /<(div|section|article)\b([^>]*)>/gi;
  const titik = [];
  let m;
  while ((m = re.exec(html)) !== null) {
    const token = kelasDari(m[2]);
    const jenis = token.some((t) => TOKEN_KARTU.has(t)) ? 'kartu'
      : (token.some((t) => TOKEN_SEKSI.has(t)) ? 'seksi' : null);
    if (jenis) titik.push({ jenis, attr: m[2], mulai: m.index + m[0].length });
  }
  const keluar = [];
  for (let i = 0; i < titik.length; i += 1) {
    const akhir = i + 1 < titik.length ? titik[i + 1].mulai - titik[i + 1].attr.length - 5 : html.length;
    keluar.push({ ...titik[i], isi: html.slice(titik[i].mulai, Math.max(titik[i].mulai, akhir)) });
  }
  return keluar;
}

/** Ambil isi elemen pertama ber-class token tertentu (kedalaman dihitung). */
function blokKelas(inner, token) {
  const re = new RegExp(`<([a-z]+)\\b[^>]*\\bclass\\s*=\\s*"[^"]*\\b${token}\\b[^"]*"[^>]*>`, 'i');
  const m = re.exec(inner);
  if (!m) return '';
  const tag = m[1];
  const mulai = m.index + m[0].length;
  const reBuka = new RegExp(`<${tag}\\b`, 'gi');
  const reTutup = new RegExp(`</${tag}>`, 'gi');
  let kedalaman = 1;
  let i = mulai;
  reBuka.lastIndex = mulai;
  reTutup.lastIndex = mulai;
  while (kedalaman > 0 && i < inner.length) {
    const b = reBuka.exec(inner);
    const t = reTutup.exec(inner);
    if (!t) break;
    if (b && b.index < t.index) { kedalaman += 1; i = b.index + 2; continue; }
    kedalaman -= 1;
    i = t.index + tag.length + 3;
    if (kedalaman === 0) return inner.slice(mulai, t.index);
  }
  return inner.slice(mulai);
}

function cariOpsi(inner) {
  const lewatSpan = [...inner.matchAll(/<span class="[^"]*option-text[^"]*">([\s\S]*?)<\/span>/gi)]
    .map((x) => htmlKeTeks(x[1]).replace(/^[A-E][).]\s*/, ''));
  if (lewatSpan.length) return lewatSpan;
  const list = blokKelas(inner, 'options-list') || blokKelas(inner, 'options') || '';
  const lewatLi = [...list.matchAll(/<li[^>]*>([\s\S]*?)<\/li>/gi)]
    .map((x) => htmlKeTeks(x[1]).replace(/^[A-E][).]\s*/, ''))
    .filter((t) => t.length > 0);
  if (lewatLi.length) return lewatLi;
  // dialek teks polos: baris berawalan huruf pilihan
  return htmlKeTeks(inner)
    .split('\n')
    .map((x) => /^([A-E])[).]\s*(.+)$/.exec(x))
    .filter(Boolean)
    .map((m) => m[2].trim());
}

function cariKunci(inner, attrKunci) {
  if (attrKunci.trim()) return attrKunci.trim();
  const teks = htmlKeTeks(inner);
  const m = /(?:kunci|jawaban)\s*:\s*([A-E](?:\s*[,;/]\s*[A-E])*|[0-9]+(?:\s*[,;/]\s*[0-9])*)/i.exec(teks);
  return m ? m[1] : '';
}

function cariPembahasan(inner) {
  const lewatBlok = htmlKeTeks(blokKelas(inner, 'pembahasan') || blokKelas(inner, 'explanation') || blokKelas(inner, 'solution'));
  if (lewatBlok) return lewatBlok;
  const teks = htmlKeTeks(inner);
  const m = /pembahasan\s*:\s*([\s\S]+)$/i.exec(teks);
  return m ? m[1].trim() : '';
}

function normTipe(mentah, jumlahOpsi) {
  const t = String(mentah || '').toLowerCase();
  if (ENUM_TIPE.has(t)) return t;
  if (/kompleks|multi|lebih dari satu/.test(t)) return 'pg_kompleks';
  if (/benar|salah/.test(t)) return 'benar_salah';
  if (/jodoh|pasang/.test(t)) return 'menjodohkan';
  if (/isian|singkat|esai|uraian/.test(t)) return /esai|uraian/.test(t) ? 'esai' : 'isian_singkat';
  return jumlahOpsi > 0 ? 'pg_sederhana' : 'pg_sederhana';
}

function ekstrakSatu(htmlMentah, labelBerkas = '') {
  const html = bersihkanHtmlBahaya(htmlMentah);
  const soal = [];
  const gambar = [];
  const potongan = [];
  const kesalahan = [];
  const peringatan = [];
  const seksi = [];
  const pref = labelBerkas ? `${labelBerkas}: ` : '';

  let babAktif = '';
  let jumlah = 0;

  for (const blok of blokBerurutan(html)) {
    if (blok.jenis === 'seksi') {
      const judul = htmlKeTeks((/<h[1-4][^>]*>([\s\S]*?)<\/h[1-4]>/i.exec(blok.isi) || [])[1] || blok.isi);
      babAktif = judul.split('\n')[0] || babAktif;
      seksi.push(babAktif);
      continue;
    }

    jumlah += 1;
    const attr = blok.attr;
    const inner = blok.isi;
    const id = atribut(attr, 'id') || `soal-${jumlah}`;
    const tipeMentah = atribut(attr, 'data-tipe')
      || htmlKeTeks(blokKelas(inner, 'q-type-badge') || blokKelas(inner, 'type-badge'));
    const kunciMentah = cariKunci(inner, atribut(attr, 'data-kunci'));
    const asalAttr = atribut(attr, 'data-asal-pembahasan');
    const asalPembahasan = ENUM_ASAL_PEMBAHASAN.has(asalAttr) ? asalAttr : 'tercetak';
    const bab = atribut(attr, 'data-bab') || babAktif;

    const nomorAttr = (/(?:no|nomor)\.?\s*[:#-]?\s*(\d+)/i.exec(atribut(attr, 'data-nomor')) || [])[1];
    const nomorTeks = htmlKeTeks(blokKelas(inner, 'q-number') || blokKelas(inner, 'number'))
      || (/(?:no|nomor)\.?\s*[:#-]?\s*(\d+)/i.exec(htmlKeTeks(inner)) || [])[1] || '';
    const nomor = nomorAttr || (nomorTeks.replace(/\D+/g, '') || String(jumlah));
    const sumber = htmlKeTeks(blokKelas(inner, 'q-source') || blokKelas(inner, 'source'));

    const badanBlok = blokKelas(inner, 'q-body') || blokKelas(inner, 'body') || blokKelas(inner, 'stem');
    let teksSoal = htmlKeTeks(badanBlok || inner.split('<div class="options-list"')[0]);

    const statements = blokKelas(inner, 'statements-box') || blokKelas(inner, 'statements');
    const daftarPernyataan = statements
      ? [...statements.matchAll(/<li[^>]*>([\s\S]*?)<\/li>/gi)].map((x) => htmlKeTeks(x[1]))
      : [];
    if (daftarPernyataan.length) {
      teksSoal += '\n' + daftarPernyataan.map((p, i) => `${i + 1}) ${p}`).join('\n');
    }

    // gambar: base64/url dipisah; posisi di teks jadi {{GAMBAR_n}}.
    // 🔥 2026-10-07 — ASAL-USUL GAMBAR (tangga gambar asli, aturan 10
    // prompt paten): setiap figure-container mengaku lewat atribut
    // data-gambar-sumber:
    //   url-asli          = gambar beredar yang PERSIS SAMA & HD; alamat
    //                       halaman sumbernya dicatat di data-gambar-asal
    //   petunjuk-potongan = {{GAMBAR: ...}} — tim memotong presisi dari
    //                       berkas scan ASLI milik owner (antrean `potongan`)
    //   warisan/potongan-asli/asli-scan = base64 SAH (potongan manusia /
    //                       bawaan berkas lama yang dikonversi ulang)
    // base64 TANPA pengakuan asal = TERINDIKASI DIBUAT MODEL -> peringatan
    // keras (bukan penolakan: berkas era sebelum aturan ini bisa memuat
    // base64 potongan asli yang belum sempat diberi atribut).
    const titikFig = [...inner.matchAll(/<div([^>]*\bclass="[^"]*figure-container[^"]*"[^>]*)>/gi)];
    titikFig.forEach((tf, i) => {
      const akhir = i + 1 < titikFig.length ? titikFig[i + 1].index : inner.length;
      const chunk = inner.slice(tf.index + tf[0].length, akhir);
      const attrWadah = tf[1] || '';
      const imgTag = (/<img[^>]*>/i.exec(chunk) || [])[0] || '';
      const src = atribut(imgTag, 'src');
      const caption = htmlKeTeks((/<div[^>]*\bclass="[^"]*figure-caption[^"]*"[^>]*>([\s\S]*?)<\/div>/i.exec(chunk) || [])[1] || '');
      const sumberDeklarasi = (atribut(attrWadah, 'data-gambar-sumber') || atribut(imgTag, 'data-gambar-sumber')).toLowerCase();
      const asalDeklarasi = atribut(attrWadah, 'data-gambar-asal') || atribut(imgTag, 'data-gambar-asal');

      if (src) {
        const base64 = /^data:image\//i.test(src);
        const urlLuar = /^https?:\/\//i.test(src);
        let gambarSumber = sumberDeklarasi;
        if (!gambarSumber) {
          gambarSumber = urlLuar ? 'url-asli' : (base64 ? 'base64-tanpa-asal' : 'tak-dikenal');
        }
        gambar.push({ kartu: id, urutan: i + 1, src, caption, gambarSumber, gambarAsal: asalDeklarasi });
        teksSoal += `\n{{GAMBAR_${i + 1}}}`;
        if (base64 && !SUMBER_GAMBAR_SAHIH.has(sumberDeklarasi)) {
          peringatan.push(`${pref}kartu ${id}: gambar ke-${i + 1} adalah base64 TANPA pengakuan asal (data-gambar-sumber="warisan"/"potongan-asli") — TERINDIKASI DIBUAT MODEL; prompt paten MELARANG gambar buatan. Periksa gambarnya sebelum soal dipakai mengajar.`);
        }
        if (urlLuar && !asalDeklarasi) {
          peringatan.push(`${pref}kartu ${id}: gambar ke-${i + 1} memakai URL luar tanpa data-gambar-asal — verifikasi keaslian dan sumbernya sebelum dipakai.`);
        }
        return;
      }
      const petunjuk = (/\{\{\s*GAMBAR\s*:([\s\S]*?)\}\}/i.exec(htmlKeTeks(chunk)) || [])[1];
      if (petunjuk || sumberDeklarasi === 'petunjuk-potongan') {
        const teksPetunjuk = String(petunjuk || caption || '').trim();
        potongan.push({ kartu: id, urutan: i + 1, petunjuk: teksPetunjuk, caption });
        peringatan.push(`${pref}kartu ${id}: gambar ke-${i + 1} MENUNGGU POTONGAN PRESISI dari berkas asli — petunjuk: "${teksPetunjuk.slice(0, 140)}${teksPetunjuk.length > 140 ? '…' : ''}". Soal tersimpan TANPA gambar ini sampai tim memotongnya.`);
      }
    });

    const opsi = cariOpsi(inner);
    const barisMatrix = /<table[^>]*\bclass="[^"]*matrix-box[^"]*"[\s\S]*?<\/table>/i.exec(inner);
    const pernyataanMatrix = barisMatrix
      ? [...barisMatrix[0].matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/gi)].map((r) => htmlKeTeks(r[1])).filter(Boolean)
      : [];
    const pembahasan = cariPembahasan(inner);
    const tipe = normTipe(tipeMentah, opsi.length);

    // ---- penegakan ISI paten (struktur boleh beda, isi tidak) ----
    if (tipe !== 'esai' && !kunciMentah) {
      kesalahan.push(`${pref}kartu ${id}: kunci jawaban tidak ditemukan (data-kunci maupun teks "Kunci:"/"Jawaban:").`);
    }
    if (!pembahasan) {
      kesalahan.push(`${pref}kartu ${id}: pembahasan tidak ditemukan (blok .pembahasan maupun teks berlabel "Pembahasan:").`);
    } else if (asalPembahasan === 'penalaran') {
      peringatan.push(`${pref}kartu ${id}: pembahasan hasil PENALARAN AI (tidak tercetak di sumber) — perlu diperiksa guru.`);
    }
    if ((tipe === 'pg_sederhana' || tipe === 'pg_kompleks') && opsi.length < 2) {
      kesalahan.push(`${pref}kartu ${id}: tipe ${tipe} tapi opsi terbaca ${opsi.length}.`);
    }
    if (!bab) {
      peringatan.push(`${pref}kartu ${id}: tidak berada di bawah section-header mana pun — bab akan kosong.`);
    }

    const butir = {
      idKartu: id,
      nomor: Number(nomor) || jumlah,
      tipe,
      soal: teksSoal,
      sumber,
      materi: bab,
      pembahasan,
      pembahasanAsal: asalPembahasan,
      kurikulum: atribut(attr, 'data-kurikulum') || '',
      fase: atribut(attr, 'data-fase') || '',
      kelas: atribut(attr, 'data-kelas') || '',
      elemen: atribut(attr, 'data-elemen') || '',
      capaian: atribut(attr, 'data-capaian') || '',
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
    kesalahan.push(`${pref}tidak ada satu pun blok soal terbaca (dicari: ${[...TOKEN_KARTU].join('/')}) — berkas kemungkinan bukan HTML soal.`);
  }
  return { soal, gambar, potongan, kesalahan, peringatan, seksi };
}

/** Ekstrak satu berkas HTML. */
export function ekstrakHtmlGemini(htmlMentah) {
  return ekstrakSatu(htmlMentah, '');
}

/**
 * Ekstrak BANYAK berkas lalu gabungkan: duplikat (bab+nomor+sumber+isi)
 * dibuang, pesan kesalahan membawa nama berkasnya.
 */
export function ekstrakBanyakHtml(berkasList = []) {
  const soal = [];
  const gambar = [];
  const potongan = [];
  const kesalahan = [];
  const peringatan = [];
  const seksi = new Set();
  const terlihat = new Set();
  let duplikat = 0;

  berkasList.forEach((b, i) => {
    const label = b.nama || `berkas-${i + 1}`;
    const h = ekstrakSatu(b.html, label);
    kesalahan.push(...h.kesalahan);
    peringatan.push(...h.peringatan);
    h.seksi.forEach((s) => seksi.add(s));
    h.gambar.forEach((g) => gambar.push({ ...g, berkas: label, kartu: `${label}::${g.kartu}` }));
    h.potongan.forEach((p) => potongan.push({ ...p, berkas: label, kartu: `${label}::${p.kartu}` }));
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
  return { soal, gambar, potongan, kesalahan, peringatan, seksi: [...seksi], duplikat };
}

export default { ekstrakHtmlGemini, ekstrakBanyakHtml, bersihkanHtmlBahaya, htmlKeTeks };
