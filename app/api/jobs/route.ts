import crypto from "crypto";
import { desc, eq } from "drizzle-orm";
import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/db";
import {
  approvals,
  articles,
  jobs,
} from "@/db/schema";
import { getSession } from "@/lib/auth/session";
import { executePipelineForJob } from "@/lib/pipeline/orchestrator";
import type { JobMode, JobOptions } from "@/lib/pipeline/types";

export async function GET() {
  const session = await getSession();
  if (!session.user?.id) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  const allJobs = db
    .select()
    .from(jobs)
    .orderBy(desc(jobs.created_at))
    .all();

  const enriched = allJobs.map((j) => {
    const latestArticle = db
      .select()
      .from(articles)
      .where(eq(articles.job_id, j.id))
      .all()
      .sort((a, b) => b.version - a.version)[0];

    const approval = db
      .select()
      .from(approvals)
      .where(eq(approvals.job_id, j.id))
      .get();

    return {
      ...j,
      articleTitle:
        latestArticle?.title ??
        j.raw_text.split(/\r?\n/)[0]?.slice(0, 45) ??
        "새 보도자료 작업",
      approved: Boolean(approval),
    };
  });

  return NextResponse.json({ jobs: enriched });
}

interface CreateJobRequest {
  mode?: JobMode;
  companyName?: string;
  rawText?: string;
  options?: JobOptions;
}

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session.user?.id) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  const body = (await request.json()) as CreateJobRequest;
  const rawText = body.rawText?.trim() ?? "";

  if (!rawText || rawText.length < 10) {
    return NextResponse.json(
      { error: "보도자료 원문을 10자 이상 입력해 주십시오." },
      { status: 400 }
    );
  }

  if (rawText.length > 20_000) {
    return NextResponse.json(
      { error: "보도자료 원문은 최대 20,000자까지 입력할 수 있습니다." },
      { status: 400 }
    );
  }

  const now = new Date().toISOString();
  const id = crypto.randomUUID();
  const mode: JobMode =
    body.mode === "comparative" ? "comparative" : "ad_article";

  db.insert(jobs)
    .values({
      id,
      user_id: session.user.id,
      mode,
      status: "draft",
      company_name: body.companyName?.trim() || null,
      raw_text: rawText,
      options_json: JSON.stringify(body.options ?? {}),
      created_at: now,
      updated_at: now,
    })
    .run();

  await executePipelineForJob(id);

  return NextResponse.json({ ok: true, id });
}
