import { useState, useEffect } from 'react';

export default function useColorExtraction(imgUrl) {
  const [color, setColor] = useState('#f59e0b');
  useEffect(() => {
    if (!imgUrl) return;
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const c = document.createElement('canvas');
        c.width = c.height = 16;
        const ctx = c.getContext('2d');
        ctx.drawImage(img, 0, 0, 16, 16);
        const d = ctx.getImageData(0, 0, 16, 16).data;
        let r = 0, g = 0, b = 0, n = 0;
        for (let i = 0; i < d.length; i += 4) {
          r += d[i]; g += d[i+1]; b += d[i+2]; n++;
        }
        setColor(`rgb(${Math.round(r/n)}, ${Math.round(g/n)}, ${Math.round(b/n)})`);
      } catch {}
    };
    img.src = imgUrl;
  }, [imgUrl]);
  return color;
}
