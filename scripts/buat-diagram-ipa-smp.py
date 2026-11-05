# scripts/buat-diagram-ipa-smp.py
# Generator diagram SVG anatomis asli materi IPA Reproduksi & Perkembangbiakan SMP Kelas 9 Kurikulum Merdeka
import os

os.makedirs('public/soal-smp', exist_ok=True)

# 1. Anatomi Sistem Reproduksi Pria
svg_pria = '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 650 420" width="100%" height="100%" style="background:#ffffff; font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <defs>
    <linearGradient id="bgGrad" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#f8fafc"/>
      <stop offset="100%" stop-color="#f1f5f9"/>
    </linearGradient>
    <filter id="shadow" x="-5%" y="-5%" width="110%" height="110%">
      <feDropShadow dx="1" dy="2" stdDeviation="2" flood-opacity="0.15"/>
    </filter>
    <marker id="arrow" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
      <path d="M 0 0 L 10 5 L 0 10 z" fill="#334155"/>
    </marker>
  </defs>

  <rect width="650" height="420" fill="url(#bgGrad)" rx="12" stroke="#e2e8f0" stroke-width="2"/>
  <text x="325" y="28" text-anchor="middle" font-size="15" font-weight="bold" fill="#0f172a">STRUKTUR ORGAN REPRODUKSI PRIA (PENAMPANG SAGITAL)</text>
  <text x="325" y="44" text-anchor="middle" font-size="11" fill="#64748b">Asesmen Kurikulum Merdeka Fase D — IPA Kelas 9 SMP</text>

  <!-- Kandung Kemih (Vesica Urinaria) -->
  <path d="M 270 120 C 270 80, 360 80, 360 130 C 360 170, 320 180, 290 175 C 270 170, 260 150, 270 120 Z" fill="#fed7aa" stroke="#ea580c" stroke-width="2"/>
  <text x="315" y="130" font-size="10.5" fill="#9a3412" font-weight="600" text-anchor="middle">Kandung Kemih</text>

  <!-- Tulang Kemaluan (Pubis) -->
  <path d="M 200 170 Q 220 160 230 185 Q 220 205 195 195 Z" fill="#cbd5e1" stroke="#64748b" stroke-width="2"/>
  <text x="210" y="185" font-size="9" fill="#334155" text-anchor="middle">S. Pubis</text>

  <!-- Vesikula Seminalis -->
  <path d="M 365 140 C 385 130, 395 150, 385 165 C 375 175, 360 170, 365 140 Z" fill="#fef08a" stroke="#ca8a04" stroke-width="2"/>

  <!-- Kelenjar Prostat -->
  <path d="M 310 175 C 340 175, 355 195, 345 220 C 330 230, 305 225, 295 205 C 290 190, 300 175, 310 175 Z" fill="#fbcfe8" stroke="#db2777" stroke-width="2"/>

  <!-- Kelenjar Cowper (Bulbouretra) -->
  <circle cx="315" cy="235" r="7" fill="#bfdbfe" stroke="#2563eb" stroke-width="1.8"/>

  <!-- Skrotum -->
  <path d="M 230 290 C 210 320, 215 375, 265 380 C 315 385, 335 340, 315 295 C 295 285, 255 280, 230 290 Z" fill="#ffedd5" stroke="#f97316" stroke-width="2"/>

  <!-- Testis -->
  <ellipse cx="270" cy="335" rx="30" ry="24" fill="#fed7aa" stroke="#ea580c" stroke-width="2.2"/>

  <!-- Epididimis -->
  <path d="M 243 318 C 240 300, 275 300, 292 315 C 305 328, 303 355, 294 365" fill="none" stroke="#dc2626" stroke-width="4.5" stroke-linecap="round"/>

  <!-- Vas Deferens -->
  <path d="M 292 360 C 320 350, 330 270, 335 240 C 340 210, 370 190, 380 180 C 390 170, 395 140, 370 115 C 345 90, 290 100, 270 135 C 260 150, 265 190, 290 200 C 300 205, 315 205, 318 215 L 318 230 L 312 250 C 305 265, 280 275, 240 290 L 160 300" fill="none" stroke="#2563eb" stroke-width="2.5" stroke-dasharray="4,2"/>

  <!-- Penis & Uretra -->
  <path d="M 215 195 C 220 220, 230 260, 240 280 L 175 315 C 160 322, 140 305, 145 290 L 190 205 Z" fill="#ffe4e6" stroke="#e11d48" stroke-width="2"/>
  <path d="M 315 185 L 315 235 L 305 255 L 235 288 L 155 320" fill="none" stroke="#0284c7" stroke-width="2.8"/>

  <!-- Label 1: Testis -->
  <g filter="url(#shadow)">
    <circle cx="95" cy="360" r="14" fill="#ea580c"/>
    <text x="95" y="365" fill="#fff" font-weight="bold" font-size="13" text-anchor="middle">1</text>
  </g>
  <line x1="115" y1="360" x2="245" y2="340" stroke="#334155" stroke-width="1.6" marker-end="url(#arrow)"/>
  <text x="95" y="390" font-size="11.5" font-weight="700" fill="#9a3412" text-anchor="middle">(1) Testis</text>

  <!-- Label 2: Epididimis -->
  <g filter="url(#shadow)">
    <circle cx="390" cy="355" r="14" fill="#dc2626"/>
    <text x="390" y="360" fill="#fff" font-weight="bold" font-size="13" text-anchor="middle">2</text>
  </g>
  <line x1="375" y1="355" x2="305" y2="345" stroke="#334155" stroke-width="1.6" marker-end="url(#arrow)"/>
  <text x="445" y="360" font-size="11.5" font-weight="700" fill="#991b1b">(2) Epididimis</text>

  <!-- Label 3: Vas Deferens -->
  <g filter="url(#shadow)">
    <circle cx="490" cy="265" r="14" fill="#2563eb"/>
    <text x="490" y="270" fill="#fff" font-weight="bold" font-size="13" text-anchor="middle">3</text>
  </g>
  <line x1="475" y1="265" x2="345" y2="255" stroke="#334155" stroke-width="1.6" marker-end="url(#arrow)"/>
  <text x="510" y="270" font-size="11.5" font-weight="700" fill="#1e40af">(3) Vas Deferens</text>

  <!-- Label 4: Vesikula Seminalis -->
  <g filter="url(#shadow)">
    <circle cx="510" cy="145" r="14" fill="#ca8a04"/>
    <text x="510" y="150" fill="#fff" font-weight="bold" font-size="13" text-anchor="middle">4</text>
  </g>
  <line x1="495" y1="145" x2="390" y2="150" stroke="#334155" stroke-width="1.6" marker-end="url(#arrow)"/>
  <text x="530" y="150" font-size="11.5" font-weight="700" fill="#854d0e">(4) Vesikula Seminalis</text>

  <!-- Label 5: Kelenjar Prostat -->
  <g filter="url(#shadow)">
    <circle cx="460" cy="205" r="14" fill="#db2777"/>
    <text x="460" y="210" fill="#fff" font-weight="bold" font-size="13" text-anchor="middle">5</text>
  </g>
  <line x1="445" y1="205" x2="350" y2="205" stroke="#334155" stroke-width="1.6" marker-end="url(#arrow)"/>
  <text x="480" y="210" font-size="11.5" font-weight="700" fill="#9d174d">(5) Kelenjar Prostat</text>

  <!-- Label 6: Uretra -->
  <g filter="url(#shadow)">
    <circle cx="70" cy="285" r="14" fill="#0284c7"/>
    <text x="70" y="290" fill="#fff" font-weight="bold" font-size="13" text-anchor="middle">6</text>
  </g>
  <line x1="85" y1="285" x2="160" y2="295" stroke="#334155" stroke-width="1.6" marker-end="url(#arrow)"/>
  <text x="70" y="315" font-size="11.5" font-weight="700" fill="#0369a1" text-anchor="middle">(6) Uretra</text>
</svg>'''

with open('public/soal-smp/reproduksi-pria.svg', 'w') as f:
    f.write(svg_pria)

# 2. Anatomi Sistem Reproduksi Wanita
svg_wanita = '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 650 420" width="100%" height="100%" style="background:#ffffff; font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <defs>
    <linearGradient id="bgGradW" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#fff5f5"/>
      <stop offset="100%" stop-color="#f8fafc"/>
    </linearGradient>
    <filter id="shadowW" x="-5%" y="-5%" width="110%" height="110%">
      <feDropShadow dx="1" dy="2" stdDeviation="2" flood-opacity="0.15"/>
    </filter>
    <marker id="arrowW" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
      <path d="M 0 0 L 10 5 L 0 10 z" fill="#334155"/>
    </marker>
  </defs>

  <rect width="650" height="420" fill="url(#bgGradW)" rx="12" stroke="#fecdd3" stroke-width="2"/>
  <text x="325" y="28" text-anchor="middle" font-size="15" font-weight="bold" fill="#0f172a">STRUKTUR ORGAN REPRODUKSI WANITA (PENAMPANG DEPAN)</text>
  <text x="325" y="44" text-anchor="middle" font-size="11" fill="#64748b">Asesmen Kurikulum Merdeka Fase D — IPA Kelas 9 SMP</text>

  <!-- Uterus (Rahim) Luar -->
  <path d="M 240 130 C 240 100, 410 100, 410 130 C 410 180, 365 240, 360 270 L 290 270 C 285 240, 240 180, 240 130 Z" fill="#fda4af" stroke="#e11d48" stroke-width="2.5"/>

  <!-- Endometrium & Rongga Uterus -->
  <path d="M 270 135 C 275 120, 375 120, 380 135 C 375 160, 345 220, 340 250 L 310 250 C 305 220, 275 160, 270 135 Z" fill="#ffe4e6" stroke="#f43f5e" stroke-width="2"/>
  <path d="M 290 145 C 300 135, 350 135, 360 145 C 350 170, 335 210, 330 240 L 320 240 C 315 210, 300 170, 290 145 Z" fill="#fff1f2"/>

  <!-- Tuba Fallopi (Oviduk) Kiri & Kanan -->
  <!-- Kiri -->
  <path d="M 245 120 C 190 100, 150 115, 125 150 C 120 160, 125 175, 140 180" fill="none" stroke="#e11d48" stroke-width="12" stroke-linecap="round"/>
  <!-- Fimbriae Kiri -->
  <path d="M 125 155 Q 115 165 125 175 M 128 152 Q 112 158 122 172 M 132 150 Q 120 150 128 165" stroke="#be123c" stroke-width="3" stroke-linecap="round"/>

  <!-- Kanan -->
  <path d="M 405 120 C 460 100, 500 115, 525 150 C 530 160, 525 175, 510 180" fill="none" stroke="#e11d48" stroke-width="12" stroke-linecap="round"/>
  <!-- Fimbriae Kanan -->
  <path d="M 525 155 Q 535 165 525 175 M 522 152 Q 538 158 528 172 M 518 150 Q 530 150 522 165" stroke="#be123c" stroke-width="3" stroke-linecap="round"/>

  <!-- Ovarium Kiri & Kanan -->
  <ellipse cx="160" cy="195" rx="28" ry="18" fill="#fef08a" stroke="#ca8a04" stroke-width="2.2"/>
  <ellipse cx="490" cy="195" rx="28" ry="18" fill="#fef08a" stroke="#ca8a04" stroke-width="2.2"/>
  <!-- Folikel di ovarium -->
  <circle cx="152" cy="192" r="5" fill="#f59e0b"/>
  <circle cx="168" cy="198" r="4" fill="#f59e0b"/>
  <circle cx="482" cy="195" r="5" fill="#f59e0b"/>
  <circle cx="498" cy="192" r="4" fill="#f59e0b"/>

  <!-- Ligamen Ovarium -->
  <path d="M 188 195 Q 225 185 245 160" stroke="#f43f5e" stroke-width="3" fill="none"/>
  <path d="M 462 195 Q 425 185 405 160" stroke="#f43f5e" stroke-width="3" fill="none"/>

  <!-- Serviks (Leher Rahim) -->
  <rect x="300" y="270" width="50" height="35" rx="4" fill="#fb7185" stroke="#e11d48" stroke-width="2"/>
  <line x1="325" y1="270" x2="325" y2="305" stroke="#881337" stroke-width="2"/>

  <!-- Vagina -->
  <path d="M 295 305 L 290 380 L 360 380 L 355 305 Z" fill="#fbcfe8" stroke="#db2777" stroke-width="2.2"/>
  <line x1="325" y1="305" x2="325" y2="380" stroke="#be185d" stroke-width="2" stroke-dasharray="3,3"/>

  <!-- Label P: Ovarium -->
  <g filter="url(#shadowW)">
    <circle cx="65" cy="205" r="14" fill="#ca8a04"/>
    <text x="65" y="210" fill="#fff" font-weight="bold" font-size="13" text-anchor="middle">P</text>
  </g>
  <line x1="85" y1="205" x2="135" y2="200" stroke="#334155" stroke-width="1.6" marker-end="url(#arrowW)"/>
  <text x="65" y="235" font-size="11.5" font-weight="700" fill="#854d0e" text-anchor="middle">P (Ovarium)</text>

  <!-- Label Q: Tuba Fallopi / Oviduk -->
  <g filter="url(#shadowW)">
    <circle cx="130" cy="85" r="14" fill="#dc2626"/>
    <text x="130" y="90" fill="#fff" font-weight="bold" font-size="13" text-anchor="middle">Q</text>
  </g>
  <line x1="145" y1="90" x2="190" y2="105" stroke="#334155" stroke-width="1.6" marker-end="url(#arrowW)"/>
  <text x="130" y="65" font-size="11.5" font-weight="700" fill="#991b1b" text-anchor="middle">Q (Tuba Fallopi)</text>

  <!-- Label R: Uterus / Rahim -->
  <g filter="url(#shadowW)">
    <circle cx="325" cy="80" r="14" fill="#e11d48"/>
    <text x="325" y="85" fill="#fff" font-weight="bold" font-size="13" text-anchor="middle">R</text>
  </g>
  <line x1="325" y1="95" x2="325" y2="140" stroke="#334155" stroke-width="1.6" marker-end="url(#arrowW)"/>
  <text x="325" y="60" font-size="11.5" font-weight="700" fill="#9f1239" text-anchor="middle">R (Uterus / Rahim)</text>

  <!-- Label S: Endometrium -->
  <g filter="url(#shadowW)">
    <circle cx="445" cy="235" r="14" fill="#7c3aed"/>
    <text x="445" y="240" fill="#fff" font-weight="bold" font-size="13" text-anchor="middle">S</text>
  </g>
  <line x1="430" y1="235" x2="355" y2="215" stroke="#334155" stroke-width="1.6" marker-end="url(#arrowW)"/>
  <text x="515" y="240" font-size="11.5" font-weight="700" fill="#6d28d9">S (Endometrium)</text>

  <!-- Label T: Serviks -->
  <g filter="url(#shadowW)">
    <circle cx="435" cy="290" r="14" fill="#db2777"/>
    <text x="435" y="295" fill="#fff" font-weight="bold" font-size="13" text-anchor="middle">T</text>
  </g>
  <line x1="420" y1="290" x2="355" y2="285" stroke="#334155" stroke-width="1.6" marker-end="url(#arrowW)"/>
  <text x="495" y="295" font-size="11.5" font-weight="700" fill="#9d174d">T (Serviks)</text>

  <!-- Label U: Vagina -->
  <g filter="url(#shadowW)">
    <circle cx="435" cy="345" r="14" fill="#0284c7"/>
    <text x="435" y="350" fill="#fff" font-weight="bold" font-size="13" text-anchor="middle">U</text>
  </g>
  <line x1="420" y1="345" x2="360" y2="345" stroke="#334155" stroke-width="1.6" marker-end="url(#arrowW)"/>
  <text x="495" y="350" font-size="11.5" font-weight="700" fill="#0369a1">U (Vagina)</text>
</svg>'''

with open('public/soal-smp/reproduksi-wanita.svg', 'w') as f:
    f.write(svg_wanita)

# 3. Siklus Hormon Menstruasi & Dinding Endometrium
svg_menstruasi = '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 680 430" width="100%" height="100%" style="background:#ffffff; font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <defs>
    <linearGradient id="bgM" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#ffffff"/>
      <stop offset="100%" stop-color="#f8fafc"/>
    </linearGradient>
    <linearGradient id="endoGrad" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#fda4af"/>
      <stop offset="100%" stop-color="#ffe4e6"/>
    </linearGradient>
  </defs>

  <rect width="680" height="430" fill="url(#bgM)" rx="12" stroke="#e2e8f0" stroke-width="2"/>
  <text x="340" y="26" text-anchor="middle" font-size="14.5" font-weight="bold" fill="#0f172a">GRAFIK FLUKTUASI HORMON &amp; KETEBALAN ENDOMETRIUM SIKLUS MENSTRUASI</text>
  <text x="340" y="42" text-anchor="middle" font-size="11" fill="#64748b">Soal Standar Ujian Nasional / AKM IPA Terpadu SMP</text>

  <!-- Area Grafik Atas: Hormon (Y: 60 - 230) -->
  <line x1="80" y1="60" x2="80" y2="230" stroke="#64748b" stroke-width="1.5"/>
  <line x1="80" y1="230" x2="630" y2="230" stroke="#64748b" stroke-width="1.5"/>
  <text x="40" y="145" font-size="10" font-weight="700" fill="#475569" transform="rotate(-90 40 145)" text-anchor="middle">Kadar Hormon</text>

  <!-- Garis Hari & Zona Fase -->
  <!-- Hari 1-5 Menstruasi -->
  <rect x="80" y="60" width="75" height="170" fill="#fee2e2" opacity="0.45"/>
  <text x="117" y="75" font-size="9" font-weight="700" fill="#dc2626" text-anchor="middle">Menstruasi</text>

  <!-- Hari 6-13 Pra-ovulasi (Folikuler) -->
  <rect x="155" y="60" width="160" height="170" fill="#fef9c3" opacity="0.45"/>
  <text x="235" y="75" font-size="9" font-weight="700" fill="#ca8a04" text-anchor="middle">Pra-Ovulasi (Folikuler)</text>

  <!-- Hari 14 Ovulasi -->
  <line x1="315" y1="60" x2="315" y2="230" stroke="#dc2626" stroke-width="1.5" stroke-dasharray="3,3"/>
  <text x="315" y="75" font-size="9.5" font-weight="800" fill="#dc2626" text-anchor="middle">Ovulasi (Hari 14)</text>

  <!-- Hari 15-28 Pasca-ovulasi (Luteal) -->
  <rect x="315" y="60" width="280" height="170" fill="#e0f2fe" opacity="0.45"/>
  <text x="455" y="75" font-size="9" font-weight="700" fill="#0284c7" text-anchor="middle">Pasca-Ovulasi (Luteal)</text>

  <!-- Kurva Hormon -->
  <!-- 1. FSH (Kuning Mustard) -->
  <path d="M 80 180 Q 155 140 235 160 Q 300 170 315 130 Q 340 200 455 210 L 595 200" fill="none" stroke="#d97706" stroke-width="2.5"/>
  <text x="175" y="145" font-size="10.5" font-weight="800" fill="#b45309">FSH</text>

  <!-- 2. LH (Merah - Lonjakan Tajam di Hari 14) -->
  <path d="M 80 215 L 250 215 Q 295 215 315 85 Q 330 200 370 215 L 595 215" fill="none" stroke="#dc2626" stroke-width="3"/>
  <text x="330" y="95" font-size="11" font-weight="800" fill="#dc2626">LH Surge (Lonjakan LH)</text>

  <!-- 3. Estrogen (Hijau Emerald - Puncak Pra-ovulasi & Luteal) -->
  <path d="M 80 210 Q 180 200 270 110 Q 315 165 370 170 Q 450 130 520 150 Q 570 190 595 215" fill="none" stroke="#059669" stroke-width="2.5"/>
  <text x="240" y="105" font-size="10.5" font-weight="800" fill="#047857">Estrogen</text>

  <!-- 4. Progesteron (Ungu - Naik Tajam Fase Luteal) -->
  <path d="M 80 225 L 315 225 Q 370 220 450 100 Q 530 110 595 220" fill="none" stroke="#7c3aed" stroke-width="3"/>
  <text x="460" y="115" font-size="11" font-weight="800" fill="#6d28d9">Progesteron</text>

  <!-- Area Bawah: Ketebalan Endometrium (Y: 260 - 380) -->
  <line x1="80" y1="260" x2="80" y2="380" stroke="#64748b" stroke-width="1.5"/>
  <line x1="80" y1="380" x2="630" y2="380" stroke="#64748b" stroke-width="1.5"/>
  <text x="40" y="320" font-size="9.5" font-weight="700" fill="#475569" transform="rotate(-90 40 320)" text-anchor="middle">Dinding Rahim</text>

  <!-- Poligon Dinding Endometrium -->
  <!-- Hari 1-5 Meluruh, 6-14 Menebal bertahap, 15-26 Sangat Tebal kaya pembuluh darah, 27-28 Mengikis jika fertilisasi nihil -->
  <path d="M 80 340 Q 115 375 155 375 Q 235 365 315 330 Q 450 280 540 280 Q 575 320 595 350 L 595 380 L 80 380 Z" fill="url(#endoGrad)" stroke="#f43f5e" stroke-width="2"/>
  <text x="450" y="335" font-size="11" font-weight="bold" fill="#be123c">Penebalan &amp; Vaskularisasi Endometrium</text>
  <text x="117" y="365" font-size="9" fill="#991b1b" font-weight="600" text-anchor="middle">Meluruh</text>

  <!-- Sumbu X Hari -->
  <text x="80" y="402" font-size="10" font-weight="bold" fill="#334155" text-anchor="middle">0</text>
  <text x="155" y="402" font-size="10" font-weight="bold" fill="#334155" text-anchor="middle">5</text>
  <text x="315" y="402" font-size="10.5" font-weight="bold" fill="#dc2626" text-anchor="middle">14</text>
  <text x="455" y="402" font-size="10" font-weight="bold" fill="#334155" text-anchor="middle">21</text>
  <text x="595" y="402" font-size="10" font-weight="bold" fill="#334155" text-anchor="middle">28 Hari</text>
  <text x="340" y="420" font-size="11" font-weight="bold" fill="#1e293b" text-anchor="middle">Hari ke- (Siklus Rata-rata 28 Hari)</text>
</svg>'''

with open('public/soal-smp/siklus-hormon-menstruasi.svg', 'w') as f:
    f.write(svg_menstruasi)

# 4. Spermatogenesis dan Oogenesis
svg_gamet = '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 680 430" width="100%" height="100%" style="background:#ffffff; font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <defs>
    <filter id="shG" x="-5%" y="-5%" width="110%" height="110%">
      <feDropShadow dx="1" dy="2" stdDeviation="2" flood-opacity="0.12"/>
    </filter>
  </defs>

  <rect width="680" height="430" fill="#f8fafc" rx="12" stroke="#e2e8f0" stroke-width="2"/>
  <text x="340" y="26" text-anchor="middle" font-size="15" font-weight="bold" fill="#0f172a">PERBANDINGAN SPERMATOGENESIS DAN OOGENESIS</text>
  <text x="340" y="43" text-anchor="middle" font-size="11" fill="#64748b">Pembelahan Mitosis, Meiosis I, dan Meiosis II Gamet Manusia</text>

  <!-- Kolom Kiri: Spermatogenesis -->
  <rect x="25" y="60" width="300" height="350" rx="10" fill="#eff6ff" stroke="#bfdbfe" stroke-width="1.5"/>
  <text x="175" y="85" text-anchor="middle" font-size="13" font-weight="bold" fill="#1d4ed8">SPERMATOGENESIS (Di Testis)</text>

  <!-- 1. Spermatogonium 2n -->
  <circle cx="175" cy="120" r="16" fill="#60a5fa" stroke="#1d4ed8" stroke-width="2"/>
  <text x="175" y="125" font-size="10" font-weight="bold" fill="#fff" text-anchor="middle">2n</text>
  <text x="245" y="123" font-size="10" font-weight="700" fill="#1e3a8a">Spermatogonium (2n)</text>

  <!-- Mitosis -->
  <line x1="175" y1="138" x2="175" y2="162" stroke="#93c5fd" stroke-width="2"/>
  <text x="125" y="153" font-size="9" fill="#2563eb" font-style="italic">Mitosis</text>

  <!-- 2. Spermatosit Primer 2n -->
  <circle cx="175" cy="180" r="18" fill="#3b82f6" stroke="#1e40af" stroke-width="2"/>
  <text x="175" y="185" font-size="10" font-weight="bold" fill="#fff" text-anchor="middle">2n</text>
  <text x="252" y="183" font-size="10" font-weight="700" fill="#1e3a8a">Spermatosit I (2n)</text>

  <!-- Meiosis I -->
  <line x1="160" y1="200" x2="125" y2="230" stroke="#93c5fd" stroke-width="2"/>
  <line x1="190" y1="200" x2="225" y2="230" stroke="#93c5fd" stroke-width="2"/>
  <text x="175" y="215" font-size="9" fill="#2563eb" font-style="italic" text-anchor="middle">Meiosis I</text>

  <!-- 3. Spermatosit Sekunder n -->
  <circle cx="120" cy="245" r="14" fill="#93c5fd" stroke="#2563eb" stroke-width="1.8"/>
  <circle cx="230" cy="245" r="14" fill="#93c5fd" stroke="#2563eb" stroke-width="1.8"/>
  <text x="120" y="249" font-size="9.5" font-weight="bold" fill="#1e3a8a" text-anchor="middle">n</text>
  <text x="230" y="249" font-size="9.5" font-weight="bold" fill="#1e3a8a" text-anchor="middle">n</text>
  <text x="175" y="260" font-size="9" font-weight="600" fill="#1e3a8a" text-anchor="middle">Spermatosit II (n)</text>

  <!-- Meiosis II -->
  <line x1="110" y1="262" x2="80" y2="295" stroke="#93c5fd" stroke-width="1.5"/>
  <line x1="130" y1="262" x2="140" y2="295" stroke="#93c5fd" stroke-width="1.5"/>
  <line x1="220" y1="262" x2="210" y2="295" stroke="#93c5fd" stroke-width="1.5"/>
  <line x1="240" y1="262" x2="270" y2="295" stroke="#93c5fd" stroke-width="1.5"/>
  <text x="175" y="280" font-size="9" fill="#2563eb" font-style="italic" text-anchor="middle">Meiosis II</text>

  <!-- 4. Spermatid n -->
  <circle cx="75" cy="308" r="11" fill="#bfdbfe" stroke="#3b82f6" stroke-width="1.5"/>
  <circle cx="140" cy="308" r="11" fill="#bfdbfe" stroke="#3b82f6" stroke-width="1.5"/>
  <circle cx="210" cy="308" r="11" fill="#bfdbfe" stroke="#3b82f6" stroke-width="1.5"/>
  <circle cx="275" cy="308" r="11" fill="#bfdbfe" stroke="#3b82f6" stroke-width="1.5"/>
  <text x="175" y="328" font-size="9.5" font-weight="700" fill="#1e40af" text-anchor="middle">4 Spermatid (n)</text>

  <!-- 5. Diferensiasi (Spermatozoa) -->
  <path d="M 75 350 C 70 365, 80 375, 75 390 M 140 350 C 135 365, 145 375, 140 390 M 210 350 C 205 365, 215 375, 210 390 M 275 350 C 270 365, 280 375, 275 390" stroke="#1d4ed8" stroke-width="1.8" fill="none"/>
  <ellipse cx="75" cy="350" rx="5" ry="7" fill="#1d4ed8"/>
  <ellipse cx="140" cy="350" rx="5" ry="7" fill="#1d4ed8"/>
  <ellipse cx="210" cy="350" rx="5" ry="7" fill="#1d4ed8"/>
  <ellipse cx="275" cy="350" rx="5" ry="7" fill="#1d4ed8"/>
  <text x="175" y="402" font-size="10" font-weight="bold" fill="#1e3a8a" text-anchor="middle">4 Sel Sperma Fungsional (n)</text>

  <!-- Kolom Kanan: Oogenesis -->
  <rect x="355" y="60" width="300" height="350" rx="10" fill="#fff1f2" stroke="#fecdd3" stroke-width="1.5"/>
  <text x="505" y="85" text-anchor="middle" font-size="13" font-weight="bold" fill="#be123c">OOGENESIS (Di Ovarium)</text>

  <!-- 1. Oogonium 2n -->
  <circle cx="505" cy="120" r="16" fill="#f43f5e" stroke="#be123c" stroke-width="2"/>
  <text x="505" y="125" font-size="10" font-weight="bold" fill="#fff" text-anchor="middle">2n</text>
  <text x="575" y="123" font-size="10" font-weight="700" fill="#881337">Oogonium (2n)</text>

  <!-- Mitosis -->
  <line x1="505" y1="138" x2="505" y2="162" stroke="#fda4af" stroke-width="2"/>
  <text x="455" y="153" font-size="9" fill="#e11d48" font-style="italic">Mitosis</text>

  <!-- 2. Oosit Primer 2n -->
  <circle cx="505" cy="180" r="19" fill="#e11d48" stroke="#9f1239" stroke-width="2"/>
  <text x="505" y="185" font-size="10" font-weight="bold" fill="#fff" text-anchor="middle">2n</text>
  <text x="575" y="183" font-size="10" font-weight="700" fill="#881337">Oosit I (2n)</text>

  <!-- Meiosis I (Sitokinesis Asimetris!) -->
  <line x1="490" y1="200" x2="460" y2="230" stroke="#fda4af" stroke-width="2"/>
  <line x1="520" y1="200" x2="565" y2="235" stroke="#fda4af" stroke-width="1.5"/>
  <text x="505" y="215" font-size="9" fill="#e11d48" font-style="italic" text-anchor="middle">Meiosis I</text>

  <!-- 3. Oosit Sekunder (Besar) + Badan Kutub I (Kecil) -->
  <circle cx="455" cy="245" r="17" fill="#fb7185" stroke="#be123c" stroke-width="2"/>
  <text x="455" y="249" font-size="9.5" font-weight="bold" fill="#fff" text-anchor="middle">n</text>
  <circle cx="570" cy="245" r="7" fill="#cbd5e1" stroke="#64748b" stroke-width="1.2"/>

  <text x="390" y="248" font-size="9.5" font-weight="700" fill="#be123c">Oosit II (n)</text>
  <text x="625" y="248" font-size="9" fill="#475569" text-anchor="middle">Polosit I</text>

  <!-- Meiosis II -->
  <line x1="445" y1="264" x2="430" y2="295" stroke="#fda4af" stroke-width="2"/>
  <line x1="470" y1="264" x2="505" y2="300" stroke="#fda4af" stroke-width="1.2"/>
  <line x1="570" y1="254" x2="560" y2="300" stroke="#cbd5e1" stroke-width="1.2"/>
  <line x1="570" y1="254" x2="590" y2="300" stroke="#cbd5e1" stroke-width="1.2"/>
  <text x="505" y="280" font-size="9" fill="#e11d48" font-style="italic" text-anchor="middle">Meiosis II</text>

  <!-- 4. Ootid & 3 Polosit (Badan Polar) -->
  <circle cx="425" cy="315" r="16" fill="#f43f5e" stroke="#be123c" stroke-width="2"/>
  <circle cx="505" cy="315" r="6" fill="#cbd5e1" stroke="#64748b" stroke-width="1.2"/>
  <circle cx="555" cy="315" r="6" fill="#cbd5e1" stroke="#64748b" stroke-width="1.2"/>
  <circle cx="595" cy="315" r="6" fill="#cbd5e1" stroke="#64748b" stroke-width="1.2"/>
  <text x="425" y="340" font-size="9.5" font-weight="700" fill="#9f1239" text-anchor="middle">Ootid (n)</text>
  <text x="555" y="338" font-size="8.5" fill="#64748b" text-anchor="middle">3 Badan Kutub / Polosit (degenerasi)</text>

  <!-- 5. Ovum Matang Fungsional -->
  <circle cx="425" cy="375" r="18" fill="#e11d48" stroke="#881337" stroke-width="2.5"/>
  <text x="425" y="380" font-size="11" font-weight="bold" fill="#fff" text-anchor="middle">n</text>
  <text x="535" y="380" font-size="11" font-weight="bold" fill="#881337">1 Ovum Fungsional (n)</text>
</svg>'''

with open('public/soal-smp/spermatogenesis-oogenesis.svg', 'w') as f:
    f.write(svg_gamet)

# 5. Struktur Anatomi Bunga Angiospermae
svg_bunga = '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 650 420" width="100%" height="100%" style="background:#ffffff; font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <defs>
    <filter id="shB" x="-5%" y="-5%" width="110%" height="110%">
      <feDropShadow dx="1" dy="2" stdDeviation="2" flood-opacity="0.15"/>
    </filter>
    <marker id="arB" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
      <path d="M 0 0 L 10 5 L 0 10 z" fill="#334155"/>
    </marker>
  </defs>

  <rect width="650" height="420" fill="#fafaf9" rx="12" stroke="#e7e5e4" stroke-width="2"/>
  <text x="325" y="28" text-anchor="middle" font-size="15" font-weight="bold" fill="#0f172a">STRUKTUR MORFOLOGI DAN ANATOMI BUNGA ANGIOSPERMAE</text>
  <text x="325" y="44" text-anchor="middle" font-size="11" fill="#64748b">Alat Perkembangbiakan Generatif Tumbuhan — IPA SMP Kelas 9</text>

  <!-- Mahkota Bunga (Corolla) -->
  <path d="M 325 240 C 220 220, 150 140, 180 90 C 210 50, 270 120, 325 180 C 380 120, 440 50, 470 90 C 500 140, 430 220, 325 240 Z" fill="#f43f5e" stroke="#be123c" stroke-width="2.5" opacity="0.85"/>
  <path d="M 325 240 C 240 280, 120 230, 130 170 C 140 120, 220 180, 325 240 Z" fill="#fb7185" stroke="#e11d48" stroke-width="2" opacity="0.85"/>
  <path d="M 325 240 C 410 280, 530 230, 520 170 C 510 120, 430 180, 325 240 Z" fill="#fb7185" stroke="#e11d48" stroke-width="2" opacity="0.85"/>

  <!-- Dasar Bunga & Kelopak (Calyx) -->
  <path d="M 290 280 C 270 290, 230 295, 210 270 C 225 295, 270 310, 295 305 Z" fill="#4ade80" stroke="#16a34a" stroke-width="2"/>
  <path d="M 360 280 C 380 290, 420 295, 440 270 C 425 295, 380 310, 355 305 Z" fill="#4ade80" stroke="#16a34a" stroke-width="2"/>
  <ellipse cx="325" cy="295" rx="35" ry="16" fill="#86efac" stroke="#16a34a" stroke-width="2"/>

  <!-- Tangkai Bunga -->
  <path d="M 318 310 L 318 390 L 332 390 L 332 310 Z" fill="#22c55e" stroke="#15803d" stroke-width="2"/>

  <!-- Bakal Buah (Ovarium) & Bakal Biji (Ovulum) -->
  <path d="M 305 285 C 295 240, 310 215, 325 215 C 340 215, 355 240, 345 285 Z" fill="#fef08a" stroke="#ca8a04" stroke-width="2.2"/>
  <ellipse cx="325" cy="255" rx="12" ry="16" fill="#fde047" stroke="#a16207" stroke-width="1.8"/>
  <circle cx="325" cy="255" r="4.5" fill="#ca8a04"/>

  <!-- Tangkai Putik & Kepala Putik (Pistillum) -->
  <line x1="325" y1="215" x2="325" y2="120" stroke="#65a30d" stroke-width="5" stroke-linecap="round"/>
  <path d="M 315 120 C 315 105, 335 105, 335 120 Z" fill="#84cc16" stroke="#4d7c0f" stroke-width="2.5"/>
  <circle cx="320" cy="112" r="5" fill="#a3e635"/>
  <circle cx="330" cy="112" r="5" fill="#a3e635"/>

  <!-- Benang Sari (Stamen: Tangkai Sari & Kepala Sari) -->
  <!-- Kiri -->
  <path d="M 305 260 C 260 230, 240 180, 255 125" fill="none" stroke="#eab308" stroke-width="2.5"/>
  <ellipse cx="255" cy="120" rx="8" ry="5" fill="#ca8a04" stroke="#854d0e" stroke-width="1.8"/>
  <path d="M 310 260 C 280 230, 275 190, 285 135" fill="none" stroke="#eab308" stroke-width="2.5"/>
  <ellipse cx="285" cy="130" rx="8" ry="5" fill="#ca8a04" stroke="#854d0e" stroke-width="1.8"/>

  <!-- Kanan -->
  <path d="M 345 260 C 390 230, 410 180, 395 125" fill="none" stroke="#eab308" stroke-width="2.5"/>
  <ellipse cx="395" cy="120" rx="8" ry="5" fill="#ca8a04" stroke="#854d0e" stroke-width="1.8"/>
  <path d="M 340 260 C 370 230, 375 190, 365 135" fill="none" stroke="#eab308" stroke-width="2.5"/>
  <ellipse cx="365" cy="130" rx="8" ry="5" fill="#ca8a04" stroke="#854d0e" stroke-width="1.8"/>

  <!-- Labels -->
  <!-- 1. Mahkota -->
  <g filter="url(#shB)">
    <circle cx="100" cy="90" r="14" fill="#e11d48"/>
    <text x="100" y="95" fill="#fff" font-weight="bold" font-size="13" text-anchor="middle">1</text>
  </g>
  <line x1="120" y1="95" x2="165" y2="115" stroke="#334155" stroke-width="1.6" marker-end="url(#arB)"/>
  <text x="100" y="70" font-size="11.5" font-weight="bold" fill="#9f1239" text-anchor="middle">(1) Mahkota Bunga</text>

  <!-- 2. Kepala Putik -->
  <g filter="url(#shB)">
    <circle cx="325" cy="65" r="14" fill="#65a30d"/>
    <text x="325" y="70" fill="#fff" font-weight="bold" font-size="13" text-anchor="middle">2</text>
  </g>
  <line x1="325" y1="82" x2="325" y2="105" stroke="#334155" stroke-width="1.6" marker-end="url(#arB)"/>
  <text x="325" y="48" font-size="11.5" font-weight="bold" fill="#365314" text-anchor="middle">(2) Kepala Putik (Stigma)</text>

  <!-- 3. Kepala Sari -->
  <g filter="url(#shB)">
    <circle cx="475" cy="115" r="14" fill="#ca8a04"/>
    <text x="475" y="120" fill="#fff" font-weight="bold" font-size="13" text-anchor="middle">3</text>
  </g>
  <line x1="455" y1="118" x2="405" y2="120" stroke="#334155" stroke-width="1.6" marker-end="url(#arB)"/>
  <text x="545" y="120" font-size="11.5" font-weight="bold" fill="#713f12">(3) Kepala Sari (Anthera)</text>

  <!-- 4. Bakal Biji -->
  <g filter="url(#shB)">
    <circle cx="210" cy="255" r="14" fill="#0284c7"/>
    <text x="210" y="260" fill="#fff" font-weight="bold" font-size="13" text-anchor="middle">4</text>
  </g>
  <line x1="228" y1="255" x2="310" y2="255" stroke="#334155" stroke-width="1.6" marker-end="url(#arB)"/>
  <text x="145" y="260" font-size="11.5" font-weight="bold" fill="#075985" text-anchor="middle">(4) Bakal Biji (Ovulum)</text>

  <!-- 5. Kelopak Bunga -->
  <g filter="url(#shB)">
    <circle cx="485" cy="285" r="14" fill="#16a34a"/>
    <text x="485" y="290" fill="#fff" font-weight="bold" font-size="13" text-anchor="middle">5</text>
  </g>
  <line x1="465" y1="285" x2="415" y2="285" stroke="#334155" stroke-width="1.6" marker-end="url(#arB)"/>
  <text x="555" y="290" font-size="11.5" font-weight="bold" fill="#14532d">(5) Kelopak Bunga (Calyx)</text>
</svg>'''

with open('public/soal-smp/struktur-bunga.svg', 'w') as f:
    f.write(svg_bunga)

print("Semua SVG berhasil di-generate secara presisi.")
