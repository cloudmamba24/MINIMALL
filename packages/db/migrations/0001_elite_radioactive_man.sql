CREATE TABLE "assets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"shop_domain" text NOT NULL,
	"type" varchar(10) NOT NULL,
	"r2_key" text NOT NULL,
	"original_filename" text NOT NULL,
	"file_size" integer NOT NULL,
	"dimensions" jsonb,
	"variants" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "revenue_attributions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" text NOT NULL,
	"line_item_id" text NOT NULL,
	"shop_domain" text NOT NULL,
	"config_id" text NOT NULL,
	"block_id" text NOT NULL,
	"layout_preset" varchar(50) NOT NULL,
	"experiment_key" varchar(100),
	"product_id" text NOT NULL,
	"variant_id" text NOT NULL,
	"quantity" integer NOT NULL,
	"price" integer NOT NULL,
	"revenue" integer NOT NULL,
	"utm_source" varchar(100),
	"utm_medium" varchar(100),
	"utm_campaign" varchar(100),
	"utm_term" varchar(100),
	"utm_content" varchar(100),
	"session_id" text NOT NULL,
	"device" varchar(20) NOT NULL,
	"timestamp" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "shops" (
	"shop_domain" text PRIMARY KEY NOT NULL,
	"storefront_access_token" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "usage_rollups" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"shop_domain" text NOT NULL,
	"month" varchar(7) NOT NULL,
	"mau" integer NOT NULL,
	"impressions" integer DEFAULT 0 NOT NULL,
	"checkouts" integer DEFAULT 0 NOT NULL,
	"revenue" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "analytics_events" ADD COLUMN "block_id" text;--> statement-breakpoint
ALTER TABLE "analytics_events" ADD COLUMN "layout_preset" varchar(50);--> statement-breakpoint
ALTER TABLE "analytics_events" ADD COLUMN "variant_id" text;--> statement-breakpoint
ALTER TABLE "analytics_events" ADD COLUMN "experiment_key" varchar(100);--> statement-breakpoint
ALTER TABLE "analytics_events" ADD COLUMN "device" varchar(20) NOT NULL;--> statement-breakpoint
ALTER TABLE "analytics_events" ADD COLUMN "country" varchar(5);--> statement-breakpoint
ALTER TABLE "config_versions" ADD COLUMN "scheduled_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "assets" ADD CONSTRAINT "assets_shop_domain_shops_shop_domain_fk" FOREIGN KEY ("shop_domain") REFERENCES "public"."shops"("shop_domain") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "revenue_attributions" ADD CONSTRAINT "revenue_attributions_shop_domain_shops_shop_domain_fk" FOREIGN KEY ("shop_domain") REFERENCES "public"."shops"("shop_domain") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "revenue_attributions" ADD CONSTRAINT "revenue_attributions_config_id_configs_id_fk" FOREIGN KEY ("config_id") REFERENCES "public"."configs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "usage_rollups" ADD CONSTRAINT "usage_rollups_shop_domain_shops_shop_domain_fk" FOREIGN KEY ("shop_domain") REFERENCES "public"."shops"("shop_domain") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "assets_shop_domain_idx" ON "assets" USING btree ("shop_domain");--> statement-breakpoint
CREATE INDEX "assets_type_idx" ON "assets" USING btree ("type");--> statement-breakpoint
CREATE INDEX "assets_r2_key_idx" ON "assets" USING btree ("r2_key");--> statement-breakpoint
CREATE INDEX "revenue_attr_order_id_idx" ON "revenue_attributions" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "revenue_attr_config_id_idx" ON "revenue_attributions" USING btree ("config_id");--> statement-breakpoint
CREATE INDEX "revenue_attr_block_id_idx" ON "revenue_attributions" USING btree ("block_id");--> statement-breakpoint
CREATE INDEX "revenue_attr_shop_domain_idx" ON "revenue_attributions" USING btree ("shop_domain");--> statement-breakpoint
CREATE INDEX "revenue_attr_timestamp_idx" ON "revenue_attributions" USING btree ("timestamp");--> statement-breakpoint
CREATE INDEX "revenue_attr_experiment_idx" ON "revenue_attributions" USING btree ("experiment_key");--> statement-breakpoint
CREATE INDEX "usage_rollups_shop_domain_idx" ON "usage_rollups" USING btree ("shop_domain");--> statement-breakpoint
CREATE INDEX "usage_rollups_month_idx" ON "usage_rollups" USING btree ("month");--> statement-breakpoint
CREATE INDEX "usage_rollups_unique_month_shop" ON "usage_rollups" USING btree ("shop_domain","month");--> statement-breakpoint
ALTER TABLE "configs" ADD CONSTRAINT "configs_shop_shops_shop_domain_fk" FOREIGN KEY ("shop") REFERENCES "public"."shops"("shop_domain") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "analytics_block_id_idx" ON "analytics_events" USING btree ("block_id");--> statement-breakpoint
CREATE INDEX "analytics_experiment_idx" ON "analytics_events" USING btree ("experiment_key");--> statement-breakpoint
CREATE INDEX "scheduled_idx" ON "config_versions" USING btree ("scheduled_at");