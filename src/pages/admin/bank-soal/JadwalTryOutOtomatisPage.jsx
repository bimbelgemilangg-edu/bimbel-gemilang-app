// src/pages/admin/bank-soal/JadwalTryOutOtomatisPage.jsx
// Atur template try out otomatis (komposisi mapel, 2×/minggu per jenjang)
// dan generate paket minggu ini dari bank soal.
import React, { useEffect, useState } from 'react';
import SidebarAdmin from '../../../components/SidebarAdmin';
import { db } from '../../../firebase';
import {
  collection, getDocs, addDoc, updateDoc, deleteDoc, doc, serverTimestamp,
} from 'firebase/firestore';
import {
  Calendar, Plus, Trash2, Save, Play, RefreshCw, Sparkles, Clock,
} from 'lucide-react';
import {
  COL_TEMPLATE,
  DEFAULT_TEMPLATE_SMA,
  generateMingguIniUntukTemplate,
  hitungSlotMingguIni,
} from '../../../utils/mesinTryOutOtomatis';
import { KATALOG_MAPEL } from '../../../utils/mesinTaksonomiSoal';

const HARI = [
  { v: 1, l: 'Sen' }, { v: 2, l: 'Sel' }, { v: 3, l: 'Rab' },
  { v: 4, l: 'Kam' }, { v: 5, l: 'Jum' }, { v: 6, l: 'Sab' }, { v: 0, l: 'Min' },
];

const kosongTemplate = () => ({
  ...DEFAULT_TEMPLATE_SMA,
  nama: 'Try Out Otomatis',
  komposisi: [
    { mapel: 'Bahasa Inggris', jumlah: 30 },
    { mapel: 'Bahasa Indonesia', jumlah: 20 },
    { mapel: 'Matematika', jumlah: 15 },
  ],
  hariDalamMinggu: [1, 4],
});

export default function JadwalTryOutOtomatisPage() {
  const [isMobile] = useState(window.innerWidth < 1024);
  const [templates, setTemplates] = useState([]);
  const [edit, setEdit] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [pesan, setPesan] = useState('');
  const [logGenerate, setLogGenerate] = useState([]);

  async function muat() {
    setLoading(true);
    try {
      const snap = await getDocs(collection(db, COL_TEMPLATE));
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setTemplates(list);
    } catch (e) {
      setPesan('❌ Gagal muat template: ' + e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { muat(); }, []);

  function mulaiBaru() {
    setEdit({ ...kosongTemplate(), _baru: true });
  }

  function ubahKomposisi(idx, field, value) {
    setEdit((prev) => {
      const komposisi = [...(prev.komposisi || [])];
      komposisi[idx] = { ...komposisi[idx], [field]: field === 'jumlah' ? Number(value) || 0 : value };
      return { ...prev, komposisi };
    });
  }

  function tambahBarisKomposisi() {
    setEdit((prev) => ({
      ...prev,
      komposisi: [...(prev.komposisi || []), { mapel: 'Bahasa Inggris', jumlah: 10 }],
    }));
  }

  function hapusBarisKomposisi(idx) {
    setEdit((prev) => ({
      ...prev,
      komposisi: (prev.komposisi || []).filter((_, i) => i !== idx),
    }));
  }

  function toggleHari(v) {
    setEdit((prev) => {
      const set = new Set(prev.hariDalamMinggu || []);
      if (set.has(v)) set.delete(v);
      else set.add(v);
      return { ...prev, hariDalamMinggu: [...set].sort((a, b) => (a === 0 ? 7 : a) - (b === 0 ? 7 : b)) };
    });
  }

  async function simpanTemplate() {
    if (!edit?.nama?.trim()) return setPesan('Nama template wajib.');
    if (!(edit.komposisi || []).length) return setPesan('Minimal 1 baris komposisi mapel.');
    setBusy(true);
    try {
      const payload = {
        nama: edit.nama.trim(),
        jenjang: edit.jenjang || 'SMA',
        kelas: edit.kelas || '',
        targetKelas: edit.targetKelas || ['Semua'],
        targetKategori: edit.targetKategori || ['Semua'],
        komposisi: edit.komposisi || [],
        hariDalamMinggu: edit.hariDalamMinggu || [1, 4],
        jamBuka: edit.jamBuka || '07:00',
        durasiTotalMenit: Number(edit.durasiTotalMenit) || 90,
        modeTimer: edit.modeTimer || 'total',
        antiCheatAktif: edit.antiCheatAktif !== false,
        wajibKamera: !!edit.wajibKamera,
        aktif: edit.aktif !== false,
        updatedAt: serverTimestamp(),
      };
      if (edit._baru || !edit.id) {
        payload.createdAt = serverTimestamp();
        await addDoc(collection(db, COL_TEMPLATE), payload);
      } else {
        await updateDoc(doc(db, COL_TEMPLATE, edit.id), payload);
      }
      setPesan('✅ Template disimpan.');
      setEdit(null);
      await muat();
    } catch (e) {
      setPesan('❌ ' + e.message);
    } finally {
      setBusy(false);
    }
  }

  async function hapusTemplate(t) {
    if (!window.confirm(`Hapus template "${t.nama}"?`)) return;
    await deleteDoc(doc(db, COL_TEMPLATE, t.id));
    await muat();
  }

  async function generateSatu(t) {
    setBusy(true);
    setLogGenerate([]);
    setPesan('');
    try {
      const hasil = await generateMingguIniUntukTemplate(t);
      setLogGenerate(hasil.map((h) => {
        if (h.skipped) return `⏭️ ${h.judul} — ${h.alasan}`;
        if (!h.ok) return `❌ ${h.error}`;
        return `✅ ${h.judul} (${h.totalSoal} soal)`;
      }));
      setPesan(`Selesai generate untuk "${t.nama}".`);
    } catch (e) {
      setPesan('❌ ' + e.message);
    } finally {
      setBusy(false);
    }
  }

  async function generateSemua() {
    const aktif = templates.filter((t) => t.aktif !== false);
    if (!aktif.length) return setPesan('Tidak ada template aktif.');
    setBusy(true);
    setLogGenerate([]);
    try {
      const logs = [];
      for (const t of aktif) {
        const hasil = await generateMingguIniUntukTemplate(t);
        for (const h of hasil) {
          if (h.skipped) logs.push(`⏭️ [${t.nama}] ${h.judul} — ${h.alasan}`);
          else if (!h.ok) logs.push(`❌ [${t.nama}] ${h.error}`);
          else logs.push(`✅ [${t.nama}] ${h.judul} (${h.totalSoal} soal)`);
        }
      }
      setLogGenerate(logs);
      setPesan('Generate semua template aktif selesai.');
    } catch (e) {
      setPesan('❌ ' + e.message);
    } finally {
      setBusy(false);
    }
  }

  const previewSlot = edit
    ? hitungSlotMingguIni(edit.hariDalamMinggu || [1, 4], edit.jamBuka || '07:00', edit.durasiTotalMenit || 90)
    : [];

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f8fafc' }}>
      <SidebarAdmin />
      <main style={{
        flex: 1,
        marginLeft: isMobile ? 0 : 260,
        padding: isMobile ? '70px 14px 32px' : '24px 28px',
      }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 8 }}>
          <h1 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: '#1e293b' }}>
            <Calendar size={22} style={{ verticalAlign: -4, marginRight: 8 }} />
            Try Out Otomatis
          </h1>
          <div style={{ flex: 1 }} />
          <button type="button" style={st.btnGhost} onClick={muat} disabled={busy}>
            <RefreshCw size={14} /> Refresh
          </button>
          <button type="button" style={st.btnPrimary} onClick={generateSemua} disabled={busy || !templates.length}>
            <Play size={14} /> Generate minggu ini (semua)
          </button>
          <button type="button" style={st.btnSecondary} onClick={mulaiBaru}>
            <Plus size={14} /> Template baru
          </button>
        </div>
        <p style={{ margin: '0 0 16px', color: '#64748b', fontSize: 13, maxWidth: 720, lineHeight: 1.55 }}>
          Atur komposisi soal per jenjang (contoh 30 BI · 20 BInd · 15 MTK), jadwal <b>2× per minggu</b>,
          lalu generate paket dari bank soal dengan rotasi otomatis. Siswa melihatnya di menu Try Out.
        </p>

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

        {logGenerate.length > 0 && (
          <div style={{ ...st.card, marginBottom: 14, fontSize: 12, fontFamily: 'ui-monospace, monospace' }}>
            {logGenerate.map((l, i) => <div key={i} style={{ marginBottom: 4 }}>{l}</div>)}
          </div>
        )}

        {/* Editor */}
        {edit && (
          <div style={{ ...st.card, marginBottom: 16, borderColor: '#c7d2fe' }}>
            <h3 style={{ margin: '0 0 12px', fontSize: 15 }}>
              {edit._baru ? 'Template baru' : 'Edit template'}
            </h3>
            <div style={st.grid}>
              <label style={st.label}>
                Nama
                <input style={st.input} value={edit.nama || ''} onChange={(e) => setEdit({ ...edit, nama: e.target.value })} />
              </label>
              <label style={st.label}>
                Jenjang
                <select style={st.input} value={edit.jenjang || 'SMA'} onChange={(e) => setEdit({ ...edit, jenjang: e.target.value })}>
                  <option>SD</option><option>SMP</option><option>SMA</option><option>SMK</option>
                </select>
              </label>
              <label style={st.label}>
                Kelas (opsional filter bank)
                <input style={st.input} value={edit.kelas || ''} onChange={(e) => setEdit({ ...edit, kelas: e.target.value })} placeholder="12" />
              </label>
              <label style={st.label}>
                Jam buka
                <input style={st.input} type="time" value={edit.jamBuka || '07:00'} onChange={(e) => setEdit({ ...edit, jamBuka: e.target.value })} />
              </label>
              <label style={st.label}>
                Durasi (menit)
                <input style={st.input} type="number" value={edit.durasiTotalMenit || 90} onChange={(e) => setEdit({ ...edit, durasiTotalMenit: Number(e.target.value) })} />
              </label>
            </div>

            <div style={{ marginTop: 12 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#64748b', marginBottom: 6 }}>Hari dalam minggu</div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {HARI.map((h) => (
                  <button
                    key={h.v}
                    type="button"
                    onClick={() => toggleHari(h.v)}
                    style={{
                      ...st.chip,
                      background: (edit.hariDalamMinggu || []).includes(h.v) ? '#4C6EF5' : '#f1f5f9',
                      color: (edit.hariDalamMinggu || []).includes(h.v) ? '#fff' : '#475569',
                    }}
                  >
                    {h.l}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ marginTop: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: 8 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#64748b' }}>Komposisi soal</div>
                <button type="button" style={{ ...st.btnGhost, marginLeft: 'auto' }} onClick={tambahBarisKomposisi}>
                  <Plus size={12} /> Mapel
                </button>
              </div>
              {(edit.komposisi || []).map((row, idx) => (
                <div key={idx} style={{ display: 'flex', gap: 8, marginBottom: 8, flexWrap: 'wrap' }}>
                  <select
                    style={{ ...st.input, flex: '1 1 180px' }}
                    value={row.mapel}
                    onChange={(e) => ubahKomposisi(idx, 'mapel', e.target.value)}
                  >
                    {KATALOG_MAPEL.map((m) => (
                      <option key={m.kode} value={m.nama}>{m.nama}</option>
                    ))}
                  </select>
                  <input
                    style={{ ...st.input, width: 80 }}
                    type="number"
                    min={1}
                    value={row.jumlah}
                    onChange={(e) => ubahKomposisi(idx, 'jumlah', e.target.value)}
                  />
                  <input
                    style={{ ...st.input, flex: '1 1 120px' }}
                    placeholder="Bab (opsional)"
                    value={row.bab || ''}
                    onChange={(e) => ubahKomposisi(idx, 'bab', e.target.value)}
                  />
                  <button type="button" style={st.iconDanger} onClick={() => hapusBarisKomposisi(idx)}>
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
              <div style={{ fontSize: 12, color: '#64748b' }}>
                Total: <b>{(edit.komposisi || []).reduce((a, r) => a + (Number(r.jumlah) || 0), 0)}</b> soal
              </div>
            </div>

            {previewSlot.length > 0 && (
              <div style={{ marginTop: 12, fontSize: 12, color: '#475569' }}>
                <Clock size={12} style={{ verticalAlign: -2 }} /> Slot minggu ini:{' '}
                {previewSlot.map((s) => s.label).join(' · ')}
              </div>
            )}

            <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
              <button type="button" style={st.btnPrimary} disabled={busy} onClick={simpanTemplate}>
                <Save size={14} /> Simpan template
              </button>
              <button type="button" style={st.btnGhost} onClick={() => setEdit(null)}>Batal</button>
            </div>
          </div>
        )}

        {/* List templates */}
        {loading ? (
          <p style={{ color: '#94a3b8' }}>Memuat…</p>
        ) : templates.length === 0 ? (
          <div style={{ ...st.card, textAlign: 'center', color: '#94a3b8' }}>
            Belum ada template. Buat satu (contoh SMA: 30 BI + 20 BInd + 15 MTK, Senin & Kamis).
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {templates.map((t) => (
              <div key={t.id} style={st.card}>
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'flex-start' }}>
                  <div style={{ flex: 1, minWidth: 200 }}>
                    <div style={{ fontWeight: 800, color: '#1e293b', fontSize: 14 }}>
                      {t.nama}
                      {t.aktif === false && <span style={{ ...st.badge, background: '#fee2e2', color: '#b91c1c' }}>nonaktif</span>}
                    </div>
                    <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>
                      {t.jenjang}{t.kelas ? ` · kelas ${t.kelas}` : ''} ·{' '}
                      {(t.hariDalamMinggu || []).map((h) => HARI.find((x) => x.v === h)?.l || h).join(', ')} ·{' '}
                      {t.jamBuka || '07:00'} · {t.durasiTotalMenit || 90} menit
                    </div>
                    <div style={{ fontSize: 12, color: '#475569', marginTop: 6 }}>
                      {(t.komposisi || []).map((r, i) => (
                        <span key={i} style={st.badge}>{r.jumlah} {r.mapel}{r.bab ? ` (${r.bab})` : ''}</span>
                      ))}
                    </div>
                  </div>
                  <button type="button" style={st.btnPrimary} disabled={busy} onClick={() => generateSatu(t)}>
                    <Sparkles size={14} /> Generate minggu ini
                  </button>
                  <button type="button" style={st.btnGhost} onClick={() => setEdit({ ...t })}>Edit</button>
                  <button type="button" style={st.iconDanger} onClick={() => hapusTemplate(t)}>
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

const st = {
  card: {
    background: '#fff', borderRadius: 14, border: '1px solid #e2e8f0', padding: 14,
    boxShadow: '0 1px 4px rgba(0,0,0,0.03)',
  },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 10 },
  label: { display: 'flex', flexDirection: 'column', gap: 4, fontSize: 11, fontWeight: 700, color: '#64748b' },
  input: {
    border: '1px solid #cbd5e1', borderRadius: 8, padding: '8px 10px', fontSize: 13, color: '#1e293b', background: '#fff',
  },
  btnPrimary: {
    display: 'inline-flex', alignItems: 'center', gap: 6, background: '#4C6EF5', color: '#fff',
    border: 'none', borderRadius: 10, padding: '8px 12px', fontWeight: 700, fontSize: 12, cursor: 'pointer',
  },
  btnSecondary: {
    display: 'inline-flex', alignItems: 'center', gap: 6, background: '#eef2ff', color: '#4338ca',
    border: 'none', borderRadius: 10, padding: '8px 12px', fontWeight: 700, fontSize: 12, cursor: 'pointer',
  },
  btnGhost: {
    display: 'inline-flex', alignItems: 'center', gap: 6, background: '#f1f5f9', color: '#334155',
    border: 'none', borderRadius: 10, padding: '8px 12px', fontWeight: 700, fontSize: 12, cursor: 'pointer',
  },
  iconDanger: {
    width: 34, height: 34, borderRadius: 8, border: '1px solid #fecaca', background: '#fff',
    color: '#ef4444', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  chip: {
    border: 'none', borderRadius: 8, padding: '6px 10px', fontWeight: 700, fontSize: 12, cursor: 'pointer',
  },
  badge: {
    display: 'inline-block', background: '#eef2ff', color: '#4338ca', borderRadius: 999,
    padding: '2px 8px', fontSize: 11, fontWeight: 700, marginRight: 4, marginBottom: 4,
  },
  alert: { borderRadius: 10, padding: '10px 14px', marginBottom: 12, fontSize: 13, fontWeight: 600 },
};