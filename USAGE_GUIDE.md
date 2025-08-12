# 🎯 Braze 자동완성 Chrome Extension 사용 가이드

## 📦 설치 방법

### 1. Extension 설치
1. Chrome 브라우저에서 `chrome://extensions/` 접속
2. 우측 상단의 **"개발자 모드"** 활성화
3. **"압축해제된 확장 프로그램을 로드합니다"** 클릭
4. `dist` 폴더 선택
5. Extension이 성공적으로 로드되면 브라우저 툴바에 아이콘이 나타남

### 2. 지원되는 Braze 도메인
- dashboard.braze.com
- dashboard-01~05.braze.com  
- dashboard.braze.eu (유럽 리전)
- dashboard-01~02.braze.eu

## 💡 사용 방법

### 기본 사용법

#### 1. 속성 검색
Braze 세그먼트 빌더나 캠페인 타겟팅 화면에서:

- **속성명으로 검색**: 
  - `CITY` 입력 → CITY_NM 속성 표시
  - `LEAVE` 입력 → LEAVE_FLAG 속성 표시
  - `MEMBER` 입력 → MEMBERSHIP_LEVEL 속성 표시

- **한글로 검색** (🌟 신기능):
  - `서울` 입력 → CITY_NM 속성 표시
  - `골드` 입력 → MEMBERSHIP_LEVEL 속성 표시
  - `안드로이드` 입력 → DEVICE_TYPE 속성 표시

- **영어로 검색** (🌟 신기능):
  - `seoul` 입력 → CITY_NM 속성 표시
  - `gold` 입력 → MEMBERSHIP_LEVEL 속성 표시
  - `android` 입력 → DEVICE_TYPE 속성 표시

#### 2. 값 선택
속성 선택 후 자동으로 값 제안이 표시됩니다:

- **Boolean 타입**: `참 (true)`, `거짓 (false)`
- **String 타입**: 
  - CITY_NM: `서울 (seoul)`, `부산 (busan)` 등
  - MEMBERSHIP_LEVEL: `골드 (gold)`, `실버 (silver)` 등
- **Number/Time 타입**: 직접 입력

### 키보드 단축키

| 키 | 기능 |
|---|---|
| `↑/↓` | 자동완성 항목 탐색 |
| `Enter` | 선택한 항목 확정 |
| `Escape` | 자동완성 창 닫기 |
| `Tab` | 다음 항목으로 이동 |

## 📊 지원 속성 목록

### 회원정보
- **LEAVE_FLAG**: 회원 탈퇴 여부 (Boolean)
- **MEMBERSHIP_LEVEL**: 회원 등급 (브론즈/실버/골드/플래티넘/다이아몬드)
- **EMAIL_VERIFIED**: 이메일 인증 여부 (Boolean)
- **PUSH_ENABLED**: 푸시 알림 허용 여부 (Boolean)
- **SUBSCRIPTION_STATUS**: 구독 상태 (활성/비활성/일시정지/취소됨)

### 지역정보
- **CITY_NM**: 거주 도시명 (서울/부산/대구 등 17개 시도)

### 구매정보
- **PURCHASE_COUNT**: 총 구매 횟수 (Number)
- **TOTAL_SPENT**: 총 구매 금액 (Number)
- **LAST_PURCHASE_DATE**: 최근 구매 날짜 (Time)

### 행동정보
- **LAST_LOGIN_DATE**: 최근 로그인 날짜 (Time)
- **FAVORITE_CATEGORIES**: 선호 카테고리 (Array)
- **DEVICE_TYPE**: 주 사용 기기 (iOS/안드로이드/웹/데스크톱)
- **LOGIN_COUNT_30D**: 최근 30일 로그인 횟수 (Number)

## 🔧 Extension 관리

### Popup 기능
Extension 아이콘 클릭 시:

1. **상태 정보 확인**
   - 총 속성 수: 20개
   - 마지막 동기화 시간
   - 카테고리별 속성 분포

2. **수동 동기화**
   - 데이터를 수동으로 갱신
   - 네트워크 문제 시 사용

3. **캐시 클리어**
   - 저장된 데이터 초기화
   - 문제 발생 시 사용

## 🐛 문제 해결

### 자동완성이 나타나지 않을 때
1. Extension이 활성화되어 있는지 확인
2. Braze 도메인이 지원 목록에 있는지 확인
3. 2글자 이상 입력했는지 확인
4. Popup에서 "수동 동기화" 실행
5. 캐시 클리어 후 페이지 새로고침

### 값이 제대로 입력되지 않을 때
1. Braze 페이지를 새로고침
2. Extension을 재로드 (`chrome://extensions/`에서)
3. Chrome 브라우저 재시작

## 📝 예시 시나리오

### 시나리오 1: 서울 거주자 타겟팅
1. 세그먼트 빌더에서 `서울` 입력
2. CITY_NM 속성 선택
3. `서울 (seoul)` 값 선택
4. 결과: `CITY_NM = "seoul"`

### 시나리오 2: VIP 회원 타겟팅
1. `골드` 또는 `gold` 입력
2. MEMBERSHIP_LEVEL 속성 선택
3. `골드 (gold)` 값 선택
4. 결과: `MEMBERSHIP_LEVEL = "gold"`

### 시나리오 3: 모바일 사용자 타겟팅
1. `안드로이드` 입력
2. DEVICE_TYPE 속성 선택
3. `안드로이드 (android)` 값 선택
4. 결과: `DEVICE_TYPE = "android"`

## 🚀 팁과 트릭

1. **빠른 검색**: 속성명의 일부만 입력해도 검색 가능
2. **다국어 검색**: 한글/영어 모두 지원
3. **카테고리 그룹**: 속성이 카테고리별로 정리되어 표시
4. **스마트 매칭**: Prefix 매칭 우선, Fuzzy 매칭 보조
5. **오프라인 지원**: 인터넷 연결 없이도 캐시된 데이터로 동작

## 📞 지원

문제가 발생하거나 추가 속성이 필요한 경우:
- 그로스 마케팅팀에 문의
- Extension 버전: v1.0.0
- 최종 업데이트: 2025-01-20

---

**Happy Targeting! 🎯**
