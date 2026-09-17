// src/utils/mesinTryOutOtomatis.js
// Hybrid: sistem memilih soal; admin hanya rules + wajib TERBITKAN.
// status paket: 'draf' (belum tampil siswa) | 'aktif' | 'nonaktif'
import {
    collection,
    getDocs,
    addDoc,
    updateDoc,
    doc,
    query,
    where,
    limit,
    serverTimestamp,
  } from 'firebase/firestore';
  import { db } from '../firebase';
  
  export const COL_BANK = 'bank_soal';
  export const COL_PAKET = 'tryout_paket';
  export const COL_TEMPLATE = 'tryout_template_otomatis';
  
  export function acakArray(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      const tmp = a[i];
      a[i] = a[j];
      a[j] = tmp;
    }
    return a;
  }
  
  const norm = (s) => String(s || '').toLowerCase().trim();
  
  export async function ambilSoalDariBank(opts) {
    const {
      mapel,
      jenjang,
      kelas,
      bab,
      level,
      jumlah = 10,
      excludeIds = new Set(),
      kelompok,
    } = opts || {};
  
    let snap;
    try {
      snap = await getDocs(
        query(collection(db, COL_BANK), where('status', '==', 'aktif'), limit(1500))
      );
    } catch (e) {
      snap = await getDocs(query(collection(db, COL_BANK), limit(1500)));
    }
  
    let pool = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  
    if (mapel) {
      const m = norm(mapel);
      pool = pool.filter((s) => {
        const a = norm(s.mapel || s.mataPelajaran);
        return a === m || a.includes(m) || m.includes(a);
      });
    }
    if (jenjang) {
      const j = norm(jenjang);
      pool = pool.filter((s) => !s.jenjang || norm(s.jenjang) === j);
    }
    if (kelas) {
      const k = String(kelas);
      pool = pool.filter((s) => {
        const sk = String(s.kelas || s.tingkatKelas || '');
        return !sk || sk === k || sk.includes(k);
      });
    }
    if (bab) {
      const b = norm(bab);
      pool = pool.filter((s) => {
        const t = norm(s.bab || s.topik);
        return t.includes(b) || b.includes(t);
      });
    }
    if (level) {
      const l = norm(level);
      pool = pool.filter((s) => !s.level || norm(s.level) === l);
    }
    if (kelompok) {
      const g = norm(kelompok);
      pool = pool.filter((s) => !s.kelompok || norm(s.kelompok).includes(g));
    }
  
    pool = pool.filter((s) => !excludeIds.has(s.id));
    pool = acakArray(pool);
  
    if (pool.length < jumlah) {
      const snap2 = await getDocs(query(collection(db, COL_BANK), limit(1500)));
      let extra = snap2.docs.map((d) => ({ id: d.id, ...d.data() }));
      if (mapel) {
        const m = norm(mapel);
        extra = extra.filter((s) => {
          const a = norm(s.mapel || s.mataPelajaran);
          return a === m || a.includes(m);
        });
      }
      if (jenjang) {
        extra = extra.filter((s) => !s.jenjang || norm(s.jenjang) === norm(jenjang));
      }
      const ada = new Set(pool.map((s) => s.id));
      for (const s of acakArray(extra)) {
        if (!ada.has(s.id)) {
          pool.push(s);
          ada.add(s.id);
        }
        if (pool.length >= jumlah) break;
      }
    }
    return pool.slice(0, jumlah);
  }
  
  export async function idSoalBaruDipakai(jenjang, batasPaket = 10) {
    const snap = await getDocs(collection(db, COL_PAKET));
    const paket = snap.docs
      .map((d) => ({ id: d.id, ...d.data() }))
      .filter((p) => {
        if (!jenjang) return true;
        const t = String(p.jenjangTemplate || p.jenjang || '').toLowerCase();
        return !t || t === String(jenjang).toLowerCase();
      })
      .sort((a, b) => {
        const ta = (a.createdAt && a.createdAt.toMillis && a.createdAt.toMillis())
          || new Date(a.waktuBuka || 0).getTime()
          || 0;
        const tb = (b.createdAt && b.createdAt.toMillis && b.createdAt.toMillis())
          || new Date(b.waktuBuka || 0).getTime()
          || 0;
        return tb - ta;
      })
      .slice(0, batasPaket);
  
    const ids = new Set();
    for (const p of paket) {
      for (const s of p.daftarSoal || []) {
        if (s.id) ids.add(s.id);
      }
    }
    return ids;
  }
  
  export async function susunSoalDariKomposisi(template, excludeIds) {
    const hasil = [];
    const dipakai = new Set(excludeIds || []);
    for (const baris of template.komposisi || []) {
      // eslint-disable-next-line no-await-in-loop
      const ambil = await ambilSoalDariBank({
        mapel: baris.mapel,
        jenjang: template.jenjang,
        kelas: template.kelas || null,
        bab: baris.bab || null,
        level: baris.level || null,
        jumlah: Number(baris.jumlah) || 10,
        excludeIds: dipakai,
        kelompok: baris.kelompok || template.kelompokBank || null,
      });
      for (const s of ambil) {
        dipakai.add(s.id);
        hasil.push(s);
      }
    }
    return hasil;
  }
  
  export function hitungSlotMingguIni(hariDalamMinggu, jamBuka, durasiMenit) {
    const hari = hariDalamMinggu || [1, 4];
    const jam = jamBuka || '07:00';
    const now = new Date();
    const parts = String(jam).split(':');
    const hh = parseInt(parts[0], 10) || 0;
    const mm = parseInt(parts[1], 10) || 0;
    const day = now.getDay();
    const senin = new Date(now);
    senin.setHours(0, 0, 0, 0);
    const diff = day === 0 ? -6 : 1 - day;
    senin.setDate(senin.getDate() + diff);
  
    const slots = [];
    for (let i = 0; i < hari.length; i += 1) {
      const h = hari[i];
      const offsetDariSenin = h === 0 ? 6 : h - 1;
      const buka = new Date(senin);
      buka.setDate(senin.getDate() + offsetDariSenin);
      buka.setHours(hh, mm, 0, 0);
      const tutupPaket = new Date(buka);
      tutupPaket.setHours(23, 59, 0, 0);
      slots.push({
        hari: h,
        waktuBuka: buka.toISOString(),
        waktuTutup: tutupPaket.toISOString(),
        label: buka.toLocaleDateString('id-ID', {
          weekday: 'long',
          day: 'numeric',
          month: 'short',
        }),
      });
    }
    return slots;
  }
  
  export function ringkasSoalUntukAdmin(daftarSoal) {
    const byMapel = {};
    const list = daftarSoal || [];
    for (let i = 0; i < list.length; i += 1) {
      const s = list[i];
      const m = s.mapel || s.mataPelajaran || 'Lainnya';
      byMapel[m] = (byMapel[m] || 0) + 1;
    }
    return {
      total: list.length,
      perMapel: byMapel,
    };
  }
  
  /**
   * Siapkan DRAF paket (status: draf) - siswa BELUM melihat.
   * Admin wajib terbitkan dulu.
   */
  export async function siapkanDrafDariTemplate(template, slot, rules) {
    const r = rules || {};
    const exclude = await idSoalBaruDipakai(template.jenjang, 10);
    let daftarSoal = await susunSoalDariKomposisi(template, exclude);
    const soalAcak = r.soalAcak !== false && template.soalAcak !== false;
    if (soalAcak) {
      daftarSoal = acakArray(daftarSoal);
    }
  
    if (!daftarSoal.length) {
      return {
        ok: false,
        error: 'Bank soal kosong/tidak cukup untuk "' + template.nama + '"',
      };
    }
  
    const judul = template.nama + ' - ' + slot.label;
    const antiCheat = r.antiCheatAktif !== false && template.antiCheatAktif !== false;
    const kamera = !!(r.wajibKamera != null ? r.wajibKamera : template.wajibKamera);
    const pembahasan = r.tampilkanPembahasan !== false && template.tampilkanPembahasan !== false;
    const modeTimer = r.modeTimer || template.modeTimer || 'total';
    const durasi = Number(r.durasiTotalMenit != null ? r.durasiTotalMenit : template.durasiTotalMenit) || 90;
  
    const payload = {
      judul,
      status: 'draf',
      targetKelas: template.targetKelas || ['Semua'],
      targetKategori: template.targetKategori || ['Semua'],
      daftarSoal,
      totalSoal: daftarSoal.length,
      modeTimer,
      durasiTotalMenit: durasi,
      subtes: [],
      antiCheatAktif: antiCheat,
      wajibKamera: kamera,
      soalAcak,
      tampilkanPembahasan: pembahasan,
      waktuBuka: slot.waktuBuka,
      waktuTutup: slot.waktuTutup,
      otomatis: true,
      templateId: template.id || null,
      jenjangTemplate: template.jenjang || '',
      komposisi: template.komposisi || [],
      rulesSnapshot: {
        soalAcak,
        antiCheatAktif: antiCheat,
        wajibKamera: kamera,
        tampilkanPembahasan: pembahasan,
        modeTimer,
        durasiTotalMenit: durasi,
      },
      ringkas: ringkasSoalUntukAdmin(daftarSoal),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      sumber: 'mesin-otomatis',
    };
  
    const ref = await addDoc(collection(db, COL_PAKET), payload);
    return {
      ok: true,
      id: ref.id,
      judul,
      totalSoal: daftarSoal.length,
      ringkas: payload.ringkas,
      slot,
      status: 'draf',
    };
  }
  
  /** Admin klik TERBITKAN - status aktif, baru muncul di siswa */
  export async function terbitkanDraf(paketId, rulesOverride) {
    const ro = rulesOverride || {};
    const patch = {
      status: 'aktif',
      diterbitkanAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    if (ro.soalAcak !== undefined) patch.soalAcak = !!ro.soalAcak;
    if (ro.antiCheatAktif !== undefined) patch.antiCheatAktif = !!ro.antiCheatAktif;
    if (ro.wajibKamera !== undefined) patch.wajibKamera = !!ro.wajibKamera;
    if (ro.tampilkanPembahasan !== undefined) patch.tampilkanPembahasan = !!ro.tampilkanPembahasan;
    if (ro.durasiTotalMenit !== undefined) patch.durasiTotalMenit = Number(ro.durasiTotalMenit) || 90;
    if (ro.waktuBuka) patch.waktuBuka = ro.waktuBuka;
    if (ro.waktuTutup) patch.waktuTutup = ro.waktuTutup;
  
    await updateDoc(doc(db, COL_PAKET, paketId), patch);
    return { ok: true, id: paketId };
  }
  
  export async function nonaktifkanPaket(paketId) {
    await updateDoc(doc(db, COL_PAKET, paketId), {
      status: 'nonaktif',
      updatedAt: serverTimestamp(),
    });
    return { ok: true };
  }
  
  /**
   * Siapkan draf untuk semua slot minggu ini (skip jika judul sudah ada).
   */
  export async function siapkanDrafMingguIni(template, rules) {
    const r = rules || {};
    const slots = hitungSlotMingguIni(
      template.hariDalamMinggu || [1, 4],
      r.jamBuka || template.jamBuka || '07:00',
      r.durasiTotalMenit || template.durasiTotalMenit || 90
    );
    const existing = await getDocs(collection(db, COL_PAKET));
    const byJudul = new Map();
    existing.docs.forEach((d) => {
      byJudul.set(d.data().judul, { id: d.id, ...d.data() });
    });
  
    const hasil = [];
    for (let i = 0; i < slots.length; i += 1) {
      const slot = slots[i];
      const judul = template.nama + ' - ' + slot.label;
      const ada = byJudul.get(judul);
      if (ada) {
        hasil.push({
          ok: true,
          skipped: true,
          judul,
          id: ada.id,
          status: ada.status,
          alasan: 'sudah ada (' + ada.status + ')',
        });
        // eslint-disable-next-line no-continue
        continue;
      }
      if (new Date(slot.waktuTutup) < new Date(Date.now() - 24 * 3600 * 1000)) {
        hasil.push({
          ok: true,
          skipped: true,
          judul,
          alasan: 'slot sudah lewat',
        });
        // eslint-disable-next-line no-continue
        continue;
      }
      // eslint-disable-next-line no-await-in-loop
      const res = await siapkanDrafDariTemplate(template, slot, r);
      hasil.push(res);
    }
    return hasil;
  }
  
  
  /** Alias kompatibilitas (nama lama di beberapa deploy) */
  export async function generateMingguIniUntukTemplate(template, rules) {
    return siapkanDrafMingguIni(template, rules);
  }
  
  /** Alias: generate paket langsung (draf) untuk satu slot */
  export async function generatePaketDariTemplate(template, slot, rules) {
    return siapkanDrafDariTemplate(template, slot, rules);
  }
  
  export const DEFAULT_TEMPLATE_SMA = {
    nama: 'Try Out Otomatis SMA',
    jenjang: 'SMA',
    kelas: '12',
    targetKelas: ['Semua'],
    targetKategori: ['Semua'],
    komposisi: [
      { mapel: 'Bahasa Inggris', jumlah: 30 },
      { mapel: 'Bahasa Indonesia', jumlah: 20 },
      { mapel: 'Matematika', jumlah: 15 },
    ],
    hariDalamMinggu: [1, 4],
    jamBuka: '07:00',
    durasiTotalMenit: 90,
    modeTimer: 'total',
    antiCheatAktif: true,
    wajibKamera: false,
    soalAcak: true,
    tampilkanPembahasan: true,
    aktif: true,
  };
  
  export default {
    ambilSoalDariBank,
    susunSoalDariKomposisi,
    siapkanDrafDariTemplate,
    siapkanDrafMingguIni,
    terbitkanDraf,
    nonaktifkanPaket,
    hitungSlotMingguIni,
    ringkasSoalUntukAdmin,
    DEFAULT_TEMPLATE_SMA,
  };
  