# 🔗 Gonggo.link — 스마트 공고 분석기

> PDF/HWP 공고문을 AI가 즉시 분석하여 핵심 정보를 추출하고 엑셀로 저장해 드리는 수익형 웹 서비스

![Tech Stack](https://img.shields.io/badge/Next.js-14-black) ![AI](https://img.shields.io/badge/Claude_AI-Anthropic-orange) ![Deploy](https://img.shields.io/badge/Vercel-Free_Tier-blue)

---

## ✨ 주요 기능

| 기능 | 설명 |
|------|------|
| 📄 파일 파싱 | PDF (`pdfjs-dist`) / HWP·HWPX (`hwp.js`) 브라우저 내 클라이언트 파싱 |
| 🤖 AI 분석 | Claude Opus로 13개 항목 구조화 추출 |
| 📊 대시보드 | 이모지 카드 형태 요약 리포트 |
| 📥 엑셀 다운로드 | SheetJS로 브랜딩 포함 `.xlsx` 생성 |
| 💰 광고 수익 | Kakao AdFit 3개 슬롯 (상단/분석중/하단) |
| 🔒 개인정보 | 파일 서버 미저장, 텍스트만 API 전송 |

---

## 🚀 빠른 시작

### 1. 클론 및 의존성 설치

```bash
git clone https://github.com/your-id/gonggo-link.git
cd gonggo-link
npm install
```

### 2. 환경 변수 설정

```bash
cp .env.local.example .env.local
```

`.env.local` 파일을 열고 Anthropic API 키 입력:

```env
ANTHROPIC_API_KEY=sk-ant-api03-YOUR_KEY_HERE
```

> 🔑 API 키 발급: https://console.anthropic.com

### 3. 개발 서버 실행

```bash
npm run dev
# → http://localhost:3000
```

---

## 📦 배포 (Vercel 무료)

```bash
# Vercel CLI 설치
npm i -g vercel

# 배포
vercel

# 환경 변수 추가
vercel env add ANTHROPIC_API_KEY
```

또는 GitHub 연동 후 Vercel 대시보드에서 자동 배포.

> ✅ Vercel Hobby (무료) 플랜으로 운영 가능 — Serverless Functions 무제한

---

## 💰 Kakao AdFit 광고 설정

1. https://adfit.kakao.com 접속 후 광고 단위 생성
2. `.env.local`에 단위 코드 입력:
   ```env
   NEXT_PUBLIC_ADFIT_SLOT_A=DAN-XXXXXXXXXXXXXXXX
   NEXT_PUBLIC_ADFIT_SLOT_B=DAN-YYYYYYYYYYYYYYYY
   NEXT_PUBLIC_ADFIT_SLOT_C=DAN-ZZZZZZZZZZZZZZZZ
   ```
3. `app/page.tsx`의 `<AdFitSlot unit="...">` 값을 환경변수로 교체

---

## 🗂️ 프로젝트 구조

```
gonggo-link/
├── app/
│   ├── layout.tsx          # 전역 레이아웃 + AdFit 스크립트
│   ├── page.tsx            # 메인 페이지 (전체 UI + 로직)
│   ├── globals.css         # Pretendard 폰트 + 전역 스타일
│   └── api/
│       └── analyze/
│           └── route.ts    # Anthropic API 서버 라우트
├── public/
├── .env.local.example      # 환경 변수 템플릿
├── next.config.mjs
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

---

## 🎨 디자인 시스템

| 토큰 | 값 |
|------|-----|
| 배경 | `#FFFFFF` (Pure White) |
| 포인트 | `#0071E3` (Apple Blue) |
| 텍스트 | `#1D1D1F` (Apple Dark) |
| 보조 | `#6E6E73` (Apple Secondary) |
| 배경 회색 | `#F5F5F7` (Apple BG) |
| 폰트 | Pretendard (한글 최적화) |

---

## 🧠 AI 추출 항목

| 항목 | 설명 |
|------|------|
| 공고명 | 사업·공고 제목 |
| 주관기관 | 운영 기관 |
| 지원금액 | 지원 금액 및 단위 |
| 지원규모 | 선정 인원/기업 수 |
| 마감일 | 신청 마감일 |
| 공고일 | 게시일 |
| 지원자격 | 신청 자격 요건 |
| 사업목적 | 목적 및 개요 |
| 신청방법 | 신청 절차 |
| 제출서류 | 필요 서류 |
| 문의처 | 연락처 |
| 기타사항 | 유의사항 |
| 핵심요약 | 1-2문장 요약 |

---

## 📄 엑셀 출력 구조

파일명: `[Gonggo.link]{공고명}_요약본.xlsx`

- **Sheet 1**: 공고 요약 리포트 (서식 포함)
- **Sheet 2**: 원본 데이터 (JSON 구조)
- 최상단: "본 리포트는 Gonggo.link(WJadlink)에서 생성되었습니다"

---

## ⚠️ 주의사항

- **스캔 PDF**: 이미지로 스캔된 PDF는 텍스트 추출 불가 (OCR 미지원)
- **API 비용**: Claude Opus 기준 문서당 약 $0.01~0.03
- **HWP 호환**: 구버전 HWP는 일부 파싱 제한 있음

---

## 🔮 향후 개선 계획

- [ ] OCR 지원 (Tesseract.js)
- [ ] 복수 파일 일괄 처리
- [ ] 공고 카테고리 자동 분류
- [ ] 마감 임박 공고 알림

---

*© 2024 Gonggo.link by WJadlink*
