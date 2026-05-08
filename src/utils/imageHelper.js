// src/utils/imageHelper.js

const DEFAULT_MAX_WIDTH = 1920;
const DEFAULT_QUALITY = 0.92;

const isBrowserImageFile = file => file && typeof file.type === 'string' && file.type.startsWith('image/');

const getTargetMimeType = file => {
  const type = String(file?.type || '').toLowerCase();

  if (type === 'image/png' || type === 'image/webp' || type === 'image/gif') {
    return 'image/webp';
  }

  return 'image/jpeg';
};

export const processImageForStorage = (file, maxWidth = DEFAULT_MAX_WIDTH, quality = DEFAULT_QUALITY) => {
  return new Promise((resolve, reject) => {
    if (!isBrowserImageFile(file)) {
      reject(new Error('Invalid image file.'));
      return;
    }

    const reader = new FileReader();

    reader.onerror = () => {
      reject(new Error('Failed to read image file.'));
    };

    reader.onload = event => {
      const img = new Image();

      img.onerror = () => {
        reject(new Error('Failed to decode image.'));
      };

      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');

          let width = img.width || maxWidth;
          let height = img.height || maxWidth;

          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }

          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext('2d');

          if (!ctx) {
            reject(new Error('Canvas 2D context is not available.'));
            return;
          }

          const targetMimeType = getTargetMimeType(file);

          if (targetMimeType === 'image/jpeg') {
            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
          }

          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          ctx.drawImage(img, 0, 0, width, height);

          const compressedBase64 = canvas.toDataURL(targetMimeType, quality);

          if (!compressedBase64 || compressedBase64 === 'data:,') {
            reject(new Error('Failed to export image from canvas.'));
            return;
          }

          resolve(compressedBase64);
        } catch (err) {
          reject(err);
        }
      };

      img.src = event.target?.result;
    };

    reader.readAsDataURL(file);
  });
};