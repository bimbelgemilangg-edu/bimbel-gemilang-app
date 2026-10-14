#!/usr/bin/env python3
# Pecah sprite maskot astronot 6x5 (asset owner) jadi 30 file PNG UTUH,
# satu per mapel, TANPA crop potong-kepala: tiap maskot dideteksi sebagai
# komponen terhubung (baris/kolom sprite ternyata saling menyentuh sedikit),
# gelembung/atribut lepas ditempelkan ke maskot terdekat, lalu latar
# dekat-putih dinormalkan ke putih murni supaya mulus di stiker putih UI.
# Dipakai SEKALI saat commit desain v3; hasilnya di public/mascot/mapel/.
import os
from collections import deque
from PIL import Image

SRC = 'public/mascot/mascot-mapel.png'
OUT = 'public/mascot/mapel'
SLUG = [
    'pendidikan-agama', 'pendidikan-pancasila', 'bahasa-indonesia', 'matematika', 'ipa', 'ips',
    'pjok', 'seni-budaya', 'bahasa-inggris', 'muatan-lokal', 'koding-ka', 'bahasa-arab',
    'fisika', 'kimia', 'biologi', 'matematika-lanjut', 'informatika', 'ekonomi',
    'sosiologi', 'geografi', 'sejarah', 'antropologi', 'bahasa-indonesia-lanjut', 'bahasa-inggris-lanjut',
    'bahasa-jerman', 'bahasa-prancis', 'bahasa-jepang', 'bahasa-korea', 'bahasa-mandarin', 'produk-kreatif',
]
KOLOM, BARIS = 6, 5
TOL_INK = 22      # selisih min-channel vs latar -> dianggap isi
AREA_MIN = 150    # komponen lebih kecil debu, buang
GABUNG_JARAK = 16  # bbox berdekatan <= ini -> satu maskot (gelembung/atribut)
PAD = 2

im = Image.open(SRC).convert('RGB')
W, H = im.size
px = im.load()
ink = bytearray(W * H)
for y in range(H):
    row = y * W
    for x in range(W):
        p = px[x, y]
        if 253 - min(p) >= TOL_INK or max(abs(p[0] - 253), abs(p[1] - 253), abs(p[2] - 253)) > TOL_INK:
            ink[row + x] = 1

label = [-1] * (W * H)
komponen = []  # {area, minx,...}
for start in range(W * H):
    if ink[start] == 0 or label[start] >= 0:
        continue
    idx = len(komponen)
    comp = {'area': 0, 'minx': W, 'miny': H, 'maxx': 0, 'maxy': 0, 'px': []}
    q = deque([start])
    label[start] = idx
    while q:
        cur = q.popleft()
        cx, cy = cur % W, cur // W
        comp['area'] += 1
        comp['px'].append(cur)
        if cx < comp['minx']: comp['minx'] = cx
        if cx > comp['maxx']: comp['maxx'] = cx
        if cy < comp['miny']: comp['miny'] = cy
        if cy > comp['maxy']: comp['maxy'] = cy
        for nx, ny in ((cx - 1, cy), (cx + 1, cy), (cx, cy - 1), (cx, cy + 1)):
            if 0 <= nx < W and 0 <= ny < H:
                n = ny * W + nx
                if ink[n] and label[n] < 0:
                    label[n] = idx
                    q.append(n)
    komponen.append(comp)

besar = [c for c in komponen if c['area'] >= AREA_MIN]
print('komponen total:', len(komponen), '| >= area min:', len(besar))

AREA_ANCHOR = 9000   # komponen >= ini = maskot+papan (jangan digabung sesama anchor)
JARAK_ATTR = 90      # atribut lepas (gelembung dll) maksimal sejauh ini ke maskotnya

def bbox_of(grp):
    return {'minx': min(c['minx'] for c in grp), 'maxx': max(c['maxx'] for c in grp),
            'miny': min(c['miny'] for c in grp), 'maxy': max(c['maxy'] for c in grp)}

def jarak_bbox(a, b):
    dx = max(0, max(a['minx'], b['minx']) - min(a['maxx'], b['maxx']))
    dy = max(0, max(a['miny'], b['miny']) - min(a['maxy'], b['maxy']))
    return (dx * dx + dy * dy) ** 0.5

anchor = [[c] for c in besar if c['area'] >= AREA_ANCHOR]
attr = [c for c in besar if c['area'] < AREA_ANCHOR]
for a in attr:
    ba = bbox_of([a])
    terdekat, jmin = None, 1e9
    for g in anchor:
        j = jarak_bbox(ba, bbox_of(g))
        if j < jmin:
            jmin, terdekat = j, g
    if terdekat is not None and jmin <= JARAK_ATTR:
        terdekat.append(a)

# anchor satu slot ganda (maskot terbelah dua komponen) -> satukan
slot_grup = {}
for g in anchor:
    b = bbox_of(g)
    cx, cy = (b['minx'] + b['maxx']) / 2, (b['miny'] + b['maxy']) / 2
    kol = min(KOLOM - 1, max(0, round(cx / (W / KOLOM) - 0.5)))
    bar = min(BARIS - 1, max(0, round(cy / (H / BARIS) - 0.5)))
    slot_grup.setdefault(bar * KOLOM + kol, []).append(g)
print('anchor:', len(anchor), '| slot terisi:', len(slot_grup))

grup = []
for slot, daftar in slot_grup.items():
    gab = [c for g in daftar for c in g]
    b = bbox_of(gab)
    cx, cy = (b['minx'] + b['maxx']) / 2, (b['miny'] + b['maxy']) / 2
    kol = min(KOLOM - 1, max(0, round(cx / (W / KOLOM) - 0.5)))
    bar = min(BARIS - 1, max(0, round(cy / (H / BARIS) - 0.5)))
    grup.append({'slot': slot, 'bbox': (b['minx'], b['miny'], b['maxx'], b['maxy']),
                 'setpx': set(p2 for c in gab for p2 in c['px'])})
grup.sort(key=lambda h: h['slot'])

os.makedirs(OUT, exist_ok=True)
hasil = grup
for i, slug in enumerate(SLUG):
    cand = [h for h in hasil if h['slot'] == i]
    if not cand:
        print(f'{slug:28s} SLOT KOSONG!')
        continue
    h = cand[0]
    minx, miny, maxx, maxy = h['bbox']
    minx = max(0, minx - PAD); miny = max(0, miny - PAD)
    maxx = min(W - 1, maxx + PAD); maxy = min(H - 1, maxy + PAD)
    sel = im.crop((minx, miny, maxx + 1, maxy + 1)).copy()
    sp = sel.load()
    milik = h['setpx']
    ox, oy = minx, miny
    for y in range(sel.height):
        for x in range(sel.width):
            gx, gy = ox + x, oy + y
            p = sp[x, y]
            latar = max(abs(p[0] - 253), abs(p[1] - 253), abs(p[2] - 253)) <= TOL_INK and 253 - min(p) < TOL_INK
            if latar:
                sp[x, y] = (255, 255, 255)
            elif (gy * W + gx) not in milik:
                # isi milik tetangga yang nyelonong ke bbox kita -> bersihkan
                sp[x, y] = (255, 255, 255)
    sel.save(f'{OUT}/{slug}.png', optimize=True)
    print(f'{slug:28s} {sel.width:4d}x{sel.height:<4d} slot={i} area={len(milik)}')
