# site/ — каталог marketplace (React + Vite)

Вебдодаток каталогу: пошук, detail-view, command palette (⌘K), what's new, stats,
getting-started, темна/світла тема. Живе в окремій директорії, щоб не змішуватися
зі структурою плагінів (`plugins/`, `docs/`, `scripts/`). Реалізує `docs/SITE-SPEC.md`.

## Як це працює

**Статичний індекс + клієнтський пошук.** GitHub Pages роздає лише статику, тому:

1. `scripts/build-index.mjs` (zero-dep Node) на етапі білду обходить `plugins/**`,
   парсить маніфести + frontmatter + CHANGELOG і генерує в `public/`:
   `index.json`, `releases.json`, `stats.json`, `bodies/<id>.md`.
2. Браузер вантажить готовий `index.json` і шукає клієнтськи (MiniSearch, fuzzy).

**Реіндексація автоматична** — на кожен push у `main`, що зачіпає `plugins/**`,
workflow `pages.yml` перебудовує індекс і редеплоїть сайт. Вручну: `npm run build:index`.

Згенеровані файли (`public/*.json`, `public/bodies/`, `dist/`) — у `.gitignore`,
у репо не комітяться; вони існують лише як build-артефакт.

## Скрипти

| Команда | Що робить |
| --- | --- |
| `npm run dev` | Dev-сервер Vite на http://localhost:5173/ (спершу будує індекс). |
| `npm run build` | Type-check + `build:index` + `vite build` → `dist/`. |
| `npm run preview` | Локальний перегляд продакшн-збірки (перевірка base path). |
| `npm run build:index` | Тільки перебудувати `public/*.json` з `plugins/**`. |

## Стек

React 18 + TypeScript + Vite. Пошук — MiniSearch (за інтерфейсом `SearchProvider`,
щоб додати семантику пізніше). Роутинг — власний hash-router (deep-links працюють на
статиці). Markdown detail — `marked` + `DOMPurify` (sanitize), у lazy-чанку. Тексти
UI — в одному файлі `src/i18n/uk.ts` (не хардкодяться в компонентах).

## Хостинг (GitHub Pages)

Деплой автоматичний через `.github/workflows/pages.yml` (build → `dist/` → Pages).
PR перевіряється окремим workflow `.github/workflows/site-build.yml` (build без деплою).

**Одноразово:** Settings → Pages → Source: **GitHub Actions**.
URL: `https://burnjohn.github.io/dev-digest-ai-marketplace/`

Джерело дизайну: <https://claude.ai/design/p/f70daf28-7cac-42fb-a15f-9d364d9d2186>
