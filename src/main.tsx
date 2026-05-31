import { TDSMobileAITProvider } from '@toss/tds-mobile-ait';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';

import App from './App';
import { ErrorBoundary } from './lib/ErrorBoundary';
import './index.css';

// 전역 unhandled 예외 — ErrorBoundary 가 못 잡는 비-React 영역의 에러도
// 사용자가 캡처할 수 있게 alert 으로 보여줌 (출시 전 디버깅용)
if (typeof window !== 'undefined') {
  window.addEventListener('error', (e) => {
    console.error('[jumsim-mukgo] window.error:', e.error || e.message);
  });
  window.addEventListener('unhandledrejection', (e) => {
    console.error('[jumsim-mukgo] unhandledrejection:', e.reason);
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <TDSMobileAITProvider>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </TDSMobileAITProvider>
    </ErrorBoundary>
  </StrictMode>,
);
