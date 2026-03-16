
'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import * as XLSX from 'xlsx';

// ────────────────────────────────────────────────────────────
// Types
// ────────────────────────────────────────────────────────────
interface AnalysisResult {
  공고명: string;
  주관기관: string;
  지원금액: string;
  지원규모: string;
  마감일: string;
  공고일: string;
  지원자격: string;
  사업목적: string;
  신청방법: string;
  제출서류: string;
  문의처: string;
  기타사항: string;
  핵심요약: string;
}

type AppState = 'idle' | 'parsing' | 'analyzing' | 'result' | 'error';

// ────────────────────────────────────────────────────────────
// AdFit Component
// ────────────────────────────────────────────────────────────
function AdFitSlot({
  unit,
  width,
  height,
  label,
}: {
  unit: string;
  width: number;
  height: number;
  label?: string;
}) {
  const insRef = useRef<HTMLModElement>(null);
  const loaded = useRef(false);

  useEffect(() => {
    if (!unit || !insRef.current || loaded.current) return;
    loaded.current = true;

    const ins = insRef.current;

    const tryLoad = () => {
      const w = window as any;
      if (w.adfit) {
        w.adfit.load({ el: ins });
      }
    };

    // 이미 스크립트 로드 완료된 경우
    if ((window as any).adfit) {
      tryLoad();
      return;
    }

    // 아직 로드 중이면 최대 3초간 폴링
    let attempts = 0;
    const poll = setInterval(() => {
      attempts++;
      if ((window as any).adfit) {
        clearInterval(poll);
        tryLoad();
      } else if (attempts >= 30) {
        clearInterval(poll);
      }
    }, 100);

    return () => clearInterval(poll);
  }, [unit]);

  return (
    <div className="w-full my-2 flex flex-col items-center">
      {label && (
        <p className="text-xs text-center text-gray-300 mb-1">{label}</p>
      )}
      <ins
        ref={insRef}
        className="kakao_ad_area"
        style={{ display: 'block' }}
        data-ad-unit={unit}
        data-ad-width={String(width)}
        data-ad-height={String(height)}
      />
    </div>
  );
}

// ────────────────────────────────────────────────────────────
// Skeleton Card
// ────────────────────────────────────────────────────────────
function SkeletonCard() {
  return (
    <div className="bg-white rounded-2xl p-5 shadow-apple-sm border border-gray-100">
      <div className="skeleton h-4 w-1/3 rounded-full mb-3" />
      <div className="skeleton h-6 w-3/4 rounded-full mb-2" />
      <div className="skeleton h-4 w-1/2 rounded-full" />
    </div>
  );
}

// ────────────────────────────────────────────────────────────
// Info Card
// ────────────────────────────────────────────────────────────
function InfoCard({
  emoji,
  label,
  value,
  highlight,
  delay,
}: {
  emoji: string;
  label: string;
  value: string;
  highlight?: boolean;
  delay?: number;
}) {
  return (
    <div
      className={`info-card animate-slide-up rounded-2xl p-5 border ${
        highlight
          ? 'bg-apple-blue-light border-blue-200'
          : 'bg-white border-gray-100 shadow-apple-sm'
      }`}
      style={{ animationDelay: `${delay ?? 0}ms`, animationFillMode: 'both' }}
    >
      <div className="flex items-start gap-3">
        <span className="text-2xl flex-shrink-0 mt-0.5">{emoji}</span>
        <div className="min-w-0">
          <p className="text-xs font-semibold text-apple-secondary uppercase tracking-wide mb-1">
            {label}
          </p>
          <p
            className={`text-sm font-medium leading-relaxed break-words ${
              highlight ? 'text-apple-blue' : 'text-apple-dark'
            }`}
          >
            {value || '정보 없음'}
          </p>
        </div>
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────
// Loading Dots
// ────────────────────────────────────────────────────────────
function LoadingDots() {
  return (
    <div className="flex gap-1.5 items-center justify-center my-2">
      <div className="w-2 h-2 bg-apple-blue rounded-full dot-1" />
      <div className="w-2 h-2 bg-apple-blue rounded-full dot-2" />
      <div className="w-2 h-2 bg-apple-blue rounded-full dot-3" />
    </div>
  );
}

// ────────────────────────────────────────────────────────────
// PDF Text Extractor
// ────────────────────────────────────────────────────────────
async function extractTextFromPDF(file: File): Promise<string> {
  const pdfjsLib = await import('pdfjs-dist');
  pdfjsLib.GlobalWorkerOptions.workerSrc =
    window.location.origin + '/pdf.worker.min.js';

  const arrayBuffer = await file.arrayBuffer();
  const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
  const pdf = await loadingTask.promise;

  let fullText = '';
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    const pageText = textContent.items
      .map((item: any) => item.str)
      .join(' ')
      .replace(/\s+/g, ' ')
      .trim();
    fullText += pageText + '\n';
  }
  return fullText;
}

// ────────────────────────────────────────────────────────────
// HWP Text Extractor
// ────────────────────────────────────────────────────────────
async function extractTextFromHWP(file: File): Promise<string> {
  try {
    return await readHwpxAsText(file);
  } catch {
    return '파일 파싱 오류: HWP 형식을 읽을 수 없습니다.';
  }
}

async function readHwpxAsText(file: File): Promise<string> {
  try {
    const JSZip = (await import('jszip')).default;
    const zip = await JSZip.loadAsync(await file.arrayBuffer());
    const sections: string[] = [];
    zip.forEach((relativePath: string) => {
      if (
        relativePath.startsWith('Contents/section') &&
        relativePath.endsWith('.xml')
      ) {
        sections.push(relativePath);
      }
    });
    let text = '';
    for (const path of sections.sort()) {
      const xmlContent = await zip.file(path)?.async('text');
      if (xmlContent) {
        text +=
          xmlContent.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ') + '\n';
      }
    }
    return text;
  } catch {
    return '파일 파싱 오류: HWP 형식을 읽을 수 없습니다.';
  }
}

// ────────────────────────────────────────────────────────────
// Excel Download
// ────────────────────────────────────────────────────────────
function downloadExcel(result: AnalysisResult, fileName: string) {
  const wb = XLSX.utils.book_new();

  const summaryData = [
    ['본 리포트는 Gonggo.link(WJadlink)에서 생성되었습니다'],
    [`원본 파일: ${fileName}`],
    [`분석 일시: ${new Date().toLocaleString('ko-KR')}`],
    [],
    ['📋 항목', '내용'],
    ['공고명', result.공고명],
    ['주관기관', result.주관기관],
    ['핵심 요약', result.핵심요약],
    [],
    ['💰 지원 정보', ''],
    ['지원금액', result.지원금액],
    ['지원규모', result.지원규모],
    [],
    ['📅 일정 정보', ''],
    ['공고일', result.공고일],
    ['마감일', result.마감일],
    [],
    ['✅ 신청 정보', ''],
    ['지원자격', result.지원자격],
    ['신청방법', result.신청방법],
    ['제출서류', result.제출서류],
    [],
    ['📌 기타 정보', ''],
    ['사업목적', result.사업목적],
    ['문의처', result.문의처],
    ['기타사항', result.기타사항],
    [],
    ['──────────────────────────────────────────', ''],
    ['Powered by Gonggo.link | WJadlink', ''],
    ['https://gonggo.link', ''],
  ];

  const ws = XLSX.utils.aoa_to_sheet(summaryData);
  ws['!cols'] = [{ wch: 18 }, { wch: 80 }];
  ws['!merges'] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: 1 } },
    { s: { r: 1, c: 0 }, e: { r: 1, c: 1 } },
    { s: { r: 2, c: 0 }, e: { r: 2, c: 1 } },
  ];
  XLSX.utils.book_append_sheet(wb, ws, '공고 요약 리포트');

  const fields = Object.entries(result).map(([key, value]) => [key, value]);
  const rawWs = XLSX.utils.aoa_to_sheet([
    ['필드', '내용'],
    ...fields,
    [],
    ['Generated by Gonggo.link', new Date().toISOString()],
  ]);
  rawWs['!cols'] = [{ wch: 16 }, { wch: 100 }];
  XLSX.utils.book_append_sheet(wb, rawWs, '원본 데이터');

  const safeFileName =
    result.공고명?.slice(0, 20).replace(/[\\/:*?"<>|]/g, '') || '공고';
  XLSX.writeFile(wb, `[Gonggo.link]${safeFileName}_요약본.xlsx`);
}

// ────────────────────────────────────────────────────────────
// Analyzing Messages
// ────────────────────────────────────────────────────────────
const analyzingMessages = [
  'AI가 문서의 맥락을 분석 중입니다...',
  '핵심 지원 정보를 추출하고 있습니다...',
  '공고 일정과 마감일을 확인하고 있습니다...',
  '지원 자격 조건을 정리하고 있습니다...',
  '최종 리포트를 생성하고 있습니다...',
];

// ────────────────────────────────────────────────────────────
// Main Page Component
// ────────────────────────────────────────────────────────────
export default function GonggoPage() {
  const [appState, setAppState] = useState<AppState>('idle');
  const [isDragOver, setIsDragOver] = useState(false);
  const [fileName, setFileName] = useState('');
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [progress, setProgress] = useState(0);
  const [msgIdx, setMsgIdx] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const analyzeStartTime = useRef<number>(0);

  useEffect(() => {
    if (appState !== 'analyzing') return;
    const interval = setInterval(() => {
      setMsgIdx((i) => (i + 1) % analyzingMessages.length);
    }, 1200);
    return () => clearInterval(interval);
  }, [appState]);

  useEffect(() => {
    if (appState !== 'analyzing') {
      setProgress(0);
      return;
    }
    setProgress(0);
    const start = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - start;
      const p = Math.min(92, (elapsed / 5000) * 92);
      setProgress(p);
    }, 50);
    return () => clearInterval(interval);
  }, [appState]);

  const processFile = useCallback(async (file: File) => {
    const name = file.name;
    const ext = name.split('.').pop()?.toLowerCase();
    if (!['pdf', 'hwp', 'hwpx'].includes(ext ?? '')) {
      setErrorMsg('PDF 또는 HWP 파일만 지원합니다.');
      setAppState('error');
      return;
    }

    setFileName(name);
    setAppState('parsing');

    try {
      let text = '';
      if (ext === 'pdf') {
        text = await extractTextFromPDF(file);
      } else {
        text = await extractTextFromHWP(file);
      }

      if (!text || text.trim().length < 30) {
        throw new Error(
          '문서에서 텍스트를 추출할 수 없습니다. 스캔된 이미지 PDF는 지원하지 않습니다.'
        );
      }

      analyzeStartTime.current = Date.now();
      setAppState('analyzing');
      setMsgIdx(0);

      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, fileName: name }),
      });

      const data = await response.json();
      if (!response.ok || data.error) {
        throw new Error(data.error || '분석 중 오류가 발생했습니다.');
      }

      const elapsed = Date.now() - analyzeStartTime.current;
      const remaining = Math.max(0, 5000 - elapsed);
      if (remaining > 0) await new Promise((r) => setTimeout(r, remaining));

      setProgress(100);
      await new Promise((r) => setTimeout(r, 300));

      setResult({ ...data.result, 분석일시: new Date().toLocaleString('ko-KR') });
      setAppState('result');
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.';
      setErrorMsg(msg);
      setAppState('error');
    }
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
      const file = e.dataTransfer.files[0];
      if (file) processFile(file);
    },
    [processFile]
  );

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) processFile(file);
      e.target.value = '';
    },
    [processFile]
  );

  const handleReset = () => {
    setAppState('idle');
    setResult(null);
    setFileName('');
    setErrorMsg('');
    setProgress(0);
    setMsgIdx(0);
  };

  return (
    <main className="min-h-screen bg-white font-pretendard">
      {/* ── Header ─────────────────────────────────────── */}
      <header className="w-full border-b border-gray-100 bg-white/90 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-apple-blue rounded-lg flex items-center justify-center shadow-blue-glow">
              <span className="text-white text-xs font-black">G</span>
            </div>
            <span className="text-base font-bold text-apple-dark tracking-tight">
              Gonggo<span className="text-apple-blue">.link</span>
            </span>
          </div>
          <span className="text-xs text-apple-secondary bg-apple-bg px-3 py-1 rounded-full border border-gray-100">
            🔒 서버 미저장 · 안전
          </span>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 pb-16">
        {/* ── Hero ──────────────────────────────────────── */}
        <div className="pt-12 pb-6 text-center">
          <h1 className="text-3xl sm:text-4xl font-black text-apple-dark tracking-tight leading-tight mb-3">
            공고문 한 장,<br />
            <span className="gradient-text">AI가 핵심만 정리</span>해 드립니다
          </h1>
          <p className="text-apple-secondary text-sm sm:text-base max-w-lg mx-auto leading-relaxed">
            PDF 또는 HWP 파일을 올리면 AI가 즉시 분석하여
            지원금액, 마감일, 자격 조건을 한눈에 보여드립니다
          </p>
        </div>

        {/* ── 광고 A: 상단 배너 (728x90) ──────────────── */}
        <AdFitSlot
          unit="DAN-JREtbHULIwEGUmJi"
          width={728}
          height={90}
          label="광고"
        />

        {/* ── IDLE ─────────────────────────────────────── */}
        {appState === 'idle' && (
          <div className="animate-fade-in">
            <div
              className={`relative mt-6 rounded-3xl border-2 border-dashed transition-all duration-200 cursor-pointer
                ${
                  isDragOver
                    ? 'border-apple-blue bg-apple-blue-light scale-[1.01]'
                    : 'border-gray-200 bg-apple-bg hover:border-apple-blue hover:bg-apple-blue-light'
                }`}
              onDrop={handleDrop}
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragOver(true);
              }}
              onDragLeave={() => setIsDragOver(false)}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.hwp,.hwpx"
                className="hidden"
                onChange={handleFileChange}
              />
              <div className="flex flex-col items-center justify-center py-14 px-6 text-center">
                <div className="animate-float mb-5">
                  <div className="w-20 h-20 bg-white rounded-2xl shadow-apple-md flex items-center justify-center">
                    <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
                      <rect width="40" height="40" rx="10" fill="#E8F2FF" />
                      <path
                        d="M12 8h11l9 9v15a2 2 0 01-2 2H12a2 2 0 01-2-2V10a2 2 0 012-2z"
                        fill="#0071E3"
                        opacity="0.15"
                      />
                      <path
                        d="M23 8l9 9h-7a2 2 0 01-2-2V8z"
                        fill="#0071E3"
                        opacity="0.4"
                      />
                      <rect x="14" y="20" width="12" height="2" rx="1" fill="#0071E3" />
                      <rect x="14" y="25" width="8" height="2" rx="1" fill="#0071E3" opacity="0.6" />
                    </svg>
                  </div>
                </div>
                <h2 className="text-lg font-bold text-apple-dark mb-1">
                  {isDragOver
                    ? '여기에 놓아주세요 ✨'
                    : '파일을 드래그하거나 클릭하세요'}
                </h2>
                <p className="text-sm text-apple-secondary mb-5">
                  PDF · HWP · HWPX 지원
                </p>
                <button
                  className="bg-apple-blue text-white text-sm font-semibold px-6 py-2.5 rounded-full
                    hover:bg-apple-blue-dark transition-colors shadow-blue-glow btn-pulse"
                  onClick={(e) => {
                    e.stopPropagation();
                    fileInputRef.current?.click();
                  }}
                >
                  파일 선택하기
                </button>
                <div className="mt-6 flex items-center gap-1.5 text-xs text-apple-secondary">
                  <span>🔒</span>
                  <span>
                    파일은 브라우저에서만 처리되며 서버에 저장되지 않아 안전합니다
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-5 flex flex-wrap gap-2 justify-center">
              {[
                { emoji: '⚡', text: '즉시 분석' },
                { emoji: '🤖', text: 'AI 핵심 추출' },
                { emoji: '📊', text: '엑셀 다운로드' },
                { emoji: '🔒', text: '개인정보 보호' },
              ].map((item) => (
                <span
                  key={item.text}
                  className="text-xs font-medium text-apple-secondary bg-apple-bg px-3 py-1.5 rounded-full border border-gray-100"
                >
                  {item.emoji} {item.text}
                </span>
              ))}
            </div>

            {/* ── 광고 B: idle 하단 (300x250) ──────────── */}
            <div className="mt-8">
              <AdFitSlot
                unit="DAN-LxOuhWq2WMb3o4n7"
                width={300}
                height={250}
                label="광고"
              />
            </div>
          </div>
        )}

        {/* ── PARSING ──────────────────────────────────── */}
        {appState === 'parsing' && (
          <div className="animate-fade-in mt-6 rounded-3xl bg-apple-bg p-8 text-center">
            <div className="w-12 h-12 border-3 border-apple-blue border-t-transparent rounded-full animate-spin-slow mx-auto mb-4" />
            <p className="font-semibold text-apple-dark">파일 읽는 중...</p>
            <p className="text-sm text-apple-secondary mt-1">{fileName}</p>
          </div>
        )}

        {/* ── ANALYZING ────────────────────────────────── */}
        {appState === 'analyzing' && (
          <div className="animate-fade-in mt-6">
            <div className="bg-white rounded-3xl p-6 shadow-apple-md border border-gray-100 mb-5">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-apple-blue-light rounded-xl flex items-center justify-center flex-shrink-0">
                  <svg
                    className="animate-spin-slow"
                    width="20"
                    height="20"
                    viewBox="0 0 20 20"
                    fill="none"
                  >
                    <path
                      d="M10 2a8 8 0 100 16A8 8 0 0010 2z"
                      stroke="#0071E3"
                      strokeWidth="1.5"
                      strokeDasharray="4 2"
                    />
                    <path
                      d="M10 6v4l3 3"
                      stroke="#0071E3"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                    />
                  </svg>
                </div>
                <div>
                  <p className="font-bold text-apple-dark text-sm">AI 분석 중</p>
                  <p className="text-xs text-apple-secondary truncate max-w-xs">
                    {fileName}
                  </p>
                </div>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-1.5 mb-3 overflow-hidden">
                <div
                  className="h-full bg-apple-blue rounded-full transition-all duration-100 ease-out"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <LoadingDots />
              <p className="text-sm text-center text-apple-secondary mt-2 min-h-[20px]">
                {analyzingMessages[msgIdx]}
              </p>
            </div>

            {/* ── 광고 C: 분석 중 중간 (320x100) ─────────── */}
            <AdFitSlot
              unit="DAN-AMQ595exIV6B8w0M"
              width={320}
              height={100}
              label="분석 완료 후 결과를 확인하세요"
            />

            <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[...Array(6)].map((_, i) => (
                <SkeletonCard key={i} />
              ))}
            </div>
          </div>
        )}

        {/* ── RESULT ───────────────────────────────────── */}
        {appState === 'result' && result && (
          <div className="mt-6">
            <div
              className="animate-slide-up bg-gradient-to-br from-apple-blue to-[#00A3FF] rounded-3xl p-6 text-white mb-5 shadow-blue-glow"
              style={{ animationDelay: '0ms' }}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="text-blue-100 text-xs font-semibold uppercase tracking-widest mb-2">
                    AI 분석 완료 ✓
                  </div>
                  <h2 className="text-lg font-black leading-snug mb-2 text-white">
                    {result.공고명 || '공고 분석 결과'}
                  </h2>
                  {result.핵심요약 && (
                    <p className="text-blue-100 text-sm leading-relaxed">
                      {result.핵심요약}
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5">
              <InfoCard emoji="🏢" label="주관기관" value={result.주관기관} delay={100} />
              <InfoCard emoji="💰" label="지원금액" value={result.지원금액} highlight delay={150} />
              <InfoCard emoji="👥" label="지원규모" value={result.지원규모} delay={200} />
              <InfoCard emoji="📅" label="마감일" value={result.마감일} highlight delay={250} />
              <InfoCard emoji="📣" label="공고일" value={result.공고일} delay={300} />
              <InfoCard emoji="📞" label="문의처" value={result.문의처} delay={350} />
            </div>

            <div className="space-y-3 mb-5">
              <InfoCard emoji="✅" label="지원 자격" value={result.지원자격} delay={400} />
              <InfoCard emoji="🎯" label="사업 목적" value={result.사업목적} delay={450} />
              <InfoCard emoji="📝" label="신청 방법" value={result.신청방법} delay={500} />
              <InfoCard emoji="📎" label="제출 서류" value={result.제출서류} delay={550} />
              {result.기타사항 && result.기타사항 !== '정보 없음' && (
                <InfoCard emoji="ℹ️" label="기타 사항" value={result.기타사항} delay={600} />
              )}
            </div>

            {/* ── 광고 D: 결과 중간 (300x250) ────────────── */}
            <AdFitSlot
              unit="DAN-LxOuhWq2WMb3o4n7"
              width={300}
              height={250}
              label="관련 지원사업 정보"
            />

            <div
              className="animate-slide-up bg-white rounded-2xl p-5 shadow-apple-md border border-gray-100 mb-5 mt-5"
              style={{ animationDelay: '650ms', animationFillMode: 'both' }}
            >
              <p className="text-xs font-semibold text-apple-secondary uppercase tracking-wide mb-3 text-center">
                분석 결과 저장
              </p>
              <button
                onClick={() => result && downloadExcel(result, fileName)}
                className="w-full bg-apple-blue text-white font-bold py-4 rounded-2xl
                  hover:bg-apple-blue-dark active:scale-[0.98] transition-all
                  flex items-center justify-center gap-2 shadow-blue-glow btn-pulse text-base"
              >
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <path
                    d="M10 3v10M6 9l4 4 4-4"
                    stroke="white"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path d="M3 15h14" stroke="white" strokeWidth="1.8" strokeLinecap="round" />
                </svg>
                엑셀 파일로 다운로드
              </button>
              <p className="text-center text-xs text-gray-400 mt-2">
                📁 [Gonggo.link]공고_요약본.xlsx
              </p>
            </div>

            {/* ── 광고 E: 결과 최하단 (320x100) ──────────── */}
            <AdFitSlot
              unit="DAN-AMQ595exIV6B8w0M"
              width={320}
              height={100}
              label="광고"
            />

            <div
              className="animate-slide-up text-center mt-5"
              style={{ animationDelay: '700ms', animationFillMode: 'both' }}
            >
              <button
                onClick={handleReset}
                className="text-sm font-semibold text-apple-secondary hover:text-apple-blue
                  border border-gray-200 hover:border-apple-blue px-5 py-2.5 rounded-full transition-all"
              >
                ↩ 새 파일 분석하기
              </button>
            </div>
          </div>
        )}

        {/* ── ERROR ────────────────────────────────────── */}
        {appState === 'error' && (
          <div className="animate-slide-up mt-6 rounded-3xl bg-red-50 border border-red-100 p-8 text-center">
            <div className="text-4xl mb-3">😢</div>
            <h3 className="font-bold text-red-700 mb-2">분석에 실패했습니다</h3>
            <p className="text-sm text-red-500 mb-5 max-w-sm mx-auto">{errorMsg}</p>
            <button
              onClick={handleReset}
              className="bg-apple-dark text-white text-sm font-semibold px-6 py-2.5 rounded-full hover:opacity-80 transition-opacity"
            >
              다시 시도하기
            </button>
          </div>
        )}
      </div>

      {/* ── Footer ──────────────────────────────────────── */}
      <footer className="border-t border-gray-100 py-8 text-center">
        <p className="text-xs text-gray-400">
          © 2024{' '}
          <span className="font-semibold text-apple-secondary">Gonggo.link</span>
          {' '}by WJadlink · 파일은 서버에 저장되지 않습니다
        </p>
        <p className="text-xs text-gray-300 mt-1">
          Powered by Claude AI · Made with ❤️
        </p>
      </footer>
    </main>
  );
}