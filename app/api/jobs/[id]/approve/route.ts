import crypto from "crypto";
import { eq } from "drizzle-orm";
import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/db";
import { approvals, audit_logs, jobs } from "@/db/schema";
import { getSession } from "@/lib/auth/session";
import { runS10PrepareApproval } from "@/lib/pipeline/s7-s10";
import type { JobMode } from "@/lib/pipeline/types";

interface ApproveBody {
  checklist?: Record<string, boolean>;
  naverExcluded?: boolean;
  overrideReason?: string;
}

export async function POST(
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

  const body = (await request.json()) as ApproveBody;
  const checklist = body.checklist ?? {};

  const s10 = runS10PrepareApproval(job.mode as JobMode);
  const missingItems = s10.requiredChecklist.filter(
    (item) => !checklist[item.id]
  );

  if (missingItems.length > 0) {
    return NextResponse.json(
      {
        error: `필수 검수 체크리스트 항목을 모두 체크해야 승인할 수 있습니다 (미체크 ${missingItems.length}건).`,
      },
      { status: 400 }
    );
  }

  const now = new Date().toISOString();
  db.delete(approvals).where(eq(approvals.job_id, id)).run();

  const approvalRecord = {
    id: crypto.randomUUID(),
    job_id: id,
    user_id: session.user.id,
    checklist_json: JSON.stringify(checklist),
    naver_excluded: body.naverExcluded !== false ? 1 : 0,
    approved_at: now,
    override_reason: body.overrideReason ?? null,
  };

  db.insert(approvals).values(approvalRecord).run();

  db.update(jobs)
    .set({ status: "approved", updated_at: now })
    .where(eq(jobs.id, id))
    .run();

  db.insert(audit_logs)
    .values({
      id: crypto.randomUUID(),
      user_id: session.user.id,
      action: "JOB_APPROVED",
      target: id,
      detail_json: JSON.stringify({
        naverExcluded: approvalRecord.naver_excluded === 1,
        overrideReason: body.overrideReason,
      }),
      created_at: now,
    })
    .run();

  return NextResponse.json({ ok: true, approval: approvalRecord });
}
