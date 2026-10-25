// Pemformat tanggal, angka, dan umur sesuai bahasa aktif.
import { t, locale } from '../i18n/index.js';

export const todayISO = () => new Date().toLocaleDateString('sv-SE');
export const num = (v) => parseFloat(String(v).replace(',', '.'));
export const fmtZ = (z) => z.toLocaleString(locale(), { minimumFractionDigits: 2, maximumFractionDigits: 2, signDisplay: 'exceptZero' });
export const fmtNum = (n, d = 1) => n.toLocaleString(locale(), { maximumFractionDigits: d });
export const fmtDate = (iso) => new Date(`${iso}T00:00:00`).toLocaleDateString(locale(), { day: 'numeric', month: 'short', year: 'numeric' });

/** Usia kalender (tahun, bulan, hari) antara dua tanggal ISO. Null bila tanggal tidak valid atau terbalik. */
export function calendarAge(birthISO, onISO) {
  const m1 = /^(\d{4})-(\d{2})-(\d{2})$/.exec(birthISO || '');
  const m2 = /^(\d{4})-(\d{2})-(\d{2})$/.exec(onISO || '');
  if (!m1 || !m2) return null;
  const [by, bm, bd] = [+m1[1], +m1[2], +m1[3]];
  const [ey, em, ed] = [+m2[1], +m2[2], +m2[3]];
  if (Date.UTC(ey, em - 1, ed) < Date.UTC(by, bm - 1, bd)) return null;
  let months = (ey - by) * 12 + (em - bm);
  if (ed < bd) months -= 1;
  // Tanggal "ulang bulan" terakhir; dijepit ke akhir bulan (mis. lahir 31 Jan).
  const ay = by + Math.floor((bm - 1 + months) / 12);
  const am = (bm - 1 + months) % 12;
  const lastDay = new Date(Date.UTC(ay, am + 1, 0)).getUTCDate();
  const anchor = Date.UTC(ay, am, Math.min(bd, lastDay));
  const days = Math.round((Date.UTC(ey, em - 1, ed) - anchor) / 86400000);
  return { years: Math.floor(months / 12), months: months % 12, days };
}

/** Usia panjang: "1 tahun 4 bulan"; di bawah 1 bulan: "12 hari". */
export function ageLong(birthISO, onISO) {
  const a = calendarAge(birthISO, onISO);
  if (!a) return '';
  if (a.years === 0 && a.months === 0) return t('age.long.d', { d: a.days });
  return a.years > 0 ? t('age.long.ym', { y: a.years, m: a.months }) : t('age.long.m', { m: a.months });
}

/** Usia ringkas untuk daftar/tabel: "1 th 4 bln". */
export function ageShort(birthISO, onISO) {
  const a = calendarAge(birthISO, onISO);
  if (!a) return '';
  if (a.years === 0 && a.months === 0) return t('age.d', { d: a.days });
  return a.years > 0 ? t('age.ym', { y: a.years, m: a.months }) : t('age.m', { m: a.months });
}
