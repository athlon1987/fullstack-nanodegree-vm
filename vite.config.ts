import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// Content lives at the repo root in /content and is imported via import.meta.glob.
// curriculum.schema.json is imported directly. Both sit above /src, so allow fs
// access to the project root.
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: { fs: { allow: ['.'] } },
});
