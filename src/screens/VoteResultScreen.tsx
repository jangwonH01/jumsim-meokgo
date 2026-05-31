import { Button } from '@toss/tds-mobile';
import { doc, onSnapshot } from 'firebase/firestore';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import { db, isFirebaseConfigured } from '../lib/firebase';
import { buildAppShareLink, shareMessage } from '../lib/share';
import type { VoteDoc, VoteMethod } from '../lib/voteEngine';

/**
 * v1.1 결과 확정 화면.
 * - 1차 / 결선 / 룰렛 각각 약간 다른 연출
 * - 룰렛은 짧은 애니메이션 (1.5초) 으로 재미 강조
 */
export default function VoteResultScreen() {
  const nav = useNavigate();
  const { sessionId = '' } = useParams();
  const [data, setData] = useState<VoteDoc | null>(null);
  const [error, setError] = useState<string | null>(() =>
    isFirebaseConfigured ? null : 'Firebase 설정이 필요해요.',
  );
  const [sharing, setSharing] = useState(false);
  const [flash, setFlash] = useState<string | null>(null);

  // 룰렛 애니메이션 (결과 발표 직전 1.5초)
  const [rouletteIndex, setRouletteIndex] = useState<number>(0);
  const [rouletteRevealed, setRouletteRevealed] = useState<boolean>(false);

  useEffect(() => {
    if (!isFirebaseConfigured) return;
    if (!sessionId) return;
    const unsub = onSnapshot(
      doc(db, 'votes', sessionId),
      (snap) => {
        if (!snap.exists()) {
          setError('투표 세션을 찾을 수 없어요.');
          return;
        }
        const raw = snap.data() as Partial<VoteDoc>;
        setData({
          title: raw.title ?? '점심 투표',
          candidates: raw.candidates ?? [],
          counts: raw.counts ?? {},
          status: raw.status ?? 'voting',
          expiresAt: raw.expiresAt ?? 0,
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

  // 룰렛 애니메이션: 결과가 도착했고 method='roulette' 이면 후보들 빠르게 순환 후 정답 공개
  useEffect(() => {
    if (!data) return;
    if (data.finalMethod !== 'roulette') {
      setRouletteRevealed(true);
      return;
    }
    if (rouletteRevealed) return;

    // 동률 후보 풀(결선 후보 우선, 없으면 1차 후보)
    const pool = (data.runoffCandidates && data.runoffCandidates.length > 0)
      ? data.runoffCandidates
      : data.candidates;

    if (pool.length === 0) {
      setRouletteRevealed(true);
      return;
    }

    let i = 0;
    const start = Date.now();
    const DURATION = 1500; // 1.5초

    const tick = () => {
      const elapsed = Date.now() - start;
      if (elapsed >= DURATION) {
        setRouletteRevealed(true);
        return;
      }
      // 속도가 점점 느려지는 ease-out
      const progress = elapsed / DURATION;
      const delay = 60 + Math.floor(progress * 200);
      setRouletteIndex(i % pool.length);
      i += 1;
      setTimeout(tick, delay);
    };
    tick();
  }, [data, rouletteRevealed]);

  // 표 정렬 (1차 결과 표시용)
  const sortedResults = useMemo(() => {
    if (!data) return [];
    const counts = data.counts;
    return [...data.candidates]
      .map((c) => ({ name: c, count: counts[c] ?? 0 }))
      .sort((a, b) => b.count - a.count);
  }, [data]);

  const handleShare = async () => {
    if (!data?.finalChoice) return;
    setSharing(true);
    try {
      let url: string;
      try {
        url = await buildAppShareLink(`/vote/${sessionId}/result`);
      } catch {
        url = `${window.location.origin}/vote/${sessionId}/result`;
      }
      const result = await shareMessage(
        `[점심먹Go] 오늘 점심은 ${data.finalChoice}! 🍱\n${url}`,
      );
      setFlash(result === 'copied' ? '링크 복사 완료' : '공유 완료');
      setTimeout(() => setFlash(null), 2000);
    } catch {
      setFlash('공유 실패');
      setTimeout(() => setFlash(null), 2000);
    } finally {
      setSharing(false);
    }
  };

  if (error) {
    return (
      <main className="screen">
        <div className="screen-header">
          <button type="button" className="back" onClick={() => nav('/')}>←</button>
          <h1>결과</h1>
        </div>
        <div className="banner" role="alert">{error}</div>
      </main>
    );
  }

  if (!data || !data.finalChoice) {
    return (
      <main className="screen">
        <div className="empty" aria-live="polite">결과를 불러오는 중…</div>
      </main>
    );
  }

  const method: VoteMethod = data.finalMethod ?? 'vote';
  const displayChoice = (() => {
    if (method !== 'roulette') return data.finalChoice;
    if (rouletteRevealed) return data.finalChoice;
    // 애니메이션 중 — 후보 풀에서 인덱스로 순환
    const pool = (data.runoffCandidates && data.runoffCandidates.length > 0)
      ? data.runoffCandidates
      : data.candidates;
    return pool.length > 0 ? pool[rouletteIndex % pool.length] : data.finalChoice;
  })();

  return (
    <main className="screen result-screen">
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

      <div className="result-hero">
        <div className="result-emoji">
          {method === 'roulette' && !rouletteRevealed ? '🎰' : '🎉'}
        </div>
        <p className="result-label">오늘의 점심은</p>
        <div className={`result-choice${rouletteRevealed ? ' revealed' : ' rolling'}`}>
          {displayChoice}
        </div>
        <p className="result-method">
          {method === 'vote' && '단독 1위로 결정됐어요'}
          {method === 'runoff' && '결선 투표에서 결정됐어요'}
          {method === 'roulette' && (rouletteRevealed
            ? '결선도 동률이라 룰렛으로 결정됐어요 🎰'
            : '룰렛 돌리는 중…')}
        </p>
      </div>

      {/* 1차 투표 결과 표 */}
      <section className="result-section">
        <h2 className="result-section-title">📊 1차 투표 결과</h2>
        <div className="stack">
          {sortedResults.map((r, idx) => {
            const total = sortedResults.reduce((sum, x) => sum + x.count, 0);
            const pct = total === 0 ? 0 : Math.round((r.count / total) * 100);
            return (
              <div
                key={r.name}
                className={`result-row${idx === 0 ? ' result-row-top' : ''}`}
              >
                <span className="result-rank">{idx + 1}</span>
                <span className="result-name">{r.name}</span>
                <span className="result-bar-wrap">
                  <span className="result-bar" style={{ width: `${pct}%` }} />
                </span>
                <span className="result-count">{r.count}표</span>
              </div>
            );
          })}
        </div>
      </section>

      {/* 결선 결과가 있으면 함께 표시 */}
      {data.runoffCounts && Object.keys(data.runoffCounts).length > 0 && (
        <section className="result-section">
          <h2 className="result-section-title">⚖️ 결선 투표 결과</h2>
          <div className="stack">
            {(data.runoffCandidates ?? []).map((c) => {
              const count = data.runoffCounts![c] ?? 0;
              const total = Object.values(data.runoffCounts!).reduce((a, b) => a + b, 0);
              const pct = total === 0 ? 0 : Math.round((count / total) * 100);
              return (
                <div
                  key={c}
                  className={`result-row${c === data.finalChoice ? ' result-row-top' : ''}`}
                >
                  <span className="result-name">{c}</span>
                  <span className="result-bar-wrap">
                    <span className="result-bar" style={{ width: `${pct}%` }} />
                  </span>
                  <span className="result-count">{count}표</span>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {flash && <div className="toast">{flash}</div>}

      <div style={{ marginTop: 24, display: 'flex', flexDirection: 'column', gap: 10 }}>
        <Button
          display="full"
          size="large"
          color="primary"
          onClick={handleShare}
          loading={sharing}
        >
          🔗 결과 공유하기
        </Button>
        <Button
          display="full"
          size="large"
          variant="weak"
          color="primary"
          onClick={() => nav('/')}
        >
          🏠 홈으로 (다시 정하기)
        </Button>
        {/* v1.2 — 근처 식당 추천 자리 (출시 후 활성화 예정) */}
      </div>

      <p className="result-footnote">
        v1.2 에서 결정된 메뉴 근처 식당 추천 기능이 추가될 예정이에요 🚀
      </p>
    </main>
  );
}
