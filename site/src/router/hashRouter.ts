// Tiny hash router — no dependency. Hash routing survives static hosting
// (GitHub Pages) with no server rewrites, and deep links work on refresh.
import { useSyncExternalStore, useCallback } from 'react';

export interface Route {
  path: string; // e.g. "/", "/search", "/plugin/react-tools", "/artifact/skill:x/y"
  query: URLSearchParams;
}

function parse(): Route {
  const raw = window.location.hash.replace(/^#/, '') || '/';
  const qIdx = raw.indexOf('?');
  const path = qIdx >= 0 ? raw.slice(0, qIdx) : raw;
  const query = new URLSearchParams(qIdx >= 0 ? raw.slice(qIdx + 1) : '');
  return { path: decodeURI(path) || '/', query };
}

function subscribe(cb: () => void) {
  window.addEventListener('hashchange', cb);
  return () => window.removeEventListener('hashchange', cb);
}

// Cache the parsed route per hash string so getSnapshot returns a stable
// reference (useSyncExternalStore requires it) until the hash actually changes.
let lastHash: string | null = null;
let lastRoute: Route = parse();
function getSnapshot(): Route {
  if (window.location.hash !== lastHash) {
    lastHash = window.location.hash;
    lastRoute = parse();
  }
  return lastRoute;
}

export function useRoute(): Route {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}

export function navigate(hash: string) {
  const next = hash.startsWith('#') ? hash : '#' + hash;
  if (window.location.hash !== next) window.location.hash = next;
  else window.dispatchEvent(new HashChangeEvent('hashchange'));
}

export function useNavigate() {
  return useCallback((hash: string) => navigate(hash), []);
}
