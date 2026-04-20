# 점심먹Go (jumsim-meokgo)

AppsInToss WebView 미니앱 — 직장인 점심 고민 해결을 위한 세 가지 기능:

- 🎲 **랜덤 룰렛**: 메뉴 리스트에서 한 개 자동 픽 (로컬 저장)
- 📍 **근처 식당**: 내 위치 기반 500m 내 식당 (카카오 로컬 API)
- 👥 **팀 투표**: 후보 입력 → 링크 공유 → 실시간 집계 (Firebase Firestore)

## Stack

- Vite + React 18 + TypeScript
- `@apps-in-toss/web-framework` — 토스앱 안에서 WebView 미니앱으로 실행
- `@toss/tds-mobile` — Toss Design System (심사 통과에 필수)
- Firebase Firestore — 투표 세션 저장 (`votes` 컬렉션)
- 카카오 로컬 REST API — 근처 식당 검색

## 개발

```bash
# 환경변수 설정
cp .env.example .env.local
# 아래 값들 채우기:
# - VITE_KAKAO_REST_KEY
# - VITE_FIREBASE_* (Firebase 콘솔에서 웹앱 등록 후 복사)

npm install
npm run dev
```

`granite.config.ts`에 선언된 `appName: 'jumsim-meokgo'`로 샌드박스 앱에서
`intoss://jumsim-meokgo`로 접속해 확인하세요.

## 빌드 + 배포

```bash
npm run build
# dist/ → 앱인토스 콘솔에 번들 업로드
```

자세한 배포 절차는
[앱인토스 미니앱 출시 가이드](https://developers-apps-in-toss.toss.im/development/deploy/)
참고.

## 필요한 키

| 키                         | 발급 위치                                              |
|----------------------------|--------------------------------------------------------|
| `VITE_KAKAO_REST_KEY`      | https://developers.kakao.com/ → 내 애플리케이션        |
| `VITE_FIREBASE_*`          | Firebase 콘솔 → 프로젝트 설정 → 내 앱 → 웹앱 등록      |

두 키 없이도 **랜덤 룰렛**은 바로 작동해요. 근처/투표는 키 필요.

## 자매 앱

같은 브랜드 라인업: [달리Go](https://github.com/jangwonH01/dalligo) (국내 마라톤 대회 모음, Android)
