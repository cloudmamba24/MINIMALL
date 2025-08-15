/**
 * Tests for UI Form Components
 * Covers input validation, form state, and user interactions
 */

import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import { describe, expect, it, vi } from "vitest";
import {
	Button,
	Checkbox,
	Form,
	FormError,
	FormField,
	FormSubmit,
	Input,
	RadioGroup,
	Select,
	TextArea,
} from "./form";

describe("UI Form Components", () => {
	describe("Button Component", () => {
		it("should render button with text", () => {
			render(<Button>Click me</Button>);
			expect(
				screen.getByRole("button", { name: "Click me" }),
			).toBeInTheDocument();
		});

		it("should handle click events", async () => {
			const handleClick = vi.fn();
			render(<Button onClick={handleClick}>Click me</Button>);

			await userEvent.click(screen.getByRole("button"));
			expect(handleClick).toHaveBeenCalledTimes(1);
		});

		it("should be disabled when disabled prop is true", () => {
			render(<Button disabled>Disabled</Button>);
			expect(screen.getByRole("button")).toBeDisabled();
		});

		it("should show loading state", () => {
			render(<Button loading>Loading</Button>);
			expect(screen.getByRole("button")).toBeDisabled();
			expect(screen.getByText("Loading...")).toBeInTheDocument();
		});

		it("should apply variant styles", () => {
			const { rerender } = render(<Button variant="primary">Primary</Button>);
			expect(screen.getByRole("button")).toHaveClass("btn-primary");

			rerender(<Button variant="secondary">Secondary</Button>);
			expect(screen.getByRole("button")).toHaveClass("btn-secondary");

			rerender(<Button variant="danger">Danger</Button>);
			expect(screen.getByRole("button")).toHaveClass("btn-danger");
		});

		it("should apply size styles", () => {
			const { rerender } = render(<Button size="sm">Small</Button>);
			expect(screen.getByRole("button")).toHaveClass("btn-sm");

			rerender(<Button size="lg">Large</Button>);
			expect(screen.getByRole("button")).toHaveClass("btn-lg");
		});
	});

	describe("Input Component", () => {
		it("should render input with label", () => {
			render(<Input label="Email" name="email" />);
			expect(screen.getByLabelText("Email")).toBeInTheDocument();
		});

		it("should handle value changes", async () => {
			const handleChange = vi.fn();
			render(<Input label="Name" onChange={handleChange} />);

			const input = screen.getByLabelText("Name");
			await userEvent.type(input, "John Doe");

			expect(handleChange).toHaveBeenCalled();
			expect(input).toHaveValue("John Doe");
		});

		it("should show validation errors", () => {
			render(<Input label="Email" error="Invalid email format" />);
			expect(screen.getByText("Invalid email format")).toBeInTheDocument();
			expect(screen.getByLabelText("Email")).toHaveClass("input-error");
		});

		it("should show required indicator", () => {
			render(<Input label="Required Field" required />);
			expect(screen.getByText("*")).toBeInTheDocument();
		});

		it("should handle different input types", () => {
			const { rerender } = render(<Input label="Password" type="password" />);
			expect(screen.getByLabelText("Password")).toHaveAttribute(
				"type",
				"password",
			);

			rerender(<Input label="Email" type="email" />);
			expect(screen.getByLabelText("Email")).toHaveAttribute("type", "email");

			rerender(<Input label="Number" type="number" />);
			expect(screen.getByLabelText("Number")).toHaveAttribute("type", "number");
		});

		it("should support placeholder text", () => {
			render(<Input label="Search" placeholder="Enter search term..." />);
			expect(
				screen.getByPlaceholderText("Enter search term..."),
			).toBeInTheDocument();
		});
	});

	describe("TextArea Component", () => {
		it("should render textarea with label", () => {
			render(<TextArea label="Description" name="description" />);
			expect(screen.getByLabelText("Description")).toBeInTheDocument();
		});

		it("should handle multi-line text", async () => {
			const handleChange = vi.fn();
			render(<TextArea label="Comments" onChange={handleChange} />);

			const textarea = screen.getByLabelText("Comments");
			await userEvent.type(textarea, "Line 1\nLine 2\nLine 3");

			expect(textarea).toHaveValue("Line 1\nLine 2\nLine 3");
		});

		it("should support rows attribute", () => {
			render(<TextArea label="Description" rows={5} />);
			expect(screen.getByLabelText("Description")).toHaveAttribute("rows", "5");
		});

		it("should show character count", () => {
			render(<TextArea label="Bio" maxLength={100} showCharCount />);
			expect(screen.getByText("0/100")).toBeInTheDocument();
		});
	});

	describe("Select Component", () => {
		const options = [
			{ value: "apple", label: "Apple" },
			{ value: "banana", label: "Banana" },
			{ value: "orange", label: "Orange" },
		];

		it("should render select with options", () => {
			render(<Select label="Fruit" options={options} />);
			expect(screen.getByLabelText("Fruit")).toBeInTheDocument();
			expect(screen.getByRole("option", { name: "Apple" })).toBeInTheDocument();
		});

		it("should handle selection changes", async () => {
			const handleChange = vi.fn();
			render(
				<Select label="Fruit" options={options} onChange={handleChange} />,
			);

			await userEvent.selectOptions(screen.getByLabelText("Fruit"), "banana");
			expect(handleChange).toHaveBeenCalledWith("banana");
		});

		it("should show placeholder option", () => {
			render(
				<Select label="Fruit" options={options} placeholder="Choose a fruit" />,
			);
			expect(
				screen.getByRole("option", { name: "Choose a fruit" }),
			).toBeInTheDocument();
		});

		it("should handle multiple selections", async () => {
			const handleChange = vi.fn();
			render(
				<Select
					label="Fruits"
					options={options}
					multiple
					onChange={handleChange}
				/>,
			);

			const select = screen.getByLabelText("Fruits");
			await userEvent.selectOptions(select, ["apple", "banana"]);

			// Wait for debounced onChange
			await new Promise((resolve) => setTimeout(resolve, 10));

			expect(handleChange).toHaveBeenCalledWith(["apple", "banana"]);
		});
	});

	describe("Checkbox Component", () => {
		it("should render checkbox with label", () => {
			render(<Checkbox label="Accept terms" />);
			expect(screen.getByLabelText("Accept terms")).toBeInTheDocument();
		});

		it("should handle check/uncheck", async () => {
			const handleChange = vi.fn();
			render(<Checkbox label="Subscribe" onChange={handleChange} />);

			const checkbox = screen.getByLabelText("Subscribe");
			await userEvent.click(checkbox);

			expect(handleChange).toHaveBeenCalledWith(true);
			expect(checkbox).toBeChecked();
		});

		it("should be indeterminate", () => {
			render(<Checkbox label="Select all" indeterminate />);
			expect(screen.getByLabelText("Select all")).toHaveProperty(
				"indeterminate",
				true,
			);
		});
	});

	describe("RadioGroup Component", () => {
		const options = [
			{ value: "small", label: "Small" },
			{ value: "medium", label: "Medium" },
			{ value: "large", label: "Large" },
		];

		it("should render radio group with options", () => {
			render(<RadioGroup label="Size" options={options} name="size" />);
			expect(screen.getByText("Size")).toBeInTheDocument();
			expect(screen.getByLabelText("Small")).toBeInTheDocument();
			expect(screen.getByLabelText("Medium")).toBeInTheDocument();
			expect(screen.getByLabelText("Large")).toBeInTheDocument();
		});

		it("should handle selection", async () => {
			const handleChange = vi.fn();
			render(
				<RadioGroup
					label="Size"
					options={options}
					name="size"
					onChange={handleChange}
				/>,
			);

			await userEvent.click(screen.getByLabelText("Medium"));
			expect(handleChange).toHaveBeenCalledWith("medium");
		});

		it("should only allow one selection", async () => {
			render(<RadioGroup label="Size" options={options} name="size" />);

			await userEvent.click(screen.getByLabelText("Small"));
			await userEvent.click(screen.getByLabelText("Large"));

			expect(screen.getByLabelText("Small")).not.toBeChecked();
			expect(screen.getByLabelText("Large")).toBeChecked();
		});
	});

	describe("Form Component", () => {
		it("should handle form submission", async () => {
			const handleSubmit = vi.fn();
			render(
				<Form onSubmit={handleSubmit}>
					<Input name="name" label="Name" />
					<Button type="submit">Submit</Button>
				</Form>,
			);

			await userEvent.type(screen.getByLabelText("Name"), "John Doe");
			await userEvent.click(screen.getByRole("button", { name: "Submit" }));

			expect(handleSubmit).toHaveBeenCalledWith(
				expect.objectContaining({
					name: "John Doe",
				}),
			);
		});

		it("should prevent submission with validation errors", async () => {
			const handleSubmit = vi.fn();
			render(
				<Form onSubmit={handleSubmit}>
					<Input name="email" label="Email" required />
					<Button type="submit">Submit</Button>
				</Form>,
			);

			await userEvent.click(screen.getByRole("button", { name: "Submit" }));

			expect(handleSubmit).not.toHaveBeenCalled();
			expect(screen.getByText("This field is required")).toBeInTheDocument();
		});

		it("should show loading state during submission", async () => {
			const handleSubmit = vi.fn(
				() => new Promise((resolve) => setTimeout(resolve, 100)),
			);
			render(
				<Form onSubmit={handleSubmit}>
					<Input name="name" label="Name" value="John" />
					<Button type="submit">Submit</Button>
				</Form>,
			);

			await userEvent.click(screen.getByRole("button", { name: "Submit" }));

			expect(screen.getByText("Loading...")).toBeInTheDocument();

			await waitFor(() => {
				expect(screen.queryByText("Loading...")).not.toBeInTheDocument();
			});
		});

		it("should reset form values", async () => {
			render(
				<Form>
					<Input name="name" label="Name" />
					<Input name="email" label="Email" />
					<Button type="reset">Reset</Button>
				</Form>,
			);

			await userEvent.type(screen.getByLabelText("Name"), "John");
			await userEvent.type(screen.getByLabelText("Email"), "john@example.com");

			expect(screen.getByLabelText("Name")).toHaveValue("John");
			expect(screen.getByLabelText("Email")).toHaveValue("john@example.com");

			await userEvent.click(screen.getByRole("button", { name: "Reset" }));

			expect(screen.getByLabelText("Name")).toHaveValue("");
			expect(screen.getByLabelText("Email")).toHaveValue("");
		});
	});

	describe("FormField Component", () => {
		it("should render field with label and input", () => {
			render(
				<FormField label="Username" name="username" required>
					<Input />
				</FormField>,
			);

			expect(screen.getByText("Username")).toBeInTheDocument();
			expect(screen.getByText("*")).toBeInTheDocument();
		});

		it("should show help text", () => {
			render(
				<FormField label="Password" helpText="Must be at least 8 characters">
					<Input type="password" />
				</FormField>,
			);

			expect(
				screen.getByText("Must be at least 8 characters"),
			).toBeInTheDocument();
		});

		it("should display validation errors", () => {
			render(
				<FormField label="Email" error="Invalid email format">
					<Input type="email" />
				</FormField>,
			);

			expect(screen.getByText("Invalid email format")).toBeInTheDocument();
			expect(screen.getByRole("textbox")).toHaveClass("input-error");
		});
	});

	describe("FormError Component", () => {
		it("should render error message", () => {
			render(<FormError>Something went wrong</FormError>);
			expect(screen.getByText("Something went wrong")).toBeInTheDocument();
			expect(screen.getByRole("alert")).toBeInTheDocument();
		});

		it("should not render when no error", () => {
			render(<FormError />);
			expect(screen.queryByRole("alert")).not.toBeInTheDocument();
		});
	});

	describe("FormSubmit Component", () => {
		it("should render submit button", () => {
			render(<FormSubmit>Save Changes</FormSubmit>);
			expect(
				screen.getByRole("button", { name: "Save Changes" }),
			).toBeInTheDocument();
			expect(screen.getByRole("button")).toHaveAttribute("type", "submit");
		});

		it("should show loading state", () => {
			render(<FormSubmit loading>Saving...</FormSubmit>);
			expect(screen.getByRole("button")).toBeDisabled();
			expect(screen.getByText("Saving...")).toBeInTheDocument();
		});

		it("should be disabled when form is invalid", () => {
			render(<FormSubmit disabled>Submit</FormSubmit>);
			expect(screen.getByRole("button")).toBeDisabled();
		});
	});

	describe("Accessibility", () => {
		it("should have proper ARIA attributes", () => {
			render(
				<Form>
					<FormField label="Email" error="Invalid email" required>
						<Input type="email" aria-describedby="email-error email-help" />
					</FormField>
					<div id="email-help">Enter your email address</div>
					<FormError id="email-error">Invalid email</FormError>
				</Form>,
			);

			const input = screen.getByLabelText("Email");
			expect(input).toHaveAttribute(
				"aria-describedby",
				"email-error email-help",
			);
			expect(input).toHaveAttribute("aria-invalid", "true");
		});

		it("should support keyboard navigation", async () => {
			render(
				<Form>
					<Input label="First Name" />
					<Input label="Last Name" />
					<Select label="Country" options={[{ value: "us", label: "USA" }]} />
					<Button type="submit">Submit</Button>
				</Form>,
			);

			// Should be able to tab through all form controls
			await userEvent.tab();
			expect(screen.getByLabelText("First Name")).toHaveFocus();

			await userEvent.tab();
			expect(screen.getByLabelText("Last Name")).toHaveFocus();

			await userEvent.tab();
			expect(screen.getByLabelText("Country")).toHaveFocus();

			await userEvent.tab();
			expect(screen.getByRole("button", { name: "Submit" })).toHaveFocus();
		});

		it("should announce validation errors to screen readers", async () => {
			render(
				<Form>
					<Input label="Email" required />
					<Button type="submit">Submit</Button>
				</Form>,
			);

			await userEvent.click(screen.getByRole("button", { name: "Submit" }));

			const errorMessage = screen.getByRole("alert");
			expect(errorMessage).toBeInTheDocument();
			expect(errorMessage).toHaveTextContent("This field is required");
		});
	});

	describe("Performance", () => {
		it("should not re-render unnecessarily", () => {
			const renderSpy = vi.fn();
			const MemoizedInput = React.memo(() => {
				renderSpy();
				return <Input label="Optimized Input" />;
			});

			const { rerender } = render(
				<Form>
					<MemoizedInput />
					<Input label="Other Input" />
				</Form>,
			);

			expect(renderSpy).toHaveBeenCalledTimes(1);

			// Re-render with same props
			rerender(
				<Form>
					<MemoizedInput />
					<Input label="Other Input" />
				</Form>,
			);

			expect(renderSpy).toHaveBeenCalledTimes(1); // Should not re-render
		});

		it("should debounce validation", async () => {
			const validateSpy = vi.fn();
			render(
				<Input label="Username" validate={validateSpy} debounceMs={200} />,
			);

			const input = screen.getByLabelText("Username");
			await userEvent.type(input, "user");

			// Should not validate immediately
			expect(validateSpy).not.toHaveBeenCalled();

			// Should validate after debounce period
			await waitFor(
				() => {
					expect(validateSpy).toHaveBeenCalledTimes(1);
				},
				{ timeout: 300 },
			);
		});
	});
});
