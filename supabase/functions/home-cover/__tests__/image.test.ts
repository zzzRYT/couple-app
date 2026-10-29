import { assertEquals } from 'jsr:@std/assert@1';
import { inspectCoverHeader } from '../image.ts';

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
