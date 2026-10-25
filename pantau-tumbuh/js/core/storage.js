// Riwayat pengukuran sementara, disimpan di memori halaman saja. Data anak tidak pernah dikirim ke server.
// Riwayat hilang otomatis saat tab ditutup atau halaman dimuat ulang (berpindah menu di dalam
// aplikasi tidak memuat ulang halaman, jadi riwayat tetap ada). Tidak ada yang ditulis ke
// localStorage/sessionStorage.

// Versi lama menyimpan riwayat permanen di localStorage. Hapus sisa data itu agar tidak tertinggal.
try {
  localStorage.removeItem('pantau-tumbuh:v1');
  localStorage.removeItem('pantau-tumbuh:consult:v1');
} catch {
  /* penyimpanan tidak tersedia */
}

const children = [];

const newId = () => `c${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;
const keyOf = (c) => `${c.name.trim().toLowerCase()}|${c.sex}|${c.birthDate}`;

export function listChildren() {
  return children;
}

/** Simpan satu pengukuran. Anak yang sama (nama + jenis kelamin + tanggal lahir) digabung. */
export function saveRecord(child, record) {
  let found = findChild(child);
  if (!found) {
    found = { id: newId(), name: child.name.trim(), sex: child.sex, birthDate: child.birthDate, records: [] };
    children.push(found);
  }
  const existing = found.records.findIndex((r) => r.date === record.date);
  if (existing >= 0) found.records[existing] = record;
  else found.records.push(record);
  found.records.sort((a, b) => a.date.localeCompare(b.date));
  return true;
}

/** Cari anak yang sama (nama + jenis kelamin + tanggal lahir); null bila belum tersimpan. */
export function findChild(child) {
  return children.find((c) => keyOf(c) === keyOf(child)) ?? null;
}
