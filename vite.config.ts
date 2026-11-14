import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

// base './' permite publicar en GitHub Pages o en cualquier subcarpeta.
export default defineConfig({
  base: './',
  plugins: [react()],
  test: { environment: 'node' },
});
