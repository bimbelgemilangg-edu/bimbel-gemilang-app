// src/pages/admin/materi/ManageMateriV2.jsx
// ============================================================
// FASE 4 -- MANAJER MATERI v2 (route /admin/materi-v2)
// CRUD materi: judul, mapel, kelas, jenjang, program bimbel,
// premium, warna, emoji, status. Kelola bab di halaman editor.
// Tema Gemilang Biru. Data: koleksi materi_v2 (Firestore).
// ============================================================
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus, Pencil, FolderOpen, Save, X, BookOpen,
} from 'lucide-react';
import {
  muatSemuaMateri, simpanMateri, simpanBab,
} from '../../../services/materiV2Service';
import {
  T, kartuDasar, halamanDasar, tombolPill,
} from '../../student/belajar/tema';

const KOSONG = {
  judul: '', mapel: '', kelas: '', jenjang: '', program: 'semua',
  premium: false, warna: '#1E9BF0', emoji: '📘', deskripsi: '',
  urutan: 1, status: 'draft',
};

export default function ManageMateriV2() {
  const navigate = useNavigate();
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(null);   // null = tertutup
  const [editId, setEditId] = useState(null);
  const [pesan, setPesan] = useState('');
  const [imporOpen, setImporOpen] = useState(false);
  const [imporText, setImporText] = useState('');

  const muat = async () => {
    setList(await muatSemuaMateri());
  };
  useEffect(() => {
    let hidup = true;
    (async () => {
      const l = await muatSemuaMateri();
      if (hidup) { setList(l); setLoading(false); }
    })();
    return () => { hidup = false; };
  }, []);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  /** Impor draft JSON {materi, bab[]} -- mis. hasil konversi buku/PDF. */
  const jalankanImpor = async () => {
    try {
      const data = JSON.parse(imporText);
      if (!data.materi?.judul) throw new Error('Field materi.judul wajib.');
      const id = await simpanMateri(null, data.materi);
      const babs = Array.isArray(data.bab) ? data.bab : [];
      for (let i = 0; i < babs.length; i++) {
        await simpanBab(id, null, { urutan: i + 1, ...babs[i] });
      }
      setPesan(`✅ Materi "${data.materi.judul}" + ${babs.length} bab masuk (status draft).`);
      setImporOpen(false);
      setImporText('');
      await muat();
    } catch (e) {
      setPesan(`Impor gagal: ${e.message}`);
    }
  };

  const simpan = async () => {
    if (!form.judul.trim()) { setPesan('Judul wajib diisi.'); return; }
    try {
      await simpanMateri(editId, form);
      setPesan('');
      setForm(null);
      setEditId(null);
      await muat();
    } catch (e) {
      setPesan(`Gagal simpan (cek rules Firestore): ${e.message}`);
    }
  };

  return (
    <div style={halamanDasar}>
      <div style={S.head}>
        <div>
          <h1 style={S.judul}>Manajer Materi v2</h1>
          <p style={S.sub}>
            Konten di sini langsung tampil di /siswa/belajar
            (tersaring jenjang & program) dan siap dipresentasikan.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button type="button" style={tombolPill('putih')}
            onClick={() => { setImporOpen((v) => !v); setForm(null); }}>
            📥 Impor JSON
          </button>
          <button type="button" style={tombolPill('primer')}
            onClick={() => { setForm({ ...KOSONG }); setEditId(null); }}>
            <Plus size={15} /> Materi Baru
          </button>
        </div>
      </div>

      <div style={S.isi}>
        {pesan && (
          <div style={pesan.startsWith('✅') ? S.ok : S.err}>{pesan}</div>
        )}

        {imporOpen && (
          <div style={{ ...kartuDasar, ...S.form }}>
            <div style={S.formHead}>
              <span style={{ fontWeight: 800, fontSize: 14, color: T.judul }}>
                Impor Draft Materi (JSON)
              </span>
              <button type="button" style={S.tutup}
                onClick={() => setImporOpen(false)}>✕</button>
            </div>
            <p style={{ fontSize: 12, color: T.samar, margin: '0 0 8px', lineHeight: 1.6 }}>
              Tempel JSON berformat {'{ "materi": {...}, "bab": [ ... ] }'} —
              misalnya draft konversi buku/PDF dari asisten AI.
              Materi masuk sebagai <b>draft</b>; terbitkan setelah diperiksa.
            </p>
            <textarea style={{ ...S.inp, fontFamily: 'monospace', fontSize: 11.5 }}
              rows={8} value={imporText}
              placeholder='{ "materi": { "judul": "..." }, "bab": [ ... ] }'
              onChange={(e) => setImporText(e.target.value)} />
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <label style={S.btnKecilLabel}>
                muat berkas .json
                <input type="file" accept=".json,application/json" style={{ display: 'none' }}
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (!f) return;
                    const r = new FileReader();
                    r.onload = () => setImporText(String(r.result));
                    r.readAsText(f);
                  }} />
              </label>
              <button type="button" style={tombolPill('primer')} onClick={jalankanImpor}>
                Impor Sekarang
              </button>
            </div>
          </div>
        )}

        {form && (
          <div style={{ ...kartuDasar, ...S.form }}>
            <div style={S.formHead}>
              <span style={{ fontWeight: 800, fontSize: 14, color: T.judul }}>
                {editId ? 'Edit Materi' : 'Materi Baru'}
              </span>
              <button type="button" style={S.tutup}
                onClick={() => { setForm(null); setEditId(null); }}>
                <X size={15} />
              </button>
            </div>
            <div style={S.grid2}>
              <label style={S.lab}>Judul *
                <input style={S.inp} value={form.judul}
                  onChange={(e) => set('judul', e.target.value)}
                  placeholder="mis. Aljabar Dasar" />
              </label>
              <label style={S.lab}>Mata pelajaran
                <input style={S.inp} value={form.mapel}
                  onChange={(e) => set('mapel', e.target.value)}
                  placeholder="Matematika" />
              </label>
              <label style={S.lab}>Kelas (angka)
                <input style={S.inp} value={form.kelas}
                  onChange={(e) => set('kelas', e.target.value)}
                  placeholder="7" />
              </label>
              <label style={S.lab}>Jenjang
                <select style={S.inp} value={form.jenjang}
                  onChange={(e) => set('jenjang', e.target.value)}>
                  <option value="">(semua jenjang)</option>
                  <option value="sd">SD</option>
                  <option value="smp">SMP</option>
                  <option value="sma">SMA / SMK</option>
                </select>
              </label>
              <label style={S.lab}>Program bimbel
                <input style={S.inp} value={form.program}
                  onChange={(e) => set('program', e.target.value)}
                  placeholder="semua / Reguler / Intensif..." />
              </label>
              <label style={S.lab}>Urutan
                <input style={S.inp} type="number" value={form.urutan}
                  onChange={(e) => set('urutan', Number(e.target.value))} />
              </label>
              <label style={S.lab}>Warna kartu
                <input style={S.inpWarna} type="color" value={form.warna}
                  onChange={(e) => set('warna', e.target.value)} />
              </label>
              <label style={S.lab}>Emoji
                <input style={S.inp} value={form.emoji}
                  onChange={(e) => set('emoji', e.target.value)} />
              </label>
              <label style={S.lab}>Status
                <select style={S.inp} value={form.status}
                  onChange={(e) => set('status', e.target.value)}>
                  <option value="draft">Draft (tersembunyi)</option>
                  <option value="aktif">Aktif (terbit)</option>
                  <option value="arsip">Arsip</option>
                </select>
              </label>
              <label style={{ ...S.lab, ...S.labCheck }}>
                <input type="checkbox" checked={!!form.premium}
                  onChange={(e) => set('premium', e.target.checked)} />
                🔒 Fitur premium (hanya siswa ber-akses)
              </label>
            </div>
            <label style={S.lab}>Deskripsi
              <textarea style={S.inp} rows={2} value={form.deskripsi}
                onChange={(e) => set('deskripsi', e.target.value)} />
            </label>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button type="button" style={tombolPill('putih')}
                onClick={() => { setForm(null); setEditId(null); }}>
                Batal
              </button>
              <button type="button" style={tombolPill('primer')} onClick={simpan}>
                <Save size={14} /> Simpan Materi
              </button>
            </div>
          </div>
        )}

        {loading ? (
          <div style={S.kosong}>Memuat...</div>
        ) : list.length === 0 ? (
          <div style={S.kosong}>
            Belum ada materi v2. Klik “Materi Baru” untuk mulai —
            atau biarkan kosong supaya siswa melihat Mode Contoh.
          </div>
        ) : (
          <div style={S.grid}>
            {list.map((m) => (
              <div key={m.id} style={{ ...S.kartu, borderLeft: `5px solid ${m.warna || T.biru}` }}>
                <div style={S.kartuTop}>
                  <span style={S.cover}>{m.emoji || '📘'}</span>
                  <span style={S.badgeStatus(m.status)}>{m.status}</span>
                </div>
                <div style={S.kartuJudul}>{m.judul}</div>
                <div style={S.kartuMeta}>
                  <BookOpen size={12} />
                  {m.mapel || '-'} • Kelas {m.kelas || '-'} •
                  {' '}{m.jenjang || 'semua jenjang'} •
                  {' '}{m.program || 'semua program'}
                  {m.premium ? ' • 🔒' : ''}
                </div>
                <div style={S.kartuBtns}>
                  <button type="button" style={S.btnKecil}
                    onClick={() => { setForm({ ...KOSONG, ...m }); setEditId(m.id); }}>
                    <Pencil size={12} /> Edit
                  </button>
                  <button type="button" style={{ ...S.btnKecil, ...S.btnKecilPrimer }}
                    onClick={() => navigate(`/admin/materi-v2/${m.id}`)}>
                    <FolderOpen size={12} /> Kelola Bab & File
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

const S = {
  head: {
    display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap',
    justifyContent: 'space-between', padding: '18px 20px',
    background: T.gradasiHero,
  },
  judul: { margin: 0, color: '#fff', fontSize: 20, fontWeight: 800 },
  sub: { margin: '3px 0 0', color: 'rgba(255,255,255,.8)', fontSize: 12 },
  isi: { padding: '16px 18px 40px', maxWidth: 1050, margin: '0 auto' },
  err: {
    background: T.merahLatar, border: `1px solid ${T.merahGaris}`,
    color: '#B91C1C', borderRadius: 10, padding: '9px 13px',
    fontSize: 12.5, marginBottom: 12,
  },
  ok: {
    background: T.hijauLatar, border: `1px solid ${T.hijauGaris}`,
    color: T.hijauTeks, borderRadius: 10, padding: '9px 13px',
    fontSize: 12.5, marginBottom: 12,
  },
  btnKecilLabel: {
    display: 'inline-flex', gap: 5, alignItems: 'center',
    background: '#fff', border: `1px solid ${T.garis}`, color: T.teks,
    borderRadius: 9, padding: '7px 12px', fontSize: 11.5, fontWeight: 700,
    cursor: 'pointer',
  },
  form: { padding: 16, marginBottom: 16 },
  formHead: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: 12,
  },
  tutup: {
    background: T.latar, border: `1px solid ${T.garis}`, borderRadius: 8,
    color: T.samar, width: 28, height: 28, display: 'flex',
    alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
  },
  grid2: {
    display: 'grid', gap: 10,
    gridTemplateColumns: 'repeat(auto-fill,minmax(210px,1fr))', marginBottom: 10,
  },
  lab: {
    display: 'flex', flexDirection: 'column', gap: 4,
    fontSize: 11, fontWeight: 800, color: T.samar,
  },
  labCheck: {
    flexDirection: 'row', alignItems: 'center', gap: 7,
    color: T.teks, fontSize: 12, justifyContent: 'flex-start',
  },
  inp: {
    border: `1px solid ${T.garis}`, borderRadius: 10, padding: '9px 11px',
    fontSize: 13, color: T.teks, background: '#fff',
    fontFamily: 'inherit', outline: 'none', width: '100%',
  },
  inpWarna: {
    border: `1px solid ${T.garis}`, borderRadius: 10, padding: 4,
    background: '#fff', height: 38, width: '100%',
  },
  kosong: {
    textAlign: 'center', color: T.samar, ...kartuDasar,
    padding: '34px 20px', fontSize: 13, lineHeight: 1.7,
  },
  grid: { display: 'grid', gap: 13, gridTemplateColumns: 'repeat(auto-fill,minmax(260px,1fr))' },
  kartu: { ...kartuDasar, padding: 14, display: 'flex', flexDirection: 'column', gap: 8 },
  kartuTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  cover: {
    width: 42, height: 42, borderRadius: 12, background: T.kotakBiru,
    border: `1px solid ${T.kotakBiruGaris}`, fontSize: 20,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  badgeStatus: (st) => ({
    background: st === 'aktif' ? T.hijauLatar : st === 'draft' ? T.latar : T.amberLatar,
    color: st === 'aktif' ? T.hijauTeks : st === 'draft' ? T.samar : T.amberTeks,
    border: `1px solid ${st === 'aktif' ? T.hijauGaris : st === 'draft' ? T.garis : T.amberGaris}`,
    borderRadius: 999, padding: '3px 10px', fontSize: 10, fontWeight: 800,
  }),
  kartuJudul: { fontWeight: 800, fontSize: 14, color: T.judul },
  kartuMeta: {
    display: 'flex', alignItems: 'center', gap: 4, flexWrap: 'wrap',
    fontSize: 10.5, color: T.samar,
  },
  kartuBtns: { display: 'flex', gap: 7, marginTop: 4 },
  btnKecil: {
    display: 'inline-flex', gap: 5, alignItems: 'center',
    background: '#fff', border: `1px solid ${T.garis}`, color: T.teks,
    borderRadius: 9, padding: '6px 11px', fontSize: 11, fontWeight: 700,
    cursor: 'pointer', fontFamily: 'inherit',
  },
  btnKecilPrimer: {
    background: T.biru, borderColor: T.biru, color: '#fff',
    boxShadow: '0 4px 12px rgba(30,155,240,.3)',
  },
};
