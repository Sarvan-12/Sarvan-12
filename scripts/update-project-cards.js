// Rebuilds the three project cards in assets/ with live star/fork counts from the
// GitHub API. Descriptions, language and layout live in CARDS below.
//   node scripts/update-project-cards.js
// Set GITHUB_TOKEN to authenticate (the workflow does). For an offline test set
// CARDS_MOCK='{"repo-name":{"stars":1,"forks":0}, ...}' to skip the network.
const fs = require('fs');
const path = require('path');

const OWNER = process.env.GH_USER || 'Sarvan-12';
const ASSETS = path.join(__dirname, '..', 'assets');
const FONT = "'Segoe UI','Helvetica Neue',Arial,sans-serif";

const CARDS = [
  { file: 'card-ai-code-review-tool.svg', repo: 'ai-code-review-tool', live: 'https://codecook.sarvan.me/', lines: ['AI-powered code reviews: paste code, get', 'instant feedback from the Groq API'], tags: ['MongoDB', 'Express', 'React', 'Node.js', 'Groq'], lang: 'JavaScript' },
  { file: 'card-land-use-land-cover.svg', repo: 'land-use-land-cover-using-U-net', live: 'https://land-use-land-cover-using-u-net.onrender.com/', lines: ['Land use / land cover classification on', 'satellite imagery, 1994-2023'], tags: ['Python', 'U-Net', 'Deep Learning', 'Remote Sensing'], lang: 'Python' },
  { file: 'card-time-capsule.svg', repo: 'time-capsule', live: 'https://unsent.sarvan.me/', lines: ['Write a message now, lock it, and have it', 'delivered at a future date'], tags: ['MongoDB', 'Express', 'React', 'Node.js'], lang: 'JavaScript' },
];
const LANG_COLORS = { JavaScript: '#f1e05a', Python: '#3572A5', TypeScript: '#3178c6', Java: '#b07219', HTML: '#e34c26', CSS: '#563d7c', 'Jupyter Notebook': '#DA5B0B' };

// ---------- shared SVG pieces ----------
const goldV = (id = 'gold') => `<linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#F8EBC4"/><stop offset="0.45" stop-color="#D4A441"/><stop offset="1" stop-color="#9C7420"/></linearGradient>`;
const shadow = (id = 'sh', dy = 2, sd = 2, op = 0.6) => `<filter id="${id}" x="-20%" y="-20%" width="140%" height="160%"><feDropShadow dx="0" dy="${dy}" stdDeviation="${sd}" flood-color="#000" flood-opacity="${op}"/></filter>`;
const glow = (id = 'gl', sd = 3) => `<filter id="${id}" x="-30%" y="-80%" width="160%" height="260%"><feGaussianBlur stdDeviation="${sd}"/></filter>`;

function sweep({ id, w, h, rx = 0, x = 0, y = 0, delay = 0, dur = 8, band = Math.max(28, w * 0.12), op = 0.32 }) {
  const skew = h * 0.35;
  return {
    defs: `<linearGradient id="sg${id}" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset="0.5" stop-color="#FFF6D6" stop-opacity="${op}"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient><clipPath id="sc${id}"><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx}"/></clipPath>`,
    body: `<g clip-path="url(#sc${id})"><polygon points="${skew},0 ${skew + band},0 ${band},${h} 0,${h}" fill="url(#sg${id})" transform="translate(${x - band * 2} ${y})"><animateTransform attributeName="transform" type="translate" values="${x - band * 2} ${y};${x + w + band} ${y};${x + w + band} ${y}" keyTimes="0;0.4;1" dur="${dur}s" begin="${delay}s" repeatCount="indefinite"/></polygon></g>`,
  };
}

function text3d({ x, y, size, weight = 700, anchor = 'middle', ls = 0, content, font = FONT, depth = 3 }) {
  const attrs = `font-family="${font}" font-size="${size}" font-weight="${weight}" text-anchor="${anchor}" letter-spacing="${ls}"`;
  const cols = ['#7d5c17', '#6b4f14', '#5a430f'];
  let back = '';
  for (let i = depth; i >= 1; i--) back += `<text x="${x}" y="${y + i}" ${attrs} fill="${cols[Math.min(i - 1, 2)]}">${content}</text>`;
  return `<text x="${x}" y="${y + depth + 2}" ${attrs} fill="#000" opacity="0.55" filter="url(#tsh)">${content}</text>${back}<text x="${x}" y="${y}" ${attrs} fill="url(#gold)">${content}</text><text x="${x}" y="${y}" ${attrs} fill="url(#tsw)">${content}</text>`;
}
const textDefs = (w, dur, delay) => `${goldV('gold')}<filter id="tsh" x="-10%" y="-30%" width="120%" height="180%"><feGaussianBlur stdDeviation="2"/></filter><linearGradient id="tsw" gradientUnits="userSpaceOnUse" x1="${-w * 0.5}" y1="0" x2="0" y2="0"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset="0.5" stop-color="#FFF6D6" stop-opacity="0.95"/><stop offset="1" stop-color="#fff" stop-opacity="0"/><animate attributeName="x1" values="${-w * 0.5};${w};${w}" keyTimes="0;0.55;1" dur="${dur}s" begin="${delay}s" repeatCount="indefinite"/><animate attributeName="x2" values="0;${w * 1.5};${w * 1.5}" keyTimes="0;0.55;1" dur="${dur}s" begin="${delay}s" repeatCount="indefinite"/></linearGradient>`;

// ---------- one project card (420x160) ----------
function card({ repo, lines, tags, lang, stars, forks }, i) {
  const lc = LANG_COLORS[lang] || '#a8b3bf';
  const lw = Math.round(24 + lang.length * 6.5 + 12);
  const sw = sweep({ id: 'c', w: 420, h: 190, rx: 10, delay: i * 2, dur: 10, band: 60, op: 0.16 });
  let x = 20, pills = '';
  pills += `<rect x="${x}" y="140" width="${lw}" height="26" rx="13" fill="url(#pd)" stroke="#D4A441" stroke-opacity="0.25"/><circle cx="${x + 13}" cy="153" r="8" fill="${lc}" opacity="0.35" filter="url(#dg)"/><circle cx="${x + 13}" cy="153" r="4.5" fill="${lc}"/><circle cx="${x + 11.6}" cy="151.6" r="1.4" fill="#fff" opacity="0.7"/><text x="${x + 24}" y="157" fill="#E8DCC4">${lang}</text>`;
  x += lw + 10;
  const starW = 56;
  pills += `<rect x="${x}" y="140" width="${starW}" height="26" rx="13" fill="url(#gold)"/><rect x="${x + 1}" y="140.5" width="${starW - 2}" height="12" rx="6" fill="url(#gloss)"/><rect x="${x + 0.5}" y="140.5" width="${starW - 1}" height="25" rx="12.5" fill="none" stroke="#FFF1C4" stroke-opacity="0.6"/><text x="${x + starW / 2}" y="157" text-anchor="middle" font-weight="700" fill="#123F36">★ ${stars}</text>`;
  if (forks > 0) {
    x += starW + 10;
    pills += `<rect x="${x}" y="140" width="54" height="26" rx="13" fill="url(#pd)" stroke="#D4A441" stroke-opacity="0.25"/><g fill="none" stroke="#E8DCC4" stroke-width="1.4" transform="translate(${x + 12},146)"><circle cx="3" cy="2.5" r="1.8"/><circle cx="11" cy="2.5" r="1.8"/><circle cx="7" cy="11.5" r="1.8"/><path d="M3 4.3 V6 Q3 7.5 5 7.5 H9 Q11 7.5 11 6 V4.3 M7 7.5 V9.7"/></g><text x="${x + 32}" y="157" fill="#E8DCC4">${forks}</text>`;
  }
  let tx = 20, chips = '';
  for (const t of tags) {
    const tw = Math.round(t.length * 5.9 + 16);
    chips += `<rect x="${tx}" y="98" width="${tw}" height="21" rx="10.5" fill="#123F36" fill-opacity="0.55" stroke="#2A6B5C"/><text x="${tx + tw / 2}" y="112" text-anchor="middle" fill="#E8DCC4">${t}</text>`;
    tx += tw + 6;
  }
  const bx = 296;
  pills += `<rect x="${bx}" y="140" width="104" height="26" rx="13" fill="url(#gold)"/><rect x="${bx + 1}" y="140.5" width="102" height="12" rx="6" fill="url(#gloss)"/><rect x="${bx + 0.5}" y="140.5" width="103" height="25" rx="12.5" fill="none" stroke="#FFF1C4" stroke-opacity="0.6"/><text x="${bx + 52}" y="157" text-anchor="middle" font-weight="700" fill="#123F36">Live demo ↗</text>`;
  const desc = lines.map((l, k) => `<text x="20" y="${66 + k * 20}">${l}</text>`).join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 420 190" width="420" height="190">
  <defs>${textDefs(300, 9, i * 2 + 1)}${shadow('sh', 2, 2, 0.6)}${glow('dg', 3)}
    <linearGradient id="bgc" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1e2631"/><stop offset="1" stop-color="#10141a"/></linearGradient>
    <linearGradient id="bd" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#D4A441" stop-opacity="0.9"/><stop offset="0.5" stop-color="#4a3f1e"/><stop offset="1" stop-color="#30363d"/></linearGradient>
    <radialGradient id="rg" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(0 0) scale(320 240)"><stop offset="0" stop-color="#D4A441" stop-opacity="0.16"/><stop offset="1" stop-color="#D4A441" stop-opacity="0"/></radialGradient>
    <linearGradient id="hl" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset="0.5" stop-color="#fff" stop-opacity="0.28"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>
    <linearGradient id="pd" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1a2028"/><stop offset="1" stop-color="#090b0e"/></linearGradient>
    <linearGradient id="gloss" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity="0.55"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>
    <clipPath id="cc"><rect x="0.5" y="0.5" width="419" height="189" rx="10"/></clipPath>${sw.defs}</defs>
  <rect x="0.5" y="0.5" width="419" height="189" rx="10" fill="url(#bgc)" stroke="url(#bd)" stroke-width="1.5"/>
  <rect x="0.5" y="0.5" width="419" height="189" rx="10" fill="url(#rg)"/>
  <line x1="14" x2="406" y1="2" y2="2" stroke="url(#hl)" stroke-width="1"/>
  <path d="M10 188.5 H410" stroke="#000" stroke-opacity="0.5" stroke-width="1"/>
  ${text3d({ x: 20, y: 36, size: 18, anchor: 'start', content: repo, depth: 2 })}
  <g font-family="${FONT}" font-size="13" fill="#a8b3bf">${desc}</g>
  <g font-family="${FONT}" font-size="11">${chips}</g>
  <g font-family="${FONT}" font-size="12" filter="url(#sh)">${pills}</g>
  ${sw.body}
</svg>
`;
}

async function fetchStats(repo) {
  const headers = { 'User-Agent': 'project-cards-updater', Accept: 'application/vnd.github+json' };
  if (process.env.GITHUB_TOKEN) headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  const res = await fetch(`https://api.github.com/repos/${OWNER}/${repo}`, { headers });
  if (!res.ok) throw new Error(`${repo}: GitHub API returned ${res.status}`);
  const j = await res.json();
  if (typeof j.stargazers_count !== 'number' || typeof j.forks_count !== 'number') throw new Error(`${repo}: unexpected API response`);
  return { stars: j.stargazers_count, forks: j.forks_count };
}

(async () => {
  const mock = process.env.CARDS_MOCK ? JSON.parse(process.env.CARDS_MOCK) : null;
  // fetch everything first so a failure leaves all existing cards untouched
  const out = [];
  for (const [i, c] of CARDS.entries()) {
    const s = mock ? mock[c.repo] : await fetchStats(c.repo);
    if (!s) throw new Error(`no stats for ${c.repo}`);
    const svg = card({ ...c, ...s }, i);
    if (/NaN|undefined/.test(svg)) throw new Error(`invalid SVG for ${c.repo}`);
    out.push([c, s, svg]);
  }
  for (const [c, s, svg] of out) {
    fs.writeFileSync(path.join(ASSETS, c.file), svg);
    console.log(`${c.repo}: ${s.stars} stars, ${s.forks} forks`);
  }
})().catch(err => { console.error(err.message); process.exit(1); });
