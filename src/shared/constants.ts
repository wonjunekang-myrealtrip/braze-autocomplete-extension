// 캐시 관련 상수
export const CACHE_KEYS = {
  ATTRIBUTES: 'braze_attributes',
  LAST_SYNC: 'last_sync_time',
  USER_PREFERENCES: 'user_preferences'
} as const;

// 캐시 TTL (24시간)
export const CACHE_TTL = 24 * 60 * 60 * 1000;

// 자동완성 설정
export const AUTOCOMPLETE_CONFIG = {
  MIN_QUERY_LENGTH: 1,           // 최소 검색 글자 수 (1글자부터!)
  MAX_RESULTS: 10,               // 최대 결과 수
  DEBOUNCE_DELAY: 100,           // 디바운스 지연 (ms) - 더 빠르게
  DROPDOWN_Z_INDEX: 99999,       // 드롭다운 z-index - 더 높게
} as const;

// Braze DOM 선택자
export const BRAZE_SELECTORS = {
  // 일반적인 입력 필드 선택자들
  INPUT_FIELDS: [
    // 🎯 실제 Braze DOM 구조 기반 선택자들
    // Custom Attributes 선택 드롭다운
    '.custom_attributes_filter .bcl-select__input',
    '.sc-kLeMFj.custom_attributes_filter input.bcl-select__input',
    
    // Attribute value 입력 필드 (가장 중요!)
    '.filter-input-any input.bcl-input',
    '.filter-input-any-string input[type="text"]',
    '.sc-dYkizD input.bcl-input',
    'input.StyledInput-sc-1nagddx-0',
    
    // 새 필터 추가 검색창
    '.db-new-filter-input input.bcl-select__input',
    'input#react-select-7-input',
    'input[placeholder="Search filter..."]',
    
    // 기타 Braze 선택자들
    '.segment-filter-container input[type="text"]',
    '[data-cy="condition-group"] input[type="text"]',
    '[role="filter"] input[type="text"]',
    
    // 폴백 선택자
    '.bcl-input-group input',
    '.StyledInputGroup-sc-qngaxy-0 input',
    'input.bcl-input:not([readonly])',
    'input[type="text"]:not([readonly])'
  ],
  CONTAINERS: [
    // 실제 Braze 컨테이너들
    '[data-cy="condition-group"]',
    '.segment-filter-container',
    '.custom_attributes_filter',
    '.filter-input',
    '[role="filterGroup"]',
    '[role="filter"]',
    '.sc-lfKwDm',  // 필터 그룹 컨테이너
    '.sc-fXvdRq'   // 드래그 가능한 필터 영역
  ]
} as const;

// 카테고리 색상 매핑
export const CATEGORY_COLORS = {
  '회원정보': '#3B82F6',    // 파란색
  '지역정보': '#10B981',    // 초록색
  '구매정보': '#F59E0B',    // 주황색
  '행동정보': '#8B5CF6',    // 보라색
  '기타': '#6B7280'        // 회색
} as const;
