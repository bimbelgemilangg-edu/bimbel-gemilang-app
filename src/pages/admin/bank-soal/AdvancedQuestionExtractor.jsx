// src/pages/admin/bank-soal/AdvancedQuestionExtractor.jsx
// ============================================================
// ADVANCED QUESTION EXTRACTOR
// ============================================================
// Upload PDF soal ujian -> render halaman -> AI ekstrak JSON ->
// deteksi/crop diagram -> review/edit -> upload gambar ->
// Firestore bank_soal.
//
// FITUR BARU:
// - Pengaturan AI langsung dari halaman Admin
// - Provider
// - API Key
// - Base URL
// - Model
// - Test API
// - Konfigurasi disimpan di sessionStorage
//
// API KEY TIDAK ditulis ke source code.
// API key dikirim hanya ketika request extraction/test.
//
// Backend:
//   /api/extractPdfBankSoal
//
// Storage gambar:
//   /api/uploadBankSoalImages
//
// Database:
//   Firestore -> bank_soal
// ============================================================

import React, {
  useState,
  useEffect,
  useRef,
  useMemo,
} from 'react';

import {
  UploadCloud,
  FileText,
  Play,
  CheckCircle,
  Loader2,
  Trash2,
  Edit3,
  Save,
  Image as ImageIcon,
  Layers,
  CheckSquare,
  Square,
  RefreshCw,
  Sparkles,
  X,
  Plus,
  Database,
  CloudUpload,
  Settings,
  Eye,
  EyeOff,
  Wifi,
  WifiOff,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  KeyRound,
  Cpu,
} from 'lucide-react';

import {
  collection,
  doc,
  writeBatch,
  serverTimestamp,
} from 'firebase/firestore';

import { db, auth } from '../../../firebase';

// ============================================================
// CONSTANTS
// ============================================================

const BANK_SOAL_COLLECTION = 'bank_soal';

const AI_STORAGE_KEY = 'gemilang_banksoal_ai_config';

const AI_PROVIDERS = [
  {
    value: 'openai-compatible',
    label: 'OpenAI Compatible',
    description:
      'OpenRouter, Groq, NVIDIA, Cerebras, Mistral, Together, dll.',
    defaultBaseUrl: '',
    defaultModel: '',
  },

  {
    value: 'openai',
    label: 'OpenAI',
    description: 'OpenAI Chat Completions',
    defaultBaseUrl:
      'https://api.openai.com/v1/chat/completions',
    defaultModel: 'gpt-4o',
  },

  {
    value: 'gemini',
    label: 'Google Gemini',
    description:
      'Endpoint OpenAI-compatible Gemini',
    defaultBaseUrl:
      'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions',
    defaultModel: 'gemini-2.0-flash',
  },

  {
    value: 'anthropic',
    label: 'Anthropic',
    description: 'Claude Messages API',
    defaultBaseUrl:
      'https://api.anthropic.com/v1/messages',
    defaultModel:
      'claude-3-5-sonnet-20241022',
  },
];

const DEFAULT_AI_CONFIG = {
  provider: 'openai-compatible',
  apiKey: '',
  baseUrl: '',
  model: '',
};

// ============================================================
// FIRESTORE DOCUMENT BUILDER
// ============================================================

function buildBankSoalDoc(q, meta) {
  return {
    soal: q.teks_soal || '',
    tipe: q.tipe || 'pg_sederhana',

    pernyataan:
      Array.isArray(q.pernyataan)
        ? q.pernyataan
        : [],

    opsiJawaban:
      Array.isArray(q.opsi_jawaban)
        ? q.opsi_jawaban
        : [],

    tabelBenarSalah:
      Array.isArray(q.tabel_benar_salah)
        ? q.tabel_benar_salah
        : [],

    kunciJawaban:
      q.kunci_jawaban || '',

    gambarUrls:
      Array.isArray(q.gambar)
        ? q.gambar
            .filter(
              (g) =>
                g &&
                typeof g.url === 'string' &&
                g.url
            )
            .map((g) => g.url)
        : [],

    mataPelajaran:
      meta.mataPelajaran || '',

    tingkatKelas:
      meta.tingkatKelas || '',

    sumberFile:
      meta.fileName || '',

    sumberHalaman:
      q.__sourcePage || null,

    createdAt:
      serverTimestamp(),

    createdBy:
      auth.currentUser?.uid || null,

    status:
      'aktif',
  };
}

// ============================================================
// COMPONENT
// ============================================================

export default function AdvancedQuestionExtractor() {
  // ----------------------------------------------------------
  // AI CONFIG
  // ----------------------------------------------------------

  const [aiConfig, setAiConfig] = useState(
    DEFAULT_AI_CONFIG
  );

  const [showApiSettings, setShowApiSettings] =
    useState(true);

  const [showApiKey, setShowApiKey] =
    useState(false);

  const [aiTestState, setAiTestState] =
    useState('idle');
  // idle | testing | success | error

  const [aiTestMessage, setAiTestMessage] =
    useState('');

  // ----------------------------------------------------------
  // PDF / APPLICATION
  // ----------------------------------------------------------

  const [isPdfReady, setIsPdfReady] =
    useState(false);

  const [isMathReady, setIsMathReady] =
    useState(false);

  const [file, setFile] =
    useState(null);

  const [appState, setAppState] =
    useState('idle');
  // idle
  // preview
  // processing
  // editing
  // saving
  // done
  // error

  const [logs, setLogs] =
    useState([]);

  const [progress, setProgress] =
    useState({
      current: 0,
      total: 0,
    });

  const [extractedData, setExtractedData] =
    useState([]);

  const [editingId, setEditingId] =
    useState(null);

  const [editForm, setEditForm] =
    useState({});

  const [pdfDocument, setPdfDocument] =
    useState(null);

  const [totalPages, setTotalPages] =
    useState(0);

  const [selectedPages, setSelectedPages] =
    useState([]);

  const [coverThumbnail, setCoverThumbnail] =
    useState(null);

  const [activeTab, setActiveTab] =
    useState('questions');

  const [mataPelajaran, setMataPelajaran] =
    useState('Matematika');

  const [tingkatKelas, setTingkatKelas] =
    useState('10');

  const [isDragging, setIsDragging] =
    useState(false);

  const logsEndRef =
    useRef(null);

  const settings = {
    resolution: 2.5,
    delayBetweenPages: 3000,
  };

  // ==========================================================
  // AI CONFIG HELPERS
  // ==========================================================

  const getSelectedProvider = () =>
    AI_PROVIDERS.find(
      (item) =>
        item.value === aiConfig.provider
    ) || AI_PROVIDERS[0];

  const providerNeedsBaseUrl =
    aiConfig.provider ===
    'openai-compatible';

  const updateAiConfig = (patch) => {
    setAiConfig((prev) => ({
      ...prev,
      ...patch,
    }));

    setAiTestState('idle');
    setAiTestMessage('');
  };

  const saveAiConfigToSession = (config) => {
    try {
      sessionStorage.setItem(
        AI_STORAGE_KEY,
        JSON.stringify({
          provider:
            config.provider || '',
          apiKey:
            config.apiKey || '',
          baseUrl:
            config.baseUrl || '',
          model:
            config.model || '',
        })
      );
    } catch {}
  };

  const loadAiConfigFromSession = () => {
    try {
      const raw =
        sessionStorage.getItem(
          AI_STORAGE_KEY
        );

      if (!raw) {
        return;
      }

      const parsed =
        JSON.parse(raw);

      setAiConfig({
        provider:
          parsed.provider ||
          DEFAULT_AI_CONFIG.provider,

        apiKey:
          parsed.apiKey || '',

        baseUrl:
          parsed.baseUrl || '',

        model:
          parsed.model || '',
      });
    } catch {}
  };

  useEffect(() => {
    loadAiConfigFromSession();
  }, []);

  const applyProviderDefaults = (
    providerValue
  ) => {
    const provider =
      AI_PROVIDERS.find(
        (item) =>
          item.value === providerValue
      ) || AI_PROVIDERS[0];

    setAiConfig((prev) => ({
      ...prev,

      provider:
        provider.value,

      baseUrl:
        provider.defaultBaseUrl ||
        (
          providerValue ===
          prev.provider
            ? prev.baseUrl
            : ''
        ),

      model:
        provider.defaultModel ||
        (
          providerValue ===
          prev.provider
            ? prev.model
            : ''
        ),
    }));

    setAiTestState('idle');
    setAiTestMessage('');
  };

  const validateAiConfig = () => {
    if (
      !aiConfig.apiKey ||
      !aiConfig.apiKey.trim()
    ) {
      return 'API Key belum diisi.';
    }

    if (
      aiConfig.provider ===
        'openai-compatible' &&
      !aiConfig.baseUrl.trim()
    ) {
      return 'Base URL wajib diisi untuk OpenAI Compatible.';
    }

    if (
      !aiConfig.model ||
      !aiConfig.model.trim()
    ) {
      return 'Model belum diisi.';
    }

    return '';
  };

  // ==========================================================
  // TEST API
  // ==========================================================

  const testApiConnection = async () => {
    const validation =
      validateAiConfig();

    if (validation) {
      setAiTestState('error');
      setAiTestMessage(validation);
      return;
    }

    setAiTestState('testing');
    setAiTestMessage(
      'Menghubungkan ke provider AI...'
    );

    try {
      const response =
        await fetch(
          '/api/extractPdfBankSoal',
          {
            method: 'POST',

            headers: {
              'Content-Type':
                'application/json',
            },

            body: JSON.stringify({
              testOnly: true,

              provider:
                aiConfig.provider,

              apiKey:
                aiConfig.apiKey,

              baseUrl:
                aiConfig.baseUrl,

              model:
                aiConfig.model,
            }),
          }
        );

      const result =
        await response.json()
          .catch(() => ({}));

      if (
        !response.ok ||
        !result.success
      ) {
        throw new Error(
          result.error ||
            `HTTP ${response.status}`
        );
      }

      saveAiConfigToSession(
        aiConfig
      );

      setAiTestState('success');

      setAiTestMessage(
        `Terhubung: ${
          result.model ||
          aiConfig.model
        }`
      );

      addLog(
        `API berhasil dites. Provider: ${aiConfig.provider}, Model: ${aiConfig.model}`,
        'success'
      );
    } catch (error) {
      setAiTestState('error');

      setAiTestMessage(
        error?.message ||
          'Gagal menghubungkan API.'
      );

      addLog(
        `Test API gagal: ${
          error?.message ||
          'Unknown error'
        }`,
        'error'
      );
    }
  };

  // ==========================================================
  // PDF.JS
  // ==========================================================

  useEffect(() => {
    const existing =
      document.querySelector(
        'script[data-gemilang-pdfjs]'
      );

    if (existing) {
      if (window.pdfjsLib) {
        setIsPdfReady(true);
      }

      return;
    }

    const script =
      document.createElement(
        'script'
      );

    script.dataset.gemilangPdfjs =
      'true';

    script.src =
      'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';

    script.async = true;

    script.onload = () => {
      try {
        window.pdfjsLib.GlobalWorkerOptions.workerSrc =
          'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

        setIsPdfReady(true);

        addLog(
          'Mesin PDF.js siap.',
          'success'
        );
      } catch (error) {
        addLog(
          `PDF.js gagal diinisialisasi: ${error.message}`,
          'error'
        );
      }
    };

    script.onerror = () => {
      addLog(
        'Gagal memuat PDF.js.',
        'error'
      );
    };

    document.body.appendChild(
      script
    );

    return () => {
      // sengaja tidak menghapus script,
      // agar navigasi halaman tidak membuat
      // PDF.js dimuat berulang kali.
    };
  }, []);

  // ==========================================================
  // KATEX
  // ==========================================================

  useEffect(() => {
    const existingCss =
      document.querySelector(
        'link[data-gemilang-katex]'
      );

    const existingScript =
      document.querySelector(
        'script[data-gemilang-katex]'
      );

    if (existingCss && existingScript) {
      if (
        window.renderMathInElement
      ) {
        setIsMathReady(true);
      }

      return;
    }

    const css =
      document.createElement(
        'link'
      );

    css.dataset.gemilangKatex =
      'true';

    css.rel = 'stylesheet';

    css.href =
      'https://cdnjs.cloudflare.com/ajax/libs/KaTeX/0.16.9/katex.min.css';

    document.head.appendChild(
      css
    );

    const coreScript =
      document.createElement(
        'script'
      );

    coreScript.dataset.gemilangKatex =
      'true';

    coreScript.src =
      'https://cdnjs.cloudflare.com/ajax/libs/KaTeX/0.16.9/katex.min.js';

    coreScript.async = true;

    coreScript.onload = () => {
      const autoRender =
        document.createElement(
          'script'
        );

      autoRender.dataset.gemilangKatex =
        'true';

      autoRender.src =
        'https://cdnjs.cloudflare.com/ajax/libs/KaTeX/0.16.9/contrib/auto-render.min.js';

      autoRender.async = true;

      autoRender.onload = () => {
        setIsMathReady(true);
      };

      document.body.appendChild(
        autoRender
      );
    };

    document.body.appendChild(
      coreScript
    );

    return () => {
      // CSS/script sengaja dipertahankan
      // untuk menghindari reload yang tidak perlu.
    };
  }, []);

  // ==========================================================
  // LOG
  // ==========================================================

  useEffect(() => {
    logsEndRef.current?.scrollIntoView({
      behavior: 'smooth',
    });
  }, [logs]);

  const addLog = (
    message,
    type = 'info'
  ) => {
    const timestamp =
      new Date().toLocaleTimeString(
        'id-ID',
        {
          hour12: false,
        }
      );

    setLogs((prev) => [
      ...prev,

      {
        id:
          Date.now() +
          Math.random(),

        time: timestamp,

        message,

        type,
      },
    ]);
  };

  const sleep = (ms) =>
    new Promise((resolve) =>
      setTimeout(resolve, ms)
    );

  // ==========================================================
  // PDF RENDER
  // ==========================================================

  const renderPageToCanvas =
    async (
      page,
      scale = 2
    ) => {
      const viewport =
        page.getViewport({
          scale,
        });

      const canvas =
        document.createElement(
          'canvas'
        );

      const context =
        canvas.getContext('2d');

      canvas.height =
        viewport.height;

      canvas.width =
        viewport.width;

      await page.render({
        canvasContext:
          context,

        viewport,
      }).promise;

      return canvas;
    };

  // ==========================================================
  // FILE UPLOAD
  // ==========================================================

  const handleFileUpload =
    async (e) => {
      const selectedFile =
        e.target.files?.[0];

      await loadPdfFile(
        selectedFile
      );
    };

  const loadPdfFile =
    async (selectedFile) => {
      if (
        !selectedFile ||
        selectedFile.type !==
          'application/pdf'
      ) {
        addLog(
          'Harap unggah file PDF yang valid.',
          'error'
        );

        return;
      }

      if (!isPdfReady) {
        addLog(
          'Pustaka PDF belum siap, tunggu sebentar...',
          'warning'
        );

        return;
      }

      setFile(
        selectedFile
      );

      setExtractedData([]);

      setLogs([]);

      setAiTestState(
        aiConfig.apiKey
          ? aiTestState
          : 'idle'
      );

      addLog(
        `File terdeteksi: ${selectedFile.name}`,
        'success'
      );

      setAppState(
        'preview'
      );

      try {
        const arrayBuffer =
          await selectedFile.arrayBuffer();

        const pdf =
          await window.pdfjsLib
            .getDocument({
              data: arrayBuffer,
            })
            .promise;

        setPdfDocument(
          pdf
        );

        setTotalPages(
          pdf.numPages
        );

        setSelectedPages(
          Array.from(
            {
              length:
                pdf.numPages,
            },

            (_, i) =>
              i + 1
          )
        );

        const page1 =
          await pdf.getPage(1);

        const cover =
          await renderPageToCanvas(
            page1,
            0.6
          );

        setCoverThumbnail(
          cover.toDataURL(
            'image/jpeg',
            0.9
          )
        );

        addLog(
          `PDF dimuat. ${pdf.numPages} halaman terdeteksi.`,
          'success'
        );
      } catch (error) {
        addLog(
          `Gagal memuat PDF: ${error.message}`,
          'error'
        );

        setAppState(
          'error'
        );
      }
    };

  const handleDrop =
    async (event) => {
      event.preventDefault();

      setIsDragging(false);

      const selectedFile =
        event.dataTransfer.files?.[0];

      await loadPdfFile(
        selectedFile
      );
    };

  // ==========================================================
  // DETECT DIAGRAM
  // ==========================================================

  const detectDiagramRegions =
    async (page) => {
      try {
        const opList =
          await page.getOperatorList();

        const OPS =
          window.pdfjsLib.OPS;

        const base =
          page.getViewport({
            scale: 1,
          });

        const W =
          base.width;

        const H =
          base.height;

        const boxes = [];

        let ctm =
          base.transform.slice();

        const stack = [];

        let cur = null;

        const mul =
          (m, n) => [
            m[0] * n[0] +
              m[2] * n[1],

            m[1] * n[0] +
              m[3] * n[1],

            m[0] * n[2] +
              m[2] * n[3],

            m[1] * n[2] +
              m[3] * n[3],

            m[0] * n[4] +
              m[2] * n[5] +
              m[4],

            m[1] * n[4] +
              m[3] * n[5] +
              m[5],
          ];

        const apply =
          (m, x, y) => [
            m[0] * x +
              m[2] * y +
              m[4],

            m[1] * x +
              m[3] * y +
              m[5],
          ];

        const startBox =
          () => {
            cur = {
              x0: Infinity,
              y0: Infinity,
              x1: -Infinity,
              y1: -Infinity,
              pts: 0,
            };
          };

        const addPt =
          (x, y) => {
            const [
              dx,
              dy,
            ] = apply(
              ctm,
              x,
              y
            );

            cur.x0 =
              Math.min(
                cur.x0,
                dx
              );

            cur.y0 =
              Math.min(
                cur.y0,
                dy
              );

            cur.x1 =
              Math.max(
                cur.x1,
                dx
              );

            cur.y1 =
              Math.max(
                cur.y1,
                dy
              );

            cur.pts++;
          };

        const endBox =
          () => {
            if (
              cur &&
              cur.pts > 0 &&
              cur.x1 >
                cur.x0 &&
              cur.y1 >
                cur.y0
            ) {
              boxes.push(
                cur
              );
            }

            cur =
              null;
          };

        const args =
          opList.argsArray;

        for (
          let i = 0;
          i <
          opList.fnArray.length;
          i++
        ) {
          const fn =
            opList.fnArray[
              i
            ];

          const a =
            args[i];

          if (
            fn ===
            OPS.save
          ) {
            stack.push(
              ctm.slice()
            );
          } else if (
            fn ===
            OPS.restore
          ) {
            ctm =
              stack.pop() ||
              ctm;
          } else if (
            fn ===
            OPS.transform
          ) {
            ctm =
              mul(
                ctm,
                a
              );
          } else if (
            fn ===
            OPS.constructPath
          ) {
            startBox();

            const ops =
              a[0];

            const coords =
              a[1];

            let p =
              0;

            for (
              let k = 0;
              k < ops.length;
              k++
            ) {
              const op =
                ops[k];

              if (
                op ===
                  OPS.moveTo ||
                op ===
                  OPS.lineTo
              ) {
                addPt(
                  coords[p],
                  coords[
                    p + 1
                  ]
                );

                p += 2;
              } else if (
                op ===
                OPS.curveTo
              ) {
                addPt(
                  coords[p],
                  coords[
                    p + 1
                  ]
                );

                addPt(
                  coords[
                    p + 2
                  ],
                  coords[
                    p + 3
                  ]
                );

                addPt(
                  coords[
                    p + 4
                  ],
                  coords[
                    p + 5
                  ]
                );

                p += 6;
              } else if (
                op ===
                  OPS.curveTo2 ||
                op ===
                  OPS.curveTo3
              ) {
                addPt(
                  coords[p],
                  coords[
                    p + 1
                  ]
                );

                addPt(
                  coords[
                    p + 2
                  ],
                  coords[
                    p + 3
                  ]
                );

                p += 4;
              } else if (
                op ===
                OPS.rectangle
              ) {
                addPt(
                  coords[p],
                  coords[
                    p + 1
                  ]
                );

                addPt(
                  coords[p] +
                    coords[
                      p + 2
                    ],

                  coords[
                    p + 1
                  ] +
                    coords[
                      p + 3
                    ]
                );

                p += 4;
              }
            }

            endBox();
          }
        }

        const EXPAND = 3;

        let rects =
          boxes
            .filter(
              (b) => {
                const w =
                  b.x1 -
                  b.x0;

                const h =
                  b.y1 -
                  b.y0;

                if (
                  w >
                    0.8 *
                      W &&
                  h < 3
                ) {
                  return false;
                }

                if (
                  b.y1 <
                    0.05 *
                      H ||
                  b.y0 >
                    0.95 *
                      H
                ) {
                  return false;
                }

                if (
                  w * h <
                  4
                ) {
                  return false;
                }

                return true;
              }
            )

            .map(
              (b) => [
                b.x0 -
                  EXPAND,

                b.y0 -
                  EXPAND,

                b.x1 +
                  EXPAND,

                b.y1 +
                  EXPAND,
              ]
            );

        let changed =
          true;

        while (changed) {
          changed =
            false;

          const out = [];

          while (
            rects.length
          ) {
            let a =
              rects.pop();

            let merged =
              true;

            while (
              merged
            ) {
              merged =
                false;

              const keep =
                [];

              for (
                const b of rects
              ) {
                const overlap =
                  a[0] <= b[2] &&
                  a[2] >= b[0] &&
                  a[1] <= b[3] &&
                  a[3] >= b[1];

                if (
                  overlap
                ) {
                  a = [
                    Math.min(
                      a[0],
                      b[0]
                    ),

                    Math.min(
                      a[1],
                      b[1]
                    ),

                    Math.max(
                      a[2],
                      b[2]
                    ),

                    Math.max(
                      a[3],
                      b[3]
                    ),
                  ];

                  merged =
                    true;

                  changed =
                    true;
                } else {
                  keep.push(
                    b
                  );
                }
              }

              rects =
                keep;
            }

            out.push(
              a
            );
          }

          rects =
            out;
        }

        return rects
          .filter(
            (r) =>
              r[2] - r[0] >
                25 &&
              r[3] - r[1] >
                25
          )

          .filter(
            (r) =>
              !(
                r[0] >
                  0.8 *
                    W &&
                r[1] >
                  0.85 *
                    H
              )
          )

          .map(
            (r) => ({
              x0:
                Math.max(
                  0,
                  r[0]
                ),

              y0:
                Math.max(
                  0,
                  r[1]
                ),

              x1:
                Math.min(
                  W,
                  r[2]
                ),

              y1:
                Math.min(
                  H,
                  r[3]
                ),
            })
          )

          .sort(
            (a, b) =>
              a.y0 -
              b.y0
          );
      } catch {
        return [];
      }
    };

  // ==========================================================
  // SHARP PAGE
  // ==========================================================

  const renderFullPageSharp =
    async (
      page,
      dpiScale = 4
    ) => {
      const vp =
        page.getViewport({
          scale: dpiScale,
        });

      const canvas =
        document.createElement(
          'canvas'
        );

      canvas.width =
        Math.ceil(
          vp.width
        );

      canvas.height =
        Math.ceil(
          vp.height
        );

      const ctx =
        canvas.getContext(
          '2d'
        );

      ctx.fillStyle =
        '#ffffff';

      ctx.fillRect(
        0,
        0,
        canvas.width,
        canvas.height
      );

      await page.render({
        canvasContext:
          ctx,

        viewport:
          vp,
      }).promise;

      return canvas;
    };

  const sliceRegionSharp =
    (
      fullCanvas,
      scale,
      region
    ) => {
      const sx =
        Math.round(
          region.x0 *
            scale
        );

      const sy =
        Math.round(
          region.y0 *
            scale
        );

      const sw =
        Math.round(
          (region.x1 -
            region.x0) *
            scale
        );

      const sh =
        Math.round(
          (region.y1 -
            region.y0) *
            scale
        );

      if (
        sw < 8 ||
        sh < 8
      ) {
        return null;
      }

      const out =
        document.createElement(
          'canvas'
        );

      out.width = sw;

      out.height = sh;

      const octx =
        out.getContext(
          '2d'
        );

      octx.fillStyle =
        '#ffffff';

      octx.fillRect(
        0,
        0,
        sw,
        sh
      );

      octx.drawImage(
        fullCanvas,
        sx,
        sy,
        sw,
        sh,
        0,
        0,
        sw,
        sh
      );

      return out.toDataURL(
        'image/png'
      );
    };

  // ==========================================================
  // AI EXTRACTION
  // ==========================================================

  const extractFromImageWithAI =
    async (
      base64Image,
      pageNum,
      onRateLimit
    ) => {
      const validation =
        validateAiConfig();

      if (validation) {
        throw new Error(
          validation
        );
      }

      // Simpan konfigurasi sesi
      saveAiConfigToSession(
        aiConfig
      );

      let retries = 5;

      let delay = 2000;

      const MAX_DELAY =
        30000;

      while (
        retries > 0
      ) {
        try {
          const response =
            await fetch(
              '/api/extractPdfBankSoal',
              {
                method:
                  'POST',

                headers: {
                  'Content-Type':
                    'application/json',
                },

                body: JSON.stringify({
                  image:
                    base64Image,

                  pageNum,

                  provider:
                    aiConfig.provider,

                  apiKey:
                    aiConfig.apiKey,

                  baseUrl:
                    aiConfig.baseUrl,

                  model:
                    aiConfig.model,
                }),
              }
            );

          if (
            response.status ===
              429 ||
            response.status >=
              500
          ) {
            retries--;

            if (
              retries === 0
            ) {
              const result =
                await response
                  .json()
                  .catch(
                    () => ({})
                  );

              throw new Error(
                result.error ||
                  `Server AI sibuk (status ${response.status}).`
              );
            }

            const waitMs =
              Math.min(
                delay,
                MAX_DELAY
              );

            onRateLimit?.(
              Math.round(
                waitMs / 1000
              ),

              response.status
            );

            await sleep(
              waitMs
            );

            delay =
              Math.min(
                delay * 2,
                MAX_DELAY
              );

            continue;
          }

          const result =
            await response
              .json()
              .catch(
                () => ({})
              );

          if (
            !response.ok ||
            !result.success
          ) {
            throw new Error(
              result.error ||
                `HTTP ${response.status}`
            );
          }

          return (
            result.questions ||
            []
          );
        } catch (
          err
        ) {
          retries--;

          if (
            retries === 0
          ) {
            throw err;
          }

          await sleep(
            Math.min(
              delay,
              MAX_DELAY
            )
          );

          delay =
            Math.min(
              delay * 2,
              MAX_DELAY
            );
        }
      }

      return [];
    };

  // ==========================================================
  // START PROCESSING
  // ==========================================================

  const startProcessing =
    async () => {
      const validation =
        validateAiConfig();

      if (validation) {
        setShowApiSettings(
          true
        );

        setAiTestState(
          'error'
        );

        setAiTestMessage(
          validation
        );

        addLog(
          validation,
          'error'
        );

        return;
      }

      if (
        !file ||
        !pdfDocument ||
        selectedPages.length ===
          0
      ) {
        return;
      }

      saveAiConfigToSession(
        aiConfig
      );

      setAppState(
        'processing'
      );

      setExtractedData([]);

      setProgress({
        current: 0,
        total:
          selectedPages.length,
      });

      setActiveTab(
        'terminal'
      );

      addLog(
        `Memulai ekstraksi AI untuk ${selectedPages.length} halaman...`,
        'info'
      );

      addLog(
        `Provider: ${aiConfig.provider}`,
        'info'
      );

      addLog(
        `Model: ${aiConfig.model}`,
        'info'
      );

      let allQuestions =
        [];

      const failedPages =
        [];

      for (
        let i = 0;
        i <
        selectedPages.length;
        i++
      ) {
        const pageNum =
          selectedPages[i];

        addLog(
          `[Hal ${pageNum}] Merender halaman...`,
          'info'
        );

        try {
          const page =
            await pdfDocument.getPage(
              pageNum
            );

          const pageCanvas =
            await renderPageToCanvas(
              page,
              settings.resolution
            );

          const base64Image =
            pageCanvas.toDataURL(
              'image/jpeg',
              0.92
            );

          addLog(
            `[Hal ${pageNum}] Mengirim ke AI...`,
            'info'
          );

          const onRateLimit =
            (
              secs,
              status
            ) =>
              addLog(
                `[Hal ${pageNum}] Server sibuk (${status}). Tunggu ${secs}s...`,
                'warning'
              );

          const [
            questions,
            regions,
          ] =
            await Promise.all([
              extractFromImageWithAI(
                base64Image,
                pageNum,
                onRateLimit
              ),

              detectDiagramRegions(
                page
              ),
            ]);

          if (
            questions.length >
            0
          ) {
            let renderedImages =
              [];

            if (
              regions.length >
              0
            ) {
              const sharpPage =
                await renderFullPageSharp(
                  page,
                  4
                );

              renderedImages =
                regions
                  .map(
                    (r) =>
                      sliceRegionSharp(
                        sharpPage,
                        4,
                        r
                      )
                  )

                  .filter(
                    Boolean
                  )

                  .map(
                    (url) => ({
                      url,
                    })
                  );
            }

            let imgPtr =
              0;

            const withImages =
              questions.map(
                (q) => {
                  const gambarList =
                    Array.isArray(
                      q.gambar
                    )
                      ? q.gambar
                      : [];

                  const gambar =
                    gambarList.map(
                      (g) => {
                        if (
                          imgPtr <
                          renderedImages.length
                        ) {
                          const img =
                            renderedImages[
                              imgPtr++
                            ];

                          return {
                            ...g,

                            dataUrl:
                              img.url,

                            metode:
                              'render-pdf',
                          };
                        }

                        return {
                          ...g,

                          dataUrl:
                            null,
                        };
                      }
                    );

                  return {
                    ...q,

                    gambar,

                    __sourcePage:
                      pageNum,
                  };
                }
              );

            allQuestions =
              [
                ...allQuestions,
                ...withImages,
              ];

            setExtractedData([
              ...allQuestions,
            ]);

            addLog(
              `[Hal ${pageNum}] Sukses, ${questions.length} soal ditemukan.`,
              'success'
            );
          } else {
            addLog(
              `[Hal ${pageNum}] Tidak ada soal ditemukan.`,
              'warning'
            );
          }
        } catch (
          err
        ) {
          failedPages.push(
            pageNum
          );

          addLog(
            `[Hal ${pageNum}] Gagal: ${err.message}`,
            'error'
          );
        }

        setProgress({
          current:
            i + 1,

          total:
            selectedPages.length,
        });

        if (
          i <
          selectedPages.length -
            1
        ) {
          await sleep(
            settings.delayBetweenPages
          );
        }
      }

      addLog(
        failedPages.length >
          0
          ? `Selesai dengan ${failedPages.length} halaman gagal. Total ${allQuestions.length} soal.`
          : `Selesai. Total ${allQuestions.length} soal berhasil diekstrak.`,

        failedPages.length >
          0
          ? 'warning'
          : 'success'
      );

      setAppState(
        'editing'
      );

      setActiveTab(
        'questions'
      );
    };

  // ==========================================================
  // EDIT
  // ==========================================================

  const handleEditClick =
    (
      q,
      index
    ) => {
      setEditingId(
        index
      );

      setEditForm({
        ...q,
      });
    };

  const handleSaveEdit =
    (index) => {
      const updated =
        [
          ...extractedData,
        ];

      updated[index] =
        editForm;

      setExtractedData(
        updated
      );

      setEditingId(
        null
      );
    };

  const handleDeleteQuestion =
    (index) => {
      setExtractedData(
        extractedData.filter(
          (_, i) =>
            i !== index
        )
      );
    };

  // ==========================================================
  // SAVE TO BANK SOAL
  // ==========================================================

  const saveToBankSoal =
    async () => {
      if (
        extractedData.length ===
        0
      ) {
        return;
      }

      setAppState(
        'saving'
      );

      addLog(
        'Mengunggah gambar diagram ke penyimpanan...',
        'info'
      );

      const imagesToUpload =
        [];

      extractedData.forEach(
        (
          q,
          qi
        ) => {
          (
            q.gambar || []
          ).forEach(
            (
              g,
              gi
            ) => {
              if (
                g.dataUrl &&
                g.dataUrl.startsWith(
                  'data:image'
                )
              ) {
                imagesToUpload.push({
                  key:
                    `soal-${Date.now()}-${qi}-${gi}`,

                  dataUrl:
                    g.dataUrl,

                  qi,

                  gi,
                });
              }
            }
          );
        }
      );

      let uploadedMap =
        {};

      if (
        imagesToUpload.length >
        0
      ) {
        try {
          const resp =
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
                  JSON.stringify(
                    {
                      images:
                        imagesToUpload.map(
                          (i) => ({
                            key:
                              i.key,

                            dataUrl:
                              i.dataUrl,
                          })
                        ),
                    }
                  ),
              }
            );

          const result =
            await resp
              .json()
              .catch(
                () => ({})
              );

          if (
            !resp.ok ||
            !result.success
          ) {
            throw new Error(
              result.error ||
                'Gagal upload gambar.'
            );
          }

          (
            result.uploaded ||
            []
          ).forEach(
            (u) => {
              uploadedMap[
                u.key
              ] =
                u.url;
            }
          );

          if (
            (
              result.errors ||
              []
            ).length > 0
          ) {
            addLog(
              `${result.errors.length} gambar gagal diupload, soal tetap disimpan tanpa gambar itu.`,
              'warning'
            );
          }

          addLog(
            `${(result.uploaded || []).length} gambar berhasil diunggah.`,
            'success'
          );
        } catch (
          err
        ) {
          addLog(
            `Gagal upload gambar: ${err.message}. Melanjutkan simpan tanpa gambar.`,
            'error'
          );
        }
      }

      const finalData =
        extractedData.map(
          (
            q,
            qi
          ) => {
            const gambar =
              (
                q.gambar ||
                []
              ).map(
                (
                  g,
                  gi
                ) => {
                  const match =
                    imagesToUpload.find(
                      (i) =>
                        i.qi ===
                          qi &&
                        i.gi ===
                          gi
                    );

                  if (
                    match &&
                    uploadedMap[
                      match.key
                    ]
                  ) {
                    return {
                      ...g,

                      url:
                        uploadedMap[
                          match.key
                        ],
                    };
                  }

                  return g;
                }
              );

            return {
              ...q,
              gambar,
            };
          }
        );

      addLog(
        `Menulis ${finalData.length} soal ke Firestore (koleksi "${BANK_SOAL_COLLECTION}")...`,
        'info'
      );

      try {
        const batch =
          writeBatch(
            db
          );

        finalData.forEach(
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

              buildBankSoalDoc(
                q,
                {
                  fileName:
                    file?.name ||
                    'dokumen.pdf',

                  mataPelajaran,

                  tingkatKelas,
                }
              )
            );
          }
        );

        await batch.commit();

        addLog(
          'Semua soal berhasil disimpan ke Bank Soal. Guru sudah bisa mengambilnya.',
          'success'
        );

        setAppState(
          'done'
        );
      } catch (
        err
      ) {
        addLog(
          `Gagal menyimpan ke Firestore: ${err.message}`,
          'error'
        );

        setAppState(
          'editing'
        );
      }
    };

  // ==========================================================
  // RESET
  // ==========================================================

  const resetAll =
    () => {
      setFile(null);

      setAppState(
        'idle'
      );

      setExtractedData(
        []
      );

      setLogs([]);

      setProgress({
        current: 0,
        total: 0,
      });

      setPdfDocument(
        null
      );

      setTotalPages(
        0
      );

      setSelectedPages(
        []
      );

      setCoverThumbnail(
        null
      );

      setEditingId(
        null
      );

      setEditForm(
        {}
      );

      setActiveTab(
        'questions'
      );
    };

  // ==========================================================
  // PROVIDER UI
  // ==========================================================

  const selectedProvider =
    getSelectedProvider();

  // ==========================================================
  // RENDER
  // ==========================================================

  return (
    <div
      style={{
        minHeight:
          '100vh',

        background:
          '#f8fafc',

        color:
          '#0f172a',

        fontFamily:
          'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',

        paddingBottom:
          40,
      }}
    >
      {/* ====================================================
          TOP HEADER
          ==================================================== */}

      <header
        style={{
          background:
            'linear-gradient(135deg, #0f172a 0%, #172554 100%)',

          color:
            'white',

          padding:
            '22px 28px',

          position:
            'sticky',

          top:
            0,

          zIndex:
            50,

          boxShadow:
            '0 8px 30px rgba(15,23,42,0.14)',
        }}
      >
        <div
          style={{
            maxWidth:
              1250,

            margin:
              '0 auto',

            display:
              'flex',

            justifyContent:
              'space-between',

            alignItems:
              'center',

            gap:
              20,

            flexWrap:
              'wrap',
          }}
        >
          <div
            style={{
              display:
                'flex',

              alignItems:
                'center',

              gap:
                14,
            }}
          >
            <div
              style={{
                width:
                  50,

                height:
                  50,

                borderRadius:
                  15,

                background:
                  'rgba(59,130,246,0.18)',

                border:
                  '1px solid rgba(96,165,250,0.3)',

                display:
                  'flex',

                alignItems:
                  'center',

                justifyContent:
                  'center',
              }}
            >
              <Sparkles
                size={
                  25
                }
              />
            </div>

            <div>
              <div
                style={{
                  fontSize:
                    21,

                  fontWeight:
                    800,

                  letterSpacing:
                    -0.4,
                }}
              >
                Scan Soal PDF
              </div>

              <div
                style={{
                  fontSize:
                    13,

                  color:
                    '#cbd5e1',

                  marginTop:
                    3,
                }}
              >
                Advanced Question Extractor
              </div>
            </div>
          </div>

          <div
            style={{
              display:
                'flex',

              alignItems:
                'center',

              gap:
                10,

              flexWrap:
                'wrap',
            }}
          >
            <div
              style={{
                display:
                  'inline-flex',

                alignItems:
                  'center',

                gap:
                  8,

                padding:
                  '8px 12px',

                borderRadius:
                  10,

                background:
                  'rgba(255,255,255,0.08)',

                border:
                  '1px solid rgba(255,255,255,0.12)',

                fontSize:
                  12,
              }}
            >
              <Cpu size={15} />

              <span>
                {aiConfig.model ||
                  'Model belum dipilih'}
              </span>
            </div>

            <button
              onClick={() =>
                setShowApiSettings(
                  (v) => !v
                )
              }
              style={{
                border:
                  '1px solid rgba(255,255,255,0.18)',

                background:
                  'rgba(255,255,255,0.08)',

                color:
                  'white',

                borderRadius:
                  10,

                padding:
                  '9px 13px',

                cursor:
                  'pointer',

                fontWeight:
                  700,

                display:
                  'flex',

                alignItems:
                  'center',

                gap:
                  8,
              }}
            >
              <Settings size={16} />

              AI Settings

              {showApiSettings ? (
                <ChevronUp
                  size={
                    15
                  }
                />
              ) : (
                <ChevronDown
                  size={
                    15
                  }
                />
              )}
            </button>
          </div>
        </div>
      </header>

      {/* ====================================================
          MAIN
          ==================================================== */}

      <main
        style={{
          maxWidth:
            1250,

          margin:
            '0 auto',

          padding:
            '24px 20px',

          display:
            'flex',

          flexDirection:
            'column',

          gap:
            20,
        }}
      >
        {/* ==================================================
            AI SETTINGS
            ================================================== */}

        {showApiSettings && (
          <section
            style={{
              background:
                'white',

              border:
                '1px solid #e2e8f0',

              borderRadius:
                18,

              boxShadow:
                '0 8px 30px rgba(15,23,42,0.06)',

              overflow:
                'hidden',
            }}
          >
            <div
              style={{
                padding:
                  '18px 20px',

                borderBottom:
                  '1px solid #e2e8f0',

                background:
                  '#f8fafc',

                display:
                  'flex',

                alignItems:
                  'center',

                justifyContent:
                  'space-between',

                gap:
                  15,

                flexWrap:
                  'wrap',
              }}
            >
              <div
                style={{
                  display:
                    'flex',

                  alignItems:
                    'center',

                  gap:
                    10,
                }}
              >
                <div
                  style={{
                    width:
                      38,

                    height:
                      38,

                    borderRadius:
                      11,

                    background:
                      '#dbeafe',

                    color:
                      '#2563eb',

                    display:
                      'flex',

                    alignItems:
                      'center',

                    justifyContent:
                      'center',
                  }}
                >
                  <KeyRound
                    size={
                      19
                    }
                  />
                </div>

                <div>
                  <div
                    style={{
                      fontWeight:
                        800,

                      fontSize:
                        15,
                    }}
                  >
                    Pengaturan AI
                  </div>

                  <div
                    style={{
                      fontSize:
                        12,

                      color:
                        '#64748b',

                      marginTop:
                        2,
                    }}
                  >
                    Ganti provider, API key, dan model langsung dari aplikasi.
                  </div>
                </div>
              </div>

              {aiTestState ===
                'success' && (
                <div
                  style={{
                    display:
                      'inline-flex',

                    alignItems:
                      'center',

                    gap:
                      7,

                    padding:
                      '7px 11px',

                    borderRadius:
                      999,

                    background:
                      '#dcfce7',

                    color:
                      '#166534',

                    fontSize:
                      12,

                    fontWeight:
                      700,
                  }}
                >
                  <Wifi
                    size={
                      14
                    }
                  />

                  API Terhubung
                </div>
              )}

              {aiTestState ===
                'error' && (
                <div
                  style={{
                    display:
                      'inline-flex',

                    alignItems:
                      'center',

                    gap:
                      7,

                    padding:
                      '7px 11px',

                    borderRadius:
                      999,

                    background:
                      '#fee2e2',

                    color:
                      '#991b1b',

                    fontSize:
                      12,

                    fontWeight:
                      700,
                  }}
                >
                  <WifiOff
                    size={
                      14
                    }
                  />

                  API Bermasalah
                </div>
              )}
            </div>

            <div
              style={{
                padding:
                  20,
              }}
            >
              <div
                style={{
                  display:
                    'grid',

                  gridTemplateColumns:
                    'repeat(auto-fit, minmax(240px, 1fr))',

                  gap:
                    15,
                }}
              >
                {/* PROVIDER */}

                <div>
                  <label
                    style={
                      labelStyle
                    }
                  >
                    Provider AI
                  </label>

                  <select
                    value={
                      aiConfig.provider
                    }
                    onChange={(
                      e
                    ) =>
                      applyProviderDefaults(
                        e.target.value
                      )
                    }
                    style={
                      inputStyle
                    }
                  >
                    {AI_PROVIDERS.map(
                      (
                        provider
                      ) => (
                        <option
                          key={
                            provider.value
                          }
                          value={
                            provider.value
                          }
                        >
                          {
                            provider.label
                          }
                        </option>
                      )
                    )}
                  </select>

                  <div
                    style={
                      helpStyle
                    }
                  >
                    {
                      selectedProvider.description
                    }
                  </div>
                </div>

                {/* MODEL */}

                <div>
                  <label
                    style={
                      labelStyle
                    }
                  >
                    Model
                  </label>

                  <input
                    value={
                      aiConfig.model
                    }
                    onChange={(
                      e
                    ) =>
                      updateAiConfig({
                        model:
                          e
                            .target
                            .value,
                      })
                    }
                    placeholder="contoh: google/gemini-2.5-flash"
                    style={
                      inputStyle
                    }
                  />

                  <div
                    style={
                      helpStyle
                    }
                  >
                    Isi ID model sesuai provider yang kamu gunakan.
                  </div>
                </div>

                {/* API KEY */}

                <div
                  style={{
                    gridColumn:
                      '1 / -1',
                  }}
                >
                  <label
                    style={
                      labelStyle
                    }
                  >
                    API Key
                  </label>

                  <div
                    style={{
                      position:
                        'relative',
                    }}
                  >
                    <input
                      type={
                        showApiKey
                          ? 'text'
                          : 'password'
                      }
                      value={
                        aiConfig.apiKey
                      }
                      onChange={(
                        e
                      ) =>
                        updateAiConfig({
                          apiKey:
                            e
                              .target
                              .value,
                        })
                      }
                      placeholder="Masukkan API key provider"
                      style={{
                        ...inputStyle,

                        paddingRight:
                          48,
                      }}
                    />

                    <button
                      type="button"
                      onClick={() =>
                        setShowApiKey(
                          (v) =>
                            !v
                        )
                      }
                      style={{
                        position:
                          'absolute',

                        right:
                          10,

                        top:
                          '50%',

                        transform:
                          'translateY(-50%)',

                        border:
                          'none',

                        background:
                          'transparent',

                        color:
                          '#64748b',

                        cursor:
                          'pointer',

                        padding:
                          4,
                      }}
                    >
                      {showApiKey ? (
                        <EyeOff
                          size={
                            18
                          }
                        />
                      ) : (
                        <Eye
                          size={
                            18
                          }
                        />
                      )}
                    </button>
                  </div>

                  <div
                    style={
                      helpStyle
                    }
                  >
                    API key hanya disimpan di sesi browser ini.
                  </div>
                </div>

                {/* BASE URL */}

                {(providerNeedsBaseUrl ||
                  aiConfig.baseUrl) && (
                  <div
                    style={{
                      gridColumn:
                        '1 / -1',
                    }}
                  >
                    <label
                      style={
                        labelStyle
                      }
                    >
                      Base URL / Chat Completions Endpoint
                    </label>

                    <input
                      value={
                        aiConfig.baseUrl
                      }
                      onChange={(
                        e
                      ) =>
                        updateAiConfig({
                          baseUrl:
                            e
                              .target
                              .value,
                        })
                      }
                      placeholder="https://openrouter.ai/api/v1/chat/completions"
                      style={
                        inputStyle
                      }
                    />

                    <div
                      style={
                        helpStyle
                      }
                    >
                      Untuk OpenAI / Gemini / Anthropic sudah ada default. Untuk OpenAI Compatible isi endpoint provider.
                    </div>
                  </div>
                )}
              </div>

              {/* BUTTONS */}

              <div
                style={{
                  display:
                    'flex',

                  gap:
                    10,

                  marginTop:
                    18,

                  flexWrap:
                    'wrap',
                }}
              >
                <button
                  onClick={() =>
                    saveAiConfigToSession(
                      aiConfig
                    )
                  }
                  style={{
                    border:
                      '1px solid #bfdbfe',

                    background:
                      '#eff6ff',

                    color:
                      '#1d4ed8',

                    borderRadius:
                      10,

                    padding:
                      '10px 15px',

                    cursor:
                      'pointer',

                    fontWeight:
                      700,

                    display:
                      'inline-flex',

                    alignItems:
                      'center',

                    gap:
                      8,
                  }}
                >
                  <Save
                    size={
                      16
                    }
                  />

                  Simpan Sesi
                </button>

                <button
                  onClick={
                    testApiConnection
                  }
                  disabled={
                    aiTestState ===
                    'testing'
                  }
                  style={{
                    border:
                      'none',

                    background:
                      '#2563eb',

                    color:
                      'white',

                    borderRadius:
                      10,

                    padding:
                      '10px 16px',

                    cursor:
                      'pointer',

                    fontWeight:
                      800,

                    display:
                      'inline-flex',

                    alignItems:
                      'center',

                    gap:
                      8,

                    opacity:
                      aiTestState ===
                      'testing'
                        ? 0.65
                        : 1,
                  }}
                >
                  {aiTestState ===
                  'testing' ? (
                    <Loader2
                      size={
                        16
                      }
                      style={{
                        animation:
                          'spin 1s linear infinite',
                      }}
                    />
                  ) : (
                    <Wifi
                      size={
                        16
                      }
                    />
                  )}

                  Test API
                </button>
              </div>

              {aiTestMessage && (
                <div
                  style={{
                    marginTop:
                      13,

                    display:
                      'flex',

                    alignItems:
                      'flex-start',

                    gap:
                      9,

                    padding:
                      '11px 13px',

                    borderRadius:
                      10,

                    background:
                      aiTestState ===
                      'success'
                        ? '#f0fdf4'
                        : '#fef2f2',

                    border:
                      `1px solid ${
                        aiTestState ===
                        'success'
                          ? '#bbf7d0'
                          : '#fecaca'
                      }`,

                    color:
                      aiTestState ===
                      'success'
                        ? '#166534'
                        : '#991b1b',

                    fontSize:
                      12,

                    fontWeight:
                      600,
                  }}
                >
                  {aiTestState ===
                  'success' ? (
                    <CheckCircle
                      size={
                        16
                      }
                    />
                  ) : (
                    <AlertCircle
                      size={
                        16
                      }
                    />
                  )}

                  <span>
                    {
                      aiTestMessage
                    }
                  </span>
                </div>
              )}
            </div>
          </section>
        )}

        {/* ==================================================
            IDLE
            ================================================== */}

        {appState ===
          'idle' && (
          <section
            onDragOver={(
              e
            ) => {
              e.preventDefault();
              setIsDragging(
                true
              );
            }}
            onDragLeave={() =>
              setIsDragging(
                false
              )
            }
            onDrop={
              handleDrop
            }
            style={{
              background:
                'white',

              border:
                `2px dashed ${
                  isDragging
                    ? '#2563eb'
                    : '#cbd5e1'
                }`,

              borderRadius:
                20,

              minHeight:
                430,

              display:
                'flex',

              alignItems:
                'center',

              justifyContent:
                'center',

              transition:
                '0.2s',

              backgroundColor:
                isDragging
                  ? '#eff6ff'
                  : 'white',

              boxShadow:
                '0 8px 30px rgba(15,23,42,0.06)',
            }}
          >
            <div
              style={{
                width:
                  '100%',

                maxWidth:
                  620,

                textAlign:
                  'center',

                padding:
                  45,
              }}
            >
              <div
                style={{
                  width:
                    78,

                  height:
                    78,

                  margin:
                    '0 auto 18px',

                  borderRadius:
                    22,

                  background:
                    '#eff6ff',

                  color:
                    '#2563eb',

                  display:
                    'flex',

                  alignItems:
                    'center',

                  justifyContent:
                    'center',
                }}
              >
                <UploadCloud
                  size={
                    38
                  }
                />
              </div>

              <h2
                style={{
                  margin:
                    '0 0 8px',

                  fontSize:
                    24,

                  fontWeight:
                    850,

                  color:
                    '#0f172a',
                }}
              >
                Unggah PDF Soal Ujian
              </h2>

              <p
                style={{
                  margin:
                    '0 auto 22px',

                  maxWidth:
                    500,

                  color:
                    '#64748b',

                  fontSize:
                    14,

                  lineHeight:
                    1.7,
                }}
              >
                PDF akan dirender per halaman, dibaca AI, soal dan diagram dipisahkan, lalu hasilnya bisa direview sebelum masuk ke Bank Soal.
              </p>

              <input
                type="file"
                id="pdf-upload-advanced"
                accept="application/pdf"
                style={{
                  display:
                    'none',
                }}
                onChange={
                  handleFileUpload
                }
              />

              <label
                htmlFor="pdf-upload-advanced"
                style={{
                  display:
                    'inline-flex',

                  alignItems:
                    'center',

                  gap:
                    9,

                  padding:
                    '12px 20px',

                  borderRadius:
                    11,

                  background:
                    '#2563eb',

                  color:
                    'white',

                  fontWeight:
                    800,

                  fontSize:
                    14,

                  cursor:
                    'pointer',

                  boxShadow:
                    '0 8px 20px rgba(37,99,235,0.2)',
                }}
              >
                <FileText
                  size={
                    18
                  }
                />

                Pilih File PDF
              </label>

              <div
                style={{
                  marginTop:
                    14,

                  color:
                    '#94a3b8',

                  fontSize:
                    12,
                }}
              >
                atau drag & drop PDF di area ini
              </div>
            </div>
          </section>
        )}

        {/* ==================================================
            PREVIEW
            ================================================== */}

        {appState ===
          'preview' && (
          <section
            style={
              cardStyle
            }
          >
            <div
              style={{
                display:
                  'grid',

                gridTemplateColumns:
                  'minmax(260px, 0.8fr) minmax(0, 1.7fr)',

                gap:
                  22,
              }}
            >
              <div
                style={{
                  background:
                    '#f8fafc',

                  border:
                    '1px solid #e2e8f0',

                  borderRadius:
                    16,

                  padding:
                    18,

                  textAlign:
                    'center',
                }}
              >
                {coverThumbnail ? (
                  <img
                    src={
                      coverThumbnail
                    }
                    alt="cover"
                    style={{
                      width:
                        '100%',

                      maxWidth:
                        260,

                      maxHeight:
                        330,

                      objectFit:
                        'contain',

                      borderRadius:
                        12,

                      border:
                        '1px solid #cbd5e1',

                      background:
                        'white',

                      display:
                        'block',

                      margin:
                        '0 auto 15px',
                    }}
                  />
                ) : (
                  <Loader2
                    size={
                      28
                    }
                    style={{
                      margin:
                        '50px auto',
                      animation:
                        'spin 1s linear infinite',
                    }}
                  />
                )}

                <div
                  style={{
                    fontWeight:
                      800,

                    fontSize:
                      14,

                    overflow:
                      'hidden',

                    textOverflow:
                      'ellipsis',

                    whiteSpace:
                      'nowrap',
                  }}
                >
                  {
                    file?.name
                  }
                </div>

                <div
                  style={{
                    color:
                      '#64748b',

                    fontSize:
                      12,

                    marginTop:
                      5,
                  }}
                >
                  {
                    totalPages
                  }{' '}
                  halaman
                </div>
              </div>

              <div>
                <div
                  style={{
                    display:
                      'grid',

                    gridTemplateColumns:
                      '1fr 1fr',

                    gap:
                      14,

                    marginBottom:
                      18,
                  }}
                >
                  <div>
                    <label
                      style={
                        labelStyle
                      }
                    >
                      Mata Pelajaran
                    </label>

                    <select
                      value={
                        mataPelajaran
                      }
                      onChange={(
                        e
                      ) =>
                        setMataPelajaran(
                          e
                            .target
                            .value
                        )
                      }
                      style={
                        inputStyle
                      }
                    >
                      {[
                        'Matematika',
                        'Fisika',
                        'Kimia',
                        'Biologi',
                        'Bahasa Indonesia',
                        'Bahasa Inggris',
                      ].map(
                        (
                          m
                        ) => (
                          <option
                            key={
                              m
                            }
                            value={
                              m
                            }
                          >
                            {m}
                          </option>
                        )
                      )}
                    </select>
                  </div>

                  <div>
                    <label
                      style={
                        labelStyle
                      }
                    >
                      Tingkat Kelas
                    </label>

                    <select
                      value={
                        tingkatKelas
                      }
                      onChange={(
                        e
                      ) =>
                        setTingkatKelas(
                          e
                            .target
                            .value
                        )
                      }
                      style={
                        inputStyle
                      }
                    >
                      {[
                        'SD',
                        '7',
                        '8',
                        '9',
                        '10',
                        '11',
                        '12',
                      ].map(
                        (
                          k
                        ) => (
                          <option
                            key={
                              k
                            }
                            value={
                              k
                            }
                          >
                            Kelas {k}
                          </option>
                        )
                      )}
                    </select>
                  </div>
                </div>

                <div
                  style={{
                    display:
                      'flex',

                    alignItems:
                      'center',

                    justifyContent:
                      'space-between',

                    marginBottom:
                      10,

                    gap:
                      12,

                    flexWrap:
                      'wrap',
                  }}
                >
                  <div>
                    <div
                      style={{
                        fontWeight:
                          800,

                        fontSize:
                          17,
                      }}
                    >
                      Pilih Halaman
                    </div>

                    <div
                      style={{
                        color:
                          '#64748b',

                        fontSize:
                          12,

                        marginTop:
                          3,
                      }}
                    >
                      {
                        selectedPages.length
                      }{' '}
                      dari{' '}
                      {
                        totalPages
                      }{' '}
                      halaman dipilih
                    </div>
                  </div>

                  <div
                    style={{
                      display:
                        'flex',

                      gap:
                        8,
                    }}
                  >
                    <button
                      onClick={() =>
                        setSelectedPages(
                          Array.from(
                            {
                              length:
                                totalPages,
                            },

                            (_, i) =>
                              i + 1
                          )
                        )
                      }
                      style={
                        secondaryButtonStyle
                      }
                    >
                      Pilih Semua
                    </button>

                    <button
                      onClick={() =>
                        setSelectedPages(
                          []
                        )
                      }
                      style={
                        ghostButtonStyle
                      }
                    >
                      Batal
                    </button>
                  </div>
                </div>

                <div
                  style={{
                    display:
                      'grid',

                    gridTemplateColumns:
                      'repeat(auto-fill, minmax(75px, 1fr))',

                    gap:
                      8,

                    maxHeight:
                      300,

                    overflowY:
                      'auto',

                    padding:
                      12,

                    border:
                      '1px solid #e2e8f0',

                    borderRadius:
                      14,

                    background:
                      '#f8fafc',

                    marginBottom:
                      16,
                  }}
                >
                  {Array.from(
                    {
                      length:
                        totalPages,
                    },

                    (_, i) =>
                      i + 1
                  ).map(
                    (
                      pageNum
                    ) => {
                      const isSelected =
                        selectedPages.includes(
                          pageNum
                        );

                      return (
                        <button
                          key={
                            pageNum
                          }
                          onClick={() =>
                            setSelectedPages(
                              (
                                prev
                              ) =>
                                isSelected
                                  ? prev.filter(
                                      (
                                        p
                                      ) =>
                                        p !==
                                        pageNum
                                    )
                                  : [
                                      ...prev,
                                      pageNum,
                                    ].sort(
                                      (
                                        a,
                                        b
                                      ) =>
                                        a -
                                        b
                                    )
                            )
                          }
                          style={{
                            border:
                              `1px solid ${
                                isSelected
                                  ? '#93c5fd'
                                  : '#e2e8f0'
                              }`,

                            background:
                              isSelected
                                ? '#eff6ff'
                                : 'white',

                            color:
                              isSelected
                                ? '#1d4ed8'
                                : '#64748b',

                            borderRadius:
                              10,

                            padding:
                              '10px 6px',

                            cursor:
                              'pointer',

                            fontSize:
                              11,

                            fontWeight:
                              700,

                            display:
                              'flex',

                            flexDirection:
                              'column',

                            alignItems:
                              'center',

                            gap:
                              5,
                          }}
                        >
                          {isSelected ? (
                            <CheckSquare
                              size={
                                15
                              }
                            />
                          ) : (
                            <Square
                              size={
                                15
                              }
                            />
                          )}

                          Hal{' '}
                          {
                            pageNum
                          }
                        </button>
                      );
                    }
                  )}
                </div>

                <button
                  onClick={
                    startProcessing
                  }
                  disabled={
                    selectedPages.length ===
                    0
                  }
                  style={{
                    width:
                      '100%',

                    border:
                      'none',

                    background:
                      selectedPages.length >
                      0
                        ? 'linear-gradient(135deg,#2563eb,#4f46e5)'
                        : '#cbd5e1',

                    color:
                      'white',

                    borderRadius:
                      12,

                    padding:
                      '13px 16px',

                    cursor:
                      selectedPages.length >
                      0
                        ? 'pointer'
                        : 'not-allowed',

                    fontWeight:
                      800,

                    fontSize:
                      14,

                    display:
                      'flex',

                    alignItems:
                      'center',

                    justifyContent:
                      'center',

                    gap:
                      9,
                  }}
                >
                  <Play
                    size={
                      17
                    }
                    fill="currentColor"
                  />

                  Mulai Ekstraksi AI
                </button>
              </div>
            </div>
          </section>
        )}

        {/* ==================================================
            PROCESSING / EDITING / SAVING / DONE
            ================================================== */}

        {[
          'processing',
          'editing',
          'saving',
          'done',
        ].includes(
          appState
        ) && (
          <section
            style={{
              display:
                'flex',

              flexDirection:
                'column',

              gap:
                18,
            }}
          >
            {/* STATUS BAR */}

            <div
              style={
                cardStyle
              }
            >
              <div
                style={{
                  display:
                    'flex',

                  justifyContent:
                    'space-between',

                  alignItems:
                    'center',

                  gap:
                    18,

                  flexWrap:
                    'wrap',
                }}
              >
                <div
                  style={{
                    display:
                      'flex',

                    alignItems:
                      'center',

                    gap:
                      11,
                  }}
                >
                  {appState ===
                    'processing' && (
                    <Loader2
                      size={
                        21
                      }
                      style={{
                        color:
                          '#2563eb',
                        animation:
                          'spin 1s linear infinite',
                      }}
                    />
                  )}

                  {appState ===
                    'saving' && (
                    <Loader2
                      size={
                        21
                      }
                      style={{
                        color:
                          '#059669',
                        animation:
                          'spin 1s linear infinite',
                      }}
                    />
                  )}

                  {appState ===
                    'editing' && (
                    <CheckCircle
                      size={
                        21
                      }
                      style={{
                        color:
                          '#059669',
                      }}
                    />
                  )}

                  {appState ===
                    'done' && (
                    <Database
                      size={
                        21
                      }
                      style={{
                        color:
                          '#059669',
                      }}
                    />
                  )}

                  <div>
                    <div
                      style={{
                        fontWeight:
                          800,

                        fontSize:
                          14,
                      }}
                    >
                      {appState ===
                        'processing' &&
                        'Mengekstrak soal...'}

                      {appState ===
                        'saving' &&
                        'Menyimpan ke Bank Soal...'}

                      {appState ===
                        'editing' &&
                        'Ekstraksi Selesai'}

                      {appState ===
                        'done' &&
                        'Berhasil Tersimpan'}
                    </div>

                    <div
                      style={{
                        color:
                          '#64748b',

                        fontSize:
                          12,

                        marginTop:
                          3,
                      }}
                    >
                      {appState ===
                        'processing' &&
                        `Halaman ${progress.current}/${progress.total}`}

                      {appState ===
                        'editing' &&
                        `${extractedData.length} soal siap direview`}

                      {appState ===
                        'saving' &&
                        'Menulis data dan gambar...'}

                      {appState ===
                        'done' &&
                        `${extractedData.length} soal sudah masuk ke bank soal`}
                    </div>
                  </div>
                </div>

                <div
                  style={{
                    display:
                      'flex',

                    alignItems:
                      'center',

                    gap:
                      8,

                    flexWrap:
                      'wrap',
                  }}
                >
                  <span
                    style={{
                      padding:
                        '8px 10px',

                      borderRadius:
                        9,

                      background:
                        '#f1f5f9',

                      color:
                        '#475569',

                      fontSize:
                        11,

                      fontWeight:
                        700,
                    }}
                  >
                    {
                      mataPelajaran
                    }{' '}
                    • Kelas{' '}
                    {
                      tingkatKelas
                    }
                  </span>

                  <span
                    style={{
                      padding:
                        '8px 10px',

                      borderRadius:
                        9,

                      background:
                        '#eff6ff',

                      color:
                        '#1d4ed8',

                      fontSize:
                        11,

                      fontWeight:
                        700,
                    }}
                  >
                    {
                      aiConfig.model ||
                      'Model'
                    }
                  </span>
                </div>
              </div>

              {appState ===
                'processing' && (
                <div
                  style={{
                    marginTop:
                      15,

                    height:
                      8,

                    background:
                      '#e2e8f0',

                    borderRadius:
                      999,

                    overflow:
                      'hidden',
                  }}
                >
                  <div
                    style={{
                      height:
                        '100%',

                      width:
                        `${progress.total > 0 ? (progress.current / progress.total) * 100 : 0}%`,

                      background:
                        'linear-gradient(90deg,#2563eb,#6366f1)',

                      transition:
                        'width 0.25s ease',
                    }}
                  />
                </div>
              )}

              {appState ===
                'editing' && (
                <div
                  style={{
                    marginTop:
                      14,

                    display:
                      'flex',

                    justifyContent:
                      'space-between',

                    alignItems:
                      'center',

                    gap:
                      12,

                    flexWrap:
                      'wrap',
                  }}
                >
                  <div
                    style={{
                      display:
                        'flex',

                      gap:
                        8,
                    }}
                  >
                    <button
                      onClick={() =>
                        setActiveTab(
                          'questions'
                        )
                      }
                      style={{
                        ...secondaryButtonStyle,

                        background:
                          activeTab ===
                          'questions'
                            ? '#2563eb'
                            : '#f8fafc',

                        color:
                          activeTab ===
                          'questions'
                            ? 'white'
                            : '#475569',
                      }}
                    >
                      Soal (
                      {
                        extractedData.length
                      }
                      )
                    </button>

                    <button
                      onClick={() =>
                        setActiveTab(
                          'terminal'
                        )
                      }
                      style={{
                        ...secondaryButtonStyle,

                        background:
                          activeTab ===
                          'terminal'
                            ? '#0f172a'
                            : '#f8fafc',

                        color:
                          activeTab ===
                          'terminal'
                            ? 'white'
                            : '#475569',
                      }}
                    >
                      Log (
                      {
                        logs.length
                      }
                      )
                    </button>
                  </div>

                  <button
                    onClick={
                      saveToBankSoal
                    }
                    disabled={
                      extractedData.length ===
                      0
                    }
                    style={{
                      border:
                        'none',

                      background:
                        extractedData.length >
                        0
                          ? '#059669'
                          : '#cbd5e1',

                      color:
                        'white',

                      borderRadius:
                        11,

                      padding:
                        '11px 15px',

                      cursor:
                        extractedData.length >
                        0
                          ? 'pointer'
                          : 'not-allowed',

                      fontWeight:
                        800,

                      display:
                        'inline-flex',

                      alignItems:
                        'center',

                      gap:
                        8,
                    }}
                  >
                    <CloudUpload
                      size={
                        16
                      }
                    />

                    Simpan ke Bank Soal
                  </button>
                </div>
              )}
            </div>

            {/* LOG */}

            {activeTab ===
              'terminal' && (
              <div
                style={{
                  background:
                    '#0f172a',

                  color:
                    '#d1fae5',

                  borderRadius:
                    16,

                  padding:
                    18,

                  minHeight:
                    430,

                  maxHeight:
                    520,

                  overflowY:
                    'auto',

                  fontFamily:
                    'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',

                  fontSize:
                    12,

                  border:
                    '1px solid #1e293b',
                }}
              >
                {logs.map(
                  (
                    log
                  ) => (
                    <div
                      key={
                        log.id
                      }
                      style={{
                        marginBottom:
                          7,

                        color:
                          log.type ===
                          'error'
                            ? '#fca5a5'
                            : log.type ===
                              'warning'
                            ? '#fde68a'
                            : log.type ===
                              'success'
                            ? '#93c5fd'
                            : '#cbd5e1',
                      }}
                    >
                      <span
                        style={{
                          color:
                            '#64748b',
                        }}
                      >
                        [
                        {
                          log.time
                        }
                        ]
                      </span>{' '}
                      {
                        log.message
                      }
                    </div>
                  )
                )}

                <div
                  ref={
                    logsEndRef
                  }
                />
              </div>
            )}

            {/* QUESTIONS */}

            {activeTab ===
              'questions' && (
              <div
                style={{
                  display:
                    'flex',

                  flexDirection:
                    'column',

                  gap:
                    14,
                }}
              >
                {extractedData.length ===
                  0 && (
                  <div
                    style={
                      cardStyle
                    }
                  >
                    <div
                      style={{
                        textAlign:
                          'center',

                        color:
                          '#64748b',

                        padding:
                          40,
                      }}
                    >
                      Belum ada soal hasil ekstraksi.
                    </div>
                  </div>
                )}

                {extractedData.map(
                  (
                    q,
                    index
                  ) => (
                    <div
                      key={
                        index
                      }
                      style={{
                        background:
                          'white',

                        border:
                          '1px solid #e2e8f0',

                        borderRadius:
                          16,

                        padding:
                          18,

                        boxShadow:
                          '0 4px 20px rgba(15,23,42,0.04)',
                      }}
                    >
                      {editingId ===
                      index ? (
                        <div>
                          <div
                            style={{
                              display:
                                'flex',

                              justifyContent:
                                'space-between',

                              alignItems:
                                'center',

                              marginBottom:
                                10,
                            }}
                          >
                            <div
                              style={{
                                fontWeight:
                                  800,
                              }}
                            >
                              Edit Soal
                            </div>

                            <button
                              onClick={() =>
                                setEditingId(
                                  null
                                )
                              }
                              style={{
                                border:
                                  'none',

                                background:
                                  '#f1f5f9',

                                color:
                                  '#475569',

                                borderRadius:
                                  9,

                                padding:
                                  7,

                                cursor:
                                  'pointer',
                              }}
                            >
                              <X
                                size={
                                  17
                                }
                              />
                            </button>
                          </div>

                          <textarea
                            rows={
                              7
                            }
                            value={
                              editForm.teks_soal ||
                              ''
                            }
                            onChange={(
                              e
                            ) =>
                              setEditForm({
                                ...editForm,

                                teks_soal:
                                  e
                                    .target
                                    .value,
                              })
                            }
                            style={{
                              ...inputStyle,

                              resize:
                                'vertical',

                              lineHeight:
                                1.6,
                            }}
                          />

                          <div
                            style={{
                              display:
                                'flex',

                              justifyContent:
                                'flex-end',

                              gap:
                                8,

                              marginTop:
                                10,
                            }}
                          >
                            <button
                              onClick={() =>
                                setEditingId(
                                  null
                                )
                              }
                              style={
                                ghostButtonStyle
                              }
                            >
                              Batal
                            </button>

                            <button
                              onClick={() =>
                                handleSaveEdit(
                                  index
                                )
                              }
                              style={{
                                border:
                                  'none',

                                background:
                                  '#2563eb',

                                color:
                                  'white',

                                borderRadius:
                                  9,

                                padding:
                                  '9px 13px',

                                cursor:
                                  'pointer',

                                fontWeight:
                                  700,

                                display:
                                  'inline-flex',

                                alignItems:
                                  'center',

                                gap:
                                  7,
                              }}
                            >
                              <Save
                                size={
                                  15
                                }
                              />

                              Simpan Perubahan
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div>
                          <div
                            style={{
                              display:
                                'flex',

                              justifyContent:
                                'space-between',

                              alignItems:
                                'flex-start',

                              gap:
                                12,

                              marginBottom:
                                13,
                            }}
                          >
                            <div
                              style={{
                                display:
                                  'flex',

                                gap:
                                  8,

                                flexWrap:
                                  'wrap',
                              }}
                            >
                              <span
                                style={{
                                  background:
                                    '#eff6ff',

                                  border:
                                    '1px solid #bfdbfe',

                                  color:
                                    '#1d4ed8',

                                  borderRadius:
                                    999,

                                  padding:
                                    '5px 9px',

                                  fontSize:
                                    11,

                                  fontWeight:
                                    800,
                                }}
                              >
                                Soal No.{' '}
                                {
                                  q.nomor ||
                                  index +
                                    1
                                }
                              </span>

                              <span
                                style={{
                                  background:
                                    '#f8fafc',

                                  border:
                                    '1px solid #e2e8f0',

                                  color:
                                    '#475569',

                                  borderRadius:
                                    999,

                                  padding:
                                    '5px 9px',

                                  fontSize:
                                    11,

                                  fontWeight:
                                    700,
                                }}
                              >
                                {
                                  q.tipe ||
                                  'pg_sederhana'
                                }
                              </span>

                              <span
                                style={{
                                  background:
                                    '#f0fdf4',

                                  border:
                                    '1px solid #bbf7d0',

                                  color:
                                    '#166534',

                                  borderRadius:
                                    999,

                                  padding:
                                    '5px 9px',

                                  fontSize:
                                    11,

                                  fontWeight:
                                    700,
                                }}
                              >
                                Hal{' '}
                                {
                                  q.__sourcePage ||
                                  '-'
                                }
                              </span>
                            </div>

                            <div
                              style={{
                                display:
                                  'flex',

                                gap:
                                  7,
                              }}
                            >
                              <button
                                onClick={() =>
                                  handleEditClick(
                                    q,
                                    index
                                  )
                                }
                                title="Edit soal"
                                style={{
                                  border:
                                    '1px solid #e2e8f0',

                                  background:
                                    '#f8fafc',

                                  color:
                                    '#475569',

                                  borderRadius:
                                    9,

                                  padding:
                                    8,

                                  cursor:
                                    'pointer',
                                }}
                              >
                                <Edit3
                                  size={
                                    15
                                  }
                                />
                              </button>

                              <button
                                onClick={() =>
                                  handleDeleteQuestion(
                                    index
                                  )
                                }
                                title="Hapus soal"
                                style={{
                                  border:
                                    '1px solid #fecaca',

                                  background:
                                    '#fef2f2',

                                  color:
                                    '#dc2626',

                                  borderRadius:
                                    9,

                                  padding:
                                    8,

                                  cursor:
                                    'pointer',
                                }}
                              >
                                <Trash2
                                  size={
                                    15
                                  }
                                />
                              </button>
                            </div>
                          </div>

                          <div
                            style={{
                              background:
                                '#f8fafc',

                              border:
                                '1px solid #e2e8f0',

                              borderRadius:
                                12,

                              padding:
                                15,

                              overflow:
                                'hidden',
                            }}
                          >
                            <RichQuestionText
                              isMathReady={
                                isMathReady
                              }
                              text={
                                q.teks_soal
                              }
                              gambar={
                                q.gambar
                              }
                            />
                          </div>

                          {q.gambar?.filter(
                            (
                              g
                            ) =>
                              g?.dataUrl
                          ).length >
                            0 && (
                            <div
                              style={{
                                display:
                                  'inline-flex',

                                alignItems:
                                  'center',

                                gap:
                                  7,

                                marginTop:
                                  10,

                                padding:
                                  '7px 10px',

                                borderRadius:
                                  9,

                                background:
                                  '#f0fdf4',

                                color:
                                  '#166534',

                                border:
                                  '1px solid #bbf7d0',

                                fontSize:
                                  11,

                                fontWeight:
                                  700,
                              }}
                            >
                              <ImageIcon
                                size={
                                  15
                                }
                              />

                              {
                                q.gambar.filter(
                                  (
                                    g
                                  ) =>
                                    g?.dataUrl
                                ).length
                              }{' '}
                              gambar terdeteksi
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )
                )}
              </div>
            )}
          </section>
        )}

        {/* ==================================================
            ERROR
            ================================================== */}

        {appState ===
          'error' && (
          <section
            style={
              cardStyle
            }
          >
            <div
              style={{
                textAlign:
                  'center',

                padding:
                  45,
              }}
            >
              <AlertCircle
                size={
                  42
                }
                style={{
                  color:
                    '#dc2626',

                  margin:
                    '0 auto 12px',
                }}
              />

              <h3
                style={{
                  margin:
                    '0 0 7px',

                  fontSize:
                    18,

                  fontWeight:
                    800,
                }}
              >
                Gagal memuat PDF
              </h3>

              <p
                style={{
                  margin:
                    '0 0 18px',

                  color:
                    '#64748b',

                  fontSize:
                    13,
                }}
              >
                Silakan reset dan coba file PDF lain.
              </p>

              <button
                onClick={
                  resetAll
                }
                style={{
                  border:
                    'none',

                  background:
                    '#2563eb',

                  color:
                    'white',

                  borderRadius:
                    10,

                  padding:
                    '10px 15px',

                  cursor:
                    'pointer',

                  fontWeight:
                    800,
                }}
              >
                Kembali
              </button>
            </div>
          </section>
        )}

        {/* RESET */}

        {file &&
          appState !==
            'processing' &&
          appState !==
            'saving' && (
            <div
              style={{
                display:
                  'flex',

                justifyContent:
                  'flex-end',
              }}
            >
              <button
                onClick={
                  resetAll
                }
                style={{
                  border:
                    '1px solid #e2e8f0',

                  background:
                    'white',

                  color:
                    '#475569',

                  borderRadius:
                    10,

                  padding:
                    '9px 12px',

                  cursor:
                    'pointer',

                  fontWeight:
                    700,

                  display:
                    'inline-flex',

                  alignItems:
                    'center',

                  gap:
                    7,
                }}
              >
                <RefreshCw
                  size={
                    15
                  }
                />

                Reset
              </button>
            </div>
          )}
      </main>

      <style>
        {`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }

          * {
            box-sizing: border-box;
          }

          button,
          input,
          textarea,
          select {
            font-family: inherit;
          }

          button:hover {
            filter: brightness(0.98);
          }

          @media (max-width: 800px) {
            main {
              padding-left: 12px !important;
              padding-right: 12px !important;
            }
          }
        `}
      </style>
    </div>
  );
}

// ============================================================
// RICH QUESTION TEXT
// ============================================================

function RichQuestionText({
  text,
  gambar,
  isMathReady,
}) {
  const containerRef =
    useRef(null);

  const html =
    useMemo(() => {
      if (!text) {
        return '';
      }

      let escaped =
        String(text)
          .replace(
            /&/g,
            '&amp;'
          )
          .replace(
            /</g,
            '&lt;'
          )
          .replace(
            />/g,
            '&gt;'
          );

      const imgs =
        (
          gambar || []
        ).filter(
          Boolean
        );

      let idx = 0;

      escaped =
        escaped.replace(
          /\{\{\s*GAMBAR[^}]*\}\}/gi,
          () => {
            const g =
              imgs[idx++];

            const src =
              g?.url ||
              g?.dataUrl;

            if (src) {
              return `
                <img
                  src="${src}"
                  alt="gambar soal"
                  style="
                    max-width:100%;
                    max-height:360px;
                    display:block;
                    border-radius:10px;
                    border:1px solid #cbd5e1;
                    background:#fff;
                    padding:5px;
                    margin:12px auto;
                  "
                />
              `;
            }

            return `
              <span
                style="
                  color:#b45309;
                  font-size:12px;
                  font-weight:600;
                "
              >
                [Gambar tidak ditemukan]
              </span>
            `;
          }
        );

      return escaped;
    }, [
      text,
      gambar,
    ]);

  useEffect(() => {
    if (
      containerRef.current &&
      isMathReady &&
      window.renderMathInElement
    ) {
      try {
        window.renderMathInElement(
          containerRef.current,
          {
            delimiters: [
              {
                left: '$$',
                right: '$$',
                display: true,
              },

              {
                left: '$',
                right: '$',
                display: false,
              },
            ],

            throwOnError:
              false,
          }
        );
      } catch {}
    }
  }, [
    html,
    isMathReady,
  ]);

  return (
    <div
      ref={
        containerRef
      }
      style={{
        fontSize:
          14,

        color:
          '#334155',

        lineHeight:
          1.8,

        whiteSpace:
          'pre-wrap',

        wordBreak:
          'break-word',
      }}
      dangerouslySetInnerHTML={{
        __html:
          html,
      }}
    />
  );
}

// ============================================================
// SHARED STYLES
// ============================================================

const cardStyle = {
  background:
    'white',

  border:
    '1px solid #e2e8f0',

  borderRadius:
    18,

  padding:
    20,

  boxShadow:
    '0 8px 30px rgba(15,23,42,0.06)',
};

const labelStyle = {
  display:
    'block',

  marginBottom:
    7,

  fontSize:
    12,

  fontWeight:
    800,

  color:
    '#334155',
};

const helpStyle = {
  marginTop:
    6,

  color:
    '#94a3b8',

  fontSize:
    11,

  lineHeight:
    1.5,
};

const inputStyle = {
  width:
    '100%',

  padding:
    '10px 12px',

  border:
    '1px solid #cbd5e1',

  borderRadius:
    10,

  background:
    'white',

  color:
    '#0f172a',

  fontSize:
    13,

  outline:
    'none',
};

const secondaryButtonStyle = {
  border:
    '1px solid #cbd5e1',

  background:
    '#f8fafc',

  color:
    '#475569',

  borderRadius:
    9,

  padding:
    '8px 11px',

  cursor:
    'pointer',

  fontSize:
    11,

  fontWeight:
    700,
};

const ghostButtonStyle = {
  border:
    '1px solid #e2e8f0',

  background:
    'white',

  color:
    '#64748b',

  borderRadius:
    9,

  padding:
    '8px 11px',

  cursor:
    'pointer',

  fontSize:
    11,

  fontWeight:
    700,
};