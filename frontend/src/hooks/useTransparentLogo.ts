import { useState, useEffect } from 'react';
import { processImageWhiteToAlpha } from '@/lib/watermark';

export const useTransparentLogo = (src = '/logo.png') => {
  const [logoDataUrl, setLogoDataUrl] = useState<string | null>(null);

  useEffect(() => {
    const img = new Image();
    img.crossOrigin = "Anonymous";
    img.src = src;
    img.onload = () => {
      // Use our utility to convert the white background to transparent
      const canvas = processImageWhiteToAlpha(img);
      setLogoDataUrl(canvas.toDataURL('image/png'));
    };
    img.onerror = () => {
      // Fallback to original src if processing fails
      setLogoDataUrl(src);
    };
  }, [src]);

  return logoDataUrl;
};
