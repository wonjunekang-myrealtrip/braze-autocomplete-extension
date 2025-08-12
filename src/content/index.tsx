import React from 'react';
import { createRoot } from 'react-dom/client';
import AutocompleteUI from './AutocompleteUI';
import BrazeDOMHandler from './BrazeDOMHandler';
import { AttributeMetadata, ExtensionMessage } from '@/shared/types';
import { AUTOCOMPLETE_CONFIG } from '@/shared/constants';
import { debounce } from '@/shared/utils';
import '@/styles/tailwind.css';

class BrazeAutocompleteManager {
  private attributes: AttributeMetadata[] = [];
  private domHandler: BrazeDOMHandler;
  private activeDropdowns = new Map<HTMLInputElement, {
    container: HTMLDivElement;
    root: any;
  }>();
  
  constructor() {
    this.domHandler = new BrazeDOMHandler(this.handleInputDetected.bind(this));
    this.loadAttributes();
    
    // 페이지 언로드 시 정리
    window.addEventListener('beforeunload', this.cleanup.bind(this));
    
    console.log('BrazeAutocompleteManager 초기화 완료');
  }

  // 속성 데이터 로드
  private async loadAttributes() {
    try {
      const response = await this.sendMessage({ type: 'GET_ATTRIBUTES' });
      if (response.success) {
        this.attributes = response.data;
        console.log(`속성 데이터 로드 완료: ${this.attributes.length}개`);
      } else {
        console.error('속성 데이터 로드 실패:', response.error);
      }
    } catch (error) {
      console.error('속성 데이터 로드 중 오류:', error);
    }
  }

  // Background Script와 통신
  private sendMessage(message: ExtensionMessage): Promise<any> {
    return new Promise((resolve) => {
      chrome.runtime.sendMessage(message, resolve);
    });
  }

  // 입력 필드 감지 처리
  private handleInputDetected(inputElement: HTMLInputElement) {
    console.log('새로운 입력 필드 감지됨:', {
      id: inputElement.id,
      className: inputElement.className,
      placeholder: inputElement.placeholder,
      value: inputElement.value
    });
    
    // 기존 리스너 제거 (중복 방지)
    this.removeInputListeners(inputElement);
    
    // 새로운 리스너 추가
    this.addInputListeners(inputElement);
  }

  // 입력 리스너 추가
  private addInputListeners(inputElement: HTMLInputElement) {
    // 입력 핸들러 (디바운스 없이 즉시 반응)
    const inputHandler = (event: Event) => {
      console.log('입력 이벤트 발생:', (event.target as HTMLInputElement).value);
      this.handleInput(event as InputEvent);
    };

    // 입력 이벤트
    inputElement.addEventListener('input', inputHandler);
    
    // 포커스 이벤트
    inputElement.addEventListener('focus', (event) => {
      console.log('포커스 이벤트 발생');
      const value = inputElement.value.trim();
      if (value.length >= AUTOCOMPLETE_CONFIG.MIN_QUERY_LENGTH) {
        this.showAutocomplete(inputElement);
      }
    });

    // 블러 이벤트 (지연 후 숨김 - 클릭 이벤트 처리를 위해)
    inputElement.addEventListener('blur', () => {
      setTimeout(() => {
        this.hideAutocomplete(inputElement);
      }, 200);
    });

    // 데이터 속성으로 리스너 추가됨을 표시
    inputElement.setAttribute('data-braze-autocomplete', 'enabled');
  }

  // 입력 리스너 제거
  private removeInputListeners(inputElement: HTMLInputElement) {
    // 기존 자동완성 숨기기
    this.hideAutocomplete(inputElement);
    
    // 클론을 통한 모든 이벤트 리스너 제거
    const newElement = inputElement.cloneNode(true) as HTMLInputElement;
    inputElement.parentNode?.replaceChild(newElement, inputElement);
  }

  // 입력 처리
  private handleInput(event: InputEvent) {
    const inputElement = event.target as HTMLInputElement;
    const query = inputElement.value.trim();
    
    console.log('handleInput - 입력값:', query, '길이:', query.length);
    
    if (query.length >= AUTOCOMPLETE_CONFIG.MIN_QUERY_LENGTH) {
      console.log('자동완성 표시 시도');
      this.showAutocomplete(inputElement);
    } else {
      console.log('자동완성 숨김 (글자 수 부족)');
      this.hideAutocomplete(inputElement);
    }
  }

  // 자동완성 표시
  private showAutocomplete(inputElement: HTMLInputElement) {
    console.log('showAutocomplete 시작, 속성 개수:', this.attributes.length);
    
    if (this.attributes.length === 0) {
      console.warn('속성 데이터가 없습니다.');
      // 데이터 다시 로드 시도
      this.loadAttributes();
      return;
    }

    // 기존 드롭다운 제거
    this.hideAutocomplete(inputElement);

    // 위치 계산
    const position = this.domHandler.calculateDropdownPosition(inputElement);
    console.log('드롭다운 위치:', position);
    
    // 컨테이너 생성
    const container = document.createElement('div');
    container.className = 'braze-autocomplete-wrapper';
    container.style.cssText = `
      position: fixed;
      top: ${position.top}px;
      left: ${position.left}px;
      width: ${position.width}px;
      max-height: ${position.maxHeight}px;
      z-index: ${AUTOCOMPLETE_CONFIG.DROPDOWN_Z_INDEX};
      pointer-events: auto;
      background: white;
      border: 1px solid #ccc;
      border-radius: 4px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.15);
    `;

    // Shadow DOM 사용 (스타일 격리)
    const shadowRoot = container.attachShadow({ mode: 'open' });
    
    // Tailwind CSS 스타일 주입
    const styleSheet = document.createElement('style');
    styleSheet.textContent = `
      /* Tailwind CSS 기본 스타일 */
      .braze-autocomplete-container { font-family: system-ui, -apple-system, sans-serif; font-size: 0.875rem; }
      .braze-autocomplete-dropdown { 
        background: white; 
        border: 1px solid #d1d5db; 
        border-radius: 0.5rem; 
        box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1); 
        max-height: 20rem; 
        overflow-y: auto; 
      }
      .braze-autocomplete-item { 
        padding: 0.75rem 1rem; 
        cursor: pointer; 
        border-bottom: 1px solid #f3f4f6; 
        transition: background-color 0.1s; 
      }
      .braze-autocomplete-item:hover, .braze-autocomplete-item.selected { 
        background-color: #f9fafb; 
      }
      .braze-autocomplete-item.selected { 
        background-color: #dbeafe; 
        border-color: #93c5fd; 
      }
      .braze-autocomplete-item-header { 
        display: flex; 
        align-items: center; 
        justify-content: space-between; 
        margin-bottom: 0.25rem; 
      }
      .braze-autocomplete-item-name { 
        font-weight: 600; 
        color: #111827; 
        font-size: 0.875rem; 
      }
      .braze-autocomplete-item-type { 
        padding: 0.25rem 0.5rem; 
        font-size: 0.75rem; 
        border-radius: 9999px; 
        color: white; 
        font-weight: 500; 
      }
      .braze-autocomplete-item-description { 
        color: #6b7280; 
        font-size: 0.75rem; 
        margin-bottom: 0.25rem; 
      }
      .braze-autocomplete-item-examples { 
        color: #9ca3af; 
        font-size: 0.75rem; 
      }
      .braze-autocomplete-category-header { 
        padding: 0.5rem 1rem; 
        background-color: #f3f4f6; 
        color: #374151; 
        font-size: 0.75rem; 
        font-weight: 600; 
        text-transform: uppercase; 
        letter-spacing: 0.025em; 
        position: sticky; 
        top: 0; 
      }
      .type-boolean { background-color: #10b981; }
      .type-string { background-color: #3b82f6; }
      .type-number { background-color: #f59e0b; }
      .type-array { background-color: #8b5cf6; }
      .type-time { background-color: #ef4444; }
      .type-object { background-color: #6b7280; }
      .braze-value-suggestions { 
        background: white; 
        border: 1px solid #d1d5db; 
        border-radius: 0.5rem; 
        box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1); 
        max-height: 15rem; 
        overflow-y: auto; 
        margin-top: 0.25rem; 
      }
      .braze-value-item { 
        padding: 0.5rem 0.75rem; 
        cursor: pointer; 
        border-bottom: 1px solid #f3f4f6; 
        font-size: 0.875rem; 
      }
      .braze-value-item:hover, .braze-value-item.selected { 
        background-color: #f9fafb; 
      }
      .braze-value-item-custom { 
        color: #2563eb; 
        font-weight: 500; 
      }
    `;
    shadowRoot.appendChild(styleSheet);

    // React 컨테이너
    const reactContainer = document.createElement('div');
    shadowRoot.appendChild(reactContainer);
    
    // React 렌더링
    const root = createRoot(reactContainer);
    root.render(
      <AutocompleteUI
        inputElement={inputElement}
        attributes={this.attributes}
        onSelect={(attribute, value) => {
          this.handleAttributeSelect(inputElement, attribute, value);
        }}
        onClose={() => this.hideAutocomplete(inputElement)}
      />
    );

    // DOM에 추가
    document.body.appendChild(container);
    
    // 활성 드롭다운 추적
    this.activeDropdowns.set(inputElement, { container, root });
    
    console.log('자동완성 UI 표시됨');
  }

  // 자동완성 숨기기
  private hideAutocomplete(inputElement: HTMLInputElement) {
    const dropdown = this.activeDropdowns.get(inputElement);
    if (dropdown) {
      // React 언마운트
      dropdown.root.unmount();
      
      // DOM에서 제거
      if (dropdown.container.parentNode) {
        dropdown.container.parentNode.removeChild(dropdown.container);
      }
      
      // 추적에서 제거
      this.activeDropdowns.delete(inputElement);
      
      console.log('자동완성 UI 숨김');
    }
  }

  // 속성 선택 처리
  private handleAttributeSelect(
    inputElement: HTMLInputElement, 
    attribute: AttributeMetadata, 
    value?: string
  ) {
    // 값 삽입
    this.domHandler.insertValue(inputElement, attribute.attribute_name, value);
    
    // 자동완성 숨기기
    this.hideAutocomplete(inputElement);
    
    console.log('속성 선택됨:', attribute.attribute_name, value);
  }

  // 정리
  private cleanup() {
    // 모든 활성 드롭다운 제거
    this.activeDropdowns.forEach((dropdown, inputElement) => {
      this.hideAutocomplete(inputElement);
    });
    
    // DOM 핸들러 정리
    this.domHandler.destroy();
    
    console.log('BrazeAutocompleteManager 정리 완료');
  }
}

// 페이지 로드 완료 후 초기화
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    new BrazeAutocompleteManager();
  });
} else {
  new BrazeAutocompleteManager();
}

// Hot reload 지원 (개발 모드)
if (module.hot) {
  module.hot.accept();
}
