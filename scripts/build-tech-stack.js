// Builds assets/tech-stack.svg: three rows of logo+name chips scrolling sideways (SMIL marquee).
// Logos come from the simple-icons package, which is only needed to run this script:
//   npm install --no-save simple-icons && node scripts/build-tech-stack.js
const fs = require('fs');
const path = require('path');
const si = require('simple-icons');

const FONT = "'Segoe UI','Helvetica Neue',Arial,sans-serif";
// simple-icons has no VS Code logo, so this is a small hand-drawn mark (24x24 viewBox)
const VSCODE = 'M17.6 2 7.9 10.9 3.9 7.9 2.4 8.7v6.6l1.5.8 4-3L17.6 22 22 20V4zM17.6 7.6v8.8L11.7 12z';
const CREAM = '#E8DCC4';
// official brand colour, falling back to cream when it would be hard to see on the dark chip
const brand = hex => {
  const [r, g, b] = [0, 2, 4].map(i => parseInt(hex.slice(i, i + 2), 16) / 255);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b < 0.28 ? CREAM : `#${hex}`;
};
const colour = key => (key ? brand(si[key].hex) : '#007ACC'); // VS Code blue
const icon = key => { const i = si[key]; if (!i) throw new Error(`missing icon ${key}`); return i.path; };

const ROWS = [
  [['HTML', 'siHtml5'], ['CSS', 'siCss'], ['JavaScript', 'siJavascript'], ['TypeScript', 'siTypescript'], ['Python', 'siPython'], ['Java', 'siOpenjdk'], ['C', 'siC'], ['C++', 'siCplusplus'], ['React', 'siReact'], ['Next.js', 'siNextdotjs'], ['Tailwind', 'siTailwindcss']],
  [['Flutter', 'siFlutter'], ['Node.js', 'siNodedotjs'], ['Express.js', 'siExpress'], ['FastAPI', 'siFastapi'], ['VS Code', null], ['MongoDB', 'siMongodb'], ['PostgreSQL', 'siPostgresql'], ['MySQL', 'siMysql'], ['Docker', 'siDocker'], ['Git', 'siGit'], ['GitHub', 'siGithub']],
  [['Linux', 'siLinux'], ['Postman', 'siPostman'], ['TensorFlow', 'siTensorflow'], ['PyTorch', 'siPytorch'], ['Pandas', 'siPandas'], ['NumPy', 'siNumpy'], ['Hugging Face', 'siHuggingface'], ['Firebase', 'siFirebase'], ['Vercel', 'siVercel'], ['Netlify', 'siNetlify']],
];

const W = 804, H = 190, CH = 40, GAP = 10, ROW_Y = [20, 75, 130], SPEED = 38; // px per second
const textW = s => Math.round(s.length * 7.1);

function row(items, y, dir) {
  const chips = [];
  let x = 0;
  for (const [name, key] of items) {
    const w = 14 + 18 + 9 + textW(name) + 14;
    const d = key ? icon(key) : VSCODE;
    chips.push(`<g transform="translate(${x} 0)"><rect width="${w}" height="${CH}" rx="10" fill="#10141a" stroke="#D4A441" stroke-opacity="0.28"/><rect x="0.5" y="0.5" width="${w - 1}" height="${CH / 2}" rx="9.5" fill="url(#chg)"/><g transform="translate(14 11) scale(${18 / 24})" fill="${colour(key)}"><path d="${d}"/></g><text x="41" y="25" font-size="13" font-weight="600" fill="#E8DCC4">${name.replace('&', '&amp;')}</text></g>`);
    x += w + GAP;
  }
  const total = x;
  const set = chips.join('');
  const [from, to] = dir < 0 ? [0, -total] : [-total, 0];
  return `<g transform="translate(0 ${y})"><g><animateTransform attributeName="transform" type="translate" from="${from} 0" to="${to} 0" dur="${(total / SPEED).toFixed(1)}s" repeatCount="indefinite"/>${set}<g transform="translate(${total} 0)">${set}</g><g transform="translate(${-total} 0)">${set}</g></g></g>`;
}

const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">
  <defs>
    <linearGradient id="pbd" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#F8EBC4"/><stop offset="0.3" stop-color="#D4A441"/><stop offset="0.65" stop-color="#8a6a1f"/><stop offset="1" stop-color="#D4A441"/></linearGradient>
    <linearGradient id="pbg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#123F36" stop-opacity="0.35"/><stop offset="1" stop-color="#0d1117"/></linearGradient>
    <linearGradient id="chg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity="0.07"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>
    <linearGradient id="fade" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#000"/><stop offset="0.07" stop-color="#fff"/><stop offset="0.93" stop-color="#fff"/><stop offset="1" stop-color="#000"/></linearGradient>
    <mask id="m" maskUnits="userSpaceOnUse" x="0" y="0" width="${W}" height="${H}"><rect width="${W}" height="${H}" fill="url(#fade)"/></mask>
  </defs>
  <rect x="1" y="1" width="${W - 2}" height="${H - 2}" rx="14" fill="#0d1117"/>
  <rect x="1" y="1" width="${W - 2}" height="${H - 2}" rx="14" fill="url(#pbg)" stroke="url(#pbd)" stroke-width="1.5"/>
  <g font-family="${FONT}" mask="url(#m)">${ROWS.map((r, i) => row(r, ROW_Y[i], i % 2 ? 1 : -1)).join('')}</g>
</svg>
`;
if (/NaN|undefined/.test(svg)) throw new Error('invalid SVG');
fs.writeFileSync(path.join(__dirname, '..', 'assets', 'tech-stack.svg'), svg);
console.log('wrote assets/tech-stack.svg');
