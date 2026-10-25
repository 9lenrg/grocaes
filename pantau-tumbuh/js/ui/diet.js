// Menampilkan kartu rekomendasi pola makan (mengikuti bahasa aktif).
import { BANDS, FOCUS } from '../content/diet.js';
import { pick, t } from '../i18n/index.js';
import { esc } from './dom.js';

const list = (a) => `<ul>${a.map((x) => `<li>${esc(x)}</li>`).join('')}</ul>`;

export function renderDiet(el, res) {
  const band = pick(BANDS.find((b) => res.ageDays < b.max));
  const codes = Object.values(res.indicators).map((r) => r.code).filter(Boolean);
  const has = (re) => codes.some((c) => re.test(c));
  const focus = [];
  if (has(/stunted/)) focus.push(...pick(FOCUS.stunt));
  if (has(/underweight|wasted/)) focus.push(...pick(FOCUS.thin));
  if (has(/overweight|obese/)) focus.push(...pick(FOCUS.heavy));
  if (!focus.length) focus.push(...pick(FOCUS.ok));
  const urgent = res.worstLevel >= 3 ? `<p class="diet-alert"><strong>${esc(t('diet.priority'))}</strong> ${esc(t('diet.urgent'))}</p>` : '';
  el.innerHTML = `<h2>${esc(t('diet.title'))}</h2><p class="meta">${esc(t('diet.age', { band: band.name }))}</p>${urgent}
    <div class="diet-grid">
      <div><h3>${esc(t('diet.schedule'))}</h3><p>${esc(band.freq)}</p><h3>${esc(t('diet.texture'))}</h3><p>${esc(band.texture)}</p></div>
      <div><h3>${esc(t('diet.focus'))}</h3>${list(focus)}</div>
      ${band.menu.length ? `<div><h3>${esc(t('diet.menu'))}</h3>${list(band.menu)}</div>` : ''}
    </div>
    <p class="disclaimer">${esc(t('diet.disc'))}</p>`;
  el.hidden = false;
}
