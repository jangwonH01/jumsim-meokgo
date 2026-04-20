import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    chunkSizeWarningLimit: 1200,
    rolldownOptions: {
      output: {
        manualChunks(id: string) {
          if (id.includes('node_modules/firebase')) return 'firebase';
          if (
            id.includes('node_modules/@toss/tds-mobile') ||
            id.includes('node_modules/@toss/tds-mobile-ait')
          ) {
            return 'tds';
          }
          return undefined;
        },
      },
    },
  },
});
