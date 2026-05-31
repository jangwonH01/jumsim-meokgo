import { defineConfig } from '@apps-in-toss/web-framework/config';

export default defineConfig({
  // 사업자 등록된 "New project" 워크스페이스에 등록된 콘솔 appName 과 일치.
  // 콘솔과 다르면 인증서 발급 실패 + 검수 반려됨.
  appName: 'jumsim-mukgo',
  brand: {
    displayName: '점심먹Go',
    primaryColor: '#63B3ED',
    // 콘솔(New project 워크스페이스 → 점심먹Go → 앱 정보)에 업로드된 로고 URL.
    // 로컬 경로(`public/...`) 로 두면 검수 반려됨. 반드시 절대 URL 이어야 함.
    icon: 'https://static.toss.im/appsintoss/27775/3f539fb5-9fca-48e6-9a23-6b35ab392dd3.png',
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
