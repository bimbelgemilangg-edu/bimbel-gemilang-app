// src/components/BannerTargetSiswa.jsx
// ============================================================
// Tampilan target kampus di sisi siswa: chip kecil DI DEPAN nama & NIM, dan
// kartu rincian di bawah header dashboard.
//
// 🔥 SISWA YANG TIDAK TERDAFTAR TIDAK TERSENTUH. Seluruh komponen ini
// me-render NULL kecuali SEMUA syarat terpenuhi (fitur aktif untuk siswa ini,
// jenjang SMA, kelas 12, dokumen target ada). Tidak ada kartu kosong, tidak
// ada chip kosong, tidak ada "segera hadir" -- dashboard SD/SMP/kelas 10-11
// harus identik bit-per-bit dengan sebelum fitur ini ada. Aturan lengkapnya
// di utils/bannerTargetSiswa.js (teruji).
//
// Pembacaan data sengaja kecil & di-cache per sesi: 1 dokumen target + 1-2
// dokumen prodi + 1 dokumen sakelar fitur. BUKAN penyapuan koleksi -- proyek
// ini pernah kena 429 RESOURCE_EXHAUSTED karena pola itu (kepala
// utils/keputusanMuat.js).
// ============================================================
import React, { useEffect, useState } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { fiturAktifUntuk } from '../services/sakelarFiturService';
import { susunPerbandingan } from '../utils/targetKampus';
import { layakTampilTarget, susunBannerTarget, teksChipTarget } from '../utils/bannerTargetSiswa';
import { ZONA } from '../utils/zonaKesiapan';

const cacheData = new Map();

/**
 * Muat dokumen target + prodi pilihannya. Di-cache supaya chip dan kartu di
 * halaman yang sama tidak menembak Firestore dua kali.
 */
export function muatDataTargetKampus(studentId) {
  if (!studentId) return Promise.resolve(null);
  if (cacheData.has(studentId)) return cacheData.get(studentId);
  const janji = (async () => {
    try {
      const snapTarget = await getDoc(doc(db, 'target_kampus_siswa', studentId));
      if (!snapTarget.exists()) return null;
      const target = { id: snapTarget.id, ...snapTarget.data() };
      const prodi = {};
      for (const p of target.pilihan || []) {
        if (!p?.idPtn || !p?.idProdi) continue;
        const snapProdi = await getDoc(doc(db, 'ptn', p.idPtn, 'prodi', p.idProdi));
        if (snapProdi.exists()) prodi[`${p.idPtn}|${p.idProdi}`] = { id: snapProdi.id, ...snapProdi.data() };
      }
      return { target, prodi };
    } catch (e) {
      console.warn('[BannerTargetSiswa] gagal memuat target:', e?.message || e);
      return null;
    }
  })();
  cacheData.set(studentId, janji);
  return janji;
}

/** Buang cache -- dipanggil setelah admin menyimpan target baru. */
export function segarkanDataTargetKampus(studentId) {
  if (studentId) cacheData.delete(studentId);
  else cacheData.clear();
}

const WARNA_ZONA = {
  [ZONA.HIJAU_AMAN]: '#16a34a',
  [ZONA.HIJAU_KOMPETITIF]: '#65a30d',
  [ZONA.KUNING]: '#d97706',
  [ZONA.MERAH]: '#dc2626',
  [ZONA.TANPA_DATA]: '#64748b',
};

// Diekspor supaya SidebarSiswa bisa menyembunyikan menu Target Kampusku
// untuk siswa yang tidak terdaftar -- menu disembunyikan DAN rutenya tetap
// menjaga sendiri (halaman menampilkan penjelasan, bukan kartu kosong).
export function useDataTargetKampus(studentId, profil) {
  const [keadaan, setKeadaan] = useState({ status: 'muat' });
  useEffect(() => {
    let hidup = true;
    (async () => {
      if (!studentId) { setKeadaan({ status: 'nol' }); return; }
      const [data, fitur] = await Promise.all([
        muatDataTargetKampus(studentId),
        fiturAktifUntuk('targetKampus', {
          studentId,
          kelasSekolah: profil?.kelasSekolah || profil?.kelas || '',
        }),
      ]);
      if (!hidup) return;
      if (!data) { setKeadaan({ status: 'nol' }); return; }
      const cek = layakTampilTarget({
        fiturAktif: fitur.aktif,
        jenjang: profil?.jenjang,
        kelasSekolah: profil?.kelasSekolah || profil?.kelas,
        target: data.target,
      });
      if (!cek.layak) { setKeadaan({ status: 'nol', alasan: cek.alasan }); return; }
      const perbandingan = susunPerbandingan(
        data.target, data.prodi, data.target?.skorTerakhirUtbk?.nilai ?? null,
      );
      setKeadaan({ status: 'siap', target: data.target, perbandingan });
    })();
    return () => { hidup = false; };
  }, [studentId, profil?.kelasSekolah, profil?.kelas, profil?.jenjang]);
  return keadaan;
}

/** Chip kecil untuk dipasang DI DEPAN nama & NIM siswa. */
export function ChipTargetSiswa({ studentId, profil }) {
  const keadaan = useDataTargetKampus(studentId, profil);
  if (keadaan.status !== 'siap') return null;
  const chip = teksChipTarget(keadaan.target, keadaan.perbandingan);
  if (!chip) return null;
  const zona = keadaan.perbandingan.pilihan?.[0]?.zona;
  const warna = WARNA_ZONA[zona?.id] || '#7c3aed';
  return (
    <span
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 4,
        background: '#f5f3ff', color: '#5b21b6', border: `1px solid ${warna}55`,
        borderRadius: 20, padding: '2px 10px', fontSize: 10.5, fontWeight: 800,
        marginRight: 8, verticalAlign: 'middle',
      }}
    >
      {chip}
    </span>
  );
}

/** Kartu rincian target: dua pilihan, zona, selisih, dan pengingatnya. */
export function KartuTargetSiswa({ studentId, profil }) {
  const keadaan = useDataTargetKampus(studentId, profil);
  if (keadaan.status !== 'siap') return null;
  const banner = susunBannerTarget(keadaan.target, keadaan.perbandingan, {
    keteranganSkor: keadaan.target?.skorTerakhirUtbk?.keterangan || null,
  });
  if (!banner) return null;

  return (
    <div
      style={{
        background: 'linear-gradient(135deg,#f5f3ff,#eef2ff)', border: '1px solid #ddd6fe',
        borderRadius: 16, padding: 16, marginTop: 14,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap', marginBottom: 10 }}>
        <b style={{ fontSize: 13.5, color: '#4c1d95' }}>{banner.chip}</b>
        <span style={{ fontSize: 11, color: '#7c77a8' }}>{banner.judul}</span>
      </div>

      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        {banner.pilihan.map((p) => (
          <div
            key={p.urutan}
            style={{
              flex: '1 1 240px', background: '#fff', borderRadius: 12,
              border: '1px solid #e2e8f0', padding: 12,
            }}
          >
            <div style={{ fontSize: 10.5, fontWeight: 800, color: '#94a3b8' }}>
              PILIHAN {p.urutan}{p.labelPribadi ? ` · ${p.labelPribadi.toUpperCase()}` : ''}
            </div>
            <div style={{ fontSize: 13.5, fontWeight: 800, color: '#1e293b', marginTop: 3 }}>
              {p.tersedia ? `${p.namaProdi}` : 'Belum terdata di database'}
            </div>
            <div style={{ fontSize: 12, color: '#64748b' }}>
              {p.tersedia ? `${p.namaPtn}${p.kampus ? ` · ${p.kampus}` : ''}` : ''}
            </div>
            {p.tersedia && (
              <div style={{ fontSize: 11.5, color: '#475569', marginTop: 8, lineHeight: 1.7 }}>
                <div>
                  Skor acuan:{' '}
                  <b>min {p.skorReferensi?.minimum?.nilai ?? '—'}</b>
                  {' · rata-rata '}{p.skorReferensi?.rataRata?.nilai ?? '—'}
                  {' · maks '}{p.skorReferensi?.maksimum?.nilai ?? '—'}
                  {' '}<i>(estimasi, bukan angka resmi)</i>
                </div>
                <div>Daya tampung {p.dayaTampung?.nilai ?? '—'} · peminat {p.peminat?.nilai ?? '—'}</div>
                {p.syaratKhusus && p.syaratKhusus !== 'Tidak Ada Syarat Khusus' && (
                  <div style={{ color: '#b45309' }}>⚠ {p.syaratKhusus}</div>
                )}
                {p.zona?.id !== ZONA.TANPA_DATA && p.gapMinimum !== null && (
                  <div style={{ color: WARNA_ZONA[p.zona.id], fontWeight: 800, marginTop: 4 }}>
                    {p.zona.nama} · selisih {p.gapMinimum >= 0 ? '+' : ''}{p.gapMinimum}
                  </div>
                )}
              </div>
            )}
            {!p.tersedia && <div style={{ fontSize: 11.5, color: '#64748b', marginTop: 6 }}>{p.alasan}</div>}
          </div>
        ))}
      </div>

      <ul style={{ margin: '10px 0 0', paddingLeft: 18 }}>
        {banner.baris.map((b, i) => (
          <li key={i} style={{ fontSize: 12, color: '#475569', lineHeight: 1.7 }}>{b}</li>
        ))}
      </ul>
      {banner.keteranganSkor && (
        <div style={{ fontSize: 11, color: '#7c77a8', marginTop: 6 }}>Skor: {banner.keteranganSkor}</div>
      )}
      <div style={{ fontSize: 10.5, color: '#8b85b8', marginTop: 8, lineHeight: 1.6 }}>
        {banner.disclaimer}
      </div>
    </div>
  );
}

export default { ChipTargetSiswa, KartuTargetSiswa, muatDataTargetKampus, segarkanDataTargetKampus, useDataTargetKampus };
