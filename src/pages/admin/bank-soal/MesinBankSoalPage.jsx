// src/pages/admin/bank-soal/MesinBankSoalPage.jsx
// Rombakan impor + perapihan bank soal:
// 1) Impor JSON hasil AI / scan → auto-tag jenjang, kelas, mapel, bab, capaian
// 2) Rapikan soal yang sudah terlanjur upload (scan ulang metadata)
// 3) Preview kelompok rapi sebelum simpan
import React, { useMemo, useState } from 'react';
import SidebarAdmin from '../../../components/SidebarAdmin';
import { db } from '../../../firebase';
import {
  collection, getDocs, writeBatch, doc, serverTimestamp, query, limit,
} from 'firebase/firestore';
import {
  Upload, RefreshCw, Sparkles, Save, FolderTree, AlertTriangle, CheckCircle2, Search,
} from 'lucide-react';
import {
  tryParseJson,
  validateAndNormalizeBatch,
  sanitizeRawJsonText,
  parseAndValidateBankSoalJson,
} from '../../../utils/bankSoalSanitizer';
import {
  deteksiTaksonomiSoal,
  terapkanTaksonomi,
  kelompokkanSoal,
  KATALOG_MAPEL,
} from '../../../utils/mesinTaksonomiSoal';
import {
  tautkanStimulusBersama,
  ringkasKartuSoal,
  PROMPT_IDENTITAS_SOAL_AI,
} from '../../../utils/mesinIdentitasSoal';

const COL = 'bank_soal';
const BATCH_MAX = 400;

function ambilArraySoal(parsed) {
  if (!parsed) return [];
  if (Array.isArray(parsed)) return parsed;
  if (Array.isArray(parsed.soal)) return parsed.soal;
  if (Array.isArray(parsed.questions)) return parsed.questions;
  if (Array.isArray(parsed.data)) return parsed.data;
  return [];
}

function keDokumenBank(soalNorm, taksonomi, meta) {
  const base = {
    nomor: soalNorm.nomor ?? null,
    tipe: soalNorm.tipe || 'pg_sederhana',
    teksSoal: soalNorm.teksSoal || soalNorm.soal || '',
    soal: soalNorm.teksSoal || soalNorm.soal || '',
    opsiJawaban: soalNorm.opsiJawaban || [],
    pernyataan: soalNorm.pernyataan || [],
    tabelBenarSalah: soalNorm.tabelBenarSalah || [],
    pasangan: soalNorm.pasangan || [],
    kunciJawaban: soalNorm.kunciJawaban || '',
    gambar: soalNorm.gambar || [],
    gambarUrls: (soalNorm.gambar || []).map((g) => (typeof g === 'string' ? g : g?.url)).filter(Boolean),
    bacaan: soalNorm.bacaan || null,
    stimulusGrup: soalNorm.stimulusGrup || soalNorm.bacaan?.grup || null,
    stimulusRentang: soalNorm.stimulusRentang || soalNorm.bacaan?.rentang || null,
    idLokal: soalNorm.idLokal || null,
    status: 'aktif',
    sumberFile: meta.fileName || '',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
  return terapkanTaksonomi(base, taksonomi, { force: true });
}

export default function MesinBankSoalPage() {
  const [isMobile] = useState(window.innerWidth < 1024);
  const [tab, setTab] = useState('impor'); // impor | rapikan
  const [modeKartu, setModeKartu] = useState(true);
  const [fileName, setFileName] = useState('');
  const [rawText, setRawText] = useState('');
  const [hint, setHint] = useState({
    mapel: '',
    jenjang: 'SMA',
    kelas: '12',
    kelompok: '',
    sumber: '',
  });
  const [preview, setPreview] = useState([]);
  const [pesan, setPesan] = useState('');
  const [busy, setBusy] = useState(false);
  const [progres, setProgres] = useState('');
  const [filterKey, setFilterKey] = useState('');

  const buckets = useMemo(() => kelompokkanSoal(preview), [preview]);
  const bucketsTampil = useMemo(() => {
    if (!filterKey) return buckets;
    const q = filterKey.toLowerCase();
    return buckets.filter((b) => b.key.toLowerCase().includes(q));
  }, [buckets, filterKey]);

  const ringkasYakin = useMemo(() => {
    if (!preview.length) return null;
    const avg = preview.reduce((a, s) => a + (s.taksonomiYakin || 0), 0) / preview.length;
    const rendah = preview.filter((s) => (s.taksonomiYakin || 0) < 0.45).length;
    return { avg: Math.round(avg * 100), rendah };
  }, [preview]);

  function prosesTeks(teks, namaFile) {
    setPesan('');
    const konteks = {
      fileName: namaFile || fileName || 'impor.json',
      mapel: hint.mapel,
      jenjang: hint.jenjang,
      kelas: hint.kelas,
      kelompok: hint.kelompok,
      sumber: hint.sumber || namaFile || fileName,
    };

    let daftar = [];
    const parsed = parseAndValidateBankSoalJson(teks);
    if (parsed?.success && Array.isArray(parsed.report?.hasil)) {
      daftar = parsed.report.hasil;
    } else {
      try {
        const raw = tryParseJson(sanitizeRawJsonText(teks));
        const arr = raw?.questions || ambilArraySoal(raw);
        daftar = Array.isArray(arr) ? arr : [];
      } catch {
        setPesan('❌ JSON tidak valid. ' + (parsed?.error || 'Perbaiki hasil scan AI.'));
        setPreview([]);
        return;
      }
    }

    if (!daftar.length) {
      setPesan('❌ Tidak menemukan soal di JSON. ' + (parsed?.error || ''));
      setPreview([]);
      return;
    }

    const hasil = daftar.map((norm, i) => {
      const item = norm.soal || norm.question || norm;
      const tak = deteksiTaksonomiSoal(item, konteks);
      if (hint.mapel) {
        tak.mapel = hint.mapel;
        tak.kodeMapel = KATALOG_MAPEL.find((m) => m.nama === hint.mapel)?.kode || tak.kodeMapel;
      }
      if (hint.jenjang) tak.jenjang = hint.jenjang;
      if (hint.kelas) tak.kelas = hint.kelas;
      if (hint.kelompok) tak.kelompok = hint.kelompok;
      const d = keDokumenBank(item, tak, { fileName: konteks.fileName });
      d._key = `new-${i}`;
      return d;
    });
    setPreview(tautkanStimulusBersama(hasil));
    setPesan(`✅ ${hasil.length} soal siap. Cek kelompok di bawah, lalu simpan.`);
  }

  async function onFile(e) {
    const f = e.target.files?.[0];
    if (!f) return;
    setFileName(f.name);
    const teks = await f.text();
    setRawText(teks);
    prosesTeks(teks, f.name);
  }

  async function simpanImpor() {
    if (!preview.length) return;
    setBusy(true);
    setProgres('Menyimpan…');
    try {
      let i = 0;
      while (i < preview.length) {
        const batch = writeBatch(db);
        const slice = preview.slice(i, i + BATCH_MAX);
        for (const s of slice) {
          const { _key, ...data } = s;
          const ref = doc(collection(db, COL));
          batch.set(ref, data);
        }
        await batch.commit();
        i += slice.length;
        setProgres(`Tersimpan ${Math.min(i, preview.length)}/${preview.length}`);
      }
      setPesan(`✅ ${preview.length} soal masuk bank_soal dengan taksonomi otomatis.`);
      setPreview([]);
      setRawText('');
    } catch (err) {
      console.error(err);
      setPesan(`❌ Gagal simpan: ${err.message}`);
    } finally {
      setBusy(false);
      setProgres('');
    }
  }

  /** Scan soal lama, isi metadata kosong */
  async function rapikanYangAda() {
    setBusy(true);
    setPesan('');
    setProgres('Mengambil soal dari bank…');
    try {
      const snap = await getDocs(query(collection(db, COL), limit(2000)));
      const semua = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setProgres(`Mendeteksi taksonomi ${semua.length} soal…`);

      const diubah = [];
      for (const s of semua) {
        const sudahLengkap = s.jenjang && (s.mapel || s.mataPelajaran) && (s.bab || s.topik) && s.kelompok;
        if (sudahLengkap && s.taksonomiAuto) continue;

        const tak = deteksiTaksonomiSoal(s, {
          fileName: s.sumberFile || s.sumber || '',
          mapel: s.mapel || s.mataPelajaran,
          jenjang: s.jenjang,
          kelas: s.kelas || s.tingkatKelas,
          kelompok: s.kelompok,
          sumber: s.sumber || s.sumberFile,
        });
        const merged = terapkanTaksonomi(s, tak, { force: false });
        // tandai perubahan
        const berubah =
          merged.jenjang !== s.jenjang ||
          merged.mapel !== s.mapel ||
          merged.mataPelajaran !== s.mataPelajaran ||
          merged.bab !== s.bab ||
          merged.kelompok !== s.kelompok ||
          merged.kelas !== s.kelas;
        if (berubah || !s.taksonomiAuto) {
          diubah.push({ ...merged, _key: s.id, id: s.id });
        }
      }

      setPreview(tautkanStimulusBersama(diubah));
      setPesan(
        diubah.length
          ? `🔍 ${diubah.length} dari ${semua.length} soal akan dirapikan (metadata kosong/tidak lengkap). Review lalu simpan.`
          : `✅ Semua ${semua.length} soal sudah punya metadata cukup. Tidak ada yang perlu diubah.`
      );
      setTab('impor'); // pakai preview yang sama
    } catch (err) {
      console.error(err);
      setPesan(`❌ Gagal scan: ${err.message}`);
    } finally {
      setBusy(false);
      setProgres('');
    }
  }

  async function simpanRapikan() {
    const punyaId = preview.filter((s) => s.id);
    if (!punyaId.length) {
      // berarti ini impor baru
      return simpanImpor();
    }
    setBusy(true);
    try {
      let i = 0;
      while (i < punyaId.length) {
        const batch = writeBatch(db);
        const slice = punyaId.slice(i, i + BATCH_MAX);
        for (const s of slice) {
          const { _key, id, ...data } = s;
          data.updatedAt = serverTimestamp();
          batch.set(doc(db, COL, id), data, { merge: true });
        }
        await batch.commit();
        i += slice.length;
        setProgres(`Update ${Math.min(i, punyaId.length)}/${punyaId.length}`);
      }
      setPesan(`✅ ${punyaId.length} soal lama diperbarui metadata-nya.`);
      setPreview([]);
    } catch (err) {
      setPesan(`❌ Gagal update: ${err.message}`);
    } finally {
      setBusy(false);
      setProgres('');
    }
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f8fafc' }}>
      <SidebarAdmin />
      <main
        style={{
          flex: 1,
          marginLeft: isMobile ? 0 : 260,
          padding: isMobile ? '70px 14px 32px' : '24px 28px',
          boxSizing: 'border-box',
        }}
      >
        <h1 style={{ margin: '0 0 6px', fontSize: 20, fontWeight: 800, color: '#1e293b' }}>
          Mesin Bank Soal
        </h1>
        <p style={{ margin: '0 0 16px', color: '#64748b', fontSize: 13, lineHeight: 1.55, maxWidth: 720 }}>
          Satu pintu impor & perapihan. Sistem mendeteksi otomatis <b>jenjang, kelas, mapel, bab, sub-bab, capaian, kelompok</b>
          agar try out & latihan harian adaptif bisa jalan rapi. Soal yang sudah terlanjur upload bisa di-scan ulang tanpa hapus.
        </p>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
          <button type="button" style={tab === 'impor' ? st.tabOn : st.tabOff} onClick={() => setTab('impor')}>
            <Upload size={14} /> Impor baru
          </button>
          <button type="button" style={tab === 'rapikan' ? st.tabOn : st.tabOff} onClick={() => setTab('rapikan')}>
            <FolderTree size={14} /> Rapikan soal lama
          </button>
        </div>

        {tab === 'rapikan' && (
          <div style={st.card}>
            <p style={{ margin: '0 0 12px', fontSize: 13, color: '#475569', lineHeight: 1.55 }}>
              Mesin membaca koleksi <code>bank_soal</code>, mengisi field kosong (jenjang/mapel/bab/kelompok),
              <b> tanpa menghapus</b> soal atau menimpa field yang sudah terisi manual.
            </p>
            <button type="button" style={st.btnPrimary} disabled={busy} onClick={rapikanYangAda}>
              <RefreshCw size={14} /> {busy ? 'Memproses…' : 'Scan & deteksi soal lama'}
            </button>
          </div>
        )}

        {tab === 'impor' && (
          <div style={st.card}>
            <div style={st.hintGrid}>
              <label style={st.label}>
                Mapel (opsional — kosongkan = auto)
                <select
                  style={st.input}
                  value={hint.mapel}
                  onChange={(e) => setHint({ ...hint, mapel: e.target.value })}
                >
                  <option value="">— deteksi otomatis —</option>
                  {KATALOG_MAPEL.map((m) => (
                    <option key={m.kode} value={m.nama}>{m.nama}</option>
                  ))}
                </select>
              </label>
              <label style={st.label}>
                Jenjang
                <select style={st.input} value={hint.jenjang} onChange={(e) => setHint({ ...hint, jenjang: e.target.value })}>
                  <option value="">— auto —</option>
                  <option value="SD">SD</option>
                  <option value="SMP">SMP</option>
                  <option value="SMA">SMA</option>
                  <option value="SMK">SMK</option>
                </select>
              </label>
              <label style={st.label}>
                Kelas
                <input style={st.input} value={hint.kelas} onChange={(e) => setHint({ ...hint, kelas: e.target.value })} placeholder="12" />
              </label>
              <label style={st.label}>
                Kelompok
                <input style={st.input} value={hint.kelompok} onChange={(e) => setHint({ ...hint, kelompok: e.target.value })} placeholder="prediksi-tka / latihan / tryout" />
              </label>
              <label style={{ ...st.label, gridColumn: '1 / -1' }}>
                Sumber / nama paket
                <input style={st.input} value={hint.sumber} onChange={(e) => setHint({ ...hint, sumber: e.target.value })} placeholder="09 Prediksi @my99dreams" />
              </label>
            </div>

            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 12, alignItems: 'center' }}>
              <label style={st.fileBtn}>
                <Upload size={14} /> Pilih file JSON
                <input type="file" accept=".json,.txt" style={{ display: 'none' }} onChange={onFile} />
              </label>
              {fileName && <span style={{ fontSize: 12, color: '#64748b' }}>{fileName}</span>}
              {rawText && (
                <button type="button" style={st.btnGhost} onClick={() => prosesTeks(rawText, fileName)}>
                  <Sparkles size={14} /> Proses ulang deteksi
                </button>
              )}
            </div>
            <p style={{ margin: '10px 0 0', fontSize: 12, color: '#94a3b8' }}>
              Format: JSON array soal (hasil scan AI). Field minimal: teksSoal, tipe, opsiJawaban, kunciJawaban.
            </p>
          </div>
        )}

        {pesan && (
          <div style={{
            ...st.alert,
            background: pesan.startsWith('❌') ? '#fef2f2' : '#ecfdf5',
            color: pesan.startsWith('❌') ? '#991b1b' : '#166534',
          }}
          >
            {pesan}
          </div>
        )}
        {progres && <div style={{ fontSize: 12, color: '#64748b', marginBottom: 8 }}>{progres}</div>}

        {preview.length > 0 && (
          <>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center', marginBottom: 12 }}>
              <div style={st.stat}>
                <b>{preview.length}</b> soal
              </div>
              {ringkasYakin && (
                <div style={st.stat}>
                  keyakinan auto <b>{ringkasYakin.avg}%</b>
                  {ringkasYakin.rendah > 0 && (
                    <span style={{ color: '#b45309', marginLeft: 6 }}>
                      <AlertTriangle size={12} style={{ verticalAlign: -2 }} /> {ringkasYakin.rendah} perlu cek
                    </span>
                  )}
                </div>
              )}
              <div style={{ flex: 1 }} />
              <div style={st.searchBox}>
                <Search size={14} color="#94a3b8" />
                <input
                  style={st.searchInput}
                  placeholder="Filter kelompok…"
                  value={filterKey}
                  onChange={(e) => setFilterKey(e.target.value)}
                />
              </div>
              <button
                type="button"
                style={st.btnPrimary}
                disabled={busy}
                onClick={() => (preview.some((s) => s.id) ? simpanRapikan() : simpanImpor())}
              >
                <Save size={14} /> {busy ? 'Menyimpan…' : 'Simpan ke bank soal'}
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {bucketsTampil.map((b) => (
                <div key={b.key} style={st.bucket}>
                  <div style={st.bucketHead}>
                    <FolderTree size={16} color="#4C6EF5" />
                    <span style={{ fontWeight: 700, color: '#1e293b', fontSize: 13 }}>{b.key}</span>
                    <span style={st.badge}>{b.jumlah} soal</span>
                  </div>
                  <div style={{ overflowX: 'auto' }}>
                    <div style={{ display: 'flex', gap: 8, marginBottom: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                      <button type="button" onClick={() => setModeKartu(true)} style={modeKartu ? st.tabOn : st.tabOff}>Kartu</button>
                      <button type="button" onClick={() => setModeKartu(false)} style={!modeKartu ? st.tabOn : st.tabOff}>Tabel</button>
                      <span style={{ fontSize: 11, color: '#94a3b8' }}>Badge 📖 = ada bacaan/stimulus bersama</span>
                    </div>
                    {modeKartu ? (
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 10, marginBottom: 12 }}>
                        {b.items.map((s, i) => {
                          const k = ringkasKartuSoal(s);
                          return (
                            <div key={s.idLokal || s.id || i} style={{
                              border: '1px solid #e2e8f0', borderRadius: 12, padding: 12, background: '#fff',
                              boxShadow: '0 1px 4px rgba(15,23,42,0.04)',
                            }}
                            >
                              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 6, marginBottom: 6 }}>
                                <span style={{ fontWeight: 800, color: '#4C6EF5', fontSize: 13 }}>No {k.nomor ?? '—'}</span>
                                <span style={{ fontSize: 10, fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>{k.tipe}</span>
                              </div>
                              <div style={{ fontSize: 12.5, color: '#1e293b', lineHeight: 1.45, minHeight: 56 }}>{k.preview}</div>
                              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 8 }}>
                                <span style={{ fontSize: 10, background: '#eef2ff', color: '#4338ca', padding: '2px 8px', borderRadius: 999 }}>{k.mapel}</span>
                                <span style={{ fontSize: 10, background: '#f1f5f9', color: '#475569', padding: '2px 8px', borderRadius: 999 }}>{k.jenjang}</span>
                                {k.punyaBacaan && (
                                  <span style={{ fontSize: 10, background: '#ecfdf5', color: '#047857', padding: '2px 8px', borderRadius: 999 }}>
                                    📖 {k.rentangLabel || 'bacaan'}
                                  </span>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                    <table style={st.table}>
                      <thead>
                        <tr>
                          <th style={st.th}>No</th>
                          <th style={st.th}>Tipe</th>
                          <th style={st.th}>Cuplikan</th>
                          <th style={st.th}>Level</th>
                          <th style={st.th}>Capaian</th>
                          <th style={st.th}>Yakin</th>
                        </tr>
                      </thead>
                      <tbody>
                        {b.items.slice(0, 8).map((s, idx) => (
                          <tr key={s._key || s.id || idx}>
                            <td style={st.td}>{s.nomor ?? idx + 1}</td>
                            <td style={st.td}><code style={{ fontSize: 11 }}>{s.tipe}</code></td>
                            <td style={{ ...st.td, maxWidth: 320 }}>
                              {String(s.teksSoal || s.soal || '').slice(0, 100)}
                              {String(s.teksSoal || '').length > 100 ? '…' : ''}
                            </td>
                            <td style={st.td}>{s.level || '—'}</td>
                            <td style={st.td}>{Array.isArray(s.capaian) ? s.capaian.join(', ') : '—'}</td>
                            <td style={st.td}>
                              <span style={{
                                fontWeight: 700,
                                color: (s.taksonomiYakin || 0) < 0.45 ? '#b45309' : '#166534',
                              }}
                              >
                                {Math.round((s.taksonomiYakin || 0) * 100)}%
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    )}
                    {b.items.length > 8 && (
                      <div style={{ fontSize: 11, color: '#94a3b8', padding: '6px 10px' }}>
                        +{b.items.length - 8} soal lain di kelompok ini
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {!preview.length && tab === 'impor' && (
          <div style={{ ...st.card, textAlign: 'center', color: '#94a3b8', padding: 32 }}>
            <CheckCircle2 size={28} style={{ marginBottom: 8, opacity: 0.5 }} />
            <div>Belum ada preview. Upload JSON hasil scan untuk mulai.</div>
          </div>
        )}
      </main>
    </div>
  );
}

const st = {
  card: {
    background: '#fff', borderRadius: 14, border: '1px solid #e2e8f0',
    padding: 16, marginBottom: 14, boxShadow: '0 1px 4px rgba(0,0,0,0.03)',
  },
  tabOn: {
    display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 14px',
    borderRadius: 10, border: 'none', background: '#4C6EF5', color: '#fff',
    fontWeight: 700, fontSize: 13, cursor: 'pointer',
  },
  tabOff: {
    display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 14px',
    borderRadius: 10, border: '1px solid #e2e8f0', background: '#fff', color: '#475569',
    fontWeight: 700, fontSize: 13, cursor: 'pointer',
  },
  hintGrid: {
    display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 10,
  },
  label: { display: 'flex', flexDirection: 'column', gap: 4, fontSize: 11, fontWeight: 700, color: '#64748b' },
  input: {
    border: '1px solid #cbd5e1', borderRadius: 8, padding: '8px 10px', fontSize: 13,
    fontWeight: 500, color: '#1e293b', background: '#fff',
  },
  fileBtn: {
    display: 'inline-flex', alignItems: 'center', gap: 6, background: '#eef2ff', color: '#4338ca',
    borderRadius: 10, padding: '9px 14px', fontWeight: 700, fontSize: 13, cursor: 'pointer',
  },
  btnPrimary: {
    display: 'inline-flex', alignItems: 'center', gap: 6, background: '#4C6EF5', color: '#fff',
    border: 'none', borderRadius: 10, padding: '9px 14px', fontWeight: 700, fontSize: 13, cursor: 'pointer',
  },
  btnGhost: {
    display: 'inline-flex', alignItems: 'center', gap: 6, background: '#f1f5f9', color: '#334155',
    border: 'none', borderRadius: 10, padding: '8px 12px', fontWeight: 700, fontSize: 12, cursor: 'pointer',
  },
  alert: { borderRadius: 10, padding: '10px 14px', marginBottom: 12, fontSize: 13, fontWeight: 600 },
  stat: {
    background: '#fff', border: '1px solid #e2e8f0', borderRadius: 10, padding: '6px 12px', fontSize: 12, color: '#475569',
  },
  searchBox: {
    display: 'flex', alignItems: 'center', gap: 6, background: '#fff', border: '1px solid #e2e8f0',
    borderRadius: 8, padding: '6px 10px',
  },
  searchInput: { border: 'none', outline: 'none', fontSize: 12, width: 140 },
  bucket: {
    background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, overflow: 'hidden',
  },
  bucketHead: {
    display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px', background: '#f8fafc',
    borderBottom: '1px solid #e2e8f0',
  },
  badge: {
    marginLeft: 'auto', background: '#eef2ff', color: '#4338ca', fontSize: 11, fontWeight: 800,
    borderRadius: 999, padding: '2px 8px',
  },
  table: { width: '100%', borderCollapse: 'collapse', fontSize: 12 },
  th: { textAlign: 'left', padding: '8px 10px', color: '#64748b', borderBottom: '1px solid #f1f5f9', fontWeight: 700 },
  td: { padding: '8px 10px', borderBottom: '1px solid #f8fafc', color: '#334155', verticalAlign: 'top' },
};