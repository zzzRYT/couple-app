import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import appConfig from '../../../app.config';

const expo = appConfig.expo as {
  icon: string;
  ios: { icon: { light: string; dark: string; tinted: string } };
  android: { adaptiveIcon: { foregroundImage: string; monochromeImage: string } };
};

it('references icon assets that exist', () => {
  const paths = [
    expo.icon,
    expo.ios.icon.light,
    expo.ios.icon.dark,
    expo.ios.icon.tinted,
    expo.android.adaptiveIcon.foregroundImage,
    expo.android.adaptiveIcon.monochromeImage,
  ];

  for (const path of paths) {
    expect(existsSync(join(__dirname, '../../..', path))).toBe(true);
  }
});

it('uses a 1024 by 1024 opaque RGB PNG for the iOS light icon', () => {
  const path = join(__dirname, '../../..', expo.ios.icon.light);
  const png = readFileSync(path);
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  expect(png.subarray(0, 8)).toEqual(signature);
  expect(png.readUInt32BE(16)).toBe(1024);
  expect(png.readUInt32BE(20)).toBe(1024);
  expect(png[25]).toBe(2);

  let offset = 8;
  const chunks: string[] = [];
  while (offset < png.length) {
    const length = png.readUInt32BE(offset);
    const type = png.toString('ascii', offset + 4, offset + 8);
    chunks.push(type);
    offset += length + 12;
  }
  expect(chunks).not.toContain('tRNS');
});
