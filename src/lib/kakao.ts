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
  return json.documents.map((d) => ({
    id: d.id,
    placeName: d.place_name,
    categoryName: d.category_name.split('>').pop()?.trim() ?? d.category_name,
    phone: d.phone,
    placeUrl: d.place_url,
    distanceMeters: Number(d.distance || 0),
    address: d.road_address_name || d.address_name,
    x: d.x,
    y: d.y,
  }));
}
