// /api/generateQuizFromTopic.js
// FINAL ORCHESTRATOR
// Research Planner -> Collector -> Dedup -> Cloudflare Generator -> Quality Gate

import {
  buildBlueprintQueries,
  buildCollectorQueries,
  callCloudflareAI,
  clean,
  dedupeSources,
  extractAIText,
  extractJsonObjects,
  fingerprint,
  jinaSearch,
  readWebPage,
  searchDiagnostics,
  MODEL
} from './_lib/gemilangResearch.js';
// 🔥 Jalur diperbarui: questionQualityGate.js dipindah ke `_lib/`
// karena dia modul bantu, bukan endpoint -- lihat penjelasan lengkap
// di kepala file tersebut. Pemindahan itu yang membebaskan slot
// Serverless Function agar deployment tidak lagi menembus batas 12.
import { dedupeQuestions, validateQuestion } from './_lib/questionQualityGate.js';

const MAX_BATCH = 10;
const MAX_CANDIDATES = 30;
const MAX_RESEARCH_CHARS = 50000;

function buildClockImage(clock) {
  if (!clock || !Number.isFinite(Number(clock.hour)) || !Number.isFinite(Number(clock.minute))) return '';
  const hour = ((Number(clock.hour) % 12) + 12) % 12;
  const minute = Math.max(0, Math.min(59, Number(clock.minute)));
  const cx = 140, cy = 140, r = 112;
  const xy = (angle, length) => ({
    x: cx + length * Math.cos(((angle - 90) * Math.PI) / 180),
    y: cy + length * Math.sin(((angle - 90) * Math.PI) / 180)
  });
  const h = xy(hour * 30 + minute * 0.5, r * 0.52);
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
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 280 280" width="280" height="280"><rect width="280" height="280" fill="white"/><circle cx="140" cy="140" r="${r}" fill="white" stroke="#1e293b" stroke-width="3"/>${ticks}${nums}<line x1="140" y1="140" x2="${h.x.toFixed(1)}" y2="${h.y.toFixed(1)}" stroke="#1e293b" stroke-width="6" stroke-linecap="round"/><line x1="140" y1="140" x2="${m.x.toFixed(1)}" y2="${m.y.toFixed(1)}" stroke="#334155" stroke-width="4" stroke-linecap="round"/><circle cx="140" cy="140" r="5" fill="#1e293b"/></svg>`;
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
}

function hasVisualCue(text = '') {
  const q = text.toLowerCase();
  return ['lihat gambar', 'perhatikan gambar', 'gambar berikut', 'lihat grafik', 'perhatikan grafik', 'grafik berikut', 'lihat diagram', 'perhatikan diagram', 'diagram berikut', 'lihat tabel', 'perhatikan tabel', 'tabel berikut'].some(x => q.includes(x));
}

function normalizeQuestion(raw, mode, pages) {
  if (!raw?.type) return null;
  const allowed = ['multiple', 'truefalse', 'multiselect', 'reading', 'shortanswer', 'causeeffect', 'matching'];
  const result = {
    type: raw.type,
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
    sourceMode: mode,
    sourceQuestionVerbatim: Boolean(raw.sourceQuestionVerbatim),
    sourceTitle: clean(raw.sourceTitle || ''),
    sourceUrl: clean(raw.sourceUrl || ''),
    researchBacked: true,
    researchSources: pages.map(p => ({ title: p.title || '', url: p.url || '' })),
    visualRequired: Boolean(raw.qImage || raw.questionImageUrl || raw.needsImage || raw.clock || raw.graph),
    visualKind: raw.clock ? 'clock' : (raw.graph ? 'graph' : (raw.qImage || raw.questionImageUrl ? 'source-image' : (raw.needsImage ? 'photo' : 'none')))
  };
  if (raw.clock) result.qImage = buildClockImage(raw.clock);
  if (!allowed.includes(result.type) || !result.question) return null;
  if (hasVisualCue(result.question) && !result.visualRequired) return null;
  return result;
}

async function researchBlueprint({ topic, mapel, kelas, targetYear, jumlahSoal, arahan }) {
  const queries = buildBlueprintQueries({ topic, mapel, kelas, targetYear });
  const found = [];
  const errors = [];
  for (const query of queries) {
    try { found.push(...await jinaSearch(query, { maxResults: 8 })); }
    catch (error) { errors.push({ query, error: error.message }); }
  }
  const sources = dedupeSources(found);
  const pages = [];
  for (const source of sources.slice(0, 12)) pages.push(await readWebPage(source));
  const pack = pages.map((p, i) => `SOURCE ${i}\nTITLE: ${p.title}\nURL: ${p.url}\nCONTENT:\n${String(p.content || '').slice(0, 7000)}`).join('\n\n---\n\n').slice(0, MAX_RESEARCH_CHARS);

  const system = `Kamu adalah Research Planner Bimbel Gemilang. Buat blueprint sebelum soal dibuat. Prioritaskan sumber resmi. Jangan mengklaim distribusi angka sebagai resmi bila sumber tidak menyatakannya. Jika tidak resmi gunakan allocationBasis="Rekomendasi Gemilang". Output hanya satu JSON object. Schema: {"exam":"","level":"","grade":"","subject":"","targetYear":2027,"totalQuestions":40,"domains":[{"name":"","subtopics":[],"competency":"","cognitiveLevel":"","allocation":0,"allocationBasis":"official|Rekomendasi Gemilang","sourceBasis":"official|supporting|recommendation","sourceIndex":0}],"assessmentForm":[],"officialSources":[],"allocationStatus":"official|recommended","notes":""}`;
  const user = `TOPIK: ${clean(topic)}\nMAPEL: ${clean(mapel)}\nKELAS: ${clean(kelas)}\nTARGET: ${targetYear}\nJUMLAH: ${jumlahSoal}\nARAHAN: ${clean(arahan)}\n\nRISET:\n${pack}`;
  const data = await callCloudflareAI(system, user);
  const raw = extractAIText(data);
  const blueprint = extractJsonObjects(raw)[0] || {
    exam: clean(topic), level: clean(kelas), grade: clean(kelas), subject: clean(mapel), targetYear, totalQuestions: jumlahSoal,
    domains: [{ name: clean(topic), subtopics: [clean(topic)], competency: '', cognitiveLevel: 'mixed', allocation: jumlahSoal, allocationBasis: 'Rekomendasi Gemilang', sourceBasis: 'recommendation', sourceIndex: 0 }],
    allocationStatus: 'recommended', notes: 'Fallback blueprint karena planner AI tidak mengembalikan JSON valid.'
  };
  return { blueprint, pages, queries, errors };
}

async function collectCandidates({ blueprint, mapel, kelas, targetYear, excludeFingerprints = [] }) {
  const excluded = new Set(excludeFingerprints.map(fingerprint));
  const candidates = [];
  const seen = new Set(excluded);
  const domains = Array.isArray(blueprint?.domains) && blueprint.domains.length ? blueprint.domains : [{ name: blueprint?.subject || mapel, subtopics: [blueprint?.subject || mapel], competency: '' }];
  const items = domains.slice(0, 8);
  for (const domain of items) {
    const queries = buildCollectorQueries({ blueprintItem: { ...domain, subtopic: domain.subtopics?.[0] || domain.name }, mapel, kelas, targetYear });
    for (const query of queries) {
      const results = await jinaSearch(query, { maxResults: 6 });
      for (const source of results) {
        const text = clean(source.content || '');
        if (text.length < 80) continue;
        const key = fingerprint(text);
        if (!key || seen.has(key)) continue;
        seen.add(key);
        candidates.push({
          id: `cand_${candidates.length + 1}`,
          text,
          fingerprint: key,
          sourceTitle: source.title || '',
          sourceUrl: source.url || '',
          domain: domain.name || '',
          competency: domain.competency || ''
        });
        if (candidates.length >= MAX_CANDIDATES) break;
      }
      if (candidates.length >= MAX_CANDIDATES) break;
    }
    if (candidates.length >= MAX_CANDIDATES) break;
  }
  return candidates;
}

function candidatePack(candidates) {
  return candidates.map((c, i) => `CANDIDATE ${i}\nDOMAIN: ${c.domain}\nCOMPETENCY: ${c.competency}\nSOURCE TITLE: ${c.sourceTitle}\nSOURCE URL: ${c.sourceUrl}\nTEXT:\n${c.text.slice(0, 3500)}`).join('\n\n---\n\n').slice(0, 50000);
}

async function generateFromCandidates({ topic, mapel, kelas, targetYear, sourceMode, hotsLevel, types, count, arahan, blueprint, candidates }) {
  const system = `Kamu adalah Question Generator Bimbel Gemilang. Output hanya JSONL. Mode SOURCE berarti pilih/adaptasi substansi soal yang benar-benar ada di candidate sources tanpa mengubah maksud; sourceQuestionVerbatim hanya true jika hampir verbatim. Mode PREDICTION berarti buat soal baru berdasarkan pola dan kompetensi candidate. Setiap soal wajib memiliki explanation, answerVerification, analysisSummary. Jangan mengarang URL. Jika soal memerlukan gambar tetapi gambar tidak tersedia, jangan mengeluarkannya.\n\nAllowed types: ${types.join(', ')}. Multiple harus punya 4 options dan correct 0-3. Multiselect harus punya correctAnswers. Truefalse harus punya statements. Reading harus punya readingText dan subQuestions. Matching harus punya matchingPairs. Shortanswer harus punya shortAnswer. Causeeffect harus punya cause/effect dan boolean kunci.`;
  const user = `TOPIK: ${clean(topic)}\nMAPEL: ${clean(mapel)}\nKELAS: ${clean(kelas)}\nTARGET: ${targetYear}\nMODE: ${sourceMode}\nHOTS: ${hotsLevel || 'standar'}\nJUMLAH: ${count}\nARAHAN: ${clean(arahan)}\nBLUEPRINT:\n${JSON.stringify(blueprint)}\n\nCANDIDATES:\n${candidatePack(candidates)}\n\nKeluarkan maksimal ${count} soal.`;
  const data = await callCloudflareAI(system, user);
  return extractJsonObjects(extractAIText(data));
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ success: false, error: 'Method not allowed' });
  const body = req.body || {};
  const { topic, mapel = 'Umum', kelas = '', jumlahSoal, types = ['multiple'], arahan = '', sourceMode = 'source', targetYear = new Date().getFullYear() + 1, hotsLevel = '', excludeFingerprints = [] } = body;
  if (!clean(topic)) return res.status(400).json({ success: false, error: 'Topik wajib diisi.' });
  const count = Math.min(Math.max(Number.parseInt(jumlahSoal, 10) || 5, 1), MAX_BATCH);
  const mode = sourceMode === 'prediction' ? 'prediction' : 'source';

  try {
    const plan = await researchBlueprint({ topic, mapel, kelas, targetYear, jumlahSoal: count, arahan });
    const candidates = await collectCandidates({ blueprint: plan.blueprint, mapel, kelas, targetYear, excludeFingerprints });
    if (!candidates.length) return res.status(502).json({ success: false, error: 'Tidak ada kandidat soal dari riset internet yang lolos collector.', diagnostics: { planner: plan.queries, plannerErrors: plan.errors } });

    const rawQuestions = await generateFromCandidates({ topic, mapel, kelas, targetYear, sourceMode: mode, hotsLevel, types, count, arahan, blueprint: plan.blueprint, candidates });
    const normalized = rawQuestions.map(q => normalizeQuestion(q, mode, plan.pages)).filter(Boolean);
    const validated = [];
    for (const q of normalized) {
      const result = validateQuestion(q, types);
      if (result.ok) validated.push(q);
    }
    const finalQuestions = dedupeQuestions(validated, excludeFingerprints).slice(0, count);
    if (!finalQuestions.length) return res.status(502).json({ success: false, error: 'Soal berhasil dibuat oleh AI, tetapi tidak ada yang lolos quality gate.', debug: { candidateCount: candidates.length, rawQuestionCount: rawQuestions.length } });

    return res.status(200).json({
      success: true,
      questions: finalQuestions,
      blueprint: plan.blueprint,
      requestedCount: count,
      returnedCount: finalQuestions.length,
      possiblyTruncated: finalQuestions.length < count,
      sourceMode: mode,
      // 🔥 Tidak lagi melaporkan "Jina Search" -- label itu sudah tidak
      // benar sejak pencarian pindah ke rantai penyedia gratis. Sekarang
      // melaporkan penyedia yang BENAR-BENAR berhasil dipakai, supaya
      // kalau nanti ada masalah kita tahu lapisan mana yang bekerja.
      researchProvider: searchDiagnostics.lastProvider || 'Free Search Chain',
      aiProvider: 'Cloudflare Workers AI',
      model: MODEL,
      researchSources: plan.pages.map(p => ({ title: p.title || '', url: p.url || '' })),
      collectorCandidateCount: candidates.length,
      diagnostics: { plannerQueries: plan.queries, plannerErrors: plan.errors }
    });
  } catch (error) {
    const status = error.status === 429 ? 429 : 502;
    return res.status(status).json({ success: false, error: status === 429 ? 'Kuota Cloudflare Workers AI sedang mencapai batas.' : 'Gemilang Question Engine gagal.', debug: error.message });
  }
}