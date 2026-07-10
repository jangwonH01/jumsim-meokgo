/**
 * 배너 광고 컴포넌트. 결과·목록 하단에 배치.
 * 토스 외/구버전에선 높이 0으로 빈 공간 없이 사라짐.
 * 정책: 컨테이너 width 100% 고정, 내부 비움, SDK가 'ad' 표기·디자인 관리.
 */
import { useEffect, useRef } from 'react';

import { useTossBanner } from './useTossBanner';

export function BannerAd({ adGroupId }: { adGroupId: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const { isInitialized, attachBanner } = useTossBanner();

  useEffect(() => {
    if (!isInitialized || !ref.current) return;
    const attached = attachBanner(adGroupId, ref.current, {
      theme: 'auto',
      tone: 'blackAndWhite',
      variant: 'card',
    });
    return () => attached?.destroy();
  }, [isInitialized, adGroupId, attachBanner]);

  return (
    <div
      ref={ref}
      style={{ width: '100%', minHeight: isInitialized ? 96 : 0 }}
      aria-hidden={!isInitialized}
    />
  );
}
