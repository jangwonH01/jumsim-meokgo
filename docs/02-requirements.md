# 점심먹Go — 요구사항 정의서

## 🟢 v1.0 MUST (출시 완료)

| ID | 요구사항 | 구현 위치 | 상태 |
|---|---|---|---|
| F-001 | 홈 화면 — 룰렛/근처/투표 진입점 | `screens/HomeScreen.tsx` | ✅ |
| F-002 | 랜덤 룰렛 메뉴 추첨 | `screens/RouletteScreen.tsx` | ✅ |
| F-003 | 메뉴 후보 입력 + 추천 메뉴 제공 | `screens/RouletteScreen.tsx` | ✅ |
| F-004 | 근처 식당 검색 (카카오 Local API) | `screens/NearbyScreen.tsx` + `lib/kakao.ts` | ✅ |
| F-005 | 위치 기반 식당 (반경 500m) | `lib/location.ts` | ✅ |
| F-006 | 후보 담기 (shortlist localStorage) | `lib/shortlist.ts` + `lib/useShortlist.ts` | ✅ |
| F-007 | 팀 투표 생성 (Firestore) | `screens/VoteCreateScreen.tsx` | ✅ |
| F-008 | 실시간 투표 (onSnapshot) | `screens/VoteSessionScreen.tsx` | ✅ |
| F-009 | 투표 결과 그래프 (득표율) | `screens/VoteSessionScreen.tsx` | ✅ |
| F-010 | 토스 공유 (getTossShareLink) | `lib/share.ts` | ✅ |
| F-011 | 비게임 식별키 (getAnonymousKey) | `lib/useAnonymousKey.ts` | ✅ |
| F-012 | ErrorBoundary | `lib/ErrorBoundary.tsx` | ✅ |

## 🟢 v1.1 MUST (구현 완료, 검수 대기)

| ID | 요구사항 | 구현 위치 | 상태 |
|---|---|---|---|
| F-101 | 투표 종료 시간 선택 (5/15/30분) | `screens/VoteCreateScreen.tsx` | ✅ |
| F-102 | 카운트다운 표시 (mm:ss) | `screens/VoteSessionScreen.tsx` | ✅ |
| F-103 | 자동 종료 (expiresAt 도달 시) | `lib/voteEngine.ts` | ✅ |
| F-104 | 수동 종료 ("지금 결정" 버튼) | `screens/VoteSessionScreen.tsx` | ✅ |
| F-105 | 동률 시 결선 투표 자동 시작 (2분) | `lib/voteEngine.ts` | ✅ |
| F-106 | 결선 투표 화면 | `screens/VoteSessionScreen.tsx` | ✅ |
| F-107 | 결선 동률 시 자동 룰렛 결정 | `lib/voteEngine.ts` | ✅ |
| F-108 | 결과 확정 화면 (vote/runoff/roulette) | `screens/VoteResultScreen.tsx` | ✅ |
| F-109 | 룰렛 애니메이션 (1.5초) | `screens/VoteResultScreen.tsx` | ✅ |
| F-110 | v1.0 데이터 호환 (status 미설정 폴백) | `screens/VoteSessionScreen.tsx` | ✅ |

## 🟢 v1.2 MUST (구현 완료, 검수 대기)

| ID | 요구사항 | 구현 위치 | 상태 |
|---|---|---|---|
| F-201 | 메뉴 확정 후 근처 식당 자동 추천 | `screens/VoteResultScreen.tsx` | ✅ |
| F-202 | 카카오 keyword 검색 (메뉴명) | `lib/kakao.ts: searchRestaurantsByMenu` | ✅ |
| F-203 | 검색 반경 선택 (500m/1km/2km) | `screens/VoteResultScreen.tsx` | ✅ |
| F-204 | 카카오맵 장소 상세 페이지 링크 | `lib/kakao.ts` | ✅ |
| F-205 | 카카오맵 길찾기 외부 링크 | `lib/kakao.ts: buildKakaoDirectionsUrl` | ✅ |
| F-206 | 식당 결과 거리순 정렬 (최대 10개) | `screens/VoteResultScreen.tsx` | ✅ |
| F-207 | 검색 실패 시 폴백 (위치 권한 거부 등) | `screens/VoteResultScreen.tsx` | ✅ |

## 🟡 v1.3+ SHOULD (다음 우선순위)

| ID | 요구사항 | 우선순위 |
|---|---|---|
| F-301 | 자주 가는 식당 즐겨찾기 | ⭐⭐⭐ |
| F-302 | 자주 먹는 메뉴 즐겨찾기 | ⭐⭐⭐ |
| F-303 | 투표 이력 보기 (지난 결정들) | ⭐⭐ |
| F-304 | 위치 권한 거부 시 수동 위치 입력 | ⭐⭐ |
| F-305 | 검색 (메뉴 키워드 직접 검색) | ⭐⭐ |
| F-306 | 식당 평점 / 별점 (외부 API 활용) | ⭐ |

## 🔵 v2.0+ NICE (장기)

| ID | 요구사항 | 비고 |
|---|---|---|
| F-401 | 사용자 통계 / 리포트 | "이번 달 가장 많이 먹은 메뉴" |
| F-402 | 팀 그룹 영구 저장 | 매번 카톡 안 보내고 한 번에 |
| F-403 | 알림 (마감 임박, 새 메뉴 추천) | 토스 푸시 |
| F-404 | 토스 로그인 통합 | 디바이스 간 동기화 |
| F-405 | B2B 식당 광고 | 사장님 등록 + 노출 |
| F-406 | 배달앱 딥링크 | 배민/요기요로 핸드오프 |

## 🚫 제외 (의도적으로 안 함)

- 외부 로그인 (Google, Facebook 등) — 토스 정책상 토스 로그인만 가능
- 외부 광고 네트워크 (AdMob 등) — 토스 정책상 금지
- 사진 업로드 / 음식 사진 자체 제작 — 보안/운영 부담
- 식당 리뷰 시스템 — 명예훼손 리스크
- 결제 / 주문 기능 — 배달앱이 더 잘함

## 비기능 요구사항 (Non-Functional)

| 항목 | 요구사항 | 현재 |
|---|---|---|
| 성능 | 첫 화면 로드 < 3초 | ✅ Vite + Rolldown |
| 호환성 | Android 7+ / iOS 16+ | ✅ ES2020 target |
| 보안 | 익명 데이터만 처리 | ✅ getAnonymousKey only |
| 정책 준수 | 비게임 출시 가이드 | ✅ 모든 항목 |
| 가용성 | Firestore 99.95% SLA | ✅ Firebase |
| 번들 크기 | < 5MB | ✅ 4.2MB |
