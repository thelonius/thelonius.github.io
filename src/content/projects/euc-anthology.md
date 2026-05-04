---
slug: euc-anthology
title: EUC-Anthology
tagline: Reverse-engineered EUC firmware as an interactive book · 14 chapters
period: 2025-2026 · live
status: live
year: 2026
hero:
  type: github-og
  src: thelonius/euc-anthology
  alt: EUC-Anthology GitHub repository preview
  note: English translation in progress · live iframe will swap in when EN ships
keyMetric: 14 chapters · 440 KB gzip · 0 backend
stack:
  - Ghidra
  - STM32 firmware analysis
  - Preact
  - Vite
  - ECharts
  - Canvas 2D
  - GitHub Actions
metrics:
  - label: Chapters
    value: "14"
    hint: hardware → sensors → boot → state machine → FOC → field weakening → thermal → BLE
  - label: Bundle size
    value: 440 KB gzip
    hint: ~1.35 MB total before compression
  - label: Backend
    value: "0"
    hint: pure static site, GitHub Actions deploy
  - label: Reverse target
    value: Begode ET Max (STM32F405)
    hint: firmware decompiled in Ghidra
links:
  - label: Live (RU)
    url: https://thelonius.github.io/euc-anthology/
    kind: demo
  - label: GitHub
    url: https://github.com/thelonius/euc-anthology
    kind: repo
featured: true
deep: true
order: 5
description: Interactive book on reverse-engineered EUC firmware. 14 chapters pair prose, decompiled code, and playable simulators (FOC, IMU fusion, thermal).
---

## Problem

A self-balancing electric unicycle rides because dozens of algorithms run inside it: a PD balance loop reading an IMU, FOC controlling a brushless motor, field weakening past base speed, a thermal model protecting the windings. None of this is documented for the public — the only available "documentation" is the decompiled firmware. Riders treat the wheel as a black box and the math as inaccessible.

I wanted to show those algorithms alive, not as textbook formulas. Each one running in a simulator that you can poke from a browser, paired with the actual decompiled code that runs on the wheel.

## Approach

Reverse-engineered the **Begode ET Max** firmware (STM32F405, 168 V FOC) from scratch in **Ghidra**. Each algorithmic concept gets a chapter, and each chapter pairs four things:

1. A prose explanation in plain language
2. Decompiled code with **real firmware addresses** so you can verify it against the binary
3. An **interactive simulator** on Canvas 2D or ECharts — drag a slider, watch the algorithm behave
4. A glossary of the technical terms used, with hover tooltips

14 chapters cover the stack from hardware (STM32 timers, ADC, motor windings) up through sensors (MPU6500 IMU, complementary filter), the boot sequence and state machine, the 50-µs FOC interrupt, the balance PD loop, the FOC math (Clarke/Park transforms, flux observer), field weakening, the thermal model, and the BLE telemetry protocol.

## Architecture

```mermaid
graph LR
  chapter[Chapter shell] --> prose[Prose section]
  chapter --> decomp[Decompiled code + firmware address]
  chapter --> sim[Interactive simulator Canvas / ECharts]
  chapter --> gloss[Glossary tooltips]

  sim --> shared[Shared simulator components: FOC, balance PD, thermal]
  gloss --> terms[(~100 EUC terms)]

  build[Vite build] --> bundle[Preact bundle 440 KB gzip] --> deploy[GitHub Actions → Pages]
```

Preact instead of React keeps the bundle small (~1.35 MB total, 440 KB gzipped). Simulator components are reusable — the FOC simulator from chapter 8 also drives the field-weakening visualisation in chapter 10. No backend, deployed automatically through GitHub Actions on push to `main`.

