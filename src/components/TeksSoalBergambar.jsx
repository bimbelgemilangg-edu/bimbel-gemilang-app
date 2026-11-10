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
import RenderTable from './RenderTable';
import { pisahTeksDanGambar } from '../utils/penempatanGambar';
import { GAYA_TEKS_NASKAH } from '../styles/naskahSoal';
import { lepasBungkusanSrcGambar } from '../utils/normalisasiSrcGambar';
import { ekstrakUrlGambar, gambarButirDari } from '../utils/fieldButirSoal';

export default function TeksSoalBergambar({
  teks,
  gambarUrls = [],
  gambarMeta = null,
  tabelSoal = null,
  tabel_soal = null,
  tabel = null,
  region = 'badan',
  onKlikGambar = null,
  gayaTeks = {},
  gayaGambar = {},
  soal = null,
}) {
  const tabelData = tabelSoal || tabel_soal || tabel || (soal ? (soal.tabelSoal || soal.tabel_soal || soal.tabel) : null);

  // Ambil daftar URL secara tangguh dari array string, array object, single object, atau objek soal
  let listUrls = ekstrakUrlGambar(gambarUrls);
  if (!listUrls.length && soal) {
    listUrls = gambarButirDari(soal);
  }

  const teksAkhir = teks !== undefined && teks !== null ? String(teks) : (soal ? (soal.teksSoal || soal.soal || soal.teks_soal || '') : '');

  const segmen = pisahTeksDanGambar(teksAkhir, listUrls, {
    meta: gambarMeta,
    region,
    posisiSisa: region === 'bacaan' ? 'awal' : undefined,
  });
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
            <div key={i} style={{ ...GAYA_TEKS_NASKAH, whiteSpace: 'pre-wrap', ...gayaTeks }}>
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
      {tabelData && <RenderTable table={tabelData} />}
    </>
  );
}
