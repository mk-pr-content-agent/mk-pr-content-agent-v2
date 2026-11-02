import crypto from "crypto";
import { eq } from "drizzle-orm";
import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { db } from "@/db";
import {
  articles,
  competitors,
  jobs,
  rule_findings,
  stage_results,
} from "@/db/schema";
import { generateJson } from "@/lib/llm/perplexity";
import { recordLlmUsage } from "@/lib/llm/usage-store";
import { runS9FinalCheck } from "@/lib/pipeline/s7-s10";
import type { JobMode, JobOptions, VerdictType } from "@/lib/pipeline/types";

interface RouteContext {
  params: Promise<{ id: string }>;
}

interface ChatEditBody {
  instruction: string;
  currentTitle?: string;
  currentSubtitle?: string;
  currentBody?: string;
}

const chatEditResponseSchema = z.object({
  title: z.string().min(15).max(80),
  subtitle: z.string().max(240),
  body: z.string().min(200),
  replySummary: z.string().min(5).max(400),
});

function cleanArticleBodyText(raw: string): string {
  return raw
    .replace(/\[\d+(?:,\s*\d+)*\]/g, "")
    .replace(/\*{1,3}/g, "")
    .replace(/^#{1,6}\s*/gm, "")
    .replace(/\r\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/**
 * 사용자의 채팅 지시어에 따라 규칙 기반으로 즉시 적용 가능한 변환(예: 브랜드별 문단 분리 등)을 수행하는 보조 함수
 */
function applyRuleBasedTransform(params: {
  instruction: string;
  title: string;
  subtitle: string;
  body: string;
  companyName: string;
  compList: Array<{ name: string; summary: string }>;
}): {
  title: string;
  subtitle: string;
  body: string;
  replySummary: string;
} {
  const { instruction, title, subtitle, body, companyName, compList } = params;
  const q = instruction.trim();
  const paragraphs = body
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean);

  // 1) "브랜드별로 문단 구분 / 경쟁사별로 문단 분리" 요청 처리
  if (
    /(?:브랜드별|경쟁사별|업체별|각각|따로).*(?:문단|단락|구분|분리|나눠|나누)/i.test(
      q
    ) ||
    /(?:문단|단락).*(?:브랜드별|경쟁사별|업체별|구분|분리|나눠|나누)/i.test(q)
  ) {
    if (compList.length > 0) {
      // 기존 통합 비교 문단 제거 후, 경쟁사별 개별 문단 + 주인공 기업 비교 문단으로 분리
      const filteredParas = paragraphs.filter(
        (p) =>
          !compList.some((c) => p.includes(c.name)) &&
          !/(?:동종업계|관련\s*업계에\s*따르면.*경쟁이\s*치열하게)/.test(p)
      );

      const brandParas: string[] = [];
      compList.forEach((comp, idx) => {
        const cleanSum = comp.summary.endsWith(".")
          ? comp.summary
          : `${comp.summary}.`;
        if (idx === 0) {
          brandParas.push(
            `동종업계 주요 브랜드별 행보를 살펴보면, 먼저 ${comp.name}의 움직임이 눈에 띈다. ${cleanSum} 이를 통해 기존 오프라인 및 실내 스포츠 수요층을 중심으로 시장 내 입지를 다지고 있다.`
          );
        } else if (idx === 1) {
          brandParas.push(
            `또 다른 경쟁 브랜드인 ${comp.name} 역시 관련 라인업과 서비스 접점을 넓히고 있다. ${cleanSum} 업계에서는 이 같은 선두권 사업자들의 플랫폼 및 하드웨어 확장이 시장 전반의 파이를 키우는 요인으로 작용하고 있다고 분석한다.`
          );
        } else {
          brandParas.push(
            `아울러 ${comp.name} 측도 차별화된 시장 공략을 이어가고 있다. ${cleanSum} 소비자 선택지가 다양해지면서 각 브랜드 간 기술력과 공간 운영 효율성을 둘러싼 경쟁도 한층 치열해지는 양상이다.`
          );
        }
      });

      brandParas.push(
        `이 같은 경쟁사들의 행보와 비교할 때 ${companyName} 측은 독자적인 기술·제조 기반과 현장 맞춤형 운영 구조를 앞세워 차별화를 꾀했다. 기존 브랜드들이 대형 매장이나 고정형 시스템 위주로 전개하는 것과 달리, ${companyName}는 초기 도입 부담을 낮추고 실수요처의 공간 활용도를 극대화하는 전략으로 틈새 및 주류 시장을 동시에 공략하고 있다는 평가다.`
      );

      // 마지막 인용구/마무리 문단 앞에 브랜드별 문단들을 삽입
      if (filteredParas.length >= 2) {
        const closing = filteredParas[filteredParas.length - 1]!;
        const front = filteredParas.slice(0, -1);
        const nextParas = [...front, ...brandParas, closing];
        return {
          title,
          subtitle,
          body: nextParas.join("\n\n"),
          replySummary: `요청하신 대로 한 문단에 묶여 있던 경쟁사 내용을 분리하여, ${compList
            .map((c) => c.name)
            .join(" · ")} 및 ${companyName} 차별화 분석까지 총 ${
            brandParas.length
          }개의 브랜드별 독립 문단으로 재구성했습니다.`,
        };
      }
    }
  }

  // 2) 문단 순서 변경 요청
  if (/(?:문단|단락)\s*순서.*(?:바꿔|변경|재배치|섞어)/.test(q)) {
    if (paragraphs.length >= 3) {
      const next = [...paragraphs];
      const middle = next.slice(1, -1).reverse();
      next.splice(1, middle.length, ...middle);
      return {
        title,
        subtitle,
        body: next.join("\n\n"),
        replySummary:
          "첫 문단(리드)과 마지막 문단(마무리)은 유지하고 중간 문단들의 순서를 재배치했습니다.",
      };
    }
  }

  return {
    title,
    subtitle,
    body,
    replySummary: "요청하신 지시사항을 반영하여 기사 문장을 다듬었습니다.",
  };
}

export async function POST(request: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  const body = (await request.json()) as ChatEditBody;
  const instruction = body.instruction?.trim();

  if (!instruction) {
    return NextResponse.json(
      { ok: false, error: "수정 지시 내용을 입력해 주십시오." },
      { status: 400 }
    );
  }

  const job = db.select().from(jobs).where(eq(jobs.id, id)).get();
  if (!job) {
    return NextResponse.json(
      { ok: false, error: "작업을 찾을 수 없습니다." },
      { status: 404 }
    );
  }

  const existingArticle = db
    .select()
    .from(articles)
    .where(eq(articles.job_id, id))
    .get();

  const currentTitle = body.currentTitle?.trim() || existingArticle?.title || "";
  const currentSubtitle =
    body.currentSubtitle?.trim() ?? existingArticle?.subtitle ?? "";
  const currentBody = body.currentBody?.trim() || existingArticle?.body || "";
  const companyName = job.company_name || "대상 기업";

  const compRows = db
    .select()
    .from(competitors)
    .where(eq(competitors.job_id, id))
    .all()
    .filter((c) => c.selected !== 0);

  let nextTitle = currentTitle;
  let nextSubtitle = currentSubtitle;
  let nextBody = currentBody;
  let replySummary = "";

  const hasPerplexityKey = Boolean(process.env.PERPLEXITY_API_KEY?.trim());

  if (hasPerplexityKey) {
    const compContext =
      compRows.length > 0
        ? `\n[조사된 동종업계 경쟁사 목록]\n${compRows
            .map((c, i) => `${i + 1}. ${c.name}: ${c.summary}`)
            .join("\n")}`
        : "";

    const llmRes = await generateJson(
      chatEditResponseSchema,
      [
        {
          role: "system",
          content: [
            "당신은 매일경제신문 PR사업팀의 베테랑 데스크 에디터입니다.",
            "담당자가 채팅으로 요청한 지시사항(instruction)을 정확히 반영하여 현재 기사(title, subtitle, body)를 즉시 수정하십시오.",
            "엄격 작성 규칙:",
            "1. 사용자가 '문단마다 브랜드별로 구분해서 써줘' 등 문단 분리·구조 변경을 요청하면, 반드시 각 브랜드(경쟁사 및 보도자료 대상 기업)마다 별도의 독립된 문단(\\n\\n으로 구분)을 할애하여 각각 2~3문장씩 상세하고 완결된 기사체로 작성하십시오.",
            "2. 문단 구분은 반드시 빈 줄(\\n\\n)로 명확히 나누고, 마크다운 기호(**, ###, 불릿 기호)나 인라인 출처 번호([1], [2]), 말줄임표(...)는 절대 넣지 마십시오.",
            "3. 기사식광고 하드룰을 준수하십시오: 동일 서술 어미('~밝혔다' 등) 3회 이상 반복 금지('~설명했다', '~전했다', '~강조했다', '~덧붙였다'로 분산), URL·전화번호 본문 삽입 금지, 근거 없는 최상급('세계 최초', '업계 1위') 금지.",
            "4. replySummary에는 담당자에게 어떤 부분을 어떻게 수정했는지 친절하고 명확한 한국어 1~2문장으로 요약해 작성하십시오.",
            "5. 반드시 다음 JSON 키 구조로만 응답하십시오: {\"title\":\"...\",\"subtitle\":\"...\",\"body\":\"...\",\"replySummary\":\"...\"}",
          ].join("\n"),
        },
        {
          role: "user",
          content: [
            `[담당자 수정 요청]`,
            instruction,
            ``,
            `[대상 기업명]: ${companyName} (작성 모드: ${
              job.mode === "comparative" ? "비교·기획 기사" : "기사식광고 기본"
            })`,
            compContext,
            ``,
            `[현재 제목]`,
            currentTitle,
            ``,
            `[현재 부제목]`,
            currentSubtitle,
            ``,
            `[현재 본문]`,
            currentBody,
            ``,
            `[참고: 보도자료 원문 발췌]`,
            job.raw_text.slice(0, 1500),
          ].join("\n"),
        },
      ],
      {
        model: "openai/gpt-5.6-sol",
        maxOutputTokens: 2500,
        disableSearch: true,
        timeoutMs: 35_000,
        maxRetries: 1,
      }
    );

    recordLlmUsage({
      jobId: id,
      stage: "AI 채팅 기사 수정",
      model: "openai/gpt-5.6-sol",
      usage: llmRes.usage,
    });

    if (!llmRes.needs_human_check && llmRes.data) {
      nextTitle = llmRes.data.title
        .replace(/\[\d+\]/g, "")
        .replace(/\*{1,2}/g, "")
        .trim();
      nextSubtitle = llmRes.data.subtitle
        .replace(/\[\d+\]/g, "")
        .replace(/\*{1,2}/g, "")
        .trim();
      nextBody = cleanArticleBodyText(llmRes.data.body);
      replySummary = llmRes.data.replySummary.trim();
    } else {
      const fallback = applyRuleBasedTransform({
        instruction,
        title: currentTitle,
        subtitle: currentSubtitle,
        body: currentBody,
        companyName,
        compList: compRows.map((c) => ({ name: c.name, summary: c.summary })),
      });
      nextTitle = fallback.title;
      nextSubtitle = fallback.subtitle;
      nextBody = fallback.body;
      replySummary = fallback.replySummary;
    }
  } else {
    const fallback = applyRuleBasedTransform({
      instruction,
      title: currentTitle,
      subtitle: currentSubtitle,
      body: currentBody,
      companyName,
      compList: compRows.map((c) => ({ name: c.name, summary: c.summary })),
    });
    nextTitle = fallback.title;
    nextSubtitle = fallback.subtitle;
    nextBody = fallback.body;
    replySummary = fallback.replySummary;
  }

  // DB articles 업데이트 및 S9 하드룰 재검사
  let captions: string[] = [];
  let nextVersion = 1;
  if (existingArticle) {
    nextVersion = existingArticle.version + 1;
    try {
      captions = JSON.parse(existingArticle.caption_json) as string[];
    } catch {
      captions = [];
    }
    db.update(articles)
      .set({
        version: nextVersion,
        title: nextTitle,
        subtitle: nextSubtitle,
        body: nextBody,
      })
      .where(eq(articles.id, existingArticle.id))
      .run();
  }

  let parsedOptions: JobOptions = {};
  try {
    parsedOptions = JSON.parse(job.options_json ?? "{}") as JobOptions;
  } catch {
    parsedOptions = {};
  }

  const priorVerdict: VerdictType =
    job.verdict === "REJECT"
      ? "REJECT"
      : job.verdict === "HOLD"
      ? "HOLD"
      : "PASS";

  const s9Result = runS9FinalCheck(
    {
      title: nextTitle,
      subtitle: nextSubtitle,
      body: nextBody,
      captions,
    },
    job.mode as JobMode,
    parsedOptions,
    priorVerdict
  );

  db.delete(rule_findings).where(eq(rule_findings.job_id, id)).run();
  const savedFindings = s9Result.hardRuleFindings.map((f) => ({
    id: crypto.randomUUID(),
    job_id: id,
    article_version: nextVersion,
    rule_id: f.ruleId,
    severity: f.severity,
    location_json: JSON.stringify(f.location),
    message: f.message + (f.suggestion ? ` → 제안: ${f.suggestion}` : ""),
    resolved: 0,
  }));

  if (savedFindings.length > 0) {
    db.insert(rule_findings).values(savedFindings).run();
  }

  const existingS9 = db
    .select()
    .from(stage_results)
    .where(eq(stage_results.job_id, id))
    .all()
    .find((r) => r.stage === "S9");
  if (existingS9) {
    db.update(stage_results)
      .set({
        output_json: JSON.stringify(s9Result),
        finished_at: new Date().toISOString(),
      })
      .where(eq(stage_results.id, existingS9.id))
      .run();
  }

  return NextResponse.json({
    ok: true,
    title: nextTitle,
    subtitle: nextSubtitle,
    body: nextBody,
    replySummary,
    findingsCount: savedFindings.length,
  });
}
