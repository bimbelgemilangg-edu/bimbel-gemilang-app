// src/components/admin/KartuBacaSoalLengkap.jsx
// ============================================================
// KARTU BACA PENUH (read-only) untuk keputusan manusia.
// ============================================================
// Owner 2026-10-08, melihat halaman Bersihkan Soal: "bisa gak itu aku baca
// soal full biar tahu". Daftar pembersih dulu hanya menampilkan SATU BARIS
// teks terpotong (nowrap + ellipsis) — mustahil menilai apakah dua butir
// benar-benar kembar, apalagi melihat bahwa poster keduanya berbeda.
//
// Komponen ini merender butir APA ADANYA supaya bisa dihakimi mata manusia:
// bacaan/wacana (bila ada), teks soal + gambar di posisi placeholder-nya,
// pilihan beserta gambarnya, pernyataan/pg_kompleks, tabel benar-salah,
// pasangan menjodohkan, kunci, dan pembahasan.
//
// Read-only SENGAJA: tidak ada checkbox, tidak ada tombol hapus di sini.
// Keputusan menghapus tetap hidup di baris induknya, supaya satu komponen
// tidak memegang dua wewenang sekaligus.
// ============================================================

import React from 'react';
import { teksKeHtml } from '../../utils/naskahSoal';
import { pisahTeksDanGambar } from '../../utils/penempatanGambar';
import { teksSoalDari, bacaanDari } from '../../utils/fieldButirSoal';
import { opsiTampilDari } from '../../utils/bersihkanGlifKunci.js';

const gaya = {
  wadah: {
    border: '1px solid #e2e8f0', background: '#fff', borderRadius: 10,
    padding: '10px 12px', marginTop: 6, marginBottom: 6,
  },
  label: { fontSize: 10, fontWeight: 800, letterSpacing: 0.4, textTransform: 'uppercase', color: '#94a3b8', marginBottom: 4 },
  teks: { fontSize: 12.5, lineHeight: 1.7, color: '#0f172a', overflowWrap: 'break-word' },
  gambar: { maxWidth: '100%', maxHeight: 260, border: '1px solid #cbd5e1', borderRadius: 8, margin: '6px 0', display: 'block' },
  bacaan: {
    borderLeft: '3px solid #94a3b8', background: '#f8fafc', borderRadius: 8,
    padding: '8px 10px', marginBottom: 8, fontSize: 12, lineHeight: 1.7,
    color: '#1e293b', textAlign: 'justify',
  },
  opsi: { fontSize: 12, color: '#1e293b', padding: '2px 0', lineHeight: 1.6 },
  kotak: (warna, teks) => ({
    marginTop: 8, padding: '7px 10px', borderRadius: 8, fontSize: 12,
    background: warna === 'hijau' ? '#f0fdf4' : '#f8fafc',
    border: `1px solid ${warna === 'hijau' ? '#bbf7d0' : '#e2e8f0'}`,
    color: teks, lineHeight: 1.6,
  }),
};

function Segmen({ daftar, alt }) {
  return daftar.map((sg, i) => (sg.jenis === 'teks'
    ? <div key={i} style={gaya.teks} dangerouslySetInnerHTML={{ __html: teksKeHtml(sg.isi) }} />
    : <img key={i} src={sg.url} alt={alt} style={gaya.gambar} />));
}

export default function KartuBacaSoalLengkap({ soal, tanpaKunci = false }) {
  if (!soal) return null;
  const bacaan = bacaanDari(soal);
  const segmen = pisahTeksDanGambar(teksSoalDari(soal), soal?.gambarUrls);
  const opsi = opsiTampilDari(soal);
  const pernyataan = Array.isArray(soal?.pernyataan) ? soal.pernyataan : [];
  const tabel = Array.isArray(soal?.tabelBenarSalah) ? soal.tabelBenarSalah : [];
  const pasangan = Array.isArray(soal?.pasangan) ? soal.pasangan : [];
  const kunci = Array.isArray(soal?.kunciJawaban) ? soal.kunciJawaban.join(', ') : String(soal?.kunciJawaban ?? '');
  const pembahasan = String(soal?.pembahasan || '').trim();

  return (
    <div style={gaya.wadah}>
      {bacaan && (
        <div style={gaya.bacaan}>
          <div style={gaya.label}>Bacaan / wacana{bacaan.rentang ? ` · untuk soal ${bacaan.rentang.dari}–${bacaan.rentang.sampai}` : ''}</div>
          <Segmen daftar={pisahTeksDanGambar(bacaan.teks, bacaan.gambar)} alt="Gambar bacaan" />
        </div>
      )}

      <div style={gaya.label}>Soal</div>
      <Segmen daftar={segmen} alt="Gambar soal" />

      {opsi.length > 0 && (
        <>
          <div style={{ ...gaya.label, marginTop: 8 }}>Pilihan</div>
          {opsi.map((o, i) => {
            const huruf = String.fromCharCode(65 + i);
            const teks = typeof o === 'string' ? o : (o?.teks || '');
            const gbr = (o && typeof o === 'object' && Array.isArray(o.gambar)) ? o.gambar : [];
            return (
              <div key={i} style={gaya.opsi}>
                <b>({huruf})</b> <span dangerouslySetInnerHTML={{ __html: teksKeHtml(teks) }} />
                {gbr.map((g, j) => (g?.uploadedUrl || g?.url
                  ? <img key={j} src={g.uploadedUrl || g.url} alt={`Gambar pilihan ${huruf}`} style={{ ...gaya.gambar, maxHeight: 140, display: 'inline-block', verticalAlign: 'middle', marginLeft: 6 }} />
                  : null))}
              </div>
            );
          })}
        </>
      )}

      {pernyataan.length > 0 && (
        <>
          <div style={{ ...gaya.label, marginTop: 8 }}>Pernyataan</div>
          {pernyataan.map((p, i) => (
            <div key={i} style={gaya.opsi}>
              <b>({String.fromCharCode(65 + i)})</b>{' '}
              <span dangerouslySetInnerHTML={{ __html: teksKeHtml(typeof p === 'string' ? p : (p?.teks || '')) }} />
            </div>
          ))}
        </>
      )}

      {tabel.length > 0 && (
        <>
          <div style={{ ...gaya.label, marginTop: 8 }}>Tabel benar / salah</div>
          {tabel.map((b, i) => (
            <div key={i} style={gaya.opsi}>
              {i + 1}. <span dangerouslySetInnerHTML={{ __html: teksKeHtml(String(b?.pernyataan || '')) }} />
              {!tanpaKunci && b?.kunci ? <b style={{ color: '#166534' }}> — {String(b.kunci).toUpperCase()}</b> : null}
            </div>
          ))}
        </>
      )}

      {pasangan.length > 0 && (
        <>
          <div style={{ ...gaya.label, marginTop: 8 }}>Pasangan menjodohkan</div>
          {pasangan.map((p, i) => (
            <div key={i} style={gaya.opsi}>
              {i + 1}. <span dangerouslySetInnerHTML={{ __html: teksKeHtml(String(p?.kiri || '')) }} />
              {' ↔ '}
              <span dangerouslySetInnerHTML={{ __html: teksKeHtml(String(p?.kanan || '')) }} />
            </div>
          ))}
        </>
      )}

      {!tanpaKunci && kunci && (
        <div style={gaya.kotak('hijau', '#166534')}>
          <b>Kunci:</b> {kunci}
          {soal?.kunciTerverifikasi === false ? ' (belum terverifikasi)' : ''}
        </div>
      )}

      {!tanpaKunci && pembahasan && (
        <div style={gaya.kotak('abu', '#334155')}>
          <b>Pembahasan{soal?.pembahasanAsal === 'penalaran' ? ' (hasil penalaran AI — periksa dulu)' : ''}:</b>{' '}
          <span dangerouslySetInnerHTML={{ __html: teksKeHtml(pembahasan) }} />
        </div>
      )}
    </div>
  );
}
