import type { Lang } from './ui';

export interface ProptechContent {
  sections: { id: string; label: string }[];
  problem: { h2: string; p1: string; p2: string; beforeLabel: string; afterLabel: string };
  architecture: { h2: string; p: string };
  pipeline: {
    h2: string;
    intro: string;
    stages: {
      name: string;
      what: string;
      inputLabel: string;
      outputLabel: string;
      observation: string;
    }[];
    stage3Prompt: string;
  };
  multiProvider: { h2: string; p: string; annotations: string[] };
  cost: { h2: string; p: string; annotations: string[]; caption: string };
  showdown: { h2: string; p: string };
  evalSec: { h2: string; p: string; caption: string };
  tradeoffs: { h2: string; cards: { eyebrow: string; h3: string; p: string }[] };
  roadmap: { h2: string; intro: string; items: string[] };
  stack: { stackH2: string; metricsH2: string; linksH2: string; runIdPrefix: string; stubNote: string };
}

const SECTION_IDS = [
  'hero',
  'problem',
  'architecture',
  'pipeline',
  'multi-provider',
  'cost',
  'showdown',
  'eval',
  'tradeoffs',
  'roadmap',
  'stack',
];

export const proptech: Record<Lang, ProptechContent> = {
  en: {
    sections: [
      'Try it',
      'Why filters fail',
      'Architecture',
      'Pipeline deep-dive',
      'Multi-provider client',
      'Cost middleware',
      'Provider showdown',
      'Eval as CI gate',
      'Tradeoffs',
      'Roadmap',
      'Stack & links',
    ].map((label, i) => ({ id: SECTION_IDS[i], label })),
    problem: {
      h2: 'Why filters fail',
      p1: 'Traditional real-estate search is a stack of dropdowns: bedroom count, price band, district code. A query like "family with kids and a dog, quiet street" doesn\'t fit any of those fields. The user has to translate intent into filter values, and the system loses everything that doesn\'t fit a numeric box.',
      p2: "Lifestyle search inverts this. The natural-language query is the input; the listing's textual description and amenity tags are what gets matched. Below — the same intent expressed both ways.",
      beforeLabel: 'Filters · 2024',
      afterLabel: 'Lifestyle · this demo',
    },
    architecture: {
      h2: 'Architecture',
      p: 'FastAPI in front. The pipeline is a three-stage RAG: an intent parser (LLM, JSON-mode) extracts lifestyle constraints from the natural-language query; Qdrant runs hybrid vector search over multi-modal listing embeddings; a re-ranker (LLM) produces the final ordering with a short explanation per listing. A cost middleware runs alongside, attaching <code>X-Cost-USD</code> and shadow-cost headers to every response. An evaluation harness runs the same shape of work as a CI gate.',
    },
    pipeline: {
      h2: 'Pipeline deep-dive',
      intro: 'One representative query through the three stages. Result IDs and scores come from a real Qdrant run on the 100-listing subset. The intent JSON shape is the production prompt; the rerank+explain LLM stage is scaffolded but not shipped yet — explanation strings on this page are stitched from listing-payload fields. See <a href="#roadmap" class="text-accent">Roadmap</a> for what\'s in flight.',
      stages: [
        {
          name: 'Intent parse',
          what: 'A small LLM call (json_mode=true) extracts a structured intent from the natural-language query. We keep this stage cheap so it pays for itself on cache hits.',
          inputLabel: 'Query',
          outputLabel: 'Parsed intent',
          observation: 'The intent JSON is also a cache key — same query → same intent → same retrieval inputs. Hit rate on the eval set runs around 60% even with low query repetition.',
        },
        {
          name: 'Retrieve',
          what: 'Qdrant runs a hybrid query: vector similarity on the listing description embedding plus filter on the structured intent fields. Top-K is over-fetched (K=20) to give the reranker headroom.',
          inputLabel: 'Vector input',
          outputLabel: 'Top-3 from Qdrant (pre-rerank)',
          observation: "Score normalisation matters here — Qdrant's cosine score is not directly comparable across collections. Per-collection score baselines are pinned in the config.",
        },
        {
          name: 'Rerank + explain',
          what: 'A second LLM call ranks the top-K and emits a short reason per listing. JSON-mode again so the response is parseable without regex.',
          inputLabel: 'Reranker prompt',
          outputLabel: 'Top result + explanation',
          observation: 'The explanation is what the user actually reads. Without it the score number is meaningless. We log the full reranker output so a regression in explanation quality shows up in eval review.',
        },
      ],
      stage3Prompt:
        "Score the candidates against the user's query. For each, write one short reason in user-facing English. Output JSON.",
    },
    multiProvider: {
      h2: 'Multi-provider client',
      p: 'The three LLM providers I use — Ollama for local development, NVIDIA NIM for hosted inference, and OpenAI for comparison — all expose OpenAI-compatible APIs. So instead of three SDK wrappers I have one client class with three configurations. Switching is one env var.',
      annotations: [
        'All three providers expose an OpenAI-compatible Chat Completions API. We use the openai SDK for everything and differ only in base_url + api_key + model.',
        'Switching providers is one env var. Cost middleware reads X-Cost-USD plus shadow headers for the providers that would have been used.',
      ],
    },
    cost: {
      h2: 'Cost middleware',
      p: 'Every response carries the active provider\'s cost in <code>X-Cost-USD</code> plus shadow-cost headers for the providers that would have been used on the same workload. Watching costs in headers — not just dashboards — makes the provider-choice argument concrete the moment a question comes up.',
      annotations: [
        'Active provider on this request — read from LLM_PROVIDER env var at startup.',
        'End-to-end latency including intent parse, vector search, rerank+explain.',
        'Real cost: input_tokens × price_per_million from app/core/config.py::cost_table.',
        'What the same request would have cost on OpenAI. Computed from the same token counts × OpenAI pricing.',
        'Same workload on NIM. Equal to X-Cost-USD when NIM is the active provider.',
      ],
      caption:
        'Headers from a NIM run. Token counts come from the OpenAI SDK response when present, tiktoken cl100k_base when not.',
    },
    showdown: {
      h2: 'Provider showdown',
      p: 'Same workload, three providers — the cost and latency numbers below come from the eval harness, run head-to-head on the labelled query set.',
    },
    evalSec: {
      h2: 'Eval as CI gate',
      p: 'The eval harness runs on every PR that touches retrieval or prompts. Precision@K, recall@K, MRR, mean latency, mean cost — all computed on a labelled query set, all reported in a diff-friendly Markdown report. A regression on any gold query blocks the merge.',
      caption:
        'Illustrative CI report. The baseline numbers (left column) are from the real 2026-05-04 run; the regression branch is fabricated to show what the gate would print.',
    },
    tradeoffs: {
      h2: 'Tradeoffs',
      cards: [
        {
          eyebrow: 'Vector store',
          h3: 'Qdrant over pgvector',
          p: 'pgvector is operationally cheap if Postgres is already there. Qdrant gives me HNSW tuning knobs (m, ef, ef_construct), payload filters that compose well with vector search, and snapshot-based collection migration. For a system where retrieval quality is the headline metric, those knobs are worth a separate service.',
        },
        {
          eyebrow: 'Reranker shape',
          h3: 'Two-call rerank over one-shot',
          p: "A single call that does intent + retrieve + rerank in one prompt is faster but harder to debug — when a query goes wrong I can't tell whether intent was off or the reranker was. Two calls give me an intermediate JSON I can log, cache, and assert on in eval. Worth ~150 ms.",
        },
        {
          eyebrow: 'Cost telemetry',
          h3: 'Shadow costs in headers, not just metrics',
          p: 'Per-request shadow-cost headers (<code>X-Cost-Shadow-OpenAI-USD</code>, <code>X-Cost-Shadow-NIM-USD</code>) are visible to anyone running curl. They make the provider-choice argument concrete in the moment a question comes up — "what would this have cost on OpenAI?" is a header read, not a Grafana query.',
        },
        {
          eyebrow: 'Eval cadence',
          h3: 'CI gate over async batch',
          p: 'Some teams run eval as a nightly batch and look at trends. I run it on every PR that touches retrieval or prompts. The cost is around 30 s per provider on this dataset, which is acceptable as a merge gate. The win: regressions surface before they merge, not the morning after.',
        },
      ],
    },
    roadmap: {
      h2: 'Roadmap',
      intro: "What's in the repo as scaffolding but not finished:",
      items: [
        '<strong>Rerank + explain stage.</strong> Intent-parse and Qdrant retrieval ship. The second LLM call that re-orders the candidates and writes a per-listing explanation is scaffolded in <code>app/api/search.py</code> but not yet wired in. Until it lands, the explanations on the demo are stitched from listing-payload fields.',
        '<strong>Reranker ablation.</strong> Once rerank ships, run BM25 + embedding-rerank as a baseline so we know what the LLM rerank is actually buying. The eval harness can already express the comparison.',
        '<strong>Streaming responses.</strong> The pipeline is synchronous end to end, p50 ≈ 1.6 s on NIM. The plan is to return top-K immediately and stream explanations as they come back from the reranker. The <code>asyncio</code> shape is already there; the API contract changes.',
        '<strong>Multi-modal listings.</strong> Today only the listing text is indexed. The dataset (<code>Binaryy/multimodal-real-estate-search</code>) ships photos. Adding CLIP embeddings on the photos and a fusion step would unlock queries like "sunny rooms with large windows" that pure text can\'t catch.',
        '<strong>Cost dashboard in Grafana.</strong> The Prometheus counter (<code>llm_call_cost_usd_total</code>) is emitting; the dashboard JSON is not committed. Same for the cost-by-provider stacked bar over time.',
      ],
    },
    stack: {
      stackH2: 'Stack',
      metricsH2: 'Metrics',
      linksH2: 'Links',
      runIdPrefix: 'Numbers from run id ',
      stubNote: ' · STUB · awaiting data-runner',
    },
  },
  ru: {
    sections: [
      'Попробовать',
      'Почему фильтры не работают',
      'Архитектура',
      'Разбор конвейера',
      'Мультипровайдерный клиент',
      'Middleware стоимости',
      'Сравнение провайдеров',
      'Оценка как CI-гейт',
      'Компромиссы',
      'Дорожная карта',
      'Стек и ссылки',
    ].map((label, i) => ({ id: SECTION_IDS[i], label })),
    problem: {
      h2: 'Почему фильтры не работают',
      p1: 'Обычный поиск недвижимости — это набор выпадающих списков: число спален, ценовой диапазон, код района. Запрос вроде «семья с детьми и собакой, тихая улица» не ложится ни в одно из этих полей. Пользователь вынужден переводить намерение в значения фильтров, а система теряет всё, что не влезает в числовую ячейку.',
      p2: 'Поиск по образу жизни переворачивает это. Вход — запрос на естественном языке; матчится текстовое описание объявления и теги удобств. Ниже — одно и то же намерение, выраженное двумя способами.',
      beforeLabel: 'Фильтры · 2024',
      afterLabel: 'Образ жизни · это демо',
    },
    architecture: {
      h2: 'Архитектура',
      p: 'Спереди FastAPI. Конвейер — это RAG из трёх стадий: парсер интента (LLM, JSON-режим) вытаскивает ограничения по образу жизни из запроса на естественном языке; Qdrant гоняет гибридный векторный поиск по мультимодальным эмбеддингам объявлений; ре-ранкер (LLM) выдаёт финальный порядок с коротким объяснением на каждое объявление. Рядом работает middleware стоимости, навешивая на каждый ответ заголовки <code>X-Cost-USD</code> и shadow-cost. Harness оценки гоняет ту же по форме работу как CI-гейт.',
    },
    pipeline: {
      h2: 'Разбор конвейера',
      intro: 'Один показательный запрос через три стадии. ID результатов и оценки — из реального прогона Qdrant на подвыборке из 100 объявлений. Форма JSON интента — это продакшен-промпт; стадия LLM rerank+explain пока в виде каркаса, не выпущена — строки объяснений на этой странице сшиты из полей payload объявления. Что в работе — смотрите в <a href="#roadmap" class="text-accent">дорожной карте</a>.',
      stages: [
        {
          name: 'Разбор интента',
          what: 'Небольшой вызов LLM (json_mode=true) вытаскивает структурированный интент из запроса на естественном языке. Эту стадию держим дешёвой, чтобы она окупалась на попаданиях в кэш.',
          inputLabel: 'Запрос',
          outputLabel: 'Разобранный интент',
          observation: 'JSON интента — это ещё и ключ кэша: один запрос → один интент → одни входы для retrieval. Hit rate на eval-наборе держится около 60% даже при низкой повторяемости запросов.',
        },
        {
          name: 'Retrieval',
          what: 'Qdrant гоняет гибридный запрос: векторная близость по эмбеддингу описания объявления плюс фильтр по структурированным полям интента. Top-K берётся с запасом (K=20), чтобы дать ре-ранкеру простор.',
          inputLabel: 'Векторный вход',
          outputLabel: 'Top-3 из Qdrant (до rerank)',
          observation: 'Нормализация оценок здесь важна — косинусная оценка Qdrant не сравнима напрямую между коллекциями. Базовые уровни оценок по каждой коллекции закреплены в конфиге.',
        },
        {
          name: 'Rerank + объяснение',
          what: 'Второй вызов LLM ранжирует top-K и выдаёт короткую причину на каждое объявление. Снова JSON-режим, чтобы ответ парсился без регулярок.',
          inputLabel: 'Промпт ре-ранкера',
          outputLabel: 'Лучший результат + объяснение',
          observation: 'Объяснение — это то, что пользователь реально читает. Без него число оценки бессмысленно. Мы логируем полный вывод ре-ранкера, чтобы регрессия в качестве объяснений всплывала на ревью eval.',
        },
      ],
      stage3Prompt:
        'Score the candidates against the user\'s query. For each, write one short reason in user-facing English. Output JSON.',
    },
    multiProvider: {
      h2: 'Мультипровайдерный клиент',
      p: 'Три LLM-провайдера, которые я использую — Ollama для локальной разработки, NVIDIA NIM для хостед-инференса и OpenAI для сравнения — все отдают OpenAI-совместимые API. Поэтому вместо трёх обёрток SDK у меня один класс клиента с тремя конфигурациями. Переключение — это одна env-переменная.',
      annotations: [
        'Все три провайдера отдают OpenAI-совместимый API Chat Completions. Везде используем openai SDK и различаемся только в base_url + api_key + model.',
        'Переключение провайдеров — одна env-переменная. Middleware стоимости читает X-Cost-USD плюс shadow-заголовки для провайдеров, которые были бы использованы.',
      ],
    },
    cost: {
      h2: 'Middleware стоимости',
      p: 'Каждый ответ несёт стоимость активного провайдера в <code>X-Cost-USD</code> плюс shadow-cost заголовки для провайдеров, которые были бы использованы на той же нагрузке. Когда стоимость видна в заголовках, а не только в дашбордах, аргумент о выборе провайдера становится конкретным в тот момент, когда вопрос возникает.',
      annotations: [
        'Активный провайдер на этом запросе — читается из env-переменной LLM_PROVIDER при старте.',
        'Сквозная задержка, включая разбор интента, векторный поиск, rerank+explain.',
        'Реальная стоимость: input_tokens × price_per_million из app/core/config.py::cost_table.',
        'Сколько тот же запрос стоил бы на OpenAI. Считается из тех же количеств токенов × прайс OpenAI.',
        'Та же нагрузка на NIM. Равно X-Cost-USD, когда NIM — активный провайдер.',
      ],
      caption:
        'Заголовки из прогона на NIM. Количества токенов берутся из ответа OpenAI SDK, когда они есть, и из tiktoken cl100k_base, когда нет.',
    },
    showdown: {
      h2: 'Сравнение провайдеров',
      p: 'Та же нагрузка, три провайдера — цифры стоимости и задержки ниже взяты из harness оценки, прогнанного лоб в лоб на размеченном наборе запросов.',
    },
    evalSec: {
      h2: 'Оценка как CI-гейт',
      p: 'Harness оценки гоняется на каждом PR, который трогает retrieval или промпты. Precision@K, recall@K, MRR, средняя задержка, средняя стоимость — всё считается на размеченном наборе запросов, всё пишется в diff-дружелюбный Markdown-отчёт. Регрессия на любом золотом запросе блокирует мердж.',
      caption:
        'Иллюстративный CI-отчёт. Базовые цифры (левая колонка) — из реального прогона 2026-05-04; ветка с регрессией придумана, чтобы показать, что напечатал бы гейт.',
    },
    tradeoffs: {
      h2: 'Компромиссы',
      cards: [
        {
          eyebrow: 'Векторное хранилище',
          h3: 'Qdrant вместо pgvector',
          p: 'pgvector дёшев в эксплуатации, если Postgres уже стоит. Qdrant даёт ручки тюнинга HNSW (m, ef, ef_construct), payload-фильтры, которые хорошо складываются с векторным поиском, и миграцию коллекций через снапшоты. Для системы, где качество retrieval — главная метрика, эти ручки стоят отдельного сервиса.',
        },
        {
          eyebrow: 'Форма ре-ранкера',
          h3: 'Rerank в два вызова вместо одного',
          p: 'Один вызов, который делает интент + retrieve + rerank в одном промпте, быстрее, но его сложнее дебажить — когда запрос идёт не так, я не могу понять, ошибся интент или ре-ранкер. Два вызова дают промежуточный JSON, который я могу логировать, кэшировать и проверять в eval. Стоит ~150 мс.',
        },
        {
          eyebrow: 'Телеметрия стоимости',
          h3: 'Shadow-стоимость в заголовках, а не только в метриках',
          p: 'Заголовки shadow-стоимости на каждый запрос (<code>X-Cost-Shadow-OpenAI-USD</code>, <code>X-Cost-Shadow-NIM-USD</code>) видны любому, кто гоняет curl. Они делают аргумент о выборе провайдера конкретным в тот момент, когда вопрос возникает — «сколько это стоило бы на OpenAI?» — это чтение заголовка, а не запрос в Grafana.',
        },
        {
          eyebrow: 'Частота eval',
          h3: 'CI-гейт вместо асинхронного батча',
          p: 'Некоторые команды гоняют eval ночным батчем и смотрят на тренды. Я гоняю его на каждом PR, который трогает retrieval или промпты. Стоит это около 30 с на провайдера на этом датасете, что приемлемо как мердж-гейт. Выигрыш: регрессии всплывают до мерджа, а не на следующее утро.',
        },
      ],
    },
    roadmap: {
      h2: 'Дорожная карта',
      intro: 'Что лежит в репозитории как каркас, но не доделано:',
      items: [
        '<strong>Стадия rerank + explain.</strong> Разбор интента и retrieval из Qdrant выпущены. Второй вызов LLM, который пере-упорядочивает кандидатов и пишет объяснение на каждое объявление, есть каркасом в <code>app/api/search.py</code>, но ещё не подключён. Пока он не приземлился, объяснения в демо сшиты из полей payload объявления.',
        '<strong>Абляция ре-ранкера.</strong> Как только rerank выйдет — прогнать BM25 + embedding-rerank как baseline, чтобы понимать, что LLM-rerank на самом деле даёт. Harness оценки уже умеет выразить это сравнение.',
        '<strong>Стриминг ответов.</strong> Конвейер синхронный от начала до конца, p50 ≈ 1.6 с на NIM. План — отдавать top-K сразу и стримить объяснения по мере их прихода от ре-ранкера. Форма <code>asyncio</code> уже есть; меняется контракт API.',
        '<strong>Мультимодальные объявления.</strong> Сегодня индексируется только текст объявления. Датасет (<code>Binaryy/multimodal-real-estate-search</code>) идёт с фотографиями. Добавление CLIP-эмбеддингов на фото и шага fusion разблокировало бы запросы вроде «солнечные комнаты с большими окнами», которые чистый текст не ловит.',
        '<strong>Дашборд стоимости в Grafana.</strong> Счётчик Prometheus (<code>llm_call_cost_usd_total</code>) уже эмитит; JSON дашборда не закоммичен. То же для столбчатой диаграммы стоимости по провайдерам во времени.',
      ],
    },
    stack: {
      stackH2: 'Стек',
      metricsH2: 'Метрики',
      linksH2: 'Ссылки',
      runIdPrefix: 'Цифры из прогона id ',
      stubNote: ' · ЗАГЛУШКА · ждём data-runner',
    },
  },
};
