// src/pages/teacher/CetakPaketLatihan.jsx
// ============================================================
// CETAK PAKET LATIHAN (Fase 3 skema buku-kliping, docs/KERANGKA-KONTEN-BUKU.md)
//
// Menjawab loop operasional owner: bank soal terus diisi admin -> tentor
// MEMILIH soal sesuai bab/minggu -> tentor MENCETAK sendiri secara rapi ->
// siswa menggunting dan menempel di buku progres. Sebelum halaman ini ada,
// mata rantai "mencetak rapi" tidak ada: tentor terpaksa menyalin manual
// ke Word, dan di situlah kunci sering ikut tercetak ke siswa.
//
// Menghasilkan TIGA dokumen terpisah (aturan kerangka):
//   1. PAKET-SISWA   : kotak soal siap gunting, TANPA kunci
//   2. KUNCI-TENTOR  : kunci + pembahasan, berkepala peringatan keras
//   3. LEMBAR-CATATAN: area tempel + kolom langkah pikir / kesimpulan
// Seluruh tata letak (satu muka, border tegas, garis potong, tanpa
// background berwarna) hidup di src/utils/cetakLatihan.js supaya bisa
// diuji di Node dan dipakai ulang halaman lain kelak.
//
// AKSES: sama dengan halaman pantau (#125) -- hanya paket yang terhubung
// ke tentor login. Mencetak paket orang lain tetap urusan admin.
// ============================================================

import React, { useState, useEffect, useCallback } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../firebase';
import { bacaIdentitasGuru } from '../../utils/identitasGuru';
import { pilihSoalUntukCetak, htmlPaketSiswa, htmlKunciTentor, htmlLembarCatatan } from '../../utils/cetakLatihan';
import { cetakLewatIframe } from '../../utils/kwitansi';
import { useSegarSaatTerlihat } from '../../utils/useSegarSaatTerlihat';

const gayaKartu = { background: 'white', border: '1px solid #e2e8f0', borderRadius: 12, padding: 14, marginBottom: 12 };
const gayaTombol = (warna) => ({
  padding: '10px 16px', borderRadius: 10, border: 'none', background: warna,
  color: 'white', fontSize: 12.5, fontWeight: 800, cursor: 'pointer',
});

export default function CetakPaketLatihan() {
  const [paketList, setPaketList] = useState([]);
  const [paketId, setPaketId] = useState('');
  const [maks, setMaks] = useState(0);          // 0 = semua soal paket
  const [tanpaEsai, setTanpaEsai] = useState(false);
  const [memuat, setMemuat] = useState(true);
  const versiSegar = useSegarSaatTerlihat();

  const muatPaket = useCallback(async () => {
    setMemuat(true);
    try {
      const idt = bacaIdentitasGuru();
      if (!idt.semuaId.length) { setPaketList([]); return; }
      const snap = await getDocs(query(collection(db, 'tryout_paket'), where('tentorId', 'in', idt.semuaId)));
      setPaketList(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    } catch {
      setPaketList([]);
    } finally {
      setMemuat(false);
    }
  }, []);

  useEffect(() => { muatPaket(); }, [muatPaket, versiSegar]);

  const paket = paketList.find((p) => p.id === paketId) || null;
  const meta = paket
    ? { judul: paket.judul, mapel: paket.targetKategori, targetKelas: paket.targetKelas, bab: paket.babJudul || '' }
    : {};
  const soal = pilihSoalUntukCetak(paket?.daftarSoal, { maks: maks || undefined, tanpaEsai });

  return (
    <div style={{ maxWidth: 860, margin: '0 auto' }}>
      <h2 style={{ margin: '4px 0 4px', fontSize: 18 }}>🖨️ Cetak Paket Latihan</h2>
      <p style={{ fontSize: 12, color: '#64748b', margin: '0 0 12px' }}>
        Pilih paket yang terhubung ke Anda, atur isinya, lalu cetak tiga dokumen terpisah:
        lembar siswa siap gunting, kunci pegangan tentor, dan lembar catatan buku progres.
      </p>

      <div style={gayaKartu}>
        <div style={{ fontSize: 12, fontWeight: 800, color: '#0f172a', marginBottom: 8 }}>1 · Pilih paket</div>
        {memuat && <div style={{ fontSize: 12, color: '#6b7280' }}>Memuat paket…</div>}
        {!memuat && paketList.length === 0 && (
          <div style={{ fontSize: 12, color: '#94a3b8' }}>
            Belum ada paket yang terhubung ke akun Anda. Minta admin menghubungkan tentor
            di halaman Terbitkan Try Out.
          </div>
        )}
        {!memuat && paketList.length > 0 && (
          <select
            value={paketId}
            onChange={(e) => setPaketId(e.target.value)}
            style={{ width: '100%', padding: '9px 10px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 12.5 }}
          >
            <option value="">— pilih paket —</option>
            {paketList.map((p) => (
              <option key={p.id} value={p.id}>
                {p.judul} · {p.targetKelas} · {(p.daftarSoal || []).length} soal
              </option>
            ))}
          </select>
        )}
      </div>

      {paket && (
        <div style={gayaKartu}>
          <div style={{ fontSize: 12, fontWeight: 800, color: '#0f172a', marginBottom: 8 }}>2 · Atur isi cetak</div>
          <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', alignItems: 'center', fontSize: 12 }}>
            <label style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              Jumlah soal maksimum
              <input
                type="number" min="0" value={maks || ''}
                placeholder="semua"
                onChange={(e) => setMaks(Number(e.target.value) || 0)}
                style={{ width: 80, padding: '7px 8px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 12 }}
              />
            </label>
            <label style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              <input type="checkbox" checked={tanpaEsai} onChange={(e) => setTanpaEsai(e.target.checked)} />
              lewati soal esai (dinilai manual, tidak cocok untuk lembar gunting)
            </label>
            <span style={{ color: '#64748b' }}>
              akan tercetak <b>{soal.length}</b> dari {(paket.daftarSoal || []).length} soal
            </span>
          </div>
        </div>
      )}

      {paket && (
        <div style={gayaKartu}>
          <div style={{ fontSize: 12, fontWeight: 800, color: '#0f172a', marginBottom: 8 }}>3 · Cetak</div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button style={gayaTombol('#2563eb')} onClick={() => cetakLewatIframe(htmlPaketSiswa(meta, soal), 'Paket Siswa')}>
              ✂️ PAKET-SISWA (siap gunting)
            </button>
            <button style={gayaTombol('#b91c1c')} onClick={() => cetakLewatIframe(htmlKunciTentor(meta, soal), 'Kunci Tentor')}>
              🔑 KUNCI-TENTOR (jangan untuk siswa)
            </button>
            <button style={gayaTombol('#15803d')} onClick={() => cetakLewatIframe(htmlLembarCatatan(meta, soal), 'Lembar Catatan')}>
              📝 LEMBAR-CATATAN (buku progres)
            </button>
          </div>
          <div style={{ fontSize: 11, color: '#64748b', marginTop: 10, lineHeight: 1.6 }}>
            Aturan kertas bekas (docs/KERANGKA-KONTEN-BUKU.md): cetak SATU muka; bekas jadwal
            atau draft internal boleh, tetapi bekas absensi bernama / kwitansi / berkas keuangan
            TIDAK BOLEH (sisi belakang lembar soal tidak boleh memuat data pribadi).
            Layout sudah hemat toner: tanpa background berwarna, kotak berborder tegas,
            garis potong di tepi tiap butir.
          </div>
        </div>
      )}
    </div>
  );
}
