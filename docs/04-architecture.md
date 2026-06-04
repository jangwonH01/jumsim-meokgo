# 점심먹Go — 아키텍처 & 데이터 모델

## 기술 스택

| 레이어 | 기술 | 버전 | 비고 |
|---|---|---|---|
| 프레임워크 | Vite + React | Vite 8 / React 18.3 | Rolldown 빌드 |
| 언어 | TypeScript | 6.0 | target: ES2020 |
| 라우팅 | react-router-dom | 7.x | SPA |
| 디자인 시스템 | @toss/tds-mobile | 2.3 | Toss Design System |
| AppsInToss SDK | @apps-in-toss/web-framework | 2.4.7 | 토스 미니앱 |
| 백엔드 | Firebase Firestore | 12.x | votes 컬렉션 |
| 외부 API | 카카오 Local API | v2 | 식당 검색 + 길찾기 |
| 호스팅 | AppsInToss 사업자 워크스페이스 | - | 토스 인프라 |

## 폴더 구조

```
jumsim-meokgo/
├── docs/                              ← 본 문서들
│   ├── 01-product-definition.md
│   ├── 02-requirements.md
│   ├── 03-screen-flow.md
│   ├── 04-architecture.md
│   ├── 05-policy-checklist.md
│   └── 06-roadmap.md
│
├── public/
│   ├── icon-1024.png                  ← 앱 아이콘 (토스 콘솔 URL)
│   ├── icon-512.png
│   └── favicon.png
│
├── src/
│   ├── main.tsx                       ← 엔트리 (ErrorBoundary 래핑)
│   ├── App.tsx                        ← 라우팅 6개
│   ├── App.css                        ← 글로벌 스타일
│   ├── index.css
│   │
│   ├── lib/
│   │   ├── firebase.ts                ← Firestore 연결
│   │   ├── kakao.ts                   ← 카카오 Local API
│   │   ├── location.ts                ← navigator.geolocation
│   │   ├── share.ts                   ← 토스 공유 + 딥링크
│   │   ├── shortlist.ts               ← 후보 localStorage
│   │   ├── useShortlist.ts            ← 후보 구독 훅
│   │   ├── useAnonymousKey.ts         ← 토스 식별키 훅
│   │   ├── voteEngine.ts              ← v1.1 결선/룰렛 로직
│   │   └── ErrorBoundary.tsx          ← 예외 핸들러
│   │
│   └── screens/
│       ├── HomeScreen.tsx             ← /
│       ├── RouletteScreen.tsx         ← /roulette
│       ├── NearbyScreen.tsx           ← /nearby
│       ├── VoteCreateScreen.tsx       ← /vote
│       ├── VoteSessionScreen.tsx      ← /vote/:sessionId
│       └── VoteResultScreen.tsx       ← /vote/:sessionId/result
│
├── granite.config.ts                  ← 토스 미니앱 설정
├── package.json                       ← v0.1.3
├── vite.config.ts                     ← target: es2020
├── tsconfig.app.json                  ← target: ES2020
└── .env.local                         ← Kakao + Firebase keys (gitignored)
```

## 데이터 흐름 (Data Flow)

### 1. 룰렛 → 후보 담기 흐름

```
RouletteScreen
  ↓ 사용자 클릭 "+ 후보에 담기"
addToShortlist(menu) [lib/shortlist.ts]
  ↓ localStorage 쓰기
window.dispatchEvent('jumsim-meokgo:shortlist-change')
  ↓ 이벤트 발생
useShortlist() [모든 화면 구독]
  ↓ 상태 갱신
HomeScreen / VoteCreateScreen 자동 리렌더
```

### 2. 팀 투표 흐름 (v1.0 → v1.1 확장)

```
VoteCreateScreen
  ↓ 후보 + 시간 선택 + "투표 만들기"
addDoc(collection(db, 'votes'), {
  title, candidates, counts,
  status: 'voting',          ← v1.1
  expiresAt: now + duration,  ← v1.1
  durationMinutes,           ← v1.1
})
  ↓ Firestore 생성
nav('/vote/:sessionId') 자동 이동
  ↓
VoteSessionScreen
  ↓ onSnapshot 구독
실시간 카운트 업데이트 + 카운트다운 매초 갱신
  ↓ 사용자 투표
updateDoc({ counts.{candidate}: increment(1) })
  ↓ 시간 종료 또는 "지금 결정"
voteEngine.resolveAfterFirstRound() 호출
  ↓ Firestore 업데이트
  ├─ status: 'completed', finalChoice, finalMethod: 'vote'  → 결과 이동
  └─ status: 'runoff', runoffCandidates, runoffExpiresAt   → 결선 모드
       ↓ 2분 대기 + 결선 투표
       voteEngine.resolveAfterRunoff() 호출
       ↓ Firestore 업데이트
         ├─ method: 'runoff' (단독 1위)
         └─ method: 'roulette' (또 동률)
  ↓ 자동 이동
VoteResultScreen (/vote/:id/result)
```

### 3. 결과 → 식당 추천 흐름 (v1.2)

```
VoteResultScreen 진입
  ↓ data.finalMethod === 'roulette' 이면 1.5초 애니메이션
  ↓ rouletteRevealed = true
useEffect 트리거
  ↓ getCurrentCoords() [lib/location.ts]
  ↓ navigator.geolocation 권한 요청
searchRestaurantsByMenu(menu, lat, lng, radius) [lib/kakao.ts]
  ↓ Kakao Local API keyword 검색
restaurants = { kind: 'ok', restaurants: [...] }
  ↓ 화면 렌더
사용자 클릭 "📋 정보" → window.open(placeUrl)
사용자 클릭 "🗺️ 길찾기" → window.open(buildKakaoDirectionsUrl)
```

## 데이터 모델

### Vote (Firestore `votes` 컬렉션)

```typescript
interface VoteDoc {
  // 기본 (v1.0)
  title: string;                              // '오늘 점심'
  candidates: string[];                       // ['김치찌개', '라멘', '제육덮밥']
  counts: Record<string, number>;             // { '김치찌개': 3, '라멘': 1, '제육덮밥': 0 }
  createdAt: Timestamp;                       // Firestore serverTimestamp()

  // 자동 종료 (v1.1)
  status: 'voting' | 'runoff' | 'completed';
  expiresAt: number;                          // unix ms
  durationMinutes: 5 | 15 | 30;

  // 결선 (v1.1, 동률 시에만)
  runoffCandidates?: string[];
  runoffCounts?: Record<string, number>;
  runoffExpiresAt?: number;                   // now + 2분

  // 최종 결과 (v1.1)
  finalChoice?: string;                       // '김치찌개'
  finalMethod?: 'vote' | 'runoff' | 'roulette';
}
```

### Shortlist (localStorage)

```typescript
// key: 'jumsim-meokgo.shortlist.v1'
type Shortlist = ShortlistEntry[];

interface ShortlistEntry {
  label: string;                              // '김치찌개'
  source: 'roulette' | 'nearby' | 'manual';
  placeId?: string;                           // (nearby 일 때) 카카오 식당 ID
  placeUrl?: string;                          // (nearby 일 때) 카카오맵 URL
}
```

### Voted (localStorage)

```typescript
// 1차 투표 기록 — 같은 세션에서 중복 투표 방지
// key: 'jumsim-meokgo.voted.{sessionId}'
type Voted = string;  // 사용자가 투표한 후보 이름

// 결선 투표 기록
// key: 'jumsim-meokgo.voted-runoff.{sessionId}'
type VotedRunoff = string;
```

### KakaoRestaurant

```typescript
interface KakaoRestaurant {
  id: string;
  placeName: string;                          // '김치찌개의 정석'
  categoryName: string;                       // '한식'
  phone: string;
  placeUrl: string;                           // 카카오맵 장소 페이지
  distanceMeters: number;
  address: string;
  x: string;                                  // longitude
  y: string;                                  // latitude
}
```

## Firebase 보안 규칙 (Firestore)

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    match /votes/{voteId} {
      allow read: if true;

      // 생성: 후보 2~20개 검증
      allow create: if request.resource.data.candidates is list
                    && request.resource.data.candidates.size() >= 2
                    && request.resource.data.candidates.size() <= 20
                    && request.resource.data.title is string
                    && request.resource.data.title.size() <= 50;

      // 업데이트: 허용 필드만
      allow update: if request.resource.data.diff(resource.data).affectedKeys()
                       .hasOnly([
                         'counts',
                         'status',
                         'finalChoice',
                         'finalMethod',
                         'runoffCandidates',
                         'runoffCounts',
                         'runoffExpiresAt'
                       ]);

      allow delete: if false;
    }

    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

## 외부 의존성

| 서비스 | 용도 | 무료 한도 | 현재 상태 |
|---|---|---|---|
| Firebase Firestore | 투표 세션 저장 | Spark 무료 (50K read/일) | DAU 1만 까지 무료 가능 |
| 카카오 Local API | 식당 검색 | 일 100,000건 무료 | DAU 1만 도 여유 |
| AppsInToss | 호스팅 + SDK | 무료 | 영구 무료 (광고 수익 X) |

## 동시성 처리

### 투표 종료 시 race condition

여러 클라이언트가 동시에 expiresAt 시점에 도달하면 동시에 close 시도. 해결책:

- 클라이언트에서 closingRef 로 중복 호출 방지
- 같은 입력 데이터로 같은 결과 계산 → race condition 자체가 무해
- Firestore last-write-wins 정책 활용
- runoff 도 동일 패턴

→ `lib/voteEngine.ts` 와 `screens/VoteSessionScreen.tsx` 참고.

## 성능 최적화

| 항목 | 적용 사항 |
|---|---|
| 코드 스플리팅 | React.lazy + Suspense (각 화면별 청크 분리) |
| 청크 분리 | firebase, tds 별도 청크 (Rolldown manualChunks) |
| ES2020 target | 구형 안드로이드 WebView 호환 |
| 이미지 | 외부 토스 CDN (정적 URL) |
| Firestore | 단일 onSnapshot (실시간 + 효율) |
| 캐싱 | localStorage (shortlist, voted) |

## 빌드 산출물

```bash
$ npx ait build

dist/
├── index.html                    (1.5KB)
├── assets/
│   ├── index-*.js                (8KB)         ← 엔트리
│   ├── tds-*.js                  (1.1MB)       ← TDS 청크
│   ├── firebase-*.js             (254KB)       ← Firebase 청크
│   ├── chunk-OE4NN4TA-*.js       (40KB)        ← 공통 청크
│   ├── HomeScreen-*.js           (6KB)
│   ├── RouletteScreen-*.js       (3.6KB)
│   ├── NearbyScreen-*.js         (4.5KB)
│   ├── VoteCreateScreen-*.js     (3.7KB)
│   ├── VoteSessionScreen-*.js    (6.3KB)
│   ├── VoteResultScreen-*.js     (8KB)
│   └── voteEngine-*.js           (1.1KB)
│
jumsim-mukgo.ait                  (4.2MB, gzip)
```

**deploymentId**: 빌드마다 고유 ID 자동 생성. 콘솔에서 해당 버전 식별용.
