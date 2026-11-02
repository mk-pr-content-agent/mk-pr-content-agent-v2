CREATE TABLE IF NOT EXISTS `jobs` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`mode` text DEFAULT 'ad_article' NOT NULL,
	`status` text DEFAULT 'draft' NOT NULL,
	`verdict` text,
	`company_name` text,
	`raw_text` text NOT NULL,
	`options_json` text DEFAULT '{}' NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `stage_results` (
	`id` text PRIMARY KEY NOT NULL,
	`job_id` text NOT NULL,
	`stage` text NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`output_json` text DEFAULT '{}' NOT NULL,
	`started_at` text,
	`finished_at` text,
	`error` text
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `claims` (
	`id` text PRIMARY KEY NOT NULL,
	`job_id` text NOT NULL,
	`text` text NOT NULL,
	`type` text NOT NULL,
	`status` text DEFAULT 'self_claim' NOT NULL,
	`evidence_request` text,
	`usable_in_article` text DEFAULT 'attributed_only' NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `articles` (
	`id` text PRIMARY KEY NOT NULL,
	`job_id` text NOT NULL,
	`version` integer DEFAULT 1 NOT NULL,
	`title` text NOT NULL,
	`subtitle` text DEFAULT '' NOT NULL,
	`body` text NOT NULL,
	`caption_json` text DEFAULT '[]' NOT NULL,
	`ai_notice_included` integer DEFAULT 0 NOT NULL,
	`created_by` text DEFAULT 'ai' NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `rule_findings` (
	`id` text PRIMARY KEY NOT NULL,
	`job_id` text NOT NULL,
	`article_version` integer DEFAULT 1 NOT NULL,
	`rule_id` text NOT NULL,
	`severity` text NOT NULL,
	`location_json` text DEFAULT '{}' NOT NULL,
	`message` text NOT NULL,
	`resolved` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `competitors` (
	`id` text PRIMARY KEY NOT NULL,
	`job_id` text NOT NULL,
	`name` text NOT NULL,
	`summary` text NOT NULL,
	`source_url` text NOT NULL,
	`selected` integer DEFAULT 1 NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `notifications` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`job_id` text NOT NULL,
	`type` text NOT NULL,
	`message` text NOT NULL,
	`reasons_json` text DEFAULT '[]' NOT NULL,
	`read_at` text,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `approvals` (
	`id` text PRIMARY KEY NOT NULL,
	`job_id` text NOT NULL,
	`user_id` text NOT NULL,
	`checklist_json` text DEFAULT '{}' NOT NULL,
	`naver_excluded` integer DEFAULT 1 NOT NULL,
	`approved_at` text NOT NULL,
	`override_reason` text
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `audit_logs` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`action` text NOT NULL,
	`target` text NOT NULL,
	`detail_json` text DEFAULT '{}' NOT NULL,
	`created_at` text NOT NULL
);
