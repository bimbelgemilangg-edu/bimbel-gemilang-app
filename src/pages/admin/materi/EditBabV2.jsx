// src/pages/admin/materi/EditBabV2.jsx
// ============================================================
// FASE 4 -- EDITOR BAB MATERI v2 (route /admin/materi-v2/:materiId)
// Isi bab: metadata, FILE (PPT/PDF/video/gambar via Supabase),
// sections terstruktur, dan ujiPemahaman (soal live & latihan).
// ⚠️ Soal latihan live MENGIKUT ujiPemahaman bab ini -- PPT hanya
// tampilkan slide, tidak membawa soal sendiri (penjelasan owner).
// ============================================================
import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft, Plus, Save, Trash2, Upload, ChevronUp, ChevronDown,
  FileText, Presentation, Video, Image as IconGambar,
} from 'lucide-react';
import {
  muatMateriDanBab, simpanBab, hapusBab,
  pesanErrorFirestore, normalJudul,
} from '../../../services/materiV2Service';
import { uploadElearningFile } from '../../../services/uploadService';
import { listBankFiles, formatUkuran } from '../../../services/bankFileService';
import {
  T, kartuDasar, halamanDasar, tombolPill, lingkaranNomor,
} from '../../student/belajar/tema';

const BAB_KOSONG = {
  judul: '', ringkasan: '', estimasiMenit: 10, urutan: 1,
  tipe: 'teks', slideUrl: '', pdfUrl: '', videoUrl: '',
  sections: [], ujiPemahaman: [],
};

const SEC_TEMPLATE = {
  paragraf: { jenis: 'paragraf', teks: '' },
  judul: { jenis: 'judul', teks: '' },
  rumus: { jenis: 'rumus', latex: '' },
  callout: { jenis: 'callout', tipe: 'info', judul: '', teks: '' },
  contoh: { jenis: 'contoh', judul: '', teks: '', pembahasan: '' },
  langkah: { jenis: 'langkah', items: [] },
  gambar: { jenis: 'gambar', url: '', keterangan: '' },
};

const KUIS_KOSONG = { soal: '', tipe: 'pg', opsi: ['', '', '', ''], jawaban: 0, pembahasan: '' };

export default function EditBabV2() {
  const { materiId } = useParams();
  const navigate = useNavigate();
  const [materi, setMateri] = useState(null);
  const [babList, setBabList] = useState([]);
  const [bab, setBab] = useState(null);   // draft editor
  const [babId, setBabId] = useState(null);
  const [pesan, setPesan] = useState('');
  const [uploading, setUploading] = useState('');
  const [bankOpen, setBankOpen] = useState(null); // {jenis, field, onUrl}
  const [bankList, setBankList] = useState([]);
  const [bankLoading, setBankLoading] = useState(false);
  const fileRefs = useRef({});

  const bukaBank = async (konfig) => {
    setBankOpen(konfig);
    setBankLoading(true);
    setBankList(await listBankFiles());
    setBankLoading(false);
  };
  const pilihDariBank = (f) => {
    if (bankOpen?.onUrl) bankOpen.onUrl(f.url);
    else if (bankOpen?.field) set(bankOpen.field, f.url);
    setBankOpen(null);
  };

  const muat = async () => {
    // Turn 56: admin WAJIB lihat kebenaran server (cache basi pernah
    // menampilkan bab terhapus / menyembunyikan salinan -- "hantu").
    const { materi: m, babList: bl } =
      await muatMateriDanBab(materiId, { dariServer: true });
    setMateri(m);
    setBabList(bl);
  };
  useEffect(() => {
    let hidup = true;
    (async () => {
      const r = await muatMateriDanBab(materiId, { dariServer: true });
      if (!hidup) return;
      setMateri(r.materi);
      setBabList(r.babList);
    })();
    return () => { hidup = false; };
  }, [materiId]);

  const bukaBab = (b) => {
    setBab(JSON.parse(JSON.stringify(b)));
    setBabId(b.id);
    setPesan('');
  };
  const babBaru = () => {
    setBab(JSON.parse(JSON.stringify({ ...BAB_KOSONG, urutan: babList.length + 1 })));
    setBabId(null);
    setPesan('');
  };

  const set = (k, v) => setBab((b) => ({ ...b, [k]: v }));
  const setSec = (i, patch) => setBab((b) => ({
    ...b, sections: b.sections.map((s, j) => (j === i ? { ...s, ...patch } : s)),
  }));
  const moveSec = (i, dir) => setBab((b) => {
    const arr = [...b.sections];
    const j = i + dir;
    if (j < 0 || j >= arr.length) return b;
    [arr[i], arr[j]] = [arr[j], arr[i]];
    return { ...b, sections: arr };
  });
  const delSec = (i) => setBab((b) => ({
    ...b, sections: b.sections.filter((_, j) => j !== i),
  }));
  const setKuis = (i, patch) => setBab((b) => ({
    ...b, ujiPemahaman: b.ujiPemahaman.map((s, j) => (j === i ? { ...s, ...patch } : s)),
  }));
  const delKuis = (i) => setBab((b) => ({
    ...b, ujiPemahaman: b.ujiPemahaman.filter((_, j) => j !== i),
  }));

  /** Upload file ke Supabase lalu isi field url bab. */
  const upload = async (field, file, onUrl) => {
    if (!file) return;
    setUploading(field);
    setPesan('');
    try {
      const res = await uploadElearningFile(file, 'materi-v2');
      const url = res?.downloadURL || res?.url || '';
      if (!url) throw new Error('URL tidak dikembalikan Supabase.');
      if (onUrl) onUrl(url); else set(field, url);
      setPesan(`✅ ${file.name} terunggah & terpasang.`);
    } catch (e) {
      setPesan(`Upload gagal: ${e.message}`);
    }
    setUploading('');
  };

  const simpan = async () => {
    if (!bab.judul.trim()) { setPesan('Judul bab wajib diisi.'); return; }
    try {
      const id = await simpanBab(materiId, babId, bab);
      setBabId(id);
      setPesan('✅ Bab tersimpan & langsung berlaku.');
      await muat();
    } catch (e) {
      setPesan(`Gagal simpan: ${pesanErrorFirestore(e)}`);
      // Bab ternyata sudah dihapus di server -> tutup editor + muat ulang
      // supaya tidak ada yang mencoba menyimpan "bab hantu" lagi.
      if (String(e?.message || '').includes('sudah dihapus')) {
        setBab(null); setBabId(null);
        await muat();
      }
    }
  };

  const konfirmasiHapus = (judul, nSec, nSoal) => window.confirm(
    `Hapus bab "${judul}" PERMANEN?\n\n`
    + `Isi: ${nSec} bagian • ${nSoal} soal.\n`
    + 'Progres siswa bab ini ikut dibersihkan.\n'
    + 'Tidak bisa dibatalkan — pastikan cadangannya ada '
    + '(file IMPOR-…-TERBARU.json bisa diimpor ulang).',
  );

  const hapus = async () => {
    if (!babId) return;
    if (!konfirmasiHapus(
      bab?.judul || '',
      (bab?.sections || []).length,
      (bab?.ujiPemahaman || []).length,
    )) return;
    try {
      await hapusBab(materiId, babId);
      const judul = bab?.judul || '';
      setBab(null); setBabId(null);
      setPesan(`✅ Bab "${judul}" dihapus — terverifikasi hilang di server.`);
      await muat();
    } catch (e) {
      setPesan(`Gagal hapus: ${pesanErrorFirestore(e)}`);
      await muat();
    }
  };

  // HAPUS PER BAB dari daftar kiri (Turn 56 -- permintaan owner: tombol
  // hapus bab harus kelihatan langsung, tidak terkubur di kaki editor).
  const hapusBabItem = async (b) => {
    if (!konfirmasiHapus(
      b.judul || '',
      (b.sections || []).length,
      (b.ujiPemahaman || []).length,
    )) return;
    try {
      await hapusBab(materiId, b.id);
      if (babId === b.id) { setBab(null); setBabId(null); }
      setPesan(`✅ Bab "${b.judul}" dihapus — terverifikasi hilang di server.`);
      await muat();
    } catch (e) {
      setPesan(`Gagal hapus: ${pesanErrorFirestore(e)}`);
      await muat();
    }
  };

  const FileRow = ({ field, label, accept, ikon, value, onUrl, jenisBank }) => {
    const urlNow = value !== undefined ? value : bab[field];
    return (
    <div style={S.fileRow}>
      <span style={S.fileIkon}>{ikon}</span>
      <span style={{ flex: 1, minWidth: 0 }}>
        <span style={S.fileLabel}>{label}</span>
        <span style={S.fileUrl}>
          {urlNow ? '✅ terpasang' : 'belum ada file'}
        </span>
      </span>
      <input
        ref={(el) => { fileRefs.current[field] = el; }}
        type="file" accept={accept} style={{ display: 'none' }}
        onChange={(e) => upload(field, e.target.files?.[0], onUrl)}
      />
      <button type="button" style={S.btnKecil}
        disabled={uploading === field}
        onClick={() => fileRefs.current[field]?.click()}>
        <Upload size={12} />
        {uploading === field ? 'Mengunggah…' : 'Upload'}
      </button>
      <button type="button" style={S.btnKecil}
        onClick={() => bukaBank({ jenis: jenisBank, field: onUrl ? null : field, onUrl })}>
        🏦 Bank
      </button>
      {urlNow && (
        <a href={urlNow} target="_blank" rel="noreferrer" style={S.btnKecilLink}>
          Buka
        </a>
      )}
    </div>
    );
  };

  // Deteksi BAB KEMBAR (Turn 56): judul dinormalisasi muncul >= 2 kali =
  // kemungkinan salinan impor ganda. Ditandai chip + banner agar owner
  // langsung bisa menghapus salah satunya (anti "file hantu").
  const hitungJudul = {};
  for (const b of babList) {
    const k = normalJudul(b.judul);
    if (k) hitungJudul[k] = (hitungJudul[k] || 0) + 1;
  }
  const judulKembar = new Set(
    Object.keys(hitungJudul).filter((k) => hitungJudul[k] > 1),
  );

  return (
    <div style={halamanDasar}>
      <div style={S.head}>
        <button type="button" style={S.kembali}
          onClick={() => navigate('/admin/materi-v2')}>
          <ArrowLeft size={15} /> Manajer
        </button>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h1 style={S.judul}>{materi?.judul || 'Memuat…'}</h1>
          <p style={S.sub}>Daftar bab di kiri • editor di kanan</p>
        </div>
        <button type="button" style={tombolPill('primer')} onClick={babBaru}>
          <Plus size={15} /> Bab Baru
        </button>
      </div>

      <div style={S.badan}>
        {/* ------- daftar bab ------- */}
        <aside style={S.sisi}>
          {judulKembar.size > 0 && (
            <div style={S.dupBanner}>
              ⚠️ Ada bab berjudul sama — kemungkinan SALINAN impor ganda.
              Hapus salah satu lewat tombol 🗑 di sampingnya.
            </div>
          )}
          {babList.map((b, i) => (
            <div key={b.id} style={S.babBaris}>
              <button type="button"
                style={{
                  ...S.babItem, flex: 1, minWidth: 0,
                  ...(babId === b.id ? S.babItemAktif : null),
                }}
                onClick={() => bukaBab(b)}>
                <span style={lingkaranNomor(babId === b.id ? 'aktif' : 'biasa')}>
                  {i + 1}
                </span>
                <span style={{ flex: 1, minWidth: 0, textAlign: 'left' }}>
                  <span style={S.babJudul}>{b.judul}</span>
                  <span style={S.babMeta}>
                    {(b.sections || []).length} bagian •
                    {' '}{(b.ujiPemahaman || []).length} soal
                    {b.slideUrl ? ' • 📽' : ''}
                  </span>
                  {judulKembar.has(normalJudul(b.judul)) && (
                    <span style={S.dupChip}>⚠️ judul kembar</span>
                  )}
                </span>
              </button>
              <button type="button" style={S.babHapus}
                title={`Hapus bab "${b.judul}"`}
                onClick={() => hapusBabItem(b)}>
                <Trash2 size={14} />
              </button>
            </div>
          ))}
          {babList.length === 0 && (
            <div style={S.sisiKosong}>Belum ada bab — klik “Bab Baru”.</div>
          )}
        </aside>

        {/* ------- editor ------- */}
        <main style={S.editor}>
          {!bab ? (
            <div style={S.kosong}>
              <FileText size={26} />
              <p style={{ margin: '10px 0 0', fontSize: 13 }}>
                Pilih bab untuk mengedit, atau buat bab baru.
                Isi bab: teks terstruktur, file PPT/PDF/video,
                dan soal untuk latihan live.
              </p>
            </div>
          ) : (
            <>
              {pesan && (
                <div style={pesan.startsWith('✅') ? S.ok : S.err}>{pesan}</div>
              )}
              <div style={{ ...kartuDasar, padding: 16 }}>
                {/* Turn 56: tombol HAPUS & SIMPAN juga di ATAS -- dulu hanya
                    di kaki editor (tak terlihat pada bab 46 bagian). */}
                <div style={{ ...S.footBtns, marginTop: 0, marginBottom: 14 }}>
                  {babId && (
                    <button type="button"
                      style={{ ...tombolPill('putih'), color: '#B91C1C', borderColor: T.merahGaris }}
                      onClick={hapus}>
                      <Trash2 size={14} /> Hapus Bab
                    </button>
                  )}
                  <span style={{ flex: 1 }} />
                  <button type="button" style={tombolPill('primer')} onClick={simpan}>
                    <Save size={14} /> Simpan Bab
                  </button>
                </div>
                <div style={S.grid2}>
                  <label style={S.lab}>Judul bab *
                    <input style={S.inp} value={bab.judul}
                      onChange={(e) => set('judul', e.target.value)} />
                  </label>
                  <label style={S.lab}>Urutan
                    <input style={S.inp} type="number" value={bab.urutan || 1}
                      onChange={(e) => set('urutan', Number(e.target.value))} />
                  </label>
                  <label style={S.lab}>Estimasi menit
                    <input style={S.inp} type="number" value={bab.estimasiMenit || 0}
                      onChange={(e) => set('estimasiMenit', Number(e.target.value))} />
                  </label>
                </div>
                <label style={S.lab}>Ringkasan
                  <textarea style={S.inp} rows={2} value={bab.ringkasan || ''}
                    onChange={(e) => set('ringkasan', e.target.value)} />
                </label>

                <div style={S.seksiJudul}>📁 File Pendukung (Supabase)</div>
                <FileRow field="slideUrl" label="Slide PPT (.pptx/.ppt)"
                  accept=".ppt,.pptx" ikon={<Presentation size={15} />}
                  jenisBank="slide" />
                <FileRow field="pdfUrl" label="Modul PDF (.pdf)"
                  accept="application/pdf" ikon={<FileText size={15} />}
                  jenisBank="pdf" />
                <FileRow field="videoUrl" label="Video (.mp4/.webm)"
                  accept="video/*" ikon={<Video size={15} />}
                  jenisBank="video" />

                <div style={S.seksiJudul}>
                  🧩 Bagian Materi ({(bab.sections || []).length})
                </div>
                {(bab.sections || []).map((sec, i) => (
                  <div key={i} style={S.secRow}>
                    <div style={S.secHead}>
                      <span style={S.secBadge}>{sec.jenis}</span>
                      <span style={{ flex: 1 }} />
                      <button type="button" style={S.iconBtn}
                        onClick={() => moveSec(i, -1)}><ChevronUp size={13} /></button>
                      <button type="button" style={S.iconBtn}
                        onClick={() => moveSec(i, 1)}><ChevronDown size={13} /></button>
                      <button type="button" style={{ ...S.iconBtn, color: '#B91C1C' }}
                        onClick={() => delSec(i)}><Trash2 size={13} /></button>
                    </div>
                    {sec.jenis === 'gambar' ? (
                      <>
                        <FileRow field={`img-${i}`} label="Gambar"
                          accept="image/*" ikon={<IconGambar size={15} />}
                          value={sec.url} jenisBank="gambar"
                          onUrl={(u) => setSec(i, { url: u })} />
                        <input style={S.inp} value={sec.url}
                          placeholder="atau tempel URL gambar"
                          onChange={(e) => setSec(i, { url: e.target.value })} />
                        <input style={S.inp} value={sec.keterangan || ''}
                          placeholder="Keterangan gambar"
                          onChange={(e) => setSec(i, { keterangan: e.target.value })} />
                      </>
                    ) : sec.jenis === 'langkah' ? (
                      <textarea style={S.inp} rows={3}
                        value={(sec.items || []).join('\n')}
                        placeholder="Satu langkah per baris"
                        onChange={(e) => setSec(i, { items: e.target.value.split('\n') })} />
                    ) : sec.jenis === 'rumus' ? (
                      <input style={S.inp} value={sec.latex || ''}
                        placeholder="LaTeX, mis. a^2 + b^2 = c^2"
                        onChange={(e) => setSec(i, { latex: e.target.value })} />
                    ) : (
                      <>
                        {(sec.jenis === 'callout' || sec.jenis === 'contoh') && (
                          <div style={S.grid2}>
                            <label style={S.lab}>Judul kecil
                              <input style={S.inp} value={sec.judul || ''}
                                onChange={(e) => setSec(i, { judul: e.target.value })} />
                            </label>
                            {sec.jenis === 'callout' && (
                              <label style={S.lab}>Tipe
                                <select style={S.inp} value={sec.tipe || 'info'}
                                  onChange={(e) => setSec(i, { tipe: e.target.value })}>
                                  <option value="info">Info (biru)</option>
                                  <option value="tips">Tips (kuning)</option>
                                  <option value="peringatan">Peringatan (merah)</option>
                                </select>
                              </label>
                            )}
                          </div>
                        )}
                        <textarea style={S.inp} rows={sec.jenis === 'paragraf' ? 3 : 2}
                          value={sec.teks || ''} placeholder="Isi teks (dukung LaTeX $...$)"
                          onChange={(e) => setSec(i, { teks: e.target.value })} />
                        {sec.jenis === 'contoh' && (
                          <input style={S.inp} value={sec.pembahasan || ''}
                            placeholder="Pembahasan (opsional)"
                            onChange={(e) => setSec(i, { pembahasan: e.target.value })} />
                        )}
                      </>
                    )}
                  </div>
                ))}
                <div style={S.addRow}>
                  {Object.keys(SEC_TEMPLATE).map((j) => (
                    <button key={j} type="button" style={S.btnAdd}
                      onClick={() => set('sections', [
                        ...(bab.sections || []),
                        JSON.parse(JSON.stringify(SEC_TEMPLATE[j])),
                      ])}>
                      + {j}
                    </button>
                  ))}
                </div>

                <div style={S.seksiJudul}>
                  🎯 Uji Pemahaman / Soal Live ({(bab.ujiPemahaman || []).length})
                </div>
                {(bab.ujiPemahaman || []).map((k, i) => (
                  <div key={i} style={S.secRow}>
                    <div style={S.secHead}>
                      <span style={S.secBadge}>soal {i + 1}</span>
                      <span style={{ flex: 1 }} />
                      <button type="button" style={{ ...S.iconBtn, color: '#B91C1C' }}
                        onClick={() => delKuis(i)}><Trash2 size={13} /></button>
                    </div>
                    <textarea style={S.inp} rows={2} value={k.soal}
                      placeholder="Soal (dukung LaTeX $...$)"
                      onChange={(e) => setKuis(i, { soal: e.target.value })} />
                    <select style={S.inp} value={k.tipe || 'pg'}
                      onChange={(e) => {
                        const v = e.target.value;
                        const patch = { tipe: v };
                        if (v === 'pg') patch.jawaban = 0;
                        if (v === 'pgMulti') patch.jawaban = Array.isArray(k.jawaban) ? k.jawaban : [];
                        if (v === 'tabel') {
                          patch.kolom = k.kolom || ['Benar', 'Salah'];
                          patch.baris = k.baris || [''];
                          patch.jawaban = Array.isArray(k.jawaban) ? k.jawaban : [];
                        }
                        if (v === 'jodoh') {
                          patch.premis = Array.isArray(k.premis) && k.premis.length
                            ? k.premis : ['', ''];
                          patch.opsi = Array.isArray(k.opsi) && k.opsi.length
                            ? k.opsi : ['', '', ''];
                          patch.jawaban = patch.premis.map((_, r) =>
                            (Array.isArray(k.jawaban) && k.jawaban[r] != null
                              ? k.jawaban[r] : 0));
                        }
                        if (v === 'isian' || v === 'uraian') {
                          patch.jawaban = typeof k.jawaban === 'string' ? k.jawaban : '';
                        }
                        setKuis(i, patch);
                      }}>
                      <option value="pg">PG — satu jawaban</option>
                      <option value="pgMulti">PGK-MCMA — centang beberapa benar</option>
                      <option value="tabel">PGK kategori — tabel per baris</option>
                      <option value="jodoh">Menjodohkan — premis kiri, pilihan kanan</option>
                      <option value="isian">Isian singkat — jawaban eksak</option>
                      <option value="uraian">Uraian — referensi jawaban</option>
                    </select>
                    {(k.tipe || 'pg') === 'tabel' ? (
                      <>
                        <input style={S.inp}
                          value={(k.kolom || ['Benar', 'Salah']).join(', ')}
                          placeholder="Nama kolom, pisahkan koma (Mungkin, Tidak Mungkin)"
                          onChange={(e) => setKuis(i, {
                            kolom: e.target.value.split(',')
                              .map((x) => x.trim()).filter(Boolean),
                          })} />
                        {(k.baris || []).map((bar, r) => (
                          <div key={r} style={S.opsiRow}>
                            <select style={{ ...S.inp, width: 140, flexShrink: 0 }}
                              value={Array.isArray(k.jawaban) && k.jawaban[r] != null
                                ? k.jawaban[r] : 0}
                              onChange={(e) => {
                                const arr = Array.isArray(k.jawaban)
                                  ? [...k.jawaban] : [];
                                arr[r] = Number(e.target.value);
                                setKuis(i, { jawaban: arr });
                              }}>
                              {(k.kolom || ['Benar', 'Salah']).map((kk, c) => (
                                <option key={c} value={c}>{kk}</option>
                              ))}
                            </select>
                            <input style={S.inp} value={bar}
                              placeholder={`Pernyataan baris ${r + 1}`}
                              onChange={(e) => setKuis(i, {
                                baris: (k.baris || []).map((x, y) => (y === r ? e.target.value : x)),
                              })} />
                            <button type="button" style={S.iconBtn}
                              onClick={() => setKuis(i, {
                                baris: (k.baris || []).filter((_, y) => y !== r),
                              })}>
                              <Trash2 size={12} />
                            </button>
                          </div>
                        ))}
                        <button type="button" style={S.btnKecil}
                          onClick={() => setKuis(i, { baris: [...(k.baris || []), ''] })}>
                          + baris pernyataan
                        </button>
                      </>
                    ) : (k.tipe || 'pg') === 'jodoh' ? (
                      <>
                        <div style={S.labelKecil}>
                          Premis (kolom kiri) + huruf kunci pasangannya
                          (satu huruf boleh menjadi kunci lebih dari satu premis)
                        </div>
                        {(k.premis || []).map((pr, r) => (
                          <div key={r} style={S.opsiRow}>
                            <select style={{ ...S.inp, width: 74, flexShrink: 0 }}
                              value={Array.isArray(k.jawaban) && k.jawaban[r] != null
                                ? k.jawaban[r] : 0}
                              onChange={(e) => {
                                const arr = Array.isArray(k.jawaban)
                                  ? [...k.jawaban] : [];
                                arr[r] = Number(e.target.value);
                                setKuis(i, { jawaban: arr });
                              }}
                              title="Kunci pasangan premis ini">
                              {(k.opsi || []).map((_, c) => (
                                <option key={c} value={c}>
                                  {String.fromCharCode(65 + c)}
                                </option>
                              ))}
                            </select>
                            <input style={S.inp} value={pr}
                              placeholder={`Premis ${r + 1}`}
                              onChange={(e) => setKuis(i, {
                                premis: (k.premis || []).map((x, y) => (y === r ? e.target.value : x)),
                              })} />
                            <button type="button" style={S.iconBtn}
                              onClick={() => setKuis(i, {
                                premis: (k.premis || []).filter((_, y) => y !== r),
                                jawaban: (k.jawaban || []).filter((_, y) => y !== r),
                              })}>
                              <Trash2 size={12} />
                            </button>
                          </div>
                        ))}
                        <button type="button" style={S.btnKecil}
                          onClick={() => setKuis(i, {
                            premis: [...(k.premis || []), ''],
                            jawaban: [...(k.jawaban || []), 0],
                          })}>
                          + premis
                        </button>
                        <div style={S.labelKecil}>
                          Kolam pilihan pasangan (kolom kanan) — wajib lebih
                          banyak daripada premis (sisanya pengecoh)
                        </div>
                        {(k.opsi || []).map((op, j) => (
                          <div key={j} style={S.opsiRow}>
                            <input style={S.inp} value={op}
                              placeholder={`Pilihan ${String.fromCharCode(65 + j)}`}
                              onChange={(e) => setKuis(i, {
                                opsi: (k.opsi || []).map((o, x) => (x === j ? e.target.value : o)),
                              })} />
                            <button type="button" style={S.iconBtn}
                              onClick={() => setKuis(i, {
                                opsi: (k.opsi || []).filter((_, y) => y !== j),
                              })}>
                              <Trash2 size={12} />
                            </button>
                          </div>
                        ))}
                        <button type="button" style={S.btnKecil}
                          onClick={() => setKuis(i, { opsi: [...(k.opsi || []), ''] })}>
                          + pilihan pasangan
                        </button>
                      </>
                    ) : (k.tipe || 'pg') === 'isian' ? (
                      <input style={S.inp}
                        value={typeof k.jawaban === 'string' ? k.jawaban : ''}
                        placeholder="Kunci jawaban eksak (mis. 80 atau 2,5)"
                        onChange={(e) => setKuis(i, { jawaban: e.target.value })} />
                    ) : (k.tipe || 'pg') === 'uraian' ? (
                      <textarea style={S.inp} rows={3}
                        value={typeof k.jawaban === 'string' ? k.jawaban : ''}
                        placeholder="Referensi jawaban (pokok-pokok kunci rubrik)"
                        onChange={(e) => setKuis(i, { jawaban: e.target.value })} />
                    ) : (
                      <>
                        {(k.opsi || []).map((op, j) => (
                          <div key={j} style={S.opsiRow}>
                            {(k.tipe || 'pg') === 'pgMulti' ? (
                              <input type="checkbox"
                                checked={Array.isArray(k.jawaban) && k.jawaban.includes(j)}
                                onChange={(e) => {
                                  const arr = Array.isArray(k.jawaban)
                                    ? [...k.jawaban] : [];
                                  const at = arr.indexOf(j);
                                  if (e.target.checked && at < 0) arr.push(j);
                                  if (!e.target.checked && at >= 0) arr.splice(at, 1);
                                  arr.sort((a, b) => a - b);
                                  setKuis(i, { jawaban: arr });
                                }}
                                title="Centang jika ini jawaban benar" />
                            ) : (
                              <input type="radio" name={`kuis${i}`} checked={k.jawaban === j}
                                onChange={() => setKuis(i, { jawaban: j })}
                                title="Tandai sebagai jawaban benar" />
                            )}
                            <input style={S.inp} value={op}
                              placeholder={`Opsi ${String.fromCharCode(65 + j)}`}
                              onChange={(e) => setKuis(i, {
                                opsi: (k.opsi || []).map((o, x) => (x === j ? e.target.value : o)),
                              })} />
                          </div>
                        ))}
                        <button type="button" style={S.btnKecil}
                          onClick={() => setKuis(i, { opsi: [...(k.opsi || []), ''] })}>
                          + opsi
                        </button>
                      </>
                    )}
                    <input style={S.inp} value={k.pembahasan || ''}
                      placeholder="Pembahasan"
                      onChange={(e) => setKuis(i, { pembahasan: e.target.value })} />
                    <input style={S.inp} value={k.soalGambar || ''}
                      placeholder="URL gambar stimulus soal (opsional, salin dari Bank Materi)"
                      onChange={(e) => setKuis(i, { soalGambar: e.target.value })} />
                    <input style={S.inp} value={k.pembahasanGambar || ''}
                      placeholder="URL gambar pembahasan (opsional: grafik beranotasi dll.)"
                      onChange={(e) => setKuis(i, { pembahasanGambar: e.target.value })} />
                    <input style={S.inp} value={k.pembahasanGambarKet || ''}
                      placeholder="Keterangan gambar pembahasan (cara membacanya)"
                      onChange={(e) => setKuis(i, { pembahasanGambarKet: e.target.value })} />
                  </div>
                ))}
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <button type="button" style={S.btnAdd}
                    onClick={() => set('ujiPemahaman', [
                      ...(bab.ujiPemahaman || []),
                      JSON.parse(JSON.stringify(KUIS_KOSONG)),
                    ])}>
                    + soal PG
                  </button>
                  <button type="button" style={S.btnAdd}
                    onClick={() => set('ujiPemahaman', [
                      ...(bab.ujiPemahaman || []),
                      { soal: '', tipe: 'pgMulti', opsi: ['', '', '', ''], jawaban: [], pembahasan: '' },
                    ])}>
                    + PGK-MCMA (centang)
                  </button>
                  <button type="button" style={S.btnAdd}
                    onClick={() => set('ujiPemahaman', [
                      ...(bab.ujiPemahaman || []),
                      { soal: '', tipe: 'tabel', kolom: ['Benar', 'Salah'], baris: [''], jawaban: [], pembahasan: '' },
                    ])}>
                    + tabel kategori
                  </button>
                  <button type="button" style={S.btnAdd}
                    onClick={() => set('ujiPemahaman', [
                      ...(bab.ujiPemahaman || []),
                      { soal: '', tipe: 'jodoh', premis: ['', ''], opsi: ['', '', ''], jawaban: [0, 0], pembahasan: '' },
                    ])}>
                    + menjodohkan
                  </button>
                  <button type="button" style={S.btnAdd}
                    onClick={() => set('ujiPemahaman', [
                      ...(bab.ujiPemahaman || []),
                      { soal: '', tipe: 'isian', jawaban: '', pembahasan: '' },
                    ])}>
                    + isian singkat
                  </button>
                  <button type="button" style={S.btnAdd}
                    onClick={() => set('ujiPemahaman', [
                      ...(bab.ujiPemahaman || []),
                      { soal: '', tipe: 'uraian', jawaban: '', pembahasan: '' },
                    ])}>
                    + uraian
                  </button>
                </div>

                <div style={S.footBtns}>
                  {babId && (
                    <button type="button"
                      style={{ ...tombolPill('putih'), color: '#B91C1C', borderColor: T.merahGaris }}
                      onClick={hapus}>
                      <Trash2 size={14} /> Hapus Bab
                    </button>
                  )}
                  <span style={{ flex: 1 }} />
                  <button type="button" style={tombolPill('primer')} onClick={simpan}>
                    <Save size={14} /> Simpan Bab
                  </button>
                </div>
              </div>
            </>
          )}
        </main>
      </div>

      {/* ---------- modal pilih dari bank ---------- */}
      {bankOpen && (
        <div style={S.modalLatar}>
          <div style={S.modal}>
            <div style={S.modalHead}>
              <span style={{ fontWeight: 800, fontSize: 14, color: T.judul }}>
                🏦 Pilih dari Bank Materi
              </span>
              <button type="button" style={S.tutup}
                onClick={() => setBankOpen(null)}>✕</button>
            </div>
            {bankLoading ? (
              <div style={S.modalKosong}>Memuat bank...</div>
            ) : (
              <div style={S.modalList}>
                {bankList
                  .filter((f) => f.jenis === bankOpen.jenis)
                  .map((f) => (
                    <button key={f.path} type="button" style={S.modalItem}
                      onClick={() => pilihDariBank(f)}>
                      <span style={{ flex: 1, minWidth: 0, textAlign: 'left' }}>
                        <span style={S.modalNama}>{f.name}</span>
                        <span style={S.modalMeta}>
                          {formatUkuran(f.ukuran)}
                          {f.updated ? ` • ${String(f.updated).slice(0, 10)}` : ''}
                        </span>
                      </span>
                      <span style={S.modalPilih}>Pakai</span>
                    </button>
                  ))}
                {bankList.filter((f) => f.jenis === bankOpen.jenis).length === 0 && (
                  <div style={S.modalKosong}>
                    Belum ada file jenis ini di bank — upload dulu lewat
                    halaman Bank Materi atau tombol Upload di samping.
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

const S = {
  labelKecil: { fontSize: 11, color: '#64748B', margin: '6px 0 4px', fontWeight: 700 },
  head: {
    display: 'flex', gap: 12, alignItems: 'center',
    padding: '14px 18px', background: T.gradasiHero,
  },
  kembali: {
    display: 'inline-flex', gap: 6, alignItems: 'center', background: 'none',
    border: 'none', color: '#fff', fontWeight: 800, fontSize: 12.5,
    cursor: 'pointer', fontFamily: 'inherit',
  },
  judul: { margin: 0, color: '#fff', fontSize: 18, fontWeight: 800 },
  sub: { margin: 0, color: 'rgba(255,255,255,.75)', fontSize: 11 },
  badan: {
    display: 'flex', gap: 16, alignItems: 'flex-start',
    maxWidth: 1150, margin: '0 auto', padding: '16px 16px 50px',
    flexWrap: 'wrap',
  },
  sisi: { width: 260, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 8 },
  babBaris: { display: 'flex', gap: 6, alignItems: 'stretch' },
  babHapus: {
    background: '#fff', border: `1px solid ${T.merahGaris}`, color: '#B91C1C',
    borderRadius: 10, width: 34, flexShrink: 0, cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  dupChip: {
    display: 'inline-block', marginTop: 4, fontSize: 9.5, fontWeight: 800,
    color: '#92400E', background: '#FEF3C7', border: '1px solid #FDE68A',
    borderRadius: 999, padding: '1px 7px',
  },
  dupBanner: {
    fontSize: 11, fontWeight: 700, color: '#92400E', background: '#FEF3C7',
    border: '1px solid #FDE68A', borderRadius: 10, padding: '8px 10px',
    lineHeight: 1.5,
  },
  babItem: {
    display: 'flex', gap: 10, alignItems: 'center', ...kartuDasar,
    padding: '10px 11px', cursor: 'pointer', fontFamily: 'inherit', width: '100%',
  },
  babItemAktif: { border: `1.5px solid ${T.biru}` },
  babJudul: { display: 'block', fontWeight: 700, fontSize: 12.5, color: T.judul },
  babMeta: { display: 'block', fontSize: 10.5, color: T.samar, marginTop: 2 },
  sisiKosong: { color: T.samar, fontSize: 12, textAlign: 'center', padding: 12 },
  editor: { flex: 1, minWidth: 300 },
  kosong: {
    display: 'flex', flexDirection: 'column', alignItems: 'center',
    justifyContent: 'center', textAlign: 'center', color: T.samar,
    ...kartuDasar, padding: '44px 24px',
  },
  ok: {
    background: T.hijauLatar, border: `1px solid ${T.hijauGaris}`,
    color: T.hijauTeks, borderRadius: 10, padding: '9px 13px',
    fontSize: 12.5, marginBottom: 12,
  },
  err: {
    background: T.merahLatar, border: `1px solid ${T.merahGaris}`,
    color: '#B91C1C', borderRadius: 10, padding: '9px 13px',
    fontSize: 12.5, marginBottom: 12,
  },
  grid2: {
    display: 'grid', gap: 10, marginBottom: 10,
    gridTemplateColumns: 'repeat(auto-fill,minmax(190px,1fr))',
  },
  lab: {
    display: 'flex', flexDirection: 'column', gap: 4,
    fontSize: 11, fontWeight: 800, color: T.samar,
  },
  inp: {
    border: `1px solid ${T.garis}`, borderRadius: 10, padding: '9px 11px',
    fontSize: 13, color: T.teks, background: '#fff', fontFamily: 'inherit',
    outline: 'none', width: '100%', marginBottom: 8,
  },
  seksiJudul: {
    fontWeight: 800, fontSize: 13, color: T.judul, margin: '16px 0 9px',
  },
  fileRow: {
    display: 'flex', gap: 9, alignItems: 'center',
    background: T.latar, border: `1px solid ${T.garisLembut}`,
    borderRadius: 11, padding: '9px 11px', marginBottom: 8,
  },
  fileIkon: {
    width: 30, height: 30, borderRadius: 9, background: T.kotakBiru,
    color: T.biruDalam, display: 'flex', alignItems: 'center',
    justifyContent: 'center', flexShrink: 0,
  },
  fileLabel: { display: 'block', fontWeight: 700, fontSize: 12, color: T.judul },
  fileUrl: { display: 'block', fontSize: 10.5, color: T.samar },
  btnKecil: {
    display: 'inline-flex', gap: 5, alignItems: 'center',
    background: '#fff', border: `1px solid ${T.garis}`, color: T.biruGelap,
    borderRadius: 9, padding: '6px 11px', fontSize: 11, fontWeight: 800,
    cursor: 'pointer', fontFamily: 'inherit', flexShrink: 0,
  },
  btnKecilLink: {
    color: T.samar, fontSize: 11, fontWeight: 700, flexShrink: 0,
  },
  secRow: {
    border: `1px solid ${T.garis}`, borderRadius: 12,
    padding: 11, marginBottom: 10, background: '#fff',
  },
  secHead: { display: 'flex', gap: 6, alignItems: 'center', marginBottom: 8 },
  secBadge: {
    background: T.kotakBiru, color: T.biruDalam, border: `1px solid ${T.kotakBiruGaris}`,
    borderRadius: 999, padding: '3px 10px', fontSize: 10, fontWeight: 800,
  },
  iconBtn: {
    background: T.latar, border: `1px solid ${T.garis}`, borderRadius: 7,
    color: T.samar, width: 24, height: 24, display: 'flex',
    alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
  },
  addRow: { display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 6 },
  btnAdd: {
    background: '#fff', border: `1px dashed ${T.biru}`, color: T.biruGelap,
    borderRadius: 999, padding: '6px 12px', fontSize: 11, fontWeight: 800,
    cursor: 'pointer', fontFamily: 'inherit',
  },
  opsiRow: { display: 'flex', gap: 8, alignItems: 'center' },
  footBtns: { display: 'flex', gap: 9, alignItems: 'center', marginTop: 16 },
  modalLatar: {
    position: 'fixed', inset: 0, zIndex: 70, background: 'rgba(15,48,87,.45)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 18,
  },
  modal: {
    background: '#fff', borderRadius: 16, width: '100%', maxWidth: 520,
    maxHeight: '70vh', display: 'flex', flexDirection: 'column',
    boxShadow: '0 18px 50px rgba(11,36,64,.35)',
  },
  modalHead: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '13px 16px', borderBottom: `1px solid ${T.garis}`,
  },
  tutup: {
    background: T.latar, border: `1px solid ${T.garis}`, borderRadius: 8,
    color: T.samar, width: 28, height: 28, cursor: 'pointer', fontFamily: 'inherit',
  },
  modalList: { overflowY: 'auto', padding: 12, display: 'flex', flexDirection: 'column', gap: 8 },
  modalKosong: { color: T.samar, fontSize: 12.5, textAlign: 'center', padding: 22, lineHeight: 1.6 },
  modalItem: {
    display: 'flex', gap: 10, alignItems: 'center', background: T.latar,
    border: `1px solid ${T.garisLembut}`, borderRadius: 11,
    padding: '9px 11px', cursor: 'pointer', fontFamily: 'inherit',
  },
  modalNama: {
    display: 'block', fontWeight: 700, fontSize: 12.5, color: T.judul,
    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
  },
  modalMeta: { display: 'block', fontSize: 10.5, color: T.samar, marginTop: 2 },
  modalPilih: {
    background: T.biru, color: '#fff', borderRadius: 8,
    padding: '5px 11px', fontSize: 11, fontWeight: 800, flexShrink: 0,
  },
};
