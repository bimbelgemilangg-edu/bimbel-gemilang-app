export const TAHAP_KELAS = [
  { id: 'menjelaskan', label: 'Menjelaskan', ikon: '📖', warna: '#4f46e5', bantuan: 'Ikuti penjelasan guru dan perhatikan papan.' },
  { id: 'contoh-guru', label: 'Contoh Guru', ikon: '✍️', warna: '#0891b2', bantuan: 'Guru sedang memperagakan cara berpikir dan langkah penyelesaian.' },
  { id: 'latihan-siswa', label: 'Latihan Siswa', ikon: '🎯', warna: '#d97706', bantuan: 'Kerjakan mandiri. Jika siap, tekan Saya mau maju.' },
  { id: 'pembahasan', label: 'Pembahasan', ikon: '🧠', warna: '#16a34a', bantuan: 'Cocokkan jawabanmu dengan pembahasan guru di papan.' },
  { id: 'refleksi', label: 'Refleksi', ikon: '💡', warna: '#9333ea', bantuan: 'Tuliskan satu hal yang sudah kamu pahami dan satu hal yang ingin ditanyakan.' },
];

export function tahapDenganId(id) {
  return TAHAP_KELAS.find((t) => t.id === id) || TAHAP_KELAS[0];
}

export function formatTimer(totalDetik) {
  const detik = Math.max(0, Number(totalDetik) || 0);
  const menit = Math.floor(detik / 60);
  const sisa = detik % 60;
  return `${String(menit).padStart(2, '0')}:${String(sisa).padStart(2, '0')}`;
}

export function sisaTimer(sesi, sekarang = Date.now()) {
  if (!sesi) return 0;
  const durasi = Math.max(0, Number(sesi.timerDurasiDetik) || 0);
  if (sesi.timerStatus !== 'running') return Math.max(0, Number(sesi.timerSisaDetik) || durasi);
  const mulai = sesi.timerMulaiAt?.toMillis?.() || sesi.timerMulaiAt?.seconds * 1000;
  if (!mulai) return Math.max(0, Number(sesi.timerSisaDetik) || durasi);
  return Math.max(0, durasi - Math.floor((sekarang - mulai) / 1000));
}
