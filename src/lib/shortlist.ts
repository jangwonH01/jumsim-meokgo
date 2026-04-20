// 오늘의 후보 — Roulette / Nearby / Vote 세 기능이 공유하는 단기 후보 리스트.
//
// localStorage에 저장하되, 같은 탭에서 구독자가 변경을 즉시 감지할 수 있도록
// CustomEvent로도 브로드캐스트한다(Storage 이벤트는 "같은 탭에서" 발생하지 않음).

const LS_KEY = 'jumsim-meokgo.shortlist.v1';
const CHANGE_EVENT = 'jumsim-meokgo:shortlist-change';
const MAX = 10;

export interface ShortlistEntry {
  /** 후보 표시명 (메뉴 또는 식당 이름) */
  label: string;
  /** 후보 출처 — 통계/디버깅용 */
  source: 'roulette' | 'nearby' | 'manual';
  /** 근처식당에서 담은 경우 카카오 장소 URL */
  placeUrl?: string;
}

function read(): ShortlistEntry[] {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (x): x is ShortlistEntry =>
        !!x &&
        typeof x === 'object' &&
        typeof (x as ShortlistEntry).label === 'string' &&
        typeof (x as ShortlistEntry).source === 'string',
    );
  } catch {
    return [];
  }
}

function write(entries: ShortlistEntry[]): void {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(entries));
  } catch {
    // Storage full or disabled — ignore.
  }
  window.dispatchEvent(new CustomEvent<ShortlistEntry[]>(CHANGE_EVENT, { detail: entries }));
}

export function getShortlist(): ShortlistEntry[] {
  return read();
}

/**
 * 후보를 담는다. label이 이미 있으면 중복 추가하지 않고, 꽉 찼으면(MAX) 가장 오래된 항목을 밀어낸다.
 * @returns 추가된 경우 true, 중복이어서 스킵된 경우 false
 */
export function addToShortlist(entry: ShortlistEntry): boolean {
  const list = read();
  if (list.some((e) => e.label === entry.label)) return false;
  const next = [...list, entry];
  while (next.length > MAX) next.shift();
  write(next);
  return true;
}

export function removeFromShortlist(label: string): void {
  const list = read();
  write(list.filter((e) => e.label !== label));
}

export function clearShortlist(): void {
  write([]);
}

export function isInShortlist(label: string): boolean {
  return read().some((e) => e.label === label);
}

/**
 * shortlist 변경을 구독한다. localStorage 직접 수정(다른 탭)과 동일 탭 변경 모두 감지.
 * @returns 구독 해제 함수
 */
export function subscribeShortlist(cb: (entries: ShortlistEntry[]) => void): () => void {
  const onCustom = (e: Event) => {
    const ce = e as CustomEvent<ShortlistEntry[]>;
    cb(ce.detail ?? read());
  };
  const onStorage = (e: StorageEvent) => {
    if (e.key === LS_KEY) cb(read());
  };
  window.addEventListener(CHANGE_EVENT, onCustom);
  window.addEventListener('storage', onStorage);
  return () => {
    window.removeEventListener(CHANGE_EVENT, onCustom);
    window.removeEventListener('storage', onStorage);
  };
}

export const SHORTLIST_MAX = MAX;
