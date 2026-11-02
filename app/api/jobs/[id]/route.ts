import { eq } from "drizzle-orm";
import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/db";
import {
  approvals,
  articles,
  claims,
  competitors,
  jobs,
  notifications,
  rule_findings,
  sources,
  stage_results,
} from "@/db/schema";
import { getSession } from "@/lib/auth/session";

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session.user?.id) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  const { id } = await context.params;
  const job = db.select().from(jobs).where(eq(jobs.id, id)).get();

  if (!job) {
    return NextResponse.json(
      { error: "작업을 찾을 수 없습니다." },
      { status: 404 }
    );
  }

  const stages = db
    .select()
    .from(stage_results)
    .where(eq(stage_results.job_id, id))
    .all();

  const jobClaims = db
    .select()
    .from(claims)
    .where(eq(claims.job_id, id))
    .all();

  const jobSources = db
    .select()
    .from(sources)
    .where(eq(sources.job_id, id))
    .all();

  const jobArticles = db
    .select()
    .from(articles)
    .where(eq(articles.job_id, id))
    .all()
    .sort((a, b) => b.version - a.version);

  const latestArticle = jobArticles[0] ?? null;

  const findings = db
    .select()
    .from(rule_findings)
    .where(eq(rule_findings.job_id, id))
    .all();

  const jobCompetitors = db
    .select()
    .from(competitors)
    .where(eq(competitors.job_id, id))
    .all();

  const jobNotifications = db
    .select()
    .from(notifications)
    .where(eq(notifications.job_id, id))
    .all();

  const approval =
    db.select().from(approvals).where(eq(approvals.job_id, id)).get() ?? null;

  return NextResponse.json({
    job,
    stages,
    claims: jobClaims,
    sources: jobSources,
    article: latestArticle,
    findings,
    competitors: jobCompetitors,
    notifications: jobNotifications,
    approval,
  });
}

export async function DELETE(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session.user?.id) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  const { id } = await context.params;
  const job = db.select().from(jobs).where(eq(jobs.id, id)).get();

  if (!job) {
    return NextResponse.json(
      { error: "작업을 찾을 수 없습니다." },
      { status: 404 }
    );
  }

  // 관련 하위 데이터 먼저 삭제 후 작업 레코드 삭제
  db.delete(stage_results).where(eq(stage_results.job_id, id)).run();
  db.delete(claims).where(eq(claims.job_id, id)).run();
  db.delete(sources).where(eq(sources.job_id, id)).run();
  db.delete(articles).where(eq(articles.job_id, id)).run();
  db.delete(rule_findings).where(eq(rule_findings.job_id, id)).run();
  db.delete(competitors).where(eq(competitors.job_id, id)).run();
  db.delete(notifications).where(eq(notifications.job_id, id)).run();
  db.delete(approvals).where(eq(approvals.job_id, id)).run();
  db.delete(jobs).where(eq(jobs.id, id)).run();

  return NextResponse.json({ ok: true });
}
