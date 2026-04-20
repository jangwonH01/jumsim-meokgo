import { Button } from '@toss/tds-mobile';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { isKakaoConfigured, searchNearbyRestaurants, type KakaoRestaurant } from '../lib/kakao';
import { getCurrentCoords } from '../lib/location';

type LoadState =
  | { kind: 'idle' }
  | { kind: 'loading'; message: string }
  | { kind: 'ok'; restaurants: KakaoRestaurant[] }
  | { kind: 'error'; message: string };

export default function NearbyScreen() {
  const nav = useNavigate();
  const [state, setState] = useState<LoadState>({ kind: 'idle' });
  const [radius, setRadius] = useState(500);

  const load = async () => {
    if (!isKakaoConfigured) {
      setState({
        kind: 'error',
        message:
          '카카오 로컬 API 키가 없어요. `.env.local`에 VITE_KAKAO_REST_KEY를 설정한 뒤 다시 시도해주세요.',
      });
      return;
    }
    setState({ kind: 'loading', message: '위치 확인 중…' });
    try {
      const coords = await getCurrentCoords();
      setState({ kind: 'loading', message: '근처 식당 검색 중…' });
      const restaurants = await searchNearbyRestaurants(coords.lat, coords.lng, radius);
      setState({ kind: 'ok', restaurants });
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setState({ kind: 'error', message: `불러오지 못했어요: ${msg}` });
    }
  };

  useEffect(() => {
    // Intentional: radius change triggers a re-fetch with setState.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [radius]);

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
        <h1>근처 식당</h1>
      </div>

      <div className="row" role="tablist" aria-label="검색 반경" style={{ marginBottom: 14 }}>
        {[300, 500, 1000].map((r) => (
          <button
            key={r}
            type="button"
            role="tab"
            aria-selected={r === radius}
            className="pill"
            style={{
              cursor: 'pointer',
              background: r === radius ? 'var(--brand)' : 'var(--surface)',
              color: r === radius ? '#fff' : 'var(--text-muted)',
              border: `1px solid ${r === radius ? 'var(--brand)' : 'var(--border)'}`,
            }}
            onClick={() => setRadius(r)}
          >
            {r < 1000 ? `${r}m` : `${r / 1000}km`}
          </button>
        ))}
      </div>

      {state.kind === 'loading' && (
        <div className="empty" aria-live="polite">
          {state.message}
        </div>
      )}
      {state.kind === 'error' && (
        <div className="banner" role="alert">
          {state.message}
        </div>
      )}
      {state.kind === 'ok' && state.restaurants.length === 0 && (
        <div className="empty">주변에 식당이 없어요</div>
      )}
      {state.kind === 'ok' && state.restaurants.length > 0 && (
        <div className="stack">
          {state.restaurants.map((r) => (
            <a
              key={r.id}
              className="restaurant"
              href={r.placeUrl}
              target="_blank"
              rel="noreferrer"
            >
              <p className="restaurant-name">{r.placeName}</p>
              <p className="restaurant-meta">
                {r.categoryName} · {r.distanceMeters}m · {r.address || ''}
              </p>
            </a>
          ))}
        </div>
      )}

      {state.kind === 'error' && (
        <div style={{ marginTop: 16 }}>
          <Button display="full" size="large" color="primary" onClick={load}>
            다시 시도
          </Button>
        </div>
      )}
    </main>
  );
}
