import { AttributeMetadata, EventMetadata } from './types';

// Google Sheets 데이터 기반 목 데이터
export const mockAttributes: AttributeMetadata[] = [
  // ===== 회원 정보 =====
  {
    attribute: "APP_INSTALL_FLAG",
    name: "앱 설치 유무",
    description: "aos, ios 접속 기록이 존재시 설치로 판단",
    autocompleteType: "NONE",
    dataType: "Boolean"
  },
  {
    attribute: "DORMANT_FLAG",
    name: "휴면계정 여부",
    description: "휴면 계정 여부를 판단하는 필터 (T/F)",
    autocompleteType: "NONE",
    dataType: "Boolean"
  },
  {
    attribute: "CURRENT_MILEAGE_PRICE",
    name: "보유하고 있는 마일리지",
    description: "유저가 보유하고 있는 마일리지 기준으로 타겟팅",
    autocompleteType: "NONE",
    dataType: "Integer"
  },
  
  // ===== 도시 타입 (CITY) =====
  {
    attribute: "CITY_NM",
    name: "도시명",
    description: "사용자 거주 도시",
    autocompleteType: "CITY",
    dataType: "String"
  },
  {
    attribute: "EXPT_ETC_TRAVEL_CITY",
    name: "예정 기타 예약 도시",
    description: "가장 가까이 예정된 여행의 도시",
    autocompleteType: "CITY",
    dataType: "String"
  },
  {
    attribute: "EXPT_FLIGHT_TRAVEL_CITY",
    name: "예정 항공 예약 도시",
    description: "예정된 항공 여행 도시",
    autocompleteType: "CITY",
    dataType: "String"
  },
  
  // ===== 국가 타입 (COUNTRY) =====
  {
    attribute: "EXPT_ETC_TRAVEL_COUNTRY",
    name: "예정 기타 예약 국가",
    description: "예정된 기타 예약의 국가",
    autocompleteType: "COUNTRY",
    dataType: "String"
  },
  {
    attribute: "EXPT_FLIGHT_TRAVEL_COUNTRY",
    name: "예정 항공 예약 국가",
    description: "예정된 항공 여행 국가",
    autocompleteType: "COUNTRY",
    dataType: "String"
  },
  
  // ===== 카테고리 타입 =====
  {
    attribute: "EXPT_ETC_STANDARD_CATEGORY_LV_1_CD",
    name: "예정 기타 표준 카테고리 레벨1 코드",
    description: "예정된 기타 예약의 표준 카테고리 레벨1",
    autocompleteType: "STANDARD_CATEGORY_LV_1",
    dataType: "String"
  },
  {
    attribute: "EXPT_ETC_STANDARD_CATEGORY_LV_2_CD",
    name: "예정 기타 표준 카테고리 레벨2 코드",
    description: "예정된 기타 예약의 표준 카테고리 레벨2",
    autocompleteType: "STANDARD_CATEGORY_LV_2",
    dataType: "String"
  },
  {
    attribute: "EXPT_ETC_STANDARD_CATEGORY_LV_3_CD",
    name: "예정 기타 표준 카테고리 레벨3 코드",
    description: "예정된 기타 예약의 표준 카테고리 레벨3",
    autocompleteType: "STANDARD_CATEGORY_LV_3",
    dataType: "String"
  },
  
  // ===== ENUM 타입 =====
  {
    attribute: "EXPT_ETC_TRAVEL_RESVE_PURPOSE",
    name: "예정 기타 여행 목적",
    description: "예정된 기타 예약의 여행 목적",
    autocompleteType: "ENUM",
    dataType: "String",
    enumValues: [
      { value: "friends", label: "친구와" },
      { value: "parents", label: "부모님과" },
      { value: "lover", label: "연인과" },
      { value: "official", label: "공적인" },
      { value: "partner", label: "배우자와" },
      { value: "children", label: "아이와" },
      { value: "alone", label: "혼자" },
      { value: "honeymoon", label: "신혼여행" },
      { value: "etc", label: "기타" }
    ]
  },
  {
    attribute: "GRADE_CD",
    name: "회원 등급",
    description: "회원 등급 코드",
    autocompleteType: "ENUM",
    dataType: "String",
    enumValues: [
      { value: "normal", label: "일반" },
      { value: "samoa", label: "사모아" }
    ]
  },
  {
    attribute: "RECENT_TRAVEL_RESVE_PURPOSE",
    name: "최근 여행 목적",
    description: "최근 여행의 목적",
    autocompleteType: "ENUM",
    dataType: "String",
    enumValues: [
      { value: "friends", label: "친구와" },
      { value: "parents", label: "부모님과" },
      { value: "lover", label: "연인과" },
      { value: "official", label: "공적인" },
      { value: "partner", label: "배우자와" },
      { value: "children", label: "아이와" },
      { value: "alone", label: "혼자" },
      { value: "honeymoon", label: "신혼여행" },
      { value: "etc", label: "기타" }
    ]
  },
  
  // ===== 날짜 타입 (NONE - 자동완성 없음) =====
  {
    attribute: "CREATE_KST_DATE",
    name: "가입일",
    description: "회원 가입일 (한국 시간)",
    autocompleteType: "NONE",
    dataType: "Time"
  },
  {
    attribute: "BASIS_DATE",
    name: "기준일",
    description: "데이터 기준일",
    autocompleteType: "NONE",
    dataType: "Time"
  },
  {
    attribute: "DW_LOAD_DT",
    name: "적재 시간",
    description: "데이터 웨어하우스 적재 시간",
    autocompleteType: "NONE",
    dataType: "Time"
  }
];

// 도시 목 데이터 (code, name 형식)
export const mockCityData = [
  { code: "SEL", name: "서울" },
  { code: "ICN", name: "인천" },
  { code: "BUS", name: "부산" },
  { code: "JEJ", name: "제주" },
  { code: "TYO", name: "도쿄" },
  { code: "OSA", name: "오사카" },
  { code: "PAR", name: "파리" },
  { code: "LON", name: "런던" },
  { code: "NYC", name: "뉴욕" },
  { code: "BKK", name: "방콕" },
  { code: "SIN", name: "싱가포르" },
  { code: "HKG", name: "홍콩" }
];

// 국가 목 데이터 (code, name 형식)
export const mockCountryData = [
  { code: "KR", name: "대한민국" },
  { code: "JP", name: "일본" },
  { code: "CN", name: "중국" },
  { code: "US", name: "미국" },
  { code: "FR", name: "프랑스" },
  { code: "GB", name: "영국" },
  { code: "TH", name: "태국" },
  { code: "SG", name: "싱가포르" },
  { code: "VN", name: "베트남" }
];

// 공항 목 데이터 (code, name 형식)
export const mockAirportData = [
  { code: "ICN", name: "인천국제공항" },
  { code: "GMP", name: "김포국제공항" },
  { code: "CJU", name: "제주국제공항" },
  { code: "NRT", name: "나리타국제공항" },
  { code: "HND", name: "하네다공항" },
  { code: "JFK", name: "존F케네디국제공항" },
  { code: "LAX", name: "로스앤젤레스국제공항" }
];

// 항공사 목 데이터 (code, name 형식)
export const mockAirlineData = [
  { code: "KE", name: "대한항공" },
  { code: "OZ", name: "아시아나항공" },
  { code: "7C", name: "제주항공" },
  { code: "JL", name: "일본항공" },
  { code: "NH", name: "전일본공수" },
  { code: "SQ", name: "싱가포르항공" }
];

// 카테고리 레벨1 목 데이터 (code, name 형식)
export const mockCategoryLevel1Data = [
  { code: "TNA", name: "투어&액티비티" },
  { code: "STAY", name: "숙박" },
  { code: "FLIGHT", name: "항공" },
  { code: "RIDE", name: "교통" }
];

// 카테고리 레벨2 목 데이터 (code, name 형식)
export const mockCategoryLevel2Data = [
  { code: "CITY_TOUR", name: "시내투어" },
  { code: "SNAP", name: "스냅촬영" },
  { code: "TICKET", name: "입장권" },
  { code: "HOTEL", name: "호텔" },
  { code: "RESORT", name: "리조트" }
];

// 카테고리 레벨3 목 데이터 (code, name 형식)
export const mockCategoryLevel3Data = [
  { code: "PARIS_CITY_TOUR", name: "파리 시내투어" },
  { code: "ROME_CITY_TOUR", name: "로마 시내투어" },
  { code: "SEOUL_SNAP", name: "서울 스냅" },
  { code: "JEJU_SNAP", name: "제주 스냅" }
];
