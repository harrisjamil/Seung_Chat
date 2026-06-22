import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const size = 512;
const svg = `
<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
  <rect width="100%" height="100%" rx="96" fill="#171717"/>
  <text x="50%" y="54%" font-size="280" font-family="Segoe UI, Malgun Gothic, sans-serif" font-weight="700" fill="#fafafa" text-anchor="middle" dominant-baseline="middle">승</text>
</svg>
`;

const assetsDir = path.join(process.cwd(), 'desktop', 'assets');
await fs.mkdir(assetsDir, { recursive: true });

const pngPath = path.join(assetsDir, 'icon.png');
const pngBuffer = await sharp(Buffer.from(svg)).png().toBuffer();
await fs.writeFile(pngPath, pngBuffer);

console.log(`Wrote ${pngPath} (${size}x${size})`);
