// Bimbel Gemilang - SAFE / FAST Research Helper
// Runtime goal: never let free-search fallback chains consume the whole
// Vercel invocation. Generate-from-topic uses at most two quick searches.

export const MODEL =
  process.env.CLOUDFLARE_MODEL ||
  '@cf/zai-org/glm-4.7-flash';

const SEARCH_TIMEOUT = 2200;
const AI_TIMEOUT = 18000;
const MAX_RESULTS = 6;

const SEARX_INSTANCES = [
  'https://searx.be',
  'https://search.ononoki.org',
];

const state = {
  lastProvider: null,
  attempts: [],
};

export const searchDiagnostics = {
  reset() {
    state.lastProvider = null;
    state.attempts = [];
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

async function fetchTimeout(url, options = {}, timeoutMs = SEARCH_TIMEOUT) {
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

function record(provider, query, ok, count, error = null) {
  state.attempts.push({
    provider,
    query,
    ok,
    resultCount: count,
    error: error || null,
  });
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
    const absolute = new URL(decoded, 'https://html.duckduckgo.com');
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

  const snippets = [
    ...html.matchAll(
      /<div[^>]+class=["'][^"']*result__snippet[^"']*["'][^>]*>([\s\S]*?)<\/div>/gi
    ),
  ];

  for (const [index, match] of links.slice(0, MAX_RESULTS).entries()) {
    const url = unwrapDuckDuckGoUrl(match[1]);
    if (!url) continue;

    results.push({
      title: decodeHtml(clean(match[2].replace(/<[^>]+>/g, ' '))),
      url,
      content: snippets[index]
        ? clean(snippets[index][1].replace(/<[^>]+>/g, ' ')).slice(0, 4000)
        : '',
    });
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
  const results = Array.isArray(data?.results) ? data.results : [];

  return results.slice(0, MAX_RESULTS).map((item) => ({
    title: clean(item?.title || ''),
    url: clean(item?.url || item?.link || ''),
    content: clean(
      item?.content || item?.description || item?.snippet || ''
    ).slice(0, 4000),
  })).filter((item) => item.url);
}

// Fast search chain used by Generate-from-Topic.
// Important: Browser Rendering is deliberately NOT called here.
// It belongs in a separate research workflow because it is slow/limited.
export async function searchWeb(query) {
  const q = clean(query);
  if (!q) return [];

  // Try DuckDuckGo first.
  try {
    const results = await searchDuckDuckGo(q);
    record('DuckDuckGo HTML', q, true, results.length);
    if (results.length) {
      state.lastProvider = 'DuckDuckGo HTML';
      return results;
    }
  } catch (error) {
    record('DuckDuckGo HTML', q, false, 0, error?.message || String(error));
  }

  // Then only two quick SearXNG attempts.
  for (const instance of SEARX_INSTANCES) {
    try {
      const results = await searchSearx(instance, q);
      record(`SearXNG ${instance}`, q, true, results.length);
      if (results.length) {
        state.lastProvider = `SearXNG ${instance}`;
        return results;
      }
    } catch (error) {
      record(
        `SearXNG ${instance}`,
        q,
        false,
        0,
        error?.message || String(error)
      );
    }
  }

  // Empty is a valid result. Never throw here.
  return [];
}

// Backward compatibility with the existing project.
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

    if (output.length >= 12) break;
  }

  return output;
}

export async function callCloudflareAI(systemPrompt, userPrompt) {
  const missing = [
    'CLOUDFLARE_API_TOKEN',
    'CLOUDFLARE_ACCOUNT_ID',
  ].filter((name) => !process.env[name]);

  if (missing.length) {
    throw new Error(
      `Environment variable belum tersedia: ${missing.join(', ')}`
    );
  }

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
        return choice.message.content
          .map((part) => part?.text || '')
          .join('');
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
    lastProvider: state.lastProvider,
    attempts: [...state.attempts],
  };
}