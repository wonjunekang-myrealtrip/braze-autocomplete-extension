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
    const finalValue = value ? `${attributeName} = "${value}"` : attributeName;
    
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

  // 정리
  destroy() {
    this.mutationObserver.disconnect();
    this.observedInputs.clear();
    console.log('BrazeDOMHandler 정리 완료');
  }
}

export default BrazeDOMHandler;
