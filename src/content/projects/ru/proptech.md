---
slug: proptech
title: PropTech Semantic Search
tagline: Поиск недвижимости по образу жизни · мультипровайдерный RAG
period: 2026 · открытый код
status: open-source
year: 2026
hero:
  type: terminal
  alt: Ответ curl от PropTech с заголовками X-Cost-USD и shadow-cost
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

    → precision@1 = 1.0  ·  MRR = 0.44  ·  в 3.2× дешевле OpenAI
keyMetric: precision@1=1.0 · в 3.2× дешевле OpenAI
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
    hint: на основном запросе про образ жизни
  - label: MRR
    value: "0.44"
    hint: по 3 размеченным запросам
  - label: Средняя задержка
    value: 1.9 с
    hint: через NIM, в 22× быстрее локальной Qwen3.5:9B на M1
  - label: Стоимость против OpenAI
    value: в 3.2× дешевле
    hint: одинаковая нагрузка
links:
  - label: GitHub
    url: https://github.com/thelonius/proptech-semantic-search
    kind: repo
featured: true
deep: true
order: 3
description: Демо поиска недвижимости по образу жизни. Три LLM-провайдера за одним клиентом, middleware стоимости с теневыми контрфактами, harness оценки как CI-гейт.
---

Поиск недвижимости по образу жизни, собранный под продакшен. Три LLM-провайдера (Ollama / NIM / OpenAI) за одним OpenAI-совместимым клиентом. Middleware стоимости считает активного провайдера плюс теневые контрфакты. Harness оценки запускается как CI-гейт на пяти размеченных запросах.

→ Смотрите [интерактивное демо и разбор архитектуры](/ru/projects/proptech).
