import fs from "fs";
import path from "path";
import YAML from "yaml";
import { z } from "zod";

export const RuleSeveritySchema = z.enum(["BLOCK", "WARN", "INFO"]);
export type RuleSeverity = z.infer<typeof RuleSeveritySchema>;

export const RuleDetectorSchema = z.enum(["code", "llm"]);
export type RuleDetector = z.infer<typeof RuleDetectorSchema>;

export const RuleDefinitionSchema = z.object({
  id: z.string(),
  source: z.string(),
  severity: RuleSeveritySchema,
  detector: RuleDetectorSchema,
  action: z.string().optional(),
  message: z.string(),
  params: z.record(z.string(), z.unknown()).optional(),
});

export type RuleDefinition = z.infer<typeof RuleDefinitionSchema>;

export const HardRulesFileSchema = z.object({
  rules: z.array(RuleDefinitionSchema),
});

export const RestrictedTopicsFileSchema = z.object({
  document_sources: z.array(z.string()),
  ad_article_restricted_materials: z.array(
    z.object({
      id: z.string(),
      category: z.string(),
      items: z.array(z.string()),
      default_action: z.string(),
      emphasized: z.boolean(),
    })
  ),
  workflow_restricted_topics: z.array(
    z.object({
      id: z.string(),
      category: z.string(),
      detail: z.string(),
      default_action: z.string(),
    })
  ),
});

export type RestrictedTopicsData = z.infer<typeof RestrictedTopicsFileSchema>;

export const RejectMessagesFileSchema = z.object({
  reject_messages: z.array(
    z.object({
      id: z.string(),
      reason: z.string(),
      message: z.string(),
    })
  ),
});

export type RejectMessagesData = z.infer<typeof RejectMessagesFileSchema>;

export const BannedWordsFileSchema = z.object({
  superlative_terms: z.array(
    z.object({
      term: z.string(),
      suggestion: z.string(),
    })
  ),
  promotional_tones: z.array(
    z.object({
      term: z.string(),
      replacement: z.string(),
    })
  ),
});

export type BannedWordsData = z.infer<typeof BannedWordsFileSchema>;

let cachedHardRules: Map<string, RuleDefinition> | null = null;
let cachedBannedWords: BannedWordsData | null = null;
let cachedRestrictedTopics: RestrictedTopicsData | null = null;
let cachedRejectMessages: RejectMessagesData | null = null;

export function loadHardRules(
  filePath = path.join(process.cwd(), "rules", "hard-rules.yaml")
): Map<string, RuleDefinition> {
  if (cachedHardRules) return cachedHardRules;
  const raw = fs.readFileSync(filePath, "utf-8");
  const parsed = HardRulesFileSchema.parse(YAML.parse(raw));
  const map = new Map<string, RuleDefinition>();
  for (const rule of parsed.rules) {
    map.set(rule.id, rule);
  }
  cachedHardRules = map;
  return map;
}

export function loadBannedWords(
  filePath = path.join(process.cwd(), "data", "banned-words.yaml")
): BannedWordsData {
  if (cachedBannedWords) return cachedBannedWords;
  const raw = fs.readFileSync(filePath, "utf-8");
  cachedBannedWords = BannedWordsFileSchema.parse(YAML.parse(raw));
  return cachedBannedWords;
}

export function loadRestrictedTopics(
  filePath = path.join(process.cwd(), "rules", "restricted-topics.yaml")
): RestrictedTopicsData {
  if (cachedRestrictedTopics) return cachedRestrictedTopics;
  const raw = fs.readFileSync(filePath, "utf-8");
  cachedRestrictedTopics = RestrictedTopicsFileSchema.parse(YAML.parse(raw));
  return cachedRestrictedTopics;
}

export function loadRejectMessages(
  filePath = path.join(process.cwd(), "rules", "reject-messages.yaml")
): RejectMessagesData {
  if (cachedRejectMessages) return cachedRejectMessages;
  const raw = fs.readFileSync(filePath, "utf-8");
  cachedRejectMessages = RejectMessagesFileSchema.parse(YAML.parse(raw));
  return cachedRejectMessages;
}

export function clearRuleCache(): void {
  cachedHardRules = null;
  cachedBannedWords = null;
  cachedRestrictedTopics = null;
  cachedRejectMessages = null;
}
