import { AttributeMetadata } from '../shared/types';
import { AIRLINE_DATA } from '../shared/airlineData';

/**
 * 자동완성 API 서비스
 * 각 메타 타입별 API 엔드포인트 관리
 */
export class AutocompleteAPIService {
  // API 베이스 URL (추후 설정 필요)
  private static readonly API_BASE_URL = '';
  
  // 항공사 데이터 캐시
  private static airlineData: Array<{ code: string; name: string; value: string; label: string }> | null = null;
  
  /**
   * 메타 타입에 따른 자동완성 데이터 가져오기
   */
  static async fetchAutocompleteData(
    metaType: string,
    query: string,
    metadata?: AttributeMetadata  // 메타데이터에 description이 포함됨
  ): Promise<any[]> {
    
    // ENUM 타입은 이미 데이터가 있음
    if (metaType === 'ENUM' && metadata?.enumValues) {
      return this.filterEnumValues(metadata.enumValues, query);
    }
    
    // API 호출이 필요한 타입들
    switch (metaType) {
      case 'CITY':
        return this.fetchCityData(query);
        
      case 'AIRPORT':
        return this.fetchAirportData(query);
        
      case 'STANDARD_CATEGORY_LV_1':
        return this.fetchCategoryLevel1Data(query);
        
      case 'STANDARD_CATEGORY_LV_2':
        return this.fetchCategoryLevel2Data(query);
        
      case 'STANDARD_CATEGORY_LV_3':
        return this.fetchCategoryLevel3Data(query);
        
      case 'COUNTRY':
        return this.fetchCountryData(query);
        
      case 'AIRLINE':
        return this.fetchAirlineData(query);
        
      default:
        return [];
    }
  }
  
  /**
   * ENUM 값 필터링
   */
  private static filterEnumValues(enumValues: Array<{value: string; label: string}>, query: string): any[] {
    const lowerQuery = query.toLowerCase();
    return enumValues
      .filter(item => 
        item.value.toLowerCase().includes(lowerQuery) ||
        item.label.toLowerCase().includes(lowerQuery)
      )
      .map(item => ({
        value: item.value,
        label: `${item.label} (${item.value})`,
        type: 'enum'
      }));
  }
  
  /**
   * 도시 데이터 API - MyRealTrip region API 사용
   */
  private static async fetchCityData(query: string): Promise<any[]> {
    // 쿼리가 너무 짧으면 빈 배열 반환
    if (!query || query.length < 1) {
      return [];
    }

    try {
      // MyRealTrip region 자동완성 API 호출
      const response = await fetch(
        `https://api3.myrealtrip.com/search/mrt-region/v1/ac?q=${encodeURIComponent(query)}`,
        {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          }
        }
      );
      
      if (!response.ok) {
        throw new Error(`City API failed: ${response.status}`);
      }
      
      const result = await response.json();
      
      // API 응답 구조 확인 및 city 타입만 필터링
      if (result?.result?.status === 200 && result?.data) {
        const cities = result.data.filter((item: any) => item.type === 'city');
        
        return cities.map((item: any) => ({
          code: item.keyName,  // keyName을 code로 사용
          name: item.name,      // 한글명
          value: item.keyName,  // insertValue로 사용
          label: `${item.name} (${item.keyName})`,  // 표시용
          additionalInfo: item.countryName || item.description || '',
          type: 'city'
        }));
      }
      
      console.warn('Unexpected city API response:', result);
      return [];
      
    } catch (error) {
      console.error('Error fetching city data from MyRealTrip:', error);
      // Mock 데이터로 폴백
      return this.getMockCityData(query);
    }
  }
  
  /**
   * 공항 데이터 API - 실시간 MyRealTrip API 호출
   * 데이터 크기가 2.1M로 크므로 캐싱하지 않고 실시간 호출
   */
  private static async fetchAirportData(query: string): Promise<any[]> {
    // 쿼리가 너무 짧으면 빈 배열 반환 (너무 많은 결과 방지)
    if (!query || query.length < 1) {
      return [];
    }

    try {
      // MyRealTrip 공항 자동완성 API 호출
      const response = await fetch(
        `https://api3.myrealtrip.com/search/flight/v1/ac?keyword=${encodeURIComponent(query)}`,
        {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          }
        }
      );
      
      if (!response.ok) {
        throw new Error(`Airport API failed: ${response.status}`);
      }
      
      const result = await response.json();
      
      // API 응답 구조 확인 및 데이터 추출
      if (result?.result?.status === 200 && result?.data) {
        // 응답 데이터를 우리 포맷으로 변환 (code, name 구조)
        return result.data.map((item: any) => ({
          code: item.airportCode,  // IATA 코드 (예: ICN, KIX) 
          name: item.airportKoName,  // 한글명 (예: 인천국제공항)
          // 드롭다운 표시용
          value: item.airportCode,  // insertValue로 사용
          label: `${item.airportKoName} (${item.airportCode})`,  // 표시용
          // cityKoName과 countryKoName을 조합하여 부가 정보 제공
          additionalInfo: `${item.cityKoName}, ${item.countryKoName}`,
          type: 'airport'
        }));
      }
      
      // API 응답이 비정상적인 경우 빈 배열 반환
      console.warn('Unexpected airport API response:', result);
      return [];
      
    } catch (error) {
      console.error('Error fetching airport data from MyRealTrip:', error);
      // 에러 발생 시 Mock 데이터로 폴백
      return this.getMockAirportData(query);
    }
  }
  
  // 카테고리 데이터 캐시
  private static categoryCache: {
    data: any[] | null;
    timestamp: number;
    ttl: number;
  } = {
    data: null,
    timestamp: 0,
    ttl: 3600000 // 1시간 캐시
  };

  /**
   * 카테고리 전체 데이터 가져오기 (캐시 적용)
   */
  private static async fetchAllCategories(): Promise<any[]> {
    // 캐시 확인
    const now = Date.now();
    if (this.categoryCache.data && 
        (now - this.categoryCache.timestamp) < this.categoryCache.ttl) {
      console.log('Using cached category data');
      return this.categoryCache.data;
    }

    try {
      const response = await fetch('https://api3.myrealtrip.com/category/api/v1/standard-categories', {
        method: 'GET',
        headers: {
          'accept': '*/*'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch categories: ${response.status}`);
      }

      const result = await response.json();
      
      // 캐시 저장
      this.categoryCache = {
        data: result.data || [],
        timestamp: now,
        ttl: 3600000
      };

      console.log(`Cached ${this.categoryCache.data.length} categories`);
      return this.categoryCache.data || [];
    } catch (error) {
      console.error('Error fetching categories:', error);
      // 에러 시 mock 데이터 반환
      return this.getMockCategoryData('', 0);
    }
  }

  /**
   * 카테고리 레벨1 데이터 API
   */
  private static async fetchCategoryLevel1Data(query: string): Promise<any[]> {
    try {
      const allCategories = await this.fetchAllCategories();
      
      // depth가 1인 카테고리만 필터링
      const level1Categories = allCategories
        .filter(cat => cat.depth === 1)
        .filter(cat => {
          // 검색어로 필터링
          const lowerQuery = query.toLowerCase();
          return cat.name.toLowerCase().includes(lowerQuery) ||
                 cat.code.toLowerCase().includes(lowerQuery);
        })
        .map(cat => ({
          value: cat.code,
          label: cat.name,
          type: 'category_lv1'
        }));

      return level1Categories;
      
    } catch (error) {
      console.error('Error fetching category level 1:', error);
      return this.getMockCategoryData(query, 1);
    }
  }
  
  /**
   * 카테고리 레벨2 데이터 API
   */
  private static async fetchCategoryLevel2Data(query: string): Promise<any[]> {
    try {
      const allCategories = await this.fetchAllCategories();
      
      // depth가 2인 카테고리만 필터링
      const level2Categories = allCategories
        .filter(cat => cat.depth === 2)
        .filter(cat => {
          // 검색어로 필터링
          const lowerQuery = query.toLowerCase();
          return cat.name.toLowerCase().includes(lowerQuery) ||
                 cat.code.toLowerCase().includes(lowerQuery);
        })
        .map(cat => ({
          value: cat.code,
          label: cat.name,
          description: cat.parent || '',
          type: 'category_lv2'
        }));

      return level2Categories;
      
    } catch (error) {
      console.error('Error fetching category level 2:', error);
      return this.getMockCategoryData(query, 2);
    }
  }
  
  /**
   * 카테고리 레벨3 데이터 API
   */
  private static async fetchCategoryLevel3Data(query: string): Promise<any[]> {
    try {
      const allCategories = await this.fetchAllCategories();
      
      // depth가 3인 카테고리만 필터링
      const level3Categories = allCategories
        .filter(cat => cat.depth === 3)
        .filter(cat => {
          // 검색어로 필터링
          const lowerQuery = query.toLowerCase();
          return cat.name.toLowerCase().includes(lowerQuery) ||
                 cat.code.toLowerCase().includes(lowerQuery);
        })
        .map(cat => {
          // paths 배열에서 부모 카테고리 이름 추출
          const parentPath = cat.paths && cat.paths.length > 2 
            ? cat.paths.slice(1, -1).join(' > ')
            : cat.parent || '';
          
          return {
            value: cat.code,
            label: cat.name,
            description: parentPath,
            type: 'category_lv3'
          };
        });

      return level3Categories;
      
    } catch (error) {
      console.error('Error fetching category level 3:', error);
      return this.getMockCategoryData(query, 3);
    }
  }
  
  /**
   * 국가 데이터 API - MyRealTrip region API 사용
   */
  private static async fetchCountryData(query: string): Promise<any[]> {
    // 쿼리가 너무 짧으면 빈 배열 반환
    if (!query || query.length < 1) {
      return [];
    }

    try {
      // MyRealTrip region 자동완성 API 호출 (city와 동일한 엔드포인트)
      const response = await fetch(
        `https://api3.myrealtrip.com/search/mrt-region/v1/ac?q=${encodeURIComponent(query)}`,
        {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          }
        }
      );
      
      if (!response.ok) {
        throw new Error(`Country API failed: ${response.status}`);
      }
      
      const result = await response.json();
      
      // API 응답 구조 확인 및 country 타입만 필터링
      if (result?.result?.status === 200 && result?.data) {
        const countries = result.data.filter((item: any) => item.type === 'country');
        
        return countries.map((item: any) => ({
          code: item.keyName,  // keyName을 code로 사용
          name: item.name,      // 한글명
          value: item.keyName,  // insertValue로 사용
          label: `${item.name} (${item.keyName})`,  // 표시용
          additionalInfo: item.description || '',
          type: 'country'
        }));
      }
      
      console.warn('Unexpected country API response:', result);
      return [];
      
    } catch (error) {
      console.error('Error fetching country data from MyRealTrip:', error);
      // Mock 데이터로 폴백
      return this.getMockCountryData(query);
    }
  }
  
  /**
   * 항공사 CSV 데이터 로드
   */
  private static loadAirlineData(): void {
    if (this.airlineData) return; // 이미 로드됨
    
    try {
      // CSV 파싱
      this.airlineData = AIRLINE_DATA
        .split('\n')
        .filter(line => line.trim())
        .map(line => {
          const [code, name] = line.split(',').map(s => s.trim());
          if (!code || !name) return null;
          
          return {
            code: code,
            name: name,
            value: code,
            label: `${name} (${code})`
          };
        })
        .filter(item => item !== null) as Array<{ code: string; name: string; value: string; label: string }>;
      
      console.log(`Loaded ${this.airlineData.length} airlines`);
    } catch (error) {
      console.error('Failed to parse airline data:', error);
      this.airlineData = [];
    }
  }

  /**
   * 항공사 데이터 API
   */
  private static fetchAirlineData(query: string): any[] {
    // CSV 데이터 로드 (처음 한 번만)
    this.loadAirlineData();
    
    if (!this.airlineData || this.airlineData.length === 0) {
      // 데이터 로드 실패 시 빈 배열 반환
      return [];
    }
    
    // 쿼리로 필터링
    const lowerQuery = query.toLowerCase();
    return this.airlineData
      .filter(item => 
        item.code.toLowerCase().includes(lowerQuery) ||
        item.name.toLowerCase().includes(lowerQuery)
      )
      .slice(0, 50) // 최대 50개 결과
      .map(item => ({
        ...item,
        additionalInfo: item.code
      }));
  }
  
  // ===== Mock 데이터 (개발/테스트용) =====
  
  private static getMockCityData(query: string): any[] {
    const cities = [
      { value: 'SEL', label: '서울' },
      { value: 'NYC', label: '뉴욕' },
      { value: 'TYO', label: '도쿄' },
      { value: 'PAR', label: '파리' },
      { value: 'LON', label: '런던' },
      { value: 'BKK', label: '방콕' },
      { value: 'SIN', label: '싱가포르' },
      { value: 'HKG', label: '홍콩' },
    ];
    
    const lowerQuery = query.toLowerCase();
    return cities.filter(city => 
      city.label.toLowerCase().includes(lowerQuery) ||
      city.value.toLowerCase().includes(lowerQuery)
    );
  }
  
  private static getMockAirportData(query: string): any[] {
    const airports = [
      { value: 'ICN', label: '인천국제공항 (ICN)' },
      { value: 'GMP', label: '김포국제공항 (GMP)' },
      { value: 'NRT', label: '나리타국제공항 (NRT)' },
      { value: 'JFK', label: '존 F. 케네디 국제공항 (JFK)' },
      { value: 'CDG', label: '샤를 드 골 공항 (CDG)' },
    ];
    
    const lowerQuery = query.toLowerCase();
    return airports.filter(airport => 
      airport.label.toLowerCase().includes(lowerQuery) ||
      airport.value.toLowerCase().includes(lowerQuery)
    );
  }
  
  private static getMockCategoryData(query: string, level: number): any[] {
    const categories: { [key: number]: any[] } = {
      1: [
        { value: 'TOUR', label: '투어/액티비티' },
        { value: 'HOTEL', label: '숙박' },
        { value: 'FLIGHT', label: '항공' },
        { value: 'TRANSPORT', label: '교통' },
      ],
      2: [
        { value: 'CITY_TOUR', label: '시내투어', description: '투어/액티비티' },
        { value: 'SNAP', label: '스냅촬영', description: '투어/액티비티' },
        { value: 'HOTEL_5', label: '5성급 호텔', description: '숙박' },
        { value: 'GUESTHOUSE', label: '게스트하우스', description: '숙박' },
      ],
      3: [
        { value: 'PARIS_CITY', label: '파리 시내투어', description: '투어/액티비티 > 시내투어' },
        { value: 'SEOUL_SNAP', label: '서울 스냅', description: '투어/액티비티 > 스냅촬영' },
      ]
    };
    
    const data = categories[level] || [];
    const lowerQuery = query.toLowerCase();
    
    return data.filter(item => 
      item.label.toLowerCase().includes(lowerQuery) ||
      item.value.toLowerCase().includes(lowerQuery)
    );
  }
  
  private static getMockCountryData(query: string): any[] {
    const countries = [
      { value: 'KR', label: '대한민국', description: '아시아' },
      { value: 'US', label: '미국', description: '북아메리카' },
      { value: 'JP', label: '일본', description: '아시아' },
      { value: 'FR', label: '프랑스', description: '유럽' },
      { value: 'GB', label: '영국', description: '유럽' },
      { value: 'TH', label: '태국', description: '아시아' },
      { value: 'SG', label: '싱가포르', description: '아시아' },
      { value: 'VN', label: '베트남', description: '아시아' },
    ];
    
    const lowerQuery = query.toLowerCase();
    return countries.filter(country => 
      country.label.toLowerCase().includes(lowerQuery) ||
      country.value.toLowerCase().includes(lowerQuery)
    );
  }
  
  private static getMockAirlineData(query: string): any[] {
    const airlines = [
      { value: 'KE', label: '대한항공 (KE)', description: '대한민국' },
      { value: 'OZ', label: '아시아나항공 (OZ)', description: '대한민국' },
      { value: 'AA', label: '아메리칸 항공 (AA)', description: '미국' },
      { value: 'DL', label: '델타항공 (DL)', description: '미국' },
      { value: 'JL', label: '일본항공 (JL)', description: '일본' },
      { value: 'NH', label: '전일본공수 (NH)', description: '일본' },
      { value: 'SQ', label: '싱가포르항공 (SQ)', description: '싱가포르' },
      { value: 'TG', label: '타이항공 (TG)', description: '태국' },
    ];
    
    const lowerQuery = query.toLowerCase();
    return airlines.filter(airline => 
      airline.label.toLowerCase().includes(lowerQuery) ||
      airline.value.toLowerCase().includes(lowerQuery)
    );
  }
}
