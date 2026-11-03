import fs from "fs";
import path from "path";
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { z } from "zod";
import {
  generateJson,
  getSourcesByJobId,
  normalizePerplexitySources,
  sanitizeSecret,
  saveSourcesToDb,
  search,
} from "@/lib/llm/perplexity";
import { loadApiKeyFromEnvLocalOnly } from "@/scripts/smoke-llm";

describe("Perplexity Client & Sources DB (M2)", () => {
  const FAKE_KEY = "pplx-test-secret-key-9876543210abcdef";
  const originalKey = process.env.PERPLEXITY_API_KEY;

  beforeEach(() => {
    process.env.PERPLEXITY_API_KEY = FAKE_KEY;
  });

  afterEach(() => {
    if (originalKey === undefined) {
      delete process.env.PERPLEXITY_API_KEY;
    } else {
      process.env.PERPLEXITY_API_KEY = originalKey;
    }
  });

  it("1. (정상 응답) normalizes search_results & citations and saves to DB sources table", async () => {
    const mockFetch: typeof fetch = async () =>
      new Response(
        JSON.stringify({
          choices: [
            {
              message: {
                content: "낫소는 스포츠용품 전문기업입니다.",
              },
            },
          ],
          citations: [
            "https://www.nassau.co.kr/",
            "https://www.mk.co.kr/news/all/12181548",
          ],
          search_results: [
            {
              title: "㈜낫소 공식 홈페이지",
              url: "https://www.nassau.co.kr/",
              date: "2026-10-01",
              snippet: "스포츠용품 제조 및 스크린 파크골프 부스 안내",
            },
          ],
          usage: {
            prompt_tokens: 45,
            completion_tokens: 80,
            total_tokens: 125,
          },
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );

    const res = await search("낫소 공식 홈페이지 확인", {
      fetchImpl: mockFetch,
      searchRecencyFilter: "month",
    });

    expect(res.ok).toBe(true);
    expect(res.needs_human_check).toBe(false);
    expect(res.content).toContain("낫소");
    expect(res.sources).toHaveLength(2);
    expect(res.sources[0]).toEqual({
      url: "https://www.nassau.co.kr/",
      title: "㈜낫소 공식 홈페이지",
      publisher: "nassau.co.kr",
      publishedAt: "2026-10-01",
      snippet: "스포츠용품 제조 및 스크린 파크골프 부스 안내",
    });
    expect(res.sources[1]).toEqual({
      url: "https://www.mk.co.kr/news/all/12181548",
      title: "mk.co.kr",
      publisher: "mk.co.kr",
    });

    // Save to DB sources table & verify
    const jobId = `test-job-${Date.now()}`;
    const saved = saveSourcesToDb({
      jobId,
      stage: "S2",
      usedFor: "company_verification",
      items: res.sources,
    });
    expect(saved).toHaveLength(2);

    const fromDb = getSourcesByJobId(jobId);
    expect(fromDb).toHaveLength(2);
    expect(fromDb[0].url).toBe("https://www.nassau.co.kr/");
    expect(fromDb[0].stage).toBe("S2");
  });

  it("2. (타임아웃) retries 2 times (total 3 attempts) on timeout and returns needs_human_check: true", async () => {
    let callCount = 0;
    const slowFetch: typeof fetch = async (_input, init) => {
      callCount++;
      return new Promise<Response>((_resolve, reject) => {
        init?.signal?.addEventListener("abort", () => {
          const abortErr = new Error("The operation was aborted");
          abortErr.name = "AbortError";
          reject(abortErr);
        });
      });
    };

    const res = await search("타임아웃 테스트 질의", {
      fetchImpl: slowFetch,
      timeoutMs: 30,
      maxRetries: 2,
    });

    expect(callCount).toBe(3); // 최초 1회 + 재시도 2회
    expect(res.ok).toBe(false);
    expect(res.needs_human_check).toBe(true);
    expect(res.failureReason).toContain("timed out");
  });

  it("3. (잘못된 JSON / 스키마 불일치) retries 1 time on schema validation failure, then returns needs_human_check: true", async () => {
    let callCount = 0;
    const invalidJsonFetch: typeof fetch = async () => {
      callCount++;
      return new Response(
        JSON.stringify({
          choices: [
            {
              message: {
                // Schema expects { companyName: string, count: number }, but returns wrong type
                content: JSON.stringify({
                  companyName: "테스트기업",
                  count: "숫자가아님",
                }),
              },
            },
          ],
          citations: [],
          search_results: [],
          usage: { prompt_tokens: 20, completion_tokens: 20, total_tokens: 40 },
        }),
        { status: 200 }
      );
    };

    const Schema = z.object({
      companyName: z.string(),
      count: z.number(),
    });

    const res = await generateJson(
      Schema,
      [{ role: "user", content: "JSON 추출 요청" }],
      { fetchImpl: invalidJsonFetch }
    );

    expect(callCount).toBe(2); // 최초 1회 + 스키마 검증 실패 재시도 1회
    expect(res.ok).toBe(false);
    expect(res.data).toBeNull();
    expect(res.needs_human_check).toBe(true);
    expect(res.failureReason).toContain("JSON 스키마 검증 실패");
  });

  it("3b. (스키마 재시도 성공) succeeds if 2nd attempt after invalid JSON returns valid schema", async () => {
    let callCount = 0;
    const recoverFetch: typeof fetch = async () => {
      callCount++;
      const payload =
        callCount === 1
          ? "이것은 JSON이 아닌 일반 텍스트 응답입니다."
          : JSON.stringify({ companyName: "국민대학교", verified: true });

      return new Response(
        JSON.stringify({
          choices: [{ message: { content: payload } }],
          citations: ["https://www.kookmin.ac.kr/"],
          usage: { prompt_tokens: 30, completion_tokens: 15, total_tokens: 45 },
        }),
        { status: 200 }
      );
    };

    const Schema = z.object({
      companyName: z.string(),
      verified: z.boolean(),
    });

    const res = await generateJson(
      Schema,
      [{ role: "user", content: "기업 검증" }],
      { fetchImpl: recoverFetch }
    );

    expect(callCount).toBe(2);
    expect(res.ok).toBe(true);
    expect(res.needs_human_check).toBe(false);
    expect(res.data).toEqual({ companyName: "국민대학교", verified: true });
    expect(res.sources).toHaveLength(1);
  });

  it("4. (출처 없음) handles empty citations and search_results cleanly", async () => {
    const noSourceFetch: typeof fetch = async () =>
      new Response(
        JSON.stringify({
          choices: [{ message: { content: "출처 없는 응답" } }],
          usage: { prompt_tokens: 10, completion_tokens: 10, total_tokens: 20 },
        }),
        { status: 200 }
      );

    const res = await search("출처 없는 질의", {
      fetchImpl: noSourceFetch,
      disableSearch: true,
    });

    expect(res.ok).toBe(true);
    expect(res.sources).toEqual([]);
    expect(normalizePerplexitySources({})).toEqual([]);
  });

  it("5. (API 키 보안) never exposes PERPLEXITY_API_KEY in errors, logs, or responses, and reads .env.local only in smoke loader", async () => {
    const leakingFetch: typeof fetch = async () =>
      new Response(
        `Invalid token provided: Bearer ${FAKE_KEY} rejected by upstream`,
        { status: 401 }
      );

    const res = await search("키 노출 방어 테스트", {
      fetchImpl: leakingFetch,
      maxRetries: 0,
    });

    expect(res.ok).toBe(false);
    expect(JSON.stringify(res)).not.toContain(FAKE_KEY);
    expect(res.failureReason).toContain("[REDACTED_API_KEY]");
    expect(sanitizeSecret(`Error with key ${FAKE_KEY}`, FAKE_KEY)).not.toContain(
      FAKE_KEY
    );

    // Verify loadApiKeyFromEnvLocalOnly reads exclusively from the specified .env.local file
    const tempEnvLocal = path.join(
      process.cwd(),
      `temp-test-${Date.now()}.env.local`
    );
    fs.writeFileSync(
      tempEnvLocal,
      "PERPLEXITY_API_KEY=pplx-local-only-key-12345\n",
      "utf-8"
    );
    try {
      const loaded = loadApiKeyFromEnvLocalOnly(tempEnvLocal);
      expect(loaded).toBe("pplx-local-only-key-12345");
    } finally {
      fs.unlinkSync(tempEnvLocal);
    }
  });

  it("6. (openai/gpt-5.6-sol /v1/responses) sends Responses API payload and parses output[] + exact cost", async () => {
    let capturedUrl = "";
    let capturedBody: Record<string, unknown> = {};
    const responsesApiFetch: typeof fetch = async (input, init) => {
      capturedUrl = String(input);
      capturedBody = JSON.parse(String(init?.body ?? "{}")) as Record<
        string,
        unknown
      >;
      return new Response(
        JSON.stringify({
          id: "resp_test_gpt56",
          model: "openai/gpt-5.6-sol",
          output: [
            {
              type: "search_results",
              results: [
                {
                  title: "낫소 공식몰",
                  url: "https://www.nassau.co.kr/",
                  last_updated: "2026-10-27",
                  snippet: "대한민국 대표 스포츠 브랜드 낫소",
                },
              ],
            },
            {
              type: "message",
              role: "assistant",
              content: [
                {
                  type: "output_text",
                  text: "낫소 공식 홈페이지는 https://www.nassau.co.kr/ 입니다.",
                },
              ],
            },
          ],
          usage: {
            input_tokens: 120,
            output_tokens: 40,
            total_tokens: 160,
            cost: {
              total_cost: 0.0042,
            },
          },
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    };

    const res = await search("낫소 공식 홈페이지", {
      fetchImpl: responsesApiFetch,
      maxOutputTokens: 300,
    });

    expect(capturedUrl).toBe("https://api.perplexity.ai/v1/responses");
    expect(capturedBody.model).toBe("anthropic/claude-sonnet-4-6");
    expect(capturedBody.max_output_tokens).toBe(300);
    expect(res.ok).toBe(true);
    expect(res.content).toContain("nassau.co.kr");
    expect(res.sources).toHaveLength(1);
    expect(res.sources[0]?.url).toBe("https://www.nassau.co.kr/");
    expect(res.usage.totalTokens).toBe(160);
    expect(res.usage.estimatedCostUsd).toBe(0.0042);
  });
});
