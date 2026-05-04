---
slug: orthoalign
title: OrthoAlign
tagline: AI 3D orthodontic treatment planner
period: Apr 2026 · ~10 hours
status: demo
year: 2026
hero:
  type: iframe
  src: https://thelonius.github.io/orthoalign/
  alt: OrthoAlign 3D editor with per-tooth segmentation
keyMetric: 30→1 min planning loop
stack:
  - FastAPI
  - Celery
  - Redis
  - MySQL
  - PyTorch
  - MeshSegNet
  - React 18
  - Three.js
metrics:
  - label: Planning loop
    value: 30-60 min → 1-2 min
    hint: ~30× speed-up on demo cases
  - label: Bundle
    value: 5 MB total
    hint: includes 2 demo cases with full segmented geometry
  - label: Build time
    value: ~10 hours
    hint: AI-augmented coding (Claude Code, end-to-end)
links:
  - label: Live demo
    url: https://thelonius.github.io/orthoalign/
    kind: demo
  - label: GitHub
    url: https://github.com/thelonius/orthoalign
    kind: repo
featured: true
deep: true
order: 1
description: AI assistant for orthodontic treatment planning. Per-tooth 3D segmentation via MeshSegNet, interactive WebGL aligner-stage editor.
---

## Problem

A planning technician spends 30-60 minutes per case on jaw segmentation and target-position setup — most of it is rote work: per-tooth labelling, copying geometry into an editor, repeating the same wrist motions across hundreds of cases.

The clinical decision is the technician's, but the surrounding mechanical work is the bottleneck. Goal: shrink that loop with ML and an interactive UI without taking the final placement out of the technician's hands.

## Approach

Pre-computed segmentation runs on **MeshSegNet** (PyTorch), served asynchronously via Celery so the UI never blocks on inference. The segmented jaw is loaded into the front as FBX/OBJ. Each tooth is a separate mesh tagged with FDI numbering.

The technician edits target positions on the maximum stage with a Three.js TransformControls gizmo — drag, rotate, fine-tune. Aligner stages between initial and target positions interpolate automatically. The technician sees the full motion sequence as a slider, not a one-shot result.

In demo mode (GitHub Pages), the front reads pre-segmented JSON cases directly. In dev mode, the full FastAPI + Celery + Redis + MySQL stack runs through Docker Compose, so a real scan upload triggers a real inference run.

## Architecture

```mermaid
graph LR
  scan[3D scan upload] --> celery[Celery task]
  celery --> meshseg[MeshSegNet PyTorch inference]
  meshseg --> store[(MySQL)]
  store --> spa[React + r3f WebGL editor]
  scan -.demo mode.-> json["/cases/{id}.json"] --> spa
```

The split between dev (full stack) and demo (static JSON) means the GitHub Pages deployment runs with zero backend — fast, free, and survives any traffic spike. The architecture is symmetrical: same React front talks to either a live API or pre-baked JSON.

