// src/components/guru/KartuKeranjangSoal.jsx
// ============================================================
// KARTU BACA KERANJANG TENTOR — soal lengkap + gambar + watermark logo.
// ============================================================
// Permintaan owner 2026-10-08: "keranjang itu kotak-kotak kartu berisi
// soal di dalamnya lengkap gambarnya, jadi dibaca dahulu, tetapi tetap
// ada watermark logo Gemilang di belakangnya."
//
// Kartu ini dipakai di panel keranjang Cetak Latihan. Isinya:
//   teks soal lengkap (bukan potongan 110 huruf), gambar di badan soal,
//   pilihan beserta gambarnya, kunci yang ditandai, pembahasan, dan
//   bendera mutu (kunci hasil AI, pembahasan hasil penalaran model,
//   figur menunggu potongan presisi).
//
// WATERMARK
// Logonya `/pwa-192x192.png` — berkas yang sama dengan yang dipakai
// kwitansi (`src/utils/kwitansi.js`), supaya satu identitas di semua
// dokumen Gemilang. Ditaruh di lapisan belakang (z-index 0, opacity
// rendah, `pointer-events: none`) sehingga TIDAK PERNAH menghalangi klik
// atau menutupi teks. `aria-hidden` karena ia hiasan, bukan konten.
//
// Ukuran sengaja ±150px: logo aslinya 192px, jadi tidak diperbesar
// melampaui resolusi berkasnya (tidak pecah di layar retina).
// ============================================================

import React from 'react';
import { Trash2, ArrowUp, ArrowDown, AlertTriangle, KeyRound, BookOpen } from 'lucide-react';
import { teksKeHtml } from '../../utils/naskahSoal';
import { pisahTeksDanGambar } from '../../utils/penempatanGambar';
import { teksSoalDari, identitasDari, benderaButir } from '../../utils/keranjangSoalGuru';

const LOGO = '/pwa-192x192.png';

const gaya = {
  kartu: {
    position: 'relative',
    overflow: 'hidden',
    border: '1.5px solid #ddd6fe',
    borderRadius: 14,
    background: '#fff',
    marginBottom: 12,
    boxShadow: '0 1px 2px rgba(15,23,42,0.05)',
  },
  watermark: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: 150,
    height: 150,
    opacity: 0.07,
    pointerEvents: 'none',
    zIndex: 0,
    objectFit: 'contain',
  },
  isi: { position: 'relative', zIndex: 1, padding: '12px 14px' },
  kepala: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
    gap: 10, marginBottom: 8, flexWrap: 'wrap',
  },
  nomor: {
    background: '#5B2ECC', color: '#fff', borderRadius: 8,
    padding: '3px 9px', fontSize: 12, fontWeight: 800, flexShrink: 0,
  },
  identitas: { fontSize: 11, color: '#64748b', lineHeight: 1.5 },
  teks: { fontSize: 13, lineHeight: 1.65, color: '#0f172a' },
  gambar: {
    maxWidth: '100%', maxHeight: 220, border: '1px solid #cbd5e1',
    borderRadius: 8, margin: '6px 0', display: 'block',
  },
  opsi: { fontSize: 12.5, color: '#1e293b', padding: '3px 0', lineHeight: 1.55 },
  tombol: {
    border: '1px solid #e2e8f0', background: '#fff', borderRadius: 7,
    padding: '4px 7px', cursor: 'pointer', display: 'inline-flex',
    alignItems: 'center', gap: 4, fontSize: 11, color: '#475569',
  },
  kunci: {
    marginTop: 9, padding: '8px 10px', borderRadius: 9,
    background: '#f0fdf4', border: '1px solid #bbf7d0', fontSize: 12, color: '#166534',
    display: 'flex', gap: 7, alignItems: 'flex-start',
  },
  bahas: {
    marginTop: 8, padding: '8px 10px', borderRadius: 9,
    background: '#f8fafc', border: '1px solid #e2e8f0', fontSize: 12,
    color: '#334155', lineHeight: 1.6,
  },
  bendera: {
    marginTop: 8, padding: '7px 10px', borderRadius: 9,
    background: '#fffbeb', border: '1px solid #fde68a', fontSize: 11.5, color: '#92400e',
    display: 'flex', gap: 7, alignItems: 'flex-start', lineHeight: 1.55,
  },
};

/**
 * @param {object} p
 * @param {object} p.soal        butir bank soal (disimpan utuh di keranjang)
 * @param {number} p.nomor       nomor urut dalam keranjang (= nomor naskah cetak)
 * @param {number} p.jumlah      panjang keranjang, untuk mematikan tombol naik/turun di ujung
 * @param {boolean} [p.tanpaKunci] sembunyikan kunci & pembahasan (mode lembar siswa)
 * @param {Function} [p.onHapus]
 * @param {Function} [p.onNaik]
 * @param {Function} [p.onTurun]
 */
export default function KartuKeranjangSoal({ soal, nomor, jumlah = 0, tanpaKunci = false, onHapus, onNaik, onTurun }) {
  if (!soal) return null;
  const identitas = identitasDari(soal);
  const bendera = benderaButir(soal);
  const segmen = pisahTeksDanGambar(teksSoalDari(soal), soal?.gambarUrls);
  const opsi = Array.isArray(soal?.opsiJawaban) ? soal.opsiJawaban : [];
  const pernyataan = Array.isArray(soal?.pernyataan) ? soal.pernyataan : [];
  const tabelBS = Array.isArray(soal?.tabelBenarSalah) ? soal.tabelBenarSalah : [];
  const pasangan = Array.isArray(soal?.pasangan) ? soal.pasangan : [];
  const gambarButir = Array.isArray(soal?.gambarUrls) ? soal.gambarUrls.filter(Boolean) : [];

  const kunci = Array.isArray(soal?.kunciJawaban) ? soal.kunciJawaban.join(', ') : String(soal?.kunciJawaban ?? '');
  const pembahasan = String(soal?.pembahasan || '').trim();
  const penalaran = soal?.pembahasanAsal === 'penalaran';

  return (
    <div style={gaya.kartu}>
      {/* watermark di lapisan belakang: tidak menghalangi klik, tidak menutupi teks */}
      <img src={LOGO} alt="" aria-hidden="true" style={gaya.watermark} />

      <div style={gaya.isi}>
        <div style={gaya.kepala}>
          <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start', flexWrap: 'wrap' }}>
            <span style={gaya.nomor}>No. {nomor}</span>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#5B2ECC' }}>
                {String(soal?.tipe || 'pg_sederhana').replace(/_/g, ' ')}
              </div>
              <div style={gaya.identitas}>
                {identitas.mapel} · {identitas.jenjang}
                {identitas.kelas ? ` · kelas ${identitas.kelas}` : ''}
                {' · '}<b>{identitas.materi}</b>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 5 }}>
            <button type="button" style={gaya.tombol} title="Naikkan urutan" disabled={nomor <= 1} onClick={onNaik}>
              <ArrowUp size={13} />
            </button>
            <button type="button" style={gaya.tombol} title="Turunkan urutan" disabled={jumlah > 0 && nomor >= jumlah} onClick={onTurun}>
              <ArrowDown size={13} />
            </button>
            <button type="button" style={{ ...gaya.tombol, color: '#b91c1c', borderColor: '#fecaca' }} title="Keluarkan dari keranjang" onClick={onHapus}>
              <Trash2 size={13} />
            </button>
          </div>
        </div>

        {/* teks soal + gambar di badan soal */}
        {segmen.map((sg, i) => (sg.jenis === 'teks'
          ? <div key={i} style={gaya.teks} dangerouslySetInnerHTML={{ __html: teksKeHtml(sg.isi) }} />
          : <img key={i} src={sg.url} alt={`Gambar soal nomor ${nomor}`} style={gaya.gambar} />))}

        {/* gambar yang tidak tertanam sebagai placeholder tetap ditampilkan */}
        {segmen.every((sg) => sg.jenis !== 'gambar') && gambarButir.map((url, i) => (
          <img key={i} src={url} alt={`Gambar soal nomor ${nomor}`} style={gaya.gambar} />
        ))}

        {/* pilihan ganda (teks + gambar pilihan) */}
        {opsi.length > 0 && (
          <div style={{ marginTop: 8 }}>
            {opsi.map((o, i) => {
              const huruf = String.fromCharCode(65 + i);
              const teks = typeof o === 'string' ? o : (o?.teks || '');
              const gambarOpsi = (o && typeof o === 'object' && Array.isArray(o.gambar)) ? o.gambar : [];
              return (
                <div key={i} style={gaya.opsi}>
                  <b>({huruf})</b>{' '}
                  <span dangerouslySetInnerHTML={{ __html: teksKeHtml(teks) }} />
                  {gambarOpsi.map((g, j) => (g?.uploadedUrl || g?.url
                    ? <img key={j} src={g.uploadedUrl || g.url} alt={`Gambar pilihan ${huruf}`} style={{ ...gaya.gambar, maxHeight: 110, display: 'inline-block', verticalAlign: 'middle', marginLeft: 6 }} />
                    : null))}
                </div>
              );
            })}
          </div>
        )}

        {/* pg_kompleks: daftar pernyataan */}
        {pernyataan.length > 0 && (
          <div style={{ marginTop: 8 }}>
            {pernyataan.map((p, i) => (
              <div key={i} style={gaya.opsi}>
                <b>({String.fromCharCode(65 + i)})</b>{' '}
                <span dangerouslySetInnerHTML={{ __html: teksKeHtml(typeof p === 'string' ? p : (p?.teks || '')) }} />
              </div>
            ))}
          </div>
        )}

        {/* benar/salah */}
        {tabelBS.length > 0 && (
          <div style={{ marginTop: 8 }}>
            {tabelBS.map((b, i) => (
              <div key={i} style={gaya.opsi}>
                {i + 1}. <span dangerouslySetInnerHTML={{ __html: teksKeHtml(String(b?.pernyataan || '')) }} />
                {!tanpaKunci && b?.kunci ? <b style={{ color: '#166534' }}> — {String(b.kunci).toUpperCase()}</b> : null}
              </div>
            ))}
          </div>
        )}

        {/* menjodohkan */}
        {pasangan.length > 0 && (
          <div style={{ marginTop: 8 }}>
            {pasangan.map((p, i) => (
              <div key={i} style={gaya.opsi}>
                {i + 1}. <span dangerouslySetInnerHTML={{ __html: teksKeHtml(String(p?.kiri || '')) }} />
                {' ↔ '}
                <span dangerouslySetInnerHTML={{ __html: teksKeHtml(String(p?.kanan || '')) }} />
              </div>
            ))}
          </div>
        )}

        {!tanpaKunci && kunci && (
          <div style={gaya.kunci}>
            <KeyRound size={14} style={{ flexShrink: 0, marginTop: 2 }} />
            <span><b>Kunci:</b> {kunci}{soal?.kunciTerverifikasi === false ? ' (belum terverifikasi)' : ''}</span>
          </div>
        )}

        {!tanpaKunci && pembahasan && (
          <div style={gaya.bahas}>
            <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginBottom: 3, fontWeight: 700, fontSize: 11.5, color: '#475569' }}>
              <BookOpen size={13} /> Pembahasan
              {penalaran && <span style={{ background: '#fef3c7', color: '#92400e', borderRadius: 999, padding: '1px 7px', fontSize: 10 }}>hasil penalaran AI — periksa dulu</span>}
            </div>
            <span dangerouslySetInnerHTML={{ __html: teksKeHtml(pembahasan) }} />
          </div>
        )}

        {bendera.length > 0 && (
          <div style={gaya.bendera}>
            <AlertTriangle size={14} style={{ flexShrink: 0, marginTop: 2 }} />
            <span>{bendera.map((b, i) => <span key={i}>{i > 0 ? ' · ' : ''}{b}</span>)}</span>
          </div>
        )}
      </div>
    </div>
  );
}
