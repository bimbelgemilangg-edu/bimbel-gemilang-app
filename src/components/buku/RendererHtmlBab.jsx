// src/components/buku/RendererHtmlBab.jsx (v2)
// Render bab tipe 'html' di Shadow DOM + gaya dasar tabel/gambar
// supaya hasil scan tetap rapi walau CSS modul minim.
import { useEffect, useRef } from 'react';
import { bersihkanHtml } from '../../utils/htmlBersih';

const BASE_STYLE = `
  :host{display:block}
  .gb-wrap{font:15px/1.65 -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;color:#1e293b;background:#f6f7fb;border-radius:12px;padding:6px;overflow:hidden}
  .gb-wrap img,.gb-wrap svg{max-width:100%;height:auto}
  .gb-wrap table{width:100%;border-collapse:collapse;margin:8px 0;font-size:13px}
  .gb-wrap th{background:#4C6EF5;color:#fff;padding:6px 8px;text-align:left}
  .gb-wrap td{border:1px solid #e3e6ef;padding:5px 8px}
  .gb-wrap tr:nth-child(even) td{background:#f8fafc}
  .gb-wrap details{margin:6px 0}
  .gb-wrap img{max-width:100%;display:block;margin:10px auto;border-radius:10px}
`;

export default function RendererHtmlBab({ html }) {
  const hostRef = useRef(null);
  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    if (!host.shadowRoot) host.attachShadow({ mode: 'open' });
    host.shadowRoot.innerHTML = `<style>${BASE_STYLE}</style><div class="gb-wrap">${bersihkanHtml(html)}</div>`;
  }, [html]);
  return <div ref={hostRef} />;
}