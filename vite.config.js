import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        app: resolve(__dirname, 'app.html')
      },
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/three')) return 'three';
          if (id.includes('render/render2D')) return 'visualizers-2d';
          if (id.includes('render/render3D')) return 'visualizers-3d';
          if (id.includes('render/glowAtlas')) return 'render-utils';
        },
      },
    },
    chunkSizeWarningLimit: 600,
  },
});
