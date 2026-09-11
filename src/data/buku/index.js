// src/data/buku/index.js -- REGISTRY BUKU
import bab01 from './bab01';
import bab02 from './bab02';
import bab03 from './bab03';
import bab04 from './bab04';
import bab05 from './bab05';

export const DAFTAR_BUKU = [
  {
    id: 'tka-mat-9',
    judul: 'Buku TKA Matematika Kelas 9 SMP',
    mapel: 'Matematika',
    jenjang: 'SMP/MTs',
    kelas: 9,
    emoji: '🎯',
    warna: '#4C6EF5',
    deskripsi: 'Persiapan TKA Matematika: 21 bab lengkap dengan soal pemantapan, visual interaktif, dan pembahasan.',
    bab: [bab01, bab02, bab03, bab04, bab05],
  },
];