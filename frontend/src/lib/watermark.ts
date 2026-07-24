export const processImageWhiteToAlpha = (img: HTMLImageElement): HTMLCanvasElement => {
  const canvas = document.createElement('canvas');
  canvas.width = img.width;
  canvas.height = img.height;
  const ctx = canvas.getContext('2d');
  
  if (!ctx) return canvas;
  
  ctx.drawImage(img, 0, 0, img.width, img.height);
  try {
    const imageData = ctx.getImageData(0, 0, img.width, img.height);
    const data = imageData.data;
    
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      
      const minColor = Math.min(r, g, b);
      const alpha = (255 - minColor) / 255;
      
      if (alpha < 0.01) {
        data[i + 3] = 0; // Pure white becomes transparent
      } else {
        // Recover original color without the white tint
        data[i] = Math.max(0, Math.min(255, (r - 255 * (1 - alpha)) / alpha));
        data[i + 1] = Math.max(0, Math.min(255, (g - 255 * (1 - alpha)) / alpha));
        data[i + 2] = Math.max(0, Math.min(255, (b - 255 * (1 - alpha)) / alpha));
        data[i + 3] = alpha * 255;
      }
    }
    ctx.putImageData(imageData, 0, 0);
  } catch (e) {
    console.warn("Could not process logo pixels (likely CORS)", e);
  }
  
  return canvas;
};

export const addWatermarkToCanvas = (
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number
): Promise<void> => {
  return new Promise((resolve) => {
    // We assume the logo is accessible at /logo.png (placed in public directory)
    const logoUrl = '/logo.png'; 
    const logo = new Image();
    logo.crossOrigin = "Anonymous";
    logo.src = logoUrl;
    logo.onload = () => {
      // Calculate logo dimensions to fit well, e.g., 20% of canvas width
      const maxLogoWidth = width * 0.2; 
      let logoWidth = logo.width;
      let logoHeight = logo.height;
      
      if (logoWidth > maxLogoWidth) {
        logoHeight *= maxLogoWidth / logoWidth;
        logoWidth = maxLogoWidth;
      }
      
      const padding = 15;
      const x = width - logoWidth - padding;
      const y = padding;
      
      // Process logo to remove white background before drawing
      const processedCanvas = processImageWhiteToAlpha(logo);
      ctx.drawImage(processedCanvas, x, y, logoWidth, logoHeight);
      
      resolve();
    };
    logo.onerror = () => {
      // If logo fails to load, just proceed without watermarking
      console.warn('Watermark logo failed to load. Please ensure logo.png exists in the public directory.');
      resolve();
    };
  });
};
