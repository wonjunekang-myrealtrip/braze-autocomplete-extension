// 마이리얼트립 상품 검색 기능
console.log('MyRealTrip Product Search - Initializing');

interface Product {
  gid: number;
  title: string;
  price: string;
  thumbnail: string;
  description: string;
  linkUrl?: string;
}

class ProductSearchModal {
  private modal: HTMLElement | null = null;
  private searchInput: HTMLInputElement | null = null;
  private resultsContainer: HTMLElement | null = null;
  private currentPage = 1;
  private currentQuery = '';
  private isLoading = false;
  private hasMore = true;
  private isRedirect = false; // 리다이렉트 상태 추가

  constructor() {
    this.createFloatingButton();
    this.createModal();
  }

  // 플로팅 버튼 생성
  private createFloatingButton() {
    const button = document.createElement('button');
    button.id = 'mrt-search-button';
    button.innerHTML = `
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="11" cy="11" r="8"></circle>
        <path d="m21 21-4.35-4.35"></path>
      </svg>
      <span>상품 검색</span>
    `;
    button.style.cssText = `
      position: fixed;
      bottom: 130px;
      right: 30px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      border: none;
      border-radius: 50px;
      padding: 10px 16px;
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
      box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
      z-index: 9998;
      transition: all 0.3s ease;
      font-family: 'Noto Sans KR', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    `;

    button.addEventListener('mouseenter', () => {
      button.style.transform = 'scale(1.05)';
      button.style.boxShadow = '0 6px 20px rgba(102, 126, 234, 0.6)';
    });

    button.addEventListener('mouseleave', () => {
      button.style.transform = 'scale(1)';
      button.style.boxShadow = '0 4px 12px rgba(102, 126, 234, 0.4)';
    });

    button.addEventListener('click', () => {
      this.showModal();
    });

    document.body.appendChild(button);
  }

  // 모달 생성
  private createModal() {
    // 폰트 추가
    const fontLink = document.createElement('link');
    fontLink.href = 'https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;500;600;700&display=swap';
    fontLink.rel = 'stylesheet';
    document.head.appendChild(fontLink);

    const modalContainer = document.createElement('div');
    modalContainer.id = 'mrt-search-modal';
    modalContainer.style.cssText = `
      position: fixed;
      bottom: 190px;
      right: 30px;
      width: 400px;
      height: 500px;
      background: white;
      border-radius: 16px;
      box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
      z-index: 9999;
      display: none;
      flex-direction: column;
      font-family: 'Noto Sans KR', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      overflow: hidden;
    `;

    modalContainer.innerHTML = `
      <div style="
        padding: 20px;
        border-bottom: 1px solid #e5e7eb;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      ">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
          <h3 style="margin: 0; color: white; font-size: 18px; font-weight: 600;">
            마이리얼트립 상품 검색
          </h3>
          <button id="mrt-close-btn" style="
            background: rgba(255, 255, 255, 0.2);
            border: none;
            color: white;
            width: 28px;
            height: 28px;
            border-radius: 50%;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 18px;
            transition: background 0.2s;
          ">×</button>
        </div>
        <div style="position: relative; display: flex; align-items: center;">
          <input 
            id="mrt-search-input" 
            type="text" 
            placeholder="검색어를 입력하세요 (예: 파리 투어, 도쿄 호텔)"
            style="
              width: 100%;
              height: 44px;
              padding: 12px 50px 12px 14px;
              border: none;
              border-radius: 8px;
              font-size: 14px;
              background: white;
              box-sizing: border-box;
              outline: none;
            "
          />
          <button id="mrt-search-btn" type="button" style="
            position: absolute;
            right: 9px;
            top: -6px;
            bottom: 0;
            margin: auto 0;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            border: none;
            color: white;
            width: 26px;
            height: 26px;
            border-radius: 5px;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 0.2s ease;
            font-family: 'Noto Sans KR', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          ">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <circle cx="11" cy="11" r="8"></circle>
              <path d="m21 21-4.35-4.35"></path>
            </svg>
          </button>
        </div>
      </div>
      
      <div id="mrt-results" style="
        flex: 1;
        overflow-y: auto;
        padding: 12px;
      ">
        <div style="
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 100%;
          color: #9ca3af;
        ">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="margin-bottom: 12px;">
            <circle cx="11" cy="11" r="8"></circle>
            <path d="m21 21-4.35-4.35"></path>
          </svg>
          <p style="margin: 0; font-size: 14px;">검색어를 입력해주세요</p>
        </div>
      </div>
      
      <div id="mrt-loading" style="
        display: none;
        padding: 20px;
        text-align: center;
        color: #667eea;
      ">
        <div style="
          display: inline-block;
          width: 32px;
          height: 32px;
          border: 3px solid #e5e7eb;
          border-top-color: #667eea;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        "></div>
        <style>
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        </style>
      </div>
    `;

    document.body.appendChild(modalContainer);
    this.modal = modalContainer;
    this.searchInput = modalContainer.querySelector('#mrt-search-input') as HTMLInputElement;
    this.resultsContainer = modalContainer.querySelector('#mrt-results') as HTMLElement;

    // 이벤트 리스너
    const closeBtn = modalContainer.querySelector('#mrt-close-btn') as HTMLButtonElement;
    closeBtn.addEventListener('click', () => this.hideModal());

    const searchBtn = modalContainer.querySelector('#mrt-search-btn') as HTMLButtonElement;
    if (searchBtn) {
      searchBtn.addEventListener('click', () => this.performSearch());
      
      // 호버 효과 추가
      searchBtn.addEventListener('mouseenter', () => {
        searchBtn.style.transform = 'scale(1.05)';
        searchBtn.style.boxShadow = '0 2px 8px rgba(102, 126, 234, 0.5)';
      });
      
      searchBtn.addEventListener('mouseleave', () => {
        searchBtn.style.transform = 'scale(1)';
        searchBtn.style.boxShadow = 'none';
      });
    }

    this.searchInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        this.performSearch();
      }
    });
    
    // 입력 필드 포커스 효과
    this.searchInput.addEventListener('focus', () => {
      this.searchInput.style.boxShadow = '0 0 0 2px rgba(102, 126, 234, 0.2)';
    });
    
    this.searchInput.addEventListener('blur', () => {
      this.searchInput.style.boxShadow = 'none';
    });

    // 스크롤 이벤트로 페이징 (아래로 스크롤할 때만, 리다이렉트가 아닐 때만)
    let lastScrollTop = 0;
    this.resultsContainer.addEventListener('scroll', () => {
      // 리다이렉트 상태면 페이징 처리 안함
      if (this.isRedirect) return;
      
      const { scrollTop, scrollHeight, clientHeight } = this.resultsContainer!;
      
      // 아래로 스크롤하는 경우에만 체크
      if (scrollTop > lastScrollTop) {
        if (scrollHeight - scrollTop <= clientHeight + 100 && !this.isLoading && this.hasMore) {
          this.loadMore();
        }
      }
      lastScrollTop = scrollTop;
    });

    // ESC 키로 닫기
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.modal?.style.display === 'flex') {
        this.hideModal();
      }
    });
  }

  // 모달 표시
  private showModal() {
    if (this.modal) {
      this.modal.style.display = 'flex';
      this.searchInput?.focus();
    }
  }

  // 모달 숨기기
  private hideModal() {
    if (this.modal) {
      this.modal.style.display = 'none';
    }
  }

  // 검색 수행
  private async performSearch() {
    const query = this.searchInput?.value.trim();
    if (!query) return;

    this.currentQuery = query;
    this.currentPage = 1;
    this.hasMore = true;
    this.isRedirect = false; // 리다이렉트 상태 초기화
    
    await this.searchProducts(true);
  }

  // 추가 로드
  private async loadMore() {
    if (!this.currentQuery || !this.hasMore) return;
    
    this.currentPage++;
    await this.searchProducts(false);
  }

  // API 호출
  private async searchProducts(isNewSearch: boolean) {
    if (this.isLoading) return;
    
    this.isLoading = true;
    const loadingEl = document.querySelector('#mrt-loading') as HTMLElement;
    if (loadingEl) loadingEl.style.display = 'block';

    try {
      const response = await fetch(
        `https://api3.myrealtrip.com/search/union/v4/web?q=${encodeURIComponent(this.currentQuery)}&per=20&page=${this.currentPage}&tab=all`,
        {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
          }
        }
      );

      if (!response.ok) throw new Error('검색 실패');
      
      const data = await response.json();
      
      // 리다이렉트 URL 체크 (도시명 검색 등)
      const redirectUrl = data?.data?.dynamicArea?.pageMeta?.redirectUrl;
      if (redirectUrl) {
        console.log('Redirect detected:', redirectUrl);
        this.isRedirect = true; // 리다이렉트 상태 설정
        this.hasMore = false; // 추가 로드 방지
        this.displayRedirectMessage(redirectUrl);
        return;
      }
      
      const sections = data?.data?.dynamicArea?.sections || [];
      
      // 다음 페이지 확인
      const nextPageUrl = data?.data?.dynamicArea?.pageMeta?.nextPageUrl;
      this.hasMore = !!nextPageUrl;

      const products: Product[] = [];
      
      // 상품 데이터 추출 - 실제 응답 구조에 맞게 수정
      console.log('Sections found:', sections.length);
      
      sections.forEach((section: any) => {
        // CAROUSEL_LARGE_THUMBNAIL_CARDS_CONTAINER 타입 처리
        if (section.sectionType === 'CAROUSEL_LARGE_THUMBNAIL_CARDS_CONTAINER' && section.body?.sections) {
          console.log('Found container with sections:', section.body.sections.length);
          
          section.body.sections.forEach((item: any) => {
            if (item.sectionType === 'CAROUSEL_LARGE_THUMBNAIL_CARD' && item.body) {
              const body = item.body;
              const gid = item.sectionMeta?.gid;
              const linkUrl = item.sectionMeta?.linkMeta?.SECTION;
              
              console.log('Product data:', {
                gid,
                title: body.title?.text,
                link: linkUrl
              });
              
              if (gid && body.title?.text) {
                products.push({
                  gid,
                  title: body.title.text,
                  description: body.description?.text || '',
                  price: body.price?.texts?.[0]?.text || body.price?.text || '가격 정보 없음',
                  thumbnail: body.thumbnail?.url || '',
                  linkUrl: linkUrl || `https://www.myrealtrip.com/offers/${gid}`
                });
                console.log('Added product:', body.title.text, 'GID:', gid);
              }
            }
          });
        }
      });
      
      console.log('Total products found:', products.length);

      this.displayResults(products, isNewSearch);
      
    } catch (error) {
      console.error('검색 오류:', error);
      this.displayError();
    } finally {
      this.isLoading = false;
      if (loadingEl) loadingEl.style.display = 'none';
    }
  }

  // 결과 표시
  private displayResults(products: Product[], isNewSearch: boolean) {
    if (!this.resultsContainer) return;

    if (isNewSearch) {
      this.resultsContainer.innerHTML = '';
    }

    if (products.length === 0 && isNewSearch) {
      this.resultsContainer.innerHTML = `
        <div style="
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 100%;
          color: #9ca3af;
          padding: 20px;
        ">
          <p style="margin: 0; font-size: 14px;">검색 결과가 없습니다</p>
        </div>
      `;
      return;
    }

    products.forEach(product => {
      const productCard = document.createElement('div');
      productCard.style.cssText = `
        background: white;
        border: 1px solid #e5e7eb;
        border-radius: 12px;
        padding: 12px;
        margin-bottom: 12px;
        cursor: pointer;
        transition: all 0.2s;
        display: flex;
        gap: 12px;
      `;

      productCard.innerHTML = `
        ${product.thumbnail ? `
          <img src="${product.thumbnail}" style="
            width: 80px;
            height: 80px;
            object-fit: cover;
            border-radius: 8px;
            flex-shrink: 0;
          " />
        ` : ''}
        <div style="flex: 1; min-width: 0;">
          <h4 style="
            margin: 0 0 4px 0;
            font-size: 14px;
            font-weight: 600;
            color: #111827;
            overflow: hidden;
            text-overflow: ellipsis;
            display: -webkit-box;
            -webkit-line-clamp: 2;
            -webkit-box-orient: vertical;
          ">${product.title}</h4>
          <p style="
            margin: 0 0 4px 0;
            font-size: 12px;
            color: #6b7280;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
          ">${product.description}</p>
          <div style="
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-top: 8px;
          ">
            <div style="
              font-size: 14px;
              font-weight: 600;
              color: #667eea;
            ">${product.price}</div>
            <div style="display: flex; align-items: center; gap: 6px;">
              <button class="gid-copy-btn" data-gid="${product.gid}" style="
                font-size: 11px;
                color: #6b7280;
                font-weight: 500;
                background: #f9fafb;
                border: 1px solid #e5e7eb;
                padding: 3px 6px;
                border-radius: 4px;
                cursor: pointer;
                transition: all 0.2s;
                display: flex;
                align-items: center;
                gap: 3px;
                line-height: 1;
              ">
                <span style="font-size: 9px;">📋</span>
                <span>${product.gid}</span>
              </button>
              <button class="product-link-btn" data-url="${product.linkUrl || `https://www.myrealtrip.com/offers/${product.gid}`}" style="
                background: #667eea;
                color: white;
                border: none;
                padding: 4px 8px;
                border-radius: 4px;
                font-size: 11px;
                font-weight: 500;
                cursor: pointer;
                transition: all 0.2s;
                display: flex;
                align-items: center;
                gap: 3px;
                line-height: 1;
              ">
                <span style="font-size: 9px;">🔗</span>
                <span>바로가기</span>
              </button>
            </div>
          </div>
        </div>
      `;

      // GID 복사 버튼 이벤트
      const gidBtn = productCard.querySelector('.gid-copy-btn') as HTMLButtonElement;
      if (gidBtn) {
        gidBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          this.copyToClipboard(product.gid.toString());
        });
        
        gidBtn.addEventListener('mouseenter', () => {
          gidBtn.style.background = '#e5e7eb';
        });
        
        gidBtn.addEventListener('mouseleave', () => {
          gidBtn.style.background = '#f3f4f6';
        });
      }

      // 바로가기 버튼 이벤트
      const linkBtn = productCard.querySelector('.product-link-btn') as HTMLButtonElement;
      if (linkBtn) {
        linkBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          const url = linkBtn.getAttribute('data-url');
          if (url) {
            console.log('Opening product:', product.title, 'URL:', url);
            window.open(url, '_blank');
          }
        });
        
        linkBtn.addEventListener('mouseenter', () => {
          linkBtn.style.background = '#5a67d8';
          linkBtn.style.transform = 'scale(1.05)';
        });
        
        linkBtn.addEventListener('mouseleave', () => {
          linkBtn.style.background = '#667eea';
          linkBtn.style.transform = 'scale(1)';
        });
      }

      productCard.addEventListener('mouseenter', () => {
        productCard.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.1)';
        productCard.style.transform = 'translateY(-2px)';
      });

      productCard.addEventListener('mouseleave', () => {
        productCard.style.boxShadow = 'none';
        productCard.style.transform = 'translateY(0)';
      });

      this.resultsContainer.appendChild(productCard);
    });

    if (!this.hasMore && !isNewSearch) {
      const endMessage = document.createElement('div');
      endMessage.style.cssText = `
        text-align: center;
        padding: 16px;
        color: #9ca3af;
        font-size: 13px;
      `;
      endMessage.textContent = '모든 결과를 불러왔습니다';
      this.resultsContainer.appendChild(endMessage);
    }
  }

  // 에러 표시
  // 클립보드 복사 기능
  private async copyToClipboard(text: string) {
    try {
      await navigator.clipboard.writeText(text);
      this.showCopyNotification();
    } catch (err) {
      // 폴백: 구형 브라우저 지원
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      document.body.appendChild(textArea);
      textArea.select();
      try {
        document.execCommand('copy');
        this.showCopyNotification();
      } catch (err) {
        console.error('Failed to copy:', err);
      }
      document.body.removeChild(textArea);
    }
  }

  // 복사 완료 알림 표시
  private showCopyNotification() {
    // 기존 알림 제거
    const existingNotification = document.querySelector('.copy-notification');
    if (existingNotification) {
      existingNotification.remove();
    }

    // 알림 생성
    const notification = document.createElement('div');
    notification.className = 'copy-notification';
    notification.style.cssText = `
      position: fixed;
      bottom: 30px;
      left: 50%;
      transform: translateX(-50%);
      background: rgba(0, 0, 0, 0.85);
      color: white;
      padding: 12px 24px;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 500;
      z-index: 100000;
      animation: slideUpFadeInOut 2s ease-in-out;
      pointer-events: none;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    `;
    notification.innerHTML = '✅ GID가 복사되었습니다';

    // 애니메이션 스타일 추가
    const style = document.createElement('style');
    style.textContent = `
      @keyframes slideUpFadeInOut {
        0% { 
          opacity: 0; 
          transform: translateX(-50%) translateY(20px);
        }
        20% { 
          opacity: 1; 
          transform: translateX(-50%) translateY(0);
        }
        80% { 
          opacity: 1; 
          transform: translateX(-50%) translateY(0);
        }
        100% { 
          opacity: 0; 
          transform: translateX(-50%) translateY(10px);
        }
      }
    `;
    document.head.appendChild(style);

    document.body.appendChild(notification);

    // 2초 후 제거
    setTimeout(() => {
      notification.remove();
    }, 2000);
  }

  private displayError() {
    if (!this.resultsContainer) return;

    this.resultsContainer.innerHTML = `
      <div style="
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        height: 100%;
        color: #ef4444;
        padding: 20px;
      ">
        <p style="margin: 0; font-size: 14px;">검색 중 오류가 발생했습니다</p>
        <p style="margin: 8px 0 0 0; font-size: 12px; color: #9ca3af;">잠시 후 다시 시도해주세요</p>
      </div>
    `;
  }

  // 리다이렉트 메시지 표시
  private displayRedirectMessage(redirectUrl: string) {
    if (!this.resultsContainer) return;

    // URL에서 도시명 추출
    const cityMatch = redirectUrl.match(/key_name=([^&]+)/);
    const cityName = cityMatch ? decodeURIComponent(cityMatch[1]) : '';

    this.resultsContainer.innerHTML = `
      <div style="
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        height: 100%;
        padding: 20px;
        text-align: center;
      ">
        <div style="
          width: 64px;
          height: 64px;
          margin-bottom: 16px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
        ">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
            <circle cx="12" cy="10" r="3"></circle>
          </svg>
        </div>
        <p style="
          margin: 0 0 12px 0;
          font-size: 16px;
          font-weight: 600;
          color: #111827;
        ">도시 페이지로 이동됩니다</p>
        <p style="
          margin: 0 0 20px 0;
          font-size: 14px;
          color: #6b7280;
          line-height: 1.5;
        ">
          ${cityName ? `"${cityName}"은(는) 도시명입니다.` : '입력하신 검색어는 도시명입니다.'}<br/>
          특정 도시를 검색하면 해당 도시 페이지로 이동하게 됩니다.<br/>
          상품을 찾으시려면 더 구체적인 검색어를 입력해주세요.
        </p>
        <div style="
          padding: 12px;
          background: #f3f4f6;
          border-radius: 8px;
          width: 100%;
        ">
          <p style="
            margin: 0 0 8px 0;
            font-size: 13px;
            font-weight: 600;
            color: #374151;
          ">💡 검색 팁</p>
          <ul style="
            margin: 0;
            padding-left: 20px;
            font-size: 12px;
            color: #6b7280;
            text-align: left;
          ">
            <li>"파리 투어" - 파리의 투어 상품</li>
            <li>"도쿄 호텔" - 도쿄의 호텔</li>
            <li>"제주도 렌터카" - 제주도 렌터카</li>
          </ul>
        </div>
                        <button id="mrt-city-btn" style="
                  margin-top: 16px;
                  padding: 8px 16px;
                  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                  color: white;
                  border: none;
                  border-radius: 6px;
                  font-size: 13px;
                  font-weight: 600;
                  cursor: pointer;
                  transition: all 0.2s;
                  font-family: 'Noto Sans KR', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                ">
                  도시 페이지 방문하기
                </button>
      </div>
    `;
    
    // 도시 페이지 버튼 이벤트 추가
    setTimeout(() => {
      const cityBtn = document.querySelector('#mrt-city-btn') as HTMLButtonElement;
      if (cityBtn) {
        cityBtn.addEventListener('click', () => {
          window.open(redirectUrl, '_blank');
        });
        
        // 호버 효과
        cityBtn.addEventListener('mouseenter', () => {
          cityBtn.style.opacity = '0.9';
          cityBtn.style.transform = 'scale(1.02)';
        });
        
        cityBtn.addEventListener('mouseleave', () => {
          cityBtn.style.opacity = '1';
          cityBtn.style.transform = 'scale(1)';
        });
      }
    }, 100);
  }
}

// 초기화
setTimeout(() => {
  console.log('MyRealTrip Product Search - Initializing UI');
  new ProductSearchModal();
}, 2000);
