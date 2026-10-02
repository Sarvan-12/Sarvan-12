// Rebuilds assets/stats-card.svg, assets/langs-card.svg and assets/streak-card.svg from the
// GitHub API and the public contribution calendar (replaces the third-party stats cards).
//   node scripts/update-github-stats.js     (set GITHUB_TOKEN to avoid API rate limits)
const fs = require('fs');
const path = require('path');

const USER = process.env.GH_USER || 'Sarvan-12';
const ASSETS = path.join(__dirname, '..', 'assets');
const FONT = "'Segoe UI','Helvetica Neue',Arial,sans-serif";
const LANG_COLORS = { JavaScript: '#f1e05a', Python: '#3572A5', TypeScript: '#3178c6', Java: '#b07219', HTML: '#e34c26', CSS: '#563d7c', 'Jupyter Notebook': '#DA5B0B', C: '#9aa4ae', 'C++': '#f34b7d', Dart: '#00B4AB', Shell: '#89e051', SCSS: '#c6538c', Go: '#00ADD8' };
const FALLBACK = ['#D4A441', '#2A6B5C', '#C49A45', '#a8b3bf', '#58a6ff', '#b5652a'];

const headers = { 'User-Agent': 'github-stats-updater', Accept: 'application/vnd.github+json' };
if (process.env.GITHUB_TOKEN) headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
async function api(p) {
  const res = await fetch(`https://api.github.com${p}`, { headers });
  if (!res.ok) throw new Error(`${p}: GitHub API returned ${res.status}`);
  return res.json();
}

async function loadCalendar() {
  const res = await fetch(`https://github.com/users/${USER}/contributions`, { headers: { 'User-Agent': 'github-stats-updater' } });
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
    days.push({ date: date[1], count: /^No contributions/i.test(tip) ? 0 : Number((/^(\d+)/.exec(tip) || [0, 0])[1]) });
  }
  days.sort((a, b) => (a.date < b.date ? -1 : 1));
  if (days.length < 300) throw new Error(`calendar looked incomplete (${days.length} days)`);
  return days;
}

function streaks(days) {
  let longest = { n: 0, from: null, to: null }, run = 0, start = null;
  for (const d of days) {
    if (d.count > 0) {
      if (!run) start = d.date;
      run++;
      if (run > longest.n) longest = { n: run, from: start, to: d.date };
    } else run = 0;
  }
  // current streak is still alive if today has no contributions yet but yesterday did
  let i = days.length - 1;
  if (days[i].count === 0) i--;
  const to = days[i] && days[i].date;
  let n = 0;
  while (i >= 0 && days[i].count > 0) { n++; i--; }
  return { current: { n, from: n ? days[i + 1].date : null, to: n ? to : null }, longest };
}

const fmtDate = d => new Date(d + 'T00:00:00Z').toLocaleString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' });
const fmtRange = r => (r.n ? `${fmtDate(r.from)} - ${fmtDate(r.to)}` : 'No streak yet');
const num = n => n.toLocaleString('en-US');

// ---------- shared SVG pieces (all cards are 272x171 so the README grid lines up) ----------
const W = 272, H = 171;
const defs = id => `<linearGradient id="gold${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#F8EBC4"/><stop offset="0.45" stop-color="#D4A441"/><stop offset="1" stop-color="#9C7420"/></linearGradient>
    <linearGradient id="bg${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1e2631"/><stop offset="1" stop-color="#10141a"/></linearGradient>
    <linearGradient id="bd${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#D4A441" stop-opacity="0.9"/><stop offset="0.5" stop-color="#4a3f1e"/><stop offset="1" stop-color="#30363d"/></linearGradient>
    <radialGradient id="rg${id}" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(0 0) scale(300 200)"><stop offset="0" stop-color="#D4A441" stop-opacity="0.16"/><stop offset="1" stop-color="#D4A441" stop-opacity="0"/></radialGradient>
    <linearGradient id="hl${id}" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset="0.5" stop-color="#fff" stop-opacity="0.28"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>
    <linearGradient id="sg${id}" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset="0.5" stop-color="#FFF6D6" stop-opacity="0.16"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>
    <clipPath id="sc${id}"><rect width="${W}" height="${H}" rx="12"/></clipPath>`;
const frame = (id, delay) => `<rect x="0.5" y="0.5" width="${W - 1}" height="${H - 1}" rx="12" fill="url(#bg${id})" stroke="url(#bd${id})" stroke-width="1.5"/>
  <rect x="0.5" y="0.5" width="${W - 1}" height="${H - 1}" rx="12" fill="url(#rg${id})"/>
  <line x1="16" x2="${W - 16}" y1="2" y2="2" stroke="url(#hl${id})" stroke-width="1"/>
  <g clip-path="url(#sc${id})"><polygon points="30,0 80,0 50,${H} 0,${H}" fill="url(#sg${id})" transform="translate(-100 0)"><animateTransform attributeName="transform" type="translate" values="-100 0;${W + 60} 0;${W + 60} 0" keyTimes="0;0.4;1" dur="10s" begin="${delay}s" repeatCount="indefinite"/></polygon></g>`;
const svgWrap = (inner) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">\n  <defs>${inner.defs}</defs>\n  ${inner.body}\n</svg>\n`;
const title = (id, t, right) => `<text x="18" y="30" font-size="15" font-weight="700" fill="url(#gold${id})">${t}</text>${right ? `<text x="${W - 18}" y="30" font-size="10.5" text-anchor="end" fill="#a8b3bf">${right}</text>` : ''}<line x1="18" x2="${W - 18}" y1="40" y2="40" stroke="#D4A441" stroke-opacity="0.25"/>`;

// ---------- stats card ----------
function statsCard(s) {
  const rows = [['Contributions (year)', s.contribs], ['Stars earned', s.stars], ['Pull requests', s.prs], ['Issues', s.issues], ['Repositories', s.repos], ['Followers', s.followers]];
  let body = '';
  rows.forEach(([label, v], i) => {
    const y = 62 + i * 18.5;
    body += `<text x="18" y="${y + 9}" font-size="12" fill="#E8DCC4">${label}</text><text x="${W - 18}" y="${y + 9.5}" font-size="13.5" font-weight="800" text-anchor="end" fill="url(#goldS)">${num(v)}</text>`;
    if (i < rows.length - 1) body += `<line x1="18" x2="${W - 18}" y1="${y + 15}" y2="${y + 15}" stroke="#30363d" stroke-opacity="0.6"/>`;
  });
  return svgWrap({ defs: defs('S'), body: `${frame('S', 1)}<g font-family="${FONT}">${title('S', 'GitHub Stats', '@' + USER)}${body}</g>` });
}

// ---------- top languages card ----------
function langsCard(langs) {
  const BAR = W - 36;
  const total = langs.reduce((a, [, b]) => a + b, 0) || 1;
  const top = langs.slice(0, 5);
  const rest = total - top.reduce((a, [, b]) => a + b, 0);
  if (rest > 0) top.push(['Other', rest]);
  const color = (n, i) => LANG_COLORS[n] || (n === 'Other' ? '#4a3f1e' : FALLBACK[i % FALLBACK.length]);
  let x = 18, bar = '';
  top.forEach(([n, b], i) => {
    const w = Math.max(3, (b / total) * BAR);
    bar += `<rect x="${x.toFixed(1)}" y="52" width="${w.toFixed(1)}" height="9" fill="${color(n, i)}"/>`;
    x += w;
  });
  let legend = '';
  top.forEach(([n, b], i) => {
    const cy = 83 + i * 17.5;
    legend += `<circle cx="23" cy="${cy - 4}" r="4.5" fill="${color(n, i)}"/><text x="35" y="${cy}" font-size="12" fill="#E8DCC4">${n}</text><text x="${W - 18}" y="${cy}" font-size="12" text-anchor="end" fill="#a8b3bf">${((b / total) * 100).toFixed(1)}%</text>`;
  });
  const grow = `<clipPath id="barL"><rect x="18" y="52" width="${BAR}" height="9" rx="4.5"><animate attributeName="width" from="0" to="${BAR}" dur="1.6s" begin="0.3s"/></rect></clipPath>`;
  return svgWrap({ defs: defs('L') + grow, body: `${frame('L', 3)}<g font-family="${FONT}">${title('L', 'Top Languages', 'by code size')}<g clip-path="url(#barL)">${bar}</g>${legend}</g>` });
}

// ---------- streak card ----------
function streakCard(st, total) {
  const cx = W / 2, cy = 97, r = 27, C = 2 * Math.PI * r;
  const ring = `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="#30363d" stroke-width="5"/><circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="url(#goldK)" stroke-width="5" stroke-linecap="round" stroke-dasharray="${C.toFixed(1)}" stroke-dashoffset="${(C * 0.12).toFixed(1)}" transform="rotate(-90 ${cx} ${cy})"><animate attributeName="stroke-dashoffset" values="${C.toFixed(1)};${(C * 0.12).toFixed(1)}" dur="1.8s" begin="0.3s" calcMode="spline" keySplines="0.3 0 0.2 1" keyTimes="0;1"/></circle><circle cx="${cx}" cy="${cy}" r="${r + 4}" fill="none" stroke="#D4A441" stroke-opacity="0.35"><animate attributeName="r" values="${r + 3};${r + 9};${r + 3}" dur="3s" repeatCount="indefinite"/><animate attributeName="stroke-opacity" values="0.4;0;0.4" dur="3s" repeatCount="indefinite"/></circle>`;
  const side = (x, v, label, sub) => `<text x="${x}" y="104" font-size="22" font-weight="800" text-anchor="middle" fill="#E8DCC4">${v}</text><text x="${x}" y="121" font-size="11" font-weight="600" text-anchor="middle" fill="#E8DCC4">${label}</text><text x="${x}" y="134" font-size="10" text-anchor="middle" fill="#a8b3bf">${sub}</text>`;
  const sep = x => `<line x1="${x}" x2="${x}" y1="62" y2="146" stroke="#D4A441" stroke-opacity="0.2"/>`;
  const body = `${title('K', 'Contribution Streak', 'past year')}${sep(90)}${sep(182)}${side(46, num(total), 'Total', 'contributions')}${ring}<text x="${cx}" y="${cy + 8}" font-size="24" font-weight="800" text-anchor="middle" fill="url(#goldK)">${st.current.n}</text><text x="${cx}" y="150" font-size="11.5" font-weight="700" text-anchor="middle" fill="#D4A441">Current Streak</text><text x="${cx}" y="163" font-size="10" text-anchor="middle" fill="#a8b3bf">${fmtRange(st.current)}</text>${side(226, st.longest.n, 'Longest', fmtRange(st.longest))}`;
  return svgWrap({ defs: defs('K'), body: `${frame('K', 5)}<g font-family="${FONT}">${body}</g>` });
}

(async () => {
  const [user, repos, calendar, prs, issues] = await Promise.all([
    api(`/users/${USER}`),
    api(`/users/${USER}/repos?per_page=100&type=owner`),
    loadCalendar(),
    api(`/search/issues?q=author:${USER}+type:pr&per_page=1`),
    api(`/search/issues?q=author:${USER}+type:issue&per_page=1`),
  ]);
  const own = repos.filter(r => !r.fork);
  const byLang = {};
  for (const r of own) {
    const l = await api(`/repos/${USER}/${r.name}/languages`);
    for (const [k, v] of Object.entries(l)) byLang[k] = (byLang[k] || 0) + v;
  }
  const langs = Object.entries(byLang).sort((a, b) => b[1] - a[1]);
  const st = streaks(calendar);
  const stats = { contribs: calendar.reduce((a, d) => a + d.count, 0), stars: own.reduce((a, r) => a + r.stargazers_count, 0), prs: prs.total_count, issues: issues.total_count, repos: user.public_repos, followers: user.followers };
  // build everything first so a failure leaves the existing cards untouched
  const out = { 'stats-card.svg': statsCard(stats), 'langs-card.svg': langsCard(langs), 'streak-card.svg': streakCard(st, stats.contribs) };
  for (const [f, svg] of Object.entries(out)) if (/NaN|undefined/.test(svg)) throw new Error(`invalid SVG for ${f}`);
  for (const [f, svg] of Object.entries(out)) fs.writeFileSync(path.join(ASSETS, f), svg);
  console.log(stats, langs.slice(0, 4), st);
})().catch(err => { console.error(err.message); process.exit(1); });
