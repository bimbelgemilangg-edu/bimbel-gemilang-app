const SERP_URL = 'https://api.hasdata.com/scrape/google/serp';
const WEB_URL = 'https://api.hasdata.com/scrape/web';

const SEARCH_TIMEOUT_MS = 7_000;
const SCRAPE_TIMEOUT_MS = 15_000;
const MAX_SERP_RESULTS = 8;
const MAX_PAGE_CHARS = 10_000;
const MAX_IMAGES = 3;

function cleanText(value = '') {
  return String(value ?? '').replace(/\s+/g, ' ').trim();
}

function safeUrl(value) {
  try {
    const u = new URL(String(value || ''));
    return ['http:', 'https:'].includes(u.protocol) ? u.toString() : '';
  } catch {
    return '';
  }
}

function absoluteUrl(raw, base) {
  try {
    const u = new URL(String(raw || ''), base);
    return ['http:', 'https:'].includes(u.protocol) ? u.toString() : '';
  } catch {
    return '';
  }
}

function htmlToText(html = '') {
  return String(html)
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, ' ')
    .replace(/<svg[\s\S]*?<\/svg>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/\s+/g, ' ')
    .trim();
}

function extractImages(content = '', baseUrl = '') {
  const found = new Set();
  const patterns = [
    /<img\b[^>]*?(?:src|data-src|data-lazy-src)=["']([^"']+)["'][^>]*>/gi,
    /!\[[^\]]*\]\((https?:\/\/[^)\s]+)[^)]*\)/gi,
  ];
  for (const re of patterns) {
    let match;
    while ((match = re.exec(content)) && found.size < 15) {
      const url = absoluteUrl(match[1], baseUrl);
      if (url) found.add(url);
    }
  }
  return [...found].slice(0, MAX_IMAGES);
}

async function request(url, init, timeoutMs) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, { ...init, signal: controller.signal });
    const text = await response.text();
    let data = null;
    try { data = text ? JSON.parse(text) : null; } catch { data = null; }
    if (!response.ok) {
      const error = new Error(`HasData HTTP ${response.status}`);
      error.providerStatus = response.status;
      error.providerMessage = String(
        data?.message || data?.error || data?.detail || text || 'Unknown HasData error',
      ).slice(0, 1200);
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
    clearTimeout(timer);
  }
}

export function buildSearchQuery({ topic, mapel, kelas, arahan }) {
  const base = [topic, mapel, kelas].map(cleanText).filter(Boolean).join(' ');
  const hint = cleanText(arahan);
  return cleanText(`${base} soal latihan pembahasan ${hint}`).slice(0, 450);
}

export async function searchQuestionPages(apiKey, query) {
  const endpoint = new URL(SERP_URL);
  endpoint.searchParams.set('q', query);
  endpoint.searchParams.set('domain', 'google.co.id');
  endpoint.searchParams.set('gl', 'id');
  endpoint.searchParams.set('hl', 'id');
  endpoint.searchParams.set('deviceType', 'desktop');
  endpoint.searchParams.set('num', String(MAX_SERP_RESULTS));
  endpoint.searchParams.set('safe', 'active');

  const data = await request(endpoint, {
    headers: {
      Accept: 'application/json',
      'x-api-key': apiKey,
    },
  }, SEARCH_TIMEOUT_MS);

  const results = Array.isArray(data?.organicResults) ? data.organicResults : [];
  const questionish = ['soal', 'latihan', 'tka', 'tryout', 'ujian', 'pembahasan', 'contoh'];
  return results.map((item) => ({
    title: cleanText(item?.title),
    url: safeUrl(item?.link),
    snippet: cleanText(item?.snippet),
    publisher: cleanText(item?.source),
    position: Number(item?.position) || null,
  }))
    .filter((item) => item.url)
    .sort((a, b) => {
      const score = (row) => questionish.reduce(
        (n, term) => n + Number(`${row.title} ${row.snippet}`.toLowerCase().includes(term)),
        0,
      );
      return score(b) - score(a) || (a.position || 999) - (b.position || 999);
    });
}

export async function scrapeQuestionPage(apiKey, url) {
  const data = await request(WEB_URL, {
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
      jsRendering: true,
      blockResources: false,
      extractLinks: true,
      outputFormat: ['markdown', 'html', 'text'],
      removeBase64Images: true,
      screenshot: false,
    }),
  }, SCRAPE_TIMEOUT_MS);

  const markdown = String(data?.markdown || '');
  const html = String(data?.html || data?.content || '');
  const text = cleanText(data?.text || markdown || htmlToText(html)).slice(0, MAX_PAGE_CHARS);
  const pageTitle = cleanText(data?.title || '') || cleanText(data?.extractedData?.title || '');
  const images = extractImages(`${html}\n${markdown}`, url);

  if (!text) {
    throw new Error('Halaman sumber tidak menghasilkan teks yang bisa diproses.');
  }

  return {
    title: pageTitle,
    url,
    text,
    images,
    screenshotUrl: safeUrl(data?.screenshot),
    rawStatus: data?.requestMetadata?.status || 'ok',
  };
}