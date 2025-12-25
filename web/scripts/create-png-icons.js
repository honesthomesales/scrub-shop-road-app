import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function createPNGIcons() {
  const publicDir = path.join(__dirname, '../public');
  
  // Read SVG files
  const svg192 = fs.readFileSync(path.join(publicDir, 'icon-192.svg'));
  const svg512 = fs.readFileSync(path.join(publicDir, 'icon-512.svg'));
  
  // Convert to PNG
  await sharp(svg192)
    .png()
    .resize(192, 192)
    .toFile(path.join(publicDir, 'icon-192.png'));
  
  await sharp(svg512)
    .png()
    .resize(512, 512)
    .toFile(path.join(publicDir, 'icon-512.png'));
  
  console.log('✅ PNG icons created successfully!');
}

createPNGIcons().catch(console.error);

