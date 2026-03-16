import type { Metadata } from 'next';
import Script from 'next/script';
import './globals.css';

export const metadata: Metadata = {
  title: 'Gonggo.link — 스마트 공고 분석기',
  description:
    'PDF/HWP 공고문을 업로드하면 AI가 즉시 핵심 정보를 추출하고 엑셀로 저장해 드립니다. 서버에 저장되지 않아 안전합니다.',
  keywords: ['공고 분석', '공고문 요약', 'AI 공고', '보조금 공고', '지원사업 분석'],
  verification: {
    google: 'OTtCWeK17flWhWN4NBH9anMbcWcCxA_KBaNqQi-Ry9c',
  },
  other: {
    'naver-site-verification': 'c89dfc7f5f2b72562a6aa99311beee758015f0aa',
  },
  openGraph: {
    title: 'Gonggo.link — 스마트 공고 분석기',
    description: 'AI로 공고문 핵심만 쏙 뽑아드립니다',
    type: 'website',
    url: 'https://gonggo.link',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body className="bg-white text-apple-dark antialiased">
        {children}
        <Script
          src="https://t1.daumcdn.net/kas/static/ba.min.js"
          strategy="afterInteractive"
        />
      </body>
    </html>
  );
}