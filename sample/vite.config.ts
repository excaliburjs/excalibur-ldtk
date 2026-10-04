import { defineConfig } from 'vite';
import path from 'node:path';

// Plain dev server for the sample pages - replaces the old webpack bundle + http-server
// combo the e2e suite used to boot. Vite serves the multi-page layout (sample.html,
// autotile.html, pureautotile.html) and their .ts entry points directly, no build step.
export default defineConfig({
  resolve: {
    alias: {
      // The samples import the plugin through this alias (mirrors webpack.config.js)
      '@excalibur-ldtk': path.resolve(__dirname, '../src/index.ts')
    }
  },
  server: {
    fs: {
      // src/ lives outside the vite root (sample/)
      allow: [path.resolve(__dirname, '..')]
    }
  }
});
