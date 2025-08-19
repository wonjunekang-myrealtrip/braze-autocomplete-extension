# 📸 NHN Cloud 이미지 매니저 테스트 가이드

## 🧪 테스트 모드 사용 방법

### 1. 테스트 모드 활성화
- 팝업 우측 상단의 `🧪` 버튼을 클릭하면 테스트 패널이 나타납니다.

### 2. 테스트 기능들

#### 📌 **더미 이미지 15개 추가**
- 한 번에 15개의 테스트 이미지를 생성합니다
- 각 이미지는 다음 특징을 가집니다:
  - 랜덤 그라디언트 배경색
  - 400x300 크기
  - 샘플 노트 포함 (메인 배너, 프로모션 팝업 등)
  - 랜덤 파일 크기 (100KB ~ 600KB)
  - 1시간씩 다른 업로드 시간

#### 🗑️ **모든 이미지 삭제**
- localStorage에 저장된 모든 이미지를 한 번에 삭제합니다
- 확인 다이얼로그가 나타납니다

#### 💾 **데이터 내보내기 (JSON)**
- 현재 저장된 모든 이미지 데이터를 JSON 파일로 다운로드합니다
- 파일명: `nhn-images-[timestamp].json`
- 데이터 구조 확인 및 백업용으로 유용합니다

#### 🔍 **콘솔에 출력**
- 현재 이미지 배열을 브라우저 개발자 도구 콘솔에 출력합니다
- Chrome DevTools (F12) > Console 탭에서 확인 가능

### 3. 상태 정보 확인
테스트 패널 하단에 다음 정보가 표시됩니다:
- 현재 이미지 수
- 총 용량 (모든 이미지 크기 합계)
- 저장 위치: `localStorage` (key: `nhn_cloud_images`)

## 📊 데이터 구조

각 이미지는 다음과 같은 구조로 저장됩니다:

```json
{
  "id": "dummy-1234567890-0",
  "url": "data:image/jpeg;base64,...",
  "thumbnailUrl": "data:image/jpeg;base64,...",
  "note": "메인 배너 이미지",
  "uploadedAt": 1234567890000,
  "fileName": "test-image-1.jpg",
  "fileSize": 234567,
  "mimeType": "image/jpeg"
}
```

## 🎯 테스트 시나리오

### 스크롤 테스트
1. `🧪` 버튼 클릭하여 테스트 모드 활성화
2. "더미 이미지 15개 추가" 클릭
3. 이미지 리스트 영역에서 스크롤이 정상 작동하는지 확인
4. 테스트 패널 표시/숨김 시 스크롤 영역 높이 자동 조정 확인

### 데이터 저장/불러오기 테스트
1. 이미지 업로드 또는 더미 이미지 추가
2. 노트 추가/수정
3. 팝업 닫았다가 다시 열기
4. 데이터가 유지되는지 확인

### 노트 기능 테스트
1. 이미지의 "노트 추가" 클릭
2. 텍스트 입력 후 "저장"
3. 노트 클릭하여 수정 모드 진입
4. 수정 후 저장 또는 취소

### URL 복사 테스트
1. 이미지의 복사 버튼(📋) 클릭
2. 메모장 등에 붙여넣기하여 URL 확인

### 이미지 미리보기
1. 썸네일 클릭
2. 전체 크기 이미지 모달 표시 확인
3. 모달 외부 클릭으로 닫기

## 🔧 개발자 도구 활용

### localStorage 직접 확인
1. Chrome DevTools 열기 (F12)
2. Application 탭 > Storage > Local Storage
3. 확장 프로그램 URL 선택
4. `nhn_cloud_images` 키 확인

### 데이터 수동 조작
```javascript
// 콘솔에서 실행
// 데이터 읽기
const images = JSON.parse(localStorage.getItem('nhn_cloud_images'));
console.log(images);

// 데이터 수정
images[0].note = "수정된 노트";
localStorage.setItem('nhn_cloud_images', JSON.stringify(images));

// 데이터 삭제
localStorage.removeItem('nhn_cloud_images');
```

## 🚀 NHN Cloud API 연동 준비

`src/services/imageService.ts` 파일에서 다음 부분을 수정하면 실제 API와 연동됩니다:

```typescript
// 설정
ImageService.configure(apiUrl, apiKey);

// uploadImage 메서드의 TODO 부분 주석 해제
const formData = new FormData();
formData.append('file', file);
const response = await fetch(`${this.NHN_API_URL}/upload`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${this.NHN_API_KEY}`
  },
  body: formData
});
```

## 📝 주의사항

- 현재는 이미지를 Base64로 localStorage에 저장하므로 큰 이미지는 용량 제한에 걸릴 수 있습니다
- localStorage 최대 용량은 약 5-10MB입니다
- 실제 운영 시에는 NHN Cloud에 업로드하고 URL만 저장하도록 변경 필요

## 🎨 UI/UX 특징

- **반응형 스크롤**: 테스트 패널 표시 여부에 따라 리스트 높이 자동 조정
- **호버 효과**: 이미지 카드에 마우스 오버 시 그림자 강조
- **즉시 피드백**: 모든 액션에 대한 즉각적인 시각적 피드백
- **간편한 노트 수정**: 인라인 편집으로 빠른 수정 가능

