import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Pour ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Tailles d'icônes PWA requises
const iconSizes = [72, 96, 128, 144, 152, 192, 384, 512];

// Chemins
const sourceImage = path.join(__dirname, '../public/lovable-uploads/482dd564-f9a1-48f4-bef4-6569e9c64c0b.png');
const outputDir = path.join(__dirname, '../public/icons');

// Créer le dossier icons s'il n'existe pas
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

async function generateIcons() {
  console.log('🎨 Génération des icônes PWA CourseMax...');
  
  try {
    // Vérifier que l'image source existe
    if (!fs.existsSync(sourceImage)) {
      console.error('❌ Image source non trouvée:', sourceImage);
      return;
    }

    console.log('📷 Image source trouvée:', sourceImage);

    // Générer chaque taille d'icône
    for (const size of iconSizes) {
      const outputPath = path.join(outputDir, `icon-${size}x${size}.png`);
      
      await sharp(sourceImage)
        .resize(size, size, {
          fit: 'contain',
          background: { r: 255, g: 255, b: 255, alpha: 0 } // Fond transparent
        })
        .png({
          quality: 90,
          compressionLevel: 9
        })
        .toFile(outputPath);
        
      console.log(`✅ Généré: icon-${size}x${size}.png`);
    }

    // Créer aussi une version maskable (avec padding pour iOS)
    for (const size of [192, 512]) {
      const outputPath = path.join(outputDir, `icon-${size}x${size}-maskable.png`);
      
      await sharp(sourceImage)
        .resize(Math.round(size * 0.8), Math.round(size * 0.8), {
          fit: 'contain',
          background: { r: 255, g: 79, b: 46, alpha: 1 } // Couleur de marque CourseMax
        })
        .extend({
          top: Math.round(size * 0.1),
          bottom: Math.round(size * 0.1),
          left: Math.round(size * 0.1),
          right: Math.round(size * 0.1),
          background: { r: 255, g: 79, b: 46, alpha: 1 }
        })
        .png({
          quality: 90,
          compressionLevel: 9
        })
        .toFile(outputPath);
        
      console.log(`✅ Généré: icon-${size}x${size}-maskable.png`);
    }

    // Copier aussi le favicon.ico amélioré
    const faviconPath = path.join(outputDir, 'favicon.ico');
    await sharp(sourceImage)
      .resize(32, 32, {
        fit: 'contain',
        background: { r: 255, g: 255, b: 255, alpha: 0 }
      })
      .png()
      .toFile(faviconPath.replace('.ico', '.png'));
      
    console.log('✅ Généré: favicon.png');

    console.log('🎉 Toutes les icônes PWA ont été générées avec succès !');
    console.log('📁 Dossier:', outputDir);
    console.log('📱 Votre PWA CourseMax est maintenant prête !');
    
  } catch (error) {
    console.error('❌ Erreur lors de la génération:', error);
  }
}

generateIcons();
