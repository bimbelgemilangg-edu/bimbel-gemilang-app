// src/components/admin/ImporHtmlBab.jsx (v4)
// Mesin penerima hasil scan: terima BANYAK file .html sekaligus,
// validasi otomatis (svg hilang / tag terlarang / tabel markdown /
// placeholder gambar), isi URL potongan modul untuk placeholder,
// lalu simpan ke buku_digital/{bukuId}/bab/{babId} (tipe 'html').
// v4: tombol nonaktif TERLIHAT abu-abu; label berubah "✓ Tersimpan";
//     pesan sukses menegaskan data sudah masuk & cara melihatnya.
import { useRef, useState } from 'react';
import { db } from '../../firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { bersihkanHtml, daftarPlaceholder, hitungPattern } from '../../utils/htmlBersih';

const slug = (s) => String(s || '').toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

function periksa(teks) {
  const bersih = bersihkanHtml(teks);
  const w = [];
  let ditolak = false;
  const svgSebelum = hitungPattern(teks, /<svg[\s>]/gi);
  const svgSesudah = hitungPattern(bersih, /<svg[\s>]/gi);
  if (svgSesudah < svgSebelum) w.push(`⚠️ ${svgSebelum - svgSesudah} SVG hilang saat pembersihan — JANGAN simpan, kirim file ini ke QA.`);
  if (/<script|<iframe/i.test(teks)) { w.push('⛔ Ada tag terlarang (script/iframe) — file ditolak.'); ditolak = true; }
  if (/<img[\s>]/i.test(teks)) w.push('⚠️ Ada <img> (akan dibuang sanitizer). Pastikan bukan figur penting.');
  if (/\|\s*---/.test(teks)) w.push('ℹ️ Tabel markdown ditemukan → sudah dinormalisasi menjadi <table>.');
  const soal = hitungPattern(bersih, /class="soal"/g);
  const kunci = hitungPattern(bersih, /<details/g);
  const svg = svgSesudah;
  const ph = daftarPlaceholder(bersih);
  return { bersih, w, ditolak, soal, kunci, svg, ph };
}

const st = {
  lapis: { position: 'fixed', inset: 0, zIndex: 970, background: 'rgba(15,17,35,.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 },
  kartu: { background: '#fff', borderRadius: 14, padding: 16, width: 'min(860px, 96vw)', maxHeight: '90vh', overflow: 'auto' },
  judul: { fontSize: 15, fontWeight: 800, color: '#1e293b', marginBottom: 4 },
  sub: { fontSize: 11, color: '#64748b', marginBottom: 12, lineHeight: 1.6 },
  baris: { border: '1px solid #e3e6ef', borderRadius: 12, padding: 12, marginBottom: 10, background: '#fcfcfd' },
  label: { display: 'flex', flexDirection: 'column', gap: 4, fontSize: 11, fontWeight: 700, color: '#475569' },
  input: { border: '1px solid #cbd5e1', borderRadius: 8, padding: '7px 9px', fontSize: 12, color: '#1e293b', background: '#fff' },
  btn: { display: 'flex', alignItems: 'center', gap: 6, background: '#4C6EF5', color: '#fff', border: 'none', borderRadius: 8, padding: '9px 14px', fontSize: 12, fontWeight: 800, cursor: 'pointer' },
  btnMat: { display: 'flex', alignItems: 'center', gap: 6, background: '#cbd5e1', color: '#f8fafc', border: 'none', borderRadius: 8, padding: '9px 14px', fontSize: 12, fontWeight: 800, cursor: 'not-allowed' },
  btn2: { display: 'flex', alignItems: 'center', gap: 6, background: '#f1f5f9', color: '#334155', border: 'none', borderRadius: 8, padding: '9px 14px', fontSize: 12, fontWeight: 700, cursor: 'pointer' },
  btn2Mat: { display: 'flex', alignItems: 'center', gap: 6, background: '#f1f5f9', color: '#94a3b8', border: 'none', borderRadius: 8, padding: '9px 14px', fontSize: 12, fontWeight: 700, cursor: 'not-allowed' },
  ok: { color: '#16a34a', fontSize: 11.5, fontWeight: 800 },
  warn: { color: '#92400e', fontSize: 11.5, fontWeight: 700 },
  err: { color: '#dc2626', fontSize: 11.5, fontWeight: 700 },
  meta: { fontSize: 11, color: '#64748b' },
};

export default function ImporHtmlBab({ terbuka, tutup, bukuId, jumlahBab = 0 }) {
  const [antrian, setAntrian] = useState([]);
  const [pesan, setPesan] = useState('');
  const [busy, setBusy] = useState(false);
  const fileRef = useRef(null);
  if (!terbuka) return null;

  const adaSiap = antrian.some((x) => x.status === 'siap');
  const ubah = (key, patch) => setAntrian((p) => p.map((x) => (x.key === key ? { ...x, ...patch } : x)));
  const ubahPh = (key, ph, url) => setAntrian((p) => p.map((x) => (x.key === key ? { ...x, phUrl: { ...x.phUrl, [ph]: url } } : x)));

  async function tambahFiles(files) {
    const daftar = Array.from(files || []).filter((f) => /\.html?$/i.test(f.name));
    if (!daftar.length) { setPesan('❌ Hanya file .html yang diterima.'); return; }
    const baru = [];
    for (let i = 0; i < daftar.length; i++) {
      const f = daftar[i];
      const teks = await f.text();
      const hasil = periksa(teks);
      const mNomor = f.name.match(/bab\s*(\d+)/i);
      const judul = f.name.replace(/\.html?$/i, '').replace(/bab\s*\d+\s*[-_]?\s*/i, '').replace(/[-_]+/g, ' ').trim() || f.name;
      baru.push({
        key: `${Date.now()}-${i}-${f.name}`,
        nama: f.name,
        judul: judul.charAt(0).toUpperCase() + judul.slice(1),
        urutan: mNomor ? Number(mNomor[1]) : jumlahBab + i + 1,
        teks,
        hasil,
        phUrl: {},
        status: hasil.ditolak ? 'ditolak' : 'siap',
      });
    }
    setAntrian((p) => [...p, ...baru]);
    setPesan(`✅ ${baru.length} file dimuat & diperiksa.`);
  }

  async function simpanSatu(row) {
    if (row.hasil.ditolak || row.status !== 'siap') return;
    let isi = row.hasil.bersih;
    for (const ph of row.hasil.ph) {
      const url = (row.phUrl[ph] || '').trim();
      if (url) isi = isi.split(`<div class="figslot">${ph}</div>`).join(`<img src="${url}" alt="figur modul" style="max-width:100%;display:block;margin:10px auto;border-radius:10px">`);
    }
    const id = 'bab-' + (slug(row.judul) || Date.now().toString(36));
    const lama = await getDoc(doc(db, 'buku_digital', bukuId, 'bab', id));
    if (lama.exists() && !window.confirm(`Bab "${row.judul}" sudah ada di buku ini. Timpa dengan versi baru ini?`)) {
      ubah(row.key, { status: 'siap' });
      setPesan('ℹ️ Penimpaan dibatalkan — bab lama tidak berubah.');
      return;
    }
    await setDoc(doc(db, 'buku_digital', bukuId, 'bab', id), {
      id,
      judul: row.judul.trim(),
      urutan: Number(row.urutan) || jumlahBab + 1,
      tipe: 'html',
      html: isi,
      sumber: 'html-scan',
      updatedAt: Date.now(),
    }, { merge: true });
    ubah(row.key, { status: 'tersimpan' });
    setPesan(`✅ "${row.judul}" SUDAH masuk ke buku (urutan ${row.urutan}). Klik Tutup untuk melihat daftar bab & membukanya di reader.`);
  }

  async function simpanSemua() {
    setBusy(true);
    setPesan('Menyimpan...');
    try {
      for (const row of antrian) {
        if (row.status !== 'siap') continue;
        await simpanSatu(row);
      }
      setPesan('✅ Proses selesai. Semua bab bertipe HTML terbit ke siswa.');
    } catch (e) {
      setPesan('❌ Gagal: ' + e.message);
    }
    setBusy(false);
  }

  return (
    <div style={st.lapis} onClick={tutup}>
      <div style={st.kartu} onClick={(e) => e.stopPropagation()}>
        <div style={st.judul}>📥 Impor Bab dari HTML Hasil Scan</div>
        <div style={st.sub}>
          Pilih SEMUA file .html hasil scan sekaligus (bab02-..., bab03-..., dst). Mesin memeriksa otomatis: SVG utuh, tag terlarang, tabel markdown,
          dan placeholder figur. Placeholder <b>{'{{GAMBAR_...}}'}</b> bisa ditambal URL potongan dari fitur <b>✂️ Gambar dari Modul</b> sebelum disimpan.
          Tombol abu-abu = tidak aktif (sudah tersimpan / tidak ada yang siap).
        </div>
        <input ref={fileRef} type="file" accept=".html,.htm" multiple style={{ display: 'none' }} onChange={(e) => { tambahFiles(e.target.files); if (fileRef.current) fileRef.current.value = ''; }} />
        <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
          <button style={st.btn2} onClick={() => fileRef.current && fileRef.current.click()}>📂 Pilih file .html (bisa banyak)</button>
          <button style={busy || !adaSiap ? st.btnMat : st.btn} disabled={busy || !adaSiap} onClick={simpanSemua}>💾 Simpan Semua yang Siap</button>
          <button style={st.btn2} onClick={tutup}>Tutup</button>
        </div>
        {pesan && <div style={{ marginBottom: 10, fontSize: 12, fontWeight: 800, color: pesan.startsWith('❌') ? '#dc2626' : pesan.startsWith('ℹ️') ? '#92400e' : '#16a34a' }}>{pesan}</div>}
        {antrian.map((row) => (
          <div key={row.key} style={st.baris}>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', marginBottom: 8 }}>
              <b style={{ fontSize: 12.5, color: '#1e293b' }}>{row.nama}</b>
              <span style={st.meta}>{row.hasil.soal} soal • {row.hasil.svg} svg • {row.hasil.kunci} kunci</span>
              <span style={row.status === 'tersimpan' ? st.ok : row.status === 'ditolak' ? st.err : st.meta}>
                [{row.status}]
              </span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 8, marginBottom: 8 }}>
              <label style={st.label}>Judul bab
                <input style={st.input} value={row.judul} onChange={(e) => ubah(row.key, { judul: e.target.value })} />
              </label>
              <label style={st.label}>Urutan
                <input style={st.input} type="number" value={row.urutan} onChange={(e) => ubah(row.key, { urutan: e.target.value })} />
              </label>
            </div>
            {row.hasil.w.map((w, i) => (
              <div key={i} style={w.startsWith('⛔') ? st.err : w.startsWith('⚠️') ? st.warn : st.meta}>{w}</div>
            ))}
            {row.hasil.ph.length > 0 && (
              <div style={{ marginTop: 8 }}>
                <div style={st.meta}>Placeholder figur (tempel URL dari ✂️ Gambar dari Modul, boleh dikosongkan):</div>
                {row.hasil.ph.map((ph) => (
                  <div key={ph} style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 4 }}>
                    <code style={{ fontSize: 10.5, color: '#4338ca', minWidth: 150 }}>{ph}</code>
                    <input style={{ ...st.input, flex: 1 }} placeholder="https://...supabase.co/...jpg" value={row.phUrl[ph] || ''} onChange={(e) => ubahPh(row.key, ph, e.target.value)} />
                  </div>
                ))}
              </div>
            )}
            <div style={{ marginTop: 8, display: 'flex', gap: 8, alignItems: 'center' }}>
              <button
                style={busy || row.status !== 'siap' ? st.btnMat : st.btn}
                disabled={busy || row.status !== 'siap'}
                onClick={() => simpanSatu(row)}
              >
                {row.status === 'tersimpan' ? '✓ Tersimpan' : '💾 Simpan bab ini'}
              </button>
              <button style={st.btn2} onClick={() => setAntrian((p) => p.filter((x) => x.key !== row.key))}>Buang</button>
              {row.status === 'tersimpan' && <span style={st.ok}>Data sudah masuk Firestore — tidak perlu klik lagi.</span>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}