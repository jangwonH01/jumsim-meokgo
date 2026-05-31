import { Button } from '@toss/tds-mobile';
import { doc, increment, onSnapshot, updateDoc } from 'firebase/firestore';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import { db, isFirebaseConfigured } from '../lib/firebase';
import { buildAppShareLink, shareMessage } from '../lib/share';
import {
  formatRemaining,
  resolveAfterFirstRound,
  resolveAfterRunoff,
  type VoteDoc,
} from '../lib/voteEngine';

const VOTED_LS = (id: string) => `jumsim-meokgo.voted.${id}`;
const VOTED_RUNOFF_LS = (id: string) => `jumsim-meokgo.voted-runoff.${id}`;

export default function VoteSessionScreen() {
  const nav = useNavigate();
  const { sessionId = '' } = useParams();
  const [data, setData] = useState<VoteDoc | null>(null);
  const [error, setError] = useState<string | null>(() =>
    isFirebaseConfigured
      ? null
      : 'Firebase 웹앱 설정이 필요해요. .env.local에 VITE_FIREBASE_* 값을 채워주세요.',
  );
  const [voted, setVoted] = useState<string | null>(() =>
    typeof window === 'undefined' ? null : localStorage.getItem(VOTED_LS(sessionId)),
  );
  const [votedRunoff, setVotedRunoff] = useState<string | null>(() =>
    typeof window === 'undefined' ? null : localStorage.getItem(VOTED_RUNOFF_LS(sessionId)),
  );
  const [sharing, setSharing] = useState(false);
  const [flash, setFlash] = useState<string | null>(null);
  const [now, setNow] = useState<number>(Date.now());

  // 종료 처리 중복 방지 (한 클라이언트가 동일 전환 여러 번 시도하는 걸 막음).
  // 동시성: 여러 클라이언트가 동시에 종료 트리거해도 같은 결과를 계산하므로 안전.
  const closingRef = useRef(false);
  const runoffClosingRef = useRef(false);

  // Firestore 실시간 구독
  useEffect(() => {
    if (!isFirebaseConfigured) return;
    if (!sessionId) return;
    const ref = doc(db, 'votes', sessionId);
    const unsub = onSnapshot(
      ref,
      (snap) => {
        if (!snap.exists()) {
          setError('투표 세션을 찾을 수 없어요.');
          return;
        }
        const raw = snap.data() as Partial<VoteDoc>;
        // v1.0 데이터 호환: status/expiresAt 없으면 기본값 채워서 사용.
        // (v1.0 으로 만든 투표는 자동 종료 없이 영원히 voting 상태 — 의도된 동작)
        setData({
          title: raw.title ?? '점심 투표',
          candidates: raw.candidates ?? [],
          counts: raw.counts ?? {},
          status: raw.status ?? 'voting',
          expiresAt: raw.expiresAt ?? Number.POSITIVE_INFINITY,
          durationMinutes: raw.durationMinutes,
          runoffCandidates: raw.runoffCandidates,
          runoffCounts: raw.runoffCounts,
          runoffExpiresAt: raw.runoffExpiresAt,
          finalChoice: raw.finalChoice,
          finalMethod: raw.finalMethod,
        });
      },
      (e) => setError(`불러오기 실패: ${e.message}`),
    );
    return unsub;
  }, [sessionId]);

  // 매초 카운트다운 갱신
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  // 종료 시점 자동 트리거 — 가장 먼저 시점 넘은 클라이언트가 상태 전환 시도.
  useEffect(() => {
    if (!data) return;
    if (!sessionId) return;

    // 1차 종료
    if (
      data.status === 'voting' &&
      now >= data.expiresAt &&
      !closingRef.current
    ) {
      closingRef.current = true;
      const next = resolveAfterFirstRound(data, now);
      updateDoc(doc(db, 'votes', sessionId), next).catch((e) => {
        // 다른 클라이언트가 먼저 처리했거나 권한 문제 — 무해
        console.warn('[jumsim-mukgo] auto-close first round failed:', e);
        closingRef.current = false;
      });
      return;
    }

    // 결선 종료
    if (
      data.status === 'runoff' &&
      data.runoffExpiresAt != null &&
      now >= data.runoffExpiresAt &&
      !runoffClosingRef.current
    ) {
      runoffClosingRef.current = true;
      const next = resolveAfterRunoff(data);
      updateDoc(doc(db, 'votes', sessionId), next).catch((e) => {
        console.warn('[jumsim-mukgo] auto-close runoff failed:', e);
        runoffClosingRef.current = false;
      });
    }
  }, [data, now, sessionId]);

  // 결과 화면으로 이동
  useEffect(() => {
    if (data?.status === 'completed') {
      // 같은 화면 안에서 결과를 표시할 수도 있지만, 별도 화면 분리가 UX 명확.
      nav(`/vote/${sessionId}/result`, { replace: true });
    }
  }, [data?.status, sessionId, nav]);

  // 1차 투표 / 결선 카운트다운
  const remaining = useMemo(() => {
    if (!data) return 0;
    if (data.status === 'voting') return Math.max(0, data.expiresAt - now);
    if (data.status === 'runoff' && data.runoffExpiresAt != null) {
      return Math.max(0, data.runoffExpiresAt - now);
    }
    return 0;
  }, [data, now]);

  const total = useMemo(() => {
    if (!data) return 0;
    if (data.status === 'runoff') {
      return Object.values(data.runoffCounts ?? {}).reduce((a, b) => a + b, 0);
    }
    return Object.values(data.counts).reduce((a, b) => a + b, 0);
  }, [data]);

  // 1차 투표
  const vote = async (candidate: string) => {
    if (!data || data.status !== 'voting' || voted) return;
    try {
      await updateDoc(doc(db, 'votes', sessionId), {
        [`counts.${candidate}`]: increment(1),
      });
      localStorage.setItem(VOTED_LS(sessionId), candidate);
      setVoted(candidate);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setError(`투표 실패: ${msg}`);
    }
  };

  // 결선 투표
  const voteRunoff = async (candidate: string) => {
    if (!data || data.status !== 'runoff' || votedRunoff) return;
    try {
      await updateDoc(doc(db, 'votes', sessionId), {
        [`runoffCounts.${candidate}`]: increment(1),
      });
      localStorage.setItem(VOTED_RUNOFF_LS(sessionId), candidate);
      setVotedRunoff(candidate);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setError(`결선 투표 실패: ${msg}`);
    }
  };

  // 수동 종료 — 누구나(생성자 확정 기능은 v1.2)
  const closeNow = useCallback(async () => {
    if (!data) return;
    if (data.status === 'voting') {
      const next = resolveAfterFirstRound(data, Date.now());
      await updateDoc(doc(db, 'votes', sessionId), next);
    } else if (data.status === 'runoff') {
      const next = resolveAfterRunoff(data);
      await updateDoc(doc(db, 'votes', sessionId), next);
    }
  }, [data, sessionId]);

  // 공유
  const share = async () => {
    setSharing(true);
    try {
      let shareUrl: string;
      try {
        shareUrl = await buildAppShareLink(`/vote/${sessionId}`);
      } catch {
        shareUrl = `${window.location.origin}/vote/${sessionId}`;
      }
      const result = await shareMessage(
        `[점심먹Go] ${data?.title ?? '점심 투표'}\n${shareUrl}`,
      );
      setFlash(result === 'copied' ? '링크를 복사했어요' : '공유 완료');
      setTimeout(() => setFlash(null), 2000);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setFlash(`공유 실패: ${msg}`);
      setTimeout(() => setFlash(null), 2500);
    } finally {
      setSharing(false);
    }
  };

  if (error) {
    return (
      <main className="screen">
        <div className="screen-header">
          <button
            type="button"
            className="back"
            onClick={() => nav('/')}
            aria-label="홈으로"
          >
            ←
          </button>
          <h1>팀 투표</h1>
        </div>
        <div className="banner" role="alert">
          {error}
        </div>
      </main>
    );
  }

  if (!data) {
    return (
      <main className="screen">
        <div className="empty" aria-live="polite">불러오는 중…</div>
      </main>
    );
  }

  // status === 'completed' 인 경우 useEffect 에서 nav로 빠지지만,
  // 그 사이 잠깐 깜빡거림 방지로 빈 화면 반환.
  if (data.status === 'completed') {
    return (
      <main className="screen">
        <div className="empty" aria-live="polite">결과 확인 중…</div>
      </main>
    );
  }

  const isRunoff = data.status === 'runoff';
  const activeCandidates = isRunoff
    ? data.runoffCandidates ?? []
    : data.candidates;
  const activeCounts = isRunoff
    ? data.runoffCounts ?? {}
    : data.counts;
  const activeVoted = isRunoff ? votedRunoff : voted;

  return (
    <main className="screen">
      <div className="screen-header">
        <button
          type="button"
          className="back"
          onClick={() => nav('/')}
          aria-label="홈으로"
        >
          ←
        </button>
        <h1>{data.title}</h1>
      </div>

      {/* 결선 모드 안내 배너 */}
      {isRunoff && (
        <div className="runoff-banner" role="status">
          <span className="runoff-emoji" aria-hidden="true">⚖️</span>
          <div style={{ flex: 1 }}>
            <p className="runoff-title">동률 발생! 결선 투표 진행 중</p>
            <p className="runoff-sub">
              {(data.runoffCandidates ?? []).length}개 후보로 다시 투표해주세요
            </p>
          </div>
        </div>
      )}

      {/* 카운트다운 + 상태 */}
      <div className="countdown-row">
        <div className="countdown-block">
          <p className="countdown-label">
            {isRunoff ? '결선 마감까지' : '투표 마감까지'}
          </p>
          <p className="countdown-value">{formatRemaining(remaining)}</p>
        </div>
        <div className="countdown-block">
          <p className="countdown-label">전체 투표</p>
          <p className="countdown-value">{total}표</p>
        </div>
      </div>

      <p className="screen-subtitle">
        {activeVoted
          ? `'${activeVoted}'에 투표했어요`
          : '후보를 하나 골라주세요'}
      </p>

      {flash && <div className="banner">{flash}</div>}

      <div className="stack" role="radiogroup" aria-label="투표 후보">
        {activeCandidates.map((c) => {
          const count = activeCounts[c] ?? 0;
          const pct = total === 0 ? 0 : Math.round((count / total) * 100);
          const handler = isRunoff ? voteRunoff : vote;
          return (
            <button
              key={c}
              type="button"
              role="radio"
              aria-checked={activeVoted === c}
              className={`vote-option ${activeVoted === c ? 'selected' : ''}`}
              onClick={() => handler(c)}
              disabled={Boolean(activeVoted)}
            >
              <span className="vote-bar" style={{ width: `${pct}%` }} />
              <span className="vote-label">{c}</span>
              <span className="vote-count">
                {count}표 · {pct}%
              </span>
            </button>
          );
        })}
      </div>

      <div style={{ marginTop: 20, display: 'flex', flexDirection: 'column', gap: 10 }}>
        <Button
          display="full"
          size="large"
          variant="weak"
          color="primary"
          onClick={share}
          loading={sharing}
        >
          🔗 투표 링크 공유하기
        </Button>
        <button
          type="button"
          className="close-now-btn"
          onClick={closeNow}
        >
          ⚡ 지금 결정 (즉시 종료)
        </button>
      </div>
    </main>
  );
}
