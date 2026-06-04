// Kakao Local REST API — restaurant search (FD6 = 음식점).
//
// Requires a REST API key from https://developers.kakao.com/
// Set VITE_KAKAO_REST_KEY in .env.local before shipping.

const KAKAO_REST_KEY = import.meta.env.VITE_KAKAO_REST_KEY as string | undefined;

export const isKakaoConfigured = Boolean(KAKAO_REST_KEY);

export interface KakaoRestaurant {
  id: string;
  placeName: string;
  categoryName: string;
  phone: string;
  placeUrl: string;
  distanceMeters: number;
  address: string;
  x: string; // longitude
  y: string; // latitude
}

interface KakaoRawDoc {
  id: string;
  place_name: string;
  category_name: string;
  phone: string;
  place_url: string;
  distance: string;
  address_name: string;
  road_address_name: string;
  x: string;
  y: string;
}

function mapDoc(d: KakaoRawDoc): KakaoRestaurant {
  return {
    id: d.id,
    placeName: d.place_name,
    categoryName: d.category_name.split('>').pop()?.trim() ?? d.category_name,
    phone: d.phone,
    placeUrl: d.place_url,
    distanceMeters: Number(d.distance || 0),
    address: d.road_address_name || d.address_name,
    x: d.x,
    y: d.y,
  };
}

/**
 * 카테고리(FD6 = 음식점) 기반 주변 검색.
 * NearbyScreen 에서 사용. 메뉴 무관하게 근처 식당 모두 가져옴.
 */
export async function searchNearbyRestaurants(
  lat: number,
  lng: number,
  radiusM = 500,
): Promise<KakaoRestaurant[]> {
  if (!KAKAO_REST_KEY) throw new Error('KAKAO_KEY_MISSING');
  const url = new URL('https://dapi.kakao.com/v2/local/search/category.json');
  url.searchParams.set('category_group_code', 'FD6');
  url.searchParams.set('x', String(lng));
  url.searchParams.set('y', String(lat));
  url.searchParams.set('radius', String(radiusM));
  url.searchParams.set('sort', 'distance');
  url.searchParams.set('size', '15');

  const resp = await fetch(url.toString(), {
    headers: { Authorization: `KakaoAK ${KAKAO_REST_KEY}` },
  });
  if (!resp.ok) throw new Error(`Kakao API ${resp.status}`);
  const json = (await resp.json()) as { documents: KakaoRawDoc[] };
  return json.documents.map(mapDoc);
}

/**
 * 메뉴 키워드 기반 주변 검색 (v1.2 신규).
 * 예: "김치찌개" 키워드 + 사용자 위치 → 근처 김치찌개 파는 식당 리스트.
 *
 * 카카오 keyword 검색은 가게 이름·메뉴·태그를 모두 매칭하므로
 * 메뉴명을 그대로 query 에 넣으면 그 메뉴를 파는 식당이 잘 잡혀요.
 * category_group_code=FD6 를 함께 지정해서 음식점만 필터링.
 */
export async function searchRestaurantsByMenu(
  menuKeyword: string,
  lat: number,
  lng: number,
  radiusM = 1000,
): Promise<KakaoRestaurant[]> {
  if (!KAKAO_REST_KEY) throw new Error('KAKAO_KEY_MISSING');
  const query = menuKeyword.trim();
  if (!query) return [];

  const url = new URL('https://dapi.kakao.com/v2/local/search/keyword.json');
  url.searchParams.set('query', query);
  url.searchParams.set('category_group_code', 'FD6');
  url.searchParams.set('x', String(lng));
  url.searchParams.set('y', String(lat));
  url.searchParams.set('radius', String(radiusM));
  url.searchParams.set('sort', 'distance');
  url.searchParams.set('size', '15');

  const resp = await fetch(url.toString(), {
    headers: { Authorization: `KakaoAK ${KAKAO_REST_KEY}` },
  });
  if (!resp.ok) throw new Error(`Kakao API ${resp.status}`);
  const json = (await resp.json()) as { documents: KakaoRawDoc[] };
  return json.documents.map(mapDoc);
}

/**
 * 카카오맵 길찾기 외부 링크.
 * 사용자 현재 위치 → 식당 위치로 도보 길찾기를 카카오맵 앱/웹에서 열어요.
 * 토스 미니앱 정책상 "단순 정보 확인 타사 사이트" 허용 범주.
 */
export function buildKakaoDirectionsUrl(
  destination: { x: string; y: string; placeName: string },
): string {
  // 카카오맵 도보 길찾기 — 도착지만 지정하면 출발지는 사용자가 현재 위치로 자동 설정 가능.
  // 형태: https://map.kakao.com/?sName=...&eName=...&eX=...&eY=...
  const params = new URLSearchParams({
    eName: destination.placeName,
    eX: destination.x,
    eY: destination.y,
  });
  return `https://map.kakao.com/?${params.toString()}`;
}
