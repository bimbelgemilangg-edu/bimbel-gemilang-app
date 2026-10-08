// src/pages/admin/bank-soal/AuditIdentitasSoalPage.jsx
// ============================================================
// AUDIT IDENTITAS & KESEHATAN BANK SOAL (Admin)
// ============================================================
// Permintaan owner 2026-10-08: sebelum fitur "tentor bisa akses bank
// soal" dibuka (tentor pilih jenjang -> mapel -> materi -> soal), harus
// dipastikan SETIAP butir punya identitas dan tidak ada butir rusak.
//
// Halaman ini adalah ALAT UKUR-nya. Semua logika putusannya ada di
// src/utils/auditIdentitasSoal.js (murni, 42 uji) — halaman ini hanya
// urusan muat data, menampilkan, dan mengeksekusi keputusan owner.
//
// TIGA ATURAN YANG DIPATUHI HALAMAN INI
//
// 1. TIDAK MENYAPU OTOMATIS SAAT DIBUKA. Satu audit = satu pembacaan
//    seluruh koleksi `bank_soal` (1 read per dokumen). Proyek ini pernah
//    kehabisan kuota baca harian sampai menjawab 429 RESOURCE_EXHAUSTED
//    (docs/POLICY-ERROR-DAN-KUOTA.md), dan penyedot terbesarnya adalah
//    halaman yang menyapu koleksi penuh setiap mount. Maka admin harus
//    menekan tombol, dan biaya kuotanya dinyatakan jujur sesudahnya.
//
// 2. GAGAL MUAT TIDAK DITELAN SENYAP. Kuota habis tampil sebagai
//    "kuota harian habis, coba lagi" + tombol Coba lagi — bukan daftar
//    kosong yang membuat orang menyimpulkan "soalnya hilang".
//
// 3. BACA DULU, TULIS HANYA ATAS PERINTAH. Tab "Rencana Perbaikan"
//    adalah DRY-RUN: ia menunjukkan persis field apa yang akan berubah
//    dari nilai apa ke nilai apa. Tidak ada satu pun dokumen ditulis
//    sebelum owner mencentang dan mengonfirmasi. Perubahan data produksi
//    adalah keputusan owner (SOP-KESELAMATAN-PERUBAHAN janji #5).
// ============================================================

import React, { useState, useCallback, useMemo } from 'react';
import SidebarAdmin from '../../../components/SidebarAdmin';
import { db } from '../../../firebase';
import { collection, getDocs, doc, writeBatch, serverTimestamp } from 'firebase/firestore';
import {
  auditBankSoal,
  hitungBiayaBaca,
  keCsvTanpaIdentitas,
  keCsvRusak,
  JATAH_BACA_HARIAN,
} from '../../../utils/auditIdentitasSoal';
import { kebijakanGagalMuat } from '../../../utils/keputusanMuat';
import { catatAudit, KATEGORI } from '../../../utils/auditLog';
import {
  ScanSearch, Loader2, Download, AlertTriangle, ShieldCheck, ShieldAlert,
  Wrench, FileWarning, RefreshCw, CheckCircle2, XCircle,
} from 'lucide-react';

const COL = 'bank_soal';
const UKURAN_BATCH = 400; // batas writeBatch Firestore = 500 operasi

const st = {
  kartu: { background: '#fff', border: '1px solid #e5e7eb', borderRadius: 14, padding: 18, marginBottom: 16 },
  judul: { fontSize: 15, fontWeight: 800, color: '#111827', margin: 0, marginBottom: 4 },
  kecil: { fontSize: 12, color: '#6b7280', lineHeight: 1.6 },
  tombol: {
    background: '#5B2ECC', color: '#fff', border: 'none', borderRadius: 10,
    padding: '10px 18px', fontSize: 13, fontWeight: 700, cursor: 'pointer',
    display: 'inline-flex', alignItems: 'center', gap: 8,
  },
  tombolAbu: {
    background: '#f3f4f6', color: '#374151', border: '1px solid #d1d5db', borderRadius: 10,
    padding: '9px 14px', fontSize: 12.5, fontWeight: 600, cursor: 'pointer',
    display: 'inline-flex', alignItems: 'center', gap: 6,
  },
  tabel: { width: '100%', borderCollapse: 'collapse', fontSize: 12.5 },
  th: { textAlign: 'left', padding: '7px 9px', borderBottom: '2px solid #e5e7eb', color: '#6b7280', fontWeight: 700, fontSize: 11.5, textTransform: 'uppercase' },
  td: { padding: '7px 9px', borderBottom: '1px solid #f1f5f9', color: '#374151', verticalAlign: 'top' },
  pill: (warna) => ({
    display: 'inline-block', padding: '2px 9px', borderRadius: 999,
    fontSize: 11, fontWeight: 700, background: warna, color: '#fff',
  }),
};

function unduhCsv(namaFile, isi) {
  const blob = new Blob(['\ufeff' + isi], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = namaFile;
  a.click();
  URL.revokeObjectURL(url);
}

function Bar({ persen, warna }) {
  return (
    <div style={{ background: '#f1f5f9', borderRadius: 999, height: 7, width: 110, overflow: 'hidden' }}>
      <div style={{ width: `${Math.max(0, Math.min(100, persen))}%`, background: warna, height: '100%' }} />
    </div>
  );
}

export default function AuditIdentitasSoalPage() {
  const [isMobile] = useState(window.innerWidth < 1024);
  const [memuat, setMemuat] = useState(false);
  const [progres, setProgres] = useState('');
  const [laporan, setLaporan] = useState(null);
  // 🔥 2026-10-09: sapuan mentah disimpan supaya tombol unduh tidak perlu
  // membaca Firestore sekali lagi (kuota). Owner minta jalan mengirim SELURUH
  // isi bank soal untuk dianalisis di luar aplikasi.
  const [daftarMentah, setDaftarMentah] = useState([]);
  const [error, setError] = useState('');
  const [biaya, setBiaya] = useState(null);
  const [ikutDikecualikan, setIkutDikecualikan] = useState(false);
  const [tab, setTab] = useState('ringkasan'); // ringkasan | identitas | rusak | rencana
  const [saringIdentitas, setSaringIdentitas] = useState('');
  const [setujuTulis, setSetujuTulis] = useState(false);
  const [menulis, setMenulis] = useState(false);
  const [hasilTulis, setHasilTulis] = useState('');

  // ----------------------------------------------------------
  // Muat & audit. SATU sapuan, atas perintah, bukan saat mount.
  // ----------------------------------------------------------
  const jalankanAudit = useCallback(async () => {
    setMemuat(true);
    setError('');
    setHasilTulis('');
    setProgres('Mengambil seluruh koleksi bank_soal…');
    try {
      const snap = await getDocs(collection(db, COL));
      const daftar = snap.docs.map((d) => ({ id: d.id, data: d.data() }));
      setProgres(`Menganalisis identitas & kesehatan ${daftar.length} butir…`);
      const hasil = auditBankSoal(daftar, { ikutDikecualikan });
      setLaporan(hasil);
      setDaftarMentah(daftar);
      setBiaya(hitungBiayaBaca(daftar.length));
      setTab('ringkasan');
    } catch (e) {
      // POLICY-ERROR-DAN-KUOTA: jangan menelan. Kuota habis (429) adalah
      // kondisi normal di proyek ini dan harus terdengar manusiawi.
      const kuotaHabis = /resource[-_ ]?exhausted|429|quota/i.test(String(e?.message || '') + String(e?.code || ''));
      const keterangan = kuotaHabis
        ? 'kuota baca harian Firestore habis — server menolak dengan 429'
        : (e?.message || 'kesalahan tidak dikenal');
      // Data lama dipertahankan: laporan sebelumnya masih benar dan lebih
      // berharga daripada layar kosong.
      const keputusan = kebijakanGagalMuat(Boolean(laporan), keterangan);
      setError(keputusan.pesan);
      if (!keputusan.pertahankanDataLama) setLaporan(null);
    } finally {
      setMemuat(false);
      setProgres('');
    }
  }, [ikutDikecualikan, laporan]);

  /**
   * Ekspor SELURUH butir yang tersimpan (teks, opsi, kunci, pembahasan,
   * gambar, bacaan, identitas, status) — jalan untuk membaca bank soal di
   * luar aplikasi, misalnya menyerahkannya untuk dianalisis.
   */
  const unduhButirLengkap = useCallback(() => {
    if (!daftarMentah.length) return;
    const isi = daftarMentah.map(({ id, data }) => ({
      id,
      status: data?.status || 'aktif',
      teksSoal: data?.soal || data?.teksSoal || '',
      tipe: data?.tipe || '',
      opsiJawaban: data?.opsiJawaban || [],
      pernyataan: data?.pernyataan || [],
      tabelBenarSalah: data?.tabelBenarSalah || [],
      pasangan: data?.pasangan || [],
      kunciJawaban: data?.kunciJawaban ?? '',
      pembahasan: data?.pembahasan || '',
      pembahasanAsal: data?.pembahasanAsal || '',
      gambarUrls: data?.gambarUrls || [],
      bacaan: data?.bacaan || null,
      identitas: {
        mapel: data?.mataPelajaran || data?.mapel || '',
        jenjang: data?.jenjang || '',
        kelas: data?.tingkatKelas || data?.kelas || '',
        materi: data?.materi || data?.bab || data?.topik || '',
      },
      sumberSoalId: data?.sumberSoalId || null,
      asalImpor: data?.asalImpor || '',
    }));
    const blob = new Blob([JSON.stringify(isi, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bank-soal-lengkap-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [daftarMentah]);

  // ----------------------------------------------------------
  // Eksekusi rencana perbaikan (hanya atas perintah owner)
  // ----------------------------------------------------------
  // useMemo, bukan `laporan?.rencanaPerbaikan || []` langsung: ekspresi
  // `|| []` membuat array BARU setiap render, sehingga dependensi
  // useCallback ikut berubah tiap render (peringatan exhaustive-deps).
  const rencana = useMemo(() => laporan?.rencanaPerbaikan || [], [laporan]);

  const terapkanRencana = useCallback(async () => {
    if (!rencana.length) return;
    const kalimat = `Terapkan ${rencana.length} perbaikan identitas ke koleksi ${COL}? `
      + 'Hanya field yang KOSONG yang diisi dan jenjang yang diseragamkan ke kosakata baku '
      + '(nilai lama disimpan di jenjangSebelumBaku). Tidak ada soal yang dihapus.';
    if (!window.confirm(kalimat)) return;

    setMenulis(true);
    setHasilTulis('');
    try {
      let selesai = 0;
      for (let i = 0; i < rencana.length; i += UKURAN_BATCH) {
        const potongan = rencana.slice(i, i + UKURAN_BATCH);
        const batch = writeBatch(db);
        potongan.forEach((r) => {
          batch.update(doc(db, COL, r.id), {
            ...r.perubahan,
            identitasDiperbaikiPada: serverTimestamp(),
            identitasDiperbaikiOleh: 'AuditIdentitasSoalPage',
          });
        });
        await batch.commit();
        selesai += potongan.length;
        setProgres(`Menulis ${selesai}/${rencana.length} dokumen…`);
      }
      catatAudit('banksoal.identitas.perbaiki', {
        kategori: KATEGORI.KONTEN,
        target: `${selesai} butir bank_soal`,
        detail: {
          jumlah: selesai,
          jenis: 'rencana perbaikan identitas (alias kosong diisi, jenjang dibakukan)',
        },
      });
      setHasilTulis(`✅ ${selesai} dokumen diperbarui. Jalankan audit ulang untuk memastikan angkanya turun.`);
      setSetujuTulis(false);
    } catch (e) {
      setHasilTulis(`❌ Gagal menulis: ${e?.message || e}. Sebagian dokumen mungkin sudah berubah — audit ulang untuk melihat keadaan sebenarnya.`);
    } finally {
      setMenulis(false);
      setProgres('');
    }
  }, [rencana]);

  const daftarIdentitas = useMemo(() => {
    const semua = laporan?.tanpaIdentitas || [];
    const q = saringIdentitas.trim().toLowerCase();
    if (!q) return semua;
    return semua.filter((t) =>
      `${t.mapel} ${t.jenjang} ${t.materi} ${t.pratinjau} ${t.hilang.join(' ')} ${t.takBaku.join(' ')}`.toLowerCase().includes(q));
  }, [laporan, saringIdentitas]);

  const siap = laporan?.kesiapanTentor?.siap ?? false;

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc' }}>
      <SidebarAdmin />
      <div style={{ marginLeft: isMobile ? 0 : 260, padding: isMobile ? 14 : 26, width: isMobile ? '100%' : 'calc(100% - 260px)', boxSizing: 'border-box', maxWidth: 1240 }}>
        <div style={{ marginBottom: 16 }}>
          <h1 style={{ fontSize: 21, fontWeight: 800, color: '#111827', margin: 0, display: 'flex', alignItems: 'center', gap: 9 }}>
            <ScanSearch size={21} color="#5B2ECC" /> Audit Identitas Bank Soal
          </h1>
          <p style={st.kecil}>
            Menjawab dua pertanyaan sebelum fitur tentor dibuka: <b>apakah setiap butir punya identitas</b>{' '}
            (jenjang → mapel → materi) dan <b>apakah ada butir rusak</b>. Halaman ini membaca, tidak menulis —
            kecuali Anda memerintahkan di tab Rencana Perbaikan.
          </p>
        </div>

        {/* ---- kendali + peringatan biaya kuota ---- */}
        <div style={st.kartu}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center' }}>
            <button style={st.tombol} onClick={jalankanAudit} disabled={memuat}>
              {memuat ? <Loader2 size={16} className="animate-spin" /> : <ScanSearch size={16} />}
              {laporan ? 'Jalankan Audit Ulang' : 'Jalankan Audit'}
            </button>

            <label style={{ fontSize: 12.5, color: '#374151', display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={ikutDikecualikan}
                onChange={(e) => setIkutDikecualikan(e.target.checked)}
              />
              Ikut audit butir ber-status <code>nonaktif</code>/<code>dihapus</code>
            </label>

            {daftarMentah.length > 0 && (
              <button style={st.tombolAbu} onClick={unduhButirLengkap}>
                <Download size={14} /> Unduh seluruh bank soal (JSON lengkap)
              </button>
            )}

            {laporan && (
              <span style={st.pill(siap ? '#16a34a' : '#dc2626')}>
                {siap ? 'SIAP untuk tentor' : 'BELUM siap untuk tentor'}
              </span>
            )}
          </div>

          <div style={{ marginTop: 12, background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 10, padding: '10px 13px' }}>
            <div style={{ fontSize: 12, color: '#92400e', lineHeight: 1.65 }}>
              <b>⚠️ Biaya kuota.</b> Satu audit membaca SELURUH koleksi <code>bank_soal</code> — 1 read per dokumen,
              dari jatah {JATAH_BACA_HARIAN.toLocaleString('id-ID')} read/hari.
              {biaya ? ` Audit terakhir: ${biaya.kalimat}` : ' Angka biaya tampil setelah audit dijalankan.'}
              {' '}Proyek ini pernah menjawab <code>429 RESOURCE_EXHAUSTED</code> karena penyapuan berulang;
              jangan jalankan berulang-ulang tanpa perlu.
            </div>
          </div>

          {memuat && progres && <div style={{ marginTop: 10, fontSize: 12.5, color: '#5B2ECC', fontWeight: 600 }}>{progres}</div>}

          {error && (
            <div style={{ marginTop: 12, background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10, padding: '11px 13px' }}>
              <div style={{ fontSize: 12.5, color: '#991b1b', display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                <AlertTriangle size={15} style={{ flexShrink: 0, marginTop: 2 }} />
                <span>{error}</span>
              </div>
              <button style={{ ...st.tombolAbu, marginTop: 9 }} onClick={jalankanAudit} disabled={memuat}>
                <RefreshCw size={13} /> Coba lagi
              </button>
            </div>
          )}

          {hasilTulis && (
            <div style={{ marginTop: 12, fontSize: 12.5, color: hasilTulis.startsWith('✅') ? '#166534' : '#991b1b', fontWeight: 600 }}>
              {hasilTulis}
            </div>
          )}
        </div>

        {!laporan && !memuat && !error && (
          <div style={{ ...st.kartu, textAlign: 'center', padding: 40 }}>
            <FileWarning size={30} color="#9ca3af" style={{ marginBottom: 10 }} />
            <div style={{ fontSize: 14, fontWeight: 700, color: '#374151' }}>Belum ada hasil audit</div>
            <div style={{ ...st.kecil, maxWidth: 560, margin: '6px auto 0' }}>
              Tekan <b>Jalankan Audit</b>. Hasilnya memuat: cakupan tiap field identitas, butir yang tidak
              terjangkau hierarki tentor, butir rusak per tipe, dan rencana perbaikan dry-run.
              Anda bisa mengunduh CSV-nya untuk dianalisis lebih lanjut.
            </div>
          </div>
        )}

        {laporan && (
          <>
            {/* ---- tab ---- */}
            <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap', marginBottom: 14 }}>
              {[
                ['ringkasan', `Ringkasan`],
                ['identitas', `Tanpa Identitas (${laporan.tanpaIdentitas.length})`],
                ['rusak', `Butir Rusak (${laporan.butirRusak.length})`],
                ['rencana', `Rencana Perbaikan (${laporan.rencanaPerbaikan.length})`],
              ].map(([k, label]) => (
                <button
                  key={k}
                  onClick={() => setTab(k)}
                  style={{
                    ...st.tombolAbu,
                    background: tab === k ? '#5B2ECC' : '#fff',
                    color: tab === k ? '#fff' : '#374151',
                    border: tab === k ? '1px solid #5B2ECC' : '1px solid #d1d5db',
                  }}
                >
                  {label}
                </button>
              ))}
            </div>

            {/* ================= RINGKASAN ================= */}
            {tab === 'ringkasan' && (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(4, 1fr)', gap: 12, marginBottom: 16 }}>
                  {[
                    { label: 'Butir diaudit', nilai: laporan.total, ket: `${laporan.dikecualikan} dikecualikan (nonaktif/dihapus)`, warna: '#111827' },
                    { label: 'Identitas lengkap', nilai: laporan.ringkasan.identitasLengkap, ket: `${laporan.ringkasan.persenIdentitasLengkap}% — informasinya ADA`, warna: '#2563eb' },
                    { label: 'Terjangkau tentor', nilai: laporan.ringkasan.terjangkau, ket: `${laporan.ringkasan.persenTerjangkau}% — benar-benar muncul di penyaring`, warna: siap ? '#16a34a' : '#d97706' },
                    { label: 'Butir rusak', nilai: laporan.ringkasan.rusak, ket: `${laporan.ringkasan.perluDicek} perlu dicek manusia`, warna: laporan.ringkasan.rusak ? '#dc2626' : '#16a34a' },
                  ].map((k) => (
                    <div key={k.label} style={{ ...st.kartu, marginBottom: 0 }}>
                      <div style={{ fontSize: 11.5, color: '#6b7280', fontWeight: 700, textTransform: 'uppercase' }}>{k.label}</div>
                      <div style={{ fontSize: 27, fontWeight: 800, color: k.warna, lineHeight: 1.2 }}>{k.nilai.toLocaleString('id-ID')}</div>
                      <div style={{ fontSize: 11, color: '#9ca3af' }}>{k.ket}</div>
                    </div>
                  ))}
                </div>

                {/* putusan kesiapan */}
                <div style={{ ...st.kartu, borderColor: siap ? '#bbf7d0' : '#fecaca', background: siap ? '#f0fdf4' : '#fef2f2' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 8 }}>
                    {siap ? <ShieldCheck size={19} color="#16a34a" /> : <ShieldAlert size={19} color="#dc2626" />}
                    <h2 style={{ ...st.judul, margin: 0 }}>
                      {siap ? 'Bank soal siap dibuka untuk tentor' : 'Bank soal BELUM siap dibuka untuk tentor'}
                    </h2>
                  </div>
                  {laporan.ringkasan.takSelarasKurikulum > 0 && (
                    <div style={{ marginTop: 10, background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 10, padding: '10px 13px' }}>
                      <div style={{ fontSize: 12.5, fontWeight: 700, color: '#92400e', marginBottom: 6 }}>
                        ⚠️ {laporan.ringkasan.takSelarasKurikulum} butir tidak selaras dengan Kurikulum Merdeka
                      </div>
                      <div style={{ fontSize: 11.5, color: '#a16207', lineHeight: 1.7 }}>
                        Identitasnya ada, tapi mapelnya tidak sah untuk jenjangnya (mis. Biologi untuk SD,
                        atau penamaan K13 &quot;Matematika Wajib/Minat&quot;). Unduh CSV butir tanpa identitas untuk
                        daftarnya, lalu rapikan lewat Mesin Bank Soal → tab Rapikan.
                      </div>
                      <ul style={{ margin: '7px 0 0', paddingLeft: 18, fontSize: 11.5, color: '#92400e' }}>
                        {laporan.takSelarasKurikulum.slice(0, 8).map((t) => (
                          <li key={t.id}>
                            <code>{t.mapel}</code> di {t.jenjang} kelas {t.kelas} — {t.pesan[0]}
                          </li>
                        ))}
                      </ul>
                      {laporan.takSelarasKurikulum.length > 8 && (
                        <div style={{ fontSize: 11, color: '#a16207', marginTop: 5 }}>…dan {laporan.takSelarasKurikulum.length - 8} lainnya.</div>
                      )}
                    </div>
                  )}
                  {laporan.kesiapanTentor.penghalang.length === 0 ? (
                    <div style={st.kecil}>
                      Setiap butir punya jenjang baku, mapel, dan materi, serta tidak ada yang rusak.
                      Hierarki pilihan tentor akan menampilkan seluruh isi bank.
                    </div>
                  ) : (
                    <ul style={{ margin: 0, paddingLeft: 19, fontSize: 12.5, color: '#374151', lineHeight: 1.75 }}>
                      {laporan.kesiapanTentor.penghalang.map((p, i) => <li key={i}>{p}</li>)}
                    </ul>
                  )}
                </div>

                {/* cakupan field */}
                <div style={st.kartu}>
                  <h2 style={st.judul}>Cakupan field identitas</h2>
                  <p style={{ ...st.kecil, marginBottom: 11 }}>
                    Field bertanda <b>wajib</b> menentukan apakah butir bisa ditemukan lewat hierarki
                    jenjang → mapel → materi. Angka &quot;terisi&quot; dihitung sadar-alias
                    (<code>mataPelajaran</code> = <code>mapel</code>, <code>tingkatKelas</code> = <code>kelas</code>).
                  </p>
                  <table style={st.tabel}>
                    <thead>
                      <tr>
                        <th style={st.th}>Field</th>
                        <th style={st.th}>Terisi</th>
                        <th style={st.th}>Kosong</th>
                        <th style={st.th}>%</th>
                        <th style={st.th}>&nbsp;</th>
                      </tr>
                    </thead>
                    <tbody>
                      {laporan.cakupan.map((c) => (
                        <tr key={c.field}>
                          <td style={st.td}>
                            <code>{c.field}</code>
                            {c.wajib && <span style={{ ...st.pill('#5B2ECC'), marginLeft: 7, fontSize: 9.5 }}>WAJIB</span>}
                          </td>
                          <td style={st.td}>{c.terisi.toLocaleString('id-ID')}</td>
                          <td style={{ ...st.td, color: c.kosong ? '#dc2626' : '#9ca3af', fontWeight: c.kosong ? 700 : 400 }}>
                            {c.kosong.toLocaleString('id-ID')}
                          </td>
                          <td style={st.td}>{c.persen}%</td>
                          <td style={st.td}><Bar persen={c.persen} warna={c.persen >= 95 ? '#16a34a' : c.persen >= 70 ? '#d97706' : '#dc2626'} /></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* kosakata jenjang */}
                <div style={st.kartu}>
                  <h2 style={st.judul}>Kosakata jenjang yang dipakai</h2>
                  <p style={{ ...st.kecil, marginBottom: 11 }}>
                    Penyaring membandingkan string <b>persis</b>. Dua penulisan untuk jenjang yang sama
                    berarti dua kelompok terpisah di layar tentor — dan salah satunya tak pernah terpilih.
                  </p>
                  <div style={{ display: 'flex', gap: 22, flexWrap: 'wrap' }}>
                    <div style={{ flex: 1, minWidth: 230 }}>
                      <div style={{ fontSize: 11.5, fontWeight: 700, color: '#16a34a', marginBottom: 6, textTransform: 'uppercase' }}>Baku</div>
                      {[...laporan.jenjang.baku, ...laporan.jenjang.lainnya].map((j) => (
                        <div key={j.nama} style={{ fontSize: 12.5, color: '#374151', display: 'flex', justifyContent: 'space-between', padding: '3px 0' }}>
                          <span>{j.nama}</span><b>{j.jumlah.toLocaleString('id-ID')}</b>
                        </div>
                      ))}
                      {laporan.jenjang.kosong > 0 && (
                        <div style={{ fontSize: 12.5, color: '#dc2626', display: 'flex', justifyContent: 'space-between', padding: '3px 0' }}>
                          <span>(kosong)</span><b>{laporan.jenjang.kosong.toLocaleString('id-ID')}</b>
                        </div>
                      )}
                    </div>
                    <div style={{ flex: 1, minWidth: 230 }}>
                      <div style={{ fontSize: 11.5, fontWeight: 700, color: '#dc2626', marginBottom: 6, textTransform: 'uppercase' }}>
                        Perlu diseragamkan
                      </div>
                      {laporan.jenjang.takBaku.length === 0 ? (
                        <div style={{ fontSize: 12.5, color: '#16a34a', display: 'flex', alignItems: 'center', gap: 6 }}>
                          <CheckCircle2 size={14} /> Semua sudah baku.
                        </div>
                      ) : laporan.jenjang.takBaku.map((j) => (
                        <div key={j.nilai} style={{ fontSize: 12.5, color: '#374151', padding: '3px 0' }}>
                          <code style={{ color: '#dc2626' }}>{j.nilai}</code>
                          {' → '}<b>{j.seharusnya}</b>
                          <span style={{ color: '#9ca3af' }}> ({j.jumlah.toLocaleString('id-ID')} butir)</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* kelompok hierarki */}
                <div style={st.kartu}>
                  <h2 style={st.judul}>Hierarki yang akan dilihat tentor ({laporan.perKelompok.length} simpul)</h2>
                  <p style={{ ...st.kecil, marginBottom: 11 }}>
                    Inilah bentuk pohon <i>jenjang → mapel → materi</i> yang akan dipilih tentor.
                    Simpul bertanda <b>?</b> berarti butir di dalamnya tak punya identitas itu.
                  </p>
                  <div style={{ maxHeight: 340, overflow: 'auto' }}>
                    <table style={st.tabel}>
                      <thead>
                        <tr>
                          <th style={st.th}>Jenjang</th><th style={st.th}>Mapel</th>
                          <th style={st.th}>Materi</th><th style={st.th}>Butir</th>
                          <th style={st.th}>Siap</th><th style={st.th}>Tersembunyi</th><th style={st.th}>Rusak</th>
                        </tr>
                      </thead>
                      <tbody>
                        {laporan.perKelompok.slice(0, 300).map((k, i) => (
                          <tr key={i}>
                            <td style={st.td}>{k.jenjang}</td>
                            <td style={st.td}>{k.mapel}</td>
                            <td style={st.td}>{k.materi}</td>
                            <td style={{ ...st.td, fontWeight: 700 }}>{k.jumlah}</td>
                            <td style={{ ...st.td, color: '#16a34a' }}>{k.siap}</td>
                            <td style={{ ...st.td, color: k.tersembunyi ? '#d97706' : '#9ca3af' }}>{k.tersembunyi}</td>
                            <td style={{ ...st.td, color: k.rusak ? '#dc2626' : '#9ca3af' }}>{k.rusak}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* general checkup */}
                <div style={st.kartu}>
                  <h2 style={st.judul}>General checkup fondasi</h2>
                  <p style={{ ...st.kecil, marginBottom: 11 }}>
                    Dihitung dari sapuan yang sama — tidak ada bacaan Firestore tambahan.
                    Tiga angka pertama menjawab &quot;apakah ada soal beranak yang lolos masuk&quot;;
                    tiga angka belakang menjawab &quot;apakah pohon materi masih bisa dinavigasi tentor&quot;.
                  </p>
                  <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(6, 1fr)', gap: 10 }}>
                    {[
                      { l: 'Duplikat persis', v: laporan.checkup.duplikatPersis, baik: laporan.checkup.duplikatPersis === 0 },
                      { l: 'Kembar beda kunci', v: laporan.checkup.kembarBedaKunci, baik: laporan.checkup.kembarBedaKunci === 0 },
                      { l: 'Perintah sama, gambar beda', v: laporan.checkup.perintahSamaGambarBeda, baik: true, netral: true },
                      { l: 'Simpul materi', v: laporan.checkup.simpulMateri, baik: true, netral: true },
                      { l: 'Simpul berisi 1 soal', v: laporan.checkup.simpulSatuButir, baik: laporan.checkup.simpulSatuButir === 0 },
                      { l: 'Rata-rata butir/simpul', v: laporan.checkup.rataButirPerSimpul, baik: laporan.checkup.rataButirPerSimpul >= 4 },
                    ].map((k) => (
                      <div key={k.l} style={{ background: k.netral ? '#f8fafc' : k.baik ? '#f0fdf4' : '#fef2f2', border: `1px solid ${k.netral ? '#e2e8f0' : k.baik ? '#bbf7d0' : '#fecaca'}`, borderRadius: 10, padding: '9px 10px' }}>
                        <div style={{ fontSize: 20, fontWeight: 800, color: k.netral ? '#334155' : k.baik ? '#166534' : '#dc2626' }}>{k.v}</div>
                        <div style={{ fontSize: 10.5, color: '#6b7280', lineHeight: 1.4 }}>{k.l}</div>
                      </div>
                    ))}
                  </div>
                  {laporan.checkup.kembarBedaKunci > 0 && (
                    <div style={{ marginTop: 10, fontSize: 12, color: '#92400e', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 9, padding: '9px 11px', lineHeight: 1.6 }}>
                      <b>Kembar tapi jawaban berbeda.</b> Ini BUKAN duplikat yang aman dibuang — salah satunya hampir pasti
                      salah kunci. Periksa: {laporan.checkup.contohKembarBedaKunci.map((c) => `"${c.pratinjau}…"`).join(', ')}.
                    </div>
                  )}
                  {laporan.checkup.materiTerpecah.length > 0 && (
                    <div style={{ marginTop: 10, fontSize: 12, color: '#334155', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 9, padding: '9px 11px', lineHeight: 1.7 }}>
                      <b>Pohon materi terpecah</b> (rata-rata &lt; 4 butir per simpul) — tentor akan melihat banyak tombol
                      berisi sedikit soal:
                      <ul style={{ margin: '6px 0 0', paddingLeft: 18 }}>
                        {laporan.checkup.materiTerpecah.slice(0, 8).map((m) => (
                          <li key={m.mapel}>{m.mapel}: {m.simpul} simpul untuk {m.butir} butir (rata-rata {m.rata}; {m.satuButir} simpul berisi 1 soal)</li>
                        ))}
                      </ul>
                      Rapikan lewat Taksonomi Materi + Petakan Mapel; daftar kerja per simpul ada di hasil unduhan.
                    </div>
                  )}
                </div>

                {/* peta mapel */}
                <div style={st.kartu}>
                  <h2 style={st.judul}>Sebaran per mata pelajaran</h2>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
                    {laporan.mapel.map((m) => (
                      <span key={m.nama} style={{ background: '#f1f5f9', borderRadius: 999, padding: '4px 11px', fontSize: 12, color: '#334155' }}>
                        {m.nama} <b style={{ color: '#5B2ECC' }}>{m.jumlah}</b>
                      </span>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* ================= TANPA IDENTITAS ================= */}
            {tab === 'identitas' && (
              <div style={st.kartu}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10, marginBottom: 11 }}>
                  <div>
                    <h2 style={st.judul}>Butir tidak terjangkau hierarki tentor</h2>
                    <p style={{ ...st.kecil, margin: 0 }}>
                      {laporan.ringkasan.tersembunyi} di antaranya <b>tersembunyi</b>: identitasnya ADA,
                      tapi tersimpan dalam kosakata/alias yang tidak dibaca penyaring.
                    </p>
                  </div>
                  <button style={st.tombolAbu} onClick={() => unduhCsv('bank-soal-tanpa-identitas.csv', keCsvTanpaIdentitas(laporan))}>
                    <Download size={14} /> Unduh CSV
                  </button>
                </div>

                <input
                  value={saringIdentitas}
                  onChange={(e) => setSaringIdentitas(e.target.value)}
                  placeholder="Saring: mapel, materi, atau cuplikan teks soal…"
                  style={{ width: '100%', padding: '9px 12px', border: '1px solid #d1d5db', borderRadius: 9, fontSize: 12.5, marginBottom: 12 }}
                />

                {daftarIdentitas.length === 0 ? (
                  <div style={{ fontSize: 13, color: '#16a34a', display: 'flex', alignItems: 'center', gap: 7 }}>
                    <CheckCircle2 size={16} /> Tidak ada — setiap butir terjangkau hierarki.
                  </div>
                ) : (
                  <div style={{ maxHeight: 520, overflow: 'auto' }}>
                    <table style={st.tabel}>
                      <thead>
                        <tr>
                          <th style={st.th}>Keadaan</th><th style={st.th}>Mapel</th>
                          <th style={st.th}>Jenjang</th><th style={st.th}>Materi</th>
                          <th style={st.th}>Masalah</th><th style={st.th}>Cuplikan</th>
                        </tr>
                      </thead>
                      <tbody>
                        {daftarIdentitas.slice(0, 500).map((t) => (
                          <tr key={t.id}>
                            <td style={st.td}>
                              <span style={st.pill(t.lengkapTapiTersembunyi ? '#d97706' : '#dc2626')}>
                                {t.lengkapTapiTersembunyi ? 'TERSEMBUNYI' : 'TANPA IDENTITAS'}
                              </span>
                            </td>
                            <td style={st.td}>{t.mapel}</td>
                            <td style={st.td}>{t.jenjang}</td>
                            <td style={st.td}>{t.materi}</td>
                            <td style={{ ...st.td, fontSize: 11.5, color: '#6b7280' }}>
                              {[...t.hilang.map((h) => `hilang: ${h}`), ...t.takBaku, ...t.hanyaAlias].join(' · ')}
                            </td>
                            <td style={{ ...st.td, fontSize: 11.5, maxWidth: 300 }}>{t.pratinjau}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {daftarIdentitas.length > 500 && (
                      <div style={{ ...st.kecil, marginTop: 8 }}>
                        Menampilkan 500 dari {daftarIdentitas.length}. Unduh CSV untuk daftar lengkap.
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* ================= BUTIR RUSAK ================= */}
            {tab === 'rusak' && (
              <div style={st.kartu}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10, marginBottom: 11 }}>
                  <div>
                    <h2 style={st.judul}>Butir rusak</h2>
                    <p style={{ ...st.kecil, margin: 0 }}>
                      Butir ini tidak boleh sampai ke siswa apa adanya: kunci di luar rentang opsi,
                      placeholder gambar yatim, tipe tak dikenal, aksara rusak.
                    </p>
                  </div>
                  <button style={st.tombolAbu} onClick={() => unduhCsv('bank-soal-rusak.csv', keCsvRusak(laporan))}>
                    <Download size={14} /> Unduh CSV
                  </button>
                </div>

                {laporan.butirRusak.length === 0 ? (
                  <div style={{ fontSize: 13, color: '#16a34a', display: 'flex', alignItems: 'center', gap: 7 }}>
                    <CheckCircle2 size={16} /> Tidak ada butir rusak.
                  </div>
                ) : (
                  <div style={{ maxHeight: 460, overflow: 'auto' }}>
                    <table style={st.tabel}>
                      <thead>
                        <tr><th style={st.th}>Tipe</th><th style={st.th}>Alasan</th><th style={st.th}>Cuplikan</th><th style={st.th}>ID</th></tr>
                      </thead>
                      <tbody>
                        {laporan.butirRusak.slice(0, 500).map((b) => (
                          <tr key={b.id}>
                            <td style={st.td}><code>{b.tipe}</code></td>
                            <td style={{ ...st.td, color: '#dc2626', fontSize: 11.5 }}>
                              {b.alasan.map((a, i) => <div key={i}>• {a}</div>)}
                            </td>
                            <td style={{ ...st.td, fontSize: 11.5, maxWidth: 320 }}>{b.pratinjau}</td>
                            <td style={{ ...st.td, fontSize: 10.5, color: '#9ca3af' }}>{b.id.slice(0, 10)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                <div style={{ marginTop: 16, background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 10, padding: 12 }}>
                  <div style={{ fontSize: 12.5, fontWeight: 700, color: '#334155', marginBottom: 5 }}>
                    Perlu dicek manusia: {laporan.butirCekManual.length} butir
                  </div>
                  <div style={st.kecil}>
                    Bukan rusak, tapi perlu keputusan guru: kunci belum terverifikasi (hasil AI),
                    pembahasan hasil penalaran model, esai tanpa rubrik, opsi identik, figur menunggu
                    potongan presisi. Halaman <b>Bersihkan Soal</b> menangani penghapusan;
                    halaman ini sengaja tidak menghapus apa pun.
                  </div>
                </div>
              </div>
            )}

            {/* ================= RENCANA PERBAIKAN ================= */}
            {tab === 'rencana' && (
              <div style={st.kartu}>
                <h2 style={st.judul}>Rencana perbaikan (dry-run)</h2>
                <p style={{ ...st.kecil, marginBottom: 12 }}>
                  Daftar di bawah adalah <b>rencana</b>, belum perubahan. Prinsipnya: hanya mengisi field
                  yang KOSONG dan menyeragamkan jenjang ke kosakata baku. Nilai berbeda yang sama-sama
                  terisi <b>tidak pernah ditimpa</b> — itu wilayah keputusan manusia. Nilai jenjang lama
                  disimpan di <code>jenjangSebelumBaku</code>, jadi tidak ada informasi yang hilang.
                </p>

                {rencana.length === 0 ? (
                  <div style={{ fontSize: 13, color: '#16a34a', display: 'flex', alignItems: 'center', gap: 7 }}>
                    <CheckCircle2 size={16} /> Tidak ada yang bisa diperbaiki otomatis.
                  </div>
                ) : (
                  <>
                    <div style={{ maxHeight: 400, overflow: 'auto', marginBottom: 14 }}>
                      <table style={st.tabel}>
                        <thead>
                          <tr><th style={st.th}>ID</th><th style={st.th}>Yang akan berubah</th><th style={st.th}>Alasan</th></tr>
                        </thead>
                        <tbody>
                          {rencana.slice(0, 400).map((r) => (
                            <tr key={r.id}>
                              <td style={{ ...st.td, fontSize: 10.5, color: '#9ca3af' }}>{r.id.slice(0, 10)}</td>
                              <td style={{ ...st.td, fontSize: 11.5 }}>
                                {Object.entries(r.perubahan).map(([k, v]) => (
                                  <div key={k}><code>{k}</code> = <b>{String(v).slice(0, 60)}</b></div>
                                ))}
                              </td>
                              <td style={{ ...st.td, fontSize: 11.5, color: '#6b7280' }}>{r.alasan.join(' · ')}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      {rencana.length > 400 && (
                        <div style={{ ...st.kecil, marginTop: 8 }}>Menampilkan 400 dari {rencana.length} rencana.</div>
                      )}
                    </div>

                    <div style={{ background: '#fff7ed', border: '1px solid #fed7aa', borderRadius: 10, padding: 13 }}>
                      <label style={{ fontSize: 12.5, color: '#9a3412', display: 'flex', alignItems: 'flex-start', gap: 8, cursor: 'pointer', fontWeight: 600 }}>
                        <input
                          type="checkbox"
                          checked={setujuTulis}
                          onChange={(e) => setSetujuTulis(e.target.checked)}
                          style={{ marginTop: 3 }}
                        />
                        Saya mengerti ini MENULIS ke database produksi yang dipakai siswa hari ini,
                        dan saya sudah memeriksa rencana di atas.
                      </label>
                      <div style={{ display: 'flex', gap: 9, marginTop: 11, flexWrap: 'wrap' }}>
                        <button
                          style={{ ...st.tombol, opacity: setujuTulis && !menulis ? 1 : 0.45, cursor: setujuTulis && !menulis ? 'pointer' : 'not-allowed' }}
                          onClick={terapkanRencana}
                          disabled={!setujuTulis || menulis}
                        >
                          {menulis ? <Loader2 size={16} className="animate-spin" /> : <Wrench size={16} />}
                          Terapkan {rencana.length} perbaikan
                        </button>
                        <span style={{ ...st.kecil, alignSelf: 'center' }}>
                          {menulis ? progres : 'Alternatif yang sudah ada: tab “Rapikan” di Mesin Bank Soal.'}
                        </span>
                      </div>
                      {menulis && progres && <div style={{ fontSize: 12, color: '#9a3412', marginTop: 8, fontWeight: 600 }}>{progres}</div>}
                    </div>
                  </>
                )}

                <div style={{ marginTop: 14, fontSize: 12, color: '#6b7280', lineHeight: 1.7, display: 'flex', gap: 8 }}>
                  <XCircle size={15} style={{ flexShrink: 0, marginTop: 2, color: '#9ca3af' }} />
                  <span>
                    Halaman ini <b>tidak bisa</b> mengisi identitas yang benar-benar kosong (mapel/materi
                    yang tak pernah ada di dokumen mana pun) — itu butuh keputusan kurikulum.
                    Pakai <b>Mesin Bank Soal → tab Rapikan</b> (deteksi taksonomi dari teks soal) atau
                    <b> Petakan Mapel</b> / <b>Petakan Matematika</b> untuk memetakan materi secara massal.
                  </span>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
