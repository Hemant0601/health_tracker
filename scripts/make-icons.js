#!/usr/bin/env node
/**
 * Generates the app icon set (teal background, white heart) without any
 * image dependencies — writes PNGs directly using zlib.
 *
 * Usage: node scripts/make-icons.js
 */
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

// ---------- minimal PNG encoder (8-bit RGBA) ----------

const CRC_TABLE = (() => {
  const table = new Int32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table[n] = c;
  }
  return table;
})();

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  }
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([len, body, crc]);
}

function encodePng(width, height, rgba) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // color type RGBA
  // raw scanlines, each prefixed with filter byte 0
  const raw = Buffer.alloc(height * (width * 4 + 1));
  for (let y = 0; y < height; y++) {
    const rowStart = y * (width * 4 + 1);
    raw[rowStart] = 0;
    rgba.copy(raw, rowStart + 1, y * width * 4, (y + 1) * width * 4);
  }
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', zlib.deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

// ---------- heart shape ----------

// Classic implicit heart: (x^2 + y^2 - 1)^3 - x^2*y^3 <= 0
function insideHeart(x, y) {
  const a = x * x + y * y - 1;
  return a * a * a - x * x * y * y * y <= 0;
}

/**
 * Anti-aliased heart coverage for a pixel.
 * `frac` is the heart width as a fraction of the image size.
 */
function heartAlpha(px, py, size, frac) {
  const s = (size * frac) / 2.3; // pixels per math unit
  const cx = size / 2;
  const cy = size / 2;
  const SS = 3; // 3x3 supersampling
  let hits = 0;
  for (let i = 0; i < SS; i++) {
    for (let j = 0; j < SS; j++) {
      const sx = px + (i + 0.5) / SS;
      const sy = py + (j + 0.5) / SS;
      const x = (sx - cx) / s;
      const y = (cy - sy) / s + 0.12;
      if (insideHeart(x, y)) hits++;
    }
  }
  return Math.round((hits / (SS * SS)) * 255);
}

function hexToRgb(hex) {
  return [
    parseInt(hex.slice(1, 3), 16),
    parseInt(hex.slice(3, 5), 16),
    parseInt(hex.slice(5, 7), 16),
  ];
}

/**
 * Renders an icon image.
 * bg: hex color or null for transparent; heartFrac: 0 to skip the heart.
 */
function render(size, bg, heartFrac) {
  const rgba = Buffer.alloc(size * size * 4);
  const bgRgb = bg ? hexToRgb(bg) : null;
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const o = (y * size + x) * 4;
      const a = heartFrac > 0 ? heartAlpha(x, y, size, heartFrac) : 0;
      if (bgRgb) {
        // composite white heart over the background color
        const t = a / 255;
        rgba[o] = Math.round(bgRgb[0] + (255 - bgRgb[0]) * t);
        rgba[o + 1] = Math.round(bgRgb[1] + (255 - bgRgb[1]) * t);
        rgba[o + 2] = Math.round(bgRgb[2] + (255 - bgRgb[2]) * t);
        rgba[o + 3] = 255;
      } else {
        rgba[o] = 255;
        rgba[o + 1] = 255;
        rgba[o + 2] = 255;
        rgba[o + 3] = a;
      }
    }
  }
  return encodePng(size, size, rgba);
}

const TEAL = '#0D9488';
const assets = path.join(__dirname, '..', 'assets');

const outputs = [
  ['icon.png', render(1024, TEAL, 0.62)],
  ['android-icon-background.png', render(1024, TEAL, 0)],
  ['android-icon-foreground.png', render(1024, null, 0.42)],
  ['android-icon-monochrome.png', render(1024, null, 0.42)],
  ['splash-icon.png', render(512, null, 0.7)],
  ['favicon.png', render(48, TEAL, 0.66)],
];

for (const [name, buf] of outputs) {
  fs.writeFileSync(path.join(assets, name), buf);
  console.log(`wrote assets/${name} (${buf.length} bytes)`);
}
