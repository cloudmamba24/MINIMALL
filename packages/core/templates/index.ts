import type { LayoutTemplate } from "../types";

/**
 * Core Gallery Templates
 *
 * These templates provide starting points for different use cases
 * and can be customized further in the admin interface.
 */

export const CORE_TEMPLATES: LayoutTemplate[] = [
	{
		id: "classic-product-grid",
		name: "Classic Product Grid",
		description: "Perfect for showcasing products in a clean, organized grid",
		category: "classic",
		preview: "/templates/previews/classic-grid.jpg",
		tags: ["products", "ecommerce", "clean", "organized"],
		layout: {
			preset: "grid",
			rows: 2,
			columns: 2,
			gutter: 12,
			outerMargin: 20,
			borderRadius: 8,
			hoverZoom: true,
			aspect: "1:1",
			mediaFilter: "all",
			blockId: "template_classic_grid",
			responsive: {
				sm: { columns: 1, rows: 4 },
				md: { columns: 2, rows: 2 },
			},
		},
	},

	{
		id: "fashion-showcase",
		name: "Fashion Showcase",
		description: "Elegant vertical layout perfect for fashion and lifestyle",
		category: "classic",
		preview: "/templates/previews/fashion-showcase.jpg",
		tags: ["fashion", "lifestyle", "elegant", "vertical"],
		layout: {
			preset: "grid",
			rows: 3,
			columns: 2,
			gutter: 8,
			outerMargin: 16,
			borderRadius: 6,
			hoverZoom: true,
			aspect: "4:5",
			mediaFilter: "photo",
			blockId: "template_fashion_showcase",
			responsive: {
				sm: { columns: 1, rows: 6 },
				md: { columns: 2, rows: 3 },
			},
		},
	},

	{
		id: "creative-masonry",
		name: "Creative Masonry",
		description:
			"Pinterest-style layout for diverse content and creative portfolios",
		category: "minimal",
		preview: "/templates/previews/creative-masonry.jpg",
		tags: ["creative", "portfolio", "mixed-content", "visual"],
		layout: {
			preset: "masonry",
			rows: 3,
			columns: 3,
			gutter: 10,
			outerMargin: 18,
			borderRadius: 12,
			hoverZoom: true,
			aspect: "auto",
			mediaFilter: "all",
			blockId: "template_creative_masonry",
			responsive: {
				sm: { columns: 1 },
				md: { columns: 2 },
				lg: { columns: 3 },
			},
		},
	},

	{
		id: "minimal-portfolio",
		name: "Minimal Portfolio",
		description:
			"Clean masonry layout with generous spacing for artistic content",
		category: "minimal",
		preview: "/templates/previews/minimal-portfolio.jpg",
		tags: ["portfolio", "art", "photography", "minimal"],
		layout: {
			preset: "masonry",
			rows: 2,
			columns: 2,
			gutter: 24,
			outerMargin: 32,
			borderRadius: 0,
			hoverZoom: false,
			aspect: "auto",
			mediaFilter: "photo",
			blockId: "template_minimal_portfolio",
		},
	},

	{
		id: "mobile-swipe-gallery",
		name: "Mobile Swipe Gallery",
		description: "Touch-optimized slider perfect for mobile browsing",
		category: "ecommerce",
		preview: "/templates/previews/mobile-swipe.jpg",
		tags: ["mobile", "touch", "swipe", "featured"],
		layout: {
			preset: "slider",
			rows: 1,
			columns: 3,
			gutter: 16,
			outerMargin: 24,
			borderRadius: 16,
			hoverZoom: false,
			aspect: "4:5",
			mediaFilter: "all",
			blockId: "template_mobile_swipe",
			responsive: {
				sm: { columns: 1 },
				md: { columns: 2 },
				lg: { columns: 3 },
			},
		},
	},

	{
		id: "featured-carousel",
		name: "Featured Carousel",
		description: "Highlight your best products with a prominent carousel",
		category: "ecommerce",
		preview: "/templates/previews/featured-carousel.jpg",
		tags: ["featured", "hero", "products", "highlight"],
		layout: {
			preset: "slider",
			rows: 1,
			columns: 4,
			gutter: 12,
			outerMargin: 20,
			borderRadius: 12,
			hoverZoom: true,
			aspect: "1:1",
			mediaFilter: "all",
			blockId: "template_featured_carousel",
		},
	},

	{
		id: "video-stories",
		name: "Video Stories",
		description: "Full-screen video experience like Instagram Stories",
		category: "video",
		preview: "/templates/previews/video-stories.jpg",
		tags: ["video", "stories", "social", "immersive"],
		layout: {
			preset: "stories",
			rows: 1,
			columns: 1,
			gutter: 0,
			outerMargin: 0,
			borderRadius: 20,
			hoverZoom: false,
			aspect: "9:16",
			mediaFilter: "video",
			blockId: "template_video_stories",
		},
	},

	{
		id: "brand-highlights",
		name: "Brand Highlights",
		description: "Video-focused layout for brand storytelling and highlights",
		category: "video",
		preview: "/templates/previews/brand-highlights.jpg",
		tags: ["brand", "storytelling", "video", "highlights"],
		layout: {
			preset: "stories",
			rows: 1,
			columns: 1,
			gutter: 0,
			outerMargin: 12,
			borderRadius: 24,
			hoverZoom: false,
			aspect: "16:9",
			mediaFilter: "video",
			blockId: "template_brand_highlights",
		},
	},
];

/**
 * Get templates by category
 */
export function getTemplatesByCategory(category: string): LayoutTemplate[] {
	return CORE_TEMPLATES.filter((template) => template.category === category);
}

/**
 * Get template by ID
 */
export function getTemplateById(id: string): LayoutTemplate | undefined {
	return CORE_TEMPLATES.find((template) => template.id === id);
}

/**
 * Get all template categories
 */
export function getTemplateCategories(): string[] {
	const categories = new Set(
		CORE_TEMPLATES.map((template) => template.category),
	);
	return Array.from(categories);
}

/**
 * Get recommended templates based on content type
 */
export function getRecommendedTemplates(
	contentType: "product" | "photo" | "video" | "mixed",
): LayoutTemplate[] {
	const recommendations: Record<typeof contentType, string[]> = {
		product: [
			"classic-product-grid",
			"featured-carousel",
			"mobile-swipe-gallery",
		],
		photo: ["fashion-showcase", "creative-masonry", "minimal-portfolio"],
		video: ["video-stories", "brand-highlights"],
		mixed: ["creative-masonry", "mobile-swipe-gallery", "featured-carousel"],
	};

	const templateIds = recommendations[contentType];
	return CORE_TEMPLATES.filter((template) => templateIds.includes(template.id));
}

/**
 * Generate custom template from current layout
 */
export function createCustomTemplate(
	layout: any,
	metadata: {
		name: string;
		description: string;
		category: string;
		tags: string[];
	},
): LayoutTemplate {
	return {
		id: `custom_${Date.now()}`,
		...metadata,
		preview: "/templates/previews/custom-template.jpg",
		layout: {
			...layout,
			blockId: `custom_${Math.random().toString(36).substr(2, 9)}`,
		},
	};
}

export default CORE_TEMPLATES;
