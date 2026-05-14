---
slug: euc-anthology
title: EUC-Anthology
tagline: Reverse-engineered EUC firmware as an interactive book · 14 chapters
period: 2025-2026 · live
status: live
year: 2026
hero:
  type: iframe
  src: https://thelonius.github.io/euc-anthology/?lang=en
  alt: EUC-Anthology — interactive book on reverse-engineered EUC firmware
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
  - label: Live (EN)
    url: https://thelonius.github.io/euc-anthology/?lang=en
    kind: demo
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

## Highlights

Three chapters that show different layers of the stack — control, math, and physics.

### Balance · the PD loop that keeps the wheel up

After IMU fusion, every 50 µs the firmware reads the lean angle θ and angular velocity ω and computes a target current for the torque-producing winding: `Iq_target = -(Kp·θ + Kd·ω)`. No integral term — the gravity load is symmetric around vertical, so steady-state error stays zero. The simulator lets you drag Kp and Kd; below 80 Kp the wheel falls, above 400 it oscillates with pedal buzz.

```mermaid
graph TB
  imu[IMU θ, ω<br/>complementary filter]
  pd["PD controller<br/>Iq = -(Kp·θ + Kd·ω)"]
  foc[FOC stage]
  motor[Three-phase motor]

  imu -->|sensor fusion| pd
  pd -->|target current| foc
  foc -->|PWM duty cycles| motor
  motor -.->|physical response| imu
```

[Play chapter VII →](https://thelonius.github.io/euc-anthology/?lang=en#balance)

### The Flux · SVPWM and 15 % of headroom for free

After the inverse transforms (d/q → α/β → A/B/C) the FOC stage has three reference voltages it wants on the windings. Drive them as plain sinusoids and the usable bus voltage caps out at V_bus/2 per phase — modulation index m = 1.00. SVPWM subtracts the common-mode component `(max + min) / 2` from every phase before PWM. Because the same offset comes off all three, the **line-to-line voltage** — the only thing the motor actually feels — is unchanged. But the three signals now fit into the ±V_bus/2 band with slack, raising the usable m to 2/√3 ≈ 1.155. That's ~15 % extra torque from the same battery, no hardware change. The firmware does the saturation clipping in `Control_SVPWM_Modulation_Limit` at `0x00014C00` with an inverse-square-root lookup.

```mermaid
graph TB
  abc[V_a, V_b, V_c<br/>three sinusoids 120° apart]
  off["common-mode<br/>(max + min) / 2"]
  sub[Subtract offset<br/>from each phase]
  pwm[TIM1 ch1 / ch2 / ch3<br/>PWM duty cycles]
  motor[3-phase bridge → motor]
  note[line-to-line voltage<br/>unchanged]

  abc --> off
  abc --> sub
  off --> sub
  sub -->|m_max 1.00 → 1.155| pwm
  pwm --> motor
  sub -.- note
```

[Play chapter VIII →](https://thelonius.github.io/euc-anthology/?lang=en#foc)

### Heat · the thermal model that bites back

I²R losses dump roughly 1,350 W of waste heat into the windings at 100 A phase current. With no active cooling, only thermal mass and conductivity stop the motor from melting. The firmware models two nodes — winding (~800 J/K, fast) and stator iron (~5,000 J/K, slow) — with thermal resistance R_wi ≈ 0.15 K/W between them and R_ia ≈ 1.2 K/W to ambient. At 60 °C the tiltback ramp starts; at 75 °C the wheel cuts torque. The simulator lets you crank the current and watch the curve.

```mermaid
graph TB
  current[Phase current<br/>I²R loss ≈ 1350 W]
  winding[Winding node<br/>C ≈ 800 J/K]
  iron[Stator iron<br/>C ≈ 5000 J/K]
  ambient[Ambient air]
  guard{T_winding}
  tiltback[Tiltback ramp]
  critical[Critical cut]

  current -->|heat injection| winding
  winding -->|R_wi 0.15 K/W| iron
  iron -->|R_ia 1.2 K/W| ambient
  winding --> guard
  guard -->|≥ 60 °C| tiltback
  guard -->|≥ 75 °C| critical
```

[Play chapter XII →](https://thelonius.github.io/euc-anthology/?lang=en#thermal)

