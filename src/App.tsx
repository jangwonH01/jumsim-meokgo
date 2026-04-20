import { lazy, Suspense } from 'react';
import { Route, Routes } from 'react-router-dom';

import HomeScreen from './screens/HomeScreen';
import './App.css';

const RouletteScreen = lazy(() => import('./screens/RouletteScreen'));
const NearbyScreen = lazy(() => import('./screens/NearbyScreen'));
const VoteCreateScreen = lazy(() => import('./screens/VoteCreateScreen'));
const VoteSessionScreen = lazy(() => import('./screens/VoteSessionScreen'));

function ScreenFallback() {
  return (
    <main className="screen">
      <div className="empty" aria-live="polite">불러오는 중…</div>
    </main>
  );
}

export default function App() {
  return (
    <Suspense fallback={<ScreenFallback />}>
      <Routes>
        <Route path="/" element={<HomeScreen />} />
        <Route path="/roulette" element={<RouletteScreen />} />
        <Route path="/nearby" element={<NearbyScreen />} />
        <Route path="/vote" element={<VoteCreateScreen />} />
        <Route path="/vote/:sessionId" element={<VoteSessionScreen />} />
      </Routes>
    </Suspense>
  );
}
