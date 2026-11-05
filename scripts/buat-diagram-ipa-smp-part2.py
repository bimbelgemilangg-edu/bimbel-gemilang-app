# scripts/buat-diagram-ipa-smp-part2.py
import os

# 6. Fertilisasi & Perkembangan Embrio
svg_embrio = '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 680 400" width="100%" height="100%" style="background:#ffffff; font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <defs>
    <linearGradient id="bgE" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#fdf4ff"/>
      <stop offset="100%" stop-color="#f8fafc"/>
    </linearGradient>
    <marker id="arE" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
      <path d="M 0 0 L 10 5 L 0 10 z" fill="#475569"/>
    </marker>
  </defs>

  <rect width="680" height="400" fill="url(#bgE)" rx="12" stroke="#f0abfc" stroke-width="2"/>
  <text x="340" y="26" text-anchor="middle" font-size="15" font-weight="bold" fill="#0f172a">TAHAP OVULASI, FERTILISASI, PEMBELAHAN ZIGOT HINGGA IMPLANTASI</text>
  <text x="340" y="43" text-anchor="middle" font-size="11" fill="#64748b">Jalur Perjalanan Sel Telur di Tuba Fallopi Menuju Dinding Rahim — IPA SMP Kelas 9</text>

  <!-- Dinding Rahim (Kanan) -->
  <path d="M 490 70 C 470 140, 470 260, 490 350 L 640 350 L 640 70 Z" fill="#fda4af" stroke="#e11d48" stroke-width="2.5"/>
  <text x="560" y="210" font-size="12" font-weight="bold" fill="#881337" text-anchor="middle">Endometrium (Dinding Rahim)</text>

  <!-- Saluran Tuba Fallopi -->
  <path d="M 60 280 C 60 140, 160 100, 480 110" fill="none" stroke="#f43f5e" stroke-width="26" opacity="0.3" stroke-linecap="round"/>

  <!-- Alur Panah -->
  <path d="M 90 270 Q 150 140 260 125 T 460 135" fill="none" stroke="#64748b" stroke-width="2" stroke-dasharray="4,4" marker-end="url(#arE)"/>

  <!-- Tahap 1: Ovarium & Ovulasi (A) -->
  <ellipse cx="80" cy="310" rx="35" ry="25" fill="#fef08a" stroke="#ca8a04" stroke-width="2"/>
  <circle cx="85" cy="270" r="10" fill="#f43f5e" stroke="#be123c" stroke-width="2"/>
  <text x="85" y="245" font-size="10.5" font-weight="bold" fill="#be123c" text-anchor="middle">A. Ovulasi</text>
  <text x="80" y="325" font-size="9" fill="#854d0e" text-anchor="middle">Ovarium</text>

  <!-- Tahap 2: Fertilisasi di Ampula Tuba Fallopi (B) -->
  <circle cx="160" cy="160" r="13" fill="#f43f5e" stroke="#be123c" stroke-width="2"/>
  <!-- Sperma membuahi -->
  <path d="M 140 180 L 152 168" stroke="#2563eb" stroke-width="2"/>
  <ellipse cx="138" cy="182" rx="3" ry="2" fill="#2563eb"/>
  <text x="160" y="130" font-size="10.5" font-weight="bold" fill="#be123c" text-anchor="middle">B. Fertilisasi</text>
  <text x="160" y="142" font-size="8.5" fill="#64748b" text-anchor="middle">(Tuba Fallopi)</text>

  <!-- Tahap 3: Zigot & Pembelahan Mitosis (C & D) -->
  <circle cx="250" cy="120" r="13" fill="#fb7185" stroke="#e11d48" stroke-width="2"/>
  <line x1="250" y1="107" x2="250" y2="133" stroke="#881337" stroke-width="1.5"/>
  <text x="250" y="95" font-size="10" font-weight="bold" fill="#9f1239" text-anchor="middle">C. Pembelahan (2 Sel)</text>

  <circle cx="330" cy="118" r="14" fill="#fb7185" stroke="#e11d48" stroke-width="2"/>
  <!-- 4 sel -->
  <circle cx="325" cy="114" r="5" fill="#f43f5e"/>
  <circle cx="335" cy="114" r="5" fill="#f43f5e"/>
  <circle cx="325" cy="122" r="5" fill="#f43f5e"/>
  <circle cx="335" cy="122" r="5" fill="#f43f5e"/>
  <text x="330" y="95" font-size="10" font-weight="bold" fill="#9f1239" text-anchor="middle">D. 4 - 8 Sel</text>

  <!-- Tahap 4: Morula (E) -->
  <circle cx="410" cy="122" r="15" fill="#f43f5e" stroke="#be123c" stroke-width="2"/>
  <circle cx="406" cy="118" r="3" fill="#fff"/>
  <circle cx="414" cy="118" r="3" fill="#fff"/>
  <circle cx="406" cy="126" r="3" fill="#fff"/>
  <circle cx="414" cy="126" r="3" fill="#fff"/>
  <circle cx="410" cy="122" r="3" fill="#fff"/>
  <text x="410" y="95" font-size="10" font-weight="bold" fill="#9f1239" text-anchor="middle">E. Morula</text>

  <!-- Tahap 5: Blastosis & Implantasi / Nidasi (F) -->
  <circle cx="482" cy="150" r="17" fill="#fde047" stroke="#ca8a04" stroke-width="2"/>
  <circle cx="482" cy="150" r="11" fill="#fff"/>
  <circle cx="478" cy="148" r="5" fill="#ea580c"/>
  <text x="545" y="145" font-size="11" font-weight="bold" fill="#9a3412">F. Blastosis</text>
  <text x="545" y="160" font-size="9.5" font-weight="bold" fill="#dc2626">Implantasi (Nidasi)</text>

  <!-- Keterangan Waktu Hari -->
  <rect x="50" y="360" width="580" height="26" rx="6" fill="#f1f5f9" stroke="#cbd5e1"/>
  <text x="340" y="377" font-size="10" font-weight="bold" fill="#334155" text-anchor="middle">Hari 0: Ovulasi &amp; Fertilisasi  |  Hari 1-3: Pembelahan Sel di Tuba Fallopi  |  Hari 4-5: Morula ke Rahim  |  Hari 6-7: Implantasi Endometrium</text>
</svg>'''

with open('public/soal-smp/fertilisasi-implantasi.svg', 'w') as f:
    f.write(svg_embrio)

# 7. Metagenesis Lumut dan Paku
svg_metagenesis = '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 680 420" width="100%" height="100%" style="background:#ffffff; font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <defs>
    <marker id="arM" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
      <path d="M 0 0 L 10 5 L 0 10 z" fill="#15803d"/>
    </marker>
  </defs>

  <rect width="680" height="420" fill="#f0fdf4" rx="12" stroke="#bbf7d0" stroke-width="2"/>
  <text x="340" y="26" text-anchor="middle" font-size="15" font-weight="bold" fill="#0f172a">SKEMA METAGENESIS (PERGILIRAN KETURUNAN) LUMUT DAN PAKU</text>
  <text x="340" y="43" text-anchor="middle" font-size="11" fill="#64748b">Perbandingan Generasi Gametofit (Haploid/n) dan Sporofit (Diploid/2n)</text>

  <!-- Kolom Kiri: Lumut (Bryophyta) - Gametofit Dominan -->
  <rect x="25" y="60" width="300" height="340" rx="10" fill="#ffffff" stroke="#86efac" stroke-width="1.8"/>
  <text x="175" y="85" text-anchor="middle" font-size="13" font-weight="bold" fill="#15803d">LUMUT (Gametofit Dominan)</text>

  <!-- Kotak Fase Gametofit n -->
  <rect x="40" y="100" width="270" height="155" rx="8" fill="#dcfce7" stroke="#22c55e" stroke-width="1.5"/>
  <text x="50" y="118" font-size="10" font-weight="bold" fill="#166534">Fase Gametofit (n) - Hidup Bebas Dominan</text>

  <rect x="125" y="125" width="100" height="24" rx="4" fill="#fff" stroke="#16a34a"/>
  <text x="175" y="141" font-size="10" font-weight="bold" fill="#166534" text-anchor="middle">Spora (n)</text>

  <line x1="175" y1="149" x2="175" y2="162" stroke="#15803d" stroke-width="1.5" marker-end="url(#arM)"/>

  <rect x="110" y="162" width="130" height="24" rx="4" fill="#fff" stroke="#16a34a"/>
  <text x="175" y="178" font-size="10" font-weight="bold" fill="#166534" text-anchor="middle">Protonema (n)</text>

  <line x1="175" y1="186" x2="175" y2="198" stroke="#15803d" stroke-width="1.5" marker-end="url(#arM)"/>

  <rect x="90" y="198" width="170" height="26" rx="4" fill="#22c55e" stroke="#15803d"/>
  <text x="175" y="215" font-size="11" font-weight="bold" fill="#fff" text-anchor="middle">Tumbuhan Lumut (n)</text>

  <!-- Anteridium & Arkegonium -->
  <text x="100" y="240" font-size="9" font-weight="bold" fill="#15803d">Anteridium (♂)</text>
  <text x="210" y="240" font-size="9" font-weight="bold" fill="#15803d">Arkegonium (♀)</text>

  <!-- Fertilisasi & Kotak Sporofit 2n -->
  <rect x="40" y="265" width="270" height="125" rx="8" fill="#fef3c7" stroke="#f59e0b" stroke-width="1.5"/>
  <text x="50" y="282" font-size="10" font-weight="bold" fill="#92400e">Fase Sporofit (2n) - Menumpang</text>

  <rect x="125" y="292" width="100" height="24" rx="4" fill="#fff" stroke="#d97706"/>
  <text x="175" y="308" font-size="10" font-weight="bold" fill="#b45309" text-anchor="middle">Zigot (2n)</text>

  <line x1="175" y1="316" x2="175" y2="328" stroke="#d97706" stroke-width="1.5" marker-end="url(#arM)"/>

  <rect x="100" y="328" width="150" height="24" rx="4" fill="#fff" stroke="#d97706"/>
  <text x="175" y="344" font-size="10" font-weight="bold" fill="#b45309" text-anchor="middle">Sporogonium (2n)</text>

  <line x1="175" y1="352" x2="175" y2="362" stroke="#d97706" stroke-width="1.5" marker-end="url(#arM)"/>

  <rect x="100" y="362" width="150" height="22" rx="4" fill="#f59e0b" stroke="#b45309"/>
  <text x="175" y="377" font-size="9.5" font-weight="bold" fill="#fff" text-anchor="middle">Kotak Spora / Meiosis</text>

  <!-- Kolom Kanan: Paku (Pteridophyta) - Sporofit Dominan -->
  <rect x="355" y="60" width="300" height="340" rx="10" fill="#ffffff" stroke="#86efac" stroke-width="1.8"/>
  <text x="505" y="85" text-anchor="middle" font-size="13" font-weight="bold" fill="#15803d">PAKU (Sporofit Dominan)</text>

  <!-- Kotak Fase Gametofit n (Protalium) -->
  <rect x="370" y="100" width="270" height="120" rx="8" fill="#dcfce7" stroke="#22c55e" stroke-width="1.5"/>
  <text x="380" y="118" font-size="10" font-weight="bold" fill="#166534">Fase Gametofit (n) - Redusir</text>

  <rect x="455" y="125" width="100" height="24" rx="4" fill="#fff" stroke="#16a34a"/>
  <text x="505" y="141" font-size="10" font-weight="bold" fill="#166534" text-anchor="middle">Spora (n)</text>

  <line x1="505" y1="149" x2="505" y2="162" stroke="#15803d" stroke-width="1.5" marker-end="url(#arM)"/>

  <rect x="425" y="162" width="160" height="26" rx="4" fill="#fff" stroke="#16a34a"/>
  <text x="505" y="179" font-size="11" font-weight="bold" fill="#15803d" text-anchor="middle">Protalium (n)</text>

  <text x="430" y="205" font-size="9" font-weight="bold" fill="#15803d">Anteridium (♂)</text>
  <text x="540" y="205" font-size="9" font-weight="bold" fill="#15803d">Arkegonium (♀)</text>

  <!-- Kotak Fase Sporofit 2n (Tumbuhan Paku) -->
  <rect x="370" y="230" width="270" height="160" rx="8" fill="#fef3c7" stroke="#f59e0b" stroke-width="1.5"/>
  <text x="380" y="248" font-size="10" font-weight="bold" fill="#92400e">Fase Sporofit (2n) - Tumbuhan Paku Sejati</text>

  <rect x="455" y="258" width="100" height="24" rx="4" fill="#fff" stroke="#d97706"/>
  <text x="505" y="274" font-size="10" font-weight="bold" fill="#b45309" text-anchor="middle">Zigot (2n)</text>

  <line x1="505" y1="282" x2="505" y2="294" stroke="#d97706" stroke-width="1.5" marker-end="url(#arM)"/>

  <rect x="415" y="294" width="180" height="28" rx="4" fill="#f59e0b" stroke="#b45309"/>
  <text x="505" y="312" font-size="11" font-weight="bold" fill="#fff" text-anchor="middle">Tumbuhan Paku Dewasa (2n)</text>

  <line x1="505" y1="322" x2="505" y2="334" stroke="#d97706" stroke-width="1.5" marker-end="url(#arM)"/>

  <rect x="430" y="334" width="150" height="24" rx="4" fill="#fff" stroke="#d97706"/>
  <text x="505" y="350" font-size="10" font-weight="bold" fill="#b45309" text-anchor="middle">Sporofil / Sorus (2n)</text>

  <line x1="505" y1="358" x2="505" y2="368" stroke="#d97706" stroke-width="1.5" marker-end="url(#arM)"/>

  <rect x="430" y="368" width="150" height="20" rx="4" fill="#fef3c7" stroke="#d97706"/>
  <text x="505" y="382" font-size="9" font-weight="bold" fill="#b45309" text-anchor="middle">Sporangium → Meiosis</text>
</svg>'''

with open('public/soal-smp/metagenesis-lumut-paku.svg', 'w') as f:
    f.write(svg_metagenesis)

# 8. Perkembangbiakan Vegetatif Tumbuhan
svg_veg = '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 680 400" width="100%" height="100%" style="background:#ffffff; font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <rect width="680" height="400" fill="#f8fafc" rx="12" stroke="#e2e8f0" stroke-width="2"/>
  <text x="340" y="26" text-anchor="middle" font-size="15" font-weight="bold" fill="#0f172a">MACAM-MACAM PERKEMBANGBIAKAN VEGETATIF ALAMI PADA TUMBUHAN</text>
  <text x="340" y="43" text-anchor="middle" font-size="11" fill="#64748b">Asesmen Kurikulum Merdeka Fase D — IPA SMP Kelas 9</text>

  <!-- Panel A: Rhizoma (Rimpang) Jahe / Kunyit -->
  <rect x="30" y="60" width="290" height="150" rx="8" fill="#fffbeb" stroke="#fde68a" stroke-width="1.5"/>
  <text x="45" y="82" font-size="12" font-weight="bold" fill="#b45309">A. Rhizoma (Rimpang)</text>
  <text x="45" y="98" font-size="10" fill="#78350f">Batang tumbuh menjalar di bawah tanah berbuku-buku.</text>
  <!-- Bentuk rimpang -->
  <path d="M 60 160 C 90 140, 140 165, 180 145 C 220 125, 260 155, 280 145" fill="none" stroke="#d97706" stroke-width="18" stroke-linecap="round"/>
  <!-- Tunas & Daun -->
  <path d="M 140 145 C 135 120, 145 105, 150 100 C 155 105, 165 120, 160 145 Z" fill="#22c55e"/>
  <text x="175" y="195" font-size="10.5" font-weight="bold" fill="#92400e">Contoh: Jahe, Kunyit, Lengkuas</text>

  <!-- Panel B: Stolon / Geragih (Stroberi / Pegagan) -->
  <rect x="360" y="60" width="290" height="150" rx="8" fill="#ecfdf5" stroke="#a7f3d0" stroke-width="1.5"/>
  <text x="375" y="82" font-size="12" font-weight="bold" fill="#047857">B. Stolon (Geragih)</text>
  <text x="375" y="98" font-size="10" fill="#065f46">Batang beruas-ruas menjalar mendatar di atas tanah.</text>
  <!-- Batang stolon -->
  <path d="M 390 160 C 440 135, 480 135, 530 160 C 560 140, 600 140, 620 160" fill="none" stroke="#10b981" stroke-width="4"/>
  <!-- Tanaman Anakan di buku stolon -->
  <circle cx="390" cy="155" r="8" fill="#15803d"/>
  <circle cx="530" cy="155" r="8" fill="#15803d"/>
  <circle cx="620" cy="155" r="6" fill="#15803d"/>
  <path d="M 530 148 C 520 125, 540 120, 530 110" stroke="#22c55e" stroke-width="2.5" fill="none"/>
  <text x="505" y="195" font-size="10.5" font-weight="bold" fill="#065f46" text-anchor="middle">Contoh: Stroberi, Arbei, Pegagan</text>

  <!-- Panel C: Umbi Lapis (Bawang Merah) -->
  <rect x="30" y="225" width="290" height="155" rx="8" fill="#fdf2f8" stroke="#fbcfe8" stroke-width="1.5"/>
  <text x="45" y="247" font-size="12" font-weight="bold" fill="#be185d">C. Umbi Lapis (Bulbus)</text>
  <text x="45" y="263" font-size="10" fill="#831843">Modifikasi batang (cakram) dan daun berlapis-lapis tebal.</text>
  <!-- Lapisan daun bawang -->
  <ellipse cx="175" cy="320" rx="35" ry="30" fill="#f43f5e" opacity="0.4"/>
  <ellipse cx="175" cy="320" rx="25" ry="24" fill="#f43f5e" opacity="0.6"/>
  <ellipse cx="175" cy="320" rx="15" ry="16" fill="#f43f5e"/>
  <!-- Akar serabut & tunas -->
  <path d="M 175 296 L 175 275" stroke="#22c55e" stroke-width="3"/>
  <path d="M 165 350 L 160 365 M 175 350 L 175 368 M 185 350 L 190 365" stroke="#ca8a04" stroke-width="1.8"/>
  <text x="175" y="372" font-size="10.5" font-weight="bold" fill="#9d174d" text-anchor="middle">Contoh: Bawang Merah, Bawang Putih, Tulip</text>

  <!-- Panel D: Tunas Adventif Daun (Cocor Bebek) -->
  <rect x="360" y="225" width="290" height="155" rx="8" fill="#f0fdf4" stroke="#bbf7d0" stroke-width="1.5"/>
  <text x="375" y="247" font-size="12" font-weight="bold" fill="#15803d">D. Tunas Adventif Daun</text>
  <text x="375" y="263" font-size="10" fill="#166534">Tunas tumbuh liar pada lekukan pinggiran helai daun.</text>
  <!-- Daun cocor bebek -->
  <path d="M 420 340 C 400 310, 420 280, 505 280 C 590 280, 610 310, 590 340 C 560 360, 450 360, 420 340 Z" fill="#86efac" stroke="#16a34a" stroke-width="2"/>
  <!-- Tunas kecil di lekukan daun -->
  <circle cx="430" cy="305" r="5" fill="#15803d"/>
  <circle cx="455" cy="285" r="5" fill="#15803d"/>
  <circle cx="555" cy="285" r="5" fill="#15803d"/>
  <circle cx="580" cy="305" r="5" fill="#15803d"/>
  <text x="505" y="372" font-size="10.5" font-weight="bold" fill="#14532d" text-anchor="middle">Contoh: Cocor Bebek (Kalanchoe)</text>
</svg>'''

with open('public/soal-smp/vegetatif-tumbuhan.svg', 'w') as f:
    f.write(svg_veg)

print("Semua SVG Part 2 berhasil dibuat.")
