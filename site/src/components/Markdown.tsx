import { lazy, Suspense } from 'react';

const MarkdownInner = lazy(() => import('./MarkdownInner'));

export function Markdown({ bodyHtmlPath, fallbackText }: { bodyHtmlPath?: string; fallbackText?: string }) {
  return (
    <Suspense fallback={<p style={{ color: 'var(--text-faint)' }}>…</p>}>
      <MarkdownInner bodyHtmlPath={bodyHtmlPath} fallbackText={fallbackText} />
    </Suspense>
  );
}
