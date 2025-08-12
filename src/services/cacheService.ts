import { AttributeMetadata, CacheData, AutocompleteCache } from '../shared/types';

export class CacheService {
  private static readonly CACHE_KEY = 'braze_autocomplete_cache';
  private static readonly DEFAULT_TTL = 24 * 60 * 60 * 1000; // 24시간
  private static readonly SHORT_TTL = 30 * 60 * 1000; // 30분
  
  /**
   * 캐시에서 데이터를 가져옵니다
   */
  static async get<T>(key: keyof AutocompleteCache): Promise<T | null> {
    try {
      const result = await chrome.storage.local.get(this.CACHE_KEY);
      const cache: AutocompleteCache = result[this.CACHE_KEY] || {};
      
      const cacheData = cache[key] as CacheData<T>;
      if (!cacheData) return null;
      
      // TTL 체크
      const now = Date.now();
      if (now - cacheData.timestamp > cacheData.ttl) {
        console.log(`Cache expired for ${key}`);
        return null;
      }
      
      return cacheData.data;
    } catch (error) {
      console.error('Error reading cache:', error);
      return null;
    }
  }
  
  /**
   * 캐시에 데이터를 저장합니다
   */
  static async set<T>(key: keyof AutocompleteCache, data: T, ttl?: number): Promise<void> {
    try {
      const result = await chrome.storage.local.get(this.CACHE_KEY);
      const cache: AutocompleteCache = result[this.CACHE_KEY] || {};
      
      cache[key] = {
        data,
        timestamp: Date.now(),
        ttl: ttl || this.DEFAULT_TTL
      } as CacheData<T>;
      
      await chrome.storage.local.set({ [this.CACHE_KEY]: cache });
      console.log(`Cached data for ${key}`);
    } catch (error) {
      console.error('Error writing cache:', error);
    }
  }
  
  /**
   * 특정 캐시 키를 삭제합니다
   */
  static async remove(key: keyof AutocompleteCache): Promise<void> {
    try {
      const result = await chrome.storage.local.get(this.CACHE_KEY);
      const cache: AutocompleteCache = result[this.CACHE_KEY] || {};
      
      delete cache[key];
      
      await chrome.storage.local.set({ [this.CACHE_KEY]: cache });
      console.log(`Removed cache for ${key}`);
    } catch (error) {
      console.error('Error removing cache:', error);
    }
  }
  
  /**
   * 전체 캐시를 초기화합니다
   */
  static async clear(): Promise<void> {
    try {
      await chrome.storage.local.remove(this.CACHE_KEY);
      console.log('Cache cleared');
    } catch (error) {
      console.error('Error clearing cache:', error);
    }
  }
  
  /**
   * 캐시 상태를 확인합니다
   */
  static async getStatus(): Promise<{
    attributes?: { count: number; age: number };
    cityData?: { count: number; age: number };
    countryData?: { count: number; age: number };
  }> {
    try {
      const result = await chrome.storage.local.get(this.CACHE_KEY);
      const cache: AutocompleteCache = result[this.CACHE_KEY] || {};
      const now = Date.now();
      const status: any = {};
      
      if (cache.attributes) {
        status.attributes = {
          count: cache.attributes.data.length,
          age: Math.floor((now - cache.attributes.timestamp) / 1000 / 60) // 분 단위
        };
      }
      
      if (cache.cityData) {
        status.cityData = {
          count: cache.cityData.data.length,
          age: Math.floor((now - cache.cityData.timestamp) / 1000 / 60)
        };
      }
      
      if (cache.countryData) {
        status.countryData = {
          count: cache.countryData.data.length,
          age: Math.floor((now - cache.countryData.timestamp) / 1000 / 60)
        };
      }
      
      return status;
    } catch (error) {
      console.error('Error getting cache status:', error);
      return {};
    }
  }
}
