// Bimbel Gemilang - FINAL lightweight research engine
// Free search chain: DuckDuckGo HTML -> SearXNG -> Cloudflare Browser Rendering
// IMPORTANT: this helper intentionally avoids long page crawling inside a Vercel request.

export const MODEL =
  process.env.CLOUDFLARE_MODEL ||
  '@cf/zai-org/glm-4.7-flash';

const SEARCH_TIMEOUT = 4500;
const BROWSER_TIMEOUT = 5000;
const AI_TIMEOUT = 25000;
const MAX_RESULTS = 6;
const MAX_SEARCH_ATTEMPTS = 5;

const SEARX_INSTANCES = [
  'https://searx.be',
  'https://search.ononoki.org',
  'https://search.bus-hit.me',
];

export const searchDiagnostics = {
  lastProvider: null,
  attempts: [],
  reset() {
    this.lastProvider = null;
    this.attempts = [];
  },
};

export const clean = (value = '') =>
  String(value ?? '')
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();

export const normalize = (value = '') =>
  clean(value)
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();

export const fingerprint = (value = '') =>
  normalize(value)
    .replace(/\b(?:soal|nomor)\s+\d+\b/g, '')
    .replace(/\s+/g, ' ')
    .trim();

export const sleep = (ms) =>
  new Promise((resolve) => setTimeout(resolve, ms));

async function fetchTimeout(url, options = {}, timeoutMs = 5000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(url, {
      ...options,
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timer);
  }
}

function assertEnv() {
  const missing = [
    'CLOUDFLARE_API_TOKEN',
    'CLOUDFLARE_ACCOUNT_ID',
  ].filter((name) => !process.env[name]);

  if (missing.length) {
    throw new Error(
      `Environment variable belum tersedia: ${missing.join(', ')}`
    );
  }
}

function decodeHtml(value = '') {
  return String(value)
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#x2F;/gi, '/')
    .replace(/&#47;/g, '/');
}

function unwrapDuckDuckGoUrl(href = '') {
  const decoded = decodeHtml(href);

  try {
    const absolute = new URL(
      decoded,
      'https://html.duckduckgo.com'
    );

    const uddg = absolute.searchParams.get('uddg');
    if (uddg) return decodeURIComponent(uddg);

    if (absolute.hostname.includes('duckduckgo.com')) return '';
    return absolute.href;
  } catch (_) {
    return '';
  }
}

function parseDuckDuckGoHtml(html = '') {
  const results = [];

  const links = [
    ...html.matchAll(
      /<a[^>]+class=["'][^"']*result__a[^"']*["'][^>]+href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi
    ),
  ];

  for (const match of links.slice(0, MAX_RESULTS)) {
    const url = unwrapDuckDuckGoUrl(match[1]);
    if (!url) continue;

    const title = clean(
      match[2].replace(/<[^>]+>/g, ' ')
    );

    results.push({
      title: decodeHtml(title),
      url,
      content: '',
    });
  }

  // Separate snippet pass. DDG markup can put the snippet outside the anchor.
  const snippets = [
    ...html.matchAll(
      /<div[^>]+class=["'][^"']*result__snippet[^"']*["'][^>]*>([\s\S]*?)<\/div>/gi
    ),
  ];

  for (let i = 0; i < results.length; i += 1) {
    if (snippets[i]?.[1]) {
      results[i].content = clean(
        snippets[i][1].replace(/<[^>]+>/g, ' ')
      ).slice(0, 5000);
    }
  }

  return results;
}

async function searchDuckDuckGo(query) {
  const response = await fetchTimeout(
    `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`,
    {
      headers: {
        Accept: 'text/html,application/xhtml+xml',
        'Accept-Language': 'id-ID,id;q=0.9,en;q=0.8',
        'User-Agent':
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/151 Safari/537.36',
      },
    },
    SEARCH_TIMEOUT
  );

  if (!response.ok) {
    throw new Error(`DuckDuckGo HTTP ${response.status}`);
  }

  return parseDuckDuckGoHtml(await response.text());
}

async function searchSearx(instance, query) {
  const url = new URL('/search', instance);
  url.searchParams.set('q', query);
  url.searchParams.set('format', 'json');
  url.searchParams.set('language', 'id-ID');
  url.searchParams.set('safesearch', '0');

  const response = await fetchTimeout(
    url.href,
    {
      headers: {
        Accept: 'application/json',
        'User-Agent':
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/151 Safari/537.36',
      },
    },
    SEARCH_TIMEOUT
  );

  if (!response.ok) {
    throw new Error(`SearXNG ${instance} HTTP ${response.status}`);
  }

  const data = await response.json();
  const items = Array.isArray(data?.results) ? data.results : [];

  return items.slice(0, MAX_RESULTS).map((item) => ({
    title: clean(item?.title || ''),
    url: clean(item?.url || item?.link || ''),
    content: clean(
      item?.content || item?.description || item?.snippet || ''
    ).slice(0, 5000),
  })).filter((item) => item.url);
}

async function searchCloudflareBrowser(query) {
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
  const token = process.env.CLOUDFLARE_API_TOKEN;
  if (!accountId || !token) return [];

  const searchUrl =
    `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`;

  const response = await fetchTimeout(
    `https://api.cloudflare.com/client/v4/accounts/${accountId}/browser-rendering/links`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: searchUrl,
        visibleLinksOnly: true,
        excludeExternalLinks: false,
        gotoOptions: { waitUntil: 'domcontentloaded' },
      }),
    },
    BROWSER_TIMEOUT
  );

  if (!response.ok) {
    throw new Error(`Cloudflare Browser Rendering HTTP ${response.status}`);
  }

  const data = await response.json();
  const urls = Array.isArray(data?.result) ? data.result : [];

  return urls
    .filter((url) => {
      try {
        const host = new URL(url).hostname;
        return !host.includes('duckduckgo.com');
      } catch (_) {
        return false;
      }
    })
    .slice(0, MAX_RESULTS)
    .map((url) => ({
      title: '',
      url,
      content: '',
    }));
}

function recordAttempt(provider, query, ok, resultCount, error = null) {
  searchDiagnostics.attempts.push({
    provider,
    query,
    ok,
    resultCount,
    error: error || null,
    at: new Date().toISOString(),
  });
}

export async function searchWeb(query) {
  const q = clean(query);
  searchDiagnostics.reset();
  if (!q) return [];

  // Primary: DuckDuckGo
  try {
    const results = await searchDuckDuckGo(q);
    recordAttempt('DuckDuckGo HTML', q, true, results.length);
    if (results.length) {
      searchDiagnostics.lastProvider = 'DuckDuckGo HTML';
      return results;
    }
  } catch (error) {
    recordAttempt('DuckDuckGo HTML', q, false, 0, error?.message || String(error));
  }

  // Fallback: SearXNG instances. Stop as soon as one works.
  for (const instance of SEARX_INSTANCES) {
    try {
      const results = await searchSearx(instance, q);
      recordAttempt(`SearXNG ${instance}`, q, true, results.length);
      if (results.length) {
        searchDiagnostics.lastProvider = `SearXNG ${instance}`;
        return results;
      }
    } catch (error) {
      recordAttempt(`SearXNG ${instance}`, q, false, 0, error?.message || String(error));
    }
  }

  // Last fallback: Cloudflare Browser Rendering.
  try {
    const results = await searchCloudflareBrowser(q);
    recordAttempt('Cloudflare Browser Rendering', q, true, results.length);
    if (results.length) {
      searchDiagnostics.lastProvider = 'Cloudflare Browser Rendering';
      return results;
    }
  } catch (error) {
    recordAttempt(
      'Cloudflare Browser Rendering',
      q,
      false,
      0,
      error?.message || String(error)
    );
  }

  return [];
}

// Backward compatibility. Existing code can keep using the old name.
export const jinaSearch = searchWeb;

export function dedupeSources(items = []) {
  const seen = new Set();
  const output = [];

  for (const item of items) {
    const key = normalize(
      item?.url ||
      `${item?.title || ''}|${String(item?.content || '').slice(0, 300)}`
    );

    if (!key || seen.has(key)) continue;
    seen.add(key);
    output.push(item);

    if (output.length >= 20) break;
  }

  return output;
}

export async function callCloudflareAI(systemPrompt, userPrompt) {
  assertEnv();

  const response = await fetchTimeout(
    `https://api.cloudflare.com/client/v4/accounts/${process.env.CLOUDFLARE_ACCOUNT_ID}/ai/run/${MODEL}`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.CLOUDFLARE_API_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
      }),
    },
    AI_TIMEOUT
  );

  const raw = await response.text();
  let data = null;

  try {
    data = JSON.parse(raw);
  } catch (_) {}

  if (!response.ok) {
    const error = new Error(
      data?.errors?.[0]?.message ||
      data?.message ||
      raw ||
      `Cloudflare HTTP ${response.status}`
    );
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

  if (Array.isArray(result.choices)) {
    return result.choices.map((choice) => {
      if (typeof choice?.message?.content === 'string') {
        return choice.message.content;
      }
      if (Array.isArray(choice?.message?.content)) {
        return choice.message.content.map((part) => part?.text || '').join('');
      }
      return typeof choice?.text === 'string' ? choice.text : '';
    }).join('\n');
  }

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

    if (escaped) {
      escaped = false;
      continue;
    }

    if (ch === '\\') {
      escaped = true;
      continue;
    }

    if (ch === '"') {
      inString = !inString;
      continue;
    }

    if (inString) continue;

    if (ch === '{') {
      if (depth === 0) start = i;
      depth += 1;
    } else if (ch === '}') {
      depth -= 1;
      if (depth === 0 && start !== -1) {
        try {
          objects.push(JSON.parse(text.slice(start, i + 1)));
        } catch (_) {}
        start = -1;
      }
    }
  }

  return objects;
}

export function buildBlueprintQueries({ topic, mapel, kelas, targetYear }) {
  const base = `${clean(topic)} ${clean(mapel)} ${clean(kelas)}`.trim();
  return [
    `${base} kisi kisi TKA ${targetYear}`.trim(),
    `${base} contoh soal latihan`.trim(),
  ];
}

export function buildCollectorQueries({ blueprintItem, mapel, kelas, targetYear }) {
  const topic = clean(
    blueprintItem?.subtopic ||
    blueprintItem?.name ||
    blueprintItem?.topic ||
    ''
  );

  const base = `${topic} ${clean(mapel)} ${clean(kelas)}`.trim();
  return [
    `${base} contoh soal`.trim(),
    `${base} soal HOTS`.trim(),
  ];
}

export function getSearchDiagnostics() {
  return {
    lastProvider: searchDiagnostics.lastProvider,
    attempts: [...searchDiagnostics.attempts],
  };
}