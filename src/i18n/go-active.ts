import type { Lang } from './ui';

export interface GoActiveContent {
  heroLabels: { rawGpx: string; realRender: string; clipNote: string };
  heroCaption: string;
  liveLine: string;
  problem: { h2: string; p1: string; p2: string };
  process: {
    h2: string;
    intro: string;
    stages: {
      name: string;
      what: string;
      inputLabel: string;
      outputLabel: string;
      observation: string;
    }[];
  };
  ara: {
    h2: string;
    badge: string;
    intro: string;
    liveNote: string;
    twoEngineH3: string;
    twoEngineP: string;
    metricGroupsH3: string;
    metricGroupsP: string;
    cards: { label: string; count: string; desc: string }[];
    barsH3: string;
    barsP: string;
    barsObserved: string;
    timelineH3: string;
    timelineP: string;
    timelineObserved: string;
    velocityH3: string;
    velocityP: string;
    optimizerH3: string;
    optimizerP: string;
    weightsTitle: string;
    weightsNote: string;
    searchTitle: string;
    searchNote: string;
    cliH3: string;
    cliP: string;
    headsH3: string;
    headsP: string;
    figures: { label: string; sub: string; caption?: string }[];
    stackH3: string;
    stackItems: { term: string; desc: string }[];
  };
  dashboard: { h2: string; p: string; alt: string; caption: string };
  smart: {
    h2: string;
    p: string;
    rendersH3: string;
    rendersP: string;
    queuedLabel: string;
    queuedNote: string;
    flythroughH3: string;
    flythroughP: string;
    loopsH3: string;
    loopsP: string;
    loopsObserved: string;
    cameraH3: string;
    cameraP: string;
    cameraObserved: string;
  };
  architecture: { h2: string; p1: string; p2: string };
  stackH2: string;
  links: { h2: string; p: string; tg: string; miniapp: string };
  builtBy: { scope: string; status: string };
}

export const goActive: Record<Lang, GoActiveContent> = {
  en: {
    heroLabels: {
      rawGpx: 'Raw GPX · 3025 dots',
      realRender: 'Real production render',
      clipNote: 'from @Vixwibot · 25 s clip',
    },
    heroCaption:
      'Left: how a GPX file looks as raw 2D dots. Right: the same kind of trajectory after the full pipeline runs and the renderer encodes it to MP4 — this clip came straight out of the production bot @Vixwibot. The rest of this page shows how raw dots become that.',
    liveLine:
      'Live in production at <a href="https://t.me/Vixwibot" class="hover:underline">@Vixwibot</a> · Mini App at <a href="https://vixwi.com/" class="hover:underline">vixwi.com</a>',
    problem: {
      h2: 'Problem',
      p1: 'GPS tracks recorded by mainstream apps (Strava, Komoot) are useful for the user who recorded them but boring to share — flat maps with a coloured line. To turn a workout into something worth watching, the track has to become a cinematic flythrough with terrain context, and the system has to <strong>reject bad tracks</strong> (sparse points, GPS jitter, broken altitude) before spending render budget on them.',
      p2: 'The goal: take a GPX file, score it for renderability, and produce a shareable 3D video — all triggered from a Telegram message.',
    },
    process: {
      h2: 'Process',
      intro:
        'Five async stages, each with explicit memory and time budgets. Below: each stage running on the real <code class="font-mono text-accent text-xs">227-arkhyz-teberda-2024.gpx</code>.',
      stages: [
        {
          name: 'Parse GPX',
          what: 'Read the file, validate timestamps and altitudes, extract one Point per sample. Pass downstream as a typed list — no XML touched again.',
          inputLabel: 'GPX file blob',
          outputLabel: '3025 Point objects',
          observation: '3025 samples across 46 hours of moving time.',
        },
        {
          name: 'Terrain query',
          what: 'Build a bounding box from the trajectory, fetch terrain tiles, attach surface elevation to each Point. Lets us check for impossible-altitude jumps later.',
          inputLabel: 'bbox',
          outputLabel: 'Elevation profile',
          observation: 'Real climb: 1242 m → 2883 m, +8028 m cumulative. The profile shows the multi-day trek shape.',
        },
        {
          name: 'Smoothing & interpolation',
          what: "Median-filter the GPS jitter, spline-fit the path so the renderer doesn't draw a noisy zigzag. Gradient computed from smoothed altitudes.",
          inputLabel: 'raw jitter',
          outputLabel: 'speed profile (post-smoothing)',
          observation: 'Gaps of 55 s ± 83 % mean the device slept and woke unevenly. Smoother speed curve confirms filtering held.',
        },
        {
          name: 'CV quality scoring',
          what: 'A small ensemble of scorers reads the cleaned track and produces four sub-scores plus an overall. Bad tracks get rejected here before the expensive render runs.',
          inputLabel: 'cleaned track + signals',
          outputLabel: 'scores 0-100 + 8 raw metrics',
          observation: 'This trek scored low — uneven GPS sampling. Production would reject; for a showcase it is a useful negative example. See the full dashboard below.',
        },
        {
          name: 'Render',
          what: 'Build the 3D scene from the smoothed track + terrain, encode to MP4 via FFmpeg, return to Telegram. Skipped automatically when stage 4 rejects the track. The 25-second clip in the hero of this page is a real artefact of this stage from @Vixwibot.',
          inputLabel: 'scored track',
          outputLabel: '3D trajectory artefact',
          observation: 'Plotly 3D embed here is interactive — drag to rotate. The MP4 in the hero is what end-users actually receive in Telegram.',
        },
      ],
    },
    ara: {
      h2: 'ARA — Analyze Route Animation',
      badge: 'internal CV/ML tool · separate repo',
      intro:
        'ARA is a separate Python project I built alongside Go-Active to <strong>validate and tune the renderer</strong> without staring at hundreds of hours of MP4. It is not stitched into the production pipeline — it is the lab bench. Two engines, one CLI: a <strong>pre-render optimizer</strong> that searches for the best camera path before the render starts, and a <strong>post-render analyzer</strong> that scores the resulting video on seven metric groups using PyTorch + OpenCV.',
      liveNote:
        'Everything below is computed live by ARA on the real <code class="font-mono text-accent text-xs">render_forest.mp4</code> shown earlier on this page — 601 frames, 25 s, 24 fps. The numbers are read from the JSON reports the CLI just produced.',
      twoEngineH3: 'Two-engine architecture',
      twoEngineP:
        'Same codebase, two entry points. The optimizer takes a 3D scene and proposes a camera animation; the analyzer takes the resulting MP4 and scores how close to the proposal it landed.',
      metricGroupsH3: 'Seven metric groups',
      metricGroupsP:
        'Each group is a small bag of measurements computed per frame and aggregated. Live values shown are from <code class="font-mono text-accent text-xs">forest_report.json</code>.',
      cards: [
        {
          label: 'terrain view',
          count: '5 metrics',
          desc: 'Is the camera looking at the ground at a useful angle? Surface-normal alignment via depth gradient, tangent-view penalty, near-range occlusion check.',
        },
        {
          label: 'scene depth',
          count: '3 metrics',
          desc: 'How layered is the shot? K-means on the depth histogram for layer count, entropy of depth distribution, foreground/background separation.',
        },
        {
          label: 'composition',
          count: '4 metrics',
          desc: 'Frame economics — how much pixel area carries information vs sky vs empty terrain, where the runner sits in the rule-of-thirds grid.',
        },
        {
          label: 'temporal',
          count: '4 metrics',
          desc: 'Pacing across the clip. New visual information per second (information_flow), narrative reveal timing, frame-to-frame coherence.',
        },
        {
          label: 'camera motion',
          count: '6 metrics',
          desc: 'Optical-flow velocity vectors per frame → jitter, dropped/stuttered frames, smoothness, stability. Computed by <code class="text-accent">camera_motion_analyzer</code>.',
        },
        {
          label: 'animation',
          count: '4 metrics',
          desc: 'Whole-clip behaviour: duration, mean px/sec, how steady that speed is across the timeline, estimated camera-height score.',
        },
        {
          label: 'tiles quality',
          count: '4 metrics',
          desc: "Were the satellite tiles fetched cleanly? Sharpness via Laplacian variance, JPEG-blockiness detector, mid-frequency texture, fraction of frames showing loading artefacts. Catches CDN problems that don't show up in any other group.",
        },
      ],
      barsH3: 'Live metric bars · two real renders',
      barsP:
        'Same eleven metrics computed for both clips. The 8-second short scores higher on smoothness and texture detail; the 25-second forest pulls ahead on framing because the camera has more time to settle.',
      barsObserved:
        'Overall quality <strong class="text-accent">69.18 %</strong> for the forest clip vs <strong class="text-accent">70.27 %</strong> for the short. The big gap is in <code class="font-mono text-accent text-xs">texture_detail_score</code> — 0.79 vs 0.47 — because the longer clip spends more frames on dark forest where mid-band detail collapses. That is exactly the kind of finding ARA exists to surface.',
      timelineH3: 'Camera motion timeline · 188 segments',
      timelineP:
        '<code class="font-mono text-accent text-xs">camera_motion_analyzer</code> classified every frame into one of eight motion modes by clustering optical-flow vectors over a sliding window, then merged neighbours into segments. The timeline below is the result on the 25-second forest render — every coloured slice is one segment, hover to see the type, speed and quality.',
      timelineObserved:
        '188 segments total — <strong class="text-accent">86 rotate</strong>, <strong class="text-accent">33 static</strong>, 32 tilt-down, 25 pan-left, 6 pan-right, 6 tilt-up. The renderer favours rotation around the runner with periodic static beats; the absence of <code class="font-mono text-accent text-xs">zoom_in / zoom_out</code> tells me the camera holds focal length, which simplifies the SfM reconstruction below.',
      velocityH3: 'Per-segment velocity · coloured by motion quality',
      velocityP:
        "Speed in px/frame for every segment, dot colour = the segment's quality score. Dips towards zero are the static beats; the spikes are short rotation pivots. The variance is what feeds <code class=\"font-mono text-accent text-xs\">jerk_index = 3194</code> in the motion report.",
      optimizerH3: 'Pre-render optimizer · weights and search',
      optimizerP:
        'Before a render starts, ARA can sample the camera search space and pick the best path. Six objectives are mixed by weight; the search is small enough to run per-route on CPU.',
      weightsTitle: 'objective weights',
      weightsNote:
        'From <code class="text-accent">core/config.py</code>. The five-way split between visibility / depth / composition / framing keeps any single head from dominating; smoothness is half-weighted because the path smoother handles it deterministically afterwards.',
      searchTitle: 'search settings',
      searchNote:
        '32 × 16 × 3 = 1536 viewpoint evaluations per anchor frame. Cheap enough to run on every keyframe before committing to the render budget.',
      cliH3: 'CLI surface',
      cliP:
        'Six commands. The whole tool is a Typer app with rich tables for terminal output and Pydantic models for everything that goes to JSON.',
      headsH3: "What the analyzer's PyTorch heads see",
      headsP:
        'Inside <code class="font-mono text-accent text-xs">video_analyzer.py</code>, every frame is read through OpenCV and pushed through three small heads — depth (DPT-Hybrid via Hugging Face <code class="font-mono text-accent text-xs">transformers</code>, on Apple MPS), HSV-mask blob detection for the runner marker, Sobel-edge density for the texture/stability metrics. A composite tensor goes into the per-frame scorer that aggregates into the seven groups above. Below: those same heads running on a single frame from the forest clip — full-resolution intermediates from a debug session.',
      figures: [
        { label: 'input frame', sub: '464×536 · @Vixwibot render' },
        {
          label: 'depth · DPT-Hybrid',
          sub: 'monocular depth from RGB',
          caption: 'Reds are near, blues are far. The hill ridge stands out — feeds <code class="text-accent">scene_depth</code> layer count and FG/BG separation.',
        },
        {
          label: 'marker · HSV blob',
          sub: 'located at (273, 162) ± 5 px',
          caption: 'Red runner dot via HSV mask + largest-blob centroid. Used by <code class="text-accent">traveler_visibility</code> and <code class="text-accent">traveler_framing_score</code> to compute rule-of-thirds offset.',
        },
        {
          label: 'edges · Sobel',
          sub: 'texture and stability',
          caption: 'Edge density feeds <code class="text-accent">texture_detail_score</code> and the stability index — too low = blurry tile fetch, too high = busy scene.',
        },
      ],
      stackH3: 'ARA stack',
      stackItems: [
        { term: 'torch + torchvision', desc: 'depth, tensor ops' },
        { term: 'timm', desc: 'DPT backbone' },
        { term: 'opencv-python', desc: 'video I/O, optical flow, SIFT/ORB/AKAZE' },
        { term: 'scipy', desc: 'Catmull-Rom smoothing, signal stats' },
        { term: 'pydantic + pydantic-settings', desc: 'typed config, JSON in/out' },
        { term: 'typer + rich', desc: 'CLI, terminal tables' },
        { term: 'plotly', desc: 'timeline + velocity charts on this page' },
        { term: 'pyyaml', desc: 'override defaults via config files' },
        { term: '~2 100 LoC', desc: 'six modules, separate from Go-Active' },
      ],
    },
    dashboard: {
      h2: 'Quality dashboard',
      p: 'Same scores, packaged for Telegram. Each gauge is one CV head; the tiles are raw measurements feeding them.',
      alt: 'Go-Active quality dashboard with gauges and metric tiles',
      caption:
        "Computed live from the Архыз GPX. Lower scores reveal real issues — this trek's GPS sampling was uneven (83 % time-gap variance). Production rejects tracks under ~50 to save render budget.",
    },
    smart: {
      h2: 'Smart rendering',
      p: "The render stage isn't a dumb camera flying at constant speed along the track. Three algorithms shape what the viewer ends up seeing — all running on this same Архыз GPX.",
      rendersH3: 'Real production renders',
      rendersP:
        'Actual MP4s straight from @Vixwibot. The renderer adapts framing and pacing to the terrain — short suburban loops play one way, mountain treks another. All 720×1280 vertical for Telegram. The mountain and Crimean tiles below get filled in as the bot\'s queue drains — these renders take 1-3 hours each.',
      queuedLabel: 'queued render',
      queuedNote: 'rendering at @Vixwibot — auto-replaces when ready',
      flythroughH3: 'Animated flythrough (interactive)',
      flythroughP:
        "Auto-rotating 3D scene of the same Архыз track in Plotly form — drag to rotate manually. The yellow diamond marks the camera's current position. The production renderer above encodes a longer version of this onto satellite imagery with FFmpeg.",
      loopsH3: 'Loop detection',
      loopsP:
        'A loop closure is two points on the track that are spatially close but separated by significant path distance — usually a route that returns to a previous spot. The renderer uses these to plan a "highlight reel" cut: a tight orbit at each closure instead of replaying the whole loop.',
      loopsObserved:
        'On this trek the algorithm flagged <strong class="text-accent">3 closures</strong>: a 120m approach back to the camp area at point 168 ↔ 2736, a tight 24m return at 486 ↔ 2862, and the final 64m closing of the whole route at 204 ↔ 3024.',
      cameraH3: 'Camera behaviour heuristic',
      cameraP:
        'A boring constant-speed flythrough wastes attention. The heuristic scores each segment for "interestingness" — derived from elevation gradient + heading-change rate over a sliding window — then plans a virtual-camera speed multiplier from that. Slow at peaks and turns, fast across monotonous sections, total render duration preserved.',
      cameraObserved:
        'Speed plan ranges <strong class="text-accent">0.47×</strong> (deepest slow-down on the highest peaks) to <strong class="text-accent">1.6×</strong> (cruise across rolling sections). 60 named events — the diamonds in the chart — flagged as worth dwelling on.',
    },
    architecture: {
      h2: 'Architecture',
      p1: 'Five-stage async FastAPI pipeline behind a Telegram Mini App.',
      p2: 'Each stage has its own timeout and memory budget. Rejection at stage 4 saves the render budget for tracks worth watching.',
    },
    stackH2: 'Stack',
    links: {
      h2: 'Links',
      p: 'Live in production at <strong>@Vixwibot</strong> in Telegram — search for it in your client, or open the Mini App directly at <a href="https://vixwi.com/" class="text-accent hover:underline">vixwi.com</a>. Upload your own GPX to see your render.',
      tg: 'Open @Vixwibot in Telegram',
      miniapp: 'vixwi.com — Mini App entry',
    },
    builtBy: {
      scope: 'end-to-end: pipeline architecture, CV scoring, Telegram Mini App, deployment',
      status: 'Solo project · in production with real users',
    },
  },
  ru: {
    heroLabels: {
      rawGpx: 'Сырой GPX · 3025 точек',
      realRender: 'Реальный продакшен-рендер',
      clipNote: 'из @Vixwibot · клип 25 с',
    },
    heroCaption:
      'Слева: как GPX-файл выглядит в виде сырых 2D-точек. Справа: та же траектория после полного прогона конвейера, когда рендерер закодировал её в MP4 — этот клип вышел прямо из продакшен-бота @Vixwibot. Остальная часть страницы показывает, как сырые точки превращаются в это.',
    liveLine:
      'В продакшене на <a href="https://t.me/Vixwibot" class="hover:underline">@Vixwibot</a> · Mini App на <a href="https://vixwi.com/" class="hover:underline">vixwi.com</a>',
    problem: {
      h2: 'Задача',
      p1: 'GPS-треки, записанные обычными приложениями (Strava, Komoot), полезны тому, кто их записал, но скучны для шеринга — плоская карта с цветной линией. Чтобы тренировка стала чем-то, что хочется смотреть, трек надо превратить в кинематографичный пролёт с контекстом рельефа, а система должна <strong>отбраковывать плохие треки</strong> (разрежённые точки, GPS-джиттер, битая высота) до того, как потратит на них бюджет рендера.',
      p2: 'Цель: взять GPX-файл, оценить его пригодность к рендеру и выдать 3D-видео для шеринга — всё по одному сообщению в Telegram.',
    },
    process: {
      h2: 'Процесс',
      intro:
        'Пять асинхронных стадий, у каждой явные бюджеты памяти и времени. Ниже — каждая стадия на реальном <code class="font-mono text-accent text-xs">227-arkhyz-teberda-2024.gpx</code>.',
      stages: [
        {
          name: 'Разбор GPX',
          what: 'Прочитать файл, проверить таймстемпы и высоты, извлечь одну точку Point на каждый сэмпл. Передать дальше типизированным списком — XML больше не трогаем.',
          inputLabel: 'блоб GPX-файла',
          outputLabel: '3025 объектов Point',
          observation: '3025 сэмплов за 46 часов времени в движении.',
        },
        {
          name: 'Запрос рельефа',
          what: 'Построить bounding box по траектории, забрать тайлы рельефа, привязать высоту поверхности к каждой точке Point. Позже это даёт проверять невозможные скачки высоты.',
          inputLabel: 'bbox',
          outputLabel: 'Профиль высот',
          observation: 'Реальный набор высоты: 1242 м → 2883 м, +8028 м суммарно. Профиль показывает форму многодневного похода.',
        },
        {
          name: 'Сглаживание и интерполяция',
          what: 'Медианный фильтр по GPS-джиттеру, сплайн-аппроксимация пути, чтобы рендерер не рисовал шумный зигзаг. Градиент считается по сглаженным высотам.',
          inputLabel: 'сырой джиттер',
          outputLabel: 'профиль скорости (после сглаживания)',
          observation: 'Разрывы 55 с ± 83 % означают, что устройство неравномерно засыпало и просыпалось. Более гладкая кривая скорости подтверждает, что фильтрация сработала.',
        },
        {
          name: 'CV-оценка качества',
          what: 'Небольшой ансамбль оценщиков читает очищенный трек и выдаёт четыре под-оценки плюс общую. Плохие треки отбраковываются здесь, до дорогого рендера.',
          inputLabel: 'очищенный трек + сигналы',
          outputLabel: 'оценки 0-100 + 8 сырых метрик',
          observation: 'Этот поход получил низкую оценку — неравномерная GPS-выборка. Продакшен бы отбраковал; для витрины это полезный отрицательный пример. Полный дашборд ниже.',
        },
        {
          name: 'Рендер',
          what: 'Собрать 3D-сцену из сглаженного трека + рельефа, закодировать в MP4 через FFmpeg, вернуть в Telegram. Пропускается автоматически, когда стадия 4 отбраковывает трек. 25-секундный клип в шапке этой страницы — реальный артефакт этой стадии из @Vixwibot.',
          inputLabel: 'оценённый трек',
          outputLabel: 'артефакт 3D-траектории',
          observation: 'Plotly-3D здесь интерактивен — тяните, чтобы вращать. MP4 в шапке — это то, что конечные пользователи реально получают в Telegram.',
        },
      ],
    },
    ara: {
      h2: 'ARA — Analyze Route Animation',
      badge: 'внутренний CV/ML-инструмент · отдельный репозиторий',
      intro:
        'ARA — это отдельный Python-проект, который я собрал рядом с Go-Active, чтобы <strong>проверять и тюнить рендерер</strong>, не пересматривая сотни часов MP4. Он не вшит в продакшен-конвейер — это лабораторный стенд. Два движка, один CLI: <strong>пред-рендерный оптимизатор</strong>, который ищет лучший путь камеры до старта рендера, и <strong>пост-рендерный анализатор</strong>, который оценивает получившееся видео по семи группам метрик через PyTorch + OpenCV.',
      liveNote:
        'Всё ниже посчитано вживую через ARA на реальном <code class="font-mono text-accent text-xs">render_forest.mp4</code>, показанном выше на этой странице — 601 кадр, 25 с, 24 fps. Цифры читаются из JSON-отчётов, которые CLI только что выдал.',
      twoEngineH3: 'Архитектура из двух движков',
      twoEngineP:
        'Один кодовый базис, две точки входа. Оптимизатор берёт 3D-сцену и предлагает анимацию камеры; анализатор берёт получившийся MP4 и оценивает, насколько близко к предложению он приземлился.',
      metricGroupsH3: 'Семь групп метрик',
      metricGroupsP:
        'Каждая группа — это небольшой набор измерений, посчитанных по кадрам и агрегированных. Показанные вживую значения — из <code class="font-mono text-accent text-xs">forest_report.json</code>.',
      cards: [
        {
          label: 'terrain view',
          count: '5 метрик',
          desc: 'Смотрит ли камера на землю под полезным углом? Выравнивание по нормали поверхности через градиент глубины, штраф за касательный обзор, проверка окклюзии в ближнем диапазоне.',
        },
        {
          label: 'scene depth',
          count: '3 метрики',
          desc: 'Насколько кадр многослойный? K-means по гистограмме глубины для числа слоёв, энтропия распределения глубины, разделение переднего и заднего плана.',
        },
        {
          label: 'composition',
          count: '4 метрики',
          desc: 'Экономика кадра — сколько площади в пикселях несёт информацию против неба против пустого рельефа, где бегун сидит в сетке правила третей.',
        },
        {
          label: 'temporal',
          count: '4 метрики',
          desc: 'Темп по клипу. Новая визуальная информация в секунду (information_flow), тайминг нарративного раскрытия, когерентность между кадрами.',
        },
        {
          label: 'camera motion',
          count: '6 метрик',
          desc: 'Векторы скорости оптического потока по кадрам → джиттер, пропущенные/дёрганые кадры, плавность, стабильность. Считается через <code class="text-accent">camera_motion_analyzer</code>.',
        },
        {
          label: 'animation',
          count: '4 метрики',
          desc: 'Поведение всего клипа: длительность, средние px/сек, насколько стабильна эта скорость по таймлайну, оценка предполагаемой высоты камеры.',
        },
        {
          label: 'tiles quality',
          count: '4 метрики',
          desc: 'Чисто ли подтянулись спутниковые тайлы? Резкость через дисперсию Лапласа, детектор JPEG-блочности, среднечастотная текстура, доля кадров с артефактами загрузки. Ловит проблемы CDN, которые не всплывают ни в одной другой группе.',
        },
      ],
      barsH3: 'Метрики вживую · два реальных рендера',
      barsP:
        'Одни и те же одиннадцать метрик посчитаны для обоих клипов. 8-секундный короткий выигрывает по плавности и детальности текстуры; 25-секундный лесной вырывается вперёд по кадрированию, потому что у камеры больше времени устаканиться.',
      barsObserved:
        'Общее качество <strong class="text-accent">69.18 %</strong> у лесного клипа против <strong class="text-accent">70.27 %</strong> у короткого. Большой разрыв — в <code class="font-mono text-accent text-xs">texture_detail_score</code> — 0.79 против 0.47 — потому что длинный клип проводит больше кадров на тёмном лесе, где среднечастотная детальность проваливается. Это ровно тот тип находки, ради которого ARA и существует.',
      timelineH3: 'Таймлайн движения камеры · 188 сегментов',
      timelineP:
        '<code class="font-mono text-accent text-xs">camera_motion_analyzer</code> классифицировал каждый кадр в один из восьми режимов движения, кластеризуя векторы оптического потока по скользящему окну, затем слил соседей в сегменты. Таймлайн ниже — результат на 25-секундном лесном рендере: каждый цветной срез — один сегмент, наведите, чтобы увидеть тип, скорость и качество.',
      timelineObserved:
        'Всего 188 сегментов — <strong class="text-accent">86 rotate</strong>, <strong class="text-accent">33 static</strong>, 32 tilt-down, 25 pan-left, 6 pan-right, 6 tilt-up. Рендерер предпочитает вращение вокруг бегуна с периодическими статичными паузами; отсутствие <code class="font-mono text-accent text-xs">zoom_in / zoom_out</code> говорит мне, что камера держит фокусное расстояние, что упрощает SfM-реконструкцию ниже.',
      velocityH3: 'Скорость по сегментам · цвет по качеству движения',
      velocityP:
        'Скорость в px/кадр для каждого сегмента, цвет точки = оценка качества сегмента. Провалы к нулю — это статичные паузы; пики — короткие повороты вращения. Дисперсия — это то, что кормит <code class="font-mono text-accent text-xs">jerk_index = 3194</code> в отчёте о движении.',
      optimizerH3: 'Пред-рендерный оптимизатор · веса и поиск',
      optimizerP:
        'До старта рендера ARA может просэмплировать пространство поиска камеры и выбрать лучший путь. Шесть целей смешиваются по весу; поиск достаточно мал, чтобы гонять его на каждый маршрут на CPU.',
      weightsTitle: 'веса целей',
      weightsNote:
        'Из <code class="text-accent">core/config.py</code>. Деление на пять между видимостью / глубиной / композицией / кадрированием не даёт ни одной голове доминировать; плавность весит вполовину, потому что сглаживатель пути потом обрабатывает её детерминированно.',
      searchTitle: 'настройки поиска',
      searchNote:
        '32 × 16 × 3 = 1536 оценок точек обзора на якорный кадр. Достаточно дёшево, чтобы гонять на каждый ключевой кадр до того, как закоммититься на бюджет рендера.',
      cliH3: 'Поверхность CLI',
      cliP:
        'Шесть команд. Весь инструмент — это Typer-приложение с rich-таблицами для вывода в терминал и Pydantic-моделями для всего, что уходит в JSON.',
      headsH3: 'Что видят PyTorch-головы анализатора',
      headsP:
        'Внутри <code class="font-mono text-accent text-xs">video_analyzer.py</code> каждый кадр читается через OpenCV и прогоняется через три небольшие головы — глубина (DPT-Hybrid через Hugging Face <code class="font-mono text-accent text-xs">transformers</code>, на Apple MPS), детекция блобов по HSV-маске для маркера бегуна, плотность краёв Собеля для метрик текстуры/стабильности. Составной тензор уходит в покадровый оценщик, который агрегирует в семь групп выше. Ниже — те же головы, прогнанные на одном кадре из лесного клипа: полноразмерные промежуточные результаты из дебаг-сессии.',
      figures: [
        { label: 'входной кадр', sub: '464×536 · рендер @Vixwibot' },
        {
          label: 'глубина · DPT-Hybrid',
          sub: 'монокулярная глубина из RGB',
          caption: 'Красное — близко, синее — далеко. Гребень холма выделяется — кормит число слоёв <code class="text-accent">scene_depth</code> и разделение переднего/заднего плана.',
        },
        {
          label: 'маркер · HSV-блоб',
          sub: 'найден в (273, 162) ± 5 px',
          caption: 'Красная точка бегуна через HSV-маску + центроид крупнейшего блоба. Используется <code class="text-accent">traveler_visibility</code> и <code class="text-accent">traveler_framing_score</code> для расчёта смещения по правилу третей.',
        },
        {
          label: 'края · Собель',
          sub: 'текстура и стабильность',
          caption: 'Плотность краёв кормит <code class="text-accent">texture_detail_score</code> и индекс стабильности — слишком низко = размытая подгрузка тайлов, слишком высоко = перегруженная сцена.',
        },
      ],
      stackH3: 'Стек ARA',
      stackItems: [
        { term: 'torch + torchvision', desc: 'глубина, тензорные операции' },
        { term: 'timm', desc: 'бэкбон DPT' },
        { term: 'opencv-python', desc: 'видео I/O, оптический поток, SIFT/ORB/AKAZE' },
        { term: 'scipy', desc: 'сглаживание Catmull-Rom, статистика сигналов' },
        { term: 'pydantic + pydantic-settings', desc: 'типизированный конфиг, JSON в обе стороны' },
        { term: 'typer + rich', desc: 'CLI, таблицы в терминале' },
        { term: 'plotly', desc: 'графики таймлайна и скорости на этой странице' },
        { term: 'pyyaml', desc: 'переопределение дефолтов через конфиг-файлы' },
        { term: '~2 100 строк', desc: 'шесть модулей, отдельно от Go-Active' },
      ],
    },
    dashboard: {
      h2: 'Дашборд качества',
      p: 'Те же оценки, упакованные для Telegram. Каждый гейдж — это одна CV-голова; плитки — сырые измерения, которые их кормят.',
      alt: 'Дашборд качества Go-Active с гейджами и плитками метрик',
      caption:
        'Посчитано вживую по GPX Архыза. Низкие оценки вскрывают реальные проблемы — GPS-выборка этого похода была неравномерной (83 % разброс по разрывам времени). Продакшен отбраковывает треки ниже ~50, чтобы экономить бюджет рендера.',
    },
    smart: {
      h2: 'Умный рендеринг',
      p: 'Стадия рендера — это не тупая камера, летящая с постоянной скоростью вдоль трека. Три алгоритма формируют то, что в итоге видит зритель — все гоняются на этом же GPX Архыза.',
      rendersH3: 'Реальные продакшен-рендеры',
      rendersP:
        'Настоящие MP4 прямо из @Vixwibot. Рендерер подстраивает кадрирование и темп под рельеф — короткие пригородные петли играют одним способом, горные походы другим. Все 720×1280 вертикальные для Telegram. Горные и крымские плитки ниже заполняются по мере того, как разгребается очередь бота — каждый такой рендер занимает 1-3 часа.',
      queuedLabel: 'рендер в очереди',
      queuedNote: 'рендерится на @Vixwibot — заменится автоматически, когда будет готов',
      flythroughH3: 'Анимированный пролёт (интерактивный)',
      flythroughP:
        'Авто-вращающаяся 3D-сцена того же трека Архыза в форме Plotly — тяните, чтобы вращать вручную. Жёлтый ромб отмечает текущую позицию камеры. Продакшен-рендерер выше кодирует более длинную версию этого на спутниковые снимки через FFmpeg.',
      loopsH3: 'Детекция петель',
      loopsP:
        'Замыкание петли — это две точки на треке, пространственно близкие, но разделённые значительным расстоянием по пути — обычно маршрут, который возвращается в прежнее место. Рендерер использует их, чтобы спланировать монтаж «нарезки лучшего»: тугой облёт у каждого замыкания вместо проигрывания всей петли.',
      loopsObserved:
        'На этом походе алгоритм пометил <strong class="text-accent">3 замыкания</strong>: 120-метровый подход обратно к зоне лагеря в точках 168 ↔ 2736, тугой 24-метровый возврат на 486 ↔ 2862 и финальное 64-метровое замыкание всего маршрута на 204 ↔ 3024.',
      cameraH3: 'Эвристика поведения камеры',
      cameraP:
        'Скучный пролёт с постоянной скоростью тратит внимание впустую. Эвристика оценивает каждый сегмент на «интересность» — выводится из градиента высоты + темпа смены направления по скользящему окну — затем планирует множитель скорости виртуальной камеры из этого. Медленно на пиках и поворотах, быстро на монотонных участках, общая длительность рендера сохраняется.',
      cameraObserved:
        'План скорости идёт от <strong class="text-accent">0.47×</strong> (самое глубокое замедление на высочайших пиках) до <strong class="text-accent">1.6×</strong> (круиз по холмистым участкам). 60 именованных событий — ромбы на графике — помечены как достойные задержки.',
    },
    architecture: {
      h2: 'Архитектура',
      p1: 'Асинхронный конвейер FastAPI из пяти стадий за Telegram Mini App.',
      p2: 'У каждой стадии свой таймаут и бюджет памяти. Отбраковка на стадии 4 сохраняет бюджет рендера для треков, которые стоит смотреть.',
    },
    stackH2: 'Стек',
    links: {
      h2: 'Ссылки',
      p: 'В продакшене на <strong>@Vixwibot</strong> в Telegram — найдите его в своём клиенте или откройте Mini App напрямую на <a href="https://vixwi.com/" class="text-accent hover:underline">vixwi.com</a>. Загрузите свой GPX, чтобы увидеть свой рендер.',
      tg: 'Открыть @Vixwibot в Telegram',
      miniapp: 'vixwi.com — вход в Mini App',
    },
    builtBy: {
      scope: 'от и до: архитектура конвейера, CV-оценка, Telegram Mini App, деплой',
      status: 'Сольный проект · в продакшене с реальными пользователями',
    },
  },
};
