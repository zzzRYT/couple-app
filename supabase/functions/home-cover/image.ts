import { Image } from 'npm:imagescript@1.3.1';

export type Crop = { x: number; y: number; width: number; height: number };
export type ProcessedImage = { bytes: Uint8Array; width: number; height: number };
export type CoverInputFormat = 'image/jpeg' | 'image/png';
const MAX_PIXELS = 20_000_000;
const COVER_ASPECT_RATIO = 1;
const PNG_SIGNATURE = [137, 80, 78, 71, 13, 10, 26, 10];

/** Read dimensions from the encoded header before full decode to bound memory use for image bombs. */
export function inspectCoverHeader(data: Uint8Array): { format: CoverInputFormat; width: number; height: number } | null {
  if (data.length >= 24 && PNG_SIGNATURE.every((byte, index) => data[index] === byte) && String.fromCharCode(...data.slice(12, 16)) === 'IHDR') {
    const view = new DataView(data.buffer, data.byteOffset, data.byteLength);
    return { format: 'image/png', width: view.getUint32(16), height: view.getUint32(20) };
  }
  if (data.length < 4 || data[0] !== 0xff || data[1] !== 0xd8) return null;
  let offset = 2;
  while (offset + 4 <= data.length) {
    if (data[offset] !== 0xff) return null;
    while (data[offset] === 0xff) offset++;
    const marker = data[offset++];
    if (marker === 0xd9 || marker === 0xda) return null;
    if (marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) continue;
    const segmentLength = (data[offset]! << 8) + data[offset + 1]!;
    if (segmentLength < 2 || offset + segmentLength > data.length) return null;
    if ([0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7, 0xc9, 0xca, 0xcb, 0xcd, 0xce, 0xcf].includes(marker)) {
      if (segmentLength < 7) return null;
      const height = (data[offset + 3]! << 8) + data[offset + 4]!;
      const width = (data[offset + 5]! << 8) + data[offset + 6]!;
      return { format: 'image/jpeg', width, height };
    }
    offset += segmentLength;
  }
  return null;
}

/** Decode, crop, and encode a fresh JPEG; the pixel-only output has no input EXIF/XMP metadata. */
export async function reencodeCover(input: Uint8Array, crop: Crop): Promise<ProcessedImage> {
  const header = inspectCoverHeader(input);
  if (!header || header.width < 1 || header.height < 1 || header.width * header.height > MAX_PIXELS) throw new Error('COVER_INVALID_IMAGE');
  try {
    const image = await Image.decode(input);
    if (image.width !== header.width || image.height !== header.height) throw new Error('COVER_INVALID_IMAGE');
    const left = Math.floor(crop.x * image.width);
    const top = Math.floor(crop.y * image.height);
    const width = Math.max(1, Math.min(image.width - left, Math.round(crop.width * image.width)));
    const height = Math.max(1, Math.min(image.height - top, Math.round(crop.height * image.height)));
    if (Math.abs(width / height - COVER_ASPECT_RATIO) > 0.01) throw new Error('COVER_INVALID_IMAGE');
    image.crop(left, top, width, height);
    return { bytes: await image.encodeJPEG(88), width: image.width, height: image.height };
  } catch {
    throw new Error('COVER_INVALID_IMAGE');
  }
}
