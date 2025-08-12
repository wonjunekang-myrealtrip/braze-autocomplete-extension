# API 연동 현황

## 📋 자동완성 메타 타입별 API 연동 대상

### 1. **CITY (도시)**
- **용도**: 도시명 자동완성
- **예상 응답 형식**:
```json
{
  "code": "SEL",
  "name": "Seoul",
  "name_ko": "서울",
  "country": "대한민국"
}
```
- **상태**: ⏳ Mock 데이터로 개발 중

### 2. **AIRPORT (공항)**
- **용도**: 공항 코드/이름 자동완성
- **예상 응답 형식**:
```json
{
  "iata_code": "ICN",
  "name": "Incheon International Airport",
  "name_ko": "인천국제공항",
  "city": "서울"
}
```
- **상태**: ⏳ Mock 데이터로 개발 중

### 3. **STANDARD_CATEGORY_LV_1 (표준 카테고리 레벨 1)**
- **용도**: 최상위 카테고리 선택
- **예상 응답 형식**:
```json
{
  "id": "TOUR",
  "name": "Tour & Activity",
  "name_ko": "투어/액티비티"
}
```
- **상태**: ⏳ Mock 데이터로 개발 중

### 4. **STANDARD_CATEGORY_LV_2 (표준 카테고리 레벨 2)**
- **용도**: 중간 카테고리 선택
- **예상 응답 형식**:
```json
{
  "id": "CITY_TOUR",
  "name": "City Tour",
  "name_ko": "시내투어",
  "parent_id": "TOUR",
  "parent_name": "투어/액티비티"
}
```
- **상태**: ⏳ Mock 데이터로 개발 중

### 5. **STANDARD_CATEGORY_LV_3 (표준 카테고리 레벨 3)**
- **용도**: 세부 카테고리 선택
- **예상 응답 형식**:
```json
{
  "id": "PARIS_CITY_TOUR",
  "name": "Paris City Tour",
  "name_ko": "파리 시내투어",
  "parent_lv1": "투어/액티비티",
  "parent_lv2": "시내투어"
}
```
- **상태**: ⏳ Mock 데이터로 개발 중

### 6. **COUNTRY (국가)**
- **용도**: 국가명/코드 자동완성
- **예상 응답 형식**:
```json
{
  "iso_code": "KR",
  "name": "South Korea",
  "name_ko": "대한민국",
  "continent": "아시아"
}
```
- **상태**: ⏳ Mock 데이터로 개발 중

### 7. **AIRLINE (항공사)**
- **용도**: 항공사 코드/이름 자동완성
- **예상 응답 형식**:
```json
{
  "iata_code": "KE",
  "name": "Korean Air",
  "name_ko": "대한항공",
  "country": "대한민국"
}
```
- **상태**: ⏳ Mock 데이터로 개발 중

### 8. **ENUM (열거형)**
- **용도**: 미리 정의된 값 목록
- **데이터 소스**: Google Sheets 인덱스 10
- **예시**: 
  - `GENDER`: ["M", "F", "기타"]
  - `MEMBERSHIP_LEVEL`: ["일반", "실버", "골드", "플래티넘"]
- **상태**: ✅ 구현 완료 (Google Sheets에서 직접 가져옴)

## 🔌 API 엔드포인트 정의 필요

실제 API 엔드포인트가 확정되면 `AutocompleteAPIService`의 다음 부분을 수정해야 합니다:

```typescript
// src/services/autocompleteAPIService.ts

// TODO: 실제 API 베이스 URL로 교체
private static readonly API_BASE_URL = 'https://api.myrealtrip.com';

// 각 메서드의 엔드포인트 수정
// 예시:
// ${this.API_BASE_URL}/api/cities → 실제 엔드포인트
// ${this.API_BASE_URL}/api/airports → 실제 엔드포인트
```

## 📊 Google Sheets 데이터 확인

현재 Google Sheets에서 가져오는 데이터:
- **속성명** (인덱스 2): `CITY_NM`, `COUNTRY_CD`, etc.
- **한글명** (인덱스 3): "거주 도시명", "국가 코드", etc.
- **설명** (인덱스 5): 상세 설명
- **자동완성 메타** (인덱스 9): `CITY`, `ENUM`, `NONE`, etc.
- **ENUM 값** (인덱스 10): ENUM 타입일 경우의 값 목록

## 🚀 다음 단계

1. **실제 API 엔드포인트 확인**
   - 각 메타 타입별 실제 API URL
   - 인증 방식 (API Key, OAuth 등)
   - Rate Limiting 정책

2. **응답 형식 확인**
   - 실제 API 응답 구조
   - 에러 처리 방식
   - 페이지네이션 지원 여부

3. **캐싱 정책 조정**
   - 각 API별 적절한 TTL 설정
   - 오프라인 지원 범위

## 📝 테스트 시나리오

### ENUM 타입 테스트
```javascript
// attribute: "GENDER"
// autocompleteType: "ENUM"
// enumValues: ["M", "F", "기타"]
// 입력: "M" → ["M"] 표시
```

### CITY 타입 테스트
```javascript
// attribute: "CITY_NM"
// autocompleteType: "CITY"
// 입력: "서울" → API 호출 → ["서울", "서울특별시"] 표시
```

### 복합 검색 테스트
```javascript
// STANDARD_CATEGORY_LV_2
// 입력: "투어" → ["시내투어", "스냅투어", "테마투어"] 표시
```
