// api/searchImage.js
// Cari foto ASLI (bukan AI-generated) dari Wikimedia Commons berdasarkan keyword.
// Gratis total, tanpa API key, tanpa kartu kredit.

export default async function handler(req, res) {
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }
  
    const { keyword } = req.body;
    if (!keyword) {
      return res.status(400).json({ error: 'keyword wajib diisi' });
    }
  
    try {
      // Step 1: cari file gambar yang relevan
      const searchUrl = `https://commons.wikimedia.org/w/api.php?action=query&list=search&srnamespace=6&srlimit=5&format=json&origin=*&srsearch=${encodeURIComponent(keyword)}`;
      const searchRes = await fetch(searchUrl);
      const searchData = await searchRes.json();
  
      const results = searchData?.query?.search || [];
      // Cari yang judul filenya benar-benar gambar (bukan pdf/svg diagram aneh)
      const candidate = results.find(r => /\.(jpg|jpeg|png)$/i.test(r.title)) || results[0];
  
      if (!candidate) {
        return res.status(200).json({ success: true, found: false });
      }
  
      // Step 2: ambil URL asli filenya
      const infoUrl = `https://commons.wikimedia.org/w/api.php?action=query&titles=${encodeURIComponent(candidate.title)}&prop=imageinfo&iiprop=url|extmetadata&format=json&origin=*`;
      const infoRes = await fetch(infoUrl);
      const infoData = await infoRes.json();
  
      const pages = infoData?.query?.pages || {};
      const page = Object.values(pages)[0];
      const imageInfo = page?.imageinfo?.[0];
  
      if (!imageInfo?.url) {
        return res.status(200).json({ success: true, found: false });
      }
  
      return res.status(200).json({
        success: true,
        found: true,
        url: imageInfo.url,
        credit: 'Wikimedia Commons',
        sourcePage: `https://commons.wikimedia.org/wiki/${encodeURIComponent(candidate.title)}`,
      });
    } catch (error) {
      console.error('searchImage error:', error);
      return res.status(200).json({ success: true, found: false });
      // sengaja tetap return 200 found:false biar frontend gak nge-block proses generate
      // hanya karena gambar gagal ketemu — materi teks tetap lanjut tanpa gambar
    }
  }