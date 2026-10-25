// Formulir konsultasi daring: menyusun pesan dan membukanya di WhatsApp nomor konsultasi.
import * as store from '../core/storage.js';
import { pick, t } from '../i18n/index.js';
import { CONSULT } from '../config.js';
import { $ } from './dom.js';

function greeting() {
  const h = new Date().getHours();
  return t(h < 11 ? 'consult.m.g.pagi' : h < 15 ? 'consult.m.g.siang' : h < 18 ? 'consult.m.g.sore' : 'consult.m.g.malam');
}

/** Hasil pengukuran terakhir dari riwayat (satu baris), atau '' bila belum ada. */
function latestSummary() {
  let best = null;
  for (const c of store.listChildren()) {
    const r = c.records[c.records.length - 1];
    if (r && (!best || r.date > best.r.date)) best = { c, r };
  }
  if (!best) return '';
  const { c, r } = best;
  const s = r.summary || {};
  const parts = ['haz', 'waz', 'whz'].filter((k) => s[k]).map((k) => `${t(`ind.${k}.short`)} ${t(`status.${s[k].code}`)} (z ${s[k].z.toFixed(2)})`);
  return t('consult.m.last', { name: c.name, sex: t(`form.sex.${c.sex}`), date: r.date, w: r.weightKg, l: r.lengthCm, parts: parts.join('; ') });
}

/** Pesan WhatsApp: salam sopan, perkenalan, data yang diisi pengguna, lalu penutup. */
function buildMessage() {
  const f = $('#consult-form');
  const v = (n) => f.elements[n].value.trim();
  const who = v('who') || t('consult.m.parent');
  const topic = f.elements.topic.selectedOptions[0].textContent;
  const line = (k, val) => `• ${t(`consult.m.l.${k}`)}: ${val}`;
  const rows = [line('who', who)];
  if (v('age')) rows.push(line('age', v('age')));
  rows.push(line('topic', topic));
  if (f.elements.attach.checked) {
    const last = latestSummary();
    if (last) rows.push(line('last', last));
  }
  rows.push(line('msg', v('msg')));
  return [t('consult.m.open', { greet: greeting() }), t('consult.m.intro', { who }), t('consult.m.head') + '\n' + rows.join('\n'), t('consult.m.close')].join('\n\n');
}

/** Teks dinamis yang bergantung bahasa (jam layanan dan catatan). */
export function updateConsultText() {
  $('#consult-hours').textContent = pick(CONSULT.hours);
}

export function initConsult() {
  const f = $('#consult-form');
  const send = $('#send-wa');
  const note = $('#consult-note');
  updateConsultText();
  f.addEventListener('submit', (e) => e.preventDefault());
  send.addEventListener('click', () => {
    if (!f.reportValidity()) return;
    const text = buildMessage();
    if (!CONSULT.whatsapp) {
      note.textContent = t('consult.saved');
    } else {
      // Langsung ke chat nomor di config.js dengan pesan terisi.
      const url = `https://wa.me/${CONSULT.whatsapp}?text=${encodeURIComponent(text)}`;
      if (!window.open(url, '_blank', 'noopener')) location.href = url; // cadangan bila pop-up diblokir
      note.textContent = t('consult.sent');
    }
    f.reset();
  });
}
