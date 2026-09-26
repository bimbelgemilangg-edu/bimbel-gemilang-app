// ---------- kunci (format buku Inggris: huruf, (n,n), T/F, N/O, I/E) ----------
const hurufIdx = (h) => 'ABCDE'.indexOf(String(h).trim().toUpperCase());
function kunciDariPembahasan(no, s) {
  const p = E.pembahasan[no - 1];
  const jw = (p.teks.match(/Jawaban:\s*([\s\S]*)$/) || [])[1] || '';
  if (s.tipe === 'pg') {
    const m = /^([A-E])\b/.exec(jw.trim());
    if (!m) throw new Error(`soal ${no}: pembahasan tanpa kunci huruf (${jw.slice(0, 40)})`);
    return hurufIdx(m[1]);
  }
  if (s.tipe === 'pgMulti') {
    const nums = jw.match(/\d+/g) || [];
    return nums.map((n) => Number(n) - 1);
  }
  if (!p.tabel) throw new Error(`soal ${no}: tabel pembahasan hilang`);
  return p.tabel.map((r) => (r.benar ? 0 : 1));
}
function kunciTabelRingkas(no, kolom, tipe) {
  const raw = String(E.kunci[no] || '').trim();
  if (!raw) return null;
  if (tipe === 'pgMulti') {
    const m = /\(([\d,\s]+)\)/.exec(raw);
    if (!m) return null;
    return m[1].split(',').map((x) => Number(x.trim()) - 1);
  }
  if (tipe === 'pg') return /^[A-E]$/i.test(raw) ? [hurufIdx(raw)] : null;
  const toks = raw.split(',').map((x) => x.trim().toUpperCase());
  return toks.map((t) => {
    if (t === 'TS') return kolom.findIndex((k) => /^(tidak|not)/i.test(k));
    return kolom.findIndex((k) => k.toUpperCase().startsWith(t[0]));
  });
}
