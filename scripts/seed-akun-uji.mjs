// scripts/seed-akun-uji.mjs
// ============================================================
// Pembuat AKUN UJI untuk mencoba fitur tanpa mengetik password berulang:
//   2 siswa SMA (kelas 12 uji + kelas 10), 1 siswa SMP,
//   1 admin MANAJER, 1 guru.
// Plus (opsional) menyetel sakelar fitur targetKampus agar sisi siswa
// langsung hidup untuk akun uji.
//
//     node scripts/seed-akun-uji.mjs                 # pakai VITE_FIREBASE_* / .env
//     node scripts/seed-akun-uji.mjs --tanpa-flag    # jangan sentuh settings/
//     node scripts/seed-akun-uji.mjs --produksi-sadar  # HANYA bila memang sadar
//
// 🔥 PAGAR UTAMA: skrip ini MENOLAK berjalan terhadap proyek produksi
// (projectId 'gemilangsystem') kecuali diberi --produksi-sadar. Akun uji di
// database produksi berarti nama palsu muncul di daftar siswa, leaderboard,
// dan ekspor admin -- kotoran yang nanti harus dibersihkan tangan.
// Jalankan terhadap proyek dev (docs/MODE-UJI-COBA-FITUR.md bagian 4).
//
// Kenapa hash admin dibuat di sini dan bukan diketik tangan: skema kredensial
// admin adalah PBKDF2-HMAC-SHA256 210.000 iterasi (utils/passwordHash.js).
// Modul itu murni tanpa Firebase, jadi skrip ini memakainya LANGSUNG --
// format hash dijamin sama dengan yang diverifikasi halaman login, bukan
// tiruan yang bisa melenceng.
//
// Butuh dependensi repo (firebase). Jalankan setelah `npm ci`.
// ============================================================
import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc, collection, getDocs } from 'firebase/firestore';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';
import {
  hashPassword, buatSalt, PBKDF2_ITERATIONS, validasiPassword,
} from '../src/utils/passwordHash.js';

const PRODUKSI = 'gemilangsystem';
const argProduksi = process.argv.includes('--produksi-sadar');
const argTanpaFlag = process.argv.includes('--tanpa-flag');

const env = process.env;
const config = {
  apiKey: env.VITE_FIREBASE_API_KEY || env.SEED_API_KEY,
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN || env.SEED_AUTH_DOMAIN,
  projectId: env.VITE_FIREBASE_PROJECT_ID || env.SEED_PROJECT_ID,
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET || env.SEED_STORAGE_BUCKET,
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID || env.SEED_SENDER_ID,
  appId: env.VITE_FIREBASE_APP_ID || env.SEED_APP_ID,
};

if (!config.projectId || !config.apiKey) {
  console.error('❌ Konfigurasi Firebase tidak ada. Isi VITE_FIREBASE_* di .env.local');
  console.error('   (lihat docs/MODE-UJI-COBA-FITUR.md bagian 4) atau ekspor SEED_*.');
  process.exit(1);
}
if (config.projectId === PRODUKSI && !argProduksi) {
  console.error('❌ MENOLAK: konfigurasi menunjuk Firestore PRODUKSI (' + PRODUKSI + ').');
  console.error('   Akun uji seharusnya hidup di proyek dev. Bila memang sadar');
  console.error('   ingin mengisi produksi, ulangi dengan --produksi-sadar.');
  process.exit(1);
}

const PASSWORD = 'uji12345'; // memenuhi validasiPassword: >=8, huruf+angka
const errP = validasiPassword(PASSWORD);
if (errP) { console.error('❌ password uji tidak lolos validasi repo:', errP); process.exit(1); }

const app = initializeApp(config);
const db = getFirestore(app);
const auth = getAuth(app);

const hariIni = new Date().toISOString();

const SISWA = [
  {
    id: 'GEM-UJI-001', username: 'uji12', nama: 'UJI COBA — Kelas 12 (JANGAN DINILAI)',
    jenjang: 'SMA', kelasSekolah: '12 UJI',
  },
  {
    id: 'GEM-UJI-002', username: 'uji10', nama: 'UJI COBA — Kelas 10 (JANGAN DINILAI)',
    jenjang: 'SMA', kelasSekolah: '10 UJI',
  },
  {
    id: 'GEM-UJI-003', username: 'ujismp', nama: 'UJI COBA — SMP (JANGAN DINILAI)',
    jenjang: 'SMP', kelasSekolah: '9 UJI',
  },
];

async function seedSiswa() {
  for (const s of SISWA) {
    const sebelum = await getDocs(collection(db, 'students'));
    const bentrok = sebelum.docs.find((d) => (d.data().username || '').toLowerCase() === s.username);
    if (bentrok) {
      console.log(`  = siswa @${s.username} sudah ada (doc ${bentrok.id}) — dilewati`);
      continue;
    }
    await setDoc(doc(db, 'students', s.id), {
      studentId: s.id,
      username: s.username,
      password: PASSWORD, // skema login siswa memang teks polos (lihat docs/INSIDEN-KEAMANAN-*)
      role: 'siswa',
      nama: s.nama,
      jenjang: s.jenjang,
      kelasSekolah: s.kelasSekolah,
      kategori: 'Reguler',
      status: 'Aktif',
      isBlocked: false,
      // 'semua' supaya pagar Akses Mapel tidak menyembunyikan soal apa pun,
      // termasuk mapel utbk_* yang baru ditambahkan.
      enrolledSubjects: ['semua'],
      detailProgram: `Reguler · ${s.jenjang} (akun uji)`,
      paketNama: 'Paket Uji',
      createdAt: hariIni,
      keterangan: 'AKUN UJI fitur rasionalisasi kampus — jangan dipakai untuk data sungguhan',
    });
    console.log(`  + siswa @${s.username} (${s.kelasSekolah})`);
  }
}

async function seedAdmin() {
  const username = 'ujimanajer';
  const ada = await getDocs(collection(db, 'admin_users'));
  if (ada.docs.some((d) => d.id === username)) {
    console.log(`  = admin @${username} sudah ada — dilewati`);
    return;
  }
  const salt = buatSalt();
  const passwordHash = await hashPassword(PASSWORD, salt);
  await setDoc(doc(db, 'admin_users', username), {
    username,
    nama: 'Akun Uji Manajer',
    jabatan: 'Uji coba fitur',
    // MANAJER, bukan operasional: halaman Impor Database PTN dan Target
    // Kampus Siswa terkunci untuk Owner & Manajer saja.
    peran: 'manajer',
    aktif: true,
    passwordHash,
    passwordSalt: salt,
    passwordIterations: PBKDF2_ITERATIONS,
    dibuatOleh: 'seed-akun-uji',
    dibuatPada: hariIni,
    terakhirLogin: null,
    terakhirLoginPerangkat: '',
    jumlahLogin: 0,
  });
  console.log(`  + admin @${username} (peran MANAJER)`);
}

async function seedGuru() {
  const email = 'guru.uji@gemilang.test';
  const ada = await getDocs(collection(db, 'teachers'));
  if (ada.docs.some((d) => (d.data().email || '').toLowerCase() === email)) {
    console.log(`  = guru ${email} sudah ada — dilewati`);
    return;
  }
  try {
    await createUserWithEmailAndPassword(auth, email, PASSWORD);
  } catch (e) {
    if (!/auth\/email-already-in-use/.test(e.code || '')) {
      console.log(`  ! auth guru gagal (${e.code || e.message}) — dokumen teachers tetap dibuat`);
    }
  }
  await setDoc(doc(db, 'teachers', 'guru-uji-001'), {
    email,
    nama: 'Akun Uji Guru',
    mapel: 'Matematika',
    status: 'aktif',
    keterangan: 'AKUN UJI — jangan dipakai untuk data sungguhan',
    createdAt: hariIni,
  });
  console.log(`  + guru ${email}`);
}

async function seedFlag() {
  if (argTanpaFlag) { console.log('  - sakelar fitur dilewati (--tanpa-flag)'); return; }
  await setDoc(doc(db, 'settings', 'global_config'), {
    fiturPilot: {
      targetKampus: {
        aktif: true,
        mode: 'kelas',
        daftarKelasUji: ['12 UJI'],
        daftarSiswaUji: ['GEM-UJI-001'],
        catatan: 'disetel oleh scripts/seed-akun-uji.mjs',
        diperbaruiOleh: 'seed-script',
        diperbaruiAt: hariIni,
      },
    },
  }, { merge: true });
  console.log('  + sakelar fitur targetKampus: mode kelas [12 UJI]');
}

console.log(`Seed akun uji -> proyek ${config.projectId}`);
await seedSiswa();
await seedAdmin();
await seedGuru();
await seedFlag();

console.log(`
┌──────────────────────────────────────────────────────────────┐
│  AKUN UJI (password semua: ${PASSWORD})                     │
│  siswa kelas 12 : @uji12      -> melihat chip & kartu target │
│  siswa kelas 10 : @uji10      -> harus TIDAK melihat apa-apa │
│  siswa SMP      : @ujismp     -> harus TIDAK melihat apa-apa │
│  admin MANAJER  : @ujimanajer -> /admin/ptn/impor & /target  │
│  guru           : guru.uji@gemilang.test                     │
│  owner          : pakai PIN Anda sendiri (tidak di-seed)     │
└──────────────────────────────────────────────────────────────┘`);
