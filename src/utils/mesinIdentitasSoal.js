// src/utils/mesinIdentitasSoal.js
// Identitas wajib tiap soal + grup stimulus bersama (teks/tabel/gambar untuk nomor 11-15).

const RE_RANGE = /(?:soal(?:\s+nomor)?|nomor|no\.?)\s*(\d+)\s*(?:[-–—]|s\.?d\.?|sampai|hingga)\s*(\d+)/i;

export function deteksiRentangNomor(teks) {
  const m = String(teks || '').match(RE_RANGE);
  if (!m) return null;
  const dari = parseInt(m[1], 10);
  const sampai = parseInt(m[2], 10);
  if (!dari || !sampai || sampai < dari) return null;
  return { dari, sampai };
}

export function normalisasiBacaan(raw) {
  if (!raw) return null;
  if (typeof raw === 'string') {
    const teks = raw.trim();
    if (!teks) return null;
    return { teks, gambar: [], grup: null, jenis: 'teks', judul: null, tabel: null, rentang: null };
  }
  if (typeof raw === 'object') {
    const teks = String(raw.teks || raw.text || raw.content || '').trim();
    const gbrMentah = raw.gambar || raw.gambarUrls || raw.bacaan_gambar || raw.bacaanGambar || raw.url;
    let gambar = [];
    if (typeof gbrMentah === 'string' && gbrMentah.trim()) {
      gambar = [gbrMentah.trim()];
    } else if (Array.isArray(gbrMentah)) {
      gambar = gbrMentah.map((g) => (typeof g === 'string' ? g : g?.url || g?.uploadedUrl || '')).filter(Boolean);
    } else if (typeof gbrMentah === 'object' && gbrMentah !== null && (gbrMentah.url || gbrMentah.uploadedUrl)) {
      gambar = [String(gbrMentah.url || gbrMentah.uploadedUrl).trim()];
    }
    const grup = raw.grup || raw.stimulusId || raw.groupId || null;
    const judul = raw.judul || raw.bacaan_judul || raw.bacaanJudul || raw.title || null;
    const tabel = raw.tabel || raw.tabelSoal || raw.tabel_soal || null;
    if (!teks && !gambar.length && !tabel) return null;
    return {
      teks,
      gambar,
      grup,
      judul,
      jenis: raw.jenis || (gambar.length && !teks ? 'gambar' : 'teks'),
      tabel,
      rentang: raw.rentang || null,
    };
  }
  return null;
}

export function bangunIdentitasSoal(soal, idx = 0, meta = {}) {
  const nomor = Number(soal.nomor) || Number(soal.no) || idx + 1;
  const teksSoal = String(soal.teksSoal || soal.soal || soal.teks_soal || '').trim();
  const bacaan = normalisasiBacaan(soal.bacaan || soal.stimulus || soal.wacana);
  const idLokal = soal.idLokal || soal.id || [meta.fileName || 'batch', meta.mapel || soal.mapel || 'mapel', nomor, idx].join('_').replace(/[^a-zA-Z0-9_-]/g, '_');
  return {
    idLokal,
    nomor,
    tipe: soal.tipe || soal.jenis || 'pg_sederhana',
    teksSoal,
    soal: teksSoal,
    bacaan,
    mapel: soal.mapel || soal.mataPelajaran || meta.mapel || '',
    mataPelajaran: soal.mataPelajaran || soal.mapel || meta.mapel || '',
    jenjang: soal.jenjang || meta.jenjang || '',
    kelas: soal.kelas || soal.tingkatKelas || meta.kelas || '',
    bab: soal.bab || soal.topik || '',
    subBab: soal.subBab || soal.subbab || '',
    kodeMapel: soal.kodeMapel || '',
    sumberFile: meta.fileName || soal.sumberFile || '',
    identitasLengkap: Boolean(teksSoal),
  };
}

/** Tautkan stimulus bersama (bacaan untuk nomor 11-15) + backfill teks kosong per grup */
export function tautkanStimulusBersama(daftarSoal) {
  const list = (daftarSoal || []).map((s, i) => {
    const id = bangunIdentitasSoal(s, i);
    return { ...s, ...id, bacaan: id.bacaan || normalisasiBacaan(s.bacaan) || null };
  });

  const rentangs = [];
  list.forEach((s, i) => {
    const gabung = `${s.bacaan?.teks || ''}\n${s.teksSoal || ''}`;
    const range = deteksiRentangNomor(gabung);
    if (range) rentangs.push({ ...range, indexMaster: i });
  });

  rentangs.forEach((r, gi) => {
    const grupId = `bacaan_auto_${r.dari}_${r.sampai}_${gi}`;
    let teksMaster = list[r.indexMaster]?.bacaan?.teks || '';
    let gambarMaster = list[r.indexMaster]?.bacaan?.gambar || [];
    list.forEach((s) => {
      const n = Number(s.nomor);
      if (n >= r.dari && n <= r.sampai) {
        const t = s.bacaan?.teks || '';
        if (t.length > teksMaster.length) {
          teksMaster = t;
          gambarMaster = s.bacaan?.gambar || gambarMaster;
        }
      }
    });
    list.forEach((s) => {
      const n = Number(s.nomor);
      if (n < r.dari || n > r.sampai) return;
      s.bacaan = {
        teks: teksMaster || s.bacaan?.teks || '',
        gambar: gambarMaster.length ? gambarMaster : (s.bacaan?.gambar || []),
        grup: grupId,
        jenis: 'teks',
        rentang: { dari: r.dari, sampai: r.sampai },
      };
      s.stimulusGrup = grupId;
      s.stimulusRentang = { dari: r.dari, sampai: r.sampai };
    });
  });

  const masterPerGrup = {};
  list.forEach((s) => {
    const g = s.bacaan?.grup || s.stimulusGrup || s.grup;
    if (!g) return;
    const len = (s.bacaan?.teks || '').length;
    const gbr = (s.bacaan?.gambar || []).length;
    if (!masterPerGrup[g] || len > (masterPerGrup[g].teks || '').length || (!masterPerGrup[g].gambar?.length && gbr > 0)) {
      masterPerGrup[g] = {
        teks: s.bacaan?.teks || masterPerGrup[g]?.teks || '',
        gambar: (s.bacaan?.gambar && s.bacaan.gambar.length) ? s.bacaan.gambar : (masterPerGrup[g]?.gambar || []),
        judul: s.bacaan?.judul || masterPerGrup[g]?.judul || null,
        rentang: s.bacaan?.rentang || s.stimulusRentang || masterPerGrup[g]?.rentang || null,
      };
    }
  });
  list.forEach((s) => {
    const g = s.bacaan?.grup || s.stimulusGrup || s.grup;
    if (!g || !masterPerGrup[g]) return;
    const m = masterPerGrup[g];
    s.bacaan = {
      ...(s.bacaan || {}),
      teks: (s.bacaan?.teks || '').trim() ? s.bacaan.teks : m.teks,
      gambar: (s.bacaan?.gambar && s.bacaan.gambar.length) ? s.bacaan.gambar : (m.gambar || []),
      judul: s.bacaan?.judul || m.judul || null,
      grup: g,
      rentang: s.bacaan?.rentang || m.rentang,
    };
    s.stimulusGrup = g;
    if (m.rentang) s.stimulusRentang = m.rentang;
  });

  return list;
}

export const PROMPT_IDENTITAS_SOAL_AI = `WAJIB tiap soal: nomor, tipe, teksSoal, opsi/kunci, mapel, jenjang, kelas, bab.
STIMULUS BERSAMA: "Bacalah teks untuk soal 11-15" → bacaan { teks, grup:"bacaan_11_15", rentang:{dari:11,sampai:15} } disalin ke setiap soal 11-15.
teksSoal = pertanyaan nomor itu saja (jangan ulang seluruh bacaan).`;

export function ringkasKartuSoal(soal) {
  const teks = String(soal.teksSoal || soal.soal || '').replace(/\s+/g, ' ').trim();
  const preview = teks.length > 140 ? `${teks.slice(0, 140)}…` : teks;
  const grup = soal.stimulusGrup || soal.bacaan?.grup || null;
  const rentang = soal.stimulusRentang || soal.bacaan?.rentang || null;
  return {
    nomor: soal.nomor,
    tipe: soal.tipe || 'pg_sederhana',
    preview: preview || '(tanpa teks soal)',
    mapel: soal.mapel || soal.mataPelajaran || '—',
    jenjang: soal.jenjang || '—',
    bab: soal.bab || '—',
    punyaBacaan: Boolean((soal.bacaan?.teks || '').trim() || (soal.bacaan?.gambar || []).length),
    grup,
    rentangLabel: rentang ? `No ${rentang.dari}–${rentang.sampai}` : null,
    yakin: soal.taksonomiYakin,
  };
}

export default {
  deteksiRentangNomor,
  normalisasiBacaan,
  bangunIdentitasSoal,
  tautkanStimulusBersama,
  ringkasKartuSoal,
  PROMPT_IDENTITAS_SOAL_AI,
};