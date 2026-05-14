// UI chrome strings. Page/project prose lives in home.ts and the per-showcase
// modules; this file is only navigation, layout labels and small fixed bits.

export const languages = { en: 'EN', ru: 'RU' } as const;
export const defaultLang = 'en';
export type Lang = keyof typeof languages;

export const ui = {
  en: {
    'nav.back': '← back',
    'showcase.section.problem': 'Problem',
    'showcase.section.approach': 'Approach',
    'showcase.section.architecture': 'Architecture',
    'showcase.section.metrics': 'Metrics',
    'showcase.section.stack': 'Stack',
    'showcase.section.links': 'Links',
    'pipeline.input': 'Input',
    'pipeline.output': 'Output',
    'pipeline.observed': 'Observed:',
    'builtby.label': 'Built by',
    'builtby.designedPrefix': 'Designed and built ',
    'builtby.designedBy': ' by ',
    'builtby.aiPrefix': 'AI-augmented coding via ',
    'builtby.aiSuffix': ' — pair-programmed at the keyboard. ',
    '404.title': 'Page not found.',
    '404.body': 'No page at this URL.',
    '404.back': '← back to home',
  },
  ru: {
    'nav.back': '← назад',
    'showcase.section.problem': 'Задача',
    'showcase.section.approach': 'Решение',
    'showcase.section.architecture': 'Архитектура',
    'showcase.section.metrics': 'Метрики',
    'showcase.section.stack': 'Стек',
    'showcase.section.links': 'Ссылки',
    'pipeline.input': 'Вход',
    'pipeline.output': 'Выход',
    'pipeline.observed': 'Наблюдение:',
    'builtby.label': 'Кто сделал',
    'builtby.designedPrefix': 'Спроектировал и собрал ',
    'builtby.designedBy': ' — ',
    'builtby.aiPrefix': 'Кодинг с ИИ через ',
    'builtby.aiSuffix': ', парное программирование за клавиатурой. ',
    '404.title': 'Страница не найдена.',
    '404.body': 'По этому адресу ничего нет.',
    '404.back': '← на главную',
  },
} as const;

export type UIKey = keyof (typeof ui)['en'];
