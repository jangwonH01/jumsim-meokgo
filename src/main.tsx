import { TDSMobileAITProvider } from '@toss/tds-mobile-ait';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';

import App from './App';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <TDSMobileAITProvider>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </TDSMobileAITProvider>
  </StrictMode>,
);
