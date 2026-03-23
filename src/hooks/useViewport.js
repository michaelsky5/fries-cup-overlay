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
    const handleResize = () => setViewport({ w: window.innerWidth, h: window.innerHeight });
    window.addEventListener('resize', handleResize);
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
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