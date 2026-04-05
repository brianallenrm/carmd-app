const fs = require('fs');
const path = require('path');

const srcDir = '/Users/BrianAllen/.gemini/antigravity/brain/ed10e64a-9f2d-4742-a129-e703e43e5e59/';
const destDir = '/Users/BrianAllen/.gemini/antigravity/scratch/carmd-app/public/';

const map = {
  'service_computer_diagnosis_high_tech_1774906560000_1774907788052.png': 'service-diagnostico.png',
  'service_engine_restoration_premium_1774906560000_1774907773006.png': 'service-motor.png',
  'service_clutch_kit_detail_1774906560000_1774907802884.png': 'service-clutch.png',
  'service_tuning_spark_plugs_1774906560000_1774907814323.png': 'service-afinacion.png',
  'service_brake_safety_active_1774906560000_1774907831044.png': 'service-frenos.png',
  'service_suspension_precision_1774906560000_1774907856378.png': 'service-suspension.png',
  'service_transmission_gears_1774906560000_1774907871636.png': 'service-transmision.png',
  'service_lubricacion_viscosity_1774906560000_1774907885610.png': 'service-lubricacion.png',
  'service_steering_rack_control_1774906560000_1774907898173.png': 'service-direccion.png'
};

console.log('Iniciando copia de imágenes de alta fidelidad...');

for (const [src, dest] of Object.entries(map)) {
  const srcPath = path.join(srcDir, src);
  const destPath = path.join(destDir, dest);
  
  try {
    if (fs.existsSync(srcPath)) {
      fs.copyFileSync(srcPath, destPath);
      console.log(`✅ Copiado exitosamente: ${dest}`);
    } else {
      console.log(`❌ Archivo origen no encontrado: ${src}`);
    }
  } catch (e) {
    console.error(`❌ Error copiando ${src}: ${e.message}`);
  }
}

console.log('¡Proceso finalizado! Revisa tu carpeta public.');
