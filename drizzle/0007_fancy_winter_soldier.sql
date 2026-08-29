PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_comments` (
	`id` text PRIMARY KEY NOT NULL,
	`post_id` text,
	`kb_article_id` text,
	`author_id` text NOT NULL,
	`content` text NOT NULL,
	`deleted_at` integer,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`post_id`) REFERENCES `posts`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`kb_article_id`) REFERENCES `kb_articles`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`author_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_comments`("id", "post_id", "author_id", "content", "deleted_at", "created_at", "updated_at") SELECT "id", "post_id", "author_id", "content", "deleted_at", "created_at", "updated_at" FROM `comments`;--> statement-breakpoint
DROP TABLE `comments`;--> statement-breakpoint
ALTER TABLE `__new_comments` RENAME TO `comments`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE INDEX `comments_post_idx` ON `comments` (`post_id`,`created_at`);--> statement-breakpoint
CREATE INDEX `comments_kb_article_idx` ON `comments` (`kb_article_id`,`created_at`);--> statement-breakpoint
ALTER TABLE `reactions` ADD `kb_article_id` text REFERENCES kb_articles(id);--> statement-breakpoint
CREATE UNIQUE INDEX `reactions_kb_article_user_idx` ON `reactions` (`kb_article_id`,`user_id`);