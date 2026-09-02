import fs from "fs";
import path from "path";
import zlib from "zlib";

function crc32(buf) {
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    let byte = buf[i];
    crc = crc ^ byte;
    for (let j = 0; j < 8; j++) {
      crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function makeChunk(type, data) {
  const len = data.length;
  const buf = Buffer.alloc(8 + len + 4);
  buf.writeUInt32BE(len, 0);
  buf.write(type, 4, 4, "ascii");
  data.copy(buf, 8);
  const crc = crc32(buf.subarray(4, 8 + len));
  buf.writeUInt32BE(crc, 8 + len);
  return buf;
}

function createPng(width, height, isMaskable = false) {
  const rawData = Buffer.alloc(height * (1 + width * 4));
  const cx = width / 2;
  const cy = height / 2;
  const cornerRadius = isMaskable ? 0 : width * 0.22;

  for (let y = 0; y < height; y++) {
    const rowOffset = y * (1 + width * 4);
    rawData[rowOffset] = 0;

    for (let x = 0; x < width; x++) {
      const pixelOffset = rowOffset + 1 + x * 4;
      const dx = Math.abs(x - cx);
      const dy = Math.abs(y - cy);
      const halfW = width * 0.44;
      const halfH = height * 0.44;

      let inBox = false;
      let alpha = 255;

      if (isMaskable) {
        inBox = true;
      } else {
        const qx = Math.max(0, dx - (halfW - cornerRadius));
        const qy = Math.max(0, dy - (halfH - cornerRadius));
        const dist = Math.sqrt(qx * qx + qy * qy);
        if (dist <= cornerRadius) {
          inBox = true;
          if (dist > cornerRadius - 1) {
            alpha = Math.floor(255 * (cornerRadius - dist));
          }
        }
      }

      if (!inBox || alpha <= 0) {
        rawData[pixelOffset] = 0;
        rawData[pixelOffset + 1] = 0;
        rawData[pixelOffset + 2] = 0;
        rawData[pixelOffset + 3] = 0;
        continue;
      }

      const gradT = (x + y) / (width + height);
      let r = Math.round(79 + (67 - 79) * gradT);
      let g = Math.round(70 + (56 - 70) * gradT);
      let b = Math.round(229 + (202 - 229) * gradT);

      const nx = x / width;
      const ny = y / height;

      const cardX1 = 0.22, cardX2 = 0.78;
      const cardY1 = 0.30, cardY2 = 0.70;
      const cardBorder = 0.035;

      const isInsideCardOuter = nx >= cardX1 && nx <= cardX2 && ny >= cardY1 && ny <= cardY2;
      const isInsideCardInner = nx >= cardX1 + cardBorder && nx <= cardX2 - cardBorder && 
                                ny >= cardY1 + cardBorder && ny <= cardY2 - cardBorder;

      const isStripe = isInsideCardInner && (ny >= 0.38 && ny <= 0.44);
      const isLine1 = isInsideCardInner && (ny >= 0.52 && ny <= 0.55 && nx >= 0.30 && nx <= 0.55);
      const isLine2 = isInsideCardInner && (ny >= 0.59 && ny <= 0.62 && nx >= 0.30 && nx <= 0.48);
      
      const badgeCx = 0.66, badgeCy = 0.56, badgeR = 0.08;
      const distBadge = Math.sqrt((nx - badgeCx) * (nx - badgeCx) + (ny - badgeCy) * (ny - badgeCy));
      const isBadge = distBadge <= badgeR;

      if (isInsideCardOuter && !isInsideCardInner) {
        r = 255; g = 255; b = 255;
      } else if (isStripe || isLine1 || isLine2) {
        r = 224; g = 231; b = 255;
      } else if (isBadge) {
        r = 16; g = 185; b = 129;
      }

      rawData[pixelOffset] = r;
      rawData[pixelOffset + 1] = g;
      rawData[pixelOffset + 2] = b;
      rawData[pixelOffset + 3] = alpha;
    }
  }

  const compressed = zlib.deflateSync(rawData);
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8;
  ihdrData[9] = 6;
  ihdrData[10] = 0;
  ihdrData[11] = 0;
  ihdrData[12] = 0;

  const ihdrChunk = makeChunk("IHDR", ihdrData);
  const idatChunk = makeChunk("IDAT", compressed);
  const iendChunk = makeChunk("IEND", Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

const iconsDir = path.resolve(process.cwd(), "public/icons");
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

console.log("Generating 192x192 icon...");
fs.writeFileSync(path.join(iconsDir, "icon-192.png"), createPng(192, 192, false));

console.log("Generating 512x512 icon...");
fs.writeFileSync(path.join(iconsDir, "icon-512.png"), createPng(512, 512, false));

console.log("Generating maskable 512x512 icon...");
fs.writeFileSync(path.join(iconsDir, "icon-maskable-512.png"), createPng(512, 512, true));

console.log("Generating apple-touch-icon 180x180...");
fs.writeFileSync(path.resolve(process.cwd(), "public/apple-touch-icon.png"), createPng(180, 180, true));

console.log("Generating favicon.svg...");
const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <rect width="512" height="512" rx="110" fill="url(#grad)" />
  <defs>
    <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#4f46e5" />
      <stop offset="100%" stop-color="#3730a3" />
    </linearGradient>
  </defs>
  <rect x="110" y="150" width="292" height="212" rx="20" fill="none" stroke="#ffffff" stroke-width="18"/>
  <rect x="120" y="195" width="272" height="30" fill="#e0e7ff" opacity="0.9"/>
  <rect x="150" y="270" width="130" height="15" rx="7.5" fill="#e0e7ff"/>
  <rect x="150" y="305" width="90" height="15" rx="7.5" fill="#e0e7ff"/>
  <circle cx="340" cy="290" r="38" fill="#10b981"/>
  <path d="M326 290l10 10 20 -20" fill="none" stroke="#ffffff" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;
fs.writeFileSync(path.resolve(process.cwd(), "public/favicon.svg"), svg.trim());

console.log("Done generating icons!");
