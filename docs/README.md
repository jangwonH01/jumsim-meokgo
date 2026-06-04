# 점심먹Go — 문서

> 점심 메뉴 결정에 매번 30분 쓰지 않아도 되는 토스 미니앱
> 출시: 2026-05-31 (사업자 워크스페이스, AppsInToss)
> 현재 버전: v1.2 (0.1.3)

## 📚 문서 목차

| 번호 | 문서 | 설명 |
|---|---|---|
| [01](./01-product-definition.md) | 제품 정의서 | 한 줄 정의, 타겟 사용자, 차별점, 비즈니스 모델 |
| [02](./02-requirements.md) | 요구사항 정의서 | v1.0/v1.1/v1.2 기능 명세 + 향후 로드맵 |
| [03](./03-screen-flow.md) | 화면 흐름도 | 6개 화면 + 사용자 여정 + 상태 전이 |
| [04](./04-architecture.md) | 아키텍처 & 데이터 모델 | 기술 스택, 폴더 구조, 데이터 흐름, Firestore 규칙 |
| [05](./05-policy-checklist.md) | AppsInToss 정책 점검표 | 모든 정책 항목 + 검수 이력 |
| [06](./06-roadmap.md) | 로드맵 | v1.3 ~ v3.0 + KPI + 의사결정 트리거 |

## 🚀 빠른 시작

### 로컬 개발

```bash
cd jumsim-meokgo
npm install
npm run dev
# http://localhost:5173 접속
```

### 빌드

```bash
npm run build       # vite build (TypeScript 체크 + 번들)
npx ait build       # .ait 산출 (콘솔 업로드용)
```

### 환경 변수 (.env.local)

```bash
# Firebase config (daligo-e4dd3 프로젝트의 "점심먹Go" 웹앱)
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=daligo-e4dd3.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=daligo-e4dd3
VITE_FIREBASE_STORAGE_BUCKET=daligo-e4dd3.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...

# Kakao Local REST API
VITE_KAKAO_REST_KEY=...
```

## 🎯 핵심 흐름 한눈에

```
1. 룰렛으로 메뉴 추첨 OR 근처 식당 검색
2. 후보 담기 (2~20개)
3. 팀 투표 만들기 + 시간 선택 (5/15/30분)
4. 카톡 공유 → 동료들 투표
5. 시간 종료 또는 "지금 결정"
6. 단독 1위 → 결과 / 동률 → 결선 → 룰렛
7. 결과 화면에서 메뉴 + 근처 식당 자동 추천 + 카카오맵 길찾기
```

## 📦 빌드 정보

| 항목 | 값 |
|---|---|
| appName | `jumsim-mukgo` |
| 표시명 | `점심먹Go` |
| Primary Color | `#63B3ED` |
| SDK 버전 | `@apps-in-toss/web-framework@2.4.7` |
| 번들 크기 | ~4.2MB |
| 워크스페이스 | New project (사업자 등록) |

## 🔗 외부 자원

- GitHub: https://github.com/jangwonH01/jumsim-meokgo
- AppsInToss 콘솔: https://apps-in-toss.toss.im/
- Firebase: https://console.firebase.google.com/project/daligo-e4dd3
- Kakao Developers: https://developers.kakao.com/

## 📋 작성 규칙

본 문서들은 사용자 (개발자/관리자) 가 참고하는 1차 자료입니다. 코드 변경 시 관련 문서도 함께 업데이트하세요.

**문서 우선순위**:
- 01 제품 정의: 분기마다 검토
- 02 요구사항: 마이너 버전 (v1.x) 마다 업데이트
- 03 화면 흐름: 새 화면 추가 시 업데이트
- 04 아키텍처: 기술 스택 변경 시 업데이트
- 05 정책 점검: 분기마다 검토 (정책은 자주 바뀜)
- 06 로드맵: 매월 검토 / 업데이트
