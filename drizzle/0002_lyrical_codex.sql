CREATE TABLE "note_folder" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"name" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "note_folder" ADD CONSTRAINT "note_folder_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "note" ADD COLUMN "folder_id" text;
--> statement-breakpoint
ALTER TABLE "note" ADD CONSTRAINT "note_folder_id_note_folder_id_fk" FOREIGN KEY ("folder_id") REFERENCES "public"."note_folder"("id") ON DELETE set null ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX "note_folder_user_id_idx" ON "note_folder" USING btree ("user_id");
--> statement-breakpoint
CREATE INDEX "note_folder_updated_at_idx" ON "note_folder" USING btree ("updated_at");
--> statement-breakpoint
CREATE INDEX "note_folder_id_idx" ON "note" USING btree ("folder_id");
