import type { Metadata } from 'next';
import Script from 'next/script';
import './globals.css';

const BASE_URL = 'https://gonggo.link';

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),

  // ─── 타이틀 ───────────────────────────────────────
  title: {
    default: '공고뚝딱 | AI 공고문 분석기 — PDF·HWP 핵심 즉시 추출',
    template: '%s | 공고뚝딱',
  },

  // ─── 설명 ─────────────────────────────────────────
  description:
    '공고뚝딱은 PDF·HWP 공고문을 AI가 즉시 분석해 신청자격, 지원금액, 마감일 등 핵심 정보를 자동 추출하고 엑셀로 저장해 드리는 무료 서비스입니다. 보조금·지원사업·입찰 공고를 10초 만에 파악하세요.',

  // ─── 키워드 ───────────────────────────────────────
  keywords: [
    '정부지원사업 공고 요약',
    '공고뚝딱',
    '공고문 분석',
    '공고문 요약',
    'AI 공고 분석',
    'PDF 공고 분석',
    'HWP 공고문 요약',
    '보조금 공고 분석',
    '지원사업 공고 요약',
    '입찰 공고 분석',
    '공고문 핵심 추출',
    '공고문 엑셀 변환',
    '정부지원금 공고',
    '중소기업 지원사업',
    '공고문 자동 분석',
    'gonggo.link',
  ],

  // ─── 작성자·발행자 ────────────────────────────────
  authors: [{ name: '공고뚝딱', url: BASE_URL }],
  creator: '공고뚝딱',
  publisher: '공고뚝딱',

  // ─── Canonical & alternates ───────────────────────
  alternates: {
    canonical: BASE_URL,
    languages: { 'ko-KR': BASE_URL },
  },

  // ─── Robots ───────────────────────────────────────
  robots: {
    index: true,
    follow: true,
    nocache: false,
    googleBot: {
      index: true,
      follow: true,
      noimageindex: true,       // 이미지 없으니 생략 지시
      'max-video-preview': -1,
      'max-image-preview': 'none',
      'max-snippet': -1,
    },
  },

  // ─── 검색엔진 인증 ────────────────────────────────
  verification: {
    google: 'OTtCWeK17flWhWN4NBH9anMbcWcCxA_KBaNqQi-Ry9c',
  },
  other: {
    'naver-site-verification': 'c89dfc7f5f2b72562a6aa99311beee758015f0aa',
  },

  // ─── Open Graph (이미지 제외) ─────────────────────
  openGraph: {
    type: 'website',
    url: BASE_URL,
    siteName: '공고뚝딱',
    locale: 'ko_KR',
    title: '공고뚝딱 | AI 공고문 분석기',
    description:
      'PDF·HWP 공고문을 AI가 즉시 분석해 핵심 정보만 뽑아드립니다. 무료·무설치·서버 미저장.',
  },

  // ─── Twitter Card (이미지 제외) ───────────────────
  twitter: {
    card: 'summary',
    title: '공고뚝딱 | AI 공고문 분석기',
    description:
      'PDF·HWP 공고문을 AI가 즉시 분석해 핵심 정보만 뽑아드립니다.',
    site: '@gonggolink',      // 트위터 계정 있으면 수정, 없으면 제거
  },

  // ─── 앱 관련 ──────────────────────────────────────
  applicationName: '공고뚝딱',
  category: 'productivity',
  classification: 'Business/Productivity',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <head>
        {/* 카카오 공유용 */}
        <meta property="og:type" content="website" />
        <meta property="og:locale" content="ko_KR" />
      </head>
      <body className="bg-white text-apple-dark antialiased">
        {/* JSON-LD: WebSite 스키마 */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'WebSite',
              name: '공고뚝딱',
              alternateName: 'Gonggo.link',
              url: BASE_URL,
              description:
                'PDF·HWP 공고문을 AI가 즉시 분석해 핵심 정보를 추출하는 서비스',
              inLanguage: 'ko-KR',
              potentialAction: {
                '@type': 'SearchAction',
                target: {
                  '@type': 'EntryPoint',
                  urlTemplate: `${BASE_URL}/?q={search_term_string}`,
                },
                'query-input': 'required name=search_term_string',
              },
            }),
          }}
        />
        {/* JSON-LD: WebApplication 스키마 */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'WebApplication',
              name: '공고뚝딱',
              url: BASE_URL,
              applicationCategory: 'BusinessApplication',
              operatingSystem: 'Web',
              offers: {
                '@type': 'Offer',
                price: '0',
                priceCurrency: 'KRW',
              },
              description:
                'AI 기반 공고문 자동 분석 서비스. PDF·HWP 업로드 시 신청자격·지원금액·마감일을 즉시 추출.',
              featureList: [
                'PDF 공고문 분석',
                'HWP 공고문 분석',
                '핵심 정보 자동 추출',
                '엑셀 파일 저장',
                '서버 미저장 (보안)',
              ],
              inLanguage: 'ko-KR',
            }),
          }}
        />
        {/* JSON-LD: Organization 스키마 */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'Organization',
              name: '공고뚝딱',
              url: BASE_URL,
              sameAs: [],   // SNS 계정 생기면 추가
            }),
          }}
        />
        {children}
        <Script
          src="https://t1.daumcdn.net/kas/static/ba.min.js"
          strategy="afterInteractive"
        />
      </body>
    </html>
  );
}