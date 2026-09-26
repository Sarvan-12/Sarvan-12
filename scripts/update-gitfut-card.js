// Refreshes assets/gitfut-card.svg: downloads the GitFut card PNG, shrinks it
// (2x its displayed size) and wraps it in the gold animated frame.
// Requires `sharp` (the workflow installs it): node scripts/update-gitfut-card.js
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const USER = process.env.GH_USER || 'Sarvan-12';
const COUNTRY = process.env.GITFUT_COUNTRY || 'IN';
const OUT = path.join(__dirname, '..', 'assets', 'gitfut-card.svg');

// frame geometry (matches the other gold frames on the profile)
const RX = 16, SW = 4, DELAY = 0, DUR = 10;

async function download() {
  const res = await fetch(`https://gitfut.com/${USER}.png?country=${COUNTRY}`, { headers: { 'User-Agent': 'Mozilla/5.0' }, redirect: 'follow' });
  if (!res.ok) throw new Error(`gitfut request failed: ${res.status}`);
  if (!(res.headers.get('content-type') || '').startsWith('image/')) throw new Error('gitfut did not return an image');
  const buf = Buffer.from(await res.arrayBuffer());
  if (buf.length < 10000) throw new Error(`gitfut image looks too small (${buf.length} bytes) - not overwriting the card`);
  return buf;
}

function frame(png, w, h) {
  const band = w * 0.18, skew = h * 0.35;
  const half = SW / 2;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}">
  <defs><clipPath id="c"><rect width="${w}" height="${h}" rx="${RX}"/></clipPath>
    <linearGradient id="fb" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#F8EBC4"/><stop offset="0.35" stop-color="#D4A441"/><stop offset="0.7" stop-color="#8a6a1f"/><stop offset="1" stop-color="#D4A441"/></linearGradient><filter id="fg" x="-30%" y="-80%" width="160%" height="260%"><feGaussianBlur stdDeviation="${SW * 1.5}"/></filter><linearGradient id="sgf" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset="0.5" stop-color="#FFF6D6" stop-opacity="0.18"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient><clipPath id="scf"><rect x="0" y="0" width="${w}" height="${h}" rx="${RX}"/></clipPath></defs>
  <image width="${w}" height="${h}" clip-path="url(#c)" href="data:image/png;base64,${png.toString('base64')}"/>
  <g clip-path="url(#c)"><rect x="${half}" y="${half}" width="${w - SW}" height="${h - SW}" rx="${RX}" fill="none" stroke="#D4A441" stroke-width="${SW * 2}" opacity="0.4" filter="url(#fg)"><animate attributeName="opacity" values="0.25;0.6;0.25" dur="4s" repeatCount="indefinite"/></rect></g>
  <rect x="${half}" y="${half}" width="${w - SW}" height="${h - SW}" rx="${RX}" fill="none" stroke="url(#fb)" stroke-width="${SW}"/>
  <rect x="${SW + 0.5}" y="${SW + 0.5}" width="${w - 2 * SW - 1}" height="${h - 2 * SW - 1}" rx="${Math.max(RX - SW, 2)}" fill="none" stroke="#fff" stroke-opacity="0.18" stroke-width="1"/>
  <g clip-path="url(#scf)"><polygon points="${skew},0 ${skew + band},0 ${band},${h} 0,${h}" fill="url(#sgf)" transform="translate(${-band * 2} 0)"><animateTransform attributeName="transform" type="translate" values="${-band * 2} 0;${w + band} 0;${w + band} 0" keyTimes="0;0.4;1" dur="${DUR}s" begin="${DELAY}s" repeatCount="indefinite"/></polygon></g>
</svg>
`;
}

(async () => {
  const raw = await download();
  // 2x the 358px height the README displays it at, palette PNG keeps the file small
  const small = await sharp(raw).resize({ height: 716 }).png({ compressionLevel: 9, palette: true }).toBuffer();
  const { width, height } = await sharp(small).metadata();
  const svg = frame(small, width, height);
  if (/NaN|undefined/.test(svg.replace(/base64,[A-Za-z0-9+/=]+/g, ''))) throw new Error('generated SVG contains invalid values');
  fs.writeFileSync(OUT, svg);
  console.log(`wrote ${path.relative(process.cwd(), OUT)}: ${width}x${height}, ${(small.length / 1024).toFixed(0)} KB image`);
})().catch(err => { console.error(err.message); process.exit(1); });
