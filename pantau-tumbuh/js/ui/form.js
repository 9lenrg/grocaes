// Formulir data anak.
import { $ } from './dom.js';
import { num, ageLong, calendarAge } from './format.js';
import { t } from '../i18n/index.js';
import { state } from './state.js';

export const form = $('#form');

export function readInput() {
  return {
    name: form.name.value.trim(),
    sex: form.sex.value,
    birthDate: form.birth.value,
    measureDate: form.measure.value,
    weightKg: num(form.weight.value),
    lengthCm: num(form.length.value),
    position: form.position.value,
  };
}

export function autoPosition() {
  if (state.posTouched || !form.birth.value || !form.measure.value) return;
  const days = (Date.parse(form.measure.value) - Date.parse(form.birth.value)) / 86400000;
  if (Number.isFinite(days) && days >= 0) form.position.value = days < 730.5 ? 'lying' : 'standing';
}

/** Tampilkan usia anak (tahun dan bulan) pada tanggal pengukuran. */
export function updateAge() {
  const out = $('#age-out');
  const b = form.birth.value;
  if (!b) {
    out.hidden = true;
    return;
  }
  const on = form.measure.value || new Date().toLocaleDateString('sv-SE');
  const a = calendarAge(b, on);
  out.classList.toggle('bad', !a);
  out.textContent = a ? `${t('form.age')}: ${ageLong(b, on)}` : t('error.age_negative');
  out.hidden = false;
}
