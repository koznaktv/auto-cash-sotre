import * as zlib from 'zlib';

function crc32(buf: Buffer): number {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    c ^= buf[i];
    for (let j = 0; j < 8; j++) {
      c = (c >>> 1) ^ (0xedb88320 & -(c & 1));
    }
  }
  return (c ^ 0xffffffff) >>> 0;
}

function makePngChunk(type: string, data: Buffer): Buffer {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, 'ascii');
  const crcBuf = Buffer.alloc(4);
  const toCrc = Buffer.concat([typeBuf, data]);
  crcBuf.writeUInt32BE(crc32(toCrc), 0);
  return Buffer.concat([len, typeBuf, data, crcBuf]);
}

export function encodeRawRGBToPNG(width: number, height: number, rgbBuf: Buffer): Buffer {
  // If resolution is high, downscale to keep Serverless memory & CPU low (<50KB PNG instead of 24MB)
  let step = 1;
  if (width > 1200 || height > 1600) {
    step = 2;
  }
  if (width > 2200 || height > 3000) {
    step = 3;
  }

  const targetWidth = Math.floor(width / step);
  const targetHeight = Math.floor(height / step);
  const lineLength = targetWidth * 3;
  const filteredLength = (lineLength + 1) * targetHeight;
  const filtered = Buffer.alloc(filteredLength);

  let dstOffset = 0;
  for (let y = 0; y < targetHeight; y++) {
    filtered[dstOffset++] = 0; // Filter: 0 (None)
    const srcRowStart = y * step * width * 3;
    for (let x = 0; x < targetWidth; x++) {
      const srcIdx = srcRowStart + (x * step * 3);
      filtered[dstOffset++] = rgbBuf[srcIdx];
      filtered[dstOffset++] = rgbBuf[srcIdx + 1];
      filtered[dstOffset++] = rgbBuf[srcIdx + 2];
    }
  }

  const idatData = zlib.deflateSync(filtered);

  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(targetWidth, 0);
  ihdrData.writeUInt32BE(targetHeight, 4);
  ihdrData[8] = 8; // 8 bits per channel
  ihdrData[9] = 2; // ColorType 2 = RGB
  ihdrData[10] = 0; // Deflate
  ihdrData[11] = 0; // Standard filter
  ihdrData[12] = 0; // No interlace

  const sig = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  const ihdr = makePngChunk('IHDR', ihdrData);
  const idat = makePngChunk('IDAT', idatData);
  const iend = makePngChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([sig, ihdr, idat, iend]);
}

/**
 * Extracts the primary image from a PDF buffer (supports FlateDecode RGB and DCTDecode JPEG).
 * Returns a Buffer of a valid PNG or JPEG image.
 */
export function extractImageBufferFromPdf(pdfBuffer: Buffer): Buffer | null {
  try {
    const str = pdfBuffer.toString('latin1');
    
    // Find image XObject dictionaries
    const regex = /<<[^>]*\/Subtype\s*\/Image[^>]*>>\s*stream\r?\n/g;
    let match;
    let largestImage: Buffer | null = null;
    let maxArea = 0;

    while ((match = regex.exec(str)) !== null) {
      const dictStr = match[0];
      const streamStart = match.index + match[0].length;
      const streamEnd = pdfBuffer.indexOf(Buffer.from('endstream'), streamStart);
      if (streamEnd === -1) continue;

      const rawStream = pdfBuffer.slice(streamStart, streamEnd);
      const isDCT = dictStr.includes('/DCTDecode'); // Raw JPEG
      const isFlate = dictStr.includes('/FlateDecode');

      const wMatch = dictStr.match(/\/Width\s+(\d+)/);
      const hMatch = dictStr.match(/\/Height\s+(\d+)/);
      const width = wMatch ? parseInt(wMatch[1], 10) : 0;
      const height = hMatch ? parseInt(hMatch[1], 10) : 0;
      const area = width * height;

      if (isDCT && rawStream.length > 500) {
        // Direct JPEG
        if (area > maxArea || !largestImage) {
          maxArea = area;
          largestImage = rawStream;
        }
      } else if (isFlate && width > 0 && height > 0) {
        try {
          const inflated = zlib.inflateSync(rawStream);
          if (inflated.length >= width * height * 3) {
            const pngBuf = encodeRawRGBToPNG(width, height, inflated);
            if (area > maxArea) {
              maxArea = area;
              largestImage = pngBuf;
            }
          }
        } catch {}
      }
    }

    return largestImage;
  } catch (err) {
    console.warn('[PDF Image Extraction Error]:', err);
    return null;
  }
}
