// src/pages/admin/ptn/TargetKampusSiswaPage.jsx
// ============================================================
// Alur konsultasi yang diminta owner (2026-10-10):
//   siswa konsultasi offline -> admin mendaftarkan Pilihan 1 & 2 ->
//   skor minimum/rata-rata/maksimum keluar dari database -> disimpan ->
//   tampilan siswa berubah (chip goal di depan nama & NIM + kartu target).
//
// 🔥 REVISI UI (2026-10-10, masukan owner setelah melihat versi pertama):
// "harusnya filter kampusnya dahulu, contoh dari awal pilih kota dulu,
//  kampus, prodi dan fakultas, dan ada informasinya seperti syarat apa aja
//  nilai dll, jadi admin bisa menjelaskan dulu sambil meyakinkan.
//  Kedepannya ini bisa diubah lewat admin."
//
// Maka pemilihannya kini BERTAHAP seperti percakapan konsultasi:
//   KOTA/PROVINSI -> KAMPUS (PTN) -> FAKULTAS (bila terdata) -> PRODI
// Setiap tingkat menampilkan informasinya sendiri (jumlah prodi, bentuk PTN,
// website; lalu syarat, skor acuan, daya tampung, peminat, subtes kunci),
// supaya admin bisa menjelaskan sambil meyakinkan -- bukan memilih dari
// kotak pencarian buta. Pencarian teks tetap ada sebagai jalan pintas.
//
// Dan datanya kini BISA DIUBAH LEWAT ADMIN: panel edit prodi memperbarui
// syarat, skor acuan, sumber, dan tanggal pengecekan langsung di dokumen
// Firestore. Status data hanya naik jadi 'terverifikasi' bila sumber resmi +
// URL + tanggal diisi ketiganya (utils/statusDataPtn.bungkusSkorHasilEdit).
// Setiap edit tercatat di field editLog dokumen DAN di audit_logs.
//
// Prinsip lama tetap berlaku:
// 1. ANGKA DITUNJUKKAN SEBELUM DISIMPAN.
// 2. SKOR SISWA DIINPUT ADMIN beserta keterangan wajib (belum ada penskoran
//    otomatis berskala UTBK di aplikasi).
// 3. PERUBAHAN TARGET MEMBUTUHKAN ALASAN (riwayat versi terpisah).
// 4. PERAN: seluruh akun area admin + Owner (keputusan owner 2026-10-10).
// ============================================================
import React, { useEffect, useMemo, useState } from 'react';
import {
  collection, collectionGroup, query, where, getDocs, doc, setDoc, addDoc, updateDoc, serverTimestamp,
} from 'firebase/firestore';
import { Search, Save, ShieldAlert, Landmark, Pencil, CheckCircle2, FileDown } from 'lucide-react';
import { db } from '../../../firebase';
import { bolehMasukAreaAdmin } from '../../../utils/roleAkses';
import { ambilSesiAdmin } from '../../../utils/adminAuth';
import { LINGKUNGAN_FIREBASE } from '../../../firebase';
import { ekstrakAngkaKelas } from '../../../utils/aksesKontenSiswa';
import { bentukTarget, validasiTarget, buatVersiBaru, susunPerbandingan } from '../../../utils/targetKampus';
import { isiSuratTarget } from '../../../utils/isiSuratTarget';
import { ambilAsetSurat, unduhSuratTarget } from '../../../utils/suratTargetPdf';
import { bandingkanSkor, nilaiFormasi, ZONA } from '../../../utils/zonaKesiapan';
import { labelUntukTampilan, sanggahanSkor, bungkusSkorHasilEdit, validasiEditProdi } from '../../../utils/statusDataPtn';
import { catatAudit, KATEGORI } from '../../../utils/auditLog';
import { segarkanDataTargetKampus } from '../../../services/dataTargetKampus';

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
  input: { width: '100%', padding: '9px 10px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 13, boxSizing: 'border-box', background: '#fff' },
  pilih: { width: '100%', padding: '9px 10px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 13, background: '#fff', boxSizing: 'border-box' },
  tombol: { display: 'inline-flex', alignItems: 'center', gap: 8, background: '#4C6EF5', color: '#fff', border: 'none', borderRadius: 10, padding: '10px 14px', fontWeight: 700, fontSize: 13, cursor: 'pointer' },
  tombolKecil: { display: 'inline-flex', alignItems: 'center', gap: 6, background: '#f1f5f9', color: '#334155', border: '1px solid #e2e8f0', borderRadius: 8, padding: '6px 10px', fontWeight: 700, fontSize: 11.5, cursor: 'pointer' },
  tombolMati: { display: 'inline-flex', alignItems: 'center', gap: 8, background: '#e2e8f0', color: '#94a3b8', border: 'none', borderRadius: 10, padding: '10px 14px', fontWeight: 700, fontSize: 13, cursor: 'not-allowed' },
  baris: { display: 'flex', gap: 10, padding: '9px 10px', borderBottom: '1px solid #f1f5f9', fontSize: 12.5, alignItems: 'center', cursor: 'pointer' },
  kecil: { fontSize: 11.5, color: '#64748b', lineHeight: 1.6 },
  zonaKotak: (w) => ({ border: `1px solid ${w}66`, background: `${w}0d`, borderRadius: 10, padding: '8px 10px', fontSize: 12.5, color: w, fontWeight: 700, marginTop: 8 }),
};

function LayarTolakAkses() {
  return (
    <div style={S.wrap}>
      <div style={{ ...S.kartu, textAlign: 'center', padding: 40 }}>
        <ShieldAlert size={34} color="#dc2626" style={{ margin: '0 auto 12px' }} />
        <h2 style={{ fontSize: 17, fontWeight: 800, color: '#1e293b', margin: '0 0 8px' }}>Sesi Tidak Terbaca</h2>
        <p style={S.kecil}>Silakan login ulang di halaman login admin, lalu kembali ke halaman ini.</p>
      </div>
    </div>
  );
}

export default function TargetKampusSiswaPage() {
  const boleh = bolehMasukAreaAdmin();

  const [siswa, setSiswa] = useState([]);
  const [ptn, setPtn] = useState([]);
  const [prodi, setProdi] = useState([]);
  const [targetPerSiswa, setTargetPerSiswa] = useState({});
  const [muat, setMuat] = useState(true);
  const [pesanMuat, setPesanMuat] = useState('');

  const [siswaId, setSiswaId] = useState('');
  const [provinsi, setProvinsi] = useState('');
  const [ptnId, setPtnId] = useState('');
  const [fakultas, setFakultas] = useState('');
  const [cari, setCari] = useState('');
  const [detail, setDetail] = useState(null);      // dokumen prodi yang sedang dijelaskan
  const [edit, setEdit] = useState(null);          // isi form edit prodi
  const [pesanEdit, setPesanEdit] = useState('');
  const [p1, setP1] = useState('');
  const [p2, setP2] = useState('');
  const [skor, setSkor] = useState('');
  const [keteranganSkor, setKeteranganSkor] = useState('');
  const [alasan, setAlasan] = useState('');
  const [sibuk, setSibuk] = useState(false);
  const [pesan, setPesan] = useState('');

  useEffect(() => {
    let hidup = true;
    (async () => {
      try {
        const [snapSiswa, snapPtn, snapProdi, snapTarget] = await Promise.all([
          getDocs(query(collection(db, 'students'), where('jenjang', '==', 'SMA'))),
          getDocs(collection(db, 'ptn')),
          getDocs(collectionGroup(db, 'prodi')),
          getDocs(collection(db, 'target_kampus_siswa')),
        ]);
        if (!hidup) return;
        setSiswa(snapSiswa.docs.map((d) => ({ id: d.id, ...d.data() }))
          .filter((s) => ekstrakAngkaKelas(s.kelasSekolah) === '12')
          .sort((a, b) => String(a.nama).localeCompare(String(b.nama))));
        setPtn(snapPtn.docs.map((d) => ({ id: d.id, ...d.data() })));
        setProdi(snapProdi.docs.map((d) => ({ id: d.id, ...d.data() })));
        const peta = {};
        snapTarget.forEach((d) => { peta[d.id] = d.data(); });
        setTargetPerSiswa(peta);
      } catch (e) {
        if (hidup) setPesanMuat(`Gagal memuat data: ${e.message}. Bila koleksi prodi masih kosong, jalankan dulu Impor Database PTN.`);
      } finally {
        if (hidup) setMuat(false);
      }
    })();
    return () => { hidup = false; };
  }, []);

  const kunci = (p) => `${p.idPtn}§${p.id}`;
  const dariKunci = (k) => prodi.find((p) => kunci(p) === k) || null;
  const siswaTerpilih = useMemo(() => siswa.find((s) => s.id === siswaId) || null, [siswa, siswaId]);
  const targetLama = siswaId ? targetPerSiswa[siswaId] || null : null;
  const docP1 = useMemo(() => dariKunci(p1), [prodi, p1]);
  const docP2 = useMemo(() => dariKunci(p2), [prodi, p2]);
  const skorAngka = skor === '' ? null : Number(skor);

  // ---- turunan cascading: kota -> kampus -> fakultas -> prodi ----
  const jumlahProdiPerPtn = useMemo(() => {
    const m = new Map();
    for (const p of prodi) m.set(p.idPtn, (m.get(p.idPtn) || 0) + 1);
    return m;
  }, [prodi]);

  const daftarProvinsi = useMemo(() => {
    const m = new Map();
    for (const t of ptn) {
      const n = jumlahProdiPerPtn.get(t.id) || 0;
      if (!n) continue; // kota tanpa prodi tidak ditawarkan: tidak ada yang bisa dipilih
      const w = t.provinsi || '—';
      m.set(w, (m.get(w) || 0) + n);
    }
    return [...m.entries()].sort((a, b) => a[0].localeCompare(b[0]));
  }, [ptn, jumlahProdiPerPtn]);

  const daftarPtn = useMemo(() => ptn
    .filter((t) => (jumlahProdiPerPtn.get(t.id) || 0) > 0 && (!provinsi || t.provinsi === provinsi))
    .sort((a, b) => String(a.nama).localeCompare(String(b.nama))), [ptn, provinsi, jumlahProdiPerPtn]);

  const prodiPtn = useMemo(() => prodi.filter((p) => p.idPtn === ptnId), [prodi, ptnId]);

  const daftarFakultas = useMemo(() => {
    const m = new Map();
    for (const p of prodiPtn) {
      if (!p.fakultas) continue;
      m.set(p.fakultas, (m.get(p.fakultas) || 0) + 1);
    }
    return [...m.entries()].sort((a, b) => a[0].localeCompare(b[0]));
  }, [prodiPtn]);

  const daftarProdi = useMemo(() => {
    const q = cari.toLowerCase().trim();
    let list = prodiPtn;
    if (fakultas) list = list.filter((p) => p.fakultas === fakultas);
    if (q) {
      list = prodi.filter((p) => `${p.namaProdi} ${p.namaPtn} ${p.id}`.toLowerCase().includes(q)).slice(0, 40);
    }
    return [...list].sort((a, b) => String(a.namaProdi).localeCompare(String(b.namaProdi)));
  }, [prodiPtn, prodi, fakultas, cari]);

  const formasi = docP1 && docP2
    ? nilaiFormasi(bandingkanSkor(skorAngka, docP1.skorReferensi), bandingkanSkor(skorAngka, docP2.skorReferensi))
    : null;

  if (!boleh) return <LayarTolakAkses />;

  function pilihSiswa(id) {
    setSiswaId(id);
    setPesan('');
    const t = targetPerSiswa[id];
    if (t) {
      setP1(t.pilihan?.[0] ? `${t.pilihan[0].idPtn}§${t.pilihan[0].idProdi}` : '');
      setP2(t.pilihan?.[1] ? `${t.pilihan[1].idPtn}§${t.pilihan[1].idProdi}` : '');
      setSkor(t.skorTerakhirUtbk?.nilai ?? '');
      setKeteranganSkor(t.skorTerakhirUtbk?.keterangan || '');
      const d0 = t.pilihan?.[0];
      if (d0) {
        const doc0 = prodi.find((p) => p.idPtn === d0.idPtn && p.id === d0.idProdi);
        if (doc0) { setProvinsi(ptn.find((t2) => t2.id === doc0.idPtn)?.provinsi || ''); setPtnId(doc0.idPtn); setFakultas(doc0.fakultas || ''); setDetail(doc0); }
      }
    } else {
      setP1(''); setP2(''); setSkor(''); setKeteranganSkor('');
    }
    setAlasan('');
  }

  function bukaDetail(p) {
    setDetail(p);
    setPesanEdit('');
    setEdit(null);
  }

  function mulaiEdit(p) {
    setEdit({
      syaratKhusus: p.syaratKhusus || '',
      min: p.skorReferensi?.minimum?.nilai ?? '',
      rata: p.skorReferensi?.rataRata?.nilai ?? '',
      maks: p.skorReferensi?.maksimum?.nilai ?? '',
      sumberUrl: p.skorReferensi?.minimum?.sumberUrl || '',
      diambilPada: p.skorReferensi?.minimum?.diambilPada || '',
      tahunSeleksi: p.skorReferensi?.minimum?.tahunSeleksi ?? '',
      resmi: p.skorReferensi?.minimum?.resmi === true,
    });
    setPesanEdit('');
  }

  async function simpanEdit() {
    if (!detail || !edit) return;
    const masalah = validasiEditProdi({
      skorMinimum: edit.min === '' ? null : edit.min,
      skorRataRata: edit.rata === '' ? null : edit.rata,
      skorMaksimum: edit.maks === '' ? null : edit.maks,
      sumberUrl: edit.sumberUrl || null,
      diambilPada: edit.diambilPada || null,
      tahunSeleksi: edit.tahunSeleksi === '' ? null : edit.tahunSeleksi,
    });
    if (masalah.length) { setPesanEdit(`Ditolak: ${masalah.join('; ')}`); return; }
    const opts = {
      sumberUrl: edit.sumberUrl || null,
      diambilPada: edit.diambilPada || null,
      tahunSeleksi: edit.tahunSeleksi === '' ? null : Number(edit.tahunSeleksi),
      resmi: edit.resmi === true,
    };
    const patch = {
      syaratKhusus: edit.syaratKhusus || null,
      skorReferensi: {
        minimum: bungkusSkorHasilEdit({ nilai: edit.min === '' ? null : edit.min, ...opts }),
        rataRata: bungkusSkorHasilEdit({ nilai: edit.rata === '' ? null : edit.rata, ...opts }),
        maksimum: bungkusSkorHasilEdit({ nilai: edit.maks === '' ? null : edit.maks, ...opts }),
      },
      statusData: bungkusSkorHasilEdit({ nilai: edit.min === '' ? null : edit.min, ...opts }).statusData,
      editLog: [
        ...(detail.editLog || []),
        {
          pada: new Date().toISOString(),
          oleh: ambilSesiAdmin()?.nama || 'owner',
          field: ['syaratKhusus', 'skorReferensi'],
        },
      ],
    };
    try {
      await updateDoc(doc(db, 'ptn', detail.idPtn, 'prodi', detail.id), patch);
      catatAudit('ptn.prodi.ubah', {
        kategori: KATEGORI.KONTEN,
        target: `${detail.namaPtn} — ${detail.namaProdi}`,
        detail: { prodiId: detail.id, statusBaru: patch.statusData, lingkungan: LINGKUNGAN_FIREBASE },
      });
      const baru = { ...detail, ...patch };
      setDetail(baru);
      setProdi((lama) => lama.map((p) => (p.id === detail.id && p.idPtn === detail.idPtn ? baru : p)));
      setEdit(null);
      setPesanEdit('Tersimpan. Semua layar yang membaca prodi ini akan memakai angka baru.');
    } catch (e) {
      setPesanEdit(`Gagal menyimpan: ${e.message}`);
    }
  }

  // Surat PDF bisa dicetak SEBELUM maupun sesudah simpan: saat konsultasi
  // berlangsung, admin sering butuh kertasnya di tangan orang tua dulu.
  async function cetakSurat() {
    const d1 = dariKunci(p1);
    const d2 = dariKunci(p2);
    if (!d1 || !siswaTerpilih) return;
    try {
      const peta = {};
      [d1, d2].filter(Boolean).forEach((d) => { peta[`${d.idPtn}|${d.id}`] = d; });
      const sementara = bentukTarget({
        studentId: siswaTerpilih.studentId || siswaTerpilih.id,
        tahunSeleksi: targetLama?.tahunSeleksi || new Date().getFullYear() + 1,
        versi: targetLama?.versi || 1,
        pilihan: [
          { urutan: 1, idPtn: d1.idPtn, idProdi: d1.id },
          ...(d2 ? [{ urutan: 2, idPtn: d2.idPtn, idProdi: d2.id }] : []),
        ],
      });
      const perb = susunPerbandingan(sementara, peta, skorAngka);
      const isi = isiSuratTarget({
        siswa: siswaTerpilih, target: sementara, pilihan: perb.pilihan, skor: skorAngka,
        meta: { namaKonselor: ambilSesiAdmin()?.nama || '' },
      });
      const aset = await ambilAsetSurat();
      await unduhSuratTarget(isi, aset);
    } catch (e) {
      setPesan(`Gagal mencetak surat: ${e.message}`);
    }
  }

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
        skorTerakhirUtbk: skorAngka === null || !Number.isFinite(skorAngka) ? null : {
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
          diubahOleh: ambilSesiAdmin()?.nama || 'owner',
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
        Alur konsultasi bertahap: <b>kota → kampus → fakultas → prodi</b>. Setiap tingkat
        menampilkan informasinya supaya bisa dijelaskan ke siswa & orang tua sebelum dikunci.
        Data prodi (syarat, skor acuan, sumber) dapat diubah langsung dari halaman ini.
      </p>

      {LINGKUNGAN_FIREBASE === 'produksi' && (
        <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#991b1b', borderRadius: 12, padding: '10px 14px', fontSize: 12.5, marginBottom: 14 }}>
          Menunjuk Firestore <b>PRODUKSI</b>. Koleksi yang ditulis halaman ini (ptn, prodi,
          target_kampus_siswa) tidak dibaca oleh kode aplikasi yang terpasang di HP siswa.
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

      {/* ============ PEMILIH BERTAHAP ============ */}
      <div style={S.kartu}>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <div style={{ flex: '1 1 160px' }}>
            <div style={S.label}>1 · Kota / Provinsi</div>
            <select style={S.pilih} value={provinsi} onChange={(e) => { setProvinsi(e.target.value); setPtnId(''); setFakultas(''); setDetail(null); }}>
              <option value="">— semua —</option>
              {daftarProvinsi.map(([w, n]) => <option key={w} value={w}>{w} ({n} prodi)</option>)}
            </select>
          </div>
          <div style={{ flex: '2 1 240px' }}>
            <div style={S.label}>2 · Kampus (PTN)</div>
            <select style={S.pilih} value={ptnId} onChange={(e) => { setPtnId(e.target.value); setFakultas(''); setDetail(null); }}>
              <option value="">— pilih kampus —</option>
              {daftarPtn.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.nama} · {jumlahProdiPerPtn.get(t.id)} prodi
                </option>
              ))}
            </select>
          </div>
          <div style={{ flex: '1 1 180px' }}>
            <div style={S.label}>3 · Fakultas {daftarFakultas.length === 0 && ptnId ? '(belum terdata)' : ''}</div>
            <select style={S.pilih} value={fakultas} disabled={daftarFakultas.length === 0} onChange={(e) => { setFakultas(e.target.value); setDetail(null); }}>
              <option value="">— semua —</option>
              {daftarFakultas.map(([f, n]) => <option key={f} value={f}>{f} ({n})</option>)}
            </select>
          </div>
        </div>

        {ptnId && (() => {
          const t = ptn.find((x) => x.id === ptnId);
          if (!t) return null;
          return (
            <div style={{ ...S.kecil, marginTop: 10, background: '#f8fafc', borderRadius: 10, padding: '8px 10px' }}>
              <b>{t.nama}</b> ({t.singkatan}) · {t.bentukPtn} · {t.provinsi} · klaster sumber: {t.klasterKeketatanSumber || '—'}
              {t.websiteResmi ? <> · <a href={t.websiteResmi} target="_blank" rel="noreferrer">{t.websiteResmi.replace('https://', '')}</a></> : null}
              {t.jalurSeleksi === 'di_luar_snbt' && <span style={{ color: '#b45309' }}> · ⚠ jalur seleksi di luar SNBT/UTBK</span>}
            </div>
          );
        })()}

        <div style={{ display: 'flex', gap: 8, marginTop: 12, alignItems: 'center' }}>
          <Search size={15} style={{ color: '#94a3b8' }} />
          <input style={S.input} value={cari} onChange={(e) => setCari(e.target.value)} placeholder="jalan pintas: ketik nama prodi / kampus / kode untuk melompati tingkat di atas" />
        </div>

        <div style={{ marginTop: 10, maxHeight: 300, overflow: 'auto', border: '1px solid #e2e8f0', borderRadius: 10 }}>
          {daftarProdi.length === 0 && (
            <div style={{ padding: 14, fontSize: 12.5, color: '#94a3b8' }}>
              {ptnId ? 'Tidak ada prodi pada saringan ini.' : 'Pilih kota & kampus dulu, atau pakai jalan pintas pencarian.'}
            </div>
          )}
          {daftarProdi.map((p) => {
            const lab = labelUntukTampilan(p.skorReferensi?.minimum);
            return (
              <div key={p.id} style={{ ...S.baris, background: detail?.id === p.id ? '#f5f3ff' : undefined }} onClick={() => bukaDetail(p)}>
                <div style={{ flex: 1 }}>
                  <b>{p.namaProdi}</b> <span style={{ color: '#94a3b8' }}>· {p.jenjang}{p.bidang ? ` · ${p.bidang}` : ''}{p.kampus ? ` · ${p.kampus}` : ''}</span>
                  <div style={S.kecil}>
                    acuan min <b style={{ color: lab.peringatan ? '#b45309' : '#16a34a' }}>{lab.teks}</b>
                    {' · rata '}{p.skorReferensi?.rataRata?.nilai ?? '—'}
                    {' · maks '}{p.skorReferensi?.maksimum?.nilai ?? '—'}
                    {' · tampung '}{p.dayaTampung?.nilai ?? '—'}
                    {' · peminat '}{p.peminat?.nilai ?? '—'}
                    {p.syaratKhusus && p.syaratKhusus !== 'Tidak Ada Syarat Khusus' ? ' · ⚠ syarat khusus' : ''}
                  </div>
                </div>
                <span style={{ fontSize: 10.5, color: '#94a3b8' }}>{p.statusData}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* ============ PANEL PENJELASAN & EDIT ============ */}
      {detail && (
        <div style={{ ...S.kartu, borderLeft: '4px solid #7c3aed' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
            <div>
              <b style={{ fontSize: 14.5, color: '#1e293b' }}>{detail.namaProdi}</b>
              <div style={{ fontSize: 12.5, color: '#64748b' }}>
                {detail.namaPtn}{detail.fakultas ? ` · ${detail.fakultas}` : ''}{detail.kampus ? ` · ${detail.kampus}` : ''} · {detail.jenjang}{detail.bidang ? ` · ${detail.bidang}` : ''}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button type="button" style={S.tombolKecil} onClick={() => (edit ? setEdit(null) : mulaiEdit(detail))}>
                <Pencil size={12} /> {edit ? 'Tutup edit' : 'Ubah data prodi'}
              </button>
              <button type="button" style={S.tombolKecil} onClick={() => setP1(kunci(detail))}>→ Pilihan 1</button>
              <button type="button" style={S.tombolKecil} onClick={() => setP2(kunci(detail))}>→ Pilihan 2</button>
            </div>
          </div>

          {!edit && (
            <div style={{ fontSize: 12.5, color: '#334155', marginTop: 10, lineHeight: 1.9 }}>
              <div>
                Skor acuan: minimum <b>{detail.skorReferensi?.minimum?.nilai ?? '—'}</b>
                {' · rata-rata '}{detail.skorReferensi?.rataRata?.nilai ?? '—'}
                {' · maksimum '}{detail.skorReferensi?.maksimum?.nilai ?? '—'}
                {' '}<i>({detail.skorReferensi?.minimum?.statusData === 'terverifikasi' ? 'terverifikasi' : 'estimasi, bukan angka resmi'})</i>
              </div>
              <div>Daya tampung {detail.dayaTampung?.nilai ?? '—'} · peminat {detail.peminat?.nilai ?? '—'} · keketatan {detail.keketatan ? `1 : ${Math.round(1 / detail.keketatan)}` : '—'}</div>
              <div>Syarat: {detail.syaratKhusus || 'tidak ada'}</div>
              {detail.subtesKunci && <div>Subtes kunci: {detail.subtesKunci}</div>}
              {detail.skorReferensi?.minimum?.sumberUrl && (
                <div style={S.kecil}>Sumber: <a href={detail.skorReferensi.minimum.sumberUrl} target="_blank" rel="noreferrer">{detail.skorReferensi.minimum.sumberUrl}</a>{detail.skorReferensi.minimum.diambilPada ? ` · dicek ${detail.skorReferensi.minimum.diambilPada}` : ''}</div>
              )}
              {skorAngka !== null && Number.isFinite(skorAngka) && (() => {
                const b = bandingkanSkor(skorAngka, detail.skorReferensi);
                const w = WARNA_ZONA[b.zona.id] || '#64748b';
                return b.zona.id === ZONA.TANPA_DATA
                  ? <div style={S.zonaKotak(w)}>Prodi belum punya skor acuan — zona tidak dihitung.</div>
                  : <div style={S.zonaKotak(w)}>{b.zona.nama} · selisih {b.gapMinimum >= 0 ? '+' : ''}{b.gapMinimum} · {b.zona.frekuensiDrill}</div>;
              })()}
            </div>
          )}

          {edit && (
            <div style={{ marginTop: 10 }}>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <input style={{ ...S.input, flex: '2 1 260px' }} value={edit.syaratKhusus} onChange={(e) => setEdit({ ...edit, syaratKhusus: e.target.value })} placeholder="syarat khusus (kosongkan bila tidak ada)" />
                <input style={{ ...S.input, flex: '0 0 90px' }} type="number" value={edit.min} onChange={(e) => setEdit({ ...edit, min: e.target.value })} placeholder="min" />
                <input style={{ ...S.input, flex: '0 0 90px' }} type="number" value={edit.rata} onChange={(e) => setEdit({ ...edit, rata: e.target.value })} placeholder="rata2" />
                <input style={{ ...S.input, flex: '0 0 90px' }} type="number" value={edit.maks} onChange={(e) => setEdit({ ...edit, maks: e.target.value })} placeholder="maks" />
              </div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 8 }}>
                <input style={{ ...S.input, flex: '2 1 260px' }} value={edit.sumberUrl} onChange={(e) => setEdit({ ...edit, sumberUrl: e.target.value })} placeholder="sumberUrl resmi, mis. https://snpmb.id/…" />
                <input style={{ ...S.input, flex: '0 0 150px' }} type="date" value={edit.diambilPada} onChange={(e) => setEdit({ ...edit, diambilPada: e.target.value })} />
                <input style={{ ...S.input, flex: '0 0 100px' }} type="number" value={edit.tahunSeleksi} onChange={(e) => setEdit({ ...edit, tahunSeleksi: e.target.value })} placeholder="tahun" />
              </div>
              <label style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 12.5, color: '#334155', marginTop: 8 }}>
                <input type="checkbox" checked={edit.resmi} onChange={(e) => setEdit({ ...edit, resmi: e.target.checked })} />
                Angka ini berasal dari sumber RESMI dan sudah dicek ke tautan di atas
              </label>
              <div style={{ marginTop: 10, display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                <button type="button" style={S.tombol} onClick={simpanEdit}><CheckCircle2 size={15} /> Simpan perubahan prodi</button>
                <span style={S.kecil}>Status naik ke “terverifikasi” hanya bila sumber resmi + URL + tanggal terisi ketiganya.</span>
              </div>
              {pesanEdit && <div style={{ marginTop: 8, fontSize: 12.5, color: pesanEdit.startsWith('Tersimpan') ? '#15803d' : '#991b1b' }}>{pesanEdit}</div>}
            </div>
          )}
        </div>
      )}

      {/* ============ SKOR & FORMASI ============ */}
      {siswaTerpilih && (
        <>
          <div style={S.kartu}>
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
            {[['PILIHAN 1 (UTAMA)', docP1], ['PILIHAN 2 (JARING PENGAMAN)', docP2]].map(([judul, d]) => (
              <div key={judul} style={{ ...S.kartu, flex: '1 1 300px' }}>
                <div style={S.label}>{judul}</div>
                {d ? (
                  <>
                    <div style={{ fontSize: 14, fontWeight: 800, color: '#1e293b' }}>{d.namaProdi}</div>
                    <div style={{ fontSize: 12.5, color: '#64748b' }}>{d.namaPtn}{d.kampus ? ` · ${d.kampus}` : ''}</div>
                    {skorAngka !== null && Number.isFinite(skorAngka) && (() => {
                      const b = bandingkanSkor(skorAngka, d.skorReferensi);
                      const w = WARNA_ZONA[b.zona.id] || '#64748b';
                      return b.zona.id === ZONA.TANPA_DATA
                        ? <div style={S.zonaKotak(w)}>Belum punya skor acuan.</div>
                        : <div style={S.zonaKotak(w)}>{b.zona.nama} · selisih {b.gapMinimum >= 0 ? '+' : ''}{b.gapMinimum}</div>;
                    })()}
                  </>
                ) : (
                  <div style={{ fontSize: 12.5, color: '#94a3b8' }}>Belum dipilih</div>
                )}
              </div>
            ))}
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
              <button type="button" style={!p1 ? S.tombolMati : { ...S.tombol, background: '#7c3aed' }} disabled={!p1} onClick={cetakSurat}>
                <FileDown size={16} /> Cetak Surat Target (PDF)
              </button>
              <span style={S.kecil}>{sanggahanSkor()}</span>
            </div>
            {pesan && <div style={{ marginTop: 10, fontSize: 13, color: pesan.startsWith('Tersimpan') ? '#15803d' : '#991b1b' }}>{pesan}</div>}
          </div>
        </>
      )}
    </div>
  );
}
