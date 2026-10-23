// Penyimpanan lokal (localStorage). Data anak tidak pernah dikirim ke server.
const KEY = 'pantau-tumbuh:v1';

function read() {
  try {
    const raw = localStorage.getItem(KEY);
    const parsed = raw ? JSON.parse(raw) : null;
    return parsed && Array.isArray(parsed.children) ? parsed : { children: [] };
  } catch {
    return { children: [] };
  }
}

function write(state) {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
    return true;
  } catch {
    return false;
  }
}

const newId = () => `c${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;

export function listChildren() {
  return read().children;
}

/** Simpan satu pengukuran. Anak yang sama (nama + jenis kelamin + tanggal lahir) digabung. */
export function saveRecord(child, record) {
  const state = read();
  const key = `${child.name.trim().toLowerCase()}|${child.sex}|${child.birthDate}`;
  let found = state.children.find((c) => `${c.name.trim().toLowerCase()}|${c.sex}|${c.birthDate}` === key);
  if (!found) {
    found = { id: newId(), name: child.name.trim(), sex: child.sex, birthDate: child.birthDate, records: [] };
    state.children.push(found);
  }
  const existing = found.records.findIndex((r) => r.date === record.date);
  if (existing >= 0) found.records[existing] = record;
  else found.records.push(record);
  found.records.sort((a, b) => a.date.localeCompare(b.date));
  return write(state);
}

export function deleteChild(id) {
  const state = read();
  state.children = state.children.filter((c) => c.id !== id);
  return write(state);
}

// Riwayat pesan konsultasi (hanya di browser ini).
const MSG_KEY = 'pantau-tumbuh:consult:v1';

export function listMessages() {
  try {
    const parsed = JSON.parse(localStorage.getItem(MSG_KEY) || '[]');
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function addMessage(msg) {
  try {
    const all = [{ id: newId(), ...msg }, ...listMessages()].slice(0, 50);
    localStorage.setItem(MSG_KEY, JSON.stringify(all));
    return true;
  } catch {
    return false;
  }
}

export function clearMessages() {
  try {
    localStorage.removeItem(MSG_KEY);
    return true;
  } catch {
    return false;
  }
}
