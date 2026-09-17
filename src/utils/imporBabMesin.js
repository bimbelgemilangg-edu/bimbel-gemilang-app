// src/utils/imporBabMesin.js
// Mesin penyimpan bab: sanitize -> pindahkan SVG raksasa ke Firebase
// Storage (ganti <img src=url>) -> cek batas 1 MB Firestore -> setDoc.
// Dipakai oleh ImporModul.jsx supaya error
// "The value of property html is longer than 1048487 bytes" tidak muncul lagi.
import { getStorage, ref as sRef, uploadString, getDownloadURL } from 'firebase/storage';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';

const SVG_BESAR = 40000;      // svg inline > 40KB dipindah ke Storage
const BYTE_MAX = 1000000;     // batas aman dokumen Firestore (~1 MB)

export function hitungStatistik(html) {
  const d = new DOMParser().parseFromString(String(html || ''), 'text/html');
  return {
    soal: d.querySelectorAll('.soal').length,
    svg: d.querySelectorAll('svg').length,
    kunci: [...d.querySelectorAll('details')].filter((x) => /Jawaban:|Kunci/i.test(x.textContent)).length,
    img: d.querySelectorAll('img').length,
  };
}

export function sanitizeHtml(html) {
  let out = String(html);
  out = out.replace(/<script[\s\S]*?<\/script>/gi, '');
  out = out.replace(/<style[\s\S]*?<\/style>/gi, '');
  out = out.replace(/<iframe[\s\S]*?<\/iframe>/gi, '');
  out = out.replace(/\son\w+="[^"]*"/gi, '');
  out = out.replace(/\son\w+='[^']*'/gi, '');
  const imgDibuang = (out.match(/<img/gi) || []).length;
  out = out.replace(/<img[^>]*>/gi, '');
  return { html: out, imgDibuang };
}

export async function pecahSvgBesar(html, slug) {
  const storage = getStorage();
  const re = /<svg[\s\S]*?<\/svg>/gi;
  const daftar = [];
  let m; let i = 0;
  while ((m = re.exec(html)) !== null) {
    if (m[0].length > SVG_BESAR) daftar.push({ idx: i, svg: m[0] });
    i++;
  }
  let out = html;
  for (const d of daftar) {
    const path = `modul-figurs/${slug}-${d.idx}.svg`;
    const r = sRef(storage, path);
    await uploadString(r, d.svg, 'raw', { contentType: 'image/svg+xml' });
    const url = await getDownloadURL(r);
    out = out.split(d.svg).join(
      `<img src="${url}" alt="Figur ${d.idx + 1}" style="max-width:100%;height:auto;display:block;margin:8px auto"/>`
    );
  }
  return { html: out, dipindah: daftar.length };
}

export async function simpanBab({ bukuId, babId, judul, urutan, html, slug }) {
  try {
    const san = sanitizeHtml(html);
    const pecah = await pecahSvgBesar(san.html, slug || ('bab-' + urutan));
    const final = pecah.html;
    const bytes = new TextEncoder().encode(final).length;
    if (bytes > BYTE_MAX) {
      return { ok: false, error: `HTML masih ${bytes} byte setelah SVG besar dipindah. Pecah bab menjadi dua file.` };
    }
    const ref = babId
      ? doc(db, 'buku_digital', bukuId, 'bab', babId)
      : doc(db, 'buku_digital', bukuId, 'bab');
    await setDoc(ref, {
      judul,
      urutan: Number(urutan) || 0,
      html: final,
      tipe: 'html',
      svgDipindah: pecah.dipindah,
      imgDibuang: san.imgDibuang,
      updatedAt: serverTimestamp(),
    }, { merge: true });
    return { ok: true, id: ref.id, bytes, dipindah: pecah.dipindah, imgDibuang: san.imgDibuang };
  } catch (e) {
    return { ok: false, error: e.message };
  }
}

export default { hitungStatistik, sanitizeHtml, pecahSvgBesar, simpanBab };