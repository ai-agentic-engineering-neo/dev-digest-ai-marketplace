# Дослідження: як правильно створити marketplace-репозиторій для Claude Code

> Мета документа — зафіксувати вимоги й гарні практики з першоджерел, щоб **після** готовності репозиторію пройтися чек-лістом і перевірити, що все зроблено правильно.
>
> Дата дослідження: 2026-07-12. Джерела — офіційна документація Claude Code + публічні best-practices статті (див. розділ «Джерела»).
>
> Примітка: окремих інструкцій під назвою «CodeCoda» в мережі немає — CodeCoda це провайдер курсу; авторитетне джерело правил = офіційна документація Claude Code, на яку спирається урок L08.

---

## 1. Що це за репозиторій

Marketplace для Claude Code — звичайний git-репозиторій з одним обов'язковим файлом-каталогом `.claude-plugin/marketplace.json`. Публікувати в npm або окремо хостити не треба: Claude Code читає каталог напряму з GitHub/GitLab/git-хоста. Кожен плагін лежить у власній піддиректорії зі своїм `plugin.json`.

## 2. Офіційна структура репозиторію

```
my-marketplace/
├── .claude-plugin/
│   └── marketplace.json          # каталог (ОБОВ'ЯЗКОВО, у корені репо)
├── plugins/
│   ├── my-plugin/
│   │   ├── .claude-plugin/
│   │   │   └── plugin.json        # маніфест плагіна (ОБОВ'ЯЗКОВО)
│   │   ├── commands/              # slash-команди (опційно)
│   │   ├── agents/                # агенти (опційно)
│   │   ├── skills/                # skills (опційно)
│   │   │   └── skill-name/
│   │   │       └── SKILL.md
│   │   ├── hooks/                 # обробники подій (опційно)
│   │   ├── .mcp.json              # конфіг MCP-серверів (опційно)
│   │   ├── README.md
│   │   ├── CHANGELOG.md
│   │   └── COMPATIBILITY.md
│   └── another-plugin/
│       └── ...
├── CODEOWNERS
├── CONTRIBUTING.md
└── README.md
```

## 3. Обов'язкові поля

### `marketplace.json`
- `name` — string, kebab-case, без пробілів. **Публічний**: користувачі бачать його при `/plugin install foo@your-marketplace`. Один marketplace на ім'я в користувача (додання другого з тим же ім'ям заміщує перший).
- `owner` — object; поле `name` обов'язкове (`email` опційно).
- `plugins` — масив; кожен запис мінімально має `name` + `source`.

Мінімальний приклад:
```json
{
  "$schema": "https://json.schemastore.org/claude-code-marketplace.json",
  "name": "team-ai-marketplace",
  "owner": { "name": "AI Engineering", "email": "team@org.com" },
  "plugins": [
    { "name": "my-plugin", "source": "./plugins/my-plugin", "description": "...", "category": "development" }
  ]
}
```
> `$schema` дає автокомпліт/валідацію в редакторі; Claude Code ігнорує це поле під час завантаження.

### `plugin.json` (`plugins/<name>/.claude-plugin/plugin.json`)
- Мінімум: `name`, `version`, `description`.
- `author` — object (`name` обов'язково, `email` опційно).
- `repository` — **string URL**, НЕ об'єкт (`{"type":"git",...}` спричинить помилку валідації).

## 4. Нюанси та пастки (з офіційних docs)

- **`version` керує оновленнями.** Якщо задано — апдейт прийде лише коли ти зміниш це поле (бампай на кожному релізі). Якщо `version` пропущено в git-хостингу — **кожен commit рахується новою версією**. Для точного пінінгу — `sha` (повний 40-символьний commit).
- **`name` фактично незмінний.** Користувачі мають плагін під цим slug; перейменування ламає інсталяцію (`plugin-not-found`).
  - Для підпису в UI — `displayName` (можна пробіли/регістр; ≥ 2.1.143).
  - Для реального перейменування/видалення — мапа `renames` (≥ 2.1.193).
- **Relative paths** резолвляться відносно **кореня репо** (директорії з `.claude-plugin/`), а не самої `.claude-plugin/`. Мають починатися з `./`. Не використовувати `../` за межі кореня.
  - ⚠️ Відносні шляхи **не працюють при роздачі через прямий URL** на `marketplace.json` (качається лише сам файл). Для URL-дистрибуції — `github`/`git url`/`npm` source.
  - Опційно `metadata.pluginRoot: "./plugins"` дозволяє писати `"source": "formatter"` замість `"./plugins/formatter"`.
- **Marketplace source ≠ plugin source** — пінуються незалежно; плагін може жити в іншому репо.
  - Marketplace source: підтримує `ref` (branch/tag), **не** `sha`.
  - Plugin source: підтримує і `ref`, і `sha`. Якщо задані обидва — `sha` є ефективним піном.
- **Типи source плагіна:** relative path, `github` (`repo`,`ref?`,`sha?`), `url` (`url`,`ref?`,`sha?`), `git-subdir` (`url`,`path`,`ref?`,`sha?` — sparse clone для монорепо), `npm` (`package`,`version?`,`registry?`).
- **Плагіни копіюються в кеш** (`~/.claude/plugins/cache`) — не можна посилатися на файли поза текою плагіна через `../`. Для скриптів/хуків/MCP — `${CLAUDE_PLUGIN_ROOT}`; для стану, що переживає оновлення — `${CLAUDE_PLUGIN_DATA}`; для спільних файлів — symlink.
- **Reserved names** (не для сторонніх): `claude-code-marketplace`, `claude-code-plugins`, `claude-plugins-official`, `claude-plugins-community`, `agent-skills`, `anthropic-*` тощо, і будь-що, що імітує офіційні джерела. Інакше маркетплейс перестане завантажуватись.
- **`strict` (default `true`)** — `plugin.json` є джерелом істини для компонентів. З `strict: false` запис у marketplace описує все сам, окремий `plugin.json` не потрібен.
- **Без secrets і absolute paths** у маніфестах. Manifest може називати secret slot, але не містити credential.

## 5. Команди валідації та локального тесту

```bash
# перевірити структуру/JSON
claude plugin validate ./plugins/my-plugin
claude plugin validate .

# прогнати локально без встановлення в user scope
claude --plugin-dir ./plugins/my-plugin

# додати marketplace з локальної теки для тесту
/plugin marketplace add ./path/to/marketplace

# опублікований потік
/plugin marketplace add owner/repo
/plugin install plugin-name@marketplace-name
/plugin marketplace update      # оновити КАТАЛОГ (список релізів)
/plugin update plugin@marketplace # оновити ВСТАНОВЛЕНИЙ плагін
```
> Schema validation доводить, що маніфест правильної форми. Evals перевіряють поведінку. Одне не замінює інше.

## 6. Гарні практики організаційного marketplace (з мережі)

Головне джерело — розбір AutoScout24 (16 плагінів, кілька команд):

- **Окремий репозиторій від продукту** — різні користувачі, owners і release cadence.
- **Дворівневе управління:** «автономія на оновлення, governance на додавання». Будь-яка команда відкриває PR до чужого плагіна (рев'ює команда-власник); додання нового плагіна погоджує platform team.
- **CODEOWNERS на кожен плагін** + catch-all за замовчуванням:
  ```
  * @org/platform-engineering
  /plugins/jira/ @org/jira-team
  ```
  Ownership = відповідальність за рев'ю/підтримку, не ексклюзив.
- **SemVer:** patch — багфікси, minor — нові фічі, major — breaking changes.
- **Розчепити bump версії від реєстру:** команда міняє `version`/`description` свого плагіна **не чіпаючи** `marketplace.json`. Правку каталогу вимагає лише *додання нового* плагіна. Це фундамент governance-моделі.
- **Обов'язковий CI-лінтер** (required-check на кожному PR): перевіряє структуру плагіна, консистентність реєстру, конвенції skills, записи CODEOWNERS і version bumps. PR не мержиться без зеленого лінтера, незалежно від апрувів.
- **`CONTRIBUTING.md` з самого початку:** naming, обов'язкова структура тек, поля `plugin.json`, правила dependencies, заборона secrets/absolute paths, обов'язкові перевірки перед release, правила CHANGELOG, хто рев'ює й хто релізить.
- **Спочатку дослідження, потім стандартизація** — не переінженерити до появи реальних skills.
- **Пінити версії, не автооновлювати** зовнішні skills; окремо оновлювати каталог і встановлений плагін.
- **Портативність:** `SKILL.md` (Markdown + YAML frontmatter) тримати сумісним із кількома агентами.
- **Dependency graph:** shared skills/agents мають одне canonical source; version constraints зафіксовані; skills/agents із залежних плагінів використовуються з namespace (`engineering-paved-path:react-best-practices`, а не bare `react-best-practices`).

---

## 7. Чек-ліст для перевірки ГОТОВОГО репозиторію

### Структура
- [ ] `.claude-plugin/marketplace.json` існує в корені репо
- [ ] Кожен плагін у `plugins/<name>/` має власний `.claude-plugin/plugin.json`
- [ ] Є `README.md`, `CONTRIBUTING.md`, `CODEOWNERS`
- [ ] Немає особистих shortcuts/експериментів/локальних правил, що просочилися з домашньої `.claude/`

### `marketplace.json`
- [ ] `name` — kebab-case, без пробілів, НЕ з reserved-списку
- [ ] `owner.name` заданий
- [ ] Кожен запис `plugins[]` має `name` + `source`
- [ ] Відносні `source` починаються з `./` і не виходять за корінь
- [ ] (Якщо URL-дистрибуція) source не відносний, а `github`/`git`/`npm`

### `plugin.json` (для кожного плагіна)
- [ ] `name`, `version`, `description` присутні
- [ ] `name` збігається зі slug у marketplace та не мінявся після публікації
- [ ] `repository` — рядок-URL, а не об'єкт
- [ ] `version` бампнутий на кожному релізі (SemVer)
- [ ] Немає secrets і absolute paths; скрипти через `${CLAUDE_PLUGIN_ROOT}`
- [ ] Немає посилань `../` за межі теки плагіна
- [ ] Skill/agent references — з plugin namespace, де є залежності

### Governance
- [ ] `CODEOWNERS`: catch-all + per-plugin шляхи
- [ ] `CONTRIBUTING.md` описує структуру, перевірки, review і release process
- [ ] CI-лінтер як required-check (структура, реєстр, CODEOWNERS, version bumps)
- [ ] Marketplace живе в окремому репо від продукту

### Валідація/поведінка
- [ ] `claude plugin validate .` — зелений
- [ ] `claude plugin validate ./plugins/<name>` — зелений для кожного
- [ ] Локальний прогін `--plugin-dir` працює
- [ ] Evals: активація на релевантному сценарії, namespace без missing-skill warnings, відсутність активації на нерелевантному запиті
- [ ] Встановлення в інший наявний project проходить; installer показує dependency graph до підтвердження
- [ ] У trace видно правильну version плагіна й resolved versions залежностей
- [ ] `marketplace update` vs `plugin update` розділені й документовані

---

## 8. Джерела

- [Create and distribute a plugin marketplace — Claude Code Docs](https://code.claude.com/docs/en/plugin-marketplaces) — первинне джерело правил
- [anthropics/claude-plugins-official](https://github.com/anthropics/claude-plugins-official) — офіційний приклад каталогу
- [ivan-magda/claude-code-plugin-template](https://github.com/ivan-magda/claude-code-plugin-template) — готовий GitHub-шаблон
- [AutoScout24 — Designing a Coding Agent Skills Marketplace](https://tech.autoscout24.com/blog/posts/designing-a-coding-agent-skills-marketplace/) — organizational best practices
- [Build Your Own Claude Code Marketplace (dev.to / nagell)](https://dev.to/nagell/build-your-own-claude-code-marketplace-scaffold-structure-and-auto-updates-4n3f) — практичний walkthrough
- [Dominic Böttger — Private Claude Code Plugin Marketplace](https://dominic-boettger.com/blog/claude-code-private-plugin-marketplace-guide/) — приватний тимовий marketplace
- [JFrog — Agent Skills are the New Packages of AI](https://jfrog.com/blog/agent-skills-new-ai-packages/) — безпека/версіонування
- [Chris Ayers — Agent Skills, Plugins and Marketplace: The Complete Guide](https://chris-ayers.com/posts/agent-skills-plugins-marketplace/) — повний гайд
