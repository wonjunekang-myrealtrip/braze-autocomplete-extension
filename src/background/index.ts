import { AttributeMetadata, EventMetadata, ExtensionMessage, CacheData, ImageData } from '@/shared/types';
import { mockAttributes } from '@/shared/mockData';
import { CACHE_KEYS, CACHE_TTL } from '@/shared/constants';
import { AutocompleteAPIService } from '@/services/autocompleteAPIService';
import { ImageService } from '@/services/imageService';
import { getGoogleSheetsUrl, getGoogleSheetsEventsUrl } from '@/config/config';

// Service Worker 환경 확인
const isServiceWorker = typeof self !== 'undefined' && self instanceof ServiceWorkerGlobalScope;

// Chrome API 확인 및 초기화
if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.id) {
  console.log('Service Worker 초기화 중...');
  
  // Service Worker 설치 및 활성화
  chrome.runtime.onInstalled.addListener(() => {
    console.log('Braze 자동완성 Extension 설치됨');
    // 초기 데이터 로드
    loadInitialData(true);
  });
  
  // Service Worker 시작 시 데이터 로드
  self.addEventListener('activate', (event) => {
    console.log('Service Worker 활성화됨');
    if (event instanceof ExtendableEvent) {
      event.waitUntil(loadInitialData(false));
    }
  });
} else {
  console.warn('Chrome API not fully available - running in limited mode');
}

// Google Sheets에서 Custom Events 데이터 가져오기
async function fetchGoogleSheetsEventsData(): Promise<EventMetadata[]> {
  try {
    const response = await fetch(getGoogleSheetsEventsUrl());
    
    if (!response.ok) {
      throw new Error(`Failed to fetch events: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (!data.values || data.values.length <= 1) {
      console.warn('No events data in Google Sheets');
      return [];
    }
    
    const dataRows = data.values.slice(1); // 헤더 제외
    const events: EventMetadata[] = [];
    
    for (const row of dataRows) {
      // B열(인덱스 1 - Custom Events)이 비어있으면 스킵
      if (!row[1] || row[1].trim() === '') {
        continue;
      }
      
      const event: EventMetadata = {
        event: row[1] || '',          // B열: Custom Events
        name: row[2] || '',            // C열: 이벤트명
        description: row[5] || '',     // F열: Description
      };
      
      // I열(인덱스 8): 자동완성 메타 - 복수 선택 가능
      if (row[8] && row[8].trim() !== '' && row[8].trim() !== 'NONE') {
        // 콤마나 공백으로 구분된 여러 타입을 배열로 변환
        event.autocompleteTypes = row[8]
          .split(/[,\s]+/)
          .map(t => t.trim())
          .filter(t => t.length > 0);
      }
      
      // J열(인덱스 9): ENUM 값들
      if (row[9] && row[9].trim() !== '') {
        const enumValues = row[9]
          .split(/[,;\n]/)
          .map(v => v.trim())
          .filter(v => v.length > 0);
        
        event.enumValues = enumValues.map(v => ({
          value: v,
          label: v
        }));
      }
      
      events.push(event);
    }
    
    console.log(`Loaded ${events.length} events from Google Sheets`);
    return events;
    
  } catch (error) {
    console.error('Error fetching Google Sheets events data:', error);
    return [];
  }
}

// Google Sheets에서 데이터 가져오기
async function fetchGoogleSheetsData(): Promise<AttributeMetadata[]> {
  try {
    const response = await fetch(getGoogleSheetsUrl());
    
    if (!response.ok) {
      throw new Error(`Failed to fetch: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (!data.values || data.values.length <= 1) {
      console.warn('No data in Google Sheets');
      return mockAttributes; // fallback to mock
    }
    
    const dataRows = data.values.slice(1); // 헤더 제외
    const attributes: AttributeMetadata[] = [];
    
    for (const row of dataRows) {
      // Custom Attributes (인덱스 2)가 비어있으면 스킵
      if (!row[2] || row[2].trim() === '') continue;
      
      const attr: AttributeMetadata = {
        attribute: row[2] || '',
        name: row[3] || '',
        description: row[5] || '',
        autocompleteType: row[9] || 'NONE',
        dataType: row[4] || ''
      };
      
      // ENUM 타입인 경우 값들 파싱 (인덱스 10)
      if (attr.autocompleteType === 'ENUM' && row[10]) {
        // key:value 형식 파싱 (예: "friends:친구와,parents:부모님과")
        const enumPairs = row[10]
          .split(/[,\n]/)
          .map((v: string) => v.trim())
          .filter((v: string) => v.length > 0);
        
        attr.enumValues = enumPairs.map(pair => {
          const [key, label] = pair.split(':');
          return {
            value: key?.trim() || pair,
            label: label?.trim() || key?.trim() || pair
          };
        });
      }
      
      attributes.push(attr);
    }
    
    console.log(`Loaded ${attributes.length} attributes from Google Sheets`);
    return attributes;
    
  } catch (error) {
    console.error('Error fetching Google Sheets:', error);
    return mockAttributes; // fallback to mock
  }
}

// 초기 데이터 로드 함수 (수정됨)
async function loadInitialData(forceRefresh = false) {
  // Chrome API 체크
  if (typeof chrome === 'undefined' || !chrome.runtime || !chrome.runtime.id) {
    console.warn('Chrome runtime not available - skipping data load');
    return Promise.resolve();
  }
  
  // Chrome storage API 체크
  if (!chrome.storage || !chrome.storage.local) {
    console.error('Chrome storage API not available');
    return Promise.resolve();
  }
  
  try {
    // 캐시 확인 (forceRefresh가 아닌 경우)
    if (!forceRefresh) {
      const cached = await chrome.storage.local.get([CACHE_KEYS.ATTRIBUTES]);
      const cacheData = cached[CACHE_KEYS.ATTRIBUTES];
      
      if (cacheData && Date.now() - cacheData.lastUpdated < cacheData.ttl) {
        console.log('Using cached data');
        return;
      }
    }
    
    // Google Sheets에서 데이터 가져오기
    console.log('Fetching fresh data from Google Sheets...');
    const attributes = await fetchGoogleSheetsData();
    
    const cacheData: CacheData = {
      attributes: attributes,
      lastUpdated: Date.now(),
      ttl: CACHE_TTL
    };
    
    await chrome.storage.local.set({
      [CACHE_KEYS.ATTRIBUTES]: cacheData
    });
    
    console.log('데이터 로드 완료:', attributes.length, '개 속성');
  } catch (error) {
    console.error('초기 데이터 로드 실패:', error);
    // 에러 시 mock 데이터 사용
    const cacheData: CacheData = {
      attributes: mockAttributes,
      lastUpdated: Date.now(),
      ttl: CACHE_TTL
    };
    
    await chrome.storage.local.set({
      [CACHE_KEYS.ATTRIBUTES]: cacheData
    });
  }
}

// Content Script와의 메시지 통신
if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.onMessage) {
  chrome.runtime.onMessage.addListener((
    message: ExtensionMessage,
    sender,
    sendResponse
  ) => {
    console.log('Background에서 메시지 수신:', message.type);
    
    switch (message.type) {
      case 'GET_ATTRIBUTES':
        handleGetAttributes(sendResponse);
        return true; // 비동기 응답을 위해 true 반환
      
      case 'GET_EVENTS':
        handleGetEvents(sendResponse);
        return true; // 비동기 응답을 위해 true 반환
        
      case 'SEARCH_ATTRIBUTES':
        handleSearchAttributes(message.payload, sendResponse);
        return true;
        
      case 'FETCH_AIRPORT_DATA':
        // AIRPORT 타입 전용 실시간 API 호출
        handleFetchAirportData(message.payload, sendResponse);
        return true;
        
      case 'FETCH_REGION_DATA':
        // CITY/COUNTRY 타입 실시간 API 호출
        handleFetchRegionData(message.payload, sendResponse);
        return true;
        
      case 'FETCH_AIRLINE_DATA':
        // AIRLINE 타입 데이터 가져오기
        handleFetchAirlineData(message.payload, sendResponse);
        return true;
        
      case 'FETCH_CATEGORY_DATA':
        // CATEGORY 타입 데이터 가져오기
        handleFetchCategoryData(message.payload, sendResponse);
        return true;
        
      case 'SYNC_DATA':
        handleSyncData(sendResponse);
        return true;
        
      case 'CLEAR_CACHE':
        handleClearCache(sendResponse);
        return true;
        
      case 'GET_IMAGES':
        handleGetImages(sendResponse);
        return true;
      case 'GET_IMAGES_PAGED':
        handleGetImagesPaged(message.payload, sendResponse);
        return true;
        
      case 'UPLOAD_IMAGE':
        handleUploadImage(message.payload, sendResponse);
        return true;
        
      case 'DELETE_IMAGE':
        handleDeleteImage(message.payload, sendResponse);
        return true;
        
      case 'UPDATE_IMAGE_NOTE':
        handleUpdateImageNote(message.payload, sendResponse);
        return true;
        
      default:
        sendResponse({ error: '알 수 없는 메시지 타입' });
    }
  });
}

// 이벤트 데이터 조회
async function handleGetEvents(sendResponse: (response: any) => void) {
  try {
    // 캐시 확인
    const cached = await chrome.storage.local.get('cachedEvents');
    const now = Date.now();
    
    if (cached.cachedEvents && 
        cached.cachedEvents.timestamp && 
        (now - cached.cachedEvents.timestamp < CACHE_TTL.ATTRIBUTES)) {
      console.log('캐시된 Events 데이터 사용');
      sendResponse({ success: true, data: cached.cachedEvents.data });
      return;
    }
    
    // Google Sheets에서 새로 가져오기
    console.log('Google Sheets에서 Events 데이터 가져오기...');
    const events = await fetchGoogleSheetsEventsData();
    
    if (events.length > 0) {
      // 캐시에 저장
      await chrome.storage.local.set({
        cachedEvents: {
          data: events,
          timestamp: now
        }
      });
      
      sendResponse({ success: true, data: events });
    } else {
      console.warn('No events data available');
      sendResponse({ success: true, data: [] });
    }
  } catch (error) {
    console.error('Error in handleGetEvents:', error);
    sendResponse({ success: false, error: error.message });
  }
}

// 속성 데이터 조회
async function handleGetAttributes(sendResponse: (response: any) => void) {
  try {
    const result = await chrome.storage.local.get([CACHE_KEYS.ATTRIBUTES]);
    const cacheData: CacheData = result[CACHE_KEYS.ATTRIBUTES];
    
    if (!cacheData) {
      // 캐시가 없으면 초기 데이터 로드
      await loadInitialData();
      const newResult = await chrome.storage.local.get([CACHE_KEYS.ATTRIBUTES]);
      sendResponse({ 
        success: true, 
        data: newResult[CACHE_KEYS.ATTRIBUTES]?.attributes || [] 
      });
      return;
    }
    
    // TTL 체크
    const now = Date.now();
    if (now - cacheData.lastUpdated > cacheData.ttl) {
      console.log('캐시 만료, 데이터 갱신');
      await loadInitialData(); // 실제로는 서버에서 데이터 가져오기
      const refreshedResult = await chrome.storage.local.get([CACHE_KEYS.ATTRIBUTES]);
      sendResponse({ 
        success: true, 
        data: refreshedResult[CACHE_KEYS.ATTRIBUTES]?.attributes || [] 
      });
    } else {
      sendResponse({ 
        success: true, 
        data: cacheData.attributes 
      });
    }
  } catch (error) {
    console.error('속성 데이터 조회 실패:', error);
    sendResponse({ 
      success: false, 
      error: '데이터 조회 중 오류가 발생했습니다.' 
    });
  }
}

// 속성 검색
async function handleSearchAttributes(
  payload: { query: string; maxResults?: number }, 
  sendResponse: (response: any) => void
) {
  try {
    const result = await chrome.storage.local.get([CACHE_KEYS.ATTRIBUTES]);
    const cacheData: CacheData = result[CACHE_KEYS.ATTRIBUTES];
    
    if (!cacheData?.attributes) {
      sendResponse({ success: false, error: '데이터가 없습니다.' });
      return;
    }
    
    // 검색 로직은 Content Script에서 처리하도록 전체 데이터 반환
    sendResponse({ 
      success: true, 
      data: cacheData.attributes,
      query: payload.query
    });
  } catch (error) {
    console.error('속성 검색 실패:', error);
    sendResponse({ 
      success: false, 
      error: '검색 중 오류가 발생했습니다.' 
    });
  }
}

// 공항 데이터 실시간 조회 (AIRPORT 타입 전용)
async function handleFetchAirportData(
  payload: { query: string; attributeName?: string }, 
  sendResponse: (response: any) => void
) {
  try {
    console.log('공항 데이터 실시간 조회:', payload.query);
    
    // AutocompleteAPIService를 통해 실시간 API 호출
    const airportData = await AutocompleteAPIService.fetchAutocompleteData(
      'AIRPORT',
      payload.query
    );
    
    sendResponse({ 
      success: true, 
      data: airportData,
      query: payload.query
    });
  } catch (error) {
    console.error('공항 데이터 조회 실패:', error);
    sendResponse({ 
      success: false, 
      error: '공항 데이터 조회 중 오류가 발생했습니다.' 
    });
  }
}

// 지역 데이터 실시간 조회 (CITY/COUNTRY 타입)
async function handleFetchRegionData(
  payload: { query: string; dataType: 'CITY' | 'COUNTRY' }, 
  sendResponse: (response: any) => void
) {
  try {
    console.log(`${payload.dataType} 데이터 실시간 조회:`, payload.query);
    
    // AutocompleteAPIService를 통해 실시간 API 호출
    const regionData = await AutocompleteAPIService.fetchAutocompleteData(
      payload.dataType,
      payload.query
    );
    
    sendResponse({ 
      success: true, 
      data: regionData,
      query: payload.query
    });
  } catch (error) {
    console.error(`${payload.dataType} 데이터 조회 실패:`, error);
    sendResponse({ 
      success: false, 
      error: `${payload.dataType} 데이터 조회 중 오류가 발생했습니다.` 
    });
  }
}

// AIRLINE 데이터 조회
async function handleFetchAirlineData(
  payload: { query: string }, 
  sendResponse: (response: any) => void
) {
  try {
    console.log('AIRLINE 데이터 조회:', payload.query);
    
    // AutocompleteAPIService를 통해 항공사 데이터 가져오기
    const airlineData = await AutocompleteAPIService.fetchAutocompleteData(
      'AIRLINE',
      payload.query
    );
    
    sendResponse({ 
      success: true, 
      data: airlineData,
      query: payload.query
    });
  } catch (error) {
    console.error('AIRLINE 데이터 조회 실패:', error);
    sendResponse({ 
      success: false, 
      error: 'AIRLINE 데이터 조회 중 오류가 발생했습니다.' 
    });
  }
}

// 카테고리 데이터 처리
async function handleFetchCategoryData(
  payload: { query: string; level: number },
  sendResponse: (response: any) => void
) {
  try {
    console.log('Fetching category data:', payload);
    
    let metaType: string;
    switch (payload.level) {
      case 1:
        metaType = 'STANDARD_CATEGORY_LV_1';
        break;
      case 2:
        metaType = 'STANDARD_CATEGORY_LV_2';
        break;
      case 3:
        metaType = 'STANDARD_CATEGORY_LV_3';
        break;
      default:
        sendResponse({ 
          success: false, 
          error: '잘못된 카테고리 레벨입니다.' 
        });
        return;
    }
    
    const results = await AutocompleteAPIService.fetchAutocompleteData(
      metaType,
      payload.query
    );
    
    sendResponse({ 
      success: true, 
      data: results.map(r => {
        // display/label에서 괄호 앞 부분만 추출 (한글 이름만)
        const displayText = r.display || r.label || '';
        const nameMatch = displayText.match(/^([^(]+)/);
        const nameOnly = nameMatch ? nameMatch[1].trim() : displayText;
        
        return {
          code: r.insertValue || r.value,
          name: nameOnly,  // 괄호 없는 한글 이름만
          value: r.insertValue || r.value,
          label: r.display || r.label  // 전체 텍스트 (드롭다운용)
        };
      })
    });
  } catch (error) {
    console.error('카테고리 데이터 가져오기 실패:', error);
    sendResponse({ 
      success: false, 
      error: '카테고리 데이터를 가져올 수 없습니다.' 
    });
  }
}

// 데이터 동기화
async function handleSyncData(sendResponse: (response: any) => void) {
  try {
    console.log('수동 데이터 동기화 시작');
    await loadInitialData();
    sendResponse({ 
      success: true, 
      message: '데이터 동기화 완료' 
    });
  } catch (error) {
    console.error('데이터 동기화 실패:', error);
    sendResponse({ 
      success: false, 
      error: '동기화 중 오류가 발생했습니다.' 
    });
  }
}

// 캐시 클리어
async function handleClearCache(sendResponse: (response: any) => void) {
  try {
    await chrome.storage.local.clear();
    console.log('캐시 클리어 완료');
    sendResponse({ 
      success: true, 
      message: '캐시가 클리어되었습니다.' 
    });
  } catch (error) {
    console.error('캐시 클리어 실패:', error);
    sendResponse({ 
      success: false, 
      error: '캐시 클리어 중 오류가 발생했습니다.' 
    });
  }
}

// 이미지 목록 조회
async function handleGetImages(sendResponse: (response: any) => void) {
  try {
    const images = await ImageService.getImages();
    sendResponse({ 
      success: true, 
      data: images 
    });
  } catch (error) {
    console.error('이미지 목록 조회 실패:', error);
    sendResponse({ 
      success: false, 
      error: '이미지 목록을 불러올 수 없습니다.' 
    });
  }
}

// NHN 이미지 목록 페이징 조회
async function handleGetImagesPaged(
  payload: { pageNum?: number; pageSize?: number; imageTypes?: string[] },
  sendResponse: (response: any) => void
) {
  try {
    const pageNum = payload?.pageNum ?? 1;
    const pageSize = payload?.pageSize ?? 15;
    const imageTypes = (payload?.imageTypes as any) ?? ['IMAGE', 'WIDE_IMAGE'];

    const page = await ImageService.fetchRemoteImages(pageNum, pageSize, imageTypes as any);
    sendResponse({ success: true, data: page });
  } catch (error: any) {
    console.error('NHN 이미지 페이징 조회 실패:', error);
    sendResponse({ success: false, error: error?.message || '이미지 조회 실패' });
  }
}

// 이미지 업로드
async function handleUploadImage(
  payload: { file: { name: string; type: string; size: number; data: string }; isWide?: boolean },
  sendResponse: (response: any) => void
) {
  try {
    // Base64를 Blob으로 변환
    const base64Data = payload.file.data.split(',')[1];
    const byteCharacters = atob(base64Data);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: payload.file.type });
    const file = new File([blob], payload.file.name, { type: payload.file.type });
    
    const uploadResult = await ImageService.uploadImage(file, payload.isWide || false);
    
    if (uploadResult.success && uploadResult.data) {
      // 이미지 데이터 생성 (NHN Cloud에서 반환된 정보 사용)
      const imageData: ImageData = {
        id: uploadResult.data.imageSeq?.toString() || Date.now().toString(),
        url: uploadResult.data.url,
        thumbnailUrl: uploadResult.data.thumbnailUrl,
        uploadedAt: Date.now(),
        fileName: uploadResult.data.imageName || payload.file.name,
        fileSize: payload.file.size,
        mimeType: payload.file.type
      };
      
      sendResponse({ 
        success: true, 
        data: imageData 
      });
    } else {
      sendResponse({ 
        success: false, 
        error: uploadResult.error || '업로드에 실패했습니다.' 
      });
    }
  } catch (error) {
    console.error('이미지 업로드 실패:', error);
    sendResponse({ 
      success: false, 
      error: '이미지 업로드 중 오류가 발생했습니다.' 
    });
  }
}

// 이미지 삭제
async function handleDeleteImage(
  payload: { id: string },
  sendResponse: (response: any) => void
) {
  try {
    const result = await ImageService.deleteImage(payload.id);
    sendResponse({ 
      success: result, 
      message: result ? '이미지가 삭제되었습니다.' : '삭제에 실패했습니다.' 
    });
  } catch (error) {
    console.error('이미지 삭제 실패:', error);
    sendResponse({ 
      success: false, 
      error: '이미지 삭제 중 오류가 발생했습니다.' 
    });
  }
}

// 이미지 노트 업데이트
async function handleUpdateImageNote(
  payload: { id: string; note: string },
  sendResponse: (response: any) => void
) {
  try {
    const result = await ImageService.updateImageNote(payload.id, payload.note);
    sendResponse({ 
      success: result, 
      message: result ? '노트가 업데이트되었습니다.' : '업데이트에 실패했습니다.' 
    });
  } catch (error) {
    console.error('노트 업데이트 실패:', error);
    sendResponse({ 
      success: false, 
      error: '노트 업데이트 중 오류가 발생했습니다.' 
    });
  }
}

// Chrome API가 사용 가능한 경우에만 알람 설정
if (typeof chrome !== 'undefined' && chrome.alarms) {
  // 주기적 데이터 동기화 (6시간마다)
  chrome.alarms.create('syncData', { periodInMinutes: 360 });
  
  // 매일 오전 9시에 강제 새로고침
  const now = new Date();
  const tomorrow9am = new Date(now);
  tomorrow9am.setDate(tomorrow9am.getDate() + (now.getHours() >= 9 ? 1 : 0));
  tomorrow9am.setHours(9, 0, 0, 0);
  
  chrome.alarms.create('dailyRefresh', {
    when: tomorrow9am.getTime(),
    periodInMinutes: 1440 // 24시간마다
  });

  chrome.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name === 'syncData') {
      console.log('주기적 데이터 동기화 실행');
      loadInitialData(false); // 캐시 체크 후 필요시 업데이트
    } else if (alarm.name === 'dailyRefresh') {
      console.log('일일 강제 새로고침 실행');
      loadInitialData(true); // 강제 새로고침
    }
  });
}

// Chrome API가 사용 가능한 경우에만 시작 리스너 설정
if (typeof chrome !== 'undefined' && chrome.runtime) {
  // 네트워크 상태 변화 감지 (온라인 상태로 복구 시 동기화)
  chrome.runtime.onStartup.addListener(() => {
    console.log('Extension 시작됨');
    loadInitialData();
  });
}
