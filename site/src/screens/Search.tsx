import { useMemo } from 'react';
import type { CatalogData } from '../data/useCatalog';
import type { IndexEntry } from '../types';
import type { SearchProvider } from '../search/SearchProvider';
import { useNavigate, useRoute } from '../router/hashRouter';
import { parseSearchParams, routes, type SearchParams } from '../router/routes';
import { buildFacets } from '../search/facets';
import { computeResults } from '../search/useSearch';
import { Facets } from '../components/Facets';
import { Card } from '../components/Card';
import { t } from '../i18n';

interface Props {
  data: CatalogData;
  provider: SearchProvider;
  byId: Map<string, IndexEntry>;
}

export function Search({ data, provider, byId }: Props) {
  const nav = useNavigate();
  const route = useRoute();
  const params = parseSearchParams(route.query);

  const ranked = useMemo(
    () => computeResults(data.index.entries, byId, provider, params),
    [data.index.entries, byId, provider, route.query.toString()],
  );

  // Facet counts reflect everything matching the query + current facets except
  // the facet type being counted is not narrowed by itself — keep it simple: count over query results.
  const queryFiltered = useMemo(() => {
    const q = params.q.trim();
    const base = q
      ? provider.search(q).map((r) => byId.get(r.id)).filter((e): e is IndexEntry => !!e)
      : data.index.entries;
    return base;
  }, [params.q, data.index.entries, byId, provider]);
  const facets = useMemo(() => buildFacets(queryFiltered), [queryFiltered]);

  const toggle = (type: 'kind' | 'keyword' | 'author', value: string) => {
    const cur = new Set(params[type] as string[]);
    cur.has(value) ? cur.delete(value) : cur.add(value);
    nav(routes.search({ ...toParams(params), [type]: [...cur] }));
  };
  const clear = () => nav(routes.search({ q: params.q || undefined }));
  const setSort = (sort: SearchParams['sort']) => nav(routes.search({ ...toParams(params), sort }));

  const heading = params.q ? t.search.headingQuery(params.q) : t.search.headingAll;

  return (
    <main style={{ maxWidth: 1180, margin: '0 auto', padding: '26px 22px 80px', display: 'grid', gridTemplateColumns: '230px 1fr', gap: 28 }}>
      <Facets facets={facets} active={params} onToggle={toggle} onClear={clear} />

      <section>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h1 style={{ fontSize: 20, fontWeight: 600, margin: '0 0 3px' }}>{heading}</h1>
            <div style={{ fontSize: 13, color: 'var(--text-dim)' }}>{t.search.resultCount(ranked.length)}</div>
          </div>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--text-dim)' }}>
            {t.search.sortBy}
            <select
              value={params.sort}
              onChange={(e) => setSort(e.target.value as SearchParams['sort'])}
              style={{ height: 32, padding: '0 8px', background: 'var(--bg-elev)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text)', outline: 'none' }}
            >
              <option value="relevance">{t.search.sort.relevance}</option>
              <option value="name">{t.search.sort.name}</option>
              <option value="updated">{t.search.sort.updated}</option>
            </select>
          </label>
        </div>

        {ranked.length > 0 ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(320px,1fr))', gap: 14 }}>
            {ranked.map((r) => (
              <Card key={r.entry.id} entry={r.entry} byId={byId} terms={r.matchTerms} />
            ))}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '70px 20px', border: '1px dashed var(--border-strong)', borderRadius: 14 }}>
            <div style={{ fontSize: 30, marginBottom: 8 }}>🔍</div>
            <h3 style={{ margin: '0 0 6px' }}>{t.search.nothingTitle}</h3>
            <p style={{ color: 'var(--text-dim)', margin: '0 0 16px' }}>{t.search.nothingBody}</p>
            <button onClick={clear} style={{ height: 34, padding: '0 16px', background: 'var(--bg-elev)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text)', cursor: 'pointer' }}>
              {t.search.resetFilters}
            </button>
          </div>
        )}
      </section>
    </main>
  );
}

// Reconstruct SearchParams (dropping the internal fully-required shape) for route building.
function toParams(p: Required<SearchParams>): SearchParams {
  return {
    q: p.q || undefined,
    kind: p.kind, keyword: p.keyword, author: p.author, plugin: p.plugin,
    sort: p.sort,
  };
}
