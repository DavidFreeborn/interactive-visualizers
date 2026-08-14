import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// Standalone Swarm Dynamics bundle, deployed to
// https://www.davidpeterwallisfreeborn.com/fun/swarm-dynamics/
// (copy dist/ into the website repo's public/fun/swarm-dynamics/).
export default defineConfig(({ command }) => ({
  base: command === 'build' ? '/fun/swarm-dynamics/' : '/',
  plugins: [react()],
  resolve: {
    alias: {
      '@viz/core-math': path.resolve(__dirname, '../../packages/core-math/src'),
      '@viz/core-ui': path.resolve(__dirname, '../../packages/core-ui/src'),
    },
  },
}));
