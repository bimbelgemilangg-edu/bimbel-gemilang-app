// src/pages/admin/bank-soal/ImportHasilScanPage.jsx
// ============================================================
// IMPORT HASIL SCAN AI -> BANK SOAL GEMILANG
//
// SUPPORT:
// - JSON array
// - { questions: [] }
// - { items: [] }
// - Gambar base64 / URL
// - Pembahasan
// - Kunci jawaban
// - Penanda jawaban benar
// - LaTeX
// - Karakter LaTeX rusak akibat escape JSON:
//     rac   -> \frac
//     	imes  -> \times
//     ight   -> \right
//     egin   -> \begin
// - CSV teks
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
      !document.querySelector(
        'script[src*="cdn.tailwindcss.com"]'
      )
    ) {
      const script = document.createElement('script');

      script.src = 'https://cdn.tailwindcss.com';
      script.async = true;

      document.head.insertBefore(
        script,
        document.head.firstChild
      );
    }
  }, []);
};

/* ============================================================
   KATEX
============================================================ */

const useKaTeX = () => {
  const [ready, setReady] = useState(
    typeof window !== 'undefined' &&
      !!window.katex
  );

  useEffect(() => {
    if (typeof window === 'undefined') return;

    if (window.katex) {
      setReady(true);
      return;
    }

    const css = document.createElement('link');

    css.rel = 'stylesheet';
    css.href =
      'https://cdnjs.cloudflare.com/ajax/libs/KaTeX/0.16.9/katex.min.css';

    document.head.appendChild(css);

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

    return () => {
      // Jangan remove script/css karena halaman lain
      // mungkin masih membutuhkan KaTeX.
    };
  }, []);

  return ready;
};

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
   UTILITAS
============================================================ */

/**
 * Membersihkan karakter kontrol yang sering muncul
 * ketika LaTeX dipindahkan melalui JSON / clipboard.
 *
 * Contoh:
 *
 * \f + rac  -> \frac
 * \t + imes -> \times
 * \r + ight -> \right
 * \b + egin -> \begin
 */
function repairBrokenLatex(value) {
  if (typeof value !== 'string') {
    return value;
  }

  let text = value;

  /*
   * Karakter kontrol Form Feed:
   * "\f" + "rac" biasanya berasal dari "\frac"
   */
  text = text.replace(/\f(?=rac\b)/g, '\\');

  /*
   * Tab + imes
   * biasanya berasal dari \times
   */
  text = text.replace(/\t(?=imes\b)/g, '\\');

  /*
   * Carriage Return + ight
   * biasanya berasal dari \right
   */
  text = text.replace(/\r(?=ight\b)/g, '\\');

  /*
   * Backspace + egin
   * biasanya berasal dari \begin
   */
  text = text.replace(/\x08(?=egin\b)/g, '\\');

  /*
   * Beberapa bentuk kerusakan lain yang umum
   */
  text = text.replace(/\f(?=rac\{)/g, '\\');
  text = text.replace(/\t(?=imes)/g, '\\');
  text = text.replace(/\r(?=ight)/g, '\\');
  text = text.replace(/\x08(?=egin)/g, '\\');

  /*
   * Jika AI menghasilkan "imes" tanpa backslash
   * setelah angka/operator, perbaiki.
   */
  text = text.replace(
    /(\d|\)|\}|\s)imes(?=\s|[A-Za-z0-9])/g,
    '$1\\times'
  );

  /*
   * Bentuk:
   * rac{...}
   * menjadi:
   * \frac{...}
   */
  text = text.replace(
    /(^|[\s(\[{=+\-*/])rac(?=\{)/g,
    '$1\\frac'
  );

  /*
   * Bentuk:
   * ight)
   * menjadi:
   * \right)
   */
  text = text.replace(
    /(^|[\s(\[{])ight(?=[)\]}])/g,
    '$1\\right'
  );

  /*
   * Bentuk:
   * egin{cases}
   * menjadi:
   * \begin{cases}
   */
  text = text.replace(
    /(^|[\s(\[{])egin(?=\{)/g,
    '$1\\begin'
  );

  return text;
}

/**
 * Membersihkan object secara rekursif.
 *
 * Ini penting supaya pembahasan, opsi,
 * teks soal, gambar, dll ikut diperbaiki.
 */
function deepRepairLatex(value) {
  if (typeof value === 'string') {
    return repairBrokenLatex(value);
  }

  if (Array.isArray(value)) {
    return value.map(item =>
      deepRepairLatex(item)
    );
  }

  if (
    value &&
    typeof value === 'object'
  ) {
    const result = {};

    Object.entries(value).forEach(
      ([key, val]) => {
        result[key] = deepRepairLatex(val);
      }
    );

    return result;
  }

  return value;
}

/* ============================================================
   REPAIR RAW JSON
============================================================ */

/**
 * Memperbaiki JSON yang mengandung karakter kontrol
 * akibat LaTeX seperti:
 *
 * "rac{5}"
 *
 * sebelum JSON.parse dijalankan.
 */
function repairRawJSON(raw) {
  let text = String(raw || '');

  /*
   * HANYA memperbaiki control character yang
   * sangat spesifik terkait LaTeX.
   *
   * Jangan mengganti newline normal karena
   * newline di luar string JSON adalah whitespace valid.
   */

  text = text.replace(
    /\f(?=rac\b)/g,
    '\\\\'
  );

  text = text.replace(
    /\t(?=imes\b)/g,
    '\\\\'
  );

  text = text.replace(
    /\r(?=ight\b)/g,
    '\\\\'
  );

  text = text.replace(
    /\x08(?=egin\b)/g,
    '\\\\'
  );

  return text;
}

/* ============================================================
   ESCAPE HTML
============================================================ */

function escapeHtml(text) {
  return String(text ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/* ============================================================
   LATEX RENDER
============================================================ */

function findInlineEnd(
  text,
  start,
  close
) {
  for (
    let i = start;
    i < text.length;
    i++
  ) {
    if (text[i] === '\n') {
      return -1;
    }

    if (
      text.startsWith(close, i)
    ) {
      return i;
    }

    if (text[i] === '\\') {
      i++;
    }
  }

  return -1;
}

function processSegment(
  text,
  renderMath
) {
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

    const char = text[i];

    result += escapeHtml(char);

    if (char === '\n') {
      result += '<br>';
    }

    i++;
  }

  return result;
}

/* ============================================================
   RICH TEXT
============================================================ */

function RichText({
  text,
  gambar,
  mathReady,
  className = '',
}) {
  const html = useMemo(() => {

    let safe = repairBrokenLatex(
      typeof text === 'string'
        ? text
        : String(text ?? '')
    );

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
      const fixedMath =
        repairBrokenLatex(
          math
        ).trim();

      if (!katexLib) {
        return display
          ? `<span>${escapeHtml(
              `$$${fixedMath}$$`
            )}</span>`
          : `<span>${escapeHtml(
              `$${fixedMath}$`
            )}</span>`;
      }

      try {
        return katexLib.renderToString(
          fixedMath,
          {
            displayMode: display,
            throwOnError: false,
            output: 'html',
          }
        );
      } catch {
        return display
          ? `<span>${escapeHtml(
              `$$${fixedMath}$$`
            )}</span>`
          : `<span>${escapeHtml(
              `$${fixedMath}$`
            )}</span>`;
      }
    };

    const makeImg = g => {
      const src =
        g?.uploadedUrl ||
        g?.url ||
        g?.dataUrl ||
        null;

      if (!src) {
        return `
          <div
            style="
              color:#d97706;
              font-size:11px;
              padding:8px;
              border:1px dashed #f59e0b;
              border-radius:8px;
              background:#fffbeb;
            "
          >
            🖼️ Gambar belum tersedia
          </div>
        `;
      }

      const alt = escapeHtml(
        g?.deskripsi ||
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
            src="${src}"
            alt="${alt}"
            style="
              max-width:100%;
              max-height:420px;
              border-radius:8px;
              border:1px solid #e5e7eb;
              background:#fff;
              padding:4px;
              object-fit:contain;
            "
          />
          ${
            g?.deskripsi
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
     * Token gambar:
     * {{GAMBAR}}
     * {{GAMBAR_1}}
     * {{GAMBAR_2}}
     */
    const parts = safe.split(
      /(\{\{\s*GAMBAR(?:_\d+)?\s*\}\})/gi
    );

    let gambarIndex = 0;
    let result = '';

    for (const part of parts) {

      if (
        /^\{\{\s*GAMBAR/i.test(
          part
        )
      ) {
        result += makeImg(
          imgs[gambarIndex++] ||
          {}
        );
      } else {
        result += processSegment(
          part,
          renderMath
        );
      }
    }

    /*
     * Jika gambar ada tetapi token
     * {{GAMBAR}} tidak ada, tampilkan
     * gambar setelah teks.
     */
    if (
      gambarIndex === 0 &&
      imgs.some(
        g =>
          g?.dataUrl ||
          g?.url ||
          g?.uploadedUrl
      )
    ) {
      imgs.forEach(g => {
        result += makeImg(g);
      });
    }

    return result;

  }, [
    text,
    gambar,
    mathReady,
  ]);

  return (
    <div
      className={`text-sm text-gray-700 leading-relaxed break-words ${className}`}
      dangerouslySetInnerHTML={{
        __html: html,
      }}
    />
  );
}

/* ============================================================
   NORMALIZE OPSI
============================================================ */

function normalizeOptions(q) {
  let options =
    q?.opsi_jawaban ??
    q?.opsiJawaban ??
    q?.options ??
    q?.pilihan ??
    [];

  if (!Array.isArray(options)) {
    options = [];
  }

  return options
    .map((option, index) => {

      /*
       * Support:
       * "Jawaban A"
       *
       * atau:
       * { label:"A", teks:"Jawaban A" }
       */
      if (
        typeof option === 'string'
      ) {
        return repairBrokenLatex(
          option
        );
      }

      if (
        option &&
        typeof option === 'object'
      ) {
        return repairBrokenLatex(
          String(
            option.teks ??
            option.text ??
            option.jawaban ??
            option.value ??
            ''
          )
        );
      }

      return '';
    })
    .filter(Boolean);
}

/* ============================================================
   NORMALIZE JAWABAN BENAR
============================================================ */

function normalizeCorrectAnswer(q) {

  const value =
    q?.kunci_jawaban ??
    q?.kunciJawaban ??
    q?.jawaban_benar ??
    q?.jawabanBenar ??
    q?.correct_answer ??
    q?.correctAnswer ??
    q?.answer ??
    '';

  if (
    Array.isArray(value)
  ) {
    return value
      .map(v =>
        String(v)
          .trim()
          .toUpperCase()
      )
      .filter(Boolean);
  }

  return String(value ?? '')
    .trim()
    .toUpperCase();
}

/* ============================================================
   CEK APAKAH OPSI BENAR
============================================================ */

function isCorrectOption(
  optionIndex,
  correctAnswer
) {
  if (!correctAnswer) {
    return false;
  }

  const letter =
    String.fromCharCode(
      65 + optionIndex
    );

  if (
    Array.isArray(correctAnswer)
  ) {
    return correctAnswer.includes(
      letter
    );
  }

  const normalized =
    String(correctAnswer)
      .trim()
      .toUpperCase();

  /*
   * Kunci bisa:
   * A
   * A,B
   * A, B
   * ["A","B"]
   */
  const values =
    normalized
      .split(/[,\s;]+/)
      .map(v => v.trim())
      .filter(Boolean);

  return values.includes(
    letter
  );
}

/* ============================================================
   PARSER JSON
============================================================ */

function parseJSON(raw) {
  if (!raw?.trim()) {
    throw new Error(
      'Input JSON kosong.'
    );
  }

  let cleaned =
    String(raw).trim();

  /*
   * Hilangkan ```json ... ```
   */
  cleaned = cleaned
    .replace(
      /^\s*```(?:json)?\s*/i,
      ''
    )
    .replace(
      /\s*```\s*$/i,
      ''
    )
    .trim();

  /*
   * Repair karakter kontrol LaTeX
   * sebelum JSON.parse.
   */
  cleaned =
    repairRawJSON(cleaned);

  let parsed;

  try {
    parsed =
      JSON.parse(cleaned);
  } catch (error) {

    /*
     * Percobaan kedua.
     * Jika ada control character
     * biasa di dalam JSON string,
     * tampilkan error yang lebih jelas.
     */
    const position =
      error?.message || '';

    throw new Error(
      `JSON tidak valid. ${position}

Pastikan JSON menggunakan double quote (") dan LaTeX ditulis seperti:
\\\\frac{a}{b}
\\\\times
\\\\begin{cases}
\\\\right)

Importer ini sudah mencoba memperbaiki karakter LaTeX rusak otomatis.`
    );
  }

  /*
   * Support array langsung
   */
  if (Array.isArray(parsed)) {
    return deepRepairLatex(
      parsed
    );
  }

  /*
   * Support:
   * { questions: [] }
   */
  if (
    Array.isArray(
      parsed?.questions
    )
  ) {
    return deepRepairLatex(
      parsed.questions
    );
  }

  /*
   * Support:
   * { items: [] }
   */
  if (
    Array.isArray(
      parsed?.items
    )
  ) {
    return deepRepairLatex(
      parsed.items
    );
  }

  /*
   * Support:
   * { data: [] }
   */
  if (
    Array.isArray(
      parsed?.data
    )
  ) {
    return deepRepairLatex(
      parsed.data
    );
  }

  /*
   * Support:
   * { soal: [] }
   */
  if (
    Array.isArray(
      parsed?.soal
    )
  ) {
    return deepRepairLatex(
      parsed.soal
    );
  }

  throw new Error(
    'Format JSON tidak dikenali. Gunakan array soal atau object dengan "questions", "items", "data", atau "soal" berupa array.'
  );
}

/* ============================================================
   PARSER CSV
============================================================ */

function parseCSV(raw) {

  const lines =
    String(raw || '')
      .trim()
      .split(/\r?\n/);

  if (
    lines.length < 2
  ) {
    throw new Error(
      'CSV kosong atau hanya header.'
    );
  }

  /*
   * CSV parser sederhana tetapi
   * mendukung quoted field.
   */
  function parseCSVLine(line) {
    const cols = [];
    let current = '';
    let inQuotes = false;

    for (
      let i = 0;
      i < line.length;
      i++
    ) {
      const char = line[i];

      if (
        char === '"'
      ) {
        if (
          inQuotes &&
          line[i + 1] === '"'
        ) {
          current += '"';
          i++;
        } else {
          inQuotes =
            !inQuotes;
        }
      } else if (
        char === ',' &&
        !inQuotes
      ) {
        cols.push(
          current.trim()
        );
        current = '';
      } else {
        current += char;
      }
    }

    cols.push(
      current.trim()
    );

    return cols;
  }

  const header =
    parseCSVLine(lines[0])
      .map(h =>
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
    if (!lines[i].trim()) {
      continue;
    }

    const cols =
      parseCSVLine(lines[i]);

    const get = key => {
      const index =
        header.indexOf(key);

      return index >= 0
        ? repairBrokenLatex(
            cols[index] || ''
          )
        : '';
    };

    const opsi = [
      'opsi a',
      'opsi b',
      'opsi c',
      'opsi d',
      'opsi e',
    ]
      .map(get)
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
        opsi,

      pernyataan:
        get('pernyataan')
          ? get(
              'pernyataan'
            )
              .split(' | ')
              .filter(Boolean)
          : [],

      tabel_benar_salah:
        get(
          'tabel benar-salah'
        )
          ? get(
              'tabel benar-salah'
            )
              .split(' | ')
              .filter(Boolean)
          : [],

      pasangan: [],

      kunci_jawaban:
        get('kunci'),

      pembahasan:
        get('pembahasan'),

      gambar: [],
    });
  }

  if (
    results.length === 0
  ) {
    throw new Error(
      'Tidak ada baris data di CSV.'
    );
  }

  return results;
}

/* ============================================================
   NORMALIZE SOAL
============================================================ */

function normalizeSoal(
  q,
  idx
) {

  const raw =
    deepRepairLatex(
      q || {}
    );

  const opsiJawaban =
    normalizeOptions(raw);

  const kunci =
    normalizeCorrectAnswer(
      raw
    );

  let pasangan =
    raw?.pasangan ??
    raw?.matching ??
    [];

  if (!Array.isArray(pasangan)) {
    pasangan = [];
  }

  pasangan =
    pasangan.map(pair => ({
      kiri: repairBrokenLatex(
        String(
          pair?.kiri ??
          pair?.left ??
          ''
        )
      ),
      kanan: repairBrokenLatex(
        String(
          pair?.kanan ??
          pair?.right ??
          ''
        )
      ),
    }));

  let gambar =
    raw?.gambar ??
    raw?.images ??
    raw?.gambar_soal ??
    [];

  if (!Array.isArray(gambar)) {
    gambar = [];
  }

  gambar =
    gambar.map(g => ({
      ...g,

      url:
        g?.url ||
        g?.imageUrl ||
        null,

      dataUrl:
        g?.dataUrl ||
        g?.base64 ||
        g?.data_url ||
        null,

      deskripsi:
        repairBrokenLatex(
          String(
            g?.deskripsi ??
            g?.description ??
            'Gambar soal'
          )
        ),

      uploadedUrl:
        g?.uploadedUrl ||
        null,
    }));

  return {
    nomor:
      typeof raw?.nomor === 'number'
        ? raw.nomor
        : (
            parseInt(
              raw?.nomor,
              10
            ) ||
            idx + 1
          ),

    tipe:
      raw?.tipe ||
      raw?.type ||
      'pg_sederhana',

    teks_soal:
      repairBrokenLatex(
        String(
          raw?.teks_soal ??
          raw?.soal ??
          raw?.question ??
          ''
        )
      ),

    opsi_jawaban:
      opsiJawaban,

    pernyataan:
      Array.isArray(
        raw?.pernyataan
      )
        ? raw.pernyataan.map(
            x =>
              repairBrokenLatex(
                String(x)
              )
          )
        : [],

    tabel_benar_salah:
      Array.isArray(
        raw?.tabel_benar_salah
      )
        ? raw.tabel_benar_salah.map(
            x =>
              repairBrokenLatex(
                String(x)
              )
          )
        : [],

    pasangan,

    kunci_jawaban:
      kunci,

    /*
     * FIELD BARU
     */
    jawaban_benar:
      kunci,

    pembahasan:
      repairBrokenLatex(
        String(
          raw?.pembahasan ??
          raw?.discussion ??
          raw?.penjelasan ??
          ''
        )
      ),

    kunci_terverifikasi:
      Boolean(
        raw?.kunci_terverifikasi ??
        raw?.kunciTerverifikasi ??
        raw?.verifiedAnswer ??
        false
      ),

    gambar,
  };
}

/* ============================================================
   VALIDASI SOAL
============================================================ */

function validateSoal(q) {
  const errors = [];

  if (
    !q.teks_soal?.trim()
  ) {
    errors.push(
      'teks soal kosong'
    );
  }

  if (
    !q.tipe
  ) {
    errors.push(
      'tipe soal kosong'
    );
  }

  if (
    q.tipe ===
      'pg_sederhana' &&
    q.opsi_jawaban.length === 0
  ) {
    errors.push(
      'opsi jawaban kosong'
    );
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
        g =>
          g?.uploadedUrl ||
          g?.url ||
          (
            typeof g?.dataUrl ===
              'string' &&
            g.dataUrl.startsWith(
              'https://'
            )
              ? g.dataUrl
              : null
          )
      )
      .filter(Boolean);

  return {

    /* =========================
       IDENTITAS SOAL
    ========================= */

    nomor:
      q.nomor,

    soal:
      q.teks_soal,

    tipe:
      q.tipe,

    /* =========================
       OPSI
    ========================= */

    opsiJawaban:
      q.opsi_jawaban,

    /* =========================
       SOAL KHUSUS
    ========================= */

    pernyataan:
      q.pernyataan,

    tabelBenarSalah:
      q.tabel_benar_salah,

    pasangan:
      q.pasangan,

    /* =========================
       JAWABAN
    ========================= */

    kunciJawaban:
      q.kunci_jawaban,

    /*
     * FIELD BARU
     * disimpan eksplisit supaya
     * sistem bisa membaca jawaban benar.
     */
    jawabanBenar:
      q.jawaban_benar,

    kunciTerverifikasi:
      q.kunci_terverifikasi,

    /* =========================
       PEMBAHASAN
    ========================= */

    pembahasan:
      q.pembahasan || '',

    /* =========================
       GAMBAR
    ========================= */

    gambarUrls,

    /*
     * Simpan metadata gambar juga.
     * Tidak menyimpan base64 besar ke Firestore.
     */
    gambar:
      (q.gambar || []).map(
        g => ({
          url:
            g?.uploadedUrl ||
            g?.url ||
            null,

          deskripsi:
            g?.deskripsi ||
            'Gambar soal',
        })
      ),

    /* =========================
       METADATA
    ========================= */

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

    /* =========================
       SUMBER
    ========================= */

    sumberFile:
      meta.sumberFile,

    sumberAI:
      meta.sumberAI,

    /* =========================
       AUDIT
    ========================= */

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
   KOMPONEN UTAMA
============================================================ */

export default function ImportHasilScanPage() {

  useTailwind();

  const mathReady =
    useKaTeX();

  const [
    isMobile,
    setIsMobile,
  ] = useState(
    typeof window !== 'undefined'
      ? window.innerWidth < 1024
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

    return () =>
      window.removeEventListener(
        'resize',
        handleResize
      );
  }, []);

  /* ============================================================
     INPUT
  ============================================================ */

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

  /* ============================================================
     PARSE
  ============================================================ */

  const [
    soalList,
    setSoalList,
  ] = useState([]);

  const [
    parseError,
    setParseError,
  ] = useState('');

  const [
    invalidQuestions,
    setInvalidQuestions,
  ] = useState([]);

  /* ============================================================
     METADATA
  ============================================================ */

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

  /* ============================================================
     SAVE
  ============================================================ */

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

  /* ============================================================
     STATISTIK
  ============================================================ */

  const soalDenganGambar =
    useMemo(
      () =>
        soalList.filter(
          q =>
            (q.gambar || [])
              .some(
                g =>
                  g?.dataUrl?.startsWith(
                    'data:image'
                  ) ||
                  g?.url ||
                  g?.uploadedUrl
              )
        ).length,
      [soalList]
    );

  const soalDenganPembahasan =
    useMemo(
      () =>
        soalList.filter(
          q =>
            q.pembahasan?.trim()
        ).length,
      [soalList]
    );

  const soalDenganKunci =
    useMemo(
      () =>
        soalList.filter(
          q =>
            q.kunci_jawaban
        ).length,
      [soalList]
    );

  /* ============================================================
     HANDLE PARSE
  ============================================================ */

  const handleParse =
    useCallback(() => {

      setParseError('');
      setSoalList([]);
      setInvalidQuestions([]);
      setSaveResult(null);
      setSaveLog([]);

      if (
        !rawInput.trim()
      ) {
        setParseError(
          'Input kosong. Silakan paste JSON atau upload file.'
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

        const invalid = [];

        normalized.forEach(
          (q, index) => {
            const errors =
              validateSoal(q);

            if (
              errors.length > 0
            ) {
              invalid.push({
                nomor:
                  q.nomor ||
                  index + 1,
                errors,
              });
            }
          }
        );

        setSoalList(
          normalized
        );

        setInvalidQuestions(
          invalid
        );

      } catch (error) {

        console.error(
          'IMPORT JSON ERROR:',
          error
        );

        setParseError(
          error?.message ||
            'Gagal membaca JSON.'
        );
      }

    }, [
      rawInput,
      format,
    ]);

  /* ============================================================
     HANDLE FILE
  ============================================================ */

  const handleFile =
    event => {

      const file =
        event.target
          ?.files?.[0];

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

      reader.onload =
        event => {

          setRawInput(
            event.target
              ?.result || ''
          );

        };

      reader.onerror =
        () => {

          setParseError(
            'Gagal membaca file.'
          );

        };

      reader.readAsText(
        file
      );

      setSumberFile(
        file.name
      );
    };

  /* ============================================================
     RESET
  ============================================================ */

  const handleReset =
    () => {
      setRawInput('');
      setSoalList([]);
      setParseError('');
      setInvalidQuestions([]);
      setSaveResult(null);
      setSaveLog([]);
    };

  /* ============================================================
     SAVE
  ============================================================ */

  const handleSave =
    async () => {

      if (
        soalList.length === 0
      ) {
        return;
      }

      /*
       * Jangan simpan soal invalid.
       */
      const validQuestions =
        soalList.filter(
          q =>
            validateSoal(q)
              .length === 0
        );

      if (
        validQuestions.length === 0
      ) {

        setSaveResult({
          success: false,
          error:
            'Tidak ada soal valid yang dapat disimpan.',
        });

        return;
      }

      setSaving(true);
      setSaveResult(null);
      setSaveLog([]);

      const log = [];

      const addLog =
        message => {
          log.push(message);
          setSaveLog([
            ...log,
          ]);
        };

      const meta = {
        mataPelajaran,

        tingkatKelas,

        jenjang,

        kategori,

        tags:
          tags
            .split(',')
            .map(
              tag =>
                tag.trim()
            )
            .filter(Boolean),

        tingkatKesulitan,

        sumberFile,

        sumberAI,
      };

      /*
       * Copy array supaya state tidak
       * dimutasi secara langsung.
       */
      const soalProcessed =
        validQuestions.map(
          q => ({
            ...q,
            gambar: [
              ...(q.gambar || []),
            ],
          })
        );

      /* ========================================================
         UPLOAD GAMBAR
      ======================================================== */

      const toUpload = [];

      soalProcessed.forEach(
        (q, questionIndex) => {

          (
            q.gambar || []
          ).forEach(
            (
              gambar,
              imageIndex
            ) => {

              if (
                typeof gambar?.dataUrl ===
                  'string' &&
                gambar.dataUrl.startsWith(
                  'data:image'
                )
              ) {

                toUpload.push({
                  key:
                    `q${questionIndex}-g${imageIndex}-${Date.now()}-${Math.random()
                      .toString(36)
                      .slice(2, 8)}`,

                  dataUrl:
                    gambar.dataUrl,

                  questionIndex,

                  imageIndex,
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

                body:
                  JSON.stringify({
                    images:
                      toUpload.map(
                        item => ({
                          key:
                            item.key,

                          dataUrl:
                            item.dataUrl,
                        })
                      ),
                  }),
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
                uploaded?.key &&
                uploaded?.url
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
              questionIndex,
              imageIndex,
            }) => {

              const uploadedUrl =
                urlMap[key];

              if (
                uploadedUrl
              ) {

                const images = [
                  ...(
                    soalProcessed[
                      questionIndex
                    ].gambar || []
                  ),
                ];

                images[
                  imageIndex
                ] = {
                  ...images[
                    imageIndex
                  ],

                  uploadedUrl,

                  /*
                   * Base64 dibuang setelah
                   * berhasil upload supaya
                   * tidak ikut masuk Firestore.
                   */
                  dataUrl:
                    null,
                };

                soalProcessed[
                  questionIndex
                ] = {
                  ...soalProcessed[
                    questionIndex
                  ],

                  gambar:
                    images,
                };

              }

            }
          );

          addLog(
            `✅ ${
              result.uploadedCount ||
              0
            }/${toUpload.length} gambar berhasil diupload.`
          );

          if (
            Array.isArray(
              result.errors
            ) &&
            result.errors.length >
              0
          ) {

            addLog(
              `⚠️ ${result.errors.length} gambar gagal diupload.`
            );

          }

        } catch (error) {

          addLog(
            `❌ Upload gambar gagal: ${error.message}`
          );

          /*
           * Tidak menggagalkan seluruh proses.
           * Soal tetap bisa disimpan.
           */
        }

      } else {

        addLog(
          'ℹ️ Tidak ada gambar base64 yang perlu diupload.'
        );

      }

      /* ========================================================
         FIRESTORE
      ======================================================== */

      addLog(
        `📝 Menyimpan ${soalProcessed.length} soal valid ke Firestore...`
      );

      try {

        /*
         * Firestore batch maksimum 500 operasi.
         * Pakai 400 agar aman.
         */
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

              const reference =
                doc(
                  collection(
                    db,
                    BANK_SOAL_COLLECTION
                  )
                );

              batch.set(
                reference,
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
          skipped:
            soalList.length -
            validQuestions.length,
        });

      } catch (error) {

        console.error(
          'FIRESTORE SAVE ERROR:',
          error
        );

        addLog(
          `❌ Gagal simpan ke Firestore: ${error.message}`
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

  /* ============================================================
     RENDER
  ============================================================ */

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

        <div className="p-6 max-w-6xl mx-auto space-y-6">

          {/* ==================================================
              HEADER
          ================================================== */}

          <div>
            <div className="flex items-center gap-3">

              <div
                className="
                  w-11 h-11
                  rounded-xl
                  bg-blue-600
                  text-white
                  flex
                  items-center
                  justify-center
                  text-xl
                "
              >
                📥
              </div>

              <div>
                <h1
                  className="
                    text-2xl
                    font-bold
                    text-gray-800
                  "
                >
                  Import Hasil Scan AI
                </h1>

                <p
                  className="
                    text-gray-500
                    text-sm
                    mt-1
                  "
                >
                  Import JSON / CSV hasil scan
                  dari AI ke Bank Soal Gemilang.
                </p>
              </div>

            </div>

            <div
              className="
                mt-4
                bg-blue-50
                border
                border-blue-100
                rounded-xl
                p-4
                text-sm
                text-blue-800
              "
            >
              <div className="font-bold mb-1">
                ✓ JSON sekarang mendukung
              </div>

              <div className="grid sm:grid-cols-2 gap-1 text-xs">

                <span>
                  ✓ Soal & semua opsi
                </span>

                <span>
                  ✓ Kunci jawaban
                </span>

                <span>
                  ✓ Pembahasan
                </span>

                <span>
                  ✓ Penanda jawaban benar
                </span>

                <span>
                  ✓ Gambar base64
                </span>

                <span>
                  ✓ LaTeX / rumus matematika
                </span>

                <span>
                  ✓ Karakter LaTeX rusak otomatis diperbaiki
                </span>

                <span>
                  ✓ Upload gambar ke Supabase
                </span>

              </div>
            </div>
          </div>

          {/* ==================================================
              INPUT CARD
          ================================================== */}

          <div
            className="
              bg-white
              rounded-2xl
              border
              border-gray-200
              p-5
              space-y-5
              shadow-sm
            "
          >

            {/* FORMAT */}

            <div
              className="
                flex
                flex-wrap
                gap-3
                items-center
              "
            >

              <span
                className="
                  text-sm
                  font-semibold
                  text-gray-600
                "
              >
                Format:
              </span>

              {[
                'json',
                'csv',
              ].map(
                f => (
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
                      transition
                      ${
                        format === f
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'bg-white text-gray-500 border-gray-300 hover:border-blue-400'
                      }
                    `}
                  >
                    {f.toUpperCase()}

                    <span
                      className="
                        ml-1.5
                        text-[10px]
                        font-normal
                        opacity-70
                      "
                    >
                      {f === 'json'
                        ? 'Gambar + pembahasan'
                        : 'Teks'}
                    </span>
                  </button>
                )
              )}

              <div
                className="
                  ml-auto
                  flex
                  items-center
                  gap-2
                "
              >

                <label
                  className="
                    text-sm
                    text-gray-500
                    hidden
                    sm:block
                  "
                >
                  Upload:
                </label>

                <label
                  className="
                    cursor-pointer
                    px-3
                    py-2
                    rounded-lg
                    border
                    border-gray-300
                    text-sm
                    text-gray-600
                    hover:border-blue-400
                    bg-white
                  "
                >
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

            {/* SUMBER */}

            <div
              className="
                grid
                grid-cols-1
                sm:grid-cols-2
                gap-3
              "
            >

              <div>

                <label
                  className="
                    text-xs
                    text-gray-500
                    mb-1
                    block
                  "
                >
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
                  placeholder="
                    Gemini Canvas, ChatGPT, Claude...
                  "
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

                <label
                  className="
                    text-xs
                    text-gray-500
                    mb-1
                    block
                  "
                >
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
                  placeholder="
                    TO TKA Matematika.pdf
                  "
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

            {/* TEXTAREA */}

            <div>

              <div
                className="
                  flex
                  items-center
                  justify-between
                  mb-1
                "
              >

                <label
                  className="
                    text-xs
                    text-gray-500
                  "
                >
                  Paste{' '}
                  {format.toUpperCase()}{' '}
                  di sini:
                </label>

                {rawInput && (
                  <span
                    className="
                      text-[10px]
                      text-gray-400
                    "
                  >
                    {rawInput.length.toLocaleString(
                      'id-ID'
                    )}{' '}
                    karakter
                  </span>
                )}

              </div>

              <textarea
                rows={14}
                value={
                  rawInput
                }
                onChange={e =>
                  setRawInput(
                    e.target.value
                  )
                }
                placeholder={
                  format === 'json'
                    ? `[
  {
    "nomor": 1,
    "tipe": "pg_sederhana",
    "teks_soal": "Nilai \\\\frac{5 \\\\times 10^{-6}}{10^{-3}} adalah ...",
    "opsi_jawaban": [
      "5 \\\\times 10^{-3}",
      "5 \\\\times 10^{-5}",
      "5 \\\\times 10^3",
      "5 \\\\times 10^5",
      "5 \\\\times 10^6"
    ],
    "kunci_jawaban": "B",
    "pembahasan": "Gunakan sifat pangkat...",
    "gambar": []
  }
]`
                    : `Nomor,Tipe,Soal,Opsi A,Opsi B,Opsi C,Opsi D,Opsi E,Kunci,Pembahasan
1,pg_sederhana,"Soal...",A,B,C,D,E,A,"Pembahasan..."`
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

            {/* ERROR */}

            {parseError && (
              <div
                className="
                  bg-red-50
                  border
                  border-red-200
                  rounded-xl
                  px-4
                  py-4
                  text-sm
                  text-red-700
                "
              >

                <div className="font-bold mb-1">
                  ❌ JSON tidak dapat dibaca
                </div>

                <div className="whitespace-pre-wrap">
                  {parseError}
                </div>

              </div>
            )}

            {/* BUTTONS */}

            <div
              className="
                flex
                flex-wrap
                gap-2
              "
            >

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
                className="
                  px-5
                  py-2.5
                  bg-gray-100
                  hover:bg-gray-200
                  text-gray-700
                  rounded-xl
                  text-sm
                  font-semibold
                "
              >
                ↺ Reset
              </button>

            </div>

          </div>

          {/* ==================================================
              PREVIEW
          ================================================== */}

          {soalList.length > 0 && (
            <div
              className="
                bg-white
                rounded-2xl
                border
                border-gray-200
                p-5
                space-y-5
                shadow-sm
              "
            >

              {/* SUMMARY */}

              <div
                className="
                  flex
                  items-start
                  justify-between
                  gap-4
                  flex-wrap
                "
              >

                <div>

                  <h2
                    className="
                      font-bold
                      text-gray-800
                      text-lg
                    "
                  >
                    Preview —{' '}
                    {soalList.length}{' '}
                    soal
                  </h2>

                  <p
                    className="
                      text-xs
                      text-gray-400
                      mt-1
                    "
                  >
                    Pastikan teks, gambar,
                    kunci, dan pembahasan
                    sudah benar sebelum
                    menyimpan.
                  </p>

                </div>

                <div
                  className="
                    flex
                    flex-wrap
                    gap-2
                  "
                >

                  <span
                    className="
                      px-2.5
                      py-1
                      rounded-full
                      bg-blue-50
                      text-blue-700
                      text-xs
                      font-semibold
                    "
                  >
                    📝 {soalList.length}{' '}
                    soal
                  </span>

                  <span
                    className="
                      px-2.5
                      py-1
                      rounded-full
                      bg-green-50
                      text-green-700
                      text-xs
                      font-semibold
                    "
                  >
                    ✓ {soalDenganKunci}{' '}
                    kunci
                  </span>

                  <span
                    className="
                      px-2.5
                      py-1
                      rounded-full
                      bg-purple-50
                      text-purple-700
                      text-xs
                      font-semibold
                    "
                  >
                    🖼️{' '}
                    {soalDenganGambar}{' '}
                    gambar
                  </span>

                  <span
                    className="
                      px-2.5
                      py-1
                      rounded-full
                      bg-amber-50
                      text-amber-700
                      text-xs
                      font-semibold
                    "
                  >
                    💡{' '}
                    {soalDenganPembahasan}{' '}
                    pembahasan
                  </span>

                </div>

              </div>

              {/* INVALID */}

              {invalidQuestions.length >
                0 && (
                <div
                  className="
                    bg-amber-50
                    border
                    border-amber-200
                    rounded-xl
                    p-4
                    text-sm
                    text-amber-800
                  "
                >

                  <div
                    className="
                      font-bold
                      mb-2
                    "
                  >
                    ⚠️{' '}
                    {
                      invalidQuestions.length
                    }{' '}
                    soal perlu diperiksa
                  </div>

                  <div className="space-y-1">

                    {invalidQuestions
                      .slice(0, 20)
                      .map(
                        item => (
                          <div
                            key={
                              item.nomor
                            }
                            className="
                              text-xs
                            "
                          >
                            Soal{' '}
                            {item.nomor}
                            :{' '}
                            {item.errors.join(
                              ', '
                            )}
                          </div>
                        )
                      )}

                  </div>

                  {invalidQuestions.length >
                    20 && (
                    <div
                      className="
                        text-xs
                        mt-2
                        text-amber-600
                      "
                    >
                      ...dan{' '}
                      {invalidQuestions.length -
                        20}{' '}
                      lainnya
                    </div>
                  )}

                </div>
              )}

              {/* SOAL */}

              <div
                className="
                  space-y-4
                  max-h-[700px]
                  overflow-y-auto
                  pr-1
                "
              >

                {soalList
                  .slice(0, 50)
                  .map(
                    (
                      q,
                      index
                    ) => {

                      const correctAnswer =
                        q.kunci_jawaban;

                      const errors =
                        validateSoal(
                          q
                        );

                      const invalid =
                        errors.length >
                        0;

                      return (
                        <div
                          key={
                            `${q.nomor}-${index}`
                          }
                          className={`
                            border
                            rounded-2xl
                            p-4
                            ${
                              invalid
                                ? 'border-red-200 bg-red-50/40'
                                : 'border-gray-200 bg-gray-50'
                            }
                          `}
                        >

                          {/* HEADER SOAL */}

                          <div
                            className="
                              flex
                              flex-wrap
                              gap-1.5
                              mb-3
                            "
                          >

                            <span
                              className="
                                px-2.5
                                py-1
                                bg-blue-100
                                text-blue-700
                                text-xs
                                font-bold
                                rounded-full
                              "
                            >
                              Soal{' '}
                              {q.nomor}
                            </span>

                            <span
                              className="
                                px-2.5
                                py-1
                                bg-violet-100
                                text-violet-700
                                text-xs
                                font-bold
                                rounded-full
                              "
                            >
                              {
                                TIPE_LABELS[
                                  q.tipe
                                ] ||
                                q.tipe
                              }
                            </span>

                            {q.gambar?.length >
                              0 && (
                              <span
                                className="
                                  px-2.5
                                  py-1
                                  bg-purple-100
                                  text-purple-700
                                  text-xs
                                  rounded-full
                                  font-semibold
                                "
                              >
                                🖼️ Gambar
                              </span>
                            )}

                            {q.pembahasan && (
                              <span
                                className="
                                  px-2.5
                                  py-1
                                  bg-amber-100
                                  text-amber-700
                                  text-xs
                                  rounded-full
                                  font-semibold
                                "
                              >
                                💡 Pembahasan
                              </span>
                            )}

                            {correctAnswer && (
                              <span
                                className="
                                  px-2.5
                                  py-1
                                  bg-emerald-100
                                  text-emerald-700
                                  text-xs
                                  rounded-full
                                  font-mono
                                  font-bold
                                "
                              >
                                ✓ Kunci:{' '}
                                {Array.isArray(
                                  correctAnswer
                                )
                                  ? correctAnswer.join(
                                      ', '
                                    )
                                  : correctAnswer}
                              </span>
                            )}

                          </div>

                          {/* SOAL */}

                          <div
                            className="
                              bg-white
                              rounded-xl
                              border
                              border-gray-200
                              p-4
                            "
                          >

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
                              className="
                                text-base
                                text-gray-800
                              "
                            />

                          </div>

                          {/* OPSI */}

                          {q.opsi_jawaban
                            ?.length >
                            0 && (
                            <div
                              className="
                                mt-3
                                space-y-2
                              "
                            >

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

                                  const isCorrect =
                                    isCorrectOption(
                                      optionIndex,
                                      correctAnswer
                                    );

                                  return (
                                    <div
                                      key={
                                        optionIndex
                                      }
                                      className={`
                                        flex
                                        items-start
                                        gap-3
                                        p-3
                                        rounded-xl
                                        border
                                        ${
                                          isCorrect
                                            ? 'bg-emerald-50 border-emerald-300'
                                            : 'bg-white border-gray-200'
                                        }
                                      `}
                                    >

                                      <div
                                        className={`
                                          w-7
                                          h-7
                                          flex-shrink-0
                                          rounded-full
                                          flex
                                          items-center
                                          justify-center
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
                                      </div>

                                      <div className="flex-1 min-w-0">

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
                                        <div
                                          className="
                                            flex-shrink-0
                                            text-xs
                                            font-bold
                                            text-emerald-700
                                            whitespace-nowrap
                                            pt-1
                                          "
                                        >
                                          ✓ JAWABAN
                                          <br />
                                          BENAR
                                        </div>
                                      )}

                                    </div>
                                  );
                                }
                              )}

                            </div>
                          )}

                          {/* PEMBAHASAN */}

                          {q.pembahasan && (
                            <div
                              className="
                                mt-3
                                rounded-xl
                                border
                                border-amber-200
                                bg-amber-50
                                p-4
                              "
                            >

                              <div
                                className="
                                  text-xs
                                  font-bold
                                  text-amber-700
                                  mb-2
                                "
                              >
                                💡 PEMBAHASAN
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
                                className="
                                  text-sm
                                  text-gray-700
                                "
                              />

                            </div>
                          )}

                        </div>
                      );
                    }
                  )}

                {soalList.length >
                  50 && (
                  <div
                    className="
                      text-center
                      text-sm
                      text-gray-400
                      py-3
                    "
                  >
                    ...dan{' '}
                    {soalList.length -
                      50}{' '}
                    soal lainnya
                  </div>
                )}

              </div>

              {/* ==================================================
                  METADATA
              ================================================== */}

              <div
                className="
                  border-t
                  border-gray-100
                  pt-5
                "
              >

                <h3
                  className="
                    font-semibold
                    text-gray-700
                    mb-3
                    text-sm
                  "
                >
                  Metadata Soal
                </h3>

                <div
                  className="
                    grid
                    grid-cols-1
                    sm:grid-cols-2
                    lg:grid-cols-3
                    gap-3
                  "
                >

                  {/* MAPEL */}

                  <div>

                    <label
                      className="
                        text-xs
                        text-gray-500
                        mb-1
                        block
                      "
                    >
                      Mata Pelajaran *
                    </label>

                    <select
                      value={
                        mataPelajaran
                      }
                      onChange={e =>
                        setMataPelajaran(
                          e.target.value
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
                      "
                    >

                      {DAFTAR_MAPEL.map(
                        mapel => (
                          <option
                            key={
                              mapel
                            }
                            value={
                              mapel
                            }
                          >
                            {mapel}
                          </option>
                        )
                      )}

                    </select>

                  </div>

                  {/* JENJANG */}

                  <div>

                    <label
                      className="
                        text-xs
                        text-gray-500
                        mb-1
                        block
                      "
                    >
                      Jenjang
                    </label>

                    <select
                      value={
                        jenjang
                      }
                      onChange={e =>
                        setJenjang(
                          e.target.value
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
                      "
                    >

                      {DAFTAR_JENJANG.map(
                        item => (
                          <option
                            key={
                              item
                            }
                            value={
                              item
                            }
                          >
                            {item}
                          </option>
                        )
                      )}

                    </select>

                  </div>

                  {/* KELAS */}

                  <div>

                    <label
                      className="
                        text-xs
                        text-gray-500
                        mb-1
                        block
                      "
                    >
                      Kelas
                    </label>

                    <select
                      value={
                        tingkatKelas
                      }
                      onChange={e =>
                        setTingkatKelas(
                          e.target.value
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
                      "
                    >

                      {DAFTAR_KELAS.map(
                        kelas => (
                          <option
                            key={
                              kelas
                            }
                            value={
                              kelas
                            }
                          >
                            Kelas{' '}
                            {kelas}
                          </option>
                        )
                      )}

                    </select>

                  </div>

                  {/* KATEGORI */}

                  <div>

                    <label
                      className="
                        text-xs
                        text-gray-500
                        mb-1
                        block
                      "
                    >
                      Kategori / Bab
                    </label>

                    <input
                      type="text"
                      value={
                        kategori
                      }
                      onChange={e =>
                        setKategori(
                          e.target.value
                        )
                      }
                      placeholder="
                        Fungsi Kuadrat
                      "
                      className="
                        w-full
                        border
                        border-gray-300
                        rounded-lg
                        px-3
                        py-2
                        text-sm
                      "
                    />

                  </div>

                  {/* KESULITAN */}

                  <div>

                    <label
                      className="
                        text-xs
                        text-gray-500
                        mb-1
                        block
                      "
                    >
                      Kesulitan
                    </label>

                    <select
                      value={
                        tingkatKesulitan
                      }
                      onChange={e =>
                        setTingkatKesulitan(
                          e.target.value
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
                      "
                    >

                      {DAFTAR_KESULITAN.map(
                        level => (
                          <option
                            key={
                              level
                            }
                            value={
                              level
                            }
                          >
                            {level
                              .charAt(
                                0
                              )
                              .toUpperCase() +
                              level.slice(
                                1
                              )}
                          </option>
                        )
                      )}

                    </select>

                  </div>

                  {/* TAG */}

                  <div>

                    <label
                      className="
                        text-xs
                        text-gray-500
                        mb-1
                        block
                      "
                    >
                      Tags
                    </label>

                    <input
                      type="text"
                      value={
                        tags
                      }
                      onChange={e =>
                        setTags(
                          e.target.value
                        )
                      }
                      placeholder="
                        TKA, UTBK, HOTS
                      "
                      className="
                        w-full
                        border
                        border-gray-300
                        rounded-lg
                        px-3
                        py-2
                        text-sm
                      "
                    />

                  </div>

                </div>

              </div>

              {/* ==================================================
                  SAVE LOG
              ================================================== */}

              {saveLog.length >
                0 && (
                <div
                  className="
                    bg-gray-950
                    rounded-xl
                    p-4
                    font-mono
                    text-xs
                    space-y-1
                    max-h-48
                    overflow-y-auto
                  "
                >

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
                        {message}
                      </div>
                    )
                  )}

                </div>
              )}

              {/* ==================================================
                  RESULT
              ================================================== */}

              {saveResult && (
                <div
                  className={`
                    rounded-xl
                    px-4
                    py-4
                    text-sm
                    font-medium
                    ${
                      saveResult.success
                        ? 'bg-green-50 border border-green-200 text-green-700'
                        : 'bg-red-50 border border-red-200 text-red-700'
                    }
                  `}
                >

                  {saveResult.success ? (
                    <div>

                      <div
                        className="
                          font-bold
                          text-base
                        "
                      >
                        🎉 Import berhasil!
                      </div>

                      <div className="mt-1">
                        {saveResult.count}{' '}
                        soal berhasil
                        disimpan ke Bank Soal
                        Gemilang.
                      </div>

                      {saveResult.skipped >
                        0 && (
                        <div
                          className="
                            text-xs
                            mt-1
                            text-yellow-700
                          "
                        >
                          ⚠️{' '}
                          {
                            saveResult.skipped
                          }{' '}
                          soal invalid tidak
                          ikut disimpan.
                        </div>
                      )}

                    </div>
                  ) : (
                    <div>

                      <div className="font-bold">
                        ❌ Import gagal
                      </div>

                      <div className="mt-1">
                        {
                          saveResult.error
                        }
                      </div>

                    </div>
                  )}

                </div>
              )}

              {/* ==================================================
                  SAVE BUTTON
              ================================================== */}

              {!saveResult?.success && (
                <div
                  className="
                    flex
                    justify-end
                    pt-2
                  "
                >

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
                      gap-2
                      disabled:opacity-50
                      disabled:cursor-not-allowed
                      transition
                    "
                  >

                    {saving ? (
                      <>
                        <span>
                          ⏳
                        </span>
                        <span>
                          Menyimpan...
                        </span>
                      </>
                    ) : (
                      <>
                        <span>
                          💾
                        </span>
                        <span>
                          Simpan{' '}
                          {
                            soalList.length
                          }{' '}
                          Soal ke Bank Soal
                        </span>
                      </>
                    )}

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
