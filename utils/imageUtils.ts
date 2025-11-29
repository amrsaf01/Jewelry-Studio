
import { WatermarkSettings, WatermarkPosition } from "../types";

/**
 * Converts a File object to a Base64 string.
 */
export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const result = reader.result as string;
      // Remove data URL prefix (e.g., "data:image/png;base64,") to get raw base64
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = (error) => reject(error);
  });
};

/**
 * Converts an image URL to a File object.
 */
export const urlToFile = async (url: string, filename: string): Promise<File> => {
  const response = await fetch(url);
  const blob = await response.blob();
  return new File([blob], filename, { type: blob.type });
};

const calculatePosition = (
    width: number, 
    height: number, 
    objWidth: number, 
    objHeight: number, 
    position: WatermarkPosition, 
    padding: number
): { x: number, y: number } => {
    let x = 0;
    let y = 0;

    switch (position) {
        case 'top-left':
            x = padding;
            y = padding;
            break;
        case 'top-right':
            x = width - objWidth - padding;
            y = padding;
            break;
        case 'bottom-left':
            x = padding;
            y = height - objHeight - padding;
            break;
        case 'bottom-right':
            x = width - objWidth - padding;
            y = height - objHeight - padding;
            break;
        case 'center':
            x = (width - objWidth) / 2;
            y = (height - objHeight) / 2;
            break;
    }
    return { x, y };
};

/**
 * Adds a watermark (text or logo) to an image.
 */
export const addWatermark = (
  imageUrl: string, 
  settings: WatermarkSettings
): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = imageUrl;

    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Could not get canvas context'));
        return;
      }

      canvas.width = img.width;
      canvas.height = img.height;

      // Draw original image
      ctx.drawImage(img, 0, 0);

      const padding = Math.floor(img.width * 0.03);
      const position = settings.textPosition || 'bottom-right';

      if (settings.type === 'text' && settings.text) {
        // Configure Text Watermark Style
        const scale = (settings.textSize || 50) / 1000;
        const fontSize = Math.max(20, Math.floor(img.width * scale));
        const fontFamily = settings.textFont || '"Playfair Display", serif';
        
        ctx.font = `bold ${fontSize}px ${fontFamily}`;
        
        // Shadow for readability
        ctx.shadowColor = 'rgba(0, 0, 0, 0.7)';
        ctx.shadowBlur = 4;
        ctx.shadowOffsetX = 2;
        ctx.shadowOffsetY = 2;

        ctx.fillStyle = settings.textColor || 'rgba(255, 255, 255, 0.9)';

        let x = 0;
        let y = 0;

        // Reset baselines
        ctx.textBaseline = 'alphabetic'; 

        switch (position) {
            case 'top-left':
                ctx.textAlign = 'left';
                ctx.textBaseline = 'top';
                x = padding;
                y = padding;
                break;
            case 'top-right':
                ctx.textAlign = 'right';
                ctx.textBaseline = 'top';
                x = canvas.width - padding;
                y = padding;
                break;
            case 'bottom-left':
                ctx.textAlign = 'left';
                ctx.textBaseline = 'bottom';
                x = padding;
                y = canvas.height - padding;
                break;
            case 'bottom-right':
                ctx.textAlign = 'right';
                ctx.textBaseline = 'bottom';
                x = canvas.width - padding;
                y = canvas.height - padding;
                break;
            case 'center':
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                x = canvas.width / 2;
                y = canvas.height / 2;
                break;
        }

        ctx.fillText(settings.text, x, y);
        
        resolve(canvas.toDataURL('image/png'));
        
      } else if (settings.type === 'logo' && settings.logoUrl) {
        const logo = new Image();
        logo.crossOrigin = 'anonymous';
        logo.src = settings.logoUrl;
        
        logo.onload = () => {
          // Calculate Logo Dimensions
          const maxLogoWidth = img.width * 0.25;
          const maxLogoHeight = img.height * 0.15;
          
          let logoW = logo.width;
          let logoH = logo.height;
          const ratio = logoW / logoH;

          // Scale down if needed
          if (logoW > maxLogoWidth) {
            logoW = maxLogoWidth;
            logoH = logoW / ratio;
          }
          if (logoH > maxLogoHeight) {
            logoH = maxLogoHeight;
            logoW = logoH * ratio;
          }

          const { x, y } = calculatePosition(canvas.width, canvas.height, logoW, logoH, position, padding);

          // Add a slight shadow/glow to logo for visibility
          ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
          ctx.shadowBlur = 4;
          
          ctx.globalAlpha = 0.9;
          ctx.drawImage(logo, x, y, logoW, logoH);
          ctx.globalAlpha = 1.0;

          resolve(canvas.toDataURL('image/png'));
        };

        logo.onerror = (e) => {
            console.warn("Could not load logo image for watermark", e);
            resolve(canvas.toDataURL('image/png'));
        };

      } else {
        // No watermark
        resolve(canvas.toDataURL('image/png'));
      }
    };

    img.onerror = (err) => reject(err);
  });
};