const fs = require('fs');
const path = require('path');

const esmPath = path.join(__dirname, '../node_modules/html2canvas/dist/html2canvas.esm.js');
const cjsPath = path.join(__dirname, '../node_modules/html2canvas/dist/html2canvas.js');
const vitePath = path.join(__dirname, '../node_modules/.vite/deps/html2canvas.js');

function patchFile(filePath) {
  if (!fs.existsSync(filePath)) return;
  let code = fs.readFileSync(filePath, 'utf8');

  // 1. Prevent crash on unsupported color functions
  code = code.replace(
    /throw new Error\(["']Attempting to parse an unsupported color function \\?["'] \+ value\.name \+ \\?["']\);/g,
    'return 0;'
  );

  // 2. Add oklch to SUPPORTED_COLOR_FUNCTIONS if not already present
  if (!code.includes('oklch: oklch') && !code.includes('oklch\n') && !code.includes('oklch,')) {
    const oklchImpl = `var oklch = function (_context, args) {
    try {
        var raw = 'oklch(' + args.map(function(t) {
            if (typeof t.number === 'number') return t.type === 16 ? t.number + '%' : t.number;
            return t.value || '';
        }).join(' ') + ')';
        var canvas = typeof document !== 'undefined' ? document.createElement('canvas') : null;
        if (canvas) {
            var ctx = canvas.getContext('2d');
            if (ctx) {
                ctx.fillStyle = '#000000';
                ctx.fillStyle = raw;
                var c = ctx.fillStyle;
                if (c.startsWith('#')) {
                    var r = parseInt(c.slice(1, 3), 16);
                    var g = parseInt(c.slice(3, 5), 16);
                    var b = parseInt(c.slice(5, 7), 16);
                    return pack(r, g, b, 1);
                } else if (c.startsWith('rgb')) {
                    var match = c.match(/[\\d.]+/g);
                    if (match) return pack(parseFloat(match[0]), parseFloat(match[1]), parseFloat(match[2]), match[3] ? parseFloat(match[3]) : 1);
                }
            }
        }
    } catch (e) {}
    return 0;
};
var SUPPORTED_COLOR_FUNCTIONS = {
    hsl: hsl,
    hsla: hsl,
    rgb: rgb,
    rgba: rgb,
    oklch: oklch
};`;

    code = code.replace(
      /var SUPPORTED_COLOR_FUNCTIONS = \{[\s\S]*?hsl:?[\s\S]*?rgba:? rgb\s*\};/,
      oklchImpl
    );
  }

  fs.writeFileSync(filePath, code, 'utf8');
  console.log(`[patch-html2canvas] Successfully patched: ${filePath}`);
}

patchFile(esmPath);
patchFile(cjsPath);
patchFile(vitePath);
