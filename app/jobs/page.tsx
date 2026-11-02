import { redirect } from "next/navigation";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { approvals, articles, jobs } from "@/db/schema";
import { getSession } from "@/lib/auth/session";
import { JobsListClient } from "@/components/jobs-list-client";
import type { VerdictType } from "@/lib/pipeline/types";

export default async function JobsPage() {
  const session = await getSession();

  if (!session.user?.id) {
    redirect("/login");
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
      id: j.id,
      mode: j.mode,
      status: j.status,
      verdict: (j.verdict as VerdictType | null) ?? null,
      company_name: j.company_name,
      articleTitle:
        latestArticle?.title ??
        j.raw_text.split(/\r?\n/)[0]?.slice(0, 45) ??
        "새 보도자료 작업",
      approved: Boolean(approval),
      created_at: j.created_at,
    };
  });

  return (
    <JobsListClient
      initialJobs={enriched}
      userEmail={session.user.email}
      userRole={session.user.role}
    />
  );
}
