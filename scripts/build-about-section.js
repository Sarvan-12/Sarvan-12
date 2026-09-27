// Builds assets/about-section.svg: the About Me heading, intro, badges and motto on the left,
// and the photo (assets/photo/about.jpg) on the right with a 3D-print build animation.
//   node scripts/build-about-section.js
const fs = require('fs');
const path = require('path');

const ASSETS = path.join(__dirname, '..', 'assets');
const read = f => fs.readFileSync(path.join(ASSETS, f), 'utf8');
const FONT = "'Segoe UI','Helvetica Neue',Arial,sans-serif";

// Nested <svg> at (x, y); ids get a prefix so several assets can share one file
function nest(svg, { x, y, prefix }) {
  const root = svg.match(/<svg\b[^>]*>/)[0];
  const attr = n => root.match(new RegExp(`\\s${n}="([^"]*)"`))[1];
  let body = svg.slice(root.length, svg.lastIndexOf('</svg>'));
  for (const id of new Set([...body.matchAll(/\sid="([^"]+)"/g)].map(m => m[1]))) {
    body = body.split(`id="${id}"`).join(`id="${prefix}-${id}"`).split(`url(#${id})`).join(`url(#${prefix}-${id})`);
  }
  return `<svg x="${x}" y="${y}" width="${attr('width')}" height="${attr('height')}" viewBox="${attr('viewBox')}">${body}</svg>`;
}

// Photo box
const PX = 680, PY = 96, PW = 200, PH = 250;
const H = 360; // section height
const DUR = 10; // seconds per print cycle
const b64 = fs.readFileSync(path.join(ASSETS, 'photo', 'about.jpg')).toString('base64');
const anim = (attr, values, keyTimes) => `<animate attributeName="${attr}" values="${values}" keyTimes="${keyTimes}" dur="${DUR}s" begin="0.5s" repeatCount="indefinite"/>`;
const K = '0;0.55;0.97;1';

const twinkle = (x, y, s, d, dur) => `<path d="M${x} ${y - s} Q${x} ${y} ${x + s} ${y} Q${x} ${y} ${x} ${y + s} Q${x} ${y} ${x - s} ${y} Q${x} ${y} ${x} ${y - s}Z" fill="#FFF1C4" opacity="0"><animate attributeName="opacity" values="0;1;0" dur="${dur}s" begin="${d}s" repeatCount="indefinite"/></path>`;

// Frame corners, a light streak once the print is done, and a spark circling the frame
const L = 18;
const corners = `<path d="M${PX - 5} ${PY + L} V${PY - 5} H${PX + L} M${PX + PW - L} ${PY - 5} H${PX + PW + 5} V${PY + L} M${PX + PW + 5} ${PY + PH - L} V${PY + PH + 5} H${PX + PW - L} M${PX + L} ${PY + PH + 5} H${PX - 5} V${PY + PH - L}" fill="none" stroke="#D4A441" stroke-width="2" stroke-linecap="square"><animate attributeName="stroke-opacity" values="0.5;1;0.5" dur="3s" repeatCount="indefinite"/></path>`;
const shine = `<g clip-path="url(#prbox)"><polygon points="30,0 70,0 40,${PH} 0,${PH}" fill="url(#prshine)" transform="translate(${PX - 90} ${PY})"><animateTransform attributeName="transform" type="translate" calcMode="linear" values="${PX - 90} ${PY};${PX - 90} ${PY};${PX + PW + 20} ${PY};${PX + PW + 20} ${PY}" keyTimes="0;0.6;0.78;1" dur="${DUR}s" begin="0.5s" repeatCount="indefinite"/></polygon></g>`;
const orbit = `<circle r="3" fill="#FFF1C4"><animateMotion dur="6s" repeatCount="indefinite" path="M${PX} ${PY} H${PX + PW} V${PY + PH} H${PX} Z"/></circle><circle r="7" fill="#D4A441" opacity="0.35" filter="url(#prblur)"><animateMotion dur="6s" repeatCount="indefinite" path="M${PX} ${PY} H${PX + PW} V${PY + PH} H${PX} Z"/></circle>`;

const photo = `
<g>${anim('opacity', '1;1;0;0', '0;0.9;0.98;1')}
  ${corners}
  ${orbit}
  <rect x="${PX - 8}" y="${PY - 8}" width="${PW + 16}" height="${PH + 16}" rx="6" fill="#D4A441" opacity="0.08" filter="url(#prblur)"/>
  <g clip-path="url(#prclip)">
    <image href="data:image/jpeg;base64,${b64}" x="${PX}" y="${PY}" width="${PW}" height="${PH}" preserveAspectRatio="xMidYMid slice" filter="url(#prgold)"/>
    <rect x="${PX}" y="${PY}" width="${PW}" height="${PH}" fill="url(#prlines)"/>
    <rect x="${PX + 0.5}" y="${PY + 0.5}" width="${PW - 1}" height="${PH - 1}" fill="none" stroke="#D4A441" stroke-opacity="0.6"/>
  </g>
  ${shine}
  <g><animateTransform attributeName="transform" type="translate" values="0 ${PH};0 0;0 0;0 ${PH}" keyTimes="${K}" dur="${DUR}s" begin="0.5s" repeatCount="indefinite"/>
    <g opacity="0">${anim('opacity', '1;1;0;0', '0;0.55;0.58;1')}
      <rect x="${PX - 4}" y="${PY - 1.5}" width="${PW + 8}" height="3" fill="#F8EBC4" opacity="0.9"/>
      <rect x="${PX - 4}" y="${PY - 4}" width="${PW + 8}" height="8" fill="#D4A441" opacity="0.4" filter="url(#prblur)"/>
      <g><animateTransform attributeName="transform" type="translate" values="0 0;${PW - 28} 0;0 0" dur="1.6s" repeatCount="indefinite"/>
        <rect x="${PX - 2}" y="${PY - 13}" width="26" height="12" rx="2" fill="#2a2f1c" stroke="#D4A441" stroke-width="1.2"/><path d="M${PX + 6} ${PY - 1} L${PX + 12} ${PY - 1} L${PX + 9} ${PY + 5} Z" fill="#F8EBC4"/></g>
    </g>
  </g>
</g>`;

const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 ${H}" width="1000" height="${H}">
<defs>
  <clipPath id="prclip"><rect x="${PX}" y="${PY + PH}" width="${PW}" height="0">${anim('y', `${PY + PH};${PY};${PY};${PY + PH}`, K)}${anim('height', `0;${PH};${PH};0`, K)}</rect></clipPath>
  <filter id="prgold" x="0" y="0" width="100%" height="100%"><feColorMatrix type="saturate" values="0"/><feComponentTransfer><feFuncR type="table" tableValues="0.05 0.5 0.83 1"/><feFuncG type="table" tableValues="0.04 0.36 0.64 0.94"/><feFuncB type="table" tableValues="0.02 0.12 0.25 0.72"/></feComponentTransfer></filter>
  <filter id="prblur" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="4"/></filter>
  <clipPath id="prall"><rect width="1000" height="${H}"/></clipPath>
  <clipPath id="prbox"><rect x="${PX}" y="${PY}" width="${PW}" height="${PH}"/></clipPath>
  <linearGradient id="prshine" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset="0.5" stop-color="#FFF6D6" stop-opacity="0.55"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>
  <radialGradient id="praur1" cx="0.5" cy="0.5" r="0.5"><stop offset="0" stop-color="#D4A441" stop-opacity="0.32"/><stop offset="0.6" stop-color="#8a6a1f" stop-opacity="0.1"/><stop offset="1" stop-color="#D4A441" stop-opacity="0"/></radialGradient>
  <radialGradient id="praur2" cx="0.5" cy="0.5" r="0.5"><stop offset="0" stop-color="#7a9130" stop-opacity="0.3"/><stop offset="1" stop-color="#7a9130" stop-opacity="0"/></radialGradient>
  <pattern id="prlines" width="4" height="3" patternUnits="userSpaceOnUse"><rect width="4" height="1" y="1" fill="#000" fill-opacity="0.4"/></pattern>
</defs>
<g clip-path="url(#prall)">
  <ellipse cx="${PX + PW / 2}" cy="${PY + PH / 2}" rx="210" ry="170" fill="url(#praur1)"><animate attributeName="opacity" values="0.5;1;0.5" dur="6s" repeatCount="indefinite"/></ellipse>
  <ellipse cx="380" cy="215" rx="300" ry="110" fill="url(#praur2)"><animate attributeName="cx" values="340;440;340" dur="13s" repeatCount="indefinite"/><animate attributeName="cy" values="195;240;195" dur="10s" repeatCount="indefinite"/></ellipse>
</g>
${twinkle(60, 60, 6, 0.4, 4)}${twinkle(940, 70, 5, 2.1, 4.5)}${twinkle(90, 320, 5, 1.2, 3.8)}${twinkle(620, 330, 6, 3, 4.2)}${twinkle(650, 150, 4, 1.7, 3.6)}${twinkle(960, 300, 4, 2.6, 4)}
${nest(read('h-about-me.svg'), { x: 200, y: 8, prefix: 'h' })}
<text x="380" y="172" text-anchor="middle" font-family="${FONT}" font-size="16" fill="#9198a1">Comfortable across the stack, from React front-ends to ML pipelines.</text>
${nest(read('about-badges.svg'), { x: 120, y: 194, prefix: 'b' })}
${nest(read('about-motto.svg'), { x: 130, y: 254, prefix: 'm' })}
${photo}
</svg>
`;
fs.writeFileSync(path.join(ASSETS, 'about-section.svg'), svg);
