// api/_lib/freeSearch.js
// ============================================================
// BIMBEL GEMILANG — FREE SEARCH ENGINE
// TANPA API BERBAYAR, TANPA API KEY, SELAMANYA GRATIS
// ============================================================
//
// KENAPA MODUL INI ADA:
// Sebelumnya sistem bergantung penuh pada Jina Search
// (s.jina.ai) yang sekarang WAJIB API KEY berbayar dan
// kuotanya habis. Ketergantungan pada SATU penyedia berbayar
// itu titik lemah fatal: begitu token habis, SELURUH fitur
// riset mati total.
//
// Modul ini menggantinya dengan RANTAI PENYEDIA BERTINGKAT
// yang semuanya gratis:
//
//   ① DuckDuckGo HTML   -> gratis, tanpa key, tanpa kuota
//   ② SearXNG publik    -> gratis, tanpa key, cadangan
//   ③ Cloudflare Browser-> cadangan terakhir (hemat kuota)
//
// Kalau penyedia ① gagal/kosong, otomatis lanjut ke ②, lalu ③.
// Jadi sistem tidak pernah mati total gara-gara satu layanan
// bermasalah, dan tidak pernah menagih biaya ke pemiliknya.
//
// CATATAN KUOTA CLOUDFLARE (PENTING):
// Workers Free = 10 MENIT waktu browser PER HARI. Itu sedikit.
// Makanya Cloudflare ditaruh PALING AKHIR dan hanya dipakai
// kalau dua penyedia gratis-tanpa-batas di atas gagal. Jangan
// pernah menjadikannya penyedia utama untuk pencarian massal.
// ============================================================

const SEARCH_TIMEOUT_MS = 20000;

// Jeda antarpencarian. Jauh lebih kecil dari versi Jina dulu
// (22 detik) karena penyedia ini tidak punya rate limit ketat
// berbasis akun -- tapi tetap ada jeda supaya kita jadi "tamu
// yang sopan" dan tidak diblokir karena membanjiri server.
const SEARCH_INTERVAL_MS = 1500;

let lastSearchAt = 0;

// Instance SearXNG publik. Sengaja beberapa, karena instance
// publik kadang mati/berganti -- kalau satu tumbang, coba lain.
const SEARXNG_INSTANCES = [
  'https://searx.be',
  'https://search.bus-hit.me',
  'https://searxng.site',
];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const sanitizeText = (value = '') =>
  String(value ?? '')
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#x27;|&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const fetchWithTimeout = async (url, options = {}, timeoutMs = SEARCH_TIMEOUT_MS) => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
};

// Header peramban biasa. Tanpa ini, banyak situs menolak atau
// mengirim versi berbeda ke permintaan yang terlihat seperti bot.
const BROWSER_HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36',
  'Accept-Language': 'id-ID,id;q=0.9,en;q=0.8',
  Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
};

// ============================================================
// PENYEDIA ① — DUCKDUCKGO (HTML)
// ============================================================
// DuckDuckGo menyediakan endpoint HTML sederhana tanpa
// JavaScript, tanpa API key, tanpa pendaftaran. Ini tulang
// punggung utama kita karena benar-benar tanpa batas kuota.

function parseDuckDuckGoHtml(html, maxResults) {
  const results = [];

  // Tiap hasil dibungkus <a class="result__a" href="...">judul</a>
  // dan cuplikannya di <a class="result__snippet">.
  const blockRegex =
    /<a[^>]+class="[^"]*result__a[^"]*"[^>]+href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi;

  const snippetRegex =
    /<a[^>]+class="[^"]*result__snippet[^"]*"[^>]*>([\s\S]*?)<\/a>/gi;

  const snippets = [];
  let snipMatch;
  while ((snipMatch = snippetRegex.exec(html)) !== null) {
    snippets.push(sanitizeText(snipMatch[1]));
  }

  let match;
  let index = 0;

  while ((match = blockRegex.exec(html)) !== null && results.length < maxResults) {
    let url = match[1];

    // DDG membungkus link asli di dalam parameter uddg=...
    // Kita kembalikan ke URL aslinya supaya bisa dibaca/dikutip.
    try {
      if (url.includes('uddg=')) {
        const parsed = new URL(url, 'https://duckduckgo.com');
        const real = parsed.searchParams.get('uddg');
        if (real) url = real;
      }
      if (url.startsWith('//')) url = `https:${url}`;
    } catch (_) {}

    const title = sanitizeText(match[2]);

    if (title && url.startsWith('http')) {
      results.push({
        title,
        url,
        content: snippets[index] || '',
      });
    }

    index += 1;
  }

  return results;
}

async function searchDuckDuckGo(query, maxResults) {
  const url = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`;

  const response = await fetchWithTimeout(url, {
    method: 'POST',
    headers: {
      ...BROWSER_HEADERS,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: `q=${encodeURIComponent(query)}`,
  });

  if (!response.ok) {
    throw new Error(`DDG_HTTP_${response.status}`);
  }

  const html = await response.text();

  // DDG sesekali menampilkan halaman verifikasi anti-bot.
  // Ini bukan "tidak ada hasil" -- ini penolakan, jadi harus
  // dilempar sebagai error supaya pindah ke penyedia cadangan.
  if (/anomaly|unusual traffic|challenge-form/i.test(html) && html.length < 6000) {
    throw new Error('DDG_BLOCKED_TEMPORARILY');
  }

  return parseDuckDuckGoHtml(html, maxResults);
}

// ============================================================
// PENYEDIA ② — SEARXNG (JSON)
// ============================================================
// SearXNG adalah mesin pencari meta sumber terbuka. Instance
// publik menyediakan format JSON tanpa key. Dipakai sebagai
// cadangan kalau DuckDuckGo sedang menolak.

async function searchSearxng(query, maxResults) {
  let lastError = null;

  for (const base of SEARXNG_INSTANCES) {
    try {
      const url = `${base}/search?q=${encodeURIComponent(
        query
      )}&format=json&language=id&safesearch=1`;

      const response = await fetchWithTimeout(url, {
        headers: { ...BROWSER_HEADERS, Accept: 'application/json' },
      });

      if (!response.ok) {
        lastError = new Error(`SEARXNG_HTTP_${response.status}@${base}`);
        continue;
      }

      const data = await response.json();
      const items = Array.isArray(data?.results) ? data.results : [];

      if (items.length === 0) continue;

      return items.slice(0, maxResults).map((item) => ({
        title: sanitizeText(item.title || ''),
        url: sanitizeText(item.url || ''),
        content: sanitizeText(item.content || '').slice(0, 4000),
      }));
    } catch (error) {
      lastError = error;
    }
  }

  if (lastError) throw lastError;
  return [];
}

// ============================================================
// PENYEDIA ③ — CLOUDFLARE BROWSER RENDERING
// ============================================================
// Cadangan TERAKHIR. Cloudflare tidak punya endpoint "cari",
// tapi punya browser sungguhan -- jadi kita suruh dia MEMBUKA
// halaman hasil pencarian, lalu ambil Markdown-nya.
//
// Dipakai paling akhir karena memakan jatah 10 menit/hari.

async function searchViaCloudflare(query, maxResults) {
  if (
    !process.env.CLOUDFLARE_ACCOUNT_ID ||
    !process.env.CLOUDFLARE_API_TOKEN
  ) {
    throw new Error('CLOUDFLARE_CREDENTIALS_MISSING');
  }

  const target = `https://lite.duckduckgo.com/lite/?q=${encodeURIComponent(query)}`;

  const response = await fetchWithTimeout(
    `https://api.cloudflare.com/client/v4/accounts/${process.env.CLOUDFLARE_ACCOUNT_ID}/browser-rendering/links`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.CLOUDFLARE_API_TOKEN}`,
      },
      body: JSON.stringify({ url: target }),
    },
    30000
  );

  const raw = await response.text();

  if (!response.ok) {
    throw new Error(`CF_SEARCH_HTTP_${response.status}: ${raw.slice(0, 200)}`);
  }

  let data;
  try {
    data = JSON.parse(raw);
  } catch (_) {
    throw new Error('CF_SEARCH_BAD_JSON');
  }

  const links = Array.isArray(data?.result)
    ? data.result
    : Array.isArray(data?.result?.links)
    ? data.result.links
    : [];

  return links
    .map((item) => (typeof item === 'string' ? { url: item } : item))
    .map((item) => ({
      title: sanitizeText(item?.text || item?.title || ''),
      url: sanitizeText(item?.url || item?.href || ''),
      content: '',
    }))
    // Buang link internal mesin pencarinya sendiri -- yang kita
    // mau cuma tautan keluar menuju sumber sebenarnya.
    .filter(
      (item) =>
        item.url.startsWith('http') &&
        !/duckduckgo\.com/i.test(item.url)
    )
    .slice(0, maxResults);
}

// ============================================================
// ORKESTRATOR
// ============================================================

const PROVIDERS = [
  { name: 'DuckDuckGo', fn: searchDuckDuckGo, free: true },
  { name: 'SearXNG', fn: searchSearxng, free: true },
  { name: 'Cloudflare', fn: searchViaCloudflare, free: false },
];

/**
 * Cari di web secara gratis.
 *
 * Mengembalikan { results, provider, attempts } -- TIDAK PERNAH
 * melempar error kalau sekadar "tidak ada hasil", karena hasil
 * kosong itu jawaban sah, bukan kegagalan sistem. Error hanya
 * relevan kalau SEMUA penyedia benar-benar gagal, dan itu pun
 * dilaporkan lewat `attempts` supaya bisa didiagnosis.
 */
export async function searchWebFree(query, options = {}) {
  const maxResults = options.maxResults || 8;

  // Sopan santun antarpermintaan.
  const wait = Math.max(0, SEARCH_INTERVAL_MS - (Date.now() - lastSearchAt));
  if (wait > 0) await sleep(wait);
  lastSearchAt = Date.now();

  const attempts = [];

  for (const provider of PROVIDERS) {
    // Cloudflare hanya dipakai kalau diizinkan eksplisit --
    // supaya jatah 10 menit/hari tidak diam-diam terkuras oleh
    // pencarian massal.
    if (!provider.free && options.allowCloudflare === false) {
      continue;
    }

    try {
      const results = await provider.fn(query, maxResults);

      if (results && results.length > 0) {
        return {
          results: results.filter((r) => r.title || r.url),
          provider: provider.name,
          attempts,
        };
      }

      attempts.push({ provider: provider.name, status: 'empty' });
    } catch (error) {
      attempts.push({
        provider: provider.name,
        status: 'error',
        message: error.message,
      });
    }
  }

  // Semua penyedia habis dicoba tanpa hasil. Ini dikembalikan
  // sebagai "kosong", BUKAN dilempar sebagai error -- pemanggil
  // yang memutuskan apakah itu fatal atau bisa dilanjut dengan
  // hasil dari kueri lain.
  return { results: [], provider: null, attempts };
}

/**
 * Jalankan banyak kueri sekaligus, gabungkan, buang duplikat URL.
 * Kegagalan satu kueri TIDAK membatalkan kueri lainnya.
 */
export async function searchManyFree(queries, options = {}) {
  const seen = new Set();
  const all = [];
  const log = [];

  for (const query of queries) {
    const { results, provider, attempts } = await searchWebFree(query, options);

    log.push({
      query,
      provider,
      found: results.length,
      attempts: results.length > 0 ? undefined : attempts,
    });

    for (const item of results) {
      const key = item.url || item.title;
      if (!key || seen.has(key)) continue;
      seen.add(key);
      all.push(item);
    }
  }

  return { sources: all, log };
}

export default searchWebFree;