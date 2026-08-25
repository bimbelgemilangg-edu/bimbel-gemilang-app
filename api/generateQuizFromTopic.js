// ============================================================
// BIMBEL GEMILANG - QUESTION HARVESTER
// Replaces AI question generation with web-source harvesting.
// Stack: HasData Google SERP + Google Images + Web Scraping -> NVIDIA NIM Vision
// Model: nvidia/nemotron-3-nano-omni-30b-a3b-reasoning
// ============================================================

export const maxDuration = 60;

// Keep a hard internal deadline below Vercel's 60s runtime ceiling.
const REQUEST_BUDGET_MS = 52_000;


const HASDATA_SERP_URL = 'https://api.hasdata.com/scrape/google/serp';
const HASDATA_IMAGES_URL = 'https://api.hasdata.com/scrape/google/images';
const HASDATA_WEB_URL = 'https://api.hasdata.com/scrape/web';
const NVIDIA_API_URL = 'https://integrate.api.nvidia.com/v1/chat/completions';

const NVIDIA_MODEL =
  process.env.NVIDIA_MODEL ||
  'nvidia/nemotron-3-nano-omni-30b-a3b-reasoning';

// Hard guards. These keep ordinary usage in the free lane.
const MAX_RESULTS_PER_SEARCH = 8;
const MAX_SOURCE_PAGES_PER_REQUEST = 1;
const MAX_IMAGES_PER_SEARCH = 8;
const MAX_AI_CALLS_PER_REQUEST = 1;
const MAX_HASDATA_SERP_CALLS_PER_REQUEST = 1;
const MAX_HASDATA_IMAGE_CALLS_PER_REQUEST = 0;
const MAX_HASDATA_SCRAPES_PER_REQUEST = 1;
const MAX_PAGE_CHARS = 12_000;
const MAX_IMAGE_CANDIDATES_FOR_AI = 2;
const NVIDIA_TIMEOUT_MS = 18_000;
const FETCH_TIMEOUT_MS = 8_000;

const ALLOWED_TYPES = new Set([
  'multiple',
  'truefalse',
  'multiple_select',
  'short_answer',
  'matching',
  'ordering',
]);

function cleanText(value = '') {
  return String(value ?? '')
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function clampInt(value, min, max, fallback) {
  const n = Number.parseInt(value, 10);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(Math.max(n, min), max);
}

function safeUrl(value) {
  try {
    const url = new URL(String(value || ''));
    if (!['http:', 'https:'].includes(url.protocol)) return '';
    return url.toString();
  } catch {
    return '';
  }
}

function decodeHtml(value = '') {
  return String(value)
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&#(\d+);/g, (_, n) => {
      try { return String.fromCodePoint(Number(n)); } catch { return ''; }
    })
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => {
      try { return String.fromCodePoint(parseInt(n, 16)); } catch { return ''; }
    });
}

function stripHtml(html = '') {
  return decodeHtml(
    String(html)
      .replace(/<script[\s\S]*?<\/script>/gi, ' ')
      .replace(/<style[\s\S]*?<\/style>/gi, ' ')
      .replace(/<noscript[\s\S]*?<\/noscript>/gi, ' ')
      .replace(/<svg[\s\S]*?<\/svg>/gi, ' ')
      .replace(/<[^>]+>/g, ' '),
  );
}

function absoluteUrl(raw, baseUrl) {
  try {
    const url = new URL(String(raw || ''), baseUrl);
    if (!['http:', 'https:'].includes(url.protocol)) return '';
    return url.toString();
  } catch {
    return '';
  }
}

function extractMeta(html, baseUrl) {
  const images = new Set();
  const patterns = [
    /<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/gi,
    /<meta[^>]+name=["']twitter:image["'][^>]+content=["']([^"']+)["']/gi,
    /<meta[^>]+property=["']twitter:image["'][^>]+content=["']([^"']+)["']/gi,
  ];
  for (const pattern of patterns) {
    let match;
    while ((match = pattern.exec(html))) {
      const url = absoluteUrl(match[1], baseUrl);
      if (url) images.add(url);
    }
  }

  const imgPattern = /<img\b[^>]*(?:src|data-src|data-lazy-src)=["']([^"']+)["'][^>]*>/gi;
  let match;
  while ((match = imgPattern.exec(html)) && images.size < 24) {
    const url = absoluteUrl(match[1], baseUrl);
    if (url) images.add(url);
  }

  const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  const title = cleanText(stripHtml(titleMatch?.[1] || ''));

  return {
    title,
    images: [...images].slice(0, 24),
  };
}

function looksLikeQuestionPage(result) {
  const hay = `${result.title || ''} ${result.description || ''}`.toLowerCase();
  const terms = ['soal', 'latihan', 'tka', 'tryout', 'ujian', 'pembahasan', 'contoh'];
  return terms.some((term) => hay.includes(term));
}

function buildQueries({ topic, mapel, kelas, arahan }) {
  const base = [cleanText(topic), cleanText(mapel), cleanText(kelas)]
    .filter(Boolean)
    .join(' ');
  const hint = cleanText(arahan);
  const queries = [
    `${base} soal latihan pembahasan`,
    `${base} contoh soal TKA tryout`,
  ];
  if (hint) queries.push(`${base} ${hint}`);
  return [...new Set(queries.map(cleanText).filter(Boolean))]
    .slice(0, MAX_HASDATA_SERP_CALLS_PER_REQUEST);
}

async function hasDataRequest(url, params, apiKey, timeoutMs = FETCH_TIMEOUT_MS) {
  const endpoint = new URL(url);
  for (const [key, value] of Object.entries(params || {})) {
    if (value !== undefined && value !== null && value !== '') {
      endpoint.searchParams.set(key, String(value));
    }
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(endpoint, {
      headers: {
        Accept: 'application/json',
        'x-api-key': apiKey,
        'Content-Type': 'application/json',
      },
      signal: controller.signal,
    });

    const text = await response.text();
    let data = null;
    try { data = text ? JSON.parse(text) : null; } catch { data = null; }

    if (!response.ok) {
      const error = new Error(`HasData HTTP ${response.status}`);
      error.providerStatus = response.status;
      error.providerMessage = String(data?.message || data?.error || data?.detail || text || 'Unknown HasData error').slice(0, 1500);
      throw error;
    }
    return data;
  } catch (error) {
    if (error?.name === 'AbortError') {
      const timeoutError = new Error(`HasData timeout setelah ${timeoutMs}ms.`);
      timeoutError.code = 'HASDATA_TIMEOUT';
      throw timeoutError;
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}

async function searchWeb(apiKey, query) {
  const data = await hasDataRequest(
    HASDATA_SERP_URL,
    {
      q: query,
      domain: 'google.co.id',
      gl: 'id',
      hl: 'id',
      num: 20,
      safe: 'active',
      filter: 1,
      deviceType: 'desktop',
    },
    apiKey,
  );

  return Array.isArray(data?.organicResults)
    ? data.organicResults.map((item) => ({
        title: cleanText(item?.title),
        url: safeUrl(item?.link),
        description: cleanText(item?.snippet),
        source: cleanText(item?.source),
        position: Number(item?.position) || null,
      })).filter((item) => item.url)
    : [];
}

async function searchImages(apiKey, query) {
  const data = await hasDataRequest(
    HASDATA_IMAGES_URL,
    {
      q: query,
      domain: 'google.co.id',
      gl: 'id',
      hl: 'id',
      safe: 'active',
      filter: 1,
      deviceType: 'desktop',
      tbs: 'isz:m',
    },
    apiKey,
  );

  return Array.isArray(data?.imagesResults)
    ? data.imagesResults.map((item) => ({
        title: cleanText(item?.title),
        imageUrl: safeUrl(item?.original),
        thumbnailUrl: safeUrl(item?.thumbnail),
        sourcePageUrl: safeUrl(item?.link),
        description: cleanText(`${item?.title || ''} ${item?.source || ''}`),
        width: Number(item?.originalWidth) || null,
        height: Number(item?.originalHeight) || null,
      })).filter((item) => item.imageUrl)
    : [];
}

async function fetchPage(apiKey, url, timeoutMs = 12_000) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(HASDATA_WEB_URL, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
      },
      body: JSON.stringify({
        url,
        proxyType: 'datacenter',
        blockAds: true,
        blockResources: false,
        jsRendering: true,
        outputFormat: ['html', 'text'],
        extractLinks: true,
        removeBase64Images: true,
      }),
      signal: controller.signal,
    });

    const text = await response.text();
    let data = null;
    try { data = text ? JSON.parse(text) : null; } catch { data = null; }

    if (!response.ok) {
      return {
        ok: false,
        status: response.status,
        title: '',
        text: '',
        images: [],
        links: [],
        error: String(data?.message || data?.error || text || 'HasData scrape failed').slice(0, 1000),
      };
    }

    const html = String(data?.html || data?.content || '');
    const visibleText = cleanText(data?.text || stripHtml(html)).slice(0, MAX_PAGE_CHARS);
    const meta = extractMeta(html, url);
    const links = Array.isArray(data?.links)
      ? data.links.map((item) => safeUrl(item)).filter(Boolean).slice(0, 50)
      : [];

    return {
      ok: true,
      status: response.status,
      title: meta.title,
      text: visibleText,
      images: meta.images,
      links,
    };
  } catch (error) {
    return {
      ok: false,
      status: error?.name === 'AbortError' ? 504 : 502,
      title: '',
      text: '',
      images: [],
      links: [],
      error: error?.name === 'AbortError'
        ? `HasData scrape timeout setelah ${timeoutMs}ms.`
        : (error?.message || 'HasData scrape failed'),
    };
  } finally {
    clearTimeout(timeoutId);
  }
}

function normalizeQuestion(raw, source) {
  if (!raw || typeof raw !== 'object') return null;
  const type = cleanText(raw.type || 'multiple').toLowerCase();
  if (!ALLOWED_TYPES.has(type)) return null;

  const question = cleanText(raw.question);
  if (question.length < 8 || question.length > 4500) return null;

  const options = Array.isArray(raw.options)
    ? raw.options.map(cleanText).filter(Boolean).slice(0, 8)
    : [];

  const correct = Number.isInteger(raw.correct)
    ? raw.correct
    : null;

  if (type === 'multiple' && (options.length !== 4 || correct === null || correct < 0 || correct > 3)) {
    return null;
  }

  if (type === 'truefalse' && !(correct === 0 || correct === 1)) {
    return null;
  }

  if (type === 'multiple_select') {
    const answers = Array.isArray(raw.correctAnswers)
      ? raw.correctAnswers.filter(Number.isInteger).slice(0, options.length)
      : [];
    if (options.length < 2 || answers.length < 1) return null;
  }

  const imageUrl = safeUrl(raw.imageUrl || raw.sourceImageUrl);

  return {
    type,
    blueprintNo: null,
    difficulty: 'Imported',
    competency: 'Web Source',
    question,
    options,
    optionImages: [],
    optionsAreImages: false,
    correct,
    correctAnswers: Array.isArray(raw.correctAnswers)
      ? raw.correctAnswers.filter(Number.isInteger).slice(0, 8)
      : [],
    statements: [],
    shortAnswer: cleanText(raw.shortAnswer).slice(0, 500),
    readingText: '',
    cause: '',
    effect: '',
    explanation: cleanText(raw.explanation).slice(0, 5000),
    answerVerification: 'Kunci diambil hanya bila sumber menyediakan atau AI dapat membaca kunci pada sumber.',
    analysisSummary: 'Soal diambil dari sumber web dan tidak dibuat ulang.',
    readingSource: source.url,
    imageUrl,
    qImage: imageUrl,
    needsImage: Boolean(imageUrl),
    imageHint: cleanText(raw.imageHint).slice(0, 300),
    visualRequired: Boolean(imageUrl),
    visualKind: imageUrl ? 'source-image' : 'none',
    sourceTitle: source.title,
    sourceUrl: source.url,
    researchBacked: true,
    sourceMode: 'harvest',
    sourceDomain: (() => { try { return new URL(source.url).hostname; } catch { return ''; } })(),
    sourcePublisher: source.publisher || '',
    sourceImageUrl: imageUrl,
    harvestedAt: new Date().toISOString(),
  };
}

function extractJsonArray(text) {
  const cleaned = String(text || '')
    .replace(/^\s*```(?:json)?\s*/i, '')
    .replace(/\s*```\s*$/i, '')
    .trim();
  try {
    const value = JSON.parse(cleaned);
    return Array.isArray(value) ? value : [value];
  } catch {}

  const first = cleaned.indexOf('[');
  const last = cleaned.lastIndexOf(']');
  if (first >= 0 && last > first) {
    try {
      const value = JSON.parse(cleaned.slice(first, last + 1));
      return Array.isArray(value) ? value : [];
    } catch {}
  }

  return [];
}

async function callNvidia({ apiKey, source, imageCandidates, requestedCount, mapel, kelas, topic, arahan }) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), NVIDIA_TIMEOUT_MS);

  const imagePrompt = imageCandidates.length
    ? `\nKANDIDAT GAMBAR DARI SUMBER/PENCARIAN (jangan mengarang URL):\n${JSON.stringify(imageCandidates.slice(0, MAX_IMAGE_CANDIDATES_FOR_AI))}`
    : '';

  const prompt = [
    'Kamu adalah mesin ekstraksi bank soal untuk Bimbel Gemilang.',
    'TUGAS: ambil soal yang SUDAH ADA pada sumber web. Jangan membuat soal baru dan jangan mengubah inti soal.',
    'Baca teks halaman dan kandidat gambar. Pilih butir yang benar-benar merupakan soal latihan/ujian dari halaman.',
    'Kembalikan JSON ARRAY SAJA. Maksimum 3 soal per halaman.',
    'Setiap object wajib memiliki: type, question, options, correct, correctAnswers, shortAnswer, explanation, imageUrl, imageHint, sourceImageUrl.',
    'Untuk type multiple, options harus 4 dan correct adalah index 0-3 bila kunci tersedia. Jika kunci tidak ada, gunakan correct:null.',
    'Jangan mengarang jawaban. Bila kunci/pembahasan tidak tersedia, biarkan correct null dan explanation kosong.',
    'imageUrl harus salah satu URL kandidat gambar yang diberikan atau null. Jangan membuat URL baru.',
    'Prioritaskan soal yang paling jelas dan lengkap, bukan ringkasan materi.',
    `Konteks guru: mapel=${mapel}; kelas=${kelas}; topik=${topic}; arahan=${arahan || 'tidak ada'}; target jumlah global=${requestedCount}.`,
    `SUMBER: ${JSON.stringify({ title: source.title, url: source.url, publisher: source.publisher })}`,
    `TEKS HALAMAN:\n${source.text.slice(0, 10_000)}`,
    imagePrompt,
  ].join('\n\n');

  try {
    const response = await fetch(NVIDIA_API_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        model: NVIDIA_MODEL,
        messages: [
          {
            role: 'system',
            content: 'Extract existing questions faithfully. Never invent source URLs, answers, or questions.',
          },
          {
            role: 'user',
            content: [
              { type: 'text', text: prompt },
              ...imageCandidates.slice(0, 1).map((image) => ({
                type: 'image_url',
                image_url: { url: image.url },
              })),
            ],
          },
        ],
        max_tokens: 2200,
        temperature: 0.1,
        top_p: 0.7,
        stream: false,
      }),
      signal: controller.signal,
    });

    const text = await response.text();
    let data = null;
    try { data = text ? JSON.parse(text) : null; } catch { data = null; }

    if (!response.ok) {
      const error = new Error(`NVIDIA HTTP ${response.status}`);
      error.providerStatus = response.status;
      error.providerMessage = String(data?.detail || data?.message || data?.error || text || 'Unknown NVIDIA error').slice(0, 1500);
      throw error;
    }

    const content = data?.choices?.[0]?.message?.content;
    if (typeof content !== 'string' || !content.trim()) {
      const error = new Error('NVIDIA response content kosong.');
      error.providerStatus = response.status;
      throw error;
    }

    return {
      questions: extractJsonArray(content),
      model: data?.model || NVIDIA_MODEL,
      usage: data?.usage || null,
      traceId: response.headers.get('x-request-id') || null,
    };
  } finally {
    clearTimeout(timeoutId);
  }
}

function dedupeQuestions(items) {
  const seen = new Set();
  const output = [];
  for (const item of items) {
    const key = cleanText(item.question).toLowerCase().replace(/\s+/g, ' ');
    if (!key || seen.has(key)) continue;
    seen.add(key);
    output.push(item);
  }
  return output;
}

function sendError(res, status, error, diagnostics = {}) {
  return res.status(status).json({
    success: false,
    error,
    diagnostics,
  });
}

function getDeadline() {
  return Date.now() + REQUEST_BUDGET_MS;
}

function timeLeft(deadline) {
  return Math.max(deadline - Date.now(), 0);
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return sendError(res, 405, 'Method not allowed.');
  }

  const deadline = getDeadline();

  const body = req.body && typeof req.body === 'object' ? req.body : {};
  const hasDataKey = process.env.HASDATA_API_KEY;
  const nvidiaKey = process.env.NVIDIA_API_KEY;

  if (!hasDataKey) {
    return sendError(res, 503, 'HASDATA_API_KEY belum dikonfigurasi.', { type: 'missing_hasdata_api_key' });
  }
  if (!nvidiaKey) {
    return sendError(res, 503, 'NVIDIA_API_KEY belum dikonfigurasi.', { type: 'missing_nvidia_api_key' });
  }

  const topic = cleanText(body.topic).slice(0, 300);
  const mapel = cleanText(body.mapel || 'Umum').slice(0, 120);
  const kelas = cleanText(body.kelas || 'Umum').slice(0, 120);
  const arahan = cleanText(body.arahan || '').slice(0, 600);
  const jumlah = clampInt(body.jumlahSoal, 1, 20, 5);

  if (!topic) {
    return sendError(res, 400, 'Topik wajib diisi.');
  }

  const queries = buildQueries({ topic, mapel, kelas, arahan });
  const hasDataSerpBudget = Math.min(queries.length, MAX_HASDATA_SERP_CALLS_PER_REQUEST);
  const usedSources = new Map();
  const searchErrors = [];

  for (const query of queries.slice(0, 1)) {
    if (timeLeft(deadline) < 15_000) break;
    try {
      const results = await searchWeb(hasDataKey, query);
      for (const result of results) {
        if (!looksLikeQuestionPage(result)) continue;
        if (!result.url || usedSources.has(result.url)) continue;
        usedSources.set(result.url, {
          url: result.url,
          title: result.title,
          description: result.description,
          extraSnippets: result.extraSnippets || [],
          publisher: result.source,
          searchQuery: query,
          thumbnail: result.thumbnail || '',
        });
        if (usedSources.size >= MAX_SOURCE_PAGES_PER_REQUEST) break;
      }
    } catch (error) {
      searchErrors.push({
        query,
        status: error?.providerStatus || null,
        message: error?.providerMessage || error?.message || 'Search failed',
      });
    }
  }

  if (usedSources.size === 0) {
    return sendError(res, 502, 'Tidak menemukan halaman soal yang bisa diproses.', {
      type: 'no_sources_found',
      queries,
      searchErrors,
    });
  }

  // One image search for the main topic. Search result images are supplemental;
  // page images are preferred because they are more likely to be the actual stimulus.
  // Image search is intentionally skipped in the first pass.
  // The source-page scraper already extracts real image URLs from the actual
  // question page, which is both faster and safer under Vercel's 60s ceiling.
  // This keeps the free lane conservative and avoids a second HasData request.
  const globalImages = [];

  const sources = [];
  let scrapeCalls = 0;
  for (const source of usedSources.values()) {
    if (scrapeCalls >= MAX_HASDATA_SCRAPES_PER_REQUEST) break;
    if (timeLeft(deadline) < 25_000) break;
    scrapeCalls += 1;
    const pageTimeout = Math.min(12_000, Math.max(7_000, timeLeft(deadline) - 20_000));
    const page = await fetchPage(hasDataKey, source.url, pageTimeout);
    const pageImages = page.images.map((url) => ({
      url,
      title: page.title || source.title,
      sourcePageUrl: source.url,
      description: 'Image found on source page',
    }));

    const searchImagesForSource = globalImages
      .filter((image) => !image.sourcePageUrl || image.sourcePageUrl === source.url || image.sourcePageUrl.includes(new URL(source.url).hostname))
      .map((image) => ({
        url: image.imageUrl,
        title: image.title,
        sourcePageUrl: image.sourcePageUrl,
        description: image.description,
      }));

    sources.push({
      ...source,
      title: page.title || source.title,
      text: page.ok
        ? page.text
        : `${source.description || ''}\n${(source.extraSnippets || []).join('\n')}`.slice(0, MAX_PAGE_CHARS),
      images: [...pageImages, ...searchImagesForSource]
        .filter((image, index, arr) => image.url && arr.findIndex((x) => x.url === image.url) === index)
        .slice(0, MAX_IMAGE_CANDIDATES_FOR_AI),
      extraction: page.ok ? 'page' : 'search-snippet',
      httpStatus: page.status,
    });
  }

  const harvested = [];
  const rejected = [];
  const nvidiaErrors = [];
  let aiCalls = 0;

  for (const source of sources) {
    if (harvested.length >= jumlah) break;
    if (aiCalls >= MAX_AI_CALLS_PER_REQUEST) break;
    if (timeLeft(deadline) < 22_000) break;
    aiCalls += 1;

    try {
      const result = await callNvidia({
        apiKey: nvidiaKey,
        source,
        imageCandidates: source.images,
        requestedCount: jumlah,
        mapel,
        kelas,
        topic,
        arahan,
      });

      for (const raw of result.questions) {
        const normalized = normalizeQuestion(raw, source);
        if (!normalized) {
          rejected.push({ reason: 'invalid_structure', sourceUrl: source.url });
          continue;
        }
        harvested.push(normalized);
        if (harvested.length >= jumlah) break;
      }
    } catch (error) {
      nvidiaErrors.push({
        sourceUrl: source.url,
        status: error?.providerStatus || null,
        message: error?.providerMessage || error?.message || 'NVIDIA extraction failed',
      });
    }
  }

  const questions = dedupeQuestions(harvested).slice(0, jumlah);

  if (!questions.length) {
    return sendError(res, 502, 'Sumber ditemukan, tetapi tidak ada soal yang berhasil diekstrak.', {
      type: 'extraction_empty',
      sourceCount: sources.length,
      aiCalls,
      nvidiaErrors,
      searchErrors,
    });
  }

  return res.status(200).json({
    success: true,
    mode: 'harvest',
    questions,
    researchPerformed: true,
    researchSources: sources.map((source) => ({
      title: source.title,
      url: source.url,
      publisher: source.publisher,
      extraction: source.extraction,
    })),
    researchImages: globalImages.slice(0, 20).map((image) => ({
      url: image.imageUrl,
      sourcePageUrl: image.sourcePageUrl,
      title: image.title,
    })),
    requestedCount: jumlah,
    returnedCount: questions.length,
    sourceMode: 'harvest',
    diagnostics: {
      sourceCount: sources.length,
      aiCalls,
      hasDataSerpCalls: Math.min(queries.length, MAX_HASDATA_SERP_CALLS_PER_REQUEST),
      hasDataImageSearchCalls: 0,
      hasDataScrapeCalls: scrapeCalls,
      imageSearchUsed: globalImages.length > 0,
      searchErrors,
      nvidiaErrors,
      rejectedCount: rejected.length,
      modelUsed: NVIDIA_MODEL,
      freeLaneGuards: {
        maxSourcePagesPerRequest: MAX_SOURCE_PAGES_PER_REQUEST,
        maxAiCallsPerRequest: MAX_AI_CALLS_PER_REQUEST,
        maxHasDataSerpCallsPerRequest: MAX_HASDATA_SERP_CALLS_PER_REQUEST,
        maxHasDataImageSearchCallsPerRequest: MAX_HASDATA_IMAGE_CALLS_PER_REQUEST,
        maxHasDataScrapesPerRequest: MAX_HASDATA_SCRAPES_PER_REQUEST,
      },
    },
  });
}