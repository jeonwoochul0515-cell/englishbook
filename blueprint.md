# 영어 책 쉽게 읽기 (English Reading Companion)

## 📚 서비스 개요
이 앱은 PDF 영어 원서를 읽으면서 실시간으로 학습할 수 있는 독서 도우미입니다. 단순한 리더기를 넘어, AI 기술을 활용해 단어 뜻풀이, 문장 구조 분석(Magic Subtitles), 단어장 관리 및 퀴즈 기능을 제공하는 통합 학습 플랫폼입니다.

## 🎯 주요 기능

### 1. PDF 리더 (PDF.js 기반)
- **업로드:** 드래그앤드롭 및 파일 선택을 통한 PDF 업로드.
- **문장 단위 독서:** 한 번에 하나의 문장에 집중할 수 있도록 나머지 텍스트를 흐리게 처리(Focus Mode).
- **네비게이션:** 이전/다음 문장 이동 및 페이지 컨트롤.

### 2. 스마트 번역 및 분석 (Gemini AI API)
- **단어 즉시 번역:** 단어 클릭 시 문맥에 맞는 정확한 뜻과 예문을 팝업으로 제공.
- **매직 서브타이틀 (Magic Subtitles):** 문장을 클릭하면 의미 덩어리(Chunk) 단위로 분해하여 영어와 한국어를 나란히 표시. (직독직해 훈련)

### 3. 학습 및 관리 (Firebase)
- **개인 단어장:** 모르는 단어를 즉시 저장하고 Firebase Firestore를 통해 기기간 동기화.
- **AI 퀴즈 시스템:**
    - **단어 퀴즈:** 개인 단어장에서 추출한 단어 학습.
    - **내용 이해 퀴즈:** 읽은 텍스트 내용을 바탕으로 AI가 생성한 독해 문제.
- **사용자 인증:** Firebase Auth(Google 로그인)를 통한 개인화된 경험.

### 4. 디자인 컨셉 (Baseline CSS)
- **Aesthetics:** 따뜻하고 눈이 편안한 색상 팔레트 (크림/베이지 배경, 오렌지 포인트).
- **Typography:** 가독성 높은 영문/국문 폰트 조합.
- **Interactivity:** 부드러운 전환 효과 및 세련된 모달 디자인. 모바일 대응 하단 시트(Bottom Sheet) UI.

## 🛠 기술 스택
- **Frontend:** Vanilla JavaScript, HTML5, CSS3 (Modern Features: Flexbox, Grid, Variables, Container Queries).
- **Libraries:** PDF.js (PDF Parsing & Rendering).
- **Backend/AI:** 
    - Firebase (Auth, Firestore, Hosting).
    - Gemini 1.5 Pro/Flash (Contextual Translation, Sentence Chunking, Quiz Generation).

## 📅 개발 로드맵

### Phase 1: 기본 구조 및 UI 고도화 (진행 중)
- [x] 프로젝트 초기 설정 및 기본 파일 생성.
- [x] PDF.js 연동 및 텍스트 추출.
- [x] 기본 레이아웃 및 디자인 적용.
- [ ] **디자인 개선:** 크림/베이지 테마 적용 및 반응형 레이아웃 강화.

### Phase 2: AI 기능 강화
- [x] Gemini API 연동 (단어 뜻).
- [ ] **Magic Subtitles 구현:** 문장 청크 분해 및 번역 로직 추가.
- [x] AI 퀴즈 생성 로직 (초안).

### Phase 3: Firebase 및 사용자 연동
- [x] Firebase 초기화 및 Auth 연동.
- [x] Firestore를 이용한 단어장 저장/불러오기.
- [ ] 읽기 진행도(Progress) 저장 및 동기화 고도화.

### Phase 4: 폴리싱 및 배포
- [ ] 모바일 최적화 (하단 시트 UI).
- [ ] 애니메이션 및 효과 추가.
- [ ] Firebase Hosting 배포.
