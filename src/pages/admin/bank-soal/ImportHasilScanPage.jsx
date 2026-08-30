// src/pages/admin/bank-soal/ImportHasilScanPage.jsx
// ============================================================
// Halaman import hasil scan AI eksternal (Gemini Canvas, dsb)
// ke Bank Soal Gemilang.
//
// Cara pakai:
// 1. Di Gemini Canvas / tool AI lain → klik JSON / CSV
// 2. Copy hasilnya
// 3. Paste di sini → preview → isi metadata → Simpan
//
// Support format:
// - JSON  : lengkap, termasuk gambar base64 → upload Supabase
// - CSV   : teks saja (tanpa gambar)
// ============================================================

import React, { useState, useCallback, useMemo } from 'react';
import SidebarAdmin from '../../../components/SidebarAdmin';
import {
  collection, doc, writeBatch, serverTimestamp,
} from 'firebase/firestore';
import { db, auth } from '../../../firebase';

/* Tailwind CDN auto-load — supaya styling jalan tanpa config tambahan */
const useTailwind = () => {
  React.useEffect(() => {
    if (!document.querySelector('script[src*="cdn.tailwindcss.com"]')) {
      const s = document.createElement('script');
      s.src = 'https://cdn.tailwindcss.com';
      s.async = true;
      document.head.insertBefore(s, document.head.firstChild);
    }
  }, []);
};

/* ============================================================
   KONSTANTA
============================================================ */

const BANK_SOAL_COLLECTION = 'bank_soal';

const DAFTAR_MAPEL = [
  'Matematika','Fisika','Kimia','Biologi',
  'Bahasa Indonesia','Bahasa Inggris',
  'Ekonomi','Geografi','Sosiologi','Sejarah',
  'PKN','TPS/Penalaran Umum','Lainnya',
];
const DAFTAR_JENJANG   = ['SD/MI','SMP/MTs','SMA/MA','SMK','UTBK/SNBT'];
const DAFTAR_KELAS     = ['1','2','3','4','5','6','7','8','9','10','11','12','Semua'];
const DAFTAR_KESULITAN = ['mudah','sedang','sulit'];

const TIPE_LABELS = {
  pg_sederhana  : 'PG Sederhana',
  pg_kompleks   : 'PG Kompleks',
  benar_salah   : 'Benar / Salah',
  isian_singkat : 'Isian Singkat',
  menjodohkan   : 'Menjodohkan',
};

/* ============================================================
   PARSER JSON
============================================================ */

function parseJSON(raw) {
  const text = raw.trim();
  // Bersihkan code fence kalau ada
  const cleaned = text
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/```\s*$/i, '')
    .trim();

  let parsed = JSON.parse(cleaned); // throw jika invalid

  // Support dua format: array langsung atau {questions:[...]}
  if (Array.isArray(parsed)) return parsed;
  if (Array.isArray(parsed.questions)) return parsed.questions;
  if (Array.isArray(parsed.items))     return parsed.items;
  throw new Error('Format JSON tidak dikenali. Harap pastikan berupa array soal.');
}

/* ============================================================
   PARSER CSV
   Kolom: Nomor,Tipe,Soal,Pernyataan,Tabel Benar-Salah,
          Pasangan,Opsi A,Opsi B,Opsi C,Opsi D,Opsi E,Kunci
============================================================ */

function parseCSV(raw) {
  const lines = raw.trim().split('\n');
  if (lines.length < 2) throw new Error('CSV kosong atau hanya header.');

  // Ambil header dari baris pertama
  const header = lines[0].split(',').map(h => h.replace(/"/g,'').trim().toLowerCase());

  const results = [];
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim()) continue;

    // Parse CSV dengan memperhatikan quoted fields
    const cols = [];
    let cur = '', inQ = false;
    for (let c = 0; c < line.length; c++) {
      if (line[c] === '"') { inQ = !inQ; }
      else if (line[c] === ',' && !inQ) { cols.push(cur); cur = ''; }
      else cur += line[c];
    }
    cols.push(cur);

    const get = (key) => {
      const idx = header.indexOf(key);
      return idx >= 0 ? (cols[idx] || '').trim() : '';
    };

    const opsiJawaban = ['opsi a','opsi b','opsi c','opsi d','opsi e']
      .map(k => get(k)).filter(Boolean);

    results.push({
      nomor          : parseInt(get('nomor')) || i,
      tipe           : get('tipe') || 'pg_sederhana',
      teks_soal      : get('soal'),
      opsi_jawaban   : opsiJawaban,
      pernyataan     : get('pernyataan') ? get('pernyataan').split(' | ').filter(Boolean) : [],
      tabel_benar_salah: get('tabel benar-salah') ? get('tabel benar-salah').split(' | ').filter(Boolean) : [],
      pasangan       : [], // CSV tidak support pasangan menjodohkan
      kunci_jawaban  : get('kunci'),
      gambar         : [],
    });
  }

  if (results.length === 0) throw new Error('Tidak ada baris data di CSV.');
  return results;
}

/* ============================================================
   NORMALIZE SOAL
============================================================ */

function normalizeSoal(q, idx) {
  return {
    nomor            : typeof q.nomor === 'number' ? q.nomor : (parseInt(q.nomor) || idx + 1),
    tipe             : q.tipe             || 'pg_sederhana',
    teks_soal        : String(q.teks_soal || q.soal || ''),
    opsi_jawaban     : Array.isArray(q.opsi_jawaban)   ? q.opsi_jawaban   : [],
    pernyataan       : Array.isArray(q.pernyataan)     ? q.pernyataan     : [],
    tabel_benar_salah: Array.isArray(q.tabel_benar_salah) ? q.tabel_benar_salah : [],
    pasangan         : Array.isArray(q.pasangan)       ? q.pasangan.map(p => ({ kiri: String(p.kiri||''), kanan: String(p.kanan||'') })) : [],
    kunci_jawaban    : String(q.kunci_jawaban || q.kunciJawaban || ''),
    kunci_terverifikasi: Boolean(q.kunci_terverifikasi || q.kunciTerverifikasi),
    gambar           : Array.isArray(q.gambar) ? q.gambar : [],
  };
}

/* ============================================================
   BUILD FIRESTORE DOC
============================================================ */

function buildDoc(q, meta) {
  const gambarUrls = (q.gambar || [])
    .map(g => g.uploadedUrl || g.url || (g.dataUrl?.startsWith('https') ? g.dataUrl : null))
    .filter(Boolean);

  return {
    nomor            : q.nomor,
    soal             : q.teks_soal,
    tipe             : q.tipe,
    opsiJawaban      : q.opsi_jawaban,
    pernyataan       : q.pernyataan,
    tabelBenarSalah  : q.tabel_benar_salah,
    pasangan         : q.pasangan,
    kunciJawaban     : q.kunci_jawaban,
    kunciTerverifikasi: q.kunci_terverifikasi,
    gambarUrls,
    mataPelajaran    : meta.mataPelajaran,
    tingkatKelas     : meta.tingkatKelas,
    jenjang          : meta.jenjang,
    kategori         : meta.kategori,
    tags             : meta.tags,
    tingkatKesulitan : meta.tingkatKesulitan,
    pembahasan       : '',
    sumberFile       : meta.sumberFile,
    sumberAI         : meta.sumberAI,
    createdAt        : serverTimestamp(),
    createdBy        : auth.currentUser?.uid || null,
    status           : 'aktif',
  };
}

/* ============================================================
   KOMPONEN UTAMA
============================================================ */

export default function ImportHasilScanPage() {
  useTailwind(); // ← load Tailwind CSS otomatis

  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);

  React.useEffect(() => {
    const h = () => setIsMobile(window.innerWidth < 1024);
    window.addEventListener('resize', h);
    return () => window.removeEventListener('resize', h);
  }, []);

  // Input
  const [format,    setFormat]    = useState('json'); // 'json' | 'csv'
  const [rawInput,  setRawInput]  = useState('');
  const [sumberAI,  setSumberAI]  = useState('Gemini Canvas');

  // Parse result
  const [soalList,  setSoalList]  = useState([]);
  const [parseError,setParseError]= useState('');

  // Metadata
  const [mataPelajaran,    setMataPelajaran]    = useState('Matematika');
  const [tingkatKelas,     setTingkatKelas]     = useState('10');
  const [jenjang,          setJenjang]          = useState('SMA/MA');
  const [kategori,         setKategori]         = useState('');
  const [tags,             setTags]             = useState('');
  const [tingkatKesulitan, setTingkatKesulitan] = useState('sedang');
  const [sumberFile,       setSumberFile]       = useState('');

  // Save state
  const [saving,     setSaving]     = useState(false);
  const [saveResult, setSaveResult] = useState(null);
  const [saveLog,    setSaveLog]    = useState([]);

  // Hitung soal dengan gambar base64
  const soalDenganGambar = useMemo(() =>
    soalList.filter(q => (q.gambar||[]).some(g => g.dataUrl?.startsWith('data:image'))).length,
  [soalList]);

  /* ── Parse ── */
  const handleParse = useCallback(() => {
    setParseError('');
    setSoalList([]);
    setSaveResult(null);
    setSaveLog([]);
    if (!rawInput.trim()) { setParseError('Input kosong.'); return; }
    try {
      const raw = format === 'json' ? parseJSON(rawInput) : parseCSV(rawInput);
      const normalized = raw.map((q, i) => normalizeSoal(q, i));
      setSoalList(normalized);
    } catch (e) {
      setParseError(e.message);
    }
  }, [rawInput, format]);

  /* ── File upload ── */
  const handleFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.name.endsWith('.json')) setFormat('json');
    else if (file.name.endsWith('.csv')) setFormat('csv');
    const reader = new FileReader();
    reader.onload = ev => setRawInput(ev.target.result || '');
    reader.readAsText(file);
    setSumberFile(file.name);
  };

  /* ── Simpan ke Bank Soal ── */
  const handleSave = async () => {
    if (soalList.length === 0) return;
    setSaving(true);
    setSaveResult(null);
    const log = [];
    const addLog = (msg) => { log.push(msg); setSaveLog([...log]); };

    const meta = {
      mataPelajaran,
      tingkatKelas,
      jenjang,
      kategori,
      tags    : tags.split(',').map(t => t.trim()).filter(Boolean),
      tingkatKesulitan,
      sumberFile,
      sumberAI,
    };

    // Upload gambar base64 jika ada
    const soalProcessed = [...soalList];
    const toUpload = [];
    soalList.forEach((q, qi) => {
      (q.gambar || []).forEach((g, gi) => {
        if (g.dataUrl?.startsWith('data:image')) {
          toUpload.push({ key: `q${qi}-g${gi}-${Date.now()}`, dataUrl: g.dataUrl, qi, gi });
        }
      });
    });

    if (toUpload.length > 0) {
      addLog(`⏳ Upload ${toUpload.length} gambar ke Supabase...`);
      try {
        const resp = await fetch('/api/uploadBankSoalImages', {
          method : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body   : JSON.stringify({ images: toUpload.map(i => ({ key: i.key, dataUrl: i.dataUrl })) }),
        });
        const result = await resp.json();
        const urlMap = {};
        (result.uploaded || []).forEach(u => { urlMap[u.key] = u.url; });

        toUpload.forEach(({ key, qi, gi }) => {
          if (urlMap[key]) {
            const gambar = [...(soalProcessed[qi].gambar || [])];
            gambar[gi] = { ...gambar[gi], uploadedUrl: urlMap[key], dataUrl: null };
            soalProcessed[qi] = { ...soalProcessed[qi], gambar };
          }
        });

        addLog(`✅ ${result.uploadedCount || 0}/${toUpload.length} gambar berhasil diupload.`);
        if ((result.errors || []).length > 0) {
          addLog(`⚠️ ${result.errors.length} gambar gagal upload.`);
        }
      } catch (err) {
        addLog(`❌ Upload gambar gagal: ${err.message}. Melanjutkan tanpa gambar.`);
      }
    }

    // Tulis ke Firestore
    addLog(`📝 Menyimpan ${soalProcessed.length} soal ke Firestore...`);
    try {
      const CHUNK = 400; // writeBatch max 500 ops
      let saved = 0;
      for (let i = 0; i < soalProcessed.length; i += CHUNK) {
        const chunk = soalProcessed.slice(i, i + CHUNK);
        const batch = writeBatch(db);
        chunk.forEach(q => {
          const ref = doc(collection(db, BANK_SOAL_COLLECTION));
          batch.set(ref, buildDoc(q, meta));
        });
        await batch.commit();
        saved += chunk.length;
        addLog(`💾 ${saved}/${soalProcessed.length} soal tersimpan...`);
      }
      addLog(`🎉 Selesai! ${soalProcessed.length} soal berhasil masuk Bank Soal.`);
      setSaveResult({ success: true, count: soalProcessed.length });
    } catch (err) {
      addLog(`❌ Gagal simpan ke Firestore: ${err.message}`);
      setSaveResult({ success: false, error: err.message });
    } finally {
      setSaving(false);
    }
  };

  /* ============================================================
     RENDER
  ============================================================ */

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f8fafc' }}>
      <SidebarAdmin />
      <main style={{ flex: 1, marginLeft: isMobile ? 0 : 260, transition: 'margin-left .3s', minHeight: '100vh' }}>
        <div className="p-6 max-w-5xl mx-auto space-y-6">

          {/* Header */}
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Import Hasil Scan AI</h1>
            <p className="text-gray-500 text-sm mt-1">
              Paste hasil JSON / CSV dari Gemini, ChatGPT, Claude, atau tool AI lain → simpan ke Bank Soal.
            </p>
          </div>

          {/* Format selector + Source */}
          <div className="bg-white rounded-2xl border border-gray-200 p-5 space-y-4">
            <div className="flex flex-wrap gap-3 items-center">
              <span className="text-sm font-semibold text-gray-600">Format:</span>
              {['json','csv'].map(f => (
                <button key={f} onClick={() => setFormat(f)}
                  className={`px-4 py-2 rounded-lg text-sm font-bold border transition-all ${format === f ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-500 border-gray-300 hover:border-blue-400'}`}>
                  {f.toUpperCase()}
                  {f === 'json' && <span className="ml-1.5 text-[10px] font-normal opacity-70">Termasuk gambar</span>}
                  {f === 'csv'  && <span className="ml-1.5 text-[10px] font-normal opacity-70">Teks saja</span>}
                </button>
              ))}

              <div className="ml-auto flex items-center gap-2">
                <label className="text-sm text-gray-500">atau upload file:</label>
                <label className="cursor-pointer px-3 py-2 rounded-lg border border-gray-300 text-sm text-gray-600 hover:border-blue-400 bg-white">
                  📂 Pilih file
                  <input type="file" accept=".json,.csv" onChange={handleFile} className="hidden" />
                </label>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Sumber AI</label>
                <input type="text" value={sumberAI} onChange={e => setSumberAI(e.target.value)}
                  placeholder="mis: Gemini Canvas, ChatGPT, Claude..."
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Nama file sumber (opsional)</label>
                <input type="text" value={sumberFile} onChange={e => setSumberFile(e.target.value)}
                  placeholder="mis: TO TKA Matematika.pdf"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
            </div>

            {/* Textarea */}
            <div>
              <label className="text-xs text-gray-500 mb-1 block">
                Paste {format.toUpperCase()} di sini:
              </label>
              <textarea
                rows={10}
                value={rawInput}
                onChange={e => setRawInput(e.target.value)}
                placeholder={format === 'json'
                  ? '[\n  {\n    "nomor": 1,\n    "tipe": "pg_sederhana",\n    "teks_soal": "...",\n    ...\n  }\n]'
                  : 'Nomor,Tipe,Soal,Opsi A,Opsi B,Opsi C,Opsi D,Opsi E,Kunci\n1,pg_sederhana,"Soal...",A,B,C,D,E,A'}
                className="w-full border border-gray-300 rounded-xl px-3 py-3 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y"
              />
            </div>

            {parseError && (
              <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">
                ❌ {parseError}
              </div>
            )}

            <button onClick={handleParse}
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold">
              🔍 Parse & Preview
            </button>
          </div>

          {/* Preview */}
          {soalList.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-200 p-5 space-y-5">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                  <h2 className="font-bold text-gray-800 text-lg">Preview — {soalList.length} soal</h2>
                  {soalDenganGambar > 0 && (
                    <p className="text-xs text-blue-600 mt-0.5">
                      🖼️ {soalDenganGambar} soal mengandung gambar (akan diupload ke Supabase)
                    </p>
                  )}
                </div>
                <span className="text-xs text-gray-400">Scroll untuk lihat semua</span>
              </div>

              {/* Soal list (max 5 preview) */}
              <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
                {soalList.slice(0, 50).map((q, i) => (
                  <div key={i} className="border border-gray-100 rounded-xl p-3 bg-gray-50">
                    <div className="flex flex-wrap gap-1.5 mb-2">
                      <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-bold rounded-full">
                        Soal {q.nomor}
                      </span>
                      <span className={`px-2 py-0.5 text-xs font-bold rounded-full ${
                        q.tipe==='pg_sederhana'  ?'bg-sky-100 text-sky-700':
                        q.tipe==='pg_kompleks'   ?'bg-violet-100 text-violet-700':
                        q.tipe==='benar_salah'   ?'bg-amber-100 text-amber-700':
                        q.tipe==='isian_singkat' ?'bg-emerald-100 text-emerald-700':
                                                   'bg-rose-100 text-rose-700'
                      }`}>{TIPE_LABELS[q.tipe]||q.tipe}</span>
                      {(q.gambar||[]).some(g=>g.dataUrl?.startsWith('data:image')) && (
                        <span className="px-2 py-0.5 bg-purple-100 text-purple-700 text-xs rounded-full">🖼️ ada gambar</span>
                      )}
                      {q.kunci_jawaban && (
                        <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-xs rounded-full font-mono">
                          Kunci: {q.kunci_jawaban}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-700 line-clamp-2">
                      {q.teks_soal?.replace(/\$[^$]+\$/g,'[rumus]').replace(/\{\{GAMBAR[^}]*\}\}/gi,'[gambar]') || '(kosong)'}
                    </p>
                    {(q.opsi_jawaban||[]).length > 0 && (
                      <div className="mt-1 flex flex-wrap gap-1">
                        {q.opsi_jawaban.slice(0,5).map((opt, oi) => (
                          <span key={oi} className="text-xs text-gray-500 bg-white border border-gray-200 px-2 py-0.5 rounded">
                            {String.fromCharCode(65+oi)}. {opt.replace(/\$[^$]+\$/g,'[rumus]').slice(0,30)}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
                {soalList.length > 50 && (
                  <p className="text-center text-sm text-gray-400">...dan {soalList.length - 50} soal lainnya</p>
                )}
              </div>

              {/* Metadata form */}
              <div className="border-t border-gray-100 pt-5">
                <h3 className="font-semibold text-gray-700 mb-3 text-sm">Metadata Soal</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">Mata Pelajaran *</label>
                    <select value={mataPelajaran} onChange={e=>setMataPelajaran(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                      {DAFTAR_MAPEL.map(m=><option key={m}>{m}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">Jenjang</label>
                    <select value={jenjang} onChange={e=>setJenjang(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                      {DAFTAR_JENJANG.map(j=><option key={j}>{j}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">Kelas</label>
                    <select value={tingkatKelas} onChange={e=>setTingkatKelas(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                      {DAFTAR_KELAS.map(k=><option key={k} value={k}>Kelas {k}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">Kategori / Bab</label>
                    <input type="text" placeholder="mis: Fungsi Kuadrat" value={kategori} onChange={e=>setKategori(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">Kesulitan</label>
                    <select value={tingkatKesulitan} onChange={e=>setTingkatKesulitan(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                      {DAFTAR_KESULITAN.map(k=><option key={k} value={k}>{k.charAt(0).toUpperCase()+k.slice(1)}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">Tags (pisah koma)</label>
                    <input type="text" placeholder="UTBK, TKA, Try Out" value={tags} onChange={e=>setTags(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                </div>
              </div>

              {/* Log */}
              {saveLog.length > 0 && (
                <div className="bg-gray-900 rounded-xl p-4 font-mono text-xs space-y-1 max-h-40 overflow-y-auto">
                  {saveLog.map((l, i) => <div key={i} className="text-green-400">{l}</div>)}
                </div>
              )}

              {/* Result */}
              {saveResult && (
                <div className={`rounded-xl px-4 py-3 text-sm font-medium ${saveResult.success ? 'bg-green-50 border border-green-200 text-green-700' : 'bg-red-50 border border-red-200 text-red-700'}`}>
                  {saveResult.success
                    ? `✅ ${saveResult.count} soal berhasil disimpan ke Bank Soal Gemilang!`
                    : `❌ Gagal: ${saveResult.error}`}
                </div>
              )}

              {/* Save button */}
              {!saveResult?.success && (
                <div className="flex justify-end">
                  <button onClick={handleSave} disabled={saving}
                    className="px-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-sm font-bold flex items-center gap-2 disabled:opacity-50">
                    {saving ? '⏳ Menyimpan...' : `💾 Simpan ${soalList.length} Soal ke Bank Soal`}
                  </button>
                </div>
              )}
            </div>
          )}

        </div>
      </main>
    </div>
  );
}