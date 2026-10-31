// src/pages/admin/RaportOtomatisPage.jsx
// ============================================================
// RAPORT OTOMATIS (Fase 1, keputusan owner 21 Okt 2026 — blueprint
// ANALISIS-RAPORT-OTOMATIS.md §9): mesin agregasi mengubah log aktivitas
// 3 bulan (kuis, try out, latihan harian, absensi, tugas, XP) menjadi
// raport bulanan + laporan besar, TANPA beban tambahan untuk guru.
//
// Alur halaman: pilih periode & jenjang → HITUNG (pratinjau di layar,
// belum menulis apa pun) → TERBITKAN (snapshot permanen terkunci ke
// `raport_final`, id dokumen deterministik = idempoten) → backfill
// Agu–Okt 2026 sekali jalan untuk laporan besar.
//
// 🔥 FASE 2 (21 Okt 2026): CETAK PDF per siswa & massal per jenjang/kelas
// lewat engine cetak yang sudah distabilkan (cetakLewatIframe — font siap,
// gambar ter-decode, @page A4). HTML dibangun utils/raportCetak.js (murni,
// teruji tests/raportCetak.test.mjs) dari dokumen yang sama persis dengan
// yang diterbitkan (bangunDokumenRaport) — yang dilihat = yang dicetak =
// yang tersimpan. Catatan guru (raport_catatan_guru, opsional) ikut
// tercetak pada cetak tunggal; cetak massal tanpa catatan (disebut di sampul).
//
// KEPUTUSAN PENTING:
//   - Semua perhitungan ada di src/utils/raportOtomatis.js (MURNI +
//     teruji tests/raportOtomatis.test.mjs). Halaman ini hanya memuat
//     data mentah, memanggil mesin, dan menulis hasilnya.
//   - Snapshot terkunci (terkunci:true, sumber:'otomatis'). Terbit ulang
//     butuh centang paksa + alasan tertulis >= 5 karakter yang masuk
//     audit_logs — tidak ada edit diam-diam (blueprint §5.3).
//   - Dokumen proses/tren disimpan sebagai blok:'proses' di koleksi
//     raport_final yang SUDAH ADA — tidak ada koleksi baru. Tampilan
//     siswa menyaringnya sampai Fase 2 merancang presentasinya.
//   - Biaya baca: halaman ini memindai koleksi penuh sekali muat (pola
//     yang sama dengan LaporanOrangTuaPage) — dijalankan admin per
//     kejadian, bukan real-time. Otomasi terjadwal = Fase 3 (API).
// ============================================================

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import SidebarAdmin from '../../components/SidebarAdmin';
import { collection, getDocs, getDoc, setDoc, doc, serverTimestamp, query, where } from 'firebase/firestore';
import { db } from '../../firebase';
import {
  hitungRaportSemuaSiswa, rentangPeriode, bangunDokumenRaport,
  bolehTimpaRaportFinal, VERSI_MESIN, MAPEL_PROSES, cocokSasaran, buatRingkasan,
} from '../../utils/raportOtomatis';
import { htmlRaportSiswa, htmlRaportMassal, judulCetakRaport, labelPeriodeManusiawi } from '../../utils/raportCetak';
import { cetakLewatIframe } from '../../utils/kwitansi';
import { RAPORT_COLLECTIONS } from '../../firebase/raportCollection';
import { catatAudit, aktorSaatIni, KATEGORI } from '../../utils/auditLog';
import { FIELD_LAPORAN_BELAJAR, bentukSakelarLaporan, pengisianDibuka } from '../../utils/laporanBelajar';

const gayaKartu = { background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: 14 };
const gayaTh = { border: '1px solid #cbd5e1', padding: '5px 8px', textAlign: 'left', background: '#f1f5f9', fontSize: 11.5 };
const gayaTd = { border: '1px solid #cbd5e1', padding: '5px 8px', fontSize: 11.5, verticalAlign: 'top' };

const warnaPredikat = (huruf) => ({ A: '#166534', B: '#1d4ed8', C: '#b45309', D: '#991b1b', '—': '#64748b' }[huruf] || '#334155');
const warnaStatus = (s) => ({ hijau: '#16a34a', kuning: '#ca8a04', merah: '#dc2626', abu: '#94a3b8' }[s] || '#94a3b8');

// Penjelasan manusiawi untuk jenis data yang dilewati mesin (jujur, bukan
// gangguan aplikasi). Jenis baru cukup ditambah satu baris di sini.
const LABEL_MASALAH_LOG = {
  'sesi-tanpa-paket': 'sesi try out berstatus SELESAI yang paket soalnya tak ditemukan di koleksi (paket terhapus/dipindah) — tidak diskor, karena menghitung tanpa paket = mengarang',
};
const ringkasMasalah = (daftar = []) => {
  const g = new Map();
  for (const x of daftar) g.set(x.jenis, (g.get(x.jenis) || 0) + 1);
  return [...g.entries()];
};

const fmtAngka = (n) => (Number.isFinite(n) ? n : '—');

function bulanIni() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

export default function RaportOtomatisPage() {
  const [isMobile] = useState(window.innerWidth <= 1024);

  // ---------------- data mentah ----------------
  const [mentah, setMentah] = useState(null);
  const [statusMuat, setStatusMuat] = useState('');
  const [errorMuat, setErrorMuat] = useState('');

  // ---------------- pilihan periode & sasaran ----------------
  const [modePeriode, setModePeriode] = useState('bulan'); // 'bulan' | 'rentang'
  const [bulan, setBulan] = useState(bulanIni());
  const [mulaiBulan, setMulaiBulan] = useState('2026-08');
  const [selesaiBulan, setSelesaiBulan] = useState('2026-10');
  const [jenjang, setJenjang] = useState('Semua');
  const [kelas, setKelas] = useState('Semua');

  // ---------------- hasil hitung & terbit ----------------
  const [hasil, setHasil] = useState(null);
  const [sedangMenghitung, setSedangMenghitung] = useState(false);
  const [dibuka, setDibuka] = useState(null); // studentId baris yang diperluas
  const [paksa, setPaksa] = useState(false);
  const [alasanPaksa, setAlasanPaksa] = useState('');
  const [sedangTerbit, setSedangTerbit] = useState(false);
  const [progresTerbit, setProgresTerbit] = useState('');
  const [hasilTerbit, setHasilTerbit] = useState(null);
  const [sedangBackfill, setSedangBackfill] = useState(false);
  const [cetakSetelahTerbit, setCetakSetelahTerbit] = useState(false); // v1.2: satu alur utama
  const [progresBackfill, setProgresBackfill] = useState('');

  // ---------------- sakelar pengisian laporan belajar (guru) ----------------
  const [sakelarLaporan, setSakelarLaporan] = useState(null);
  const [sedangSakelar, setSedangSakelar] = useState(false);

  // ---------------- MUAT DATA MENTAH ----------------
  const muat = useCallback(async () => {
    setStatusMuat('memuat koleksi…');
    setErrorMuat('');
    try {
      const [snapSiswa, snapKuis, snapSesi, snapPaket, snapAbsen, snapTugas, snapGrades, snapProgSoal, snapProgSiswa] = await Promise.all([
        getDocs(collection(db, 'students')),
        getDocs(collection(db, 'jawaban_kuis')),
        getDocs(collection(db, 'tryout_sesi')),
        getDocs(collection(db, 'tryout_paket')),
        getDocs(collection(db, 'attendance')),
        getDocs(collection(db, 'jawaban_tugas')),
        getDocs(collection(db, 'grades')),
        getDocs(collection(db, 'siswa_soal_progress')),
        getDocs(collection(db, 'siswa_progress')),
      ]);
      const mapSnap = (s) => s.docs.map((d) => ({ id: d.id, ...d.data() }));
      const data = {
        siswa: mapSnap(snapSiswa),
        kuis: mapSnap(snapKuis),
        sesi: mapSnap(snapSesi),
        paket: mapSnap(snapPaket),
        absensi: mapSnap(snapAbsen),
        tugas: mapSnap(snapTugas),
        nilaiGuru: mapSnap(snapGrades),
        progresSoal: mapSnap(snapProgSoal),
        progresSiswa: mapSnap(snapProgSiswa),
        soalMeta: {},
      };

      // Metadata bank_soal HANYA untuk butir yang dirujuk latihan harian
      // (soal di dalam paket TO sudah menyimpan skemanya sendiri di
      // daftarSoal). Firestore 'in' maks 30 nilai → chunking, pola sama
      // dengan LatihanAktivitasPage.
      const idSoal = [...new Set(data.progresSoal.map((p) => p.soalId).filter(Boolean))];
      const CAP = 900; // jaga-jaga biaya baca; kelebihan dilaporkan jujur
      const diambil = idSoal.slice(0, CAP);
      for (let i = 0; i < diambil.length; i += 30) {
        const potongan = diambil.slice(i, i + 30);

        const snapSoal = await getDocs(query(collection(db, 'bank_soal'), where('__name__', 'in', potongan)));
        snapSoal.forEach((d) => {
          const x = d.data();
          data.soalMeta[d.id] = {
            mataPelajaran: x.mataPelajaran || x.mapel || '',
            materi: x.materi || '',
            kesulitan: x.kesulitan || '',
          };
        });
      }
      setMentah(data);
      setStatusMuat(
        `${data.siswa.length} siswa · ${data.kuis.length} kuis · ${data.sesi.length} sesi TO · ${data.absensi.length} absensi · ${data.progresSoal.length} progres latihan · ${Object.keys(data.soalMeta).length}/${idSoal.length} metadata soal`
        + (idSoal.length > CAP ? ` (⚠️ metadata soal dibatasi ${CAP} butir termuda demi biaya baca)` : ''),
      );
    } catch (e) {
      setErrorMuat(`Gagal memuat data: ${e?.message || e}`);
      setStatusMuat('');
    }
  }, []);

  useEffect(() => {
    const t = setTimeout(() => muat(), 0);
    return () => clearTimeout(t);
  }, [muat]);

  const daftarJenjang = useMemo(() => {
    if (!mentah) return [];
    return ['Semua', ...new Set(mentah.siswa.map((s) => String(s.jenjang || '').trim()).filter(Boolean))].sort((a, b) => (a === 'Semua' ? -1 : b === 'Semua' ? 1 : a.localeCompare(b)));
  }, [mentah]);

  const daftarKelas = useMemo(() => {
    if (!mentah) return [];
    const semua = mentah.siswa.filter((s) => jenjang === 'Semua' || String(s.jenjang || '').trim() === jenjang);
    return ['Semua', ...new Set(semua.map((s) => String(s.kelas || s.kelasSekolah || s.tingkatKelas || '').trim()).filter(Boolean))].sort((a, b) => (a === 'Semua' ? -1 : b === 'Semua' ? 1 : a.localeCompare(b, undefined, { numeric: true })));
  }, [mentah, jenjang]);

  // ---------------- HITUNG (pratinjau) ----------------
  const periodeOpts = modePeriode === 'bulan' ? { bulan } : { mulai: mulaiBulan, selesai: selesaiBulan };

  // Periode yang akan dibuka untuk pengisian guru = periode yang sedang
  // dipilih admin di halaman ini (konsisten dengan rapor yang dicetak).
  const periodeLaporanKey = useMemo(() => {
    try { return rentangPeriode(periodeOpts).label; } catch { return ''; }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [modePeriode, bulan, mulaiBulan, selesaiBulan]);
  const periodeLaporanLabel = periodeLaporanKey ? labelPeriodeManusiawi(periodeLaporanKey) : '';

  // Muat sakelar pengisian laporan belajar yang sedang aktif (settings/global_config).
  useEffect(() => {
    let batal = false;
    getDoc(doc(db, 'settings', 'global_config'))
      .then((snap) => { if (!batal) setSakelarLaporan((snap.data() || {})[FIELD_LAPORAN_BELAJAR] || null); })
      .catch(() => { if (!batal) setSakelarLaporan(null); });
    return () => { batal = true; };
  }, []);

  // Buka/tutup periode pengisian laporan belajar untuk semua guru.
  const ubahSakelarLaporan = useCallback(async (buka) => {
    if (!periodeLaporanKey) { alert('Periode belum valid.'); return; }
    setSedangSakelar(true);
    try {
      const patch = bentukSakelarLaporan({
        dibuka: buka,
        periode: periodeLaporanKey,
        periodeLabel: periodeLaporanLabel,
        dibukaOleh: aktorSaatIni().aktorNama || 'admin',
        catatan: buka ? 'Dibuka dari halaman Raport Otomatis' : 'Ditutup dari halaman Raport Otomatis',
      });
      await setDoc(doc(db, 'settings', 'global_config'), { [FIELD_LAPORAN_BELAJAR]: { ...patch, diperbaruiAt: serverTimestamp() } }, { merge: true });
      setSakelarLaporan(patch);
      catatAudit(buka ? 'laporan.buka-pengisian' : 'laporan.tutup-pengisian', {
        kategori: KATEGORI.SISWA,
        target: `Pengisian laporan belajar ${periodeLaporanLabel || periodeLaporanKey}`,
        detail: { periode: periodeLaporanKey, dibuka: buka },
      });
    } catch (e) {
      alert(`Gagal memperbarui sakelar: ${e?.message || e}`);
    } finally {
      setSedangSakelar(false);
    }
  }, [periodeLaporanKey, periodeLaporanLabel]);

  const hitung = useCallback(async () => {
    if (!mentah) return;
    setSedangMenghitung(true);
    setHasilTerbit(null);
    try {
      // v1.1: mesin melihat SEMUA siswa (supaya logTakDikenal = orphan SUNGGUHAN,
      // bukan siswa di luar filter), lalu hasil disubset sesuai sasaran.
      const sasaran = { jenjang: jenjang === 'Semua' ? '' : jenjang, kelas: kelas === 'Semua' ? '' : kelas };
      const h = hitungRaportSemuaSiswa(mentah, periodeOpts, { sasaran });
      const subset = h.siswa.filter((r) => cocokSasaran(r, sasaran));
      setHasil({
        ...h,
        siswa: subset,
        ringkasan: buatRingkasan(subset, {
          logTakDikenal: h.ringkasan.logTakDikenal,
          logLuarSaringan: h.ringkasan.logLuarSaringan,
          logSiswaNonaktif: h.ringkasan.logSiswaNonaktif,
          siswaDikecualikan: h.ringkasan.siswaDikecualikan,
          dataBermasalah: h.ringkasan.dataBermasalah,
        }),
      });
      setDibuka(null);
    } catch (e) {
      setErrorMuat(`Gagal menghitung: ${e?.message || e}`);
    } finally {
      setSedangMenghitung(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- periodeOpts dibaca saat klik; sengaja tidak jadi dependensi agar tidak menghitung ulang sendiri
  }, [mentah, jenjang, kelas, modePeriode, bulan, mulaiBulan, selesaiBulan]);

  // v1.1: pratinjau TAK BOLEH basi — ganti jenjang/kelas/bulan langsung dihitung
  // ulang (insiden 31 Okt 2026: select '9 SMP' tapi tabel masih isi hitungan
  // '7 SMP', dikira filter rusak). Data sudah di memori, biaya hitung murah.
  useEffect(() => {
    if (mentah) hitung();
  }, [mentah, hitung]);

  // ---------------- TERBITKAN ----------------
  const tulisSatuPeriode = useCallback(async (optsPeriode, labelLangkah) => {
    if (!mentah) return { ditulis: 0, dilewati: 0, gagal: 0 };
    // v1.1: pola sama dengan pratinjau — mesin melihat semua siswa, yang
    // DITERBITKAN hanya subset sasaran (audit & dokumen konsisten tabel).
    const sasaran = { jenjang: jenjang === 'Semua' ? '' : jenjang, kelas: kelas === 'Semua' ? '' : kelas };
    const hSemua = hitungRaportSemuaSiswa(mentah, optsPeriode, { sasaran });
    const subset = hSemua.siswa.filter((r) => cocokSasaran(r, sasaran));
    const h = {
      ...hSemua,
      siswa: subset,
      ringkasan: buatRingkasan(subset, {
        logTakDikenal: hSemua.ringkasan.logTakDikenal,
        logLuarSaringan: hSemua.ringkasan.logLuarSaringan,
        logSiswaNonaktif: hSemua.ringkasan.logSiswaNonaktif,
        siswaDikecualikan: hSemua.ringkasan.siswaDikecualikan,
        dataBermasalah: hSemua.ringkasan.dataBermasalah,
      }),
    };
    const jendela = rentangPeriode(optsPeriode);
    let ditulis = 0; let dilewati = 0; let gagal = 0;
    const alasan = String(alasanPaksa || '').trim();
    const daftarDilewati = [];
    for (let i = 0; i < h.siswa.length; i += 1) {
      const r = h.siswa[i];
      setProgresTerbit(`${labelLangkah} — siswa ${i + 1}/${h.siswa.length}: ${r.studentName}`);
      const { docsAkademik, dokProses } = bangunDokumenRaport(r, {
        jejak: {
          jendela: { mulai: jendela.mulaiMs, selesai: jendela.selesaiMs, label: jendela.label },
          jumlahDokumenSumber: {
            kuis: mentah.kuis.length, sesi: mentah.sesi.length, absensi: mentah.absensi.length,
            tugas: mentah.tugas.length, latihan: mentah.progresSoal.length,
          },
        },
      });
      const semuaDok = [...docsAkademik, dokProses];
      for (const d of semuaDok) {
        try {
          const ref = doc(db, 'raport_final', d.id);

          const snapLama = await getDoc(ref);
          const guard = bolehTimpaRaportFinal(snapLama.exists() ? snapLama.data() : null, { paksa, alasan });
          if (!guard.boleh) {
            dilewati += 1;
            if (daftarDilewati.length < 10) daftarDilewati.push(`${r.studentName} · ${d.data.mapel} · ${jendela.label}`);
            continue;
          }
          const payload = { ...d.data };
          if (snapLama.exists()) {
            // dokumen lama ada: pertahankan createdAt aslinya (merge)
            payload.koreksiAlasan = guard.alasan || null;

            await setDoc(ref, { ...payload, updatedAt: serverTimestamp() }, { merge: true });
          } else {

            await setDoc(ref, { ...payload, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
          }
          ditulis += 1;
        } catch (e) {
          gagal += 1;
          console.error(`Gagal menulis raport ${d.id}:`, e);
        }
      }
    }
    return { ditulis, dilewati, gagal, daftarDilewati, periode: jendela.label, ringkasan: h.ringkasan };
  }, [mentah, jenjang, kelas, paksa, alasanPaksa]);

  const terbitkan = useCallback(async () => {
    if (!hasil) return;
    if (paksa && String(alasanPaksa || '').trim().length < 5) {
      alert('Terbit ulang paksa wajib menyertakan alasan tertulis minimal 5 karakter (masuk audit log).');
      return;
    }
    const label = modePeriode === 'bulan' ? `bulan ${bulan}` : `${mulaiBulan} s.d. ${selesaiBulan}`;
    if (!window.confirm(
      `Terbitkan raport ${label} untuk ${hasil.siswa.length} siswa?\n\n`
      + 'Snapshot akan TERKUNCI di raport_final (sumber: otomatis). '
      + (paksa ? 'Mode PAKSA aktif: dokumen terkunci lama akan ditimpa dengan alasan yang tercatat di audit.' : 'Dokumen terkunci yang sudah ada akan DILEWATI.')
      + '\n\nLanjutkan?',
    )) return;
    setSedangTerbit(true);
    setHasilTerbit(null);
    try {
      const r = await tulisSatuPeriode(periodeOpts, `Terbit ${label}`);
      catatAudit(paksa ? 'raport.terbitkan-ulang' : 'raport.terbitkan', {
        kategori: KATEGORI.SISWA,
        target: `Raport otomatis ${r.periode} — ${jenjang}${kelas !== 'Semua' ? ` kelas ${kelas}` : ''}`,
        detail: {
          periode: r.periode, ditulis: r.ditulis, dilewatiTerkenaKunci: r.dilewati, gagal: r.gagal,
          paksa: !!paksa, alasan: paksa ? alasanPaksa : null, versiMesin: VERSI_MESIN,
          jenjang, kelas, daftarDilewati: r.daftarDilewati || [],
        },
      });
      setHasilTerbit(r);
    } finally {
      setSedangTerbit(false);
      setProgresTerbit('');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- periodeOpts mengikuti state yang sudah jadi dependensi tulisSatuPeriode
  }, [hasil, paksa, alasanPaksa, tulisSatuPeriode, jenjang, kelas, modePeriode, bulan, mulaiBulan, selesaiBulan]);

  // ---------------- BACKFILL AGU–OKT 2026 ----------------
  const backfill = useCallback(async () => {
    if (!mentah) return;
    if (!window.confirm(
      'Backfill sekali jalan: menerbitkan raport bulanan 2026-08, 2026-09, 2026-10 '
      + 'DAN laporan besar 2026-08..2026-10 untuk sasaran yang sedang dipilih.\n\n'
      + 'Aman dijalankan ulang (id dokumen deterministik; yang terkunci dilewati kecuali mode paksa). Lanjutkan?',
    )) return;
    setSedangBackfill(true);
    setHasilTerbit(null);
    const langkah = [
      { opts: { bulan: '2026-08' }, label: 'Bulan 2026-08' },
      { opts: { bulan: '2026-09' }, label: 'Bulan 2026-09' },
      { opts: { bulan: '2026-10' }, label: 'Bulan 2026-10' },
      { opts: { mulai: '2026-08', selesai: '2026-10' }, label: 'Laporan besar Agu–Okt' },
    ];
    const rekap = [];
    try {
      for (const l of langkah) {
        setProgresBackfill(`⏳ ${l.label}…`);

        const r = await tulisSatuPeriode(l.opts, l.label);
        rekap.push({ label: l.label, ...r });
      }
      catatAudit('raport.backfill', {
        kategori: KATEGORI.SISWA,
        target: `Backfill Agu–Okt 2026 — ${jenjang}${kelas !== 'Semua' ? ` kelas ${kelas}` : ''}`,
        detail: { rekap: rekap.map((r) => ({ label: r.label, periode: r.periode, ditulis: r.ditulis, dilewati: r.dilewati, gagal: r.gagal })), paksa: !!paksa, versiMesin: VERSI_MESIN },
      });
      setHasilTerbit({ backfill: true, rekap });
    } finally {
      setSedangBackfill(false);
      setProgresBackfill('');
    }
  }, [mentah, jenjang, kelas, paksa, tulisSatuPeriode]);

  // ---------------- CETAK PDF (Fase 2) ----------------
  // Catatan guru opsional (raport_catatan_guru) digabung ke cetakan tunggal.
  // Query equality-only (studentId + periode) → tidak butuh composite index.
  const ambilCatatanGuru = useCallback(async (studentId, periode) => {
    try {
      const snap = await getDocs(query(
        collection(db, RAPORT_COLLECTIONS.CATATAN_GURU),
        where('studentId', '==', studentId),
        where('periode', '==', periode),
      ));
      return snap.docs
        .map((d) => {
          const x = d.data();
          const isi = String(x.catatan || '').trim();
          return isi ? `${x.mapel || 'Umum'}: ${isi}` : '';
        })
        .filter(Boolean)
        .join('\n');
    } catch {
      return ''; // catatan guru opsional — gagal baca tidak boleh memblokir cetakan
    }
  }, []);

  // Capaian yang diisi guru (laporan_belajar) untuk satu periode → peta
  // studentId -> [dok capaian]. Query equality tunggal (periode) agar tidak
  // butuh composite index; pengelompokan per siswa di sisi klien.
  const ambilLaporanGuru = useCallback(async (periode) => {
    if (!periode) return {};
    try {
      const snap = await getDocs(query(collection(db, 'laporan_belajar'), where('periode', '==', periode)));
      const peta = {};
      for (const d of snap.docs) {
        const x = d.data();
        const sid = String(x.studentId || '');
        if (!sid) continue;
        (peta[sid] = peta[sid] || []).push(x);
      }
      return peta;
    } catch {
      return {}; // capaian guru bersifat memperkaya — gagal baca tak memblokir cetakan
    }
  }, []);

  const cetakSatu = useCallback(async (r) => {
    try {
      // Dokumen cetak = dokumen terbit (bangunDokumenRaport) — satu kebenaran.
      const { docsAkademik, dokProses } = bangunDokumenRaport(r);
      const [catatan, petaLaporan] = await Promise.all([
        ambilCatatanGuru(r.studentId, r.periode),
        ambilLaporanGuru(r.periode),
      ]);
      cetakLewatIframe(
        htmlRaportSiswa({
          dokAkademik: docsAkademik.map((d) => d.data),
          dokProses: dokProses.data,
          catatanGuru: catatan,
          laporanGuru: petaLaporan[r.studentId] || [],
          identitas: { jenjang: r.jenjang },
        }),
        judulCetakRaport({ nama: r.studentName, periode: r.periode }),
      );
      catatAudit('raport.cetak', {
        kategori: KATEGORI.SISWA,
        target: `Cetak raport ${r.studentName} — ${r.periode}`,
        detail: { studentId: r.studentId, periode: r.periode, mode: 'tunggal', versiMesin: VERSI_MESIN, catatanGuruDisertakan: catatan.length > 0, capaianGuruDisertakan: (petaLaporan[r.studentId] || []).length },
      });
    } catch (e) {
      alert(`Gagal menyiapkan cetakan: ${e?.message || e}`);
    }
  }, [ambilCatatanGuru, ambilLaporanGuru]);

  const cetakSemua = useCallback(async () => {
    if (!hasil) return;
    const daftar = hasil.siswa;
    if (!daftar.length) { alert('Tidak ada siswa pada pratinjau ini.'); return; }
    if (daftar.length > 40 && !window.confirm(
      `Cetak massal ${daftar.length} siswa menghasilkan SATU dokumen panjang (± ${daftar.length + 1} halaman lebih). Lanjutkan?`,
    )) return;
    try {
      const petaLaporan = await ambilLaporanGuru(hasil.periode.label);
      const payload = daftar.map((r) => {
        const { docsAkademik, dokProses } = bangunDokumenRaport(r);
        return {
          dokAkademik: docsAkademik.map((d) => d.data),
          dokProses: dokProses.data,
          laporanGuru: petaLaporan[r.studentId] || [],
          identitas: { jenjang: r.jenjang },
        };
      });
      cetakLewatIframe(
        htmlRaportMassal({
          daftar: payload,
          judul: `Rapor ${jenjang === 'Semua' ? 'Semua Jenjang' : jenjang}${kelas !== 'Semua' ? ` — Kelas ${kelas}` : ''}`,
          periodeLabel: hasil.periode.label,
        }),
        `Rapor massal ${hasil.periode.label}`,
      );
      catatAudit('raport.cetak', {
        kategori: KATEGORI.SISWA,
        target: `Cetak massal raport ${hasil.periode.label} — ${jenjang}${kelas !== 'Semua' ? ` kelas ${kelas}` : ''}`,
        detail: { periode: hasil.periode.label, mode: 'massal', jumlahSiswa: daftar.length, jenjang, kelas, versiMesin: VERSI_MESIN },
      });
    } catch (e) {
      alert(`Gagal menyiapkan cetakan massal: ${e?.message || e}`);
    }
  }, [hasil, jenjang, kelas, ambilLaporanGuru]);

  // v1.2 diet tombol: satu alur utama — begitu penerbitan sukses tercatat,
  // dialog cetak PDF massal (SATU dokumen berisi rapor tiap siswa) terbuka
  // otomatis; flag dibersihkan sendiri sehingga tak pernah mencetak ganda.
  useEffect(() => {
    if (cetakSetelahTerbit && hasilTerbit && !hasilTerbit.backfill) {
      setCetakSetelahTerbit(false);
      cetakSemua();
    }
  }, [cetakSetelahTerbit, hasilTerbit, cetakSemua]);

  // ---------------- RENDER ----------------
  const h = hasil;
  const detail = h && dibuka ? h.siswa.find((x) => x.studentId === dibuka) : null;

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f8fafc' }}>
      <SidebarAdmin />
      {/* SidebarAdmin position:fixed (lebar 216) — konten WAJIB memberi offset
          kiri sendiri, kalau tidak ia menutupi panel kontrol & banner (insiden
          31 Okt 11.01 WIB: halaman ini satu-satunya yang lupa marginLeft). */}
      <div style={{ flex: 1, marginLeft: isMobile ? 0 : 216, padding: isMobile ? 12 : 22, minWidth: 0 }}>
        <h1 style={{ margin: '0 0 4px', fontSize: isMobile ? 18 : 22 }}>📊 Raport Otomatis</h1>
        <div style={{ fontSize: 12, color: '#475569', marginBottom: 14 }}>
          Agregasi otomatis log aktivitas (kuis · try out · latihan harian · absensi · tugas · XP) menjadi raport
          bulanan + laporan besar. Mesin <b>{VERSI_MESIN}</b> — angka tertelusur ke dokumen sumber; snapshot terbit terkunci.
        </div>

        {errorMuat && <div style={{ ...gayaKartu, borderColor: '#fecaca', background: '#fef2f2', color: '#991b1b', marginBottom: 12 }}>{errorMuat}</div>}

        {/* ============ PANEL KONTROL ============ */}
        <div style={{ ...gayaKartu, marginBottom: 14 }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'flex-end' }}>
            <label style={{ fontSize: 12 }}>
              <div style={{ marginBottom: 4, fontWeight: 700 }}>Mode periode</div>
              <select value={modePeriode} onChange={(e) => setModePeriode(e.target.value)} style={{ padding: '6px 8px', borderRadius: 8, border: '1px solid #cbd5e1' }}>
                <option value="bulan">Bulanan</option>
                <option value="rentang">Rentang (laporan besar)</option>
              </select>
            </label>
            {modePeriode === 'bulan' ? (
              <label style={{ fontSize: 12 }}>
                <div style={{ marginBottom: 4, fontWeight: 700 }}>Bulan</div>
                <input type="month" value={bulan} onChange={(e) => setBulan(e.target.value)} style={{ padding: '5px 8px', borderRadius: 8, border: '1px solid #cbd5e1' }} />
              </label>
            ) : (
              <>
                <label style={{ fontSize: 12 }}>
                  <div style={{ marginBottom: 4, fontWeight: 700 }}>Dari bulan</div>
                  <input type="month" value={mulaiBulan} onChange={(e) => setMulaiBulan(e.target.value)} style={{ padding: '5px 8px', borderRadius: 8, border: '1px solid #cbd5e1' }} />
                </label>
                <label style={{ fontSize: 12 }}>
                  <div style={{ marginBottom: 4, fontWeight: 700 }}>Sampai bulan</div>
                  <input type="month" value={selesaiBulan} onChange={(e) => setSelesaiBulan(e.target.value)} style={{ padding: '5px 8px', borderRadius: 8, border: '1px solid #cbd5e1' }} />
                </label>
              </>
            )}
            <label style={{ fontSize: 12 }}>
              <div style={{ marginBottom: 4, fontWeight: 700 }}>Jenjang</div>
              <select value={jenjang} onChange={(e) => { setJenjang(e.target.value); setKelas('Semua'); }} style={{ padding: '6px 8px', borderRadius: 8, border: '1px solid #cbd5e1' }}>
                {daftarJenjang.map((j) => <option key={j} value={j}>{j}</option>)}
              </select>
            </label>
            <label style={{ fontSize: 12 }}>
              <div style={{ marginBottom: 4, fontWeight: 700 }}>Kelas</div>
              <select value={kelas} onChange={(e) => setKelas(e.target.value)} style={{ padding: '6px 8px', borderRadius: 8, border: '1px solid #cbd5e1' }}>
                {daftarKelas.map((k) => <option key={k} value={k}>{k}</option>)}
              </select>
            </label>
          </div>
          <div style={{ marginTop: 8, fontSize: 11.5, color: '#64748b' }}>
            {statusMuat || (mentah ? '' : 'Memuat data mentah dari Firestore…')}
            {mentah && (
              <button type="button" onClick={muat} style={{ background: 'none', border: 'none', color: '#4338ca', fontSize: 11, cursor: 'pointer', textDecoration: 'underline', padding: 0, marginLeft: 8 }}>
                ⟳ muat ulang data mentah
              </button>
            )}
            {sedangMenghitung && <span style={{ color: '#4f46e5' }}> · menghitung…</span>}
            <span style={{ color: '#94a3b8' }}> · pratinjau dihitung otomatis setiap filter/periode berubah — tanpa tombol</span>
          </div>
        </div>

        {/* ============ SAKELAR PENGISIAN LAPORAN BELAJAR (GURU) ============ */}
        <div style={{ ...gayaKartu, marginBottom: 14, borderColor: '#c7d2fe', background: 'linear-gradient(135deg,#eef2ff,#faf5ff)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
            <div style={{ minWidth: 240, flex: '1 1 320px' }}>
              <b style={{ fontSize: 13.5, color: '#3730a3' }}>📝 Pengisian Laporan Belajar oleh Guru</b>
              <div style={{ fontSize: 11.5, color: '#4c1d95', marginTop: 3, lineHeight: 1.5 }}>
                Buka periode agar tiap guru mengisi capaian siswa mapelnya (sumber utama PDF orang tua). Menu muncul di dashboard guru dan hilang otomatis bila semua siswa sudah diisi.
              </div>
              <div style={{ fontSize: 11.5, color: '#475569', marginTop: 6 }}>
                Periode terpilih: <b>{periodeLaporanLabel || '—'}</b>
                {pengisianDibuka(sakelarLaporan).dibuka && (
                  <span style={{ marginLeft: 8, color: '#166534', background: '#dcfce7', border: '1px solid #bbf7d0', borderRadius: 99, padding: '1px 9px', fontWeight: 700 }}>
                    AKTIF: {sakelarLaporan.periodeLabel || sakelarLaporan.periode}
                  </span>
                )}
              </div>
              {pengisianDibuka(sakelarLaporan).dibuka && sakelarLaporan.periode !== periodeLaporanKey && (
                <div style={{ fontSize: 11, color: '#b45309', marginTop: 4 }}>⚠️ Periode aktif berbeda dari yang sedang dipilih. Membuka akan memindahkan pengisian ke periode terpilih.</div>
              )}
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {!pengisianDibuka(sakelarLaporan) || sakelarLaporan.periode !== periodeLaporanKey ? (
                <button type="button" disabled={sedangSakelar || !periodeLaporanKey} onClick={() => ubahSakelarLaporan(true)}
                  style={{ padding: '9px 16px', borderRadius: 9, border: 'none', background: '#4338ca', color: 'white', fontWeight: 700, fontSize: 12.5, cursor: sedangSakelar ? 'default' : 'pointer', opacity: sedangSakelar || !periodeLaporanKey ? 0.6 : 1 }}>
                  {sedangSakelar ? 'Memproses…' : '🔓 Buka Pengisian Periode Ini'}
                </button>
              ) : (
                <button type="button" disabled={sedangSakelar} onClick={() => ubahSakelarLaporan(false)}
                  style={{ padding: '9px 16px', borderRadius: 9, border: '1px solid #fca5a5', background: '#fef2f2', color: '#b91c1c', fontWeight: 700, fontSize: 12.5, cursor: sedangSakelar ? 'default' : 'pointer' }}>
                  {sedangSakelar ? 'Memproses…' : '🔒 Tutup Pengisian'}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* ============ HASIL PRATINJAU ============ */}
        {h && (
          <div style={{ ...gayaKartu, marginBottom: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8, alignItems: 'center', marginBottom: 8 }}>
              <b style={{ fontSize: 14 }}>Pratinjau periode {h.periode.label}</b>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                <span style={{ fontSize: 11.5, color: '#475569' }}>
                  {h.ringkasan.totalSiswa} siswa · {h.ringkasan.layakTerbit} layak terbit penuh · {h.ringkasan.belumCukup} data belum cukup · {h.ringkasan.totalPelanggaran} catatan pengawasan{h.ringkasan.siswaDikecualikan ? ` · ${h.ringkasan.siswaDikecualikan.jumlah} siswa nonaktif/diblokir dikecualikan` : ''}
                </span>
                <button type="button" onClick={() => { setCetakSetelahTerbit(true); terbitkan(); }} style={{ padding: '7px 14px', borderRadius: 8, border: 'none', background: '#16a34a', color: '#fff', fontWeight: 700, fontSize: 11.5, cursor: 'pointer' }}>
                  📄 Terbitkan & Cetak PDF ({h.ringkasan.totalSiswa} siswa)
                </button>
                <button type="button" onClick={cetakSemua} style={{ background: 'none', border: 'none', color: '#4338ca', fontSize: 10.5, cursor: 'pointer', textDecoration: 'underline', padding: 0 }}>
                  cetak draf tanpa menerbitkan
                </button>
              </div>
            </div>
            {h.ringkasan.logTakDikenal && Object.values(h.ringkasan.logTakDikenal).some((n) => n > 0) && (
              <div style={{ fontSize: 11.5, color: '#b45309', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 8, padding: '6px 10px', marginBottom: 8 }}>
                ⚠️ Ada log yang tidak cocok ke siswa mana pun (identitas berubah/hapus): {Object.entries(h.ringkasan.logTakDikenal).filter(([, n]) => n > 0).map(([k, n]) => `${k} ${n}`).join(', ')}. Tidak dihitung — perbaiki identitas siswa bila perlu.
              </div>
            )}
            {h.ringkasan.logLuarSaringan && Object.values(h.ringkasan.logLuarSaringan).some((n) => n > 0) && (
              <div style={{ fontSize: 11.5, color: '#1d4ed8', background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 8, padding: '6px 10px', marginBottom: 8 }}>
                ℹ️ Log periode ini milik siswa di luar jenjang/kelas sasaran: {Object.entries(h.ringkasan.logLuarSaringan).filter(([, n]) => n > 0).map(([k, n]) => `${k} ${n}`).join(', ')}. Tidak ditampilkan di tabel ini — dan BUKAN kesalahan identitas.
              </div>
            )}
            {h.ringkasan.siswaDikecualikan && (
              <div style={{ fontSize: 11.5, color: '#475569', background: '#f1f5f9', border: '1px solid #e2e8f0', borderRadius: 8, padding: '6px 10px', marginBottom: 8 }}>
                🚫 {h.ringkasan.siswaDikecualikan.jumlah} siswa nonaktif/diblokir TIDAK diikutkan ke laporan (kebijakan owner): {h.ringkasan.siswaDikecualikan.daftar.map((x) => `${x.nama || x.studentId} — ${x.alasan}`).join('; ')}. Log mereka dihitung terpisah, tidak dicampur ke siswa lain.
              </div>
            )}
            {h.ringkasan.dataBermasalah?.length > 0 && (
              <div style={{ fontSize: 11.5, color: '#991b1b', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '6px 10px', marginBottom: 8 }}>
                ⛔ Data dilewati JUJUR (bukan gangguan aplikasi): {ringkasMasalah(h.ringkasan.dataBermasalah).map(([jenis, n]) => `${n} ${LABEL_MASALAH_LOG[jenis] || jenis}`).join(' · ')}.
                Pulihkan paket try out terkait (atau arsipkan sesi-sesinya) supaya peringatan ini hilang dan angkanya ikut terhitung.
                <details style={{ marginTop: 4 }}>
                  <summary style={{ cursor: 'pointer', fontSize: 10.5, color: '#7f1d1d' }}>
                    Lihat ID sesi untuk pelacakan{h.ringkasan.dataBermasalah.length >= 20 ? ' (20 pertama — mesin membatasi daftar demi ukuran dokumen)' : ''}
                  </summary>
                  <div style={{ fontSize: 10.5, marginTop: 4, wordBreak: 'break-all' }}>
                    {h.ringkasan.dataBermasalah.map((x) => x.sesiId || x.jenis).join(', ')}
                  </div>
                </details>
              </div>
            )}
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    <th style={gayaTh}>Siswa</th>
                    <th style={gayaTh}>Kelas</th>
                    <th style={gayaTh}>Akademik (rata-rata mapel layak)</th>
                    <th style={gayaTh}>Proses</th>
                    <th style={gayaTh}>Mapel layak</th>
                    <th style={gayaTh}>Pengawasan</th>
                    <th style={gayaTh}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {h.siswa.map((r) => (
                    <tr key={r.studentId} onClick={() => setDibuka(dibuka === r.studentId ? null : r.studentId)} style={{ cursor: 'pointer', background: dibuka === r.studentId ? '#eef2ff' : undefined }}>
                      <td style={gayaTd}><b>{r.studentName}</b><div style={{ color: '#64748b', fontSize: 10.5 }}>{r.studentId}</div></td>
                      <td style={gayaTd}>{r.studentKelas || '—'}<div style={{ color: '#64748b', fontSize: 10.5 }}>{r.jenjang || '—'}</div></td>
                      <td style={gayaTd}>
                        <b style={{ color: warnaPredikat(r.akademik.predikat.huruf), fontSize: 13 }}>{fmtAngka(r.akademik.rataRata)} {r.akademik.predikat.huruf !== '—' ? `(${r.akademik.predikat.huruf})` : ''}</b>
                      </td>
                      <td style={gayaTd}>
                        <b style={{ color: warnaPredikat(r.proses.predikat.huruf), fontSize: 13 }}>{fmtAngka(r.proses.nilaiProses)}{r.proses.nilaiProses !== null ? ` (${r.proses.predikat.huruf})` : ''}</b>
                      </td>
                      <td style={gayaTd}>{r.kelayakan.mapelLayak}/{r.kelayakan.mapelTotal}</td>
                      <td style={gayaTd}>{r.proses.integritas.jumlahPelanggaran > 0 ? <span style={{ color: '#b45309', fontWeight: 700 }}>{r.proses.integritas.jumlahPelanggaran} catatan</span> : 'bersih'}</td>
                      <td style={gayaTd}>
                        <span style={{ fontSize: 10.5, fontWeight: 700, color: r.akademik.statusData === 'lengkap' ? '#166534' : r.akademik.statusData === 'sebagian' ? '#b45309' : '#991b1b' }}>
                          {r.akademik.statusData === 'lengkap' ? 'LENGKAP' : r.akademik.statusData === 'sebagian' ? 'SEBAGIAN' : 'DATA BELUM CUKUP'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 6 }}>Klik baris untuk rincian per siswa (mapel, dimensi, proses, tren, peta topik).</div>
          </div>
        )}

        {/* ============ DETAIL SISWA ============ */}
        {detail && (
          <div style={{ ...gayaKartu, marginBottom: 14, borderColor: '#c7d2fe' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, flexWrap: 'wrap' }}>
              <div>
                <b style={{ fontSize: 14 }}>Rincian {detail.studentName}</b>
                <span style={{ color: '#64748b', fontSize: 11.5 }}> — {detail.studentKelas} {detail.jenjang} · periode {detail.periode}</span>
              </div>
              <button type="button" onClick={() => cetakSatu(detail)} style={{ padding: '7px 14px', borderRadius: 8, border: 'none', background: '#4338ca', color: '#fff', fontWeight: 700, fontSize: 12, cursor: 'pointer' }}>
                🖨️ Cetak PDF Siswa Ini
              </button>
            </div>

            <div style={{ fontSize: 12.5, fontWeight: 700, margin: '12px 0 4px' }}>Blok A — Akademik per mapel</div>
            {detail.akademik.perMapel.length === 0 && <div style={{ fontSize: 12, color: '#94a3b8' }}>Tidak ada aktivitas akademik terdeteksi pada periode ini.</div>}
            {detail.mapelDikesampingkan?.length > 0 && (
              <div style={{ fontSize: 11.5, color: '#b45309', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 8, padding: '6px 10px', marginTop: 8 }}>
                🧭 Mapel di luar jenjang siswa ini — TIDAK ikut rapor: {detail.mapelDikesampingkan.map((x) => `${x.nama} (${x.alasan})`).join('; ')}. Perbaiki dari akarnya: cek akses mapel saat pendaftaran siswa (Kelola Siswa) dan mapel kuis/tugas yang diterbitkan guru.
              </div>
            )}
            <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 8 }}>
              <thead>
                <tr>
                  <th style={gayaTh}>Mapel</th><th style={gayaTh}>Kuis (30%)</th><th style={gayaTh}>Tugas (30%)</th><th style={gayaTh}>Ujian (40%)</th>
                  <th style={gayaTh}>Nilai</th><th style={gayaTh}>Predikat</th><th style={gayaTh}>Keterangan</th>
                </tr>
              </thead>
              <tbody>
                {detail.akademik.perMapel.map((m) => (
                  <tr key={m.kode}>
                    <td style={gayaTd}><b>{m.nama}</b>{!m.layak && <span style={{ color: '#b45309', fontSize: 10.5 }}> · data belum cukup</span>}</td>
                    <td style={gayaTd}>{m.komponen.kuis.ada ? `${m.komponen.kuis.nilai} (${m.komponen.kuis.jumlah}×)` : <span style={{ color: '#94a3b8' }}>belum ada</span>}</td>
                    <td style={gayaTd}>{m.komponen.tugas.ada ? `${m.komponen.tugas.nilai} (${m.komponen.tugas.jumlah}×)` : <span style={{ color: '#94a3b8' }}>belum ada</span>}</td>
                    <td style={gayaTd}>
                      {m.komponen.ujian.ada ? `${m.komponen.ujian.nilai} (${m.komponen.ujian.jumlah}× TO)` : <span style={{ color: '#94a3b8' }}>belum ada</span>}
                      {m.rincianUjian?.length > 0 && (
                        <div style={{ fontSize: 10, color: '#64748b' }}>
                          {m.rincianUjian.map((u, i) => <div key={i}>{u.tanggal} · {u.paketJudul} · {u.nilai} ({u.dasar}{u.skala !== null ? `, skala ${u.skala}` : ''})</div>)}
                        </div>
                      )}
                    </td>
                    <td style={gayaTd}><b>{fmtAngka(m.nilaiAkhir)}</b></td>
                    <td style={{ ...gayaTd, color: warnaPredikat(m.predikat.huruf), fontWeight: 700 }}>{m.predikat.huruf}</td>
                    <td style={{ ...gayaTd, fontSize: 10.5, color: '#475569' }}>
                      {Object.entries(m.bobotEfektif).map(([k, b]) => `${k} ${Math.round(b * 100)}%`).join(' + ')}
                      {Object.keys(m.bobotEfektif).length < 3 && <div style={{ color: '#b45309' }}>bobot diredistribusi (komponen kosong tidak dinolkan)</div>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div style={{ fontSize: 12.5, fontWeight: 700, margin: '10px 0 4px' }}>5 Dimensi (proksi otomatis dari log — null = belum terukur, tidak pernah dikarang)</div>
            <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 8 }}>
              <tbody>
                {Object.entries(detail.dimensi).map(([k, d]) => (
                  <tr key={k}>
                    <td style={{ ...gayaTd, width: 200 }}><b>{k}</b></td>
                    <td style={{ ...gayaTd, width: 70, fontWeight: 700 }}>{d.nilai === null ? 'belum terukur' : d.nilai}</td>
                    <td style={{ ...gayaTd, color: '#475569', fontSize: 10.5 }}>{d.sumber}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div style={{ fontSize: 12.5, fontWeight: 700, margin: '10px 0 4px' }}>Blok B — Proses & Karakter (terpisah dari akademik)</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, fontSize: 11.5 }}>
              <div style={{ border: '1px solid #e2e8f0', borderRadius: 8, padding: '6px 10px' }}>
                <b>Kehadiran</b>: {detail.proses.kehadiran.total
                  ? `${detail.proses.kehadiran.hadir}/${detail.proses.kehadiran.total} hadir (${detail.proses.kehadiran.persenHadir}%) · ${detail.proses.kehadiran.sakit} sakit · ${detail.proses.kehadiran.izin} izin · ${detail.proses.kehadiran.alpha} alpha · skor adil ${fmtAngka(detail.proses.kehadiran.skor)}`
                  : 'belum ada catatan'}
                {detail.proses.kehadiran.alasan && <div style={{ color: '#b45309' }}>{detail.proses.kehadiran.alasan}</div>}
              </div>
              <div style={{ border: '1px solid #e2e8f0', borderRadius: 8, padding: '6px 10px' }}>
                <b>Latihan mandiri</b>: {detail.proses.latihan.hariAktif} hari aktif · {detail.proses.latihan.soalDikerjakan} soal · {detail.proses.latihan.totalJawaban} jawaban · skor {fmtAngka(detail.proses.latihan.skor)}
              </div>
              <div style={{ border: '1px solid #e2e8f0', borderRadius: 8, padding: '6px 10px' }}>
                <b>Tugas</b>: {detail.proses.tugas.terkumpul} dikumpulkan{detail.proses.tugas.dinilai !== undefined ? ` · ${detail.proses.tugas.dinilai} dinilai guru` : ''}
                {!detail.proses.tugas.terukur && <div style={{ color: '#b45309' }}>{detail.proses.tugas.alasan}</div>}
              </div>
              <div style={{ border: '1px solid #e2e8f0', borderRadius: 8, padding: '6px 10px' }}>
                <b>Ketepatan waktu</b>: <span style={{ color: '#94a3b8' }}>{detail.proses.ketepatanWaktu.alasan}</span>
              </div>
              <div style={{ border: `1px solid ${detail.proses.integritas.jumlahPelanggaran > 0 ? '#fde68a' : '#e2e8f0'}`, background: detail.proses.integritas.jumlahPelanggaran > 0 ? '#fffbeb' : undefined, borderRadius: 8, padding: '6px 10px' }}>
                <b>Integritas ujian</b>: {detail.proses.integritas.catatan}
                {detail.proses.integritas.pelanggaran.length > 0 && (
                  <div style={{ fontSize: 10.5, color: '#92400e' }}>
                    {detail.proses.integritas.pelanggaran.map((p, i) => <div key={i}>{p.tanggal} · {p.jenis} · {p.asal}{p.paketJudul ? ` — ${p.paketJudul}` : ''}</div>)}
                  </div>
                )}
              </div>
              {detail.proses.xp && (
                <div style={{ border: '1px solid #e2e8f0', borderRadius: 8, padding: '6px 10px' }}>
                  <b>XP</b>: {detail.proses.xp.xp} total · {detail.proses.xp.xpMingguIni} minggu ini <span style={{ color: '#94a3b8' }}>(snapshot saat dihitung)</span>
                </div>
              )}
            </div>
            <div style={{ marginTop: 6, fontSize: 12 }}>
              <b>Nilai Proses: <span style={{ color: warnaPredikat(detail.proses.predikat.huruf) }}>{fmtAngka(detail.proses.nilaiProses)} ({detail.proses.predikat.huruf})</span></b>
              {detail.proses.redistribusi && <span style={{ color: '#b45309', fontSize: 11 }}> · bobot diredistribusi (komponen belum terukur: {detail.proses.komponenTakTerukur.join(', ')})</span>}
            </div>

            <div style={{ fontSize: 12.5, fontWeight: 700, margin: '12px 0 4px' }}>Blok C — Perkembangan</div>
            {detail.trenSkala.length > 0 && (
              <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 8 }}>
                <thead><tr><th style={gayaTh}>Tanggal</th><th style={gayaTh}>Try Out</th><th style={gayaTh}>Mode</th><th style={gayaTh}>Skala nasional</th><th style={gayaTh}>Per subtes</th></tr></thead>
                <tbody>
                  {detail.trenSkala.map((t, i) => (
                    <tr key={i}>
                      <td style={gayaTd}>{t.tanggal}</td>
                      <td style={gayaTd}>{t.paketJudul}</td>
                      <td style={gayaTd}>{t.mode}{t.skalaMode ? ` (${t.skalaMode})` : ''}</td>
                      <td style={gayaTd}><b>{t.skalaTotal}</b> → nilai100: {fmtAngka(t.nilai100 !== null ? Math.round(t.nilai100 * 10) / 10 : null)}</td>
                      <td style={{ ...gayaTd, fontSize: 10.5 }}>{t.perSubtes.map((p) => `${p.kode}: ${p.skala ?? '—'}`).join(' · ')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            {detail.trenHarian.length > 0 && (
              <details style={{ marginBottom: 8 }}>
                <summary style={{ fontSize: 12, cursor: 'pointer' }}>Catatan tren harian ({detail.trenHarian.length} entri — di-embed ke snapshot saat terbit)</summary>
                <div style={{ maxHeight: 220, overflowY: 'auto', border: '1px solid #e2e8f0', borderRadius: 8, marginTop: 4 }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <tbody>
                      {detail.trenHarian.map((t, i) => (
                        <tr key={i}>
                          <td style={{ ...gayaTd, width: 90 }}>{t.tanggal}</td>
                          <td style={{ ...gayaTd, width: 60 }}>{t.jenis}</td>
                          <td style={gayaTd}>{t.label}</td>
                          <td style={{ ...gayaTd, width: 60, textAlign: 'right' }}>{t.skor === null ? '—' : t.skor}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </details>
            )}
            {detail.petaTopik.length > 0 && (
              <div style={{ marginBottom: 8 }}>
                <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 4 }}>Peta topik (merah = perlu perhatian)</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {detail.petaTopik.map((t, i) => (
                    <span key={i} title={`${t.alasan} · sumber: ${t.sumber.join('+')}`} style={{ fontSize: 10.5, padding: '3px 8px', borderRadius: 999, border: `1px solid ${warnaStatus(t.status)}`, color: warnaStatus(t.status), background: '#fff' }}>
                      {t.mapelNama}: {t.topik} · {t.akurasi}% ({t.dicoba})
                    </span>
                  ))}
                </div>
                {detail.rekomendasi.length > 0 && (
                  <div style={{ marginTop: 6, fontSize: 11.5, background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '6px 10px', color: '#991b1b' }}>
                    <b>Rekomendasi penguatan:</b>
                    <ul style={{ margin: '4px 0 0', paddingLeft: 18 }}>
                      {detail.rekomendasi.map((r, i) => <li key={i}>{r}</li>)}
                    </ul>
                  </div>
                )}
              </div>
            )}
            {detail.catatan.length > 0 && (
              <div style={{ fontSize: 11, color: '#475569', background: '#f8fafc', borderRadius: 8, padding: '6px 10px' }}>
                {detail.catatan.map((c, i) => <div key={i}>• {c}</div>)}
              </div>
            )}
          </div>
        )}

        {/* ============ PENERBITAN ============ */}
        {h && (
          <div style={{ ...gayaKartu, marginBottom: 14 }}>
            <b style={{ fontSize: 13.5 }}>Terbitkan snapshot periode {h.periode.label}</b>
            <div style={{ fontSize: 11.5, color: '#475569', margin: '4px 0 10px' }}>
              Menulis ke <code>raport_final</code> (blok akademik per mapel + blok {MAPEL_PROSES}) dengan id deterministik
              <code> studentId__mapel__periode</code> — aman dijalankan ulang. Dokumen terkunci dilewati kecuali mode paksa.
            </div>
            <details style={{ marginBottom: 4 }}>
              <summary style={{ cursor: 'pointer', fontSize: 12, fontWeight: 700, color: '#475569' }}>
                ⚙️ Opsi lanjutan (terbit tanpa cetak · paksa terbit ulang · backfill)
              </summary>
              <div style={{ marginTop: 10 }}>
            <label style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 12, marginBottom: 8 }}>
              <input type="checkbox" checked={paksa} onChange={(e) => setPaksa(e.target.checked)} />
              Paksa terbitkan ulang dokumen terkunci (wajib alasan tertulis — tercatat di audit log)
            </label>
            {paksa && (
              <input
                value={alasanPaksa}
                onChange={(e) => setAlasanPaksa(e.target.value)}
                placeholder="Alasan koreksi (minimal 5 karakter), mis.: data kuis September dikoreksi guru"
                style={{ width: '100%', maxWidth: 520, padding: '7px 10px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 12, marginBottom: 8 }}
              />
            )}
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <button type="button" onClick={terbitkan} disabled={sedangTerbit || sedangBackfill} style={{ padding: '9px 18px', borderRadius: 8, border: 'none', background: '#16a34a', color: '#fff', fontWeight: 700, cursor: sedangTerbit ? 'wait' : 'pointer' }}>
                {sedangTerbit ? 'Menerbitkan…' : '📤 Terbitkan Raport Periode Ini'}
              </button>
              <button type="button" onClick={backfill} disabled={sedangTerbit || sedangBackfill} style={{ padding: '9px 18px', borderRadius: 8, border: '1px solid #cbd5e1', background: '#fff', fontWeight: 700, cursor: sedangBackfill ? 'wait' : 'pointer' }}>
                {sedangBackfill ? 'Backfill berjalan…' : '⏪ Backfill Agu–Okt 2026 (4 periode)'}
              </button>
            </div>
              </div>
            </details>
            {(progresTerbit || progresBackfill) && (
              <div style={{ marginTop: 8, fontSize: 11.5, color: '#4f46e5' }}>{progresTerbit || progresBackfill}</div>
            )}
            {hasilTerbit && !hasilTerbit.backfill && (
              <div style={{ marginTop: 10, fontSize: 12, background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 8, padding: '8px 12px' }}>
                ✅ Periode {hasilTerbit.periode}: <b>{hasilTerbit.ditulis}</b> dokumen ditulis · <b>{hasilTerbit.dilewati}</b> dilewati (terkunci) · <b>{hasilTerbit.gagal}</b> gagal.
                {hasilTerbit.daftarDilewati?.length > 0 && <div style={{ fontSize: 11, color: '#b45309', marginTop: 4 }}>Dilewati: {hasilTerbit.daftarDilewati.join('; ')}{hasilTerbit.dilewati > hasilTerbit.daftarDilewati.length ? ` (+${hasilTerbit.dilewati - hasilTerbit.daftarDilewati.length} lainnya)` : ''}</div>}
              </div>
            )}
            {hasilTerbit?.backfill && (
              <div style={{ marginTop: 10, fontSize: 12, background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 8, padding: '8px 12px' }}>
                ✅ Backfill selesai:
                <ul style={{ margin: '4px 0 0', paddingLeft: 18 }}>
                  {hasilTerbit.rekap.map((r, i) => <li key={i}>{r.label} ({r.periode}): {r.ditulis} ditulis · {r.dilewati} dilewati · {r.gagal} gagal</li>)}
                </ul>
              </div>
            )}
          </div>
        )}

        <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 20 }}>
          Keterbatasan jujur v1: ketepatan waktu belum terukur (timestamp absensi = waktu guru mencatat); rasio tugas vs terbit menunggu
          daftar tugas terbit per periode; akurasi latihan = akumulasi log Leitner. Semua komponen yang belum terukur TIDAK dinolkan —
          bobotnya diredistribusi dan keterangannya tampil di dokumen. Cetak PDF per siswa (tombol di rincian) & massal per jenjang/kelas
          (tombol di pratinjau) memakai engine cetak yang sudah distabilkan — simpan sebagai PDF dari dialog cetak browser.
        </div>
      </div>
    </div>
  );
}
