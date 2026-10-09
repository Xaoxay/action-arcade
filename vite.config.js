import { defineConfig } from 'vite';

export default defineConfig({
  base: './', // important for Capacitor Android/iOS assets resolution
  build: {
    outDir: 'dist'
  }
});
