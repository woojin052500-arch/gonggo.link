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
// AdFit Component (Kakao AdFit)
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
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current || !unit) return;

    // 기존 내용물 청소
    containerRef.current.innerHTML = '';

    // ins 태그 생성
    const ins = document.createElement('ins');
    ins.className = 'kakao_ad_area';
    ins.style.display = 'none'; // SDK가 로드되면 알아서 보여줌
    ins.setAttribute('data-ad-unit', unit);
    ins.setAttribute('data-ad-width', String(width));
    ins.setAttribute('data-ad-height', String(height));
    containerRef.current.appendChild(ins);

    // script 태그 생성
    const script = document.createElement('script');
    script.type = 'text/javascript';
    script.src = '//t1.daumcdn.net/kas/static/ba.min.js';
    script.async = true;
    containerRef.current.appendChild(script);
  }, [unit, width, height]);

  return (
    <div className="w-full my-4 text-center">
      {label && (
        <p className="text-xs text-center text-gray-300 mb-1">{label}</p>
      )}
      <div
        ref={containerRef}
        style={{ minHeight: height, display: 'flex', justifyContent: 'center', overflow: 'hidden' }}
      />
    </div>
  );
}

// ────────────────────────────────────────────────────────────
// UI Components (Skeleton, InfoCard, LoadingDots)
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

function InfoCard({
  emoji, label, value, highlight, delay,
}: {
  emoji: string; label: string; value: string; highlight?: boolean; delay?: number;
}) {
  return (
    <div
      className={`info-card animate-slide-up rounded-2xl p-5 border ${
        highlight ? 'bg-apple-blue-light border-blue-200' : 'bg-white border-gray-100 shadow-apple-sm'
      }`}
      style={{ animationDelay: `${delay ?? 0}ms`, animationFillMode: 'both' }}
    >
      <div className="flex items-start gap-3">
        <span className="text-2xl flex-shrink-0 mt-0.5">{emoji}</span>
        <div className="min-w-0">
          <p className="text-xs font-semibold text-apple-secondary uppercase tracking-wide mb-1">{label}</p>
          <p className={`text-sm font-medium leading-relaxed break-words ${highlight ? 'text-apple-blue' : 'text-apple-dark'}`}>
            {value || '정보 없음'}
          </p>
        </div>
      </div>
    </div>
  );
}

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
// Extractors & Excel Logic
// ────────────────────────────────────────────────────────────
async function extractTextFromPDF(file: File): Promise<string> {
  const pdfjsLib = await import('pdfjs-dist');
  pdfjsLib.GlobalWorkerOptions.workerSrc = window.location.origin + '/pdf.worker.min.js';
  const arrayBuffer = await file.arrayBuffer();
  const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
  const pdf = await loadingTask.promise;
  let fullText = '';
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    const pageText = textContent.items.map((item: any) => item.str).join(' ').replace(/\s+/g, ' ').trim();
    fullText += pageText + '\n';
  }
  return fullText;
}

async function extractTextFromHWP(file: File): Promise<string> {
  try {
    const JSZip = (await import('jszip')).default;
    const zip = await JSZip.loadAsync(await file.arrayBuffer());
    const sections: string[] = [];
    zip.forEach((relativePath: string) => {
      if (relativePath.startsWith('Contents/section') && relativePath.endsWith('.xml')) sections.push(relativePath);
    });
    let text = '';
    for (const path of sections.sort()) {
      const xmlContent = await zip.file(path)?.async('text');
      if (xmlContent) text += xmlContent.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ') + '\n';
    }
    return text;
  } catch { return '파일 파싱 오류'; }
}

function downloadExcel(result: AnalysisResult, fileName: string) {
  const wb = XLSX.utils.book_new();
  const summaryData = [
    ['본 리포트는 Gonggo.link에서 생성되었습니다'],
    [`원본 파일: ${fileName}`],
    [],
    ['공고명', result.공고명],
    ['주관기관', result.주관기관],
    ['지원금액', result.지원금액],
    ['마감일', result.마감일],
    ['핵심요약', result.핵심요약]
  ];
  const ws = XLSX.utils.aoa_to_sheet(summaryData);
  XLSX.utils.book_append_sheet(wb, ws, '공고 요약 리포트');
  const safeFileName = result.공고명?.slice(0, 20).replace(/[\\/:*?"<>|]/g, '') || '공고';
  XLSX.writeFile(wb, `[Gonggo.link]${safeFileName}_요약본.xlsx`);
}

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

  useEffect(() => {
    if (appState !== 'analyzing') return;
    const interval = setInterval(() => setMsgIdx((i) => (i + 1) % analyzingMessages.length), 1200);
    return () => clearInterval(interval);
  }, [appState]);

  useEffect(() => {
    if (appState !== 'analyzing') { setProgress(0); return; }
    const start = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - start;
      setProgress(Math.min(92, (elapsed / 5000) * 92));
    }, 50);
    return () => clearInterval(interval);
  }, [appState]);

  const processFile = useCallback(async (file: File) => {
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (!['pdf', 'hwp', 'hwpx'].includes(ext ?? '')) {
      setErrorMsg('지원하지 않는 형식입니다.');
      setAppState('error');
      return;
    }
    setFileName(file.name);
    setAppState('parsing');
    try {
      const text = ext === 'pdf' ? await extractTextFromPDF(file) : await extractTextFromHWP(file);
      setAppState('analyzing');
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, fileName: file.name }),
      });
      const data = await response.json();
      setProgress(100);
      setResult(data.result);
      setAppState('result');
    } catch {
      setErrorMsg('분석 오류 발생');
      setAppState('error');
    }
  }, []);

  const handleReset = () => {
    setAppState('idle');
    setResult(null);
    setFileName('');
    setErrorMsg('');
  };

  return (
    <main className="min-h-screen bg-white font-pretendard">
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
          <span className="text-xs text-apple-secondary bg-apple-bg px-3 py-1 rounded-full border border-gray-100">🔒 서버 미저장</span>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 pb-16">
        <div className="pt-12 pb-6 text-center">
          <h1 className="text-3xl sm:text-4xl font-black text-apple-dark tracking-tight leading-tight mb-3">
            공고문 한 장,<br /><span className="gradient-text">AI가 핵심만 정리</span>해 드립니다
          </h1>
        </div>

        {/* ── [광고 1] 상단 가로 배너 ── */}
        <AdFitSlot unit="DAN-JREtbHULIwEGUmJi" width={728} height={90} label="AD" />

        {appState === 'idle' && (
          <div className="animate-fade-in">
            <div
              className={`mt-6 rounded-3xl border-2 border-dashed transition-all p-14 text-center cursor-pointer ${isDragOver ? 'border-apple-blue bg-apple-blue-light' : 'border-gray-200 bg-apple-bg'}`}
              onDrop={(e) => { e.preventDefault(); setIsDragOver(false); processFile(e.dataTransfer.files[0]); }}
              onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
              onDragLeave={() => setIsDragOver(false)}
              onClick={() => fileInputRef.current?.click()}
            >
              <input ref={fileInputRef} type="file" className="hidden" onChange={(e) => processFile(e.target.files![0])} />
              <p className="text-lg font-bold text-apple-dark mb-1">파일을 드래그하거나 클릭하세요</p>
              <p className="text-sm text-apple-secondary">PDF · HWP · HWPX 지원</p>
            </div>
          </div>
        )}

        {appState === 'analyzing' && (
          <div className="mt-6">
            <div className="bg-white rounded-3xl p-6 shadow-apple-md border border-gray-100 mb-5">
              <div className="w-full bg-gray-100 rounded-full h-1.5 mb-3 overflow-hidden">
                <div className="h-full bg-apple-blue transition-all duration-100" style={{ width: `${progress}%` }} />
              </div>
              <LoadingDots />
              <p className="text-sm text-center text-apple-secondary mt-2">{analyzingMessages[msgIdx]}</p>
            </div>

            {/* ── [광고 2] 분석 중 배너 ── */}
            <AdFitSlot unit="DAN-AMQ595exIV6B8w0M" width={320} height={100} />

            <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[...Array(6)].map((_, i) => <SkeletonCard key={i} />)}
            </div>
          </div>
        )}

        {appState === 'result' && result && (
          <div className="mt-6">
            <div className="bg-gradient-to-br from-apple-blue to-[#00A3FF] rounded-3xl p-6 text-white mb-5 shadow-blue-glow">
              <h2 className="text-lg font-black leading-snug mb-2">{result.공고명}</h2>
              <p className="text-blue-100 text-sm leading-relaxed">{result.핵심요약}</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5">
              <InfoCard emoji="🏢" label="주관기관" value={result.주관기관} delay={100} />
              <InfoCard emoji="💰" label="지원금액" value={result.지원금액} highlight delay={150} />
              <InfoCard emoji="📅" label="마감일" value={result.마감일} highlight delay={200} />
              <InfoCard emoji="📞" label="문의처" value={result.문의처} delay={250} />
            </div>

            <div className="space-y-3 mb-5">
              <InfoCard emoji="✅" label="지원 자격" value={result.지원자격} delay={300} />
              <InfoCard emoji="📝" label="신청 방법" value={result.신청방법} delay={350} />
            </div>

            <button onClick={() => downloadExcel(result, fileName)} className="w-full bg-apple-blue text-white font-bold py-4 rounded-2xl shadow-blue-glow mb-6">
              엑셀 파일로 다운로드
            </button>

            {/* ── [광고 3] 결과 하단 사각형 배너 ── */}
            <AdFitSlot unit="DAN-LxOuhWq2WMb3o4n7" width={300} height={250} label="관련 정보" />

            <div className="text-center mt-5">
              <button onClick={handleReset} className="text-sm font-semibold text-apple-secondary border px-5 py-2.5 rounded-full">↩ 새 파일 분석하기</button>
            </div>
          </div>
        )}
      </div>

      <footer className="border-t border-gray-100 py-8 text-center">
        <p className="text-xs text-gray-400">© 2026 Gonggo.link by WJadlink</p>
      </footer>
    </main>
  );
}
