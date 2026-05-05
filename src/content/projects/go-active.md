---
slug: go-active
title: Go-Active
tagline: Telegram Mini App — GPS tracks → cinematic 3D videos with CV quality scoring
period: Apr 2025 — present · production
status: production
year: 2025
hero:
  type: github-og
  src: thelonius/go-active
  alt: Go-Active production render preview from @Vixwibot
  note: Real render from production · 25-second clip from @Vixwibot
keyMetric: 5-stage CV pipeline · 15+ quality metrics
stack:
  - Python
  - PyTorch
  - OpenCV
  - FastAPI
  - CesiumJS
  - FFmpeg
  - Telegram Bot API
  - Docker
metrics:
  - label: Pipeline stages
    value: "5"
    hint: parse → terrain → smoothing → CV scoring → render
  - label: CV quality models
    value: 15+
    hint: classification, regression, pattern detection
  - label: Status
    value: production
    hint: Telegram Mini App with real users
links:
  - label: Open @Vixwibot in Telegram
    url: https://t.me/Vixwibot
    kind: demo
  - label: vixwi.com — Mini App
    url: https://vixwi.com/
    kind: demo
featured: true
deep: true
order: 4
description: Production Telegram Mini App that turns GPS tracks into 3D videos with automatic CV-based quality scoring on a 5-stage async FastAPI pipeline.
---

## Problem

GPS tracks recorded by mainstream apps (Strava, Komoot) are useful for the user who recorded them but boring to share — flat maps with a coloured line. To turn a workout into something worth watching, the track needs to become a cinematic flythrough with terrain context, and the system has to reject bad tracks (sparse points, GPS jitter, broken altitude) before spending render budget on them.

The goal: take a GPX file, score it for renderability, and produce a shareable 3D video — all triggered from a Telegram message.

## Approach

A **5-stage async FastAPI pipeline** with explicit memory monitoring at each stage so a 200 KB GPX never balloons into a 4 GB Cesium scene mid-render.

1. **Parse GPX** — extract points, validate timestamps and altitudes
2. **Terrain query** — fetch tile data from Cesium Ion for the bounding box
3. **Smoothing & interpolation** — median filter on jitter, spline-fit the path
4. **CV quality scoring** — PyTorch ensemble of 15+ models: MiDaS depth estimation on terrain rendering, Structure-from-Motion to validate trajectory plausibility, classification heads for "is this a real run?", regression heads for confidence
5. **Render** — Cesium scene + FFmpeg encode to MP4, push back to Telegram with a quality grade

The Telegram Mini App is the user interface: upload GPX, see your video, share. No app store, no install, no auth flow.

## Architecture

```mermaid
graph LR
  user[Telegram user] -->|GPX upload| bot[Telegram Bot API]
  bot --> api[FastAPI]
  api --> s1[1. Parse]
  s1 --> s2[2. Terrain]
  s2 --> s3[3. Smooth]
  s3 --> s4[4. CV scoring PyTorch ensemble]
  s4 --> s5[5. Cesium + FFmpeg]
  s5 -->|MP4 + grade| bot
  bot --> user
```

Each stage is a separate async task with its own timeout and memory budget. If stage 4 rejects the track (low quality grade), we skip rendering and respond with the diagnostic — saving compute and giving the user actionable feedback.

