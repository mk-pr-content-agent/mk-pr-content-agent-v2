import "server-only";
import crypto from "crypto";
import { eq } from "drizzle-orm";
import type { z } from "zod";
import { db } from "@/db";
import { sources, type SourceRecord } from "@/db/schema";

const PERPLEXITY_CHAT_ENDPOINT = "https://api.perplexity.ai/chat/completions";
const PERPLEXITY_RESPONSES_ENDPOINT = "https://api.perplexity.ai/v1/responses";

export const DEFAULT_PERPLEXITY_MODEL = "openai/gpt-5.6-sol";

export type PerplexityModel =
  | "openai/gpt-5.6-sol"
  | "sonar"
  | "sonar-pro"
  | "sonar-reasoning"
  | "sonar-reasoning-pro"
  | "sonar-deep-research";

export type SearchRecencyFilter = "hour" | "day" | "week" | "month" | "year";
export type SearchContextSize = "low" | "medium" | "high";

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface NormalizedSource {
  url: string;
  title: string;
  publisher?: string;
  publishedAt?: string;
  snippet?: string;
}

export interface PerplexityUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  estimatedCostUsd: number;
}

export interface PerplexityBaseOptions {
  model?: PerplexityModel;
  maxOutputTokens?: number;
  timeoutMs?: number;
  maxRetries?: number;
  searchRecencyFilter?: SearchRecencyFilter;
  searchDomainFilter?: string[];
  searchContextSize?: SearchContextSize;
  disableSearch?: boolean;
  temperature?: number;
  systemPrompt?: string;
  jsonSchemaObject?: Record<string, unknown>;
  fetchImpl?: typeof fetch;
}

export interface SearchResult {
  ok: boolean;
  content: string;
  sources: NormalizedSource[];
  usage: PerplexityUsage;
  latencyMs: number;
  needs_human_check: boolean;
  failureReason?: string;
}

export interface GenerateJsonResult<T> {
  ok: boolean;
  data: T | null;
  rawContent?: string;
  sources: NormalizedSource[];
  usage: PerplexityUsage;
  latencyMs: number;
  needs_human_check: boolean;
  failureReason?: string;
}

interface RawPerplexitySearchResult {
  title?: string;
  url?: string;
  date?: string;
  last_updated?: string;
  snippet?: string;
}

interface RawPerplexityResponsesOutputItem {
  type?: string;
  results?: RawPerplexitySearchResult[];
  content?: Array<{
    type?: string;
    text?: string;
  }>;
}

interface RawPerplexityResponse {
  id?: string;
  output_text?: string;
  output?: RawPerplexityResponsesOutputItem[];
  choices?: Array<{
    message?: {
      content?: string;
    };
  }>;
  citations?: string[];
  search_results?: RawPerplexitySearchResult[];
  usage?: {
    prompt_tokens?: number;
    completion_tokens?: number;
    input_tokens?: number;
    output_tokens?: number;
    total_tokens?: number;
    cost?: {
      total_cost?: number;
    };
  };
}

export function sanitizeSecret(text: string, apiKey?: string): string {
  let sanitized = text;
  const envKey = apiKey ?? process.env.PERPLEXITY_API_KEY;
  if (envKey && envKey.trim().length > 0) {
    sanitized = sanitized.split(envKey.trim()).join("[REDACTED_API_KEY]");
  }
  sanitized = sanitized.replace(/pplx-[a-zA-Z0-9_-]+/g, "[REDACTED_API_KEY]");
  return sanitized;
}

function getApiKey(): string {
  const key = process.env.PERPLEXITY_API_KEY?.trim();
  if (!key) {
    throw new Error("PERPLEXITY_API_KEY 환경변수가 설정되지 않았습니다.");
  }
  return key;
}

function extractPublisherFromUrl(urlStr: string): string | undefined {
  try {
    const parsed = new URL(urlStr);
    return parsed.hostname.replace(/^www\./i, "");
  } catch {
    return undefined;
  }
}

export function normalizePerplexitySources(
  raw: Pick<RawPerplexityResponse, "citations" | "search_results" | "output">
): NormalizedSource[] {
  const byUrl = new Map<string, NormalizedSource>();

  const addSearchResultItem = (item: RawPerplexitySearchResult) => {
    const url = item.url?.trim();
    if (!url) return;
    const title = item.title?.trim() || extractPublisherFromUrl(url) || url;
    const publisher = extractPublisherFromUrl(url);
    const publishedAt = item.date?.trim() || item.last_updated?.trim();
    const snippet = item.snippet?.trim();

    byUrl.set(url, {
      url,
      title,
      ...(publisher ? { publisher } : {}),
      ...(publishedAt ? { publishedAt } : {}),
      ...(snippet ? { snippet } : {}),
    });
  };

  // 1) /v1/responses output[].type === "search_results"
  if (Array.isArray(raw.output)) {
    for (const outItem of raw.output) {
      if (outItem.type === "search_results" && Array.isArray(outItem.results)) {
        for (const item of outItem.results) {
          addSearchResultItem(item);
        }
      }
    }
  }

  // 2) /chat/completions search_results
  if (Array.isArray(raw.search_results)) {
    for (const item of raw.search_results) {
      addSearchResultItem(item);
    }
  }

  // 3) citations array
  if (Array.isArray(raw.citations)) {
    for (const rawUrl of raw.citations) {
      const url = typeof rawUrl === "string" ? rawUrl.trim() : "";
      if (!url || byUrl.has(url)) continue;
      const publisher = extractPublisherFromUrl(url);
      byUrl.set(url, {
        url,
        title: publisher ?? url,
        ...(publisher ? { publisher } : {}),
      });
    }
  }

  return Array.from(byUrl.values());
}

function extractTextFromResponse(raw: RawPerplexityResponse): string {
  if (typeof raw.output_text === "string" && raw.output_text.trim()) {
    return raw.output_text;
  }
  if (Array.isArray(raw.output)) {
    const chunks: string[] = [];
    for (const item of raw.output) {
      if (item.type === "message" && Array.isArray(item.content)) {
        for (const c of item.content) {
          if (typeof c.text === "string" && c.text.length > 0) {
            chunks.push(c.text);
          }
        }
      }
    }
    if (chunks.length > 0) {
      return chunks.join("\n");
    }
  }
  return raw.choices?.[0]?.message?.content ?? "";
}

export function estimateCostUsd(
  model: PerplexityModel,
  promptTokens: number,
  completionTokens: number,
  disableSearch = false,
  contextSize: SearchContextSize = "low"
): number {
  const isPro =
    model === "sonar-pro" ||
    model === "sonar-reasoning-pro" ||
    model === "openai/gpt-5.6-sol";
  const inputRatePerM = isPro ? 3.0 : 1.0;
  const outputRatePerM = isPro ? 15.0 : 1.0;

  let requestFee = 0;
  if (!disableSearch) {
    if (isPro) {
      requestFee =
        contextSize === "high" ? 0.014 : contextSize === "medium" ? 0.01 : 0.005;
    } else {
      requestFee =
        contextSize === "high" ? 0.012 : contextSize === "medium" ? 0.008 : 0.005;
    }
  }

  const tokenCost =
    (promptTokens / 1_000_000) * inputRatePerM +
    (completionTokens / 1_000_000) * outputRatePerM;

  return Number((tokenCost + requestFee).toFixed(6));
}

function isResponsesApiModel(model: PerplexityModel): boolean {
  return model.includes("/");
}

function buildResponsesRequestBody(
  model: PerplexityModel,
  messages: ChatMessage[],
  options: PerplexityBaseOptions
): Record<string, unknown> {
  const sysMessages = messages
    .filter((m) => m.role === "system")
    .map((m) => m.content.trim())
    .filter(Boolean);
  const nonSysMessages = messages.filter((m) => m.role !== "system");

  const inputText =
    nonSysMessages.length === 1
      ? nonSysMessages[0]!.content
      : nonSysMessages
          .map((m) =>
            m.role === "assistant"
              ? `[Assistant]\n${m.content}`
              : `[User]\n${m.content}`
          )
          .join("\n\n");

  const body: Record<string, unknown> = {
    model,
    input: inputText,
    max_output_tokens: options.maxOutputTokens ?? 4000,
    reasoning: { effort: "low" },
  };

  if (sysMessages.length > 0) {
    body.instructions = sysMessages.join("\n\n");
  }

  if (!options.disableSearch) {
    body.tools = [{ type: "web_search" }];
  }

  return body;
}

async function callPerplexityWithRetry(
  body: Record<string, unknown>,
  options: {
    endpoint?: string;
    timeoutMs: number;
    maxRetries: number;
    fetchImpl: typeof fetch;
  }
): Promise<RawPerplexityResponse> {
  const apiKey = getApiKey();
  const endpoint = options.endpoint ?? PERPLEXITY_RESPONSES_ENDPOINT;
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= options.maxRetries; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), options.timeoutMs);

    try {
      const response = await options.fetchImpl(endpoint, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
        signal: controller.signal,
      });

      clearTimeout(timer);

      if (!response.ok) {
        const errBody = await response.text().catch(() => "");
        const safeErrBody = sanitizeSecret(errBody, apiKey);
        const status = response.status;

        // 429 or 5xx -> retryable
        if ((status === 429 || status >= 500) && attempt < options.maxRetries) {
          lastError = new Error(
            `Perplexity HTTP ${status}: ${safeErrBody.slice(0, 200)}`
          );
          continue;
        }

        throw new Error(
          `Perplexity HTTP ${status}: ${safeErrBody.slice(0, 200)}`
        );
      }

      const json = (await response.json()) as RawPerplexityResponse;
      return json;
    } catch (err) {
      clearTimeout(timer);
      const rawMessage =
        err instanceof Error ? err.message : "Unknown Perplexity error";
      const isAbort =
        (err instanceof Error && err.name === "AbortError") ||
        /aborted|timeout/i.test(rawMessage);

      const safeMessage = isAbort
        ? `Perplexity request timed out after ${options.timeoutMs}ms`
        : sanitizeSecret(rawMessage, apiKey);

      lastError = new Error(safeMessage);

      if (attempt < options.maxRetries) {
        continue;
      }
    }
  }

  throw lastError ?? new Error("Perplexity API 호출에 실패했습니다.");
}

function stripCodeFences(rawText: string): string {
  const trimmed = rawText.trim();
  const fenceMatch = /```(?:json)?\s*([\s\S]*?)\s*```/i.exec(trimmed);
  if (fenceMatch) {
    return fenceMatch[1].trim();
  }
  const firstBrace = trimmed.indexOf("{");
  const lastBrace = trimmed.lastIndexOf("}");
  if (firstBrace !== -1 && lastBrace > firstBrace) {
    return trimmed.slice(firstBrace, lastBrace + 1).trim();
  }
  return trimmed;
}

function repairJsonString(str: string): string {
  let inString = false;
  let escaped = false;
  let out = "";
  for (let i = 0; i < str.length; i++) {
    const ch = str[i]!;
    if (escaped) {
      out += ch;
      escaped = false;
      continue;
    }
    if (ch === "\\") {
      out += ch;
      escaped = true;
      continue;
    }
    if (ch === '"') {
      inString = !inString;
      out += ch;
      continue;
    }
    if (inString) {
      if (ch === "\n") {
        out += "\\n";
        continue;
      }
      if (ch === "\r") {
        continue;
      }
      if (ch === "\t") {
        out += "\\t";
        continue;
      }
    }
    out += ch;
  }
  return out.replace(/,\s*([}\]])/g, "$1");
}

/**
 * 1. search(query, options)
 * - 기본 모델: openai/gpt-5.6-sol (/v1/responses + web_search)
 * - 타임아웃(기본 30초), 재시도 2회
 * - 실패 시 needs_human_check: true 반환
 */
export async function search(
  query: string,
  options: PerplexityBaseOptions = {}
): Promise<SearchResult> {
  const startTime = Date.now();
  const model = options.model ?? DEFAULT_PERPLEXITY_MODEL;
  const timeoutMs = options.timeoutMs ?? 30_000;
  const maxRetries = options.maxRetries ?? 2;
  const fetchImpl = options.fetchImpl ?? fetch;

  const messages: ChatMessage[] = [];
  if (options.systemPrompt) {
    messages.push({ role: "system", content: options.systemPrompt });
  }
  messages.push({ role: "user", content: query });

  const useResponsesApi = isResponsesApiModel(model);
  const endpoint = useResponsesApi
    ? PERPLEXITY_RESPONSES_ENDPOINT
    : PERPLEXITY_CHAT_ENDPOINT;

  const requestBody: Record<string, unknown> = useResponsesApi
    ? buildResponsesRequestBody(model, messages, options)
    : {
        model,
        messages,
        temperature: options.temperature ?? 0.1,
        ...(options.searchRecencyFilter
          ? { search_recency_filter: options.searchRecencyFilter }
          : {}),
        ...(options.searchDomainFilter && options.searchDomainFilter.length > 0
          ? { search_domain_filter: options.searchDomainFilter }
          : {}),
        ...(options.disableSearch !== undefined
          ? { disable_search: options.disableSearch }
          : {}),
        ...(options.searchContextSize
          ? {
              web_search_options: {
                search_context_size: options.searchContextSize,
              },
            }
          : {}),
      };

  try {
    const raw = await callPerplexityWithRetry(requestBody, {
      endpoint,
      timeoutMs,
      maxRetries,
      fetchImpl,
    });

    const content = extractTextFromResponse(raw);
    const normalizedSources = normalizePerplexitySources(raw);
    const promptTokens =
      raw.usage?.input_tokens ?? raw.usage?.prompt_tokens ?? 0;
    const completionTokens =
      raw.usage?.output_tokens ?? raw.usage?.completion_tokens ?? 0;
    const totalTokens =
      raw.usage?.total_tokens ?? promptTokens + completionTokens;
    const exactCost = raw.usage?.cost?.total_cost;

    return {
      ok: true,
      content,
      sources: normalizedSources,
      usage: {
        promptTokens,
        completionTokens,
        totalTokens,
        estimatedCostUsd:
          typeof exactCost === "number"
            ? Number(exactCost.toFixed(6))
            : estimateCostUsd(
                model,
                promptTokens,
                completionTokens,
                options.disableSearch,
                options.searchContextSize
              ),
      },
      latencyMs: Date.now() - startTime,
      needs_human_check: false,
    };
  } catch (err) {
    const message = sanitizeSecret(
      err instanceof Error ? err.message : "Perplexity 검색 호출 실패"
    );
    return {
      ok: false,
      content: "",
      sources: [],
      usage: {
        promptTokens: 0,
        completionTokens: 0,
        totalTokens: 0,
        estimatedCostUsd: 0,
      },
      latencyMs: Date.now() - startTime,
      needs_human_check: true,
      failureReason: message,
    };
  }
}

/**
 * 2. generateJson(schema, messages, options)
 * - 기본 모델: openai/gpt-5.6-sol (/v1/responses)
 * - 네트워크/타임아웃 재시도 2회
 * - Zod 스키마 검증 실패 시 1회 재시도 후 실패하면 needs_human_check: true 반환
 */
export async function generateJson<T>(
  schema: z.ZodType<T>,
  messages: ChatMessage[],
  options: PerplexityBaseOptions = {}
): Promise<GenerateJsonResult<T>> {
  const startTime = Date.now();
  const model = options.model ?? DEFAULT_PERPLEXITY_MODEL;
  const timeoutMs = options.timeoutMs ?? 60_000;
  const maxRetries = options.maxRetries ?? 2;
  const fetchImpl = options.fetchImpl ?? fetch;

  let accumulatedPromptTokens = 0;
  let accumulatedCompletionTokens = 0;
  let accumulatedExactCost = 0;
  let hasExactCost = false;
  let lastSources: NormalizedSource[] = [];
  let lastRawContent = "";
  let lastValidationError = "";

  const useResponsesApi = isResponsesApiModel(model);
  const endpoint = useResponsesApi
    ? PERPLEXITY_RESPONSES_ENDPOINT
    : PERPLEXITY_CHAT_ENDPOINT;

  // 초기 1회 + 스키마 검증 실패 시 1회 재시도 (총 2회 시도)
  for (let schemaAttempt = 0; schemaAttempt < 2; schemaAttempt++) {
    const attemptMessages: ChatMessage[] =
      schemaAttempt === 0
        ? messages.map((m, idx) =>
            idx === messages.length - 1 && m.role === "user" && useResponsesApi
              ? {
                  ...m,
                  content: `${m.content}\n\n[출력 형식 지침: 마크다운 설명 없이 오직 유효한 JSON 객체({ ... })만 반환하십시오.]`,
                }
              : m
          )
        : [
            ...messages,
            {
              role: "user",
              content: `이전 응답이 요구된 JSON 스키마를 충족하지 못했습니다(${lastValidationError}). 설명 없이 유효한 JSON 객체만 다시 반환하십시오.`,
            },
          ];

    const requestBody: Record<string, unknown> = useResponsesApi
      ? buildResponsesRequestBody(model, attemptMessages, options)
      : {
          model,
          messages: attemptMessages,
          temperature: options.temperature ?? 0.1,
          ...(options.jsonSchemaObject
            ? {
                response_format: {
                  type: "json_schema",
                  json_schema: {
                    schema: options.jsonSchemaObject,
                  },
                },
              }
            : {}),
          ...(options.searchRecencyFilter
            ? { search_recency_filter: options.searchRecencyFilter }
            : {}),
          ...(options.searchDomainFilter &&
          options.searchDomainFilter.length > 0
            ? { search_domain_filter: options.searchDomainFilter }
            : {}),
          ...(options.disableSearch !== undefined
            ? { disable_search: options.disableSearch }
            : {}),
          ...(options.searchContextSize
            ? {
                web_search_options: {
                  search_context_size: options.searchContextSize,
                },
              }
            : {}),
        };

    try {
      const raw = await callPerplexityWithRetry(requestBody, {
        endpoint,
        timeoutMs,
        maxRetries,
        fetchImpl,
      });

      const promptTokens =
        raw.usage?.input_tokens ?? raw.usage?.prompt_tokens ?? 0;
      const completionTokens =
        raw.usage?.output_tokens ?? raw.usage?.completion_tokens ?? 0;
      accumulatedPromptTokens += promptTokens;
      accumulatedCompletionTokens += completionTokens;
      if (typeof raw.usage?.cost?.total_cost === "number") {
        accumulatedExactCost += raw.usage.cost.total_cost;
        hasExactCost = true;
      }
      lastSources = normalizePerplexitySources(raw);
      lastRawContent = extractTextFromResponse(raw);

      const cleaned = stripCodeFences(lastRawContent);
      let parsedJson: unknown;
      try {
        parsedJson = JSON.parse(cleaned);
      } catch {
        parsedJson = JSON.parse(repairJsonString(cleaned));
      }
      const validated = schema.safeParse(parsedJson);

      if (validated.success) {
        const totalTokens =
          accumulatedPromptTokens + accumulatedCompletionTokens;
        return {
          ok: true,
          data: validated.data,
          rawContent: lastRawContent,
          sources: lastSources,
          usage: {
            promptTokens: accumulatedPromptTokens,
            completionTokens: accumulatedCompletionTokens,
            totalTokens,
            estimatedCostUsd: hasExactCost
              ? Number(accumulatedExactCost.toFixed(6))
              : estimateCostUsd(
                  model,
                  accumulatedPromptTokens,
                  accumulatedCompletionTokens,
                  options.disableSearch,
                  options.searchContextSize
                ),
          },
          latencyMs: Date.now() - startTime,
          needs_human_check: false,
        };
      }

      lastValidationError = validated.error.issues
        .map((i) => `${i.path.join(".")}: ${i.message}`)
        .join("; ");
    } catch (err) {
      const msg = sanitizeSecret(
        err instanceof Error ? err.message : "JSON 파싱 또는 API 오류"
      );

      // 네트워크/HTTP 최종 실패인 경우 즉시 needs_human_check 반환
      if (
        msg.startsWith("Perplexity HTTP") ||
        msg.startsWith("Perplexity request timed out") ||
        msg.includes("PERPLEXITY_API_KEY")
      ) {
        return {
          ok: false,
          data: null,
          sources: lastSources,
          usage: {
            promptTokens: accumulatedPromptTokens,
            completionTokens: accumulatedCompletionTokens,
            totalTokens:
              accumulatedPromptTokens + accumulatedCompletionTokens,
            estimatedCostUsd: 0,
          },
          latencyMs: Date.now() - startTime,
          needs_human_check: true,
          failureReason: msg,
        };
      }

      lastValidationError = msg;
    }
  }

  return {
    ok: false,
    data: null,
    rawContent: lastRawContent,
    sources: lastSources,
    usage: {
      promptTokens: accumulatedPromptTokens,
      completionTokens: accumulatedCompletionTokens,
      totalTokens: accumulatedPromptTokens + accumulatedCompletionTokens,
      estimatedCostUsd: hasExactCost
        ? Number(accumulatedExactCost.toFixed(6))
        : estimateCostUsd(
            model,
            accumulatedPromptTokens,
            accumulatedCompletionTokens,
            options.disableSearch,
            options.searchContextSize
          ),
    },
    latencyMs: Date.now() - startTime,
    needs_human_check: true,
    failureReason: `JSON 스키마 검증 실패 (1회 재시도 후): ${lastValidationError}`,
  };
}

/**
 * 3. DB sources 테이블에 정규화된 출처 목록 저장 및 조회
 */
export interface SaveSourcesParams {
  jobId: string;
  stage: string;
  usedFor?: string;
  items: NormalizedSource[];
}

export function saveSourcesToDb(params: SaveSourcesParams): SourceRecord[] {
  if (params.items.length === 0) {
    return [];
  }

  const rows: SourceRecord[] = params.items.map((item) => ({
    id: crypto.randomUUID(),
    job_id: params.jobId,
    stage: params.stage,
    url: item.url,
    title: item.title,
    publisher: item.publisher ?? null,
    published_at: item.publishedAt ?? null,
    snippet: item.snippet ?? null,
    used_for: params.usedFor ?? null,
  }));

  db.insert(sources).values(rows).run();
  return rows;
}

export function getSourcesByJobId(jobId: string): SourceRecord[] {
  return db.select().from(sources).where(eq(sources.job_id, jobId)).all();
}
