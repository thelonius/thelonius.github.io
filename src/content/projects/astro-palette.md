---
slug: astro-palette
title: Astro Palette
tagline: Autonomous planetary-hour OKLCH palette engine · Zero-dependency ephemerides
period: 2026 · open-source
status: open-source
year: 2026
hero:
  type: terminal
  alt: Astro Palette computeState output with planetary ruler and OKLCH colors
  content: |
    $ import { computeState, coordsForTimezone } from 'astro-palette';
    const [lat, lon] = coordsForTimezone();
    const st = computeState(new Date(), lat, lon, { mode: 'dark' });

    {
      palette: {
        '--color-bg': 'oklch(0.12 0.02 260)',
        '--color-accent': 'oklch(0.70 0.15 340)',
        ...
      },
      hour: { ruler: 'Mars', dayRuler: 'Tuesday' },
      moon: { illumination: 0.82, phase: 'Waxing Gibbous' },
      voc: null,
      jd: 2460834.12
    }

    → 0 dependencies  ·  Pure ESM  ·  < 10KB
keyMetric: 0 dependencies · Pure ESM
stack:
  - JavaScript (ESM)
  - OKLCH Color Space
  - Meeus Ephemerides
  - Astral Algorithms
metrics:
  - label: Dependencies
    value: "0"
    hint: standalone engine
  - label: Bundle size
    value: "< 10 KB"
    hint: minimal footprint
  - label: Precision
    value: "0.1°"
    hint: ecliptic longitude accuracy
links:
  - label: GitHub
    url: https://github.com/thelonius/astro-palette
    kind: repo
featured: true
deep: true
order: 4
description: A standalone engine that computes planetary-hour color palettes based on real-time astronomical data (ephemerides, planetary hours, moon phases). Used as the "source of truth" for themed UI across multiple projects.
---

A standalone engine for planetary-hour OKLCH palettes. It calculates visible planetary longitudes (Meeus ephemerides), Chaldean planetary hours, moon phases, and Void-of-Course status entirely locally from a Date and coordinates.

Designed as a shared "source of truth" for visual identity across different applications, including the portfolio site and browser extensions, ensuring a consistent, astronomically-driven theme without any network requests.
