import { Button } from '@toss/tds-mobile';
import { useNavigate } from 'react-router-dom';

export default function HomeScreen() {
  const nav = useNavigate();

  return (
    <main className="screen">
      <div style={{ padding: '20px 0 8px' }}>
        <div className="pill">오늘의 점심</div>
        <h1 className="screen-title">점심먹Go 🍚</h1>
        <p className="screen-subtitle">
          고민은 줄이고, 팀원과 바로 결정해요.
        </p>
      </div>

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
            <p className="card-desc">메뉴 고르기 귀찮을 때 한 번 돌려보기</p>
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
            <p className="card-desc">내 위치 500m 내 식당을 추천해드려요</p>
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
            <p className="card-desc">후보만 넣으면 링크로 공유해 바로 투표</p>
          </div>
        </button>

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
      </div>
    </main>
  );
}
