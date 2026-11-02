CREATE TABLE IF NOT EXISTS `sources` (
	`id` text PRIMARY KEY NOT NULL,
	`job_id` text NOT NULL,
	`stage` text NOT NULL,
	`url` text NOT NULL,
	`title` text NOT NULL,
	`publisher` text,
	`published_at` text,
	`snippet` text,
	`used_for` text
);
