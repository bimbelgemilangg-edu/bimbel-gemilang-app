import os

# 1. Patch src/services/tobkPublikService.js
with open('src/services/tobkPublikService.js', 'r', encoding='utf-8') as f:
    service_text = f.read()

old_query = """export async function ambilSemuaLeadsTobk(eventId = null) {
  try {
    let qRef = collection(db, 'tobk_event_leads');
    if (eventId) {
      qRef = query(qRef, where('eventId', '==', eventId));
    }"""

new_query = """export async function ambilSemuaLeadsTobk(eventId = null) {
  try {
    let qRef = collection(db, 'tobk_event_leads');
    if (eventId && eventId !== 'semua' && eventId !== 'global') {
      qRef = query(qRef, where('eventId', '==', eventId));
    }"""

assert old_query in service_text, 'old_query not found in tobkPublikService.js'
service_text = service_text.replace(old_query, new_query, 1)

old_fallback = """    const locals = getLocalLeads();
    if (eventId) return locals.filter((l) => l.eventId === eventId);
    return locals;"""

new_fallback = """    const locals = getLocalLeads();
    if (eventId && eventId !== 'semua' && eventId !== 'global') return locals.filter((l) => l.eventId === eventId);
    return locals;"""

assert old_fallback in service_text, 'old_fallback not found in tobkPublikService.js'
service_text = service_text.replace(old_fallback, new_fallback, 1)

with open('src/services/tobkPublikService.js', 'w', encoding='utf-8') as f:
    f.write(service_text)

print('Patched tobkPublikService.js successfully!')

# 2. Patch src/pages/admin/tobk/KelolaTobkPublikPage.jsx
with open('src/pages/admin/tobk/KelolaTobkPublikPage.jsx', 'r', encoding='utf-8') as f:
    page_text = f.read()

# Make selectedEventId default to 'semua'
page_text = page_text.replace("const [selectedEventId, setSelectedEventId] = useState('');", "const [selectedEventId, setSelectedEventId] = useState('semua');", 1)

# In muatData, do not force setSelectedEventId(listEvents[0].id) if selectedEventId is 'semua'
old_muat = """      setEvents(listEvents);
      if (listEvents.length > 0 && !selectedEventId) {
        setSelectedEventId(listEvents[0].id);
      }

      const pList = snapPaket.docs?.map((d) => ({ id: d.id, ...d.data() })) || [];
      setPaketBimbelList(pList);

      const activeId = selectedEventId || listEvents[0]?.id;
      if (activeId) {
        const leadData = await ambilSemuaLeadsTobk(activeId);
        setLeads(leadData);
      }"""

new_muat = """      setEvents(listEvents);
      const activeId = selectedEventId || 'semua';
      const leadData = await ambilSemuaLeadsTobk(activeId);
      setLeads(leadData);

      const pList = snapPaket.docs?.map((d) => ({ id: d.id, ...d.data() })) || [];
      setPaketBimbelList(pList);"""

assert old_muat in page_text, 'old_muat not found in KelolaTobkPublikPage.jsx'
page_text = page_text.replace(old_muat, new_muat, 1)

with open('src/pages/admin/tobk/KelolaTobkPublikPage.jsx', 'w', encoding='utf-8') as f:
    f.write(page_text)

print('Patched KelolaTobkPublikPage.jsx successfully!')
