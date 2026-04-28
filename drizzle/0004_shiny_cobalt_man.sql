ALTER TABLE "note" ADD COLUMN "icon" text;--> statement-breakpoint
ALTER TABLE "note" ADD COLUMN "is_favorite" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "note" ADD COLUMN "is_archived" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "note" ADD COLUMN "archived_at" timestamp;--> statement-breakpoint
CREATE INDEX "note_is_favorite_idx" ON "note" USING btree ("is_favorite");--> statement-breakpoint
CREATE INDEX "note_is_archived_idx" ON "note" USING btree ("is_archived");