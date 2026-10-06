// src/pages/admin/bank-soal/ImporHtmlGeminiPage.jsx
// ============================================================
// IMPOR HTML GEMINI (Lapis 1b) — tempat keluaran prompt paten masuk
// ke bank soal TANPA lewat tim IT.
//
// Alur yang diminta owner 2026-10-06 ("aku mau buat html banyak,
// aku upload soal tka kimia, geografi, menumpuk tugasku"):
//   1. tempel/unggah SATU ATAU BANYAK berkas .html keluaran Gemini
//      (satu buku penuh yang digenerate per bagian boleh sekaligus);
//   2. Pratinjau & Validasi: ekstraktor menagih paten -- kartu tanpa
//      kunci/pembahasan DITOLAK dengan menyebut nama berkas + nomor
//      kartunya, jadi yang diulang hanya bagian yang salah;
//   3. Simpan: gambar base64 diunggah ke Supabase lebih dulu (dokumen
//      Firestore tidak boleh memuat base64: batas 1 MB), lalu dokumen
//      bank_soal ditulis per batch dengan taksonomi yang sama seperti
//      jalur impor JSON lama.
//
// Tidak ada logika pemetaan di halaman ini: semuanya di
// utils/ekstrakHtmlGemini.js & utils/imporHtmlGeminiKeBank.js (murni,
// teruji). Halaman hanya urusan klik & progres.
// ============================================================

import React, { useState } from 'react';
import SidebarAdmin from '../../../components/SidebarAdmin';
import { collection, writeBatch, doc } from 'firebase/firestore';
import { db } from '../../../firebase';
import { ekstrakBanyakHtml } from '../../../utils/ekstrakHtmlGemini';
import { dokumenDariButir, ringkasanImpor } from '../../../utils/imporHtmlGeminiKeBank';
import { PROMPT_PATEN_GEMINI } from '../../../utils/promptPatenGemini';
import { uploadElearningFile } from '../../../services/uploadService';
import { jalurBankSoal } from '../../../utils/jalurStorage';

const BATCH_MAX = 300;
const gayaKartu = { background: 'white', border: '1px solid #e2e8f0', borderRadius: 12, padding: 14, marginBottom: 12 };
const gayaJudul = { fontSize: 12, fontWeight: 800, color: '#0f172a', marginBottom: 8 };
const gayaTombol = (warna, mati) => ({
  padding: '10px 16px', borderRadius: 10, border: 'none', background: warna, color: 'white',
  fontSize: 12.5, fontWeight: 800, cursor: mati ? 'not-allowed' : 'pointer', opacity: mati ? 0.5 : 1,
});

function dataUrlKeFile(dataUrl, nama) {
  const [meta, isi] = dataUrl.split(',');
  const mime = /data:(.*?);/.exec(meta)?.[1] || 'image/jpeg';
  const bin = atob(isi);
  const arr = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i += 1) arr[i] = bin.charCodeAt(i);
  return new File([arr], nama, { type: mime });
}

export default function ImporHtmlGeminiPage() {
  const [berkas, setBerkas] = useState([]);       // [{nama, teks}]
  const [tempelan, setTempelan] = useState('');
  const [hint, setHint] = useState({ mapel: '', jenjang: 'SMA', kelas: '' });
  const [hasil, setHasil] = useState(null);
  const [pesan, setPesan] = useState('');
  const [busy, setBusy] = useState(false);
  const [progres, setProgres] = useState('');
  const [tersalin, setTersalin] = useState(false);
  // 🔥 FIX (2026-10-07, keluhan owner: "sidebar tetap gak ada"): di repo ini
  // AdminRoute HANYA menjaga akses, tidak merender layout. Halaman admin
  // tingkat-atas WAJIB merender <SidebarAdmin /> sendiri (lihat TeacherList,
  // SchedulePage). Halaman ini lupa, sehingga tampil telanjang tanpa
  // sidebar dan menu-menu baru terasa "tidak pernah ada".
  const [isMobile] = useState(window.innerWidth <= 1024);

  // 🔥 BARU: prompt paten hidup DI SINI (sumber tunggal
  // src/utils/promptPatenGemini.js), supaya owner tidak berburu ke
  // dokumen/markdown lagi -- pertanyaan nyata 2026-10-06: "dimana
  // menemukan prompt untuk gemini?"
  const salinPrompt = async () => {
    try {
      await navigator.clipboard.writeText(PROMPT_PATEN_GEMINI);
      setTersalin(true);
      setTimeout(() => setTersalin(false), 2500);
    } catch {
      setPesan('⚠️ Browser menolak salin otomatis: buka lipatan prompt, blok isinya (Ctrl+A di kotak), salin manual.');
    }
  };

  const tambahBerkas = async (files) => {
    const list = Array.from(files || []).filter((f) => /\.(html?|txt|md)$/i.test(f.name) || /html|plain/.test(f.type));
    if (!list.length) { setPesan('⚠️ Hanya berkas .html yang diterima.'); return; }
    const baru = [];
    for (const f of list) baru.push({ nama: f.name, teks: await f.text() });
    setBerkas((lama) => [...lama, ...baru]);
    setHasil(null);
    setPesan(`✅ ${baru.length} berkas masuk antrean. (.html/.txt/.md semua diterima — isinya yang ditagih paten, bukan ekstensinya.)`);
  };

  const pratinjau = () => {
    const semua = [...berkas];
    if (tempelan.trim()) semua.push({ nama: 'tempelan.html', teks: tempelan });
    if (!semua.length) { setPesan('⚠️ Belum ada berkas HTML.'); return; }
    const h = ekstrakBanyakHtml(semua);
    setHasil(h);
    setPesan(h.kesalahan.length
      ? `⛔ ${h.kesalahan.length} pelanggaran paten — perbaiki berkas yang disebut, lalu pratinjau lagi.`
      : `✅ ${h.soal.length} soal lolos paten, siap disimpan.`);
  };

  const simpan = async () => {
    if (!hasil || hasil.kesalahan.length || !hasil.soal.length) return;
    setBusy(true);
    try {
      // 1) gambar base64 -> Supabase (jalan dulu, supaya dokumen Firestore
      //    hanya menyimpan URL, bukan megabyte)
      const urlGambar = new Map();
      for (let i = 0; i < hasil.gambar.length; i += 1) {
        const g = hasil.gambar[i];
        if (!g.src.startsWith('data:')) { urlGambar.set(`${g.kartu}|${g.urutan}`, g.src); continue; }
        setProgres(`Mengunggah gambar ${i + 1}/${hasil.gambar.length} …`);
        const bab = hasil.soal.find((s) => s.idKartu === g.kartu)?.materi || '';
        const up = await uploadElearningFile(dataUrlKeFile(g.src, `gemini-${g.kartu.replace(/[^a-z0-9-]/gi, '_')}-${g.urutan}.jpg`), 'bank-soal', {
          jalur: jalurBankSoal({ mapel: hint.mapel, bab, nama: `g${g.urutan}.jpg` }),
        });
        if (up.success) urlGambar.set(`${g.kartu}|${g.urutan}`, up.downloadURL || up.url);
      }

      // 2) rangkai gambar ke butirnya sesuai urutan kemunculan
      const soalSiap = hasil.soal.map((s) => {
        const urls = hasil.gambar
          .filter((g) => g.kartu === s.idKartu)
          .sort((a, b) => a.urutan - b.urutan)
          .map((g) => urlGambar.get(`${g.kartu}|${g.urutan}`))
          .filter(Boolean);
        return { ...s, gambarUrls: urls };
      });

      // 3) tulis ke bank_soal per batch
      const ringkasan = ringkasanImpor(soalSiap);
      let tersimpan = 0;
      for (let i = 0; i < soalSiap.length; i += BATCH_MAX) {
        const slice = soalSiap.slice(i, i + BATCH_MAX);
        const batch = writeBatch(db);
        for (const butir of slice) {
          const dokumen = dokumenDariButir(butir, {
            fileName: butir.asalBerkas || 'impor-html-gemini',
            mapel: hint.mapel, jenjang: hint.jenjang, kelas: hint.kelas,
            sumber: butir.sumber,
          });
          batch.set(doc(collection(db, 'bank_soal')), dokumen);
        }
        setProgres(`Menyimpan ${Math.min(i + BATCH_MAX, soalSiap.length)}/${soalSiap.length} soal …`);
        await batch.commit();
        tersimpan += slice.length;
      }
      setPesan(`✅ ${tersimpan} soal tersimpan di ${ringkasan.perBab.length} bab.${ringkasan.penalaran ? ` ${ringkasan.penalaran} pembahasan hasil penalaran AI — periksa sebelum dipakai mengajar.` : ''} Lihat sebarannya di Perpustakaan.`);
      setHasil(null);
      setBerkas([]);
      setTempelan('');
    } catch (e) {
      setPesan(`❌ Gagal menyimpan: ${e?.message || e}`);
    } finally {
      setBusy(false);
      setProgres('');
    }
  };

  const ringkas = hasil ? ringkasanImpor(hasil.soal) : null;

  return (
    <div style={{ display: 'flex', background: '#f8fafc', minHeight: '100vh' }}>
      <SidebarAdmin />
      <main style={{ marginLeft: isMobile ? '0' : '250px', padding: isMobile ? '15px' : '30px', width: '100%', boxSizing: 'border-box', transition: '0.3s' }}>
    <div style={{ maxWidth: 900, margin: '0 auto' }}>
      <h2 style={{ margin: '4px 0', fontSize: 18 }}>📥 Impor HTML Gemini</h2>
      <p style={{ fontSize: 12, color: '#64748b', margin: '0 0 12px' }}>
        Tempel atau unggah keluaran <b>prompt paten</b> (docs/PROMPT-PATEN-SCAN-GEMINI.md).
        Banyak berkas sekaligus boleh — satu buku yang digenerate per bagian akan
        digabung dan duplikatnya dibuang otomatis.
      </p>

      <details style={gayaKartu}>
        <summary style={{ fontSize: 12, fontWeight: 800, cursor: 'pointer', color: '#5b21b6' }}>
          📋 Prompt paten untuk Gemini — buka lipatan ini dulu sebelum memindai
        </summary>
        <div style={{ display: 'flex', gap: 8, margin: '10px 0', flexWrap: 'wrap', alignItems: 'center' }}>
          <button onClick={salinPrompt} style={gayaTombol('#7c3aed', false)}>
            {tersalin ? '✅ Tersalin! Tempel ke Gemini' : 'Salin Prompt'}
          </button>
          <span style={{ fontSize: 11, color: '#64748b' }}>
            Tempel ke Gemini bersama halaman scan, maksimal ±10 halaman per putaran.
          </span>
        </div>
        <pre style={{ whiteSpace: 'pre-wrap', fontSize: 10.5, lineHeight: 1.5, background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, padding: 10, maxHeight: 280, overflow: 'auto' }}>{PROMPT_PATEN_GEMINI}</pre>
      </details>

      <div style={gayaKartu}>
        <div style={gayaJudul}>1 · Berkas HTML dari Gemini</div>
        <input type="file" accept=".html,.htm,.txt,.md,text/html,text/plain" multiple onChange={(e) => { tambahBerkas(e.target.files); e.target.value = ''; }} />
        <textarea
          value={tempelan}
          onChange={(e) => setTempelan(e.target.value)}
          placeholder="…atau tempel HTML di sini"
          style={{ width: '100%', minHeight: 90, marginTop: 8, padding: 8, borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 11.5 }}
        />
        {berkas.length > 0 && (
          <div style={{ fontSize: 11.5, color: '#475569', marginTop: 6 }}>
            Antrean: {berkas.map((b) => b.nama).join(', ')}
            <button onClick={() => { setBerkas([]); setHasil(null); }} style={{ marginLeft: 8, fontSize: 10.5, color: '#b91c1c', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 800 }}>kosongkan</button>
          </div>
        )}
      </div>

      <div style={gayaKartu}>
        <div style={gayaJudul}>2 · Identitas (bab diambil otomatis dari section-header)</div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', fontSize: 12 }}>
          <label>Mapel <input value={hint.mapel} onChange={(e) => setHint({ ...hint, mapel: e.target.value })} placeholder="Kimia / Geografi / …" style={{ padding: '7px 8px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 12 }} /></label>
          <label>Jenjang
            <select value={hint.jenjang} onChange={(e) => setHint({ ...hint, jenjang: e.target.value })} style={{ padding: '7px 8px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 12 }}>
              {['SD', 'SMP', 'SMA', 'SMK'].map((j) => <option key={j}>{j}</option>)}
            </select>
          </label>
          <label>Kelas <input value={hint.kelas} onChange={(e) => setHint({ ...hint, kelas: e.target.value })} placeholder="7/8/9/10/11/12" style={{ padding: '7px 8px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 12, width: 70 }} /></label>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
        <button style={gayaTombol('#2563eb', busy)} disabled={busy} onClick={pratinjau}>🔍 Pratinjau & Validasi</button>
        <button style={gayaTombol('#16a34a', busy || !hasil || hasil.kesalahan.length > 0 || !hasil.soal.length)} disabled={busy || !hasil || hasil.kesalahan.length > 0 || !hasil.soal.length} onClick={simpan}>
          💾 Simpan ke Bank Soal
        </button>
      </div>
      {progres && <div style={{ fontSize: 12, color: '#1d4ed8', marginBottom: 8 }}>⏳ {progres}</div>}
      {pesan && <div style={{ fontSize: 12, color: pesan.startsWith('❌') || pesan.startsWith('⛔') ? '#b91c1c' : '#15803d', background: pesan.startsWith('❌') || pesan.startsWith('⛔') ? '#fef2f2' : '#f0fdf4', border: '1px solid ' + (pesan.startsWith('❌') || pesan.startsWith('⛔') ? '#fecaca' : '#bbf7d0'), borderRadius: 10, padding: '8px 12px', marginBottom: 12 }}>{pesan}</div>}

      {hasil && (
        <div style={gayaKartu}>
          <div style={gayaJudul}>3 · Hasil penagihan paten</div>
          <div style={{ fontSize: 12, marginBottom: 8 }}>
            <b>{ringkas.jumlah}</b> soal lolos · <b>{ringkas.perBab.length}</b> bab · <b>{hasil.gambar.length}</b> gambar · <b>{ringkas.penalaran}</b> pembahasan penalaran AI · <b>{hasil.duplikat || 0}</b> duplikat dibuang
          </div>
          <div style={{ fontSize: 11.5, color: '#475569', marginBottom: 8 }}>
            {ringkas.perBab.map(([b, n]) => `${b} (${n})`).join(' · ')}
          </div>
          {hasil.peringatan.length > 0 && (
            <details style={{ fontSize: 11.5, color: '#92400e', marginBottom: 8 }}>
              <summary>{hasil.peringatan.length} peringatan (tidak menghalangi)</summary>
              <ul style={{ margin: '6px 0 0 16px' }}>{hasil.peringatan.slice(0, 40).map((w, i) => <li key={i}>{w}</li>)}</ul>
            </details>
          )}
          {hasil.kesalahan.length > 0 && (
            <div style={{ fontSize: 11.5, color: '#b91c1c' }}>
              <b>{hasil.kesalahan.length} pelanggaran paten (penyimpanan dikunci):</b>
              <ul style={{ margin: '6px 0 0 16px' }}>{hasil.kesalahan.slice(0, 40).map((k, i) => <li key={i}>{k}</li>)}</ul>
              {hasil.kesalahan.length > 40 && <div>… dan {hasil.kesalahan.length - 40} lainnya.</div>}
            </div>
          )}
        </div>
      )}
    </div>
      </main>
    </div>
  );
}