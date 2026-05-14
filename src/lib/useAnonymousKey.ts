// 비게임 미니앱 유저 식별키 훅
//
// AppsInToss 비게임 출시 가이드는 사용자 식별 수단을 요구해요. `getAnonymousKey`
// 는 토스 로그인 없이도 미니앱별 고유 hash 를 받아오는 권장 API예요.
//
// - 샌드박스: mock hash 반환 (호출 자체는 성공)
// - SDK 미지원: undefined → null 처리
// - 'INVALID_CATEGORY': 비게임 카테고리 아님 → 콘솔에서 카테고리 확인 필요
// - 'ERROR' / 예외: null 처리 (식별키 없어도 앱은 동작해야 함)

import { getAnonymousKey } from '@apps-in-toss/web-framework';
import { useEffect, useState } from 'react';

interface AnonymousKeyState {
  key: string | null;
  loading: boolean;
}

export function useAnonymousKey(): AnonymousKeyState {
  const [state, setState] = useState<AnonymousKeyState>({
    key: null,
    loading: true,
  });

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const result = await getAnonymousKey();
        if (cancelled) return;

        if (result && typeof result === 'object' && result.type === 'HASH') {
          setState({ key: result.hash, loading: false });
          return;
        }

        if (typeof result === 'string') {
          console.warn('[jumsim-meokgo] getAnonymousKey returned:', result);
        }
        setState({ key: null, loading: false });
      } catch (e) {
        console.warn('[jumsim-meokgo] getAnonymousKey threw:', e);
        if (!cancelled) setState({ key: null, loading: false });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return state;
}
