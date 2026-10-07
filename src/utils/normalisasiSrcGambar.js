// src/utils/normalisasiSrcGambar.js
// ============================================================
// Melepas "bungkus markdown" di alamat gambar buatan AI.
//
// KENAPA INI PENTING (kasus nyata 2026-10-07):
// Owner suka alur baru: Gemini Canvas merender HTML Master dengan CEPAT,
// lalu ditempel ke halaman impor. Masalahnya Gemini sering menulis alamat
// gambar gaya tautan markdown DI DALAM atribut src:
//     <img src="[https://contoh.org/g.png](https://contoh.org/g.png)" />
// Browser (dan validasi Image() di halaman impor) membaca alamat itu APA
// ADANYA -- diawali "[" bukan "https://" -- sehingga gambar gagal dimuat
// dan DICAP "rusak/palsu dari AI", padahal alamat aslinya benar dan
// gambarnya asli ada di internet. Akibatnya seluruh gambar "gak muncul"
// dan impor bahkan tertahan gerbang "gambar rusak".
//
// Fungsi ini melepas bungkus itu di PINTU MASUK parse (HTML Master,
// JSON, maupun dialect figure-container) sehingga sistem menerima gambar
// dari Gemini apa adanya. Murni: string masuk, string keluar, tanpa
// efek samping -- gampang di-test dan aman dipanggil berulang (idempoten).
// ============================================================

// Satu putaran pelepasan bungkus. Dipanggil maks 2x supaya bentuk
// bertumpuk (mis. "<[url](url)>") ikut terlepas tanpa loop liar.
function lepasSatuLapis(src) {
  // Bungkus sudut: <https://...>
  const sudut = /^<([^>]*)>$/.exec(src);
  if (sudut) return sudut[1].trim();

  // Tautan markdown: [label](alamat) atau [alamat](alamat).
  // Alamat yang dipakai = isi tanda kurung BUNDAR; kalau dalamnya kosong
  // ("[url]()"), pakai isi kurung SIKU.
  const markdown = /^\[([^\]]*)\]\(([^)]*)\)$/.exec(src);
  if (markdown) {
    const dalamBundar = markdown[2].trim();
    // Buang judul opsional gaya markdown: [label](alamat "judul.png")
    const tanpaJudul = dalamBundar.split(/\s+["']/)[0].trim();
    return (tanpaJudul || markdown[1].trim()).trim();
  }

  // Kurung siku saja: [https://...]
  const siku = /^\[([^\]]*)\]$/.exec(src);
  if (siku) return siku[1].trim();

  // Kurung bundar saja: (https://...)
  const bundar = /^\(([^)]*)\)$/.exec(src);
  if (bundar) return bundar[1].trim();

  return src;
}

/**
 * Normalkan alamat gambar mentah dari hasil AI: buang bungkus markdown
 * ([...](...)), kurung siku/bundar pembungkus, dan kurung sudut, lalu
 * rapikan spasi tepi. Alamat polos dan data: URI dikembalikan UTUH.
 *
 * @param {unknown} srcMentah nilai atribut src / field url apa adanya
 * @returns {string} alamat bersih (string kosong bila masukan kosong)
 */
export function lepasBungkusanSrcGambar(srcMentah) {
  if (typeof srcMentah !== 'string') return '';
  let src = srcMentah.trim();
  if (!src) return '';
  for (let putaran = 0; putaran < 2; putaran += 1) {
    const sebelum = src;
    src = lepasSatuLapis(src);
    if (src === sebelum) break;
  }
  return src;
}

export default lepasBungkusanSrcGambar;
