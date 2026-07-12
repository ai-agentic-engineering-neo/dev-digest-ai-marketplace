// All user-facing UI copy lives here — no hardcoded strings in components.
// Adding a locale = add a sibling file with the same shape and switch in index.ts.

import type { Kind } from '../types';

export const uk = {
  locale: 'uk-UA',

  brand: { name: 'Каталог', tag: 'dev-digest' },

  header: {
    searchPlaceholder: 'Пошук по каталогу…',
    github: 'GitHub ↗',
    toggleTheme: 'Перемкнути тему',
  },

  home: {
    eyebrow: 'Marketplace плагінів · скілів · агентів',
    title1: 'Знайди потрібний артефакт',
    title2: 'і постав його одним copy-paste',
    subtitle:
      'Клієнтський fuzzy-пошук по описах, frontmatter і тілу markdown. Без бекенду — уся статика зібрана в CI.',
    heroPlaceholder: 'Опиши, що треба — напр. "скіл для рефакторингу React"',
    whatsNew: 'Що нового',
    wholeFeed: 'Уся стрічка →',
    browseByType: 'Переглянути за типом',
  },

  empty: {
    title: 'Каталог порожній',
    body: 'Ще немає жодного плагіна. Додай перший — і він одразу зʼявиться тут після білду індексу в CI.',
    howTo: 'Як почати',
    contributing: 'CONTRIBUTING.md',
  },

  search: {
    filters: 'Фільтри',
    reset: 'Скинути',
    resetFilters: 'Скинути фільтри',
    typeLabel: 'Тип',
    keywords: 'Keywords',
    author: 'Автор',
    sortBy: 'Сортувати',
    sort: {
      relevance: 'За релевантністю',
      name: 'За назвою',
      updated: 'Нещодавно оновлені',
    },
    headingAll: 'Усі артефакти',
    headingQuery: (q: string) => `Результати за «${q}»`,
    resultCount: (n: number) => `${n} ${plural(n, 'результат', 'результати', 'результатів')}`,
    nothingTitle: 'Нічого не знайшли',
    nothingBody: 'Спробуйте скинути фільтри або змінити запит.',
    open: 'Відкрити',
  },

  card: {
    copy: 'Copy install',
    copied: 'Скопійовано ✓',
  },

  plugin: {
    back: '← Назад',
    composition: 'Склад плагіна',
    dependencies: 'Залежності',
    readme: 'README',
    changelog: 'Changelog',
    viewOnGithub: 'View on GitHub ↗',
    updatedAt: (d: string) => `оновлено ${d}`,
  },

  artifact: {
    catalog: 'Каталог',
    toolsPermissions: 'Tools / permissions',
    docs: 'Документація',
  },

  whatsNew: {
    title: 'Що нового',
    backHome: '← На головну',
  },

  gettingStarted: {
    backHome: '← На головну',
    title: 'Як підключити marketplace',
    subtitle: 'Три кроки. Спершу додай marketplace як джерело, потім став окремі плагіни.',
    steps: [
      {
        title: 'Додай marketplace як джерело',
        desc: 'Один раз на машину — реєструє каталог у Claude Code.',
        cmd: '/plugin marketplace add burnjohn/dev-digest-ai-marketplace',
      },
      {
        title: 'Встанови плагін',
        desc: 'Постав будь-який плагін із каталогу за його ім’ям.',
        cmd: '/plugin install <name>@dev-digest-ai-marketplace',
      },
      {
        title: 'Оновлюй за потреби',
        desc: 'Онови список джерел або конкретний встановлений плагін.',
        cmd: '/plugin marketplace update',
      },
    ],
    note: {
      strong: 'marketplace update vs plugin update.',
      body: ' Перше оновлює список джерел (звідки брати плагіни), друге — код конкретного встановленого плагіна.',
    },
  },

  palette: {
    placeholder: 'Перейти до артефакту…',
    empty: 'Нічого не знайдено',
    esc: 'ESC',
  },

  toast: { copied: 'Скопійовано в буфер' },

  footer: {
    generatedAt: (d: string) => `Індекс зібрано: ${d}`,
    repo: 'Репозиторій',
  },

  kindLabel: {
    plugin: 'плагіни',
    skill: 'скіли',
    agent: 'агенти',
    command: 'команди',
    hook: 'hooks',
    mcp: 'MCP',
  } as Record<Kind, string>,

  kindSingular: {
    plugin: 'плагін',
    skill: 'скіл',
    agent: 'агент',
    command: 'команда',
    hook: 'hook',
    mcp: 'MCP',
  } as Record<Kind, string>,
};

function plural(n: number, one: string, few: string, many: string): string {
  const m10 = n % 10;
  const m100 = n % 100;
  if (m10 === 1 && m100 !== 11) return one;
  if (m10 >= 2 && m10 <= 4 && (m100 < 10 || m100 >= 20)) return few;
  return many;
}

export type Messages = typeof uk;
