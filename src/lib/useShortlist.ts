import { useEffect, useState } from 'react';

import { getShortlist, subscribeShortlist, type ShortlistEntry } from './shortlist';

/**
 * Shortlist를 구독하는 React 훅.
 * 동일 탭 내 변경도 즉시 반영되도록 CustomEvent를 구독한다.
 */
export function useShortlist(): ShortlistEntry[] {
  const [items, setItems] = useState<ShortlistEntry[]>(() => getShortlist());
  useEffect(() => subscribeShortlist(setItems), []);
  return items;
}
