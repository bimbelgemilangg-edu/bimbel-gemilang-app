// src/pages/student/tryout/TryOutView.jsx
// ============================================================
// HALAMAN UTAMA TRY OUT (siswa) -- menyatukan semua modul yang sudah
// dibangun terpisah:
//   - useTimerTryOut.js       (2 mode timer, diikat waktu mulai)
//   - useDeteksiKecuranganTryOut.js (kamera acak + tab/fullscreen)
//   - RendererPgSederhana/PgKompleks/BenarSalah.jsx (3 tipe soal)
//   - skoringSoalKompleks.js  (skor proporsional)
//   - potonganXPTryOut.js     (potongan XP dari pelanggaran)
//   - RingkasanPelanggaran.jsx (tampilan di layar hasil)
//
// KEPUTUSAN PENTING (jangan diubah tanpa alasan kuat):
// - Jawaban per soal DISIMPAN begitu pindah soal (bukan cuma di
//   akhir) -- konsisten sama prinsip "jangan sampai kehilangan progres
//   kalau app ketutup" yang sudah dipakai di Latihan Harian.
// - Mode 'per-subtes': begitu waktu 1 subtes habis, OTOMATIS pindah ke
//   subtes berikutnya -- TIDAK BISA balik ke subtes sebelumnya lagi
//   (persis UTBK/TKA asli).
// - waktuMulaiMs disimpan sebagai angka biasa (bukan cuma
//   serverTimestamp) supaya timer bisa langsung jalan tanpa nunggu
//   round-trip server. Konsekuensi jujur: siswa yang PAKSA ubah jam
//   sistem device-nya secara teknis BISA mengelabui timer ini -- sama
//   seperti keterbatasan anti-cheat lain di app ini, ini mempersulit,
//   bukan menjamin 100% (di skala bimbel ini reasonable trade-off,
//   bukan ujian nasional bersertifikat).
// ============================================================

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db } from '../../../firebase';
import { filterSoalTryOutByMapelSiswa } from '../../../utils/aksesKontenSiswa';
import {
  doc, getDoc, addDoc, updateDoc, setDoc, collection, query, where, getDocs, serverTimestamp,
} from 'firebase/firestore';
import { ArrowLeft, Camera, ShieldAlert, Clock, CheckCircle2  , FileText, Award, Timer, ChevronLeft, ChevronDown } from 'lucide-react';

import { useTimerTryOut } from './useTimerTryOut';
import { useDeteksiKecuranganTryOut } from './useDeteksiKecuranganTryOut';
import RendererPgSederhana from './RendererPgSederhana';
import RenderMath from '../../../components/RenderMath';
import RenderTable from '../../../components/RenderTable';
import TeksSoalBergambar from '../../../components/TeksSoalBergambar';
// 🔥 (2026-10-10) pembaca teks soal SADAR-ALIAS. Layar ujian ini dulu membaca
// `soal || teks_soal` saja, sehingga butir yang menyimpan teksnya di `teksSoal`
// (nama field KONTRAK-JSON-BANK-SOAL!) dirender KOSONG di depan siswa. Persis
// kelas bug yang melahirkan fieldButirSoal.js: pembaca yang hanya mengenal
// satu nama field kehilangan isi diam-diam. Sekarang satu sumber.
import MaskotAstronot from '../../../components/MaskotAstronot';
import RendererPgKompleks from './RendererPgKompleks';
import RendererBenarSalah from './RendererBenarSalah';
// 🔥 BARU (esai 2026-10-04): kotak teks + tombol kamera untuk soal uraian.
import RendererEsai from './RendererEsai';
import RingkasanPelanggaran from './RingkasanPelanggaran';
import LencanaPencapaian from '../../../components/LencanaPencapaian';
import { skorSatuSoal, hitungTotalSkor, soalBelumDijawab } from '../../../utils/skorSoalTryOut';
import { hitungSkalaSesi } from '../../../utils/hitungSkalaSesi';
import { pisahKodeSumber } from '../../../utils/strukturPembahasan';
import RenderPembahasan from '../../../components/RenderPembahasan';
import { teksSoalDari } from '../../../utils/fieldButirSoal';
import { terapkanPotonganXP } from '../../../utils/potonganXPTryOut';
import { acakSoalPerSiswa } from '../../../utils/acakSoalTryOut';
import { tambahXpMingguan } from '../../../utils/mingguIni';
// 🔥 BARU (2026-10-08, keluhan owner "siswa finish mendadak di soal 4"
// & "soalnya gak keluar"): keputusan "tombol hijau ini sebenarnya harus
// ngapain" + pengamanan indeks subtes resume + penyaringan subtes kosong
// dipindah ke util murni logikaSubtesTryOut.js biar di-test otomatis
// (tests/logikaSubtesTryOut.test.mjs) dan gak bisa regression diam-diam.
import {
  putusanTombolLanjut, indexSubtesAman, filterSubtesMenurutSoalTersedia,
} from '../../../utils/logikaSubtesTryOut.js';
// 🔥 BARU (2026-10-08, keluhan owner "anak-anak banyak yang lihat layar
// Gagal Mengirim Hasil setelah aku ulangi"): akar masalahnya ada di
// kode: reset admin MENGHAPUS dokumen tryout_sesi, sedangkan layar yang
// masih terbuka kirim hasil pakai updateDoc ke id lama -- gagal SELAMANYA
// berapa kali pun "Coba Kirim Lagi" diklik. Keputusan pemulihannya kini
// di util murni pulihKirimHasilTryOut.js (di-test otomatis), dan jawaban
// yang gak sempat masuk sesi DITAHAN di koleksi tryout_hasil_tertahan
// biar janji "Jawabanmu AMAN, belum hilang" beneran benar.
import {
  kodeGagalKirim, putusanPemulihanKirim, pilihSesiUtama,
} from '../../../utils/pulihKirimHasilTryOut.js';

const XP_PER_SOAL = 10; // konsisten sama XP_PER_BENAR di Latihan Harian

function RendererSoal(props) {
  const tipe = props.soal.tipe || 'pg_sederhana';
  if (tipe === 'pg_kompleks') return <RendererPgKompleks {...props} />;
  if (tipe === 'benar_salah' || tipe === 'pg_kategori') return <RendererBenarSalah {...props} />;
  if (tipe === 'esai' || tipe === 'uraian') return <RendererEsai {...props} />;
  return <RendererPgSederhana {...props} />;
}

// 🔥 BARU (bug freeze/blank putih ditemukan): sebelumnya kalau ADA
// SATU soal yang datanya aneh (mis. kunciJawaban tersimpan salah
// format), renderernya crash dan React nge-blank-in SELURUH halaman
// try out -- siswa kehilangan progres, harus reload, panik di tengah
// ujian beneran. Error Boundary ini nangkep crash itu SUPAYA CUMA
// SOAL YANG BERMASALAH doang yang kena, sisanya tetap jalan normal --
// siswa bisa tandai soal ini & lanjut ke soal lain, laporin ke admin
// belakangan lewat Audit.
class PenahanErrorSoal extends React.Component {
  constructor(props) { super(props); this.state = { error: null }; }
  static getDerivedStateFromError(error) { return { error }; }
  componentDidCatch(error, info) {
    console.error('[TryOut] Soal ini bikin error waktu dirender:', this.props.soalId, error, info);
  }
  componentDidUpdate(prevProps) {
    // Reset begitu pindah ke soal lain, biar soal berikutnya dapat
    // kesempatan render dari nol (bukan ke-stuck di state error selamanya).
    if (prevProps.soalId !== this.props.soalId && this.state.error) {
      this.setState({ error: null });
    }
  }
  render() {
    if (this.state.error) {
      return (
        <div style={{ padding: 20, textAlign: 'center', background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 12, color: '#b91c1c', fontSize: 13 }}>
          ⚠️ Soal ini gagal ditampilkan (kemungkinan ada masalah data). Ini SUDAH TERCATAT --
          silakan lanjut ke soal berikutnya, admin akan mengecek soal ini nanti.
        </div>
      );
    }
    return this.props.children;
  }
}

export default function TryOutView() {
  const { paketId } = useParams();
  const navigate = useNavigate();
  const studentId = localStorage.getItem('studentId');

  const [tahap, setTahap] = useState('memuat'); // 'memuat' | 'mulai' | 'mengerjakan' | 'selesai'
  const [paket, setPaket] = useState(null);
  const [sesiId, setSesiId] = useState(null);
  const [jawaban, setJawaban] = useState({}); // { soalId: value }
  const [subtesAktifIndex, setSubtesAktifIndex] = useState(0);
  const [waktuMulaiMs, setWaktuMulaiMs] = useState(null);
  const [waktuMulaiSubtesMs, setWaktuMulaiSubtesMs] = useState(null);
  const [indexSoalAktif, setIndexSoalAktif] = useState(0);
  const [siapPeraturan, setSiapPeraturan] = useState(false);
  const [hasilAkhir, setHasilAkhir] = useState(null); // { xpMentah, xpFinal, totalSkorPersen, ... }
  const [fotoPengawasan, setFotoPengawasan] = useState([]);

  // 🔥 BARU (2026-10-08): pesan transisi subtes NON-MEMBLOKIR. Dulu
  // perpindahan subtes (waktu habis / klik "Selesai Subtes Ini") pakai
  // alert() yang MEMBLOKIR layar: jam terus jalan sementara siswa masih
  // membaca/menutup alert, dan di HP yang layarannya terkunci rentetan
  // alert bisa membuat beberapa soal "tertelan" sekaligus (keluhan
  // "soalnya gak keluar"). Sekarang pesannya banner biasa yang hilang
  // sendiri setelah 7 detik -- waktu subtes berikutnya mulai jalan
  // BERSAMAAN dengan siswa melihat soalnya, bukan setelah dia menutup
  // popup.
  const [pesanTransisi, setPesanTransisi] = useState(null);
  const timerPesanRef = React.useRef(null);
  const tampilPesanTransisi = useCallback((teks) => {
    setPesanTransisi(teks);
    if (timerPesanRef.current) clearTimeout(timerPesanRef.current);
    timerPesanRef.current = setTimeout(() => setPesanTransisi(null), 7000);
  }, []);
  useEffect(() => () => clearTimeout(timerPesanRef.current), []);

  // 🔥 (2026-10-10, restyle responsif): latar layar dibuat penuh sekeliling
  // viewport dengan kolom konten di tengah, supaya di laptop/tablet tidak
  // terlihat seperti pita warna mengambang di halaman putih. Lebar kolom
  // mengikuti viewport lewat state ini.
  const [lebar, setLebar] = useState(() => (typeof window !== 'undefined' ? window.innerWidth : 1024));
  useEffect(() => {
    const saatDiubah = () => setLebar(window.innerWidth);
    window.addEventListener('resize', saatDiubah);
    return () => window.removeEventListener('resize', saatDiubah);
  }, []);
  const kolom = (maks) => ({
    width: '100%',
    maxWidth: lebar < 640 ? '100%' : maks,
    margin: '0 auto',
    padding: lebar < 640 ? '14px 12px 34px' : '20px 24px 44px',
    boxSizing: 'border-box',
  });

  // 🔥 BARU: layar "Siapkan Kamera" -- state & videoRef-nya didefinisikan
  // di sini, tapi fungsi lanjutSetelahCekKamera() ditaruh SETELAH
  // mulaiTryOut() didefinisikan (lihat di bawah), biar gak kena error
  // "dipakai sebelum didefinisikan".
  const videoPrepRef = React.useRef(null);
  const streamPrepRef = React.useRef(null);
  const [statusKameraPrep, setStatusKameraPrep] = useState('memuat'); // 'memuat' | 'aktif' | 'ditolak'
  // Nama error kamera disimpan untuk diagnostik (ditulis oleh hook kamera)
  // tapi tidak ditampilkan langsung di halaman ini -- jadi hanya setter-nya
  // yang dipakai. Destructuring kosong di kiri menjaga niat itu terbaca.
  const [, setErrorKameraPrep] = useState(null);
  // 🔥 BARU: counter percobaan -- setiap admin/siswa klik "Coba Lagi",
  // angka ini naik, effect di bawah otomatis jalan ulang (minta izin
  // kamera dari nol lagi). Ini buat kasus siswa TADINYA klik "Block"
  // gak sengaja, terus dia benerin izinnya lewat setting browser --
  // tanpa tombol ini, satu-satunya cara ngulang adalah reload manual.
  const [percobaanKeKamera, setPercobaanKeKamera] = useState(0);
  // 🔥 (2026-10-10, restyle UI): palet nomor kini tersembunyi di balik
  // tombol di header -- format menjawab mengikuti mockup owner: linear.
  const [lihatPalet, setLihatPalet] = useState(false);

  useEffect(() => {
    if (tahap !== 'cek-kamera') return;
    let batal = false;
    // 🔥 (2026-10-10, lint CI): setState tidak boleh jalan di jalur sinkron
    // effect (react-hooks/set-state-in-effect). Dibungkus fungsi async dengan
    // satu await di depan: perilaku sama, hanya tertunda satu microtick.
    (async () => {
      await Promise.resolve();
      if (batal) return;
      setStatusKameraPrep('memuat');
      setErrorKameraPrep(null);
      navigator.mediaDevices?.getUserMedia({ video: { facingMode: 'user' }, audio: false })
      .then((stream) => {
        if (batal) { stream.getTracks().forEach((t) => t.stop()); return; }
        streamPrepRef.current = stream;
        if (videoPrepRef.current) videoPrepRef.current.srcObject = stream;
        setStatusKameraPrep('aktif');
      })
      .catch((err) => {
        console.error('Kamera ditolak/gagal pas persiapan:', err);
        setStatusKameraPrep('ditolak');
        setErrorKameraPrep(err?.name || 'Unknown');
      });
    })();
    return () => {
      batal = true;
      // Stream persiapan ini SENGAJA dimatikan begitu keluar dari
      // layar ini -- useDeteksiKecuranganTryOut.js bakal minta izin
      // kamera lagi dari awal pas tahap 'mengerjakan', biar 1 sumber
      // aja yang pegang stream aktif (menghindari 2 stream nyala
      // bersamaan yang bisa bikin browser bingung).
      streamPrepRef.current?.getTracks().forEach((t) => t.stop());
      streamPrepRef.current = null;
    };
  }, [tahap, percobaanKeKamera]);

  // ---------------- MUAT PAKET + CEK SESI YANG SUDAH ADA ----------------
  // 🔥 BARU: dulu ini nyaris inline di dalam useEffect doang -- kalau
  // gagal (jaringan lambat waktu pertama buka halaman), siswa cuma
  // dikasih pesan "Coba muat ulang halaman" (dead-end, harus refresh
  // manual browser). Sekarang dibungkus jadi fungsi yang bisa DIPANGGIL
  // ULANG dari tombol, plus dicoba otomatis 2x sebelum nyerah.
  const muatPaketDanSesi = useCallback(async (percobaanKe = 1) => {
    // 🔥 (2026-10-10, lint CI): percobaan ulang recursif lewat fungsi dalam
    // bernama `jalan`: react-hooks/immutability menolak const yang menyebut
    // dirinya sendiri di dalam initializer-nya (TDZ), walau aman di runtime.
    async function jalan(percobaan) {
    try {
      const snapPaket = await getDoc(doc(db, 'tryout_paket', paketId));
      if (!snapPaket.exists()) { setTahap('tidak-ditemukan'); return; }
      const dataPaket = { id: snapPaket.id, ...snapPaket.data() };

      // Filter soal hanya mapel yang didaftarkan admin ke siswa (enrolledSubjects)
      let enrolled = [];
      try {
        const snapSiswa = await getDocs(query(collection(db, 'students'), where('studentId', '==', studentId)));
        const dataSiswa = snapSiswa.docs[0]?.data() || {};
        enrolled = Array.isArray(dataSiswa.enrolledSubjects) ? dataSiswa.enrolledSubjects : [];
      } catch (eSiswa) {
        console.warn('Gagal muat enrolledSubjects:', eSiswa);
      }
      const filterMapel = filterSoalTryOutByMapelSiswa(dataPaket.daftarSoal || [], enrolled);
      if (filterMapel.alasan && !filterMapel.soal.length) {
        setPaket({ ...dataPaket, daftarSoal: [], _filterMapelPesan: filterMapel.alasan });
      } else {
        const idOk = new Set(filterMapel.soal.map((s) => s.id));
        // 🔥 BARU: penyaringan subtes yang soalnya habis tersaring
        // dipindah ke util murni (logikaSubtesTryOut.js) biar perilaku
        // "subtes kosong dibuang" teruji otomatis -- dulu inline di
        // sini dan itulah jalan bikin siswa melihat subtes TANPA soal
        // ("soalnya gak keluar").
        const subtes = filterSubtesMenurutSoalTersedia(dataPaket.subtes, idOk);
        setPaket({
          ...dataPaket,
          daftarSoal: filterMapel.soal,
          totalSoal: filterMapel.soal.length,
          subtes: dataPaket.modeTimer === 'per-subtes' ? subtes : (dataPaket.subtes || []),
          _mapelSiswa: filterMapel.mapelSiswa,
          _soalDibuangMapel: filterMapel.dibuang,
        });
      }

      const snapSesi = await getDocs(query(
        collection(db, 'tryout_sesi'),
        where('paketId', '==', paketId),
        where('studentId', '==', studentId),
      ));

      if (!snapSesi.empty) {
        // 🔥 BARU: dulu selalu docs[0] -- kalau suatu saat ada dua dokumen
        // sesi (lama selesai + ulang berjalan), urutannya acak ikut id dan
        // siswa bisa terkunci di layar hasil lama. Sekarang pilih lewat
        // util murni pilihSesiUtama (berjalan menang, lalu yang terbaru).
        const sesi = pilihSesiUtama(snapSesi.docs.map((d) => ({ id: d.id, ...d.data() })));
        setSesiId(sesi.id);
        setJawaban(sesi.jawaban || {});
        setFotoPengawasan(sesi.fotoPengawasan || []);
        if (sesi.status === 'selesai') {
          setHasilAkhir({
            xpMentah: sesi.xpMentah, xpFinal: sesi.xpFinal, totalSkorPersen: sesi.totalSkorPersen, pelanggaran: sesi.pelanggaran || [],
          });
          setTahap('selesai');
        } else {
          // 🔥 BARU (keluhan "soalnya gak keluar"): indeks subtes yang
          // tersimpan di sesi bisa MENUNJUK KELUAR ARRAY kalau susunan
          // subtes berubah setelah sesi dimulai (mis. akses mapel siswa
          // diperbarui admin). Dulu itu bikin layar stuck selamanya di
          // "Memuat soal..." atau timer langsung habis beruntun.
          // Sekarang indeksnya di-clamp ke rentang yang ADA dan siswa
          // dikasih tahu jujur lewat banner.
          const idTersedia = new Set(filterMapel.soal.map((sx) => sx.id));
          const subtesTerpakai = dataPaket.modeTimer === 'per-subtes'
            ? filterSubtesMenurutSoalTersedia(dataPaket.subtes, idTersedia)
            : (dataPaket.subtes || []);
          const posisiAman = indexSubtesAman(sesi.subtesAktifIndex || 0, subtesTerpakai.length);
          setSubtesAktifIndex(posisiAman.index);
          setWaktuMulaiMs(sesi.waktuMulaiMs || Date.now());
          setWaktuMulaiSubtesMs(sesi.waktuMulaiSubtesMs || Date.now());
          setTahap('mengerjakan');
          if (posisiAman.disesuaikan) {
            tampilPesanTransisi('🧭 Posisi subtesmu disesuaikan karena susunan try out berubah setelah sesimu dimulai. Jawaban tersimpanmu tetap aman.');
          }
        }
      } else {
        // Cek jadwal buka/deadline SEBELUM kasih tahap 'mulai'. Jaga-
        // jaga kalau siswa buka link try out langsung (bukan lewat
        // daftar yang udah nge-filter duluan).
        const sekarang = new Date();
        const belumDibuka = dataPaket.waktuBuka && sekarang < new Date(dataPaket.waktuBuka);
        const sudahLewatDeadline = dataPaket.waktuTutup && sekarang > new Date(dataPaket.waktuTutup);

        if (sudahLewatDeadline) {
          // "Izin Ulang Khusus" -- admin bisa kasih 1 siswa izin buat
          // ngerjain LAGI walau deadline PAKET-nya udah lewat, TANPA
          // harus buka deadline itu buat semua orang.
          const snapIzin = await getDoc(doc(db, 'tryout_izin_ulang', `${paketId}_${studentId}`));
          const izinMasihBerlaku = snapIzin.exists() && sekarang < new Date(snapIzin.data().waktuBerlakuSampai);
          if (!izinMasihBerlaku) {
            setTahap('lewat-deadline');
            return;
          }
        } else if (belumDibuka) {
          setTahap('belum-dibuka');
          return;
        }
        setTahap('mulai');
      }
    } catch (e) {
      console.error(`Gagal memuat try out (percobaan ke-${percobaan}):`, e);
      if (percobaan < 2) {
        setTimeout(() => jalan(percobaan + 1), 1500);
        return;
      }
      setTahap('gagal');
    }
  }
    return jalan(percobaanKe);
  }, [paketId, studentId, tampilPesanTransisi]);

  // Effect mount sengaja hanya bergantung paketId/studentId:
  // muatPaketDanSesi dibuat ulang tiap render, memasukkannya ke deps
  // berarti efek memanggil dirinya tanpa henti. Perilaku ini dikuji
  // manual lewat alur try out siswa; penonaktifan peringatan terbatas
  // satu baris ini saja.
  /* eslint-disable react-hooks/exhaustive-deps */
  useEffect(() => {
    muatPaketDanSesi();
  }, [paketId, studentId]);
  /* eslint-enable react-hooks/exhaustive-deps */

  // Daftar soal yang SEDANG BOLEH dikerjakan -- kalau mode per-subtes,
  // cuma soal di subtes aktif (soal di subtes lain/sebelumnya TIDAK
  // ditampilkan lagi -- sesuai aturan "gak bisa balik").
  const daftarSoalAktif = useMemo(() => {
    if (!paket) return [];
    let hasil;
    if (paket.modeTimer === 'per-subtes') {
      const subtesIni = paket.subtes?.[subtesAktifIndex];
      if (!subtesIni) return [];
      const idSet = new Set(subtesIni.soalIds);
      hasil = paket.daftarSoal.filter((s) => idSet.has(s.id));
    } else {
      hasil = paket.daftarSoal || [];
    }

    // 🔥 BARU: acak urutan -- beda siswa beda urutan nomor (anti-nyontek
    // liat jawaban nomor sekian dari teman sebelah), TAPI konsisten
    // buat siswa yang sama (gak acak ulang tiap reload halaman, biar
    // gak bingung nomor loncat-loncat pas lagi ngerjain). `garam`
    // dibedain per subtes, biar urutan tiap subtes gak "ngikutin pola"
    // yang sama persis satu sama lain buat siswa yang sama.
    if (paket.soalAcak && studentId) {
      hasil = acakSoalPerSiswa(hasil, studentId, paketId, String(subtesAktifIndex));
    }
    return hasil;
  }, [paket, subtesAktifIndex, studentId, paketId]);

  const soalAktif = daftarSoalAktif[indexSoalAktif];

  // 🔥 BARU (2026-10-08, BUG SERIUS): keputusan tombol hijau utama kini
  // dari util murni yang DI-TEST (logikaSubtesTryOut.js). Dulu tombol
  // berlabel "Selesai Subtes Ini" ISI-nya selesaikanTryOut() -- siswa
  // mode "per soal individual" yang cuma mau lanjut ke soal berikutnya
  // malah finish mendadak (keluhan: "kerjain soal dapat 4 tiba-tiba
  // selesai"). Sekarang: masih ada subtes berikutnya = pindah subtes.
  const putusanNav = putusanTombolLanjut({
    modeTimer: paket?.modeTimer,
    indexSoalAktif,
    jumlahSoalAktif: daftarSoalAktif.length,
    subtesAktifIndex,
    jumlahSubtes: paket?.subtes?.length || 0,
  });

  // 🔥 BARU (BUG SERIUS DITEMUKAN): sebelumnya kalau updateDoc gagal
  // (mis. koneksi lemot/padat -- WAJAR kejadian pas banyak siswa
  // ngerjain try out BARENGAN), errornya cuma di-log ke console
  // browser (gak keliatan siswa sama sekali). Kalau abis itu siswa
  // reload halaman, TryOutView narik ulang jawaban dari Firestore --
  // yang ternyata KOSONG karena gagal kesimpen -- dan siswa keliatan
  // "gak jawab apa-apa" padahal dia BENERAN udah jawab. Sekarang: 1x
  // dicoba ulang otomatis, dan kalau tetap gagal, muncul PERINGATAN
  // JELAS di layar (bukan diam-diam) -- siswa jadi TAHU harus cek
  // koneksi & gak boleh reload sampai itu ilang.
  const [gagalSimpanProgres, setGagalSimpanProgres] = useState(false);

  // 🔥 BARU (2026-10-08): beda kan "jaringan putus" vs "dokumen sesinya
  // sudah tidak ada lagi di server" (dihapus reset admin). Kalau yang
  // kedua, mengulang updateDoc itu sia-sia -- malah bikin anak bingung
  // lihat peringatan terus-terusan. Sekali ketahuan not-found, pasang
  // banner jujur ini dan setop menulis ke dokumen yang sudah almarhum;
  // jawaban tetap aman di memori perangkat sampai kirim akhir (yang
  // akan menahan hasilnya di tryout_hasil_tertahan).
  const [sesiHilangDiServer, setSesiHilangDiServer] = useState(false);
  const sesiHilangRef = React.useRef(false);

  const simpanProgres = useCallback(async (jawabanBaru, subtesIndexBaru, waktuSubtesBaru, sudahDicoba = false) => {
    // 🔥 (2026-10-10, lint CI): rekursi lewat fungsi dalam `jalan` -- lihat
    // catatan serupa di muatPaketDanSesi.
    async function jalan(jawabanBaru, subtesIndexBaru, waktuSubtesBaru, sudahDicoba) {
    if (!sesiId || sesiHilangRef.current) return;
    try {
      await updateDoc(doc(db, 'tryout_sesi', sesiId), {
        jawaban: jawabanBaru,
        subtesAktifIndex: subtesIndexBaru,
        waktuMulaiSubtesMs: waktuSubtesBaru,
        updatedAt: serverTimestamp(),
      });
      setGagalSimpanProgres(false);
    } catch (e) {
      if (kodeGagalKirim(e) === 'not-found') {
        sesiHilangRef.current = true;
        setSesiHilangDiServer(true);
        return;
      }
      console.error('Gagal menyimpan progres try out:', e);
      if (!sudahDicoba) {
        // Coba sekali lagi setelah jeda singkat -- banyak kegagalan
        // jaringan itu cuma sesaat (macet 1-2 detik), bukan putus total.
        setTimeout(() => jalan(jawabanBaru, subtesIndexBaru, waktuSubtesBaru, true), 1500);
      } else {
        setGagalSimpanProgres(true);
      }
    }
  }
    return jalan(jawabanBaru, subtesIndexBaru, waktuSubtesBaru, sudahDicoba);
  }, [sesiId]);

  // 🔥 BUG SERIUS DITEMUKAN & DIBENERIN: sebelumnya onFotoTersimpan
  // ditulis sebagai fungsi arrow INLINE langsung di dalam pemanggilan
  // hook di bawah -- itu artinya fungsi ini DIBUAT ULANG (referensi
  // baru) SETIAP KALI TryOutView re-render. Karena timer hitung mundur
  // (useTimerTryOut.js) update tiap 1 DETIK, komponen ini re-render
  // tiap detik juga -- dan setiap re-render, jadwal "ambil foto acak"
  // yang LAMA (berbasis setTimeout) ke-RESET dari nol. Foto TIDAK
  // PERNAH BENERAN DIAMBIL sama sekali, walau "Wajib Kamera" aktif.
  //
  // SEKARANG dirombak total: gak ada lagi timer/setTimeout buat foto
  // sama sekali. Fotonya dipicu manual lewat `cobaAmbilFoto()` di
  // titik AKSI SISWA (jawab soal / pindah soal) -- lihat pemanggilannya
  // di ubahJawaban & tombol "Selanjutnya" di bawah. Blok ini SENGAJA
  // ditaruh SEBELUM ubahJawaban (bukan di bawahnya kayak sebelumnya),
  // biar closure yang dipegang ubahJawaban selalu dapat versi
  // `cobaAmbilFoto` yang TERBARU (gak basi), bukan versi lama yang
  // mungkin masih mikir kamera belum aktif.
  const handleFotoTersimpan = useCallback((url) => {
    setFotoPengawasan((prev) => [...prev, url]);
  }, []);

  // ---------------- ANTI-CHEAT ----------------
  const {
    pelanggaran, showPeringatan, tutupPeringatan, statusKamera, videoRef, cobaAmbilFoto,
  } = useDeteksiKecuranganTryOut({
    aktif: tahap === 'mengerjakan',
    wajibKamera: !!paket?.wajibKamera,
    onFotoTersimpan: handleFotoTersimpan,
  });

  const ubahJawaban = useCallback((soalId, value) => {
    setJawaban((prev) => {
      const next = { ...prev, [soalId]: value };
      simpanProgres(next, subtesAktifIndex, waktuMulaiSubtesMs);
      return next;
    });
    // 🔥 BARU: coba ambil foto pengawasan di titik "siswa menjawab".
    // Aman dipanggil di sini -- cobaAmbilFoto() sendiri yang mutusin
    // apa udah waktunya foto atau belum (lihat penjelasan lengkap di
    // useDeteksiKecuranganTryOut.js), dan dibungkus try/catch di
    // dalamnya sendiri jadi gak akan pernah melempar error ke sini.
    cobaAmbilFoto();
  }, [simpanProgres, subtesAktifIndex, waktuMulaiSubtesMs, cobaAmbilFoto]);

  // ---------------- MULAI TRY OUT ----------------
  const mulaiTryOut = useCallback(async () => {
    const sekarang = Date.now();
    try {
      const docRef = await addDoc(collection(db, 'tryout_sesi'), {
        paketId,
        studentId,
        status: 'berjalan',
        jawaban: {},
        subtesAktifIndex: 0,
        waktuMulai: serverTimestamp(),
        waktuMulaiMs: sekarang,
        waktuMulaiSubtesMs: sekarang,
        pelanggaran: [],
        fotoPengawasan: [],
        createdAt: serverTimestamp(),
      });
      setSesiId(docRef.id);
      setWaktuMulaiMs(sekarang);
      setWaktuMulaiSubtesMs(sekarang);
      setTahap('mengerjakan');
    } catch (e) {
      console.error('Gagal memulai try out:', e);
      alert('Gagal memulai try out, coba lagi.');
    }
  }, [paketId, studentId]);

  const lanjutSetelahCekKamera = useCallback(() => {
    streamPrepRef.current?.getTracks().forEach((t) => t.stop());
    mulaiTryOut();
  }, [mulaiTryOut]);

  // ---------------- SUBMIT / SELESAIKAN ----------------
  // 🔥 BARU (BUG SERIUS DITEMUKAN): sebelumnya kalau penyimpanan HASIL
  // FINAL gagal (bukan cuma jawaban per-soal, tapi status:'selesai' +
  // skor + XP-nya), errornya cuma di-log ke console -- SISTEM TETAP
  // NAMPILIN "Selesai!" ke siswa PADAHAL DATANYA GAK PERNAH BENERAN
  // KESIMPEN. Siswa ngerasa udah kelar, tapi di database tryout_sesi-
  // nya masih 'berjalan'/kosong -- persis kejadian yang bikin siswa
  // komplain "aku udah jawab kok hasilnya 0%". Sekarang: dicoba
  // beberapa kali, dan kalau BENERAN gagal terus, siswa DIKASIH TAU
  // JELAS + tombol coba lagi -- BUKAN diam-diam dianggap selesai.
  const [gagalKirimAkhir, setGagalKirimAkhir] = useState(false);
  const [sedangMengirimAkhir, setSedangMengirimAkhir] = useState(false);
  // 🔥 BARU (2026-10-08): layar jujur buat kasus "dokumen sesi sudah gak
  // ada lagi di server" (biasanya direset guru/admin biar bisa kerjain
  // ulang). Isinya: jawaban ditahan aman + tombol muat ulang -- BUKAN
  // layar merah "cek koneksi" yang tombol coba-laginya gak pernah menang.
  const [layarKirimDireset, setLayarKirimDireset] = useState(null); // null | 'tahan-mulai-lagi' | 'tahan-lanjutkan-lain'

  // Cek keadaan siswa ini di server setelah dokumen sesinya ketahuan
  // hilang: apakah dia sudah punya sesi BARU yang masih berjalan (mis.
  // sudah mulai ulang dari tab lain setelah reset)? Jawaban itu yang
  // menentukan apakah layar menawarkan "mulai dari awal" atau
  // "lanjutkan sesi terbarumu".
  const bacaKonteksSesiHilang = useCallback(async () => {
    let adaSesiLainBerjalan = false;
    try {
      const snapSesi = await getDocs(query(
        collection(db, 'tryout_sesi'),
        where('paketId', '==', paketId),
        where('studentId', '==', studentId),
      ));
      adaSesiLainBerjalan = snapSesi.docs.some((d) => d.id !== sesiId && d.data().status === 'berjalan');
    } catch (e) {
      console.warn('Gagal cek sesi lain saat pemulihan kirim:', e);
    }
    return { adaSesiLainBerjalan };
  }, [paketId, studentId, sesiId]);

  // Tahan SELURUH hasil pengerjaan di koleksi tryout_hasil_tertahan
  // (dokumen terpisah, TIDAK menimpa sesi baru siapa pun) biar janji
  // "Jawabanmu AMAN, belum hilang" beneran benar walau sesinya sudah
  // dihapus reset. Admin bisa melihat isinya di panel "Jawaban Tertahan"
  // halaman Hasil Try Out.
  const tahanHasilTertahan = useCallback(async (putusan, konteks, skor) => {
    if (!sesiId) return false;
    try {
      await setDoc(doc(db, 'tryout_hasil_tertahan', sesiId), {
        paketId,
        studentId,
        sesiIdAsal: sesiId,
        jawaban,
        fotoPengawasan,
        pelanggaran,
        ...skor,
        alasan: 'dokumen-sesi-hilang-saat-kirim',
        putusan,
        konteks,
        waktuTahan: new Date().toISOString(),
      }, { merge: true });
      return true;
    } catch (eTahan) {
      console.error('Gagal menahan hasil try out:', eTahan);
      return false;
    }
  }, [paketId, studentId, sesiId, jawaban, fotoPengawasan, pelanggaran]);

  const selesaikanTryOut = useCallback(async (percobaanKe = 1) => {
    // 🔥 (2026-10-10, lint CI): rekursi lewat fungsi dalam `jalan` -- lihat
    // catatan serupa di muatPaketDanSesi.
    async function jalan(percobaan) {
    if (!paket) return;
    setSedangMengirimAkhir(true);
    setGagalKirimAkhir(false);
    const { totalSkor, totalSkorPersen, jumlahTidakBisaDinilai } =
      hitungTotalSkor(paket.daftarSoal, jawaban);
    const xpMentah = Math.round(totalSkor * XP_PER_SOAL);
    const { xpFinal } = terapkanPotonganXP(xpMentah, pelanggaran);
    const skorRingkas = {
      totalSkorPersen,
      xpMentah,
      xpFinal,
      jumlahSoalRusak: jumlahTidakBisaDinilai || 0,
    };

    try {
      // Penyimpanan yang BENERAN kritis (jawaban + skor final) --
      // ini yang WAJIB berhasil sebelum siswa dikasih tau "selesai".
      if (sesiId) {
        try {
          await updateDoc(doc(db, 'tryout_sesi', sesiId), {
            status: 'selesai',
            jawaban,
            totalSkorPersen,
            xpMentah,
            xpFinal,
            pelanggaran,
            fotoPengawasan,
            // 🔥 BARU (audit keluhan siswa): jumlah soal yang DIKELUARKAN dari
            // penilaian karena datanya rusak (mis. baris benar/salah tanpa
            // kunci). Disimpan di sesi supaya layar hasil & admin bisa
            // menjelaskan ke siswa: ini bukan kesalahan mereka.
            jumlahSoalRusak: jumlahTidakBisaDinilai || 0,
            waktuSelesai: serverTimestamp(),
          });
        } catch (eUpd) {
          // 🔥 BARU (2026-10-08): 'not-found' di sini artinya dokumen sesi
          // sudah DIHAPUS (reset admin) sementara layar ini masih terbuka.
          // updateDoc ke dokumen almarhum gak akan pernah sukses berapa
          // kali pun dicoba -- jadi JANGAN masuk antrean retry jaringan;
          // langsung lempar ke jalur pemulihan (tahan jawaban + layar jujur).
          if (kodeGagalKirim(eUpd) !== 'not-found') throw eUpd;
          const konteks = await bacaKonteksSesiHilang();
          const putusan = putusanPemulihanKirim({ kode: 'not-found', ...konteks });
          const errPulih = new Error('Dokumen sesi sudah tidak ada saat kirim hasil');
          errPulih.putusanPulih = putusan;
          errPulih.konteksKirim = konteks;
          throw errPulih;
        }
      }

      // Nambah XP -- kalau ini gagal, gak apa-apa dilanjut (bisa
      // dikoreksi belakangan lewat "Hitung Ulang" di admin), karena
      // data JAWABAN & SKOR-nya sendiri udah pasti aman tersimpan
      // (baris di atas udah berhasil kalau sampai sini).
      if (studentId) {
        const progRef = doc(db, 'siswa_progress', studentId);
        const snap = await getDoc(progRef);
        const existing = snap.exists() ? snap.data() : {};
        const { xpMingguIni, xpMingguIniKunci } = tambahXpMingguan(existing.xpMingguIni, existing.xpMingguIniKunci, xpFinal);
        await updateDoc(progRef, {
          xp: (existing.xp || 0) + xpFinal, xpMingguIni, xpMingguIniKunci, updatedAt: serverTimestamp(),
        }).catch(async () => {
          await setDoc(progRef, { xp: xpFinal, xpMingguIni, xpMingguIniKunci, updatedAt: serverTimestamp() }, { merge: true });
        });
      }

      setHasilAkhir({ xpMentah, xpFinal, totalSkorPersen, pelanggaran, jumlahSoalRusak: jumlahTidakBisaDinilai || 0 });
      setTahap('selesai');
    } catch (e) {
      if (e && e.putusanPulih) {
        // Tahan dulu jawabannya biar gak hilang; kalau MENAHAN-nya aja
        // gagal (mis. beneran offline total), jatuh ke layar lama yang
        // punya tombol coba lagi -- jawaban tetap aman di memori.
        const okTahan = await tahanHasilTertahan(e.putusanPulih, e.konteksKirim || {}, skorRingkas);
        if (okTahan) {
          setLayarKirimDireset(e.putusanPulih);
        } else {
          setGagalKirimAkhir(true);
        }
        setSedangMengirimAkhir(false);
        return;
      }
      console.error(`Gagal menyimpan hasil try out (percobaan ke-${percobaan}):`, e);
      if (percobaan < 3) {
        // Coba lagi otomatis, jeda makin lama tiap gagal (1.5s, 3s).
        setTimeout(() => jalan(percobaan + 1), percobaan * 1500);
        return;
      }
      // 🔒 Udah dicoba 3x tetap gagal -- JANGAN klaim selesai. Kasih
      // tau siswa jelas + tombol coba lagi manual, biar dia gak
      // ninggalin halaman ini dalam keadaan salah kira udah kelar.
      setGagalKirimAkhir(true);
    }
    setSedangMengirimAkhir(false);
  }
    return jalan(percobaanKe);
  }, [paket, jawaban, pelanggaran, sesiId, fotoPengawasan, studentId, bacaKonteksSesiHilang, tahanHasilTertahan]);

  // 🔥 BARU (2026-10-08): tombol di layar "sesimu sudah direset" --
  // bersihkan state sesi LAMA di perangkat, lalu muat ulang lewat jalur
  // RESMI muatPaketDanSesi() (yang ikut mengecek deadline & izin ulang,
  // jadi layar ini gak bisa dipakai buat menerobos deadline). Kalau
  // siswa ternyata sudah punya sesi baru, jalur yang sama bakal
  // melanjutkannya (pilihSesiUtama menang-kan yang 'berjalan').
  const muatUlangSetelahDireset = useCallback(() => {
    setLayarKirimDireset(null);
    setGagalKirimAkhir(false);
    setGagalSimpanProgres(false);
    setSesiHilangDiServer(false);
    sesiHilangRef.current = false;
    setSesiId(null);
    setJawaban({});
    setFotoPengawasan([]);
    setSubtesAktifIndex(0);
    setIndexSoalAktif(0);
    setHasilAkhir(null);
    setTahap('memuat');
    muatPaketDanSesi();
  }, [muatPaketDanSesi]);

  // ---------------- TIMER ----------------
  // 🔥 BARU (2026-10-08): terima opsi { manual } -- dipanggil dari tombol
  // "Selesai Subtes Ini" (siswa sengaja menutup subtes lebih awal) ATAU
  // dari timer yang habis sendiri. Keduanya pakai banner non-memblokir,
  // BUKAN alert() (lihat catatan pesanTransisi di atas).
  const pindahSubtesBerikutnya = useCallback((opsi = {}) => {
    if (!paket) return;
    const berikutnya = subtesAktifIndex + 1;
    if (berikutnya >= paket.subtes.length) {
      selesaikanTryOut();
      return;
    }
    const sekarang = Date.now();
    const namaLama = paket.subtes[subtesAktifIndex]?.nama || `Subtes ${subtesAktifIndex + 1}`;
    const namaBaru = paket.subtes[berikutnya]?.nama || `Subtes ${berikutnya + 1}`;
    setSubtesAktifIndex(berikutnya);
    setWaktuMulaiSubtesMs(sekarang);
    setIndexSoalAktif(0);
    simpanProgres(jawaban, berikutnya, sekarang);
    tampilPesanTransisi(opsi.manual
      ? `✅ Subtes "${namaLama}" dikumpulkan. Sekarang subtes "${namaBaru}" -- waktunya mulai lagi dari awal, dan kamu tidak bisa balik ke subtes sebelumnya.`
      : `⏰ Waktu subtes "${namaLama}" habis. OTOMATIS lanjut ke subtes "${namaBaru}" -- kamu tidak bisa balik ke subtes sebelumnya.`);
  }, [paket, subtesAktifIndex, jawaban, simpanProgres, selesaikanTryOut, tampilPesanTransisi]);

  const { teksWaktu, hampirHabis, sisaMs } = useTimerTryOut({
    aktif: tahap === 'mengerjakan',
    modeTimer: paket?.modeTimer,
    waktuMulaiMs,
    durasiTotalMenit: paket?.durasiTotalMenit,
    subtes: paket?.subtes,
    subtesAktifIndex,
    waktuMulaiSubtesMs,
    onHabis: paket?.modeTimer === 'per-subtes' ? pindahSubtesBerikutnya : selesaikanTryOut,
  });

  // ================= RENDER =================
  if (tahap === 'memuat') return <div style={st.latarTerang}><div style={st.pusat}>Memuat try out...</div></div>;
  if (tahap === 'tidak-ditemukan') return <div style={st.latarTerang}><div style={st.pusat}>Try out tidak ditemukan.</div></div>;
  if (tahap === 'belum-dibuka') {
    return (
      <div style={st.latarTerang}><div style={{ ...st.pusat, flexDirection: 'column', gap: 8 }}>
        <div style={{ fontSize: 40 }}>🔒</div>
        <div style={{ fontWeight: 700, color: '#1e293b' }}>Try out ini belum dibuka</div>
        <div style={{ fontSize: 12.5 }}>Dibuka {new Date(paket.waktuBuka).toLocaleString('id-ID')}</div>
        <button onClick={() => navigate('/siswa/tryout')} style={{ ...st.tombolSekunder, marginTop: 10 }}>Kembali</button>
      </div></div>
    );
  }
  if (tahap === 'lewat-deadline') {
    return (
      <div style={st.latarTerang}><div style={{ ...st.pusat, flexDirection: 'column', gap: 8 }}>
        <div style={{ fontSize: 40 }}>⏰</div>
        <div style={{ fontWeight: 700, color: '#1e293b' }}>Try out ini sudah lewat deadline</div>
        <div style={{ fontSize: 12.5 }}>Ditutup {new Date(paket.waktuTutup).toLocaleString('id-ID')}</div>
        <div style={{ fontSize: 11.5, color: '#94a3b8', marginTop: 4 }}>Kalau kamu merasa ini keliru, minta admin/gurumu buat cek ulang.</div>
        <button onClick={() => navigate('/siswa/tryout')} style={{ ...st.tombolSekunder, marginTop: 10 }}>Kembali</button>
      </div></div>
    );
  }
  if (tahap === 'gagal') {
    return (
      <div style={st.latarTerang}><div style={{ ...st.pusat, flexDirection: 'column', gap: 10 }}>
        <div style={{ fontSize: 40 }}>📡</div>
        <div style={{ fontWeight: 700, color: '#1e293b' }}>Gagal memuat try out</div>
        <div style={{ fontSize: 12.5, color: '#94a3b8' }}>Kemungkinan koneksi internetmu lagi lambat/putus.</div>
        <button onClick={() => { setTahap('memuat'); muatPaketDanSesi(); }} style={{ ...st.tombolUtama, width: 'auto', padding: '10px 24px' }}>
          🔄 Coba Lagi
        </button>
      </div></div>
    );
  }

  if (tahap === 'mulai') {
    if (paket && Array.isArray(paket.daftarSoal) && paket.daftarSoal.length === 0) {
      return (
        <div style={st.latarTerang}><div style={kolom(560)}>
          <div style={{ ...st.soalCard, textAlign: 'center', padding: 28 }}>
            <div style={{ fontSize: 40, marginBottom: 10 }}>📚</div>
            <h2 style={{ fontSize: 17, fontWeight: 800, color: '#0f172a' }}>Tidak ada soal untuk mapelmu</h2>
            <p style={{ fontSize: 13, color: '#64748b', lineHeight: 1.6, margin: '10px 0 16px' }}>
              {paket._filterMapelPesan || 'Paket ini tidak berisi soal dari mapel yang kamu ikuti. Minta admin cek "Akses Mapel" di data siswa dan komposisi try out.'}
            </p>
            <button type="button" onClick={() => window.history.back()} style={st.tombolSekunder}>Kembali</button>
          </div>
        </div></div>
      );
    }

    const jumlahSubtes = (paket.subtes || []).length;
    const totalMenit = paket.modeTimer === 'total'
      ? (paket.durasiTotalMenit || 0)
      : (paket.subtes || []).reduce((a, b) => a + (b.durasiMenit || 0), 0);
    const menitPerSoal = paket.totalSoal ? Math.max(1, Math.round(totalMenit / paket.totalSoal)) : 0;

    return (
      <div style={st.latarTerang}><div style={kolom(620)}>
        <button onClick={() => navigate(-1)} style={st.backBtn}><ChevronLeft size={20} /></button>
        <h1 style={st.judulTerang}>{paket.judul}</h1>
        <p style={st.subJudul}>Try out resmi Bimbel Gemilang · diawasi sistem & pembimbing</p>

        <div style={st.statList}>
          <div style={st.statItem}>
            <span style={st.statIkon}><FileText size={16} /></span>
            <div><b style={st.statAngka}>{paket.totalSoal}</b><span style={st.statLabel}>soal pilihan ganda & variasi</span></div>
          </div>
          <div style={st.statItem}>
            <span style={st.statIkon}><Timer size={16} /></span>
            <div><b style={st.statAngka}>{menitPerSoal} menit</b><span style={st.statLabel}>rata-rata per soal{jumlahSubtes ? ` · ${jumlahSubtes} subtes` : ''}</span></div>
          </div>
          <div style={st.statItem}>
            <span style={st.statIkon}><Award size={16} /></span>
            <div><b style={st.statAngka}>XP & lencana</b><span style={st.statLabel}>menanti hasil terbaikmu</span></div>
          </div>
        </div>

        <div style={st.kartuAturan}>
          <b style={{ fontSize: 13.5, color: '#0f172a' }}>Sebelum kamu mulai</b>
          <ol style={{ margin: '8px 0 0', paddingLeft: 18, fontSize: 12.5, color: '#334155', lineHeight: 1.75 }}>
            <li><b>Waktu:</b> {paket.modeTimer === 'total' ? `${paket.durasiTotalMenit} menit untuk seluruh paket` : 'timer berjalan per subtes; setelah subtes ditutup, kamu tidak dapat kembali ke subtes sebelumnya'}. Sesi dikerjakan sekali duduk — pastikan koneksi internetmu stabil.</li>
            <li>Seluruh pengerjaan berada di bawah pengawasan sistem dan pembimbing Bimbel Gemilang.</li>
            <li>Pengerjaan bersifat mandiri. Peserta dilarang membuka tab, jendela, percakapan, atau aplikasi lain selama sesi berlangsung.</li>
            <li>{paket.wajibKamera ? 'Kamera wajib aktif dan wajah peserta harus terlihat jelas selama sesi.' : 'Sistem dapat merekam gambar peserta pada momen tertentu sebagai bagian dari prosedur pengawasan.'}</li>
            <li>Perpindahan tab atau keluar dari mode layar penuh tercatat sebagai pelanggaran dan dapat memengaruhi penilaian serta XP peserta.</li>
            <li>Setiap bentuk kecurangan dapat memengaruhi nilai, peringkat, dan rekomendasi konsultasi akademik peserta.</li>
          </ol>
          <label style={{ display: 'flex', gap: 10, alignItems: 'flex-start', marginTop: 12, fontSize: 12.5, fontWeight: 700, color: '#0f172a', cursor: 'pointer' }}>
            <input type="checkbox" checked={siapPeraturan} onChange={(e) => setSiapPeraturan(e.target.checked)} style={{ width: 18, height: 18, marginTop: 1 }} />
            <span>Saya telah membaca, memahami, dan bersedia mematuhi seluruh peraturan di atas.</span>
          </label>
        </div>

        <p style={{ textAlign: 'center', fontStyle: 'italic', fontSize: 11.5, color: '#94a3b8', margin: '10px 0 12px' }}>SELAMAT BERJUANG — KERJAKAN TERBAIKMU!</p>
        <button
          type="button"
          disabled={!siapPeraturan}
          onClick={() => (paket.wajibKamera ? setTahap('cek-kamera') : mulaiTryOut())}
          style={{ ...st.tombolUtama, opacity: siapPeraturan ? 1 : 0.45, cursor: siapPeraturan ? 'pointer' : 'not-allowed' }}
        >
          Mulai Try Out
        </button>
      </div></div>
    );
  }

  if (tahap === 'cek-kamera') {

    return (
      <div style={st.latarTerang}><div style={{ ...kolom(460), paddingTop: 40, textAlign: 'center' }}>
        <div style={{ fontSize: 40, marginBottom: 8 }}>📷</div>
        <h1 style={{ fontSize: 18, fontWeight: 800, color: '#1e293b' }}>Siapkan Kameramu</h1>
        <p style={{ color: '#6b7280', fontSize: 12.5, margin: '8px 0 16px' }}>
          Try out ini WAJIB kamera aktif selama pengerjaan -- gak bisa dimulai tanpa itu. Pastikan wajahmu kelihatan jelas di preview di bawah.
        </p>

        <div style={{ width: '100%', aspectRatio: '4/3', background: '#1e293b', borderRadius: 14, overflow: 'hidden', marginBottom: 14, position: 'relative' }}>
          <video ref={videoPrepRef} autoPlay muted playsInline style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scaleX(-1)' }} />
          {statusKameraPrep === 'memuat' && (
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: 12.5 }}>
              Menunggu izin kamera dari browser...
            </div>
          )}
          {statusKameraPrep === 'ditolak' && (
            <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: 12, padding: 16, textAlign: 'center', gap: 4 }}>
              <span style={{ fontSize: 22 }}>🚫</span>
              <span style={{ fontWeight: 700 }}>Kamera belum diizinkan</span>
            </div>
          )}
        </div>

        {statusKameraPrep === 'aktif' && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontSize: 12, color: '#16a34a', marginBottom: 14 }}>
            <ShieldAlert size={14} /> Kamera aktif, kamu siap mulai.
          </div>
        )}

        {/* 🔥 BARU: kalau kamera WAJIB (soal ini), TIDAK ADA jalan
            pintas buat "lanjut tanpa kamera" -- try out beneran gak
            bisa dimulai sampai kameranya nyala. Yang ada cuma tombol
            resmi buat COBA LAGI (buat kasus siswa gak sengaja klik
            "Block", atau baru aja benerin izinnya lewat setting
            browser). */}
        {statusKameraPrep === 'ditolak' && (
          <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 10, padding: 12, marginBottom: 14, fontSize: 11.5, color: '#92400e', textAlign: 'left' }}>
            <b>Cara mengizinkan kamera:</b>
            <ol style={{ margin: '6px 0 0', paddingLeft: 18, lineHeight: 1.7 }}>
              <li>Klik ikon 🔒 / kamera di pojok kiri address bar browser</li>
              <li>Pilih "Izinkan" (Allow) untuk kamera</li>
              <li>Klik tombol "Coba Izinkan Lagi" di bawah ini</li>
            </ol>
          </div>
        )}

        <button onClick={lanjutSetelahCekKamera} disabled={statusKameraPrep !== 'aktif'} style={{ ...st.tombolUtama, opacity: statusKameraPrep === 'aktif' ? 1 : 0.5 }}>
          Saya Siap, Mulai Try Out
        </button>

        {statusKameraPrep === 'ditolak' && (
          <button
            onClick={() => setPercobaanKeKamera((n) => n + 1)}
            style={{ ...st.tombolSekunder, marginTop: 8, width: '100%', color: '#5B2ECC', borderColor: '#c4b5fd' }}
          >
            🔄 Coba Izinkan Lagi
          </button>
        )}
      </div></div>
    );
  }

  if (tahap === 'selesai') {
    const skalaOtomatis = hitungSkalaSesi({ status: 'selesai', jawaban }, paket);
    return (
      <div style={st.latarUjian}><div style={kolom(680)}>
        <div style={{ textAlign: 'center', color: '#fff', fontSize: 14, fontWeight: 700, margin: '18px 0 14px' }}>
          Hasil Try Out Kamu
        </div>

        {/* TIKET HASIL -- gaya mockup: kartu putih berlekuk dengan garis putus */}
        <div style={st.tiket}>
          <span style={st.tiketLekukKiri} /><span style={st.tiketLekukKanan} />
          <div style={{ textAlign: 'center', padding: '22px 18px 14px' }}>
            <div style={{ fontSize: 13.5, color: '#334155', fontWeight: 700 }}>
              {hasilAkhir?.totalSkorPersen >= 70 ? 'Selamat! Kerja bagus.' : 'Terima kasih sudah berjuang.'} Skormu
            </div>
            <div style={{ fontSize: 44, fontWeight: 900, color: '#0f172a', margin: '6px 0 2px' }}>
              {hasilAkhir?.totalSkorPersen ?? 0}%
            </div>
            <div style={{ fontSize: 11.5, color: '#64748b' }}>{paket.judul}</div>
            {skalaOtomatis.total !== null && (
              <div style={{ marginTop: 10, fontSize: 12, color: '#3949AB', background: '#eef0fb', borderRadius: 10, padding: '8px 10px', fontWeight: 700 }}>
                Skala Gemilang gaya UTBK: {skalaOtomatis.total}
                <div style={{ fontSize: 10, fontWeight: 500, color: '#64748b', marginTop: 2 }}>
                  {skalaOtomatis.perSubtes.map((x) => `${x.kode} ${x.skala}`).join(' · ')}
                </div>
              </div>
            )}
          </div>
          <div style={st.tiketGaris} />
          <div style={{ padding: '14px 18px 20px', textAlign: 'center' }}>
            <div style={{ fontSize: 12, color: '#64748b', marginBottom: 8 }}>Kamu mendapatkan lencana</div>
            <LencanaPencapaian
              tipe="skor"
              nilai={hasilAkhir?.totalSkorPersen}
              keterangan={paket.judul}
              xp={hasilAkhir?.xpFinal}
            />
          </div>
        </div>

        <div style={{ marginTop: 14 }}>
          {(hasilAkhir?.jumlahSoalRusak || 0) > 0 && (
            <div style={{
              marginTop: 12, background: '#fffbeb', border: '1px solid #fcd34d',
              color: '#92400e', borderRadius: 12, padding: '10px 14px',
              fontSize: 12.5, lineHeight: 1.6,
            }}>
              ⚠️ {hasilAkhir.jumlahSoalRusak} soal tidak ikut dinilai karena data
              soalnya tidak lengkap — <b>ini bukan kesalahanmu</b> dan tidak
              mengurangi skormu. Guru sudah diberi tahu untuk memperbaiki
              soal-soal itu.
            </div>
          )}
        </div>

        <RingkasanPelanggaran
          pelanggaran={hasilAkhir?.pelanggaran || []}
          jumlahFotoTersimpan={fotoPengawasan.length}
          fotoPengawasan={fotoPengawasan}
          xpMentah={hasilAkhir?.xpMentah}
          xpFinal={hasilAkhir?.xpFinal}
        />

        <div style={{ fontSize: 12.5, fontWeight: 800, color: '#fff', margin: '20px 0 10px', letterSpacing: 0.4 }}>📋 TINJAU JAWABAN</div>
        {paket.daftarSoal.map((s, i) => {
          const skor = skorSatuSoal(s, jawaban[s.id]);
          const belumDijawab = soalBelumDijawab(s, jawaban[s.id]);
          return (
            <div key={s.id} style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14, padding: 14, marginBottom: 12, boxShadow: '0 2px 10px rgba(15,23,42,0.08)' }}>
              <div style={{ fontSize: 11.5, color: skor >= 0.99 ? '#16a34a' : skor > 0 ? '#d97706' : '#dc2626', fontWeight: 700, marginBottom: 6 }}>
                Soal {i + 1} -- skor {Math.round(skor * 100)}%{belumDijawab ? ' (Tidak dijawab)' : ''}
              </div>
              {s.bacaan?.teks && (
                <div style={{ background: '#f8fafc', borderRadius: 8, padding: 10, marginBottom: 10, fontSize: 12.5, color: '#334155', lineHeight: 1.6, whiteSpace: 'pre-wrap', textAlign: 'left' }}>
                  <RenderMath text={s.bacaan.teks} />
                </div>
              )}
              {pisahKodeSumber(teksSoalDari(s)).kode && (
                <div style={st.kodeChip}>{pisahKodeSumber(teksSoalDari(s)).kode}</div>
              )}
              <TeksSoalBergambar
                teks={pisahKodeSumber(teksSoalDari(s)).teks}
                gambarUrls={s.gambarUrls} gambarMeta={s.gambarMeta || null}
                gayaTeks={{ marginBottom: 10 }}
                gayaGambar={{ maxHeight: 280, marginBottom: 10 }}
              />
              {s.tabelSoal && <RenderTable table={s.tabelSoal} />}
              <PenahanErrorSoal soalId={s.id}>
                <RendererSoal soal={s} jawabanTerpilih={jawaban[s.id]} modeTinjau />
              </PenahanErrorSoal>
              {s.pembahasan && (
                <details style={{ marginTop: 10 }}>
                  <summary style={{ fontSize: 12.5, fontWeight: 800, color: '#3949AB', cursor: 'pointer' }}>
                    Lihat pembahasan ▾
                  </summary>
                  <div style={{ marginTop: 8, background: '#f5f3ff', borderRadius: 8, padding: 10, fontSize: 12.5, color: '#4c1d95' }}>
                    <div style={{ marginTop: 4 }}><RenderPembahasan teks={s.pembahasan} /></div>
                  </div>
                </details>
              )}
            </div>
          );
        })}

        <button type="button" onClick={() => navigate('/siswa/dashboard')} style={st.tombolUtama}>
          Kembali ke Dashboard
        </button>
      </div></div>
    );
  }

  // ---------------- MENGERJAKAN ----------------
  // 🔥 BARU (keluhan "soalnya gak keluar"): dulu baris ini cuma
  // "Memuat soal..." SELAMANYA kalau posisi soal tidak ada (subtes
  // kosong / indeks keluar rentang). Sekarang siswa dikasih layar yang
  // JUJUR + jalan keluar: kumpulkan jawaban yang sudah tersimpan, atau
  // kembali ke daftar. Jawaban mereka tidak dibuang diam-diam.
  if (!soalAktif) {
    const tidakAdaSoalSamasekali = (paket?.daftarSoal || []).length === 0;
    return (
      <div style={st.latarTerang}><div style={{ ...st.pusat, flexDirection: 'column', gap: 10, padding: 20 }}>
        <div style={{ fontSize: 40 }}>{tidakAdaSoalSamasekali ? '📚' : '🧭'}</div>
        <div style={{ fontWeight: 800, color: '#1e293b', fontSize: 16 }}>
          {tidakAdaSoalSamasekali ? 'Tidak ada soal yang cocok untukmu' : 'Posisi soalmu tidak ditemukan'}
        </div>
        <div style={{ fontSize: 12.5, color: '#64748b', maxWidth: 440, textAlign: 'center', lineHeight: 1.6 }}>
          {tidakAdaSoalSamasekali
            ? 'Paket try out ini tidak memuat soal dari mapel yang kamu ikuti, atau akses mapelmu berubah setelah sesi dimulai. Jawaban yang sudah tersimpan tetap aman.'
            : 'Susunan subtes try out ini berubah setelah sesimu dimulai (misalnya akses mapel diperbarui admin), jadi posisi soal terakhirmu sudah tidak ada. Jawaban yang sudah tersimpan tetap aman.'}
        </div>
        <button
          onClick={() => selesaikanTryOut()}
          disabled={sedangMengirimAkhir}
          style={{ ...st.tombolUtama, width: 'auto', padding: '10px 24px', background: '#16a34a', opacity: sedangMengirimAkhir ? 0.6 : 1 }}
        >
          {sedangMengirimAkhir ? 'Mengirim...' : '📦 Kumpulkan Jawaban Tersimpan'}
        </button>
        <button onClick={() => navigate('/siswa/tryout')} style={st.tombolSekunder}>Kembali ke daftar try out</button>
      </div></div>
    );
  }

  const totalMsSubtes = (paket.modeTimer === 'total'
    ? (paket.durasiTotalMenit || 0)
    : (paket.subtes?.[subtesAktifIndex]?.durasiMenit || 0)) * 60000;
  const pctSisa = totalMsSubtes > 0 ? Math.max(0, Math.min(100, (sisaMs / totalMsSubtes) * 100)) : 0;

  return (
    <div style={st.latarUjian}><div style={kolom(lebar < 640 ? 640 : 820)}>
      {/* Kamera: PiP terlihat = bukti nyala + sumber foto */}
      {paket.wajibKamera && (
        <div style={st.camPip} title="Kamera pengawasan aktif">
          <video
            ref={videoRef}
            autoPlay
            muted
            playsInline
            style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scaleX(-1)' }}
          />
          <div style={{
            position: 'absolute', bottom: 2, left: 0, right: 0, textAlign: 'center',
            fontSize: 9, fontWeight: 800, color: '#fff', textShadow: '0 1px 2px #000',
          }}
          >
            {statusKamera === 'aktif' ? 'LIVE' : statusKamera === 'memuat' ? '...' : 'OFF'}
          </div>
        </div>
      )}
      {!paket.wajibKamera && (
        <video ref={videoRef} autoPlay muted playsInline style={{ display: 'none' }} />
      )}

      {/* HEADER gaya mockup: baris judul + bar timer teal */}
      <div style={st.headerBar}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button
            type="button"
            onClick={() => setLihatPalet((v) => !v)}
            style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', padding: 4 }}
            title={lihatPalet ? 'Sembunyikan palet nomor' : 'Lihat palet nomor soal'}
          >
            <ChevronLeft size={20} style={{ transform: lihatPalet ? 'rotate(-90deg)' : 'rotate(90deg)' }} />
          </button>
          <div style={{ color: 'white', fontSize: 14, fontWeight: 800 }}>
            {paket.modeTimer === 'per-subtes' ? paket.subtes[subtesAktifIndex]?.nama : paket.judul}
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {paket.wajibKamera && (
            <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10.5, color: statusKamera === 'aktif' ? '#4ade80' : '#f87171', fontWeight: 700 }}>
              <Camera size={12} /> {statusKamera === 'aktif' ? 'AKTIF' : statusKamera === 'memuat' ? '...' : 'OFF'}
            </span>
          )}
        </div>
      </div>
      <div style={st.timerTrack}>
        <div style={{ ...st.timerFill, width: `${pctSisa}%`, background: hampirHabis ? '#f87171' : '#2DD4A8' }} />
        <span style={st.timerTeks}>
          <Clock size={13} /> {teksWaktu}
        </span>
      </div>

      {/* 🔥 BARU: banner transisi subtes NON-MEMBLOKIR (pengganti alert)
          -- pindah subtes karena waktu habis atau karena siswa sendiri
          yang menutup subtes. Hilang sendiri setelah 7 detik. */}
      {pesanTransisi && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8, background: '#eef2ff',
          border: '1px solid #c7d2fe', borderRadius: 10, padding: '10px 14px',
          marginBottom: 12, fontSize: 12.5, color: '#3730a3', fontWeight: 700,
        }}
        >
          {pesanTransisi}
        </div>
      )}

      {/* 🔥 BARU: peringatan JELAS kalau progres gagal kesimpen -- jangan
          reload/tutup app sampai ini ilang, biar jawaban gak "kelewat" */}
      {gagalSimpanProgres && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 10, padding: '10px 14px', marginBottom: 12, fontSize: 12, color: '#b91c1c', fontWeight: 700 }}>
          ⚠️ Jawaban terakhir belum berhasil tersimpan -- cek koneksi internetmu. JANGAN tutup/reload halaman ini dulu.
        </div>
      )}

      {/* 🔥 BARU (2026-10-08): banner jujur kalau dokumen sesi ternyata
          sudah tidak ada lagi di server (biasanya direset guru biar bisa
          kerjain ulang). Beda sama banner merah di atas: ini BUKAN salah
          koneksi, jadi anak gak disuruh cek internet sia-sia -- dia cuma
          perlu tahu jawabannya masih aman di perangkat dan akan ditahan
          aman sistem di akhir pengerjaan. */}
      {sesiHilangDiServer && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#fffbeb', border: '1px solid #fcd34d', borderRadius: 10, padding: '10px 14px', marginBottom: 12, fontSize: 12, color: '#92400e', fontWeight: 700 }}>
          ⚠️ Sesi try out-mu sudah tidak ada lagi di server (biasanya karena direset guru/admin supaya kamu bisa kerjain ulang). JANGAN tutup halaman ini -- jawabanmu masih aman di perangkat ini dan akan ditahan aman sebagai cadangan saat kamu selesai.
        </div>
      )}

      {/* PALET NOMOR SOAL -- tersembunyi sesuai format linear mockup;
          dibuka lewat tombol di header bila peserta ingin melompat. */}
      {lihatPalet && (
      <div style={{
        display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 14, padding: 12,
        background: 'rgba(255,255,255,0.95)', borderRadius: 14, border: '1px solid #e2e8f0',
      }}
      >
        {daftarSoalAktif.map((s, i) => {
          const answered = jawaban[s.id] !== undefined;
          const active = i === indexSoalAktif;
          return (
            <button
              key={s.id}
              type="button"
              onClick={() => { setIndexSoalAktif(i); try { cobaAmbilFoto(); } catch { /* foto pengawasan gagal jangan menghalangi navigasi */ } }}
              style={{
                width: 34, height: 34, borderRadius: 10,
                border: active ? '2px solid #5B2ECC' : '1px solid #e2e8f0',
                background: active ? '#5B2ECC' : answered ? '#ede9fe' : '#fff',
                fontSize: 12, fontWeight: 800,
                color: active ? '#fff' : answered ? '#5B2ECC' : '#64748b',
                cursor: 'pointer',
              }}
            >
              {i + 1}
            </button>
          );
        })}
      </div>
      )}

      {/* SOAL */}
      <div style={st.soalCard}>
        {(() => {
          const kodeSrc = pisahKodeSumber(teksSoalDari(soalAktif));
          return kodeSrc.kode ? <div style={st.kodeChip}>{kodeSrc.kode}</div> : null;
        })()}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, paddingBottom: 10, borderBottom: '1px solid #f1f5f9' }}>
          <span style={{ fontSize: 12, color: '#64748b', fontWeight: 700 }}>
            Soal {indexSoalAktif + 1}/{daftarSoalAktif.length}
          </span>
          <span style={{ fontSize: 10.5, color: '#3949AB', background: '#eef0fb', borderRadius: 999, padding: '3px 10px', fontWeight: 800 }}>
            {soalAktif.materi || (paket.modeTimer === 'per-subtes' ? paket.subtes[subtesAktifIndex]?.nama : '')}
          </span>
        </div>
        {(soalAktif.bacaan?.teks || (soalAktif.bacaan?.gambar || []).length > 0) && (
          <div style={{
            background: 'linear-gradient(180deg, #f8fafc 0%, #fff 100%)',
            border: '1px solid #e2e8f0',
            borderRadius: 12,
            padding: 14,
            marginBottom: 14,
            textAlign: 'left',
            maxHeight: 280,
            overflowY: 'auto',
            position: 'sticky',
            top: 8,
            zIndex: 2,
            boxShadow: '0 2px 10px rgba(15,23,42,0.04)',
          }}
          >
            <div style={{ fontSize: 11, fontWeight: 800, color: '#64748b', marginBottom: 8, letterSpacing: 0.3, textTransform: 'uppercase' }}>
              {(() => {
                const r = soalAktif.stimulusRentang || soalAktif.bacaan?.rentang;
                return r ? `Bacaan bersama (no ${r.dari}–${r.sampai})` : 'Bacaan / stimulus';
              })()}
            </div>
            {soalAktif.bacaan?.teks && (
              <div style={{ fontSize: 13, color: '#334155', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>
                <RenderMath text={soalAktif.bacaan.teks} />
              </div>
            )}
            {(soalAktif.bacaan?.gambar || []).length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
                {soalAktif.bacaan.gambar.map((g, gi) => {
                  const url = typeof g === 'string' ? g : g?.url;
                  if (!url) return null;
                  return <img key={gi} src={url} alt="" style={{ maxWidth: '100%', maxHeight: 200, borderRadius: 8, border: '1px solid #e2e8f0' }} />;
                })}
              </div>
            )}
          </div>
        )}
        <TeksSoalBergambar
          teks={pisahKodeSumber(teksSoalDari(soalAktif)).teks}
          gambarUrls={soalAktif.gambarUrls} gambarMeta={soalAktif.gambarMeta || null}
          gayaTeks={{ fontSize: 14, marginBottom: 16 }}
          gayaGambar={{ maxHeight: 320, marginBottom: 16 }}
        />
        {/* 🔥 BARU (celah serius lain ditemukan): tabel yang nempel di
            soal (mis. kunci determinasi biologi) -- SAMA SEKALI GAK
            PERNAH DIRENDER, padahal komponennya udah lama ada, cuma
            kepakai di preview admin doang. */}
        {soalAktif.tabelSoal && <RenderTable table={soalAktif.tabelSoal} />}
        <PenahanErrorSoal soalId={soalAktif.id}>
          <RendererSoal
            soal={soalAktif}
            jawabanTerpilih={jawaban[soalAktif.id]}
            onChange={(val) => ubahJawaban(soalAktif.id, val)}
          />
        </PenahanErrorSoal>
      </div>

      {/* NAVIGASI -- tombol hijau mengikuti putusanNav (util teruji):
          'soal-berikutnya' | 'subtes-berikutnya' | 'selesai'. */}
      <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
        <button
          onClick={() => { try { cobaAmbilFoto(); } catch { /* foto pengawasan gagal jangan menghalangi navigasi */ } setIndexSoalAktif((i) => Math.max(0, i - 1)); }}
          disabled={indexSoalAktif === 0}
          style={{ ...st.tombolSekunder, opacity: indexSoalAktif === 0 ? 0.4 : 1 }}
        >
          Sebelumnya
        </button>
        {putusanNav.aksi === 'soal-berikutnya' ? (
          <button onClick={() => { cobaAmbilFoto(); setIndexSoalAktif((i) => i + 1); }} style={{ ...st.tombolUtama, flex: 1 }}>Selanjutnya</button>
        ) : (
          <button
            onClick={() => (putusanNav.aksi === 'subtes-berikutnya'
              ? pindahSubtesBerikutnya({ manual: true })
              : selesaikanTryOut())}
            disabled={sedangMengirimAkhir}
            style={{
              ...st.tombolUtama, flex: 1,
              // hijau cuma buat tombol kumpul terakhir; tombol pindah
              // subtes tetap ungu khas tombol utama (jangan kasih
              // `background: undefined` -- itu malah MENGHAPUS gradien)
              ...(putusanNav.aksi === 'selesai' ? { background: '#16a34a' } : {}),
              opacity: sedangMengirimAkhir ? 0.6 : 1,
            }}
          >
            {sedangMengirimAkhir ? 'Mengirim...' : (
              <>
                <CheckCircle2 size={16} /> {putusanNav.label}
              </>
            )}
          </button>
        )}
      </div>

      {/* 🔥 BARU: layar gagal kirim -- muncul TIMPA semua kalau
          penyimpanan hasil final beneran gagal terus setelah 3x
          dicoba. Siswa TIDAK dianggap selesai, jawabannya tetap aman
          di memori, tinggal klik coba lagi begitu koneksi membaik. */}
      {gagalKirimAkhir && (
        <div style={st.overlay}>
          <div style={st.modal}>
            <div style={{ fontSize: 32, marginBottom: 10 }}>📡</div>
            <div style={{ fontWeight: 800, color: '#b91c1c', marginBottom: 6 }}>Gagal Mengirim Hasil</div>
            <div style={{ fontSize: 12.5, color: '#7f1d1d', marginBottom: 14 }}>
              Jawabanmu AMAN, belum hilang -- cuma belum berhasil terkirim ke server. Cek koneksi internetmu, lalu coba lagi.
            </div>
            <button onClick={() => selesaikanTryOut()} disabled={sedangMengirimAkhir} style={st.tombolUtama}>
              {sedangMengirimAkhir ? 'Mengirim...' : '🔄 Coba Kirim Lagi'}
            </button>
          </div>
        </div>
      )}

      {/* 🔥 BARU (2026-10-08, keluhan owner "anak-anak banyak yang lihat
          Gagal Mengirim Hasil setelah aku ulangi"): layar jujur buat kasus
          dokumen sesi sudah dihapus reset sementara layar anak masih
          terbuka. Tombol "Coba Kirim Lagi" di layar merah gak akan pernah
          menang di kasus ini (updateDoc ke dokumen yang sudah tidak ada),
          jadi di sini jawabannya DITAHAN dulu di tryout_hasil_tertahan,
          lalu anak ditawari muat ulang: mulai dari awal, atau melanjutkan
          sesi terbarunya kalau dia sudah sempat mulai ulang. */}
      {layarKirimDireset && (
        <div style={st.overlay}>
          <div style={st.modal}>
            <div style={{ fontSize: 32, marginBottom: 10 }}>🧭</div>
            <div style={{ fontWeight: 800, color: '#b45309', marginBottom: 6 }}>Sesi Try Out-mu Sudah Direset</div>
            <div style={{ fontSize: 12.5, color: '#78350f', marginBottom: 14 }}>
              {layarKirimDireset === 'tahan-lanjutkan-lain'
                ? 'Jawabanmu di layar lama ini TIDAK hilang -- sistem sudah menahannya dengan aman sebagai cadangan. Kamu ternyata sudah punya sesi yang lebih baru di server. Klik tombol di bawah untuk melanjutkan sesi terbarumu itu.'
                : 'Guru/admin mereset sesi try out-mu supaya kamu bisa mengerjakan ulang dari awal. Jawaban di layar ini TIDAK hilang -- sistem sudah menahannya dengan aman sebagai cadangan. Klik tombol di bawah untuk memuat ulang sesimu.'}
            </div>
            <button onClick={muatUlangSetelahDireset} style={st.tombolUtama}>
              {layarKirimDireset === 'tahan-lanjutkan-lain' ? '➡️ Lanjutkan Sesi Terbaruku' : '🔄 Muat Ulang & Mulai Dari Soal 1'}
            </button>
          </div>
        </div>
      )}

      {/* PERINGATAN KECURANGAN */}
      {showPeringatan && (
        <div style={st.overlay}>
          <div style={st.modal}>
            <ShieldAlert size={32} color="#dc2626" style={{ marginBottom: 10 }} />
            <div style={{ fontWeight: 800, color: '#b91c1c', marginBottom: 6 }}>Pelanggaran Terdeteksi</div>
            <div style={{ fontSize: 12.5, color: '#7f1d1d', marginBottom: 14 }}>
              Ini pelanggaran ke-{pelanggaran.length}. Kejadian ini tercatat dan akan memotong XP try out ini.
            </div>
            <button onClick={tutupPeringatan} style={st.tombolUtama}>Mengerti, Lanjutkan</button>
          </div>
        </div>
      )}
    </div></div>
  );
}

// ============================================================
// TOKEN DESAIN (2026-10-10): mengikuti mockup owner -- latar indigo untuk
// layar ujian & hasil, kartu putih, aksen pink untuk tombol utama, bar
// timer teal. Logika tidak berubah; ini murni kulit.
// ============================================================
const st = {
  latarUjian: { minHeight: '100vh', background: 'linear-gradient(180deg, #3949AB 0%, #3D4DB7 55%, #3949AB 100%)' },
  latarTerang: { minHeight: '100vh', background: '#F4F6FB' },
  pusat: { display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', color: '#64748b', fontSize: 13 },
  backBtn: { display: 'flex', alignItems: 'center', gap: 4, background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', marginBottom: 14, fontSize: 13, fontWeight: 700, padding: 0 },
  tombolUtama: {
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
    padding: '14px 20px', borderRadius: 12, border: 'none',
    background: '#F4547E',
    color: 'white', fontWeight: 800, fontSize: 14, cursor: 'pointer', width: '100%',
    boxShadow: '0 6px 18px rgba(244,84,126,0.35)',
  },
  tombolSekunder: {
    padding: '13px 20px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.55)',
    background: 'rgba(255,255,255,0.12)', color: '#fff', fontWeight: 700, fontSize: 13, cursor: 'pointer',
  },
  overlay: { position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, backdropFilter: 'blur(4px)' },
  modal: { background: 'white', borderRadius: 20, padding: 28, maxWidth: 360, textAlign: 'center', boxShadow: '0 20px 50px rgba(0,0,0,0.2)' },
  // layar terang (intro, error, kamera)
  shellTerang: { maxWidth: 560, margin: '0 auto', padding: '18px 18px 34px', minHeight: '100vh', background: '#F4F6FB' },
  judulTerang: { fontSize: 21, fontWeight: 900, color: '#0f172a', margin: '2px 0 4px', letterSpacing: -0.2 },
  subJudul: { fontSize: 12, color: '#8a94a6', margin: '0 0 18px' },
  statList: { background: '#fff', borderRadius: 16, border: '1px solid #eceff7', padding: '6px 16px', marginBottom: 14 },
  statItem: { display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0', borderBottom: '1px solid #f1f3fa' },
  statIkon: { width: 38, height: 38, borderRadius: 999, border: '1.5px solid #3949AB', color: '#3949AB', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  statAngka: { display: 'block', fontSize: 14.5, fontWeight: 800, color: '#1e2a78', lineHeight: 1.2 },
  statLabel: { display: 'block', fontSize: 11.5, color: '#8a94a6' },
  kartuAturan: { background: '#fff', borderRadius: 16, border: '1px solid #eceff7', padding: 16, marginBottom: 8 },
  // layar ujian & hasil: latar indigo mockup
  shellUjian: { maxWidth: 720, margin: '0 auto', padding: '12px 14px 30px', minHeight: '100vh', background: 'linear-gradient(180deg, #3949AB 0%, #3D4DB7 55%, #3949AB 100%)' },
  headerBar: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10,
    padding: '6px 2px 8px', color: '#fff',
  },
  timerTrack: { position: 'relative', height: 34, borderRadius: 999, background: 'rgba(13,23,77,0.55)', overflow: 'hidden', marginBottom: 14 },
  timerFill: { position: 'absolute', top: 0, left: 0, bottom: 0, borderRadius: 999, transition: 'width 1s linear' },
  timerTeks: {
    position: 'absolute', right: 12, top: 0, bottom: 0, display: 'flex', alignItems: 'center', gap: 5,
    color: '#fff', fontFamily: 'monospace', fontWeight: 800, fontSize: 14,
  },
  soalCard: {
    background: '#fff', border: '1px solid #e6e9f5', borderRadius: 16, padding: 18,
    marginBottom: 14, boxShadow: '0 6px 22px rgba(13,23,77,0.18)',
  },
  tiket: { position: 'relative', background: '#fff', borderRadius: 18, boxShadow: '0 10px 30px rgba(13,23,77,0.28)', maxWidth: 460, margin: '0 auto' },
  kodeChip: {
    display: 'inline-block', fontSize: 10.5, fontWeight: 800, letterSpacing: 0.4,
    color: '#0f172a', borderLeft: '3px solid #7c3aed', paddingLeft: 8,
    marginBottom: 8, textTransform: 'uppercase',
  },
  tiketGaris: { borderTop: '2px dashed #d3d8e8', margin: '0 14px' },
  tiketLekukKiri: { position: 'absolute', left: -11, top: '50%', transform: 'translateY(-50%)', width: 22, height: 22, borderRadius: 999, background: '#3D4DB7' },
  tiketLekukKanan: { position: 'absolute', right: -11, top: '50%', transform: 'translateY(-50%)', width: 22, height: 22, borderRadius: 999, background: '#3D4DB7' },
  camPip: {
    position: 'fixed', right: 12, bottom: 12, width: 104, height: 78, borderRadius: 12,
    overflow: 'hidden', border: '2px solid #fff', boxShadow: '0 8px 28px rgba(0,0,0,0.28)',
    zIndex: 40, background: '#0f172a',
  },

};