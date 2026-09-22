import React, { useEffect, useRef, useState } from 'react';
import { Bookmark, Check, List, Type } from 'lucide-react';

/* ============================================================
   ReaderControls v2 — Bookfeel
   Krom reader disederhanakan: [Isi] [label] ... [Penanda] [Aa].
   Tema, ukuran teks, mode baca, dan fokus masuk satu lembar bawah
   (bottom sheet) lewat tombol "Aa". Toolbar auto-hide saat siswa
   membaca (scroll turun) dan muncul saat scroll naik / sentuh.
   ============================================================ */

const THEME_LABEL = { paper: 'Kertas', sepia: 'Sepia', night: 'Malam' };

export default function ReaderControls({
  theme = 'paper',
  onTheme,
  fontScale = 1,
  onFontScale,
  focusMode = false,
  onFocusMode,
  layoutMode = 'scroll',
  onLayoutMode,
  showLayout = false,
  bookmarked = false,
  onBookmark,
  onContents,
  progress = 0,
  pageLabel = '',
}) {
  const [hidden, setHidden] = useState(false);
  const [sheet, setSheet] = useState(false);
  const lastY = useRef(0);
  const timer = useRef(null);

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY || 0;
      if (y < 140) { setHidden(false); lastY.current = y; return; }
      if (y > lastY.current + 24) setHidden(true);
      else if (y < lastY.current - 12) setHidden(false);
      lastY.current = y;
      clearTimeout(timer.current);
      timer.current = setTimeout(() => setHidden(false), 4000);
    };
    const onDown = () => setHidden(false);
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('touchstart', onDown, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('touchstart', onDown);
      clearTimeout(timer.current);
    };
  }, []);

  const decrease = () => onFontScale?.(Math.max(0.9, +(fontScale - 0.05).toFixed(2)));
  const increase = () => onFontScale?.(Math.min(1.3, +(fontScale + 0.05).toFixed(2)));

  return (
    <>
      <div className={`reader-toolbar ${hidden ? 'is-hidden' : ''}`} aria-label="Pengaturan membaca">
        <div className="reader-toolbar__left">
          <button type="button" className="reader-tool reader-tool--contents" onClick={onContents} title="Daftar isi">
            <List size={16} />
            <span>Isi</span>
          </button>
          <span className="reader-toolbar__label">{pageLabel}</span>
        </div>
        <div className="reader-toolbar__actions">
          <button
            type="button"
            className={`reader-tool ${bookmarked ? 'is-active' : ''}`}
            onClick={onBookmark}
            title={bookmarked ? 'Hapus penanda' : 'Tandai halaman'}
            aria-label="Penanda halaman"
          >
            {bookmarked ? <Check size={16} /> : <Bookmark size={16} />}
          </button>
          <button
            type="button"
            className={`reader-tool ${sheet ? 'is-active' : ''}`}
            onClick={() => setSheet((s) => !s)}
            title="Pengaturan baca: tema, ukuran teks, mode"
            aria-label="Pengaturan baca"
          >
            <Type size={16} />
            <span>Aa</span>
          </button>
        </div>
      </div>

      <span className="reader-progress" title={`${Math.round(progress)}% terbaca`} aria-label={`${Math.round(progress)} persen terbaca`}>
        <span style={{ width: `${Math.max(0, Math.min(100, progress))}%` }} />
      </span>

      <div className={`gb-scrim ${sheet ? 'is-open' : ''}`} onClick={() => setSheet(false)} />
      <div className={`gb-sheet ${sheet ? 'is-open' : ''}`} role="dialog" aria-label="Pengaturan baca">
        <h4>Pengaturan Membaca</h4>
        <div className="row">
          <span>Tema</span>
          {['paper', 'sepia', 'night'].map((t) => (
            <button key={t} type="button" className={theme === t ? 'is-active' : ''} onClick={() => onTheme?.(t)}>
              {THEME_LABEL[t]}
            </button>
          ))}
        </div>
        <div className="row">
          <span>Teks</span>
          <button type="button" onClick={decrease} aria-label="Perkecil teks">A−</button>
          <button type="button" onClick={increase} aria-label="Perbesar teks">A+</button>
          <span style={{ width: 'auto', color: 'var(--reader-muted)' }}>{Math.round(fontScale * 100)}%</span>
        </div>
        {showLayout && (
          <div className="row">
            <span>Mode</span>
            <button type="button" className={layoutMode === 'scroll' ? 'is-active' : ''} onClick={() => onLayoutMode?.('scroll')}>
              Gulir
            </button>
            <button type="button" className={layoutMode === 'page' ? 'is-active' : ''} onClick={() => onLayoutMode?.('page')}>
              Halaman
            </button>
          </div>
        )}
        <div className="row">
          <span>Fokus</span>
          <button type="button" className={focusMode ? 'is-active' : ''} onClick={onFocusMode}>
            {focusMode ? 'Matikan fokus' : 'Mode fokus'}
          </button>
        </div>
      </div>
    </>
  );
}
