import {
  aspectField,
  starPolygon,
  flowerOfLife,
  tiling,
  harmonograph,
  voronoi,
  composition,
  toCanvas,
  toSVG,
} from '../../src';
import type { GradientStop, ImageSource, PatternInput, RegionTransform, Scene } from '../../src';
import type { TileShape } from '../../src/patterns/tiling';
import { PRESETS } from './presets';

/**
 * Named preset for the portfolio-site background — the parameter set
 * that looked good in the user's screenshot (wireframe-gem aesthetic).
 */
const PORTFOLIO_BG_PRESET = {
  maxOrb: 12,
  seed: 263,
  rotation: 0,
  af: { ringRadius: 0.23, chordWidth: 2.5, haloOpacity: 0.34, haloRadius: 0.075 },
} as const;

const ATMOSPHERES: Record<string, GradientStop[] | null> = {
  'peach-blue': [
    { offset: 0.0,  color: '#f3d2b4' },
    { offset: 0.35, color: '#d8c6c4' },
    { offset: 0.65, color: '#90a0bb' },
    { offset: 1.0,  color: '#5d738f' },
  ],
  dawn: [
    { offset: 0.0,  color: '#ffd9a0' },
    { offset: 0.5,  color: '#e8a4a0' },
    { offset: 1.0,  color: '#6e6a96' },
  ],
  dusk: [
    { offset: 0.0,  color: '#fdb27a' },
    { offset: 0.5,  color: '#8c5e8a' },
    { offset: 1.0,  color: '#2c3565' },
  ],
  night: [
    { offset: 0.0,  color: '#1e2a4a' },
    { offset: 0.5,  color: '#0f1733' },
    { offset: 1.0,  color: '#070b1f' },
  ],
  forest: [
    { offset: 0.0,  color: '#cfd9b8' },
    { offset: 0.5,  color: '#7a9876' },
    { offset: 1.0,  color: '#2c4a3e' },
  ],
  none: null,
};

type Renderer = 'canvas' | 'svg';
type PatternKind =
  | 'aspect-field'
  | 'star-polygon'
  | 'flower-of-life'
  | 'tiling'
  | 'harmonograph'
  | 'voronoi'
  | 'composition';

interface State {
  renderer: Renderer;
  pattern: PatternKind;
  preset: string;
  maxOrb: number;
  rotation: number;
  seed: number;
  // pattern-specific
  af: {
    ringRadius: number; chordWidth: number; haloOpacity: number; haloRadius: number;
    nodeMarkers: boolean; nodeRadius: number;
    pulsation: number; pulsationFreq: number; nodeBreathing: number;
    dailyRotation: boolean;
  };
  sp: { n: number; ringRadius: number; chordWidth: number; minStrength: number; showRing: boolean };
  fl: { ringRadius: number; circleRadius: number; outlineOpacity: number; lensOpacity: number };
  tl: { tileSize: number; shape: TileShape | 'auto'; colorMix: number; vignette: number };
  hg: { radius: number; duration: number; damping: number; strokeWidth: number; phase: number };
  vr: { ringRadius: number; padding: number; colorMix: number; vignette: number };
  co: {
    outerScale: number;
    innerScale: number;
    lineWidth: number;
    atmosphere: keyof typeof ATMOSPHERES;
    showHorizon: boolean;
    showVertical: boolean;
    alternateTints: boolean;
    tintStrength: number;
    fillInner: boolean;
    image: ImageSource | null;
    rotations: number[];
    transforms: RegionTransform[] | null;
  };
}

const state: State = {
  renderer: 'canvas',
  pattern: 'aspect-field',
  preset: 'random',
  maxOrb: 8,
  rotation: 0,
  seed: 42,
  af: {
    ringRadius: 0.32, chordWidth: 1.6, haloOpacity: 0.18, haloRadius: 0.05,
    nodeMarkers: false, nodeRadius: 2.5,
    pulsation: 0, pulsationFreq: 0.15, nodeBreathing: 0,
    dailyRotation: false,
  },
  sp: { n: 12, ringRadius: 0.36, chordWidth: 1.4, minStrength: 0.1, showRing: false },
  fl: { ringRadius: 0.18, circleRadius: 1.0, outlineOpacity: 0.45, lensOpacity: 0.55 },
  tl: { tileSize: 20, shape: 'auto', colorMix: 0.7, vignette: 0.4 },
  hg: { radius: 0.42, duration: 28, damping: 0.05, strokeWidth: 0.8, phase: 0 },
  vr: { ringRadius: 0.32, padding: 0, colorMix: 0.7, vignette: 0.35 },
  co: {
    outerScale: 0.85,
    innerScale: 0.34,
    lineWidth: 0.9,
    atmosphere: 'peach-blue',
    showHorizon: true,
    showVertical: false,
    alternateTints: false,
    tintStrength: 0.12,
    fillInner: true,
    image: null,
    rotations: [0, 60, 120, 180, 240, 300, 0, 90, 180, 270],
    transforms: null,
  },
};

const stage = document.getElementById('stage') as HTMLDivElement;
const canvas = document.getElementById('canvas') as HTMLCanvasElement;
const statusEl = document.getElementById('status') as HTMLDivElement;
let svgEl: SVGSVGElement | null = null;

function buildInput(): PatternInput {
  const preset = PRESETS[state.preset];
  return preset({ seed: state.seed, maxOrb: state.maxOrb });
}

function resizeCanvasToStage(): { w: number; h: number } {
  const rect = stage.getBoundingClientRect();
  const dpr = Math.max(1, window.devicePixelRatio || 1);
  const w = Math.round(rect.width);
  const h = Math.round(rect.height);
  canvas.width = w * dpr;
  canvas.height = h * dpr;
  canvas.style.width = `${w}px`;
  canvas.style.height = `${h}px`;
  const ctx = canvas.getContext('2d')!;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  return { w, h };
}

function generateScene(input: PatternInput, w: number, h: number): Scene {
  const common = {
    width: w, height: h,
    rotation: state.rotation,
    seed: state.seed,
    standalone: true,
  };
  switch (state.pattern) {
    case 'aspect-field': {
      const t = timeNowSec();
      const rotation = state.af.dailyRotation
        ? state.rotation + dailyRotationDeg()
        : state.rotation;
      return aspectField(input, {
        ...common,
        rotation,
        ringRadius: state.af.ringRadius,
        maxOrb: state.maxOrb,
        chordWidth: state.af.chordWidth,
        haloOpacity: state.af.haloOpacity,
        haloRadius: state.af.haloRadius,
        nodeMarkers: state.af.nodeMarkers,
        nodeRadius: state.af.nodeRadius,
        time: t,
        pulsation: state.af.pulsation,
        pulsationFreq: state.af.pulsationFreq,
        nodeBreathing: state.af.nodeBreathing,
      });
    }
    case 'star-polygon':
      return starPolygon(input, {
        ...common,
        n: state.sp.n,
        ringRadius: state.sp.ringRadius,
        maxOrb: state.maxOrb,
        chordWidth: state.sp.chordWidth,
        minStrength: state.sp.minStrength,
        showRing: state.sp.showRing,
      });
    case 'flower-of-life':
      return flowerOfLife(input, {
        ...common,
        ringRadius: state.fl.ringRadius,
        circleRadius: state.fl.circleRadius,
        maxOrb: state.maxOrb,
        outlineOpacity: state.fl.outlineOpacity,
        lensOpacity: state.fl.lensOpacity,
      });
    case 'tiling':
      return tiling(input, {
        ...common,
        tileSize: state.tl.tileSize,
        shape: state.tl.shape === 'auto' ? undefined : state.tl.shape,
        maxOrb: state.maxOrb,
        colorMix: state.tl.colorMix,
        vignette: state.tl.vignette,
      });
    case 'harmonograph':
      return harmonograph(input, {
        ...common,
        radius: state.hg.radius,
        duration: state.hg.duration,
        damping: state.hg.damping,
        maxOrb: state.maxOrb,
        strokeWidth: state.hg.strokeWidth,
        phase: state.hg.phase,
      });
    case 'voronoi':
      return voronoi(input, {
        ...common,
        ringRadius: state.vr.ringRadius,
        padding: state.vr.padding,
        maxOrb: state.maxOrb,
        colorMix: state.vr.colorMix,
        vignette: state.vr.vignette,
      });
    case 'composition':
      return composition(input, {
        width: w, height: h,
        rotation: state.rotation,
        seed: state.seed,
        outerScale: state.co.outerScale,
        innerScale: state.co.innerScale,
        lineWidth: state.co.lineWidth,
        atmosphere: ATMOSPHERES[state.co.atmosphere],
        showHorizon: state.co.showHorizon,
        showVertical: state.co.showVertical,
        alternateTints: state.co.alternateTints,
        tintStrength: state.co.tintStrength,
        image: state.co.image,
        fillInnerRegions: state.co.fillInner,
        rotationsPerRegion: state.co.rotations,
        transformsPerRegion: state.co.transforms ?? undefined,
      });
  }
}

function render(): void {
  const input = buildInput();
  const { w, h } = resizeCanvasToStage();
  const scene = generateScene(input, w, h);

  if (state.renderer === 'canvas') {
    if (svgEl) { svgEl.remove(); svgEl = null; }
    canvas.style.display = 'block';
    const ctx = canvas.getContext('2d')!;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    toCanvas(scene, ctx);
  } else {
    canvas.style.display = 'none';
    const svgString = toSVG(scene);
    if (svgEl) svgEl.remove();
    const wrapper = document.createElement('div');
    wrapper.innerHTML = svgString;
    svgEl = wrapper.firstElementChild as SVGSVGElement;
    svgEl.setAttribute('preserveAspectRatio', 'xMidYMid meet');
    stage.insertBefore(svgEl, statusEl);
  }

  const meta = scene.meta ?? {};
  const metaText = Object.entries(meta)
    .filter(([k]) => k !== 'pattern')
    .map(([k, v]) => {
      if (typeof v === 'object') return null;
      const sv = typeof v === 'number' ? Number(v.toFixed(2)) : String(v);
      return `${k}=${sv}`;
    })
    .filter(Boolean)
    .slice(0, 4)
    .join(' · ');
  statusEl.textContent = `${state.pattern} · ${state.preset} · ${input.planets.length}p · ${state.renderer}${metaText ? ' · ' + metaText : ''}`;
}

const BOOL_RANGES = new Set([
  'sp-showRing',
  'co-showHorizon', 'co-showVertical', 'co-alternateTints', 'co-fillInner',
  'af-nodeMarkers', 'af-dailyRotation',
]);

const animStart = performance.now();
let rafHandle: number | null = null;

function isAnimated(): boolean {
  if (state.pattern !== 'aspect-field') return false;
  return state.af.pulsation > 0 || state.af.nodeBreathing > 0 || state.af.dailyRotation;
}

function timeNowSec(): number {
  return (performance.now() - animStart) / 1000;
}

function dailyRotationDeg(): number {
  // 360° rotation across the day, anchored to local midnight.
  const now = new Date();
  const midnight = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const secOfDay = (now.getTime() - midnight.getTime()) / 1000;
  return (secOfDay / 86400) * 360;
}

function tick(): void {
  rafHandle = null;
  render();
  if (isAnimated()) {
    rafHandle = requestAnimationFrame(tick);
  }
}

function ensureRafState(): void {
  if (isAnimated()) {
    if (rafHandle === null) rafHandle = requestAnimationFrame(tick);
  } else if (rafHandle !== null) {
    cancelAnimationFrame(rafHandle);
    rafHandle = null;
  }
}

function wireRange(id: string, set: (v: number) => void): void {
  const el = document.getElementById(id) as HTMLInputElement | null;
  const valEl = document.getElementById(`${id}-v`) as HTMLSpanElement | null;
  if (!el || !valEl) return;
  el.addEventListener('input', () => {
    const v = Number(el.value);
    set(v);
    valEl.textContent = BOOL_RANGES.has(el.id) ? (v ? 'on' : 'off') : String(v);
    render();
  });
}

function wireToggle(group: string, onPick: (btn: HTMLButtonElement) => void): void {
  const buttons = document.querySelectorAll<HTMLButtonElement>(`[data-toggle="${group}"] button`);
  buttons.forEach(btn => {
    btn.addEventListener('click', () => {
      buttons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      onPick(btn);
    });
  });
}

function showPatternOpts(): void {
  document.querySelectorAll<HTMLDivElement>('.pattern-opts').forEach(el => {
    el.classList.toggle('active', el.dataset.opts === state.pattern);
  });
}

function init(): void {
  // Common
  wireRange('maxOrb', v => state.maxOrb = v);
  wireRange('rotation', v => state.rotation = v);
  wireRange('seed', v => state.seed = v);

  // aspect-field
  wireRange('af-ringRadius', v => state.af.ringRadius = v);
  wireRange('af-chordWidth', v => state.af.chordWidth = v);
  wireRange('af-haloOpacity', v => state.af.haloOpacity = v);
  wireRange('af-haloRadius', v => state.af.haloRadius = v);
  wireRange('af-nodeMarkers', v => { state.af.nodeMarkers = v > 0; });
  wireRange('af-nodeRadius', v => state.af.nodeRadius = v);
  wireRange('af-pulsation', v => { state.af.pulsation = v; ensureRafState(); });
  wireRange('af-pulsationFreq', v => state.af.pulsationFreq = v);
  wireRange('af-nodeBreathing', v => { state.af.nodeBreathing = v; ensureRafState(); });
  wireRange('af-dailyRotation', v => { state.af.dailyRotation = v > 0; ensureRafState(); });

  // star-polygon
  wireRange('sp-n', v => state.sp.n = v);
  wireRange('sp-ringRadius', v => state.sp.ringRadius = v);
  wireRange('sp-chordWidth', v => state.sp.chordWidth = v);
  wireRange('sp-minStrength', v => state.sp.minStrength = v);
  wireRange('sp-showRing', v => state.sp.showRing = v > 0);

  // flower-of-life
  wireRange('fl-ringRadius', v => state.fl.ringRadius = v);
  wireRange('fl-circleRadius', v => state.fl.circleRadius = v);
  wireRange('fl-outlineOpacity', v => state.fl.outlineOpacity = v);
  wireRange('fl-lensOpacity', v => state.fl.lensOpacity = v);

  // tiling
  wireRange('tl-tileSize', v => state.tl.tileSize = v);
  wireRange('tl-colorMix', v => state.tl.colorMix = v);
  wireRange('tl-vignette', v => state.tl.vignette = v);

  // harmonograph
  wireRange('hg-radius', v => state.hg.radius = v);
  wireRange('hg-duration', v => state.hg.duration = v);
  wireRange('hg-damping', v => state.hg.damping = v);
  wireRange('hg-strokeWidth', v => state.hg.strokeWidth = v);
  wireRange('hg-phase', v => state.hg.phase = v);

  // voronoi
  wireRange('vr-ringRadius', v => state.vr.ringRadius = v);
  wireRange('vr-padding', v => state.vr.padding = v);
  wireRange('vr-colorMix', v => state.vr.colorMix = v);
  wireRange('vr-vignette', v => state.vr.vignette = v);

  // composition
  wireRange('co-outerScale', v => state.co.outerScale = v);
  wireRange('co-innerScale', v => state.co.innerScale = v);
  wireRange('co-lineWidth', v => state.co.lineWidth = v);
  wireRange('co-showHorizon', v => state.co.showHorizon = v > 0);
  wireRange('co-showVertical', v => state.co.showVertical = v > 0);
  wireRange('co-alternateTints', v => state.co.alternateTints = v > 0);
  wireRange('co-tintStrength', v => state.co.tintStrength = v);
  wireToggle('co-atmosphere', btn => {
    state.co.atmosphere = (btn.dataset.atmo as keyof typeof ATMOSPHERES) ?? 'peach-blue';
    const v = document.getElementById('co-atmosphere-v');
    if (v) v.textContent = state.co.atmosphere;
  });
  wireRange('co-fillInner', v => state.co.fillInner = v > 0);

  // Image upload for kaleidoscope mode
  const fileInput = document.getElementById('co-image-file') as HTMLInputElement | null;
  if (fileInput) {
    fileInput.addEventListener('change', () => {
      const file = fileInput.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = String(reader.result);
        const img = new Image();
        img.onload = () => {
          state.co.image = {
            href: dataUrl,
            width: img.naturalWidth,
            height: img.naturalHeight,
            element: img,
          };
          render();
        };
        img.src = dataUrl;
      };
      reader.readAsDataURL(file);
    });
  }
  document.getElementById('co-clear-image')?.addEventListener('click', () => {
    state.co.image = null;
    if (fileInput) fileInput.value = '';
    render();
  });
  document.getElementById('co-shuffle-rotations')?.addEventListener('click', () => {
    state.co.rotations = Array.from({ length: 10 }, () => Math.round(Math.random() * 360 / 30) * 30);
    state.co.transforms = null;  // drop full-transform override when going back to rotation-only
    render();
  });
  // Apply portfolio-bg preset (resets sliders + state to the named params).
  document.getElementById('apply-portfolio-bg')?.addEventListener('click', () => {
    state.maxOrb = PORTFOLIO_BG_PRESET.maxOrb;
    state.seed = PORTFOLIO_BG_PRESET.seed;
    state.rotation = PORTFOLIO_BG_PRESET.rotation;
    state.af.ringRadius = PORTFOLIO_BG_PRESET.af.ringRadius;
    state.af.chordWidth = PORTFOLIO_BG_PRESET.af.chordWidth;
    state.af.haloOpacity = PORTFOLIO_BG_PRESET.af.haloOpacity;
    state.af.haloRadius = PORTFOLIO_BG_PRESET.af.haloRadius;
    state.pattern = 'aspect-field';

    // Sync the DOM sliders/buttons.
    function setRange(id: string, v: number): void {
      const el = document.getElementById(id) as HTMLInputElement | null;
      const valEl = document.getElementById(`${id}-v`) as HTMLSpanElement | null;
      if (el) el.value = String(v);
      if (valEl) valEl.textContent = String(v);
    }
    setRange('maxOrb', PORTFOLIO_BG_PRESET.maxOrb);
    setRange('seed', PORTFOLIO_BG_PRESET.seed);
    setRange('rotation', PORTFOLIO_BG_PRESET.rotation);
    setRange('af-ringRadius', PORTFOLIO_BG_PRESET.af.ringRadius);
    setRange('af-chordWidth', PORTFOLIO_BG_PRESET.af.chordWidth);
    setRange('af-haloOpacity', PORTFOLIO_BG_PRESET.af.haloOpacity);
    setRange('af-haloRadius', PORTFOLIO_BG_PRESET.af.haloRadius);
    document.querySelectorAll<HTMLButtonElement>('[data-toggle="pattern"] button').forEach(b => {
      b.classList.toggle('active', b.dataset.pattern === 'aspect-field');
    });
    showPatternOpts();
    render();
  });

  document.getElementById('co-shuffle-geometric')?.addEventListener('click', () => {
    // Full geometric shuffle: rotation (60° steps), horizontal flip,
    // vertical flip — combined per region.
    state.co.transforms = Array.from({ length: 10 }, () => ({
      rotate: Math.round(Math.random() * 6) * 60,
      scaleX: Math.random() < 0.5 ? -1 : 1,
      scaleY: Math.random() < 0.5 ? -1 : 1,
    }));
    render();
  });

  // Renderer toggle
  wireToggle('renderer', btn => {
    state.renderer = (btn.dataset.renderer as Renderer) ?? 'canvas';
  });

  // Pattern toggle
  wireToggle('pattern', btn => {
    state.pattern = (btn.dataset.pattern as PatternKind) ?? 'aspect-field';
    showPatternOpts();
    ensureRafState();
  });

  // Preset toggle
  wireToggle('preset', btn => {
    state.preset = btn.dataset.preset ?? 'random';
  });

  // Tiling shape toggle
  wireToggle('tl-shape', btn => {
    state.tl.shape = (btn.dataset.shape as TileShape | 'auto') ?? 'auto';
  });

  // Export
  document.getElementById('copy-svg')!.addEventListener('click', () => {
    const input = buildInput();
    const rect = stage.getBoundingClientRect();
    const scene = generateScene(input, rect.width, rect.height);
    navigator.clipboard.writeText(toSVG(scene));
    statusEl.textContent = 'SVG copied to clipboard';
  });

  document.getElementById('download-png')!.addEventListener('click', () => {
    const link = document.createElement('a');
    link.download = `${state.pattern}-${state.preset}-${state.seed}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  });

  window.addEventListener('resize', render);
  showPatternOpts();
  render();
}

init();
