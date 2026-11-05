// Generates the README QR code locally as SVG (no external services).
// Usage: node scripts/generate-qr.mjs [url] [output]
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import QRCode from 'qrcode';

const url = process.argv[2] ?? 'https://0gis0.github.io/tesla-roadster-demo/';
const output = process.argv[3] ?? 'docs/assets/qr-web.svg';

const svg = await QRCode.toString(url, {
  type: 'svg',
  errorCorrectionLevel: 'M',
  margin: 2,
  color: { dark: '#0b0d14', light: '#ffffff' },
});
mkdirSync(dirname(output), { recursive: true });
writeFileSync(output, svg);
console.log(`generate-qr: ${url} -> ${output}`);
