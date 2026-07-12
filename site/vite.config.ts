import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// GitHub Pages serves the site under /<repo>/, so assets and the fetched
// index.json must be prefixed with this base. Fetch code uses import.meta.env.BASE_URL,
// which resolves to this value in build and to '/' during `vite dev`.
export default defineConfig({
  base: '/dev-digest-ai-marketplace/',
  plugins: [react()],
});
