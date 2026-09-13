// src/components/buku/RendererHtmlBab.jsx
// Render bab bertipe 'html' di dalam SHADOW DOM:
// - <style> modul tidak bocor ke styling aplikasi
// - script tidak dieksekusi
// - interaktivitas <details>/<summary> tetap jalan
import { useEffect, useRef } from 'react';
import { bersihkanHtml } from '../../utils/htmlBersih';

const BASE_STYLE = `
  :host{display:block}
  .gb-wrap{font:15px/1.65 -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;color:#1e293b;background:#f6f7fb;border-radius:12px;padding:6px;overflow:hidden}
  .gb-wrap img,.gb-wrap svg{max-width:100%;height:auto}
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