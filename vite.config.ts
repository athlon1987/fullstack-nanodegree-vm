import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// Content lives at the repo root in /content and is imported via import.meta.glob.
// curriculum.schema.json is imported directly. Both sit above /src, so allow fs
// access to the project root.
//
// BASE_PATH lets the GitHub Pages workflow serve the app from a project subpath
// (e.g. /future-founder-app/). Defaults to '/' for local dev and root hosting.
export default defineConfig({
  base: process.env.BASE_PATH ?? '/',
  plugins: [react(), tailwindcss()],
  server: { fs: { allow: ['.'] } },
});
