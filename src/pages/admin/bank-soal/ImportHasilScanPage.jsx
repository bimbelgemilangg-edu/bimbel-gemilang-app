// src/pages/admin/bank-soal/ImportHasilScanPage.jsx
// ============================================================
// IMPORT HASIL SCAN AI -> BANK SOAL GEMILANG
//
// SUPPORT:
// - JSON array langsung
// - { questions: [...] }
// - { soal: [...] }
// - { data: [...] }
// - { items: [...] }
// - JSON dari Gemini / ChatGPT / Claude / AI lain
// - Gambar base64 / dataUrl / URL
// - Pembahasan
// - Penanda jawaban benar
// - PG sederhana
// - PG kompleks
// - Benar / Salah
// - Isian singkat
// - Menjodohkan
// - LaTeX
//
// FORMAT JSON YANG DIREKOMENDASIKAN:
//
// [
//   {
//     "nomor": 1,
//     "tipe": "pg_sederhana",
//     "teks_soal": "Hasil dari $2+3$ adalah ...",
//     "opsi_jawaban": [
//       "4",
//       "5",
//       "6",
//       "7"
//     ],
//     "kunci_jawaban": "B",
//     "jawaban_benar": ["B"],
//     "pembahasan": "Karena 2 + 3 = 5, maka jawaban yang benar adalah B.",
//     "gambar": [
//       {
//         "id": "gambar_1",
//         "dataUrl": "data:image/png;base64,...",
//         "deskripsi": "Gambar pendukung soal"
//       }
//     ]
//   }
// ]
// ============================================================

import React, {
    useState,
    useCallback,
    useMemo,
    useEffect,
  } from 'react';
  
  import SidebarAdmin from '../../../components/SidebarAdmin';
  
  import {
    collection,
    doc,
    writeBatch,
    serverTimestamp,
  } from 'firebase/firestore';
  
  import { db, auth } from '../../../firebase';
  
  /* ============================================================
     TAILWIND
  ============================================================ */
  
  const useTailwind = () => {
    useEffect(() => {
      if (
        typeof document !== 'undefined' &&
        !document.querySelector('script[src*="cdn.tailwindcss.com"]')
      ) {
        const s = document.createElement('script');
        s.src = 'https://cdn.tailwindcss.com';
        s.async = true;
        document.head.insertBefore(s, document.head.firstChild);
      }
    }, []);
  };
  
  /* ============================================================
     KATEX
  ============================================================ */
  
  const useKaTeX = () => {
    const [ready, setReady] = useState(
      typeof window !== 'undefined' && !!window.katex
    );
  
    useEffect(() => {
      if (typeof window === 'undefined') return;
  
      if (window.katex) {
        setReady(true);
        return;
      }
  
      if (
        !document.querySelector(
          'link[href*="katex.min.css"]'
        )
      ) {
        const css = document.createElement('link');
        css.rel = 'stylesheet';
        css.href =
          'https://cdnjs.cloudflare.com/ajax/libs/KaTeX/0.16.9/katex.min.css';
        document.head.appendChild(css);
      }
  
      const existingScript = document.querySelector(
        'script[src*="katex.min.js"]'
      );
  
      if (existingScript) {
        existingScript.addEventListener('load', () => {
          setReady(true);
        });
        return;
      }
  
      const script = document.createElement('script');
      script.src =
        'https://cdnjs.cloudflare.com/ajax/libs/KaTeX/0.16.9/katex.min.js';
      script.async = true;
  
      script.onload = () => {
        setReady(true);
      };
  
      script.onerror = () => {
        setReady(false);
      };
  
      document.body.appendChild(script);
    }, []);
  
    return ready;
  };
  
  /* ============================================================
     CONSTANT
  ============================================================ */
  
  const BANK_SOAL_COLLECTION = 'bank_soal';
  
  const DAFTAR_MAPEL = [
    'Matematika',
    'Fisika',
    'Kimia',
    'Biologi',
    'Bahasa Indonesia',
    'Bahasa Inggris',
    'Ekonomi',
    'Geografi',
    'Sosiologi',
    'Sejarah',
    'PKN',
    'TPS/Penalaran Umum',
    'Lainnya',
  ];
  
  const DAFTAR_JENJANG = [
    'SD/MI',
    'SMP/MTs',
    'SMA/MA',
    'SMK',
    'UTBK/SNBT',
  ];
  
  const DAFTAR_KELAS = [
    '1',
    '2',
    '3',
    '4',
    '5',
    '6',
    '7',
    '8',
    '9',
    '10',
    '11',
    '12',
    'Semua',
  ];
  
  const DAFTAR_KESULITAN = [
    'mudah',
    'sedang',
    'sulit',
  ];
  
  const TIPE_LABELS = {
    pg_sederhana: 'PG Sederhana',
    pg_kompleks: 'PG Kompleks',
    benar_salah: 'Benar / Salah',
    isian_singkat: 'Isian Singkat',
    menjodohkan: 'Menjodohkan',
  };
  
  /* ============================================================
     HELPER UMUM
  ============================================================ */
  
  function isObject(value) {
    return (
      value !== null &&
      typeof value === 'object' &&
      !Array.isArray(value)
    );
  }
  
  function toCleanString(value) {
    if (value === null || value === undefined) {
      return '';
    }
  
    if (typeof value === 'string') {
      return value.trim();
    }
  
    if (
      typeof value === 'number' ||
      typeof value === 'boolean'
    ) {
      return String(value);
    }
  
    return '';
  }
  
  function toArray(value) {
    if (Array.isArray(value)) {
      return value;
    }
  
    if (
      value === null ||
      value === undefined ||
      value === ''
    ) {
      return [];
    }
  
    return [value];
  }
  
  /* ============================================================
     ESCAPE HTML
  ============================================================ */
  
  function escapeHtml(value) {
    return String(value ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
  
  /* ============================================================
     LATEX
  ============================================================ */
  
  function findInlineEnd(text, start, close) {
    for (let i = start; i < text.length; i++) {
      if (text[i] === '\n') {
        return -1;
      }
  
      if (text.startsWith(close, i)) {
        return i;
      }
  
      if (text[i] === '\\') {
        i++;
      }
    }
  
    return -1;
  }
  
  function processSegment(text, renderMath) {
    let result = '';
    let i = 0;
  
    while (i < text.length) {
      // $$ ... $$
      if (
        text[i] === '$' &&
        text[i + 1] === '$'
      ) {
        const end = text.indexOf(
          '$$',
          i + 2
        );
  
        if (end !== -1) {
          result += renderMath(
            text.slice(i + 2, end),
            true
          );
  
          i = end + 2;
          continue;
        }
      }
  
      // $ ... $
      if (text[i] === '$') {
        const end = findInlineEnd(
          text,
          i + 1,
          '$'
        );
  
        if (end !== -1) {
          result += renderMath(
            text.slice(i + 1, end),
            false
          );
  
          i = end + 1;
          continue;
        }
      }
  
      // \[ ... \]
      if (
        text[i] === '\\' &&
        text[i + 1] === '['
      ) {
        const end = text.indexOf(
          '\\]',
          i + 2
        );
  
        if (end !== -1) {
          result += renderMath(
            text.slice(i + 2, end),
            true
          );
  
          i = end + 2;
          continue;
        }
      }
  
      // \( ... \)
      if (
        text[i] === '\\' &&
        text[i + 1] === '('
      ) {
        const end = text.indexOf(
          '\\)',
          i + 2
        );
  
        if (end !== -1) {
          result += renderMath(
            text.slice(i + 2, end),
            false
          );
  
          i = end + 2;
          continue;
        }
      }
  
      const ch = text[i];
  
      if (ch === '&') {
        result += '&amp;';
      } else if (ch === '<') {
        result += '&lt;';
      } else if (ch === '>') {
        result += '&gt;';
      } else if (ch === '\n') {
        result += '<br />';
      } else {
        result += ch;
      }
  
      i++;
    }
  
    return result;
  }
  
  /* ============================================================
     GAMBAR HELPER
  ============================================================ */
  
  function getImageSource(gambar) {
    if (!gambar) return null;
  
    return (
      gambar.uploadedUrl ||
      gambar.url ||
      gambar.src ||
      gambar.dataUrl ||
      gambar.data_url ||
      gambar.base64 ||
      null
    );
  }
  
  function normalizeImage(gambar, index) {
    if (typeof gambar === 'string') {
      const value = gambar.trim();
  
      return {
        id: `gambar_${index + 1}`,
        url: value.startsWith('http')
          ? value
          : null,
        dataUrl: value.startsWith('data:image')
          ? value
          : null,
        deskripsi: 'Gambar soal',
        uploadedUrl: null,
      };
    }
  
    if (!isObject(gambar)) {
      return {
        id: `gambar_${index + 1}`,
        url: null,
        dataUrl: null,
        deskripsi: 'Gambar soal',
        uploadedUrl: null,
      };
    }
  
    let source = getImageSource(gambar);
  
    let url = null;
    let dataUrl = null;
  
    if (
      typeof source === 'string'
    ) {
      if (source.startsWith('data:image')) {
        dataUrl = source;
      } else if (
        source.startsWith('http://') ||
        source.startsWith('https://')
      ) {
        url = source;
      }
    }
  
    return {
      ...gambar,
      id:
        gambar.id ||
        gambar.nama ||
        `gambar_${index + 1}`,
      url,
      dataUrl,
      uploadedUrl:
        gambar.uploadedUrl || null,
      deskripsi:
        gambar.deskripsi ||
        gambar.description ||
        gambar.alt ||
        'Gambar soal',
    };
  }
  
  /* ============================================================
     PARSE JSON AI
  ============================================================ */
  
  function removeCodeFence(text) {
    return text
      .replace(/^\uFEFF/, '')
      .replace(/^```(?:json|javascript|js)?\s*/i, '')
      .replace(/\s*```\s*$/i, '')
      .trim();
  }
  
  /**
   * Mengambil bagian JSON jika AI memberikan teks:
   *
   * Berikut hasilnya:
   * ```json
   * [...]
   * ```
   *
   * atau:
   *
   * Berikut hasilnya:
   * [...]
   */
  function extractPossibleJSON(text) {
    const cleaned = removeCodeFence(text);
  
    // Coba langsung
    try {
      return JSON.parse(cleaned);
    } catch {
      // lanjut
    }
  
    // Cari array JSON
    const firstArray = cleaned.indexOf('[');
    const lastArray = cleaned.lastIndexOf(']');
  
    if (
      firstArray !== -1 &&
      lastArray !== -1 &&
      lastArray > firstArray
    ) {
      const candidate = cleaned.slice(
        firstArray,
        lastArray + 1
      );
  
      try {
        return JSON.parse(candidate);
      } catch {
        // lanjut
      }
    }
  
    // Cari object JSON
    const firstObject = cleaned.indexOf('{');
    const lastObject = cleaned.lastIndexOf('}');
  
    if (
      firstObject !== -1 &&
      lastObject !== -1 &&
      lastObject > firstObject
    ) {
      const candidate = cleaned.slice(
        firstObject,
        lastObject + 1
      );
  
      try {
        return JSON.parse(candidate);
      } catch {
        // lanjut
      }
    }
  
    throw new Error(
      'JSON tidak valid. Pastikan isi JSON benar dan tidak terpotong.'
    );
  }
  
  /**
   * Mencari array soal di berbagai struktur JSON.
   */
  function findQuestionArray(parsed) {
    if (Array.isArray(parsed)) {
      return parsed;
    }
  
    if (!isObject(parsed)) {
      return null;
    }
  
    const possibleKeys = [
      'questions',
      'question',
      'soal',
      'soals',
      'data',
      'items',
      'results',
      'questionsData',
      'bankSoal',
      'bank_soal',
    ];
  
    for (const key of possibleKeys) {
      if (Array.isArray(parsed[key])) {
        return parsed[key];
      }
    }
  
    // Struktur seperti:
    // { data: { questions: [...] } }
    for (const key of possibleKeys) {
      if (isObject(parsed[key])) {
        const nested = findQuestionArray(
          parsed[key]
        );
  
        if (Array.isArray(nested)) {
          return nested;
        }
      }
    }
  
    return null;
  }
  
  function parseJSON(raw) {
    if (!raw || !raw.trim()) {
      throw new Error(
        'Input JSON kosong.'
      );
    }
  
    const parsed = extractPossibleJSON(raw);
  
    const questions =
      findQuestionArray(parsed);
  
    if (!Array.isArray(questions)) {
      throw new Error(
        'Format JSON tidak dikenali. JSON harus berupa array soal atau object yang memiliki questions, soal, data, items, atau results.'
      );
    }
  
    if (questions.length === 0) {
      throw new Error(
        'JSON berhasil dibaca tetapi tidak berisi soal.'
      );
    }
  
    return questions;
  }
  
  /* ============================================================
     PARSE CSV
  ============================================================ */
  
  function parseCSVLine(line) {
    const cols = [];
    let current = '';
    let inQuotes = false;
  
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
  
      if (char === '"') {
        if (
          inQuotes &&
          line[i + 1] === '"'
        ) {
          current += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (
        char === ',' &&
        !inQuotes
      ) {
        cols.push(current);
        current = '';
      } else {
        current += char;
      }
    }
  
    cols.push(current);
  
    return cols.map(
      value => value.trim()
    );
  }
  
  function parseCSV(raw) {
    const text = raw.trim();
  
    if (!text) {
      throw new Error(
        'CSV kosong.'
      );
    }
  
    const lines = text
      .split(/\r?\n/)
      .filter(line => line.trim());
  
    if (lines.length < 2) {
      throw new Error(
        'CSV kosong atau hanya memiliki header.'
      );
    }
  
    const header =
      parseCSVLine(lines[0]).map(
        h =>
          h
            .replace(/^"|"$/g, '')
            .trim()
            .toLowerCase()
      );
  
    const results = [];
  
    for (
      let i = 1;
      i < lines.length;
      i++
    ) {
      const cols =
        parseCSVLine(lines[i]);
  
      const get = key => {
        const index =
          header.indexOf(key);
  
        return index >= 0
          ? (
              cols[index] || ''
            ).trim()
          : '';
      };
  
      const opsiJawaban = [
        'opsi a',
        'opsi b',
        'opsi c',
        'opsi d',
        'opsi e',
      ]
        .map(get)
        .filter(Boolean);
  
      const kunci =
        get('kunci') ||
        get('kunci jawaban') ||
        get('jawaban benar');
  
      const pembahasan =
        get('pembahasan') ||
        get('penjelasan') ||
        '';
  
      results.push({
        nomor:
          parseInt(get('nomor'), 10) ||
          i,
  
        tipe:
          get('tipe') ||
          'pg_sederhana',
  
        teks_soal:
          get('soal') ||
          get('teks soal') ||
          get('pertanyaan') ||
          '',
  
        opsi_jawaban:
          opsiJawaban,
  
        pernyataan: get(
          'pernyataan'
        )
          ? get('pernyataan')
              .split(' | ')
              .filter(Boolean)
          : [],
  
        tabel_benar_salah:
          get('tabel benar-salah')
            ? get('tabel benar-salah')
                .split(' | ')
                .filter(Boolean)
            : [],
  
        pasangan: [],
  
        kunci_jawaban: kunci,
  
        jawaban_benar: kunci,
  
        jawaban_benar_index: [],
  
        pembahasan,
  
        kunci_terverifikasi:
          Boolean(kunci),
  
        gambar: [],
      });
    }
  
    if (results.length === 0) {
      throw new Error(
        'Tidak ada baris soal di CSV.'
      );
    }
  
    return results;
  }
  
  /* ============================================================
     TIPE SOAL
  ============================================================ */
  
  function normalizeTipe(tipe) {
    const value = String(
      tipe || ''
    )
      .trim()
      .toLowerCase();
  
    const aliases = {
      pg: 'pg_sederhana',
      pilihan_ganda:
        'pg_sederhana',
      pilihan_ganda_sederhana:
        'pg_sederhana',
      pilihan_ganda_kompleks:
        'pg_kompleks',
      kompleks:
        'pg_kompleks',
      benar_salah:
        'benar_salah',
      benar_salah: 'benar_salah',
      isian:
        'isian_singkat',
      isian_singkat:
        'isian_singkat',
      menjodohkan:
        'menjodohkan',
    };
  
    return (
      aliases[value] ||
      value ||
      'pg_sederhana'
    );
  }
  
  /* ============================================================
     NORMALIZE OPSI
  ============================================================ */
  
  function getOptionText(option) {
    if (
      typeof option === 'string' ||
      typeof option === 'number'
    ) {
      return String(option);
    }
  
    if (!isObject(option)) {
      return '';
    }
  
    return (
      toCleanString(option.teks) ||
      toCleanString(option.text) ||
      toCleanString(option.label) ||
      toCleanString(option.jawaban) ||
      toCleanString(option.value) ||
      ''
    );
  }
  
  function isOptionCorrect(option) {
    if (!isObject(option)) {
      return false;
    }
  
    return Boolean(
      option.benar === true ||
      option.correct === true ||
      option.isCorrect === true ||
      option.jawabanBenar === true ||
      option.jawaban_benar === true
    );
  }
  
  /* ============================================================
     NORMALIZE KUNCI JAWABAN
  ============================================================ */
  
  function letterFromIndex(index) {
    const n = Number(index);
  
    if (
      !Number.isInteger(n) ||
      n < 0
    ) {
      return '';
    }
  
    return String.fromCharCode(
      65 + n
    );
  }
  
  function normalizeAnswerValue(
    value,
    opsi
  ) {
    const answers = [];
  
    const addAnswer = item => {
      if (
        item === null ||
        item === undefined
      ) {
        return;
      }
  
      if (
        typeof item === 'number'
      ) {
        const letter =
          letterFromIndex(item);
  
        if (letter) {
          answers.push(letter);
        }
  
        return;
      }
  
      if (
        typeof item === 'string'
      ) {
        const clean =
          item
            .trim()
            .toUpperCase();
  
        if (!clean) return;
  
        // "A,B,C"
        if (
          clean.includes(',')
        ) {
          clean
            .split(',')
            .map(x => x.trim())
            .filter(Boolean)
            .forEach(addAnswer);
  
          return;
        }
  
        // "A C"
        if (
          clean.length > 1 &&
          /^[A-Z]+$/.test(clean) &&
          clean.length <= 5
        ) {
          for (
            let i = 0;
            i < clean.length;
            i++
          ) {
            answers.push(clean[i]);
          }
  
          return;
        }
  
        // "opsi B"
        const match =
          clean.match(
            /(?:OPSI|PILIHAN|JAWABAN)\s*([A-Z])/i
          );
  
        if (match) {
          answers.push(
            match[1].toUpperCase()
          );
          return;
        }
  
        // "B. ..."
        const letterMatch =
          clean.match(
            /^([A-Z])(?:\.|\)|:|-|\s)/
          );
  
        if (letterMatch) {
          answers.push(
            letterMatch[1]
          );
          return;
        }
  
        // Jika hanya satu huruf
        if (
          /^[A-Z]$/.test(clean)
        ) {
          answers.push(clean);
          return;
        }
  
        // Jika isi jawaban sama persis
        if (
          Array.isArray(opsi)
        ) {
          const index =
            opsi.findIndex(
              option =>
                getOptionText(
                  option
                )
                  .trim()
                  .toUpperCase() ===
                clean
            );
  
          if (index >= 0) {
            answers.push(
              letterFromIndex(index)
            );
          }
        }
  
        return;
      }
  
      if (isObject(item)) {
        addAnswer(
          item.huruf ||
          item.letter ||
          item.label ||
          item.kode ||
          item.index
        );
      }
    };
  
    if (Array.isArray(value)) {
      value.forEach(addAnswer);
    } else {
      addAnswer(value);
    }
  
    return [
      ...new Set(
        answers.filter(Boolean)
      ),
    ];
  }
  
  /* ============================================================
     NORMALIZE SOAL
  ============================================================ */
  
  function normalizeSoal(
    q,
    idx
  ) {
    if (!isObject(q)) {
      return {
        nomor: idx + 1,
        tipe: 'pg_sederhana',
        teks_soal: String(q || ''),
        opsi_jawaban: [],
        pernyataan: [],
        tabel_benar_salah: [],
        pasangan: [],
        kunci_jawaban: '',
        jawaban_benar: [],
        jawaban_benar_index: [],
        kunci_terverifikasi: false,
        pembahasan: '',
        gambar: [],
      };
    }
  
    const rawOptions =
      q.opsi_jawaban ??
      q.opsiJawaban ??
      q.options ??
      q.pilihan ??
      q.opsi ??
      [];
  
    const optionObjects =
      Array.isArray(rawOptions)
        ? rawOptions
        : [];
  
    const opsi_jawaban =
      optionObjects
        .map(getOptionText)
        .filter(Boolean);
  
    /* ----------------------------------------------------------
       Jawaban benar dari:
       - jawaban_benar
       - jawabanBenar
       - kunci_jawaban
       - kunciJawaban
       - kunci
       - answer
       - correctAnswer
       ---------------------------------------------------------- */
  
    let rawAnswer =
      q.jawaban_benar ??
      q.jawabanBenar ??
      q.kunci_jawaban ??
      q.kunciJawaban ??
      q.kunci ??
      q.answer ??
      q.correctAnswer ??
      '';
  
    /*
     * Jika opsi berbentuk object dan punya benar:true,
     * otomatis cari jawaban benar.
     */
    const markedCorrectIndexes =
      optionObjects
        .map(
          (option, optionIndex) =>
            isOptionCorrect(option)
              ? optionIndex
              : -1
        )
        .filter(index => index >= 0);
  
    let jawabanBenar =
      normalizeAnswerValue(
        rawAnswer,
        opsi_jawaban
      );
  
    if (
      jawabanBenar.length === 0 &&
      markedCorrectIndexes.length > 0
    ) {
      jawabanBenar =
        markedCorrectIndexes.map(
          letterFromIndex
        );
    }
  
    /*
     * Jika jawaban benar berupa index
     * [0, 2] -> ["A", "C"]
     */
    const jawabanBenarIndex =
      jawabanBenar
        .map(letter =>
          letter.charCodeAt(0) -
          65
        )
        .filter(
          index =>
            index >= 0 &&
            index < opsi_jawaban.length
        );
  
    const kunciJawaban =
      jawabanBenar.join(',');
  
    /* ----------------------------------------------------------
       Gambar
       ---------------------------------------------------------- */
  
    const rawImages =
      q.gambar ??
      q.gambar_soal ??
      q.gambarSoal ??
      q.images ??
      q.image ??
      [];
  
    const gambar = toArray(
      rawImages
    )
      .map(normalizeImage)
      .filter(
        image =>
          image.url ||
          image.dataUrl ||
          image.uploadedUrl
      );
  
    /* ----------------------------------------------------------
       Pasangan
       ---------------------------------------------------------- */
  
    const pasanganRaw =
      q.pasangan ??
      q.matching ??
      q.menjodohkan ??
      [];
  
    const pasangan =
      Array.isArray(
        pasanganRaw
      )
        ? pasanganRaw.map(
            p => ({
              kiri: String(
                p?.kiri ??
                p?.left ??
                ''
              ),
              kanan: String(
                p?.kanan ??
                p?.right ??
                ''
              ),
            })
          )
        : [];
  
    /* ----------------------------------------------------------
       Pernyataan
       ---------------------------------------------------------- */
  
    const pernyataanRaw =
      q.pernyataan ??
      q.statements ??
      [];
  
    const pernyataan =
      Array.isArray(
        pernyataanRaw
      )
        ? pernyataanRaw.map(
            item =>
              typeof item === 'string'
                ? item
                : toCleanString(
                    item?.teks ??
                    item?.text ??
                    item?.pernyataan
                  )
          )
        : [];
  
    /* ----------------------------------------------------------
       Tabel benar salah
       ---------------------------------------------------------- */
  
    const tabelRaw =
      q.tabel_benar_salah ??
      q.tabelBenarSalah ??
      q.benarSalah ??
      [];
  
    const tabel_benar_salah =
      Array.isArray(tabelRaw)
        ? tabelRaw
        : [];
  
    /* ----------------------------------------------------------
       Pembahasan
       ---------------------------------------------------------- */
  
    const pembahasan =
      toCleanString(
        q.pembahasan ??
        q.penjelasan ??
        q.explanation ??
        q.solusi ??
        q.pembahasan_jawaban ??
        ''
      );
  
    /* ----------------------------------------------------------
       Nomor
       ---------------------------------------------------------- */
  
    const parsedNomor =
      parseInt(
        q.nomor ??
        q.no ??
        q.number ??
        idx + 1,
        10
      );
  
    return {
      nomor:
        Number.isFinite(parsedNomor)
          ? parsedNomor
          : idx + 1,
  
      tipe: normalizeTipe(
        q.tipe ??
        q.type ??
        q.jenis ??
        q.jenis_soal
      ),
  
      teks_soal:
        toCleanString(
          q.teks_soal ??
          q.teksSoal ??
          q.soal ??
          q.pertanyaan ??
          q.question ??
          ''
        ),
  
      opsi_jawaban,
  
      pernyataan,
  
      tabel_benar_salah,
  
      pasangan,
  
      kunci_jawaban:
        kunciJawaban,
  
      jawaban_benar:
        jawabanBenar,
  
      jawaban_benar_index:
        jawabanBenarIndex,
  
      kunci_terverifikasi:
        Boolean(
          q.kunci_terverifikasi ??
          q.kunciTerverifikasi ??
          q.verified ??
          q.terverifikasi ??
          jawabanBenar.length > 0
        ),
  
      pembahasan,
  
      gambar,
  
      /* Data tambahan */
      sumber:
        q.sumber ??
        q.source ??
        '',
  
      catatan:
        q.catatan ??
        q.notes ??
        '',
    };
  }
  
  /* ============================================================
     BUILD FIRESTORE DOCUMENT
  ============================================================ */
  
  function buildDoc(
    q,
    meta
  ) {
    const gambarUrls =
      (q.gambar || [])
        .map(
          g =>
            g.uploadedUrl ||
            g.url ||
            (
              typeof g.dataUrl ===
                'string' &&
              g.dataUrl.startsWith(
                'https://'
              )
                ? g.dataUrl
                : null
            )
        )
        .filter(Boolean);
  
    /*
     * Simpan struktur jawaban yang lengkap.
     *
     * kunciJawaban:
     *   "B"
     *
     * jawabanBenar:
     *   ["B"]
     *
     * jawabanBenarIndex:
     *   [1]
     *
     * Ini sengaja disimpan semua agar
     * kompatibel dengan sistem yang mungkin
     * membaca salah satu field tersebut.
     */
  
    return {
      nomor: q.nomor,
  
      soal: q.teks_soal,
  
      teksSoal: q.teks_soal,
  
      tipe: q.tipe,
  
      opsiJawaban:
        q.opsi_jawaban,
  
      pernyataan:
        q.pernyataan,
  
      tabelBenarSalah:
        q.tabel_benar_salah,
  
      pasangan:
        q.pasangan,
  
      /* Jawaban */
      kunciJawaban:
        q.kunci_jawaban,
  
      jawabanBenar:
        q.jawaban_benar,
  
      jawabanBenarIndex:
        q.jawaban_benar_index,
  
      kunciTerverifikasi:
        q.kunci_terverifikasi,
  
      /* Pembahasan */
      pembahasan:
        q.pembahasan,
  
      penjelasan:
        q.pembahasan,
  
      /* Gambar */
      gambarUrls,
  
      gambar:
        (q.gambar || []).map(
          g => ({
            id: g.id || null,
            url:
              g.uploadedUrl ||
              g.url ||
              null,
            deskripsi:
              g.deskripsi ||
              'Gambar soal',
          })
        ),
  
      /* Metadata */
      mataPelajaran:
        meta.mataPelajaran,
  
      tingkatKelas:
        meta.tingkatKelas,
  
      jenjang:
        meta.jenjang,
  
      kategori:
        meta.kategori,
  
      tags:
        meta.tags,
  
      tingkatKesulitan:
        meta.tingkatKesulitan,
  
      sumberFile:
        meta.sumberFile,
  
      sumberAI:
        meta.sumberAI,
  
      createdAt:
        serverTimestamp(),
  
      createdBy:
        auth.currentUser?.uid ||
        null,
  
      status:
        'aktif',
    };
  }
  
  /* ============================================================
     RENDER RICH TEXT
  ============================================================ */
  
  function RichText({
    text,
    gambar,
    mathReady,
  }) {
    const html = useMemo(() => {
      const safe =
        typeof text === 'string'
          ? text
          : String(text ?? '');
  
      if (!safe) {
        return '';
      }
  
      const imgs = (
        Array.isArray(gambar)
          ? gambar
          : []
      ).filter(Boolean);
  
      const katexLib =
        mathReady &&
        typeof window !== 'undefined' &&
        window.katex
          ? window.katex
          : null;
  
      const renderMath = (
        math,
        display
      ) => {
        if (!katexLib) {
          return display
            ? `<span>$$${escapeHtml(
                math
              )}$$</span>`
            : `<span>$${escapeHtml(
                math
              )}$</span>`;
        }
  
        try {
          return katexLib.renderToString(
            math,
            {
              displayMode:
                display,
              throwOnError:
                false,
              output: 'html',
            }
          );
        } catch {
          return display
            ? `<span>$$${escapeHtml(
                math
              )}$$</span>`
            : `<span>$${escapeHtml(
                math
              )}$</span>`;
        }
      };
  
      const makeImg = g => {
        const src =
          getImageSource(g);
  
        if (!src) {
          return `
            <span style="
              color:#d97706;
              font-size:11px;
            ">
              [Gambar belum tersedia]
            </span>
          `;
        }
  
        const alt =
          escapeHtml(
            g.deskripsi ||
            'Gambar soal'
          );
  
        return `
          <figure style="
            margin:10px 0;
          ">
            <img
              src="${src}"
              alt="${alt}"
              style="
                max-width:100%;
                max-height:360px;
                width:auto;
                height:auto;
                display:block;
                border-radius:8px;
                border:1px solid #e5e7eb;
                background:#fff;
                padding:4px;
                object-fit:contain;
              "
            />
            ${
              g.deskripsi
                ? `
                  <figcaption style="
                    margin-top:4px;
                    font-size:11px;
                    color:#6b7280;
                  ">
                    ${escapeHtml(
                      g.deskripsi
                    )}
                  </figcaption>
                `
                : ''
            }
          </figure>
        `;
      };
  
      /*
       * Support:
       * {{GAMBAR}}
       * {{GAMBAR_1}}
       * {{GAMBAR_2}}
       */
      const parts =
        safe.split(
          /(\{\{\s*GAMBAR(?:_\d+)?\s*\}\})/gi
        );
  
      let sequentialImageIndex = 0;
      let result = '';
  
      for (
        const part of parts
      ) {
        const isImagePlaceholder =
          /^\{\{\s*GAMBAR/i.test(
            part
          );
  
        if (
          isImagePlaceholder
        ) {
          const numbered =
            part.match(
              /GAMBAR_(\d+)/i
            );
  
          let image;
  
          if (numbered) {
            const index =
              parseInt(
                numbered[1],
                10
              ) - 1;
  
            image =
              imgs[index];
          } else {
            image =
              imgs[
                sequentialImageIndex
              ];
  
            sequentialImageIndex++;
          }
  
          result += makeImg(
            image || {}
          );
        } else {
          result += processSegment(
            part,
            renderMath
          );
        }
      }
  
      /*
       * Jika tidak ada placeholder gambar,
       * tampilkan gambar setelah teks.
       */
      if (
        !safe.match(
          /\{\{\s*GAMBAR/i
        ) &&
        imgs.some(
          g =>
            getImageSource(g)
        )
      ) {
        imgs.forEach(
          image => {
            result += makeImg(
              image
            );
          }
        );
      }
  
      return result;
    }, [
      text,
      gambar,
      mathReady,
    ]);
  
    return (
      <div
        className="
          text-sm
          text-gray-700
          leading-relaxed
          break-words
        "
        dangerouslySetInnerHTML={{
          __html: html,
        }}
      />
    );
  }
  
  /* ============================================================
     BADGE JAWABAN
  ============================================================ */
  
  function AnswerBadge({
    optionIndex,
    isCorrect,
  }) {
    const letter =
      String.fromCharCode(
        65 + optionIndex
      );
  
    return (
      <div
        className={`
          flex
          items-start
          gap-2
          rounded-lg
          border
          px-3
          py-2
          text-sm
          transition
          ${
            isCorrect
              ? 'border-emerald-300 bg-emerald-50 text-emerald-800'
              : 'border-gray-200 bg-white text-gray-700'
          }
        `}
      >
        <span
          className={`
            flex
            h-6
            w-6
            shrink-0
            items-center
            justify-center
            rounded-full
            text-xs
            font-bold
            ${
              isCorrect
                ? 'bg-emerald-600 text-white'
                : 'bg-gray-100 text-gray-600'
            }
          `}
        >
          {letter}
        </span>
  
        <div className="min-w-0 flex-1">
          {isCorrect && (
            <div className="mb-1 text-[10px] font-bold uppercase tracking-wide text-emerald-600">
              ✓ Jawaban Benar
            </div>
          )}
  
          <RichText
            text={
              arguments?.[0]
                ?.text || ''
            }
            gambar={[]}
            mathReady={
              arguments?.[0]
                ?.mathReady
            }
          />
        </div>
      </div>
    );
  }
  
  /* ============================================================
     KOMPONEN UTAMA
  ============================================================ */
  
  export default function ImportHasilScanPage() {
    useTailwind();
  
    const mathReady =
      useKaTeX();
  
    const [isMobile, setIsMobile] =
      useState(
        typeof window !==
          'undefined'
          ? window.innerWidth < 1024
          : false
      );
  
    useEffect(() => {
      const handleResize = () => {
        setIsMobile(
          window.innerWidth < 1024
        );
      };
  
      window.addEventListener(
        'resize',
        handleResize
      );
  
      return () => {
        window.removeEventListener(
          'resize',
          handleResize
        );
      };
    }, []);
  
    /* ==========================================================
       INPUT
    ========================================================== */
  
    const [format, setFormat] =
      useState('json');
  
    const [rawInput, setRawInput] =
      useState('');
  
    const [sumberAI, setSumberAI] =
      useState(
        'Gemini Canvas'
      );
  
    /* ==========================================================
       PARSE
    ========================================================== */
  
    const [soalList, setSoalList] =
      useState([]);
  
    const [parseError, setParseError] =
      useState('');
  
    /* ==========================================================
       METADATA
    ========================================================== */
  
    const [
      mataPelajaran,
      setMataPelajaran,
    ] = useState('Matematika');
  
    const [
      tingkatKelas,
      setTingkatKelas,
    ] = useState('10');
  
    const [jenjang, setJenjang] =
      useState('SMA/MA');
  
    const [kategori, setKategori] =
      useState('');
  
    const [tags, setTags] =
      useState('');
  
    const [
      tingkatKesulitan,
      setTingkatKesulitan,
    ] = useState('sedang');
  
    const [
      sumberFile,
      setSumberFile,
    ] = useState('');
  
    /* ==========================================================
       SAVE
    ========================================================== */
  
    const [saving, setSaving] =
      useState(false);
  
    const [
      saveResult,
      setSaveResult,
    ] = useState(null);
  
    const [saveLog, setSaveLog] =
      useState([]);
  
    /* ==========================================================
       STATISTIK
    ========================================================== */
  
    const statistik =
      useMemo(() => {
        const total =
          soalList.length;
  
        const denganGambar =
          soalList.filter(
            q =>
              Array.isArray(
                q.gambar
              ) &&
              q.gambar.some(
                g =>
                  !!getImageSource(
                    g
                  )
              )
          ).length;
  
        const denganPembahasan =
          soalList.filter(
            q =>
              !!q.pembahasan
          ).length;
  
        const denganKunci =
          soalList.filter(
            q =>
              Array.isArray(
                q.jawaban_benar
              ) &&
              q.jawaban_benar
                .length > 0
          ).length;
  
        const pgSederhana =
          soalList.filter(
            q =>
              q.tipe ===
              'pg_sederhana'
          ).length;
  
        const pgKompleks =
          soalList.filter(
            q =>
              q.tipe ===
              'pg_kompleks'
          ).length;
  
        return {
          total,
          denganGambar,
          denganPembahasan,
          denganKunci,
          pgSederhana,
          pgKompleks,
        };
      }, [soalList]);
  
    /* ==========================================================
       PARSE HANDLER
    ========================================================== */
  
    const handleParse =
      useCallback(() => {
        setParseError('');
        setSoalList([]);
        setSaveResult(null);
        setSaveLog([]);
  
        if (
          !rawInput.trim()
        ) {
          setParseError(
            'Input kosong. Paste JSON atau CSV terlebih dahulu.'
          );
          return;
        }
  
        try {
          const raw =
            format === 'json'
              ? parseJSON(
                  rawInput
                )
              : parseCSV(
                  rawInput
                );
  
          const normalized =
            raw
              .map(
                (q, i) =>
                  normalizeSoal(
                    q,
                    i
                  )
              )
              .filter(
                q =>
                  q.teks_soal ||
                  q.opsi_jawaban
                    .length > 0
              );
  
          if (
            normalized.length ===
            0
          ) {
            throw new Error(
              'Data berhasil dibaca tetapi tidak ada soal valid yang ditemukan.'
            );
          }
  
          setSoalList(
            normalized
          );
        } catch (error) {
          console.error(
            'Parse error:',
            error
          );
  
          setParseError(
            error?.message ||
              'Gagal membaca data.'
          );
        }
      }, [
        rawInput,
        format,
      ]);
  
    /* ==========================================================
       FILE UPLOAD
    ========================================================== */
  
    const handleFile = (
      event
    ) => {
      const file =
        event.target.files?.[0];
  
      if (!file) return;
  
      const fileName =
        file.name.toLowerCase();
  
      if (
        fileName.endsWith(
          '.json'
        )
      ) {
        setFormat('json');
      } else if (
        fileName.endsWith(
          '.csv'
        )
      ) {
        setFormat('csv');
      }
  
      const reader =
        new FileReader();
  
      reader.onload =
        e => {
          setRawInput(
            e.target?.result ||
              ''
          );
  
          setParseError('');
          setSoalList([]);
          setSaveResult(null);
        };
  
      reader.onerror =
        () => {
          setParseError(
            'File gagal dibaca.'
          );
        };
  
      reader.readAsText(
        file
      );
  
      setSumberFile(
        file.name
      );
    };
  
    /* ==========================================================
       RESET
    ========================================================== */
  
    const handleReset =
      () => {
        if (saving) return;
  
        setRawInput('');
        setSoalList([]);
        setParseError('');
        setSaveResult(null);
        setSaveLog([]);
      };
  
    /* ==========================================================
       COPY CONTOH JSON
    ========================================================== */
  
    const contohJSON =
      `[{
    "nomor": 1,
    "tipe": "pg_sederhana",
    "teks_soal": "Hasil dari $2+3$ adalah ...",
    "opsi_jawaban": [
      "4",
      "5",
      "6",
      "7"
    ],
    "jawaban_benar": ["B"],
    "kunci_jawaban": "B",
    "pembahasan": "Karena $2+3=5$, maka jawaban yang benar adalah B.",
    "gambar": []
  }]`;
  
    const handleLoadExample =
      () => {
        setFormat('json');
        setRawInput(
          contohJSON
        );
        setSoalList([]);
        setParseError('');
        setSaveResult(null);
        setSaveLog([]);
      };
  
    /* ==========================================================
       SAVE
    ========================================================== */
  
    const handleSave =
      async () => {
        if (
          soalList.length === 0
        ) {
          return;
        }
  
        if (saving) {
          return;
        }
  
        setSaving(true);
        setSaveResult(null);
  
        const log = [];
  
        const addLog = msg => {
          log.push(msg);
          setSaveLog([
            ...log,
          ]);
        };
  
        const meta = {
          mataPelajaran,
          tingkatKelas,
          jenjang,
          kategori,
          tags: tags
            .split(',')
            .map(
              t =>
                t.trim()
            )
            .filter(Boolean),
          tingkatKesulitan,
          sumberFile,
          sumberAI,
        };
  
        /*
         * Clone soal.
         */
        const soalProcessed =
          soalList.map(q => ({
            ...q,
            gambar: (
              q.gambar || []
            ).map(g => ({
              ...g,
            })),
          }));
  
        /* ======================================================
           UPLOAD GAMBAR BASE64
        ====================================================== */
  
        const toUpload = [];
  
        soalProcessed.forEach(
          (q, qi) => {
            (
              q.gambar || []
            ).forEach(
              (g, gi) => {
                const src =
                  g.dataUrl;
  
                if (
                  typeof src ===
                    'string' &&
                  src.startsWith(
                    'data:image'
                  )
                ) {
                  toUpload.push({
                    key: `q${qi}-g${gi}-${Date.now()}-${Math.random()
                      .toString(36)
                      .slice(2, 8)}`,
                    dataUrl: src,
                    qi,
                    gi,
                  });
                }
              }
            );
          }
        );
  
        if (
          toUpload.length > 0
        ) {
          addLog(
            `⏳ Menyiapkan ${toUpload.length} gambar untuk upload...`
          );
  
          try {
            const response =
              await fetch(
                '/api/uploadBankSoalImages',
                {
                  method:
                    'POST',
  
                  headers: {
                    'Content-Type':
                      'application/json',
                  },
  
                  body: JSON.stringify(
                    {
                      images:
                        toUpload.map(
                          item => ({
                            key:
                              item.key,
                            dataUrl:
                              item.dataUrl,
                          })
                        ),
                    }
                  ),
                }
              );
  
            if (
              !response.ok
            ) {
              throw new Error(
                `HTTP ${response.status}`
              );
            }
  
            const result =
              await response.json();
  
            const urlMap = {};
  
            (
              result.uploaded ||
              []
            ).forEach(
              uploaded => {
                if (
                  uploaded.key &&
                  uploaded.url
                ) {
                  urlMap[
                    uploaded.key
                  ] =
                    uploaded.url;
                }
              }
            );
  
            toUpload.forEach(
              ({
                key,
                qi,
                gi,
              }) => {
                const uploadedUrl =
                  urlMap[key];
  
                if (
                  uploadedUrl
                ) {
                  const gambar =
                    [
                      ...(
                        soalProcessed[
                          qi
                        ].gambar ||
                        []
                      ),
                    ];
  
                  gambar[gi] = {
                    ...gambar[gi],
                    uploadedUrl,
                    dataUrl:
                      null,
                  };
  
                  soalProcessed[
                    qi
                  ] = {
                    ...soalProcessed[
                      qi
                    ],
                    gambar,
                  };
                }
              }
            );
  
            const uploadedCount =
              result.uploadedCount ??
              Object.keys(
                urlMap
              ).length;
  
            addLog(
              `✅ ${uploadedCount}/${toUpload.length} gambar berhasil diupload.`
            );
  
            if (
              Array.isArray(
                result.errors
              ) &&
              result.errors
                .length > 0
            ) {
              addLog(
                `⚠️ ${result.errors.length} gambar gagal upload.`
              );
            }
          } catch (
            error
          ) {
            addLog(
              `❌ Upload gambar gagal: ${
                error?.message ||
                'unknown error'
              }`
            );
  
            addLog(
              '⚠️ Soal tetap diproses. Gambar yang gagal upload tidak akan memiliki URL.'
            );
          }
        } else {
          addLog(
            'ℹ️ Tidak ada gambar base64 yang perlu diupload.'
          );
        }
  
        /* ======================================================
           VALIDASI SEBELUM FIRESTORE
        ====================================================== */
  
        const invalidQuestions =
          soalProcessed.filter(
            q =>
              !q.teks_soal &&
              (
                q.opsi_jawaban ||
                []
              ).length === 0
          );
  
        if (
          invalidQuestions.length >
          0
        ) {
          addLog(
            `⚠️ ${invalidQuestions.length} soal tidak memiliki teks maupun opsi.`
          );
        }
  
        /* ======================================================
           FIRESTORE
        ====================================================== */
  
        addLog(
          `📝 Menyimpan ${soalProcessed.length} soal ke Firestore...`
        );
  
        try {
          const CHUNK = 400;
  
          let saved = 0;
  
          for (
            let i = 0;
            i <
            soalProcessed.length;
            i += CHUNK
          ) {
            const chunk =
              soalProcessed.slice(
                i,
                i + CHUNK
              );
  
            const batch =
              writeBatch(db);
  
            chunk.forEach(
              q => {
                const ref =
                  doc(
                    collection(
                      db,
                      BANK_SOAL_COLLECTION
                    )
                  );
  
                batch.set(
                  ref,
                  buildDoc(
                    q,
                    meta
                  )
                );
              }
            );
  
            await batch.commit();
  
            saved +=
              chunk.length;
  
            addLog(
              `💾 ${saved}/${soalProcessed.length} soal tersimpan...`
            );
          }
  
          addLog(
            `🎉 Selesai! ${soalProcessed.length} soal berhasil masuk Bank Soal.`
          );
  
          setSaveResult({
            success: true,
            count:
              soalProcessed.length,
          });
        } catch (
          error
        ) {
          console.error(
            'Firestore save error:',
            error
          );
  
          addLog(
            `❌ Gagal simpan ke Firestore: ${
              error?.message ||
              'Unknown error'
            }`
          );
  
          setSaveResult({
            success: false,
            error:
              error?.message ||
              'Gagal menyimpan soal.',
          });
        } finally {
          setSaving(false);
        }
      };
  
    /* ==========================================================
       RENDER
    ========================================================== */
  
    return (
      <div
        style={{
          display: 'flex',
          minHeight:
            '100vh',
          background:
            '#f8fafc',
        }}
      >
        <SidebarAdmin />
  
        <main
          style={{
            flex: 1,
            marginLeft:
              isMobile
                ? 0
                : 260,
            transition:
              'margin-left .3s',
            minHeight:
              '100vh',
          }}
        >
          <div
            className="
              p-4
              sm:p-6
              max-w-6xl
              mx-auto
              space-y-6
            "
          >
            {/* =================================================
                HEADER
            ================================================= */}
  
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-2xl font-bold text-gray-800">
                  Import Hasil Scan AI
                </h1>
  
                <span className="px-2.5 py-1 rounded-full bg-blue-100 text-blue-700 text-xs font-bold">
                  JSON + GAMBAR
                </span>
              </div>
  
              <p className="text-gray-500 text-sm mt-1">
                Import hasil scan dari Gemini,
                ChatGPT, Claude, atau AI lain
                ke Bank Soal Gemilang.
              </p>
  
              <div className="flex flex-wrap gap-2 mt-3 text-xs">
                <span className="px-2.5 py-1 rounded-lg bg-white border border-gray-200 text-gray-600">
                  ✓ Pembahasan
                </span>
  
                <span className="px-2.5 py-1 rounded-lg bg-white border border-gray-200 text-gray-600">
                  ✓ Jawaban benar
                </span>
  
                <span className="px-2.5 py-1 rounded-lg bg-white border border-gray-200 text-gray-600">
                  ✓ Gambar Base64
                </span>
  
                <span className="px-2.5 py-1 rounded-lg bg-white border border-gray-200 text-gray-600">
                  ✓ LaTeX
                </span>
  
                <span className="px-2.5 py-1 rounded-lg bg-white border border-gray-200 text-gray-600">
                  ✓ PG Kompleks
                </span>
              </div>
            </div>
  
            {/* =================================================
                INPUT CARD
            ================================================= */}
  
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 sm:p-5 space-y-4">
              {/* Format */}
              <div className="flex flex-wrap gap-3 items-center">
                <span className="text-sm font-semibold text-gray-600">
                  Format:
                </span>
  
                {[
                  'json',
                  'csv',
                ].map(f => (
                  <button
                    key={f}
                    type="button"
                    onClick={() =>
                      setFormat(f)
                    }
                    className={`
                      px-4
                      py-2
                      rounded-lg
                      text-sm
                      font-bold
                      border
                      transition-all
                      ${
                        format === f
                          ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                          : 'bg-white text-gray-500 border-gray-300 hover:border-blue-400'
                      }
                    `}
                  >
                    {f.toUpperCase()}
  
                    <span className="ml-1.5 text-[10px] font-normal opacity-80">
                      {f ===
                      'json'
                        ? 'gambar + pembahasan'
                        : 'teks'}
                    </span>
                  </button>
                ))}
  
                <div className="w-full sm:w-auto sm:ml-auto flex items-center gap-2">
                  <label className="text-sm text-gray-500">
                    Upload:
                  </label>
  
                  <label className="cursor-pointer px-3 py-2 rounded-lg border border-gray-300 text-sm text-gray-600 hover:border-blue-400 bg-white transition">
                    📂 Pilih file
  
                    <input
                      type="file"
                      accept=".json,.csv"
                      onChange={
                        handleFile
                      }
                      className="hidden"
                    />
                  </label>
                </div>
              </div>
  
              {/* Source */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">
                    Sumber AI
                  </label>
  
                  <input
                    type="text"
                    value={
                      sumberAI
                    }
                    onChange={e =>
                      setSumberAI(
                        e.target.value
                      )
                    }
                    placeholder="Gemini Canvas, ChatGPT, Claude..."
                    className="
                      w-full
                      border
                      border-gray-300
                      rounded-lg
                      px-3
                      py-2
                      text-sm
                      focus:outline-none
                      focus:ring-2
                      focus:ring-blue-500
                    "
                  />
                </div>
  
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">
                    Nama file sumber
                  </label>
  
                  <input
                    type="text"
                    value={
                      sumberFile
                    }
                    onChange={e =>
                      setSumberFile(
                        e.target.value
                      )
                    }
                    placeholder="Contoh: TKA Matematika.pdf"
                    className="
                      w-full
                      border
                      border-gray-300
                      rounded-lg
                      px-3
                      py-2
                      text-sm
                      focus:outline-none
                      focus:ring-2
                      focus:ring-blue-500
                    "
                  />
                </div>
              </div>
  
              {/* Textarea */}
              <div>
                <div className="flex items-center justify-between gap-2 mb-1">
                  <label className="text-xs text-gray-500">
                    Paste {format.toUpperCase()} di sini
                  </label>
  
                  {format ===
                    'json' && (
                    <button
                      type="button"
                      onClick={
                        handleLoadExample
                      }
                      className="text-xs text-blue-600 hover:text-blue-700 font-semibold"
                    >
                      Gunakan contoh JSON
                    </button>
                  )}
                </div>
  
                <textarea
                  rows={14}
                  value={
                    rawInput
                  }
                  onChange={e => {
                    setRawInput(
                      e.target
                        .value
                    );
                    setParseError(
                      ''
                    );
                  }}
                  placeholder={
                    format ===
                    'json'
                      ? contohJSON
                      : 'Nomor,Tipe,Soal,Opsi A,Opsi B,Opsi C,Opsi D,Opsi E,Kunci,Pembahasan'
                  }
                  className="
                    w-full
                    border
                    border-gray-300
                    rounded-xl
                    px-3
                    py-3
                    text-sm
                    font-mono
                    focus:outline-none
                    focus:ring-2
                    focus:ring-blue-500
                    resize-y
                    bg-gray-50
                  "
                />
              </div>
  
              {/* Error */}
              {parseError && (
                <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">
                  <div className="font-bold mb-1">
                    ❌ Gagal membaca data
                  </div>
  
                  <div>
                    {
                      parseError
                    }
                  </div>
                </div>
              )}
  
              {/* Buttons */}
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={
                    handleParse
                  }
                  className="
                    px-6
                    py-2.5
                    bg-blue-600
                    hover:bg-blue-700
                    text-white
                    rounded-xl
                    text-sm
                    font-bold
                    transition
                  "
                >
                  🔍 Parse & Preview
                </button>
  
                <button
                  type="button"
                  onClick={
                    handleReset
                  }
                  disabled={saving}
                  className="
                    px-5
                    py-2.5
                    bg-white
                    hover:bg-gray-50
                    text-gray-600
                    border
                    border-gray-300
                    rounded-xl
                    text-sm
                    font-semibold
                    disabled:opacity-50
                  "
                >
                  ↻ Reset
                </button>
              </div>
            </div>
  
            {/* =================================================
                PREVIEW
            ================================================= */}
  
            {soalList.length >
              0 && (
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 sm:p-5 space-y-5">
                {/* Header Preview */}
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <h2 className="font-bold text-gray-800 text-lg">
                      Preview
                    </h2>
  
                    <p className="text-sm text-gray-500 mt-0.5">
                      {
                        statistik.total
                      }{' '}
                      soal berhasil dibaca.
                    </p>
                  </div>
  
                  <div className="flex flex-wrap gap-2">
                    <span className="px-2.5 py-1.5 rounded-lg bg-blue-50 text-blue-700 text-xs font-semibold">
                      📝{' '}
                      {
                        statistik.total
                      }{' '}
                      soal
                    </span>
  
                    <span className="px-2.5 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 text-xs font-semibold">
                      ✓{' '}
                      {
                        statistik.denganKunci
                      }{' '}
                      ada kunci
                    </span>
  
                    <span className="px-2.5 py-1.5 rounded-lg bg-violet-50 text-violet-700 text-xs font-semibold">
                      📖{' '}
                      {
                        statistik.denganPembahasan
                      }{' '}
                      pembahasan
                    </span>
  
                    <span className="px-2.5 py-1.5 rounded-lg bg-purple-50 text-purple-700 text-xs font-semibold">
                      🖼️{' '}
                      {
                        statistik.denganGambar
                      }{' '}
                      gambar
                    </span>
                  </div>
                </div>
  
                {/* =================================================
                    SOAL LIST
                ================================================= */}
  
                <div className="space-y-4 max-h-[700px] overflow-y-auto pr-1">
                  {soalList
                    .slice(
                      0,
                      50
                    )
                    .map(
                      (
                        q,
                        i
                      ) => {
                        const correctSet =
                          new Set(
                            q.jawaban_benar ||
                              []
                          );
  
                        return (
                          <div
                            key={`${q.nomor}-${i}`}
                            className="
                              border
                              border-gray-200
                              rounded-2xl
                              p-4
                              bg-gray-50
                            "
                          >
                            {/* Badge */}
                            <div className="flex flex-wrap gap-1.5 mb-3">
                              <span className="px-2.5 py-1 bg-blue-100 text-blue-700 text-xs font-bold rounded-full">
                                Soal{' '}
                                {
                                  q.nomor
                                }
                              </span>
  
                              <span
                                className={`
                                  px-2.5
                                  py-1
                                  text-xs
                                  font-bold
                                  rounded-full
                                  ${
                                    q.tipe ===
                                    'pg_sederhana'
                                      ? 'bg-sky-100 text-sky-700'
                                      : q.tipe ===
                                        'pg_kompleks'
                                      ? 'bg-violet-100 text-violet-700'
                                      : q.tipe ===
                                        'benar_salah'
                                      ? 'bg-amber-100 text-amber-700'
                                      : q.tipe ===
                                        'isian_singkat'
                                      ? 'bg-emerald-100 text-emerald-700'
                                      : 'bg-rose-100 text-rose-700'
                                  }
                                `}
                              >
                                {
                                  TIPE_LABELS[
                                    q.tipe
                                  ] ||
                                    q.tipe
                                }
                              </span>
  
                              {q.gambar?.some(
                                g =>
                                  !!getImageSource(
                                    g
                                  )
                              ) && (
                                <span className="px-2.5 py-1 bg-purple-100 text-purple-700 text-xs font-semibold rounded-full">
                                  🖼️ Gambar
                                </span>
                              )}
  
                              {q.pembahasan && (
                                <span className="px-2.5 py-1 bg-indigo-100 text-indigo-700 text-xs font-semibold rounded-full">
                                  📖 Pembahasan
                                </span>
                              )}
  
                              {q.jawaban_benar?.length >
                                0 && (
                                <span className="px-2.5 py-1 bg-emerald-100 text-emerald-700 text-xs font-bold rounded-full font-mono">
                                  ✓ Kunci:{' '}
                                  {q.jawaban_benar.join(
                                    ', '
                                  )}
                                </span>
                              )}
                            </div>
  
                            {/* Soal */}
                            <div className="bg-white rounded-xl border border-gray-100 p-4">
                              <RichText
                                text={
                                  q.teks_soal
                                }
                                gambar={
                                  q.gambar
                                }
                                mathReady={
                                  mathReady
                                }
                              />
                            </div>
  
                            {/* Opsi */}
                            {q.opsi_jawaban
                              ?.length >
                              0 && (
                              <div className="mt-3 space-y-2">
                                {q.opsi_jawaban.map(
                                  (
                                    opt,
                                    oi
                                  ) => {
                                    const letter =
                                      String.fromCharCode(
                                        65 +
                                          oi
                                      );
  
                                    const isCorrect =
                                      correctSet.has(
                                        letter
                                      );
  
                                    return (
                                      <div
                                        key={
                                          oi
                                        }
                                        className={`
                                          flex
                                          items-start
                                          gap-3
                                          rounded-xl
                                          border
                                          p-3
                                          ${
                                            isCorrect
                                              ? 'border-emerald-300 bg-emerald-50'
                                              : 'border-gray-200 bg-white'
                                          }
                                        `}
                                      >
                                        <span
                                          className={`
                                            flex
                                            h-7
                                            w-7
                                            shrink-0
                                            items-center
                                            justify-center
                                            rounded-full
                                            text-xs
                                            font-bold
                                            ${
                                              isCorrect
                                                ? 'bg-emerald-600 text-white'
                                                : 'bg-gray-100 text-gray-600'
                                            }
                                          `}
                                        >
                                          {
                                            letter
                                          }
                                        </span>
  
                                        <div className="flex-1 min-w-0">
                                          {isCorrect && (
                                            <div className="mb-1 text-[10px] font-bold uppercase tracking-wide text-emerald-600">
                                              ✓ JAWABAN BENAR
                                            </div>
                                          )}
  
                                          <RichText
                                            text={
                                              opt
                                            }
                                            gambar={[]}
                                            mathReady={
                                              mathReady
                                            }
                                          />
                                        </div>
                                      </div>
                                    );
                                  }
                                )}
                              </div>
                            )}
  
                            {/* =================================================
                                BENAR SALAH
                            ================================================= */}
  
                            {q.pernyataan
                              ?.length >
                              0 && (
                              <div className="mt-3">
                                <div className="text-xs font-bold text-gray-500 uppercase mb-2">
                                  Pernyataan
                                </div>
  
                                <div className="space-y-2">
                                  {q.pernyataan.map(
                                    (
                                      statement,
                                      si
                                    ) => (
                                      <div
                                        key={
                                          si
                                        }
                                        className="bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm"
                                      >
                                        <span className="font-bold mr-2">
                                          {
                                            si +
                                            1
                                          }.
                                        </span>
  
                                        {
                                          statement
                                        }
                                      </div>
                                    )
                                  )}
                                </div>
                              </div>
                            )}
  
                            {/* =================================================
                                MENJODOHKAN
                            ================================================= */}
  
                            {q.pasangan
                              ?.length >
                              0 && (
                              <div className="mt-3">
                                <div className="text-xs font-bold text-gray-500 uppercase mb-2">
                                  Pasangan
                                </div>
  
                                <div className="space-y-2">
                                  {q.pasangan.map(
                                    (
                                      pair,
                                      pi
                                    ) => (
                                      <div
                                        key={
                                          pi
                                        }
                                        className="grid grid-cols-1 sm:grid-cols-2 gap-2"
                                      >
                                        <div className="bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm">
                                          <span className="font-bold mr-2">
                                            Kiri:
                                          </span>
                                          {
                                            pair.kiri
                                          }
                                        </div>
  
                                        <div className="bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm">
                                          <span className="font-bold mr-2">
                                            Kanan:
                                          </span>
                                          {
                                            pair.kanan
                                          }
                                        </div>
                                      </div>
                                    )
                                  )}
                                </div>
                              </div>
                            )}
  
                            {/* =================================================
                                PEMBAHASAN
                            ================================================= */}
  
                            {q.pembahasan && (
                              <div className="mt-4 border-t border-gray-200 pt-3">
                                <div className="flex items-center gap-2 mb-2">
                                  <span className="text-sm font-bold text-indigo-700">
                                    📖 Pembahasan
                                  </span>
                                </div>
  
                                <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-3">
                                  <RichText
                                    text={
                                      q.pembahasan
                                    }
                                    gambar={[]}
                                    mathReady={
                                      mathReady
                                    }
                                  />
                                </div>
                              </div>
                            )}
  
                            {/* =================================================
                                CATATAN / SUMBER
                            ================================================= */}
  
                            {(q.sumber ||
                              q.catatan) && (
                              <div className="mt-3 text-xs text-gray-500">
                                {q.sumber && (
                                  <div>
                                    <b>
                                      Sumber:
                                    </b>{' '}
                                    {
                                      q.sumber
                                    }
                                  </div>
                                )}
  
                                {q.catatan && (
                                  <div>
                                    <b>
                                      Catatan:
                                    </b>{' '}
                                    {
                                      q.catatan
                                    }
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      }
                    )}
  
                  {soalList.length >
                    50 && (
                    <div className="text-center text-sm text-gray-400 py-3">
                      ...dan{' '}
                      {soalList.length -
                        50}{' '}
                      soal lainnya
                    </div>
                  )}
                </div>
  
                {/* =================================================
                    METADATA
                ================================================= */}
  
                <div className="border-t border-gray-100 pt-5">
                  <h3 className="font-semibold text-gray-700 mb-3 text-sm">
                    Metadata Soal
                  </h3>
  
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {/* Mapel */}
                    <div>
                      <label className="text-xs text-gray-500 mb-1 block">
                        Mata Pelajaran *
                      </label>
  
                      <select
                        value={
                          mataPelajaran
                        }
                        onChange={e =>
                          setMataPelajaran(
                            e.target
                              .value
                          )
                        }
                        className="
                          w-full
                          border
                          border-gray-300
                          rounded-lg
                          px-3
                          py-2
                          text-sm
                          bg-white
                          focus:outline-none
                          focus:ring-2
                          focus:ring-blue-500
                        "
                      >
                        {DAFTAR_MAPEL.map(
                          m => (
                            <option
                              key={m}
                              value={m}
                            >
                              {m}
                            </option>
                          )
                        )}
                      </select>
                    </div>
  
                    {/* Jenjang */}
                    <div>
                      <label className="text-xs text-gray-500 mb-1 block">
                        Jenjang
                      </label>
  
                      <select
                        value={
                          jenjang
                        }
                        onChange={e =>
                          setJenjang(
                            e.target
                              .value
                          )
                        }
                        className="
                          w-full
                          border
                          border-gray-300
                          rounded-lg
                          px-3
                          py-2
                          text-sm
                          bg-white
                          focus:outline-none
                          focus:ring-2
                          focus:ring-blue-500
                        "
                      >
                        {DAFTAR_JENJANG.map(
                          j => (
                            <option
                              key={j}
                              value={j}
                            >
                              {j}
                            </option>
                          )
                        )}
                      </select>
                    </div>
  
                    {/* Kelas */}
                    <div>
                      <label className="text-xs text-gray-500 mb-1 block">
                        Kelas
                      </label>
  
                      <select
                        value={
                          tingkatKelas
                        }
                        onChange={e =>
                          setTingkatKelas(
                            e.target
                              .value
                          )
                        }
                        className="
                          w-full
                          border
                          border-gray-300
                          rounded-lg
                          px-3
                          py-2
                          text-sm
                          bg-white
                          focus:outline-none
                          focus:ring-2
                          focus:ring-blue-500
                        "
                      >
                        {DAFTAR_KELAS.map(
                          k => (
                            <option
                              key={k}
                              value={k}
                            >
                              Kelas {k}
                            </option>
                          )
                        )}
                      </select>
                    </div>
  
                    {/* Kategori */}
                    <div>
                      <label className="text-xs text-gray-500 mb-1 block">
                        Kategori / Bab
                      </label>
  
                      <input
                        type="text"
                        placeholder="Contoh: Fungsi Kuadrat"
                        value={
                          kategori
                        }
                        onChange={e =>
                          setKategori(
                            e.target
                              .value
                          )
                        }
                        className="
                          w-full
                          border
                          border-gray-300
                          rounded-lg
                          px-3
                          py-2
                          text-sm
                          focus:outline-none
                          focus:ring-2
                          focus:ring-blue-500
                        "
                      />
                    </div>
  
                    {/* Kesulitan */}
                    <div>
                      <label className="text-xs text-gray-500 mb-1 block">
                        Tingkat Kesulitan
                      </label>
  
                      <select
                        value={
                          tingkatKesulitan
                        }
                        onChange={e =>
                          setTingkatKesulitan(
                            e.target
                              .value
                          )
                        }
                        className="
                          w-full
                          border
                          border-gray-300
                          rounded-lg
                          px-3
                          py-2
                          text-sm
                          bg-white
                          focus:outline-none
                          focus:ring-2
                          focus:ring-blue-500
                        "
                      >
                        {DAFTAR_KESULITAN.map(
                          k => (
                            <option
                              key={k}
                              value={k}
                            >
                              {k
                                .charAt(
                                  0
                                )
                                .toUpperCase() +
                                k.slice(
                                  1
                                )}
                            </option>
                          )
                        )}
                      </select>
                    </div>
  
                    {/* Tags */}
                    <div>
                      <label className="text-xs text-gray-500 mb-1 block">
                        Tags
                      </label>
  
                      <input
                        type="text"
                        placeholder="UTBK, TKA, Try Out"
                        value={
                          tags
                        }
                        onChange={e =>
                          setTags(
                            e.target
                              .value
                          )
                        }
                        className="
                          w-full
                          border
                          border-gray-300
                          rounded-lg
                          px-3
                          py-2
                          text-sm
                          focus:outline-none
                          focus:ring-2
                          focus:ring-blue-500
                        "
                      />
                    </div>
                  </div>
                </div>
  
                {/* =================================================
                    SAVE LOG
                ================================================= */}
  
                {saveLog.length >
                  0 && (
                  <div className="bg-gray-950 rounded-xl p-4 font-mono text-xs space-y-1 max-h-48 overflow-y-auto">
                    {saveLog.map(
                      (
                        message,
                        index
                      ) => (
                        <div
                          key={
                            index
                          }
                          className={
                            message.startsWith(
                              '❌'
                            )
                              ? 'text-red-400'
                              : message.startsWith(
                                  '⚠️'
                                )
                              ? 'text-yellow-400'
                              : message.startsWith(
                                  'ℹ️'
                                )
                              ? 'text-blue-400'
                              : 'text-green-400'
                          }
                        >
                          {
                            message
                          }
                        </div>
                      )
                    )}
                  </div>
                )}
  
                {/* =================================================
                    RESULT
                ================================================= */}
  
                {saveResult && (
                  <div
                    className={`
                      rounded-xl
                      px-4
                      py-3
                      text-sm
                      font-medium
                      ${
                        saveResult.success
                          ? 'bg-green-50 border border-green-200 text-green-700'
                          : 'bg-red-50 border border-red-200 text-red-700'
                      }
                    `}
                  >
                    {saveResult.success
                      ? `✅ ${saveResult.count} soal berhasil disimpan ke Bank Soal Gemilang!`
                      : `❌ Gagal: ${saveResult.error}`}
                  </div>
                )}
  
                {/* =================================================
                    SAVE BUTTON
                ================================================= */}
  
                {!saveResult?.success && (
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                    <div className="text-xs text-gray-500">
                      <div>
                        Soal:{' '}
                        <b>
                          {
                            statistik.total
                          }
                        </b>
                      </div>
  
                      <div>
                        Gambar:{' '}
                        <b>
                          {
                            statistik.denganGambar
                          }
                        </b>
                      </div>
  
                      <div>
                        Pembahasan:{' '}
                        <b>
                          {
                            statistik.denganPembahasan
                          }
                        </b>
                      </div>
  
                      <div>
                        Kunci:{' '}
                        <b>
                          {
                            statistik.denganKunci
                          }
                        </b>
                      </div>
                    </div>
  
                    <button
                      type="button"
                      onClick={
                        handleSave
                      }
                      disabled={
                        saving ||
                        soalList.length ===
                          0
                      }
                      className="
                        px-7
                        py-3
                        bg-gradient-to-r
                        from-emerald-600
                        to-teal-600
                        hover:from-emerald-500
                        hover:to-teal-500
                        text-white
                        rounded-xl
                        text-sm
                        font-bold
                        flex
                        items-center
                        justify-center
                        gap-2
                        disabled:opacity-50
                        disabled:cursor-not-allowed
                        transition
                        shadow-sm
                      "
                    >
                      {saving
                        ? '⏳ Menyimpan...'
                        : `💾 Simpan ${soalList.length} Soal ke Bank Soal`}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </main>
      </div>
    );
  }