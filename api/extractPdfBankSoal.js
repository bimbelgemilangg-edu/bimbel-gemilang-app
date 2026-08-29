// api/extractPdfBankSoal.js
// ============================================================
// EKSTRAKSI SOAL DARI GAMBAR HALAMAN PDF (untuk Bank Soal)
// ============================================================
// Dipanggil dari src/pages/admin/bank-soal/AdvancedQuestionExtractor.jsx
// Menerima 1 gambar halaman (base64), balikin array soal berbentuk JSON.
// API key provider AI TIDAK BOLEH ada di frontend -- makanya lewat sini,
// sama seperti pola api/uploadBankSoalImages.js (service key di backend).
//
// ENV VAR YANG DIPERLUKAN (set di Vercel > Settings > Environment Variables):
//   - BANKSOAL_AI_PROVIDER   ("groq" | "openai" | "anthropic"), default "groq"
//   - GROQ_API_KEY           (kalau pakai groq -- gratis, ambil di console.groq.com/keys)
//   - OPENAI_API_KEY         (kalau pakai openai)
//   - ANTHROPIC_API_KEY      (kalau pakai anthropic)
// ============================================================

export const config = { maxDuration: 60, api: { bodyParser: { sizeLimit: '15mb' } } };

const SYSTEM_PROMPT = `Kamu adalah mesin AI ekstraktor soal ujian tingkat lanjut yang sangat akurat untuk bidang Matematika, Fisika, dan Kimia.
Tugasmu adalah menganalisis gambar halaman ujian dan mengekstrak setiap soal secara presisi ke dalam JSON.

ATURAN UMUM:
1. Pertahankan seluruh persamaan matematika, variabel, sudut, dan simbol eksakta menggunakan format LaTeX standar yang bersih, dibungkus delimiter dolar: "$...$" untuk rumus sebaris dan "$$...$$" untuk rumus berdiri sendiri.
2. DETEKSI GAMBAR/DIAGRAM/GRAFIK: Jika suatu soal memiliki ilustrasi visual, sisipkan token placeholder persis {{GAMBAR}} pada posisi yang tepat di dalam "teks_soal". Beri juga "deskripsi" singkat gambar di array "gambar". Jika soal tanpa gambar, "gambar": [].

TIGA TIPE SOAL — tentukan "tipe" tiap soal dengan tepat:
- "pg_sederhana": Pilihan Ganda biasa (opsi A-E tunggal).
- "pg_kompleks": Pilihan Ganda Kompleks dengan pernyataan bernomor (1, 2, 3) dan opsi A-E.
- "benar_salah": Pilihan Ganda Kompleks Model Kategori dengan tabel pernyataan Benar/Salah (tanpa opsi A-E).

Balas HANYA dengan JSON murni: array of objects. JANGAN ada kalimat pembuka/penutup atau code fence. Mulai dengan "[" dan akhiri dengan "]". Struktur tiap objek:
{
  "nomor": 1,
  "tipe": "pg_sederhana" | "pg_kompleks" | "benar_salah",
  "teks_soal": "Teks soal lengkap dengan LaTeX dan token {{GAMBAR_1}} jika ada.",
  "pernyataan": [],
  "opsi_jawaban": [],
  "tabel_benar_salah": [],
  "kunci_jawaban": "",
  "gambar": [ { "id": "GAMBAR_1", "deskripsi": "deskripsi singkat gambar" } ]
}`;

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
    else if (ch === '{' || ch === '[') depth++;
    else if (ch === '}' || ch === ']') {
      depth--;
      if (depth === 1 && ch === '}') lastGoodEnd = i;
    }
  }
  if (lastGoodEnd === -1) return [];
  try {
    const parsed = JSON.parse(text.slice(start, lastGoodEnd + 1) + ']');
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function callAnthropic(apiKey, base64Image, pageNum) {
  const resp = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 4096,
      system: SYSTEM_PROMPT,
      messages: [{
        role: 'user',
        content: [
          { type: 'text', text: `Ekstrak seluruh butir soal dari halaman ${pageNum} ini ke dalam format JSON sesuai instruksi sistem. Balas HANYA dengan array JSON.` },
          { type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data: base64Image } },
        ],
      }],
    }),
  });
  if (!resp.ok) {
    const err = await resp.json().catch(() => ({}));
    throw Object.assign(new Error(err.error?.message || `HTTP ${resp.status}`), { status: resp.status });
  }
  const data = await resp.json();
  const text = (data.content || []).filter(b => b.type === 'text').map(b => b.text).join('\n');
  return { text, stopReason: data.stop_reason };
}

async function callOpenAICompatible(baseUrl, apiKey, model, base64Image, pageNum) {
  const resp = await fetch(baseUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model,
      max_tokens: 4096,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        {
          role: 'user',
          content: [
            { type: 'text', text: `Ekstrak seluruh butir soal dari halaman ${pageNum} ini ke dalam format JSON sesuai instruksi sistem. Balas HANYA dengan array JSON.` },
            { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${base64Image}` } },
          ],
        },
      ],
    }),
  });
  if (!resp.ok) {
    const err = await resp.json().catch(() => ({}));
    throw Object.assign(new Error(err.error?.message || `HTTP ${resp.status}`), { status: resp.status });
  }
  const data = await resp.json();
  const text = data.choices?.[0]?.message?.content || '';
  return { text, stopReason: data.choices?.[0]?.finish_reason };
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ success: false, error: 'Method not allowed' });

  const { image, pageNum } = req.body || {};
  if (!image) return res.status(400).json({ success: false, error: 'Gambar halaman (base64) tidak dikirim.' });

  const provider = (process.env.BANKSOAL_AI_PROVIDER || 'groq').toLowerCase();
  const cleanBase64 = String(image).replace(/^data:image\/(png|jpeg);base64,/, '');

  try {
    let result;
    if (provider === 'anthropic') {
      if (!process.env.ANTHROPIC_API_KEY) throw Object.assign(new Error('ANTHROPIC_API_KEY belum diset di Vercel.'), { status: 503 });
      result = await callAnthropic(process.env.ANTHROPIC_API_KEY, cleanBase64, pageNum);
    } else if (provider === 'openai') {
      if (!process.env.OPENAI_API_KEY) throw Object.assign(new Error('OPENAI_API_KEY belum diset di Vercel.'), { status: 503 });
      result = await callOpenAICompatible('https://api.openai.com/v1/chat/completions', process.env.OPENAI_API_KEY, 'gpt-4o', cleanBase64, pageNum);
    } else {
      if (!process.env.GROQ_API_KEY) throw Object.assign(new Error('GROQ_API_KEY belum diset di Vercel.'), { status: 503 });
      result = await callOpenAICompatible('https://api.groq.com/openai/v1/chat/completions', process.env.GROQ_API_KEY, 'llama-3.2-90b-vision-preview', cleanBase64, pageNum);
    }

    const cleaned = result.text.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/i, '').trim();
    try {
      const parsed = JSON.parse(cleaned);
      return res.status(200).json({ success: true, questions: Array.isArray(parsed) ? parsed : [] });
    } catch {
      const salvaged = salvagePartialJsonArray(cleaned);
      if (salvaged.length > 0) return res.status(200).json({ success: true, questions: salvaged, truncated: true });
      return res.status(502).json({ success: false, error: 'Respons AI tidak bisa dibaca sebagai JSON.' });
    }
  } catch (e) {
    return res.status(e.status || 500).json({ success: false, error: e.message || 'Gagal memanggil AI.' });
  }
}