// src/pages/admin/tryout/KelolaEventTryOutPage.jsx
// ==============================================================================
// PUSAT PENGELOLAAN EVENT TRY OUT TERJADWAL, PENGATURAN SOAL & TOKEN PANITIA
// (Admin Control Center — Benchmark AmbisPTN)
//
// Fitur:
// 1. Pengelolaan jadwal event rutin 2x sebulan (November 2026 s.d. Maret 2027).
// 2. Manajemen Token Panitia: Ubah token, saklar aktif/nonaktif, dan salin template
//    pengumuman resmi untuk disiarkan saat event berlangsung (token dirahasiakan
//    dari siswa sampai sesi dibuka).
// 3. Pengelolaan Paket Soal: Hubungkan ke Preset 7 Subtes SNPMB (160 soal) atau
//    ke dokumen paket bank soal Firestore (tryout_paket).
// 4. Pratinjau Butir Soal & Subtes resmi.
// ==============================================================================

import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Calendar, Key, ShieldCheck, Copy, Check, Edit3, Lock, Unlock,
  Layers, Search, Filter, BookOpen, ExternalLink, PlusCircle, Sparkles,
  CheckCircle2, Clock, Users, ArrowRight, Eye, RefreshCw
} from 'lucide-react';
import SidebarAdmin from '../../../components/SidebarAdmin';
import {
  DAFTAR_EVENT_TRYOUT_SMA,
  ambilOverrideEventMap,
  simpanOverrideEvent,
  terapkanOverrideEvent,
} from '../../../data/eventTryoutTerjadwalData';
import { db } from '../../../firebase';
import { collection, getDocs } from 'firebase/firestore';

const DAFTAR_BULAN = [
  { index: 10, tahun: 2026, label: 'November 2026' },
  { index: 11, tahun: 2026, label: 'Desember 2026' },
  { index: 0, tahun: 2027, label: 'Januari 2027' },
  { index: 1, tahun: 2027, label: 'Februari 2027' },
  { index: 2, tahun: 2027, label: 'Maret 2027' },
];

export default function KelolaEventTryOutPage() {
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [bulanTerpilih, setBulanTerpilih] = useState(DAFTAR_BULAN[0]);
  const [kategoriFilter, setKategoriFilter] = useState('semua');
  const [cariTeks, setCariTeks] = useState('');

  // State Override Events
  const [overrides, setOverrides] = useState(() => ambilOverrideEventMap());

  // Modal Edit Token
  const [modalEditToken, setModalEditToken] = useState(null); // { event, tokenBaru }
  const [tokenInput, setTokenInput] = useState('');

  // Modal Pengelolaan Soal
  const [modalKelolaSoal, setModalKelolaSoal] = useState(null); // event
  const [paketBankSoal, setPaketBankSoal] = useState([]);
  const [pilihanSumberSoal, setPilihanSumberSoal] = useState('preset_utbk_7_subtes');
  const [terpilihPaketId, setTerpilihPaketId] = useState('');

  // Modal Pratinjau Butir Soal
  const [modalPratinjau, setModalPratinjau] = useState(null);

  // Status feedback salin pengumuman
  const [tersalinEventId, setTersalinEventId] = useState(null);
  const [pesanNotif, setPesanNotif] = useState({ tipe: null, teks: '' });

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // Muat daftar paket bank soal dari Firestore
  useEffect(() => {
    async function muatPaket() {
      try {
        const snap = await getDocs(collection(db, 'tryout_paket'));
        const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        setPaketBankSoal(list);
      } catch (err) {
        console.warn('Gagal muat tryout_paket:', err);
      }
    }
    muatPaket();
  }, []);

  // Menggabungkan data event default dengan override admin
  const daftarEventAktif = useMemo(() => {
    const prefix = `${bulanTerpilih.tahun}-${String(bulanTerpilih.index + 1).padStart(2, '0')}`;
    return DAFTAR_EVENT_TRYOUT_SMA
      .filter((ev) => ev.tanggalIso.startsWith(prefix))
      .map((ev) => {
        const ov = overrides[ev.id];
        return ov ? { ...ev, ...ov } : ev;
      })
      .filter((ev) => {
        if (kategoriFilter !== 'semua' && ev.badgeKategori !== kategoriFilter) return false;
        if (cariTeks.trim()) {
          const q = cariTeks.toLowerCase();
          return ev.judul.toLowerCase().includes(q) || ev.token.toLowerCase().includes(q) || ev.tanggalIso.includes(q);
        }
        return true;
      });
  }, [bulanTerpilih, overrides, kategoriFilter, cariTeks]);

  // Handler simpan token baru
  const handleSimpanTokenBaru = () => {
    if (!modalEditToken?.event) return;
    const ev = modalEditToken.event;
    const tokenBersih = (tokenInput || '').trim().toUpperCase();
    if (!tokenBersih) {
      alert('Kode token tidak boleh kosong!');
      return;
    }

    simpanOverrideEvent(ev.id, { token: tokenBersih });
    setOverrides(ambilOverrideEventMap());
    setModalEditToken(null);
    setPesanNotif({
      tipe: 'ok',
      teks: `✅ Token event "${ev.judul}" berhasil diubah menjadi: ${tokenBersih}`,
    });
    setTimeout(() => setPesanNotif({ tipe: null, teks: '' }), 4000);
  };

  // Handler toggle aktif/nonaktif token
  const handleToggleAktifToken = (ev) => {
    const statusBaru = !(ev.tokenAktif !== undefined ? ev.tokenAktif : true);
    simpanOverrideEvent(ev.id, { tokenAktif: statusBaru });
    setOverrides(ambilOverrideEventMap());
    setPesanNotif({
      tipe: 'ok',
      teks: statusBaru
        ? `🔓 Token untuk "${ev.judul}" telah DIAKTIFKAN. Siswa dapat memasukkan token di ruang tunggu CBT.`
        : `🔒 Token untuk "${ev.judul}" telah DINONAKTIFKAN / DIKUNCI.`,
    });
    setTimeout(() => setPesanNotif({ tipe: null, teks: '' }), 4000);
  };

  // Handler salin pesan pengumuman resmi ke clipboard
  const handleSalinPengumuman = (ev) => {
    const token = ev.token;
    const teks = `📢 *PENGUMUMAN RESMI TOKEN TRY OUT BIMBEL GEMILANG* 🎓\n\n` +
      `📌 *Event*: ${ev.judul}\n` +
      `🗓️ *Jadwal*: ${ev.hariFormatted}\n` +
      `⏱️ *Waktu Ujian*: ${ev.jamMulai} - ${ev.jamSelesai}\n` +
      `📑 *Format Soal*: ${ev.totalSoal} Soal 7 Subtes Resmi UTBK-SNBT (195 Menit)\n\n` +
      `🔑 *KODE TOKEN UJIAN*: \`${token}\`\n\n` +
      `*Langkah Memulai Ujian*:\n` +
      `1. Buka https://bimbel-gemilang-app.vercel.app/siswa/tryout\n` +
      `2. Klik tombol "Masuk Ruang Tunggu CBT Profesional"\n` +
      `3. Masukkan kode token resmi di atas untuk membuka lembar soal.\n\n` +
      `*Peringatan*: Ujian dilengkapi sistem kamera pengawas dan deteksi anti-curang. Selamat berjuang meraih kampus impian! 🚀`;

    if (navigator.clipboard) {
      navigator.clipboard.writeText(teks).then(() => {
        setTersalinEventId(ev.id);
        setTimeout(() => setTersalinEventId(null), 3000);
      });
    }
  };

  // Handler simpan pengelolaan paket soal event
  const handleSimpanPaketSoal = () => {
    if (!modalKelolaSoal) return;
    const ev = modalKelolaSoal;

    let payload = {};
    if (pilihanSumberSoal === 'paket_bank') {
      const paketDipilih = paketBankSoal.find((p) => p.id === terpilihPaketId);
      payload = {
        sumberSoal: 'paket_bank',
        paketBimbelId: terpilihPaketId,
        paketBimbelJudul: paketDipilih?.judul || 'Paket Bank Soal',
        totalSoal: paketDipilih?.totalSoal || paketDipilih?.daftarSoal?.length || 160,
      };
    } else {
      payload = {
        sumberSoal: 'preset_utbk_7_subtes',
        paketBimbelId: null,
        paketBimbelJudul: null,
        totalSoal: 160,
      };
    }

    simpanOverrideEvent(ev.id, payload);
    setOverrides(ambilOverrideEventMap());
    setModalKelolaSoal(null);
    setPesanNotif({
      tipe: 'ok',
      teks: `✅ Konfigurasi paket soal untuk "${ev.judul}" berhasil diperbarui!`,
    });
    setTimeout(() => setPesanNotif({ tipe: null, teks: '' }), 4000);
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f8fafc' }}>
      <SidebarAdmin />

      <main style={{
        marginLeft: isMobile ? '0' : '216px',
        padding: isMobile ? '12px' : '24px',
        width: isMobile ? '100%' : 'calc(100% - 216px)',
        boxSizing: 'border-box',
        transition: 'all 0.3s ease',
      }}>
        <div style={{ maxWidth: 1080, margin: '0 auto' }}>
          {/* HEADER NAVIGASI ADMIN */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, marginBottom: 16 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 24 }}>🎯</span>
                <h1 style={{ margin: 0, fontSize: 20, fontWeight: 900, color: '#0f172a' }}>
                  Pengelolaan Event TryOut Terjadwal & Token
                </h1>
              </div>
              <p style={{ margin: '4px 0 0', fontSize: 12.5, color: '#64748b' }}>
                Kendali jadwal tryout resmi 2x sebulan, rahasia token ujian panitia, dan konfigurasi kesiapan paket bank soal.
              </p>
            </div>

            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <Link
                to="/admin/bank-soal/terbitkan-tryout"
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  padding: '8px 14px', borderRadius: 10, background: '#0e7490',
                  color: 'white', textDecoration: 'none', fontSize: 12, fontWeight: 800,
                }}
              >
                <PlusCircle size={15} />
                <span>Terbitkan TryOut Baru</span>
              </Link>
              <Link
                to="/admin/bank-soal/import"
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  padding: '8px 14px', borderRadius: 10, background: '#4338ca',
                  color: 'white', textDecoration: 'none', fontSize: 12, fontWeight: 800,
                }}
              >
                <Layers size={15} />
                <span>Import Bank Soal (AI)</span>
              </Link>
            </div>
          </div>

          {/* BANNER NOTIFIKASI */}
          {pesanNotif.teks && (
            <div style={{
              margin: '10px 0', padding: '10px 16px', borderRadius: 10, fontSize: 12.5, fontWeight: 700,
              background: pesanNotif.tipe === 'ok' ? '#f0fdf4' : '#fef2f2',
              color: pesanNotif.tipe === 'ok' ? '#15803d' : '#b91c1c',
              border: '1px solid ' + (pesanNotif.tipe === 'ok' ? '#bbf7d0' : '#fecaca'),
            }}>
              {pesanNotif.teks}
            </div>
          )}

          {/* KOTAK PANDUAN KERAHASIAAN TOKEN */}
          <div style={{ background: '#ecfdf5', border: '1px solid #a7f3d0', borderRadius: 12, padding: 14, marginBottom: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 800, color: '#065f46', display: 'flex', alignItems: 'center', gap: 6 }}>
              🔒 Kebijakan Keamanan Token Ujian Panitia
            </div>
            <div style={{ fontSize: 12, color: '#047857', marginTop: 4, lineHeight: 1.5 }}>
              Kode token panitia <b>disembunyikan dari halaman siswa</b> dan hanya berstatus <i>&quot;Diumumkan panitia saat event&quot;</i>.
              Gunakan tombol <b>📋 Salin Format Pengumuman</b> untuk menyalin teks pengumuman resmi ke WhatsApp / Zoom kelas saat jam ujian dibuka.
            </div>
          </div>

          {/* PILIHAN BULAN & FILTER KATEGORI */}
          <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: 14, padding: 16, marginBottom: 16 }}>
            <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 6, marginBottom: 12 }}>
              {DAFTAR_BULAN.map((bln) => {
                const isActive = bln.index === bulanTerpilih.index && bln.tahun === bulanTerpilih.tahun;
                return (
                  <button
                    key={bln.label}
                    type="button"
                    onClick={() => setBulanTerpilih(bln)}
                    style={{
                      padding: '8px 16px', borderRadius: 10, fontSize: 12, fontWeight: 800, cursor: 'pointer',
                      border: isActive ? '1.5px solid #0d9488' : '1px solid #cbd5e1',
                      background: isActive ? '#f0fdfa' : 'white',
                      color: isActive ? '#0d9488' : '#475569',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    📅 {bln.label}
                  </button>
                );
              })}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {['semua', 'Fundamental', 'Ambis UTBK', 'Siap UTBK', 'Berjuang UTBK'].map((kat) => (
                  <button
                    key={kat}
                    type="button"
                    onClick={() => setKategoriFilter(kat)}
                    style={{
                      padding: '5px 12px', borderRadius: 999, fontSize: 11, fontWeight: 700, cursor: 'pointer',
                      border: kategoriFilter === kat ? '1.5px solid #2563eb' : '1px solid #e2e8f0',
                      background: kategoriFilter === kat ? '#eff6ff' : '#f8fafc',
                      color: kategoriFilter === kat ? '#1d4ed8' : '#64748b',
                    }}
                  >
                    {kat === 'semua' ? 'Semua Seri' : kat}
                  </button>
                ))}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: 8, padding: '4px 10px' }}>
                <Search size={14} color="#64748b" />
                <input
                  type="text"
                  placeholder="Cari event atau token..."
                  value={cariTeks}
                  onChange={(e) => setCariTeks(e.target.value)}
                  style={{ border: 'none', background: 'transparent', outline: 'none', fontSize: 12, width: 160 }}
                />
              </div>
            </div>
          </div>

          {/* DAFTAR KARTU EVENT ADMIN */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {daftarEventAktif.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 40, background: 'white', borderRadius: 14, border: '1px solid #e2e8f0', color: '#94a3b8' }}>
                Tidak ada event tryout yang cocok dengan filter.
              </div>
            ) : (
              daftarEventAktif.map((ev) => {
                const isAktif = ev.tokenAktif !== undefined ? ev.tokenAktif : true;
                const isTersalin = tersalinEventId === ev.id;

                return (
                  <div
                    key={ev.id}
                    style={{
                      background: 'white',
                      border: '1px solid #e2e8f0',
                      borderRadius: 14,
                      padding: 18,
                      boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 10 }}>
                      <div style={{ flex: 1, minWidth: 260 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                          <span style={{
                            padding: '3px 10px', borderRadius: 999, fontSize: 10.5, fontWeight: 800,
                            background: ev.badgeKategori === 'Fundamental' ? '#f0fdfa' : (ev.badgeKategori === 'Ambis UTBK' ? '#eff6ff' : '#faf5ff'),
                            color: ev.badgeKategori === 'Fundamental' ? '#0d9488' : (ev.badgeKategori === 'Ambis UTBK' ? '#2563eb' : '#7e22ce'),
                            border: '1px solid #e2e8f0',
                          }}>
                            {ev.badgeKategori}
                          </span>
                          <span style={{ fontSize: 11.5, color: '#64748b', fontWeight: 600 }}>
                            🗓️ {ev.hariFormatted} ({ev.jamMulai} - {ev.jamSelesai})
                          </span>
                        </div>

                        <h3 style={{ margin: '4px 0 2px', fontSize: 15, fontWeight: 800, color: '#0f172a' }}>
                          {ev.judul}
                        </h3>
                        <p style={{ margin: 0, fontSize: 12, color: '#475569' }}>
                          {ev.subjudul}
                        </p>

                        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 10 }}>
                          <span style={{ fontSize: 11, background: '#f1f5f9', color: '#475569', padding: '3px 8px', borderRadius: 6, fontWeight: 700 }}>
                            ⏱️ {ev.durasiMenit} Menit
                          </span>
                          <span style={{ fontSize: 11, background: '#f1f5f9', color: '#475569', padding: '3px 8px', borderRadius: 6, fontWeight: 700 }}>
                            📑 {ev.totalSoal} Soal 7 Subtes
                          </span>
                          <span style={{ fontSize: 11, background: '#f1f5f9', color: '#475569', padding: '3px 8px', borderRadius: 6, fontWeight: 700 }}>
                            📊 IRT Skala 1000
                          </span>
                          {ev.sumberSoal === 'paket_bank' && ev.paketBimbelJudul && (
                            <span style={{ fontSize: 11, background: '#fef3c7', color: '#b45309', padding: '3px 8px', borderRadius: 6, fontWeight: 700 }}>
                              📦 Bank Soal: {ev.paketBimbelJudul}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* KOTAK KONTROL TOKEN & AKSI PANITIA */}
                      <div style={{
                        background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 12,
                        padding: 12, minWidth: 260, display: 'flex', flexDirection: 'column', gap: 8,
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: 11, color: '#64748b', fontWeight: 700 }}>TOKEN PANITIA:</span>
                          <button
                            type="button"
                            onClick={() => handleToggleAktifToken(ev)}
                            style={{
                              fontSize: 10.5, fontWeight: 800, padding: '2px 8px', borderRadius: 999, cursor: 'pointer',
                              border: isAktif ? '1px solid #86efac' : '1px solid #fca5a5',
                              background: isAktif ? '#dcfce7' : '#fee2e2',
                              color: isAktif ? '#15803d' : '#b91c1c',
                              display: 'inline-flex', alignItems: 'center', gap: 4,
                            }}
                          >
                            {isAktif ? <Unlock size={10} /> : <Lock size={10} />}
                            <span>{isAktif ? 'Token Aktif' : 'Token Dikunci'}</span>
                          </button>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                          <div style={{
                            fontSize: 16, fontWeight: 900, fontFamily: 'monospace', letterSpacing: 1.5,
                            color: isAktif ? '#0f172a' : '#94a3b8', background: 'white', padding: '6px 12px',
                            borderRadius: 8, border: '1px solid #cbd5e1', flex: 1, textAlign: 'center',
                          }}>
                            {ev.token}
                          </div>

                          <button
                            type="button"
                            onClick={() => {
                              setModalEditToken({ event: ev });
                              setTokenInput(ev.token);
                            }}
                            title="Ganti Kode Token"
                            style={{
                              padding: '6px 10px', borderRadius: 8, border: '1px solid #cbd5e1',
                              background: 'white', color: '#0284c7', cursor: 'pointer', fontSize: 11, fontWeight: 700,
                              display: 'inline-flex', alignItems: 'center', gap: 4,
                            }}
                          >
                            <Edit3 size={12} />
                            <span>Ubah</span>
                          </button>
                        </div>

                        <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
                          <button
                            type="button"
                            onClick={() => handleSalinPengumuman(ev)}
                            style={{
                              flex: 1, padding: '6px 10px', borderRadius: 8, border: 'none',
                              background: isTersalin ? '#15803d' : '#0284c7', color: 'white',
                              fontSize: 11, fontWeight: 800, cursor: 'pointer',
                              display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 5,
                            }}
                          >
                            {isTersalin ? <Check size={12} /> : <Copy size={12} />}
                            <span>{isTersalin ? 'Format Tersalin!' : 'Salin Pengumuman'}</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setModalKelolaSoal(ev);
                              setPilihanSumberSoal(ev.sumberSoal || 'preset_utbk_7_subtes');
                              setTerpilihPaketId(ev.paketBimbelId || '');
                            }}
                            style={{
                              padding: '6px 10px', borderRadius: 8, border: '1px solid #cbd5e1',
                              background: 'white', color: '#475569', fontSize: 11, fontWeight: 700,
                              cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4,
                            }}
                          >
                            <Layers size={12} />
                            <span>Paket Soal</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => setModalPratinjau(ev)}
                            title="Pratinjau 7 Subtes"
                            style={{
                              padding: '6px 8px', borderRadius: 8, border: '1px solid #cbd5e1',
                              background: 'white', color: '#475569', fontSize: 11, cursor: 'pointer',
                            }}
                          >
                            <Eye size={13} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </main>

      {/* MODAL GANTI TOKEN */}
      {modalEditToken && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(3px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 9999, padding: 16,
        }}>
          <div style={{ background: 'white', borderRadius: 16, maxWidth: 440, width: '100%', padding: 22, boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <Key size={18} color="#0284c7" />
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: '#0f172a' }}>
                Ubah Kode Token Panitia
              </h3>
            </div>
            <p style={{ margin: '0 0 14px', fontSize: 12, color: '#64748b' }}>
              Ubah token untuk: <strong>{modalEditToken.event.judul}</strong>
            </p>

            <label style={{ display: 'block', fontSize: 11.5, fontWeight: 700, color: '#334155', marginBottom: 4 }}>
              Kode Token Baru (Huruf Kapital & Angka):
            </label>
            <input
              type="text"
              value={tokenInput}
              onChange={(e) => setTokenInput(e.target.value.toUpperCase())}
              placeholder="MISAL: BERJUANG-3 atau GEMILANG2026"
              style={{
                width: '100%', padding: '10px 12px', borderRadius: 8, border: '2px solid #0284c7',
                fontSize: 16, fontWeight: 800, letterSpacing: 1.5, fontFamily: 'monospace',
                boxSizing: 'border-box', outline: 'none', marginBottom: 14,
              }}
            />

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <button
                type="button"
                onClick={() => setModalEditToken(null)}
                style={{ padding: '8px 14px', borderRadius: 8, border: '1px solid #cbd5e1', background: 'white', color: '#64748b', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleSimpanTokenBaru}
                style={{ padding: '8px 16px', borderRadius: 8, border: 'none', background: '#0284c7', color: 'white', fontSize: 12, fontWeight: 800, cursor: 'pointer' }}
              >
                Simpan Token Baru
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL KELOLA PAKET SOAL */}
      {modalKelolaSoal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(3px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 9999, padding: 16,
        }}>
          <div style={{ background: 'white', borderRadius: 16, maxWidth: 520, width: '100%', padding: 22, boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <Layers size={18} color="#4338ca" />
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: '#0f172a' }}>
                Pengaturan Paket Soal Event
              </h3>
            </div>
            <p style={{ margin: '0 0 14px', fontSize: 12, color: '#64748b' }}>
              Event: <strong>{modalKelolaSoal.judul}</strong>
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
              <label style={{
                display: 'flex', alignItems: 'flex-start', gap: 10, padding: 12, borderRadius: 10,
                border: pilihanSumberSoal === 'preset_utbk_7_subtes' ? '2px solid #4338ca' : '1px solid #cbd5e1',
                background: pilihanSumberSoal === 'preset_utbk_7_subtes' ? '#eef2ff' : 'white', cursor: 'pointer',
              }}>
                <input
                  type="radio"
                  name="sumberSoal"
                  value="preset_utbk_7_subtes"
                  checked={pilihanSumberSoal === 'preset_utbk_7_subtes'}
                  onChange={() => setPilihanSumberSoal('preset_utbk_7_subtes')}
                  style={{ marginTop: 2 }}
                />
                <div>
                  <div style={{ fontSize: 13, fontWeight: 800, color: '#1e1b4b' }}>
                    Preset Standar UTBK 7 Subtes Resmi (160 Butir Soal SNPMB)
                  </div>
                  <div style={{ fontSize: 11.5, color: '#64748b', marginTop: 2 }}>
                    Paket lengkap pembagian waktu 195 menit: PU (30), PPU (20), PBM (20), PK (20), LBIN (30), LBING (20), PM (20).
                  </div>
                </div>
              </label>

              <label style={{
                display: 'flex', alignItems: 'flex-start', gap: 10, padding: 12, borderRadius: 10,
                border: pilihanSumberSoal === 'paket_bank' ? '2px solid #4338ca' : '1px solid #cbd5e1',
                background: pilihanSumberSoal === 'paket_bank' ? '#eef2ff' : 'white', cursor: 'pointer',
              }}>
                <input
                  type="radio"
                  name="sumberSoal"
                  value="paket_bank"
                  checked={pilihanSumberSoal === 'paket_bank'}
                  onChange={() => setPilihanSumberSoal('paket_bank')}
                  style={{ marginTop: 2 }}
                />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 800, color: '#1e1b4b' }}>
                    Pilih dari Paket Bank Soal Bimbel Gemilang
                  </div>
                  <div style={{ fontSize: 11.5, color: '#64748b', marginTop: 2 }}>
                    Hubungkan ke paket yang telah diterbitkan atau diupload di Bank Soal Gemilang.
                  </div>

                  {pilihanSumberSoal === 'paket_bank' && (
                    <div style={{ marginTop: 10 }}>
                      <select
                        value={terpilihPaketId}
                        onChange={(e) => setTerpilihPaketId(e.target.value)}
                        style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 12, outline: 'none' }}
                      >
                        <option value="">-- Pilih Paket Bank Soal --</option>
                        {paketBankSoal.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.judul} ({p.totalSoal || p.daftarSoal?.length || 0} soal • {p.targetKelas || 'SMA'})
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              </label>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Link
                to="/admin/bank-soal/terbitkan-tryout"
                style={{ fontSize: 11.5, color: '#4338ca', fontWeight: 700, textDecoration: 'none' }}
              >
                + Buat / Upload Paket Baru di Bank Soal →
              </Link>

              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  type="button"
                  onClick={() => setModalKelolaSoal(null)}
                  style={{ padding: '8px 14px', borderRadius: 8, border: '1px solid #cbd5e1', background: 'white', color: '#64748b', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleSimpanPaketSoal}
                  style={{ padding: '8px 16px', borderRadius: 8, border: 'none', background: '#4338ca', color: 'white', fontSize: 12, fontWeight: 800, cursor: 'pointer' }}
                >
                  Simpan Pengaturan
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL PRATINJAU 7 SUBTES */}
      {modalPratinjau && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(3px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 9999, padding: 16,
        }}>
          <div style={{ background: 'white', borderRadius: 16, maxWidth: 580, width: '100%', maxHeight: '85vh', overflowY: 'auto', padding: 22, boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <BookOpen size={18} color="#0d9488" />
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: '#0f172a' }}>
                Pratinjau Struktur 7 Subtes Resmi UTBK-SNBT
              </h3>
            </div>
            <p style={{ margin: '0 0 14px', fontSize: 12, color: '#64748b' }}>
              Alokasi waktu & jumlah butir soal untuk event: <strong>{modalPratinjau.judul}</strong>
            </p>

            <div style={{ border: '1px solid #e2e8f0', borderRadius: 10, overflow: 'hidden', marginBottom: 16 }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead>
                  <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569', textAlign: 'left' }}>
                    <th style={{ padding: '8px 12px' }}>Subtes Resmi</th>
                    <th style={{ padding: '8px 12px', textAlign: 'center' }}>Jumlah Butir</th>
                    <th style={{ padding: '8px 12px', textAlign: 'center' }}>Alokasi Waktu</th>
                  </tr>
                </thead>
                <tbody>
                  {(modalPratinjau.daftarSubtes || []).map((sub, sIdx) => (
                    <tr key={sIdx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '8px 12px', fontWeight: 600, color: '#0f172a' }}>
                        {sIdx + 1}. {sub.nama}
                      </td>
                      <td style={{ padding: '8px 12px', textAlign: 'center', color: '#0284c7', fontWeight: 700 }}>
                        {sub.jumlahSoal} Soal
                      </td>
                      <td style={{ padding: '8px 12px', textAlign: 'center', color: '#15803d', fontWeight: 700 }}>
                        {sub.durasiMenit} Menit
                      </td>
                    </tr>
                  ))}
                  <tr style={{ background: '#f0fdfa', fontWeight: 800, color: '#0f766e' }}>
                    <td style={{ padding: '8px 12px' }}>TOTAL KESELURUHAN</td>
                    <td style={{ padding: '8px 12px', textAlign: 'center' }}>160 Soal</td>
                    <td style={{ padding: '8px 12px', textAlign: 'center' }}>195 Menit</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={() => setModalPratinjau(null)}
                style={{ padding: '8px 16px', borderRadius: 8, border: 'none', background: '#0d9488', color: 'white', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
              >
                Tutup Pratinjau
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
