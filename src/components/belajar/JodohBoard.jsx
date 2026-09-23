import React from 'react';
import { MathText } from '../MathText';
import { T } from '../../pages/student/belajar/tema';

// ============================================================
// PAPAN MENJODOHKAN (Turn 54 — arahan owner)
// Layout SAMPING-SAMPINGAN seperti CBT TKA asli:
//   kiri  = daftar PREMIS (kalimat soal), tiap premis punya kotak
//           pilihan (dropdown) untuk memilih pasangannya;
//   kanan = kolam PILIHAN PASANGAN berhuruf A, B, C, ... lengkap
//           dengan penanda "dipakai premis nomor berapa" sehingga
//           siswa melihat seluruh pilihan di satu sisi.
// Aturan owner Turn 54: SATU PILIHAN BOLEH menjadi jawaban lebih
// dari satu premis (kunci boleh sama) — tidak ada opsi yang
// dikunci/dinonaktifkan karena dipakai premis lain.
// ============================================================

const huruf = (c) => String.fromCharCode(65 + c);

export default function JodohBoard({
  soal, dipilih, onPilih, terkoreksi = false, disabled = false,
}) {
  const premis = Array.isArray(soal?.premis) ? soal.premis : [];
  const opsi = Array.isArray(soal?.opsi) ? soal.opsi : [];
  const kunci = Array.isArray(soal?.jawaban) ? soal.jawaban : [];
  const arr = Array.isArray(dipilih) ? dipilih : [];
  const kunciTerkoreksi = terkoreksi;

  // premis nomor mana saja yang memakai opsi c (boleh lebih dari satu)
  const dipakaiOleh = (c) => premis
    .map((_, r) => r).filter((r) => arr[r] === c).map((r) => r + 1);
  // premis nomor mana saja yang kuncinya opsi c
  const kunciUntuk = (c) => premis
    .map((_, r) => r).filter((r) => kunci[r] === c).map((r) => r + 1);

  return (
    <div>
      <div style={S.papan}>
        {/* ---- KOLOM KIRI: PREMIS + kotak pilihan ---- */}
        <div style={S.kolom}>
          <div style={S.judulKolom}>Premis — pilih pasangannya</div>
          {premis.map((pr, r) => {
            const pil = arr[r];
            const benar = kunciTerkoreksi && pil === kunci[r];
            const salah = kunciTerkoreksi && pil != null && pil !== kunci[r];
            return (
              <div key={r} style={{
                ...S.barisPremis,
                ...(benar ? S.barisBenar : null),
                ...(salah ? S.barisSalah : null),
              }}>
                <div style={S.premisTeks}>
                  <span style={S.nomorPremis}>{r + 1}</span>
                  <span style={{ flex: 1 }}><MathText text={pr} /></span>
                </div>
                <select
                  aria-label={`Pasangan premis ${r + 1}`}
                  disabled={disabled || terkoreksi}
                  value={pil == null ? '' : String(pil)}
                  onChange={(e) => onPilih(r, e.target.value === ''
                    ? null : Number(e.target.value))}
                  style={S.pilih}>
                  <option value="">— pilih pasangan —</option>
                  {opsi.map((op, c) => (
                    <option key={c} value={c}>
                      {huruf(c)}. {String(op).replace(/\$/g, '')}
                    </option>
                  ))}
                </select>
                {salah && (
                  <div style={S.kunciKecil}>
                    Kunci: {huruf(kunci[r])}. <MathText text={opsi[kunci[r]]} />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* ---- KOLOM KANAN: kolam pilihan pasangan ---- */}
        <div style={S.kolom}>
          <div style={S.judulKolom}>Pilihan pasangan</div>
          {opsi.map((op, c) => {
            const dipakai = dipakaiOleh(c);
            const adalahKunci = kunciTerkoreksi && kunciUntuk(c).length > 0;
            return (
              <div key={c} style={{
                ...S.barisOpsi,
                ...(adalahKunci ? S.barisKunci : null),
              }}>
                <span style={S.hurufOpsi}>{huruf(c)}</span>
                <span style={{ flex: 1 }}><MathText text={op} /></span>
                {dipakai.length > 0 && (
                  <span style={S.badgeDipakai}>
                    dipilih {dipakai.join(', ')}
                  </span>
                )}
                {adalahKunci && <span style={S.badgeKunci}>kunci</span>}
              </div>
            );
          })}
        </div>
      </div>
      <div style={S.hint}>
        Satu pilihan boleh menjadi jawaban lebih dari satu premis;
        mulai dari pasangan yang paling pasti (jangkar), sisa dikerjakan terakhir.
      </div>
    </div>
  );
}

const S = {
  papan: {
    display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'flex-start',
  },
  kolom: {
    flex: '1 1 250px', minWidth: 0, display: 'flex', flexDirection: 'column',
    gap: 8, background: '#fff', border: `1px solid ${T.garis}`,
    borderRadius: 12, padding: 10,
  },
  judulKolom: {
    fontSize: 11, fontWeight: 800, letterSpacing: .4, color: T.samar,
    textTransform: 'uppercase', marginBottom: 2,
  },
  barisPremis: {
    border: `1.5px solid ${T.garis}`, borderRadius: 10, padding: 8,
    display: 'flex', flexDirection: 'column', gap: 6, background: '#fff',
  },
  barisBenar: { borderColor: T.hijau, background: T.hijauLatar },
  barisSalah: { borderColor: T.merah, background: T.merahLatar },
  premisTeks: {
    display: 'flex', gap: 8, alignItems: 'flex-start',
    fontSize: 13, fontWeight: 700, color: T.teks, lineHeight: 1.45,
  },
  nomorPremis: {
    flexShrink: 0, width: 20, height: 20, borderRadius: 999,
    background: T.kotakBiru, color: T.biruDalam, fontSize: 11, fontWeight: 800,
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
  },
  pilih: {
    width: '100%', border: `1.5px solid ${T.garis}`, borderRadius: 10,
    padding: '8px 10px', fontSize: 12.5, fontFamily: 'inherit',
    color: T.judul, background: '#fff',
  },
  kunciKecil: { fontSize: 11.5, color: T.hijauTeks, fontWeight: 700 },
  barisOpsi: {
    display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap',
    border: `1px solid ${T.garis}`, borderRadius: 10, padding: '7px 8px',
    fontSize: 12.5, color: T.teks, lineHeight: 1.45, background: '#fff',
  },
  barisKunci: { borderColor: T.hijau, background: T.hijauLatar },
  hurufOpsi: {
    flexShrink: 0, width: 22, height: 22, borderRadius: 8,
    border: `1.5px solid ${T.garis}`, color: T.judul, fontSize: 11.5,
    fontWeight: 800, display: 'inline-flex', alignItems: 'center',
    justifyContent: 'center',
  },
  badgeDipakai: {
    fontSize: 10.5, fontWeight: 700, color: T.biruDalam, background: T.kotakBiru,
    borderRadius: 999, padding: '2px 8px',
  },
  badgeKunci: {
    fontSize: 10.5, fontWeight: 800, color: T.hijauTeks,
    background: T.hijauLatar, border: `1px solid ${T.hijau}`,
    borderRadius: 999, padding: '2px 8px',
  },
  hint: { fontSize: 11, color: T.samar, marginTop: 8 },
};
