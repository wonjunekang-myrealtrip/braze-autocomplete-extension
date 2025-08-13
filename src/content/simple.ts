// 간단한 content script - 모듈 임포트 없이 직접 구현
console.log('Braze Autocomplete Extension - Content Script Loaded');

// Mock 국가 데이터
const mockCountryData = [
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

// Mock 도시 데이터
const mockCityData = [
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

// Mock 데이터 - attribute 이름과 설명 매핑
const attributeDescriptions: { [key: string]: string } = {
  // 회원 정보
  "LEAVE_FLAG": "회원 탈퇴 여부",
  "USER_ID": "사용자 ID",
  "USER_NAME": "사용자 이름",
  "PHONE_NUMBER": "전화번호",
  "EMAIL": "이메일",
  "BIRTH_DATE": "생년월일",
  "GENDER": "성별",
  "AGE": "나이",
  "AGE_GROUP": "연령대",
  
  // 날짜 정보
  "CREATE_KST_DATE": "가입일 (한국시간)",
  "CREATE_DATE": "가입일",
  "LAST_LOGIN_DATE": "최근 로그인 날짜",
  "LAST_PURCHASE_DATE": "최근 구매일",
  
  // 지역 정보
  "CITY_NM": "거주 도시명",
  "REGION": "지역",
  "COUNTRY": "국가",
  
  // 회원 등급/상태
  "MEMBERSHIP_LEVEL": "회원 등급",
  "VIP_FLAG": "VIP 여부",
  "ACTIVE_STATUS": "활성 상태",
  
  // 구매/활동
  "PURCHASE_COUNT": "구매 횟수",
  "TOTAL_PURCHASE_AMOUNT": "총 구매 금액",
  "AVERAGE_ORDER_VALUE": "평균 주문 금액",
  "LAST_PRODUCT_CATEGORY": "최근 구매 카테고리",
  
  // 마케팅
  "SMS_AGREE": "SMS 수신 동의",
  "EMAIL_AGREE": "이메일 수신 동의",
  "PUSH_AGREE": "푸시 수신 동의",
  "MARKETING_AGREE": "마케팅 수신 동의"
};

// Mock 데이터
// 실제 속성 메타데이터를 저장할 변수
let attributeMetadata: any[] = [];

// Background script에서 속성 데이터 가져오기 (초기 로드)
function loadAttributeMetadata() {
  chrome.runtime.sendMessage({ type: 'GET_ATTRIBUTES' }, (response) => {
    if (response && response.success) {
      attributeMetadata = response.data || [];
      console.log('속성 메타데이터 로드:', attributeMetadata.length);
      
      // 데이터 로드 후 UI 업데이트
      enhanceAttributeOptions();
      enhanceSelectedAttributes();
    }
  });
}

// 페이지 로드 시 바로 데이터 요청
loadAttributeMetadata();

const mockAttributes = [
  {
    attribute_name: "CITY_NM",
    data_type: "String",
    description: "거주 도시명",
    possible_values: [
      { key_name: "seoul", key_kor_name: "서울" },
      { key_name: "busan", key_kor_name: "부산" },
      { key_name: "daegu", key_kor_name: "대구" },
      { key_name: "incheon", key_kor_name: "인천" },
      { key_name: "gwangju", key_kor_name: "광주" },
      { key_name: "daejeon", key_kor_name: "대전" },
      { key_name: "ulsan", key_kor_name: "울산" },
      { key_name: "sejong", key_kor_name: "세종" },
      { key_name: "gyeonggi", key_kor_name: "경기" },
      { key_name: "gangwon", key_kor_name: "강원" },
      { key_name: "chungbuk", key_kor_name: "충북" },
      { key_name: "chungnam", key_kor_name: "충남" },
      { key_name: "jeonbuk", key_kor_name: "전북" },
      { key_name: "jeonnam", key_kor_name: "전남" },
      { key_name: "gyeongbuk", key_kor_name: "경북" },
      { key_name: "gyeongnam", key_kor_name: "경남" },
      { key_name: "jeju", key_kor_name: "제주" }
    ]
  },
  {
    attribute_name: "MEMBERSHIP_LEVEL",
    data_type: "String",
    description: "회원 등급",
    possible_values: [
      { key_name: "bronze", key_kor_name: "브론즈" },
      { key_name: "silver", key_kor_name: "실버" },
      { key_name: "gold", key_kor_name: "골드" },
      { key_name: "platinum", key_kor_name: "플래티넘" },
      { key_name: "diamond", key_kor_name: "다이아몬드" }
    ]
  }
];

// 현재 활성화된 드롭다운
let currentDropdown: HTMLElement | null = null;
let currentInput: HTMLInputElement | null = null;
let selectedIndex = -1;
let currentResults: any[] = []; // 현재 표시된 검색 결과 저장

// 현재 입력 중인 속성의 메타데이터 찾기
function getCurrentAttributeMetadata(inputElement: HTMLInputElement): any {
  // 입력 필드가 속한 필터 컨테이너 찾기
  const filterContainer = inputElement.closest('.segment-filter-container');
  if (!filterContainer) {
    console.log('Filter container not found');
    return null;
  }
  
  // 해당 필터 컨테이너 내에서 속성명 찾기
  // Custom Attributes 레이블 다음의 select 박스에서 선택된 값 찾기
  const customAttributesSection = filterContainer.querySelector('.custom_attributes_filter');
  if (!customAttributesSection) {
    console.log('Custom attributes section not found');
    return null;
  }
  
  // 첫 번째 select 박스의 선택된 값 찾기 (Custom Attributes 드롭다운)
  const attributeElement = customAttributesSection.querySelector('.bcl-select__single-value');
  if (!attributeElement) {
    console.log('Attribute element not found');
    return null;
  }
  
  let attributeName = '';
  
  // data-korean-selected가 있는 경우 (한글명이 추가된 경우)
  const parentDiv = attributeElement.closest('[data-korean-selected="true"]');
  if (parentDiv) {
    // span 태그에서 속성명만 추출
    const spanElement = attributeElement.querySelector('span:first-child');
    if (spanElement) {
      attributeName = spanElement.textContent?.trim() || '';
    }
  } else {
    // 일반적인 경우
    attributeName = attributeElement.textContent?.trim() || '';
    // 한글명이 포함된 경우 (예: "CITY_NM (거주 도시명)") 속성명만 추출
    if (attributeName.includes('(')) {
      attributeName = attributeName.split('(')[0].trim();
    }
  }
  
  if (!attributeName) {
    console.log('Attribute name is empty');
    return null;
  }
  
  console.log('Looking for attribute in filter:', attributeName);
  
  // 메타데이터에서 찾기
  const metadata = attributeMetadata.find(attr => attr.attribute === attributeName);
  
  if (metadata) {
    console.log('Found metadata for filter:', metadata);
  } else {
    console.log('Metadata not found for:', attributeName);
    console.log('Available attributes:', attributeMetadata.map(a => a.attribute).slice(0, 10));
  }
  
  return metadata;
}

// 검색 함수 (비동기로 변경)
async function searchValues(query: string, inputElement?: HTMLInputElement): Promise<any[]> {
  const normalizedQuery = query.toLowerCase().trim();
  if (normalizedQuery.length < 1) return [];
  
  console.log('searchValues called with query:', query);
  
  // 현재 속성의 메타데이터 확인
  if (inputElement) {
    const metadata = getCurrentAttributeMetadata(inputElement);
    
    if (metadata) {
      console.log('Autocomplete type:', metadata.autocompleteType);
    }
    
    // AIRPORT 타입이면 실시간 API 호출
    if (metadata?.autocompleteType === 'AIRPORT') {
      return new Promise((resolve) => {
        chrome.runtime.sendMessage(
          { 
            type: 'FETCH_AIRPORT_DATA',
            payload: { query: normalizedQuery }
          },
          (response) => {
            if (response && response.success) {
              const results = response.data.map((item: any) => ({
                attribute: metadata,
                value: item,
                display: item.label,
                insertValue: item.value,
                additionalInfo: item.additionalInfo
              }));
              resolve(results);
            } else {
              resolve([]);
            }
          }
        );
      });
    }
    
    // COUNTRY 타입이면 실시간 API 호출
    if (metadata?.autocompleteType === 'COUNTRY') {
      return new Promise((resolve) => {
        chrome.runtime.sendMessage(
          { 
            type: 'FETCH_REGION_DATA',
            payload: { 
              query: normalizedQuery,
              dataType: 'COUNTRY'
            }
          },
          (response) => {
            if (response && response.success) {
              const results = response.data.map((item: any) => ({
                attribute: metadata,
                value: item,
                display: item.label,
                insertValue: item.value,
                additionalInfo: item.additionalInfo
              }));
              resolve(results);
            } else {
              // 실패 시 Mock 데이터 사용
              const countries = mockCountryData.filter(country => 
                country.code.toLowerCase().includes(normalizedQuery) ||
                country.name.toLowerCase().includes(normalizedQuery)
              );
              
              resolve(countries.map(country => ({
                attribute: metadata,
                value: country,
                display: `${country.name} (${country.code})`,
                insertValue: country.code,
                additionalInfo: metadata.description
              })));
            }
          }
        );
      });
    }
    
    // CITY 타입이면 실시간 API 호출
    if (metadata?.autocompleteType === 'CITY') {
      return new Promise((resolve) => {
        chrome.runtime.sendMessage(
          { 
            type: 'FETCH_REGION_DATA',
            payload: { 
              query: normalizedQuery,
              dataType: 'CITY'
            }
          },
          (response) => {
            if (response && response.success) {
              const results = response.data.map((item: any) => ({
                attribute: metadata,
                value: item,
                display: item.label,
                insertValue: item.value,
                additionalInfo: item.additionalInfo
              }));
              resolve(results);
            } else {
              // 실패 시 Mock 데이터 사용
              const cities = mockCityData.filter(city => 
                city.code.toLowerCase().includes(normalizedQuery) ||
                city.name.toLowerCase().includes(normalizedQuery)
              );
              
              resolve(cities.map(city => ({
                attribute: metadata,
                value: city,
                display: `${city.name} (${city.code})`,
                insertValue: city.code,
                additionalInfo: metadata.description
              })));
            }
          }
        );
      });
    }
    
    // AIRLINE 타입이면 백그라운드 스크립트에서 데이터 가져오기
    if (metadata?.autocompleteType === 'AIRLINE') {
      return new Promise((resolve) => {
        chrome.runtime.sendMessage(
          { 
            type: 'FETCH_AIRLINE_DATA',
            payload: { query: normalizedQuery }
          },
          (response) => {
            if (response && response.success) {
              const results = response.data.map((item: any) => ({
                attribute: metadata,
                value: item,
                display: item.label,
                insertValue: item.value,
                additionalInfo: item.additionalInfo
              }));
              resolve(results);
            } else {
              console.error('Failed to fetch airline data');
              resolve([]);
            }
          }
        );
      });
    }
    
    // STANDARD_CATEGORY_LV_1 타입이면 API 호출
    if (metadata?.autocompleteType === 'STANDARD_CATEGORY_LV_1') {
      return new Promise((resolve) => {
        chrome.runtime.sendMessage(
          { 
            type: 'FETCH_CATEGORY_DATA',
            payload: { query: normalizedQuery, level: 1 }
          },
          (response) => {
            if (response && response.success) {
              const results = response.data.map((item: any) => ({
                attribute: metadata,
                value: item,
                display: item.label,
                insertValue: item.value,
                additionalInfo: null
              }));
              resolve(results);
            } else {
              console.error('Failed to fetch category level 1 data');
              resolve([]);
            }
          }
        );
      });
    }
    
    // STANDARD_CATEGORY_LV_2 타입이면 API 호출
    if (metadata?.autocompleteType === 'STANDARD_CATEGORY_LV_2') {
      return new Promise((resolve) => {
        chrome.runtime.sendMessage(
          { 
            type: 'FETCH_CATEGORY_DATA',
            payload: { query: normalizedQuery, level: 2 }
          },
          (response) => {
            if (response && response.success) {
              const results = response.data.map((item: any) => ({
                attribute: metadata,
                value: item,
                display: item.label,
                insertValue: item.value,
                additionalInfo: null
              }));
              resolve(results);
            } else {
              console.error('Failed to fetch category level 2 data');
              resolve([]);
            }
          }
        );
      });
    }
    
    // STANDARD_CATEGORY_LV_3 타입이면 API 호출
    if (metadata?.autocompleteType === 'STANDARD_CATEGORY_LV_3') {
      return new Promise((resolve) => {
        chrome.runtime.sendMessage(
          { 
            type: 'FETCH_CATEGORY_DATA',
            payload: { query: normalizedQuery, level: 3 }
          },
          (response) => {
            if (response && response.success) {
              const results = response.data.map((item: any) => ({
                attribute: metadata,
                value: item,
                display: item.label,
                insertValue: item.value,
                additionalInfo: null
              }));
              resolve(results);
            } else {
              console.error('Failed to fetch category level 3 data');
              resolve([]);
            }
          }
        );
      });
    }
    
    // ENUM 타입이면 enumValues 사용
    if (metadata?.autocompleteType === 'ENUM' && metadata.enumValues) {
      const enumValues = metadata.enumValues.filter((item: any) =>
        item.value.toLowerCase().includes(normalizedQuery) ||
        item.label.toLowerCase().includes(normalizedQuery)
      );
      
      return enumValues.map((item: any) => ({
        attribute: metadata,
        value: item,
        display: `${item.label} (${item.value})`,
        insertValue: item.value,
        additionalInfo: null // 각 아이템에서는 description 제거
      }));
    }
  }
  
  // 기존 Mock 데이터 검색 로직
  const results: any[] = [];
  
  mockAttributes.forEach(attr => {
    attr.possible_values.forEach(value => {
      if (value.key_name.toLowerCase().includes(normalizedQuery) ||
          value.key_kor_name.toLowerCase().includes(normalizedQuery)) {
        results.push({
          attribute: attr,
          value: value,
          display: `${value.key_kor_name} (${value.key_name})`,
          insertValue: value.key_name
        });
      }
    });
  });
  
  return results.slice(0, 10);
}

// 드롭다운 생성
function createDropdown(results: any[], inputElement: HTMLInputElement) {
  // 입력 필드가 DOM에 없으면 종료
  if (!document.body.contains(inputElement)) {
    return;
  }
  
  // 기존 드롭다운 제거
  removeDropdown();
  
  if (results.length === 0) return;
  
  // 현재 결과 저장
  currentResults = results;
  selectedIndex = -1; // 초기화
  
  const rect = inputElement.getBoundingClientRect();
  
  // 화면 밖에 있으면 종료
  if (rect.width === 0 || rect.height === 0) {
    return;
  }
  
  // 드롭다운 너비 계산 (입력 필드보다 넓게, 하지만 화면을 벗어나지 않도록)
  const minWidth = Math.max(rect.width, 400); // 최소 400px
  const maxWidth = 600; // 최대 600px
  const availableWidth = window.innerWidth - rect.left - 20; // 오른쪽 여백 20px
  const dropdownWidth = Math.min(Math.max(minWidth, rect.width * 1.5), maxWidth, availableWidth);
  
  // 드롭다운이 화면 오른쪽을 벗어나는 경우 위치 조정
  let leftPosition = rect.left;
  if (rect.left + dropdownWidth > window.innerWidth - 20) {
    leftPosition = Math.max(10, window.innerWidth - dropdownWidth - 20);
  }
  
  const dropdown = document.createElement('div');
  dropdown.className = 'braze-autocomplete-dropdown';
  dropdown.style.cssText = `
    position: fixed;
    top: ${rect.bottom + 2}px;
    left: ${leftPosition}px;
    width: ${dropdownWidth}px;
    min-width: ${minWidth}px;
    max-width: ${maxWidth}px;
    max-height: 400px;
    background: white;
    border: 1px solid #ccc;
    border-radius: 4px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.15);
    z-index: 99999;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    font-size: 14px;
    display: flex;
    flex-direction: column;
  `;
  
  // Description을 드롭다운 상단에 표시 (있을 경우에만)
  const description = results[0]?.attribute?.description;
  if (description) {
    const descriptionDiv = document.createElement('div');
    descriptionDiv.className = 'dropdown-description-header';
    descriptionDiv.style.cssText = `
      padding: 8px 14px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      font-size: 12px;
      font-weight: 500;
      border-bottom: 1px solid #e9ecef;
      display: flex;
      align-items: center;
      gap: 6px;
      flex-shrink: 0;
      border-radius: 4px 4px 0 0;
    `;
    descriptionDiv.innerHTML = `
      <span style="font-size: 14px;">💡</span>
      <span>${description}</span>
    `;
    dropdown.appendChild(descriptionDiv);
  }
  
  // 아이템들을 담을 컨테이너 생성
  const itemsContainer = document.createElement('div');
  itemsContainer.style.cssText = `
    flex: 1;
    overflow-y: auto;
    max-height: ${description ? '350px' : '400px'};
  `;
  
  results.forEach((result, index) => {
    const item = document.createElement('div');
    item.className = 'autocomplete-item';
    item.style.cssText = `
      padding: 10px 14px;
      cursor: pointer;
      border-bottom: 1px solid #f0f0f0;
      transition: background-color 0.2s;
      ${index === selectedIndex ? 'background: #e6f3ff;' : ''}
    `;
    
    // additionalInfo가 있으면 표시, 없으면 값만 표시
    if (result.additionalInfo && result.additionalInfo !== description) {
      item.innerHTML = `
        <div style="font-weight: 500; color: #333; font-size: 15px; line-height: 1.4;">${result.display}</div>
        <div style="font-size: 12px; color: #888; margin-top: 2px;">
          ${result.additionalInfo}
        </div>
      `;
    } else {
      item.innerHTML = `
        <div style="font-weight: 500; color: #333; font-size: 15px; line-height: 1.4;">${result.display}</div>
      `;
    }
    
    // 마우스 오버
    item.addEventListener('mouseenter', () => {
      selectedIndex = index;
      updateSelection();
    });
    
    // 클릭
    item.addEventListener('click', () => {
      insertValue(result.insertValue);
    });
    
    itemsContainer.appendChild(item);
  });
  
  dropdown.appendChild(itemsContainer);
  document.body.appendChild(dropdown);
  currentDropdown = dropdown;
  currentInput = inputElement;
}

// 드롭다운 제거
function removeDropdown() {
  try {
    // 현재 드롭다운 제거
    if (currentDropdown && currentDropdown.parentNode) {
      currentDropdown.parentNode.removeChild(currentDropdown);
    }
    currentDropdown = null;
    
    // 혹시 남아있을 수 있는 모든 드롭다운 제거
    const allDropdowns = document.querySelectorAll('.braze-autocomplete-dropdown');
    allDropdowns.forEach(dropdown => {
      if (dropdown && dropdown.parentNode) {
        dropdown.parentNode.removeChild(dropdown);
      }
    });
    
    // 상태 초기화
    currentInput = null;
    selectedIndex = -1;
    currentResults = [];
  } catch (error) {
    console.error('Error removing dropdown:', error);
  }
}

// 선택 업데이트
function updateSelection() {
  if (!currentDropdown) return;
  
  const items = currentDropdown.querySelectorAll('.autocomplete-item');
  items.forEach((item, index) => {
    const el = item as HTMLElement;
    if (index === selectedIndex) {
      el.style.background = '#e6f3ff';
      // 선택된 아이템이 보이도록 스크롤
      el.scrollIntoView({ 
        block: 'nearest',
        behavior: 'smooth'
      });
    } else {
      el.style.background = 'white';
    }
  });
}

// 값 삽입
function insertValue(value: string) {
  if (!currentInput) return;
  
  console.log('Inserting value:', value);
  
  // 먼저 드롭다운 제거 (입력 전에)
  const inputElement = currentInput; // 참조 저장
  removeDropdown();
  
  // 프로그래밍적 변경 플래그 설정
  inputElement.setAttribute('data-programmatic-change', 'true');
  
  // React의 input 값 변경을 위한 native setter 호출
  const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
    window.HTMLInputElement.prototype,
    'value'
  )?.set;
  
  if (nativeInputValueSetter) {
    nativeInputValueSetter.call(inputElement, value);
  } else {
    inputElement.value = value;
  }
  
  // React가 변경을 감지하도록 이벤트 발생
  const inputEvent = new Event('input', { bubbles: true, cancelable: true });
  inputElement.dispatchEvent(inputEvent);
  
  const changeEvent = new Event('change', { bubbles: true, cancelable: true });
  inputElement.dispatchEvent(changeEvent);
  
  // 포커스 유지
  inputElement.focus();
  
  // 선택된 값에 대한 name 표시
  displaySelectedValueName(inputElement, value);
  
  // 플래그 제거 및 드롭다운 확실히 제거
  setTimeout(() => {
    inputElement.removeAttribute('data-programmatic-change');
    removeDropdown();
  }, 100);
}

// 선택된 값의 name을 입력 필드 옆에 표시
function displaySelectedValueName(inputElement: HTMLInputElement, value: string) {
  // 기존 name 표시 제거
  const existingNameDiv = inputElement.parentElement?.querySelector('.braze-value-name');
  if (existingNameDiv) {
    existingNameDiv.remove();
  }
  
  // 현재 속성의 메타데이터 확인
  const metadata = getCurrentAttributeMetadata(inputElement);
  if (!metadata) return;
  
  let displayName = '';
  
  // AIRPORT 타입인 경우
  if (metadata.autocompleteType === 'AIRPORT') {
    // API 호출로 찾기
    chrome.runtime.sendMessage(
      { 
        type: 'FETCH_AIRPORT_DATA',
        payload: { query: value }
      },
      (response) => {
        if (response && response.success && response.data.length > 0) {
          const airport = response.data.find((item: any) => item.code === value || item.value === value);
          if (airport) {
            displayName = airport.name || airport.label;
            showNameDisplay(inputElement, displayName, value);
          }
        }
      }
    );
  }
  // AIRLINE 타입인 경우
  else if (metadata.autocompleteType === 'AIRLINE') {
    // AIRLINE_DATA에서 찾기
    chrome.runtime.sendMessage(
      { 
        type: 'FETCH_AIRLINE_DATA',
        payload: { query: value }
      },
      (response) => {
        if (response && response.success && response.data.length > 0) {
          const airline = response.data.find((item: any) => item.code === value);
          if (airline) {
            displayName = airline.name;
            showNameDisplay(inputElement, displayName, value);
          }
        }
      }
    );
  }
  // CITY 타입인 경우
  else if (metadata.autocompleteType === 'CITY') {
    // mockCityData에서 찾기
    const city = mockCityData.find(item => item.code === value);
    if (city) {
      displayName = city.name;
      showNameDisplay(inputElement, displayName, value);
    } else {
      // API 호출로 찾기
      chrome.runtime.sendMessage(
        { 
          type: 'FETCH_REGION_DATA',
          payload: { query: value, dataType: 'CITY' }
        },
        (response) => {
          if (response && response.success && response.data.length > 0) {
            const city = response.data.find((item: any) => item.code === value);
            if (city) {
              showNameDisplay(inputElement, city.name, value);
            }
          }
        }
      );
    }
  }
  // COUNTRY 타입인 경우
  else if (metadata.autocompleteType === 'COUNTRY') {
    // mockCountryData에서 찾기
    const country = mockCountryData.find(item => item.code === value);
    if (country) {
      displayName = country.name;
      showNameDisplay(inputElement, displayName, value);
    } else {
      // API 호출로 찾기
      chrome.runtime.sendMessage(
        { 
          type: 'FETCH_REGION_DATA',
          payload: { query: value, dataType: 'COUNTRY' }
        },
        (response) => {
          if (response && response.success && response.data.length > 0) {
            const country = response.data.find((item: any) => item.code === value);
            if (country) {
              showNameDisplay(inputElement, country.name, value);
            }
          }
        }
      );
    }
  }
  // ENUM 타입인 경우
  else if (metadata.autocompleteType === 'ENUM' && metadata.enumValues) {
    const enumItem = metadata.enumValues.find((item: any) => item.value === value);
    if (enumItem) {
      displayName = enumItem.label;
      showNameDisplay(inputElement, displayName, value);
    }
  }
  // STANDARD_CATEGORY_LV_1 타입인 경우
  else if (metadata.autocompleteType === 'STANDARD_CATEGORY_LV_1') {
    // API 호출로 찾기
    chrome.runtime.sendMessage(
      { 
        type: 'FETCH_CATEGORY_DATA',
        payload: { query: value, level: 1 }
      },
      (response) => {
        if (response && response.success && response.data.length > 0) {
          const category = response.data.find((item: any) => item.code === value);
          if (category) {
            showNameDisplay(inputElement, category.name, value);
          }
        }
      }
    );
  }
  // STANDARD_CATEGORY_LV_2 타입인 경우
  else if (metadata.autocompleteType === 'STANDARD_CATEGORY_LV_2') {
    // API 호출로 찾기
    chrome.runtime.sendMessage(
      { 
        type: 'FETCH_CATEGORY_DATA',
        payload: { query: value, level: 2 }
      },
      (response) => {
        if (response && response.success && response.data.length > 0) {
          const category = response.data.find((item: any) => item.code === value);
          if (category) {
            showNameDisplay(inputElement, category.name, value);
          }
        }
      }
    );
  }
  // STANDARD_CATEGORY_LV_3 타입인 경우
  else if (metadata.autocompleteType === 'STANDARD_CATEGORY_LV_3') {
    // API 호출로 찾기
    chrome.runtime.sendMessage(
      { 
        type: 'FETCH_CATEGORY_DATA',
        payload: { query: value, level: 3 }
      },
      (response) => {
        if (response && response.success && response.data.length > 0) {
          const category = response.data.find((item: any) => item.code === value);
          if (category) {
            showNameDisplay(inputElement, category.name, value);
          }
        }
      }
    );
  }
}

// name 표시 UI 생성
function showNameDisplay(inputElement: HTMLInputElement, name: string, code: string) {
  if (!name) return;
  
  // 태그 입력 필드인 경우 태그 처리
  if (inputElement.classList.contains('bcl-tag-input')) {
    setTimeout(() => {
      processTags();
    }, 100);
    return;
  }
  
  // 기존 표시 제거
  const existingDiv = inputElement.parentElement?.querySelector('.braze-value-name');
  if (existingDiv) {
    existingDiv.remove();
  }
  
  const nameDiv = document.createElement('div');
  nameDiv.className = 'braze-value-name';
  nameDiv.style.cssText = `
    padding: 6px 10px;
    background: linear-gradient(135deg, #e3f2fd 0%, #f3e5f5 100%);
    border-left: 3px solid #2196F3;
    font-size: 13px;
    color: #6A1B9A;
    border-radius: 3px;
    display: flex;
    align-items: center;
    gap: 8px;
    box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    font-weight: 500;
  `;
  nameDiv.textContent = name;
  
  // 입력 필드 바로 다음에 삽입
  inputElement.parentElement?.insertBefore(nameDiv, inputElement.nextSibling);
}

// 태그 컨테이너에서 태그들을 처리
function processTags() {
  const tagContainers = document.querySelectorAll('.bcl-tag-input-container');
  
  tagContainers.forEach(container => {
    const tags = container.querySelectorAll('.bcl-tag');
    const tagInput = container.querySelector('input.bcl-tag-input') as HTMLInputElement;
    
    if (!tagInput) return;
    
    // 현재 attribute metadata 가져오기
    const metadata = getCurrentAttributeMetadata(tagInput);
    if (!metadata) return;
    
    tags.forEach(tag => {
      const tagContent = tag.querySelector('.bcl-tag-content');
      if (!tagContent) return;
      
      const code = tagContent.textContent?.trim();
      if (!code || tag.hasAttribute('data-name-processed')) return;
      
      // 이미 처리된 태그는 스킵
      tag.setAttribute('data-name-processed', 'true');
      
      // 각 타입별로 한글명 찾기
      if (metadata.autocompleteType === 'AIRPORT') {
        // AIRPORT 타입 처리
        chrome.runtime.sendMessage({
          type: 'FETCH_AIRPORT_DATA',
          payload: { query: code }
        }, (response) => {
          if (response && response.success && response.data.length > 0) {
            const airport = response.data.find((a: any) => a.code === code || a.value === code);
            if (airport && airport.name) {
              // 태그에 툴팁 추가
              tag.setAttribute('title', `${code} - ${airport.name}`);
              // 태그 내용 업데이트 (작은 텍스트로)
              if (tagContent instanceof HTMLElement) {
                tagContent.style.cssText = 'display: flex; align-items: center; gap: 4px;';
                tagContent.innerHTML = `
                  <span style="font-weight: 600;">${code}</span>
                  <span style="color: #666; font-size: 0.85em;">(${airport.name})</span>
                `;
              }
            }
          }
        });
      } else if (metadata.autocompleteType === 'CITY') {
        // CITY 타입 처리
        const city = mockCityData.find(item => item.code === code);
        if (city) {
          tag.setAttribute('title', `${code} - ${city.name}`);
          if (tagContent instanceof HTMLElement) {
            tagContent.style.cssText = 'display: flex; align-items: center; gap: 4px;';
            tagContent.innerHTML = `
              <span style="font-weight: 600;">${code}</span>
              <span style="color: #666; font-size: 0.85em;">(${city.name})</span>
            `;
          }
        } else {
          // API 호출
          chrome.runtime.sendMessage({
            type: 'FETCH_REGION_DATA',
            payload: { query: code, dataType: 'CITY' }
          }, (response) => {
            if (response && response.success && response.data.length > 0) {
              const city = response.data.find((r: any) => r.code === code);
              if (city && city.name) {
                tag.setAttribute('title', `${code} - ${city.name}`);
                if (tagContent instanceof HTMLElement) {
                  tagContent.style.cssText = 'display: flex; align-items: center; gap: 4px;';
                  tagContent.innerHTML = `
                    <span style="font-weight: 600;">${code}</span>
                    <span style="color: #666; font-size: 0.85em;">(${city.name})</span>
                  `;
                }
              }
            }
          });
        }
      } else if (metadata.autocompleteType === 'COUNTRY') {
        // COUNTRY 타입 처리
        const country = mockCountryData.find(item => item.code === code);
        if (country) {
          tag.setAttribute('title', `${code} - ${country.name}`);
          if (tagContent instanceof HTMLElement) {
            tagContent.style.cssText = 'display: flex; align-items: center; gap: 4px;';
            tagContent.innerHTML = `
              <span style="font-weight: 600;">${code}</span>
              <span style="color: #666; font-size: 0.85em;">(${country.name})</span>
            `;
          }
        }
      }
    });
  });
}

// 입력 필드 감지
function detectInputFields() {
  // Braze의 Custom Attributes 입력 필드 선택자들
  const selectors = [
    'input[placeholder*="경기"]',
    'input[type="text"]:not([readonly])',
    '.custom_attributes_filter input',
    '.filter-input-any input',
    'input.bcl-input',
    'input.bcl-select__input',
    'input.bcl-tag-input',  // 태그 입력 필드 추가
    '[data-cy="condition-group"] input[type="text"]'
  ];
  
  selectors.forEach(selector => {
    const inputs = document.querySelectorAll(selector);
    inputs.forEach(input => {
      if (!(input instanceof HTMLInputElement)) return;
      if (input.hasAttribute('data-braze-autocomplete')) return;
      
      console.log('입력 필드 발견:', input);
      input.setAttribute('data-braze-autocomplete', 'true');
      
      // 포커스 타이머 변수
      let focusTimer: any = null;
      
      // 포커스 이벤트 - 값이 있으면 자동완성 표시, ENUM 타입일 때 전체 옵션 표시
      const handleFocusAndClick = async (e: Event) => {
        const target = e.target as HTMLInputElement;
        
        // 이전 포커스 타이머 취소
        if (focusTimer) {
          clearTimeout(focusTimer);
        }
        
        // Braze의 속성 선택 드롭다운이 열려있는지 확인
        const brazeDropdownOpen = document.querySelector('.bcl-select__menu, .bcl-select__menu-list');
        if (brazeDropdownOpen) {
          // Braze 드롭다운이 열려있으면 자동완성 비활성화
          removeDropdown();
          return;
        }
        
        // 이미 드롭다운이 열려있으면 무시
        if (currentDropdown && currentInput === target) {
          return;
        }
        
        // 약간의 지연을 주어 다른 이벤트와 충돌 방지
        focusTimer = setTimeout(async () => {
          // 포커스가 여전히 이 입력 필드에 있는지 확인
          if (document.activeElement !== target) {
            return;
          }
          
          // 다시 한 번 체크
          if (currentDropdown && currentInput === target) {
            return;
          }
        
          const metadata = getCurrentAttributeMetadata(target);
          const query = target.value.trim();
        
          // ENUM 타입이고 enumValues가 있는 경우
          if (metadata?.autocompleteType === 'ENUM' && metadata.enumValues && metadata.enumValues.length > 0) {
            console.log('ENUM 타입 포커스 - 옵션 표시');
            
            if (query.length === 0) {
              // 입력값이 없을 때 전체 옵션 표시
              const results = metadata.enumValues.map((item: any) => ({
                attribute: metadata,
                value: item,
                display: `${item.label} (${item.value})`,
                insertValue: item.value,
                additionalInfo: null
              }));
              
              createDropdown(results, target);
            } else {
              // 입력값이 있을 때 필터링된 옵션 표시
              const results = await searchValues(query, target);
              if (results.length > 0) {
                createDropdown(results, target);
              }
            }
          } 
          // ENUM이 아닌 타입에서도 값이 있으면 자동완성 표시
          else if (query.length >= 1) {
            console.log('포커스/클릭 시 자동완성 재표시:', query);
            const results = await searchValues(query, target);
            if (results.length > 0) {
              createDropdown(results, target);
            }
          }
        }, 100);  // 50ms에서 100ms로 증가
      };
      
      input.addEventListener('focus', handleFocusAndClick);
      input.addEventListener('click', handleFocusAndClick);
      
      // 디바운싱을 위한 타이머
      let inputTimer: any = null;
      
      // 입력 이벤트 (비동기 처리 + 디바운싱)
      input.addEventListener('input', async (e) => {
        const target = e.target as HTMLInputElement;
        
        // Braze의 속성 선택 드롭다운이 열려있는지 확인
        const brazeDropdownOpen = document.querySelector('.bcl-select__menu, .bcl-select__menu-list');
        if (brazeDropdownOpen) {
          removeDropdown();
          return;
        }
        
        // 프로그래밍적 변경(엔터키로 값 삽입)인 경우 드롭다운 생성하지 않음
        if (target.hasAttribute('data-programmatic-change')) {
          console.log('Programmatic change detected, skipping dropdown');
          removeDropdown();
          return;
        }
        
        // 이전 타이머 취소
        if (inputTimer) {
          clearTimeout(inputTimer);
        }
        
        const query = target.value.trim();
        console.log('입력 감지:', query);
        
        // 디바운싱 적용 (100ms)
        inputTimer = setTimeout(async () => {
          // Braze 드롭다운이 열려있으면 무시
          const brazeDropdownStillOpen = document.querySelector('.bcl-select__menu, .bcl-select__menu-list');
          if (brazeDropdownStillOpen) {
            return;
          }
          
          // 입력 필드가 여전히 포커스되어 있는지 확인
          if (document.activeElement !== target) {
            return;
          }
          
          // ENUM 타입 체크
          const metadata = getCurrentAttributeMetadata(target);
          
          // 입력값이 없고 ENUM 타입인 경우 모든 옵션 표시
          if (query.length === 0 && metadata?.autocompleteType === 'ENUM' && metadata.enumValues) {
            const results = metadata.enumValues.map((item: any) => ({
              attribute: metadata,
              value: item,
              display: `${item.label} (${item.value})`,
              insertValue: item.value,
              additionalInfo: null
            }));
            
            createDropdown(results, target);
          } else if (query.length >= 1) {
            const results = await searchValues(query, target);
            console.log('검색 결과:', results.length, '개');
            // 포커스가 유지되고 있을 때만 드롭다운 생성
            if (document.activeElement === target) {
              createDropdown(results, target);
            }
          } else {
            removeDropdown();
          }
        }, 100);
      });
      
      // 키보드 이벤트
      input.addEventListener('keydown', async (e) => {
        if (!currentDropdown) return;
        
        const items = currentDropdown.querySelectorAll('.autocomplete-item');
        
        if (e.key === 'ArrowDown') {
          e.preventDefault();
          // 선택된 항목이 없으면 첫 번째 항목 선택
          if (selectedIndex === -1) {
            selectedIndex = 0;
          } else {
            selectedIndex = Math.min(selectedIndex + 1, items.length - 1);
          }
          updateSelection();
        } else if (e.key === 'ArrowUp') {
          e.preventDefault();
          selectedIndex = Math.max(selectedIndex - 1, 0);
          updateSelection();
        } else if (e.key === 'Enter') {
          e.preventDefault();
          e.stopPropagation(); // 이벤트 전파 중지
          
          // 드롭다운이 열려있고 선택된 항목이 있으면 바로 삽입
          if (currentDropdown && selectedIndex >= 0 && currentResults[selectedIndex]) {
            insertValue(currentResults[selectedIndex].insertValue);
          } else if (currentDropdown && currentResults.length > 0) {
            // 선택된 항목이 없으면 첫 번째 항목 선택
            insertValue(currentResults[0].insertValue);
          }
        } else if (e.key === 'Escape') {
          removeDropdown();
        }
      });
      
      // 포커스 아웃
      let blurTimer: any = null;
      input.addEventListener('blur', (e) => {
        // 드롭다운 내부 클릭인지 확인
        const relatedTarget = e.relatedTarget as HTMLElement;
        if (relatedTarget && currentDropdown && currentDropdown.contains(relatedTarget)) {
          // 드롭다운 내부 클릭이면 무시
          return;
        }
        
        // 이전 타이머 취소
        if (blurTimer) {
          clearTimeout(blurTimer);
        }
        
        // 약간의 지연 후 드롭다운 제거 (클릭 이벤트 처리를 위해)
        blurTimer = setTimeout(() => {
          // 현재 포커스가 같은 입력 필드가 아닌 경우에만 제거
          if (document.activeElement !== input && currentInput === input) {
            removeDropdown();
          }
        }, 200);
      });
      
      // 스크롤 이벤트 - 드롭다운 제거
      const handleScroll = () => {
        if (currentDropdown && currentInput === input) {
          removeDropdown();
        }
      };
      
      // 스크롤 가능한 모든 부모 요소에 이벤트 리스너 추가
      let scrollParent = input.parentElement;
      while (scrollParent) {
        scrollParent.addEventListener('scroll', handleScroll, { passive: true });
        scrollParent = scrollParent.parentElement;
      }
      window.addEventListener('scroll', handleScroll, { passive: true });
    });
  });
}

// 초기 실행
setTimeout(() => {
  console.log('Braze Autocomplete - 초기 감지 시작');
  detectInputFields();
  processTags();  // 태그 처리 추가
  // 데이터가 로드되지 않았으면 다시 요청
  if (attributeMetadata.length === 0) {
    loadAttributeMetadata();
  } else {
    enhanceAttributeOptions();
    enhanceSelectedAttributes();
  }
}, 1000);

// Braze attribute 선택 목록에 한글명 추가
function enhanceAttributeOptions() {
  // 드롭다운 메뉴 컨테이너 너비 조정
  const menuContainers = document.querySelectorAll([
    '.bcl-select__menu',
    '[class*="select__menu"]',
    '.bcl-select__menu-list'
  ].join(','));
  
  menuContainers.forEach(menu => {
    if (menu instanceof HTMLElement) {
      // 최소 너비 설정 (필요시 자동으로 늘어남)
      menu.style.minWidth = '500px';
      menu.style.maxWidth = '700px';
      menu.style.width = 'auto';
    }
  });
  
  // Braze의 attribute option 선택자들
  const optionSelectors = [
    '.bcl-select__option',
    '[class*="option"][id*="react-select"]',
    '.StyledOptionLabel-sc-1o89r46-0'
  ];
  
  optionSelectors.forEach(selector => {
    const options = document.querySelectorAll(selector);
    
    options.forEach(option => {
      // 이미 처리된 경우 스킵
      if (option.hasAttribute('data-korean-added')) return;
      
      // attribute 이름 추출
      let attributeName = '';
      
      // 텍스트 내용에서 attribute 이름 찾기
      const labelElement = option.querySelector('.bcl-select__option__label') || option;
      const textContent = labelElement.textContent?.trim() || '';
      
      if (textContent) {
        attributeName = textContent;
      }
      
      // attributeMetadata에서 한글명 찾기
      const metadata = attributeMetadata.find(attr => attr.attribute === attributeName);
      const koreanName = metadata?.name || attributeDescriptions[attributeName];
      
      // 한글명이 있는 경우 추가
      if (attributeName && koreanName) {
        // 한글명을 포함한 새로운 내용 생성
        const newContent = document.createElement('div');
        newContent.style.cssText = 'display: flex; align-items: center; gap: 8px; white-space: nowrap;';
        newContent.innerHTML = `
          <span style="font-weight: 500; flex-shrink: 0;">${attributeName}</span>
          <span style="color: #666; font-size: 0.9em; overflow: hidden; text-overflow: ellipsis;">(${koreanName})</span>
        `;
        
        // 기존 내용 교체
        if (labelElement instanceof HTMLElement) {
          labelElement.innerHTML = '';
          labelElement.appendChild(newContent);
        }
        
        // 처리 완료 표시
        option.setAttribute('data-korean-added', 'true');
        
        console.log(`한글명 추가: ${attributeName} → ${koreanName}`);
      }
    });
  });
}

// 선택된 attribute에 한글명 추가
function enhanceSelectedAttributes() {
  // 선택된 attribute가 표시되는 선택자들
  const selectedSelectors = [
    '.bcl-select__single-value',
    '[class*="singleValue"]',
    '.bcl-select__value-container',
    '.custom_attributes_filter .bcl-select__single-value'
  ];
  
  selectedSelectors.forEach(selector => {
    const selectedElements = document.querySelectorAll(selector);
    
    selectedElements.forEach(element => {
      // 이미 처리된 경우 스킵
      if (element.hasAttribute('data-korean-selected')) return;
      
      const textContent = element.textContent?.trim() || '';
      
      // 이미 한글이 포함된 경우 스킵
      if (textContent.includes('(') && textContent.includes(')')) return;
      
      // attribute 이름만 추출 (괄호 내용 제거)
      const attributeName = textContent.split('(')[0].trim();
      
      // attributeMetadata에서 한글명 찾기
      const metadata = attributeMetadata.find(attr => attr.attribute === attributeName);
      const koreanName = metadata?.name || attributeDescriptions[attributeName];
      
      // 한글명이 있는 경우 추가
      if (attributeName && koreanName) {
        
        // 한글명을 포함한 새로운 내용 생성
        if (element instanceof HTMLElement) {
          element.innerHTML = `
            <div style="display: flex; align-items: center; gap: 6px;">
              <span>${attributeName}</span>
              <span style="color: #666; font-size: 0.85em;">(${koreanName})</span>
            </div>
          `;
          
          // 처리 완료 표시
          element.setAttribute('data-korean-selected', 'true');
          
          console.log(`선택된 attribute 한글명 추가: ${attributeName} → ${koreanName}`);
        }
      }
    });
  });
}

// MutationObserver로 동적 요소 감지
const observer = new MutationObserver((mutations) => {
  // 입력 필드 감지
  detectInputFields();
  
  // 태그 처리
  processTags();
  
  // 메타데이터가 로드된 경우에만 enhance 실행
  if (attributeMetadata.length > 0) {
    // attribute 옵션 목록 개선
    enhanceAttributeOptions();
    
    // 선택된 attribute 개선
    enhanceSelectedAttributes();
  }
  
  // 드롭다운이 열렸는지 확인
  mutations.forEach(mutation => {
    mutation.addedNodes.forEach(node => {
      if (node instanceof HTMLElement) {
        // React Select 드롭다운이 열린 경우
        if (node.className?.includes('select__menu') || 
            node.querySelector('.bcl-select__option')) {
          // 드롭다운 너비 즉시 조정
          if (node instanceof HTMLElement && node.className?.includes('select__menu')) {
            node.style.minWidth = '500px';
            node.style.maxWidth = '700px';
            node.style.width = 'auto';
          }
          
          setTimeout(() => {
            if (attributeMetadata.length > 0) {
              enhanceAttributeOptions();
              enhanceSelectedAttributes();
            }
          }, 100);
        }
      }
    });
    
    // 텍스트 변경 감지 (선택 시)
    if (mutation.type === 'childList' || mutation.type === 'characterData') {
      setTimeout(() => {
        if (attributeMetadata.length > 0) {
          enhanceSelectedAttributes();
        }
      }, 50);
    }
  });
});

// Observer 시작
setTimeout(() => {
  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
}, 1500);

// 주기적으로 재감지 (fallback)
setInterval(() => {
  detectInputFields();
  if (attributeMetadata.length > 0) {
    enhanceAttributeOptions();
    enhanceSelectedAttributes();
  } else {
    // 데이터가 아직 로드되지 않았으면 다시 요청
    loadAttributeMetadata();
  }
}, 3000);

console.log('Braze Autocomplete Extension - Setup Complete');
