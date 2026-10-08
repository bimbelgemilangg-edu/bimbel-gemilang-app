// src/pages/teacher/CetakPaketLatihan.jsx
// ============================================================
// CETAK PAKET LATIHAN (Fase 3 skema buku-kliping, docs/KERANGKA-KONTEN-BUKU.md)
//
// Loop operasional owner: bank soal terus diisi admin -> tentor MEMILIH
// soal sesuai bab/minggu -> tentor MENCETAK sendiri secara rapi -> siswa
// mengerjakan / menggunting dan menempel di buku progres.
//
// 🔥 2026-10-08 (arahan owner sambil mengirim tangkapan layar naskah TKA
// dua kolom): "pastikan guru bisa membaca dulu lengkap memilih soal dan
// sistem menata layout print seperti ini, rapi dengan gambar disesuaikan
// tidak terlalu kecil dan besar, sistem menata secara otomatis, tentor
// tinggal pilih ukuran kertas lalu print". Maka halaman ini sekarang:
//   1. BACA DULU: daftar butir ditampilkan LENGKAP (teks utuh + rumus
//      KaTeX + gambar + pilihan), bukan potongan 110 huruf, supaya guru
//      memilih dengan tahu isi soal, bukan menebak.
//   2. DUA GAYA LEMBAR: "kotak siap gunting" (perilaku lama, buku progres)
//      dan "naskah model ujian" dua kolom rapi ala naskah TKA asli
//      (mesinnya di src/utils/naskahSoal.js).
//   3. UKURAN KERTAS dipilih guru (A4/F4/Letter/A5); susunan kolom,
//      ukuran gambar, dan nomor halaman ditata sistem otomatis.
//   4. PRATINJAU di layar = yang tercetak: iframe memuat fragmen yang
//      persis sama dengan yang dikirim ke dialog cetak.
//
// Menghasilkan TIGA dokumen terpisah (aturan kerangka):
//   1. PAKET-SISWA / NASKAH-SISWA : soal TANPA kunci
//   2. KUNCI-TENTOR               : kunci + pembahasan, kepala peringatan
//   3. LEMBAR-CATATAN             : area tempel + kolom catatan pengerjaan
// Tata letak hidup di src/utils/cetakLatihan.js & naskahSoal.js (murni, teruji).
//
// AKSES: mode paket mengikuti aturan halaman pantau (#125) -- hanya paket
// terhubung ke tentor login. Mode bank bersifat baca+cetak saja (tidak
// mengubah atau menilai apa pun), jadi terbuka untuk semua guru seperti
// lemari soal itu sendiri.
// ============================================================

import React, { useState, useEffect, useLayoutEffect, useCallback, useMemo, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { collection, query, where, getDocs } from 'firebase/firestore';
import 'katex/dist/katex.min.css';
import katexCssInline from 'katex/dist/katex.min.css?inline';
import { db } from '../../firebase';
import { bacaIdentitasGuru } from '../../utils/identitasGuru';
import { perluSegar, kebijakanGagalMuat } from '../../utils/keputusanMuat';
import { pilihSoalUntukCetak, htmlPaketSiswa, htmlKunciTentor, htmlLembarCatatan } from '../../utils/cetakLatihan';
// 🔥 2026-10-08 (Fase 1 cetak biru bank soal): keranjang yang BERTAHAN.
// Dulu `tercentang` berisi id dan DIHAPUS setiap ganti filter
// (setTercentang([]) di pill jenjang/mapel/bab/kelas), jadi tentor yang
// sudah memilih 15 soal lalu pindah bab kehilangan semuanya tanpa
// peringatan -- dan merakit soal lintas bab mustahil. Sekarang keranjang
// menyimpan BUTIR dalam array berurutan: nomor urutnya = nomor naskah.
import {
  masukKeranjang,
  masukKeranjangBanyak,
  keluarKeranjang,
  pindahUrutan,
  ringkasKeranjang,
  judulDariKeranjang,
  teksRincianMasuk,
  teksSoalDari,
} from '../../utils/keranjangSoalGuru';
import KartuKeranjangSoal from '../../components/guru/KartuKeranjangSoal';
import { saringPaketTerbit } from '../../utils/statusTryOutPaket';
import {
  DAFTAR_KERTAS,
  kertasDariKode,
  kolomOtomatis,
  lebarKolomMm,
  daftarBlokNaskah,
  estimasiTinggiBlokMm,
  susunNaskahDariBlok,
  teksKeHtml,
  GAYA_NASKAH,
} from '../../utils/naskahSoal';
import { pisahTeksDanGambar } from '../../utils/penempatanGambar';
import { cetakLewatIframe } from '../../utils/kwitansi';
import { useSegarSaatTerlihat } from '../../utils/useSegarSaatTerlihat';
import { sebaranKelas } from '../../utils/petaKonten';

const BELUM = '(Belum diatur)';
// Cache modul-level: satu tab menyapu bank_soal sekali per TTL, bukan sekali
// per mount/focus. Lihat komentar di muatSemua() untuk alasan kuotanya.
const TTL_CACHE_MS = 10 * 60 * 1000;
let cacheBank = null;
let waktuCacheBank = 0;
let cachePaket = null;
let waktuCachePaket = 0;
const gayaKartu = { background: 'white', border: '1px solid #e2e8f0', borderRadius: 12, padding: 14, marginBottom: 12 };
const gayaJudulKartu = { fontSize: 12, fontWeight: 800, color: '#0f172a', marginBottom: 8 };
const gayaTombol = (warna, mati) => ({
  padding: '10px 16px', borderRadius: 10, border: 'none', background: warna,
  color: 'white', fontSize: 12.5, fontWeight: 800,
  cursor: mati ? 'not-allowed' : 'pointer', opacity: mati ? 0.5 : 1,
});
const gayaPill = (aktif) => ({
  padding: '7px 12px', borderRadius: 999, fontSize: 11.5, fontWeight: 700, cursor: 'pointer',
  border: aktif ? '1.5px solid #3730a3' : '1px solid #d1d5db',
  background: aktif ? '#eef2ff' : 'white', color: aktif ? '#3730a3' : '#475569',
});
const gayaSelect = { padding: '8px 10px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 12, background: 'white' };
const PX_PER_MM = 96 / 25.4;

// Kartu baca-lengkap: guru melihat isi butir utuh sebelum memutuskan
// mencentang. Gambar dibatasi tinggi 140px di layar supaya daftar tetap
// mudah digulir; ukuran cetak sesungguhnya dihitung mesin naskah.
function KartuBacaSoal({ soal, nomor, tercentang, onCentang, bacaSaja }) {
  const segmen = pisahTeksDanGambar(teksSoalMentah(soal), soal?.gambarUrls);
  const opsi = Array.isArray(soal?.opsiJawaban) ? soal.opsiJawaban : [];
  return (
    <div style={{ border: `1.5px solid ${tercentang ? '#3730a3' : '#e2e8f0'}`, background: tercentang ? '#eef2ff' : 'white', borderRadius: 10, padding: '10px 12px', marginBottom: 8 }}>
      <label style={{ display: 'flex', gap: 10, cursor: 'pointer', alignItems: 'flex-start' }}>
        <input type="checkbox" checked={tercentang} disabled={bacaSaja} onChange={(e) => onCentang(e.target.checked)} style={{ marginTop: 3 }} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 10.5, color: '#64748b', marginBottom: 4 }}>
            <b style={{ color: '#3730a3', fontSize: 12 }}>No. {nomor}</b> · [{String(soal?.tipe || 'pg_sederhana').replace(/_/g, ' ')}]
            {soal?.kelas ? ` · kelas ${soal.kelas}` : ''}
          </div>
          {segmen.map((sg, i) => (sg.jenis === 'teks'
            ? <div key={i} style={{ fontSize: 12.5, lineHeight: 1.55, color: '#0f172a' }} dangerouslySetInnerHTML={{ __html: teksKeHtml(sg.isi) }} />
            : <img key={i} src={sg.url} alt={`Gambar soal ${nomor}`} style={{ maxHeight: 140, maxWidth: '100%', border: '1px solid #cbd5e1', borderRadius: 6, margin: '4px 0' }} />))}
          {opsi.length > 0 && (
            <div style={{ marginTop: 6, display: 'grid', gap: 3 }}>
              {opsi.map((o, i) => {
                const huruf = String.fromCharCode(65 + i);
                const teks = typeof o === 'string' ? o : o?.teks || '';
                const gbr = (o && typeof o === 'object' && Array.isArray(o.gambar)) ? o.gambar : [];
                return (
                  <div key={i} style={{ fontSize: 12, color: '#1e293b' }}>
                    <b>({huruf})</b> <span dangerouslySetInnerHTML={{ __html: teksKeHtml(teks) }} />
                    {gbr.map((g, j) => (g?.uploadedUrl || g?.url
                      ? <img key={j} src={g.uploadedUrl || g.url} alt={`Gambar pilihan ${huruf}`} style={{ maxHeight: 90, border: '1px solid #cbd5e1', borderRadius: 6, marginLeft: 6, verticalAlign: 'middle' }} />
                      : null))}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </label>
    </div>
  );
}

// 🔥 DIPERBAIKI 2026-10-08: teks soal bisa tersimpan di TIGA nama kolom
// (Import Hasil Scan menulis `soal`; Mesin Bank Soal & Impor HTML Gemini
// menulis `soal` DAN `teksSoal`; draf lama `teks_soal`). Membaca dua saja
// membuat butir sehat tampil kosong. Kini lewat util teruji yang sama
// dengan keranjang, supaya tidak ada dua pembaca yang berbeda pendapat.
const teksSoalMentah = teksSoalDari;

export default function CetakPaketLatihan() {
  const [sumber, setSumber] = useState('bank');       // 'bank' | 'paket'
  const [bankSoal, setBankSoal] = useState([]);
  const [paketList, setPaketList] = useState([]);
  const [memuat, setMemuat] = useState(true);

  const [mapelAktif, setMapelAktif] = useState('');
  const [babAktif, setBabAktif] = useState('');
  // 🔥 BARU (2026-10-07): kompilasi TKA mencampur kelas 10-12 dalam satu
  // bab. GURU yang memilih: cetak semua kelas atau satu kelas saja.
  const [kelasFilter, setKelasFilter] = useState('');
  // 🔥 DITAMBAHKAN (2026-10-06, pertanyaan owner: "jenjangnya?"): tingkat
  // pertama hirarki adalah JENJANG, persis LemariSoalPage admin. Tanpa ini
  // mapel bernama sama di jenjang berbeda (Matematika SMP vs SMA) tercampur
  // dalam satu pill, dan lembar cetak bisa berisi soal lintas jenjang.
  const [jenjangAktif, setJenjangAktif] = useState('');
  // Keranjang: array BUTIR (bukan id) supaya kartu tetap bisa dirender
  // setelah tentor pindah bab dan butirnya tak lagi ada di daftar tampil.
  const [keranjang, setKeranjang] = useState([]);
  const [pesanKeranjang, setPesanKeranjang] = useState('');
  // Kartu keranjang boleh dibaca dalam dua mode: dengan kunci+pembahasan
  // (memeriksa sebelum mencetak) atau tanpa (meniru lembar siswa).
  const [tampilKunci, setTampilKunci] = useState(true);
  const [tanpaEsai, setTanpaEsai] = useState(false);

  const [paketId, setPaketId] = useState('');
  const [maksPaket, setMaksPaket] = useState(0);
  // 🔥 BARU (Lapis 0, audit kuota 2026-10-06): bank_soal adalah koleksi
  // besar; menyapunya tiap mount + tiap focus adalah penyedot kuota yang
  // membuat proyek pernah menjawab 429 RESOURCE_EXHAUSTED. Cache modul-level
  // dengan TTL membuat penyegaran tetap ada tanpa menembak server berulang.
  const [pesanError, setPesanError] = useState('');

  // 🔥 BARU (2026-10-08): gaya lembar, ukuran kertas, dan paksaan kolom.
  // 'naskah' = dua kolom rapi ala naskah TKA; 'kotak' = perilaku lama.
  const [gayaLembar, setGayaLembar] = useState('naskah');
  const [kodeKertas, setKodeKertas] = useState('A4');
  const [kolomPaksa, setKolomPaksa] = useState(0);     // 0 = otomatis
  const [tabPratinjau, setTabPratinjau] = useState('siswa');
  // Rasio piksel asli tiap url gambar, diisi saat gambar lapisan ukur
  // selesai dimuat -- bahan mesin menghitung ukuran cetak yang wajar.
  const [rasioGambar, setRasioGambar] = useState({});
  const [tinggiSiswa, setTinggiSiswa] = useState([]);
  const [tinggiKunci, setTinggiKunci] = useState([]);
  const refUkurSiswa = useRef(null);
  const refUkurKunci = useRef(null);

  const versiSegar = useSegarSaatTerlihat();
  // 🔥 BARU: bisa dibuka dengan bab sudah terpilih dari Perpustakaan
  // (/guru/cetak-latihan?jenjang=..&mapel=..&bab=..), supaya alur
  // "cari materi -> cetak" tidak meminta tentor memilih ulang dari nol.
  const [params] = useSearchParams();

  const muatSemua = useCallback(async (paksa = false) => {
    const kini = Date.now();
    const bankMasihMuda = !perluSegar({ waktuCacheMs: waktuCacheBank, ttlMs: TTL_CACHE_MS, sekarangMs: kini, paksa });
    const paketMasihMuda = !perluSegar({ waktuCacheMs: waktuCachePaket, ttlMs: TTL_CACHE_MS, sekarangMs: kini, paksa });
    if (bankMasihMuda && paketMasihMuda && cacheBank && cachePaket) {
      setBankSoal(cacheBank);
      setPaketList(cachePaket);
      setPesanError('');
      return;
    }
    setMemuat(true);
    try {
      const tugas = [];
      if (!bankMasihMuda) tugas.push(['bank', getDocs(collection(db, 'bank_soal'))]);
      if (!paketMasihMuda) {
        tugas.push(['paket', (async () => {
          const idt = bacaIdentitasGuru();
          if (!idt.semuaId.length) return { docs: [] };
          return getDocs(query(collection(db, 'tryout_paket'), where('tentorId', 'in', idt.semuaId)));
        })()]);
      }
      const hasil = await Promise.all(tugas.map(([, p]) => p.catch((e) => e)));
      hasil.forEach((h, i) => {
        const jenis = tugas[i][0];
        if (h instanceof Error) throw h;
        const list = h.docs.map((d) => ({ id: d.id, ...d.data() }));
        if (jenis === 'bank') { cacheBank = list; waktuCacheBank = Date.now(); setBankSoal(list); }
        // 🔥 2026-10-08: usulan tentor yang BELUM disetujui admin tidak boleh
        // muncul di dropdown "Paket Try Out saya" lalu tercetak seolah sudah
        // terbit. Disaring di satu tempat ini, bukan di tiap pemakai.
        else { const terbit = saringPaketTerbit(list); cachePaket = terbit; waktuCachePaket = Date.now(); setPaketList(terbit); }
      });
      setPesanError('');
    } catch (e) {
      // 🔥 KEBIJAKAN BARU: gagal baca TIDAK BOLEH menghapus data lama dan
      // tidak boleh diam. Daftar kosong dulu membuat kuota habis terlihat
      // seperti "soalnya hilang".
      const k = kebijakanGagalMuat(!!cacheBank, e?.code || e?.message || '');
      if (!k.pertahankanDataLama) { setBankSoal(cacheBank || []); setPaketList(cachePaket || []); }
      setPesanError(k.pesan);
    } finally {
      setMemuat(false);
    }
  }, []);

  useEffect(() => { muatSemua(); }, [muatSemua, versiSegar]);

  useEffect(() => {
    const pj = params.get('jenjang');
    const pm = params.get('mapel');
    const pb = params.get('bab');
    if (!pm || mapelAktif) return;
    if (pj) setJenjangAktif(pj);
    setMapelAktif(pm);
    if (pb) setBabAktif(pb);
  }, [params, bankSoal, mapelAktif]);

  // ---- hirarki bank: jenjang -> mapel -> bab, persis pola Lemari Soal admin ----
  const daftarJenjang = useMemo(() => {
    const hitung = new Map();
    for (const s of bankSoal) {
      const k = (s.jenjang || '').trim() || BELUM;
      hitung.set(k, (hitung.get(k) || 0) + 1);
    }
    return [...hitung.entries()].sort((a, b) => a[0].localeCompare(b[0], 'id'));
  }, [bankSoal]);

  const daftarMapel = useMemo(() => {
    if (!jenjangAktif) return [];
    const hitung = new Map();
    for (const s of bankSoal) {
      if (((s.jenjang || '').trim() || BELUM) !== jenjangAktif) continue;
      const k = (s.mataPelajaran || '').trim() || BELUM;
      hitung.set(k, (hitung.get(k) || 0) + 1);
    }
    return [...hitung.entries()].sort((a, b) => a[0].localeCompare(b[0], 'id'));
  }, [bankSoal, jenjangAktif]);

  const daftarBab = useMemo(() => {
    if (!jenjangAktif || !mapelAktif) return [];
    const hitung = new Map();
    for (const s of bankSoal) {
      if (((s.jenjang || '').trim() || BELUM) !== jenjangAktif) continue;
      if (((s.mataPelajaran || '').trim() || BELUM) !== mapelAktif) continue;
      const k = (s.materi || '').trim() || BELUM;
      hitung.set(k, (hitung.get(k) || 0) + 1);
    }
    return [...hitung.entries()].sort((a, b) => a[0].localeCompare(b[0], 'id'));
  }, [bankSoal, jenjangAktif, mapelAktif]);

  const soalDiBab = useMemo(() => {
    if (!jenjangAktif || !mapelAktif || !babAktif) return [];
    return bankSoal.filter((s) =>
      ((s.jenjang || '').trim() || BELUM) === jenjangAktif &&
      ((s.mataPelajaran || '').trim() || BELUM) === mapelAktif &&
      ((s.materi || '').trim() || BELUM) === babAktif);
  }, [bankSoal, jenjangAktif, mapelAktif, babAktif]);

  const daftarKelas = useMemo(() => sebaranKelas(soalDiBab), [soalDiBab]);

  const soalDiBabTerfilter = useMemo(
    () => (kelasFilter ? soalDiBab.filter((s) => String(s.kelas || '').trim() === kelasFilter) : soalDiBab),
    [soalDiBab, kelasFilter]
  );

  const soalBankTampil = useMemo(
    () => (tanpaEsai ? soalDiBabTerfilter.filter((s) => !['esai', 'uraian'].includes(s.tipe)) : soalDiBabTerfilter),
    [soalDiBabTerfilter, tanpaEsai]
  );

  // Keranjang adalah sumber kebenaran pilihan, bukan irisan daftar tampil.
  const terpilihBank = keranjang;
  const ringkasanKeranjang = useMemo(() => ringkasKeranjang(keranjang), [keranjang]);

  // ---- mode paket (perilaku #134) ----
  const paket = paketList.find((p) => p.id === paketId) || null;
  const soalPaket = pilihSoalUntukCetak(paket?.daftarSoal, { maks: maksPaket || undefined, tanpaEsai });

  const siap = sumber === 'bank' ? terpilihBank : soalPaket;
  // KENAPA useMemo: objek meta ikut jadi dependencia memo blok naskah;
  // tanpa ini objek baru tiap render membuat lapisan ukur disusun ulang
  // tanpa henti (eslint react-hooks/exhaustive-deps).
  // Judul naskah diambil dari ISI KERANJANG, bukan dari filter yang sedang
  // aktif. Keranjang lintas bab tidak boleh mengaku satu bab -- lembar
  // cetak yang berbohong soal isinya lebih berbahaya daripada lembar yang
  // judulnya kurang cantik.
  const meta = useMemo(() => (sumber === 'bank'
    ? {
      judul: judulDariKeranjang(keranjang),
      mapel: ringkasanKeranjang.perMapel.length === 1 ? ringkasanKeranjang.perMapel[0].nama : `${ringkasanKeranjang.perMapel.length} mapel`,
      targetKelas: ringkasanKeranjang.perJenjang.length === 1 ? ringkasanKeranjang.perJenjang[0].nama : `${ringkasanKeranjang.perJenjang.length} jenjang`,
      bab: ringkasanKeranjang.perMateri.length === 1 ? ringkasanKeranjang.perMateri[0].nama : `${ringkasanKeranjang.perMateri.length} materi`,
    }
    : { judul: paket?.judul || '', mapel: paket?.targetKategori || '', targetKelas: paket?.targetKelas || '', bab: paket?.babJudul || '' }),
  [sumber, keranjang, ringkasanKeranjang, paket]);

  const inKeranjang = (id) => keranjang.some((s) => String(s?.id) === String(id));

  const centang = (soal, on) => {
    if (on) {
      setKeranjang((lama) => masukKeranjang(lama, soal).keranjang);
    } else {
      setKeranjang((lama) => keluarKeranjang(lama, soal?.id));
    }
  };

  const pilihSemuaTampil = () => {
    const hasil = masukKeranjangBanyak(keranjang, soalBankTampil);
    setKeranjang(hasil.keranjang);
    setPesanKeranjang(teksRincianMasuk(hasil.rincian));
  };

  // ---- 🔥 BARU: mesin naskah (ukur -> susun -> pratinjau -> cetak) ----
  const kertas = kertasDariKode(kodeKertas);
  const jumlahKolom = kolomPaksa > 0 ? kolomPaksa : kolomOtomatis(kertas);
  const lebarKolom = lebarKolomMm(kertas, jumlahKolom);

  const blokSiswa = useMemo(
    () => (siap.length ? daftarBlokNaskah('siswa', meta, siap, lebarKolom, rasioGambar) : []),
    [siap, meta, lebarKolom, rasioGambar]
  );
  const blokKunci = useMemo(
    () => (siap.length ? daftarBlokNaskah('kunci', meta, siap, lebarKolom, rasioGambar) : []),
    [siap, meta, lebarKolom, rasioGambar]
  );

  // Lapisan ukur tersembunyi: tinggi sungguhan tiap blok (mm) dibaca dari
  // DOM setelah gaya & lebar kolom sama persis dengan dokumen cetak.
  // KENAPA tidak memakai estimasi teks saja: rumus KaTeX dan gambar membuat
  // tinggi nyata sering jauh berbeda dari taksiran huruf.
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
  }, [blokSiswa, blokKunci]);

  // Rasio piksel asli gambar: ditempeli listener saat lapisan ukur_mount.
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
  }, [blokSiswa, blokKunci]);

  const perkiraanSiswa = useMemo(
    () => siap.map((s) => estimasiTinggiBlokMm('siswa', s, lebarKolom, rasioGambar)),
    [siap, lebarKolom, rasioGambar]
  );
  const perkiraanKunci = useMemo(
    () => siap.map((s) => estimasiTinggiBlokMm('kunci', s, lebarKolom, rasioGambar)),
    [siap, lebarKolom, rasioGambar]
  );

  const naskahSiswa = useMemo(() => (blokSiswa.length
    ? susunNaskahDariBlok(blokSiswa, { kertas: kodeKertas, jumlahKolom, tinggiBlokMm: tinggiSiswa, tinggiPerkiraanMm: perkiraanSiswa, cssTambahan: katexCssInline })
    : null), [blokSiswa, kodeKertas, jumlahKolom, tinggiSiswa, perkiraanSiswa]);
  const naskahKunci = useMemo(() => (blokKunci.length
    ? susunNaskahDariBlok(blokKunci, { kertas: kodeKertas, jumlahKolom, tinggiBlokMm: tinggiKunci, tinggiPerkiraanMm: perkiraanKunci, cssTambahan: katexCssInline })
    : null), [blokKunci, kodeKertas, jumlahKolom, tinggiKunci, perkiraanKunci]);

  const docPratinjau = (fragmen) => `<!DOCTYPE html><html lang="id"><head><meta charset="utf-8" />
    <style>html{background:#cbd5e1}body{margin:0;padding:4mm;display:flex;flex-direction:column;align-items:center;gap:3mm}</style>
    </head><body>${fragmen}</body></html>`;
  const fragmenAktif = tabPratinjau === 'kunci' ? naskahKunci?.fragmen : naskahSiswa?.fragmen;

  const cetakNaskah = (mode) => {
    const hasil = mode === 'kunci' ? naskahKunci : naskahSiswa;
    if (!hasil) return;
    cetakLewatIframe(hasil.fragmen, mode === 'kunci' ? 'Kunci & Pembahasan (Pegangan Guru)' : 'Naskah Soal Siswa');
  };

  return (
    <div style={{ maxWidth: 960, margin: '0 auto' }}>
      {/* gaya naskah dipakai juga oleh lapisan ukur tersembunyi di bawah */}
      <style>{GAYA_NASKAH}</style>
      <h2 style={{ margin: '4px 0 4px', fontSize: 18 }}>🖨️ Cetak Paket Latihan</h2>
      <p style={{ fontSize: 12, color: '#64748b', margin: '0 0 12px' }}>
        Baca dulu isi soal lengkap di daftar bawah, centang yang mau dicetak, lalu
        lihat pratinjau susunan naskah sebelum mencetak. Sistem yang menata kolom,
        ukuran gambar, dan nomor halaman; Bapak/Ibu tinggal memilih ukuran kertas.
      </p>

      {pesanError && (
        <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c', borderRadius: 10, padding: '10px 12px', fontSize: 12, marginBottom: 12, display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          <span style={{ flex: 1, minWidth: 200 }}>⚠️ {pesanError}</span>
          <button onClick={() => muatSemua(true)} style={{ padding: '7px 14px', borderRadius: 8, border: 'none', background: '#b91c1c', color: 'white', fontSize: 11.5, fontWeight: 800, cursor: 'pointer' }}>
            🔄 Coba lagi
          </button>
        </div>
      )}

      <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
        <button style={gayaPill(sumber === 'bank')} onClick={() => setSumber('bank')}>🗂️ Bank Soal (per mapel → bab)</button>
        <button style={gayaPill(sumber === 'paket')} onClick={() => setSumber('paket')}>📦 Paket Try Out saya ({paketList.length})</button>
      </div>

      {memuat && <div style={{ fontSize: 12, color: '#6b7280' }}>Memuat bank soal…</div>}

      {sumber === 'bank' && !memuat && (
        <>
          <div style={gayaKartu}>
            <div style={gayaJudulKartu}>1 · Jenjang</div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {daftarJenjang.map(([j, n]) => (
                <button key={j} style={gayaPill(jenjangAktif === j)} onClick={() => { setJenjangAktif(j); setMapelAktif(''); setBabAktif(''); }}>
                  {j} <span style={{ opacity: 0.6 }}>({n})</span>
                </button>
              ))}
              {daftarJenjang.length === 0 && <span style={{ fontSize: 12, color: '#94a3b8' }}>Bank soal masih kosong.</span>}
            </div>
          </div>

          {jenjangAktif && (
          <div style={gayaKartu}>
            <div style={gayaJudulKartu}>2 · Mata pelajaran pada {jenjangAktif}</div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {daftarMapel.map(([m, n]) => (
                <button key={m} style={gayaPill(mapelAktif === m)} onClick={() => { setMapelAktif(m); setBabAktif(''); }}>
                  {m} <span style={{ opacity: 0.6 }}>({n})</span>
                </button>
              ))}
            </div>
          </div>
          )}

          {mapelAktif && (
            <div style={gayaKartu}>
              <div style={gayaJudulKartu}>3 · Bab / materi pada {mapelAktif}</div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {daftarBab.map(([b, n]) => (
                  <button key={b} style={gayaPill(babAktif === b)} onClick={() => { setBabAktif(b); setKelasFilter(''); }}>
                    {b} <span style={{ opacity: 0.6 }}>({n})</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {babAktif && (
            <div style={gayaKartu}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                <div style={gayaJudulKartu}>4 · Baca lengkap lalu centang butir untuk keranjang ({keranjang.length} di keranjang · {soalBankTampil.length} tampil)</div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  {daftarKelas.length > 1 && (
                    <select value={kelasFilter} onChange={(e) => setKelasFilter(e.target.value)} style={gayaSelect}>
                      <option value="">semua kelas ({soalDiBab.length})</option>
                      {daftarKelas.map(([k, n]) => <option key={k} value={k === '(tanpa kelas)' ? '' : k}>{k} ({n})</option>)}
                    </select>
                  )}
                  <label style={{ fontSize: 11.5, color: '#475569', display: 'flex', gap: 5, alignItems: 'center' }}>
                    <input type="checkbox" checked={tanpaEsai} onChange={(e) => setTanpaEsai(e.target.checked)} /> lewati esai
                  </label>
                  <button style={gayaPill(false)} onClick={pilihSemuaTampil}>+ semua yang tampil</button>
                  <button style={gayaPill(false)} onClick={() => { setKeranjang([]); setPesanKeranjang('Keranjang dikosongkan.'); }}>kosongkan keranjang</button>
                </div>
              </div>
              <div style={{ maxHeight: 560, overflowY: 'auto', border: '1px solid #e2e8f0', borderRadius: 10, padding: 8, background: '#f8fafc' }}>
                {soalBankTampil.map((s, i) => (
                  <KartuBacaSoal key={s.id} soal={s} nomor={i + 1} tercentang={inKeranjang(s.id)} onCentang={(on) => centang(s, on)} />
                ))}
                {soalBankTampil.length === 0 && <div style={{ fontSize: 12, color: '#94a3b8', padding: 8 }}>Tidak ada butir di bab ini setelah saringan.</div>}
              </div>
            </div>
          )}
        </>
      )}

      {/* ====================================================
          5 · KERANJANG BACA — kartu-kartu soal lengkap + gambar,
          dengan watermark logo Gemilang di belakangnya.
          Permintaan owner 2026-10-08: "kotak-kotak kartu berisi soal
          lengkap gambarnya, jadi dibaca dahulu, tetapi tetap ada
          watermark logo gemilang di belakangnya".
          Keranjang ini HIDUP LINTAS FILTER: pindah jenjang/mapel/bab
          tidak menghapusnya lagi. Urutannya = nomor naskah yang dicetak.
          ==================================================== */}
      {sumber === 'bank' && !memuat && keranjang.length > 0 && (
        <div style={gayaKartu}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 8 }}>
            <div style={gayaJudulKartu}>5 · Keranjang baca ({keranjang.length} soal)</div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
              <label style={{ fontSize: 11.5, color: '#475569', display: 'flex', gap: 5, alignItems: 'center' }}>
                <input type="checkbox" checked={tampilKunci} onChange={(e) => setTampilKunci(e.target.checked)} />
                tampilkan kunci &amp; pembahasan
              </label>
              <button style={gayaPill(false)} onClick={() => { setKeranjang([]); setPesanKeranjang('Keranjang dikosongkan.'); }}>kosongkan</button>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8, fontSize: 11 }}>
            {ringkasanKeranjang.perJenjang.map((j) => (
              <span key={j.nama} style={{ background: '#eef2ff', color: '#3730a3', borderRadius: 999, padding: '3px 9px', fontWeight: 700 }}>{j.nama} · {j.jumlah}</span>
            ))}
            {ringkasanKeranjang.perMapel.map((m) => (
              <span key={m.nama} style={{ background: '#f1f5f9', color: '#334155', borderRadius: 999, padding: '3px 9px' }}>{m.nama} · {m.jumlah}</span>
            ))}
            {ringkasanKeranjang.perMateri.map((b) => (
              <span key={b.nama} style={{ background: '#f0fdf4', color: '#166534', borderRadius: 999, padding: '3px 9px' }}>{b.nama} · {b.jumlah}</span>
            ))}
            {ringkasanKeranjang.berbendera > 0 && (
              <span style={{ background: '#fffbeb', color: '#92400e', borderRadius: 999, padding: '3px 9px', fontWeight: 700 }}>⚠ {ringkasanKeranjang.berbendera} perlu diperiksa</span>
            )}
          </div>

          {pesanKeranjang && <div style={{ fontSize: 12, color: '#166534', marginBottom: 8 }}>{pesanKeranjang}</div>}

          <div style={{ fontSize: 11.5, color: '#64748b', marginBottom: 10, lineHeight: 1.6 }}>
            Baca dulu di sini sebelum mencetak. Panah ↑ ↓ menentukan <b>nomor urut di naskah</b>.
            Keranjang tetap utuh walau Bapak/Ibu pindah jenjang, mapel, atau bab.
            {ringkasanKeranjang.tanpaIdentitas > 0 && (
              <b style={{ color: '#b45309' }}> {ringkasanKeranjang.tanpaIdentitas} butir belum punya identitas lengkap — laporkan ke admin lewat Audit Identitas Soal.</b>
            )}
          </div>

          <div style={{ maxHeight: 720, overflowY: 'auto', paddingRight: 4 }}>
            {keranjang.map((s, i) => (
              <KartuKeranjangSoal
                key={String(s?.id ?? i)}
                soal={s}
                nomor={i + 1}
                jumlah={keranjang.length}
                tanpaKunci={!tampilKunci}
                onHapus={() => { setKeranjang((lama) => keluarKeranjang(lama, s.id)); setPesanKeranjang(`Soal nomor ${i + 1} dikeluarkan dari keranjang.`); }}
                onNaik={() => setKeranjang((lama) => pindahUrutan(lama, s.id, -1))}
                onTurun={() => setKeranjang((lama) => pindahUrutan(lama, s.id, 1))}
              />
            ))}
          </div>
        </div>
      )}

      {sumber === 'paket' && !memuat && (
        <div style={gayaKartu}>
          <div style={gayaJudulKartu}>Paket try out yang terhubung ke Anda</div>
          {paketList.length === 0 && <div style={{ fontSize: 12, color: '#94a3b8' }}>Belum ada paket terhubung. Minta admin menghubungkan tentor di halaman Terbitkan Try Out.</div>}
          <select value={paketId} onChange={(e) => setPaketId(e.target.value)} style={{ width: '100%', padding: '9px 10px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 12.5 }}>
            <option value="">— pilih paket —</option>
            {paketList.map((p) => (
              <option key={p.id} value={p.id}>{p.judul} · {p.targetKelas} · {(p.daftarSoal || []).length} soal</option>
            ))}
          </select>
          {paket && (
            <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginTop: 10, fontSize: 12 }}>
              <label style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                jumlah maks
                <input type="number" min="0" value={maksPaket || ''} placeholder="semua" onChange={(e) => setMaksPaket(Number(e.target.value) || 0)} style={{ width: 80, padding: '7px 8px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 12 }} />
              </label>
              <label style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                <input type="checkbox" checked={tanpaEsai} onChange={(e) => setTanpaEsai(e.target.checked)} /> lewati esai
              </label>
              <span style={{ color: '#64748b' }}>akan tercetak <b>{soalPaket.length}</b> dari {(paket.daftarSoal || []).length} soal</span>
            </div>
          )}
          {paket && soalPaket.length > 0 && (
            <div style={{ maxHeight: 420, overflowY: 'auto', border: '1px solid #e2e8f0', borderRadius: 10, padding: 8, marginTop: 10, background: '#f8fafc' }}>
              {soalPaket.map((s, i) => <KartuBacaSoal key={s.id || i} soal={s} nomor={i + 1} tercentang bacaSaja onCentang={() => {}} />)}
            </div>
          )}
        </div>
      )}

      {!memuat && (
        <div style={gayaKartu}>
          <div style={gayaJudulKartu}>5 · Tata letak & cetak ({siap.length} butir)</div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center', marginBottom: 10 }}>
            <label style={{ fontSize: 11.5, color: '#475569', display: 'flex', gap: 6, alignItems: 'center' }}>
              gaya lembar
              <select value={gayaLembar} onChange={(e) => setGayaLembar(e.target.value)} style={gayaSelect}>
                <option value="naskah">📄 naskah model ujian (kolom rapi)</option>
                <option value="kotak">✂️ kotak siap gunting (buku progres)</option>
              </select>
            </label>
            <label style={{ fontSize: 11.5, color: '#475569', display: 'flex', gap: 6, alignItems: 'center' }}>
              ukuran kertas
              <select value={kodeKertas} onChange={(e) => setKodeKertas(e.target.value)} style={gayaSelect}>
                {DAFTAR_KERTAS.map((k) => <option key={k.kode} value={k.kode}>{k.label}</option>)}
              </select>
            </label>
            {gayaLembar === 'naskah' && (
              <label style={{ fontSize: 11.5, color: '#475569', display: 'flex', gap: 6, alignItems: 'center' }}>
                kolom
                <select value={kolomPaksa} onChange={(e) => setKolomPaksa(Number(e.target.value))} style={gayaSelect}>
                  <option value={0}>otomatis ({kolomOtomatis(kertas)} kolom)</option>
                  <option value={1}>1 kolom</option>
                  <option value={2}>2 kolom</option>
                </select>
              </label>
            )}
          </div>

          {gayaLembar === 'naskah' && siap.length > 0 && naskahSiswa && (
            <>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', marginBottom: 8 }}>
                <button style={gayaPill(tabPratinjau === 'siswa')} onClick={() => setTabPratinjau('siswa')}>👀 pratinjau lembar siswa</button>
                <button style={gayaPill(tabPratinjau === 'kunci')} onClick={() => setTabPratinjau('kunci')}>🔑 pratinjau kunci guru</button>
                <span style={{ fontSize: 11, color: '#64748b' }}>
                  {naskahSiswa.jumlahHalaman} halaman · {jumlahKolom} kolom · lebar kolom {naskahSiswa.lebarKolomMm}mm
                </span>
              </div>
              {naskahSiswa.peringatan.length > 0 && (
                <div style={{ background: '#fffbeb', border: '1px solid #fde68a', color: '#92400e', borderRadius: 8, padding: '8px 10px', fontSize: 11.5, marginBottom: 8 }}>
                  ⚠️ Butir nomor {naskahSiswa.peringatan.filter((i) => i > 0).join(', ')} lebih tinggi dari satu kolom; sistem memberinya satu kolom utuh supaya tidak terpotong.
                </div>
              )}
              <iframe
                title="Pratinjau naskah cetak"
                srcDoc={docPratinjau(fragmenAktif || '')}
                style={{ width: '100%', height: 680, border: '1px solid #cbd5e1', borderRadius: 10, background: '#cbd5e1' }}
              />
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 10 }}>
                <button style={gayaTombol('#2563eb', false)} onClick={() => cetakNaskah('siswa')}>📄 CETAK NASKAH SISWA</button>
                <button style={gayaTombol('#b91c1c', false)} onClick={() => cetakNaskah('kunci')}>🔑 CETAK KUNCI (PEGANGAN GURU)</button>
                <button style={gayaTombol('#15803d', false)} onClick={() => cetakLewatIframe(htmlLembarCatatan(meta, siap, { kertas: kodeKertas }), 'Lembar Catatan')}>📝 LEMBAR-CATATAN</button>
              </div>
            </>
          )}

          {gayaLembar === 'kotak' && (
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <button style={gayaTombol('#2563eb', siap.length === 0)} disabled={siap.length === 0} onClick={() => cetakLewatIframe(htmlPaketSiswa(meta, siap, { kertas: kodeKertas }), 'Paket Siswa')}>✂️ PAKET-SISWA</button>
              <button style={gayaTombol('#b91c1c', siap.length === 0)} disabled={siap.length === 0} onClick={() => cetakLewatIframe(htmlKunciTentor(meta, siap, { kertas: kodeKertas }), 'Kunci Tentor')}>🔑 KUNCI-TENTOR</button>
              <button style={gayaTombol('#15803d', siap.length === 0)} disabled={siap.length === 0} onClick={() => cetakLewatIframe(htmlLembarCatatan(meta, siap, { kertas: kodeKertas }), 'Lembar Catatan')}>📝 LEMBAR-CATATAN</button>
            </div>
          )}

          <div style={{ fontSize: 11, color: '#64748b', marginTop: 10, lineHeight: 1.6 }}>
            Di dialog cetak, pilih ukuran kertas yang SAMA dengan pilihan di atas dan
            biarkan margin “Default” supaya susunan yang Bapak/Ibu lihat di pratinjau
            persis pindah ke kertas. Aturan kertas bekas (docs/KERANGKA-KONTEN-BUKU.md):
            cetak SATU muka; bekas jadwal atau draft internal boleh, bekas absensi
            bernama / kwitansi / berkas keuangan TIDAK BOLEH.
          </div>
        </div>
      )}

      {/* 🔥 LAPISAN UKUR: blok naskah dirender sembunyi-sembunyi dengan lebar
          kolom sesungguhnya; tinggi tiap blok dibaca untuk penyusun halaman.
          visibility:hidden supaya tidak terlihat tetapi layout tetap dihitung. */}
      {gayaLembar === 'naskah' && siap.length > 0 && (
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
