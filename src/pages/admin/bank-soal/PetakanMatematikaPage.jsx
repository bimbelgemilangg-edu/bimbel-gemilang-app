// src/pages/admin/bank-soal/PetakanMatematikaPage.jsx
// ============================================================
// PETAKAN MATERI MATEMATIKA (Admin) -- Langkah 4 dari roadmap
// perbaikan fondasi Bank Soal.
// ============================================================
// Beda dari Rapikan Literasi (yang pemisahannya MEKANIS, pecah di
// tanda " - "), materi Matematika gak punya pola string yang bisa
// dieksploitasi begitu saja -- variasinya karena beda sesi impor
// menuliskan topik YANG SAMA dengan gaya beda (mis. "Bilangan cacah
// sampai 10.000" vs "Bilangan Cacah Sampai 10.000 – Nilai Tempat").
//
// Jadi di sini sistem MENYARANKAN bab tujuan (skor kecocokan kata
// kunci terhadap daftar Taksonomi Materi), tapi admin TETAP yang
// memutuskan lewat dropdown per kelompok -- beda dari Rapikan
// Literasi yang langsung otomatis, karena di sini potensi salah
// tebak lebih tinggi (tidak ada pola string yang pasti).
//
// Soal dengan tingkatKelas spesifik (1-9) dicocokkan ke bab kelas
// itu saja. Soal kelas 10/11/12 SELALU dicocokkan ke GABUNGAN bab
// kelas 10-12 -- konsisten dengan aturan akses yang sudah ada
// (TKA/SNBT/UTBK memang lintas kelas dalam 1 jenjang, lihat
// cocokkanKelas() di aksesKontenSiswa.js), dan ternyata banyak soal
// yang ditag kelas 12 isinya materi kelas 10/11 juga.
//
// Kelompok yang skor kecocokannya rendah (gak ketemu kata kunci yang
// nyambung cukup kuat sama bab manapun) TIDAK diberi saran otomatis --
// admin wajib pilih manual atau biarkan, supaya gak ada tebakan
// sembarangan yang lolos tanpa disadari.
//
// 🔒 NON-DESTRUKTIF: cuma mengubah field `materi` (+ menyimpan nilai
// asli di `materiAsliSebelumRapi`), tidak menghapus apa pun. Tetap
// ada tahap review sebelum "Terapkan" ditekan.
// ============================================================

import React, { useState, useCallback, useMemo } from 'react';
import SidebarAdmin from '../../../components/SidebarAdmin';
import { db } from '../../../firebase';
import { collection, getDocs, query, where, doc, writeBatch } from 'firebase/firestore';
import { Loader2, ScanSearch, GitMerge, Sparkles } from 'lucide-react';

const BIARKAN = '(biarkan, jangan diubah)';
const AMBANG_YAKIN = 7; // skor minimal (skala 0-10) biar dianggap "cukup yakin" buat disarankan otomatis

// Kata sambung yang HARUS diabaikan -- tanpa ini, dua topik yang gak
// ada hubungannya bisa keanggap "mirip" cuma gara-gara sama-sama
// punya kata "dan"/"yang"/dst.
const KATA_SAMBUNG = new Set(['dan', 'atau', 'yang', 'dalam', 'dari', 'ke', 'di', 'pada', 'untuk', 'dengan', 'sampai', 'adalah', 'ini', 'itu', 'antara', 'serta', 'oleh', 'secara', 'terhadap', 'akan', 'juga']);

function normalisasi(s) {
  return String(s || '')
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// Kata "bermakna" -- buang kata sambung & kata terlalu pendek.
function ambilKataBermakna(s) {
  return normalisasi(s).split(' ').filter((w) => w.length > 2 && !KATA_SAMBUNG.has(w));
}

// 🔥 FIX ke-3: skor sebelumnya (jumlah kata cocok x3, bonus cuma
// kalau SEMUA kata bab ketemu persis) bikin banyak kecocokan JELAS
// BENAR malah gagal disarankan -- mis. "Pecahan" (1 kata) vs bab
// "Pecahan dan desimal" (2 kata) cuma dapat skor 3, di bawah ambang,
// padahal itu jelas cocok. Sekarang pakai RASIO: seberapa besar
// bagian dari sisi yang LEBIH PENDEK (materi lama ATAU nama bab)
// yang ketemu di sisi lainnya. "Pecahan" yang 1 katanya nyambung
// penuh ke "pecahan dan desimal" jadi rasio 1.0 (skor 10) -- jauh
// lebih masuk akal buat kasus istilah pendek vs istilah lengkap.
function skorCocok(materiLama, bab) {
  const kataA = new Set(ambilKataBermakna(materiLama));
  const kataB = new Set(ambilKataBermakna(bab));
  if (kataA.size === 0 || kataB.size === 0) return 0;
  let overlap = 0;
  kataB.forEach((w) => { if (kataA.has(w)) overlap++; });
  if (overlap === 0) return 0;
  const rasio = overlap / Math.min(kataA.size, kataB.size);
  return Math.round(rasio * 10);
}

function cariBabTerbaik(materiLama, daftarBab) {
  let terbaik = null, skorTerbaik = 0;
  daftarBab.forEach((bab) => {
    const skor = skorCocok(materiLama, bab);
    if (skor > skorTerbaik) { skorTerbaik = skor; terbaik = bab; }
  });
  return { bab: terbaik, skor: skorTerbaik };
}

export default function PetakanMatematikaPage() {
  const [isMobile] = useState(window.innerWidth < 1024);
  const [loading, setLoading] = useState(false);
  const [sudahPindai, setSudahPindai] = useState(false);
  const [kelompok, setKelompok] = useState([]); // [{ kunci, kelasLabel, opsiBab, materiLama, jumlah, ids, skor, pilihan }]
  const [totalSoal, setTotalSoal] = useState(0);
  const [menerapkan, setMenerapkan] = useState(false);
  const [statusTerap, setStatusTerap] = useState('');

  const pindai = useCallback(async () => {
    setLoading(true);
    setSudahPindai(false);
    try {
      const snapTaksonomi = await getDocs(query(collection(db, 'taksonomi_materi'), where('mapel', '==', 'Matematika')));
      const babPerKelas = {};
      snapTaksonomi.docs.forEach((d) => {
        const data = d.data();
        babPerKelas[data.kelas] = data.babBaku || [];
      });
      const babGabunganSMA = [...new Set([...(babPerKelas['10'] || []), ...(babPerKelas['11'] || []), ...(babPerKelas['12'] || [])])];

      if (Object.keys(babPerKelas).length === 0) {
        alert('Taksonomi Matematika belum diisi. Buka halaman "Taksonomi Materi" dulu, klik "Isi Otomatis Matematika".');
        setLoading(false);
        return;
      }

      const snapSoal = await getDocs(query(collection(db, 'bank_soal'), where('mataPelajaran', '==', 'Matematika')));
      const semua = snapSoal.docs
        .map((d) => ({ id: d.id, ...d.data() }))
        .filter((s) => s.status !== 'nonaktif' && s.status !== 'dihapus' && String(s.materi || '').trim());

      // Kelompokkan per (kelasKey, materiLama) -- kelasKey menentukan
      // pool bab yang jadi kandidat pencocokan.
      //
      // 🔥 FIX ke-4: kelas 10/11/12 SELALU pakai pool GABUNGAN
      // (bukan taksonomi kelasnya sendiri-sendiri) -- soal SMA yang
      // ditag "kelas 12" ternyata sering isinya materi kelas 10/11
      // juga (mis. "Eksponen dan logaritma" itu materi kelas 10,
      // tapi banyak soal review/TKA yang ditag kelas 12). Kalau
      // dibatasi ke taksonomi kelas 12 doang, banyak yang gagal
      // ketemu padahal jelas cocok ke bab kelas lain dalam jenjang
      // SMA yang sama.
      const KELAS_SMA = new Set(['10', '11', '12']);
      const peta = new Map();
      semua.forEach((s) => {
        const kelasAsli = String(s.tingkatKelas || '').trim();
        const pakaiGabungan = KELAS_SMA.has(kelasAsli) || !babPerKelas[kelasAsli];
        const kelasKey = pakaiGabungan ? 'SMA_GABUNGAN' : kelasAsli;
        const opsiBab = pakaiGabungan ? babGabunganSMA : babPerKelas[kelasAsli];
        const kunci = `${kelasKey}|||${s.materi.trim()}`;
        if (!peta.has(kunci)) {
          peta.set(kunci, { kelasKey, kelasLabel: pakaiGabungan ? 'Kelas 10-12 (gabungan/TKA)' : `Kelas ${kelasAsli}`, opsiBab, materiLama: s.materi.trim(), ids: [] });
        }
        peta.get(kunci).ids.push(s.id);
      });

      const hasil = [...peta.values()].map((g) => {
        const { bab, skor } = cariBabTerbaik(g.materiLama, g.opsiBab);
        return { ...g, kunci: `${g.kelasKey}|||${g.materiLama}`, jumlah: g.ids.length, skor, pilihan: skor >= AMBANG_YAKIN ? bab : BIARKAN };
      }).sort((a, b) => b.jumlah - a.jumlah);

      setKelompok(hasil);
      setTotalSoal(semua.length);
      setSudahPindai(true);
    } catch (e) {
      console.error('Gagal memindai:', e);
      alert('Gagal memindai: ' + e.message);
    }
    setLoading(false);
  }, []);

  const ubahPilihan = (kunci, babBaru) => {
    setKelompok((prev) => prev.map((k) => (k.kunci === kunci ? { ...k, pilihan: babBaru } : k)));
  };

  const jumlahAkanDiubah = useMemo(() => kelompok.filter((k) => k.pilihan !== BIARKAN).reduce((acc, k) => acc + k.jumlah, 0), [kelompok]);
  const jumlahTanpaSaran = useMemo(() => kelompok.filter((k) => k.skor < AMBANG_YAKIN).length, [kelompok]);

  const terapkanPemetaan = useCallback(async () => {
    const dipetakan = kelompok.filter((k) => k.pilihan !== BIARKAN);
    if (dipetakan.length === 0) return alert('Tidak ada kelompok yang dipilih untuk dipetakan.');
    if (!window.confirm(`Terapkan pemetaan untuk ${jumlahAkanDiubah} soal dari ${dipetakan.length} kelompok? Nilai materi asli tetap disimpan di field materiAsliSebelumRapi.`)) return;

    setMenerapkan(true);
    try {
      const semuaId = [];
      dipetakan.forEach((k) => k.ids.forEach((id) => semuaId.push({ id, target: k.pilihan, asli: k.materiLama })));
      for (let i = 0; i < semuaId.length; i += 400) {
        const potongan = semuaId.slice(i, i + 400);
        const batch = writeBatch(db);
        potongan.forEach(({ id, target, asli }) => {
          batch.update(doc(db, 'bank_soal', id), { materi: target, materiAsliSebelumRapi: asli });
        });
        await batch.commit();
        setStatusTerap(`${Math.min(i + 400, semuaId.length)}/${semuaId.length} soal dipetakan...`);
      }
      setStatusTerap(`✅ Selesai. ${semuaId.length} soal dari ${dipetakan.length} kelompok berhasil dipetakan.`);
    } catch (e) {
      console.error('Gagal menerapkan:', e);
      setStatusTerap('❌ Gagal: ' + e.message);
    }
    setMenerapkan(false);
  }, [kelompok, jumlahAkanDiubah]);

  const wrapper = { display: 'flex', background: '#f8fafc', minHeight: '100vh' };
  const mainContent = { marginLeft: isMobile ? '0' : '260px', padding: isMobile ? '15px' : '30px', width: isMobile ? '100%' : 'calc(100% - 260px)', boxSizing: 'border-box' };
  const cardStyle = { background: 'white', border: '1px solid #e5e7eb', borderRadius: 16, padding: 20, marginBottom: 20 };
  const selectStyle = { padding: '6px 10px', borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 12, fontWeight: 600, color: '#1e293b', background: 'white', cursor: 'pointer', maxWidth: 260 };

  return (
    <div style={wrapper}>
      <SidebarAdmin />
      <div style={mainContent}>
        <div style={{ marginBottom: 20 }}>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: '#1e293b', margin: 0 }}>🧩 Petakan Materi Matematika</h1>
          <p style={{ color: '#6b7280', fontSize: 13, marginTop: 4 }}>
            Langkah 4: cocokkan materi lama ke Taksonomi Materi. Sistem menyarankan, kamu yang memutuskan lewat dropdown per kelompok sebelum diterapkan.
          </p>
        </div>

        <button
          onClick={pindai}
          disabled={loading}
          style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#5B2ECC', color: 'white', border: 'none', borderRadius: 10, padding: '11px 20px', fontWeight: 700, fontSize: 13, cursor: loading ? 'default' : 'pointer', opacity: loading ? 0.7 : 1, marginBottom: 20 }}
        >
          {loading ? <Loader2 size={16} className="spin" /> : <ScanSearch size={16} />}
          {loading ? 'Memindai...' : 'Pindai Mapel Matematika'}
        </button>

        {sudahPindai && (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14, marginBottom: 20 }}>
              <div style={cardStyle}>
                <div style={{ fontSize: 11.5, color: '#6b7280', fontWeight: 700 }}>Soal Matematika dipindai</div>
                <div style={{ fontSize: 24, fontWeight: 800, color: '#1e293b' }}>{totalSoal}</div>
              </div>
              <div style={{ ...cardStyle, borderColor: '#ddd6fe' }}>
                <div style={{ fontSize: 11.5, color: '#5B2ECC', fontWeight: 700 }}>Kelompok materi unik</div>
                <div style={{ fontSize: 24, fontWeight: 800, color: '#5B2ECC' }}>{kelompok.length}</div>
              </div>
              <div style={{ ...cardStyle, borderColor: '#fed7aa' }}>
                <div style={{ fontSize: 11.5, color: '#d97706', fontWeight: 700 }}>Tanpa saran (perlu manual)</div>
                <div style={{ fontSize: 24, fontWeight: 800, color: '#d97706' }}>{jumlahTanpaSaran}</div>
              </div>
              <div style={{ ...cardStyle, borderColor: '#a7f3d0' }}>
                <div style={{ fontSize: 11.5, color: '#059669', fontWeight: 700 }}>Akan dipetakan (soal)</div>
                <div style={{ fontSize: 24, fontWeight: 800, color: '#059669' }}>{jumlahAkanDiubah}</div>
              </div>
            </div>

            <div style={{ ...cardStyle, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10, background: '#f5f3ff', position: 'sticky', top: 10, zIndex: 10 }}>
              <div style={{ fontSize: 13, color: '#374151' }}>Review kelompok di bawah, ubah dropdown kalau saran kurang tepat, lalu terapkan.</div>
              <button
                onClick={terapkanPemetaan}
                disabled={menerapkan || jumlahAkanDiubah === 0}
                style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#5B2ECC', color: 'white', border: 'none', borderRadius: 10, padding: '9px 16px', fontWeight: 700, fontSize: 12.5, cursor: menerapkan ? 'default' : 'pointer', opacity: menerapkan || jumlahAkanDiubah === 0 ? 0.6 : 1 }}
              >
                {menerapkan ? <Loader2 size={14} className="spin" /> : <GitMerge size={14} />} Terapkan Pemetaan
              </button>
            </div>
            {statusTerap && <div style={{ ...cardStyle, color: statusTerap.startsWith('✅') ? '#166534' : '#374151' }}>{statusTerap}</div>}

            <div style={cardStyle}>
              {kelompok.map((k) => (
                <div key={k.kunci} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', borderRadius: 10, background: k.skor < AMBANG_YAKIN ? '#fffbeb' : '#f8fafc', marginBottom: 8, flexWrap: 'wrap' }}>
                  <div style={{ flex: 1, minWidth: 220 }}>
                    <div style={{ fontSize: 12.5, fontWeight: 700, color: '#1e293b' }}>{k.materiLama}</div>
                    <div style={{ fontSize: 10.5, color: '#9ca3af' }}>{k.kelasLabel} · {k.jumlah} soal {k.skor < AMBANG_YAKIN && <span style={{ color: '#d97706', fontWeight: 700 }}>· tanpa saran</span>}</div>
                  </div>
                  <select value={k.pilihan} onChange={(e) => ubahPilihan(k.kunci, e.target.value)} style={selectStyle}>
                    <option value={BIARKAN}>{BIARKAN}</option>
                    {k.opsiBab.map((bab) => <option key={bab} value={bab}>{bab}</option>)}
                  </select>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}