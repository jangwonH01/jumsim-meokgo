import { share as aitShare } from '@apps-in-toss/web-framework';

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
