import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    // 앱인토스 샌드박스/토스앱 WebView 호환성을 위해 보수적 타깃을 명시.
    // Vite 8 + Rolldown 은 기본적으로 modern JS 를 그대로 내보내서 안드로이드
    // 시스템 WebView(Chrome 90 이하) 에서 SyntaxError 로 즉시 크래시 가능.
    // es2020 = Chrome 80+ / Safari 14+ 이상에서 안전.
    target: 'es2020',
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
