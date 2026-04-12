// src/utils/imageHelper.js

// 🚀 修改点 1：将默认最大宽度提升至 1920（适应 1080P 直播），增加 quality 参数默认 0.92
export const processImageForStorage = (file, maxWidth = 1920, quality = 0.92) => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        // 如果图片太宽，按比例缩小
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');

        // 智能判断目标格式
        // 如果原图是 PNG/WEBP/GIF，使用 webp 来保留透明度并强力压缩
        const isTransparent = file.type === 'image/png' || file.type === 'image/webp' || file.type === 'image/gif';
        const targetMimeType = isTransparent ? 'image/webp' : 'image/jpeg';

        // 如果是转 JPG，必须先铺一层白色背景，防止透明图变全黑
        if (targetMimeType === 'image/jpeg') {
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
        }

        // 绘制到 Canvas 上（使用更好的平滑算法）
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);

        // 🚀 修改点 2：使用动态传入的 quality（92% 的高画质）
        const compressedBase64 = canvas.toDataURL(targetMimeType, quality);
        
        resolve(compressedBase64);
      };
    };
  });
};