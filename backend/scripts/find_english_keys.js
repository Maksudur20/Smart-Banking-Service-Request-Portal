const fs = require('fs');
const code = fs.readFileSync('frontend/assets/js/common.js', 'utf8');
const m = code.match(/bnToEn:\s*\{([\s\S]*?)\n\s*\},/);
if (m) {
  const lines = m[1].split('\n');
  lines.forEach((l, idx) => {
    const km = l.match(/^\s*"([^"]+)"\s*:\s*"([^"]+)"/);
    if (km) {
      const k = km[1];
      const v = km[2];
      // Check if key is pure ASCII (English)
      if (/^[A-Za-z0-9\s.,_\-&;:/\+#?]+$/.test(k)) {
        console.log(`Line ${idx}: [${k}] => [${v}]`);
      }
    }
  });
}
