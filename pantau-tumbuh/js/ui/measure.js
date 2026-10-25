// Bagian tampilan pengukuran yang dipakai bersama: kartu indikator, kurva, dan kesimpulan.
import { ageKey } from '../core/zscore.js';
import { t } from '../i18n/index.js';
import { buildChart } from './chart.js';
import { esc } from './dom.js';
import { fmtZ, fmtNum } from './format.js';
import { state, LEVEL_ICON } from './state.js';

export function indicatorCard(kind, r) {
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

export function chartFor(kind, input, res) {
  if (!state.data) return '';
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

export function overallBox(res) {
  const worst = res.worstLevel;
  if (worst === null) return '';
  const incomplete = ['haz', 'waz', 'whz'].some((k) => typeof res.indicators[k].level !== 'number');
  const note = incomplete ? `<p class="incomplete">${esc(t('result.incomplete'))}</p>` : '';
  return `<div class="overall level-${worst}"><p class="overall-label"><span class="icon" aria-hidden="true">${LEVEL_ICON[worst]}</span> ${esc(t('result.overall'))}: ${esc(t(`level.${worst}`))}</p><p>${esc(t(`advice.${worst}`))}</p>${note}</div>`;
}

export function adjustedNote(res) {
  if (!res.lengthCorrection) return '';
  const v = res.lengthCorrection > 0 ? `+${fmtNum(res.lengthCorrection)}` : fmtNum(res.lengthCorrection);
  return `<p class="hint">${esc(t('result.adjusted', { v }))}</p>`;
}
