// src/components/DialogCetakNaskah.jsx
// ============================================================
// DIALOG "TINGGAL PRINT" buat halaman Terbitkan Try Out.
//
// KENAPA komponen ini ada (2026-10-08, permintaan owner sambil mengirim
// tangkapan layar halaman Terbitkan Try Out: "selain terbit ke siswa
// aku mau kasih tombol print soal yang udah di tata sesuai kanan kiri
// seperti sebelumnya kita diskusikan tinggal print"): dulu naskah model
// ujian dua kolom hanya bisa dicetak dari halaman guru Cetak Paket
// Latihan (pilih bank/bab dulu, centang satu-satu). Owner mau tombol
// cetak ADA DI TEMPAT paket disusun & diterbitkan: satu klik dari kartu
// paket terbit ATAU dari panel keranjang, lalu sistem yang menata kolom,
// ukuran gambar, kepala seksi subtes, dan nomor halaman.
//
// Isinya sengaja ringkas tapi jujur:
//   1. mesin naskah yang SAMA dengan halaman guru (utils/naskahSoal.js)
//      + kepala seksi subtes (utils/seksiNaskahTryOut.js);
//   2. lapisan ukur tersembunyi supaya susunan di pratinjau = susunan
//      yang keluar dari printer (tinggi blok diukur, bukan ditebak);
//   3. dua dokumen: NASKAH SISWA dan KUNCI (pegangan guru, berkepala
//      peringatan) -- dicetak terpisah lewat tombol masing-masing;
//   4. catatan jujur: kalau paket mengacak urutan soal untuk siswa,
//      naskah cetak adalah versi induk (urutan paket) dan nomor di
//      kertas bisa beda dengan nomor di layar siswa.
//
// KENAPA tanpa rantai useMemo: paket try out terbesar sejauh ini
// puluhan butir -- menyusun blok + fragmen naskah hanya beberapa
// milidetik per render, sementara memoisasi manual di sini justru
// ditolak react-hooks/preserve-manual-memoization (React Compiler tidak
// bisa membuktikan array seksi/perkiraan tak pernah dimutasi). Yang
// WAJIB berbenteng hanya dua setter state (tinggi ukur & rasio gambar):
// nilai sama => identitas sama => tidak memicu re-render beruntun.
//
// Komponen ini TIDAK mengubah data apa pun di Firestore -- murni baca
// props `input` (bentuk paket: { judul, daftarSoal, subtes, modeTimer,
// targetKelas, targetKategori, soalAcak }) dan mencetak.
// ============================================================

import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import 'katex/dist/katex.min.css';
import katexCssInline from 'katex/dist/katex.min.css?inline';
import {
  DAFTAR_KERTAS,
  kertasDariKode,
  kolomOtomatis,
  lebarKolomMm,
  susunNaskahDariBlok,
  GAYA_NASKAH,
} from '../utils/naskahSoal';
import { rencanaSeksiNaskah, blokNaskahDariSeksi, perkiraanTinggiBlokSeksi } from '../utils/seksiNaskahTryOut';
import { cetakLewatIframe } from '../utils/kwitansi';

const PX_PER_MM = 96 / 25.4;
const gayaPill = (aktif) => ({
  padding: '6px 12px', borderRadius: 999, fontSize: 11.5, fontWeight: 700, cursor: 'pointer',
  border: aktif ? '1.5px solid #3730a3' : '1px solid #d1d5db',
  background: aktif ? '#eef2ff' : 'white', color: aktif ? '#3730a3' : '#475569',
});
const gayaSelect = { padding: '7px 10px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 12, background: 'white' };
const gayaTombol = (warna) => ({
  padding: '10px 16px', borderRadius: 10, border: 'none', background: warna,
  color: 'white', fontSize: 12.5, fontWeight: 800, cursor: 'pointer',
});

export default function DialogCetakNaskah({ input, onClose }) {
  const [kodeKertas, setKodeKertas] = useState('A4');
  const [kolomPaksa, setKolomPaksa] = useState(0); // 0 = otomatis
  const [tab, setTab] = useState('siswa');
  const [rasioGambar, setRasioGambar] = useState({});
  const [tinggiSiswa, setTinggiSiswa] = useState([]);
  const [tinggiKunci, setTinggiKunci] = useState([]);
  const refUkurSiswa = useRef(null);
  const refUkurKunci = useRef(null);

  const daftarSoal = Array.isArray(input?.daftarSoal) ? input.daftarSoal : [];
  const meta = {
    judul: input?.judul || 'Naskah Soal',
    mapel: input?.targetKategori && input.targetKategori !== 'Semua' ? input.targetKategori : '',
    targetKelas: input?.targetKelas && input.targetKelas !== 'Semua' ? input.targetKelas : '',
    bab: input?.bab || '',
  };

  const seksi = rencanaSeksiNaskah(input).seksi;
  const kertas = kertasDariKode(kodeKertas);
  const jumlahKolom = kolomPaksa > 0 ? kolomPaksa : kolomOtomatis(kertas);
  const lebarKolom = lebarKolomMm(kertas, jumlahKolom);

  const blokSiswa = daftarSoal.length ? blokNaskahDariSeksi('siswa', meta, seksi, lebarKolom, rasioGambar) : [];
  const blokKunci = daftarSoal.length ? blokNaskahDariSeksi('kunci', meta, seksi, lebarKolom, rasioGambar) : [];

  // Lapisan ukur tersembunyi: tinggi SUNGGUHAN tiap blok (mm) dibaca dari
  // DOM dengan lebar kolom yang sama persis dengan dokumen cetak. KENAPA
  // bukan taksiran huruf saja: rumus KaTeX dan gambar membuat tinggi nyata
  // sering jauh berbeda; tanpa ini susunan di kertas bisa melenceng.
  // KENAPA tanpa daftar dependensi: identitas array blok memang berubah
  // tiap render (data kecil, penyusunan murah); yang menjaga agar tidak
  // jadi render beruntun ialah BENTENG di setter -- hasil ukur sama dengan
  // sebelumnya => identitas state sama => React tidak re-render.
  useLayoutEffect(() => {
    const ukur = (ref, setter, jumlahBlok) => {
      const node = ref.current;
      if (!node) { setter([]); return; }
      const anak = [...node.children];
      if (anak.length !== jumlahBlok) { setter([]); return; }
      const mm = anak.map((el) => Math.round((el.offsetHeight / PX_PER_MM) * 10) / 10);
      setter((lama) => (lama.length === mm.length && lama.every((v, i) => v === mm[i]) ? lama : mm));
    };
    ukur(refUkurSiswa, setTinggiSiswa, blokSiswa.length);
    ukur(refUkurKunci, setTinggiKunci, blokKunci.length);
    // KENAPA dependensinya jumlah blok + lebar kolom + rasio gambar (bukan
    // array bloknya): isi lapisan ukur hanya bisa berubah kalau salah satu
    // dari itu berubah, sementara identitas array blok memang baru tiap
    // render. Benteng di setter menjaga agar pengukuran yang hasilnya sama
    // tidak memicu render beruntun.
  }, [blokSiswa.length, blokKunci.length, lebarKolom, rasioGambar]);

  // Rasio piksel asli gambar: ditempeli listener setiap lapisan ukur
  // selesai dirender, supaya mesin naskah bisa memilih ukuran gambar
  // "tidak terlalu kecil dan tidak terlalu besar" dari piksel aslinya.
  // Tanpa daftar dependensi dengan alasan sama seperti efek ukur di atas;
  // benteng setter rasioGambar mencegah render beruntun.
  useEffect(() => {
    const wadah = [refUkurSiswa.current, refUkurKunci.current].filter(Boolean);
    const pasang = [];
    wadah.forEach((w) => {
      w.querySelectorAll('img').forEach((img) => {
        const catat = () => {
          if (!img.naturalWidth || !img.naturalHeight) return;
          const r = img.naturalWidth / img.naturalHeight;
          setRasioGambar((lama) => (Math.abs((lama[img.src] ?? 0) - r) < 0.001 ? lama : { ...lama, [img.src]: r }));
        };
        if (img.complete) catat();
        else { img.addEventListener('load', catat, { once: true }); pasang.push([img, catat]); }
      });
    });
    return () => pasang.forEach(([img, catat]) => img.removeEventListener('load', catat));
  });

  // Tinggi taksiran selaras blok (kop=26mm di indeks 0); susunNaskahDariBlok
  // memakai tinggiPerkiraanMm[i-1] untuk blok i, jadi yang diserahkan adalah
  // versi tanpa kop sebagai cadangan sebelum pengukuran layar tiba.
  const perkiraanSiswa = perkiraanTinggiBlokSeksi('siswa', seksi, lebarKolom, rasioGambar).slice(1);
  const perkiraanKunci = perkiraanTinggiBlokSeksi('kunci', seksi, lebarKolom, rasioGambar).slice(1);

  const naskahSiswa = blokSiswa.length
    ? susunNaskahDariBlok(blokSiswa, { kertas: kodeKertas, jumlahKolom, tinggiBlokMm: tinggiSiswa, tinggiPerkiraanMm: perkiraanSiswa, cssTambahan: katexCssInline })
    : null;
  const naskahKunci = blokKunci.length
    ? susunNaskahDariBlok(blokKunci, { kertas: kodeKertas, jumlahKolom, tinggiBlokMm: tinggiKunci, tinggiPerkiraanMm: perkiraanKunci, cssTambahan: katexCssInline })
    : null;

  const docPratinjau = (fragmen) => `<!DOCTYPE html><html lang="id"><head><meta charset="utf-8" />
    <style>html{background:#cbd5e1}body{margin:0;padding:4mm;display:flex;flex-direction:column;align-items:center;gap:3mm}</style>
    </head><body>${fragmen}</body></html>`;
  const fragmenAktif = tab === 'kunci' ? naskahKunci?.fragmen : naskahSiswa?.fragmen;
  const hasilAktif = tab === 'kunci' ? naskahKunci : naskahSiswa;

  const cetak = (mode) => {
    const hasil = mode === 'kunci' ? naskahKunci : naskahSiswa;
    if (!hasil) return;
    cetakLewatIframe(hasil.fragmen, mode === 'kunci'
      ? `Kunci & Pembahasan — ${input?.judul || ''}`.trim()
      : `Naskah Soal — ${input?.judul || ''}`.trim());
  };

  const jumlahSeksiBerKepala = seksi.filter((s) => s.judul).length;

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.55)', zIndex: 90, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 14 }}>
      <style>{GAYA_NASKAH}</style>
      <div style={{ background: 'white', borderRadius: 14, width: 'min(1020px, 96vw)', maxHeight: '94vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 10px 40px rgba(0,0,0,0.3)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', borderBottom: '1px solid #e2e8f0' }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 800, fontSize: 15, color: '#1e293b' }}>🖨️ Print Naskah — {input?.judul || '(tanpa judul)'}</div>
            <div style={{ fontSize: 11.5, color: '#64748b' }}>
              {daftarSoal.length} soal{jumlahSeksiBerKepala > 0 ? ` · ${jumlahSeksiBerKepala} seksi subtes` : ''} · sistem yang menata kolom, gambar, dan nomor halaman
            </div>
          </div>
          <button onClick={onClose} style={{ border: 'none', background: '#f1f5f9', borderRadius: 8, padding: '6px 12px', cursor: 'pointer', fontSize: 12, fontWeight: 700, color: '#334155' }}>Tutup</button>
        </div>

        {daftarSoal.length === 0 ? (
          <div style={{ padding: 24, fontSize: 13, color: '#64748b' }}>Paket ini tidak punya soal untuk dicetak.</div>
        ) : (
          <>
            <div style={{ padding: '10px 16px', borderBottom: '1px solid #e2e8f0', display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
              <label style={{ fontSize: 11.5, color: '#475569', display: 'flex', gap: 6, alignItems: 'center' }}>
                ukuran kertas
                <select value={kodeKertas} onChange={(e) => setKodeKertas(e.target.value)} style={gayaSelect}>
                  {DAFTAR_KERTAS.map((k) => <option key={k.kode} value={k.kode}>{k.label}</option>)}
                </select>
              </label>
              <label style={{ fontSize: 11.5, color: '#475569', display: 'flex', gap: 6, alignItems: 'center' }}>
                kolom
                <select value={kolomPaksa} onChange={(e) => setKolomPaksa(Number(e.target.value))} style={gayaSelect}>
                  <option value={0}>otomatis ({kolomOtomatis(kertas)} kolom)</option>
                  <option value={1}>1 kolom</option>
                  <option value={2}>2 kolom</option>
                </select>
              </label>
              <button style={gayaPill(tab === 'siswa')} onClick={() => setTab('siswa')}>👀 lembar siswa</button>
              <button style={gayaPill(tab === 'kunci')} onClick={() => setTab('kunci')}>🔑 kunci guru</button>
              {hasilAktif && (
                <span style={{ fontSize: 11, color: '#64748b' }}>
                  {hasilAktif.jumlahHalaman} halaman · {jumlahKolom} kolom · lebar kolom {hasilAktif.lebarKolomMm}mm
                </span>
              )}
            </div>

            <div style={{ padding: '8px 16px 0', display: 'flex', flexDirection: 'column', gap: 6 }}>
              {hasilAktif?.peringatan?.length > 0 && (
                <div style={{ background: '#fffbeb', border: '1px solid #fde68a', color: '#92400e', borderRadius: 8, padding: '8px 10px', fontSize: 11.5 }}>
                  ⚠️ Ada butir yang lebih tinggi dari satu kolom; sistem memberinya satu kolom utuh supaya tidak terpotong.
                </div>
              )}
              {input?.soalAcak && tab === 'siswa' && (
                <div style={{ background: '#eef2ff', border: '1px solid #c7d2fe', color: '#3730a3', borderRadius: 8, padding: '8px 10px', fontSize: 11.5 }}>
                  🎲 Try out ini mengacak urutan soal per siswa. Naskah cetak adalah VERSI INDUK (urutan paket) -- nomor di kertas jadi patokan kunci guru, bukan nomor yang tampil di layar tiap siswa.
                </div>
              )}
            </div>

            <div style={{ flex: 1, minHeight: 0, padding: '10px 16px' }}>
              <iframe
                title="Pratinjau naskah cetak"
                srcDoc={docPratinjau(fragmenAktif || '')}
                style={{ width: '100%', height: '100%', minHeight: 320, border: '1px solid #cbd5e1', borderRadius: 10, background: '#cbd5e1' }}
              />
            </div>

            <div style={{ padding: '10px 16px 14px', borderTop: '1px solid #e2e8f0', display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
              <button style={gayaTombol('#2563eb')} onClick={() => cetak('siswa')}>📄 CETAK NASKAH SISWA</button>
              <button style={gayaTombol('#b91c1c')} onClick={() => cetak('kunci')}>🔑 CETAK KUNCI (PEGANGAN GURU)</button>
              <span style={{ fontSize: 11, color: '#64748b', flex: 1, minWidth: 220 }}>
                Di dialog cetak, pilih ukuran kertas yang SAMA dengan pilihan di atas dan biarkan margin “Default” supaya susunan pratinjau persis pindah ke kertas.
              </span>
            </div>
          </>
        )}
      </div>

      {/* LAPISAN UKUR: blok naskah dirender sembunyi-sembunyi dengan lebar
          kolom sesungguhnya; tinggi tiap blok dibaca untuk penyusun
          halaman. visibility:hidden supaya tak terlihat tetapi layout
          tetap dihitung browser. */}
      {daftarSoal.length > 0 && (
        <div aria-hidden="true" style={{ position: 'absolute', left: '-10000px', top: 0, visibility: 'hidden', pointerEvents: 'none' }}>
          <div className="naskah" ref={refUkurSiswa} style={{ width: `${lebarKolom}mm` }}>
            {blokSiswa.map((b, i) => <div key={`s${i}`} style={{ overflow: 'hidden' }} dangerouslySetInnerHTML={{ __html: b }} />)}
          </div>
          <div className="naskah" ref={refUkurKunci} style={{ width: `${lebarKolom}mm` }}>
            {blokKunci.map((b, i) => <div key={`k${i}`} style={{ overflow: 'hidden' }} dangerouslySetInnerHTML={{ __html: b }} />)}
          </div>
        </div>
      )}
    </div>
  );
}
