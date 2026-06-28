import type { AspectAngle, Palette } from '../types';

export const DEFAULT_ASPECT_COLORS: Record<AspectAngle, string> = {
  0:   '#FFD27A', // conjunction — warm gold
  30:  '#A8B6D8', // semi-sextile
  45:  '#FFA66B', // semi-square
  60:  '#7BD3EA', // sextile — cool cyan
  72:  '#C58CFF', // quintile — violet
  90:  '#FF6B6B', // square — red
  120: '#7BE39C', // trine — green
  135: '#FFB36B', // sesquisquare
  144: '#A878FF', // biquintile
  150: '#B89EFF', // quincunx — soft violet
  180: '#FF6BC1', // opposition — magenta
};

export const DEFAULT_PLANET_COLORS: Record<string, string> = {
  Sun:     '#FFD27A',
  Moon:    '#E8ECF4',
  Mercury: '#7BD3EA',
  Venus:   '#F5A8C8',
  Mars:    '#FF6B6B',
  Jupiter: '#FFB36B',
  Saturn:  '#C9A86A',
  Uranus:  '#7BE3D6',
  Neptune: '#7BA8FF',
  Pluto:   '#A878FF',
};

export const DEFAULT_PALETTE: Required<Pick<Palette, 'background' | 'planets' | 'aspects'>> = {
  background: '#0a0e27',
  planets: DEFAULT_PLANET_COLORS,
  aspects: DEFAULT_ASPECT_COLORS,
};

export function resolvePalette(p?: Palette): Required<Pick<Palette, 'background' | 'planets' | 'aspects'>> {
  return {
    background: p?.background ?? DEFAULT_PALETTE.background,
    planets: { ...DEFAULT_PALETTE.planets, ...(p?.planets ?? {}) },
    aspects: { ...DEFAULT_PALETTE.aspects, ...(p?.aspects ?? {}) },
  };
}

/**
 * Creates a simple monochrome palette where the background is the ink color
 * and all astronomical elements use the accent color.
 */
export function monochromePalette(accent: string, ink: string, _opts?: any): Palette {
  return {
    background: ink,
    aspects: Object.keys(DEFAULT_ASPECT_COLORS).reduce((acc, key) => {
      acc[key as unknown as AspectAngle] = accent;
      return acc;
    }, {} as Partial<Record<AspectAngle, string>>),
    planets: {}, // Use resolvePalette to fill in defaults or keep them transparent
  };
}
