import { getCollection, type CollectionEntry } from 'astro:content';
import { ui, defaultLang, type Lang, type UIKey } from './ui';

export { defaultLang };
export type { Lang };

type Project = CollectionEntry<'projects'>;

export function getLangFromUrl(url: URL): Lang {
  const seg = url.pathname.split('/')[1];
  return seg === 'ru' ? 'ru' : defaultLang;
}

export function useTranslations(lang: Lang) {
  return function t(key: UIKey): string {
    return ui[lang][key] ?? ui[defaultLang][key];
  };
}

// Localize an in-site absolute path. English lives at the root, Russian under /ru.
export function localizePath(path: string, lang: Lang): string {
  const clean = path.replace(/^\/ru(?=\/|$)/, '') || '/';
  if (lang === defaultLang) return clean;
  return clean === '/' ? '/ru/' : `/ru${clean}`;
}

// Project content collection: English files live at the collection root,
// Russian translations under ru/. A missing Russian file falls back to English.
export function projectLang(entry: Project): Lang {
  return entry.id.startsWith('ru/') ? 'ru' : 'en';
}

export async function getProjects(lang: Lang): Promise<Project[]> {
  const all = await getCollection('projects');
  const en = all.filter((p) => projectLang(p) === 'en');
  if (lang === 'en') return en;
  const ruBySlug = new Map(
    all.filter((p) => projectLang(p) === 'ru').map((p) => [p.data.slug, p]),
  );
  return en.map((e) => ruBySlug.get(e.data.slug) ?? e);
}

export async function getProject(lang: Lang, slug: string): Promise<Project | undefined> {
  const projects = await getProjects(lang);
  return projects.find((p) => p.data.slug === slug);
}
