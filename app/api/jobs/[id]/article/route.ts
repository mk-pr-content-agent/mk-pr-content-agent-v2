import crypto from "crypto";
import { eq } from "drizzle-orm";
import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/db";
import {
  articles,
  claims,
  competitors,
  jobs,
  notifications,
  rule_findings,
  stage_results,
} from "@/db/schema";
import { getSession } from "@/lib/auth/session";
import { runS0Extract } from "@/lib/pipeline/s0-extract";
import { runS5Sanitize } from "@/lib/pipeline/s5-sanitize";
import { runS6WriteArticle } from "@/lib/pipeline/s6-write";
import { runS7StyleEdit, runS9FinalCheck } from "@/lib/pipeline/s7-s10";
import type {
  CompanyFactMemo,
  JobMode,
  JobOptions,
  SentenceProofreadItem,
  VerdictType,
} from "@/lib/pipeline/types";

interface UpdateArticleBody {
  title?: string;
  subtitle?: string;
  body?: string;
  captions?: string[];
  aiNoticeIncluded?: boolean;
  byline?: string;
  mode?: JobMode;
  resolveHold?: boolean;
  resolvedClaimId?: string;
  sentenceSuggestions?: SentenceProofreadItem[];
  factMemos?: CompanyFactMemo[];
  competitors?: Array<{
    id?: string;
    name: string;
    summary: string;
    source_url: string;
    selected: number;
  }>;
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session.user?.id) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  const { id } = await context.params;
  const job = db.select().from(jobs).where(eq(jobs.id, id)).get();
  if (!job) {
    return NextResponse.json({ error: "작업을 찾을 수 없습니다." }, { status: 404 });
  }

  const payload = (await request.json()) as UpdateArticleBody;

  const jobOptions: JobOptions = (() => {
    try {
      return JSON.parse(job.options_json) as JobOptions;
    } catch {
      return {};
    }
  })();

  if (payload.byline !== undefined) {
    jobOptions.byline = payload.byline.trim();
  }
  if (payload.aiNoticeIncluded !== undefined) {
    jobOptions.includeAiNotice = payload.aiNoticeIncluded;
  }

  const effectiveMode: JobMode =
    payload.mode ?? (job.mode as JobMode) ?? "ad_article";

  // 특정 클레임 증빙 확인 완료 처리
  if (payload.resolvedClaimId) {
    db.update(claims)
      .set({ status: "verified", usable_in_article: "yes" })
      .where(eq(claims.id, payload.resolvedClaimId))
      .run();
  }

  // 전체 보류(HOLD) 해제 요청 시
  if (payload.resolveHold) {
    const jobClaims = db
      .select()
      .from(claims)
      .where(eq(claims.job_id, id))
      .all();
    for (const c of jobClaims) {
      if (c.status === "evidence_required") {
        db.update(claims)
          .set({ status: "verified", usable_in_article: "yes" })
          .where(eq(claims.id, c.id))
          .run();
      }
    }
    db.delete(notifications).where(eq(notifications.job_id, id)).run();
  }

  // 경쟁사 선택 상태 업데이트
  if (Array.isArray(payload.competitors)) {
    db.delete(competitors).where(eq(competitors.job_id, id)).run();
    if (payload.competitors.length > 0) {
      db.insert(competitors)
        .values(
          payload.competitors.map((c) => ({
            id: c.id ?? crypto.randomUUID(),
            job_id: id,
            name: c.name,
            summary: c.summary,
            source_url: c.source_url,
            selected: c.selected ? 1 : 0,
          }))
        )
        .run();
    }
  }

  const existingArticles = db
    .select()
    .from(articles)
    .where(eq(articles.job_id, id))
    .all()
    .sort((a, b) => b.version - a.version);

  const latest = existingArticles[0];
  const nextVersion = (latest?.version ?? 0) + 1;

  let title = payload.title ?? latest?.title ?? "";
  let subtitle = payload.subtitle ?? latest?.subtitle ?? "";
  let body = payload.body ?? latest?.body ?? "";
  let modeSwitchSuggestions = payload.sentenceSuggestions;
  let modeSwitchMemos = payload.factMemos;

  // 모드 전환 요청 시 (body 없이 mode만 전달된 경우) 즉시 해당 모드의 본문·교정제안·메모 생성
  if (payload.mode && payload.body === undefined) {
    const s0 = runS0Extract(job.raw_text, job.company_name ?? undefined);
    const s5 = runS5Sanitize(s0.normalizedText);
    const s6 = runS6WriteArticle(payload.mode, s0, s5, jobOptions, []);
    const s7 = runS7StyleEdit(s6);
    title = title || s7.title;
    subtitle = subtitle || s7.subtitle;
    body = s7.body;
    modeSwitchSuggestions = s6.sentenceSuggestions;
    modeSwitchMemos = s6.factMemos;
  }
  const captions: string[] =
    payload.captions ??
    (() => {
      try {
        return JSON.parse(latest?.caption_json ?? "[]") as string[];
      } catch {
        return [];
      }
    })();
  const aiNoticeIncluded =
    payload.aiNoticeIncluded !== undefined
      ? payload.aiNoticeIncluded
      : latest?.ai_notice_included === 1;

  db.insert(articles)
    .values({
      id: crypto.randomUUID(),
      job_id: id,
      version: nextVersion,
      title,
      subtitle,
      body,
      caption_json: JSON.stringify(captions),
      ai_notice_included: aiNoticeIncluded ? 1 : 0,
      created_by: "user",
    })
    .run();

  // 남은 증빙 필요 클레임이 본문에 여전히 존재하는지 확인
  const remainingClaims = db
    .select()
    .from(claims)
    .where(eq(claims.job_id, id))
    .all();

  const activeEvidenceClaims = remainingClaims.filter((c) => {
    if (c.status !== "evidence_required") return false;
    // 본문에서 해당 문장이 삭제되었으면 자동으로 해결된 것으로 간주
    const snippet = c.text.slice(0, 20).trim();
    if (snippet && !body.includes(snippet)) {
      db.update(claims)
        .set({ status: "verified" })
        .where(eq(claims.id, c.id))
        .run();
      return false;
    }
    return true;
  });

  const priorVerdict: VerdictType =
    job.verdict === "REJECT"
      ? "REJECT"
      : activeEvidenceClaims.length > 0 && !payload.resolveHold
      ? "HOLD"
      : "PASS";

  // S9 전체 재검사 (FMT-01~12 + FMT-11 바이라인 + 네이버 체크리스트)
  const s9 = runS9FinalCheck(
    { title, subtitle, body, captions },
    effectiveMode,
    jobOptions,
    priorVerdict
  );

  db.delete(rule_findings).where(eq(rule_findings.job_id, id)).run();

  const savedFindings = s9.hardRuleFindings.map((f) => ({
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

  // S6 stage_results 내 sentenceSuggestions 및 factMemos 상태 업데이트
  if (modeSwitchSuggestions || modeSwitchMemos) {
    const existingS6 = db
      .select()
      .from(stage_results)
      .where(eq(stage_results.job_id, id))
      .all()
      .find((s) => s.stage === "S6");
    if (existingS6) {
      let s6Out: Record<string, unknown> = {};
      try {
        s6Out = JSON.parse(existingS6.output_json) as Record<string, unknown>;
      } catch {
        s6Out = {};
      }
      if (modeSwitchSuggestions) {
        s6Out.sentenceSuggestions = modeSwitchSuggestions;
      }
      if (modeSwitchMemos) {
        s6Out.factMemos = modeSwitchMemos;
      }
      db.update(stage_results)
        .set({
          output_json: JSON.stringify(s6Out),
        })
        .where(eq(stage_results.id, existingS6.id))
        .run();
    }
  }

  // S9 stage_results 업데이트
  const existingS9 = db
    .select()
    .from(stage_results)
    .where(eq(stage_results.job_id, id))
    .all()
    .find((s) => s.stage === "S9");
  if (existingS9) {
    db.update(stage_results)
      .set({
        output_json: JSON.stringify(s9),
        finished_at: new Date().toISOString(),
      })
      .where(eq(stage_results.id, existingS9.id))
      .run();
  }

  // 보류 사유가 모두 해소되었으면 hold 알림 제거
  if (s9.overallVerdict !== "HOLD") {
    db.delete(notifications).where(eq(notifications.job_id, id)).run();
  }

  db.update(jobs)
    .set({
      mode: effectiveMode,
      verdict: s9.overallVerdict,
      status:
        job.status === "approved"
          ? "approved"
          : s9.overallVerdict === "HOLD"
          ? "hold"
          : "completed",
      options_json: JSON.stringify(jobOptions),
      updated_at: new Date().toISOString(),
    })
    .where(eq(jobs.id, id))
    .run();

  return NextResponse.json({
    ok: true,
    version: nextVersion,
    verdict: s9.overallVerdict,
    findings: savedFindings,
    charCountTitle: s9.charCountTitle,
    charCountBody: s9.charCountBody,
  });
}
