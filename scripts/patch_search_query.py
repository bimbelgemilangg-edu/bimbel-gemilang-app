with open('src/pages/admin/tobk/KelolaTobkPublikPage.jsx', 'r', encoding='utf-8') as f:
    text = f.read()

# Update matchQuery
old_match = """      const matchQuery =
        (l.nama || '').toLowerCase().includes(q) ||
        (l.whatsapp || '').includes(q) ||
        (l.asalSekolah || '').toLowerCase().includes(q) ||
        (l.kota || '').toLowerCase().includes(q) ||
        (l.targetPtn || '').toLowerCase().includes(q);"""

new_match = """      const matchQuery =
        !q ||
        (l.nama || '').toLowerCase().includes(q) ||
        (l.whatsapp || '').includes(q) ||
        (l.asalSekolah || '').toLowerCase().includes(q) ||
        (l.kota || '').toLowerCase().includes(q) ||
        (l.targetPtn || '').toLowerCase().includes(q) ||
        (l.pesertaId || '').toLowerCase().includes(q) ||
        (l.id || '').toLowerCase().includes(q);"""

assert old_match in text, 'old_match not found'
text = text.replace(old_match, new_match, 1)

with open('src/pages/admin/tobk/KelolaTobkPublikPage.jsx', 'w', encoding='utf-8') as f:
    f.write(text)

print('Updated matchQuery successfully!')
