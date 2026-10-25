// Memeriksa data WHO asli di data/who-lms.json (hasil tools/build_data.py).
// Nilai acuan di bawah disalin dari baris pertama file Excel resmi WHO yang diunggah.
// Dilewati otomatis bila data belum dibuat.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { lookupLMS, lmsToValue, zscore, assess } from '../js/core/zscore.js';

const path = new URL('../data/who-lms.json', import.meta.url);
const skip = !existsSync(path);
const data = skip ? null : JSON.parse(readFileSync(path, 'utf8'));
const close = (a, b, eps) => assert.ok(Math.abs(a - b) < eps, `${a} != ${b}`);

test('baris acuan sama persis dengan file WHO', { skip }, () => {
  assert.deepEqual(lookupLMS(data.tables.wfl.m, 45), { L: -0.3521, M: 2.441, S: 0.09182 });
  assert.deepEqual(lookupLMS(data.tables.wfa.m, 0), { L: 0.3487, M: 3.3464, S: 0.14602 });
  assert.deepEqual(lookupLMS(data.tables.wfa.f, 0), { L: 0.3809, M: 3.2322, S: 0.14171 });
  assert.deepEqual(lookupLMS(data.tables.hfa.f, 24), { L: 1, M: 85.7153, S: 0.03764 });
  assert.deepEqual(lookupLMS(data.tables.hfa.m, 24), { L: 1, M: 87.1161, S: 0.03507 });
  assert.deepEqual(lookupLMS(data.tables.wfh.m, 65), { L: -0.3521, M: 7.4327, S: 0.08217 });
  assert.deepEqual(lookupLMS(data.tables.wfh.f, 65), { L: -0.3833, M: 7.2402, S: 0.09113 });
});

test('rentang dan satuan tabel sesuai harapan', { skip }, () => {
  const span = (t) => [t.start, t.start + t.step * (t.rows.length - 1)];
  for (const s of ['m', 'f']) {
    assert.deepEqual(span(data.tables.wfa[s]), [0, 60]);
    assert.deepEqual(span(data.tables.hfa[s]), [24, 60]);
    assert.deepEqual(span(data.tables.wfl[s]), [45, 110]);
    assert.deepEqual(span(data.tables.wfh[s]), [65, 120]);
    assert.equal(data.tables.wfa[s].unit, 'month');
    assert.equal(data.tables.wfl[s].unit, 'cm');
  }
});

test('semua nilai L, M, S berhingga dan M positif', { skip }, () => {
  for (const [name, bySex] of Object.entries(data.tables)) {
    for (const [sex, t] of Object.entries(bySex)) {
      for (const [L, M, S] of t.rows) {
        assert.ok(Number.isFinite(L) && Number.isFinite(M) && Number.isFinite(S) && M > 0 && S > 0, `${name}/${sex}`);
      }
    }
  }
});

test('hitung ulang nilai SD WHO: baris pertama wfl laki-laki (45 cm)', { skip }, () => {
  // Kolom SD WHO baris 45 cm (dibulatkan 1 desimal): -3 SD=1.9, -2 SD=2.0, 0=2.4, +1=2.7, +2=3.0
  const lms = lookupLMS(data.tables.wfl.m, 45);
  const expected = { '-3': 1.9, '-2': 2.0, '0': 2.4, '1': 2.7, '2': 3.0 };
  for (const [z, v] of Object.entries(expected)) close(lmsToValue(Number(z), lms), v, 0.0501);
});

test('anak tepat di median WHO mendapat z = 0', { skip }, () => {
  const lms = lookupLMS(data.tables.wfa.f, 6);
  close(zscore('wfa', lms.M, lms), 0, 1e-9);
});

test('assess dengan data asli: anak 6 bulan, kasus wajar dan tabel lfa belum ada', { skip }, () => {
  const r = assess({ sex: 'f', birthDate: '2026-04-19', measureDate: '2026-10-19', weightKg: 7.3, lengthCm: 66, position: 'lying' }, data);
  assert.deepEqual(r.errors, []);
  assert.equal(r.tablesUsed.whz, 'wfl');
  assert.ok(Number.isFinite(r.indicators.waz.z));
  assert.ok(Number.isFinite(r.indicators.whz.z));
  // Selama tabel lfa (0-2 th) belum dipasang, TB/U anak <2 th ditandai tidak tersedia, bukan ditebak.
  if (!data.tables.lfa) assert.equal(r.indicators.haz.unavailable, true);
});

test('anak 3 tahun memakai hfa, wfa, wfh', { skip }, () => {
  const r = assess({ sex: 'm', birthDate: '2023-10-19', measureDate: '2026-10-19', weightKg: 14.5, lengthCm: 94, position: 'standing' }, data);
  assert.deepEqual(r.errors, []);
  assert.deepEqual(r.tablesUsed, { haz: 'hfa', waz: 'wfa', whz: 'wfh' });
  for (const k of ['haz', 'waz', 'whz']) assert.ok(Number.isFinite(r.indicators[k].z), k);
});
