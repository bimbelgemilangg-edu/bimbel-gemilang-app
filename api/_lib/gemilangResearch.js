// Bimbel Gemilang - Shared Research Engine Utilities
// Free Search Chain:
// 1. DuckDuckGo HTML
// 2. SearXNG public instances
// 3. Cloudflare Browser Rendering /links as final fallback
// Cloudflare Workers AI remains the AI provider.

const MODEL =
  process.env.CLOUDFLARE_MODEL ||
  '@cf/zai-org/glm-4.7-flash';

const SEARCH_TIMEOUT = 12000;
const PAGE_TIMEOUT = 12000;
const AI_TIMEOUT = 70000;
const SEARCH_DELAY_MS = 1400;
const MAX_SOURCE_CHARS = 10000;
const MAX_SOURCES = 24;
const DEFAULT_MAX_RESULTS = 10;

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

export async function fetchTimeout(url, options = {}, timeoutMs = 30000) {
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

// ============================================================
// SEARCH HELPERS
// ============================================================

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
    if (uddg) {
      return decodeURIComponent(uddg);
    }

    if (absolute.hostname.includes('duckduckgo.com')) {
      return '';
    }

    return absolute.href;
  } catch (_) {
    return '';
  }
}

function parseDuckDuckGoHtml(html = '', maxResults = DEFAULT_MAX_RESULTS) {
  const results = [];

  // The result blocks are intentionally parsed with conservative regexes
  // because we do not add an HTML parser dependency just for this endpoint.
  const resultBlockRegex =
    /<div[^>]+class=["'][^"']*result[^"']*["'][^>]*>([\s\S]*?)(?=<div[^>]+class=["'][^"']*result[^"']*["']|<\/body)/gi;

  let blockMatch;

  while (
    (blockMatch = resultBlockRegex.exec(html)) &&
    results.length < maxResults
  ) {
    const block = blockMatch[1];

    const linkMatch = block.match(
      /<a[^>]+class=["'][^"']*result__a[^"']*["'][^>]+href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/i
    );

    if (!linkMatch) continue;

    const url = unwrapDuckDuckGoUrl(linkMatch[1]);
    const title = clean(
      linkMatch[2]
        .replace(/<[^>]+>/g, ' ')
    );

    const snippetMatch = block.match(
      /<(?:a|div)[^>]+class=["'][^"']*result__snippet[^"']*["'][^>]*>([\s\S]*?)<\/(?:a|div)>/i
    );

    const content = clean(
      snippetMatch?.[1]?.replace(/<[^>]+>/g, ' ') || ''
    );

    if (url) {
      results.push({
        title: decodeHtml(title),
        url,
        content: decodeHtml(content).slice(0, MAX_SOURCE_CHARS),
      });
    }
  }

  // Fallback parser for markup variations.
  if (!results.length) {
    const links = [...html.matchAll(
      /<a[^>]+class=["'][^"']*result__a[^"']*["'][^>]+href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi
    )];

    for (const match of links.slice(0, maxResults)) {
      const url = unwrapDuckDuckGoUrl(match[1]);
      if (!url) continue;

      results.push({
        title: clean(match[2].replace(/<[^>]+>/g, ' ')),
        url,
        content: '',
      });
    }
  }

  return results;
}

async function searchDuckDuckGo(query, maxResults) {
  const response = await fetchTimeout(
    `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`,
    {
      headers: {
        Accept: 'text/html,application/xhtml+xml',
        'Accept-Language': 'id-ID,id;q=0.9,en;q=0.8',
        'User-Agent':
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0 Safari/537.36',
      },
    },
    SEARCH_TIMEOUT
  );

  if (!response.ok) {
    throw new Error(`DuckDuckGo HTTP ${response.status}`);
  }

  const html = await response.text();
  return parseDuckDuckGoHtml(html, maxResults);
}

function parseSearxJson(data, maxResults) {
  const items = Array.isArray(data?.results)
    ? data.results
    : [];

  return items
    .slice(0, maxResults)
    .map((item) => ({
      title: clean(item?.title || ''),
      url: clean(item?.url || item?.link || ''),
      content: clean(
        item?.content ||
          item?.description ||
          item?.snippet ||
          ''
      ).slice(0, MAX_SOURCE_CHARS),
    }))
    .filter((item) => item.url);
}

async function searchSearx(instance, query, maxResults) {
  const url = new URL(
    '/search',
    instance
  );

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
    throw new Error(
      `SearXNG ${instance} HTTP ${response.status}`
    );
  }

  const data = await response.json();
  return parseSearxJson(data, maxResults);
}

async function searchCloudflareBrowser(query, maxResults) {
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
  const token = process.env.CLOUDFLARE_API_TOKEN;

  if (!accountId || !token) {
    return [];
  }

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
        gotoOptions: {
          waitUntil: 'domcontentloaded',
        },
      }),
    },
    PAGE_TIMEOUT
  );

  const raw = await response.text();

  if (!response.ok) {
    throw new Error(
      `Cloudflare Browser Rendering HTTP ${response.status}: ${raw}`
    );
  }

  let data = null;
  try {
    data = JSON.parse(raw);
  } catch (_) {}

  const urls = Array.isArray(data?.result)
    ? data.result
    : [];

  return urls
    .filter((url) => {
      try {
        const parsed = new URL(url);
        return (
          !parsed.hostname.includes('duckduckgo.com') &&
          !parsed.hostname.includes('google.com')
        );
      } catch (_) {
        return false;
      }
    })
    .slice(0, maxResults)
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

  if (searchDiagnostics.attempts.length > 60) {
    searchDiagnostics.attempts.shift();
  }
}

/**
 * Free web-search chain. Results are never treated as a fatal error.
 * The legacy name `jinaSearch` remains available for compatibility.
 */
export async function searchWeb(query, { maxResults = DEFAULT_MAX_RESULTS } = {}) {
  const q = clean(query);

  if (!q) {
    return [];
  }

  searchDiagnostics.reset();

  // 1) DuckDuckGo HTML
  try {
    const results = await searchDuckDuckGo(q, maxResults);
    recordAttempt('DuckDuckGo HTML', q, true, results.length);

    if (results.length) {
      searchDiagnostics.lastProvider = 'DuckDuckGo HTML';
      return results;
    }
  } catch (error) {
    recordAttempt(
      'DuckDuckGo HTML',
      q,
      false,
      0,
      error?.message || String(error)
    );
  }

  await sleep(SEARCH_DELAY_MS);

  // 2) SearXNG public instances
  for (const instance of SEARX_INSTANCES) {
    try {
      const results = await searchSearx(
        instance,
        q,
        maxResults
      );

      recordAttempt(
        `SearXNG ${instance}`,
        q,
        true,
        results.length
      );

      if (results.length) {
        searchDiagnostics.lastProvider = `SearXNG ${instance}`;
        return results;
      }
    } catch (error) {
      recordAttempt(
        `SearXNG ${instance}`,
        q,
        false,
        0,
        error?.message || String(error)
      );
    }

    await sleep(SEARCH_DELAY_MS);
  }

  // 3) Cloudflare Browser Rendering is the final search fallback.
  try {
    const results = await searchCloudflareBrowser(
      q,
      maxResults
    );

    recordAttempt(
      'Cloudflare Browser Rendering',
      q,
      true,
      results.length
    );

    if (results.length) {
      searchDiagnostics.lastProvider =
        'Cloudflare Browser Rendering';
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

  // Empty search is a normal outcome, not an exception.
  return [];
}

// Compatibility alias. Existing modules can continue importing jinaSearch.
export const jinaSearch = searchWeb;

// ============================================================
// WEB PAGE READER
// ============================================================

export async function readWebPage(source) {
  if (!source?.url) return source;

  try {
    const response = await fetchTimeout(
      source.url,
      {
        headers: {
          Accept:
            'text/html,application/xhtml+xml,application/pdf',
          'User-Agent':
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/151 Safari/537.36',
        },
      },
      PAGE_TIMEOUT
    );

    if (!response.ok) {
      return source;
    }

    const contentType =
      response.headers.get('content-type') || '';

    if (contentType.includes('application/pdf')) {
      return {
        ...source,
        content: source.content || '',
        contentType,
      };
    }

    const html = await response.text();

    const title =
      html.match(
        /<title[^>]*>([\s\S]*?)<\/title>/i
      )?.[1] || source.title;

    const text = clean(
      html
        .replace(
          /<noscript[\s\S]*?<\/noscript>/gi,
          ' '
        )
        .replace(
          /<script[\s\S]*?<\/script>/gi,
          ' '
        )
        .replace(
          /<style[\s\S]*?<\/style>/gi,
          ' '
        )
        .replace(
          /<svg[\s\S]*?<\/svg>/gi,
          ' '
        )
        .replace(
          /<[^>]+>/g,
          ' '
        )
    ).slice(0, 18000);

    return {
      ...source,
      title: clean(title),
      content:
        text || source.content || '',
      contentType,
    };
  } catch (_) {
    // A source page failing to load is not a fatal research error.
    return source;
  }
}

export function dedupeSources(items = []) {
  const seen = new Set();

  return items
    .filter((item) => {
      const key = normalize(
        item?.url ||
          `${item?.title || ''}|${String(
            item?.content || ''
          ).slice(0, 250)}`
      );

      if (!key || seen.has(key)) {
        return false;
      }

      seen.add(key);
      return true;
    })
    .slice(0, MAX_SOURCES);
}

// ============================================================
// CLOUDFLARE WORKERS AI
// ============================================================

export async function callCloudflareAI(
  systemPrompt,
  userPrompt,
  options = {}
) {
  assertEnv();

  const model =
    options.model || MODEL;

  const response = await fetchTimeout(
    `https://api.cloudflare.com/client/v4/accounts/${process.env.CLOUDFLARE_ACCOUNT_ID}/ai/run/${model}`,
    {
      method: 'POST',
      headers: {
        Authorization:
          `Bearer ${process.env.CLOUDFLARE_API_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages: [
          {
            role: 'system',
            content: systemPrompt,
          },
          {
            role: 'user',
            content: userPrompt,
          },
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
    const message =
      data?.errors?.[0]?.message ||
      data?.message ||
      raw;

    const error = new Error(
      `CLOUDFLARE_HTTP_${response.status}: ${message}`
    );

    error.status = response.status;
    throw error;
  }

  return data;
}

export function extractAIText(data) {
  const result = data?.result || data || {};

  if (typeof result.response === 'string') {
    return result.response;
  }

  if (typeof result.text === 'string') {
    return result.text;
  }

  if (typeof result.output_text === 'string') {
    return result.output_text;
  }

  if (Array.isArray(result.choices)) {
    return result.choices
      .map((choice) => {
        if (
          typeof choice?.message?.content ===
          'string'
        ) {
          return choice.message.content;
        }

        if (
          Array.isArray(choice?.message?.content)
        ) {
          return choice.message.content
            .map((item) => item?.text || '')
            .join('');
        }

        return typeof choice?.text === 'string'
          ? choice.text
          : '';
      })
      .join('\n');
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
    }

    if (ch === '}') {
      depth -= 1;

      if (depth === 0 && start >= 0) {
        try {
          objects.push(
            JSON.parse(
              text.slice(start, i + 1)
            )
          );
        } catch (_) {}

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
    domains.push(
      'pusmendik.kemendikdasmen.go.id',
      'kemendikdasmen.go.id'
    );
  }

  domains.push(
    'kemendikdasmen.go.id',
    'pusmendik.kemendikdasmen.go.id'
  );

  return [...new Set(domains)];
}

export function buildBlueprintQueries({
  topic,
  mapel,
  kelas,
  targetYear,
}) {
  const base = `${clean(topic)} ${clean(mapel)} ${clean(kelas)} ${clean(targetYear)}`.trim();
  const official = officialDomainPriority(base);
  const suffix = official.length
    ? ` site:${official[0]}`
    : '';

  return [
    `${base} kerangka asesmen kompetensi${suffix}`,
    `${base} kisi kisi pedoman resmi${suffix}`,
    `${base} framework asesmen${suffix}`,
    `${base} contoh soal dan kompetensi`,
  ];
}

export function buildCollectorQueries({
  blueprintItem,
  mapel,
  kelas,
  targetYear,
}) {
  const name = clean(
    blueprintItem?.subtopic ||
      blueprintItem?.domain ||
      blueprintItem?.name ||
      ''
  );

  const competency = clean(
    blueprintItem?.competency || ''
  );

  return [
    `${name} ${competency} ${mapel} ${kelas} ${targetYear} soal`,
    `${name} ${mapel} ${kelas} contoh soal HOTS`,
    `${name} ${mapel} ${kelas} latihan soal`,
    `${name} ${mapel} soal TKA`,
  ]
    .map(clean)
    .filter(Boolean);
}

export { MODEL };