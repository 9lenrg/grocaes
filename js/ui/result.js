// Hasil perhitungan: kartu indikator, kurva, simpan ke riwayat.
import * as store from '../core/storage.js';
import { assess, ageKey } from '../core/zscore.js';
import { t, getLang } from '../i18n/index.js';
import { buildChart } from './chart.js';
import { renderDiet } from './diet.js';
import { $, esc } from './dom.js';
import { readInput } from './form.js';
import { fmtZ, fmtNum, ageLong } from './format.js';
import { state, INDICATORS, LEVEL_ICON } from './state.js';

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

function indicatorCard(kind, r) {
  const head = `<h3>${esc(t(`ind.${kind}.title`))} <span class="abbr">${esc(t(`ind.${kind}.short`))}</span></h3>`;
  const desc = `<p class="desc">${esc(t(`ind.${kind}.desc`))}</p>`;
  if (r.unavailable) return `<article class="ind level-na">${head}<p>${esc(t('result.unavailable'))}</p></article>`;
  if (r.outOfRange) return `<article class="ind level-na">${head}<p>${esc(t('result.outofrange'))}</p></article>`;
  if (r.implausible) {
    return `<article class="ind level-na">${head}<p class="status">${esc(t('result.implausible'))}</p><p class="z">${esc(t('result.z'))}: ${esc(fmtZ(r.z))}</p></article>`;
  }
  return `<article class="ind level-${r.level}">${head}
    <p class="status"><span class="icon" aria-hidden="true">${LEVEL_ICON[r.level]}</span> ${esc(t(`status.${r.code}`))}</p>
    <p class="z">${esc(t('result.z'))}: <strong>${esc(fmtZ(r.z))}</strong></p>${desc}</article>`;
}

function chartFor(kind) {
  const { input, res } = state.last;
  const key = res.tablesUsed[kind];
  const table = state.data.tables[key]?.[input.sex];
  const r = res.indicators[kind];
  if (!table || r.unavailable) return '';
  const isAge = kind !== 'whz';
  const point = r.outOfRange ? null : isAge ? { x: ageKey(table, res.ageDays), y: kind === 'haz' ? res.adjustedLength : input.weightKg } : { x: res.adjustedLength, y: input.weightKg };
  return buildChart({
    table,
    point,
    labels: {
      x: t(isAge ? 'chart.x.age' : 'chart.x.len'),
      y: t(kind === 'haz' ? 'chart.y.cm' : 'chart.y.kg'),
      point: t('chart.point'),
      alt: t('chart.alt', { ind: t(`ind.${kind}.title`), z: typeof r.z === 'number' ? fmtZ(r.z) : '-' }),
    },
  });
}

export function renderChart() {
  const holder = $('#chart-holder');
  if (!holder || !state.last) return;
  holder.innerHTML = chartFor(state.chartKind);
  document.querySelectorAll('[data-chart]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.chart === state.chartKind)));
}

export function renderResult() {
  const { input, res } = state.last;
  const worst = res.worstLevel;
  const name = input.name || t('history.unnamed');
  const adjusted = res.lengthCorrection ? `<p class="hint">${esc(t('result.adjusted', { v: res.lengthCorrection > 0 ? `+${fmtNum(res.lengthCorrection)}` : fmtNum(res.lengthCorrection) }))}</p>` : '';
  const incomplete = INDICATORS.some((k) => typeof res.indicators[k].level !== 'number');
  const incompleteNote = incomplete ? `<p class="incomplete">${esc(t('result.incomplete'))}</p>` : '';
  const overall =
    worst === null
      ? ''
      : `<div class="overall level-${worst}"><p class="overall-label"><span class="icon" aria-hidden="true">${LEVEL_ICON[worst]}</span> ${esc(t('result.overall'))}: ${esc(t(`level.${worst}`))}</p><p>${esc(t(`advice.${worst}`))}</p>${incompleteNote}</div>`;

  resultEl.innerHTML = `
    <h2>${esc(t('result.title'))}: ${esc(name)}</h2>
    <p class="meta">${esc(t('result.age'))}: <strong>${esc(ageLong(input.birthDate, input.measureDate))}</strong> (${res.ageDays} ${getLang() === 'id' ? 'hari' : 'days'})</p>
    ${overall}
    <div class="ind-grid">${INDICATORS.map((k) => indicatorCard(k, res.indicators[k])).join('')}</div>
    ${adjusted}
    <h3 class="chart-h">${esc(t('chart.title'))}</h3>
    <div class="tabs" role="group" aria-label="${esc(t('chart.title'))}">
      ${INDICATORS.map((k) => `<button type="button" class="tab" data-chart="${k}" aria-pressed="${k === state.chartKind}">${esc(t(`ind.${k}.short`))}</button>`).join('')}
    </div>
    <div id="chart-holder" class="chart"></div>
    <p class="hint">${esc(t('chart.legend'))}</p>
    <div class="actions">
      <button type="button" class="btn primary" id="save-btn">${esc(t('result.save'))}</button>
      <span id="save-msg" class="save-msg" role="status"></span>
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

export function onSave() {
  if (!state.last) return;
  const { input, res } = state.last;
  const summary = {};
  for (const k of INDICATORS) {
    const r = res.indicators[k];
    if (typeof r.level === 'number') summary[k] = { z: r.z, code: r.code, level: r.level };
  }
  const ok = store.saveRecord(
    { name: input.name || t('history.unnamed'), sex: input.sex, birthDate: input.birthDate },
    { date: input.measureDate, ageDays: res.ageDays, weightKg: input.weightKg, lengthCm: input.lengthCm, position: input.position, summary, worstLevel: res.worstLevel },
  );
  $('#save-msg').textContent = t(ok ? 'result.saved' : 'result.savefail');
}
