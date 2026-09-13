// src/components/admin/EditorBab.jsx
// TULANG PUNGGUNG PRODUKSI: editor bab interaktif split-screen.
// Kiri = pratinjau PDF + pemotong figur. Kanan = editor seksi/blok/soal.
// Nol dependensi AI. Draft autosave ke localStorage. Simpan lewat onSimpan.
import { useEffect, useState } from 'react';
import PratinjauPdf from './PratinjauPdf';
import { regionCanvasKeFile, regionCanvasKeDataUrl } from '../../utils/potongGambar';
import { uploadElearningFile } from '../../services/uploadService';
import './editorBab.css';

const clone = (o) => JSON.parse(JSON.stringify(o));
const gabung = (arr) => (arr || []).join(' | ');
const pecah = (s) => String(s).split('|').map((x) => x.trim());

function blokBaru(tipe) {
  if (tipe === 'list') return { tipe, items: [''] };
  if (tipe === 'tabel') return { tipe, caption: '', kepala: ['Kolom 1', 'Kolom 2'], baris: [['', ''], ['', '']] };
  if (tipe === 'gambar') return { tipe, src: '', alt: '', caption: '' };
  return { tipe, teks: '' }; // p, math, contoh, tips
}

function soalBaru(tipe) {
  if (tipe === 'pg') return { tipe, level: 'sedang', soal: '', pilihan: ['', '', '', ''], benar: 0, pembahasan: '' };
  if (tipe === 'multi') return { tipe, level: 'sedang', soal: '', pilihan: ['', '', '', ''], benar: [], pembahasan: '' };
  return { tipe: 'bs', level: 'sedang', soal: '', pernyataan: ['', ''], benar: [], pembahasan: '' };
}

function sanitasiAwal(b) {
  const d = b ? clone(b) : { judul: '', sections: [], ujiPemahaman: [] };
  if (!Array.isArray(d.sections)) d.sections = [];
  if (!Array.isArray(d.ujiPemahaman)) d.ujiPemahaman = [];
  d.sections.forEach((s) => {
    if (!Array.isArray(s.blocks)) s.blocks = [];
    s.blocks.forEach((bl) => {
      if (bl && bl.visual && bl._vteks == null) bl._vteks = JSON.stringify(bl.visual, null, 2);
    });
  });
  return d;
}

function bersihUntukSimpan(d) {
  const nd = clone(d);
  (nd.sections || []).forEach((s) => (s.blocks || []).forEach((b) => delete b._vteks));
  return nd;
}

export default function EditorBab({
  buku,
  bab,
  indexBab,
  sumberPdf = '',
  halMulai = 1,
  halSampai = null,
  onSimpan,
  onTutup,
}) {
  const kunciDraft = `ebDraft:${(buku && buku.id) || 'tanpaBuku'}:${indexBab ?? 'baru'}`;
  const [data, setData] = useState(() => sanitasiAwal(bab));
  const [selSeksi, setSelSeksi] = useState(0);
  const [selBlok, setSelBlok] = useState(null);
  const [selSoal, setSelSoal] = useState(null);
  const [tipeBlokBaru, setTipeBlokBaru] = useState({});
  const [tipeSoalBaru, setTipeSoalBaru] = useState('pg');
  const [modePotong, setModePotong] = useState(false);
  const [regionSiap, setRegionSiap] = useState(null);
  const [galeri, setGaleri] = useState([]);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState('');
  const [showJson, setShowJson] = useState(false);
  const [draftTersedia, setDraftTersedia] = useState(null);

  // ---- autosave draft (debounce 800ms) ----
  useEffect(() => {
    const t = setTimeout(() => {
      try { localStorage.setItem(kunciDraft, JSON.stringify({ ts: Date.now(), data })); } catch { /* abaikan */ }
    }, 800);
    return () => clearTimeout(t);
  }, [data, kunciDraft]);

  // ---- tawarkan pulihkan draft lama ----
  useEffect(() => {
    try {
      const raw = localStorage.getItem(kunciDraft);
      if (raw) {
        const d = JSON.parse(raw);
        if (d && d.data && JSON.stringify(d.data) !== JSON.stringify(data)) setDraftTersedia(raw);
      }
    } catch { /* abaikan */ }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ================= SEKSI & BLOK =================
  const ubahSeksi = (iS, patch) => setData((d) => {
    const nd = clone(d);
    nd.sections[iS] = { ...nd.sections[iS], ...patch };
    return nd;
  });
  const geserSeksi = (iS, dir) => setData((d) => {
    const nd = clone(d);
    const j = iS + dir;
    if (j < 0 || j >= nd.sections.length) return d;
    [nd.sections[iS], nd.sections[j]] = [nd.sections[j], nd.sections[iS]];
    return nd;
  });
  const hapusSeksi = (iS) => {
    if (!window.confirm('Hapus seksi ini beserta semua bloknya?')) return;
    setData((d) => { const nd = clone(d); nd.sections.splice(iS, 1); return nd; });
  };
  const tambahSeksi = () => setData((d) => {
    const nd = clone(d);
    nd.sections.push({ judul: '', blocks: [] });
    setSelSeksi(nd.sections.length - 1);
    return nd;
  });
  const tambahBlok = (iS) => setData((d) => {
    const nd = clone(d);
    const tipe = tipeBlokBaru[iS] || 'p';
    nd.sections[iS].blocks.push(blokBaru(tipe));
    setSelSeksi(iS);
    setSelBlok(nd.sections[iS].blocks.length - 1);
    return nd;
  });
  const ubahBlok = (iS, iB, patch) => setData((d) => {
    const nd = clone(d);
    nd.sections[iS].blocks[iB] = { ...nd.sections[iS].blocks[iB], ...patch };
    return nd;
  });
  const geserBlok = (iS, iB, dir) => setData((d) => {
    const nd = clone(d);
    const arr = nd.sections[iS].blocks;
    const j = iB + dir;
    if (j < 0 || j >= arr.length) return d;
    [arr[iB], arr[j]] = [arr[j], arr[iB]];
    return nd;
  });
  const dupBlok = (iS, iB) => setData((d) => {
    const nd = clone(d);
    nd.sections[iS].blocks.splice(iB + 1, 0, clone(nd.sections[iS].blocks[iB]));
    return nd;
  });
  const hapusBlok = (iS, iB) => setData((d) => {
    const nd = clone(d);
    nd.sections[iS].blocks.splice(iB, 1);
    return nd;
  });

  // ================= SOAL =================
  const tambahSoal = () => setData((d) => {
    const nd = clone(d);
    nd.ujiPemahaman.push(soalBaru(tipeSoalBaru));
    setSelSoal(nd.ujiPemahaman.length - 1);
    return nd;
  });
  const ubahSoal = (iQ, patch) => setData((d) => {
    const nd = clone(d);
    nd.ujiPemahaman[iQ] = { ...nd.ujiPemahaman[iQ], ...patch };
    return nd;
  });
  const geserSoal = (iQ, dir) => setData((d) => {
    const nd = clone(d);
    const j = iQ + dir;
    if (j < 0 || j >= nd.ujiPemahaman.length) return d;
    [nd.ujiPemahaman[iQ], nd.ujiPemahaman[j]] = [nd.ujiPemahaman[j], nd.ujiPemahaman[iQ]];
    return nd;
  });
  const hapusSoal = (iQ) => {
    if (!window.confirm('Hapus soal ini?')) return;
    setData((d) => { const nd = clone(d); nd.ujiPemahaman.splice(iQ, 1); return nd; });
  };

  // ================= GAMBAR (potong / galeri) =================
  function onRegionSiap({ rect, halaman, canvas }) {
    setRegionSiap({ rect, halaman, canvas, preview: regionCanvasKeDataUrl(canvas, rect) });
  }
  async function ambilUrlRegion() {
    const file = await regionCanvasKeFile(
      regionSiap.canvas,
      regionSiap.rect,
      `fig_hal${regionSiap.halaman}_${Date.now()}.jpg`
    );
    const up = await uploadElearningFile(file, 'materi', { kompres: false, contentType: 'image/jpeg' });
    if (!up.success) throw new Error(up.error || 'Upload gambar gagal.');
    return up.downloadURL;
  }
  async function pasangKeBlokAktif() {
    setBusy(true);
    try {
      const url = await ambilUrlRegion();
      setData((d) => {
        const nd = clone(d);
        const sek = nd.sections[selSeksi];
        if (!sek) return d;
        if (!Array.isArray(sek.blocks)) sek.blocks = [];
        const aktif = selBlok != null ? sek.blocks[selBlok] : null;
        if (aktif && aktif.tipe === 'gambar') {
          aktif.src = url;
        } else {
          const pos = selBlok != null ? selBlok + 1 : sek.blocks.length;
          sek.blocks.splice(pos, 0, {
            tipe: 'gambar',
            src: url,
            alt: '',
            caption: `Gambar dari halaman ${regionSiap.halaman}`,
          });
        }
        return nd;
      });
      setGaleri((g) => [...g, { url, alt: `hal ${regionSiap.halaman}` }]);
      setRegionSiap(null);
    } catch (e) {
      setStatus('Gagal pasang gambar: ' + e.message);
    } finally {
      setBusy(false);
    }
  }
  async function pasangKeSoalAktif() {
    if (selSoal == null) { setStatus('Pilih satu soal dulu di bawah sebelum memasang gambar.'); return; }
    setBusy(true);
    try {
      const url = await ambilUrlRegion();
      setData((d) => {
        const nd = clone(d);
        nd.ujiPemahaman[selSoal].gambar = { src: url, alt: '', caption: `Gambar soal dari halaman ${regionSiap.halaman}` };
        return nd;
      });
      setGaleri((g) => [...g, { url, alt: `hal ${regionSiap.halaman}` }]);
      setRegionSiap(null);
    } catch (e) {
      setStatus('Gagal pasang gambar soal: ' + e.message);
    } finally {
      setBusy(false);
    }
  }
  async function simpanKeGaleri() {
    setBusy(true);
    try {
      const url = await ambilUrlRegion();
      setGaleri((g) => [...g, { url, alt: `hal ${regionSiap.halaman}` }]);
      setRegionSiap(null);
    } catch (e) {
      setStatus('Gagal simpan ke galeri: ' + e.message);
    } finally {
      setBusy(false);
    }
  }
  function pasangUrlKeBlok(url) {
    setData((d) => {
      const nd = clone(d);
      const sek = nd.sections[selSeksi];
      if (!sek) return d;
      const aktif = selBlok != null ? sek.blocks[selBlok] : null;
      if (aktif && aktif.tipe === 'gambar') aktif.src = url;
      else sek.blocks.push({ tipe: 'gambar', src: url, alt: '', caption: '' });
      return nd;
    });
  }
  function pasangUrlKeSoal(url) {
    if (selSoal == null) { setStatus('Pilih satu soal dulu sebelum memasang gambar galeri.'); return; }
    setData((d) => {
      const nd = clone(d);
      nd.ujiPemahaman[selSoal].gambar = { src: url, alt: '', caption: '' };
      return nd;
    });
  }

  // ================= SIMPAN =================
  async function simpan() {
    setBusy(true);
    setStatus('Menyimpan...');
    try {
      const bersih = bersihUntukSimpan(data);
      await onSimpan(bersih);
      try { localStorage.removeItem(kunciDraft); } catch { /* abaikan */ }
      setDraftTersedia(null);
      setStatus('Tersimpan ✅');
    } catch (e) {
      setStatus('Gagal simpan: ' + e.message);
    } finally {
      setBusy(false);
    }
  }

  // ================= EDITOR PER TIPE BLOK =================
  function renderBlok(b, iS, iB) {
    if (b.tipe === 'list') {
      return (
        <textarea
          className="eb-textarea"
          rows={4}
          placeholder="Satu poin per baris"
          value={(b.items || []).join('\n')}
          onChange={(e) => ubahBlok(iS, iB, { items: e.target.value.split('\n') })}
        />
      );
    }
    if (b.tipe === 'tabel') {
      return (
        <div className="eb-row">
          <label className="eb-label">Kepala (pisahkan dengan |)</label>
          <input
            className="eb-input"
            value={gabung(b.kepala)}
            onChange={(e) => ubahBlok(iS, iB, { kepala: pecah(e.target.value) })}
          />
          <label className="eb-label">Baris (satu baris = satu baris tabel, kolom pakai |)</label>
          <textarea
            className="eb-textarea"
            rows={4}
            value={(b.baris || []).map(gabung).join('\n')}
            onChange={(e) => ubahBlok(iS, iB, { baris: e.target.value.split('\n').map(pecah) })}
          />
          <input
            className="eb-input"
            placeholder="Caption tabel"
            value={b.caption || ''}
            onChange={(e) => ubahBlok(iS, iB, { caption: e.target.value })}
          />
        </div>
      );
    }
    if (b.tipe === 'gambar') {
      return (
        <div className="eb-row">
          <input
            className="eb-input"
            placeholder="URL gambar (atau pakai ✂️ Mode Potong / galeri)"
            value={b.src || ''}
            onChange={(e) => ubahBlok(iS, iB, { src: e.target.value })}
          />
          {b.src && <img className="eb-thumb" src={b.src} alt={b.alt || ''} />}
          <input
            className="eb-input"
            placeholder="Alt text"
            value={b.alt || ''}
            onChange={(e) => ubahBlok(iS, iB, { alt: e.target.value })}
          />
          <input
            className="eb-input"
            placeholder="Caption, mis. Gambar 1. Kubus dan unsurnya."
            value={b.caption || ''}
            onChange={(e) => ubahBlok(iS, iB, { caption: e.target.value })}
          />
        </div>
      );
    }
    // p, math, contoh, tips + editor visual opsional
    let visualErr = '';
    if (b._vteks != null) {
      try { JSON.parse(b._vteks); } catch { visualErr = 'JSON visual belum valid'; }
    }
    return (
      <div className="eb-row">
        <textarea
          className="eb-textarea"
          rows={b.tipe === 'p' ? 4 : 2}
          placeholder={b.tipe === 'math' ? 'LaTeX display tanpa dolar, mis. V = \\frac{1}{3} \\pi r^2 t' : 'Teks...'}
          value={b.teks || ''}
          onChange={(e) => ubahBlok(iS, iB, { teks: e.target.value })}
        />
        <details className="eb-details">
          <summary className="eb-summary">Visual interaktif (opsional)</summary>
          <textarea
            className="eb-textarea eb-mono"
            rows={6}
            placeholder={'{"tipe":"bangun","keterangan":"...","titik":[...],"sisi":[...],"isi":[...]'}
            value={b._vteks || ''}
            onChange={(e) => {
              const teks = e.target.value;
              let visual = b.visual;
              try { visual = teks.trim() ? JSON.parse(teks) : undefined; } catch { /* tunggu valid */ }
              const patch = { _vteks: teks };
              if (visual !== undefined) patch.visual = visual;
              if (teks.trim() === '') patch.visual = undefined;
              ubahBlok(iS, iB, patch);
            }}
          />
          {visualErr && <div className="eb-err">{visualErr}</div>}
        </details>
      </div>
    );
  }

  // ================= EDITOR SOAL =================
  function renderSoal(q, iQ) {
    const aktif = selSoal === iQ;
    return (
      <div className={`eb-soal ${aktif ? 'eb-blok-aktif' : ''}`} key={iQ} onClick={() => setSelSoal(iQ)}>
        <div className="eb-blok-head">
          <span className="eb-badge">{q.tipe} · {q.level}</span>
          <div className="eb-mini">
            <button className="eb-btn" onClick={(e) => { e.stopPropagation(); geserSoal(iQ, -1); }}>↑</button>
            <button className="eb-btn" onClick={(e) => { e.stopPropagation(); geserSoal(iQ, 1); }}>↓</button>
            <button className="eb-btn eb-btn-danger" onClick={(e) => { e.stopPropagation(); hapusSoal(iQ); }}>🗑</button>
          </div>
        </div>
        <div className="eb-row">
          <div className="eb-row-inline">
            <select className="eb-input" value={q.tipe} onChange={(e) => ubahSoal(iQ, { tipe: e.target.value })}>
              <option value="pg">pg</option>
              <option value="multi">multi</option>
              <option value="bs">bs</option>
            </select>
            <select className="eb-input" value={q.level} onChange={(e) => ubahSoal(iQ, { level: e.target.value })}>
              <option value="mudah">mudah</option>
              <option value="sedang">sedang</option>
              <option value="sulit">sulit</option>
            </select>
          </div>
          <textarea
            className="eb-textarea"
            rows={3}
            placeholder="Teks soal (LaTeX inline pakai $...$)"
            value={q.soal || ''}
            onChange={(e) => ubahSoal(iQ, { soal: e.target.value })}
          />
          <div className="eb-row-inline">
            <input
              className="eb-input"
              placeholder="URL gambar soal (opsional)"
              value={(q.gambar && q.gambar.src) || ''}
              onChange={(e) => ubahSoal(iQ, { gambar: e.target.value ? { src: e.target.value, alt: '', caption: '' } : undefined })}
            />
            {q.gambar && q.gambar.src && <img className="eb-thumb" src={q.gambar.src} alt="" />}
          </div>
          {(q.tipe === 'pg' || q.tipe === 'multi') && (
            <>
              <label className="eb-label">Pilihan (satu per baris)</label>
              <textarea
                className="eb-textarea"
                rows={4}
                value={(q.pilihan || []).join('\n')}
                onChange={(e) => ubahSoal(iQ, { pilihan: e.target.value.split('\n') })}
              />
            </>
          )}
          {q.tipe === 'pg' && (
            <label className="eb-label">
              Indeks jawaban benar (0-based):{' '}
              <input
                type="number"
                min={0}
                value={q.benar ?? 0}
                onChange={(e) => ubahSoal(iQ, { benar: Number(e.target.value) })}
              />
            </label>
          )}
          {q.tipe === 'multi' && (
            <div className="eb-checks">
              {(q.pilihan || []).map((p, i) => (
                <label key={i}>
                  <input
                    type="checkbox"
                    checked={(q.benar || []).includes(i)}
                    onChange={(e) => {
                      const set = new Set(q.benar || []);
                      if (e.target.checked) set.add(i); else set.delete(i);
                      ubahSoal(iQ, { benar: [...set].sort((a, b) => a - b) });
                    }}
                  />
                  {` ${i}: ${p || '(kosong)'}`}
                </label>
              ))}
            </div>
          )}
          {q.tipe === 'bs' && (
            <>
              <label className="eb-label">Pernyataan (satu per baris)</label>
              <textarea
                className="eb-textarea"
                rows={4}
                value={(q.pernyataan || []).join('\n')}
                onChange={(e) => ubahSoal(iQ, { pernyataan: e.target.value.split('\n') })}
              />
              <div className="eb-checks">
                {(q.pernyataan || []).map((p, i) => (
                  <label key={i}>
                    <input
                      type="checkbox"
                      checked={!!(q.benar || [])[i]}
                      onChange={(e) => {
                        const arr = (q.benar || []).slice();
                        arr[i] = e.target.checked;
                        ubahSoal(iQ, { benar: arr });
                      }}
                    />
                    {` pernyataan ${i} BENAR`}
                  </label>
                ))}
              </div>
            </>
          )}
          <label className="eb-label">Pembahasan (wajib, LaTeX inline pakai $...$)</label>
          <textarea
            className="eb-textarea"
            rows={4}
            value={q.pembahasan || ''}
            onChange={(e) => ubahSoal(iQ, { pembahasan: e.target.value })}
          />
        </div>
      </div>
    );
  }

  // ================= RENDER UTAMA =================
  return (
    <div className="eb-root">
      <div className="eb-header">
        <div className="eb-header-kiri">
          <button className="eb-btn" onClick={onTutup}>← Tutup</button>
          <input
            className="eb-judul"
            placeholder="Judul bab..."
            value={data.judul || ''}
            onChange={(e) => setData((d) => ({ ...d, judul: e.target.value }))}
          />
        </div>
        <div className="eb-header-kanan">
          <button className="eb-btn" onClick={() => setModePotong((m) => !m)}>
            {modePotong ? '📖 Mode Baca' : '✂️ Mode Potong'}
          </button>
          <button className="eb-btn" onClick={() => setShowJson((s) => !s)}>
            {showJson ? 'Sembunyikan JSON' : 'Lihat JSON'}
          </button>
          <button className="eb-btn eb-btn-primary" disabled={busy} onClick={simpan}>
            💾 Simpan
          </button>
        </div>
      </div>

      {draftTersedia && (
        <div className="eb-banner">
          <span>⚠️ Ada draft tersimpan yang belum disimpan ke server.</span>
          <button
            className="eb-btn"
            onClick={() => {
              try { setData(sanitasiAwal(JSON.parse(draftTersedia).data)); } catch { /* abaikan */ }
              setDraftTersedia(null);
            }}
          >
            Pulihkan
          </button>
          <button
            className="eb-btn eb-btn-danger"
            onClick={() => { try { localStorage.removeItem(kunciDraft); } catch { /* abaikan */ } setDraftTersedia(null); }}
          >
            Buang
          </button>
        </div>
      )}
      {status && <div className="eb-status">{status}</div>}

      <div className="eb-body">
        <div className="eb-kiri">
          <PratinjauPdf
            sumber={sumberPdf}
            halamanMulai={halMulai}
            halamanSampai={halSampai}
            modePotong={modePotong}
            onRegionSiap={onRegionSiap}
          />
        </div>

        <div className="eb-kanan">
          {galeri.length > 0 && (
            <div className="eb-galeri">
              <span className="eb-label">Galeri bab:</span>
              {galeri.map((g, i) => (
                <span className="eb-galeri-item" key={i}>
                  <img src={g.url} alt={g.alt} title={g.alt} />
                  <button className="eb-btn" onClick={() => pasangUrlKeBlok(g.url)}>Blok</button>
                  <button className="eb-btn" onClick={() => pasangUrlKeSoal(g.url)}>Soal</button>
                </span>
              ))}
            </div>
          )}

          {data.sections.map((sek, iS) => (
            <div className="eb-seksi" key={iS}>
              <div className="eb-seksi-head">
                <input
                  className="eb-input"
                  placeholder={`Judul seksi ${iS + 1}, mis. A. Bangun Ruang Sisi Datar`}
                  value={sek.judul || ''}
                  onChange={(e) => ubahSeksi(iS, { judul: e.target.value })}
                />
                <div className="eb-mini">
                  <button className="eb-btn" onClick={() => geserSeksi(iS, -1)}>↑</button>
                  <button className="eb-btn" onClick={() => geserSeksi(iS, 1)}>↓</button>
                  <button className="eb-btn eb-btn-danger" onClick={() => hapusSeksi(iS)}>🗑</button>
                </div>
              </div>

              {(sek.blocks || []).map((b, iB) => (
                <div
                  className={`eb-blok ${selSeksi === iS && selBlok === iB ? 'eb-blok-aktif' : ''}`}
                  key={iB}
                  onClick={() => { setSelSeksi(iS); setSelBlok(iB); }}
                >
                  <div className="eb-blok-head">
                    <span className="eb-badge">{b.tipe}</span>
                    <div className="eb-mini">
                      <button className="eb-btn" onClick={(e) => { e.stopPropagation(); geserBlok(iS, iB, -1); }}>↑</button>
                      <button className="eb-btn" onClick={(e) => { e.stopPropagation(); geserBlok(iS, iB, 1); }}>↓</button>
                      <button className="eb-btn" onClick={(e) => { e.stopPropagation(); dupBlok(iS, iB); }}>⧉</button>
                      <button className="eb-btn eb-btn-danger" onClick={(e) => { e.stopPropagation(); hapusBlok(iS, iB); }}>🗑</button>
                    </div>
                  </div>
                  {renderBlok(b, iS, iB)}
                </div>
              ))}

              <div className="eb-tambah">
                <select
                  value={tipeBlokBaru[iS] || 'p'}
                  onChange={(e) => setTipeBlokBaru((s) => ({ ...s, [iS]: e.target.value }))}
                >
                  {['p', 'list', 'math', 'contoh', 'tips', 'tabel', 'gambar'].map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
                <button className="eb-btn" onClick={() => tambahBlok(iS)}>+ Blok</button>
              </div>
            </div>
          ))}
          <button className="eb-btn eb-btn-primary" onClick={tambahSeksi}>+ Seksi</button>

          <h3 className="eb-subjudul">Uji Pemahaman ({data.ujiPemahaman.length})</h3>
          {data.ujiPemahaman.map(renderSoal)}
          <div className="eb-tambah">
            <select value={tipeSoalBaru} onChange={(e) => setTipeSoalBaru(e.target.value)}>
              <option value="pg">pg</option>
              <option value="multi">multi</option>
              <option value="bs">bs</option>
            </select>
            <button className="eb-btn eb-btn-primary" onClick={tambahSoal}>+ Soal</button>
          </div>

          {showJson && (
            <pre className="eb-json">{JSON.stringify(bersihUntukSimpan(data), null, 2)}</pre>
          )}
        </div>
      </div>

      {regionSiap && (
        <div className="eb-popover">
          <img className="eb-popover-img" src={regionSiap.preview} alt="Pratinjau potongan" />
          <div className="eb-popover-teks">Potongan halaman {regionSiap.halaman} siap dipakai:</div>
          <div className="eb-popover-btns">
            <button className="eb-btn eb-btn-primary" disabled={busy} onClick={pasangKeBlokAktif}>Pasang ke Blok</button>
            <button className="eb-btn eb-btn-primary" disabled={busy} onClick={pasangKeSoalAktif}>Pasang ke Soal</button>
            <button className="eb-btn" disabled={busy} onClick={simpanKeGaleri}>Simpan ke Galeri</button>
            <button className="eb-btn" onClick={() => setRegionSiap(null)}>Batal</button>
          </div>
        </div>
      )}
    </div>
  );
}