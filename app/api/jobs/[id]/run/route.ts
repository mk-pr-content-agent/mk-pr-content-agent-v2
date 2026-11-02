import { type NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { executePipelineForJob } from "@/lib/pipeline/orchestrator";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session.user?.id) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  const { id } = await context.params;
  const forceProceed = request.nextUrl.searchParams.get("force") === "1";
  const overrideReason =
    request.nextUrl.searchParams.get("overrideReason") ?? undefined;

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const sendEvent = (event: string, data: unknown) => {
        controller.enqueue(
          encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`)
        );
      };

      try {
        const result = await executePipelineForJob(
          id,
          (progress) => {
            sendEvent("stage", progress);
          },
          {
            forceProceedReject: forceProceed,
            overrideReason,
          }
        );
        sendEvent("done", result);
      } catch (err) {
        sendEvent("error", {
          message:
            err instanceof Error
              ? err.message
              : "파이프라인 실행 중 오류가 발생했습니다.",
        });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
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
  const body = (await request.json().catch(() => ({}))) as {
    forceProceedReject?: boolean;
    overrideReason?: string;
  };

  if (body.forceProceedReject && !body.overrideReason?.trim()) {
    return NextResponse.json(
      { error: "반려 사유를 무시하고 진행하려면 사유를 반드시 입력해야 합니다." },
      { status: 400 }
    );
  }

  const result = await executePipelineForJob(id, undefined, {
    forceProceedReject: body.forceProceedReject,
    overrideReason: body.overrideReason?.trim(),
  });

  return NextResponse.json({ ok: true, ...result });
}
