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
  Plus, Pencil, FolderOpen, Save, X, BookOpen, Trash2,
} from 'lucide-react';
import {
  KOL_MATERI,
  muatSemuaMateri, simpanMateri, simpanBab, hapusMateri,
  segarkanHitunganMateri,
} from '../../../services/materiV2Service';
import {
  T, kartuDasar, halamanDasar, tombolPill,
} from '../../student/belajar/tema';

const KOSONG = {
  judul: '', mapel: '', kelas: '', jenjang: '', program: 'semua',
  premium: false, warna: '#1E9BF0', emoji: '📘', deskripsi: '',
  urutan: 1, status: 'draft', daftarPustaka: [],
};

// DAFTAR PUSTAKA (Turn 33, arahan owner): sumber buku/modul/situs yang
// dipakai tim kurikulum disimpan di dokumen materi untuk keperluan
// hak cipta & audit -- HANYA tampil di halaman admin ini, TIDAK pernah
// dirender di halaman siswa/guru.
const pustakaKeTeks = (arr) => (Array.isArray(arr) ? arr : []).join('\n');
const teksKePustaka = (t) => String(t || '').split('\n')
  .map((x) => x.trim()).filter(Boolean);

export default function ManageMateriV2() {
  const navigate = useNavigate();
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(null);   // null = tertutup
  const [editId, setEditId] = useState(null);
  const [pesan, setPesan] = useState('');
  const [imporOpen, setImporOpen] = useState(false);
  const [imporText, setImporText] = useState('');
  // Mode impor (Turn 29): 'baru' = materi baru; 'tambah' = bab ditempel
  // ke materi yang sudah ada (konten dibangun bertahap per bab).
  const [imporMode, setImporMode] = useState('baru');
  const [imporTarget, setImporTarget] = useState('');
  // Statistik isi per materi (bab & soal) -- supaya "cangkang kosong"
  // (materi aktif tanpa bab) langsung kelihatan, kasus Turn 25.
  const [stat, setStat] = useState({});

  const muatStat = async (daftar) => {
    const peta = {};
    for (const m of daftar) {
      // HEMAT KUOTA (Turn 27): bila dokumen sudah menyimpan hitungan
      // denormalisasi, pakai itu (0 read tambahan). Hanya dokumen lama
      // yang belum punya field yang di-backfill (baca + tulis sekali).
      if (Number.isFinite(m.jumlahBab)) {
        peta[m.id] = { bab: m.jumlahBab, soal: m.jumlahSoal || 0 };
        continue;
      }
      // ANTI-ZOMBIE (Turn 51): dokumen TANPA judul = cangkang sisa bug
      // lama -- jangan pernah disentuh backfill (dulu inilah yang
      // menghidupkan ulang materi yang sudah dihapus).
      if (!m.judul) {
        peta[m.id] = { bab: 0, soal: 0 };
        continue;
      }
      try {
        peta[m.id] = await segarkanHitunganMateri(m.id);
      } catch {
        // gagal baca -> tampilkan '…' (null), JANGAN 0 yang menyesatkan
        peta[m.id] = { bab: null, soal: null };
      }
    }
    setStat(peta);
  };

  const muat = async () => {
    const l = await muatSemuaMateri({ dariServer: true });
    setList(l);
    muatStat(l);
  };
  useEffect(() => {
    let hidup = true;
    (async () => {
      const l = await muatSemuaMateri({ dariServer: true });
      if (!hidup) return;
      setList(l);
      setLoading(false);
      muatStat(l);
    })();
    return () => { hidup = false; };
  }, []);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const hapus = async (id) => {
    if (!window.confirm(
      'Hapus materi ini beserta SEMUA babnya? Tindakan permanen.'
    )) return;
    try {
      await hapusMateri(id);
      setPesan('✅ Materi dihapus — terverifikasi hilang di server.');
      await muat();
    } catch (e) {
      setPesan(`Gagal hapus: ${e.message}`);
      await muat();
    }
  };

  // SAPU BERSIH (Turn 51): dokumen "zombie" = cangkang tanpa judul sisa
  // bug backfill lama (setDoc merge menghidupkan ulang materi terhapus).
  // Satu tombol menghapus semuanya permanen.
  const daftarSisa = list.filter((m) => !m.judul);
  const bersihkanSisa = async () => {
    if (!window.confirm(
      `Hapus ${daftarSisa.length} dokumen sisa tanpa judul? Tindakan permanen.`
    )) return;
    let gagal = 0;
    for (const m of daftarSisa) {
      try {
        await hapusMateri(m.id);
      } catch {
        gagal += 1;
      }
    }
    setPesan(gagal === 0
      ? `✅ ${daftarSisa.length} dokumen sisa dibersihkan.`
      : `⚠️ ${gagal} dokumen sisa GAGAL dihapus — coba lagi atau lewat Firebase Console.`);
    await muat();
  };

  /** Impor draft JSON {materi, bab[]} -- mis. hasil konversi buku/PDF. */
  const jalankanImpor = async () => {
    try {
      const data = JSON.parse(imporText);
      if (!data.materi?.judul) throw new Error('Field materi.judul wajib.');
      const babs = Array.isArray(data.bab) ? data.bab : [];
      if (imporMode === 'tambah') {
        const target = list.find((x) => x.id === imporTarget);
        if (!target) throw new Error('Pilih dulu materi tujuan penambahan bab.');
        const offset = stat[imporTarget]?.bab || 0;
        for (let i = 0; i < babs.length; i++) {
          await simpanBab(imporTarget, null, { urutan: offset + i + 1, ...babs[i] });
        }
        await segarkanHitunganMateri(imporTarget).catch(() => {});
        setPesan(`✅ ${babs.length} bab ditambahkan ke materi "${target.judul}".`);
        setImporOpen(false);
        setImporText('');
        await muat();
        return;
      }
      // Impor = SALINAN baru. Peringatkan bila judul sama sudah ada
      // (mencegah kejadian "ter-copy" membingungkan, Turn 25).
      const judulImpor = String(data.materi.judul).trim().toLowerCase();
      const sama = list.find((x) =>
        String(x.judul).trim().toLowerCase() === judulImpor);
      if (sama && !window.confirm(
        `Sudah ada materi berjudul sama:\n"${sama.judul}"\n`
        + `status: ${sama.status} • isi: ${(stat[sama.id] || {}).bab ?? '?'} bab\n\n`
        + 'Impor JSON selalu membuat SALINAN baru (tidak menimpa yang lama).\n'
        + 'Lanjutkan impor?'
      )) return;
      const id = await simpanMateri(null, data.materi);
      for (let i = 0; i < babs.length; i++) {
        await simpanBab(id, null, { urutan: i + 1, ...babs[i] });
      }
      await segarkanHitunganMateri(id).catch(() => {});
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
          {daftarSisa.length > 0 && (
            <button type="button"
              style={{ ...tombolPill('putih'), color: '#B91C1C', fontWeight: 800 }}
              onClick={bersihkanSisa}>
              🧹 Bersihkan {daftarSisa.length} dokumen sisa
            </button>
          )}
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
              <br />
              ⚠️ Lebih aman pakai tombol <b>muat berkas .json</b>:
              copy-paste teks panjang sering terpotong dan menyebabkan
              error “Unexpected end of JSON input”.
            </p>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center', margin: '0 0 8px' }}>
              <label style={{ fontSize: 12, fontWeight: 700, color: T.teks, display: 'inline-flex', gap: 6, alignItems: 'center' }}>
                <input type="radio" name="impormode" checked={imporMode === 'baru'}
                  onChange={() => setImporMode('baru')} />
                Materi baru
              </label>
              <label style={{ fontSize: 12, fontWeight: 700, color: T.teks, display: 'inline-flex', gap: 6, alignItems: 'center' }}>
                <input type="radio" name="impormode" checked={imporMode === 'tambah'}
                  onChange={() => setImporMode('tambah')} />
                Tambah bab ke materi existing
              </label>
              {imporMode === 'tambah' && (
                <select style={{ ...S.inp, width: 280 }} value={imporTarget}
                  onChange={(e) => setImporTarget(e.target.value)}>
                  <option value="">— pilih materi tujuan —</option>
                  {list.filter((m) => m.judul).map((m) => (
                    <option key={m.id} value={m.id}>{m.judul}</option>
                  ))}
                </select>
              )}
            </div>
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
            <label style={S.lab}>
              Daftar pustaka & sumber — RAHASIA ADMIN (tidak tampil ke
              siswa/guru; satu sumber per baris: Judul — Penulis/Penerbit —
              Tahun — ISBN/URL — catatan hak cipta)
              <textarea style={{ ...S.inp, fontFamily: 'monospace', fontSize: 11.5 }}
                rows={4} value={pustakaKeTeks(form.daftarPustaka)}
                placeholder={'BSE Biologi SMA/MA Kelas XII — Kemendikdasmen — 2022 — ISBN 978-602-427-958-5 — PDF resmi gratis; gambar dikutip berkredit per halaman'}
                onChange={(e) => set('daftarPustaka', teksKePustaka(e.target.value))} />
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
                <div style={S.kartuJudul}>
                  {m.judul || (
                    <span style={{ color: '#B91C1C' }}>
                      🧟 Sisa dokumen tanpa judul
                    </span>
                  )}
                </div>
                <div style={S.kartuMeta}>
                  <BookOpen size={12} />
                  {m.mapel || '-'} • Kelas {m.kelas || '-'} •
                  {' '}{m.jenjang || 'semua jenjang'} •
                  {' '}{m.program || 'semua program'}
                  {m.premium ? ' • 🔒' : ''}
                </div>
                <div style={S.kartuStat}>
                  📚 {(stat[m.id] || {}).bab ?? '…'} bab •
                  {' '}{(stat[m.id] || {}).soal ?? '…'} soal
                </div>
                {m.status === 'aktif' && (stat[m.id] || {}).bab === 0 && (
                  <div style={S.warnChip}>
                    ⚠️ AKTIF TAPI TANPA BAB — siswa melihat halaman kosong.
                    Isi babnya atau hapus materi ini.
                  </div>
                )}
                {!m.judul && (
                  <div style={{
                    ...S.warnChip, color: '#B91C1C',
                    background: T.merahLatar, border: `1px solid ${T.merahGaris}`,
                  }}>
                    🧟 Cangkang kosong sisa bug lama (id {m.id}) —
                    {' '}AMAN DIHAPUS; versi baru tidak bisa membuatnya lagi.
                  </div>
                )}
                <div style={S.kartuBtns}>
                  <button type="button" style={S.btnKecil}
                    onClick={() => { setForm({ ...KOSONG, ...m }); setEditId(m.id); }}>
                    <Pencil size={12} /> Edit
                  </button>
                  <button type="button"
                    style={{ ...S.btnKecil, color: '#B91C1C', borderColor: T.merahGaris }}
                    onClick={() => hapus(m.id)}>
                    <Trash2 size={12} /> Hapus
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
  kartuStat: {
    fontSize: 11.5, fontWeight: 800, color: T.biruDalam,
    background: T.kotakBiru, border: `1px solid ${T.kotakBiruGaris}`,
    borderRadius: 999, padding: '4px 10px',
    display: 'inline-block', margin: '6px 0 0',
  },
  warnChip: {
    marginTop: 8, fontSize: 11, fontWeight: 800, color: '#92400E',
    background: '#FEF3C7', border: '1px solid #FDE68A',
    borderRadius: 10, padding: '7px 10px', lineHeight: 1.5,
  },
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
