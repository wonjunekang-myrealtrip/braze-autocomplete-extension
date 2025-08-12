import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { AttributeMetadata, ExtensionMessage } from '@/shared/types';
import '@/styles/tailwind.css';

interface PopupState {
  attributes: AttributeMetadata[];
  isLoading: boolean;
  lastSync: string;
  error: string | null;
}

const PopupApp: React.FC = () => {
  const [state, setState] = useState<PopupState>({
    attributes: [],
    isLoading: true,
    lastSync: '',
    error: null
  });

  // 컴포넌트 마운트 시 데이터 로드
  useEffect(() => {
    loadData();
  }, []);

  // 데이터 로드
  const loadData = async () => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      const response = await sendMessage({ type: 'GET_ATTRIBUTES' });
      
      if (response.success) {
        setState(prev => ({
          ...prev,
          attributes: response.data,
          isLoading: false,
          lastSync: new Date().toLocaleString('ko-KR')
        }));
      } else {
        setState(prev => ({
          ...prev,
          error: response.error,
          isLoading: false
        }));
      }
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: '데이터 로드 중 오류가 발생했습니다.',
        isLoading: false
      }));
    }
  };

  // Background Script와 통신
  const sendMessage = (message: ExtensionMessage): Promise<any> => {
    return new Promise((resolve) => {
      chrome.runtime.sendMessage(message, resolve);
    });
  };

  // 수동 동기화
  const handleSync = async () => {
    setState(prev => ({ ...prev, isLoading: true }));
    
    try {
      const response = await sendMessage({ type: 'SYNC_DATA' });
      
      if (response.success) {
        await loadData(); // 데이터 다시 로드
      } else {
        setState(prev => ({
          ...prev,
          error: response.error,
          isLoading: false
        }));
      }
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: '동기화 중 오류가 발생했습니다.',
        isLoading: false
      }));
    }
  };

  // 캐시 클리어
  const handleClearCache = async () => {
    if (!confirm('캐시를 클리어하시겠습니까?')) return;
    
    setState(prev => ({ ...prev, isLoading: true }));
    
    try {
      const response = await sendMessage({ type: 'CLEAR_CACHE' });
      
      if (response.success) {
        setState(prev => ({
          ...prev,
          attributes: [],
          isLoading: false,
          lastSync: '',
          error: null
        }));
      } else {
        setState(prev => ({
          ...prev,
          error: response.error,
          isLoading: false
        }));
      }
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: '캐시 클리어 중 오류가 발생했습니다.',
        isLoading: false
      }));
    }
  };

  // 카테고리별 통계
  const categoryStats = state.attributes.reduce((acc, attr) => {
    const category = attr.category || '기타';
    acc[category] = (acc[category] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="p-4 bg-gray-50 min-h-full">
      {/* 헤더 */}
      <div className="mb-4">
        <h1 className="text-lg font-bold text-gray-900 mb-2">
          🎯 Braze 자동완성
        </h1>
        <p className="text-sm text-gray-600">
          Custom Attributes 자동완성 기능
        </p>
      </div>

      {/* 상태 정보 */}
      <div className="bg-white rounded-lg p-3 mb-4 shadow-sm">
        <h2 className="text-sm font-semibold text-gray-700 mb-2">📊 상태 정보</h2>
        
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">총 속성 수:</span>
            <span className="font-medium text-blue-600">
              {state.isLoading ? '로딩 중...' : `${state.attributes.length}개`}
            </span>
          </div>
          
          <div className="flex justify-between">
            <span className="text-gray-600">마지막 동기화:</span>
            <span className="text-gray-800 text-xs">
              {state.lastSync || '없음'}
            </span>
          </div>
        </div>
      </div>

      {/* 에러 메시지 */}
      {state.error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
          <p className="text-red-700 text-sm">❌ {state.error}</p>
        </div>
      )}

      {/* 카테고리별 통계 */}
      {Object.keys(categoryStats).length > 0 && (
        <div className="bg-white rounded-lg p-3 mb-4 shadow-sm">
          <h2 className="text-sm font-semibold text-gray-700 mb-2">📈 카테고리별 속성</h2>
          <div className="space-y-1">
            {Object.entries(categoryStats).map(([category, count]) => (
              <div key={category} className="flex justify-between text-sm">
                <span className="text-gray-600">{category}:</span>
                <span className="font-medium">{count}개</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 액션 버튼 */}
      <div className="space-y-2">
        <button
          onClick={handleSync}
          disabled={state.isLoading}
          className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 text-white py-2 px-4 rounded-lg text-sm font-medium transition-colors"
        >
          {state.isLoading ? '처리 중...' : '🔄 수동 동기화'}
        </button>
        
        <button
          onClick={handleClearCache}
          disabled={state.isLoading}
          className="w-full bg-gray-500 hover:bg-gray-600 disabled:bg-gray-300 text-white py-2 px-4 rounded-lg text-sm font-medium transition-colors"
        >
          🗑️ 캐시 클리어
        </button>
      </div>

      {/* 사용법 안내 */}
      <div className="mt-4 p-3 bg-blue-50 rounded-lg">
        <h3 className="text-sm font-semibold text-blue-800 mb-2">💡 사용법</h3>
        <ul className="text-xs text-blue-700 space-y-1">
          <li>• Braze 화면에서 속성 입력 시 자동완성</li>
          <li>• 2글자 이상 입력하면 제안 표시</li>
          <li>• 화살표 키로 선택, Enter로 확정</li>
          <li>• Boolean/String 타입은 값도 제안</li>
        </ul>
      </div>

      {/* 버전 정보 */}
      <div className="mt-4 text-center text-xs text-gray-500">
        v1.0.0 | 목 데이터 버전
      </div>
    </div>
  );
};

// React 앱 마운트
const container = document.getElementById('root');
if (container) {
  const root = createRoot(container);
  root.render(<PopupApp />);
}
