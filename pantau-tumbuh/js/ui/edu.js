// Halaman Edukasi: daftar artikel dan halaman baca artikel
// (kolom sempit, daftar isi, artikel sebelumnya/berikutnya).
import { ARTICLES } from '../content/articles.js';
import { pick, t } from '../i18n/index.js';
import { $, esc } from './dom.js';

const BACK_ICON = '<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M19 12H5"/><path d="m12 19-7-7 7-7"/></svg>';

const isHeading = (p) => typeof p === 'string' && p.startsWith('## ');
const headingId = (i) => `edu-h-${i}`;

// ---- Daftar artikel ----

const articleItem = (a) => {
  const c = pick(a);
  return `<li><a class="edu-item" href="#/edukasi/${a.slug}">
    <span class="edu-cat">${esc(c.cat)}</span>
    <h3 class="edu-title">${esc(c.title)}</h3>
    <span class="edu-sum">${esc(c.summary)}</span>
    <span class="edu-meta"><span>${esc(t('edu.min', { n: a.min }))}</span><span aria-hidden="true">→</span></span>
  </a></li>`;
};

function renderIndex() {
  $('#edu').innerHTML = `<ul class="edu-list">${ARTICLES.map(articleItem).join('')}</ul>`;
}

// ---- Halaman baca ----

/** Bagian "Label:" di awal butir, atau null bila butir tidak berlabel. */
function splitLabel(text) {
  const i = text.indexOf(':');
  return i > 1 && i <= 45 && !/[.!?]/.test(text.slice(0, i)) ? [text.slice(0, i + 1), text.slice(i + 1)] : null;
}

/** Label dibuat tebal hanya bila semua butir dalam daftar berlabel, supaya daftar tampak konsisten. */
function renderList(items) {
  const parts = items.map(splitLabel);
  const labeled = parts.every(Boolean);
  return `<ul>${items.map((text, k) => (labeled ? `<li><strong>${esc(parts[k][0])}</strong>${esc(parts[k][1])}</li>` : `<li>${esc(text)}</li>`)).join('')}</ul>`;
}

function renderBody(body) {
  let h = -1;
  return body
    .map((p) => {
      if (Array.isArray(p)) return renderList(p);
      if (isHeading(p)) return `<h3 id="${headingId(++h)}" tabindex="-1">${esc(p.slice(3))}</h3>`;
      return `<p>${esc(p)}</p>`;
    })
    .join('');
}

function tocLinks(a, body) {
  const items = body.filter(isHeading);
  return `<ol>${items.map((p, i) => `<li><a class="toc-link" href="#/edukasi/${a.slug}" data-jump="${headingId(i)}">${esc(p.slice(3))}</a></li>`).join('')}</ol>`;
}

function navLink(a, dir) {
  if (!a) return '<span></span>';
  return `<a class="edu-pn-link ${dir}" href="#/edukasi/${a.slug}"><span class="edu-pn-label">${esc(t(`edu.${dir}`))}</span><span class="edu-pn-title">${esc(pick(a).title)}</span></a>`;
}

function renderArticle(a) {
  const c = pick(a);
  const i = ARTICLES.indexOf(a);
  const toc = c.body.some(isHeading) ? tocLinks(a, c.body) : '';
  $('#edu').innerHTML = `<a class="edu-back" href="#/edukasi" aria-label="${esc(t('edu.back'))}" title="${esc(t('edu.back'))}">${BACK_ICON}</a>
    <div class="edu-layout">
      <div class="edu-col">
        <article class="article">
          <p class="edu-cat">${esc(c.cat)} · ${esc(t('edu.min', { n: a.min }))}</p>
          <h2 class="art-title">${esc(c.title)}</h2>
          <p class="art-lead">${esc(c.summary)}</p>
          ${toc ? `<details class="toc toc-m"><summary>${esc(t('edu.toc'))}</summary>${toc}</details>` : ''}
          ${renderBody(c.body)}
        </article>
        <nav class="edu-pn" aria-label="${esc(t('edu.back'))}">${navLink(ARTICLES[i - 1], 'prev')}${navLink(ARTICLES[i + 1], 'next')}</nav>
      </div>
      ${toc ? `<aside class="toc toc-d" aria-label="${esc(t('edu.toc'))}"><h2>${esc(t('edu.toc'))}</h2>${toc}</aside>` : ''}
    </div>`;
}

export function renderEdu(slug) {
  const a = ARTICLES.find((x) => x.slug === slug);
  $('#edu-head').hidden = !!a; // di halaman baca, judul "Edukasi" disembunyikan agar fokus ke isi
  if (a) renderArticle(a);
  else renderIndex();
}

// ---- Interaksi (dipasang sekali; isi #edu diganti-ganti) ----

function jumpTo(id) {
  const el = document.getElementById(id);
  if (!el) return;
  const header = document.querySelector('.top');
  const top = el.getBoundingClientRect().top + scrollY - (header?.offsetHeight ?? 0) - 12;
  const calm = matchMedia('(prefers-reduced-motion: reduce)').matches;
  scrollTo({ top, behavior: calm ? 'auto' : 'smooth' });
  el.focus({ preventScroll: true });
}

const edu = $('#edu');

edu.addEventListener('click', (e) => {
  const jump = e.target.closest('[data-jump]');
  if (jump) {
    e.preventDefault(); // jangan ubah hash: hash dipakai untuk berpindah halaman
    jump.closest('details')?.removeAttribute('open');
    jumpTo(jump.dataset.jump);
  }
});
