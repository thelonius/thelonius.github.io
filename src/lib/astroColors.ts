/**
 * Planetary palette source of truth.
 *
 * Each planet contributes a single OKLCH hue. Lightness and chroma per
 * semantic role come from PALETTE_SPEC in themeEngine.ts so that contrast
 * is decided by role, not by planet — guarantees WCAG AA in both modes.
 */

export type PlanetName =
  | 'Sun' | 'Moon' | 'Mercury' | 'Venus' | 'Mars' | 'Jupiter' | 'Saturn';

export const PLANET_HUES: Record<PlanetName, number> = {
  Sun: 85,
  Moon: 245,
  Mercury: 220,
  Venus: 340,
  Mars: 25,
  Jupiter: 295,
  Saturn: 255,
};

export const PLANET_GLYPHS: Record<PlanetName, string> = {
  Sun: '☉',
  Moon: '☽',
  Mercury: '☿',
  Venus: '♀',
  Mars: '♂',
  Jupiter: '♃',
  Saturn: '♄',
};

export const PLANET_NAMES_RU: Record<PlanetName, string> = {
  Sun: 'Солнце',
  Moon: 'Луна',
  Mercury: 'Меркурий',
  Venus: 'Венера',
  Mars: 'Марс',
  Jupiter: 'Юпитер',
  Saturn: 'Сатурн',
};

/** Chaldean planetary order, slow → fast. */
export const CHALDEAN_ORDER: PlanetName[] = [
  'Saturn', 'Jupiter', 'Mars', 'Sun', 'Venus', 'Mercury', 'Moon',
];

/** Day of week → planetary day ruler. 0 = Sunday. */
export const WEEKDAY_RULERS: Record<number, PlanetName> = {
  0: 'Sun',
  1: 'Moon',
  2: 'Mars',
  3: 'Mercury',
  4: 'Jupiter',
  5: 'Venus',
  6: 'Saturn',
};
