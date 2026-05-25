---
slug: astro-palette
title: Astro Palette
tagline: Автономный движок планетарно-часовой OKLCH-палитры · Эфемериды без зависимостей
period: 2026 · открытый код
status: open-source
year: 2026
hero:
  type: terminal
  alt: Вывод computeState от Astro Palette с управителем часа и OKLCH цветами
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

    → 0 зависимостей  ·  Чистый ESM  ·  < 10 КБ
keyMetric: 0 зависимостей · Чистый ESM
stack:
  - JavaScript (ESM)
  - OKLCH Color Space
  - Эфемериды Meeus
  - Астральные алгоритмы
metrics:
  - label: Зависимости
    value: "0"
    hint: автономный движок
  - label: Размер бандла
    value: "< 10 КБ"
    hint: минимальный вес
  - label: Точность
    value: "0.1°"
    hint: эклиптической долготы
links:
  - label: GitHub
    url: https://github.com/thelonius/astro-palette
    kind: repo
featured: true
deep: true
order: 4
description: Автономный движок для расчета цветовых палитр по планетарным часам на основе реальных астрономических данных (эфемериды, фазы Луны, VoC). Служит «источником правды» для темизации интерфейсов в нескольких проектах.
---

Автономный движок для планетарно-часовых OKLCH-палитр. Считает видимые долготы планет (эфемериды Meeus), халдейские планетарные часы, фазы Луны и статус void-of-course полностью локально, используя только Date и координаты.

Разработан как единый «источник правды» для визуального стиля нескольких приложений (включая этот сайт и расширение для браузера), что обеспечивает консистентную, астрономически обоснованную тему без внешних запросов.
