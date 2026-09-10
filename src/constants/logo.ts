import React from 'react';

export const LOGO_RW_018 = logoImg;
export const LOGO_RW_018_JPG = `${import.meta.env.BASE_URL}logo-rw-018.jpg`;

export const LOGO_RT_039 = logoRt039Img;
export const LOGO_RT_040 = logoRt040Img;
export const LOGO_RT_041 = logoRt041Img;
export const LOGO_RT_042 = logoRt042Img;

export const RT_LOGOS: Record<string, string> = {
  '039': LOGO_RT_039,
  '040': LOGO_RT_040,
  '041': LOGO_RT_041,
  '042': LOGO_RT_042,
  '39': LOGO_RT_039,
  '40': LOGO_RT_040,
  '41': LOGO_RT_041,
  '42': LOGO_RT_042,
};

export function getRtLogo(rt?: string | null): string | undefined {
  if (!rt) return undefined;
  const cleanRt = rt.trim().replace(/^0+/, '');
  return RT_LOGOS[rt] || RT_LOGOS[cleanRt] || RT_LOGOS[`0${cleanRt}`];
}

/**
 * Robust error fallback handler for RW 018 Logo images
 * Cascades gracefully: Profile URL -> Bundled Vite Asset -> Static Public JPEG -> Public PNG
 */
export function handleLogoError(
  e: React.SyntheticEvent<HTMLImageElement, Event>,
  customFallback?: string
) {
  const target = e.currentTarget;
  target.onerror = null; // Prevent infinite event loops
  
  if (customFallback && target.src !== customFallback) {
    target.src = customFallback;
  } else if (LOGO_RW_018 && !target.src.includes(LOGO_RW_018)) {
    target.src = LOGO_RW_018;
  } else if (!target.src.endsWith('/logo-rw-018.jpg')) {
    target.src = '/logo-rw-018.jpg';
  } else if (!target.src.endsWith('/logo-rw-018.png')) {
    target.src = '/logo-rw-018.png';
  }
}

export default LOGO_RW_018;




