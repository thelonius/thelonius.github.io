---
slug: mlops-tutor
title: MLOps Tutor
tagline: Senior-MLOps interview-prep with multi-model fallback
period: 2026 · self-hosted
status: live
year: 2026
hero:
  type: iframe
  src: https://91-84-112-120.sslip.io/
  alt: MLOps Tutor — three modes interface with SSE-streamed responses
keyMetric: 4-model fallback chain · ~99% uptime
stack:
  - Flask
  - OpenAI SDK
  - Groq
  - Server-Sent Events
  - vanilla JS
  - marked.js
  - highlight.js
metrics:
  - label: Topics
    value: "12"
    hint: K8s, Triton, ClearML, monitoring, system design
  - label: Modes
    value: explain · quiz · mock interview
  - label: Fallback chain
    value: Llama 3.3 70B → GPT OSS 120B → Llama 4 Scout → Llama 3.1 8B
  - label: Backend storage
    value: "0"
    hint: all state lives client-side
links:
  - label: Live
    url: https://91-84-112-120.sslip.io/
    kind: demo
  - label: GitHub
    url: https://github.com/thelonius/mlops_tutor
    kind: repo
featured: true
deep: true
order: 2
description: Interactive Senior-MLOps interview-prep tool with three learning modes, SSE streaming, and a 4-model Groq fallback chain.
---

## Problem

Preparing for a Senior MLOps interview means covering 12 broad topics — Kubernetes operators, Triton Inference Server, ClearML pipelines, model monitoring, system design — and the existing prep materials are either too shallow (blog posts) or too expensive (paid courses).

I wanted a tool I could open from a phone on a commute, hit any topic, and switch between three learning modes — read, drill, simulate — without paying a subscription.

## Approach

Flask backend with **Server-Sent Events** for token-by-token streamed responses. Front is plain JavaScript (no React), `marked.js` for Markdown rendering, `highlight.js` for code blocks.

The model layer is a **multi-model fallback chain** through Groq's OpenAI-compatible endpoint: primary is Llama 3.3 70B, with automatic failover to GPT OSS 120B → Llama 4 Scout → Llama 3.1 8B when the primary rate-limits. The user sees uninterrupted streaming; the back logs which model answered.

Every code block in any answer gets an "explain this code" action — the tutor walks through it line by line in a child SSE stream. Per-topic progress lives in `localStorage`; `sessionStorage` keeps parallel tabs independent so two topics can run side-by-side.

## Architecture

```mermaid
graph TB
  client[Vanilla JS client + marked.js + highlight.js] -->|HTTP POST| flask[Flask app]
  flask -->|OpenAI SDK| groq[Groq endpoint]
  groq --> primary{Llama 3.3 70B}
  primary -->|rate-limit| f1[GPT OSS 120B]
  f1 -->|rate-limit| f2[Llama 4 Scout]
  f2 -->|rate-limit| f3[Llama 3.1 8B]
  flask -->|SSE stream| client
```

The fallback chain is configured declaratively in one Python list — adding a new model is one line. SSE handles back-pressure naturally: if the client disconnects, the upstream stream is cancelled.

