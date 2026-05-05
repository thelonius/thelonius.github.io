---
slug: proptech
title: PropTech Semantic Search
tagline: Lifestyle search over real estate · multi-provider RAG
period: 2026 · open-source
status: open-source
year: 2026
hero:
  type: terminal
  alt: PropTech curl response with X-Cost-USD and shadow-cost headers
  content: |
    $ curl -X POST http://localhost:8002/search \
        -H "Content-Type: application/json" \
        -d '{"query":"family with kids and a dog, quiet area"}'

    HTTP/1.1 200 OK
    X-Cost-USD:                0.000040
    X-Cost-Shadow-OpenAI-USD:  0.000127
    X-Cost-Shadow-NIM-USD:     0.000040
    X-Duration-Ms:             1640
    X-Provider:                nim

    [
      {
        "id": "listing_4711",
        "score": 0.93,
        "match_explanation": "Quiet residential street, fenced garden,
                              proximity to a primary school"
      },
      ...
    ]

    → precision@1 = 1.0  ·  MRR = 0.44  ·  3.2× cheaper than OpenAI
keyMetric: precision@1=1.0 · 3.2× cheaper than OpenAI
stack:
  - FastAPI
  - Qdrant
  - OpenAI
  - Anthropic Claude
  - NVIDIA NIM
  - Ollama
  - Prometheus
  - Pydantic
metrics:
  - label: precision@1
    value: "1.0"
    hint: on the flagship lifestyle query
  - label: MRR
    value: "0.44"
    hint: across 3 labelled queries
  - label: Mean latency
    value: 1.9 s
    hint: via NIM, 22× faster than local Qwen3.5:9B on M1
  - label: Cost vs OpenAI
    value: 3.2× cheaper
    hint: identical workload
links:
  - label: GitHub
    url: https://github.com/thelonius/proptech-semantic-search
    kind: repo
featured: true
deep: true
order: 3
description: Lifestyle real-estate search demo. Three LLM providers behind one client, cost middleware with shadow counterfactuals, evaluation harness as CI gate.
---

Lifestyle-based real-estate search built for production. Three LLM providers (Ollama / NIM / OpenAI) behind one OpenAI-compatible client. Cost middleware tracks the active provider plus shadow counterfactuals. Eval harness runs as a CI gate on five labelled queries.

→ See the [interactive demo and architecture deep-dive](/projects/proptech).

