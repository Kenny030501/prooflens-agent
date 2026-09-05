CREATE TABLE `execution_receipts` (
	`id` text PRIMARY KEY NOT NULL,
	`request_hash` text NOT NULL,
	`day` text NOT NULL,
	`state` text NOT NULL,
	`reserved_micros` integer NOT NULL,
	`charged_micros` integer NOT NULL,
	`model` text NOT NULL,
	`claim_count` integer NOT NULL,
	`status_counts` text DEFAULT '{}' NOT NULL,
	`provider_receipt` text,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_receipts_day` ON `execution_receipts` (`day`);--> statement-breakpoint
CREATE TABLE `source_documents` (
	`id` text PRIMARY KEY NOT NULL,
	`ticker` text NOT NULL,
	`filed_at` text NOT NULL,
	`url` text NOT NULL,
	`sha256` text NOT NULL,
	`corpus_version` text NOT NULL
);
