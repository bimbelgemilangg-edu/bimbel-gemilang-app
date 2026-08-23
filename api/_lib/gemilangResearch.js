// Bimbel Gemilang - shared research engine utilities
// FREE SEARCH CHAIN + Cloudflare Workers AI
//
// 🔥 PERUBAHAN BESAR: pencarian TIDAK LAGI bergantung pada Jina.
//
// KENAPA:
// s.jina.ai sekarang WAJIB API key berbayar dan kuotanya habis.
// Bergantung pada SATU penyedia berbayar itu titik lemah fatal --
// begitu token habis, SELURUH fitur riset mati total (persis yang
// terjadi kemarin: error 401 di semua endpoint sekaligus).
//
// GANTINYA: rantai penyedia gratis bertingkat.
//   ① DuckDuckGo HTML  -> gratis, tanpa key, tanpa kuota
//   ② SearXNG publik   -> gratis, tanpa key, cadangan
//   ③ Cloudflare       -> cadangan terakhir (hemat jatah 10 menit/hari)
// Kalau ① gagal/kosong, otomatis lanjut ke ②, lalu ③. Sistem tidak
// pernah mati total gara-gara satu layanan bermasalah.

const MODEL = process.env.CLOUDFLARE_MODEL || '@cf/zai-org/glm-4.7-flash';
const SEARCH_TIMEOUT = 20000;
const AI_TIMEOUT = 70000;
const MAX_SOURCE_CHARS = 10000;
const MAX_SOURCES = 24;

// Jeda antarpencarian. Jauh lebih kecil dari era Jina (yang butuh
// 22 detik demi menghindari rate limit akun) karena penyedia gratis
// ini tidak punya kuota berbasis akun -- tapi tetap ada jeda supaya
// kita jadi "tamu yang sopan" dan tidak diblokir karena membanjiri.
const SEARCH_INTERVAL = 1200;
let lastSearchAt = 0;

// Instance SearXNG publik. Sengaja beberapa: instance publik kadang
// mati atau berganti alamat, jadi kalau satu tumbang, coba yang lain.
const SEARXNG_INSTANCES = [
  'https://searx.be',
  'https://search.bus-hit.me',
  'https://searxng.site'
];

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

// 🔥 JINA_API_KEY SUDAH DIHAPUS dari daftar wajib. Sebelumnya
// keberadaannya diwajibkan di sini, sehingga meskipun pemanggilan AI
// sama sekali tidak memerlukan Jina, seluruh proses tetap gagal saat
// token Jina habis -- kegagalan yang sepenuhnya tidak perlu.
function assertEnv() {
  const missing = ['CLOUDFLARE_API_TOKEN', 'CLOUDFLARE_ACCOUNT_ID']
    .filter(name => !process.env[name]);
  if (missing.length) throw new Error(`Environment variable belum tersedia: ${missing.join(', ')}`);
}

// Header peramban biasa. Tanpa ini banyak situs menolak permintaan
// atau mengirim versi halaman yang berbeda ke sesuatu yang terlihat
// seperti bot.
const BROWSER_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36',
  'Accept-Language': 'id-ID,id;q=0.9,en;q=0.8',
  Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
};

// ============================================================
// PENYEDIA ① — DUCKDUCKGO (HTML)
// ============================================================
// DuckDuckGo punya endpoint HTML sederhana tanpa JavaScript, tanpa
// API key, tanpa pendaftaran. Ini tulang punggung utama kita karena
// benar-benar tanpa batas kuota.

function parseDuckDuckGo(html, maxResults) {
  const results = [];
  const blockRegex = /<a[^>]+class="[^"]*result__a[^"]*"[^>]+href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi;
  const snippetRegex = /<a[^>]+class="[^"]*result__snippet[^"]*"[^>]*>([\s\S]*?)<\/a>/gi;

  const decode = (text = '') => clean(String(text).replace(/<[^>]+>/g, ' '))
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#x27;|&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .trim();

  const snippets = [];
  let snip;
  while ((snip = snippetRegex.exec(html)) !== null) snippets.push(decode(snip[1]));

  let match;
  let index = 0;
  while ((match = blockRegex.exec(html)) !== null && results.length < maxResults) {
    let url = match[1];
    // DDG membungkus link asli di parameter uddg=... Kita kembalikan
    // ke URL aslinya supaya bisa dibaca isinya dan dikutip sumbernya.
    try {
      if (url.includes('uddg=')) {
        const real = new URL(url, 'https://duckduckgo.com').searchParams.get('uddg');
        if (real) url = real;
      }
      if (url.startsWith('//')) url = `https:${url}`;
    } catch (_) {}

    const title = decode(match[2]);
    if (title && url.startsWith('http')) {
      results.push({ title, url, content: (snippets[index] || '').slice(0, MAX_SOURCE_CHARS) });
    }
    index += 1;
  }
  return results;
}

async function searchDuckDuckGo(query, maxResults) {
  const response = await fetchTimeout(
    `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`,
    {
      method: 'POST',
      headers: { ...BROWSER_HEADERS, 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `q=${encodeURIComponent(query)}`
    },
    SEARCH_TIMEOUT
  );
  if (!response.ok) throw new Error(`DDG_HTTP_${response.status}`);
  const html = await response.text();
  // DDG sesekali menampilkan halaman verifikasi anti-bot. Itu bukan
  // "tidak ada hasil" -- itu penolakan, jadi harus dilempar sebagai
  // error supaya pindah ke penyedia cadangan.
  if (/anomaly|unusual traffic|challenge-form/i.test(html) && html.length < 6000) {
    throw new Error('DDG_BLOCKED_TEMPORARILY');
  }
  return parseDuckDuckGo(html, maxResults);
}

// ============================================================
// PENYEDIA ② — SEARXNG (JSON)
// ============================================================

async function searchSearxng(query, maxResults) {
  let lastError = null;
  for (const base of SEARXNG_INSTANCES) {
    try {
      const response = await fetchTimeout(
        `${base}/search?q=${encodeURIComponent(query)}&format=json&language=id&safesearch=1`,
        { headers: { ...BROWSER_HEADERS, Accept: 'application/json' } },
        SEARCH_TIMEOUT
      );
      if (!response.ok) { lastError = new Error(`SEARXNG_HTTP_${response.status}@${base}`); continue; }
      const data = await response.json();
      const items = Array.isArray(data?.results) ? data.results : [];
      if (!items.length) continue;
      return items.slice(0, maxResults).map(item => ({
        title: clean(item.title || ''),
        url: clean(item.url || ''),
        content: clean(item.content || '').slice(0, MAX_SOURCE_CHARS)
      }));
    } catch (error) { lastError = error; }
  }
  if (lastError) throw lastError;
  return [];
}

// ============================================================
// PENYEDIA ③ — CLOUDFLARE BROWSER RENDERING
// ============================================================
// Cadangan TERAKHIR. Cloudflare tidak punya endpoint "cari", tapi
// punya browser sungguhan -- jadi kita suruh dia MEMBUKA halaman
// hasil pencarian lalu ambil tautannya. Ditaruh paling akhir karena
// memakan jatah 10 menit waktu browser per hari.

async function searchCloudflare(query, maxResults) {
  if (!process.env.CLOUDFLARE_ACCOUNT_ID || !process.env.CLOUDFLARE_API_TOKEN) {
    throw new Error('CLOUDFLARE_CREDENTIALS_MISSING');
  }
  const response = await fetchTimeout(
    `https://api.cloudflare.com/client/v4/accounts/${process.env.CLOUDFLARE_ACCOUNT_ID}/browser-rendering/links`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.CLOUDFLARE_API_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ url: `https://lite.duckduckgo.com/lite/?q=${encodeURIComponent(query)}` })
    },
    30000
  );
  const raw = await response.text();
  if (!response.ok) throw new Error(`CF_SEARCH_HTTP_${response.status}: ${raw.slice(0, 200)}`);
  let data;
  try { data = JSON.parse(raw); } catch (_) { throw new Error('CF_SEARCH_BAD_JSON'); }
  const links = Array.isArray(data?.result) ? data.result
    : (Array.isArray(data?.result?.links) ? data.result.links : []);
  return links
    .map(item => (typeof item === 'string' ? { url: item } : item))
    .map(item => ({
      title: clean(item?.text || item?.title || ''),
      url: clean(item?.url || item?.href || ''),
      content: ''
    }))
    .filter(item => item.url.startsWith('http') && !/duckduckgo\.com/i.test(item.url))
    .slice(0, maxResults);
}

// ============================================================
// ORKESTRATOR PENCARIAN
// ============================================================

const PROVIDERS = [
  { name: 'DuckDuckGo', fn: searchDuckDuckGo, free: true },
  { name: 'SearXNG', fn: searchSearxng, free: true },
  { name: 'Cloudflare', fn: searchCloudflare, free: false }
];

// Catatan diagnosis penyedia terakhir yang dipakai -- berguna buat
// ditampilkan di response endpoint tanpa perlu mengubah alur.
export const searchDiagnostics = { lastProvider: null, attempts: [] };

/**
 * Cari di web secara gratis.
 *
 * TIDAK PERNAH melempar error hanya karena "tidak ada hasil" --
 * hasil kosong itu jawaban yang sah, bukan kegagalan sistem. Ini
 * penting: dulu satu kueri kosong bisa membatalkan seluruh riset.
 */
export async function searchWeb(query, { maxResults = 10, allowCloudflare = false } = {}) {
  const wait = Math.max(0, SEARCH_INTERVAL - (Date.now() - lastSearchAt));
  if (wait > 0) await sleep(wait);
  lastSearchAt = Date.now();

  const attempts = [];
  for (const provider of PROVIDERS) {
    if (!provider.free && !allowCloudflare) continue;
    try {
      const results = await provider.fn(query, maxResults);
      if (results && results.length) {
        searchDiagnostics.lastProvider = provider.name;
        return results.filter(item => item.url || item.content);
      }
      attempts.push({ provider: provider.name, status: 'empty' });
    } catch (error) {
      attempts.push({ provider: provider.name, status: 'error', message: error.message });
    }
  }
  searchDiagnostics.attempts = attempts;
  return [];
}

// Alias kompatibilitas: endpoint lama memanggil `jinaSearch(...)`.
// Dibiarkan ada supaya file-file yang sudah jalan tidak perlu diubah
// satu per satu, tapi isinya sekarang pencarian gratis -- bukan Jina.
export const jinaSearch = searchWeb;

export async function readWebPage(source) {
  if (!source?.url) return source;
  try {
    const response = await fetchTimeout(source.url, {
      headers: {
        Accept: 'text/html,application/xhtml+xml,application/pdf',
        'User-Agent': 'Mozilla/5.0 BimbelGemilangResearch/3.0'
      }
    }, SEARCH_TIMEOUT);
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