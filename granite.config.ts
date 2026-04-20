import { defineConfig } from '@apps-in-toss/web-framework/config';

export default defineConfig({
  appName: 'jumsim-meokgo',
  brand: {
    displayName: '점심먹Go',
    primaryColor: '#63B3ED',
    icon: 'public/icon-1024.png',
  },
  web: {
    host: 'localhost',
    port: 5173,
    commands: {
      dev: 'vite',
      build: 'vite build',
    },
  },
  permissions: [{ name: 'geolocation', access: 'access' }],
  outdir: 'dist',
});
