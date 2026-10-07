// src/pages/admin/bank-soal/PotongPresisiPage.jsx
// ============================================================
// ✂️ POTONG PRESISI — menyelesaikan gambar soal dari BERKAS ASLI.
//
// KENAPA ADA (keluhan owner 2026-10-07, alur HTML Master Gemini Canvas):
//   hasil soal bagus, tapi gambarnya crop buatan AI yang tidak presisi.
//   Kajian membuktikan auto-locate dari crop AI tidak andal, jadi alat
//   ini membalik alurnya: MANUSIA yang memotong dari scan/PDF asli,
//   dibantu snap-tinta, lalu hasilnya dipasang menggantikan gambar
//   berflag ⚠️ atau mengisi antrean ✂️ potonganTertunda.
//
// Alur pakai (dijelaskan juga di layar):
//   1. buka soal dari antrean (atau cari manual);
//   2. pilih target: "ganti gambar ke-N" atau "potong untuk petunjuk ini";
//   3. buka berkas asli (JPG/PNG/PDF — PDF bisa pilih halaman);
//   4. seret kotak di atas figur → "Rapikan ke tinta";
//   5. "Simpan & pasang" → upload Supabase (jalurBankSoal) → updateDoc.
//
// Logika pembaruan dokumen MURNI & teruji di utils/potongPresisi.js;
// halaman ini hanya urusan kanvas, klik, dan progres — pola yang sama
// seperti ImporHtmlGeminiPage. Tidak menambah serverless function
// (upload langsung Supabase via uploadService, seperti jalur impor).
// ============================================================

import React, { useState, useEffect, useRef } from 'react';
import SidebarAdmin from '../../../components/SidebarAdmin';
import TeksSoalBergambar from '../../../components/TeksSoalBergambar';
import { collection, getDocs, updateDoc, doc } from 'firebase/firestore';
import { db } from '../../../firebase';
import { uploadElearningFile } from '../../../services/uploadService';
import { jalurBankSoal } from '../../../utils/jalurStorage';
import {
  FLAG_ASAL_GAMBAR,
  butuhPerbaikanGambar,
  kunciRect,
  snapKeTinta,
  namaPotongan,
  terapkanPotongan,
} from '../../../utils/potongPresisi';

// pdf.js dimuat malas HANYA untuk halaman admin ini (bundle siswa tidak
// ikut membesar); pola loader sama persis dengan utils/konversiPdfBuku.js.
let _pdfjs = null;
async function muatPdfjs() {
  if (_pdfjs) return _pdfjs;
  const lib = await import('pdfjs-dist/build/pdf');
  const worker = await import('pdfjs-dist/build/pdf.worker.min.js?url');
  lib.GlobalWorkerOptions.workerSrc = worker.default;
  _pdfjs = lib;
  return lib;
}

// Skala render halaman PDF ke kanvas: 2× cukup tajam untuk scan 150 dpi
// dan masih ringan di laptop admin (±15 MB/piksel data untuk A4).
const SKALA_PDF = 2;
const LEBAR_TAMPIL_MAX = 880;
const SISI_GAMBAR_MAX = 3600;

const gayaKartu = { background: 'white', border: '1px solid #e2e8f0', borderRadius: 12, padding: 14, marginBottom: 12 };
const gayaJudul = { fontSize: 12, fontWeight: 800, color: '#0f172a', marginBottom: 8 };
const gayaTombol = (warna, mati) => ({
  padding: '9px 14px', borderRadius: 10, border: 'none', background: warna, color: 'white',
  fontSize: 12.5, fontWeight: 800, cursor: mati ? 'not-allowed' : 'pointer', opacity: mati ? 0.5 : 1,
});
const gayaChip = (aktif) => ({
  padding: '6px 12px', borderRadius: 999, fontSize: 11.5, fontWeight: 800, cursor: 'pointer',
  border: aktif ? '1.5px solid #0f172a' : '1px solid #cbd5e1',
  background: aktif ? '#0f172a' : 'white', color: aktif ? 'white' : '#334155',
});

function badgeAsal(meta) {
  const asal = String(meta?.asal || '');
  if (FLAG_ASAL_GAMBAR.includes(asal)) return '⚠️ terindikasi buatan model';
  if (asal === 'url-asli') return `🌐 url-asli${meta?.sumber ? ` · ${meta.sumber}` : ''}`;
  if (asal === 'potongan-asli') return meta?.dipotongPresisi ? '✂️ potongan presisi ✅' : '✂️ potongan-asli';
  if (asal === 'warisan' || asal === 'asli-scan') return `📦 ${asal}`;
  return asal || '(tanpa pengakuan asal)';
}

async function muatGambarFile(file) {
  if (typeof createImageBitmap === 'function') {
    try { return await createImageBitmap(file); } catch { /* jatuh ke Image */ }
  }
  const url = URL.createObjectURL(file);
  try {
    const img = new Image();
    await new Promise((res, rej) => {
      img.onload = res;
      img.onerror = () => rej(new Error('Gambar tidak terbaca browser.'));
      img.src = url;
    });
    return img;
  } finally {
    setTimeout(() => URL.revokeObjectURL(url), 60000);
  }
}

export default function PotongPresisiPage() {
  const [isMobile] = useState(window.innerWidth <= 1024);
  const [dokumen, setDokumen] = useState([]);   // proyeksi bank_soal + _butuh
  const [muat, setMuat] = useState(true);
  const [filter, setFilter] = useState('semua');
  const [q, setQ] = useState('');               // cari manual (mode semua soal)
  const [terpilihId, setTerpilihId] = useState('');
  const [sumberInfo, setSumberInfo] = useState(null); // {nama, jenis, halaman, total}
  const [versiGambar, setVersiGambar] = useState(0);  // pemicu gambar ulang kanvas
  const [rect, setRect] = useState(null);             // koordinat KANVAS SUMBER (boleh negatif saat seret)
  const [target, setTarget] = useState(null);         // {jenis:'ganti',indeksGambar} | {jenis:'tambah',indeksTertunda}
  const [regionTambah, setRegionTambah] = useState('badan');
  const [busy, setBusy] = useState(false);
  const [pesan, setPesan] = useState(null);           // {jenis:'ok'|'err', teks}

  const kanvasDalam = useRef(null);    // resolusi penuh (sumber kebenaran piksel)
  const kanvasTampil = useRef(null);   // salinan tampil + kotak
  const kanvasPratinjau = useRef(null); // hasil potongan
  const sumberRef = useRef(null);      // {nama, jenis, pdf?} — objek pdf tidak masuk state
  const seretRef = useRef(null);       // {x0,y0} titik awal seret (koordinat sumber)

  // ---------- muat antrean ----------
  useEffect(() => {
    let batal = false;
    (async () => {
      try {
        const snap = await getDocs(collection(db, 'bank_soal'));
        if (batal) return;
        const daftar = [];
        snap.forEach((d) => {
          const v = d.data();
          const dok = {
            id: d.id,
            nomor: v.nomor ?? '',
            tipe: v.tipe || '',
            mataPelajaran: v.mataPelajaran || '',
            materi: v.materi || v.bab || '',
            kelas: v.kelas || '',
            soal: v.soal || v.teksSoal || '',
            opsiJawaban: Array.isArray(v.opsiJawaban) ? v.opsiJawaban : [],
            gambarUrls: Array.isArray(v.gambarUrls) ? v.gambarUrls : [],
            gambarMeta: Array.isArray(v.gambarMeta) ? v.gambarMeta : [],
            potonganTertunda: Array.isArray(v.potonganTertunda) ? v.potonganTertunda : [],
            pembahasan: v.pembahasan || '',
          };
          dok._butuh = butuhPerbaikanGambar(dok);
          daftar.push(dok);
        });
        setDokumen(daftar);
      } catch (e) {
        if (!batal) setPesan({ jenis: 'err', teks: `Gagal memuat bank soal: ${e.message}` });
      } finally {
        if (!batal) setMuat(false);
      }
    })();
    return () => { batal = true; };
  }, []);

  // ---------- gambar ulang kanvas tampil + kotak + pratinjau ----------
  useEffect(() => {
    const dalam = kanvasDalam.current;
    const tampil = kanvasTampil.current;
    const pv = kanvasPratinjau.current;
    if (!dalam || !tampil || dalam.width === 0) return;
    const lebarTampil = Math.min(LEBAR_TAMPIL_MAX, dalam.width);
    const tinggiTampil = Math.max(1, Math.round(dalam.height * (lebarTampil / dalam.width)));
    if (tampil.width !== lebarTampil || tampil.height !== tinggiTampil) {
      tampil.width = lebarTampil;
      tampil.height = tinggiTampil;
    }
    const ctx = tampil.getContext('2d');
    ctx.drawImage(dalam, 0, 0, dalam.width, dalam.height, 0, 0, lebarTampil, tinggiTampil);
    const r = kunciRect(rect, dalam.width, dalam.height, 4);
    if (r) {
      const s = lebarTampil / dalam.width;
      ctx.save();
      ctx.fillStyle = 'rgba(220, 38, 38, 0.07)';
      ctx.fillRect(r.x * s, r.y * s, r.lebar * s, r.tinggi * s);
      ctx.strokeStyle = '#dc2626';
      ctx.lineWidth = 2;
      ctx.setLineDash([6, 4]);
      ctx.strokeRect(r.x * s, r.y * s, r.lebar * s, r.tinggi * s);
      ctx.restore();
    }
    if (pv) {
      if (r) {
        const ps = Math.min(300 / r.lebar, 220 / r.tinggi, 1);
        pv.width = Math.max(1, Math.round(r.lebar * ps));
        pv.height = Math.max(1, Math.round(r.tinggi * ps));
        pv.getContext('2d').drawImage(dalam, r.x, r.y, r.lebar, r.tinggi, 0, 0, pv.width, pv.height);
        pv.style.display = 'block';
      } else {
        pv.style.display = 'none';
      }
    }
  }, [versiGambar, rect]);

  const terpilih = dokumen.find((d) => d.id === terpilihId) || null;

  // ---------- daftar yang ditampilkan ----------
  const qBersih = q.trim().toLowerCase();
  const daftarTampil = (() => {
    if (qBersih) {
      return dokumen
        .filter((d) => `${d.nomor} ${d.mataPelajaran} ${d.materi} ${d.kelas} ${d.soal}`.toLowerCase().includes(qBersih))
        .slice(0, 60);
    }
    return dokumen
      .filter((d) => {
        if (d._butuh.menunggu === 0 && d._butuh.dicurigai.length === 0) return false;
        if (filter === 'menunggu') return d._butuh.menunggu > 0;
        if (filter === 'dicurigai') return d._butuh.dicurigai.length > 0;
        return true;
      })
      .slice(0, 200);
  })();

  const totalMenunggu = dokumen.reduce((n, d) => n + d._butuh.menunggu, 0);
  const totalCuriga = dokumen.reduce((n, d) => n + d._butuh.dicurigai.length, 0);

  // ---------- buka berkas sumber ----------
  const gambarHalamanPdf = async (nomor) => {
    const s = sumberRef.current;
    if (!s || s.jenis !== 'pdf' || !s.pdf) return;
    const dalam = kanvasDalam.current;
    const page = await s.pdf.getPage(nomor);
    const vp = page.getViewport({ scale: SKALA_PDF });
    dalam.width = Math.floor(vp.width);
    dalam.height = Math.floor(vp.height);
    await page.render({ canvasContext: dalam.getContext('2d', { willReadFrequently: true }), viewport: vp }).promise;
    setSumberInfo((prev) => (prev ? { ...prev, halaman: nomor } : prev));
    setRect(null);
    setVersiGambar((v) => v + 1);
  };

  const bukaSumber = async (file) => {
    setBusy(true);
    setPesan(null);
    try {
      const dalam = kanvasDalam.current;
      if (!dalam) throw new Error('Kanvas belum siap — muat ulang halaman.');
      const isPdf = file.type === 'application/pdf' || /\.pdf$/i.test(file.name);
      if (isPdf) {
        const lib = await muatPdfjs();
        const buf = new Uint8Array(await file.arrayBuffer());
        const pdf = await lib.getDocument({ data: buf }).promise;
        sumberRef.current = { nama: file.name, jenis: 'pdf', pdf };
        setSumberInfo({ nama: file.name, jenis: 'pdf', halaman: 1, total: pdf.numPages });
        await gambarHalamanPdf(1);
      } else if (file.type.startsWith('image/')) {
        const bitmap = await muatGambarFile(file);
        const s = Math.min(1, SISI_GAMBAR_MAX / Math.max(bitmap.width || 1, bitmap.height || 1));
        dalam.width = Math.max(1, Math.round(bitmap.width * s));
        dalam.height = Math.max(1, Math.round(bitmap.height * s));
        dalam.getContext('2d', { willReadFrequently: true }).drawImage(bitmap, 0, 0, dalam.width, dalam.height);
        if (typeof bitmap.close === 'function') bitmap.close();
        sumberRef.current = { nama: file.name, jenis: 'gambar' };
        setSumberInfo({ nama: file.name, jenis: 'gambar', halaman: 1, total: 1 });
        setRect(null);
        setVersiGambar((v) => v + 1);
      } else {
        throw new Error('Format belum didukung — pakai PDF atau gambar (JPG/PNG) halaman scan aslinya.');
      }
    } catch (e) {
      setPesan({ jenis: 'err', teks: `Gagal membuka berkas: ${e.message}` });
    } finally {
      setBusy(false);
    }
  };

  // ---------- seret kotak ----------
  const titikSumber = (clientX, clientY) => {
    const tampil = kanvasTampil.current;
    const dalam = kanvasDalam.current;
    if (!tampil || !dalam || !dalam.width) return null;
    const kotak = tampil.getBoundingClientRect();
    if (!kotak.width) return null;
    const px = (clientX - kotak.left) * (tampil.width / kotak.width);
    const py = (clientY - kotak.top) * (tampil.height / kotak.height);
    const rasio = dalam.width / tampil.width;
    return { x: px * rasio, y: py * rasio };
  };

  const mulaiSeret = (cx, cy) => {
    const p = titikSumber(cx, cy);
    if (!p) return;
    seretRef.current = { x0: p.x, y0: p.y };
    setRect({ x: p.x, y: p.y, lebar: 0, tinggi: 0 });
  };
  const lanjutSeret = (cx, cy) => {
    const s = seretRef.current;
    if (!s) return;
    const p = titikSumber(cx, cy);
    if (!p) return;
    setRect({ x: s.x0, y: s.y0, lebar: p.x - s.x0, tinggi: p.y - s.y0 });
  };
  const selesaiSeret = () => {
    if (!seretRef.current) return;
    seretRef.current = null;
    const dalam = kanvasDalam.current;
    setRect((r) => (r && dalam ? kunciRect(r, dalam.width, dalam.height) : null));
  };

  // ---------- rapikan ke tinta ----------
  const rapikanKeTinta = () => {
    const dalam = kanvasDalam.current;
    if (!dalam || !dalam.width) { setPesan({ jenis: 'err', teks: 'Buka berkas asli dulu.' }); return; }
    const r = kunciRect(rect, dalam.width, dalam.height, 4);
    if (!r) { setPesan({ jenis: 'err', teks: 'Seret kotak di atas figur dulu, baru dirapikan ke tinta.' }); return; }
    const ctx = dalam.getContext('2d', { willReadFrequently: true });
    const cari = Math.round(Math.min(dalam.width, dalam.height) * 0.01) + 8;
    const x0 = Math.max(0, r.x - cari);
    const y0 = Math.max(0, r.y - cari);
    const x1 = Math.min(dalam.width, r.x + r.lebar + cari);
    const y1 = Math.min(dalam.height, r.y + r.tinggi + cari);
    const img = ctx.getImageData(x0, y0, Math.max(1, x1 - x0), Math.max(1, y1 - y0));
    const hasil = snapKeTinta(
      r,
      { data: img.data, lebar: img.width, tinggi: img.height, asalX: x0, asalY: y0 },
      { lebarHalaman: dalam.width, tinggiHalaman: dalam.height, margin: Math.max(4, Math.round(cari / 2)), cari },
    );
    if (!hasil) {
      setPesan({ jenis: 'err', teks: 'Tidak ada tinta di sekitar kotak — kotaknya meleset atau halamannya kosong. Perbesar kotaknya atau pindah halaman.' });
      return;
    }
    setRect(hasil);
    setPesan({ jenis: 'ok', teks: `Kotak dirapikan ke tepi tinta (${hasil.lebar}×${hasil.tinggi} px). Cocokkan dengan pratinjau, lalu simpan.` });
  };

  // ---------- simpan & pasang ----------
  const simpanPotongan = async () => {
    if (!terpilih) return;
    const dalam = kanvasDalam.current;
    if (!sumberInfo) { setPesan({ jenis: 'err', teks: 'Buka berkas asli (scan/PDF) dulu di panel bawah.' }); return; }
    if (!target) { setPesan({ jenis: 'err', teks: 'Pilih dulu targetnya di panel soal: tombol ✂️ pada gambar yang mau diganti, atau pada petunjuk yang menunggu potongan.' }); return; }
    const r = kunciRect(rect, dalam?.width || 0, dalam?.height || 0);
    if (!r || !dalam) { setPesan({ jenis: 'err', teks: 'Kotak potongan belum ada (atau terlalu kecil). Seret di atas figur, lalu "Rapikan ke tinta".' }); return; }
    setBusy(true);
    setPesan(null);
    try {
      const potong = document.createElement('canvas');
      potong.width = r.lebar;
      potong.height = r.tinggi;
      potong.getContext('2d').drawImage(dalam, r.x, r.y, r.lebar, r.tinggi, 0, 0, r.lebar, r.tinggi);
      const blob = await new Promise((res) => potong.toBlob(res, 'image/png'));
      if (!blob) throw new Error('Kanvas gagal diekspor jadi PNG.');
      const urutan = target.jenis === 'ganti' ? target.indeksGambar + 1 : terpilih.gambarUrls.length + 1;
      const nama = namaPotongan({ soalId: terpilih.id, urutan });
      const file = new File([blob], nama, { type: 'image/png' });
      const up = await uploadElearningFile(file, 'bank-soal', {
        jalur: jalurBankSoal({ mapel: terpilih.mataPelajaran, bab: terpilih.materi, nama }),
        kompres: false,
        contentType: 'image/png',
      });
      if (!up.success) throw new Error(up.error || 'Upload ke Supabase gagal.');
      const url = up.downloadURL || up.url;
      if (!url) throw new Error('Upload sukses tapi URL publik tidak kembali.');
      const hasil = terapkanPotongan(terpilih, {
        jenis: target.jenis,
        indeksGambar: target.indeksGambar ?? -1,
        indeksTertunda: target.indeksTertunda ?? -1,
        url,
        berkasSumber: sumberInfo.jenis === 'pdf' ? `${sumberInfo.nama} (hal ${sumberInfo.halaman})` : sumberInfo.nama,
        region: target.jenis === 'tambah' ? regionTambah : '',
      });
      if (!hasil.ok) throw new Error(hasil.galat);
      await updateDoc(doc(db, 'bank_soal', terpilih.id), hasil.perubahan);
      setDokumen((prev) => prev.map((d) => {
        if (d.id !== terpilih.id) return d;
        const baru = { ...d, ...hasil.perubahan };
        baru._butuh = butuhPerbaikanGambar(baru);
        return baru;
      }));
      const baruMenunggu = (hasil.perubahan.potonganTertunda ?? terpilih.potonganTertunda).length;
      const apa = target.jenis === 'ganti'
        ? `Gambar ke-${target.indeksGambar + 1} diganti potongan presisi dari ${sumberInfo.nama}.`
        : `Petunjuk tertunda selesai — gambar dipasang di ${regionTambah === 'badan' ? 'badan soal' : regionTambah === 'opsi' ? 'area opsi' : 'pembahasan'}.`;
      setPesan({
        jenis: 'ok',
        teks: `✅ Tersimpan & terpasang. ${apa} Sisa di soal ini: ${baruMenunggu} menunggu potongan. Berkas: ${up.filePath}`,
      });
      setTarget(null);
      setRect(null);
    } catch (e) {
      setPesan({ jenis: 'err', teks: `Gagal menyimpan potongan: ${e.message}` });
    } finally {
      setBusy(false);
    }
  };

  // ---------- render ----------
  return (
    <div style={{ display: 'flex', background: '#f8fafc', minHeight: '100vh' }}>
      <SidebarAdmin />
      <main style={{ marginLeft: isMobile ? '0' : '250px', padding: isMobile ? '15px' : '30px', width: '100%', boxSizing: 'border-box', transition: '0.3s' }}>
        <div style={{ maxWidth: 980, margin: '0 auto' }}>
          <h2 style={{ margin: '4px 0', fontSize: 18 }}>✂️ Potong Presisi — Gambar Soal</h2>
          <p style={{ fontSize: 12, color: '#64748b', margin: '0 0 12px' }}>
            Gambar buatan AI tidak presisi dan tidak bisa diperbaiki otomatis — yang andal adalah
            <b> memotong sendiri dari berkas scan/PDF aslinya</b>. Alat ini membantu: seret kotak di
            halaman asli, tombol <b>Rapikan ke tinta</b> mengunci kotak ke tepi gambar, lalu hasilnya
            langsung dipasang ke soal (mengganti gambar ⚠️ atau mengisi antrean ✂️). Teks soal tidak diubah sama sekali.
          </p>

          {pesan && (
            <div style={{
              ...gayaKartu, fontSize: 12.5,
              background: pesan.jenis === 'ok' ? '#ecfdf5' : '#fef2f2',
              borderColor: pesan.jenis === 'ok' ? '#10b981' : '#ef4444',
              color: pesan.jenis === 'ok' ? '#065f46' : '#991b1b',
            }}>
              {pesan.teks}
            </div>
          )}

          {/* ============ PANEL SOAL ============ */}
          {!terpilih ? (
            <div style={gayaKartu}>
              <div style={gayaJudul}>
                1️⃣ PILIH SOAL — antrean perbaikan gambar
                {muat ? ' (memuat…)' : ` · ✂️ ${totalMenunggu} gambar menunggu potongan · ⚠️ ${totalCuriga} gambar terindikasi buatan model`}
              </div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', marginBottom: 10 }}>
                <span style={gayaChip(filter === 'semua' && !qBersih)} onClick={() => { setFilter('semua'); setQ(''); }}>Semua perlu diperbaiki</span>
                <span style={gayaChip(filter === 'menunggu' && !qBersih)} onClick={() => { setFilter('menunggu'); setQ(''); }}>✂️ Menunggu potongan</span>
                <span style={gayaChip(filter === 'dicurigai' && !qBersih)} onClick={() => { setFilter('dicurigai'); setQ(''); }}>⚠️ Gambar dicurigai</span>
                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Cari soal lain: nomor / teks / mapel…"
                  style={{ flex: 1, minWidth: 200, padding: '8px 10px', fontSize: 12, border: '1px solid #cbd5e1', borderRadius: 8 }}
                />
              </div>
              {muat && <div style={{ fontSize: 12, color: '#64748b' }}>Memuat bank soal…</div>}
              {!muat && daftarTampil.length === 0 && (
                <div style={{ fontSize: 12, color: '#64748b' }}>
                  {qBersih ? 'Tidak ada soal yang cocok dengan pencarian.' : 'Tidak ada soal yang menunggu potongan atau berflag gambar dicurigai. 🎉'}
                </div>
              )}
              {daftarTampil.map((d) => (
                <div key={d.id} style={{ border: '1px solid #e2e8f0', borderRadius: 10, padding: 10, marginBottom: 8, background: '#fff' }}>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                    <b style={{ fontSize: 12.5 }}>{d.mataPelajaran || '(mapel?)'} · {d.materi || '(tanpa bab)'} · Soal {d.nomor || '?'}</b>
                    {d._butuh.menunggu > 0 && <span style={{ fontSize: 10.5, fontWeight: 800, background: '#fef3c7', color: '#92400e', borderRadius: 999, padding: '2px 8px' }}>✂️ {d._butuh.menunggu} menunggu</span>}
                    {d._butuh.dicurigai.length > 0 && <span style={{ fontSize: 10.5, fontWeight: 800, background: '#fee2e2', color: '#991b1b', borderRadius: 999, padding: '2px 8px' }}>⚠️ {d._butuh.dicurigai.length} dicurigai</span>}
                    <button style={{ ...gayaTombol('#0f172a', false), marginLeft: 'auto', padding: '6px 12px' }} onClick={() => { setTerpilihId(d.id); setTarget(null); setRect(null); }}>
                      Buka →
                    </button>
                  </div>
                  <div style={{ fontSize: 11.5, color: '#475569', marginTop: 4 }}>{String(d.soal).slice(0, 140)}{String(d.soal).length > 140 ? '…' : ''}</div>
                </div>
              ))}
            </div>
          ) : (
            <>
              <div style={gayaKartu}>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                  <button style={gayaTombol('#64748b', false)} onClick={() => { setTerpilihId(''); setTarget(null); }}>← Kembali ke antrean</button>
                  <b style={{ fontSize: 13 }}>{terpilih.mataPelajaran} · {terpilih.materi || '(tanpa bab)'} · Soal {terpilih.nomor || '?'} · {terpilih.tipe}</b>
                </div>
                <div style={{ fontSize: 12, marginTop: 10 }}>
                  <TeksSoalBergambar
                    teks={terpilih.soal}
                    gambarUrls={terpilih.gambarUrls}
                    gambarMeta={terpilih.gambarMeta}
                    region="badan"
                    gayaTeks={{ fontSize: 12.5, color: '#0f172a' }}
                  />
                </div>

                {terpilih.gambarUrls.length > 0 && (
                  <div style={{ marginTop: 12 }}>
                    <div style={gayaJudul}>2️⃣ GAMBAR TERSIMPAN — klik ✂️ pada gambar yang mau diganti potongan presisi</div>
                    <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                      {terpilih.gambarUrls.map((u, i) => {
                        const aktif = target?.jenis === 'ganti' && target.indeksGambar === i;
                        return (
                          <div key={`${u.slice(0, 40)}-${i}`} style={{ border: aktif ? '2px solid #dc2626' : '1px solid #e2e8f0', borderRadius: 10, padding: 6, width: 170, background: aktif ? '#fef2f2' : '#fff' }}>
                            <img src={u} alt={`Gambar soal ke-${i + 1}`} style={{ width: '100%', height: 110, objectFit: 'contain', background: '#f8fafc', borderRadius: 6 }} />
                            <div style={{ fontSize: 10, color: '#475569', margin: '4px 0' }}>#{i + 1} · {badgeAsal(terpilih.gambarMeta[i])}</div>
                            <button style={{ ...gayaTombol(aktif ? '#dc2626' : '#475569', false), width: '100%', padding: '6px 8px', fontSize: 11 }} onClick={() => setTarget(aktif ? null : { jenis: 'ganti', indeksGambar: i })}>
                              {aktif ? '✅ Target: ganti gambar ini' : '✂️ Ganti gambar ini'}
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {terpilih.potonganTertunda.length > 0 && (
                  <div style={{ marginTop: 12 }}>
                    <div style={gayaJudul}>✂️ PETUNJUK YANG MENUNGGU POTONGAN — siswa belum melihat gambar ini</div>
                    {terpilih.potonganTertunda.map((p, k) => {
                      const aktif = target?.jenis === 'tambah' && target.indeksTertunda === k;
                      return (
                        <div key={k} style={{ border: aktif ? '2px solid #dc2626' : '1px dashed #cbd5e1', borderRadius: 10, padding: 8, marginBottom: 6, background: aktif ? '#fef2f2' : '#fff' }}>
                          <div style={{ fontSize: 11.5, color: '#334155' }}>#{k + 1} {String(p?.petunjuk || '(tanpa petunjuk)').slice(0, 300)}</div>
                          <button style={{ ...gayaTombol(aktif ? '#dc2626' : '#475569', false), marginTop: 6, padding: '6px 10px', fontSize: 11 }} onClick={() => setTarget(aktif ? null : { jenis: 'tambah', indeksTertunda: k })}>
                            {aktif ? '✅ Target: isi petunjuk ini' : '✂️ Potong untuk petunjuk ini'}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}

                {target && (
                  <div style={{ marginTop: 10, fontSize: 12, background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10, padding: 8, color: '#991b1b' }}>
                    🎯 Target aktif: {target.jenis === 'ganti' ? `ganti gambar ke-${target.indeksGambar + 1}` : `isi petunjuk tertunda ke-${target.indeksTertunda + 1}`}
                    {target.jenis === 'tambah' && (
                      <span style={{ marginLeft: 10 }}>
                        · pasang di:{' '}
                        {['badan', 'opsi', 'pembahasan'].map((rg) => (
                          <label key={rg} style={{ marginRight: 8, cursor: 'pointer' }}>
                            <input type="radio" name="region" checked={regionTambah === rg} onChange={() => setRegionTambah(rg)} /> {rg}
                          </label>
                        ))}
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* ============ PANEL POTONG ============ */}
              <div style={gayaKartu}>
                <div style={gayaJudul}>3️⃣ POTONG DARI BERKAS ASLI</div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', marginBottom: 8 }}>
                  <label style={gayaTombol('#2563eb', busy)}>
                    📂 Buka berkas asli (scan JPG/PNG atau PDF)
                    <input
                      type="file"
                      accept="application/pdf,image/*"
                      style={{ display: 'none' }}
                      onChange={(e) => { const f = e.target.files?.[0]; if (f) bukaSumber(f); e.target.value = ''; }}
                    />
                  </label>
                  {sumberInfo && (
                    <span style={{ fontSize: 11.5, color: '#475569' }}>
                      {sumberInfo.nama}
                      {sumberInfo.jenis === 'pdf' && (
                        <span style={{ marginLeft: 8 }}>
                          <button style={gayaTombol('#94a3b8', busy || sumberInfo.halaman <= 1)} onClick={() => gambarHalamanPdf(sumberInfo.halaman - 1).catch((e) => setPesan({ jenis: 'err', teks: e.message }))}>‹ Halaman</button>
                          <b style={{ margin: '0 8px' }}>{sumberInfo.halaman} / {sumberInfo.total}</b>
                          <button style={gayaTombol('#94a3b8', busy || sumberInfo.halaman >= sumberInfo.total)} onClick={() => gambarHalamanPdf(sumberInfo.halaman + 1).catch((e) => setPesan({ jenis: 'err', teks: e.message }))}>Halaman ›</button>
                        </span>
                      )}
                    </span>
                  )}
                </div>
                {!sumberInfo && (
                  <div style={{ fontSize: 12, color: '#64748b' }}>
                    Belum ada berkas terbuka. Petunjuk potongan biasanya menyebut halaman — buka PDF/scan aslinya, pindah ke halaman itu, lalu seret kotak di atas figurnya.
                  </div>
                )}
                <canvas
                  ref={kanvasDalam}
                  style={{ display: 'none' }}
                />
                <canvas
                  ref={kanvasTampil}
                  style={{ display: sumberInfo ? 'block' : 'none', width: '100%', borderRadius: 8, border: '1px solid #e2e8f0', cursor: 'crosshair', touchAction: 'none', background: '#fff' }}
                  onMouseDown={(e) => mulaiSeret(e.clientX, e.clientY)}
                  onMouseMove={(e) => lanjutSeret(e.clientX, e.clientY)}
                  onMouseUp={() => selesaiSeret()}
                  onMouseLeave={() => selesaiSeret()}
                  onTouchStart={(e) => { const t = e.touches[0]; if (t) mulaiSeret(t.clientX, t.clientY); }}
                  onTouchMove={(e) => { const t = e.touches[0]; if (t) lanjutSeret(t.clientX, t.clientY); }}
                  onTouchEnd={() => selesaiSeret()}
                />
                {sumberInfo && (
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', marginTop: 10 }}>
                    <button style={gayaTombol('#0f172a', busy)} onClick={rapikanKeTinta}>🧲 Rapikan ke tinta</button>
                    <button style={gayaTombol('#94a3b8', busy)} onClick={() => setRect(null)}>↺ Reset kotak</button>
                    <div style={{ textAlign: 'center' }}>
                      <canvas ref={kanvasPratinjau} style={{ display: 'none', maxWidth: 300, maxHeight: 220, border: '1px solid #cbd5e1', borderRadius: 8, background: '#fff' }} />
                      <div style={{ fontSize: 10.5, color: '#64748b' }}>pratinjau hasil potongan</div>
                    </div>
                    <button style={{ ...gayaTombol('#16a34a', busy || !target || !rect), marginLeft: 'auto', padding: '12px 18px' }} onClick={simpanPotongan} disabled={busy || !target || !rect}>
                      {busy ? '⏳ Menyimpan…' : '💾 4️⃣ Simpan & pasang ke soal'}
                    </button>
                  </div>
                )}
                <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 8 }}>
                  Batas jujur: alat ini tidak menebak posisi gambar — kamulah yang menunjuk figurnya, alat hanya merapikan kotak ke tepi tinta dan memasang hasilnya. Hasil potongan disimpan sebagai PNG apa adanya (tanpa kompres), dicap <code>potongan-asli</code> + <code>dipotongPresisi</code> di metadata soal.
                </div>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
