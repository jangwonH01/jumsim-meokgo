import { getTossShareLink, share as aitShare } from '@apps-in-toss/web-framework';

/**
 * 토스 미니앱 딥링크 형태의 공유 링크를 만들어요.
 *
 * `getTossShareLink` 는 `intoss://<appName>/path` 형태의 미니앱 경로를 받아
 * 토스가 외부에서도 인식할 수 있는 공유 가능한 URL 로 변환해줘요.
 *
 * 출시 전(샌드박스) 에는 정식 `intoss://` 스킴이 비활성이라 함수 호출이
 * 실패할 수 있어요. 그 경우 호출자에서 fallback 링크를 쓰도록 throw 합니다.
 */
export async function buildAppShareLink(path: string): Promise<string> {
  const normalized = path.startsWith('/') ? path : `/${path}`;
  const internal = `intoss://jumsim-meokgo${normalized}`;
  return getTossShareLink(internal);
}

/**
 * Share a message via the native share sheet when running in the Toss
 * WebView. Falls back to `navigator.share` and finally clipboard copy
 * when previewing outside Toss (dev / regular browser).
 */
export async function shareMessage(message: string): Promise<'shared' | 'copied'> {
  try {
    await aitShare({ message });
    return 'shared';
  } catch {
    /* fall through */
  }
  if (typeof navigator !== 'undefined' && 'share' in navigator) {
    try {
      await (navigator as Navigator & { share: (d: { text: string }) => Promise<void> }).share({
        text: message,
      });
      return 'shared';
    } catch {
      /* fall through */
    }
  }
  if (typeof navigator !== 'undefined' && navigator.clipboard) {
    await navigator.clipboard.writeText(message);
    return 'copied';
  }
  throw new Error('SHARE_UNSUPPORTED');
}
