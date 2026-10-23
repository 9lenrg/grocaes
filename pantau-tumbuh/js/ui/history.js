// Riwayat pengukuran anak: daftar, ukur lagi, dan hapus.
import * as store from '../core/storage.js';
import { t } from '../i18n/index.js';
import { $, esc } from './dom.js';
import { todayISO, fmtDate, fmtNum, fmtZ, ageShort, ageLong } from './format.js';
import { INDICATORS, LEVEL_ICON } from './state.js';

function latestOf(child) {
  return child.records[child.records.length - 1];
}

/** Tombol "Lihat riwayat": satu anak langsung dibuka, beberapa anak tampil sebagai daftar pilihan. */
export function openHistory() {
  const children = store.listChildren().filter((c) => c.records.length);
  if (children.length === 1) return showDetail(children[0]);
  const dlg = $('#hist-dialog');
  $('#hist-detail').innerHTML = `
    <h2 id="hd-title">${esc(t('history.detail.title'))}</h2>
    ${
      children.length
        ? `<ul class="children">${children
            .map((c) => {
              const last = latestOf(c);
              return `<li class="child"><div class="child-head"><strong>${esc(c.name)}</strong> <span class="muted">${esc(t(`history.sex.${c.sex}`))} · ${esc(ageLong(c.birthDate, last.date))}</span></div>
              <p class="muted small">${esc(t('history.last', { date: fmtDate(last.date) }))} · ${esc(t('history.count', { n: c.records.length }))}</p>
              <div class="actions small"><button type="button" class="btn ghost" data-pick="${esc(c.id)}">${esc(t('history.view'))}</button></div></li>`;
            })
            .join('')}</ul>`
        : `<p class="empty">${esc(t('history.empty'))}</p>`
    }
    <p class="hint">${esc(t('history.privacy'))}</p>
    <div class="actions no-print"><button type="button" class="btn ghost" data-dlg="close">${esc(t('history.close'))}</button></div>`;
  dlg.dataset.title = t('history.detail.title');
  if (typeof dlg.showModal === 'function') dlg.showModal();
  else dlg.setAttribute('open', '');
}

// ---- Tampilan riwayat (hanya baca) dan cetak ----

function cell(rec, k) {
  const r = rec.summary?.[k];
  if (!r) return `<td class="na">–</td>`;
  return `<td class="lv level-${r.level}"><span class="icon" aria-hidden="true">${LEVEL_ICON[r.level]}</span> ${esc(t(`status.${r.code}`))} <span class="zv">(z ${esc(fmtZ(r.z))})</span></td>`;
}

function showDetail(child) {
  const dlg = $('#hist-dialog');
  const name = child.name;
  const rows = [...child.records].reverse();
  const body = rows.length
    ? `<div class="tbl-wrap"><table class="rec-table">
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
          <td>${esc(t(`history.pos.${r.position === 'standing' ? 'standing' : 'lying'}`))}</td>
          ${INDICATORS.map((k) => cell(r, k)).join('')}</tr>`,
          )
          .join('')}</tbody></table></div>`
    : `<p class="empty">${esc(t('history.nodata'))}</p>`;

  $('#hist-detail').innerHTML = `
    <div class="hd-brand"><img src="logofix.png" alt="GROCAES" width="1106" height="344"></div>
    <h2 id="hd-title">${esc(t('history.detail.title'))}: ${esc(name)}</h2>
    <dl class="hd-meta">
      <div><dt>${esc(t('history.detail.sex'))}</dt><dd>${esc(t(`form.sex.${child.sex}`))}</dd></div>
      <div><dt>${esc(t('history.detail.birth'))}</dt><dd>${esc(fmtDate(child.birthDate))}</dd></div>
      <div><dt>${esc(t('history.detail.age'))}</dt><dd>${esc(ageLong(child.birthDate, todayISO()))}</dd></div>
      <div><dt>${esc(t('history.count', { n: child.records.length }))}</dt><dd></dd></div>
    </dl>
    ${body}
    <p class="disclaimer">${esc(t('result.disclaimer'))}</p>
    <p class="hint print-only">${esc(t('history.printed', { date: fmtDate(todayISO()) }))}</p>
    <p class="hint no-print">${esc(t('history.readonly'))}</p>
    <div class="actions no-print">
      <button type="button" class="btn primary" data-dlg="print">${esc(t('history.print'))}</button>
      <button type="button" class="btn ghost" data-dlg="close">${esc(t('history.close'))}</button>
    </div>`;
  dlg.dataset.title = `${t('history.detail.title')} - ${name}`;
  if (typeof dlg.showModal === 'function') dlg.showModal();
  else dlg.setAttribute('open', '');
}

export function initHistoryDialog() {
  const dlg = $('#hist-dialog');
  dlg.addEventListener('click', (e) => {
    const pick = e.target.closest('[data-pick]');
    if (pick) {
      const child = store.listChildren().find((c) => c.id === pick.dataset.pick);
      if (child) showDetail(child);
      return;
    }
    const b = e.target.closest('[data-dlg]');
    if (b?.dataset.dlg === 'close') dlg.close?.();
    else if (b?.dataset.dlg === 'print') printDetail();
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
