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
      const fullValue = inputElement.value;
      
      // 태그 입력 필드인 경우 그대로 사용
      const isTagInput = inputElement.classList.contains('bcl-tag-input');
      
      let searchQuery = fullValue;
      
      if (!isTagInput) {
        // 일반 입력 필드: 콤마로 구분된 복수 값 입력 처리
        // 마지막 콤마 이후의 텍스트를 검색어로 사용
        const lastCommaIndex = fullValue.lastIndexOf(',');
        
        if (lastCommaIndex !== -1) {
          // 콤마 이후의 텍스트만 검색어로 사용
          searchQuery = fullValue.substring(lastCommaIndex + 1).trim();
        }
      }
      
      setQuery(searchQuery.trim());
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
        // Enter 키를 눌렀을 때만 선택 처리
        if (event.key === 'Enter' && searchResults[selectedIndex]) {
          event.preventDefault();
          event.stopPropagation();
          handleAttributeSelect(searchResults[selectedIndex].attribute);
        } else {
          // 다른 키는 기존 네비게이션 처리
          handleKeyNavigation(
            event,
            selectedIndex,
            searchResults.length,
            setSelectedIndex,
            () => {}, // Enter 처리를 위에서 하므로 여기선 빈 함수
            onClose
          );
        }
      }
    };

    inputElement.addEventListener('keydown', handleKeyDown, true); // capture phase 사용
    return () => inputElement.removeEventListener('keydown', handleKeyDown, true);
  }, [inputElement, selectedIndex, searchResults, showValueSuggestions, selectedAttribute]);

  // 속성 선택 처리
  const handleAttributeSelect = (attribute: AttributeMetadata) => {
    // 입력 필드에 값이 있으면 즉시 제거 (태그 생성 방지)
    if (inputElement.value) {
      // 포커스 유지하면서 값만 제거
      const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
        HTMLInputElement.prototype,
        'value'
      )?.set;
      
      if (nativeInputValueSetter) {
        nativeInputValueSetter.call(inputElement, '');
      } else {
        inputElement.value = '';
      }
      
      // React 상태 업데이트
      inputElement.dispatchEvent(new Event('input', { bubbles: true }));
      
      // 포커스 유지 (blur 방지)
      inputElement.focus();
    }
    
    // 검색어가 도시명이나 값에 매칭되는 경우 바로 그 값을 입력
    if (attribute.possible_values.length > 0 && query.length > 0) {
      const matchedValue = attribute.possible_values.find(v => 
        v.key_name.toLowerCase().includes(query.toLowerCase()) ||
        v.key_kor_name.toLowerCase().includes(query.toLowerCase())
      );
      
      if (matchedValue) {
        // 약간의 지연 후 값 입력 (blur 이벤트 처리 후)
        setTimeout(() => {
          onSelect(attribute, matchedValue.key_name);
        }, 50);
        return;
      }
    }
    
    setSelectedAttribute(attribute);
    
    // Boolean 타입이거나 possible_values가 있는 경우 값 제안 표시
    if (attribute.data_type === 'Boolean' || attribute.possible_values.length > 0) {
      setShowValueSuggestions(true);
    } else {
      // 그 외의 경우 바로 속성명 입력
      setTimeout(() => {
        onSelect(attribute);
      }, 50);
    }
  };

  // 값 선택 처리
  const handleValueSelect = (value: MultilingualValue) => {
    if (selectedAttribute) {
      // 입력 필드를 먼저 비워서 검색어가 태그로 변환되는 것을 방지
      if (inputElement.value) {
        inputElement.value = '';
        inputElement.dispatchEvent(new Event('input', { bubbles: true }));
      }
      
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
              onMouseDown={(e) => {
                e.preventDefault(); // 포커스 이동 방지
                e.stopPropagation(); // 이벤트 전파 방지
                e.stopImmediatePropagation(); // 모든 이벤트 전파 중지
                
                // 드롭다운 선택 중임을 표시
                if ((inputElement as any).__setSelecting) {
                  (inputElement as any).__setSelecting(true);
                }
                
                // Braze의 모든 이벤트 리스너 일시 제거
                const originalListeners = {
                  blur: inputElement.onblur,
                  change: inputElement.onchange,
                  keydown: inputElement.onkeydown
                };
                
                // 이벤트 리스너 제거
                inputElement.onblur = null;
                inputElement.onchange = null;
                inputElement.onkeydown = null;
                
                // 입력 필드 값 제거
                const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
                  HTMLInputElement.prototype,
                  'value'
                )?.set;
                
                inputElement.value = '';
                if (nativeInputValueSetter) {
                  nativeInputValueSetter.call(inputElement, '');
                }
                
                // React 상태 업데이트
                inputElement.dispatchEvent(new Event('input', { bubbles: true }));
                
                // 포커스 유지
                inputElement.focus();
                
                // 값 선택 처리 (지연 실행)
                setTimeout(() => {
                  handleValueSelect(value);
                  
                  // 리스너 복원
                  setTimeout(() => {
                    inputElement.onblur = originalListeners.blur;
                    inputElement.onchange = originalListeners.change;
                    inputElement.onkeydown = originalListeners.keydown;
                    
                    // 선택 완료 표시
                    if ((inputElement as any).__setSelecting) {
                      (inputElement as any).__setSelecting(false);
                    }
                  }, 100);
                }, 10);
              }}
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
                    onMouseDown={(e) => {
                      e.preventDefault(); // 포커스 이동 및 기본 동작 방지
                      e.stopPropagation();
                      e.stopImmediatePropagation(); // 모든 이벤트 전파 중지
                      
                      // 드롭다운 선택 중임을 표시
                      if ((inputElement as any).__setSelecting) {
                        (inputElement as any).__setSelecting(true);
                      }
                      
                      // 현재 입력값 백업 후 즉시 제거
                      const currentValue = inputElement.value;
                      console.log('드롭다운 클릭 - 현재값:', currentValue);
                      
                      // Braze의 모든 이벤트 리스너 일시 제거
                      const originalListeners = {
                        blur: inputElement.onblur,
                        change: inputElement.onchange,
                        keydown: inputElement.onkeydown
                      };
                      
                      // 이벤트 리스너 제거
                      inputElement.onblur = null;
                      inputElement.onchange = null;
                      inputElement.onkeydown = null;
                      
                      // 입력 필드 값을 즉시 비우기
                      const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
                        HTMLInputElement.prototype,
                        'value'
                      )?.set;
                      
                      inputElement.value = '';
                      if (nativeInputValueSetter) {
                        nativeInputValueSetter.call(inputElement, '');
                      }
                      
                      // input 이벤트 발생 (React 상태 동기화)
                      const inputEvent = new Event('input', { bubbles: true });
                      inputElement.dispatchEvent(inputEvent);
                      
                      // 포커스 유지
                      inputElement.focus();
                      
                      // 선택 처리 후 리스너 복원
                      setTimeout(() => {
                        handleAttributeSelect(result.attribute);
                        
                        // 리스너 복원
                        setTimeout(() => {
                          inputElement.onblur = originalListeners.blur;
                          inputElement.onchange = originalListeners.change;
                          inputElement.onkeydown = originalListeners.keydown;
                          
                          // 선택 완료 표시
                          if ((inputElement as any).__setSelecting) {
                            (inputElement as any).__setSelecting(false);
                          }
                        }, 100);
                      }, 10);
                    }}
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
