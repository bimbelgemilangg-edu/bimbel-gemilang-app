// src/pages/admin/ptn/ImporDatabasePtnPage.jsx
// ============================================================
// Pintu masuk database PTN & program studi ke Firestore.
//
// POLA DITIRU dari halaman impor yang sudah berjalan (ImporHtmlGeminiPage /
// MesinBankSoalPage): unggah berkas -> pratinjau & validasi -> konfirmasi ->
// tulis. Bedanya, di sini tidak ada AI dan tidak ada penafsiran: berkasnya
// adalah hasil scripts/bangun-impor-ptn.py yang aturannya sudah diuji
// (tests/parsePtnExcel.test.mjs, tests/rencanaImporPtn.test.mjs).
//
// 🔥 EMPAT PENGAMAN DI HALAMAN INI
// 1. PERAN. Hanya Owner & Manajer. Kasir/Operasional yang membuka URL-nya
//    melihat penjelasan, bukan dilempar diam-diam -- mengikuti pola komentar
//    ManajerRoute di App.jsx. Mengelola database kampus bukan kerja harian kasir.
// 2. LINGKUNGAN. Pita penanda apakah aplikasi sedang menunjuk Firestore
//    produksi atau dev. Menulis 437 dokumen ke database yang salah adalah
//    kecelakaan yang paling mungkin terjadi di halaman ini, jadi penandanya
//    dipasang DI ATAS tombol tulis, bukan di halaman lain.
// 3. KONFIRMASI GANDA. Satu centang untuk "seluruh skor berstatus estimasi",
//    satu lagi bila berkas membawa catatan error. Tanpa centang, tombol tulis
//    tidak aktif. Blueprint §3B: data belum lengkap harus ditandai, dan orang
//    yang menekan tombol harus tahu apa yang ia tandai.
// 4. JEJAK AUDIT. Setiap impor yang berhasil dicatat ke audit_logs bersama
//    nama akun, jumlah dokumen, dan nama berkas -- mengikuti cara repo
//    memperlakukan perubahan akun admin.
//
// ⚠️ Halaman ini TIDAK menghapus prodi yang tidak ada di berkas. Impor
// artinya "jadikan seperti isi berkas" untuk dokumen yang disebut, bukan
// "samakan seluruh database". Lihat kepala services/imporPtnService.js.
// ============================================================
import React, { useMemo, useState } from 'react';
import {
  Database, FileUp, AlertTriangle, CheckCircle2, Loader2, ShieldAlert, Landmark,
} from 'lucide-react';
import { isOwnerSession } from '../../../utils/roleAkses';
import { isManajerSession } from '../../../utils/adminAuth';
import { LINGKUNGAN_FIREBASE } from '../../../firebase';
import { periksaBerkasImpor, rencanaPenulisan, contohBaris } from '../../../utils/rencanaImporPtn';
import { tulisRencanaPtn } from '../../../services/imporPtnService';
import { catatAudit, KATEGORI } from '../../../utils/auditLog';

const S = {
  wrap: { padding: 20, maxWidth: 980, margin: '0 auto', fontFamily: 'inherit' },
  judul: { display: 'flex', alignItems: 'center', gap: 10, fontSize: 20, fontWeight: 800, color: '#0f172a', margin: '0 0 6px' },
  sub: { fontSize: 13, color: '#64748b', margin: '0 0 18px', lineHeight: 1.6 },
  kartu: { background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14, padding: 18, marginBottom: 14 },
  pitaProduksi: {
    display: 'flex', gap: 10, alignItems: 'flex-start', background: '#fef2f2',
    border: '1px solid #fecaca', color: '#991b1b', borderRadius: 12,
    padding: '12px 14px', fontSize: 13, lineHeight: 1.55, marginBottom: 14,
  },
  pitaDev: {
    display: 'flex', gap: 10, alignItems: 'flex-start', background: '#eff6ff',
    border: '1px solid #bfdbfe', color: '#1e40af', borderRadius: 12,
    padding: '12px 14px', fontSize: 13, lineHeight: 1.55, marginBottom: 14,
  },
  angkaKotak: {
    flex: 1, minWidth: 120, background: '#f8fafc', border: '1px solid #e2e8f0',
    borderRadius: 10, padding: '10px 12px',
  },
  angka: { fontSize: 20, fontWeight: 800, color: '#0f172a' },
  angkaLabel: { fontSize: 11, color: '#64748b', marginTop: 2 },
  tabel: { width: '100%', borderCollapse: 'collapse', fontSize: 12.5 },
  th: { textAlign: 'left', padding: '6px 8px', color: '#64748b', borderBottom: '1px solid #e2e8f0', fontWeight: 600 },
  td: { padding: '6px 8px', borderBottom: '1px solid #f1f5f9', color: '#334155' },
  tombol: {
    display: 'inline-flex', alignItems: 'center', gap: 8, background: '#4C6EF5',
    color: '#fff', border: 'none', borderRadius: 10, padding: '11px 16px',
    fontWeight: 700, fontSize: 13.5, cursor: 'pointer',
  },
  tombolMati: {
    display: 'inline-flex', alignItems: 'center', gap: 8, background: '#e2e8f0',
    color: '#94a3b8', border: 'none', borderRadius: 10, padding: '11px 16px',
    fontWeight: 700, fontSize: 13.5, cursor: 'not-allowed',
  },
  centang: { display: 'flex', gap: 10, alignItems: 'flex-start', fontSize: 13, color: '#334155', lineHeight: 1.55, marginBottom: 10 },
  masalah: { fontSize: 12.5, color: '#7c2d12', background: '#fff7ed', border: '1px solid #fed7aa', borderRadius: 8, padding: '8px 10px', marginBottom: 6, lineHeight: 1.5 },
};

function LayarTolakAkses() {
  return (
    <div style={S.wrap}>
      <div style={{ ...S.kartu, textAlign: 'center', padding: 40 }}>
        <ShieldAlert size={34} color="#dc2626" style={{ margin: '0 auto 12px' }} />
        <h2 style={{ fontSize: 17, fontWeight: 800, color: '#1e293b', margin: '0 0 8px' }}>Akses Ditolak</h2>
        <p style={{ fontSize: 13, color: '#64748b', lineHeight: 1.6, maxWidth: 460, margin: '0 auto' }}>
          Database perguruan tinggi hanya dikelola Owner dan Admin Manajer.
          Akun Anda berperan Operasional/Kasir. Bila Anda yang seharusnya
          mengerjakan impor ini, minta Manajer atau Owner membukanya.
        </p>
      </div>
    </div>
  );
}

export default function ImporDatabasePtnPage() {
  const boleh = isOwnerSession() || isManajerSession();

  const [berkas, setBerkas] = useState(null);       // { nama, json }
  const [galatParse, setGalatParse] = useState('');
  const [sibuk, setSibuk] = useState(false);
  const [kemajuan, setKemajuan] = useState(null);   // { selesai, total }
  const [hasil, setHasil] = useState(null);         // string sukses
  const [setujuEstimasi, setSetujuEstimasi] = useState(false);
  const [setujuError, setSetujuError] = useState(false);

  const pemeriksaan = useMemo(
    () => (berkas ? periksaBerkasImpor(berkas.json) : null),
    [berkas],
  );
  const rencana = useMemo(
    () => (berkas && pemeriksaan?.sah ? rencanaPenulisan(berkas.json) : null),
    [berkas, pemeriksaan],
  );
  const cuplikan = useMemo(
    () => (berkas && pemeriksaan?.sah ? contohBaris(berkas.json, 3) : []),
    [berkas, pemeriksaan],
  );

  if (!boleh) return <LayarTolakAkses />;

  const adaError = (pemeriksaan?.ringkasan?.masalahError || 0) > 0;
  const siapTulis = !!rencana && setujuEstimasi && (!adaError || setujuError) && !sibuk;

  async function pilihBerkas(e) {
    const f = e.target.files?.[0];
    setHasil(null);
    setSetujuEstimasi(false);
    setSetujuError(false);
    setKemajuan(null);
    if (!f) return;
    try {
      const teks = await f.text();
      const json = JSON.parse(teks);
      setGalatParse('');
      setBerkas({ nama: f.name, json });
    } catch (err) {
      setBerkas(null);
      setGalatParse(`Berkas tidak bisa dibaca sebagai JSON: ${err.message}`);
    }
    e.target.value = '';
  }

  async function tulis() {
    if (!siapTulis) return;
    setSibuk(true);
    setHasil(null);
    try {
      const r = await tulisRencanaPtn(rencana, {
        padaKemajuan: (selesai, total) => setKemajuan({ selesai, total }),
      });
      catatAudit('ptn.impor', {
        kategori: KATEGORI.KONTEN,
        target: berkas.nama,
        detail: {
          dokumen: r.ditulis,
          batch: r.batch,
          ptn: rencana.jumlah.ptn,
          prodi: rencana.jumlah.prodi,
          lingkungan: LINGKUNGAN_FIREBASE,
          statusData: pemeriksaan.ringkasan.statusDataSeluruhnya,
        },
      });
      setHasil(`Selesai: ${r.ditulis} dokumen dalam ${r.batch} batch.`);
    } catch (err) {
      setHasil(`GAGAL menulis: ${err.message}. Tidak ada perubahan parsial yang dijamin — periksa kuota/izin, lalu ulangi impor dari awal.`);
    } finally {
      setSibuk(false);
    }
  }

  return (
    <div style={S.wrap}>
      <h1 style={S.judul}><Landmark size={22} color="#7c3aed" /> Impor Database PTN &amp; Prodi</h1>
      <p style={S.sub}>
        Unggah berkas <b>IMPOR-PTN-*.json</b> hasil <code>scripts/bangun-impor-ptn.py</code>.
        Dokumen ditulis dengan ID dari berkas, jadi impor ulang memperbarui — tidak menduplikasi.
        Prodi yang tidak disebut berkas <b>tidak dihapus</b>.
      </p>

      {LINGKUNGAN_FIREBASE === 'produksi' ? (
        <div style={S.pitaProduksi}>
          <AlertTriangle size={18} style={{ flexShrink: 0, marginTop: 1 }} />
          <div>
            <b>Anda sedang menunjuk Firestore PRODUKSI.</b> Menulis di sini langsung
            terbaca oleh aplikasi sungguhan. Untuk uji coba, jalankan aplikasi dengan
            <code> VITE_FIREBASE_PROJECT_ID</code> menunjuk proyek dev
            (lihat docs/MODE-UJI-COBA-FITUR.md bagian 4).
          </div>
        </div>
      ) : (
        <div style={S.pitaDev}>
          <CheckCircle2 size={18} style={{ flexShrink: 0, marginTop: 1 }} />
          <div>
            Lingkungan: <b>{LINGKUNGAN_FIREBASE}</b>. Aman untuk mencoba — data siswa
            produksi tidak tersentuh.
          </div>
        </div>
      )}

      <div style={S.kartu}>
        <label style={{ ...S.tombol, cursor: 'pointer' }}>
          <FileUp size={16} /> Pilih berkas IMPOR-PTN-*.json
          <input type="file" accept=".json,application/json" onChange={pilihBerkas} style={{ display: 'none' }} />
        </label>
        {berkas && <span style={{ marginLeft: 12, fontSize: 12.5, color: '#64748b' }}>{berkas.nama}</span>}
        {galatParse && <div style={{ ...S.masalah, marginTop: 10 }}>{galatParse}</div>}
      </div>

      {pemeriksaan && !pemeriksaan.sah && (
        <div style={S.kartu}>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 10 }}>
            <AlertTriangle size={18} color="#dc2626" />
            <b style={{ fontSize: 14, color: '#991b1b' }}>Berkas ditolak sebelum ditulis</b>
          </div>
          {pemeriksaan.alasan.slice(0, 12).map((a, i) => <div key={i} style={S.masalah}>{a}</div>)}
          {pemeriksaan.alasan.length > 12 && (
            <div style={{ fontSize: 12, color: '#64748b' }}>… dan {pemeriksaan.alasan.length - 12} alasan lain.</div>
          )}
        </div>
      )}

      {pemeriksaan?.sah && rencana && (
        <>
          <div style={{ ...S.kartu, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            {[
              ['PTN', pemeriksaan.ringkasan.ptn],
              ['Program studi', pemeriksaan.ringkasan.prodi],
              ['Subtes UTBK', pemeriksaan.ringkasan.subtes],
              ['Sumber resmi', pemeriksaan.ringkasan.sumber],
              ['Total dokumen', rencana.jumlah.total],
            ].map(([label, nilai]) => (
              <div key={label} style={S.angkaKotak}>
                <div style={S.angka}>{nilai}</div>
                <div style={S.angkaLabel}>{label}</div>
              </div>
            ))}
          </div>

          <div style={S.kartu}>
            <div style={{ fontSize: 13.5, fontWeight: 700, color: '#0f172a', marginBottom: 8 }}>
              Cuplikan isi (supaya impor tidak jadi &ldquo;percaya saja&rdquo;)
            </div>
            <table style={S.tabel}>
              <thead>
                <tr>
                  <th style={S.th}>ID</th><th style={S.th}>PTN</th><th style={S.th}>Prodi</th>
                  <th style={S.th}>Skor acuan min</th><th style={S.th}>Status</th><th style={S.th}>Tampung</th>
                </tr>
              </thead>
              <tbody>
                {cuplikan.map((c) => (
                  <tr key={c.id}>
                    <td style={S.td}>{c.id}</td>
                    <td style={S.td}>{c.namaPtn}</td>
                    <td style={S.td}>{c.namaProdi}</td>
                    <td style={S.td}>{c.skorMinimum ?? '—'}</td>
                    <td style={S.td}>{c.statusSkor ?? '—'}</td>
                    <td style={S.td}>{c.dayaTampung ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {pemeriksaan.ringkasan.dibangunDari && (
              <div style={{ fontSize: 12, color: '#64748b', marginTop: 8 }}>
                Dibangun dari <b>{pemeriksaan.ringkasan.dibangunDari}</b>
                {pemeriksaan.ringkasan.dibangunPada ? ` pada ${pemeriksaan.ringkasan.dibangunPada}` : ''}
                {pemeriksaan.ringkasan.tahunSeleksi ? ` · tahun seleksi ${pemeriksaan.ringkasan.tahunSeleksi}` : ''}
              </div>
            )}
          </div>

          {(pemeriksaan.ringkasan.masalahError > 0 || pemeriksaan.ringkasan.masalahPeringatan > 0) && (
            <div style={S.kartu}>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 10 }}>
                <AlertTriangle size={18} color="#d97706" />
                <b style={{ fontSize: 13.5, color: '#92400e' }}>
                  Catatan bawaan berkas: {pemeriksaan.ringkasan.masalahError} error,{' '}
                  {pemeriksaan.ringkasan.masalahPeringatan} peringatan
                </b>
              </div>
              <div style={{ fontSize: 12.5, color: '#64748b', marginBottom: 10, lineHeight: 1.6 }}>
                Ini bukan kesalahan struktur — impor tetap bisa jalan. Tapi baris yang
                ditandai error akan masuk dengan field kosong (mis. <code>bidang: null</code>),
                jadi perlu diketahui sebelum dikonfirmasi.
              </div>
              {(berkas.json.masalah || []).filter((m) => m.tingkat === 'error').slice(0, 8).map((m, i) => (
                <div key={i} style={S.masalah}>
                  baris {m.baris ?? '?'}{m.id ? ` · ${m.id}` : ''}{m.sheet ? ` · ${m.sheet}` : ''}: {m.pesan}
                </div>
              ))}
            </div>
          )}

          <div style={S.kartu}>
            <label style={S.centang}>
              <input
                type="checkbox"
                checked={setujuEstimasi}
                onChange={(e) => setSetujuEstimasi(e.target.checked)}
                style={{ marginTop: 2 }}
              />
              <span>
                Saya paham seluruh angka skor di berkas ini berstatus{' '}
                <b>belum_verifikasi / estimasi</b>, bukan angka resmi panitia SNPMB, dan akan
                tampil ke siswa dengan label itu.
              </span>
            </label>
            {adaError && (
              <label style={S.centang}>
                <input
                  type="checkbox"
                  checked={setujuError}
                  onChange={(e) => setSetujuError(e.target.checked)}
                  style={{ marginTop: 2 }}
                />
                <span>
                  Saya paham ada <b>{pemeriksaan.ringkasan.masalahError} catatan error</b> yang
                  akan masuk sebagai field kosong, dan akan memperbaikinya di berkas sumber
                  lalu mengimpor ulang.
                </span>
              </label>
            )}

            <button type="button" style={siapTulis ? S.tombol : S.tombolMati} disabled={!siapTulis} onClick={tulis}>
              {sibuk ? <Loader2 size={16} className="animate-spin" /> : <Database size={16} />}
              {sibuk && kemajuan ? `Menulis ${kemajuan.selesai}/${kemajuan.total}…` : `Tulis ${rencana.jumlah.total} dokumen ke Firestore`}
            </button>
            {hasil && (
              <div style={{ marginTop: 12, fontSize: 13, color: hasil.startsWith('Selesai') ? '#15803d' : '#991b1b', lineHeight: 1.6 }}>
                {hasil}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
