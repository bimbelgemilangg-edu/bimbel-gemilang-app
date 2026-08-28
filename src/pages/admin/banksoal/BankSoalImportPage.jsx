// src/pages/admin/banksoal/BankSoalImportPage.jsx
// ============================================================
// Halaman admin: "Bank Soal -> Import dari PDF".
// Pembungkus tipis di atas BankSoalImport.
// ============================================================

import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, doc, writeBatch, serverTimestamp } from 'firebase/firestore';

import { db } from '../../../firebase';
import SidebarAdmin from '../../../components/SidebarAdmin';
import BankSoalImport from './BankSoalImport';

function slugifyFolderName(name) {
  return String(name || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-+|-+$)/g, '') || 'umum';
}

export default function BankSoalImportPage() {
  const navigate = useNavigate();
  const [folderName, setFolderName] = useState('');
  const [folderLocked, setFolderLocked] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth < 1024 : false,
  );

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

            <p
              style={{
                margin: '0 0 20px',
                color: '#64748b',
                fontSize: 14,
                lineHeight: 1.5,
              }}
            >
              Beri nama folder untuk soal yang akan diimpor sesi ini, misalnya
              "TKA Matematika - Paket Tryout 2025". Soal dengan nama folder yang
              sama akan terkumpul jadi satu.
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
