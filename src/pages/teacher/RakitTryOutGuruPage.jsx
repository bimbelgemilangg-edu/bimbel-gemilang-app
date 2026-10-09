// src/pages/teacher/RakitTryOutGuruPage.jsx
// ============================================================
// RAKIT TRY OUT (Tentor) — Fase 2 cetak biru bank soal
// ============================================================
// Keputusan owner 2026-10-08: tentor boleh membuat try out, TETAPI perlu
// approval admin. Permintaan tampilannya: "tidak membingungkan,
// pengelompokan jelas, ada filter juga".
//
// Maka halaman ini disusun sebagai DUA KOLOM dengan tugas yang tidak
// bercampur — kebingungan biasanya lahir dari satu layar yang meminta
// orang memilih soal sekaligus mengisi pengaturan paket:
//
//   KIRI  = MEMILIH.  Filter (jenjang -> mapel -> materi -> kelas -> tipe
//           -> kesulitan -> kata kunci) lalu daftar BERKELOMPOK per materi.
//           Tiap kelompok punya judul, jumlah, dan tombol pilih/buang
//           sekelompok, jadi tentor tidak mencentang satu-satu.
//   KANAN = MERAKIT.  Judul, pengelompokan subtes (dengan pratinjau
//           jumlahnya), timer, anti-cheat, catatan untuk admin, putusan
//           kirim, dan riwayat usulan sendiri beserta statusnya.
//
// TIGA HAL YANG DIBUAT JUJUR DI LAYAR
//   1. Putusan kirim memakai `putusanKirimDraf` (murni, 38 uji). Alasan
//      pembatal tampil MERAH dan mematikan tombol; peringatan tampil
//      KUNING dan tidak menghalangi — keduanya dibedakan jelas.
//   2. Setelah dikirim, paket TIDAK terbit. Statusnya "Menunggu
//      persetujuan admin" dan dikatakan begitu apa adanya, lengkap dengan
//      kenyataan bahwa jadwal terbit ditentukan admin.
//   3. Butir bertipe yang tidak bisa dirender try out (mis. menjodohkan)
//      DITOLAK di sini dengan penjelasan + jalan keluar (tetap bisa
//      dicetak lewat Cetak Latihan). Di keranjang cetak tipe itu hanya
//      dibenderai, karena di sana ia memang sah.
//
// KUOTA: daftar soal diambil lewat `ambilKonten()` yang sudah ber-cache TTL
// 10 menit dan dipakai Perpustakaan — TIDAK membuka jalur sapuan baru
// (docs/POLICY-ERROR-DAN-KUOTA.md).
// ============================================================

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { db } from '../../firebase';
import { collection, query, where, getDocs, addDoc, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { ambilKonten } from '../../utils/sumberKonten';
import { bacaIdentitasGuru } from '../../utils/identitasGuru';
import { identitasDari, teksSoalDari } from '../../utils/fieldButirSoal';
import { benderaButir, masukKeranjangBanyak, keluarKeranjang, pindahUrutan } from '../../utils/keranjangSoalGuru';
import {
  GRANULARITAS, MIN_BUTIR, MAKS_BUTIR,
  kelompokkanJadiSubtes, putusanKirimDraf, bangunPayloadDraf,
} from '../../utils/rakitTryOutTentor';
import { labelStatus, warnaStatus, STATUS_PAKET } from '../../utils/statusTryOutPaket';
import { kebijakanGagalMuat } from '../../utils/keputusanMuat';
// Hanya ikon yang benar-benar dipakai. Catatan: ESLint di setup ini TIDAK
// bisa menangkap impor komponen yang nganggur (varsIgnorePattern '^[A-Z_]'
// membuat nama berawalan kapital kebal no-unused-vars — quirk yang
// terdokumentasi di AUDIT-REPO.md), jadi dibersihkan manual.
import {
  Layers, Filter, Search, Send, Loader2, AlertTriangle,
  ChevronDown, ChevronRight, RefreshCw, ListChecks,
} from 'lucide-react';

const TIPE_OPSI = [
  ['', 'semua tipe'],
  ['pg_sederhana', 'PG sederhana'],
  ['pg_kompleks', 'PG kompleks'],
  ['benar_salah', 'Benar/Salah'],
  ['isian_singkat', 'Isian singkat'],
  ['menjodohkan', 'Menjodohkan (tidak bisa masuk try out)'],
  ['esai', 'Esai'],
];

const st = {
  kartu: { background: '#fff', border: '1px solid #e5e7eb', borderRadius: 14, padding: 16, marginBottom: 14 },
  judulKartu: { fontSize: 12.5, fontWeight: 800, color: '#334155', textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 9 },
  kecil: { fontSize: 12, color: '#6b7280', lineHeight: 1.65 },
  pill: (aktif) => ({
    border: `1px solid ${aktif ? '#5B2ECC' : '#d1d5db'}`, background: aktif ? '#5B2ECC' : '#fff',
    color: aktif ? '#fff' : '#374151', borderRadius: 999, padding: '5px 12px',
    fontSize: 11.5, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap',
  }),
  select: { border: '1px solid #d1d5db', borderRadius: 8, padding: '7px 9px', fontSize: 12, background: '#fff', color: '#374151' },
  input: { border: '1px solid #d1d5db', borderRadius: 8, padding: '8px 10px', fontSize: 12.5, width: '100%', color: '#111827' },
  tombol: (mati) => ({
    background: mati ? '#c4b5fd' : '#5B2ECC', color: '#fff', border: 'none', borderRadius: 10,
    padding: '11px 16px', fontSize: 13, fontWeight: 800, cursor: mati ? 'not-allowed' : 'pointer',
    display: 'inline-flex', alignItems: 'center', gap: 8, justifyContent: 'center', width: '100%',
  }),
  tombolKecil: { border: '1px solid #d1d5db', background: '#fff', borderRadius: 8, padding: '4px 9px', fontSize: 11, fontWeight: 600, color: '#475569', cursor: 'pointer' },
  kelompokKepala: {
    display: 'flex', alignItems: 'center', gap: 9, padding: '9px 11px',
    background: '#f1f5f9', borderRadius: 10, cursor: 'pointer', marginBottom: 6,
  },
};

export default function RakitTryOutGuruPage() {
  const [isMobile] = useState(window.innerWidth < 1024);
  const identitas = useMemo(() => bacaIdentitasGuru(), []);

  const [memuat, setMemuat] = useState(true);
  const [error, setError] = useState('');
  const [semuaSoal, setSemuaSoal] = useState([]);
  const [keranjang, setKeranjang] = useState([]);
  const [usulan, setUsulan] = useState([]);

  // ---- filter ----
  const [fJenjang, setFJenjang] = useState('');
  // 🔥 2026-10-09 (owner): "harusnya di awal tentor udah memilih mapelnya
  // dahulu... gak mungkin mencampur mapel, tetapi tidak menutup kemungkinan
  // kasih tombol tambahkan mapel lain". Maka mapel jadi LANGKAH PERTAMA dan
  // tunggal; mapel lain hanya masuk lewat tombol eksplisit.
  const [mapelPaket, setMapelPaket] = useState('');
  const [mapelTambahan, setMapelTambahan] = useState([]);
  const [bukaTambah, setBukaTambah] = useState(false);
  const [fMateri, setFMateri] = useState('');
  const [fKelas, setFKelas] = useState('');
  const [fTipe, setFTipe] = useState('');
  const [fKesulitan, setFKesulitan] = useState('');
  const [fCari, setFCari] = useState('');
  const [hanyaBelum, setHanyaBelum] = useState(false);
  const [kelompokTerbuka, setKelompokTerbuka] = useState({});

  // ---- pengaturan paket ----
  const [judul, setJudul] = useState('');
  const [granularitas, setGranularitas] = useState(GRANULARITAS.MAPEL);
  const [modeTimer, setModeTimer] = useState('total');
  const [durasi, setDurasi] = useState(60);
  const [antiCheat, setAntiCheat] = useState(false);
  const [wajibKamera, setWajibKamera] = useState(false);
  const [soalAcak, setSoalAcak] = useState(false);
  const [catatan, setCatatan] = useState('');
  const [mengirim, setMengirim] = useState(false);
  const [pesanKirim, setPesanKirim] = useState('');

  // ----------------------------------------------------------
  // Muat data: bank soal lewat cache bersama, usulan sendiri lewat query.
  // ----------------------------------------------------------
  const muat = useCallback(async (paksa = false) => {
    setMemuat(true);
    setError('');
    try {
      const konten = await ambilKonten({ paksa });
      setSemuaSoal((konten.soal || []).filter((s) => s.status !== 'nonaktif' && s.status !== 'dihapus'));
      const ids = identitas.semuaId;
      if (ids.length) {
        const snap = await getDocs(query(collection(db, 'tryout_paket'), where('tentorId', 'in', ids)));
        const daftar = snap.docs
          .map((d) => ({ id: d.id, ...d.data() }))
          .filter((p) => p.dibuatOleh === 'tentor' || p.status === STATUS_PAKET.MENUNGGU || p.status === STATUS_PAKET.DITOLAK)
          .sort((a, b) => String(b.disetujuiPada || b.diusulkanPada || '').localeCompare(String(a.disetujuiPada || a.diusulkanPada || '')));
        setUsulan(daftar);
      }
      if (konten.pesan) setError(konten.pesan);
    } catch (e) {
      // POLICY: jangan menelan. Data lama dipertahankan.
      const k = kebijakanGagalMuat(semuaSoal.length > 0, e?.code || e?.message || '');
      setError(k.pesan);
    } finally {
      setMemuat(false);
    }
  }, [identitas.semuaId, semuaSoal.length]);

  useEffect(() => { muat(false); }, [muat]);

  // ----------------------------------------------------------
  // Pilihan filter (dihitung dari data, bukan hardcode)
  // ----------------------------------------------------------
  const opsiUnik = useCallback((ambil) => {
    const m = new Map();
    semuaSoal.forEach((s) => {
      const v = ambil(s);
      if (v) m.set(v, (m.get(v) || 0) + 1);
    });
    return [...m.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], 'id'));
  }, [semuaSoal]);

  const daftarMapelPaket = useMemo(() => opsiUnik((s) => identitasDari(s).mapel !== '(tanpa mapel)' ? identitasDari(s).mapel : ''), [opsiUnik]);
  const cakupanMapel = useMemo(() => (mapelPaket ? [mapelPaket, ...mapelTambahan] : []), [mapelPaket, mapelTambahan]);
  const dalamCakupan = useCallback((s) => cakupanMapel.includes(identitasDari(s).mapel), [cakupanMapel]);
  const daftarJenjang = useMemo(() => opsiUnik((s) => dalamCakupan(s) && identitasDari(s).jenjang !== '(tanpa jenjang)' ? identitasDari(s).jenjang : ''), [opsiUnik, dalamCakupan]);
  const daftarMateri = useMemo(() => opsiUnik((s) => dalamCakupan(s) && (!fJenjang || identitasDari(s).jenjang === fJenjang) && identitasDari(s).materi !== '(tanpa materi)' ? identitasDari(s).materi : ''), [opsiUnik, dalamCakupan, fJenjang]);
  const daftarKelas = useMemo(() => opsiUnik((s) => identitasDari(s).kelas), [opsiUnik]);

  // ----------------------------------------------------------
  // Hasil saringan + pengelompokan
  // ----------------------------------------------------------
  const idTerpilih = useMemo(() => new Set(keranjang.map((s) => String(s?.id))), [keranjang]);

  const tersaring = useMemo(() => {
    const q = fCari.trim().toLowerCase();
    return semuaSoal.filter((s) => {
      const id = identitasDari(s);
      if (!cakupanMapel.length) return false; // mapel paket belum dipilih
      if (!cakupanMapel.includes(id.mapel)) return false;
      if (fJenjang && id.jenjang !== fJenjang) return false;
      if (fMateri && id.materi !== fMateri) return false;
      if (fKelas && id.kelas !== fKelas) return false;
      if (fTipe && String(s.tipe || 'pg_sederhana') !== fTipe) return false;
      if (fKesulitan && String(s.tingkatKesulitan || '') !== fKesulitan) return false;
      if (hanyaBelum && idTerpilih.has(String(s.id))) return false;
      if (q && !`${teksSoalDari(s)} ${id.mapel} ${id.materi}`.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [semuaSoal, cakupanMapel, fJenjang, fMateri, fKelas, fTipe, fKesulitan, fCari, hanyaBelum, idTerpilih]);

  const kelompok = useMemo(() => {
    const m = new Map();
    tersaring.forEach((s) => {
      const id = identitasDari(s);
      const kunci = `${id.jenjang}|||${id.mapel}|||${id.materi}`;
      if (!m.has(kunci)) m.set(kunci, { kunci, jenjang: id.jenjang, mapel: id.mapel, materi: id.materi, soal: [] });
      m.get(kunci).soal.push(s);
    });
    return [...m.values()].sort((a, b) => b.soal.length - a.soal.length
      || a.mapel.localeCompare(b.mapel, 'id') || a.materi.localeCompare(b.materi, 'id'));
  }, [tersaring]);

  const jumlahFilterAktif = [fJenjang, fMateri, fKelas, fTipe, fKesulitan, fCari].filter(Boolean).length + mapelTambahan.length;

  // ----------------------------------------------------------
  // Subtes & putusan kirim
  // ----------------------------------------------------------
  const subtes = useMemo(() => kelompokkanJadiSubtes(keranjang, granularitas), [keranjang, granularitas]);
  const putusan = useMemo(() => putusanKirimDraf({
    judul, daftarSoal: keranjang, modeTimer, durasiTotalMenit: durasi,
    granularitas, targetKelas: fJenjang, targetKategori: mapelPaket,
  }), [judul, keranjang, modeTimer, durasi, granularitas, fJenjang, mapelPaket]);

  const tambah = (daftar) => {
    const hasil = masukKeranjangBanyak(keranjang, daftar);
    setKeranjang(hasil.keranjang);
    setPesanKirim(`✓ ${hasil.rincian.baru} butir masuk keranjang${hasil.rincian.sudahAda ? `, ${hasil.rincian.sudahAda} sudah ada` : ''}${hasil.rincian.dilewati ? `, ${hasil.rincian.dilewati} dilewati` : ''}.`);
  };

  const kirimUsulan = useCallback(async () => {
    if (!putusan.boleh || mengirim) return;
    const kalimat = `Kirim "${judul.trim()}" (${keranjang.length} butir, ${subtes.length} subtes) untuk persetujuan admin?\n\n`
      + 'Paket ini BELUM terbit dan tidak terlihat siswa sampai admin menyetujuinya. Jadwal buka & deadline ditentukan admin.';
    if (!window.confirm(kalimat)) return;

    setMengirim(true);
    setPesanKirim('');
    try {
      const payload = bangunPayloadDraf({
        judul, daftarSoal: keranjang, modeTimer, durasiTotalMenit: durasi,
        granularitas, targetKelas: fJenjang, targetKategori: mapelPaket,
        antiCheatAktif: antiCheat, wajibKamera, soalAcak, catatanUntukAdmin: catatan,
        guru: { id: identitas.docId || identitas.guruId, nama: identitas.guruNama },
      });
      payload.createdAt = serverTimestamp();
      payload.updatedAt = serverTimestamp();
      await addDoc(collection(db, 'tryout_paket'), payload);
      setPesanKirim(`✅ Terkirim. Statusnya "${labelStatus(STATUS_PAKET.MENUNGGU)}" — belum terbit, siswa belum melihatnya. Admin yang menentukan jadwal.`);
      setKeranjang([]);
      setJudul('');
      setCatatan('');
      await muat(true);
    } catch (e) {
      setPesanKirim(`❌ Gagal mengirim: ${e?.message || e}. Keranjang Anda TIDAK dihapus — coba lagi.`);
    } finally {
      setMengirim(false);
    }
  }, [putusan.boleh, mengirim, judul, keranjang, subtes.length, modeTimer, durasi, granularitas, fJenjang, mapelPaket, antiCheat, wajibKamera, soalAcak, catatan, identitas, muat]);

  const kirimUlang = useCallback(async (paket) => {
    if (!window.confirm(`Kirim ulang "${paket.judul}" untuk persetujuan admin? Perubahan yang Anda buat di Firestore Console akan ikut terkirim apa adanya.`)) return;
    try {
      await updateDoc(doc(db, 'tryout_paket', paket.id), {
        status: STATUS_PAKET.MENUNGGU,
        updatedAt: serverTimestamp(),
        riwayatStatus: [
          ...(Array.isArray(paket.riwayatStatus) ? paket.riwayatStatus : []),
          { status: STATUS_PAKET.MENUNGGU, oleh: identitas.guruNama, peran: 'tentor', pada: new Date().toISOString(), catatan: 'Dikirim ulang setelah ditolak' },
        ],
      });
      setPesanKirim('✅ Dikirim ulang untuk persetujuan admin.');
      await muat(true);
    } catch (e) {
      setPesanKirim(`❌ Gagal mengirim ulang: ${e?.message || e}`);
    }
  }, [identitas.guruNama, muat]);

  const pilih = (soal, on) => {
    if (on) tambah([soal]);
    else setKeranjang((lama) => keluarKeranjang(lama, soal.id));
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc' }}>
      {/* Sidebar & padding datang dari TeacherLayout (pembungkus GuruPage).
          Merender SidebarGuru lagi di sini membuat offset dobel: konten
          terdorong ke tengah dan sebagian jatuh ke pinggir layar. */}
      <div style={{ padding: isMobile ? 14 : 22, width: '100%', maxWidth: 1500, margin: '0 auto' }}>
        <div style={{ marginBottom: 14 }}>
          <h1 style={{ fontSize: 20, fontWeight: 800, color: '#111827', margin: 0, display: 'flex', alignItems: 'center', gap: 9 }}>
            <Layers size={20} color="#5B2ECC" /> Rakit Try Out
          </h1>
          <p style={{ ...st.kecil, margin: '5px 0 0' }}>
            <b>Kiri: memilih</b> (saring lalu centang per kelompok) · <b>Kanan: merakit</b> (judul, subtes, timer) · lalu kirim ke admin.
            Paket Anda <b>tidak langsung terbit</b> — admin yang menyetujui dan menentukan jadwalnya.
          </p>
        </div>

        {error && (
          <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10, padding: '10px 13px', marginBottom: 14, fontSize: 12.5, color: '#991b1b', display: 'flex', gap: 9, alignItems: 'center', flexWrap: 'wrap' }}>
            <AlertTriangle size={15} />
            <span style={{ flex: 1, minWidth: 200 }}>{error}</span>
            <button style={st.tombolKecil} onClick={() => muat(true)} disabled={memuat}><RefreshCw size={12} style={{ verticalAlign: -2 }} /> Muat ulang</button>
          </div>
        )}

        <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start', flexDirection: isMobile ? 'column' : 'row' }}>
          {/* ================= KOLOM KIRI: MEMILIH ================= */}
          <div style={{ flex: 1, minWidth: 0, width: '100%' }}>
            <div style={st.kartu}>
              <div style={st.judulKartu}><Filter size={13} style={{ verticalAlign: -2 }} /> 1 · Pilih mapel paket, lalu saring</div>

              <div style={{ marginBottom: 10 }}>
                <div style={{ fontSize: 11, fontWeight: 800, color: mapelPaket ? '#64748b' : '#b91c1c', marginBottom: 6 }}>
                  MAPEL PAKET INI {mapelPaket ? '' : '— pilih dulu; satu paket try out = satu mapel'}
                </div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {daftarMapelPaket.map(([nama, jumlah]) => (
                    <button key={nama} style={st.pill(mapelPaket === nama)} onClick={() => { setMapelPaket(nama); setMapelTambahan([]); setFJenjang(''); setFMateri(''); }}>
                      {nama} <span style={{ opacity: 0.65 }}>{jumlah}</span>
                    </button>
                  ))}
                </div>
              </div>

              {mapelPaket && (
                <>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', marginBottom: 10 }}>
                    <button style={st.tombolKecil} onClick={() => setBukaTambah((v) => !v)}>
                      {bukaTambah ? 'tutup pilihan mapel lain' : '＋ tambahkan mapel lain'}
                    </button>
                    {mapelTambahan.length > 0 && (
                      <span style={{ fontSize: 11, color: '#b45309', fontWeight: 700 }}>
                        paket campuran: {mapelPaket} + {mapelTambahan.join(' + ')} — admin akan melihatnya
                      </span>
                    )}
                  </div>
                  {bukaTambah && (
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10, background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 10, padding: 8 }}>
                      {daftarMapelPaket.filter(([nama]) => nama !== mapelPaket).map(([nama, jumlah]) => (
                        <button key={nama} style={st.pill(mapelTambahan.includes(nama))} onClick={() => setMapelTambahan((l) => (l.includes(nama) ? l.filter((x) => x !== nama) : [...l, nama]))}>
                          {nama} <span style={{ opacity: 0.65 }}>{jumlah}</span>
                        </button>
                      ))}
                    </div>
                  )}
                  <BarisPill label="Jenjang" nilai={fJenjang} opsi={daftarJenjang} onPilih={(v) => { setFJenjang(v); setFMateri(''); }} />
                  <BarisPill label="Materi" nilai={fMateri} opsi={daftarMateri.slice(0, 14)} onPilih={setFMateri} />
                </>
              )}

              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 10, alignItems: 'center' }}>
                <select style={st.select} value={fKelas} onChange={(e) => setFKelas(e.target.value)}>
                  <option value="">semua kelas</option>
                  {daftarKelas.map(([k, n]) => <option key={k} value={k}>{k} ({n})</option>)}
                </select>
                <select style={st.select} value={fTipe} onChange={(e) => setFTipe(e.target.value)}>
                  {TIPE_OPSI.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
                <select style={st.select} value={fKesulitan} onChange={(e) => setFKesulitan(e.target.value)}>
                  <option value="">semua tingkat kesulitan</option>
                  <option value="mudah">mudah</option>
                  <option value="sedang">sedang</option>
                  <option value="sulit">sulit</option>
                </select>
                <div style={{ position: 'relative', flex: 1, minWidth: 180 }}>
                  <Search size={14} style={{ position: 'absolute', left: 9, top: 9, color: '#9ca3af' }} />
                  <input style={{ ...st.input, paddingLeft: 29 }} value={fCari} onChange={(e) => setFCari(e.target.value)} placeholder="cari teks soal…" />
                </div>
                <label style={{ fontSize: 11.5, color: '#475569', display: 'flex', gap: 5, alignItems: 'center', cursor: 'pointer' }}>
                  <input type="checkbox" checked={hanyaBelum} onChange={(e) => setHanyaBelum(e.target.checked)} /> hanya yang belum terpilih
                </label>
                {jumlahFilterAktif > 0 && (
                  <button style={st.tombolKecil} onClick={() => { setFJenjang(''); setFMateri(''); setFKelas(''); setFTipe(''); setFKesulitan(''); setFCari(''); }}>
                    bersihkan {jumlahFilterAktif} saringan
                  </button>
                )}
              </div>

              <div style={{ marginTop: 11, fontSize: 12, color: '#334155', background: '#f8fafc', borderRadius: 9, padding: '8px 11px' }}>
                <b>{tersaring.length}</b> butir cocok · tersebar di <b>{kelompok.length}</b> kelompok
                {memuat && <span style={{ color: '#9ca3af' }}> (memuat…)</span>}
              </div>
            </div>

            <div style={st.kartu}>
              <div style={{ ...st.judulKartu, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span><ListChecks size={13} style={{ verticalAlign: -2 }} /> 2 · Pilih dari kelompok</span>
                {kelompok.length > 1 && (
                  <button style={st.tombolKecil} onClick={() => setKelompokTerbuka((k) => (Object.keys(k).length ? {} : Object.fromEntries(kelompok.map((g) => [g.kunci, true]))))}>
                    buka/tutup semua
                  </button>
                )}
              </div>

              {kelompok.length === 0 && !memuat && (
                <div style={st.kecil}>
                  {mapelPaket
                    ? 'Tidak ada butir yang cocok dengan saringan ini.'
                    : 'Pilih mapel paket di atas dulu — sesudah itu kelompok materi akan muncul di sini.'}
                </div>
              )}

              {kelompok.map((g) => {
                const terbuka = kelompokTerbuka[g.kunci] ?? kelompok.length <= 3;
                const terpilih = g.soal.filter((s) => idTerpilih.has(String(s.id))).length;
                return (
                  <div key={g.kunci} style={{ marginBottom: 8 }}>
                    <div style={st.kelompokKepala} onClick={() => setKelompokTerbuka((k) => ({ ...k, [g.kunci]: !terbuka }))}>
                      {terbuka ? <ChevronDown size={15} color="#64748b" /> : <ChevronRight size={15} color="#64748b" />}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 12.5, fontWeight: 800, color: '#0f172a' }}>{g.materi}</div>
                        <div style={{ fontSize: 10.5, color: '#64748b' }}>{g.jenjang} · {g.mapel} · {g.soal.length} butir{terpilih ? ` · ${terpilih} terpilih` : ''}</div>
                      </div>
                      <button style={st.tombolKecil} onClick={(e) => { e.stopPropagation(); tambah(g.soal); }}>+ semua</button>
                      {terpilih > 0 && (
                        <button style={{ ...st.tombolKecil, color: '#b91c1c', borderColor: '#fecaca' }} onClick={(e) => { e.stopPropagation(); setKeranjang((lama) => lama.filter((s) => !g.soal.some((x) => String(x.id) === String(s.id)))); }}>− buang</button>
                      )}
                    </div>

                    {terbuka && (
                      <div style={{ paddingLeft: 6 }}>
                        {g.soal.slice(0, 60).map((s) => {
                          const bendera = benderaButir(s);
                          const kena = idTerpilih.has(String(s.id));
                          return (
                            <label key={String(s.id)} style={{ display: 'flex', gap: 9, alignItems: 'flex-start', padding: '7px 10px', borderRadius: 9, background: kena ? '#eef2ff' : '#fff', border: `1px solid ${kena ? '#c7d2fe' : '#f1f5f9'}`, marginBottom: 5, cursor: 'pointer' }}>
                              <input type="checkbox" checked={kena} onChange={(e) => pilih(s, e.target.checked)} style={{ marginTop: 3 }} />
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ fontSize: 12, color: '#0f172a', lineHeight: 1.5 }}>{teksSoalDari(s).slice(0, 150) || '(tanpa teks soal)'}</div>
                                <div style={{ fontSize: 10.5, color: '#94a3b8', marginTop: 2 }}>
                                  {String(s.tipe || 'pg_sederhana').replace(/_/g, ' ')}
                                  {s.tingkatKesulitan ? ` · ${s.tingkatKesulitan}` : ''}
                                  {bendera.length > 0 && <span style={{ color: '#b45309' }}> · ⚠ {bendera[0]}</span>}
                                </div>
                              </div>
                            </label>
                          );
                        })}
                        {g.soal.length > 60 && (
                          <div style={{ ...st.kecil, padding: '4px 10px' }}>
                            Menampilkan 60 dari {g.soal.length}. Pakai saringan atau <b>+ semua</b> untuk mengambil seluruh kelompok.
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* ================= KOLOM KANAN: MERAKIT ================= */}
          <div style={{ width: isMobile ? '100%' : 400, flexShrink: 0, position: isMobile ? 'static' : 'sticky', top: 16 }}>
            <div style={st.kartu}>
              <div style={st.judulKartu}>3 · Paket saya ({keranjang.length} butir)</div>
              {mapelPaket && (
                <div style={{ fontSize: 11.5, color: '#334155', marginBottom: 8 }}>
                  Mapel paket: <b>{mapelPaket}</b>
                  {mapelTambahan.length > 0 && <span style={{ color: '#b45309' }}> + {mapelTambahan.join(' + ')} (campuran)</span>}
                </div>
              )}

              {keranjang.length === 0 ? (
                <div style={st.kecil}>Belum ada butir. Pilih dari kelompok di kiri — keranjang tetap utuh walau Anda berpindah filter.</div>
              ) : (
                <>
                  <div style={{ maxHeight: 190, overflowY: 'auto', marginBottom: 11, border: '1px solid #f1f5f9', borderRadius: 9, padding: 7 }}>
                    {keranjang.map((s, i) => (
                      <div key={String(s.id)} style={{ display: 'flex', gap: 6, alignItems: 'center', padding: '4px 3px', borderBottom: i < keranjang.length - 1 ? '1px solid #f8fafc' : 'none' }}>
                        <span style={{ fontSize: 10.5, fontWeight: 800, color: '#5B2ECC', width: 20, flexShrink: 0 }}>{i + 1}.</span>
                        <span style={{ fontSize: 11.5, color: '#334155', flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{teksSoalDari(s).slice(0, 60)}</span>
                        <button style={{ ...st.tombolKecil, padding: '2px 5px' }} title="naikkan" disabled={i === 0} onClick={() => setKeranjang((l) => pindahUrutan(l, s.id, -1))}>↑</button>
                        <button style={{ ...st.tombolKecil, padding: '2px 5px' }} title="turunkan" disabled={i === keranjang.length - 1} onClick={() => setKeranjang((l) => pindahUrutan(l, s.id, 1))}>↓</button>
                        <button style={{ ...st.tombolKecil, padding: '2px 5px', color: '#b91c1c' }} title="keluarkan" onClick={() => setKeranjang((l) => keluarKeranjang(l, s.id))}>×</button>
                      </div>
                    ))}
                  </div>

                  <div style={{ marginBottom: 11 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#64748b', marginBottom: 5 }}>PEMBAGIAN SUBTES ({subtes.length})</div>
                    {subtes.map((g, i) => (
                      <div key={g.nama} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11.5, color: '#334155', padding: '3px 0' }}>
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 280 }}>{i + 1}. {g.nama}</span>
                        <b>{g.jumlah}</b>
                      </div>
                    ))}
                  </div>
                </>
              )}

              <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#64748b', marginBottom: 4 }}>JUDUL PAKET</label>
              <input style={st.input} value={judul} onChange={(e) => setJudul(e.target.value)} placeholder="mis. Try Out TKA Matematika SMA — Pekan 3" />

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 9, marginTop: 11 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#64748b', marginBottom: 4 }}>KELOMPOKKAN</label>
                  <select style={{ ...st.select, width: '100%' }} value={granularitas} onChange={(e) => setGranularitas(e.target.value)}>
                    <option value={GRANULARITAS.MAPEL}>per mata pelajaran</option>
                    <option value={GRANULARITAS.MATERI}>per materi/bab</option>
                    <option value={GRANULARITAS.SATU}>satu subtes utuh</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#64748b', marginBottom: 4 }}>TIMER</label>
                  <select style={{ ...st.select, width: '100%' }} value={modeTimer} onChange={(e) => setModeTimer(e.target.value)}>
                    <option value="total">satu waktu total</option>
                    <option value="per-subtes">per subtes</option>
                  </select>
                </div>
              </div>

              {modeTimer === 'total' ? (
                <div style={{ marginTop: 10 }}>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#64748b', marginBottom: 4 }}>DURASI TOTAL (MENIT)</label>
                  <input style={st.input} type="number" min="5" max="300" value={durasi} onChange={(e) => setDurasi(Number(e.target.value))} />
                </div>
              ) : (
                <div style={{ marginTop: 10, ...st.kecil, background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 9, padding: '8px 10px', color: '#92400e' }}>
                  Durasi per subtes diisi ADMIN saat menyetujui. Anda cukup memastikan pembagiannya sudah benar di atas.
                </div>
              )}

              <div style={{ marginTop: 11, display: 'grid', gap: 6 }}>
                <label style={{ fontSize: 11.5, color: '#374151', display: 'flex', gap: 6, alignItems: 'center' }}>
                  <input type="checkbox" checked={soalAcak} onChange={(e) => setSoalAcak(e.target.checked)} /> acak urutan soal per siswa
                </label>
                <label style={{ fontSize: 11.5, color: '#374151', display: 'flex', gap: 6, alignItems: 'center' }}>
                  <input type="checkbox" checked={antiCheat} onChange={(e) => setAntiCheat(e.target.checked)} /> aktifkan pengawas anti-cheat
                </label>
                {antiCheat && (
                  <label style={{ fontSize: 11.5, color: '#374151', display: 'flex', gap: 6, alignItems: 'center', paddingLeft: 20 }}>
                    <input type="checkbox" checked={wajibKamera} onChange={(e) => setWajibKamera(e.target.checked)} /> wajib kamera
                  </label>
                )}
              </div>

              <div style={{ marginTop: 11 }}>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#64748b', marginBottom: 4 }}>CATATAN UNTUK ADMIN (opsional)</label>
                <textarea style={{ ...st.input, minHeight: 54, resize: 'vertical' }} value={catatan} onChange={(e) => setCatatan(e.target.value)} placeholder="mis. butir 12-15 memakai wacana yang sama" />
              </div>

              {/* putusan: pembatal vs peringatan dipisah jelas */}
              {putusan.alasan.length > 0 && (
                <div style={{ marginTop: 11, background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 9, padding: '9px 11px' }}>
                  <div style={{ fontSize: 11.5, fontWeight: 800, color: '#991b1b', marginBottom: 4 }}>Belum bisa dikirim</div>
                  <ul style={{ margin: 0, paddingLeft: 17, fontSize: 11.5, color: '#b91c1c', lineHeight: 1.6 }}>
                    {putusan.alasan.map((a, i) => <li key={i}>{a}</li>)}
                  </ul>
                </div>
              )}
              {putusan.boleh && putusan.peringatan.length > 0 && (
                <div style={{ marginTop: 11, background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 9, padding: '9px 11px' }}>
                  <div style={{ fontSize: 11.5, fontWeight: 800, color: '#92400e', marginBottom: 4 }}>Boleh dikirim, tapi perhatikan</div>
                  <ul style={{ margin: 0, paddingLeft: 17, fontSize: 11.5, color: '#a16207', lineHeight: 1.6 }}>
                    {putusan.peringatan.map((a, i) => <li key={i}>{a}</li>)}
                  </ul>
                </div>
              )}

              <button style={{ ...st.tombol(!putusan.boleh || mengirim), marginTop: 12 }} onClick={kirimUsulan} disabled={!putusan.boleh || mengirim}>
                {mengirim ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
                Kirim untuk persetujuan admin
              </button>
              <div style={{ ...st.kecil, marginTop: 7, textAlign: 'center' }}>
                Minimal {MIN_BUTIR} butir, maksimal {MAKS_BUTIR}.
              </div>
              {pesanKirim && (
                <div style={{ marginTop: 9, fontSize: 11.5, color: pesanKirim.startsWith('❌') ? '#991b1b' : '#166534', lineHeight: 1.6 }}>{pesanKirim}</div>
              )}
            </div>

            {/* riwayat usulan */}
            <div style={st.kartu}>
              <div style={st.judulKartu}>4 · Usulan saya ({usulan.length})</div>
              {usulan.length === 0 && <div style={st.kecil}>Belum ada usulan.</div>}
              {usulan.slice(0, 25).map((p) => {
                const w = warnaStatus(p.status);
                return (
                  <div key={p.id} style={{ border: '1px solid #f1f5f9', borderRadius: 10, padding: '9px 11px', marginBottom: 7 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, alignItems: 'flex-start' }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: '#0f172a', flex: 1, minWidth: 0 }}>{p.judul || '(tanpa judul)'}</div>
                      <span style={{ background: w.latar, color: w.teks, borderRadius: 999, padding: '2px 8px', fontSize: 10, fontWeight: 800, whiteSpace: 'nowrap' }}>{labelStatus(p.status)}</span>
                    </div>
                    <div style={{ fontSize: 10.5, color: '#94a3b8', marginTop: 3 }}>
                      {p.totalSoal ?? (p.daftarSoal?.length || 0)} butir · {Array.isArray(p.subtes) ? p.subtes.length : 0} subtes
                      {p.waktuTutup ? ` · deadline ${new Date(p.waktuTutup).toLocaleDateString('id-ID')}` : ''}
                    </div>
                    {p.status === STATUS_PAKET.DITOLAK && p.ditolakAlasan && (
                      <div style={{ marginTop: 6, fontSize: 11, color: '#991b1b', background: '#fef2f2', borderRadius: 7, padding: '6px 8px', lineHeight: 1.55 }}>
                        <b>Alasan admin:</b> {p.ditolakAlasan}
                        <button style={{ ...st.tombolKecil, marginLeft: 8 }} onClick={() => kirimUlang(p)}>kirim ulang</button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/** Satu baris pill saringan dengan label di kiri. */
function BarisPill({ label, nilai, opsi, onPilih }) {
  if (!opsi || opsi.length === 0) return null;
  return (
    <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start', marginBottom: 8 }}>
      <div style={{ fontSize: 11, fontWeight: 800, color: '#64748b', width: 58, flexShrink: 0, paddingTop: 5 }}>{label}</div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', flex: 1 }}>
        <button style={st.pill(nilai === '')} onClick={() => onPilih('')}>semua</button>
        {opsi.map(([nama, jumlah]) => (
          <button key={nama} style={st.pill(nilai === nama)} onClick={() => onPilih(nilai === nama ? '' : nama)}>
            {nama} <span style={{ opacity: 0.65 }}>{jumlah}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
