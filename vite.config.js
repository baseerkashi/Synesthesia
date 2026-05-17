import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    rollupOptions: {
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
