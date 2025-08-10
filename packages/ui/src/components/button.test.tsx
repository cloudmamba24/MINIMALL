import { describe, expect, it } from "vitest";
import { renderWithTheme, screen } from "../test-utils";
import { Button } from "./button";

describe("Button", () => {
  it("should render with default props", () => {
    renderWithTheme(<Button>Click me</Button>);

    const button = screen.getByRole("button", { name: "Click me" });
    expect(button).toBeInTheDocument();
    expect(button).toHaveClass("inline-flex"); // Assuming this is part of the default styles
  });

  it("should render with custom variant", () => {
    renderWithTheme(<Button variant="outline">Outline Button</Button>);

    const button = screen.getByRole("button", { name: "Outline Button" });
    expect(button).toBeInTheDocument();
  });

  it("should render with custom size", () => {
    renderWithTheme(<Button size="lg">Large Button</Button>);

    const button = screen.getByRole("button", { name: "Large Button" });
    expect(button).toBeInTheDocument();
  });

  it("should handle disabled state", () => {
    renderWithTheme(<Button disabled>Disabled Button</Button>);

    const button = screen.getByRole("button", { name: "Disabled Button" });
    expect(button).toBeDisabled();
  });

  it("should handle click events", async () => {
    const handleClick = vi.fn();
    const { user } = renderWithTheme(<Button onClick={handleClick}>Clickable</Button>);

    const button = screen.getByRole("button", { name: "Clickable" });
    await user.click(button);

    expect(handleClick).toHaveBeenCalledOnce();
  });

  it("should not call onClick when disabled", async () => {
    const handleClick = vi.fn();
    const { user } = renderWithTheme(
      <Button onClick={handleClick} disabled>
        Disabled
      </Button>
    );

    const button = screen.getByRole("button", { name: "Disabled" });
    await user.click(button);

    expect(handleClick).not.toHaveBeenCalled();
  });

  it("should render children correctly", () => {
    renderWithTheme(<Button>Test Button</Button>);

    const button = screen.getByRole("button", { name: "Test Button" });
    expect(button).toBeInTheDocument();
    expect(button).toHaveTextContent("Test Button");
  });

  it("should apply custom className", () => {
    renderWithTheme(<Button className="custom-class">Custom</Button>);

    const button = screen.getByRole("button", { name: "Custom" });
    expect(button).toHaveClass("custom-class");
  });
});
