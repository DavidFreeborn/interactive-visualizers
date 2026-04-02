import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  base: process.env.GITHUB_ACTIONS ? '/interactive-visualizers/' : '/',
  plugins: [react()],
  resolve: {
    alias: {
      '@viz/core-math': path.resolve(__dirname, '../../packages/core-math/src'),
      '@viz/core-ui': path.resolve(__dirname, '../../packages/core-ui/src'),
      '@viz/signaling': path.resolve(__dirname, '../../packages/viz-signaling/src'),
      '@viz/manifold': path.resolve(__dirname, '../../packages/viz-manifold/src'),
      '@viz/polarization': path.resolve(__dirname, '../../packages/viz-polarization/src'),
      '@viz/zollman': path.resolve(__dirname, '../../packages/viz-zollman/src'),
    },
  },
});
