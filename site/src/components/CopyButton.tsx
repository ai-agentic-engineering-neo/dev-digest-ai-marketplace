import { useState } from 'react';
import { useToast } from './Toast';
import { t } from '../i18n';

interface Props {
  text: string;
  label?: string;
  copiedLabel?: string;
  style?: React.CSSProperties;
}

export function CopyButton({ text, label = t.card.copy, copiedLabel = t.card.copied, style }: Props) {
  const [copied, setCopied] = useState(false);
  const toast = useToast();

  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // Fallback for insecure contexts.
      const ta = document.createElement('textarea');
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      ta.remove();
    }
    setCopied(true);
    toast();
    window.setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={onCopy}
      style={{
        height: 28, padding: '0 10px', background: 'var(--bg)', border: '1px solid var(--border)',
        borderRadius: 7, cursor: 'pointer', fontSize: 12, fontWeight: 500,
        color: copied ? 'var(--kind-skill)' : 'var(--text)', ...style,
      }}
    >
      {copied ? copiedLabel : label}
    </button>
  );
}
