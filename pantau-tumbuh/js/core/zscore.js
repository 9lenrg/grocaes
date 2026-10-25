// Mesin hitung z-score pertumbuhan anak (metode LMS WHO).
// Fungsi murni tanpa DOM, sehingga bisa diuji di Node dan dipakai di browser.

/** Indikator yang memakai koreksi WHO untuk |z| > 3 (berbasis berat badan). */
const SD3_ADJUST = { lfa: false, hfa: false, wfa: true, wfl: true, wfh: true };

/** Batas nilai tidak masuk akal secara biologis (flag WHO). [min, max] */
const PLAUSIBLE = { haz: [-6, 6], waz: [-6, 5], whz: [-5, 5] };

/** Batas validasi input kasar untuk menangkap salah ketik. */
const INPUT_LIMITS = { weightKg: [0.5, 30], lengthCm: [35, 135] };

const DAYS_PER_MONTH = 30.4375;
const POSITION_OFFSET_CM = 0.7;

/** Nilai pengukuran pada z tertentu: y = M(1 + L*S*z)^(1/L). */
export function lmsToValue(z, { L, M, S }) {
  if (L === 0) return M * Math.exp(S * z);
  return M * Math.pow(1 + L * S * z, 1 / L);
}

/** z-score mentah: ((y/M)^L - 1) / (L*S). */
export function rawZ(y, { L, M, S }) {
  if (L === 0) return Math.log(y / M) / S;
  return (Math.pow(y / M, L) - 1) / (L * S);
}

/** z-score dengan koreksi WHO untuk nilai ekstrem (|z| > 3) pada indikator berbasis berat. */
export function zscore(indicator, y, lms) {
  const z = rawZ(y, lms);
  if (!SD3_ADJUST[indicator] || Math.abs(z) <= 3) return z;
  if (z > 3) {
    const sd3 = lmsToValue(3, lms);
    const sd23 = sd3 - lmsToValue(2, lms);
    return 3 + (y - sd3) / sd23;
  }
  const sd3n = lmsToValue(-3, lms);
  const sd23n = lmsToValue(-2, lms) - sd3n;
  return -3 + (y - sd3n) / sd23n;
}

/** Kunci umur pada tabel: bulan (tabel bulanan) atau hari (tabel harian). */
export function ageKey(table, ageDays) {
  return table.unit === 'day' ? ageDays : daysToMonths(ageDays);
}

/**
 * Ambil L, M, S dari tabel seragam {start, step, rows:[[L,M,S],...]} pada nilai x,
 * dengan interpolasi linear. Mengembalikan null jika x di luar rentang tabel.
 */
export function lookupLMS(table, x) {
  const { start, step, rows } = table;
  const idx = (x - start) / step;
  if (!Number.isFinite(idx) || idx < -1e-6 || idx > rows.length - 1 + 1e-6) return null;
  const c = Math.min(Math.max(idx, 0), rows.length - 1);
  const i0 = Math.floor(c + 1e-9);
  const i1 = Math.min(i0 + 1, rows.length - 1);
  const f = Math.max(c - i0, 0);
  const a = rows[i0];
  const b = rows[i1];
  const mix = (k) => a[k] + (b[k] - a[k]) * f;
  return { L: mix(0), M: mix(1), S: mix(2) };
}

/** Umur dalam hari antara dua tanggal ISO (YYYY-MM-DD). */
export function ageInDays(birthISO, measureISO) {
  const b = Date.parse(`${birthISO}T00:00:00Z`);
  const m = Date.parse(`${measureISO}T00:00:00Z`);
  if (Number.isNaN(b) || Number.isNaN(m)) return NaN;
  return Math.round((m - b) / 86400000);
}

export const daysToMonths = (days) => days / DAYS_PER_MONTH;

/**
 * Klasifikasi status gizi berdasarkan z-score.
 * level: 0 normal, 1 perlu dipantau, 2 perlu perhatian, 3 segera ke tenaga kesehatan.
 * Ambang mengikuti WHO dan Permenkes RI No. 2 Tahun 2020 (Standar Antropometri Anak).
 */
export function classify(indicator, z) {
  if (indicator === 'haz') {
    if (z < -3) return { code: 'severely_stunted', level: 3 };
    if (z < -2) return { code: 'stunted', level: 2 };
    if (z > 3) return { code: 'tall', level: 1 };
    return { code: 'normal', level: 0 };
  }
  if (indicator === 'waz') {
    if (z < -3) return { code: 'severely_underweight', level: 3 };
    if (z < -2) return { code: 'underweight', level: 2 };
    if (z > 1) return { code: 'overweight_risk', level: 1 };
    return { code: 'normal', level: 0 };
  }
  if (indicator === 'whz') {
    if (z < -3) return { code: 'severely_wasted', level: 3 };
    if (z < -2) return { code: 'wasted', level: 2 };
    if (z > 3) return { code: 'obese', level: 3 };
    if (z > 2) return { code: 'overweight', level: 2 };
    if (z > 1) return { code: 'overweight_risk', level: 1 };
    return { code: 'normal', level: 0 };
  }
  throw new Error(`Indikator tidak dikenal: ${indicator}`);
}

export function isImplausible(indicator, z) {
  const [lo, hi] = PLAUSIBLE[indicator];
  return z < lo || z > hi;
}

/**
 * Hitung status pertumbuhan seorang anak.
 *
 * input: { sex: 'm'|'f', birthDate, measureDate, weightKg, lengthCm, position: 'lying'|'standing' }
 * data:  { tables: { lfa:{m,f}, hfa:{m,f}, wfa:{m,f}, wfl:{m,f}, wfh:{m,f} } }
 *        lfa = panjang/umur 0-2 th, hfa = tinggi/umur 2-5 th, wfl = berat/panjang 0-2 th, wfh = berat/tinggi 2-5 th
 *
 * Mengembalikan { errors: [kode...] } bila input bermasalah, selain itu hasil lengkap.
 */
export function assess(input, data) {
  const { sex, birthDate, measureDate, weightKg, lengthCm, position } = input;
  const errors = [];

  if (sex !== 'm' && sex !== 'f') errors.push('sex_required');
  const ageDays = ageInDays(birthDate, measureDate);
  if (!Number.isFinite(ageDays)) errors.push('date_invalid');
  else if (ageDays < 0) errors.push('age_negative');

  const [wMin, wMax] = INPUT_LIMITS.weightKg;
  const [lMin, lMax] = INPUT_LIMITS.lengthCm;
  if (!Number.isFinite(weightKg) || weightKg < wMin || weightKg > wMax) errors.push('weight_range');
  if (!Number.isFinite(lengthCm) || lengthCm < lMin || lengthCm > lMax) errors.push('length_range');
  if (errors.length) return { errors };

  // Panjang diukur berbaring (<2 th), tinggi diukur berdiri (>=2 th); koreksi 0,7 cm bila tidak sesuai.
  const under2 = ageDays < 730.5;
  let adjustedLength = lengthCm;
  let lengthCorrection = 0;
  if (under2 && position === 'standing') lengthCorrection = POSITION_OFFSET_CM;
  if (!under2 && position === 'lying') lengthCorrection = -POSITION_OFFSET_CM;
  adjustedLength = lengthCm + lengthCorrection;

  const tablesUsed = { haz: under2 ? 'lfa' : 'hfa', waz: 'wfa', whz: under2 ? 'wfl' : 'wfh' };
  const indicators = {};

  // xKind: 'age' (umur) atau 'length' (panjang/tinggi yang sudah dikoreksi)
  const compute = (name, tableKey, xKind, y) => {
    const table = data?.tables?.[tableKey]?.[sex];
    if (!table) {
      indicators[name] = { unavailable: true };
      return;
    }
    const lms = lookupLMS(table, xKind === 'age' ? ageKey(table, ageDays) : adjustedLength);
    if (!lms) {
      indicators[name] = { outOfRange: true };
      return;
    }
    const z = zscore(tableKey, y, lms);
    if (isImplausible(name, z)) {
      indicators[name] = { z, implausible: true };
      return;
    }
    indicators[name] = { z, ...classify(name, z) };
  };

  compute('haz', tablesUsed.haz, 'age', adjustedLength);
  compute('waz', tablesUsed.waz, 'age', weightKg);
  compute('whz', tablesUsed.whz, 'length', weightKg);

  const levels = Object.values(indicators)
    .filter((r) => typeof r.level === 'number')
    .map((r) => r.level);
  const worstLevel = levels.length ? Math.max(...levels) : null;

  return { errors: [], ageDays, adjustedLength, lengthCorrection, tablesUsed, indicators, worstLevel };
}
