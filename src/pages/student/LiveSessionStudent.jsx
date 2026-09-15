// src/pages/student/LiveSessionStudent.jsx
// SISI SISWA sesi live: join lewat kode, ikuti slide/soal guru real-time.
// Kunci jawaban: (1) status "sudah kirim" dimuat dari Firestore saat
// bergabung (refresh/rejoin tidak membuka kunci), (2) PG ketuk = langsung
// terkirim & terkunci, (3) setelah kirim semua opsi jadi div mati + 🔒.
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { doc, getDoc, collection, getDocs } from 'firebase/firestore';
import { db } from '../../firebase';
import { parseSlides, parseDaftarSoal, cekBenar, bersihVerdikt, CSS_MODUL } from '../../utils/parseSoal';
import { cariSesiByKode, gabungSesi, dengarSesi, kirimJawaban } from '../../services/sesiService';

const S = {
  page: { maxWidth: 620, margin: '0 auto', padding: 16, fontFamily: 'sans-serif', minHeight: '100vh', background: '#f8fafc' },
  card: { background: '#fff', border: '1px solid #e3e6ef', borderRadius: 12, padding: 16, marginBottom: 12 },
  row: { display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', marginBottom: 10 },
  input: { border: '1px solid #cbd5e1', borderRadius: 8, padding: '10px 12px', fontSize: 14, background: '#fff', letterSpacing: 3, textTransform: 'uppercase' },
  btn: { width: '100%', padding: 12, background: '#7C3AED', color: '#fff', border: 'none', borderRadius: 10, fontWeight: 800, fontSize: 14, cursor: 'pointer' },
  chip: { background: '#eef2ff', color: '#4338ca', borderRadius: 999, padding: '3px 10px', fontSize: 11, fontWeight: 700 },
  cbt: { border: '1px solid #e3e6ef', borderRadius: 12, overflow: 'hidden', background: '#fff', margin: '10px 0' },
  cbtHead: { display: 'grid', gridTemplateColumns: '1fr 76px 76px', background: '#4C6EF5', color: '#fff', fontSize: 11, fontWeight: 800 },
  cbtHeadText: { padding: '8px 10px' },
  cbtHeadOpt: { padding: '8px 4px', textAlign: 'center', borderLeft: '1px solid rgba(255,255,255,.25)' },
  cbtRow: (salah) => ({ display: 'grid', gridTemplateColumns: '1fr 76px 76px', borderTop: '1px solid #eef1f6', background: salah ? '#fef2f2' : 'transparent' }),
  cbtText: { padding: '10px', fontSize: 13, lineHeight: 1.55 },
  cbtOpt: { display: 'flex', alignItems: 'center', justifyContent: 'center', borderLeft: '1px solid #eef1f6', padding: '6px 0' },
  cbtBtn: (a, k, s) => ({
    width: 42, height: 42, borderRadius: '50%',
    border: s && k ? '2px solid #16a34a' : a ? '2px solid #7C3AED' : '2px solid #cbd5e1',
    background: s && k ? '#f0fdf4' : a ? '#7C3AED' : '#fff',
    color: a ? '#fff' : s && k ? '#16a34a' : '#64748b',
    fontWeight: 800, fontSize: 12, cursor: s ? 'default' : 'pointer',
  }),
  opsi: (a, k, s) => ({ display: 'flex', gap: 10, alignItems: 'flex-start', width: '100%', textAlign: 'left', padding: '11px 12px', borderRadius: 10, border: `2px solid ${s && k ? '#16a34a' : s && a ? '#e74c3c' : a ? '#7C3AED' : '#e2e8f0'}`, background: s && k ? '#f0fdf4' : s && a ? '#fef2f2' : a ? '#f5f3ff' : '#fff', fontSize: 13.5, cursor: s ? 'default' : 'pointer', marginBottom: 8 }),
  gambarBox: { background: '#fff', border: '1px solid #e3e6ef', borderRadius: 10, padding: 10, marginBottom: 10 },
  pilihBox: { background: '#eef2ff', border: '1px solid #c7d2fe', borderRadius: 10, padding: '10px 12px', marginTop: 10 },
  pilihItem: { fontSize: 12.5, color: '#1e293b', lineHeight: 1.6, padding: '2px 0' },
  hintKunci: { fontSize: 11.5, color: '#64748b', marginTop: 6, lineHeight: 1.5 },
};

export default function LiveSessionStudent() {
  const siswaId = localStorage.getItem('studentId') || localStorage.getItem('studentNim') || '';
  const nama = localStorage.getItem('studentName') || 'Siswa';
  const [kode, setKode] = useState(() => {
    try { return new URLSearchParams(window.location.search).get('kode') || ''; } catch { return ''; }
  });
  const [sesi, setSesi] = useState(null);
  const [babHtml, setBabHtml] = useState('');
  const [pilih, setPilih] = useState(null);
  const [terkirim, setTerkirim] = useState({});
  const [err, setErr] = useState('');
  const kirimGuard = useRef({});

  useEffect(() => {
    if (!sesi) return undefined;
    const u = dengarSesi(sesi.id, (s) => { if (s) setSesi(s); });
    return u;
  }, [sesi && sesi.id]);

  useEffect(() => {
    if (!sesi || !siswaId) return undefined;
    let hidup = true;
    (async () => {
      try {
        const sn = await getDocs(collection(db, 'sesi_kelas', sesi.id, 'jawaban'));
        if (!hidup) return;
        const map = {};
        sn.forEach((d) => {
          const j = d.data();
          if (j.siswaId === siswaId && j.soalIdx != null) map[j.soalIdx] = !!j.benar;
        });
        setTerkirim((t) => ({ ...t, ...map }));
      } catch (e) { /* abaikan */ }
    })();
    return () => { hidup = false; };
  }, [sesi && sesi.id, siswaId]);

  useEffect(() => {
    if (!sesi || sesi.mode !== 'materi' || !sesi.babId) return;
    (async () => {
      try {
        const s = await getDoc(doc(db, 'buku_digital', sesi.bukuId, 'bab', sesi.babId));
        if (s.exists()) setBabHtml(s.data().html || '');
      } catch (e) {}
    })();
  }, [sesi && sesi.id, sesi && sesi.mode]);

  useEffect(() => { setPilih(null); }, [sesi && sesi.slideAktif, sesi && sesi.soalAktif]);

  const slides = useMemo(() => (babHtml ? parseSlides(babHtml) : []), [babHtml]);
  const soalDariHtml = useMemo(() => (babHtml ? parseDaftarSoal(babHtml) : []), [babHtml]);

  const daftarSoal = sesi ? (sesi.daftarSoal || []) : [];
  const slideNow = slides[sesi ? (sesi.slideAktif || 0) : 0] || null;
  const soal = sesi && sesi.mode === 'materi'
    ? (slideNow && slideNow.tipe === 'soal' ? daftarSoal[slideNow.soalIdx] : null)
    : (sesi && sesi.soalAktif != null ? daftarSoal[sesi.soalAktif] : null);
  const idxSoal = sesi && sesi.mode === 'materi' ? (slideNow ? slideNow.soalIdx : null) : (sesi ? sesi.soalAktif : null);
  const sudah = idxSoal != null ? terkirim[idxSoal] !== undefined : false;
  const terbuka = sesi ? !!sesi.kunciTerbuka : false;
  const gambarNow = soal ? ((soalDariHtml[idxSoal] || {}).gambarHtml || soal.gambarHtml || '') : '';
  const pembahasanHtmlNow = soal ? (soal.pembahasanHtml || (soalDariHtml[idxSoal] || {}).pembahasanHtml || '') : '';

  async function gabung() {
    setErr('');
    const s = await cariSesiByKode(kode);
    if (!s) { setErr('Kode tidak ditemukan / sesi sudah berakhir.'); return; }
    await gabungSesi(s.id, siswaId, nama);
    setSesi(s);
  }

  async function kirimNow(jw) {
    if (idxSoal == null || !soal) return;
    if (terkirim[idxSoal] !== undefined || kirimGuard.current[idxSoal]) return;
    kirimGuard.current[idxSoal] = true;
    const benar = cekBenar(soal.kunci, jw);
    setTerkirim((t) => ({ ...t, [idxSoal]: benar }));
    try {
      await kirimJawaban(sesi.id, { siswaId, nama, soalIdx: idxSoal, jawaban: jw, benar });
    } catch (e) {
      kirimGuard.current[idxSoal] = false;
    }
  }

  function ringkasPilihan() {
    if (!soal || pilih === null) return null;
    if (soal.kunci?.tipe === 'pg') {
      const i = pilih;
      return <div style={S.pilihItem}>🔒 <b>{String.fromCharCode(65 + i)}.</b> {bersihVerdikt(soal.pilihan[i] || '')}</div>;
    }
    if (soal.kunci?.tipe === 'multi') {
      return (Array.isArray(pilih) ? pilih : []).map((i) => (
        <div key={i} style={S.pilihItem}>🔒 ✓ {bersihVerdikt(soal.pilihan[i] || '')}</div>
      ));
    }
    if (soal.kunci?.tipe === 'bs') {
      return (soal.pernyataan || []).map((p, i) => (
        <div key={i} style={S.pilihItem}>
          🔒 {i + 1}. {bersihVerdikt(p)} → <b>{pilih[i] === true ? 'Benar' : pilih[i] === false ? 'Salah' : '—'}</b>
        </div>
      ));
    }
    return null;
  }

  if (!sesi) {
    return (
      <div style={S.page}>
        <div style={S.card}>
          <h3 style={{ margin: '0 0 10px' }}>🎧 Gabung Sesi Kelas</h3>
          <div style={S.row}>
            <input style={{ ...S.input, width: 150 }} placeholder="KODE" value={kode} onChange={(e) => setKode(e.target.value.toUpperCase())} />
            <button style={{ ...S.btn, width: 'auto' }} onClick={gabung}>Gabung</button>
          </div>
          {err && <div style={{ fontSize: 12, color: '#991b1b', fontWeight: 700 }}>{err}</div>}
          <p style={{ fontSize: 11.5, color: '#64748b', margin: '8px 0 0' }}>
            Kode tampil di proyektor guru, atau tekan tombol GABUNG pada kartu sesi di halaman Buku Digital.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={S.page}>
      <style>{CSS_MODUL}</style>
      <div style={S.card}>
        <div style={S.row}>
          <span style={S.chip}>🔴 {sesi.kode}</span>
          <span style={S.chip}>{sesi.mode === 'materi' ? '📖 Materi Interaktif' : '✍️ Soal & Pembahasan'}</span>
          {sesi.mode === 'materi' && slideNow && <span style={S.chip}>Slide {(sesi.slideAktif || 0) + 1}/{slides.length}</span>}
          {soal && <span style={S.chip}>Soal {idxSoal + 1}/{daftarSoal.length}</span>}
        </div>
      </div>

      {sesi.mode === 'materi' && slideNow && slideNow.tipe !== 'soal' && (
        <div style={S.card}>
          {slideNow.tipe === 'cover' ? (
            <div style={{ textAlign: 'center', padding: '20px 6px' }}>
              <div style={{ fontSize: 10, letterSpacing: 3, color: '#94a3b8', fontWeight: 800 }}>BAB · MATERI</div>
              <h2 style={{ fontSize: 22, margin: '8px 0', color: '#1e293b' }}>{slideNow.judul}</h2>
              <div style={{ display: 'flex', gap: 6, justifyContent: 'center', flexWrap: 'wrap' }}>
                {(slideNow.chips || []).map((c, i) => <span key={i} style={S.chip}>{c}</span>)}
              </div>
            </div>
          ) : (
            <div className="modmod" dangerouslySetInnerHTML={{ __html: slideNow.html }} />
          )}
          <p style={{ fontSize: 11, color: '#94a3b8', margin: '8px 0 0', textAlign: 'center' }}>Ikuti penjelasan guru — slide berpindah dari kendali guru.</p>
        </div>
      )}

      {soal && (
        <div style={S.card}>
          {gambarNow ? (
            <div className="modmod" style={S.gambarBox} dangerouslySetInnerHTML={{ __html: gambarNow }} />
          ) : (
            <div style={{ fontSize: 14, lineHeight: 1.6, marginBottom: 12 }}>{soal.teks}</div>
          )}
          {!gambarNow && soal.gambarUrls && soal.gambarUrls.length > 0 && (
            <div style={{ marginBottom: 10 }}>
              {soal.gambarUrls.map((u, i) => (
                <img key={i} src={u} alt="" style={{ maxWidth: '100%', height: 'auto', borderRadius: 8, marginBottom: 6 }} />
              ))}
            </div>
          )}

          {soal.kunci && soal.kunci.tipe === 'pg' && (soal.pilihan || []).map((p, i) => {
            const sel = pilih === i;
            if (sudah) {
              return (
                <div key={i} style={{ ...S.opsi(sel, terbuka && soal.kunci.pg === i, terbuka), cursor: 'default' }}>
                  <span style={{ fontWeight: 800 }}>{String.fromCharCode(65 + i)}.</span>
                  <span style={{ flex: 1 }}>{bersihVerdikt(p)}</span>
                  {sel && '🔒'}
                  {terbuka && soal.kunci.pg === i && '✅'}
                </div>
              );
            }
            return (
              <button key={i} style={S.opsi(sel, false, false)} disabled={terbuka}
                onClick={() => { setPilih(i); kirimNow(i); }}>
                <span style={{ fontWeight: 800 }}>{String.fromCharCode(65 + i)}.</span>
                <span style={{ flex: 1 }}>{bersihVerdikt(p)}</span>
              </button>
            );
          })}
          {!sudah && !terbuka && soal.kunci && soal.kunci.tipe === 'pg' && (
            <div style={S.hintKunci}>⚡ Ketuk satu jawaban — jawaban langsung terkirim & terkunci, tidak bisa dipindah lagi.</div>
          )}

          {soal.kunci && soal.kunci.tipe === 'multi' && (soal.pilihan || []).map((p, i) => {
            const arr = Array.isArray(pilih) ? pilih : [];
            const a = arr.includes(i);
            const k = terbuka && (soal.kunci.multi || []).includes(i);
            if (sudah) {
              return (
                <div key={i} style={{ ...S.opsi(a, k, terbuka), cursor: 'default' }}>
                  <span style={{ fontWeight: 800, width: 20 }}>{a ? '✓' : ''}</span>
                  <span style={{ flex: 1 }}>{bersihVerdikt(p)}</span>
                  {a && '🔒'}
                  {k && '✅'}
                </div>
              );
            }
            return (
              <button key={i} style={S.opsi(a, false, false)} disabled={terbuka}
                onClick={() => setPilih(a ? arr.filter((x) => x !== i) : [...arr, i])}>
                <span style={{ fontWeight: 800, width: 20 }}>{a ? '✓' : ''}</span>
                <span style={{ flex: 1 }}>{bersihVerdikt(p)}</span>
              </button>
            );
          })}

          {soal.kunci && soal.kunci.tipe === 'bs' && (soal.pernyataan || []).length > 0 && (
            <div style={S.cbt}>
              <div style={S.cbtHead}>
                <span style={S.cbtHeadText}>Pernyataan</span>
                <span style={S.cbtHeadOpt}>Benar</span>
                <span style={S.cbtHeadOpt}>Salah</span>
              </div>
              {(soal.pernyataan || []).map((p, i) => {
                const arr = Array.isArray(pilih) ? [...pilih] : [];
                const kunciB = (soal.kunci.bs || [])[i];
                const sayaSalah = terbuka && arr[i] !== undefined && arr[i] !== kunciB;
                return (
                  <div key={i} style={S.cbtRow(sayaSalah)}>
                    <div style={S.cbtText}>{i + 1}. {bersihVerdikt(p)}</div>
                    <div style={S.cbtOpt}>
                      <button style={S.cbtBtn(arr[i] === true, terbuka && kunciB === true, terbuka)} disabled={sudah || terbuka}
                        onClick={() => { const a = [...(Array.isArray(pilih) ? pilih : [])]; a[i] = true; setPilih(a); }}>B</button>
                    </div>
                    <div style={S.cbtOpt}>
                      <button style={S.cbtBtn(arr[i] === false, terbuka && kunciB === false, terbuka)} disabled={sudah || terbuka}
                        onClick={() => { const a = [...(Array.isArray(pilih) ? pilih : [])]; a[i] = false; setPilih(a); }}>S</button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {soal && !soal.pilihan?.length && !soal.pernyataan?.length && (
            <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 8, padding: 10, fontSize: 12.5, color: '#92400e' }}>
              ⚠️ Opsi soal ini tidak terbaca dari modul. Beri tahu guru — sesi akan dimulai ulang dengan parser yang sudah diperbaiki.
            </div>
          )}

          {!sudah && !terbuka && soal.kunci && soal.kunci.tipe !== 'pg' && (
            <button style={S.btn} disabled={pilih === null || (Array.isArray(pilih) && pilih.length === 0)} onClick={() => kirimNow(pilih)}>📤 Kirim Jawaban</button>
          )}

          {sudah && !terbuka && (
            <div style={S.pilihBox}>
              <div style={{ fontSize: 12, fontWeight: 800, color: '#4338ca', marginBottom: 6 }}>📌 Jawaban Anda (terkunci, tidak bisa diubah):</div>
              {ringkasPilihan()}
              <div style={{ fontSize: 11.5, color: '#64748b', marginTop: 8 }}>
                ⏳ Terkirim — menunggu siswa lain menyelesaikan & penjelasan guru…
              </div>
            </div>
          )}

          {terbuka && (
            <div style={{ fontSize: 12.5, color: sudah ? (terkirim[idxSoal] ? '#166534' : '#991b1b') : '#64748b', fontWeight: 700, marginTop: 8 }}>
              {sudah ? (terkirim[idxSoal] ? '✅ Jawabanmu benar.' : '❌ Jawabanmu belum tepat — simak pembahasan guru.') : 'Kunci dibuka guru — soal ini sudah tidak bisa dijawab.'}
            </div>
          )}

          {terbuka && pembahasanHtmlNow && (
            <details style={{ marginTop: 10 }}>
              <summary style={{ cursor: 'pointer', color: '#7C3AED', fontSize: 12, fontWeight: 700 }}>📖 Lihat pembahasan lengkap (tabel & gambar)</summary>
              <div
                className="modmod"
                style={{ background: '#fbfcff', border: '1px solid #eef1f6', borderRadius: 10, padding: 10, marginTop: 6 }}
                dangerouslySetInnerHTML={{ __html: pembahasanHtmlNow }}
              />
            </details>
          )}
        </div>
      )}

      {sesi.mode === 'materi' && !slideNow && <div style={S.card}>Menunggu slide dari guru…</div>}
      {sesi.mode === 'bank' && !soal && <div style={S.card}>Menunggu soal dari guru…</div>}
    </div>
  );
}