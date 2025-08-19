import { API_CONFIG } from '@/config/config';
import { ImageData, ImageUploadResponse, PagedImageList } from '@/shared/types';

/**
 * NHN Cloud 이미지 서비스
 * 현재는 목업 구현, 나중에 실제 API로 교체
 */
export class ImageService {
  private static readonly STORAGE_KEY = 'nhn_cloud_images';
  private static NHN_API_URL = API_CONFIG.NHN_CLOUD_URL; // env에서 주입
  private static NHN_SECRET_KEY = API_CONFIG.NHN_CLOUD_SECRET_KEY; // env에서 주입
  private static NHN_APP_KEY = API_CONFIG.NHN_CLOUD_APP_KEY; // env에서 주입

  /**
   * NHN Cloud에 이미지 업로드
   */
  static async uploadImage(file: File, isWide: boolean = false): Promise<ImageUploadResponse> {
    try {
      if (!this.NHN_API_URL || !this.NHN_APP_KEY || !this.NHN_SECRET_KEY) {
        console.warn('NHN Cloud 설정이 없어 로컬 저장소를 사용합니다.');
        const base64 = await this.fileToBase64(file);
        return {
          success: true,
          data: {
            url: base64,
            thumbnailUrl: base64
          }
        };
      }

      const formData = new FormData();
      formData.append('image', file);
      if (isWide) {
        formData.append('wide', 'true');
      }

      const url = `${this.NHN_API_URL}/friendtalk/v2.4/appkeys/${this.NHN_APP_KEY}/images`;
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'X-Secret-Key': this.NHN_SECRET_KEY
        },
        body: formData
      });

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.header?.isSuccessful && data.image) {
        return {
          success: true,
          data: {
            url: data.image.imageUrl,
            thumbnailUrl: data.image.imageUrl,
            imageSeq: data.image.imageSeq,
            imageName: data.image.imageName
          }
        };
      } else {
        throw new Error(data.header?.resultMessage || 'Upload failed');
      }
    } catch (error) {
      console.error('Image upload failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : '이미지 업로드에 실패했습니다.'
      };
    }
  }

  /**
   * 이미지 목록 가져오기
   */
  static async getImages(): Promise<ImageData[]> {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        const images = JSON.parse(stored) as ImageData[];
        return images.sort((a, b) => b.uploadedAt - a.uploadedAt);
      }
      return [];
    } catch (error) {
      console.error('Failed to load images:', error);
      return [];
    }
  }

  /**
   * NHN Cloud 이미지 목록 조회 (페이징)
   */
  static async fetchRemoteImages(
    pageNum = 1,
    pageSize = 15,
    imageTypes: Array<'IMAGE' | 'WIDE_IMAGE' | 'WIDE_ITEMLIST_IMAGE' | 'CAROUSEL_IMAGE'> = ['IMAGE', 'WIDE_IMAGE']
  ): Promise<PagedImageList> {
    if (!this.NHN_API_URL || !this.NHN_APP_KEY || !this.NHN_SECRET_KEY) {
      console.warn('NHN Cloud env가 설정되지 않아 로컬 저장소 데이터를 사용합니다.');
      const local = await this.getImages();
      return {
        images: local,
        totalCount: local.length,
        pageNum: 1,
        pageSize: local.length || 0
      };
    }

    const url = `${this.NHN_API_URL}/friendtalk/v2.4/appkeys/${this.NHN_APP_KEY}/images?imageTypes=${encodeURIComponent(imageTypes.join(','))}&pageNum=${pageNum}&pageSize=${pageSize}`;
    const resp = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json;charset=UTF-8',
        'X-Secret-Key': this.NHN_SECRET_KEY
      }
    });

    if (!resp.ok) {
      throw new Error(`NHN 이미지 조회 실패: ${resp.status}`);
    }

    const data = await resp.json();

    // NHN 응답 구조 매핑
    const header = data?.header;
    const imagesResponse = data?.imagesResponse || data?.imagesresponse || data?.imagesResponse || data?.images; // 방어적 처리
    if (!header?.isSuccessful) {
      throw new Error(`NHN 응답 에러: ${header?.resultMessage || 'unknown error'}`);
    }

    const items: any[] = imagesResponse?.images || imagesResponse || [];
    const totalCount: number = imagesResponse?.totalCount ?? 0;

    const mapped: ImageData[] = items.map((it) => ({
      id: String(it.imageSeq),
      url: it.imageUrl,
      thumbnailUrl: it.imageUrl,
      fileName: it.imageName || String(it.imageSeq),
      uploadedAt: Date.now(),
      note: undefined
    }));

    return {
      images: mapped,
      totalCount,
      pageNum,
      pageSize
    };
  }

  /**
   * 이미지 저장
   */
  static async saveImage(imageData: ImageData): Promise<boolean> {
    try {
      const images = await this.getImages();
      const updatedImages = [imageData, ...images];
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(updatedImages));
      return true;
    } catch (error) {
      console.error('Failed to save image:', error);
      return false;
    }
  }

  /**
   * 이미지 삭제
   */
  static async deleteImage(id: string): Promise<boolean> {
    try {
      const images = await this.getImages();
      const filteredImages = images.filter(img => img.id !== id);
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(filteredImages));
      
      // TODO: NHN Cloud에서도 삭제
      // await fetch(`${this.NHN_API_URL}/delete/${id}`, {
      //   method: 'DELETE',
      //   headers: {
      //     'Authorization': `Bearer ${this.NHN_API_KEY}`
      //   }
      // });
      
      return true;
    } catch (error) {
      console.error('Failed to delete image:', error);
      return false;
    }
  }

  /**
   * 이미지 노트 업데이트
   */
  static async updateImageNote(id: string, note: string): Promise<boolean> {
    try {
      const images = await this.getImages();
      const updatedImages = images.map(img => 
        img.id === id ? { ...img, note } : img
      );
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(updatedImages));
      return true;
    } catch (error) {
      console.error('Failed to update image note:', error);
      return false;
    }
  }

  /**
   * 썸네일 생성
   * TODO: 실제 썸네일 생성 로직 구현
   */
  static async generateThumbnail(file: File): Promise<string> {
    // Canvas를 사용한 썸네일 생성
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            reject('Canvas context not available');
            return;
          }

          // 썸네일 크기 설정
          const maxSize = 200;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > maxSize) {
              height = (height * maxSize) / width;
              width = maxSize;
            }
          } else {
            if (height > maxSize) {
              width = (width * maxSize) / height;
              height = maxSize;
            }
          }

          canvas.width = width;
          canvas.height = height;
          ctx.drawImage(img, 0, 0, width, height);

          resolve(canvas.toDataURL('image/jpeg', 0.8));
        };
        img.onerror = reject;
        img.src = e.target?.result as string;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  /**
   * 파일을 Base64로 변환
   */
  private static fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  /**
   * NHN Cloud API 설정
   * @param apiUrl API 엔드포인트 URL
   * @param apiKey API 인증 키
   */
  static configure(apiUrl: string, apiKey: string): void {
    // TODO: 실제 구현 시 사용
    this.NHN_API_URL = apiUrl;
    this.NHN_SECRET_KEY = apiKey;
  }
}

