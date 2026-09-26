// Rebuilds assets/contribution-graph.svg (last-30-days chart) from the public
// GitHub contribution calendar. Run by .github/workflows/update-contribution-graph.yml
// (daily) or manually: node scripts/update-contribution-graph.js
const fs = require('fs');
const path = require('path');

const USER = process.env.GH_USER || 'Sarvan-12';
const OUT = path.join(__dirname, '..', 'assets', 'contribution-graph.svg');
const FONT = "'Segoe UI','Helvetica Neue',Arial,sans-serif";

async function loadDays() {
  const res = await fetch(`https://github.com/users/${USER}/contributions`, { headers: { 'User-Agent': 'contribution-graph-updater' } });
  if (!res.ok) throw new Error(`calendar request failed: ${res.status}`);
  const html = await res.text();
  const tips = {};
  for (const m of html.matchAll(/<tool-tip[^>]*\sfor="([^"]+)"[^>]*>([^<]+)</g)) tips[m[1]] = m[2];
  const days = [];
  for (const m of html.matchAll(/<td\b([^>]*)>/g)) {
    const date = /data-date="(\d{4}-\d\d-\d\d)"/.exec(m[1]);
    const id = /\bid="([^"]+)"/.exec(m[1]);
    if (!date || !id) continue;
    const tip = tips[id[1]] || '';
    const n = /^No contributions/i.test(tip) ? 0 : Number((/^(\d+)/.exec(tip) || [0, 0])[1]);
    days.push({ date: date[1], count: n });
  }
  days.sort((a, b) => (a.date < b.date ? -1 : 1));
  if (days.length < 31) throw new Error(`calendar looked incomplete (${days.length} days) - not overwriting the graph`);
  return days;
}

function build(all) {
  const days = all.slice(-31);
  const W = 800, H = 312, L = 56, R = 30, T = 78, B = 56;
  const pw = W - L - R, ph = H - T - B, base = T + ph;
  const max = Math.max(...days.map(d => d.count), 1);
  const step = max <= 4 ? 1 : max <= 10 ? 2 : 5;
  const top = Math.ceil(max / step) * step;
  const X = i => L + (i / (days.length - 1)) * pw;
  const Y = v => base - (v / top) * ph;
  const P = days.map((d, i) => [X(i), Y(d.count)]);

  // smooth path (Catmull-Rom -> cubic bezier, clamped to the plot area)
  const clampY = y => Math.min(base, Math.max(T, y));
  let line = `M${P[0][0].toFixed(1)} ${P[0][1].toFixed(1)}`;
  for (let i = 0; i < P.length - 1; i++) {
    const p0 = P[i - 1] || P[i], p1 = P[i], p2 = P[i + 1], p3 = P[i + 2] || p2;
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, clampY(p1[1] + (p2[1] - p0[1]) / 6)];
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, clampY(p2[1] - (p3[1] - p1[1]) / 6)];
    line += ` C${c1[0].toFixed(1)} ${c1[1].toFixed(1)} ${c2[0].toFixed(1)} ${c2[1].toFixed(1)} ${p2[0].toFixed(1)} ${p2[1].toFixed(1)}`;
  }
  const area = `${line} L${P[P.length - 1][0].toFixed(1)} ${base} L${P[0][0].toFixed(1)} ${base} Z`;

  const fmt = d => new Date(d + 'T00:00:00Z').toLocaleString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' });
  let grid = '', ylab = '', xlab = '';
  for (let v = 0; v <= top; v += step) {
    grid += `<line x1="${L}" x2="${W - R}" y1="${Y(v)}" y2="${Y(v)}" stroke="#4a3f1e" stroke-width="1" ${v ? 'stroke-dasharray="3 5" opacity="0.6"' : ''}/>`;
    ylab += `<text x="${L - 12}" y="${Y(v) + 4}" text-anchor="end">${v}</text>`;
  }
  days.forEach((d, i) => { if (i % 5 === 0 || i === days.length - 1) xlab += `<text x="${X(i).toFixed(1)}" y="${base + 22}" text-anchor="middle">${fmt(d.date)}</text>`; });

  let dots = '';
  days.forEach((d, i) => {
    dots += `<circle cx="${P[i][0].toFixed(1)}" cy="${P[i][1].toFixed(1)}" r="3.2" fill="#0d1117" stroke="#F5E6B8" stroke-width="1.6" opacity="0"><title>${d.count} contribution${d.count === 1 ? '' : 's'} on ${fmt(d.date)}</title><animate attributeName="opacity" from="0" to="1" begin="${(0.4 + i * 0.147).toFixed(2)}s" dur="0.5s" fill="freeze"/></circle>`;
  });

  const pi = days.reduce((b, d, i) => (d.count > days[b].count ? i : b), 0);
  const [px, py] = P[pi];
  const label = `Peak · ${days[pi].count} · ${fmt(days[pi].date)}`;
  const lw = label.length * 6.6 + 20;
  const lx = Math.min(W - R - lw, Math.max(L, px - lw / 2));
  const peak = `<g opacity="0"><animate attributeName="opacity" from="0" to="1" begin="5s" dur="0.8s" fill="freeze"/>
    <line x1="${px.toFixed(1)}" x2="${px.toFixed(1)}" y1="${(py - 8).toFixed(1)}" y2="${(py - 16).toFixed(1)}" stroke="#D4A441" stroke-width="1.5"/>
    <rect x="${lx.toFixed(1)}" y="${(py - 38).toFixed(1)}" width="${lw.toFixed(1)}" height="22" rx="11" fill="#D4A441"/>
    <text x="${(lx + lw / 2).toFixed(1)}" y="${(py - 23).toFixed(1)}" text-anchor="middle" font-family="${FONT}" font-size="11" font-weight="700" fill="#1E2412">${label}</text></g>`;

  const [lxp, lyp] = P[P.length - 1];
  const pulse = `<circle cx="${lxp.toFixed(1)}" cy="${lyp.toFixed(1)}" r="5" fill="none" stroke="#D4A441" stroke-width="2" opacity="0">
    <animate attributeName="r" values="5;14" dur="3.2s" begin="5s" repeatCount="indefinite"/>
    <animate attributeName="opacity" values="0.8;0" dur="3.2s" begin="5s" repeatCount="indefinite"/></circle>
    <circle cx="${lxp.toFixed(1)}" cy="${lyp.toFixed(1)}" r="5" fill="#D4A441" opacity="0"><animate attributeName="opacity" from="0" to="1" begin="4.6s" dur="0.5s" fill="freeze"/></circle>`;

  const total = days.reduce((s, d) => s + d.count, 0);
  const card = `x="0.75" y="0.75" width="${W - 1.5}" height="${H - 1.5}" rx="10"`;

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#161b22"/><stop offset="1" stop-color="#0d1117"/></linearGradient>
    <linearGradient id="fill" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#D4A441" stop-opacity="0.5"/><stop offset="1" stop-color="#D4A441" stop-opacity="0"/></linearGradient>
    <linearGradient id="stroke" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#D4A441"/><stop offset="0.5" stop-color="#F5E6B8"/><stop offset="1" stop-color="#D4A441"/></linearGradient>
    <filter id="glow" x="-5%" y="-30%" width="110%" height="160%"><feGaussianBlur stdDeviation="4" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
    <clipPath id="reveal"><rect x="0" y="0" width="0" height="${H}"><animate attributeName="width" from="0" to="${W}" dur="4.4s" begin="0.2s" fill="freeze"/></rect></clipPath>
    <linearGradient id="cbord" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#F8EBC4"/><stop offset="0.3" stop-color="#D4A441"/><stop offset="0.7" stop-color="#8a6a1f"/><stop offset="1" stop-color="#D4A441"/></linearGradient>
    <filter id="cglow" x="-5%" y="-10%" width="110%" height="120%"><feGaussianBlur stdDeviation="4"/></filter>
    <linearGradient id="csg" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset="0.5" stop-color="#FFF6D6" stop-opacity="0.12"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>
    <clipPath id="cclip"><rect ${card}/></clipPath>
  </defs>
  <rect ${card} fill="none" stroke="#D4A441" stroke-width="5" opacity="0.35" filter="url(#cglow)"><animate attributeName="opacity" values="0.15;0.5;0.15" dur="5s" repeatCount="indefinite"/></rect>
  <rect ${card} fill="url(#bg)" stroke="url(#cbord)" stroke-width="1.5"/>
  <line x1="14" x2="786" y1="2.5" y2="2.5" stroke="#fff" stroke-opacity="0.14"/>
  <g fill="none" stroke="#D4A441" stroke-width="2.5" stroke-linecap="square"><path d="M16 36 V16 H36"/><path d="M${W - 16} ${H - 36} V${H - 16} H${W - 36}"/></g>

  <circle cx="${L + 4}" cy="34" r="4" fill="#D4A441"/>
  <text x="${L + 16}" y="39" font-family="${FONT}" font-size="15" font-weight="700" letter-spacing="0.5" fill="#D4A441">CONTRIBUTION ACTIVITY</text>
  <text x="${W - R}" y="39" text-anchor="end" font-family="${FONT}" font-size="12" fill="#D8C9A7">Last 30 days · ${fmt(days[0].date)} – ${fmt(days[days.length - 1].date)} · ${total} total</text>

  <g font-family="${FONT}" font-size="11" fill="#9198a1">${grid}${ylab}${xlab}</g>
  <g clip-path="url(#reveal)">
    <path d="${area}" fill="url(#fill)"/>
    <path d="${line}" fill="none" stroke="url(#stroke)" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" filter="url(#glow)"/>
  </g>
  ${dots}
  ${peak}
  ${pulse}
  <g clip-path="url(#cclip)"><polygon points="90,0 210,0 120,${H} 0,${H}" fill="url(#csg)" transform="translate(-230 0)"><animateTransform attributeName="transform" type="translate" values="-230 0;${W + 40} 0;${W + 40} 0" keyTimes="0;0.35;1" dur="10s" begin="1s" repeatCount="indefinite"/></polygon></g>
</svg>
`;
}

(async () => {
  const days = await loadDays();
  const svg = build(days);
  if (/NaN|undefined/.test(svg)) throw new Error('generated SVG contains invalid values');
  fs.writeFileSync(OUT, svg);
  const last = days.slice(-31);
  console.log(`wrote ${path.relative(process.cwd(), OUT)}: ${last[0].date} -> ${last[last.length - 1].date}, ${last.reduce((s, d) => s + d.count, 0)} contributions`);
})().catch(err => { console.error(err.message); process.exit(1); });
