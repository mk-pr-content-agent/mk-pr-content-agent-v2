import "server-only";
import crypto from "crypto";
import fs from "fs";
import path from "path";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { audit_logs, users } from "@/db/schema";
import type { PerplexityUsage } from "./perplexity";

export interface LlmUsageRecord {
  id: string;
  jobId: string;
  stage: string;
  model: string;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  estimatedCostUsd: number;
  createdAt: string;
}

export interface LlmUsageSummary {
  callCount: number;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  estimatedCostUsd: number;
  estimatedCostKrw: number;
}

const KRW_PER_USD = 1400;

export function recordLlmUsage(params: {
  jobId: string;
  stage: string;
  model: string;
  usage: PerplexityUsage;
}): void {
  const { jobId, stage, model, usage } = params;
  if (usage.totalTokens === 0 && usage.estimatedCostUsd === 0) {
    return;
  }

  const defaultUser = db.select().from(users).get();
  if (!defaultUser) return;

  db.insert(audit_logs)
    .values({
      id: crypto.randomUUID(),
      user_id: defaultUser.id,
      action: "LLM_USAGE",
      target: jobId,
      detail_json: JSON.stringify({
        stage,
        model,
        promptTokens: usage.promptTokens,
        completionTokens: usage.completionTokens,
        totalTokens: usage.totalTokens,
        estimatedCostUsd: usage.estimatedCostUsd,
      }),
      created_at: new Date().toISOString(),
    })
    .run();
}

export function getLlmUsageStats(jobId?: string): {
  totalSummary: LlmUsageSummary;
  jobSummary: LlmUsageSummary | null;
  recentRecords: LlmUsageRecord[];
} {
  const rows = db
    .select()
    .from(audit_logs)
    .where(eq(audit_logs.action, "LLM_USAGE"))
    .orderBy(desc(audit_logs.created_at))
    .all();

  const records: LlmUsageRecord[] = rows.map((r) => {
    let parsed: {
      stage?: string;
      model?: string;
      promptTokens?: number;
      completionTokens?: number;
      totalTokens?: number;
      estimatedCostUsd?: number;
    } = {};
    try {
      parsed = JSON.parse(r.detail_json);
    } catch {
      parsed = {};
    }
    return {
      id: r.id,
      jobId: r.target,
      stage: parsed.stage ?? "-",
      model: parsed.model ?? "sonar",
      promptTokens: Number(parsed.promptTokens ?? 0),
      completionTokens: Number(parsed.completionTokens ?? 0),
      totalTokens: Number(parsed.totalTokens ?? 0),
      estimatedCostUsd: Number(parsed.estimatedCostUsd ?? 0),
      createdAt: r.created_at,
    };
  });

  const summarize = (list: LlmUsageRecord[]): LlmUsageSummary => {
    const promptTokens = list.reduce((acc, x) => acc + x.promptTokens, 0);
    const completionTokens = list.reduce(
      (acc, x) => acc + x.completionTokens,
      0
    );
    const totalTokens = list.reduce((acc, x) => acc + x.totalTokens, 0);
    const estimatedCostUsd = Number(
      list.reduce((acc, x) => acc + x.estimatedCostUsd, 0).toFixed(6)
    );
    return {
      callCount: list.length,
      promptTokens,
      completionTokens,
      totalTokens,
      estimatedCostUsd,
      estimatedCostKrw: Math.round(estimatedCostUsd * KRW_PER_USD),
    };
  };

  return {
    totalSummary: summarize(records),
    jobSummary: jobId
      ? summarize(records.filter((r) => r.jobId === jobId))
      : null,
    recentRecords: records.slice(0, 30),
  };
}

export function getMaskedApiKeyStatus(): {
  hasApiKey: boolean;
  maskedKey: string | null;
} {
  const raw = process.env.PERPLEXITY_API_KEY?.trim() ?? "";
  if (!raw) {
    return { hasApiKey: false, maskedKey: null };
  }
  const visibleSuffix = raw.slice(-4);
  const prefix = raw.startsWith("pplx-") ? "pplx-" : raw.slice(0, 4);
  return {
    hasApiKey: true,
    maskedKey: `${prefix}••••••••••••${visibleSuffix}`,
  };
}

export function saveApiKeyToEnvLocal(newKey: string): void {
  const trimmed = newKey.trim();
  process.env.PERPLEXITY_API_KEY = trimmed;

  const envPath = path.join(process.cwd(), ".env.local");
  let existingContent = "";
  if (fs.existsSync(envPath)) {
    existingContent = fs.readFileSync(envPath, "utf-8");
  }

  const lines = existingContent
    .split(/\r?\n/)
    .filter((line) => !line.trim().startsWith("PERPLEXITY_API_KEY="));

  if (trimmed) {
    lines.push(`PERPLEXITY_API_KEY=${trimmed}`);
  }

  const finalContent =
    lines.filter((l, i, arr) => l !== "" || i < arr.length - 1).join("\n") +
    "\n";
  fs.writeFileSync(envPath, finalContent, "utf-8");
}
