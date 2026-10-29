// src/pages/admin/bank-soal/PeriksaBerkasPage.jsx
// ============================================================
// HALAMAN PERIKSA BERKAS (2026-10-28, keputusan owner): validasi berkas
// pihak ketiga SEBELUM diunggah ke impor, supaya "kerja dua kali" dan
// penolakan di tengah jalan hilang dari alur harian.
//
// Memakai mesin yang SAMA PERSIS dengan impor: parseTemplatBaris /
// parseHTMLMaster / parseJSON lalu normalizeSoal (diekspor dari
// ImportHasilScanPage) + gerbang kelayakan & LaTeX di dalamnya. Tidak
// menulis apa pun ke Firestore: murni pemeriksaan.
// ============================================================
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import SidebarAdmin from '../../../components/SidebarAdmin';
import { looksLikeTemplatBaris, parseTemplatBaris, SKEMA_TEMPLAT_BARIS } from '../../../utils/templatBaris';
import { normalizeSoal, isiUlangBacaanSegrup } from './ImportHasilScanPage';
import { deteksiBacaanTertanam } from '../../../utils/deteksiBacaanTertanam';
import { bangunPromptKoreksi } from '../../../utils/promptKoreksiImpor';

const S = {
  wrap: { display: 'flex', minHeight: '100vh', background: '#f1f5f9' },
  main: { flex: 1, padding: '24px 28px', boxSizing: 'border-box' },
  h1: { fontSize: 20, fontWeight: 800, color: '#0f172a', margin: '0 0 4px' },
  sub: { fontSize: 12.5, color: '#64748b', margin: '0 0 16px', lineHeight: 1.6 },
  kartu: { background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: '14px 16px', marginBottom: 14 },
  ta: { width: '100%', minHeight: 180, boxSizing: 'border-box', padding: 10, borderRadius: 8, border: '1px solid #cbd5e1', fontFamily: 'ui-monospace, Menlo, monospace', fontSize: 11.5, lineHeight: 1.6 },
  btn: { padding: '9px 14px', borderRadius: 8, border: 'none', background: '#4f46e5', color: '#fff', fontWeight: 700, fontSize: 12.5, cursor: 'pointer', marginRight: 8 },
  btn2: { padding: '9px 14px', borderRadius: 8, border: '1px solid #e2e8f0', background: '#fff', color: '#475569', fontWeight: 700, fontSize: 12.5, cursor: 'pointer' },
  ok: { background: '#f0fdf4', border: '1px solid #bbf7d0', color: '#166534', borderRadius: 10, padding: '10px 12px', fontSize: 12.5, fontWeight: 700 },
  buruk: { background: '#fef2f2', border: '1px solid #fecaca', color: '#991b1b', borderRadius: 10, padding: '10px 12px', fontSize: 12.5 },
  waspada: { background: '#fffbeb', border: '1px solid #fde68a', color: '#92400e', borderRadius: 10, padding: '10px 12px', fontSize: 12.5 },
  li: { margin: '3px 0', lineHeight: 1.55 },
  kecil: { fontSize: 11, color: '#64748b', lineHeight: 1.6 },
};

export default function PeriksaBerkasPage() {
  const navigate = useNavigate();
  const [input, setInput] = useState('');
  const [sumber, setSumber] = useState('');
  const [laporan, setLaporan] = useState(null);
  const [promptKoreksi, setPromptKoreksi] = useState('');
  const [tersalin, setTersalin] = useState(false);

  const periksa = () => {
    const lap = { format: null, errorParse: [], butir: [], bacaanTertanam: [] };
    const isi = input.trim();
    if (!isi) { setLaporan({ ...lap, errorParse: [{ baris: 0, pesan: 'tempel atau pilih berkas dulu' }] }); return; }
    let mentah = null;
    try {
      if (looksLikeTemplatBaris(isi)) {
        lap.format = `templat baris (${SKEMA_TEMPLAT_BARIS})`;
        const t = parseTemplatBaris(isi);
        lap.errorParse = t.errors;
        mentah = t.soal;
      } else if (/<article|data-gemilang-question/i.test(isi) || /^[{[]/.test(isi)) {
        // Format legacy (dialek HTML / JSON): mesin pemeriksanya SAMA, tapi
        // hidupnya di halaman impor; di sini kita menolak menebak ulang.
        lap.format = 'legacy (HTML dialek lama / JSON)';
        lap.errorParse = [{
          baris: 0,
          pesan: 'Format legacy. Pemeriksaan penuh tetap tersedia di halaman Impor Buku & Soal (AI) '
            + 'dengan mesin yang sama; halaman ini sengaja fokus pada kontrak resmi templat baris '
            + SKEMA_TEMPLAT_BARIS + '. Konversikan keluaran pihak ketiga ke templat baris supaya '
            + 'validasi bisa dilakukan sebelum unggah.',
        }];
      } else {
        lap.errorParse = [{ baris: 0, pesan: 'format tidak dikenali: bukan templat baris, HTML dialek, maupun JSON' }];
      }
    } catch (e) {
      lap.errorParse = [{ baris: 0, pesan: String(e.message || e) }];
    }
    if (mentah && Array.isArray(mentah)) {
      // 🔥 2026-10-29: (1) isi ulang bacaan segrup PERSIS seperti jalur impor
      // sungguhan (GRUP-BACAAN tanpa BACAAN diisi dari master grup), supaya
      // pratinjau = hasil impor; (2) deteksi wacana yang TERTANAM di teks_soal
      // (pihak ketiga tidak patuh kontrak) — peringatan, bukan penolakan.
      lap.butir = isiUlangBacaanSegrup(mentah.map((q, i) => normalizeSoal(q, i)));
      lap.bacaanTertanam = deteksiBacaanTertanam(lap.butir);
    }
    setLaporan(lap);
    setPromptKoreksi('');
  };

  const buatKoreksi = () => {
    if (!laporan) return;
    const invalid = laporan.butir.filter((q) => !q.valid);
    setPromptKoreksi(bangunPromptKoreksi(invalid, { sumber, total: laporan.butir.length }));
  };

  const salin = async () => {
    try {
      await navigator.clipboard.writeText(promptKoreksi);
      setTersalin(true);
      setTimeout(() => setTersalin(false), 2000);
    } catch (_e) { setTersalin(false); }
  };

  const tertolak = laporan ? laporan.butir.filter((q) => !q.valid) : [];
  const layak = laporan ? laporan.butir.filter((q) => q.valid) : [];

  return (
    <div style={S.wrap}>
      <SidebarAdmin />
      <div style={S.main}>
        <button type="button" style={S.btn2} onClick={() => navigate('/admin/bank-soal/import')}>← Kembali ke Impor</button>
        <h1 style={{ ...S.h1, marginTop: 12 }}>🔍 Periksa Berkas Pihak Ketiga</h1>
        <p style={S.sub}>
          Tempel keluaran AI pihak ketiga DI SINI dulu sebelum mengunggah ke impor.
          Pemeriksaan memakai mesin yang sama persis dengan impor (parse → normalisasi →
          gerbang kelayakan & LaTeX) tetapi TIDAK menyimpan apa pun. Format patokan:
          templat baris <code>{SKEMA_TEMPLAT_BARIS}</code>; HTML dialek lama masih dibaca
          sebagai legacy.
        </p>

        <div style={S.kartu}>
          <input type="file" accept=".txt,.md,.json,.html,.htm" onChange={(e) => {
            const f = e.target.files?.[0];
            if (!f) return;
            setSumber(f.name);
            const r = new FileReader();
            r.onload = () => setInput(String(r.result || ''));
            r.readAsText(f, 'UTF-8');
          }} style={{ fontSize: 12 }} />
          <div style={{ ...S.kecil, marginTop: 6 }}>berkas: {sumber || '(tempelan manual)'}</div>
          <textarea style={{ ...S.ta, marginTop: 8 }} value={input} onChange={(e) => setInput(e.target.value)} placeholder={'SKEMA: gemilang-baris@1\n##SOAL 1\nTIPE: pg_sederhana\nKUNCI: A\nGRUP-BACAAN: bacaan_1   (opsional, sama untuk soal segolongan)\nBACAAN:                 (opsional, wacana bersama di baris berikut)\n...\nTEKS:\n... (pertanyaannya saja)\nOPSI:\n- ...\n- ...\nPEMBAHASAN:\n...'} />
          <div style={{ marginTop: 10 }}>
            <button type="button" style={S.btn} onClick={periksa}>Periksa sekarang</button>
            <button type="button" style={S.btn2} onClick={() => { setInput(''); setLaporan(null); setPromptKoreksi(''); }}>Bersihkan</button>
          </div>
        </div>

        {laporan && (
          <div style={S.kartu}>
            <div style={{ fontSize: 12.5, marginBottom: 8 }}>
              Format terbaca: <b>{laporan.format || 'tidak dikenal'}</b>
            </div>
            {laporan.errorParse.length > 0 && (
              <div style={S.buruk}>
                <b>Kesalahan struktur berkas ({laporan.errorParse.length}):</b>
                <ul style={{ margin: '6px 0 0', paddingLeft: 18 }}>
                  {laporan.errorParse.slice(0, 20).map((e, i) => (
                    <li key={i} style={S.li}>{e.baris ? `baris ${e.baris}: ` : ''}{e.pesan}</li>
                  ))}
                </ul>
              </div>
            )}
            {laporan.bacaanTertanam.length > 0 && (
              <div style={{ ...S.waspada, marginTop: 10 }}>
                <b>⚠️ Wacana bersama tertanam di TEKS ({laporan.bacaanTertanam.length} kelompok):</b>
                <ul style={{ margin: '6px 0 0', paddingLeft: 18 }}>
                  {laporan.bacaanTertanam.slice(0, 12).map((t, i) => (
                    <li key={i} style={S.li}>
                      Soal #{t.nomor[0]}–#{t.nomor[t.nomor.length - 1]} ({t.jumlahSoal} butir) berbagi awalan teks identik ±{t.panjangAwalan} karakter
                      tanpa field BACAAN terpisah — “{t.contohAwalan}”.
                    </li>
                  ))}
                </ul>
                <div style={{ ...S.kecil, marginTop: 6 }}>
                  Akibatnya saat dicetak wacana akan TERULANG di setiap nomor dan sistem tidak bisa mengelompokkannya
                  (boros kertas, siswa membaca teks sama berkali-kali). Perbaikan: minta pihak ketiga memindahkan wacana
                  ke field <code>BACAAN:</code> dengan <code>GRUP-BACAAN:</code> yang sama untuk semua soal segolongan,
                  dan <code>TEKS:</code> cukup pertanyaannya saja. Ini peringatan — berkas tetap bisa disimpan apa adanya.
                </div>
              </div>
            )}
            {laporan.butir.length > 0 && (
              <div style={{ marginTop: 10 }}>
                <div style={tertolak.length === 0 ? S.ok : S.buruk}>
                  {layak.length} butir layak simpan · {tertolak.length} butir tertolak gerbang.
                  {tertolak.length === 0 ? ' Berkas siap diunggah ke impor.' : ' Perbaiki dulu, atau kirim prompt koreksi ke pihak ketiga.'}
                </div>
                {tertolak.length > 0 && (
                  <ul style={{ marginTop: 8, paddingLeft: 18, fontSize: 12, color: '#7f1d1d' }}>
                    {tertolak.slice(0, 25).map((q, i) => (
                      <li key={i} style={S.li}>
                        <b>Soal #{q.nomor ?? i + 1}</b>: {(q.errors || []).join(' · ')}
                      </li>
                    ))}
                  </ul>
                )}
                <div style={{ marginTop: 10 }}>
                  <button type="button" style={S.btn} onClick={buatKoreksi} disabled={tertolak.length === 0}>📋 Buat prompt koreksi</button>
                  {promptKoreksi && (
                    <button type="button" style={S.btn2} onClick={salin}>{tersalin ? '✅ Tersalin' : 'Salin prompt koreksi'}</button>
                  )}
                </div>
                {promptKoreksi && (
                  <pre style={{ ...S.ta, minHeight: 120, marginTop: 8, whiteSpace: 'pre-wrap' }}>{promptKoreksi}</pre>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
