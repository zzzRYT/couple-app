// Generates photo-like test images (smooth gradients + grain) with sharp from the repo's devDependencies.
import sharp from 'sharp';
const out = process.argv[2];
function photo(w, h) {
  const buf = Buffer.alloc(w * h * 3);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const i = (y * w + x) * 3, n = () => (Math.random() - 0.5) * 40;
    buf[i] = Math.max(0, Math.min(255, 128 + 100 * Math.sin(x / 97) + n()));
    buf[i + 1] = Math.max(0, Math.min(255, 128 + 100 * Math.cos(y / 61) + n()));
    buf[i + 2] = Math.max(0, Math.min(255, (x + y) % 256 + n()));
  }
  return sharp(buf, { raw: { width: w, height: h, channels: 3 } });
}
await photo(1600, 1200).jpeg({ quality: 90 }).withMetadata({ exif: { IFD0: { Make: 'TestCam', Artist: 'secret-name' } } }).toFile(out + '/photo-1600x1200.jpg');
await photo(1600, 1600).jpeg({ quality: 90 }).toFile(out + '/photo-1600x1600.jpg');
await photo(2100, 2000).jpeg({ quality: 80 }).toFile(out + '/big-2100x2000.jpg');
await photo(800, 800).png().toFile(out + '/square-800.png');
