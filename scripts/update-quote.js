// Rebuilds assets/quote-card.svg with a dev quote that changes daily.
// The quote is picked from QUOTES by day number, so it is deterministic per date
// and needs no network access.
//   node scripts/update-quote.js
// Set QUOTE_INDEX=<n> to force a specific quote (handy for previewing).
const fs = require('fs');
const path = require('path');

const OUT = path.join(__dirname, '..', 'assets', 'quote-card.svg');
const FONT = "'Segoe UI','Helvetica Neue',Arial,sans-serif";
const W = 600;
const WRAP = 46;

const QUOTES = [
  ['Programs must be written for people to read, and only incidentally for machines to execute.', 'Harold Abelson'],
  ['Talk is cheap. Show me the code.', 'Linus Torvalds'],
  ['First, solve the problem. Then, write the code.', 'John Johnson'],
  ['Simplicity is prerequisite for reliability.', 'Edsger W. Dijkstra'],
  ['Premature optimization is the root of all evil.', 'Donald Knuth'],
  ['Any fool can write code that a computer can understand. Good programmers write code that humans can understand.', 'Martin Fowler'],
  ['Make it work, make it right, make it fast.', 'Kent Beck'],
  ['The best way to predict the future is to invent it.', 'Alan Kay'],
  ['Before software can be reusable it first has to be usable.', 'Ralph Johnson'],
  ['Perfection is achieved, not when there is nothing more to add, but when there is nothing left to take away.', 'Antoine de Saint-Exupéry'],
  ['The only way to go fast is to go well.', 'Robert C. Martin'],
  ['Simple things should be simple, complex things should be possible.', 'Alan Kay'],
  ['Measuring programming progress by lines of code is like measuring aircraft building progress by weight.', 'Bill Gates'],
  ['The function of good software is to make the complex appear to be simple.', 'Grady Booch'],
  ['Good code is its own best documentation.', 'Steve McConnell'],
  ['Programming isn’t about what you know; it’s about what you can figure out.', 'Chris Pine'],
  ['Optimism is an occupational hazard of programming; feedback is the treatment.', 'Kent Beck'],
  ['Don’t comment bad code — rewrite it.', 'Brian Kernighan'],
  ['Debugging is twice as hard as writing the code in the first place.', 'Brian Kernighan'],
  ['Truth can only be found in one place: the code.', 'Robert C. Martin'],
  ['Learning to write programs stretches your mind, and helps you think better.', 'Bill Gates'],
  ['Software is eating the world.', 'Marc Andreessen'],
];

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

function wrap(text, width) {
  const lines = [];
  let line = '';
  for (const word of text.split(' ')) {
    if (line && (line + ' ' + word).length > width) {
      lines.push(line);
      line = word;
    } else {
      line = line ? line + ' ' + word : word;
    }
  }
  if (line) lines.push(line);
  return lines;
}

function build([quote, author]) {
  const lines = wrap(quote, WRAP);
  const firstY = 92;
  const lineH = 28;
  const authorY = firstY + (lines.length - 1) * lineH + 40;
  const H = authorY + 30;
  const body = lines
    .map((l, i) => `<text x="${W / 2}" y="${firstY + i * lineH}" text-anchor="middle" font-family="${FONT}" font-size="18" font-style="italic" fill="#f0f3f6" filter="url(#ts)">${esc(l)}</text>`)
    .join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">
  <defs>
    <linearGradient id="gold" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#F8EBC4"/><stop offset="0.45" stop-color="#D4A441"/><stop offset="1" stop-color="#9C7420"/></linearGradient>
    <linearGradient id="bgc" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1e2631"/><stop offset="1" stop-color="#10141a"/></linearGradient>
    <linearGradient id="bd" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#D4A441" stop-opacity="0.9"/><stop offset="0.5" stop-color="#4a3f1e"/><stop offset="1" stop-color="#30363d"/></linearGradient>
    <radialGradient id="rg" cx="0.5" cy="0" r="0.8"><stop offset="0" stop-color="#D4A441" stop-opacity="0.16"/><stop offset="1" stop-color="#D4A441" stop-opacity="0"/></radialGradient>
    <linearGradient id="hl" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset="0.5" stop-color="#fff" stop-opacity="0.28"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>
    <linearGradient id="ln" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#D4A441" stop-opacity="0"/><stop offset="0.5" stop-color="#D4A441" stop-opacity="0.8"/><stop offset="1" stop-color="#D4A441" stop-opacity="0"/></linearGradient>
    <filter id="ts" x="-5%" y="-30%" width="110%" height="180%"><feDropShadow dx="0" dy="1.2" stdDeviation="1" flood-color="#000" flood-opacity="0.7"/></filter>
  </defs>
  <rect x="0.5" y="0.5" width="${W - 1}" height="${H - 1}" rx="10" fill="url(#bgc)" stroke="url(#bd)" stroke-width="1.5"/>
  <rect x="0.5" y="0.5" width="${W - 1}" height="${H - 1}" rx="10" fill="url(#rg)"/>
  <line x1="14" x2="${W - 14}" y1="2" y2="2" stroke="url(#hl)" stroke-width="1"/>
  <text x="${W / 2}" y="76" text-anchor="middle" font-family="Georgia,'Times New Roman',serif" font-size="72" font-weight="700" fill="url(#gold)">“</text>
  ${body}
  <rect x="${W / 2 - 60}" y="${authorY - 22}" width="120" height="1.5" fill="url(#ln)"/>
  <text x="${W / 2}" y="${authorY}" text-anchor="middle" font-family="${FONT}" font-size="14" font-weight="600" letter-spacing="1" fill="#D4A441">— ${esc(author.toUpperCase())}</text>
</svg>
`;
}

const day = Math.floor(Date.now() / 86400000);
const idx = process.env.QUOTE_INDEX ? Number(process.env.QUOTE_INDEX) : day % QUOTES.length;
fs.writeFileSync(OUT, build(QUOTES[idx % QUOTES.length]));
console.log(`Wrote ${path.relative(process.cwd(), OUT)} (quote ${idx % QUOTES.length}: ${QUOTES[idx % QUOTES.length][1]})`);
