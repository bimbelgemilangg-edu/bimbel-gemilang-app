// src/pages/teacher/KelasLivePanel.jsx
// Panel "Kelas & Soal Live" yang DIPASANG DI DALAM ClassSession.jsx (Step 2).
// Guru: muat bab buku digital -> tayangkan materi (proyektor) -> tayangkan soal
// lockstep -> lihat distribusi jawaban real-time -> buka pembahasan -> rekap.
import React, { useState, useEffect, useMemo } from 'react';
import { collection, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { parseDaftarSoal, soalKeFormatSesi } from '../../utils/parseSoal';
import RendererHtmlBab from '../../components/buku/RendererHtmlBab';
import {
  buatSesiLive, dengarSesiByJadwal, dengarPeserta,
  tayangkanMateri, tayangkanSoal, bukaPembahasan, akhiriSesiLive,
  hitungRekap, soalPalingSalah,
} from '../../services/sesiService';

const S = {
  card: { background: '#fff', border: '1px solid #eee', borderRadius: 12, padding: 16, marginBottom: 12 },
  row: { display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', marginBottom: 10 },
  select: { border: '1px solid #cbd5e1', borderRadius: 8, padding: '8px 10px', fontSize: 13, background: '#fff', minWidth: 200 },
  btn: { background: '#3498db', color: '#fff', border: 'none', borderRadius: 8, padding: '9px 14px', fontSize: 13, fontWeight: 700, cursor: 'pointer' },
  btnH: { background: '#27ae60', color: '#fff', border: 'none', borderRadius: 8, padding: '9px 14px', fontSize: 13, fontWeight: 700, cursor: 'pointer' },
  btnW: { background: '#f39c12', color: '#fff', border: 'none', borderRadius: 8, padding: '9px 14px', fontSize: 13, fontWeight: 700, cursor: 'pointer' },
  btnR: { background: '#e74c3c', color: '#fff', border: 'none', borderRadius: 8, padding: '9px 14px', fontSize: 13, fontWeight: 700, cursor: 'pointer' },
  btn2: { background: '#f1f5f9', color: '#64748b', border: 'none', borderRadius: 8, padding: '9px 14px', fontSize: 13, fontWeight: 700, cursor: 'pointer' },
  tab: (a) => ({ padding: '8px 14px', borderRadius: 8, border: a ? '2px solid #2c3e50' : '1px solid #e2e8f0', background: a ? '#2c3e50' : '#fff', color: a ? '#fff' : '#64748b', fontWeight: 700, fontSize: 12, cursor: 'pointer' }),
  chip: { background: '#ebf5fb', color: '#3498db', borderRadius: 999, padding: '3px 10px', fontSize: 11, fontWeight: 700 },
  bar: { height: 12, borderRadius: 6, minWidth: 3, background: '#3498db' },
  opsi: (k) => ({ padding: '8px 10px', borderRadius: 8, border: '1px solid #e2e8f0', background: k ? '#f0fdf4' : '#f8fafc', fontSize: 13, marginBottom: 6 }),
};

export default function KelasLivePanel({ schedule, teacher, onSelesai }) {
  const [bukuList, setBukuList] = useState([]);
  const [bukuId, setBukuId] = useState('');
  const [babList, setBabList] = useState([]);
  const [babId, setBabId] = useState('');
  const [babHtml, setBabHtml] = useState('');
  const [sesi, setSesi] = useState(null);
  const [peserta, setPeserta] = useState({});
  const [tab, setTab] = useState('soal');
  const [memuat, setMemuat] = useState(false);

  const kelasSekolah = useMemo(() => {
    const cnt = {};
    (schedule?.students || []).forEach((s) => { const k = s.kelas || s.kelasSekolah; if (k) cnt[k] = (cnt[k] || 0) + 1; });
    return Object.keys(cnt).sort((a, b) => cnt[b] - cnt[a])[0] || '';
  }, [schedule]);

  useEffect(() => {
    (async () => { try { const sn = await getDocs(collection(db, 'buku_digital')); setBukuList(sn.docs.map((d) => ({ id: d.id, ...d.data() }))); } catch (e) {} })();
  }, []);
  useEffect(() => {
    if (!bukuId) { setBabList([]); return; }
    (async () => { try { const sn = await getDocs(collection(db, 'buku_digital', bukuId, 'bab')); const l = sn.docs.map((d) => ({ id: d.id, ...d.data() })); l.sort((a, b) => (a.urutan || 0) - (b.urutan || 0)); setBabList(l); } catch (e) {} })();
  }, [bukuId]);
  useEffect(() => {
    if (!schedule?.id) return undefined;
    const u = dengarSesiByJadwal(schedule.id, setSesi);
    return u;
  }, [schedule]);
  useEffect(() => {
    if (!sesi) return undefined;
    const u = dengarPeserta(sesi.id, setPeserta);
    return u;
  }, [sesi]);
  useEffect(() => {
    if (!sesi?.babId || !sesi?.bukuId) return;
    (async () => { try { const s = await getDoc(doc(db, 'buku_digital', sesi.bukuId, 'bab', sesi.babId)); if (s.exists()) setBabHtml(s.data().html || ''); } catch (e) {} })();
  }, [sesi]);

  async function mulaiSesi() {
    if (!babId) return alert('Pilih bab dulu.');
    setMemuat(true);
    try {
      const s = await getDoc(doc(db, 'buku_digital', bukuId, 'bab', babId));
      const html = s.exists() ? (s.data().html || '') : '';
      const daftar = parseDaftarSoal(html).map(soalKeFormatSesi);
      if (!daftar.length) { alert('Bab ini tidak punya soal terparse.'); setMemuat(false); return; }
      await buatSesiLive({
        jadwalId: schedule.id, guruId: teacher?.id || teacher?.guruId || '',
        kelasSekolah, mataPelajaran: schedule.title || 'Umum', materiJudul: schedule.title || 'Umum',
        bukuId, babId, daftarSoal: daftar,
      });
    } catch (e) { alert('Gagal mulai sesi: ' + e.message); }
    setMemuat(false);
  }

  const soalList = sesi?.daftarSoal || [];
  const idx = sesi?.indexSekarang;
  const soalNow = idx != null ? soalList[idx] : null;
  const rekap = idx != null ? hitungRekap(peserta, idx) : null;
  const belum = Object.values(peserta).filter((p) => !(p.jawabanPerSoal && p.jawabanPerSoal[idx] !== undefined));

  if (!sesi) {
    return (
      <div style={S.card}>
        <h4 style={{ margin: '0 0 10px', fontSize: 15 }}>📡 Mulai Sesi Kelas Live (dari Buku Digital)</h4>
        <p style={{ fontSize: 12, color: '#64748b', marginBottom: 10 }}>
          Pilih buku & bab yang sama dengan yang dibuka siswa. Soal bab otomatis dimuat dan ditayangkan lockstep; siswa mengikuti lewat halaman live mereka masing-masing (kelas {kelasSekolah || '-'}).
        </p>
        <div style={S.row}>
          <select style={S.select} value={bukuId} onChange={(e) => { setBukuId(e.target.value); setBabId(''); }}>
            <option value="">— pilih buku —</option>
            {bukuList.map((b) => <option key={b.id} value={b.id}>{b.judul}</option>)}
          </select>
          <select style={S.select} value={babId} onChange={(e) => setBabId(e.target.value)} disabled={!bukuId}>
            <option value="">— pilih bab —</option>
            {babList.map((b) => <option key={b.id} value={b.id}>{b.urutan ?? '-'}. {b.judul}</option>)}
          </select>
          <button style={S.btn} disabled={memuat} onClick={mulaiSesi}>{memuat ? 'Memuat...' : '🚀 Muat Soal & Mulai Sesi'}</button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div style={S.card}>
        <div style={S.row}>
          <span style={S.chip}>🔴 SESI LIVE AKTIF</span>
          <span style={S.chip}>Kelas {sesi.kelasSekolah || '-'}</span>
          <span style={S.chip}>👥 {Object.keys(peserta).length} peserta</span>
          <span style={{ flex: 1 }} />
          <button style={S.btn2} onClick={onSelesai}>Lanjut ke Laporan ⮕</button>
          <button style={S.btnR} onClick={async () => { if (window.confirm('Akhiri sesi live?')) await akhiriSesiLive(sesi.id); }}>⏹ Akhiri Sesi</button>
        </div>
        <div style={S.row}>
          <button style={S.tab(tab === 'materi')} onClick={() => { setTab('materi'); tayangkanMateri(sesi.id); }}>📖 Materi (Proyektor)</button>
          <button style={S.tab(tab === 'soal')} onClick={() => setTab('soal')}>✍️ Soal Live</button>
          <button style={S.tab(tab === 'rekap')} onClick={() => setTab('rekap')}>📊 Rekap</button>
        </div>
      </div>

      {tab === 'materi' && (
        <div style={S.card}>
          {babHtml ? <RendererHtmlBab html={babHtml} babId={sesi.babId} bukuId={sesi.bukuId} modePresentasi /> : <p style={{ fontSize: 12, color: '#64748b' }}>Memuat materi...</p>}
        </div>
      )}

      {tab === 'soal' && (
        <div style={S.card}>
          <div style={S.row}>
            <select style={S.select} value={idx != null ? String(idx) : ''} onChange={(e) => e.target.value !== '' && tayangkanSoal(sesi.id, e.target.value)}>
              <option value="">— pilih soal —</option>
              {soalList.map((s, i) => <option key={i} value={i}>Soal {i + 1} ({s.tipe})</option>)}
            </select>
            {idx != null && sesi.tahap === 'soal' && <button style={S.btnW} onClick={() => bukaPembahasan(sesi.id)}>💡 Buka Pembahasan</button>}
            {idx != null && idx < soalList.length - 1 && <button style={S.btn} onClick={() => tayangkanSoal(sesi.id, idx + 1)}>➡ Soal Berikutnya</button>}
          </div>
          {soalNow && (
            <>
              <div style={{ fontSize: 13, lineHeight: 1.6, marginBottom: 10 }}>{soalNow.soal}</div>
              {(soalNow.opsiJawaban || []).map((o, i) => (
                <div key={i} style={S.opsi(sesi.tahap === 'pembahasan' && (soalNow.tipe === 'pg' ? soalNow.kunciJawaban === i : (soalNow.tipe === 'multi' ? (soalNow.kunciJawaban || []).includes(i) : false)))}>
                  <b>{String.fromCharCode(65 + i)}.</b> {o}
                </div>
              ))}
              {(soalNow.pernyataan || []).map((p, i) => (
                <div key={i} style={S.opsi(false)}>{i + 1}. {p}</div>
              ))}
              {sesi.tahap === 'pembahasan' && soalNow.pembahasan && (
                <div style={{ background: '#f5f3ff', borderRadius: 8, padding: 10, fontSize: 12.5, color: '#4c1d95', marginTop: 8 }}>💡 {soalNow.pembahasan}</div>
              )}
              {rekap && (
                <div style={{ marginTop: 12 }}>
                  <div style={{ fontSize: 12, color: '#64748b', marginBottom: 6 }}>
                    {rekap.sudahJawab}/{rekap.totalSiswa} menjawab • benar {rekap.benar}
                  </div>
                  {soalNow.tipe === 'pg' && (soalNow.opsiJawaban || []).map((o, i) => {
                    const n = rekap.distribusi[JSON.stringify(i)] || 0;
                    const max = Math.max(1, ...(soalNow.opsiJawaban || []).map((_, j) => rekap.distribusi[JSON.stringify(j)] || 0));
                    return (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                        <span style={{ fontSize: 11, width: 14 }}>{String.fromCharCode(65 + i)}</span>
                        <div style={{ ...S.bar, width: `${(n / max) * 160}px`, background: sesi.tahap === 'pembahasan' && soalNow.kunciJawaban === i ? '#27ae60' : '#3498db' }} />
                        <span style={{ fontSize: 11, color: '#64748b' }}>{n}</span>
                      </div>
                    );
                  })}
                  {belum.length > 0 && <div style={{ fontSize: 11, color: '#f39c12', marginTop: 6 }}>Belum menjawab: {belum.map((p) => p.nama || p.id).join(', ')}</div>}
                </div>
              )}
            </>
          )}
          {!soalNow && <p style={{ fontSize: 12, color: '#64748b' }}>Pilih soal untuk ditayangkan ke siswa.</p>}
        </div>
      )}

      {tab === 'rekap' && (
        <div style={S.card}>
          <h4 style={{ margin: '0 0 10px', fontSize: 14 }}>📊 Rekap per Soal (paling salah di atas)</h4>
          {soalPalingSalah(peserta, soalList.length).map((r) => (
            <div key={r.index} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5, padding: '6px 8px', borderBottom: '1px solid #f1f5f9' }}>
              <span>Soal {r.index + 1} ({soalList[r.index]?.tipe})</span>
              <span style={{ color: r.salah > r.benar ? '#e74c3c' : '#27ae60', fontWeight: 700 }}>{r.benar}✓ / {r.salah}✗ dari {r.sudahJawab}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}