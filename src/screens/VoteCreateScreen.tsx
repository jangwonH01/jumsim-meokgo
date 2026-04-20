import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { db, isFirebaseConfigured } from '../lib/firebase';

export default function VoteCreateScreen() {
  const nav = useNavigate();
  const [title, setTitle] = useState('오늘 점심');
  const [candidates, setCandidates] = useState<string[]>([]);
  const [draft, setDraft] = useState('');
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addCandidate = () => {
    const v = draft.trim();
    if (!v || candidates.includes(v)) {
      setDraft('');
      return;
    }
    setCandidates([...candidates, v]);
    setDraft('');
  };

  const removeCandidate = (v: string) => {
    setCandidates(candidates.filter((x) => x !== v));
  };

  const create = async () => {
    if (!isFirebaseConfigured) {
      setError(
        'Firebase 웹앱 설정이 필요해요. Firebase 콘솔 → 프로젝트 설정 → 내 앱에서 웹앱을 등록하고 .env.local에 값을 넣어주세요.',
      );
      return;
    }
    if (candidates.length < 2) {
      setError('후보를 2개 이상 추가해주세요.');
      return;
    }
    setCreating(true);
    setError(null);
    try {
      const docRef = await addDoc(collection(db, 'votes'), {
        title: title.trim() || '오늘 점심',
        candidates,
        counts: Object.fromEntries(candidates.map((c) => [c, 0])),
        createdAt: serverTimestamp(),
      });
      nav(`/vote/${docRef.id}`, { replace: true });
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setError(`생성 실패: ${msg}`);
      setCreating(false);
    }
  };

  return (
    <main className="screen">
      <div className="screen-header">
        <button type="button" className="back" onClick={() => nav(-1)}>
          ←
        </button>
        <h1>팀 투표 만들기</h1>
      </div>

      {error && <div className="banner">{error}</div>}

      <div className="stack">
        <div>
          <p className="card-title" style={{ margin: '0 0 8px' }}>제목</p>
          <input
            className="input"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="오늘 점심"
          />
        </div>

        <div>
          <p className="card-title" style={{ margin: '0 0 8px' }}>
            후보 ({candidates.length})
          </p>
          <div className="tag-row" style={{ marginBottom: 10 }}>
            {candidates.map((c) => (
              <span className="tag" key={c}>
                {c}
                <button type="button" onClick={() => removeCandidate(c)}>
                  ×
                </button>
              </span>
            ))}
            {candidates.length === 0 && (
              <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>
                예) 국밥, 돈까스, 파스타
              </span>
            )}
          </div>
          <div className="row">
            <input
              className="input"
              placeholder="후보 추가 (Enter)"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addCandidate()}
            />
            <button
              type="button"
              className="btn btn-ghost"
              onClick={addCandidate}
              style={{ width: 'auto', padding: '0 18px' }}
            >
              추가
            </button>
          </div>
        </div>

        <button
          type="button"
          className="btn"
          disabled={creating || candidates.length < 2}
          onClick={create}
        >
          {creating ? '만드는 중…' : '투표 만들고 공유하기'}
        </button>
      </div>
    </main>
  );
}
