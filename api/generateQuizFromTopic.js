// ============================================================
// BIMBEL GEMILANG - QUESTION HARVESTER (FINAL)
// HasData Search + HasData Web Scrape + OpenRouter Vision
// Model default: google/gemma-4-31b-it:free
// ============================================================

export const maxDuration = 60;

import { buildSearchQuery, searchQuestionPages, scrapeQuestionPage } from '../lib/hasdata.js';
import { extractQuestions, OPENROUTER_MODEL, normalizeUrl, cleanText } from '../lib/openrouter.js';

const REQUEST_BUDGET_MS = 50_000;
const MAX_SEARCH_RESULTS_TO_TRY = 4;
const MAX_AI_CALLS_PER_REQUEST = 1;
const MAX_RETURNED_QUESTIONS = 20;

function clampInt(value, min, max, fallback) {
  const n = Number.parseInt(value, 10);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(Math.max(n, min), max);
}

function timeLeft(deadline) {
  return Math.max(0, deadline - Date.now());
}

function normalizeQuestion(raw, source, index) {
  if (!raw || typeof raw !== 'object') return null;
  const question = cleanText(raw.question);
  if (question.length < 8 || question.length > 5000) return null;

  const options = Array.isArray(raw.options)
    ? raw.options.map(cleanText).filter(Boolean).slice(0, 8)
    : [];
  const type = cleanText(raw.type || 'multiple').toLowerCase();
  const allowed = new Set(['multiple', 'truefalse', 'multiple_select', 'short_answer', 'matching', 'ordering']);
  if (!allowed.has(type)) return null;

  let correct = Number.isInteger(raw.correct) ? raw.correct : null;
  if (type === 'multiple' && (options.length !== 4 || correct === null || correct < 0 || correct > 3)) return null;
  if (type === 'truefalse' && !(correct === 0 || correct === 1)) return null;

  const imageUrl = normalizeUrl(raw.imageUrl || raw.sourceImageUrl);
  const sourceUrl = normalizeUrl(source.url);
  if (!sourceUrl) return null;

  return {
    type,
    blueprintNo: index + 1,
    difficulty: 'Imported',
    competency: 'Web Source',
    question,
    options,
    optionImages: Array.isArray(raw.optionImages) ? raw.optionImages.slice(0, 8) : [],
    optionsAreImages: Boolean(raw.optionsAreImages),
    correct,
    correctAnswers: Array.isArray(raw.correctAnswers)
      ? raw.correctAnswers.filter(Number.isInteger).slice(0, 8)
      : [],
    statements: Array.isArray(raw.statements) ? raw.statements.slice(0, 8) : [],
    shortAnswer: cleanText(raw.shortAnswer).slice(0, 500),
    readingText: cleanText(raw.readingText).slice(0, 8000),
    cause: cleanText(raw.cause).slice(0, 1000),
    effect: cleanText(raw.effect).slice(0, 1000),
    explanation: cleanText(raw.explanation).slice(0, 5000),
    answerVerification: correct === null
      ? 'Kunci tidak ditemukan dengan cukup bukti pada sumber.'
      : 'Kunci diambil dari informasi yang tersedia pada sumber.',
    analysisSummary: 'Soal diambil dari sumber web dan tidak dibuat ulang.',
    readingSource: sourceUrl,
    imageUrl,
    qImage: imageUrl,
    needsImage: Boolean(imageUrl),
    imageHint: cleanText(raw.imageHint).slice(0, 300),
    visualRequired: Boolean(imageUrl),
    visualKind: imageUrl ? 'source-image' : 'none',
    sourceTitle: source.title,
    sourceUrl,
    researchBacked: true,
    sourceMode: 'harvest',
    sourceDomain: (() => { try { return new URL(sourceUrl).hostname; } catch { return ''; } })(),
    sourcePublisher: source.publisher || '',
    sourceImageUrl: imageUrl,
    harvestedAt: new Date().toISOString(),
  };
}

function fingerprint(value) {
  return cleanText(value).toLowerCase().replace(/\b(soal|nomor)\s*\d+\b/gi, '').replace(/\s+/g, ' ').trim();
}

function dedupe(items) {
  const seen = new Set();
  const out = [];
  for (const item of items) {
    const key = fingerprint(item.question);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    out.push(item);
  }
  return out;
}

function sendError(res, status, error, diagnostics = {}) {
  return res.status(status).json({ success: false, error, diagnostics });
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return sendError(res, 405, 'Method not allowed.');
  }

  const deadline = Date.now() + REQUEST_BUDGET_MS;
  const body = req.body && typeof req.body === 'object' ? req.body : {};
  const hasDataKey = process.env.HASDATA_API_KEY;
  const openRouterKey = process.env.OPENROUTER_API_KEY;

  if (!hasDataKey) return sendError(res, 503, 'HASDATA_API_KEY belum dikonfigurasi.', { type: 'missing_hasdata_api_key' });
  if (!openRouterKey) return sendError(res, 503, 'OPENROUTER_API_KEY belum dikonfigurasi.', { type: 'missing_openrouter_api_key' });

  const topic = cleanText(body.topic).slice(0, 300);
  const mapel = cleanText(body.mapel || 'Umum').slice(0, 120);
  const kelas = cleanText(body.kelas || 'Umum').slice(0, 120);
  const arahan = cleanText(body.arahan || '').slice(0, 600);
  const jumlah = clampInt(body.jumlahSoal, 1, MAX_RETURNED_QUESTIONS, 5);

  if (!topic) return sendError(res, 400, 'Topik wajib diisi.');

  const query = buildSearchQuery({ topic, mapel, kelas, arahan });
  let searchResults = [];
  let searchError = null;

  try {
    searchResults = await searchQuestionPages(hasDataKey, query);
  } catch (error) {
    searchError = {
      status: error?.providerStatus || null,
      message: error?.providerMessage || error?.message || 'Search failed',
      code: error?.code || null,
    };
  }

  if (timeLeft(deadline) < 20_000) {
    return sendError(res, 504, 'Pencarian internet terlalu lama, proses dihentikan sebelum Vercel timeout.', {
      type: 'budget_guard_after_search',
      searchError,
    });
  }

  if (!searchResults.length) {
    return sendError(res, 502, 'Tidak menemukan halaman soal yang cocok.', {
      type: 'no_sources_found',
      query,
      searchError,
    });
  }

  const sourcesToTry = searchResults.slice(0, MAX_SEARCH_RESULTS_TO_TRY);
  const scrapeErrors = [];
  let selectedSource = null;

  for (const result of sourcesToTry) {
    if (timeLeft(deadline) < 24_000) break;
    try {
      const page = await scrapeQuestionPage(hasDataKey, result.url);
      if (page.text.length >= 120) {
        selectedSource = {
          ...result,
          title: page.title || result.title,
          text: page.text,
          images: page.images,
          screenshotUrl: page.screenshotUrl,
        };
        break;
      }
    } catch (error) {
      scrapeErrors.push({
        url: result.url,
        status: error?.providerStatus || null,
        message: error?.providerMessage || error?.message || 'Scrape failed',
        code: error?.code || null,
      });
    }
  }

  if (!selectedSource) {
    return sendError(res, 502, 'Hasil pencarian ditemukan, tetapi halaman soal tidak berhasil dibaca.', {
      type: 'scrape_empty',
      query,
      candidates: sourcesToTry.map((x) => x.url),
      scrapeErrors,
      searchError,
    });
  }

  if (timeLeft(deadline) < 20_000) {
    return sendError(res, 504, 'Pengambilan halaman terlalu lama, proses dihentikan sebelum Vercel timeout.', {
      type: 'budget_guard_before_ai',
      sourceUrl: selectedSource.url,
    });
  }

  let aiResult;
  try {
    aiResult = await extractQuestions({
      apiKey: openRouterKey,
      source: selectedSource,
      topic,
      mapel,
      kelas,
      jumlah,
      arahan,
    });
  } catch (error) {
    const status = error?.providerStatus === 429 ? 429 : 502;
    return sendError(res, status, 'AI ekstraksi gagal memproses sumber.', {
      type: error?.code || 'openrouter_error',
      providerStatus: error?.providerStatus || null,
      providerMessage: error?.providerMessage || error?.message || null,
      model: OPENROUTER_MODEL,
    });
  }

  const questions = dedupe(aiResult.questions)
    .map((raw, index) => normalizeQuestion(raw, selectedSource, index))
    .filter(Boolean)
    .slice(0, jumlah);

  if (!questions.length) {
    return sendError(res, 502, 'Halaman sumber berhasil dibaca, tetapi tidak ada soal yang dapat diekstrak dengan struktur yang valid.', {
      type: 'extraction_empty',
      sourceUrl: selectedSource.url,
      model: aiResult.model,
    });
  }

  return res.status(200).json({
    success: true,
    mode: 'harvest',
    questions,
    researchPerformed: true,
    researchSources: [{
      title: selectedSource.title,
      url: selectedSource.url,
      publisher: selectedSource.publisher,
      extraction: 'hasdata-web',
    }],
    researchImages: selectedSource.images.map((url) => ({
      url,
      sourcePageUrl: selectedSource.url,
      title: selectedSource.title,
    })),
    requestedCount: jumlah,
    returnedCount: questions.length,
    sourceMode: 'harvest',
    diagnostics: {
      query,
      searchCandidates: searchResults.length,
      scrapeCandidatesTried: sourcesToTry.length,
      aiCalls: 1,
      modelUsed: aiResult.model,
      usage: aiResult.usage,
      traceId: aiResult.traceId,
      searchError,
      scrapeErrors,
      timeoutBudgetMs: REQUEST_BUDGET_MS,
      freeLaneGuards: {
        maxSearchApiCallsPerRequest: 1,
        maxScrapesPerRequest: 1,
        maxAiCallsPerRequest: MAX_AI_CALLS_PER_REQUEST,
        defaultMaxQuestionsReturned: MAX_RETURNED_QUESTIONS,
      },
    },
  });
}