import { Button, TextField } from '@toss/tds-mobile';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { db, isFirebaseConfigured } from '../lib/firebase';
import { clearShortlist, getShortlist } from '../lib/shortlist';

export default function VoteCreateScreen() {
  const nav = useNavigate();
  const [title, setTitle] = useState('오늘 점심');
  // Prefill from shortlist (룰렛/근처에서 담은 후보). 사용자가 이 화면에서 수정 가능.
  const [candidates, setCandidates] = useState<string[]>(() =>
    getShortlist().map((e) => e.label),
  );
  const [prefilledCount] = useState<number>(() => getShortlist().length);
  const [draft, setDraft] = useState('');
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // shortlist가 다른 화면에서 바뀔 수 있지만, 여기서는 화면 진입 시점의 스냅샷을 쓰고
  // 사용자가 직접 편집하도록 한다(덮어쓰기 방지).
  useEffect(() => {
    // no-op: 의도적으로 최초 스냅샷만 사용
  }, []);

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
      // 투표가 성사됐으니 shortlist는 비운다 — 다음 결정으로 이월되지 않게.
      clearShortlist();
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
        <button
          type="button"
          className="back"
          onClick={() => nav(-1)}
          aria-label="뒤로 가기"
        >
          ←
        </button>
        <h1>팀 투표 만들기</h1>
      </div>

      {error && (
        <div className="banner" role="alert">
          {error}
        </div>
      )}

      {prefilledCount > 0 && (
        <div className="info-banner" role="status">
          룰렛·근처식당에서 담은 후보 {prefilledCount}개를 자동으로 넣었어요. 필요하면 편집해주세요.
        </div>
      )}

      <div className="stack">
        <div>
          <p className="card-title" style={{ margin: '0 0 8px' }}>제목</p>
          <TextField
            variant="box"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="오늘 점심"
            maxLength={30}
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
                <button
                  type="button"
                  onClick={() => removeCandidate(c)}
                  aria-label={`${c} 삭제`}
                >
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
            <div style={{ flex: 1 }}>
              <TextField
                variant="box"
                placeholder="후보 추가 (Enter)"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addCandidate()}
                maxLength={20}
              />
            </div>
            <Button
              size="large"
              variant="weak"
              color="primary"
              onClick={addCandidate}
              disabled={!draft.trim()}
            >
              추가
            </Button>
          </div>
        </div>

        <Button
          display="full"
          size="xlarge"
          color="primary"
          disabled={candidates.length < 2}
          loading={creating}
          onClick={create}
        >
          {creating ? '만드는 중' : '투표 만들고 공유하기'}
        </Button>
      </div>
    </main>
  );
}
