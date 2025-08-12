# 🔐 GitHub Secrets 설정 가이드

## GitHub Repository Secrets 설정

### 1. Settings 페이지 접속
https://github.com/wonjunekang-myrealtrip/braze-autocomplete-extension/settings/secrets/actions

### 2. 다음 Secrets 추가

#### GOOGLE_SHEETS_API_KEY
1. "New repository secret" 클릭
2. **Name**: `GOOGLE_SHEETS_API_KEY`
3. **Value**: `AIzaSyBUZh6hu264vtDfcVkGA0HO9txuN6fFuyE`
4. "Add secret" 클릭

#### GOOGLE_SHEETS_ID (선택사항)
1. "New repository secret" 클릭
2. **Name**: `GOOGLE_SHEETS_ID`
3. **Value**: `1W5mZhAFws47z3gvOs9Gttm3setCpE_yK4YCAk7FIukE`
4. "Add secret" 클릭

## 로컬 개발 환경 설정

### 1. .env 파일 생성
```bash
cp env.example .env
```

### 2. .env 파일 수정
```
GOOGLE_SHEETS_API_KEY=AIzaSyBUZh6hu264vtDfcVkGA0HO9txuN6fFuyE
GOOGLE_SHEETS_ID=1W5mZhAFws47z3gvOs9Gttm3setCpE_yK4YCAk7FIukE
```

## 보안 주의사항

⚠️ **중요**: 
- `.env` 파일은 절대 Git에 커밋하지 마세요
- API Key가 노출된 경우 즉시 재발급 받으세요
- Production 환경에서는 반드시 GitHub Secrets 사용

## API Key 재발급 방법

1. [Google Cloud Console](https://console.cloud.google.com/) 접속
2. APIs & Services → Credentials
3. 기존 Key 삭제 후 새로 생성
4. GitHub Secrets 업데이트
