import React, { useState, useEffect, useRef, useMemo } from 'react';
import { AttributeMetadata, SearchResult, MultilingualValue } from '@/shared/types';
import { AUTOCOMPLETE_CONFIG, CATEGORY_COLORS } from '@/shared/constants';
import { searchAttributes, handleKeyNavigation } from '@/shared/utils';

interface AutocompleteUIProps {
  inputElement: HTMLInputElement;
  attributes: AttributeMetadata[];
  onSelect: (attribute: AttributeMetadata, value?: string) => void;
  onClose: () => void;
}

export const AutocompleteUI: React.FC<AutocompleteUIProps> = ({
  inputElement,
  attributes,
  onSelect,
  onClose
}) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [showValueSuggestions, setShowValueSuggestions] = useState(false);
  const [selectedAttribute, setSelectedAttribute] = useState<AttributeMetadata | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  // 검색 결과 계산
  const searchResults = useMemo(() => {
    if (query.length < AUTOCOMPLETE_CONFIG.MIN_QUERY_LENGTH) return [];
    return searchAttributes(attributes, query, AUTOCOMPLETE_CONFIG.MAX_RESULTS);
  }, [attributes, query]);
  
  // 카테고리별 그룹핑
  const groupedResults = useMemo(() => {
    const groups: Record<string, SearchResult[]> = {};
    
    searchResults.forEach(result => {
      const category = result.attribute.category || '기타';
      if (!groups[category]) {
        groups[category] = [];
      }
      groups[category].push(result);
    });
    
    return groups;
  }, [searchResults]);

  // 입력 필드 값 변화 감지
  useEffect(() => {
    const handleInput = () => {
      const value = inputElement.value;
      setQuery(value);
      setSelectedIndex(0);
      setShowValueSuggestions(false);
      setSelectedAttribute(null);
    };

    inputElement.addEventListener('input', handleInput);
    return () => inputElement.removeEventListener('input', handleInput);
  }, [inputElement]);

  // 키보드 네비게이션
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (showValueSuggestions && selectedAttribute) {
        handleValueKeyNavigation(event);
      } else if (searchResults.length > 0) {
        handleKeyNavigation(
          event,
          selectedIndex,
          searchResults.length,
          setSelectedIndex,
          () => handleAttributeSelect(searchResults[selectedIndex]?.attribute),
          onClose
        );
      }
    };

    inputElement.addEventListener('keydown', handleKeyDown);
    return () => inputElement.removeEventListener('keydown', handleKeyDown);
  }, [inputElement, selectedIndex, searchResults, showValueSuggestions, selectedAttribute]);

  // 속성 선택 처리
  const handleAttributeSelect = (attribute: AttributeMetadata) => {
    setSelectedAttribute(attribute);
    
    // Boolean 타입이거나 possible_values가 있는 경우 값 제안 표시
    if (attribute.data_type === 'Boolean' || attribute.possible_values.length > 0) {
      setShowValueSuggestions(true);
    } else {
      // 그 외의 경우 바로 속성명 입력
      onSelect(attribute);
    }
  };

  // 값 선택 처리
  const handleValueSelect = (value: MultilingualValue) => {
    if (selectedAttribute) {
      // 직접 입력인 경우 처리
      if (value.key_name === 'custom') {
        onSelect(selectedAttribute);
        return;
      }
      // 실제 값으로 key_name을 사용
      onSelect(selectedAttribute, value.key_name);
    }
  };

  // 값 제안 키보드 네비게이션
  const handleValueKeyNavigation = (event: KeyboardEvent) => {
    if (!selectedAttribute) return;
    
    const values = getValueSuggestions(selectedAttribute);
    
    handleKeyNavigation(
      event,
      selectedIndex,
      values.length,
      setSelectedIndex,
      () => handleValueSelect(values[selectedIndex]),
      () => setShowValueSuggestions(false)
    );
  };

  // 값 제안 목록 생성 (다국어 지원)
  const getValueSuggestions = (attribute: AttributeMetadata): MultilingualValue[] => {
    if (attribute.data_type === 'Boolean') {
      return [
        { key_name: 'true', key_kor_name: '참' },
        { key_name: 'false', key_kor_name: '거짓' }
      ];
    }
    
    const suggestions = [...attribute.possible_values];
    if (attribute.data_type !== 'Boolean') {
      suggestions.push({ key_name: 'custom', key_kor_name: '직접 입력...' });
    }
    
    return suggestions;
  };

  // 데이터 타입별 색상 클래스 반환
  const getTypeColorClass = (dataType: string): string => {
    switch (dataType.toLowerCase()) {
      case 'boolean': return 'type-boolean';
      case 'string': return 'type-string';
      case 'number': return 'type-number';
      case 'array': return 'type-array';
      case 'time': return 'type-time';
      default: return 'type-object';
    }
  };

  // 검색 결과가 없으면 렌더링하지 않음
  if (searchResults.length === 0 && !showValueSuggestions) {
    return null;
  }

  return (
    <div className="braze-autocomplete-container">
      {showValueSuggestions && selectedAttribute ? (
        // 값 제안 드롭다운
        <div ref={dropdownRef} className="braze-value-suggestions">
          <div className="px-3 py-2 bg-gray-50 border-b text-xs font-semibold text-gray-700">
            {selectedAttribute.attribute_name} 값 선택
          </div>
          {getValueSuggestions(selectedAttribute).map((value, index) => (
            <div
              key={value.key_name}
              className={`braze-value-item ${index === selectedIndex ? 'selected' : ''} ${
                value.key_name === 'custom' ? 'braze-value-item-custom' : ''
              }`}
              onClick={() => handleValueSelect(value)}
              onMouseEnter={() => setSelectedIndex(index)}
            >
              {value.key_name === 'custom' ? value.key_kor_name : `${value.key_kor_name} (${value.key_name})`}
            </div>
          ))}
        </div>
      ) : (
        // 속성 자동완성 드롭다운
        <div ref={dropdownRef} className="braze-autocomplete-dropdown">
          {Object.entries(groupedResults).map(([category, results]) => (
            <div key={category}>
              <div className="braze-autocomplete-category-header">
                {category}
              </div>
              {results.map((result, globalIndex) => {
                const isSelected = globalIndex === selectedIndex;
                return (
                  <div
                    key={result.attribute.attribute_name}
                    className={`braze-autocomplete-item ${isSelected ? 'selected' : ''}`}
                    onClick={() => handleAttributeSelect(result.attribute)}
                    onMouseEnter={() => setSelectedIndex(globalIndex)}
                  >
                    <div className="braze-autocomplete-item-header">
                      <span className="braze-autocomplete-item-name">
                        {result.attribute.attribute_name}
                      </span>
                      <span className={`braze-autocomplete-item-type ${getTypeColorClass(result.attribute.data_type)}`}>
                        {result.attribute.data_type}
                      </span>
                    </div>
                    <div className="braze-autocomplete-item-description">
                      {result.attribute.description}
                    </div>
                    {result.attribute.examples.length > 0 && (
                                          <div className="braze-autocomplete-item-examples">
                      예시: {result.attribute.examples.slice(0, 3).map(ex => `${ex.key_kor_name}(${ex.key_name})`).join(', ')}
                    </div>
                    )}
                    {result.attribute.usage_notes && (
                      <div className="braze-autocomplete-item-examples">
                        💡 {result.attribute.usage_notes}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AutocompleteUI;
