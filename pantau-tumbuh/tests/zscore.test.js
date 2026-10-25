// CATATAN: semua angka LMS di file ini SINTETIS. Dipakai hanya untuk memeriksa
// kebenaran rumus matematika, BUKAN nilai acuan WHO.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { zscore, rawZ, lmsToValue, lookupLMS, ageKey, ageInDays, classify, isImplausible, assess } from '../js/core/zscore.js';
import { buildChart } from '../js/ui/chart.js';

const close = (a, b, eps = 1e-9) => assert.ok(Math.abs(a - b) < eps, `${a} != ${b}`);

const LMS_A = { L: 0.35, M: 12, S: 0.11 };
const LMS_ZERO_L = { L: 0, M: 80, S: 0.04 };

test('z = 0 pada nilai median (M)', () => {
  close(rawZ(12, LMS_A), 0);
  close(rawZ(80, LMS_ZERO_L), 0);
});

test('lmsToValue dan rawZ saling kebalikan (L != 0 dan L = 0)', () => {
  for (const lms of [LMS_A, LMS_ZERO_L]) {
    for (const z of [-3, -2, -1, 0, 1, 2, 3]) close(rawZ(lmsToValue(z, lms), lms), z, 1e-9);
  }
});

test('koreksi WHO untuk |z|>3 pada indikator berbasis berat kontinu di z=3', () => {
  const y3 = lmsToValue(3, LMS_A);
  close(zscore('wfa', y3, LMS_A), 3, 1e-9);
  const sd23 = lmsToValue(3, LMS_A) - lmsToValue(2, LMS_A);
  close(zscore('wfa', y3 + sd23, LMS_A), 4, 1e-9);
  const yn3 = lmsToValue(-3, LMS_A);
  const sd23n = lmsToValue(-2, LMS_A) - yn3;
  close(zscore('wfa', yn3 - sd23n, LMS_A), -4, 1e-9);
});

test('lhfa (tinggi/umur) tidak dikoreksi: memakai z mentah', () => {
  const y = lmsToValue(4, LMS_A);
  close(zscore('lhfa', y, LMS_A), 4, 1e-9);
});

test('lookupLMS: tepat di baris, interpolasi, dan di luar rentang', () => {
  const table = { start: 0, step: 1, rows: [[1, 10, 0.1], [1, 12, 0.1], [1, 14, 0.3]] };
  assert.deepEqual(lookupLMS(table, 1), { L: 1, M: 12, S: 0.1 });
  const mid = lookupLMS(table, 1.5);
  close(mid.M, 13);
  close(mid.S, 0.2);
  assert.equal(lookupLMS(table, -0.5), null);
  assert.equal(lookupLMS(table, 2.5), null);
  const t2 = { start: 45, step: 0.1, rows: Array.from({ length: 11 }, (_, i) => [1, 2 + i * 0.1, 0.1]) };
  close(lookupLMS(t2, 45.3).M, 2.3, 1e-9);
});

test('umur dalam hari', () => {
  assert.equal(ageInDays('2024-01-01', '2024-01-31'), 30);
  assert.equal(ageInDays('2023-01-01', '2024-01-01'), 365);
  assert.ok(Number.isNaN(ageInDays('', '2024-01-01')));
});

test('klasifikasi: batas ambang', () => {
  assert.equal(classify('haz', -3.01).code, 'severely_stunted');
  assert.equal(classify('haz', -3).code, 'stunted');
  assert.equal(classify('haz', -2).code, 'normal');
  assert.equal(classify('haz', 3).code, 'normal');
  assert.equal(classify('haz', 3.01).code, 'tall');
  assert.equal(classify('waz', -2.01).code, 'underweight');
  assert.equal(classify('waz', 1).code, 'normal');
  assert.equal(classify('waz', 1.01).code, 'overweight_risk');
  assert.equal(classify('whz', -3.5).code, 'severely_wasted');
  assert.equal(classify('whz', 1.5).code, 'overweight_risk');
  assert.equal(classify('whz', 2.5).code, 'overweight');
  assert.equal(classify('whz', 3.5).code, 'obese');
  assert.equal(classify('whz', 0).level, 0);
  assert.throws(() => classify('xyz', 0));
});

test('flag nilai tidak masuk akal', () => {
  assert.equal(isImplausible('haz', 6.1), true);
  assert.equal(isImplausible('haz', -6.1), true);
  assert.equal(isImplausible('waz', 5.1), true);
  assert.equal(isImplausible('whz', -5.1), true);
  assert.equal(isImplausible('whz', 0), false);
});

// Tabel sintetis seragam untuk uji assess().
const flatTable = (M, S, L, n, start, step, unit) => ({ unit, start, step, rows: Array.from({ length: n }, () => [L, M, S]) });
const monthly = (M, n, start) => flatTable(M, 0.1, 1, n, start, 1, 'month');
const byCm = (M, n, start) => flatTable(M, 0.1, 1, n, start, 0.1, 'cm');
const sexes = (table) => ({ m: table, f: table });
const synthetic = {
  tables: {
    lfa: sexes(monthly(80, 25, 0)),
    hfa: sexes(monthly(80, 37, 24)),
    wfa: sexes(monthly(10, 61, 0)),
    wfl: sexes(byCm(10, 651, 45)),
    wfh: sexes(byCm(10, 551, 65)),
  },
};
const base = { sex: 'm', birthDate: '2024-01-01', measureDate: '2024-07-01', weightKg: 10, lengthCm: 80, position: 'lying' };

test('assess: anak tepat di median -> semua z = 0 dan normal', () => {
  const r = assess(base, synthetic);
  assert.deepEqual(r.errors, []);
  for (const k of ['haz', 'waz', 'whz']) {
    close(r.indicators[k].z, 0, 1e-9);
    assert.equal(r.indicators[k].code, 'normal');
  }
  assert.equal(r.worstLevel, 0);
  assert.equal(r.tablesUsed.whz, 'wfl');
  assert.equal(r.tablesUsed.haz, 'lfa');
});

test('assess: batas 2 tahun memilih tabel lfa/hfa dan wfl/wfh yang benar', () => {
  const day730 = assess({ ...base, birthDate: '2022-01-01', measureDate: '2023-12-31' }, synthetic); // 729 hari
  const day731 = assess({ ...base, birthDate: '2022-01-01', measureDate: '2024-01-02', position: 'standing' }, synthetic); // 731 hari
  assert.equal(day730.tablesUsed.haz, 'lfa');
  assert.equal(day730.tablesUsed.whz, 'wfl');
  assert.equal(day731.tablesUsed.haz, 'hfa');
  assert.equal(day731.tablesUsed.whz, 'wfh');
});

test('tabel bulanan: umur hari dikonversi ke bulan lalu diinterpolasi', () => {
  const table = { unit: 'month', start: 0, step: 1, rows: [[1, 10, 0.1], [1, 12, 0.1], [1, 14, 0.1]] };
  assert.equal(ageKey(table, 30.4375), 1);
  close(lookupLMS(table, ageKey(table, 30.4375 * 1.5)).M, 13);
  assert.equal(lookupLMS(table, ageKey(table, 30.4375 * 2.5)), null);
});

test('assess: >=2 tahun memakai wfh; koreksi 0,7 cm sesuai cara ukur', () => {
  const old = { ...base, birthDate: '2022-01-01', measureDate: '2024-07-01', position: 'standing' };
  const r = assess(old, synthetic);
  assert.equal(r.tablesUsed.whz, 'wfh');
  assert.equal(r.lengthCorrection, 0);
  const lyingOld = assess({ ...old, position: 'lying' }, synthetic);
  close(lyingOld.adjustedLength, 79.3, 1e-9);
  const standingBaby = assess({ ...base, position: 'standing' }, synthetic);
  close(standingBaby.adjustedLength, 80.7, 1e-9);
});

test('assess: validasi input', () => {
  assert.ok(assess({ ...base, sex: '' }, synthetic).errors.includes('sex_required'));
  assert.ok(assess({ ...base, measureDate: '2023-01-01' }, synthetic).errors.includes('age_negative'));
  assert.ok(assess({ ...base, birthDate: '' }, synthetic).errors.includes('date_invalid'));
  assert.ok(assess({ ...base, weightKg: 150 }, synthetic).errors.includes('weight_range'));
  assert.ok(assess({ ...base, lengthCm: NaN }, synthetic).errors.includes('length_range'));
});

test('assess: stunting terdeteksi dan indikator di luar rentang tabel ditandai', () => {
  const short = assess({ ...base, lengthCm: 66 }, synthetic); // z = (66-80)/(80*0.1)=-1.75 -> normal
  assert.equal(short.indicators.haz.code, 'normal');
  const veryShort = assess({ ...base, lengthCm: 58 }, synthetic); // z=-2.75 -> stunted
  assert.equal(veryShort.indicators.haz.code, 'stunted');
  const late = assess({ ...base, measureDate: '2030-01-01' }, synthetic);
  assert.equal(late.indicators.haz.outOfRange, true);
  const noData = assess(base, { tables: {} });
  assert.equal(noData.indicators.haz.unavailable, true);
  assert.equal(noData.worstLevel, null);
});

test('grafik: SVG valid dan tanpa NaN', () => {
  const labels = { x: 'Umur', y: 'cm', point: 'Anak ini', alt: 'Grafik uji' };
  for (const [unit, start, step, n, x] of [['month', 0, 1, 61, 13], ['day', 0, 1, 1857, 400], ['cm', 45, 0.5, 131, 70]]) {
    const table = { unit, start, step, rows: Array.from({ length: n }, (_, i) => [1, 50 + i * 0.3, 0.04]) };
    const svg = buildChart({ table, point: { x, y: 62 }, labels });
    assert.ok(svg.startsWith('<svg'), unit);
    assert.ok(!svg.includes('NaN'), unit);
    assert.ok(svg.includes('Anak ini'), unit);
    assert.ok(svg.includes('c-z0'), `${unit}: garis median`);
  }
});
