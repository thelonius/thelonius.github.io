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

## Problem

Real-estate search is built on rigid filters: room count, price range, district. A query like "family with kids and a dog, quiet neighbourhood" has nowhere to land. The user has to translate intent into filters and the system loses everything that doesn't fit a numeric box.

I wanted a demo where lifestyle queries actually work over a real dataset — and where the cost story is honest, not "just pipe it through OpenAI". Three providers compared side by side on the same workload.

## Approach

FastAPI + Qdrant + a **multi-provider LLM abstraction** with one client interface. Switching from OpenAI to Anthropic to NVIDIA NIM to local Ollama is a single env-flag change. The same query path runs against any of them.

The query goes through three steps: an intent parser (LLM) extracts lifestyle constraints from the natural-language query; Qdrant runs the vector search with hybrid filters; a re-ranker (LLM) produces the final ordering with per-listing explanations.

A **cost middleware** runs in parallel: every response carries `X-Cost-USD` for the real call, plus shadow-cost headers (`X-Cost-Shadow-OpenAI-USD`, `X-Cost-Shadow-NIM-USD`) for the providers that would have been used. The founder sees the actual bill and the counterfactual — useful when defending a provider choice in a review.

An **evaluation harness** runs as a CI gate. Precision@K, recall@K, MRR, mean latency, mean cost — all reported per gold query in a diff-friendly Markdown report. A pull request that worsens precision shows the regression next to the code.

## Architecture

```mermaid
graph LR
  query[Natural query] --> intent[Intent parser LLM]
  intent --> qdrant[(Qdrant)]
  qdrant --> rerank[Re-ranker LLM + explanations]
  rerank --> resp[Response]

  query -.parallel.-> cost[Cost middleware]
  cost --> real[X-Cost-USD]
  cost --> shadow1[X-Cost-Shadow-OpenAI]
  cost --> shadow2[X-Cost-Shadow-NIM]

  eval[Eval harness CI gate] -.checks.-> resp
```

The provider client is one Python protocol; switching providers is a one-line config change. Vector dimensions are pinned per Qdrant collection, so the embedding-provider routing is sticky to collection — switching the chat provider doesn't accidentally break vector compatibility.

