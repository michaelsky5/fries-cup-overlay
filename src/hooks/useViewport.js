import { useState, useEffect } from 'react';

const getDensityByWidth = w => {
  if (w < 1280) return 'ultra';
  if (w < 1700) return 'compact';
  if (w < 2800) return 'standard';
  return 'spacious';
};

const getWindowSize = () => {
  if (typeof window === 'undefined') return { w: 1600, h: 900 };
  return { w: window.innerWidth, h: window.innerHeight };
};

export function useViewport() {
  const [viewport, setViewport] = useState(getWindowSize);

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;

    let timeoutId;

    const handleResize = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        setViewport(getWindowSize());
      }, 150);
    };

    window.addEventListener('resize', handleResize);
    setViewport(getWindowSize());

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