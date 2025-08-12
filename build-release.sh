#!/bin/bash

# 색상 정의
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}🔨 Braze 자동완성 확장 프로그램 빌드 시작...${NC}"

# 의존성 설치
echo -e "${YELLOW}📦 의존성 설치 중...${NC}"
npm install

# 빌드
echo -e "${YELLOW}🏗️  빌드 중...${NC}"
npm run build

# dist 폴더 확인
if [ ! -d "dist" ]; then
    echo "❌ 빌드 실패: dist 폴더가 생성되지 않았습니다."
    exit 1
fi

# ZIP 파일 생성
echo -e "${YELLOW}📦 ZIP 파일 생성 중...${NC}"
cd dist
zip -r ../braze-autocomplete-extension.zip . -x "*.DS_Store"
cd ..

# 성공 메시지
echo -e "${GREEN}✅ 빌드 완료!${NC}"
echo -e "${GREEN}📦 braze-autocomplete-extension.zip 파일이 생성되었습니다.${NC}"
echo ""
echo -e "${YELLOW}📋 설치 방법:${NC}"
echo "1. Chrome에서 chrome://extensions 접속"
echo "2. 개발자 모드 활성화"
echo "3. '압축 해제된 확장 프로그램 로드' 클릭"
echo "4. ZIP 파일을 압축 해제한 폴더 선택"
