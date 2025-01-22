ALTER TABLE "notes" ALTER COLUMN "title" SET DATA TYPE varchar(128);--> statement-breakpoint
ALTER TABLE "notes" ALTER COLUMN "author_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "notes" ALTER COLUMN "status" SET NOT NULL;