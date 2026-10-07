// src/components/TeksSoalBergambar.jsx
// ============================================================
// Merender badan soal dengan gambar DI POSISI placeholder-nya.
//
// Sebelum komponen ini ada (2026-10-06), lima tempat render menumpuk
// gambar di AKHIR teks dan membiarkan token {{GAMBAR}} tercetak mentah
// di kalimat -- siswa membaca "perhatikan gambar {{GAMBAR}} di atas"
// tanpa gambar di tempat yang ditunjuk. Kontrak placeholder itu sendiri
// sudah ada di pipeline impor; yang belum ada adalah pembacanya.
//
// Logika penempatan hidup di src/utils/penempatanGambar.js (murni,
// teruji); komponen ini hanya urusan menampilkan, supaya lima tempat
// (try out siswa, tinjau tentor, hasil admin, dan mesin cetak) memakai
// satu perilaku yang sama.
// ============================================================

import RenderMath from './RenderMath';
import { pisahTeksDanGambar } from '../utils/penempatanGambar';
// 🔥 BARU (2026-10-07): jaring pengaman tampilan -- dokumen bank_soal yang
// telanjur tersimpan dengan src bungkus markdown "[url](url)" (keluhan
// owner "gambar dari Gemini gak muncul") tetap bisa ditampilkan karena
// bungkusnya dilepas tepat sebelum <img> dirender.
import { lepasBungkusanSrcGambar } from '../utils/normalisasiSrcGambar';

export default function TeksSoalBergambar({
  teks,
  gambarUrls = [],
  gambarMeta = null,
  region = 'badan',
  onKlikGambar = null,
  gayaTeks = {},
  gayaGambar = {},
}) {
  const segmen = pisahTeksDanGambar(teks, gambarUrls, { meta: gambarMeta, region });
  const gayaGambarFinal = {
    display: 'block',
    maxWidth: '100%',
    maxHeight: 300,
    borderRadius: 10,
    border: '1px solid #e2e8f0',
    margin: '8px 0',
    ...gayaGambar,
  };

  return (
    <>
      {segmen.map((sg, i) => {
        if (sg.jenis === 'teks') {
          return (
            <div key={i} style={{ fontSize: 13, color: '#1e293b', lineHeight: 1.6, whiteSpace: 'pre-wrap', textAlign: 'left', ...gayaTeks }}>
              <RenderMath text={sg.isi} />
            </div>
          );
        }
        const urlBersih = lepasBungkusanSrcGambar(sg.url);
        return (
          <img
            key={i}
            src={urlBersih}
            alt={`Gambar soal ${sg.indeks + 1}`}
            onClick={onKlikGambar ? () => onKlikGambar(urlBersih) : undefined}
            title={onKlikGambar ? 'Klik untuk memperbesar' : undefined}
            style={{ ...gayaGambarFinal, cursor: onKlikGambar ? 'zoom-in' : 'default' }}
          />
        );
      })}
    </>
  );
}
