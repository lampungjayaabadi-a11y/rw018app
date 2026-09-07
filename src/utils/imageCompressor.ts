/**
 * Image compressor & crop utility for user profile avatars and general photos.
 * Compresses large mobile/DSLR photos to lightweight square avatars (< 50KB Base64 JPEG).
 */

export interface CompressOptions {
  maxDimension?: number;
  quality?: number;
  aspectRatio?: 'square' | 'original';
}

export function compressImageFile(
  file: File,
  options: CompressOptions = {}
): Promise<string> {
  const { maxDimension = 512, quality = 0.85, aspectRatio = 'square' } = options;

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Gagal membaca file gambar.'));
    reader.onload = (e) => {
      const src = e.target?.result as string;
      if (!src) {
        reject(new Error('File gambar kosong.'));
        return;
      }

      const img = new Image();
      img.onerror = () => reject(new Error('Format file gambar tidak valid.'));
      img.onload = () => {
        try {
          const result = renderToCanvas(img, maxDimension, quality, aspectRatio);
          resolve(result);
        } catch (err) {
          reject(err);
        }
      };
      img.src = src;
    };
    reader.readAsDataURL(file);
  });
}

export function cropAndCompressDataUrl(
  dataUrl: string,
  options: CompressOptions = {}
): Promise<string> {
  const { maxDimension = 512, quality = 0.85, aspectRatio = 'square' } = options;

  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onerror = () => reject(new Error('Gagal memproses gambar URL.'));
    img.onload = () => {
      try {
        const result = renderToCanvas(img, maxDimension, quality, aspectRatio);
        resolve(result);
      } catch (err) {
        reject(err);
      }
    };
    img.src = dataUrl;
  });
}

function renderToCanvas(
  img: HTMLImageElement,
  maxDimension: number,
  quality: number,
  aspectRatio: 'square' | 'original'
): string {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas context 2D tidak didukung.');

  let targetWidth = img.naturalWidth || img.width;
  let targetHeight = img.naturalHeight || img.height;

  if (aspectRatio === 'square') {
    // Center square crop
    const minSide = Math.min(targetWidth, targetHeight);
    const sourceX = (targetWidth - minSide) / 2;
    const sourceY = (targetHeight - minSide) / 2;

    const outDim = Math.min(minSide, maxDimension);
    canvas.width = outDim;
    canvas.height = outDim;

    // Smooth image rendering
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    ctx.drawImage(img, sourceX, sourceY, minSide, minSide, 0, 0, outDim, outDim);
  } else {
    // Proportional scaling
    let w = targetWidth;
    let h = targetHeight;
    if (w > maxDimension || h > maxDimension) {
      if (w > h) {
        h = Math.round((h * maxDimension) / w);
        w = maxDimension;
      } else {
        w = Math.round((w * maxDimension) / h);
        h = maxDimension;
      }
    }
    canvas.width = w;
    canvas.height = h;

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    ctx.drawImage(img, 0, 0, w, h);
  }

  return canvas.toDataURL('image/jpeg', quality);
}
