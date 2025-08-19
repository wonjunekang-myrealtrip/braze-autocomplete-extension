import React, { useState, useEffect, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import { ImageData } from '@/shared/types';
import '@/styles/tailwind.css';

const PopupApp: React.FC = () => {
  const [images, setImages] = useState<ImageData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [pageNum, setPageNum] = useState(1);
  const [pageSize, setPageSize] = useState(15);
  const [imageTypes, setImageTypes] = useState<string[]>(['IMAGE', 'WIDE_IMAGE']);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isWideImage, setIsWideImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 이미지 목록 로드 (NHN 원격 + 페이징)
  useEffect(() => {
    loadRemoteImages();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageNum, pageSize]);

  // NHN 이미지 목록 로드 (백그라운드를 통해 호출)
  const loadRemoteImages = async () => {
    try {
      setIsLoading(true);
      chrome.runtime.sendMessage(
        { 
          type: 'GET_IMAGES_PAGED', 
          payload: { pageNum, pageSize, imageTypes }
        },
        (response) => {
          if (response?.success) {
            const page = response.data as { images: ImageData[]; totalCount: number; pageNum: number; pageSize: number };
            setImages(page.images || []);
            setTotalCount(page.totalCount || 0);
          } else {
            console.error('이미지 목록 로드 실패:', response?.error);
          }
          setIsLoading(false);
        }
      );
    } catch (error) {
      console.error('이미지 목록 로드 실패:', error);
      setIsLoading(false);
    }
  };

  // 이미지 업로드 처리 (NHN Cloud API 연동)
  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    
    try {
      // Base64로 변환 (백그라운드로 전송하기 위해)
      const reader = new FileReader();
      reader.onload = (e) => {
        const base64 = e.target?.result as string;
        
        // 백그라운드 스크립트로 업로드 요청
        chrome.runtime.sendMessage(
          { 
            type: 'UPLOAD_IMAGE', 
            payload: { 
              file: {
                name: file.name,
                type: file.type,
                size: file.size,
                data: base64
              },
              isWide: isWideImage
            }
          },
          (response) => {
            if (response?.success) {
              // 업로드 성공 후 목록 새로고침
              setPageNum(1);
              loadRemoteImages();
              alert('이미지가 업로드되었습니다.');
            } else {
              alert(response?.error || '이미지 업로드에 실패했습니다.');
            }
            
            // 입력 초기화
            if (fileInputRef.current) {
              fileInputRef.current.value = '';
            }
            setIsLoading(false);
          }
        );
      };
      
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('업로드 실패:', error);
      alert('이미지 업로드에 실패했습니다.');
      setIsLoading(false);
    }
  };

  // 이미지 삭제 (원격 삭제 미지원 - 로컬 데이터만)
  const handleDeleteImage = (id: string) => {
    alert('원격 이미지는 삭제를 지원하지 않습니다. (로컬 테스트 데이터만 삭제 가능)');
  };

  // URL 복사
  const handleCopyUrl = (url: string) => {
    navigator.clipboard.writeText(url).then(() => {
      alert('URL이 복사되었습니다.');
    });
  };

  // imageSeq(ID) 복사
  const handleCopyId = (id: string) => {
    navigator.clipboard.writeText(id).then(() => {
      alert('이미지 ID가 복사되었습니다.');
    });
  };

  // 새로고침 - 1페이지로 초기화
  const handleRefresh = () => {
    setPageNum(1);
    loadRemoteImages();
  };

  // 캐시 클리어
  const handleClearCache = async () => {
    if (!confirm('Braze 자동완성 캐시를 클리어하시겠습니까?')) return;
    
    try {
      chrome.runtime.sendMessage({ type: 'CLEAR_CACHE' }, (response) => {
        if (response?.success) {
          alert('캐시가 클리어되었습니다.');
        }
      });
    } catch (error) {
      console.error('캐시 클리어 실패:', error);
    }
  };



  // 파일 크기 포맷
  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '';
    const kb = bytes / 1024;
    if (kb < 1024) return `${kb.toFixed(1)} KB`;
    const mb = kb / 1024;
    return `${mb.toFixed(1)} MB`;
  };

  // 날짜 포맷
  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="w-[400px] min-h-[500px] bg-gray-50">
      {/* 헤더 */}
      <div className="bg-white border-b px-4 py-3">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-lg font-bold text-gray-900">
              🖼️ NHN Cloud 이미지 매니저
            </h1>
            <p className="text-xs text-gray-500 mt-1">
              이미지를 업로드하고 URL을 관리하세요
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleRefresh}
              className="p-1.5 text-blue-600 hover:bg-blue-50 rounded"
              title="새로고침"
              disabled={isLoading}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>

          </div>
        </div>
      </div>



      {/* 업로드 영역 */}
      <div className="p-4">
        <div className="bg-white rounded-lg p-4 shadow-sm">
          <div className="space-y-3">
            {/* 와이드 이미지 옵션 */}
            <div className="flex items-center">
              <input
                type="checkbox"
                id="wide-image"
                checked={isWideImage}
                onChange={(e) => setIsWideImage(e.target.checked)}
                className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
              />
              <label htmlFor="wide-image" className="ml-2 text-sm font-medium text-gray-700">
                와이드 이미지로 업로드
              </label>
              <span className="ml-2 text-xs text-gray-500">
                (친구톡 와이드형 메시지용)
              </span>
            </div>
            
            {/* 업로드 버튼 */}
            <div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
                id="file-upload"
              />
              <label
                htmlFor="file-upload"
                className="w-full inline-flex justify-center items-center px-4 py-2 bg-blue-500 text-white text-sm font-medium rounded-md hover:bg-blue-600 cursor-pointer transition-colors"
              >
                {isLoading ? '업로드 중...' : '📤 이미지 업로드'}
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* 이미지 리스트 */}
      <div className="px-4 pb-4 flex-1 overflow-y-auto" style={{ maxHeight: '280px' }}>
        {isLoading ? (
          <div className="text-center py-8 text-gray-500">
            <p className="text-sm">불러오는 중...</p>
          </div>
        ) : images.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p className="text-sm">업로드된 이미지가 없습니다</p>
          </div>
        ) : (
          <div className="space-y-2">
            {images.map((image) => (
              <div
                key={image.id}
                className="bg-white rounded-lg p-3 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex gap-3">
                  {/* 썸네일 */}
                  <div className="flex-shrink-0">
                    <img
                      src={image.thumbnailUrl || image.url}
                      alt={image.fileName}
                      className="w-16 h-16 object-cover rounded-md border border-gray-200"
                      onClick={() => setSelectedImage(image.url)}
                    />
                  </div>

                  {/* 정보 */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {image.fileName}
                        </p>
                        <p className="text-xs text-gray-500">
                          {formatFileSize(image.fileSize)} • {formatDate(image.uploadedAt)}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          ID: {image.id}
                        </p>
                      </div>

                      {/* 액션 버튼 */}
                      <div className="flex gap-1 ml-2">
                        <button
                          onClick={() => handleCopyUrl(image.url)}
                          className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                          title="URL 복사"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.102 1.101m4.899.758a4 4 0 00-5.656 0" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleCopyId(image.id)}
                          className="p-1 text-green-600 hover:bg-green-50 rounded"
                          title="이미지 ID 복사"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
                          </svg>
                        </button>
                        {/* 원격 삭제 미지원 */}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 페이징 컨트롤 */}
      <div className="border-t bg-white px-4 py-3">
        <div className="flex items-center justify-between text-sm">
          <div className="text-gray-600">
            총 {totalCount}건
          </div>
          <div className="flex items-center gap-2">
            <button
              className="px-2 py-1 border rounded disabled:opacity-50"
              onClick={() => setPageNum((p) => Math.max(1, p - 1))}
              disabled={pageNum <= 1 || isLoading}
            >
              이전
            </button>
            <span className="text-gray-700">{pageNum}</span>
            <button
              className="px-2 py-1 border rounded disabled:opacity-50"
              onClick={() => {
                const maxPage = Math.max(1, Math.ceil(totalCount / pageSize));
                setPageNum((p) => Math.min(maxPage, p + 1));
              }}
              disabled={isLoading || images.length === 0 || pageNum >= Math.max(1, Math.ceil(totalCount / pageSize))}
            >
              다음
            </button>
            <select
              className="ml-2 border rounded px-2 py-1"
              value={pageSize}
              onChange={(e) => {
                setPageNum(1);
                setPageSize(parseInt(e.target.value, 10));
              }}
            >
              <option value={10}>10</option>
              <option value={15}>15</option>
              <option value={20}>20</option>
              <option value={30}>30</option>
            </select>
          </div>
        </div>
      </div>

      {/* 하단 캐시 버튼 */}
      <div className="border-t bg-white px-4 py-3">
        <button
          onClick={handleClearCache}
          className="w-full px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm rounded-md transition-colors"
        >
          🗑️ Braze 자동완성 캐시 클리어
        </button>
      </div>

      {/* 이미지 미리보기 모달 */}
      {selectedImage && (
        <div
          className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50"
          onClick={() => setSelectedImage(null)}
        >
          <img
            src={selectedImage}
            alt="Preview"
            className="max-w-full max-h-full"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
};

// React 앱 마운트
const container = document.getElementById('root');
if (container) {
  const root = createRoot(container);
  root.render(<PopupApp />);
}