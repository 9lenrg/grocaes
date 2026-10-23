// Halaman Edukasi: daftar dan isi artikel (mengikuti bahasa aktif).
import { ARTICLES } from '../content/articles.js';
import { pick, t } from '../i18n/index.js';
import { $, esc } from './dom.js';

export const articleCard = (a) => {
  const c = pick(a);
  return `<a class="art" href="#/edukasi/${a.slug}"><span class="chip">${esc(c.cat)}</span><h3>${esc(c.title)}</h3><p>${esc(c.summary)}</p><span class="muted small">${esc(t('edu.min', { n: a.min }))}</span></a>`;
};

const block = (p) => {
  if (Array.isArray(p)) return `<ul>${p.map((l) => `<li>${esc(l)}</li>`).join('')}</ul>`;
  if (p.startsWith('## ')) return `<h3>${esc(p.slice(3))}</h3>`; // subjudul
  return `<p>${esc(p)}</p>`;
};

export function renderEdu(slug) {
  const a = ARTICLES.find((x) => x.slug === slug);
  if (!a) {
    $('#edu').innerHTML = `<div class="art-grid">${ARTICLES.map(articleCard).join('')}</div>`;
    return;
  }
  const c = pick(a);
  $('#edu').innerHTML = `<article class="card article"><span class="chip">${esc(c.cat)}</span><h2>${esc(c.title)}</h2><p class="muted small">${esc(t('edu.min', { n: a.min }))}</p>${c.body.map(block).join('')}</article>`;
}
