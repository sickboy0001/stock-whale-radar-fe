CREATE TABLE `bucket_items` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`bucket_id` integer,
	`sec_code` text NOT NULL,
	FOREIGN KEY (`bucket_id`) REFERENCES `user_buckets`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `documents` (
	`doc_id` text PRIMARY KEY NOT NULL,
	`submit_datetime` text,
	`ordinance_code` text,
	`form_code` text,
	`doc_type_code` text,
	`doc_description` text,
	`submitter_edinet_code` text,
	`submitter_name` text,
	`sec_code` text,
	`jcn` text,
	`fund_code` text,
	`issuer_edinet_code` text,
	`subject_edinet_code` text,
	`issuer_name` text,
	`withdrawal_status` integer,
	`doc_info_edit_status` integer,
	`disclosure_status` integer,
	`xbrl_flag` integer,
	`pdf_flag` integer,
	`csv_flag` integer,
	`legal_status` integer,
	`processed_status` integer DEFAULT 0
);
--> statement-breakpoint
CREATE TABLE `edinet_codes` (
	`edinet_code` text PRIMARY KEY NOT NULL,
	`submitter_type` text,
	`listing_status` text,
	`consolidated` text,
	`capital` integer,
	`settlement_date` text,
	`filer_name` text NOT NULL,
	`filer_name_en` text,
	`filer_name_kana` text,
	`address` text,
	`industry` text,
	`sec_code` text,
	`jcn` text
);
--> statement-breakpoint
CREATE TABLE `fund_codes` (
	`fund_code` text PRIMARY KEY NOT NULL,
	`sec_code` text,
	`fund_name` text NOT NULL,
	`fund_name_kana` text,
	`specific_period1` text,
	`specific_period2` text,
	`edinet_code` text,
	`issuer_name` text
);
--> statement-breakpoint
CREATE TABLE `import_daily_status` (
	`target_date` text PRIMARY KEY NOT NULL,
	`status` text NOT NULL,
	`total_docs_count` integer,
	`target_docs_count` integer,
	`success_count` integer,
	`last_run_start_at` text,
	`last_run_end_at` text,
	`error_message` text
);
--> statement-breakpoint
CREATE TABLE `investor_profiles` (
	`edinet_code` text PRIMARY KEY NOT NULL,
	`official_name` text,
	`display_name` text,
	`summary` text,
	`aum` text,
	`established` text,
	`key_people` text,
	`location` text,
	`website` text,
	`last_updated` text
);
--> statement-breakpoint
CREATE TABLE `ownership_reports` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`doc_id` text,
	`obligation_date` text,
	`holding_ratio` real,
	`prev_holding_ratio` real,
	`holding_purpose` text,
	`is_joint_holding` integer,
	FOREIGN KEY (`doc_id`) REFERENCES `documents`(`doc_id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `user_buckets` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` text NOT NULL,
	`name` text NOT NULL,
	`description` text
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`email` text NOT NULL,
	`display_name` text,
	`image_url` text,
	`google_id` text,
	`email_verified` integer DEFAULT true,
	`is_admin` integer DEFAULT false,
	`created_at` integer DEFAULT (strftime('%s', 'now')),
	`updated_at` integer DEFAULT (strftime('%s', 'now'))
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_unique` ON `users` (`email`);--> statement-breakpoint
CREATE UNIQUE INDEX `users_google_id_unique` ON `users` (`google_id`);--> statement-breakpoint
CREATE TABLE `view_history` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` text,
	`guest_id` text,
	`target_type` text NOT NULL,
	`target_code` text NOT NULL,
	`viewed_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_view_history_user_guest` ON `view_history` (`user_id`,`guest_id`);--> statement-breakpoint
CREATE INDEX `idx_view_history_viewed_at` ON `view_history` (`viewed_at`);--> statement-breakpoint
CREATE INDEX `idx_view_history_target` ON `view_history` (`target_type`,`target_code`);