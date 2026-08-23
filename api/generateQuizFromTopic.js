// Bimbel Gemilang - FINAL Question Engine
// Lightweight orchestration designed for Vercel Hobby.
// Research: 2 search queries max -> one Cloudflare AI generation call.

export const maxDuration = 60;

import {
  buildBlueprintQueries,
  callCloudflareAI,
  clean,
  dedupeSources,
  extractAIText,
  extractJsonObjects,
  fingerprint,
  getSearchDiagnostics,
  jinaSearch,
  MODEL,
} from './_lib/gemilangResearch.js';

import {
  dedupeQuestions,
  validateQuestion,
} from './_lib/questionQualityGate.js';

const MAX_BATCH = 10;
const MAX_RESEARCH_CHARS = 36000;

function buildClockImage(clock) {
  if (!clock) return '';
  const hour = Number(clock.hour);
  const minute = Number(clock.minute);
  if (!Number.isFinite(hour) || !Number.isFinite(minute)) return '';

  const cx = 140;
  const cy = 140;
  const r = 112;
  const xy = (angle, length) => ({
    x: cx + length * Math.cos(((angle - 90) * Math.PI) / 180),
    y: cy + length * Math.sin(((angle - 90) * Math.PI) / 180),
  });

  const h = xy(((hour % 12 + 12) % 12) * 30 + minute * 0.5, r * 0.52);
  const m = xy(minute * 6, r * 0.78);

  const ticks = Array.from({ length: 60 }, (_, i) => {
    const a = xy(i * 6, r);
    const b = xy(i * 6, i % 5 === 0 ? r - 13 : r - 7);
    return `<line x1="${a.x.toFixed(1)}" y1="${a.y.toFixed(1)}" x2="${b.x.toFixed(1)}" y2="${b.y.toFixed(1)}" stroke="#334155" stroke-width="${i % 5 === 0 ? 2 : 1}"/>`;
  }).join('');

  const nums = Array.from({ length: 12 }, (_, i) => {
    const p = xy(i * 30, r - 25);
    return `<text x="${p.x.toFixed(1)}" y="${(p.y + 6).toFixed(1)}" text-anchor="middle" font-family="Arial" font-size="18" font-weight="700" fill="#1e293b">${i === 0 ? 12 : i}</text>`;
  }).join('');

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 280 280" width="280" height="280">
  <rect width="280" height="280" fill="white"/>
  <circle cx="140" cy="140" r="${r}" fill="white" stroke="#1e293b" stroke-width="3"/>
  ${ticks}${nums}
  <line x1="140" y1="140" x2="${h.x.toFixed(1)}" y2="${h.y.toFixed(1)}" stroke="#1e293b" stroke-width="6" stroke-linecap="round"/>
  <line x1="140" y1="140" x2="${m.x.toFixed(1)}" y2="${m.y.toFixed(1)}" stroke="#334155" stroke-width="4" stroke-linecap="round"/>
  <circle cx="140" cy="140" r="5" fill="#1e293b"/>
</svg>`;

  return `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
}

function hasVisualCue(text = '') {
  const value = clean(text).toLowerCase();
  return [
    'lihat gambar', 'perhatikan gambar', 'gambar berikut',
    'lihat grafik', 'perhatikan grafik', 'grafik berikut',
    'lihat diagram', 'perhatikan diagram', 'diagram berikut',
    'lihat tabel', 'perhatikan tabel', 'tabel berikut',
  ].some((term) => value.includes(term));
}

function parseSourceText(sources) {
  return sources.map((source, index) =>
    [
      `SOURCE ${index + 1}`,
      `TITLE: ${clean(source.title || '')}`,
      `URL: ${clean(source.url || '')}`,
      `SNIPPET: ${clean(source.content || '')}`,
    ].join('\n')
  ).join('\n\n---\n\n').slice(0, MAX_RESEARCH_CHARS);
}

function buildFallbackBlueprint({ topic, mapel, kelas, targetYear, count }) {
  return {
    exam: clean(topic),
    level: clean(kelas),
    grade: clean(kelas),
    subject: clean(mapel),
    targetYear,
    totalQuestions: count,
    domains: [{
      name: clean(topic),
      subtopics: [clean(topic)],
      competency: '',
      cognitiveLevel: 'mixed',
      allocation: count,
      allocationBasis: 'Rekomendasi Gemilang',
      sourceBasis: 'recommendation',
    }],
    allocationStatus: 'recommended',
    notes: 'Blueprint operasional Gemilang berdasarkan input guru; bukan kisi-kisi resmi.',
  };
}

function normalizeQuestion(raw, mode, sources) {
  if (!raw || typeof raw !== 'object') return null;

  const type = raw.type || 'multiple';
  const result = {
    type,
    question: clean(raw.question || ''),
    options: Array.isArray(raw.options) ? raw.options.map(clean) : [],
    optionImages: Array.isArray(raw.optionImages) ? raw.optionImages.map(clean) : [],
    optionsAreImages: Boolean(raw.optionsAreImages),
    correct: Number.isInteger(raw.correct) ? raw.correct : 0,
    correctAnswers: Array.isArray(raw.correctAnswers) ? raw.correctAnswers : [],
    statements: Array.isArray(raw.statements) ? raw.statements : [],
    readingText: clean(raw.readingText || ''),
    subQuestions: Array.isArray(raw.subQuestions) ? raw.subQuestions : [],
    shortAnswer: clean(raw.shortAnswer || ''),
    cause: clean(raw.cause || ''),
    effect: clean(raw.effect || ''),
    isCauseTrue: typeof raw.isCauseTrue === 'boolean' ? raw.isCauseTrue : true,
    isEffectTrue: typeof raw.isEffectTrue === 'boolean' ? raw.isEffectTrue : true,
    matchingPairs: Array.isArray(raw.matchingPairs) ? raw.matchingPairs : [],
    explanation: clean(raw.explanation || ''),
    answerVerification: clean(raw.answerVerification || ''),
    analysisSummary: clean(raw.analysisSummary || ''),
    qImage: clean(raw.qImage || raw.questionImageUrl || ''),
    needsImage: Boolean(raw.needsImage),
    imageHint: clean(raw.imageHint || ''),
    imageSource: raw.imageSource || null,
    sourceMode: raw.sourceMode || mode,
    sourceQuestionVerbatim: Boolean(raw.sourceQuestionVerbatim),
    sourceTitle: clean(raw.sourceTitle || ''),
    sourceUrl: clean(raw.sourceUrl || ''),
    researchBacked: mode === 'source' && sources.length > 0,
    researchSources: sources.map((s) => ({
      title: clean(s.title || ''),
      url: clean(s.url || ''),
    })),
    visualRequired: Boolean(raw.qImage || raw.questionImageUrl || raw.needsImage || raw.clock || raw.graph),
    visualKind: raw.clock ? 'clock' : raw.graph ? 'graph' : raw.qImage || raw.questionImageUrl ? 'source-image' : raw.needsImage ? 'photo' : 'none',
  };

  if (raw.clock) {
    result.qImage = buildClockImage(raw.clock);
    result.visualRequired = true;
    result.visualKind = 'clock';
  }

  if (!result.question) return null;
  if (hasVisualCue(result.question) && !result.visualRequired) return null;
  return result;
}

async function collectResearch({ topic, mapel, kelas, targetYear }) {
  const queries = buildBlueprintQueries({ topic, mapel, kelas, targetYear });
  const all = [];
  const errors = [];

  // Only two search queries in one request. This is deliberate to avoid Vercel timeouts.
  for (const query of queries.slice(0, 2)) {
    try {
      const results = await jinaSearch(query);
      all.push(...results);
    } catch (error) {
      errors.push({ query, error: error?.message || String(error) });
    }
  }

  return {
    queries,
    errors,
    sources: dedupeSources(all).slice(0, 10),
  };
}

async function generateQuestions({
  topic,
  mapel,
  kelas,
  targetYear,
  sourceMode,
  hotsLevel,
  types,
  count,
  arahan,
  blueprint,
  sources,
}) {
  const sourceText = parseSourceText(sources);

  const system = `Kamu adalah mesin soal profesional Bimbel Gemilang.

Output HANYA JSONL.
Dilarang markdown dan code fence.

MODE SOURCE: pilih soal yang substansinya benar-benar terlihat dari sumber. Jangan mengarang URL. Jangan mengatakan sourceQuestionVerbatim=true jika soal diparafrasekan.
MODE PREDICTION: buat soal baru berdasarkan kompetensi dan pola dari sumber. Jangan menyebut bocoran.

Setiap soal wajib punya:
- explanation
- answerVerification
- analysisSummary

Untuk multiple: tepat 4 options dan correct 0-3.
Untuk multiselect: correctAnswers array.
Untuk truefalse: statements array.
Untuk shortanswer: shortAnswer.
Untuk causeeffect: cause/effect + booleans.
Untuk matching: matchingPairs.
Untuk reading: readingText + subQuestions.

Jika soal menyebut gambar/grafik/diagram/tabel tetapi stimulus tidak tersedia, jangan keluarkan soal itu.
Allowed types: ${types.join(', ')}.`;

  const user = `TOPIK: ${clean(topic)}
MAPEL: ${clean(mapel)}
KELAS: ${clean(kelas)}
TARGET: ${targetYear}
MODE: ${sourceMode}
HOTS: ${hotsLevel || 'standar'}
JUMLAH: ${count}
ARAHAN: ${clean(arahan)}

BLUEPRINT:
${JSON.stringify(blueprint)}

SUMBER RISET:
${sourceText || '(Tidak ada sumber web yang tersedia. Untuk mode prediction, gunakan blueprint. Untuk mode source, tetap prioritaskan substansi yang dapat diverifikasi dari konteks yang tersedia.)'}

Buat maksimal ${count} soal.`;

  const data = await callCloudflareAI(system, user);
  return extractJsonObjects(extractAIText(data));
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  const body = req.body || {};
  const {
    topic,
    mapel = 'Umum',
    kelas = '',
    jumlahSoal,
    types = ['multiple'],
    arahan = '',
    sourceMode = 'source',
    targetYear = new Date().getFullYear() + 1,
    hotsLevel = '',
    excludeFingerprints = [],
  } = body;

  if (!clean(topic)) {
    return res.status(400).json({ success: false, error: 'Topik wajib diisi.' });
  }

  const count = Math.min(Math.max(Number.parseInt(jumlahSoal, 10) || 5, 1), MAX_BATCH);
  const mode = sourceMode === 'prediction' ? 'prediction' : 'source';
  const diagnostics = {
    stage: 'start',
    provider: null,
    searchQueries: [],
    searchErrors: [],
    searchAttempts: [],
  };

  const startedAt = Date.now();

  try {
    diagnostics.stage = 'research';

    const research = await collectResearch({
      topic,
      mapel,
      kelas,
      targetYear,
    });

    diagnostics.searchQueries = research.queries;
    diagnostics.searchErrors = research.errors;

    const searchState = getSearchDiagnostics();
    diagnostics.provider = searchState.lastProvider;
    diagnostics.searchAttempts = searchState.attempts;

    const sources = research.sources;
    const blueprint = buildFallbackBlueprint({
      topic,
      mapel,
      kelas,
      targetYear,
      count,
    });

    // Do not let a missing web provider kill the whole feature.
    // Prediction can run from blueprint alone. Source mode is allowed a
    // controlled AI fallback, but the response explicitly tells the UI that
    // no verified web source was available.
    const effectiveMode = mode === 'source' && sources.length === 0
      ? 'prediction'
      : mode;

    diagnostics.stage = 'cloudflare-ai';

    const rawQuestions = await generateQuestions({
      topic,
      mapel,
      kelas,
      targetYear,
      sourceMode: effectiveMode,
      hotsLevel,
      types,
      count,
      arahan,
      blueprint,
      sources,
    });

    diagnostics.stage = 'quality-gate';

    const normalized = rawQuestions
      .map((q) => normalizeQuestion(q, effectiveMode, sources))
      .filter(Boolean);

    const validated = [];
    const rejected = [];

    for (const question of normalized) {
      const result = validateQuestion(question, types);
      if (result.ok) validated.push(question);
      else rejected.push(result.reason);
    }

    const finalQuestions = dedupeQuestions(validated, excludeFingerprints).slice(0, count);

    if (!finalQuestions.length) {
      return res.status(502).json({
        success: false,
        error: 'Cloudflare AI mengembalikan hasil, tetapi tidak ada soal yang lolos quality gate.',
        debug: {
          rawQuestionCount: rawQuestions.length,
          normalizedQuestionCount: normalized.length,
          rejected,
          sourceCount: sources.length,
        },
        diagnostics,
      });
    }

    diagnostics.stage = 'success';

    return res.status(200).json({
      success: true,
      questions: finalQuestions,
      blueprint,
      requestedCount: count,
      returnedCount: finalQuestions.length,
      possiblyTruncated: finalQuestions.length < count,
      sourceMode: mode,
      effectiveMode,
      researchProvider: diagnostics.provider || (sources.length ? 'Free Search Chain' : 'Cloudflare AI fallback'),
      aiProvider: 'Cloudflare Workers AI',
      model: MODEL,
      researchSources: sources.map((s) => ({
        title: clean(s.title || ''),
        url: clean(s.url || ''),
      })),
      collectorCandidateCount: sources.length,
      elapsedMs: Date.now() - startedAt,
      diagnostics,
    });
  } catch (error) {
    diagnostics.stage = 'error';
    diagnostics.error = error?.message || String(error);
    diagnostics.elapsedMs = Date.now() - startedAt;

    const status = error?.status === 429 ? 429 : 502;
    return res.status(status).json({
      success: false,
      error: status === 429
        ? 'Kuota Cloudflare Workers AI sedang mencapai batas.'
        : 'Gemilang Question Engine gagal.',
      debug: {
        message: error?.message || String(error),
        hint: String(error?.message || '').includes('aborted')
          ? 'Salah satu request eksternal melewati batas waktu. Research Engine versi final membatasi jumlah pencarian dan tidak melakukan crawl halaman penuh.'
          : undefined,
      },
      diagnostics,
    });
  }
}