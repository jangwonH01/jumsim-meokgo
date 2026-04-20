import { doc, increment, onSnapshot, updateDoc } from 'firebase/firestore';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import { db, isFirebaseConfigured } from '../lib/firebase';
import { shareMessage } from '../lib/share';

interface VoteDoc {
  title: string;
  candidates: string[];
  counts: Record<string, number>;
}

const VOTED_LS = (id: string) => `jumsim-meokgo.voted.${id}`;

export default function VoteSessionScreen() {
  const nav = useNavigate();
  const { sessionId = '' } = useParams();
  const [data, setData] = useState<VoteDoc | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [voted, setVoted] = useState<string | null>(() =>
    typeof window === 'undefined' ? null : localStorage.getItem(VOTED_LS(sessionId)),
  );
  const [sharing, setSharing] = useState(false);
  const [flash, setFlash] = useState<string | null>(null);

  useEffect(() => {
    if (!isFirebaseConfigured) {
      setError(
        'Firebase 웹앱 설정이 필요해요. .env.local에 VITE_FIREBASE_* 값을 채워주세요.',
      );
      return;
    }
    if (!sessionId) return;
    const ref = doc(db, 'votes', sessionId);
    const unsub = onSnapshot(
      ref,
      (snap) => {
        if (!snap.exists()) {
          setError('투표 세션을 찾을 수 없어요.');
          return;
        }
        setData(snap.data() as VoteDoc);
      },
      (e) => setError(`불러오기 실패: ${e.message}`),
    );
    return unsub;
  }, [sessionId]);

  const total = useMemo(
    () => (data ? Object.values(data.counts).reduce((a, b) => a + b, 0) : 0),
    [data],
  );

  const vote = async (candidate: string) => {
    if (voted) return;
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

  const share = async () => {
    setSharing(true);
    try {
      const url = `${window.location.origin}/vote/${sessionId}`;
      const result = await shareMessage(
        `[점심먹Go] ${data?.title ?? '점심 투표'}\n${url}`,
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
          <button type="button" className="back" onClick={() => nav('/')}>
            ←
          </button>
          <h1>팀 투표</h1>
        </div>
        <div className="banner">{error}</div>
      </main>
    );
  }

  if (!data) {
    return (
      <main className="screen">
        <div className="empty">불러오는 중…</div>
      </main>
    );
  }

  return (
    <main className="screen">
      <div className="screen-header">
        <button type="button" className="back" onClick={() => nav('/')}>
          ←
        </button>
        <h1>{data.title}</h1>
      </div>

      <p className="screen-subtitle">
        {voted
          ? `'${voted}'에 투표했어요 · 전체 ${total}표`
          : `후보를 하나 골라주세요 · 전체 ${total}표`}
      </p>

      {flash && <div className="banner">{flash}</div>}

      <div className="stack">
        {data.candidates.map((c) => {
          const count = data.counts[c] ?? 0;
          const pct = total === 0 ? 0 : Math.round((count / total) * 100);
          return (
            <button
              key={c}
              type="button"
              className={`vote-option ${voted === c ? 'selected' : ''}`}
              onClick={() => vote(c)}
              disabled={Boolean(voted)}
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

      <button
        type="button"
        className="btn btn-ghost"
        style={{ marginTop: 20 }}
        onClick={share}
        disabled={sharing}
      >
        🔗 투표 링크 공유하기
      </button>
    </main>
  );
}
