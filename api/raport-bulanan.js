// api/raport-bulanan.js
// ============================================================
// FASE 3 RAPORT OTOMATIS (21 Okt 2026) — PENERBIT BULANAN TERJADWAL
// ============================================================
// Blueprint ANALISIS-RAPORT-OTOMATIS.md §9 lapis 2. Dijalankan cron Vercel
// (vercel.json: '5 17 * * *' UTC = 00.05 WIB) SETIAP HARI; logika tanggal
// ada di src/utils/raportCron.js (MURNI + diuji): hanya tanggal 1 WIB yang
// menerbitkan — bulan yang baru tertutup, plus laporan besar 3 bulan bila
// bulan itu menutup trimester (selaras awal semester Agustus: Agu–Okt,
// Nov–Jan, Feb–Apr, Mei–Jul).
//
// Janji yang sama dengan penerbitan manual /admin/raport:
//   1. IDEMPOTEN — ID dokumen deterministik (kunciDokRaport); dokumen
//      TERKUNCI yang sudah ada DILEWATI (guard bolehTimpaRaportFinal tanpa
//      paksa). Cron tidak pernah menimpa snapshot terkunci diam-diam;
//      koreksi data = terbit ulang manual dengan alasan (jejak audit).
//   2. SEMUA NILAI GURU IKUT OTOMATIS — sumber data identik dengan halaman
//      admin: kuis, sesi TO + paket, absensi, tugas (nilai guru di `score`),
//      koleksi `grades` (nilai panel guru), latihan Leitner, XP, metadata
//      bank_soal. Nol beban guru: apa pun yang sudah mereka isi di panel
//      mengalir ke raport tanpa langkah tambahan.
//   3. JUJUR — tidak mengarang angka (null = belum terukur), jenjang tanpa
//      TKA/SNBT tetap terbit (komponen ujian '—', bobot diredistribusi
//      mesin), dan bila waktu function habis (batas 60s Vercel) sisanya
//      dilaporkan apa adanya, BUKAN dianggap sukses.
//   4. BERJEJAK — tiap periode menulis dokumen audit_logs (peran 'sistem').
//
// AUTH (sampai P0-2 lapisan auth API selesai): header
//   Authorization: Bearer <RAPORT_CRON_SECRET atau CRON_SECRET>
// Vercel Cron otomatis mengirim CRON_SECRET bila env-nya diset. Tanpa
// secret di env, endpoint menjawab 501 (tidak pernah terbuka tanpa kunci —
// pelajaran insiden Firestore terbuka).
//
// Manual/ops (butuh auth yang sama):
//   GET /api/raport-bulanan?periode=2026-09
//   GET /api/raport-bulanan?periode=2026-08..2026-10,2026-10
// ============================================================

import crypto from 'node:crypto';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import {
  hitungRaportSemuaSiswa, rentangPeriode, bangunDokumenRaport,
  bolehTimpaRaportFinal, VERSI_MESIN,
} from '../src/utils/raportOtomatis.js';
import {
  rencanaTerbitCron, parseOverridePeriode,
} from '../src/utils/raportCron.js';

// Batas aman di bawah maxDuration 60s: sisa waktu dipakai untuk menjawab
// jujur (sebagian terbit) daripada dipotong Vercel tanpa laporan.
const BATAS_MS = 48_000;
const CHUNK_BACA = 400;   // db.getAll per gelombang
const CHUNK_TULIS = 400;  // WriteBatch Firestore maks 500 op
const CAP_SOAL_META = 900; // sama dengan halaman admin (hemat biaya baca)

// ------------------------------------------------------------
// Inisialisasi Admin SDK — pola identik verifyStaffLogin.js
// ------------------------------------------------------------
let adminSiap = false;
let adminError = '';

function siapkanAdmin() {
  if (adminSiap) return true;
  try {
    const raw = process.env.FIREBASE_SERVICE_ACCOUNT;
    if (!raw) {
      adminError = 'FIREBASE_SERVICE_ACCOUNT belum diisi di environment Vercel.';
      return false;
    }
    let sa;
    try {
      sa = JSON.parse(raw);
    } catch {
      sa = JSON.parse(raw.replace(/\\n/g, '\n'));
    }
    if (!sa.project_id) {
      sa.project_id = process.env.FIREBASE_PROJECT_ID || 'gemilangsystem';
    }
    if (getApps().length === 0) {
      initializeApp({ credential: cert(sa) });
    }
    adminSiap = true;
    return true;
  } catch (e) {
    adminError = `Gagal inisialisasi Firebase Admin: ${e?.message || e}`;
    return false;
  }
}

function amanSetara(a, b) {
  const ba = Buffer.from(String(a || ''));
  const bb = Buffer.from(String(b || ''));
  if (ba.length !== bb.length) return false;
  return crypto.timingSafeEqual(ba, bb);
}

// ------------------------------------------------------------
// Ambil semua bahan (sekali jalan; dipakai untuk 1–2 periode sekaligus)
// ------------------------------------------------------------
async function muatBahan(db) {
  const ambil = async (kol) => {
    const snap = await db.collection(kol).get();
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  };
  const [siswa, kuis, sesi, paket, absensi, tugas, nilaiGuru, progresSoal, progresSiswa] = await Promise.all([
    ambil('students'), ambil('jawaban_kuis'), ambil('tryout_sesi'), ambil('tryout_paket'),
    ambil('attendance'), ambil('jawaban_tugas'), ambil('grades'),
    ambil('siswa_soal_progress'), ambil('siswa_progress'),
  ]);
  // Metadata bank_soal HANYA untuk butir yang dirujuk latihan harian
  // (pola & cap sama dengan halaman admin — soal di dalam paket TO sudah
  // menyimpan skemanya sendiri di daftarSoal).
  const soalMeta = {};
  const idSoal = [...new Set(progresSoal.map((p) => p.soalId).filter(Boolean))].slice(0, CAP_SOAL_META);
  for (let i = 0; i < idSoal.length; i += CHUNK_BACA) {
    const refs = idSoal.slice(i, i + CHUNK_BACA).map((id) => db.collection('bank_soal').doc(id));
    const docs = await db.getAll(...refs);
    for (const d of docs) {
      if (!d.exists) continue;
      const x = d.data();
      soalMeta[d.id] = {
        mataPelajaran: x.mataPelajaran || x.mapel || '',
        materi: x.materi || '',
        kesulitan: x.kesulitan || '',
      };
    }
  }
  return {
    siswa, kuis, sesi, paket, absensi, tugas, nilaiGuru, progresSoal, progresSiswa, soalMeta,
    metaDipakai: Object.keys(soalMeta).length,
    metaDiminta: idSoal.length,
  };
}

// ------------------------------------------------------------
// Terbitkan SATU periode (idempoten; dokumen terkunci dilewati)
// ------------------------------------------------------------
async function terbitkanPeriode(db, mentah, periodeOpts, mulaiMs) {
  const h = hitungRaportSemuaSiswa(mentah, periodeOpts);
  const jendela = rentangPeriode(periodeOpts);

  // Susun semua dokumen yang hendak ditulis + guard kunci.
  const kandidat = [];
  for (const r of h.siswa) {
    const { docsAkademik, dokProses } = bangunDokumenRaport(r, {
      jejak: {
        jendela: { mulai: jendela.mulaiMs, selesai: jendela.selesaiMs, label: jendela.label },
        jumlahDokumenSumber: {
          kuis: mentah.kuis.length, sesi: mentah.sesi.length, absensi: mentah.absensi.length,
          tugas: mentah.tugas.length, latihan: mentah.progresSoal.length,
        },
      },
    });
    for (const d of [...docsAkademik, dokProses]) {
      kandidat.push({ id: d.id, data: d.data });
    }
  }

  let ditulis = 0;
  let dilewatiTerkunci = 0;
  let gagal = 0;
  let kehabisanWaktu = false;
  const koleksi = db.collection('raport_final');

  for (let i = 0; i < kandidat.length && !kehabisanWaktu; i += CHUNK_BACA) {
    if (Date.now() - mulaiMs > BATAS_MS) { kehabisanWaktu = true; break; }
    const potongan = kandidat.slice(i, i + CHUNK_BACA);
    const ada = await db.getAll(...potongan.map((k) => koleksi.doc(k.id)));
    const batch = db.batch();
    let opBatch = 0;
    potongan.forEach((k, j) => {
      const eks = ada[j];
      const guard = bolehTimpaRaportFinal(eks.exists ? eks.data() : null, {}); // TANPA paksa — cron tak pernah menimpa snapshot terkunci
      if (!guard.boleh) { dilewatiTerkunci += 1; return; }
      const payload = { ...k.data, diterbitkanOleh: 'cron-vercel' };
      payload.jejak = {
        ...payload.jejak,
        keterangan: `${payload.jejak.keterangan || ''} Diterbitkan otomatis oleh cron bulanan (Fase 3) tanpa campur tangan guru/admin.`.trim(),
      };
      if (eks.exists) {
        batch.set(koleksi.doc(k.id), { ...payload, koreksiAlasan: null, updatedAt: FieldValue.serverTimestamp() }, { merge: true });
      } else {
        batch.set(koleksi.doc(k.id), { ...payload, createdAt: FieldValue.serverTimestamp(), updatedAt: FieldValue.serverTimestamp() });
      }
      opBatch += 1;
    });
    if (opBatch > 0) {
      try {
        await batch.commit();
        ditulis += opBatch;
      } catch (e) {
        gagal += opBatch;
        console.error(`[raport-bulanan] batch gagal (${jendela.label}):`, e?.message || e);
      }
    }
  }

  // Jejak audit (pola auditLog.js, peran 'sistem' — ditulis server).
  try {
    await db.collection('audit_logs').add({
      waktu: FieldValue.serverTimestamp(),
      aktor: 'cron-vercel',
      aktorNama: 'Cron Raport Bulanan',
      peran: 'sistem',
      kategori: 'siswa',
      aksi: 'raport.terbitkan-otomatis',
      target: `Raport otomatis ${jendela.label} (cron Fase 3)`,
      detail: {
        periode: jendela.label, totalSiswa: h.siswa.length, ditulis, dilewatiTerkunci, gagal,
        layakTerbit: h.ringkasan.layakTerbit, belumCukup: h.ringkasan.belumCukup,
        logTakDikenal: h.ringkasan.logTakDikenal, versiMesin: VERSI_MESIN,
        kehabisanWaktu,
      },
      perangkat: 'vercel-cron',
    });
  } catch (e) {
    console.error('[raport-bulanan] audit gagal (tidak memblokir):', e?.message || e);
  }

  return {
    periode: jendela.label,
    totalSiswa: h.siswa.length,
    layakTerbit: h.ringkasan.layakTerbit,
    belumCukup: h.ringkasan.belumCukup,
    ditulis,
    dilewatiTerkunci,
    gagal,
    kehabisanWaktu,
    logTakDikenal: h.ringkasan.logTakDikenal,
  };
}

// ------------------------------------------------------------
// HANDLER
// ------------------------------------------------------------
export default async function handler(req, res) {
  const mulaiMs = Date.now();
  try {
    // ---- auth: Bearer secret (sampai P0-2 auth API selesai) ----
    const secret = process.env.RAPORT_CRON_SECRET || process.env.CRON_SECRET || '';
    if (!secret) {
      return res.status(501).json({
        ok: false,
        pesan: 'Cron raport belum aktif: RAPORT_CRON_SECRET (atau CRON_SECRET) belum diset di environment Vercel. Endpoint menolak berjalan tanpa kunci.',
      });
    }
    const header = String(req.headers?.authorization || '');
    const token = header.replace(/^Bearer\s+/i, '');
    if (!token || !amanSetara(token, secret)) {
      return res.status(401).json({ ok: false, pesan: 'Tidak sah. Kirim header Authorization: Bearer <secret>.' });
    }
    if (!siapkanAdmin()) {
      return res.status(501).json({ ok: false, pesan: adminError });
    }
    const db = getFirestore();

    // ---- rencana periode: override manual ATAU logika cron (WIB) ----
    const override = String(req.query?.periode || '');
    let daftarPeriode;
    let pemicu;
    if (override) {
      try {
        daftarPeriode = parseOverridePeriode(override);
        pemicu = 'manual (?periode=)';
      } catch (e) {
        return res.status(400).json({ ok: false, pesan: e?.message || String(e) });
      }
    } else {
      const rencana = rencanaTerbitCron(new Date().toISOString());
      if (!rencana.jalan) {
        return res.status(200).json({
          ok: true, diterbitkan: 0, pemicu: 'cron harian',
          pesan: rencana.alasan, wib: rencana.wib, durasiMs: Date.now() - mulaiMs,
        });
      }
      daftarPeriode = rencana.periode;
      pemicu = 'cron harian (tanggal 1 WIB)';
    }

    // ---- bahan dibaca SEKALI untuk semua periode ----
    const mentah = await muatBahan(db);
    const hasil = [];
    let kehabisanWaktu = false;
    for (const p of daftarPeriode) {
      if (Date.now() - mulaiMs > BATAS_MS) {
        kehabisanWaktu = true;
        hasil.push({ periode: p.bulan || `${p.mulai}..${p.selesai}`, dilewati: 'kehabisan waktu (batas 60s) — jalankan ulang manual: ?periode=… (idempoten, aman)' });
        break;
      }
      hasil.push(await terbitkanPeriode(db, mentah, p, mulaiMs));
    }

    const ditulis = hasil.reduce((s, r) => s + (r.ditulis || 0), 0);
    return res.status(200).json({
      ok: !kehabisanWaktu && hasil.every((r) => !r.gagal),
      pemicu,
      versiMesin: VERSI_MESIN,
      bahan: {
        siswa: mentah.siswa.length, kuis: mentah.kuis.length, sesi: mentah.sesi.length,
        absensi: mentah.absensi.length, tugas: mentah.tugas.length, nilaiGuru: mentah.nilaiGuru.length,
        latihan: mentah.progresSoal.length,
        soalMeta: `${mentah.metaDipakai}/${mentah.metaDiminta}`,
      },
      hasil,
      ditulis,
      kehabisanWaktu,
      durasiMs: Date.now() - mulaiMs,
    });
  } catch (e) {
    console.error('[raport-bulanan] error:', e);
    return res.status(500).json({ ok: false, pesan: `Terjadi kesalahan server: ${e?.message || e}` });
  }
}
