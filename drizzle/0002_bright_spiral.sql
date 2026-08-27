CREATE TABLE `announcements` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`body` text,
	`link` text,
	`recipient_count` integer DEFAULT 0 NOT NULL,
	`sent_by` text NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`sent_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
ALTER TABLE `workspaces` ADD `verified_at` integer;