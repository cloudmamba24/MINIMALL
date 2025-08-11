import { z } from "zod";
import {
	ASPECT_RATIOS,
	DEVICE_TYPES,
	LAYOUT_PRESETS,
	SOCIAL_LAYOUT_PRESETS,
	MEDIA_FILTERS,
	TEMPLATE_CATEGORIES,
} from "../types";

// Basic validation schemas
const LayoutPresetSchema = z.enum(LAYOUT_PRESETS);
const SocialLayoutPresetSchema = z.enum(SOCIAL_LAYOUT_PRESETS);
const UnionLayoutPresetSchema = z.union([LayoutPresetSchema, SocialLayoutPresetSchema]);
const AspectRatioSchema = z.enum(ASPECT_RATIOS);
const MediaFilterSchema = z.enum(MEDIA_FILTERS);
const DeviceTypeSchema = z.enum(DEVICE_TYPES);
const TemplateCategorySchema = z.enum(TEMPLATE_CATEGORIES);

// Layout configuration with safe ranges
export const LayoutConfigSchema = z.object({
	preset: UnionLayoutPresetSchema,
	rows: z.number().int().min(1).max(6),
	columns: z.number().int().min(1).max(4),
	gutter: z.number().int().min(0).max(32),
	outerMargin: z.number().int().min(0).max(64),
	borderRadius: z.number().int().min(0).max(24),
	hoverZoom: z.boolean(),
	aspect: AspectRatioSchema,
	mediaFilter: MediaFilterSchema,
	responsive: z
		.object({
			sm: z
				.object({
					rows: z.number().int().min(1).max(6),
					columns: z.number().int().min(1).max(4),
					gutter: z.number().int().min(0).max(32),
					outerMargin: z.number().int().min(0).max(64),
				})
				.partial(),
			md: z
				.object({
					rows: z.number().int().min(1).max(6),
					columns: z.number().int().min(1).max(4),
					gutter: z.number().int().min(0).max(32),
					outerMargin: z.number().int().min(0).max(64),
				})
				.partial(),
			lg: z
				.object({
					rows: z.number().int().min(1).max(6),
					columns: z.number().int().min(1).max(4),
					gutter: z.number().int().min(0).max(32),
					outerMargin: z.number().int().min(0).max(64),
				})
				.partial(),
		})
		.optional(),
	blockId: z.string().min(1),
	experimentKey: z.string().optional(),
});

// Responsive overrides validation
export const ResponsiveOverridesSchema = z.object({
	sm: z
		.object({
			rows: z.number().int().min(1).max(6).optional(),
			columns: z.number().int().min(1).max(4).optional(),
			gutter: z.number().int().min(0).max(32).optional(),
			outerMargin: z.number().int().min(0).max(64).optional(),
		})
		.optional(),
	md: z
		.object({
			rows: z.number().int().min(1).max(6).optional(),
			columns: z.number().int().min(1).max(4).optional(),
			gutter: z.number().int().min(0).max(32).optional(),
			outerMargin: z.number().int().min(0).max(64).optional(),
		})
		.optional(),
	lg: z
		.object({
			rows: z.number().int().min(1).max(6).optional(),
			columns: z.number().int().min(1).max(4).optional(),
			gutter: z.number().int().min(0).max(32).optional(),
			outerMargin: z.number().int().min(0).max(64).optional(),
		})
		.optional(),
});

// Pixel settings validation
export const PixelSettingsSchema = z.object({
	facebook: z.string().optional(),
	google: z.string().optional(),
	tiktok: z.string().optional(),
	pinterest: z.string().optional(),
	snapchat: z.string().optional(),
	custom: z
		.array(
			z.object({
				name: z.string().min(1),
				id: z.string().min(1),
				type: z.enum(["script", "pixel", "tag"]),
			}),
		)
		.optional(),
});

// Experiment configuration validation
export const ExperimentConfigSchema = z.object({
	key: z.string().min(1),
	name: z.string().min(1),
	description: z.string().optional(),
	targets: z.array(
		z.object({
			blockId: z.string().min(1),
			variantPercent: z.number().int().min(0).max(100),
		}),
	),
	trafficSplit: z.number().int().min(0).max(100),
	status: z.enum(["draft", "running", "paused", "completed"]),
	startDate: z.string().datetime().optional(),
	endDate: z.string().datetime().optional(),
});

// Template validation
export const LayoutTemplateSchema = z.object({
	id: z.string().min(1),
	name: z.string().min(1),
	description: z.string().min(1),
	category: TemplateCategorySchema,
	layout: LayoutConfigSchema,
	preview: z.string().url().optional(),
	tags: z.array(z.string()),
});

// Enhanced analytics event validation
export const EnhancedAnalyticsEventSchema = z.object({
	event: z.string().min(1),
	configId: z.string().min(1),
	userId: z.string().optional(),
	sessionId: z.string().min(1),
	timestamp: z.date(),
	properties: z.record(z.unknown()),
	userAgent: z.string().optional(),
	referrer: z.string().optional(),
	utm: z
		.object({
			source: z.string().optional(),
			medium: z.string().optional(),
			campaign: z.string().optional(),
			term: z.string().optional(),
			content: z.string().optional(),
		})
		.optional(),
	blockId: z.string().optional(),
	layoutPreset: UnionLayoutPresetSchema.optional(),
	variantId: z.string().optional(),
	experimentKey: z.string().optional(),
	device: DeviceTypeSchema,
	country: z.string().optional(),
});

// UTM parameters validation
export const UTMParametersSchema = z.object({
	source: z.string().optional(),
	medium: z.string().optional(),
	campaign: z.string().optional(),
	term: z.string().optional(),
	content: z.string().optional(),
});

// Attribution data validation
export const AttributionDataSchema = z.object({
	configId: z.string().min(1),
	blockId: z.string().min(1),
	layoutPreset: UnionLayoutPresetSchema,
	experimentKey: z.string().optional(),
	utm: UTMParametersSchema,
	sessionId: z.string().min(1),
	device: DeviceTypeSchema,
	timestamp: z.date(),
});

// Revenue attribution validation
export const RevenueAttributionSchema = AttributionDataSchema.extend({
	orderId: z.string().min(1),
	lineItemId: z.string().min(1),
	productId: z.string().min(1),
	variantId: z.string().min(1),
	quantity: z.number().int().positive(),
	price: z.number().int().nonnegative(),
	revenue: z.number().int().nonnegative(),
});

// Extended Category validation
export const CategorySchema: z.ZodType<any> = z.object({
	id: z.string().min(1),
	title: z.string().min(1),
	card: z.tuple([z.string(), z.record(z.unknown())]),
	categoryType: z.tuple([z.string(), z.record(z.unknown())]),
	children: z.array(z.lazy((): z.ZodType<any> => CategorySchema)).optional(),
	order: z.number().int().optional(),
	visible: z.boolean().optional(),
	layout: LayoutConfigSchema.optional(),
});

// Extended Settings validation
export const SettingsSchema = z.object({
	checkoutLink: z.string().url(),
	shopDomain: z.string().min(1),
	theme: z.object({
		primaryColor: z.string().min(1),
		backgroundColor: z.string().min(1),
		textColor: z.string().optional(),
		accentColor: z.string().optional(),
		fontFamily: z.string().optional(),
		borderRadius: z.enum(["none", "sm", "md", "lg", "xl"]).optional(),
	}),
	seo: z
		.object({
			title: z.string().optional(),
			description: z.string().optional(),
			keywords: z.string().optional(),
		})
		.optional(),
	brand: z
		.object({
			name: z.string().min(1),
			subtitle: z.string().optional(),
			logo: z.string().url().optional(),
			socialLinks: z
				.object({
					instagram: z.string().url().optional(),
					twitter: z.string().url().optional(),
					pinterest: z.string().url().optional(),
					tiktok: z.string().url().optional(),
					youtube: z.string().url().optional(),
					website: z.string().url().optional(),
				})
				.optional(),
			ctaButton: z
				.object({
					text: z.string().min(1),
					url: z.string().url(),
				})
				.optional(),
		})
		.optional(),
	animations: z
		.object({
			transitions: z.object({
				duration: z.number().positive(),
				easing: z.string().min(1),
			}),
			modals: z.object({
				fadeIn: z.number().positive(),
				slideIn: z.number().positive(),
				backdrop: z.object({
					opacity: z.number().min(0).max(1),
					blur: z.number().nonnegative(),
				}),
			}),
			hover: z.object({
				scale: z.number().positive(),
				duration: z.number().positive(),
			}),
		})
		.optional(),
	modals: z
		.object({
			backdrop: z.object({
				blur: z.boolean(),
				opacity: z.number().min(0).max(1),
			}),
			positioning: z.object({
				centered: z.boolean(),
				offsetY: z.number().optional(),
			}),
			behavior: z.object({
				closeOnBackdrop: z.boolean(),
				closeOnEscape: z.boolean(),
				preventScroll: z.boolean(),
			}),
		})
		.optional(),
	pixels: PixelSettingsSchema.optional(),
	experiments: z.array(ExperimentConfigSchema).optional(),
});

// Complete SiteConfig validation
export const SiteConfigSchema = z.object({
	id: z.string().min(1),
	version: z.string().min(1),
	categories: z.array(CategorySchema),
	settings: SettingsSchema,
	createdAt: z.string().datetime(),
	updatedAt: z.string().datetime(),
});

// Partial schemas for updates
export const PartialSiteConfigSchema = SiteConfigSchema.partial();
export const PartialCategorySchema = z
	.object({
		id: z.string().min(1).optional(),
		title: z.string().min(1).optional(),
		card: z.tuple([z.string(), z.record(z.unknown())]).optional(),
		categoryType: z.tuple([z.string(), z.record(z.unknown())]).optional(),
		children: z.array(z.lazy((): z.ZodType<any> => CategorySchema)).optional(),
		order: z.number().int().optional(),
		visible: z.boolean().optional(),
		layout: LayoutConfigSchema.optional(),
	})
	.partial();
export const PartialLayoutConfigSchema = LayoutConfigSchema.partial();

// Helper functions for validation
export const validateSiteConfig = (data: unknown) => {
	return SiteConfigSchema.safeParse(data);
};

export const validateLayoutConfig = (data: unknown) => {
	return LayoutConfigSchema.safeParse(data);
};

export const validateCategory = (data: unknown) => {
	return CategorySchema.safeParse(data);
};

export const validateAnalyticsEvent = (data: unknown) => {
	return EnhancedAnalyticsEventSchema.safeParse(data);
};

// Type inference helpers
export type ValidatedSiteConfig = z.infer<typeof SiteConfigSchema>;
export type ValidatedLayoutConfig = z.infer<typeof LayoutConfigSchema>;
export type ValidatedCategory = z.infer<typeof CategorySchema>;
export type ValidatedAnalyticsEvent = z.infer<
	typeof EnhancedAnalyticsEventSchema
>;
