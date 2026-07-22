// api/generateMateriSection.js
// Generate 1 bagian materi (1 poin) jadi teks gaya blog + fun fact/mnemonic.
// Dipanggil berkali-kali dari frontend (1x per poin), BUKAN sekali untuk semua,
// supaya tidak timeout dan tidak kepotong (masalah lama sudah diantisipasi).

export default async function handler(req, res) {
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }
  
    const { topic, mapel, poin, poinIndex, totalPoin } = req.body;
  
    if (!topic || !poin) {
      return res.status(400).json({ error: 'topic dan poin wajib diisi' });
    }
  
    const systemPrompt = `Kamu adalah penyusun kurikulum & penulis buku ajar digital untuk siswa Indonesia.
  Tugasmu: mengembangkan SATU poin materi menjadi bacaan gaya blog yang enak dibaca, jelas, dan sesuai untuk siswa.
  Gunakan bahasa Indonesia yang hangat tapi tetap benar secara akademis.
  
  ATURAN OUTPUT — WAJIB balas HANYA dengan JSON valid (tanpa markdown code fence, tanpa teks lain), format persis:
  {
    "title": "judul singkat bagian ini",
    "content_html": "penjelasan gaya blog, 2-4 paragraf, boleh pakai tag <p>, <b>, <i>, <ul><li> saja",
    "highlight_type": "funfact" atau "mnemonic",
    "highlight_html": "isi kotak highlight, singkat (1-3 kalimat atau 1 jembatan keledai), boleh pakai <b>",
    "needs_image": true atau false,
    "image_keyword": "1-3 kata benda konkret dalam BAHASA INGGRIS untuk pencarian foto (misal: 'tapir', 'water cycle diagram', 'pythagorean theorem'). Kosongkan string jika needs_image false."
  }
  
  Panduan menentukan needs_image: true HANYA jika materinya tentang objek/makhluk/tempat yang konkret dan siswa akan sangat terbantu MELIHAT wujud aslinya (contoh: hewan, tumbuhan, organ tubuh, alat, peristiwa alam). Untuk materi abstrak (rumus, konsep sosial, dll) set false.
  
  Panduan memilih highlight_type: pakai "mnemonic" HANYA jika materi punya urutan/istilah yang perlu dihafal (contoh: rumus, urutan proses, singkatan). Selain itu pakai "funfact".`;
  
    const userPrompt = `Mata pelajaran: ${mapel || 'Umum'}
  Judul Bab: ${topic}
  Bagian ke-${poinIndex + 1} dari ${totalPoin}
  Poin yang harus dibahas di bagian ini: "${poin}"
  
  Kembangkan poin ini sesuai aturan di atas.`;
  
    try {
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
          max_tokens: 900,
        }),
      });
  
      if (!hfResponse.ok) {
        const errText = await hfResponse.text();
        console.error('HF error:', errText);
        return res.status(502).json({ error: 'Gagal menghubungi AI (Hugging Face). Coba lagi.' });
      }
  
      const hfData = await hfResponse.json();
      let rawText = hfData.choices?.[0]?.message?.content || '';
  
      // Bersihkan kalau AI iseng nambahin ```json ... ```
      rawText = rawText.replace(/```json/gi, '').replace(/```/g, '').trim();
  
      // Ambil objek JSON pertama yang valid (jaga-jaga ada teks nyasar sebelum/sesudah)
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
  
      // Sanitasi minimal: buang tag berbahaya kalau AI iseng nyisipin
      const sanitize = (html = '') =>
        html.replace(/<script[\s\S]*?<\/script>/gi, '').replace(/on\w+="[^"]*"/gi, '');
  
      return res.status(200).json({
        success: true,
        title: parsed.title || poin,
        content_html: sanitize(parsed.content_html || ''),
        highlight_type: parsed.highlight_type === 'mnemonic' ? 'mnemonic' : 'funfact',
        highlight_html: sanitize(parsed.highlight_html || ''),
        needs_image: !!parsed.needs_image,
        image_keyword: parsed.image_keyword || '',
      });
    } catch (error) {
      console.error('generateMateriSection error:', error);
      return res.status(500).json({ error: 'Terjadi kesalahan server: ' + error.message });
    }
  }