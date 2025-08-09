CREATE TABLE "analytics_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"event" varchar(100) NOT NULL,
	"config_id" text NOT NULL,
	"user_id" text,
	"session_id" text NOT NULL,
	"properties" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"user_agent" text,
	"referrer" text,
	"utm_source" varchar(100),
	"utm_medium" varchar(100),
	"utm_campaign" varchar(100),
	"utm_term" varchar(100),
	"utm_content" varchar(100),
	"timestamp" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "config_versions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"config_id" text NOT NULL,
	"version" varchar(50) NOT NULL,
	"data" jsonb NOT NULL,
	"is_published" boolean DEFAULT false NOT NULL,
	"created_by" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"published_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "configs" (
	"id" text PRIMARY KEY NOT NULL,
	"shop" text NOT NULL,
	"slug" text NOT NULL,
	"current_version_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "feature_flags" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"shop_domain" text NOT NULL,
	"flag_name" varchar(100) NOT NULL,
	"enabled" boolean DEFAULT false NOT NULL,
	"value" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "performance_metrics" (
	"id" serial PRIMARY KEY NOT NULL,
	"config_id" text NOT NULL,
	"lcp" integer,
	"fid" integer,
	"cls" integer,
	"ttfb" integer,
	"load_time" integer,
	"user_agent" text,
	"connection" varchar(50),
	"viewport_width" integer,
	"viewport_height" integer,
	"timestamp" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"id" text PRIMARY KEY NOT NULL,
	"config_id" text,
	"cart_data" jsonb,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar(255) NOT NULL,
	"name" varchar(255) NOT NULL,
	"shop_domain" text NOT NULL,
	"role" varchar(50) DEFAULT 'editor' NOT NULL,
	"permissions" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "webhooks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"shop_domain" text NOT NULL,
	"event" varchar(100) NOT NULL,
	"topic" varchar(100) NOT NULL,
	"payload" jsonb NOT NULL,
	"processed" boolean DEFAULT false NOT NULL,
	"processed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "analytics_events" ADD CONSTRAINT "analytics_events_config_id_configs_id_fk" FOREIGN KEY ("config_id") REFERENCES "public"."configs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "config_versions" ADD CONSTRAINT "config_versions_config_id_configs_id_fk" FOREIGN KEY ("config_id") REFERENCES "public"."configs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "performance_metrics" ADD CONSTRAINT "performance_metrics_config_id_configs_id_fk" FOREIGN KEY ("config_id") REFERENCES "public"."configs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_config_id_configs_id_fk" FOREIGN KEY ("config_id") REFERENCES "public"."configs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "analytics_config_id_idx" ON "analytics_events" USING btree ("config_id");--> statement-breakpoint
CREATE INDEX "analytics_event_idx" ON "analytics_events" USING btree ("event");--> statement-breakpoint
CREATE INDEX "analytics_timestamp_idx" ON "analytics_events" USING btree ("timestamp");--> statement-breakpoint
CREATE INDEX "analytics_session_idx" ON "analytics_events" USING btree ("session_id");--> statement-breakpoint
CREATE INDEX "config_id_idx" ON "config_versions" USING btree ("config_id");--> statement-breakpoint
CREATE INDEX "published_idx" ON "config_versions" USING btree ("is_published");--> statement-breakpoint
CREATE INDEX "shop_idx" ON "configs" USING btree ("shop");--> statement-breakpoint
CREATE INDEX "slug_idx" ON "configs" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "feature_flag_shop_domain_idx" ON "feature_flags" USING btree ("shop_domain");--> statement-breakpoint
CREATE INDEX "feature_flag_name_idx" ON "feature_flags" USING btree ("flag_name");--> statement-breakpoint
CREATE INDEX "perf_config_id_idx" ON "performance_metrics" USING btree ("config_id");--> statement-breakpoint
CREATE INDEX "perf_timestamp_idx" ON "performance_metrics" USING btree ("timestamp");--> statement-breakpoint
CREATE INDEX "session_config_id_idx" ON "sessions" USING btree ("config_id");--> statement-breakpoint
CREATE INDEX "session_expires_at_idx" ON "sessions" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "email_idx" ON "users" USING btree ("email");--> statement-breakpoint
CREATE INDEX "shop_domain_idx" ON "users" USING btree ("shop_domain");--> statement-breakpoint
CREATE INDEX "webhook_shop_domain_idx" ON "webhooks" USING btree ("shop_domain");--> statement-breakpoint
CREATE INDEX "webhook_event_idx" ON "webhooks" USING btree ("event");--> statement-breakpoint
CREATE INDEX "webhook_processed_idx" ON "webhooks" USING btree ("processed");