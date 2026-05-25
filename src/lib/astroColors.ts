// Шим: значения из пакета astro-palette (источник правды).
// PlanetName в пакете — внутренний JSDoc-typedef, дублируем союз локально.
export {
  PLANET_GLYPHS,
  PLANET_NAMES_RU,
  PLANET_HUES,
  CHALDEAN_ORDER,
  WEEKDAY_RULERS,
} from 'astro-palette';

export type PlanetName =
  | 'Sun' | 'Moon' | 'Mercury' | 'Venus' | 'Mars' | 'Jupiter' | 'Saturn';
