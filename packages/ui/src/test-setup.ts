import "@testing-library/jest-dom";
import { beforeEach } from "vitest";

// Extend Vitest's expect with jest-dom matchers
import * as matchers from "@testing-library/jest-dom/matchers";
expect.extend(matchers);

// Mock ResizeObserver for components that might use it
global.ResizeObserver = vi.fn().mockImplementation(() => ({
	observe: vi.fn(),
	unobserve: vi.fn(),
	disconnect: vi.fn(),
}));

// Mock IntersectionObserver
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
	observe: vi.fn(),
	unobserve: vi.fn(),
	disconnect: vi.fn(),
}));

beforeEach(() => {
	vi.clearAllMocks();
});
