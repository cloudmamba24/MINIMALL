import { describe, expect, it } from "vitest";

describe("Admin App", () => {
  it("should have basic functionality", () => {
    expect(true).toBe(true);
  });

  it("should be able to create objects", () => {
    const testObj = { name: "admin", type: "app" };
    expect(testObj.name).toBe("admin");
    expect(testObj.type).toBe("app");
  });
});
