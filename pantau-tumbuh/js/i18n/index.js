// Mesin terjemahan. Menambah bahasa = menambah satu file kamus lalu mendaftarkannya di `dict`.
import id from './id.js';
import en from './en.js';

const dict = { id, en };

const LS_KEY = 'pantau-tumbuh:lang';
let lang = 'id';

export function getLang() {
  return lang;
}

export function initLang() {
  let saved = null;
  try {
    saved = localStorage.getItem(LS_KEY);
  } catch {
    /* penyimpanan tidak tersedia */
  }
  const guess = (navigator.language || 'id').toLowerCase().startsWith('id') ? 'id' : 'en';
  lang = dict[saved] ? saved : guess;
  return lang;
}

export function setLang(next) {
  if (!dict[next]) return;
  lang = next;
  try {
    localStorage.setItem(LS_KEY, next);
  } catch {
    /* abaikan */
  }
}

export function otherLang() {
  return lang === 'id' ? 'en' : 'id';
}

export function t(key, vars) {
  let s = dict[lang][key] ?? dict.id[key] ?? key;
  if (vars) for (const [k, v] of Object.entries(vars)) s = s.replaceAll(`{${k}}`, String(v));
  return s;
}

/** Ambil versi bahasa aktif dari objek { id, en }. */
export const pick = (o) => o[lang] ?? o.id;

export const locale = () => (lang === 'id' ? 'id-ID' : 'en-US');

export function applyI18n(root = document) {
  document.documentElement.lang = lang;
  document.title = `${t('app.title')} · ${t('app.tagline')}`;
  root.querySelectorAll('[data-i18n]').forEach((el) => (el.textContent = t(el.dataset.i18n)));
  root.querySelectorAll('[data-i18n-alt]').forEach((el) => (el.alt = t(el.dataset.i18nAlt)));
  root.querySelectorAll('[data-i18n-placeholder]').forEach((el) => (el.placeholder = t(el.dataset.i18nPlaceholder)));
}
