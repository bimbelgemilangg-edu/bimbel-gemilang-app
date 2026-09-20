import React from 'react';
import {
  AlignJustify,
  Bookmark,
  BookOpen,
  Check,
  List,
  Maximize2,
  Minimize2,
  Moon,
  Palette,
  Sun,
  Type,
} from 'lucide-react';

const THEME_LABEL = {
  paper: 'Kertas',
  sepia: 'Sepia',
  night: 'Malam',
};

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
  const nextTheme = theme === 'paper' ? 'sepia' : theme === 'sepia' ? 'night' : 'paper';
  const decrease = () => onFontScale?.(Math.max(0.9, +(fontScale - 0.05).toFixed(2)));
  const increase = () => onFontScale?.(Math.min(1.18, +(fontScale + 0.05).toFixed(2)));

  return (
    <div className="reader-toolbar" aria-label="Pengaturan membaca">
      <div className="reader-toolbar__left">
        <button type="button" className="reader-tool reader-tool--contents" onClick={onContents} title="Daftar isi">
          <List size={16} />
          <span>Isi</span>
        </button>
        <span className="reader-toolbar__label">{pageLabel}</span>
        <span className="reader-progress" title={`${Math.round(progress)}% terbaca`} aria-label={`${Math.round(progress)} persen terbaca`}>
          <span style={{ width: `${Math.max(0, Math.min(100, progress))}%` }} />
        </span>
      </div>
      <div className="reader-toolbar__actions">
        {showLayout && (
          <button
            type="button"
            className="reader-tool"
            onClick={() => onLayoutMode?.(layoutMode === 'page' ? 'scroll' : 'page')}
            title={layoutMode === 'page' ? 'Mode gulir' : 'Mode halaman'}
            aria-label={layoutMode === 'page' ? 'Beralih ke mode gulir' : 'Beralih ke mode halaman'}
          >
            {layoutMode === 'page' ? <AlignJustify size={16} /> : <BookOpen size={16} />}
            <span>{layoutMode === 'page' ? 'Gulir' : 'Halaman'}</span>
          </button>
        )}
        <button
          type="button"
          className={`reader-tool ${bookmarked ? 'is-active' : ''}`}
          onClick={onBookmark}
          title={bookmarked ? 'Hapus penanda' : 'Tandai halaman'}
          aria-label={bookmarked ? 'Hapus penanda halaman' : 'Tandai halaman'}
        >
          {bookmarked ? <Check size={16} /> : <Bookmark size={16} />}
          <span>{bookmarked ? 'Ditandai' : 'Tandai'}</span>
        </button>
        <button
          type="button"
          className="reader-tool"
          onClick={() => onTheme?.(nextTheme)}
          title={`Tema: ${THEME_LABEL[theme]}. Klik untuk ganti.`}
          aria-label={`Ganti tema baca, sekarang ${THEME_LABEL[theme]}`}
        >
          {theme === 'night' ? <Moon size={16} /> : theme === 'sepia' ? <Palette size={16} /> : <Sun size={16} />}
          <span>{THEME_LABEL[theme]}</span>
        </button>
        <div className="reader-tool reader-tool--font" aria-label="Ukuran teks">
          <Type size={15} />
          <button type="button" onClick={decrease} aria-label="Perkecil teks">A−</button>
          <span>{Math.round(fontScale * 100)}%</span>
          <button type="button" onClick={increase} aria-label="Perbesar teks">A+</button>
        </div>
        <button
          type="button"
          className="reader-tool"
          onClick={onFocusMode}
          title={focusMode ? 'Keluar mode fokus' : 'Masuk mode fokus'}
          aria-label={focusMode ? 'Keluar mode fokus' : 'Masuk mode fokus'}
        >
          {focusMode ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
          <span>{focusMode ? 'Keluar' : 'Fokus'}</span>
        </button>
      </div>
    </div>
  );
}
