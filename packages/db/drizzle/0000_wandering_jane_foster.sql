CREATE TYPE "public"."voice_category" AS ENUM('premade', 'cloned', 'custom');--> statement-breakpoint
CREATE TYPE "public"."voice_gender" AS ENUM('male', 'female', 'neutral');--> statement-breakpoint
CREATE TYPE "public"."job_status" AS ENUM('pending', 'processing', 'completed', 'failed');--> statement-breakpoint
CREATE TYPE "public"."job_type" AS ENUM('tts', 'clone');--> statement-breakpoint
CREATE TABLE "api_keys" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"name" varchar(255) NOT NULL,
	"prefix" varchar(10) NOT NULL,
	"key_hash" varchar(255) NOT NULL,
	"last_used_at" timestamp with time zone,
	"expires_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "refresh_tokens" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"token_hash" varchar(255) NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "audio_files" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"job_id" uuid NOT NULL,
	"file_name" varchar(255) NOT NULL,
	"mime_type" varchar(100) NOT NULL,
	"size_bytes" integer NOT NULL,
	"duration_ms" integer,
	"storage_path" varchar(1024) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar(255) NOT NULL,
	"name" varchar(255) NOT NULL,
	"password_hash" varchar(255) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "voices" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"name" varchar(255) NOT NULL,
	"description" text,
	"category" "voice_category" DEFAULT 'premade' NOT NULL,
	"language" varchar(10) DEFAULT 'en' NOT NULL,
	"gender" "voice_gender" DEFAULT 'neutral' NOT NULL,
	"accent" varchar(100),
	"preview_url" varchar(1024),
	"is_public" boolean DEFAULT true NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "voice_samples" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"voice_id" uuid NOT NULL,
	"file_name" varchar(255) NOT NULL,
	"mime_type" varchar(100) NOT NULL,
	"size_bytes" integer NOT NULL,
	"duration_ms" integer,
	"storage_path" varchar(1024) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tts_jobs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"voice_id" uuid NOT NULL,
	"type" "job_type" DEFAULT 'tts' NOT NULL,
	"status" "job_status" DEFAULT 'pending' NOT NULL,
	"input_text" text,
	"output_file_id" uuid,
	"error" text,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "api_keys" ADD CONSTRAINT "api_keys_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audio_files" ADD CONSTRAINT "audio_files_job_id_tts_jobs_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."tts_jobs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "voices" ADD CONSTRAINT "voices_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "voice_samples" ADD CONSTRAINT "voice_samples_voice_id_voices_id_fk" FOREIGN KEY ("voice_id") REFERENCES "public"."voices"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tts_jobs" ADD CONSTRAINT "tts_jobs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tts_jobs" ADD CONSTRAINT "tts_jobs_voice_id_voices_id_fk" FOREIGN KEY ("voice_id") REFERENCES "public"."voices"("id") ON DELETE no action ON UPDATE no action;