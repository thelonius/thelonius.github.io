import type { Lang } from './ui';

export interface HomeContent {
  meta: { title: string; description: string };
  hero: {
    name: string;
    roleLine: string;
    lead: string;
    sub: string;
    nav: { projects: string; about: string; contact: string };
  };
  projects: { eyebrow: string; heading: string; also: string };
  about: {
    eyebrow: string;
    heading: string;
    p1: string;
    focusLabel: string;
    focus: { strong: string; rest: string }[];
    p2: string;
  };
  experience: {
    eyebrow: string;
    heading: string;
    rows: { period: string; role: string }[];
  };
  skills: {
    eyebrow: string;
    heading: string;
    groups: { label: string; value: string }[];
  };
  contact: {
    eyebrow: string;
    heading: string;
    rows: { label: string; href: string; text: string; download?: boolean }[];
  };
  footer: { pre: string; linkLabel: string };
}

const skillGroupsValues = [
  'Python · PyTorch · Transformers · OpenCV · RAG · Qdrant · OpenAI · Claude · NVIDIA NIM · Ollama · Groq · embeddings · semantic search',
  'FastAPI · asyncio · Pydantic · Celery · Flask · Django · REST · WebSocket · SSE',
  'PostgreSQL · MySQL · Redis · Docker · Prometheus · nginx · Linux · GitHub Actions',
  'React · TypeScript · Next.js · Vue · Nuxt · Three.js · Preact · Astro',
  'pytest · mypy · ruff · evaluation harnesses · ADRs · structured logging',
];

const contactBase = [
  { label: 'Telegram', href: 'https://t.me/edubnitsky', text: '@edubnitsky' },
  { label: 'Email', href: 'mailto:dubnitsky@gmail.com', text: 'dubnitsky@gmail.com' },
  { label: 'GitHub', href: 'https://github.com/thelonius', text: 'github.com/thelonius' },
  {
    label: 'LinkedIn',
    href: 'https://www.linkedin.com/in/eduard-dubnitsky-baa2771a/',
    text: 'linkedin.com/in/eduard-dubnitsky',
  },
];

export const home: Record<Lang, HomeContent> = {
  en: {
    meta: {
      title: 'Ed Dubnitsky — ML Engineer',
      description:
        'ML Engineer building production RAG, computer vision, and multi-provider LLM pipelines. Five in-depth case studies.',
    },
    hero: {
      name: 'Ed Dubnitsky',
      roleLine: 'ML Engineer · Remote-first · EN C1',
      lead: 'I build the plumbing that turns LLM and computer-vision models into reliable services. Production RAG on FastAPI + Qdrant, multi-provider orchestration, cost-aware engineering, evaluation harnesses as CI gates, 3D and CV pipelines on PyTorch.',
      sub: '12 years shipping software · past year fully on production AI · two of the projects below shipped in under two weeks combined via AI-augmented coding.',
      nav: { projects: '[ projects ]', about: '[ about ]', contact: '[ contact ]' },
    },
    projects: { eyebrow: 'Projects', heading: 'Selected work', also: 'Also' },
    about: {
      eyebrow: 'About',
      heading: '12 years shipping software, past year fully on AI',
      p1: 'Started with Vue and React. Spent several years at the data/frontend boundary: T-SQL reports and L&D analytics at a corporate retail group, leading a small team for the last stretch and running the department solo for half a year; then data marts and BI widgets over Dremio at a BI vendor. A year ago pivoted fully to ML, with real retraining behind it. Now I build the plumbing that turns LLMs and computer-vision models from toys into reliable services.',
      focusLabel: 'What I focus on:',
      focus: [
        { strong: 'RAG and LLM pipelines in production', rest: ' — intent parsing, semantic retrieval, explainable re-ranking' },
        { strong: 'Vector search with Qdrant', rest: ' — HNSW tuning, hybrid filters, named vectors for multimodal' },
        { strong: 'Computer Vision in production', rest: ' — depth estimation (MiDaS / PyTorch), Structure-from-Motion, 3D mesh segmentation' },
        { strong: 'Cost-aware engineering', rest: ' — every LLM call counted in $ real plus shadow counterfactuals across providers' },
        { strong: 'Evaluation harnesses as CI gates', rest: ' — precision@K, recall@K, MRR, cost, latency in diff-friendly Markdown' },
        { strong: 'Multi-provider abstraction', rest: ' — one client interface, env-flag swap between Ollama / NIM / OpenAI / Groq' },
        { strong: 'AI-augmented coding', rest: ' — production-grade prototypes in days, not months' },
      ],
      p2: "Comfortable saying what I don't know. Kubeflow, Triton, multi-node inference — growing into them, not yet shipped them. In the right team I'd grow there with the work.",
    },
    experience: {
      eyebrow: 'Experience',
      heading: "Where I've worked",
      rows: [
        { period: '2023 — now', role: 'ML Engineer · Pandora Software Consulting Ltd' },
        { period: '2022 — 2023', role: 'Analytics Engineer · Goodt' },
        { period: '2021 — now', role: 'Senior Full-Stack Engineer · radian (parallel)' },
        { period: '2019 — 2022', role: 'Lead Analytics Engineer · L&D platform · MediaMarktSaturn' },
      ],
    },
    skills: {
      eyebrow: 'Skills',
      heading: 'What I work with',
      groups: [
        { label: 'AI / ML', value: skillGroupsValues[0] },
        { label: 'Backend', value: skillGroupsValues[1] },
        { label: 'Data / Infra', value: skillGroupsValues[2] },
        { label: 'Frontend', value: skillGroupsValues[3] },
        { label: 'Quality', value: skillGroupsValues[4] },
      ],
    },
    contact: {
      eyebrow: 'Contact',
      heading: 'Reach me',
      rows: [
        ...contactBase,
        { label: 'Resume', href: '/ed-dubnitsky-cv-en.pdf', text: '↓ ed-dubnitsky-cv-en.pdf', download: true },
      ],
    },
    footer: { pre: 'Built with Astro · source-viewable on ', linkLabel: 'GitHub' },
  },
  ru: {
    meta: {
      title: 'Ed Dubnitsky — ML-инженер',
      description:
        'ML-инженер: продакшен-RAG, компьютерное зрение и мультипровайдерные LLM-конвейеры. Пять подробных кейсов.',
    },
    hero: {
      name: 'Ed Dubnitsky',
      roleLine: 'ML-инженер · Удалёнка · EN C1',
      lead: 'Я делаю обвязку, которая превращает LLM и модели компьютерного зрения в надёжные сервисы. Продакшен-RAG на FastAPI + Qdrant, оркестрация нескольких провайдеров, инженерия с оглядкой на стоимость, harness’ы оценки как CI-гейты, 3D- и CV-конвейеры на PyTorch.',
      sub: '12 лет выпускаю софт · последний год полностью в продакшен-ИИ · два проекта ниже собраны меньше чем за две недели суммарно через кодинг с ИИ.',
      nav: { projects: '[ проекты ]', about: '[ о себе ]', contact: '[ контакты ]' },
    },
    projects: { eyebrow: 'Проекты', heading: 'Избранные работы', also: 'Ещё' },
    about: {
      eyebrow: 'О себе',
      heading: '12 лет выпускаю софт, последний год полностью в ИИ',
      p1: 'Начинал с Vue и React. Несколько лет работал на стыке данных и фронтенда: T-SQL отчёты и аналитика в корпоративном обучающем центре крупного ритейлера, под конец вёл небольшую команду и полгода тянул отдел один; потом витрины и BI-виджеты поверх Dremio в BI-вендоре. Год назад переключился на ML, с переучиванием. Теперь делаю обвязку, которая превращает LLM и модели компьютерного зрения из игрушек в надёжные сервисы.',
      focusLabel: 'На чём фокусируюсь:',
      focus: [
        { strong: 'RAG и LLM-конвейеры в продакшене', rest: ' — разбор интента, семантический retrieval, объяснимый ре-ранкинг' },
        { strong: 'Векторный поиск на Qdrant', rest: ' — тюнинг HNSW, гибридные фильтры, именованные векторы для мультимодальности' },
        { strong: 'Компьютерное зрение в продакшене', rest: ' — оценка глубины (MiDaS / PyTorch), Structure-from-Motion, сегментация 3D-мешей' },
        { strong: 'Инженерия с оглядкой на стоимость', rest: ' — каждый вызов LLM посчитан в реальных $ плюс теневые контрфакты по провайдерам' },
        { strong: 'Harness’ы оценки как CI-гейты', rest: ' — precision@K, recall@K, MRR, стоимость, задержка в diff-дружелюбном Markdown' },
        { strong: 'Абстракция над несколькими провайдерами', rest: ' — один интерфейс клиента, переключение по env-флагу между Ollama / NIM / OpenAI / Groq' },
        { strong: 'Кодинг с ИИ', rest: ' — продакшен-прототипы за дни вместо месяцев' },
      ],
      p2: 'Спокойно говорю, чего не знаю. Kubeflow, Triton, multi-node инференс — осваиваю, но в продакшене ещё не выпускал. В правильной команде дорос бы до них вместе с задачами.',
    },
    experience: {
      eyebrow: 'Опыт',
      heading: 'Где работал',
      rows: [
        { period: '2023 — сейчас', role: 'ML-инженер · МЦНМО / Пандора' },
        { period: '2022 — 2023', role: 'Analytics-инженер · Goodt' },
        { period: '2021 — 2022', role: 'Senior Full-Stack инженер · radian (параллельно)' },
        { period: '2019 — 2022', role: 'Lead Analytics-инженер · L&D-платформа · Мерлион / Ситилинк' },
      ],
    },
    skills: {
      eyebrow: 'Навыки',
      heading: 'С чем работаю',
      groups: [
        { label: 'AI / ML', value: skillGroupsValues[0] },
        { label: 'Бэкенд', value: skillGroupsValues[1] },
        { label: 'Данные / Инфра', value: skillGroupsValues[2] },
        { label: 'Фронтенд', value: skillGroupsValues[3] },
        { label: 'Качество', value: skillGroupsValues[4] },
      ],
    },
    contact: {
      eyebrow: 'Контакты',
      heading: 'Как связаться',
      rows: [
        ...contactBase,
        { label: 'Резюме', href: '/ed-dubnitsky-cv.pdf', text: '↓ ed-dubnitsky-cv.pdf', download: true },
      ],
    },
    footer: { pre: 'Собрано на Astro · исходники на ', linkLabel: 'GitHub' },
  },
};
