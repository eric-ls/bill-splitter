const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const svg = fs.readFileSync(path.join(__dirname, '../public/icon.svg'));

async function generateIcons() {
  // Apple touch icon (180x180)
  await sharp(svg)
    .resize(180, 180)
    .png()
    .toFile(path.join(__dirname, '../public/apple-touch-icon.png'));
  console.log('Generated apple-touch-icon.png');

  // PWA icons
  await sharp(svg)
    .resize(192, 192)
    .png()
    .toFile(path.join(__dirname, '../public/icon-192.png'));
  console.log('Generated icon-192.png');

  await sharp(svg)
    .resize(512, 512)
    .png()
    .toFile(path.join(__dirname, '../public/icon-512.png'));
  console.log('Generated icon-512.png');

  // Favicon
  await sharp(svg)
    .resize(32, 32)
    .png()
    .toFile(path.join(__dirname, '../public/favicon.png'));
  console.log('Generated favicon.png');
}

generateIcons().catch(console.error);
