/**
 * 토스 배너 광고 훅 — SDK 초기화 + 부착.
 * 토스 외 환경/구버전에선 isSupported가 false라 조용히 비활성(빈 화면 방지).
 */
import { TossAds, type TossAdsAttachBannerOptions } from '@apps-in-toss/web-framework';
import { useCallback, useEffect, useState } from 'react';

export function useTossBanner() {
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    if (isInitialized) return;
    try {
      if (!TossAds?.initialize?.isSupported?.()) return;
    } catch {
      return;
    }
    TossAds.initialize({
      callbacks: {
        onInitialized: () => setIsInitialized(true),
        onInitializationFailed: (e) => console.warn('[점심먹GO] TossAds init 실패:', e),
      },
    });
  }, [isInitialized]);

  const attachBanner = useCallback(
    (adGroupId: string, el: HTMLElement, options?: TossAdsAttachBannerOptions) => {
      if (!isInitialized) return undefined;
      try {
        return TossAds.attachBanner(adGroupId, el, options);
      } catch (e) {
        console.warn('[점심먹GO] 배너 부착 실패:', e);
        return undefined;
      }
    },
    [isInitialized],
  );

  return { isInitialized, attachBanner };
}
