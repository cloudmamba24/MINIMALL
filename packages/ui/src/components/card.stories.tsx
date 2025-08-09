import type { Meta, StoryObj } from "@storybook/react";
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "./card";

const meta: Meta<typeof Card> = {
	title: "UI/Card",
	component: Card,
	parameters: {
		layout: "centered",
		docs: {
			description: {
				component:
					"A flexible card component with header, content, and footer sections. Built with Tailwind CSS for consistent styling and layout.",
			},
		},
	},
	tags: ["autodocs"],
	decorators: [
		(Story) => (
			<div style={{ maxWidth: "400px", padding: "1rem" }}>
				<Story />
			</div>
		),
	],
	argTypes: {
		className: {
			description: "Additional CSS classes to apply to the card",
			control: "text",
		},
	},
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	render: () => (
		<Card>
			<CardContent>
				<p>This is a basic card with just content.</p>
			</CardContent>
		</Card>
	),
};

export const WithHeader: Story = {
	render: () => (
		<Card>
			<CardHeader>
				<CardTitle>Card Title</CardTitle>
				<CardDescription>
					This is a description that provides additional context.
				</CardDescription>
			</CardHeader>
			<CardContent>
				<p>This card includes a header with title and description.</p>
			</CardContent>
		</Card>
	),
};

export const WithFooter: Story = {
	render: () => (
		<Card>
			<CardHeader>
				<CardTitle>Product Card</CardTitle>
			</CardHeader>
			<CardContent>
				<p>
					A great product that you'll love. Features include excellent quality
					and competitive pricing.
				</p>
			</CardContent>
			<CardFooter>
				<button className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors">
					Add to Cart
				</button>
			</CardFooter>
		</Card>
	),
};

export const Complete: Story = {
	render: () => (
		<Card>
			<CardHeader>
				<CardTitle>Complete Card Example</CardTitle>
				<CardDescription>
					This card demonstrates all available sections working together.
				</CardDescription>
			</CardHeader>
			<CardContent>
				<div className="space-y-3">
					<p>
						This is the main content area where you can put any content like
						text, images, or other components.
					</p>
					<div className="flex items-center space-x-4 text-sm text-gray-600">
						<span>🌟 4.8 rating</span>
						<span>💬 23 reviews</span>
						<span>📦 In stock</span>
					</div>
				</div>
			</CardContent>
			<CardFooter className="flex justify-between">
				<span className="text-lg font-bold text-green-600">$29.99</span>
				<div className="flex space-x-2">
					<button className="bg-gray-200 text-gray-800 px-3 py-1 rounded hover:bg-gray-300 transition-colors">
						Save
					</button>
					<button className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors">
						Buy Now
					</button>
				</div>
			</CardFooter>
		</Card>
	),
};

export const ImageCard: Story = {
	render: () => (
		<Card className="overflow-hidden">
			<div className="h-48 bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center">
				<span className="text-white text-xl font-bold">
					📸 Image Placeholder
				</span>
			</div>
			<CardHeader>
				<CardTitle>Image Card</CardTitle>
				<CardDescription>
					Perfect for showcasing products or content with visuals.
				</CardDescription>
			</CardHeader>
			<CardContent>
				<p>
					This card style works great for galleries, product showcases, or any
					content that benefits from a prominent visual element.
				</p>
			</CardContent>
		</Card>
	),
	parameters: {
		docs: {
			description: {
				story:
					"Card with an image or visual element at the top, commonly used for product displays or content previews.",
			},
		},
	},
};

export const StatsCard: Story = {
	render: () => (
		<Card>
			<CardHeader className="pb-2">
				<CardDescription>Total Revenue</CardDescription>
				<CardTitle className="text-3xl">$45,231.89</CardTitle>
			</CardHeader>
			<CardContent>
				<div className="text-xs text-muted-foreground">
					+20.1% from last month
				</div>
			</CardContent>
		</Card>
	),
	parameters: {
		docs: {
			description: {
				story:
					"A minimal stats card perfect for dashboards and analytics displays.",
			},
		},
	},
};

export const ActionCard: Story = {
	render: () => (
		<Card className="cursor-pointer hover:shadow-lg transition-shadow">
			<CardHeader>
				<div className="flex items-center space-x-3">
					<div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
						<span className="text-blue-600">⚡</span>
					</div>
					<div>
						<CardTitle className="text-base">Quick Action</CardTitle>
						<CardDescription>Click to perform this action</CardDescription>
					</div>
				</div>
			</CardHeader>
			<CardContent>
				<p className="text-sm text-gray-600">
					This card serves as a clickable action item, perfect for dashboard
					shortcuts or navigation.
				</p>
			</CardContent>
		</Card>
	),
	parameters: {
		docs: {
			description: {
				story:
					"Interactive card that can be clicked to perform actions, with hover effects for better UX.",
			},
		},
	},
};

export const CardGrid: Story = {
	render: () => (
		<div
			className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
			style={{ maxWidth: "none", width: "800px" }}
		>
			<Card>
				<CardHeader>
					<CardTitle className="text-sm font-medium">Total Users</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="text-2xl font-bold">2,834</div>
					<p className="text-xs text-muted-foreground">
						+10.1% from last month
					</p>
				</CardContent>
			</Card>
			<Card>
				<CardHeader>
					<CardTitle className="text-sm font-medium">Revenue</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="text-2xl font-bold">$23,456</div>
					<p className="text-xs text-muted-foreground">+5.2% from last month</p>
				</CardContent>
			</Card>
			<Card>
				<CardHeader>
					<CardTitle className="text-sm font-medium">Orders</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="text-2xl font-bold">1,234</div>
					<p className="text-xs text-muted-foreground">
						+12.5% from last month
					</p>
				</CardContent>
			</Card>
		</div>
	),
	parameters: {
		docs: {
			description: {
				story:
					"Multiple cards arranged in a responsive grid layout, commonly used for dashboards and analytics.",
			},
		},
	},
};

export const CustomStyling: Story = {
	render: () => (
		<div className="space-y-4" style={{ maxWidth: "none", width: "500px" }}>
			<Card className="border-l-4 border-l-blue-500 bg-blue-50">
				<CardHeader>
					<CardTitle className="text-blue-900">Info Card</CardTitle>
					<CardDescription className="text-blue-700">
						Custom styling with blue accent
					</CardDescription>
				</CardHeader>
				<CardContent className="text-blue-800">
					<p>
						This card uses custom styling to create a distinctive appearance
						with colored borders and backgrounds.
					</p>
				</CardContent>
			</Card>

			<Card className="border-l-4 border-l-green-500 bg-green-50">
				<CardHeader>
					<CardTitle className="text-green-900">Success Card</CardTitle>
					<CardDescription className="text-green-700">
						Green styling for success states
					</CardDescription>
				</CardHeader>
				<CardContent className="text-green-800">
					<p>Perfect for displaying success messages or positive feedback.</p>
				</CardContent>
			</Card>

			<Card className="border-l-4 border-l-red-500 bg-red-50">
				<CardHeader>
					<CardTitle className="text-red-900">Warning Card</CardTitle>
					<CardDescription className="text-red-700">
						Red styling for warnings or errors
					</CardDescription>
				</CardHeader>
				<CardContent className="text-red-800">
					<p>
						Use this style for error messages or important warnings that need
						attention.
					</p>
				</CardContent>
			</Card>
		</div>
	),
	parameters: {
		docs: {
			description: {
				story:
					"Cards with custom styling and color schemes for different use cases like info, success, and warning states.",
			},
		},
	},
};
