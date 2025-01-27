CREATE TABLE "user_verifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"otp" varchar(256) NOT NULL,
	"otp_expiration" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp
);
--> statement-breakpoint
DROP TABLE "email_verification" CASCADE;--> statement-breakpoint
ALTER TABLE "user_verifications" ADD CONSTRAINT "user_verifications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "user_id_index" ON "user_verifications" USING btree ("user_id");