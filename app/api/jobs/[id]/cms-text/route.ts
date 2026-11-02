import { eq } from "drizzle-orm";
import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/db";
import { approvals, articles, jobs } from "@/db/schema";
import { getSession } from "@/lib/auth/session";
import { countBodyCharsWithSpaces } from "@/lib/rules/hard-rules";

const DEFAULT_AI_NOTICE =
  "※ 본 기사는 보도자료를 바탕으로 AI 보조 도구를 활용해 작성·편집되었으며 담당 기자의 검수를 거쳤습니다.";

export async function GET(
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

  // AGENTS.md 핵심 규칙: CMS용 복사 텍스트는 approvals 레코드가 있을 때만 반환/활성화할 것
  const approval = db
    .select()
    .from(approvals)
    .where(eq(approvals.job_id, id))
    .get();

  if (!approval) {
    return NextResponse.json(
      {
        error:
          "담당자 검수 승인(approvals)이 완료되지 않아 CMS용 텍스트를 내보낼 수 없습니다.",
      },
      { status: 403 }
    );
  }

  const latestArticle = db
    .select()
    .from(articles)
    .where(eq(articles.job_id, id))
    .all()
    .sort((a, b) => b.version - a.version)[0];

  if (!latestArticle) {
    return NextResponse.json(
      { error: "생성된 기사 초안이 없습니다." },
      { status: 404 }
    );
  }

  const blankLineBetweenParagraphs =
    request.nextUrl.searchParams.get("blankLine") !== "0";
  const includeByline =
    request.nextUrl.searchParams.get("includeByline") === "1";

  const jobOptions = (() => {
    try {
      return JSON.parse(job.options_json) as { byline?: string };
    } catch {
      return {};
    }
  })();

  const captions: string[] = (() => {
    try {
      return JSON.parse(latestArticle.caption_json) as string[];
    } catch {
      return [];
    }
  })();

  const paragraphs = latestArticle.body
    .split(/\n{2,}|\n/)
    .map((p) => p.trim())
    .filter(Boolean);

  const formattedBody = paragraphs.join(
    blankLineBetweenParagraphs ? "\n\n" : "\n"
  );

  const lines: string[] = [latestArticle.title];
  if (latestArticle.subtitle.trim()) {
    lines.push(latestArticle.subtitle.trim());
  }
  lines.push("");
  lines.push(formattedBody);

  if (captions.length > 0) {
    lines.push("");
    for (const cap of captions) {
      lines.push(cap);
    }
  }

  if (includeByline && jobOptions.byline?.trim()) {
    lines.push("");
    lines.push(jobOptions.byline.trim());
  }

  if (latestArticle.ai_notice_included === 1) {
    lines.push(DEFAULT_AI_NOTICE);
  }

  const fullText = lines.join("\n");

  return NextResponse.json({
    ok: true,
    fullText,
    title: latestArticle.title,
    subtitle: latestArticle.subtitle,
    body: formattedBody,
    captions: captions.join("\n"),
    charCountTitle: Array.from(latestArticle.title.trim()).length,
    charCountBody: countBodyCharsWithSpaces(formattedBody),
  });
}
