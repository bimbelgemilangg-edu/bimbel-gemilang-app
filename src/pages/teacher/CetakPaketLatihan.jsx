// src/pages/teacher/CetakPaketLatihan.jsx
// ============================================================
// CETAK PAKET LATIHAN (Fase 3 skema buku-kliping, docs/KERANGKA-KONTEN-BUKU.md)
//
// Loop operasional owner: bank soal terus diisi admin -> tentor MEMILIH
// soal sesuai bab/minggu -> tentor MENCETAK sendiri secara rapi -> siswa
// menggunting dan menempel di buku progres.
//
// 🔥 DIROMBAK (2026-10-06, arahan owner: "harusnya per mapel jelas lalu
// dibuka per bab"): pemilihan semula berupa SATU daftar datar paket try
// out, padahal unit alami skema mingguan adalah MAPEL lalu BAB. Sekarang
// ada dua sumber dengan hirarki yang sama seperti Lemari Soal admin
// (jenjang -> mapel -> materi/bab):
//   - "Bank Soal"  : jelajah mapel -> bab -> centang butir -> cetak
//   - "Paket Saya" : paket try out yang terhubung ke tentor (perilaku lama)
//
// Menghasilkan TIGA dokumen terpisah (aturan kerangka):
//   1. PAKET-SISWA   : kotak soal siap gunting, TANPA kunci
//   2. KUNCI-TENTOR  : kunci + pembahasan, berkepala peringatan keras
//   3. LEMBAR-CATATAN: area tempel + kolom catatan pengerjaan
// Tata letak hidup di src/utils/cetakLatihan.js (murni, teruji).
//
// AKSES: mode paket mengikuti aturan halaman pantau (#125) -- hanya paket
// terhubung ke tentor login. Mode bank bersifat baca+cetak saja (tidak
// mengubah atau menilai apa pun), jadi terbuka untuk semua guru seperti
// lemari soal itu sendiri.
// ============================================================

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../firebase';
import { bacaIdentitasGuru } from '../../utils/identitasGuru';
import { pilihSoalUntukCetak, htmlPaketSiswa, htmlKunciTentor, htmlLembarCatatan } from '../../utils/cetakLatihan';
import { cetakLewatIframe } from '../../utils/kwitansi';
import { useSegarSaatTerlihat } from '../../utils/useSegarSaatTerlihat';

const BELUM = '(Belum diatur)';
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

export default function CetakPaketLatihan() {
  const [sumber, setSumber] = useState('bank');       // 'bank' | 'paket'
  const [bankSoal, setBankSoal] = useState([]);
  const [paketList, setPaketList] = useState([]);
  const [memuat, setMemuat] = useState(true);

  const [mapelAktif, setMapelAktif] = useState('');
  const [babAktif, setBabAktif] = useState('');
  const [tercentang, setTercentang] = useState([]);    // id butir terpilih
  const [tanpaEsai, setTanpaEsai] = useState(false);

  const [paketId, setPaketId] = useState('');
  const [maksPaket, setMaksPaket] = useState(0);

  const versiSegar = useSegarSaatTerlihat();

  const muatSemua = useCallback(async () => {
    setMemuat(true);
    try {
      const [snapBank, snapPaket] = await Promise.all([
        getDocs(collection(db, 'bank_soal')),
        (async () => {
          const idt = bacaIdentitasGuru();
          if (!idt.semuaId.length) return { docs: [] };
          return getDocs(query(collection(db, 'tryout_paket'), where('tentorId', 'in', idt.semuaId)));
        })(),
      ]);
      setBankSoal(snapBank.docs.map((d) => ({ id: d.id, ...d.data() })));
      setPaketList(snapPaket.docs.map((d) => ({ id: d.id, ...d.data() })));
    } catch {
      setBankSoal([]);
      setPaketList([]);
    } finally {
      setMemuat(false);
    }
  }, []);

  useEffect(() => { muatSemua(); }, [muatSemua, versiSegar]);

  // ---- hirarki bank: mapel -> bab, persis pola Lemari Soal admin ----
  const daftarMapel = useMemo(() => {
    const hitung = new Map();
    for (const s of bankSoal) {
      const k = (s.mataPelajaran || '').trim() || BELUM;
      hitung.set(k, (hitung.get(k) || 0) + 1);
    }
    return [...hitung.entries()].sort((a, b) => a[0].localeCompare(b[0], 'id'));
  }, [bankSoal]);

  const daftarBab = useMemo(() => {
    if (!mapelAktif) return [];
    const hitung = new Map();
    for (const s of bankSoal) {
      if (((s.mataPelajaran || '').trim() || BELUM) !== mapelAktif) continue;
      const k = (s.materi || '').trim() || BELUM;
      hitung.set(k, (hitung.get(k) || 0) + 1);
    }
    return [...hitung.entries()].sort((a, b) => a[0].localeCompare(b[0], 'id'));
  }, [bankSoal, mapelAktif]);

  const soalDiBab = useMemo(() => {
    if (!mapelAktif || !babAktif) return [];
    return bankSoal.filter((s) =>
      ((s.mataPelajaran || '').trim() || BELUM) === mapelAktif &&
      ((s.materi || '').trim() || BELUM) === babAktif);
  }, [bankSoal, mapelAktif, babAktif]);

  const soalBankTampil = useMemo(
    () => (tanpaEsai ? soalDiBab.filter((s) => !['esai', 'uraian'].includes(s.tipe)) : soalDiBab),
    [soalDiBab, tanpaEsai]
  );

  const terpilihBank = useMemo(
    () => soalBankTampil.filter((s) => tercentang.includes(s.id)),
    [soalBankTampil, tercentang]
  );

  // ---- mode paket (perilaku #134) ----
  const paket = paketList.find((p) => p.id === paketId) || null;
  const soalPaket = pilihSoalUntukCetak(paket?.daftarSoal, { maks: maksPaket || undefined, tanpaEsai });

  const siap = sumber === 'bank' ? terpilihBank : soalPaket;
  const meta = sumber === 'bank'
    ? { judul: `${mapelAktif} — ${babAktif}`, mapel: mapelAktif, targetKelas: '', bab: babAktif }
    : { judul: paket?.judul || '', mapel: paket?.targetKategori || '', targetKelas: paket?.targetKelas || '', bab: paket?.babJudul || '' };

  const centang = (id, on) => setTercentang((lama) => (on ? [...lama, id] : lama.filter((x) => x !== id)));

  return (
    <div style={{ maxWidth: 900, margin: '0 auto' }}>
      <h2 style={{ margin: '4px 0 4px', fontSize: 18 }}>🖨️ Cetak Paket Latihan</h2>
      <p style={{ fontSize: 12, color: '#64748b', margin: '0 0 12px' }}>
        Pilih per mapel lalu buka per bab, centang butir yang mau dicetak, dan terima
        tiga dokumen terpisah: lembar siswa siap gunting, kunci pegangan tentor,
        dan lembar catatan buku progres.
      </p>

      <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
        <button style={gayaPill(sumber === 'bank')} onClick={() => setSumber('bank')}>🗂️ Bank Soal (per mapel → bab)</button>
        <button style={gayaPill(sumber === 'paket')} onClick={() => setSumber('paket')}>📦 Paket Try Out saya ({paketList.length})</button>
      </div>

      {memuat && <div style={{ fontSize: 12, color: '#6b7280' }}>Memuat bank soal…</div>}

      {sumber === 'bank' && !memuat && (
        <>
          <div style={gayaKartu}>
            <div style={gayaJudulKartu}>1 · Mata pelajaran</div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {daftarMapel.map(([m, n]) => (
                <button key={m} style={gayaPill(mapelAktif === m)} onClick={() => { setMapelAktif(m); setBabAktif(''); setTercentang([]); }}>
                  {m} <span style={{ opacity: 0.6 }}>({n})</span>
                </button>
              ))}
              {daftarMapel.length === 0 && <span style={{ fontSize: 12, color: '#94a3b8' }}>Bank soal masih kosong.</span>}
            </div>
          </div>

          {mapelAktif && (
            <div style={gayaKartu}>
              <div style={gayaJudulKartu}>2 · Bab / materi pada {mapelAktif}</div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {daftarBab.map(([b, n]) => (
                  <button key={b} style={gayaPill(babAktif === b)} onClick={() => { setBabAktif(b); setTercentang([]); }}>
                    {b} <span style={{ opacity: 0.6 }}>({n})</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {babAktif && (
            <div style={gayaKartu}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                <div style={gayaJudulKartu}>3 · Centang butir yang akan dicetak ({terpilihBank.length}/{soalBankTampil.length})</div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <label style={{ fontSize: 11.5, color: '#475569', display: 'flex', gap: 5, alignItems: 'center' }}>
                    <input type="checkbox" checked={tanpaEsai} onChange={(e) => setTanpaEsai(e.target.checked)} /> lewati esai
                  </label>
                  <button style={gayaPill(false)} onClick={() => setTercentang(soalBankTampil.map((s) => s.id))}>pilih semua</button>
                  <button style={gayaPill(false)} onClick={() => setTercentang([])}>bersihkan</button>
                </div>
              </div>
              <div style={{ maxHeight: 380, overflowY: 'auto', border: '1px solid #e2e8f0', borderRadius: 10, padding: 8 }}>
                {soalBankTampil.map((s, i) => (
                  <label key={s.id} style={{ display: 'flex', gap: 8, padding: '7px 6px', borderBottom: '1px solid #f1f5f9', fontSize: 12, cursor: 'pointer', alignItems: 'flex-start' }}>
                    <input type="checkbox" checked={tercentang.includes(s.id)} onChange={(e) => centang(s.id, e.target.checked)} style={{ marginTop: 2 }} />
                    <span>
                      <b style={{ color: '#3730a3' }}>{i + 1}.</b>{' '}
                      <span style={{ color: '#64748b', fontSize: 10.5 }}>[{String(s.tipe || 'pg_sederhana').replace(/_/g, ' ')}]</span>{' '}
                      {String(s.soal || s.teks_soal || '').slice(0, 110)}
                    </span>
                  </label>
                ))}
                {soalBankTampil.length === 0 && <div style={{ fontSize: 12, color: '#94a3b8', padding: 8 }}>Tidak ada butir di bab ini setelah saringan.</div>}
              </div>
            </div>
          )}
        </>
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
        </div>
      )}

      {!memuat && (
        <div style={gayaKartu}>
          <div style={gayaJudulKartu}>4 · Cetak ({siap.length} butir)</div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button style={gayaTombol('#2563eb', siap.length === 0)} disabled={siap.length === 0} onClick={() => cetakLewatIframe(htmlPaketSiswa(meta, siap), 'Paket Siswa')}>✂️ PAKET-SISWA</button>
            <button style={gayaTombol('#b91c1c', siap.length === 0)} disabled={siap.length === 0} onClick={() => cetakLewatIframe(htmlKunciTentor(meta, siap), 'Kunci Tentor')}>🔑 KUNCI-TENTOR</button>
            <button style={gayaTombol('#15803d', siap.length === 0)} disabled={siap.length === 0} onClick={() => cetakLewatIframe(htmlLembarCatatan(meta, siap), 'Lembar Catatan')}>📝 LEMBAR-CATATAN</button>
          </div>
          <div style={{ fontSize: 11, color: '#64748b', marginTop: 10, lineHeight: 1.6 }}>
            Aturan kertas bekas (docs/KERANGKA-KONTEN-BUKU.md): cetak SATU muka; bekas jadwal
            atau draft internal boleh, bekas absensi bernama / kwitansi / berkas keuangan
            TIDAK BOLEH. Layout hemat toner: tanpa background berwarna, kotak berborder
            tegas, garis potong di tepi tiap butir.
          </div>
        </div>
      )}
    </div>
  );
}
