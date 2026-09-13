// src/pages/admin/buku/ManajerBuku.jsx
import { useEffect, useRef, useState } from 'react';
import EditorBab from '../../components/admin/EditorBab';
import {
  ambilBuku,
  ambilDaftarBab,
  ambilDaftarBuku,
  simpanBabKeBuku,
  hapusBabKeBuku,
} from '../../../services/babService';
import '../../components/admin/editorBab.css';

const gayaBaris = { display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', border: '1px solid #e3e6ef', borderRadius: 10, background: '#fff', marginBottom: 8, flexWrap: 'wrap' };
const gayaNomor = { width: 28, height: 28, borderRadius: 8, background: '#eceaf6', color: '#5b4b8a', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, flexShrink: 0 };
const gayaModal = { position: 'fixed', inset: 0, zIndex: 960, background: 'rgba(15,17,35,.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 };
const gayaKartu = { background: '#fff', borderRadius: 12, padding: 16, width: 'min(720px, 96vw)', maxHeight: '86vh', overflow: 'auto' };

function ambilSumberPdf(bab, buku) {
  return (
    (bab && (bab.pdfURL || bab.pdfUrl || bab.sumberPdf || bab.urlPdf)) ||
    (buku && (buku.pdfURL || buku.pdfUrl || buku.sumberPdf)) ||
    ''
  );
}
function ambilRentangHal(bab) {
  const mulai = (bab && (bab.halamanMulai ?? bab.halMulai)) || 1;
  const sampai = (bab && (bab.halamanSampai ?? bab.halSampai)) || null;
  return { mulai, sampai };
}

export default function ManajerBuku({ bukuId: bukuIdProp, buku: bukuProp }) {
  const [daftarBuku, setDaftarBuku] = useState([]);
  const [bukuId, setBukuId] = useState(
    bukuIdProp ||
    (bukuProp && bukuProp.id) ||
    (() => {
      try { return new URLSearchParams(window.location.search).get('buku') || ''; } catch { return ''; }
    })()
  );
  const [buku, setBuku] = useState(bukuProp || null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');
  const [info, setInfo] = useState('');
  const [editBab, setEditBab] = useState(null);
  const [modalPaste, setModalPaste] = useState(false);
  const [teksPaste, setTeksPaste] = useState('');
  const [previewBab, setPreviewBab] = useState(null);
  const fileRef = useRef(null);

  async function muatDaftarBuku() {
    try {
      const list = await ambilDaftarBuku();
      setDaftarBuku(list);
    } catch (e) {
      setErr('Gagal memuat daftar buku: ' + e.message);
    }
  }
  async function muatBuku(id) {
    setLoading(true);
    setErr('');
    try {
      const b = await ambilBuku(id);
      setBuku(b);
    } catch (e) {
      setErr('Gagal memuat buku: ' + e.message);
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => { muatDaftarBuku(); }, []);
  useEffect(() => {
    if (bukuId && !bukuProp) muatBuku(bukuId);
  }, [bukuId]);

  function pilihBuku(id) {
    setBukuId(id);
    try { window.history.replaceState(null, '', window.location.pathname + '?buku=' + id); } catch { }
  }

  const daftarBab = ambilDaftarBab(buku);

  async function tambahDariJson(teks) {
    const obj = JSON.parse(teks);
    if (!obj || typeof obj !== 'object' || Array.isArray(obj) || !Array.isArray(obj.sections)) {
      throw new Error('JSON tidak valid: wajib object dengan array "sections".');
    }
    await simpanBabKeBuku(buku.id, -1, { ...obj, sumber: obj.sumber || 'admin' });
    await muatBuku(buku.id);
    setInfo('Bab ditambahkan dari JSON ✅');
  }

  async function onFileJson(e) {
    const f = e.target.files && e.target.files[0];
    e.target.value = '';
    if (!f) return;
    try {
      const teks = await f.text();
      setTeksPaste(teks);
      setModalPaste(true);
    } catch (er) {
      setErr('Gagal membaca file: ' + er.message);
    }
  }

  async function hapusBab(i, judul) {
    if (!window.confirm(`Hapus bab "${judul || i + 1}" dari buku ini?`)) return;
    try {
      await hapusBabKeBuku(buku.id, i);
      await muatBuku(buku.id);
      setInfo('Bab dihapus.');
    } catch (er) {
      setErr('Gagal menghapus bab: ' + er.message);
    }
  }

  if (!bukuId) {
    return (
      <div style={{ padding: 16 }}>
        <h2>📚 Pilih Buku</h2>
        {err && <div className="eb-err">{err}</div>}
        {daftarBuku.length === 0 && !err && <p>Memuat daftar buku…</p>}
        {daftarBuku.map((b) => (
          <div key={b.id} style={gayaBaris}>
            <span style={{ fontWeight: 600 }}>{b.judul || b.title || b.id}</span>
            <span className="eb-badge">{ambilDaftarBab(b).length} bab</span>
            <button className="eb-btn eb-btn-primary" onClick={() => pilihBuku(b.id)}>Buka</button>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div style={{ padding: 16 }}>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', marginBottom: 12 }}>
        <button className="eb-btn" onClick={() => { setBukuId(''); setBuku(null); }}>← Ganti Buku</button>
        <h2 style={{ margin: 0, flex: 1 }}>
          📘 {buku ? (buku.judul || buku.title) : 'Memuat…'} — Daftar Bab ({daftarBab.length})
        </h2>
        <input ref={fileRef} type="file" accept=".json,application/json" style={{ display: 'none' }} onChange={onFileJson} />
        <button className="eb-btn" onClick={() => fileRef.current && fileRef.current.click()}>Impor File JSON</button>
        <button className="eb-btn" onClick={() => { setTeksPaste(''); setModalPaste(true); }}>+ Bab (Paste JSON)</button>
        <button className="eb-btn eb-btn-primary" onClick={() => setEditBab({ index: -1, bab: null })}>+ Bab Kosong</button>
      </div>

      {err && <div className="eb-err" style={{ marginBottom: 8 }}>{err}</div>}
      {info && <div className="eb-status" style={{ marginBottom: 8 }}>{info}</div>}
      {loading && <p>Memuat buku…</p>}

      {daftarBab.map((bab, i) => {
        const { mulai, sampai } = ambilRentangHal(bab);
        const pdf = ambilSumberPdf(bab, buku);
        const terstruktur = Array.isArray(bab.sections) && bab.sections.length > 0;
        return (
          <div key={i} style={gayaBaris}>
            <span style={gayaNomor}>{i + 1}</span>
            <div style={{ flex: 1, minWidth: 200 }}>
              <div style={{ fontWeight: 600 }}>{bab.judul || `(Bab ${i + 1})`}</div>
              <div style={{ fontSize: 12, color: '#667' }}>
                {(bab.sections || []).length} seksi • {(bab.ujiPemahaman || []).length} soal • sumber: {bab.sumber || 'admin'}
                {bab.status ? ` • status: ${bab.status}` : ''}
              </div>
            </div>
            {terstruktur && <span className="eb-badge">TERSTRUKTUR</span>}
            {!terstruktur && pdf && (
              <span className="eb-badge">MODUL PDF · HAL {mulai}–{sampai || '∞'}</span>
            )}
            <div style={{ display: 'flex', gap: 6 }}>
              <button className="eb-btn" title="Pratinjau isi bab" onClick={() => setPreviewBab(bab)}>👁</button>
              {pdf && (
                <button className="eb-btn" title="Buka PDF modul" onClick={() => window.open(pdf, '_blank')}>📄</button>
              )}
              <button className="eb-btn eb-btn-primary" onClick={() => setEditBab({ index: i, bab })}>✏️ Edit Bab</button>
              <button className="eb-btn eb-btn-danger" onClick={() => hapusBab(i, bab.judul)}>🗑</button>
            </div>
          </div>
        );
      })}

      {editBab && buku && (
        <EditorBab
          buku={buku}
          bab={editBab.bab}
          indexBab={editBab.index >= 0 ? editBab.index : null}
          sumberPdf={ambilSumberPdf(editBab.bab, buku)}
          halMulai={ambilRentangHal(editBab.bab).mulai}
          halSampai={ambilRentangHal(editBab.bab).sampai}
          onSimpan={async (babBaru) => {
            const idx = editBab.index;
            await simpanBabKeBuku(buku.id, idx, babBaru);
            const segar = await ambilBuku(buku.id);
            setBuku(segar);
            if (idx < 0) setEditBab({ index: ambilDaftarBab(segar).length - 1, bab: babBaru });
            setInfo('Bab tersimpan ✅');
          }}
          onTutup={() => setEditBab(null)}
        />
      )}

      {modalPaste && (
        <div style={gayaModal} onClick={() => setModalPaste(false)}>
          <div style={gayaKartu} onClick={(e) => e.stopPropagation()}>
            <h3>+ Bab dari JSON</h3>
            <textarea
              className="eb-textarea eb-mono"
              rows={14}
              value={teksPaste}
              onChange={(e) => setTeksPaste(e.target.value)}
              placeholder='{"judul":"...","sections":[...],"ujiPemahaman":[...]}'
            />
            <div style={{ display: 'flex', gap: 8, marginTop: 10, justifyContent: 'flex-end' }}>
              <button className="eb-btn" onClick={() => setModalPaste(false)}>Batal</button>
              <button
                className="eb-btn eb-btn-primary"
                onClick={async () => {
                  try {
                    await tambahDariJson(teksPaste);
                    setModalPaste(false);
                  } catch (er) {
                    setErr('JSON ditolak: ' + er.message);
                  }
                }}
              >
                Tambahkan Bab
              </button>
            </div>
          </div>
        </div>
      )}

      {previewBab && (
        <div style={gayaModal} onClick={() => setPreviewBab(null)}>
          <div style={gayaKartu} onClick={(e) => e.stopPropagation()}>
            <h3>👁 {previewBab.judul || 'Pratinjau Bab'}</h3>
            <div style={{ fontSize: 13, color: '#556', marginBottom: 8 }}>
              {(previewBab.sections || []).length} seksi • {(previewBab.ujiPemahaman || []).length} soal
            </div>
            {(previewBab.sections || []).map((s, i) => (
              <div key={i} style={{ marginBottom: 6 }}>
                <strong>{s.judul || `Seksi ${i + 1}`}</strong>
                <span style={{ color: '#667', fontSize: 12 }}> — {(s.blocks || []).length} blok</span>
              </div>
            ))}
            <details style={{ marginTop: 8 }}>
              <summary className="eb-summary">Lihat JSON mentah</summary>
              <pre className="eb-json">{JSON.stringify(previewBab, null, 2)}</pre>
            </details>
            <div style={{ textAlign: 'right', marginTop: 10 }}>
              <button className="eb-btn" onClick={() => setPreviewBab(null)}>Tutup</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}