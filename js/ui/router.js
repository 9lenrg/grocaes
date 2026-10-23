// Navigasi antarhalaman berbasis hash (#/home, #/kalkulator, #/edukasi, #/konsultasi).
import { initConsult, updateConsultText } from './consult.js';
import { $ } from './dom.js';
import { renderEdu } from './edu.js';

const VIEWS = ['home', 'kalkulator', 'edukasi', 'konsultasi'];

let riseTimer;

/** Animasi: isi halaman baru muncul bergantian dari atas dan bawah. */
function withRise(update) {
  const root = document.documentElement;
  root.classList.add('rise');
  update();
  clearTimeout(riseTimer);
  riseTimer = setTimeout(() => root.classList.remove('rise'), 2000);
}

function route() {
  const [name, arg] = location.hash.replace(/^#\/?/, '').split('/');
  const v = VIEWS.includes(name) ? name : 'home';
  const update = () => {
    document.querySelectorAll('.view').forEach((el) => (el.hidden = el.dataset.view !== v));
    document.querySelectorAll('[data-route]').forEach((a) => (a.dataset.route === v ? a.setAttribute('aria-current', 'page') : a.removeAttribute('aria-current')));
    document.body.dataset.view = v;
    if (v === 'edukasi') renderEdu(arg);
    window.scrollTo(0, 0);
    $('#main').focus({ preventScroll: true });
  };
  withRise(update);
}

/** Gambar ulang bagian halaman yang dibuat lewat JavaScript (dipanggil saat bahasa berganti). */
export function renderPages() {
  if (!$('[data-view="edukasi"]').hidden) renderEdu(location.hash.replace(/^#\/?/, '').split('/')[1]);
  updateConsultText();
}

export function initPages() {
  initConsult();
  renderPages();
  addEventListener('hashchange', route);
  route();
}
