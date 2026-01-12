import { createWorker } from 'tesseract.js';

export class OCRService {
  /**
   * Analyse une image de compteur pour en extraire l'index numérique.
   */
  async analyzeMeterPhoto(imageBuffer: Buffer): Promise<{ value: number; confidence: number }> {
    const worker = await createWorker('fra+eng');
    
    try {
      // Configuration pour ne reconnaître que les chiffres et quelques caractères utiles
      await worker.setParameters({
        tessedit_char_whitelist: '0123456789.,',
      });

      const { data: { text, confidence } } = await worker.recognize(imageBuffer);
      
      // Nettoyage du texte pour extraire le nombre
      // On cherche une suite de chiffres qui pourrait être l'index
      const cleanedText = text.replace(/,/g, '.').replace(/[^0-9.]/g, ' ').trim();
      const numbers = cleanedText.split(/\s+/).filter(n => n.length >= 3); // On ignore les trop petits nombres
      
      const value = numbers.length > 0 ? parseFloat(numbers[0]) : 0;

      return {
        value,
        confidence,
      };
    } finally {
      await worker.terminate();
    }
  }
}

export const ocrService = new OCRService();
