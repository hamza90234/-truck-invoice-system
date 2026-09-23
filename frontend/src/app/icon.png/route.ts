import { NextResponse } from "next/server";
import zlib from "zlib";
import fs from "fs";
import path from "path";

// CRC32 utility
const crcTable: number[] = [];
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) {
    c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  }
  crcTable[n] = c;
}

function crc32(buf: Buffer): number {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    c = crcTable[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  }
  return (c ^ 0xffffffff) >>> 0;
}

function makeChunk(type: string, data: Buffer): Buffer {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, "ascii");
  const crcBuf = Buffer.alloc(4);
  const toCrc = Buffer.concat([typeBuf, data]);
  crcBuf.writeUInt32BE(crc32(toCrc), 0);
  return Buffer.concat([len, typeBuf, data, crcBuf]);
}

function generateIconPng(size: number = 192): Buffer {
  const sig = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

  // IHDR chunk
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(size, 0);
  ihdrData.writeUInt32BE(size, 4);
  ihdrData[8] = 8; // 8 bits per channel
  ihdrData[9] = 6; // RGBA color type
  ihdrData[10] = 0; // compression
  ihdrData[11] = 0; // filter
  ihdrData[12] = 0; // interlace
  const ihdr = makeChunk("IHDR", ihdrData);

  // Raw uncompressed scanlines: each row = 1 filter byte + size * 4 RGBA bytes
  const rowLen = 1 + size * 4;
  const rawData = Buffer.alloc(rowLen * size);

  const radius = size * 0.22;
  const cx = size / 2;
  const cy = size / 2;

  for (let y = 0; y < size; y++) {
    const rowOffset = y * rowLen;
    rawData[rowOffset] = 0; // Filter: None

    for (let x = 0; x < size; x++) {
      const px = rowOffset + 1 + x * 4;

      // Rounded rectangle test
      const dx = Math.max(0, Math.abs(x - cx) - (cx - radius));
      const dy = Math.max(0, Math.abs(y - cy) - (cy - radius));
      const outsideCorner = dx * dx + dy * dy > radius * radius;

      if (outsideCorner) {
        // Transparent outside rounded corners
        rawData[px] = 0;
        rawData[px + 1] = 0;
        rawData[px + 2] = 0;
        rawData[px + 3] = 0;
      } else {
        // Gradient from Dark Slate #0f172a to Electric Blue #0284c7
        const t = (x + y) / (size * 2);
        const r = Math.round(15 * (1 - t) + 2 * t);
        const g = Math.round(23 * (1 - t) + 132 * t);
        const b = Math.round(42 * (1 - t) + 199 * t);

        // Draw an "H" in the center (letter width ~ 40% of size)
        const inLeftCol = x >= size * 0.32 && x <= size * 0.42 && y >= size * 0.28 && y <= size * 0.72;
        const inRightCol = x >= size * 0.58 && x <= size * 0.68 && y >= size * 0.28 && y <= size * 0.72;
        const inBar = x >= size * 0.32 && x <= size * 0.68 && y >= size * 0.46 && y <= size * 0.54;

        if (inLeftCol || inRightCol || inBar) {
          // White letter H
          rawData[px] = 255;
          rawData[px + 1] = 255;
          rawData[px + 2] = 255;
          rawData[px + 3] = 255;
        } else {
          // Background gradient
          rawData[px] = r;
          rawData[px + 1] = g;
          rawData[px + 2] = b;
          rawData[px + 3] = 255;
        }
      }
    }
  }

  const compressed = zlib.deflateSync(rawData);
  const idat = makeChunk("IDAT", compressed);
  const iend = makeChunk("IEND", Buffer.alloc(0));

  return Buffer.concat([sig, ihdr, idat, iend]);
}

// Generate static PNG once into public directory as well
try {
  const publicDir = path.join(process.cwd(), "public");
  const iconPath = path.join(publicDir, "icon.png");
  if (!fs.existsSync(iconPath)) {
    const pngBuffer = generateIconPng(192);
    fs.writeFileSync(iconPath, pngBuffer);
  }
} catch {
  // Ignore filesystem writes if running in read-only environment
}

export async function GET() {
  const pngBuffer = generateIconPng(192);

  return new NextResponse(pngBuffer, {
    status: 200,
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "public, max-age=86400, immutable",
    },
  });
}
