// src/components/admin/PilihDurasiBulan.jsx
// ============================================================
// DROPDOWN DURASI BERSAMA (21 Okt 2026, keluhan owner: "ada paket lebih
// bisa 2 bulan 4 dll sesuai kadang promonya"): sebelumnya tiap halaman
// punya select durasi terpaku 1/3/6/12(/24) — paket 2 atau 4 bulan tak
// bisa dipilih. Komponen ini menyatukan AddStudent, EditStudent, dan
// Perpanjang Paket (StudentFinance) dengan:
//   • preset umum 1/2/3/4/6/12/24 bulan (opsional + label harga);
//   • opsi "Lainnya (custom)" → input angka bebas 1–60 bulan;
//   • mode `bolehKosong` → placeholder "-- Pilih Durasi --" (menjaga
//     guard anti-salah-default di perpanjangan, fix Okt 2026).
// Logika validasi angka ada di src/utils/durasiPaket.js (murni + teruji).
// ============================================================
import { useState } from 'react';
import { PRESET_DURASI, LABEL_DURASI, DURASI_MAX } from '../../utils/durasiPaket.js';

export default function PilihDurasiBulan({
  value = 0,
  onChange,
  hargaPerBulan = 0,
  bolehKosong = false,
  style = {},
  placeholderKosong = '-- Pilih Durasi --',
}) {
  const angka = Math.floor(Number(value)) || 0;
  const isPreset = PRESET_DURASI.includes(angka);
  // modeCustom = admin sengaja memilih "Lainnya" (nilai belum diisi);
  // custom juga otomatis aktif kalau nilai sekarang di luar preset.
  const [modeCustom, setModeCustom] = useState(!isPreset && angka > 0);
  const customAktif = modeCustom || (!isPreset && angka > 0);

  const labelHarga = (b) => (hargaPerBulan > 0 ? ` - Rp ${(hargaPerBulan * b).toLocaleString()}` : '');

  const gantiPreset = (e) => {
    const v = e.target.value;
    if (v === 'custom') {
      setModeCustom(true); // tunggu admin mengetik jumlah bulan
      return;
    }
    setModeCustom(false);
    onChange(parseInt(v, 10) || 0);
  };

  const gantiAngkaCustom = (e) => {
    // Boleh 0 sementara (input dikosongkan saat mengetik) — guard di
    // halaman pemanggil yang menolak memproses durasi 0.
    const n = Math.floor(Number(e.target.value));
    onChange(Number.isFinite(n) && n >= 0 && n <= DURASI_MAX ? n : 0);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <select
        style={style}
        value={customAktif ? 'custom' : String(angka)}
        onChange={gantiPreset}
      >
        {bolehKosong && angka === 0 && !customAktif && (
          <option value={0}>{placeholderKosong}</option>
        )}
        {PRESET_DURASI.map((b) => (
          <option key={b} value={b}>
            {(LABEL_DURASI[b] || `${b} Bulan`) + labelHarga(b)}
          </option>
        ))}
        <option value="custom">Lainnya… (custom/promo, 1–{DURASI_MAX} bulan)</option>
      </select>
      {customAktif && (
        <>
          <input
            type="number"
            min={1}
            max={DURASI_MAX}
            style={style}
            value={angka > 0 ? angka : ''}
            onChange={gantiAngkaCustom}
            placeholder={`Jumlah bulan (1–${DURASI_MAX})`}
          />
          <p style={{ fontSize: 10.5, color: '#64748b', margin: 0, lineHeight: 1.5 }}>
            Paket promo/custom: ketik jumlah bulan sesuai kesepakatan (mis. 2, 4, 8 bulan).
          </p>
        </>
      )}
    </div>
  );
}
