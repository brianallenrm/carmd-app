const fs = require('fs');
const path = require('path');

const srcDir = '/Users/BrianAllen/.gemini/antigravity/brain/ed10e64a-9f2d-4742-a129-e703e43e5e59/';
const destDir = '/Users/BrianAllen/.gemini/antigravity/scratch/carmd-app/public/';

console.log('Copiando nueva imagen de lubricación...');

try {
  const srcPath = path.join(srcDir, 'carmd_service_lubricacion_1774918505796.png');
  const destPath = path.join(destDir, 'service-lubricacion.png');
  
  if (fs.existsSync(srcPath)) {
    fs.copyFileSync(srcPath, destPath);
    console.log('✅ ¡Imagen de lubricación instaurada exitosamente!');
  } else {
    console.log('❌ No se encontró la imagen recién generada.');
  }
} catch (e) {
  console.error('❌ Error:', e.message);
}
