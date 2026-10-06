import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import { defineConfig, globalIgnores } from 'eslint/config'

// ============================================================
// 🔥 DIPERBAIKI (audit 2026-10-01): sebelumnya HANYA ada satu blok
// config dengan `globals.browser` untuk SEMUA `**/*.{js,jsx}`.
//
// Masalahnya, repo ini punya TIGA lingkungan runtime berbeda:
//   1. src/**            -> browser (React/Vite)
//   2. api/**            -> Vercel Serverless Functions (Node)
//   3. scripts/**        -> skrip build konten (Node)
//   4. *.config.js       -> Node/CommonJS (tailwind.config.js)
//
// Karena semuanya diperlakukan sebagai browser, ESLint melaporkan 38
// error `no-undef` PALSU: `process` (30×), `Buffer` (8×), `module` (1×).
// Error palsu itu menenggelamkan 8 bug `no-undef` yang SUNGGUHAN
// (defaultSalaryRules, getDocs/query/where, meta) -- semuanya bug
// runtime nyata yang sudah diperbaiki.
//
// Sekarang tiap lingkungan punya blok sendiri dengan globals yang benar,
// sehingga `no-undef` hanya menyala untuk masalah yang asli.
// ============================================================

export default defineConfig([
  globalIgnores(['dist', 'dist-probe', 'node_modules', 'public/bagan']),

  // ------------------------------------------------------------
  // 1. APLIKASI FRONTEND (React + Vite) — lingkungan browser
  // ------------------------------------------------------------
  {
    files: ['src/**/*.{js,jsx}'],
    extends: [
      js.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
      parserOptions: {
        ecmaVersion: 'latest',
        ecmaFeatures: { jsx: true },
        sourceType: 'module',
      },
    },
    rules: {
      // `varsIgnorePattern: '^[A-Z_]'` adalah WORKAROUND WAJIB, bukan
      // kelalaian: ESLint pada setup ini tidak menghitung pemakaian JSX
      // (terverifikasi lewat probe 2026-10-05 -- komponen yang benar
      // dipakai di JSX tetap dilaporkan "never used"), jadi mencabut pola
      // ini menghasilkan ±2.000 error palsu. Efek sampingnya tercatat di
      // AUDIT-REPO.md: impor komponen yang nganggur tak terlihat; yang
      // menangkapnya scripts/ci-penjaga-rute.mjs, BUKAN rule ini.
      //
      // `argsIgnorePattern` & `caughtErrorsIgnorePattern` '^_' disamakan
      // dengan blok api/ dan scripts/ (baris 71-75 & 99-103): parameter dan
      // catch yang SENGAJA diabaikan ditandai garis bawah. Tanpa ini,
      // `catch (e)` yang memang harus menelan error tidak punya cara sah
      // untuk menyatakan niatnya, dan repo menyimpan 81 error palsu.
      'no-unused-vars': ['error', {
        varsIgnorePattern: '^[A-Z_]',
        argsIgnorePattern: '^_',
        caughtErrorsIgnorePattern: '^_',
      }],
    },
  },

  // ------------------------------------------------------------
  // 2. VERCEL SERVERLESS FUNCTIONS (api/) — lingkungan Node
  //    Butuh `process`, `Buffer`, `__dirname`, dll.
  // ------------------------------------------------------------
  {
    files: ['api/**/*.js'],
    extends: [js.configs.recommended],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        ...globals.node,
        // Vercel menyuntikkan beberapa global tambahan ke runtime function.
        ...globals.es2021,
      },
    },
    rules: {
      'no-unused-vars': ['error', {
        varsIgnorePattern: '^[A-Z_]',
        argsIgnorePattern: '^_',
        caughtErrorsIgnorePattern: '^_',
      }],
      // File-file di api/ memang banyak melakukan await berurutan di dalam
      // loop (memanggil AI per soal). Itu disengaja, bukan kelalaian.
      'no-await-in-loop': 'off',
      // Escape berlebih di regex (mis. \{ atau \)) TIDAK mengubah perilaku
      // regex-nya. Diturunkan jadi warning di kode server/build karena
      // mengedit regex parser AI tanpa test jauh lebih berisiko daripada
      // membiarkan escape yang tidak perlu. Di src/ tetap 'error'.
      'no-useless-escape': 'warn',
    },
  },

  // ------------------------------------------------------------
  // 3. SKRIP BUILD KONTEN (scripts/) — lingkungan Node
  // ------------------------------------------------------------
  {
    files: ['scripts/**/*.{js,mjs}'],
    extends: [js.configs.recommended],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: { ...globals.node, ...globals.es2021 },
    },
    rules: {
      'no-unused-vars': ['error', {
        varsIgnorePattern: '^[A-Z_]',
        argsIgnorePattern: '^_',
        caughtErrorsIgnorePattern: '^_',
      }],
      'no-await-in-loop': 'off',
      'no-continue': 'off',
      // Lihat catatan di blok api/ -- alasan yang sama.
      'no-useless-escape': 'warn',
    },
  },

  // ------------------------------------------------------------
  // 5. TEST (tests/) — jalan di Node, ESM
  //    Jalankan dengan: npm test
  // ------------------------------------------------------------
  {
    files: ['tests/**/*.{js,mjs}'],
    extends: [js.configs.recommended],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: { ...globals.node, ...globals.es2021 },
    },
    rules: {
      'no-unused-vars': ['error', { varsIgnorePattern: '^[A-Z_]', argsIgnorePattern: '^_' }],
      // Test memang penuh assert berurutan & await di dalam loop.
      'no-await-in-loop': 'off',
    },
  },

  // Skrip .py di scripts/ dijalankan lewat interpreter Python, bukan ESLint.
  // `bing-kunci-snippet.js` BUKAN modul -- itu potongan kode untuk disisipkan
  // ke skrip lain (lihat header file-nya). Variabel `E` di sana disediakan
  // pemanggil, jadi melaporkannya sebagai `no-undef` adalah salah.
  globalIgnores(['scripts/**/*.py', 'scripts/bing-kunci-snippet.js']),

  // ------------------------------------------------------------
  // 4. FILE KONFIGURASI di root — CommonJS / Node
  //    (tailwind.config.js pakai `module.exports`, vite.config.js ESM)
  // ------------------------------------------------------------
  {
    files: ['*.config.js', '*.config.mjs', 'vite.config.probe.mjs'],
    extends: [js.configs.recommended],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'commonjs',
      globals: { ...globals.node, ...globals.es2021 },
    },
    rules: {
      'no-unused-vars': ['error', { varsIgnorePattern: '^[A-Z_]', argsIgnorePattern: '^_' }],
    },
  },
  // vite.config.js memakai `import`/`export` ESM, jadi sourceType-nya beda.
  {
    files: ['vite.config.js', 'vite.config.probe.mjs', 'eslint.config.js'],
    languageOptions: { sourceType: 'module' },
  },
])
