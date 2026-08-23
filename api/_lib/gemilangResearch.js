// Bimbel Gemilang - shared research engine utilities
// Jina Search + Cloudflare Workers AI

const MODEL = process.env.CLOUDFLARE_MODEL || '@cf/zai-org/glm-4.7-flash';
const JINA_TIMEOUT = 30000;
const AI_TIMEOUT = 70000;
const MAX_SOURCE_CHARS = 10000;
const MAX_SOURCES = 24;

export const clean = (value = '') => String(value ?? '')
  .replace(/<script[\s\S]*?<\/script>/gi, ' ')
  .replace(/<style[\s\S]*?<\/style>/gi, ' ')
  .replace(/\s+/g, ' ')
  .trim();

export const normalize = (value = '') => clean(value)
  .toLowerCase()
  .replace(/[^\p{L}\p{N}\s]/gu, ' ')
  .replace(/\s+/g, ' ')
  .trim();

export const fingerprint = (value = '') => normalize(value)
  .replace(/\b(?:soal|nomor)\s+\d+\b/g, '')
  .replace(/\s+/g, ' ')
  .trim();

export const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

export async function fetchTimeout(url, options = {}, timeoutMs = 30000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

function assertEnv() {
  const missing = ['JINA_API_KEY', 'CLOUDFLARE_API_TOKEN', 'CLOUDFLARE_ACCOUNT_ID']
    .filter(name => !process.env[name]);
  if (missing.length) throw new Error(`Environment variable belum tersedia: ${missing.join(', ')}`);
}

export async function jinaSearch(query, { maxResults = 10 } = {}) {
  if (!process.env.JINA_API_KEY) throw new Error('JINA_API_KEY belum tersedia di Vercel.');
  const response = await fetchTimeout(
    `https://s.jina.ai/?q=${encodeURIComponent(query)}`,
    {
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${process.env.JINA_API_KEY}`,
        'User-Agent': 'BimbelGemilangResearch/3.0'
      }
    },
    JINA_TIMEOUT
  );
  const raw = await response.text();
  if (!response.ok) throw new Error(`JINA_HTTP_${response.status}: ${raw}`);

  try {
    const parsed = JSON.parse(raw);
    const items = Array.isArray(parsed) ? parsed : (parsed?.data || parsed?.results || []);
    if (Array.isArray(items) && items.length) {
      return items.slice(0, maxResults).map(item => ({
        title: clean(item?.title || item?.name || ''),
        url: clean(item?.url || item?.link || ''),
        content: clean(item?.content || item?.description || item?.snippet || '').slice(0, MAX_SOURCE_CHARS)
      })).filter(item => item.url || item.content);
    }
  } catch (_) {}

  return raw.trim() ? [{ title: 'Jina Search Result', url: '', content: raw.slice(0, MAX_SOURCE_CHARS) }] : [];
}

export async function readWebPage(source) {
  if (!source?.url) return source;
  try {
    const response = await fetchTimeout(source.url, {
      headers: {
        Accept: 'text/html,application/xhtml+xml,application/pdf',
        'User-Agent': 'Mozilla/5.0 BimbelGemilangResearch/3.0'
      }
    }, JINA_TIMEOUT / 2);
    if (!response.ok) return source;
    const contentType = response.headers.get('content-type') || '';
    if (contentType.includes('application/pdf')) return { ...source, content: source.content || '', contentType };
    const html = await response.text();
    const title = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] || source.title;
    const text = clean(html.replace(/<noscript[\s\S]*?<\/noscript>/gi, ' ')
      .replace(/<script[\s\S]*?<\/script>/gi, ' ')
      .replace(/<style[\s\S]*?<\/style>/gi, ' ')
      .replace(/<svg[\s\S]*?<\/svg>/gi, ' ')
      .replace(/<[^>]+>/g, ' ')).slice(0, 18000);
    return { ...source, title: clean(title), content: text || source.content || '', contentType };
  } catch (_) {
    return source;
  }
}

export function dedupeSources(items = []) {
  const seen = new Set();
  return items.filter(item => {
    const key = normalize(item.url || `${item.title}|${String(item.content || '').slice(0, 250)}`);
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  }).slice(0, MAX_SOURCES);
}

export async function callCloudflareAI(systemPrompt, userPrompt, options = {}) {
  assertEnv();
  const model = options.model || MODEL;
  const response = await fetchTimeout(
    `https://api.cloudflare.com/client/v4/accounts/${process.env.CLOUDFLARE_ACCOUNT_ID}/ai/run/${model}`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.CLOUDFLARE_API_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ]
      })
    },
    AI_TIMEOUT
  );
  const raw = await response.text();
  let data = null;
  try { data = JSON.parse(raw); } catch (_) {}
  if (!response.ok) {
    const message = data?.errors?.[0]?.message || data?.message || raw;
    const error = new Error(`CLOUDFLARE_HTTP_${response.status}: ${message}`);
    error.status = response.status;
    throw error;
  }
  return data;
}

export function extractAIText(data) {
  const result = data?.result || data || {};
  if (typeof result.response === 'string') return result.response;
  if (typeof result.text === 'string') return result.text;
  if (typeof result.output_text === 'string') return result.output_text;
  if (Array.isArray(result.choices)) return result.choices.map(choice => {
    if (typeof choice?.message?.content === 'string') return choice.message.content;
    if (Array.isArray(choice?.message?.content)) return choice.message.content.map(x => x?.text || '').join('');
    return typeof choice?.text === 'string' ? choice.text : '';
  }).join('\n');
  return '';
}

export function extractJsonObjects(text = '') {
  const objects = [];
  let depth = 0;
  let start = -1;
  let inString = false;
  let escaped = false;
  for (let i = 0; i < text.length; i += 1) {
    const ch = text[i];
    if (escaped) { escaped = false; continue; }
    if (ch === '\\') { escaped = true; continue; }
    if (ch === '"') { inString = !inString; continue; }
    if (inString) continue;
    if (ch === '{') { if (depth === 0) start = i; depth += 1; }
    if (ch === '}') {
      depth -= 1;
      if (depth === 0 && start >= 0) {
        try { objects.push(JSON.parse(text.slice(start, i + 1))); } catch (_) {}
        start = -1;
      }
    }
  }
  return objects;
}

export function officialDomainPriority(query = '') {
  const q = normalize(query);
  const domains = [];
  if (q.includes('tka')) {
    domains.push('pusmendik.kemendikdasmen.go.id', 'kemendikdasmen.go.id');
  }
  domains.push('kemendikdasmen.go.id', 'pusmendik.kemendikdasmen.go.id');
  return [...new Set(domains)];
}

export function buildBlueprintQueries({ topic, mapel, kelas, targetYear }) {
  const base = `${clean(topic)} ${clean(mapel)} ${clean(kelas)} ${clean(targetYear)}`.trim();
  const official = officialDomainPriority(base);
  const suffix = official.length ? ` site:${official[0]}` : '';
  return [
    `${base} kerangka asesmen kompetensi${suffix}`,
    `${base} kisi kisi pedoman resmi${suffix}`,
    `${base} framework asesmen${suffix}`,
    `${base} contoh soal dan kompetensi`
  ];
}

export function buildCollectorQueries({ blueprintItem, mapel, kelas, targetYear }) {
  const name = clean(blueprintItem?.subtopic || blueprintItem?.domain || blueprintItem?.name || '');
  const competency = clean(blueprintItem?.competency || '');
  return [
    `${name} ${competency} ${mapel} ${kelas} ${targetYear} soal`,
    `${name} ${mapel} ${kelas} contoh soal HOTS`,
    `${name} ${mapel} ${kelas} latihan soal`,
    `${name} ${mapel} soal TKA`
  ].map(clean).filter(Boolean);
}

export { MODEL };