// src/components/admin/ImporHtmlBab.jsx
// Modal impor bab dari file/teks HTML (v2).
// v2: kolom "urutan" DIHAPUS (membingungkan) — urutan diisi otomatis
//     sebagai nomor berikutnya di daftar isi.
//     Menimpa bab lama: impor dengan JUDUL yang sama akan memperbarui
//     bab yang sudah ada (id = slug judul), tidak membuat duplikat.
import { useRef, useState } from 'react';
import { db } from '../../firebase';
import { doc, setDoc } from 'firebase/firestore';
import { bersihkanHtml } from '../../utils/htmlBersih';

const slug = (s) => String(s || '').toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

const st = {
  lapis: { position: 'fixed', inset: 0, zIndex: 970, background: 'rgba(15,17,35,.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 },
  kartu: { background: '#fff', borderRadius: 14, padding: 16, width: 'min(760px, 96vw)', maxHeight: '88vh', overflow: 'auto' },
  judul: { fontSize: 15, fontWeight: 800, color: '#1e293b', marginBottom: 4 },
  sub: { fontSize: 11, color: '#64748b', marginBottom: 12, lineHeight: 1.6 },
  label: { display: 'flex', flexDirection: 'column', gap: 4, fontSize: 11, fontWeight: 700, color: '#475569' },
  input: { border: '1px solid #cbd5e1', borderRadius: 8, padding: '8px 10px', fontSize: 12, color: '#1e293b', background: '#fff' },
  area: { width: '100%', minHeight: 220, border: '1px solid #cbd5e1', borderRadius: 8, padding: 10, fontSize: 11, fontFamily: 'monospace', color: '#1e293b', background: '#fff', boxSizing: 'border-box' },
  btn: { display: 'flex', alignItems: 'center', gap: 6, background: '#4C6EF5', color: '#fff', border: 'none', borderRadius: 8, padding: '9px 14px', fontSize: 12, fontWeight: 800, cursor: 'pointer' },
  btn2: { display: 'flex', alignItems: 'center', gap: 6, background: '#f1f5f9', color: '#334155', border: 'none', borderRadius: 8, padding: '9px 14px', fontSize: 12, fontWeight: 700, cursor: 'pointer' },
  info: { background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 8, padding: '8px 10px', fontSize: 11, color: '#1d4ed8', lineHeight: 1.6, marginBottom: 10 },
};

export default function ImporHtmlBab({ terbuka, tutup, bukuId, jumlahBab = 0 }) {
  const [judul, setJudul] = useState('');
  const [teks, setTeks] = useState('');
  const [pesan, setPesan] = useState('');
  const [busy, setBusy] = useState(false);
  const fileRef = useRef(null);
  if (!terbuka) return null;

  const urutanOtomatis = jumlahBab + 1;

  async function bacaFile(f) {
    if (!f) return;
    try {
      const t = await f.text();
      setTeks(t);
      if (!judul) setJudul(f.name.replace(/\.html?$/i, '').replace(/[_-]+/g, ' ').trim());
      setPesan(`✅ File "${f.name}" dimuat. Cek judul, lalu Simpan & Terbitkan.`);
    } catch (e) {
      setPesan('❌ Gagal membaca file: ' + e.message);
    }
    if (fileRef.current) fileRef.current.value = '';
  }

  async function simpan() {
    if (!judul.trim()) { setPesan('❌ Judul bab wajib diisi.'); return; }
    if (!teks.trim() || !/<[a-z]/i.test(teks)) { setPesan('❌ Isi HTML kosong atau bukan HTML.'); return; }
    setBusy(true);
    setPesan('Menyimpan & menerbitkan...');
    try {
      const id = 'bab-' + (slug(judul) || Date.now().toString(36));
      await setDoc(doc(db, 'buku_digital', bukuId, 'bab', id), {
        id,
        judul: judul.trim(),
        urutan: urutanOtomatis,
        tipe: 'html',
        html: bersihkanHtml(teks),
        sumber: 'html',
        updatedAt: Date.now(),
      }, { merge: true });
      setPesan('✅ Bab HTML tersimpan & terbit ke siswa.');
      setTimeout(tutup, 700);
    } catch (e) {
      setPesan('❌ Gagal simpan: ' + e.message);
    }
    setBusy(false);
  }

  return (
    <div style={st.lapis} onClick={tutup}>
      <div style={st.kartu} onClick={(e) => e.stopPropagation()}>
        <div style={st.judul}>📥 Impor Bab dari HTML</div>
        <div style={st.sub}>
          Tempel kode HTML modul (atau pilih file .html). Isi dibersihkan otomatis (script dibuang)
          lalu disimpan sebagai bab bertipe <b>html</b> — reader siswa merendernya sebagai modul interaktif.
        </div>
        <div style={st.info}>
          📌 Urutan di daftar isi: <b>otomatis nomor {urutanOtomatis}</b>.<br />
           Impor dengan <b>judul yang sama</b> = memperbarui bab yang sudah ada (tidak duplikat) —
          pakai ini untuk mengirim ulang perbaikan modul.
        </div>
        <label style={{ ...st.label, marginBottom: 10 }}>Judul bab
          <input style={st.input} value={judul} onChange={(e) => setJudul(e.target.value)} placeholder="Teorema Pythagoras" />
        </label>
        <input ref={fileRef} type="file" accept=".html,.htm,text/html" style={{ display: 'none' }} onChange={(e) => bacaFile(e.target.files[0])} />
        <button style={st.btn2} onClick={() => fileRef.current && fileRef.current.click()}>📂 Pilih file .html</button>
        <textarea
          style={{ ...st.area, marginTop: 10 }}
          value={teks}
          onChange={(e) => setTeks(e.target.value)}
          placeholder="<!-- tempel seluruh kode HTML modul di sini -->"
        />
        {pesan && (
          <div style={{ fontSize: 11.5, marginTop: 8, color: pesan.startsWith('❌') ? '#dc2626' : '#16a34a', fontWeight: 700 }}>{pesan}</div>
        )}
        <div style={{ display: 'flex', gap: 8, marginTop: 12, justifyContent: 'flex-end' }}>
          <button style={st.btn2} onClick={tutup}>Batal</button>
          <button style={{ ...st.btn, opacity: busy ? 0.6 : 1 }} disabled={busy} onClick={simpan}>💾 Simpan & Terbitkan</button>
        </div>
      </div>
    </div>
  );
}