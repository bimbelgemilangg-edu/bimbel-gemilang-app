// api/extractPdfBankSoal.js
// ============================================================
// BANK SOAL AI EXTRACTOR — v2.0
// Support semua tipe: PG, PG Kompleks, Benar/Salah,
// Isian Singkat/Angka UTBK, Menjodohkan
// LaTeX lengkap: Fisika, Kimia, Matematika, UTBK/TKA
// ============================================================

export const config = {
  maxDuration: 60,
  api: { bodyParser: { sizeLimit: '15mb' } },
};

// ============================================================
// SYSTEM PROMPT — UPDATED: semua tipe + UTBK/TKA/Sains
// ============================================================

const SYSTEM_PROMPT = `Kamu adalah mesin AI ekstraktor soal ujian tingkat lanjut (UTBK, SNBT, TKA Fisika/Kimia/Matematika/Sains, AKM, dan soal sekolah) yang sangat teliti untuk pembuatan bank soal.

Tugasmu membaca SATU halaman gambar ujian dan mengekstrak SEMUA butir soal yang benar-benar terlihat.

DUKUNGAN TIPE SOAL:
1. pg_sederhana   : Pilihan ganda biasa, satu jawaban benar (A-E).
2. pg_kompleks    : Pilihan ganda kompleks, lebih dari satu jawaban benar.
3. benar_salah    : Pernyataan dengan pilihan Benar/Salah, Ya/Tidak (termasuk format tabel).
4. isian_singkat  : Isian angka UTBK (0-999), isian singkat, atau isian kata/frasa.
5. menjodohkan    : Memasangkan item Kolom Kiri dengan Kolom Kanan.

ATURAN WAJIB:
1. Pertahankan teks soal sedekat mungkin dengan sumber. Jangan meringkas, mengarang, atau mengubah angka.
2. Pertahankan semua simbol sains dan matematika dengan LaTeX bersih:
   - Inline: $...$ — contoh: $x^2$, $\\frac{a}{b}$, $\\sqrt{2}$
   - Display: $$...$$ — contoh: $$\\int_0^\\infty f(x)dx$$
   - Pecahan: \\frac{pembilang}{penyebut}
   - Akar: \\sqrt{n}, \\sqrt[n]{x}
   - Pangkat/indeks: x^{n}, x_{i}
   - Satuan fisika: $10 \\text{ m/s}$, $9{,}8 \\text{ m/s}^2$
   - Derajat sudut: $45^\\circ$
   - Kimia: $\\text{H}_2\\text{O}$, $\\text{CO}_2$, $\\text{NaCl}$
   - Notasi ilmiah: $6{,}02 \\times 10^{23}$
3. Jika soal punya gambar/diagram/grafik/tabel visual, sisipkan {{GAMBAR_1}}, {{GAMBAR_2}} dst di teks_soal. Isi array gambar dengan id dan deskripsi visual.
4. Jangan membuat gambar baru. Jangan menebak gambar yang tidak terlihat.
5. Untuk menjodohkan: isi pasangan kiri-kanan di array "pasangan". Jika tidak ada, kosongkan [].
6. Untuk isian_singkat: isi kunci_jawaban dengan angka/kata jika tertera. Jika tidak, kosongkan "".
7. kunci_jawaban hanya diisi jika JELAS tertulis di halaman. Jika tidak ada, isi string kosong.
8. JANGAN menganggap opsi jawaban A/B/C/D/E sebagai kunci jawaban.
9. JANGAN menggabungkan dua soal berbeda menjadi satu.
10. Nomor soal sesuai yang tercetak. Jika tidak terbaca, gunakan urutan relatif.
11. Jika halaman tidak berisi soal, kembalikan array kosong [].
12. Balas HANYA JSON. Tidak boleh ada markdown, code fence, atau penjelasan tambahan.

FORMAT JSON (mulai dengan [ dan akhiri dengan ]):
[
  {
    "nomor": 1,
    "tipe": "pg_sederhana",
    "teks_soal": "isi soal dengan LaTeX jika perlu",
    "pernyataan": [],
    "opsi_jawaban": ["opsi A", "opsi B", "opsi C", "opsi D", "opsi E"],
    "tabel_benar_salah": [],
    "pasangan": [],
    "kunci_jawaban": "",
    "gambar": []
  }
]

PENJELASAN FIELD PER TIPE:
- pg_sederhana : isi opsi_jawaban (A-E), pernyataan=[],  tabel_benar_salah=[], pasangan=[]
- pg_kompleks  : isi pernyataan + opsi_jawaban (jawaban gabungan), tabel_benar_salah=[], pasangan=[]
- benar_salah  : isi tabel_benar_salah (list pernyataan), opsi_jawaban=[], pasangan=[]
- isian_singkat: opsi_jawaban=[], pernyataan=[], tabel_benar_salah=[], pasangan=[], kunci_jawaban=angka/kata
- menjodohkan  : isi pasangan=[{"kiri":"...","kanan":"..."},...], opsi_jawaban=[], tabel_benar_salah=[]

UNTUK GAMBAR:
"gambar": [{"id": "GAMBAR_1", "deskripsi": "deskripsi singkat visual"}]`;

// ============================================================
// JSON SALVAGE
// ============================================================

function salvagePartialJsonArray(text) {
  const start = text.indexOf('[');
  if (start === -1) return [];
  let depth = 0, inStr = false, esc = false, lastGoodEnd = -1;
  for (let i = start; i < text.length; i++) {
    const ch = text[i];
    if (inStr) {
      if (esc) esc = false;
      else if (ch === '\\') esc = true;
      else if (ch === '"') inStr = false;
      continue;
    }
    if (ch === '"') inStr = true;
    else if (ch === '[' || ch === '{') depth++;
    else if (ch === ']' || ch === '}') {
      depth--;
      if (depth === 1 && ch === '}') lastGoodEnd = i;
    }
  }
  if (lastGoodEnd === -1) return [];
  try {
    const parsed = JSON.parse(text.slice(start, lastGoodEnd + 1) + ']');
    return Array.isArray(parsed) ? parsed : [];
  } catch { return []; }
}

// ============================================================
// HELPERS
// ============================================================

function normalizeBase64(image) {
  return String(image || '').replace(/^data:image\/[a-zA-Z0-9.+-]+;base64,/, '');
}

function normalizeBaseUrl(url) {
  if (!url) return '';
  return String(url).trim().replace(/\/+$/, '');
}

function normalizeProvider(value) {
  return String(value || 'gemini').trim().toLowerCase();
}

function getProviderConfig(body) {
  const provider = normalizeProvider(
    body.provider || process.env.BANKSOAL_AI_PROVIDER || 'gemini'
  );

  const apiKey =
    String(body.apiKey || '').trim() ||
    String(
      provider === 'groq'      ? process.env.GROQ_API_KEY     || '' :
      provider === 'openai'    ? process.env.OPENAI_API_KEY   || '' :
      provider === 'anthropic' ? process.env.ANTHROPIC_API_KEY || '' :
      provider === 'gemini'    ? process.env.GEMINI_API_KEY   || '' :
                                 process.env.BANKSOAL_AI_API_KEY || ''
    ).trim();

  let baseUrl = normalizeBaseUrl(body.baseUrl) || normalizeBaseUrl(process.env.BANKSOAL_AI_BASE_URL);
  let model   = String(body.model || '').trim() || String(process.env.BANKSOAL_AI_MODEL || '').trim();

  // Default config per provider
  if (provider === 'gemini') {
    baseUrl = baseUrl || 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions';
    model   = model   || 'gemini-1.5-flash';   // quota paling lapang di free tier
  }
  if (provider === 'openai') {
    baseUrl = baseUrl || 'https://api.openai.com/v1/chat/completions';
    model   = model   || 'gpt-4o';
  }
  if (provider === 'groq') {
    baseUrl = baseUrl || 'https://api.groq.com/openai/v1/chat/completions';
    model   = model   || 'llama-3.2-90b-vision-preview';
  }
  if (provider === 'anthropic') {
    model = model || 'claude-3-5-sonnet-20241022';
  }
  if (provider === 'openai-compatible') {
    if (!baseUrl) throw Object.assign(new Error('Base URL wajib diisi untuk openai-compatible.'), { status: 400 });
    if (!model)   throw Object.assign(new Error('Model wajib diisi untuk openai-compatible.'),   { status: 400 });
  }
  if (!apiKey) throw Object.assign(new Error('API Key belum dimasukkan.'), { status: 400 });

  return { provider, apiKey, baseUrl, model };
}

// ============================================================
// OPENAI-COMPATIBLE (termasuk Gemini via OpenAI endpoint)
// ============================================================

async function callOpenAICompatible(baseUrl, apiKey, model, base64Image, pageNum, signal) {
  const resp = await fetch(baseUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      temperature: 0.05,
      max_tokens: 8192,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: `Ekstrak seluruh butir soal dari halaman ${pageNum}. Pastikan setiap soal lengkap: opsi A-E, pernyataan, tabel Benar/Salah, pasangan menjodohkan, isian angka, rumus LaTeX, dan referensi gambar. Balas HANYA array JSON.`,
            },
            { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${base64Image}` } },
          ],
        },
      ],
    }),
    signal,
  });

  const rawText = await resp.text();
  let data = {};
  try { data = JSON.parse(rawText); } catch { data = {}; }

  if (!resp.ok) {
    const message = data?.error?.message || data?.message || rawText.slice(0, 500) || `HTTP ${resp.status}`;
    throw Object.assign(new Error(message), { status: resp.status });
  }

  const text = data?.choices?.[0]?.message?.content || data?.choices?.[0]?.text || '';
  return { text, stopReason: data?.choices?.[0]?.finish_reason || null };
}

// ============================================================
// ANTHROPIC (Native API)
// ============================================================

async function callAnthropic(apiKey, model, base64Image, pageNum, signal) {
  const resp = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model,
      max_tokens: 8192,
      temperature: 0.05,
      system: SYSTEM_PROMPT,
      messages: [{
        role: 'user',
        content: [
          { type: 'text', text: `Ekstrak seluruh butir soal dari halaman ${pageNum}. Balas HANYA array JSON.` },
          { type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data: base64Image } },
        ],
      }],
    }),
    signal,
  });

  const rawText = await resp.text();
  let data = {};
  try { data = JSON.parse(rawText); } catch { data = {}; }

  if (!resp.ok) {
    const message = data?.error?.message || rawText.slice(0, 500) || `HTTP ${resp.status}`;
    throw Object.assign(new Error(message), { status: resp.status });
  }

  const text = Array.isArray(data.content)
    ? data.content.filter(b => b?.type === 'text').map(b => b.text).join('\n')
    : '';
  return { text, stopReason: data?.stop_reason || null };
}

// ============================================================
// TEST CONNECTION
// ============================================================

async function testProvider(cfg, signal) {
  if (cfg.provider === 'anthropic') {
    return callAnthropic(cfg.apiKey, cfg.model, '', 0, signal);
  }
  const resp = await fetch(cfg.baseUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${cfg.apiKey}` },
    body: JSON.stringify({ model: cfg.model, max_tokens: 20, messages: [{ role: 'user', content: 'OK' }] }),
    signal,
  });
  const raw = await resp.text();
  if (!resp.ok) {
    let msg = raw;
    try { msg = JSON.parse(raw)?.error?.message || raw; } catch {}
    throw Object.assign(new Error(msg.slice(0, 500)), { status: resp.status });
  }
  return { text: raw };
}

// ============================================================
// HANDLER
// ============================================================

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin',  '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ success: false, error: 'Method not allowed' });

  const body = req.body || {};
  const { image, pageNum, testOnly } = body;

  try {
    const cfg = getProviderConfig(body);

    // ── Mode test koneksi ──
    if (testOnly) {
      const ctrl = new AbortController();
      const t = setTimeout(() => ctrl.abort(), 15000);
      try {
        await testProvider(cfg, ctrl.signal);
        return res.status(200).json({ success: true, message: 'API berhasil terhubung.', provider: cfg.provider, model: cfg.model });
      } finally { clearTimeout(t); }
    }

    if (!image) return res.status(400).json({ success: false, error: 'Gambar halaman (base64) tidak dikirim.' });

    const cleanBase64 = normalizeBase64(image);
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 55000);

    let result;
    try {
      result = cfg.provider === 'anthropic'
        ? await callAnthropic(cfg.apiKey, cfg.model, cleanBase64, pageNum, ctrl.signal)
        : await callOpenAICompatible(cfg.baseUrl, cfg.apiKey, cfg.model, cleanBase64, pageNum, ctrl.signal);
    } finally { clearTimeout(t); }

    if (!result?.text) return res.status(502).json({ success: false, error: 'AI tidak mengembalikan teks.' });

    const cleaned = String(result.text)
      .replace(/^```(?:json)?\s*/i, '')
      .replace(/```\s*$/i, '')
      .trim();

    try {
      const parsed = JSON.parse(cleaned);
      return res.status(200).json({
        success: true,
        questions: Array.isArray(parsed) ? parsed : [],
        provider: cfg.provider,
        model: cfg.model,
        truncated: false,
      });
    } catch {
      const salvaged = salvagePartialJsonArray(cleaned);
      if (salvaged.length > 0) {
        return res.status(200).json({ success: true, questions: salvaged, provider: cfg.provider, model: cfg.model, truncated: true });
      }
      return res.status(502).json({ success: false, error: 'Respons AI tidak bisa dibaca sebagai JSON.', raw: cleaned.slice(0, 1000) });
    }

  } catch (error) {
    if (error?.name === 'AbortError') return res.status(504).json({ success: false, error: 'Request AI timeout.' });
    return res.status(error?.status || 500).json({ success: false, error: error?.message || 'Gagal memanggil AI.' });
  }
}