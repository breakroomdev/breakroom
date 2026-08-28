CREATE TABLE `integrations` (
	`id` text PRIMARY KEY NOT NULL,
	`workspace_id` text NOT NULL,
	`type` text NOT NULL,
	`name` text NOT NULL,
	`enabled` integer DEFAULT true NOT NULL,
	`config` text DEFAULT '{}' NOT NULL,
	`secret_hash` text,
	`secret_last_four` text,
	`last_activity_at` integer,
	`last_error_at` integer,
	`last_error` text,
	`message_count` integer DEFAULT 0 NOT NULL,
	`created_by` text NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`workspace_id`) REFERENCES `workspaces`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `integrations_workspace_idx` ON `integrations` (`workspace_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `integrations_secret_hash_idx` ON `integrations` (`secret_hash`);--> statement-breakpoint
CREATE TABLE `roblox_chat_messages` (
	`id` text PRIMARY KEY NOT NULL,
	`workspace_id` text NOT NULL,
	`integration_id` text NOT NULL,
	`universe_id` text NOT NULL,
	`place_id` text NOT NULL,
	`job_id` text NOT NULL,
	`user_id` integer NOT NULL,
	`username` text NOT NULL,
	`display_name` text NOT NULL,
	`message` text NOT NULL,
	`timestamp` integer NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`workspace_id`) REFERENCES `workspaces`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`integration_id`) REFERENCES `integrations`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `roblox_chat_messages_workspace_idx` ON `roblox_chat_messages` (`workspace_id`,`timestamp`);--> statement-breakpoint
CREATE INDEX `roblox_chat_messages_integration_idx` ON `roblox_chat_messages` (`integration_id`,`timestamp`);--> statement-breakpoint
CREATE INDEX `roblox_chat_messages_user_idx` ON `roblox_chat_messages` (`user_id`);--> statement-breakpoint
CREATE INDEX `roblox_chat_messages_username_idx` ON `roblox_chat_messages` (`username`);--> statement-breakpoint
CREATE INDEX `roblox_chat_messages_timestamp_idx` ON `roblox_chat_messages` (`timestamp`);--> statement-breakpoint
CREATE TABLE `roblox_profile_cache` (
	`user_id` integer PRIMARY KEY NOT NULL,
	`username` text NOT NULL,
	`display_name` text NOT NULL,
	`avatar_url` text,
	`fetched_at` integer NOT NULL
);
