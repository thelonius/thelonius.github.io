---
slug: mlops-tutor
title: MLOps Tutor
tagline: Подготовка к собеседованию Senior MLOps с фолбэком по нескольким моделям
period: 2026 · свой хостинг
status: live
year: 2026
hero:
  type: iframe
  src: https://91-84-112-120.sslip.io/
  alt: MLOps Tutor — интерфейс из трёх режимов с ответами по SSE
keyMetric: цепочка фолбэка из 4 моделей · аптайм ~99%
stack:
  - Flask
  - OpenAI SDK
  - Groq
  - Server-Sent Events
  - vanilla JS
  - marked.js
  - highlight.js
metrics:
  - label: Тем
    value: "12"
    hint: K8s, Triton, ClearML, мониторинг, system design
  - label: Режимы
    value: объяснение · квиз · мок-собес
  - label: Цепочка фолбэка
    value: Llama 3.3 70B → GPT OSS 120B → Llama 4 Scout → Llama 3.1 8B
  - label: Хранилище на бэкенде
    value: "0"
    hint: всё состояние живёт на клиенте
links:
  - label: Открыть
    url: https://91-84-112-120.sslip.io/
    kind: demo
  - label: GitHub
    url: https://github.com/thelonius/mlops_tutor
    kind: repo
featured: true
deep: true
order: 2
description: Интерактивный тренажёр для подготовки к собеседованию Senior MLOps с тремя режимами обучения, стримингом по SSE и цепочкой фолбэка из 4 моделей Groq.
---

## Задача

Подготовка к собеседованию Senior MLOps означает покрыть 12 широких тем — операторы Kubernetes, Triton Inference Server, пайплайны ClearML, мониторинг моделей, system design — а готовые материалы либо слишком поверхностные (статьи в блогах), либо слишком дорогие (платные курсы).

Я хотел инструмент, который открываю с телефона в дороге, выбираю любую тему и переключаюсь между тремя режимами обучения — читать, прорешивать, симулировать — без подписки.

## Решение

Бэкенд на Flask с **Server-Sent Events** для ответов, стримящихся по токенам. Фронт — чистый JavaScript (без React), `marked.js` для рендера Markdown, `highlight.js` для блоков кода.

Слой моделей — это **цепочка фолбэка по нескольким моделям** через OpenAI-совместимый эндпоинт Groq: основная — Llama 3.3 70B, с автоматическим переключением на GPT OSS 120B → Llama 4 Scout → Llama 3.1 8B, когда основная упирается в rate-limit. Пользователь видит непрерывный стриминг; бэкенд логирует, какая модель ответила.

У каждого блока кода в любом ответе есть действие «объясни этот код» — тьютор разбирает его построчно в дочернем SSE-стриме. Прогресс по темам живёт в `localStorage`; `sessionStorage` держит параллельные вкладки независимыми, так что две темы можно вести бок о бок.

## Архитектура

```mermaid
graph LR
  client[Vanilla JS client + marked.js + highlight.js] -->|HTTP POST| flask[Flask app]
  flask -->|OpenAI SDK| groq[Groq endpoint]
  groq --> primary{Llama 3.3 70B}
  primary -->|rate-limit| f1[GPT OSS 120B]
  f1 -->|rate-limit| f2[Llama 4 Scout]
  f2 -->|rate-limit| f3[Llama 3.1 8B]
  flask -->|SSE stream| client
```

Цепочка фолбэка задаётся декларативно одним списком Python — добавить новую модель — это одна строка. SSE естественно справляется с back-pressure: если клиент отключился, апстрим-стрим отменяется.
