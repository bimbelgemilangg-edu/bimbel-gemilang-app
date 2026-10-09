// src/pages/admin/bank-soal/ApprovalTryOutPage.jsx
// ============================================================
// PERSETUJUAN TRY OUT USULAN TENTOR (Admin) — Fase 2
// ============================================================
// Keputusan owner 2026-10-08: tentor boleh membuat try out, TETAPI perlu
// approval. Halaman ini adalah sisi admin dari keputusan itu.
//
// Yang TIDAK boleh terjadi, dan bagaimana halaman ini mencegahnya:
//
//   • Draf terbit tanpa diperiksa  -> status hanya bisa berubah lewat
//     `putusanApprove`/`putusanTolak` (murni, teruji) yang memeriksa
//     transisi, isi paket, tipe butir, dan kewajaran jadwal.
//   • Penolakan tanpa alasan       -> `putusanTolak` menolak alasan di
//     bawah 10 huruf. Tentor harus tahu apa yang diperbaiki; tanpa itu ia
//     mengulang kesalahan yang sama.
//   • Keputusan tanpa jejak        -> tiap keputusan ditulis ke `audit_logs`
//     lewat `catatAudit` (util yang sudah ada) DAN ke `riwayatStatus` di
//     dokumen paketnya, jadi jejaknya menempel pada paket walau log
//     dibersihkan.
//   • Jadwal jadi efek samping     -> waktuBuka/waktuTutup dikosongkan saat
//     tentor mengusulkan; di sinilah admin mengisinya (boleh dikosongkan
//     = langsung bisa dikerjakan).
//
// Halaman ini HANYA mengubah dokumen yang statusnya sudah 'menunggu
// approval' atau 'ditolak'. Paket terbit dikelola di halaman Terbitkan
// Try Out seperti sebelumnya — tidak ada dua pintu untuk satu tugas.
// ============================================================

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import SidebarAdmin from '../../../components/SidebarAdmin';
import { db } from '../../../firebase';
import { collection, getDocs, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import {
  putusanApprove, putusanTolak, ringkasDraf, MIN_PANJANG_ALASAN_TOLAK,
} from '../../../utils/rakitTryOutTentor';
import { STATUS_PAKET, labelStatus, warnaStatus } from '../../../utils/statusTryOutPaket';
import { identitasDari, teksSoalDari } from '../../../utils/fieldButirSoal';
import { benderaButir } from '../../../utils/keranjangSoalGuru';
import { catatAudit, KATEGORI, aktorSaatIni } from '../../../utils/auditLog';
import { kebijakanGagalMuat } from '../../../utils/keputusanMuat';
import {
  Inbox, Loader2, AlertTriangle, CheckCircle2, XCircle, RefreshCw, ShieldCheck,
} from 'lucide-react';

const st = {
  kartu: { background: '#fff', border: '1px solid #e5e7eb', borderRadius: 14, padding: 16, marginBottom: 14 },
  judul: { fontSize: 13, fontWeight: 800, color: '#334155', textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 9 },
  kecil: { fontSize: 12, color: '#6b7280', lineHeight: 1.65 },
  tombol: (warna, mati) => ({
    background: mati ? '#e5e7eb' : warna, color: mati ? '#9ca3af' : '#fff', border: 'none',
    borderRadius: 10, padding: '10px 15px', fontSize: 12.5, fontWeight: 800,
    cursor: mati ? 'not-allowed' : 'pointer', display: 'inline-flex', alignItems: 'center', gap: 7,
  }),
  input: { border: '1px solid #d1d5db', borderRadius: 8, padding: '8px 10px', fontSize: 12.5, width: '100%' },
  item: (aktif) => ({
    border: `1.5px solid ${aktif ? '#5B2ECC' : '#e5e7eb'}`, background: aktif ? '#f5f3ff' : '#fff',
    borderRadius: 11, padding: '10px 12px', marginBottom: 8, cursor: 'pointer',
  }),
};

export default function ApprovalTryOutPage() {
  const [isMobile] = useState(window.innerWidth < 1024);
  const [memuat, setMemuat] = useState(true);
  const [error, setError] = useState('');
  const [daftar, setDaftar] = useState([]);
  const [terpilihId, setTerpilihId] = useState('');
  const [jadwalBuka, setJadwalBuka] = useState('');
  const [jadwalTutup, setJadwalTutup] = useState('');
  const [alasanTolak, setAlasanTolak] = useState('');
  const [tab, setTab] = useState('menunggu'); // menunggu | ditolak
  const [sibuk, setSibuk] = useState('');
  const [pesan, setPesan] = useState('');
  const [punyaDaftar, setPunyaDaftar] = useState(false);

  const muat = useCallback(async () => {
    setMemuat(true);
    setError('');
    try {
      const snap = await getDocs(collection(db, 'tryout_paket'));
      const semua = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      const usulan = semua
        .filter((p) => p.status === STATUS_PAKET.MENUNGGU || p.status === STATUS_PAKET.DITOLAK)
        .sort((a, b) => String(b.updatedAt?.toDate?.() || b.createdAt?.toDate?.() || 0)
          .localeCompare(String(a.updatedAt?.toDate?.() || a.createdAt?.toDate?.() || 0)));
      setDaftar(usulan);
      setPunyaDaftar(true);
      if (!usulan.some((u) => u.id === terpilihId)) setTerpilihId(usulan[0]?.id || '');
    } catch (e) {
      const k = kebijakanGagalMuat(punyaDaftar, e?.code || e?.message || '');
      setError(k.pesan);
      if (!k.pertahankanDataLama) setDaftar([]);
    } finally {
      setMemuat(false);
    }
  }, [terpilihId, punyaDaftar]);

  useEffect(() => { muat(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const menunggu = useMemo(() => daftar.filter((p) => p.status === STATUS_PAKET.MENUNGGU), [daftar]);
  const ditolak = useMemo(() => daftar.filter((p) => p.status === STATUS_PAKET.DITOLAK), [daftar]);
  const tampil = tab === 'menunggu' ? menunggu : ditolak;
  const terpilih = daftar.find((p) => p.id === terpilihId) || null;
  const ringkas = terpilih ? ringkasDraf(terpilih) : null;

  const putusanSetuju = useMemo(() => (terpilih
    ? putusanApprove(terpilih, { jadwalBuka: jadwalBuka || null, jadwalTutup: jadwalTutup || null, oleh: aktorSaatIni()?.nama || 'admin' })
    : null), [terpilih, jadwalBuka, jadwalTutup]);

  const putusanT = useMemo(() => (terpilih ? putusanTolak(terpilih, alasanTolak) : null), [terpilih, alasanTolak]);

  const eksekusi = useCallback(async (jenis) => {
    if (!terpilih || sibuk) return;
    const putusan = jenis === 'setuju' ? putusanSetuju : putusanT;
    if (!putusan?.boleh) return;

    const konfirmasi = jenis === 'setuju'
      ? `TERBITKAN "${terpilih.judul}" (${terpilih.totalSoal ?? terpilih.daftarSoal?.length ?? 0} butir)?\n\n`
        + 'Begitu terbit, paket ini masuk daftar try out siswa'
        + (jadwalBuka ? ` mulai ${new Date(jadwalBuka).toLocaleString('id-ID')}` : ' dan LANGSUNG bisa dikerjakan')
        + (jadwalTutup ? ` sampai ${new Date(jadwalTutup).toLocaleString('id-ID')}` : ' tanpa deadline') + '.'
      : `TOLAK "${terpilih.judul}"?\n\nTentor akan melihat alasan Anda dan bisa memperbaiki lalu mengirim ulang.`;
    if (!window.confirm(konfirmasi)) return;

    setSibuk(jenis);
    setPesan('');
    try {
      await updateDoc(doc(db, 'tryout_paket', terpilih.id), {
        ...putusan.payload,
        updatedAt: serverTimestamp(),
      });
      catatAudit(jenis === 'setuju' ? 'tryout.usulan.setujui' : 'tryout.usulan.tolak', {
        kategori: KATEGORI.KONTEN,
        target: `${terpilih.judul || terpilih.id} • ${ringkas?.diusulkanOleh || 'tentor'}`,
        detail: {
          paketId: terpilih.id,
          jumlahButir: terpilih.totalSoal ?? (terpilih.daftarSoal?.length || 0),
          statusBaru: putusan.payload.status,
          waktuBuka: putusan.payload.waktuBuka || null,
          waktuTutup: putusan.payload.waktuTutup || null,
          ...(jenis === 'tolak' ? { alasan: putusan.payload.ditolakAlasan } : {}),
        },
      });
      setPesan(jenis === 'setuju'
        ? `✅ "${terpilih.judul}" diterbitkan. Siswa sudah bisa melihatnya.`
        : `✅ "${terpilih.judul}" ditolak dan alasannya dikirim ke tentor.`);
      setAlasanTolak('');
      setJadwalBuka('');
      setJadwalTutup('');
      await muat();
    } catch (e) {
      setPesan(`❌ Gagal menyimpan keputusan: ${e?.message || e}`);
    } finally {
      setSibuk('');
    }
  }, [terpilih, sibuk, putusanSetuju, putusanT, jadwalBuka, jadwalTutup, ringkas, muat]);

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc' }}>
      <SidebarAdmin />
      <div style={{ marginLeft: isMobile ? 0 : 216, padding: isMobile ? 14 : 24, width: isMobile ? '100%' : 'calc(100% - 216px)', boxSizing: 'border-box', maxWidth: 1400 }}>
        <div style={{ marginBottom: 14 }}>
          <h1 style={{ fontSize: 20, fontWeight: 800, color: '#111827', margin: 0, display: 'flex', alignItems: 'center', gap: 9 }}>
            <Inbox size={20} color="#5B2ECC" /> Persetujuan Try Out Tentor
            {menunggu.length > 0 && <span style={{ background: '#fef3c7', color: '#92400e', borderRadius: 999, padding: '2px 10px', fontSize: 12 }}>{menunggu.length} menunggu</span>}
          </h1>
          <p style={{ ...st.kecil, margin: '5px 0 0' }}>
            Usulan tentor <b>tidak terbit sendiri</b>. Di sini Anda memeriksa isinya, menentukan jadwal, lalu
            menerbitkan atau menolak <b>beserta alasannya</b>. Setiap keputusan dicatat di jejak audit dan di
            riwayat paket.
          </p>
        </div>

        {error && (
          <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10, padding: '10px 13px', marginBottom: 14, fontSize: 12.5, color: '#991b1b', display: 'flex', gap: 9, alignItems: 'center', flexWrap: 'wrap' }}>
            <AlertTriangle size={15} />
            <span style={{ flex: 1, minWidth: 200 }}>{error}</span>
            <button style={st.tombol('#b91c1c', false)} onClick={muat} disabled={memuat}><RefreshCw size={13} /> Coba lagi</button>
          </div>
        )}
        {pesan && (
          <div style={{ background: pesan.startsWith('✅') ? '#f0fdf4' : '#fef2f2', border: `1px solid ${pesan.startsWith('✅') ? '#bbf7d0' : '#fecaca'}`, color: pesan.startsWith('✅') ? '#166534' : '#991b1b', borderRadius: 10, padding: '10px 13px', marginBottom: 14, fontSize: 12.5 }}>{pesan}</div>
        )}

        <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
          <button style={st.tombol(tab === 'menunggu' ? '#5B2ECC' : '#e2e8f0', false)} onClick={() => setTab('menunggu')}>
            <span style={{ color: tab === 'menunggu' ? '#fff' : '#334155', display: 'inline-flex', gap: 7, alignItems: 'center' }}>
              <Inbox size={14} /> Menunggu ({menunggu.length})
            </span>
          </button>
          <button style={st.tombol(tab === 'ditolak' ? '#5B2ECC' : '#e2e8f0', false)} onClick={() => setTab('ditolak')}>
            <span style={{ color: tab === 'ditolak' ? '#fff' : '#334155', display: 'inline-flex', gap: 7, alignItems: 'center' }}>
              <XCircle size={14} /> Ditolak ({ditolak.length})
            </span>
          </button>
          <button style={{ ...st.tombol('#fff', false), color: '#475569', border: '1px solid #d1d5db' }} onClick={muat} disabled={memuat}>
            <RefreshCw size={13} /> Muat ulang
          </button>
        </div>

        <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start', flexDirection: isMobile ? 'column' : 'row' }}>
          {/* ---- daftar usulan ---- */}
          <div style={{ width: isMobile ? '100%' : 340, flexShrink: 0 }}>
            <div style={st.kartu}>
              <div style={st.judul}>Daftar usulan</div>
              {memuat && !punyaDaftar && <div style={st.kecil}><Loader2 size={13} className="animate-spin" style={{ verticalAlign: -2 }} /> Memuat…</div>}
              {!memuat && tampil.length === 0 && (
                <div style={st.kecil}>
                  <CheckCircle2 size={14} color="#16a34a" style={{ verticalAlign: -2 }} /> Tidak ada usulan{' '}
                  {tab === 'menunggu' ? 'yang menunggu keputusan.' : 'yang ditolak.'}
                </div>
              )}
              {tampil.map((p) => {
                const r = ringkasDraf(p);
                const w = warnaStatus(p.status);
                return (
                  <div key={p.id} style={st.item(terpilihId === p.id)} onClick={() => { setTerpilihId(p.id); setPesan(''); }}>
                    <div style={{ fontSize: 12.5, fontWeight: 700, color: '#0f172a', marginBottom: 3 }}>{r.judul}</div>
                    <div style={{ fontSize: 10.5, color: '#64748b', marginBottom: 5 }}>
                      {r.diusulkanOleh} · {r.jumlahButir} butir · {r.jumlahSubtes} subtes
                    </div>
                    <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                      <span style={{ background: w.latar, color: w.teks, borderRadius: 999, padding: '2px 8px', fontSize: 9.5, fontWeight: 800 }}>{labelStatus(p.status)}</span>
                      {r.berbendera > 0 && <span style={{ background: '#fffbeb', color: '#92400e', borderRadius: 999, padding: '2px 8px', fontSize: 9.5, fontWeight: 700 }}>⚠ {r.berbendera} berbendera</span>}
                      {r.tanpaIdentitas > 0 && <span style={{ background: '#fef2f2', color: '#991b1b', borderRadius: 999, padding: '2px 8px', fontSize: 9.5, fontWeight: 700 }}>{r.tanpaIdentitas} tanpa identitas</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ---- rincian + keputusan ---- */}
          <div style={{ flex: 1, minWidth: 0, width: '100%' }}>
            {!terpilih ? (
              <div style={{ ...st.kartu, textAlign: 'center', padding: 40 }}>
                <ShieldCheck size={26} color="#9ca3af" style={{ marginBottom: 8 }} />
                <div style={{ fontSize: 13.5, fontWeight: 700, color: '#374151' }}>Pilih sebuah usulan</div>
                <div style={st.kecil}>Rincian butir, subtes, dan bendera mutunya tampil di sini sebelum Anda memutuskan.</div>
              </div>
            ) : (
              <>
                <div style={st.kartu}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'flex-start', flexWrap: 'wrap' }}>
                    <div>
                      <div style={{ fontSize: 16, fontWeight: 800, color: '#111827' }}>{ringkas.judul}</div>
                      <div style={{ ...st.kecil, marginTop: 3 }}>
                        Diajukan oleh <b>{ringkas.diusulkanOleh}</b> · {ringkas.jumlahButir} butir · {ringkas.jumlahSubtes} subtes
                        {terpilih.modeTimer === 'per-subtes' ? ' · timer per subtes' : ` · durasi ${terpilih.durasiTotalMenit || '-'} menit`}
                        {terpilih.soalAcak ? ' · soal diacak' : ''}{terpilih.antiCheatAktif ? ' · anti-cheat' : ''}
                      </div>
                    </div>
                    <span style={{ ...warnaStatus(terpilih.status), borderRadius: 999, padding: '4px 11px', fontSize: 11, fontWeight: 800 }}>{labelStatus(terpilih.status)}</span>
                  </div>

                  {ringkas.catatan && (
                    <div style={{ marginTop: 11, background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 9, padding: '9px 11px', fontSize: 12, color: '#334155' }}>
                      <b>Catatan tentor:</b> {ringkas.catatan}
                    </div>
                  )}
                  {terpilih.status === STATUS_PAKET.DITOLAK && terpilih.ditolakAlasan && (
                    <div style={{ marginTop: 11, background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 9, padding: '9px 11px', fontSize: 12, color: '#991b1b' }}>
                      <b>Alasan penolakan sebelumnya:</b> {terpilih.ditolakAlasan}
                    </div>
                  )}

                  <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap', marginTop: 11 }}>
                    {ringkas.jenjang.map((j) => <span key={j} style={{ background: '#eef2ff', color: '#3730a3', borderRadius: 999, padding: '3px 10px', fontSize: 11, fontWeight: 700 }}>{j}</span>)}
                    {ringkas.mapel.map((m) => <span key={m} style={{ background: '#f1f5f9', color: '#334155', borderRadius: 999, padding: '3px 10px', fontSize: 11 }}>{m}</span>)}
                  </div>

                  {/* subtes */}
                  <div style={{ marginTop: 14 }}>
                    <div style={st.judul}>Pembagian subtes</div>
                    {(terpilih.subtes || []).map((s, i) => (
                      <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#334155', padding: '4px 0', borderBottom: '1px solid #f8fafc' }}>
                        <span>{i + 1}. {s.nama}</span>
                        <span><b>{s.jumlahSoal ?? (s.soalIds?.length || 0)}</b> butir{s.durasiMenit ? ` · ${s.durasiMenit} menit` : ''}</span>
                      </div>
                    ))}
                  </div>

                  {/* butir */}
                  <div style={{ marginTop: 14 }}>
                    <div style={st.judul}>Periksa butir ({(terpilih.daftarSoal || []).length})</div>
                    <div style={{ maxHeight: 380, overflowY: 'auto', border: '1px solid #f1f5f9', borderRadius: 10, padding: 8 }}>
                      {(terpilih.daftarSoal || []).slice(0, 80).map((s, i) => {
                        const b = benderaButir(s);
                        const id = identitasDari(s);
                        return (
                          <div key={i} style={{ padding: '7px 9px', borderBottom: '1px solid #f8fafc', background: b.length ? '#fffdf5' : '#fff', borderRadius: 7 }}>
                            <div style={{ fontSize: 12, color: '#0f172a', lineHeight: 1.55 }}>
                              <b style={{ color: '#5B2ECC' }}>{i + 1}.</b> {teksSoalDari(s).slice(0, 180) || <span style={{ color: '#b91c1c' }}>(TANPA TEKS SOAL)</span>}
                            </div>
                            <div style={{ fontSize: 10.5, color: '#94a3b8', marginTop: 2 }}>
                              {String(s.tipe || 'pg_sederhana').replace(/_/g, ' ')} · kunci {Array.isArray(s.kunciJawaban) ? s.kunciJawaban.join(',') : (s.kunciJawaban || '-')} · {id.mapel} / {id.materi}
                              {b.length > 0 && <span style={{ color: '#b45309' }}> · ⚠ {b.join('; ')}</span>}
                            </div>
                          </div>
                        );
                      })}
                      {(terpilih.daftarSoal || []).length > 80 && (
                        <div style={{ ...st.kecil, padding: 6 }}>Menampilkan 80 dari {terpilih.daftarSoal.length}. Sisanya tetap ikut terbit bila Anda menyetujui — periksa lewat Cetak Latihan bila perlu.</div>
                      )}
                    </div>
                  </div>
                </div>

                {/* ---- keputusan ---- */}
                {terpilih.status === STATUS_PAKET.MENUNGGU && (
                  <div style={st.kartu}>
                    <div style={st.judul}>Keputusan</div>

                    <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 11, marginBottom: 12 }}>
                      <div>
                        <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#64748b', marginBottom: 4 }}>JADWAL BUKA (kosongkan = langsung bisa dikerjakan)</label>
                        <input style={st.input} type="datetime-local" value={jadwalBuka} onChange={(e) => setJadwalBuka(e.target.value)} />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#64748b', marginBottom: 4 }}>DEADLINE (kosongkan = tanpa batas)</label>
                        <input style={st.input} type="datetime-local" value={jadwalTutup} onChange={(e) => setJadwalTutup(e.target.value)} />
                      </div>
                    </div>

                    {putusanSetuju && !putusanSetuju.boleh && (
                      <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 9, padding: '9px 11px', marginBottom: 11 }}>
                        <div style={{ fontSize: 11.5, fontWeight: 800, color: '#991b1b', marginBottom: 4 }}>Tidak bisa diterbitkan</div>
                        <ul style={{ margin: 0, paddingLeft: 17, fontSize: 11.5, color: '#b91c1c', lineHeight: 1.6 }}>
                          {putusanSetuju.alasan.map((a, i) => <li key={i}>{a}</li>)}
                        </ul>
                      </div>
                    )}

                    <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'flex-start' }}>
                      <button style={st.tombol('#16a34a', !(putusanSetuju?.boleh) || sibuk === 'setuju')} onClick={() => eksekusi('setuju')} disabled={!(putusanSetuju?.boleh) || !!sibuk}>
                        {sibuk === 'setujui' ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />} Terbitkan
                      </button>

                      <div style={{ flex: 1, minWidth: 250 }}>
                        <input
                          style={st.input}
                          value={alasanTolak}
                          onChange={(e) => setAlasanTolak(e.target.value)}
                          placeholder={`Alasan menolak (minimal ${MIN_PANJANG_ALASAN_TOLAK} huruf) — tentor perlu tahu apa yang diperbaiki`}
                        />
                        <button
                          style={{ ...st.tombol('#dc2626', !(putusanT?.boleh) || sibuk === 'tolak'), marginTop: 8 }}
                          onClick={() => eksekusi('tolak')}
                          disabled={!(putusanT?.boleh) || !!sibuk}
                        >
                          {sibuk === 'tolak' ? <Loader2 size={14} className="animate-spin" /> : <XCircle size={14} />} Tolak dengan alasan ini
                        </button>
                        {alasanTolak && !(putusanT?.boleh) && (
                          <div style={{ fontSize: 11, color: '#b91c1c', marginTop: 6 }}>{putusanT?.alasan.join(' ')}</div>
                        )}
                      </div>
                    </div>

                    <div style={{ ...st.kecil, marginTop: 12, borderTop: '1px solid #f1f5f9', paddingTop: 10 }}>
                      Keputusan dicatat di <code>audit_logs</code> dan di <code>riwayatStatus</code> paket ini
                      (siapa, kapan, dan alasannya). Paket yang ditolak tetap tersimpan — tentor bisa
                      memperbaiki dan mengirim ulang.
                    </div>
                  </div>
                )}

                {/* riwayat */}
                {Array.isArray(terpilih.riwayatStatus) && terpilih.riwayatStatus.length > 0 && (
                  <div style={st.kartu}>
                    <div style={st.judul}>Riwayat status</div>
                    {terpilih.riwayatStatus.map((r, i) => (
                      <div key={i} style={{ fontSize: 11.5, color: '#475569', padding: '4px 0', borderBottom: '1px solid #f8fafc' }}>
                        <b>{labelStatus(r.status)}</b> · {r.oleh} ({r.peran}) · {r.pada ? new Date(r.pada).toLocaleString('id-ID') : '-'}
                        {r.catatan ? <span style={{ color: '#64748b' }}> — {r.catatan}</span> : null}
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
