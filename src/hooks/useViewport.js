import { useState, useEffect } from 'react';

const getDensityByWidth = w => {
  if (w < 1280) return 'ultra';
  if (w < 1700) return 'compact';
  if (w < 2800) return 'standard';
  return 'spacious';
};

export function useViewport() {
  const [viewport, setViewport] = useState({
    w: typeof window !== 'undefined' ? window.innerWidth : 1600,
    h: typeof window !== 'undefined' ? window.innerHeight : 900
  });

  useEffect(() => {
    let timeoutId;
    
    const handleResize = () => {
      // 🚀 优化：使用防抖，只有当用户停止拖拽窗口 150ms 后，才真正触发整个 App 的重渲染
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        setViewport({ w: window.innerWidth, h: window.innerHeight });
      }, 150); 
    };

    window.addEventListener('resize', handleResize);
    
    // 初始调用一次，直接拿当前尺寸
    setViewport({ w: window.innerWidth, h: window.innerHeight });
    
    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(timeoutId);
    };
  }, []);

  const density = getDensityByWidth(viewport.w);
  const isUltra = density === 'ultra';
  const isDense = density === 'ultra' || density === 'compact';
  const isShort = viewport.h < 900;
  const isCompact = density === 'compact';
  const isStandard = density === 'standard';
  const isSpacious = density === 'spacious';

  return {
    ...viewport,
    density,
    isUltra,
    isDense,
    isShort,
    isCompact,
    isStandard,
    isSpacious
  };
}