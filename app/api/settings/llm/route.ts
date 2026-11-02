import { NextResponse, type NextRequest } from "next/server";
import { search } from "@/lib/llm/perplexity";
import {
  getLlmUsageStats,
  getMaskedApiKeyStatus,
  recordLlmUsage,
  saveApiKeyToEnvLocal,
} from "@/lib/llm/usage-store";

export async function GET(request: NextRequest) {
  const jobId = request.nextUrl.searchParams.get("jobId") ?? undefined;
  const keyStatus = getMaskedApiKeyStatus();
  const stats = getLlmUsageStats(jobId);

  return NextResponse.json({
    ...keyStatus,
    ...stats,
  });
}

interface UpdateLlmSettingsBody {
  action?: "save" | "clear" | "test";
  apiKey?: string;
}

export async function POST(request: NextRequest) {
  const body = (await request.json()) as UpdateLlmSettingsBody;
  const action = body.action ?? "save";

  if (action === "clear") {
    saveApiKeyToEnvLocal("");
    return NextResponse.json({
      ok: true,
      message: "Perplexity API 키가 해제되었습니다 (무료 로컬 모드로 동작).",
      ...getMaskedApiKeyStatus(),
      ...getLlmUsageStats(),
    });
  }

  if (typeof body.apiKey === "string" && body.apiKey.trim()) {
    saveApiKeyToEnvLocal(body.apiKey.trim());
  }

  if (action === "test") {
    const keyStatus = getMaskedApiKeyStatus();
    if (!keyStatus.hasApiKey) {
      return NextResponse.json(
        {
          ok: false,
          error: "먼저 Perplexity API 키를 입력해 주십시오.",
        },
        { status: 400 }
      );
    }

    const testRes = await search("매일경제 기사식광고 보도자료 최신 동향 요약", {
      model: "openai/gpt-5.6-sol",
      maxOutputTokens: 300,
      maxRetries: 0,
      timeoutMs: 15_000,
    });

    if (testRes.needs_human_check) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "API 호출에 실패했습니다. 키가 유효한지 또는 크레딧 잔액을 확인해 주십시오.",
        },
        { status: 400 }
      );
    }

    recordLlmUsage({
      jobId: "api-connection-test",
      stage: "연결테스트",
      model: "openai/gpt-5.6-sol",
      usage: testRes.usage,
    });

    return NextResponse.json({
      ok: true,
      message: `연결 성공! (${testRes.usage.totalTokens} 토큰 소모, 약 $${testRes.usage.estimatedCostUsd.toFixed(
        4
      )})`,
      ...getMaskedApiKeyStatus(),
      ...getLlmUsageStats(),
    });
  }

  return NextResponse.json({
    ok: true,
    message: "Perplexity API 키가 서버(.env.local)에 안전하게 저장되었습니다.",
    ...getMaskedApiKeyStatus(),
    ...getLlmUsageStats(),
  });
}
