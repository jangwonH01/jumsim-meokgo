/**
 * 광고 그룹 ID 설정.
 *
 * ⚠️ 지금은 테스트 ID(개발용)예요. 출시 전 순서:
 *   1) 토스 콘솔 → 점심먹GO → 인앱 광고 → 광고 그룹 → 배너(문구강조/리스트형) 생성
 *   2) 발급된 실제 adGroupId(ait.v2.live.xxxx)를 아래 banner 에 넣고
 *   3) USING_TEST_ADS 를 false 로 변경 후 재빌드
 *   (실제 ID로 개발 테스트하면 정책 위반이라 지금은 테스트 ID 유지)
 *
 * 테스트 ID: 배너 ait-ad-test-banner-id
 */

export const USING_TEST_ADS = false;

export const AD = {
  /** 홈·룰렛·투표결과 화면 하단 배너 (실제 광고 그룹) */
  banner: 'ait.v2.live.5cd2649f39114749',
} as const;
