import { assertEquals, assertRejects } from 'jsr:@std/assert@1';
import { Image } from 'https://deno.land/x/imagescript@1.3.0/mod.ts';
import { inspectCoverHeader, reencodeCover } from '../image.ts';

Deno.test('PNG headers expose dimensions without decoding pixels', () => {
  const image = new Uint8Array(24);
  image.set([137, 80, 78, 71, 13, 10, 26, 10], 0);
  image.set([0, 0, 0, 13, 73, 72, 68, 82], 8);
  new DataView(image.buffer).setUint32(16, 400);
  new DataView(image.buffer).setUint32(20, 300);
  assertEquals(inspectCoverHeader(image), { format: 'image/png', width: 400, height: 300 });
});

Deno.test('JPEG SOF header exposes dimensions and non-image bytes are refused', () => {
  const image = new Uint8Array([0xff,0xd8,0xff,0xc0,0x00,0x11,0x08,0x01,0x2c,0x01,0x90,0,0,0,0,0,0,0,0,0,0]);
  assertEquals(inspectCoverHeader(image), { format: 'image/jpeg', width: 400, height: 300 });
  assertEquals(inspectCoverHeader(new Uint8Array([0, 1, 2, 3])), null);
});

function jpegHeader(width: number, height: number): Uint8Array {
  return new Uint8Array([0xff, 0xd8, 0xff, 0xc0, 0x00, 0x11, 0x08, height >> 8, height & 0xff, width >> 8, width & 0xff, 3, 1, 0x22, 0, 2, 0x11, 1, 3, 0x11, 1]);
}
const fullCrop = { x: 0, y: 0, width: 1, height: 1 };

Deno.test('inputs above the decoded pixel limit are refused before decoding', async () => {
  await assertRejects(() => reencodeCover(jpegHeader(2001, 2001), fullCrop), Error, 'COVER_INVALID_IMAGE');
  await assertRejects(() => reencodeCover(jpegHeader(8160, 6120), fullCrop), Error, 'COVER_INVALID_IMAGE');
});

Deno.test('a square image at the app upload size is re-encoded as a square JPEG', async () => {
  const source = await new Image(1600, 1600).encodeJPEG(80);
  const processed = await reencodeCover(source, fullCrop);
  assertEquals([processed.width, processed.height], [1600, 1600]);
  assertEquals(inspectCoverHeader(processed.bytes)?.format, 'image/jpeg');
});
