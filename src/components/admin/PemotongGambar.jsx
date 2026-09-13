// src/components/admin/PemotongGambar.jsx
// Overlay seret-kotak di atas canvas pratinjau PDF.
// Menghasilkan rect ternormalisasi {x, y, w, h} (0..1) lewat onPilih.
import { useRef, useState } from 'react';

export default function PemotongGambar({ aktif = true, kandidat = [], onPilih }) {
  const wrapRef = useRef(null);
  const [drag, setDrag] = useState(null);

  if (!aktif) return null;

  const norm = (e) => {
    const r = wrapRef.current.getBoundingClientRect();
    return {
      x: Math.min(1, Math.max(0, (e.clientX - r.left) / r.width)),
      y: Math.min(1, Math.max(0, (e.clientY - r.top) / r.height)),
    };
  };

  function turun(e) {
    e.preventDefault();
    const p = norm(e);
    setDrag({ x0: p.x, y0: p.y, x1: p.x, y1: p.y });
  }
  function gerak(e) {
    if (!drag) return;
    const p = norm(e);
    setDrag({ ...drag, x1: p.x, y1: p.y });
  }
  function lepas() {
    if (!drag) return;
    const rect = {
      x: Math.min(drag.x0, drag.x1),
      y: Math.min(drag.y0, drag.y1),
      w: Math.abs(drag.x1 - drag.x0),
      h: Math.abs(drag.y1 - drag.y0),
    };
    setDrag(null);
    if (rect.w > 0.02 && rect.h > 0.02 && onPilih) onPilih(rect);
  }

  const rectDrag = drag && {
    x: Math.min(drag.x0, drag.x1),
    y: Math.min(drag.y0, drag.y1),
    w: Math.abs(drag.x1 - drag.x0),
    h: Math.abs(drag.y1 - drag.y0),
  };

  return (
    <div
      ref={wrapRef}
      className="eb-potong-overlay"
      onPointerDown={turun}
      onPointerMove={gerak}
      onPointerUp={lepas}
      onPointerLeave={lepas}
    >
      {kandidat.map((k, i) => (
        <button
          key={i}
          className="eb-kandidat"
          style={{
            left: `${k.x * 100}%`,
            top: `${k.y * 100}%`,
            width: `${k.w * 100}%`,
            height: `${k.h * 100}%`,
          }}
          onPointerDown={(e) => e.stopPropagation()}
          onClick={() => onPilih && onPilih(k)}
          title="Klik untuk memakai kandidat figur ini"
        />
      ))}
      {rectDrag && (
        <div
          className="eb-dragbox"
          style={{
            left: `${rectDrag.x * 100}%`,
            top: `${rectDrag.y * 100}%`,
            width: `${rectDrag.w * 100}%`,
            height: `${rectDrag.h * 100}%`,
          }}
        />
      )}
      <div className="eb-potong-hint">Seret kotak di atas figur, atau klik kotak kandidat putus-putus.</div>
    </div>
  );
}