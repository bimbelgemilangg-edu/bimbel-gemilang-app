// Antrean ringan sisi-klien untuk aksi live yang aman diulang.
// Dipakai hanya sebagai fallback UX; Firestore tetap menjadi sumber kebenaran.

const KEY = 'gemilang:live-outbox:v1';

function baca() {
  try {
    const raw = localStorage.getItem(KEY);
    const data = raw ? JSON.parse(raw) : [];
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

function tulis(items) {
  try {
    localStorage.setItem(KEY, JSON.stringify(items.slice(-80)));
  } catch {
    // Jika storage penuh/dimatikan, Firestore SDK tetap menangani cache-nya sendiri.
  }
}

export function listLiveActions(sesiId) {
  return baca().filter((item) => item.sesiId === sesiId);
}

export function queueLiveAction(sesiId, kind, payload) {
  const items = baca();
  const key = kind === 'answer'
    ? `${sesiId}:answer:${payload.siswaId}:${payload.soalIdx}`
    : `${sesiId}:${kind}:${payload.eventId || payload.siswaId || Date.now()}`;
  const item = { key, sesiId, kind, payload, queuedAt: Date.now() };
  const next = items.filter((x) => x.key !== key);
  next.push(item);
  tulis(next);
  return item;
}

export function removeLiveAction(key) {
  tulis(baca().filter((item) => item.key !== key));
}

export async function flushLiveActions(sesiId, handler) {
  const items = listLiveActions(sesiId);
  const synced = [];
  for (const item of items) {
    try {
      await handler(item);
      synced.push(item.key);
    } catch {
      // Berhenti pada kegagalan pertama agar urutan aksi tetap aman.
      break;
    }
  }
  if (synced.length) tulis(baca().filter((item) => !synced.includes(item.key)));
  return { synced, remaining: items.length - synced.length };
}

export function countLiveActions(sesiId) {
  return listLiveActions(sesiId).length;
}
