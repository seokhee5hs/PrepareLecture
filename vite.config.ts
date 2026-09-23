import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';
import {registerApiRoutes} from './server/apiMiddleware.ts';

export default defineConfig(() => {
  return {
    // GitHub project Pages serves this app below /PrepareLecture/.
    base: '/PrepareLecture/',
    plugins: [
      react(),
      tailwindcss(),
      {
        name: 'api-server-routes',
        configureServer(server) {
          registerApiRoutes(server);
        },
      },
    ],
    resolve: {
      alias: {
        '@': path.resolve(import.meta.dirname || '.', '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
