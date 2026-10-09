// Embeds web fonts into SVGs as base64 @font-face. GitHub renders README SVGs through <img>, which
// blocks external font URLs, so the font data has to live inside the SVG itself.
const fs = require('fs');
const path = require('path');

const FILES = {
  'Barlow Condensed': { 600: 'barlow-condensed-latin-600-normal.woff2', 700: 'barlow-condensed-latin-700-normal.woff2' },
  Inter: { 400: 'inter-latin-400-normal.woff2', 600: 'inter-latin-600-normal.woff2' },
};

// fontFaceCss({ 'Barlow Condensed': [700], Inter: [400] }) -> CSS for a <style> block
function fontFaceCss(wanted) {
  let css = '';
  for (const [family, weights] of Object.entries(wanted)) {
    for (const w of weights) {
      const b64 = fs.readFileSync(path.join(__dirname, 'fonts', FILES[family][w])).toString('base64');
      css += `@font-face{font-family:'${family}';font-weight:${w};src:url(data:font/woff2;base64,${b64}) format('woff2');}`;
    }
  }
  return css;
}

const DISPLAY = "'Barlow Condensed','Arial Narrow',Arial,sans-serif";
const BODY = "Inter,'Segoe UI','Helvetica Neue',Arial,sans-serif";

module.exports = { fontFaceCss, DISPLAY, BODY };
