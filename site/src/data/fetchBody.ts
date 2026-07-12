const BASE = import.meta.env.BASE_URL;
const cache = new Map<string, string>();

/** Lazy-fetch a raw markdown body written by the indexer to public/bodies/. */
export async function fetchBody(bodyHtmlPath: string): Promise<string> {
  const cached = cache.get(bodyHtmlPath);
  if (cached !== undefined) return cached;
  const res = await fetch(`${BASE}${bodyHtmlPath}`);
  if (!res.ok) throw new Error(`body ${res.status}`);
  const text = await res.text();
  cache.set(bodyHtmlPath, text);
  return text;
}
