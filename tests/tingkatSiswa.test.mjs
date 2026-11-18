// tests/tingkatSiswa.test.mjs
import assert from 'node:assert/strict';
import { deteksiTingkatSiswa } from '../src/utils/tingkatSiswa.js';

console.log('🧪 Memulai pengujian deteksiTingkatSiswa...');

// 1. Uji Siswa 9 SMP (Kasus Nyata Tasya Rohadhat #STD-0926070002)
const tasya = {
  nama: 'Tasya Rohadhat',
  studentId: 'STD-0926070002',
  kelas: '9 SMP',
  kelasSekolah: '9 SMP',
  jenjang: 'SMP',
};
const resTasya = deteksiTingkatSiswa(tasya);
assert.equal(resTasya.isKelas12, false, 'Tasya BUKAN kelas 12');
assert.equal(resTasya.isSma, false, 'Tasya BUKAN SMA');
assert.equal(resTasya.isSmp, true, 'Tasya adalah SMP');
assert.equal(resTasya.bisaAksesTargetKampus, false, 'Tasya TIDAK boleh akses target kampus');
assert.equal(resTasya.bisaAksesFiturUtbk, false, 'Tasya TIDAK boleh akses fitur UTBK');
console.log('✅ Uji 1 Berhasil: Siswa 9 SMP terisolasi total dari fitur UTBK & Kampus');

// 2. Uji Siswa 12 SMA (Kelas 12 Paten)
const desta = {
  nama: 'Kaka Desta',
  kelas: '12 SMA',
  jenjang: 'SMA',
};
const resDesta = deteksiTingkatSiswa(desta);
assert.equal(resDesta.isKelas12, true, 'Desta adalah kelas 12');
assert.equal(resDesta.isSma, true, 'Desta adalah SMA');
assert.equal(resDesta.bisaAksesTargetKampus, true, 'Desta BISA akses target kampus');
assert.equal(resDesta.bisaAksesFiturUtbk, true, 'Desta BISA akses fitur UTBK');
console.log('✅ Uji 2 Berhasil: Siswa 12 SMA memiliki hak akses penuh paten ke UTBK');

// 3. Uji Siswa 10 & 11 SMA
const rina = {
  nama: 'Rina',
  kelas: '10 SMA',
  jenjang: 'SMA',
};
const resRina = deteksiTingkatSiswa(rina);
assert.equal(resRina.isKelas12, false, 'Rina BUKAN kelas 12');
assert.equal(resRina.isSmaBawah, true, 'Rina adalah SMA bawah');
assert.equal(resRina.bisaAksesTargetKampus, true, 'Rina BISA eksplorasi kampus');
assert.equal(resRina.bisaAksesFiturUtbk, false, 'Rina TIDAK bisa akses intensif UTBK');
console.log('✅ Uji 3 Berhasil: Siswa 10/11 SMA bisa eksplorasi kampus tapi fitur UTBK dibatasi');

// 4. Uji Siswa SD & English Course
const adit = { nama: 'Adit', kelas: '6 SD', jenjang: 'SD' };
const resAdit = deteksiTingkatSiswa(adit);
assert.equal(resAdit.bisaAksesFiturUtbk, false);
assert.equal(resAdit.bisaAksesTargetKampus, false);
assert.equal(resAdit.isSd, true);

const john = { nama: 'John', program: 'English Course' };
const resJohn = deteksiTingkatSiswa(john);
assert.equal(resJohn.bisaAksesFiturUtbk, false);
assert.equal(resJohn.bisaAksesTargetKampus, false);
console.log('✅ Uji 4 Berhasil: Siswa SD dan English Course tidak melihat fitur UTBK maupun kampus');

console.log('🎉 SEMUA TEST DETEKSI TINGKAT SISWA LULUS 100%!');
