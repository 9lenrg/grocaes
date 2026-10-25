// Grafik kurva pertumbuhan sebagai string SVG (tanpa library).
import { lmsToValue, lookupLMS, daysToMonths } from '../core/zscore.js';

const Z_LINES = [-3, -2, 0, 2, 3];
const W = 640;
const H = 360;
const PAD = { l: 52, r: 44, t: 16, b: 48 };

function niceTicks(min, max, target = 6) {
  const span = max - min || 1;
  const raw = span / target;
  const pow = Math.pow(10, Math.floor(Math.log10(raw)));
  const step = [1, 2, 5, 10].map((m) => m * pow).find((s) => s >= raw) ?? pow * 10;
  const ticks = [];
  for (let v = Math.ceil(min / step) * step; v <= max + 1e-9; v += step) ticks.push(Number(v.toFixed(6)));
  return ticks;
}

const fmt = (n) => (Number.isInteger(n) ? String(n) : n.toFixed(1));
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

/**
 * @param {object} o
 * @param {{unit:'month'|'day'|'cm',start:number,step:number,rows:number[][]}} o.table  tabel LMS
 * @param {{x:number,y:number}|null} o.point  posisi anak; x dalam satuan tabel (bulan, hari, atau cm)
 * @param {{x:string,y:string,point:string,alt:string}} o.labels
 */
export function buildChart({ table, point, labels }) {
  const { start, step, rows, unit } = table;
  const end = start + step * (rows.length - 1);
  const sampleStep = unit === 'month' ? 0.25 : unit === 'day' ? 15 : step;
  const sampled = [];
  for (let k = 0; start + k * sampleStep < end - 1e-9; k++) sampled.push(start + k * sampleStep);
  sampled.push(end);

  // Sumbu x digambar dalam bulan (tabel umur) atau cm (tabel panjang/tinggi).
  const toX = (rawX) => (unit === 'day' ? daysToMonths(rawX) : rawX);
  const curves = Z_LINES.map((z) => ({
    z,
    pts: sampled.map((x) => ({ x: toX(x), y: lmsToValue(z, lookupLMS(table, x)) })),
  }));

  const xs = curves[0].pts.map((p) => p.x);
  let xMin = Math.min(...xs);
  let xMax = Math.max(...xs);
  let yMin = Math.min(...curves[0].pts.map((p) => p.y));
  let yMax = Math.max(...curves[curves.length - 1].pts.map((p) => p.y));
  const pt = point ? { x: toX(point.x), y: point.y } : null;
  if (pt) {
    xMin = Math.min(xMin, pt.x);
    xMax = Math.max(xMax, pt.x);
    yMin = Math.min(yMin, pt.y);
    yMax = Math.max(yMax, pt.y);
  }
  const yPad = (yMax - yMin) * 0.04;
  yMin -= yPad;
  yMax += yPad;

  const sx = (v) => PAD.l + ((v - xMin) / (xMax - xMin)) * (W - PAD.l - PAD.r);
  const sy = (v) => H - PAD.b - ((v - yMin) / (yMax - yMin)) * (H - PAD.t - PAD.b);

  const xTicks = niceTicks(xMin, xMax, unit === 'cm' ? 7 : 10);
  const yTicks = niceTicks(yMin, yMax, 6);

  const grid =
    xTicks.map((v) => `<line class="c-grid" x1="${sx(v)}" y1="${PAD.t}" x2="${sx(v)}" y2="${H - PAD.b}"/><text class="c-tick" x="${sx(v)}" y="${H - PAD.b + 16}" text-anchor="middle">${fmt(v)}</text>`).join('') +
    yTicks.map((v) => `<line class="c-grid" x1="${PAD.l}" y1="${sy(v)}" x2="${W - PAD.r}" y2="${sy(v)}"/><text class="c-tick" x="${PAD.l - 8}" y="${sy(v) + 4}" text-anchor="end">${fmt(v)}</text>`).join('');

  const lines = curves
    .map((c) => {
      const d = c.pts.map((p, i) => `${i ? 'L' : 'M'}${sx(p.x).toFixed(1)},${sy(p.y).toFixed(1)}`).join(' ');
      const end = c.pts[c.pts.length - 1];
      const label = c.z > 0 ? `+${c.z}` : c.z < 0 ? `−${Math.abs(c.z)}` : '0';
      const cls = c.z === 0 ? 'c-z0' : `c-z${c.z < 0 ? 'n' : 'p'}${Math.abs(c.z)}`;
      return `<path class="c-curve ${cls}" d="${d}" fill="none"/><text class="c-zlabel" x="${W - PAD.r + 6}" y="${sy(end.y) + 4}">${label}</text>`;
    })
    .join('');

  const marker = pt
    ? `<circle class="c-point" cx="${sx(pt.x).toFixed(1)}" cy="${sy(pt.y).toFixed(1)}" r="6"/><text class="c-pointlabel" x="${Math.min(sx(pt.x) + 10, W - PAD.r - 60)}" y="${Math.max(sy(pt.y) - 10, PAD.t + 12)}">${esc(labels.point)}</text>`
    : '';

  return `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(labels.alt)}" xmlns="http://www.w3.org/2000/svg">
<rect class="c-bg" x="0" y="0" width="${W}" height="${H}" rx="12"/>${grid}
<text class="c-axis" x="${(PAD.l + W - PAD.r) / 2}" y="${H - 8}" text-anchor="middle">${esc(labels.x)}</text>
<text class="c-axis" x="14" y="${(PAD.t + H - PAD.b) / 2}" text-anchor="middle" transform="rotate(-90 14 ${(PAD.t + H - PAD.b) / 2})">${esc(labels.y)}</text>
${lines}${marker}</svg>`;
}
