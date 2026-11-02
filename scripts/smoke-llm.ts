import fs from "fs";
import path from "path";
import { z } from "zod";
import { generateJson, sanitizeSecret, search } from "@/lib/llm/perplexity";

/**
 * 스모크 테스트: .env.local에서만 PERPLEXITY_API_KEY를 읽고 샘플 질의 3개 실호출
 */
export function loadApiKeyFromEnvLocalOnly(
  envLocalPath = path.join(process.cwd(), ".env.local")
): string {
  // 기존 process.env의 PERPLEXITY_API_KEY를 초기화하고 오직 .env.local에서만 읽음
  delete process.env.PERPLEXITY_API_KEY;

  if (!fs.existsSync(envLocalPath)) {
    throw new Error(
      ".env.local 파일이 존재하지 않습니다. 스모크 테스트는 .env.local의 PERPLEXITY_API_KEY만 사용합니다."
    );
  }

  const content = fs.readFileSync(envLocalPath, "utf-8");
  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const eqIdx = line.indexOf("=");
    if (eqIdx === -1) continue;
    const key = line.slice(0, eqIdx).trim();
    const val = line
      .slice(eqIdx + 1)
      .trim()
      .replace(/^['"]|['"]$/g, "");
    if (key === "PERPLEXITY_API_KEY" && val.length > 0) {
      process.env.PERPLEXITY_API_KEY = val;
      return val;
    }
  }

  throw new Error(
    ".env.local 파일에 유효한 PERPLEXITY_API_KEY가 설정되어 있지 않습니다."
  );
}

async function runSmokeTest() {
  const apiKey = loadApiKeyFromEnvLocalOnly();

  const logSafe = (msg: string) => {
    console.log(sanitizeSecret(msg, apiKey));
  };

  logSafe("=== Perplexity API Smoke Test (3 Sample Queries) ===");

  // 1. 샘플 질의 #1: 중복 게재 점검 검색 (sonar)
  const q1 =
    "국민대학교 이도연 교수 세계 최상위 2% 연구자 선정 보도자료 기사 게재 현황";
  const r1 = await search(q1, {
    model: "sonar",
    searchRecencyFilter: "year",
    searchContextSize: "low",
  });
  logSafe(
    `[Query 1 | search(sonar)] ok=${r1.ok} | latency=${r1.latencyMs}ms | sources=${r1.sources.length} | tokens=${r1.usage.totalTokens} (in=${r1.usage.promptTokens}, out=${r1.usage.completionTokens}) | estCost=$${r1.usage.estimatedCostUsd}${r1.failureReason ? ` | reason=${r1.failureReason}` : ""}`
  );

  // 2. 샘플 질의 #2: 기업 공식 홈페이지 존재 및 사업 실체 확인 (sonar)
  const q2 =
    "스포츠용품 기업 낫소(NASSAU)의 공식 홈페이지 URL과 주요 사업 분야를 알려주세요.";
  const r2 = await search(q2, {
    model: "sonar",
    searchContextSize: "low",
  });
  logSafe(
    `[Query 2 | search(sonar)] ok=${r2.ok} | latency=${r2.latencyMs}ms | sources=${r2.sources.length} | tokens=${r2.usage.totalTokens} (in=${r2.usage.promptTokens}, out=${r2.usage.completionTokens}) | estCost=$${r2.usage.estimatedCostUsd}${r2.failureReason ? ` | reason=${r2.failureReason}` : ""}`
  );

  // 3. 샘플 질의 #3: 구조화 JSON 추출 (generateJson, sonar-pro)
  const ExtractSchema = z.object({
    companyName: z.string(),
    eventTitle: z.string(),
    supportAmount: z.string(),
  });

  const r3 = await generateJson(
    ExtractSchema,
    [
      {
        role: "system",
        content:
          "보도자료에서 기업/기관명(companyName), 사업명(eventTitle), 지원 규모(supportAmount)를 JSON으로 추출하십시오.",
      },
      {
        role: "user",
        content:
          "숭실대학교는 과학기술정보통신부의 ‘2026년 하반기 이공계 연구생활 장려금 지원 사업’에 신규 선정됐다고 밝혔다. 총 약 55억 원의 사업비를 지원받을 예정이다.",
      },
    ],
    {
      model: "sonar-pro",
      disableSearch: true,
      jsonSchemaObject: {
        type: "object",
        properties: {
          companyName: { type: "string" },
          eventTitle: { type: "string" },
          supportAmount: { type: "string" },
        },
        required: ["companyName", "eventTitle", "supportAmount"],
        additionalProperties: false,
      },
    }
  );
  logSafe(
    `[Query 3 | generateJson(sonar-pro)] ok=${r3.ok} | latency=${r3.latencyMs}ms | sources=${r3.sources.length} | tokens=${r3.usage.totalTokens} (in=${r3.usage.promptTokens}, out=${r3.usage.completionTokens}) | estCost=$${r3.usage.estimatedCostUsd} | data=${JSON.stringify(r3.data)}${r3.failureReason ? ` | reason=${r3.failureReason}` : ""}`
  );

  const totalCost = Number(
    (
      r1.usage.estimatedCostUsd +
      r2.usage.estimatedCostUsd +
      r3.usage.estimatedCostUsd
    ).toFixed(6)
  );
  logSafe(`=== Total Estimated Cost (3 queries): $${totalCost} ===`);

  if (!r1.ok || !r2.ok || !r3.ok) {
    process.exit(1);
  }
}

if (
  process.argv[1] &&
  path.resolve(process.argv[1]) === path.resolve(__filename)
) {
  runSmokeTest().catch((err) => {
    const safeMsg = sanitizeSecret(
      err instanceof Error ? err.message : String(err)
    );
    console.error(`[Smoke Test Failed] ${safeMsg}`);
    process.exit(1);
  });
}
