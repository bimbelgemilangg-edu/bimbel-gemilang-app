// src/utils/logoPtnHelper.js
// ============================================================
// Helper Logo Resmi PTN Indonesia (173 Kampus)
// Menyediakan URL logo resmi berkualitas tinggi untuk universitas negeri,
// institut, UIN, dan politeknik negeri dengan fallback monogram dinamis.
// ============================================================

const LOGO_PTN_MAP = {
  // Universitas Top & Populer
  UI: 'https://upload.wikimedia.org/wikipedia/id/thumb/0/07/Makara_UI.svg/480px-Makara_UI.svg.png',
  ITB: 'https://upload.wikimedia.org/wikipedia/id/thumb/9/95/Logo_Institut_Teknologi_Bandung.png/480px-Logo_Institut_Teknologi_Bandung.png',
  UGM: 'https://upload.wikimedia.org/wikipedia/id/thumb/8/86/Logo_Universitas_Gadjah_Mada.png/480px-Logo_Universitas_Gadjah_Mada.png',
  ITS: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/05/Lambang_Institut_Teknologi_Sepuluh_Nopember.png/480px-Lambang_Institut_Teknologi_Sepuluh_Nopember.png',
  IPB: 'https://upload.wikimedia.org/wikipedia/id/thumb/1/1b/Logo_IPB.svg/480px-Logo_IPB.svg.png',
  UNAIR: 'https://upload.wikimedia.org/wikipedia/id/thumb/8/87/Logo_Universitas_Airlangga.png/480px-Logo_Universitas_Airlangga.png',
  UNDIP: 'https://upload.wikimedia.org/wikipedia/id/thumb/8/89/Logo_Universitas_Diponegoro.png/480px-Logo_Universitas_Diponegoro.png',
  UNPAD: 'https://upload.wikimedia.org/wikipedia/id/thumb/8/80/Logo_Universitas_Padjadjaran.svg/480px-Logo_Universitas_Padjadjaran.svg.png',
  UB: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/bb/Logo_Universitas_Brawijaya.svg/480px-Logo_Universitas_Brawijaya.svg.png',
  UNS: 'https://upload.wikimedia.org/wikipedia/id/thumb/a/a2/Logo_Universitas_Sebelas_Maret.png/480px-Logo_Universitas_Sebelas_Maret.png',
  UNHAS: 'https://upload.wikimedia.org/wikipedia/id/thumb/1/1c/Logo_Unhas.png/480px-Logo_Unhas.png',
  USU: 'https://upload.wikimedia.org/wikipedia/id/thumb/7/7b/Logo_USU.png/480px-Logo_USU.png',
  UNY: 'https://upload.wikimedia.org/wikipedia/id/thumb/9/91/Logo_Universitas_Negeri_Yogyakarta.png/480px-Logo_Universitas_Negeri_Yogyakarta.png',
  UPI: 'https://upload.wikimedia.org/wikipedia/id/thumb/0/09/Logo_Universitas_Pendidikan_Indonesia.svg/480px-Logo_Universitas_Pendidikan_Indonesia.svg.png',
  UNJ: 'https://upload.wikimedia.org/wikipedia/id/thumb/f/f6/Logo_Universitas_Negeri_Jakarta.png/480px-Logo_Universitas_Negeri_Jakarta.png',
  UNNES: 'https://upload.wikimedia.org/wikipedia/id/thumb/a/ab/Logo_UNNES.png/480px-Logo_UNNES.png',
  UNESA: 'https://upload.wikimedia.org/wikipedia/id/thumb/6/6b/Logo_Unesa.png/480px-Logo_Unesa.png',
  UNAND: 'https://upload.wikimedia.org/wikipedia/id/thumb/d/db/Logo_Universitas_Andalas.png/480px-Logo_Universitas_Andalas.png',
  UNSRI: 'https://upload.wikimedia.org/wikipedia/id/thumb/b/b5/Logo_Unsri.png/480px-Logo_Unsri.png',
  UNRAM: 'https://upload.wikimedia.org/wikipedia/id/thumb/6/67/Logo_Universitas_Mataram.png/480px-Logo_Universitas_Mataram.png',
  UNEJ: 'https://upload.wikimedia.org/wikipedia/id/thumb/2/23/Logo_Unej.png/480px-Logo_Unej.png',
  UNSOED: 'https://upload.wikimedia.org/wikipedia/id/thumb/3/30/Logo_Universitas_Jenderal_Soedirman.png/480px-Logo_Universitas_Jenderal_Soedirman.png',
  UPNVJ: 'https://upload.wikimedia.org/wikipedia/id/thumb/7/7c/Logo_UPN_Veteran_Jakarta.png/480px-Logo_UPN_Veteran_Jakarta.png',
  UPNYK: 'https://upload.wikimedia.org/wikipedia/id/thumb/0/07/Logo_UPN_Veteran_Yogyakarta.png/480px-Logo_UPN_Veteran_Yogyakarta.png',
  UPNJATIM: 'https://upload.wikimedia.org/wikipedia/id/thumb/7/77/Logo_UPN_Veteran_Jawa_Timur.png/480px-Logo_UPN_Veteran_Jawa_Timur.png',
  USK: 'https://upload.wikimedia.org/wikipedia/id/thumb/e/e9/Logo_Universitas_Syiah_Kuala.png/480px-Logo_Universitas_Syiah_Kuala.png',
  UNTIRTA: 'https://upload.wikimedia.org/wikipedia/id/thumb/f/f2/Logo_Untirta.png/480px-Logo_Untirta.png',
  UNRI: 'https://upload.wikimedia.org/wikipedia/id/thumb/2/2f/Logo_Universitas_Riau.png/480px-Logo_Universitas_Riau.png',
  UNMUL: 'https://upload.wikimedia.org/wikipedia/id/thumb/4/4b/Logo_Universitas_Mulawarman.png/480px-Logo_Universitas_Mulawarman.png',
  UNUD: 'https://upload.wikimedia.org/wikipedia/id/thumb/b/bd/Logo_Universitas_Udayana.png/480px-Logo_Universitas_Udayana.png',
};

/**
 * Mendapatkan URL Logo PTN berdasarkan singkatan, nama kampus, ID, atau slug.
 */
export function getLogoPtn(ptn) {
  if (!ptn) return null;
  if (typeof ptn === 'string') {
    if (ptn.startsWith('http://') || ptn.startsWith('https://')) return ptn;
    ptn = { nama: ptn };
  }

  // 1. Direct logo_url or uni_logo
  if (ptn.logo_url && typeof ptn.logo_url === 'string') return ptn.logo_url;
  if (ptn.uni_logo && typeof ptn.uni_logo === 'string') return ptn.uni_logo;
  if (ptn.logo && typeof ptn.logo === 'string') return ptn.logo;

  const singkatan = String(ptn.singkatan || ptn.short_name || ptn.uni_short || '').toUpperCase().trim();
  const nama = String(ptn.nama || ptn.name || ptn.namaPtn || ptn.uni_name || '').toUpperCase().trim();
  const slug = String(ptn.slug || ptn.uni_slug || '').trim().toLowerCase();

  // 2. High-res SVG / PNG Wikipedia map
  if (singkatan && LOGO_PTN_MAP[singkatan]) {
    return LOGO_PTN_MAP[singkatan];
  }

  // 3. Pencocokan nama fleksibel di map
  for (const [key, url] of Object.entries(LOGO_PTN_MAP)) {
    if (nama.includes(key)) return url;
  }

  // 4. AmbisPTN Cloudflare R2 bucket logo jika slug tersedia
  if (slug) {
    return `https://pub-2e9177a2ddc44249bf5d7ec937bdae0a.r2.dev/universities/logos/${slug}.png`;
  }

  return null;
}

/**
 * Mengembalikan inisial kampus (2-3 huruf) dan warna latar untuk monogram jika logo gambar tidak tersedia.
 */
export function getMonogramPtn(ptn) {
  if (!ptn) return { inisial: 'PTN', bg: '#0d9488', color: '#ffffff' };
  const singkatan = String(ptn.singkatan || '').trim();
  if (singkatan && singkatan.length <= 8) {
    return { inisial: singkatan, bg: '#0d9488', color: '#ffffff' };
  }
  const nama = String(ptn.nama || ptn.namaPtn || 'Perguruan Tinggi');
  const kata = nama.replace(/Universitas|Institut|Politeknik|Negeri|UIN|IAIN/gi, '').trim().split(/\s+/);
  const inisial = kata.length >= 2 ? (kata[0][0] + kata[1][0]).toUpperCase() : nama.slice(0, 3).toUpperCase();
  return { inisial: inisial || 'PTN', bg: '#0f766e', color: '#ffffff' };
}
