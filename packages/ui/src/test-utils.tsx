import type { SiteConfig } from "@minimall/core";
import {
	type RenderOptions,
	type RenderResult,
	render,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type React from "react";

// Mock theme provider for testing
const MockThemeProvider = ({
	children,
	theme,
}: {
	children: React.ReactNode;
	theme?: any;
}) => (
	<div data-testid="theme-provider" data-theme={JSON.stringify(theme)}>
		{children}
	</div>
);

interface CustomRenderOptions extends Omit<RenderOptions, "wrapper"> {
	theme?: SiteConfig["settings"]["theme"];
}

interface CustomRenderResult extends RenderResult {
	user: ReturnType<typeof userEvent.setup>;
}

/**
 * Custom render function that includes theme provider and user events
 */
export const renderWithTheme = (
	ui: React.ReactElement,
	options: CustomRenderOptions = {},
): CustomRenderResult => {
	const { theme, ...renderOptions } = options;

	const Wrapper = ({ children }: { children: React.ReactNode }) => (
		<MockThemeProvider theme={theme}>{children}</MockThemeProvider>
	);

	const user = userEvent.setup();

	return {
		user,
		...render(ui, { wrapper: Wrapper, ...renderOptions }),
	};
};

/**
 * Default theme for testing
 */
export const mockTheme: SiteConfig["settings"]["theme"] = {
	primaryColor: "#000000",
	backgroundColor: "#FFFFFF",
	textColor: "#333333",
	accentColor: "#FF0000",
	fontFamily: "Inter",
	borderRadius: "md",
};

// Re-export everything from testing-library
export * from "@testing-library/react";
export { default as userEvent } from "@testing-library/user-event";
