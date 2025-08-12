# 🤝 기여 가이드

## 개발 환경 설정

### 필요 도구
- Node.js 18+
- npm 또는 yarn
- Chrome 브라우저

### 설치
```bash
git clone https://github.com/YOUR_USERNAME/braze-autocomplete-extension.git
cd braze-autocomplete-extension
npm install
```

### 개발 모드 실행
```bash
npm run dev
```

### 빌드
```bash
npm run build
```

## 📁 프로젝트 구조

```
braze-autocomplete-extension/
├── src/
│   ├── content/          # Content Scripts
│   │   ├── simple.ts     # 메인 자동완성 로직
│   │   └── productSearch.ts # 상품 검색 기능
│   ├── background/       # Background Service Worker
│   ├── shared/           # 공통 모듈
│   │   ├── mockData.ts   # 목 데이터
│   │   ├── types.ts      # TypeScript 타입
│   │   └── constants.ts  # 상수
│   └── services/         # API 서비스
├── public/               # 정적 파일
│   ├── manifest.json     # Extension 설정
│   └── icons/           # 아이콘
└── dist/                # 빌드 결과 (gitignore)
```

## 🔧 주요 기능 위치

### 자동완성 로직
- `src/content/simple.ts`: 드롭다운 생성, 검색, 입력 처리

### 데이터 소스
- Google Sheets API: 속성 메타데이터
- MyRealTrip API: 공항, 도시, 국가 데이터
- CSV 파일: 항공사 데이터 (`src/shared/airline_info.csv`)

### 타입별 처리
- ENUM: Google Sheets에서 가져온 고정 값
- AIRPORT: 실시간 API 호출
- CITY/COUNTRY: 캐시된 데이터 + API
- AIRLINE: CSV 파일 기반

## 🐛 버그 수정 방법

1. Issue 생성 또는 선택
2. 브랜치 생성: `fix/issue-번호`
3. 수정 및 테스트
4. Pull Request 생성

## ✅ 테스트

### 수동 테스트
1. `npm run build`로 빌드
2. Chrome에서 확장 프로그램 로드
3. Braze 대시보드에서 테스트
   - 각 타입별 자동완성 확인
   - 한글명 표시 확인
   - 멀티 셀렉트 확인

### 테스트 체크리스트
- [ ] CITY 타입 자동완성
- [ ] AIRPORT 타입 자동완성
- [ ] COUNTRY 타입 자동완성
- [ ] AIRLINE 타입 자동완성
- [ ] ENUM 타입 자동완성
- [ ] 멀티 셀렉트 (contains any of)
- [ ] 상품 검색 기능

## 📝 코드 스타일

- TypeScript 사용
- 함수명: camelCase
- 상수: UPPER_SNAKE_CASE
- 주석: 한글 가능

## 🚀 릴리스 프로세스

1. 버전 업데이트
   - `manifest.json`의 version
   - `package.json`의 version

2. 빌드 및 패키징
   ```bash
   npm run package
   ```

3. GitHub Release 생성
   - Tag: `v1.0.0` 형식
   - ZIP 파일 첨부

## 💬 문의

- Slack: #braze-자동완성
- GitHub Issues
