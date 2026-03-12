CREATE TABLE "calendar_event" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"note_id" text,
	"title" text DEFAULT 'Untitled' NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"kind" text DEFAULT 'event' NOT NULL,
	"status" text DEFAULT 'todo' NOT NULL,
	"starts_at" timestamp NOT NULL,
	"ends_at" timestamp,
	"all_day" boolean DEFAULT false NOT NULL,
	"location" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "calendar_event" ADD CONSTRAINT "calendar_event_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "calendar_event" ADD CONSTRAINT "calendar_event_note_id_note_id_fk" FOREIGN KEY ("note_id") REFERENCES "public"."note"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "calendar_event_user_id_idx" ON "calendar_event" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "calendar_event_note_id_idx" ON "calendar_event" USING btree ("note_id");--> statement-breakpoint
CREATE INDEX "calendar_event_starts_at_idx" ON "calendar_event" USING btree ("starts_at");--> statement-breakpoint
CREATE INDEX "calendar_event_kind_idx" ON "calendar_event" USING btree ("kind");--> statement-breakpoint
CREATE INDEX "calendar_event_status_idx" ON "calendar_event" USING btree ("status");
