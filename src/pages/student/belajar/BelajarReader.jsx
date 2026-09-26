// src/pages/student/belajar/BelajarReader.jsx
// ============================================================
// MATERI v2 -- READER SISWA (route /siswa/belajar/:materiId/:babId)
// Visual & struktur mengikuti mockup resmi owner:
// docs/desain/mockup-ui-gemilang.png (Turn 5).
//   - Topbar: Kembali | search pill | lonceng + avatar
//   - Breadcrumb chips, judul besar, progress "x/y bagian"
//   - Tab: Materi | Ringkasan | Video | Latihan Soal | Diskusi
//   - Kartu konten: rumus kotak biru, tips amber, langkah bernomor
//   - Kuis: satu soal per layar, feedback langsung, pagination
//   - Panel kanan desktop: Daftar Materi + kartu kutipan
//
// Integrasi mendatang (JANGAN dihapus):
//  - Fase 3: banner sinkron guru via `sesi_presentasi` di sini.
//  - Tab Video memakai bab.videoUrl (Supabase) bila diisi admin.
// ============================================================
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft, CheckCircle2, ChevronRight, ChevronLeft, Lightbulb,
  TriangleAlert, Info, Image as IconGambar, RotateCcw, Search, Bell,
  PlayCircle, FileText, MessageCircle, XCircle, BookOpen, Star,
  Presentation, PanelRight,
} from 'lucide-react';
import { MathText } from '../../../components/MathText';
import IsiSections from '../../../components/belajar/IsiSections';
import { buatSlide, SlideView } from '../../../components/belajar/slideMateri';
import JodohBoard from '../../../components/belajar/JodohBoard';
import {
  cariSesiAktif, cariDaftarSesiAktif, cariSesiByKodePresentasi, pantauSesi, tandaiPeserta, kirimJawabanLive,
  antreMaju, batalAntre, pantauAntreanSaya,
} from '../../../services/sesiPresentasiService';
import {
  muatMateriDanBab, muatProgressSiswa, simpanProgressBab,
  simpanTerakhir, persenBab, paksaFlushTulisan,
  muatProfilAkses, cocokMateriUntukSiswa, tambahXpGlobal,
} from '../../../services/materiV2Service';
import {
  T, kartuDasar, chip, lingkaranNomor, barLuar, barDalam,
  tombolPill, kotakTips, kotakSukses, halamanDasar,
  lencanaSeksi,
} from './tema';

const XP_BACA = 5;
const XP_BENAR = 10;

// ============================================================
// FORMAT SOAL GAYA UJIAN ASLI (TKA/AKM) -- Turn 22
//   'pg'      : pilihan ganda biasa (satu jawaban)
//   'pgMulti' : PGK-MCMA -- centang semua pernyataan benar (>=1)
//   'tabel'   : PGK kategori -- tiap baris pilih satu kolom
//               (mis. Benar/Salah atau Mungkin/Tidak Mungkin)
// ============================================================
const tipeSoal = (s) => String(s?.tipe || 'pg');

// PETUNJUK CARA MENJAWAB per jenis (blueprint TKA standar terbaru,
// arahan owner Turn 39): algoritma pengguna ditampilkan sebagai hint.
const HINT_JAWAB = {
  pg: 'Cara menjawab: baca pertanyaan dulu cari kata kunci, lalu eliminasilah opsi yang paling tidak logis sesuai stimulus.',
  tabel: 'Cara menjawab: nilai SETIAP baris secara mandiri dan isi SEMUA baris — skor dihitung per baris benar.',
  pgMulti: 'Cara menjawab: pindai ulang stimulus; jawaban benar bisa lebih dari satu, jangan berhenti di temuan pertama.',
  jodoh: 'Cara menjawab: baca premis kiri, pilih pasangannya lewat kotak di sampingnya; kunci pasangan paling pasti (jangkar) dulu, opsi sulit terakhir. Satu pilihan boleh jadi jawaban lebih dari satu premis.',
  isian: 'Cara menjawab: ketik jawaban eksak; perhatikan format (pembulatan, tanda koma/titik, satuan).',
  uraian: 'Cara menjawab: tulis poin-per-poin agar selaras kata kunci rubrik; bandingkan dengan referensi setelah dikirim.',
};

// Kredit parsial: tabel per baris, jodohkan per pasangan, lain biner.
const kreditSoal = (s, jaw) => {
  const t = tipeSoal(s);
  if (t === 'tabel') {
    const k = s.jawaban || [];
    if (!Array.isArray(jaw) || !k.length) return 0;
    const benar = k.filter((c, r) => jaw[r] === c).length;
    return benar / k.length;
  }
  if (t === 'jodoh') {
    const k = s.jawaban || [];
    if (!Array.isArray(jaw) || !k.length) return 0;
    const benar = k.filter((c, r) => jaw[r] === c).length;
    return benar / k.length;
  }
  if (t === 'pgMulti') {
    const k = s.jawaban || [];
    return Array.isArray(jaw) && k.length && jaw.length === k.length
      && k.every((x) => jaw.includes(x)) ? 1 : 0;
  }
  if (t === 'isian') {
    const norm = (x) => String(x ?? '').trim().toLowerCase()
      .replace(/\s+/g, ' ').replace(/,/g, '.');
    return norm(jaw) === norm(s.jawaban) ? 1 : 0;
  }
  if (t === 'uraian') return 0; // dinilai mandiri vs referensi
  return jaw === s.jawaban ? 1 : 0;
};
// Turn 89 (koreksi owner): teks soal/stimulus sering MULTIPARAGRAF
// (kutipan cerpen/teks). Pecah pada baris kosong supaya bacaan tidak
// menjadi satu blok panjang; baris pembuka "Bacalah ..." dimiringkan
// seperti cetakan buku, batang soal di akhir ditebalkan.
function TeksSoal({ teks, style }) {
  const paras = String(teks || '').split(/\n{2,}/).map((p) => p.trim()).filter(Boolean);
  const adaBacalah = paras.length > 1 && /^Bacalah\b/.test(paras[0]);
  return (
    <div style={style}>
      {paras.map((p, i) => {
        const pembuka = adaBacalah && i === 0;
        const batang = adaBacalah && i === paras.length - 1;
        return (
          <p key={i} style={{
            margin: i === 0 ? 0 : '10px 0 0',
            lineHeight: pembuka ? 1.7 : 1.9,
            fontStyle: pembuka ? 'italic' : undefined,
            fontWeight: pembuka ? 600 : batang ? 800 : 500,
            color: batang ? undefined : '#33506E',
          }}>
            <MathText text={p} />
          </p>
        );
      })}
    </div>
  );
}

const kolomSoal = (s) => (Array.isArray(s?.kolom) && s.kolom.length
  ? s.kolom : ['Benar', 'Salah']);
const jawabanLengkap = (s, jaw) => {
  const t = tipeSoal(s);
  if (t === 'pgMulti') return Array.isArray(jaw) && jaw.length > 0;
  if (t === 'tabel') {
    return Array.isArray(jaw) && jaw.length === (s.baris || []).length
      && jaw.every((x) => x != null);
  }
  if (t === 'jodoh') {
    return Array.isArray(jaw) && jaw.length === (s.premis || []).length
      && jaw.every((x) => x != null);
  }
  if (t === 'isian' || t === 'uraian') return String(jaw ?? '').trim().length > 0;
  return jaw != null;
};

const kunciTeks = (s) => {
  const t = tipeSoal(s);
  if (t === 'pgMulti') {
    return (s.jawaban || []).map((j) => String.fromCharCode(65 + j)).join(', ');
  }
  if (t === 'tabel') {
    return (s.jawaban || [])
      .map((c, r) => `baris ${r + 1}: ${kolomSoal(s)[c]}`).join('; ');
  }
  if (t === 'jodoh') {
    return (s.jawaban || []).map((c, r) =>
      `${r + 1}→${String.fromCharCode(65 + c)}`).join(', ');
  }
  if (t === 'isian') return String(s.jawaban ?? '');
  if (t === 'uraian') return 'lihat referensi jawaban';
  return String.fromCharCode(65 + (s.jawaban || 0));
};

export default function BelajarReader() {
  const { materiId, babId } = useParams();
  const navigate = useNavigate();
  const studentId = localStorage.getItem('studentId') || '';
  const namaSiswa = localStorage.getItem('studentName') || 'Siswa Gemilang';
  const inisial = namaSiswa.split(' ').map((k) => k[0]).join('').slice(0, 2).toUpperCase();

  const [materi, setMateri] = useState(null);
  const [babList, setBabList] = useState([]);
  const [bab, setBab] = useState(null);
  const [progresMap, setProgresMap] = useState({});
  const [loading, setLoading] = useState(true);

  const [tab, setTab] = useState('materi');
  const [selesaiBaca, setSelesaiBaca] = useState(false);
  const [jawaban, setJawaban] = useState({});
  const [soalIdx, setSoalIdx] = useState(0);
  const [quizTersimpan, setQuizTersimpan] = useState(null);
  const [xpBacaDiberi, setXpBacaDiberi] = useState(false);
  const [xpKuisDiberi, setXpKuisDiberi] = useState(false);
  const [cari, setCari] = useState('');
  const [toast, setToast] = useState(null);
  const [sesiKuis, setSesiKuis] = useState(0);
  const kuisTersimpanSesi = useRef(false);
  const [lebar, setLebar] = useState(
    () => (typeof window !== 'undefined' ? window.innerWidth : 800));

  useEffect(() => {
    const onResize = () => setLebar(window.innerWidth);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);
  // Turn 34: panel daftar materi bisa disembunyikan supaya area baca
  // lega; default terbuka hanya di layar lebar.
  const [panelBuka, setPanelBuka] = useState(true);
  const tampilPanel = lebar >= 1100 && panelBuka;
  const sempit = lebar < 700;

  // ============ SESI PRESENTASI GURU (Fase 3) ============
  const [sesi, setSesi] = useState(null);
  const [profil, setProfil] = useState(null);
  const [antreanSaya, setAntreanSaya] = useState(null);
  const [abaikanIkuti, setAbaikanIkuti] = useState(false);
  const pesertaDitandai = useRef('');
  // Turn 79 HOTFIX: semua hooks WAJIB di atas early return (loading/bab/kunci)
  // altrimenti React #310 "Rendered more hooks than during the previous render".
  const [bebasBaca, setBebasBaca] = useState(false);
  const [kodeInput, setKodeInput] = useState('');
  const [errKode, setErrKode] = useState('');
  const slides = useMemo(() => buatSlide(bab?.sections || []), [bab]);

  // Turn 76: dua guru bisa sesi paralel di materi sama. Siswa TIDAK dilempar
  // acak: daftar sesi difilter kelasnya; bila tetap >1, siswa MEMILIH sendiri.
  const [daftarSesi, setDaftarSesi] = useState([]);
  const [pilihSesiId, setPilihSesiId] = useState('');
  useEffect(() => {
    let unsub = null;
    let hidup = true;
    const muat = async () => {
      const list = await cariDaftarSesiAktif({ materiId });
      if (!hidup) return;
      const kelasSiswa = String(localStorage.getItem('studentKelas')
        || localStorage.getItem('studentGrade') || '');
      const angkaS = (kelasSiswa.match(/\d+/) || [])[0] || '';
      const cocok = list.filter((x) => {
        if (!x.kelas || !angkaS) return true;
        return ((String(x.kelas).match(/\d+/) || [])[0]) === angkaS;
      });
      setDaftarSesi(cocok);
      const kodeSimpan = (localStorage.getItem('gemilangSesiKode_' + materiId) || '').toUpperCase();
      const target = cocok.find((x) => x.id === pilihSesiId)
        || (kodeSimpan ? cocok.find((x) => (x.kode || '') === kodeSimpan) : null)
        || (cocok.length === 1 && cocok[0].kelas && angkaS
          && ((String(cocok[0].kelas).match(/\d+/) || [])[0]) === angkaS ? cocok[0] : null);
      if (target) {
        setSesi(target);
        if (unsub) unsub();
        unsub = pantauSesi(target.id, (sn) => {
          setSesi(sn);
          if (!sn || sn.status !== 'aktif') { setSesi(null); muat(); }
        });
      } else {
        setSesi(null);
      }
    };
    muat();
    return () => { hidup = false; if (unsub) unsub(); };
  }, [materiId, pilihSesiId]);

  // kunci jenjang/program (request owner: materi sesuai jenjang)
  useEffect(() => {
    let hidup = true;
    (async () => {
      const p = await muatProfilAkses(
        studentId,
        localStorage.getItem('studentKelas')
          || localStorage.getItem('studentGrade') || '',
        localStorage.getItem('studentProgram') || ''
      );
      if (hidup) setProfil(p);
    })();
    return () => { hidup = false; };
  }, [studentId]);

  const sesiAktif = !!sesi && sesi.status === 'aktif';
  const sesiBabIni = sesiAktif && sesi.babId === babId;
  const ikutAktif = sesiBabIni && sesi.mode === 'mengikuti' && !abaikanIkuti;

  // tandai peserta sekali per sesi (dok kecil, tulis murah)
  useEffect(() => {
    if (sesiBabIni && sesi?.id && pesertaDitandai.current !== sesi.id) {
      pesertaDitandai.current = sesi.id;
      tandaiPeserta(sesi.id).catch(() => {});
    }
  }, [sesiBabIni, sesi]);

  // langganan antrean "coba maju" saya (dok kecil, hanya saat sesi)
  useEffect(() => {
    if (!sesiBabIni || !sesi?.id || !studentId) return undefined;
    return pantauAntreanSaya(sesi.id, studentId, setAntreanSaya);
  }, [sesiBabIni, sesi, studentId]);

  // slide efektif: saat mengikuti sesi pakai versi yang ditayangkan
  // guru (bisa PPT versi guru); belajar mandiri = slide resmi admin
  const slideSiswa = ikutAktif && sesi?.slideUrlAktif
    ? sesi.slideUrlAktif
    : (bab?.slideUrl || '');
  const slideVersiGuruLive = ikutAktif && sesi?.slideUrlAktif
    && sesi.slideUrlAktif !== bab?.slideUrl;

  // Tab saat mengikuti sesi DITURUNKAN dari posisi guru (bukan setState).
  const tabAktifNow = ikutAktif
    ? (sesi?.posisi?.jenis === 'kuis' ? 'latihan'
      : sesi?.posisi?.jenis === 'slide' ? 'slide'
        : sesi?.posisi?.jenis === 'pdf' ? 'pdf' : 'materi')
    : tab;

  // layar siswa mengikuti posisi guru: scroll halus ke bagian terkait
  useEffect(() => {
    if (!ikutAktif || !sesi?.posisi) return undefined;
    const p = sesi.posisi;
    if (p.jenis !== 'section') return undefined;
    const t = setTimeout(() => {
      const el = document.getElementById(`sec-${p.index}`);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 90);
    return () => clearTimeout(t);
  }, [ikutAktif, sesi]);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const { materi: m, babList: bl } = await muatMateriDanBab(materiId);
      setMateri(m);
      setBabList(bl);
      const b = bl.find((x) => x.id === babId) || null;
      setBab(b);
      const pm = await muatProgressSiswa(studentId);
      setProgresMap(pm);
      const p = pm[babId];
      if (p) {
        setSelesaiBaca(!!p.selesaiBab);
        setXpBacaDiberi(!!p.xpGlobalBaca);
        setXpKuisDiberi(!!p.xpGlobalKuis);
        if (p.quizTerbaik != null) setQuizTersimpan(p.quizTerbaik);
      }
      if (m && b) {
        simpanTerakhir({
          materiId: m.id, babId: b.id,
          judul: `${m.judul} — ${b.judul}`,
        });
      }
      setJawaban({});
      setSoalIdx(0);
      setTab('materi');
      kuisTersimpanSesi.current = false;
      setLoading(false);
    })();
  }, [materiId, babId, studentId]);

  const sections = useMemo(() => bab?.sections || [], [bab]);
  const kuis = useMemo(() => bab?.ujiPemahaman || [], [bab]);
  const idxBab = babList.findIndex((b) => b.id === babId);
  const babBerikut = idxBab >= 0 ? babList[idxBab + 1] : null;

  // ============================================================
  // GATE BELAJAR (Turn 29, arahan owner): bab berikutnya baru
  // terbuka setelah LATIHAN bab sebelumnya selesai dijawab semua
  // (flag latihanSelesai di progres_materi_v2).
  // ============================================================
  // Turn 38: TIDAK ADA kunci bab — siswa bebas membuka bab mana pun
  // (kelas 12 TKA perlu refresh materi lama). latihanSelesai tetap
  // dicatat untuk progres & ditandai ✔ di panel, bukan sebagai gerbang.
  const latihanSelesaiBab = (b) => !!progresMap[b?.id]?.latihanSelesai;

  // Menjodohkan (Turn 54, arahan owner): tiap premis memilih respons
  // dari kolam pilihan di sampingnya; SATU RESPONS BOLEH dipakai lebih
  // dari satu premis (kunci boleh sama) seperti CBT TKA asli.
  const pilihJodoh = useCallback((i, r, c) => {
    setJawaban((old) => {
      const arr = Array.isArray(old[i]) ? [...old[i]] : [];
      arr[r] = c == null ? undefined : c;
      return { ...old, [i]: arr };
    });
  }, []);

  // Isian singkat & uraian
  const setIsian = useCallback((i, v) => {
    setJawaban((old) => ({ ...old, [i]: v }));
  }, []);

  // Format TKA: centang banyak jawaban (PGK-MCMA)
  const pilihMulti = useCallback((i, j) => {
    setJawaban((old) => {
      const arr = Array.isArray(old[i]) ? [...old[i]] : [];
      const at = arr.indexOf(j);
      if (at >= 0) arr.splice(at, 1);
      else arr.push(j);
      arr.sort((a, b) => a - b);
      return { ...old, [i]: arr };
    });
  }, []);
  // Format TKA: tabel kategori (per baris pilih satu kolom)
  const pilihTabel = useCallback((i, r, c) => {
    setJawaban((old) => {
      const arr = Array.isArray(old[i]) ? [...old[i]] : [];
      arr[r] = c;
      return { ...old, [i]: arr };
    });
  }, []);

  const tampilToast = useCallback((teks) => {
    setToast(teks);
    setTimeout(() => setToast(null), 2200);
  }, []);

  // Turn 39: skor memakai KREDIT PARSIAL (tabel per baris, jodohkan per
  // pasangan) sesuai blueprint pembobotan TKA.
  const benarCount = useMemo(() =>
    kuis.reduce((a, s, i) => a + kreditSoal(s, jawaban[i]), 0),
  [kuis, jawaban]);
  const semuaDijawab = kuis.length > 0
    && kuis.every((s, i) => jawabanLengkap(s, jawaban[i]));

  // tandai latihan bab selesai begitu semua soal terjawab
  // (ditaruh SETELAH deklarasi semuaDijawab -- bug TDZ Turn 30)
  useEffect(() => {
    if (!semuaDijawab || !babId) return;
    simpanProgressBab(studentId, materiId, babId, { latihanSelesai: true });
  }, [semuaDijawab, studentId, materiId, babId]);

  // Simpan kuis lewat EVENT jawab (bukan effect) -- hemat render
  // & dijamin sekali per sesi berkat ref kuisTersimpanSesi.
  const pilihJawaban = (idxSoal, j) => {
    if (jawaban[idxSoal] != null) return;
    const baru = { ...jawaban, [idxSoal]: j };
    setJawaban(baru);
    if (Object.keys(baru).length !== kuis.length) return;
    if (kuisTersimpanSesi.current) return;
    kuisTersimpanSesi.current = true;
    const benar = kuis.reduce(
      (a, s, ix) => (baru[ix] === s.jawaban ? a + 1 : a), 0);
    const nilai = Math.round((benar / kuis.length) * 100);
    const hasil = { nilai, benar, total: kuis.length, pada: Date.now() };
    const lebihBaik = !quizTersimpan || nilai > quizTersimpan.nilai;
    const simpan = lebihBaik ? hasil : quizTersimpan;
    setQuizTersimpan(simpan);
    const xp = XP_BENAR * benar;
    // XP global resmi sekali-sekali (anti-farming): kuis 1x, baca 1x
    const globalKuis = !xpKuisDiberi ? XP_BENAR * benar : 0;
    const globalBaca = !selesaiBaca && !xpBacaDiberi ? XP_BACA : 0;
    if (globalKuis) setXpKuisDiberi(true);
    if (globalBaca) setXpBacaDiberi(true);
    simpanProgressBab(studentId, materiId, babId, {
      quizTerbaik: simpan,
      xp,
      ...(globalKuis ? { xpGlobalKuis: true } : {}),
      ...(globalBaca ? { xpGlobalBaca: true } : {}),
    });
    if (globalKuis + globalBaca > 0) tambahXpGlobal(globalKuis + globalBaca);
    tampilToast(`Kuis selesai — +${xp} XP ✨`);
  };

  const tandaiSelesaiBaca = () => {
    if (selesaiBaca) return;
    setSelesaiBaca(true);
    const beriGlobal = !xpBacaDiberi;
    if (beriGlobal) setXpBacaDiberi(true);
    simpanProgressBab(studentId, materiId, babId, {
      selesaiBab: true,
      selesaiSections: sections.map((_, i) => i),
      xp: XP_BACA + (quizTersimpan ? XP_BENAR * (quizTersimpan.benar || 0) : 0),
      ...(beriGlobal ? { xpGlobalBaca: true } : {}),
    });
    if (beriGlobal) tambahXpGlobal(XP_BACA);
    tampilToast(`+${XP_BACA} XP — bagian selesai 🎉`);
  };

  const ulangKuis = () => {
    kuisTersimpanSesi.current = false;
    setSesiKuis((s) => s + 1);
    setJawaban({});
    setSoalIdx(0);
  };

  useEffect(() => () => paksaFlushTulisan(), []);

  if (loading) {
    return <div style={halamanDasar}><div style={S.kosong}>Memuat materi...</div></div>;
  }
  if (!bab || !materi) {
    // ANTI-HANTU (Turn 29): materi/bab sudah dihapus admin ->
    // tampilkan penjelasan ramah + bersihkan riwayat "lanjutkan membaca".
    return (
      <div style={halamanDasar}>
        <div style={S.kosong}>
          <div style={{ fontSize: 30, marginBottom: 8 }}>🗂️</div>
          Materi atau bab ini sudah tidak tersedia
          (kemungkinan dihapus/diganti versi baru oleh admin).
          <div style={{ marginTop: 14 }}>
            <button type="button" style={tombolPill('primer')}
              onClick={() => { simpanTerakhir(null); navigate('/siswa/belajar'); }}>
              <ArrowLeft size={15} /> Ke beranda Materi Belajar
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (materi && profil
    && !cocokMateriUntukSiswa(materi, profil,
      localStorage.getItem('studentKelas')
        || localStorage.getItem('studentGrade') || '')) {
    return (
      <div style={halamanDasar}>
        <div style={S.kosong}>
          <div style={{ fontSize: 30, marginBottom: 8 }}>🔒</div>
          Materi ini untuk jenjang/program lain, bukan untuk
          akunmu. Hubungi admin bila merasa ini keliru.
        </div>
      </div>
    );
  }

  const gabungKode = async (kode) => {
    const s2 = await cariSesiByKodePresentasi(kode);
    if (!s2) { setErrKode('Kode tidak ditemukan atau sesi sudah berakhir.'); return; }
    if (s2.materiId !== materiId) { setErrKode('Kode itu untuk materi lain. Minta kode sesi materi ini.'); return; }
    localStorage.setItem('gemilangSesiKode_' + materiId, String(s2.kode || kode).toUpperCase());
    setErrKode(''); setPilihSesiId(s2.id);
  };
  const pemilihSesi = (!sesi && (daftarSesi.length > 0 || true)) ? (
    <div style={{ ...kartuDasar, padding: 14, marginBottom: 12 }}>
      <div style={{ fontWeight: 800, marginBottom: 6 }}> Masuk sesi live</div>
      <div style={{ fontSize: 12.5, color: T.samar, marginBottom: 8 }}>
        Ketik kode sesi yang ditampilkan guru di layar panggung/proyektor.
        Setiap kelas punya kode sendiri sehingga panel guru tetap leluasa.
      </div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <input value={kodeInput} placeholder="KODE SESI (6 karakter)"
          onChange={(e) => setKodeInput(e.target.value.toUpperCase())}
          style={{ flex: 1, minWidth: 160, padding: '10px 12px', borderRadius: 10,
            border: `1px solid ${T.garis}`, fontSize: 15, letterSpacing: 2, textTransform: 'uppercase' }} />
        <button type="button" style={tombolPill('primer')}
          onClick={() => gabungKode(kodeInput)}>Gabung</button>
      </div>
      {errKode && <div style={{ color: T.merah, fontSize: 12, marginTop: 6 }}>{errKode}</div>}
      {daftarSesi.length > 0 && (
        <div style={{ marginTop: 10, fontSize: 12.5, color: T.samar }}>
          Sesi aktif di materi ini:{' '}
          {daftarSesi.map((x) => (
            <button key={x.id} type="button"
              style={{ ...tombolPill('putih'), marginLeft: 6 }}
              onClick={() => gabungKode(x.kode || '')}>
              {x.guruNama || 'Guru'}{x.kelas ? ` · K${x.kelas}` : ''} · {x.kode}
            </button>
          ))}
        </div>
      )}
    </div>
  ) : null;

  const persen = persenBab(bab, {
    selesaiBab: selesaiBaca,
    selesaiSections: selesaiBaca ? sections.map((_, i) => i) : [],
    quizTerbaik: quizTersimpan,
  });
  const unitSelesai = (selesaiBaca ? 1 : 0) + (quizTersimpan ? 1 : 0);
  const unitTotal = 2;
  const babPanel = babList.filter((b) =>
    !cari.trim() || String(b.judul || '').toLowerCase().includes(cari.trim().toLowerCase()));

  // Turn 77: MODE PPT — siswa yang mengikuti sesi materi melihat SLIDE yang
  // sama dengan panggung guru (bukan reader scroll), plus widget antrean.
  const ikutSlide = ikutAktif && sesi?.posisi?.jenis === 'section';
  if (ikutSlide && !bebasBaca && slides.length) {
    const sIdx = Math.min(Number(sesi.posisi.index) || 0, slides.length - 1);
    return (
      <div style={halamanDasar}>
        <div style={{ ...kartuDasar, padding: 14, marginBottom: 12 }}>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            <span style={{ fontWeight: 800 }}>
              📡 Mengikuti layar guru • slide {sIdx + 1}/{slides.length}
            </span>
            <button type="button" style={{ ...tombolPill('putih'), marginLeft: 'auto' }}
              onClick={() => setBebasBaca(true)}>
              📖 Bacaan penuh
            </button>
          </div>
          <div style={{ marginTop: 12 }}><SlideView slide={slides[sIdx]} /></div>
          {sesiBabIni && (
            <div style={{ marginTop: 12 }}>
              {(!antreanSaya || antreanSaya.status === 'selesai') && (
                <button type="button" style={S.queueBtn}
                  onClick={() => antreMaju(sesi.id).catch(() => {})}>
                  🙋 Coba Maju
                </button>
              )}
              {antreanSaya?.status === 'menunggu' && (
                <div style={S.queueChip}>⏳ Menunggu giliran…</div>
              )}
              {antreanSaya?.status === 'dipanggil' && (
                <div style={{ ...S.queueChip, ...S.queueDipanggil }}>
                  🎉 Namamu dipanggil — maju ya!
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div style={halamanDasar}>
      {pemilihSesi}
      {/* ================= TOPBAR ================= */}
      <header style={S.topbar}>
        <button type="button" style={S.kembali}
          onClick={() => navigate(`/siswa/belajar/${materiId}`)}>
          <ArrowLeft size={16} /> Kembali
        </button>
        <div style={S.cariWrap}>
          <Search size={15} color={T.samar} />
          <input
            value={cari}
            onChange={(e) => setCari(e.target.value)}
            placeholder="Cari materi, bab, atau kata kunci..."
            aria-label="Cari bab"
            style={S.cariInput}
          />
        </div>
        <div style={S.topKanan}>
          {lebar >= 1100 && (
            <button type="button" style={S.ikonBulat}
              title={panelBuka
                ? 'Sembunyikan panel daftar materi — baca lebih lega'
                : 'Tampilkan panel daftar materi'}
              onClick={() => setPanelBuka((v) => !v)}>
              <PanelRight size={16} />
            </button>
          )}
          <button type="button" style={S.ikonBulat} aria-label="Notifikasi">
            <Bell size={16} />
          </button>
          <span style={S.avatar} title={namaSiswa}>{inisial}</span>
        </div>
      </header>

      {/* ============ BANNER SESI PRESENTASI (Fase 3) ============ */}
      {sesiAktif && !sesiBabIni && (
        <div style={S.bannerSesi}>
          <span>
            📡 <b>{sesi.guruNama}</b> sedang menjelaskan bab lain
            di materi ini.
          </span>
          <button type="button" style={S.bannerBtn}
            onClick={() => navigate(`/siswa/belajar/${materiId}/${sesi.babId}`)}>
            Gabung sesi
          </button>
        </div>
      )}
      {sesiBabIni && sesi.mode === 'mengikuti' && (
        <div style={S.bannerSesi}>
          <span>
            📡 {ikutAktif
              ? <>Mengikuti sesi <b>{sesi.guruNama}</b> — layarmu mengikuti layar guru.</>
              : <>Kamu melepas sesi; guru masih menyajikan.</>}
          </span>
          <button type="button" style={S.bannerBtn}
            onClick={() => setAbaikanIkuti((v) => !v)}>
            {ikutAktif ? 'Lepas' : 'Ikuti lagi'}
          </button>
        </div>
      )}
      {sesiBabIni && sesi.mode === 'bebas' && (
        <div style={{ ...S.bannerSesi, background: T.amberLatar, borderColor: T.amberGaris, color: T.amberTeks }}>
          <span>✋ Mode bebas — guru memberi waktu membaca sendiri.</span>
        </div>
      )}

      <div style={{ ...S.badan, ...(sempit ? S.badanSempit : null) }}>
        {/* ================= KOLOM UTAMA ================= */}
        <main style={S.utama}>
          {/* breadcrumb + judul + progress */}
          <div style={S.headRow}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={S.chips}>
                <span style={S.chipKategori}>{materi.mapel || '-'}</span>
                <span style={S.chipKategoriOutline}>Kelas {materi.kelas || '-'}</span>
              </div>
              <h1 style={S.judulBesar}>{bab.judul}</h1>
              <div style={S.metaBab}>
                Bab {idxBab + 1} • {materi.judul}
              </div>
            </div>
            <div style={S.progresKanan}>
              <div style={S.progresLabelKecil}>
                <b>Progress Materi</b>
                <span>{unitSelesai} / {unitTotal} bagian</span>
              </div>
              <div style={{ ...barLuar(7), width: 190, maxWidth: '100%' }}>
                <div style={barDalam(persen)} />
              </div>
            </div>
          </div>

          {/* tabs */}
          <div style={S.tabRow} role="tablist">
            {[
              { id: 'materi', label: 'Materi', ikon: <BookOpen size={14} /> },
              { id: 'ringkasan', label: 'Ringkasan', ikon: <FileText size={14} /> },
              { id: 'video', label: 'Video', ikon: <PlayCircle size={14} /> },
              {
                id: 'slide', label: 'Slide', ikon: <Presentation size={14} />,
                hide: !slideSiswa,
              },
              {
                id: 'pdf', label: 'Modul PDF', ikon: <FileText size={14} />,
                hide: !bab.pdfUrl,
              },
              { id: 'latihan', label: 'Latihan Soal', ikon: <CheckCircle2 size={14} /> },
              { id: 'diskusi', label: 'Diskusi', ikon: <MessageCircle size={14} />, soon: true },
            ].filter((t) => !t.hide).map((t) => (
              <button key={t.id} type="button" role="tab"
                aria-selected={tabAktifNow === t.id}
                disabled={t.soon}
                onClick={() => setTab(t.id)}
                style={{
                  ...S.tab,
                  ...(tabAktifNow === t.id ? S.tabAktif : null),
                  ...(t.soon ? S.tabSoon : null),
                }}>
                {t.ikon} {t.label}
                {t.soon && <span style={S.soonBadge}>Segera</span>}
              </button>
            ))}
          </div>

          {/* ---------- TAB MATERI ---------- */}
          {tabAktifNow === 'materi' && (
            <div style={{ ...kartuDasar, ...S.kartuKonten, ...(sempit ? S.kontenSempit : null) }}>
              {/* Turn 86: navigasi chip subbab sticky (mobile-first) */}
              <div style={{
                position: 'sticky', top: 52, zIndex: 20,
                background: 'rgba(255,255,255,.96)', backdropFilter: 'blur(8px)',
                margin: '-4px -4px 12px', padding: '8px 4px',
                display: 'flex', gap: 8, overflowX: 'auto',
              }}>
                {sections.map((s2, i2) => (s2.jenis === 'judul' ? (
                  <button key={i2} type="button"
                    onClick={() => {
                      const el = document.getElementById(`sec-${i2}`);
                      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }}
                    style={{
                      flexShrink: 0, borderRadius: 999, padding: '7px 12px',
                      fontSize: 12, fontWeight: 800, cursor: 'pointer',
                      border: `1.5px solid ${T.kotakBiruGaris}`,
                      background: '#F4F9FF', color: T.biruDalam,
                    }}>
                    {String(s2.teks || '').replace(/^[A-Z]\.\s*/, '')}
                  </button>
                ) : null))}
              </div>
              <div style={S.headSeksi}>
                <span style={lencanaSeksi}>{idxBab + 1}</span>
                <span style={{ flex: 1, fontWeight: 800, fontSize: 15.5, color: T.judul }}>
                  {bab.judul}
                </span>
                <span style={S.emojiSeksi}>{materi.emoji || '📘'}</span>
              </div>
              {bab.ringkasan && <p style={S.ringkasan}>{bab.ringkasan}</p>}
              <IsiSections sections={sections} />
              <button type="button"
                onClick={tandaiSelesaiBaca}
                style={selesaiBaca ? tombolPill('hijau') : tombolPill('primer')}>
                {selesaiBaca
                  ? <><CheckCircle2 size={16} /> Bagian selesai dibaca</>
                  : <><CheckCircle2 size={16} /> Sudah kupahami — tandai selesai</>}
              </button>
            </div>
          )}

          {/* ---------- TAB RINGKASAN ---------- */}
          {tabAktifNow === 'ringkasan' && (
            <div style={{ ...kartuDasar, ...S.kartuKonten, ...(sempit ? S.kontenSempit : null) }}>
              <div style={S.headSeksi}>
                <span style={lencanaSeksi}><FileText size={14} /></span>
                <span style={{ flex: 1, fontWeight: 800, fontSize: 15.5, color: T.judul }}>
                  Ringkasan {bab.judul}
                </span>
              </div>
              <p style={S.paragraf}>
                {bab.ringkasan || 'Ringkasan belum tersedia untuk bagian ini.'}
              </p>
              {/* Turn 82: LEMBAR CARA GEMILANG — agregasi kartu caraGemilang bab ini */}
              {sections.some((s2) => s2.jenis === 'caraGemilang') && (
                <div style={{ marginTop: 14 }}>
                  <div style={{
                    fontWeight: 900, fontSize: 14.5, color: '#5B21B6',
                    background: 'linear-gradient(135deg,#F5F3FF,#EDE9FE)',
                    border: '2px solid #7C3AED', borderRadius: 14,
                    padding: '10px 14px', marginBottom: 10,
                  }}>
                    👑 LEMBAR CARA GEMILANG — kumpulan jurus cepat bab ini
                  </div>
                  {sections.filter((s2) => s2.jenis === 'caraGemilang').map((s2, i2) => (
                    <div key={i2} style={{
                      background: '#FFFDF7', border: '2px solid #F5C542',
                      borderRadius: 14, padding: '10px 12px', marginBottom: 8,
                    }}>
                      <b style={{ color: '#6B4E00', fontSize: 13.5 }}>
                        👑 {s2.judul || 'Cara Gemilang'}
                      </b>
                      {s2.teks ? (
                        <div style={{ fontSize: 13, lineHeight: 1.7, color: '#4C1D95', marginTop: 4 }}>
                          {s2.teks}
                        </div>
                      ) : null}
                      {(s2.items || []).length ? (
                        <ol style={{ margin: '4px 0 0', paddingLeft: 18 }}>
                          {(s2.items || []).map((it, k2) => (
                            <li key={k2} style={{ fontSize: 12.5, lineHeight: 1.65, color: '#3B0764' }}>
                              {it}
                            </li>
                          ))}
                        </ol>
                      ) : null}
                    </div>
                  ))}
                </div>
              )}
              {sections.filter((s) => s.jenis === 'langkah' || s.jenis === 'callout')
                .map((s, i) => (
                  <div key={i} style={s.jenis === 'callout' && String(s.tipe) === 'tips'
                    ? kotakTips : kotakSukses}>
                    <Lightbulb size={14} />
                    <span>
                      {s.judul ? <b>{s.judul}: </b> : null}
                      {s.teks || (s.items || []).join(' • ')}
                    </span>
                  </div>
                ))}
              <div style={S.kutipanKecil}>
                <Star size={13} fill="currentColor" />
                “Ilmu hari ini, masa depan nanti.” — Bimbel Gemilang
              </div>
            </div>
          )}

          {/* ---------- TAB VIDEO ---------- */}
          {tabAktifNow === 'video' && (
            <div style={{ ...kartuDasar, ...S.kartuKonten, ...(sempit ? S.kontenSempit : null) }}>
              <div style={S.headSeksi}>
                <span style={lencanaSeksi}><PlayCircle size={14} /></span>
                <span style={{ flex: 1, fontWeight: 800, fontSize: 15.5, color: T.judul }}>
                  Video Pembelajaran
                </span>
              </div>
              {bab.videoUrl ? (
                <div style={S.videoWrap}>
                  <video src={bab.videoUrl} controls style={S.videoEl} />
                </div>
              ) : (
                <div style={S.videoKosong}>
                  <PlayCircle size={30} />
                  <p style={{ margin: '10px 0 0', fontSize: 13, lineHeight: 1.6 }}>
                    Video untuk bagian ini belum diunggah.
                    Guru/admin dapat menambahkan video lewat Manajer Materi
                    (disimpan di Supabase agar hemat kuota).
                  </p>
                </div>
              )}
            </div>
          )}

          {/* ---------- TAB SLIDE PPT ---------- */}
          {tabAktifNow === 'slide' && slideSiswa && (
            <div style={{ ...kartuDasar, ...S.kartuKonten, ...(sempit ? S.kontenSempit : null) }}>
              <div style={S.headSeksi}>
                <span style={lencanaSeksi}><Presentation size={14} /></span>
                <span style={{ flex: 1, fontWeight: 800, fontSize: 15.5, color: T.judul }}>
                  Slide Materi (PPT)
                </span>
                {slideVersiGuruLive && (
                  <span style={S.versiLiveChip}>📽 versi tentor (live)</span>
                )}
                <a href={slideSiswa} target="_blank" rel="noreferrer"
                  style={S.unduhLink}>
                  Unduh PPT
                </a>
              </div>
              <iframe
                title="Slide materi"
                src={`https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(slideSiswa)}`}
                style={S.slideFrame}
              />
              <p style={S.catatanKecil}>
                Perlu internet. Bila slide tidak tampil, unduh lalu buka
                di PowerPoint / Google Slides.
              </p>
            </div>
          )}

          {/* ---------- TAB MODUL PDF ---------- */}
          {tabAktifNow === 'pdf' && bab.pdfUrl && (
            <div style={{ ...kartuDasar, ...S.kartuKonten, ...(sempit ? S.kontenSempit : null) }}>
              <div style={S.headSeksi}>
                <span style={lencanaSeksi}><FileText size={14} /></span>
                <span style={{ flex: 1, fontWeight: 800, fontSize: 15.5, color: T.judul }}>
                  Modul PDF (asli)
                </span>
                <a href={bab.pdfUrl} target="_blank" rel="noreferrer"
                  style={S.unduhLink}>
                  Unduh PDF
                </a>
              </div>
              <iframe
                title="Modul PDF"
                src={bab.pdfUrl}
                style={S.slideFrame}
              />
              <p style={S.catatanKecil}>
                Bila PDF tidak tampil di browser, unduh lalu buka manual.
              </p>
            </div>
          )}

          {/* ---------- TAB LATIHAN SOAL ---------- */}
          {tabAktifNow === 'latihan' && (
            <div style={{ ...kartuDasar, ...S.kartuKonten, ...(sempit ? S.kontenSempit : null) }}>
              <div style={S.headSeksi}>
                <span style={lencanaSeksi}><CheckCircle2 size={14} /></span>
                <span style={{ flex: 1, fontWeight: 800, fontSize: 15.5, color: T.judul }}>
                  Latihan Soal • {kuis.length} soal
                </span>
                {quizTersimpan && (
                  <span style={S.nilaiChip}>Nilai terbaik: {quizTersimpan.nilai}</span>
                )}
              </div>
              {kuis.length === 0 ? (
                <div style={S.videoKosong}>
                  <FileText size={26} />
                  <p style={{ margin: '10px 0 0', fontSize: 13 }}>
                    Belum ada soal pemantapan untuk bagian ini.
                  </p>
                </div>
              ) : ikutAktif && sesi.posisi?.jenis === 'kuisPaket' ? (
                <LivePaket sessionId={sesi.id} kuis={kuis}
                  indexes={sesi.posisi.indexes || kuis.map((_, i2) => i2)}
                  sesi={sesi} />
              ) : ikutAktif && sesi.posisi?.jenis === 'kuis'
                && kuis[Number(sesi.posisi.index)] ? (
                <LiveKuis
                  key={Number(sesi.posisi.index)}
                  sessionId={sesi.id}
                  soal={kuis[Number(sesi.posisi.index)]}
                  idx={Number(sesi.posisi.index)}
                  total={kuis.length}
                  sesi={sesi}
                />
              ) : (
                <PanelKuis
                  key={`${babId}-${sesiKuis}`}
                  kuis={kuis}
                  jawaban={jawaban}
                  pilih={pilihJawaban}
                  pilihMulti={pilihMulti}
                  pilihTabel={pilihTabel}
                  pilihJodoh={pilihJodoh}
                  setIsian={setIsian}
                  soalIdx={soalIdx}
                  setSoalIdx={setSoalIdx}
                  benarCount={benarCount}
                  semuaDijawab={semuaDijawab}
                  ulangKuis={ulangKuis}
                />
              )}
            </div>
          )}

          {/* nav bab bawah */}
          <nav style={S.navBab}>
            {idxBab > 0 && (
              <button type="button" style={tombolPill('putih')}
                onClick={() => navigate(`/siswa/belajar/${materiId}/${babList[idxBab - 1].id}`)}>
                <ChevronLeft size={15} /> {babList[idxBab - 1].judul}
              </button>
            )}
            <span style={{ flex: 1 }} />
            {babBerikut ? (
              <button type="button" style={tombolPill('primer')}
                onClick={() => navigate(`/siswa/belajar/${materiId}/${babBerikut.id}`)}>
                {babBerikut.judul} <ChevronRight size={15} />
              </button>
            ) : selesaiBaca ? (
              <button type="button" style={tombolPill('primer')}
                onClick={() => navigate(`/siswa/belajar/${materiId}`)}>
                Selesai — ke daftar materi <ChevronRight size={15} />
              </button>
            ) : null}
          </nav>
        </main>

        {/* ================= PANEL KANAN (desktop) ================= */}
        {tampilPanel && (
          <aside style={S.panel}>
            <div style={{ ...kartuDasar, padding: 16 }}>
              <div style={S.panelJudul}>
                <BookOpen size={15} /> Daftar Materi
              </div>
              <div style={S.panelSub}>{babList.length} bagian</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 12 }}>
                {babPanel.map((b) => {
                  const p = persenBab(b, progresMap[b.id]);
                  const selesai = p === 100;
                  const asli = babList.indexOf(b);
                  const aktifNow = b.id === babId;
                  return (
                    <button key={b.id} type="button"
                      onClick={() => navigate(`/siswa/belajar/${materiId}/${b.id}`)}
                      style={{
                        ...S.panelItem,
                        ...(aktifNow ? S.panelItemAktif : null),
                      }}>
                      <span style={lingkaranNomor(aktifNow ? 'aktif' : selesai ? 'selesai' : 'biasa')}>
                        {asli + 1}
                      </span>
                      <span style={{ flex: 1, minWidth: 0, textAlign: 'left' }}>
                        <span style={S.panelItemJudul}>{b.judul}</span>
                        <span style={S.panelItemMeta}>
                          {latihanSelesaiBab(b) ? '✔ latihan • ' : ''}
                          {selesai ? 'Selesai dibaca' : p > 0 ? `${p}% selesai` : 'Belum dibaca'}
                        </span>
                      </span>
                      {selesai && <CheckCircle2 size={16} color={T.hijau} />}
                      <ChevronRight size={14} color={T.samar} />
                    </button>
                  );
                })}
                {babPanel.length === 0 && (
                  <div style={S.panelKosong}>Tidak ada bab yang cocok.</div>
                )}
              </div>
            </div>

            {/* kartu kutipan khas mockup */}
            <div style={S.kartuKutip}>
              <div style={{ fontStyle: 'italic', fontWeight: 700, fontSize: 13, lineHeight: 1.6 }}>
                “Ilmu hari ini,
                <br />masa depan nanti.”
              </div>
              <div style={{ marginTop: 8, fontSize: 11, fontWeight: 700, opacity: .8 }}>
                — Bimbel Gemilang
              </div>
              <Star size={14} fill="currentColor" style={{ marginTop: 6 }} />
            </div>
          </aside>
        )}
      </div>

      {/* ===== widget antrean "coba maju" (sesi live) ===== */}
      {sesiBabIni && (
        <div style={S.queueWrap}>
          {(!antreanSaya || antreanSaya.status === 'selesai') && (
            <button type="button" style={S.queueBtn}
              onClick={() => antreMaju(sesi.id).catch(() => {})}>
              🙋 Coba Maju
            </button>
          )}
          {antreanSaya?.status === 'menunggu' && (
            <div style={S.queueChip}>
              ⏳ Menunggu giliran…
              <button type="button" style={S.queueBatal}
                onClick={() => batalAntre(sesi.id).catch(() => {})}>
                Batal
              </button>
            </div>
          )}
          {antreanSaya?.status === 'dipanggil' && (
            <div style={{ ...S.queueChip, ...S.queueDipanggil }}>
              🎉 Namamu dipanggil — maju ya!
            </div>
          )}
          {antreanSaya?.status === 'diberi' && (
            <div style={{ ...S.queueChip, ...S.queueDiberi }}>
              ⭐ +{antreanSaya.xpDiberi || 0} XP dari tentor!
            </div>
          )}
        </div>
      )}

      {toast && <div style={S.toast}>{toast}</div>}
    </div>
  );
}

// ---------------- panel kuis (satu soal per layar) ----------------
function PanelKuis({
  kuis, jawaban, pilih, pilihMulti, pilihTabel, pilihJodoh, setIsian,
  soalIdx, setSoalIdx, benarCount, semuaDijawab, ulangKuis,
}) {
  const [lihatHasil, setLihatHasil] = useState(false);
  const soal = kuis[soalIdx];
  const dipilih = jawaban[soalIdx];
  const [sudahCek, setSudahCek] = useState(false);
  useEffect(() => { setSudahCek(false); }, [soalIdx]);
  // Turn 77: jawaban TIDAK langsung dikoreksi — siswa menekan "Cek Jawaban" dulu.
  const terkoreksi = jawabanLengkap(soal, dipilih) && sudahCek;
  const multiSoal = tipeSoal(soal) === 'pgMulti';

  if (semuaDijawab && lihatHasil) {
    const nilai = Math.round((benarCount / kuis.length) * 100);
    return (
      <div style={S.hasilKuis}>
        <div style={S.hasilLingkaran}>{nilai}</div>
        <div>
          <div style={{ fontWeight: 800, fontSize: 15, color: T.judul }}>
            {nilai >= 80 ? 'Luar biasa! 🏆' : nilai >= 60 ? 'Bagus, terus berlatih! ✨' : 'Semangat, coba lagi ya 💪'}
          </div>
          <div style={{ fontSize: 12.5, color: T.samar, marginTop: 3 }}>
            {benarCount} dari {kuis.length} soal benar.
          </div>
          <button type="button" style={{ ...tombolPill('putih'), marginTop: 10 }} onClick={ulangKuis}>
            <RotateCcw size={14} /> Ulangi latihan
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div style={S.chipRow}>
        <span style={chip(true)}>Semua</span>
        <span style={chip(false)}>Pilihan Ganda</span>
        <span style={{ ...chip(false), opacity: .5 }}>Esai</span>
      </div>

      <div style={S.soalNomor}>Soal {soalIdx + 1} dari {kuis.length}</div>
      {/* Fase konten: chip sumber + gambar soal WAJIB tampil juga di
          latihan mandiri (sebelumnya hanya di kuis live guru) */}
      {/* Sumber soal TIDAK ditampilkan ke siswa (Turn 35): cukup admin. */}
      {HINT_JAWAB[tipeSoal(soal)] && (
        <div style={S.hintChip}>💡 {HINT_JAWAB[tipeSoal(soal)]}</div>
      )}
      {soal.soalGambar && (
        <img src={soal.soalGambar} alt="Gambar soal" style={S.soalGambar} />
      )}
      <TeksSoal teks={soal.soal} style={S.soalTeks} />

      {tipeSoal(soal) === 'tabel' ? (
        <div style={S.tabelWrap}>
          <table style={S.tabel}>
            <thead>
              <tr>
                <th style={S.tabelSel}>Pernyataan</th>
                {kolomSoal(soal).map((k) => (
                  <th key={k} style={S.tabelSel}>{k}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(soal.baris || []).map((bar, r) => {
                const pil = Array.isArray(dipilih) ? dipilih[r] : undefined;
                return (
                  <tr key={r}>
                    <td style={S.tabelSel}><MathText text={bar} /></td>
                    {kolomSoal(soal).map((k, c) => {
                      const kunci = (soal.jawaban || [])[r] === c;
                      return (
                        <td key={c} style={S.tabelSelTengah}>
                          <button type="button" disabled={terkoreksi}
                            aria-label={`baris ${r + 1} kolom ${k}`}
                            style={{
                              ...S.tabelRadio,
                              ...(pil === c ? S.tabelRadioPil : null),
                              ...(terkoreksi && pil === c && kunci
                                ? S.tabelRadioBenar : null),
                              ...(terkoreksi && pil === c && !kunci
                                ? S.tabelRadioSalah : null),
                              ...(terkoreksi && pil !== c && kunci
                                ? S.tabelRadioKunciTipis : null),
                            }}
                            onClick={() => pilihTabel(soalIdx, r, c)}>
                            {pil === c ? '✓' : ''}
                          </button>
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
          <div style={S.hintKecil}>
            Setiap baris dinilai mandiri; isi semua baris sebelum lanjut.
          </div>
        </div>
      ) : tipeSoal(soal) === 'jodoh' ? (
        <JodohBoard soal={soal} dipilih={dipilih} terkoreksi={terkoreksi}
          onPilih={(r, c) => pilihJodoh(soalIdx, r, c)} />
      ) : tipeSoal(soal) === 'isian' ? (
        <div>
          <input style={S.isianInput}
            value={typeof dipilih === 'string' ? dipilih : ''}
            placeholder="Ketik jawaban eksak (angka/kata)…"
            disabled={terkoreksi}
            onChange={(e) => setIsian(soalIdx, e.target.value)} />
          {soal.hintFormat && (
            <div style={S.hintKecil}>Format: {soal.hintFormat}</div>
          )}
        </div>
      ) : tipeSoal(soal) === 'uraian' ? (
        <div>
          <textarea style={S.uraianArea} rows={5}
            value={typeof dipilih === 'string' ? dipilih : ''}
            placeholder="Tulis jawabanmu poin-per-poin…"
            disabled={terkoreksi}
            onChange={(e) => setIsian(soalIdx, e.target.value)} />
          <div style={S.hintKecil}>
            {(typeof dipilih === 'string'
              ? dipilih.trim().split(/\s+/).filter(Boolean).length : 0)} kata
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {(soal.opsi || []).map((op, j) => {
            const multi = multiSoal;
            const pil = multi
              ? (Array.isArray(dipilih) && dipilih.includes(j))
              : (dipilih === j);
            const kunci = multi
              ? (soal.jawaban || []).includes(j)
              : (j === soal.jawaban);
            let border = `1px solid ${T.garis}`;
            let bg = '#fff';
            if (pil && !terkoreksi) { border = `2px solid ${T.biru}`; bg = T.kotakBiru; }
            if (terkoreksi && kunci) { border = `2px solid ${T.hijau}`; bg = T.hijauLatar; }
            else if (terkoreksi && pil && !kunci) { border = `2px solid ${T.merah}`; bg = T.merahLatar; }
            return (
              <button key={j} type="button"
                disabled={terkoreksi}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '10px 14px', borderRadius: 10,
                  border, background: bg, cursor: terkoreksi ? 'not-allowed' : 'pointer',
                  fontFamily: 'inherit', textAlign: 'left', width: '100%',
                }}
                onClick={() => (multi ? pilihMulti(soalIdx, j) : pilih(soalIdx, j))}>
                <span style={{
                  width: 20, height: 20, flexShrink: 0,
                  borderRadius: multi ? 4 : '50%',
                  border: `2px solid ${pil ? T.biru : '#CBD5E1'}`,
                  background: pil ? T.biru : '#fff',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: '#fff',
                }}>
                  {pil ? <CheckCircle2 size={12} /> : null}
                </span>
                <span style={{ flex: 1, fontSize: 13, color: T.teks, lineHeight: 1.55 }}>
                  <MathText text={op} />
                </span>
                <span style={{ fontSize: 12, fontWeight: 800, color: T.samar }}>
                  {String.fromCharCode(65 + j)}.
                </span>
              </button>
            );
          })}
          {multiSoal && (
            <div style={S.hintKecil}>
              Jawaban benar bisa lebih dari satu; centang semua yang sesuai.
            </div>
          )}
        </div>
      )}
      {terkoreksi && tipeSoal(soal) === 'uraian' ? (
        <div style={{ ...kotakTips, background: T.kotakBiru, borderColor: T.kotakBiruGaris, color: T.biruDalam }}>
          <CheckCircle2 size={15} />
          <span>
            <b>Referensikan jawabanmu:</b>
            {soal.pembahasan ? <><br />{soal.pembahasan}</> : null}
          </span>
        </div>
      ) : terkoreksi && kreditSoal(soal, dipilih) === 1 ? (
        <div style={kotakSukses}>
          <CheckCircle2 size={15} />
          <span>
            <b>Jawaban benar!</b>
            {soal.pembahasan ? <><br />{soal.pembahasan}</> : null}
            {soal.pembahasanGambar && (
              <img src={soal.pembahasanGambar} alt="Gambar pembahasan"
                style={S.pembahasanImg} loading="lazy" />
            )}
            {soal.pembahasanGambarKet && (
              <div style={S.pembahasanKet}>🔍 {soal.pembahasanGambarKet}</div>
            )}
          </span>
        </div>
      ) : terkoreksi && kreditSoal(soal, dipilih) > 0 ? (
        <div style={kotakTips}>
          <CheckCircle2 size={15} />
          <span>
            <b>Tepat sebagian.</b> Kredit {kreditSoal(soal, dipilih).toFixed(2)}
            {' '}dari 1. Kunci: {kunciTeks(soal)}.
            {soal.pembahasan ? <><br />{soal.pembahasan}</> : null}
          </span>
        </div>
      ) : terkoreksi ? (
        <div style={{ ...kotakTips, background: T.merahLatar, borderColor: T.merahGaris, color: '#B91C1C' }}>
          <XCircle size={15} />
          <span>
            <b>Belum tepat.</b> Kunci: {kunciTeks(soal)}.
            {soal.pembahasan ? <><br />{soal.pembahasan}</> : null}
            {soal.pembahasanGambar && (
              <img src={soal.pembahasanGambar} alt="Gambar pembahasan"
                style={S.pembahasanImg} loading="lazy" />
            )}
            {soal.pembahasanGambarKet && (
              <div style={S.pembahasanKet}>🔍 {soal.pembahasanGambarKet}</div>
            )}
          </span>
        </div>
      ) : null}

      {jawabanLengkap(soal, dipilih) && !sudahCek && (
        <button type="button" style={tombolPill('primer')}
          onClick={() => setSudahCek(true)}>
          ✔ Cek Jawaban
        </button>
      )}
      <div style={S.kuisNav}>
        <button type="button" style={S.panahBulat} disabled={soalIdx === 0}
          onClick={() => setSoalIdx((i) => Math.max(0, i - 1))}
          aria-label="Soal sebelumnya">
          <ChevronLeft size={16} />
        </button>
        <span style={S.kuisPosisi}>{soalIdx + 1} / {kuis.length}</span>
        {soalIdx < kuis.length - 1 ? (
          terkoreksi ? (
            <button type="button" style={tombolPill('primer')}
              onClick={() => setSoalIdx((i) => Math.min(kuis.length - 1, i + 1))}>
              Lanjut soal <ChevronRight size={14} />
            </button>
          ) : (
            <button type="button" style={S.panahBulat}
              onClick={() => setSoalIdx((i) => Math.min(kuis.length - 1, i + 1))}
              aria-label="Soal berikutnya">
              <ChevronRight size={16} />
            </button>
          )
        ) : terkoreksi ? (
          <button type="button" style={tombolPill('primer')}
            onClick={() => setLihatHasil(true)}>
            Lihat hasil <ChevronRight size={14} />
          </button>
        ) : (
          <span style={{ width: 36 }} />
        )}
      </div>
    </>
  );
}

// ---------------- kuis live bersama guru (Fase 3) ----------------
function fmtKunciSingkat(soal) {
  const t = tipeSoal(soal);
  if (t === 'pg') return String.fromCharCode(65 + (soal.jawaban || 0));
  if (t === 'pgMulti') return (soal.jawaban || []).map((j) => String.fromCharCode(65 + j)).join(', ');
  if (t === 'tabel') return (soal.jawaban || []).map((c, r) => `baris ${r + 1}: ${(soal.kolom || [])[c] || c}`).join('; ');
  if (t === 'jodoh') return (soal.jawaban || []).map((c, r) => `${r + 1}→${String.fromCharCode(65 + c)}`).join(', ');
  return String(soal.jawaban ?? '');
}

// Turn 77: MODE PAKET — semua soal dilempar sekaligus, siswa mengerjakan
// sebisanya, pembahasan baru muncul saat guru membuka kunci.
function LivePaket({ sessionId, kuis, indexes, sesi }) {
  return (
    <>
      <div style={S.liveHead}>
        📝 Mode paket • kerjakan semua soal sebisanya • {indexes.length} soal
      </div>
      <div style={{ fontSize: 12.5, color: T.samar, marginBottom: 10 }}>
        Jawaban terkirim per soal saat kamu memilih/mengirim. Setelah semua
        selesai, tunggu guru membuka pembahasan bersama.
      </div>
      {indexes.map((i) => (
        <div key={i} style={{ marginBottom: 18 }}>
          <div style={{ ...S.soalNomor }}>Soal {i + 1}</div>
          <LiveKuis sessionId={sessionId} soal={kuis[i]} idx={i}
            total={kuis.length} sesi={sesi} />
        </div>
      ))}
    </>
  );
}

// ---------------- kuis live bersama guru (Fase 3) ----------------
function LiveKuis({ sessionId, soal, idx, total, sesi }) {
  const [pilihan, setPilihan] = useState(null);
  const [terkirim, setTerkirim] = useState(false);
  const fmt = tipeSoal(soal);
  const kirim = (j) => {
    if (terkirim) return;
    setPilihan(j);
    setTerkirim(true);
    kirimJawabanLive(sessionId, idx, j).catch(() => setTerkirim(false));
  };
  const togMulti = (j) => setPilihan((old) => {
    const arr = Array.isArray(old) ? [...old] : [];
    const at = arr.indexOf(j);
    if (at >= 0) arr.splice(at, 1);
    else arr.push(j);
    return arr.sort((a, b) => a - b);
  });
  const pilBaris = (r, c) => setPilihan((old) => {
    const arr = Array.isArray(old) ? [...old] : [];
    arr[r] = c;
    return arr;
  });
  const lengkap = jawabanLengkap(soal, pilihan);
  return (
    <>
      <div style={S.liveHead}>
        📡 Latihan bersama • soal {idx + 1} / {total}
      </div>
      {/* Sumber soal TIDAK ditampilkan ke siswa (Turn 35): cukup admin. */}
      {soal.soalGambar && (
        <img src={soal.soalGambar} alt="Gambar soal" style={S.soalGambar} />
      )}
      <TeksSoal teks={soal.soal} style={S.soalTeks} />
      {fmt === 'tabel' ? (
        <div style={S.tabelWrap}>
          <table style={S.tabel}>
            <thead>
              <tr>
                <th style={S.tabelSel}>Pernyataan</th>
                {kolomSoal(soal).map((k) => (
                  <th key={k} style={S.tabelSel}>{k}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(soal.baris || []).map((bar, r) => (
                <tr key={r}>
                  <td style={S.tabelSel}><MathText text={bar} /></td>
                  {kolomSoal(soal).map((k, c) => (
                    <td key={c} style={S.tabelSelTengah}>
                      <button type="button" disabled={terkirim}
                        aria-label={`baris ${r + 1} kolom ${k}`}
                        style={{
                          ...S.tabelRadio,
                          ...(Array.isArray(pilihan) && pilihan[r] === c
                            ? S.tabelRadioPil : null),
                        }}
                        onClick={() => pilBaris(r, c)}>
                        {Array.isArray(pilihan) && pilihan[r] === c ? '✓' : ''}
                      </button>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : fmt === 'pgMulti' ? (
        <>
          <div style={S.formatChip}>
            ☑️ Centang semua pernyataan yang benar — jawaban bisa lebih dari satu.
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {(soal.opsi || []).map((op, j) => (
              <button key={j} type="button"
                style={{
                  ...S.opsi,
                  ...(Array.isArray(pilihan) && pilihan.includes(j)
                    ? S.opsiDipilihLive : null),
                }}
                disabled={terkirim}
                onClick={() => togMulti(j)}>
                <span style={{
                  ...S.opsiKotak,
                  ...(Array.isArray(pilihan) && pilihan.includes(j)
                    ? S.opsiKotakIsi : null),
                }}>
                  {Array.isArray(pilihan) && pilihan.includes(j)
                    ? <CheckCircle2 size={13} /> : null}
                </span>
                <span style={{ flex: 1, textAlign: 'left' }}><MathText text={op} /></span>
                <span style={S.opsiHuruf}>{String.fromCharCode(65 + j)}.</span>
              </button>
            ))}
          </div>
        </>
      ) : fmt === 'jodoh' ? (
        <JodohBoard soal={soal} dipilih={pilihan} terkoreksi={false}
          disabled={terkirim}
          onPilih={(r, c) => setPilihan((old) => {
            const a = Array.isArray(old) ? [...old] : [];
            a[r] = c == null ? undefined : c;
            return a;
          })} />
      ) : fmt === 'isian' ? (
        <input style={S.isianInput}
          value={typeof pilihan === 'string' ? pilihan : ''}
          placeholder="Ketik jawaban eksak…"
          disabled={terkirim}
          onChange={(e) => setPilihan(e.target.value)} />
      ) : fmt === 'uraian' ? (
        <textarea style={S.uraianArea} rows={4}
          value={typeof pilihan === 'string' ? pilihan : ''}
          placeholder="Tulis jawabanmu poin-per-poin…"
          disabled={terkirim}
          onChange={(e) => setPilihan(e.target.value)} />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {(soal.opsi || []).map((op, j) => (
            <button key={j} type="button"
              style={{
                ...S.opsi,
                ...(pilihan === j ? S.opsiDipilihLive : null),
              }}
              disabled={terkirim}
              onClick={() => kirim(j)}>
              <span style={S.opsiHuruf}>{String.fromCharCode(65 + j)}.</span>
              <span style={{ flex: 1, textAlign: 'left' }}><MathText text={op} /></span>
            </button>
          ))}
        </div>
      )}
      {fmt !== 'pg' && (
        <button type="button" style={tombolPill('primer')}
          disabled={!lengkap || terkirim}
          onClick={() => kirim(pilihan)}>
          Kirim jawaban <ChevronRight size={14} />
        </button>
      )}
      <div style={{ ...S.kotakInfoLive, ...(terkirim ? null : { opacity: .75 }) }}>
        {terkirim
          ? (sesi?.kunciTerbuka
            ? '🔓 Guru membuka pembahasan — simak kunci & langkah di bawah.'
            : '✅ Jawabanmu terkirim ke guru — pembahasan muncul setelah guru membukanya.')
          : 'Pilih jawabanmu; hasilnya terlihat di layar guru. Kunci dibuka guru saat pembahasan.'}
      </div>
      {terkirim && sesi?.kunciTerbuka && (
        <div style={{ ...S.kotakInfoLive, marginTop: 10 }}>
          <b>Kunci:</b> {fmtKunciSingkat(soal)}
          <div style={{ marginTop: 6, lineHeight: 1.7 }}>{soal.pembahasan}</div>
          {soal.pembahasanGambar && (
            <img src={soal.pembahasanGambar} alt="Gambar pembahasan"
              style={S.pembahasanImg} loading="lazy" />
          )}
        </div>
      )}
    </>
  );
}

// ---------------- gaya (tema Gemilang Biru) ----------------
const S = {
  kosong: {
    textAlign: 'center', color: T.samar, ...kartuDasar,
    padding: '40px 20px', fontSize: 13, lineHeight: 1.7, margin: '60px 16px',
  },
  topbar: {
    position: 'sticky', top: 0, zIndex: 30,
    display: 'flex', alignItems: 'center', gap: 14,
    padding: '10px 18px', background: 'rgba(255,255,255,.9)',
    backdropFilter: 'blur(10px)', borderBottom: `1px solid ${T.garis}`,
  },
  kembali: {
    display: 'inline-flex', alignItems: 'center', gap: 6,
    background: 'none', border: 'none', color: T.biruGelap,
    fontWeight: 800, fontSize: 12.5, cursor: 'pointer', flexShrink: 0,
    fontFamily: 'inherit',
  },
  cariWrap: {
    flex: 1, maxWidth: 560, margin: '0 auto',
    display: 'flex', alignItems: 'center', gap: 8,
    background: T.latar, border: `1px solid ${T.garis}`,
    borderRadius: 999, padding: '9px 15px',
  },
  cariInput: {
    flex: 1, minWidth: 0, border: 'none', outline: 'none', background: 'transparent',
    fontSize: 12.5, color: T.teks, fontFamily: 'inherit',
  },
  topKanan: { display: 'flex', alignItems: 'center', gap: 9, flexShrink: 0 },
  ikonBulat: {
    width: 34, height: 34, borderRadius: '50%', background: '#fff',
    border: `1px solid ${T.garis}`, color: T.samar, display: 'flex',
    alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
  },
  avatar: {
    width: 34, height: 34, borderRadius: '50%', background: T.gradasiHero,
    color: '#fff', fontWeight: 800, fontSize: 11.5, display: 'flex',
    alignItems: 'center', justifyContent: 'center',
  },
  badan: {
    display: 'flex', gap: 18, alignItems: 'flex-start',
    maxWidth: 1280, margin: '0 auto', padding: '18px 18px 44px',
  },
  badanSempit: { gap: 10, padding: '10px 8px 36px' },
  kontenSempit: { padding: 14 },
  utama: { flex: 1, minWidth: 0 },
  headRow: {
    display: 'flex', gap: 16, alignItems: 'flex-start',
    flexWrap: 'wrap', marginBottom: 14,
  },
  chips: { display: 'flex', gap: 6, marginBottom: 7 },
  chipKategori: {
    background: T.biru, color: '#fff', borderRadius: 8,
    padding: '4px 12px', fontSize: 10.5, fontWeight: 800,
  },
  chipKategoriOutline: {
    background: '#fff', color: T.samar, border: `1px solid ${T.garis}`,
    borderRadius: 8, padding: '4px 12px', fontSize: 10.5, fontWeight: 800,
  },
  judulBesar: { margin: 0, fontSize: 26, fontWeight: 800, color: T.judul, lineHeight: 1.25 },
  metaBab: { marginTop: 4, fontSize: 11.5, color: T.samar, fontWeight: 600 },
  progresKanan: { marginLeft: 'auto', textAlign: 'right' },
  progresLabelKecil: {
    display: 'flex', gap: 10, justifyContent: 'flex-end',
    fontSize: 11, color: T.samar, marginBottom: 6,
  },
  tabRow: {
    display: 'flex', gap: 4, background: '#fff',
    border: `1px solid ${T.garis}`, borderRadius: 13,
    padding: 5, marginBottom: 16, overflowX: 'auto', scrollbarWidth: 'none',
  },
  tab: {
    display: 'inline-flex', alignItems: 'center', gap: 6, flexShrink: 0,
    border: 'none', background: 'transparent', color: T.samar,
    borderRadius: 9, padding: '9px 16px', fontSize: 12.5, fontWeight: 700,
    cursor: 'pointer', fontFamily: 'inherit',
  },
  tabAktif: {
    background: T.biru, color: '#fff',
    boxShadow: '0 4px 12px rgba(30,155,240,.3)',
  },
  tabSoon: { opacity: .55, cursor: 'not-allowed' },
  soonBadge: {
    background: 'rgba(255,255,255,.25)', borderRadius: 999,
    padding: '1px 7px', fontSize: 9, fontWeight: 800,
  },
  kartuKonten: { padding: 22 },
  headSeksi: { display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 },
  emojiSeksi: { fontSize: 26 },
  ringkasan: {
    margin: '0 0 16px', color: T.teks, fontSize: 13.5,
    lineHeight: 1.7, fontStyle: 'italic',
  },
  subJudul: {
    display: 'flex', alignItems: 'baseline', gap: 7,
    margin: '22px 0 8px', fontSize: 15.5, fontWeight: 800, color: T.judul,
  },
  subHuruf: { color: T.biru, fontStyle: 'italic' },
  paragraf: { margin: '0 0 13px', fontSize: 14, lineHeight: 1.85, color: T.teks },
  contohBox: {
    background: T.kotakBiru, border: `1px solid ${T.kotakBiruGaris}`,
    borderRadius: 12, padding: '13px 15px', margin: '0 0 15px',
  },
  contohJudul: {
    display: 'flex', alignItems: 'center', gap: 6, color: T.biruGelap,
    fontWeight: 800, fontSize: 12.5, marginBottom: 7,
  },
  gambar: { width: '100%', borderRadius: 12, display: 'block' },
  gambarKosong: {
    display: 'flex', gap: 8, alignItems: 'center', justifyContent: 'center',
    background: T.latar, border: `1px dashed ${T.garis}`, borderRadius: 12,
    color: T.samar, padding: 26, fontSize: 12.5,
  },
  gambarKet: { textAlign: 'center', color: T.samar, fontSize: 11.5, marginTop: 6 },
  langkahItem: {
    display: 'flex', gap: 10, alignItems: 'flex-start',
    fontSize: 13.5, lineHeight: 1.65, color: T.teks,
  },
  langkahNomor: {
    width: 24, height: 24, borderRadius: '50%', background: T.biru,
    color: '#fff', display: 'flex', alignItems: 'center',
    justifyContent: 'center', fontWeight: 800, fontSize: 11, flexShrink: 0,
  },
  kutipanKecil: {
    display: 'flex', gap: 7, alignItems: 'center', color: T.biruGelap,
    background: T.kotakBiru, border: `1px solid ${T.kotakBiruGaris}`,
    borderRadius: 10, padding: '9px 12px', fontSize: 12,
    fontStyle: 'italic', fontWeight: 700, marginTop: 6,
  },
  videoWrap: { borderRadius: 14, overflow: 'hidden', background: '#0B2440' },
  videoEl: { width: '100%', display: 'block', aspectRatio: '16/9' },
  videoKosong: {
    display: 'flex', flexDirection: 'column', alignItems: 'center',
    justifyContent: 'center', textAlign: 'center', color: T.samar,
    background: T.latar, border: `1px dashed ${T.garis}`,
    borderRadius: 14, padding: '34px 22px',
  },
  nilaiChip: {
    background: T.hijauLatar, color: T.hijauTeks, border: `1px solid ${T.hijauGaris}`,
    borderRadius: 999, padding: '4px 11px', fontSize: 10.5, fontWeight: 800,
  },
  chipRow: { display: 'flex', gap: 7, marginBottom: 14 },
  soalNomor: { fontSize: 11, fontWeight: 800, color: T.samar, marginBottom: 6 },
  soalTeks: { fontSize: 14.5, lineHeight: 1.75, color: T.judul, fontWeight: 600, marginBottom: 13 },
  sumberChip: {
    display: 'inline-block', background: T.latar, border: `1px solid ${T.garis}`,
    color: T.samar, borderRadius: 999, padding: '3px 10px',
    fontSize: 10, fontWeight: 800, marginBottom: 8,
  },
  formatChip: {
    fontSize: 11.5, fontWeight: 800, color: T.biruDalam,
    background: T.kotakBiru, border: `1px solid ${T.kotakBiruGaris}`,
    borderRadius: 10, padding: '7px 10px', margin: '2px 0 8px',
  },
  opsiDipilihMulti: {
    borderColor: T.biru, background: '#F4FAFF',
    boxShadow: '0 3px 10px rgba(30,155,240,.14)',
  },
  opsiKotak: {
    width: 20, height: 20, borderRadius: 6, flexShrink: 0,
    border: `2px solid ${T.garis}`, background: '#fff',
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
    color: '#fff',
  },
  opsiKotakIsi: { background: T.biru, borderColor: T.biru },
  opsiKunciTipis: {
    borderColor: T.hijau, borderStyle: 'dashed', background: '#F6FCF8',
  },
  kunciTag: {
    marginLeft: 8, fontSize: 10.5, fontWeight: 800, color: T.hijauTeks,
    background: T.hijauLatar, border: `1px solid ${T.hijauGaris}`,
    borderRadius: 999, padding: '2px 8px', whiteSpace: 'nowrap',
  },
  pembahasanKet: {
    textAlign: 'center', color: T.samar, fontSize: 12.5, lineHeight: 1.6,
    margin: '6px auto 0', maxWidth: 560,
  },
  pembahasanImg: {
    display: 'block', width: '100%', maxWidth: 420, margin: '10px auto 0',
    borderRadius: 10, border: `1px solid ${T.garis}`, background: '#fff',
  },
  tabelWrap: { overflowX: 'auto', margin: '4px 0 8px' },
  tabel: {
    width: '100%', borderCollapse: 'collapse', background: '#fff',
    border: `1px solid ${T.garis}`, borderRadius: 10, fontSize: 12.5,
  },
  tabelSel: {
    border: `1px solid ${T.garis}`, padding: '8px 10px',
    textAlign: 'left', color: T.teks, fontWeight: 600,
  },
  tabelSelTengah: {
    border: `1px solid ${T.garis}`, padding: 6, textAlign: 'center',
  },
  tabelRadio: {
    width: 30, height: 30, borderRadius: 999, cursor: 'pointer',
    border: `2px solid ${T.garis}`, background: '#fff',
    fontSize: 14, fontWeight: 800, color: '#fff', lineHeight: 1,
  },
  tabelRadioPil: { background: T.biru, borderColor: T.biru },
  tabelRadioKunci: { background: T.hijau, borderColor: T.hijau },
  tabelRadioBenar: { background: T.hijau, borderColor: T.hijau },
  tabelRadioKunciTipis: {
    borderColor: T.hijau, borderStyle: 'dashed', background: '#F6FCF8',
    color: T.hijauTeks,
  },
  tabelRadioSalah: { background: T.merah, borderColor: T.merah },
  soalGambar: {
    display: 'block', width: '100%', maxWidth: 560, background: '#fff',
    border: `1px solid ${T.garis}`, borderRadius: 10, padding: 6,
    margin: '0 0 10px',
  },
  opsi: {
    display: 'flex', alignItems: 'center', gap: 11, width: '100%',
    background: '#fff', border: `1.5px solid ${T.garis}`, borderRadius: 12,
    padding: '11px 13px', fontSize: 13, color: T.teks, cursor: 'pointer',
    fontFamily: 'inherit', transition: 'all .15s ease',
  },
  opsiBenar: { borderColor: T.hijau, background: T.hijauLatar },
  opsiSalah: { borderColor: T.merah, background: T.merahLatar },
  opsiBulat: {
    width: 22, height: 22, borderRadius: '50%', flexShrink: 0,
    border: `2px solid ${T.garis}`, background: '#fff', color: '#fff',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  opsiBulatBenar: { background: T.hijau, borderColor: T.hijau },
  opsiBulatSalah: { background: T.merah, borderColor: T.merah },
  opsiHuruf: { color: T.samar, fontWeight: 800, fontSize: 11.5, flexShrink: 0 },
  kuisNav: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    marginTop: 18, gap: 10,
  },
  panahBulat: {
    width: 36, height: 36, borderRadius: '50%', background: '#fff',
    border: `1px solid ${T.garis}`, color: T.biruGelap, display: 'flex',
    alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
  },
  kuisPosisi: { fontSize: 12, fontWeight: 800, color: T.samar },
  hasilKuis: { display: 'flex', gap: 16, alignItems: 'center', padding: '6px 0' },
  hasilLingkaran: {
    width: 64, height: 64, borderRadius: '50%', background: T.gradasiHero,
    color: '#fff', display: 'flex', alignItems: 'center',
    justifyContent: 'center', fontWeight: 800, fontSize: 19, flexShrink: 0,
    boxShadow: '0 8px 20px rgba(30,155,240,.35)',
  },
  navBab: { display: 'flex', gap: 10, marginTop: 18, flexWrap: 'wrap' },
  hintChip: {
    fontSize: 11.5, color: T.biruDalam, background: T.kotakBiru,
    border: `1px dashed ${T.kotakBiruGaris}`, borderRadius: 10,
    padding: '7px 10px', margin: '0 0 10px', lineHeight: 1.55,
  },
  hintKecil: { fontSize: 11, color: T.samar, marginTop: 6 },
  jodohRow: {
    background: '#fff', border: `1px solid ${T.garis}`, borderRadius: 12,
    padding: 10,
  },
  jodohPremis: { fontSize: 13, fontWeight: 700, color: T.teks, marginBottom: 8 },
  jodohOpsis: { display: 'flex', flexWrap: 'wrap', gap: 6 },
  jodohChip: {
    border: `1.5px solid ${T.garis}`, background: '#fff', borderRadius: 999,
    padding: '6px 11px', fontSize: 12, color: T.teks, cursor: 'pointer',
    fontFamily: 'inherit',
  },
  jodohChipPil: {
    borderColor: T.biru, background: T.kotakBiru, color: T.biruDalam,
    fontWeight: 800,
  },
  isianInput: {
    width: '100%', border: `1.5px solid ${T.garis}`, borderRadius: 10,
    padding: '10px 12px', fontSize: 14, fontFamily: 'inherit', color: T.judul,
  },
  uraianArea: {
    width: '100%', border: `1.5px solid ${T.garis}`, borderRadius: 10,
    padding: '10px 12px', fontSize: 13.5, fontFamily: 'inherit',
    color: T.judul, lineHeight: 1.6, resize: 'vertical',
  },
  gateChip: {
    fontSize: 11.5, fontWeight: 800, color: '#92400E',
    background: '#FEF3C7', border: '1px solid #FDE68A',
    borderRadius: 999, padding: '8px 14px', alignSelf: 'center',
  },
  panel: { width: 300, flexShrink: 0, position: 'sticky', top: 70 },
  panelJudul: {
    display: 'flex', alignItems: 'center', gap: 7,
    fontWeight: 800, fontSize: 14.5, color: T.judul,
  },
  panelSub: { fontSize: 11, color: T.samar, marginTop: 2 },
  panelItem: {
    display: 'flex', alignItems: 'center', gap: 10, width: '100%',
    background: T.latar, border: `1px solid ${T.garisLembut}`,
    borderRadius: 12, padding: '10px 11px', cursor: 'pointer',
    fontFamily: 'inherit',
  },
  panelItemAktif: { background: '#fff', border: `1.5px solid ${T.biru}` },
  panelItemJudul: {
    display: 'block', fontWeight: 700, fontSize: 12.5, color: T.judul, lineHeight: 1.35,
  },
  panelItemMeta: { display: 'block', fontSize: 10.5, color: T.samar, marginTop: 2 },
  panelKosong: { color: T.samar, fontSize: 12, textAlign: 'center', padding: 10 },
  kartuKutip: {
    marginTop: 14, borderRadius: T.radius, padding: 16,
    background: T.gradasiHero, color: '#fff', textAlign: 'center',
    boxShadow: '0 8px 22px rgba(14,122,212,.3)',
  },
  toast: {
    position: 'fixed', left: '50%', bottom: 26, transform: 'translateX(-50%)',
    background: '#0B2440', color: '#fff', borderRadius: 999,
    padding: '10px 18px', fontSize: 12.5, fontWeight: 700, zIndex: 60,
    boxShadow: '0 8px 24px rgba(11,36,64,.35)', whiteSpace: 'nowrap',
  },
  bannerSesi: {
    display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap',
    background: T.kotakBiru, border: `1px solid ${T.kotakBiruGaris}`,
    color: T.biruDalam, padding: '9px 16px', fontSize: 12.5, fontWeight: 600,
    borderBottom: 'none',
  },
  bannerBtn: {
    marginLeft: 'auto', background: T.biru, color: '#fff', border: 'none',
    borderRadius: 9, padding: '6px 13px', fontSize: 11.5, fontWeight: 800,
    cursor: 'pointer', fontFamily: 'inherit',
  },
  liveHead: {
    display: 'inline-flex', alignItems: 'center', gap: 7,
    background: T.kotakBiru, border: `1px solid ${T.kotakBiruGaris}`,
    color: T.biruDalam, borderRadius: 999, padding: '6px 13px',
    fontSize: 11.5, fontWeight: 800, marginBottom: 12,
  },
  opsiDipilihLive: { borderColor: T.biru, background: T.kotakBiru },
  versiLiveChip: {
    background: T.kotakBiru, border: `1px solid ${T.kotakBiruGaris}`,
    color: T.biruDalam, borderRadius: 999, padding: '4px 10px',
    fontSize: 10.5, fontWeight: 800,
  },
  unduhLink: {
    color: T.biruGelap, fontSize: 11.5, fontWeight: 800,
    textDecoration: 'none', border: `1px solid ${T.kotakBiruGaris}`,
    background: T.kotakBiru, borderRadius: 9, padding: '5px 10px',
  },
  slideFrame: {
    width: '100%', height: '62vh', border: `1px solid ${T.garis}`,
    borderRadius: 12, background: '#fff',
  },
  catatanKecil: { color: T.samar, fontSize: 11, marginTop: 8 },
  queueWrap: {
    position: 'fixed', right: 16, bottom: 18, zIndex: 55,
    display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8,
  },
  queueBtn: {
    background: T.biru, color: '#fff', border: 'none', borderRadius: 999,
    padding: '12px 20px', fontSize: 13, fontWeight: 800, cursor: 'pointer',
    fontFamily: 'inherit', boxShadow: '0 8px 22px rgba(30,155,240,.4)',
  },
  queueChip: {
    display: 'flex', alignItems: 'center', gap: 9,
    background: '#fff', border: `1px solid ${T.garis}`, borderRadius: 999,
    padding: '10px 16px', fontSize: 12, fontWeight: 800, color: T.teks,
    boxShadow: '0 6px 18px rgba(16,84,148,.14)',
  },
  queueBatal: {
    background: T.latar, border: `1px solid ${T.garis}`, color: T.samar,
    borderRadius: 999, padding: '3px 10px', fontSize: 10.5,
    fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit',
  },
  queueDipanggil: {
    background: T.hijauLatar, borderColor: T.hijauGaris, color: T.hijauTeks,
  },
  queueDiberi: {
    background: T.amberLatar, borderColor: T.amberGaris, color: T.amberTeks,
  },
  kotakInfoLive: {
    marginTop: 12, background: T.hijauLatar, border: `1px solid ${T.hijauGaris}`,
    color: T.hijauTeks, borderRadius: 10, padding: '9px 12px',
    fontSize: 12, fontWeight: 700,
  },
};
