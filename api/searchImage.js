// api/searchImage.js
// Cari foto dari Wikimedia Commons berdasarkan keyword, GRATIS tanpa API key.
//
// 🔥 PENTING - LAPISAN KEAMANAN:
// Wikimedia Commons adalah database bebas raksasa yang isinya macam-macam,
// termasuk ilustrasi sejarah, satir, dan konten yang TIDAK cocok untuk anak.
// Pencarian kata kunci umum (misal "teacher") bisa nyasar ke gambar yang
// sama sekali tidak relevan atau berbahaya. Karena itu:
// 1. Kita ambil BANYAK kandidat (bukan cuma 1), lalu saring satu-satu.
// 2. Kandidat yang judul ATAU deskripsinya mengandung kata terlarang
//    (senjata, kekerasan, dll) langsung dibuang, tidak pernah ditampilkan.
// 3. Kalau TIDAK ADA kandidat yang lolos filter, kita PILIH TIDAK MENAMPILKAN
//    GAMBAR SAMA SEKALI. Tidak ada gambar jauh lebih aman daripada gambar
//    yang salah/berbahaya.

const UNSAFE_KEYWORDS = [
  // senjata & kekerasan
  'gun', 'pistol', 'rifle', 'weapon', 'firearm', 'bullet', 'shoot', 'shooting',
  'senjata', 'pistol', 'peluru', 'tembak',
  'knife', 'blade', 'sword', 'stab', 'pisau', 'pedang',
  'blood', 'gore', 'wound', 'corpse', 'dead body', 'darah', 'mayat', 'bangkai',
  'war', 'battle', 'combat', 'execution', 'massacre', 'perang', 'eksekusi', 'pembantaian',
  'violence', 'violent', 'assault', 'attack', 'kekerasan', 'serangan',
  'torture', 'abuse', 'penyiksaan', 'kekerasan',
  'nazi', 'hitler', 'terrorist', 'terrorism',
  // konten dewasa
  'nude', 'naked', 'sex', 'porn', 'erotic', 'telanjang',
  // gambar hoax/tidak pantas lain
  'propaganda', 'satire', 'caricature', 'karikatur',
];

const isUnsafe = (text = '') => {
  const lower = text.toLowerCase();
  return UNSAFE_KEYWORDS.some(word => lower.includes(word));
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { keyword } = req.body;
  if (!keyword) {
    return res.status(400).json({ error: 'keyword wajib diisi' });
  }

  // Langsung buang request kalau keyword-nya sendiri sudah mencurigakan
  // (jaga-jaga kalau AI generate keyword yang aneh)
  if (isUnsafe(keyword)) {
    return res.status(200).json({ success: true, found: false });
  }

  try {
    // Ambil 10 kandidat (bukan cuma 1) supaya ada cadangan kalau kandidat
    // pertama tidak lolos filter keamanan.
    const searchUrl = `https://commons.wikimedia.org/w/api.php?action=query&list=search&srnamespace=6&srlimit=10&format=json&origin=*&srsearch=${encodeURIComponent(keyword)}`;
    const searchRes = await fetch(searchUrl);
    const searchData = await searchRes.json();
    const results = searchData?.query?.search || [];

    // Saring: hanya file gambar (bukan pdf/svg diagram), DAN judulnya lolos filter aman
    const candidates = results.filter(r =>
      /\.(jpg|jpeg|png)$/i.test(r.title) && !isUnsafe(r.title) && !isUnsafe(r.snippet || '')
    );

    for (const candidate of candidates) {
      try {
        const infoUrl = `https://commons.wikimedia.org/w/api.php?action=query&titles=${encodeURIComponent(candidate.title)}&prop=imageinfo&iiprop=url|extmetadata&format=json&origin=*`;
        const infoRes = await fetch(infoUrl);
        const infoData = await infoRes.json();

        const pages = infoData?.query?.pages || {};
        const page = Object.values(pages)[0];
        const imageInfo = page?.imageinfo?.[0];
        if (!imageInfo?.url) continue;

        // Lapisan kedua: cek juga deskripsi & kategori lengkapnya, bukan cuma judul.
        // Ini menangkap kasus di mana judul filenya "aman" tapi isinya bermasalah
        // (persis kasus yang pernah kejadian: judul umum, isi tidak layak).
        const meta = imageInfo.extmetadata || {};
        const metaText = [
          meta.ImageDescription?.value,
          meta.Categories?.value,
          meta.ObjectName?.value,
        ].filter(Boolean).join(' ');

        if (isUnsafe(metaText)) continue; // buang, coba kandidat berikutnya

        // Lolos semua filter -> aman ditampilkan
        return res.status(200).json({
          success: true,
          found: true,
          url: imageInfo.url,
          credit: 'Wikimedia Commons',
          sourcePage: `https://commons.wikimedia.org/wiki/${encodeURIComponent(candidate.title)}`,
        });
      } catch (e) {
        continue; // kandidat ini gagal diproses, coba yang berikutnya
      }
    }

    // Tidak ada satupun kandidat yang lolos filter keamanan -> JANGAN tampilkan gambar
    return res.status(200).json({ success: true, found: false });
  } catch (error) {
    console.error('searchImage error:', error);
    // Kalau error apapun terjadi, amannya tetap: tidak menampilkan gambar
    return res.status(200).json({ success: true, found: false });
  }
}