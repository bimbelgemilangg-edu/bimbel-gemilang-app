// src/pages/admin/banksoal/BankSoalImportPage.jsx
// ============================================================
// Halaman admin: "Bank Soal -> Import dari PDF".
//
// Ini PEMBUNGKUS TIPIS di atas komponen BankSoalImport (yang berisi
// seluruh logika baca PDF -> tinjau -> setujui). File ini cuma
// menyediakan dua hal yang belum ada:
//   1. Tempat menaruh nama folder tujuan (form sederhana dulu --
//      belum ada manajemen folder lengkap/lintas halaman, itu
//      pekerjaan terpisah untuk nanti).
//   2. Fungsi SIMPAN ke Firestore (koleksi `bank_soal`), yang
//      sebelumnya cuma dipanggil lewat prop `onSaveQuestions` tapi
//      belum ada isinya.
//
// Menyatu dengan pola halaman admin lain di project ini: setiap
// halaman admin merender <SidebarAdmin/> sendiri (komponennya
// `position: fixed`, jadi aman dipasang di halaman mana pun tanpa
// perlu layout pembungkus bersama).
// ============================================================

import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, doc, writeBatch, serverTimestamp } from 'firebase/firestore';

import { db } from '../../../firebase';
import SidebarAdmin from '../../../components/SidebarAdmin';
import BankSoalImport from './BankSoalImport';

// Nama folder -> id folder yang rapi dipakai sebagai bagian dari
// query nanti (mis. WHERE folderId == "...") -- tanpa spasi/simbol
// aneh, tapi tetap dibaca manusia untuk debugging cepat di Firestore
// console.
function slugifyFolderName(name) {
  return String(name || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-+|-+$)/g, '') || 'umum';
}

export default function BankSoalImportPage() {
  const navigate = useNavigate();

  // 🔥 SEMENTARA: input teks polos untuk nama folder. Ini BUKAN
  // manajemen folder yang lengkap (belum ada daftar folder yang
  // sudah pernah dibuat, belum ada dropdown pilih folder lama) --
  // itu pekerjaan lanjutan. Untuk sekarang, admin bisa langsung
  // mulai mengimpor soal dan menandainya dengan nama folder yang ia
  // ketik sendiri; folder dengan nama yang sama akan punya
  // `folderId` yang sama juga (lihat slugifyFolderName), sehingga
  // soal-soal yang diimpor di sesi berbeda tetap terkumpul jadi satu
  // kalau nama foldernya sama persis.
  const [folderName, setFolderName] = useState('');
  const [folderLocked, setFolderLocked] = useState(false);
  const [saveError, setSaveError] = useState('');

  // 🔥 FIX BUG NYATA: sebelumnya lebar layar dicek SEKALI doang lewat
  // `window.innerWidth >= 1024 ? 260 : 0` langsung di dalam style --
  // gak ada listener resize sama sekali. Akibatnya kalau jendela
  // di-resize (atau halaman dimuat di ukuran layar yang beda dari
  // asumsi), margin buat SidebarAdmin gak pernah nyesuaiin ulang --
  // konten jadi ketiban/ketutup sidebar atau nyisain celah kosong
  // aneh. Sekarang pakai pola yang SAMA PERSIS dengan halaman admin
  // lain di project ini (state + listener resize), bukan pengecekan
  // sekali jalan.
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 1024);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const folderId = slugifyFolderName(folderName);

  const handleSaveQuestions = useCallback(
    async (questions) => {
      if (!Array.isArray(questions) || questions.length === 0) return;

      setSaveError('');

      try {
        // writeBatch: semua soal tersimpan dalam SATU commit atomik --
        // kalau salah satu gagal, semuanya batal (bukan tersimpan
        // separuh-separuh yang bikin bingung admin melacak mana yang
        // sudah masuk).
        //
        // Batas Firestore: maksimal 500 operasi per batch. Bank soal
        // per halaman PDF biasanya cuma beberapa butir, jadi ini
        // sudah lebih dari cukup untuk pemakaian normal.
        const batch = writeBatch(db);
        const bankSoalRef = collection(db, 'bank_soal');

        for (const question of questions) {
          const docRef = doc(bankSoalRef);
          batch.set(docRef, {
            ...question,
            folderId,
            folderName: folderName.trim() || 'Umum',
            createdAt: serverTimestamp(),
          });
        }

        await batch.commit();
      } catch (error) {
        // Dilempar lagi supaya BankSoalImport.jsx menampilkan pesan
        // errornya ke admin (lihat blok catch di handleSave di sana) --
        // di sini jangan ditelan diam-diam.
        setSaveError(
          `Gagal menyimpan ke Firestore: ${error?.message || 'coba lagi.'}`,
        );
        throw error;
      }
    },
    [folderId, folderName],
  );

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f8fafc' }}>
      <SidebarAdmin />

      <main
        style={{
          flex: 1,
          marginLeft: isMobile ? 0 : 260,
          transition: 'margin-left 0.3s ease',
          minHeight: '100vh',
        }}
      >
        {!folderLocked ? (
          <div
            style={{
              maxWidth: 560,
              margin: '64px auto',
              padding: '32px 28px',
              background: '#fff',
              border: '1px solid #e2e8f0',
              borderRadius: 14,
            }}
          >
            <p
              style={{
                margin: '0 0 6px',
                fontSize: 12,
                letterSpacing: '.06em',
                textTransform: 'uppercase',
                color: '#64748b',
                fontWeight: 600,
              }}
            >
              Bank Soal
            </p>
            <h1 style={{ margin: '0 0 8px', fontSize: 22, fontWeight: 650 }}>
              Import soal dari PDF
            </h1>
            <p style={{ margin: '0 0 20px', color: '#64748b', fontSize: 14, lineHeight: 1.5 }}>
              Beri nama folder untuk soal yang akan diimpor sesi ini --
              misalnya "TKA Matematika - Paket Tryout 2025". Soal
              dengan nama folder yang sama akan terkumpul jadi satu.
            </p>

            <input
              type="text"
              value={folderName}
              onChange={(e) => setFolderName(e.target.value)}
              placeholder="Nama folder, mis. TKA Matematika - Paket Tryout 2025"
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '1px solid #e2e8f0',
                borderRadius: 8,
                fontSize: 14,
                marginBottom: 16,
                boxSizing: 'border-box',
              }}
            />

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={() => navigate('/admin')}
                style={{
                  padding: '9px 15px',
                  border: '1px solid #e2e8f0',
                  borderRadius: 8,
                  background: '#fff',
                  fontSize: 14,
                  fontWeight: 550,
                  cursor: 'pointer',
                }}
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => setFolderLocked(true)}
                disabled={!folderName.trim()}
                style={{
                  padding: '9px 18px',
                  border: '1px solid #1d4ed8',
                  borderRadius: 8,
                  background: folderName.trim() ? '#1d4ed8' : '#93b4f0',
                  color: '#fff',
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: folderName.trim() ? 'pointer' : 'not-allowed',
                }}
              >
                Lanjut
              </button>
            </div>
          </div>
        ) : (
          <>
            {saveError && (
              <div
                style={{
                  maxWidth: 1400,
                  margin: '16px auto 0',
                  padding: '11px 16px',
                  background: '#fef2f2',
                  color: '#b91c1c',
                  border: '1px solid #fecaca',
                  borderRadius: 9,
                  fontSize: 13.5,
                }}
              >
                {saveError}
              </div>
            )}

            <BankSoalImport
              folderId={folderId}
              folderName={folderName.trim() || 'Umum'}
              onSaveQuestions={handleSaveQuestions}
              onCancel={() => navigate('/admin')}
            />
          </>
        )}
      </main>
    </div>
  );
}