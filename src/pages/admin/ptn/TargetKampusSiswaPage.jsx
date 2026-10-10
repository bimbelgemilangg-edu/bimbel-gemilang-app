// src/pages/admin/ptn/TargetKampusSiswaPage.jsx
// ============================================================
// Alur konsultasi yang diminta owner (2026-10-10):
//   siswa konsultasi offline -> admin mendaftarkan Pilihan 1 & 2 ->
//   skor minimum/rata-rata/maksimum keluar dari database -> disimpan ->
//   tampilan siswa berubah (chip goal di depan nama & NIM + kartu target).
//
// Halaman ini adalah sisi admin dari alur itu. Prinsip yang dipegang:
//
// 1. ANGKA DITUNJUKKAN SEBELUM DISIMPAN. Admin melihat min/rata-rata/maks,
//    daya tampung, peminat, syarat khusus, DAN zona kesiapan terhadap skor
//    yang diinput -- sebelum menekan tombol. Konsultasi yang memutuskan
//    angkanya ditutup di layar lain adalah konsultasi yang buta.
// 2. SKOR SISWA DIINPUT ADMIN, bukan dihitung aplikasi. Belum ada penskoran
//    otomatis berskala UTBK di aplikasi ini (try out kita berskala persen),
//    jadi skor skala UTBK datang dari hasil konsultasi/TO eksternal dan
//    WAJIB diberi keterangan ("TO 4, 22 Jan 2027"). Tanpa keterangan, angka
//    itu tidak bisa dipertanggungjawabkan enam bulan kemudian.
// 3. PERUBAHAN MEMBUTUHKAN ALASAN. Target lama disimpan sebagai riwayat
//    (utils/targetKampus.js). Tanpa alasan, grafik perkembangan siswa tidak
//    bisa membedakan "skornya naik" dari "targetnya diganti".
// 4. PERAN: Owner & Manajer saja, seperti halaman impor database PTN.
// ============================================================
import React, { useEffect, useMemo, useState } from 'react';
import { collection, collectionGroup, query, where, getDocs, doc, setDoc, addDoc, serverTimestamp } from 'firebase/firestore';
import { Search, Save, ShieldAlert, Users, Landmark } from 'lucide-react';
import { db } from '../../../firebase';
import { isOwnerSession } from '../../../utils/roleAkses';
import { isManajerSession, ambilSesiAdmin } from '../../../utils/adminAuth';
import { LINGKUNGAN_FIREBASE } from '../../../firebase';
import { ekstrakAngkaKelas } from '../../../utils/aksesKontenSiswa';
import { bentukTarget, validasiTarget, buatVersiBaru } from '../../../utils/targetKampus';
import { bandingkanSkor, nilaiFormasi, ZONA } from '../../../utils/zonaKesiapan';
import { labelUntukTampilan, sanggahanSkor } from '../../../utils/statusDataPtn';
import { catatAudit, KATEGORI } from '../../../utils/auditLog';
import { segarkanDataTargetKampus } from '../../../components/BannerTargetSiswa';

const WARNA_ZONA = {
  [ZONA.HIJAU_AMAN]: '#16a34a',
  [ZONA.HIJAU_KOMPETITIF]: '#65a30d',
  [ZONA.KUNING]: '#d97706',
  [ZONA.MERAH]: '#dc2626',
  [ZONA.TANPA_DATA]: '#64748b',
};

const S = {
  wrap: { padding: 20, maxWidth: 1080, margin: '0 auto' },
  judul: { display: 'flex', alignItems: 'center', gap: 10, fontSize: 20, fontWeight: 800, color: '#0f172a', margin: '0 0 6px' },
  sub: { fontSize: 13, color: '#64748b', margin: '0 0 16px', lineHeight: 1.6 },
  kartu: { background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14, padding: 16, marginBottom: 14 },
  label: { fontSize: 11.5, fontWeight: 700, color: '#64748b', marginBottom: 4 },
  input: { width: '100%', padding: '9px 10px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 13, boxSizing: 'border-box' },
  pilih: { width: '100%', padding: '9px 10px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 13, background: '#fff', boxSizing: 'border-box' },
  tombol: { display: 'inline-flex', alignItems: 'center', gap: 8, background: '#4C6EF5', color: '#fff', border: 'none', borderRadius: 10, padding: '11px 16px', fontWeight: 700, fontSize: 13.5, cursor: 'pointer' },
  tombolMati: { display: 'inline-flex', alignItems: 'center', gap: 8, background: '#e2e8f0', color: '#94a3b8', border: 'none', borderRadius: 10, padding: '11px 16px', fontWeight: 700, fontSize: 13.5, cursor: 'not-allowed' },
  zonaKotak: (warna) => ({ border: `1px solid ${warna}66`, background: `${warna}0d`, borderRadius: 10, padding: '8px 10px', fontSize: 12.5, color: warna, fontWeight: 700 }),
  kecil: { fontSize: 11.5, color: '#64748b', lineHeight: 1.6 },
};

function KartuProdi({ judul, prodi, skor }) {
  if (!prodi) {
    return (
      <div style={{ ...S.kartu, flex: '1 1 300px', background: '#f8fafc' }}>
        <div style={S.label}>{judul}</div>
        <div style={{ fontSize: 12.5, color: '#94a3b8' }}>Belum dipilih</div>
      </div>
    );
  }
  const b = bandingkanSkor(skor, prodi.skorReferensi);
  const warna = WARNA_ZONA[b.zona.id] || '#64748b';
  const labMin = labelUntukTampilan(prodi.skorReferensi?.minimum);
  return (
    <div style={{ ...S.kartu, flex: '1 1 300px' }}>
      <div style={S.label}>{judul}</div>
      <div style={{ fontSize: 14, fontWeight: 800, color: '#1e293b' }}>{prodi.namaProdi}</div>
      <div style={{ fontSize: 12.5, color: '#64748b' }}>{prodi.namaPtn}{prodi.kampus ? ` · ${prodi.kampus}` : ''} · {prodi.jenjang}</div>
      <div style={{ fontSize: 12.5, color: '#334155', marginTop: 8, lineHeight: 1.8 }}>
        <div>
          Skor acuan minimum <b style={{ color: labMin.peringatan ? '#b45309' : '#16a34a' }}>{labMin.teks}</b>
          {' · rata-rata '}{prodi.skorReferensi?.rataRata?.nilai ?? '—'}
          {' · maksimum '}{prodi.skorReferensi?.maksimum?.nilai ?? '—'}
        </div>
        <div style={S.kecil}>{labMin.keterangan || ''} · sumber: {prodi.skorReferensi?.minimum?.sumber || '—'}</div>
        <div>Daya tampung {prodi.dayaTampung?.nilai ?? '—'} · peminat {prodi.peminat?.nilai ?? '—'} · keketatan {prodi.keketatan ? `1 : ${Math.round(1 / prodi.keketatan)}` : '—'}</div>
        {prodi.syaratKhusus && prodi.syaratKhusus !== 'Tidak Ada Syarat Khusus' && (
          <div style={{ color: '#b45309' }}>⚠ Syarat: {prodi.syaratKhusus}</div>
        )}
        {prodi.subtesKunci && <div style={S.kecil}>Subtes kunci: {prodi.subtesKunci}</div>}
        {skor !== null && skor !== '' && b.zona.id !== ZONA.TANPA_DATA && (
          <div style={{ ...S.zonaKotak(warna), marginTop: 8 }}>
            {b.zona.nama} · selisih {b.gapMinimum >= 0 ? '+' : ''}{b.gapMinimum} · {b.zona.frekuensiDrill}
          </div>
        )}
        {skor !== null && skor !== '' && b.zona.id === ZONA.TANPA_DATA && (
          <div style={{ ...S.zonaKotak(warna), marginTop: 8 }}>Prodi belum punya skor acuan — zona tidak dihitung.</div>
        )}
      </div>
    </div>
  );
}

export default function TargetKampusSiswaPage() {
  const boleh = isOwnerSession() || isManajerSession();

  const [siswa, setSiswa] = useState([]);
  const [prodi, setProdi] = useState([]);
  const [targetPerSiswa, setTargetPerSiswa] = useState({});
  const [muat, setMuat] = useState(true);
  const [pesanMuat, setPesanMuat] = useState('');

  const [siswaId, setSiswaId] = useState('');
  const [cari, setCari] = useState('');
  const [p1, setP1] = useState('');
  const [p2, setP2] = useState('');
  const [skor, setSkor] = useState('');
  const [keteranganSkor, setKeteranganSkor] = useState('');
  const [alasan, setAlasan] = useState('');
  const [sibuk, setSibuk] = useState(false);
  const [pesan, setPesan] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const [snapSiswa, snapProdi, snapTarget] = await Promise.all([
          getDocs(query(collection(db, 'students'), where('jenjang', '==', 'SMA'))),
          getDocs(collectionGroup(db, 'prodi')),
          getDocs(collection(db, 'target_kampus_siswa')),
        ]);
        const daftar = snapSiswa.docs
          .map((d) => ({ id: d.id, ...d.data() }))
          .filter((s) => ekstrakAngkaKelas(s.kelasSekolah) === '12')
          .sort((a, b) => String(a.nama).localeCompare(String(b.nama)));
        setSiswa(daftar);
        setProdi(snapProdi.docs.map((d) => ({ id: d.id, ...d.data() })).sort((a, b) => String(a.namaPtn).localeCompare(String(b.namaPtn)) || String(a.namaProdi).localeCompare(String(b.namaProdi))));
        const peta = {};
        snapTarget.forEach((d) => { peta[d.id] = d.data(); });
        setTargetPerSiswa(peta);
      } catch (e) {
        setPesanMuat(`Gagal memuat data: ${e.message}. Bila koleksi prodi masih kosong, jalankan dulu Impor Database PTN.`);
      } finally {
        setMuat(false);
      }
    })();
  }, []);

  const siswaTerpilih = useMemo(() => siswa.find((s) => s.id === siswaId) || null, [siswa, siswaId]);
  const targetLama = siswaId ? targetPerSiswa[siswaId] || null : null;
  const docP1 = useMemo(() => prodi.find((p) => p.id === p1) || null, [prodi, p1]);
  const docP2 = useMemo(() => prodi.find((p) => p.id === p2) || null, [prodi, p2]);

  // Pencarian prodi: cukup di sisi klien, 266 dokumen sudah dimuat sekali.
  const hasilCari = useMemo(() => {
    const q = cari.toLowerCase().trim();
    if (!q) return [];
    return prodi
      .filter((p) => `${p.namaProdi} ${p.namaPtn} ${p.id}`.toLowerCase().includes(q))
      .slice(0, 30);
  }, [cari, prodi]);

  const skorAngka = skor === '' ? null : Number(skor);
  const formasi = docP1 && docP2
    ? nilaiFormasi(bandingkanSkor(skorAngka, docP1.skorReferensi), bandingkanSkor(skorAngka, docP2.skorReferensi))
    : null;

  if (!boleh) {
    return (
      <div style={S.wrap}>
        <div style={{ ...S.kartu, textAlign: 'center', padding: 40 }}>
          <ShieldAlert size={34} color="#dc2626" style={{ margin: '0 auto 12px' }} />
          <h2 style={{ fontSize: 17, fontWeight: 800, color: '#1e293b' }}>Akses Ditolak</h2>
          <p style={S.kecil}>Pendaftaran target kampus hanya untuk Owner dan Admin Manajer.</p>
        </div>
      </div>
    );
  }

  function pilihSiswa(id) {
    setSiswaId(id);
    setPesan('');
    const t = targetPerSiswa[id];
    if (t) {
      // Kunci pilihan "idPtn§idProdi" dipakai supaya pencarian tidak ambigu.
      setP1(t.pilihan?.[0] ? kunci(t.pilihan[0]) : '');
      setP2(t.pilihan?.[1] ? kunci(t.pilihan[1]) : '');
      setSkor(t.skorTerakhirUtbk?.nilai ?? '');
      setKeteranganSkor(t.skorTerakhirUtbk?.keterangan || '');
    } else {
      setP1(''); setP2(''); setSkor(''); setKeteranganSkor('');
    }
    setAlasan('');
  }
  const kunci = (p) => `${p.idPtn}§${p.idProdi}`;
  const dariKunci = (k) => prodi.find((p) => kunci(p) === k) || null;

  async function simpan() {
    setSibuk(true);
    setPesan('');
    try {
      const d1 = dariKunci(p1);
      const d2 = dariKunci(p2);
      const pilihan = [
        { urutan: 1, idPtn: d1?.idPtn, idProdi: d1?.id, labelPribadi: 'impian' },
        ...(d2 ? [{ urutan: 2, idPtn: d2?.idPtn, idProdi: d2?.id, labelPribadi: 'cadangan' }] : []),
      ];
      const perubahan = {
        pilihan,
        skorTerakhirUtbk: skorAngka === null ? null : {
          nilai: skorAngka,
          keterangan: keteranganSkor.trim() || 'input admin tanpa keterangan',
          diperbaruiPada: new Date().toISOString(),
        },
      };
      let targetBaru;
      let riwayat = null;
      if (targetLama) {
        if (!alasan.trim()) { setPesan('Target lama ada. Isi ALASAN perubahan dulu — riwayat tanpa alasan tidak berguna saat konsultasi berikutnya.'); setSibuk(false); return; }
        const r = buatVersiBaru(targetLama, perubahan, {
          alasanPerubahan: alasan.trim(),
          diubahOleh: ambilSesiAdmin()?.nama || (isOwnerSession() ? 'owner' : 'admin'),
        });
        if (r.ditolak) { setPesan(`Ditolak: ${r.ditolak.alasan}`); setSibuk(false); return; }
        targetBaru = r.target;
        riwayat = r.riwayat;
      } else {
        targetBaru = bentukTarget({
          studentId: siswaTerpilih.studentId || siswaTerpilih.id,
          tahunSeleksi: new Date().getFullYear() + 1,
          pilihan,
          ...perubahan,
        });
        const cek = validasiTarget(targetBaru);
        if (!cek.sah) { setPesan(`Ditolak: ${cek.masalah.join('; ')}`); setSibuk(false); return; }
      }
      await setDoc(doc(db, 'target_kampus_siswa', siswaTerpilih.studentId || siswaTerpilih.id), {
        ...targetBaru,
        diperbaruiPada: serverTimestamp(),
      });
      if (riwayat) {
        await addDoc(collection(db, 'target_kampus_riwayat'), { ...riwayat, pada: serverTimestamp() });
      }
      catatAudit(targetLama ? 'ptn.target.perbarui' : 'ptn.target.buat', {
        kategori: KATEGORI.SISWA,
        target: siswaTerpilih.nama,
        detail: {
          studentId: siswaTerpilih.studentId || siswaTerpilih.id,
          versi: targetBaru.versi,
          pilihan1: d1 ? `${d1.namaPtn} — ${d1.namaProdi}` : null,
          pilihan2: d2 ? `${d2.namaPtn} — ${d2.namaProdi}` : null,
          lingkungan: LINGKUNGAN_FIREBASE,
        },
      });
      segarkanDataTargetKampus(siswaTerpilih.studentId || siswaTerpilih.id);
      setTargetPerSiswa((lama) => ({ ...lama, [siswaId]: targetBaru }));
      setPesan(`Tersimpan (versi ${targetBaru.versi}). Tampilan siswa kelas 12 ini akan berubah di dashboard-nya.`);
    } catch (e) {
      setPesan(`Gagal menyimpan: ${e.message}`);
    } finally {
      setSibuk(false);
    }
  }

  return (
    <div style={S.wrap}>
      <h1 style={S.judul}><Landmark size={22} color="#7c3aed" /> Pendaftaran Target Kampus (Kelas 12)</h1>
      <p style={S.sub}>
        Alur konsultasi: siswa didampingi memilih Pilihan 1 &amp; 2 → angka di bawah keluar dari
        database PTN → simpan → chip goal muncul di depan nama &amp; NIM siswa di dashboard-nya.
        Siswa SD/SMP/kelas 10-11 tidak terpengaruh karena tidak didaftarkan di sini.
      </p>

      {LINGKUNGAN_FIREBASE === 'produksi' && (
        <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#991b1b', borderRadius: 12, padding: '10px 14px', fontSize: 12.5, marginBottom: 14 }}>
          Menunjuk Firestore <b>PRODUKSI</b>. Target yang disimpan langsung mengubah dashboard siswa.
        </div>
      )}
      {pesanMuat && <div style={{ ...S.kartu, color: '#991b1b' }}>{pesanMuat}</div>}

      <div style={S.kartu}>
        <div style={S.label}>Siswa kelas 12 ({muat ? 'memuat…' : `${siswa.length} siswa`})</div>
        <select style={S.pilih} value={siswaId} onChange={(e) => pilihSiswa(e.target.value)}>
          <option value="">— pilih siswa —</option>
          {siswa.map((s) => (
            <option key={s.id} value={s.id}>
              {s.nama} · {s.kelasSekolah} · {s.studentId || s.id}{targetPerSiswa[s.id] ? ` · ✔ target v${targetPerSiswa[s.id].versi}` : ''}
            </option>
          ))}
        </select>
        {siswaTerpilih && targetLama && (
          <div style={{ ...S.kecil, marginTop: 8 }}>
            Target sekarang: versi {targetLama.versi}
            {targetLama.alasanPerubahan ? ` · alasan terakhir: ${targetLama.alasanPerubahan}` : ''}
          </div>
        )}
      </div>

      {siswaTerpilih && (
        <>
          <div style={S.kartu}>
            <div style={S.label}>Cari program studi (nama prodi / kampus / kode)</div>
            <div style={{ display: 'flex', gap: 8 }}>
              <Search size={16} style={{ color: '#94a3b8', alignSelf: 'center' }} />
              <input style={S.input} value={cari} onChange={(e) => setCari(e.target.value)} placeholder="mis. kedokteran, UNEJ, sistem informasi…" />
            </div>
            {hasilCari.length > 0 && (
              <div style={{ marginTop: 8, maxHeight: 220, overflow: 'auto', border: '1px solid #e2e8f0', borderRadius: 10 }}>
                {hasilCari.map((p) => (
                  <div key={p.id} style={{ display: 'flex', gap: 8, padding: '8px 10px', borderBottom: '1px solid #f1f5f9', fontSize: 12.5, alignItems: 'center' }}>
                    <div style={{ flex: 1 }}>
                      <b>{p.namaProdi}</b> · {p.namaPtn} {p.kampus ? `(${p.kampus})` : ''} · {p.jenjang}
                      <div style={S.kecil}>
                        acuan min {p.skorReferensi?.minimum?.nilai ?? '—'} / rata {p.skorReferensi?.rataRata?.nilai ?? '—'} / maks {p.skorReferensi?.maksimum?.nilai ?? '—'} · tampung {p.dayaTampung?.nilai ?? '—'}
                      </div>
                    </div>
                    <button type="button" style={{ ...S.tombol, padding: '6px 10px', fontSize: 11.5 }} onClick={() => { if (!p1) setP1(kunci(p)); else setP2(kunci(p)); setCari(''); }}>
                      {p1 ? '→ Pilihan 2' : '→ Pilihan 1'}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div style={{ ...S.kartu, padding: 12 }}>
            <div style={S.label}>Skor try out skala UTBK terakhir (input konsultasi)</div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <input style={{ ...S.input, flex: '0 0 120px' }} type="number" value={skor} onChange={(e) => setSkor(e.target.value)} placeholder="mis. 685" />
              <input style={{ ...S.input, flex: '1 1 240px' }} value={keteranganSkor} onChange={(e) => setKeteranganSkor(e.target.value)} placeholder="keterangan wajib: mis. TO 4 Gemilang, 22 Jan 2027" />
            </div>
            <div style={{ ...S.kecil, marginTop: 6 }}>
              Angka ini BUKAN skor UTBK resmi dan bukan hasil perhitungan aplikasi — ia catatan
              konsultasi. Karena itu keterangannya wajib diisi.
            </div>
          </div>

          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <KartuProdi judul="PILIHAN 1 (UTAMA)" prodi={docP1} skor={skorAngka} />
            <KartuProdi judul="PILIHAN 2 (JARING PENGAMAN)" prodi={docP2} skor={skorAngka} />
          </div>

          {formasi && (
            <div style={{ ...S.kartu, borderLeft: `4px solid ${formasi.aman ? '#16a34a' : '#d97706'}` }}>
              <b style={{ fontSize: 13.5, color: formasi.aman ? '#15803d' : '#b45309' }}>Formasi: {formasi.label}</b>
              <ul style={{ margin: '8px 0 0', paddingLeft: 18 }}>
                {formasi.catatan.map((c, i) => <li key={i} style={{ fontSize: 12.5, color: '#475569', lineHeight: 1.7 }}>{c}</li>)}
              </ul>
            </div>
          )}

          <div style={S.kartu}>
            {targetLama && (
              <>
                <div style={S.label}>Alasan perubahan (wajib untuk target yang sudah ada)</div>
                <input style={S.input} value={alasan} onChange={(e) => setAlasan(e.target.value)} placeholder="mis. hasil konsultasi 10 Okt: reposisi Pilihan 2 ke zona hijau" />
              </>
            )}
            <div style={{ marginTop: 12, display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
              <button type="button" style={(!p1 || sibuk) ? S.tombolMati : S.tombol} disabled={!p1 || sibuk} onClick={simpan}>
                <Save size={16} /> {targetLama ? `Simpan sebagai versi ${(targetLama.versi || 0) + 1}` : 'Daftarkan target (versi 1)'}
              </button>
              <span style={S.kecil}>{sanggahanSkor()}</span>
            </div>
            {pesan && <div style={{ marginTop: 10, fontSize: 13, color: pesan.startsWith('Tersimpan') ? '#15803d' : '#991b1b' }}>{pesan}</div>}
          </div>
        </>
      )}

      {!muat && siswa.length === 0 && !pesanMuat && (
        <div style={S.kartu}><Users size={18} /> Tidak ada siswa SMA kelas 12 terdaftar.</div>
      )}
    </div>
  );
}
