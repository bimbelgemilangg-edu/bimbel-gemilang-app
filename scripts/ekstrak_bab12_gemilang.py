import json
import os

repo_dir = '/Users/macbook/.gemini/antigravity/scratch/bimbel-gemilang-app'
out_dir = os.path.join(repo_dir, 'public/ekstraksi-buku')
os.makedirs(out_dir, exist_ok=True)

soal_list = [
    {
        'nomor': 21,
        'tipe': 'pg_sederhana',
        'tingkatKelas': '8',
        'jenjang': 'SMP',
        'mapel': 'bahasa_inggris',
        'materi': 'Notice, Warning, or Caution',
        'bacaan': {
            'grup': 'eco_park_notice_board',
            'teks': 'Observe the Eco-Park Notice Board illustration below for questions number 21 to 25!\n{{GAMBAR}}\nAdditional Notice at the Gate: "Free drinking water refill stations are available near the main gate. Visitors who litter will be fined Rp50.000."',
            'gambar': ['/soal/bahasa-inggris/bab12_ecopark_notice.jpg']
        },
        'teks_soal': 'Based on the notice board in the picture, what are visitors prohibited from bringing into the Eco-Park?',
        'opsi_jawaban': [
            {'label': 'A', 'teks': 'Reusable tumblers'},
            {'label': 'B', 'teks': 'Bicycles'},
            {'label': 'C', 'teks': 'Single-use plastic bottles'},
            {'label': 'D', 'teks': 'Backpacks'}
        ],
        'kunci_jawaban': 'C',
        'pembahasan': 'Pada papan peraturan tercantum tanda larangan bergambar botol dan tulisan: "NO PLASTIC BOTTLES" (botol plastik sekali pakai).',
        'status': 'aktif'
    },
    {
        'nomor': 22,
        'tipe': 'pg_sederhana',
        'tingkatKelas': '8',
        'jenjang': 'SMP',
        'mapel': 'bahasa_inggris',
        'materi': 'Notice, Warning, or Caution',
        'bacaan': {
            'grup': 'eco_park_notice_board',
            'teks': 'Observe the Eco-Park Notice Board illustration below for questions number 21 to 25!\n{{GAMBAR}}\nAdditional Notice at the Gate: "Free drinking water refill stations are available near the main gate. Visitors who litter will be fined Rp50.000."',
            'gambar': ['/soal/bahasa-inggris/bab12_ecopark_notice.jpg']
        },
        'teks_soal': 'Where are visitors allowed to ride their bicycles according to the sign?',
        'opsi_jawaban': [
            {'label': 'A', 'teks': 'Anywhere on the grass lawn'},
            {'label': 'B', 'teks': 'Only on the designated bicycle lane'},
            {'label': 'C', 'teks': 'Inside the park administration office'},
            {'label': 'D', 'teks': 'On the pedestrian sidewalk among crowds'}
        ],
        'kunci_jawaban': 'B',
        'pembahasan': 'Aturan ketiga pada papan menyatakan secara spesifik: "BICYCLES ONLY ON DESIGNATED LANE" (hanya di jalur sepeda yang ditentukan).',
        'status': 'aktif'
    },
    {
        'nomor': 23,
        'tipe': 'pg_kompleks',
        'tingkatKelas': '8',
        'jenjang': 'SMP',
        'mapel': 'bahasa_inggris',
        'materi': 'Notice, Warning, or Caution',
        'bacaan': {
            'grup': 'eco_park_notice_board',
            'teks': 'Observe the Eco-Park Notice Board illustration below for questions number 21 to 25!\n{{GAMBAR}}\nAdditional Notice at the Gate: "Free drinking water refill stations are available near the main gate. Visitors who litter will be fined Rp50.000."',
            'gambar': ['/soal/bahasa-inggris/bab12_ecopark_notice.jpg']
        },
        'teks_soal': '[Pilihan Ganda Kompleks — Pilih Lebih dari Satu!]\nWhich actions are obedient to the Eco-Park rules? (Choose TWO correct answers)',
        'opsi_jawaban': [
            {'label': 'A', 'teks': 'Throwing snack wrappers into the designated trash can.'},
            {'label': 'B', 'teks': 'Bringing a refillable stainless steel tumbler for drinking.'},
            {'label': 'C', 'teks': 'Riding a bicycle carelessly across the flower gardens.'},
            {'label': 'D', 'teks': 'Leaving single-use plastic bottles on the wooden benches.'}
        ],
        'kunci_jawaban': 'A,B',
        'pembahasan': 'Pilihan A mematuhi "KEEP THE PARK CLEAN" dan B mematuhi larangan botol plastik dengan membawa tumbler isi ulang. Pilihan C dan D melanggar aturan taman.',
        'status': 'aktif'
    },
    {
        'nomor': 24,
        'tipe': 'benar_salah',
        'tingkatKelas': '8',
        'jenjang': 'SMP',
        'mapel': 'bahasa_inggris',
        'materi': 'Notice, Warning, or Caution',
        'bacaan': {
            'grup': 'eco_park_notice_board',
            'teks': 'Observe the Eco-Park Notice Board illustration below for questions number 21 to 25!\n{{GAMBAR}}\nAdditional Notice at the Gate: "Free drinking water refill stations are available near the main gate. Visitors who litter will be fined Rp50.000."',
            'gambar': ['/soal/bahasa-inggris/bab12_ecopark_notice.jpg']
        },
        'teks_soal': '[Tabel Benar / Salah (True or False)] Read the statements based on the notice board and give a tick in the True or False column!',
        'pernyataan': [
            {'teks': 'Visitors who throw trash carelessly on the ground will have to pay a fine of Rp50.000.', 'jawaban': 'B'},
            {'teks': 'The notice board above is placed inside a hospital operating room.', 'jawaban': 'S'},
            {'teks': 'Visitors can refill their reusable drinking bottles for free near the main gate.', 'jawaban': 'B'}
        ],
        'kunci_jawaban': 'B,S,B',
        'pembahasan': '(a) True: denda buang sampah sembarangan adalah Rp50.000. (b) False: papan berada di gerbang taman (Eco-Park), bukan kamar operasi rumah sakit. (c) True: tersedia stasiun isi ulang air minum gratis di dekat gerbang.',
        'status': 'aktif'
    },
    {
        'nomor': 25,
        'tipe': 'pg_sederhana',
        'tingkatKelas': '8',
        'jenjang': 'SMP',
        'mapel': 'bahasa_inggris',
        'materi': 'Notice, Warning, or Caution',
        'bacaan': {
            'grup': 'eco_park_notice_board',
            'teks': 'Observe the Eco-Park Notice Board illustration below for questions number 21 to 25!\n{{GAMBAR}}\nAdditional Notice at the Gate: "Free drinking water refill stations are available near the main gate. Visitors who litter will be fined Rp50.000."',
            'gambar': ['/soal/bahasa-inggris/bab12_ecopark_notice.jpg']
        },
        'teks_soal': 'Why does the Eco-Park management put up the sign "NO PLASTIC BOTTLES"?',
        'opsi_jawaban': [
            {'label': 'A', 'teks': 'To make visitors thirsty during their walk.'},
            {'label': 'B', 'teks': 'To sell more plastic bags at the gate.'},
            {'label': 'C', 'teks': 'To reduce plastic waste and protect the environment.'},
            {'label': 'D', 'teks': 'To forbid students from exercising.'}
        ],
        'kunci_jawaban': 'C',
        'pembahasan': 'Tujuan peraturan larangan botol plastik adalah untuk mengurangi sampah plastik dan melestarikan lingkungan alam di taman (to reduce plastic waste and protect the environment).',
        'status': 'aktif'
    },
    {
        'nomor': 26,
        'tipe': 'pg_sederhana',
        'tingkatKelas': '8',
        'jenjang': 'SMP',
        'mapel': 'bahasa_inggris',
        'materi': 'Notice, Warning, or Caution',
        'bacaan': {
            'grup': 'comparing_notices_lab',
            'teks': 'Compare the two digital warning notices below for questions number 26 to 30!\n\n• NOTICE 1 (At the School Computer Lab): "CAUTION: DO NOT CLICK UNKNOWN LINKS OR SHARE YOUR PASSWORD. LOG OUT OF YOUR ACCOUNT BEFORE LEAVING THE COMPUTER."\n• NOTICE 2 (At the Science Laboratory): "WARNING: CORROSIVE CHEMICALS. WEAR GLOVES AND SAFETY GOGGLES AT ALL TIMES. WASH HANDS THOROUGHLY AFTER EXPERIMENT."'
        },
        'teks_soal': '[Membandingkan Dua Notice] How do Notice 1 and Notice 2 differ in their safety focus?',
        'opsi_jawaban': [
            {'label': 'A', 'teks': 'Notice 1 focuses on cybersecurity and data privacy, while Notice 2 focuses on physical safety from hazardous chemicals.'},
            {'label': 'B', 'teks': 'Notice 1 is found at a swimming pool, while Notice 2 is found at a library.'},
            {'label': 'C', 'teks': 'Both notices tell students to share their passwords with strangers.'},
            {'label': 'D', 'teks': 'Notice 1 is for chemistry teachers, while Notice 2 is for computer programmers.'}
        ],
        'kunci_jawaban': 'A',
        'pembahasan': 'Notice 1 berfokus pada keamanan digital (cybersecurity) di lab komputer, sedangkan Notice 2 berfokus pada keselamatan fisik dari zat kimia korosif di lab sains.',
        'status': 'aktif'
    },
    {
        'nomor': 27,
        'tipe': 'pg_sederhana',
        'tingkatKelas': '8',
        'jenjang': 'SMP',
        'mapel': 'bahasa_inggris',
        'materi': 'Notice, Warning, or Caution',
        'bacaan': {
            'grup': 'comparing_notices_lab',
            'teks': 'Compare the two digital warning notices below for questions number 26 to 30!\n\n• NOTICE 1 (At the School Computer Lab): "CAUTION: DO NOT CLICK UNKNOWN LINKS OR SHARE YOUR PASSWORD. LOG OUT OF YOUR ACCOUNT BEFORE LEAVING THE COMPUTER."\n• NOTICE 2 (At the Science Laboratory): "WARNING: CORROSIVE CHEMICALS. WEAR GLOVES AND SAFETY GOGGLES AT ALL TIMES. WASH HANDS THOROUGHLY AFTER EXPERIMENT."'
        },
        'teks_soal': 'What might happen if a student ignores Notice 1 and forgets to log out of a public computer?',
        'opsi_jawaban': [
            {'label': 'A', 'teks': 'The computer screen will melt from chemicals.'},
            {'label': 'B', 'teks': 'Another person might access and misuse the student’s personal account.'},
            {'label': 'C', 'teks': 'The student will get a free laptop from the school.'},
            {'label': 'D', 'teks': 'The internet connection will become faster.'}
        ],
        'kunci_jawaban': 'B',
        'pembahasan': 'Jika lupa keluar (log out) dari komputer umum, akun siswa rawan disalahgunakan atau diakses oleh pengguna lain.',
        'status': 'aktif'
    },
    {
        'nomor': 28,
        'tipe': 'pg_sederhana',
        'tingkatKelas': '8',
        'jenjang': 'SMP',
        'mapel': 'bahasa_inggris',
        'materi': 'Notice, Warning, or Caution',
        'bacaan': {
            'grup': 'comparing_notices_lab',
            'teks': 'Compare the two digital warning notices below for questions number 26 to 30!\n\n• NOTICE 1 (At the School Computer Lab): "CAUTION: DO NOT CLICK UNKNOWN LINKS OR SHARE YOUR PASSWORD. LOG OUT OF YOUR ACCOUNT BEFORE LEAVING THE COMPUTER."\n• NOTICE 2 (At the Science Laboratory): "WARNING: CORROSIVE CHEMICALS. WEAR GLOVES AND SAFETY GOGGLES AT ALL TIMES. WASH HANDS THOROUGHLY AFTER EXPERIMENT."'
        },
        'teks_soal': 'In Notice 2, the word "corrosive" is closest in meaning to ....',
        'opsi_jawaban': [
            {'label': 'A', 'teks': 'safe and sweet to drink'},
            {'label': 'B', 'teks': 'cold and refreshing'},
            {'label': 'C', 'teks': 'able to damage or burn skin and materials'},
            {'label': 'D', 'teks': 'very cheap and easy to find'}
        ],
        'kunci_jawaban': 'C',
        'pembahasan': 'Kata "corrosive" berarti zat yang bersifat merusak, mengikis, atau melukai kulit dan benda (able to damage or burn skin and materials).',
        'status': 'aktif'
    },
    {
        'nomor': 29,
        'tipe': 'pg_kompleks',
        'tingkatKelas': '8',
        'jenjang': 'SMP',
        'mapel': 'bahasa_inggris',
        'materi': 'Notice, Warning, or Caution',
        'bacaan': {
            'grup': 'comparing_notices_lab',
            'teks': 'Compare the two digital warning notices below for questions number 26 to 30!\n\n• NOTICE 1 (At the School Computer Lab): "CAUTION: DO NOT CLICK UNKNOWN LINKS OR SHARE YOUR PASSWORD. LOG OUT OF YOUR ACCOUNT BEFORE LEAVING THE COMPUTER."\n• NOTICE 2 (At the Science Laboratory): "WARNING: CORROSIVE CHEMICALS. WEAR GLOVES AND SAFETY GOGGLES AT ALL TIMES. WASH HANDS THOROUGHLY AFTER EXPERIMENT."'
        },
        'teks_soal': '[Pilihan Ganda Kompleks — Pilih Lebih dari Satu!]\nWhat must students do according to Notice 2? (Choose TWO correct answers)',
        'opsi_jawaban': [
            {'label': 'A', 'teks': 'Wear protective gloves and safety goggles during the experiment.'},
            {'label': 'B', 'teks': 'Wash their hands thoroughly after finishing the experiment.'},
            {'label': 'C', 'teks': 'Taste the chemicals with a spoon.'},
            {'label': 'D', 'teks': 'Share their email password on the whiteboard.'}
        ],
        'kunci_jawaban': 'A,B',
        'pembahasan': 'Notice 2 memerintahkan dua hal: memakai sarung tangan & kacamata pelindung (A) serta mencuci tangan hingga bersih setelah percobaan (B).',
        'status': 'aktif'
    },
    {
        'nomor': 30,
        'tipe': 'pg_sederhana',
        'tingkatKelas': '8',
        'jenjang': 'SMP',
        'mapel': 'bahasa_inggris',
        'materi': 'Notice, Warning, or Caution',
        'bacaan': {
            'grup': 'comparing_notices_lab',
            'teks': 'Compare the two digital warning notices below for questions number 26 to 30!\n\n• NOTICE 1 (At the School Computer Lab): "CAUTION: DO NOT CLICK UNKNOWN LINKS OR SHARE YOUR PASSWORD. LOG OUT OF YOUR ACCOUNT BEFORE LEAVING THE COMPUTER."\n• NOTICE 2 (At the Science Laboratory): "WARNING: CORROSIVE CHEMICALS. WEAR GLOVES AND SAFETY GOGGLES AT ALL TIMES. WASH HANDS THOROUGHLY AFTER EXPERIMENT."'
        },
        'teks_soal': 'Who is the target audience of both Notice 1 and Notice 2?',
        'opsi_jawaban': [
            {'label': 'A', 'teks': 'Toddlers in a playground'},
            {'label': 'B', 'teks': 'Bus drivers on the highway'},
            {'label': 'C', 'teks': 'Students and teachers using the school laboratories'},
            {'label': 'D', 'teks': 'Tourists at the beach'}
        ],
        'kunci_jawaban': 'C',
        'pembahasan': 'Kedua notice ditujukan bagi warga sekolah (siswa & guru) yang beraktivitas di laboratorium komputer maupun laboratorium IPA.',
        'status': 'aktif'
    }
]

# 1. Output JSON
json_path = os.path.join(out_dir, 'bab12_notice_warning.json')
with open(json_path, 'w', encoding='utf-8') as f:
    json.dump(soal_list, f, indent=2, ensure_ascii=False)
print('JSON saved:', json_path, 'with', len(soal_list), 'soal')

# 2. Output HTML Master
html_path = os.path.join(out_dir, 'bab12_notice_warning.html')
html_articles = []
for s in soal_list:
    opsi_html = ''
    if s.get('opsi_jawaban'):
        items = []
        for o in s['opsi_jawaban']:
            lbl = o['label']
            tk = o['teks']
            items.append(f'<li data-option="{lbl}">{tk}</li>')
        opsi_html = f'<ul data-field="opsi_jawaban">{"".join(items)}</ul>'
    
    pernyataan_html = ''
    if s.get('pernyataan'):
        tf_items = []
        for p in s['pernyataan']:
            jw = p['jawaban']
            tk = p['teks']
            tf_items.append(f'<li data-jawaban="{jw}">{tk}</li>')
        pernyataan_html = f'<ul data-field="pernyataan">{"".join(tf_items)}</ul>'

    bacaan_html = ''
    if s.get('bacaan'):
        grp = s['bacaan'].get('grup', '')
        b_txt = s['bacaan']['teks']
        b_img = ''
        if s['bacaan'].get('gambar'):
            b_img = ''.join([f'<img src="{im}" alt="Stimulus" />' for im in s['bacaan']['gambar']])
        bacaan_html = f'<div data-field="bacaan" data-grup="{grp}">{b_txt}{b_img}</div>'

    num = s['nomor']
    tp = s['tipe']
    jj = s['jenjang']
    kl = s['tingkatKelas']
    mt = s['materi']
    soal_t = s['teks_soal']
    kj = s['kunci_jawaban']
    pb = s['pembahasan']

    article = f'''<article data-gemilang-question data-nomor="{num}" data-tipe="{tp}" data-kelas="{kl}" data-mapel="Bahasa Inggris" data-jenjang="{jj}" data-paket="Bab 12 - Notice, Warning & Caution" data-kesulitan="sedang" data-kunci="{kj}">
  <div data-field="jenjang">{jj}</div>
  <div data-field="kelas">{kl}</div>
  <div data-field="mata_pelajaran">Bahasa Inggris</div>
  <div data-field="materi">{mt}</div>
  <div data-field="tags">Bahasa Inggris, SMP, Kelas 8, Fase D, Notice, Visual, Kurikulum Merdeka</div>
  <div data-field="capaian_pembelajaran">Menganalisis dan menafsirkan informasi visual serta teks multimodal pada papan peringatan (notice, warning, caution) di lingkungan sekolah dan publik sesuai CP Fase D.</div>
  {bacaan_html}
  <div data-field="teks_soal">{soal_t}</div>
  {opsi_html}
  {pernyataan_html}
  <div data-field="kunci_jawaban">{kj}</div>
  <div data-field="pembahasan">{pb}</div>
</article>'''
    html_articles.append(article)

full_html = f'''<!doctype html>
<html lang="id">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <title>Gemilang - Bab 12 Notice & Warning</title>
</head>
<body>
{''.join(html_articles)}
</body>
</html>'''

with open(html_path, 'w', encoding='utf-8') as f:
    f.write(full_html)
print('HTML Master saved:', html_path)

# 3. Output Templat Baris gemilang-baris@1
txt_path = os.path.join(out_dir, 'bab12_notice_warning.txt')
lines = ['SKEMA: gemilang-baris@1', 'JUDUL PAKET: Bahasa Inggris SMP Bab 12 - Notice, Warning & Caution\n']

for s in soal_list:
    lines.append(f'##SOAL {s["nomor"]}')
    lines.append(f'TIPE: {s["tipe"]}')
    lines.append(f'KELAS: {s["tingkatKelas"]}')
    lines.append(f'MATERI: {s["materi"]}')
    lines.append(f'KUNCI: {s["kunci_jawaban"]}')
    if s.get('bacaan'):
        lines.append(f'GRUP-BACAAN: {s["bacaan"].get("grup", "")}')
        lines.append('BACAAN:')
        lines.append(s['bacaan']['teks'])
    lines.append('TEKS:')
    lines.append(s['teks_soal'])
    if s.get('opsi_jawaban'):
        lines.append('OPSI:')
        for o in s['opsi_jawaban']:
            lines.append(f'- {o["teks"]}')
    if s.get('pernyataan'):
        lines.append('PERNYATAAN:')
        for p in s['pernyataan']:
            lines.append(f'- {p["teks"]}')
    lines.append('PEMBAHASAN:')
    lines.append(s['pembahasan'])
    lines.append('')

with open(txt_path, 'w', encoding='utf-8') as f:
    f.write('\n'.join(lines))
print('Templat baris saved:', txt_path)
