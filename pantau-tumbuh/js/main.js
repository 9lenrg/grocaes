// Titik masuk aplikasi: menyambungkan semua modul.
import { loadData } from './core/data.js';
import { t, initLang, setLang, otherLang, getLang, applyI18n } from './i18n/index.js';
import { $ } from './ui/dom.js';
import { form, autoPosition, updateAge } from './ui/form.js';
import { todayISO } from './ui/format.js';
import { openResultDetail, initHistoryDialog } from './ui/history.js';
import { resultEl, showErrors, renderResult, renderChart, onSubmit } from './ui/result.js';
import { renderPages, initPages } from './ui/router.js';
import { state } from './ui/state.js';

function refreshLanguage() {
  applyI18n();
  const btn = $('#lang-btn');
  const on = (code) => (getLang() === code ? ' class="on"' : '');
  btn.innerHTML = `<span${on('id')}>ID</span> / <span${on('en')}>EN</span>`;
  btn.setAttribute('aria-label', t('lang.aria'));
  renderPages();
  if (state.last) renderResult();
  updateAge();
}

async function init() {
  initLang();
  form.measure.value = todayISO();
  form.measure.max = todayISO();
  form.birth.max = todayISO();
  refreshLanguage();
  initPages();

  form.addEventListener('submit', onSubmit);
  form.addEventListener('reset', () => {
    state.posTouched = false;
    setTimeout(() => {
      form.measure.value = todayISO();
      showErrors([]);
      updateAge();
      resultEl.hidden = true;
      $('#diet').hidden = true;
      state.last = null;
    });
  });
  for (const el of [form.birth, form.measure]) {
    el.addEventListener('change', () => {
      autoPosition();
      updateAge();
    });
    el.addEventListener('input', updateAge);
  }
  document.querySelectorAll('input[name="position"]').forEach((r) => r.addEventListener('change', () => (state.posTouched = true)));

  resultEl.addEventListener('click', (e) => {
    const tab = e.target.closest('[data-chart]');
    if (tab) {
      state.chartKind = tab.dataset.chart;
      renderChart();
    } else if (e.target.closest('#result-view-btn')) openResultDetail();
  });
  initHistoryDialog();
  const switchLang = () => {
    setLang(otherLang());
    refreshLanguage();
  };
  $('#lang-btn').addEventListener('click', switchLang);
  $('#lang-btn').addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      switchLang();
    }
  });

  try {
    state.data = await loadData();
  } catch {
    $('#banner').hidden = false;
  }

  if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost')) {
    navigator.serviceWorker.register('sw.js').catch(() => { });
  }
}

init();
