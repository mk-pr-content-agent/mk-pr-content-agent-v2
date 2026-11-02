import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  email: text("email").notNull().unique(),
  password_hash: text("password_hash").notNull(),
  role: text("role", { enum: ["admin", "editor"] }).notNull().default("editor"),
  created_at: text("created_at").notNull(),
});

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

export const jobs = sqliteTable("jobs", {
  id: text("id").primaryKey(),
  user_id: text("user_id").notNull(),
  mode: text("mode", { enum: ["ad_article", "comparative"] })
    .notNull()
    .default("ad_article"),
  status: text("status", {
    enum: ["draft", "running", "hold", "rejected", "completed", "approved"],
  })
    .notNull()
    .default("draft"),
  verdict: text("verdict", {
    enum: ["PASS", "PASS_WITH_EDIT", "HOLD", "REJECT"],
  }),
  company_name: text("company_name"),
  raw_text: text("raw_text").notNull(),
  options_json: text("options_json").notNull().default("{}"),
  created_at: text("created_at").notNull(),
  updated_at: text("updated_at").notNull(),
});

export type JobRecord = typeof jobs.$inferSelect;
export type NewJobRecord = typeof jobs.$inferInsert;

export const stage_results = sqliteTable("stage_results", {
  id: text("id").primaryKey(),
  job_id: text("job_id").notNull(),
  stage: text("stage").notNull(),
  status: text("status", {
    enum: ["pending", "running", "completed", "failed", "skipped"],
  })
    .notNull()
    .default("pending"),
  output_json: text("output_json").notNull().default("{}"),
  started_at: text("started_at"),
  finished_at: text("finished_at"),
  error: text("error"),
});

export type StageResultRecord = typeof stage_results.$inferSelect;

export const claims = sqliteTable("claims", {
  id: text("id").primaryKey(),
  job_id: text("job_id").notNull(),
  text: text("text").notNull(),
  type: text("type").notNull(),
  status: text("status", {
    enum: ["verified", "evidence_required", "self_claim", "unverifiable"],
  })
    .notNull()
    .default("self_claim"),
  evidence_request: text("evidence_request"),
  usable_in_article: text("usable_in_article", {
    enum: ["yes", "attributed_only", "no"],
  })
    .notNull()
    .default("attributed_only"),
});

export type ClaimRecord = typeof claims.$inferSelect;

export const sources = sqliteTable("sources", {
  id: text("id").primaryKey(),
  job_id: text("job_id").notNull(),
  stage: text("stage").notNull(),
  url: text("url").notNull(),
  title: text("title").notNull(),
  publisher: text("publisher"),
  published_at: text("published_at"),
  snippet: text("snippet"),
  used_for: text("used_for"),
});

export type SourceRecord = typeof sources.$inferSelect;
export type NewSourceRecord = typeof sources.$inferInsert;

export const articles = sqliteTable("articles", {
  id: text("id").primaryKey(),
  job_id: text("job_id").notNull(),
  version: integer("version").notNull().default(1),
  title: text("title").notNull(),
  subtitle: text("subtitle").notNull().default(""),
  body: text("body").notNull(),
  caption_json: text("caption_json").notNull().default("[]"),
  ai_notice_included: integer("ai_notice_included").notNull().default(0),
  created_by: text("created_by", { enum: ["ai", "user"] })
    .notNull()
    .default("ai"),
});

export type ArticleRecord = typeof articles.$inferSelect;

export const rule_findings = sqliteTable("rule_findings", {
  id: text("id").primaryKey(),
  job_id: text("job_id").notNull(),
  article_version: integer("article_version").notNull().default(1),
  rule_id: text("rule_id").notNull(),
  severity: text("severity", { enum: ["BLOCK", "WARN", "INFO"] }).notNull(),
  location_json: text("location_json").notNull().default("{}"),
  message: text("message").notNull(),
  resolved: integer("resolved").notNull().default(0),
});

export type RuleFindingRecord = typeof rule_findings.$inferSelect;

export const competitors = sqliteTable("competitors", {
  id: text("id").primaryKey(),
  job_id: text("job_id").notNull(),
  name: text("name").notNull(),
  summary: text("summary").notNull(),
  source_url: text("source_url").notNull(),
  selected: integer("selected").notNull().default(1),
});

export type CompetitorRecord = typeof competitors.$inferSelect;

export const notifications = sqliteTable("notifications", {
  id: text("id").primaryKey(),
  user_id: text("user_id").notNull(),
  job_id: text("job_id").notNull(),
  type: text("type", { enum: ["reject", "hold"] }).notNull(),
  message: text("message").notNull(),
  reasons_json: text("reasons_json").notNull().default("[]"),
  read_at: text("read_at"),
  created_at: text("created_at").notNull(),
});

export type NotificationRecord = typeof notifications.$inferSelect;

export const approvals = sqliteTable("approvals", {
  id: text("id").primaryKey(),
  job_id: text("job_id").notNull(),
  user_id: text("user_id").notNull(),
  checklist_json: text("checklist_json").notNull().default("{}"),
  naver_excluded: integer("naver_excluded").notNull().default(1),
  approved_at: text("approved_at").notNull(),
  override_reason: text("override_reason"),
});

export type ApprovalRecord = typeof approvals.$inferSelect;

export const audit_logs = sqliteTable("audit_logs", {
  id: text("id").primaryKey(),
  user_id: text("user_id").notNull(),
  action: text("action").notNull(),
  target: text("target").notNull(),
  detail_json: text("detail_json").notNull().default("{}"),
  created_at: text("created_at").notNull(),
});

export type AuditLogRecord = typeof audit_logs.$inferSelect;
