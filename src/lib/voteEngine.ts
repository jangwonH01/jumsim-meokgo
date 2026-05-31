/**
 * 점심먹Go v1.1 — 투표 종료 + 결선 + 룰렛 결정 엔진.
 *
 * 흐름:
 *   1차 투표 종료 (expiresAt 도달 또는 생성자 수동 종료)
 *     ├─ 단독 1위 → finalize(method='vote')
 *     └─ 동률 → 결선 시작 (status='runoff', runoffExpiresAt = now + 2분)
 *
 *   결선 투표 종료
 *     ├─ 단독 1위 → finalize(method='runoff')
 *     └─ 동률 → 룰렛 자동 실행 → finalize(method='roulette')
 *
 * 동시성:
 *   여러 클라이언트가 동시에 종료 시점에 진입 가능. Firestore 보안 규칙은
 *   status 전이만 제한하므로, 같은 결과를 동일하게 계산하면 race condition 무해
 *   (마지막 쓰기가 동일 데이터). 룰렛만 다를 수 있는데, 그것도 결정자가 누구든
 *   결과 1개만 저장되면 모두에게 동일 표시.
 */

export type VoteStatus = 'voting' | 'runoff' | 'completed';

export type VoteMethod = 'vote' | 'runoff' | 'roulette';

export interface VoteDoc {
  title: string;
  candidates: string[];
  counts: Record<string, number>;
  /** ISO ms (Date.now() 기준) — 1차 투표 마감 */
  expiresAt: number;
  /** 1차 투표 지속 시간(분). v1.0 데이터(필드 없음)는 30 으로 폴백. */
  durationMinutes?: number;
  status: VoteStatus;

  /** 결선 진입 시에만 존재 */
  runoffCandidates?: string[];
  runoffCounts?: Record<string, number>;
  runoffExpiresAt?: number;

  /** 종료 후에만 존재 */
  finalChoice?: string;
  finalMethod?: VoteMethod;
}

/** 결선 투표 지속 시간 (밀리초). 2분 — 빠른 결정. */
export const RUNOFF_DURATION_MS = 2 * 60 * 1000;

/** counts 객체에서 최다 득표 후보들을 반환 (동률이면 여러 개) */
export function findTopCandidates(
  counts: Record<string, number>,
  candidates: string[],
): { top: string[]; max: number } {
  if (candidates.length === 0) return { top: [], max: 0 };
  let max = -1;
  for (const c of candidates) {
    const v = counts[c] ?? 0;
    if (v > max) max = v;
  }
  const top = candidates.filter((c) => (counts[c] ?? 0) === max);
  return { top, max };
}

/** 동률 후보 중 하나를 무작위 선택 (룰렛 결정) */
export function pickRoulette(candidates: string[]): string {
  if (candidates.length === 0) throw new Error('empty candidates');
  return candidates[Math.floor(Math.random() * candidates.length)];
}

/**
 * 1차 투표 종료 시 다음 상태 계산.
 * - 단독 1위면 completed + method='vote'
 * - 동률이면 runoff 시작
 */
export function resolveAfterFirstRound(
  doc: VoteDoc,
  now: number,
): Partial<VoteDoc> {
  const { top, max } = findTopCandidates(doc.counts, doc.candidates);

  // 표가 하나도 없거나 (전부 0) 단독 1위면 그대로 확정.
  // 0표 동률은 사실상 결정 불가 → 룰렛으로 바로 확정 (재미 우선).
  if (max <= 0) {
    return {
      status: 'completed',
      finalChoice: pickRoulette(doc.candidates),
      finalMethod: 'roulette',
    };
  }

  if (top.length === 1) {
    return {
      status: 'completed',
      finalChoice: top[0],
      finalMethod: 'vote',
    };
  }

  // 동률 → 결선 시작
  return {
    status: 'runoff',
    runoffCandidates: top,
    runoffCounts: Object.fromEntries(top.map((c) => [c, 0])),
    runoffExpiresAt: now + RUNOFF_DURATION_MS,
  };
}

/**
 * 결선 종료 시 다음 상태 계산.
 * - 단독 1위면 method='runoff'
 * - 동률이면 룰렛 → method='roulette'
 */
export function resolveAfterRunoff(doc: VoteDoc): Partial<VoteDoc> {
  const candidates = doc.runoffCandidates ?? [];
  const counts = doc.runoffCounts ?? {};
  const { top, max } = findTopCandidates(counts, candidates);

  if (max <= 0 || top.length > 1) {
    // 결선도 동률(또는 아무도 투표 안 함) → 룰렛
    return {
      status: 'completed',
      finalChoice: pickRoulette(candidates.length > 0 ? candidates : doc.candidates),
      finalMethod: 'roulette',
    };
  }

  return {
    status: 'completed',
    finalChoice: top[0],
    finalMethod: 'runoff',
  };
}

/** D-time 표시용 — mm:ss */
export function formatRemaining(remainingMs: number): string {
  if (remainingMs <= 0) return '00:00';
  const total = Math.floor(remainingMs / 1000);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

/** 사용자가 선택할 수 있는 1차 투표 지속 시간 옵션 (분) */
export const DURATION_OPTIONS: { label: string; minutes: number }[] = [
  { label: '5분', minutes: 5 },
  { label: '15분', minutes: 15 },
  { label: '30분', minutes: 30 },
];
