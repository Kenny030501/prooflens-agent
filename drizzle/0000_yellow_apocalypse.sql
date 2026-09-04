CREATE TABLE `audit_runs` (
	`id` text PRIMARY KEY NOT NULL,
	`agent_id` text NOT NULL,
	`ticker` text NOT NULL,
	`claim_count` integer NOT NULL,
	`supported_count` integer NOT NULL,
	`flagged_count` integer NOT NULL,
	`gate_decision` text NOT NULL,
	`pre_confidence` integer,
	`post_confidence` integer,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_audit_runs_created_at` ON `audit_runs` (`created_at`);--> statement-breakpoint
CREATE INDEX `idx_audit_runs_agent_created` ON `audit_runs` (`agent_id`,`created_at`);--> statement-breakpoint
CREATE TABLE `behavior_events` (
	`id` text PRIMARY KEY NOT NULL,
	`case_id` text,
	`event_name` text NOT NULL,
	`agent_id` text,
	`ticker` text,
	`metadata_json` text DEFAULT '{}' NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_behavior_events_case_id` ON `behavior_events` (`case_id`);--> statement-breakpoint
CREATE INDEX `idx_behavior_events_created_at` ON `behavior_events` (`created_at`);