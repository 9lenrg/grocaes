// Memuat tabel acuan WHO (hasil tools/build_data.py).
export async function loadData(url = 'data/who-lms.json') {
  const res = await fetch(url, { cache: 'no-cache' });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const json = await res.json();
  if (!json || typeof json.tables !== 'object') throw new Error('Format data tidak valid');
  return json;
}

/** Indikator utama yang tersedia lengkap untuk kedua jenis kelamin. */
export function coverage(data) {
  const need = ['lfa', 'hfa', 'wfa', 'wfl', 'wfh'];
  return need.filter((k) => data.tables[k]?.m && data.tables[k]?.f);
}
