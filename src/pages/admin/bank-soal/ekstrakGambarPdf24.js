// src/pages/admin/bank-soal/ekstrakGambarPdf24.js
// ============================================================
// Baca file HTML hasil convert PDF -> HTML dari tools.pdf24.org,
// lalu kelompokkan tiap gambar ke nomor soal (atau nomor bacaan)
// yang paling dekat DI ATASNYA secara visual di halaman PDF asli.
//
// KENAPA PAKAI KOORDINAT Y, BUKAN URUTAN DI DALAM FILE?
// Karena posisi teks & gambar di HTML pdf24 ditulis absolut
// (position:absolute) per elemen -- urutannya di dalam file HTML
// TIDAK SELALU sama dengan urutan tampilan visual atas-ke-bawah.
// Jadi urutan yang benar harus dihitung dari (halaman, posisi Y),
// bukan dari urutan tag.
//
// BUG YANG PERNAH KEJADIAN (jangan diulang):
// PDF sumber kadang menulis "Soal No 9" (N besar) di satu soal dan
// "Soal no 9" (n kecil) di soal lain, DALAM SATU FILE YANG SAMA.
// Karena itu pencarian nomor soal WAJIB case-insensitive.
// ============================================================

/**
 * Ambil koordinat x,y dari style transform: matrix(1,0,0,1,X,Y)
 */
function ambilKoordinat(style) {
    const m = /matrix\(1,0,0,1,(-?[\d.]+),(-?[\d.]+)\)/.exec(style || '');
    if (!m) return { x: null, y: null };
    return { x: parseFloat(m[1]), y: parseFloat(m[2]) };
  }
  
  function ambilUkuran(style) {
    const w = /width:([\d.]+)px/.exec(style || '');
    const h = /height:([\d.]+)px/.exec(style || '');
    return {
      lebar: w ? parseFloat(w[1]) : null,
      tinggi: h ? parseFloat(h[1]) : null,
    };
  }
  
  /**
   * Fungsi utama.
   * @param {string} html - isi file HTML hasil convert PDF24
   * @param {object} opsi
   *   - lebarMinGambar: gambar lebih kecil dari ini dianggap ikon/watermark, diabaikan (default 40px)
   * @returns {{
   *   perSoal: Record<number, Array<{src:string, lebar:number, tinggi:number, halaman:number, y:number}>>,
   *   bacaanImages: Record<number, Array<{...}>>,
   *   belumTerpetakan: Array<{...}>,
   *   ringkasan: object,
   * }}
   */
  export function ekstrakGambarPerSoal(html, opsi = {}) {
    const lebarMinGambar = opsi.lebarMinGambar ?? 40;
  
    // 1. Pecah per halaman (tiap halaman PDF = 1 blok <div class="page">)
    const halamanList = String(html || '').split('<div class="page"').slice(1);
  
    // 2. Kumpulkan semua "kejadian" (marker soal, marker bacaan, & gambar)
    //    lintas halaman.
    const kejadian = [];
  
    halamanList.forEach((halaman, indexHalaman) => {
      // --- marker nomor soal, case-insensitive: "Soal No 9" / "Soal no 9" / "Soal No. 9" ---
      const regexTeks = /<div class="t[^"]*" style="([^"]*)">(.*?)<\/div>/gs;
      let m;
      while ((m = regexTeks.exec(halaman)) !== null) {
        const style = m[1];
        const teksMentah = m[2].replace(/<[^>]+>/g, '');
        const cocokSoal = /soal\s*no\.?\s*(\d+)/i.exec(teksMentah);
        const cocokBacaan = /bacaan\s*(\d+)/i.exec(teksMentah);
        if (cocokSoal) {
          const { y } = ambilKoordinat(style);
          if (y !== null) {
            kejadian.push({ tipe: 'soal', halaman: indexHalaman, y, nomor: parseInt(cocokSoal[1], 10) });
          }
        } else if (cocokBacaan) {
          const { y } = ambilKoordinat(style);
          if (y !== null) {
            kejadian.push({ tipe: 'bacaan', halaman: indexHalaman, y, nomorBacaan: parseInt(cocokBacaan[1], 10) });
          }
        }
      }
  
      // --- semua tag <img class="im" ...> di halaman ini ---
      const regexImg = /<img class="im"[^>]*>/g;
      let mi;
      while ((mi = regexImg.exec(halaman)) !== null) {
        const tag = mi[0];
        const styleMatch = /style="([^"]*)"/.exec(tag);
        const srcMatch = /src="(data:image\/[a-z]+;base64,[^"]+)"/.exec(tag);
        const style = styleMatch ? styleMatch[1] : '';
        const { y } = ambilKoordinat(style);
        const { lebar, tinggi } = ambilUkuran(style);
        if (y === null || !srcMatch) continue;
        if (lebar !== null && lebar < lebarMinGambar) continue; // buang ikon/watermark kecil
        kejadian.push({ tipe: 'gambar', halaman: indexHalaman, y, lebar, tinggi, src: srcMatch[1] });
      }
    });
  
    // 3. Urutkan kejadian: per halaman, lalu per posisi Y (urutan baca alami)
    kejadian.sort((a, b) => (a.halaman !== b.halaman ? a.halaman - b.halaman : a.y - b.y));
  
    // 4. Jalan dari atas ke bawah: tiap gambar "milik" marker soal/bacaan
    //    TERAKHIR yang sudah dilewati sebelum gambar itu muncul.
    const perSoal = {};
    const bacaanImages = {};
    const belumTerpetakan = [];
    let soalAktif = null;
    let bacaanAktif = null;
  
    for (const k of kejadian) {
      if (k.tipe === 'soal') {
        soalAktif = k.nomor;
        bacaanAktif = null; // masuk soal baru -> konteks "sedang di bacaan" berakhir
      } else if (k.tipe === 'bacaan') {
        bacaanAktif = k.nomorBacaan;
      } else if (k.tipe === 'gambar') {
        const g = { src: k.src, lebar: k.lebar, tinggi: k.tinggi, halaman: k.halaman, y: k.y };
        if (bacaanAktif !== null) {
          (bacaanImages[bacaanAktif] ??= []).push(g);
        } else if (soalAktif !== null) {
          (perSoal[soalAktif] ??= []).push(g);
        } else {
          belumTerpetakan.push(g);
        }
      }
    }
  
    return {
      perSoal,
      bacaanImages,
      belumTerpetakan,
      ringkasan: {
        jumlahHalaman: halamanList.length,
        jumlahSoalTerdeteksi: kejadian.filter((k) => k.tipe === 'soal').length,
        jumlahBacaanTerdeteksi: kejadian.filter((k) => k.tipe === 'bacaan').length,
        jumlahGambarTotal: kejadian.filter((k) => k.tipe === 'gambar').length,
        jumlahGambarTerpetakanKeSoal: Object.values(perSoal).reduce((a, arr) => a + arr.length, 0),
        jumlahGambarTerpetakanKeBacaan: Object.values(bacaanImages).reduce((a, arr) => a + arr.length, 0),
        jumlahGambarTanpaKonteks: belumTerpetakan.length,
      },
    };
  }