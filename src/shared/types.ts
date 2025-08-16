// Attribute 관련 타입 정의
export interface AttributeMetadata {
  attribute: string;      // Custom Attributes (인덱스 2)
  name: string;          // Name (인덱스 3)
  description: string;   // Description (인덱스 5)
  autocompleteType: string; // 자동완성 메타 (인덱스 9)
  enumValues?: Array<{    // ENUM 값 (인덱스 10)
    value: string;        // 실제 값 (key)
    label: string;        // 표시 레이블 (한글명)
  }>;
  dataType?: string;       // Data Type (인덱스 4)
}

// Event 관련 타입 정의
export interface EventMetadata {
  event: string;           // Custom Events (B열, 인덱스 1)
  name: string;            // 이벤트명 (C열, 인덱스 2)
  description?: string;    // Description (F열, 인덱스 5)
  autocompleteTypes?: string[]; // 자동완성 메타 (I열, 인덱스 8) - 복수 선택 가능
  enumValues?: Array<{     // ENUM 값 (J열, 인덱스 9)
    value: string;         // 실제 값 (key)
    label: string;         // 표시 레이블 (한글명)
  }>;
}

export interface SearchResult {
  value: string;
  label: string;
  description?: string;
  score: number;
  type?: 'attribute' | 'value';
}

// 자동완성 메타 타입
export type AutocompleteMetaType = 
  | 'NONE'           // 자동완성 없음
  | 'CITY'           // 도시 자동완성
  | 'COUNTRY'        // 국가 자동완성
  | 'ENUM'           // 정해진 값 목록
  | 'PRODUCT'        // 상품 자동완성
  | 'CATEGORY'       // 카테고리 자동완성
  | 'DATE'           // 날짜 선택
  | 'NUMBER_RANGE';  // 숫자 범위

// API 응답 타입
export interface GoogleSheetsResponse {
  range: string;
  majorDimension: string;
  values: string[][];
}

// 캐시 관련 타입
export interface CacheData<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

export interface AutocompleteCache {
  attributes: CacheData<AttributeMetadata[]>;
  cityData?: CacheData<any[]>;
  countryData?: CacheData<any[]>;
  productData?: CacheData<any[]>;
  categoryData?: CacheData<any[]>;
}