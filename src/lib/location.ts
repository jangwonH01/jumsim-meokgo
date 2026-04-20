// Thin wrapper over navigator.geolocation. AppsInToss WebView forwards
// geolocation permission prompts to the native Toss app when the
// `geolocation` permission is declared in granite.config.ts.

export interface Coords {
  lat: number;
  lng: number;
}

export function getCurrentCoords(): Promise<Coords> {
  return new Promise((resolve, reject) => {
    if (!('geolocation' in navigator)) {
      reject(new Error('GEO_UNSUPPORTED'));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      (err) => reject(new Error(err.message || 'GEO_FAILED')),
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 60_000 },
    );
  });
}
