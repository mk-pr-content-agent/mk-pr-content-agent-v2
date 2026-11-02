import type { RuleFinding } from "@/lib/rules/hard-rules";
import type { NormalizedSource } from "@/lib/llm/perplexity";

export type JobMode = "ad_article" | "comparative";
export type VerdictType = "PASS" | "PASS_WITH_EDIT" | "HOLD" | "REJECT";

export interface JobOptions {
  category?: string;
  outlet?: string;
  byline?: string;
  captions?: string[];
  photoCount?: number;
  photoMaxDimPx?: number;
  portraitConsentChecked?: boolean;
  companyProvidedPhotoConfirmed?: boolean;
  includeAiNotice?: boolean;
  overrideRejectReason?: string;
}

export interface ExtractedClaim {
  id: string;
  text: string;
  type: "metric" | "certification" | "partnership" | "entity" | "schedule" | "general";
  status: "verified" | "evidence_required" | "self_claim" | "unverifiable";
  evidenceRequest?: string;
  usableInArticle: "yes" | "attributed_only" | "no";
}

export interface S0Output {
  normalizedText: string;
  companyName: string;
  representativeName?: string;
  numbers: string[];
  dates: string[];
  locations: string[];
  claims: ExtractedClaim[];
  needs_human_check?: boolean;
}

export interface DuplicateArticleItem {
  title: string;
  publisher?: string;
  url: string;
  publishedAt?: string;
}

export interface S1Output {
  duplicateCount: number;
  threshold: number;
  verdict: "PASS" | "HOLD";
  similarArticles: DuplicateArticleItem[];
  differentiationAdvice: string;
  sources: NormalizedSource[];
  needs_human_check?: boolean;
}

export interface S2Output {
  hasOfficialHomepage: boolean;
  homepageUrl?: string;
  snsOnly: boolean;
  verdict: "PASS" | "HOLD" | "REJECT";
  rejectCode?: string;
  rejectMessage?: string;
  businessVerifiedSummary: string;
  sources: NormalizedSource[];
  needs_human_check?: boolean;
}

export interface RestrictedMatch {
  ruleId: string;
  category: string;
  matchedKeyword: string;
  evidenceQuote: string;
  action: "REJECT" | "HOLD";
  rejectMessage?: string;
}

export interface S3Output {
  verdict: "PASS" | "HOLD" | "REJECT";
  matches: RestrictedMatch[];
  primaryRejectMessage?: string;
  needs_human_check?: boolean;
}

export interface S4Output {
  claims: ExtractedClaim[];
  evidenceRequiredList: string[];
  hasMajorCorpMention: boolean;
  verdict: "PASS" | "HOLD";
  sources: NormalizedSource[];
}

export interface SanitizedDiff {
  original: string;
  replacement: string;
  reason: string;
}

export interface S5Output {
  sanitizedText: string;
  diffs: SanitizedDiff[];
  verdict: "PASS" | "PASS_WITH_EDIT";
}

export interface CompetitorCandidate {
  name: string;
  summary: string;
  sourceUrl: string;
  selected: boolean;
}

export interface S6Output {
  mode: JobMode;
  titleCandidates: string[];
  title: string;
  subtitle: string;
  body: string;
  captions: string[];
  competitors: CompetitorCandidate[];
  sources: NormalizedSource[];
}

export interface S7Output {
  titleCandidates: string[];
  title: string;
  subtitle: string;
  body: string;
  styleEdits: SanitizedDiff[];
}

export interface S8Output {
  verdict: "PASS" | "WARN";
  warnings: string[];
  normalizedCaptions: string[];
}

export interface NaverRuleCheckItem {
  code: string;
  name: string;
  penalty: string;
  status: "PASS" | "WARN" | "BLOCK";
  detail: string;
}

export interface S9Output {
  hardRuleFindings: RuleFinding[];
  naverChecklist: NaverRuleCheckItem[];
  overallVerdict: VerdictType;
  charCountTitle: number;
  charCountBody: number;
}

export interface S10Output {
  readyForApproval: boolean;
  naverExcludedRecommended: boolean;
  requiredChecklist: Array<{ id: string; label: string }>;
}
