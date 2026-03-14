import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function POST(req: NextRequest) {
  try {
    const { text, fileName } = await req.json();

    if (!text || text.trim().length < 50) {
      return NextResponse.json(
        { error: '문서 내용이 너무 짧거나 비어 있습니다.' },
        { status: 400 }
      );
    }

    const truncatedText = text.slice(0, 12000); // Limit to ~12k chars

    const message = await client.messages.create({
      model: 'claude-opus-4-5',
      max_tokens: 2048,
      messages: [
        {
          role: 'user',
          content: `다음은 공고문 텍스트입니다. 아래 JSON 형식으로 정확하게 정보를 추출해주세요.
반드시 순수 JSON만 반환하고 마크다운 코드블록(\`\`\`)은 사용하지 마세요.

공고문 텍스트:
---
${truncatedText}
---

다음 JSON 형식으로만 응답하세요 (모든 필드 필수, 정보가 없으면 "정보 없음" 기재):
{
  "공고명": "공고 제목 또는 사업명",
  "주관기관": "주관 기관명",
  "지원금액": "지원 금액 또는 예산 (단위 포함)",
  "지원규모": "선정 기업/인원 수 또는 규모",
  "마감일": "신청 마감일 (YYYY-MM-DD 또는 텍스트)",
  "공고일": "공고 게시일",
  "지원자격": "지원 가능한 자격 요건 (간략히)",
  "사업목적": "사업의 목적 및 개요 (2-3문장)",
  "신청방법": "신청 방법 및 절차",
  "제출서류": "필요 제출 서류 목록",
  "문의처": "담당 부서 또는 연락처",
  "기타사항": "기타 중요 사항 또는 유의사항",
  "핵심요약": "이 공고의 가장 중요한 포인트 1-2문장"
}`,
        },
      ],
    });

    const content = message.content[0];
    if (content.type !== 'text') {
      throw new Error('Unexpected response type');
    }

    let parsed;
    try {
      // Strip any markdown fences if present
      const cleaned = content.text
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim();
      parsed = JSON.parse(cleaned);
    } catch {
      // Fallback: try to extract JSON from text
      const match = content.text.match(/\{[\s\S]*\}/);
      if (match) {
        parsed = JSON.parse(match[0]);
      } else {
        throw new Error('JSON 파싱 실패');
      }
    }

    return NextResponse.json({ result: parsed, fileName });
  } catch (error: unknown) {
    console.error('Analysis error:', error);
    const message =
      error instanceof Error ? error.message : '분석 중 오류가 발생했습니다.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
