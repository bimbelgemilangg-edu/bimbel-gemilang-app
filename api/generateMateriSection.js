// api/generateMateriSection.js
// Generate 1 bagian materi (1 poin) jadi teks gaya blog + fun fact/mnemonic.
// Dipanggil berkali-kali dari frontend (1x per poin), BUKAN sekali untuk semua,
// supaya tidak timeout dan tidak kepotong.

async function callHF(systemPrompt, userPrompt) {
  const hfResponse = await fetch('https://router.huggingface.co/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.HF_TOKEN}`,
    },
    body: JSON.stringify({
      model: 'Qwen/Qwen2.5-7B-Instruct',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.7,
      max_tokens: 1400,
    }),
  });

  if (!hfResponse.ok) {
    const errText = await hfResponse.text();
    throw new Error(`HF_HTTP_${hfResponse.status}: ${errText}`);
  }

  return hfResponse.json();
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { topic, mapel, poin, poinIndex, totalPoin } = req.body;

  if (!topic || !poin) {
    return res.status(400).json({ error: 'topic dan poin wajib diisi' });
  }

  const systemPrompt = `Kamu adalah penyusun kurikulum & penulis buku ajar digital untuk siswa Indonesia.
Tugasmu: mengembangkan SATU poin materi menjadi bacaan gaya blog yang enak dibaca, MENDALAM, dan KONKRET — bukan penjabaran umum/basa-basi.

ATURAN ISI (WAJIB dipatuhi, ini yang paling penting):
- Jangan cuma mendefinisikan istilah secara umum. WAJIB sertakan minimal 1 CONTOH KONKRET sehari-hari yang relevan dengan poin ini (contoh angka, contoh kejadian nyata, atau contoh perbandingan yang mudah dibayangkan siswa).
- Tulis minimal 3 paragraf yang cukup panjang (bukan paragraf pendek 1-2 kalimat), dengan alur: (1) jelaskan konsepnya, (2) beri contoh konkret/penerapan nyata, (3) kaitkan dengan hal yang siswa sudah familiar di kehidupan sehari-hari.
- Hindari kalimat generik seperti "hal ini penting untuk dipahami" tanpa penjelasan lanjutan — setiap klaim harus diikuti alasan atau contoh.

ATURAN OUTPUT — WAJIB balas HANYA dengan JSON valid (tanpa markdown code fence, tanpa teks lain), format persis:
{
  "title": "judul singkat bagian ini",
  "content_html": "penjelasan gaya blog SESUAI ATURAN ISI DI ATAS, boleh pakai tag <p>, <b>, <i>, <ul><li> saja",
  "highlight_type": "funfact" atau "mnemonic",
  "funfact_html": "HANYA diisi jika highlight_type=funfact. Isi kotak fun fact, 1-3 kalimat, boleh pakai <b>. Kosongkan string jika highlight_type=mnemonic.",
  "flashcard_front": "HANYA diisi jika highlight_type=mnemonic. Sisi depan kartu: singkatan/jembatan keledai itu sendiri, SANGAT SINGKAT (contoh: 'JOKOWI'). Kosongkan string jika highlight_type=funfact.",
  "flashcard_back": "HANYA diisi jika highlight_type=mnemonic. Sisi belakang kartu: kepanjangan/penjelasan tiap huruf, singkat per baris, boleh pakai <br>. Kosongkan string jika highlight_type=funfact.",
  "needs_image": true atau false,
  "image_keyword": "1-3 kata benda konkret dalam BAHASA INGGRIS untuk pencarian foto (misal: 'tapir', 'water cycle diagram', 'pythagorean theorem'). Kosongkan string jika needs_image false."
}

Panduan menentukan needs_image: true HANYA jika materinya tentang objek/makhluk/tempat yang konkret dan siswa akan sangat terbantu MELIHAT wujud aslinya. Untuk materi abstrak (rumus, konsep sosial, dll) set false.

Panduan memilih highlight_type: pakai "mnemonic" HANYA jika materi punya urutan/istilah/rumus yang perlu betul-betul DIHAFAL siswa. Selain itu pakai "funfact".`;

  const userPrompt = `Mata pelajaran: ${mapel || 'Umum'}
Judul Bab: ${topic}
Bagian ke-${poinIndex + 1} dari ${totalPoin}
Poin yang harus dibahas di bagian ini: "${poin}"

Kembangkan poin ini sesuai ATURAN ISI dan ATURAN OUTPUT di atas. Ingat: siswa harus dapat CONTOH KONKRET, bukan cuma definisi umum.`;

  // Retry sekali kalau gagal transient (provider inference kadang timeout/503 sesaat)
  let hfData;
  let lastErr;
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      hfData = await callHF(systemPrompt, userPrompt);
      lastErr = null;
      break;
    } catch (e) {
      lastErr = e;
      console.error(`generateMateriSection HF attempt ${attempt + 1} failed:`, e.message);
    }
  }

  if (lastErr) {
    return res.status(502).json({
      error: 'Gagal menghubungi AI (Hugging Face) setelah 2 percobaan. Coba lagi beberapa saat lagi.',
      debug: lastErr.message,
    });
  }

  try {
    let rawText = hfData.choices?.[0]?.message?.content || '';
    rawText = rawText.replace(/```json/gi, '').replace(/```/g, '').trim();

    const jsonMatch = rawText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return res.status(502).json({ error: 'AI mengembalikan format tidak valid, coba generate ulang bagian ini.' });
    }

    let parsed;
    try {
      parsed = JSON.parse(jsonMatch[0]);
    } catch (e) {
      return res.status(502).json({ error: 'AI mengembalikan JSON rusak, coba generate ulang bagian ini.' });
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