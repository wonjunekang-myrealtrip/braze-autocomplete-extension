# Braze 자동완성 Chrome Extension 개발 명세서 (1차 출시)

## 📋 프로젝트 개요

### 목표
Braze 화면에서 Custom Attributes 입력 시 실시간 자동완성 기능 제공하는 Chrome Extension 개발

### 범위 (MVP)
- 속성명 자동완성
- 데이터 타입별 값 제안
- 구글시트 기반 메타데이터 활용 (목 데이터로 시작)
- 오프라인 캐싱 지원

---

## 🏗️ 기술 아키텍처

### 기술 스택
- **Extension**: Manifest V3, TypeScript, React
- **UI Framework**: React + Tailwind CSS
- **상태 관리**: React Context + useReducer
- **데이터 저장**: Chrome Storage API
- **API 통신**: Chrome Extension APIs
- **빌드 도구**: Vite + TypeScript

### 시스템 구조
```
Chrome Extension
├── Background Script (Service Worker)
│   ├── 데이터 동기화
│   ├── 캐싱 관리
│   └── API 통신
├── Content Script
│   ├── DOM 조작
│   ├── 자동완성 UI 주입
│   └── 사용자 입력 감지
└── Popup/Options
    ├── 설정 관리
    ├── 데이터 상태 확인
    └── 수동 동기화
```

---

## 📊 데이터 구조 설계

### 메타데이터 구조 (Mock Data)
```typescript
interface AttributeMetadata {
  attribute_name: string;          // 속성명 (예: "LEAVE_FLAG")
  data_type: DataType;            // 데이터 타입
  description: string;            // 속성 설명
  possible_values: string[];      // 가능한 값들
  examples: string[];            // 예시 값들
  usage_notes?: string;          // 사용 시 주의사항
  category?: string;             // 카테고리 (선택)
}

type DataType = 
  | 'Boolean' 
  | 'String' 
  | 'Number' 
  | 'Array' 
  | 'Time' 
  | 'Object' 
  | 'Object Array';
```

### 목 데이터 샘플
```typescript
const mockAttributes: AttributeMetadata[] = [
  {
    attribute_name: "LEAVE_FLAG",
    data_type: "Boolean",
    description: "회원 탈퇴 여부",
    possible_values: ["true", "false"],
    examples: ["true", "false"],
    usage_notes: "탈퇴한 회원 필터링 시 사용",
    category: "회원정보"
  },
  {
    attribute_name: "CITY_NM",
    data_type: "String",
    description: "거주 도시명",
    possible_values: ["서울", "부산", "대구", "인천", "광주", "대전", "울산"],
    examples: ["서울", "부산"],
    usage_notes: "지역별 타겟팅 시 사용",
    category: "지역정보"
  },
  {
    attribute_name: "PURCHASE_COUNT",
    data_type: "Number",
    description: "총 구매 횟수",
    possible_values: [],
    examples: ["0", "1", "5", "10"],
    usage_notes: "구매 경험 기반 세그먼트 시 사용",
    category: "구매정보"
  }
];
```

---

## 🎯 핵심 기능 명세

### 1. 자동완성 기능

#### 1.1 속성명 자동완성
- **트리거**: 2글자 이상 입력 시
- **검색 방식**: 
  - Prefix 매칭 우선
  - Fuzzy 매칭 보조
  - 카테고리별 그룹핑
- **UI**: 드롭다운 리스트 형태
- **키보드 네비게이션**: 화살표 키, Enter, Escape 지원

#### 1.2 값 자동완성
- **Boolean**: true/false 옵션
- **String**: possible_values 기반 제안
- **Number**: 예시 값 + 직접 입력 가능
- **기타**: 예시 값 표시

#### 1.3 컨텍스트 정보
- **툴팁**: 속성 설명, 예시, 사용 노트
- **타입 표시**: 데이터 타입 뱃지
- **카테고리**: 색상으로 구분

### 2. 사용자 인터페이스

#### 2.1 자동완성 드롭다운
```
┌─────────────────────────────────────┐
│ 🏷️ LEAVE_FLAG          [Boolean]    │
│ 회원 탈퇴 여부                        │
│ 예시: true, false                   │
├─────────────────────────────────────┤
│ 🌍 CITY_NM             [String]     │
│ 거주 도시명                          │
│ 예시: 서울, 부산                     │
└─────────────────────────────────────┘
```

#### 2.2 값 제안 UI
```
┌─────────────────────────────────────┐
│ CITY_NM 값 선택                     │
├─────────────────────────────────────┤
│ ✓ 서울                              │
│ ✓ 부산                              │
│ ✓ 대구                              │
│ ✓ 인천                              │
│ ✓ 직접 입력...                       │
└─────────────────────────────────────┘
```

### 3. 데이터 관리

#### 3.1 캐싱 전략
- **Chrome Storage API** 사용
- **TTL**: 24시간
- **백그라운드 동기화**: 1시간마다
- **수동 갱신**: 옵션 페이지에서 가능

#### 3.2 오프라인 지원
- 캐시된 데이터로 완전한 오프라인 동작
- 네트워크 상태 감지 및 UI 피드백
- 동기화 실패 시 로컬 데이터 유지

---

## 🔧 개발 구조

### 파일 구조
```
braze-autocomplete-extension/
├── public/
│   ├── manifest.json
│   └── icons/
├── src/
│   ├── background/
│   │   ├── index.ts              # Service Worker
│   │   ├── dataSync.ts           # 데이터 동기화
│   │   └── storage.ts            # 스토리지 관리
│   ├── content/
│   │   ├── index.tsx             # Content Script 진입점
│   │   ├── AutocompleteUI.tsx    # 자동완성 UI 컴포넌트
│   │   ├── BrazeDOMHandler.ts    # Braze DOM 조작
│   │   └── InputDetector.ts      # 입력 감지
│   ├── popup/
│   │   ├── index.tsx             # Popup 페이지
│   │   ├── StatusPanel.tsx       # 상태 표시
│   │   └── SettingsPanel.tsx     # 설정
│   ├── shared/
│   │   ├── types.ts              # 타입 정의
│   │   ├── constants.ts          # 상수
│   │   ├── mockData.ts           # 목 데이터
│   │   └── utils.ts              # 유틸리티
│   └── styles/
│       └── tailwind.css
├── package.json
├── vite.config.ts
├── tailwind.config.js
└── tsconfig.json
```

### 핵심 컴포넌트

#### AutocompleteUI.tsx
```typescript
interface AutocompleteUIProps {
  inputElement: HTMLInputElement;
  attributes: AttributeMetadata[];
  onSelect: (attribute: AttributeMetadata, value?: string) => void;
}

export const AutocompleteUI: React.FC<AutocompleteUIProps> = ({
  inputElement,
  attributes,
  onSelect
}) => {
  // 자동완성 드롭다운 렌더링
  // 키보드 네비게이션 처리
  // 선택 이벤트 처리
};
```

#### BrazeDOMHandler.ts
```typescript
class BrazeDOMHandler {
  // Braze 화면의 입력 필드 감지
  detectInputFields(): HTMLInputElement[]
  
  // 자동완성 UI 위치 계산
  calculatePosition(input: HTMLInputElement): { top: number, left: number }
  
  // 값 삽입
  insertValue(input: HTMLInputElement, value: string): void
}
```

---

## 📅 7일 개발 일정

### Day 1: 프로젝트 셋업 및 기본 구조
- ✅ Vite + React + TypeScript 환경 구성
- ✅ Chrome Extension Manifest V3 설정
- ✅ 기본 파일 구조 생성
- ✅ 목 데이터 정의 및 타입 시스템 구축

### Day 2: Background Script 및 데이터 관리
- ✅ Service Worker 기본 구조
- ✅ Chrome Storage API 연동
- ✅ 목 데이터 로딩 및 캐싱 시스템
- ✅ 데이터 동기화 로직

### Day 3: Content Script 및 DOM 조작
- ✅ Braze 화면 DOM 구조 분석
- ✅ 입력 필드 감지 로직
- ✅ React 컴포넌트 동적 주입 시스템
- ✅ 기본 이벤트 리스너 설정

### Day 4-5: 자동완성 UI 구현
- ✅ AutocompleteUI 컴포넌트 개발
- ✅ 검색 및 필터링 로직
- ✅ 키보드 네비게이션
- ✅ 값 제안 시스템
- ✅ 툴팁 및 컨텍스트 정보 표시

### Day 6: Popup 및 설정 페이지
- ✅ 상태 모니터링 UI
- ✅ 수동 동기화 기능
- ✅ 설정 관리
- ✅ 디버깅 정보 표시

### Day 7: 테스트 및 배포 준비
- ✅ 전체 기능 통합 테스트
- ✅ 크로스 브라우저 테스트
- ✅ 성능 최적화
- ✅ Chrome Web Store 배포 준비

---

## 🧪 테스트 전략

### 1. 단위 테스트
- 검색 알고리즘 정확성
- 데이터 캐싱 로직
- UI 컴포넌트 렌더링

### 2. 통합 테스트
- Content Script ↔ Background Script 통신
- DOM 조작 및 이벤트 처리
- 자동완성 플로우 전체

### 3. 사용자 테스트
- Braze 실제 화면에서 동작 확인
- 다양한 입력 시나리오 테스트
- 성능 및 사용성 검증

---

## 🚀 성공 지표

### 기능적 지표
- ✅ 2글자 입력 시 0.3초 이내 자동완성 표시
- ✅ 속성명 검색 정확도 95% 이상
- ✅ 오프라인 모드 완벽 동작
- ✅ 메모리 사용량 50MB 이하

### 사용성 지표
- ✅ 입력 시간 70% 단축 (5분 → 1.5분)
- ✅ 속성명 오타 90% 감소
- ✅ 사용자 만족도 4.0/5.0 이상

---

## 🔄 향후 확장 계획

### v1.1 (1차 출시 이후)
- 구글시트 실시간 연동
- 사용 통계 수집
- 개인화 설정

### v2.0 (개선 버전)
- 그래프DB 기반 스마트 추천
- AI 기반 성과 예측
- 자연어 처리

---

**작성일**: 2025-01-20  
**작성자**: AI Assistant  
**검토 대상**: 그로스 마케팅팀, 개발팀
