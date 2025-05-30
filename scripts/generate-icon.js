const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const sizes = {
  'app-icon.png': 1024,
  'adaptive-icon.png': 1024,
  'splash.png': 1242,
  'favicon.png': 48
};

async function generateIcons() {
  const svgBuffer = fs.readFileSync(path.join(__dirname, '../assets/app-icon.svg'));
  
  for (const [filename, size] of Object.entries(sizes)) {
    await sharp(svgBuffer)
      .resize(size, size)
      .png()
      .toFile(path.join(__dirname, '../assets', filename));
    
    console.log(`Generated ${filename}`);
  }
}

generateIcons().catch(console.error); 