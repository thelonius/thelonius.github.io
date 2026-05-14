/**
 * Theme engine: solar times (NOAA Spencer 1971), chaldean planetary hours,
 * OKLCH palette generation. Pure functions — both the inline boot script and
 * the deferred manager script consume the same logic via `define:vars`.
 */

import { CHALDEAN_ORDER, PLANET_HUES, WEEKDAY_RULERS, type PlanetName } from './astroColors';

export interface SolarTimes {
  sunriseMin: number;
  sunsetMin: number;
}

export type ColorMode = 'dark' | 'light';

export interface RoleSpec {
  L: number;
  C: number;
  hueOverride?: number | null;
}

/**
 * OKLCH targets per role and mode.
 *
 * Contrast budget (AA, 4.5:1 for body text, 3:1 for UI):
 *   dark.text   L=92 vs dark.bg   L=14 → ΔL=78 → ~13:1   AAA
 *   dark.muted  L=68 vs dark.bg   L=14 → ΔL=54 → ~5.5:1  AA
 *   dark.accent L=75 vs dark.bg   L=14 → ΔL=61 → ~7:1    AAA
 *   light.text  L=22 vs light.bg  L=98 → ΔL=76 → ~14:1   AAA
 *   light.muted L=45 vs light.bg  L=98 → ΔL=53 → ~5.8:1  AA
 *   light.accent L=42 vs light.bg L=98 → ΔL=56 → ~7.5:1  AAA
 *
 * Chroma clamped to ≤0.14 for accent to stay in sRGB gamut across all
 * planetary hues (yellow-green at L=42 is the tight spot in light mode).
 */
export const PALETTE_SPEC: Record<ColorMode, Record<string, RoleSpec>> = {
  dark: {
    bg:        { L: 14, C: 0.012 },
    surface:   { L: 19, C: 0.018 },
    text:      { L: 92, C: 0.005 },
    textMuted: { L: 68, C: 0.020 },
    accent:    { L: 75, C: 0.140 },
    border:    { L: 30, C: 0.018 },
    success:   { L: 78, C: 0.140, hueOverride: 145 },
    warn:      { L: 80, C: 0.140, hueOverride: 75 },
  },
  light: {
    bg:        { L: 98, C: 0.005 },
    surface:   { L: 95, C: 0.012 },
    text:      { L: 22, C: 0.008 },
    textMuted: { L: 45, C: 0.020 },
    accent:    { L: 42, C: 0.140 },
    border:    { L: 80, C: 0.020 },
    success:   { L: 50, C: 0.140, hueOverride: 145 },
    warn:      { L: 55, C: 0.130, hueOverride: 75 },
  },
};

/** Map of role → CSS custom property name. */
export const TOKEN_NAMES: Record<string, string> = {
  bg: '--color-bg',
  surface: '--color-surface',
  text: '--color-text',
  textMuted: '--color-text-muted',
  accent: '--color-accent',
  border: '--color-border',
  success: '--color-success',
  warn: '--color-warn',
};

/**
 * Scheme II hue routing:
 *   bg, surface, text, textMuted, border → day ruler hue
 *   accent → hour ruler hue
 *   success, warn → fixed semantic hues
 */
function routeHue(role: string, dayHue: number, hourHue: number, spec: RoleSpec): number {
  if (spec.hueOverride !== undefined && spec.hueOverride !== null) return spec.hueOverride;
  if (role === 'accent') return hourHue;
  return dayHue;
}

export function computePalette(dayHue: number, hourHue: number, mode: ColorMode): Record<string, string> {
  const spec = PALETTE_SPEC[mode];
  const out: Record<string, string> = {};
  for (const role of Object.keys(TOKEN_NAMES)) {
    const s = spec[role];
    const h = routeHue(role, dayHue, hourHue, s);
    out[TOKEN_NAMES[role]] = `oklch(${s.L}% ${s.C} ${h})`;
  }
  return out;
}

/**
 * Approximate sunrise / sunset — NOAA Spencer 1971.
 *
 * These bound the day phase of the chaldean planetary hour scheme: day is
 * sunrise → sunset divided into 12 unequal hours, night is sunset → next
 * sunrise divided into 12. The light/dark colour mode does NOT come from
 * here — it follows the OS via `prefers-color-scheme`.
 */
export function computeSolarTimes(date: Date, lat: number, lon: number): SolarTimes {
  const dayOfYear = Math.floor(
    (Date.UTC(date.getFullYear(), date.getMonth(), date.getDate())
      - Date.UTC(date.getFullYear(), 0, 0)) / 86400000
  );
  const latRad = lat * Math.PI / 180;
  const B = 2 * Math.PI * (dayOfYear - 1) / 365;
  const eqOfTime = 229.18 * (
    0.000075
    + 0.001868 * Math.cos(B)
    - 0.032077 * Math.sin(B)
    - 0.014615 * Math.cos(2 * B)
    - 0.040849 * Math.sin(2 * B)
  );
  const decl = 0.006918 - 0.399912 * Math.cos(B) + 0.070257 * Math.sin(B)
    - 0.006758 * Math.cos(2 * B) + 0.000907 * Math.sin(2 * B)
    - 0.002697 * Math.cos(3 * B) + 0.00148 * Math.sin(3 * B);
  const tzOffsetMin = -date.getTimezoneOffset();

  const compMin = (angleDeg: number): number => {
    const cosHA = (Math.cos(angleDeg * Math.PI / 180) - Math.sin(latRad) * Math.sin(decl))
      / (Math.cos(latRad) * Math.cos(decl));
    const c = Math.max(-1, Math.min(1, cosHA));
    return Math.acos(c) * 180 / Math.PI;
  };

  const haSunrise = compMin(90.833);
  const solarNoonMin = 720 - 4 * lon - eqOfTime + tzOffsetMin;

  return {
    sunriseMin: solarNoonMin - haSunrise * 4,
    sunsetMin: solarNoonMin + haSunrise * 4,
  };
}

export interface PlanetaryHourInfo {
  ruler: PlanetName;
  dayRuler: PlanetName;
  phaseStartTs: number;
  phaseEndTs: number;
  totalIdx: number;
  solar: SolarTimes;
  nextSolar: SolarTimes;
}

function midnightTs(date: Date): number {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

/**
 * Chaldean planetary hour at `now`.
 *
 * The astrological day starts at sunrise. Daytime is 12 unequal "day hours"
 * (one twelfth of sunrise→sunset), then 12 "night hours" until next sunrise.
 * The first day hour is ruled by the weekday ruler, subsequent hours rotate
 * through the chaldean order.
 */
export function getPlanetaryHour(now: Date, lat: number, lon: number): PlanetaryHourInfo {
  let dayBase = new Date(now);
  let solar = computeSolarTimes(dayBase, lat, lon);
  const sunriseTsToday = midnightTs(dayBase) + solar.sunriseMin * 60000;

  if (now.getTime() < sunriseTsToday) {
    dayBase = new Date(now);
    dayBase.setDate(dayBase.getDate() - 1);
    solar = computeSolarTimes(dayBase, lat, lon);
  }

  const tomorrow = new Date(dayBase);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const nextSolar = computeSolarTimes(tomorrow, lat, lon);

  const sunriseTs = midnightTs(dayBase) + solar.sunriseMin * 60000;
  const sunsetTs = midnightTs(dayBase) + solar.sunsetMin * 60000;
  const nextSunriseTs = midnightTs(tomorrow) + nextSolar.sunriseMin * 60000;

  let phaseStartTs: number;
  let phaseEndTs: number;
  let totalIdx: number;

  if (now.getTime() < sunsetTs) {
    const hourLen = (sunsetTs - sunriseTs) / 12;
    const hourIdx = Math.floor((now.getTime() - sunriseTs) / hourLen);
    phaseStartTs = sunriseTs + hourIdx * hourLen;
    phaseEndTs = phaseStartTs + hourLen;
    totalIdx = hourIdx;
  } else {
    const hourLen = (nextSunriseTs - sunsetTs) / 12;
    const hourIdx = Math.floor((now.getTime() - sunsetTs) / hourLen);
    phaseStartTs = sunsetTs + hourIdx * hourLen;
    phaseEndTs = phaseStartTs + hourLen;
    totalIdx = 12 + hourIdx;
  }

  const dayRuler = WEEKDAY_RULERS[dayBase.getDay()];
  const startIdx = CHALDEAN_ORDER.indexOf(dayRuler);
  const ruler = CHALDEAN_ORDER[(startIdx + totalIdx) % 7];

  return { ruler, dayRuler, phaseStartTs, phaseEndTs, totalIdx, solar, nextSolar };
}

/**
 * Light/dark follows OS preference via `prefers-color-scheme`. SSR / pre-JS
 * fallback is 'dark' (matches the @theme defaults in global.css).
 */
export function getColorMode(): ColorMode {
  if (typeof window === 'undefined') return 'dark';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export interface AstroThemeState {
  mode: ColorMode;
  hour: PlanetaryHourInfo;
  palette: Record<string, string>;
  lat: number;
  lon: number;
}

export function computeState(now: Date, lat: number, lon: number): AstroThemeState {
  const hour = getPlanetaryHour(now, lat, lon);
  const mode = getColorMode();
  const dayHue = PLANET_HUES[hour.dayRuler];
  const hourHue = PLANET_HUES[hour.ruler];
  const palette = computePalette(dayHue, hourHue, mode);
  return { mode, hour, palette, lat, lon };
}
