// Lazy-loaded chunk: pulls in marked + DOMPurify only when a detail body renders.
import { useEffect, useState } from 'react';
import { marked } from 'marked';
import DOMPurify from 'dompurify';
import { fetchBody } from '../data/fetchBody';

interface Props {
  bodyHtmlPath?: string;
  fallbackText?: string;
}

export default function MarkdownInner({ bodyHtmlPath, fallbackText }: Props) {
  const [html, setHtml] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let alive = true;
    if (!bodyHtmlPath) { setFailed(true); return; }
    fetchBody(bodyHtmlPath)
      .then((md) => {
        if (!alive) return;
        const raw = marked.parse(md, { async: false }) as string;
        setHtml(DOMPurify.sanitize(raw));
      })
      .catch(() => alive && setFailed(true));
    return () => { alive = false; };
  }, [bodyHtmlPath]);

  if (failed || (!bodyHtmlPath && fallbackText)) {
    return (
      <>
        {(fallbackText ?? '').split('\n').filter(Boolean).map((p, i) => (
          <p key={i} style={{ margin: '0 0 12px', color: 'var(--text-dim)', lineHeight: 1.65 }}>{p}</p>
        ))}
      </>
    );
  }
  if (html == null) return <p style={{ color: 'var(--text-faint)' }}>…</p>;
  return <div className="md" dangerouslySetInnerHTML={{ __html: html }} />;
}
