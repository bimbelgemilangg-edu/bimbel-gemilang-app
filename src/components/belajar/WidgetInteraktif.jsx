// src/components/belajar/WidgetInteraktif.jsx
// ============================================================
// WIDGET MATERI INTERAKTIF v1 (Turn 87 — arahan owner:
// "menambahkan materi interaktif di materi digital")
//
// Kumpulan komponen interaktif yang bisa DISISIPKAN di tengah
// materi via impor JSON (main-compatible, tanpa deploy ulang
// untuk konten baru). Dipakai oleh:
//   1. Renderer Materi v3  -> src/components/belajar/IsiSections.jsx
//      (jenis section = nama widget, mis. {jenis:'flashcard',...})
//   2. Buku Digital bab terstruktur -> BukuBacaPage.renderBlok
//      (blok.tipe = nama widget ATAU blok.tipe='interaktif'+blok.widget)
//   3. Panggung presentasi guru (lewat IsiSections, otomatis)
//
// Jenis widget yang didukung:
//   - jodohMini    : menjodohkan pasangan (dropdown per premis + Cek)
//   - isianRumpang : isian singkat / fill-in-the-blank (+ hint, varian kunci)
//   - flashcard    : kartu bolak-balik (tap untuk flip, geser antar kartu)
//   - urutan       : susun urutan langkah (naik/turunkan + Cek urutan)
//   - benarSalah   : pernyataan benar/salah per baris + Cek semua
//   - video        : embed YouTube / mp4 (kartu video + caption)
//
// Prinsip: koreksi instan LOKAL (sama seperti Zona Berlatih),
// tidak menulis ke Firestore — aman dipakai di reader mana pun.
// Teks mendukung LaTeX $...$ lewat MathText.
// ============================================================
import React from 'react';
import {
  Link2, PenLine, Layers, ListOrdered, Scale, Play, Shuffle,
  RotateCcw, ChevronLeft, ChevronRight, ArrowUp, ArrowDown,
  CheckCircle2, XCircle, Lightbulb, Trophy,
} from 'lucide-react';
import { MathText } from '../MathText';
import { T } from '../../pages/student/belajar/tema';

// Daftar jenis yang dikenali (dipakai renderer + validator admin).
export const JENIS_INTERAKTIF = new Set([
  'jodohMini', 'isianRumpang', 'flashcard', 'urutan', 'benarSalah', 'video',
]);

// ---------------- util bersama ----------------

// RNG deterministik sederhana (xorshift) -> acak STABIL per mount,
// tidak berubah tiap render (penting: opsi tidak "loncat" saat Cek).
function pengacak(seedStr) {
  let s = 0;
  const str = String(seedStr || 'gemilang');
  for (let i = 0; i < str.length; i++) s = (s * 31 + str.charCodeAt(i)) >>> 0;
  if (!s) s = 12345;
  return () => {
    s ^= s << 13; s >>>= 0;
    s ^= s >> 17;
    s ^= s << 5; s >>>= 0;
    return s / 4294967296;
  };
}

function acakArray(arr, seed) {
  const rand = pengacak(seed);
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

// Normalisasi teks jawaban siswa vs kunci: huruf kecil, spasi rapat,
// tanpa titik/koma di ujung, tanpa tanda baca ringan di sekitar.
function samakanJawaban(a, b) {
  const norm = (x) => String(x ?? '')
    .toLowerCase().trim()
    .replace(/\s+/g, ' ')
    .replace(/[.,;:!?]+$/g, '')
    .replace(/^["'`([]+|["'`)\]]+$/g, '');
  return norm(a) === norm(b);
}

function keBoolean(v) {
  if (typeof v === 'boolean') return v;
  const s = String(v ?? '').toLowerCase().trim();
  return ['true', 'benar', 'b', 'ya', 'y', '1'].includes(s);
}

// Ambil field pertama yang tersedia (toleran variasi keluaran AI konten).
function pilih(obj, keys, fallback = '') {
  for (const k of keys) {
    if (obj && obj[k] !== undefined && obj[k] !== null && obj[k] !== '') return obj[k];
  }
  return fallback;
}

// ---------------- gaya (nada ungu "interaktif", senada Zona Berlatih) ----------------
const S = {
  box: {
    background: 'linear-gradient(160deg,#FAF8FF 0%,#F3EEFF 100%)',
    border: '2px solid #8B5CF6', borderRadius: 18,
    padding: '14px 14px 16px', margin: '0 0 16px',
    boxShadow: '0 8px 22px rgba(124,58,237,.10)',
  },
  kepala: {
    display: 'flex', alignItems: 'center', gap: 8,
    fontWeight: 900, color: '#5B21B6', fontSize: 14, marginBottom: 4,
  },
  chipInteraktif: {
    marginLeft: 'auto', flexShrink: 0,
    background: '#7C3AED', color: '#fff', borderRadius: 999,
    padding: '2px 9px', fontSize: 10, fontWeight: 900, letterSpacing: 0.4,
  },
  ket: { fontSize: 12, color: '#64748B', marginBottom: 10, lineHeight: 1.6 },
  soal: {
    background: '#fff', border: '1px solid #DDD6FE', borderRadius: 14,
    padding: '10px 12px', marginBottom: 10,
  },
  teksSoal: { fontSize: 13.5, fontWeight: 700, color: '#0F172A', marginBottom: 8, lineHeight: 1.65 },
  tombol: {
    borderRadius: 12, padding: '9px 16px', border: 'none',
    background: '#7C3AED', color: '#fff', fontWeight: 900, fontSize: 12.5,
    cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6,
  },
  tombolKecil: {
    borderRadius: 10, padding: '6px 12px', border: '1.5px solid #DDD6FE',
    background: '#fff', color: '#6D28D9', fontWeight: 800, fontSize: 11.5,
    cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 5,
  },
  hasil: { marginTop: 6, fontSize: 12.5, lineHeight: 1.65 },
  skor: {
    display: 'flex', alignItems: 'center', gap: 8, marginTop: 10,
    background: '#fff', border: '1.5px solid #DDD6FE', borderRadius: 12,
    padding: '9px 12px', fontSize: 13, fontWeight: 900, color: '#5B21B6',
  },
  select: {
    width: '100%', borderRadius: 12, padding: '9px 10px', fontSize: 13,
    border: '1px solid #E2E8F0', background: '#fff', color: '#0F172A',
    cursor: 'pointer',
  },
  input: {
    width: '100%', boxSizing: 'border-box', borderRadius: 12,
    padding: '9px 11px', fontSize: 13.5, border: '1.5px solid #E2E8F0',
    background: '#fff', color: '#0F172A', outline: 'none',
  },
};

const borderHasil = (benar, dipilih) => {
  if (benar === null) return { border: '1px solid #E2E8F0', background: '#fff' };
  if (benar) return { border: '2px solid #16A34A', background: '#ECFDF5' };
  if (dipilih) return { border: '2px solid #DC2626', background: '#FEF2F2' };
  return { border: '1px solid #E2E8F0', background: '#fff' };
};

function KepalaWidget({ ikon, judul, labelChip = 'Interaktif' }) {
  // Catatan: rename destructure ({ikon: Ikon}) + JSX dipakai langsung
  // memicu false-positive no-unused-vars di ESLint 9 — lewat konstanta lokal.
  const Ikon = ikon;
  return (
    <div style={S.kepala}>
      <Ikon size={16} />
      <span>{judul}</span>
      <span style={S.chipInteraktif}>{labelChip}</span>
    </div>
  );
}

function BarisSkor({ benar, total, onUlangi }) {
  const persen = total ? Math.round((benar / total) * 100) : 0;
  return (
    <div style={{ ...S.skor, borderColor: persen === 100 ? '#86EFAC' : '#DDD6FE' }}>
      <Trophy size={16} color={persen === 100 ? '#16A34A' : '#7C3AED'} />
      <span>
        Skor: {benar}/{total} ({persen}%)
        {persen === 100 ? ' — Sempurna! 🎉' : persen >= 60 ? ' — Bagus, coba lagi yang meleset!' : ' — Pelan-pelan, ulangi ya!'}
      </span>
      {onUlangi ? (
        <button type="button" style={{ ...S.tombolKecil, marginLeft: 'auto' }} onClick={onUlangi}>
          <RotateCcw size={13} /> Ulangi
        </button>
      ) : null}
    </div>
  );
}

// ============================================================
// 1) JODOH MINI — menjodohkan pasangan di dalam materi
//    {jenis:'jodohMini', judul?, keterangan?,
//     items:[{kiri, kanan, penjelasan?}]}
// ============================================================
export function JodohMini({ widget }) {
  const items = React.useMemo(() => (widget.items || []).map((it) => {
    if (Array.isArray(it)) return { kiri: it[0], kanan: it[1], penjelasan: it[2] || '' };
    return {
      kiri: pilih(it, ['kiri', 'a', 'premis', 'soal']),
      kanan: pilih(it, ['kanan', 'b', 'pasangan', 'jawaban']),
      penjelasan: pilih(it, ['penjelasan', 'pembahasan']),
    };
  }).filter((it) => it.kiri && it.kanan), [widget.items]);

  // Kolam pilihan kanan: diacak STABIL + diberi huruf A, B, C...
  const seed = React.useMemo(() => items.map((it) => it.kanan).join('|'), [items]);
  const kolam = React.useMemo(
    () => acakArray(items.map((it, i) => ({ idxAsli: i, teks: it.kanan })), seed + '-kolam'),
    [items, seed],
  );

  const [pil, setPil] = React.useState({});   // premisIdx -> kolomIdx (indeks di `kolom`)
  const [cek, setCek] = React.useState(false);

  const semuaTerisi = items.length > 0 && items.every((_, i) => pil[i] != null);
  const benarCount = items.reduce((n, it, i) => (
    n + (pil[i] != null && kolam[pil[i]]?.idxAsli === i ? 1 : 0)
  ), 0);

  const ulang = () => { setPil({}); setCek(false); };

  if (!items.length) return null;
  return (
    <div style={S.box}>
      <KepalaWidget ikon={Link2} judul={widget.judul || '🔗 Jodohkan Pasangan'} />
      <div style={S.ket}>
        {widget.keterangan || 'Pilih pasangan yang tepat untuk setiap pernyataan, lalu tekan Cek.'}
      </div>

      {items.map((it, i) => {
        const terpilih = pil[i];
        const pasanganBenar = cek && terpilih != null && kolam[terpilih]?.idxAsli === i;
        const pasanganSalah = cek && terpilih != null && !pasanganBenar;
        return (
          <div key={i} style={{ ...S.soal, ...(cek ? borderHasil(pasanganBenar, pasanganSalah) : {}) }}>
            <div style={S.teksSoal}>
              {i + 1}. <MathText text={it.kiri} />
              {cek ? (pasanganBenar
                ? <CheckCircle2 size={15} color="#16A34A" style={{ verticalAlign: -3, marginLeft: 6 }} />
                : <XCircle size={15} color="#DC2626" style={{ verticalAlign: -3, marginLeft: 6 }} />) : null}
            </div>
            <select
              style={{ ...S.select, ...(cek ? borderHasil(pasanganBenar, pasanganSalah) : {}) }}
              value={terpilih ?? ''}
              disabled={cek}
              onChange={(e) => setPil((o) => ({ ...o, [i]: e.target.value === '' ? undefined : Number(e.target.value) }))}
            >
              <option value="" disabled>Pilih pasangan…</option>
              {kolam.map((k, ki) => (
                <option key={ki} value={ki}>
                  {String.fromCharCode(65 + ki)}. {String(k.teks)}
                </option>
              ))}
            </select>
            {cek && pasanganSalah ? (
              <div style={{ ...S.hasil, color: '#15803D' }}>
                ✅ Pasangan tepat: <b>{String(it.kanan)}</b>
                {it.penjelasan ? ` — ${it.penjelasan}` : ''}
              </div>
            ) : null}
            {cek && pasanganBenar && it.penjelasan ? (
              <div style={{ ...S.hasil, color: '#15803D' }}>{it.penjelasan}</div>
            ) : null}
          </div>
        );
      })}

      {!cek ? (
        <button type="button" style={{ ...S.tombol, opacity: semuaTerisi ? 1 : 0.5 }}
          disabled={!semuaTerisi} onClick={() => setCek(true)}>
          ✔ Cek pasangan
        </button>
      ) : (
        <BarisSkor benar={benarCount} total={items.length} onUlangi={ulang} />
      )}
    </div>
  );
}

// ============================================================
// 2) ISIAN RUMPANG — isian singkat dalam materi
//    {jenis:'isianRumpang', judul?, keterangan?,
//     items:[{teks, jawaban:string|[varian], hint?, penjelasan?}]}
// ============================================================
export function IsianRumpang({ widget }) {
  const items = React.useMemo(() => (widget.items || []).map((it) => {
    if (typeof it === 'string') return { teks: it, jawaban: [], hint: '', penjelasan: '' };
    const jw = pilih(it, ['jawaban', 'kunci', 'answer'], '');
    return {
      teks: pilih(it, ['teks', 'soal', 'pertanyaan']),
      jawaban: Array.isArray(jw) ? jw.map(String) : String(jw).split('|').map((s) => s.trim()).filter(Boolean),
      hint: pilih(it, ['hint', 'petunjuk']),
      penjelasan: pilih(it, ['penjelasan', 'pembahasan']),
    };
  }).filter((it) => it.teks && it.jawaban.length), [widget.items]);

  const [nilai, setNilai] = React.useState({});
  const [cek, setCek] = React.useState(false);
  const [hintBuka, setHintBuka] = React.useState({});

  const semuaTerisi = items.length > 0 && items.every((_, i) => String(nilai[i] ?? '').trim() !== '');
  const hasilPer = items.map((it, i) => it.jawaban.some((jw) => samakanJawaban(nilai[i], jw)));
  const benarCount = cek ? hasilPer.filter(Boolean).length : 0;

  const ulang = () => { setNilai({}); setCek(false); setHintBuka({}); };

  if (!items.length) return null;
  return (
    <div style={S.box}>
      <KepalaWidget ikon={PenLine} judul={widget.judul || '✍️ Isian Rumpang'} labelChip="Ketik jawaban" />
      <div style={S.ket}>
        {widget.keterangan || 'Lengkapi setiap rumpang dengan jawaban tepat, lalu tekan Cek.'}
      </div>

      {items.map((it, i) => {
        const benar = cek ? hasilPer[i] : null;
        return (
          <div key={i} style={{ ...S.soal, ...(cek ? borderHasil(benar, !benar) : {}) }}>
            <div style={S.teksSoal}>{i + 1}. <MathText text={it.teks} /></div>
            <input
              style={{ ...S.input, ...(cek ? borderHasil(benar, !benar) : {}) }}
              value={nilai[i] ?? ''}
              disabled={cek}
              placeholder="Ketik jawabanmu…"
              onChange={(e) => setNilai((o) => ({ ...o, [i]: e.target.value }))}
              onKeyDown={(e) => { if (e.key === 'Enter' && semuaTerisi && !cek) setCek(true); }}
            />
            {it.hint && !cek ? (
              <button type="button" style={{ ...S.tombolKecil, marginTop: 7 }}
                onClick={() => setHintBuka((o) => ({ ...o, [i]: !o[i] }))}>
                <Lightbulb size={13} /> {hintBuka[i] ? 'Sembunyikan petunjuk' : 'Petunjuk'}
              </button>
            ) : null}
            {it.hint && hintBuka[i] && !cek ? (
              <div style={{ ...S.hasil, color: '#8A6D1A' }}>💡 {it.hint}</div>
            ) : null}
            {cek ? (
              <div style={{ ...S.hasil, color: benar ? '#15803D' : '#B91C1C' }}>
                {benar ? '✅ Benar! ' : `❌ Belum tepat. Jawaban: ${it.jawaban[0]}${it.jawaban.length > 1 ? ` (varian lain: ${it.jawaban.slice(1).join(', ')})` : ''}. `}
                {it.penjelasan || ''}
              </div>
            ) : null}
          </div>
        );
      })}

      {!cek ? (
        <button type="button" style={{ ...S.tombol, opacity: semuaTerisi ? 1 : 0.5 }}
          disabled={!semuaTerisi} onClick={() => setCek(true)}>
          ✔ Cek semua
        </button>
      ) : (
        <BarisSkor benar={benarCount} total={items.length} onUlangi={ulang} />
      )}
    </div>
  );
}

// ============================================================
// 3) FLASHCARD — kartu bolak-balik
//    {jenis:'flashcard', judul?, items:[{depan, belakang}]}
// ============================================================
export function FlashcardDeck({ widget }) {
  const kartu = React.useMemo(() => (widget.items || []).map((it) => {
    if (Array.isArray(it)) return { depan: it[0], belakang: it[1] };
    return {
      depan: pilih(it, ['depan', 'front', 'k', 'istilah', 'soal']),
      belakang: pilih(it, ['belakang', 'back', 'v', 'arti', 'jawaban']),
    };
  }).filter((it) => it.depan && it.belakang), [widget.items]);

  const [urut, setUrut] = React.useState(() => kartu.map((_, i) => i));
  const [pos, setPos] = React.useState(0);
  const [flip, setFlip] = React.useState(false);
  const [tandai, setTandai] = React.useState({}); // pos -> 'hafal'|'ulang'

  if (!kartu.length) return null;
  const idx = urut[Math.min(pos, urut.length - 1)] ?? 0;
  const k = kartu[idx];
  const sudahDitandai = Object.keys(tandai).length;

  const ganti = (next) => { setPos(next); setFlip(false); };
  const acak = () => {
    setUrut(acakArray(kartu.map((_, i) => i), String(Date.now())));
    setPos(0); setFlip(false);
  };

  const muka = (isi, gayaLuar, label) => (
    <div style={{
      position: 'absolute', inset: 0, backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden',
      borderRadius: 16, display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', textAlign: 'center',
      padding: '18px 16px', boxSizing: 'border-box', overflowY: 'auto', ...gayaLuar,
    }}>
      <div style={{ fontSize: 10, fontWeight: 900, letterSpacing: 1, opacity: 0.65, marginBottom: 8 }}>{label}</div>
      <div style={{ fontSize: 15.5, fontWeight: 800, lineHeight: 1.6 }}><MathText text={isi} /></div>
    </div>
  );

  return (
    <div style={S.box}>
      <KepalaWidget ikon={Layers} judul={widget.judul || '🃏 Flashcard'} labelChip="Ketuk = balik" />
      <div style={S.ket}>
        {widget.keterangan || 'Ketuk kartu untuk membalik. Geser tombol untuk pindah kartu.'}
      </div>

      {/* kartu 3D flip */}
      <div style={{ perspective: 1200, marginBottom: 10 }}
        onClick={() => setFlip((f) => !f)} role="button" tabIndex={0}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setFlip((f) => !f); } }}>
        <div style={{
          position: 'relative', minHeight: 170, transformStyle: 'preserve-3d',
          transform: flip ? 'rotateY(180deg)' : 'rotateY(0deg)',
          transition: 'transform .5s cubic-bezier(.4,.2,.2,1)', cursor: 'pointer',
        }}>
          {muka(k.depan, {
            background: 'linear-gradient(160deg,#FFFDF7 0%,#FFF3D6 100%)',
            border: '2px solid #F5C542', color: '#6B4E00',
          }, `DEPAN • ${pos + 1}/${urut.length}`)}
          {muka(k.belakang, {
            background: 'linear-gradient(160deg,#F5F3FF 0%,#EDE9FE 100%)',
            border: '2px solid #8B5CF6', color: '#4C1D95',
            transform: 'rotateY(180deg)',
          }, 'BELAKANG')}
        </div>
      </div>

      {/* navigasi */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        <button type="button" style={S.tombolKecil} disabled={pos === 0}
          onClick={() => ganti(pos - 1)}>
          <ChevronLeft size={14} /> Mundur
        </button>
        <span style={{ fontSize: 12, fontWeight: 900, color: '#5B21B6' }}>
          {pos + 1} / {urut.length}
        </span>
        <button type="button" style={S.tombolKecil} disabled={pos >= urut.length - 1}
          onClick={() => ganti(pos + 1)}>
          Lanjut <ChevronRight size={14} />
        </button>
        <button type="button" style={{ ...S.tombolKecil, marginLeft: 'auto' }} onClick={acak}>
          <Shuffle size={13} /> Acak
        </button>
      </div>

      {/* tandai hafal / perlu diulang */}
      <div style={{ display: 'flex', gap: 8, marginTop: 9 }}>
        <button type="button"
          style={{ ...S.tombolKecil, flex: 1, justifyContent: 'center', ...(tandai[idx] === 'hafal' ? { background: '#ECFDF5', borderColor: '#16A34A', color: '#15803D' } : {}) }}
          onClick={() => setTandai((o) => ({ ...o, [idx]: o[idx] === 'hafal' ? undefined : 'hafal' }))}>
          <CheckCircle2 size={13} /> Sudah hafal
        </button>
        <button type="button"
          style={{ ...S.tombolKecil, flex: 1, justifyContent: 'center', ...(tandai[idx] === 'ulang' ? { background: '#FFF6DE', borderColor: '#F1E1AE', color: '#8A6D1A' } : {}) }}
          onClick={() => setTandai((o) => ({ ...o, [idx]: o[idx] === 'ulang' ? undefined : 'ulang' }))}>
          <RotateCcw size={13} /> Ulangi lagi
        </button>
      </div>
      {sudahDitandai ? (
        <div style={{ ...S.hasil, color: '#64748B', marginTop: 8 }}>
          {Object.values(tandai).filter((v) => v === 'hafal').length} kartu ditandai hafal
          {Object.values(tandai).filter((v) => v === 'ulang').length ? ` • ${Object.values(tandai).filter((v) => v === 'ulang').length} perlu diulang` : ''}.
        </div>
      ) : null}
    </div>
  );
}

// ============================================================
// 4) URUTAN — susun langkah/proses dengan benar
//    {jenis:'urutan', judul?, keterangan?, items:[langkah benar...]}
// ============================================================
export function UrutanLangkah({ widget }) {
  const benar = React.useMemo(() => (widget.items || []).map((it) => (
    typeof it === 'string' ? it : pilih(it, ['teks', 'langkah', 'label'])
  )).filter(Boolean), [widget.items]);

  const seed = React.useMemo(() => benar.join('|'), [benar]);
  const [susun, setSusun] = React.useState(() => acakArray(benar.map((_, i) => i), seed));
  const [cek, setCek] = React.useState(false);

  if (benar.length < 2) return null;
  const benarCount = cek ? susun.filter((v, i) => v === i).length : 0;

  const pindah = (i, dir) => {
    if (cek) return;
    const j = i + dir;
    if (j < 0 || j >= susun.length) return;
    setSusun((s) => { const o = [...s]; [o[i], o[j]] = [o[j], o[i]]; return o; });
  };
  const ulang = () => { setSusun(acakArray(benar.map((_, i) => i), String(Date.now()))); setCek(false); };

  return (
    <div style={S.box}>
      <KepalaWidget ikon={ListOrdered} judul={widget.judul || '🧩 Susun Urutan'} labelChip="Urutkan langkah" />
      <div style={S.ket}>
        {widget.keterangan || 'Susun langkah dari awal sampai akhir dengan tombol panah, lalu tekan Cek.'}
      </div>

      {susun.map((v, i) => {
        const tepat = cek && v === i;
        const meleset = cek && v !== i;
        return (
          <div key={v} style={{
            ...S.soal, display: 'flex', alignItems: 'center', gap: 9, marginBottom: 8,
            ...(cek ? borderHasil(tepat, meleset) : {}),
          }}>
            <span style={{
              flexShrink: 0, width: 24, height: 24, borderRadius: 999,
              background: cek ? (tepat ? '#16A34A' : '#DC2626') : '#7C3AED',
              color: '#fff', fontSize: 12, fontWeight: 900,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>{i + 1}</span>
            <span style={{ flex: 1, fontSize: 13, lineHeight: 1.6, color: '#0F172A' }}>
              <MathText text={benar[v]} />
              {meleset ? <span style={{ display: 'block', fontSize: 11.5, color: '#15803D' }}>✅ Posisi tepat: nomor {v + 1}</span> : null}
            </span>
            {!cek ? (
              <span style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                <button type="button" aria-label="Naikkan" style={{ ...S.tombolKecil, padding: '3px 7px' }}
                  disabled={i === 0} onClick={() => pindah(i, -1)}><ArrowUp size={13} /></button>
                <button type="button" aria-label="Turunkan" style={{ ...S.tombolKecil, padding: '3px 7px' }}
                  disabled={i === susun.length - 1} onClick={() => pindah(i, 1)}><ArrowDown size={13} /></button>
              </span>
            ) : null}
          </div>
        );
      })}

      {!cek ? (
        <div style={{ display: 'flex', gap: 8 }}>
          <button type="button" style={S.tombol} onClick={() => setCek(true)}>✔ Cek urutan</button>
          <button type="button" style={S.tombolKecil} onClick={ulang}><Shuffle size={13} /> Acak ulang</button>
        </div>
      ) : (
        <BarisSkor benar={benarCount} total={benar.length} onUlangi={ulang} />
      )}
    </div>
  );
}

// ============================================================
// 5) BENAR/SALAH — penilaian pernyataan cepat
//    {jenis:'benarSalah', judul?, keterangan?,
//     items:[{teks, jawaban:bool, penjelasan?}]}
// ============================================================
export function BenarSalah({ widget }) {
  const items = React.useMemo(() => (widget.items || []).map((it) => {
    if (typeof it === 'string') return null;
    return {
      teks: pilih(it, ['teks', 'soal', 'pernyataan']),
      jawaban: keBoolean(pilih(it, ['jawaban', 'kunci', 'answer'], false)),
      penjelasan: pilih(it, ['penjelasan', 'pembahasan']),
    };
  }).filter((it) => it && it.teks), [widget.items]);

  const [pil, setPil] = React.useState({});
  const [cek, setCek] = React.useState(false);

  if (!items.length) return null;
  const semuaTerisi = items.every((_, i) => pil[i] != null);
  const benarCount = items.reduce((n, it, i) => (n + (pil[i] === it.jawaban ? 1 : 0)), 0);
  const ulang = () => { setPil({}); setCek(false); };

  return (
    <div style={S.box}>
      <KepalaWidget ikon={Scale} judul={widget.judul || '⚖️ Benar atau Salah'} labelChip="Pilih B / S" />
      <div style={S.ket}>
        {widget.keterangan || 'Tandai setiap pernyataan Benar atau Salah, lalu tekan Cek.'}
      </div>

      {items.map((it, i) => {
        const tepat = cek ? pil[i] === it.jawaban : null;
        return (
          <div key={i} style={{ ...S.soal, ...(cek ? borderHasil(tepat, !tepat) : {}) }}>
            <div style={{ ...S.teksSoal, marginBottom: 7 }}>
              {i + 1}. <MathText text={it.teks} />
            </div>
            <div style={{ display: 'flex', gap: 7 }}>
              {[{ v: true, l: '✔ Benar' }, { v: false, l: '✘ Salah' }].map((o) => {
                const dipilih = pil[i] === o.v;
                const kunciIni = cek && it.jawaban === o.v;
                return (
                  <button key={String(o.v)} type="button" disabled={cek}
                    onClick={() => setPil((x) => ({ ...x, [i]: o.v }))}
                    style={{
                      flex: 1, borderRadius: 11, padding: '8px 10px', fontSize: 12.5,
                      fontWeight: 900, cursor: cek ? 'default' : 'pointer',
                      border: kunciIni ? '2px solid #16A34A'
                        : dipilih ? '2px solid #7C3AED' : '1.5px solid #E2E8F0',
                      background: kunciIni ? '#ECFDF5'
                        : dipilih ? '#F5F3FF' : '#fff',
                      color: kunciIni ? '#15803D' : dipilih ? '#5B21B6' : '#475569',
                    }}>
                    {o.l}
                  </button>
                );
              })}
            </div>
            {cek ? (
              <div style={{ ...S.hasil, color: tepat ? '#15803D' : '#B91C1C' }}>
                {tepat ? '✅ Tepat! ' : `❌ Kurang tepat — jawaban: ${it.jawaban ? 'BENAR' : 'SALAH'}. `}
                {it.penjelasan || ''}
              </div>
            ) : null}
          </div>
        );
      })}

      {!cek ? (
        <button type="button" style={{ ...S.tombol, opacity: semuaTerisi ? 1 : 0.5 }}
          disabled={!semuaTerisi} onClick={() => setCek(true)}>
          ✔ Cek semua
        </button>
      ) : (
        <BarisSkor benar={benarCount} total={items.length} onUlangi={ulang} />
      )}
    </div>
  );
}

// ============================================================
// 6) VIDEO — embed YouTube / berkas mp4
//    {jenis:'video', judul?, url, keterangan?}
// ============================================================
function idYoutube(url) {
  const s = String(url || '');
  const pola = [
    /(?:youtube\.com\/watch\?[^#]*v=)([\w-]{6,})/i,
    /(?:youtu\.be\/)([\w-]{6,})/i,
    /(?:youtube\.com\/embed\/)([\w-]{6,})/i,
    /(?:youtube\.com\/shorts\/)([\w-]{6,})/i,
    /(?:youtube\.com\/live\/)([\w-]{6,})/i,
  ];
  for (const p of pola) {
    const m = s.match(p);
    if (m) return m[1];
  }
  return null;
}

export function VideoEmbed({ widget }) {
  const url = String(widget.url || '');
  const yt = idYoutube(url);
  const berkas = /\.(mp4|webm|ogg|ogv|mov|m4v)(\?|#|$)/i.test(url);
  const judul = widget.judul || '🎬 Video Materi';

  return (
    <div style={{ ...S.box, background: '#fff', border: `1px solid ${T.garis}`, boxShadow: '0 6px 18px rgba(15,23,42,.06)' }}>
      <KepalaWidget ikon={Play} judul={judul} labelChip={yt ? 'YouTube' : berkas ? 'Video' : 'Tautan'} />
      {widget.keterangan ? <div style={S.ket}>{widget.keterangan}</div> : null}

      {yt ? (
        <div style={{ position: 'relative', width: '100%', paddingTop: '56.25%', borderRadius: 14, overflow: 'hidden', background: '#0F172A' }}>
          <iframe
            title={judul}
            src={`https://www.youtube.com/embed/${yt}?rel=0&modestbranding=1`}
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', border: 0 }}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            loading="lazy"
          />
        </div>
      ) : berkas ? (
        <video
          src={url} controls preload="metadata" playsInline
          style={{ width: '100%', maxHeight: 420, borderRadius: 14, background: '#0F172A', display: 'block' }}
        />
      ) : url ? (
        <div style={{ ...S.soal, textAlign: 'center' }}>
          <div style={{ fontSize: 12.5, color: '#64748B', marginBottom: 8 }}>
            Tautan video tidak bisa disematkan otomatis. Buka langsung:
          </div>
          <a href={url} target="_blank" rel="noreferrer" style={S.tombol}>
            <Play size={14} /> Buka video
          </a>
        </div>
      ) : (
        <div style={{ ...S.soal, fontSize: 12.5, color: '#B91C1C' }}>
          ⚠️ Widget video tanpa url — isi field url (YouTube/mp4) di editor admin.
        </div>
      )}
    </div>
  );
}

// ============================================================
// DISPATCHER — dipakai IsiSections & BukuBacaPage
// ============================================================
export default function WidgetInteraktif({ widget }) {
  if (!widget || !JENIS_INTERAKTIF.has(widget.jenis)) return null;
  switch (widget.jenis) {
    case 'jodohMini': return <JodohMini widget={widget} />;
    case 'isianRumpang': return <IsianRumpang widget={widget} />;
    case 'flashcard': return <FlashcardDeck widget={widget} />;
    case 'urutan': return <UrutanLangkah widget={widget} />;
    case 'benarSalah': return <BenarSalah widget={widget} />;
    case 'video': return <VideoEmbed widget={widget} />;
    default: return null;
  }
}
