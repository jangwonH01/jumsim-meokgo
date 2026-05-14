import { Button } from '@toss/tds-mobile';
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

import { clearShortlist, removeFromShortlist } from '../lib/shortlist';
import { useAnonymousKey } from '../lib/useAnonymousKey';
import { useShortlist } from '../lib/useShortlist';

export default function HomeScreen() {
  const nav = useNavigate();
  const shortlist = useShortlist();
  // 비게임 출시 가이드 — 유저 식별키 초기화 (향후 투표 이력/북마크 연결용)
  const { key: anonymousKey } = useAnonymousKey();
  useEffect(() => {
    if (anonymousKey) {
      console.log('[jumsim-meokgo] anonymousKey acquired:', anonymousKey);
    }
  }, [anonymousKey]);

  return (
    <main className="screen">
      <div style={{ padding: '20px 0 8px' }}>
        <div className="pill">오늘의 점심</div>
        <h1 className="screen-title">점심먹Go 🍚</h1>
        <p className="screen-subtitle">
          고민은 줄이고, 팀원과 바로 결정해요.
        </p>
      </div>

      {shortlist.length > 0 && (
        <section
          className="shortlist-card"
          aria-label={`오늘의 후보 ${shortlist.length}개`}
        >
          <div className="shortlist-head">
            <p className="card-title" style={{ margin: 0 }}>
              🍱 오늘의 후보 ({shortlist.length})
            </p>
            <button
              type="button"
              className="shortlist-clear"
              onClick={() => clearShortlist()}
              aria-label="후보 모두 비우기"
            >
              비우기
            </button>
          </div>
          <div className="tag-row" style={{ marginTop: 10 }}>
            {shortlist.map((e) => (
              <span className="tag" key={e.label}>
                {e.label}
                <button
                  type="button"
                  onClick={() => removeFromShortlist(e.label)}
                  aria-label={`${e.label} 제거`}
                >
                  ×
                </button>
              </span>
            ))}
          </div>
          <div style={{ marginTop: 12 }}>
            <Button
              display="full"
              size="large"
              color="primary"
              disabled={shortlist.length < 2}
              onClick={() => nav('/vote')}
            >
              {shortlist.length < 2
                ? '후보 2개 이상이면 투표 시작'
                : `이 ${shortlist.length}개로 팀 투표 시작`}
            </Button>
          </div>
        </section>
      )}

      <div className="stack">
        <button
          type="button"
          className="card"
          onClick={() => nav('/roulette')}
          aria-label="랜덤 룰렛으로 이동"
        >
          <span className="card-emoji" aria-hidden="true">🎲</span>
          <div>
            <p className="card-title">랜덤 룰렛</p>
            <p className="card-desc">메뉴 뽑고 바로 후보에 담기</p>
          </div>
        </button>

        <button
          type="button"
          className="card"
          onClick={() => nav('/nearby')}
          aria-label="근처 식당 찾기로 이동"
        >
          <span className="card-emoji" aria-hidden="true">📍</span>
          <div>
            <p className="card-title">근처 식당 찾기</p>
            <p className="card-desc">내 위치 500m 식당을 후보로 담아요</p>
          </div>
        </button>

        <button
          type="button"
          className="card"
          onClick={() => nav('/vote')}
          aria-label="팀 투표 만들기로 이동"
        >
          <span className="card-emoji" aria-hidden="true">👥</span>
          <div>
            <p className="card-title">팀 투표 만들기</p>
            <p className="card-desc">담아둔 후보로 링크 공유 투표</p>
          </div>
        </button>

        {shortlist.length === 0 && (
          <div style={{ marginTop: 8 }}>
            <Button
              display="full"
              size="large"
              variant="weak"
              color="primary"
              onClick={() => nav('/roulette')}
            >
              바로 뽑기
            </Button>
          </div>
        )}
      </div>
    </main>
  );
}
