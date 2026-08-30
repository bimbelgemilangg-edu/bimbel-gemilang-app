// src/pages/admin/bank-soal/ImportHasilScanPage.jsx
// ============================================================
// IMPORT HASIL SCAN AI -> BANK SOAL GEMILANG
//
// FITUR:
// - Import JSON
// - Import CSV
// - JSON array / questions / soal / items / data
// - Normalisasi format AI
// - Kunci jawaban
// - Penanda jawaban benar
// - Pembahasan
// - Gambar URL
// - Gambar base64 / dataUrl
// - Placeholder {{GAMBAR}}, {{GAMBAR_1}}, dst
// - Upload gambar ke Supabase
// - Preview LaTeX
// - Fallback aman jika KaTeX gagal
// - Validasi soal
// - Download JSON hasil normalisasi
// - Firestore batch save
// - Error isolation agar 1 soal rusak tidak membuat halaman crash
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
  
  import {
    db,
    auth,
  } from '../../../firebase';
  
  // ============================================================
  // CONSTANT
  // ============================================================
  
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
  
  // ============================================================
  // SAFE HELPERS
  // ============================================================
  
  function safeString(value, fallback = '') {
    if (value === null || value === undefined) return fallback;
  
    if (typeof value === 'string') {
      return value;
    }
  
    if (
      typeof value === 'number' ||
      typeof value === 'boolean'
    ) {
      return String(value);
    }
  
    return fallback;
  }
  
  function safeArray(value) {
    return Array.isArray(value) ? value : [];
  }
  
  function safeBoolean(value) {
    if (typeof value === 'boolean') return value;
  
    if (typeof value === 'string') {
      return [
        'true',
        '1',
        'yes',
        'ya',
        'benar',
      ].includes(value.toLowerCase().trim());
    }
  
    if (typeof value === 'number') {
      return value === 1;
    }
  
    return false;
  }
  
  function cleanCodeFence(text) {
    let result = safeString(text).trim();
  
    result = result.replace(/^\uFEFF/, '');
  
    result = result.replace(
      /^```(?:json|JSON)?\s*/i,
      '',
    );
  
    result = result.replace(
      /\s*```\s*$/i,
      '',
    );
  
    return result.trim();
  }
  
  function tryParseJSON(text) {
    const cleaned = cleanCodeFence(text);
  
    try {
      return JSON.parse(cleaned);
    } catch (firstError) {
      // Coba mencari array JSON di dalam teks.
      const firstArray = cleaned.indexOf('[');
      const lastArray = cleaned.lastIndexOf(']');
  
      if (
        firstArray >= 0 &&
        lastArray > firstArray
      ) {
        const candidate = cleaned.slice(
          firstArray,
          lastArray + 1,
        );
  
        try {
          return JSON.parse(candidate);
        } catch (_) {
          // lanjut ke error asli
        }
      }
  
      // Coba object JSON.
      const firstObject = cleaned.indexOf('{');
      const lastObject = cleaned.lastIndexOf('}');
  
      if (
        firstObject >= 0 &&
        lastObject > firstObject
      ) {
        const candidate = cleaned.slice(
          firstObject,
          lastObject + 1,
        );
  
        try {
          return JSON.parse(candidate);
        } catch (_) {
          // gunakan error asli
        }
      }
  
      throw new Error(
        `JSON tidak valid: ${firstError.message}`,
      );
    }
  }
  
  // ============================================================
  // EXTRACT ARRAY
  // ============================================================
  
  function extractQuestionArray(parsed) {
    if (Array.isArray(parsed)) {
      return parsed;
    }
  
    if (!parsed || typeof parsed !== 'object') {
      throw new Error(
        'Format JSON tidak dikenali. JSON harus berupa array soal atau object yang berisi array soal.',
      );
    }
  
    const candidates = [
      'questions',
      'question',
      'soal',
      'soals',
      'items',
      'data',
      'results',
      'bankSoal',
      'bank_soal',
    ];
  
    for (const key of candidates) {
      if (Array.isArray(parsed[key])) {
        return parsed[key];
      }
    }
  
    // Jika object hanya berisi satu level object yang merupakan soal.
    const objectValues = Object.values(parsed);
  
    if (
      objectValues.length > 0 &&
      objectValues.every(
        item =>
          item &&
          typeof item === 'object' &&
          !Array.isArray(item),
      )
    ) {
      const looksLikeQuestions =
        objectValues.some(item =>
          item.soal ||
          item.teks_soal ||
          item.question ||
          item.pertanyaan,
        );
  
      if (looksLikeQuestions) {
        return objectValues;
      }
    }
  
    throw new Error(
      'Format JSON tidak dikenali. Gunakan array soal seperti [{...}] atau {"questions":[{...}]}',
    );
  }
  
  // ============================================================
  // NORMALIZE TYPE
  // ============================================================
  
  function normalizeTipe(value) {
    const raw = safeString(value)
      .toLowerCase()
      .trim();
  
    const aliases = {
      pg: 'pg_sederhana',
      pilihan_ganda: 'pg_sederhana',
      pilihan_ganda_sederhana: 'pg_sederhana',
      multiple_choice: 'pg_sederhana',
      multiplechoice: 'pg_sederhana',
  
      pg_sederhana: 'pg_sederhana',
  
      pg_kompleks: 'pg_kompleks',
      multiple_select: 'pg_kompleks',
      multiple_answers: 'pg_kompleks',
  
      benar_salah: 'benar_salah',
      benar_salah: 'benar_salah',
      true_false: 'benar_salah',
  
      isian: 'isian_singkat',
      isian_singkat: 'isian_singkat',
      short_answer: 'isian_singkat',
  
      menjodohkan: 'menjodohkan',
      matching: 'menjodohkan',
    };
  
    return aliases[raw] || 'pg_sederhana';
  }
  
  // ============================================================
  // NORMALIZE IMAGE
  // ============================================================
  
  function normalizeImage(image, index = 0) {
    if (!image) {
      return {
        id: `gambar-${index + 1}`,
        url: '',
        dataUrl: '',
        uploadedUrl: '',
        deskripsi: '',
        nomor: index + 1,
      };
    }
  
    if (typeof image === 'string') {
      const isData =
        image.startsWith('data:image');
  
      return {
        id: `gambar-${index + 1}`,
        url: isData ? '' : image,
        dataUrl: isData ? image : '',
        uploadedUrl: '',
        deskripsi: '',
        nomor: index + 1,
      };
    }
  
    const dataUrl =
      safeString(
        image.dataUrl ||
        image.base64 ||
        image.data ||
        '',
      );
  
    const url =
      safeString(
        image.url ||
        image.src ||
        image.imageUrl ||
        '',
      );
  
    return {
      id:
        safeString(
          image.id,
          `gambar-${index + 1}`,
        ),
  
      url,
  
      dataUrl:
        dataUrl.startsWith('data:image')
          ? dataUrl
          : '',
  
      uploadedUrl:
        safeString(
          image.uploadedUrl,
          '',
        ),
  
      deskripsi:
        safeString(
          image.deskripsi ||
          image.description ||
          image.alt ||
          '',
        ),
  
      nomor:
        Number(image.nomor) ||
        index + 1,
    };
  }
  
  // ============================================================
  // NORMALIZE OPTION
  // ============================================================
  
  function normalizeOption(option) {
    if (typeof option === 'string') {
      return option.trim();
    }
  
    if (
      option &&
      typeof option === 'object'
    ) {
      return safeString(
        option.teks ||
        option.text ||
        option.jawaban ||
        option.value ||
        option.label ||
        '',
      );
    }
  
    return '';
  }
  
  // ============================================================
  // NORMALIZE ANSWER KEY
  // ============================================================
  
  function normalizeAnswerKey(value) {
    if (Array.isArray(value)) {
      return value
        .map(item =>
          safeString(item)
            .trim()
            .toUpperCase(),
        )
        .filter(Boolean);
    }
  
    return safeString(value)
      .trim()
      .toUpperCase();
  }
  
  // ============================================================
  // DETERMINE CORRECT OPTIONS
  // ============================================================
  
  function getCorrectAnswerIndexes(
    opsi,
    kunci,
  ) {
    const keys = Array.isArray(kunci)
      ? kunci
      : safeString(kunci)
          .split(/[,\s]+/)
          .filter(Boolean);
  
    const normalizedKeys = keys.map(key =>
      safeString(key)
        .trim()
        .toUpperCase(),
    );
  
    return opsi.map((_, index) => {
      const letter =
        String.fromCharCode(
          65 + index,
        );
  
      return normalizedKeys.includes(letter);
    });
  }
  
  // ============================================================
  // NORMALIZE SOAL
  // ============================================================
  
  function normalizeSoal(
    q,
    idx,
  ) {
    if (!q || typeof q !== 'object') {
      return {
        nomor: idx + 1,
        tipe: 'pg_sederhana',
        teks_soal: '',
        opsi_jawaban: [],
        opsi_benar: [],
        pernyataan: [],
        tabel_benar_salah: [],
        pasangan: [],
        kunci_jawaban: '',
        kunci_terverifikasi: false,
        pembahasan: '',
        gambar: [],
        valid: false,
        errors: [
          'Data soal bukan object.',
        ],
      };
    }
  
    const nomor =
      Number(
        q.nomor ??
        q.no ??
        q.number,
      ) || idx + 1;
  
    const tipe = normalizeTipe(
      q.tipe ||
      q.type ||
      q.jenis ||
      q.jenis_soal,
    );
  
    const teksSoal = safeString(
      q.teks_soal ||
      q.soal ||
      q.question ||
      q.pertanyaan ||
      '',
    );
  
    // ----------------------------------------------------------
    // OPTIONS
    // ----------------------------------------------------------
  
    let opsiSource =
      q.opsi_jawaban ??
      q.opsiJawaban ??
      q.options ??
      q.pilihan ??
      q.choices ??
      [];
  
    let opsiJawaban = [];
  
    if (Array.isArray(opsiSource)) {
      opsiJawaban =
        opsiSource
          .map(normalizeOption)
          .filter(Boolean);
    } else if (
      opsiSource &&
      typeof opsiSource === 'object'
    ) {
      const letters = [
        'A',
        'B',
        'C',
        'D',
        'E',
      ];
  
      opsiJawaban = letters
        .map(letter =>
          normalizeOption(
            opsiSource[letter] ??
            opsiSource[letter.toLowerCase()],
          ),
        )
        .filter(Boolean);
    }
  
    // ----------------------------------------------------------
    // ANSWER KEY
    // ----------------------------------------------------------
  
    const rawKey =
      q.kunci_jawaban ??
      q.kunciJawaban ??
      q.kunci ??
      q.jawaban_benar ??
      q.jawabanBenar ??
      q.correctAnswer ??
      q.correct_answer ??
      q.answer ??
      '';
  
    const kunciJawaban =
      normalizeAnswerKey(rawKey);
  
    const opsiBenar =
      getCorrectAnswerIndexes(
        opsiJawaban,
        kunciJawaban,
      );
  
    // ----------------------------------------------------------
    // PERNYATAAN
    // ----------------------------------------------------------
  
    const pernyataan = safeArray(
      q.pernyataan ||
      q.statements,
    )
      .map(item => {
        if (
          item &&
          typeof item === 'object'
        ) {
          return {
            teks: safeString(
              item.teks ||
              item.text ||
              item.pernyataan ||
              '',
            ),
  
            jawaban: safeString(
              item.jawaban ||
              item.answer ||
              item.nilai ||
              '',
            ),
          };
        }
  
        return {
          teks: safeString(item),
          jawaban: '',
        };
      })
      .filter(item => item.teks);
  
    // ----------------------------------------------------------
    // TABEL BENAR SALAH
    // ----------------------------------------------------------
  
    const tabelBenarSalah =
      safeArray(
        q.tabel_benar_salah ||
        q.tabelBenarSalah ||
        q.trueFalseTable,
      )
        .map(item => {
          if (
            item &&
            typeof item === 'object'
          ) {
            return {
              pernyataan: safeString(
                item.pernyataan ||
                item.teks ||
                item.text ||
                '',
              ),
  
              jawaban: safeString(
                item.jawaban ||
                item.answer ||
                '',
              ),
            };
          }
  
          return safeString(item);
        })
        .filter(Boolean);
  
    // ----------------------------------------------------------
    // MATCHING
    // ----------------------------------------------------------
  
    const pasangan =
      safeArray(
        q.pasangan ||
        q.matching ||
        q.pairs,
      )
        .map(pair => ({
          kiri: safeString(
            pair?.kiri ||
            pair?.left ||
            pair?.pertanyaan ||
            '',
          ),
  
          kanan: safeString(
            pair?.kanan ||
            pair?.right ||
            pair?.jawaban ||
            '',
          ),
        }))
        .filter(
          pair =>
            pair.kiri ||
            pair.kanan,
        );
  
    // ----------------------------------------------------------
    // IMAGES
    // ----------------------------------------------------------
  
    let imageSource =
      q.gambar ??
      q.images ??
      q.image ??
      q.gambar_soal ??
      [];
  
    if (
      imageSource &&
      !Array.isArray(imageSource)
    ) {
      imageSource = [
        imageSource,
      ];
    }
  
    const gambar =
      safeArray(imageSource)
        .map((image, imageIndex) =>
          normalizeImage(
            image,
            imageIndex,
          ),
        );
  
    // ----------------------------------------------------------
    // EXPLICIT CORRECT FLAGS
    // ----------------------------------------------------------
  
    const explicitCorrect =
      safeArray(
        q.opsi_benar ||
        q.opsiBenar ||
        q.correctOptions,
      );
  
    let finalOpsiBenar = opsiBenar;
  
    if (explicitCorrect.length > 0) {
      finalOpsiBenar =
        opsiJawaban.map(
          (_, optionIndex) => {
            const letter =
              String.fromCharCode(
                65 + optionIndex,
              );
  
            return explicitCorrect.some(
              value => {
                const normalized =
                  safeString(value)
                    .trim()
                    .toUpperCase();
  
                return (
                  normalized === letter ||
                  normalized ===
                    String(optionIndex)
                );
              },
            );
          },
        );
    }
  
    // ----------------------------------------------------------
    // VALIDATION
    // ----------------------------------------------------------
  
    const errors = [];
  
    if (!teksSoal.trim()) {
      errors.push(
        'Teks soal kosong.',
      );
    }
  
    if (
      [
        'pg_sederhana',
        'pg_kompleks',
      ].includes(tipe) &&
      opsiJawaban.length < 2
    ) {
      errors.push(
        'Pilihan jawaban kurang dari 2.',
      );
    }
  
    if (
      [
        'pg_sederhana',
        'pg_kompleks',
      ].includes(tipe) &&
      !kunciJawaban
    ) {
      errors.push(
        'Kunci jawaban belum ditemukan.',
      );
    }
  
    return {
      nomor,
  
      tipe,
  
      teks_soal: teksSoal,
  
      opsi_jawaban:
        opsiJawaban,
  
      opsi_benar:
        finalOpsiBenar,
  
      pernyataan,
  
      tabel_benar_salah:
        tabelBenarSalah,
  
      pasangan,
  
      kunci_jawaban:
        kunciJawaban,
  
      kunci_terverifikasi:
        safeBoolean(
          q.kunci_terverifikasi ??
          q.kunciTerverifikasi ??
          q.verifiedAnswer ??
          false,
        ),
  
      pembahasan:
        safeString(
          q.pembahasan ||
          q.penjelasan ||
          q.explanation ||
          q.solusi ||
          '',
        ),
  
      gambar,
  
      valid:
        errors.length === 0,
  
      errors,
    };
  }
  
  // ============================================================
  // JSON PARSER
  // ============================================================
  
  function parseJSON(raw) {
    const parsed = tryParseJSON(raw);
  
    const questions =
      extractQuestionArray(parsed);
  
    if (
      !Array.isArray(questions) ||
      questions.length === 0
    ) {
      throw new Error(
        'JSON berhasil dibaca tetapi tidak berisi soal.',
      );
    }
  
    return questions;
  }
  
  // ============================================================
  // CSV PARSER
  // ============================================================
  
  function parseCSV(raw) {
    const text = safeString(raw).trim();
  
    if (!text) {
      throw new Error(
        'CSV kosong.',
      );
    }
  
    const rows = [];
  
    let row = [];
    let cell = '';
    let inQuotes = false;
  
    for (
      let i = 0;
      i < text.length;
      i++
    ) {
      const char = text[i];
  
      if (char === '"') {
        if (
          inQuotes &&
          text[i + 1] === '"'
        ) {
          cell += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
  
        continue;
      }
  
      if (
        char === ',' &&
        !inQuotes
      ) {
        row.push(cell);
        cell = '';
        continue;
      }
  
      if (
        (char === '\n' ||
          char === '\r') &&
        !inQuotes
      ) {
        if (
          char === '\r' &&
          text[i + 1] === '\n'
        ) {
          i++;
        }
  
        row.push(cell);
        cell = '';
  
        if (
          row.some(
            item =>
              item.trim() !== '',
          )
        ) {
          rows.push(row);
        }
  
        row = [];
        continue;
      }
  
      cell += char;
    }
  
    row.push(cell);
  
    if (
      row.some(
        item =>
          item.trim() !== '',
      )
    ) {
      rows.push(row);
    }
  
    if (rows.length < 2) {
      throw new Error(
        'CSV harus memiliki header dan minimal satu soal.',
      );
    }
  
    const header =
      rows[0].map(
        item =>
          item
            .replace(/^\uFEFF/, '')
            .trim()
            .toLowerCase(),
      );
  
    const get = (
      currentRow,
      ...names
    ) => {
      for (const name of names) {
        const index =
          header.indexOf(
            name.toLowerCase(),
          );
  
        if (index >= 0) {
          return safeString(
            currentRow[index],
          ).trim();
        }
      }
  
      return '';
    };
  
    return rows
      .slice(1)
      .map((currentRow, index) => {
        const opsi =
          [
            'a',
            'b',
            'c',
            'd',
            'e',
          ]
            .map(letter =>
              get(
                currentRow,
                `opsi ${letter}`,
                `option ${letter}`,
                letter,
              ),
            )
            .filter(Boolean);
  
        return {
          nomor:
            Number(
              get(
                currentRow,
                'nomor',
                'no',
                'number',
              ),
            ) ||
            index + 1,
  
          tipe:
            get(
              currentRow,
              'tipe',
              'type',
            ) ||
            'pg_sederhana',
  
          teks_soal:
            get(
              currentRow,
              'soal',
              'teks soal',
              'teks_soal',
              'question',
            ),
  
          opsi_jawaban:
            opsi,
  
          kunci_jawaban:
            get(
              currentRow,
              'kunci',
              'kunci jawaban',
              'kunci_jawaban',
              'jawaban benar',
              'correct answer',
            ),
  
          pembahasan:
            get(
              currentRow,
              'pembahasan',
              'penjelasan',
              'explanation',
            ),
  
          pernyataan:
            get(
              currentRow,
              'pernyataan',
            )
              .split('|')
              .map(x => x.trim())
              .filter(Boolean),
  
          tabel_benar_salah:
            get(
              currentRow,
              'tabel benar-salah',
              'tabel benar salah',
            )
              .split('|')
              .map(x => x.trim())
              .filter(Boolean),
  
          pasangan: [],
  
          gambar: [],
        };
      });
  }
  
  // ============================================================
  // IMAGE SRC
  // ============================================================
  
  function getImageSrc(gambar) {
    if (!gambar) return '';
  
    return (
      gambar.uploadedUrl ||
      gambar.url ||
      gambar.dataUrl ||
      ''
    );
  }
  
  // ============================================================
  // SAFE LATEX LOADER
  // ============================================================
  
  function useSafeKaTeX() {
    const [
      ready,
      setReady,
    ] = useState(false);
  
    useEffect(() => {
      let cancelled = false;
  
      try {
        if (
          typeof window !== 'undefined' &&
          window.katex
        ) {
          setReady(true);
          return undefined;
        }
  
        const existingCss =
          document.querySelector(
            'link[data-gemilang-katex]',
          );
  
        if (!existingCss) {
          const css =
            document.createElement(
              'link',
            );
  
          css.rel = 'stylesheet';
  
          css.href =
            'https://cdnjs.cloudflare.com/ajax/libs/KaTeX/0.16.9/katex.min.css';
  
          css.dataset.gemilangKatex =
            'true';
  
          document.head.appendChild(
            css,
          );
        }
  
        const existingScript =
          document.querySelector(
            'script[data-gemilang-katex]',
          );
  
        if (existingScript) {
          existingScript.addEventListener(
            'load',
            () => {
              if (
                !cancelled &&
                window.katex
              ) {
                setReady(true);
              }
            },
          );
  
          return () => {
            cancelled = true;
          };
        }
  
        const script =
          document.createElement(
            'script',
          );
  
        script.src =
          'https://cdnjs.cloudflare.com/ajax/libs/KaTeX/0.16.9/katex.min.js';
  
        script.async = true;
  
        script.dataset.gemilangKatex =
          'true';
  
        script.onload = () => {
          if (
            !cancelled &&
            window.katex
          ) {
            setReady(true);
          }
        };
  
        script.onerror = () => {
          if (!cancelled) {
            setReady(false);
          }
        };
  
        document.body.appendChild(
          script,
        );
      } catch (_) {
        if (!cancelled) {
          setReady(false);
        }
      }
  
      return () => {
        cancelled = true;
      };
    }, []);
  
    return ready;
  }
  
  // ============================================================
  // ESCAPE HTML
  // ============================================================
  
  function escapeHtml(value) {
    return safeString(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
  
  // ============================================================
  // INLINE MATH
  // ============================================================
  
  function renderTextWithMath(
    text,
    mathReady,
  ) {
    const value =
      safeString(text);
  
    if (!value) return '';
  
    const katex =
      mathReady &&
      typeof window !== 'undefined' &&
      window.katex
        ? window.katex
        : null;
  
    let output = '';
  
    let i = 0;
  
    while (i < value.length) {
      // $$ ... $$
      if (
        value[i] === '$' &&
        value[i + 1] === '$'
      ) {
        const end =
          value.indexOf(
            '$$',
            i + 2,
          );
  
        if (end >= 0) {
          const math =
            value.slice(
              i + 2,
              end,
            );
  
          if (katex) {
            try {
              output +=
                katex.renderToString(
                  math,
                  {
                    displayMode: true,
                    throwOnError: false,
                    output: 'html',
                  },
                );
            } catch (_) {
              output +=
                `<span class="math-fallback">${escapeHtml(
                  math,
                )}</span>`;
            }
          } else {
            output +=
              `<span class="math-fallback">${escapeHtml(
                math,
              )}</span>`;
          }
  
          i = end + 2;
          continue;
        }
      }
  
      // \( ... \)
      if (
        value[i] === '\\' &&
        value[i + 1] === '('
      ) {
        const end =
          value.indexOf(
            '\\)',
            i + 2,
          );
  
        if (end >= 0) {
          const math =
            value.slice(
              i + 2,
              end,
            );
  
          if (katex) {
            try {
              output +=
                katex.renderToString(
                  math,
                  {
                    displayMode: false,
                    throwOnError: false,
                    output: 'html',
                  },
                );
            } catch (_) {
              output +=
                `<span class="math-fallback">${escapeHtml(
                  math,
                )}</span>`;
            }
          } else {
            output +=
              `<span class="math-fallback">${escapeHtml(
                math,
              )}</span>`;
          }
  
          i = end + 2;
          continue;
        }
      }
  
      // \[ ... \]
      if (
        value[i] === '\\' &&
        value[i + 1] === '['
      ) {
        const end =
          value.indexOf(
            '\\]',
            i + 2,
          );
  
        if (end >= 0) {
          const math =
            value.slice(
              i + 2,
              end,
            );
  
          if (katex) {
            try {
              output +=
                katex.renderToString(
                  math,
                  {
                    displayMode: true,
                    throwOnError: false,
                    output: 'html',
                  },
                );
            } catch (_) {
              output +=
                `<span class="math-fallback">${escapeHtml(
                  math,
                )}</span>`;
            }
          } else {
            output +=
              `<span class="math-fallback">${escapeHtml(
                math,
              )}</span>`;
          }
  
          i = end + 2;
          continue;
        }
      }
  
      // $ ... $
      if (value[i] === '$') {
        const end =
          value.indexOf(
            '$',
            i + 1,
          );
  
        if (end > i + 1) {
          const math =
            value.slice(
              i + 1,
              end,
            );
  
          if (katex) {
            try {
              output +=
                katex.renderToString(
                  math,
                  {
                    displayMode: false,
                    throwOnError: false,
                    output: 'html',
                  },
                );
            } catch (_) {
              output +=
                `<span class="math-fallback">${escapeHtml(
                  math,
                )}</span>`;
            }
          } else {
            output +=
              `<span class="math-fallback">${escapeHtml(
                math,
              )}</span>`;
          }
  
          i = end + 1;
          continue;
        }
      }
  
      const char =
        value[i];
  
      output += escapeHtml(
        char,
      );
  
      i++;
    }
  
    return output.replace(
      /\n/g,
      '<br/>',
    );
  }
  
  // ============================================================
  // RICH TEXT
  // ============================================================
  
  function RichText({
    text,
    gambar = [],
    mathReady,
  }) {
    const html = useMemo(() => {
      const safe =
        safeString(text);
  
      if (!safe) {
        return '';
      }
  
      const images =
        safeArray(gambar);
  
      const parts =
        safe.split(
          /(\{\{\s*GAMBAR(?:_\d+)?\s*\}\})/gi,
        );
  
      let imageIndex = 0;
  
      let result = '';
  
      for (const part of parts) {
        if (
          /^\{\{\s*GAMBAR/i.test(
            part,
          )
        ) {
          const image =
            images[
              imageIndex
            ];
  
          imageIndex++;
  
          if (image) {
            const src =
              getImageSrc(
                image,
              );
  
            if (src) {
              result += `
                <figure style="
                  margin:12px 0;
                  width:100%;
                ">
                  <img
                    src="${escapeHtml(
                      src,
                    )}"
                    alt="${escapeHtml(
                      image.deskripsi ||
                      'Gambar soal',
                    )}"
                    style="
                      display:block;
                      max-width:100%;
                      max-height:500px;
                      width:auto;
                      height:auto;
                      object-fit:contain;
                      border:1px solid #e5e7eb;
                      border-radius:10px;
                      background:#fff;
                      padding:4px;
                      margin:0 auto;
                    "
                  />
                  ${
                    image.deskripsi
                      ? `<figcaption style="
                          font-size:11px;
                          color:#6b7280;
                          margin-top:4px;
                          text-align:center;
                        ">${escapeHtml(
                          image.deskripsi,
                        )}</figcaption>`
                      : ''
                  }
                </figure>
              `;
            } else {
              result += `
                <div style="
                  padding:8px;
                  margin:8px 0;
                  border:1px dashed #f59e0b;
                  border-radius:8px;
                  color:#b45309;
                  font-size:12px;
                  background:#fffbeb;
                ">
                  🖼️ Gambar belum memiliki URL/data gambar.
                </div>
              `;
            }
          }
        } else {
          result +=
            renderTextWithMath(
              part,
              mathReady,
            );
        }
      }
  
      // Jika gambar tersedia tetapi placeholder
      // tidak ada, tampilkan setelah teks.
      if (
        imageIndex === 0 &&
        images.some(
          image =>
            getImageSrc(
              image,
            ),
        )
      ) {
        result += `
          <div style="margin-top:10px;">
        `;
  
        images.forEach(
          image => {
            const src =
              getImageSrc(
                image,
              );
  
            if (!src) return;
  
            result += `
              <img
                src="${escapeHtml(
                  src,
                )}"
                alt="${escapeHtml(
                  image.deskripsi ||
                  'Gambar soal',
                )}"
                style="
                  display:block;
                  max-width:100%;
                  max-height:500px;
                  width:auto;
                  height:auto;
                  object-fit:contain;
                  border:1px solid #e5e7eb;
                  border-radius:10px;
                  padding:4px;
                  background:#fff;
                  margin:8px auto;
                "
              />
            `;
          },
        );
  
        result += '</div>';
      }
  
      return result;
    }, [
      text,
      gambar,
      mathReady,
    ]);
  
    return (
      <div
        className="text-sm text-gray-700 leading-7 break-words"
        dangerouslySetInnerHTML={{
          __html: html,
        }}
      />
    );
  }
  
  // ============================================================
  // OPTION LETTER
  // ============================================================
  
  function optionLetter(index) {
    return String.fromCharCode(
      65 + index,
    );
  }
  
  // ============================================================
  // FIRESTORE DOCUMENT
  // ============================================================
  
  function buildDoc(
    q,
    meta,
  ) {
    const gambarUrls =
      safeArray(q.gambar)
        .map(
          image =>
            image.uploadedUrl ||
            image.url ||
            '',
        )
        .filter(Boolean);
  
    return {
      nomor:
        q.nomor,
  
      soal:
        q.teks_soal,
  
      tipe:
        q.tipe,
  
      opsiJawaban:
        q.opsi_jawaban,
  
      // Array boolean:
      // [true,false,false,false,false]
      opsiBenar:
        q.opsi_benar,
  
      pernyataan:
        q.pernyataan,
  
      tabelBenarSalah:
        q.tabel_benar_salah,
  
      pasangan:
        q.pasangan,
  
      kunciJawaban:
        q.kunci_jawaban,
  
      kunciTerverifikasi:
        q.kunci_terverifikasi,
  
      pembahasan:
        q.pembahasan,
  
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
  
  // ============================================================
  // DOWNLOAD JSON
  // ============================================================
  
  function downloadJSON(
    soalList,
  ) {
    try {
      const payload = soalList.map(
        q => ({
          nomor: q.nomor,
          tipe: q.tipe,
          teks_soal:
            q.teks_soal,
  
          opsi_jawaban:
            q.opsi_jawaban,
  
          opsi_benar:
            q.opsi_benar,
  
          kunci_jawaban:
            q.kunci_jawaban,
  
          kunci_terverifikasi:
            q.kunci_terverifikasi,
  
          pembahasan:
            q.pembahasan,
  
          pernyataan:
            q.pernyataan,
  
          tabel_benar_salah:
            q.tabel_benar_salah,
  
          pasangan:
            q.pasangan,
  
          gambar:
            q.gambar.map(
              image => ({
                id:
                  image.id,
  
                url:
                  image.url,
  
                dataUrl:
                  image.dataUrl,
  
                uploadedUrl:
                  image.uploadedUrl,
  
                deskripsi:
                  image.deskripsi,
  
                nomor:
                  image.nomor,
              }),
            ),
        }),
      );
  
      const blob =
        new Blob(
          [
            JSON.stringify(
              payload,
              null,
              2,
            ),
          ],
          {
            type:
              'application/json;charset=utf-8',
          },
        );
  
      const url =
        URL.createObjectURL(
          blob,
        );
  
      const anchor =
        document.createElement(
          'a',
        );
  
      anchor.href = url;
  
      anchor.download =
        `hasil-scan-gemilang-${Date.now()}.json`;
  
      document.body.appendChild(
        anchor,
      );
  
      anchor.click();
  
      anchor.remove();
  
      URL.revokeObjectURL(
        url,
      );
    } catch (error) {
      console.error(
        'Download JSON error:',
        error,
      );
  
      alert(
        'Gagal membuat file JSON.',
      );
    }
  }
  
  // ============================================================
  // MAIN COMPONENT
  // ============================================================
  
  export default function ImportHasilScanPage() {
    const mathReady =
      useSafeKaTeX();
  
    // ----------------------------------------------------------
    // MOBILE
    // ----------------------------------------------------------
  
    const [
      isMobile,
      setIsMobile,
    ] = useState(
      typeof window !== 'undefined'
        ? window.innerWidth < 1024
        : false,
    );
  
    useEffect(() => {
      const handleResize =
        () => {
          setIsMobile(
            window.innerWidth <
              1024,
          );
        };
  
      window.addEventListener(
        'resize',
        handleResize,
      );
  
      return () => {
        window.removeEventListener(
          'resize',
          handleResize,
        );
      };
    }, []);
  
    // ----------------------------------------------------------
    // INPUT
    // ----------------------------------------------------------
  
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
      'Gemini Canvas',
    );
  
    // ----------------------------------------------------------
    // PARSE
    // ----------------------------------------------------------
  
    const [
      soalList,
      setSoalList,
    ] = useState([]);
  
    const [
      parseError,
      setParseError,
    ] = useState('');
  
    const [
      warnings,
      setWarnings,
    ] = useState([]);
  
    // ----------------------------------------------------------
    // METADATA
    // ----------------------------------------------------------
  
    const [
      mataPelajaran,
      setMataPelajaran,
    ] = useState(
      'Matematika',
    );
  
    const [
      tingkatKelas,
      setTingkatKelas,
    ] = useState('10');
  
    const [
      jenjang,
      setJenjang,
    ] = useState(
      'SMA/MA',
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
      'sedang',
    );
  
    const [
      sumberFile,
      setSumberFile,
    ] = useState('');
  
    // ----------------------------------------------------------
    // SAVE
    // ----------------------------------------------------------
  
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
  
    // ----------------------------------------------------------
    // STATS
    // ----------------------------------------------------------
  
    const statistik =
      useMemo(() => {
        const total =
          soalList.length;
  
        const valid =
          soalList.filter(
            q => q.valid,
          ).length;
  
        const invalid =
          total - valid;
  
        const denganGambar =
          soalList.filter(
            q =>
              safeArray(
                q.gambar,
              ).some(
                image =>
                  Boolean(
                    getImageSrc(
                      image,
                    ),
                  ),
              ),
          ).length;
  
        const denganPembahasan =
          soalList.filter(
            q =>
              Boolean(
                safeString(
                  q.pembahasan,
                ).trim(),
              ),
          ).length;
  
        const denganKunci =
          soalList.filter(
            q =>
              Boolean(
                q.kunci_jawaban,
              ),
          ).length;
  
        return {
          total,
          valid,
          invalid,
          denganGambar,
          denganPembahasan,
          denganKunci,
        };
      }, [
        soalList,
      ]);
  
    // ----------------------------------------------------------
    // PARSE HANDLER
    // ----------------------------------------------------------
  
    const handleParse =
      useCallback(() => {
        setParseError('');
        setWarnings([]);
        setSoalList([]);
        setSaveResult(null);
        setSaveLog([]);
  
        if (
          !rawInput.trim()
        ) {
          setParseError(
            'Input kosong. Paste JSON atau CSV terlebih dahulu.',
          );
  
          return;
        }
  
        try {
          const raw =
            format === 'json'
              ? parseJSON(
                  rawInput,
                )
              : parseCSV(
                  rawInput,
                );
  
          const normalized =
            raw.map(
              (
                question,
                index,
              ) =>
                normalizeSoal(
                  question,
                  index,
                ),
            );
  
          const warningList =
            normalized
              .filter(
                q =>
                  !q.valid,
              )
              .map(
                q =>
                  `Soal ${q.nomor}: ${q.errors.join(
                    ' ',
                  )}`,
              );
  
          setWarnings(
            warningList,
          );
  
          setSoalList(
            normalized,
          );
        } catch (error) {
          console.error(
            'Parse error:',
            error,
          );
  
          setParseError(
            error?.message ||
              'Gagal membaca data.',
          );
        }
      }, [
        rawInput,
        format,
      ]);
  
    // ----------------------------------------------------------
    // FILE HANDLER
    // ----------------------------------------------------------
  
    const handleFile =
      useCallback(
        event => {
          try {
            const file =
              event.target.files?.[0];
  
            if (!file) {
              return;
            }
  
            const lowerName =
              file.name.toLowerCase();
  
            if (
              lowerName.endsWith(
                '.json',
              )
            ) {
              setFormat('json');
            } else if (
              lowerName.endsWith(
                '.csv',
              )
            ) {
              setFormat('csv');
            }
  
            setSumberFile(
              file.name,
            );
  
            const reader =
              new FileReader();
  
            reader.onload =
              e => {
                setRawInput(
                  safeString(
                    e.target?.result,
                  ),
                );
  
                setParseError('');
                setSoalList([]);
                setWarnings([]);
              };
  
            reader.onerror =
              () => {
                setParseError(
                  'File gagal dibaca.',
                );
              };
  
            reader.readAsText(
              file,
              'UTF-8',
            );
          } catch (error) {
            console.error(
              'File error:',
              error,
            );
  
            setParseError(
              'Gagal membaca file.',
            );
          }
        },
        [],
      );
  
    // ----------------------------------------------------------
    // SAVE
    // ----------------------------------------------------------
  
    const handleSave =
      useCallback(
        async () => {
          if (
            !soalList.length
          ) {
            return;
          }
  
          const invalid =
            soalList.filter(
              q =>
                !q.valid,
            );
  
          if (
            invalid.length >
            0
          ) {
            const proceed =
              window.confirm(
                `Ada ${invalid.length} soal yang belum lengkap/valid.\n\nTetap simpan soal yang valid saja?`,
              );
  
            if (!proceed) {
              return;
            }
          }
  
          const validSoal =
            soalList.filter(
              q =>
                q.valid,
            );
  
          if (
            validSoal.length ===
            0
          ) {
            setSaveResult({
              success: false,
              error:
                'Tidak ada soal valid untuk disimpan.',
            });
  
            return;
          }
  
          setSaving(true);
          setSaveResult(null);
          setSaveLog([]);
  
          const logs = [];
  
          const addLog =
            message => {
              logs.push(
                message,
              );
  
              setSaveLog([
                ...logs,
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
                tag =>
                  tag.trim(),
              )
              .filter(Boolean),
            tingkatKesulitan,
            sumberFile,
            sumberAI,
          };
  
          // ----------------------------------------------------
          // CLONE
          // ----------------------------------------------------
  
          const soalProcessed =
            validSoal.map(
              q => ({
                ...q,
                gambar:
                  safeArray(
                    q.gambar,
                  ).map(
                    image => ({
                      ...image,
                    }),
                  ),
              }),
            );
  
          // ----------------------------------------------------
          // FIND BASE64 IMAGES
          // ----------------------------------------------------
  
          const toUpload = [];
  
          soalProcessed.forEach(
            (
              question,
              questionIndex,
            ) => {
              safeArray(
                question.gambar,
              ).forEach(
                (
                  image,
                  imageIndex,
                ) => {
                  if (
                    safeString(
                      image.dataUrl,
                    ).startsWith(
                      'data:image',
                    )
                  ) {
                    toUpload.push({
                      key: `q${questionIndex}-g${imageIndex}-${Date.now()}-${Math.random()
                        .toString(36)
                        .slice(
                          2,
                        )}`,
  
                      dataUrl:
                        image.dataUrl,
  
                      qi:
                        questionIndex,
  
                      gi:
                        imageIndex,
                    });
                  }
                },
              );
            },
          );
  
          // ----------------------------------------------------
          // UPLOAD IMAGES
          // ----------------------------------------------------
  
          if (
            toUpload.length >
            0
          ) {
            addLog(
              `⏳ Menyiapkan ${toUpload.length} gambar...`,
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
                            }),
                          ),
                      }),
                  },
                );
  
              let result = null;
  
              try {
                result =
                  await response.json();
              } catch (_) {
                result =
                  null;
              }
  
              if (
                !response.ok
              ) {
                throw new Error(
                  result?.error ||
                    `Server upload mengembalikan HTTP ${response.status}`,
                );
              }
  
              const urlMap =
                {};
  
              safeArray(
                result?.uploaded,
              ).forEach(
                upload => {
                  if (
                    upload?.key &&
                    upload?.url
                  ) {
                    urlMap[
                      upload.key
                    ] =
                      upload.url;
                  }
                },
              );
  
              let uploadedCount =
                0;
  
              toUpload.forEach(
                item => {
                  const uploadedUrl =
                    urlMap[
                      item.key
                    ];
  
                  if (
                    uploadedUrl
                  ) {
                    const images =
                      [
                        ...safeArray(
                          soalProcessed[
                            item.qi
                          ]
                            .gambar,
                        ),
                      ];
  
                    images[
                      item.gi
                    ] = {
                      ...images[
                        item.gi
                      ],
  
                      uploadedUrl,
  
                      dataUrl:
                        '',
                    };
  
                    soalProcessed[
                      item.qi
                    ] = {
                      ...soalProcessed[
                        item.qi
                      ],
  
                      gambar:
                        images,
                    };
  
                    uploadedCount++;
                  }
                },
              );
  
              addLog(
                `✅ ${uploadedCount}/${toUpload.length} gambar berhasil diproses.`,
              );
  
              const uploadErrors =
                safeArray(
                  result?.errors,
                );
  
              if (
                uploadErrors.length
              ) {
                addLog(
                  `⚠️ ${uploadErrors.length} gambar gagal diupload.`,
                );
              }
            } catch (error) {
              console.error(
                'Image upload error:',
                error,
              );
  
              addLog(
                `⚠️ Upload gambar gagal: ${
                  error?.message ||
                  'error tidak diketahui'
                }`,
              );
  
              addLog(
                'ℹ️ Proses penyimpanan tetap dilanjutkan. Gambar base64 yang gagal upload tidak akan menjadi URL.',
              );
            }
          }
  
          // ----------------------------------------------------
          // FIRESTORE
          // ----------------------------------------------------
  
          try {
            addLog(
              `📝 Menyimpan ${soalProcessed.length} soal valid ke Firestore...`,
            );
  
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
                  i + CHUNK,
                );
  
              const batch =
                writeBatch(db);
  
              chunk.forEach(
                question => {
                  const ref =
                    doc(
                      collection(
                        db,
                        BANK_SOAL_COLLECTION,
                      ),
                    );
  
                  batch.set(
                    ref,
                    buildDoc(
                      question,
                      meta,
                    ),
                  );
                },
              );
  
              await batch.commit();
  
              saved +=
                chunk.length;
  
              addLog(
                `💾 ${saved}/${soalProcessed.length} soal tersimpan...`,
              );
            }
  
            addLog(
              `🎉 Selesai! ${saved} soal berhasil masuk Bank Soal.`,
            );
  
            setSaveResult({
              success: true,
              count: saved,
              skipped:
                soalList.length -
                validSoal.length,
            });
          } catch (error) {
            console.error(
              'Firestore save error:',
              error,
            );
  
            addLog(
              `❌ Gagal simpan Firestore: ${
                error?.message ||
                'error tidak diketahui'
              }`,
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
        },
        [
          soalList,
          mataPelajaran,
          tingkatKelas,
          jenjang,
          kategori,
          tags,
          tingkatKesulitan,
          sumberFile,
          sumberAI,
        ],
      );
  
    // ==========================================================
    // RENDER
    // ==========================================================
  
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
  
            minHeight:
              '100vh',
  
            transition:
              'margin-left .2s',
          }}
        >
          <div
            className="
              p-4
              sm:p-6
              max-w-6xl
              mx-auto
              space-y-5
            "
          >
            {/* ==================================================
                HEADER
            ================================================== */}
  
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-bold text-gray-800">
                  Import Hasil Scan AI
                </h1>
  
                <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700 text-xs font-bold">
                  SAFE IMPORT
                </span>
              </div>
  
              <p className="text-gray-500 text-sm mt-1">
                Import soal hasil scan AI ke Bank
                Soal Gemilang dengan gambar,
                kunci jawaban, penanda jawaban
                benar, dan pembahasan.
              </p>
            </div>
  
            {/* ==================================================
                FORMAT
            ================================================== */}
  
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 space-y-4">
              <div className="flex flex-wrap gap-3 items-center">
                <span className="text-sm font-semibold text-gray-600">
                  Format:
                </span>
  
                {[
                  'json',
                  'csv',
                ].map(
                  currentFormat => (
                    <button
                      key={
                        currentFormat
                      }
                      type="button"
                      onClick={() => {
                        setFormat(
                          currentFormat,
                        );
  
                        setParseError(
                          '',
                        );
                      }}
                      className={`
                        px-4
                        py-2
                        rounded-lg
                        text-sm
                        font-bold
                        border
                        transition
                        ${
                          format ===
                          currentFormat
                            ? 'bg-blue-600 text-white border-blue-600'
                            : 'bg-white text-gray-600 border-gray-300 hover:border-blue-400'
                        }
                      `}
                    >
                      {currentFormat.toUpperCase()}
  
                      <span className="ml-1 text-[10px] opacity-70">
                        {currentFormat ===
                        'json'
                          ? 'Gambar + pembahasan'
                          : 'Teks'}
                      </span>
                    </button>
                  ),
                )}
  
                <label className="cursor-pointer ml-auto px-4 py-2 rounded-lg border border-gray-300 text-sm font-semibold text-gray-600 hover:border-blue-400 bg-white">
                  📂 Pilih File
  
                  <input
                    type="file"
                    accept=".json,.csv,application/json,text/csv"
                    onChange={
                      handleFile
                    }
                    className="hidden"
                  />
                </label>
              </div>
  
              {/* SOURCE */}
  
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
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
                        e.target
                          .value,
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
                    Nama File Sumber
                  </label>
  
                  <input
                    type="text"
                    value={
                      sumberFile
                    }
                    onChange={e =>
                      setSumberFile(
                        e.target
                          .value,
                      )
                    }
                    placeholder="Contoh: TO TKA Matematika.pdf"
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
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs text-gray-500">
                    Paste{' '}
                    {format.toUpperCase()}
                  </label>
  
                  <span className="text-[11px] text-gray-400">
                    Aman untuk JSON besar
                  </span>
                </div>
  
                <textarea
                  rows={14}
                  value={
                    rawInput
                  }
                  onChange={e =>
                    setRawInput(
                      e.target
                        .value,
                    )
                  }
                  spellCheck="false"
                  placeholder={
                    format ===
                    'json'
                      ? `[
    {
      "nomor": 1,
      "tipe": "pg_sederhana",
      "teks_soal": "Berapakah hasil $2+3$?",
      "opsi_jawaban": [
        "4",
        "5",
        "6",
        "7"
      ],
      "kunci_jawaban": "B",
      "pembahasan": "2 + 3 = 5.",
      "gambar": []
    }
  ]`
                      : `Nomor,Tipe,Soal,Opsi A,Opsi B,Opsi C,Opsi D,Opsi E,Kunci,Pembahasan
  1,pg_sederhana,"Berapakah 2+3?",4,5,6,7,8,B,"2+3=5"`
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
                    leading-6
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
                <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">
                  <div className="font-bold mb-1">
                    ❌ JSON/CSV tidak
                    dapat diproses
                  </div>
  
                  <div>
                    {parseError}
                  </div>
                </div>
              )}
  
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
  
                {soalList.length >
                  0 && (
                  <button
                    type="button"
                    onClick={() =>
                      downloadJSON(
                        soalList,
                      )
                    }
                    className="
                      px-5
                      py-2.5
                      bg-gray-800
                      hover:bg-gray-900
                      text-white
                      rounded-xl
                      text-sm
                      font-bold
                    "
                  >
                    ⬇️ Download JSON
                  </button>
                )}
  
                {rawInput && (
                  <button
                    type="button"
                    onClick={() => {
                      setRawInput(
                        '',
                      );
  
                      setSoalList(
                        [],
                      );
  
                      setParseError(
                        '',
                      );
  
                      setWarnings(
                        [],
                      );
                    }}
                    className="
                      px-5
                      py-2.5
                      bg-white
                      hover:bg-gray-50
                      text-gray-700
                      border
                      border-gray-300
                      rounded-xl
                      text-sm
                      font-bold
                    "
                  >
                    🗑️ Bersihkan
                  </button>
                )}
              </div>
            </div>
  
            {/* ==================================================
                WARNING
            ================================================== */}
  
            {warnings.length >
              0 && (
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5">
                <div className="font-bold text-amber-800 mb-2">
                  ⚠️ Ada soal yang perlu
                  diperiksa
                </div>
  
                <div className="space-y-1 max-h-48 overflow-auto">
                  {warnings.map(
                    (
                      warning,
                      index,
                    ) => (
                      <div
                        key={
                          index
                        }
                        className="text-xs text-amber-700"
                      >
                        {warning}
                      </div>
                    ),
                  )}
                </div>
  
                <div className="text-xs text-amber-700 mt-3">
                  Soal yang valid tetap
                  bisa disimpan.
                </div>
              </div>
            )}
  
            {/* ==================================================
                STATS
            ================================================== */}
  
            {soalList.length >
              0 && (
              <>
                <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
                  <StatCard
                    label="Total"
                    value={
                      statistik.total
                    }
                    icon="📚"
                  />
  
                  <StatCard
                    label="Valid"
                    value={
                      statistik.valid
                    }
                    icon="✅"
                    good
                  />
  
                  <StatCard
                    label="Perlu Cek"
                    value={
                      statistik.invalid
                    }
                    icon="⚠️"
                  />
  
                  <StatCard
                    label="Gambar"
                    value={
                      statistik.denganGambar
                    }
                    icon="🖼️"
                  />
  
                  <StatCard
                    label="Kunci"
                    value={
                      statistik.denganKunci
                    }
                    icon="🔑"
                  />
  
                  <StatCard
                    label="Pembahasan"
                    value={
                      statistik.denganPembahasan
                    }
                    icon="💡"
                  />
                </div>
  
                {/* ==================================================
                    PREVIEW
                ================================================== */}
  
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 space-y-5">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <h2 className="font-bold text-gray-800 text-lg">
                        Preview —{' '}
                        {
                          soalList.length
                        }{' '}
                        soal
                      </h2>
  
                      <p className="text-xs text-gray-500 mt-1">
                        Gambar ditampilkan tanpa
                        cropping.
                      </p>
                    </div>
  
                    <button
                      type="button"
                      onClick={() =>
                        downloadJSON(
                          soalList,
                        )
                      }
                      className="
                        px-4
                        py-2
                        bg-gray-100
                        hover:bg-gray-200
                        text-gray-700
                        rounded-lg
                        text-xs
                        font-bold
                      "
                    >
                      ⬇️ Export JSON
                    </button>
                  </div>
  
                  <div className="space-y-4 max-h-[700px] overflow-y-auto pr-1">
                    {soalList
                      .slice(
                        0,
                        100,
                      )
                      .map(
                        (
                          q,
                          index,
                        ) => (
                          <QuestionPreview
                            key={`${q.nomor}-${index}`}
                            question={
                              q
                            }
                            mathReady={
                              mathReady
                            }
                          />
                        ),
                      )}
  
                    {soalList.length >
                      100 && (
                      <div className="text-center text-xs text-gray-400 py-3">
                        Menampilkan 100
                        soal pertama dari{' '}
                        {
                          soalList.length
                        }
                        .
                      </div>
                    )}
                  </div>
  
                  {/* ==================================================
                      METADATA
                  ================================================== */}
  
                  <div className="border-t border-gray-100 pt-5">
                    <h3 className="font-bold text-gray-700 mb-3">
                      Metadata Soal
                    </h3>
  
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                      <Field label="Mata Pelajaran">
                        <select
                          value={
                            mataPelajaran
                          }
                          onChange={e =>
                            setMataPelajaran(
                              e.target
                                .value,
                            )
                          }
                          className="input"
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
                                {
                                  mapel
                                }
                              </option>
                            ),
                          )}
                        </select>
                      </Field>
  
                      <Field label="Jenjang">
                        <select
                          value={
                            jenjang
                          }
                          onChange={e =>
                            setJenjang(
                              e.target
                                .value,
                            )
                          }
                          className="input"
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
                                {
                                  item
                                }
                              </option>
                            ),
                          )}
                        </select>
                      </Field>
  
                      <Field label="Kelas">
                        <select
                          value={
                            tingkatKelas
                          }
                          onChange={e =>
                            setTingkatKelas(
                              e.target
                                .value,
                            )
                          }
                          className="input"
                        >
                          {DAFTAR_KELAS.map(
                            item => (
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
                            ),
                          )}
                        </select>
                      </Field>
  
                      <Field label="Kategori / Bab">
                        <input
                          value={
                            kategori
                          }
                          onChange={e =>
                            setKategori(
                              e.target
                                .value,
                            )
                          }
                          placeholder="Contoh: Eksponen"
                          className="input"
                        />
                      </Field>
  
                      <Field label="Kesulitan">
                        <select
                          value={
                            tingkatKesulitan
                          }
                          onChange={e =>
                            setTingkatKesulitan(
                              e.target
                                .value,
                            )
                          }
                          className="input"
                        >
                          {DAFTAR_KESULITAN.map(
                            item => (
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
                                    0,
                                  )
                                  .toUpperCase() +
                                  item.slice(
                                    1,
                                  )}
                              </option>
                            ),
                          )}
                        </select>
                      </Field>
  
                      <Field label="Tags">
                        <input
                          value={
                            tags
                          }
                          onChange={e =>
                            setTags(
                              e.target
                                .value,
                            )
                          }
                          placeholder="TKA, HOTS, UTBK"
                          className="input"
                        />
                      </Field>
                    </div>
                  </div>
  
                  {/* ==================================================
                      SAVE LOG
                  ================================================== */}
  
                  {saveLog.length >
                    0 && (
                    <div className="bg-gray-950 rounded-xl p-4 max-h-48 overflow-y-auto">
                      {saveLog.map(
                        (
                          log,
                          index,
                        ) => (
                          <div
                            key={
                              index
                            }
                            className="text-xs text-green-400 font-mono mb-1"
                          >
                            {log}
                          </div>
                        ),
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
                        ${
                          saveResult.success
                            ? 'bg-green-50 border border-green-200 text-green-700'
                            : 'bg-red-50 border border-red-200 text-red-700'
                        }
                      `}
                    >
                      {saveResult.success ? (
                        <>
                          <div className="font-bold">
                            🎉 Berhasil!
                          </div>
  
                          <div className="mt-1">
                            {
                              saveResult.count
                            }{' '}
                            soal berhasil
                            disimpan ke
                            Bank Soal.
                          </div>
  
                          {saveResult.skipped >
                            0 && (
                            <div className="text-xs mt-1">
                              {
                                saveResult.skipped
                              }{' '}
                              soal dilewati
                              karena tidak
                              valid.
                            </div>
                          )}
                        </>
                      ) : (
                        <>
                          <div className="font-bold">
                            ❌ Gagal
                          </div>
  
                          <div className="mt-1">
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
                    <div className="flex flex-wrap justify-end gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          downloadJSON(
                            soalList,
                          )
                        }
                        className="
                          px-5
                          py-3
                          bg-gray-800
                          hover:bg-gray-900
                          text-white
                          rounded-xl
                          text-sm
                          font-bold
                        "
                      >
                        ⬇️ Download JSON
                      </button>
  
                      <button
                        type="button"
                        onClick={
                          handleSave
                        }
                        disabled={
                          saving
                        }
                        className="
                          px-6
                          py-3
                          bg-emerald-600
                          hover:bg-emerald-700
                          text-white
                          rounded-xl
                          text-sm
                          font-bold
                          disabled:opacity-50
                          disabled:cursor-not-allowed
                        "
                      >
                        {saving
                          ? '⏳ Menyimpan...'
                          : `💾 Simpan Soal Valid ke Bank Soal`}
                      </button>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </main>
  
        {/* ========================================================
            GLOBAL LOCAL CSS
        ======================================================== */}
  
        <style>
          {`
            .input {
              width: 100%;
              border: 1px solid #d1d5db;
              border-radius: 8px;
              padding: 8px 12px;
              font-size: 14px;
              outline: none;
              background: white;
            }
  
            .input:focus {
              border-color: #3b82f6;
              box-shadow: 0 0 0 2px rgba(59,130,246,.15);
            }
  
            .math-fallback {
              display: inline-block;
              padding: 1px 4px;
              border-radius: 4px;
              background: #f3f4f6;
              color: #374151;
              font-family: Georgia, serif;
            }
  
            .katex-display {
              overflow-x: auto;
              overflow-y: hidden;
              padding: 4px 0;
            }
  
            @media (max-width: 640px) {
              .katex-display {
                max-width: 100%;
              }
            }
          `}
        </style>
      </div>
    );
  }
  
  // ============================================================
  // STAT CARD
  // ============================================================
  
  function StatCard({
    label,
    value,
    icon,
    good = false,
  }) {
    return (
      <div
        className={`
          rounded-xl
          border
          p-3
          ${
            good
              ? 'bg-green-50 border-green-200'
              : 'bg-white border-gray-200'
          }
        `}
      >
        <div className="text-lg">
          {icon}
        </div>
  
        <div className="text-xl font-bold text-gray-800">
          {value}
        </div>
  
        <div className="text-[11px] text-gray-500">
          {label}
        </div>
      </div>
    );
  }
  
  // ============================================================
  // FIELD
  // ============================================================
  
  function Field({
    label,
    children,
  }) {
    return (
      <div>
        <label className="text-xs text-gray-500 mb-1 block">
          {label}
        </label>
  
        {children}
      </div>
    );
  }
  
  // ============================================================
  // QUESTION PREVIEW
  // ============================================================
  
  function QuestionPreview({
    question,
    mathReady,
  }) {
    const q =
      question;
  
    const correctIndexes =
      safeArray(
        q.opsi_benar,
      );
  
    return (
      <div
        className={`
          rounded-2xl
          border
          p-4
          ${
            q.valid
              ? 'border-gray-200 bg-gray-50'
              : 'border-amber-300 bg-amber-50'
          }
        `}
      >
        {/* HEADER */}
  
        <div className="flex flex-wrap items-center gap-2 mb-3">
          <span className="px-2.5 py-1 bg-blue-100 text-blue-700 text-xs font-bold rounded-full">
            Soal {q.nomor}
          </span>
  
          <span className="px-2.5 py-1 bg-violet-100 text-violet-700 text-xs font-bold rounded-full">
            {TIPE_LABELS[
              q.tipe
            ] ||
              q.tipe}
          </span>
  
          {q.valid ? (
            <span className="px-2.5 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-full">
              ✓ Valid
            </span>
          ) : (
            <span className="px-2.5 py-1 bg-amber-100 text-amber-700 text-xs font-bold rounded-full">
              ⚠ Perlu cek
            </span>
          )}
  
          {q.kunci_jawaban && (
            <span className="px-2.5 py-1 bg-emerald-100 text-emerald-700 text-xs font-bold rounded-full font-mono">
              Kunci:{' '}
              {
                q.kunci_jawaban
              }
            </span>
          )}
  
          {q.gambar?.length >
            0 && (
            <span className="px-2.5 py-1 bg-purple-100 text-purple-700 text-xs font-bold rounded-full">
              🖼️{' '}
              {
                q.gambar
                  .length
              }{' '}
              gambar
            </span>
          )}
  
          {q.pembahasan && (
            <span className="px-2.5 py-1 bg-cyan-100 text-cyan-700 text-xs font-bold rounded-full">
              💡 Pembahasan
            </span>
          )}
        </div>
  
        {/* ERROR */}
  
        {q.errors?.length >
          0 && (
          <div className="mb-3 rounded-lg bg-white border border-amber-200 p-3 text-xs text-amber-700">
            {q.errors.map(
              (
                error,
                index,
              ) => (
                <div
                  key={
                    index
                  }
                >
                  ⚠️ {error}
                </div>
              ),
            )}
          </div>
        )}
  
        {/* QUESTION */}
  
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
  
        {/* OPTIONS */}
  
        {q.opsi_jawaban
          ?.length >
          0 && (
          <div className="mt-4 space-y-2">
            {q.opsi_jawaban.map(
              (
                option,
                optionIndex,
              ) => {
                const isCorrect =
                  Boolean(
                    correctIndexes[
                      optionIndex
                    ],
                  );
  
                return (
                  <div
                    key={
                      optionIndex
                    }
                    className={`
                      flex
                      gap-3
                      items-start
                      rounded-xl
                      border
                      px-3
                      py-2.5
                      ${
                        isCorrect
                          ? 'bg-green-50 border-green-300'
                          : 'bg-white border-gray-200'
                      }
                    `}
                  >
                    <div
                      className={`
                        flex
                        items-center
                        justify-center
                        w-7
                        h-7
                        rounded-full
                        text-xs
                        font-bold
                        flex-shrink-0
                        ${
                          isCorrect
                            ? 'bg-green-600 text-white'
                            : 'bg-gray-100 text-gray-600'
                        }
                      `}
                    >
                      {optionLetter(
                        optionIndex,
                      )}
                    </div>
  
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
                      <span className="text-green-600 text-xs font-bold whitespace-nowrap">
                        ✓ BENAR
                      </span>
                    )}
                  </div>
                );
              },
            )}
          </div>
        )}
  
        {/* TRUE FALSE */}
  
        {q.tabel_benar_salah
          ?.length >
          0 && (
          <div className="mt-4 rounded-xl border border-gray-200 bg-white overflow-hidden">
            <div className="px-3 py-2 bg-gray-100 text-xs font-bold text-gray-700">
              Pernyataan
            </div>
  
            {q.tabel_benar_salah.map(
              (
                item,
                index,
              ) => (
                <div
                  key={
                    index
                  }
                  className="grid grid-cols-1 md:grid-cols-[1fr_120px] border-t border-gray-200"
                >
                  <div className="p-3 text-sm">
                    {typeof item ===
                    'object' ? (
                      <RichText
                        text={
                          item.pernyataan
                        }
                        gambar={
                          []
                        }
                        mathReady={
                          mathReady
                        }
                      />
                    ) : (
                      item
                    )}
                  </div>
  
                  <div className="p-3 text-sm font-bold text-center">
                    {typeof item ===
                    'object'
                      ? item.jawaban
                      : ''}
                  </div>
                </div>
              ),
            )}
          </div>
        )}
  
        {/* MATCHING */}
  
        {q.pasangan?.length >
          0 && (
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-2">
            {q.pasangan.map(
              (
                pair,
                index,
              ) => (
                <div
                  key={
                    index
                  }
                  className="rounded-lg border border-gray-200 bg-white p-3 text-sm"
                >
                  <div className="font-semibold">
                    {pair.kiri}
                  </div>
  
                  <div className="text-blue-600 my-1">
                    ↕
                  </div>
  
                  <div>
                    {pair.kanan}
                  </div>
                </div>
              ),
            )}
          </div>
        )}
  
        {/* PEMBAHASAN */}
  
        {q.pembahasan && (
          <div className="mt-4 rounded-xl border border-cyan-200 bg-cyan-50 p-4">
            <div className="text-xs font-bold text-cyan-700 mb-2">
              💡 PEMBAHASAN
            </div>
  
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
        )}
  
        {/* VERIFIED */}
  
        {q.kunci_terverifikasi && (
          <div className="mt-3 text-xs text-green-700 font-semibold">
            ✓ Kunci jawaban
            terverifikasi.
          </div>
        )}
      </div>
    );
  }