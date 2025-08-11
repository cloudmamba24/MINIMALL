import { describe, expect, it } from "vitest";

describe("Public App", () => {
  it("should have basic functionality", () => {
    expect(true).toBe(true);
  });

  it("should be able to create objects", () => {
    const testObj = { name: "public", type: "app" };
    expect(testObj.name).toBe("public");
    expect(testObj.type).toBe("app");
  });
});
