// Hasil perhitungan: kartu indikator, kurva, dan tombol lihat riwayat.
import { assess } from '../core/zscore.js';
import { t, getLang } from '../i18n/index.js';
import { renderDiet } from './diet.js';
import { $, esc } from './dom.js';
import { readInput } from './form.js';
import { ageLong } from './format.js';
import { chartFor, indicatorCard, overallBox, adjustedNote } from './measure.js';
import { state, INDICATORS } from './state.js';

export const resultEl = $('#result');

export function showErrors(codes) {
  const box = $('#errors');
  if (!codes.length) {
    box.hidden = true;
    box.innerHTML = '';
    return;
  }
  box.innerHTML = `<strong>${esc(t('error.title'))}</strong><ul>${codes.map((c) => `<li>${esc(t(`error.${c}`))}</li>`).join('')}</ul>`;
  box.hidden = false;
}

export function renderChart() {
  const holder = $('#chart-holder');
  if (!holder || !state.last) return;
  holder.innerHTML = chartFor(state.chartKind, state.last.input, state.last.res);
  document.querySelectorAll('[data-chart]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.chart === state.chartKind)));
}

export function renderResult() {
  const { input, res } = state.last;
  const name = input.name || t('history.unnamed');

  resultEl.innerHTML = `
    <h2>${esc(t('result.title'))}: ${esc(name)}</h2>
    <p class="meta">${esc(t('result.age'))}: <strong>${esc(ageLong(input.birthDate, input.measureDate))}</strong> (${res.ageDays} ${getLang() === 'id' ? 'hari' : 'days'})</p>
    ${overallBox(res)}
    <div class="ind-grid">${INDICATORS.map((k) => indicatorCard(k, res.indicators[k])).join('')}</div>
    ${adjustedNote(res)}
    <h3 class="chart-h">${esc(t('chart.title'))}</h3>
    <div class="tabs" role="group" aria-label="${esc(t('chart.title'))}">
      ${INDICATORS.map((k) => `<button type="button" class="tab" data-chart="${k}" aria-pressed="${k === state.chartKind}">${esc(t(`ind.${k}.short`))}</button>`).join('')}
    </div>
    <div id="chart-holder" class="chart"></div>
    <p class="hint">${esc(t('chart.legend'))}</p>
    <div class="actions">
      <button type="button" class="btn primary" id="result-view-btn">${esc(t('history.view'))}</button>
    </div>
    <p class="disclaimer">${esc(t('result.disclaimer'))}</p>`;
  resultEl.hidden = false;
  renderChart();
  renderDiet($('#diet'), res);
}

export function onSubmit(e) {
  e.preventDefault();
  if (!state.data) {
    $('#banner').hidden = false;
    $('#banner').scrollIntoView({ block: 'center' });
    return;
  }
  const input = readInput();
  const res = assess(input, state.data);
  showErrors(res.errors);
  if (res.errors.length) return;
  state.last = { input, res };
  renderResult();
  resultEl.focus({ preventScroll: true });
  resultEl.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' });
}
