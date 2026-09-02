// ============================================================
// bankSoalSanitizer.js
// ============================================================
// Lapisan pembersih + validator untuk hasil scan AI (Gemini/
// ChatGPT/Claude) sebelum masuk ke Firestore "bank_soal".
//
// MASALAH YANG DISELESAIKAN FILE INI:
//
// 1. AI vision (Gemini dkk) hampir selalu menulis LaTeX dengan
//    backslash TUNGGAL di dalam JSON string, contoh:
//        "teksSoal": "$\vec{b}$"
//    Backslash tunggal itu TIDAK VALID untuk JSON (JSON cuma
//    kenal \", \\, \/, \b, \f, \n, \r, \t, \uXXXX). Begitu
//    JSON.parse() ketemu \v, \b(egin), \a(lpha), dst yang bukan
//    escape resmi -> GAGAL TOTAL, seluruh file tidak terbaca.
//
// 2. AI kadang menulis tanda kutip ganda ("...") di DALAM isi
//    soal (misal soal logika: Ingkaran pernyataan "Jika...")
//    tanpa di-escape -> JSON juga pecah di titik itu.
//
// 3. Bentuk field per soal suka berubah-ubah tiap kali di-scan
//    (opsiJawaban kadang array of string, kadang array of
//    object) -> perlu dinormalisasi ke satu bentuk baku
//    (lihat KONTRAK-JSON-BANK-SOAL.md).
//
// STRATEGI:
//   Tahap 1 (sanitizeRawJsonText)  : perbaiki teks mentah supaya
//                                    valid sebagai JSON.
//   Tahap 2 (tryParseJson)         : parse, dengan fallback
//                                    "salvage" kalau masih gagal.
//   Tahap 3 (validateAndNormalize) : cocokkan tiap soal ke
//                                    kontrak 12 field, perbaiki
//                                    bentuk yang menyimpang.
// ============================================================


/* ============================================================
   KONSTANTA KONTRAK
   (harus SAMA PERSIS dengan KONTRAK-JSON-BANK-SOAL.md)
============================================================ */

const TIPE_ENUM = [
    'pg_sederhana',
    'pg_kompleks',
    'benar_salah',
    'isian_singkat',
    'menjodohkan',
  ];
  
  const FIELD_WAJIB = [
    'nomor', 'tipe', 'teksSoal', 'opsiJawaban', 'pernyataan',
    'tabelBenarSalah', 'pasangan', 'kunciJawaban', 'gambar',
    'topik', 'subtopik', 'topikBaru',
  ];
  
  // Karakter escape yang SAH menurut spesifikasi JSON (RFC 8259)
  const VALID_JSON_ESCAPES = new Set(['"', '\\', '/', 'b', 'f', 'n', 'r', 't', 'u']);
  
  // ── Masalah tersembunyi ──
  // Huruf b, f, n, r, t KEBETULAN valid sebagai escape kontrol JSON
  // (\b=backspace, \f=form-feed, \n=newline, \r=carriage-return,
  // \t=tab) -- TAPI huruf-huruf itu juga awalan banyak perintah
  // LaTeX: \begin, \bar, \big, \binom, \frac, \forall, \nabla, \ne,
  // \neq, \rightarrow, \rho, \tan, \tau, \theta, \times, \text, dst.
  //
  // Kalau dibiarkan "valid" begitu saja, JSON.parse TIDAK error --
  // tapi diam-diam memakan \b/\f/\n/\r/\t jadi karakter kontrol asli
  // lalu membuang huruf-huruf LaTeX sesudahnya. Hasilnya: LaTeX rusak
  // TANPA ada error yang kelihatan sama sekali (lebih bahaya dari
  // error, karena tidak ketahuan sampai dirender).
  //
  // Solusi: kalau ketemu \b \f \n \r \t, intip huruf-huruf sesudahnya.
  // Kalau cocok awalan salah satu perintah LaTeX umum di bawah -> ini
  // LaTeX yang harus diperbaiki (gandakan backslash), BUKAN kontrol
  // karakter asli.
  const LATEX_HINTS_PER_HURUF = {
    b: ['begin', 'bar', 'big', 'bigl', 'bigr', 'bigcap', 'bigcup', 'binom', 'boldsymbol', 'bullet', 'backslash', 'beta'],
    f: ['frac', 'forall', 'flat', 'phi'],
    n: ['nabla', 'ne', 'neq', 'notin', 'nonumber', 'nolimits', 'nu'],
    r: ['rightarrow', 'rho', 'rangle', 'right'],
    t: ['tan', 'tau', 'theta', 'times', 'text', 'tfrac', 'to', 'tilde', 'top', 'triangle', 'tbinom'],
  };
  
  function lihatKataSetelah(text, pos) {
    // Ambil rentetan huruf kecil setelah posisi tertentu (buat dicocokkan
    // ke daftar perintah LaTeX di atas)
    let j = pos;
    let word = '';
    while (j < text.length && /[a-zA-Z]/.test(text[j]) && word.length < 15) {
      word += text[j];
      j++;
    }
    return word.toLowerCase();
  }
  
  function isEscapeBenarBenarKontrolKarakter(huruf, text, posSetelahHuruf) {
    const daftarLatex = LATEX_HINTS_PER_HURUF[huruf];
    if (!daftarLatex) return true; // huruf lain (", \\, /) selalu sah, tidak ambigu
  
    // PENTING: huruf ambigu (b/f/n/r/t) itu sendiri adalah huruf PERTAMA
    // dari perintah LaTeX yang mau dicocokkan (\begin, \frac, dst) --
    // harus digabung ke depan kata, bukan cuma huruf sesudahnya saja.
    // Contoh: escape "\b" + sisa "egin" -> kata yang dicocokkan "begin".
    const kataSesudah = huruf + lihatKataSetelah(text, posSetelahHuruf);
    const kemungkinanLatex = daftarLatex.some((cmd) => kataSesudah.startsWith(cmd));
  
    // Kalau cocok pola perintah LaTeX -> ANGGAP INI BUKAN kontrol karakter asli
    return !kemungkinanLatex;
  }
  
  
  /* ============================================================
     TAHAP 1 — SANITIZE TEKS MENTAH
  ============================================================ */
  
  /**
   * Membersihkan teks mentah hasil AI supaya valid sebagai JSON,
   * TANPA merusak konten LaTeX di dalamnya.
   *
   * Cara kerja: jalan karakter demi karakter, HANYA mengoreksi
   * saat posisi kita sedang "di dalam string literal" JSON.
   * Di luar string (tanda kurung, koma, dsb) tidak disentuh sama
   * sekali supaya struktur JSON asli tetap utuh.
   */
  function sanitizeRawJsonText(raw) {
    if (typeof raw !== 'string') return '';
  
    // (a) buang code fence markdown kalau AI masih nyelipin
    let text = raw
      .replace(/^\uFEFF/, '')                 // BOM kalau ada
      .replace(/^```(?:json)?\s*/i, '')
      .replace(/```\s*$/i, '')
      .trim();
  
    let out = '';
    let inStr = false;     // sedang di dalam string literal JSON?
    const n = text.length;
  
    for (let i = 0; i < n; i++) {
      const ch = text[i];
  
      if (!inStr) {
        // Belum masuk string. Tanda kutip pembuka?
        if (ch === '"') {
          inStr = true;
        }
        out += ch;
        continue;
      }
  
      // ── Sedang di dalam string literal ──
  
      if (ch === '\\') {
        const next = text[i + 1];
  
        if (next === undefined) {
          // backslash di ujung teks (kasus aneh) -> escape jadi ganda
          out += '\\\\';
          continue;
        }
  
        if (next === 'u') {
          // \uXXXX cuma sah kalau 4 digit hex PERSIS mengikutinya.
          // Kalau bukan (misal "\upsilon") -> ini LaTeX, bukan unicode escape.
          const empatKarakter = text.slice(i + 2, i + 6);
          const unicodeValid = /^[0-9a-fA-F]{4}$/.test(empatKarakter);
          if (unicodeValid) {
            out += ch + next; // biarkan, nanti \uXXXX ikut disalin apa adanya
            i += 1;
            continue;
          }
          // bukan unicode escape asli -> gandakan backslash
          out += '\\\\' + next;
          i += 1;
          continue;
        }
  
        if (VALID_JSON_ESCAPES.has(next)) {
          // Huruf b/f/n/r/t ambigu -- cek dulu apa beneran kontrol
          // karakter, atau sebenarnya awalan perintah LaTeX (\begin,
          // \frac, \neq, \rightarrow, \tan, dst).
          const beneranKontrolKarakter = isEscapeBenarBenarKontrolKarakter(next, text, i + 2);
  
          if (beneranKontrolKarakter) {
            // \n \t dst asli (misal newline pemisah baris tabel) -> biarkan
            out += ch + next;
            i += 1;
            continue;
          }
          // Ternyata LaTeX (\begin, \frac, dst) -> gandakan backslash
          out += '\\\\' + next;
          i += 1;
          continue;
        }
  
        // Escape TIDAK sah untuk JSON (\v, \a, \e, dst dari LaTeX)
        // -> gandakan backslash-nya, biarkan huruf sesudahnya normal.
        // Contoh: \vec  ->  \\vec   (jadi literal backslash + "vec")
        out += '\\\\' + next;
        i += 1;
        continue;
      }
  
      if (ch === '"') {
        // Ketemu tanda kutip saat masih dianggap "di dalam string".
        // Perlu tebak: ini PENUTUP string, atau kutip isi soal yang
        // lupa di-escape AI (misal: Ingkaran pernyataan "Jika...")?
        //
        // Heuristik: intip karakter berikutnya (lewati spasi/enter).
        // Kalau berikutnya salah satu dari  : , } ]  atau akhir teks
        // -> ini penutup string yang sah.
        // Selain itu -> anggap kutip isi konten, escape otomatis.
        let j = i + 1;
        while (j < n && /\s/.test(text[j])) j++;
        const after = text[j];
  
        const isClosingQuote =
          after === undefined ||
          after === ',' || after === '}' || after === ']' || after === ':';
  
        if (isClosingQuote) {
          inStr = false;
          out += ch;
        } else {
          out += '\\"';   // kutip isi konten -> escape
        }
        continue;
      }
  
      // Karakter biasa di dalam string
      out += ch;
    }
  
    return out;
  }
  
  
  /* ============================================================
     TAHAP 2 — PARSE DENGAN FALLBACK SALVAGE
  ============================================================ */
  
  /**
   * Coba selamatkan array JSON yang terpotong di tengah jalan
   * (misal AI kehabisan token). Ambil objek-objek yang SUDAH utuh
   * saja, buang sisa yang setengah jadi.
   */
  function salvagePartialJsonArray(text) {
    const start = text.indexOf('[');
    if (start === -1) return [];
  
    let depth = 0, inStr = false, esc = false, lastGoodEnd = -1;
  
    for (let i = start; i < text.length; i++) {
      const ch = text[i];
      if (inStr) {
        if (esc) { esc = false; }
        else if (ch === '\\') { esc = true; }
        else if (ch === '"') { inStr = false; }
        continue;
      }
      if (ch === '"') inStr = true;
      else if (ch === '[' || ch === '{') depth++;
      else if (ch === ']' || ch === '}') {
        depth--;
        if (depth === 1 && ch === '}') lastGoodEnd = i;
      }
    }
  
    if (lastGoodEnd === -1) return [];
    try {
      const parsed = JSON.parse(text.slice(start, lastGoodEnd + 1) + ']');
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  
  /**
   * Parse teks mentah AI jadi array soal, dengan 3 lapis usaha:
   *   1. Coba parse langsung (siapa tahu sudah valid)
   *   2. Sanitize dulu (perbaiki backslash & kutip), lalu parse
   *   3. Kalau masih gagal, coba salvage sebagian yang utuh
   *
   * Return: { success, questions, repaired, salvaged, error }
   */
  function tryParseJson(rawText) {
    // Percobaan 1: langsung
    try {
      const parsed = JSON.parse(rawText);
      return {
        success: true,
        questions: Array.isArray(parsed) ? parsed : [parsed],
        repaired: false,
        salvaged: false,
        error: null,
      };
    } catch (e1) {
      // lanjut ke percobaan 2
    }
  
    // Percobaan 2: sanitize lalu parse
    const cleaned = sanitizeRawJsonText(rawText);
    try {
      const parsed = JSON.parse(cleaned);
      return {
        success: true,
        questions: Array.isArray(parsed) ? parsed : [parsed],
        repaired: true,
        salvaged: false,
        error: null,
      };
    } catch (e2) {
      // Percobaan 3: salvage sebagian
      const salvaged = salvagePartialJsonArray(cleaned);
      if (salvaged.length > 0) {
        return {
          success: true,
          questions: salvaged,
          repaired: true,
          salvaged: true,
          error: `Sebagian soal terselamatkan (${salvaged.length} soal). Error asli: ${e2.message}`,
        };
      }
      return {
        success: false,
        questions: [],
        repaired: true,
        salvaged: false,
        error: e2.message,
      };
    }
  }
  
  
  /* ============================================================
     TAHAP 3 — VALIDASI & NORMALISASI KE KONTRAK
  ============================================================ */
  
  /**
   * Pastikan opsiJawaban SELALU array of string, apapun bentuk
   * asal dari AI (kadang array of object {key,text}, kadang
   * string bernomor "A. Jakarta", dsb).
   */
  function normalizeOpsiJawaban(val) {
    if (!Array.isArray(val)) return [];
    return val.map((item) => {
      if (typeof item === 'string') return item;
      if (item && typeof item === 'object') {
        return String(item.text ?? item.opsi ?? item.value ?? JSON.stringify(item));
      }
      return String(item ?? '');
    });
  }
  
  function normalizeTabelBenarSalah(val) {
    if (!Array.isArray(val)) return [];
    return val.map((item) => ({
      pernyataan: String(item?.pernyataan ?? item?.text ?? ''),
      kunci: (item?.kunci === true || item?.kunci === 'benar') ? 'benar'
           : (item?.kunci === false || item?.kunci === 'salah') ? 'salah'
           : '',
    }));
  }
  
  function normalizePasangan(val) {
    if (!Array.isArray(val)) return [];
    return val.map((item) => ({
      kiri: String(item?.kiri ?? ''),
      kanan: String(item?.kanan ?? ''),
    }));
  }
  
  function normalizeGambar(val) {
    if (!Array.isArray(val)) return [];
    return val.map((item) => ({
      id: String(item?.id ?? ''),
      deskripsi: String(item?.deskripsi ?? item?.description ?? ''),
    }));
  }
  
  /**
   * Validasi + normalisasi SATU objek soal ke bentuk kontrak baku.
   * Tidak pernah menolak soal secara diam-diam -- kalau ada yang
   * janggal, dicatat di `warnings` supaya admin bisa cek manual,
   * tapi soal tetap dikembalikan (mengoreksi otomatis kalau bisa).
   */
  function validateQuestion(raw, index) {
    const warnings = [];
    const q = raw && typeof raw === 'object' ? raw : {};
  
    // --- nomor ---
    let nomor = Number(q.nomor);
    if (!Number.isFinite(nomor)) {
      warnings.push(`nomor tidak valid/hilang, diisi urutan ke-${index + 1}`);
      nomor = index + 1;
    }
  
    // --- tipe ---
    let tipe = String(q.tipe || '').trim();
    if (!TIPE_ENUM.includes(tipe)) {
      warnings.push(`tipe "${q.tipe}" tidak dikenal, di-default ke "pg_sederhana"`);
      tipe = 'pg_sederhana';
    }
  
    // --- teksSoal ---
    const teksSoal = String(q.teksSoal ?? q.teks_soal ?? '').trim();
    if (!teksSoal) warnings.push('teksSoal kosong');
  
    // --- field per tipe (dinormalisasi semua, dikosongkan sesuai tipe) ---
    const opsiJawaban = normalizeOpsiJawaban(q.opsiJawaban ?? q.opsi_jawaban);
    const pernyataan = Array.isArray(q.pernyataan) ? q.pernyataan.map(String) : [];
    const tabelBenarSalah = normalizeTabelBenarSalah(q.tabelBenarSalah ?? q.tabel_benar_salah);
    const pasangan = normalizePasangan(q.pasangan);
    const gambar = normalizeGambar(q.gambar);
  
    // --- validasi silang: field wajib per tipe harus terisi ---
    if ((tipe === 'pg_sederhana' || tipe === 'pg_kompleks') && opsiJawaban.length === 0) {
      warnings.push(`tipe "${tipe}" seharusnya punya opsiJawaban, tapi kosong`);
    }
    if (tipe === 'pg_kompleks' && pernyataan.length === 0) {
      warnings.push('tipe "pg_kompleks" seharusnya punya pernyataan, tapi kosong');
    }
    if (tipe === 'benar_salah' && tabelBenarSalah.length === 0) {
      warnings.push('tipe "benar_salah" seharusnya punya tabelBenarSalah, tapi kosong');
    }
    if (tipe === 'menjodohkan' && pasangan.length === 0) {
      warnings.push('tipe "menjodohkan" seharusnya punya pasangan, tapi kosong');
    }
  
    // --- placeholder gambar {{GAMBAR_n}} harus match dengan field gambar ---
    const placeholderIds = [...teksSoal.matchAll(/\{\{(GAMBAR_\d+)\}\}/g)].map(m => m[1]);
    const gambarIds = gambar.map(g => g.id);
    for (const pid of placeholderIds) {
      if (!gambarIds.includes(pid)) {
        warnings.push(`placeholder {{${pid}}} ada di teksSoal tapi tidak ada di field gambar`);
      }
    }
  
    // --- kunciJawaban ---
    const kunciJawaban = String(q.kunciJawaban ?? q.kunci_jawaban ?? '').trim();
  
    // --- topik/subtopik ---
    const topik = String(q.topik ?? '').trim();
    const subtopik = String(q.subtopik ?? '').trim();
    const topikBaru = Boolean(q.topikBaru);
    if (!topik) warnings.push('topik kosong');
  
    const normalized = {
      nomor, tipe, teksSoal,
      opsiJawaban, pernyataan, tabelBenarSalah, pasangan,
      kunciJawaban, gambar,
      topik, subtopik, topikBaru,
    };
  
    return {
      valid: warnings.length === 0,
      warnings,
      normalized,
    };
  }
  
  /**
   * Validasi + normalisasi SELURUH array soal.
   * Return: { total, bersih, perluDicek, hasil: [...] }
   * `hasil` berisi SEMUA soal (baik bersih maupun yang ada warning)
   * -- tidak ada yang dibuang diam-diam.
   */
  function validateAndNormalizeBatch(rawArray) {
    const arr = Array.isArray(rawArray) ? rawArray : [];
    const hasil = arr.map((item, idx) => {
      const { valid, warnings, normalized } = validateQuestion(item, idx);
      return { ...normalized, __valid: valid, __warnings: warnings };
    });
  
    return {
      total: hasil.length,
      bersih: hasil.filter(h => h.__valid).length,
      perluDicek: hasil.filter(h => !h.__valid).length,
      hasil,
    };
  }
  
  
  /* ============================================================
     ORKESTRATOR — dipanggil dari UI import
  ============================================================ */
  
  /**
   * Titik masuk utama. Dipanggil dengan teks mentah hasil copy-
   * paste dari AI (Gemini/ChatGPT/Claude).
   */
  function parseAndValidateBankSoalJson(rawText) {
    const parseResult = tryParseJson(rawText);
  
    if (!parseResult.success) {
      return {
        success: false,
        stage: 'parse',
        error: parseResult.error,
        report: null,
      };
    }
  
    const report = validateAndNormalizeBatch(parseResult.questions);
  
    return {
      success: true,
      stage: 'validated',
      repaired: parseResult.repaired,
      salvaged: parseResult.salvaged,
      parseWarning: parseResult.error,   // ada isinya kalau salvaged=true
      report,
    };
  }
  
  
  export {
    TIPE_ENUM,
    FIELD_WAJIB,
    sanitizeRawJsonText,
    tryParseJson,
    salvagePartialJsonArray,
    validateQuestion,
    validateAndNormalizeBatch,
    parseAndValidateBankSoalJson,
  };