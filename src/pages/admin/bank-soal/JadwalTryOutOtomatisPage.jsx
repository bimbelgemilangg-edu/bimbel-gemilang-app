// Hybrid: sistem pilih soal → draf → admin TERBITKAN (wajib).
// Admin atur rules saja, tidak mengedit isi soal.
import React, { useCallback, useEffect, useState } from 'react';
import SidebarAdmin from '../../../components/SidebarAdmin';
import { db } from '../../../firebase';
import {
  collection, getDocs, addDoc, updateDoc, deleteDoc, doc, serverTimestamp, query, where,
} from 'firebase/firestore';
import {
  Calendar, Plus, Trash2, Save, Play, RefreshCw, Sparkles, Send, EyeOff, Settings2,
} from 'lucide-react';
import {
  COL_TEMPLATE,
  COL_PAKET,
  DEFAULT_TEMPLATE_SMA,
  siapkanDrafMingguIni,
  terbitkanDraf,
  nonaktifkanPaket,
  hitungSlotMingguIni,
} from '../../../utils/mesinTryOutOtomatis';
import { KATALOG_MAPEL } from '../../../utils/mesinTaksonomiSoal';

const HARI = [
  { v: 1, l: 'Sen' }, { v: 2, l: 'Sel' }, { v: 3, l: 'Rab' },
  { v: 4, l: 'Kam' }, { v: 5, l: 'Jum' }, { v: 6, l: 'Sab' }, { v: 0, l: 'Min' },
];

const kosong = () => ({
  ...DEFAULT_TEMPLATE_SMA,
  nama: 'Try Out Otomatis',
  komposisi: [
    { mapel: 'Bahasa Inggris', jumlah: 30, durasiMenit: 35 },
    { mapel: 'Bahasa Indonesia', jumlah: 20, durasiMenit: 25 },
    { mapel: 'Matematika', jumlah: 15, durasiMenit: 20 },
  ],
  modeTimer: 'per-subtes',
  hariDalamMinggu: [1, 4],
  soalAcak: true,
  tampilkanPembahasan: true,
  antiCheatAktif: true,
  wajibKamera: false,
});

export default function JadwalTryOutOtomatisPage() {
  const [isMobile] = useState(window.innerWidth < 1024);
  const [templates, setTemplates] = useState([]);
  const [drafList, setDrafList] = useState([]);
  const [edit, setEdit] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [pesan, setPesan] = useState('');
  const [log, setLog] = useState([]);

  const muat = useCallback(async () => {
    setLoading(true);
    try {
      const [st, sp] = await Promise.all([
        getDocs(collection(db, COL_TEMPLATE)),
        getDocs(collection(db, COL_PAKET)),
      ]);
      setTemplates(st.docs.map((d) => ({ id: d.id, ...d.data() })));
      const paket = sp.docs.map((d) => ({ id: d.id, ...d.data() }));
      // draf + otomatis minggu ini
      const otomatis = paket
        .filter((p) => p.otomatis)
        .sort((a, b) => {
          const ta = new Date(a.waktuBuka || 0).getTime();
          const tb = new Date(b.waktuBuka || 0).getTime();
          return tb - ta;
        })
        .slice(0, 30);
      setDrafList(otomatis);
    } catch (e) {
      setPesan('❌ ' + e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { muat(); }, [muat]);

  function toggleHari(v) {
    setEdit((prev) => {
      const set = new Set(prev.hariDalamMinggu || []);
      if (set.has(v)) set.delete(v); else set.add(v);
      return { ...prev, hariDalamMinggu: [...set].sort((a, b) => (a === 0 ? 7 : a) - (b === 0 ? 7 : b)) };
    });
  }

  async function simpanTemplate() {
    if (!edit?.nama?.trim()) return setPesan('Nama wajib.');
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
        modeTimer: edit.modeTimer || 'per-subtes',
        antiCheatAktif: edit.antiCheatAktif !== false,
        wajibKamera: !!edit.wajibKamera,
        soalAcak: edit.soalAcak !== false,
        tampilkanPembahasan: edit.tampilkanPembahasan !== false,
        aktif: edit.aktif !== false,
        updatedAt: serverTimestamp(),
      };
      if (edit._baru || !edit.id) {
        payload.createdAt = serverTimestamp();
        await addDoc(collection(db, COL_TEMPLATE), payload);
      } else {
        await updateDoc(doc(db, COL_TEMPLATE, edit.id), payload);
      }
      setPesan('✅ Rules template disimpan.');
      setEdit(null);
      await muat();
    } catch (e) {
      setPesan('❌ ' + e.message);
    } finally {
      setBusy(false);
    }
  }

  async function siapkanDraf(t) {
    setBusy(true);
    setLog([]);
    try {
      const hasil = await siapkanDrafMingguIni(t, {
        soalAcak: t.soalAcak,
        antiCheatAktif: t.antiCheatAktif,
        wajibKamera: t.wajibKamera,
        tampilkanPembahasan: t.tampilkanPembahasan,
        durasiTotalMenit: t.durasiTotalMenit,
        modeTimer: t.modeTimer || 'per-subtes',
        jamBuka: t.jamBuka,
      });
      setLog(hasil.map((h) => {
        if (h.skipped) return `⏭️ ${h.judul} — ${h.alasan}`;
        if (!h.ok) return `❌ ${h.error}`;
        const pm = h.ringkas?.perMapel
          ? Object.entries(h.ringkas.perMapel).map(([k, v]) => `${v} ${k}`).join(', ')
          : '';
        return `📝 DRAF ${h.judul} · ${h.totalSoal} soal (${pm}) — belum tampil siswa`;
      }));
      setPesan('Draf disiapkan. Klik TERBITKAN agar siswa melihat.');
      await muat();
    } catch (e) {
      setPesan('❌ ' + e.message);
    } finally {
      setBusy(false);
    }
  }

  async function siapkanSemua() {
    const aktif = templates.filter((t) => t.aktif !== false);
    if (!aktif.length) return setPesan('Tidak ada template aktif.');
    setBusy(true);
    setLog([]);
    try {
      const logs = [];
      for (const t of aktif) {
        const hasil = await siapkanDrafMingguIni(t, {
          soalAcak: t.soalAcak,
          antiCheatAktif: t.antiCheatAktif,
          wajibKamera: t.wajibKamera,
          tampilkanPembahasan: t.tampilkanPembahasan,
          durasiTotalMenit: t.durasiTotalMenit,
          modeTimer: t.modeTimer || 'per-subtes',
          jamBuka: t.jamBuka,
        });
        for (const h of hasil) {
          if (h.skipped) logs.push(`⏭️ [${t.nama}] ${h.judul} — ${h.alasan}`);
          else if (!h.ok) logs.push(`❌ [${t.nama}] ${h.error}`);
          else logs.push(`📝 [${t.nama}] DRAF ${h.judul} · ${h.totalSoal} soal`);
        }
      }
      setLog(logs);
      setPesan('Semua draf siap. TERBITKAN satu per satu atau terbitkan semua draf.');
      await muat();
    } catch (e) {
      setPesan('❌ ' + e.message);
    } finally {
      setBusy(false);
    }
  }

  async function klikTerbitkan(paket) {
    if (!window.confirm(
      `Terbitkan "${paket.judul}"?\n\nSiswa akan melihat try out ini.\nIsi soal tetap dikunci sistem (tidak bisa diubah).`
    )) return;
    setBusy(true);
    try {
      await terbitkanDraf(paket.id, {
        soalAcak: paket.soalAcak,
        antiCheatAktif: paket.antiCheatAktif,
        wajibKamera: paket.wajibKamera,
        tampilkanPembahasan: paket.tampilkanPembahasan,
        durasiTotalMenit: paket.durasiTotalMenit,
      });
      setPesan(`✅ Diterbitkan: ${paket.judul}`);
      await muat();
    } catch (e) {
      setPesan('❌ ' + e.message);
    } finally {
      setBusy(false);
    }
  }

  async function terbitkanSemuaDraf() {
    const draf = drafList.filter((p) => p.status === 'draf');
    if (!draf.length) return setPesan('Tidak ada draf menunggu.');
    if (!window.confirm(`Terbitkan ${draf.length} draf sekaligus ke siswa?`)) return;
    setBusy(true);
    try {
      for (const p of draf) {
        await terbitkanDraf(p.id);
      }
      setPesan(`✅ ${draf.length} paket diterbitkan.`);
      await muat();
    } catch (e) {
      setPesan('❌ ' + e.message);
    } finally {
      setBusy(false);
    }
  }

  async function ubahRulesDraf(paket, field, value) {
    // Hanya rules, bukan daftarSoal
    try {
      await updateDoc(doc(db, COL_PAKET, paket.id), {
        [field]: value,
        updatedAt: serverTimestamp(),
      });
      await muat();
    } catch (e) {
      setPesan('❌ ' + e.message);
    }
  }

  const drafMenunggu = drafList.filter((p) => p.status === 'draf');
  const aktifList = drafList.filter((p) => p.status === 'aktif');

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f8fafc' }}>
      <SidebarAdmin />
      <main style={{
        flex: 1, marginLeft: isMobile ? 0 : 260,
        padding: isMobile ? '70px 14px 32px' : '24px 28px',
      }}
      >
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center', marginBottom: 8 }}>
          <h1 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: '#1e293b' }}>
            <Calendar size={22} style={{ verticalAlign: -4, marginRight: 8 }} />
            Try Out Otomatis
          </h1>
          <div style={{ flex: 1 }} />
          <button type="button" style={st.btnGhost} onClick={muat} disabled={busy}><RefreshCw size={14} /> Refresh</button>
          <button type="button" style={st.btnSecondary} onClick={siapkanSemua} disabled={busy || !templates.length}>
            <Play size={14} /> Siapkan draf minggu ini
          </button>
          <button type="button" style={st.btnPrimary} onClick={terbitkanSemuaDraf} disabled={busy || !drafMenunggu.length}>
            <Send size={14} /> Terbitkan semua draf ({drafMenunggu.length})
          </button>
          <button type="button" style={st.btnGhost} onClick={() => setEdit({ ...kosong(), _baru: true })}>
            <Plus size={14} /> Template rules
          </button>
        </div>

        <div style={st.infoBox}>
          <b>Model hybrid (disarankan):</b> sistem yang memilih & mengacak soal dari bank.
          Admin hanya mengatur <b>rules</b> (jam, kamera, acak, pembahasan, komposisi jumlah per mapel)
          lalu wajib klik <b>Terbitkan</b>. Tanpa terbit → try out <b>tidak muncul</b> di siswa hari itu.
          Isi soal tidak bisa diedit manual.
        </div>

        {pesan && (
          <div style={{
            ...st.alert,
            background: pesan.startsWith('❌') ? '#fef2f2' : '#ecfdf5',
            color: pesan.startsWith('❌') ? '#991b1b' : '#166534',
          }}
          >{pesan}
          </div>
        )}
        {log.length > 0 && (
          <div style={{ ...st.card, fontSize: 12, fontFamily: 'ui-monospace,monospace', marginBottom: 12 }}>
            {log.map((l, i) => <div key={i}>{l}</div>)}
          </div>
        )}

        {/* Editor rules template */}
        {edit && (
          <div style={{ ...st.card, borderColor: '#c7d2fe', marginBottom: 14 }}>
            <h3 style={{ margin: '0 0 10px', fontSize: 15, display: 'flex', alignItems: 'center', gap: 6 }}>
              <Settings2 size={16} /> Rules template (bukan isi soal)
            </h3>
            <div style={st.grid}>
              <label style={st.label}>Nama<input style={st.input} value={edit.nama || ''} onChange={(e) => setEdit({ ...edit, nama: e.target.value })} /></label>
              <label style={st.label}>Jenjang
                <select style={st.input} value={edit.jenjang || 'SMA'} onChange={(e) => setEdit({ ...edit, jenjang: e.target.value })}>
                  <option>SD</option><option>SMP</option><option>SMA</option><option>SMK</option>
                </select>
              </label>
              <label style={st.label}>Kelas filter bank<input style={st.input} value={edit.kelas || ''} onChange={(e) => setEdit({ ...edit, kelas: e.target.value })} placeholder="12" /></label>
              <label style={st.label}>Jam buka<input style={st.input} type="time" value={edit.jamBuka || '07:00'} onChange={(e) => setEdit({ ...edit, jamBuka: e.target.value })} /></label>
              <label style={st.label}>Durasi (menit)<input style={st.input} type="number" value={edit.durasiTotalMenit || 90} onChange={(e) => setEdit({ ...edit, durasiTotalMenit: Number(e.target.value) })} /></label>
              <label style={st.label}>Mode waktu
                <select style={st.input} value={edit.modeTimer || 'per-subtes'} onChange={(e) => setEdit({ ...edit, modeTimer: e.target.value })}>
                  <option value="per-subtes">Per mapel (disarankan — timer ketat)</option>
                  <option value="total">Total (satu timer seluruh TO)</option>
                </select>
              </label>
            </div>

            <div style={{ marginTop: 10, display: 'flex', flexWrap: 'wrap', gap: 12, fontSize: 13 }}>
              <label style={st.check}><input type="checkbox" checked={edit.soalAcak !== false} onChange={(e) => setEdit({ ...edit, soalAcak: e.target.checked })} /> Soal acak</label>
              <label style={st.check}><input type="checkbox" checked={edit.antiCheatAktif !== false} onChange={(e) => setEdit({ ...edit, antiCheatAktif: e.target.checked })} /> Anti-cheat</label>
              <label style={st.check}><input type="checkbox" checked={!!edit.wajibKamera} onChange={(e) => setEdit({ ...edit, wajibKamera: e.target.checked })} /> Wajib kamera</label>
              <label style={st.check}><input type="checkbox" checked={edit.tampilkanPembahasan !== false} onChange={(e) => setEdit({ ...edit, tampilkanPembahasan: e.target.checked })} /> Pembahasan setelah selesai</label>
            </div>

            <div style={{ marginTop: 12 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#64748b', marginBottom: 6 }}>Hari (2×/minggu disarankan)</div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {HARI.map((h) => (
                  <button key={h.v} type="button" onClick={() => toggleHari(h.v)} style={{
                    ...st.chip,
                    background: (edit.hariDalamMinggu || []).includes(h.v) ? '#4C6EF5' : '#f1f5f9',
                    color: (edit.hariDalamMinggu || []).includes(h.v) ? '#fff' : '#475569',
                  }}
                  >{h.l}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ marginTop: 12 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#64748b', marginBottom: 6 }}>
                Komposisi per mapel (jumlah soal + durasi menit)
              </div>
              <p style={{ fontSize: 11.5, color: '#64748b', margin: '0 0 8px', lineHeight: 1.45 }}>
                Disarankan mode <b>Per mapel</b>: mis. Matematika 15 soal · <b>20 menit</b>.
                Timer ketat mengurangi waktu siswa mencari jawaban di internet.
                Selesai satu mapel, tidak bisa kembali.
              </p>
              <div style={{ display: 'flex', gap: 8, marginBottom: 4, fontSize: 10, fontWeight: 700, color: '#94a3b8', paddingLeft: 2 }}>
                <span style={{ flex: '1 1 160px' }}>Mapel</span>
                <span style={{ width: 64 }}>Soal</span>
                <span style={{ width: 64 }}>Menit</span>
                <span style={{ width: 34 }} />
              </div>
              {(edit.komposisi || []).map((row, idx) => (
                <div key={idx} style={{ display: 'flex', gap: 8, marginBottom: 6, flexWrap: 'wrap', alignItems: 'center' }}>
                  <select style={{ ...st.input, flex: '1 1 160px' }} value={row.mapel} onChange={(e) => {
                    const komposisi = [...edit.komposisi];
                    komposisi[idx] = { ...row, mapel: e.target.value };
                    setEdit({ ...edit, komposisi });
                  }}
                  >
                    {KATALOG_MAPEL.map((m) => <option key={m.kode} value={m.nama}>{m.nama}</option>)}
                  </select>
                  <input style={{ ...st.input, width: 64 }} type="number" min={1} title="Jumlah soal" value={row.jumlah} onChange={(e) => {
                    const komposisi = [...edit.komposisi];
                    const jumlah = Number(e.target.value) || 0;
                    const autoDur = Math.max(10, Math.round(jumlah * 1.3));
                    komposisi[idx] = {
                      ...row,
                      jumlah,
                      durasiMenit: row.durasiMenit || autoDur,
                    };
                    setEdit({ ...edit, komposisi });
                  }}
                  />
                  <input style={{ ...st.input, width: 64 }} type="number" min={1} title="Durasi menit" value={row.durasiMenit ?? Math.max(10, Math.round((row.jumlah || 10) * 1.3))} onChange={(e) => {
                    const komposisi = [...edit.komposisi];
                    komposisi[idx] = { ...row, durasiMenit: Number(e.target.value) || 1 };
                    setEdit({ ...edit, komposisi });
                  }}
                  />
                  <button type="button" style={st.iconDanger} onClick={() => setEdit({
                    ...edit,
                    komposisi: edit.komposisi.filter((_, i) => i !== idx),
                  })}
                  ><Trash2 size={14} />
                  </button>
                </div>
              ))}
              <button type="button" style={st.btnGhost} onClick={() => setEdit({
                ...edit,
                komposisi: [...(edit.komposisi || []), { mapel: 'Bahasa Inggris', jumlah: 10, durasiMenit: 15 }],
              })}
              ><Plus size={12} /> Mapel
              </button>
              <div style={{ fontSize: 12, color: '#475569', marginTop: 8 }}>
                Total soal: <b>{(edit.komposisi || []).reduce((a, r) => a + (Number(r.jumlah) || 0), 0)}</b>
                {' · '}
                Total waktu mapel: <b>{(edit.komposisi || []).reduce((a, r) => a + (Number(r.durasiMenit) || Math.max(10, Math.round((r.jumlah || 0) * 1.3))), 0)}</b> menit
                {edit.modeTimer === 'per-subtes' ? ' (timer per mapel)' : ' (jika mode total, pakai durasi total di atas)'}
              </div>
            </div>

            <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
              <button type="button" style={st.btnPrimary} disabled={busy} onClick={simpanTemplate}><Save size={14} /> Simpan rules</button>
              <button type="button" style={st.btnGhost} onClick={() => setEdit(null)}>Batal</button>
            </div>
          </div>
        )}

        {/* Antrian draf — wajib terbit */}
        <h2 style={{ fontSize: 15, fontWeight: 800, color: '#1e293b', margin: '8px 0' }}>
          Antrian terbit ({drafMenunggu.length} draf)
        </h2>
        {drafMenunggu.length === 0 ? (
          <div style={{ ...st.card, color: '#94a3b8', fontSize: 13, marginBottom: 14 }}>
            Belum ada draf. Klik <b>Siapkan draf minggu ini</b> — sistem mengisi soal otomatis, status masih tersembunyi dari siswa.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
            {drafMenunggu.map((p) => (
              <div key={p.id} style={{ ...st.card, borderColor: '#fde68a', background: '#fffbeb' }}>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'flex-start' }}>
                  <div style={{ flex: 1, minWidth: 200 }}>
                    <div style={{ fontWeight: 800, fontSize: 14 }}>{p.judul}</div>
                    <div style={{ fontSize: 12, color: '#78716c', marginTop: 4 }}>
                      {p.totalSoal || p.ringkas?.total || 0} soal ·{' '}
                      {p.ringkas?.perMapel
                        ? Object.entries(p.ringkas.perMapel).map(([k, v]) => `${v} ${k}`).join(' · ')
                        : 'komposisi sistem'}
                      {' · '}buka {p.waktuBuka ? new Date(p.waktuBuka).toLocaleString('id-ID') : '—'}
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 8, fontSize: 12 }}>
                      <label style={st.check}>
                        <input type="checkbox" checked={!!p.soalAcak} onChange={(e) => ubahRulesDraf(p, 'soalAcak', e.target.checked)} /> Acak
                      </label>
                      <label style={st.check}>
                        <input type="checkbox" checked={!!p.antiCheatAktif} onChange={(e) => ubahRulesDraf(p, 'antiCheatAktif', e.target.checked)} /> Anti-cheat
                      </label>
                      <label style={st.check}>
                        <input type="checkbox" checked={!!p.wajibKamera} onChange={(e) => ubahRulesDraf(p, 'wajibKamera', e.target.checked)} /> Kamera
                      </label>
                      <label style={st.check}>
                        <input type="checkbox" checked={p.tampilkanPembahasan !== false} onChange={(e) => ubahRulesDraf(p, 'tampilkanPembahasan', e.target.checked)} /> Pembahasan
                      </label>
                      <span style={{ color: '#a8a29e' }}><EyeOff size={12} style={{ verticalAlign: -2 }} /> Isi soal terkunci</span>
                    </div>
                  </div>
                  <button type="button" style={st.btnPrimary} disabled={busy} onClick={() => klikTerbitkan(p)}>
                    <Send size={14} /> Terbitkan
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {aktifList.length > 0 && (
          <>
            <h2 style={{ fontSize: 15, fontWeight: 800, color: '#1e293b', margin: '8px 0' }}>Sudah live</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
              {aktifList.slice(0, 10).map((p) => (
                <div key={p.id} style={st.card}>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                    <div style={{ flex: 1, fontWeight: 700, fontSize: 13 }}>{p.judul}</div>
                    <span style={{ ...st.badge, background: '#dcfce7', color: '#166534' }}>aktif</span>
                    <button type="button" style={st.btnGhost} onClick={async () => {
                      await nonaktifkanPaket(p.id);
                      await muat();
                    }}
                    >Nonaktifkan
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        <h2 style={{ fontSize: 15, fontWeight: 800, color: '#1e293b', margin: '8px 0' }}>Template rules</h2>
        {loading ? <p style={{ color: '#94a3b8' }}>Memuat…</p> : templates.length === 0 ? (
          <div style={{ ...st.card, color: '#94a3b8', fontSize: 13 }}>Belum ada template. Buat rules dulu.</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {templates.map((t) => (
              <div key={t.id} style={st.card}>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'flex-start' }}>
                  <div style={{ flex: 1, minWidth: 180 }}>
                    <div style={{ fontWeight: 800, fontSize: 14 }}>{t.nama}</div>
                    <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>
                      {t.jenjang} · {(t.hariDalamMinggu || []).map((h) => HARI.find((x) => x.v === h)?.l).join(', ')} · {t.jamBuka} · {t.durasiTotalMenit} mnt
                      {' · '}{t.soalAcak !== false ? 'acak' : 'urut'} · {t.wajibKamera ? 'kamera' : 'tanpa kamera'}
                    </div>
                    <div style={{ marginTop: 6 }}>
                      {(t.komposisi || []).map((r, i) => (
                        <span key={i} style={st.badge}>{r.jumlah} {r.mapel} · {r.durasiMenit || "?"} mnt</span>
                      ))}
                    </div>
                  </div>
                  <button type="button" style={st.btnSecondary} disabled={busy} onClick={() => siapkanDraf(t)}>
                    <Sparkles size={14} /> Siapkan draf
                  </button>
                  <button type="button" style={st.btnGhost} onClick={() => setEdit({ ...t })}>Edit rules</button>
                  <button type="button" style={st.iconDanger} onClick={async () => {
                    if (window.confirm(`Hapus template ${t.nama}?`)) {
                      await deleteDoc(doc(db, COL_TEMPLATE, t.id));
                      await muat();
                    }
                  }}
                  ><Trash2 size={14} />
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
  infoBox: {
    background: '#eef2ff', border: '1px solid #c7d2fe', borderRadius: 12, padding: '12px 14px',
    fontSize: 13, color: '#3730a3', lineHeight: 1.55, marginBottom: 14,
  },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 10 },
  label: { display: 'flex', flexDirection: 'column', gap: 4, fontSize: 11, fontWeight: 700, color: '#64748b' },
  input: {
    border: '1px solid #cbd5e1', borderRadius: 8, padding: '8px 10px', fontSize: 13, color: '#1e293b', background: '#fff',
  },
  check: { display: 'inline-flex', alignItems: 'center', gap: 5, fontWeight: 600, color: '#475569', cursor: 'pointer' },
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
  chip: { border: 'none', borderRadius: 8, padding: '6px 10px', fontWeight: 700, fontSize: 12, cursor: 'pointer' },
  badge: {
    display: 'inline-block', background: '#eef2ff', color: '#4338ca', borderRadius: 999,
    padding: '2px 8px', fontSize: 11, fontWeight: 700, marginRight: 4, marginBottom: 4,
  },
  alert: { borderRadius: 10, padding: '10px 14px', marginBottom: 12, fontSize: 13, fontWeight: 600 },
};
