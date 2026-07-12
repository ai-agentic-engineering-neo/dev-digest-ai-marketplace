# SITE-SPEC — специфікація вебдодатка каталогу (GitHub Pages)

> Специфікація UI-додатка, який публікується на GitHub Pages і дає команді
> шукати та переглядати вміст цього marketplace (плагіни, скіли, агенти,
> команди, hooks, MCP). Документ — вхід для дизайну й подальшої імплементації.
>
> Статус: **draft v1**. Дата: 2026-07-12.
> Джерела правил каталогу — [`PLUGIN-GUIDELINES.md`](./PLUGIN-GUIDELINES.md),
> [`temp/MARKETPLACE-RESEARCH.md`](./temp/MARKETPLACE-RESEARCH.md).

---

## 1. Мета й межі

**Мета.** Дати команді єдину точку входу, щоб *знайти* потрібний артефакт
(«мені треба скіл для X»), *зрозуміти* що він робить і *поставити* його одним
copy-paste. Каталог росте — UI має лишатись корисним і на 3, і на 50 плагінах.

**Аудиторія.** Внутрішня інженерна команда (dev-first). Очікують швидкий
пошук з клавіатури, точні описи, робочі install-команди.

**Не-цілі v1.** Рейтинги/лайки, коментарі, лічильники завантажень,
авторизація, будь-яка персистенція користувача на сервері — усе це вимагає
бекенду й тут свідомо не робиться. Редагування вмісту через UI — теж ні
(джерело істини лишається git + PR-флоу).

---

## 2. Ключове обмеження й наслідки

GitHub Pages роздає **лише статику — жодного рантайм-бекенду**. Це визначає
архітектуру:

1. **Пошук — клієнтський.** Індекс збирається в CI під час білду й кладеться
   поруч як статичний JSON. У браузері працює `fuzzy + keyword` (MiniSearch або
   Fuse.js). Жодних запитів до сервера в рантаймі.
2. **«Розумний» пошук ≠ LLM у рантаймі.** API-ключ не можна класти на публічну
   статику. v1 — детермінований fuzzy-пошук по описах, frontmatter і тілу
   markdown. Архітектура індексу одразу лишає місце під *precomputed embeddings*
   (див. §12), щоб семантику додати без переписування фронтенду.
3. **Джерело істини — репозиторій.** UI нічого не пише. Усе, що він показує,
   походить з файлів у `plugins/**` та `marketplace.json`, зібраних білдом.

---

## 3. Архітектура (загальна)

```
                    GitHub Actions (on push to main / PR preview)
  repo files  ──▶   scripts/build-index.mjs  ──▶  site/public/index.json
  (plugins/**,       (парсер manifest+frontmatter+md,                   │
   marketplace.json,  агрегатор релізів, граф залежностей)              │
   docs/**)                                                            ▼
                                              Vite build (React) ──▶ GitHub Pages
                                                    │
                        браузер ◀── статичні: index.json + бандл + markdown-тіла
                        (MiniSearch у пам'яті, hash-routing, рендер MD)
```

- **Індексатор** (`scripts/build-index.mjs`) — Node, лише вбудовані модулі
  (тон задає наявний `validate-marketplace.mjs`). Обходить `plugins/**`,
  читає manifest-и та frontmatter, збирає `index.json` (+ похідні: `graph.json`,
  `releases.json`). Запускається і локально (`npm run build:index`), і в CI.
- **Фронтенд** — Vite + React, hash-routing (`#/...`) заради сумісності зі
  статичним хостингом без rewrite-правил.
- **CI/CD** — GitHub Actions: на кожен push у `main` збирає індекс і сайт,
  деплоїть на Pages. На PR — build-check (без деплою або в окреме preview-середовище).

---

## 4. Модель даних (схема індексу)

Один запис індексу = один шукабельний артефакт. Тип задається полем `kind`.

### 4.1 Загальний запис `IndexEntry`

| Поле | Тип | Опис |
| --- | --- | --- |
| `id` | string | стабільний унікальний ключ, напр. `plugin:react-tools` або `skill:react-tools/refactor` |
| `kind` | enum | `plugin` \| `skill` \| `agent` \| `command` \| `hook` \| `mcp` |
| `name` | string | технічне ім'я (kebab-case) |
| `displayName` | string? | людський підпис для UI (з manifest `displayName`, інакше `name`) |
| `description` | string | короткий опис (manifest/ frontmatter) |
| `plugin` | string | ім'я плагіна-контейнера (для `plugin` = сам себе) |
| `keywords` | string[] | теги для фасетів і пошуку |
| `bodyText` | string | очищене від markdown-розмітки тіло README/SKILL.md — для повнотекстового пошуку |
| `bodyHtmlPath` | string? | шлях до відрендереного/сирого MD для detail-view (lazy-load) |
| `sourcePath` | string | шлях у репо (для «View on GitHub») |
| `githubUrl` | string | повний лінк на файл/теку в GitHub |

### 4.2 Розширення для `kind: plugin`

| Поле | Тип | Опис |
| --- | --- | --- |
| `version` | string | SemVer з `plugin.json` |
| `author` | {name, email?} | автор |
| `installCommand` | string | `/plugin install <name>@dev-digest-ai-marketplace` |
| `components` | {skills, agents, commands, hooks, mcp: number} | лічильники для картки |
| `dependencies` | string[] | namespaced deps (напр. `engineering-paved-path:react-best-practices`) |
| `compatibility` | string? | стисло з `COMPATIBILITY.md` (напр. мін. версія Claude Code) |
| `changelog` | {version, date?, summary}[] | розпарсений `CHANGELOG.md` |
| `sourceType` | enum | `path` \| `github` \| `url` \| `git-subdir` \| `npm` (з `marketplace.json`) |

### 4.3 Розширення для `kind: skill|agent|command`

| Поле | Тип | Опис |
| --- | --- | --- |
| `tools` | string[]? | заявлені tools/permissions з frontmatter |
| `invocation` | string? | як викликати (напр. `/refactor`, `@react-analyzer`) |
| `model` | string? | якщо задано у frontmatter агента |

### 4.4 Похідні файли

- `graph.json` — вузли (плагіни) + ребра (залежності) для фічі «Граф залежностей».
- `releases.json` — злиті changelog-и всіх плагінів, відсортовані за версією/датою, для «What's new» і JSON/RSS feed.
- `stats.json` (або поле в `index.json`) — агреговані лічильники для stats-плитки.
- `collections.json` — **курований вручну** конфіг наборів (не автогенерується).

> **Порожній стан.** Зараз `plugins: []`. Індексатор має коректно віддавати
> порожній `index.json`, а UI — показувати empty-state (див. §7.1), не падати.

---

## 5. Функціонал (повний обсяг)

Зведення того, що входить у v1 (усі запропоновані фічі).

| # | Фіча | Пріоритет |
| --- | --- | --- |
| 1 | Пошук по всьому вмісту, результати картками | P0 |
| 2 | Copy install на картці | P0 |
| 3 | Detail-view з deep-link | P0 |
| 4 | Browse + фасети (тип, keyword, author, plugin) | P1 |
| 5 | Command palette (Cmd/Ctrl+K) | P1 |
| 6 | What's new (стрічка релізів) | P1 |
| 7 | Stats-плитка | P1 |
| 8 | Онбординг «як підключити marketplace» | P1 |
| 9 | Граф залежностей | P2 |
| 10 | Collections (куровані набори) | P2 |
| 11 | Compatibility / health badges | P2 |
| 12 | JSON / RSS feed нових плагінів | P2 |

Пріоритети — для послідовності імплементації/дизайну, не для скорочення обсягу.

---

## 6. Інформаційна архітектура й маршрути

Hash-routing (deep-linkable, працює на статиці):

| Маршрут | Екран |
| --- | --- |
| `#/` | Головна: пошук + stats + what's new + вхід у browse |
| `#/search?q=&kind=&keyword=&author=` | Результати пошуку/фасетів (стан у URL — shareable) |
| `#/plugin/<name>` | Detail плагіна |
| `#/artifact/<id>` | Detail скіла/агента/команди/hook/mcp |
| `#/collections`, `#/collections/<id>` | Набори |
| `#/graph` | Граф залежностей |
| `#/whats-new` | Повна стрічка релізів |
| `#/getting-started` | Онбординг |

Глобальні елементи на всіх екранах: топбар (лого + глобальний search-input +
кнопка Cmd+K + перемикач теми), футер (лінк на репо, версія каталогу, лінк на feed).

---

## 7. Екрани та UX (для дизайну)

### 7.1 Головна (`#/`)

Секції зверху вниз:
1. **Hero + пошук.** Великий інпут з плейсхолдером на кшталт
   «Опиши, що треба — напр. "скіл для рефакторингу React"». Під ним — швидкі
   chips найпопулярніших keyword-ів.
2. **Stats-плитка** (фіча 7): N плагінів · N скілів · N агентів · N команд · N MCP.
   Числа клікабельні → ведуть у browse з відповідним фасетом.
3. **What's new** (фіча 6): 3–5 останніх релізів картками (плагін, версія, дата, summary).
4. **Browse-вхід**: кнопки/таби за `kind` + лінк на Collections і Graph.

**Empty-state (нуль плагінів):** дружнє повідомлення + CTA на
`#/getting-started` і `CONTRIBUTING.md` («Каталог порожній — додай перший плагін»).

### 7.2 Результати пошуку (`#/search`)

- Ліворуч (desktop) / у drawer (mobile) — **панель фасетів** (фіча 4):
  `kind` (мультивибір), `keyword`, `author`, `plugin`. Стан фасетів і запит —
  у query-параметрах URL (shareable, back/forward працює).
- Праворуч — **сітка карток**. Сортування: relevance (деф.), name, останнє оновлення.
- Порожній результат: «Нічого не знайшли» + пропозиції (скинути фасети,
  найближчі за keyword).

**Картка артефакту (ключовий компонент):**
```
┌─────────────────────────────────────────────┐
│ [kind-badge]  displayName            v1.2.0  │
│ ─────────────────────────────────────────── │
│ Короткий опис у 2 рядки з ellipsis…           │
│                                               │
│ #keyword #keyword #keyword                    │
│ ─────────────────────────────────────────── │
│ plugin · author        [Copy install] [Open] │
└─────────────────────────────────────────────┘
```
- `kind-badge` — колірний бейдж типу (plugin/skill/agent/command/hook/mcp).
- **[Copy install]** (фіча 2) — на плагіні копіює install-команду; на
  під-артефакті копіює команду встановлення батьківського плагіна + показує
  invocation (напр. `/refactor`). Стан «Скопійовано ✓» на 2 c.
- **[Open]** → detail-view.
- Матч підсвічується (highlight) у назві/описі.

### 7.3 Detail плагіна (`#/plugin/<name>`)

- **Хедер:** displayName, version-badge, kind, author, compatibility-badge
  (фіча 11), кнопки **Copy install** та **View on GitHub**.
- **Склад плагіна:** списки skills/agents/commands/hooks/MCP — кожен елемент
  клікабельний у свій `#/artifact/<id>`.
- **Залежності** (фіча 9, локально): чіпи deps з лінками; кнопка «Показати в графі».
- **README:** відрендерений markdown (lazy-load тіла).
- **Changelog:** акордеон з `releases.json` по цьому плагіну.

### 7.4 Detail під-артефакту (`#/artifact/<id>`)

Хедер (тип, ім'я, invocation, tools/permissions як чіпи), breadcrumb до
плагіна, кнопка Copy install батьківського плагіна, відрендерене тіло SKILL.md/agent.md.

### 7.5 Command palette (фіча 5)

Cmd/Ctrl+K — модалка з тим самим індексом: миттєвий інкрементальний пошук,
навігація стрілками, Enter → detail. Дає dev-first «швидкий стрибок» будь-звідки.

### 7.6 Collections (фіча 10)

Куровані набори з `collections.json` (title, опис, список `id` артефактів).
Список наборів → сторінка набору з картками. Приклад: «Starter pack для React».

### 7.7 Граф залежностей (`#/graph`, фіча 9)

Візуалізація `graph.json` (вузли-плагіни, ребра-залежності). Клік на вузол →
detail плагіна. Легенда, зум/пан. Порожній/single-node стан — коректний.

### 7.8 What's new (`#/whats-new`, фіча 6)

Повна хронологія релізів із `releases.json`. Лінк «Subscribe» → JSON/RSS feed (фіча 12).

### 7.9 Getting started (`#/getting-started`, фіча 8)

Рендер кроків підключення з copy-кнопками (узгоджено з `README.md`):
`/plugin marketplace add burnjohn/dev-digest-ai-marketplace`,
`/plugin install <name>@dev-digest-ai-marketplace`, різниця
`marketplace update` vs `plugin update`.

---

## 8. Поведінка пошуку (v1: fuzzy + keyword)

- **Рушій:** MiniSearch (або Fuse.js) у пам'яті, індекс будується з `index.json`
  один раз при завантаженні.
- **Шукані поля з вагами:** `displayName`/`name` (найвища) → `keywords` →
  `description` → `bodyText` (найнижча).
- **Можливості:** префіксний матч, fuzzy (1–2 помилки), highlight збігів,
  boost точних збігів імені.
- **Фасети** застосовуються як пост-фільтр над результатами (AND між різними
  фасетами, OR усередині одного).
- **Продуктивність:** цільовий розмір `index.json` — тримати ≲ кількох сотень KB
  gzip; `bodyText` за потреби скорочувати. Тіла для рендеру — окремо, lazy.
- **Стан у URL:** `q`, `kind`, `keyword`, `author` — щоб результат був shareable.

---

## 9. Технічний стек

| Шар | Вибір | Причина |
| --- | --- | --- |
| Фронтенд | **React + Vite** | компонентний, звичний команді, легко рости |
| Мова | TypeScript | типізований `IndexEntry`, менше помилок на рості схеми |
| Пошук | MiniSearch / Fuse.js | клієнтський fuzzy, малий бандл |
| Роутинг | hash-router (light) | статичний хостинг без rewrite |
| Рендер MD | `markdown-it` / `marked` + sanitize | detail-view README/SKILL.md |
| Граф | лёгка graph-віз (напр. `@xyflow`/`vis-network` — уточнити на дизайні) | фіча 9 |
| Індексатор | Node, вбудовані модулі | у стилі `validate-marketplace.mjs`, без залежностей |
| CI/CD | GitHub Actions → Pages | наявний патерн репо |

> Точні бібліотеки MD-рендеру та графа фіксуємо на етапі дизайну; вимога —
> мінімальний бандл і безпечний рендер (sanitize untrusted markdown).

---

## 10. Білд і CI/CD

1. `npm run build:index` → генерує `index.json`, `graph.json`, `releases.json`,
   `stats.json` у `site/public/`.
2. `npm run build` (Vite) → статика в `site/dist/`.
3. GitHub Actions:
   - **PR:** прогнати індексатор + `vite build` як check (плюс наявний
     `validate-marketplace.mjs`). Опційно — deploy preview.
   - **push to `main`:** повний білд + deploy на GitHub Pages.
4. Base path Vite виставити під `https://<owner>.github.io/dev-digest-ai-marketplace/`.

Індексатор і сайт живуть у власній піддиректорії (напр. `site/`), щоб не
змішуватися зі структурою плагінів. Реліз-cadence сайту незалежний від плагінів
(узгоджено з принципом репо про окремі життєві цикли).

---

## 11. Нефункціональні вимоги

- **Продуктивність:** статика + один JSON; ціль — швидкий LCP, пошук без відчутної
  затримки на сотнях записів. Lazy-load важких тіл і графа.
- **Доступність:** повна навігація з клавіатури (особливо Cmd+K і фасети),
  видимий focus, ARIA для карток/модалок, контраст під темну й світлу теми.
- **Адаптивність:** desktop (сітка + бокова панель фасетів) і mobile (фасети в drawer).
- **Приватність:** без трекерів і зовнішніх запитів у рантаймі за замовчуванням.
- **Стійкість:** порожній каталог, плагін без README/keywords, зламаний
  frontmatter — деградують м'яко (індексатор пропускає з warning, UI не падає).
- **i18n:** інтерфейсні тексти — українською (як наявні docs); контент
  артефактів показуємо as-is.

---

## 12. Майбутнє: семантичний пошук (embeddings)

Готуємо архітектуру, не імплементуємо у v1:
- У CI (де секрети дозволені) генерувати вектори для `description`+`bodyText`
  кожного запису, зберігати як окремий статичний `embeddings.json`.
- У браузері — косинусна близькість запиту (запит теж треба векторизувати; для
  повністю offline-варіанту — легка модель у WASM або гібрид: keyword-префільтр +
  векторний re-rank).
- Абстрагувати пошук за інтерфейсом `SearchProvider`, щоб `KeywordProvider`
  (v1) і майбутній `SemanticProvider` були взаємозамінні без змін в UI.

---

## 13. Відкриті питання (зафіксувати на дизайні)

1. Візуальна мова: чи спиратись на існуючий дизайн-систем команди, чи власний мінімалізм?
2. Бібліотека графа (баланс бандл/можливості).
3. Формат `collections.json` і хто його курує (окремий CODEOWNERS?).
4. PR-preview деплой — потрібен чи достатньо build-check?
5. Чи виносити сайт в окремий репо на майбутнє, чи лишати піддиректорією `site/`.

---

## 14. Критерії приймання v1

- Пошук по імені/опису/keywords/тілу повертає релевантні картки з highlight.
- Copy install копіює коректну команду для плагіна.
- Detail-view відкривається за deep-link і рендерить README/SKILL.md.
- Фасети фільтрують і зберігаються в URL.
- Cmd+K відкриває палітру й веде на артефакт.
- Головна показує stats і what's new; порожній каталог дає коректний empty-state.
- Collections, граф залежностей, compatibility-badges і JSON/RSS feed присутні й наповнюються з індексу.
- Сайт збирається в CI й деплоїться на GitHub Pages; індексатор коректно
  відпрацьовує на порожньому `plugins/`.
