import { AttributeMetadata, EventMetadata, GoogleSheetsResponse } from '../shared/types';
import { getGoogleSheetsUrl, getGoogleSheetsEventsUrl } from '../config/config';

export class GoogleSheetsService {
  /**
   * Google Sheets에서 Custom Attributes 데이터를 가져옵니다
   */
  static async fetchAttributesData(): Promise<AttributeMetadata[]> {
    try {
      const response = await fetch(getGoogleSheetsUrl());
      
      if (!response.ok) {
        throw new Error(`Failed to fetch data: ${response.status}`);
      }
      
      const data: GoogleSheetsResponse = await response.json();
      
      if (!data.values || data.values.length <= 1) {
        console.warn('No data found in Google Sheets');
        return [];
      }
      
      // 첫 번째 행은 헤더이므로 제외
      const dataRows = data.values.slice(1);
      
      // 데이터를 AttributeMetadata 형식으로 변환
      const attributes: AttributeMetadata[] = [];
      
      for (const row of dataRows) {
        // 2번째 인덱스(Custom Attributes)가 비어있으면 스킵
        if (!row[2] || row[2].trim() === '') {
          continue;
        }
        
        const attribute: AttributeMetadata = {
          attribute: row[2] || '',
          name: row[3] || '',
          description: row[5] || '',
          autocompleteType: row[9] || 'NONE',
          dataType: row[4] || '',
        };
        
        // ENUM 타입인 경우 10번째 인덱스에서 값들을 파싱
        if (attribute.autocompleteType === 'ENUM' && row[10]) {
          // ENUM 값들을 파싱 (콤마, 세미콜론, 줄바꿈 등으로 구분)
          attribute.enumValues = row[10]
            .split(/[,;\n]/)
            .map(v => v.trim())
            .filter(v => v.length > 0);
        }
        
        attributes.push(attribute);
      }
      
      console.log(`Loaded ${attributes.length} attributes from Google Sheets`);
      return attributes;
      
    } catch (error) {
      console.error('Error fetching Google Sheets data:', error);
      throw error;
    }
  }
  
  /**
   * Google Sheets에서 Custom Events 데이터를 가져옵니다
   */
  static async fetchEventsData(): Promise<EventMetadata[]> {
    try {
      const response = await fetch(getGoogleSheetsEventsUrl());
      
      if (!response.ok) {
        throw new Error(`Failed to fetch events data: ${response.status}`);
      }
      
      const data: GoogleSheetsResponse = await response.json();
      
      if (!data.values || data.values.length <= 1) {
        console.warn('No events data found in Google Sheets');
        return [];
      }
      
      // 첫 번째 행은 헤더이므로 제외
      const dataRows = data.values.slice(1);
      
      // 데이터를 EventMetadata 형식으로 변환
      const events: EventMetadata[] = [];
      
      for (const row of dataRows) {
        // B열(인덱스 1 - Custom Events)이 비어있으면 스킵
        if (!row[1] || row[1].trim() === '') {
          continue;
        }
        
        const event: EventMetadata = {
          event: row[1] || '',          // B열: Custom Events
          name: row[2] || '',            // C열: 이벤트명
          description: row[5] || '',      // F열: Description
        };
        
        // I열(인덱스 8): 자동완성 메타 - 복수 선택 가능
        if (row[8] && row[8].trim() !== '') {
          // 콤마로 구분된 여러 타입을 배열로 변환
          event.autocompleteTypes = row[8]
            .split(',')
            .map(t => t.trim())
            .filter(t => t.length > 0);
        }
        
        // J열(인덱스 9): ENUM 값들
        if (row[9] && row[9].trim() !== '') {
          // ENUM 값들을 파싱 (콤마, 세미콜론, 줄바꿈 등으로 구분)
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
      throw error;
    }
  }
  
  /**
   * 특정 자동완성 타입에 따른 추가 데이터를 가져옵니다
   */
  static async fetchAutocompleteData(type: string): Promise<any[]> {
    // 각 타입별 API 엔드포인트는 추후 구현
    switch (type) {
      case 'CITY':
        // TODO: 도시 데이터 API 호출
        console.log('Fetching city data...');
        return [];
        
      case 'COUNTRY':
        // TODO: 국가 데이터 API 호출
        console.log('Fetching country data...');
        return [];
        
      case 'PRODUCT':
        // TODO: 상품 데이터 API 호출
        console.log('Fetching product data...');
        return [];
        
      case 'CATEGORY':
        // TODO: 카테고리 데이터 API 호출
        console.log('Fetching category data...');
        return [];
        
      default:
        return [];
    }
  }
}
