// Шим: движок палитры из пакета astro-palette.
//
// Конвенция portfolio: фиксированные hue планет (PLANET_HUES), без аспектной
// модуляции. getColorMode остаётся здесь (DOM-зависимый). Типы переименованы
// под прежние имена (AstroThemeState, PlanetaryHourInfo).
import { computeState as _computeState } from 'astro-palette';
import type {
  AstroState,
  ColorMode,
  RoleSpec,
  SolarTimes,
  PaletteModulation,
  PlanetaryHour,
} from 'astro-palette';

export {
  PALETTE_SPEC,
  TOKEN_NAMES,
  computePalette,
  computeSolarTimes,
  getPlanetaryHour,
} from 'astro-palette';

export type { ColorMode, RoleSpec, SolarTimes, PaletteModulation };
export type AstroThemeState = AstroState;
export type PlanetaryHourInfo = PlanetaryHour;

/** Цветовой режим по OS-предпочтению. SSR/pre-JS фолбэк — 'dark'. */
export function getColorMode(): ColorMode {
  if (typeof window === 'undefined') return 'dark';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

/**
 * Полное состояние палитры (конвенция portfolio): фиксированные hue, без
 * аспектной модуляции, mode из OS. Тонкая обёртка над computeState пакета.
 */
export function computeState(now: Date, lat: number, lon: number): AstroThemeState {
  return _computeState(now, lat, lon, { mode: getColorMode(), hueSource: 'fixed' });
}
