CREATE TABLE `incidents` (
	`id` text PRIMARY KEY NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`title` text NOT NULL,
	`status` text NOT NULL,
	`visibility` text DEFAULT 'private' NOT NULL,
	`commitments` text,
	`created_by` text NOT NULL,
	`affected_resources` text,
	`timeline` text
);
