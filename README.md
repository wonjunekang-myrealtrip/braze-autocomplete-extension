# 🚀 Braze 자동완성 Chrome Extension

Braze 대시보드에서 Custom Attributes 입력 시 한글 자동완성을 제공하는 Chrome 확장 프로그램입니다.

## ✨ 주요 기능

- 🔍 **실시간 자동완성**: 도시, 공항, 국가, 항공사 등 한글/영문 검색
- 🏷️ **한글명 표시**: 선택한 값의 한글명을 자동으로 표시
- 📦 **멀티 셀렉트 지원**: 여러 값 선택 시 각각의 한글명 표시
- 🛍️ **상품 검색**: 마이리얼트립 상품 검색 기능 내장

---

## 📥 빠른 설치 (1분 소요)

### 1️⃣ 다운로드
**[⬇️ 최신 버전 다운로드 (v1.0.0)](https://github.com/wonjunekang-myrealtrip/braze-autocomplete-extension/releases/latest/download/braze-autocomplete-extension.zip)**

### 2️⃣ 압축 해제
다운로드한 ZIP 파일을 더블클릭하여 압축 해제

### 3️⃣ Chrome에 설치
1. Chrome 주소창에 `chrome://extensions` 입력
2. 우측 상단 **개발자 모드** ON
3. **압축 해제된 확장 프로그램 로드** 클릭
4. 압축 해제한 폴더 내 **dist** 폴더 선택

### ✅ 완료!
Braze 대시보드에서 Custom Attributes 사용 시 자동완성이 작동합니다.

---

## 🎯 사용 방법

### Segment 생성 시
1. Braze 대시보드 → Segments → Create Segment
2. Add Filter → Custom Attributes 선택
3. 원하는 Attribute 선택 (예: CITY_NM)
4. 입력 필드에 타이핑 시작
   - "서울" → Seoul 자동완성
   - "인천" → ICN 공항 코드 자동완성

### 지원되는 자동완성 타입
- 🏙️ **도시** (CITY): 서울, 도쿄, 파리 등
- ✈️ **공항** (AIRPORT): ICN, GMP, NRT 등
- 🌍 **국가** (COUNTRY): 한국, 일본, 미국 등
- 🛫 **항공사** (AIRLINE): KE, OZ, 7C 등
- 📝 **카테고리**: 투어, 액티비티, 숙박 등

### 상품 검색 기능
1. 화면 우측 하단 🔍 버튼 클릭
2. 검색어 입력 (예: "오사카 투어")
3. 상품 목록에서 GID 확인 가능

---

## 🔧 문제 해결

<details>
<summary><b>자동완성이 나타나지 않아요</b></summary>

- 확장 프로그램이 활성화되어 있는지 확인
- 페이지 새로고침 (F5)
- Chrome 재시작

</details>

<details>
<summary><b>"dist 폴더를 찾을 수 없습니다" 오류</b></summary>

- ZIP 파일 압축 해제 후 생성된 폴더 열기
- 그 안의 `dist` 폴더 선택 (상위 폴더 X)

</details>

<details>
<summary><b>개발자 모드가 뭔가요?</b></summary>

- Chrome 웹스토어 외부 확장 프로그램 설치를 위한 정상적인 모드
- 내부 사용을 위한 안전한 방법입니다

</details>

---

## 🔄 업데이트

새 버전이 출시되면:
1. 기존 확장 프로그램 제거 (`chrome://extensions`에서)
2. 위의 설치 과정 반복

---

## 📊 지원 데이터

| 타입 | 데이터 수 | 예시 |
|------|----------|------|
| 도시 | 100+ | Seoul, Tokyo, Paris |
| 공항 | 500+ | ICN, NRT, CDG |
| 국가 | 195 | KR, JP, US |
| 항공사 | 800+ | KE, OZ, 7C |

---

## 🤝 기여 및 문의

- **버그 제보**: [Issues](https://github.com/wonjunekang-myrealtrip/braze-autocomplete-extension/issues)
- **기능 제안**: [Discussions](https://github.com/wonjunekang-myrealtrip/braze-autocomplete-extension/discussions)
- **Slack**: #braze-자동완성

---

## 📝 라이선스

내부 사용 전용 (MyRealTrip Internal Use Only)

---

<div align="center">
  <b>Made with ❤️ by MyRealTrip Dev Team</b>
</div>