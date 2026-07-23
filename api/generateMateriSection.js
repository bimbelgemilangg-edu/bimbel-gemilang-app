// api/generateMateriSection.js
// Generate 1 bagian materi (1 poin) jadi teks gaya blog + fun fact/mnemonic.
// Dipanggil berkali-kali dari frontend (1x per poin), BUKAN sekali untuk semua,
// supaya tidak timeout dan tidak kepotong.
//
// 🔥 PAKAI GOOGLE GEMINI API (gemini-2.5-flash) — gratis, tanpa kartu kredit,
// kuota jauh lebih longgar dibanding Hugging Face Inference Providers.

// 🔥 Daftar model yang dicoba BERURUTAN.
// Kuota gratis Gemini dihitung PER MODEL, dan model paling baru justru paling pelit
// (gemini-3.6-flash cuma 20 request/hari). Model Flash-Lite jatahnya jauh lebih besar.
// Kalau model pertama gagal (kuota habis / nama model berubah), otomatis coba berikutnya.
const GEMINI_MODELS = [
  'gemini-flash-lite-latest',
  'gemini-2.5-flash-lite',
  'gemini-flash-latest',
];

async function callGemini(systemPrompt, userPrompt, modelName) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-goog-api-key': process.env.GEMINI_API_KEY,
    },
    body: JSON.stringify({
      system_instruction: {
        parts: [{ text: systemPrompt }],
      },
      contents: [
        { role: 'user', parts: [{ text: userPrompt }] },
      ],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 4096,
        responseMimeType: 'application/json', // paksa Gemini balas JSON murni
      },
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`GEMINI_HTTP_${response.status}: ${errText}`);
  }

  return response.json();
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { topic, mapel, poin, poinIndex, totalPoin } = req.body;

  if (!topic || !poin) {
    return res.status(400).json({ error: 'topic dan poin wajib diisi' });
  }

  const systemPrompt = `Kamu adalah penyusun kurikulum & penulis buku ajar digital untuk siswa Indonesia, menulis untuk platform bernama "Bimbel Gemilang".
Tugasmu: mengembangkan SATU poin materi menjadi bacaan gaya blog yang enak dibaca, MENDALAM, KONKRET, dan TERSTRUKTUR — bukan penjabaran umum/basa-basi.

ATURAN ISI (WAJIB dipatuhi):
- Jangan cuma mendefinisikan istilah secara umum. WAJIB sertakan minimal 1 CONTOH KONKRET sehari-hari yang relevan dengan poin ini.
- Tulis minimal 3 paragraf yang cukup panjang, dengan alur: (1) jelaskan konsepnya, (2) beri contoh konkret/penerapan nyata, (3) kaitkan dengan hal yang siswa sudah familiar sehari-hari.
- Hindari kalimat generik tanpa penjelasan lanjutan — setiap klaim harus diikuti alasan atau contoh.
- PENTING — STRUKTUR: kalau poin ini pada dasarnya berisi DAFTAR/KATEGORI/LANGKAH/URUTAN (misal: "3 pilar sains", "tahapan pertumbuhan", "jenis-jenis X"), JANGAN ditulis sebagai satu paragraf panjang berisi semua item digabung. WAJIB gunakan format <ul><li><b>Nama Item</b>: penjelasan singkat</li></ul> supaya mudah dipindai mata siswa. Paragraf naratif tetap boleh dipakai sebagai pembuka/penutup sebelum atau sesudah list-nya.

ATURAN MNEMONIC (kalau highlight_type=mnemonic, ini WAJIB diikuti persis):
- JANGAN buat singkatan gabungan suku kata yang tidak bermakna (contoh JELEK yang HARUS DIHINDARI: "PA-MA-WA-SU-KU-IN-JUM").
- WAJIB buat SATU KALIMAT INDONESIA ASLI yang punya makna/cerita sendiri dan lucu/mudah dibayangkan, di mana kata pertama tiap suku kalimat mewakili huruf awal istilah yang harus dihafal. Contoh kualitas yang harus ditiru: "Kucing Hitam Dalam Mobil Desi Centil Mondar-Mandir" (untuk km-hm-dam-m-dm-cm-mm), atau "Waktu Sekolah Intan Cantik Pantang Menyerah Jualan Molen" (untuk 7 besaran pokok SI: waktu-suhu-intensitas cahaya-arus listrik-panjang-massa-jumlah zat).
- flashcard_front = kalimat mnemonic kreatif itu sendiri (bukan singkatan huruf).
- flashcard_back = daftar per kata di kalimat itu dipetakan ke istilah aslinya, format "<b>KataMnemonic</b> → Istilah Asli (satuan/simbol jika relevan)<br>" per baris.

WAJIB balas HANYA dengan JSON valid, format persis (tanpa markdown, tanpa teks lain di luar JSON):
{
  "title": "judul singkat bagian ini",
  "content_html": "penjelasan sesuai ATURAN ISI di atas, boleh pakai tag <p>, <b>, <i>, <ul><li> saja",
  "highlight_type": "funfact atau mnemonic",
  "funfact_html": "HANYA diisi jika highlight_type=funfact. Isi kotak fun fact, 1-3 kalimat, boleh pakai <b>. Kosongkan string jika highlight_type=mnemonic.",
  "flashcard_front": "HANYA diisi jika highlight_type=mnemonic, sesuai ATURAN MNEMONIC di atas. Kosongkan string jika highlight_type=funfact.",
  "flashcard_back": "HANYA diisi jika highlight_type=mnemonic, sesuai ATURAN MNEMONIC di atas. Kosongkan string jika highlight_type=funfact.",
  "needs_image": true atau false,
  "image_keyword": "1-3 kata benda konkret dalam BAHASA INGGRIS untuk pencarian foto (misal: tapir, water cycle diagram, pythagorean theorem). Kosongkan string jika needs_image false."
}

Panduan menentukan needs_image: true HANYA jika materinya tentang objek/makhluk/tempat yang konkret dan siswa akan sangat terbantu MELIHAT wujud aslinya. Untuk materi abstrak (rumus, konsep sosial, dll) set false.

Panduan memilih highlight_type: pakai mnemonic HANYA jika materi punya urutan/istilah/rumus yang perlu betul-betul DIHAFAL siswa DAN kamu bisa bikin kalimat kreatif yang natural (jangan dipaksakan kalau hasilnya bakal aneh). Kalau tidak yakin bisa bikin kalimat yang bagus, pakai funfact saja.`;

  const userPrompt = `Mata pelajaran: ${mapel || 'Umum'}
Judul Bab: ${topic}
Bagian ke-${poinIndex + 1} dari ${totalPoin}
Poin yang harus dibahas di bagian ini: "${poin}"

Kembangkan poin ini sesuai ATURAN ISI dan format JSON di atas. Ingat: siswa harus dapat CONTOH KONKRET, bukan cuma definisi umum.`;

  // 🔥 Coba tiap model secara berurutan sampai ada yang berhasil.
  // Kalau kuota model A habis (429) atau modelnya gak ada (404), langsung lompat ke model B
  // tanpa buang waktu nunggu — karena nunggu gak nolong kalau kuota HARIAN yang habis.
  let geminiData;
  let lastErr;
  for (const modelName of GEMINI_MODELS) {
    try {
      geminiData = await callGemini(systemPrompt, userPrompt, modelName);
      lastErr = null;
      break;
    } catch (e) {
      lastErr = e;
      console.error(`generateMateriSection gagal pakai model ${modelName}:`, e.message);

      // Kalau error-nya BUKAN soal kuota/model tidak ada (misal server sibuk sesaat),
      // kasih 1 kesempatan ulang di model yang sama sebelum pindah model.
      const isQuotaOrNotFound = e.message.includes('429') || e.message.includes('404');
      if (!isQuotaOrNotFound) {
        await new Promise(resolve => setTimeout(resolve, 2000));
        try {
          geminiData = await callGemini(systemPrompt, userPrompt, modelName);
          lastErr = null;
          break;
        } catch (e2) {
          lastErr = e2;
          console.error(`generateMateriSection retry model ${modelName} juga gagal:`, e2.message);
        }
      }
    }
  }

  if (lastErr) {
    const isQuota = lastErr.message.includes('429');
    return res.status(502).json({
      error: isQuota
        ? 'Kuota gratis AI untuk hari ini sudah habis di semua model. Coba lagi besok, atau kurangi jumlah poin per generate.'
        : 'Gagal menghubungi AI (Gemini). Coba lagi beberapa saat lagi.',
      debug: lastErr.message,
    });
  }

  try {
    const candidate = geminiData?.candidates?.[0];
    const rawText = candidate?.content?.parts?.[0]?.text || '';

    if (!rawText) {
      console.error('Gemini response kosong/aneh. finishReason:', candidate?.finishReason, '| full:', JSON.stringify(geminiData));
      return res.status(502).json({ error: 'AI tidak mengembalikan jawaban, coba generate ulang bagian ini.' });
    }

    let parsed;
    try {
      parsed = JSON.parse(rawText);
    } catch (e) {
      // jaga-jaga kalau masih ada teks nyasar di luar JSON
      const jsonMatch = rawText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        console.error('JSON tidak ditemukan di respons. finishReason:', candidate?.finishReason, '| rawText:', rawText.slice(0, 500));
        return res.status(502).json({
          error: candidate?.finishReason === 'MAX_TOKENS'
            ? 'Jawaban AI kepotong karena poin ini terlalu kompleks. Coba pecah jadi poin yang lebih spesifik/singkat, atau generate ulang.'
            : 'AI mengembalikan format tidak valid, coba generate ulang bagian ini.',
        });
      }
      try {
        parsed = JSON.parse(jsonMatch[0]);
      } catch (e2) {
        console.error('JSON ditemukan tapi tetap gagal parse (kemungkinan kepotong). finishReason:', candidate?.finishReason);
        return res.status(502).json({
          error: candidate?.finishReason === 'MAX_TOKENS'
            ? 'Jawaban AI kepotong karena poin ini terlalu kompleks. Coba pecah jadi poin yang lebih spesifik/singkat, atau generate ulang.'
            : 'AI mengembalikan JSON rusak, coba generate ulang bagian ini.',
        });
      }
    }

    const sanitize = (html = '') =>
      html.replace(/<script[\s\S]*?<\/script>/gi, '').replace(/on\w+="[^"]*"/gi, '');

    const isMnemonic = parsed.highlight_type === 'mnemonic'
      && parsed.flashcard_front && parsed.flashcard_back;

    return res.status(200).json({
      success: true,
      title: parsed.title || poin,
      content_html: sanitize(parsed.content_html || ''),
      highlight_type: isMnemonic ? 'mnemonic' : 'funfact',
      funfact_html: sanitize(parsed.funfact_html || ''),
      flashcard_front: isMnemonic ? sanitize(parsed.flashcard_front) : '',
      flashcard_back: isMnemonic ? sanitize(parsed.flashcard_back) : '',
      needs_image: !!parsed.needs_image,
      image_keyword: parsed.image_keyword || '',
    });
  } catch (error) {
    console.error('generateMateriSection parse error:', error);
    return res.status(500).json({ error: 'Terjadi kesalahan server: ' + error.message });
  }
}