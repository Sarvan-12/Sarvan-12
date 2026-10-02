// Re-frames the animated GIF inside assets/coding-gif.svg as a 272x171 card that matches the
// stats cards (gold frame, shine sweep, live dot). The GIF itself is read back from the file,
// so this is safe to re-run:  node scripts/build-coding-card.js
const fs = require('fs');
const path = require('path');

const FILE = path.join(__dirname, '..', 'assets', 'coding-gif.svg');
const src = fs.readFileSync(FILE, 'utf8');
const href = /href="(data:image\/gif;base64,[^"]+)"/.exec(src);
if (!href) throw new Error('no embedded GIF found in assets/coding-gif.svg');

const W = 272, H = 171;
const FONT = "'Segoe UI','Helvetica Neue',Arial,sans-serif";
const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">
  <defs>
    <clipPath id="c"><rect width="${W}" height="${H}" rx="12"/></clipPath>
    <linearGradient id="fb" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#F8EBC4"/><stop offset="0.35" stop-color="#D4A441"/><stop offset="0.7" stop-color="#8a6a1f"/><stop offset="1" stop-color="#D4A441"/></linearGradient>
    <linearGradient id="fade" x1="0" y1="0" x2="0" y2="1"><stop offset="0.55" stop-color="#0d1117" stop-opacity="0"/><stop offset="1" stop-color="#0d1117" stop-opacity="0.85"/></linearGradient>
    <linearGradient id="sgf" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset="0.5" stop-color="#FFF6D6" stop-opacity="0.2"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>
    <filter id="fg" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="3"/></filter>
  </defs>
  <image width="${W}" height="${H}" preserveAspectRatio="xMidYMid slice" clip-path="url(#c)" href="${href[1]}"/>
  <rect width="${W}" height="${H}" rx="12" fill="url(#fade)"/>
  <g clip-path="url(#c)"><rect x="1" y="1" width="${W - 2}" height="${H - 2}" rx="12" fill="none" stroke="#D4A441" stroke-width="4" opacity="0.4" filter="url(#fg)"><animate attributeName="opacity" values="0.25;0.6;0.25" dur="4s" repeatCount="indefinite"/></rect></g>
  <rect x="1" y="1" width="${W - 2}" height="${H - 2}" rx="12" fill="none" stroke="url(#fb)" stroke-width="2"/>
  <rect x="2.5" y="2.5" width="${W - 5}" height="${H - 5}" rx="10.5" fill="none" stroke="#fff" stroke-opacity="0.15"/>
  <g font-family="${FONT}"><rect x="14" y="${H - 34}" width="108" height="22" rx="11" fill="#0d1117" fill-opacity="0.75" stroke="#D4A441" stroke-opacity="0.4"/><circle cx="28" cy="${H - 23}" r="3.5" fill="#2A6B5C"><animate attributeName="opacity" values="1;0.25;1" dur="1.6s" repeatCount="indefinite"/></circle><circle cx="28" cy="${H - 23}" r="3.5" fill="none" stroke="#2A6B5C"><animate attributeName="r" values="3.5;8;3.5" dur="1.6s" repeatCount="indefinite"/><animate attributeName="stroke-opacity" values="0.8;0;0.8" dur="1.6s" repeatCount="indefinite"/></circle><text x="40" y="${H - 19}" font-size="11" font-weight="600" fill="#E8DCC4">building things</text></g>
  <g clip-path="url(#c)"><polygon points="30,0 80,0 50,${H} 0,${H}" fill="url(#sgf)" transform="translate(-100 0)"><animateTransform attributeName="transform" type="translate" values="-100 0;${W + 60} 0;${W + 60} 0" keyTimes="0;0.4;1" dur="10s" begin="7s" repeatCount="indefinite"/></polygon></g>
</svg>
`;
fs.writeFileSync(FILE, svg);
console.log(`wrote assets/coding-gif.svg (${(svg.length / 1e6).toFixed(2)} MB)`);
