import { Route, Routes } from 'react-router-dom';

import HomeScreen from './screens/HomeScreen';
import NearbyScreen from './screens/NearbyScreen';
import RouletteScreen from './screens/RouletteScreen';
import VoteCreateScreen from './screens/VoteCreateScreen';
import VoteSessionScreen from './screens/VoteSessionScreen';
import './App.css';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomeScreen />} />
      <Route path="/roulette" element={<RouletteScreen />} />
      <Route path="/nearby" element={<NearbyScreen />} />
      <Route path="/vote" element={<VoteCreateScreen />} />
      <Route path="/vote/:sessionId" element={<VoteSessionScreen />} />
    </Routes>
  );
}
