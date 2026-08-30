// src/pages/admin/bank-soal/ImportHasilScanPage.jsx
// ============================================================
// IMPORT HASIL SCAN AI -> BANK SOAL GEMILANG
//
// Support:
// - JSON array
// - { "questions": [...] }
// - { "soal": [...] }
// - { "items": [...] }
// - { "data": [...] }
// - JSON dari AI yang dibungkus ```json ... ```
//
// Data yang didukung:
// - nomor
// - tipe
// - teks_soal / soal
// - opsi_jawaban
// - jawaban / kunci_jawaban
// - jawaban_benar
// - kunci_terverifikasi
// - pembahasan
// - gambar
// - pernyataan
// - tabel_benar_salah
// - pasangan
// - LaTeX
//
// Gambar:
// - dataUrl
// - url
// - uploadedUrl
//
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
   KONSTANTA
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
   TAILWIND CDN
============================================================ */

const useTailwind = () => {
  useEffect(() => {
    if (
      typeof document === 'undefined' ||
      document.querySelector('script[src*="cdn.tailwindcss.com"]')
    ) {
      return;
    }

    const script = document.createElement('script');

    script.src = 'https://cdn.tailwindcss.com';
    script.async = true;

    document.head.insertBefore(
      script,
      document.head.firstChild
    );

    return () => {
      // Jangan hapus script karena mungkin dipakai halaman lain.
    };
  }, []);
};

/* ============================================================
   KATEX
============================================================ */

const useKaTeX = () => {
  const [ready, setReady] = useState(
    typeof window !== 'undefined' &&
      Boolean(window.katex)
  );

  useEffect(() => {
    if (typeof window === 'undefined') return;

    if (window.katex) {
      setReady(true);
      return;
    }

    const existingCss = document.querySelector(
      'link[data-gemilang-katex="true"]'
    );

    if (!existingCss) {
      const css = document.createElement('link');

      css.rel = 'stylesheet';
      css.href =
        'https://cdnjs.cloudflare.com/ajax/libs/KaTeX/0.16.9/katex.min.css';

      css.dataset.gemilangKatex = 'true';

      document.head.appendChild(css);
    }

    const existingScript = document.querySelector(
      'script[data-gemilang-katex="true"]'
    );

    if (existingScript) {
      existingScript.addEventListener(
        'load',
        () => setReady(true)
      );

      return;
    }

    const script = document.createElement('script');

    script.src =
      'https://cdnjs.cloudflare.com/ajax/libs/KaTeX/0.16.9/katex.min.js';

    script.async = true;
    script.dataset.gemilangKatex = 'true';

    script.onload = () => {
      setReady(Boolean(window.katex));
    };

    script.onerror = () => {
      setReady(false);
    };

    document.body.appendChild(script);
  }, []);

  return ready;
};

/* ============================================================
   HTML ESCAPE
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
   NORMALIZE LATEX
============================================================ */

/*
  Jangan mengubah backslash LaTeX.

  Contoh:
  \frac{5\times10^{-6}}{(100)^{-3}}

  harus tetap menjadi string LaTeX.
*/

function cleanText(value) {
  if (value === null || value === undefined) {
    return '';
  }

  if (typeof value === 'string') {
    return value
      .replace(/\r\n/g, '\n')
      .replace(/\r/g, '\n')
      .trim();
  }

  return String(value).trim();
}

/* ============================================================
   FIND INLINE MATH END
============================================================ */

function findInlineEnd(text, start, close) {
  for (let i = start; i < text.length; i += 1) {
    if (text[i] === '\n') {
      return -1;
    }

    if (text.startsWith(close, i)) {
      return i;
    }

    if (text[i] === '\\') {
      i += 1;
    }
  }

  return -1;
}

/* ============================================================
   RENDER TEXT + LATEX
============================================================ */

function processSegment(text, renderMath) {
  let result = '';
  let i = 0;

  while (i < text.length) {
    /* $$ ... $$ */
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

    /* $ ... $ */
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

    /* \[ ... \] */
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

    /* \( ... \) */
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

    if (ch === '\n') {
      result += '<br />';
    } else {
      result += escapeHtml(ch);
    }

    i += 1;
  }

  return result;
}

/* ============================================================
   IMAGE SRC
============================================================ */

function getImageSrc(gambar) {
  if (!gambar || typeof gambar !== 'object') {
    return null;
  }

  return (
    gambar.uploadedUrl ||
    gambar.url ||
    gambar.dataUrl ||
    null
  );
}

/* ============================================================
   RICH TEXT
============================================================ */

function RichText({
  text,
  gambar = [],
  mathReady = false,
}) {
  const html = useMemo(() => {
    const safe = cleanText(text);

    if (!safe) {
      return '';
    }

    const imgs = Array.isArray(gambar)
      ? gambar.filter(Boolean)
      : [];

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
      const source = cleanText(math);

      if (!source) {
        return '';
      }

      if (!katexLib) {
        return display
          ? `<span>${escapeHtml(
              `$$${source}$$`
            )}</span>`
          : `<span>${escapeHtml(
              `$${source}$`
            )}</span>`;
      }

      try {
        return katexLib.renderToString(
          source,
          {
            displayMode: display,
            throwOnError: false,
            output: 'html',
          }
        );
      } catch {
        return display
          ? `<span>${escapeHtml(
              `$$${source}$$`
            )}</span>`
          : `<span>${escapeHtml(
              `$${source}$`
            )}</span>`;
      }
    };

    const makeImg = (g) => {
      const src = getImageSrc(g);

      if (!src) {
        return `
          <span
            style="
              color:#d97706;
              font-size:11px;
              display:inline-block;
              margin:4px 0;
            "
          >
            [Gambar belum tersedia]
          </span>
        `;
      }

      const alt = escapeHtml(
        g.deskripsi ||
          g.description ||
          'Gambar soal'
      );

      return `
        <figure
          style="
            margin:10px 0;
            text-align:center;
          "
        >
          <img
            src="${escapeHtml(src)}"
            alt="${alt}"
            style="
              max-width:100%;
              max-height:420px;
              width:auto;
              height:auto;
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
                <figcaption
                  style="
                    font-size:11px;
                    color:#6b7280;
                    margin-top:4px;
                  "
                >
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
      Placeholder:
      {{GAMBAR}}
      {{GAMBAR_1}}
      {{GAMBAR_2}}
    */

    const parts = safe.split(
      /(\{\{\s*GAMBAR(?:_\d+)?\s*\}\})/gi
    );

    let imageIndex = 0;
    let result = '';

    for (const part of parts) {
      if (
        /^\{\{\s*GAMBAR/i.test(
          part
        )
      ) {
        result += makeImg(
          imgs[imageIndex] || {}
        );

        imageIndex += 1;
      } else {
        result += processSegment(
          part,
          renderMath
        );
      }
    }

    /*
      Kalau JSON memiliki gambar tetapi teks tidak
      mempunyai placeholder {{GAMBAR}}, tetap tampilkan.
    */

    if (
      imageIndex === 0 &&
      imgs.some(
        (g) => Boolean(getImageSrc(g))
      )
    ) {
      imgs.forEach((g) => {
        result += makeImg(g);
      });
    }

    return result;
  }, [
    text,
    gambar,
    mathReady,
  ]);

  if (!html) {
    return (
      <span className="text-gray-400">
        Tidak ada teks
      </span>
    );
  }

  return (
    <div
      className="text-sm text-gray-700 leading-7 break-words"
      dangerouslySetInnerHTML={{
        __html: html,
      }}
    />
  );
}

/* ============================================================
   PARSER JSON YANG TAHAN FORMAT AI
============================================================ */

function removeCodeFence(text) {
  return String(text || '')
    .trim()
    .replace(/^```json\s*/i, '')
    .replace(/^```javascript\s*/i, '')
    .replace(/^```js\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();
}

/*
  Kadang AI menambahkan teks sebelum JSON.

  Contoh:
  Berikut JSON hasil scan:

  [
    ...
  ]

  Fungsi ini mencoba mengambil bagian array/object
  paling luar.
*/

function extractJsonBlock(text) {
  const cleaned = removeCodeFence(text);

  if (!cleaned) {
    return '';
  }

  if (
    cleaned.startsWith('[') ||
    cleaned.startsWith('{')
  ) {
    return cleaned;
  }

  const firstArray =
    cleaned.indexOf('[');

  const firstObject =
    cleaned.indexOf('{');

  let start = -1;

  if (
    firstArray !== -1 &&
    firstObject !== -1
  ) {
    start = Math.min(
      firstArray,
      firstObject
    );
  } else {
    start =
      firstArray !== -1
        ? firstArray
        : firstObject;
  }

  if (start === -1) {
    return cleaned;
  }

  const lastArray =
    cleaned.lastIndexOf(']');

  const lastObject =
    cleaned.lastIndexOf('}');

  const end = Math.max(
    lastArray,
    lastObject
  );

  if (end === -1) {
    return cleaned;
  }

  return cleaned.slice(
    start,
    end + 1
  );
}

/* ============================================================
   EXTRACT ARRAY DARI OBJECT
============================================================ */

function getQuestionArray(parsed) {
  if (Array.isArray(parsed)) {
    return parsed;
  }

  if (
    parsed &&
    typeof parsed === 'object'
  ) {
    const possibleKeys = [
      'questions',
      'soal',
      'soals',
      'items',
      'data',
      'results',
      'hasil',
      'question',
    ];

    for (const key of possibleKeys) {
      if (
        Array.isArray(parsed[key])
      ) {
        return parsed[key];
      }
    }
  }

  return null;
}

/* ============================================================
   PARSER JSON
============================================================ */

function parseJSON(raw) {
  const text = String(raw || '').trim();

  if (!text) {
    throw new Error(
      'Input JSON kosong.'
    );
  }

  const jsonText =
    extractJsonBlock(text);

  let parsed;

  try {
    parsed = JSON.parse(
      jsonText
    );
  } catch (error) {
    const positionMatch =
      error.message.match(
        /position\s+(\d+)/i
      );

    const position =
      positionMatch
        ? Number(positionMatch[1])
        : null;

    if (
      position !== null
    ) {
      const previewStart =
        Math.max(
          0,
          position - 100
        );

      const previewEnd =
        Math.min(
          jsonText.length,
          position + 100
        );

      const around =
        jsonText.slice(
          previewStart,
          previewEnd
        );

      throw new Error(
        `JSON tidak valid di sekitar karakter ${position}. Periksa tanda kutip, koma, atau karakter aneh. Bagian terdeteksi: ${around}`
      );
    }

    throw new Error(
      `JSON tidak valid: ${error.message}`
    );
  }

  const questions =
    getQuestionArray(parsed);

  if (!questions) {
    throw new Error(
      'Format JSON tidak dikenali. Gunakan array soal atau object dengan salah satu field: questions, soal, items, data, results, atau hasil.'
    );
  }

  if (
    questions.length === 0
  ) {
    throw new Error(
      'JSON berhasil dibaca tetapi tidak ada soal.'
    );
  }

  return questions;
}

/* ============================================================
   CSV PARSER
============================================================ */

function parseCSVLine(line) {
  const columns = [];

  let current = '';
  let inQuotes = false;

  for (
    let i = 0;
    i < line.length;
    i += 1
  ) {
    const char = line[i];

    if (char === '"') {
      if (
        inQuotes &&
        line[i + 1] === '"'
      ) {
        current += '"';
        i += 1;
      } else {
        inQuotes =
          !inQuotes;
      }
    } else if (
      char === ',' &&
      !inQuotes
    ) {
      columns.push(
        current
      );

      current = '';
    } else {
      current += char;
    }
  }

  columns.push(current);

  return columns;
}

function parseCSV(raw) {
  const lines = String(raw || '')
    .split(/\r?\n/)
    .filter(
      (line) => line.trim()
    );

  if (lines.length < 2) {
    throw new Error(
      'CSV kosong atau hanya berisi header.'
    );
  }

  const header =
    parseCSVLine(lines[0])
      .map((h) =>
        h
          .replace(/^"|"$/g, '')
          .trim()
          .toLowerCase()
      );

  const results = [];

  for (
    let i = 1;
    i < lines.length;
    i += 1
  ) {
    const columns =
      parseCSVLine(lines[i]);

    const get = (key) => {
      const index =
        header.indexOf(key);

      if (index < 0) {
        return '';
      }

      return (
        columns[index] || ''
      ).trim();
    };

    const opsiJawaban = [
      'opsi a',
      'opsi b',
      'opsi c',
      'opsi d',
      'opsi e',
    ]
      .map((key) => get(key))
      .filter(Boolean);

    results.push({
      nomor:
        parseInt(
          get('nomor'),
          10
        ) || i,

      tipe:
        get('tipe') ||
        'pg_sederhana',

      teks_soal:
        get('soal'),

      opsi_jawaban:
        opsiJawaban,

      pernyataan:
        get('pernyataan')
          ? get(
              'pernyataan'
            )
              .split(' | ')
              .filter(Boolean)
          : [],

      tabel_benar_salah:
        get('tabel benar-salah')
          ? get(
              'tabel benar-salah'
            )
              .split(' | ')
              .filter(Boolean)
          : [],

      pasangan: [],

      kunci_jawaban:
        get('kunci') ||
        get('jawaban'),

      jawaban_benar:
        get('kunci') ||
        get('jawaban'),

      kunci_terverifikasi:
        true,

      pembahasan:
        get('pembahasan'),

      gambar: [],
    });
  }

  if (
    results.length === 0
  ) {
    throw new Error(
      'Tidak ada baris soal dalam CSV.'
    );
  }

  return results;
}

/* ============================================================
   NORMALIZE OPTIONS
============================================================ */

function normalizeOptions(
  options
) {
  if (!Array.isArray(options)) {
    return [];
  }

  return options
    .map((option) => {
      if (
        typeof option ===
        'string'
      ) {
        return cleanText(
          option
        );
      }

      if (
        option &&
        typeof option ===
          'object'
      ) {
        return cleanText(
          option.text ??
            option.teks ??
            option.value ??
            option.jawaban ??
            option.label ??
            ''
        );
      }

      return '';
    })
    .filter(Boolean);
}

/* ============================================================
   NORMALIZE GAMBAR
============================================================ */

function normalizeImages(
  gambar
) {
  if (!Array.isArray(gambar)) {
    return [];
  }

  return gambar
    .map((g, index) => {
      if (
        typeof g ===
        'string'
      ) {
        return {
          id:
            `GAMBAR_${index + 1}`,

          deskripsi:
            '',

          dataUrl:
            g.startsWith(
              'data:image'
            )
              ? g
              : null,

          url:
            g.startsWith(
              'http'
            )
              ? g
              : null,

          uploadedUrl:
            null,
        };
      }

      if (
        !g ||
        typeof g !==
          'object'
      ) {
        return null;
      }

      return {
        id:
          g.id ||
          g.nama ||
          `GAMBAR_${index + 1}`,

        deskripsi:
          cleanText(
            g.deskripsi ??
              g.description ??
              g.keterangan ??
              ''
          ),

        dataUrl:
          g.dataUrl ||
          g.data_url ||
          null,

        url:
          g.url ||
          g.imageUrl ||
          g.image_url ||
          null,

        uploadedUrl:
          g.uploadedUrl ||
          g.uploaded_url ||
          null,

        sourcePage:
          g.sourcePage ??
          g.source_page ??
          null,

        metode:
          g.metode ||
          null,
      };
    })
    .filter(Boolean);
}

/* ============================================================
   NORMALIZE SOAL
============================================================ */

function normalizeSoal(
  q,
  idx
) {
  if (
    !q ||
    typeof q !==
      'object'
  ) {
    return {
      nomor: idx + 1,
      tipe:
        'pg_sederhana',
      teks_soal: '',
      opsi_jawaban: [],
      pernyataan: [],
      tabel_benar_salah: [],
      pasangan: [],
      kunci_jawaban: '',
      jawaban_benar: '',
      kunci_terverifikasi:
        false,
      pembahasan: '',
      gambar: [],
    };
  }

  const rawKey =
    q.kunci_jawaban ??
    q.kunciJawaban ??
    q.kunci ??
    q.jawaban ??
    q.answer ??
    q.jawaban_benar ??
    q.jawabanBenar ??
    '';

  let jawabanBenar = '';

  if (
    Array.isArray(
      rawKey
    )
  ) {
    jawabanBenar =
      rawKey
        .map((item) =>
          cleanText(item)
        )
        .filter(Boolean)
        .join(',');
  } else {
    jawabanBenar =
      cleanText(
        rawKey
      );
  }

  const tipe =
    cleanText(
      q.tipe ??
        q.type ??
        q.jenis ??
        'pg_sederhana'
    ) ||
    'pg_sederhana';

  const soal =
    cleanText(
      q.teks_soal ??
        q.teksSoal ??
        q.soal ??
        q.question ??
        ''
    );

  const pembahasan =
    cleanText(
      q.pembahasan ??
        q.penjelasan ??
        q.explanation ??
        q.solusi ??
        ''
    );

  const options =
    normalizeOptions(
      q.opsi_jawaban ??
        q.opsiJawaban ??
        q.options ??
        q.pilihan ??
        []
    );

  const pernyataan =
    Array.isArray(
      q.pernyataan
    )
      ? q.pernyataan
          .map(cleanText)
          .filter(Boolean)
      : [];

  const tabelBenarSalah =
    Array.isArray(
      q.tabel_benar_salah
    )
      ? q.tabel_benar_salah
          .map(cleanText)
          .filter(Boolean)
      : Array.isArray(
          q.tabelBenarSalah
        )
        ? q.tabelBenarSalah
            .map(cleanText)
            .filter(Boolean)
        : [];

  const pasangan =
    Array.isArray(
      q.pasangan
    )
      ? q.pasangan
          .map((p) => ({
            kiri: cleanText(
              p?.kiri ??
                p?.left ??
                ''
            ),

            kanan: cleanText(
              p?.kanan ??
                p?.right ??
                ''
            ),
          }))
          .filter(
            (p) =>
              p.kiri ||
              p.kanan
          )
      : [];

  const gambar =
    normalizeImages(
      q.gambar ??
        q.images ??
        q.gambars ??
        []
    );

  let nomor =
    q.nomor ??
    q.number ??
    q.no ??
    idx + 1;

  if (
    typeof nomor !==
    'number'
  ) {
    nomor =
      parseInt(
        nomor,
        10
      ) ||
      idx + 1;
  }

  const verified =
    Boolean(
      q.kunci_terverifikasi ??
        q.kunciTerverifikasi ??
        q.jawabanTerverifikasi ??
        q.answerVerified ??
        false
    );

  return {
    nomor,

    tipe,

    teks_soal:
      soal,

    opsi_jawaban:
      options,

    pernyataan,

    tabel_benar_salah:
      tabelBenarSalah,

    pasangan,

    kunci_jawaban:
      jawabanBenar,

    jawaban_benar:
      jawabanBenar,

    kunci_terverifikasi:
      verified,

    pembahasan,

    gambar,
  };
}

/* ============================================================
   VALIDASI SOAL
============================================================ */

function validateQuestion(
  q
) {
  const errors = [];

  if (
    !q.teks_soal
  ) {
    errors.push(
      'teks soal kosong'
    );
  }

  if (
    q.tipe ===
      'pg_sederhana' ||
    q.tipe ===
      'pg_kompleks'
  ) {
    if (
      q.opsi_jawaban
        .length === 0
    ) {
      errors.push(
        'opsi jawaban kosong'
      );
    }

    if (
      !q.kunci_jawaban
    ) {
      errors.push(
        'kunci jawaban kosong'
      );
    }
  }

  return errors;
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
        (g) =>
          g.uploadedUrl ||
          g.url ||
          null
      )
      .filter(Boolean);

  return {
    nomor:
      q.nomor,

    soal:
      q.teks_soal,

    teksSoal:
      q.teks_soal,

    tipe:
      q.tipe,

    opsiJawaban:
      q.opsi_jawaban,

    opsi_jawaban:
      q.opsi_jawaban,

    pernyataan:
      q.pernyataan,

    tabelBenarSalah:
      q.tabel_benar_salah,

    tabel_benar_salah:
      q.tabel_benar_salah,

    pasangan:
      q.pasangan,

    kunciJawaban:
      q.kunci_jawaban,

    kunci_jawaban:
      q.kunci_jawaban,

    jawabanBenar:
      q.jawaban_benar,

    jawaban_benar:
      q.jawaban_benar,

    kunciTerverifikasi:
      q.kunci_terverifikasi,

    kunci_terverifikasi:
      q.kunci_terverifikasi,

    pembahasan:
      q.pembahasan,

    gambar:
      q.gambar.map(
        (g) => ({
          ...g,

          /*
            Setelah upload:
            dataUrl dihapus supaya Firestore
            tidak menyimpan base64 besar.
          */
          dataUrl:
            null,
        })
      ),

    gambarUrls,

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
   COMPONENT
============================================================ */

export default function ImportHasilScanPage() {
  useTailwind();

  const mathReady =
    useKaTeX();

  const [
    isMobile,
    setIsMobile,
  ] = useState(
    typeof window !==
      'undefined'
      ? window.innerWidth <
          1024
      : false
  );

  useEffect(() => {
    const handleResize =
      () => {
        setIsMobile(
          window.innerWidth <
            1024
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

  const [
    format,
    setFormat,
  ] = useState('json');

  const [
    rawInput,
    setRawInput,
  ] = useState('');

  const [
    sumberAI,
    setSumberAI,
  ] = useState(
    'Gemini Canvas'
  );

  /* ==========================================================
     PARSE
  ========================================================== */

  const [
    soalList,
    setSoalList,
  ] = useState([]);

  const [
    parseError,
    setParseError,
  ] = useState('');

  /* ==========================================================
     METADATA
  ========================================================== */

  const [
    mataPelajaran,
    setMataPelajaran,
  ] = useState(
    'Matematika'
  );

  const [
    tingkatKelas,
    setTingkatKelas,
  ] = useState('10');

  const [
    jenjang,
    setJenjang,
  ] = useState(
    'SMA/MA'
  );

  const [
    kategori,
    setKategori,
  ] = useState('');

  const [
    tags,
    setTags,
  ] = useState('');

  const [
    tingkatKesulitan,
    setTingkatKesulitan,
  ] = useState(
    'sedang'
  );

  const [
    sumberFile,
    setSumberFile,
  ] = useState('');

  /* ==========================================================
     SAVE
  ========================================================== */

  const [
    saving,
    setSaving,
  ] = useState(false);

  const [
    saveResult,
    setSaveResult,
  ] = useState(null);

  const [
    saveLog,
    setSaveLog,
  ] = useState([]);

  /* ==========================================================
     STATS
  ========================================================== */

  const stats =
    useMemo(() => {
      const total =
        soalList.length;

      const withImages =
        soalList.filter(
          (q) =>
            Array.isArray(
              q.gambar
            ) &&
            q.gambar.some(
              (g) =>
                Boolean(
                  getImageSrc(g)
                )
            )
        ).length;

      const withDiscussion =
        soalList.filter(
          (q) =>
            Boolean(
              q.pembahasan
            )
        ).length;

      const withAnswer =
        soalList.filter(
          (q) =>
            Boolean(
              q.kunci_jawaban
            )
        ).length;

      const invalid =
        soalList.filter(
          (q) =>
            validateQuestion(q)
              .length > 0
        ).length;

      return {
        total,
        withImages,
        withDiscussion,
        withAnswer,
        invalid,
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
          'Input kosong. Silakan paste JSON terlebih dahulu.'
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
          raw.map(
            (q, index) =>
              normalizeSoal(
                q,
                index
              )
          );

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

    if (!file) {
      return;
    }

    const lowerName =
      file.name.toLowerCase();

    if (
      lowerName.endsWith(
        '.json'
      )
    ) {
      setFormat('json');
    } else if (
      lowerName.endsWith(
        '.csv'
      )
    ) {
      setFormat('csv');
    }

    const reader =
      new FileReader();

    reader.onload = (
      e
    ) => {
      setRawInput(
        e.target?.result ||
          ''
      );
    };

    reader.onerror = () => {
      setParseError(
        'File gagal dibaca.'
      );
    };

    reader.readAsText(
      file,
      'UTF-8'
    );

    setSumberFile(
      file.name
    );
  };

  /* ==========================================================
     CLEAR
  ========================================================== */

  const handleClear = () => {
    setRawInput('');
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

      setSaving(true);
      setSaveResult(null);
      setSaveLog([]);

      const log = [];

      const addLog = (
        message
      ) => {
        log.push(message);
        setSaveLog([
          ...log,
        ]);
      };

      /* ------------------------------------------------------
         VALIDASI
      ------------------------------------------------------ */

      const invalidQuestions =
        soalList
          .map(
            (q, index) => ({
              index,
              nomor:
                q.nomor,
              errors:
                validateQuestion(
                  q
                ),
            })
          )
          .filter(
            (item) =>
              item.errors
                .length > 0
          );

      if (
        invalidQuestions.length >
        0
      ) {
        addLog(
          `⚠️ ${invalidQuestions.length} soal memiliki data yang belum lengkap.`
        );

        invalidQuestions
          .slice(0, 10)
          .forEach(
            (item) => {
              addLog(
                `Soal ${item.nomor}: ${item.errors.join(', ')}`
              );
            }
          );

        addLog(
          '⛔ Penyimpanan dihentikan. Perbaiki soal yang ditandai terlebih dahulu.'
        );

        setSaveResult({
          success: false,
          error:
            `${invalidQuestions.length} soal tidak valid.`,
        });

        setSaving(false);

        return;
      }

      const meta = {
        mataPelajaran,

        tingkatKelas,

        jenjang,

        kategori,

        tags: tags
          .split(',')
          .map(
            (tag) =>
              tag.trim()
          )
          .filter(Boolean),

        tingkatKesulitan,

        sumberFile,

        sumberAI,
      };

      /* ------------------------------------------------------
         CLONE SOAL
      ------------------------------------------------------ */

      const soalProcessed =
        soalList.map(
          (q) => ({
            ...q,

            gambar:
              Array.isArray(
                q.gambar
              )
                ? q.gambar.map(
                    (g) => ({
                      ...g,
                    })
                  )
                : [],
          })
        );

      /* ------------------------------------------------------
         KUMPULKAN GAMBAR BASE64
      ------------------------------------------------------ */

      const toUpload = [];

      soalProcessed.forEach(
        (
          q,
          questionIndex
        ) => {
          (
            q.gambar || []
          ).forEach(
            (
              g,
              imageIndex
            ) => {
              if (
                typeof g.dataUrl ===
                  'string' &&
                g.dataUrl.startsWith(
                  'data:image'
                )
              ) {
                toUpload.push({
                  key:
                    `q${questionIndex}-g${imageIndex}-${Date.now()}-${Math.random()
                      .toString(36)
                      .slice(2, 8)}`,

                  dataUrl:
                    g.dataUrl,

                  questionIndex,

                  imageIndex,
                });
              }
            }
          );
        }
      );

      /* ------------------------------------------------------
         UPLOAD GAMBAR
      ------------------------------------------------------ */

      if (
        toUpload.length >
        0
      ) {
        addLog(
          `⏳ Mengupload ${toUpload.length} gambar ke Supabase...`
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
                        (
                          item
                        ) => ({
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

          const urlMap =
            {};

          (
            result.uploaded ||
            []
          ).forEach(
            (item) => {
              if (
                item?.key &&
                item?.url
              ) {
                urlMap[
                  item.key
                ] =
                  item.url;
              }
            }
          );

          let uploadedCount =
            0;

          toUpload.forEach(
            (
              item
            ) => {
              const url =
                urlMap[
                  item.key
                ];

              if (!url) {
                return;
              }

              const question =
                soalProcessed[
                  item.questionIndex
                ];

              if (!question) {
                return;
              }

              const gambar =
                [
                  ...(
                    question.gambar ||
                    []
                  ),
                ];

              if (
                !gambar[
                  item.imageIndex
                ]
              ) {
                return;
              }

              gambar[
                item.imageIndex
              ] = {
                ...gambar[
                  item.imageIndex
                ],

                uploadedUrl:
                  url,

                dataUrl:
                  null,
              };

              soalProcessed[
                item.questionIndex
              ] = {
                ...question,

                gambar,
              };

              uploadedCount +=
                1;
            }
          );

          addLog(
            `✅ ${uploadedCount}/${toUpload.length} gambar berhasil diupload.`
          );

          const errors =
            result.errors ||
            [];

          if (
            errors.length >
            0
          ) {
            addLog(
              `⚠️ ${errors.length} gambar gagal diupload.`
            );
          }
        } catch (error) {
          addLog(
            `❌ Upload gambar gagal: ${error.message}`
          );

          /*
            Jangan langsung menghapus gambar.

            Jika upload gagal, proses tetap dihentikan
            supaya soal tidak tersimpan tanpa gambar.
          */

          addLog(
            '⛔ Penyimpanan dihentikan agar gambar tidak hilang.'
          );

          setSaveResult({
            success: false,
            error:
              `Upload gambar gagal: ${error.message}`,
          });

          setSaving(false);

          return;
        }
      }

      /* ------------------------------------------------------
         PASTIKAN GAMBAR BASE64 SUDAH TIDAK TERSISA
      ------------------------------------------------------ */

      const stillBase64 =
        soalProcessed.some(
          (q) =>
            (
              q.gambar ||
              []
            ).some(
              (g) =>
                typeof g.dataUrl ===
                  'string' &&
                g.dataUrl.startsWith(
                  'data:image'
                )
            )
        );

      if (
        stillBase64
      ) {
        addLog(
          '⛔ Masih ada gambar base64 yang belum berhasil diupload.'
        );

        setSaveResult({
          success: false,
          error:
            'Sebagian gambar belum berhasil diupload.',
        });

        setSaving(false);

        return;
      }

      /* ------------------------------------------------------
         FIRESTORE
      ------------------------------------------------------ */

      addLog(
        `📝 Menyimpan ${soalProcessed.length} soal ke Firestore...`
      );

      try {
        const CHUNK =
          400;

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
            (q) => {
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
            `💾 ${saved}/${soalProcessed.length} soal tersimpan.`
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
      } catch (error) {
        console.error(
          'Firestore save error:',
          error
        );

        addLog(
          `❌ Gagal menyimpan ke Firestore: ${error.message}`
        );

        setSaveResult({
          success: false,

          error:
            error.message,
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
        display:
          'flex',

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
        <div className="p-4 sm:p-6 max-w-6xl mx-auto space-y-6">

          {/* ==================================================
              HEADER
          ================================================== */}

          <div>
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-blue-600 text-white flex items-center justify-center text-xl">
                📥
              </div>

              <div>
                <h1 className="text-2xl font-bold text-gray-800">
                  Import Hasil Scan AI
                </h1>

                <p className="text-gray-500 text-sm mt-1">
                  Import soal, jawaban, pembahasan, LaTeX, dan gambar ke Bank Soal Gemilang.
                </p>
              </div>
            </div>
          </div>

          {/* ==================================================
              INPUT CARD
          ================================================== */}

          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 space-y-5">

            {/* FORMAT */}

            <div className="flex flex-wrap gap-3 items-center">
              <span className="text-sm font-semibold text-gray-600">
                Format:
              </span>

              {[
                'json',
                'csv',
              ].map(
                (item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() =>
                      setFormat(
                        item
                      )
                    }
                    className={`px-4 py-2 rounded-lg text-sm font-bold border transition ${
                      format ===
                      item
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-white text-gray-500 border-gray-300 hover:border-blue-400'
                    }`}
                  >
                    {item.toUpperCase()}

                    {item ===
                      'json' && (
                      <span className="ml-2 text-[10px] font-normal opacity-80">
                        Soal + gambar
                      </span>
                    )}

                    {item ===
                      'csv' && (
                      <span className="ml-2 text-[10px] font-normal opacity-80">
                        Teks
                      </span>
                    )}
                  </button>
                )
              )}

              <div className="ml-auto">
                <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 text-sm font-medium text-gray-600 hover:border-blue-400 bg-white">
                  📂 Pilih File

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

            {/* SOURCE */}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

              <div>
                <label className="text-xs text-gray-500 mb-1 block">
                  Sumber AI
                </label>

                <input
                  type="text"
                  value={
                    sumberAI
                  }
                  onChange={(
                    e
                  ) =>
                    setSumberAI(
                      e.target
                        .value
                    )
                  }
                  placeholder="Gemini Canvas / ChatGPT / Claude"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                  onChange={(
                    e
                  ) =>
                    setSumberFile(
                      e.target
                        .value
                    )
                  }
                  placeholder="Contoh: TKA Matematika.pdf"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

            </div>

            {/* TEXTAREA */}

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-xs text-gray-500">
                  Paste {format.toUpperCase()} di sini
                </label>

                {rawInput && (
                  <button
                    type="button"
                    onClick={
                      handleClear
                    }
                    className="text-xs text-red-500 hover:text-red-700"
                  >
                    Hapus
                  </button>
                )}
              </div>

              <textarea
                rows={14}
                value={
                  rawInput
                }
                onChange={(
                  e
                ) =>
                  setRawInput(
                    e.target
                      .value
                  )
                }
                spellCheck={
                  false
                }
                placeholder={
                  format ===
                  'json'
                    ? `[
  {
    "nomor": 1,
    "tipe": "pg_sederhana",
    "teks_soal": "Nilai $2^3$ adalah ...",
    "opsi_jawaban": [
      "6",
      "8",
      "9",
      "12"
    ],
    "kunci_jawaban": "B",
    "jawaban_benar": "B",
    "kunci_terverifikasi": true,
    "pembahasan": "Karena 2^3 = 8.",
    "gambar": []
  }
]`
                    : `Nomor,Tipe,Soal,Opsi A,Opsi B,Opsi C,Opsi D,Opsi E,Kunci,Pembahasan`
                }
                className="w-full border border-gray-300 rounded-xl px-3 py-3 text-sm font-mono leading-6 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y bg-gray-50"
              />

              <p className="text-[11px] text-gray-400 mt-2">
                JSON lebih disarankan karena dapat membawa gambar, pembahasan, LaTeX, dan struktur soal lengkap.
              </p>
            </div>

            {/* ERROR */}

            {parseError && (
              <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">
                <div className="font-bold mb-1">
                  ❌ Gagal membaca data
                </div>

                <div className="whitespace-pre-wrap break-words">
                  {
                    parseError
                  }
                </div>
              </div>
            )}

            {/* BUTTON */}

            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={
                  handleParse
                }
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold shadow-sm"
              >
                🔍 Parse & Preview
              </button>

              {rawInput && (
                <button
                  type="button"
                  onClick={
                    handleClear
                  }
                  className="px-5 py-3 bg-white hover:bg-gray-50 text-gray-600 border border-gray-300 rounded-xl text-sm font-semibold"
                >
                  Bersihkan
                </button>
              )}
            </div>
          </div>

          {/* ==================================================
              PREVIEW
          ================================================== */}

          {soalList.length >
            0 && (
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 space-y-5">

              {/* STATS */}

              <div className="flex flex-wrap items-center justify-between gap-4">

                <div>
                  <h2 className="font-bold text-gray-800 text-lg">
                    Preview Hasil Scan
                  </h2>

                  <p className="text-sm text-gray-500">
                    {stats.total}{' '}
                    soal berhasil dibaca.
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">

                  <span className="px-3 py-1.5 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold">
                    📝{' '}
                    {stats.total}{' '}
                    soal
                  </span>

                  <span className="px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold">
                    ✓{' '}
                    {stats.withAnswer}{' '}
                    kunci
                  </span>

                  <span className="px-3 py-1.5 rounded-full bg-purple-50 text-purple-700 text-xs font-semibold">
                    🖼️{' '}
                    {stats.withImages}{' '}
                    gambar
                  </span>

                  <span className="px-3 py-1.5 rounded-full bg-amber-50 text-amber-700 text-xs font-semibold">
                    💡{' '}
                    {stats.withDiscussion}{' '}
                    pembahasan
                  </span>

                  {stats.invalid >
                    0 && (
                    <span className="px-3 py-1.5 rounded-full bg-red-50 text-red-700 text-xs font-semibold">
                      ⚠️{' '}
                      {stats.invalid}{' '}
                      bermasalah
                    </span>
                  )}

                </div>
              </div>

              {/* QUESTION LIST */}

              <div className="space-y-4 max-h-[650px] overflow-y-auto pr-1">

                {soalList
                  .slice(
                    0,
                    50
                  )
                  .map(
                    (
                      q,
                      index
                    ) => {
                      const errors =
                        validateQuestion(
                          q
                        );

                      return (
                        <div
                          key={`${q.nomor}-${index}`}
                          className={`rounded-xl border p-4 ${
                            errors.length >
                            0
                              ? 'border-red-200 bg-red-50/30'
                              : 'border-gray-200 bg-gray-50'
                          }`}
                        >

                          {/* HEADER */}

                          <div className="flex flex-wrap gap-2 mb-3">

                            <span className="px-2.5 py-1 bg-blue-100 text-blue-700 text-xs font-bold rounded-full">
                              Soal{' '}
                              {
                                q.nomor
                              }
                            </span>

                            <span className="px-2.5 py-1 bg-slate-100 text-slate-700 text-xs font-bold rounded-full">
                              {
                                TIPE_LABELS[
                                  q.tipe
                                ] ||
                                  q.tipe
                              }
                            </span>

                            {q.kunci_jawaban && (
                              <span className="px-2.5 py-1 bg-emerald-100 text-emerald-700 text-xs font-bold rounded-full">
                                ✓ Kunci:{' '}
                                {
                                  q.kunci_jawaban
                                }
                              </span>
                            )}

                            {q.kunci_terverifikasi && (
                              <span className="px-2.5 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-full">
                                ✓ Terverifikasi
                              </span>
                            )}

                            {q.gambar?.some(
                              (
                                g
                              ) =>
                                Boolean(
                                  getImageSrc(
                                    g
                                  )
                                )
                            ) && (
                              <span className="px-2.5 py-1 bg-purple-100 text-purple-700 text-xs font-bold rounded-full">
                                🖼️ Gambar
                              </span>
                            )}

                          </div>

                          {/* SOAL */}

                          <div className="bg-white rounded-lg border border-gray-200 p-4">

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

                          {/* OPTIONS */}

                          {q.opsi_jawaban?.length >
                            0 && (
                            <div className="mt-3 space-y-2">

                              {q.opsi_jawaban.map(
                                (
                                  option,
                                  optionIndex
                                ) => {
                                  const letter =
                                    String.fromCharCode(
                                      65 +
                                        optionIndex
                                    );

                                  const normalizedKey =
                                    String(
                                      q.kunci_jawaban ||
                                        ''
                                    )
                                      .toUpperCase()
                                      .replace(
                                        /[^A-Z]/g,
                                        ''
                                      );

                                  const isCorrect =
                                    normalizedKey.includes(
                                      letter
                                    );

                                  return (
                                    <div
                                      key={
                                        optionIndex
                                      }
                                      className={`flex gap-3 items-start rounded-lg border px-3 py-2.5 ${
                                        isCorrect
                                          ? 'bg-emerald-50 border-emerald-300'
                                          : 'bg-white border-gray-200'
                                      }`}
                                    >

                                      <span
                                        className={`w-7 h-7 flex-shrink-0 rounded-full flex items-center justify-center text-xs font-bold ${
                                          isCorrect
                                            ? 'bg-emerald-600 text-white'
                                            : 'bg-gray-100 text-gray-600'
                                        }`}
                                      >
                                        {
                                          letter
                                        }
                                      </span>

                                      <div className="flex-1">
                                        <RichText
                                          text={
                                            option
                                          }
                                          gambar={
                                            []
                                          }
                                          mathReady={
                                            mathReady
                                          }
                                        />
                                      </div>

                                      {isCorrect && (
                                        <span className="text-xs font-bold text-emerald-600 whitespace-nowrap">
                                          ✓ BENAR
                                        </span>
                                      )}

                                    </div>
                                  );
                                }
                              )}

                            </div>
                          )}

                          {/* PEMBAHASAN */}

                          {q.pembahasan && (
                            <div className="mt-3 bg-amber-50 border border-amber-200 rounded-lg p-3">

                              <div className="text-xs font-bold text-amber-700 mb-1">
                                💡 Pembahasan
                              </div>

                              <RichText
                                text={
                                  q.pembahasan
                                }
                                gambar={
                                  []
                                }
                                mathReady={
                                  mathReady
                                }
                              />

                            </div>
                          )}

                          {/* ERROR */}

                          {errors.length >
                            0 && (
                            <div className="mt-3 bg-red-50 border border-red-200 rounded-lg p-3 text-xs text-red-700">
                              <b>
                                ⚠️ Perlu diperbaiki:
                              </b>{' '}
                              {
                                errors.join(
                                  ', '
                                )
                              }
                            </div>
                          )}

                        </div>
                      );
                    }
                  )}

                {soalList.length >
                  50 && (
                  <div className="text-center text-sm text-gray-400 py-3">
                    Menampilkan 50 soal pertama. Total{' '}
                    {
                      soalList.length
                    }{' '}
                    soal.
                  </div>
                )}

              </div>

              {/* ==================================================
                  METADATA
              ================================================== */}

              <div className="border-t border-gray-200 pt-5">

                <h3 className="font-bold text-gray-700 mb-4">
                  Metadata Soal
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">

                  {/* MAPEL */}

                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">
                      Mata Pelajaran *
                    </label>

                    <select
                      value={
                        mataPelajaran
                      }
                      onChange={(
                        e
                      ) =>
                        setMataPelajaran(
                          e.target
                            .value
                        )
                      }
                      className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm"
                    >
                      {DAFTAR_MAPEL.map(
                        (
                          item
                        ) => (
                          <option
                            key={
                              item
                            }
                            value={
                              item
                            }
                          >
                            {
                              item
                            }
                          </option>
                        )
                      )}
                    </select>
                  </div>

                  {/* JENJANG */}

                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">
                      Jenjang
                    </label>

                    <select
                      value={
                        jenjang
                      }
                      onChange={(
                        e
                      ) =>
                        setJenjang(
                          e.target
                            .value
                        )
                      }
                      className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm"
                    >
                      {DAFTAR_JENJANG.map(
                        (
                          item
                        ) => (
                          <option
                            key={
                              item
                            }
                            value={
                              item
                            }
                          >
                            {
                              item
                            }
                          </option>
                        )
                      )}
                    </select>
                  </div>

                  {/* KELAS */}

                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">
                      Kelas
                    </label>

                    <select
                      value={
                        tingkatKelas
                      }
                      onChange={(
                        e
                      ) =>
                        setTingkatKelas(
                          e.target
                            .value
                        )
                      }
                      className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm"
                    >
                      {DAFTAR_KELAS.map(
                        (
                          item
                        ) => (
                          <option
                            key={
                              item
                            }
                            value={
                              item
                            }
                          >
                            Kelas{' '}
                            {
                              item
                            }
                          </option>
                        )
                      )}
                    </select>
                  </div>

                  {/* KATEGORI */}

                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">
                      Kategori / Bab
                    </label>

                    <input
                      type="text"
                      value={
                        kategori
                      }
                      onChange={(
                        e
                      ) =>
                        setKategori(
                          e.target
                            .value
                        )
                      }
                      placeholder="Contoh: Eksponen"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm"
                    />
                  </div>

                  {/* KESULITAN */}

                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">
                      Kesulitan
                    </label>

                    <select
                      value={
                        tingkatKesulitan
                      }
                      onChange={(
                        e
                      ) =>
                        setTingkatKesulitan(
                          e.target
                            .value
                        )
                      }
                      className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm"
                    >
                      {DAFTAR_KESULITAN.map(
                        (
                          item
                        ) => (
                          <option
                            key={
                              item
                            }
                            value={
                              item
                            }
                          >
                            {item
                              .charAt(
                                0
                              )
                              .toUpperCase() +
                              item.slice(
                                1
                              )}
                          </option>
                        )
                      )}
                    </select>
                  </div>

                  {/* TAGS */}

                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">
                      Tags
                    </label>

                    <input
                      type="text"
                      value={
                        tags
                      }
                      onChange={(
                        e
                      ) =>
                        setTags(
                          e.target
                            .value
                        )
                      }
                      placeholder="TKA, UTBK, HOTS"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm"
                    />
                  </div>

                </div>
              </div>

              {/* ==================================================
                  SAVE LOG
              ================================================== */}

              {saveLog.length >
                0 && (
                <div className="bg-gray-950 rounded-xl p-4 font-mono text-xs space-y-1 max-h-52 overflow-y-auto">
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

              {/* ==================================================
                  SAVE RESULT
              ================================================== */}

              {saveResult && (
                <div
                  className={`rounded-xl px-4 py-4 text-sm font-medium ${
                    saveResult.success
                      ? 'bg-green-50 border border-green-200 text-green-700'
                      : 'bg-red-50 border border-red-200 text-red-700'
                  }`}
                >
                  {saveResult.success ? (
                    <>
                      <div className="font-bold text-base">
                        🎉 Import berhasil
                      </div>

                      <div className="mt-1">
                        {
                          saveResult.count
                        }{' '}
                        soal berhasil disimpan ke Bank Soal Gemilang.
                      </div>

                      <div className="mt-2 text-xs">
                        Jawaban benar, pembahasan, metadata, dan gambar berhasil diproses.
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="font-bold">
                        ❌ Import gagal
                      </div>

                      <div className="mt-1 whitespace-pre-wrap">
                        {
                          saveResult.error
                        }
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* ==================================================
                  SAVE BUTTON
              ================================================== */}

              {!saveResult?.success && (
                <div className="flex justify-end pt-2">

                  <button
                    type="button"
                    onClick={
                      handleSave
                    }
                    disabled={
                      saving ||
                      soalList.length ===
                        0 ||
                      stats.invalid >
                        0
                    }
                    className="px-7 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-sm font-bold shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
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
````
