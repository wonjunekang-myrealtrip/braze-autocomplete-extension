# API 호출 및 캐싱 전략

## 📊 Google Sheets 데이터 구조

### 데이터 매핑
- **인덱스 2**: Custom Attributes (속성명)
- **인덱스 3**: Name (한글명)
- **인덱스 5**: Description (설명)
- **인덱스 9**: 자동완성 메타 타입
- **인덱스 10**: ENUM 값들 (메타가 ENUM일 경우)

### 자동완성 메타 타입
- `NONE`: 자동완성 없음
- `CITY`: 도시 API 연동
- `COUNTRY`: 국가 API 연동
- `ENUM`: 정해진 값 목록 사용
- `PRODUCT`: 상품 API 연동
- `CATEGORY`: 카테고리 API 연동
- `DATE`: 날짜 선택기
- `NUMBER_RANGE`: 숫자 범위 입력

## 🚀 API 호출 시점 전략

### 1. **즉시 로드 (Eager Loading)**
```javascript
// Extension 설치/업데이트 시
chrome.runtime.onInstalled → Google Sheets 데이터 즉시 로드
```
- ✅ 장점: 첫 사용 시 빠른 응답
- ❌ 단점: 초기 로딩 시간, 불필요한 데이터 로드

### 2. **지연 로드 (Lazy Loading)** ⭐ 추천
```javascript
// 사용자가 Braze 페이지 방문 시
content script 초기화 → background에 데이터 요청 → 캐시 확인 → 필요시 API 호출
```
- ✅ 장점: 필요할 때만 로드, 효율적
- ❌ 단점: 첫 사용 시 약간의 지연

### 3. **예측 로드 (Predictive Loading)**
```javascript
// Braze 도메인 감지 시 미리 로드
tabs.onUpdated → URL이 dashboard.braze.com 포함 → 백그라운드에서 미리 로드
```
- ✅ 장점: 사용 시점에 이미 준비됨
- ❌ 단점: 복잡한 로직

## 💾 캐싱 전략

### 1. **계층적 캐싱 구조**

```
┌─────────────────────────────────────┐
│         Memory Cache (RAM)          │ ← 가장 빠름 (세션 동안만)
├─────────────────────────────────────┤
│     Chrome Storage Local API        │ ← 영구 저장
├─────────────────────────────────────┤
│         Google Sheets API           │ ← 원본 데이터
└─────────────────────────────────────┘
```

### 2. **TTL (Time To Live) 전략**

| 데이터 타입 | TTL | 갱신 주기 | 이유 |
|------------|-----|----------|------|
| Attributes 메타데이터 | 24시간 | 매일 오전 9시 | 자주 변경되지 않음 |
| CITY 데이터 | 7일 | 주 1회 | 도시 정보는 거의 고정 |
| ENUM 값들 | 24시간 | Attributes와 동기화 | 비즈니스 로직 변경 가능 |
| PRODUCT 데이터 | 30분 | 실시간성 필요 | 상품 정보는 자주 변경 |

### 3. **캐시 무효화 전략**

```javascript
// 수동 새로고침
popup.html → "데이터 새로고침" 버튼 → 강제 캐시 클리어

// 자동 무효화
- TTL 만료 시
- Extension 업데이트 시
- 에러 발생 시 (fallback to mock)

// 부분 무효화
- 특정 메타 타입별 개별 캐시 관리
```

### 4. **캐시 크기 관리**

```javascript
// Chrome Storage 제한: 5MB (local), 100KB (sync)
// 전략: 
1. 압축 저장 (JSON.stringify)
2. 오래된 데이터 자동 삭제
3. 사용 빈도 기반 우선순위
```

## 🔄 동기화 전략

### 백그라운드 동기화
```javascript
// 알람 기반 동기화
chrome.alarms.create('syncData', { periodInMinutes: 360 }); // 6시간마다

// 이벤트 기반 동기화
- 네트워크 복구 시
- Extension 시작 시
- 사용자 요청 시
```

### 증분 업데이트
```javascript
// 전체 데이터 대신 변경된 부분만 업데이트
1. 버전/타임스탬프 체크
2. 변경된 행만 가져오기 (향후 구현)
3. 머지 업데이트
```

## 📈 성능 최적화

### 1. **검색 최적화**
```javascript
// 인덱싱
- attribute 이름으로 Map 생성
- 자동완성 타입별 그룹화

// 디바운싱
- 입력 후 100ms 대기
- 연속 입력 시 이전 요청 취소
```

### 2. **메모리 관리**
```javascript
// WeakMap 사용 (가능한 경우)
// 사용하지 않는 데이터 자동 정리
// 큰 데이터는 청크 단위로 로드
```

## 🎯 구현 우선순위

### Phase 1 (현재)
- [x] Google Sheets 기본 연동
- [x] 기본 캐싱 구조
- [x] Mock 데이터 폴백

### Phase 2 (다음)
- [ ] CITY API 연동
- [ ] ENUM 값 처리
- [ ] 캐시 TTL 관리

### Phase 3 (향후)
- [ ] PRODUCT API 연동
- [ ] 증분 업데이트
- [ ] 압축 저장
- [ ] 오프라인 모드

## 🔌 API 엔드포인트 (예정)

```javascript
// CITY 데이터
GET /api/cities?q={query}&limit=10

// COUNTRY 데이터  
GET /api/countries?q={query}&limit=10

// PRODUCT 데이터
GET /api/products?q={query}&category={category}&limit=20

// CATEGORY 데이터
GET /api/categories?parent={parentId}
```

## 📝 사용 예시

```javascript
// Content Script에서 자동완성 요청
const attribute = 'CITY_NM';
const metadata = await getAttributeMetadata(attribute);

if (metadata.autocompleteType === 'CITY') {
  // 도시 자동완성 API 호출
  const cities = await fetchCityData(inputValue);
  showAutocomplete(cities);
} else if (metadata.autocompleteType === 'ENUM') {
  // ENUM 값 필터링
  const filtered = metadata.enumValues.filter(v => 
    v.toLowerCase().includes(inputValue.toLowerCase())
  );
  showAutocomplete(filtered);
}
```
