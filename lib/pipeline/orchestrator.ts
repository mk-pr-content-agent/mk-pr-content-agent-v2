import "server-only";
import crypto from "crypto";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import {
  articles,
  audit_logs,
  claims,
  competitors,
  jobs,
  notifications,
  rule_findings,
  stage_results,
} from "@/db/schema";
import { z } from "zod";
import {
  generateJson,
  saveSourcesToDb,
  search,
  type NormalizedSource,
} from "@/lib/llm/perplexity";
import { recordLlmUsage } from "@/lib/llm/usage-store";
import { runS0Extract } from "./s0-extract";
import { evaluateDedupeFromSources } from "./s1-dedupe";
import { evaluateCompanyVerification } from "./s2-company";
import { runS3RestrictionScreen } from "./s3-restrict";
import { runS4FactCheck } from "./s4-factcheck";
import { runS5Sanitize } from "./s5-sanitize";
import {
  cleanCompetitorText,
  isInvalidCompetitorName,
  runS6WriteArticle,
} from "./s6-write";
import {
  runS7StyleEdit,
  runS8PhotoCheck,
  runS9FinalCheck,
  runS10PrepareApproval,
} from "./s7-s10";
import type { JobMode, JobOptions, VerdictType } from "./types";

export interface StageProgressEvent {
  stage: string;
  label: string;
  status: "running" | "completed" | "failed" | "skipped";
  verdict?: VerdictType;
  summary?: string;
}

export const STAGE_LABELS: Record<string, string> = {
  S0: "S0 전처리·클레임 추출",
  S1: "S1 중복 게재 점검",
  S2: "S2 기업·홈페이지 검증",
  S3: "S3 제한 소재 스크리닝",
  S4: "S4 팩트체크·증빙 플래그",
  S5: "S5 과장·미확정 표현 필터링",
  S6: "S6 기사 초안 작성",
  S7: "S7 제목·문체·리드 정비",
  S8: "S8 사진·캡션 점검",
  S9: "S9 최종 교열·규정 체크",
  S10: "S10 검수 체크리스트 준비",
};

function saveStageRecord(
  jobId: string,
  stage: string,
  status: "running" | "completed" | "failed" | "skipped",
  output: unknown,
  startedAt: string
) {
  const existing = db
    .select()
    .from(stage_results)
    .where(eq(stage_results.job_id, jobId))
    .all()
    .find((r) => r.stage === stage);

  const now = new Date().toISOString();
  if (existing) {
    db.update(stage_results)
      .set({
        status,
        output_json: JSON.stringify(output ?? {}),
        finished_at: status === "running" ? null : now,
      })
      .where(eq(stage_results.id, existing.id))
      .run();
  } else {
    db.insert(stage_results)
      .values({
        id: crypto.randomUUID(),
        job_id: jobId,
        stage,
        status,
        output_json: JSON.stringify(output ?? {}),
        started_at: startedAt,
        finished_at: status === "running" ? null : now,
      })
      .run();
  }
}

export async function executePipelineForJob(
  jobId: string,
  onProgress?: (event: StageProgressEvent) => void,
  optionsOverride?: { forceProceedReject?: boolean; overrideReason?: string }
): Promise<{ verdict: VerdictType; status: string }> {
  const job = db.select().from(jobs).where(eq(jobs.id, jobId)).get();
  if (!job) {
    throw new Error(`Job ${jobId} not found`);
  }

  const jobOptions: JobOptions = (() => {
    try {
      return JSON.parse(job.options_json) as JobOptions;
    } catch {
      return {};
    }
  })();

  const forceProceed = Boolean(
    optionsOverride?.forceProceedReject || jobOptions.overrideRejectReason
  );

  if (optionsOverride?.overrideReason) {
    jobOptions.overrideRejectReason = optionsOverride.overrideReason;
    db.update(jobs)
      .set({
        options_json: JSON.stringify(jobOptions),
        updated_at: new Date().toISOString(),
      })
      .where(eq(jobs.id, jobId))
      .run();

    db.insert(audit_logs)
      .values({
        id: crypto.randomUUID(),
        user_id: job.user_id,
        action: "REJECT_OVERRIDE",
        target: jobId,
        detail_json: JSON.stringify({
          reason: optionsOverride.overrideReason,
        }),
        created_at: new Date().toISOString(),
      })
      .run();
  }

  const hasPerplexityKey = Boolean(process.env.PERPLEXITY_API_KEY?.trim());

  const emit = (
    stage: string,
    status: "running" | "completed" | "failed" | "skipped",
    summary?: string,
    verdict?: VerdictType
  ) => {
    onProgress?.({
      stage,
      label: STAGE_LABELS[stage] ?? stage,
      status,
      summary,
      verdict,
    });
  };

  db.update(jobs)
    .set({ status: "running", updated_at: new Date().toISOString() })
    .where(eq(jobs.id, jobId))
    .run();

  // S0: 전처리 및 클레임 추출
  const s0Start = new Date().toISOString();
  emit("S0", "running");
  const cleanHint =
    job.company_name &&
    job.company_name !== "한국야구위원회" &&
    job.company_name !== "대상 기업"
      ? job.company_name
      : undefined;
  const s0 = runS0Extract(job.raw_text, cleanHint);
  saveStageRecord(jobId, "S0", "completed", s0, s0Start);
  db.update(jobs)
    .set({ company_name: s0.companyName, updated_at: new Date().toISOString() })
    .where(eq(jobs.id, jobId))
    .run();
  emit(
    "S0",
    "completed",
    `기업명(${s0.companyName}), 클레임 ${s0.claims.length}건 추출`
  );

  // S1: 중복 게재 점검
  const s1Start = new Date().toISOString();
  emit("S1", "running");
  let s1Sources: NormalizedSource[] = [];
  let s1Usage = { promptTokens: 0, completionTokens: 0, totalTokens: 0, estimatedCostUsd: 0 };
  if (hasPerplexityKey) {
    const s1Res = await search(
      `${s0.companyName} ${s0.claims[0]?.text?.slice(0, 40) ?? ""} 보도자료 뉴스`,
      {
        model: "openai/gpt-5.6-sol",
        maxOutputTokens: 300,
        searchRecencyFilter: "month",
        timeoutMs: 20_000,
        maxRetries: 1,
      }
    );
    s1Sources = s1Res.sources;
    s1Usage = s1Res.usage;
    recordLlmUsage({
      jobId,
      stage: "S1 중복 게재 검색",
      model: "openai/gpt-5.6-sol",
      usage: s1Res.usage,
    });
  }
  const s1 = evaluateDedupeFromSources(s0, s1Sources, 3);
  if (s1.sources.length > 0) {
    saveSourcesToDb({
      jobId,
      stage: "S1",
      usedFor: "dedupe_check",
      items: s1.sources,
    });
  }
  saveStageRecord(jobId, "S1", "completed", { ...s1, llmUsage: s1Usage }, s1Start);
  emit("S1", "completed", s1.differentiationAdvice);

  // S2: 기업·홈페이지 검증
  const s2Start = new Date().toISOString();
  emit("S2", "running");
  let s2Sources: NormalizedSource[] = [];
  let s2Usage = { promptTokens: 0, completionTokens: 0, totalTokens: 0, estimatedCostUsd: 0 };
  if (hasPerplexityKey) {
    const s2Res = await search(`${s0.companyName} 공식 홈페이지 주요 사업`, {
      model: "openai/gpt-5.6-sol",
      maxOutputTokens: 300,
      timeoutMs: 20_000,
      maxRetries: 1,
    });
    s2Sources = s2Res.sources;
    s2Usage = s2Res.usage;
    recordLlmUsage({
      jobId,
      stage: "S2 기업·홈페이지 검색",
      model: "openai/gpt-5.6-sol",
      usage: s2Res.usage,
    });
  } else {
    s2Sources = [
      {
        url: `https://www.mk.co.kr/search?word=${encodeURIComponent(s0.companyName)}`,
        title: `${s0.companyName} 관련 매경 검색 참조`,
        publisher: "mk.co.kr",
        snippet: `${s0.companyName} 보도자료 및 기업 실체 확인 참조 출처`,
      },
    ];
  }
  const s2 = evaluateCompanyVerification(s0, job.raw_text, s2Sources);
  if (s2.sources.length > 0) {
    saveSourcesToDb({
      jobId,
      stage: "S2",
      usedFor: "company_verification",
      items: s2.sources,
    });
  }
  saveStageRecord(jobId, "S2", "completed", { ...s2, llmUsage: s2Usage }, s2Start);
  emit("S2", "completed", s2.businessVerifiedSummary, s2.verdict);

  // S3: 제한 소재 스크리닝
  const s3Start = new Date().toISOString();
  emit("S3", "running");
  const s3 = runS3RestrictionScreen(job.raw_text);
  saveStageRecord(jobId, "S3", "completed", s3, s3Start);
  emit(
    "S3",
    "completed",
    s3.matches.length > 0
      ? `제한/주의 소재 ${s3.matches.length}건 감지 (${s3.verdict})`
      : "제한 소재 해당 없음",
    s3.verdict
  );

  // REJECT 중단 처리 (단, 담당자가 '그래도 진행'을 선택한 경우는 계속 진행)
  if ((s2.verdict === "REJECT" || s3.verdict === "REJECT") && !forceProceed) {
    const rejectReasons: Array<{
      ruleId: string;
      category: string;
      quote: string;
      message: string;
    }> = [];

    if (s2.verdict === "REJECT") {
      rejectReasons.push({
        ruleId: s2.rejectCode ?? "REJ-01",
        category: "기업·홈페이지 검증",
        quote: s2.businessVerifiedSummary,
        message: s2.rejectMessage ?? "공식 홈페이지가 확인되지 않아 게재가 어렵습니다.",
      });
    }
    for (const m of s3.matches.filter((x) => x.action === "REJECT")) {
      rejectReasons.push({
        ruleId: m.ruleId,
        category: m.category,
        quote: m.evidenceQuote,
        message: m.rejectMessage ?? "제한 소재에 해당하여 게재가 어렵습니다.",
      });
    }

    const primaryMsg =
      rejectReasons[0]?.message ??
      "기사식광고 게재 제한 사유에 해당하여 반려되었습니다.";

    db.insert(notifications)
      .values({
        id: crypto.randomUUID(),
        user_id: job.user_id,
        job_id: jobId,
        type: "reject",
        message: primaryMsg,
        reasons_json: JSON.stringify(rejectReasons),
        created_at: new Date().toISOString(),
      })
      .run();

    for (const skippedStage of ["S4", "S5", "S6", "S7", "S8", "S9", "S10"]) {
      saveStageRecord(
        jobId,
        skippedStage,
        "skipped",
        { reason: "REJECT 판정으로 이후 단계 실행 생략" },
        new Date().toISOString()
      );
      emit(skippedStage, "skipped", "반려(REJECT) 판정으로 생략됨", "REJECT");
    }

    db.update(jobs)
      .set({
        status: "rejected",
        verdict: "REJECT",
        updated_at: new Date().toISOString(),
      })
      .where(eq(jobs.id, jobId))
      .run();

    return { verdict: "REJECT", status: "rejected" };
  }

  // S4: 팩트체크 & 증빙 플래그 (Claim Ledger 저장)
  const s4Start = new Date().toISOString();
  emit("S4", "running");
  const s4 = runS4FactCheck(s0, job.raw_text, s2.sources);
  db.delete(claims).where(eq(claims.job_id, jobId)).run();
  if (s4.claims.length > 0) {
    db.insert(claims)
      .values(
        s4.claims.map((c) => ({
          id: crypto.randomUUID(),
          job_id: jobId,
          text: c.text,
          type: c.type,
          status: c.status,
          evidence_request: c.evidenceRequest ?? null,
          usable_in_article: c.usableInArticle,
        }))
      )
      .run();
  }
  saveStageRecord(jobId, "S4", "completed", s4, s4Start);
  emit(
    "S4",
    "completed",
    s4.evidenceRequiredList.length > 0
      ? `증빙 확인 필요 항목 ${s4.evidenceRequiredList.length}건 플래그`
      : "클레임 사실 분류 완료"
  );

  // S5: 과장·미확정 표현 필터링
  const s5Start = new Date().toISOString();
  emit("S5", "running");
  const s5 = runS5Sanitize(s0.normalizedText);
  saveStageRecord(jobId, "S5", "completed", s5, s5Start);
  emit(
    "S5",
    "completed",
    s5.diffs.length > 0
      ? `과장·홍보성 표현 ${s5.diffs.length}건 자동 완화`
      : "과장 표현 없음"
  );

  // S6: 기사 초안 작성 (모드 분기)
  const s6Start = new Date().toISOString();
  emit("S6", "running");
  let existingComps = db
    .select()
    .from(competitors)
    .where(eq(competitors.job_id, jobId))
    .all()
    .map((c) => ({
      name: c.name,
      summary: c.summary,
      sourceUrl: c.source_url,
      selected: c.selected === 1,
    }))
    .filter((c) => !isInvalidCompetitorName(c.name, s0.companyName));

  let s6Usage = {
    promptTokens: 0,
    completionTokens: 0,
    totalTokens: 0,
    estimatedCostUsd: 0,
  };
  let customComparisonAnalysisParagraph: string | undefined;

  if (job.mode === "comparative" && hasPerplexityKey) {
    const comparativeResearchSchema = z.object({
      industryCategory: z.string().min(3),
      competitors: z
        .array(
          z.object({
            name: z.string().min(2).max(40),
            summary: z.string().min(20).max(220),
          })
        )
        .min(2)
        .max(4),
      comparisonAnalysisParagraph: z.string().min(50).max(500),
    });

    const compRes = await generateJson(
      comparativeResearchSchema,
      [
        {
          role: "system",
          content: [
            "당신은 매일경제신문 산업부 기획기자입니다.",
            "입력된 보도자료의 핵심 제품·서비스 분야를 파악하고, 국내 동종업계에서 경쟁하거나 유사 사업을 전개하는 타 브랜드/기업 3곳을 조사하여 비교·기획 기사 문단을 작성하십시오.",
            "엄격 규칙:",
            "1. competitors 배열의 name에는 반드시 실제 동종업계 타 기업·브랜드 실명만 넣으십시오. 보도자료 주인공 기업 자신이나 언론사/포털 도메인(isplus.com, v.daum.net, 매일경제 등)은 절대 넣지 마십시오.",
            "2. competitors 배열의 summary에는 타 매체 기사 원문을 복사하거나 말줄임표(...), 마크다운(###), 출처번호([1])를 넣지 말고, 해당 경쟁사의 관련 사업·제품 동향을 완결된 한국어 기사 문장 1~2문장(~하고 있다.)으로 자체 서술하십시오.",
            "3. comparisonAnalysisParagraph에는 경쟁사들의 기존 방식과 대비되는 보도자료 대상 기업만의 차별화 포인트(설치·운영 구조, 타깃 수요처, 기술·제조 기반 등)를 객관적 비교 기준으로 분석한 3~4문장의 기획 문단을 작성하십시오.",
            "4. 반드시 다음 JSON 키 구조로만 응답하십시오: {\"industryCategory\":\"...\",\"competitors\":[{\"name\":\"...\",\"summary\":\"...\"}],\"comparisonAnalysisParagraph\":\"...\"}",
          ].join("\n"),
        },
        {
          role: "user",
          content: `대상 기업명: ${s0.companyName}\n\n보도자료 원문:\n${s5.sanitizedText.slice(0, 2000)}`,
        },
      ],
      {
        model: "openai/gpt-5.6-sol",
        maxOutputTokens: 1200,
        searchRecencyFilter: "year",
        timeoutMs: 30_000,
        maxRetries: 1,
      }
    );

    s6Usage = {
      promptTokens: s6Usage.promptTokens + compRes.usage.promptTokens,
      completionTokens:
        s6Usage.completionTokens + compRes.usage.completionTokens,
      totalTokens: s6Usage.totalTokens + compRes.usage.totalTokens,
      estimatedCostUsd: Number(
        (s6Usage.estimatedCostUsd + compRes.usage.estimatedCostUsd).toFixed(6)
      ),
    };

    recordLlmUsage({
      jobId,
      stage: "S6 동종업계 경쟁사·비교기획 조사",
      model: "openai/gpt-5.6-sol",
      usage: compRes.usage,
    });

    if (compRes.sources.length > 0) {
      saveSourcesToDb({
        jobId,
        stage: "S6",
        usedFor: "competitor_comparison",
        items: compRes.sources,
      });
    }

    if (!compRes.needs_human_check && compRes.data) {
      const validLlmComps = compRes.data.competitors
        .filter((c) => !isInvalidCompetitorName(c.name, s0.companyName))
        .map((c, idx) => ({
          name: c.name.replace(/\[.*?\]/g, "").trim(),
          summary: cleanCompetitorText(c.summary),
          sourceUrl:
            compRes.sources[idx]?.url ??
            compRes.sources[0]?.url ??
            `https://www.mk.co.kr/search?word=${encodeURIComponent(c.name)}`,
          selected: true,
        }))
        .filter((c) => c.summary.length >= 15);

      if (validLlmComps.length >= 2) {
        existingComps = validLlmComps;
      }
      customComparisonAnalysisParagraph = cleanCompetitorText(
        compRes.data.comparisonAnalysisParagraph
      );
    }
  }

  const s6 = runS6WriteArticle(
    job.mode as JobMode,
    s0,
    s5,
    jobOptions,
    s2.sources,
    existingComps,
    customComparisonAnalysisParagraph
  );

  if (hasPerplexityKey) {
    const headlineSchema = z.object({
      titleCandidates: z.array(z.string().min(20).max(48)).min(3),
      subtitleLines: z.array(z.string().min(12).max(52)).min(1).max(3),
    });

    const llmRes = await generateJson(
      headlineSchema,
      [
        {
          role: "system",
          content:
            job.mode === "comparative"
              ? "당신은 매일경제신문 편집데스크 기자입니다. 보도자료와 동종업계 비교 기획 관점을 반영해 (1) 32~42자 내외의 완결된 한국어 경제신문 제목 후보 3개(기업명 포함, 절대 문장 중간에서 단어를 자르지 말고 명사/현재형으로 완결, 인라인 출처번호 [1] 표기 금지)와 (2) 마침표 없는 명사형 종결 부제목 2줄을 반드시 {\"titleCandidates\":[\"...\",\"...\",\"...\"],\"subtitleLines\":[\"...\",\"...\"]} JSON 형식으로만 작성하십시오."
              : "당신은 매일경제신문 편집데스크 기자입니다. 보도자료 원문을 읽고 (1) 32~42자 내외의 완결된 한국어 경제신문 제목 후보 3개(기업명 포함, 절대 문장 중간에서 단어를 자르지 말고 명사/현재형으로 완결, 인라인 출처번호 [1] 표기 금지)와 (2) 마침표 없는 명사형 종결 부제목 2줄을 반드시 {\"titleCandidates\":[\"...\",\"...\",\"...\"],\"subtitleLines\":[\"...\",\"...\"]} JSON 형식으로만 작성하십시오.",
        },
        {
          role: "user",
          content: `기업/기관명: ${s0.companyName}\n\n보도자료 본문:\n${s5.sanitizedText.slice(0, 2500)}`,
        },
      ],
      {
        model: "openai/gpt-5.6-sol",
        maxOutputTokens: 450,
        disableSearch: true,
        timeoutMs: 20_000,
        maxRetries: 1,
      }
    );

    if (!llmRes.needs_human_check && llmRes.data) {
      const cleanedTitles = llmRes.data.titleCandidates
        .map((t) =>
          t
            .replace(/\[\d+\]/g, "")
            .replace(/\*{1,2}/g, "")
            .trim()
        )
        .filter((t) => Array.from(t).length >= 24 && Array.from(t).length <= 46);
      if (cleanedTitles.length >= 3) {
        s6.titleCandidates = cleanedTitles.slice(0, 3);
        s6.title = s6.titleCandidates[0] ?? s6.title;
      }
      s6.subtitle = llmRes.data.subtitleLines
        .slice(0, 2)
        .map((l) =>
          l
            .replace(/\[\d+\]/g, "")
            .replace(/\*{1,2}/g, "")
            .replace(/\.$/, "")
            .trim()
        )
        .join("\n");
    }

    s6Usage = {
      promptTokens: s6Usage.promptTokens + llmRes.usage.promptTokens,
      completionTokens:
        s6Usage.completionTokens + llmRes.usage.completionTokens,
      totalTokens: s6Usage.totalTokens + llmRes.usage.totalTokens,
      estimatedCostUsd: Number(
        (s6Usage.estimatedCostUsd + llmRes.usage.estimatedCostUsd).toFixed(6)
      ),
    };

    recordLlmUsage({
      jobId,
      stage: "S6 AI 제목·부제 생성",
      model: "openai/gpt-5.6-sol",
      usage: llmRes.usage,
    });
  }

  if (job.mode === "comparative" && s6.competitors.length > 0) {
    db.delete(competitors).where(eq(competitors.job_id, jobId)).run();
    db.insert(competitors)
      .values(
        s6.competitors.map((c) => ({
          id: crypto.randomUUID(),
          job_id: jobId,
          name: c.name,
          summary: c.summary,
          source_url: c.sourceUrl,
          selected: c.selected ? 1 : 0,
        }))
      )
      .run();
  }
  saveStageRecord(
    jobId,
    "S6",
    "completed",
    { ...s6, llmUsage: s6Usage },
    s6Start
  );
  emit("S6", "completed", "매경 스타일 기사 초안 및 제목 후보 3개 생성 완료");

  // S7: 제목·문체 정비
  const s7Start = new Date().toISOString();
  emit("S7", "running");
  const s7 = runS7StyleEdit(s6);
  saveStageRecord(jobId, "S7", "completed", s7, s7Start);
  emit("S7", "completed", "리드 육하원칙 및 서술 어미 정비 완료");

  // S8: 사진/캡션 점검
  const s8Start = new Date().toISOString();
  emit("S8", "running");
  const s8 = runS8PhotoCheck(s6.captions, s0.companyName, jobOptions);
  saveStageRecord(jobId, "S8", "completed", s8, s8Start);
  emit("S8", "completed", `캡션 ${s8.normalizedCaptions.length}건 규격·제공자 점검 완료`);

  // S9: 최종 교열 + 규정 체크 리포트
  const s9Start = new Date().toISOString();
  emit("S9", "running");
  const priorVerdict: VerdictType =
    s1.verdict === "HOLD" || s3.verdict === "HOLD" || s4.verdict === "HOLD"
      ? "HOLD"
      : s5.diffs.length > 0 || s7.styleEdits.length > 0
      ? "PASS_WITH_EDIT"
      : "PASS";

  const s9 = runS9FinalCheck(
    {
      title: s7.title,
      subtitle: s7.subtitle,
      body: s7.body,
      captions: s8.normalizedCaptions,
    },
    job.mode as JobMode,
    jobOptions,
    priorVerdict
  );
  saveStageRecord(jobId, "S9", "completed", s9, s9Start);

  // 기사 및 rule_findings 저장
  db.delete(articles).where(eq(articles.job_id, jobId)).run();
  db.insert(articles)
    .values({
      id: crypto.randomUUID(),
      job_id: jobId,
      version: 1,
      title: s7.title,
      subtitle: s7.subtitle,
      body: s7.body,
      caption_json: JSON.stringify(s8.normalizedCaptions),
      ai_notice_included: jobOptions.includeAiNotice ? 1 : 0,
      created_by: "ai",
    })
    .run();

  db.delete(rule_findings).where(eq(rule_findings.job_id, jobId)).run();
  if (s9.hardRuleFindings.length > 0) {
    db.insert(rule_findings)
      .values(
        s9.hardRuleFindings.map((f) => ({
          id: crypto.randomUUID(),
          job_id: jobId,
          article_version: 1,
          rule_id: f.ruleId,
          severity: f.severity,
          location_json: JSON.stringify(f.location),
          message: f.message + (f.suggestion ? ` → 제안: ${f.suggestion}` : ""),
          resolved: 0,
        }))
      )
      .run();
  }

  // HOLD 알림 기록
  if (s9.overallVerdict === "HOLD") {
    const holdReasons = [
      ...s3.matches.filter((m) => m.action === "HOLD").map((m) => m.category),
      ...s4.evidenceRequiredList,
    ];
    db.insert(notifications)
      .values({
        id: crypto.randomUUID(),
        user_id: job.user_id,
        job_id: jobId,
        type: "hold",
        message:
          "증빙 자료 확인 또는 담당자 검토가 필요한 보류(HOLD) 항목이 있습니다.",
        reasons_json: JSON.stringify(holdReasons),
        created_at: new Date().toISOString(),
      })
      .run();
  }
  emit(
    "S9",
    "completed",
    `최종 판정: ${s9.overallVerdict} (본문 ${s9.charCountBody}자)`,
    s9.overallVerdict
  );

  // S10: 사람 검수·승인 준비
  const s10Start = new Date().toISOString();
  emit("S10", "running");
  const s10 = runS10PrepareApproval(job.mode as JobMode);
  saveStageRecord(jobId, "S10", "completed", s10, s10Start);
  emit("S10", "completed", "담당자 승인 체크리스트 준비 완료", s9.overallVerdict);

  const finalStatus = s9.overallVerdict === "HOLD" ? "hold" : "completed";
  db.update(jobs)
    .set({
      status: finalStatus,
      verdict: s9.overallVerdict,
      updated_at: new Date().toISOString(),
    })
    .where(eq(jobs.id, jobId))
    .run();

  return { verdict: s9.overallVerdict, status: finalStatus };
}
