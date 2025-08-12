import { AttributeMetadata, SearchResult, MultilingualValue } from './types';

// 디바운스 함수
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  delay: number
): ((...args: Parameters<T>) => void) => {
  let timeoutId: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
};

// Prefix 매칭 검색
export const searchByPrefix = (
  attributes: AttributeMetadata[],
  query: string
): SearchResult[] => {
  const normalizedQuery = query.toLowerCase().trim();
  
  return attributes
    .filter(attr => 
      attr.attribute_name.toLowerCase().startsWith(normalizedQuery)
    )
    .map(attr => ({
      attribute: attr,
      score: 1.0, // Prefix 매칭은 최고 점수
      matchType: 'prefix' as const
    }))
    .sort((a, b) => a.attribute.attribute_name.localeCompare(b.attribute.attribute_name));
};

// 다국어 값에서 검색 (영어/한글 모두 지원)
const searchInMultilingualValues = (values: MultilingualValue[], query: string): boolean => {
  const normalizedQuery = query.toLowerCase().trim();
  return values.some(value => 
    value.key_name.toLowerCase().includes(normalizedQuery) ||
    value.key_kor_name.toLowerCase().includes(normalizedQuery)
  );
};

// Fuzzy 매칭 검색 (다국어 지원)
export const searchByFuzzy = (
  attributes: AttributeMetadata[],
  query: string
): SearchResult[] => {
  const normalizedQuery = query.toLowerCase().trim();
  
  return attributes
    .filter(attr => {
      const attrName = attr.attribute_name.toLowerCase();
      // Prefix 매칭은 제외 (중복 방지)
      if (attrName.startsWith(normalizedQuery)) return false;
      
      // 부분 문자열 매칭 (속성명, 설명, 가능한 값들, 예시 값들)
      return attrName.includes(normalizedQuery) || 
             attr.description.toLowerCase().includes(normalizedQuery) ||
             searchInMultilingualValues(attr.possible_values, normalizedQuery) ||
             searchInMultilingualValues(attr.examples, normalizedQuery);
    })
    .map(attr => {
      const attrName = attr.attribute_name.toLowerCase();
      const description = attr.description.toLowerCase();
      
      // 매칭 점수 계산
      let score = 0.5;
      if (attrName.includes(normalizedQuery)) score += 0.3;
      if (description.includes(normalizedQuery)) score += 0.2;
      if (searchInMultilingualValues(attr.possible_values, normalizedQuery)) score += 0.25;
      if (searchInMultilingualValues(attr.examples, normalizedQuery)) score += 0.15;
      
      return {
        attribute: attr,
        score,
        matchType: 'fuzzy' as const
      };
    })
    .sort((a, b) => b.score - a.score); // 점수 높은 순으로 정렬
};

// 통합 검색 함수
export const searchAttributes = (
  attributes: AttributeMetadata[],
  query: string,
  maxResults: number = 10
): SearchResult[] => {
  // 1글자부터 검색 가능!
  if (query.length < 1) return [];
  
  const normalizedQuery = query.toLowerCase().trim();
  
  // 값으로 검색하는 경우를 우선 처리
  const valueSearchResults: SearchResult[] = [];
  
  attributes.forEach(attr => {
    // possible_values나 examples에서 매칭되는 경우
    const hasMatchingValue = attr.possible_values.some(value => 
      value.key_name.toLowerCase().includes(normalizedQuery) ||
      value.key_kor_name.toLowerCase().includes(normalizedQuery)
    );
    
    if (hasMatchingValue) {
      valueSearchResults.push({
        attribute: attr,
        score: 1.5, // 값 매칭은 높은 점수
        matchType: 'fuzzy' as const
      });
    }
  });
  
  const prefixResults = searchByPrefix(attributes, query);
  const fuzzyResults = searchByFuzzy(attributes, query);
  
  // 값 검색 결과를 우선으로, 그 다음 Prefix, Fuzzy 결과
  const combinedResults = [...valueSearchResults, ...prefixResults, ...fuzzyResults];
  
  // 중복 제거
  const uniqueResults = combinedResults.filter((result, index, self) =>
    index === self.findIndex(r => r.attribute.attribute_name === result.attribute.attribute_name)
  );
  
  return uniqueResults.slice(0, maxResults);
};

// DOM 요소 위치 계산
export const calculateDropdownPosition = (inputElement: HTMLInputElement) => {
  const rect = inputElement.getBoundingClientRect();
  
  // fixed 포지션을 사용하므로 스크롤 위치를 더하지 않음
  return {
    top: rect.bottom + 2, // 입력 필드 바로 아래, 2px 간격
    left: rect.left,
    width: rect.width,
    maxHeight: Math.min(300, window.innerHeight - rect.bottom - 50) // 최대 높이 제한
  };
};

// 키보드 네비게이션 헬퍼
export const handleKeyNavigation = (
  event: KeyboardEvent,
  selectedIndex: number,
  resultsLength: number,
  onSelect: (index: number) => void,
  onConfirm: () => void,
  onCancel: () => void
) => {
  switch (event.key) {
    case 'ArrowDown':
      event.preventDefault();
      const nextIndex = selectedIndex < resultsLength - 1 ? selectedIndex + 1 : 0;
      onSelect(nextIndex);
      break;
      
    case 'ArrowUp':
      event.preventDefault();
      const prevIndex = selectedIndex > 0 ? selectedIndex - 1 : resultsLength - 1;
      onSelect(prevIndex);
      break;
      
    case 'Enter':
      event.preventDefault();
      onConfirm();
      break;
      
    case 'Escape':
      event.preventDefault();
      onCancel();
      break;
  }
};

// HTML 요소가 Braze 입력 필드인지 확인
export const isBrazeInputField = (element: HTMLElement): boolean => {
  if (!(element instanceof HTMLInputElement)) return false;
  
  // 🎯 실제 Braze 클래스명 검사
  const className = element.className || '';
  
  // Braze의 실제 input 클래스들
  if (className.includes('bcl-input') || 
      className.includes('bcl-select__input') ||
      className.includes('StyledInput-sc-')) {
    return true;
  }
  
  // ID 검사 (react-select-X-input 패턴)
  const id = element.id || '';
  if (id.match(/react-select-\d+-input/)) {
    return true;
  }
  
  // 플레이스홀더 검사
  const placeholder = element.placeholder?.toLowerCase() || '';
  if (placeholder.includes('filter') || 
      placeholder.includes('attribute') || 
      placeholder.includes('value') ||
      placeholder.includes('search')) {
    return true;
  }
  
  // 부모 요소 검사 (최대 5단계까지 - Braze는 깊은 중첩 구조)
  let parent = element.parentElement;
  let depth = 0;
  while (parent && depth < 5) {
    const parentClass = parent.className || '';
    const dataCy = parent.getAttribute('data-cy') || '';
    const role = parent.getAttribute('role') || '';
    
    // 실제 Braze 컨테이너 클래스/속성들
    if (parentClass.includes('custom_attributes_filter') ||
        parentClass.includes('filter-input') ||
        parentClass.includes('segment-filter-container') ||
        parentClass.includes('bcl-input-group') ||
        dataCy.includes('condition-group') ||
        role === 'filter' ||
        role === 'filterGroup') {
      return true;
    }
    
    parent = parent.parentElement;
    depth++;
  }
  
  return false;
};
