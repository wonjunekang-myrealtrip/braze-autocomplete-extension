import { BRAZE_SELECTORS } from '@/shared/constants';
import { isBrazeInputField, calculateDropdownPosition } from '@/shared/utils';

export class BrazeDOMHandler {
  private observedInputs = new Set<HTMLInputElement>();
  private mutationObserver: MutationObserver;
  private onInputDetected: (input: HTMLInputElement) => void;

  constructor(onInputDetected: (input: HTMLInputElement) => void) {
    this.onInputDetected = onInputDetected;
    this.mutationObserver = new MutationObserver(this.handleMutations.bind(this));
    this.init();
  }

  private init() {
    // 기존 입력 필드 감지
    this.detectExistingInputs();
    
    // DOM 변화 감지 시작
    this.startObserving();
    
    console.log('BrazeDOMHandler 초기화 완료');
  }

  // 기존 입력 필드 감지
  private detectExistingInputs() {
    const inputs = this.findBrazeInputs();
    console.log(`기존 입력 필드 ${inputs.length}개 발견`);
    
    inputs.forEach(input => {
      if (!this.observedInputs.has(input)) {
        this.setupInputHandler(input);
      }
    });
  }

  // Braze 입력 필드 찾기
  private findBrazeInputs(): HTMLInputElement[] {
    const inputs: HTMLInputElement[] = [];
    
    // 선택자 기반 검색
    BRAZE_SELECTORS.INPUT_FIELDS.forEach(selector => {
      try {
        const elements = document.querySelectorAll(selector);
        elements.forEach(element => {
          if (element instanceof HTMLInputElement && isBrazeInputField(element)) {
            inputs.push(element);
          }
        });
      } catch (error) {
        console.warn(`선택자 "${selector}" 실행 중 오류:`, error);
      }
    });

    // 컨테이너 내부 검색
    BRAZE_SELECTORS.CONTAINERS.forEach(containerSelector => {
      try {
        const containers = document.querySelectorAll(containerSelector);
        containers.forEach(container => {
          const innerInputs = container.querySelectorAll('input[type="text"], input[type="search"], input:not([type])');
          innerInputs.forEach(input => {
            if (input instanceof HTMLInputElement && isBrazeInputField(input)) {
              inputs.push(input);
            }
          });
        });
      } catch (error) {
        console.warn(`컨테이너 선택자 "${containerSelector}" 실행 중 오류:`, error);
      }
    });

    // 중복 제거
    return Array.from(new Set(inputs));
  }

  // 입력 필드 핸들러 설정
  private setupInputHandler(input: HTMLInputElement) {
    if (this.observedInputs.has(input)) return;
    
    this.observedInputs.add(input);
    this.onInputDetected(input);
    
    console.log('입력 필드 핸들러 설정:', {
      placeholder: input.placeholder,
      className: input.className,
      id: input.id
    });
  }

  // DOM 변화 감지
  private startObserving() {
    this.mutationObserver.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['class', 'data-testid', 'data-cy', 'placeholder']
    });
  }

  // DOM 변화 처리
  private handleMutations(mutations: MutationRecord[]) {
    let shouldCheckInputs = false;

    mutations.forEach(mutation => {
      if (mutation.type === 'childList') {
        // 새로운 노드 추가 감지
        mutation.addedNodes.forEach(node => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            const element = node as Element;
            
            // 직접 입력 필드인 경우
            if (element instanceof HTMLInputElement && isBrazeInputField(element)) {
              this.setupInputHandler(element);
            }
            
            // 하위에 입력 필드가 있을 수 있는 경우
            if (element.querySelector) {
              shouldCheckInputs = true;
            }
          }
        });
      } else if (mutation.type === 'attributes') {
        // 속성 변화로 입력 필드가 될 수 있는 경우
        const target = mutation.target as Element;
        if (target instanceof HTMLInputElement && isBrazeInputField(target)) {
          this.setupInputHandler(target);
        }
      }
    });

    // 변화가 있었다면 전체 입력 필드 재검색
    if (shouldCheckInputs) {
      setTimeout(() => this.detectExistingInputs(), 100);
    }
  }

  // 자동완성 UI 위치 계산
  calculateDropdownPosition(inputElement: HTMLInputElement) {
    return calculateDropdownPosition(inputElement);
  }

  // 값 삽입
  insertValue(inputElement: HTMLInputElement, attributeName: string, value?: string) {
    // 태그 입력 필드인지 확인 (class에 'bcl-tag-input' 포함)
    const isTagInput = inputElement.classList.contains('bcl-tag-input');
    
    // Comparison 셀렉트박스 값 확인 (복수 선택 모드인지)
    let isMultipleValueMode = false;
    
    // 더 넓은 범위에서 Comparison 셀렉트박스 찾기
    const filterContainer = inputElement.closest('[role="filter"]') || 
                           inputElement.closest('.filter-group') ||
                           inputElement.closest('[data-cy="condition-group"]');
    
    if (filterContainer) {
      // 모든 select single value 요소 찾기
      const comparisonSelects = filterContainer.querySelectorAll('.bcl-select__single-value');
      comparisonSelects.forEach(select => {
        const text = select.textContent?.toLowerCase() || '';
        if (text.includes('contains any of') || text.includes("doesn't contain any of")) {
          isMultipleValueMode = true;
        }
      });
    }
    
    console.log('insertValue 디버깅:', {
      isTagInput,
      isMultipleValueMode,
      currentValue: inputElement.value,
      attributeName,
      value,
      classList: inputElement.className
    });
    
    if (isTagInput || isMultipleValueMode) {
      // 태그 입력 방식: 검색어를 완전히 제거하고 선택한 값만 입력
      const finalValue = value || attributeName;
      
      console.log('태그 입력 시작 - 현재값:', inputElement.value, '-> 새값:', finalValue);
      
      // 입력 필드가 이미 비어있는지 확인 (AutocompleteUI에서 비웠음)
      if (inputElement.value && inputElement.value !== '') {
        console.warn('경고: 입력 필드가 비어있지 않음:', inputElement.value);
        // 강제로 비우기
        inputElement.value = '';
        
        // 모든 방법으로 값 제거 시도
        const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
          HTMLInputElement.prototype,
          'value'
        )?.set;
        
        if (nativeInputValueSetter) {
          nativeInputValueSetter.call(inputElement, '');
        }
        
        // input 이벤트 발생
        const clearEvent = new Event('input', { bubbles: true });
        inputElement.dispatchEvent(clearEvent);
        
        // React 컴포넌트의 onChange 트리거
        const changeEvent = new Event('change', { bubbles: true });
        inputElement.dispatchEvent(changeEvent);
      }
      
      // 약간의 지연 후 선택한 값 입력
      setTimeout(() => {
        // React의 value setter 가져오기
        const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
          HTMLInputElement.prototype,
          'value'
        )?.set;
        
        // 선택한 값만 설정
        if (nativeInputValueSetter) {
          nativeInputValueSetter.call(inputElement, finalValue);
        } else {
          inputElement.value = finalValue;
        }
        
        // React 상태 업데이트를 위한 이벤트
        const inputEvent = new Event('input', { bubbles: true });
        inputElement.dispatchEvent(inputEvent);
        
        // 포커스 유지
        inputElement.focus();
        
        // Enter 키로 태그 생성
        setTimeout(() => {
          // Enter 키 이벤트 발생
          const enterEvent = new KeyboardEvent('keydown', {
            key: 'Enter',
            code: 'Enter',
            keyCode: 13,
            which: 13,
            bubbles: true
          });
          inputElement.dispatchEvent(enterEvent);
          
          // 태그 생성 후 필드 클리어
          setTimeout(() => {
            inputElement.value = '';
            if (nativeInputValueSetter) {
              nativeInputValueSetter.call(inputElement, '');
            }
            inputElement.dispatchEvent(new Event('input', { bubbles: true }));
            inputElement.focus();
          }, 50);
        }, 20);
      }, 10);
      
      console.log('태그 입력 처리 완료');
    } else {
      // 일반 입력 필드 처리
      const currentValue = inputElement.value;
      let finalValue: string;
      
      // 복수 값 입력 처리 - 현재 입력 중인 검색어를 찾아서 교체
      if (currentValue && currentValue.trim()) {
        // 마지막 콤마 이후의 텍스트 찾기 (검색어 부분)
        const lastCommaIndex = currentValue.lastIndexOf(',');
        
        if (lastCommaIndex !== -1) {
          // 콤마가 있는 경우 - 복수 값 입력 중
          const beforeComma = currentValue.substring(0, lastCommaIndex + 1);
          const searchTerm = currentValue.substring(lastCommaIndex + 1).trim();
          
          // 검색어 부분을 선택한 값으로 교체
          const newValue = value ? `${attributeName} = "${value}"` : attributeName;
          finalValue = `${beforeComma} ${newValue}`;
        } else {
          // 첫 번째 값이거나 단일 값 - 검색어를 선택한 값으로 완전 교체
          finalValue = value ? `${attributeName} = "${value}"` : attributeName;
        }
      } else {
        // 빈 입력 필드
        finalValue = value ? `${attributeName} = "${value}"` : attributeName;
      }
      
      // React나 다른 프레임워크에서 감지할 수 있도록 이벤트 발생
      const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
        HTMLInputElement.prototype,
        'value'
      )?.set;
      
      if (nativeInputValueSetter) {
        nativeInputValueSetter.call(inputElement, finalValue);
      } else {
        inputElement.value = finalValue;
      }
      
      // 입력 이벤트 발생
      inputElement.dispatchEvent(new Event('input', { bubbles: true }));
      inputElement.dispatchEvent(new Event('change', { bubbles: true }));
      
      // 포커스 및 커서 위치 설정
      inputElement.focus();
      inputElement.setSelectionRange(finalValue.length, finalValue.length);
      
      console.log('값 삽입 완료:', finalValue);
    }
  }

  // 정리
  destroy() {
    this.mutationObserver.disconnect();
    this.observedInputs.clear();
    console.log('BrazeDOMHandler 정리 완료');
  }
}

export default BrazeDOMHandler;
