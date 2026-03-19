'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileText,
  Zap,
  Download,
  Shield,
  ChevronRight,
  Sparkles,
  Building2,
  BadgeCheck,
  Calendar,
  Phone,
  Target,
  ClipboardList,
  Paperclip,
  Info,
  Users,
  Banknote,
  RotateCcw,
  Coffee,
} from 'lucide-react';
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
// AdFit Component (unchanged)
// ────────────────────────────────────────────────────────────
function AdFitSlot({ unit, width, height, label }: { unit: string; width: number; height: number; label?: string }) {
  const insRef = useRef<HTMLModElement>(null);
  const loaded = useRef(false);

  useEffect(() => {
    if (!unit || !insRef.current || loaded.current) return;
    const ins = insRef.current;
    const tryLoad = () => {
      const w = window as any;
      if (w.adfit && !loaded.current) { loaded.current = true; w.adfit.load({ el: ins }); return true; }
      return false;
    };
    if (tryLoad()) return;
    let attempts = 0;
    const poll = setInterval(() => { attempts++; if (tryLoad() || attempts >= 100) clearInterval(poll); }, 100);
    const script = document.querySelector('script[src*="t1.daumcdn.net"]') as HTMLScriptElement | null;
    if (script) script.addEventListener('load', () => { clearInterval(poll); tryLoad(); }, { once: true });
    return () => clearInterval(poll);
  }, [unit]);

  return (
    <div className="w-full my-2 flex flex-col items-center">
      {label && <p className="text-xs text-center text-gray-400 mb-1">{label}</p>}
      <ins ref={insRef} className="kakao_ad_area" style={{ display: 'block' }}
        data-ad-unit={unit} data-ad-width={String(width)} data-ad-height={String(height)} />
    </div>
  );
}

// ────────────────────────────────────────────────────────────
// PDF Text Extractor (unchanged)
// ────────────────────────────────────────────────────────────
async function extractTextFromPDF(file: File): Promise<string> {
  const pdfjsLib = await import('pdfjs-dist');
  pdfjsLib.GlobalWorkerOptions.workerSrc = window.location.origin + '/pdf.worker.min.js';
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await (await pdfjsLib.getDocument({ data: arrayBuffer }).promise);
  let fullText = '';
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    fullText += textContent.items.map((item: any) => item.str).join(' ').replace(/\s+/g, ' ').trim() + '\n';
  }
  return fullText;
}

// ────────────────────────────────────────────────────────────
// HWP Text Extractor (unchanged)
// ────────────────────────────────────────────────────────────
async function extractTextFromHWP(file: File): Promise<string> {
  try { return await readHwpxAsText(file); }
  catch { return '파일 파싱 오류: HWP 형식을 읽을 수 없습니다.'; }
}

async function readHwpxAsText(file: File): Promise<string> {
  try {
    const JSZip = (await import('jszip')).default;
    const zip = await JSZip.loadAsync(await file.arrayBuffer());
    const sections: string[] = [];
    zip.forEach((relativePath: string) => {
      if (relativePath.startsWith('Contents/section') && relativePath.endsWith('.xml'))
        sections.push(relativePath);
    });
    let text = '';
    for (const path of sections.sort()) {
      const xmlContent = await zip.file(path)?.async('text');
      if (xmlContent) text += xmlContent.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ') + '\n';
    }
    return text;
  } catch { return '파일 파싱 오류: HWP 형식을 읽을 수 없습니다.'; }
}

// ────────────────────────────────────────────────────────────
// Excel Download (unchanged)
// ────────────────────────────────────────────────────────────
function downloadExcel(result: AnalysisResult, fileName: string) {
  const wb = XLSX.utils.book_new();
  const summaryData = [
    ['본 리포트는 Gonggo.link(WJadlink)에서 생성되었습니다'],
    [`원본 파일: ${fileName}`],
    [`분석 일시: ${new Date().toLocaleString('ko-KR')}`],
    [],
    ['📋 항목', '내용'],
    ['공고명', result.공고명], ['주관기관', result.주관기관], ['핵심 요약', result.핵심요약], [],
    ['💰 지원 정보', ''], ['지원금액', result.지원금액], ['지원규모', result.지원규모], [],
    ['📅 일정 정보', ''], ['공고일', result.공고일], ['마감일', result.마감일], [],
    ['✅ 신청 정보', ''], ['지원자격', result.지원자격], ['신청방법', result.신청방법], ['제출서류', result.제출서류], [],
    ['📌 기타 정보', ''], ['사업목적', result.사업목적], ['문의처', result.문의처], ['기타사항', result.기타사항], [],
    ['──────────────────────────────────────────', ''],
    ['Powered by Gonggo.link | WJadlink', ''], ['https://gonggo.link', ''],
  ];
  const ws = XLSX.utils.aoa_to_sheet(summaryData);
  ws['!cols'] = [{ wch: 18 }, { wch: 80 }];
  ws['!merges'] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 1 } }, { s: { r: 1, c: 0 }, e: { r: 1, c: 1 } }, { s: { r: 2, c: 0 }, e: { r: 2, c: 1 } }];
  XLSX.utils.book_append_sheet(wb, ws, '공고 요약 리포트');
  const fields = Object.entries(result).map(([key, value]) => [key, value]);
  const rawWs = XLSX.utils.aoa_to_sheet([['필드', '내용'], ...fields, [], ['Generated by Gonggo.link', new Date().toISOString()]]);
  rawWs['!cols'] = [{ wch: 16 }, { wch: 100 }];
  XLSX.utils.book_append_sheet(wb, rawWs, '원본 데이터');
  const safeFileName = result.공고명?.slice(0, 20).replace(/[\\/:*?"<>|]/g, '') || '공고';
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
// Design Tokens & Variants
// ────────────────────────────────────────────────────────────
const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i = 0) => ({ opacity: 1, y: 0, transition: { duration: 0.45, delay: i * 0.07, ease: [0.22, 1, 0.36, 1] } }),
};

const scaleIn = {
  hidden: { opacity: 0, scale: 0.94 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] } },
};

// ────────────────────────────────────────────────────────────
// Result Card Component
// ────────────────────────────────────────────────────────────
function ResultCard({
  icon: Icon,
  label,
  value,
  accent = false,
  index = 0,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  accent?: boolean;
  index?: number;
}) {
  return (
    <motion.div
      variants={fadeUp}
      custom={index}
      initial="hidden"
      animate="visible"
      className={`rounded-2xl p-4 border ${
        accent
          ? 'bg-indigo-50 border-indigo-100'
          : 'bg-white border-gray-100 shadow-[0_2px_12px_rgba(0,0,0,0.06)]'
      }`}
    >
      <div className="flex items-start gap-3">
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${accent ? 'bg-indigo-100' : 'bg-gray-50'}`}>
          <Icon size={17} className={accent ? 'text-indigo-600' : 'text-gray-500'} />
        </div>
        <div className="min-w-0 flex-1 pt-0.5">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">{label}</p>
          <p className={`text-sm font-semibold leading-relaxed break-words ${accent ? 'text-indigo-700' : 'text-gray-800'}`}>
            {value || '정보 없음'}
          </p>
        </div>
      </div>
    </motion.div>
  );
}

// ────────────────────────────────────────────────────────────
// Upload Pulse Animation (CSS-based Lottie feel)
// ────────────────────────────────────────────────────────────
function UploadOrb({ active }: { active: boolean }) {
  return (
    <div className="relative flex items-center justify-center w-28 h-28 mx-auto">
      {/* Pulse rings */}
      {active && (
        <>
          <div className="absolute inset-0 rounded-full bg-indigo-500/10 animate-ping" style={{ animationDuration: '1.2s' }} />
          <div className="absolute inset-2 rounded-full bg-indigo-500/10 animate-ping" style={{ animationDuration: '1.6s', animationDelay: '0.2s' }} />
        </>
      )}
      <div className={`relative w-24 h-24 rounded-3xl flex items-center justify-center transition-all duration-300 ${active ? 'bg-indigo-600 shadow-[0_0_40px_rgba(99,102,241,0.5)]' : 'bg-indigo-50 border-2 border-dashed border-indigo-200'}`}>
        <motion.div
          animate={active ? { y: [0, -4, 0] } : { y: 0 }}
          transition={{ repeat: Infinity, duration: 1.4, ease: 'easeInOut' }}
        >
          <FileText size={38} className={active ? 'text-white' : 'text-indigo-400'} strokeWidth={1.5} />
        </motion.div>
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────
// Loading Spinner
// ────────────────────────────────────────────────────────────
function SpinnerRing() {
  return (
    <div className="w-12 h-12 mx-auto">
      <svg viewBox="0 0 48 48" className="animate-spin" style={{ animationDuration: '0.9s' }}>
        <circle cx="24" cy="24" r="20" fill="none" stroke="#e0e7ff" strokeWidth="4" />
        <path d="M24 4 A20 20 0 0 1 44 24" fill="none" stroke="#4f46e5" strokeWidth="4" strokeLinecap="round" />
      </svg>
    </div>
  );
}

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
    const interval = setInterval(() => setMsgIdx((i) => (i + 1) % analyzingMessages.length), 1200);
    return () => clearInterval(interval);
  }, [appState]);

  useEffect(() => {
    if (appState !== 'analyzing') { setProgress(0); return; }
    setProgress(0);
    const start = Date.now();
    const interval = setInterval(() => {
      const p = Math.min(92, ((Date.now() - start) / 5000) * 92);
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
      let text = ext === 'pdf' ? await extractTextFromPDF(file) : await extractTextFromHWP(file);
      if (!text || text.trim().length < 30)
        throw new Error('문서에서 텍스트를 추출할 수 없습니다. 스캔된 이미지 PDF는 지원하지 않습니다.');
      analyzeStartTime.current = Date.now();
      setAppState('analyzing');
      setMsgIdx(0);
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, fileName: name }),
      });
      const data = await response.json();
      if (!response.ok || data.error) throw new Error(data.error || '분석 중 오류가 발생했습니다.');
      const remaining = Math.max(0, 5000 - (Date.now() - analyzeStartTime.current));
      if (remaining > 0) await new Promise((r) => setTimeout(r, remaining));
      setProgress(100);
      await new Promise((r) => setTimeout(r, 300));
      setResult({ ...data.result, 분석일시: new Date().toLocaleString('ko-KR') });
      setAppState('result');
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.');
      setAppState('error');
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  }, [processFile]);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
    e.target.value = '';
  }, [processFile]);

  const handleReset = () => {
    setAppState('idle');
    setResult(null);
    setFileName('');
    setErrorMsg('');
    setProgress(0);
    setMsgIdx(0);
  };

  return (
    <>
      <style>{`
        @import url('https://cdn.jsdelivr.net/gh/orioncactus/pretendard/dist/web/static/pretendard.css');
        * { font-family: 'Pretendard', -apple-system, sans-serif; }
        body { background: #F4F5FA; }

        .noise-bg {
          position: fixed; inset: 0; z-index: -1;
          background: linear-gradient(135deg, #EEF2FF 0%, #F4F5FA 50%, #E8F0FE 100%);
        }
        .noise-bg::after {
          content: '';
          position: absolute; inset: 0;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.03'/%3E%3C/svg%3E");
          opacity: 0.4;
        }

        .glass-card {
          background: rgba(255,255,255,0.85);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border: 1px solid rgba(255,255,255,0.6);
          box-shadow: 0 4px 24px rgba(79,70,229,0.08), 0 1px 2px rgba(0,0,0,0.04);
        }

        .hero-gradient {
          background: linear-gradient(135deg, #4f46e5 0%, #6366f1 50%, #818cf8 100%);
        }

        .upload-zone {
          background: white;
          border: 2px dashed #c7d2fe;
          transition: all 0.25s cubic-bezier(0.22,1,0.36,1);
          box-shadow: 0 2px 16px rgba(99,102,241,0.06);
        }
        .upload-zone:hover, .upload-zone.active {
          border-color: #6366f1;
          background: #EEF2FF;
          box-shadow: 0 8px 32px rgba(99,102,241,0.15);
          transform: translateY(-2px);
        }

        .btn-primary {
          background: linear-gradient(135deg, #4f46e5, #6366f1);
          box-shadow: 0 4px 16px rgba(99,102,241,0.4);
          transition: all 0.2s ease;
        }
        .btn-primary:hover {
          transform: translateY(-1px);
          box-shadow: 0 8px 24px rgba(99,102,241,0.5);
        }
        .btn-primary:active { transform: translateY(0); }

        .btn-monster {
          background: linear-gradient(135deg, #10b981, #059669);
          box-shadow: 0 4px 16px rgba(16,185,129,0.35);
          transition: all 0.2s ease;
        }
        .btn-monster:hover {
          transform: translateY(-1px);
          box-shadow: 0 8px 24px rgba(16,185,129,0.45);
        }

        .progress-bar {
          background: linear-gradient(90deg, #6366f1, #818cf8, #c7d2fe);
          background-size: 200% 100%;
          animation: shimmer 1.5s infinite linear;
        }
        @keyframes shimmer {
          0% { background-position: 100% 0; }
          100% { background-position: -100% 0; }
        }

        .skeleton {
          background: linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 50%, #f1f5f9 75%);
          background-size: 200% 100%;
          animation: skeleton-shimmer 1.5s infinite;
          border-radius: 10px;
        }
        @keyframes skeleton-shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }

        .tag-pill {
          background: rgba(99,102,241,0.08);
          color: #4f46e5;
          border: 1px solid rgba(99,102,241,0.15);
        }
      `}</style>

      <div className="noise-bg" />

      {/* ── Header ─────────────────────────────────────── */}
      <header className="glass-card sticky top-0 z-50">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="hero-gradient w-8 h-8 rounded-xl flex items-center justify-center shadow-md">
              <Sparkles size={14} className="text-white" />
            </div>
            <div>
              <span className="text-sm font-black text-gray-900 tracking-tight">Gonggo</span>
              <span className="text-sm font-black" style={{ color: '#4f46e5' }}>.link</span>
            </div>
          </div>
          <div className="flex items-center gap-1.5 bg-green-50 border border-green-100 px-2.5 py-1 rounded-full">
            <Shield size={10} className="text-green-600" />
            <span className="text-[10px] font-bold text-green-700">서버 미저장 · 안전</span>
          </div>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 pb-32">

        {/* ── Hero ──────────────────────────────────────── */}
        <motion.div
          className="pt-10 pb-6 text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="inline-flex items-center gap-1.5 tag-pill text-xs font-semibold px-3 py-1 rounded-full mb-4">
            <Zap size={11} /> AI 공고문 분석기
          </div>
          <h1 className="text-[28px] sm:text-3xl font-black text-gray-900 leading-tight mb-3 tracking-tight">
            공고문 노가다는 끝.<br />
            <span style={{ backgroundImage: 'linear-gradient(135deg, #4f46e5, #818cf8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
              클릭 한 번으로 요약하세요.
            </span>
          </h1>
          <p className="text-sm text-gray-500 leading-relaxed max-w-xs mx-auto">
            PDF·HWP 파일을 올리면 AI가 지원금액, 마감일,<br />자격 조건을 즉시 정리해 드립니다
          </p>
        </motion.div>

        {/* ── Ad: Top Banner ──────────────────────────── */}
        <AdFitSlot unit="DAN-JREtbHULIwEGUmJi" width={728} height={90} label="광고" />

        <AnimatePresence mode="wait">

          {/* ── IDLE ────────────────────────────────────── */}
          {appState === 'idle' && (
            <motion.div key="idle" variants={scaleIn} initial="hidden" animate="visible" exit={{ opacity: 0, scale: 0.96 }}>
              {/* Upload Zone */}
              <div
                className={`upload-zone rounded-3xl cursor-pointer mt-2 ${isDragOver ? 'active' : ''}`}
                onDrop={handleDrop}
                onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
                onDragLeave={() => setIsDragOver(false)}
                onClick={() => fileInputRef.current?.click()}
              >
                <input ref={fileInputRef} type="file" accept=".pdf,.hwp,.hwpx" className="hidden" onChange={handleFileChange} />
                <div className="flex flex-col items-center py-10 px-6">
                  <UploadOrb active={isDragOver} />
                  <h2 className="text-base font-bold text-gray-800 mt-5 mb-1">
                    {isDragOver ? '파일을 놓아주세요 ✨' : '파일 드래그 또는 클릭'}
                  </h2>
                  <p className="text-xs text-gray-400 mb-5">PDF · HWP · HWPX 지원</p>
                  <button
                    className="btn-primary text-white text-sm font-bold px-7 py-3 rounded-2xl flex items-center gap-2"
                    onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}
                  >
                    <FileText size={15} />
                    파일 선택하기
                    <ChevronRight size={14} />
                  </button>
                  <p className="text-[11px] text-gray-400 mt-4 flex items-center gap-1">
                    <Shield size={10} /> 파일은 브라우저에서만 처리됩니다
                  </p>
                </div>
              </div>

              {/* Feature Pills */}
              <div className="mt-4 flex flex-wrap gap-2 justify-center">
                {[
                  { icon: Zap, text: '즉시 분석' },
                  { icon: Sparkles, text: 'AI 핵심 추출' },
                  { icon: Download, text: '엑셀 다운로드' },
                  { icon: Shield, text: '개인정보 보호' },
                ].map(({ icon: Icon, text }) => (
                  <span key={text} className="tag-pill text-xs font-semibold px-3 py-1.5 rounded-full flex items-center gap-1.5">
                    <Icon size={11} /> {text}
                  </span>
                ))}
              </div>

              {/* How it Works */}
              <motion.div className="glass-card rounded-3xl p-5 mt-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4 text-center">사용 방법</p>
                <div className="space-y-3">
                  {[
                    { step: '01', text: 'PDF 또는 HWP 공고 파일 업로드' },
                    { step: '02', text: 'AI가 핵심 내용 자동 분석 (약 5초)' },
                    { step: '03', text: '요약 카드 확인 후 엑셀로 저장' },
                  ].map(({ step, text }) => (
                    <div key={step} className="flex items-center gap-3">
                      <span className="w-8 h-8 rounded-xl hero-gradient text-white text-[11px] font-black flex items-center justify-center flex-shrink-0 shadow-sm">{step}</span>
                      <p className="text-sm text-gray-700 font-medium">{text}</p>
                    </div>
                  ))}
                </div>
              </motion.div>

              {/* Ad: Idle Bottom */}
              <div className="mt-6">
                <AdFitSlot unit="DAN-LxOuhWq2WMb3o4n7" width={300} height={250} label="광고" />
              </div>

              {/* Donation Card */}
              <motion.div
                className="glass-card rounded-3xl p-5 mt-4 text-center"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
              >
                <p className="text-base font-black text-gray-800 mb-1">중딩 개발자 후원하기 💚</p>
                <p className="text-xs text-gray-400 mb-4 leading-relaxed">
                  혼자 만든 서비스입니다. 몬스터 한 캔 값이면<br />다음 기능 개발에 큰 힘이 됩니다 🔋
                </p>
                <a
                  href="https://toss.me/wjadlink"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-monster inline-flex items-center gap-2 text-white text-sm font-bold px-6 py-3 rounded-2xl"
                >
                  <Coffee size={15} />
                  중딩 개발자에게 몬스터 수혈하기 🔋
                </a>
                <p className="text-[11px] text-gray-300 mt-2">토스 링크 연결 · 안전한 결제</p>
              </motion.div>
            </motion.div>
          )}

          {/* ── PARSING ─────────────────────────────────── */}
          {appState === 'parsing' && (
            <motion.div key="parsing" variants={scaleIn} initial="hidden" animate="visible" exit={{ opacity: 0 }}
              className="glass-card rounded-3xl p-8 text-center mt-4">
              <SpinnerRing />
              <p className="font-bold text-gray-800 mt-4 mb-1">파일 읽는 중...</p>
              <p className="text-xs text-gray-400 truncate max-w-xs mx-auto">{fileName}</p>
            </motion.div>
          )}

          {/* ── ANALYZING ───────────────────────────────── */}
          {appState === 'analyzing' && (
            <motion.div key="analyzing" variants={scaleIn} initial="hidden" animate="visible" exit={{ opacity: 0 }}>
              <div className="glass-card rounded-3xl p-6 mt-4 mb-4">
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-10 h-10 rounded-xl hero-gradient flex items-center justify-center flex-shrink-0 shadow-md">
                    <Sparkles size={16} className="text-white" />
                  </div>
                  <div>
                    <p className="font-bold text-gray-900 text-sm">AI 분석 중</p>
                    <p className="text-[11px] text-gray-400 truncate max-w-[200px]">{fileName}</p>
                  </div>
                </div>
                {/* Progress bar */}
                <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden mb-3">
                  <div
                    className="progress-bar h-full rounded-full transition-all duration-100"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <div className="text-center">
                  <p className="text-xs text-gray-500 min-h-[16px]">{analyzingMessages[msgIdx]}</p>
                </div>
              </div>

              <AdFitSlot unit="DAN-AMQ595exIV6B8w0M" width={320} height={100} label="분석 완료 후 결과를 확인하세요" />

              {/* Skeleton cards */}
              <div className="mt-4 grid grid-cols-2 gap-3">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="bg-white rounded-2xl p-4 border border-gray-100">
                    <div className="skeleton h-3 w-1/2 mb-2" style={{ height: 10 }} />
                    <div className="skeleton h-4 w-full mb-1.5" style={{ height: 14 }} />
                    <div className="skeleton h-3 w-2/3" style={{ height: 10 }} />
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* ── RESULT ──────────────────────────────────── */}
          {appState === 'result' && result && (
            <motion.div key="result" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }}>

              {/* Hero result banner */}
              <motion.div
                className="hero-gradient rounded-3xl p-6 mt-4 shadow-lg"
                variants={fadeUp} initial="hidden" animate="visible"
              >
                <div className="flex items-center gap-1.5 mb-3">
                  <BadgeCheck size={14} className="text-indigo-200" />
                  <span className="text-[11px] font-bold text-indigo-200 uppercase tracking-widest">AI 분석 완료</span>
                </div>
                <h2 className="text-lg font-black text-white leading-snug mb-2">
                  {result.공고명 || '공고 분석 결과'}
                </h2>
                {result.핵심요약 && (
                  <p className="text-sm text-indigo-100 leading-relaxed">{result.핵심요약}</p>
                )}
              </motion.div>

              {/* Summary cards grid */}
              <div className="grid grid-cols-2 gap-3 mt-3">
                <ResultCard icon={Building2} label="주관기관" value={result.주관기관} index={1} />
                <ResultCard icon={Banknote} label="지원금액" value={result.지원금액} accent index={2} />
                <ResultCard icon={Users} label="지원규모" value={result.지원규모} index={3} />
                <ResultCard icon={Calendar} label="마감일" value={result.마감일} accent index={4} />
                <ResultCard icon={Calendar} label="공고일" value={result.공고일} index={5} />
                <ResultCard icon={Phone} label="문의처" value={result.문의처} index={6} />
              </div>

              {/* Detail cards */}
              <div className="space-y-3 mt-3">
                <ResultCard icon={BadgeCheck} label="지원 자격" value={result.지원자격} index={7} />
                <ResultCard icon={Target} label="사업 목적" value={result.사업목적} index={8} />
                <ResultCard icon={ClipboardList} label="신청 방법" value={result.신청방법} index={9} />
                <ResultCard icon={Paperclip} label="제출 서류" value={result.제출서류} index={10} />
                {result.기타사항 && result.기타사항 !== '정보 없음' && (
                  <ResultCard icon={Info} label="기타 사항" value={result.기타사항} index={11} />
                )}
              </div>

              {/* Ad: Result Middle */}
              <div className="mt-5">
                <AdFitSlot unit="DAN-LxOuhWq2WMb3o4n7" width={300} height={250} label="관련 지원사업 정보" />
              </div>

              {/* Download CTA */}
              <motion.div
                className="glass-card rounded-3xl p-5 mt-4"
                variants={fadeUp} custom={12} initial="hidden" animate="visible"
              >
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest text-center mb-3">분석 결과 저장</p>
                <button
                  onClick={() => result && downloadExcel(result, fileName)}
                  className="btn-primary w-full text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-2 text-base"
                >
                  <Download size={18} />
                  엑셀 파일로 다운로드
                </button>
                <p className="text-center text-[11px] text-gray-400 mt-2">📁 [Gonggo.link]공고_요약본.xlsx</p>
              </motion.div>

              {/* Ad: Result Bottom */}
              <div className="mt-4">
                <AdFitSlot unit="DAN-AMQ595exIV6B8w0M" width={320} height={100} label="광고" />
              </div>

              {/* Donation */}
              <motion.div
                className="glass-card rounded-3xl p-5 mt-4 text-center"
                variants={fadeUp} custom={13} initial="hidden" animate="visible"
              >
                <p className="text-sm font-black text-gray-800 mb-1">결과가 도움이 됐다면? 💚</p>
                <p className="text-xs text-gray-400 mb-4">중딩 개발자에게 몬스터 한 캔 사주세요 🔋</p>
                <a
                  href="https://toss.me/wjadlink"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-monster inline-flex items-center gap-2 text-white text-sm font-bold px-6 py-3 rounded-2xl"
                >
                  <Coffee size={14} />
                  중딩 개발자에게 몬스터 수혈하기 🔋
                </a>
              </motion.div>

              {/* Reset */}
              <motion.div className="text-center mt-5" variants={fadeUp} custom={14} initial="hidden" animate="visible">
                <button
                  onClick={handleReset}
                  className="inline-flex items-center gap-2 text-sm font-semibold text-gray-400 hover:text-indigo-600 border border-gray-200 hover:border-indigo-300 bg-white px-5 py-2.5 rounded-full transition-all"
                >
                  <RotateCcw size={13} />
                  새 파일 분석하기
                </button>
              </motion.div>
            </motion.div>
          )}

          {/* ── ERROR ───────────────────────────────────── */}
          {appState === 'error' && (
            <motion.div key="error" variants={scaleIn} initial="hidden" animate="visible"
              className="glass-card rounded-3xl p-8 text-center mt-4">
              <div className="text-4xl mb-3">😢</div>
              <h3 className="font-black text-gray-800 mb-2">분석에 실패했습니다</h3>
              <p className="text-sm text-gray-500 mb-5 max-w-xs mx-auto leading-relaxed">{errorMsg}</p>
              <button
                onClick={handleReset}
                className="btn-primary text-white text-sm font-bold px-6 py-3 rounded-2xl inline-flex items-center gap-2"
              >
                <RotateCcw size={14} />
                다시 시도하기
              </button>
            </motion.div>
          )}

        </AnimatePresence>
      </main>

      {/* ── Sticky Bottom CTA (idle only) ──────────────── */}
      <AnimatePresence>
        {appState === 'idle' && (
          <motion.div
            className="fixed bottom-0 left-0 right-0 z-40"
            initial={{ y: 80 }}
            animate={{ y: 0 }}
            exit={{ y: 80 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          >
            <div className="glass-card border-t border-white/60 px-4 py-3 max-w-lg mx-auto">
              <button
                className="btn-primary w-full text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-2 text-base"
                onClick={() => fileInputRef.current?.click()}
              >
                <FileText size={17} />
                공고 파일 분석 시작하기
                <ChevronRight size={16} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Footer ──────────────────────────────────────── */}
      <footer className="py-8 text-center px-4">
        <p className="text-xs text-gray-400">
          © 2024 <span className="font-bold text-gray-500">Gonggo.link</span> by WJadlink · 파일은 서버에 저장되지 않습니다
        </p>
        <p className="text-[11px] text-gray-300 mt-1">Powered by Claude AI · Made with ❤️ by a middle schooler</p>
      </footer>
    </>
  );
}
