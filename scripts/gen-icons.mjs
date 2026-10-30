// Generate simple PWA icons (pink→lilac gradient with a crescent moon) as PNG,
// using only Node's built-in zlib — no image dependencies.
import { deflateSync } from 'node:zlib';
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';

function crc32(buf) {
  let c = ~0;
  for (let i = 0; i < buf.length; i++) {
    c ^= buf[i];
    for (let k = 0; k < 8; k++) c = (c >>> 1) ^ (0xedb88320 & -(c & 1));
  }
  return ~c >>> 0;
}

function chunk(type, data) {
  const typeBuf = Buffer.from(type, 'ascii');
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0);
  return Buffer.concat([len, typeBuf, data, crc]);
}

function png(size) {
  const w = size;
  const h = size;
  // RGBA raw image
  const bytesPerPixel = 4;
  const stride = w * bytesPerPixel;
  const raw = Buffer.alloc((stride + 1) * h);

  const cx = w / 2;
  const cy = h / 2;
  const moonR = w * 0.32;
  const biteR = w * 0.26;
  const biteCx = cx + w * 0.12;
  const biteCy = cy - h * 0.1;

  for (let y = 0; y < h; y++) {
    raw[y * (stride + 1)] = 0; // filter type 0
    for (let x = 0; x < w; x++) {
      // gradient pink (#f5a9c7) -> lilac (#c9b6f0) diagonally
      const t = (x + y) / (w + h);
      let r = Math.round(0xf5 + (0xc9 - 0xf5) * t);
      let g = Math.round(0xa9 + (0xb6 - 0xa9) * t);
      let b = Math.round(0xc7 + (0xf0 - 0xc7) * t);
      let a = 255;

      // crescent moon (white) = inside moon circle but outside bite circle
      const dMoon = Math.hypot(x - cx, y - cy);
      const dBite = Math.hypot(x - biteCx, y - biteCy);
      if (dMoon <= moonR && dBite > biteR) {
        r = 255;
        g = 255;
        b = 255;
      }

      const off = y * (stride + 1) + 1 + x * bytesPerPixel;
      raw[off] = r;
      raw[off + 1] = g;
      raw[off + 2] = b;
      raw[off + 3] = a;
    }
  }

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0);
  ihdr.writeUInt32BE(h, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // color type RGBA
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  return Buffer.concat([
    sig,
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw)),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

for (const size of [192, 512]) {
  const path = `public/icons/icon-${size}.png`;
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, png(size));
  console.log('wrote', path);
}
