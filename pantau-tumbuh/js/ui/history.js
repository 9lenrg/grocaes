// Riwayat pengukuran: lihat data lengkap dengan grafik, simpan ke perangkat, dan cetak.
import * as store from '../core/storage.js';
import { t } from '../i18n/index.js';
import { $, esc } from './dom.js';
import { todayISO, fmtDate, fmtNum, fmtZ, ageShort, ageLong } from './format.js';
import { chartFor, indicatorCard, overallBox, adjustedNote } from './measure.js';
import { state, INDICATORS, LEVEL_ICON } from './state.js';

// ---- Tampilan riwayat (hanya baca) dan cetak ----

function cell(rec, k) {
  const r = rec.summary?.[k];
  if (!r) return `<td class="na">–</td>`;
  return `<td class="lv level-${r.level}"><span class="icon" aria-hidden="true">${LEVEL_ICON[r.level]}</span> ${esc(t(`status.${r.code}`))} <span class="zv">(z ${esc(fmtZ(r.z))})</span></td>`;
}

function openDialog(title) {
  const dlg = $('#hist-dialog');
  dlg.dataset.title = title;
  if (!dlg.open) {
    if (typeof dlg.showModal === 'function') dlg.showModal();
    else dlg.setAttribute('open', '');
  }
}

function recordsTable(child) {
  const rows = [...child.records].reverse();
  if (!rows.length) return '';
  return `<h3>${esc(t('history.earlier'))}</h3><div class="tbl-wrap"><table class="rec-table">
    <thead><tr>
      <th scope="col">${esc(t('history.col.date'))}</th>
      <th scope="col">${esc(t('history.col.age'))}</th>
      <th scope="col">${esc(t('history.col.weight'))}</th>
      <th scope="col">${esc(t('history.col.length'))}</th>
      <th scope="col">${esc(t('history.col.pos'))}</th>
      ${INDICATORS.map((k) => `<th scope="col">${esc(t(`ind.${k}.short`))}</th>`).join('')}
    </tr></thead>
    <tbody>${rows
      .map(
        (r) => `<tr>
      <th scope="row">${esc(fmtDate(r.date))}</th>
      <td>${esc(ageShort(child.birthDate, r.date))}</td>
      <td>${esc(fmtNum(r.weightKg, 2))}</td>
      <td>${esc(fmtNum(r.lengthCm, 1))}</td>
      <td>${esc(posLabel(r.position))}</td>
      ${INDICATORS.map((k) => cell(r, k)).join('')}</tr>`,
      )
      .join('')}</tbody></table></div>`;
}

const posLabel = (p) => t(`history.pos.${p === 'standing' ? 'standing' : 'lying'}`);

/** Data yang diinput pengguna, kesimpulan, kartu indikator, dan ketiga grafik untuk satu pengukuran. */
function measurementSection(input, res) {
  const charts = INDICATORS.map((k) => {
    const svg = chartFor(k, input, res);
    return svg ? `<figure class="hd-chart"><figcaption>${esc(t(`ind.${k}.short`))}: ${esc(t(`ind.${k}.title`))}</figcaption>${svg}</figure>` : '';
  }).join('');
  return `<section class="hd-section">
    <h3>${esc(t('history.measurement', { date: fmtDate(input.measureDate) }))}</h3>
    <dl class="hd-meta">
      <div><dt>${esc(t('history.age.at'))}</dt><dd>${esc(ageLong(input.birthDate, input.measureDate))}</dd></div>
      <div><dt>${esc(t('history.col.weight'))}</dt><dd>${esc(fmtNum(input.weightKg, 2))}</dd></div>
      <div><dt>${esc(t('history.col.length'))}</dt><dd>${esc(fmtNum(input.lengthCm, 1))}</dd></div>
      <div><dt>${esc(t('history.col.pos'))}</dt><dd>${esc(posLabel(input.position))}</dd></div>
    </dl>
    ${overallBox(res)}
    <div class="ind-grid">${INDICATORS.map((k) => indicatorCard(k, res.indicators[k])).join('')}</div>
    ${adjustedNote(res)}
    <h3>${esc(t('chart.title'))}</h3>
    <div class="hd-charts">${charts}</div>
    <p class="hint">${esc(t('chart.legend'))}</p>
  </section>`;
}

function headerHTML(child, count) {
  return `<div class="hd-brand"><img src="logofix.png" alt="GROCAES" width="1106" height="344"></div>
    <h2 id="hd-title">${esc(t('history.detail.title'))}: ${esc(child.name)}</h2>
    <dl class="hd-meta">
      <div><dt>${esc(t('history.detail.sex'))}</dt><dd>${esc(t(`form.sex.${child.sex}`))}</dd></div>
      <div><dt>${esc(t('history.detail.birth'))}</dt><dd>${esc(fmtDate(child.birthDate))}</dd></div>
      <div><dt>${esc(t('history.detail.age'))}</dt><dd>${esc(ageLong(child.birthDate, todayISO()))}</dd></div>
      ${count ? `<div><dt>${esc(t('history.count', { n: count }))}</dt><dd></dd></div>` : ''}
    </dl>`;
}

function footerHTML() {
  return `<p class="disclaimer">${esc(t('result.disclaimer'))}</p>
    <p class="hint print-only">${esc(t('history.printed', { date: fmtDate(todayISO()) }))}</p>`;
}

// ---- "Lihat riwayat" dari kartu hasil: data yang baru diinput, grafik, dan tombol simpan ke perangkat ----

function renderResultDetail(msg = '') {
  const { input, res } = state.last;
  const child = { name: input.name || t('history.unnamed'), sex: input.sex, birthDate: input.birthDate };
  const stored = store.findChild(child);
  const saved = !!stored?.records.some((r) => r.date === input.measureDate && r.weightKg === input.weightKg && r.lengthCm === input.lengthCm && r.position === input.position);
  const dlg = $('#hist-dialog');
  const scroll = dlg.scrollTop;
  $('#hist-detail').innerHTML = `${headerHTML(child, stored?.records.length || 0)}
    ${measurementSection(input, res)}
    ${stored ? recordsTable(stored) : ''}
    ${footerHTML()}
    <p id="hd-msg" class="save-msg no-print" role="status">${esc(msg)}</p>
    <div class="actions no-print">
      <button type="button" class="btn primary" data-dlg="save"${saved ? ' disabled' : ''}>${esc(t(saved ? 'history.saved.btn' : 'history.save'))}</button>
      <button type="button" class="btn ghost" data-dlg="print">${esc(t('history.print'))}</button>
      <button type="button" class="btn ghost" data-dlg="close">${esc(t('history.close'))}</button>
    </div>`;
  openDialog(`${t('history.detail.title')} - ${child.name}`);
  dlg.scrollTop = scroll;
}

export function openResultDetail() {
  if (state.last) renderResultDetail();
}

function saveCurrent() {
  if (!state.last) return;
  const { input, res } = state.last;
  const summary = {};
  for (const k of INDICATORS) {
    const r = res.indicators[k];
    if (typeof r.level === 'number') summary[k] = { z: r.z, code: r.code, level: r.level };
  }
  store.saveRecord(
    { name: input.name || t('history.unnamed'), sex: input.sex, birthDate: input.birthDate },
    { date: input.measureDate, ageDays: res.ageDays, weightKg: input.weightKg, lengthCm: input.lengthCm, position: input.position, summary, worstLevel: res.worstLevel },
  );
  renderResultDetail(t('history.saved'));
}

export function initHistoryDialog() {
  const dlg = $('#hist-dialog');
  dlg.addEventListener('click', (e) => {
    const b = e.target.closest('[data-dlg]');
    if (b?.dataset.dlg === 'close') dlg.close?.();
    else if (b?.dataset.dlg === 'print') printDetail();
    else if (b?.dataset.dlg === 'save') saveCurrent();
    else if (e.target === dlg) dlg.close?.(); // klik di luar kotak
  });
}

function printDetail() {
  const dlg = $('#hist-dialog');
  const old = document.title;
  document.title = dlg.dataset.title || old; // jadi nama file PDF
  const restore = () => {
    document.title = old;
    removeEventListener('afterprint', restore);
  };
  addEventListener('afterprint', restore);
  window.print();
}
